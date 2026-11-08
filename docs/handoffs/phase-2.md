# Phase 2 handoff — source extraction and material curation

**Technical status: complete in the user-authorized draft-corpus mode.** `npm run verify:phase2` passed at **6 November 2026 10:06:06 UTC / 15:36:06 IST**. It ran 66 unit, 27 integration and 20 real Chromium tests: **113 passed**, with no skipped, flaky or unexpected browser results. Phases 3–5 have not started. No efficacy, extraction-accuracy or benchmark result is claimed.

The running app was separately inspected at **10:06:33 UTC / 15:36:33 IST** on **http://127.0.0.1:4317/cases**. It reports migration 3, local editor enabled, two original cases and the original corpus revision. Bald's eyesalve remains r1 with no selected identity and all its displayed assertions pending. The independent release gate still reports **102/102 unchecked assertions**, as explicitly requested by the user. Synthetic test acceptance exists only in isolated test databases.

## Working capabilities

- Import exact plain text with language, title, edition, author/credit, record type and rights rationale. Imports become distinct researcher-provided local drafts, not authenticated historical witnesses. Whitespace and Unicode are preserved; even declared open rights do not automatically enable redistribution.
- Run deterministic `english-preparation-v1` proposals for ingredient mentions, operations, explicit amounts/equality, duration, Celsius temperature and contact/vessel wording. Every proposal has verified original offsets/hash/quote. The vocabulary is editable in `packages/core/src/extract/lexicon.ts`; changes require a version bump. Proposal IDs incorporate the lexicon hash. Longest matches, boundaries, repeated terms, negation and the editorial-footnote boundary are handled conservatively.
- Inspect a proposal in its source; use, reject or edit it with a rationale. “Use in draft” does not mark a claim human accepted. Changed controlled values are inferred. Unsupported language and study/taxonomy context return explicit normal capability states, with manual annotation available.
- Annotate actual mouse/native selections through the installed Recogito adapter, or use the keyboard exact-quote selector with an explicit repeated occurrence. Supplementary Unicode, combining accents, source switches and adapter teardown preserve the exact source string. Invalid/hash-stale/surrogate-splitting selections are rejected.
- Inspect and edit occurrence-scoped ingredients, explicit unknown part/state, source-backed candidates, quantity constraints and process ordering. Plant part/state cannot be dismissed as not applicable. Missing quantities never become zero; incompatible metric basis/unit pairs and process cycles are rejected.
- Add botanical interpretations with scholarly/source support, status and rationale. A GBIF/taxonomy response by itself is refused as historical identification evidence. Taxonomic normalization is separate from historical identification. Multiple candidates survive; selecting one is an explicit baseline scenario assumption, not an overwritten source identity. New candidates receive immutable IDs on save, then can be selected in a subsequent revision.
- Query GBIF through a fixed-host bounded adapter or use retained licensed snapshots. Exact, sufficiently specific, explicitly reviewed records can be attached. Fuzzy, higher-rank, homonym/ambiguous and unresolved accepted-usage matches are blocked. Reported scientific names, authors, ranks, qualifiers and accepted usage are retained separately. A synonym match and its accepted-name response are distinct immutable source records.
- Save a new material/case revision atomically with the expected base revision, immutable earlier history, actor/rationale, proposal decisions, audit events and idempotency key. Stale writes return 409 while the visible draft remains intact. Pinned revisions disable editing. Unsaved route navigation opens a working leave/stay dialog; tab reload/close uses the native warning.
- Construct a readable `material-fingerprint-v1` input payload and SHA-256 on save. Pending assertions remain unknown; accepted human fields and explicit assumptions are distinguished. Ingredient multiset order is invariant; process dependency order is significant. Matching incomplete hashes never prove material, chemical or therapeutic equivalence.

## Architecture and migration contract

