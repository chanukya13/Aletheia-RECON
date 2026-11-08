import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import {
  type CorpusData,
  type AssertionData,
  type SourceRevisionData,
  type SpanData,
  Corpus,
} from "@recon/contracts";
import {
  contentHash,
  materialRecordHash,
  parseJsonStrict,
  sha256,
  validateCorpus,
} from "@recon/core";

const root = resolve(import.meta.dirname, "..");
const raw = (name: string) =>
  readFileSync(resolve(root, "data/sources/raw", name));
const acquisition = parseJsonStrict(
  readFileSync(resolve(root, "data/sources/acquisition.json"), "utf8"),
) as Record<string, string>;
const corpus: CorpusData = {
  schemaVersion: "recon-v1",
  revision: "corpus-2026-11-05.1",
  sources: [],
  sourceRevisions: [],
  spans: [],
  assertions: [],
  materials: [],
  candidates: [],
  taxa: [],
  cases: [],
  studies: [],
  evidenceUnits: [],
  bibliography: [],
  interpretationGroups: [],
};
const review = {
  status: "pending" as const,
  reviewer: "Codex source check",
  qualification:
    "Automated assistant; no independent human or domain-expert review",
  reviewedAt: "2026-11-05T19:00:00.000Z",
  rationale:
    "Source-backed draft checked against retrieved text. Independent human review remains required before scientific release.",
};
const normalize = (s: string) => s.replace(/\s+/gu, " ").trim();
function xml(name: string) {
  const text = raw(name).toString("utf8");
  // JATS files contain public DOCTYPE declarations. No DTD/entity resolver is supplied;
  // xmldom does not fetch external resources. Entity declarations are rejected.
  if (/<!ENTITY/i.test(text)) throw new Error("XML_ENTITY_DECLARATION");
  return new DOMParser({
    errorHandler: {
      warning: () => {},
      error: (e) => {
        throw new Error(e);
      },
      fatalError: (e) => {
        throw new Error(e);
      },
    },
  }).parseFromString(text, "application/xml");
}
function nodeText(n: Node): string {
  if (n.nodeType === 3 || n.nodeType === 4) return n.nodeValue ?? "";
  if (["fig", "table-wrap", "supplementary-material"].includes(n.nodeName))
    return "";
  let result = "";
  for (let c = n.firstChild; c; c = c.nextSibling) result += nodeText(c);
  return result;
}
function xpath(n: Element): string {
  const parts: string[] = [];
  let e: Element | null = n;
  while (e) {
    let index = 1;
    for (let p = e.previousSibling; p; p = p.previousSibling)
      if (p.nodeName === e.nodeName && p.nodeType === 1) index++;
    parts.unshift(`${e.tagName}[${index}]`);
    e = e.parentNode?.nodeType === 1 ? (e.parentNode as Element) : null;
  }
  return "/" + parts.join("/");
}
function sourceRevision(
  sourceId: string,
  file: string,
  url: string,
  text: string,
  locator: SourceRevisionData["locator"],
  rightsFile: string,
  license: string,
  licenseUrl: string,
  credit: string,
  note: string,
): SourceRevisionData {
  const evidence = raw(rightsFile);
  if (!evidence.toString("utf8").includes(licenseUrl))
    throw new Error(`LICENSE_EVIDENCE_MISSING:${file}`);
  const payload = {
    id: `${sourceId}.r1`,
    sourceId,
    revision: 1,
    retrievedAt: acquisition[file]!,
    rawFile: `data/sources/raw/${file}`,
    rawUrl: url,
    rawSha256: sha256(raw(file)),
    displayText: text,
    textSha256: sha256(text),
    parser: file.startsWith("PMC")
      ? "recon-jats-blocks-v1"
      : "recon-scan-transcription-v1",
    editorialNote: note,
    locator,
    rights: {
      decision: "bundle_allowed" as const,
      license,
      licenseUrl,
      credit,
      storage: true,
      display: true,
      redistribution: true,
      restrictions:
        "Attribution retained. Article figures, supplementary files and separately credited third-party material are excluded. Historical text is edition-specific.",
      verificationUrl: file.startsWith("PMC")
        ? `https://europepmc.org/articles/${file.slice(0, -4)}`
        : sourceId.startsWith("cockayne")
          ? "https://wellcomecollection.org/works/dq5gv7ch"
          : "https://wellcomecollection.org/works/e2gwb7bm",
      verifiedAt: acquisition[file]!,
      evidenceFile: `data/sources/raw/${rightsFile}`,
      evidenceSha256: sha256(evidence),
    },
  };
  const revision = { ...payload, contentHash: contentHash(payload) };
  corpus.sourceRevisions.push(revision);
  return revision;
}
function span(
  revision: SourceRevisionData,
  id: string,
  exact: string,
  locator = revision.locator,
  from = 0,
): string {
  const start = revision.displayText.indexOf(exact, from);
  if (start < 0) throw new Error(`QUOTE_NOT_FOUND:${id}:${exact}`);
  const end = start + exact.length;
  const s: SpanData = {
    id,
    sourceRevisionId: revision.id,
    sourceTextSha256: revision.textSha256,
    start,
    end,
    exact,
    prefix: revision.displayText.slice(Math.max(0, start - 32), start),
    suffix: revision.displayText.slice(end, end + 32),
    locator,
  };
  corpus.spans.push(s);
  return id;
}
function assertion(
  id: string,
  field: string,
  label: string,
  value: unknown,
  refs: string[],
  rationale = "Recorded in the cited source; interpretation is pending independent review.",
): string {
  const a = {
    id,
    field,
    label,
    origin: "agent_curated",
    references: refs.map((spanId) => ({ kind: "span", spanId })),
    inputAssertionIds: [],
    review,
    state: "recorded",
    value,
    rationale,
  };
  corpus.assertions.push(a as AssertionData);
  return id;
}
function unknown(
  id: string,
  field: string,
  label: string,
  reason: "not_reported" | "ambiguous" | "not_reviewed",
  rationale: string,
  source: SourceRevisionData,
): string {
  corpus.assertions.push({
    id,
    field,
    label,
    origin: "agent_curated",
    references: [
      { kind: "metadata", sourceRevisionId: source.id, field: "displayText" },
    ],
    inputAssertionIds: [],
    review,
    state: "unknown",
    reason,
    rationale,
  });
  return id;
}
const eyesText =
  "Work an eye salve for a wen, take cropleek and garlic, of both equal quantities, pound them well together, take wine and bullocks gall, of both equal quantities, mix with the leek, put this then into a brazen vessel, let it stand nine days in the brass vessel, wring out through a cloth and clear it well, put it into a horn, and about night time apply it with a feather to the eye; the best leechdom.\n\nEditorial footnote 1: Allium oleraceum?";
