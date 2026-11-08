import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  applyScenario,
  buildGroups,
  classifyRobustness,
  diffScenarios,
  enumerateWorlds,
  evaluateScenario,
  minimalQuestions,
  runRobustness,
  scenarioHash,
  compareMaterials,
  scientificHash,
  POLICY_HASH,
  selectDomain,
} from "@recon/core";
import type {
  AuditInput,
  DomainData,
  ScenarioInputData,
} from "@recon/contracts";
import { loadCorpus } from "../../apps/server/src/database.js";
const baseline: ScenarioInputData = {
  assignments: [],
  hypotheticalOverrides: [],
  rationale: "Synthetic test baseline; not actual corpus review.",
};
const groups = (sizes: number[]): DomainData["groups"] =>
  sizes.map((n, i) => ({
    id: `g${i}`,
    occurrenceId: `s${i}`,
    label: `Synthetic group ${i}`,
    exhaustive: false,
    alternatives: Array.from({ length: n }, (_, j) => ({
      id: `a${i}-${j}`,
      label: `Synthetic alternative ${j}`,
      assignments: [{ occurrenceId: `s${i}`, candidateId: `c${i}-${j}` }],
      supportAssertionIds: ["fixture-proof"],
      eligibleReviewed: true,
      reviewState: "reviewed" as const,
    })),
  }));
