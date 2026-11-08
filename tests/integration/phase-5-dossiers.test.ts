import { it, expect, afterEach } from "vitest";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
import "@citation-js/plugin-ris";
import { createApp } from "../../apps/server/src/app.js";
import {
  loadCorpus,
  openDatabase,
  readCorpus,
} from "../../apps/server/src/database.js";
import {
  DossierBundleV1,
  EditorSession,
  InterpretationDomain,
} from "@recon/contracts";
import { replayDossier, scientificHash } from "@recon/core";
const cleanup: Array<() => unknown> = [];
afterEach(async () => {
  for (const fn of cleanup.splice(0).reverse()) await fn();
});
async function fixture() {
  const db = openDatabase(":memory:");
  cleanup.push(() => db.close());
  const app = await createApp({ db, ui: false, liveTaxonomy: false });
  cleanup.push(() => app.close());
  const s = EditorSession.parse(
      (await app.inject("/api/v1/editor-session")).json(),
    ),
    headers = { origin: "http://localhost", "x-recon-csrf": s.csrfToken };
  const post = (path: string, payload: unknown) =>
    app.inject({
      method: "POST",
      url: `/api/v1${path}`,
      headers,
      payload: payload as Record<string, unknown>,
    });
  const domain = InterpretationDomain.parse(
    (
      await app.inject("/api/v1/cases/balds-eyesalve/interpretation-domain")
    ).json(),
  );
  const scenario = {
    assignments: [
      { occurrenceId: "slot-cropleek", candidateId: "candidate-onion" },
    ],
    hypotheticalOverrides: [],
    rationale: "Authentic source-backed draft interpretation.",
  };
  const evaluated = await post("/cases/balds-eyesalve/scenario-evaluate", {
    context: domain.context,
    scenario,
    evidenceUnitIds: ["eu-2020-eso-newman", "eu-2020-esl-newman"],
  });
  expect(evaluated.statusCode, evaluated.body).toBe(200);
  const frozen = await post("/analyses", {
    requestId: randomUUID(),
    name: "Integration frozen dossier",
    runHash: evaluated.json().runHash,
  });
  expect(frozen.statusCode, frozen.body).toBe(200);
  const id = frozen.json().id;
  return { db, app, post, id };
}
it("real save → HTML/JSON → isolated preview/import → offline replay in a fresh process and fresh database", async () => {
  const f = await fixture(),
    before = scientificHash(readCorpus(f.db));
  const response = await f.app.inject(
    `/api/v1/analyses/${f.id}/export?format=json`,
  );
  expect(response.statusCode, response.body).toBe(200);
  expect(response.headers["content-disposition"]).toContain(".json");
  const b = DossierBundleV1.parse(response.json());
  const html = await f.app.inject(
    `/api/v1/analyses/${f.id}/export?format=html`,
  );
  expect(html.body).toContain("Frozen assumptions and decisions");
  expect(html.body).not.toContain("<script");
  expect(html.body).toContain(b.scientificResultHash);
  const dir = mkdtempSync(resolve("artifacts/tmp/replay-")),
    file = resolve(dir, "dossier.json");
  writeFileSync(file, response.body);
  const replay = spawnSync(
    process.execPath,
    [
      "--require",
      resolve("tools/offline-network.cjs"),
      "tools/replay-dossier.mjs",
      file,
    ],
    { encoding: "utf8", timeout: 90000, windowsHide: true },
  );
  expect(replay.status, replay.stderr).toBe(0);
  expect(JSON.parse(replay.stdout).scientificResultHash).toBe(
    b.scientificResultHash,
  );
  const fresh = openDatabase(":memory:");
  cleanup.push(() => fresh.close());
  const app = await createApp({ db: fresh, ui: false, liveTaxonomy: false });
  cleanup.push(() => app.close());
  const token = (await app.inject("/api/v1/editor-session")).json().csrfToken;
  const payload = { bundle: response.body },
    headers = { origin: "http://localhost", "x-recon-csrf": token };
  const preview = await app.inject({
    method: "POST",
    url: "/api/v1/imports/bundle/preview",
    headers,
    payload,
  });
  expect(preview.statusCode, preview.body).toBe(200);
  expect(preview.json().receipt.status).toBe("reproduced");
  const imported = await app.inject({
    method: "POST",
    url: "/api/v1/imports/bundle",
    headers,
    payload,
  });
  expect(imported.statusCode, imported.body).toBe(200);
  const loaded = (
    await app.inject(`/api/v1/imports/${imported.json().id}`)
  ).json();
  expect(loaded.bundle.scientificResultHash).toBe(b.scientificResultHash);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/v1/imports/bundle",
        headers,
        payload,
      })
    ).json().id,
  ).toBe(imported.json().id);
  expect(
    fresh.prepare("SELECT count(*) AS n FROM case_revisions").get(),
  ).toEqual({ n: 2 });
  expect(scientificHash(readCorpus(f.db))).toBe(before);
  expect(replayDossier(loaded.bundle).status).toBe("reproduced");
  expect(() => fresh.prepare("DELETE FROM imported_dossiers").run()).toThrow();
}, 120000);
it("all three actual bibliography downloads round-trip core identifiers without any resolver request", async () => {
  const f = await fixture(),
    bundle = (await f.app.inject(`/api/v1/analyses/${f.id}/dossier`)).json();
  const expected = bundle.scientific.corpus.bibliography;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw Error("Unexpected resolver request");
  };
  try {
    for (const format of ["csl-json", "bibtex", "ris"]) {
      const response = await f.app.inject(
        `/api/v1/analyses/${f.id}/references?format=${format}`,
      );
      expect(response.statusCode, response.body).toBe(200);
      const parsed =
        format === "csl-json"
          ? JSON.parse(response.body)
          : new Cite(response.body).data;
      expect(parsed).toHaveLength(expected.length);
      for (const r of expected) {
        expect(
          parsed.some(
            (p: { title?: string }) =>
              p.title?.toLowerCase() === r.title.toLowerCase(),
          ),
          `${format}: ${r.title} / ${JSON.stringify(parsed.map((p: { title?: string }) => p.title))}`,
        ).toBe(true);
        if (r.identifiers.doi)
          expect(
            parsed.some(
              (p: { DOI?: string }) =>
                p.DOI?.toLowerCase() === r.identifiers.doi.toLowerCase(),
            ),
          ).toBe(true);
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
}, 60000);
it("rejects tampered bundles, raw duplicate/unsafe keys, missing content and unsigned arbitrary HTML", async () => {
  const f = await fixture(),
    b = (await f.app.inject(`/api/v1/analyses/${f.id}/dossier`)).json();
  for (const bundle of [
    { ...b, title: "tampered" },
    JSON.stringify(b).replace('"title":', '"title":"duplicate", "title":'),
    '{"__proto__":{}}',
    "<script>alert(1)</script>",
    { ...b, engineVersion: "future" },
  ]) {
    const response = await f.post("/imports/bundle/preview", { bundle });
    expect(response.statusCode, response.body).toBe(422);
  }
  expect(
    f.db.prepare("SELECT count(*) AS n FROM imported_dossiers").get(),
  ).toEqual({ n: 0 });
}, 60000);
it("an included passage becomes a distinct pending editable copy; original IDs and reviews stay isolated", async () => {
  const f = await fixture(),
    b = (await f.app.inject(`/api/v1/analyses/${f.id}/dossier`)).json();
  const imported = await f.post("/imports/bundle", { bundle: b });
  expect(imported.statusCode, imported.body).toBe(200);
  const copy = await f.post(`/imports/${imported.json().id}/editable-copy`, {
    requestId: randomUUID(),
    caseId: "balds-eyesalve",
  });
  expect(copy.statusCode, copy.body).toBe(200);
  expect(copy.json().result.case.id).not.toBe("balds-eyesalve");
  expect(
    copy
      .json()
      .result.assertions.every(
        (a: { review: { status: string } }) => a.review.status === "pending",
      ),
  ).toBe(true);
  expect(
    readCorpus(f.db).cases.filter((c) => c.id === "balds-eyesalve"),
  ).toHaveLength(1);
}, 60000);
it("readonly mode permits frozen exports but rejects imports", async () => {
  const f = await fixture(),
    readonly = await createApp({
      db: f.db,
      ui: false,
      editor: false,
      liveTaxonomy: false,
    });
  cleanup.push(() => readonly.close());
  const exportResponse = await readonly.inject(
    `/api/v1/analyses/${f.id}/export?format=json`,
  );
  expect(exportResponse.statusCode).toBe(200);
  const token = (await readonly.inject("/api/v1/editor-session")).json()
    .csrfToken;
  const r = await readonly.inject({
    method: "POST",
    url: "/api/v1/imports/bundle",
    headers: { origin: "http://localhost", "x-recon-csrf": token },
    payload: { bundle: exportResponse.json() },
  });
  expect(r.statusCode).toBe(403);
  expect(r.json().error.code).toBe("READ_ONLY");
}, 60000);
it("evaluation artifacts have null authentic accuracy, separate synthetic counts, preserved raw predictions and valid hashes", async () => {
  const f = await fixture(),
    index = (await f.app.inject("/api/v1/evaluation/runs")).json();
  expect(index.items.length).toBeGreaterThan(0);
  const response = await f.app.inject(
    `/api/v1/evaluation/runs/${index.items[0].id}`,
  );
  expect(response.statusCode, response.body).toBe(200);
  const report = response.json(),
    { contentHash, ...rest } = report;
  expect(scientificHash(rest)).toBe(contentHash);
  expect(report.metrics.authentic.accuracy).toBeNull();
  expect(report.metrics.authentic.reviewedLabels).toBe(0);
  expect(report.metrics.synthetic.records).toBe(40);
  expect(report.metrics.synthetic.failed).toBe(0);
  expect(
    report.predictions.filter(
      (p: { referenceVerdict?: null }) => p.referenceVerdict === null,
    ),
  ).toHaveLength(34);
  expect(
    loadCorpus().assertions.every((a) => a.review.status === "pending"),
  ).toBe(true);
  const onDisk = JSON.parse(
    readFileSync(
      resolve("artifacts/evaluation", report.id, "report.json"),
      "utf8",
    ),
  );
  expect(onDisk).toEqual(report);
}, 60000);

it("transport preserves numeric hypothesis values and source arrays without coercion", async () => {
  const f = await fixture(),
    domain = (
      await f.app.inject("/api/v1/cases/balds-eyesalve/interpretation-domain")
    ).json();
  const response = await f.post("/cases/balds-eyesalve/scenario-evaluate", {
    context: domain.context,
    scenario: {
      assignments: [],
      hypotheticalOverrides: [
        {
          field: "a-nine-days",
          value: { value: 12, unit: "day" },
          rationale: "Conditional numeric duration; no source acceptance.",
        },
      ],
      rationale: "Explicit duration hypothesis.",
    },
    evidenceUnitIds: ["eu-2020-eso-newman"],
  });
  expect(response.statusCode, response.body).toBe(200);
  expect(response.json().scenario.hypotheticalOverrides[0].value.value).toBe(
    12,
  );
  const bundle = (
    await f.app.inject(`/api/v1/analyses/${f.id}/dossier`)
  ).json();
  const preview = await f.post("/imports/bundle/preview", { bundle });
  expect(preview.statusCode, preview.body).toBe(200);
}, 60000);
