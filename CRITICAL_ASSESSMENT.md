# Aletheia RECON: critical assessment and direction decision

Research checked on 5 November 2026. This is a product and scientific assessment, not evidence that an application, dataset, or benchmark has been implemented. Read with `IMPLEMENTATION_PLAN.md`.

## Decision

**Retain Aletheia RECON, but make the product an evidence-transfer audit workbench.** Keep historical recipe forensics and assumption editing. Add an exact, bounded audit across the documented interpretations of a preparation, with evidence at the level of study materials, experimental contexts, and results. Its principal output should be a reproducible account of **which comparisons survive, which depend on an interpretation, and which cannot yet be judged**.

The original direction is stronger than another medicinal-plant search engine, extraction dashboard, general research assistant, or compound-prediction tool. However, the initial novelty argument is too broad. Rich material descriptions, botanical disambiguation, provenance graphs, and cited extraction already exist. The defensible contribution is their integration into a working, testable audit of evidence transfer under explicit uncertainty. The literature search supports this as a promising engineering and research direction; it does not establish worldwide priority or validated researcher demand.

No software implementation is authorized by this document. No benchmark results have been generated.

**Repository-reuse follow-up:** [REPOSITORY_REUSE_AUDIT.md](REPOSITORY_REUSE_AUDIT.md) records the later code/license review and the corresponding plan revision. The selected approach combines an official Fastify SPA starting point with source annotation, serialization/import and bibliography components; it keeps the scientific evaluator original. This supports direct material-version comparison and bibliographic exports without changing the direction decision. No complete-product fork was judged a better foundation among the inspected candidates, and no installation or runtime speedup has yet been demonstrated.

## Event fit and available time

