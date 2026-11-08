import { z } from "zod";
import {
  AnalysisRecord,
  AuditRequest,
  BoundedScenario,
  DossierBundleV1,
  MaterialVersionComparisonRequest,
  ReplayReceipt,
  ScenarioDiffRequest,
  ScenarioEvaluateRequest,
  type CorpusData,
  type DossierData,
} from "@recon/contracts";
import {
  contentHash,
  materialRecordHash,
  scientificHash,
  validateCorpus,
} from "./integrity.js";
import {
  aggregateFindings,
  compareMaterials,
  MATERIAL_POLICY,
  POLICY_HASH,
} from "./compare.js";
import {
  buildGroups,
  deriveNameFacts,
  diffScenarios,
  evaluateScenario,
  runRobustness,
  scientificScenario,
  validateScenario,
} from "./scenarios.js";

export const REPLAY_ENGINE = "recon-replay-1.0.0" as const;
type Kind = z.infer<typeof AnalysisRecord>["kind"];
const object = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const omit = (value: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(Object.entries(value).filter(([k]) => !keys.includes(k)));

/** Immutable transitive closure, including superseded case revisions and their referenced evidence. */
export function scopeCorpus(d: CorpusData, request: unknown): CorpusData {
  const r = object(request),
    ctx = object(r.context),
    left = object(r.left),
    right = object(r.right);
  const cases = d.cases.filter(
    (c) =>
      (c.id === r.caseId && c.revision <= Number(ctx.caseRevision)) ||
      c.materialVersionId === left.materialVersionId ||
      c.materialVersionId === right.materialVersionId,
  );
  const unitIds = new Set([
    ...(Array.isArray(r.evidenceUnitIds)
      ? (r.evidenceUnitIds as string[])
      : []),
    ...cases.flatMap((c) => c.evidenceUnitIds),
  ]);
  const evidenceUnits = d.evidenceUnits.filter((u) => unitIds.has(u.id));
  const materials = d.materials.filter(
    (m) =>
      cases.some((c) => c.materialVersionId === m.id) ||
      evidenceUnits.some((u) => u.testedMaterialVersionId === m.id) ||
      m.id === left.materialVersionId ||
      m.id === right.materialVersionId,
  );
  const candidates = d.candidates.filter((c) =>
    materials.some((m) =>
      m.componentSlots.some((s) => s.candidateIds.includes(c.id)),
    ),
  );
  const taxa = d.taxa.filter((t) =>
    candidates.some((c) => c.taxonConceptId === t.id),
  );
  const studies = d.studies.filter((s) =>
    evidenceUnits.some((u) => u.studyId === s.id),
  );
  const assertionIds = new Set([
    ...cases.flatMap((c) => [
      ...c.assertionIds,
      ...c.historicalUseAssertionIds,
    ]),
    ...materials.flatMap((m) => m.assertionIds),
    ...candidates.flatMap((c) => c.supportAssertionIds),
    ...evidenceUnits.flatMap((u) => [
      ...u.contextAssertionIds,
      u.comparatorAssertionId,
      u.endpointAssertionId,
      u.outcomeAssertionId,
    ]),
  ]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const a of d.assertions.filter((a) => assertionIds.has(a.id)))
      for (const id of [
        ...a.inputAssertionIds,
        ...(a.state === "contested" ? a.competingAssertionIds : []),
      ])
        if (!assertionIds.has(id)) {
          assertionIds.add(id);
          changed = true;
        }
  }
  const assertions = d.assertions.filter((a) => assertionIds.has(a.id));
  const spans = d.spans.filter(
    (s) =>
      assertions.some((a) =>
        a.references.some((r) => r.kind === "span" && r.spanId === s.id),
      ) || evidenceUnits.some((u) => u.supportSpanIds.includes(s.id)),
  );
  const revisionIds = new Set([
    ...cases.flatMap((c) => c.sourceRevisionIds),
    ...studies.flatMap((s) => s.sourceRevisionIds),
    ...taxa.flatMap((t) => [
      t.sourceRevisionId,
      ...(t.supportingSourceRevisionIds ?? []),
    ]),
    ...spans.map((s) => s.sourceRevisionId),
    ...assertions.flatMap((a) =>
      a.references.flatMap((r) =>
        r.kind === "metadata" ? [r.sourceRevisionId] : [],
      ),
    ),
  ]);
  const sourceRevisions = d.sourceRevisions.filter((s) =>
    revisionIds.has(s.id),
  );
  const sources = d.sources.filter((s) =>
    sourceRevisions.some((r) => r.sourceId === s.id),
  );
  return validateCorpus({
    ...d,
    cases,
    materials,
    candidates,
    taxa,
    studies,
    evidenceUnits,
    assertions,
    spans,
    sourceRevisions,
    sources,
    bibliography: d.bibliography.filter((b) =>
      revisionIds.has(b.sourceRevisionId),
    ),
    interpretationGroups: [],
  });
}