const originalText =
  "Ƿyrc eagsealfe wiþ wænne genim cropleac ⁊ garleac begea em fela";
const oxymelText =
  "16. You will find the drink, called oxymel, often very useful in these complaints, for it promotes expectoration and freedom of breathing. The following are the proper occasions for administering it. When strongly acid it has no mean operation in rendering the expectoration more easy, for by bringing up the sputa, which occasion troublesome hawking, and rendering them more slippery, and, as it were, clearing the windpipe with a feather, it relieves the lungs and proves emollient to them; and when it succeeds in producing these effects it must do much good.";
for (const [id, language] of [
  ["cockayne-translation", "en"],
  ["cockayne-original", "ang"],
] as const)
  corpus.sources.push({
    id,
    kind: "historical_edition",
    title: "Leechdoms, Wortcunning, and Starcraft of Early England · Volume II",
    creators: ["Thomas Oswald Cockayne (editor and translator)"],
    work: "Bald’s Leechbook, Book I, chapter ii",
    edition:
      "London: Longman, Green, Longman, Roberts, and Green, 1865 · Vol. II",
    translator: language === "en" ? "Thomas Oswald Cockayne" : null,
    language,
    publicationDate: "1865 (edition)",
    compositionDate:
      "Tenth-century manuscript tradition; exact recipe composition date unknown",
    identifiers: { wellcome: "b21924235_0002", catalogue: "dq5gv7ch" },
    canonicalUrl: "https://wellcomecollection.org/works/dq5gv7ch",
  });
