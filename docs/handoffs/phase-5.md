# Phase 5 handoff — dossiers, offline replay and evaluation

**Completed and technically verified, 7 November 2026.** All 12 final gates passed with 212 tests, and the separate source-only clean-install/replay check passed. Scientific release remains in the explicitly authorized draft-corpus mode. No original assertion has been promoted to independently reviewed.

## Product behavior

The main navigation now includes **Dossiers** and **Evaluation**. Save a frozen scenario, diff, robustness audit or two-material comparison, then choose **Open dossier and downloads**. Dossier pages show human-readable decisions, exact inputs/policy/result fingerprints, unknowns, source rights and precise source dialogs. JSON, standalone HTML, CSL-JSON, BibTeX and RIS controls download actual files.

The dossier library validates/replays a selected JSON file before offering **Store isolated dossier**. Original IDs remain inside a distinct immutable import namespace. Reopening and replaying that namespace never modifies existing corpus records. When the primary original is included and within the normal text-import limit, **Create editable copy** creates a distinct pending local case through the ordinary curation workflow. Withheld originals stay withheld; no fake editable action appears.

Both authentic families and a newly imported private passage are exercised end to end. The preparation mention remains a preparation mention. Private original text/quote selectors are omitted from exported files while structured decision facts remain replayable. Imported declared reviewers are not authenticated or promoted.

## Implementation map

| Area | Files and responsibilities |
| --- | --- |
| Contracts | `packages/contracts/src/dossiers.ts`: strict versioned bundle, replay/import receipts, isolated records and computed evaluation artifact envelopes |
| Core | `packages/core/src/dossiers.ts`: immutable transitive closure, canonical scientific projection, exact shared-evaluator replay, rights omission, reference/hash/version checks, escaped standalone HTML |
| Shared rules | Existing `compare.ts` policy 1.1.0 remains the sole comparison implementation; `scenarios.ts` exposes the same derived name facts for original and protected-original replay |
| Server | `dossier-routes.ts`: frozen exports, reference downloads, isolated preview/import/replay, deliberate pending editable copy, readonly computed evaluation reads |
| Bibliography | `bibliography.ts`: pinned R5 structured projection and BibTeX/RIS mapping; owned RIS line serialization avoids upstream word-splitting |
| Persistence | Migration 6 adds immutable `imported_dossiers`; migrations 1–5 are unchanged. Computed runs retain an exact replay corpus closure for new freezes |
| Browser | `DossierWorkspace.tsx`, `EvaluationWorkspace.tsx`, `dossiers.css`; existing freeze controls link to actual dossier routes |
| JSON boundary | `transport-schema.ts` prevents AJV coercion of recursive scientific JSON; strict JSON and handler Zod validation remain authoritative. Numeric hypotheses and array/null preservation have regression coverage |
| CSP | `validation-runtime.ts` configures browser Zod interpreter mode before contracts initialize, preventing Firefox's eval-probe violation while preserving strict CSP |
| Tools | `replay-dossier.mjs`, `offline-network.cjs`, `evaluate.ts`, `verify-clean.mjs`, `performance-phase5.mjs`, `verify-phase5.mjs`, separate Firefox/WebKit runner |

No new package/repository/runtime/model was added. R1–R4 continue unchanged in purpose. R5 0.9.0 is completed using the installed cohort. R6 was omitted; no embedded image-viewer control, OCR or image/text alignment was advertised. Browser engines are test tools installed locally inside `artifacts/browser-engines`, not runtime dependencies.

## Revision and local workspace preservation

There is no Git repository in this workspace. The final code/config/data manifest is `artifacts/verification/phase-5/source-manifest.json`: 135 files, revision **`6a97f5a0aa0e62ae0be391ab5d7ea0e367c42fc4cf8759c0c89158a519166f84`**. Its revision is SHA-256 of the compact UTF-8 JSON array of `{file,sha256}` records sorted by path. Documentation, generated builds, dependencies, verification outputs and private local databases are outside that source revision. Each included file's raw bytes have their own hash.

`source-delta.json` lists all 23 added and 20 modified source/config files against the Phase 4 manifest; none were removed. The lockfile and retained corpus/taxonomy files are unchanged. Documentation additions/updates are this handoff, `docs/methods.md`, `docs/release-acceptance.md`, `docs/architecture.md`, `docs/data-dictionary.md`, `docs/upstream-reuse.md`, `README.md` and `IMPLEMENTATION_PLAN.md`. Earlier phase handoffs remain historical records.

