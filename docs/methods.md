# Methods, reproducibility and limits

RECON compares recorded material dimensions and assay context under a fixed deterministic policy. It does not identify a historical plant, establish chemical equivalence, authenticate an imported author/reviewer, or recommend treatment. Source attribution, decision replay and scientific validity are separate claims.

## Frozen dossiers

`recon-dossier-v1` / `recon-replay-1.0.0` carries the exact request, policy, transitive case/material/assertion/taxon/evidence/source closure, derived reported-name links, computed decisions, source rights manifest and explicit limitations. Original identifiers are preserved. Case ancestors and their references remain included so supersession links do not become dangling pointers. Exports use the frozen run's records, rather than rebuilding a conclusion from the latest editor state. A legacy Phase 4 snapshot can use its exact immutable corpus revision; replay must still reproduce its stored result before export is allowed. Unsupported policy/engine versions fail explicitly.

Three hashes have different purposes:

- **Scientific result hash:** canonical hash of the deterministic decision projection. Runtime timing, display warnings and export timestamps are excluded.
- **Scientific input hash:** canonical decision inputs, policy, original source hashes and immutable scientific identifiers/values. Record/display rationale, personal reviewer metadata and export timestamps do not become scientific differences. The exact complete request remains separately retained for inspection.
- **Bundle hash:** integrity of the complete timestamped file, including title, original analysis identity, rights and rendering metadata. Changing an exported file invalidates this hash. This is not a digital signature or proof of scientific truth.

Only artifacts explicitly marked storage/display/redistribution permitted with `bundle_allowed` include original text and exact quote/prefix/suffix selectors. Other source text is empty and quote selectors are explicit omission markers. Citations, locators, rights restrictions and original text/revision hashes remain. The omitted original is not independently hash-verified. Structured asserted decision facts remain available for replay; their pending/inferred states remain visible. The conditional reported-name projection retains bounded derived name links so an omitted original does not force a different decision. Included originals corroborate those derived links; inaccessible originals cannot do so.

Run `npm run replay -- path/to/dossier.json` after building packages. This uses Node and the pinned core, with no database, provider, model or application server. Verification additionally preloads `tools/offline-network.cjs` to fail if any HTTP/HTTPS/fetch/socket request is attempted. The fresh process reproduces the scientific result hash. Matching hashes establish computation/integrity, not the correctness of the supplied assertions.

The standalone HTML dossier escapes all source/request/claim/attribute content, uses a restrictive CSP and local styles, includes human-readable dimension findings and full expandable payloads, and needs no scripts or application access. Print through the browser. Bibliographic HTML is escaped plain metadata; no particular citation style is claimed.

## Import and editing

The strict JSON parser rejects duplicate decoded keys, unsafe object keys, malformed Unicode, excessive depth and oversized input. Shared schemas, graph/source/material/case hash validation, version/policy checks and complete offline replay run before an import can be saved. There are bounded entity counts and explicit domain limits. Bundled paths are metadata only; unsafe traversal/absolute path metadata is rejected and no bundle path is read from disk. Sources are rendered as text; imported markup/scripts are never executed.

Imports occupy immutable `import-*` SQLite namespaces and do not merge into the corpus. A repeated exact bundle is idempotent. Declared accepted reviewers inside an import remain untrusted declarations. A deliberate **Create editable copy** action copies an included primary passage through the normal private text-import workflow, creating fresh local IDs and pending claims; it never promotes imported scientific reviews. Omitted/oversized originals have no editable-copy action. The original bundle and identifiers remain inspectable and replayable.

## Bibliography

The pinned R5 cohort is `@citation-js/core`, `@citation-js/plugin-bibtex`, `@citation-js/plugin-ris` 0.9.0. Validated structured CSL metadata is supplied directly; identifier strings are never passed to a resolver. No DOI, Wikidata, CSL style processor or full-text resolver plugin is loaded. Actual CSL-JSON/BibTeX/RIS downloads refer to the dossier's pinned bibliography, not the latest search results.

Literal contributor names/roles, supplied date metadata and identifiers are retained in the dossier. CSL-JSON includes representable roles and supplied dates; unknown dates remain absent with original date metadata in the note. BibTeX/RIS can lose creator roles, date precision and source-specific fields. BibTeX explicitly disables the upstream ASCII-only conversion and uses record IDs as labels so Chinese/Japanese text and accented names survive export. The RIS plugin's text serializer inserts line breaks every 70 characters, including inside words; RECON uses its structured mapping with an owned unwrapped line serializer. Full title/DOI round trips are checked on the real selected references; a separate controlled non-Latin/unknown-date fixture checks Unicode fidelity without inventing a reference for the scientific corpus. Bibliographic independent review remains pending.

