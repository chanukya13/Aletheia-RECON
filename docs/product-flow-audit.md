# Product flow and technical evidence packaging

Reviewed 8 November 2026. This is a heuristic/code/browser review, not a user study. No measured comprehension or task-time improvement is claimed. The baseline production walkthrough is retained at `artifacts/verification/flow/before.json` with adjacent screenshots.

The initial rapid snapshots include loading states on some lazy routes; they are not page-completion or timing measurements. Final regression and production inspection wait for rendered content and completed requests.

## Findings and changes

The previous entry was a case library. Source reading, curation, trace, outcomes, scenarios and evaluation each worked, but their relationship required prior knowledge. The scenario editor presented all 14 available evidence units with its saved-case selection, without a study-specific entry. “Draft” appeared without consistently explaining its practical meaning. There was no short route from a scientific question to an inspectable result.

The new `/research` entry asks whether *cropleac* meant onion or leek, explains four stages and offers one primary action. A stage navigator and contextual next actions connect source → interpretation → experiment → saved audit. Markers show the current page, not invented completion or scientific progress.

| User intention | Working route | Result / next action |
| --- | --- | --- |
| Understand RECON | Research home | Concrete question and a four-stage investigation. |
| Read a historical witness | Case source | Original, translation, editorial note and exact locations; continue to interpretation. |
| Understand proposed identities | Interpretation trace | Inspect supporting passages; exclude/restore paths; compare outcomes or choose a named assumption. |
| Inspect an experiment | Measured outcomes | Change strain, inspect original cells/preparation and download the reproducible contrast. |
| Choose an assumption | Separate onion/leek audit actions | Explicit candidate and the same eight curated 2018 arms. Generic audit navigation leaves identity unresolved. |
| Save an investigation | Scenario editor → dossier | Server evaluation, immutable inputs/source closure, real JSON/HTML/bibliography downloads and offline replay. |
| Compare alternatives deeply | Scenario robustness controls | Explicit domains, bounded enumeration and clarification questions with policy, review limits and subset rationale. |
| Curate/import research | Library / material workspace | Existing passage import, annotations, material revisions, taxonomy and evidence controls. |
| Compare materials/studies | Case material/evidence | Actual versions, context, unknowns and exact source inspection. |
| Continue others' work | Dossier library / isolated import | Validate, preserve namespace, explicitly create an editable copy. |
| Assess claims | Evaluation ledger | Executed checks, four-method comparison, queries/predictions and properly scoped existing diagnostics. |

Candidate parameters must match a current, non-rejected case candidate. Study parameters select only evidence already belonging to that case. Invalid parameters fall back to the earlier baseline. Existing direct workspace links retain their previous behavior. Dirty-edit, stale-revision, source-uncertainty and unavailable-calculation safeguards remain active.

## Packaging decision

The [15-edition winner review](research/winner-evidence-audit.md) records overall/category awards, public artifacts and actual visible evaluation details. It informed a recognizable investigation with inspectable input, source, result and reproducible output. It does not establish a formula for winning.

The executed [source-cell study](research/source-cell-study.md) gives a narrow comparison with appropriate baselines. RECON ties context-filtered BM25. Context constraints eliminate 16 deliberately incompatible links returned by unfiltered retrieval on this fixture. This is data-location evidence; independent clinical/historical-identity accuracy remains unavailable.

## Verification

Run `npm run verify:product`; logs are saved separately under `artifacts/verification/product-flow`. Gates cover production build, TypeScript, lint, licenses, corpus validation, both evaluation generators, unit/integration tests and real Chromium/Firefox/WebKit workflows. Earlier acceptance records are preserved.

Additional browser tests execute source → trace → strain change → chosen interpretation → saved scenario → evaluation → frozen dossier → downloaded JSON → network-blocked offline replay at desktop/phone widths. Home and Evaluation are checked at 1440, 1024, 390 and 320 pixels, including real report download, malformed-response recovery, Axe accessibility checks, document overflow, console/runtime/HTTP errors and screenshots.

Executed acceptance is recorded in the [completed handoff](handoffs/product-flow.md). The checks identified and resolved undersized journey/disclosure targets, a tablet header overlap and narrow source-tab overflow; initial failing records were retained. Final checks also require every journey step to fit visibly on narrow screens. The final production inspection covers twelve routes at four widths, with no unexpected errors. Researcher comprehension and task-time improvements remain unmeasured.

A future independent usability study could ask unfamiliar researchers to explain an editorial gloss, a modern reconstruction and a measured assay after completing the investigation. Such results have not been collected or claimed.
