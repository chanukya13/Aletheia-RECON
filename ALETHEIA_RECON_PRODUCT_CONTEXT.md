# Aletheia RECON — Product Context & Technical Vision

> **Purpose of this file:** Give a planning agent a complete understanding of the proposed product, the problem it addresses, the scientific standards it must meet, and what a finished working system should do. This is **product context, not a build plan**. The agent must critically review the idea and design its own implementation plan before writing production code.
>
> **Scope:** Software implementation only. Do not create hackathon slides, pitch decks, videos, submission forms, marketing campaigns, or Devpost materials as part of this project.

## 1. The situation

We are creating a serious, original, functioning research product for **EthnoHack 2026**, especially **Track 1: Traditional Knowledge Mining**. The event is concerned with ethnopharmacology, historical medicinal knowledge, natural products, biodiversity, and computational science. The challenge values scientific relevance, novelty, technical implementation, appropriate data science, real-world feasibility, impact, and clear demonstration.

This is a short hackathon build: favor a **small but genuinely working and independently verifiable research instrument** over an impressive-looking but shallow or scientifically unreliable app. The final event submission is scheduled for **November 8, 2026, 2:30 PM India time**; confirm the current remaining development window before planning. Technical implementation is this agent's responsibility. Competition administration is outside this document's scope.

Our objective is not to build a generic AI research chatbot, plant search engine, herb identification app, drug discovery prediction engine, or an attractive dashboard over pre-existing databases. We want a distinctive capability that a working researcher can inspect, challenge, and use.

## 2. Original product concept

**Working name: Aletheia RECON — Historical Recipe Forensics Engine.**

**Core question:** *When a historical medicinal preparation is associated with a modern scientific study, are the two sources truly discussing sufficiently comparable biological materials and methods—and what evidence connections change if the interpretation of a historical ingredient changes?*

Historical medicinal recipes pass through manuscripts, languages, regions, translations, and adaptations. The same name may describe different plants; different names may refer to the same species; a formula can change in composition, preparation, plant part, proportion, or intended historical use. Modern studies often investigate a particular species, plant part, extract, chemical preparation, dose, or experimental context. A traditional historical claim, an in-vitro assay, an animal study, and a clinical outcome are not equivalent evidence.

Naive retrieval systems can connect records because their words, names, or embeddings look similar, inadvertently suggesting a level of scientific support that does not exist.

**Our product makes those hidden assumptions inspectable, tests evidence compatibility, and recomputes dependent conclusions when an assumption is changed.**

It should support a meaningful end-to-end path:

`Historical source → attributed recipe/ingredient extraction → competing botanical interpretations → recipe/material fingerprint → modern research matching → evidence-compatibility determination → user changes one interpretation → affected relationships re-evaluated → transparent research dossier`

## 3. What makes this potentially distinctive

The most important capability is **counterfactual evidence debugging** at the level of a specific historical preparation, not merely retrieving references or drawing a knowledge graph.

A user should be able to inspect a candidate mapping from a historical ingredient name to a modern plant species and change that assumption to another plausible interpretation. The software then **really recalculates**, using traceable rules and evidence dependencies, which research connections remain comparable, become incompatible, or need further investigation.

That is materially different from an LLM changing its written opinion when the user clicks a selector. The before/after state must be derived from actual modelled facts and explicit rules, tested for correctness.

The opportunity also includes **recipe fingerprints**, **variant-to-variant comparisons**, **historical interpretation uncertainty**, **scientific evidence material compatibility**, and **research-gap identification**.

These are hypotheses, not protected product requirements. The planning agent **must challenge them** and may recommend a stronger, better-scoped or more original variation if there is concrete evidence that it would improve scientific relevance, usability, demonstrability, and build feasibility.

## 4. Who this is for

Primary users:

- Historians of medicine who work with original texts and uncertain translations.
- Ethnobotanists and pharmacognosy researchers identifying historical botanical materials.
- Natural-products researchers investigating which historic preparations might or might not correspond to modern literature.
- Scientific database curators who must avoid collapsing different plant identities, preparations and claims into a misleading single record.

**A successful user job:** A researcher examines an old medicinal recipe, sees what its source actually says, reviews competing ingredient identifications, compares modern literature with the historical material, detects weak or invalid evidence transfers, and exports a defensible research dossier with unresolved questions.

**Not a user job:** Telling patients what herbs to take, making diagnoses, claiming clinical efficacy, recommending doses, or instructing people to prepare and consume historical medicines.

## 5. Essential product experiences

### Experience A — Open a genuine historical case

