# Phase 1 corpus review packet

**8 November clarification:** this packet preserves the original independent-review procedure. The assistant owns the current [automated source checks](automated-source-audit.md). No reviewer nomination or user approval is required to use the functional product. The pending statuses below accurately retain the original review provenance.

Corpus: `corpus-2026-11-05.1`. **All 102 assertions remain pending independent human review.** An automated source check has not been relabeled as human validation.

The implementation plan requires at least one recorded human check for each release assertion. Two independent named reviewers, including relevant historical/pharmacognostic expertise where possible, are preferred. Record identity, qualification, date, accepted/rejected/contested decision and rationale. Do not bulk-accept without inspecting the source.

Open the local reader at http://127.0.0.1:4317/cases. Each assertion below links to an exact source location when available. Independently verify transcription, locator, claim scope, composition, context and outcome. Permission evidence and original bytes are in data/sources/raw. Draft IDs must remain inspectable: approved corrections require new immutable assertion/material/case revisions and audit events; do not edit old DB payloads.

## Priority checks

- Check Cockayne II printed pp. 34–35 against verified canvases 0084/0085, not the duplicate preface page labels. The Old English panel is only an opening clause; its Unicode transcription and translation correspondence need specialist review.
- Preserve the question mark in the edition’s Allium oleraceum? gloss and the different 2020 onion/leek discussion. These alternatives are not exhaustive and are not automatically identified through modern taxonomy.
- Verify Adams I p. 301, §16. It is a preparation mention with respiratory/drink context. Do not infer a complete honey/vinegar recipe, ratio or modern wound indication from the name.
- Verify all eight 2018 MIC entries against Table 2 and the formulation arms against Table 1. Units are % v/v, medians of at least three biological replicates, not clinical effect sizes.
- Verify 2020 paired-batch assay contexts; six later-source arm outcomes are explicitly not yet curated. Do not assign pooled 2020 results to individual arms, or blanket 2023 synergy across organisms/null models.
- Complete structured modern ingredient/process/strain/outcome review before Phases 2–3 use records for comparison. Three papers and two families do not establish broad scientific validity.

## Source witnesses

- **cockayne-translation.r1** — Leechdoms, Wortcunning, and Starcraft of Early England · Volume II. Book I · chapter ii · printed p. 35. [Source](https://wellcomecollection.org/works/dq5gv7ch); [canvas](https://iiif.wellcomecollection.org/presentation/b21924235_0002/canvases/b21924235_0002_0085.jp2); [license](http://creativecommons.org/publicdomain/mark/1.0/). Display-text SHA-256: `1782c2fd9e46e7d2c3e37ba4e72a61454e0c334ef6b9cc9780d542190a0f2660`.
- **cockayne-original.r1** — Leechdoms, Wortcunning, and Starcraft of Early England · Volume II. Book I · chapter ii · printed p. 34 · opening clause only. [Source](https://wellcomecollection.org/works/dq5gv7ch); [canvas](https://iiif.wellcomecollection.org/presentation/b21924235_0002/canvases/b21924235_0002_0084.jp2); [license](http://creativecommons.org/publicdomain/mark/1.0/). Display-text SHA-256: `5cd715ac76e8f1a3e5e1488a5523a5b668a52ae4a54f08a32b5748969297a66d`.
- **adams-oxymel.r1** — The Genuine Works of Hippocrates · Volume I. On Regimen in Acute Diseases · §16 · printed p. 301. [Source](https://wellcomecollection.org/works/e2gwb7bm); [canvas](https://iiif.wellcomecollection.org/presentation/b33291408_0003/canvases/b33291408_0003_0321.jp2); [license](http://creativecommons.org/publicdomain/mark/1.0/). Display-text SHA-256: `e9e9fc02706f90d95f5b7e259cf53c9e606925f76374aface5f02612e5300490`.
- **fuchs-2018.r1** — Characterization of the antibacterial activity of Bald’s eyesalve against drug resistant Staphylococcus aureus and Pseudomonas aeruginosa. Published article · paragraph/table locators. [Source](https://doi.org/10.1371/journal.pone.0208108); [license](https://creativecommons.org/publicdomain/zero/1.0/). Display-text SHA-256: `3d299f640e6aea1487b8905f65ba03465f431b0e787fbe4f42d800b17dbba7d9`.
- **furner-pardoe-2020.r1** — Anti-biofilm efficacy of a medieval treatment for bacterial infection requires the combination of multiple ingredients. Published article · paragraph/table locators. [Source](https://doi.org/10.1038/s41598-020-69273-8); [license](https://creativecommons.org/licenses/by/4.0/). Display-text SHA-256: `0428c5c2d643b9e16cb564d54766b6377c05232eff97164bd8030d2164a7ba78`.
- **harrison-2023.r1** — Sweet and sour synergy: exploring the antibacterial and antibiofilm activity of acetic acid and vinegar combined with medical-grade honeys. Published article · paragraph/table locators. [Source](https://doi.org/10.1099/mic.0.001351); [license](https://creativecommons.org/licenses/by/4.0/). Display-text SHA-256: `b3b2f4fad2b0a8003136767df439d3be6f9029f0db95fd2ea5011e90b09e3106`.

## Assertion checklist

### a-eyesalve-description

- [ ] Human check: **A recorded multi-ingredient preparation** — `recorded`, field `historical.preparation`.
- Value/reason: "cropleek, garlic, wine and bullocks gall; mixed, matured, strained and stored"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Book I · chapter ii · printed p. 35](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=cockayne-translation.r1&span=span-eyesalve-recipe) · `span-eyesalve-recipe` · UTF-16 [0, 401).
> Work an eye salve for a wen, take cropleek and garlic, of both equal quantities, pound them well together, take wine and bullocks gall, of both equal quantities, mix with the leek, put this then into a brazen vessel, let it stand nine days in the brass vessel, wring out through a cloth and clear it well, put it into a horn, and about night time apply it with a feather to the eye; the best leechdom.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-cropleek-word

- [ ] Human check: **Historical ingredient term** — `recorded`, field `ingredient.term`.
- Value/reason: "cropleek"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Book I · chapter ii · printed p. 35](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=cockayne-translation.r1&span=span-cropleek) · `span-cropleek` · UTF-16 [34, 42).
> cropleek
- Reviewer / qualification / date / decision / rationale: **pending**

### a-cropleac-word

- [ ] Human check: **Old English term (excerpt)** — `recorded`, field `ingredient.originalTerm`.
- Value/reason: "cropleac"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Book I · chapter ii · printed p. 34 · opening clause only](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=cockayne-original.r1&span=span-cropleac-original) · `span-cropleac-original` · UTF-16 [31, 39).
> cropleac
- Reviewer / qualification / date / decision / rationale: **pending**

### a-edition-gloss

- [ ] Human check: **Tentative identification in the 1865 edition** — `recorded`, field `ingredient.editorialGloss`.
- Value/reason: "Allium oleraceum?"
- Rationale: The question mark is part of the edition. This is an editorial proposal, not a confirmed botanical identity.
- [Book I · chapter ii · printed p. 35](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=cockayne-translation.r1&span=span-edition-gloss) · `span-edition-gloss` · UTF-16 [425, 442).
> Allium oleraceum?
- Reviewer / qualification / date / decision / rationale: **pending**

### a-onion-proposal

- [ ] Human check: **Onion interpretation discussed in 2020** — `recorded`, field `identity.alternative`.
- Value/reason: "Allium cepa"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=furner-pardoe-2020.r1&span=span-cropleac-ambiguity) · `span-cropleac-ambiguity` · UTF-16 [5621, 6309).
> The meaning of Old English cropleac, as used in the original remedy, is ambiguous and may refer to a variety of Allium species22,23. Two likely translations are onion (Allium cepa) or leek (Allium porrum). For this reason, multiple batches of the remedy using either Allium species were made in our laboratory between 2014 and 2019. After the 9-day brewing period, the activity of the remedies was tested against mature biofilms of S. aureus Newman in an in vivo-like model of a soft tissue wound. In this assay, 24-h-old biofilms, that have been grown at 37 °C in collagen-based synthetic wounds, are exposed to Bald’s eyesalve or water for 24 h, and surviving bacteria are counted19,24.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-leek-proposal

- [ ] Human check: **Leek interpretation discussed in 2020** — `recorded`, field `identity.alternative`.
- Value/reason: "Allium porrum"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=furner-pardoe-2020.r1&span=span-cropleac-ambiguity) · `span-cropleac-ambiguity` · UTF-16 [5621, 6309).
> The meaning of Old English cropleac, as used in the original remedy, is ambiguous and may refer to a variety of Allium species22,23. Two likely translations are onion (Allium cepa) or leek (Allium porrum). For this reason, multiple batches of the remedy using either Allium species were made in our laboratory between 2014 and 2019. After the 9-day brewing period, the activity of the remedies was tested against mature biofilms of S. aureus Newman in an in vivo-like model of a soft tissue wound. In this assay, 24-h-old biofilms, that have been grown at 37 °C in collagen-based synthetic wounds, are exposed to Bald’s eyesalve or water for 24 h, and surviving bacteria are counted19,24.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-cropleek-identity

- [ ] Human check: **Botanical identity** — `unknown`, field `ingredient.identity`.
- Value/reason: ambiguous
- Rationale: The edition and modern studies offer alternatives. None is silently selected; the alternatives are not exhaustive.
- Source scope: `cockayne-translation.r1` / displayText. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-nine-days

- [ ] Human check: **Recorded maturation** — `recorded`, field `preparation.duration`.
- Value/reason: {"value":9,"unit":"day"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Book I · chapter ii · printed p. 35](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=cockayne-translation.r1&span=span-nine-days) · `span-nine-days` · UTF-16 [217, 259).
> let it stand nine days in the brass vessel
- Reviewer / qualification / date / decision / rationale: **pending**

### a-brass

- [ ] Human check: **Recorded contact vessel** — `recorded`, field `preparation.contact`.
- Value/reason: "brazen / brass vessel"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Book I · chapter ii · printed p. 35](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=cockayne-translation.r1&span=span-nine-days) · `span-nine-days` · UTF-16 [217, 259).
> let it stand nine days in the brass vessel
- Reviewer / qualification / date / decision / rationale: **pending**

### a-historical-temperature

- [ ] Human check: **Historical temperature** — `unknown`, field `preparation.temperature`.
- Value/reason: not_reported
- Rationale: The selected historical passage gives a duration but no temperature.
- Source scope: `cockayne-translation.r1` / displayText. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-eye-use

- [ ] Human check: **Recorded historical application** — `recorded`, field `historical.use`.
- Value/reason: "Application to the eye for a wen (historical wording)"
- Rationale: Historical source claim only; no modern diagnosis or therapeutic validation is inferred.
- [Book I · chapter ii · printed p. 35](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=cockayne-translation.r1&span=span-eye-route) · `span-eye-route` · UTF-16 [347, 381).
> apply it with a feather to the eye
- Reviewer / qualification / date / decision / rationale: **pending**

### a-equal-quantity

- [ ] Human check: **Equal quantities, unknown basis** — `recorded`, field `quantity.relationship`.
- Value/reason: "Both equal quantities (two pairs); mass or volume basis is not specified"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Book I · chapter ii · printed p. 35](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=cockayne-translation.r1&span=span-eyesalve-recipe) · `span-eyesalve-recipe` · UTF-16 [0, 401).
> Work an eye salve for a wen, take cropleek and garlic, of both equal quantities, pound them well together, take wine and bullocks gall, of both equal quantities, mix with the leek, put this then into a brazen vessel, let it stand nine days in the brass vessel, wring out through a cloth and clear it well, put it into a horn, and about night time apply it with a feather to the eye; the best leechdom.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-oxymel-mentioned

- [ ] Human check: **Preparation mention** — `recorded`, field `historical.preparation`.
- Value/reason: "oxymel"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [On Regimen in Acute Diseases · §16 · printed p. 301](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=adams-oxymel.r1&span=span-oxymel-use) · `span-oxymel-use` · UTF-16 [18, 137).
> the drink, called oxymel, often very useful in these complaints, for it promotes expectoration and freedom of breathing
- Reviewer / qualification / date / decision / rationale: **pending**

### a-oxymel-use

- [ ] Human check: **Recorded historical indication and route** — `recorded`, field `historical.use`.
- Value/reason: "A drink discussed for expectoration and freedom of breathing"
- Rationale: Historical claim, not clinical evidence. Modern synthetic wound assays use a different route and context.
- [On Regimen in Acute Diseases · §16 · printed p. 301](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=adams-oxymel.r1&span=span-oxymel-use) · `span-oxymel-use` · UTF-16 [18, 137).
> the drink, called oxymel, often very useful in these complaints, for it promotes expectoration and freedom of breathing
- Reviewer / qualification / date / decision / rationale: **pending**

### a-oxymel-composition

- [ ] Human check: **Exact composition** — `unknown`, field `material.composition`.
- Value/reason: not_reported
- Rationale: The selected §16 excerpt does not give a complete ingredient list or recipe. Honey/vinegar assumptions must not become recorded composition.
- Source scope: `adams-oxymel.r1` / displayText. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-oxymel-ratio

- [ ] Human check: **Ingredient ratio** — `unknown`, field `quantity.ratio`.
- Value/reason: not_reported
- Rationale: No ratio is specified in this excerpt.
- Source scope: `adams-oxymel.r1` / displayText. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-oxymel-processing

- [ ] Human check: **Preparation process** — `unknown`, field `preparation.processing`.
- Value/reason: not_reported
- Rationale: The opening excerpt does not specify a preparation process.
- Source scope: `adams-oxymel.r1` / displayText. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-part-cropleek

- [ ] Human check: **cropleek: part** — `unknown`, field `ingredient.part`.
- Value/reason: not_reported
- Rationale: No sufficiently specific part is recorded for this slot in the selected passage.
- Source scope: `cockayne-translation.r1` / displayText. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-state-cropleek

- [ ] Human check: **cropleek: state** — `unknown`, field `ingredient.state`.
- Value/reason: not_reported
- Rationale: Fresh/dry or precise material state is not explicitly recorded.
- Source scope: `cockayne-translation.r1` / displayText. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-term-garlic

- [ ] Human check: **Recorded ingredient: garlic** — `recorded`, field `ingredient.term`.
- Value/reason: "garlic"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Book I · chapter ii · printed p. 35](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=cockayne-translation.r1&span=span-eyesalve-recipe) · `span-eyesalve-recipe` · UTF-16 [0, 401).
> Work an eye salve for a wen, take cropleek and garlic, of both equal quantities, pound them well together, take wine and bullocks gall, of both equal quantities, mix with the leek, put this then into a brazen vessel, let it stand nine days in the brass vessel, wring out through a cloth and clear it well, put it into a horn, and about night time apply it with a feather to the eye; the best leechdom.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-part-garlic

- [ ] Human check: **garlic: part** — `unknown`, field `ingredient.part`.
- Value/reason: not_reported
- Rationale: No sufficiently specific part is recorded for this slot in the selected passage.
- Source scope: `cockayne-translation.r1` / displayText. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-state-garlic

- [ ] Human check: **garlic: state** — `unknown`, field `ingredient.state`.
- Value/reason: not_reported
- Rationale: Fresh/dry or precise material state is not explicitly recorded.
- Source scope: `cockayne-translation.r1` / displayText. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-term-wine

- [ ] Human check: **Recorded ingredient: wine** — `recorded`, field `ingredient.term`.
- Value/reason: "wine"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Book I · chapter ii · printed p. 35](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=cockayne-translation.r1&span=span-eyesalve-recipe) · `span-eyesalve-recipe` · UTF-16 [0, 401).
> Work an eye salve for a wen, take cropleek and garlic, of both equal quantities, pound them well together, take wine and bullocks gall, of both equal quantities, mix with the leek, put this then into a brazen vessel, let it stand nine days in the brass vessel, wring out through a cloth and clear it well, put it into a horn, and about night time apply it with a feather to the eye; the best leechdom.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-part-wine

- [ ] Human check: **wine: part** — `unknown`, field `ingredient.part`.
- Value/reason: not_reported
- Rationale: No sufficiently specific part is recorded for this slot in the selected passage.
- Source scope: `cockayne-translation.r1` / displayText. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-state-wine

- [ ] Human check: **wine: state** — `unknown`, field `ingredient.state`.
- Value/reason: not_reported
- Rationale: Fresh/dry or precise material state is not explicitly recorded.
- Source scope: `cockayne-translation.r1` / displayText. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-term-bullocks-gall

