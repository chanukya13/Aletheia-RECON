import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadCorpus, ROOT } from "../apps/server/src/database.js";
const data = loadCorpus();
const lines = [
  "# Phase 1 corpus review packet",
  "",
  `Corpus: \`${data.revision}\`. **All ${data.assertions.length} assertions remain pending independent human review.** An automated source check has not been relabeled as human validation.`,
  "",
  "The implementation plan requires at least one recorded human check for each release assertion. Two independent named reviewers, including relevant historical/pharmacognostic expertise where possible, are preferred. Record identity, qualification, date, accepted/rejected/contested decision and rationale. Do not bulk-accept without inspecting the source.",
  "",
  "Open the local reader at http://127.0.0.1:4317/cases. Each assertion below links to an exact source location when available. Independently verify transcription, locator, claim scope, composition, context and outcome. Permission evidence and original bytes are in data/sources/raw. Draft IDs must remain inspectable: approved corrections require new immutable assertion/material/case revisions and audit events; do not edit old DB payloads.",
  "",
  "## Priority checks",
  "",
  "- Check Cockayne II printed pp. 34–35 against verified canvases 0084/0085, not the duplicate preface page labels. The Old English panel is only an opening clause; its Unicode transcription and translation correspondence need specialist review.",
  "- Preserve the question mark in the edition’s Allium oleraceum? gloss and the different 2020 onion/leek discussion. These alternatives are not exhaustive and are not automatically identified through modern taxonomy.",
  "- Verify Adams I p. 301, §16. It is a preparation mention with respiratory/drink context. Do not infer a complete honey/vinegar recipe, ratio or modern wound indication from the name.",
  "- Verify all eight 2018 MIC entries against Table 2 and the formulation arms against Table 1. Units are % v/v, medians of at least three biological replicates, not clinical effect sizes.",
  "- Verify 2020 paired-batch assay contexts; six later-source arm outcomes are explicitly not yet curated. Do not assign pooled 2020 results to individual arms, or blanket 2023 synergy across organisms/null models.",
  "- Complete structured modern ingredient/process/strain/outcome review before Phases 2–3 use records for comparison. Three papers and two families do not establish broad scientific validity.",
  "",
  "## Source witnesses",
  "",
];
for (const r of data.sourceRevisions) {
  const s = data.sources.find((s) => s.id === r.sourceId)!;
  lines.push(
    `- **${r.id}** — ${s.title}. ${r.locator.label}. [Source](${s.canonicalUrl}); ${r.locator.canvasUrl ? `[canvas](${r.locator.canvasUrl}); ` : ""}[license](${r.rights.licenseUrl}). Display-text SHA-256: \`${r.textSha256}\`.`,
  );
}
lines.push("", "## Assertion checklist", "");
for (const a of data.assertions) {
  lines.push(
    `### ${a.id}`,
    "",
    `- [ ] Human check: **${a.label}** — \`${a.state}\`, field \`${a.field}\`.`,
    `- Value/reason: ${a.state === "recorded" || a.state === "inferred" ? JSON.stringify(a.value) : a.state === "unknown" ? a.reason : a.rationale}`,
    `- Rationale: ${a.rationale}`,
  );
  for (const ref of a.references) {
    if (ref.kind === "span") {
      const span = data.spans.find((s) => s.id === ref.spanId)!;
      const c = data.cases.find((c) =>
        c.sourceRevisionIds.includes(span.sourceRevisionId),
      );
      const url = c
        ? `http://127.0.0.1:4317/cases/${c.id}/source?source=${span.sourceRevisionId}&span=${span.id}`
        : "";
      lines.push(
        `- [${span.locator.label}](${url}) · \`${span.id}\` · UTF-16 [${span.start}, ${span.end}).`,
        `> ${span.exact.replaceAll("\n", "\n> ")}`,
      );
    } else
      lines.push(
        `- Source scope: \`${ref.sourceRevisionId}\` / ${ref.field}. Check the absence/unknown claim in this scope; it is not a claim that no other historical witness supplies the information.`,
      );
  }
  lines.push(
    "- Reviewer / qualification / date / decision / rationale: **pending**",
    "",
  );
}
mkdirSync(resolve(ROOT, "docs/review"), { recursive: true });
writeFileSync(
  resolve(ROOT, "docs/review/phase-1-corpus-review.md"),
  lines.join("\n") + "\n",
);
console.log(
  `Review packet generated for ${data.assertions.length} draft assertions; no review status changed.`,
);