export function scientificResult(kind: Kind, value: unknown): unknown {
  const v = object(value),
    keys =
      kind === "scenario"
        ? ["kind", "results", "correspondence"]
        : kind === "diff"
          ? [
              "diff",
              "kind",
              "changedCorrespondenceUnitIds",
              "beforeCorrespondence",
              "afterCorrespondence",
              "dependencyEdges",
            ]
          : kind === "robustness"
            ? ["audit", "clarification", "correspondence", "studyCoverage"]
            : ["scope", "policyHash", "verdict", "dimensions"];
  return Object.fromEntries(keys.map((k) => [k, v[k]]));
}
export function decisionPayload(scientific: DossierData["scientific"]) {
  const d = scientific.corpus,
    r = object(scientific.request),
    request = {
      ...omit(r, ["context", "interpretationDomain"]),
      context: omit(object(r.context), ["caseHash"]),
    };
  for (const key of ["scenario", "before", "after"])
    if (r[key])
      request[key as keyof typeof request] = scientificScenario(
        BoundedScenario.parse(r[key]),
      ) as never;
  if (Array.isArray(r.constraints))
    (request as Record<string, unknown>).constraints = r.constraints.map((v) =>
      omit(object(v), ["rationale"]),
    );
  delete (request as Record<string, unknown>).subsetRationale;
  return {
    engine: REPLAY_ENGINE,
    policy: scientific.policy,
    request,
    nameFacts: scientific.nameFacts,
    corpus: {
      revision: d.revision,
      cases: d.cases.map((c) => ({
        id: c.id,
        revision: c.revision,
        materialVersionId: c.materialVersionId,
        historicalUseAssertionIds: c.historicalUseAssertionIds,
      })),
      materials: d.materials.map((m) =>
        omit(m, ["label", "recordHash", "fingerprint", "fingerprintPayload"]),
      ),
      assertions: d.assertions.map((a) => ({
        ...omit(a, ["label", "rationale", "review"]),
        review: {
          status: a.review.status,
          reviewerType: a.review.reviewerType ?? "undeclared",
        },
      })),
      candidates: d.candidates.map((c) => omit(c, ["rationale"])),
      taxa: d.taxa,
      evidenceUnits: d.evidenceUnits.map((u) =>
        omit(u, ["armLabel", "review"]),
      ),
      sourceHashes: d.sourceRevisions.map((s) => ({
        id: s.id,
        textSha256: s.textSha256,
      })),
    },
  };
}

