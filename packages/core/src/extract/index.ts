import type { ProposalData, SourceRevisionData } from "@recon/contracts";
import { scientificHash, validateSpan } from "../integrity.js";
import {
  CONTACTS,
  EXTRACTOR_VERSION,
  INGREDIENTS,
  OPERATIONS,
} from "./lexicon.js";
export { EXTRACTOR_VERSION } from "./lexicon.js";
export const LEXICON_HASH = scientificHash({
  INGREDIENTS,
  OPERATIONS,
  CONTACTS,
});
export const EXTRACTOR_COVERAGE =
  "English preparation mentions, explicit operations, bounded metric quantities, time/temperature and equality wording. Proposals need review; no translation, taxon identification or historical-unit inference.";
export function normalizeForSearch(text: string): {
  text: string;
  starts: number[];
  ends: number[];
} {
  let result = "",
    offset = 0;
  const starts: number[] = [],
    ends: number[] = [];
  for (const point of text) {
    const start = offset;
    offset += point.length;
    const normalized = point
      .normalize("NFKC")
      .toLocaleLowerCase("en")
      .replace(/[’‘]/g, "'");
    for (const char of normalized) {
      if (/\s/u.test(char)) {
        if (result.endsWith(" ")) {
          ends[ends.length - 1] = offset;
          continue;
        }
        result += " ";
        starts.push(start);
        ends.push(offset);
      } else {
        result += char;
        for (let i = 0; i < char.length; i++) {
          starts.push(start);
          ends.push(offset);
        }
      }
    }
  }
  return { text: result, starts, ends };
}
export function makeSpan(
  revision: SourceRevisionData,
  id: string,
  start: number,
  end: number,
) {
  let prefixStart = Math.max(0, start - 32),
    suffixEnd = Math.min(revision.displayText.length, end + 32);
  if (!revision.displayText.slice(prefixStart, start).isWellFormed())
    prefixStart++;
  if (!revision.displayText.slice(end, suffixEnd).isWellFormed()) suffixEnd--;
  const span = {
    id,
    sourceRevisionId: revision.id,
    sourceTextSha256: revision.textSha256,
    start,
    end,
    exact: revision.displayText.slice(start, end),
    prefix: revision.displayText.slice(prefixStart, start),
    suffix: revision.displayText.slice(end, suffixEnd),
    locator: revision.locator,
  };
  validateSpan(span, revision);
  return span;
}
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const numbers: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  twelve: 12,
  twenty: 20,
};
export function extractPreparation(
  revision: SourceRevisionData,
  language: string,
  sourceKind: string,
) {
  const base = {
    extractorVersion: EXTRACTOR_VERSION,
    coverage: EXTRACTOR_COVERAGE,
    language,
    terms: [...INGREDIENTS],
    proposals: [] as ProposalData[],
  };
  if (!/^en(?:-|$)/i.test(language))
    return { ...base, status: "unsupported_language" as const };
  if (sourceKind === "taxonomy_snapshot" || sourceKind === "primary_study")
    return { ...base, status: "unsupported_context" as const };
  const search = normalizeForSearch(revision.displayText);
  const boundary = revision.displayText.indexOf("Editorial footnote");
  const sourceLimit = boundary < 0 ? revision.displayText.length : boundary;
  const proposals: ProposalData[] = [];
  function add(
    kind: ProposalData["kind"],
    field: string,
    value: ProposalData["value"],
    start: number,
    end: number,
    label: string,
  ) {
    const a = search.starts[start],
      b = search.ends[end - 1];
    if (
      a === undefined ||
      b === undefined ||
      a >= sourceLimit ||
      proposals.length >= 300
    )
      return;
    const seed = scientificHash({
      revision: revision.id,
      text: revision.textSha256,
      kind,
      start: a,
      end: b,
      version: EXTRACTOR_VERSION,
      lexicon: LEXICON_HASH,
    }).slice(0, 24);
    const clause = search.text.slice(
      Math.max(
        0,
        search.text.lastIndexOf(",", start - 1) + 1,
        search.text.lastIndexOf(";", start - 1) + 1,
        search.text.lastIndexOf(".", start - 1) + 1,
      ),
      end,
    );
    const negated =
      /\b(?:without|omit|omitting|exclude|excluding|never|no)\b[^,;.]*$|\bnot(?!\s+only)\b[^,;.]{0,60}$/u.test(
        clause,
      );
    const context =
      /\b(?:take|add|pound|crush|mix|combine|boil|heat|strain|steep|put|prepare)\b/u.test(
        search.text.slice(
          Math.max(0, start - 100),
          Math.min(search.text.length, end + 80),
        ),
      )
        ? ("preparation_syntax" as const)
        : ("mention_only" as const);
    const span = makeSpan(revision, `span-${seed}`, a, b);
    proposals.push({
      id: `proposal-${seed}`,
      kind,
      field,
      label,
      value,
      span,
      polarity: negated ? "negated" : "present",
      context,
      relatedProposalIds: [],
      note: negated
        ? "Negation/omission cue detected. Acceptance records an exclusion, not an included ingredient or performed operation."
        : context === "mention_only"
          ? "Mention only: inspect whether it belongs to the preparation before accepting."
          : "Lexicon/grammar proposal only. Confirm role and wording in the cited source.",
    });
  }
  const occupied: Array<[number, number]> = [];
  for (const term of [...INGREDIENTS].sort((a, b) => b.length - a.length)) {
    const re = new RegExp(
      `(?<![\\p{L}\\p{M}\\p{N}_])${escape(term)}(?![\\p{L}\\p{M}\\p{N}_])`,
      "gu",
    );
    for (const m of search.text.matchAll(re)) {
      const start = m.index,
        end = start + m[0].length;
      if (occupied.some(([a, b]) => start < b && end > a)) continue;
      occupied.push([start, end]);
      add(
        "ingredient",
        "ingredient.term",
        term,
        start,
        end,
        `Ingredient mention · ${term}`,
      );
    }
  }
  for (const [operation, forms] of Object.entries(OPERATIONS)) {
    const re = new RegExp(
      `(?<![\\p{L}\\p{M}\\p{N}_])(?:${forms.map(escape).join("|")})(?![\\p{L}\\p{M}\\p{N}_])`,
      "gu",
    );
    for (const m of search.text.matchAll(re))
      add(
        "operation",
        "preparation.operation",
        operation,
        m.index,
        m.index + m[0].length,
        `Operation · ${operation}`,
      );
  }
  for (const contact of CONTACTS)
    for (const m of search.text.matchAll(
      new RegExp(`\\b${escape(contact)}\\b`, "gu"),
    ))
      add(
        "contact",
        "preparation.contact",
        contact,
        m.index,
        m.index + m[0].length,
        "Contact material",
      );
  const numeric =
    "(?:-?\\d+(?:\\.\\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|twelve|twenty)";
  const re = new RegExp(
    `(?<![\\p{L}\\p{N}.])(${numeric})\\s*(kg|mg|g|ml|μl|µl|l|days?|hours?|minutes?|°\\s*c)(?![\\p{L}\\p{N}])`,
    "gu",
  );
  for (const m of search.text.matchAll(re)) {
    const value = numbers[m[1]!] ?? Number(m[1]);
    if (!Number.isFinite(value)) continue;
    const rawUnit = m[2]!.replace(/\s/g, "");
    const duration = /^(day|hour|minute)/.test(rawUnit),
      temperature = rawUnit.startsWith("°");
    const unit = duration
      ? rawUnit.replace(/s$/, "")
      : temperature
        ? "°C"
        : rawUnit === "ml"
          ? "mL"
          : rawUnit === "l"
            ? "L"
            : /[μµ]l/.test(rawUnit)
              ? "µL"
              : rawUnit;
    const basis = ["kg", "mg", "g"].includes(unit)
      ? "mass"
      : ["L", "mL", "µL"].includes(unit)
        ? "volume"
        : "unknown";
    add(
      duration ? "duration" : temperature ? "temperature" : "quantity",
      duration
        ? "preparation.duration"
        : temperature
          ? "preparation.temperature"
          : "quantity.amount",
      {
        value,
        unit,
        basis,
        dimension: duration ? "time" : temperature ? "temperature" : basis,
      },
      m.index,
      m.index + m[0].length,
      duration
        ? "Explicit duration"
        : temperature
          ? "Explicit temperature"
          : "Explicit quantity",
    );
  }
  for (const m of search.text.matchAll(
    /\b(?:of\s+(?:both|all)\s+)?equal\s+(?:quantities|volumes|masses|weights)\b/gu,
  )) {
    const basis = /volumes/.test(m[0])
      ? "volume"
      : /masses|weights/.test(m[0])
        ? "mass"
        : "unknown";
    add(
      "quantity",
      "quantity.relationship",
      { relationship: "equal", basis, dimension: basis },
      m.index,
      m.index + m[0].length,
      "Explicit equality relationship",
    );
  }
  proposals.sort(
    (a, b) => a.span.start - b.span.start || a.kind.localeCompare(b.kind),
  );
  for (const p of proposals) {
    if (p.kind === "quantity") {
      const prior = proposals.filter(
        (q) =>
          q.kind === "ingredient" &&
          q.polarity === "present" &&
          q.span.end <= p.span.start,
      );
      const equal =
        typeof p.value === "object" &&
        p.value !== null &&
        "relationship" in p.value;
      if (equal) p.relatedProposalIds = prior.slice(-2).map((q) => q.id);
      else {
        const nearest = proposals
          .filter(
            (q) =>
              q.kind === "ingredient" &&
              q.polarity === "present" &&
              Math.min(
                Math.abs(q.span.start - p.span.end),
                Math.abs(p.span.start - q.span.end),
              ) < 60,
          )
          .sort(
            (a, b) =>
              Math.abs(a.span.start - p.span.start) -
              Math.abs(b.span.start - p.span.start),
          )[0];
        if (nearest) p.relatedProposalIds = [nearest.id];
      }
    } else if (
      ["duration", "temperature", "contact", "matrix"].includes(p.kind)
    ) {
      const previous = proposals
        .filter(
          (q) =>
            q.kind === "operation" &&
            q.polarity === "present" &&
            q.span.start < p.span.start,
        )
        .at(-1);
      if (previous) p.relatedProposalIds = [previous.id];
    } else if (p.kind === "operation") {
      const previous = proposals
        .filter(
          (q) =>
            q.kind === "operation" &&
            q.polarity === "present" &&
            q.span.end < p.span.start,
        )
        .at(-1);
      if (
        previous &&
        /\b(?:then|next|afterwards|followed by)\b/i.test(
          revision.displayText.slice(previous.span.end, p.span.start),
        )
      )
        p.relatedProposalIds = [previous.id];
    }
  }
  return { ...base, status: "supported" as const, proposals };
}
