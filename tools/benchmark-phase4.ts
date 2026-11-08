import { mkdirSync, writeFileSync } from "node:fs";
import { cpus, totalmem, platform, release } from "node:os";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import type { AuditInput, DomainData } from "@recon/contracts";
import { POLICY_HASH, runRobustness } from "@recon/core";
import { loadCorpus } from "../apps/server/src/database.js";
const d = structuredClone(loadCorpus()),
  c = d.cases[0]!,
  material = d.materials.find((m) => m.id === c.materialVersionId)!,
  template = material.componentSlots.find((s) => s.id === "slot-cropleek")!,
  candidate = d.candidates.find((c) => c.id === "candidate-onion")!;
const context = {
  caseRevision: c.revision,
  caseHash: c.contentHash,
  corpusRevision: d.revision,
  policyHash: POLICY_HASH,
  selection: "latest" as const,
};
const groups: DomainData["groups"] = Array.from({ length: 3 }, (_, i) => {
  const occurrenceId = `benchmark-slot-${i}`;
  const alternatives = Array.from({ length: 4 }, (_, j) => {
    const id = `benchmark-candidate-${i}-${j}`;
    d.candidates.push({
      ...candidate,
      id,
      occurrenceId,
      proposedName: `Synthetic benchmark proposal ${i}/${j}`,
    });
    return {
      id,
      label: `Synthetic ${i}/${j}`,
      assignments: [{ occurrenceId, candidateId: id }],
      supportAssertionIds: candidate.supportAssertionIds,
      eligibleReviewed: false,
      reviewState: "draft" as const,
    };
  });
  material.componentSlots.push({
    ...template,
    id: occurrenceId,
    candidateIds: alternatives.map((a) => a.id),
  });
  return {
    id: `benchmark-group-${i}`,
    occurrenceId,
    label: `Synthetic benchmark group ${i}`,
    exhaustive: false as const,
    alternatives,
  };
});
const units = Array.from({ length: 50 }, (_, i) => ({
  ...d.evidenceUnits[i % d.evidenceUnits.length]!,
  id: `benchmark-unit-${i}`,
}));
const domain: DomainData = {
  context,
  groups,
  excludedCandidateIds: [],
  limitation:
    "Synthetic algorithm load test, not scientific evidence or a reviewed corpus.",
};
const input: AuditInput = {
  context,
  mode: "draft_exploration",
  scenario: {
    assignments: [],
    hypotheticalOverrides: [],
    rationale: "Synthetic benchmark only.",
  },
  selections: groups.map((g) => ({
    groupId: g.id,
    alternativeIds: g.alternatives.map((a) => a.id),
  })),
  constraints: [],
  subsetRationale: "",
  evidenceUnitIds: units.map((u) => u.id),
  target: "conditional_identity_vector",
  targetDimension: null,
};
const samples: number[] = [];
let worldCount = 0;
for (let i = 0; i < 23; i++) {
  const start = performance.now();
  const r = runRobustness(d, c, units, domain, input);
  const ms = performance.now() - start;
  worldCount = r.audit.worldCount;
  if (i >= 3) samples.push(ms);
}
const sorted = [...samples].sort((a, b) => a - b),
  p95 = sorted[Math.ceil(sorted.length * 0.95) - 1]!;
const report = {
  measuredAt: new Date().toISOString(),
  scope:
    "Pure core complete audit; excludes HTTP, database, response serialization and browser rendering. Synthetic 3x4 alternatives and 50 units repeat authentic incomplete material profiles; this does not benchmark fully curated worst-case profiles or scientific accuracy.",
  hardware: {
    cpu: cpus()[0]?.model,
    logicalCPUs: cpus().length,
    totalMemoryGB: Math.round(totalmem() / 1024 ** 3),
    os: platform(),
    release: release(),
    node: process.versions.node,
  },
  warmups: 3,
  sampleCount: samples.length,
  worldCount,
  evidenceUnitCount: units.length,
  samplesMs: samples,
  p95Ms: p95,
  targetMs: 500,
  passesTarget: p95 < 500,
  policyHash: POLICY_HASH,
};
const reportFolder = resolve(
  process.argv.includes("--phase5")
    ? "artifacts/verification/phase-5"
    : "artifacts/verification/phase-4",
);
mkdirSync(reportFolder, { recursive: true });
writeFileSync(
  resolve(reportFolder, "benchmark.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (!report.passesTarget) process.exitCode = 1;
