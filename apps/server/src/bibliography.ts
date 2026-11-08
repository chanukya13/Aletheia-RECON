import { Cite, plugins } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
import "@citation-js/plugin-ris";
import { BibliographicRecord, type DossierData } from "@recon/contracts";
import { z } from "zod";
// Preserve Unicode and stable supplied reference IDs. The upstream default
// ASCII-only formatter silently removes characters it cannot transliterate.
const bibtexConfig = plugins.config.get("@bibtex") as {
  format: { asciiOnly: boolean; useIdAsLabel: boolean };
};
bibtexConfig.format.asciiOnly = false;
bibtexConfig.format.useIdAsLabel = true;
type Record = z.infer<typeof BibliographicRecord>;
export function referencesFor(b: DossierData): Record[] {
  return b.scientific.corpus.bibliography;
}
export function toCsl(records: Record[]) {
  return records.map((raw) => {
    const r = BibliographicRecord.parse(raw),
      year = r.issued.match(/^\d{4}/)?.[0];
    return {
      id: r.id,
      type: r.type,
      title: r.title,
      ...Object.fromEntries(
        ["author", "editor", "translator"].map((role) => [
          role,
          r.creators
            .filter((c) => c.role === role)
            .map((c) => ({ literal: c.name })),
        ]),
      ),
      ...(year ? { issued: { "date-parts": [[Number(year)]] } } : {}),
      ...(r.identifiers.doi ? { DOI: r.identifiers.doi } : {}),
      ...(r.identifiers.url ? { URL: r.identifiers.url } : {}),
      ...(r.edition ? { edition: r.edition } : {}),
      note: `Original issued metadata: ${r.issued}; source revision: ${r.sourceRevisionId}. Bibliographic review pending.`,
    };
  });
}
export function bibliographyDownload(
  records: Record[],
  format: "csl-json" | "bibtex" | "ris",
) {
  const csl = toCsl(records);
  if (format === "csl-json") return JSON.stringify(csl, null, 2) + "\n";
  const cite = new Cite(csl);
  if (format === "ris") {
    // The upstream text formatter folds every 70 characters, including inside words.
    // Reuse its structured field mapping, then serialize unwrapped RIS lines.
    const entries = cite.format("ris", {
      format: "object",
    }) as unknown as Array<{
      [tag: string]: string | number | Array<string | number>;
    }>;
    return (
      entries
        .map((entry) =>
          [
            `TY  - ${String(entry.TY)}`,
            ...Object.entries(entry)
              .filter(([tag]) => tag !== "TY" && tag !== "ER")
              .flatMap(([tag, value]) =>
                (Array.isArray(value) ? value : [value]).map(
                  (v) =>
                    `${tag}  - ${String(v).replace(/[\r\n\u2028\u2029]/g, " ")}`,
                ),
              ),
            "ER  - ",
          ].join("\n"),
        )
        .join("\n\n") + "\n"
    );
  }
  return cite.format(format) as string;
}
