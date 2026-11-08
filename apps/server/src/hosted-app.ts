import Fastify, { type HTTPMethods } from "fastify";
import { ErrorResponse, HealthResponse } from "@recon/contracts";
import { createApp } from "./app.js";
import { WorkspaceStore } from "./workspace-store.js";
import { normalizePublicOrigin } from "./request-origin.js";
import { WorkspaceError } from "./errors.js";

export async function createHostedApp(options: {
  publicOrigin: string;
  directory: string;
  ui?: boolean;
  liveTaxonomy?: boolean;
  logger?: boolean;
  maxOpen?: number;
  maxWorkspaces?: number;
  maxBytes?: number;
}) {
  const origin = normalizePublicOrigin(options.publicOrigin),
    secure = origin.startsWith("https:"),
    host = new URL(origin).host;
  const app = Fastify({
    bodyLimit: 2_000_000,
    requestTimeout: 15000,
    connectionTimeout: 10000,
    logger: options.logger
      ? {
          serializers: {
            req: (req) => ({
              method: req.method,
              url: req.url.split("?")[0] ?? "/",
              hostname: req.hostname,
            }),
          },
          redact: [
            "req.headers.cookie",
            "req.headers.authorization",
            "res.headers.set-cookie",
          ],
        }
      : false,
  });
  const store = new WorkspaceStore({ ...options, publicOrigin: origin });
  const publicApp = await createApp({
    databasePath: ":memory:",
    publicOrigin: origin,
    editor: false,
    liveTaxonomy: false,
    ui: options.ui ?? true,
  });
  await publicApp.ready();
  const cookieName = secure ? "__Host-recon-workspace" : "recon-workspace";
  const cookie = (token: string) =>
    `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000${secure ? "; Secure" : ""}`;
  const failure = (
    code: string,
    message: string,
    statusCode: number,
    id: string,
  ) =>
    ErrorResponse.parse({
      error: {
        code,
        message,
        retryable: statusCode >= 500 || statusCode === 429,
        requestId: id,
      },
    });
  let traffic = { start: Date.now(), count: 0 };
  app.addHook("onRequest", async (req, reply) => {
    reply
      .header("Cache-Control", "no-store")
      .header("X-Content-Type-Options", "nosniff")
      .header("Referrer-Policy", "no-referrer")
      .header("X-Frame-Options", "DENY");
    if (secure) reply.header("Strict-Transport-Security", "max-age=31536000");
    if (req.headers.host?.toLowerCase() !== host)
      return reply
        .code(403)
        .send(
          failure(
            "HOST_NOT_ALLOWED",
            "The requested host is not configured for this application.",
            403,
            req.id,
          ),
        );
    if (req.headers.origin && req.headers.origin !== origin)
      return reply
        .code(403)
        .send(
          failure(
            "ORIGIN_REJECTED",
            "Use the application's own origin for this request.",
            403,
            req.id,
          ),
        );
    if (
      req.url.startsWith("/api/") &&
      req.headers["sec-fetch-site"] === "cross-site"
    )
      return reply
        .code(403)
        .send(
          failure(
            "ORIGIN_REJECTED",
            "Cross-site API requests are not allowed.",
            403,
            req.id,
          ),
        );
    if (!["GET", "HEAD"].includes(req.method) && req.headers.origin !== origin)
      return reply
        .code(403)
        .send(
          failure(
            "ORIGIN_REJECTED",
            "A same-origin request is required.",
            403,
            req.id,
          ),
        );
    if (Date.now() - traffic.start >= 60_000)
      traffic = { start: Date.now(), count: 0 };
    if (++traffic.count > 1800)
      return reply
        .code(429)
        .header("Retry-After", "60")
        .send(
          failure(
            "RATE_LIMITED",
            "The server is temporarily rate-limited. Retry in a minute.",
            429,
            req.id,
          ),
        );
  });
  // Preserve raw bytes: each existing API retains its strict JSON parser/size limit.
  app.removeAllContentTypeParsers();
  app.addContentTypeParser("*", { parseAs: "buffer" }, (_req, body, done) =>
    done(null, body),
  );
  app.setErrorHandler((error, req, reply) => {
    const status =
      error instanceof WorkspaceError
        ? error.statusCode
        : error instanceof Error &&
            "statusCode" in error &&
            typeof error.statusCode === "number" &&
            error.statusCode >= 400 &&
            error.statusCode < 500
          ? error.statusCode
          : 500;
    const message =
      error instanceof WorkspaceError
        ? error.message
        : status === 413
          ? "Request exceeds the size limit."
          : "The server could not complete this request.";
    if (status === 503 || status === 429) reply.header("Retry-After", "60");
    return reply
      .code(status)
      .send(
        failure(
          error instanceof WorkspaceError ? error.code : "REQUEST_FAILED",
          message,
          status,
          req.id,
        ),
      );
  });
  app.all("/*", async (req, reply) => {
    const path = req.url.split("?")[0]!,
      api = path.startsWith("/api/"),
      health = path === "/api/v1/health";
    const values = (req.headers.cookie ?? "")
      .split(";")
      .map((v) => v.trim())
      .filter((v) => v.startsWith(cookieName + "="));
    if (values.length > 1 && api && !health)
      throw new WorkspaceError(
        "WORKSPACE_TOKEN_INVALID",
        "Ambiguous private workspace cookie.",
        401,
      );
    const token = values[0]?.slice(cookieName.length + 1);
    let lease: Awaited<ReturnType<WorkspaceStore["acquire"]>> | undefined;
    try {
      let target = publicApp;
      if (api && !health) {
        const needsWorkspace =
          !["GET", "HEAD"].includes(req.method) ||
          [
            "/api/v1/editor-session",
            "/api/v1/literature/search",
            "/api/v1/taxonomy/candidates",
          ].includes(path);
        if (token) lease = await store.acquire(store.verify(token));
        else if (needsWorkspace) {
          const created = await store.create();
          lease = created;
          reply.header("Set-Cookie", cookie(created.token));
        }
        if (lease) target = lease.app;
      }
      const response = await target.inject({
        method: req.method as HTTPMethods,
        url: req.url,
        headers: req.headers,
        ...(req.body !== undefined ? { payload: req.body as Buffer } : {}),
      });
      for (const [key, value] of Object.entries(response.headers))
        if (
          value !== undefined &&
          ![
            "connection",
            "keep-alive",
            "transfer-encoding",
            "set-cookie",
            "content-length",
          ].includes(key.toLowerCase())
        )
          reply.header(key, value);
      if (health && response.statusCode === 200) {
        store.assertStorage();
        const result = HealthResponse.parse(response.json());
        return reply.code(200).send(
          HealthResponse.parse({
            ...result,
            mode: "hosted_workspace",
            capabilities: {
              ...result.capabilities,
              editing: true,
              liveProviders: options.liveTaxonomy ?? false,
            },
          }),
        );
      }
      return reply.code(response.statusCode).send(response.rawPayload);
    } finally {
      lease?.release();
    }
  });
  app.addHook("onClose", async () => {
    await store.close();
    await publicApp.close();
  });
  return app;
}
