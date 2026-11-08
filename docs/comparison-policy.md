# Comparison policy contract · material-audit-v1

The Phase 3 engine and verdict API implement this conservative policy. Exact scientific requirements and reason-code definitions remain in `IMPLEMENTATION_PLAN.md` §§5.1–5.4. A future implementation must satisfy those gates, not infer a verdict from matching IDs/hashes.

Evaluate identity, composition, part/state, preparation, processing order, contact material, maturation/thermal processing, quantities and characterization independently. Per dimension: match, mismatch, unknown or policy-justified not applicable. Every finding cites assertions, hypotheses and source locations; evaluate all dimensions even after a mismatch. Unknown never equals unknown as a positive match.

Aggregate critical mismatches first → `materially_incompatible`; otherwise unresolved critical information → `insufficient_information`; otherwise contextual differences/missing characterization → `partial_match`; otherwise → `comparable_on_recorded_dimensions`. The last state is strict acceptance on the recorded dimensions, not chemical identity or efficacy. Full mixtures, fractions, isolated compounds and distinct extraction methods cannot be silently interchanged. Equal mass and equal volume are not equivalent. Historical temperatures, measures and taxa stay unknown when not recorded.

Context comparison is independent of material comparison. Organism/strain/model/endpoint/setting/exposure and historical indication/route must remain visible. A broth MIC or topical synthetic wound biofilm assay is not evidence of clinical effectiveness for a historical eye/respiratory use. Reported study outcomes cannot change when a researcher changes a historical interpretation.

The later robust audit enumerates at most four reviewed groups × four alternatives with at most 64 admissible worlds and 50 units. Never silently sample. Show documented-domain limits, exact counts, fixed-arm vs study-level quantifiers and conservative statuses. Clarification returns inclusion-minimal sufficient sets, with minimum cardinality labeled separately. Dependency recomputation is checked against full recomputation. No therapeutic support score, invented probability or prefilled benchmark performance is allowed.

Release evaluation must compare taxon-only, preparation-blind and all-abstain baselines with the full policy on independently checked/frozen examples. Split by source/case family and show denominators and errors. Synthetic metamorphic tests verify invariants; they do not substitute for empirical accuracy. Pending labels/outcomes cannot be used as gold or treated as negative results.


Phase 3 implementation: `packages/core/src/compare.ts` exports the pure comparator, aggregate precedence, explicit recorded-context comparison and policy/hash. Prose methods summaries are not normalized process models. Exhaustive composition comparisons require an explicitly complete reviewed composition record. Process order requires reviewed order assertions and compares a dependency DAG independent of record IDs. Parts/states stay attached to recorded occurrences. Quantities require known commensurate bases; pending claims, unsupported schemas and incomplete dimensions abstain. Context alignment, where explicitly recorded on both sides, still does not establish clinical transfer. The default corpus remains draft and therefore yields insufficient-information results. This is expected, not a measured all-abstain benchmark victory.


## Phase 4 policy 1.1.0

Current hash: `b3fe1d70264efac3df1c383abd3c128508368b8dfad24ba4e87b411c103bef61`. Independent left/right identity assumptions use the same authority/accepted-usage identity key and reject broad-rank equivalence. Explicit virtual field hypotheses are conditional inputs; the strict route does not accept them and documented-domain robustness excludes them. Quantities require supported commensurate units; matching unsupported historical-unit strings do not establish equality.

Conditional reported-name correspondence is a separate, source-linked descriptive projection, not a strict identity dimension. It uses the explicit vernacular/Latin link and actual arm composition; it does not invent a synonym relation or reuse a paper-wide plant list as arm composition. The onion/leek paired-arm example changes this vector while all original strict findings remain unknown. The target must be named when reading clarification sets. Counts and study coverage are explicitly scoped to the selected domain and evidence units. Draft exploration cannot claim reviewed-domain robustness.

Core and server both validate bounds, duplicates and reviewed/hypothetical eligibility. Exact enumeration rejects empty/over-limit domains. The full-recompute fallback is reported honestly; no unmeasured incremental speedup is claimed. Frozen analyses retain exact policy definitions and inputs. See the Phase 4 handoff for measured software gates; independent scientific review remains pending.