- [ ] Human check: **Recorded ingredient: bullocks gall** — `recorded`, field `ingredient.term`.
- Value/reason: "bullocks gall"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Book I · chapter ii · printed p. 35](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=cockayne-translation.r1&span=span-eyesalve-recipe) · `span-eyesalve-recipe` · UTF-16 [0, 401).
> Work an eye salve for a wen, take cropleek and garlic, of both equal quantities, pound them well together, take wine and bullocks gall, of both equal quantities, mix with the leek, put this then into a brazen vessel, let it stand nine days in the brass vessel, wring out through a cloth and clear it well, put it into a horn, and about night time apply it with a feather to the eye; the best leechdom.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-part-bullocks-gall

- [ ] Human check: **bullocks gall: part** — `unknown`, field `ingredient.part`.
- Value/reason: not_reported
- Rationale: No sufficiently specific part is recorded for this slot in the selected passage.
- Source scope: `cockayne-translation.r1` / displayText. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-state-bullocks-gall

- [ ] Human check: **bullocks gall: state** — `unknown`, field `ingredient.state`.
- Value/reason: not_reported
- Rationale: Fresh/dry or precise material state is not explicitly recorded.
- Source scope: `cockayne-translation.r1` / displayText. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-2018-es-o-composition

- [ ] Human check: **ES-O: Table 1 formulation** — `recorded`, field `material.composition`.
- Value/reason: {"garlic":true,"wine":true,"onion":true,"leek":false,"bovineBile":true,"brassContact":true}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 1](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-formulations) · `span-2018-formulations` · UTF-16 [31140, 31811).
> Table 1: Composition of Bald’s eyesalve (ES) formulations.
>  | ES-O | ES-L | ES-GBBr | ES-GB | ES-GBr | ES-G
> Garlic | + | + | + | + | + | +
> Wine | + | + | + | + | + | +
> Onion | + | - | - | - | - | -
> Leek | - | + | - | - | - | -
> Bovine bilea | + | + | + | + | - | -
> Brassb | + | + | + | - | + | -
> Bald’s eyesalve was prepared by combining equal volumes (25 mL) of garlic, wine, onion or leek, and bovine bile followed by addition of brass prior to incubation at 4 °C for 9 days. + designates ingredients that were included, while - denotes those which were excluded.a87 mg/mL dissolved in sterile waterbNine 15-mm squares of 24 gauge (0.51-mm) brass sheet metal (alloy 260)
- Reviewer / qualification / date / decision / rationale: **pending**

### a-2018-es-o-processing

- [ ] Human check: **ES-O: reported processing** — `recorded`, field `preparation.processing`.
- Value/reason: "Equal 25 mL component volumes; 4 °C for 9 days in glass bottles; brass squares where Table 1 specifies; centrifuged supernatant"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-preparation) · `span-2018-preparation` · UTF-16 [3889, 4584).
> Immediately following plant material preparation, equivalent volumes (25 mL) of minced garlic bulb (~14.2 g), minced yellow onion (~22.2 g) or minced leek leaves (~8.8 g), white wine, and bovine bile salts (87 mg/mL dissolved in sterile water) were combined in sterile 250 mL glass bottles. Nine 15-mm squares of 0.51-mm brass sheet were added to each bottle prior to being wrapped in foil and placed at 4 °C for 9 days. One or more ingredients were omitted from several formulations as described in Table 1. After incubation, formulations were centrifuged at 5000 rpm for 10 min. Supernatants were transferred to sterile 50 mL tubes and stored at 4 °C, while insoluble materials were discarded.
- [Table 1](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-formulations) · `span-2018-formulations` · UTF-16 [31140, 31811).
> Table 1: Composition of Bald’s eyesalve (ES) formulations.
>  | ES-O | ES-L | ES-GBBr | ES-GB | ES-GBr | ES-G
> Garlic | + | + | + | + | + | +
> Wine | + | + | + | + | + | +
> Onion | + | - | - | - | - | -
> Leek | - | + | - | - | - | -
> Bovine bilea | + | + | + | + | - | -
> Brassb | + | + | + | - | + | -
> Bald’s eyesalve was prepared by combining equal volumes (25 mL) of garlic, wine, onion or leek, and bovine bile followed by addition of brass prior to incubation at 4 °C for 9 days. + designates ingredients that were included, while - denotes those which were excluded.a87 mg/mL dissolved in sterile waterbNine 15-mm squares of 24 gauge (0.51-mm) brass sheet metal (alloy 260)
- Reviewer / qualification / date / decision / rationale: **pending**

### a-2018-es-o-plants

- [ ] Human check: **ES-O: reported plant identities** — `recorded`, field `material.reportedPlants`.
- Value/reason: "Garlic Allium sativum; onion Allium cepa; leek Allium ampeloprasum where included; qualifiers and parts require structured curation"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-plants) · `span-2018-plants` · UTF-16 [2676, 3223).
> The garlic (Allium sativum), yellow onion (Allium cepa L.), and leek (Allium ampeloprasum L.) used in this study originated from Montana Stinking Rose Farm in Bozeman, Montana, Easterday Farms Produce Company in Pasco, Washington, and Associated Food Stores Inc. in Salt Lake City, Utah, respectively. Plant materials and white wine (2016 Pinot Grigio, La Fiera Veneto; UPC 0-89832-90007-8) were purchased from Town & Country Foods in Bozeman, Montana. Following purchase, produce and wine were stored at 4 °C prior to Bald’s eyesalve preparation.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-o-atcc-6538-context

- [ ] Human check: **ES-O · S. aureus ATCC-6538** — `recorded`, field `assay.context`.
- Value/reason: {"organism":"Staphylococcus aureus","strain":"ATCC 6538","model":"broth microdilution","medium":"cation-adjusted Mueller-Hinton broth","endpoint":"MIC","setting":"in vitro","exposure":"37 °C, 20 h"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-method) · `span-2018-mic-method` · UTF-16 [5004, 6060).
> MIC values were determined for each of the bacterial strains using a microdilution method in 96-well microtiter plates with cation-adjusted Mueller-Hinton broth (MHB). Inoculum culture growth conditions consisted of batch cultures grown at 37 °C, 220 rpm agitation to an optical density reading at 600 nm of 0.45–0.5 for S. aureus (~ 2.5 × 108 colony-forming units per mL (CFU/mL)) and 0.48 for P. aeruginosa (~ 3 × 108 CFU/mL). Inoculum was diluted 1:200 (v/v) with 2X MHB and then 1:1 (v/v) into 96-well microtiter plates containing serial diluted eyesalve (40% to 0.3125% (v/v)) along with positive and negative control wells, containing no eyesalve with and without inoculum respectively, for a total of 200 μL per well. Microtiter plates were incubated at 37 °C for 20 hrs prior to evaluation for growth inhibition. This method was based upon recommendations from the Clinical and Laboratory Standards Institute [11]. An allicin standard (LKT Labs) was assayed using the same protocol, but with S. aureus stain LAC and P. aeruginosa strain PA215 only.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-o-atcc-6538-comparator

- [ ] Human check: **MIC control wells** — `recorded`, field `assay.comparator`.
- Value/reason: "No eyesalve, with and without inoculum"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-method) · `span-2018-mic-method` · UTF-16 [5004, 6060).
> MIC values were determined for each of the bacterial strains using a microdilution method in 96-well microtiter plates with cation-adjusted Mueller-Hinton broth (MHB). Inoculum culture growth conditions consisted of batch cultures grown at 37 °C, 220 rpm agitation to an optical density reading at 600 nm of 0.45–0.5 for S. aureus (~ 2.5 × 108 colony-forming units per mL (CFU/mL)) and 0.48 for P. aeruginosa (~ 3 × 108 CFU/mL). Inoculum was diluted 1:200 (v/v) with 2X MHB and then 1:1 (v/v) into 96-well microtiter plates containing serial diluted eyesalve (40% to 0.3125% (v/v)) along with positive and negative control wells, containing no eyesalve with and without inoculum respectively, for a total of 200 μL per well. Microtiter plates were incubated at 37 °C for 20 hrs prior to evaluation for growth inhibition. This method was based upon recommendations from the Clinical and Laboratory Standards Institute [11]. An allicin standard (LKT Labs) was assayed using the same protocol, but with S. aureus stain LAC and P. aeruginosa strain PA215 only.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-o-atcc-6538-endpoint

- [ ] Human check: **Minimum inhibitory concentration** — `recorded`, field `assay.endpoint`.
- Value/reason: "MIC in % v/v eyesalve formulation; reported median of at least 3 biological replicates"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-o-atcc-6538-outcome

- [ ] Human check: **Reported Table 2 MIC** — `recorded`, field `outcome.reported`.
- Value/reason: {"value":0.625,"unit":"% v/v","statistic":"median","minimumBiologicalReplicates":3,"clinicalInterpretation":"not established"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-o-lac-context

- [ ] Human check: **ES-O · S. aureus LAC** — `recorded`, field `assay.context`.
- Value/reason: {"organism":"Staphylococcus aureus","strain":"LAC (MRSA)","model":"broth microdilution","medium":"cation-adjusted Mueller-Hinton broth","endpoint":"MIC","setting":"in vitro","exposure":"37 °C, 20 h"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-method) · `span-2018-mic-method` · UTF-16 [5004, 6060).
> MIC values were determined for each of the bacterial strains using a microdilution method in 96-well microtiter plates with cation-adjusted Mueller-Hinton broth (MHB). Inoculum culture growth conditions consisted of batch cultures grown at 37 °C, 220 rpm agitation to an optical density reading at 600 nm of 0.45–0.5 for S. aureus (~ 2.5 × 108 colony-forming units per mL (CFU/mL)) and 0.48 for P. aeruginosa (~ 3 × 108 CFU/mL). Inoculum was diluted 1:200 (v/v) with 2X MHB and then 1:1 (v/v) into 96-well microtiter plates containing serial diluted eyesalve (40% to 0.3125% (v/v)) along with positive and negative control wells, containing no eyesalve with and without inoculum respectively, for a total of 200 μL per well. Microtiter plates were incubated at 37 °C for 20 hrs prior to evaluation for growth inhibition. This method was based upon recommendations from the Clinical and Laboratory Standards Institute [11]. An allicin standard (LKT Labs) was assayed using the same protocol, but with S. aureus stain LAC and P. aeruginosa strain PA215 only.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-o-lac-comparator

- [ ] Human check: **MIC control wells** — `recorded`, field `assay.comparator`.
- Value/reason: "No eyesalve, with and without inoculum"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-method) · `span-2018-mic-method` · UTF-16 [5004, 6060).
> MIC values were determined for each of the bacterial strains using a microdilution method in 96-well microtiter plates with cation-adjusted Mueller-Hinton broth (MHB). Inoculum culture growth conditions consisted of batch cultures grown at 37 °C, 220 rpm agitation to an optical density reading at 600 nm of 0.45–0.5 for S. aureus (~ 2.5 × 108 colony-forming units per mL (CFU/mL)) and 0.48 for P. aeruginosa (~ 3 × 108 CFU/mL). Inoculum was diluted 1:200 (v/v) with 2X MHB and then 1:1 (v/v) into 96-well microtiter plates containing serial diluted eyesalve (40% to 0.3125% (v/v)) along with positive and negative control wells, containing no eyesalve with and without inoculum respectively, for a total of 200 μL per well. Microtiter plates were incubated at 37 °C for 20 hrs prior to evaluation for growth inhibition. This method was based upon recommendations from the Clinical and Laboratory Standards Institute [11]. An allicin standard (LKT Labs) was assayed using the same protocol, but with S. aureus stain LAC and P. aeruginosa strain PA215 only.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-o-lac-endpoint

- [ ] Human check: **Minimum inhibitory concentration** — `recorded`, field `assay.endpoint`.
- Value/reason: "MIC in % v/v eyesalve formulation; reported median of at least 3 biological replicates"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-o-lac-outcome

- [ ] Human check: **Reported Table 2 MIC** — `recorded`, field `outcome.reported`.
- Value/reason: {"value":2.5,"unit":"% v/v","statistic":"median","minimumBiologicalReplicates":3,"clinicalInterpretation":"not established"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### a-2018-es-l-composition

- [ ] Human check: **ES-L: Table 1 formulation** — `recorded`, field `material.composition`.
- Value/reason: {"garlic":true,"wine":true,"onion":false,"leek":true,"bovineBile":true,"brassContact":true}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 1](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-formulations) · `span-2018-formulations` · UTF-16 [31140, 31811).
> Table 1: Composition of Bald’s eyesalve (ES) formulations.
>  | ES-O | ES-L | ES-GBBr | ES-GB | ES-GBr | ES-G
> Garlic | + | + | + | + | + | +
> Wine | + | + | + | + | + | +
> Onion | + | - | - | - | - | -
> Leek | - | + | - | - | - | -
> Bovine bilea | + | + | + | + | - | -
> Brassb | + | + | + | - | + | -
> Bald’s eyesalve was prepared by combining equal volumes (25 mL) of garlic, wine, onion or leek, and bovine bile followed by addition of brass prior to incubation at 4 °C for 9 days. + designates ingredients that were included, while - denotes those which were excluded.a87 mg/mL dissolved in sterile waterbNine 15-mm squares of 24 gauge (0.51-mm) brass sheet metal (alloy 260)
- Reviewer / qualification / date / decision / rationale: **pending**

### a-2018-es-l-processing

- [ ] Human check: **ES-L: reported processing** — `recorded`, field `preparation.processing`.
- Value/reason: "Equal 25 mL component volumes; 4 °C for 9 days in glass bottles; brass squares where Table 1 specifies; centrifuged supernatant"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-preparation) · `span-2018-preparation` · UTF-16 [3889, 4584).
> Immediately following plant material preparation, equivalent volumes (25 mL) of minced garlic bulb (~14.2 g), minced yellow onion (~22.2 g) or minced leek leaves (~8.8 g), white wine, and bovine bile salts (87 mg/mL dissolved in sterile water) were combined in sterile 250 mL glass bottles. Nine 15-mm squares of 0.51-mm brass sheet were added to each bottle prior to being wrapped in foil and placed at 4 °C for 9 days. One or more ingredients were omitted from several formulations as described in Table 1. After incubation, formulations were centrifuged at 5000 rpm for 10 min. Supernatants were transferred to sterile 50 mL tubes and stored at 4 °C, while insoluble materials were discarded.
- [Table 1](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-formulations) · `span-2018-formulations` · UTF-16 [31140, 31811).
> Table 1: Composition of Bald’s eyesalve (ES) formulations.
>  | ES-O | ES-L | ES-GBBr | ES-GB | ES-GBr | ES-G
> Garlic | + | + | + | + | + | +
> Wine | + | + | + | + | + | +
> Onion | + | - | - | - | - | -
> Leek | - | + | - | - | - | -
> Bovine bilea | + | + | + | + | - | -
> Brassb | + | + | + | - | + | -
> Bald’s eyesalve was prepared by combining equal volumes (25 mL) of garlic, wine, onion or leek, and bovine bile followed by addition of brass prior to incubation at 4 °C for 9 days. + designates ingredients that were included, while - denotes those which were excluded.a87 mg/mL dissolved in sterile waterbNine 15-mm squares of 24 gauge (0.51-mm) brass sheet metal (alloy 260)
- Reviewer / qualification / date / decision / rationale: **pending**

### a-2018-es-l-plants

- [ ] Human check: **ES-L: reported plant identities** — `recorded`, field `material.reportedPlants`.
- Value/reason: "Garlic Allium sativum; onion Allium cepa; leek Allium ampeloprasum where included; qualifiers and parts require structured curation"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-plants) · `span-2018-plants` · UTF-16 [2676, 3223).
> The garlic (Allium sativum), yellow onion (Allium cepa L.), and leek (Allium ampeloprasum L.) used in this study originated from Montana Stinking Rose Farm in Bozeman, Montana, Easterday Farms Produce Company in Pasco, Washington, and Associated Food Stores Inc. in Salt Lake City, Utah, respectively. Plant materials and white wine (2016 Pinot Grigio, La Fiera Veneto; UPC 0-89832-90007-8) were purchased from Town & Country Foods in Bozeman, Montana. Following purchase, produce and wine were stored at 4 °C prior to Bald’s eyesalve preparation.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-l-atcc-6538-context

