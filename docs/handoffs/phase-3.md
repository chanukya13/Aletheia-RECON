# Phase 3 handoff — tested-material evidence audit

**Software implementation is delivered for the explicitly authorized draft-corpus mode.** Scientific release remains pending. The original 102 assertions have not been silently accepted, and the six unreviewed 2020/2023 arm outcomes remain explicitly unknown. There is no measured accuracy claim or invented benchmark. Phases 4–5 have not started.

## Working product

Open `http://127.0.0.1:4317/cases/balds-eyesalve/evidence`, or follow **Evidence audit** from a source/material workspace. Select real formulation × assay records, compare the pinned case revision, expand dimension reasons, inspect exact source passages and read separate assay context and reported observations. The library contains three primary studies and 14 distinct units, not 14 independent papers. Imported cases can use the same evidence selector.

The nine dimensions are identity, composition, part/state, preparation, process order, contact, maturation/thermal processing, quantity and characterization. All dimensions are evaluated before aggregating; critical mismatch outranks unknowns, which remain visible. Unknown is never a positive match. Whole mixture versus constituent is a scoped mismatch, not evidence of inactivity. Controlled accepted quantities remain attached to their occurrences; ingredient multiset order cannot exchange which ingredient received an amount. Explicit process order is compared as a DAG, independent of record IDs.

Pending or unstructured input stays unknown. A methods paragraph is not treated as a normalized process model. An explicitly complete reviewed composition is required before claiming composition correspondence; missing components are not inferred from incomplete lists. Context compares explicitly recorded fields on both sides, without inventing a historical diagnosis. No material/context verdict changes a paper's outcome or establishes clinical effectiveness. The default draft corpus therefore produces insufficient-information results; this is an honest research finding, not an empirical success rate.

Literature search is a bounded Europe PMC literal-phrase search with cursor pagination, raw snapshots, retrieval times, publication types, license/PMCID availability and truthful failures/stale states. Saving a result creates pending metadata separately from curated studies. Saved pending records remain visible after reload. Preprint and published identities remain separate even when titles coincide.

The licensed-paragraph action checks a supported open-license metadata record and PMCID, retrieves a bounded fixed-host XML response, verifies the article-front permissions URI, and previews pending paragraphs. CC BY 4.0/CC0 are supported; unknown/restricted/missing metadata, malformed/unsafe XML and provider failures stay metadata-only. Figures, table blocks, references and supplements are excluded. Retained text never creates accepted material, assay or outcome assertions automatically. Bibliographic projection/conversion is prototyped offline for Phase 5, without enabling premature export controls.

## Files, architecture and persistence

- `packages/contracts/src/evidence.ts`: study/detail, pinned evaluation, literature/search/import, pending metadata/list and pending full-text response contracts. Existing base contracts remain compatible; health now reports comparison availability.
- `packages/core/src/compare.ts`: pure policy/hash, reviewed-input checks, all nine findings, conservative aggregation, explicit recorded-context comparison, preserved outcome pointer, source references and dependency read sets. This is the sole rules implementation; no policy logic is copied into React.
- `apps/server/src/evidence-routes.ts`: local study/detail, evaluation and pending literature endpoints; existing origin/CSRF guard is reused for mutations.
- `apps/server/src/literature.ts`: fixed-host search, literal query escaping, bounded cursor pagination, raw provider snapshots, cache, honest failure states and idempotent provider-record imports.
- `apps/server/src/full-text.ts`: article permissions parsing, XML/entity safeguards, licensed paragraph extraction and raw-content receipts/cache.
- `apps/web/src/components/EvidenceWorkspace.tsx` and `evidence.css`: actual evidence selection, findings, source dialogs, readable assay metadata, immutable outcomes, literature and pending-record preview. Stale comparisons are hidden when the selected evidence or case hash changes.
- `SourceAnnotationAdapter.scrollTo`: native DOM range locator avoids the upstream renderer's missing-layout-bounds failure when a modal first opens. Source text/Unicode/teardown behavior remains covered by the full existing adapter suite.
- `tools/probe-literature.ts`, `prototype-bibliography.ts`, `verify-phase3.mjs`: reproducible provider, bibliographic and verification tools.

**Migration 4** adds immutable evaluation payload storage keyed by scientific input hash, raw literature snapshots, pending metadata and pending full-text receipts/raw XML. Migrations 1–3 are unchanged. Existing source/case/material/assertion records and the frozen corpus JSON are unchanged. The user's workspace still contains the two original cases; actual live verification added two pending metadata records (preprint and published article), plus the published article's licensed paragraph receipt. Neither is a new curated evidence unit or a scientific acceptance.

