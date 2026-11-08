import { afterEach, describe, expect, it } from "vitest";
import {
  CaseListResponse,
  CaseResponse,
  ErrorResponse,
  HealthResponse,
  SourceResponse,
} from "@recon/contracts";
import { contentHash, scientificHash } from "@recon/core";
import { createApp } from "../../apps/server/src/app.js";
import {
  loadCorpus,
  migrate,
  openDatabase,
  seed,
} from "../../apps/server/src/database.js";
import { getCase } from "../../apps/server/src/repository.js";
const resources: Array<() => void | Promise<void>> = [];
afterEach(async () => {
  for (const close of resources.splice(0).reverse()) await close();
});
const db = () => {
  const d = openDatabase(":memory:");
  resources.push(() => {
    d.close();
  });
  return d;
};
describe("migrations and immutable seeding", () => {
  it("migrates empty and previous schemas and seeds twice without duplicates", () => {
    const d = db();
    migrate(d, 1);
    expect(
      d.prepare("SELECT MAX(version) AS n FROM schema_migrations").get(),
    ).toEqual({ n: 1 });
    migrate(d);
    migrate(d);
    const data = loadCorpus();
    seed(d, data);
    seed(d, data);
    expect(d.prepare("SELECT COUNT(*) AS n FROM evidence_units").get()).toEqual(
      { n: 14 },
    );
    expect(d.prepare("SELECT COUNT(*) AS n FROM case_revisions").get()).toEqual(
      { n: 2 },
    );
    expect(d.pragma("foreign_key_check")).toEqual([]);
    expect(d.pragma("foreign_keys", { simple: true })).toBe(1);
    expect(d.prepare("SELECT COUNT(*) AS n FROM audit_events").get()).toEqual({
      n: 1,
    });
  });
  it("refuses overwrites and corpus revision conflicts", () => {
    const d = db();
    migrate(d);
    const data = loadCorpus();
    seed(d, data);
    expect(() =>
      d.prepare("UPDATE source_revisions SET payload=payload").run(),
    ).toThrow("immutable");
    expect(() => d.prepare("DELETE FROM case_revisions").run()).toThrow(
      "immutable",
    );
    const changed = structuredClone(data);
    changed.cases[0]!.title += " edit";
    changed.cases[0]!.contentHash = contentHash(changed.cases[0]!);
    expect(() => seed(d, changed)).toThrow("CORPUS_REVISION_CONFLICT");
    expect(
      d.prepare("SELECT COUNT(*) AS n FROM corpus_revisions").get(),
    ).toEqual({ n: 1 });
  });
});
describe("typed read APIs", () => {
  async function app() {
    const a = await createApp({ ui: false, db: db() });
    resources.push(() => a.close());
    return a;
  }
  it("returns real health, summaries, immutable cases and source revisions", async () => {
    const a = await app();
    const health = await a.inject("/api/v1/health");
    expect(health.statusCode).toBe(200);
    expect(HealthResponse.parse(health.json()).migration).toBe(6);
    const cases = CaseListResponse.parse(
      (await a.inject("/api/v1/cases?limit=1")).json(),
    );
    expect(cases.total).toBe(2);
    expect(cases.items).toHaveLength(1);
    const c = CaseResponse.parse(
      (await a.inject("/api/v1/cases/balds-eyesalve?revision=1")).json(),
    );
    expect(c.selection).toBe("pinned");
    expect(c.case.evidenceUnitIds).toHaveLength(10);
    const r = SourceResponse.parse(
      (
        await a.inject("/api/v1/sources/cockayne-translation/revisions/1")
      ).json(),
    );
    expect(r.revision.textSha256).toBe(c.sourceRevisions[0]!.textSha256);
    expect(r.contentAvailable).toBe(true);
    expect(r.spans[0]!.exact).toContain("Work an eye salve");
  });
  it.each([
    "/api/v1/cases?limit=0",
    "/api/v1/cases?limit=51",
    "/api/v1/cases?extra=x",
    "/api/v1/cases/balds-eyesalve?revision=-1",
    "/api/v1/sources/cockayne-translation/revisions/nope",
  ])("rejects invalid requests: %s", async (path) => {
    const r = await (await app()).inject(path);
    expect(r.statusCode).toBe(400);
    expect(ErrorResponse.parse(r.json()).error.code).toBe("VALIDATION_ERROR");
  });
  it.each([
    "/api/v1/cases/missing",
    "/api/v1/cases/balds-eyesalve?revision=999",
    "/api/v1/sources/missing/revisions/1",
    "/api/v1/not-implemented",
    "/api",
  ])("returns JSON 404 without a SPA fallback: %s", async (path) => {
    const r = await (await app()).inject(path);
    expect(r.statusCode).toBe(404);
    expect(r.headers["content-type"]).toContain("application/json");
    expect(ErrorResponse.parse(r.json()).error.retryable).toBe(false);
  });
  it("rejects duplicate JSON keys, malformed JSON and oversized bodies", async () => {
    const a = await app();
    for (const payload of ['{"x":1,"\\u0078":2}', '{"x":1,}']) {
      const r = await a.inject({
        method: "POST",
        url: "/api/v1/not-implemented",
        headers: { "content-type": "application/json" },
        payload,
      });
      expect(r.statusCode).toBe(400);
    }
    const large = await a.inject({
      method: "POST",
      url: "/api/v1/not-implemented",
      headers: { "content-type": "application/json" },
      payload: '"' + "x".repeat(2_000_001) + '"',
    });
    expect(large.statusCode).toBe(413);
  });
  it("applies rights filtering to every source and assertion read path", async () => {
    const data = loadCorpus();
    const r = data.sourceRevisions[0]!;
    r.rights.decision = "metadata_only";
    r.rights.display = false;
    r.rights.redistribution = false;
    r.contentHash = contentHash(r);
    const a = await createApp({ ui: false, db: db(), corpus: data });
    resources.push(() => a.close());
    const source = SourceResponse.parse(
      (
        await a.inject("/api/v1/sources/cockayne-translation/revisions/1")
      ).json(),
    );
    expect(source.contentAvailable).toBe(false);
    expect(source.revision.displayText).toBe("");
    expect(source.spans).toEqual([]);
    const c = getCase(data, "balds-eyesalve")!;
    expect(c.sourceRevisions[0]!.displayText).toBe("");
    expect(c.spans.every((s) => s.sourceRevisionId !== r.id)).toBe(true);
    expect(c.assertions.some((a) => a.id === "a-eyesalve-description")).toBe(
      false,
    );
  });
  it("rejects hostile hosts and source path traversal, and emits browser safety headers", async () => {
    const a = await app();
    const hostile = await a.inject({
      url: "/api/v1/health",
      headers: { host: "attacker.example" },
    });
    expect(hostile.statusCode).toBe(403);
    const traversal = await a.inject(
      "/api/v1/sources/..%2F..%2Fsecret/revisions/1",
    );
    expect([400, 404]).toContain(traversal.statusCode);
    const r = await a.inject("/api/v1/health");
    expect(r.headers["x-content-type-options"]).toBe("nosniff");
    expect(r.headers["cache-control"]).toBe("no-store");
    expect(r.headers["access-control-allow-origin"]).toBeUndefined();
    expect(scientificHash(r.json())).toHaveLength(64);
  });
});