- [ ] Human check: **ES-L · S. aureus ATCC-6538** — `recorded`, field `assay.context`.
- Value/reason: {"organism":"Staphylococcus aureus","strain":"ATCC 6538","model":"broth microdilution","medium":"cation-adjusted Mueller-Hinton broth","endpoint":"MIC","setting":"in vitro","exposure":"37 °C, 20 h"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-method) · `span-2018-mic-method` · UTF-16 [5004, 6060).
> MIC values were determined for each of the bacterial strains using a microdilution method in 96-well microtiter plates with cation-adjusted Mueller-Hinton broth (MHB). Inoculum culture growth conditions consisted of batch cultures grown at 37 °C, 220 rpm agitation to an optical density reading at 600 nm of 0.45–0.5 for S. aureus (~ 2.5 × 108 colony-forming units per mL (CFU/mL)) and 0.48 for P. aeruginosa (~ 3 × 108 CFU/mL). Inoculum was diluted 1:200 (v/v) with 2X MHB and then 1:1 (v/v) into 96-well microtiter plates containing serial diluted eyesalve (40% to 0.3125% (v/v)) along with positive and negative control wells, containing no eyesalve with and without inoculum respectively, for a total of 200 μL per well. Microtiter plates were incubated at 37 °C for 20 hrs prior to evaluation for growth inhibition. This method was based upon recommendations from the Clinical and Laboratory Standards Institute [11]. An allicin standard (LKT Labs) was assayed using the same protocol, but with S. aureus stain LAC and P. aeruginosa strain PA215 only.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-l-atcc-6538-comparator

- [ ] Human check: **MIC control wells** — `recorded`, field `assay.comparator`.
- Value/reason: "No eyesalve, with and without inoculum"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-method) · `span-2018-mic-method` · UTF-16 [5004, 6060).
> MIC values were determined for each of the bacterial strains using a microdilution method in 96-well microtiter plates with cation-adjusted Mueller-Hinton broth (MHB). Inoculum culture growth conditions consisted of batch cultures grown at 37 °C, 220 rpm agitation to an optical density reading at 600 nm of 0.45–0.5 for S. aureus (~ 2.5 × 108 colony-forming units per mL (CFU/mL)) and 0.48 for P. aeruginosa (~ 3 × 108 CFU/mL). Inoculum was diluted 1:200 (v/v) with 2X MHB and then 1:1 (v/v) into 96-well microtiter plates containing serial diluted eyesalve (40% to 0.3125% (v/v)) along with positive and negative control wells, containing no eyesalve with and without inoculum respectively, for a total of 200 μL per well. Microtiter plates were incubated at 37 °C for 20 hrs prior to evaluation for growth inhibition. This method was based upon recommendations from the Clinical and Laboratory Standards Institute [11]. An allicin standard (LKT Labs) was assayed using the same protocol, but with S. aureus stain LAC and P. aeruginosa strain PA215 only.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-l-atcc-6538-endpoint

- [ ] Human check: **Minimum inhibitory concentration** — `recorded`, field `assay.endpoint`.
- Value/reason: "MIC in % v/v eyesalve formulation; reported median of at least 3 biological replicates"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-l-atcc-6538-outcome

- [ ] Human check: **Reported Table 2 MIC** — `recorded`, field `outcome.reported`.
- Value/reason: {"value":0.625,"unit":"% v/v","statistic":"median","minimumBiologicalReplicates":3,"clinicalInterpretation":"not established"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-l-lac-context

- [ ] Human check: **ES-L · S. aureus LAC** — `recorded`, field `assay.context`.
- Value/reason: {"organism":"Staphylococcus aureus","strain":"LAC (MRSA)","model":"broth microdilution","medium":"cation-adjusted Mueller-Hinton broth","endpoint":"MIC","setting":"in vitro","exposure":"37 °C, 20 h"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-method) · `span-2018-mic-method` · UTF-16 [5004, 6060).
> MIC values were determined for each of the bacterial strains using a microdilution method in 96-well microtiter plates with cation-adjusted Mueller-Hinton broth (MHB). Inoculum culture growth conditions consisted of batch cultures grown at 37 °C, 220 rpm agitation to an optical density reading at 600 nm of 0.45–0.5 for S. aureus (~ 2.5 × 108 colony-forming units per mL (CFU/mL)) and 0.48 for P. aeruginosa (~ 3 × 108 CFU/mL). Inoculum was diluted 1:200 (v/v) with 2X MHB and then 1:1 (v/v) into 96-well microtiter plates containing serial diluted eyesalve (40% to 0.3125% (v/v)) along with positive and negative control wells, containing no eyesalve with and without inoculum respectively, for a total of 200 μL per well. Microtiter plates were incubated at 37 °C for 20 hrs prior to evaluation for growth inhibition. This method was based upon recommendations from the Clinical and Laboratory Standards Institute [11]. An allicin standard (LKT Labs) was assayed using the same protocol, but with S. aureus stain LAC and P. aeruginosa strain PA215 only.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-l-lac-comparator

- [ ] Human check: **MIC control wells** — `recorded`, field `assay.comparator`.
- Value/reason: "No eyesalve, with and without inoculum"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-method) · `span-2018-mic-method` · UTF-16 [5004, 6060).
> MIC values were determined for each of the bacterial strains using a microdilution method in 96-well microtiter plates with cation-adjusted Mueller-Hinton broth (MHB). Inoculum culture growth conditions consisted of batch cultures grown at 37 °C, 220 rpm agitation to an optical density reading at 600 nm of 0.45–0.5 for S. aureus (~ 2.5 × 108 colony-forming units per mL (CFU/mL)) and 0.48 for P. aeruginosa (~ 3 × 108 CFU/mL). Inoculum was diluted 1:200 (v/v) with 2X MHB and then 1:1 (v/v) into 96-well microtiter plates containing serial diluted eyesalve (40% to 0.3125% (v/v)) along with positive and negative control wells, containing no eyesalve with and without inoculum respectively, for a total of 200 μL per well. Microtiter plates were incubated at 37 °C for 20 hrs prior to evaluation for growth inhibition. This method was based upon recommendations from the Clinical and Laboratory Standards Institute [11]. An allicin standard (LKT Labs) was assayed using the same protocol, but with S. aureus stain LAC and P. aeruginosa strain PA215 only.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-l-lac-endpoint

- [ ] Human check: **Minimum inhibitory concentration** — `recorded`, field `assay.endpoint`.
- Value/reason: "MIC in % v/v eyesalve formulation; reported median of at least 3 biological replicates"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-l-lac-outcome

- [ ] Human check: **Reported Table 2 MIC** — `recorded`, field `outcome.reported`.
- Value/reason: {"value":1.25,"unit":"% v/v","statistic":"median","minimumBiologicalReplicates":3,"clinicalInterpretation":"not established"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### a-2018-es-gbbr-composition

- [ ] Human check: **ES-GBBr: Table 1 formulation** — `recorded`, field `material.composition`.
- Value/reason: {"garlic":true,"wine":true,"onion":false,"leek":false,"bovineBile":true,"brassContact":true}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 1](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-formulations) · `span-2018-formulations` · UTF-16 [31140, 31811).
> Table 1: Composition of Bald’s eyesalve (ES) formulations.
>  | ES-O | ES-L | ES-GBBr | ES-GB | ES-GBr | ES-G
> Garlic | + | + | + | + | + | +
> Wine | + | + | + | + | + | +
> Onion | + | - | - | - | - | -
> Leek | - | + | - | - | - | -
> Bovine bilea | + | + | + | + | - | -
> Brassb | + | + | + | - | + | -
> Bald’s eyesalve was prepared by combining equal volumes (25 mL) of garlic, wine, onion or leek, and bovine bile followed by addition of brass prior to incubation at 4 °C for 9 days. + designates ingredients that were included, while - denotes those which were excluded.a87 mg/mL dissolved in sterile waterbNine 15-mm squares of 24 gauge (0.51-mm) brass sheet metal (alloy 260)
- Reviewer / qualification / date / decision / rationale: **pending**

### a-2018-es-gbbr-processing

- [ ] Human check: **ES-GBBr: reported processing** — `recorded`, field `preparation.processing`.
- Value/reason: "Equal 25 mL component volumes; 4 °C for 9 days in glass bottles; brass squares where Table 1 specifies; centrifuged supernatant"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-preparation) · `span-2018-preparation` · UTF-16 [3889, 4584).
> Immediately following plant material preparation, equivalent volumes (25 mL) of minced garlic bulb (~14.2 g), minced yellow onion (~22.2 g) or minced leek leaves (~8.8 g), white wine, and bovine bile salts (87 mg/mL dissolved in sterile water) were combined in sterile 250 mL glass bottles. Nine 15-mm squares of 0.51-mm brass sheet were added to each bottle prior to being wrapped in foil and placed at 4 °C for 9 days. One or more ingredients were omitted from several formulations as described in Table 1. After incubation, formulations were centrifuged at 5000 rpm for 10 min. Supernatants were transferred to sterile 50 mL tubes and stored at 4 °C, while insoluble materials were discarded.
- [Table 1](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-formulations) · `span-2018-formulations` · UTF-16 [31140, 31811).
> Table 1: Composition of Bald’s eyesalve (ES) formulations.
>  | ES-O | ES-L | ES-GBBr | ES-GB | ES-GBr | ES-G
> Garlic | + | + | + | + | + | +
> Wine | + | + | + | + | + | +
> Onion | + | - | - | - | - | -
> Leek | - | + | - | - | - | -
> Bovine bilea | + | + | + | + | - | -
> Brassb | + | + | + | - | + | -
> Bald’s eyesalve was prepared by combining equal volumes (25 mL) of garlic, wine, onion or leek, and bovine bile followed by addition of brass prior to incubation at 4 °C for 9 days. + designates ingredients that were included, while - denotes those which were excluded.a87 mg/mL dissolved in sterile waterbNine 15-mm squares of 24 gauge (0.51-mm) brass sheet metal (alloy 260)
- Reviewer / qualification / date / decision / rationale: **pending**

### a-2018-es-gbbr-plants

- [ ] Human check: **ES-GBBr: reported plant identities** — `recorded`, field `material.reportedPlants`.
- Value/reason: "Garlic Allium sativum; onion Allium cepa; leek Allium ampeloprasum where included; qualifiers and parts require structured curation"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-plants) · `span-2018-plants` · UTF-16 [2676, 3223).
> The garlic (Allium sativum), yellow onion (Allium cepa L.), and leek (Allium ampeloprasum L.) used in this study originated from Montana Stinking Rose Farm in Bozeman, Montana, Easterday Farms Produce Company in Pasco, Washington, and Associated Food Stores Inc. in Salt Lake City, Utah, respectively. Plant materials and white wine (2016 Pinot Grigio, La Fiera Veneto; UPC 0-89832-90007-8) were purchased from Town & Country Foods in Bozeman, Montana. Following purchase, produce and wine were stored at 4 °C prior to Bald’s eyesalve preparation.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-gbbr-atcc-6538-context

- [ ] Human check: **ES-GBBr · S. aureus ATCC-6538** — `recorded`, field `assay.context`.
- Value/reason: {"organism":"Staphylococcus aureus","strain":"ATCC 6538","model":"broth microdilution","medium":"cation-adjusted Mueller-Hinton broth","endpoint":"MIC","setting":"in vitro","exposure":"37 °C, 20 h"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-method) · `span-2018-mic-method` · UTF-16 [5004, 6060).
> MIC values were determined for each of the bacterial strains using a microdilution method in 96-well microtiter plates with cation-adjusted Mueller-Hinton broth (MHB). Inoculum culture growth conditions consisted of batch cultures grown at 37 °C, 220 rpm agitation to an optical density reading at 600 nm of 0.45–0.5 for S. aureus (~ 2.5 × 108 colony-forming units per mL (CFU/mL)) and 0.48 for P. aeruginosa (~ 3 × 108 CFU/mL). Inoculum was diluted 1:200 (v/v) with 2X MHB and then 1:1 (v/v) into 96-well microtiter plates containing serial diluted eyesalve (40% to 0.3125% (v/v)) along with positive and negative control wells, containing no eyesalve with and without inoculum respectively, for a total of 200 μL per well. Microtiter plates were incubated at 37 °C for 20 hrs prior to evaluation for growth inhibition. This method was based upon recommendations from the Clinical and Laboratory Standards Institute [11]. An allicin standard (LKT Labs) was assayed using the same protocol, but with S. aureus stain LAC and P. aeruginosa strain PA215 only.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-gbbr-atcc-6538-comparator

- [ ] Human check: **MIC control wells** — `recorded`, field `assay.comparator`.
- Value/reason: "No eyesalve, with and without inoculum"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-method) · `span-2018-mic-method` · UTF-16 [5004, 6060).
> MIC values were determined for each of the bacterial strains using a microdilution method in 96-well microtiter plates with cation-adjusted Mueller-Hinton broth (MHB). Inoculum culture growth conditions consisted of batch cultures grown at 37 °C, 220 rpm agitation to an optical density reading at 600 nm of 0.45–0.5 for S. aureus (~ 2.5 × 108 colony-forming units per mL (CFU/mL)) and 0.48 for P. aeruginosa (~ 3 × 108 CFU/mL). Inoculum was diluted 1:200 (v/v) with 2X MHB and then 1:1 (v/v) into 96-well microtiter plates containing serial diluted eyesalve (40% to 0.3125% (v/v)) along with positive and negative control wells, containing no eyesalve with and without inoculum respectively, for a total of 200 μL per well. Microtiter plates were incubated at 37 °C for 20 hrs prior to evaluation for growth inhibition. This method was based upon recommendations from the Clinical and Laboratory Standards Institute [11]. An allicin standard (LKT Labs) was assayed using the same protocol, but with S. aureus stain LAC and P. aeruginosa strain PA215 only.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-gbbr-atcc-6538-endpoint

- [ ] Human check: **Minimum inhibitory concentration** — `recorded`, field `assay.endpoint`.
- Value/reason: "MIC in % v/v eyesalve formulation; reported median of at least 3 biological replicates"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-gbbr-atcc-6538-outcome

- [ ] Human check: **Reported Table 2 MIC** — `recorded`, field `outcome.reported`.
- Value/reason: {"value":0.625,"unit":"% v/v","statistic":"median","minimumBiologicalReplicates":3,"clinicalInterpretation":"not established"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-gbbr-lac-context

- [ ] Human check: **ES-GBBr · S. aureus LAC** — `recorded`, field `assay.context`.
- Value/reason: {"organism":"Staphylococcus aureus","strain":"LAC (MRSA)","model":"broth microdilution","medium":"cation-adjusted Mueller-Hinton broth","endpoint":"MIC","setting":"in vitro","exposure":"37 °C, 20 h"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-method) · `span-2018-mic-method` · UTF-16 [5004, 6060).
> MIC values were determined for each of the bacterial strains using a microdilution method in 96-well microtiter plates with cation-adjusted Mueller-Hinton broth (MHB). Inoculum culture growth conditions consisted of batch cultures grown at 37 °C, 220 rpm agitation to an optical density reading at 600 nm of 0.45–0.5 for S. aureus (~ 2.5 × 108 colony-forming units per mL (CFU/mL)) and 0.48 for P. aeruginosa (~ 3 × 108 CFU/mL). Inoculum was diluted 1:200 (v/v) with 2X MHB and then 1:1 (v/v) into 96-well microtiter plates containing serial diluted eyesalve (40% to 0.3125% (v/v)) along with positive and negative control wells, containing no eyesalve with and without inoculum respectively, for a total of 200 μL per well. Microtiter plates were incubated at 37 °C for 20 hrs prior to evaluation for growth inhibition. This method was based upon recommendations from the Clinical and Laboratory Standards Institute [11]. An allicin standard (LKT Labs) was assayed using the same protocol, but with S. aureus stain LAC and P. aeruginosa strain PA215 only.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-gbbr-lac-comparator

- [ ] Human check: **MIC control wells** — `recorded`, field `assay.comparator`.
- Value/reason: "No eyesalve, with and without inoculum"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-method) · `span-2018-mic-method` · UTF-16 [5004, 6060).
> MIC values were determined for each of the bacterial strains using a microdilution method in 96-well microtiter plates with cation-adjusted Mueller-Hinton broth (MHB). Inoculum culture growth conditions consisted of batch cultures grown at 37 °C, 220 rpm agitation to an optical density reading at 600 nm of 0.45–0.5 for S. aureus (~ 2.5 × 108 colony-forming units per mL (CFU/mL)) and 0.48 for P. aeruginosa (~ 3 × 108 CFU/mL). Inoculum was diluted 1:200 (v/v) with 2X MHB and then 1:1 (v/v) into 96-well microtiter plates containing serial diluted eyesalve (40% to 0.3125% (v/v)) along with positive and negative control wells, containing no eyesalve with and without inoculum respectively, for a total of 200 μL per well. Microtiter plates were incubated at 37 °C for 20 hrs prior to evaluation for growth inhibition. This method was based upon recommendations from the Clinical and Laboratory Standards Institute [11]. An allicin standard (LKT Labs) was assayed using the same protocol, but with S. aureus stain LAC and P. aeruginosa strain PA215 only.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-gbbr-lac-endpoint

