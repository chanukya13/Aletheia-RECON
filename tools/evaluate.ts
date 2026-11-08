import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { cpus, platform, release } from "node:os";
import { performance } from "node:perf_hooks";
import {
  EvaluationArtifact,
  Dimension,
  type ScenarioInputData,
} from "@recon/contracts";
import {
  aggregateFindings,
  compareMaterials,
  evaluateScenario,
  extractPreparation,
  POLICY_HASH,
  MATERIAL_POLICY,
  scientificHash,
  sha256,
} from "@recon/core";
import { loadCorpus, ROOT } from "../apps/server/src/database.js";
const d = loadCorpus(),
  started = performance.now(),
  times: number[] = [],
  predictions: unknown[] = [],
  failures: unknown[] = [];
const baseline: ScenarioInputData = {
  assignments: [],
  hypotheticalOverrides: [],
  rationale: "Frozen development diagnostic; source reviews remain pending.",
};
const tokens = (v: unknown) =>
  new Set(
    JSON.stringify(v)
      .toLowerCase()
      .match(/[a-z]{3,}/g) ?? [],
  );
const jaccard = (a: Set<string>, b: Set<string>) =>
  [...a].filter((x) => b.has(x)).length / new Set([...a, ...b]).size || 0;
const panel = d.evidenceUnits.flatMap((u) => {
  const c = d.cases.find(
    (c) =>
      c.id ===
      (u.studyId === "study-harrison-2023"
        ? "hippocratic-oxymel"
        : "balds-eyesalve"),
  )!;
  return (
    c.id === "balds-eyesalve" ? ["baseline", "onion", "leek"] : ["baseline"]
  ).map((interpretation) => ({
    id: `diagnostic-${u.id}-${interpretation}`,
    caseId: c.id,
    caseRevision: c.revision,
    unitId: u.id,
    studyId: u.studyId,
    interpretation,
    scenario:
      interpretation === "baseline"
        ? baseline
        : {
            ...baseline,
            assignments: [
              {
                occurrenceId: "slot-cropleek",
                candidateId: `candidate-${interpretation}`,
              },
            ],
          },
    referenceVerdict: null,
    reviewStatus: "pending_independent_review",
    split:
      u.studyId === "study-fuchs-2018" ? "development" : "grouped_diagnostic",
    parentEvidenceUnitId: u.id,
  }));
});
// Freeze procedural inputs before computing predictions. These labels are unavailable, not engine-derived.
const fixtureDimensions = Dimension.options.filter(
  (d) => d !== "characterization",
);
const synthetic = fixtureDimensions.flatMap((dimension) =>
  (
    [
      "critical_unknown",
      "critical_mismatch",
      "context_unknown",
      "context_mismatch",
      "complete_recorded_match",
    ] as const
  ).map((kind) => ({
    id: `synthetic-${dimension}-${kind}`,
    dimension,
    kind,
    expected:
      kind === "critical_unknown"
        ? "insufficient_information"
        : kind === "critical_mismatch"
          ? "materially_incompatible"
          : kind.startsWith("context_")
            ? "partial_match"
            : "comparable_on_recorded_dimensions",
  })),
);
const labelFreezeHash = scientificHash({ panel, synthetic });
for (const record of panel) {
  const c = d.cases.find(
      (c) => c.id === record.caseId && c.revision === record.caseRevision,
    )!,
    u = d.evidenceUnits.find((u) => u.id === record.unitId)!;
  const start = performance.now(),
    result = evaluateScenario(d, c, [u], record.scenario).results[0]!;
  times.push(performance.now() - start);
  const query = tokens([
    ...d.materials
      .find((m) => m.id === c.materialVersionId)!
      .assertionIds.map((id) =>
        d.assertions.find((a) => a.id === id)?.state === "recorded"
          ? (d.assertions.find((a) => a.id === id) as { value: unknown }).value
          : null,
      ),
    record.scenario.assignments.map(
      (a) =>
        d.candidates.find((c) => c.id === a.candidateId)?.proposedName ?? "",
    ),
  ]);
  const scores = d.evidenceUnits
    .map((unit) => ({
      id: unit.id,
      score: jaccard(
        query,
        tokens(
          d.materials
            .find((m) => m.id === unit.testedMaterialVersionId)!
            .assertionIds.map((id) => {
              const a = d.assertions.find((a) => a.id === id);
              return a?.state === "recorded" ? a.value : null;
            }),
        ),
      ),
    }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const dims = result.materialComparison.dimensions,
    identity = dims.find((f) => f.dimension === "identity")!.state;
  const ablation = (removed: string[]) =>
    aggregateFindings(dims.filter((f) => !removed.includes(f.dimension)));
  predictions.push({
    ...record,
    condition: "curated-fact diagnostic; not held-out validation",
    systems: {
      B0: {
        rank: scores.findIndex((s) => s.id === u.id) + 1,
        score: scores.find((s) => s.id === u.id)!.score,
        linkAccepted: scores.find((s) => s.id === u.id)!.score >= 0.15,
      },
      B1:
        identity === "match"
          ? "comparable_on_recorded_dimensions"
          : identity === "mismatch"
            ? "materially_incompatible"
            : "insufficient_information",
      B2: { status: "not_run", reason: "credentials_or_model_unavailable" },
      B3: "insufficient_information",
      RECON: result.materialComparison.verdict,
      without_preparation: ablation([
        "preparation",
        "processing_order",
        "contact",
        "maturation_thermal",
      ]),
      without_composition: ablation(["composition"]),
      unknown_as_match_research_only: aggregateFindings(
        dims.map((f) => ({
          ...f,
          state: f.state === "unknown" ? "match" : f.state,
        })),
      ),
    },
    resultHash: scientificHash(result),
    dimensions: dims,
    sourceAssertionIds: result.dependencies.filter((id) =>
      d.assertions.some((a) => a.id === id),
    ),
  });
}
const syntheticRows = synthetic.map((f) => {
  const dims = compareMaterials(d, d.materials[0]!, d.materials[0]!).map(
    (x) => ({
      ...x,
      state: "match" as "match" | "mismatch" | "unknown" | "not_applicable",
    }),
  );
  dims.find(
    (x) =>
      x.dimension ===
      (f.kind.startsWith("context_") ? "characterization" : f.dimension),
  )!.state = f.kind.endsWith("unknown")
    ? "unknown"
    : f.kind.endsWith("mismatch")
      ? "mismatch"
      : "match";
  const actual = aggregateFindings(dims),
    pass = actual === f.expected;
  const row = {
    ...f,
    actual,
    pass,
    scope:
      "Synthetic aggregation safety sentinel; not empirical full-material accuracy.",
  };
  if (!pass) failures.push(row);
  return row;
});
const extraction = d.spans.slice(0, 12).map((s) => {
  const r = d.sourceRevisions.find((r) => r.id === s.sourceRevisionId)!,
    source = d.sources.find((x) => x.id === r.sourceId)!;
  const start = performance.now();
  // Keep original revision hashes and absolute UTF-16 anchors. Inspect proposals
  // within each quoted window without pretending the window is a new original.
  const result = extractPreparation(r, source.language, source.kind);
  const proposals = result.proposals.filter(
    (p) => p.span.start >= s.start && p.span.end <= s.end,
  );
  return {
    spanId: s.id,
    sourceRevisionId: r.id,
    workId: source.id,
    reviewStatus: "pending",
    status: result.status,
    proposalCount: proposals.length,
    proposals,
    elapsedMs: performance.now() - start,
    referenceLabels: null,
  };
});
const rows = predictions as Array<{
  systems: {
    RECON: string;
    B1: string;
    B3: string;
    without_preparation: string;
    without_composition: string;
    unknown_as_match_research_only: string;
    B0: { linkAccepted: boolean };
  };
}>;
const systems = [
  "RECON",
  "B1",
  "B3",
  "without_preparation",
  "without_composition",
  "unknown_as_match_research_only",
] as const;
const metrics = {
  authentic: {
    records: panel.length,
    historicalFamilies: 2,
    studies: d.studies.length,
    evidenceUnits: d.evidenceUnits.length,
    reviewedLabels: 0,
    accuracy: null,
    macroF1: null,
    falseAcceptance: null,
    comparableRecall: null,
    reason:
      "Independent reference labels unavailable. Original source assertions remain draft; no team or expert adjudication was invented.",
    systemOutputs: Object.fromEntries(
      systems.map((system) => [
        system,
        {
          comparable: rows.filter(
            (r) => r.systems[system] === "comparable_on_recorded_dimensions",
          ).length,
          insufficient: rows.filter(
            (r) => r.systems[system] === "insufficient_information",
          ).length,
          denominator: rows.length,
        },
      ]),
    ),
  },
  retrieval: {
    threshold: 0.15,
    thresholdStatus:
      "Fixed untuned development diagnostic, not a calibrated scientific acceptance threshold.",
    acceptedLinks: rows.filter((r) => r.systems.B0.linkAccepted).length,
    denominator: rows.length,
    recallAtK: null,
    MRR: null,
    reason: "No independently labeled relevance set.",
  },
  synthetic: {
    records: syntheticRows.length,
    passed: syntheticRows.filter((r) => r.pass).length,
    failed: syntheticRows.filter((r) => !r.pass).length,
    scope:
      "Aggregation safety only; separate from authentic scientific evaluation.",
  },
  extraction: {
    passages: extraction.length,
    works: new Set(extraction.map((r) => r.workId)).size,
    precision: null,
    recall: null,
    F1: null,
    reason:
      "Exact proposals retained, independent extraction annotations unavailable.",
  },
  attribution: {
    validExactSpans: d.spans.length,
    totalSpans: d.spans.length,
    semanticEntailment: null,
    reason:
      "Frozen-data validation verifies text anchoring; it does not establish semantic support.",
  },
};
const sorted = [...times].sort((a, b) => a - b);
const now = new Date().toISOString(),
  id = `diagnostic-${now.replace(/[^0-9]/g, "").slice(0, 17)}`,
  folder = resolve(ROOT, "artifacts/evaluation", id);
mkdirSync(folder, { recursive: true });
const manifest = {
  protocol: "recon-development-diagnostic-v1",
  labelFreezeHash,
  corpusHash: scientificHash(d),
  policyHash: POLICY_HASH,
  policy: MATERIAL_POLICY,
  seed: 20261106,
  reviewers: [],
  reviewStatus: "pending",
  limitations: [
    "Development diagnostic after policy implementation; no concealed or held-out benchmark claim.",
    "34 correlated interpretation records derive from 14 formulation/assay units in three papers; they are not independent experiments.",
    "Study-group split: 2018 development; 2020/2023 grouped diagnostics. Both eyesalve splits share a historical family.",
    "Only 10 grouped diagnostic rows; the planned 16 labeled audit rows and independent adjudication remain unavailable. Scope is explicitly reduced rather than padded.",
    "Curated facts are supplied to all deterministic audit systems. Lexical B0 ranks curated-field tokens with Jaccard; its binary links are not scientific four-way verdicts.",
    "B2 was not run: no provider/model credentials were configured. No cost, model output or superiority claim is invented.",
    "No researcher usability study was run. Optional facsimile viewer omitted; mandatory source text/provenance workflow is complete.",
  ],
  systems: [
    "B0",
    "B1",
    "B2_not_run",
    "B3",
    "RECON",
    "without_preparation",
    "without_composition",
    "unknown_as_match_research_only",
  ],
  runtime: {
    node: process.versions.node,
    os: platform(),
    release: release(),
    cpu: cpus()[0]?.model,
  },
  sourceRevision: sha256(
    [
      "packages/core/src/compare.ts",
      "packages/core/src/scenarios.ts",
      "tools/evaluate.ts",
    ]
      .map((p) => readFileSync(resolve(ROOT, p), "utf8"))
      .join("\n"),
  ),
};
const body = {
  id,
  createdAt: now,
  manifest,
  metrics,
  predictions: [
    ...predictions,
    ...syntheticRows,
    ...extraction.map((r) => ({ ...r, condition: "extraction" })),
  ],
  failures,
  timings: {
    comparisonMs: times,
    p50Ms: sorted[Math.floor(sorted.length * 0.5)],
    p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1],
    totalMs: performance.now() - started,
    coldFirstComparisonMs: times[0],
  },
};
const report = EvaluationArtifact.parse({
  ...body,
  contentHash: scientificHash(body),
});
for (const [name, data] of Object.entries({
  "report.json": report,
  "manifest.json": manifest,
  "metrics.json": metrics,
  "inputs-and-labels.json": { panel, synthetic },
  "failures.json": failures,
  "timings.json": body.timings,
}))
  writeFileSync(resolve(folder, name), JSON.stringify(data, null, 2) + "\n");
writeFileSync(
  resolve(folder, "predictions.jsonl"),
  report.predictions.map((r) => JSON.stringify(r)).join("\n") + "\n",
);
writeFileSync(
  resolve(folder, "METHODS.md"),
  `# Executed development diagnostic\n\n${manifest.limitations.map((l) => "- " + l).join("\n")}\n\nAuthentic rows: ${panel.length}; reviewed labels: 0. All authentic accuracy/false-acceptance metrics remain null. Synthetic aggregation sentinels: ${syntheticRows.filter((r) => r.pass).length}/${syntheticRows.length}. See raw predictions, inputs and timings.\n`,
);
writeFileSync(
  resolve(ROOT, "artifacts/evaluation/index.json"),
  JSON.stringify(
    {
      items: [
        {
          id,
          createdAt: now,
          authenticRecords: panel.length,
          syntheticRecords: syntheticRows.length,
          reviewedAuthenticLabels: 0,
          status: "development_diagnostic_labels_pending",
        },
      ],
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    id,
    authenticRecords: panel.length,
    reviewedLabels: 0,
    syntheticPassed: metrics.synthetic.passed,
    syntheticTotal: metrics.synthetic.records,
    failures: failures.length,
  }),
);
if (failures.length) process.exitCode = 1;