function authentic() {
  const d = loadCorpus(),
    c = d.cases[0]!;
  const context = {
    caseRevision: c.revision,
    caseHash: c.contentHash,
    corpusRevision: d.revision,
    policyHash: POLICY_HASH,
    selection: "latest" as const,
  };
  const domain: DomainData = {
    context,
    groups: buildGroups(d, c),
    excludedCandidateIds: [],
    limitation: "Original source-backed drafts; no expert acceptance.",
  };
  const input: AuditInput = {
    context,
    mode: "draft_exploration",
    scenario: baseline,
    selections: [
      {
        groupId: domain.groups[0]!.id,
        alternativeIds: ["candidate-onion", "candidate-leek"],
      },
    ],
    constraints: [],
    subsetRationale:
      "Only the two modern discussion proposals are examined; edition gloss explicitly excluded.",
    evidenceUnitIds: d.evidenceUnits
      .filter((u) => u.studyId === "study-furner-pardoe-2020")
      .map((u) => u.id),
    target: "conditional_identity_vector",
    targetDimension: null,
  };
  return {
    d,
    c,
    context,
    domain,
    input,
    units: d.evidenceUnits.filter((u) => input.evidenceUnitIds.includes(u.id)),
  };
}
describe("exact bounded interpretation domains", () => {
  it("enumerates one baseline world with zero groups and all 64 worlds at the boundary", () => {
    expect(enumerateWorlds([], baseline).worlds).toHaveLength(1);
    expect(enumerateWorlds(groups([4, 4, 4]), baseline).worlds).toHaveLength(
      64,
    );
    expect(() => enumerateWorlds(groups([4, 4, 4, 4]), baseline)).toThrow(
      "64-world",
    );
  });
  it("counts admissible worlds after constraints: 64 is allowed and 65 is rejected", () => {
    const g = groups([4, 3, 3, 2]);
    const all: Array<Record<string, string>> = [];
    for (let a = 0; a < 4; a++)
      for (let b = 0; b < 3; b++)
        for (let c = 0; c < 3; c++)
          for (let d = 0; d < 2; d++)
            all.push({
              g0: `a0-${a}`,
              g1: `a1-${b}`,
              g2: `a2-${c}`,
              g3: `a3-${d}`,
            });
    const constraints = all.slice(0, 8).map((choice) => ({
      forbidden: Object.entries(choice).map(([groupId, alternativeId]) => ({
        groupId,
        alternativeId,
      })),
      rationale: "Synthetic forbidden world, not a historical relation.",
    }));
    expect(enumerateWorlds(g, baseline, constraints).worlds).toHaveLength(64);
    expect(() => enumerateWorlds(g, baseline, constraints.slice(0, 7))).toThrow(
      "65 admissible",
    );
  });
  it("rejects duplicate groups/alternatives, absent constraint choices, empty domains and hypothetical fields", () => {
    const g = groups([2]);
    expect(() => enumerateWorlds([g[0]!, g[0]!], baseline)).toThrow();
    const duplicate = structuredClone(g);
    duplicate[0]!.alternatives[1] = duplicate[0]!.alternatives[0]!;
    expect(() => enumerateWorlds(duplicate, baseline)).toThrow();
    expect(() =>
      enumerateWorlds(g, baseline, [
        {
          forbidden: [{ groupId: "missing", alternativeId: "missing" }],
          rationale: "Invalid fixture.",
        },
      ]),
    ).toThrow();
    expect(() =>
      enumerateWorlds(
        g,
        baseline,
        g[0]!.alternatives.map((a) => ({
          forbidden: [{ groupId: "g0", alternativeId: a.id }],
          rationale: "Excluded synthetic alternative.",
        })),
      ),
    ).toThrow("no worlds");
    expect(() =>
      enumerateWorlds(g, {
        ...baseline,
        hypotheticalOverrides: [
          {
            field: "a-brass",
            value: "glass",
            rationale: "Synthetic hypothesis.",
          },
        ],
      }),
    ).toThrow("excluded");
  });
  it("does not admit draft alternatives into the reviewed domain or silently exclude a witness", () => {
    const { d, c, units, domain, input } = authentic();
    expect(() =>
      runRobustness(d, c, units, domain, {
        ...input,
        mode: "reviewed",
        selections: [],
        scenario: {
          ...baseline,
          assignments: [
            { occurrenceId: "slot-cropleek", candidateId: "candidate-onion" },
          ],
        },
      }),
    ).toThrow("fixed interpretation is draft");
    expect(() => selectDomain(domain, { ...input, mode: "reviewed" })).toThrow(
      "draft",
    );
    expect(() =>
      selectDomain(domain, { ...input, subsetRationale: "" }),
    ).toThrow("Explain");
  });
});
describe("robustness and exact question sets", () => {
  it.each([
    [
      "robust_within_domain",
      [
        "comparable_on_recorded_dimensions",
        "comparable_on_recorded_dimensions",
      ],
    ],
    [
      "interpretation_dependent",
      ["comparable_on_recorded_dimensions", "insufficient_information"],
    ],
    [
      "mismatched_throughout_domain",
      ["materially_incompatible", "materially_incompatible"],
    ],
    [
      "undetermined",
      ["partial_match", "insufficient_information", "materially_incompatible"],
    ],
  ] as const)("classifies %s", (expected, values) =>
    expect(classifyRobustness([...values])).toBe(expected),
  );
  it("finds the empty set for invariance and a joint-only set for XOR", () => {
    const worlds = enumerateWorlds(groups([2, 2]), baseline).worlds;
    expect(
      minimalQuestions(["g0", "g1"], worlds, ["same", "same", "same", "same"])
        .sets,
    ).toEqual([[]]);
    expect(
      minimalQuestions(["g0", "g1"], worlds, ["0", "1", "1", "0"]).sets,
    ).toEqual([["g0", "g1"]]);
  });
  it("does not infer independent effects from impossible correlated worlds", () => {
    const g = groups([2, 2]),
      constraints = [
        {
          forbidden: [
            { groupId: "g0", alternativeId: "a0-0" },
            { groupId: "g1", alternativeId: "a1-1" },
          ],
          rationale: "Synthetic correlation.",
        },
        {
          forbidden: [
            { groupId: "g0", alternativeId: "a0-1" },
            { groupId: "g1", alternativeId: "a1-0" },
          ],
          rationale: "Synthetic correlation.",
        },
      ];
    const worlds = enumerateWorlds(g, baseline, constraints).worlds;
    expect(worlds).toHaveLength(2);
    expect(minimalQuestions(["g0", "g1"], worlds, ["0", "1"]).sets).toEqual([
      ["g0"],
      ["g1"],
    ]);
    expect(
      worlds.some((w, i) =>
        worlds.some(
          (v, j) =>
            i !== j &&
            w.choices.g1 === v.choices.g1 &&
            w.choices.g0 !== v.choices.g0,
        ),
      ),
    ).toBe(false);
  });
  it("matches an independent brute-force sufficiency/minimality oracle on 200 seeded target vectors", () => {
    const worlds = enumerateWorlds(groups([2, 2, 2]), baseline).worlds,
      ids = ["g0", "g1", "g2"];
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 3 }), {
          minLength: 8,
          maxLength: 8,
        }),
        (values) => {
          const vectors = values.map(String),
            answer = minimalQuestions(ids, worlds, vectors);
          const sufficient = (set: string[]) => {
            for (let i = 0; i < 8; i++)
              for (let j = 0; j < 8; j++)
                if (
                  set.every(
                    (id) => worlds[i]!.choices[id] === worlds[j]!.choices[id],
                  ) &&
                  values[i] !== values[j]
                )
                  return false;
            return true;
          };
          const expected: string[][] = [];
          for (let mask = 0; mask < 8; mask++) {
            const set = ids.filter((_, i) => mask & (1 << i));
            if (
              sufficient(set) &&
              set.every((id) => !sufficient(set.filter((x) => x !== id)))
            )
              expected.push(set);
          }
          expect(answer.sets.map((s) => s.join(",")).sort()).toEqual(
            expected.map((s) => s.join(",")).sort(),
          );
          return true;
        },
      ),
      { seed: 20261106, numRuns: 200 },
    );
  });
  it("authentic onion/leek correspondence moves without turning draft materials into strict matches", () => {
    const { d, c, domain, input, units } = authentic();
    const result = runRobustness(d, c, units, domain, input);
    expect(result.audit.worldCount).toBe(2);
    expect(result.audit.exhaustiveWithinDocumentedDomain).toBe(false);
    expect(
      result.audit.units.every(
        (u) => u.status === "undetermined" && u.comparableWorldCount === 0,
      ),
    ).toBe(true);
    expect(result.correspondence[0]!.items.map((r) => r.state)).toEqual([
      "corresponds",
      "differs",
    ]);
    expect(result.correspondence[1]!.items.map((r) => r.state)).toEqual([
      "differs",
      "corresponds",
    ]);
    expect(result.studyCoverage[0]).toMatchObject({
      worldsWithAnyCorrespondence: 2,
      fixedCorrespondingArmIds: [],
      worldsWithAnyComparableMaterial: 0,
    });
    expect(result.clarification.inclusionMinimalSufficientSets).toEqual([
      [domain.groups[0]!.id],
    ]);
    const strict = runRobustness(d, c, units, domain, {
      ...input,
      target: "material_verdict_vector",
    });
    expect(strict.clarification.inclusionMinimalSufficientSets).toEqual([[]]);
    expect(
      strict.clarification.missingDocumentation.every(
        (m) => m.dependencyCount <= units.length,
      ),
    ).toBe(true);
  });
  it("keeps the tentative edition gloss unresolved and the admitted list explicitly non-exhaustive", () => {
    const { d, c, domain, input, units } = authentic();
    input.selections[0]!.alternativeIds.push("candidate-edition-oleraceum");
    const result = runRobustness(d, c, units, domain, input);
    expect(
      result.correspondence
        .at(-1)!
        .items.every((r) => r.state === "not_established"),
    ).toBe(true);
    expect(result.audit.candidateListExhaustive).toBe(false);
    expect(result.studyCoverage[0]!.worldsWithAnyCorrespondence).toBe(2);
  });
});
describe("scenario persistence prerequisites and recomputation oracle", () => {
  it("a hypothetical contact change affects a conditional dimension only when explicitly enabled", () => {
    const { d, c } = authentic();
    const left = d.materials.find((m) => m.id === c.materialVersionId)!;
    const right = structuredClone(left);
    right.id = "synthetic-reviewed-contact-material";
    const original = d.assertions.find((a) => a.id === "a-brass")!;
    d.assertions.push({
      ...original,
      id: "synthetic-contact",
      state: "recorded",
      value: "brass vessel",
      review: { ...original.review, status: "accepted", reviewerType: "human" },
    });
    right.assertionIds = right.assertionIds.map((id) =>
      id === "a-brass" ? "synthetic-contact" : id,
    );
    d.materials.push(right);
    const applied = applyScenario(d, c, {
      ...baseline,
      hypotheticalOverrides: [
        {
          field: "a-brass",
          value: "glass vessel",
          rationale: "Synthetic conditional contact assumption.",
        },
      ],
    });
    const virtual = applied.data.materials.find(
      (m) => m.id === applied.caseRecord.materialVersionId,
    )!;
    expect(
      compareMaterials(applied.data, virtual, right).find(
        (f) => f.dimension === "contact",
      )!.state,
    ).toBe("unknown");
    const contact = compareMaterials(
      applied.data,
      virtual,
      right,
      [],
      [],
      applied.hypotheticalIds,
    ).find((f) => f.dimension === "contact")!;
    expect(contact.state).toBe("mismatch");
    expect(contact.hypothesisIds.length).toBeGreaterThan(0);
    expect(original.review.status).toBe("pending");
  });
  it("ignores rationale/assignment-order changes in scientific hashes", () => {
    const a = {
      ...baseline,
      assignments: [
        { occurrenceId: "a", candidateId: "x" },
        { occurrenceId: "b", candidateId: "y" },
      ],
    };
    expect(scenarioHash(a)).toBe(
      scenarioHash({
        ...a,
        rationale: "Changed editorial explanation.",
        assignments: [...a.assignments].reverse(),
      }),
    );
  });
  it("hypotheses fork only the left material, preserve source records and cannot be audited as documented worlds", () => {
    const { d, c, domain, input, units } = authentic();
    const hash = scientificHash(d);
    const scenario = {
      ...baseline,
      hypotheticalOverrides: [
        {
          field: "a-brass",
          value: "glass vessel",
          rationale: "Synthetic conditional contact assumption.",
        },
      ],
    };
    const applied = applyScenario(d, c, scenario);
    expect(applied.caseRecord.materialVersionId).not.toBe(c.materialVersionId);
    expect(applied.data.assertions.find((a) => a.id === "a-brass")).toEqual(
      d.assertions.find((a) => a.id === "a-brass"),
    );
    expect(
      applied.data.assertions.find((a) => a.id === applied.hypotheticalIds[0])!
        .review.status,
    ).toBe("pending");
    expect(evaluateScenario(d, c, units, scenario).kind).toBe("hypothetical");
    expect(scientificHash(d)).toBe(hash);
    expect(() =>
      runRobustness(d, c, units, domain, { ...input, scenario }),
    ).toThrow("Hypothetical");
  });
  it("full-recompute fallback equals clean recomputation for 200 seeded generated edits", () => {
    const { d, c, units } = authentic();
    const scenario = (choice: number, days: number): ScenarioInputData => ({
      assignments:
        choice < 3
          ? [
              {
                occurrenceId: "slot-cropleek",
                candidateId: [
                  "candidate-onion",
                  "candidate-leek",
                  "candidate-edition-oleraceum",
                ][choice]!,
              },
            ]
          : [],
      hypotheticalOverrides: days
        ? [
            {
              field: "a-nine-days",
              value: { value: days, unit: "day" },
              rationale:
                "Synthetic duration assumption for metamorphic testing only.",
            },
          ]
        : [],
      rationale: "Synthetic generated scenario; not corpus acceptance.",
    });
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 3 }),
        fc.integer({ min: 0, max: 3 }),
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: 0, max: 20 }),
        (a, b, x, y) => {
          const before = scenario(a, x),
            after = scenario(b, y),
            diff = diffScenarios(d, c, units, before, after),
            initial = evaluateScenario(d, c, units, before).results,
            oracle = evaluateScenario(d, c, units, after).results;
          const reconstructed = initial.map(
            (r) =>
              diff.diff.changed.find(
                (change) => change.before.evidenceUnitId === r.evidenceUnitId,
              )?.after ?? r,
          );
          expect(reconstructed).toEqual(oracle);
          expect(reconstructed.map((r) => r.dependencies)).toEqual(
            oracle.map((r) => r.dependencies),
          );
          return true;
        },
      ),
      { seed: 20261107, numRuns: 200 },
    );
  }, 30000);
  it("rationale-only edits are unaffected and preserve the strict headline while correspondence changes are separate", () => {
    const { d, c, units } = authentic();
    const before = {
      ...baseline,
      assignments: [
        { occurrenceId: "slot-cropleek", candidateId: "candidate-onion" },
      ],
    };
    const invariant = diffScenarios(d, c, units, before, {
      ...before,
      rationale: "A new explanation of the same scientific choice.",
    });
    expect(invariant.diff.unaffectedIds).toHaveLength(units.length);
    expect(invariant.diff.fullRecomputeFallback).toBe(false);
    const moved = diffScenarios(d, c, units, before, {
      ...before,
      assignments: [
        { occurrenceId: "slot-cropleek", candidateId: "candidate-leek" },
      ],
    });
    expect(moved.diff.recomputedUnchangedIds).toHaveLength(units.length);
    expect(moved.changedCorrespondenceUnitIds).toHaveLength(2);
  });
});