- [ ] Human check: **Minimum inhibitory concentration** — `recorded`, field `assay.endpoint`.
- Value/reason: "MIC in % v/v eyesalve formulation; reported median of at least 3 biological replicates"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-gbbr-lac-outcome

- [ ] Human check: **Reported Table 2 MIC** — `recorded`, field `outcome.reported`.
- Value/reason: {"value":1.25,"unit":"% v/v","statistic":"median","minimumBiologicalReplicates":3,"clinicalInterpretation":"not established"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### a-2018-es-gb-composition

- [ ] Human check: **ES-GB: Table 1 formulation** — `recorded`, field `material.composition`.
- Value/reason: {"garlic":true,"wine":true,"onion":false,"leek":false,"bovineBile":true,"brassContact":false}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 1](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-formulations) · `span-2018-formulations` · UTF-16 [31140, 31811).
> Table 1: Composition of Bald’s eyesalve (ES) formulations.
>  | ES-O | ES-L | ES-GBBr | ES-GB | ES-GBr | ES-G
> Garlic | + | + | + | + | + | +
> Wine | + | + | + | + | + | +
> Onion | + | - | - | - | - | -
> Leek | - | + | - | - | - | -
> Bovine bilea | + | + | + | + | - | -
> Brassb | + | + | + | - | + | -
> Bald’s eyesalve was prepared by combining equal volumes (25 mL) of garlic, wine, onion or leek, and bovine bile followed by addition of brass prior to incubation at 4 °C for 9 days. + designates ingredients that were included, while - denotes those which were excluded.a87 mg/mL dissolved in sterile waterbNine 15-mm squares of 24 gauge (0.51-mm) brass sheet metal (alloy 260)
- Reviewer / qualification / date / decision / rationale: **pending**

### a-2018-es-gb-processing

- [ ] Human check: **ES-GB: reported processing** — `recorded`, field `preparation.processing`.
- Value/reason: "Equal 25 mL component volumes; 4 °C for 9 days in glass bottles; brass squares where Table 1 specifies; centrifuged supernatant"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-preparation) · `span-2018-preparation` · UTF-16 [3889, 4584).
> Immediately following plant material preparation, equivalent volumes (25 mL) of minced garlic bulb (~14.2 g), minced yellow onion (~22.2 g) or minced leek leaves (~8.8 g), white wine, and bovine bile salts (87 mg/mL dissolved in sterile water) were combined in sterile 250 mL glass bottles. Nine 15-mm squares of 0.51-mm brass sheet were added to each bottle prior to being wrapped in foil and placed at 4 °C for 9 days. One or more ingredients were omitted from several formulations as described in Table 1. After incubation, formulations were centrifuged at 5000 rpm for 10 min. Supernatants were transferred to sterile 50 mL tubes and stored at 4 °C, while insoluble materials were discarded.
- [Table 1](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-formulations) · `span-2018-formulations` · UTF-16 [31140, 31811).
> Table 1: Composition of Bald’s eyesalve (ES) formulations.
>  | ES-O | ES-L | ES-GBBr | ES-GB | ES-GBr | ES-G
> Garlic | + | + | + | + | + | +
> Wine | + | + | + | + | + | +
> Onion | + | - | - | - | - | -
> Leek | - | + | - | - | - | -
> Bovine bilea | + | + | + | + | - | -
> Brassb | + | + | + | - | + | -
> Bald’s eyesalve was prepared by combining equal volumes (25 mL) of garlic, wine, onion or leek, and bovine bile followed by addition of brass prior to incubation at 4 °C for 9 days. + designates ingredients that were included, while - denotes those which were excluded.a87 mg/mL dissolved in sterile waterbNine 15-mm squares of 24 gauge (0.51-mm) brass sheet metal (alloy 260)
- Reviewer / qualification / date / decision / rationale: **pending**

### a-2018-es-gb-plants

- [ ] Human check: **ES-GB: reported plant identities** — `recorded`, field `material.reportedPlants`.
- Value/reason: "Garlic Allium sativum; onion Allium cepa; leek Allium ampeloprasum where included; qualifiers and parts require structured curation"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-plants) · `span-2018-plants` · UTF-16 [2676, 3223).
> The garlic (Allium sativum), yellow onion (Allium cepa L.), and leek (Allium ampeloprasum L.) used in this study originated from Montana Stinking Rose Farm in Bozeman, Montana, Easterday Farms Produce Company in Pasco, Washington, and Associated Food Stores Inc. in Salt Lake City, Utah, respectively. Plant materials and white wine (2016 Pinot Grigio, La Fiera Veneto; UPC 0-89832-90007-8) were purchased from Town & Country Foods in Bozeman, Montana. Following purchase, produce and wine were stored at 4 °C prior to Bald’s eyesalve preparation.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-gb-atcc-6538-context

- [ ] Human check: **ES-GB · S. aureus ATCC-6538** — `recorded`, field `assay.context`.
- Value/reason: {"organism":"Staphylococcus aureus","strain":"ATCC 6538","model":"broth microdilution","medium":"cation-adjusted Mueller-Hinton broth","endpoint":"MIC","setting":"in vitro","exposure":"37 °C, 20 h"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-method) · `span-2018-mic-method` · UTF-16 [5004, 6060).
> MIC values were determined for each of the bacterial strains using a microdilution method in 96-well microtiter plates with cation-adjusted Mueller-Hinton broth (MHB). Inoculum culture growth conditions consisted of batch cultures grown at 37 °C, 220 rpm agitation to an optical density reading at 600 nm of 0.45–0.5 for S. aureus (~ 2.5 × 108 colony-forming units per mL (CFU/mL)) and 0.48 for P. aeruginosa (~ 3 × 108 CFU/mL). Inoculum was diluted 1:200 (v/v) with 2X MHB and then 1:1 (v/v) into 96-well microtiter plates containing serial diluted eyesalve (40% to 0.3125% (v/v)) along with positive and negative control wells, containing no eyesalve with and without inoculum respectively, for a total of 200 μL per well. Microtiter plates were incubated at 37 °C for 20 hrs prior to evaluation for growth inhibition. This method was based upon recommendations from the Clinical and Laboratory Standards Institute [11]. An allicin standard (LKT Labs) was assayed using the same protocol, but with S. aureus stain LAC and P. aeruginosa strain PA215 only.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-gb-atcc-6538-comparator

- [ ] Human check: **MIC control wells** — `recorded`, field `assay.comparator`.
- Value/reason: "No eyesalve, with and without inoculum"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-method) · `span-2018-mic-method` · UTF-16 [5004, 6060).
> MIC values were determined for each of the bacterial strains using a microdilution method in 96-well microtiter plates with cation-adjusted Mueller-Hinton broth (MHB). Inoculum culture growth conditions consisted of batch cultures grown at 37 °C, 220 rpm agitation to an optical density reading at 600 nm of 0.45–0.5 for S. aureus (~ 2.5 × 108 colony-forming units per mL (CFU/mL)) and 0.48 for P. aeruginosa (~ 3 × 108 CFU/mL). Inoculum was diluted 1:200 (v/v) with 2X MHB and then 1:1 (v/v) into 96-well microtiter plates containing serial diluted eyesalve (40% to 0.3125% (v/v)) along with positive and negative control wells, containing no eyesalve with and without inoculum respectively, for a total of 200 μL per well. Microtiter plates were incubated at 37 °C for 20 hrs prior to evaluation for growth inhibition. This method was based upon recommendations from the Clinical and Laboratory Standards Institute [11]. An allicin standard (LKT Labs) was assayed using the same protocol, but with S. aureus stain LAC and P. aeruginosa strain PA215 only.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-gb-atcc-6538-endpoint

- [ ] Human check: **Minimum inhibitory concentration** — `recorded`, field `assay.endpoint`.
- Value/reason: "MIC in % v/v eyesalve formulation; reported median of at least 3 biological replicates"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-gb-atcc-6538-outcome

- [ ] Human check: **Reported Table 2 MIC** — `recorded`, field `outcome.reported`.
- Value/reason: {"value":0.625,"unit":"% v/v","statistic":"median","minimumBiologicalReplicates":3,"clinicalInterpretation":"not established"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-gb-lac-context

- [ ] Human check: **ES-GB · S. aureus LAC** — `recorded`, field `assay.context`.
- Value/reason: {"organism":"Staphylococcus aureus","strain":"LAC (MRSA)","model":"broth microdilution","medium":"cation-adjusted Mueller-Hinton broth","endpoint":"MIC","setting":"in vitro","exposure":"37 °C, 20 h"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-method) · `span-2018-mic-method` · UTF-16 [5004, 6060).
> MIC values were determined for each of the bacterial strains using a microdilution method in 96-well microtiter plates with cation-adjusted Mueller-Hinton broth (MHB). Inoculum culture growth conditions consisted of batch cultures grown at 37 °C, 220 rpm agitation to an optical density reading at 600 nm of 0.45–0.5 for S. aureus (~ 2.5 × 108 colony-forming units per mL (CFU/mL)) and 0.48 for P. aeruginosa (~ 3 × 108 CFU/mL). Inoculum was diluted 1:200 (v/v) with 2X MHB and then 1:1 (v/v) into 96-well microtiter plates containing serial diluted eyesalve (40% to 0.3125% (v/v)) along with positive and negative control wells, containing no eyesalve with and without inoculum respectively, for a total of 200 μL per well. Microtiter plates were incubated at 37 °C for 20 hrs prior to evaluation for growth inhibition. This method was based upon recommendations from the Clinical and Laboratory Standards Institute [11]. An allicin standard (LKT Labs) was assayed using the same protocol, but with S. aureus stain LAC and P. aeruginosa strain PA215 only.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-gb-lac-comparator

- [ ] Human check: **MIC control wells** — `recorded`, field `assay.comparator`.
- Value/reason: "No eyesalve, with and without inoculum"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-method) · `span-2018-mic-method` · UTF-16 [5004, 6060).
> MIC values were determined for each of the bacterial strains using a microdilution method in 96-well microtiter plates with cation-adjusted Mueller-Hinton broth (MHB). Inoculum culture growth conditions consisted of batch cultures grown at 37 °C, 220 rpm agitation to an optical density reading at 600 nm of 0.45–0.5 for S. aureus (~ 2.5 × 108 colony-forming units per mL (CFU/mL)) and 0.48 for P. aeruginosa (~ 3 × 108 CFU/mL). Inoculum was diluted 1:200 (v/v) with 2X MHB and then 1:1 (v/v) into 96-well microtiter plates containing serial diluted eyesalve (40% to 0.3125% (v/v)) along with positive and negative control wells, containing no eyesalve with and without inoculum respectively, for a total of 200 μL per well. Microtiter plates were incubated at 37 °C for 20 hrs prior to evaluation for growth inhibition. This method was based upon recommendations from the Clinical and Laboratory Standards Institute [11]. An allicin standard (LKT Labs) was assayed using the same protocol, but with S. aureus stain LAC and P. aeruginosa strain PA215 only.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-gb-lac-endpoint

- [ ] Human check: **Minimum inhibitory concentration** — `recorded`, field `assay.endpoint`.
- Value/reason: "MIC in % v/v eyesalve formulation; reported median of at least 3 biological replicates"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2018-es-gb-lac-outcome

- [ ] Human check: **Reported Table 2 MIC** — `recorded`, field `outcome.reported`.
- Value/reason: {"value":1.25,"unit":"% v/v","statistic":"median","minimumBiologicalReplicates":3,"clinicalInterpretation":"not established"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Table 2](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=fuchs-2018.r1&span=span-2018-mic-table) · `span-2018-mic-table` · UTF-16 [31813, 32395).
> Table 2: Susceptibility of bacterial strains to crude Bald’s eyesalve formulations.
> Bacterial strains | MICa
> ES-O | ES-L | ES-GBBr | ES-GB
> S. aureus |  |  |  | 
> ATCC 6538 | 0.625 | 0.625 | 0.625 | 0.625
> LAC | 2.5 | 1.25 | 1.25 | 1.25
> P. aeruginosa |  |  |  | 
> PAO1 | 5 | 5 | 2.5 | 2.5
> PA215 | 10 | 5 | 2.5 | 5
> MIC was determined using a broth microdilution method as described by the Clinical and Laboratory Standards Institute. Reported values represent the median of at least 3 biological replicates.aMIC values indicate the concentration of Bald’s eyesalve formulation in % (v/v)
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2020-eso-newman-composition

- [ ] Human check: **ESO: documented variant** — `recorded`, field `material.composition`.
- Value/reason: {"cropleacInterpretation":"Allium cepa (onion)","garlic":true,"wine":true,"bovineBileSalts":true}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=furner-pardoe-2020.r1&span=span-cropleac-ambiguity) · `span-cropleac-ambiguity` · UTF-16 [5621, 6309).
> The meaning of Old English cropleac, as used in the original remedy, is ambiguous and may refer to a variety of Allium species22,23. Two likely translations are onion (Allium cepa) or leek (Allium porrum). For this reason, multiple batches of the remedy using either Allium species were made in our laboratory between 2014 and 2019. After the 9-day brewing period, the activity of the remedies was tested against mature biofilms of S. aureus Newman in an in vivo-like model of a soft tissue wound. In this assay, 24-h-old biofilms, that have been grown at 37 °C in collagen-based synthetic wounds, are exposed to Bald’s eyesalve or water for 24 h, and surviving bacteria are counted19,24.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=furner-pardoe-2020.r1&span=span-2020-reconstruction) · `span-2020-reconstruction` · UTF-16 [27382, 28087).
> The crushed onion and garlic were then combined with equal volumes of wine (Pennard’s organic dry white, 11% ABV, sourced from Avalon Vineyard, Shepton Mallet) and bovine bile salts (Sigma Aldrich) made up to 89 mg·ml−1 in water and sterilised by exposing to UV radiation for 10 min (Carlton Germicidal Cabinet fitted with a 2537 Å, 8-W UV tube). The mixture was stored in sterilised glass bottles in the dark at 4 °C for 9 days, after which it was strained and centrifuged for 5 min at 1,811 g. The supernatant was then filtered using Whatman 1,001–110 Grade 1 Qualitative Filter Paper, Diameter: 11 cm, Pore Size: 11 μm. Filtered Bald’s eyesalve was stored in sterilised glass vials in the dark at 4 °C.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2020-eso-newman-preparation

- [ ] Human check: **2020 reconstruction process** — `recorded`, field `preparation.processing`.
- Value/reason: "Nine-day brewing; reconstruction methods report 4 °C, glass, prepared bile salts, straining, centrifugation and filtration"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=furner-pardoe-2020.r1&span=span-2020-reconstruction) · `span-2020-reconstruction` · UTF-16 [27382, 28087).
> The crushed onion and garlic were then combined with equal volumes of wine (Pennard’s organic dry white, 11% ABV, sourced from Avalon Vineyard, Shepton Mallet) and bovine bile salts (Sigma Aldrich) made up to 89 mg·ml−1 in water and sterilised by exposing to UV radiation for 10 min (Carlton Germicidal Cabinet fitted with a 2537 Å, 8-W UV tube). The mixture was stored in sterilised glass bottles in the dark at 4 °C for 9 days, after which it was strained and centrifuged for 5 min at 1,811 g. The supernatant was then filtered using Whatman 1,001–110 Grade 1 Qualitative Filter Paper, Diameter: 11 cm, Pore Size: 11 μm. Filtered Bald’s eyesalve was stored in sterilised glass vials in the dark at 4 °C.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=furner-pardoe-2020.r1&span=span-cropleac-ambiguity) · `span-cropleac-ambiguity` · UTF-16 [5621, 6309).
> The meaning of Old English cropleac, as used in the original remedy, is ambiguous and may refer to a variety of Allium species22,23. Two likely translations are onion (Allium cepa) or leek (Allium porrum). For this reason, multiple batches of the remedy using either Allium species were made in our laboratory between 2014 and 2019. After the 9-day brewing period, the activity of the remedies was tested against mature biofilms of S. aureus Newman in an in vivo-like model of a soft tissue wound. In this assay, 24-h-old biofilms, that have been grown at 37 °C in collagen-based synthetic wounds, are exposed to Bald’s eyesalve or water for 24 h, and surviving bacteria are counted19,24.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2020-eso-newman-context

