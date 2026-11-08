# Phase 1 handoff — verified draft source reader

**Technical status: complete for the explicitly authorized draft-corpus mode.** Final verification passed at **2026-11-05 19:53:29 UTC / 6 November 2026 01:23:29 IST**. Phases 2–5 have not been implemented. The user explicitly chose “No reviewer yet; keep the corpus as draft.” Scientific release acceptance remains pending; no automated check has been presented as human review.

## What works

- One installed npm workspace with React/TypeScript/Vite, Fastify and native SQLite; one origin on `127.0.0.1:4317` in development and production. The pinned official Fastify starter was adapted; the two-server fallback was unnecessary.
- A real searchable case library, source/translation reader, original Old English opening excerpt, linked primary-study text, exact source selection inspection, provenance/rights dialogs, immutable identifiers/hashes and working source locators. Original Greek is explicitly absent. All source text is rendered inertly.
- Six immutable text revisions, exact UTF-16 quote/prefix/suffix anchors, draft assertions and two authentic historical cases. Three real primary studies supply 14 author-supported formulation × assay records; these are not 14 independent studies.
- Two checksummed migrations; foreign keys, WAL and bounded busy timeout; transactional, idempotent seeding; immutable source/case/material/assertion safeguards and conflict detection.
- Strict JSON/schema/reference/hash validation; rights-filtered read APIs; structured errors; local host restriction and production security headers. No live provider, LLM, account, API key or remote font is needed.
- Only implemented source-reader routes/actions are shown. No extraction, comparison, scenario, import, export or evaluation endpoint pretends to function.

Implemented routes: `GET /api/v1/health`, `GET /api/v1/cases?offset=&limit=`, `GET /api/v1/cases/:id?revision=`, `GET /api/v1/sources/:id/revisions/:revision`. Unknown API routes return JSON 404, including when UI fallback is enabled. Browser routes are `/cases` and `/cases/:id/source`, with source/span query parameters supporting reproducible passage links.

## Verification evidence

The final `npm run verify:phase1` result is **`technical_passed`** in `artifacts/verification/phase-1.json`. Per-command logs are in the same directory. Browser results are in `artifacts/browser/results.json`; 13 expected, 0 skipped, 0 unexpected and 0 flaky.

| Gate | Observed result |
| --- | --- |
| Clean lockfile install | `npm exec --yes --package=npm@12.2.2 -- npm ci` passed on Windows / Node 24.21.0; zero reported dependency vulnerabilities |
| Dependency inventory/notices | Passed; 400 lockfile package entries, 323 installed entries, reviewed license expressions and generated distributable notices. Optional platform packages explain the count difference |
| Production build | Passed; Fastify serves the built SPA; approximately 486.48 KB JS / 152.28 KB gzip and 24.06 KB CSS / 5.98 KB gzip |
| Type checking | Passed across contracts, core, server, browser, tools and tests |
| Lint | Passed |
| Data validation | Passed: 6 source revisions, 19 exact spans, 102 draft assertions, 14 evidence units; retained source/permission bytes and all references/hashes checked |
| Unit tests | **39 passed**, including strict JSON, RFC 8785 boundary vectors, 150 generated key-order cases, UTF-16/code-point round trips, combining Greek/Old English/supplementary Unicode, span/hash drift, safe URLs and independent primary-table MIC checks |
| Integration tests | **17 passed**: empty/previous-schema migration, seed twice, immutability/conflicts, typed reads, pagination, malformed/oversized/duplicate JSON, rights filtering, host/path protection and a production startup from a different working directory |
| Real Chromium | **13 passed**: six actual Recogito package/adapter checks and seven application workflow checks |
| Reproducible corpus rebuild | Byte-identical; recorded in `artifacts/verification/corpus-reproducibility.json` |
| Live scanned-page link checks | Both primary historical image URLs returned HTTP 200; recorded in `artifacts/verification/source-link-checks.json` |
| Independent human-review gate | **Pending as explicitly requested**; `npm run data:review-gate` exits 1 for 102/102 unchecked release assertions |

