import { it, expect } from "vitest";
import { licensedParagraphs } from "../../apps/server/src/full-text.js";
it("recognizes a permissions license URI nested in JATS license-p/ext-link", () => {
  expect(
    licensedParagraphs(
      '<article xmlns:xlink="http://www.w3.org/1999/xlink"><front><permissions><license><license-p><ext-link xlink:href="http://creativecommons.org/licenses/by/4.0/">CC BY</ext-link></license-p></license></permissions></front><body><p>Licensed paragraph.</p></body></article>',
    ).license,
  ).toBe("http://creativecommons.org/licenses/by/4.0/");
});
it("requires article permissions and omits non-paragraph third-party blocks", () => {
  const result = licensedParagraphs(
    '<article xmlns:xlink="http://www.w3.org/1999/xlink"><front><permissions><license xlink:href="https://creativecommons.org/licenses/by/4.0/"/></permissions></front><body><sec><p>Source paragraph α.</p><fig><p>Excluded figure.</p></fig></sec></body></article>',
  );
  expect(result.text).toBe("Source paragraph α.");
});
it.each(["", "-nc", "-nd"])(
  "refuses unknown or restricted license %s",
  (suffix) => {
    expect(() =>
      licensedParagraphs(
        `<article><license href="https://creativecommons.org/licenses/by${suffix}/3.0/"/><body><p>text</p></body></article>`,
      ),
    ).toThrow();
  },
);
it("rejects entity declarations before parsing", () => {
  expect(() =>
    licensedParagraphs(
      '<!DOCTYPE article [<!ENTITY x SYSTEM "file:///private">]><article/>',
    ),
  ).toThrow();
});