## Executed evaluation scope

`npm run evaluation:run` freezes the procedural input/label manifest before computing a diagnostic. It records code/corpus/policy/input hashes, runtime, seeds, raw predictions, all failures, timings, an index and methods. `/evaluation` reads these artifacts; frontend code does not invent metrics.

The authentic panel contains **34 derived comparison records**: ten eyesalve formulation/assay units under unresolved/onion/leek interpretations, plus four vinegar/honey assay units motivated by the oxymel preparation mention. They derive from **14 units, three primary studies and two historical families**. These are correlated scenario records, not 34 independent experiments. The 2018 study contributes 24 development rows; 2020/2023 contribute ten grouped diagnostic rows. Historical-family overlap is unavoidable. The policy was implemented before this diagnostic; no concealed/held-out benchmark is claimed. The originally targeted 16 independently labeled audit rows were not available; the scope is explicitly reduced rather than padded with unrelated comparisons.

There are **zero independently adjudicated authentic labels**. Original assertions remain draft by user choice. Consequently authentic accuracy, macro-F1, false acceptance, comparable recall, extraction precision/recall/F1 and retrieval relevance metrics are null/unavailable. The system does not use its own output as a reference label, invent a team reviewer, or treat a missing/unknown outcome as negative evidence. No superiority claim is supported by these data.

Executed deterministic comparisons receive the same supplied structured facts:

- **B0:** token-Jaccard ranking/linkage over curated fields, fixed untuned threshold 0.15. Binary links are not four-way scientific verdicts; without independent relevance labels, Recall@k and MRR are unavailable.
- **B1:** taxonomy-only ablation. Species-level identity match/difference maps to comparable/mismatch, unresolved identity abstains. It intentionally ignores preparation and is not the production policy.
- **B3:** always insufficient information.
- **RECON:** the full single-scenario deterministic policy, plus preparation/composition ablations and a clearly research-only unknown-as-match condition. That last condition is never a product verdict path.
- **B2:** not run, `credentials_or_model_unavailable`. No provider/model was configured and no raw output, cost or model advantage is invented.

The separate synthetic panel contains **40 explicitly labeled aggregation safety sentinels** across critical unknowns/mismatches, contextual unknowns/mismatches and complete recorded matches. These are a narrow engineering truth table, not empirical full-material validation. Broader propagation/clarification/Unicode/bundle-security properties are covered by the software tests and reported separately. Twelve actual passage windows are inspected from original revisions with absolute UTF-16 offsets; proposals retain original hashes/anchors. Independent extraction labels are unavailable. A substring check establishes anchoring, not semantic entailment.

The original 200-seed diff/full-recompute and 200-seed clarification-oracle tests continue to run. Performance uses named hardware and retained raw samples, with cold/warm definitions. The 64-world × 50-unit workload repeats authentic incomplete material profiles; it is not a fully curated worst-case guarantee. Browser first-usable measurements start after server readiness; a fresh browser context is not an OS/disk-cold server. No researcher usability study or SUS score was generated.

## Release interpretation

The 8 November product-flow update adds a separate [executed source-cell location study](research/source-cell-study.md), generated by `npm run evidence:report`. Its 16 published-cell requests and 16 controlled context conflicts are explicitly scoped to one table and are separate from the authentic comparison and synthetic aggregation panels above. RECON and exact-context-filtered BM25 both achieve 32/32 on this development fixture; unfiltered Jaccard and BM25 achieve 16/32. All four locate the 16 positive cells; the difference is controlled-conflict abstention. No independent scholarly or clinical accuracy is implied. Full queries/predictions, source/code/fixture fingerprints and the [automated integrity scope](review/automated-source-audit.md) remain inspectable.

Technical completion means a bounded local workbench can inspect sources, edit drafts, compare recorded materials, audit interpretation domains, preserve conclusions, exchange permitted dossiers and reproduce decisions. It does not complete the independent corpus review gate or establish scientific accuracy, botanical identity, clinical transfer or broad multilingual competence. The optional facsimile viewer was not admitted; the existing exact text/provenance and external source-page actions remain functional.
