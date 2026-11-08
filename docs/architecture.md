# Architecture decisions · Phases 1–2

For the later implemented workspaces, see the phase handoffs and [product-flow audit](product-flow-audit.md). The current `/research` route composes a guided entry and shared journey navigation without a new persistence model. Validated candidate/study query parameters initialize the existing scenario editor; server-side scientific policy and frozen replay remain authoritative. `/api/v1/verification-study` serves only the fixed, locally generated source-cell artifact after strict parsing/schema/content-hash checks. It accepts no filesystem path and writes no database rows. `VerificationStudy` is the shared transport contract; `VerificationSummary` renders measured values and actual downloads. Pure source-cell matching/scoring functions remain in core; corpus/file loading and evaluation execution remain in server/tooling. No runtime dependency or external account was added.

Status: source-reader foundation and local material curation are implemented. The bundled corpus remains draft pending independent human review. Comparison/scenario/export schemas remain extension contracts. 

| Boundary | Implementation |
| --- | --- |
| Runtime | Node 24; npm workspaces; strict TypeScript; ESM |
| Browser | React 19, React Router 7, TanStack Query 5, Vite 7; system fonts and owned CSS |
| HTTP | Fastify 5 with `@fastify/vite` 10; one origin `127.0.0.1:4317` in development and production |
| Contracts | `packages/contracts/src/index.ts`: strict Zod schemas, TypeScript inference and draft-7 JSON Schema for Fastify |
| Core | `packages/core/src/index.ts`: deterministic parsing, hash, Unicode/span and corpus-reference validation; no DB, network, clock, UI or provider access |
| Persistence | `apps/server/src/database.ts`: better-sqlite3, six checksummed SQL migrations, foreign keys, WAL, 3-second busy timeout and transactional idempotent seed |
| Source selection | Owned `SourceAnnotationAdapter` over Recogito core; temporary selections never become accepted assertions |
| Sources | Approved local snapshot bundle; no runtime dependency on Wellcome, Europe PMC, GBIF or an LLM |

Imports flow `contracts ← core ← server`; the browser imports contracts and UI helpers, and reads authoritative source revisions from the API. Node crypto is used only for deterministic SHA-256 in core/server tooling; core is not shipped into the browser. React owns the source container element; the annotation adapter exclusively owns its descendants. The adapter restores the exact source string and destroys listeners on teardown. Strict Mode is enabled.

The R1 one-origin spike passed. The fallback dual-server design was not needed. The official Fastify example was adapted, not installed as another application or monorepo. Production assets and deep routes come from the built Vite SPA; `/api/*` has an explicit JSON catch-all that precedes UI fallback. Static unknown assets also return 404. Resource paths derive from `import.meta.dirname`, not the caller's working directory.

## Data flow

1. `tools/build-corpus.ts` reads retained, licensed snapshots and explicitly curated scan transcriptions. It builds immutable text, exact spans, draft assertions, case/material records and formulation × assay units.
2. `validateCorpus` rejects malformed schemas, duplicate IDs, hash drift, broken references, incorrect quote anchors and process cycles. `data:validate` additionally checks every retained raw byte and permission artifact against the manifest.
3. Server startup migrates a local DB and seeds the validated corpus transactionally. Re-seeding the same revision/hash is a no-op. A changed hash under the same corpus revision or reused immutable ID is rejected.
4. Read repositories select a case revision and filter source content/claims according to artifact-specific rights before serialization. The browser validates responses again. It displays the actual stored string, not a generated summary.
5. A provenance button shows edition, locator, transformations, credit, rights and hashes. A supporting locator changes the source/quote URL parameters, focuses the source and highlights the exact stored interval.

The corpus JSON is also stored in `corpus_revisions` as the immutable aggregate used by read repositories. Normalized tables enforce source/span/assertion/material/case/study/evidence relations. Phase 2 adds transactional revision-write repositories without mutating the seed or bypassing normalized foreign keys. Review decisions and provider refreshes require versioned records/audit events. Keep the original draft inspectable.

Wellcome canvas URLs are retained as identifiers, not assumed to dereference. The external scanned-page action maps the exact approved Wellcome canvas IDs to image-service URLs verified from the manifests and actual downloaded scans. Other providers do not receive a guessed page-image link. This is a plain external source action, not the optional R6 embedded viewer.

## Security and availability

The service is loopback-only. Phase 2 adds guarded local import/revision writes and a fixed-host GBIF name adapter; no model endpoint is present. Hostnames are allowlisted; CORS is not enabled. Requests have size/time limits. Strict JSON parsing rejects duplicate decoded keys, unsafe keys, malformed Unicode, comments, trailing commas and excess nesting. Zod/Fastify validate route/query/response shapes; extra query fields are rejected. Parameterized SQL handles values; table names are internal constants.