Input hashes pin the exact case content, corpus, policy hash, evidence selection and scenario input. Results have deterministic IDs/hashes and include all relevant source/material/context/outcome dependencies. A conservative material read set is retained for Phase 4 invalidation. It is not an incremental evaluator yet. Full hypotheses/robustness/clarification and replay/export remain later-phase work.

## APIs and runtime

All paths below have the `/api/v1` prefix. Strict contracts are shared with the browser.

| Method/path | Behavior |
| --- | --- |
| `GET /studies` | Three real local studies and their formulation × assay units |
| `GET /studies/:id` | Study metadata, tested materials, rights-filtered assertions/spans/sources |
| `POST /cases/:id/evaluate` | Pinned case revision, explicit scenario and 1–50 unique evidence IDs under `material-audit-v1`; rejects invalid/foreign assignments, policy/revision/unit IDs and hypothetical overrides |
| `GET /literature/search?q=&cursor=` | Literal phrase Europe PMC metadata search with raw retained snapshot |
| `POST /studies/import` | Import an exact source+ID from a retained provider snapshot as pending metadata |
| `GET /pending-studies` | Bounded list of retained pending metadata |
| `POST /pending-studies/:id/full-text` | Check/retrieve eligible licensed paragraphs, or a metadata-only reason |

The app remains loopback-only, with shared same-origin/CSRF protection, strict JSON/schema boundaries, safe rendered text and CSP. Search input is a literal phrase, not an injectable provider query expression. Only fixed Europe PMC PMCID URLs are fetched. Literature search is limited to 20/minute, a seven-second timeout and 1 MB response; XML has a 5 MB cap and 500,000-character paragraph cap. Search snapshots are fresh for 24 hours; provider failure returns stale retained metadata or an unavailable capability state. Local evidence/comparison does not depend on network access.

No new account/key is required. `RECON_LIVE_TAXONOMY=0` currently disables both enrichment adapters; retain that behavior in offline tests. Normal port is 4317; real-browser regressions use 4318 and a fresh UUID SQLite database. `--read-only` disables guarded mutations, including persisted evaluation requests. No public authenticated editor is implied.

## Verified sources and upstream reuse

The frozen corpus remains SHA-256 `623a6697e3bd9fc129cec099e989860cd04c563f1fe3049b5415dcb95c9fe0fd`: six source revisions, 19 exact spans, 102 draft assertions and 14 units from three studies. The eight 2018 MIC values are displayed as recorded draft observations; numerical provenance remains independently checked against the retained primary table. The 2020 paired-batch summary does not justify inventing separate arm means from a figure. The 2023 strain/outcome gaps remain visible. No absence of review is represented as a negative result. Historical oxymel remains a preparation mention with incomplete composition.