The browser suite launches the actual production application. It walks library → case API → source revision → exact displayed text, checks displayed hashes against responses, opens attribution/rights, follows a locator into a highlighted span, switches original/translation and modern study sources, opens oxymel and reloads its deep URL. It checks 1440×900, 1024×768 and 390×844 layouts, no page-level horizontal overflow, expected keyboard focus, dialog escape/restoration, actual phone touch navigation, reduced motion and 200% zoom-equivalent reflow. The latter uses a 720×450 CSS viewport at DPR 2, not a claim that Chrome's native zoom menu was automated.

Axe WCAG A/AA-tag checks passed on the library and source workspace at all three viewports. Dialog focus/escape and visible rendering were separately checked. This is evidence for the tested workflow, not a comprehensive accessibility certification or a screen-reader usability study. Normal reader workflows had no unexpected browser console exceptions, failed requests or HTTP errors. Deliberate 404/503 tests verify truthful error/retry behavior separately.

Actual screenshots were saved **and visually inspected**: `library-desktop.png`, `library-tablet.png`, `library-phone.png`, `reader-desktop.png`, `reader-tablet.png`, `reader-phone.png`, the provenance dialogs and `reader-200-percent-reflow.png` under `artifacts/browser/screenshots`. The desktop/tablet notebook scrolls within a bounded panel; phone content stacks. The visual checks caught and corrected low-contrast metadata, focus behavior and an off-screen skip-link artifact.

Build-only warnings remain: two upstream Zod comments contain misplaced pure annotations which Rollup discards, ESLint 9 is upstream-deprecated, and Playwright's process launcher emits a `NO_COLOR`/`FORCE_COLOR` warning. They did not fail the build/tests and are not browser runtime errors. No advisory was suppressed to obtain the clean dependency audit.

## Frozen data and scientific limitations

Corpus revision: `corpus-2026-11-05.1`. Corpus file SHA-256:

```text
623a6697e3bd9fc129cec099e989860cd04c563f1fe3049b5415dcb95c9fe0fd
```

The machine-readable manifest is `data/corpus-manifest.json`; the validated aggregate is `data/corpus/recon-v1.json`. Retained permission/source artifacts are under `data/sources/raw`; acquisition timestamps are frozen separately at `data/sources/acquisition.json`. Source text transformations are documented per revision. Preflight scan images are ignored inspection artifacts, not an embedded facsimile feature.

| Case/source | Verified witness / scope |
| --- | --- |
| Bald's eyesalve translation | Cockayne II, 1865, Book I ch. ii, printed p. 35, verified canvas **0085**. Duplicate preface page labels must not be used |
| Old English | Same edition, printed p. 34, canvas **0084**; opening clause only. Unicode transcription/alignment still needs independent specialist review |
| Hippocratic oxymel | Adams I, 1849, *Regimen in Acute Diseases* §16, printed p. 301, canvas **0321**. Preparation mention, not a complete recipe; respiratory/drink context is preserved |
| Fuchs 2018 / PMC6261618 | CC0; four reported formulations × two S. aureus strains, eight numeric Table 2 MIC records. A separate test reads actual XML table cells to check the curated numbers |
| Furner-Pardoe 2020 / PMC7387442 | CC BY 4.0; ESO/ESL × Newman synthetic wound context. Individual arm outcomes remain `unknown/not_reviewed`; pooled paired-batch findings are not assigned to individual arms |
| Harrison 2023 / PMC10433418 | CC BY 4.0; RWV1/PV1 + MediHoney × two organisms, four records. Arm-specific outcomes and both synergy-null-model interpretations remain `unknown/not_reviewed` |

The historical `Allium oleraceum?` edition gloss and the 2020 onion/leek alternatives are separately preserved. Their list is not exhaustive. No modern GBIF IDs or accepted historical identities were invented. Baseline assignments remain empty. Unknown historical temperature/quantity basis/composition remain unknown.

