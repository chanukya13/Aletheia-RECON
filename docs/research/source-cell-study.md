# Executed source-cell location study

Run with `npm run evidence:report`. The generated [report](../../artifacts/evaluation/source-cell-study/report.json) retains methods, runtime, corpus/fixture/code fingerprints, all queries and every prediction. [Raw predictions](../../artifacts/evaluation/source-cell-study/predictions.jsonl) are also available separately. The Evaluation ledger displays this executed artifact and offers its actual JSON download.

## Question and dataset

Does enforcing known source context prevent retrieval of a published cell for an incompatible request?

The positive panel contains all 16 MIC cells in Fuchs et al. (2018), Table 2, retained in `data/sources/raw/PMC6261618.xml`: medians in % v/v for four formulations and four bacterial strains. [Published source](https://pmc.ncbi.nlm.nih.gov/articles/PMC6261618/#pone.0208108.t002). An assistant-authored fixture specifies expected strain/formulation identities, IDs and values separately from the XML parser. Every expected value is checked before evaluation proceeds. This is not a second independent adjudication of the paper.

The negative panel contains 16 explicitly synthetic context-conflict requests. Each changes one field of a positive query: strain, endpoint, unit or table. Expected abstention is scoped **to the indexed Table 2 candidate set**, not all literature. The full fixture is `data/evaluation/source-cell-queries.json`.

Requests contain six known fields: study, table, strain, formulation column, endpoint and unit. They do not test natural-language extraction. Related cells from one table are correlated. The 50:50 positive/negative balance is a design choice, not estimated query prevalence. This is a development fixture; no held-out or independently labeled test set is claimed.

## Methods

All methods receive the same six query fields and candidate text, formed by concatenating those fields. Unicode letter/number tokens are case-folded; punctuation separates tokens. Jaccard compares token sets. BM25 uses k1=1.2 and b=0.75, summing distinct query terms. Both unfiltered baselines return the highest positive-scoring candidate with deterministic ID tie breaking; there is no calibrated abstention threshold. Empty/no-overlap queries yield no positive score.

The stronger baseline applies exact context filters before BM25 ranking. RECON's lookup requires a unique exact match, abstaining on zero or multiple matches. The shared context matcher also checks source-cell uniqueness in the production outcome-contrast API. The benchmark invokes lookup functions; it does not measure browser/API latency or the entire workflow.

## Observed results

| Method | Published cells located | Controlled conflicts excluded | Total correct on this fixture |
| --- | ---: | ---: | ---: |
| Token Jaccard, unfiltered top-1 | 16/16 | 0/16 | 16/32 (50.0%) |
| BM25, unfiltered top-1 | 16/16 | 0/16 | 16/32 (50.0%) |
| BM25 with exact context filters | 16/16 | 16/16 | 32/32 (100.0%) |
| RECON structured cell lookup | 16/16 | 16/16 | 32/32 (100.0%) |

RECON ties filtered BM25. Against unfiltered BM25, the difference is 16 additional correct abstentions, or 50 percentage points on this deliberately balanced fixture. All methods locate the positive cells correctly. The demonstrated benefit is adding known context constraints to unfiltered retrieval. No superiority over filtered BM25, LLMs, clinical methods or historical interpretation methods is established. Calibrated abstention is another appropriate baseline for a larger, independently designed query set.

A defensible description is: **“Located 16/16 published table cells and rejected 16/16 controlled context conflicts; tied BM25 with the same context filters.”** Avoid an unqualified “100% accuracy” claim. Do not treat correlated cells as independent clinical observations in a significance test.

## Reproduction and failures

1. Install pinned dependencies and use Node 24 as documented in the README.
2. Run `npm run data:validate`, then `npm run evidence:report`.
3. Inspect both output files, including the incorrect unfiltered predictions. Compare fixture/code/corpus hashes, outputs and denominators. Timestamps and the containing content hash change between runs.
4. Open Evaluation and download the report via `/api/v1/verification-study`; the server checks its schema and content hash.

Changed source/rights bytes, unexpected published values and invalid corpus references fail verification. A missing file produces an unavailable state and a genuine retry. A report with a mismatched fingerprint is refused. Hashes detect changes; they do not authenticate an independent reviewer.

The earlier 34-record authentic diagnostic, 40 synthetic aggregation sentinels and 12 passage windows remain separate. Their unavailable reference-label metrics remain unavailable. This study does not enlarge an authentic clinical or historical-identity denominator.