Source HTML is rendered as text. Source URLs allow only HTTP(S); the UI uses `noopener noreferrer` for external links. Production responses include CSP, no-sniff, no-referrer and frame-denial headers. Inline styles are permitted for the annotation renderer; executable inline scripts and remote scripts are not. No secrets or source submissions are transmitted. Errors contain a request ID and safe message, never a stack trace.

Offline snapshots support the reader. Unknown licenses withhold content; invalid IDs/revisions return structured 404; server failures have a retry state. This local architecture is not authorization to publish an editor. A future public deployment must keep writes disabled until authentication and authorization are separately implemented.

## Frozen extension boundaries

Phase 2 implements extraction, explicit local source checks, candidate choices, taxonomy and **scientific input** fingerprints. The frozen Phase 1 material `recordHash` proves integrity only; its semantic fields remain null until a new revision is saved. Hashing IDs or two equally incomplete records must never imply comparability. Phase 3 owns tested-material comparison. Phase 4 owns scenarios, dependencies, robustness and clarification. Phase 5 owns replay, exports and measured evaluation. The later-phase Zod envelopes exist, but no mock analysis is returned.


## Phase 2 implemented boundaries

`contracts/base.ts` preserves shared records; `contracts/curation.ts` adds strict editing envelopes. `core/extract` is a versioned English vocabulary/grammar over a normalized search view with exact UTF-16 mappings into the unchanged source. `core/quantities.ts` permits compatible metric/time conversions only. `core/fingerprint.ts` builds the semantic payload. These pure modules have no clock, network or database access.

`server/curation-routes.ts` owns HTTP/schema/origin/rate checks; `curation.ts` owns transactions, source checks, revision saves and audit events; `taxonomy.ts` owns fixed-authority GBIF parsing, raw snapshots, alternatives and cache. `CurationService` uses an immediate SQLite transaction, creates new assertion/material/case IDs, validates the full aggregate, seeds it append-only, and records audit/decision/idempotency entries atomically. Earlier corpus IDs/hashes are retained in `corpusHistory`; a case pins the corpus that created it. Stable occurrence IDs link per-material slots through `material_slots`. The original Phase 1 ingredient table is legacy data; new code must use the versioned slot table. Source strings remain immutable.

The default mode is now **local editor**, with bounded imports/revision writes, exact Origin, same-origin fetch metadata and a server-generated CSRF token. `--read-only` disables editing; no public/shared editor or authentication is implemented. The only outbound adapter is a fixed-host GBIF modern-name lookup: it receives a separately entered scientific-name query, never the source passage. Private `user_text` sources are locally displayable with pending rights and redistribution disabled. Other pending/blocked content stays withheld.

Fuzzy/higher-rank/ambiguous/insufficient synonym responses cannot be attached. Modern taxonomy and historical identification use separate assertions. A candidate must cite at least one non-taxonomy historical/scholarly source; a taxonomic response alone is rejected as identification evidence. The **v1 GBIF Backbone** adapter is intentional: do not silently switch to a v2/checklist authority with a different response shape. Raw synonym match and accepted-usage responses become distinct source revisions. Provider responses use a 24-hour cache, three concurrent requests, five-second timeout, 250 KB response limit and stale-cache fallback. Retrieval time is not a taxonomic release date. Offline snapshots and their licensed metadata are under `data/taxonomy`.

`MaterialWorkspace` uses a data router for unsaved-navigation blocking, keyboard tabs, pinned read-only revisions and server-derived query data. Recogito supplies native selection; keyboard exact-quote/occurrence selection is an equivalent bounded fallback. Drafts live in component state, are protected against navigation and preserved after failed/stale saves. Closing/reloading the tab after dismissing its warning discards them. Only declared actor name/qualification is retained in localStorage; checked-review mode resets for each revision.

A new save constructs `material-fingerprint-v1`; pending facts become `not_reviewed` unknowns and explicit identity assumptions remain assumptions. Ingredient multiset ordering is invariant; process dependency order is significant. Equal hashes never establish material comparability. The frozen Phase 1 materials still have null semantic fingerprints. No comparator, named scenario, robustness analysis or export is implemented in this phase.

Browser tests use port **4318**, a new UUID database under `data/local`, and disabled live lookup. They never write synthetic reviewer acceptance or fixture cases into the user's **4317** workspace. The separate live adapter probe is retained under `artifacts/providers`. Environment flags and all routes are listed in the Phase 2 handoff.


## Phase 3 evidence architecture

`contracts/evidence.ts` adds strict study, evaluation, literature, pending-record and licensed-paragraph envelopes. `core/compare.ts` owns the pure nine-dimension policy, all-findings aggregation, context comparison, source dependencies and deterministic output IDs. No policy logic lives in the UI. Evaluations pin case revision, corpus revision, policy hash and explicit scenario inputs; reports preserve the original outcome assertion ID independently of assumptions. The source read set is conservative and includes full material assertion dependencies for future invalidation.

