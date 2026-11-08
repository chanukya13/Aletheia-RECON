import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { TraceManifest } from "@recon/contracts";
import { traceInterpretations, scientificHash } from "@recon/core";
import { loadCorpus } from "../../apps/server/src/database.js";
const data = loadCorpus();
const manifest = TraceManifest.parse(
  JSON.parse(readFileSync("data/trace-manifest.json", "utf8")),
);
it("keeps original, translated, editorial and modern contributions distinct and excludes only the selected support", () => {
  const before = scientificHash(data);
  const result = traceInterpretations(data, manifest, { q: "cropleac" });
  expect(result.candidates).toHaveLength(3);
  expect(
    result.contributions.find((c) => c.spanId === "span-edition-gloss")?.role,
  ).toBe("editorial_note");
  const without = traceInterpretations(data, manifest, {
    q: "cropleac",
    excludedSpanIds: ["span-edition-gloss"],
  });
  expect(
    without.candidates.find((c) => c.id === "candidate-edition-oleraceum")
      ?.survivingPaths,
  ).toBe(0);
  expect(
    without.candidates.find((c) => c.id === "candidate-onion")?.survivingPaths,
  ).toBe(1);
  expect(
    without.candidates.find((c) => c.id === "candidate-leek")?.survivingPaths,
  ).toBe(1);
  expect(without.literals).toEqual(result.literals);
  expect(scientificHash(data)).toBe(before);
  expect(
    traceInterpretations(data, manifest, { q: "cropleac" }).resultHash,
  ).toBe(result.resultHash);
});
it("searches exact Unicode word boundaries and uses only declared interpretation mappings", () => {
  for (const q of [
    "cropleac",
    "CROPLEAC",
    "Ƿyrc",
    "oxymel",
    "Allium cepa",
    "garleac",
  ]) {
    const result = traceInterpretations(data, manifest, { q });
    for (const span of result.literals)
      expect(
        data.sourceRevisions
          .find((r) => r.id === span.sourceRevisionId)!
          .displayText.slice(span.start, span.end),
      ).toBe(span.exact);
  }
  expect(
    traceInterpretations(data, manifest, { q: "garleac" }).candidates,
  ).toHaveLength(0);
  const oxymel = traceInterpretations(data, manifest, { q: "oxymel" });
  expect(oxymel.candidates).toHaveLength(0);
  expect(oxymel.contributions.some((c) => c.spanId === "span-oxymel-use")).toBe(
    true,
  );
  expect(
    traceInterpretations(data, manifest, { q: "notaword" }).literals,
  ).toHaveLength(0);
});
it("rejects stale pins and unknown exclusions; withholds protected originals", () => {
  expect(() =>
    traceInterpretations(
      data,
      { ...manifest, corpusHash: "0".repeat(64) },
      { q: "cropleac" },
    ),
  ).toThrow("TRACE_CORPUS_CHANGED");
  expect(() =>
    traceInterpretations(data, manifest, {
      q: "cropleac",
      excludedSpanIds: ["missing"],
    }),
  ).toThrow("UNKNOWN_CONTRIBUTION");
  const privateData = structuredClone(data);
  privateData.sourceRevisions.find(
    (r) => r.id === "cockayne-original.r1",
  )!.rights.display = false;
  const result = traceInterpretations(
    privateData,
    { ...manifest, corpusHash: scientificHash(privateData) },
    { q: "cropleac" },
  );
  expect(
    result.sourceRevisions.some((r) => r.id === "cockayne-original.r1"),
  ).toBe(false);
  expect(
    result.literals.some((r) => r.sourceRevisionId === "cockayne-original.r1"),
  ).toBe(false);
});
it("retains a second citation path and terminates input cycles", () => {
  const changed = structuredClone(data),
    a = changed.assertions.find((a) => a.id === "a-edition-gloss")!;
  a.references.push({ kind: "span", spanId: "span-cropleac-ambiguity" });
  a.inputAssertionIds.push(a.id);
  const result = traceInterpretations(
    changed,
    { ...manifest, corpusHash: scientificHash(changed) },
    { q: "cropleac", excludedSpanIds: ["span-edition-gloss"] },
  );
  expect(
    result.candidates.find((c) => c.id === "candidate-edition-oleraceum")
      ?.survivingPaths,
  ).toBe(1);
});