- [ ] Human check: **S. aureus Newman · synthetic wound biofilm** — `recorded`, field `assay.context`.
- Value/reason: {"organism":"Staphylococcus aureus","strain":"Newman","model":"collagen-based synthetic soft-tissue wound biofilm","biofilmAge":"24 h","treatmentExposure":"24 h","setting":"in vitro"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=furner-pardoe-2020.r1&span=span-cropleac-ambiguity) · `span-cropleac-ambiguity` · UTF-16 [5621, 6309).
> The meaning of Old English cropleac, as used in the original remedy, is ambiguous and may refer to a variety of Allium species22,23. Two likely translations are onion (Allium cepa) or leek (Allium porrum). For this reason, multiple batches of the remedy using either Allium species were made in our laboratory between 2014 and 2019. After the 9-day brewing period, the activity of the remedies was tested against mature biofilms of S. aureus Newman in an in vivo-like model of a soft tissue wound. In this assay, 24-h-old biofilms, that have been grown at 37 °C in collagen-based synthetic wounds, are exposed to Bald’s eyesalve or water for 24 h, and surviving bacteria are counted19,24.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=furner-pardoe-2020.r1&span=span-2020-paired) · `span-2020-paired` · UTF-16 [6311, 7361).
> In total, 75 batches of Bald’s eyesalve were made, including 15 pairs of batches where onion (ESO) and leek (ESL) variants were made at the same time, using the same garlic, wine and bile. As shown in Fig. 1A, biofilm killing was achieved by 14/15 paired batches, with 22/30 preparations causing a > 3-log drop in viable bacteria, when compared with water-treated control biofilms. The mean log drop was not significantly different between paired ESO and ESL batches (paired t-test t14 = 0.025, p = 0.981). We tested one example pair of ESO and ESL variants (batch 6) against a panel of twelve clinical isolates of S. aureus grown in the synthetic wound biofilm model. As shown in Fig. 1B, ESO consistently showed more bactericidal activity than ESL. This result may be due to the presence of antimicrobial compounds unique to onion, or it may simply be due to onions being easier to crush in a mortar and pestle, potentially making the extraction of natural compounds more efficient. To simplify further analysis, follow on work was focussed on ESO.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2020-eso-newman-comparator

- [ ] Human check: **Water-treated control** — `recorded`, field `assay.comparator`.
- Value/reason: "Sterile water-treated synthetic wounds"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=furner-pardoe-2020.r1&span=span-2020-paired) · `span-2020-paired` · UTF-16 [6311, 7361).
> In total, 75 batches of Bald’s eyesalve were made, including 15 pairs of batches where onion (ESO) and leek (ESL) variants were made at the same time, using the same garlic, wine and bile. As shown in Fig. 1A, biofilm killing was achieved by 14/15 paired batches, with 22/30 preparations causing a > 3-log drop in viable bacteria, when compared with water-treated control biofilms. The mean log drop was not significantly different between paired ESO and ESL batches (paired t-test t14 = 0.025, p = 0.981). We tested one example pair of ESO and ESL variants (batch 6) against a panel of twelve clinical isolates of S. aureus grown in the synthetic wound biofilm model. As shown in Fig. 1B, ESO consistently showed more bactericidal activity than ESL. This result may be due to the presence of antimicrobial compounds unique to onion, or it may simply be due to onions being easier to crush in a mortar and pestle, potentially making the extraction of natural compounds more efficient. To simplify further analysis, follow on work was focussed on ESO.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2020-eso-newman-endpoint

- [ ] Human check: **Log change in viable bacteria** — `recorded`, field `assay.endpoint`.
- Value/reason: "CFU-based log change relative to control; 15 paired batches, not 15 independent studies"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=furner-pardoe-2020.r1&span=span-2020-paired) · `span-2020-paired` · UTF-16 [6311, 7361).
> In total, 75 batches of Bald’s eyesalve were made, including 15 pairs of batches where onion (ESO) and leek (ESL) variants were made at the same time, using the same garlic, wine and bile. As shown in Fig. 1A, biofilm killing was achieved by 14/15 paired batches, with 22/30 preparations causing a > 3-log drop in viable bacteria, when compared with water-treated control biofilms. The mean log drop was not significantly different between paired ESO and ESL batches (paired t-test t14 = 0.025, p = 0.981). We tested one example pair of ESO and ESL variants (batch 6) against a panel of twelve clinical isolates of S. aureus grown in the synthetic wound biofilm model. As shown in Fig. 1B, ESO consistently showed more bactericidal activity than ESL. This result may be due to the presence of antimicrobial compounds unique to onion, or it may simply be due to onions being easier to crush in a mortar and pestle, potentially making the extraction of natural compounds more efficient. To simplify further analysis, follow on work was focussed on ESO.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2020-eso-newman-outcome

- [ ] Human check: **Arm-specific numerical outcome** — `unknown`, field `outcome.reported`.
- Value/reason: not_reviewed
- Rationale: The paper reports a paired-batch analysis. Individual arm values have not been independently extracted from its data supplement; pooled findings must not be assigned to every arm.
- Source scope: `furner-pardoe-2020.r1` / displayText. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2020-esl-newman-composition

- [ ] Human check: **ESL: documented variant** — `recorded`, field `material.composition`.
- Value/reason: {"cropleacInterpretation":"Allium porrum (leek)","garlic":true,"wine":true,"bovineBileSalts":true}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=furner-pardoe-2020.r1&span=span-cropleac-ambiguity) · `span-cropleac-ambiguity` · UTF-16 [5621, 6309).
> The meaning of Old English cropleac, as used in the original remedy, is ambiguous and may refer to a variety of Allium species22,23. Two likely translations are onion (Allium cepa) or leek (Allium porrum). For this reason, multiple batches of the remedy using either Allium species were made in our laboratory between 2014 and 2019. After the 9-day brewing period, the activity of the remedies was tested against mature biofilms of S. aureus Newman in an in vivo-like model of a soft tissue wound. In this assay, 24-h-old biofilms, that have been grown at 37 °C in collagen-based synthetic wounds, are exposed to Bald’s eyesalve or water for 24 h, and surviving bacteria are counted19,24.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=furner-pardoe-2020.r1&span=span-2020-reconstruction) · `span-2020-reconstruction` · UTF-16 [27382, 28087).
> The crushed onion and garlic were then combined with equal volumes of wine (Pennard’s organic dry white, 11% ABV, sourced from Avalon Vineyard, Shepton Mallet) and bovine bile salts (Sigma Aldrich) made up to 89 mg·ml−1 in water and sterilised by exposing to UV radiation for 10 min (Carlton Germicidal Cabinet fitted with a 2537 Å, 8-W UV tube). The mixture was stored in sterilised glass bottles in the dark at 4 °C for 9 days, after which it was strained and centrifuged for 5 min at 1,811 g. The supernatant was then filtered using Whatman 1,001–110 Grade 1 Qualitative Filter Paper, Diameter: 11 cm, Pore Size: 11 μm. Filtered Bald’s eyesalve was stored in sterilised glass vials in the dark at 4 °C.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2020-esl-newman-preparation

- [ ] Human check: **2020 reconstruction process** — `recorded`, field `preparation.processing`.
- Value/reason: "Nine-day brewing; reconstruction methods report 4 °C, glass, prepared bile salts, straining, centrifugation and filtration"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=furner-pardoe-2020.r1&span=span-2020-reconstruction) · `span-2020-reconstruction` · UTF-16 [27382, 28087).
> The crushed onion and garlic were then combined with equal volumes of wine (Pennard’s organic dry white, 11% ABV, sourced from Avalon Vineyard, Shepton Mallet) and bovine bile salts (Sigma Aldrich) made up to 89 mg·ml−1 in water and sterilised by exposing to UV radiation for 10 min (Carlton Germicidal Cabinet fitted with a 2537 Å, 8-W UV tube). The mixture was stored in sterilised glass bottles in the dark at 4 °C for 9 days, after which it was strained and centrifuged for 5 min at 1,811 g. The supernatant was then filtered using Whatman 1,001–110 Grade 1 Qualitative Filter Paper, Diameter: 11 cm, Pore Size: 11 μm. Filtered Bald’s eyesalve was stored in sterilised glass vials in the dark at 4 °C.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=furner-pardoe-2020.r1&span=span-cropleac-ambiguity) · `span-cropleac-ambiguity` · UTF-16 [5621, 6309).
> The meaning of Old English cropleac, as used in the original remedy, is ambiguous and may refer to a variety of Allium species22,23. Two likely translations are onion (Allium cepa) or leek (Allium porrum). For this reason, multiple batches of the remedy using either Allium species were made in our laboratory between 2014 and 2019. After the 9-day brewing period, the activity of the remedies was tested against mature biofilms of S. aureus Newman in an in vivo-like model of a soft tissue wound. In this assay, 24-h-old biofilms, that have been grown at 37 °C in collagen-based synthetic wounds, are exposed to Bald’s eyesalve or water for 24 h, and surviving bacteria are counted19,24.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2020-esl-newman-context

- [ ] Human check: **S. aureus Newman · synthetic wound biofilm** — `recorded`, field `assay.context`.
- Value/reason: {"organism":"Staphylococcus aureus","strain":"Newman","model":"collagen-based synthetic soft-tissue wound biofilm","biofilmAge":"24 h","treatmentExposure":"24 h","setting":"in vitro"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=furner-pardoe-2020.r1&span=span-cropleac-ambiguity) · `span-cropleac-ambiguity` · UTF-16 [5621, 6309).
> The meaning of Old English cropleac, as used in the original remedy, is ambiguous and may refer to a variety of Allium species22,23. Two likely translations are onion (Allium cepa) or leek (Allium porrum). For this reason, multiple batches of the remedy using either Allium species were made in our laboratory between 2014 and 2019. After the 9-day brewing period, the activity of the remedies was tested against mature biofilms of S. aureus Newman in an in vivo-like model of a soft tissue wound. In this assay, 24-h-old biofilms, that have been grown at 37 °C in collagen-based synthetic wounds, are exposed to Bald’s eyesalve or water for 24 h, and surviving bacteria are counted19,24.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=furner-pardoe-2020.r1&span=span-2020-paired) · `span-2020-paired` · UTF-16 [6311, 7361).
> In total, 75 batches of Bald’s eyesalve were made, including 15 pairs of batches where onion (ESO) and leek (ESL) variants were made at the same time, using the same garlic, wine and bile. As shown in Fig. 1A, biofilm killing was achieved by 14/15 paired batches, with 22/30 preparations causing a > 3-log drop in viable bacteria, when compared with water-treated control biofilms. The mean log drop was not significantly different between paired ESO and ESL batches (paired t-test t14 = 0.025, p = 0.981). We tested one example pair of ESO and ESL variants (batch 6) against a panel of twelve clinical isolates of S. aureus grown in the synthetic wound biofilm model. As shown in Fig. 1B, ESO consistently showed more bactericidal activity than ESL. This result may be due to the presence of antimicrobial compounds unique to onion, or it may simply be due to onions being easier to crush in a mortar and pestle, potentially making the extraction of natural compounds more efficient. To simplify further analysis, follow on work was focussed on ESO.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2020-esl-newman-comparator

- [ ] Human check: **Water-treated control** — `recorded`, field `assay.comparator`.
- Value/reason: "Sterile water-treated synthetic wounds"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=furner-pardoe-2020.r1&span=span-2020-paired) · `span-2020-paired` · UTF-16 [6311, 7361).
> In total, 75 batches of Bald’s eyesalve were made, including 15 pairs of batches where onion (ESO) and leek (ESL) variants were made at the same time, using the same garlic, wine and bile. As shown in Fig. 1A, biofilm killing was achieved by 14/15 paired batches, with 22/30 preparations causing a > 3-log drop in viable bacteria, when compared with water-treated control biofilms. The mean log drop was not significantly different between paired ESO and ESL batches (paired t-test t14 = 0.025, p = 0.981). We tested one example pair of ESO and ESL variants (batch 6) against a panel of twelve clinical isolates of S. aureus grown in the synthetic wound biofilm model. As shown in Fig. 1B, ESO consistently showed more bactericidal activity than ESL. This result may be due to the presence of antimicrobial compounds unique to onion, or it may simply be due to onions being easier to crush in a mortar and pestle, potentially making the extraction of natural compounds more efficient. To simplify further analysis, follow on work was focussed on ESO.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2020-esl-newman-endpoint

- [ ] Human check: **Log change in viable bacteria** — `recorded`, field `assay.endpoint`.
- Value/reason: "CFU-based log change relative to control; 15 paired batches, not 15 independent studies"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/balds-eyesalve/source?source=furner-pardoe-2020.r1&span=span-2020-paired) · `span-2020-paired` · UTF-16 [6311, 7361).
> In total, 75 batches of Bald’s eyesalve were made, including 15 pairs of batches where onion (ESO) and leek (ESL) variants were made at the same time, using the same garlic, wine and bile. As shown in Fig. 1A, biofilm killing was achieved by 14/15 paired batches, with 22/30 preparations causing a > 3-log drop in viable bacteria, when compared with water-treated control biofilms. The mean log drop was not significantly different between paired ESO and ESL batches (paired t-test t14 = 0.025, p = 0.981). We tested one example pair of ESO and ESL variants (batch 6) against a panel of twelve clinical isolates of S. aureus grown in the synthetic wound biofilm model. As shown in Fig. 1B, ESO consistently showed more bactericidal activity than ESL. This result may be due to the presence of antimicrobial compounds unique to onion, or it may simply be due to onions being easier to crush in a mortar and pestle, potentially making the extraction of natural compounds more efficient. To simplify further analysis, follow on work was focussed on ESO.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2020-esl-newman-outcome

- [ ] Human check: **Arm-specific numerical outcome** — `unknown`, field `outcome.reported`.
- Value/reason: not_reviewed
- Rationale: The paper reports a paired-batch analysis. Individual arm values have not been independently extracted from its data supplement; pooled findings must not be assigned to every arm.
- Source scope: `furner-pardoe-2020.r1` / displayText. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-2023-RWV1-material