const eyes = sourceRevision(
  "cockayne-translation",
  "leechdoms-0085.alto.xml",
  "https://api.wellcomecollection.org/text/alto/b21924235_0002/b21924235_0002_0085.jp2",
  eyesText,
  {
    label: "Book I · chapter ii · printed p. 35",
    page: "35",
    chapter: "Book I, chapter ii, paragraph preceding 17",
    manuscript:
      "British Library, Royal 12 D xvii (work witness; not this scan)",
    canvasUrl:
      "https://iiif.wellcomecollection.org/presentation/b21924235_0002/canvases/b21924235_0002_0085.jp2",
  },
  "leechdoms-vol2.manifest.json",
  "Public Domain Mark 1.0",
  "http://creativecommons.org/publicdomain/mark/1.0/",
  "Cockayne, Leechdoms II (1865), p. 35. Wellcome Collection / Royal College of Physicians of Edinburgh.",
  "Transcribed against page scan. Line breaks and hyphenation joined; superscript footnote marker omitted from recipe and footnote retained separately. OCR corrected: Work, cropleek, brazen. Historical wording retained; not a treatment recommendation.",
);
const original = sourceRevision(
  "cockayne-original",
  "leechdoms-0084.alto.xml",
  "https://api.wellcomecollection.org/text/alto/b21924235_0002/b21924235_0002_0084.jp2",
  originalText,
  {
    label: "Book I · chapter ii · printed p. 34 · opening clause only",
    page: "34",
    chapter: "Book I, chapter ii",
    canvasUrl:
      "https://iiif.wellcomecollection.org/presentation/b21924235_0002/canvases/b21924235_0002_0084.jp2",
  },
  "leechdoms-vol2.manifest.json",
  "Public Domain Mark 1.0",
  "http://creativecommons.org/publicdomain/mark/1.0/",
  "Cockayne, Leechdoms II (1865), p. 34. Wellcome Collection / Royal College of Physicians of Edinburgh.",
  "Opening clause excerpt only, not the complete original recipe. Scan transcription uses Unicode wynn, thorn and Tironian et; line breaks joined. Pending independent palaeographic review.",
);
corpus.sources.push({
  id: "adams-oxymel",
  kind: "historical_edition",
  title: "The Genuine Works of Hippocrates · Volume I",
  creators: [
    "Hippocrates (traditional attribution)",
    "Francis Adams (translator)",
  ],
  work: "On Regimen in Acute Diseases, §16",
  edition: "London: Sydenham Society, 1849 · Vol. I",
  translator: "Francis Adams",
  language: "en",
  publicationDate: "1849 (translation)",
  compositionDate:
    "Classical Hippocratic corpus; precise authorship and date unresolved",
  identifiers: { wellcome: "b33291408_0003", catalogue: "e2gwb7bm" },
  canonicalUrl: "https://wellcomecollection.org/works/e2gwb7bm",
});
const oxy = sourceRevision(
  "adams-oxymel",
  "hippocrates-0321.alto.xml",
  "https://api.wellcomecollection.org/text/alto/b33291408_0003/b33291408_0003_0321.jp2",
  oxymelText,
  {
    label: "On Regimen in Acute Diseases · §16 · printed p. 301",
    page: "301",
    chapter: "§16, opening sentences",
    canvasUrl:
      "https://iiif.wellcomecollection.org/presentation/b33291408_0003/canvases/b33291408_0003_0321.jp2",
  },
  "hippocrates-vol1.manifest.json",
  "Public Domain Mark 1.0",
  "http://creativecommons.org/publicdomain/mark/1.0/",
  "Hippocrates, translated by Francis Adams (1849), Vol. I, p. 301. Wellcome Collection.",
  "Opening excerpt transcribed against page scan. Line breaks and administering hyphenation joined. This passage mentions a preparation; it does not specify ingredients, proportions or a full preparation method. No Greek original is bundled.",
);

const blocks = new Map<
  string,
  Array<{ text: string; path: string; label: string }>
