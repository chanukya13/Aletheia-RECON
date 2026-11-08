import { it, expect, describe } from "vitest";
import { AnalysisRecord, type DossierData } from "@recon/contracts";
import {
  buildDossier,
  computeDossier,
  contentHash,
  decisionPayload,
  deriveNameFacts,
  dossierHtml,
  evaluateScenario,
  MATERIAL_POLICY,
  POLICY_HASH,
  replayDossier,
  scopeCorpus,
  scientificHash,
  validateDossier,
} from "@recon/core";
import { loadCorpus } from "../../apps/server/src/database.js";
function fixture() {
  const d = loadCorpus(),
    c = d.cases[0]!,
    context = {
      caseRevision: 1,
      caseHash: c.contentHash,
      corpusRevision: d.revision,
      policyHash: POLICY_HASH,
      selection: "pinned" as const,
    },
    scenario = {
      assignments: [
        { occurrenceId: "slot-cropleek", candidateId: "candidate-onion" },
      ],
      hypotheticalOverrides: [],
      rationale: "Conditional source interpretation, not a human acceptance.",
    },
    request = {
      caseId: c.id,
      context,
      scenario,
      evidenceUnitIds: ["eu-2020-eso-newman", "eu-2020-esl-newman"],
    };
  const payload = evaluateScenario(
    d,
    c,
    d.evidenceUnits.filter((u) => request.evidenceUnitIds.includes(u.id)),
    scenario,
  );
  const body = {
    id: "analysis-unit-fixture",
    name: "Authentic draft interpretation dossier",
    kind: "scenario" as const,
    runHash: "1".repeat(64),
    createdAt: "2026-11-06T00:00:00.000Z",
    context,
    payload,
    inputs: {
      request,
      policy: MATERIAL_POLICY,
      replayCorpus: scopeCorpus(d, request),
    },
  };
  return {
    d,
    record: AnalysisRecord.parse({ ...body, contentHash: contentHash(body) }),
  };
}
// Explicit bundle hashing, not an engine-derived scientific label.
function seal(b: DossierData) {
  const { bundleHash: _hash, ...rest } = b;
  return { ...b, bundleHash: scientificHash(rest) };
}
describe("versioned dossiers and offline decision replay", () => {
  it("builds a transitive source/material closure and reproduces authentic conditional results", () => {
    const { record } = fixture(),
      b = buildDossier(record);
    expect(replayDossier(b).scientificResultHash).toBe(b.scientificResultHash);
    expect(b.scientific.corpus.bibliography.length).toBeGreaterThan(0);
    expect(
      b.scientific.corpus.assertions.every(
        (a) => a.review.status === "pending",
      ),
    ).toBe(true);
  });
  it("separates file timestamps/title from scientific input and result hashes", () => {
    const { record } = fixture(),
      a = buildDossier(record),
      b = seal({
        ...a,
        exportedAt: "2026-11-07T00:00:00.000Z",
        title: "Different display heading",
      });
    expect(a.bundleHash).not.toBe(b.bundleHash);
    expect(replayDossier(b).scientificResultHash).toBe(a.scientificResultHash);
    expect(scientificHash(decisionPayload(b.scientific))).toBe(
      a.scientificPayloadHash,
    );
  });
  it("does not let rationale-only edits change canonical scientific payloads", () => {
    const { record } = fixture(),
      a = buildDossier(record),
      s = structuredClone(a.scientific);
    (s.request as { scenario: { rationale: string } }).scenario.rationale =
      "A different editorial explanation.";
    expect(scientificHash(decisionPayload(s))).toBe(a.scientificPayloadHash);
  });
  it("omits protected originals and exact selectors, while replaying the same decision facts", () => {
    const { record } = fixture(),
      inputs = record.inputs as { replayCorpus: ReturnType<typeof loadCorpus> };
    const source = inputs.replayCorpus.sourceRevisions.find((r) =>
      r.id.includes("2020"),
    )!;
    source.rights.redistribution = false;
    source.rights.decision = "metadata_only";
    source.contentHash = contentHash(source);
    record.contentHash = contentHash(record);
    const b = buildDossier(record);
    const omitted = b.sources.find((r) => r.id === source.id)!;
    expect(omitted.textIncluded).toBe(false);
    expect(
      b.scientific.corpus.sourceRevisions.find((r) => r.id === source.id)!
        .displayText,
    ).toBe("");
    expect(
      b.scientific.corpus.spans
        .filter((s) => s.sourceRevisionId === source.id)
        .every((s) => s.exact === "[source text omitted]"),
    ).toBe(true);
    expect(replayDossier(b).sourceTextsOmitted).toBe(1);
    expect(JSON.stringify(b)).not.toContain(source.displayText.slice(0, 150));
  });
  it.each(["scenario", "diff", "robustness", "material_only"] as const)(
    "pins %s replay to the sole evaluator",
    (kind) => {
      const { d, record } = fixture();
      const original = (record.inputs as { request: Record<string, unknown> })
        .request;
      const request =
        kind === "scenario"
          ? original
          : kind === "diff"
            ? {
                caseId: original.caseId,
                context: original.context,
                before: original.scenario,
                after: {
                  ...(original.scenario as object),
                  assignments: [
                    {
                      occurrenceId: "slot-cropleek",
                      candidateId: "candidate-leek",
                    },
                  ],
                },
                evidenceUnitIds: original.evidenceUnitIds,
              }
            : kind === "robustness"
              ? {
                  ...original,
                  mode: "draft_exploration",
                  selections: [
                    {
                      groupId: "group-slot-cropleek",
                      alternativeIds: ["candidate-onion", "candidate-leek"],
                    },
                  ],
                  constraints: [],
                  subsetRationale: "Explicit two proposal domain.",
                  target: "conditional_identity_vector",
                  targetDimension: null,
                }
              : {
                  policyHash: POLICY_HASH,
                  left: {
                    materialVersionId: "material-2018-es-o",
                    assignments: [],
                  },
                  right: {
                    materialVersionId: "material-2020-eso",
                    assignments: [],
                  },
                };
      const body = {
        ...record,
        kind,
        payload: computeDossier(kind, d, request, deriveNameFacts(d)),
        inputs: {
          policy: MATERIAL_POLICY,
          request,
          replayCorpus: scopeCorpus(d, request),
        },
      };
      const b = buildDossier(
        AnalysisRecord.parse({ ...body, contentHash: contentHash(body) }),
      );
      expect(replayDossier(b).status).toBe("reproduced");
    },
  );
  it("rejects byte edits, malformed references, policy versions and altered included originals even with a recomputed outer hash", () => {
    const b = buildDossier(fixture().record);
    expect(() => validateDossier({ ...b, title: "tampered" })).toThrow(
      "BUNDLE_HASH",
    );
    const missing = structuredClone(b);
    missing.scientific.corpus.assertions.pop();
    expect(() => validateDossier(seal(missing))).toThrow();
    const source = structuredClone(b);
    source.scientific.corpus.sourceRevisions[0]!.displayText += "x";
    expect(() => validateDossier(seal(source))).toThrow("SOURCE_HASH");
    expect(() => validateDossier({ ...b, engineVersion: "unknown" })).toThrow();
  });
  it("escapes hostile text in standalone HTML and never embeds executable source markup", () => {
    const b = buildDossier(fixture().record);
    b.title = '<script>alert("x")</script>';
    const html = dossierHtml(b);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("default-src 'none'");
    expect(html).toContain("Draft evidence remains draft");
  });
});
