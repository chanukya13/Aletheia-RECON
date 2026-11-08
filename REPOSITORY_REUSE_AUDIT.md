# Repository reuse audit

Checked 5 November 2026. **Static repository/code/license review only. No application has been created, no upstream application has been installed or run, and no runtime compatibility or time saving has been measured.** This document supports the revised `IMPLEMENTATION_PLAN.md`.

## Decision

Use a small composition of maintained components around an original scientific core. Copy the official Fastify vanilla React/TypeScript SPA example as a narrowly scoped starting point; consume Recogito, canonicalize, a stable JSON parser and selected Citation.js modules as pinned packages. Do not fork a complete research assistant or combine multiple application backends.

I reviewed 18 candidate repositories at different depths. The strongest direct gains are source annotation, application setup, reproducible serialization, strict bundle parsing and research-reference exports. None of the inspected applications supplies RECON's specific material audit, documented-interpretation domain, dependency propagation and clarification semantics. That is a finding about this reviewed set, not a claim that no such code exists anywhere.

Reuse supports two useful additions to the required product: **comparison of two source-backed material/reconstruction versions**, and **CSL-JSON/BibTeX/RIS reference exports**. An original-page zoom viewer is a conditional extension. The evidence corpus, scientific review and evaluation still need actual work; cloning does not produce them.

## Selected components and exact acquisition boundaries

The SHAs below were obtained from GitHub refs/commit endpoints. “Source version” means the inspected package manifest. npm registry access failed in this environment, so published tarball availability/integrity and actual installation remain the first implementation gate. Do not equate a manifest version with a verified registry release.

