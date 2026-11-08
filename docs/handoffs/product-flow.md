# Product flow and evidence update — completed

Completed 8 November 2026. This refines the implemented seven-phase product. No user reviewer nomination or approval is required for normal operation. The assistant owns the automated checks; independent scientific adjudication has not been fabricated.

## Delivered behavior

- `/research` is the default entry, explaining a concrete historical question and its four-stage investigation. Brand navigation returns here; existing deep links and the case library remain functional.
- `ResearchJourney` connects source → interpretation → experiment → audit, shows the actual current stage and supplies contextual next actions. All four steps are visible together on narrow screens. Source tabs wrap; tablet navigation no longer overlaps the page.
- Outcomes offer separate onion/leek audit actions. Each initializes a valid case candidate and the same eight 2018 evidence arms. Generic audit navigation leaves identity unresolved. Unknown parameters restore the saved-case baseline selection. No scientific review state changes when following a link.
- The Evaluation ledger displays executed seed-source integrity checks and a four-method source-cell study. A real download retains queries, all predictions, methods, runtime and hashes. Missing/corrupt results have explicit error/retry behavior.
- The [15-edition winner audit](../research/winner-evidence-audit.md) distinguishes overall/category awards, project versus organizer evidence, actual test details and unverified performance claims. The [flow audit](../product-flow-audit.md) records feature paths and review limits.

## Verification record

`npm run verify:product` passed all 11 gates. The regression contains **130 unit, 52 integration, 46 Chromium and 18 Firefox/WebKit tests: 246 total**. After the final mobile-grid refinement, production build/type/lint, ten source/guided Chromium checks and all eighteen Firefox/WebKit checks passed again. Repeats are not counted as new tests. No skipped, unexpected or flaky browser outcomes were recorded.

The final user service on port 4317 passed **48 route/width inspections**: twelve main routes at 1440, 1024, 390 and 320 pixels. Return navigation from both historical sources works; all journey steps fit; runtime, console, HTTP, network and document-overflow error lists are empty. Screenshots were visually inspected. Automated Axe checks include WCAG 2.2 target sizes on the new flow. These are engineering checks, not a usability study.

Evidence is retained under `artifacts/verification/product-flow`:

- `acceptance-receipt.json`, full gate `report.json`, logs and full browser reports;
- `final-refinement-chromium.json`, `final-refinement-cross-browser.json`;
- `final-live-inspection.json` and `current-*.png`;
- `workspace-integrity.json`, `live-inspection.json` and `existing-dossier.json`;
- `source-manifest.json`, `source-delta.json` and retained initial failure records.

The source/config/data revision is `c8361a85cd200e2f8bc8bb915bccfb3168bb729565267b4ad1b56bcb1a6d4bd2` across 167 files, using the earlier sorted-file/raw-hash algorithm. Documentation, dependencies, builds and local databases are outside that source manifest. The final receipt rechecks every recorded source hash.

The original corpus byte hash is still `623a6697e3bd9fc129cec099e989860cd04c563f1fe3049b5415dcb95c9fe0fd`. SQLite integrity and foreign keys pass; original case/source/assertion/pending-study/scenario/analysis/import counts are unchanged. The original saved dossier replays offline to `419e5bf87f2dd26de0440f4d452b2127932ae9db4b7c41d140e4a3a60ffc1c45`.

## Measured scientific scope

The [source-cell study](../research/source-cell-study.md) reproduces 16 published MIC values. RECON and metadata-filtered BM25 both locate 16/16 published cells and exclude 16/16 constructed context conflicts. Unfiltered Jaccard/BM25 locate the positive cells but return a cell for all 16 conflicts. This establishes the effect of known context constraints on this development fixture, with a tie against the stronger baseline. It establishes no clinical, historical-identity or general retrieval accuracy.

The [automated audit](../review/automated-source-audit.md) covers six artifacts, nineteen exact spans and 102 structural/reference checks. It does not certify 102 semantic claims or impersonate an independent reviewer. The original 34-record authentic diagnostic remains separate and unscored where independent reference labels are unavailable.

## Reproduction and maintenance

Run `npm run verify:product` to regenerate the current full technical checks. Run `npm run evidence:report` for the source-cell artifact, and `npm run evaluation:run` for the earlier comparison diagnostic. Build before starting the app. No dependency, external account, model key, policy hash or database migration was added.

Key boundaries: `ResearchJourney.tsx`/`journey.css` own navigation; `ScenarioWorkspace.tsx` initializes the existing editor; `VerificationSummary.tsx` renders the shared `VerificationStudy` contract; `verification-routes.ts` reads only a fixed artifact path; `source-retrieval.ts` contains pure matching/scoring; `evidence-study.ts` owns filesystem access and experiment execution. The outcome API also checks unique cell context through the shared matcher.
