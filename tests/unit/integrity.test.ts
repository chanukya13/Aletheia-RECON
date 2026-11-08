import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import {
  Assertion,
  SafeUrl,
  type SourceRevisionData,
  type SpanData,
} from "@recon/contracts";
import {
  codePointToUtf16,
  contentHash,
  parseJsonStrict,
  scientificHash,
  sha256,
  utf16ToCodePoint,
  validateCorpus,
  validateSpan,
} from "@recon/core";

const root = resolve(import.meta.dirname, "../..");
const corpus = () =>
  parseJsonStrict(
    readFileSync(resolve(root, "data/corpus/recon-v1.json"), "utf8"),
  );
describe("strict JSON boundary", () => {
  it("rejects executable link protocols", () => {
    expect(SafeUrl.safeParse("javascript:alert(1)").success).toBe(false);
    expect(SafeUrl.safeParse("data:text/html,script").success).toBe(false);
    expect(
      SafeUrl.safeParse("https://wellcomecollection.org/works/dq5gv7ch")
        .success,
    ).toBe(true);
  });
  it.each([
    '{"a":1,"a":2}',
    '{"a":1,"\\u0061":2}',
    '{"__proto__":{}}',
    '{"constructor":1}',
    '{"a":1,}',
    "/*comment*/{}",
    "[1,]",
    "true false",
    "",
    '{"n":1e400}',
    '{"n":9007199254740993}',
    '"\\ud800"',
  ])("rejects unsafe input %s", (raw) =>
    expect(() => parseJsonStrict(raw)).toThrow(),
  );
  it("limits UTF-8 size and nesting before object acceptance", () => {
    expect(() => parseJsonStrict('"æ"', 3)).toThrow("JSON_SIZE_LIMIT");
    expect(() =>
      parseJsonStrict("[".repeat(65) + "0" + "]".repeat(65)),
    ).toThrow("JSON_DEPTH_LIMIT");
  });
  it("does not confuse duplicate names in distinct objects", () =>
    expect(parseJsonStrict('[{"x":1},{"x":2}]')).toEqual([{ x: 1 }, { x: 2 }]));
});
describe("canonical serialization boundary", () => {
  it("rejects accessors without executing them", () => {
    let read = false;
    const value = Object.defineProperty({}, "secret", {
      enumerable: true,
      get() {
        read = true;
        return 1;
      },
    });
    expect(() => scientificHash(value)).toThrow("JSON_NON_DATA_PROPERTY");
    expect(read).toBe(false);
  });
  it("hashes RFC 8785 key order and number forms consistently", () => {
    const hash = scientificHash({
      numbers: [Number("333333333.33333329"), 4.5, 2e-3, 1e-27],
      string: "€$\u000f\nA",
      literals: [null, true, false],
    });
    expect(hash).toBe(
      sha256(
        '{"literals":[null,true,false],"numbers":[333333333.3333333,4.5,0.002,1e-27],"string":"€$\\u000f\\nA"}',
      ),
    );
    expect(scientificHash({ z: 1, a: 2 })).toBe(scientificHash({ a: 2, z: 1 }));
    expect(scientificHash([-0])).toBe(scientificHash([0]));
  });
  it.each([
    NaN,
    Infinity,
    undefined,
    () => 1,
    Symbol("x"),
    new Date(),
    "\ud800",
    {
      toJSON() {
        return 1;
      },
    },
    { a: undefined },
    Array(2),
  ])("rejects non-plain or unsafe values", (value) =>
    expect(() => scientificHash(value)).toThrow(),
  );
  it("rejects cycles and preserves ordered sequences and source Unicode", () => {
    const cycle: unknown[] = [];
    cycle.push(cycle);
    expect(() => scientificHash(cycle)).toThrow("JSON_CYCLE");
    expect(scientificHash(["mix", "heat"])).not.toBe(
      scientificHash(["heat", "mix"]),
    );
    expect(sha256("ά")).not.toBe(sha256("ά"));
  });
  it("is invariant to object insertion order over generated records", () =>
    fc.assert(
      fc.property(
        fc.dictionary(fc.stringMatching(/^[a-z]{1,8}$/), fc.integer()),
        (object) => {
          expect(scientificHash(object)).toBe(
            scientificHash(
              Object.fromEntries(Object.entries(object).reverse()),
            ),
          );
          return true;
        },
      ),
      { numRuns: 150 },
    ));
});
describe("exact source spans", () => {
  const text = "  𐐀\r\nά · Ƿyrc wiþ æ · repeat repeat";
  const revision = {
    id: "source.r1",
    displayText: text,
    textSha256: sha256(text),
  } as SourceRevisionData;
  const make = (start: number, end: number): SpanData => ({
    id: "span-1",
    sourceRevisionId: revision.id,
    sourceTextSha256: revision.textSha256,
    start,
    end,
    exact: text.slice(start, end),
    prefix: text.slice(Math.max(0, start - 32), start),
    suffix: text.slice(end, end + 32),
    locator: { label: "test fixture" },
  });
  it("preserves CRLF, combining Greek, Old English, repeated quotes and whitespace", () => {
    for (const quote of ["𐐀", "\r\nά", "Ƿyrc wiþ æ", "repeat"]) {
      const start = text.lastIndexOf(quote);
      expect(() =>
        validateSpan(make(start, start + quote.length), revision),
      ).not.toThrow();
    }
  });
  it("rejects quote drift, incorrect prefix, out-of-bounds, hash drift and surrogate splitting", () => {
    const span = make(2, 4);
    expect(() => validateSpan({ ...span, exact: "x" }, revision)).toThrow(
      "SPAN_QUOTE",
    );
    expect(() => validateSpan({ ...span, prefix: "bad" }, revision)).toThrow(
      "SPAN_QUOTE",
    );
    expect(() => validateSpan({ ...span, end: 999 }, revision)).toThrow(
      "SPAN_QUOTE",
    );
    expect(() =>
      validateSpan({ ...span, sourceTextSha256: "0".repeat(64) }, revision),
    ).toThrow("SPAN_REVISION");
    expect(() => validateSpan(make(2, 3), revision)).toThrow(
      "SPAN_SURROGATE_BOUNDARY",
    );
  });
  it("converts W3C code-point offsets explicitly and reversibly", () => {
    for (let n = 0; n <= Array.from(text).length; n++)
      expect(utf16ToCodePoint(text, codePointToUtf16(text, n))).toBe(n);
    expect(utf16ToCodePoint(text, 4)).toBe(3);
    expect(() => utf16ToCodePoint(text, 3)).toThrow();
    expect(() => codePointToUtf16(text, 999)).toThrow();
  });
});
describe("scientific corpus validation", () => {
  it("rejects metadata pointers that do not resolve to an actual field", () => {
    const data = validateCorpus(corpus());
    const a = data.assertions.find((a) => a.state === "unknown")!;
    a.references = [
      {
        kind: "metadata",
        sourceRevisionId: data.sourceRevisions[0]!.id,
        field: "missing",
      },
    ];
    expect(() => validateCorpus(data)).toThrow("METADATA_FIELD_MISSING");
  });
  it("checks curated MIC outcomes against independently read primary table cells", () => {
    const data = validateCorpus(corpus());
    const xml = new DOMParser().parseFromString(
      readFileSync(resolve(root, "data/sources/raw/PMC6261618.xml"), "utf8"),
      "application/xml",
    );
    const table = Array.from(xml.getElementsByTagName("table-wrap")).find(
      (t) => t.getAttribute("id") === "pone.0208108.t002",
    )!;
    const rows = Array.from(table.getElementsByTagName("tr"));
    const cells = (row: Element) =>
      Array.from(row.getElementsByTagName("td")).map((td) =>
        (td.textContent ?? "").replace(/\s+/g, "").trim(),
      );
    for (const strain of ["ATCC-6538", "LAC"]) {
      const primary = rows
        .map(cells)
        .find((c) => c[0] === strain.replace("-", ""))!;
      expect(primary).toBeDefined();
      for (const [i, arm] of ["es-o", "es-l", "es-gbbr", "es-gb"].entries()) {
        const unit = data.evidenceUnits.find(
          (u) => u.id === `eu-2018-${arm}-${strain.toLowerCase()}`,
        )!;
        const outcome = data.assertions.find(
          (a) => a.id === unit.outcomeAssertionId,
        )!;
        expect(outcome.state).toBe("recorded");
        if (outcome.state === "recorded")
          expect(outcome.value).toMatchObject({
            value: Number(primary[i + 1]),
            unit: "% v/v",
          });
      }
    }
  });
  it("keeps absent recipe details and uncurated outcomes explicitly unknown", () => {
    const data = validateCorpus(corpus());
    const oxymel = data.assertions.find(
      (a) => a.id === "a-oxymel-composition",
    )!;
    expect(oxymel.state).toBe("unknown");
    expect(
      data.evidenceUnits
        .filter((u) => u.studyId !== "study-fuchs-2018")
        .every((u) => {
          const a = data.assertions.find((a) => a.id === u.outcomeAssertionId)!;
          return a.state === "unknown" && a.reason === "not_reviewed";
        }),
    ).toBe(true);
    expect(
      data.candidates.some((c) => c.proposedName === "Allium oleraceum?"),
    ).toBe(true);
    expect(
      data.cases.every((c) => c.baselineScenarioInput.assignments.length === 0),
    ).toBe(true);
  });
  it("resolves all authentic sources, claims and 14 actual material/context units", () => {
    const data = validateCorpus(corpus());
    expect(data.cases).toHaveLength(2);
    expect(data.studies).toHaveLength(3);
    expect(data.evidenceUnits).toHaveLength(14);
    expect(data.assertions.every((a) => a.review.status === "pending")).toBe(
      true,
    );
    expect(data.materials.every((m) => m.fingerprint === null)).toBe(true);
  });
  it("rejects empty unknown states, unresolved references and text drift", () => {
    const data = validateCorpus(corpus());
    const a = data.assertions.find((a) => a.state === "unknown")!;
    expect(Assertion.safeParse({ ...a, reason: "" }).success).toBe(false);
    const broken = structuredClone(data);
    broken.evidenceUnits[0]!.studyId = "missing";
    expect(() => validateCorpus(broken)).toThrow("UNRESOLVED_REFERENCE");
    const drift = structuredClone(data);
    drift.sourceRevisions[0]!.displayText += " ";
    expect(() => validateCorpus(drift)).toThrow("SOURCE_HASH");
  });
  it("rejects wrong source span, process cycles and tampered case hashes", () => {
    const data = validateCorpus(corpus());
    data.spans[0]!.exact = "invented";
    expect(() => validateCorpus(data)).toThrow("SPAN_QUOTE");
    const cycle = validateCorpus(corpus());
    cycle.materials[0]!.steps[0]!.followsStepIds = ["step-maturation"];
    expect(() => validateCorpus(cycle)).toThrow();
    const changed = validateCorpus(corpus());
    changed.cases[0]!.title = "changed";
    expect(() => validateCorpus(changed)).toThrow("CASE_HASH");
  });
  it("hashes material record integrity separately from unimplemented scientific fingerprints", () => {
    const data = validateCorpus(corpus());
    expect(data.materials[0]!.recordHash).toHaveLength(64);
    expect(contentHash(data.cases[0]!)).toBe(data.cases[0]!.contentHash);
  });
});