- [ ] Human check: **RWV1 + MediHoney** — `recorded`, field `material.composition`.
- Value/reason: {"vinegar":"RWV1","honey":"MediHoney product #31805, 80% Leptospermum honey dressing","finalAceticAcid":"0.5%","finalHoneyGel":"30% w/v","totalTreatmentVolume":"100 µL"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-honeys) · `span-2023-honeys` · UTF-16 [16001, 16515).
> Two commercially available medical-grade honey preparations were used, MediHoney (product #31805 80 % Leptospermum honey wound and burn dressing; Dermasciences) and Revamil (100 % honey gel for wound treatment; Oswell Penda). Both of these brands appear on the British National Formulary section on wound management, which lists medicines that may be used by the UK National Health Service [32]. Both honeys were stored in their original packaging at room temperature, following the manufacturers’ recommendations.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-assay) · `span-2023-assay` · UTF-16 [20372, 22976).
> Limitations on time and resources restricted the number of vinegars that we could feasibly test in biofilm models. Based on the MIC results, we selected RWV (as an example of the group of vinegars with very similar HPLC profiles) and PV (which had a very different HPLC profile from the other vinegars) for investigation of biofilm-killing ability in an in vitro model of a soft tissue wound. To assess the dose response of biofilms to selected vinegars or acetic acid, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above in Bacterial Strains and Culture Conditions, and then treated topically with different doses of either water, pure acetic acid, RWV1, RWV2, PV1 or PV2 by pipetting 100 µl of the test substance onto the top of the wound (see Table 1 for key to vinegar types). Doses were tested in triplicate for each species. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment. RWV2 and PV2, plus water controls, were tested in a second experiment; the work was divided into two experiments due to the labour-intensive nature of working with the wound model. After 24 h of exposure to the treatments, the collagen in the wounds was digested to release bacteria by adding 300 µl of 0.5 mg ml−1 collagenase type 1 (EMD Millipore) and incubating for 1 h at 37 °C. Digested wounds were mixed by pipetting, serially diluted in PBS and plated on LB agar. The number of viable bacteria in each biofilm was estimated using colony counts. To assess the combined effects of selected vinegars or acetic acid+medical-grade honey on biofilms, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above, and then treated topically with either water; RWV1, PV1, RWV2, PV2 or acetic acid at concentrations corresponding to 0.5 % acetic acid; 30 % (w/v) MediHoney 80 % gel; 30 % (w/v) Revamil 100 % honey gel; or each honey gel combined with each vinegar/acetic acid. In all cases, the total treatment volume was 100 µl, the final concentration of acetic acid was 0.5 % and the final concentration of honey gel was 30 %. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment; RWV2 and PV2, plus water controls, were tested in a second experiment. Each treatment was added to triplicate wounds containing P. aeruginosa and triplicate wounds containing S. aureus . Treated biofilms were incubated at 37 °C for 24 h, and then wounds were enzymatically digested, diluted and plated, as in the dose–response experiment. The two synergy experiments were replicated using fresh starter cultures of each bacterium.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2023-rwv1-medihoney-pa-context

- [ ] Human check: **P. aeruginosa · synthetic wound biofilm** — `recorded`, field `assay.context`.
- Value/reason: {"organism":"P. aeruginosa","model":"synthetic soft-tissue wound biofilm","exposure":"37 °C for 24 h","setting":"in vitro","strain":"not yet independently curated"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-assay) · `span-2023-assay` · UTF-16 [20372, 22976).
> Limitations on time and resources restricted the number of vinegars that we could feasibly test in biofilm models. Based on the MIC results, we selected RWV (as an example of the group of vinegars with very similar HPLC profiles) and PV (which had a very different HPLC profile from the other vinegars) for investigation of biofilm-killing ability in an in vitro model of a soft tissue wound. To assess the dose response of biofilms to selected vinegars or acetic acid, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above in Bacterial Strains and Culture Conditions, and then treated topically with different doses of either water, pure acetic acid, RWV1, RWV2, PV1 or PV2 by pipetting 100 µl of the test substance onto the top of the wound (see Table 1 for key to vinegar types). Doses were tested in triplicate for each species. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment. RWV2 and PV2, plus water controls, were tested in a second experiment; the work was divided into two experiments due to the labour-intensive nature of working with the wound model. After 24 h of exposure to the treatments, the collagen in the wounds was digested to release bacteria by adding 300 µl of 0.5 mg ml−1 collagenase type 1 (EMD Millipore) and incubating for 1 h at 37 °C. Digested wounds were mixed by pipetting, serially diluted in PBS and plated on LB agar. The number of viable bacteria in each biofilm was estimated using colony counts. To assess the combined effects of selected vinegars or acetic acid+medical-grade honey on biofilms, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above, and then treated topically with either water; RWV1, PV1, RWV2, PV2 or acetic acid at concentrations corresponding to 0.5 % acetic acid; 30 % (w/v) MediHoney 80 % gel; 30 % (w/v) Revamil 100 % honey gel; or each honey gel combined with each vinegar/acetic acid. In all cases, the total treatment volume was 100 µl, the final concentration of acetic acid was 0.5 % and the final concentration of honey gel was 30 %. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment; RWV2 and PV2, plus water controls, were tested in a second experiment. Each treatment was added to triplicate wounds containing P. aeruginosa and triplicate wounds containing S. aureus . Treated biofilms were incubated at 37 °C for 24 h, and then wounds were enzymatically digested, diluted and plated, as in the dose–response experiment. The two synergy experiments were replicated using fresh starter cultures of each bacterium.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2023-rwv1-medihoney-pa-comparator

- [ ] Human check: **Experimental and additivity controls** — `recorded`, field `assay.comparator`.
- Value/reason: "Water; individual acid and honey treatments; Response Additivity and Bliss Independence models"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-assay) · `span-2023-assay` · UTF-16 [20372, 22976).
> Limitations on time and resources restricted the number of vinegars that we could feasibly test in biofilm models. Based on the MIC results, we selected RWV (as an example of the group of vinegars with very similar HPLC profiles) and PV (which had a very different HPLC profile from the other vinegars) for investigation of biofilm-killing ability in an in vitro model of a soft tissue wound. To assess the dose response of biofilms to selected vinegars or acetic acid, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above in Bacterial Strains and Culture Conditions, and then treated topically with different doses of either water, pure acetic acid, RWV1, RWV2, PV1 or PV2 by pipetting 100 µl of the test substance onto the top of the wound (see Table 1 for key to vinegar types). Doses were tested in triplicate for each species. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment. RWV2 and PV2, plus water controls, were tested in a second experiment; the work was divided into two experiments due to the labour-intensive nature of working with the wound model. After 24 h of exposure to the treatments, the collagen in the wounds was digested to release bacteria by adding 300 µl of 0.5 mg ml−1 collagenase type 1 (EMD Millipore) and incubating for 1 h at 37 °C. Digested wounds were mixed by pipetting, serially diluted in PBS and plated on LB agar. The number of viable bacteria in each biofilm was estimated using colony counts. To assess the combined effects of selected vinegars or acetic acid+medical-grade honey on biofilms, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above, and then treated topically with either water; RWV1, PV1, RWV2, PV2 or acetic acid at concentrations corresponding to 0.5 % acetic acid; 30 % (w/v) MediHoney 80 % gel; 30 % (w/v) Revamil 100 % honey gel; or each honey gel combined with each vinegar/acetic acid. In all cases, the total treatment volume was 100 µl, the final concentration of acetic acid was 0.5 % and the final concentration of honey gel was 30 %. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment; RWV2 and PV2, plus water controls, were tested in a second experiment. Each treatment was added to triplicate wounds containing P. aeruginosa and triplicate wounds containing S. aureus . Treated biofilms were incubated at 37 °C for 24 h, and then wounds were enzymatically digested, diluted and plated, as in the dose–response experiment. The two synergy experiments were replicated using fresh starter cultures of each bacterium.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-response-additivity) · `span-2023-response-additivity` · UTF-16 [43215, 44474).
> Under Response Additivity, the combined effect of non-interacting agents should be the sum of their individual effects: i.e. if A causes an alog10 kill and B causes a blog10 kill, Response Additivity should produce an (a+b)log10 kill [63]. Synergy would produce a greater than (a+b)log10 kill, and antagonism would produce a less than (a+b)log10 kill. We therefore calculated the predicted viable c.f.u. count for each combination treatment under Response Additivity, shown as horizontal black bars on the plots in Fig. 6. By plotting the 95 % confidence interval around the observed mean c.f.u. in each combination treatment, we can see whether the observed c.f.u. is significantly less than or greater than the predicted c.f.u. under Response Additivity. Using this method, we concluded that PV2 showed synergistic activity with MediHoney and Revamil against P. aeruginosa biofilms; however, the magnitude of this effect for Revamil was very small and probably not biologically meaningful (Fig. 6c). For S. aureus biofilms, acetic acid, RWV1, PV1 and PV2 showed synergistic activity with MediHoney, although this effect was very small for PV1. None of the vinegars, nor acetic acid, showed any meaningful synergy with Revamil against S. aureus (Fig. 6b, d).
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-bliss) · `span-2023-bliss` · UTF-16 [44476, 45249).
> Under Bliss Independence, if A and B act independently (additively), and the probability of being a cell being killed (fractional change in viable cells) by A is p(A) and the probability of being a cell being killed by B is p(B), then independent action results in a fractional decrease in viable cells under combination treatment of p(A)+p(B)−[p(A)×p(B)] [60]. This leads to the predicted mean c.f.u. indicated by the horizontal grey bars in Fig. 6; under the Bliss null model, there is no major change in our conclusions; the only difference related to the two cases where Response Additivity showed statistically significant but very slight synergy (PV1+Revamil in Fig. 6c, PV2+Revamil in Fig. 6d); neither of these combinations was synergistic under Bliss Independence.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2023-rwv1-medihoney-pa-endpoint

- [ ] Human check: **Viable CFU and model-dependent interaction** — `recorded`, field `assay.endpoint`.
- Value/reason: "Colony counts after digestion, dilution and plating; synergy is assessed against an explicitly named null model"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-assay) · `span-2023-assay` · UTF-16 [20372, 22976).
> Limitations on time and resources restricted the number of vinegars that we could feasibly test in biofilm models. Based on the MIC results, we selected RWV (as an example of the group of vinegars with very similar HPLC profiles) and PV (which had a very different HPLC profile from the other vinegars) for investigation of biofilm-killing ability in an in vitro model of a soft tissue wound. To assess the dose response of biofilms to selected vinegars or acetic acid, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above in Bacterial Strains and Culture Conditions, and then treated topically with different doses of either water, pure acetic acid, RWV1, RWV2, PV1 or PV2 by pipetting 100 µl of the test substance onto the top of the wound (see Table 1 for key to vinegar types). Doses were tested in triplicate for each species. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment. RWV2 and PV2, plus water controls, were tested in a second experiment; the work was divided into two experiments due to the labour-intensive nature of working with the wound model. After 24 h of exposure to the treatments, the collagen in the wounds was digested to release bacteria by adding 300 µl of 0.5 mg ml−1 collagenase type 1 (EMD Millipore) and incubating for 1 h at 37 °C. Digested wounds were mixed by pipetting, serially diluted in PBS and plated on LB agar. The number of viable bacteria in each biofilm was estimated using colony counts. To assess the combined effects of selected vinegars or acetic acid+medical-grade honey on biofilms, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above, and then treated topically with either water; RWV1, PV1, RWV2, PV2 or acetic acid at concentrations corresponding to 0.5 % acetic acid; 30 % (w/v) MediHoney 80 % gel; 30 % (w/v) Revamil 100 % honey gel; or each honey gel combined with each vinegar/acetic acid. In all cases, the total treatment volume was 100 µl, the final concentration of acetic acid was 0.5 % and the final concentration of honey gel was 30 %. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment; RWV2 and PV2, plus water controls, were tested in a second experiment. Each treatment was added to triplicate wounds containing P. aeruginosa and triplicate wounds containing S. aureus . Treated biofilms were incubated at 37 °C for 24 h, and then wounds were enzymatically digested, diluted and plated, as in the dose–response experiment. The two synergy experiments were replicated using fresh starter cultures of each bacterium.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-response-additivity) · `span-2023-response-additivity` · UTF-16 [43215, 44474).
> Under Response Additivity, the combined effect of non-interacting agents should be the sum of their individual effects: i.e. if A causes an alog10 kill and B causes a blog10 kill, Response Additivity should produce an (a+b)log10 kill [63]. Synergy would produce a greater than (a+b)log10 kill, and antagonism would produce a less than (a+b)log10 kill. We therefore calculated the predicted viable c.f.u. count for each combination treatment under Response Additivity, shown as horizontal black bars on the plots in Fig. 6. By plotting the 95 % confidence interval around the observed mean c.f.u. in each combination treatment, we can see whether the observed c.f.u. is significantly less than or greater than the predicted c.f.u. under Response Additivity. Using this method, we concluded that PV2 showed synergistic activity with MediHoney and Revamil against P. aeruginosa biofilms; however, the magnitude of this effect for Revamil was very small and probably not biologically meaningful (Fig. 6c). For S. aureus biofilms, acetic acid, RWV1, PV1 and PV2 showed synergistic activity with MediHoney, although this effect was very small for PV1. None of the vinegars, nor acetic acid, showed any meaningful synergy with Revamil against S. aureus (Fig. 6b, d).
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-bliss) · `span-2023-bliss` · UTF-16 [44476, 45249).
> Under Bliss Independence, if A and B act independently (additively), and the probability of being a cell being killed (fractional change in viable cells) by A is p(A) and the probability of being a cell being killed by B is p(B), then independent action results in a fractional decrease in viable cells under combination treatment of p(A)+p(B)−[p(A)×p(B)] [60]. This leads to the predicted mean c.f.u. indicated by the horizontal grey bars in Fig. 6; under the Bliss null model, there is no major change in our conclusions; the only difference related to the two cases where Response Additivity showed statistically significant but very slight synergy (PV1+Revamil in Fig. 6c, PV2+Revamil in Fig. 6d); neither of these combinations was synergistic under Bliss Independence.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2023-rwv1-medihoney-pa-outcome

- [ ] Human check: **Arm-specific interaction outcome** — `unknown`, field `outcome.reported`.
- Value/reason: not_reviewed
- Rationale: Arm-level figure values and both null-model findings require independent review. No blanket synergy or efficacy label is assigned.
- Source scope: `harrison-2023.r1` / displayText. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2023-rwv1-medihoney-sa-context

- [ ] Human check: **S. aureus · synthetic wound biofilm** — `recorded`, field `assay.context`.
- Value/reason: {"organism":"S. aureus","model":"synthetic soft-tissue wound biofilm","exposure":"37 °C for 24 h","setting":"in vitro","strain":"not yet independently curated"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-assay) · `span-2023-assay` · UTF-16 [20372, 22976).
> Limitations on time and resources restricted the number of vinegars that we could feasibly test in biofilm models. Based on the MIC results, we selected RWV (as an example of the group of vinegars with very similar HPLC profiles) and PV (which had a very different HPLC profile from the other vinegars) for investigation of biofilm-killing ability in an in vitro model of a soft tissue wound. To assess the dose response of biofilms to selected vinegars or acetic acid, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above in Bacterial Strains and Culture Conditions, and then treated topically with different doses of either water, pure acetic acid, RWV1, RWV2, PV1 or PV2 by pipetting 100 µl of the test substance onto the top of the wound (see Table 1 for key to vinegar types). Doses were tested in triplicate for each species. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment. RWV2 and PV2, plus water controls, were tested in a second experiment; the work was divided into two experiments due to the labour-intensive nature of working with the wound model. After 24 h of exposure to the treatments, the collagen in the wounds was digested to release bacteria by adding 300 µl of 0.5 mg ml−1 collagenase type 1 (EMD Millipore) and incubating for 1 h at 37 °C. Digested wounds were mixed by pipetting, serially diluted in PBS and plated on LB agar. The number of viable bacteria in each biofilm was estimated using colony counts. To assess the combined effects of selected vinegars or acetic acid+medical-grade honey on biofilms, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above, and then treated topically with either water; RWV1, PV1, RWV2, PV2 or acetic acid at concentrations corresponding to 0.5 % acetic acid; 30 % (w/v) MediHoney 80 % gel; 30 % (w/v) Revamil 100 % honey gel; or each honey gel combined with each vinegar/acetic acid. In all cases, the total treatment volume was 100 µl, the final concentration of acetic acid was 0.5 % and the final concentration of honey gel was 30 %. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment; RWV2 and PV2, plus water controls, were tested in a second experiment. Each treatment was added to triplicate wounds containing P. aeruginosa and triplicate wounds containing S. aureus . Treated biofilms were incubated at 37 °C for 24 h, and then wounds were enzymatically digested, diluted and plated, as in the dose–response experiment. The two synergy experiments were replicated using fresh starter cultures of each bacterium.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2023-rwv1-medihoney-sa-comparator

- [ ] Human check: **Experimental and additivity controls** — `recorded`, field `assay.comparator`.
- Value/reason: "Water; individual acid and honey treatments; Response Additivity and Bliss Independence models"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-assay) · `span-2023-assay` · UTF-16 [20372, 22976).
> Limitations on time and resources restricted the number of vinegars that we could feasibly test in biofilm models. Based on the MIC results, we selected RWV (as an example of the group of vinegars with very similar HPLC profiles) and PV (which had a very different HPLC profile from the other vinegars) for investigation of biofilm-killing ability in an in vitro model of a soft tissue wound. To assess the dose response of biofilms to selected vinegars or acetic acid, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above in Bacterial Strains and Culture Conditions, and then treated topically with different doses of either water, pure acetic acid, RWV1, RWV2, PV1 or PV2 by pipetting 100 µl of the test substance onto the top of the wound (see Table 1 for key to vinegar types). Doses were tested in triplicate for each species. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment. RWV2 and PV2, plus water controls, were tested in a second experiment; the work was divided into two experiments due to the labour-intensive nature of working with the wound model. After 24 h of exposure to the treatments, the collagen in the wounds was digested to release bacteria by adding 300 µl of 0.5 mg ml−1 collagenase type 1 (EMD Millipore) and incubating for 1 h at 37 °C. Digested wounds were mixed by pipetting, serially diluted in PBS and plated on LB agar. The number of viable bacteria in each biofilm was estimated using colony counts. To assess the combined effects of selected vinegars or acetic acid+medical-grade honey on biofilms, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above, and then treated topically with either water; RWV1, PV1, RWV2, PV2 or acetic acid at concentrations corresponding to 0.5 % acetic acid; 30 % (w/v) MediHoney 80 % gel; 30 % (w/v) Revamil 100 % honey gel; or each honey gel combined with each vinegar/acetic acid. In all cases, the total treatment volume was 100 µl, the final concentration of acetic acid was 0.5 % and the final concentration of honey gel was 30 %. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment; RWV2 and PV2, plus water controls, were tested in a second experiment. Each treatment was added to triplicate wounds containing P. aeruginosa and triplicate wounds containing S. aureus . Treated biofilms were incubated at 37 °C for 24 h, and then wounds were enzymatically digested, diluted and plated, as in the dose–response experiment. The two synergy experiments were replicated using fresh starter cultures of each bacterium.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-response-additivity) · `span-2023-response-additivity` · UTF-16 [43215, 44474).
> Under Response Additivity, the combined effect of non-interacting agents should be the sum of their individual effects: i.e. if A causes an alog10 kill and B causes a blog10 kill, Response Additivity should produce an (a+b)log10 kill [63]. Synergy would produce a greater than (a+b)log10 kill, and antagonism would produce a less than (a+b)log10 kill. We therefore calculated the predicted viable c.f.u. count for each combination treatment under Response Additivity, shown as horizontal black bars on the plots in Fig. 6. By plotting the 95 % confidence interval around the observed mean c.f.u. in each combination treatment, we can see whether the observed c.f.u. is significantly less than or greater than the predicted c.f.u. under Response Additivity. Using this method, we concluded that PV2 showed synergistic activity with MediHoney and Revamil against P. aeruginosa biofilms; however, the magnitude of this effect for Revamil was very small and probably not biologically meaningful (Fig. 6c). For S. aureus biofilms, acetic acid, RWV1, PV1 and PV2 showed synergistic activity with MediHoney, although this effect was very small for PV1. None of the vinegars, nor acetic acid, showed any meaningful synergy with Revamil against S. aureus (Fig. 6b, d).
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-bliss) · `span-2023-bliss` · UTF-16 [44476, 45249).
> Under Bliss Independence, if A and B act independently (additively), and the probability of being a cell being killed (fractional change in viable cells) by A is p(A) and the probability of being a cell being killed by B is p(B), then independent action results in a fractional decrease in viable cells under combination treatment of p(A)+p(B)−[p(A)×p(B)] [60]. This leads to the predicted mean c.f.u. indicated by the horizontal grey bars in Fig. 6; under the Bliss null model, there is no major change in our conclusions; the only difference related to the two cases where Response Additivity showed statistically significant but very slight synergy (PV1+Revamil in Fig. 6c, PV2+Revamil in Fig. 6d); neither of these combinations was synergistic under Bliss Independence.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2023-rwv1-medihoney-sa-endpoint