Migration **4** adds `evaluation_runs`, raw `literature_snapshots`, `pending_studies` and `pending_fulltext`. Evaluations are append-only, keyed by scientific inputs; pending metadata is separate from curated studies/evidence. A newly searched record never becomes an assay or accepted scientific fact. No existing scientific record or original corpus file is rewritten.

`server/evidence-routes.ts` exposes local studies/detail, pinned case evaluation, Europe PMC search, pending metadata import/list and licensed pending-text retrieval. Mutations reuse the same origin/CSRF guard as curation. The small literature adapter uses literal-phrase queries (not untrusted query language), encoded cursor pagination, a 24-hour cache, seven-second timeout and 1 MB search / 5 MB XML bounds. Search has a 20/minute limit. Current offline mode follows `RECON_LIVE_TAXONOMY=0`, which disables both live enrichment adapters; local studies/evaluations remain available. Request IDs on imports identify the client request; provider record identity makes repeated imports idempotent.

`EvidenceWorkspace` links from source/material views, selects real formulation × assay units across the three studies, displays all nine findings, opens exact supporting passages, shows assay metadata as readable fields and preserves numerical reported outcomes. It validates responses and hides stale comparisons when case hash or selected evidence changes. Supporting source dialogs use the owned native-range scroll locator because the upstream renderer may not have layout bounds immediately after a dialog opens. All prior adapter tests remain regression gates.

Pending text is a licensed paragraph preview, not an accepted material or new evidence unit. Metadata/permissions failures leave a clear metadata-only record. The fixed PMCID URL is never supplied by the user. No schema/graph import, named scenario, robustness analysis or export has been enabled before its planned phase.


## Phase 4 implemented boundaries

`contracts/scenarios.ts` owns the strict bounded HTTP/state envelopes. `core/scenarios.ts` owns exact domain enumeration, conditional source-label correspondence, virtual hypothesis forks, diff, four-state robustness, separate study/fixed-arm coverage and exact sufficient sets. It reuses the sole `core/compare.ts` policy, now 1.1.0, with independent assignments on either material side. Normal results keep draft/unknown fields conservative. Hypothesis IDs are explicitly whitelisted only inside labeled conditional evaluation.

Migration 5 adds immutable `scenario_versions`, `scenario_runs` and `analysis_records`; prior migrations are unchanged. Latest/pinned context hashes are checked before computation/save. Scenario head revisions and idempotency keys protect concurrent writes. Frozen records copy exact requests, policy definitions, relevant structured original records and rights-filtered result/source closures from the computed run. They never rerun against latest data when opened.

All selected results share the left material, so a scientific choice change currently takes the explicit bounded full-recompute fallback. Rationale-only edits reuse results. Per-request result memoization and target hashes improve exhaustive audit speed without sampling. The 200-seed diff oracle verifies complete results/reasons/dependencies. Client request sequences, abort signals and exact signatures suppress obsolete responses. Browser cancel stops waiting; it cannot undo a save already received. See `docs/handoffs/phase-4.md` for limits, verification, timing and the draft-mode scientific boundary.


## Phase 5 implemented boundaries

`contracts/dossiers.ts` owns the portable dossier/import/replay/evaluation envelopes. `core/dossiers.ts` builds a transitive immutable closure and serializes rights-filtered data; the same core comparison/scenario functions reproduce all four analysis kinds. Scientific input/result hashes are distinct from timestamped file integrity. Protected original text and exact selector text are omitted explicitly; structured decision facts, IDs, citations and source hashes survive. A hash is not a signature or source authentication.

Migration 6 adds immutable isolated dossier records keyed by internal namespace and unique exact bundle hash. It never merges imported IDs/reviews into normalized corpus tables. A deliberate editable copy routes an included primary passage through `CurationService.importText`, producing fresh IDs and pending claims. API validation accepts raw bundle text so duplicate keys remain detectable. `transport-schema.ts` keeps recursive scientific JSON opaque to AJV coercion while strict JSON parsing and handler Zod contracts still validate it. Browser validation initializes Zod's interpreter before contracts to preserve the strict CSP in Firefox.

The standalone HTML serializer contains no scripts or application dependency. Bibliography uses only the installed Citation.js core/BibTeX/RIS 0.9.0 cohort, UTF-8 BibTeX configuration and an owned RIS line serializer over the library's structured mapping. Dossier/import libraries refresh on navigation; editable copies invalidate the cached case library. `/evaluation` reads actual hash-checked CLI artifacts, with authentic metrics unavailable rather than invented. See `docs/methods.md`, the Phase 5 handoff and `docs/release-acceptance.md`.
