import { it, expect, afterEach } from "vitest";
import { mkdtempSync, readdirSync, readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  EditorSession,
  HealthResponse,
  DossierBundleV1,
} from "@recon/contracts";
import { replayDossier } from "@recon/core";
import { createHostedApp } from "../../apps/server/src/hosted-app.js";
const origin = "https://recon.example",
  baseHeaders = { host: "recon.example", origin };
type App = Awaited<ReturnType<typeof createHostedApp>>;
const cleanup: Array<() => unknown> = [];
afterEach(async () => {
  for (const fn of cleanup.splice(0).reverse()) await fn();
});
async function setup(
  options: { maxOpen?: number; maxWorkspaces?: number } = {},
) {
  const directory = mkdtempSync(resolve("artifacts/tmp/hosted-")),
    app = await createHostedApp({
      publicOrigin: origin,
      directory,
      ui: false,
      ...options,
    });
  cleanup.push(() => app.close());
  return { app, directory };
}
async function session(app: App) {
  const response = await app.inject({
    url: "/api/v1/editor-session",
    headers: baseHeaders,
  });
  expect(response.statusCode, response.body).toBe(200);
  const cookie = String(response.headers["set-cookie"]).split(";")[0]!,
    data = EditorSession.parse(response.json());
  expect(response.headers["set-cookie"]).toContain("HttpOnly");
  expect(response.headers["set-cookie"]).toContain("SameSite=Strict");
  expect(response.headers["set-cookie"]).toContain("Secure");
  return {
    cookie,
    headers: { ...baseHeaders, cookie, "x-recon-csrf": data.csrfToken },
  };
}
const importBody = () => ({
  requestId: randomUUID(),
  actor: {
    name: "Browser researcher",
    qualification: "Unreviewed software test",
    mode: "draft",
  },
  title: "Private source",
  text: "Take garlic and honey. Mix carefully.",
  language: "en",
  creator: "Test author",
  edition: "Private test passage",
  rightsDeclaration: "local_research_only",
  rightsRationale: "Software integration fixture",
  kind: "recipe",
});
it("allocates no workspace for public reads or health and isolates authentic editing, imports and identifiers between browsers", async () => {
  const { app, directory } = await setup();
  const health = await app.inject({
    url: "/api/v1/health",
    headers: baseHeaders,
  });
  expect(HealthResponse.parse(health.json()).mode).toBe("hosted_workspace");
  await app.inject({ url: "/api/v1/cases", headers: baseHeaders });
  expect(
    readdirSync(directory).filter((f) => f.endsWith(".sqlite")),
  ).toHaveLength(0);
  const a = await session(app),
    b = await session(app);
  expect(a.cookie).not.toBe(b.cookie);
  const imported = await app.inject({
    method: "POST",
    url: "/api/v1/imports/text",
    headers: a.headers,
    payload: importBody(),
  });
  expect(imported.statusCode, imported.body).toBe(200);
  const id = imported.json().result.case.id;
  const own = await app.inject({
    url: `/api/v1/cases/${id}`,
    headers: a.headers,
  });
  expect(own.statusCode).toBe(200);
  expect(
    own.json().sources.find((s: { kind: string }) => s.kind === "user_text")
      .canonicalUrl,
  ).toMatch(/^https:\/\/recon\.example/);
  for (const headers of [b.headers, baseHeaders])
    expect(
      (await app.inject({ url: `/api/v1/cases/${id}`, headers })).statusCode,
    ).toBe(404);
  expect(
    (await app.inject({ url: "/api/v1/cases", headers: a.headers })).json()
      .total,
  ).toBe(3);
  expect(
    (await app.inject({ url: "/api/v1/cases", headers: b.headers })).json()
      .total,
  ).toBe(2);
});
it("retains private source and frozen dossier across process-equivalent app restart, and prevents another browser's access", async () => {
  const { app, directory } = await setup(),
    a = await session(app),
    b = await session(app);
  const domain = (
    await app.inject({
      url: "/api/v1/cases/balds-eyesalve/interpretation-domain",
      headers: a.headers,
    })
  ).json();
  const evaluated = await app.inject({
    method: "POST",
    url: "/api/v1/cases/balds-eyesalve/scenario-evaluate",
    headers: a.headers,
    payload: {
      context: domain.context,
      scenario: {
        assignments: [
          { occurrenceId: "slot-cropleek", candidateId: "candidate-onion" },
        ],
        hypotheticalOverrides: [],
        rationale: "Documented conditional reading for deployment test.",
      },
      evidenceUnitIds: ["eu-2020-eso-newman"],
    },
  });
  expect(evaluated.statusCode, evaluated.body).toBe(200);
  const frozen = await app.inject({
    method: "POST",
    url: "/api/v1/analyses",
    headers: a.headers,
    payload: {
      requestId: randomUUID(),
      name: "Private frozen record",
      runHash: evaluated.json().runHash,
    },
  });
  expect(frozen.statusCode, frozen.body).toBe(200);
  const id = frozen.json().id,
    url = `/api/v1/analyses/${id}/export?format=json`,
    exported = await app.inject({ url, headers: a.headers });
  const bundle = DossierBundleV1.parse(exported.json());
  expect(replayDossier(bundle).scientificResultHash).toBe(
    bundle.scientificResultHash,
  );
  expect(exported.headers["content-disposition"]).toContain(".json");
  expect((await app.inject({ url, headers: b.headers })).statusCode).toBe(404);
  const secret = readFileSync(
    resolve(directory, "workspace-secret.key"),
  ).toString("hex");
  await app.close();
  const restarted = await createHostedApp({
    publicOrigin: origin,
    directory,
    ui: false,
  });
  cleanup.push(() => restarted.close());
  expect(
    readFileSync(resolve(directory, "workspace-secret.key")).toString("hex"),
  ).toBe(secret);
  const restored = await restarted.inject({
    url,
    headers: { ...baseHeaders, cookie: a.cookie },
  });
  expect(restored.statusCode, restored.body).toBe(200);
  expect(restored.json().scientificResultHash).toBe(
    bundle.scientificResultHash,
  );
});
it("rejects hostile hosts, cross-origin writes, forged workspace cookies, duplicate cookies and CSRF from another workspace", async () => {
  const { app } = await setup(),
    a = await session(app),
    b = await session(app);
  expect(
    (
      await app.inject({
        url: "/api/v1/health",
        headers: {
          ...baseHeaders,
          host: "evil.example",
          "x-forwarded-host": "recon.example",
        },
      })
    ).statusCode,
  ).toBe(403);
  for (const origin of ["http://recon.example", "https://evil.example", "null"])
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/imports/text",
          headers: { ...a.headers, origin },
          payload: importBody(),
        })
      ).statusCode,
    ).toBe(403);
  expect(
    (
      await app.inject({
        url: "/api/v1/editor-session",
        headers: { ...baseHeaders, "sec-fetch-site": "cross-site" },
      })
    ).statusCode,
  ).toBe(403);
  const changed = a.cookie.slice(0, -1) + (a.cookie.endsWith("0") ? "1" : "0");
  expect(
    (
      await app.inject({
        url: "/api/v1/cases",
        headers: { ...baseHeaders, cookie: changed },
      })
    ).statusCode,
  ).toBe(401);
  expect(
    (
      await app.inject({
        url: "/api/v1/cases",
        headers: { ...baseHeaders, cookie: `${a.cookie}; ${a.cookie}` },
      })
    ).statusCode,
  ).toBe(401);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/v1/imports/text",
        headers: { ...a.headers, "x-recon-csrf": b.headers["x-recon-csrf"] },
        payload: importBody(),
      })
    ).statusCode,
  ).toBe(403);
});
it("preserves strict JSON and request bounds, reopens evicted workspaces, and refuses capacity overflow without deleting existing work", async () => {
  const { app, directory } = await setup({ maxOpen: 1, maxWorkspaces: 2 }),
    a = await session(app),
    b = await session(app);
  expect(
    (await app.inject({ url: "/api/v1/cases", headers: a.headers })).statusCode,
  ).toBe(200);
  const refreshed = await app.inject({
    url: "/api/v1/editor-session",
    headers: a.headers,
  });
  const headers = {
    ...a.headers,
    "content-type": "application/json",
    "x-recon-csrf": refreshed.json().csrfToken,
  };
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/v1/imports/text",
        headers,
        payload: '{"a":1,"a":2}',
      })
    ).statusCode,
  ).toBe(400);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/v1/imports/text",
        headers,
        payload: "x".repeat(2_000_001),
      })
    ).statusCode,
  ).toBe(413);
  const limited = await app.inject({
    url: "/api/v1/editor-session",
    headers: baseHeaders,
  });
  expect(limited.statusCode).toBe(503);
  expect(limited.json().error.code).toBe("WORKSPACE_CAPACITY");
  expect(
    readdirSync(directory).filter((f) => f.endsWith(".sqlite")),
  ).toHaveLength(2);
  expect(
    (await app.inject({ url: "/api/v1/cases", headers: b.headers })).statusCode,
  ).toBe(200);
});
it("backs up live SQLite databases consistently, restores access with the signing key, and refuses to replace a missing key over existing data", async () => {
  const { app, directory } = await setup(),
    a = await session(app);
  const imported = await app.inject({
    method: "POST",
    url: "/api/v1/imports/text",
    headers: a.headers,
    payload: importBody(),
  });
  expect(imported.statusCode, imported.body).toBe(200);
  const id = imported.json().result.case.id,
    backup = resolve(directory, "..", `backup-${randomUUID()}`);
  const output = execFileSync(
    process.execPath,
    ["tools/backup-hosted-workspaces.mjs", directory, backup],
    { encoding: "utf8", windowsHide: true, timeout: 10000 },
  );
  expect(JSON.parse(output).databases).toBe(1);
  const restored = await createHostedApp({
    publicOrigin: origin,
    directory: backup,
    ui: false,
  });
  cleanup.push(() => restored.close());
  expect(
    (await restored.inject({ url: `/api/v1/cases/${id}`, headers: a.headers }))
      .statusCode,
  ).toBe(200);
  await app.close();
  unlinkSync(resolve(directory, "workspace-secret.key"));
  await expect(
    createHostedApp({ publicOrigin: origin, directory, ui: false }),
  ).rejects.toThrow("WORKSPACE_SECRET_MISSING_RESTORE_BACKUP");
});