R1–R4 continue unchanged. R5 installs **only** `@citation-js/core`, `@citation-js/plugin-bibtex`, `@citation-js/plugin-ris` **0.9.0**, MIT. No whole repo, Python service, DOI/Wikidata resolver, CSL/citeproc plugin or AI feature was added. Lockfile integrities/notices inventory the exact eight added packages. `tools/prototype-bibliography.ts` converted controlled CSL-JSON projections of the three source-backed draft studies to BibTeX/RIS under `artifacts/bibliography`. A synthetic Unicode/missing-date unit fixture tests preservation without pretending to be research evidence. Bibliographic independent review remains pending. See [upstream documentation](https://github.com/citation-js/citation-js/blob/main/README.md) and `docs/upstream-reuse.md`.

The live implementation was actually exercised, not inferred from documentation. `artifacts/providers/europe-pmc-probe.json` and `europe-pmc-search.json` record a successful **eyesalve** literal query with ten real metadata results and a next cursor. The API follows [official Europe PMC REST documentation](https://dev.europepmc.org/RestfulWebService).

The actual browser then searched **Anti-biofilm efficacy of a medieval treatment** and saved two distinct real records:

- PPR153765, DOI `10.1101/2020.04.21.052522`, no PMCID, restrictive `cc by-nc-nd` metadata: correctly retained **metadata only**. Evidence: `europe-pmc-browser-preprint.json`.
- MED 32724094, DOI `10.1038/s41598-020-69273-8`, PMCID **PMC7387442**: its article-front permissions place the CC BY link inside `license-p/ext-link`. After adding that actual JATS form, the browser retrieved **45,071 characters** of pending paragraphs under `http://creativecommons.org/licenses/by/4.0/`. Raw SHA-256: `e0926b48da93e75f55cd363318893f337f37057a02d25661542e1bf059e71ff3`. Evidence: `europe-pmc-browser.json`, `phase3-2020-live.xml`, and `live-literature-paragraphs.png`.

The parser change has a dedicated fixture; permissions elsewhere in a paper cannot authorize reuse. These probes verify the actual provider/rights/preview path, not exhaustive correction/retraction clearance or continuous provider availability.

## Testing and browser gates

The final `npm run verify:phase3` sequence executes **licenses → build → typecheck → lint → data:validate → test:unit → test:integration → test:e2e**, saving command logs and `report.json` under `artifacts/verification/phase-3`. The technical pass is separate from `data:review-gate`, which still reports **102/102 pending independent human checks**. No assistant check is relabeled as a human review.

Unit coverage includes draft/unknown abstention, all-dimension aggregation/precedence, whole-mixture scope, occurrence-bound quantities, reviewed process DAGs, explicit recorded context, immutable outcome pointers, XML permissions, internal entity rejection, restricted licenses and controlled Unicode bibliographic conversion. Integration covers study→pinned API evaluation→resolvable exact sources, repeatable hashes/idempotent evaluation storage, invalid policy/revision/evidence/assignment rejection, literal query construction, caching/pagination metadata, provider 429/503/malformed/timeout, idempotent pending metadata, and separately licensed pending paragraphs/raw provenance/cache. Existing Phase 1/2 regression checks remain included.

Actual Chromium exercises source→evidence→unit selection→evaluation, expands composition/preparation reasons, opens precise supporting passages, adds a second assay, checks outcome/context displays, verifies offline provider failure without losing local results, and reloads the workspace. The suite checks 1440×900, 1024×768 and 390×844, no horizontal overflow, console/network errors, and WCAG A/AA-tag Axe results. Existing keyboard, dialog focus, phone touch, zoom-equivalent/reduced-motion and real adapter renderer tests remain active. The additional running-app browser probe verifies real provider search/import and pending licensed text through visible controls. Screenshots under `artifacts/browser/screenshots` were visually inspected; raw context JSON was replaced by labeled fields after that inspection.

These are software/integrity tests, not scientific accuracy measurements. No benchmark split/held-out claim, extraction accuracy, clinical support, speedup or performance percentile has been invented. Phase 5 still owns empirical evaluation and release criteria.

## Boundaries for the next phase

Keep pending scientific fields conservative. Inferred choices and modern-name normalization cannot settle historical identity. The original historical quantities do not establish mass/volume basis. Methods summaries and unreviewed modern materials must not become positive matches just because strings or hashes coincide. Independent review and richer structured material curation remain scientific work; the software shows those gaps explicitly.

Phase 4 must build named immutable scenarios, material-version comparison, propagation/diff, exact bounded robustness and clarification on the same pure evaluator. Do not duplicate the rules in the UI or use a matching digest as a verdict. Persist all policy/corpus/case hashes and recompute conservatively when dependencies change. Metadata-only pending records are not admissible assay units. Exports/replay and measured baselines remain Phase 5. No future control is shown as though it already works.


## Final executed gate record

Final complete verification: **2026-11-06 11:12:53 UTC / 16:42:53 IST**. `report.json` is `technical_passed`; every listed command returned zero. **90 unit + 34 integration + 23 Chromium tests = 147 passed**, with 0 skipped, unexpected or flaky browser results. License inventory: 408 lockfile entries / 331 installed. Production build, type checking, lint, frozen-data validation and source/permission integrity checks passed. Upstream Zod annotation and Vite main-chunk-size warnings are nonfatal and remain recorded. Latest UI chunk is approximately 13.75 KB / 4.70 KB gzip; no performance percentile is claimed.

The final quantity regression binds constraints to occurrences, refuses incomplete quantity coverage, and verifies that swapping ingredient amounts changes the finding. The bibliography fixture preserves literal Chinese/Spanish contributors and an absent date. The explicit-context fixture distinguishes aligned/different/unknown recorded settings without a clinical-support claim. The complete source/annotation/browser regressions passed after the locator fix.

`npm run data:review-gate` still reports 102/102 pending independent checks, as recorded in `review-gate.log`. All source-review status remains draft. The running local browser verified migration 4, comparison enabled, no console errors and the actual preprint-versus-published import/license behavior. This is the end of Phase 3 technical work, not independent scientific release approval.

Code/data revision: `b2c6f35807a580b842a0e679fcf77a4335f99538401aecf1274840adde323fa7` across 98 files; see `artifacts/verification/phase-3/source-manifest.json`. Rule changes after this handoff require a new policy version/hash and reproducibility record.