>();
for (const [pmcid, sid, doi] of [
  ["PMC6261618", "fuchs-2018", "10.1371/journal.pone.0208108"],
  ["PMC7387442", "furner-pardoe-2020", "10.1038/s41598-020-69273-8"],
  ["PMC10433418", "harrison-2023", "10.1099/mic.0.001351"],
] as const) {
  const doc = xml(`${pmcid}.xml`);
  const get = (tag: string) =>
    normalize(doc.getElementsByTagName(tag)[0]?.textContent ?? "");
  const authorGroup = doc.getElementsByTagName("article-meta")[0]!;
  const authors = Array.from(authorGroup.getElementsByTagName("contrib"))
    .filter(
      (n) =>
        !n.hasAttribute("contrib-type") ||
        n.getAttribute("contrib-type") === "author",
    )
    .map((n) => {
      const name = n.getElementsByTagName("name")[0];
      return name
        ? normalize(
            (name.getElementsByTagName("given-names")[0]?.textContent ?? "") +
              " " +
              (name.getElementsByTagName("surname")[0]?.textContent ?? "") +
              " " +
              (name.getElementsByTagName("suffix")[0]?.textContent ?? ""),
          )
        : "";
    })
    .filter(Boolean);
  const year = sid.endsWith("2018") ? 2018 : sid.endsWith("2020") ? 2020 : 2023;
  corpus.sources.push({
    id: sid,
    kind: "primary_study",
    title: get("article-title"),
    creators: authors,
    work: get("journal-title"),
    edition: "Published journal article · Europe PMC JATS snapshot",
    translator: null,
    language: "en",
    publicationDate: String(year),
    compositionDate: "Not applicable (modern study)",
    identifiers: { doi, pmcid },
    canonicalUrl: `https://doi.org/${doi}`,
  });
  const rows: Array<{ text: string; path: string; label: string }> = [];
  const body = doc.getElementsByTagName("body")[0]!;
  for (const p of Array.from(body.getElementsByTagName("p"))) {
    let excluded = false;
    for (let a = p.parentNode; a && a !== body; a = a.parentNode)
      if (["table-wrap", "fig", "supplementary-material"].includes(a.nodeName))
        excluded = true;
    const text = normalize(nodeText(p));
    if (!excluded && text)
      rows.push({ text, path: xpath(p), label: "Article paragraph" });
  }
  for (const table of Array.from(body.getElementsByTagName("table-wrap"))) {
    const label = normalize(
      table.getElementsByTagName("label")[0]?.textContent ??
        table.getAttribute("id") ??
        "Table",
    );
    const caption = normalize(
      table.getElementsByTagName("caption")[0]?.textContent ?? "",
    );
    const grid = Array.from(table.getElementsByTagName("tr"))
      .map((tr) =>
        Array.from(tr.childNodes)
          .filter((n) => ["td", "th"].includes(n.nodeName))
          .map((n) => normalize(n.textContent ?? ""))
          .join(" | "),
      )
      .join("\n");
    const foot = normalize(
      table.getElementsByTagName("table-wrap-foot")[0]?.textContent ?? "",
    );
    rows.push({
      text: `${label}: ${caption}\n${grid}${foot ? "\n" + foot : ""}`,
      path: xpath(table),
      label,
    });
  }
  blocks.set(sid, rows);
  const cc0 = sid === "fuchs-2018";
  const licenseUrl = cc0
    ? "https://creativecommons.org/publicdomain/zero/1.0/"
    : "https://creativecommons.org/licenses/by/4.0/";
  const revision = sourceRevision(
    sid,
    `${pmcid}.xml`,
    `https://www.ebi.ac.uk/europepmc/webservices/rest/${pmcid}/fullTextXML`,
    rows.map((r) => r.text).join("\n\n"),
    { label: "Published article · paragraph/table locators" },
    `${pmcid}.xml`,
    cc0 ? "CC0 1.0" : "CC BY 4.0",
    licenseUrl,
    `${authors.join(", ")} (${year}). ${get("article-title")}. DOI: ${doi}. ${cc0 ? "CC0" : "CC BY 4.0"}. Text normalized for display; figures excluded.`,
    "JATS body paragraphs and author tables only. Whitespace collapsed within paragraphs/cells; tables use pipe-separated cells. Figures, references and supplements excluded. Original XML bytes retained. These are display transformations, not new study findings.",
  );
  const articleIds = Array.from(doc.getElementsByTagName("article-id"));
  corpus.studies.push({
    id: `study-${sid}`,
    title: get("article-title"),
    authors,
    year,
    doi,
    pmcid,
    pmid:
      articleIds.find((n) => n.getAttribute("pub-id-type") === "pmid")
        ?.textContent ?? "not supplied",
    journal: get("journal-title"),
    volume: get("volume"),
    sourceRevisionIds: [revision.id],
    design: "In vitro microbiology; material- and assay-specific observations",
    familyId: "family-balds-eyesalve-2018-2020" /* overwritten for oxymel */,
    correctionStatus:
      "No independent correction/retraction check performed; publication status must be reviewed before scientific release.",
    review,
  });
  if (sid === "harrison-2023")
    corpus.studies.at(-1)!.familyId = "family-honey-vinegar-2023";
  corpus.bibliography.push({
    id: `bib-${sid}`,
    type: "article-journal",
    title: get("article-title"),
    creators: authors.map((name) => ({ name, role: "author" })),
    issued: String(year),
    edition: "Published version",
    identifiers: { doi, pmcid },
    sourceRevisionId: revision.id,
  });
}
function articleSpan(sid: string, key: string, contains: string): string {
  const row = blocks.get(sid)!.find((b) => b.text.includes(contains));
  if (!row) throw new Error(`PARAGRAPH_MISSING:${key}:${contains}`);
  return span(
    corpus.sourceRevisions.find((r) => r.sourceId === sid)!,
    key,
    row.text,
    { label: row.label, xmlPath: row.path },
  );
}
const eRecipe = span(eyes, "span-eyesalve-recipe", eyesText.split("\n\n")[0]!);
const eTerm = span(eyes, "span-cropleek", "cropleek");
const eFoot = span(eyes, "span-edition-gloss", "Allium oleraceum?");
const eTime = span(
  eyes,
  "span-nine-days",
  "let it stand nine days in the brass vessel",
);
const eUse = span(eyes, "span-eye-route", "apply it with a feather to the eye");
const oTerm = span(original, "span-cropleac-original", "cropleac");
const xUse = span(
  oxy,
  "span-oxymel-use",
  "the drink, called oxymel, often very useful in these complaints, for it promotes expectoration and freedom of breathing",
);
const aAmbiguity = articleSpan(
  "furner-pardoe-2020",
  "span-cropleac-ambiguity",
  "Two likely translations are onion",
);
const aPaired = articleSpan(
  "furner-pardoe-2020",
  "span-2020-paired",
  "75 batches of Bald",
);
const aRecon = articleSpan(
  "furner-pardoe-2020",
  "span-2020-reconstruction",
  "The crushed onion and garlic were then combined",
);
const fTable1 = articleSpan(
  "fuchs-2018",
  "span-2018-formulations",
  "Composition of Bald",
);
const fTable2 = articleSpan(
  "fuchs-2018",
  "span-2018-mic-table",
  "Susceptibility of bacterial strains to crude",
);
const fPrep = articleSpan(
  "fuchs-2018",
  "span-2018-preparation",
  "Immediately following plant material preparation",
);
const fPlants = articleSpan(
  "fuchs-2018",
  "span-2018-plants",
  "yellow onion (Allium cepa",
);
const fMethod = articleSpan(
  "fuchs-2018",
  "span-2018-mic-method",
  "MIC values were determined",
);
const hHoney = articleSpan(
  "harrison-2023",
  "span-2023-honeys",
  "Two commercially available medical-grade honey",
);
const hAssay = articleSpan(
  "harrison-2023",
  "span-2023-assay",
  "To assess the combined effects",
);
const hOutcome = articleSpan(
  "harrison-2023",
  "span-2023-response-additivity",
  "Under Response Additivity, the combined effect",
);
const hBliss = articleSpan(
  "harrison-2023",
  "span-2023-bliss",
  "Under Bliss Independence, if A and B",
);