Read `IMPLEMENTATION_PLAN.md`, `docs/architecture.md`, `docs/data-dictionary.md`, and both handoffs before Phase 3. Keep one TypeScript workspace and one Fastify/Vite origin; no Python service, LLM or new dependency was introduced. Existing R1/R2/R3/R4 reuse continues. R5 bibliographic acquisition remains Phase 3/5; R6 is still optional.

Contracts now re-export `base.ts` and `curation.ts`. Core now re-exports `integrity.ts`, `extract/index.ts`, `quantities.ts`, and `fingerprint.ts`. Existing import paths stay compatible. New source kinds are `user_text` and `taxonomy_snapshot`; optional `corpusHistory` records earlier IDs/hashes, and `TaxonConcept.supportingSourceRevisionIds` retains multiple taxonomic responses. `CaseResponse.taxa` and editor/provider health capabilities are additive extensions.

**Migration 3** preserves migrations 1/2 unchanged. It adds stable `occurrences`, per-material `material_slots`, versioned candidate relationships, `extraction_runs`, `proposal_decisions`, `idempotency_keys`, `provider_cache` and supporting indexes/immutability guards. Original `ingredient_slots` and `mapping_candidates_phase1` remain legacy migration data. Do not use the legacy slot table for new versions. Source/material/assertion/case snapshots are append-only through the service. Startup re-seeding never replaces edited workspace history.

`CurationService` wraps each mutation in an immediate SQLite transaction, verifies source and proposal ownership, creates new records, constructs/validates the full corpus, seeds normalized relations, and writes audit/idempotency records together. Local raw text/rights/provider objects are content-addressed under ignored `data/local`. A failed transaction may leave an unreferenced immutable object file; it does not expose a partial case revision. The workspace is deliberately bounded: 100 cases, 200 revisions per case, 18 MB aggregate, 300 proposals per run, 50,000 UTF-16 units per import. It is not a production-scale corpus store.

The browser entry uses React Router's data router for navigation blocking. `MaterialWorkspace`, `ExtractionReview`, `MaterialEditor`, `IdentityCandidateDialog`, `ImportDialog` and `ManualAnnotationDialog` implement the actual flows. Annotation content is owned by the existing adapter; controls remain outside its exact-text container. Review state resets to draft per revision. Actor name/qualification alone is retained locally. Draft edits are in memory, not an autosaved recovery store.

## APIs and runtime

All APIs use `/api/v1`; strict request/response contracts live in `curation.ts`. Reads from Phase 1 continue to work.

| Method/path | Behavior |
| --- | --- |
| `GET /editor-session` | Editing/live capability and server-session CSRF token |
| `POST /imports/text` | Exact local passage import; new case/source/material r1 |
| `POST /cases/:id/extraction-proposals` | Immutable extraction run on an expected case/source revision |
| `GET /cases/:id/extraction-proposals?runId=&caseRevision=` | Saved run and revision-bounded committed decisions |
| `POST /cases/:id/revisions` | Atomic append-only save with optimistic revision check |
| `GET /cases/:id/revisions` | Immutable version history, actor/rationale and hashes |
| `GET /cases/:id/audit` | Up to 200 latest audit events |
| `GET /taxonomy/candidates?scientificName=` | Typed GBIF/live/cache/bundled/unavailable result |

Writes require the exact same Origin plus `X-Recon-CSRF`; fetch metadata is checked when present. Host allowlisting/CSP/strict JSON/bounds and parameterized SQL remain active. Rate limits are 60 writes/minute and 20 taxonomy lookups/minute. No case passage is sent to a provider. Local imports are displayed under an explicit private-display exception, with redistribution false; other pending/blocked source text remains withheld. This editor is loopback-only, without multi-user authentication.

Run `npm run build` then `npm run start`. `RECON_PORT` defaults to 4317. `RECON_DATABASE_PATH` can select a separate file only inside `data/local`; the default is `data/local/recon.sqlite`. `RECON_LIVE_TAXONOMY=0` disables live lookup. `npm run start -- --read-only` disables both editor and live lookup. No secret or external account is required.

