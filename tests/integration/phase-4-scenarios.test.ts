import { afterEach, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  AnalysisRecord,
  DiffResponse,
  EditorSession,
  InterpretationDomain,
  MaterialComparison,
  ScenarioAuditResponse,
  ScenarioEvaluation,
  ScenarioRecord,
} from "@recon/contracts";
import { contentHash, scientificHash } from "@recon/core";
import { createApp } from "../../apps/server/src/app.js";
import { openDatabase, readCorpus } from "../../apps/server/src/database.js";
const close: Array<() => unknown> = [];
afterEach(async () => {
  for (const fn of close.splice(0).reverse()) await fn();
});
async function fixture() {
  const db = openDatabase(":memory:");
  close.push(() => db.close());
  const app = await createApp({ db, ui: false, liveTaxonomy: false });
  close.push(() => app.close());
  const session = EditorSession.parse(
    (await app.inject("/api/v1/editor-session")).json(),
  );
  const headers = {
    origin: "http://localhost",
    "x-recon-csrf": session.csrfToken,
  };
  const domain = InterpretationDomain.parse(
    (
      await app.inject("/api/v1/cases/balds-eyesalve/interpretation-domain")
    ).json(),
  );
  const post = (suffix: string, payload: unknown) =>
    app.inject({
      method: "POST",
      url: `/api/v1/${suffix}`,
      headers,
      payload: payload as Record<string, unknown>,
    });
  const scenario = {
    assignments: [
      { occurrenceId: "slot-cropleek", candidateId: "candidate-onion" },
    ],
    hypotheticalOverrides: [],
    rationale:
      "Conditional documented proposal; all source claims remain drafts.",
  };
  const evidenceUnitIds = readCorpus(db)
    .evidenceUnits.filter((u) => u.studyId === "study-furner-pardoe-2020")
    .map((u) => u.id);
  const audit = {
    context: domain.context,
    mode: "draft_exploration",
    scenario,
    selections: [
      {
        groupId: domain.groups[0]!.id,
        alternativeIds: ["candidate-onion", "candidate-leek"],
      },
    ],
    constraints: [],
    subsetRationale:
      "Explicit two-proposal exploration excluding the tentative edition gloss.",
    evidenceUnitIds,
    target: "conditional_identity_vector",
    targetDimension: null,
  };
  return { db, app, post, domain, scenario, evidenceUnitIds, audit };
}
it("save → immutable revisions → diff → complete audit → frozen analysis → reload without corpus changes", async () => {
  const f = await fixture(),
    before = scientificHash(readCorpus(f.db));
  const body = {
    requestId: randomUUID(),
    actor: {
      name: "Integration fixture",
      qualification: "Synthetic test only",
      mode: "draft",
    },
    context: f.domain.context,
    name: "Onion interpretation",
    scenario: f.scenario,
    expectedRevision: 0,
  };
  const response = await f.post("cases/balds-eyesalve/scenarios", body);
  expect(response.statusCode, response.body).toBe(200);
  const first = ScenarioRecord.parse(response.json());
  expect((await f.post("cases/balds-eyesalve/scenarios", body)).json()).toEqual(
    first,
  );
  const secondScenario = {
    ...f.scenario,
    assignments: [
      { occurrenceId: "slot-cropleek", candidateId: "candidate-leek" },
    ],
  };
  const second = ScenarioRecord.parse(
    (
      await f.post("cases/balds-eyesalve/scenarios", {
        ...body,
        requestId: randomUUID(),
        id: first.id,
        expectedRevision: 1,
        name: "Leek interpretation",
        scenario: secondScenario,
      })
    ).json(),
  );
  expect(second.revision).toBe(2);
  const history = (
    await f.app.inject("/api/v1/cases/balds-eyesalve/scenarios")
  ).json().items;
  expect(history).toEqual([second, first]);
  const diff = DiffResponse.parse(
    (
      await f.post("cases/balds-eyesalve/scenario-diff", {
        context: f.domain.context,
        before: f.scenario,
        after: secondScenario,
        evidenceUnitIds: f.evidenceUnitIds,
      })
    ).json(),
  );
  expect(diff.diff.recomputedUnchangedIds).toHaveLength(2);
  expect(diff.changedCorrespondenceUnitIds).toHaveLength(2);
  const preview = await f.post("cases/balds-eyesalve/domain-preview", f.audit);
  expect(preview.json().worldCount).toBe(2);
  const auditResponse = await f.post(
    "cases/balds-eyesalve/robustness",
    f.audit,
  );
  expect(auditResponse.statusCode, auditResponse.body).toBe(200);
  const audit = ScenarioAuditResponse.parse(auditResponse.json());
  expect(audit.studyCoverage[0]).toMatchObject({
    worldsWithAnyCorrespondence: 2,
    fixedCorrespondingArmIds: [],
    worldsWithAnyComparableMaterial: 0,
  });
  expect(audit.audit.exhaustiveWithinDocumentedDomain).toBe(false);
  const freeze = {
    requestId: randomUUID(),
    name: "Frozen authentic draft-domain exploration",
    runHash: audit.runHash,
  };
  const frozen = AnalysisRecord.parse(
    (await f.post("analyses", freeze)).json(),
  );
  expect(frozen.kind).toBe("robustness");
  expect(frozen.inputs).toMatchObject({
    request: {
      ...f.audit,
      caseId: "balds-eyesalve",
      interpretationDomain: f.domain,
    },
    policy: { version: "1.1.0" },
  });
  expect((await f.post("analyses", freeze)).json()).toEqual(frozen);
  expect((await f.app.inject(`/api/v1/analyses/${frozen.id}`)).json()).toEqual(
    frozen,
  );
  const { contentHash: hash, ...withoutHash } = frozen;
  expect(contentHash(withoutHash)).toBe(hash);
  expect(scientificHash(readCorpus(f.db))).toBe(before);
  expect(() =>
    f.db.prepare("UPDATE scenario_versions SET revision=9").run(),
  ).toThrow();
  expect(() => f.db.prepare("DELETE FROM analysis_records").run()).toThrow();
  expect(() => f.db.prepare("DELETE FROM scenario_runs").run()).toThrow();
  expect(f.db.pragma("foreign_key_check")).toEqual([]);
  for (const s of audit.spans)
    expect(
      audit.sourceRevisions
        .find((r) => r.id === s.sourceRevisionId)!
        .displayText.slice(s.start, s.end),
    ).toBe(s.exact);
});
it("two-tab revision conflicts and idempotency conflicts preserve the first saved revision", async () => {
  const f = await fixture(),
    body = {
      requestId: randomUUID(),
      actor: { name: "Fixture", qualification: "Test only", mode: "draft" },
      context: f.domain.context,
      name: "Concurrent notebook",
      scenario: f.scenario,
      expectedRevision: 0,
    };
  const first = (await f.post("cases/balds-eyesalve/scenarios", body)).json();
  expect(
    (
      await f.post("cases/balds-eyesalve/scenarios", {
        ...body,
        name: "Conflicting reuse",
      })
    ).statusCode,
  ).toBe(409);
  const update = {
    ...body,
    id: first.id,
    expectedRevision: 1,
    requestId: randomUUID(),
  };
  expect(
    (await f.post("cases/balds-eyesalve/scenarios", update)).statusCode,
  ).toBe(200);
  const stale = await f.post("cases/balds-eyesalve/scenarios", {
    ...update,
    requestId: randomUUID(),
  });
  expect(stale.statusCode).toBe(409);
  expect(stale.json().error.code).toBe("STALE_SCENARIO");
});
it.each(["caseHash", "corpusRevision", "policyHash"] as const)(
  "rejects stale %s before analysis or persistence",
  async (field) => {
    const f = await fixture(),
      context = {
        ...f.domain.context,
        [field]:
          field === "corpusRevision" ? "obsolete-corpus" : "0".repeat(64),
      };
    const r = await f.post("cases/balds-eyesalve/scenario-evaluate", {
      context,
      scenario: f.scenario,
      evidenceUnitIds: f.evidenceUnitIds,
    });
    expect(r.statusCode, r.body).toBe(409);
    expect(r.json().error.code).toBe("STALE_ANALYSIS");
    expect(
      f.db.prepare("SELECT count(*) AS n FROM scenario_runs").get(),
    ).toEqual({ n: 0 });
  },
);
it("reviewed mode excludes pending fixed choices; hypotheses stay conditional and cannot enter audits", async () => {
  const f = await fixture();
  expect(
    (
      await f.post("cases/balds-eyesalve/robustness", {
        ...f.audit,
        mode: "reviewed",
        selections: [],
      })
    ).statusCode,
  ).toBe(422);
  const baseline = { ...f.scenario, assignments: [] };
  const r = await f.post("cases/balds-eyesalve/robustness", {
    ...f.audit,
    scenario: baseline,
    mode: "reviewed",
    selections: [],
  });
  expect(r.statusCode, r.body).toBe(200);
  expect(r.json().audit.worldCount).toBe(1);
  expect(r.json().clarification.inclusionMinimalSufficientSets).toEqual([[]]);
  const hypothesis = {
    ...f.scenario,
    hypotheticalOverrides: [
      {
        field: "a-brass",
        value: "glass vessel",
        rationale: "Conditional contact assumption only.",
      },
    ],
  };
  const evaluated = ScenarioEvaluation.parse(
    (
      await f.post("cases/balds-eyesalve/scenario-evaluate", {
        context: f.domain.context,
        scenario: hypothesis,
        evidenceUnitIds: f.evidenceUnitIds,
      })
    ).json(),
  );
  expect(evaluated.kind).toBe("hypothetical");
  expect(
    evaluated.assertions.some(
      (a) => a.state === "inferred" && a.review.status === "pending",
    ),
  ).toBe(true);
  const diff = await f.post("cases/balds-eyesalve/scenario-diff", {
    context: f.domain.context,
    before: baseline,
    after: hypothesis,
    evidenceUnitIds: f.evidenceUnitIds,
  });
  expect(diff.statusCode, diff.body).toBe(200);
  expect(
    diff
      .json()
      .assertions.some((a: { state: string }) => a.state === "inferred"),
  ).toBe(true);
  expect(
    (
      await f.post("cases/balds-eyesalve/robustness", {
        ...f.audit,
        scenario: hypothesis,
      })
    ).statusCode,
  ).toBe(422);
});
it("rejects empty domains, missing subset rationale, duplicate units and counterfeit frozen runs", async () => {
  const f = await fixture();
  for (const patch of [
    { subsetRationale: "" },
    { evidenceUnitIds: [f.evidenceUnitIds[0], f.evidenceUnitIds[0]] },
    {
      constraints: f.audit.selections[0]!.alternativeIds.map(
        (alternativeId) => ({
          forbidden: [
            { groupId: f.audit.selections[0]!.groupId, alternativeId },
          ],
          rationale:
            "Intentionally exclude all choices for boundary verification.",
        }),
      ),
    },
  ])
    expect(
      (
        await f.post("cases/balds-eyesalve/domain-preview", {
          ...f.audit,
          ...patch,
        })
      ).statusCode,
    ).toBeGreaterThanOrEqual(400);
  expect(
    (
      await f.post("analyses", {
        requestId: randomUUID(),
        name: "Fake run",
        runHash: "0".repeat(64),
      })
    ).statusCode,
  ).toBe(404);
  expect(
    (
      await f.app.inject({
        method: "POST",
        url: "/api/v1/cases/balds-eyesalve/scenario-evaluate",
        payload: {
          context: f.domain.context,
          scenario: f.scenario,
          evidenceUnitIds: f.evidenceUnitIds,
        },
      })
    ).statusCode,
  ).toBe(403);
});
it("two real incomplete materials retain unknowns, correct two-sided sources and symmetric findings", async () => {
  const f = await fixture();
  const body = {
    policyHash: f.domain.context.policyHash,
    left: { materialVersionId: "material-2018-es-o", assignments: [] },
    right: { materialVersionId: "material-2020-eso", assignments: [] },
  };
  const response = await f.post("materials/compare", body);
  expect(response.statusCode, response.body).toBe(200);
  const a = MaterialComparison.parse(response.json()),
    b = MaterialComparison.parse(
      (
        await f.post("materials/compare", {
          ...body,
          left: body.right,
          right: body.left,
        })
      ).json(),
    );
  expect(a.scope).toBe("material_only");
  expect(a.verdict).toBe("insufficient_information");
  expect(a.dimensions.map((d) => d.state)).toEqual(
    b.dimensions.map((d) => d.state),
  );
  expect(a.leftAssertionIds).toEqual(b.rightAssertionIds);
  expect(a.rightAssertionIds).toEqual(b.leftAssertionIds);
  expect(
    a.assertions
      .filter((x) => a.leftAssertionIds.includes(x.id))
      .every((x) =>
        x.references.some(
          (r) =>
            r.kind === "span" &&
            a.spans
              .find((s) => s.id === r.spanId)
              ?.sourceRevisionId.includes("2018"),
        ),
      ),
  ).toBe(true);
  expect(a).not.toHaveProperty("reportedOutcome");
  expect(a).not.toHaveProperty("contextFit");
  const frozen = AnalysisRecord.parse(
    (
      await f.post("analyses", {
        requestId: randomUUID(),
        name: "Material comparison snapshot",
        runHash: a.runHash,
      })
    ).json(),
  );
  expect(frozen.kind).toBe("material_only");
  const historical = {
    materialVersionId: readCorpus(f.db).cases[0]!.materialVersionId,
    assignments: f.scenario.assignments,
  };
  expect(
    (await f.post("materials/compare", { ...body, left: historical }))
      .statusCode,
  ).toBeGreaterThanOrEqual(400);
  expect(
    (
      await f.post("materials/compare", {
        ...body,
        right: { ...body.right, assignments: f.scenario.assignments },
      })
    ).statusCode,
  ).toBeGreaterThanOrEqual(400);
});