const coreAssertions = [
  assertion(
    "a-eyesalve-description",
    "historical.preparation",
    "A recorded multi-ingredient preparation",
    "cropleek, garlic, wine and bullocks gall; mixed, matured, strained and stored",
    [eRecipe],
  ),
  assertion(
    "a-cropleek-word",
    "ingredient.term",
    "Historical ingredient term",
    "cropleek",
    [eTerm],
  ),
  assertion(
    "a-cropleac-word",
    "ingredient.originalTerm",
    "Old English term (excerpt)",
    "cropleac",
    [oTerm],
  ),
  assertion(
    "a-edition-gloss",
    "ingredient.editorialGloss",
    "Tentative identification in the 1865 edition",
    "Allium oleraceum?",
    [eFoot],
    "The question mark is part of the edition. This is an editorial proposal, not a confirmed botanical identity.",
  ),
  assertion(
    "a-onion-proposal",
    "identity.alternative",
    "Onion interpretation discussed in 2020",
    "Allium cepa",
    [aAmbiguity],
  ),
  assertion(
    "a-leek-proposal",
    "identity.alternative",
    "Leek interpretation discussed in 2020",
    "Allium porrum",
    [aAmbiguity],
  ),
  unknown(
    "a-cropleek-identity",
    "ingredient.identity",
    "Botanical identity",
    "ambiguous",
    "The edition and modern studies offer alternatives. None is silently selected; the alternatives are not exhaustive.",
    eyes,
  ),
  assertion(
    "a-nine-days",
    "preparation.duration",
    "Recorded maturation",
    { value: 9, unit: "day" },
    [eTime],
  ),
  assertion(
    "a-brass",
    "preparation.contact",
    "Recorded contact vessel",
    "brazen / brass vessel",
    [eTime],
  ),
  unknown(
    "a-historical-temperature",
    "preparation.temperature",
    "Historical temperature",
    "not_reported",
    "The selected historical passage gives a duration but no temperature.",
    eyes,
  ),
  assertion(
    "a-eye-use",
    "historical.use",
    "Recorded historical application",
    "Application to the eye for a wen (historical wording)",
    [eUse],
    "Historical source claim only; no modern diagnosis or therapeutic validation is inferred.",
  ),
  assertion(
    "a-equal-quantity",
    "quantity.relationship",
    "Equal quantities, unknown basis",
    "Both equal quantities (two pairs); mass or volume basis is not specified",
    [eRecipe],
  ),
];
const oxyAssertions = [
  assertion(
    "a-oxymel-mentioned",
    "historical.preparation",
    "Preparation mention",
    "oxymel",
    [xUse],
  ),
  assertion(
    "a-oxymel-use",
    "historical.use",
    "Recorded historical indication and route",
    "A drink discussed for expectoration and freedom of breathing",
    [xUse],
    "Historical claim, not clinical evidence. Modern synthetic wound assays use a different route and context.",
  ),
  unknown(
    "a-oxymel-composition",
    "material.composition",
    "Exact composition",
    "not_reported",
    "The selected §16 excerpt does not give a complete ingredient list or recipe. Honey/vinegar assumptions must not become recorded composition.",
    oxy,
  ),
  unknown(
    "a-oxymel-ratio",
    "quantity.ratio",
    "Ingredient ratio",
    "not_reported",
    "No ratio is specified in this excerpt.",
    oxy,
  ),
  unknown(
    "a-oxymel-processing",
    "preparation.processing",
    "Preparation process",
    "not_reported",
    "The opening excerpt does not specify a preparation process.",
    oxy,
  ),
];
function addMaterial(
  id: string,
  label: string,
  representation: "historical_record" | "documented_reconstruction",
  assertionIds: string[],
  componentSlots: CorpusData["materials"][number]["componentSlots"] = [],
  steps: CorpusData["materials"][number]["steps"] = [],
  quantities: CorpusData["materials"][number]["quantities"] = [],
) {
  const payload = {
    id,
    kind: "mixture" as const,
    label,
    representation,
    componentSlots,
    steps,
    quantities,
    assertionIds,
  };
  const m = {
    ...payload,
    recordHash: materialRecordHash(payload),
    fingerprint: null,
    fingerprintPayload: null,
    canonicalization: "JCS-RFC8785/recon-science-v1" as const,
  };
  corpus.materials.push(m);
  return id;
}
const slots: CorpusData["materials"][number]["componentSlots"] = [];
for (const term of ["cropleek", "garlic", "wine", "bullocks gall"]) {
  const key = term.replaceAll(" ", "-");
  const termId =
    term === "cropleek"
      ? "a-cropleek-word"
      : assertion(
          `a-term-${key}`,
          "ingredient.term",
          `Recorded ingredient: ${term}`,
          term,
          [eRecipe],
        );
  const part = unknown(
    `a-part-${key}`,
    "ingredient.part",
    `${term}: part`,
    "not_reported",
    "No sufficiently specific part is recorded for this slot in the selected passage.",
    eyes,
  );
  const state = unknown(
    `a-state-${key}`,
    "ingredient.state",
    `${term}: state`,
    "not_reported",
    "Fresh/dry or precise material state is not explicitly recorded.",
    eyes,
  );
  slots.push({
    id: `slot-${key}`,
    termAssertionId: termId,
    language: "en",
    kind: ["cropleek", "garlic"].includes(term)
      ? "plant_material"
      : "other_natural_material",
    candidateIds:
      term === "cropleek"
        ? ["candidate-onion", "candidate-leek", "candidate-edition-oleraceum"]
        : [],
    partAssertionId: part,
    stateAssertionId: state,
    quantityIds: [],
  });
  coreAssertions.push(termId, part, state);
}
for (const [id, proposedName, support] of [
  ["candidate-onion", "Allium cepa", "a-onion-proposal"],
  ["candidate-leek", "Allium porrum", "a-leek-proposal"],
  ["candidate-edition-oleraceum", "Allium oleraceum?", "a-edition-gloss"],
])
  corpus.candidates.push({
    id: id!,
    occurrenceId: "slot-cropleek",
    proposedName: proposedName!,
    taxonConceptId: null,
    supportAssertionIds: [support!],
    rationale:
      "Source-documented proposal; modern taxonomy is not yet normalized and historical identification remains unresolved.",
    status: "documented_plausible",
  });