- Present a real, permission-compatible historical text or recipe with author/work, edition/translation metadata as available, and original source identifier.
- Let the researcher inspect the exact quoted source span, with original language where available and a carefully attributed translation when one is available legitimately.
- Extract ingredient names and preparation descriptions as **candidates**, preserving their original wording and uncertainty.
- Distinguish curated source content from a synthetic demonstration. A synthetic case must be prominently identified as synthetic everywhere, including exports.

### Experience B — Inspect the recipe fingerprint

For each ingredient/recipe, show evidence-backed fields where known:

- Historical ingredient term, original language and source span.
- Candidate modern taxon, synonym, accepted scientific name and identifier.
- Whether the mapping is verified, contested, inferred or unresolved.
- Plant part and processing/extraction/preparation form.
- Other ingredients, proportions/quantities when explicit, recipe version and lineage information.
- Claimed historical use as a **historical claim**, not a clinical fact.
- Provenance and interpretation status for every significant assertion.

**Unknown is an acceptable, important answer.** Never silently invent details the document does not contain.

### Experience C — Compare with modern scientific evidence

- Locate studies through reliable, legally usable scientific sources.
- Identify what the study *actually tested*: plant identity, part, formulation, extraction, experimental setting, endpoint/outcome, and stated limitations when reported.
- Produce a typed classification such as `comparable_on_recorded_dimensions`, `partial_match`, `materially_incompatible`, or `insufficient_information`.
- Give a checkable, cited explanation for each decision. Material comparability does **not** imply therapeutic effectiveness.
- Never promote traditional use or an in-vitro result into evidence of clinical benefit.
- Allow the user to inspect the real paper/citation/source and the fields used in the decision.

### Experience D — Run a counterfactual

- Select a disputed historical term or identification with two or more plausible alternatives, or explicitly edit a recorded assumption for research purposes.
- Recompute all downstream evidence relationships whose validity depends on that assumption.
- Explain which link changed and **why**, and show which relationships were unaffected.
- Produce a before/after comparison and a specific research question that, if answered by experts, could help resolve the issue.
- This must be backed by functioning state updates and logic, **not hardcoded visual transitions**.

### Experience E — Inspect and export the research dossier

- Show the complete chain of claims, original evidence, modern references, uncertainty and dependency links.
- Provide a reproducible, readable output (for example, an HTML view and structured JSON; optional printable export if time allows).
- State limitations, unresolved identifications and data source/usage attribution.
- Preserve the difference between curated examples, model-inferred associations, retrieved evidence, and test fixtures.

## 6. Scientific and technical integrity: non-negotiable

1. **Provenance first.** Scientific and historical assertions must link back to real sources and specific spans or fields wherever possible.
2. **Separate identity and similarity.** Semantic similarity, synonyms and translations do not automatically establish taxonomic or material equivalence.
3. **Preserve uncertainty.** Support uncertain, disputed, unknown and insufficiently documented states; avoid forced binary classifications.
4. **Typed, testable decisions.** Prefer an explicit compatibility decision model and transparent logic over opaque prose generation.
5. **Reproducible results.** A researcher or judge must be able to rerun the core analysis from permitted data and documented code.
6. **Real before/after behavior.** Counterfactual edits must trigger dependency-sensitive recalculation, not simulated UI changes.
7. **No invented research.** No fabricated quotations, study outcomes, links, references, quantitative findings, or benchmark scores.
8. **No unvalidated healthcare claims.** The product is a research aid, not a medical device or a treatment recommendation tool.
9. **Respect source licenses.** Keep source attribution, verify API terms, and avoid redistributing restricted or incompatible corpora.
10. **Safe failures.** Handle missing sources, parsing errors, contradictory evidence and unreliable API responses clearly instead of masking them.

## 7. Research starting points (verify before use)

These are **candidate sources**, not an instruction to ingest all of them. Availability, license, factual relevance and permission to redistribute must be independently verified.

- First1KGreek / Open Greek and Latin: https://github.com/OpenGreekAndLatin/First1KGreek — machine-readable ancient Greek texts; locate genuinely relevant recipe passages.
- Graeco-Arabic Studies: https://www.graeco-arabic-studies.org/texts — scholarly resources relevant to ancient medical transmission; verify access and rights.
- GBIF taxonomy: https://techdocs.gbif.org/en/openapi/v1/species — taxon and synonym information.
- Kew Medicinal Plant Names Services: https://www.kew.org/science/our-science/science-services/medicinal-plant-names-services — medicinal botanical naming reference; check access terms.
- Europe PMC: https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=medicinal%20plants — article metadata and permitted full text.
- KIOM MHDR: https://github.com/KIOM-AIDoc/MHDR — herb/disease extraction benchmark, **not** a historical-recipe gold standard.
- Historical recipe annotation precedent: https://github.com/chemosymposiast/lead-white_JOHD — possible inspiration for structured historical records; verify scope.
- IMPPAT: https://cb.imsc.res.in/imppat/ — potentially relevant Indian medicinal-plant data; check restrictive reuse licenses; do not mirror non-redistributable datasets into the project.