The official event describes Track 1 as extracting medicinal knowledge from historical, folklore, and ethnobotanical sources, mapping names across time, and connecting these records with modern pharmacology. A source-grounded extraction and comparison instrument fits that objective. The published criteria cover scientific relevance, innovation, implementation, data science, feasibility, impact, and presentation. The live Devpost connector reports a five-point judging scale; no criterion weights were supplied. Do not invent weights. [Official event](https://ethnohack2026.devpost.com/), [official rules](https://ethnohack2026.devpost.com/rules).

The connector returned `submissions_end_at = 2026-11-08T09:00:00Z`, matching the site's 11:00 EET banner: **8 November 2026, 14:30 IST**. At the 5 November 2026 23:03 IST research snapshot, approximately **63 hours 27 minutes** remained. The rules' general CET wording is less specific than this timestamp. Plan against the timestamp and recheck it before development. This assessment does not perform registration or other competition administration. [Official schedule](https://ethnohack2026.devpost.com/).

Technical implications: complete one integrated research workflow, retain installation and reproducibility records, use licensed material, and disclose uncertainty. The published rules specifically address traditional-knowledge provenance and unvalidated medical claims. Administrative and presentation deliverables are outside this assignment. [Official rules](https://ethnohack2026.devpost.com/rules).

## What the judges' documented work suggests

The official page lists the following five judges. The implications below are **our inference from public research interests**, not knowledge of their private preferences or a prediction of their scores. [Panel listing](https://ethnohack2026.devpost.com/).

| Judge | Publicly documented interests or work | Product implication |
| --- | --- | --- |
| Nektarios Aligiannis | Mediterranean phytochemistry, extraction technologies, chemical profiling, biological evaluation, ethnopharmacognosy. [University profile](https://en.pharm.uoa.gr/people/faculty/pharmacognosy_chemistry_of_natural_products/alligianis_nektarios/) | Species names alone are insufficient. Show plant parts, extraction and processing differences, and missing chemical characterization. |
| Petros Bouras-Vallianatos | Premodern medicine and pharmacology, medical lexicography, editions and translations, and cross-cultural transmission. [University profile](https://en.phs.uoa.gr/staff/petros_bouras_vallianatos), [Arabic-to-Greek project](https://en.phs.uoa.gr/research/research_projects) | Preserve source witnesses and translation attribution. A modern disease label must not silently replace a historical indication. |
| Dimitrios Gunopulos | Data mining, knowledge discovery, databases, indexing and algorithms. [University profile](https://www.di.uoa.gr/en/staff/46) | A precise decision model, baseline comparison, dependency correctness and reproducibility offer a substantive computational contribution. |
| Antigoni Cheilari | Coauthorship of EthnoBot and ethnopharmacological research concerning skin ailments; chemical profiling work is also publicly documented. [EthnoBot paper](https://ceur-ws.org/Vol-4293/paper25.pdf), [Mount Pelion study](https://doi.org/10.3389/fphar.2023.1225580), [university research poster list](https://jupiter.chem.uoa.gr/acac2024/posters.html) | Complement existing collection and name-resolution tools with a preparation-sensitive audit. Do not imply endorsement. |
| Mehmet Can Ay | Biomedical knowledge bases, graph mining, language models for semantic harmonization, and PDataViewer. [Fraunhofer team](https://www.scai.fraunhofer.de/en/business-research-areas/bioinformatics/fields-of-research/bioinformatics/Software-Scientific-Computing/team.html), [PDataViewer account](https://www.scai.fraunhofer.de/en/business-research-areas/bioinformatics/students-blog/21-11-2024.html) | Make harmonization assumptions visible and inspectable, with persistent references and clear source-to-result paths. |

These interests support the problem choice. They do not justify choosing a Greek case without a reliable edition, licensed translation and competent review.

## International landscape: what is already solved

| Region / resource | Evidence reviewed | Consequence for RECON |
| --- | --- | --- |
| China: ShennongAlpha / ShennongName | The 2025 Cell Discovery paper describes material knowledge curation and translation. The Apache-2.0 ShennongName implementation explicitly models species origins, medicinal parts and processing, including alternative species. [Paper](https://doi.org/10.1038/s41421-025-00776-2), [repository](https://github.com/shennong-program/shennongname), [current API](https://shennongalpha.westlake.edu.cn/en-zh/docs/api) | A species–part–processing fingerprint is established prior art. Study its distinctions; do not present them as our invention. We need decision consequences and reproducible audits beyond standardized names. |
| China: TCMM | Integrates TCM and modern biomedical resources in a large knowledge graph and supports prescription generation and discovery. Its repository exposes processing code and directs users to upstream datasets. [Paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC11047297/), [repository](https://github.com/AI-HPC-Research-Team/TCM_knowledge_graph) | Building a larger graph or another formula recommender is a weak differentiation strategy. Code availability does not grant rights to upstream databases. |
| China: HERB 2.0 | The 2025 database integrates clinical and experimental evidence and formula information. [Primary paper record](https://pubmed.ncbi.nlm.nih.gov/39558177/) | Linking herbs, formulas and studies is already a mature capability. Our claims must concern whether a particular material and result can be compared. |
| Japan: Toyama WAKANYAKU, TradMPD, KampoDB | The university portal documents crude drugs, formulas, compounds, analytical/bioassay information, historical resources, and predicted interactions in separate resources. [University portal](https://www.inm.u-toyama.ac.jp/en/database/) | Retain the distinction between an observed assay and a predicted target. Formula names alone are not material identity. Public browsing is not a redistribution license. |
| Japan: formula variants | The Daikenchuto review distinguishes formulations and documented ingredient amounts. [Primary review](https://doi.org/10.1002/tkm2.1321) | Shared formula names do not remove composition and processing differences. A complete international formula-version atlas is too large for this build. |
| Korea: KIOM MHDR | A 2026 paper and repository provide an annotated medicinal-herb–disease corpus with extraction tasks. [Paper](https://doi.org/10.1186/s13326-026-00355-8), [repository](https://github.com/KIOM-AIDoc/MHDR) | Useful annotation precedent, not a historical recipe or material-comparability benchmark. The inspected repository exposed no license statement; do not bundle its contents on that basis. |
| Greece / Germany / European collaborators: EthnoBot | A September 2026 conference paper, published in October, documents structured field collection, LLM-assisted vernacular-name resolution, expert confirmation, RDF and analytics. Its evaluation also reports unreliable self-reported model confidence. [Primary paper](https://ceur-ws.org/Vol-4293/paper25.pdf) | Direct competitive overlap. Do not build a second name resolver or display LLM confidence as botanical probability. Preserve alternative interpretations and audit downstream consequences. |
| ETHCSTWIN: EthnoDB, EthnoBOT, Phytocode | An organizer account describes field collection, ethnobotanical literature mining and plant–compound–bioactivity exploration. EthnoBot has the stronger primary technical documentation above. Public architecture, code and licenses for the other two were not established in this review. [Organizer account](https://gr.linkedin.com/company/ethcstwin) | Describe this as documented overlap, not a hands-on product comparison. No integration dependency on tools whose access contract is unknown. |
| Europe: TheSu / lead-white dataset | Stand-off recipe and argument annotations, segmented texts and reproducible graph views already exist. The repository distinguishes its CC BY-SA annotations from restricted third-party texts. [Repository and rights inventory](https://github.com/chemosymposiast/lead-white_JOHD) | Recipe annotation and provenance visualization are not novel alone. Adopt exact spans and separate rights by artifact. Lead-white chemistry is not the preferred medicinal demonstration. |
| Europe: TaxoNERD | MIT-licensed taxon mention extraction and linking in biodiversity literature. [Repository](https://github.com/nleguillarme/taxonerd) | Recognizing a modern taxon mention is reusable technology; it does not settle the referent of a historical word. No model training is justified for our tiny corpus. |
| India: IMPPAT 3.0 | Released September 2026; the October preprint adds curated formulations and a knowledge graph. The current website carries CC BY-NC-ND terms, whereas the older 2.0 paper describes CC BY-NC data. [Current site](https://cb.imsc.res.in/imppat/), [2026 preprint](https://arxiv.org/abs/2610.07478), [2.0 paper](https://doi.org/10.1021/acsomega.3c00156) | Plant–part–compound and formulation associations are already covered. Rights must be version-specific. Keep this resource out of the required redistributed corpus. |
| General research products: Elicit and Ai2 Asta | Cited extraction tables, literature search and report synthesis are active capabilities. Asta also released AstaBrief in October 2026. [Elicit documentation](https://support.elicit.com/en/articles/14759154-systematic-reviews-in-elicit), [Asta resources](https://allenai.org/asta/resources), [AstaBrief](https://allenai.org/blog/astabrief) | A polished cited answer or extraction table is insufficient differentiation. RECON should be an instrument these tools could feed, with a deterministic audit they do not document in the reviewed material. |

The search included research papers, institutional product descriptions and actual repository documentation. It did not include authenticated hands-on testing of every product. An absence of a feature from these documents is not proof that no competitor implements it.

## Scientific foundations and the strongest recent challenge

ConPhyMP already explains why the biological material and the preparation/chemical characterization matter for interpreting extract research. It is a reporting guideline, not an algorithm certifying equivalence or efficacy. Our schema should be informed by it and expose missing fields; it should not display an invented “ConPhyMP compliant” badge. [2022 consensus guideline](https://discovery.ucl.ac.uk/id/eprint/10156909/).

A particularly relevant September 2026 paper, *The Mulli Hypothesis*, proposes an ethnopharmacological unit joining taxonomy, provenance, plant organ, preparation, traditional use and other determinants. It explicitly presents a falsifiable framework rather than empirical validation. This substantially anticipates the scientific motivation behind a richer recipe/material fingerprint. RECON should acknowledge it and operationalize a limited comparison workflow, without claiming to validate its pharmacological hypotheses. [Primary paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC13585639/).

Exact provenance and dependency tracking also have long-standing foundations. W3C PROV and database provenance research already describe derivation and lineage. Enumerating interpretations is an application of established uncertainty reasoning, not a newly discovered causal method. [PROV-O](https://www.w3.org/TR/prov-o/), [provenance semirings](https://sigmod.org/pods/opentoc/pods2007.html).

Citation evaluation research distinguishes factual correctness from citation quality. A valid source link does not establish that it supports the precise claim. We should separately test span accuracy, assertion support and comparison correctness. [ALCE paper](https://aclanthology.org/2023.emnlp-main.398/).

## Assumptions that need correction

1. **“Counterfactual” can imply causal inference.** We are changing an interpretation in a computational audit. We cannot predict what a historical medicine would have done biologically. Use “interpretation scenario” in the interface.
2. **A paper is not a single experimental object.** One paper can test multiple formulas, species, controls, contexts and endpoints. The atomic comparison must identify the tested material and assay/result. Changing the selected species can change relevant arms without removing the paper.
3. **An accepted scientific name does not authenticate historical material.** Modern synonym normalization and historical identification require separate provenance and statuses. Genus matches, fuzzy matches and model confidence cannot become species identity.
4. **Unknown is not agreement.** Neither an omitted plant part nor an unreported extraction solvent can silently pass a comparison. Shared missing values must not make two fingerprints equivalent.
5. **Material comparability is not evidence of effectiveness.** Keep material decisions, experimental context, reported outcomes and source-quality concerns separate. A negative result remains relevant evidence when materials are comparable.
6. **Differences are not proof of biological incompatibility.** A conservative mismatch under a stated audit policy means evidence cannot be transferred on those terms. It does not establish a change in chemical composition or clinical response.
7. **A compelling interaction need not change the headline verdict.** A species edit can change an identity match while a preparation mismatch remains. Show this honestly instead of manufacturing a dramatic transition.
8. **Research gaps are search-bounded.** “No comparable study found in this corpus/query snapshot” is defensible. “Nobody has studied this” is not.
9. **Originality is not user validation.** Research motivation is credible, but urgent demand for this exact workflow remains untested. Include a small task-based researcher review if participants are available; report their expertise and availability honestly.
10. **Open access is not a universal data license.** A publicly readable article may restrict redistribution, while a paper's figures can have separate rights. The 2015 eyesalve article uses CC BY-NC-SA 3.0, and its manuscript image has a separate permission history. It must not be treated as interchangeable with the later permissively licensed articles. [2015 license and acknowledgements](https://pmc.ncbi.nlm.nih.gov/articles/PMC4542191/).

## A stronger, realizable capability

The enhanced workbench should answer four related questions:

- **Audit:** On which explicitly recorded dimensions is this historical material comparable with this tested material?
- **Sensitivity:** What changes if a documented interpretation is changed, including reasons and relevant result pointers even when the aggregate verdict stays the same?
- **Robustness:** Across every admissible combination of the documented alternatives, which arm-level comparisons remain comparable, become contingent, remain mismatched, or stay undecidable?
- **Clarification:** Which smallest sets of interpretation choices would determine the audit results within that bounded domain? Which missing source fields separately prevent a judgment?

The clarification calculation should use exhaustive comparison of a small finite scenario space. Do not attach invented probabilities, expected information gain, experimental costs or biological discovery scores. Its practical value is helping a curator see whether resolving a difficult word would change the current evidence audit. It cannot determine whether a laboratory experiment is worthwhile.

This is a justified enhancement because it turns uncertainty from a disclaimer into a computable object and makes the next curation action explicit. The claim is testable against a single-interpretation system and a full-recompute oracle. It also permits an informative result where an ambiguity has **no effect** on the retrieved study's coverage.

## Choose the case for its evidence, not its obscurity

**Primary anchor: Bald's eyesalve.** A public-domain Cockayne edition is available through Wellcome. The 2020 study documents the disputed `cropleac` interpretations and tests both onion and leek; the 2018 study supplies explicitly differentiated formulations and experimental methods. These supply authentic ambiguity, processing differences and omission controls. The 2018 record is CC0 and the 2020 article is CC BY 4.0. Verify exact historical page/canvas and every imported arm during Phase 1; this planning exercise has not created those annotations. [Historical edition and rights](https://wellcomecollection.org/works/dq5gv7ch), [2018 study](https://pmc.ncbi.nlm.nih.gov/articles/PMC6261618/), [2020 study](https://www.nature.com/articles/s41598-020-69273-8.pdf).

The interesting contribution is the audit, not rediscovery of the medicine. A formulation studied in a planktonic assay and a formulation studied in a biofilm model should not automatically be declared contradictory. Differences in assay and material must be displayed; they do not by themselves causally explain different observations.

**Second anchor: oxymel as a historical-use and modern-material comparison.** Adams' Hippocratic translation has a public-domain Wellcome edition. The 2023 honey/vinegar study is CC BY 4.0 and distinguishes modern materials and assay contexts. This case should test restrained interpretation: oral historical use cannot inherit support from modern wound-model experiments, and unspecified historical honey/vinegar cannot be identified with modern standardized products. Exact historical locator and material fields remain curation gates. [Historical edition](https://wellcomecollection.org/works/e2gwb7bm), [passage locator aid](https://classics.mit.edu/Hippocrates/acutedis.16.16.html), [2023 study and rights](https://wrap.warwick.ac.uk/id/eprint/176414/).

First1KGreek remains a useful CC BY-SA source prospect, but importing a corpus does not locate a suitable passage or license a separate translation. Graeco-Arabic source access and rights were not established here. Neither is a required dependency. A Byzantine case becomes a later expansion after philological review; unfamiliarity is not evidence of novelty. [First1KGreek](https://github.com/OpenGreekAndLatin/First1KGreek).

## Alternatives considered

| Direction | Scientific opportunity | Why it does not win this build |
| --- | --- | --- |
| Universal multilingual historical extractor / knowledge graph | Larger traditional-knowledge coverage | Crowded prior art; philological annotation, licensing and validation exceed the remaining window. |
| Mixture synergy / activity predictor | Potentially important experimental hypotheses | Requires suitable chemical and assay data, rigorous null models and validation. Ingredient co-occurrence cannot establish synergy. |
| Automated recipe lineage reconstruction | Useful to historians of transmission | Similarity does not prove copying or chronology; sufficiently aligned witnesses and expert validation are not yet available. |
| Full systematic-review assistant | Familiar researcher workflow | Strong general competitors; screening and cited extraction alone lack distinctiveness. |
| Chemical fingerprint / chemotype harmonization | Closer to reproducibility of extracts | Worth pursuing later, but heterogeneous analytical data and batch-level metadata are not secured. A software-only deadline cannot supply missing chemistry. |
| Preparation-sensitive evidence audit with bounded interpretation analysis | Prevents misleading connections and exposes consequential uncertainty | Best combination of relevance, falsifiability, implementability and a coherent user workflow. |

## What a scientific contribution could honestly be

Deliver an openly documented audit schema and rule policy; a small rights-cleared case collection; an exact interpretation and dependency engine; and a reproducible error analysis against lexical, taxonomy-only, conservative-abstention and retrieval-plus-LLM baselines. Separate controlled fixtures from authentic cases. An actual negative or null evaluation result must remain visible.

Do not promise new drugs, validated historical identities, clinical evidence synthesis, novel pharmacological mechanisms, calibrated probabilities, broad multilingual competence, or superiority before measurement. The implementation roadmap defines technical acceptance and an evaluation protocol; it contains no invented benchmark scores.
