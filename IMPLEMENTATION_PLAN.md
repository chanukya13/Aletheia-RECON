# Aletheia RECON — implementation plan

**Product-flow and evidence update, 8 November 2026:** the guided investigation, explicit study-scoped interpretation actions and executed source-cell comparison are described in the [flow audit](docs/product-flow-audit.md), [15-edition winner review](docs/research/winner-evidence-audit.md) and [study methods/results](docs/research/source-cell-study.md). The assistant owns [automated source integrity checks](docs/review/automated-source-audit.md); no user review decision blocks normal operation. `npm run verify:product` executes the full current technical gate into `artifacts/verification/product-flow`. Earlier phase results below remain historical records.

**Executed acceptance:** 246 regression tests passed, followed by final mobile-layout verification in all three browser engines and 48 actual-production route/width checks. Original corpus bytes, workspace counts and the saved dossier replay are preserved. See the [completed handoff](docs/handoffs/product-flow.md) and `artifacts/verification/product-flow/acceptance-receipt.json` for exact results and scientific scope.

**Status, 7 November 2026: all five phases are implemented and technically verified in the user-authorized draft-corpus mode.** The final 12-gate run passed with 120 unit, 49 integration, 39 Chromium and four Firefox/WebKit checks (**212 tests**), a bounded 64-world × 50-unit audit benchmark and real production-browser timing. A separate source-only clean installation/build/start/offline replay/import preview also passed. The original 102 assertions remain draft; independent source review and authentic scientific accuracy remain outstanding. See [Phase 1 handoff](docs/handoffs/phase-1.md), [Phase 2 handoff](docs/handoffs/phase-2.md), [Phase 3 handoff](docs/handoffs/phase-3.md), [Phase 4 handoff](docs/handoffs/phase-4.md), [Phase 5 handoff](docs/handoffs/phase-5.md), [final acceptance](docs/release-acceptance.md) and `artifacts/verification/phase-5/report.json`.

Prepared 5 November 2026 for EthnoHack Track 1. The direction decision, international prior art, scientific rationale and research limitations are in [CRITICAL_ASSESSMENT.md](CRITICAL_ASSESSMENT.md). This plan supersedes speculative implementation choices in the product context, while preserving its scientific-integrity requirements. It authorizes no registration, messaging, submission materials or publication activity.

**Extension status, 8 November 2026: Phases 6 and 7 are implemented and verified.** Phase 6 adds the source-role interpretation trace with exclusion/restoration. Phase 7 adds matched reported-outcome comparisons with exact table cells and offline arithmetic replay. The combined gate passed 127 unit, 51 integration, 43 Chromium and 12 Firefox/WebKit tests, **233 total**. Final wording refinements passed additional targeted checks in all three engines. Read the [Phase 6/7 implementation plan](docs/phases-6-7-plan.md), [Phase 6 handoff](docs/handoffs/phase-6.md), [Phase 7 handoff](docs/handoffs/phase-7.md) and `artifacts/verification/extensions/acceptance-receipt.json`. The original 102 assertion reviews remain pending.

**Repository-reuse revision, 5 November 2026:** the concrete upstream/code/license review is in [REPOSITORY_REUSE_AUDIT.md](REPOSITORY_REUSE_AUDIT.md). Section 3.4 and each phase below specify what to clone, install, adapt or keep original. That audit described pre-install research. The actual Phase 1 pins, registry integrity records, adaptations and runtime checks are now in [docs/upstream-reuse.md](docs/upstream-reuse.md); the R1 one-origin architecture was retained.

**Explicit user decision, 6 November 2026:** no independent reviewer is available yet; keep the corpus as **draft**. Technical implementation may proceed using clearly labeled draft data. This is an exception to the original Phase 1 human-release-check timing, not permission to mark assistant checks as human review, accept pending extraction facts automatically, call this gold data or claim validated scientific results. The separate `npm run data:review-gate` must continue to fail until the actual checks are recorded. See the concrete [review packet](docs/review/phase-1-corpus-review.md).

## 1. Product decision and release boundary

Build a local-first **evidence-transfer audit workbench**. A researcher opens a historical preparation, inspects source-backed assertions, compares them with a specific modern tested material, changes a documented interpretation, runs an audit across the bounded interpretation space, and exports a reproducible dossier.

The enhanced capability is exact analysis of **robust, interpretation-dependent and unresolved evidence comparisons**, followed by computable clarification questions. It is a sensitivity analysis of recorded assumptions. It is not a biological simulation, causal inference engine, efficacy score or treatment recommendation.

The required release contains:

1. Two authentic historical case families: Bald's eyesalve and a Hippocratic oxymel preparation/use passage. The latter may be a preparation mention rather than a fully specified recipe; label it correctly.
2. Three modern primary studies as the initial evidence corpus: Fuchs et al. 2018, Furner-Pardoe et al. 2020, and Harrison et al. 2023. Curate at least 12 distinct material/context evidence units in total, only where the studies support them. More units within a study are not independent studies.
3. Source inspection, exact annotations, scoped automatic extraction proposals and manual review; botanical candidates with separate historical and taxonomic provenance.
4. Deterministic material comparison with cited per-dimension reasons and a separate account of assay context and reported outcomes.
5. Persistent local interpretation scenarios, actual dependency-sensitive recalculation and an exact bounded robustness audit.
6. Minimal sufficient sets of interpretation questions, separate lists of missing documentation, and honest unchanged results.
7. Import of a researcher's plain-text passage and a validated structured case bundle, plus readable HTML and structured JSON export/replay, with CSL-JSON/BibTeX/RIS bibliographic downloads.
8. A real evaluation harness, raw outputs and failure analysis; polished working UI; production-build browser verification.
9. Direct comparison of two source-backed historical or modern reconstruction/material versions, reusing the same scientific policy and provenance model. Differences do not establish recipe lineage, chemical consequences or clinical effects.

The source collection is deliberately small. This is a useful instrument with stated coverage, not an international medicinal-knowledge atlas. No training, GPU, paid account or model key is required for its core workflow. The mandatory extraction is a transparent, scoped NLP pipeline over supported English text and an editable dictionary. Old English and Greek are preserved and manually annotatable; broad automatic understanding of those languages is not promised.

Exclude from the release: general chat, autonomous web crawling, image/PDF OCR uploads, activity/synergy prediction, molecular docking, clinical recommendations, automatic translation presented as scholarship, automatic recipe genealogies, a large graph visualization, multi-user accounts, real-time collaboration, and a second deployment platform. Do not render controls for excluded features.

## 2. Time, sequence and handoff rules