Wellcome's canvas identifiers were confirmed in the manifests but returned 404 when dereferenced. They therefore remain **identifiers in provenance**, while the user-facing “Open scanned page” action uses the exact approved image-service paths inspected during transcription. No R6 image viewer is installed.

All 102 assertions remain assistant-authored drafts. The review record timestamp is a draft-batch record, not an independent human acceptance event. Pending data cannot silently become accepted comparison facts or evaluation gold. The concrete review checklist is `docs/review/phase-1-corpus-review.md`. The user decision permits continued technical development with these labels; it does not waive later scientific-release integrity requirements.

Modern material manifests currently hold cited composition/process claims and assay identities. Their complete component/part/process/quantity structures must be curated during Phases 2–3 before comparisons run. Material `recordHash` is an integrity digest over record fields/IDs. **Scientific `fingerprint`/`fingerprintPayload` are null** until Phase 2 constructs the properly normalized payload. Two equal missing-data hashes must never imply comparability.

## Next agent / Phase 2 instructions

1. Read the product context, updated implementation plan §§1–8 and Phase 2, architecture, data dictionary, comparison policy, reuse audit and this handoff. Preserve the functioning app and current corpus; do not start another scaffold or clone another complete product.
2. Reuse the already installed **R2 core** through `apps/web/src/adapters/SourceAnnotationAdapter.ts`; R1 continues to host it, and R3/R4 remain the shared hash/JSON boundaries. No new full repo clone or language conversion is needed for Phase 2. Keep Citation.js for Phase 3/5 and optional OpenSeadragon for the conditional Phase 5 gate.
3. Keep the source container's text equal to the immutable display string. Internal selectors are UTF-16; W3C positions require the owned explicit code-point conversion. Preserve the tested destroy/remount behavior and both rendering paths. Revalidate quote/source hash on persistence; temporary reader selections are not saved annotations.
4. Add scoped English extraction proposals, manual review, historical occurrence candidates, explicit unknowns, modern-name taxonomy normalization, quantities/steps and semantic material fingerprints. Unsupported languages retain manual annotation; no automatic historical taxon identification or translation is implied.
5. Implement append-only review/revision writes transactionally, with expected base revision and actual actor/qualification. New assertion/material payloads require new IDs; preserve supersession through audit events. Use a documented composite key `${caseId}.r${revision}` when resolving case `supersedes` links; add the corresponding reference check. Do not change existing immutable rows or treat the draft seed generator as a mutable database API.
6. The current read repository selects the immutable aggregate from `corpus_revisions`, with normalized relation tables alongside it. Phase 2 writes must update the aggregate/revision repository consistently in the same transaction; do not leave a new relational row invisible to reads. Source revisions remain immutable. Add schema migrations with new checksums, never rewrite migrations 1/2.
7. Keep source rights filtering in all paths. Future rights-filtered exports need explicit omission/partial-verification handling; do not feed withheld empty text into the full-corpus validator and claim its original text hash was verified.
8. Maintain draft/accepted/hypothetical distinctions in the UI and scientific inputs. Preserve all three documented cropleac proposals and their different provenance. Do not copy the 2020/2018 leek nomenclature into a single unqualified accepted concept.
9. Run the existing gates and the Phase 2 import → extraction → review → revision-save → reload browser story. Do not ship hidden extraction mocks, hardcoded taxonomy IDs or placeholder comparisons. Produce a separate Phase 2 handoff before beginning Phase 3.

## Start and inspect

From the project root, `npm run start` serves the built reader at http://127.0.0.1:4317/cases. `npm run dev` uses the same port; run only one mode at a time. `npm run verify:phase1` repeats the automated technical gates. `npm run data:review-gate` intentionally remains separate and pending. Setup/recovery details, exact version pins and native-script allowlist are in the README and upstream-reuse document.
