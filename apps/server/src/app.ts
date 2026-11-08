import { transportSchema } from "./transport-schema.js";
import { registerTraceRoutes } from "./trace-routes.js";
import { registerVerificationRoutes } from "./verification-routes.js";
import { registerOutcomeRoutes } from "./outcome-routes.js";
// Server factory adapted from fastify-vite's MIT vanilla TypeScript SPA example.
import Fastify from "fastify";
import FastifyVite from "@fastify/vite";
import { resolve } from "node:path";
import type Database from "better-sqlite3";
import { z } from "zod";
import {
  CaseListResponse,
  CaseResponse,
  ErrorResponse,
  HealthResponse,
  Id,
  SourceResponse,
  type CorpusData,
} from "@recon/contracts";
import { parseJsonStrict } from "@recon/core";
import { registerCurationRoutes } from "./curation-routes.js";
import { WorkspaceError } from "./errors.js";
import { normalizePublicOrigin } from "./request-origin.js";
import {
  loadCorpus,
  migrate,
  openDatabase,
  readCorpus,
  ROOT,
  seed,
} from "./database.js";
import {
  canDisplay,
  filterRevision,
  getCase,
  listCases,
} from "./repository.js";

const jsonSchema = (schema: z.ZodType) => transportSchema(schema);
export async function createApp(
  options: {
    dev?: boolean;
    ui?: boolean;
    db?: Database.Database;
    corpus?: CorpusData;
    logger?: boolean;
    databasePath?: string;
    editor?: boolean;
    liveTaxonomy?: boolean;
    fetcher?: typeof fetch;
    publicOrigin?: string;
  } = {},
) {
  const publicOrigin = options.publicOrigin
    ? normalizePublicOrigin(options.publicOrigin)
    : undefined;
  const app = Fastify({
    logger: options.logger ?? false,
    bodyLimit: 2_000_000,
    requestTimeout: 10000,
    connectionTimeout: 10000,
    ajv: { customOptions: { removeAdditional: false } },
  });
  const ownsDb = !options.db;
  const db =
    options.db ??
    openDatabase(
      options.databasePath ?? resolve(ROOT, "data/local/recon.sqlite"),
    );
  try {
    migrate(db);
    seed(db, options.corpus ?? loadCorpus());
  } catch (e) {
    if (ownsDb) db.close();
    throw e;
  }
  const getData = () => readCorpus(db);
  registerTraceRoutes(app);
  registerVerificationRoutes(app);
  registerOutcomeRoutes(app);
  app.addHook("onClose", async () => {
    if (ownsDb) db.close();
  });
  app.removeContentTypeParser("application/json");
  app.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (req, body, done) => {
      try {
        done(
          null,
          parseJsonStrict(
            body as string,
            req.routeOptions.bodyLimit ?? 2_000_000,
          ),
        );
      } catch {
        const error = Object.assign(new Error("Malformed JSON request."), {
          statusCode: 400,
          code: "INVALID_JSON",
        });
        done(error);
      }
    },
  );
  app.addHook("onRequest", async (req, reply) => {
    const host = req.hostname;
    if (
      publicOrigin
        ? req.headers.host?.toLowerCase() !== new URL(publicOrigin).host
        : !["localhost", "127.0.0.1", "[::1]"].includes(host)
    )
      return reply.code(403).send({
        error: {
          code: "HOST_NOT_ALLOWED",
          message: "The requested host is not configured for this workspace.",
          retryable: false,
          requestId: req.id,
        },
      });
  });
  app.addHook("onSend", async (req, reply) => {
    reply
      .header("X-Content-Type-Options", "nosniff")
      .header("Referrer-Policy", "no-referrer")
      .header("X-Frame-Options", "DENY");
    if (req.url.startsWith("/api")) reply.header("Cache-Control", "no-store");
    if (!options.dev)
      reply.header(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      );
  });
  app.setErrorHandler((err, req, reply) => {
    const e = err as {
      statusCode?: number;
      code?: string;
      validation?: unknown;
    };
    const status =
      e.statusCode && e.statusCode >= 400 && e.statusCode < 500
        ? e.statusCode
        : 500;
    const message =
      status === 500
        ? "The workspace could not complete this request."
        : e.validation
          ? "Request parameters are invalid."
          : status === 413
            ? "Request exceeds the size limit."
            : err instanceof WorkspaceError
              ? err.message
              : "The request could not be processed.";
    if (status === 500) req.log.error(err);
    reply.code(status).send(
      ErrorResponse.parse({
        error: {
          code: e.validation
            ? "VALIDATION_ERROR"
            : (e.code ?? "INTERNAL_ERROR"),
          message,
          retryable: status >= 500,
          requestId: req.id,
        },
      }),
    );
  });
  const error = {
    400: jsonSchema(ErrorResponse),
    404: jsonSchema(ErrorResponse),
    500: jsonSchema(ErrorResponse),
  };
  const missing = (requestId: string) => ({
    error: {
      code: "NOT_FOUND",
      message: "No record matches this identifier and revision.",
      retryable: false,
      requestId,
    },
  });
  app.get(
    "/api/v1/health",
    { schema: { response: { 200: jsonSchema(HealthResponse), ...error } } },
    async () =>
      HealthResponse.parse({
        schemaVersion: "recon-v1",
        status: "ok",
        runtime: `Node ${process.versions.node}`,
        migration: (
          db
            .prepare("SELECT MAX(version) AS n FROM schema_migrations")
            .get() as { n: number }
        ).n,
        corpusRevision: getData().revision,
        mode: options.editor === false ? "local_read_only" : "local_editor",
        capabilities: {
          sourceReader: true,
          editing: options.editor !== false,
          comparison: true,
          liveProviders: options.liveTaxonomy !== false,
        },
      }),
  );
  app.get<{ Querystring: { offset?: number; limit?: number } }>(
    "/api/v1/cases",
    {
      schema: {
        querystring: jsonSchema(
          z.strictObject({
            offset: z.number().int().min(0).default(0),
            limit: z.number().int().min(1).max(50).default(20),
          }),
        ),
        response: { 200: jsonSchema(CaseListResponse), ...error },
      },
    },
    async (req) =>
      CaseListResponse.parse(
        listCases(getData(), req.query.offset ?? 0, req.query.limit ?? 20),
      ),
  );
  app.get<{ Params: { id: string }; Querystring: { revision?: number } }>(
    "/api/v1/cases/:id",
    {
      schema: {
        params: jsonSchema(z.strictObject({ id: Id })),
        querystring: jsonSchema(
          z.strictObject({ revision: z.number().int().positive().optional() }),
        ),
        response: { 200: jsonSchema(CaseResponse), ...error },
      },
    },
    async (req, reply) => {
      const result = getCase(getData(), req.params.id, req.query.revision);
      return result
        ? CaseResponse.parse(result)
        : reply.code(404).send(missing(req.id));
    },
  );
  app.get<{ Params: { id: string; revision: number } }>(
    "/api/v1/sources/:id/revisions/:revision",
    {
      schema: {
        params: jsonSchema(
          z.strictObject({ id: Id, revision: z.number().int().positive() }),
        ),
        response: { 200: jsonSchema(SourceResponse), ...error },
      },
    },
    async (req, reply) => {
      const data = getData();
      const source = data.sources.find((s) => s.id === req.params.id);
      const revision = data.sourceRevisions.find(
        (r) =>
          r.sourceId === req.params.id && r.revision === req.params.revision,
      );
      return source && revision
        ? SourceResponse.parse({
            schemaVersion: "recon-v1",
            source,
            revision: filterRevision(revision),
            spans: canDisplay(revision)
              ? data.spans.filter((s) => s.sourceRevisionId === revision.id)
              : [],
            contentAvailable: canDisplay(revision),
          })
        : reply.code(404).send(missing(req.id));
    },
  );
  registerCurationRoutes(app, db, {
    editor: options.editor !== false,
    liveTaxonomy: options.liveTaxonomy !== false,
    ...(options.fetcher ? { fetcher: options.fetcher } : {}),
    ...(publicOrigin ? { publicOrigin } : {}),
  });
  app.all("/api/*", async (req, reply) =>
    reply.code(404).send(missing(req.id)),
  );
  if (options.ui !== false) {
    await app.register(FastifyVite, {
      root: resolve(ROOT, "apps/web"),
      dev: options.dev ?? false,
      spa: true,
    });
    app.get("/", (_req, reply) => reply.html());
    await app.vite.ready();
  }
  app.setNotFoundHandler((req, reply) => {
    if (
      req.url.startsWith("/api") ||
      options.ui === false ||
      /\.[a-z0-9]+(?:\?|$)/i.test(req.url)
    )
      return reply.code(404).send(missing(req.id));
    return reply.html();
  });
  return app;
}