Non-English work worth investigating for ideas, not copying blindly:

- Chinese traditional-herbal knowledge graphs: preserving preparation, ingredients, species and text variants.
- Japanese Kampo corpus research: formula versions and ingredient/proportion differences under shared historical names.
- Korean medicinal-herb relationship extraction: structured evaluations and annotation standards.
- Greek/Byzantine/Arabic historical-medical scholarship: translation, transmission and taxonomic ambiguity.

Also examine ETHCSTWIN's publicly described **EthnoDB, EthnoBOT and Phytocode** before asserting novelty. Aletheia RECON should complement, not duplicate, existing historical extraction or plant–compound exploration.

## 8. What counts as a strong finished software product

The system should feel cohesive and production-minded even if its scientific corpus is deliberately small:

- A polished, fast, understandable interface, with exceptional information hierarchy and states; aim for the care and simplicity of a first-rate Apple product without copying Apple's branding.
- A functioning end-to-end research workflow, not isolated feature demos.
- Real curated cases and honest disclosure of data provenance and coverage.
- Meaningful compare-and-debug interactions that update the displayed evidence relationships correctly.
- Clear treatment of loading, empty, unsupported, error and uncertain states.
- Backend/frontend contracts that are consistent and typed where appropriate.
- Deterministic tests for scientific logic and all irreversible or important transformations.
- Real browser verification of the full user journey, including interaction, responsiveness, console/network issues and visual coherence.
- Straightforward local startup and reproducible installation instructions.
- No dummy buttons, fake research statistics, dead links, unfinished flows presented as complete, or polished mock screens that do not operate.

## 9. Evaluation requirements

Before judging performance, create a small, legally usable, human-inspected ground-truth test set. Separate real authentic cases from synthetic adversarial cases, and disclose the counts.

Compare a sensible baseline (e.g., ordinary retrieval + language-model reasoning) against the enhanced system on the **same input data and cases**. Candidate evaluation dimensions:

- Accuracy/coverage of historical ingredient and preparation extraction.
- Botanical synonym/identity mapping quality and uncertainty handling.
- False acceptance of incompatible scientific evidence connections.
- Correct abstention when species or material information is insufficient.
- Dependency propagation correctness when an assumption changes.
- Citation and source-span attribution accuracy.
- Usability and response time for the core research workflow.

Measure real numbers, retain the test scripts/results, identify failure cases and avoid overstating small-sample findings. Synthetic negative cases can strengthen regression coverage but must not be marketed as independent proof of real-world scientific accuracy.

## 10. Opportunity for improvement — this is intentionally open

The planning agent should first challenge whether recipe-level counterfactual evidence forensics is the **best** strategy for this specific scientific challenge. It should consider replacing or enhancing the concept if doing so creates a substantially stronger researcher outcome, higher scientific novelty, better feasibility, or a more persuasive verifiable demonstration.

Examples of questions to investigate:

- Is a counterfactual evidence debugger an urgent and underserved researcher workflow, or would a different narrow research instrument be more valuable?
- What is already possible through existing historical-knowledge graphs, ethnopharmacology platforms and scholarly tools?
- Can a particular corpus, language pair or historically consequential source provide a much stronger demonstration than generic examples?
- Can the software find and explain *research-changing* interpretation conflicts rather than merely detect mismatched metadata?
- How can we demonstrate a useful finding that survives scrutiny from a historian, a pharmacognosist and a computer scientist?
- Which advanced AI techniques actually improve the measured system, and which are unnecessary overhead for this deadline?

**Be willing to reject the initial idea if a better one is justified; be equally willing to keep it if no rival clearly wins.** The build must remain within EthnoHack's subject and scientific-ethics constraints.

## 11. Project boundaries

This context file does not select a programming stack, freeze a feature backlog, prescribe the exact development phases, direct model selection, or authorize premature implementation. Those belong in a separate, carefully reviewed architecture and build plan.

**Included:** software, sourcing/integration, data models, UI/UX, scientific rules, testing, automated browser validation, documentation necessary to run and verify the product.

**Excluded:** pitch deck, slides, promotional materials, video script, judging outreach, competition registration, Devpost submission, and unrelated business strategy.

**Ultimate standard:** A scientifically defensible product that can show a real historical source, inspect its ambiguity, match modern evidence responsibly, and visibly demonstrate the consequences of a changed assumption—unless a deeper review reveals a demonstrably better direction.