## Data and actual provider verification

The original corpus file is unchanged: SHA-256 **623a6697e3bd9fc129cec099e989860cd04c563f1fe3049b5415dcb95c9fe0fd**; 6 source revisions, 19 spans, 102 pending assertions, 3 studies and 14 formulation × assay units. Local editing does not rewrite that file. The original Old English opening excerpt/Greek absence and tentative `Allium oleraceum?` remain explicit. Modern study material/outcome completion belongs to Phase 3; pending fields must not become comparison matches.

Seven actual GBIF response/metadata files are retained under `data/taxonomy/raw`. `manifest.json` freezes their hashes, retrieval URLs/dates, dataset ID and CC BY 4.0 credit; `acquisition.json` records acquisition times. `data:validate` checks all seven bytes and the authority's license evidence. The dataset is **GBIF Backbone Taxonomy**, DOI https://doi.org/10.15468/39omei. The adapter intentionally uses documented legacy v1, with fixed authority and flat response semantics; see https://techdocs.gbif.org/en/openapi/v1/species.

Actual captured results demonstrate why authority review matters: unqualified `Allium porrum` returned a higher-rank primary result with competing usages; `Allium porrum L.` returned the synonym whose accepted usage is `Allium ampeloprasum L.`. Unqualified `Allium oleraceum` has competing exact usages. They are not silently collapsed or treated as historical certainty.

`npm run probe:taxonomy` actually executed the implemented adapter against **Allium cepa L.** at **09:49:12 UTC on 6 November**: source `live`, state `ready`, match `EXACT`, usage/accepted usage **2857697**, reported name **Allium cepa L.**. Raw JSON and its SHA-256/retrieval record are at `artifacts/providers/gbif-live-match.json` and `gbif-live-probe.json`. This verifies transport/contract behavior, not botanical historical identification or ongoing provider availability. The cache is 24 hours; fixed-host requests have five-second timeouts, a 250 KB response cap and concurrency limit three. Failures return stale retained data or an explicit unavailable state.

## Executed verification gates

`npm run verify:phase2` ran, sequentially: **licenses → build → typecheck → lint → data:validate → test:unit → test:integration → test:e2e**. All returned zero. Exact times, exits and logs are under `artifacts/verification/phase-2`; `report.json` is `technical_passed`. The separate live probe and read-only inspection of the running user workspace are additional evidence, not mocked tests. `npm run data:review-gate` was rerun and returned **1 intentionally**, with 102/102 independent human checks missing.

| Gate | Observed result |
| --- | --- |
| Dependencies/license notices | 400 lockfile entries / 323 installed; unchanged dependency cohort; GBIF attribution added |
| Build/type/lint | Passed; approximately 561.05 KB main JS / 175.61 KB gzip, 42.76 KB lazy editor / 12.05 KB gzip, 34.19 KB CSS / 8.01 KB gzip |
| Data validation | Original retained bytes/spans/references plus seven GBIF snapshots/license verified |
| Unit | **66 passed**: Unicode/search/offsets, exact/repeated/negated mentions, unsupported language/context, quantity basis/conversions, fingerprint unknowns/multisets/process order, GBIF exact/synonym/fuzzy/rank/homonym/absent-primary, cache, 429/503/malformed/timeout/size failure paths |
| Integration | **27 passed**: migrations/idempotent seed/immutable reads, import→extraction→review→save→reload/pinned history, stale conflict, invalid manual span, Unicode manual path, origin/CSRF/read-only rejection, distinct imports/idempotency collision, rights, accepted synonym provenance, taxon mismatch, rejection of taxonomy-only identification support, and incompatible units, production startup from another cwd |
| Actual Chromium | **20 passed**, 0 skipped/unexpected/flaky: six upstream adapter tests, seven Phase 1 regressions, seven Phase 2 checks |
| Live implemented provider | Verified real exact name match; retained raw response/hash/date |
| Running user workspace | Migration 3, editor enabled, two original draft cases, no identity silently selected and no browser console errors; `local-workspace.json` |
| Scientific release | **Pending**, intentionally separate from the technical pass |

