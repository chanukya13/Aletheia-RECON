import { describe, expect, it } from "vitest";
import fc from "fast-check";
import type { CorpusData, SourceRevisionData } from "@recon/contracts";
import {
  buildMaterialFingerprint,
  contentHash,
  convertQuantity,
  extractPreparation,
  makeSpan,
  materialRecordHash,
  normalizeForSearch,
  sha256,
  validateSpan,
} from "@recon/core";
import { loadCorpus } from "../../apps/server/src/database.js";
function source(text: string): SourceRevisionData {
  const s = structuredClone(loadCorpus().sourceRevisions[0]!);
  s.displayText = text;
  s.textSha256 = sha256(text);
  s.contentHash = contentHash(s);
  return s;
}
describe("bounded English preparation extraction", () => {
  it("anchors every proposal to exact original UTF-16 after Unicode and whitespace normalization", () => {
    const s = source(
      "𐐀 ά · Take GARLIC\r\n and wine. Put in a brass vessel; let it stand nine days.",
    );
    const run = extractPreparation(s, "en", "historical_edition");
    expect(run.status).toBe("supported");
    expect(
      run.proposals.find(
        (p) => p.kind === "ingredient" && p.value === "garlic",
      )!.span.exact,
    ).toBe("GARLIC");
    for (const p of run.proposals)
      expect(() => validateSpan(p.span, s)).not.toThrow();
    expect(
      run.proposals.find((p) => p.kind === "duration")!.value,
    ).toMatchObject({ value: 9, unit: "day" });
  });
  it("preserves distinct occurrences and rejects substring collisions", () => {
    const run = extractPreparation(
      source(
        "Take garlic and cropleek, then add garlic. Leekwort is commentary.",
      ),
      "en",
      "user_text",
    );
    const ingredients = run.proposals.filter((p) => p.kind === "ingredient");
    expect(ingredients.map((p) => p.value)).toEqual([
      "garlic",
      "cropleek",
      "garlic",
    ]);
    expect(new Set(ingredients.map((p) => p.id)).size).toBe(3);
  });
  it("records omission and negation rather than proposing positive composition/process facts", () => {
    const run = extractPreparation(
      source(
        "Take garlic without onion. Do not boil. Add wine, omit honey. Not only garlic is mentioned.",
      ),
      "en",
      "user_text",
    );
    expect(run.proposals.find((p) => p.value === "onion")!.polarity).toBe(
      "negated",
    );
    expect(run.proposals.find((p) => p.value === "boil")!.polarity).toBe(
      "negated",
    );
    expect(run.proposals.find((p) => p.value === "wine")!.polarity).toBe(
      "present",
    );
    expect(run.proposals.find((p) => p.value === "honey")!.polarity).toBe(
      "negated",
    );
    expect(
      run.proposals.filter((p) => p.value === "garlic").at(-1)!.polarity,
    ).toBe("present");
  });
  it("labels commentary and unsupported language/context honestly", () => {
    const run = extractPreparation(
      source("The manuscript mentions onion in a glossary."),
      "en",
      "user_text",
    );
    expect(run.proposals[0]!.context).toBe("mention_only");
    expect(
      extractPreparation(source("garlic wine"), "ang", "user_text").status,
    ).toBe("unsupported_language");
    expect(
      extractPreparation(source("garlic wine"), "en", "primary_study").status,
    ).toBe("unsupported_context");
  });
  it("distinguishes equal quantities from equal volumes and ties relations to occurrences", () => {
    const run = extractPreparation(
      source(
        "Take garlic and onion of both equal quantities. Mix wine and water in equal volumes.",
      ),
      "en",
      "user_text",
    );
    const qs = run.proposals.filter((p) => p.kind === "quantity");
    expect(qs.map((p) => p.value)).toEqual([
      { relationship: "equal", basis: "unknown", dimension: "unknown" },
      { relationship: "equal", basis: "volume", dimension: "volume" },
    ]);
    expect(qs.every((q) => q.relatedProposalIds.length === 2)).toBe(true);
  });
  it("does not invent numeric amounts for historical measures or editorial gloss ingredients", () => {
    const run = extractPreparation(
      source("Take a handful of garlic. Editorial footnote 1: onion and leek."),
      "en",
      "historical_edition",
    );
    expect(run.proposals.filter((p) => p.kind === "quantity")).toEqual([]);
    expect(
      run.proposals.filter((p) => p.kind === "ingredient").map((p) => p.value),
    ).toEqual(["garlic"]);
  });
  it("normalizes compatibility characters without changing stored text", () => {
    const text = "𐐀  ＧＡＲＬＩＣ";
    const n = normalizeForSearch(text);
    expect(n.text).toContain("garlic");
    const run = extractPreparation(source(text), "en", "user_text");
    expect(run.proposals[0]!.span.exact).toBe("ＧＡＲＬＩＣ");
  });
  it("makes repeated extraction deterministic", () => {
    const s = source(
      "Take 25 mL wine and 2 g garlic. Heat at 40 °C for 5 minutes.",
    );
    expect(extractPreparation(s, "en", "user_text")).toEqual(
      extractPreparation(s, "en", "user_text"),
    );
  });
});
describe("quantity boundaries", () => {
  it("converts compatible metric quantities only", () => {
    expect(convertQuantity(1, "L", "mL")).toBe(1000);
    expect(convertQuantity(2000, "mg", "g")).toBe(2);
    expect(convertQuantity(9, "day", "hour")).toBe(216);
    expect(() => convertQuantity(25, "g", "mL")).toThrow("INCOMMENSURATE");
    expect(() => convertQuantity(1, "handful", "g")).toThrow();
    expect(() => convertQuantity(Infinity, "g", "mg")).toThrow();
  });
  it("round trips bounded generated metric values", () =>
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000000 }), (value) => {
        expect(
          convertQuantity(convertQuantity(value, "g", "mg"), "mg", "g"),
        ).toBe(value);
        return true;
      }),
      { numRuns: 100 },
    ));
});
describe("semantic material fingerprint", () => {
  const compute = (data: CorpusData, material = data.materials[0]!) =>
    buildMaterialFingerprint(
      material,
      data.assertions,
      data.candidates,
      data.taxa,
      [],
    );
  it("keeps unknowns/pending assertions unknown and does not use record IDs as scientific identity", () => {
    const data = loadCorpus();
    const fp = compute(data);
    expect(fp.unknownCount).toBeGreaterThan(0);
    expect(JSON.stringify(fp.payload)).toContain("not_reviewed");
    const m = structuredClone(data.materials[0]!);
    m.id = "different-material-record";
    m.label = "Different display label";
    expect(compute(data, m).hash).toBe(fp.hash);
    expect(fp.hash).not.toBe(materialRecordHash(m));
  });
  it("is invariant to ingredient order and materially affected by process order", () => {
    const data = loadCorpus();
    const before = compute(data);
    const m = structuredClone(data.materials[0]!);
    m.componentSlots.reverse();
    expect(compute(data, m).hash).toBe(before.hash);
    const a = data.assertions.find((a) => a.id === "a-nine-days")!;
    const s = data.spans.find((s) => s.id === "span-nine-days")!;
    for (const [id, value] of [
      ["op-a", "mix"],
      ["op-b", "strain"],
    ] as const)
      data.assertions.push({
        ...a,
        id,
        state: "recorded",
        value,
        field: "preparation.operation",
        references: [{ kind: "span", spanId: s.id }],
        review: { ...a.review, status: "accepted", reviewerType: "human" },
      });
    m.steps = [
      {
        id: "step-a",
        operationAssertionId: "op-a",
        inputSlotIds: [],
        followsStepIds: [],
        detailAssertionIds: [],
      },
      {
        id: "step-b",
        operationAssertionId: "op-b",
        inputSlotIds: [],
        followsStepIds: ["step-a"],
        detailAssertionIds: [],
      },
    ];
    const ordered = compute(data, m).hash;
    m.steps[0]!.followsStepIds = ["step-b"];
    m.steps[1]!.followsStepIds = [];
    expect(compute(data, m).hash).not.toBe(ordered);
  });
  it("encodes explicit candidate assumptions without rewriting the unresolved source identity", () => {
    const data = loadCorpus();
    const m = data.materials[0]!;
    const fp = buildMaterialFingerprint(
      m,
      data.assertions,
      data.candidates,
      [],
      [{ occurrenceId: "slot-cropleek", candidateId: "candidate-onion" }],
    );
    expect(JSON.stringify(fp.payload)).toContain("explicit_assumption");
    expect(
      data.assertions.find((a) => a.id === "a-cropleek-identity")!.state,
    ).toBe("unknown");
  });
  it("rejects cyclic processing constraints", () => {
    const data = loadCorpus();
    data.materials[0]!.steps[0]!.followsStepIds = ["step-maturation"];
    expect(() => compute(data)).toThrow("PROCESS_CYCLE");
  });
  it("validates manual source selections before creating assertions", () => {
    const s = source("𐐀 ά cropleac");
    expect(() => makeSpan(s, "bad", 0, 1)).toThrow("SPAN_SURROGATE_BOUNDARY");
    const span = makeSpan(
      s,
      "good",
      s.displayText.indexOf("cropleac"),
      s.displayText.length,
    );
    expect(span.exact).toBe("cropleac");
  });
});