const hm = addMaterial(
  "material-eyesalve-r1",
  "Historical eyesalve record",
  "historical_record",
  [...new Set(coreAssertions)],
  slots,
  [
    {
      id: "step-maturation",
      operationAssertionId: "a-nine-days",
      inputSlotIds: slots.map((s) => s.id),
      followsStepIds: [],
      detailAssertionIds: ["a-brass", "a-historical-temperature"],
    },
  ],
  [
    {
      id: "quantity-historical-equality",
      assertionId: "a-equal-quantity",
      raw: "of both equal quantities",
      basis: "unknown",
      dimension: "unresolved pairwise quantity relationship",
      equalToSlotIds: [],
    },
  ],
);
const om = addMaterial(
  "material-oxymel-r1",
  "Oxymel mention; composition unreported",
  "historical_record",
  oxyAssertions,
);
// Only the explicitly documented tested formulations × contexts become evidence units.
const modernUnits: string[] = [];
for (const arm of ["ES-O", "ES-L", "ES-GBBr", "ES-GB"]) {
  const key = arm.toLowerCase();
  const composition = assertion(
    `a-2018-${key}-composition`,
    "material.composition",
    `${arm}: Table 1 formulation`,
    {
      garlic: true,
      wine: true,
      onion: arm === "ES-O",
      leek: arm === "ES-L",
      bovineBile: true,
      brassContact: arm !== "ES-GB",
    },
    [fTable1],
  );
  const prep = assertion(
    `a-2018-${key}-processing`,
    "preparation.processing",
    `${arm}: reported processing`,
    "Equal 25 mL component volumes; 4 °C for 9 days in glass bottles; brass squares where Table 1 specifies; centrifuged supernatant",
    [fPrep, fTable1],
  );
  const plant = assertion(
    `a-2018-${key}-plants`,
    "material.reportedPlants",
    `${arm}: reported plant identities`,
    "Garlic Allium sativum; onion Allium cepa; leek Allium ampeloprasum where included; qualifiers and parts require structured curation",
    [fPlants],
  );
  const material = addMaterial(
    `material-2018-${key}`,
    `${arm} (Fuchs 2018)`,
    "documented_reconstruction",
    [composition, prep, plant],
  );
  for (const strain of ["ATCC-6538", "LAC"]) {
    const id = `eu-2018-${key}-${strain.toLowerCase()}`;
    const context = assertion(
      `${id}-context`,
      "assay.context",
      `${arm} · S. aureus ${strain}`,
      {
        organism: "Staphylococcus aureus",
        strain: strain === "ATCC-6538" ? "ATCC 6538" : "LAC (MRSA)",
        model: "broth microdilution",
        medium: "cation-adjusted Mueller-Hinton broth",
        endpoint: "MIC",
        setting: "in vitro",
        exposure: "37 °C, 20 h",
      },
      [fMethod, fTable2],
    );
    const comparator = assertion(
      `${id}-comparator`,
      "assay.comparator",
      "MIC control wells",
      "No eyesalve, with and without inoculum",
      [fMethod],
    );
    const endpoint = assertion(
      `${id}-endpoint`,
      "assay.endpoint",
      "Minimum inhibitory concentration",
      "MIC in % v/v eyesalve formulation; reported median of at least 3 biological replicates",
      [fTable2],
    );
    const value = strain === "ATCC-6538" ? 0.625 : arm === "ES-O" ? 2.5 : 1.25;
    const outcome = assertion(
      `${id}-outcome`,
      "outcome.reported",
      "Reported Table 2 MIC",
      {
        value,
        unit: "% v/v",
        statistic: "median",
        minimumBiologicalReplicates: 3,
        clinicalInterpretation: "not established",
      },
      [fTable2],
    );
    corpus.evidenceUnits.push({
      id,
      studyId: "study-fuchs-2018",
      testedMaterialVersionId: material,
      armLabel: `${arm} · ${strain}`,
      contextAssertionIds: [context],
      comparatorAssertionId: comparator,
      endpointAssertionId: endpoint,
      outcomeAssertionId: outcome,
      supportSpanIds: [fTable1, fPrep, fMethod, fTable2],
      review,
    });
    modernUnits.push(id);
  }
}
for (const arm of ["ESO", "ESL"]) {
  const id = `eu-2020-${arm.toLowerCase()}-newman`;
  const composition = assertion(
    `${id}-composition`,
    "material.composition",
    `${arm}: documented variant`,
    {
      cropleacInterpretation:
        arm === "ESO" ? "Allium cepa (onion)" : "Allium porrum (leek)",
      garlic: true,
      wine: true,
      bovineBileSalts: true,
    },
    [aAmbiguity, aRecon],
  );
  const prep = assertion(
    `${id}-preparation`,
    "preparation.processing",
    "2020 reconstruction process",
    "Nine-day brewing; reconstruction methods report 4 °C, glass, prepared bile salts, straining, centrifugation and filtration",
    [aRecon, aAmbiguity],
  );
  const material = addMaterial(
    `material-2020-${arm.toLowerCase()}`,
    `${arm} (Furner-Pardoe 2020)`,
    "documented_reconstruction",
    [composition, prep],
  );
  const context = assertion(
    `${id}-context`,
    "assay.context",
    "S. aureus Newman · synthetic wound biofilm",
    {
      organism: "Staphylococcus aureus",
      strain: "Newman",
      model: "collagen-based synthetic soft-tissue wound biofilm",
      biofilmAge: "24 h",
      treatmentExposure: "24 h",
      setting: "in vitro",
    },
    [aAmbiguity, aPaired],
  );
  const comparator = assertion(
    `${id}-comparator`,
    "assay.comparator",
    "Water-treated control",
    "Sterile water-treated synthetic wounds",
    [aPaired],
  );
  const endpoint = assertion(
    `${id}-endpoint`,
    "assay.endpoint",
    "Log change in viable bacteria",
    "CFU-based log change relative to control; 15 paired batches, not 15 independent studies",
    [aPaired],
  );
  const outcome = unknown(
    `${id}-outcome`,
    "outcome.reported",
    "Arm-specific numerical outcome",
    "not_reviewed",
    "The paper reports a paired-batch analysis. Individual arm values have not been independently extracted from its data supplement; pooled findings must not be assigned to every arm.",
    corpus.sourceRevisions.find((r) => r.sourceId === "furner-pardoe-2020")!,
  );
  corpus.evidenceUnits.push({
    id,
    studyId: "study-furner-pardoe-2020",
    testedMaterialVersionId: material,
    armLabel: `${arm} · Newman · paired-batch experiment`,
    contextAssertionIds: [context],
    comparatorAssertionId: comparator,
    endpointAssertionId: endpoint,
    outcomeAssertionId: outcome,
    supportSpanIds: [aAmbiguity, aPaired, aRecon],
    review,
  });
  modernUnits.push(id);
}
const honeyUnits: string[] = [];
for (const vinegar of ["RWV1", "PV1"]) {
  const composition = assertion(
    `a-2023-${vinegar}-material`,
    "material.composition",
    `${vinegar} + MediHoney`,
    {
      vinegar,
      honey: "MediHoney product #31805, 80% Leptospermum honey dressing",
      finalAceticAcid: "0.5%",
      finalHoneyGel: "30% w/v",
      totalTreatmentVolume: "100 µL",
    },
    [hHoney, hAssay],
  );
  const material = addMaterial(
    `material-2023-${vinegar.toLowerCase()}-medihoney`,
    `${vinegar} + MediHoney (Harrison 2023)`,
    "documented_reconstruction",
    [composition],
  );
  for (const organism of ["P. aeruginosa", "S. aureus"]) {
    const key = organism.startsWith("P.") ? "pa" : "sa";
    const id = `eu-2023-${vinegar.toLowerCase()}-medihoney-${key}`;
    const context = assertion(
      `${id}-context`,
      "assay.context",
      `${organism} · synthetic wound biofilm`,
      {
        organism,
        model: "synthetic soft-tissue wound biofilm",
        exposure: "37 °C for 24 h",
        setting: "in vitro",
        strain: "not yet independently curated",
      },
      [hAssay],
    );
    const comparator = assertion(
      `${id}-comparator`,
      "assay.comparator",
      "Experimental and additivity controls",
      "Water; individual acid and honey treatments; Response Additivity and Bliss Independence models",
      [hAssay, hOutcome, hBliss],
    );
    const endpoint = assertion(
      `${id}-endpoint`,
      "assay.endpoint",
      "Viable CFU and model-dependent interaction",
      "Colony counts after digestion, dilution and plating; synergy is assessed against an explicitly named null model",
      [hAssay, hOutcome, hBliss],
    );
    const outcome = unknown(
      `${id}-outcome`,
      "outcome.reported",
      "Arm-specific interaction outcome",
      "not_reviewed",
      "Arm-level figure values and both null-model findings require independent review. No blanket synergy or efficacy label is assigned.",
      corpus.sourceRevisions.find((r) => r.sourceId === "harrison-2023")!,
    );
    corpus.evidenceUnits.push({
      id,
      studyId: "study-harrison-2023",
      testedMaterialVersionId: material,
      armLabel: `${vinegar} + MediHoney · ${organism}`,
      contextAssertionIds: [context],
      comparatorAssertionId: comparator,
      endpointAssertionId: endpoint,
      outcomeAssertionId: outcome,
      supportSpanIds: [hHoney, hAssay, hOutcome, hBliss],
      review,
    });
    honeyUnits.push(id);
  }
}
for (const [
  id,
  title,
  subtitle,
  kind,
  period,
  primary,
  originalId,
  material,
  assertionIds,
  use,
  units,
] of [
  [
    "balds-eyesalve",
    "Bald’s eyesalve",
    "One historical preparation. Several botanical interpretations.",
    "recipe",
    "Tenth-century manuscript tradition",
    eyes.id,
    original.id,
    hm,
    [...new Set(coreAssertions)],
    ["a-eye-use"],
    modernUnits,
  ],
  [
    "hippocratic-oxymel",
    "Hippocratic oxymel",
    "A named preparation with an incompletely specified composition.",
    "preparation_mention",
    "Classical Hippocratic tradition",
    oxy.id,
    null,
    om,
    oxyAssertions,
    ["a-oxymel-use"],
    honeyUnits,
  ],
] as const) {
  const sourceRevisionIds =
    id === "balds-eyesalve"
      ? [eyes.id, original.id, "fuchs-2018.r1", "furner-pardoe-2020.r1"]
      : [oxy.id, "harrison-2023.r1"];
  const payload = {
    id,
    revision: 1,
    title,
    subtitle,
    kind,
    authenticity: "authentic" as const,
    period,
    sourceRevisionIds,
    primarySourceRevisionId: primary,
    originalSourceRevisionId: originalId,
    materialVersionId: material,
    assertionIds: [...assertionIds],
    historicalUseAssertionIds: [...use],
    evidenceUnitIds: [...units],
    baselineScenarioInput: {
      assignments: [],
      hypotheticalOverrides: [],
      rationale:
        "Unresolved source record; no historical identity or composition is silently selected.",
    },
    review,
    corpusRevision: corpus.revision,
    supersedes: null,
  };
  corpus.cases.push({ ...payload, contentHash: contentHash(payload) });
}
const validated = validateCorpus(Corpus.parse(corpus));
mkdirSync(resolve(root, "data/corpus"), { recursive: true });
writeFileSync(
  resolve(root, "data/corpus/recon-v1.json"),
  JSON.stringify(validated, null, 2) + "\n",
);
const manifest = {
  schemaVersion: "recon-v1",
  corpusRevision: corpus.revision,
  corpusSha256: sha256(
    readFileSync(resolve(root, "data/corpus/recon-v1.json")),
  ),
  caseFamilyCount: 2,
  studyCount: corpus.studies.length,
  evidenceUnitCount: corpus.evidenceUnits.length,
  sourceCount: corpus.sources.length,
  assertionCount: corpus.assertions.length,
  reviewStatus: "agent_checked_pending_human_review",
  outcomeCoverage: { numericallyCuratedUnits: 8, pendingArmOutcomeReview: 6 },
  sources: corpus.sourceRevisions.map((r) => ({
    id: r.id,
    rawFile: r.rawFile,
    rawUrl: r.rawUrl,
    rawSha256: r.rawSha256,
    textSha256: r.textSha256,
    contentHash: r.contentHash,
    rights: r.rights,
  })),
};
writeFileSync(
  resolve(root, "data/corpus-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  `Built ${corpus.cases.length} authentic cases, ${corpus.studies.length} studies, ${corpus.evidenceUnits.length} units. All curation remains pending human review.`,
);