- [ ] Human check: **Viable CFU and model-dependent interaction** — `recorded`, field `assay.endpoint`.
- Value/reason: "Colony counts after digestion, dilution and plating; synergy is assessed against an explicitly named null model"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-assay) · `span-2023-assay` · UTF-16 [20372, 22976).
> Limitations on time and resources restricted the number of vinegars that we could feasibly test in biofilm models. Based on the MIC results, we selected RWV (as an example of the group of vinegars with very similar HPLC profiles) and PV (which had a very different HPLC profile from the other vinegars) for investigation of biofilm-killing ability in an in vitro model of a soft tissue wound. To assess the dose response of biofilms to selected vinegars or acetic acid, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above in Bacterial Strains and Culture Conditions, and then treated topically with different doses of either water, pure acetic acid, RWV1, RWV2, PV1 or PV2 by pipetting 100 µl of the test substance onto the top of the wound (see Table 1 for key to vinegar types). Doses were tested in triplicate for each species. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment. RWV2 and PV2, plus water controls, were tested in a second experiment; the work was divided into two experiments due to the labour-intensive nature of working with the wound model. After 24 h of exposure to the treatments, the collagen in the wounds was digested to release bacteria by adding 300 µl of 0.5 mg ml−1 collagenase type 1 (EMD Millipore) and incubating for 1 h at 37 °C. Digested wounds were mixed by pipetting, serially diluted in PBS and plated on LB agar. The number of viable bacteria in each biofilm was estimated using colony counts. To assess the combined effects of selected vinegars or acetic acid+medical-grade honey on biofilms, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above, and then treated topically with either water; RWV1, PV1, RWV2, PV2 or acetic acid at concentrations corresponding to 0.5 % acetic acid; 30 % (w/v) MediHoney 80 % gel; 30 % (w/v) Revamil 100 % honey gel; or each honey gel combined with each vinegar/acetic acid. In all cases, the total treatment volume was 100 µl, the final concentration of acetic acid was 0.5 % and the final concentration of honey gel was 30 %. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment; RWV2 and PV2, plus water controls, were tested in a second experiment. Each treatment was added to triplicate wounds containing P. aeruginosa and triplicate wounds containing S. aureus . Treated biofilms were incubated at 37 °C for 24 h, and then wounds were enzymatically digested, diluted and plated, as in the dose–response experiment. The two synergy experiments were replicated using fresh starter cultures of each bacterium.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-response-additivity) · `span-2023-response-additivity` · UTF-16 [43215, 44474).
> Under Response Additivity, the combined effect of non-interacting agents should be the sum of their individual effects: i.e. if A causes an alog10 kill and B causes a blog10 kill, Response Additivity should produce an (a+b)log10 kill [63]. Synergy would produce a greater than (a+b)log10 kill, and antagonism would produce a less than (a+b)log10 kill. We therefore calculated the predicted viable c.f.u. count for each combination treatment under Response Additivity, shown as horizontal black bars on the plots in Fig. 6. By plotting the 95 % confidence interval around the observed mean c.f.u. in each combination treatment, we can see whether the observed c.f.u. is significantly less than or greater than the predicted c.f.u. under Response Additivity. Using this method, we concluded that PV2 showed synergistic activity with MediHoney and Revamil against P. aeruginosa biofilms; however, the magnitude of this effect for Revamil was very small and probably not biologically meaningful (Fig. 6c). For S. aureus biofilms, acetic acid, RWV1, PV1 and PV2 showed synergistic activity with MediHoney, although this effect was very small for PV1. None of the vinegars, nor acetic acid, showed any meaningful synergy with Revamil against S. aureus (Fig. 6b, d).
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-bliss) · `span-2023-bliss` · UTF-16 [44476, 45249).
> Under Bliss Independence, if A and B act independently (additively), and the probability of being a cell being killed (fractional change in viable cells) by A is p(A) and the probability of being a cell being killed by B is p(B), then independent action results in a fractional decrease in viable cells under combination treatment of p(A)+p(B)−[p(A)×p(B)] [60]. This leads to the predicted mean c.f.u. indicated by the horizontal grey bars in Fig. 6; under the Bliss null model, there is no major change in our conclusions; the only difference related to the two cases where Response Additivity showed statistically significant but very slight synergy (PV1+Revamil in Fig. 6c, PV2+Revamil in Fig. 6d); neither of these combinations was synergistic under Bliss Independence.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2023-rwv1-medihoney-sa-outcome

- [ ] Human check: **Arm-specific interaction outcome** — `unknown`, field `outcome.reported`.
- Value/reason: not_reviewed
- Rationale: Arm-level figure values and both null-model findings require independent review. No blanket synergy or efficacy label is assigned.
- Source scope: `harrison-2023.r1` / displayText. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.
- Reviewer / qualification / date / decision / rationale: **pending**

### a-2023-PV1-material

- [ ] Human check: **PV1 + MediHoney** — `recorded`, field `material.composition`.
- Value/reason: {"vinegar":"PV1","honey":"MediHoney product #31805, 80% Leptospermum honey dressing","finalAceticAcid":"0.5%","finalHoneyGel":"30% w/v","totalTreatmentVolume":"100 µL"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-honeys) · `span-2023-honeys` · UTF-16 [16001, 16515).
> Two commercially available medical-grade honey preparations were used, MediHoney (product #31805 80 % Leptospermum honey wound and burn dressing; Dermasciences) and Revamil (100 % honey gel for wound treatment; Oswell Penda). Both of these brands appear on the British National Formulary section on wound management, which lists medicines that may be used by the UK National Health Service [32]. Both honeys were stored in their original packaging at room temperature, following the manufacturers’ recommendations.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-assay) · `span-2023-assay` · UTF-16 [20372, 22976).
> Limitations on time and resources restricted the number of vinegars that we could feasibly test in biofilm models. Based on the MIC results, we selected RWV (as an example of the group of vinegars with very similar HPLC profiles) and PV (which had a very different HPLC profile from the other vinegars) for investigation of biofilm-killing ability in an in vitro model of a soft tissue wound. To assess the dose response of biofilms to selected vinegars or acetic acid, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above in Bacterial Strains and Culture Conditions, and then treated topically with different doses of either water, pure acetic acid, RWV1, RWV2, PV1 or PV2 by pipetting 100 µl of the test substance onto the top of the wound (see Table 1 for key to vinegar types). Doses were tested in triplicate for each species. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment. RWV2 and PV2, plus water controls, were tested in a second experiment; the work was divided into two experiments due to the labour-intensive nature of working with the wound model. After 24 h of exposure to the treatments, the collagen in the wounds was digested to release bacteria by adding 300 µl of 0.5 mg ml−1 collagenase type 1 (EMD Millipore) and incubating for 1 h at 37 °C. Digested wounds were mixed by pipetting, serially diluted in PBS and plated on LB agar. The number of viable bacteria in each biofilm was estimated using colony counts. To assess the combined effects of selected vinegars or acetic acid+medical-grade honey on biofilms, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above, and then treated topically with either water; RWV1, PV1, RWV2, PV2 or acetic acid at concentrations corresponding to 0.5 % acetic acid; 30 % (w/v) MediHoney 80 % gel; 30 % (w/v) Revamil 100 % honey gel; or each honey gel combined with each vinegar/acetic acid. In all cases, the total treatment volume was 100 µl, the final concentration of acetic acid was 0.5 % and the final concentration of honey gel was 30 %. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment; RWV2 and PV2, plus water controls, were tested in a second experiment. Each treatment was added to triplicate wounds containing P. aeruginosa and triplicate wounds containing S. aureus . Treated biofilms were incubated at 37 °C for 24 h, and then wounds were enzymatically digested, diluted and plated, as in the dose–response experiment. The two synergy experiments were replicated using fresh starter cultures of each bacterium.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2023-pv1-medihoney-pa-context

- [ ] Human check: **P. aeruginosa · synthetic wound biofilm** — `recorded`, field `assay.context`.
- Value/reason: {"organism":"P. aeruginosa","model":"synthetic soft-tissue wound biofilm","exposure":"37 °C for 24 h","setting":"in vitro","strain":"not yet independently curated"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-assay) · `span-2023-assay` · UTF-16 [20372, 22976).
> Limitations on time and resources restricted the number of vinegars that we could feasibly test in biofilm models. Based on the MIC results, we selected RWV (as an example of the group of vinegars with very similar HPLC profiles) and PV (which had a very different HPLC profile from the other vinegars) for investigation of biofilm-killing ability in an in vitro model of a soft tissue wound. To assess the dose response of biofilms to selected vinegars or acetic acid, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above in Bacterial Strains and Culture Conditions, and then treated topically with different doses of either water, pure acetic acid, RWV1, RWV2, PV1 or PV2 by pipetting 100 µl of the test substance onto the top of the wound (see Table 1 for key to vinegar types). Doses were tested in triplicate for each species. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment. RWV2 and PV2, plus water controls, were tested in a second experiment; the work was divided into two experiments due to the labour-intensive nature of working with the wound model. After 24 h of exposure to the treatments, the collagen in the wounds was digested to release bacteria by adding 300 µl of 0.5 mg ml−1 collagenase type 1 (EMD Millipore) and incubating for 1 h at 37 °C. Digested wounds were mixed by pipetting, serially diluted in PBS and plated on LB agar. The number of viable bacteria in each biofilm was estimated using colony counts. To assess the combined effects of selected vinegars or acetic acid+medical-grade honey on biofilms, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above, and then treated topically with either water; RWV1, PV1, RWV2, PV2 or acetic acid at concentrations corresponding to 0.5 % acetic acid; 30 % (w/v) MediHoney 80 % gel; 30 % (w/v) Revamil 100 % honey gel; or each honey gel combined with each vinegar/acetic acid. In all cases, the total treatment volume was 100 µl, the final concentration of acetic acid was 0.5 % and the final concentration of honey gel was 30 %. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment; RWV2 and PV2, plus water controls, were tested in a second experiment. Each treatment was added to triplicate wounds containing P. aeruginosa and triplicate wounds containing S. aureus . Treated biofilms were incubated at 37 °C for 24 h, and then wounds were enzymatically digested, diluted and plated, as in the dose–response experiment. The two synergy experiments were replicated using fresh starter cultures of each bacterium.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2023-pv1-medihoney-pa-comparator

- [ ] Human check: **Experimental and additivity controls** — `recorded`, field `assay.comparator`.
- Value/reason: "Water; individual acid and honey treatments; Response Additivity and Bliss Independence models"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-assay) · `span-2023-assay` · UTF-16 [20372, 22976).
> Limitations on time and resources restricted the number of vinegars that we could feasibly test in biofilm models. Based on the MIC results, we selected RWV (as an example of the group of vinegars with very similar HPLC profiles) and PV (which had a very different HPLC profile from the other vinegars) for investigation of biofilm-killing ability in an in vitro model of a soft tissue wound. To assess the dose response of biofilms to selected vinegars or acetic acid, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above in Bacterial Strains and Culture Conditions, and then treated topically with different doses of either water, pure acetic acid, RWV1, RWV2, PV1 or PV2 by pipetting 100 µl of the test substance onto the top of the wound (see Table 1 for key to vinegar types). Doses were tested in triplicate for each species. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment. RWV2 and PV2, plus water controls, were tested in a second experiment; the work was divided into two experiments due to the labour-intensive nature of working with the wound model. After 24 h of exposure to the treatments, the collagen in the wounds was digested to release bacteria by adding 300 µl of 0.5 mg ml−1 collagenase type 1 (EMD Millipore) and incubating for 1 h at 37 °C. Digested wounds were mixed by pipetting, serially diluted in PBS and plated on LB agar. The number of viable bacteria in each biofilm was estimated using colony counts. To assess the combined effects of selected vinegars or acetic acid+medical-grade honey on biofilms, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above, and then treated topically with either water; RWV1, PV1, RWV2, PV2 or acetic acid at concentrations corresponding to 0.5 % acetic acid; 30 % (w/v) MediHoney 80 % gel; 30 % (w/v) Revamil 100 % honey gel; or each honey gel combined with each vinegar/acetic acid. In all cases, the total treatment volume was 100 µl, the final concentration of acetic acid was 0.5 % and the final concentration of honey gel was 30 %. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment; RWV2 and PV2, plus water controls, were tested in a second experiment. Each treatment was added to triplicate wounds containing P. aeruginosa and triplicate wounds containing S. aureus . Treated biofilms were incubated at 37 °C for 24 h, and then wounds were enzymatically digested, diluted and plated, as in the dose–response experiment. The two synergy experiments were replicated using fresh starter cultures of each bacterium.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-response-additivity) · `span-2023-response-additivity` · UTF-16 [43215, 44474).
> Under Response Additivity, the combined effect of non-interacting agents should be the sum of their individual effects: i.e. if A causes an alog10 kill and B causes a blog10 kill, Response Additivity should produce an (a+b)log10 kill [63]. Synergy would produce a greater than (a+b)log10 kill, and antagonism would produce a less than (a+b)log10 kill. We therefore calculated the predicted viable c.f.u. count for each combination treatment under Response Additivity, shown as horizontal black bars on the plots in Fig. 6. By plotting the 95 % confidence interval around the observed mean c.f.u. in each combination treatment, we can see whether the observed c.f.u. is significantly less than or greater than the predicted c.f.u. under Response Additivity. Using this method, we concluded that PV2 showed synergistic activity with MediHoney and Revamil against P. aeruginosa biofilms; however, the magnitude of this effect for Revamil was very small and probably not biologically meaningful (Fig. 6c). For S. aureus biofilms, acetic acid, RWV1, PV1 and PV2 showed synergistic activity with MediHoney, although this effect was very small for PV1. None of the vinegars, nor acetic acid, showed any meaningful synergy with Revamil against S. aureus (Fig. 6b, d).
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-bliss) · `span-2023-bliss` · UTF-16 [44476, 45249).
> Under Bliss Independence, if A and B act independently (additively), and the probability of being a cell being killed (fractional change in viable cells) by A is p(A) and the probability of being a cell being killed by B is p(B), then independent action results in a fractional decrease in viable cells under combination treatment of p(A)+p(B)−[p(A)×p(B)] [60]. This leads to the predicted mean c.f.u. indicated by the horizontal grey bars in Fig. 6; under the Bliss null model, there is no major change in our conclusions; the only difference related to the two cases where Response Additivity showed statistically significant but very slight synergy (PV1+Revamil in Fig. 6c, PV2+Revamil in Fig. 6d); neither of these combinations was synergistic under Bliss Independence.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2023-pv1-medihoney-pa-endpoint

