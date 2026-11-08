// R5 offline prototype. Only owned CSL objects enter Cite; identifiers never trigger resolution.
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
import "@citation-js/plugin-ris";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadCorpus, ROOT } from "../apps/server/src/database.js";
const data = loadCorpus();
const csl = data.studies.map((s) => ({
  id: s.id,
  type: "article-journal",
  title: s.title,
  author: s.authors.map((name) => ({ literal: name })),
  issued: { "date-parts": [[s.year]] },
  DOI: s.doi,
  "container-title": s.journal,
  volume: s.volume,
}));
const references = new Cite(csl);
const folder = resolve(ROOT, "artifacts/bibliography");
mkdirSync(folder, { recursive: true });
writeFileSync(
  resolve(folder, "prototype.csl.json"),
  JSON.stringify(csl, null, 2),
);
writeFileSync(resolve(folder, "prototype.bib"), references.format("bibtex"));
writeFileSync(resolve(folder, "prototype.ris"), references.format("ris"));
console.log(
  `Converted ${csl.length} source-backed draft study references offline; bibliographic review remains pending.`,
);