Devpost's timestamp, rechecked at **5 November 2026, 23:37 IST**, was `2026-11-08T09:00:00Z`: **8 November 2026, 14:30 IST**. About **62 hours 52 minutes** remained at that recheck, closer to 2.6 days than four full days. This agrees with the event's explicit EET banner; use the timestamp instead of calculating from the general CET prose. [Official event/schedule](https://ethnohack2026.devpost.com/).

The initial release has **five sequential implementation phases**, followed by the two extensions documented in `docs/phases-6-7-plan.md`. Each starts from the preceding phase's verified handoff. A fresh coding agent should read Sections 1–8, the relevant phase, and all previous handoffs before editing. “Independently” means a new agent can implement a phase from these contracts; it does not mean building incompatible applications in parallel.

| Phase | Outcome | Estimated focused implementation time | Must already be verified |
| --- | --- | --- | --- |
| 1 | Source preflight, upstream compatibility spike, contracts and a functioning reader | 5 hours | Nothing implemented |
| 2 | Extraction, annotation/review and material/identity workspace | 6 hours | Phase 1 |
| 3 | Arm-level study evidence and deterministic comparison | 7 hours | Phase 2 |
| 4 | Material-version comparison, scenarios, propagation, robustness and clarification | 6 hours | Phase 3 |
| 5 | Dossiers, reference exports, replay, evaluation and final browser/release verification | 8 hours | Phase 4 |

These revised estimates total approximately 32 focused implementation hours; they assume the selected components pass their spikes and are not measured speedups. Allow an additional 4–6 curator-hours for source verification and annotation, plus rest and a final recovery buffer. Aim for a feature freeze by **8 November 08:30 IST**, leaving six hours before the confirmed cutoff. Recalculate available time when implementation is actually authorized. If authorization is later, expose the feasibility risk immediately; never silently mark unfinished gates complete. The first 90 minutes of implementation resolve the upstream compatibility decision alongside source preflight; no more complete-product fork search is necessary.

At each handoff, produce `docs/handoffs/phase-N.md` containing the code/data revision, migration version, files changed, exact commands run, actual test counts, screenshots/trace paths, source checks performed, known limitations and remaining blockers. Include new environment variables and contract changes. A checklist tick without execution evidence is insufficient.

Scope reductions may remove optional live enrichment, print refinements, additional languages or extra cases beyond the two required families. They may not remove source licensing, typed unknowns, the functioning audit, export/replay, meaningful evaluation, or browser gates. If a required authentic case cannot be sourced, report the failure and revise the scope explicitly; do not substitute a synthetic case without changing the release claim.

## 3. Fixed architecture

### 3.1 Stack and ownership

Use one TypeScript workspace to keep the browser, API, CLI and scientific rules consistent:

| Layer | Decision | Responsibility |
| --- | --- | --- |
| Runtime | Node.js 24 LTS; record the installed supported patch | Mature common runtime on Windows and Linux. Node's release documentation identifies this as a supported LTS line. [Node releases](https://nodejs.org/en/about/previous-releases) |
| UI | React 19, TypeScript strict mode, Vite, React Router | Case routes, source reader, review forms and audit views |
| UI state | TanStack Query for server state; local reducer for unsaved edits | No duplicate scientific engine in components |
| Styling | Plain CSS tokens; accessible Radix primitives only where needed; local/system fonts | Consistent visual quality with limited dependencies |
| Contracts | Zod 4; infer TypeScript types and generate JSON Schema from these definitions | One schema source for imports, API requests/responses, exports and tests |
| API | Fastify 5; generated JSON Schema validation and explicit response schemas | Orchestration, persistence, provider adapters and error envelopes |
| Server/UI integration | Official `@fastify/vite` vanilla TypeScript SPA pattern, subject to the Phase 1 spike | One-origin development and production; no `@fastify/react` SSR renderer |
| Persistence | SQLite through `better-sqlite3`; numbered SQL migrations, prepared queries | One local file, transactions, immutable scientific revisions |
| Source annotation | `@recogito/text-annotator` core behind an owned React/span adapter | Reuse selection/highlighting, preserve our source/assertion semantics |
| Serialization/import | `canonicalize` plus stable `jsonc-parser` behind strict owned boundaries | RFC 8785 canonical bytes, duplicate-key and strict JSON validation |
| Reference export | Selected Citation.js core/BibTeX/RIS modules, server/CLI only | Export reviewed bibliographic metadata; no CSL processor or remote auto-resolution |
| Scientific logic | Pure TypeScript package with no network, DB, clock or UI dependency | Extraction helpers, normalization, comparison, enumeration, impact and questions |
| Verification | Vitest, fast-check, React Testing Library, Playwright and axe | Unit/property, integration, accessibility and real-browser tests |
| Research CLI | TypeScript commands using the same contracts and core package | Data validation, evaluation and offline replay |

Pin exact compatible dependency versions and record licenses in Phase 1. Commit one npm lockfile; use npm workspaces and `npm ci`. No installation takes place during this planning task. Verify native SQLite driver installation on Windows at the first gate, before building on it. Do not introduce Python services, Redis, vector databases, graph servers, queues, an ORM or a hosted account dependency for this corpus size. Upstream JavaScript packages remain JavaScript dependencies with their typings/owned TypeScript adapters; do not rewrite them. The Python candidate repositories in the reuse audit are references or potential isolated evaluation tools, not production services or ports.

### 3.2 Repository boundaries

```text
apps/web/src/                 UI, routes, components, accessibility, CSS
apps/server/src/              HTTP routes, services, DB repositories, adapters
apps/server/migrations/       ordered SQL migrations
packages/contracts/src/      Zod schemas, enums, API DTOs, schema generation
packages/core/src/           extract/, normalize/, compare/, scenarios/, provenance/
packages/core/test/          rule, property and oracle tests
tools/                       validation, import, evaluation, replay commands
research/upstream/           ignored, pinned source checkouts for selective reuse
data/sources/                approved source snapshots and separate rights records
data/cases/                  curated versioned case manifests
data/taxonomy/               bounded, attributed taxonomy snapshots
data/evaluation/             annotation guidelines, split manifests and labels
tests/integration/           API + temporary SQLite tests
tests/e2e/                   Playwright browser journeys and failure tests
docs/                        decisions, data dictionary, methods, handoffs
artifacts/                   generated verification evidence; excluded from source data
var/                         ignored local database/cache; no committed private imports
```

Import direction: `contracts ← core ← server`; the browser imports `contracts` and UI-only helpers, and obtains authoritative decisions from the API. The CLI imports `core` and `contracts`. Provider code cannot enter `core`. UI snapshots cannot become scientific fixtures. Avoid circular workspace imports.

### 3.3 Runtime and persistence

- Development: Fastify on `127.0.0.1:4317` with Vite middleware/HMR and the same-origin API; no separate public Vite origin after the R1 spike passes. If that spike fails within 90 minutes, explicitly freeze the original fallback (Vite on `127.0.0.1:5173` proxying `/api` to Fastify on port 4317) in the Phase 1 handoff.
- Production/local verification: Fastify serves the built UI and `/api/v1` from `127.0.0.1:4317`; browser refreshes of deep routes return the app, while unknown API routes return JSON 404.
- SQLite: enable foreign keys per connection, WAL and a bounded busy timeout; transactions encompass case revision writes and scenario saves. Run migration tests from empty and previous versions. [SQLite foreign keys](https://www.sqlite.org/foreignkeys.html), [WAL](https://www.sqlite.org/wal.html).
- Scientific inputs are immutable revisions. Editing creates a new revision and `supersedes` relationship. Never alter a cited source text or overwrite a historical assertion in place.
- Store source bytes/text hashes, case revision, policy version and scenario assignments with every persisted analysis. A provider refresh creates a new snapshot; it cannot change old results.
- Compute small analyses synchronously with explicit size/time limits. No fake background-progress UI. Long provider operations have a cancelable request and bounded timeout.
- Core comparisons work offline using bundled approved data. Live source search is an enrichment path with visible availability; its failure cannot break saved cases.

Future deployment is optional and outside the mandatory completion gate. A publicly accessible build must run in read-only mode, with stateless bounded analysis allowed and imports/persistent edits disabled. Do not expose the local editor publicly without implementing authentication and authorization in a separately reviewed extension.

### 3.4 Upstream reuse contract and acquisition order

Use the pinned source revisions and reviewed paths in [REPOSITORY_REUSE_AUDIT.md](REPOSITORY_REUSE_AUDIT.md). The selected units are:

| ID / phase | Acquisition | Exact adaptation boundary |
| --- | --- | --- |
| R1 / Phase 1 | Partial/sparse checkout of `fastify/fastify-vite` commit `127d70319fb2668cf5b59e339e08e2dd95bffd08` | Only `e2e/react-vanilla-spa-ts/`, referenced test helpers and license. Adapt server factory, Vite config and React mount to our workspace. Replace monorepo catalog/workspace dependencies, pnpm commands, example screens and POSIX environment assignments. Do not clone the whole repository into the product root. |
| R2 / Phases 1–2 | Package `@recogito/text-annotator`, reviewed source manifest `4.3.7` | One `SourceAnnotationAdapter` and lifecycle wrapper. No default React/TEI/PDF wrapper, remote storage or upstream annotation acceptance rules. |
| R3 / Phases 1–5 | Package `canonicalize`, reviewed source manifest `5.1.0` | One `scientificHash` helper over validated domain-normalized JSON. The package supplies serialization; we supply scientific payload boundaries and SHA-256. |
| R4 / Phases 1 and 5 | Stable package `jsonc-parser@3.3.1`, reviewed commit `3c9b4203d663061d87d4d34dd0004690aef94db5` | One `parseJsonStrict` helper, used by HTTP/import/CLI boundaries. Reject parser recovery/errors, comments, trailing commas, duplicate decoded keys, unsafe keys and depth above 64. Do not use the current prerelease main branch. |
| R5 / Phases 3 and 5 | Same verified release cohort of `@citation-js/core`, `@citation-js/plugin-bibtex`, `@citation-js/plugin-ris`; reviewed manifests `0.9.0` | Structured reviewed CSL-JSON → bibliographic files. No `citation-js` all-plugin bundle, DOI/Wikidata resolver or `@citation-js/plugin-csl`/`citeproc`. |
| R6 / conditional Phase 5 | Package `openseadragon`, reviewed source manifest `6.1.1` | Optional rights-cleared page image/IIIF viewing behind a React wrapper. No OCR, automatic image/text alignment or arbitrary manifest URL fetcher. |

Before installing anything, confirm stable release availability, actual source revision, registry integrity, engine/peer compatibility and resolved dependency licenses. npm registry retrieval was unavailable during this research; package manifests and code were inspected, but installation is unverified. If a reviewed source version is unpublished, inspect the nearest compatible stable release and record the revised pin before adopting it. Never use `@latest` or claim a package passed merely because its README describes the feature.

Create `docs/upstream-reuse.md` and `THIRD_PARTY_NOTICES.md` during Phase 1; include code/content license separation, copied upstream paths, modifications, exact pins and actual test evidence. This is required technical attribution. Keep our research evaluator, unknown-state semantics, source/assertion graph, provider adapters, scenario engine and benchmark labels original and testable. No generic JSON rule engine or structural diff library replaces them.

Do not convert Kitsune's Angular application to React, turn PaperQA/TCM-Sage into our production backend, port ShennongName's naming algorithm, or port TaxoNERD's learned behavior into TypeScript. Those choices incur architecture/model/data work without supplying our scientific core. R1 is the sole bootstrap; do not combine it with another complete generated application.

Admit R6 only after all mandatory functionality and gates pass, rights-cleared assets and exact page mappings are ready, at least 12 hours remain before the deadline, and a six-hour recovery buffer remains protected. Cap its implementation at two hours plus verification. Otherwise omit the viewer control. Reuse is not permission to expand into unvalidated RAG, additional languages or a large new corpus.

## 4. Shared scientific and data contracts

### 4.1 Assertion model

All significant fields are assertions, not bare strings with an optional citation. Define a discriminated `Recorded<T>` union:

- `recorded`: typed value, assertion ID, origin, source references and review state.
- `inferred`: typed value, assertion ID, rationale, supporting references and responsible reviewer; displayed as inferred.
- `contested`: competing assertion IDs with disagreement preserved; no silent winner.
- `unknown`: reason such as `not_reported`, `unreadable`, `not_reviewed` or `ambiguous`; never equivalent to a matching value.
- `not_applicable`: a policy-valid rationale, such as plant organ for a pure compound; never a generic escape hatch for missing information.

Origin is separately `human_curated | agent_curated | extractor_proposal | user_hypothesis | rule_derived | provider_metadata`. `agent_curated` was added during Phase 1 to preserve assistant authorship honestly. Review is `pending | accepted | rejected`, with reviewer identity/qualification description, optional explicit reviewer type, time and rationale. Human acceptance must explicitly identify a human reviewer. An accepted annotation records an editorial judgment, not biological truth. Model/dictionary confidence, if logged, is not a probability of historical identity.

Assertions reference one or more immutable spans or explicit source metadata fields. Rule-derived results reference the input assertion IDs and rule/version. Hypotheses reference a user rationale and are clearly distinguished from source claims. Pending extraction proposals cannot become accepted comparison facts automatically.

### 4.2 Source and span integrity

`Source` records title, creators, work, edition, translator if any, languages (BCP-47, including `ang` and `grc`), publication/date precision, stable identifier, canonical URL and source kind. Do not assign an exact ancient composition year from a modern edition date.

`SourceRevision` records retrieval time, original byte SHA-256, display-text SHA-256, parser/version, rights record and immutable display text. Preserve original-language and translation revisions separately, linked by an explicit alignment assertion. An absent original text is labeled absent, never generated to fill a panel.

Reserve an optional `facsimile` descriptor for a separately rights-cleared local page asset or approved IIIF image service, with source/canvas/page identity and attribution. Its absence is normal. It does not participate in text offsets or imply image/text alignment, and no viewer is rendered unless the conditional extension is implemented and verified.

`Span` records source revision, locator (page, chapter, XML paragraph/table/cell, manuscript identifier and verified canvas when available), exact text, prefix/suffix and offsets. Internally, offsets are **half-open UTF-16 code-unit offsets into the exact stored display string**, matching JavaScript slicing and browser selection. Never normalize that string after annotation. Keep search normalization separate. Reject spans unless `text.slice(start,end) === exact`. Test surrogate pairs, combining Greek accents, Old English characters, repeated phrases, CRLF and leading whitespace. For W3C interchange, convert to the standard's Unicode code-point position semantics explicitly; do not mislabel internal offsets as W3C positions. Quote-based anchoring provides a second check. [Web Annotation model](https://www.w3.org/TR/annotation-model/).

Rights are per artifact: identifier/license URI, credit, permitted storage/display/redistribution, restrictions, verification URL/date, third-party exclusions and decision `bundle_allowed | metadata_only | blocked | pending`. Unknown terms default to no content redistribution. A source can be searchable by metadata without permission to export its text.

### 4.3 Domain aggregates

| Aggregate | Required content / invariants |
| --- | --- |
| `CaseRevision` | Stable case ID, immutable revision, title, case kind `recipe \| preparation_mention`, source witness, material-version ID, original historical-use assertions, authenticity `authentic \| synthetic_fixture \| user_import`, review status, corpus revision and `baselineScenarioInput` (explicit assumption assignments, never source facts) |
| `MaterialVersion` | Kind `mixture \| plant_material \| isolated_compound \| other_natural_material`; component slots, assertion references, ordered/partially ordered preparation steps and fingerprint payload/hash; representation `historical_record \| documented_reconstruction \| hypothetical` |
| `IngredientSlot` | Stable occurrence ID, raw term/span/language, material kind, identity candidate IDs, selected identity only through a scenario, part, fresh/dry/other state, quantity constraints and processing assertions |
| `PreparationStep` | Raw operation/span, controlled operation if supported, inputs/outputs, known ordering, matrix/solvent, time/temperature/contact material, unknowns; no invented order or temperature |
| `QuantityConstraint` | Raw wording plus optional exact value/range, unit, dimension, basis (mass/volume/count/unknown), relationships such as equality, and provenance. Unknown historical measures remain unknown. |
| `TaxonConcept` | Checklist authority/dataset/version or snapshot, name-usage ID, accepted-usage ID, original reported name/rank, accepted name/rank, authority and infraspecific/cultivar qualifiers. IDs are scoped to a checklist. |
| `MappingCandidate` | Historical occurrence ID → proposed taxon/material, scholarly support spans, contextual rationale and status `documented_plausible \| inferred \| rejected \| unresolved`. Taxonomy lookup and historical identification are separate steps. |
| `Study` | DOI/PMID/PMCID where available, citation metadata, source revisions, study design, correction/retraction flags and shared-source family ID |
| `BibliographicRecord` | Reviewed structured metadata with stable ID, article/book/chapter type, title, creator roles, issued date or explicit unknown/literal date, edition/translator, identifiers, source revision and CSL-JSON projection. Formatting does not establish evidential support. |
| `EvidenceUnit` | Study ID, tested material-version ID, author arm label, assay-context assertions, comparator, endpoint/result assertions and exact supporting locations. Distinguish formulation, batch, assay and outcome; do not pool them into a paper-wide claim. |
| `InterpretationGroup` | Mutually exclusive, source-backed alternative bundles of assignments; optional documented cross-group constraints and domain-completeness limitation |
| `Scenario` | Case revision, base scenario, selected candidate/interpretation IDs and explicit hypothetical overrides, rationale and revision/hash. An override cannot mutate the historical witness. |
| `ComparisonPolicy` | Immutable version, scope, applicable dimensions, critical versus contextual requirements, identity relations, unit conversions and reason-code definitions |
| `AnalysisSnapshot` | Exact input hashes/revisions, selected evidence-unit IDs, policy and engine versions, results, dependency reads, world-domain definition and deterministic result hash |

Animal products, wine, honey, minerals and isolated chemicals need material identities; do not force them into plant taxa. A historical mention of “oxymel” does not supply missing composition, ratios or modern product standardization. Any contextual definition imported from a second source remains a separate cited inference.

### 4.4 SQLite relations

Implement `sources`, `source_revisions`, `spans`, `assertions`, `assertion_spans`, `cases`, `case_revisions`, `material_versions`, `material_assertions`, `taxon_concepts`, `mapping_candidates`, `studies`, `evidence_units`, `scenarios`, `analysis_snapshots`, `provider_cache`, and `audit_events`. Use foreign keys for parent/source/material/study references, unique `(case_id, revision)`, unique source hash/parser pairs, and indexes on case/source/study IDs. Small nested steps, groups, policy bodies, assay contexts and result envelopes may be validated JSON columns. Their embedded assertion/entity references must pass the same cross-reference validator before a transaction commits.

Core-owned source/case records cannot be deleted through an editing endpoint. Draft user imports can be discarded only if nothing cites them. Use parameterized SQL; never interpolate imported text. Store review and scenario history as append-only events. A database-schema version is independent of the corpus, policy and export-schema versions.

### 4.5 Fingerprints and taxonomy

Canonicalize a **material description**, not a chemical signature: stable ordered keys, deterministic ingredient multiset with stable slot IDs, sequence/ordering constraints, recorded normalized values, explicit unknown markers, selected assumptions and policy-independent provenance references. Retain verbatim fields alongside normalized fields. Use a deterministic JSON serialization and SHA-256.

Implement domain normalization first, then use R3's RFC 8785 serialization. Record `canonicalization = JCS-RFC8785/recon-science-v1` in analysis/export schemas. Validate plain JSON values and well-formed Unicode; reject nonfinite numbers, unsafe numeric values, undefined/function/symbol values, custom `toJSON`, cycles and invalid surrogate sequences. Do not Unicode-normalize source text to make its hash convenient. At raw JSON boundaries R4 rejects duplicate decoded keys before object construction; schema validation and reference validation follow. A package does not choose which arrays are scientifically ordered.

Fingerprint equality is useful for deduplication and caching. It is never sufficient for scientific comparability: two records can share missing data. The comparator reads typed fields, not just the hash. Preserve batch, geographical, voucher and chemical-characterization information even when it is unavailable for historical sources.

GBIF normalizes **modern scientific names**, with a cached response and checklist metadata. Check rank, match type, alternatives, accepted/synonym status and original qualifiers. An equal broad accepted ID must not erase distinct infraspecific or cultivated concepts. Fuzzy/high-rank matches require review and cannot silently identify a species. The GBIF match confidence describes a service match, not historical certainty. [Species API](https://techdocs.gbif.org/en/openapi/v1/species), [taxonomic uncertainty](https://training.gbif.org/en/data-use/taxonomic-uncertainty).

## 5. Comparison, uncertainty and dependency semantics

### 5.1 Fixed outputs and boundaries

For every selected historical/reconstruction material and evidence unit, return three separate objects:

1. `materialComparison`: per-dimension findings and a conservative aggregate verdict.
2. `contextComparison`: historical indication/route versus organism, strain, model, endpoint, setting and tested administration/exposure. This is not an automatic historical-disease crosswalk.
3. `reportedOutcome`: what that evidence unit actually reports, including negative, mixed, uncertain and not-reported results. Material matching cannot alter the paper's observation.

Each dimension has `match | mismatch | unknown | not_applicable`, input assertion IDs, reason codes, source references and any hypothesis IDs. A match may be conditional on a visibly selected interpretation. No weighted “scientific support” score, no automatic evidence hierarchy score, and no therapeutic-success badge.

### 5.2 Version-one policy

Implement one versioned conservative policy, `material-audit-v1`. Its dimension applicability is fixed by material kind and declared comparison scope, not chosen after seeing an attractive outcome.

| Dimension | Comparison requirement |
| --- | --- |
| Identity | Compatible, sufficiently specific taxon/material concepts, including unresolved/contested identities and qualifications |
| Composition | All relevant components and their presence/absence; whole mixture versus single component is a mismatch for whole-mixture transfer |
| Plant part / material state | Part, fresh/dry/processed state where biologically applicable; absent information is unknown |
| Preparation / extraction | Recorded operation, solvent/matrix and extraction kind; decoction, essential oil, fraction and isolated compound are not interchangeable |
| Processing order | Preserve known order/partial-order constraints; an unrecorded decisive order remains unknown |
| Contact materials | Explicit vessel/contact information; a different vessel/contact treatment is recorded as a difference, with no invented chemical consequence |
| Maturation and thermal processing | Known duration, temperature and heating/drying steps; distinguish absent reporting from documented absence |
| Quantity relationships | Compare only commensurate dimensions and explicit ratio constraints; equal volumes and equal masses cannot be equated |
| Provenance and characterization | Voucher, origin, batch, chemistry and authentication are reported as contextual limitations; they cannot be silently called identical or inferred from species |

Identity, composition, part/state, preparation/extraction, relevant process constraints and quantity relationships are critical for a full material comparison. Applicability/rationale is explicit for each material kind. Origin/voucher/chemistry are contextual documentation requirements in v1; their absence prevents claims about authenticated or chemical equivalence even if the recorded-material verdict passes. Do not claim full ConPhyMP assessment. The distinction follows the need for proper material characterization, without turning a reporting guideline into an equivalence certificate. [ConPhyMP](https://discovery.ucl.ac.uk/id/eprint/10156909/).

Aggregate in this order, while still evaluating **all** dimensions for explanation/dependency purposes:

1. Any explicit critical mismatch → `materially_incompatible`.
2. Otherwise any unknown or unresolved contested critical dimension → `insufficient_information`.
3. Otherwise a contextual difference or missing contextual documentation → `partial_match`.
4. Otherwise → `comparable_on_recorded_dimensions`.

The UI explains `materially_incompatible` as “Recorded material mismatch under this policy”; it does not mean biologically inactive or proven chemically different. `partial_match` and `insufficient_information` are not positive acceptances. The only strict comparable acceptance is the fourth state. Historical materials will often abstain; do not weaken the policy to manufacture positive results.

A requested identity-only or composition-only view is a **dimension view**, never a second full-material verdict or “support” label. If a future policy adds a weaker scope, it must have another name/version and cannot replace the displayed strict result invisibly.

Context results independently identify `different_context`, `context_not_established` or `aligned_on_recorded_context`. A laboratory assay is not a clinical outcome. Do not generate “supports historical treatment” from either material or context alignment. Surface uncertainty in historical indication interpretation rather than assigning a modern diagnosis automatically.

Reason codes include `TAXON_DIFFERENT`, `TAXON_UNRESOLVED`, `IDENTITY_SPECIFICITY_LOSS`, `COMPONENT_MISSING`, `WHOLE_MIXTURE_VS_COMPONENT`, `PART_DIFFERENT`, `PART_NOT_REPORTED`, `PREPARATION_DIFFERENT`, `MATRIX_NOT_REPORTED`, `PROCESS_ORDER_UNKNOWN`, `CONTACT_MATERIAL_DIFFERENT`, `DURATION_DIFFERENT`, `QUANTITY_BASIS_UNKNOWN`, `CHARACTERIZATION_NOT_REPORTED`, `ASSAY_CONTEXT_DIFFERENT` and `HISTORICAL_INDICATION_UNMAPPED`. Define each code's input requirements and source references in the policy file.

### 5.3 Interpretation domains and robustness

Default scenarios can select source-backed alternatives; user edits outside them are `hypothetical`, visibly labeled and excluded from the documented robustness domain. A choice is scoped to a term occurrence or explicit linked group, not every occurrence of a word in every source.

Enumerate admissible combinations of reviewed interpretation groups, applying documented constraints. Limits: at most four groups, at most four alternatives per group, **at most 64 admissible worlds**, and at most 50 selected evidence units per audit. Count exactly before analysis. Empty domains return a validation error. Over-limit domains return `DOMAIN_LIMIT_EXCEEDED`; never silently sample or call a partial enumeration exhaustive.

For evidence unit `e`, let `V(e,w)` be its deterministic material verdict in world `w`, and let `C` mean strict comparability:

- `robust_within_domain`: every admissible world has verdict `C`.
- `interpretation_dependent`: some, but not all, worlds have verdict `C`.
- `mismatched_throughout_domain`: every world is `materially_incompatible`.
- `undetermined`: all remaining cases, including mixtures of unknowns, partial matches and mismatches without any strict comparable world.

Always say **“within the documented alternatives”** and disclose whether the candidate list is exhaustive (usually it is not). Show exact counts, such as “identity matches in 1 of 2 enumerated interpretations,” as counts, never likelihoods or confidence percentages. An unbounded unresolved identity remains unknown; it is not resolved by enumeration.

At study level, preserve quantifiers: “for every interpretation, at least one arm covers this identity” differs from “one fixed arm covers every interpretation.” Display both when useful, and name the covering arms. Do not call paper-level identity coverage robust full-material comparability. This matters when a paper tested both onion and leek.

### 5.4 Dependency recalculation and decisive questions

Every derived comparison records the assertion IDs, scenario choices and policy fields it read, including inputs behind unknowns and mismatches. Build an inverted dependency index. An edit determines the transitive affected result set; recompute those results and subsequent summaries. If dependencies are uncertain, recompute the whole small analysis. Correctness takes priority over optimization.

Do not stop reading dimensions after the first mismatch: another field can change later even when the aggregate does not. Return old/new verdicts, dimension-level changes, relevant evidence-unit/result pointers, recomputed-but-unchanged IDs and unaffected IDs. Policy, corpus or taxonomy revision changes invalidate their dependent analyses. A full recomputation is the test oracle for incremental behavior.

Clarification analysis operates over a named target vector (by default all material verdicts, with an optional explicitly labeled dimension vector). A set of groups `S` is sufficient if any two admissible worlds agreeing on `S` have the same target vector. Enumerate subsets and return the **inclusion-minimal sufficient sets**. If also reporting minimum cardinality, label it distinctly. Include the empty set if all target results are already invariant. There are at most 16 subsets with four groups.

Report single-group effects only when there are admissible worlds differing solely in that group. Correlated groups may require a joint question; do not report an independent effect from impossible worlds. A one-group question whose answer cannot change the target is labeled non-decisive, not recommended by an invented score.

Missing documentation is a separate output: field, source/locator to inspect, affected comparisons and reason. Unknown chemistry or an unbounded historical quantity cannot be converted into invented candidate values. Rank this list by number of dependent comparisons only, explaining that dependency count is not scientific value. Questions help resolve an audit, not establish a safe laboratory protocol or predict therapeutic benefit.

## 6. API and UI contracts

### 6.1 API surface

All routes use `/api/v1`, strict request/response schemas and stable IDs. Responses include `schemaVersion` and applicable revision/hash metadata. Error shape: `{ error: { code, message, fieldErrors?, retryable, requestId } }`. No stack traces or raw provider secrets. Validation is shared through generated schemas. [Fastify validation](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/).

| Route | Contract / phase |
| --- | --- |
| `GET /health` | Runtime, DB migration, corpus revision and provider capability states; Phase 1 |
| `GET /cases` | Paginated real case summaries, authenticity and review states; Phase 1 |
| `GET /cases/:id?revision=` | Immutable case aggregate; latest selection is explicit in response; Phase 1 |
| `GET /sources/:id/revisions/:revision` | Rights-filtered text, metadata and locators; Phase 1 |
| `POST /imports/text` | Title, text, language, source/edition/rights declaration → draft source/case; Phase 2 |
| `POST /cases/:id/extraction-proposals` | Case revision + supported extractor version → persisted pending proposals; Phase 2 |
| `POST /cases/:id/revisions` | Expected base revision, accepted/rejected proposals or manual assertions with valid spans → new case revision; Phase 2 |
| `GET /taxonomy/candidates?scientificName=` | Bounded cached scientific-name lookup and diagnostic status; no historical name auto-identification; Phase 2 |
| `GET /studies` and `GET /studies/:id` | Local curated studies and evidence units; Phase 3 |
| `GET /literature/search?q=&cursor=` | Bounded Europe PMC metadata search with query/time/rights fields; Phase 3 |
| `POST /studies/import` | Validated DOI/PMCID and explicit selected snapshot import; content eligibility checked server-side; Phase 3 |
| `POST /cases/:id/evaluate` | Revision, scenario assignments, evidence-unit IDs and policy → pure analysis response; Phase 3, expanded Phase 4 |
| `POST /materials/compare` | Pinned left/right material-version IDs, associated case revisions/explicit assumptions when needed, policy version → material-only comparison with sources on both sides; Phase 4 |
| `POST /cases/:id/scenarios` | Base revision, assignments, rationale, expected scenario revision → immutable saved scenario; Phase 4 |
| `GET /cases/:id/scenarios` | Local saved scenarios; Phase 4 |
| `POST /cases/:id/scenario-diff` | Two complete pinned scenario inputs → changed/unchanged/unaffected results; Phase 4 |
| `POST /cases/:id/robustness` | Reviewed domain + selected evidence units + target vector → exhaustive audit and questions; Phase 4 |
| `POST /analyses` and `GET /analyses/:id` | Save/load a self-contained pinned analysis snapshot in local editor mode; Phase 4 |
| `GET /analyses/:id/export?format=json\|html` | Rights-filtered frozen dossier, not latest data; Phase 5 |
| `GET /analyses/:id/references?format=csl-json\|bibtex\|ris` | Bibliographic metadata only, with stable reference IDs; no implicit content retrieval or source-text redistribution; Phase 5 |
| `POST /imports/bundle` | Versioned case/dossier bundle validation, size and hash checks → isolated draft/replay; Phase 5 |
| `GET /evaluation/runs` and `GET /evaluation/runs/:id` | Actual available evaluation manifests, metrics and failure rows; read only; Phase 5 |

Status codes: 400 malformed request, 404 unknown ID, 409 stale revision/hash conflict, 413 size/domain payload limit, 422 scientifically invalid references/domain/units, 429 bounded request rate, 502 invalid upstream response, 503 unavailable/timeout. Error-specific UI must preserve user edits. Retry only transient idempotent provider requests. Mutating retries require a client request ID and idempotency handling.

### 6.2 UI routes and components

- `/cases`: case library with real coverage counts, source/review labels and a text-import action.
- `/cases/:id/source`: `SourceReader`, `PassageLocator`, `AnnotationLayer`, `ProvenanceDrawer` and source/translation switch if actually available.
- `/cases/:id/material`: `ExtractionReview`, `IngredientTable`, `IdentityCandidateList`, `PreparationSequence`, `UnknownField` and `MaterialFingerprintPanel`.
- `/cases/:id/evidence`: `StudyList`, `EvidenceUnitSelector`, `MaterialComparisonMatrix`, `AssayContextPanel` and source-backed `OutcomePanel`.
- `/cases/:id/scenarios`: `ScenarioEditor`, `ChangeSummary`, `ScenarioDiff`, `RobustnessTable` and `ClarificationPanel`.
- The material/evidence workspace also contains `MaterialVersionCompare`, allowing selection of two existing source-backed versions and reusing `MaterialComparisonMatrix`. It reports documented differences and unknowns; it does not infer copying, chronology or efficacy.
- `/analyses/:id`: frozen `DossierView`, provenance links, actual JSON/HTML download and replay entry.
- `/evaluation`: actual runs, denominators, split details, confusion/error tables and limitations; empty state before a run exists.

Show only routes/actions available in the current phase. Existing source/recipe revisions remain inspectable after an edit. Case, scenario and analysis revision are always visible in the workspace header. A draft state is visibly distinct from a frozen saved analysis.

### 6.3 Premium interaction requirements

Use an off-white/neutral surface, near-black text, restrained teal accents, amber uncertainty and red mismatch indicators paired with icons/text. Green may indicate completed review, never therapeutic effectiveness. Use an 8-pixel spacing scale, approximately 24-pixel page gutters, 12-pixel radii and restrained shadows. Typography: system sans for UI; a readable serif/system fallback for source passages; mono for identifiers. Do not require a remote font request. Check Greek and Old English glyphs.

At desktop width, use a stable source/workspace split with a bounded evidence drawer. At tablet width, collapse secondary details without hiding the active verdict. At phone width, use source/material/evidence navigation and stacked labeled rows; a complex table may scroll inside its own named region, while the page itself must not overflow horizontally. Preserve semantic table structure where useful and offer an equivalent readable list for narrow screens.

Transitions should be short (roughly 120–180 ms) and honor reduced motion. Loading uses truthful pending states, preserves layout, and never displays yesterday's analysis as current. On scenario changes, mark results stale until a response for the current scenario hash arrives; cancel or discard older requests. Announce completed updates with `aria-live`, retain focus, and avoid animated counters.

Every visible button must act, or be explicitly disabled with the reason. Provide loading, empty, error, retry, unsupported-language, unknown-license, stale-result and offline states. Use keyboard-accessible dialogs, escape/back behavior, focus restoration, visible focus rings and touch targets near 44 pixels. Target WCAG 2.2 AA for the implemented workflow. Inspect the actual UI; a design token file is not evidence of visual quality.

## 7. Data acquisition and rights decisions

The following is a sourcing plan, not a claim that spans or datasets have already been curated.

| Source | Required use and verified starting point | Implementation gate |
| --- | --- | --- |
| Cockayne, *Leechdoms*, volume 2 | Wellcome labels the digitized 1864–66 work Public Domain. [Catalog/rights](https://wellcomecollection.org/works/dq5gv7ch) | Find volume 2 and the eyesalve passage, verify printed page/chapter and canvas from the scan, transcribe original/translation as separate attributed texts, and record corrections. Do not assume web canvas number equals printed page. |
| Adams, *Genuine Works of Hippocrates* (1849) | Public-domain Wellcome edition. [Catalog](https://wellcomecollection.org/works/e2gwb7bm) | Locate the oxymel passage in the actual edition; the [MIT Part 16 page](https://classics.mit.edu/Hippocrates/acutedis.16.16.html) is a locating aid, not permission for a separate website's formatting/data. Preserve historical indication and unreported composition. |
| Fuchs et al. 2018 | CC0 article, PMCID `PMC6261618`, DOI `10.1371/journal.pone.0208108`. [Full text and rights](https://pmc.ncbi.nlm.nih.gov/articles/PMC6261618/) | Curate author-labeled formulations and assay contexts; distinguish reported leek nomenclature and plant parts. Verify table/paragraph selectors. |
| Furner-Pardoe et al. 2020 | CC BY 4.0 article, PMCID `PMC7387442`, DOI `10.1038/s41598-020-69273-8`. [Article PDF](https://www.nature.com/articles/s41598-020-69273-8.pdf) | Curate both botanical variants where reported and the actual processing/matrix/context; distinguish full mixtures, dropouts and single components. No borrowed efficacy numbers without exact outcome provenance. |
| Harrison et al. 2023 | CC BY 4.0 published article, PMCID `PMC10433418`, DOI `10.1099/mic.0.001351`. [Institutional record](https://wrap.warwick.ac.uk/id/eprint/176414/) | Curate actual honey/vinegar/acetic-acid materials and organism/model/endpoint differences. Resolve bibliographic metadata against the DOI/article; do not copy an inconsistent repository volume field uncritically. |
| GBIF | Bounded taxonomy snapshots; backbone metadata carries CC BY 4.0. [Dataset](https://www.gbif.org/dataset/d7dddbf4-2cf0-4f39-9b2a-bb099caae36c), [API](https://techdocs.gbif.org/en/openapi/v1/species) | Save exact response/checklist metadata and attribution. Verify actual IDs, ranks and synonym relationships. No invented identifiers. |
| Europe PMC | Search metadata and retrieve eligible full text through supported services. [API](https://dev.europepmc.org/RestfulWebService), [copyright policy](https://dev.europepmc.org/Copyright) | Check individual article license and third-party exclusions; use supported APIs rather than scraping article HTML. Abstract availability is not a license to redistribute all abstracts. |

For every bundled source, save an artifact-specific rights record and the relevant permission evidence. Retain bytes, normalized display text, parse logs and a machine-readable manifest. This is a small source bundle, not a mirror of an entire corpus.

Do not require IMPPAT, MPNS bulk data, Toyama datasets, MHDR, EthnoDB or Phytocode downloads. Their usefulness as research references does not establish a suitable redistribution contract. First1KGreek's CC BY-SA texts are an expansion prospect; any imported edition or translation requires its own rights review and attribution. Keep content licenses separate from the application-code license.

**Preflight case gate:** before substantial UI work, establish at least one genuine historical passage, one defensible documented ambiguity, two permission-compatible modern studies and enough material/context detail to show useful matches, differences or abstentions. Both historical families and the third study must be secured before Phase 1 completion. If the exact passage/rights cannot be verified, the gate fails; no fabricated fallback.

### Principal risks and response

| Risk | Response / decision rule |
| --- | --- |
| Strict historical comparisons mostly abstain | Show dimension-level findings and specific missing documentation; compare with the all-abstain baseline. Do not relax unknown handling to produce attractive verdicts. |
| Two case families cannot establish broad scientific validity | Report family-level results and limited scope. Expansion is a later research requirement, not a claim earned by more arms from the same studies. |
| A historical passage or translation cannot be inspected/licensed | Fail the source gate before extensive UI work; identify the specific missing edition/rights. A modern paper's retelling is not silently substituted for the historical witness. |
| No qualified historian/pharmacognosist is available | Preserve reviewer qualifications, disagreements and inference labels. Complete technical verification but make no expert-validation claim. |
| Provider changes, access restrictions or outages | Use versioned approved local snapshots for the core workflow; make live enrichment visibly unavailable when necessary. |
| Native dependency or package incompatibility on Windows | Resolve during Phase 1 install/start tests, pin the working runtime/dependencies, and update the architecture decision before downstream work begins. |
| Remaining development window proves too short | Remove only optional scope, preserve the gates, and report unfinished requirements. Never recast a visually finished screen as verified functionality. |

Unvalidated product demand remains a research risk. If domain users can review the product, use the task-based protocol in Section 9; do not assume research relevance alone proves adoption.

## 8. Verification protocol shared by every phase

### 8.1 Expected commands

The implementation must provide these cross-platform npm scripts by the phases that need them:

```text
npm ci
npm run typecheck
npm run lint
npm run data:validate
npm run test:unit
npm run test:integration
npm run build
npm run start
npm run test:e2e -- --project=chromium
npm run evaluate -- --manifest data/evaluation/release.json
npm run replay -- --bundle <exported-dossier.json>
```

Provide a Phase-1 `verify:phase -- --phase=N` wrapper or documented equivalent running the applicable checks and collecting evidence. Never return success for a missing/skipped required test. Provider-dependent checks have explicit `passed | failed | unavailable` states; unavailable is not passed. Test artifact directories are separate from scientific inputs.

### 8.2 Real-browser gate, every phase

Playwright must build and launch **the actual application and actual API against a fresh seeded test database**, wait for health, navigate through visible controls, and assert browser-visible results plus the relevant network response. Use the production server in the main gate; do not substitute a static HTML mock or intercept successful core APIs. Playwright's `webServer` can manage startup/teardown. [Server setup](https://playwright.dev/docs/test-webserver).

For every phase:

1. Run its complete main journey in Chromium at 1440×900, then its key responsive journey at 1024×768 and 390×844. Save screenshots after inspecting source text, main action and final result; inspect them visually for clipping, hierarchy, typography and overlay behavior.
2. Install listeners before navigation for `pageerror`, console errors, failed requests and HTTP errors. Normal-flow runs require no unexpected first-party 4xx/5xx, request failures, hydration/runtime errors or missing assets. HTTP 500 is not a `requestfailed` event, so inspect responses too. [Playwright network behavior](https://playwright.dev/docs/network).
3. Run a keyboard-only main action, focus/dialog check, 200% zoom check and reduced-motion check for changed components. Run axe on relevant states; fix critical/serious findings and manually inspect contrast and reading order.
4. Exercise at least one real error state through the production API and one controlled provider/network failure. Fault-injection runs are separate and label exact expected error/request IDs; no broad console/network-error suppression.
5. Reload a deep URL and the resulting state; verify persistence where the phase promises it. Check slow responses and repeated clicks for stale/wrong data.
6. Save the command, app/data revision, browser/version, viewports, test report, failure logs and trace on failure. A passing screenshot without interaction assertions does not satisfy the gate.

Use deterministic local source fixtures for repeatable integration/E2E tests, with explicit fixture provenance. Also run a separately recorded **live** GBIF/Europe PMC smoke when those integrations are introduced. Never label a replayed/cached response as live. Upstream outages may leave the optional live path unavailable while the offline core remains fully verified; the UI and handoff must say so.

### 8.3 Scientific and security gates, every phase

- Every displayed assertion and every exported scientific field has a source reference or a visible inference/hypothesis/unknown label. No silent defaults from source gaps.
- Authentic, synthetic, curated, inferred, pending and user-provided data remain distinguishable in UI, API and exports.
- Imported source text is inert content. Escape HTML, links and attributes; never execute source markup. Reject DTD/external entities when parsing provider XML. No arbitrary URL fetcher.
- `parseJsonStrict` is the shared JSON boundary: reject syntax errors/recovered parses, comments, trailing commas, duplicate decoded object keys, `__proto__`/`prototype`/`constructor` keys, excessive depth/tokens and invalid schema/reference content. Enforce bounds during scanning before building an AST/object. Bibliographic conversion receives validated CSL-JSON objects only and must make no outbound requests.
- Provider endpoints are server-side allowlisted HTTPS services with validated identifiers, 10-second timeouts, at most two transient retries with jitter, bounded response sizes and explicit cache provenance. Honor rate limits and `Retry-After`.
- Local editing binds to loopback, validates `Origin`/`Host`, uses a local session/CSRF token for mutations and restricts allowed methods/content types. Public read-only mode disallows persistent writes. CORS is not authentication.
- Validate all IDs, schemas, field lengths, references and expected revisions before transactions. Maximum plain-text source length is 100,000 UTF-16 code units; JSON request limit 1 MiB except explicit 5 MiB bundle import. Provider snapshot cap 5 MiB. Return understandable errors without partial writes.
- No secrets in browser bundles/logs, no automatic external sending of user imports, no patient records or sensitive community/location data in the required corpus. Preserve cultural attribution and restrictions even for legally public material.
- No medical advice, dosage guidance or new preparation instructions are generated. Historical text remains attributed research content; the product does not turn it into a consumer recipe.
- A visible defect affecting source integrity, scientific verdicts, exports, replay or core navigation blocks phase completion.

## Phase 1 — Source integrity, contracts and a functioning reader

### Features and implementation requirements

Deliver an installed, typed, runnable app with two authentic cases, a source library, source/translation reader, verified rights/provenance drawers, real case counts and health/status behavior. This phase establishes the scientific data contract and test harness. Do not build an attractive empty shell before verifying data availability.

### Architecture, data and dependencies

Create the workspace boundaries from Section 3, the full v1 contract schemas from Section 4, initial migrations for sources/cases/materials/assertions, read repositories and `GET /health`, `/cases`, `/cases/:id` and source-revision routes. Instantiate only these verified UI routes. Data dependencies are the Section 7 sources and curator review; runtime does not require live APIs.

Freeze `docs/architecture.md`, `docs/data-dictionary.md`, `docs/comparison-policy.md` and `data/corpus-manifest.json`. The manifest contains actual source IDs, rights decisions, hashes, case-family count, study count and evidence-unit count. Schema definitions for later phases exist now, but unimplemented API routes and mock results do not.

### Upstream acquisition and adaptation

Acquire R1's exact sparse source subset and license as described in Section 3.4; adapt its bootstrap into `apps/server` and `apps/web` without replacing the existing project root or installing the upstream monorepo. Confirm/install R3 and stable R4 behind the owned hash/parser helpers. Run a small R2 core selection/Unicode/lifecycle spike before committing to it; named curation functionality remains Phase 2. Record actual registry integrity/version/source mapping, notices and the chosen one-origin or explicit fallback runtime. The upstream example's monorepo helpers and skipped wrapper tests do not count as our tests.

### Step-by-step work

1. Check existing repository instructions and files; preserve the product context and this plan. Reconfirm deadline/time budget. Start source preflight and the bounded 90-minute R1/R2 compatibility spike, verify published package cohorts, adapt the official scaffold, and record exact dependency/runtime/reuse decisions. Install no second starter.
2. Pass the source preflight before significant frontend work. Verify both historical passages directly against their editions and all three modern sources' reuse terms. Create the bounded source snapshots and rights records; omit separately protected figures.
3. Have two named reviewers independently check core historical spans, ingredient terms and each modern material/context unit where personnel permit. Record roles/qualifications, disagreements and adjudication. At minimum every scientific-release assertion receives a recorded human check; a single-review corpus must be labeled team-curated, not expert-validated gold data. Under the explicit user decision above, the Phase 1 technical reader may retain draft assertions and proceed with its software gates; scientific acceptance and gold-label use remain gated separately.
4. Author contracts, enums, cross-reference validator, `parseJsonStrict`, domain-normalized canonical hashing and span validator. Use R3/R4 through the owned boundaries, reject duplicate keys before object construction, and record the canonicalization scheme. Record missing/unreadable fields explicitly. Freeze the first corpus revision; do not fabricate modern IDs or historical locators.
5. Implement migrations and reproducible seeding into an empty local database. Separate bundled read-only corpus from ignored user workspaces. Implement rights filtering in read APIs from the start.
6. Build the case library, source reader, metadata/rights drawer and deep routes with final typography/spacing foundations. Render exact source text, not an unverified model summary. Show translation only when licensed and attributed.
7. Add test infrastructure and Playwright production-server startup. Add startup/setup instructions usable from PowerShell and a clean checkout. Execute the verification gates before handoff.

### Unit, integration and data tests

- Unit: UTF-16 span slicing, repeated passages, Greek combining characters, Old English glyphs, surrogate pairs, invalid offsets, canonical serialization stability and unknown-state validation.
- Reuse boundary tests: applicable RFC 8785 vectors, nonfinite/unsafe numbers, lone surrogates, duplicate decoded keys including escaped spellings, comments/trailing commas and depth limits; server startup from a different working directory; Vite deep-link fallback never captures unknown API routes; R2 selection/unmount/source-switch spike. Record upstream checks separately from new integration tests.
- Integration: seed twice without duplication; migrate an empty DB; retrieve cases/source revisions; verify 404/error schemas, API schema validation and rights-filtered source output.
- Data: every required source has actual rights evidence, stable URL/identifier and hashes; every core assertion's source resolves; every span matches the stored text; all references resolve; unknowns are not empty strings; case authenticity is explicit.
- Inspect the data counts against the manifests. A count of 12 units must mean 12 author-supported material/context records, not duplicated citations, batches misrepresented as independent studies, or invented pairs.
- Security: inert script/HTML text renders as text, `javascript:` links cannot execute, unapproved source content is not served, and path/ID traversal fails.

### Real-browser verification

Run `phase-1-source-reader.spec.ts`: open library → choose eyesalve → inspect edition and exact source → open attribution/rights drawer → switch to the second case → reload its deep URL. Assert the API/source revision matches what is displayed, and verify a selected provenance locator leads to the correct source passage. Check the three viewports, keyboard focus, 200% zoom, actual source glyph rendering, console/network and an unknown-case route. Save and inspect screenshots; no comparison or scenario buttons may pretend to work yet.

### Edge cases, integrity and completion

Handle missing translation, unreadable OCR, lost external source link, unverified canvas and unavailable license with explicit states. Display a verified text locator even if a remote image viewer is unavailable; never invent a facsimile preview.

**Complete only when:** both authentic historical families and three primary studies are secured with appropriate rights, at least 12 valid evidence units are represented in the source/case manifests, schemas and data checks pass, a fresh install starts the actual reader, selected reuse boundaries pass their spikes, actual dependency pins/notices are recorded, all Phase 1 browser checks pass, and `phase-1.md` records the evidence and reviewer limitations. If rights or the ambiguity's scholarly basis are absent, stop this gate and correct the data before Phase 2.

## Phase 2 — Extraction review, botanical interpretations and material workspace

### Features and implementation requirements

Users can import a plain-text research passage, inspect automatic extraction proposals, accept/reject/edit them with exact spans, record unknowns, add source-backed identity candidates, inspect preparation steps and save a new material/case revision. Existing source text is immutable. A new researcher-provided case must work through the same flow as the bundled cases.

The automatic extractor supports a declared English vocabulary and operation/quantity grammar. It proposes ingredient mentions, preparation operations and explicit quantity relationships with span references. It does not invent a modern taxon from an Old English/Greek word, interpret unsupported historical units or translate a passage automatically. Provide manual exact-span annotation for all supported Unicode text.

### Architecture, data and dependencies

Implement `packages/core/extract`, unit conversion/constraint helpers and fingerprint construction. Add import, extraction-proposal, case-revision and taxonomy-candidate APIs. Use `MaterialVersion`, `IngredientSlot`, `PreparationStep`, `MappingCandidate`, `TaxonConcept` and review events from the frozen contracts. Add a GBIF adapter and bounded cache; the curated taxonomy snapshot remains available offline. No model provider is a dependency.

Components: `ExtractionReview`, `IngredientTable`, `SpanSelector`, `IdentityCandidateList`, `PreparationSequence`, `QuantityConstraintEditor` and `UnknownField`. Atomic revision saves require the expected base revision. The server owns extraction versions and accepted assertion transitions.

### Upstream acquisition and adaptation

Use R2's core package already checked in Phase 1; do not clone its whole application/examples or install its React/TEI/PDF wrappers. Implement `apps/web/src/adapters/SourceAnnotationAdapter.ts` and an owned React lifecycle wrapper. The annotatable container's text must equal `SourceRevision.displayText`; controls/notes remain outside it. Convert library selectors to our UTF-16 spans, validate exact quote/source hash and convert code-point offsets only at W3C interchange. Persist serializable selectors/assertion references, never DOM ranges. Consult ShennongName's data distinctions as documented prior art; import no Python algorithm/service or unlicensed corpus.

### Step-by-step work

1. Implement deterministic vocabulary matching and operation/quantity grammar over a separate normalized search representation; map every proposal back to verified offsets in original display text. Protect against substring collisions, repeated terms and broad “leek” → garlic mistakes.
2. Label extractor language/lexicon coverage and unknown terms. Unsupported language returns a normal `unsupported_language` capability result with manual review available, not successful empty extraction.
3. Implement review transitions and manual source selection. Accept/reject a proposal, change a controlled interpretation with rationale, or mark it unknown. Preserve proposal history. Changes create new case/material revisions.
4. Store multiple occurrence-scoped identity candidates with supporting source references. Show scholarly identification support separately from authoritative taxonomic normalization. Do not equate a user's selection with expert verification. In this phase, the material preview uses the shared `ScenarioInput` shape; saving an initial choice writes `CaseRevision.baselineScenarioInput` with its assumption/rationale label. It does not overwrite the ingredient's unresolved historical identity. Named scenario endpoints arrive in Phase 4.
5. Implement GBIF modern-name normalization with recorded match type, rank, authority snapshot and alternatives. Accept exact reviewed mappings only; handle leek nomenclature/infraspecific qualifications without silently collapsing them. Cache raw responses and reviewer actions.
6. Construct deterministic material fingerprints from accepted assertions and explicit assumptions. Show their readable contents and missing fields; never use hash equality as a comparability verdict.
7. Implement plain-text import with metadata, rights declaration and authenticity labels. User-declared rights allow local research use but do not automatically authorize public redistribution; external exports filter unknown-rights source text.
8. Save and reload edited cases, build the material workspace with narrow-screen behavior, and run all verification before handoff.

The R2 wrapper must explicitly destroy the annotator and remove listeners on unmount/source revision changes, withstand React Strict Mode's repeated setup/cleanup, and preserve source text when switching renderers. Keep accepted facts in our server/database, not in the library's temporary annotation store. If the Phase 1 spike rejects R2, freeze a bounded native-selection/manual-span adapter before this phase and run the same integrity/browser gates; never quietly ship broken highlighting.

### Unit, integration and data tests

- Unit: exact occurrence matching, operation negation/omission, duplicate names, quantities with unknown basis, equal mass versus equal volume, rejected proposals, unsupported languages and Unicode offset round trips.
- Unit: unknowns remain unknown after fingerprinting; ingredient-order permutations preserve a multiset fingerprint, while processing-order changes do not; quantity conversion works only for compatible units; identical incomplete fingerprints cannot imply identity.
- Adapter/browser tests: overlapping and adjacent annotations, repeated identical quotations, supplementary Unicode before a selected span, combining accents, source revision switches, unmount/remount and no duplicate create events. Test both the actual default renderer and its supported fallback where applicable, plus mouse/touch and the keyboard/manual-span path.
- Integration: text import → extraction → human review → new revision → reload; invalid spans and unreferenced manual assertions are rejected; stale writes return 409 without losing the draft; two imports cannot overwrite one another.
- Provider contract tests: scientific-name exact, synonym, fuzzy, higher-rank, homonym/alternative, timeout, 429 and malformed GBIF responses. Run a separate actual live-name lookup and record it, or explicitly mark live integration unavailable.
- Data: every documented candidate has a basis; inferred alternatives are labeled and not automatically admitted to the reviewed domain; source/translation alignments and original reported taxon qualifiers survive normalization.
- Security: payload/field bounds, origin/CSRF rejection, malicious source strings, rights-pending imports and no outbound transmission of pasted text.

### Real-browser verification

Run `phase-2-curation.spec.ts`: open source → run proposals → inspect highlighted mention → create a selection through the actual R2/owned adapter → reject one proposal → accept/edit another → choose an identity candidate → mark a missing part unknown → save → reload and verify the new revision/fingerprint. Then import a separate passage using visible forms and manually annotate an unsupported-language term. Verify stored spans against the API, not only text labels. Test out-of-order taxonomy responses, provider failure, stale revision conflict and unsaved navigation. Apply every shared viewport, console/network, keyboard and visual gate.

### Edge cases, integrity and completion

Repeated terms require distinct occurrence IDs. A plant name in commentary is not automatically a recipe ingredient. Missing ingredient quantity is not zero. An ingredient not detected by the scoped extractor remains manually addable; users see the limited automatic coverage. Never silently replace historical wording with a normalized modern term.

**Complete only when:** bundled and newly imported passages can be extracted/reviewed/saved end to end; annotations and unknowns survive reload; the fingerprint and taxonomy rules pass tests; all edits have provenance/history; browser interactions and failure states pass; and the handoff identifies extractor coverage and actual live-provider status. Extraction precision/recall is measured in Phase 5; no performance claim is made here.

## Phase 3 — Tested-material evidence and deterministic comparison

### Features and implementation requirements

Users inspect real local studies, choose evidence units, compare their actual tested materials against the selected historical/reconstruction material and inspect per-dimension decisions, experimental settings and reported results. A source click must reach the precise supporting paragraph/table cell. Literature search can add real metadata and eligible full-text sources; new studies remain pending until their material/context fields are reviewed.

This is the first complete source → material → evidence workflow. It must be useful even when strict results are mismatched or insufficient. No all-green demonstration requirement can override the scientific policy.

### Architecture, data and dependencies

Implement pure comparison functions and reason rendering from Section 5, study/evidence-unit repositories, Europe PMC adapter, literature/study routes and `/evaluate`. Inputs are pinned case revision, scenario choices, evidence-unit IDs and policy version. The response includes every dimension, contextual warning, immutable reported result and dependency read set. UI uses the response without reproducing rules in components.

Freeze the first policy version before evaluating the held-out panel. Add API contract fixtures generated from actual source-backed aggregates, never screenshots or hardcoded component results. Store all applicable source locations for material, assay and outcome fields separately.

### Upstream acquisition and adaptation

No new application repository is cloned. Reuse R1/R2 infrastructure and keep the comparator and provider adapters original. Prototype R5's selected core/BibTeX/RIS release cohort server-side with a few reviewed `BibliographicRecord` objects, establishing the CSL-JSON projection and no-network boundary for Phase 5. Do not add `@citation-js/plugin-csl`, DOI/Wikidata resolvers or the all-plugin bundle. Do not adopt Kitsune/Datastew embeddings, TCM-Sage or PaperQA as a production service, and do not translate a Python client merely to call the two small supported REST adapters.

### Step-by-step work

1. Review the 12+ evidence units from Phase 1 against the modern methods/tables. Distinguish full mixtures, components, dropout formulas, batches, assay settings and specific outcomes. Keep reported taxon wording alongside normalization. Do not count multiple arms as multiple papers.
2. Implement all critical/context dimensions and aggregate precedence. Evaluate every dimension even after a mismatch. Include source, inference and scenario dependencies in each reason.
3. Implement context comparison separately: organism/strain, planktonic/biofilm/other model, endpoint, tested exposure and historical route/indication interpretation. Differences cannot modify the study's outcome or certify clinical relevance.
4. Implement study list, evidence selector and comparison matrix with drilldown to supporting assertions. Expose incomplete metadata and negative/mixed results alongside favorable results.
5. Add Europe PMC metadata search with escaped/encoded query construction, pagination, source timestamps and explicit rights availability. Import by validated identifiers into a pending study. Retrieve full text only through supported allowed services with a recorded license. No full-text claim from abstract-only records.
6. Apply provider caching, rate limits, cancellation and structured failures. Keep the offline seeded studies and all existing comparisons operational without connectivity.
7. Add comparison persistence prerequisites and deterministic input/result hashes. Execute policy review and all gates before enabling scenarios.

Create the reviewed bibliographic projection during study ingestion: retain original provider metadata and reviewer corrections separately, distinguish historical work date from edition date, preserve creator/translator roles and map absent data explicitly. A metadata-only record remains metadata-only regardless of which reference formats can be produced.

### Unit, integration and data tests

- Unit policy matrix: same reviewed identity versus differing identity; broad-rank match; contested identity; plant-part mismatch; missing part; solvent mismatch; whole mixture versus constituent; missing component versus unreported component; time/process/contact differences; incomparable quantities; unknown critical versus contextual fields; all-not-applicable only when valid.
- Unit precedence: explicit mismatch outranks unknown in the aggregate but unknown reasons remain; clearing one mismatch leaves another; resolving a field can leave the aggregate unchanged; negative outcome never means material mismatch.
- Unit integrity: two all-unknown records do not compare positively; taxonomy normalization cannot settle a historical mapping; a context-aligned assay cannot produce a clinical-support statement.
- Integration: case/material → select study unit → actual `/evaluate` response → source references resolve; invalid policy/revision/study unit fails; pending annotations cannot enter accepted comparisons; protected text never leaks in reason payloads.
- Provider tests: missing PMCID, abstract-only article, absent/NC/ND/unknown rights, retraction/correction metadata, XML parse error, malicious XML, 429, 503, timeout, pagination and cached/stale indicators. Run and log a live Europe PMC search separately.
- Data: manually inspect every core displayed comparison's decisive assertions. The 2018 and 2020 preparation/assay differences remain separate; do not assert a causal explanation or contradiction from difference alone. Corroborate article identifiers and actual author arm labels.
- Bibliographic prototype: controlled CSL-JSON objects convert offline without resolver calls; Unicode creators, missing dates, duplicate identifiers and corrected provider fields stay honest. A converter failure cannot alter the material audit or trigger a background web fetch.

### Real-browser verification

Run `phase-3-evidence-audit.spec.ts`: source → material → select a real formulation/assay → run comparison → expand at least two reasons → inspect precise modern methods source → inspect historical source → switch to a second unit → reload. Assert typed server verdicts, source IDs and displayed context/outcome labels. Exercise no selected evidence, unknown fields, a whole-mixture/component mismatch and a provider failure while local evidence remains usable. Inspect responsive matrix/list layout and long source citations. Run all shared console/network and accessibility gates with real core APIs.

### Edge cases, integrity and completion

An article testing onion and leek remains one article with multiple materials. A historical brass vessel and a documented modern contact arrangement are not silently equated. Raw historical bile and a standardized modern bile-salt preparation cannot be declared identical from their common name. A historical oxymel reference does not establish identity with a medical-grade honey/acetic-acid intervention. Unknowns and mismatches are valid results.

**Complete only when:** source-grounded comparisons of all required cases/evidence units execute through the app; the policy and context separation are tested; every reason is inspectable; data review identifies no unsupported acceptance; local comparisons work offline; normal and failure browser journeys pass; and the handoff pins the corpus/policy/contracts. A live search that is unavailable is documented as unavailable rather than a successful integration.

## Phase 4 — Interpretation scenarios, exact robustness and clarification

**Implemented refinement:** the original corpus remains unreviewed by user choice. Its authentic onion/leek demonstration therefore changes a separately labeled conditional reported-name correspondence vector, rather than asserting a reviewed taxonomic/material match. Strict dimensions and outcomes remain conservative; study any-arm and fixed-arm quantifiers are separate. Hypotheses are excluded from documented-domain audits. All current scientific choice edits share the left material and use the explicit full-recompute fallback; rationale-only edits are unaffected. No incremental speedup is claimed. The handoff records exact tested limits and measured core timing. Phase 4 cloned/installed nothing new and reused R1–R4 plus the original TypeScript comparator.

### Features and implementation requirements

Users create and save occurrence-scoped scenarios, edit reviewed alternatives or explicit hypotheses, see accurate before/after consequences, enumerate the documented interpretation domain and inspect minimal sufficient clarification sets. Show changed dimensions, changed evidence/result relevance, recomputed-but-unchanged comparisons and unaffected comparisons. Genuine invariance is a successful result.

Also implement direct comparison of two existing source-backed material versions, including the documented modern reconstructions. This exposes differences in composition, plant part and preparation without inventing lineage or claiming that different observations were caused by those differences.

### Architecture, data and dependencies

Implement `core/scenarios` enumeration/constraint validation, dependency index, diff, robustness aggregation and minimal sufficient-set functions. Add scenario, analysis snapshot, diff and robustness routes and repositories. Share the pure evaluator introduced in Phase 3. Immutable scenarios reference exact case revisions and policy; hypothetical overrides have their own provenance and are excluded from documented-domain claims by default.

The principal UI components are `ScenarioEditor`, `ScenarioDiff`, `RobustnessTable` and `ClarificationPanel`. Persist scientific state on the server; temporary control state may be local. Each request/response carries a scenario hash so stale asynchronous responses cannot overwrite the current analysis.

### Upstream acquisition and adaptation

Clone/install nothing new. Reuse the typed evaluator, provenance drawers, R2 highlighting and R3 hashes. Implement `POST /materials/compare` with a shared `MaterialVersionComparisonRequest`: each side names a pinned material version, the associated case revision when relevant and explicit occurrence-scoped assumptions. Fixed tested materials require no identity scenario. Return the same dimension/reason schema with sources for both sides, under scope `material_only`; there is no inherited clinical-support or reported-outcome verdict. Do not substitute jsondiffpatch for scientific comparison or JsonLogic for the typed unknown-state engine.

### Step-by-step work

1. Implement validated interpretation groups and cross-group constraints. Require a cited basis for `documented_plausible` alternatives. Show domain size and limitations before execution.
2. Implement bounded enumeration, rejecting empty and excessive domains. Evaluate every selected evidence unit in every admissible world with the frozen policy. Do not use model reasoning for verdicts.
3. Implement arm-level robustness states and separate study-level coverage quantifiers. For the onion/leek anchor, allow arm identity matches to move while a study testing both retains identity coverage. Preserve any other material mismatch or unknown.
4. Build dependency-sensitive recalculation and diff. Record all dimensions' dependencies, invalidate higher-level summaries correctly and retain unaffected results. Keep a full-recompute fallback.
5. Implement exact sufficient-set enumeration on a declared result vector. Return inclusion-minimal sets, optional minimum cardinality, and an empty-set result when no interpretation question changes the target. Keep unknown-documentation tasks separate.
6. Implement scenario save/load/reset, hypothetical-edit labels and pinned analysis snapshots. Reset restores the actual baseline; it does not erase curated alternatives or history.
7. Build an understandable audit UI: source → assumption → affected reason → evidence unit. Use a linear dependency explanation instead of a decorative force graph. Add bounded progress/loading, cancelation and stale-result protection.
8. Run exhaustive/synthetic regression, authentic case review and browser verification before handoff.

Add `MaterialVersionCompare` using the existing matrix rather than a second rules implementation. Let the researcher select two real versions and open both sources. Compare a documented 2018 reconstruction with a documented 2020 reconstruction, preserving all unknowns and qualifications. A source gap is not a zero change, and a change list is not a proven historical transmission path.

### Unit, integration and data tests

- Property tests: incremental results equal a clean full recomputation for at least 200 seeded generated edits within supported bounds. Compare verdicts, reason payloads, dependencies, result pointers and deterministic hashes, excluding runtime timing fields.
- Scenario tests: single/multiple groups, correlated alternatives, mutually inconsistent choices, empty domain, duplicate choices, zero groups (one baseline world), 64-world boundary, 65+ rejection and excluded hypothetical overrides.
- Robustness tests: every state; quantifier difference between fixed-arm robustness and per-world study coverage; unknowns never count as accepted worlds; counts are not probabilities; domain limitations persist in snapshots.
- Clarification oracle tests: brute-force world pairs independently verify each returned set's sufficiency and each claimed inclusion-minimality; confirm empty-set, joint-only, correlated and non-decisive cases. Missing unbounded fields cannot become enumerated assignments.
- Integration: save two scenarios → diff → audit → save analysis → reload; source/case/policy revision conflict produces an explicit stale-analysis response; reversion reproduces baseline hash; a changing rationale alone does not falsely change scientific values.
- Material-version tests: side/source attribution is correct, swapping sides preserves symmetric match/mismatch judgments while reversing descriptive change direction, incomparable quantities remain unknown, two incomplete matching fingerprints do not pass, and the material-only route never emits a clinical/effectiveness claim.
- Data: a curator checks source support for every admitted alternative and representative world. At least one authentic scenario must demonstrate a changed identity/dimension relationship; it need not change a full aggregate verdict. Separate synthetic cases test other transitions.
- Performance target: local audit of 64 worlds × 50 units p95 under 500 ms on recorded hardware after warmup; record actual measurements. If exceeded, optimize or state the lower supported bound before release; never advertise an untested bound.

### Real-browser verification

Run `phase-4-interpretations.spec.ts`: open eyesalve → select the first documented interpretation → evaluate → save scenario → switch to the alternative → inspect precise before/after dimensions → confirm unrelated results stay fixed → run all documented alternatives → inspect counts/coverage/limitations → open a clarification question → follow its source → reset/reload. Verify API calls and changes rather than screenshot-only transitions.

Run a second journey where the headline verdict remains unchanged because another mismatch persists, and a test where a paper retains identity coverage through different arms. Exercise rapid toggles with delayed responses, two tabs with stale revisions, domain-limit errors, zero decisive questions, and hypothetical versus documented alternatives. Verify full keyboard operation and phone interaction with scenario controls, source drawer and long question text. Apply all shared error/console/network/visual gates.

Run `phase-4-material-versions.spec.ts`: select two actual source-backed reconstruction versions → compare → inspect composition/preparation differences and unknowns → open the precise source on each side → swap sides → reload. Check that side labels, source links and unknowns remain correct at all required viewports; no new repository's demo transitions are acceptable evidence.

### Edge cases, integrity and completion

Do not claim a historical identity is settled by selecting it. A scenario fork does not replace the source. Sparse or non-exhaustive candidate lists constrain the audit's scope. No probability or biological effect emerges from the number of worlds. A question that fixes an identity-only result may leave strict comparability undecidable; name the target in the question panel.

**Complete only when:** an authentic ambiguity drives source-traceable conditional identity/dimension and dependency changes, while unreviewed strict dimensions retain unknowns; two real material versions can be compared with correct two-sided provenance; full recomputation agrees with incremental results; all bounded-world and question-oracle tests pass; users can save/reload/reset without data corruption; unchanged and study-coverage cases are accurate; browser gates pass; and the handoff records tested limits and actual timing. Hardcoded scenario verdicts or paper-level disappearance when both arms exist fail this phase.

## Phase 5 — Dossiers, replay, evaluation and complete-product acceptance

**Implemented scope refinement, 7 November 2026:** the technical work preserves the user-authorized draft corpus. The real evaluation contains 34 correlated authentic interpretation records (24 development, 10 grouped diagnostics) from 14 formulation/assay units, three primary studies and two historical families, plus 12 real source windows. There are **zero independent authentic reference labels**; no team or human review is invented. Therefore authentic accuracy, false acceptance, F1, extraction precision/recall and retrieval relevance scores remain unavailable. This explicitly replaces the original eight-development/16-frozen-audit collection target for the current bounded release; the policy was developed with access to this panel, so it is not a held-out benchmark. Mandatory deterministic baselines/ablations are actually executed, B2 is recorded as unavailable, and 40 separate synthetic aggregation sentinels test engineering behavior. Independent source review and empirical validation remain separate outstanding scientific gates. See [methods](docs/methods.md) and [Phase 5 handoff](docs/handoffs/phase-5.md).

R5 uses the already installed Citation.js 0.9.0 cohort, with UTF-8-preserving BibTeX configuration and an owned serializer of the plugin's structured RIS mapping. No additional application repository is cloned, no cross-language service is introduced and no R6 facsimile viewer is shipped. Replay/import/export use the single shared TypeScript scientific engine and strict JSON boundary. An imported dossier remains isolated; an explicit editable copy is available only from an included primary original and creates fresh pending local records.

### Features and implementation requirements

Users freeze an analysis and export readable HTML plus versioned JSON containing the permitted evidence chain, assumptions, decisions, uncertainty, rights/attribution, source hashes and versions. A separate fresh process can replay the JSON and reproduce scientific results without web/model access. Imported bundles are validated and isolated before becoming editable local cases.

Add real bibliography downloads in CSL-JSON, BibTeX and RIS for the same reviewed references. These are metadata/interoperability outputs; only the dossier carries the scientific assumptions, provenance closure and replay contract.

Implement the evaluation strategy in Section 9, publish actual run manifests and failure rows in the app, finish accessibility/performance/error states, and verify the complete production build. No slides, videos, promotional assets or submission materials are part of this phase.

### Architecture, data and dependencies

Implement `DossierBundleV1`, rights-aware export serializers, escaped self-contained HTML, bundle import and replay CLI. JSON contains the normalized scientific inputs needed for replay, with source text only where permitted. Each omitted protected source is listed with its citation/locator/hash and rights reason. Exports must remain scientifically replayable from included assertions even when protected full text is omitted; distinguish decision replay from independent access to the original source.

Separate a canonical scientific payload hash from export timestamp, local storage IDs and rendering metadata. Keep immutable source/assertion identifiers and scientific values in that canonical payload; editorial event times and a changed display rationale do not change the computed scientific values. The same payload generates the same scientific result hash. Preserve the bundle's original identifiers inside an isolated import scope, using a separate database namespace to prevent collisions rather than rewriting the replay graph's identifiers. Use the same core evaluator in CLI/server; neither replay nor exported HTML requires an API key. Verify hashes of included content; an omitted protected original remains externally referenced and is not claimed as independently hash-verified. Unsupported engine/policy versions fail explicitly; v1 replay is required with the pinned v1 engine. Do not execute embedded scripts from imported dossiers. App evaluation views read computed artifacts only; metrics cannot be generated in frontend code.

### Upstream acquisition and adaptation

Finish R5 integration using the exact cohort prototyped in Phase 3; do not add a complete citation manager or style processor. R3/R4 remain the single hash/strict import boundaries in CLI and server. Install R6 only if Section 3.4's extension gate passes; wrap its existing JavaScript/TypeScript-declared API rather than porting it. If the extension is admitted, use a verified rights-cleared local page image first, with local controls/assets and source page attribution; allowlisted IIIF is optional. Never run arbitrary upstream example scripts, import demo assets or expose a general remote-manifest proxy.

### Step-by-step work

1. Finalize bundle schema/version and complete provenance closure: inputs, source references, assumption domain, material/context decisions, policy/engine/corpus versions, limitations and rights manifest.
2. Implement HTML and JSON exports from a saved pinned analysis, including original/reconstructed/hypothetical labels and any data omissions. Render HTML with escaped text, local styling and no executable source markup. Provide useful print layout through normal browser printing; a PDF engine is optional.
3. Implement import preview/validation, explicit version incompatibility errors and replay. Verify included-content hashes and entity references, retain original attribution and rights restrictions, and avoid identifier collisions through an internal import namespace while preserving original replay identifiers.
4. Freeze the evaluation manifest/labels and run all baselines/ablations under the protocol below. Retain requests, predictions, timing, failures and actual measured results. Review errors against original evidence; do not conceal null or unfavorable results.
5. Populate `/evaluation` from these runs, showing authentic/synthetic counts, denominators, reviewer qualifications, baseline access limitations and clustering caveats. Link each failure to its source-backed case.
6. Finish complete loading/offline/empty/stale/conflict/retry states and remove dead or decorative controls. Check links, typography, source rendering, responsiveness and readable dossier formatting.
7. Execute a clean install/seed/build/start/replay on a fresh workspace and a separate database. Run final full-browser, security and scientific sentinel suites. Record optional provider availability separately.
8. Resolve every critical defect, then write final methods/startup/troubleshooting documentation and the Phase 5 handoff. Do not declare completion solely because the deadline is close.

Implement `/analyses/:id/references` and actual downloads with safe filenames. Feed R5 validated structured metadata only, preserve unknowns, and document per-format loss (for example creator-role/date representations); preserve the full record in CSL-JSON/dossier. Render the HTML bibliography as escaped plain metadata, not arbitrary imported HTML or a claim of APA/Vancouver compliance. Do not auto-import bibliography files or add new full-text scraping scope in this release.

If R6 is admitted after mandatory gates pass, show the verified page with zoom/pan/reset, keyboard-accessible controls, a text alternative and source attribution. No fake page highlight, fabricated image alignment or OCR. Test its failure state, responsive layout, cleanup and offline local asset; rerun all affected mandatory tests after adding it. If the time/rights gate fails, no viewer control is shipped.

### Unit, integration and data tests

- Unit: JSON schema, canonical scientific hashing, export escaping, license-based omission, mixed rights in one dossier, authenticity labeling and unknown persistence.
- Replay: export → fresh DB/process import → evaluate without network → identical scientific result hash; detect one-byte tampering, source/hash mismatch, missing references, unsupported schema, excessive world domains and malicious object keys/paths.
- Integration: save analysis → export both formats → import preview → isolated case → source/reason inspection; old saved analysis remains unchanged after a new case/taxonomy/policy revision.
- Data/evaluation: independent labels are not derived from engine output; authentic and synthetic records never merge in metrics; split/family leakage check; missing baseline outputs remain missing; no fabricated scores, citations, study counts or denominators.
- Security: HTML/attribute/URL escaping, malicious imported text and XML, CSRF/origin rejection, no secrets in compiled assets, response/payload limits, unexpected outbound requests, readonly write rejection and local file/path isolation.
- Smoke: actual HTML downloads open without app access and preserve source/uncertainty/rights labels. JSON retains sufficient permitted facts for replay and flags inaccessible source originals honestly.
- Reference-export tests: actual CSL-JSON/BibTeX/RIS downloads contain the same selected reference identities, correct non-Latin authors/identifiers/titles and honest missing dates. Parse back controlled files and compare independently specified expected core fields, with documented format losses. Block outbound network during conversion and assert no resolver call. Bibliographic round trips do not substitute for dossier replay.
- Reuse checks: verify selected dependency versions/lockfile, code and content notices, copied-source modifications and no accidental `citeproc`/unselected wrapper/service dependency. R6, if admitted, needs actual image/zoom/keyboard/error tests and a source-asset rights/hash record.

### Real-browser verification

Run `phase-5-end-to-end.spec.ts` against a clean **production build**: open authentic case → inspect source → review material → select real evidence unit → evaluate → change interpretation → inspect changed and unchanged reasons → run robustness → inspect clarification → save analysis → download JSON and HTML → open actual downloaded HTML in a new browser context → replay JSON in a fresh process → inspect the same result hash. Then import a new passage and complete its non-fixture workflow through a saved analysis/export.

Download all three bibliography formats through visible controls and inspect the actual files against the saved analysis's reviewed reference IDs. If shipped, interact with the actual R6 page viewer at desktop and phone widths and test its image-load failure; a zoomable sample page from another repository does not satisfy source verification.

Run the full journey in Chromium and the key scientific/export paths in Firefox and WebKit, recording actual supported browser versions. Test 1440×900, 1024×768, 390×844 and 320-pixel narrow layout; 200% zoom, keyboard-only navigation, reduced motion, screen-reader labels and axe across core routes. Visually inspect screenshots of comparison, scenario, empty/error and exported dossier views. The main flow has no mocked success APIs. Capture console, failed requests and HTTP errors throughout; provider-failure tests remain separate.

Measure actual local first usable case view (target under 2 seconds after server readiness), interaction responsiveness and audit latency on recorded hardware, using cold and warm runs separately. Report numbers, environment and limitations; these targets are not results. Check that performance work did not remove provenance or hide long source text. Verify deep-link refreshes and offline bundled-case operation.

### Edge cases, integrity and completion

An export may include a source citation without source text when rights require it. It must not misrepresent this as full independent source verification. Old analyses remain reproducible under their pinned inputs. No functioning live-provider path is advertised when only cached/test responses were verified. Optional browser/provider failures are disclosed precisely; failures in the required product workflow block release.

**Complete only when:** both required authentic case families work end to end; an imported case works without special-case code; dossier exports and fresh offline replay agree; bibliographic downloads pass fidelity/no-network checks; real evaluation artifacts exist; actual reuse pins/notices are complete; all required browser/scientific/security gates pass; documentation supports a clean start; any shipped optional viewer passes its full gates; and the final acceptance checklist below is satisfied. A negative empirical result can be scientifically legitimate, but it cannot justify unsupported accuracy or superiority claims.

## 9. Evaluation protocol and scientific reporting

### 9.1 Questions and units of evaluation

Test two distinct things: **extraction from text** and **audit reasoning over the same supplied facts**. A curated system must not claim better extraction than an automatic baseline merely because people corrected its inputs.

Primary research question: does preparation-sensitive, uncertainty-preserving comparison reduce false acceptance of evidence transfers while retaining supported matches and useful abstention behavior, compared with simpler linkage methods? Secondary questions concern source attribution, scenario dependency correctness and whether clarification questions correctly identify consequential uncertainty.

Evaluation units are passage annotations, identity mappings and `(target material, tested material/context unit, interpretation scenario, policy)` comparison records. Report document, study, recipe-family and evidence-unit counts separately. Multiple arms, scenarios and variants within one paper are correlated; do not call them independent scientific replications.

### 9.2 Reference set and reviewer procedure

Create annotation guidelines before labeling: ingredient versus incidental mention; operation negation; material versus context dimension; critical unknown; explicit mismatch; negative outcome; identity support; and acceptable source spans. Reviewers label from original evidence independently of engine outputs and record rationale/source locations.

Required minimum data:

- Both authentic historical families and all three primary studies; at least 12 source-backed evidence units.
- At least 24 authentic comparison records, targeting eight development records and 16 frozen audit records, with study-family grouped splitting wherever possible. Put all variants of a given held-out modern study in the same split; keep template/near duplicates together. State unavoidable historical-family overlap instead of claiming independent family generalization.
- At least 12 real passage segments for extraction/annotation inspection. Related segments remain grouped in split records; report how many distinct works/documents they represent.
- At least 40 separately labeled synthetic adversarial cases for rule safety, unknowns, Unicode, propagation and boundary conditions. They are engineering fixtures, not independent scientific validation.

These counts are collection targets, not existing datasets or measured results. Do not invent a case to fill a class quota. Authentic class imbalance is reported. If qualified external review is unavailable, identify the team reviewers and their expertise, call the result a **team-audited reference set**, and exclude disputed labels from hard accuracy denominators while reporting them separately. A useful optional improvement is one domain expert reviewing the decisive assertions and eight highest-risk decisions, but do not block technical work while implying such a person is already available.

Construct real comparison records only from historically motivated candidates, documented reconstructions and source-backed interpretation alternatives. Do not pad the panel with an arbitrary cross-product of unrelated papers or duplicated units. Comparisons under documented alternative interpretations are derived audit records, not additional experimental observations; list their parent records and correlated counts. Deliberately mutated identities, invented omissions and adversarial pairings belong in the synthetic panel. If the meaningful authentic panel cannot reach the collection target, report the smaller panel and revise the evaluation scope explicitly before calling this gate complete.

Freeze split IDs, labels, reviewer records, source revisions and policy before final scoring. Keep labels out of model prompts and retrieval results. Since a coding agent can read local labels, do not claim a concealed benchmark; the freeze is procedural, and all post-freeze changes require a versioned new run with disclosure. A policy fixed after seeing the audit panel is a development result, not held-out validation.

### 9.3 Baselines and ablations

| System | Fixed definition | Purpose |
| --- | --- | --- |
| B0 lexical linkage | Rank the same candidate units by a documented token/BM25-style method over permitted text; a development-tuned threshold creates binary candidate-link acceptance | Establish what text/name retrieval alone does. Label it a retrieval baseline, not a competitive medical decision system. |
| B1 taxonomy-only | Compare reviewed modern accepted taxon IDs at declared specificity, ignoring part/composition/preparation; unknown identity abstains | Measure the benefit of material/context modeling over identity normalization. |
| B2 retrieval + LLM audit | Give a fixed, frozen model the same permitted passages and target question, explicit four-way verdict definitions and source-ID output schema; require cited reasons and allow abstention | Compare a capable conventional research workflow on equal evidence access. Record provider/model/version, prompt, parameters, truncation, cost and raw outputs. |
| B3 all-abstain | Always return insufficient information | Prevent a low false-acceptance score from rewarding an unhelpful system that never decides. |
| RECON single scenario | Full deterministic policy on the same reviewed facts for one chosen interpretation | Isolate benefits of materials/unknowns from the multi-interpretation feature. |
| RECON full audit | Same policy/facts plus exact domain enumeration, propagation and questions | Evaluate bounded robustness and consequential uncertainty. |

For B2, use a model already accessible at implementation time; do not invent credentials, free credits or a model name. Fix it before scoring. If unavailable, the runner records `not_run: credentials_or_model_unavailable`; comparisons against that baseline remain unestablished. The reproducible deterministic baseline suite is mandatory. A live LLM comparison is an additional empirical claim that requires real execution.

Run a controlled audit-reasoning experiment where every system receives the same human-reviewed facts/passages, without hidden extra context for RECON. Separately run end-to-end extraction experiments from the same raw input. Present curated RECON and automatic outputs as different conditions. For retrieval, freeze the corpus/query and assess Recall@k/MRR independently; do not mix candidate discovery with compatibility classification accuracy.

B0 has no native four-way scientific verdict: report its ranking/linkage metrics separately. If testing the naive policy of treating a retrieved link as strict comparability, label that additional transfer policy explicitly. Do not present its binary rejection as a scientifically established material mismatch or include invented four-way predictions. B1 maps compatible identity to comparable, explicit identity difference to mismatch, and unresolved identity to insufficient information solely for the declared taxonomy-only ablation; document this deliberately weaker policy. Four-way macro-F1 is reported only for systems that actually emit that label set, with absent classes and denominators visible.

Ablations: remove preparation dimensions; collapse unknown into match (research-only fixture, never production); force one botanical interpretation; remove composition; and compare incremental with full recomputation. Ablations explain mechanisms but are not substitutes for sensible baselines. Never tune the final policy on held-out labels.

### 9.4 Metrics and denominators

- Extraction: exact-span precision/recall/F1 for ingredients and operations, plus relaxed overlap as a secondary measure; unsupported languages shown separately. Manual corrections are not counted as automatic predictions.
- Identity: top-k candidate coverage where reference candidates exist, incorrect forced-resolution rate and correct abstention. Do not report calibrated probability metrics for categorical provenance statuses.
- Audit: four-way confusion matrix, per-class precision/recall and macro-F1; strict comparable precision/recall; false acceptance `predicted strict comparable on reference-incompatible / reference-incompatible`; unknown/insufficient abstention correctness; decision coverage and error among decided records. Publish numerator/denominator counts.
- Attribution: exact-span validity, citation coverage, and human-inspected assertion support. A substring validator proves anchoring, not semantic entailment; report these separately.
- Scenarios: percentage of edits with exact full-recompute equivalence, false unaffected classifications, missing impacted results and stable baseline reversion hashes.
- Robustness/questions: exact agreement with exhaustive reference enumeration and world-pair sufficiency checks; invalid-domain handling; domain completeness disclosed. These are algorithmic tests, not botanical validation.
- Performance: extraction, comparison, enumeration and export timings; p50/p95 and cold/warm distinction on named hardware; provider latency and cost separately.
- Usability: if researchers are available, time/accuracy for inspect a source, reject an inappropriate link, change an interpretation and reproduce a dossier. Record participant count/expertise and task failures. Do not generate SUS scores or imply a user study from developer-only inspection.

For small samples, show raw counts first. Wilson intervals for simple proportions may be shown with their independence limitations. If enough distinct study families exist, use paired family-level resampling for exploratory differences; with only three studies, avoid a meaningful-looking significance test or a strong superiority conclusion. Report per-family outcomes and leave confidence claims modest. Synthetic fixtures have their own table and cannot improve the headline authentic-corpus score.

### 9.5 Evaluation artifacts and release interpretation

Each run writes `artifacts/evaluation/<run-id>/` containing input/split/label hashes, git revision if available, dependency/runtime/OS details, policy/corpus/model configuration, seed, predictions JSONL, metrics JSON, per-case errors, timings, unavailable-baseline records and a readable methods/results report. Do not store provider secrets. Preserve all failed parses and source limitations rather than removing difficult cases silently.

Required technical targets: all exact-span/reference checks pass; zero unsupported comparable acceptances on the hand-audited scientific sentinel set; 100% full-recompute equivalence and clarification-oracle agreement within supported bounds; no silent unknown-to-match promotion. These are acceptance requirements, not observed results.

Empirical targets for development are at least 90% agreement on adjudicated per-dimension real-reference labels and better false-acceptance behavior than B1 without collapsing to B3's abstention behavior. Measure them honestly. Failure triggers error analysis and fixes followed by a disclosed new evaluation; it does not authorize changing labels or asserting superiority. If the authentic corpus contains too few comparable positive cases, comparable recall is undefined/unstable and the evaluation cannot substantiate that part of the hypothesis. Retain controlled positive fixtures and state the scientific limitation. Software completion alone does not establish broad scientific accuracy.

## 10. Final end-to-end product acceptance — technical draft mode

The following technical criteria have execution evidence in the Phase 5 handoff and final gate report. They apply to the explicitly authorized draft-corpus release and the evaluation refinement recorded under Phase 5. Independent human source checks, authentic reference labels and empirical scientific claims remain outstanding in [final acceptance](docs/release-acceptance.md); these are not satisfied by software tests.

- [x] A source-only clean copy can install, validate data, build and run locally from documented PowerShell commands with no paid service or model key.
- [x] Two genuine historical families and three modern primary studies are present with verified source identifiers, artifact-specific rights, attribution and actual coverage counts.
- [x] At least one authentic documented ambiguity has source-backed draft alternatives, inspectable supporting sources and real scenario-dependent reported-name/study-coverage consequences. Strict material verdicts remain insufficient under draft inputs; independent review remains pending.
- [x] A historical preparation mention is not fabricated into a fully specified recipe. Missing source language, translation, plant part, quantity or processing remains visible.
- [x] A new plain-text case can be imported, proposed/manual annotations reviewed, compared against selected real evidence, saved and exported through the same functioning APIs.
- [x] Every accepted scientific assertion, decisive rule input and reported result is traceable; inferred/hypothetical content and pending records cannot masquerade as historical fact.
- [x] Comparisons are tied to tested materials and contexts; full formulas, components, dropouts and outcomes remain separate. No paper-wide support is inherited from one favorable arm.
- [x] Strict verdicts honor critical unknowns and mismatches. Material, context, source-quality limitations and reported outcomes remain distinct. No treatment/efficacy recommendation is produced.
- [x] Scenario changes actually recompute dependencies, preserve unchanged results, survive reload/reset and agree with a full recomputation. A paper testing both alternative identities retains its correctly labeled coverage.
- [x] Exact bounded interpretation audits reject invalid/excessive domains and state their scope. Robustness counts are not presented as probabilities.
- [x] Clarification sets satisfy the independently checked sufficiency/minimality definition, including a valid empty-set outcome. Missing documentation is not replaced by fabricated candidate values.
- [x] Frozen JSON and HTML dossiers contain all permitted inputs, provenance, uncertainties and versions; protected text is filtered without losing citations. JSON replays offline in a fresh process to the same scientific result hash.
- [x] Two source-backed material versions compare correctly with provenance on both sides and no inferred lineage/effectiveness; CSL-JSON/BibTeX/RIS downloads preserve source-pinned reference identity with explicit format and pending-review limitations.
- [x] Upstream copied paths, modifications, actual package pins/integrity and third-party notices are recorded. Selected library integrations have our own browser/integrity tests; upstream demos/skipped tests are not claimed as verification. Any optional facsimile viewer passed its time, rights and browser gates.
- [x] Actual evaluation outputs compare mandatory deterministic baselines and ablations; any LLM baseline was really executed or is explicitly unavailable. Authentic and synthetic records, correlated families and reviewer limitations are disclosed.
- [x] All scientific sentinels, schema/data validation, unit/property and API integration tests pass. No unresolved critical source-integrity, security, replay or verdict defect remains.
- [x] Main production-build journeys pass in real browsers with visible interaction assertions, downloads and network checks. Desktop/tablet/phone/narrow layouts, keyboard, zoom, reduced motion and exported HTML have been visually inspected.
- [x] Normal user journeys have no unexpected console errors, failed assets or first-party network errors. Offline and provider-error modes work and accurately identify cached/live/unavailable states.
- [x] Every visible control is functional or explicitly unavailable with a reason. There are no fake counts, benchmark values, studies, progress indicators or success transitions.
- [x] Five phase handoffs, final startup/methods documentation and verification artifacts exist. Observed performance and remaining scientific limitations are stated precisely.

Passing this gate means a complete, bounded and reproducible research product exists. It does not mean historical identity, clinical effectiveness, a novel drug, broad multilingual competence or benchmark superiority has been established.