export function computeDossier(
  kind: Kind,
  d: CorpusData,
  request: unknown,
  nameFacts: Record<string, string | null>,
): unknown {
  const r = object(request);
  if (kind === "material_only") {
    const input = MaterialVersionComparisonRequest.parse(request);
    if (input.policyHash !== POLICY_HASH) throw Error("UNSUPPORTED_POLICY");
    const left = d.materials.find((m) => m.id === input.left.materialVersionId),
      right = d.materials.find((m) => m.id === input.right.materialVersionId);
    if (!left || !right) throw Error("MISSING_MATERIAL");
    for (const side of [input.left, input.right]) {
      const c = d.cases.find(
        (c) =>
          c.materialVersionId === side.materialVersionId &&
          c.id === side.caseId &&
          c.revision === side.caseRevision,
      );
      if (c)
        validateScenario(d, c, {
          assignments: side.assignments,
          hypotheticalOverrides: [],
          rationale: "Pinned side assumptions.",
        });
      else if (
        side.assignments.length ||
        d.cases.some((c) => c.materialVersionId === side.materialVersionId)
      )
        throw Error("INVALID_MATERIAL_SIDE");
    }
    const dimensions = compareMaterials(
      d,
      left,
      right,
      input.left.assignments,
      input.right.assignments,
    );
    return {
      scope: "material_only",
      policyHash: POLICY_HASH,
      verdict: aggregateFindings(dimensions),
      dimensions,
    };
  }
  const id = r.caseId;
  const ctx = object(r.context);
  const c = d.cases.find((c) => c.id === id && c.revision === ctx.caseRevision);
  if (!c || c.contentHash !== ctx.caseHash || ctx.policyHash !== POLICY_HASH)
    throw Error("CASE_OR_POLICY_PIN_MISMATCH");
  const ids = r.evidenceUnitIds as string[];
  if (
    !Array.isArray(ids) ||
    !ids.length ||
    ids.length > 50 ||
    new Set(ids).size !== ids.length
  )
    throw Error("INVALID_EVIDENCE_SELECTION");
  const units = ids.map((id) => {
    const u = d.evidenceUnits.find((u) => u.id === id);
    if (!u) throw Error("MISSING_EVIDENCE");
    return u;
  });
  const body = omit(r, ["caseId", "interpretationDomain"]);
  if (kind === "scenario") {
    const q = ScenarioEvaluateRequest.parse(body);
    return evaluateScenario(d, c, units, q.scenario, undefined, nameFacts);
  }
  if (kind === "diff") {
    const q = ScenarioDiffRequest.parse(body);
    return diffScenarios(d, c, units, q.before, q.after, nameFacts);
  }
  const q = AuditRequest.parse(body);
  const groups = buildGroups(d, c);
  return runRobustness(
    d,
    c,
    units,
    {
      context: q.context,
      groups,
      excludedCandidateIds: [],
      limitation: "Pinned replay domain.",
    },
    q,
    nameFacts,
  );
}

