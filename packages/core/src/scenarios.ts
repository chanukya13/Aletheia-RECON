import { z } from "zod";
import {
  type CorpusData,
  type ScenarioInputData,
  type DomainData,
  type AuditInput,
  type CorrespondenceData,
  type ComparisonResult,
} from "@recon/contracts";
import { scientificHash } from "./integrity.js";
import { compareMaterials, evaluateUnit, MATERIAL_POLICY } from "./compare.js";
type Case = CorpusData["cases"][number];
type Result = z.infer<typeof ComparisonResult>;
type Group = DomainData["groups"][number];
export class ScenarioError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
const fail = (code: string, message: string): never => {
  throw new ScenarioError(code, message);
};
export function scientificScenario(input: ScenarioInputData) {
  return {
    assignments: [...input.assignments].sort((a, b) =>
      a.occurrenceId.localeCompare(b.occurrenceId),
    ),
    hypotheticalOverrides: input.hypotheticalOverrides
      .map((o) => ({ field: o.field, value: o.value }))
      .sort((a, b) => a.field.localeCompare(b.field)),
  };
}
export const scenarioHash = (input: ScenarioInputData) =>
  scientificHash(scientificScenario(input));
export function validateScenario(
  data: CorpusData,
  c: Case,
  input: ScenarioInputData,
) {
  const m = data.materials.find((m) => m.id === c.materialVersionId)!;
  const seen = new Set<string>();
  for (const a of input.assignments) {
    if (
      seen.has(a.occurrenceId) ||
      !m.componentSlots.some(
        (s) =>
          s.id === a.occurrenceId && s.candidateIds.includes(a.candidateId),
      ) ||
      data.candidates.find((c) => c.id === a.candidateId)?.status === "rejected"
    )
      fail(
        "INVALID_ASSIGNMENT",
        "Choose at most one available candidate per occurrence.",
      );
    seen.add(a.occurrenceId);
  }
  seen.clear();
  for (const o of input.hypotheticalOverrides) {
    const a = data.assertions.find((a) => a.id === o.field);
    if (
      seen.has(o.field) ||
      !m.assertionIds.includes(o.field) ||
      !a ||
      !["recorded", "unknown", "inferred"].includes(a.state)
    )
      fail(
        "INVALID_OVERRIDE",
        "Override a unique material assertion ID with a rationale.",
      );
    seen.add(o.field);
    if (
      !/^(ingredient\.(part|state)|preparation\.(duration|temperature|contact|matrix)|quantity\.)/.test(
        a!.field,
      )
    )
      fail(
        "UNSUPPORTED_OVERRIDE",
        "Only part/state, duration/temperature, contact/matrix and quantity assertions can be overridden.",
      );
    if (/part|state|contact|matrix/.test(a!.field)) {
      if (
        typeof o.value !== "string" ||
        !o.value.trim() ||
        o.value.length > 500
      )
        fail(
          "INVALID_OVERRIDE",
          "Use a bounded nonempty controlled text value.",
        );
    } else {
      const v = z
        .object({
          value: z.number().finite().min(0).max(1e9),
          unit: z.string().min(1).max(40),
          basis: z.enum(["mass", "volume", "count", "unknown"]).optional(),
        })
        .strict()
        .safeParse(o.value);
      if (!v.success)
        fail(
          "INVALID_OVERRIDE",
          "Use a finite amount/unit and explicit compatible basis.",
        );
      if (
        a!.field === "preparation.duration" &&
        !["second", "minute", "hour", "day"].includes(v.data!.unit)
      )
        fail("INVALID_OVERRIDE", "Unsupported duration unit.");
      if (a!.field === "preparation.temperature" && v.data!.unit !== "°C")
        fail("INVALID_OVERRIDE", "Use Celsius for a hypothetical temperature.");
    }
  }
  return input;
}
export function scenarioKind(data: CorpusData, input: ScenarioInputData) {
  return input.hypotheticalOverrides.length ||
    input.assignments.some(
      (a) =>
        data.candidates.find((c) => c.id === a.candidateId)?.status ===
        "inferred",
    )
    ? ("hypothetical" as const)
    : input.assignments.length
      ? ("source_interpretation" as const)
      : ("baseline" as const);
}
export const hypotheticalId = (field: string, value: unknown) =>
  `hypothesis-${scientificHash({ field, value }).slice(0, 24)}`;
