# Data dictionary · recon-v1

The executable source is `packages/contracts/src/index.ts`, re-exporting `base.ts` and `curation.ts`.  All object schemas are strict. IDs are bounded ASCII identifiers, URLs are HTTP(S), hashes are lowercase 64-character SHA-256. Dates refer to the edition/retrieval/review described by the field; a modern edition date is not an ancient composition date.

| Record | Key fields and invariants |
| --- | --- |
| Source | ID, title, creators, work, edition, translator or null, language, separate publication/composition descriptions, real external identifiers and canonical URL |
| SourceRevision | Source ID + integer revision; retained raw file/URL/hash; immutable display text + separate UTF-8 text hash; parser/version, editorial transformations, rights, locator and content hash |
| Rights | Decision `bundle_allowed`, `metadata_only`, `blocked` or `pending`; exact license URI/credit; independent storage/display/redistribution flags; restrictions and hashed permission evidence |
| Span | Exact half-open UTF-16 `[start,end)` into one stored revision; exact quote, prefix/suffix, source text hash and page/chapter/XML/canvas locator. No later text normalization is allowed |
| Assertion | ID, field, label, origin, references, input IDs, review and discriminated state. `recorded`/`inferred` carry values; `contested` preserves competing IDs; `unknown` carries a bounded reason; `not_applicable` carries rationale |
| Review | Pending/accepted/rejected, reviewer identity, qualification, timestamp and rationale; optional explicit reviewer type. An assistant check never qualifies as independent human acceptance |
| MaterialVersion | Kind/representation, occurrence-scoped ingredient slots, quantities, ordered/partially ordered processing steps and assertion IDs. `recordHash` is a structural integrity digest; semantic fields stay null for frozen Phase 1 records; new Phase 2 saves construct normalized scientific input fingerprints |
| IngredientSlot | Occurrence ID, historical raw-term assertion, language, material kind, candidates, part/state assertions and quantity references. A candidate is not a selected identification |
| QuantityConstraint | Raw wording, provenance assertion, optional numeric value/unit, dimension, mass/volume/count/unknown basis, equality relationships. Unspecified basis is unknown |
| MappingCandidate | One occurrence → a documented proposed name; taxon concept ID may be null; scholarly support and rationale remain separate from modern taxonomic normalization |
| TaxonConcept | Authority/checklist snapshot, original reported name/rank/qualifiers and accepted usage. Phase 2 attaches only actual retained GBIF usages |
| CaseRevision | Case ID + revision, recipe/preparation mention, authentic/synthetic/imported status, pinned source/material/claim/unit IDs, historical use, baseline explicit hypotheses, corpus revision, supersedes link and content hash |
| Study | Real DOI/PMCID/PMID, JATS citation metadata, design, source revisions, shared-source family and honest publication-status check limitation |
| EvidenceUnit | One author-supported tested formulation × assay context; study/material IDs, comparator, endpoint/outcome assertions and exact support locations. It is not an independent paper or a clinical outcome |
| BibliographicRecord | Reviewed bibliographic projection, contributor roles, issued/edition details, identifiers and source revision; formatted references do not establish support |
| InterpretationGroup | Bounded mutually exclusive alternatives and scope/completeness/review limitations; not populated with unreviewed hypothetical worlds in Phase 1 |
| ScenarioInput / Scenario | Occurrence-scoped candidate assignments, separately labeled hypothetical overrides, rationale, pinned case revision and hash; no default historical identity is silently selected |
| ComparisonPolicy / Result | Versioned critical/contextual dimensions; dimension findings, source/input dependencies, conservative material verdict, independent context verdict and unchanged reported outcome |
| DependencyGraph / ScenarioDiff | Directed provenance dependencies; changed results/dimensions, recomputed unchanged and unaffected IDs; full-recompute fallback flag |
| RobustnessResult / ClarificationResult | Exact bounded worlds/counts; four conservative statuses; documented-domain limitation; inclusion-minimal sufficient question sets and separately counted missing documentation |
| AnalysisSnapshot / ExportBundle | Pinned scientific inputs/policy/results, source hashes and self-contained replay envelope; rights-filtered omissions are explicit |
| EvaluationManifest | Frozen split/families, reviewer status, baseline names, source-backed expected labels or explicit unknown, and actual run inputs. No benchmark result is seeded |

`agent_curated` extends the originally proposed origin vocabulary so assistant authorship is visible. Origin and review are separate: a later qualified person may check an agent-created assertion without erasing how it was created. Accepted decisions must identify a human reviewer. Changed assertions/materials/sources receive new immutable IDs/revisions; reusing an old ID for different payloads is rejected.