export function buildDossier(
  record: z.infer<typeof AnalysisRecord>,
  fallback?: CorpusData,
): DossierData {
  if (contentHash(record) !== record.contentHash)
    throw Error("ANALYSIS_HASH_MISMATCH");
  const inputs = object(record.inputs),
    request = inputs.request;
  if (scientificHash(inputs.policy) !== POLICY_HASH)
    throw Error("UNSUPPORTED_POLICY");
  const original = inputs.replayCorpus
    ? validateCorpus(inputs.replayCorpus)
    : fallback
      ? scopeCorpus(fallback, request)
      : null;
  if (!original) throw Error("LEGACY_SNAPSHOT_REQUIRES_PINNED_CORPUS");
  const nameFacts = deriveNameFacts(original),
    computed = scientificResult(
      record.kind,
      computeDossier(record.kind, original, request, nameFacts),
    );
  if (
    scientificHash(computed) !==
    scientificHash(scientificResult(record.kind, record.payload))
  )
    throw Error("SAVED_RESULT_REPLAY_MISMATCH");
  const corpus = structuredClone(original);
  const sources = corpus.sourceRevisions.map((r) => {
    const allowed =
      r.rights.decision === "bundle_allowed" &&
      r.rights.redistribution &&
      r.rights.display &&
      r.rights.storage;
    if (!allowed) {
      r.displayText = "";
      for (const s of corpus.spans.filter((s) => s.sourceRevisionId === r.id)) {
        s.exact = "[source text omitted]";
        s.prefix = "";
        s.suffix = "";
      }
    }
    return {
      id: r.id,
      textIncluded: allowed,
      reason: allowed
        ? "Explicit artifact permission permits redistribution."
        : "Original text and exact quote selectors omitted: redistribution is not authorized. Structured decision facts remain available for replay.",
      originalTextHash: r.textSha256,
      originalRevisionHash: r.contentHash,
      independentTextVerification: allowed,
    };
  });
  const scientific = {
    corpus,
    policy: MATERIAL_POLICY,
    request: request as DossierData["scientific"]["request"],
    nameFacts,
    result: computed as DossierData["scientific"]["result"],
  };
  const body = {
    schemaVersion: "recon-dossier-v1" as const,
    engineVersion: REPLAY_ENGINE,
    exportedAt: new Date().toISOString(),
    title: record.name,
    kind: record.kind,
    originalAnalysisId: record.id,
    originalAnalysisContentHash: record.contentHash,
    scientific,
    sources,
    limitations: [
      "Research use. Material correspondence does not establish historical identity, chemical equivalence or clinical effectiveness.",
      "Draft and inferred assertions remain labeled. No independent human review is implied.",
      "Decision replay validates included facts and pinned rules. Omitted protected originals cannot be independently text-hash verified from this bundle.",
    ],
    scientificPayloadHash: scientificHash(decisionPayload(scientific)),
    scientificResultHash: scientificHash(computed),
  };
  return DossierBundleV1.parse({ ...body, bundleHash: scientificHash(body) });
}
export function validateDossier(input: unknown): DossierData {
  const b = DossierBundleV1.parse(input),
    { bundleHash, ...body } = b;
  const d = b.scientific.corpus;
  if (
    d.assertions.length > 4096 ||
    d.materials.length > 256 ||
    d.sourceRevisions.length > 128 ||
    d.spans.length > 4096 ||
    d.candidates.length > 2000 ||
    d.cases.length > 200 ||
    d.evidenceUnits.length > 200
  )
    throw Error("BUNDLE_ENTITY_LIMIT");
  for (const r of d.sourceRevisions)
    for (const path of [r.rawFile, r.rights.evidenceFile])
      if (/(^[a-z]:|^[/\\]|(?:^|[/\\])\.\.(?:[/\\]|$))/i.test(path))
        throw Error("UNSAFE_METADATA_PATH");
  if (scientificHash(body) !== bundleHash) throw Error("BUNDLE_HASH_MISMATCH");
  if (scientificHash(b.scientific.policy) !== POLICY_HASH)
    throw Error("UNSUPPORTED_POLICY");
  if (
    b.sources.length !== b.scientific.corpus.sourceRevisions.length ||
    new Set(b.sources.map((s) => s.id)).size !== b.sources.length
  )
    throw Error("SOURCE_MANIFEST_MISMATCH");
  for (const r of b.scientific.corpus.sourceRevisions) {
    const item = b.sources.find((s) => s.id === r.id);
    if (
      !item ||
      item.originalTextHash !== r.textSha256 ||
      item.originalRevisionHash !== r.contentHash ||
      item.independentTextVerification !== item.textIncluded
    )
      throw Error("SOURCE_MANIFEST_MISMATCH");
    if (
      item.textIncluded &&
      !(
        r.rights.decision === "bundle_allowed" &&
        r.rights.redistribution &&
        r.rights.display &&
        r.rights.storage
      )
    )
      throw Error("SOURCE_RIGHTS_VIOLATION");
    if (
      !item.textIncluded &&
      (r.displayText !== "" ||
        b.scientific.corpus.spans.some(
          (s) =>
            s.sourceRevisionId === r.id &&
            (s.exact !== "[source text omitted]" || s.prefix || s.suffix),
        ))
    )
      throw Error("OMITTED_TEXT_PRESENT");
  }
  validateCorpus(b.scientific.corpus, {
    omittedSourceRevisionIds: b.sources
      .filter((s) => !s.textIncluded)
      .map((s) => s.id),
  });
  for (const m of b.scientific.corpus.materials)
    if (materialRecordHash(m) !== m.recordHash)
      throw Error("MATERIAL_HASH_MISMATCH");
  if (
    scientificHash(decisionPayload(b.scientific)) !== b.scientificPayloadHash ||
    scientificHash(b.scientific.result) !== b.scientificResultHash
  )
    throw Error("SCIENTIFIC_HASH_MISMATCH");
  // Included originals independently corroborate the derived name links. Omitted originals do not.
  const derived = deriveNameFacts(b.scientific.corpus);
  for (const c of b.scientific.corpus.candidates) {
    if (!(c.id in b.scientific.nameFacts)) throw Error("MISSING_NAME_FACT");
    const refs = b.scientific.corpus.assertions
      .filter((a) => c.supportAssertionIds.includes(a.id))
      .flatMap((a) => a.references);
    if (
      refs.every(
        (r) =>
          r.kind === "metadata" ||
          b.sources.find(
            (s) =>
              s.id ===
              b.scientific.corpus.spans.find((s) => s.id === r.spanId)
                ?.sourceRevisionId,
          )?.textIncluded,
      ) &&
      derived[c.id] !== b.scientific.nameFacts[c.id]
    )
      throw Error("NAME_FACT_MISMATCH");
  }
  return b;
}
export function replayDossier(input: unknown) {
  const b = validateDossier(input),
    actual = scientificResult(
      b.kind,
      computeDossier(
        b.kind,
        b.scientific.corpus,
        b.scientific.request,
        b.scientific.nameFacts,
      ),
    );
  if (scientificHash(actual) !== b.scientificResultHash)
    throw Error("SCIENTIFIC_REPLAY_MISMATCH");
  return ReplayReceipt.parse({
    status: "reproduced",
    scientificPayloadHash: b.scientificPayloadHash,
    scientificResultHash: b.scientificResultHash,
    engineVersion: REPLAY_ENGINE,
    sourceTextsVerified: b.sources.filter((s) => s.textIncluded).length,
    sourceTextsOmitted: b.sources.filter((s) => !s.textIncluded).length,
    warning:
      "Integrity and decision replay are verified; authorship, scientific truth and inaccessible source originals are not authenticated.",
  });
}
export const escapeHtml = (v: unknown) =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
function readableResults(b: DossierData): string {
  const value = object(b.scientific.result),
    e = escapeHtml;
  const label = (id: unknown) =>
    b.scientific.corpus.evidenceUnits.find((u) => u.id === id)?.armLabel ??
    String(id ?? "Material comparison");
  const findings = (v: unknown) =>
    Array.isArray(v)
      ? `<table><thead><tr><th>Dimension</th><th>Finding</th><th>Reason</th></tr></thead><tbody>${v
          .map((x) => {
            const f = object(x);
            return `<tr><td>${e(String(f.dimension).replaceAll("_", " "))}</td><td>${e(f.state)}</td><td>${e(Array.isArray(f.reasonCodes) ? f.reasonCodes.join(", ").replaceAll("_", " ") : "")}</td></tr>`;
          })
          .join("")}</tbody></table>`
      : "";
  if (Array.isArray(value.results))
    return value.results
      .map((x) => {
        const r = object(x),
          m = object(r.materialComparison),
          ctx = object(r.contextComparison);
        return `<article><h3>${e(label(r.evidenceUnitId))}</h3><p><strong>${e(String(m.verdict).replaceAll("_", " "))}</strong></p><p>Context: ${e(String(ctx.verdict).replaceAll("_", " "))}. The recorded assay outcome is preserved separately; this is not an effectiveness claim.</p>${findings(m.dimensions)}</article>`;
      })
      .join("");
  const audit = object(value.audit);
  if (Array.isArray(audit.units))
    return `<p>${e(audit.worldCount)} exact worlds. ${e(audit.domainLimitation)}</p>${audit.units
      .map((x) => {
        const u = object(x);
        return `<h3>${e(label(u.evidenceUnitId))}</h3><p>${e(String(u.status).replaceAll("_", " "))}; strictly comparable in ${e(u.comparableWorldCount)} of ${e(audit.worldCount)} worlds.</p>`;
      })
      .join(
        "",
      )}<h3>Study coverage and clarification</h3><pre>${e(JSON.stringify({ studyCoverage: value.studyCoverage, clarification: value.clarification }, null, 2))}</pre>`;
  if (value.verdict)
    return `<p><strong>${e(String(value.verdict).replaceAll("_", " "))}</strong>. Material-only scope.</p>${findings(value.dimensions)}`;
  const diff = object(value.diff);
  return `<p>${Array.isArray(diff.changed) ? diff.changed.length : 0} changed, ${Array.isArray(diff.recomputedUnchangedIds) ? diff.recomputedUnchangedIds.length : 0} recomputed unchanged, ${Array.isArray(diff.unaffectedIds) ? diff.unaffectedIds.length : 0} unaffected comparisons. Conditional correspondence and dependency details are retained below.</p>`;
}
export function dossierHtml(b: DossierData): string {
  const e = escapeHtml,
    d = b.scientific.corpus;
  const claims = d.assertions
    .map(
      (a) =>
        `<tr><td>${e(a.label)}<small>${e(a.id)}</small></td><td>${e(a.state)} / ${e(a.review.status)}${a.origin === "user_hypothesis" ? " / hypothetical" : ""}</td><td>${e(a.state === "recorded" || a.state === "inferred" ? JSON.stringify(a.value) : a.state === "unknown" ? a.reason : a.state)}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${e(b.title)} — RECON dossier</title><style>body{font:16px/1.65 system-ui,sans-serif;color:#233b31;background:#fafbf8;margin:auto;max-width:1050px;padding:32px}h1{font-size:2.4rem;line-height:1.2}h2{margin-top:2.5rem}small{display:block;color:#53665b}section,details{border:1px solid #cad7cb;border-radius:12px;padding:22px;margin:20px 0;background:white}table{width:100%;border-collapse:collapse;font-size:13px}td,th{text-align:left;border-bottom:1px solid #cad7cb;padding:12px;vertical-align:top;overflow-wrap:anywhere}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}.hash{overflow-wrap:anywhere;font-size:12px}.notice{border-left:4px solid #986c23;padding:16px;background:#fff7df}blockquote{margin:16px 0;padding-left:16px;border-left:2px solid #9bada0;white-space:pre-wrap}summary{cursor:pointer}a{color:#156655}@media(max-width:500px){body{padding:16px}section{padding:14px}table,tbody,tr,td{display:block}th{display:none}}@media print{body{max-width:none;background:white;padding:0}section{break-inside:avoid}details{display:block}pre{font-size:9px}}</style></head><body><main><p>ALETHEIA RECON / Frozen research dossier</p><h1>${e(b.title)}</h1><p class="notice">Decision replay, source integrity and scientific validity are different claims. Draft evidence remains draft.</p><p>Analysis kind: ${e(b.kind)}. Exported ${e(b.exportedAt)}.</p><p class="hash">Scientific result: ${e(b.scientificResultHash)}<br>Scientific inputs: ${e(b.scientificPayloadHash)}<br>Engine: ${e(b.engineVersion)} / policy ${e(b.scientific.policy.version)}</p><section><h2>Scope and limitations</h2><ul>${b.limitations.map((l) => `<li>${e(l)}</li>`).join("")}</ul></section><section><h2>Frozen assumptions and decisions</h2>${readableResults(b)}<details><summary>Exact frozen request</summary><pre>${e(JSON.stringify(b.scientific.request, null, 2))}</pre></details><details><summary>Complete scientific result payload</summary><pre>${e(JSON.stringify(b.scientific.result, null, 2))}</pre></details></section><section><h2>Recorded claims and unknowns</h2><table><thead><tr><th>Assertion</th><th>Status</th><th>Decision value</th></tr></thead><tbody>${claims}</tbody></table></section><section><h2>Sources, rights and exact passages</h2>${b.sources
    .map((item) => {
      const rev = d.sourceRevisions.find((r) => r.id === item.id)!,
        source = d.sources.find((s) => s.id === rev.sourceId)!;
      return `<article><h3>${e(source.title)}</h3><p>${e(source.creators.join("; "))}. ${e(source.edition)}. ${e(source.publicationDate)}.</p><p>${e(rev.rights.credit)} / ${e(rev.rights.license)}</p><p>${e(item.reason)}</p><p class="hash">Revision ${e(rev.id)} / original text ${e(item.originalTextHash)}</p><p><a href="${e(source.canonicalUrl)}" rel="noreferrer">Source reference</a></p>${
        item.textIncluded
          ? d.spans
              .filter((s) => s.sourceRevisionId === rev.id)
              .map(
                (s) =>
                  `<p>${e(s.locator.label)}</p><blockquote>${e(s.exact)}</blockquote>`,
              )
              .join("")
          : "<p>Original text unavailable in this export. Its hash is retained, not independently verified here.</p>"
      }</article>`;
    })
    .join(
      "",
    )}</section><section><h2>Bibliographic metadata</h2>${d.bibliography.map((r) => `<p>${e(r.creators.map((c) => c.name + " (" + c.role + ")").join("; "))}. ${e(r.title)}. ${e(r.issued)}. ${e(JSON.stringify(r.identifiers))}</p>`).join("")}<p>Plain metadata; no citation-style compliance or independent bibliographic review is implied.</p></section></main></body></html>`;
}
