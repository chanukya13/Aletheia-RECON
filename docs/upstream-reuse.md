# Upstream reuse actually adopted

See `REPOSITORY_REUSE_AUDIT.md` for the broader selection and per-phase instructions. Source research stays under ignored `research/upstream`; the product has one owned workspace. No whole application was combined with another starter, and no Python service/algorithm was ported.

| ID | Installed/adapted unit | Boundary and verified provenance |
| --- | --- | --- |
| R1 | `@fastify/vite@10.0.0`, Fastify `5.12.8`; sparse official example | Checked out `fastify/fastify-vite` commit `127d70319fb2668cf5b59e339e08e2dd95bffd08`. Adapted `e2e/react-vanilla-spa-ts/src/server.ts`, Vite config and React mount into owned files. Removed workspace/catalog/pnpm and POSIX-only assumptions. MIT notice retained in `licenses/fastify-vite-MIT.txt`. Runtime tarball integrity is recorded separately; registry metadata did not expose its gitHead |
| R2 | `@recogito/text-annotator@4.3.7` only | Published gitHead matches reviewed `0d375b0cba2bf68378f1f6dff30ee8812df95c0c`. Owned adapter handles exact text, Unicode, highlighting, temporary selection and destroy. No React/TEI/CETEI/PDF wrapper. Its resolved core is `@annotorious/core@3.9.5`, gitHead `f780879410ff4f2d4fd0b2cb1ae1bd596a40fe65`, not the older minimum range. Both BSD-3-Clause license texts were verified against pinned GitHub files; identical license blob `837e1fa53f9f776d50886e0c6796d55fc8d7a546` |
| R3 | `canonicalize@5.1.0` | Published gitHead matches `31fb117afde3ef305b2e1d99bde539bf6300bc62`; Apache-2.0. Used only after owned plain-JSON/domain validation; SHA-256 and scientific payload selection are ours |
| R4 | `jsonc-parser@3.3.1` | Stable reviewed source `3c9b4203d663061d87d4d34dd0004690aef94db5`; MIT. Owned strict boundary rejects recovery/errors, duplicate decoded keys, unsafe keys/comments/trailing commas/depth/size/Unicode problems. Published registry has integrity but no gitHead |

Exact package integrities and available registry source metadata are saved in `docs/registry`; every resolved version, license expression, installed status and integrity is in `docs/dependency-inventory.json` and `package-lock.json`. An exploratory metadata record for core 3.8.10 is retained as such; it is not the installed core. All actual runtime/test evidence is recorded in the Phase 1 handoff, not inferred from READMEs or skipped upstream tests.

Initial advisory checks required changing React Router to 7.18.5, Vitest to 4.1.12, xmldom to 0.8.15 and TypeScript ESLint to 8.72.1. A scoped `@typescript-eslint/typescript-estree → minimatch@11.0.4` override addresses its outstanding glob-amplification advisory; lint/type checks exercise compatibility. ESLint 9.39.1 is deprecated upstream but has no reported advisory in the final resolved audit. Playwright 1.64.0 has a complete published cohort and matches the available Chromium revision 1248; the latest test-package tag referenced an unavailable core during setup and was rejected.

R1 and R2 compatibility checks use the real packages and production app. The independent R2 IIFE fixture must define `process.env.NODE_ENV` at bundle time, matching the app build; otherwise a library-mode bundle references a nonexistent browser `process`. This was a test-bundle configuration issue, not permission to add a browser process shim. Both renderers, actual mouse selection, keyboard selection inspection, repeated cleanup, Unicode, adjacent and overlapping highlights are checked.

R5 remains Phase 3/5 acquisition: only `@citation-js/core`, bibtex and ris 0.9.0, after registry/license verification; no citeproc/csl plugin. R6 is still optional Phase 5 OpenSeadragon under the plan's time/rights gates. Neither is installed or represented by a fake control in Phase 1.


## Phase 2 reuse

No new package or whole repository was needed. The installed R2 core/owned adapter now powers saved manual annotation with an exact-quote keyboard fallback; R1 serves the editor and write routes; R3/R4 continue to enforce canonical/strict data boundaries. The extraction grammar, material fingerprint, revision service and small GBIF HTTP adapter are original TypeScript. No Python service was ported and no unlicensed external corpus was copied. `data/taxonomy/manifest.json` records the seven authentic GBIF response/metadata files, actual retrieval dates, URLs, hashes and CC BY 4.0 attribution. R5/R6 remain later-phase decisions.


## Phase 3 adoption

R5's exact `@citation-js/core`, `@citation-js/plugin-bibtex`, and `@citation-js/plugin-ris` **0.9.0** cohort is installed server-side. Published packages declare MIT and source `citation-js/citation-js`; core's installed gitHead is `51a37ce28fd3508e5cc2957b7d17794cdbad8ed0`. Lockfile integrities and generated installed notices are authoritative. Eight packages were added, with no advisory reported by installation. No DOI/Wikidata/CSL plugin, citeproc, model service or whole repository was installed. A synchronous controlled-CSL prototype converted the three existing source-backed draft study references to BibTeX and RIS under `artifacts/bibliography`; it never passes an identifier string to a resolver. Original names are literal contributor names, preserving supplied Unicode rather than guessing name segmentation. Bibliographic human review remains pending. [Upstream documentation](https://github.com/citation-js/citation-js/blob/main/README.md).

The Europe PMC adapter is original small TypeScript, with fixed-host REST search, raw snapshots, literal-phrase query construction and bounded responses. [Official REST documentation](https://dev.europepmc.org/RestfulWebService). The installed xmldom parser is reused for licensed article paragraphs; internal DTD/entity declarations are refused and only article-front permissions links authorize CC BY 4.0/CC0 text. Figures, table blocks, supplements and reference lists are excluded. No new Python runtime or application clone was needed.


## Phase 4 reuse

No acquisition, repository clone, new package, Python runtime or model service was required. R1 continues to serve the one-origin SPA/API; R2 supplies existing source highlighting through the owned adapter; R3/R4 provide canonical hashes and strict JSON boundaries. The original typed evaluator is reused for two-sided material versions, virtual hypotheses, diffs and exact audits. The small bounded domain/question solver is original TypeScript, tested against independent exhaustive oracles. R5's existing offline bibliography prototype and conditional R6 viewer remain Phase 5 work. The lockfile dependency cohort is unchanged.


## Phase 5 adoption

R5's existing exact 0.9.0 core/BibTeX/RIS packages now power real dossier reference downloads. Only validated structured metadata enters Cite; no resolver/style/full-text plugin is added. BibTeX config sets `asciiOnly=false` to preserve non-Latin characters and `useIdAsLabel=true` to retain supplied identities. The upstream RIS text serializer folds at 70 characters even inside words, so the owned adapter reuses its `format: object` mapping and writes unwrapped field lines. Actual real-reference title/DOI round trips and a controlled non-Latin/unknown-date fixture verify these adaptations. Role/date/source-specific format losses remain explicit. No upstream package source was patched.

R1 serves the same-origin product/download routes, R2 supplies existing source dialogs, and R3/R4 supply canonical/strict boundaries and replay integrity. The browser initializes Zod interpreter mode rather than enabling unsafe eval. No new package, application clone, Python/model service or runtime was required. Firefox/WebKit engines are test-only workspace artifacts. Optional R6 was not admitted and has no fake product control. Final installed notices/integrities and technical/scientific qualifications remain in the Phase 5 handoff.