## Hash and position conventions

`rawSha256` covers exact retrieved bytes. `textSha256` covers UTF-8 encoding of the exact display string. Source/case `contentHash` uses RFC 8785 over the validated object excluding its own `contentHash` field. Retrieval and rights metadata therefore belong to revision identity. Material `recordHash` excludes the digest/future fingerprint fields and includes its current record fields. It is not chemical or preparation equivalence. Later scientific hashes use explicit domain-normalized payloads, not arbitrary field stripping.

Plain JSON must have well-formed Unicode, finite numbers, safe integer values, no cycles/accessors/symbols/custom objects/sparse arrays/unsafe keys and bounded depth. Key ordering is supplied by canonicalize; semantically ordered process arrays remain ordered. Scientific unordered sets require explicit Phase 2 normalization. Text is never Unicode-normalized to force a hash match.

Recogito selectors use JavaScript UTF-16 offsets. The owned W3C interchange helpers convert explicitly to/from Unicode code-point positions; do not pass through the upstream serializer's positions as standards-compliant for supplementary characters. Quotes provide a second anchor. Fixtures cover supplementary characters, combining Greek, wynn/thorn, CRLF, repeated phrases and whitespace.

## Current corpus interpretation limits

The eyesalve English passage is complete for the selected recipe paragraph; its original-language panel contains only the opening clause, clearly labeled. Exact Old English transcription and translation alignment await independent specialist review. The 1865 tentative `Allium oleraceum?` gloss and 2020 onion/leek discussion remain distinct proposals; the list is not exhaustive. Oxymel is a **preparation mention**, without a complete recipe inferred from its name.

Four 2018 formulations × two S. aureus strains provide eight numeric MIC records. Two 2020 variants × Newman synthetic wound context provide two records with arm-specific outcomes explicitly pending review. Two 2023 vinegar/MediHoney formulations × two organisms provide four records whose individual outcomes/null-model interpretations remain pending review. That is 14 units from three studies, not 14 independent experiments or evidence of historical clinical efficacy. Structured modern ingredient/process curation is completed during Phases 2–3 before comparison.


## Phase 2 editing records

| Record | Key fields and invariants |
| --- | --- |
| Actor | Declared local name/qualification and `draft` or `source_checked` mode. Default is draft. An explicit source check applies only to changed assertions, never the entire corpus or historical identity |
| ImportTextRequest | UUID request key, exact Unicode passage ≤50,000 UTF-16 units, title, language, edition, author/credit and rights basis. Stored as `user_text`; rights stay pending with redistribution false regardless of declared license |
| ExtractionRun | Immutable run ID, base case revision, source ID/hash, extractor+lexicon version, language, coverage/terms, exact-span proposals and committed decisions. Unsupported language/context is an explicit capability result |
| ProposalDecision | Proposal ID, use/reject, optional controlled value and rationale. Accept means include in the saved draft; it is not automatically a human accepted assertion. Edits differing from extraction are inferred |
| ManualAnnotation | Exact source hash, UTF-16 bounds and literal quote, kind/value/target and rationale. Invalid/surrogate-splitting positions are rejected; changed interpretations are labeled inferred |
| RevisionRequest | Expected base revision, decisions/manual/part/state/candidate/order/quantity edits, explicit occurrence assignments and rationale. Stale writes return 409 and commit nothing |
| Corpus history | Optional prior corpus IDs/hashes; immutable case `supersedes` is `caseId.rN`. Snapshot history proves structural provenance, not scientific acceptance |
| TaxonomyResponse | Query, fixed dataset, snapshot/date/raw provenance, exact/fuzzy/higher-rank diagnostics, alternatives, accepted usage/rank, selectable flags, live/cache/bundled/unavailable and stale indicators |
| TaxonConcept extension | Optional `supportingSourceRevisionIds` retains match and accepted-name JSON separately. Original scientific authors, reported/accepted names, ranks and qualifiers survive normalization |
| Audit event | Actor, action, source/run/base/new revision, changed assertion IDs, assumptions and timestamp. Decisions and revision content remain immutable |
| Scientific input fingerprint | `material-fingerprint-v1`, accepted human fields and explicit identity assignments, ingredient multiset/process DAG, normalized quantities and typed unknowns. No chemical/therapeutic equivalence is inferred |

A source-backed candidate can be documented, inferred or unresolved. At least one historical/scholarly source must support it; a taxonomy response alone is insufficient. Adding one does not select it. The editor can mark an unreported part/state unknown without a fabricated value. Not-applicable part/state is refused for plant material. Known metric unit dimensions must match the declared basis. Unsupported historical units never acquire a conversion factor. Process edits are explicitly inferred ordering constraints and cycles are rejected. Frozen Phase 1 material semantic fingerprints remain null until a new revision is saved.


