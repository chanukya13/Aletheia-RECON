import { createHash } from "node:crypto";
import canonicalize from "canonicalize";
import {
  visit,
  type ParseError,
  parse,
  printParseErrorCode,
} from "jsonc-parser";
import {
  Corpus,
  type CorpusData,
  type SpanData,
  type SourceRevisionData,
} from "@recon/contracts";

const unsafeKeys = new Set(["__proto__", "prototype", "constructor"]);
export function parseJsonStrict(raw: string, maxBytes = 2_000_000): unknown {
  if (Buffer.byteLength(raw, "utf8") > maxBytes)
    throw new Error("JSON_SIZE_LIMIT");
  let nesting = 0,
    quoted = false,
    escaped = false;
  for (const char of raw) {
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === "{" || char === "[") {
      if (++nesting > 64) throw new Error("JSON_DEPTH_LIMIT");
    } else if (char === "}" || char === "]") nesting--;
  }
  const stack: Array<Set<string> | null> = [];
  let violation = "";
  visit(
    raw,
    {
      onObjectBegin() {
        stack.push(new Set());
        if (stack.length > 64) violation = "JSON_DEPTH_LIMIT";
      },
      onArrayBegin() {
        stack.push(null);
        if (stack.length > 64) violation = "JSON_DEPTH_LIMIT";
      },
      onObjectEnd() {
        stack.pop();
      },
      onArrayEnd() {
        stack.pop();
      },
      onObjectProperty(key) {
        const keys = stack.at(-1);
        if (unsafeKeys.has(key)) violation = "JSON_UNSAFE_KEY";
        if (keys?.has(key)) violation = "JSON_DUPLICATE_KEY";
        keys?.add(key);
      },
      onComment() {
        violation = "JSON_COMMENTS_FORBIDDEN";
      },
    },
    { disallowComments: true, allowTrailingComma: false },
  );
  if (violation) throw new Error(violation);
  const errors: ParseError[] = [];
  const value: unknown = parse(raw, errors, {
    disallowComments: true,
    allowTrailingComma: false,
    allowEmptyContent: false,
  });
  if (errors.length)
    throw new Error(`JSON_INVALID:${printParseErrorCode(errors[0]!.error)}`);
  validatePlainJson(value);
  return value;
}
export function validatePlainJson(
  value: unknown,
  seen = new Set<object>(),
  depth = 0,
): void {
  if (depth > 64) throw new Error("JSON_DEPTH_LIMIT");
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") {
    if (!value.isWellFormed()) throw new Error("JSON_INVALID_UNICODE");
    return;
  }
  if (typeof value === "number") {
    if (
      !Number.isFinite(value) ||
      (Number.isInteger(value) && !Number.isSafeInteger(value))
    )
      throw new Error("JSON_UNSAFE_NUMBER");
    return;
  }
  if (typeof value !== "object") throw new Error("JSON_NON_DATA_VALUE");
  if (seen.has(value)) throw new Error("JSON_CYCLE");
  if (
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  )
    throw new Error("JSON_NON_PLAIN_OBJECT");
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string") throw new Error("JSON_SYMBOL_KEY");
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (
      "get" in descriptor ||
      "set" in descriptor ||
      (!descriptor.enumerable && !(Array.isArray(value) && key === "length"))
    )
      throw new Error("JSON_NON_DATA_PROPERTY");
    if (
      Array.isArray(value) &&
      key !== "length" &&
      !/^(0|[1-9][0-9]*)$/.test(key)
    )
      throw new Error("JSON_ARRAY_PROPERTY");
  }
  seen.add(value);
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (!(i in value)) throw new Error("JSON_SPARSE_ARRAY");
      validatePlainJson(value[i], seen, depth + 1);
    }
  } else
    for (const [key, item] of Object.entries(value)) {
      if (unsafeKeys.has(key)) throw new Error("JSON_UNSAFE_KEY");
      validatePlainJson(key, seen, depth + 1);
      validatePlainJson(item, seen, depth + 1);
    }
  seen.delete(value);
}
export const sha256 = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");
export function scientificHash(payload: unknown): string {
  validatePlainJson(payload);
  const json = canonicalize(payload);
  if (json === undefined) throw new Error("JSON_EMPTY");
  return sha256(json);
}
export function contentHash(value: object): string {
  const { contentHash: _hash, ...payload } = value as Record<string, unknown>;
  return scientificHash(payload);
}
// Semantic set normalization is explicit; do not sort ordered processing steps or source text.
export function materialRecordHash(material: Record<string, unknown>): string {
  const {
    recordHash: _r,
    fingerprint: _f,
    fingerprintPayload: _p,
    canonicalization: _c,
    ...payload
  } = material;
  return scientificHash(payload);
}
export function validateSpan(
  span: SpanData,
  revision: SourceRevisionData,
): void {
  if (
    span.sourceRevisionId !== revision.id ||
    span.sourceTextSha256 !== revision.textSha256
  )
    throw new Error(`SPAN_REVISION:${span.id}`);
  const text = revision.displayText;
  if (
    span.start < 0 ||
    span.end > text.length ||
    text.slice(span.start, span.end) !== span.exact ||
    text.slice(Math.max(0, span.start - span.prefix.length), span.start) !==
      span.prefix ||
    text.slice(span.end, span.end + span.suffix.length) !== span.suffix
  )
    throw new Error(`SPAN_QUOTE:${span.id}`);
  if (
    !text.slice(0, span.start).isWellFormed() ||
    !text.slice(0, span.end).isWellFormed()
  )
    throw new Error(`SPAN_SURROGATE_BOUNDARY:${span.id}`);
}
export function utf16ToCodePoint(text: string, offset: number): number {
  if (
    !Number.isInteger(offset) ||
    offset < 0 ||
    offset > text.length ||
    !text.isWellFormed() ||
    !text.slice(0, offset).isWellFormed()
  )
    throw new Error("INVALID_UTF16_OFFSET");
  return Array.from(text.slice(0, offset)).length;
}
export function codePointToUtf16(text: string, offset: number): number {
  const chars = Array.from(text);
  if (
    !text.isWellFormed() ||
    !Number.isInteger(offset) ||
    offset < 0 ||
    offset > chars.length
  )
    throw new Error("INVALID_CODEPOINT_OFFSET");
  return chars.slice(0, offset).join("").length;
}
export function validateCorpus(
  input: unknown,
  options: { omittedSourceRevisionIds?: string[] } = {},
): CorpusData {
  const data = Corpus.parse(input);
  const all = new Set<string>();
  const collections = [
    data.sources,
    data.sourceRevisions,
    data.spans,
    data.assertions,
    data.materials,
    data.candidates,
    data.taxa,
    data.studies,
    data.evidenceUnits,
    data.bibliography,
    data.interpretationGroups,
  ];
  for (const collection of collections)
    for (const item of collection) {
      if (all.has(item.id)) throw new Error(`DUPLICATE_ID:${item.id}`);
      all.add(item.id);
    }
  const revisions = new Map(data.sourceRevisions.map((r) => [r.id, r]));
  const spans = new Map(data.spans.map((s) => [s.id, s]));
  const assertions = new Map(data.assertions.map((a) => [a.id, a]));
  const ids = <T extends { id: string }>(rows: T[]) =>
    new Set(rows.map((r) => r.id));
  const requireId = (set: Set<string> | Map<string, unknown>, id: string) => {
    if (!set.has(id)) throw new Error(`UNRESOLVED_REFERENCE:${id}`);
  };
  const materials = ids(data.materials),
    sources = ids(data.sources),
    studies = ids(data.studies),
    candidates = ids(data.candidates),
    units = ids(data.evidenceUnits);
  for (const r of data.sourceRevisions) {
    requireId(sources, r.sourceId);
    if (
      !options.omittedSourceRevisionIds?.includes(r.id) &&
      (r.textSha256 !== sha256(r.displayText) ||
        r.contentHash !== contentHash(r))
    )
      throw new Error(`SOURCE_HASH:${r.id}`);
    if (
      r.rights.decision === "bundle_allowed" &&
      (!r.rights.storage || !r.rights.display || !r.rights.redistribution)
    )
      throw new Error(`RIGHTS_INCONSISTENT:${r.id}`);
  }
  for (const s of data.spans) {
    requireId(revisions, s.sourceRevisionId);
    if (!options.omittedSourceRevisionIds?.includes(s.sourceRevisionId))
      validateSpan(s, revisions.get(s.sourceRevisionId)!);
    else if (
      s.sourceTextSha256 !== revisions.get(s.sourceRevisionId)!.textSha256
    )
      throw new Error(`SPAN_REVISION:${s.id}`);
  }
  for (const a of data.assertions) {
    a.inputAssertionIds.forEach((id) => requireId(assertions, id));
    if (a.state === "contested")
      a.competingAssertionIds.forEach((id) => requireId(assertions, id));
    if (
      ["recorded", "inferred", "contested"].includes(a.state) &&
      !a.references.length &&
      !a.inputAssertionIds.length
    )
      throw new Error(`ASSERTION_NO_BASIS:${a.id}`);
    for (const ref of a.references) {
      if (ref.kind === "span") requireId(spans, ref.spanId);
      else {
        requireId(revisions, ref.sourceRevisionId);
        const revision = revisions.get(ref.sourceRevisionId)!;
        let field: unknown = {
          ...revision,
          source: data.sources.find((s) => s.id === revision.sourceId)!,
        };
        for (const key of ref.field.split(".")) {
          if (
            field === null ||
            typeof field !== "object" ||
            !Object.hasOwn(field, key)
          )
            throw new Error(`METADATA_FIELD_MISSING:${a.id}:${ref.field}`);
          field = (field as Record<string, unknown>)[key];
        }
      }
    }
  }
  for (const m of data.materials) {
    m.assertionIds.forEach((id) => requireId(assertions, id));
    if (materialRecordHash(m) !== m.recordHash)
      throw new Error(`MATERIAL_HASH:${m.id}`);
    if (
      (m.fingerprint === null) !== (m.fingerprintPayload === null) ||
      (m.fingerprintPayload !== null &&
        scientificHash(m.fingerprintPayload) !== m.fingerprint)
    )
      throw new Error(`MATERIAL_FINGERPRINT:${m.id}`);
    const slots = ids(m.componentSlots),
      steps = ids(m.steps),
      quantities = ids(m.quantities);
    for (const s of m.componentSlots) {
      [s.termAssertionId, s.partAssertionId, s.stateAssertionId].forEach((id) =>
        requireId(assertions, id),
      );
      s.candidateIds.forEach((id) => requireId(candidates, id));
      s.quantityIds.forEach((id) => requireId(quantities, id));
    }
    for (const s of m.steps) {
      requireId(assertions, s.operationAssertionId);
      s.detailAssertionIds.forEach((id) => requireId(assertions, id));
      s.inputSlotIds.forEach((id) => requireId(slots, id));
      s.followsStepIds.forEach((id) => requireId(steps, id));
    }
    for (const q of m.quantities) {
      requireId(assertions, q.assertionId);
      q.equalToSlotIds.forEach((id) => requireId(slots, id));
    }
    const visited = new Set<string>(),
      visiting = new Set<string>();
    const visitStep = (id: string) => {
      if (visiting.has(id)) throw new Error("PROCESS_CYCLE");
      if (visited.has(id)) return;
      visiting.add(id);
      m.steps.find((s) => s.id === id)!.followsStepIds.forEach(visitStep);
      visiting.delete(id);
      visited.add(id);
    };
    m.steps.forEach((s) => visitStep(s.id));
  }
  for (const c of data.candidates) {
    if (
      !data.materials.some((m) =>
        m.componentSlots.some((s) => s.id === c.occurrenceId),
      )
    )
      throw new Error(`CANDIDATE_OCCURRENCE:${c.id}`);
    c.supportAssertionIds.forEach((id) => requireId(assertions, id));
    if (c.taxonConceptId) requireId(ids(data.taxa), c.taxonConceptId);
  }
  for (const s of data.studies)
    s.sourceRevisionIds.forEach((id) => requireId(revisions, id));
  for (const u of data.evidenceUnits) {
    requireId(studies, u.studyId);
    requireId(materials, u.testedMaterialVersionId);
    [
      ...u.contextAssertionIds,
      u.comparatorAssertionId,
      u.endpointAssertionId,
      u.outcomeAssertionId,
    ].forEach((id) => requireId(assertions, id));
    u.supportSpanIds.forEach((id) => requireId(spans, id));
  }
  const caseRevisions = new Set<string>();
  for (const c of data.cases) {
    const key = `${c.id}:${c.revision}`;
    if (caseRevisions.has(key)) throw new Error("DUPLICATE_CASE_REVISION");
    caseRevisions.add(key);
    c.sourceRevisionIds.forEach((id) => requireId(revisions, id));
    requireId(revisions, c.primarySourceRevisionId);
    if (c.originalSourceRevisionId)
      requireId(revisions, c.originalSourceRevisionId);
    requireId(materials, c.materialVersionId);
    [...c.assertionIds, ...c.historicalUseAssertionIds].forEach((id) =>
      requireId(assertions, id),
    );
    c.evidenceUnitIds.forEach((id) => requireId(units, id));
    c.baselineScenarioInput.assignments.forEach((a) => {
      requireId(candidates, a.candidateId);
      if (
        !data.candidates.some(
          (v) => v.id === a.candidateId && v.occurrenceId === a.occurrenceId,
        )
      )
        throw new Error("SCENARIO_SCOPE");
    });
    if (
      c.supersedes &&
      !data.cases.some(
        (old) =>
          `${old.id}.r${old.revision}` === c.supersedes &&
          old.id === c.id &&
          old.revision < c.revision,
      )
    )
      throw new Error(`CASE_SUPERSEDES:${key}`);
    const allowedCorpora = new Set([
      data.revision,
      ...(data.corpusHistory ?? []).map((h) => h.id),
    ]);
    if (
      c.contentHash !== contentHash(c) ||
      !allowedCorpora.has(c.corpusRevision)
    )
      throw new Error(`CASE_HASH:${key}`);
  }
  for (const b of data.bibliography) requireId(revisions, b.sourceRevisionId);
  for (const taxon of data.taxa) {
    requireId(revisions, taxon.sourceRevisionId);
    taxon.supportingSourceRevisionIds?.forEach((id) =>
      requireId(revisions, id),
    );
  }
  for (const group of data.interpretationGroups) {
    const alternativeIds = new Set<string>();
    for (const alternative of group.alternatives) {
      if (alternativeIds.has(alternative.id))
        throw new Error("DUPLICATE_INTERPRETATION");
      alternativeIds.add(alternative.id);
      alternative.supportingAssertionIds.forEach((id) =>
        requireId(assertions, id),
      );
      const assigned = new Set<string>();
      for (const assignment of alternative.assignments) {
        const candidate = data.candidates.find(
          (c) => c.id === assignment.candidateId,
        );
        if (
          !candidate ||
          candidate.occurrenceId !== assignment.occurrenceId ||
          assigned.has(assignment.occurrenceId)
        )
          throw new Error("INTERPRETATION_SCOPE");
        assigned.add(assignment.occurrenceId);
      }
    }
  }
  return data;
}
