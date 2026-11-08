import { it, expect } from "vitest";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
import "@citation-js/plugin-ris";
it("formats controlled CSL metadata offline with literal Unicode contributors and an absent date", () => {
  const cite = new Cite([
    {
      id: "synthetic-unicode-fixture",
      type: "article-journal",
      title: "Synthetic α fixture",
      author: [{ literal: "李 明" }, { literal: "García" }],
    },
  ]);
  const bib = cite.format("bibtex");
  const ris = cite.format("ris");
  expect(bib).toContain("Synthetic");
  expect(ris).toContain("Synthetic");
  expect(cite.data[0]?.author?.[0]?.literal).toBe("李 明");
  expect(cite.data[0]?.issued).toBeUndefined();
});
