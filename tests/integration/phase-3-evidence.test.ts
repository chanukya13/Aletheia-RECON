import { it, expect, afterEach } from "vitest";
import { randomUUID } from "node:crypto";
import {
  Evaluation,
  EditorSession,
  StudyDetail,
  LiteratureSearch,
} from "@recon/contracts";
import { createApp } from "../../apps/server/src/app.js";
import { openDatabase, migrate } from "../../apps/server/src/database.js";
import { LiteratureService } from "../../apps/server/src/literature.js";
import { retrievePendingFullText } from "../../apps/server/src/full-text.js";
const closers: Array<() => void | Promise<void>> = [];
it("imports eligible licensed paragraphs as pending content with retained raw provenance and cache", async () => {
  const db = openDatabase(":memory:");
  migrate(db);
  closers.push(() => {
    db.close();
  });
  const service = new LiteratureService(
    db,
    true,
    async () =>
      new Response(
        JSON.stringify({
          resultList: {
            result: [
              {
                id: "test",
                source: "MED",
                title: "Synthetic licensed test",
                pmcid: "PMC123",
                license: "cc by",
                isOpenAccess: "Y",
              },
            ],
          },
        }),
      ),
  );
  const found = await service.search("fixture");
  const pending = service.import(found.snapshotId, "test", "MED");
  let calls = 0;
  const raw =
    '<article xmlns:xlink="http://www.w3.org/1999/xlink"><front><permissions><license xlink:href="https://creativecommons.org/licenses/by/4.0/"/></permissions></front><body><p>Pending source paragraph.</p></body></article>';
  const fetcher: typeof fetch = async (url) => {
    calls++;
    expect(String(url)).toBe(
      "https://www.ebi.ac.uk/europepmc/webservices/rest/PMC123/fullTextXML",
    );
    return new Response(raw);
  };
  const result = await retrievePendingFullText(db, pending.id, true, fetcher);
  expect(result.status).toBe("retained");
  expect(result.text).toBe("Pending source paragraph.");
  await retrievePendingFullText(db, pending.id, true, fetcher);
  expect(calls).toBe(1);
  expect(
    (
      db
        .prepare("SELECT raw FROM pending_fulltext WHERE id=?")
        .get(pending.id) as { raw: string }
    ).raw,
  ).toBe(raw);
  expect(pending.review).toBe("pending");
});
afterEach(async () => {
  for (const f of closers.splice(0).reverse()) await f();
});
it("local study → pinned evaluation → reproducible source reasons and unchanged observations", async () => {
  const db = openDatabase(":memory:");
  closers.push(() => {
    db.close();
  });
  const app = await createApp({ db, ui: false, liveTaxonomy: false });
  closers.push(() => app.close());
  const study = StudyDetail.parse(
    (await app.inject("/api/v1/studies/study-fuchs-2018")).json(),
  );
  expect(study.evidenceUnits).toHaveLength(8);
  const session = EditorSession.parse(
    (await app.inject("/api/v1/editor-session")).json(),
  );
  const headers = {
    origin: "http://localhost",
    "x-recon-csrf": session.csrfToken,
  };
  const body = {
    caseRevision: 1,
    policyId: "material-audit-v1",
    scenario: {
      assignments: [],
      hypotheticalOverrides: [],
      rationale: "Original unresolved historical identity.",
    },
    evidenceUnitIds: study.evidenceUnits.map((u) => u.id),
  };
  const request = () =>
    app.inject({
      method: "POST",
      url: "/api/v1/cases/balds-eyesalve/evaluate",
      headers,
      payload: body,
    });
  const response = await request();
  expect(response.statusCode, response.body).toBe(200);
  const result = Evaluation.parse(response.json());
  expect(result.results).toHaveLength(8);
  expect(
    result.results.every(
      (r) => r.materialComparison.verdict === "insufficient_information",
    ),
  ).toBe(true);
  expect(Evaluation.parse((await request()).json()).resultHash).toBe(
    result.resultHash,
  );
  for (const s of result.spans)
    expect(
      result.sourceRevisions
        .find((r) => r.id === s.sourceRevisionId)!
        .displayText.slice(s.start, s.end),
    ).toBe(s.exact);
  expect(db.prepare("SELECT count(*) AS n FROM evaluation_runs").get()).toEqual(
    { n: 1 },
  );
  for (const patch of [
    { policyId: "unknown" },
    { evidenceUnitIds: ["missing"] },
    { caseRevision: 999 },
    {
      scenario: {
        ...body.scenario,
        assignments: [
          { occurrenceId: "wrong", candidateId: "candidate-onion" },
        ],
      },
    },
  ]) {
    const bad = await app.inject({
      method: "POST",
      url: "/api/v1/cases/balds-eyesalve/evaluate",
      headers,
      payload: { ...body, ...patch },
    });
    expect(bad.statusCode).toBeGreaterThanOrEqual(400);
  }
  expect(db.pragma("foreign_key_check")).toEqual([]);
});
it("literal paginated metadata retrieval, cached raw provenance and idempotent pending import", async () => {
  const db = openDatabase(":memory:");
  migrate(db);
  closers.push(() => {
    db.close();
  });
  const urls: string[] = [];
  const service = new LiteratureService(db, true, async (input) => {
    urls.push(String(input));
    return new Response(
      JSON.stringify({
        nextCursorMark: "next",
        resultList: {
          result: [
            {
              id: "123",
              source: "MED",
              title: "A synthetic provider fixture",
              authorString: "Fixture author",
              pubYear: "2026",
              isOpenAccess: "Y",
              license: "CC BY-NC",
              pubTypeList: { pubType: ["Retracted Publication"] },
            },
          ],
        },
      }),
    );
  });
  const result = LiteratureSearch.parse(
    await service.search("honey OR vinegar"),
  );
  expect(new URL(urls[0]!).searchParams.get("query")).toBe(
    '"honey OR vinegar"',
  );
  expect(result.items[0]!.pmcid).toBeNull();
  expect(result.items[0]!.fullTextStatus).toBe("not_retrieved");
  expect(result.items[0]!.publicationTypes).toContain("Retracted Publication");
  const pending = service.import(result.snapshotId, "123", "MED");
  expect(pending.contentStatus).toBe("metadata_only");
  expect(pending.review).toBe("pending");
  expect(service.import(result.snapshotId, "123", "MED")).toEqual(pending);
  await service.search("honey OR vinegar");
  expect(urls).toHaveLength(1);
  expect(() => service.import(randomUUID(), "123", "MED")).toThrow();
});
it.each(["429", "503", "malformed", "timeout"])(
  "provider %s returns unavailable without disturbing local evidence",
  async (failure) => {
    const db = openDatabase(":memory:");
    migrate(db);
    closers.push(() => {
      db.close();
    });
    const service = new LiteratureService(db, true, async () => {
      if (failure === "timeout") throw Error("timeout");
      return failure === "malformed"
        ? new Response("bad")
        : new Response("", { status: Number(failure) });
    });
    expect((await service.search("honey")).state).toBe("unavailable");
  },
);
