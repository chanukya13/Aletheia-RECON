import {
  ComparisonPolicy,
  ComparisonResult,
  Dimension,
  type AssertionData,
  type CorpusData,
} from "@recon/contracts";
import { scientificHash } from "./integrity.js";
import { normalizedQuantity } from "./quantities.js";
type Material = CorpusData["materials"][number];
type Finding = ReturnType<
  typeof ComparisonResult.parse
>["materialComparison"]["dimensions"][number];
const definitions: Record<string, string> = {
  ASSERTION_NOT_REVIEWED:
    "A required assertion has not been independently accepted by a declared human reviewer.",
  FIELD_NOT_REPORTED: "Required information is absent or unresolved.",
  RECORDED_MATCH: "Accepted recorded inputs match on this dimension only.",
  RECORDED_DIFFERENCE:
    "Accepted recorded inputs differ; no chemical or biological consequence is inferred.",
  WHOLE_MIXTURE_VS_COMPONENT:
    "A full mixture and a constituent are different comparison scopes.",
  TAXON_UNRESOLVED:
    "Historical mapping or sufficiently specific modern identity is unresolved.",
  IDENTITY_SPECIFICITY_LOSS:
    "Genus or broader identity cannot establish species correspondence.",
  QUANTITY_BASIS_UNKNOWN:
    "Amounts require a known compatible basis; unknown is not zero.",
  PROCESS_ORDER_UNKNOWN: "Decisive process ordering is not established.",
  CHARACTERIZATION_NOT_REPORTED:
    "Voucher, batch, origin and chemistry do not establish authenticated equivalence.",
  HISTORICAL_INDICATION_UNMAPPED:
    "Historical indication has no validated modern diagnosis mapping.",
};
export const MATERIAL_POLICY = ComparisonPolicy.parse({
  id: "material-audit-v1",
  version: "1.1.0",
  scope: "full_material",
  criticalDimensions: Dimension.options.filter((d) => d !== "characterization"),
  contextualDimensions: ["characterization"],
  reasonCodes: Object.entries(definitions).map(([code, definition]) => ({
    code,
    definition,
    requiredFields: [
      "accepted human assertions or explicit scenario assumptions",
      "source references",
    ],
  })),
});
export const POLICY_HASH = scientificHash(MATERIAL_POLICY);
const reviewed = (a: AssertionData | undefined) =>
  Boolean(
    a &&
      a.review.status === "accepted" &&
      a.review.reviewerType === "human" &&
      ["recorded", "not_applicable"].includes(a.state),
  );