Migration 6 is additive. `data/local/pre-phase5-backup.sqlite` retains the pre-migration database; it is not replaced by test fixtures. The read-only preservation receipt at `artifacts/verification/phase-5/workspace-preservation.json` confirms that the original cases, revisions, all 102 assertions, six source revisions, two pending study records and one pending full-text receipt are retained byte-for-byte as database rows. SQLite integrity and foreign-key checks pass. The original corpus file's byte hash remains `623a6697e3bd9fc129cec099e989860cd04c563f1fe3049b5415dcb95c9fe0fd`; all 102 assertion reviews remain pending.

The actual local service uses port **4317**. A genuinely computed draft audit is saved at `http://127.0.0.1:4317/analyses/analysis-c1ff42a7-3ad2-44cb-986e-ed2bd375ad4a`, titled **Eyesalve / bounded onion-leek draft audit**. It adds one frozen record and one computed run, with result hash `419e5bf87f2dd26de0440f4d452b2127932ae9db4b7c41d140e4a3a60ffc1c45`. The read-only final live browser receipt verifies its actual downloads, Unicode BibTeX and library visibility with no console/network errors; it creates no duplicate analysis. No new environment variables or external credentials are required.

## Public local APIs

All paths use `/api/v1`. Mutations reuse the existing same-origin/CSRF/rate/read-only guard. The service remains loopback-only.

| Method/path | Behavior |
| --- | --- |
| `GET /analyses/:id/dossier` | Exact versioned dossier from an immutable saved run; stored result must replay before export |
| `GET /analyses/:id/export?format=json\|html` | Actual safe-filename replay JSON or escaped, script-free self-contained HTML |
| `GET /analyses/:id/references?format=csl-json\|bibtex\|ris` | Pinned bibliography metadata only, no resolver/full-text fetch |
| `POST /imports/bundle/preview` | Strict raw JSON decode, integrity/schema/reference/rights/version checks and exact offline decision replay; stores nothing |
| `POST /imports/bundle` | Same checks, then idempotent immutable separate namespace |
| `GET /imports`, `GET /imports/:id` | Retained namespace metadata or original validated bundle |
| `POST /imports/:id/replay` | Reproduce the isolated scientific result hash with the same core |
| `POST /imports/:id/editable-copy` | Explicit new pending case from an included primary passage; old bundle IDs/reviews stay isolated |
| `GET /evaluation/runs`, `GET /evaluation/runs/:id` | Validated/hash-checked artifacts produced by the actual local runner; no frontend metrics generation |

Import bodies have a 32 MB transport/parser cap and a 30 MB browser file cap. Exported computed snapshots retain the existing 31 MB input/result budget. Entity caps include 4,096 assertions/spans, 256 materials, 128 source revisions, 2,000 candidates, and 200 case revisions/evidence units. Replay retains Phase 4's four-group/four-alternative/64-admissible-world/50-selected-unit bounds. Malformed JSON, duplicate keys, traversal metadata, unsupported versions/policies, broken source/material/case hashes, missing references, unlicensed included text and mismatched scientific results fail explicitly.

## Reproducibility, rights and evaluation

Read `docs/methods.md` for the exact hash meanings, omitted-original limitation, untrusted namespace model, bibliography format losses and evaluated scope. A bundle hash is not a signature; a replay result is not source authentication or scientific truth.

The actual development diagnostic has 34 correlated authentic interpretation records derived from 14 formulation/assay units, three primary studies and two historical families; 12 real source windows are inspected. There are zero independent authentic labels, so authentic accuracy/false-acceptance/recall/F1 remain unavailable. The narrower 24-development/10-grouped-diagnostic split and policy-after-development caveat are explicit. All deterministic baseline/ablation outputs and raw failures are retained. B2 is explicitly not run without configured credentials/model. Forty synthetic aggregation safety sentinels are separate engineering evidence; they cannot improve authentic scores. The source-anchoring check covers actual emitted extraction proposals, not semantic entailment.

## Verification

`npm run verify:phase5` executes licenses → production build → typecheck → lint → data validation → actual evaluation → unit → integration → all Chromium regressions → Firefox/WebKit key workflows → bounded core audit benchmark → production first-usable/comparison/export timing. `npm run verify:clean` independently copies source/config/data without dependencies, build outputs or local databases, then executes npm ci/build/data validation/evaluation/seed/start/export/fresh offline replay/import preview. Logs and reports are retained under `artifacts/verification/phase-5`.

New checks cover all four frozen analysis kinds, mixed source rights, exact graph closure, canonical versus timestamped hashes, escaped hostile markup, one-byte tampering, incompatible versions, raw duplicate/unsafe keys, numeric scientific input preservation, source/material hash drift, readonly rejection, isolated collisions/idempotency, pending editable copies, same-reference bibliography round trips, and fresh-process network-blocked replay. Original seeded source/corpus hashes remain unchanged.

