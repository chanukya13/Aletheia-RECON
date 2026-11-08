import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { contrastOutcomes, sha256 } from "@recon/core";
import { loadCorpus } from "../../apps/server/src/database.js";
import { extractOutcomeTables } from "../../apps/server/src/outcome-tables.js";
const data = loadCorpus(),
  xml = readFileSync("data/sources/raw/PMC6261618.xml", "utf8");
const expected: Record<string, number[]> = {
  "ATCC 6538": [0.625, 0.625, 0.625, 0.625],
  LAC: [2.5, 1.25, 1.25, 1.25],
  PAO1: [5, 5, 2.5, 2.5],
  PA215: [10, 5, 2.5, 5],
};
const arms = ["ES-O", "ES-L", "ES-GBBr", "ES-GB"];
it("extracts every one of the 16 independently specified published cells with row/column and material identity", () => {
  const catalogue = extractOutcomeTables(xml, data),
    rows = catalogue.observations.filter(
      (o) => o.studyId === "study-fuchs-2018",
    );
  expect(rows).toHaveLength(16);
  for (const [strain, values] of Object.entries(expected))
    for (const [column, arm] of arms.entries()) {
      const cell = rows.find(
        (o) => o.strain === strain && o.columnLabel === arm,
      )!;
      expect(cell.value).toBe(values[column]);
      expect(cell.rawValue).toBe(String(values[column]));
      expect(cell.columnIndex).toBe(column + 2);
      expect(cell.minimumBiologicalReplicates).toBe(3);
      expect(cell.unit).toBe("% v/v");
      expect(cell.materialVersionId).toBe(`material-2018-${arm.toLowerCase()}`);
    }
});
it("resolves shuffled columns by actual headers and rejects missing cells, duplicate keys and source drift", () => {
  const doc = new DOMParser().parseFromString(xml, "text/xml"),
    table = Array.from(doc.getElementsByTagName("table-wrap")).find(
      (t) => t.getAttribute("id") === "pone.0208108.t002",
    )!;
  const headers = table
    .getElementsByTagName("thead")[0]!
    .getElementsByTagName("tr")[1]!;
  headers.insertBefore(
    headers.getElementsByTagName("th")[1]!,
    headers.getElementsByTagName("th")[0]!,
  );
  for (const row of Array.from(
    table.getElementsByTagName("tbody")[0]!.getElementsByTagName("tr"),
  )) {
    const cells = row.getElementsByTagName("td");
    row.insertBefore(cells[2]!, cells[1]!);
  }
  const shuffled = new XMLSerializer().serializeToString(doc),
    pin = structuredClone(data);
  pin.sourceRevisions.find((r) => r.id === "fuchs-2018.r1")!.rawSha256 =
    sha256(shuffled);
  expect(
    extractOutcomeTables(shuffled, pin).observations.find(
      (o) => o.strain === "LAC" && o.columnLabel === "ES-O",
    )?.value,
  ).toBe(2.5);
  expect(() => extractOutcomeTables(shuffled, data)).toThrow(
    "OUTCOME_SOURCE_HASH_CHANGED",
  );
  const numericRow = table
    .getElementsByTagName("tbody")[0]!
    .getElementsByTagName("tr")[1]!;
  numericRow.getElementsByTagName("td")[1]!.textContent = "";
  const missing = new XMLSerializer().serializeToString(doc);
  pin.sourceRevisions.find((r) => r.id === "fuchs-2018.r1")!.rawSha256 =
    sha256(missing);
  expect(() => extractOutcomeTables(missing, pin)).toThrow(
    "MISSING_OR_NONNUMERIC_OUTCOME_CELL",
  );
  const duplicate = xml.replace("LAC</td>", "ATCC 6538</td>");
  pin.sourceRevisions.find((r) => r.id === "fuchs-2018.r1")!.rawSha256 =
    sha256(duplicate);
  expect(() => extractOutcomeTables(duplicate, pin)).toThrow(
    "OUTCOME_DUPLICATE_OR_MISSING_KEY",
  );
});
it("reproduces equal and unequal reported medians, rejects incompatible and censored outcomes and zero denominators", () => {
  const rows = extractOutcomeTables(xml, data).observations;
  for (const [strain, ratio] of [
    ["ATCC 6538", 1],
    ["LAC", 2],
  ] as const) {
    const left = rows.find(
        (o) => o.strain === strain && o.columnLabel === "ES-O",
      )!,
      right = rows.find(
        (o) => o.strain === strain && o.columnLabel === "ES-L",
      )!;
    expect(contrastOutcomes(left, right).ratio).toBe(ratio);
    expect(contrastOutcomes(left, right).resultHash).toBe(
      contrastOutcomes(left, right).resultHash,
    );
  }
  const left = rows[0]!,
    right = rows[1]!;
  expect(contrastOutcomes(left, rows.at(-1)!).ratio).toBeNull();
  expect(contrastOutcomes(left, { ...right, value: 0 }).ratio).toBeNull();
  expect(
    contrastOutcomes(left, { ...right, qualifier: "greater_than" }).ratio,
  ).toBeNull();
  expect(
    contrastOutcomes(left, { ...right, strain: "different" }).reasons,
  ).toContain(
    "Incompatible or unreported strain across the selected observations.",
  );
  expect(contrastOutcomes(left, { ...right, unit: "mg/mL" }).ratio).toBeNull();
  expect(contrastOutcomes(left, left).ratio).toBeNull();
});
