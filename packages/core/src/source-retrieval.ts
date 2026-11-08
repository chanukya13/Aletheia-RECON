import type { OutcomeObservationData } from "@recon/contracts";

export type CellQuery = {
  studyId: string;
  tableId: string;
  strain: string;
  columnLabel: string;
  endpoint: string;
  unit: string;
};
const fields = [
  "studyId",
  "tableId",
  "strain",
  "columnLabel",
  "endpoint",
  "unit",
] as const;
export function matchingSourceCells(
  rows: OutcomeObservationData[],
  query: CellQuery,
) {
  return rows.filter((row) =>
    fields.every((field) => row[field] === query[field]),
  );
}
export function cellSearchText(row: CellQuery) {
  return fields.map((field) => row[field]).join(" ");
}
export function lexicalSourceScores(
  documents: string[],
  query: string,
  method: "jaccard" | "bm25",
) {
  const tokens = (value: string): string[] =>
    value.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const docs = documents.map(tokens),
    terms = [...new Set(tokens(query))],
    average =
      docs.reduce((sum, d) => sum + d.length, 0) / Math.max(docs.length, 1);
  return docs.map((document) => {
    if (method === "jaccard") {
      const a = new Set(document),
        b = new Set(terms);
      return (
        [...a].filter((t) => b.has(t)).length /
        Math.max(new Set([...a, ...b]).size, 1)
      );
    }
    return terms.reduce((score, term) => {
      const frequency = document.filter((t) => t === term).length,
        documentFrequency = docs.filter((d) => d.includes(term)).length;
      const idf = Math.log(
        1 + (docs.length - documentFrequency + 0.5) / (documentFrequency + 0.5),
      );
      return (
        score +
        (idf * (frequency * 2.2)) /
          (frequency +
            1.2 * (0.25 + (0.75 * document.length) / Math.max(average, 1)))
      );
    }, 0);
  });
}
