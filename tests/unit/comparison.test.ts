import { describe, it, expect } from "vitest";
import {
  aggregateFindings,
  compareContext,
  compareMaterials,
  evaluateUnit,
  MATERIAL_POLICY,
} from "@recon/core";
import { loadCorpus } from "../../apps/server/src/database.js";
describe("material-audit-v1 conservative comparisons", () => {
  it("uses explicit assumptions independently on both sides and retains species-level normalization", () => {
    const d = loadCorpus(),
      left = structuredClone(d.materials[0]!),
      right = structuredClone(left);
    left.componentSlots = left.componentSlots.slice(0, 1);
    right.componentSlots = right.componentSlots.slice(0, 1);
    const template = {
      authority: "Synthetic test authority",
      datasetId: "synthetic-dataset",
      snapshotId: "test-snapshot",
      nameUsageId: "synthetic-usage",
      acceptedUsageId: "species-a",
      reportedName: "Synthetic species",
      reportedRank: "SPECIES",
      acceptedName: "Synthetic species",
      acceptedRank: "SPECIES",
      qualifiers: [],
      sourceRevisionId: d.sourceRevisions[0]!.id,
    };
    d.taxa.push(
      { ...template, id: "synthetic-taxon-a" },
      { ...template, id: "synthetic-taxon-b", acceptedUsageId: "species-b" },
    );
    d.candidates.find((c) => c.id === "candidate-onion")!.taxonConceptId =
      "synthetic-taxon-a";
    d.candidates.find((c) => c.id === "candidate-leek")!.taxonConceptId =
      "synthetic-taxon-b";
    const onion = [
        { occurrenceId: "slot-cropleek", candidateId: "candidate-onion" },
      ],
      leek = [{ occurrenceId: "slot-cropleek", candidateId: "candidate-leek" }];
    expect(
      compareMaterials(d, left, right, onion, onion).find(
        (f) => f.dimension === "identity",
      )!.state,
    ).toBe("match");
    const changed = compareMaterials(d, left, right, onion, leek).find(
      (f) => f.dimension === "identity",
    )!;
    expect(changed.state).toBe("mismatch");
    expect(changed.assertionIds).toEqual(
      expect.arrayContaining(["a-onion-proposal", "a-leek-proposal"]),
    );
    expect(
      compareMaterials(d, right, left, leek, onion).find(
        (f) => f.dimension === "identity",
      )!.state,
    ).toBe("mismatch");
    d.taxa[0]!.acceptedRank = "GENUS";
    expect(
      compareMaterials(d, left, right, onion, onion).find(
        (f) => f.dimension === "identity",
      )!.state,
    ).toBe("unknown");
  });
  it("keeps numerical amounts attached to occurrences instead of matching an unbound multiset", () => {
    const d = loadCorpus(),
      left = structuredClone(d.materials[0]!),
      right = structuredClone(left);
    const template = d.assertions.find((a) => a.id === "a-nine-days")!;
    for (const slot of left.componentSlots) {
      const term = d.assertions.find((a) => a.id === slot.termAssertionId)!;
      term.review = {
        ...term.review,
        status: "accepted",
        reviewerType: "human",
      };
    }
    for (const [id, value] of [
      ["amount-a", 1],
      ["amount-b", 2],
    ] as const)
      d.assertions.push({
        ...template,
        id,
        field: "quantity.amount",
        state: "recorded",
        value: { value, unit: "g" },
        review: {
          ...template.review,
          status: "accepted",
          reviewerType: "human",
        },
      });
    for (const m of [left, right]) {
      m.componentSlots = m.componentSlots.slice(0, 2);
      m.assertionIds = ["amount-a", "amount-b"];
      m.quantities = [
        {
          id: "qa",
          assertionId: "amount-a",
          raw: "1 g",
          basis: "mass",
          dimension: "mass",
          value: 1,
          unit: "g",
          equalToSlotIds: [],
        },
        {
          id: "qb",
          assertionId: "amount-b",
          raw: "2 g",
          basis: "mass",
          dimension: "mass",
          value: 2,
          unit: "g",
          equalToSlotIds: [],
        },
      ];
      m.componentSlots[0]!.quantityIds = ["qa"];
      m.componentSlots[1]!.quantityIds = ["qb"];
    }
    expect(
      compareMaterials(d, left, right).find((f) => f.dimension === "quantity")!
        .state,
    ).toBe("match");
    for (const m of [left, right]) m.quantities[0]!.unit = "historical-spoon";
    expect(
      compareMaterials(d, left, right).find((f) => f.dimension === "quantity")!
        .state,
    ).toBe("unknown");
    for (const m of [left, right]) m.quantities[0]!.unit = "g";
    right.componentSlots[0]!.quantityIds = ["qb"];
    right.componentSlots[1]!.quantityIds = ["qa"];
    expect(
      compareMaterials(d, left, right).find((f) => f.dimension === "quantity")!
        .state,
    ).toBe("mismatch");
    right.componentSlots[1]!.quantityIds = [];
    expect(
      compareMaterials(d, left, right).find((f) => f.dimension === "quantity")!
        .state,
    ).toBe("unknown");
  });
  it("compares reviewed process DAGs independently of record IDs and preserves known order differences", () => {
    const d = loadCorpus(),
      left = structuredClone(d.materials[0]!),
      right = structuredClone(left);
    const template = d.assertions.find((a) => a.id === "a-nine-days")!;
    for (const [id, field, value] of [
      ["test-mix", "preparation.operation", "mix"],
      ["test-strain", "preparation.operation", "strain"],
      ["test-order", "preparation.order", "Explicit source order"],
      ["test-matrix", "preparation.matrix", "wine"],
    ] as const)
      d.assertions.push({
        ...template,
        id,
        field,
        state: "recorded",
        value,
        review: {
          ...template.review,
          status: "accepted",
          reviewerType: "human",
        },
      });
    for (const m of [left, right]) {
      m.assertionIds = ["test-mix", "test-strain", "test-order", "test-matrix"];
      m.steps = [
        {
          id: "first",
          operationAssertionId: "test-mix",
          inputSlotIds: [],
          followsStepIds: [],
          detailAssertionIds: [],
        },
        {
          id: "second",
          operationAssertionId: "test-strain",
          inputSlotIds: [],
          followsStepIds: ["first"],
          detailAssertionIds: [],
        },
      ];
    }
    expect(
      compareMaterials(d, left, right).find(
        (f) => f.dimension === "processing_order",
      )!.state,
    ).toBe("match");
    right.steps[0]!.followsStepIds = ["second"];
    right.steps[1]!.followsStepIds = [];
    const findings = compareMaterials(d, left, right);
    expect(
      findings.find((f) => f.dimension === "processing_order")!.state,
    ).toBe("mismatch");
    expect(findings.find((f) => f.dimension === "preparation")!.state).toBe(
      "match",
    );
    expect(aggregateFindings(findings)).toBe("materially_incompatible");
  });
  it("compares explicitly recorded assay context without a disease crosswalk", () => {
    const d = loadCorpus(),
      left = d.assertions.find((a) => a.id === "a-eye-use")!,
      right = d.assertions.find(
        (a) => a.id === d.evidenceUnits[0]!.contextAssertionIds[0],
      )!;
    for (const a of [left, right])
      a.review = { ...a.review, status: "accepted", reviewerType: "human" };
    if (left.state !== "recorded" || right.state !== "recorded")
      throw Error("fixture");
    left.value = {
      organism: "A",
      strain: "S",
      model: "M",
      endpoint: "E",
      setting: "lab",
      exposure: "24 h",
    };
    right.value = structuredClone(left.value);
    expect(compareContext(d, [left.id], [right.id]).verdict).toBe(
      "aligned_on_recorded_context",
    );
    right.value = {
      ...(right.value as Record<string, string>),
      exposure: "48 h",
    };
    expect(compareContext(d, [left.id], [right.id]).verdict).toBe(
      "different_context",
    );
    left.review.status = "pending";
    expect(compareContext(d, [left.id], [right.id]).verdict).toBe(
      "context_not_established",
    );
  });
  it("evaluates all nine dimensions, abstains on every draft and preserves reported outcomes", () => {
    const d = loadCorpus();
    for (const c of d.cases)
      for (const u of d.evidenceUnits) {
        const result = evaluateUnit(d, c, u);
        expect(result.materialComparison.dimensions).toHaveLength(9);
        expect(result.materialComparison.verdict).toBe(
          "insufficient_information",
        );
        expect(result.reportedOutcomeAssertionId).toBe(u.outcomeAssertionId);
        expect(result.contextComparison.verdict).toBe(
          "context_not_established",
        );
      }
  });
  it("never infers equality from identical incomplete material fingerprints", () => {
    const d = loadCorpus(),
      m = d.materials[0]!;
    expect(aggregateFindings(compareMaterials(d, m, m))).toBe(
      "insufficient_information",
    );
  });
  it.each(MATERIAL_POLICY.criticalDimensions)(
    "critical mismatch in %s outranks other unknown dimensions",
    (dimension) => {
      const findings = compareMaterials(
        loadCorpus(),
        loadCorpus().materials[0]!,
        loadCorpus().materials[1]!,
      );
      findings.find((d) => d.dimension === dimension)!.state = "mismatch";
      expect(aggregateFindings(findings)).toBe("materially_incompatible");
      expect(
        findings.filter((d) => d.state === "unknown").length,
      ).toBeGreaterThan(0);
    },
  );
  it("clearing one mismatch does not conceal a second mismatch", () => {
    const d = loadCorpus();
    const f = compareMaterials(d, d.materials[0]!, d.materials[1]!);
    f[0]!.state = "mismatch";
    f[1]!.state = "mismatch";
    f[0]!.state = "match";
    expect(aggregateFindings(f)).toBe("materially_incompatible");
  });
  it("contextual unknowns prevent strict acceptance after every critical field matches", () => {
    const d = loadCorpus();
    const f = compareMaterials(d, d.materials[0]!, d.materials[1]!);
    for (const x of f)
      x.state = x.dimension === "characterization" ? "unknown" : "match";
    expect(aggregateFindings(f)).toBe("partial_match");
    f.at(-1)!.state = "match";
    expect(aggregateFindings(f)).toBe("comparable_on_recorded_dimensions");
  });
  it("distinguishes whole mixture scope from a constituent without calling it inactive", () => {
    const d = loadCorpus(),
      other = structuredClone(d.materials[0]!);
    other.kind = "isolated_compound";
    const f = compareMaterials(d, d.materials[0]!, other);
    expect(f.find((d) => d.dimension === "composition")!.reasonCodes).toContain(
      "WHOLE_MIXTURE_VS_COMPONENT",
    );
    expect(aggregateFindings(f)).toBe("materially_incompatible");
  });
  it("does not use an outcome or a taxonomic candidate alone as material evidence", () => {
    const d = loadCorpus(),
      c = d.cases[0]!,
      u = d.evidenceUnits[0]!;
    const before = evaluateUnit(d, c, u);
    const a = d.assertions.find((a) => a.id === u.outcomeAssertionId)!;
    if (a.state === "recorded") a.value = "negative test result";
    const after = evaluateUnit(d, c, u, [
      { occurrenceId: "slot-cropleek", candidateId: "candidate-onion" },
    ]);
    expect(after.materialComparison).toEqual(before.materialComparison);
    expect(after.reportedOutcomeAssertionId).toBe(
      before.reportedOutcomeAssertionId,
    );
  });
});
