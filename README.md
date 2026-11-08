# Aletheia RECON

For hosted production deployment, private visitor workspaces, backups and verification, see [deployment instructions](docs/deployment.md). The local application and its existing data remain independent from the hosted service.

A local research workbench for auditing whether evidence concerns the preparation actually recorded in a historical source. All five phases implement source inspection/annotation, material curation, comparison, scenarios, exact robustness/clarification, frozen dossiers, rights-aware exports, bibliography downloads, isolated import and offline decision replay. The evaluation ledger shows actual deterministic baseline/ablation outputs with authentic accuracy explicitly unscored while independent labels remain unavailable.

The bundled corpus is **assistant-checked and pending independent human review**. It is not expert-validated gold data. A passing software test does not establish botanical identity, therapeutic efficacy or clinical applicability.

Start at the [guided research home](http://127.0.0.1:4317/research): source → interpretation → experiment → reproducible audit. Separate onion/leek actions make the assumption explicit and select the same 2018 study. No user review decision is required to use the software. The [assistant-owned source checks](docs/review/automated-source-audit.md) explain the review provenance.

The Evaluation ledger includes an executed [32-request source-cell study](docs/research/source-cell-study.md): RECON locates 16/16 published cells and excludes 16/16 controlled context conflicts, tying BM25 with the same exact context filters. These are source-location results on a small development fixture. The [15-edition winner review](docs/research/winner-evidence-audit.md) and [flow audit](docs/product-flow-audit.md) explain the product decisions. Run `npm run verify:product` for the current full regression; its reports preserve the earlier phase acceptance records.

The [completed flow/evidence handoff](docs/handoffs/product-flow.md) records 246 passing regression tests, final mobile checks in Chromium/Firefox/WebKit and 48 final production route/width inspections. Existing corpus bytes, workspace counts and saved-dossier replay were preserved.

The two extensions add an [interpretation trace](http://127.0.0.1:4317/trace) and [matched measured outcomes](http://127.0.0.1:4317/outcomes). Trace the printed Old English word through the translation, editorial note and modern interpretation, then exclude or restore recorded citation paths. Compare the published onion/leek MIC medians by strain, inspect their original table cells and download reproducible arithmetic. The trace uses six pinned source revisions; the outcome adapter covers the 16 numeric cells of the 2018 MIC table with the original source hash and material links.

Their technical plan is in [Phases 6 and 7](docs/phases-6-7-plan.md), with [Phase 6](docs/handoffs/phase-6.md) and [Phase 7](docs/handoffs/phase-7.md) handoffs. Run `npm run verify:extensions` for the complete current regression gate, including the new workflows in Chromium, Firefox and WebKit. Replay a downloaded outcome comparison offline with `node tools/replay-outcome.mjs "C:\path\to\recon-outcome-contrast.json"` after building. This reproduces the arithmetic over the supplied observations and checks its fingerprints.

The default Chromium gate starts a fresh production server and database for each phase group. Reports are combined in `artifacts/browser/results.json`, with individual reports in `artifacts/browser/phase-reports`. This keeps the phase workflows independent while exercising the application’s real write-rate bounds.

## Run locally

Tested on Windows with Node **24.21.0**. The initial phases used npm **12.2.2**; the final source-only clean-install verification also passed with npm **11.3.0** using the committed lockfile. Node 24 is required. From this directory:

```powershell
npm exec --yes --package=npm@12.2.2 -- npm ci
npm run data:validate
npm run licenses
npm run build
npm run evaluation:run
npm run evidence:report
npm run start
```

Open [the guided research home](http://127.0.0.1:4317/research). No account, API key or remote font is required. GBIF lookup is optional; retained snapshots support offline name review. The database is created automatically at `data/local/recon.sqlite`. Only loopback is bound. Stop with Ctrl+C. Run `npm run dev` for the same-origin Vite development server on the same port; stop the production server first.

The system's npm 11.3.0 previously crashed during dependency resolution; replaying the final lockfile with `npm ci` passed. The isolated npm 12 command above remains the recommended setup and avoids changing your global installation. Exact versions and integrity hashes are in `package-lock.json`. Only SQLite and esbuild native installation scripts are allowlisted.

## Verification

```powershell
npm run typecheck
npm run lint
npm run data:validate
npm run test:unit
npm run test:integration
npm run build
npx --no-install playwright install chromium
npm run test:e2e
npm run data:review-gate
```

The last command deliberately fails while independent human checks are missing. It is a separate scientific release gate. Playwright starts an isolated production app on port 4318 with a new test database; it never edits the user workspace on port 4317. Screenshots, traces and machine-readable results are written to `artifacts/browser`. The Windows runner reuses the real user's browser cache when the sandbox redirects `LOCALAPPDATA`; it does not require a hard-coded username. Windows sandbox loopback restrictions may require running the app and browser verification outside that sandbox.

`npm run verify:phase1` runs the complete technical sequence and saves per-command logs and the final result under `artifacts/verification`. The historical Phase 1 result was 39 unit, 17 integration and 13 browser checks. `npm run verify:phase2` now runs all 66 unit, 27 integration and 20 browser checks and saves logs/report under `artifacts/verification/phase-2`. The user explicitly chose to retain a draft corpus; this technical pass does not approve the source annotations for scientific release.

`npm run data:build` deterministically rebuilds the corpus from the retained approved snapshots. `npm run data:validate` verifies artifact bytes, rights evidence, hashes, exact spans and references. It does not fetch new data or approve drafts. Changes to a frozen scientific record require new IDs/revisions; never overwrite an existing revision in the local DB.

See [the five-phase plan](IMPLEMENTATION_PLAN.md), [architecture](docs/architecture.md), [data dictionary](docs/data-dictionary.md), [upstream reuse](docs/upstream-reuse.md), [review packet](docs/review/phase-1-corpus-review.md), [Phase 1 handoff](docs/handoffs/phase-1.md) and [Phase 2 handoff](docs/handoffs/phase-2.md). Content licenses are recorded separately from software dependencies in [third-party notices](THIRD_PARTY_NOTICES.md).


## Material curation

Open a case, choose **Material & interpretations**, run proposals on the selected English source, inspect the exact wording and choose **Use in draft** or **Reject**. Part/state edits, manual annotations, candidate additions and explicit identity choices are staged until **Save new revision**. Saved and pinned earlier revisions remain inspectable. Unsupported languages use exact manual annotations without automatic translation. New passages enter through **Import passage** in the library, with edition/credit/rights metadata and a private draft label.

Saves stay draft by default. Only an explicit personal source check with declared reviewer details marks changed claims locally checked; it never validates the corpus or establishes historical identity. Scientific input hashes are reproducible records of reviewed fields/unknowns/assumptions, not comparability verdicts.

Run `npm run start -- --read-only` to disable editing. Set `RECON_LIVE_TAXONOMY=0` to use local snapshots only. `RECON_PORT` overrides 4317; `RECON_DATABASE_PATH` may select a separate DB only inside `data/local`. `npm run probe:taxonomy` performs a real fixed-host GBIF query and records honest success/unavailable evidence under `artifacts/providers`. Pending-rights imports remain private local data and are not approved for redistribution.


## Evidence audit

Choose **Evidence audit**, select specific formulation/assay records and compare the saved case revision. The workspace shows all nine material dimensions, source-linked reasons, separate assay context and unchanged reported outcomes. Pending assertions remain unknown; the current draft corpus cannot establish positive equivalence or clinical effectiveness.

Europe PMC search saves new records as pending metadata. An explicit article-permissions check can retrieve eligible CC BY 4.0/CC0 paragraphs for inspection, without accepting material or outcome claims. Unknown/restricted licenses and missing PMCIDs stay metadata-only. Preprint and published records remain distinct.

`npm run verify:phase3` runs the full technical gates and records logs under `artifacts/verification/phase-3`. Live-provider evidence is under `artifacts/providers`; offline bibliographic prototypes are under `artifacts/bibliography`. Read [the Phase 3 handoff](docs/handoffs/phase-3.md) before proceeding. The independent review gate remains pending by explicit user choice.

## Scenarios and material versions

Choose **Scenarios & robustness** from a case workspace. Evaluate explicit occurrence-scoped assumptions, save/fork immutable scenario revisions, compare against a reference, preview exact domains and freeze complete analyses. Zero selected groups is one fixed world. Reviewed mode excludes the original draft proposals; explicitly select draft exploration to examine them. Counts are not probabilities. Conditional reported-name correspondence, strict material comparability and paper-level versus fixed-arm coverage remain separate. Hypothetical overrides never become source facts or enter documented-domain audits.

**Compare material versions** selects two actual immutable source-backed versions and opens exact proof on each side. The original incomplete materials correctly retain strict unknowns; draft composition/methods notes remain available for inspection.

`npm run verify:phase4` runs every technical regression plus a recorded synthetic 64-world × 50-unit core load test. Read [the Phase 4 handoff](docs/handoffs/phase-4.md) for reproducibility pins, APIs, measured limits and scientific qualifications. No new repository or package was required for Phase 4.

## Dossiers, replay and evaluation

Save a frozen analysis from the scenario or material comparison workspace, then choose **Open dossier and downloads**. **Dossiers** in the main navigation lists saved analyses and validated isolated imports. Actual downloads include replay JSON, readable standalone HTML and CSL-JSON/BibTeX/RIS reference metadata. Protected source originals and exact quotations are omitted when redistribution is not authorized; their citations/locators/hashes and structured decision facts remain. Independent source access and decision replay are clearly distinguished.

```powershell
npm run build
npm run replay -- "C:\path\to\dossier.json"
# Verification with networking explicitly blocked:
node --require ./tools/offline-network.cjs ./tools/replay-dossier.mjs "C:\path\to\dossier.json"
npm run evaluation:run
npm run verify:phase5
npm run verify:clean
```

Replay needs installed dependencies and the built pinned engine, with no server, database, model or API key. Imported dossiers keep their original identifiers inside a separate namespace; **Create editable copy** creates a new pending case from an included passage without promoting imported reviews. The original dossier remains unchanged.

`/evaluation` reads real artifacts under `artifacts/evaluation`. The panel contains 34 correlated interpretation records from 14 units/three studies/two historical families, twelve actual passage windows and 40 separate synthetic aggregation sentinels. Authentic accuracy, false acceptance and extraction/retrieval relevance scores are unavailable without independent reference labels. The optional LLM baseline is explicitly not run. See [methods and limitations](docs/methods.md), [Phase 5 handoff](docs/handoffs/phase-5.md) and [final acceptance](docs/release-acceptance.md).

Chromium regressions use the existing browser cache. For Firefox/WebKit, install the matching Playwright engines into the workspace once:

```powershell
$reconPreviousBrowserCache = $env:PLAYWRIGHT_BROWSERS_PATH
try {
  $env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) 'artifacts/browser-engines'
  npx --no-install playwright install firefox webkit
} finally {
  $env:PLAYWRIGHT_BROWSERS_PATH = $reconPreviousBrowserCache
}
npm run test:cross-browser
```

`verify:phase5` saves all technical gate logs plus separate Chromium and Firefox/WebKit reports; `verify:clean` builds an isolated source-only copy with its own npm install and database. It never deletes or replaces your local workspace. The optional embedded facsimile viewer was not added. No production control depends on a paid service or model.

If a bundle is rejected, retain its original bytes and inspect the explicit version/hash/reference/rights error. Re-exporting a new analysis is appropriate for a genuinely different policy; editing a file to bypass an integrity check does not authenticate its content. If an original is withheld, import your own authorized passage to continue editing. A stale editor save retains its draft; reload the latest revision or save a fork. The independent corpus review gate still intentionally reports pending.