## Phase 3 records

`EvaluateRequest` contains a pinned case revision, `material-audit-v1`, explicit `ScenarioInput` and 1–50 unique evidence unit IDs. Assignments must belong to the selected material's occurrence/candidate pair. Hypothetical field overrides are refused until Phase 4. `Evaluation` returns all dimensions, context, preserved outcome IDs, policy/input/result hashes, source references and rights-filtered source records/assertions/spans.

A `LiteratureItem` retains source+ID, title, supplied author string, year, DOI, PMCID or null, license or null, OA flag, publication types and `not_retrieved` full-text status. `LiteratureSearch` records the literal query/cursor, next cursor, raw snapshot identity, retrieval date, ready/unavailable and stale states. A saved `PendingStudy` is metadata-only and review-pending, with provider raw provenance. A separately retained `PendingFullText` receipt includes explicit article license, URL, raw SHA-256, retrieval time and licensed paragraph text, or a metadata-only reason. It does not alter the pending metadata's claim status or create evidence units. Preprints and published papers retain separate provider identities and are not merged by matching titles.


## Phase 4 records

`PinnedContext` records case revision/hash, corpus revision, policy hash and explicit latest/pinned selection. `BoundedScenario` is the existing occurrence assignment shape with at most 50 choices and 20 unique assertion-ID overrides, each with an explicit rationale. Override values are typed at validation: part/state/contact/matrix text or bounded numeric duration/temperature/quantity values. A virtual fork retains original assertion IDs as input provenance, inferred/pending hypothesis claims and unchanged original sources/materials.

`InterpretationDomain` exposes source-backed documented proposals separately from reviewed eligibility. Candidate lists are explicitly non-exhaustive. `AuditRequest` declares up to four selected groups/four alternatives, optional forbidden combinations with rationale, subset rationale, 1–50 distinct units and a strict verdict, named strict dimension or conditional reported-name target. `DomainPreview` records raw/admissible counts. `ScenarioAuditResponse` retains every world, strict robustness counts, separate conditional correspondence, study any-arm versus fixed-arm quantifiers, exact sufficient sets and missing-documentation dependencies. Empty-set invariance is a valid result.

`ScenarioRecord` is an immutable named notebook revision with context, scenario/scientific/content hashes, timestamp and draft attribution. `DiffResponse` separates changed/recomputed-unchanged/unaffected strict results and conditional correspondence changes; it retains all dimension/source dependencies and whether full recomputation was used. Editorial rationale does not change scientific input hashes.

`MaterialVersionComparisonRequest` independently pins each side's material and associated historical case/assumptions. `MaterialComparison` is material-only, with all dimensions and separate side proof IDs; it never inherits assay-context or outcome claims. `AnalysisRecord` contains kind, deterministic run hash, immutable payload, exact frozen inputs/policy/relevant original records, context and timestamp/content hash. `AnalysisList` omits both large inputs and payloads. API timing is excluded from scientific hashes/frozen payloads. Portable bundles/exports and independent replay remain Phase 5.


## Phase 5 records

`DossierBundleV1` uses schema `recon-dossier-v1`, engine `recon-replay-1.0.0`, exact frozen request/policy/scoped corpus, bounded derived reported-name facts, computed scientific projection, original analysis identity, source rights manifest, explicit limitations and three distinct hashes. Each source declares whether original text is included, why, and its original text/revision hashes. Included originals are hash/quote checked; omitted originals retain no exact selector text and are not independently text-verified. This is decision replay over supplied facts, not authenticated provenance or scientific truth.

`ReplayReceipt` states reproduced scientific hashes, engine and included/omitted original counts. `ImportBundlePreview` reports the real graph size, omissions and replay result before persistence. `BundleImportRecord` provides a separate immutable namespace and exact-file deduplication. Original IDs remain unchanged inside that namespace. An editable copy receives new local IDs and pending review, preserving the original imported bundle.

`EvaluationArtifact` holds the procedural manifest, original input/label hashes, runtime/policy/corpus details, executed predictions, actual failures/timings, metrics and content hash. The authentic panel is 34 correlated rows from 14 units/three studies/two historical families, with zero independent labels; accuracy/false-acceptance/recall/F1 are null. Forty synthetic aggregation sentinels and twelve source windows remain separately labeled. Exact extraction anchors refer to the complete original revision and absolute UTF-16 coordinates. No hidden-model, unseen-label, empirical superiority or researcher usability claim is made.
