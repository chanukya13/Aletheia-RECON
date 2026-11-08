import { it, expect } from "vitest";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
import "@citation-js/plugin-ris";
import { BibliographicRecord } from "@recon/contracts";
import { bibliographyDownload } from "../../apps/server/src/bibliography.js";
it("round-trips controlled non-Latin titles/names and preserves an explicitly absent date without a resolver", () => {
  const item = BibliographicRecord.parse({
    id: "synthetic-unicode-interchange",
    type: "book",
    title: "漢方と医学 / α — synthetic interoperability fixture",
    creators: [
      { name: "李 明", role: "author" },
      { name: "José García", role: "translator" },
    ],
    issued: "Unknown",
    edition: "Controlled synthetic test, not a research source",
    identifiers: {},
    sourceRevisionId: "synthetic-source.r1",
  });
  const fetchBefore = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw Error("Unexpected bibliography resolver call");
  };
  try {
    const csl = JSON.parse(bibliographyDownload([item], "csl-json"));
    expect(csl[0].author[0].literal).toBe("李 明");
    expect(csl[0].translator[0].literal).toBe("José García");
    expect(csl[0].issued).toBeUndefined();
    for (const format of ["bibtex", "ris"] as const) {
      const text = bibliographyDownload([item], format),
        parsed = new Cite(text).data;
      expect(parsed).toHaveLength(1);
      expect(parsed[0]!.title).toBe(item.title);
      const values = JSON.stringify(parsed);
      expect(values).toContain("李");
      expect(values).toContain("明");
      expect(parsed[0]!.issued).toBeUndefined();
    }
    expect(calls).toBe(0);
  } finally {
    globalThis.fetch = fetchBefore;
  }
});