export function aggregateFindings(dimensions: Finding[]) {
  return dimensions.some(
    (d) =>
      MATERIAL_POLICY.criticalDimensions.includes(d.dimension) &&
      d.state === "mismatch",
  )
    ? ("materially_incompatible" as const)
    : dimensions.some(
          (d) =>
            MATERIAL_POLICY.criticalDimensions.includes(d.dimension) &&
            d.state === "unknown",
        )
      ? ("insufficient_information" as const)
      : dimensions.some((d) => d.state === "unknown" || d.state === "mismatch")
        ? ("partial_match" as const)
        : ("comparable_on_recorded_dimensions" as const);
}
export function compareMaterials(
  data: CorpusData,
  left: Material,
  right: Material,
  assignments: CorpusData["cases"][number]["baselineScenarioInput"]["assignments"] = [],
  rightAssignments: CorpusData["cases"][number]["baselineScenarioInput"]["assignments"] = [],
  hypotheticalIds: string[] = [],
): Finding[] {
  const hypothesisSet = new Set(hypotheticalIds);
  const accepted = (a: AssertionData | undefined) =>
    reviewed(a) ||
    Boolean(
      a &&
        hypothesisSet.has(a.id) &&
        a.origin === "user_hypothesis" &&
        a.state === "inferred",
    );
  const map = new Map(data.assertions.map((a) => [a.id, a]));
  const facts = (m: Material, re: RegExp) =>
    m.assertionIds
      .map((id) => map.get(id)!)
      .filter((a) => a && re.test(a.field));
  const fields: Record<Finding["dimension"], RegExp> = {
    identity: /^(ingredient.identity|identity\.|material.reportedPlants)/,
    composition: /^material.composition$/,
    part_state: /^ingredient.(part|state)/,
    preparation:
      /^(preparation.(operation|processing|matrix)|historical.preparation)$/,
    processing_order: /^preparation.(order|processing)$/,
    contact: /^preparation.contact$/,
    maturation_thermal: /^preparation.(duration|temperature|processing)$/,
    quantity: /^quantity\./,
    characterization: /^characterization\./,
  };
  return Dimension.options.map((dimension) => {
    let la = facts(left, fields[dimension]),
      ra = facts(right, fields[dimension]);
    if (dimension === "part_state") {
      la = left.componentSlots.flatMap((s) => [
        map.get(s.partAssertionId)!,
        map.get(s.stateAssertionId)!,
      ]);
      ra = right.componentSlots.flatMap((s) => [
        map.get(s.partAssertionId)!,
        map.get(s.stateAssertionId)!,
      ]);
    }
    const hypothesisIds: string[] = [];
    let state: Finding["state"] = "unknown";
    let code =
      dimension === "quantity"
        ? "QUANTITY_BASIS_UNKNOWN"
        : dimension === "processing_order"
          ? "PROCESS_ORDER_UNKNOWN"
          : dimension === "characterization"
            ? "CHARACTERIZATION_NOT_REPORTED"
            : "FIELD_NOT_REPORTED";
    const values = (as: AssertionData[]) =>
      as
        .map((a) =>
          a.state === "recorded" ||
          (a.state === "inferred" && hypothesisSet.has(a.id))
            ? a.value
            : { state: a.state },
        )
        .sort((a, b) => scientificHash(a).localeCompare(scientificHash(b)));
    if (la.length && ra.length && [...la, ...ra].every(accepted)) {
      state =
        scientificHash(values(la)) === scientificHash(values(ra))
          ? "match"
          : "mismatch";
      code = state === "match" ? "RECORDED_MATCH" : "RECORDED_DIFFERENCE";
    } else if ([...la, ...ra].some((a) => !accepted(a)))
      code = "ASSERTION_NOT_REVIEWED";
    if (
      dimension === "composition" &&
      (left.kind === "mixture") !== (right.kind === "mixture")
    ) {
      state = "mismatch";
      code = "WHOLE_MIXTURE_VS_COMPONENT";
    }
    // Slot kinds/positions are structural, never proof that a component list is exhaustive.
    if (dimension === "identity") {
      const identities = (m: Material, scenario: boolean): string[] | null => {
        if (!m.componentSlots.length) return null;
        const names: string[] = [];
        for (const slot of m.componentSlots) {
          const choice = (scenario ? assignments : rightAssignments).find(
            (a) => a.occurrenceId === slot.id,
          );
          const candidate = data.candidates.find(
            (c) => c.id === choice?.candidateId && c.occurrenceId === slot.id,
          );
          const taxon = data.taxa.find(
            (t) => t.id === candidate?.taxonConceptId,
          );
          if (
            choice &&
            candidate &&
            candidate.status !== "rejected" &&
            taxon &&
            ["SPECIES", "SUBSPECIES", "VARIETY", "FORM"].includes(
              taxon.acceptedRank,
            )
          ) {
            hypothesisIds.push(candidate.id);
            (scenario ? la : ra).push(
              ...candidate.supportAssertionIds
                .map((id) => map.get(id)!)
                .filter(Boolean),
            );
            names.push(`${taxon.datasetId}:${taxon.acceptedUsageId}`);
            continue;
          }
          const assertion = facts(m, /^ingredient.identity/).find((a) =>
            a.references.some(
              (ref) =>
                ref.kind === "span" &&
                map
                  .get(slot.termAssertionId)
                  ?.references.some(
                    (other) =>
                      other.kind === "span" && other.spanId === ref.spanId,
                  ),
            ),
          );
          if (!accepted(assertion) || assertion?.state !== "recorded")
            return null;
          const v = assertion.value;
          if (
            !v ||
            typeof v !== "object" ||
            Array.isArray(v) ||
            !("acceptedUsageId" in v) ||
            !("rank" in v) ||
            !["SPECIES", "SUBSPECIES", "VARIETY", "FORM"].includes(
              String(v.rank),
            )
          )
            return null;
          if (typeof v.datasetId !== "string") return null;
          names.push(`${v.datasetId}:${v.acceptedUsageId}`);
        }
        return names.sort();
      };
      const a = identities(left, true),
        b = identities(right, false);
      state =
        a && b
          ? scientificHash(a) === scientificHash(b)
            ? "match"
            : "mismatch"
          : "unknown";
      code =
        state === "unknown"
          ? "TAXON_UNRESOLVED"
          : state === "match"
            ? "RECORDED_MATCH"
            : "RECORDED_DIFFERENCE";
    }
    if (dimension === "quantity" && state !== "unknown") {
      const q = [...left.quantities, ...right.quantities];
      if (!q.length || q.some((q) => q.basis === "unknown")) {
        state = "unknown";
        code = "QUANTITY_BASIS_UNKNOWN";
      } else {
        const signature = (m: Material) => {
          if (
            m.componentSlots.some(
              (slot) =>
                !m.quantities.some(
                  (q) =>
                    slot.quantityIds.includes(q.id) ||
                    q.equalToSlotIds.includes(slot.id),
                ),
            )
          )
            return null;
          const rows = [];
          for (const q of m.quantities) {
            const targets = m.componentSlots.filter(
              (slot) =>
                slot.quantityIds.includes(q.id) ||
                q.equalToSlotIds.includes(slot.id),
            );
            if (
              !targets.length ||
              targets.some((slot) => !accepted(map.get(slot.termAssertionId)))
            )
              return null;
            const amount =
              q.value !== undefined && q.unit
                ? normalizedQuantity(q.value, q.unit)
                : null;
            if (!amount || !amount.normalized || amount.dimension !== q.basis)
              return null;
            rows.push({
              basis: q.basis,
              amount,
              targets: targets
                .map((slot) => values([map.get(slot.termAssertionId)!]))
                .sort((a, b) =>
                  scientificHash(a).localeCompare(scientificHash(b)),
                ),
            });
          }
          return rows.sort((a, b) =>
            scientificHash(a).localeCompare(scientificHash(b)),
          );
        };
        const a = signature(left),
          b = signature(right);
        state =
          a && b
            ? scientificHash(a) === scientificHash(b)
              ? "match"
              : "mismatch"
            : "unknown";
        code =
          state === "unknown"
            ? "QUANTITY_BASIS_UNKNOWN"
            : state === "match"
              ? "RECORDED_MATCH"
              : "RECORDED_DIFFERENCE";
      }
    }
    if (
      dimension === "processing_order" &&
      (!left.steps.length || !right.steps.length)
    ) {
      state = "unknown";
      code = "PROCESS_ORDER_UNKNOWN";
    }
    // A free-text methods summary is not a normalized preparation or order model.
    if (
      ["preparation", "processing_order", "maturation_thermal"].includes(
        dimension,
      ) &&
      [...la, ...ra].some((a) => a.field === "preparation.processing")
    ) {
      state = "unknown";
      code = "FIELD_NOT_REPORTED";
    }
    if (
      dimension === "composition" &&
      state !== "unknown" &&
      code !== "WHOLE_MIXTURE_VS_COMPONENT"
    ) {
      const complete = (as: AssertionData[]) =>
        as.length === 1 &&
        as[0]?.state === "recorded" &&
        typeof as[0].value === "object" &&
        as[0].value !== null &&
        !Array.isArray(as[0].value) &&
        "complete" in as[0].value &&
        as[0].value.complete === true;
      if (!complete(la) || !complete(ra)) {
        state = "unknown";
        code = "FIELD_NOT_REPORTED";
      }
    }
    if (dimension === "part_state" && state !== "unknown") {
      const anchored = (m: Material) =>
        m.componentSlots.every((slot) =>
          accepted(map.get(slot.termAssertionId)),
        );
      if (!anchored(left) || !anchored(right)) {
        state = "unknown";
        code = "FIELD_NOT_REPORTED";
      } else {
        const signature = (m: Material) =>
          m.componentSlots
            .map((slot) => ({
              term: values([map.get(slot.termAssertionId)!]),
              part: values([map.get(slot.partAssertionId)!]),
              state: values([map.get(slot.stateAssertionId)!]),
            }))
            .sort((a, b) => scientificHash(a).localeCompare(scientificHash(b)));
        state =
          scientificHash(signature(left)) === scientificHash(signature(right))
            ? "match"
            : "mismatch";
      }
    }
    if (
      dimension === "quantity" &&
      state !== "unknown" &&
      scientificHash(left.quantities.map((q) => q.basis).sort()) !==
        scientificHash(right.quantities.map((q) => q.basis).sort())
    ) {
      state = "unknown";
      code = "QUANTITY_BASIS_UNKNOWN";
    }
    if (dimension === "preparation") {
      const signature = (m: Material) => {
        const ops = m.steps.map((step) => map.get(step.operationAssertionId));
        const matrix = facts(m, /^preparation.matrix$/);
        if (
          !ops.length ||
          !matrix.length ||
          [...ops, ...matrix].some((a) => !accepted(a))
        )
          return null;
        return {
          operations: ops
            .map((a) => (a?.state === "recorded" ? a.value : null))
            .sort((a, b) => scientificHash(a).localeCompare(scientificHash(b))),
          matrix: values(matrix),
        };
      };
      const a = signature(left),
        b = signature(right);
      state =
        a && b
          ? scientificHash(a) === scientificHash(b)
            ? "match"
            : "mismatch"
          : "unknown";
      code =
        state === "unknown"
          ? "FIELD_NOT_REPORTED"
          : state === "match"
            ? "RECORDED_MATCH"
            : "RECORDED_DIFFERENCE";
    }
    if (dimension === "processing_order") {
      const signature = (m: Material) => {
        if (
          !m.steps.length ||
          !facts(m, /^preparation.order$/).some(reviewed) ||
          m.steps.some((step) => !accepted(map.get(step.operationAssertionId)))
        )
          return null;
        const visiting = new Set<string>();
        const key = (id: string): string => {
          if (visiting.has(id)) throw Error("PROCESS_CYCLE");
          visiting.add(id);
          const step = m.steps.find((s) => s.id === id);
          if (!step) throw Error("PROCESS_MISSING");
          const assertion = map.get(step.operationAssertionId)!;
          const payload = {
            operation: assertion.state === "recorded" ? assertion.value : null,
            predecessors: step.followsStepIds.map(key).sort(),
          };
          visiting.delete(id);
          return scientificHash(payload);
        };
        return m.steps.map((step) => key(step.id)).sort();
      };
      const a = signature(left),
        b = signature(right);
      state =
        a && b
          ? scientificHash(a) === scientificHash(b)
            ? "match"
            : "mismatch"
          : "unknown";
      code =
        state === "unknown"
          ? "PROCESS_ORDER_UNKNOWN"
          : state === "match"
            ? "RECORDED_MATCH"
            : "RECORDED_DIFFERENCE";
    }
    if (dimension === "maturation_thermal") {
      const signature = (m: Material) => {
        const duration = facts(m, /^preparation.duration$/),
          temperature = facts(m, /^preparation.temperature$/);
        if (
          !duration.length ||
          !temperature.length ||
          [...duration, ...temperature].some((a) => !accepted(a))
        )
          return null;
        return [...duration, ...temperature]
          .map((a) => {
            const v =
              a.state === "recorded" ||
              (a.state === "inferred" && hypothesisSet.has(a.id))
                ? a.value
                : null;
            return {
              field: a.field,
              value:
                v &&
                typeof v === "object" &&
                !Array.isArray(v) &&
                typeof v.value === "number" &&
                typeof v.unit === "string"
                  ? normalizedQuantity(v.value, v.unit)
                  : v,
            };
          })
          .sort((a, b) => scientificHash(a).localeCompare(scientificHash(b)));
      };
      const a = signature(left),
        b = signature(right);
      state =
        a && b
          ? scientificHash(a) === scientificHash(b)
            ? "match"
            : "mismatch"
          : "unknown";
      code =
        state === "unknown"
          ? "FIELD_NOT_REPORTED"
          : state === "match"
            ? "RECORDED_MATCH"
            : "RECORDED_DIFFERENCE";
    }
    const assertions = [
      ...new Map([...la, ...ra].map((a) => [a.id, a])).values(),
    ];
    return {
      dimension,
      state,
      reasonCodes: [code],
      assertionIds: assertions.map((a) => a.id).sort(),
      hypothesisIds: [
        ...new Set([
          ...hypothesisIds,
          ...assertions
            .filter((a) => hypothesisSet.has(a.id))
            .map((a) => `hypothesis-${a.id}`),
        ]),
      ].sort(),
      sourceReferences: assertions.flatMap((a) => a.references),
    };
  });
}
export function compareContext(
  data: CorpusData,
  leftIds: string[],
  rightIds: string[],
) {
  const keys = [
    "organism",
    "strain",
    "model",
    "endpoint",
    "setting",
    "exposure",
  ];
  const read = (ids: string[]) => {
    const values: Record<string, unknown> = {};
    for (const id of ids) {
      const a = data.assertions.find((a) => a.id === id);
      if (
        reviewed(a) &&
        a?.state === "recorded" &&
        a.value &&
        typeof a.value === "object" &&
        !Array.isArray(a.value)
      )
        for (const key of keys) if (key in a.value) values[key] = a.value[key];
    }
    return values;
  };
  const left = read(leftIds),
    right = read(rightIds);
  const mismatch = keys.some(
    (key) =>
      key in left &&
      key in right &&
      scientificHash(left[key]) !== scientificHash(right[key]),
  );
  const complete = keys.every((key) => key in left && key in right);
  return {
    verdict: mismatch
      ? ("different_context" as const)
      : complete
        ? ("aligned_on_recorded_context" as const)
        : ("context_not_established" as const),
    assertionIds: [...leftIds, ...rightIds],
    reasons: [
      mismatch
        ? "ASSAY_CONTEXT_DIFFERENT"
        : complete
          ? "RECORDED_CONTEXT_ALIGNED"
          : "HISTORICAL_INDICATION_UNMAPPED",
      "Recorded context correspondence never establishes clinical effectiveness or a validated historical diagnosis.",
    ],
  };
}
export function evaluateUnit(
  data: CorpusData,
  caseRecord: CorpusData["cases"][number],
  unit: CorpusData["evidenceUnits"][number],
  assignments = caseRecord.baselineScenarioInput.assignments,
  options: { dimensions?: Finding[]; hypotheticalIds?: string[] } = {},
) {
  const left = data.materials.find(
      (m) => m.id === caseRecord.materialVersionId,
    )!,
    right = data.materials.find((m) => m.id === unit.testedMaterialVersionId)!;
  const dimensions =
    options.dimensions ??
    compareMaterials(
      data,
      left,
      right,
      assignments,
      [],
      options.hypotheticalIds ?? [],
    );
  const contextIds = [
    ...caseRecord.historicalUseAssertionIds,
    ...unit.contextAssertionIds,
    unit.endpointAssertionId,
  ];
  const payload = {
    evidenceUnitId: unit.id,
    materialComparison: { verdict: aggregateFindings(dimensions), dimensions },
    contextComparison: compareContext(
      data,
      caseRecord.historicalUseAssertionIds,
      [...unit.contextAssertionIds, unit.endpointAssertionId],
    ),
    reportedOutcomeAssertionId: unit.outcomeAssertionId,
    dependencies: [
      ...new Set([
        ...dimensions.flatMap((d) => [...d.assertionIds, ...d.hypothesisIds]),
        ...left.assertionIds,
        ...right.assertionIds,
        ...contextIds,
        unit.comparatorAssertionId,
        unit.outcomeAssertionId,
        left.id,
        right.id,
        MATERIAL_POLICY.id,
      ]),
    ].sort(),
  };
  return ComparisonResult.parse({
    id: `comparison-${scientificHash(payload).slice(0, 24)}`,
    ...payload,
  });
}