Browser tests launch the actual production app on **4318** with a new UUID SQLite database and offline snapshots. Tests interact with import forms, inspect highlighted proposals, edit a controlled value, reject a proposal, accept ordered operations, save/reload, mark a part unknown and inspect r1 history. They annotate unsupported Unicode through real mouse selection and a repeated-occurrence keyboard path; normalize a real cached candidate, choose an explicit identity assumption, handle delayed/out-of-order/unavailable taxonomy, and verify stale 409 draft preservation. API source spans and saved state are checked in addition to UI labels.

The suite checks 1440×900, 1024×768 and 390×844 layouts, normal console/network failures (none unexpected), keyboard dialogs/tabs, source selection, existing phone touch navigation, reduced motion and 200% zoom-equivalent reflow (720×450 at DPR 2, not native browser zoom). Axe WCAG A/AA-tag checks pass on the tested material workflows; this is not an accessibility certification. Deliberate conflict/provider/error paths are tested separately from normal zero-error assertions.

Screenshots were saved **and visually inspected** under `artifacts/browser/screenshots`: `material-desktop.png`, `material-phone.png`, `material-tablet.png`, `material-200-percent-reflow.png`, and the running original case in `local-material-desktop.png`, in addition to the Phase 1 source views. Wide layouts keep the source beside the editor; narrow layouts stack readable panels. The latest machine-readable browser result is `artifacts/browser/results.json`.

Nonfatal build diagnostics are upstream Zod annotation comments and a Vite >500 KB main-chunk warning. The editor is lazy-loaded; no warning was concealed or promoted into a failed test. No extraction precision/recall, time-saving estimate or scientific benchmark has been measured; Phase 5 owns that evaluation.

## Limits and instructions for Phase 3

1. Keep the original corpus draft. Local self-declared source checks are editorial actions, not independent specialist validation. Never accept pending assertions just to create positive comparisons. The independent release gate remains open.
2. The extractor is a bounded proposal generator. Equality-to-ingredient and process links are heuristic suggestions requiring review; it is not a general recipe parser, translator or multilingual model. Historical units, unknown terms, incomplete composition and ambiguous identity need manual curation. The UI exposes these limits.
3. Fingerprints are normalized scientific **inputs**, not material-comparison decisions. Equal incomplete hashes remain insufficient. The component list is the recorded/curated set, not proof of exhaustive composition. A future comparator must inspect assertion review, uncertainty, assumptions and source scope directly.
4. Modern tested-material details and the 2020/2023 arm-level outcomes remain pending as described in Phase 1. Phase 3 must retain formulation × assay distinctions, organism/endpoint/exposure context and original reported taxon wording. Do not count extra arms as extra studies.
5. Candidate creation and baseline identity assignments work. Named scenarios, dependency propagation, robustness/clarification, comparisons, dossiers/replay/bibliographic downloads and measured evaluation are intentionally absent. Do not show fake controls for them.
6. No new repository clone or language conversion is needed to continue. Follow the plan's R5 acquisition/verification when bibliographic support is actually introduced. Preserve this architecture and immutable IDs; do not replace the app with another framework.

All Phase 2 technical completion gates are satisfied. The next authorized development unit is Phase 3 when the user requests it; this handoff does not start it.


Code/data revision: `204d97a5845be702aeadbb799350be8d00947deb4100fbc4b9878284c7945b31` over 83 source/config/test/frozen-data files, recorded in `artifacts/verification/phase-2/source-manifest.json`. This workspace has no Git repository, so no commit ID is claimed. Documentation and local user databases are excluded from that digest.
