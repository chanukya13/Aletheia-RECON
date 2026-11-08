import type { AssertionData, CorpusData } from "@recon/contracts";
import { scientificHash } from "./integrity.js";
import { normalizedQuantity } from "./quantities.js";
export function buildMaterialFingerprint(
  material: CorpusData["materials"][number],
  assertions: AssertionData[],
  candidates: CorpusData["candidates"],
  taxa: CorpusData["taxa"],
  assignments: CorpusData["cases"][number]["baselineScenarioInput"]["assignments"],
) {
  const byId = new Map(assertions.map((a) => [a.id, a]));
  const dependencies = new Set<string>();
  let unknowns = 0;
  const scalar = (id: string): unknown => {
    dependencies.add(id);
    const a = byId.get(id);
    if (!a) throw new Error(`FINGERPRINT_ASSERTION_MISSING:${id}`);
    if (a.state === "unknown") {
      unknowns++;
      return { state: "unknown", reason: a.reason };
    }
    if (a.state === "not_applicable") {
      if (a.review.status !== "accepted" || a.review.reviewerType !== "human") {
        unknowns++;
        return { state: "unknown", reason: "not_reviewed" };
      }
      return { state: "not_applicable" };
    }
    if (a.state === "contested") {
      unknowns++;
      return { state: "contested" };
    }
    if (a.review.status !== "accepted" || a.review.reviewerType !== "human") {
      unknowns++;
      return { state: "unknown", reason: "not_reviewed" };
    }
    let value: unknown = a.value;
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      "value" in value &&
      "unit" in value &&
      typeof value.value === "number" &&
      typeof value.unit === "string"
    )
      value = normalizedQuantity(value.value, value.unit);
    return { state: a.state, value };
  };
  const sorted = (values: unknown[]) =>
    values.sort((a, b) => scientificHash(a).localeCompare(scientificHash(b)));
  const componentById = new Map(
    material.componentSlots.map((s) => {
      const assignment = assignments.find((a) => a.occurrenceId === s.id);
      const candidate = assignment
        ? candidates.find(
            (c) => c.id === assignment.candidateId && c.occurrenceId === s.id,
          )
        : null;
      const taxon = candidate?.taxonConceptId
        ? taxa.find((t) => t.id === candidate.taxonConceptId)
        : null;
      const identity = candidate
        ? {
            state: "explicit_assumption",
            proposedName: candidate.proposedName,
            taxon: taxon
              ? {
                  authority: taxon.authority,
                  datasetId: taxon.datasetId,
                  nameUsageId: taxon.nameUsageId,
                  acceptedUsageId: taxon.acceptedUsageId,
                  reportedName: taxon.reportedName,
                  reportedRank: taxon.reportedRank,
                  acceptedName: taxon.acceptedName,
                  acceptedRank: taxon.acceptedRank,
                  qualifiers: [...taxon.qualifiers].sort(),
                }
              : null,
          }
        : { state: "unresolved" };
      if (!candidate) unknowns++;
      return [
        s.id,
        {
          kind: s.kind,
          recordedTerm: scalar(s.termAssertionId),
          identity,
          part: scalar(s.partAssertionId),
          state: scalar(s.stateAssertionId),
          quantities: sorted(
            s.quantityIds.map((id) => {
              const q = material.quantities.find((q) => q.id === id);
              if (!q) throw new Error("FINGERPRINT_QUANTITY_MISSING");
              return {
                assertion: scalar(q.assertionId),
                basis: q.basis,
                dimension: q.dimension,
              };
            }),
          ),
        },
      ] as const;
    }),
  );
  const stepKeys = new Map<string, string>(),
    visiting = new Set<string>();
  const nodes: unknown[] = [];
  const stepKey = (id: string): string => {
    if (visiting.has(id)) throw new Error("PROCESS_CYCLE");
    if (stepKeys.has(id)) return stepKeys.get(id)!;
    visiting.add(id);
    const s = material.steps.find((s) => s.id === id);
    if (!s) throw new Error("FINGERPRINT_STEP_MISSING");
    s.detailAssertionIds
      .filter((id) => byId.get(id)?.field === "preparation.order")
      .forEach((id) => dependencies.add(id));
    const node = {
      operation: scalar(s.operationAssertionId),
      details: sorted(
        s.detailAssertionIds
          .filter((id) => byId.get(id)?.field !== "preparation.order")
          .map(scalar),
      ),
      inputs: sorted(
        s.inputSlotIds.map(
          (id) => componentById.get(id) ?? { state: "unknown" },
        ),
      ),
      predecessors: s.followsStepIds.map(stepKey).sort(),
    };
    const key = scientificHash(node);
    stepKeys.set(id, key);
    nodes.push(node);
    visiting.delete(id);
    return key;
  };
  material.steps.forEach((s) => stepKey(s.id));
  const quantities = sorted(
    material.quantities.map((q) => ({
      basis: q.basis,
      dimension: q.dimension,
      assertion: scalar(q.assertionId),
      equalComponents: sorted(
        q.equalToSlotIds.map(
          (id) => componentById.get(id) ?? { state: "unknown" },
        ),
      ),
    })),
  );
  const exclusions = sorted(
    material.assertionIds
      .map((id) => byId.get(id)!)
      .filter(
        (a) =>
          a?.field === "ingredient.absence" ||
          a?.field === "preparation.negated",
      )
      .map((a) => ({ field: a.field, value: scalar(a.id) })),
  );
  const unassigned = sorted(
    material.assertionIds
      .filter(
        (id) =>
          !dependencies.has(id) &&
          /^(material\.|ingredient\.identity|preparation\.(temperature|duration|contact|matrix)|quantity\.)/.test(
            byId.get(id)?.field ?? "",
          ),
      )
      .map((id) => ({ field: byId.get(id)!.field, value: scalar(id) })),
  );
  const payload = {
    version: "material-fingerprint-v1",
    coverage: "recorded_components_only",
    kind: material.kind,
    representation: material.representation,
    components: sorted([...componentById.values()]),
    steps: sorted(nodes),
    quantities,
    exclusions,
    unassigned,
  };
  return {
    payload: JSON.parse(
      JSON.stringify(payload),
    ) as CorpusData["materials"][number]["fingerprintPayload"],
    hash: scientificHash(payload),
    dependencyIds: [...dependencies].sort(),
    unknownCount: unknowns,
  };
}