export function applyScenario(
  data: CorpusData,
  c: Case,
  input: ScenarioInputData,
) {
  validateScenario(data, c, input);
  if (!input.hypotheticalOverrides.length)
    return { data, caseRecord: c, hypotheticalIds: [] as string[] };
  const copy = structuredClone(data),
    material = structuredClone(
      data.materials.find((m) => m.id === c.materialVersionId)!,
    );
  material.id = `scenario-material-${scenarioHash(input).slice(0, 24)}`;
  material.representation = "hypothetical";
  const hypotheticalIds: string[] = [];
  for (const o of input.hypotheticalOverrides) {
    const old = data.assertions.find((a) => a.id === o.field)!;
    const id = hypotheticalId(o.field, o.value);
    hypotheticalIds.push(id);
    copy.assertions.push({
      ...old,
      id,
      state: "inferred",
      value: o.value,
      origin: "user_hypothesis",
      rationale: o.rationale,
      inputAssertionIds: [old.id],
      review: {
        ...old.review,
        status: "pending",
        rationale: "Explicit scenario hypothesis, not source acceptance.",
      },
    });
    material.assertionIds = material.assertionIds.map((a) =>
      a === old.id ? id : a,
    );
    for (const slot of material.componentSlots) {
      if (slot.partAssertionId === old.id) slot.partAssertionId = id;
      if (slot.stateAssertionId === old.id) slot.stateAssertionId = id;
    }
    for (const step of material.steps)
      step.detailAssertionIds = step.detailAssertionIds.map((a) =>
        a === old.id ? id : a,
      );
    for (const q of material.quantities.filter(
      (q) => q.assertionId === old.id,
    )) {
      const v = o.value as {
        value: number;
        unit: string;
        basis?: "mass" | "volume" | "count" | "unknown";
      };
      q.assertionId = id;
      q.value = v.value;
      q.unit = v.unit;
      q.basis = v.basis ?? "unknown";
      q.dimension = q.basis;
    }
  }
  copy.materials.push(material);
  return {
    data: copy,
    caseRecord: { ...c, materialVersionId: material.id },
    hypotheticalIds,
  };
}
export function buildGroups(data: CorpusData, c: Case): Group[] {
  const m = data.materials.find((m) => m.id === c.materialVersionId)!;
  return m.componentSlots.flatMap((slot) => {
    const candidates = data.candidates.filter(
      (a) =>
        slot.candidateIds.includes(a.id) &&
        a.status === "documented_plausible" &&
        a.supportAssertionIds.some((id) =>
          data.assertions
            .find((a) => a.id === id)
            ?.references.some((r) => r.kind === "span"),
        ),
    );
    if (!candidates.length) return [];
    if (candidates.length > 4)
      fail(
        "DOMAIN_LIMIT_EXCEEDED",
        "An occurrence has more than four documented alternatives; curate a bounded group before auditing.",
      );
    return [
      {
        id: `group-${slot.id}`,
        occurrenceId: slot.id,
        label: `Interpret ${data.assertions.find((a) => a.id === slot.termAssertionId)?.state === "recorded" ? String((data.assertions.find((a) => a.id === slot.termAssertionId) as { value: unknown }).value) : slot.id}`,
        exhaustive: false as const,
        alternatives: candidates.map((a) => {
          const reviewed = a.supportAssertionIds.every((id) => {
            const p = data.assertions.find((p) => p.id === id);
            return (
              p?.state === "recorded" &&
              p.origin !== "user_hypothesis" &&
              p?.review.status === "accepted" &&
              p.review.reviewerType === "human"
            );
          });
          return {
            id: a.id,
            label: a.proposedName,
            assignments: [{ occurrenceId: slot.id, candidateId: a.id }],
            supportAssertionIds: a.supportAssertionIds,
            eligibleReviewed: reviewed,
            reviewState: reviewed ? ("reviewed" as const) : ("draft" as const),
          };
        }),
      },
    ];
  });
}
export type World = {
  id: string;
  choices: Record<string, string>;
  assignments: ScenarioInputData["assignments"];
};
export function enumerateWorlds(
  groups: Group[],
  base: ScenarioInputData,
  constraints: AuditInput["constraints"] = [],
) {
  if (base.hypotheticalOverrides.length)
    fail(
      "HYPOTHETICAL_DOMAIN",
      "Hypothetical overrides are excluded from a documented-alternative audit.",
    );
  if (groups.length > 4)
    fail("DOMAIN_LIMIT_EXCEEDED", "At most four groups are supported.");
  const ids = new Set<string>(),
    occurrences = new Set<string>();
  let rawWorldCount = 1;
  for (const g of groups) {
    if (
      ids.has(g.id) ||
      !g.alternatives.length ||
      g.alternatives.length > 4 ||
      occurrences.has(g.occurrenceId)
    )
      fail(
        "INVALID_DOMAIN",
        "Groups must be unique, nonempty, occurrence-scoped and have at most four alternatives.",
      );
    ids.add(g.id);
    occurrences.add(g.occurrenceId);
    const alts = new Set<string>();
    for (const a of g.alternatives) {
      if (
        alts.has(a.id) ||
        a.assignments.length !== 1 ||
        a.assignments[0]!.occurrenceId !== g.occurrenceId
      )
        fail(
          "INVALID_DOMAIN",
          "Alternative IDs and occurrence assignments must be unambiguous.",
        );
      alts.add(a.id);
    }
    rawWorldCount *= g.alternatives.length;
  }
  for (const constraint of constraints) {
    const mentioned = new Set<string>();
    for (const choice of constraint.forbidden) {
      if (
        mentioned.has(choice.groupId) ||
        !groups
          .find((g) => g.id === choice.groupId)
          ?.alternatives.some((a) => a.id === choice.alternativeId)
      )
        fail(
          "INVALID_CONSTRAINT",
          "A constraint must reference unique selected groups and existing alternatives.",
        );
      mentioned.add(choice.groupId);
    }
  }
  const worlds: World[] = [];
  const walk = (
    index: number,
    choices: Record<string, string>,
    assignments: ScenarioInputData["assignments"],
  ) => {
    if (index === groups.length) {
      if (
        constraints.some((c) =>
          c.forbidden.every((v) => choices[v.groupId] === v.alternativeId),
        )
      )
        return;
      const world = {
        choices,
        assignments: [...assignments].sort((a, b) =>
          a.occurrenceId.localeCompare(b.occurrenceId),
        ),
      };
      worlds.push({
        id: `world-${scientificHash(world).slice(0, 24)}`,
        ...world,
      });
      return;
    }
    const g = groups[index]!;
    for (const a of g.alternatives)
      walk(index + 1, { ...choices, [g.id]: a.id }, [
        ...assignments.filter((v) => v.occurrenceId !== g.occurrenceId),
        ...a.assignments,
      ]);
  };
  walk(0, {}, base.assignments);
  if (!worlds.length) fail("EMPTY_DOMAIN", "Constraints admit no worlds.");
  if (worlds.length > 64)
    fail(
      "DOMAIN_LIMIT_EXCEEDED",
      `${worlds.length} admissible worlds exceed the exact 64-world limit. No sampling was performed.`,
    );
  return { worlds, rawWorldCount };
}
export function deriveNameFacts(
  data: CorpusData,
  candidateIds?: string[],
): Record<string, string | null> {
  return Object.fromEntries(
    data.candidates
      .filter(
        (candidate) => !candidateIds || candidateIds.includes(candidate.id),
      )
      .map((candidate) => {
        const support = data.assertions.filter((a) =>
          candidate.supportAssertionIds.includes(a.id),
        );
        const passages = support
          .flatMap((a) =>
            a.references.flatMap((r) =>
              r.kind === "span"
                ? (data.spans.find((s) => s.id === r.spanId)?.exact ?? [])
                : [],
            ),
          )
          .join("\n");
        const name = candidate.proposedName.replace(/\?$/, "").trim();
        const alias =
          Array.from(passages.matchAll(/([A-Za-z]+)\s*\((Allium [A-Za-z]+)\)/g))
            .find((m) => m[2]?.toLowerCase() === name.toLowerCase())?.[1]
            ?.toLowerCase() ?? null;
        return [candidate.id, alias];
      }),
  );
}
export function reportedCorrespondence(
  data: CorpusData,
  c: Case,
  units: CorpusData["evidenceUnits"],
  input: ScenarioInputData,
  nameFacts?: Record<string, string | null>,
): CorrespondenceData[] {
  const rows: CorrespondenceData[] = [];
  const facts =
    nameFacts ??
    deriveNameFacts(
      data,
      input.assignments.map((a) => a.candidateId),
    );
  for (const choice of [...input.assignments].sort((a, b) =>
    a.occurrenceId.localeCompare(b.occurrenceId),
  )) {
    const candidate = data.candidates.find((a) => a.id === choice.candidateId)!;
    const name = candidate.proposedName.replace(/\?$/, "").trim();
    const literal = (value: unknown) =>
      typeof value === "string" &&
      value.toLowerCase().includes(name.toLowerCase());
    const alias = facts[candidate.id];
    for (const u of units) {
      const m = data.materials.find((m) => m.id === u.testedMaterialVersionId)!;
      const assertions = data.assertions.filter(
        (a) =>
          m.assertionIds.includes(a.id) && a.field === "material.composition",
      );
      let state: CorrespondenceData["state"] = "not_established";
      for (const a of assertions) {
        if (
          a.state !== "recorded" ||
          !a.value ||
          typeof a.value !== "object" ||
          Array.isArray(a.value) ||
          candidate.proposedName.endsWith("?")
        )
          continue;
        const v = a.value;
        if (alias && typeof v[alias] === "boolean")
          state = v[alias] ? "corresponds" : "differs";
        if (typeof v.cropleacInterpretation === "string")
          state = literal(v.cropleacInterpretation)
            ? "corresponds"
            : /Allium\s+(cepa|porrum)/i.test(v.cropleacInterpretation)
              ? "differs"
              : "not_established";
      }
      rows.push({
        evidenceUnitId: u.id,
        occurrenceId: choice.occurrenceId,
        candidateId: candidate.id,
        proposedName: candidate.proposedName,
        state,
        assertionIds: [
          ...candidate.supportAssertionIds,
          ...assertions.map((a) => a.id),
        ],
        limitation:
          "Conditional correspondence of source-reported names/ingredient labels. Draft support remains draft; this is neither taxonomic equivalence nor a strict material-identity verdict.",
      });
    }
  }
  return rows;
}
export function evaluateScenario(
  data: CorpusData,
  c: Case,
  units: CorpusData["evidenceUnits"],
  input: ScenarioInputData,
  memo?: Map<string, Result>,
  nameFacts?: Record<string, string | null>,
) {
  const applied = applyScenario(data, c, input),
    left = applied.data.materials.find(
      (m) => m.id === applied.caseRecord.materialVersionId,
    )!;
  const profiles = new Map<
    string,
    { dimensions: ReturnType<typeof compareMaterials>; hash: string }
  >();
  const results = units.map((unit) => {
    let profile = profiles.get(unit.testedMaterialVersionId);
    if (!profile) {
      const dimensions = compareMaterials(
        applied.data,
        left,
        applied.data.materials.find(
          (m) => m.id === unit.testedMaterialVersionId,
        )!,
        input.assignments,
        [],
        applied.hypotheticalIds,
      );
      profile = { dimensions, hash: scientificHash(dimensions) };
      profiles.set(unit.testedMaterialVersionId, profile);
    }
    const key = `${unit.id}:${left.id}:${profile.hash}`;
    let result = memo?.get(key);
    if (!result) {
      result = evaluateUnit(
        applied.data,
        applied.caseRecord,
        unit,
        input.assignments,
        {
          dimensions: profile.dimensions,
          hypotheticalIds: applied.hypotheticalIds,
        },
      );
      memo?.set(key, result);
    }
    return result;
  });
  return {
    results,
    correspondence: reportedCorrespondence(data, c, units, input, nameFacts),
    kind: scenarioKind(data, input),
  };
}
export function diffScenarios(
  data: CorpusData,
  c: Case,
  units: CorpusData["evidenceUnits"],
  before: ScenarioInputData,
  after: ScenarioInputData,
  nameFacts?: Record<string, string | null>,
) {
  validateScenario(data, c, before);
  validateScenario(data, c, after);
  const a = evaluateScenario(data, c, units, before, undefined, nameFacts);
  const beforeHash = scenarioHash(before),
    afterHash = scenarioHash(after);
  const changedIds = new Set<string>();
  for (const occurrence of new Set(
    [...before.assignments, ...after.assignments].map((a) => a.occurrenceId),
  )) {
    const x = before.assignments.find(
        (a) => a.occurrenceId === occurrence,
      )?.candidateId,
      y = after.assignments.find(
        (a) => a.occurrenceId === occurrence,
      )?.candidateId;
    if (x !== y) {
      changedIds.add(occurrence);
      if (x) changedIds.add(x);
      if (y) changedIds.add(y);
    }
  }
  for (const id of new Set(
    [...before.hypotheticalOverrides, ...after.hypotheticalOverrides].map(
      (o) => o.field,
    ),
  )) {
    const x = before.hypotheticalOverrides.find((o) => o.field === id)?.value,
      y = after.hypotheticalOverrides.find((o) => o.field === id)?.value;
    if (scientificHash(x ?? null) !== scientificHash(y ?? null))
      changedIds.add(id);
  }
  const material = data.materials.find((m) => m.id === c.materialVersionId)!;
  const affected = beforeHash !== afterHash && changedIds.size > 0;
  const b = affected
    ? evaluateScenario(data, c, units, after, undefined, nameFacts)
    : { ...a, kind: scenarioKind(data, after) };
  const changed: z.infer<
    typeof import("@recon/contracts").ScenarioDiff
  >["changed"] = [];
  const recomputedUnchangedIds: string[] = [],
    unaffectedIds: string[] = [];
  for (let i = 0; i < a.results.length; i++) {
    const x = a.results[i]!,
      y = b.results[i]!;
    if (!affected) {
      unaffectedIds.push(x.id);
      continue;
    }
    if (scientificHash(x) !== scientificHash(y))
      changed.push({
        resultId: y.id,
        before: x,
        after: y,
        changedDimensions: x.materialComparison.dimensions
          .filter(
            (d, j) =>
              scientificHash(d) !==
              scientificHash(y.materialComparison.dimensions[j]),
          )
          .map((d) => d.dimension),
      });
    else recomputedUnchangedIds.push(x.id);
  }
  const correspondenceState = (rows: CorrespondenceData[], id: string) =>
    rows
      .filter((r) => r.evidenceUnitId === id)
      .map((r) => ({ occurrenceId: r.occurrenceId, state: r.state }));
  const changedCorrespondenceUnitIds = units
    .filter(
      (u) =>
        scientificHash(correspondenceState(a.correspondence, u.id)) !==
        scientificHash(correspondenceState(b.correspondence, u.id)),
    )
    .map((u) => u.id);
  return {
    diff: {
      schemaVersion: "recon-v1" as const,
      beforeHash,
      afterHash,
      changed,
      recomputedUnchangedIds,
      unaffectedIds,
      fullRecomputeFallback: affected,
    },
    changedCorrespondenceUnitIds,
    beforeCorrespondence: a.correspondence,
    afterCorrespondence: b.correspondence,
    kind: b.kind,
    dependencyEdges: [...changedIds]
      .flatMap((from) => a.results.map((r) => ({ from, to: r.id })))
      .concat(
        a.results.flatMap((r) =>
          r.dependencies.map((from) => ({ from, to: r.id })),
        ),
      ),
    summary: affected
      ? `All selected comparisons depend on material ${material.id}; the bounded full-recompute fallback was used. Unchanged verdicts and changed correspondence are reported separately.`
      : "Scientific inputs are unchanged; rationale-only edits do not invalidate results.",
  };
}
export function classifyRobustness(
  verdicts: Result["materialComparison"]["verdict"][],
) {
  if (!verdicts.length) fail("EMPTY_DOMAIN", "No worlds to classify.");
  return verdicts.every((v) => v === "comparable_on_recorded_dimensions")
    ? ("robust_within_domain" as const)
    : verdicts.some((v) => v === "comparable_on_recorded_dimensions")
      ? ("interpretation_dependent" as const)
      : verdicts.every((v) => v === "materially_incompatible")
        ? ("mismatched_throughout_domain" as const)
        : ("undetermined" as const);
}
export function minimalQuestions(
  groupIds: string[],
  worlds: { choices: Record<string, string> }[],
  vectors: string[],
) {
  if (
    groupIds.length > 4 ||
    worlds.length > 64 ||
    new Set(groupIds).size !== groupIds.length
  )
    fail(
      "DOMAIN_LIMIT_EXCEEDED",
      "Question analysis supports at most four unique groups and 64 worlds.",
    );
  if (worlds.length !== vectors.length || !worlds.length)
    fail("INVALID_TARGET", "A target value is required for every world.");
  const sufficient = (set: string[]) => {
    for (let i = 0; i < worlds.length; i++)
      for (let j = i + 1; j < worlds.length; j++)
        if (
          set.every(
            (id) => worlds[i]!.choices[id] === worlds[j]!.choices[id],
          ) &&
          vectors[i] !== vectors[j]
        )
          return false;
    return true;
  };
  const subsets = Array.from({ length: 2 ** groupIds.length }, (_, mask) =>
    groupIds.filter((_, i) => mask & (1 << i)),
  ).sort((a, b) => a.length - b.length);
  const minimal: string[][] = [];
  for (const set of subsets)
    if (
      sufficient(set) &&
      !minimal.some((m) => m.every((id) => set.includes(id)))
    )
      minimal.push(set);
  return {
    sets: minimal,
    minimumCardinality: Math.min(...minimal.map((s) => s.length)),
  };
}
export function selectDomain(domain: DomainData, input: AuditInput) {
  const seen = new Set<string>(),
    excludedAlternatives: string[] = [];
  const groups = input.selections.map((s) => {
    if (seen.has(s.groupId)) fail("INVALID_DOMAIN", "Select each group once.");
    seen.add(s.groupId);
    const group = domain.groups.find((g) => g.id === s.groupId);
    if (!group || new Set(s.alternativeIds).size !== s.alternativeIds.length)
      fail("INVALID_DOMAIN", "Select unique existing alternatives.");
    const alternatives = s.alternativeIds.map((id) => {
      const a = group!.alternatives.find((a) => a.id === id);
      if (!a) fail("INVALID_DOMAIN", "Alternative not available.");
      if (input.mode === "reviewed" && !a!.eligibleReviewed)
        fail(
          "DOMAIN_REVIEW_REQUIRED",
          "This alternative is draft. Use explicitly labeled draft exploration or obtain a real source review.",
        );
      return a!;
    });
    excludedAlternatives.push(
      ...group!.alternatives
        .filter((a) => !s.alternativeIds.includes(a.id))
        .map((a) => a.id),
    );
    return { ...group!, alternatives };
  });
  if (excludedAlternatives.length && input.subsetRationale.trim().length < 3)
    fail(
      "SUBSET_RATIONALE_REQUIRED",
      "Explain why alternatives were excluded; the subset is not exhaustive.",
    );
  if (input.mode === "reviewed" && input.constraints.length)
    fail(
      "CONSTRAINT_REVIEW_REQUIRED",
      "User-defined correlation constraints are hypotheses and require draft exploration.",
    );
  return {
    ...enumerateWorlds(groups, input.scenario, input.constraints),
    groups,
    excludedAlternatives,
  };
}
export function runRobustness(
  data: CorpusData,
  c: Case,
  units: CorpusData["evidenceUnits"],
  domain: DomainData,
  input: AuditInput,
  nameFacts?: Record<string, string | null>,
) {
  validateScenario(data, c, input.scenario);
  if (scenarioKind(data, input.scenario) === "hypothetical")
    fail(
      "HYPOTHETICAL_DOMAIN",
      "Hypothetical inputs cannot enter documented-alternative enumeration.",
    );
  if (
    !units.length ||
    units.length > 50 ||
    new Set(units.map((u) => u.id)).size !== units.length
  )
    fail("EVIDENCE_LIMIT_EXCEEDED", "Select 1–50 distinct evidence units.");
  if (
    input.mode === "reviewed" &&
    input.scenario.assignments.some(
      (a) =>
        !domain.groups.some((g) =>
          g.alternatives.some(
            (alt) =>
              alt.eligibleReviewed &&
              alt.assignments.some(
                (v) =>
                  v.occurrenceId === a.occurrenceId &&
                  v.candidateId === a.candidateId,
              ),
          ),
        ),
    )
  )
    fail(
      "DOMAIN_REVIEW_REQUIRED",
      "A fixed interpretation is draft; use draft exploration or keep the reviewed baseline unresolved.",
    );
  if (input.target === "named_dimension_vector" && !input.targetDimension)
    fail("INVALID_TARGET", "Choose the named target dimension.");
  const selected = selectDomain(domain, input);
  const resultMemo = new Map<string, Result>();
  const evaluated = selected.worlds.map((w) => ({
    ...w,
    ...evaluateScenario(
      data,
      c,
      units,
      { ...input.scenario, assignments: w.assignments },
      resultMemo,
      nameFacts,
    ),
  }));
  const targetFor = (world: (typeof evaluated)[number], unitId: string) =>
    input.target === "conditional_identity_vector"
      ? world.correspondence
          .filter((r) => r.evidenceUnitId === unitId)
          .map((r) => ({ occurrenceId: r.occurrenceId, state: r.state }))
      : input.target === "named_dimension_vector"
        ? world.results
            .find((r) => r.evidenceUnitId === unitId)!
            .materialComparison.dimensions.find(
              (d) => d.dimension === input.targetDimension,
            )!.state
        : world.results.find((r) => r.evidenceUnitId === unitId)!
            .materialComparison.verdict;
  // Reuse target hashes for every pairwise question check; never re-evaluate a world.
  const targetHashes = evaluated.map(
    (w) =>
      new Map(units.map((u) => [u.id, scientificHash(targetFor(w, u.id))])),
  );
  const vectors = targetHashes.map((values) =>
    scientificHash([...values.values()]),
  );
  const questions = minimalQuestions(
    selected.groups.map((g) => g.id),
    evaluated,
    vectors,
  );
  const missing = new Map<
    string,
    {
      field: string;
      reason: string;
      sourceReferences: Result["materialComparison"]["dimensions"][number]["sourceReferences"];
      affectedResultIds: string[];
      dependencyCount: number;
    }
  >();
  // Memoized results can occur in many worlds. Their provenance is identical.
  const distinctResults = new Set(evaluated.flatMap((w) => w.results));
  for (const r of distinctResults)
    for (const finding of r.materialComparison.dimensions.filter(
      (d) => d.state === "unknown",
    )) {
      const key = `${finding.dimension}:${finding.reasonCodes.join(",")}`;
      const row = missing.get(key) ?? {
        field: finding.dimension,
        reason: finding.reasonCodes.join(", "),
        sourceReferences: [],
        affectedResultIds: [],
        dependencyCount: 0,
      };
      row.sourceReferences = [
        ...new Map(
          [...row.sourceReferences, ...finding.sourceReferences].map((ref) => [
            ref.kind === "span"
              ? `s/${ref.spanId}`
              : `m/${ref.sourceRevisionId}/${ref.field}`,
            ref,
          ]),
        ).values(),
      ];
      if (!row.affectedResultIds.includes(r.evidenceUnitId))
        row.affectedResultIds.push(r.evidenceUnitId);
      row.dependencyCount = row.affectedResultIds.length;
      missing.set(key, row);
    }
  const unitsSummary = units.map((u) => {
    const verdicts = evaluated.map(
      (w) =>
        w.results.find((r) => r.evidenceUnitId === u.id)!.materialComparison
          .verdict,
    );
    return {
      evidenceUnitId: u.id,
      status: classifyRobustness(verdicts),
      comparableWorldCount: verdicts.filter(
        (v) => v === "comparable_on_recorded_dimensions",
      ).length,
      verdictCounts: {
        materially_incompatible: verdicts.filter(
          (v) => v === "materially_incompatible",
        ).length,
        insufficient_information: verdicts.filter(
          (v) => v === "insufficient_information",
        ).length,
        partial_match: verdicts.filter((v) => v === "partial_match").length,
        comparable_on_recorded_dimensions: verdicts.filter(
          (v) => v === "comparable_on_recorded_dimensions",
        ).length,
      },
    };
  });
  const corresponds = (w: (typeof evaluated)[number], id: string) => {
    const rows = w.correspondence.filter((r) => r.evidenceUnitId === id);
    return rows.length > 0 && rows.every((r) => r.state === "corresponds");
  };
  const studyCoverage = [...new Set(units.map((u) => u.studyId))].map(
    (studyId) => {
      const arms = units.filter((u) => u.studyId === studyId);
      return {
        studyId,
        worldsWithAnyCorrespondence: evaluated.filter((w) =>
          arms.some((u) => corresponds(w, u.id)),
        ).length,
        fixedCorrespondingArmIds: arms
          .filter((u) => evaluated.every((w) => corresponds(w, u.id)))
          .map((u) => u.id),
        worldsWithAnyComparableMaterial: evaluated.filter((w) =>
          arms.some(
            (u) =>
              w.results.find((r) => r.evidenceUnitId === u.id)!
                .materialComparison.verdict ===
              "comparable_on_recorded_dimensions",
          ),
        ).length,
        fixedComparableArmIds: arms
          .filter((u) =>
            evaluated.every(
              (w) =>
                w.results.find((r) => r.evidenceUnitId === u.id)!
                  .materialComparison.verdict ===
                "comparable_on_recorded_dimensions",
            ),
          )
          .map((u) => u.id),
      };
    },
  );
  return {
    selected,
    audit: {
      schemaVersion: "recon-v1" as const,
      caseId: c.id,
      caseRevision: c.revision,
      policyId: MATERIAL_POLICY.id,
      groupIds: selected.groups.map((g) => g.id),
      worldCount: evaluated.length,
      exhaustiveWithinDocumentedDomain: input.mode === "reviewed",
      candidateListExhaustive: false,
      domainLimitation: `Exact only within the selected ${input.mode === "reviewed" ? "reviewed" : "source-backed draft"} alternatives. Candidate lists are not exhaustive. ${selected.excludedAlternatives.length} alternatives excluded by explicit subset selection. No count is a probability or biological prediction.`,
      worlds: evaluated.map((w) => ({
        id: w.id,
        assignments: w.assignments,
        results: w.results,
      })),
      units: unitsSummary,
    },
    correspondence: evaluated.map((w) => ({
      worldId: w.id,
      items: w.correspondence,
    })),
    studyCoverage,
    clarification: {
      target: input.target,
      targetDimension:
        input.target === "named_dimension_vector"
          ? input.targetDimension
          : null,
      inclusionMinimalSufficientSets: questions.sets,
      minimumCardinality: questions.minimumCardinality,
      singleGroupEffects: selected.groups.map((g) => {
        let independentlyVariable = false;
        const changedResultIds = new Set<string>();
        for (let i = 0; i < evaluated.length; i++)
          for (let j = i + 1; j < evaluated.length; j++) {
            const a = evaluated[i]!,
              b = evaluated[j]!;
            if (
              a.choices[g.id] === b.choices[g.id] ||
              selected.groups.some(
                (other) =>
                  other.id !== g.id &&
                  a.choices[other.id] !== b.choices[other.id],
              )
            )
              continue;
            independentlyVariable = true;
            for (const u of units)
              if (targetHashes[i]!.get(u.id) !== targetHashes[j]!.get(u.id))
                changedResultIds.add(u.id);
          }
        return {
          groupId: g.id,
          independentlyVariable,
          changedResultIds: [...changedResultIds],
          rationale: !independentlyVariable
            ? "No admissible pair differs solely in this group; an independent effect cannot be claimed."
            : changedResultIds.size
              ? "At least one admissible pair changes the declared target. This does not establish biological importance."
              : "This group cannot change the declared target within these worlds.",
        };
      }),
      missingDocumentation: [...missing.values()].sort(
        (a, b) =>
          b.dependencyCount - a.dependencyCount ||
          a.field.localeCompare(b.field),
      ),
    },
  };
}
