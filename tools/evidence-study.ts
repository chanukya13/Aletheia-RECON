import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { VerificationStudy } from "@recon/contracts";
import {
  scientificHash,
  sha256,
  matchingSourceCells,
  cellSearchText,
  lexicalSourceScores,
  type CellQuery,
} from "@recon/core";
import { loadCorpus, ROOT } from "../apps/server/src/database.js";
import { extractOutcomeTables } from "../apps/server/src/outcome-tables.js";

const data = loadCorpus(),
  fixtureBytes = readFileSync(
    resolve(ROOT, "data/evaluation/source-cell-queries.json"),
  ),
  fixture = JSON.parse(fixtureBytes.toString()) as {
    queries: Array<{
      id: string;
      kind: "published_cell" | "controlled_conflict";
      query: CellQuery;
      expectedId: string | null;
      expectedValue: number | null;
    }>;
  };
for (const revision of data.sourceRevisions)
  for (const [path, expected] of [
    [revision.rawFile, revision.rawSha256],
    [revision.rights.evidenceFile, revision.rights.evidenceSha256],
  ])
    if (sha256(readFileSync(resolve(ROOT, path!))) !== expected)
      throw new Error("SOURCE_OR_RIGHTS_HASH_CHANGED");
const rows = extractOutcomeTables(
  readFileSync(resolve(ROOT, "data/sources/raw/PMC6261618.xml"), "utf8"),
  data,
).observations.filter((o) => o.studyId === "study-fuchs-2018");
const documents = rows.map(cellSearchText);
const names = [
  "Token Jaccard / unfiltered top-1",
  "BM25 / unfiltered top-1",
  "BM25 + exact context filters",
  "RECON structured cell lookup",
];
const predictions = fixture.queries.map((task) => {
  const queryText = cellSearchText(task.query),
    jaccard = lexicalSourceScores(documents, queryText, "jaccard"),
    bm25 = lexicalSourceScores(documents, queryText, "bm25");
  function top(scores: number[], eligible = rows) {
    return (
      rows
        .map((row, index) => ({ row, score: scores[index]! }))
        .filter((x) => eligible.some((r) => r.id === x.row.id) && x.score > 0)
        .sort(
          (a, b) => b.score - a.score || a.row.id.localeCompare(b.row.id),
        )[0]?.row.id ?? null
    );
  }
  const eligible = matchingSourceCells(rows, task.query);
  const answers = [
    top(jaccard),
    top(bm25),
    top(bm25, eligible),
    eligible.length === 1 ? eligible[0]!.id : null,
  ];
  if (task.expectedId) {
    const cell = rows.find((o) => o.id === task.expectedId);
    if (!cell || cell.value !== task.expectedValue)
      throw new Error(`PUBLISHED_REFERENCE_MISMATCH:${task.id}`);
  }
  return {
    id: task.id,
    kind: task.kind,
    query: task.query,
    expectedId: task.expectedId,
    expectedValue: task.expectedValue,
    outputs: Object.fromEntries(
      names.map((name, i) => [
        name,
        { id: answers[i] ?? null, correct: answers[i] === task.expectedId },
      ]),
    ),
  };
});
const supported = predictions.filter((p) => p.kind === "published_cell"),
  controlled = predictions.filter((p) => p.kind === "controlled_conflict");
const metrics = names.map((name) => {
  const supportedCorrect = supported.filter(
      (p) => p.outputs[name]!.correct,
    ).length,
    unsupportedAbstained = controlled.filter(
      (p) => p.outputs[name]!.id === null,
    ).length,
    totalCorrect = supportedCorrect + unsupportedAbstained;
  return {
    name,
    supportedCorrect,
    unsupportedAbstained,
    unsupportedLinks: controlled.length - unsupportedAbstained,
    totalCorrect,
    total: predictions.length,
    accuracy: totalCorrect / predictions.length,
  };
});
const body = {
  version: "recon-source-cell-study-1" as const,
  createdAt: new Date().toISOString(),
  corpusHash: scientificHash(data),
  fixtureHash: sha256(fixtureBytes),
  codeHash: sha256(
    [
      "tools/evidence-study.ts",
      "packages/core/src/source-retrieval.ts",
      "apps/server/src/outcome-tables.ts",
    ]
      .map((file) => readFileSync(resolve(ROOT, file), "utf8"))
      .join("\n"),
  ),
  nodeVersion: process.versions.node,
  audit: {
    reviewerType: "automated" as const,
    sourceFiles: data.sourceRevisions.length,
    spans: data.spans.length,
    assertions: data.assertions.length,
    checks: data.assertions.map((a) => ({
      assertionId: a.id,
      state: a.state,
      referenceCount: a.references.length,
      status: "passed" as const,
    })),
  },
  supportedQueries: supported.length,
  controlledQueries: controlled.length,
  independentReviewers: 0 as const,
  cellValuesVerified: supported.length,
  methods: [
    "Development source-location study over one published 16-cell table. The expected row/column identities and values are specified in an assistant-authored fixture independently of the parser.",
    "Sixteen published-cell questions and sixteen separately labeled controlled context-conflict questions. All methods receive the same six query fields and candidate representations.",
    "Token Jaccard and BM25 (k1=1.2, b=0.75) return the highest positive-scoring item with deterministic ID tie breaking. These are unfiltered retrieval baselines, not medical decision systems.",
    "Metadata-filtered BM25 uses the same exact context constraints as structured lookup. A tie with this stronger baseline identifies the effect of context filtering rather than establishing retrieval superiority.",
    "No model fitting or concealed test set. Related cells from one table are correlated. Percentages describe only this 32-question development fixture. Controlled conflicts do not improve authentic clinical or historical-identity accuracy.",
    "The source audit verifies artifact/rights hashes, exact spans and references through corpus validation. It is automated integrity verification. Independent human adjudication and semantic entailment scores remain unavailable.",
  ],
  metrics,
  predictions,
};
const report = VerificationStudy.parse({
    ...body,
    contentHash: scientificHash(body),
  }),
  folder = resolve(ROOT, "artifacts/evaluation/source-cell-study");
mkdirSync(folder, { recursive: true });
writeFileSync(
  resolve(folder, "report.json"),
  JSON.stringify(report, null, 2) + "\n",
);
writeFileSync(
  resolve(folder, "predictions.jsonl"),
  predictions.map((p) => JSON.stringify(p)).join("\n") + "\n",
);
console.log(
  JSON.stringify(
    {
      sourceAssertions: body.audit.assertions,
      cellValuesVerified: body.cellValuesVerified,
      supportedQueries: body.supportedQueries,
      controlledQueries: body.controlledQueries,
      metrics,
    },
    null,
    2,
  ),
);