Integration files run sequentially and unit workers are capped at two to avoid compiling several Fastify schemas concurrently on the shared Windows machine. Test assertions and the 15-second integration timeouts remain unchanged. Browser journeys wait for both actual library refresh requests before continuing to a cached entry; this avoids confusing a navigation-canceled fetch with an unexpected request failure. The seven focused Phase 5 journeys passed after this synchronization change, before the final complete suite.

Real browser journeys download and inspect actual files, open standalone HTML with the browser offline, execute a separate replay process, preview/store/reload an isolated import, inspect precise sources, preserve both authentic families, and import/extract/save/compare/export a new private passage through normal APIs. Chromium covers desktop, tablet, phone and 320-pixel layouts, keyboard, reduced motion, zoom-equivalent reflow, overflow, Axe and console/network gates. Firefox/WebKit cover the core scientific/source/export/replay/import flow at desktop and phone widths. Actual browser versions are retained in their test attachments. Normal flows have no mocked success APIs. Screenshots of the app, source dialogs, ledger and offline HTML are visually inspected.

Useful screenshot artifacts are `artifacts/browser/screenshots/dossier-{desktop,tablet,phone,narrow}.png`, `exported-html-{desktop,tablet,phone,narrow}.png`, and the actual workspace `phase5-final-dossier.png`, `phase5-live-dossier-narrow.png`, `phase5-live-source.png`, `phase5-live-evaluation.png`, `phase5-live-standalone-html.png`. Browser JSON reports are `artifacts/browser/results.json` and `cross-results.json`; failed-run traces are retained while diagnosing their run, and are not claimed as passing evidence.

The source-only clean workspace used Node **24.21.0**, npm **11.3.0**, lockfile version 3 and migration 6. All seven clean command gates passed, module resolution stayed inside the fresh workspace, offline replay reproduced `62a2869a7c46f89b49b74e14f1fb83f5dd8447c566c21a3281d2bc2881c533f8`, and isolated import preview reproduced the same decision. See `clean-install.json` and `clean-*.log`. Earlier phase installs used npm 12.2.2; the final lockfile replay with npm 11.3.0 also passed.

## Final executed gate record

`artifacts/verification/phase-5/report.json` records **`technical_passed`**, started `2026-11-07T08:15:15.104Z` and finished `2026-11-07T08:21:12.418Z` (**13:51 IST, 7 November**). Every one of the 12 gates exited zero. The unit suite passed **120/120**, integration **49/49**, Chromium **39/39**, and Firefox/WebKit **4/4**, totaling **212**. Both browser reports have zero unexpected, skipped or flaky tests. Engines were Chromium **156.0.8078.4**, Firefox **157.0** and WebKit **27.2**. The independent review command exited **1 as expected** for 102/102 pending independent human checks; see `review-gate.log`. It is deliberately separate from the technical pass.

The final evaluation run is **`diagnostic-20261107081603473`**. Its 34 authentic rows have zero independent labels and unscored empirical metrics. Forty separate aggregation sentinels passed. The independent source-anchor check validates **21 emitted proposals across 12 actual passage windows**; it makes no semantic-accuracy claim. The bounded final compiled-asset scan inspected 11 JavaScript files with no private-key/API-key sentinel hits; this is not a general security-audit claim.

Observed final timings on the **Intel i5-13420H, 16 GB RAM, Windows 10.0.26300, Node 24.21.0** machine:

| Measurement | Actual result | Scope |
| --- | --- | --- |
| Complete 64-world × 50-unit core audit | p95 **252.09 ms**, 20 samples after three warmups; target <500 ms passed | Synthetic repeated incomplete material profiles; excludes API/DB/rendering |
| First usable case, fresh browser context | p50 **439.49 ms**, p95/max **618.24 ms**, five samples; all <2,000 ms | After server readiness; not OS/disk-cold startup |
| First usable case, warm context | p50 **117.32 ms**, p95 **256.90 ms**, ten samples | Actual rendered source-ready DOM |
| Comparison API | first **297.29 ms**, warm p95 **384.57 ms**, ten warm samples | Local HTTP and serialization |
| JSON export API | first **290.52 ms**, warm p95 **248.37 ms**, ten warm samples; **232,716 bytes** | Actual generated dossier response |

All raw samples are retained in `benchmark.json` and `performance.json`. These measurements are local observations, not performance or accuracy generalizations. Earlier Phase 4 benchmark artifacts remain unchanged. `clean-install.json`, `live-final.json`, `workspace-preservation.json`, `source-manifest.json`, `source-delta.json`, the browser reports and the per-command logs provide the remaining execution evidence. The final acceptance checklist is in `docs/release-acceptance.md`.

Scientific release remains pending independent review of the original 102 assertions and authentic evaluation labels. This is an explicit bounded technical deliverable, not a claim of historical identity, clinical effectiveness or benchmark superiority.
