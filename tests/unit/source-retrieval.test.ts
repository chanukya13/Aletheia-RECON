import { it, expect } from "vitest";
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  matchingSourceCells,
  lexicalSourceScores,
  cellSearchText,
} from "@recon/core";
import { loadCorpus } from "../../apps/server/src/database.js";
import { extractOutcomeTables } from "../../apps/server/src/outcome-tables.js";
import { readVerificationStudy } from "../../apps/server/src/verification-routes.js";
const rows = extractOutcomeTables(
  readFileSync("data/sources/raw/PMC6261618.xml", "utf8"),
  loadCorpus(),
).observations;
it("exact lookup requires each context field and retains duplicate ambiguity rather than choosing a cell", () => {
  const cell = rows.find((r) => r.id === "obs-2018-lac-es-o")!;
  expect(matchingSourceCells(rows, cell)).toEqual([cell]);
  for (const field of [
    "studyId",
    "tableId",
    "strain",
    "columnLabel",
    "endpoint",
    "unit",
  ] as const)
    expect(
      matchingSourceCells(rows, { ...cell, [field]: "unknown-context" }),
    ).toEqual([]);
  expect(
    matchingSourceCells([cell, { ...cell, id: "another-cell" }], cell),
  ).toHaveLength(2);
  expect(matchingSourceCells([], cell)).toEqual([]);
  expect(cellSearchText(cell)).toContain("minimum inhibitory concentration");
});
it("lexical baselines have finite empty scores, zero overlap and higher relevance for the matching document", () => {
  for (const method of ["jaccard", "bm25"] as const) {
    expect(lexicalSourceScores([], "a", method)).toEqual([]);
    expect(lexicalSourceScores(["", "apple"], "", method)).toEqual([0, 0]);
    expect(lexicalSourceScores(["apple", "banana"], "absent", method)).toEqual([
      0, 0,
    ]);
    const scores = lexicalSourceScores(
      ["apple fruit", "banana fruit"],
      "APPLE",
      method,
    );
    expect(scores[0]).toBeGreaterThan(scores[1]!);
    expect(scores.every(Number.isFinite)).toBe(true);
  }
});
it("evaluation artifact reader reports absence and refuses changed bytes, duplicate JSON keys and malformed records", () => {
  const folder = mkdtempSync(resolve("artifacts/tmp/source-study-")),
    path = resolve(folder, "report.json");
  expect(() => readVerificationStudy(path)).toThrow(/Run the documented/);
  const original = readFileSync(
    "artifacts/evaluation/source-cell-study/report.json",
    "utf8",
  );
  writeFileSync(path, original);
  expect(readVerificationStudy(path).independentReviewers).toBe(0);
  const changed = JSON.parse(original);
  changed.metrics[0].totalCorrect += 1;
  writeFileSync(path, JSON.stringify(changed));
  expect(() => readVerificationStudy(path)).toThrow(/integrity/);
  writeFileSync(path, '{"version":"x","version":"y"}');
  expect(() => readVerificationStudy(path)).toThrow(/integrity/);
  writeFileSync(path, "{}");
  expect(() => readVerificationStudy(path)).toThrow(/integrity/);
});