| ID | Upstream / inspected revision | License | What to acquire | What remains ours |
| --- | --- | --- | --- | --- |
| R1 | [fastify/fastify-vite](https://github.com/fastify/fastify-vite/tree/127d70319fb2668cf5b59e339e08e2dd95bffd08), commit `127d70319fb2668cf5b59e339e08e2dd95bffd08`; plugin source version `10.0.0` | MIT | Sparse checkout **only** `e2e/react-vanilla-spa-ts/`, the referenced `e2e/test-factories.mjs`, and `LICENSE` for inspection/adaptation. Install released `@fastify/vite` as a package after its compatibility gate. | Workspace contracts, data model, APIs, DB, UI and all research logic. Copy only bootstrap/config/mount patterns; replace the sample application. |
| R2 | [recogito/text-annotator-js](https://github.com/recogito/text-annotator-js/tree/0d375b0cba2bf68378f1f6dff30ee8812df95c0c), commit `0d375b0cba2bf68378f1f6dff30ee8812df95c0c`; core source version `4.3.7` | BSD-3-Clause | Install `@recogito/text-annotator`; keep upstream source as reference, not a second application. Do **not** install the React/TEI/PDF wrappers by default. | React lifecycle wrapper, canonical span adapter, assertion/review storage, accessibility controls and W3C offset conversion. |
| R3 | [erdtman/canonicalize](https://github.com/erdtman/canonicalize/tree/31fb117afde3ef305b2e1d99bde539bf6300bc62), commit `31fb117afde3ef305b2e1d99bde539bf6300bc62`; source version `5.1.0` | Apache-2.0 | Install `canonicalize`, with source and test vectors as reference. Do not fork it. | Defining which scientific fields enter a hash, deterministic set/sequence ordering, explicit unknowns, identity/provenance semantics and replay. |
| R4 | [microsoft/node-jsonc-parser at v3.3.1](https://github.com/microsoft/node-jsonc-parser/tree/3c9b4203d663061d87d4d34dd0004690aef94db5), commit `3c9b4203d663061d87d4d34dd0004690aef94db5`; stable source version `3.3.1` | MIT | Install stable `jsonc-parser@3.3.1` after package verification. The inspected main branch advertises `4.0.0-next.2`; do not adopt that prerelease. | Rejecting duplicate keys, parser errors, excessive depth, unsafe property names and scientifically invalid content before canonicalization. |
| R5 | [citation-js/citation-js](https://github.com/citation-js/citation-js/tree/d2d069124ed026bbc99cb46fe70044b5d0e0596c), commit `d2d069124ed026bbc99cb46fe70044b5d0e0596c`; selected modules' source version `0.9.0` | MIT for selected modules | Install the same verified release cohort of `@citation-js/core`, `@citation-js/plugin-bibtex` and `@citation-js/plugin-ris`. No whole-repository clone or all-plugins `citation-js` bundle. | Mapping reviewed citation metadata to CSL-JSON, rights filtering, deterministic reference IDs, source-to-claim linkage and export endpoints. |
| R6, conditional | [openseadragon/openseadragon](https://github.com/openseadragon/openseadragon/tree/36b92d228b121f5fa4c933aa5bb3d5eb10859e05), commit `36b92d228b121f5fa4c933aa5bb3d5eb10859e05`; source version `6.1.1` | BSD-3-Clause | Install released `openseadragon` only after the optional-viewer gate. It already has TypeScript declarations; do not rewrite its JavaScript. | Rights-cleared page assets, verified page/canvas mapping, React lifecycle wrapper, source provenance and accessible controls. |

The licenses above concern code. They do not license books, articles, taxonomies, model weights, demo images or database exports. Preserve upstream copyright/license notices and any applicable NOTICE files, and record modifications to copied source. Review the actual resolved dependency tree in Phase 1; a top-level permissive license is not a complete dependency audit.

### R1: why this starter, and what needs adjustment

The inspected [vanilla SPA server](https://github.com/fastify/fastify-vite/blob/127d70319fb2668cf5b59e339e08e2dd95bffd08/e2e/react-vanilla-spa-ts/src/server.ts) uses Fastify with Vite's SPA integration. Its [package file](https://github.com/fastify/fastify-vite/blob/127d70319fb2668cf5b59e339e08e2dd95bffd08/e2e/react-vanilla-spa-ts/package.json) depends on monorepo `workspace:` and `catalog:` versions, uses pnpm build commands, and has a POSIX-style production environment assignment. It is not a ready standalone npm/PowerShell app.

Adapt it to our npm workspace, exact package versions, explicit server/web roots and cross-platform scripts. Use one Fastify origin for development and production. Do not adopt the `@fastify/react` SSR renderer or its routing/state conventions. The example's [tests](https://github.com/fastify/fastify-vite/blob/127d70319fb2668cf5b59e339e08e2dd95bffd08/e2e/react-vanilla-spa-ts/src/server.test.ts) depend on parent helpers; port the startup/build assertions into our tests rather than copying broken relative imports. They do not replace browser testing.

This buys setup, not a finished application. If the pinned release cohort cannot pass a bounded 90-minute startup/deep-route spike, retain the original Vite-dev-proxy/Fastify-static arrangement and record the fallback before Phase 1 completion. Do not spend the deadline debugging a starter or silently change stacks mid-phase.

### R2: the most substantial reuse

The [core package](https://github.com/recogito/text-annotator-js/blob/0d375b0cba2bf68378f1f6dff30ee8812df95c0c/packages/text-annotator/package.json) is TypeScript with browser annotation/rendering APIs. Its [React wrapper](https://github.com/recogito/text-annotator-js/blob/0d375b0cba2bf68378f1f6dff30ee8812df95c0c/packages/text-annotator-react/package.json) declares React 18/19 compatibility but brings TEI, CETEIcean and additional bindings; its package test script explicitly skips tests. We can wrap the core with a small React component instead of taking the whole dependency surface.

Important code findings:

- [Range-to-selector](https://github.com/recogito/text-annotator-js/blob/0d375b0cba2bf68378f1f6dff30ee8812df95c0c/packages/text-annotator/src/utils/annotation/range-to-selector.ts) computes offsets using JavaScript string lengths.
- The inspected [W3C serializer](https://github.com/recogito/text-annotator-js/blob/0d375b0cba2bf68378f1f6dff30ee8812df95c0c/packages/text-annotator/src/model/w3c/w3c-text-format-adapter.ts) passes those offsets through without a code-point conversion.
- [Lifecycle/rendering code](https://github.com/recogito/text-annotator-js/blob/0d375b0cba2bf68378f1f6dff30ee8812df95c0c/packages/text-annotator/src/text-annotator.ts) exposes creation/destruction and multiple renderer paths.

Therefore, keep a controlled plain-text source container whose `textContent` is exactly our immutable display string. Do not include toolbar text or hidden editorial notes inside the offset domain. Use an owned adapter that validates quote and offsets before storage, converts W3C positions explicitly, and never persists DOM `Range` objects. Test React Strict Mode remounts, source changes, overlapping annotations, touch selection and renderer fallback in real browsers. The upstream code's existence is not proof those requirements already pass.

Do not copy its example comments, random identifiers or sample literary text into the scientific corpus. Annotation is a proposal/review UI; it cannot accept assertions or settle botanical identities by itself.

### R3–R4: deterministic artifacts need both normalization and validation

Canonicalize's [implementation](https://github.com/erdtman/canonicalize/blob/31fb117afde3ef305b2e1d99bde539bf6300bc62/lib/canonicalize.js) and [Unicode tests](https://github.com/erdtman/canonicalize/blob/31fb117afde3ef305b2e1d99bde539bf6300bc62/test/strings.js) address stable JSON serialization and malformed Unicode. It does not know that ingredient order is a set while preparation order is a sequence. RECON must perform those domain decisions first and validate plain JSON values; no custom `toJSON`, Date, undefined, function, nonfinite number or cyclic object can enter scientific payloads.

The stable JSON parser exposes [tree/scanner APIs and strict parsing options](https://github.com/microsoft/node-jsonc-parser/blob/3c9b4203d663061d87d4d34dd0004690aef94db5/src/main.ts). Its permissive recovery behavior means callers must reject errors explicitly. Disallow comments/trailing commas, reject duplicate decoded keys per object and reject unsafe keys; enforce depth/size/token limits while scanning before constructing an object. Then validate with Zod and canonicalize. No parser library supplies the domain/reference validator.

### R5: useful reference exports without silently importing another processor

The [BibTeX module](https://github.com/citation-js/citation-js/blob/d2d069124ed026bbc99cb46fe70044b5d0e0596c/packages/plugin-bibtex/src/output/index.js) and [RIS module](https://github.com/citation-js/citation-js/blob/d2d069124ed026bbc99cb46fe70044b5d0e0596c/packages/plugin-ris/src/index.js) provide format conversion. Use reviewed, already structured CSL-JSON as input; no arbitrary URL/string auto-resolution and no DOI/network plugins. Reference conversion is server/CLI only and must pass an outbound-network-denied test.

Do not include `@citation-js/plugin-csl` by default: its [manifest](https://github.com/citation-js/citation-js/blob/d2d069124ed026bbc99cb46fe70044b5d0e0596c/packages/plugin-csl/package.json) depends on `citeproc`, whose [own license](https://github.com/Juris-M/citeproc-js/blob/master/LICENSE) offers CPAL or AGPL terms. This is not a claim that it is unusable; it is an unnecessary additional licensing surface for the required plain references/BibTeX/RIS exports. Use a simple escaped bibliographic display, with no claim of journal-style compliance. CSL-JSON as a data format does not require a CSL formatting engine.

Exports preserve missing dates/authors, historical edition/translator distinctions, non-Latin names and original identifiers. A formatted reference is not source evidence and must not increase a scientific confidence label. JSON dossier replay remains the scientific artifact; `.bib`/`.ris` files contain bibliographic metadata only.

## Whole applications and alternative repos: deliberate decisions

| Repository | Inspected evidence | Decision and language strategy |
| --- | --- | --- |
| [SCAI-BIO/kitsune](https://github.com/SCAI-BIO/kitsune/tree/149427fe0015d75b32c8d8d0219c6fb3f88a8131) | Apache-2.0; README, tree, Angular client manifest, Python API manifest. | Do not clone as the product base or convert Angular to React. It is an embedding/terminology harmonization application with a multi-component environment; a conversion would leave our main scientific engine unimplemented. Its authorship is acknowledged as prior work, not a dependency. |
| [SCAI-BIO/datastew](https://github.com/SCAI-BIO/datastew/tree/ee9a9c8579b7e26727bc7025bb659d828ebebe24) | Apache-2.0; Python manifest includes embedding, ML and database packages. | No production service or TypeScript port. Semantic similarity is not material comparability. Revisit only for a separately evaluated candidate-retrieval experiment. |
| [shennong-program/shennongname](https://github.com/shennong-program/shennongname/tree/85072314e9009eac572feeb373d7764d61b02abd) | Apache-2.0; inspected model, naming algorithm, test tree and Python dependencies. | Reference the distinction among species origins, parts and processing. Do not port the roughly 47 KB naming algorithm or run Flask/Pandas for display labels. RECON needs uncertainty/provenance semantics rather than a newly generated standardized medicinal name. No copied Chinese text or transliteration code. |
| [Future-House/paper-qa](https://github.com/Future-House/paper-qa/tree/c692d0dfeac4a0296599f7fe21a253a58b7ac12a) | Apache-2.0; README/tree, Python dependencies, clients and test fixtures. | No whole-app clone or Python-to-TypeScript rewrite. It is a substantial scientific RAG system. An optional offline evaluation runner can later use the unchanged Python package, isolated from production, only with permitted inputs and accessible models. It is not a drop-in material audit. |
| [AndyZHENG0715/TCM-Sage](https://github.com/AndyZHENG0715/TCM-Sage/tree/6a849c2e623614f5b112b24b73b11694498bdb5e) | MIT code; README and `src/source_context.py`; Next.js/Python/RAG stack and bundled corpus/graph references. | Do not clone as our foundation, copy its corpus, transplant its replayed demo or port its source-reconstruction helper. Data rights need separate verification, and reconstructing overlapped retrieval chunks differs from immutable edition spans. Useful competitive precedent, with substantial architectural replacement needed. |
| [AmanVarshney01/create-better-t-stack](https://github.com/AmanVarshney01/create-better-t-stack/tree/a9bd456ccc9d80b8b90e65075aac99b08d7af43f) | MIT; root tooling and React Router template inspected. | Strong general scaffolder, but do not run alongside R1 or merge generated apps. The inspected template adds framework/router server conventions; the tiny official SPA example needs fewer changes to our REST/SQLite design. No Bun generator build is required. |
| [epicweb-dev/epic-stack](https://github.com/epicweb-dev/epic-stack) | MIT; metadata, tree and auth/test/application structure inspected. | Do not clone as base. Useful full-stack auth/test foundation for other products, but changing framework/DB conventions and removing unrelated product flows does not eliminate RECON's research work. No bulk copying of its demo assets or tests. |
| [TEIC/CETEIcean](https://github.com/TEIC/CETEIcean/tree/5af893df21c946f72face978b2769bbe7ca1eb12) | BSD-2-Clause; package and TEI conversion implementation inspected. | Defer full TEI rendering. It converts markup/attributes and supports behavior hooks; that is not our safe plain-text offset domain. If later adopted, retain JavaScript as a package behind a sanitizer and explicit projection, never translate the library. |
| [nleguillarme/taxonerd](https://github.com/nleguillarme/taxonerd/tree/624d55184b7bf3c1baaba7ca878701ba088dd08a) | MIT repository; current metadata and documented model/linker workflow reviewed. | No production Python service and no port of learned NLP behavior into rules. An optional unchanged offline batch process could propose modern scientific-name mentions after model/data rights and evaluation are checked; it cannot identify a historical referent. |
| [jwadhams/json-logic-js](https://github.com/jwadhams/json-logic-js) | MIT; metadata/current activity checked. | No rule-engine replacement. Generic JSON rule execution does not supply our typed unknowns, all-dimension dependency reads or source-backed explanations. The small original evaluator is easier to validate than a new rule DSL plus adapters. |
| [benjamine/jsondiffpatch](https://github.com/benjamine/jsondiffpatch) | MIT; metadata/current activity checked. | No scientific diff dependency. Structural object changes cannot decide whether normalized identities/materials or unknowns are comparable. Reuse our typed comparison output for the version-difference UI. |
| [KIOM-AIDoc/MHDR](https://github.com/KIOM-AIDoc/MHDR) | Metadata/README and annotation workflow previously reviewed; no repository license established. | Do not redistribute corpus or code without a usable artifact-specific license. Its task also differs from material compatibility. |

Searching the names EthnoDB and Phytocode returned similarly named repositories without an established connection to ETHCSTWIN. Do not treat name matches as official upstream sources or clone them on that assumption. No inspectable official EthnoBot code repository was established in this search.

## Phase-specific acquisition and integration plan

| Phase | Clone / install / reference | Concrete integration | Verification added |
| --- | --- | --- | --- |
| 1 | R1 sparse source checkout; R3/R4 packages; R2 small compatibility spike | Adapt npm/PowerShell bootstrap; one Fastify origin; `scientificHash` and strict JSON boundary helpers; provenance/license ledger. | Clean install/build, root/deep URL/API 404 routing, cross-platform scripts, JCS vectors, duplicate keys/depth, and annotation Unicode/cleanup spike. |
| 2 | R2 core package only; ShennongName reference only, no code port | `SourceAnnotationAdapter` maps browser selections to our immutable spans; editorial review remains ours. | Mouse/touch/keyboard annotation, overlaps, repeated text, Greek/Old English/supplementary Unicode, source switches and Strict Mode cleanup. |
| 3 | No new application clone; R5 isolated local-metadata prototype | Reuse R1 infrastructure; implement own Europe PMC/GBIF adapters and evidence policies. Define `BibliographicRecord` → CSL-JSON mapping, without full-text rights assumptions. | Offline citation conversion prototype, source metadata fidelity, no implicit network; all material-rule tests remain required. |
| 4 | No new repository; reuse existing scientific evaluator | Add direct source-backed material-version comparison alongside scenario and robustness audits. | Real 2018/2020 reconstruction differences, source links on both sides, unknown handling, no inferred lineage and no copied structural-diff semantics. |
| 5 | R5 selected packages; R6 only if extension gate passes | Add actual `.bib`, `.ris` and CSL-JSON downloads; finish replay with R3/R4; optionally show a rights-cleared original page with zoom. | Download/parse-back fidelity; no outbound resolution; deterministic replay; actual optional-image source/zoom/error/accessibility checks if shipped. |

## Acquisition controls and contribution record

Only Phase 1 implementation will create `research/upstream/` and project code. Do not replace the project root with another repository. For R1 use a partial clone, fetch the pinned commit, sparse-checkout the listed paths and detach at that commit. Do not install the upstream monorepo, run its lifecycle scripts or retain `workspace:`/`catalog:` dependency expressions in our standalone package files.

The R1 acquisition commands below are **future Phase 1 instructions, not commands executed during this audit**. Run from the existing project root, only if that checkout directory does not already exist; inspect an existing checkout rather than overwriting it.

```powershell
New-Item -ItemType Directory -Force -Path research/upstream
git clone --filter=blob:none --no-checkout https://github.com/fastify/fastify-vite.git research/upstream/fastify-vite
git -C research/upstream/fastify-vite fetch --depth 1 origin 127d70319fb2668cf5b59e339e08e2dd95bffd08
git -C research/upstream/fastify-vite sparse-checkout set --no-cone "/e2e/react-vanilla-spa-ts/" "/e2e/test-factories.mjs" "/LICENSE"
git -C research/upstream/fastify-vite checkout --detach 127d70319fb2668cf5b59e339e08e2dd95bffd08
```

Verify `git rev-parse HEAD` in that checkout, preserve the license, and copy/adapt only the named scaffold files into our existing workspace structure. Its sample `App.tsx` is replaced with our real reader. Other selected components are installed as exact verified packages in their owning workspace, not cloned into separate running applications. A local fork is justified only by a reproduced upstream defect with a small documented patch and regression test.

For package reuse, confirm a stable published release and its actual source revision, package integrity, engine/peer dependencies, license/NOTICE and transitive dependencies. If a source-manifest version is not published, select the nearest stable compatible release, inspect its relevant code and record the changed revision before continuing. No `@latest` automation, unpinned Git dependencies, simultaneous old/new versions or silent substitution.

At implementation, create `docs/upstream-reuse.md` and `THIRD_PARTY_NOTICES.md`: upstream URL/commit, actual package version/integrity, copied paths and destination, purpose, modifications, retained notices, compatibility test evidence and a distinction between upstream and newly authored work. Preserve the scientific code/content license separation. Do not describe reused infrastructure as newly invented by the team.

## Time and expansion decisions

The deadline was rechecked through Devpost at 5 November 2026 23:37 IST: **8 November, 14:30 IST**, approximately **62 hours 52 minutes** later. This is closer to 2.6 days than four full days. The deadline is an external fact; the implementation estimates below are judgments. [Official schedule](https://ethnohack2026.devpost.com/).

Potential savings are concentrated in infrastructure and UI mechanics, not data curation or scientific validation. Budget the revised five phases at approximately 32 focused implementation hours plus 4–6 curator-hours and recovery time. Do not advertise a measured speedup; dependency integration may consume the apparent saving.

Required additions are limited to material-version comparison and bibliographic exports, because they reuse already required data and logic. Admit the optional page viewer only after all mandatory functionality and verification gates pass, rights-cleared assets are ready, at least 12 hours remain before the deadline, a six-hour final recovery buffer remains protected, and the extension is bounded to two implementation hours plus its tests. Otherwise leave it out of the UI. Do not add new languages, RAG services, embeddings, clinical features or a larger corpus merely because source code can be cloned.

**Phase 1 can start from the updated plan immediately when implementation begins. No further ideation round or complete-product fork search is required.** Its first actions are source preflight and the bounded dependency/startup spike, followed by the actual build. This audit itself has not started that build.