- [ ] Human check: **Viable CFU and model-dependent interaction** — `recorded`, field `assay.endpoint`.
- Value/reason: "Colony counts after digestion, dilution and plating; synergy is assessed against an explicitly named null model"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-assay) · `span-2023-assay` · UTF-16 [20372, 22976).
> Limitations on time and resources restricted the number of vinegars that we could feasibly test in biofilm models. Based on the MIC results, we selected RWV (as an example of the group of vinegars with very similar HPLC profiles) and PV (which had a very different HPLC profile from the other vinegars) for investigation of biofilm-killing ability in an in vitro model of a soft tissue wound. To assess the dose response of biofilms to selected vinegars or acetic acid, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above in Bacterial Strains and Culture Conditions, and then treated topically with different doses of either water, pure acetic acid, RWV1, RWV2, PV1 or PV2 by pipetting 100 µl of the test substance onto the top of the wound (see Table 1 for key to vinegar types). Doses were tested in triplicate for each species. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment. RWV2 and PV2, plus water controls, were tested in a second experiment; the work was divided into two experiments due to the labour-intensive nature of working with the wound model. After 24 h of exposure to the treatments, the collagen in the wounds was digested to release bacteria by adding 300 µl of 0.5 mg ml−1 collagenase type 1 (EMD Millipore) and incubating for 1 h at 37 °C. Digested wounds were mixed by pipetting, serially diluted in PBS and plated on LB agar. The number of viable bacteria in each biofilm was estimated using colony counts. To assess the combined effects of selected vinegars or acetic acid+medical-grade honey on biofilms, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above, and then treated topically with either water; RWV1, PV1, RWV2, PV2 or acetic acid at concentrations corresponding to 0.5 % acetic acid; 30 % (w/v) MediHoney 80 % gel; 30 % (w/v) Revamil 100 % honey gel; or each honey gel combined with each vinegar/acetic acid. In all cases, the total treatment volume was 100 µl, the final concentration of acetic acid was 0.5 % and the final concentration of honey gel was 30 %. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment; RWV2 and PV2, plus water controls, were tested in a second experiment. Each treatment was added to triplicate wounds containing P. aeruginosa and triplicate wounds containing S. aureus . Treated biofilms were incubated at 37 °C for 24 h, and then wounds were enzymatically digested, diluted and plated, as in the dose–response experiment. The two synergy experiments were replicated using fresh starter cultures of each bacterium.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-response-additivity) · `span-2023-response-additivity` · UTF-16 [43215, 44474).
> Under Response Additivity, the combined effect of non-interacting agents should be the sum of their individual effects: i.e. if A causes an alog10 kill and B causes a blog10 kill, Response Additivity should produce an (a+b)log10 kill [63]. Synergy would produce a greater than (a+b)log10 kill, and antagonism would produce a less than (a+b)log10 kill. We therefore calculated the predicted viable c.f.u. count for each combination treatment under Response Additivity, shown as horizontal black bars on the plots in Fig. 6. By plotting the 95 % confidence interval around the observed mean c.f.u. in each combination treatment, we can see whether the observed c.f.u. is significantly less than or greater than the predicted c.f.u. under Response Additivity. Using this method, we concluded that PV2 showed synergistic activity with MediHoney and Revamil against P. aeruginosa biofilms; however, the magnitude of this effect for Revamil was very small and probably not biologically meaningful (Fig. 6c). For S. aureus biofilms, acetic acid, RWV1, PV1 and PV2 showed synergistic activity with MediHoney, although this effect was very small for PV1. None of the vinegars, nor acetic acid, showed any meaningful synergy with Revamil against S. aureus (Fig. 6b, d).
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-bliss) · `span-2023-bliss` · UTF-16 [44476, 45249).
> Under Bliss Independence, if A and B act independently (additively), and the probability of being a cell being killed (fractional change in viable cells) by A is p(A) and the probability of being a cell being killed by B is p(B), then independent action results in a fractional decrease in viable cells under combination treatment of p(A)+p(B)−[p(A)×p(B)] [60]. This leads to the predicted mean c.f.u. indicated by the horizontal grey bars in Fig. 6; under the Bliss null model, there is no major change in our conclusions; the only difference related to the two cases where Response Additivity showed statistically significant but very slight synergy (PV1+Revamil in Fig. 6c, PV2+Revamil in Fig. 6d); neither of these combinations was synergistic under Bliss Independence.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2023-pv1-medihoney-pa-outcome

- [ ] Human check: **Arm-specific interaction outcome** — `unknown`, field `outcome.reported`.
- Value/reason: not_reviewed
- Rationale: Arm-level figure values and both null-model findings require independent review. No blanket synergy or efficacy label is assigned.
- Source scope: `harrison-2023.r1` / displayText. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2023-pv1-medihoney-sa-context

- [ ] Human check: **S. aureus · synthetic wound biofilm** — `recorded`, field `assay.context`.
- Value/reason: {"organism":"S. aureus","model":"synthetic soft-tissue wound biofilm","exposure":"37 °C for 24 h","setting":"in vitro","strain":"not yet independently curated"}
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-assay) · `span-2023-assay` · UTF-16 [20372, 22976).
> Limitations on time and resources restricted the number of vinegars that we could feasibly test in biofilm models. Based on the MIC results, we selected RWV (as an example of the group of vinegars with very similar HPLC profiles) and PV (which had a very different HPLC profile from the other vinegars) for investigation of biofilm-killing ability in an in vitro model of a soft tissue wound. To assess the dose response of biofilms to selected vinegars or acetic acid, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above in Bacterial Strains and Culture Conditions, and then treated topically with different doses of either water, pure acetic acid, RWV1, RWV2, PV1 or PV2 by pipetting 100 µl of the test substance onto the top of the wound (see Table 1 for key to vinegar types). Doses were tested in triplicate for each species. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment. RWV2 and PV2, plus water controls, were tested in a second experiment; the work was divided into two experiments due to the labour-intensive nature of working with the wound model. After 24 h of exposure to the treatments, the collagen in the wounds was digested to release bacteria by adding 300 µl of 0.5 mg ml−1 collagenase type 1 (EMD Millipore) and incubating for 1 h at 37 °C. Digested wounds were mixed by pipetting, serially diluted in PBS and plated on LB agar. The number of viable bacteria in each biofilm was estimated using colony counts. To assess the combined effects of selected vinegars or acetic acid+medical-grade honey on biofilms, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above, and then treated topically with either water; RWV1, PV1, RWV2, PV2 or acetic acid at concentrations corresponding to 0.5 % acetic acid; 30 % (w/v) MediHoney 80 % gel; 30 % (w/v) Revamil 100 % honey gel; or each honey gel combined with each vinegar/acetic acid. In all cases, the total treatment volume was 100 µl, the final concentration of acetic acid was 0.5 % and the final concentration of honey gel was 30 %. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment; RWV2 and PV2, plus water controls, were tested in a second experiment. Each treatment was added to triplicate wounds containing P. aeruginosa and triplicate wounds containing S. aureus . Treated biofilms were incubated at 37 °C for 24 h, and then wounds were enzymatically digested, diluted and plated, as in the dose–response experiment. The two synergy experiments were replicated using fresh starter cultures of each bacterium.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2023-pv1-medihoney-sa-comparator

- [ ] Human check: **Experimental and additivity controls** — `recorded`, field `assay.comparator`.
- Value/reason: "Water; individual acid and honey treatments; Response Additivity and Bliss Independence models"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-assay) · `span-2023-assay` · UTF-16 [20372, 22976).
> Limitations on time and resources restricted the number of vinegars that we could feasibly test in biofilm models. Based on the MIC results, we selected RWV (as an example of the group of vinegars with very similar HPLC profiles) and PV (which had a very different HPLC profile from the other vinegars) for investigation of biofilm-killing ability in an in vitro model of a soft tissue wound. To assess the dose response of biofilms to selected vinegars or acetic acid, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above in Bacterial Strains and Culture Conditions, and then treated topically with different doses of either water, pure acetic acid, RWV1, RWV2, PV1 or PV2 by pipetting 100 µl of the test substance onto the top of the wound (see Table 1 for key to vinegar types). Doses were tested in triplicate for each species. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment. RWV2 and PV2, plus water controls, were tested in a second experiment; the work was divided into two experiments due to the labour-intensive nature of working with the wound model. After 24 h of exposure to the treatments, the collagen in the wounds was digested to release bacteria by adding 300 µl of 0.5 mg ml−1 collagenase type 1 (EMD Millipore) and incubating for 1 h at 37 °C. Digested wounds were mixed by pipetting, serially diluted in PBS and plated on LB agar. The number of viable bacteria in each biofilm was estimated using colony counts. To assess the combined effects of selected vinegars or acetic acid+medical-grade honey on biofilms, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above, and then treated topically with either water; RWV1, PV1, RWV2, PV2 or acetic acid at concentrations corresponding to 0.5 % acetic acid; 30 % (w/v) MediHoney 80 % gel; 30 % (w/v) Revamil 100 % honey gel; or each honey gel combined with each vinegar/acetic acid. In all cases, the total treatment volume was 100 µl, the final concentration of acetic acid was 0.5 % and the final concentration of honey gel was 30 %. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment; RWV2 and PV2, plus water controls, were tested in a second experiment. Each treatment was added to triplicate wounds containing P. aeruginosa and triplicate wounds containing S. aureus . Treated biofilms were incubated at 37 °C for 24 h, and then wounds were enzymatically digested, diluted and plated, as in the dose–response experiment. The two synergy experiments were replicated using fresh starter cultures of each bacterium.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-response-additivity) · `span-2023-response-additivity` · UTF-16 [43215, 44474).
> Under Response Additivity, the combined effect of non-interacting agents should be the sum of their individual effects: i.e. if A causes an alog10 kill and B causes a blog10 kill, Response Additivity should produce an (a+b)log10 kill [63]. Synergy would produce a greater than (a+b)log10 kill, and antagonism would produce a less than (a+b)log10 kill. We therefore calculated the predicted viable c.f.u. count for each combination treatment under Response Additivity, shown as horizontal black bars on the plots in Fig. 6. By plotting the 95 % confidence interval around the observed mean c.f.u. in each combination treatment, we can see whether the observed c.f.u. is significantly less than or greater than the predicted c.f.u. under Response Additivity. Using this method, we concluded that PV2 showed synergistic activity with MediHoney and Revamil against P. aeruginosa biofilms; however, the magnitude of this effect for Revamil was very small and probably not biologically meaningful (Fig. 6c). For S. aureus biofilms, acetic acid, RWV1, PV1 and PV2 showed synergistic activity with MediHoney, although this effect was very small for PV1. None of the vinegars, nor acetic acid, showed any meaningful synergy with Revamil against S. aureus (Fig. 6b, d).
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-bliss) · `span-2023-bliss` · UTF-16 [44476, 45249).
> Under Bliss Independence, if A and B act independently (additively), and the probability of being a cell being killed (fractional change in viable cells) by A is p(A) and the probability of being a cell being killed by B is p(B), then independent action results in a fractional decrease in viable cells under combination treatment of p(A)+p(B)−[p(A)×p(B)] [60]. This leads to the predicted mean c.f.u. indicated by the horizontal grey bars in Fig. 6; under the Bliss null model, there is no major change in our conclusions; the only difference related to the two cases where Response Additivity showed statistically significant but very slight synergy (PV1+Revamil in Fig. 6c, PV2+Revamil in Fig. 6d); neither of these combinations was synergistic under Bliss Independence.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2023-pv1-medihoney-sa-endpoint

- [ ] Human check: **Viable CFU and model-dependent interaction** — `recorded`, field `assay.endpoint`.
- Value/reason: "Colony counts after digestion, dilution and plating; synergy is assessed against an explicitly named null model"
- Rationale: Recorded in the cited source; interpretation is pending independent review.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-assay) · `span-2023-assay` · UTF-16 [20372, 22976).
> Limitations on time and resources restricted the number of vinegars that we could feasibly test in biofilm models. Based on the MIC results, we selected RWV (as an example of the group of vinegars with very similar HPLC profiles) and PV (which had a very different HPLC profile from the other vinegars) for investigation of biofilm-killing ability in an in vitro model of a soft tissue wound. To assess the dose response of biofilms to selected vinegars or acetic acid, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above in Bacterial Strains and Culture Conditions, and then treated topically with different doses of either water, pure acetic acid, RWV1, RWV2, PV1 or PV2 by pipetting 100 µl of the test substance onto the top of the wound (see Table 1 for key to vinegar types). Doses were tested in triplicate for each species. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment. RWV2 and PV2, plus water controls, were tested in a second experiment; the work was divided into two experiments due to the labour-intensive nature of working with the wound model. After 24 h of exposure to the treatments, the collagen in the wounds was digested to release bacteria by adding 300 µl of 0.5 mg ml−1 collagenase type 1 (EMD Millipore) and incubating for 1 h at 37 °C. Digested wounds were mixed by pipetting, serially diluted in PBS and plated on LB agar. The number of viable bacteria in each biofilm was estimated using colony counts. To assess the combined effects of selected vinegars or acetic acid+medical-grade honey on biofilms, synthetic wound biofilms of either P. aeruginosa or S. aureus were prepared as above, and then treated topically with either water; RWV1, PV1, RWV2, PV2 or acetic acid at concentrations corresponding to 0.5 % acetic acid; 30 % (w/v) MediHoney 80 % gel; 30 % (w/v) Revamil 100 % honey gel; or each honey gel combined with each vinegar/acetic acid. In all cases, the total treatment volume was 100 µl, the final concentration of acetic acid was 0.5 % and the final concentration of honey gel was 30 %. RWV1, PV1 and acetic acid, plus water controls, were tested in one experiment; RWV2 and PV2, plus water controls, were tested in a second experiment. Each treatment was added to triplicate wounds containing P. aeruginosa and triplicate wounds containing S. aureus . Treated biofilms were incubated at 37 °C for 24 h, and then wounds were enzymatically digested, diluted and plated, as in the dose–response experiment. The two synergy experiments were replicated using fresh starter cultures of each bacterium.
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-response-additivity) · `span-2023-response-additivity` · UTF-16 [43215, 44474).
> Under Response Additivity, the combined effect of non-interacting agents should be the sum of their individual effects: i.e. if A causes an alog10 kill and B causes a blog10 kill, Response Additivity should produce an (a+b)log10 kill [63]. Synergy would produce a greater than (a+b)log10 kill, and antagonism would produce a less than (a+b)log10 kill. We therefore calculated the predicted viable c.f.u. count for each combination treatment under Response Additivity, shown as horizontal black bars on the plots in Fig. 6. By plotting the 95 % confidence interval around the observed mean c.f.u. in each combination treatment, we can see whether the observed c.f.u. is significantly less than or greater than the predicted c.f.u. under Response Additivity. Using this method, we concluded that PV2 showed synergistic activity with MediHoney and Revamil against P. aeruginosa biofilms; however, the magnitude of this effect for Revamil was very small and probably not biologically meaningful (Fig. 6c). For S. aureus biofilms, acetic acid, RWV1, PV1 and PV2 showed synergistic activity with MediHoney, although this effect was very small for PV1. None of the vinegars, nor acetic acid, showed any meaningful synergy with Revamil against S. aureus (Fig. 6b, d).
- [Article paragraph](http://127.0.0.1:4317/cases/hippocratic-oxymel/source?source=harrison-2023.r1&span=span-2023-bliss) · `span-2023-bliss` · UTF-16 [44476, 45249).
> Under Bliss Independence, if A and B act independently (additively), and the probability of being a cell being killed (fractional change in viable cells) by A is p(A) and the probability of being a cell being killed by B is p(B), then independent action results in a fractional decrease in viable cells under combination treatment of p(A)+p(B)−[p(A)×p(B)] [60]. This leads to the predicted mean c.f.u. indicated by the horizontal grey bars in Fig. 6; under the Bliss null model, there is no major change in our conclusions; the only difference related to the two cases where Response Additivity showed statistically significant but very slight synergy (PV1+Revamil in Fig. 6c, PV2+Revamil in Fig. 6d); neither of these combinations was synergistic under Bliss Independence.
- Reviewer / qualification / date / decision / rationale: **pending**

### eu-2023-pv1-medihoney-sa-outcome

- [ ] Human check: **Arm-specific interaction outcome** — `unknown`, field `outcome.reported`.
- Value/reason: not_reviewed
- Rationale: Arm-level figure values and both null-model findings require independent review. No blanket synergy or efficacy label is assigned.
- Source scope: `harrison-2023.r1` / displayText. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.
- Reviewer / qualification / date / decision / rationale: **pending**

