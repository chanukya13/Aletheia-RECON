import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type Database from "better-sqlite3";
import {
  ExtractionRun,
  SaveResponse,
  type ActorData,
  type AssertionData,
  type CorpusData,
  type ExtractionData,
  type ImportInput,
  type ProposalData,
  type RevisionInput,
  type SpanData,
} from "@recon/contracts";
import {
  buildMaterialFingerprint,
  contentHash,
  extractPreparation,
  makeSpan,
  materialRecordHash,
  parseJsonStrict,
  normalizedQuantity,
  scientificHash,
  sha256,
  validateCorpus,
  validateSpan,
} from "@recon/core";
import { readCorpus, ROOT, seed } from "./database.js";
import { canDisplay, getCase } from "./repository.js";
import { WorkspaceError } from "./errors.js";
import type { TaxonomyService } from "./taxonomy.js";

type Material = CorpusData["materials"][number];
const uid = (prefix: string) => `${prefix}-${randomUUID()}`;
const review = (
  actor: ActorData,
  now: string,
  checked = actor.mode === "source_checked",
) => ({
  status: checked ? ("accepted" as const) : ("pending" as const),
  reviewerType: "human" as const,
  reviewer: actor.name,
  qualification: actor.qualification,
  reviewedAt: now,
  rationale: checked
    ? "The local reviewer explicitly checked this source claim. This is an editorial judgment, not expert validation or biological truth."
    : "Researcher-authored draft; independent source review remains pending.",
});
function objectFile(folder: string, content: string) {
  const directory = resolve(ROOT, "data/local", folder);
  mkdirSync(directory, { recursive: true });
  const file = resolve(directory, `${sha256(content)}.txt`);
  if (existsSync(file)) {
    if (readFileSync(file, "utf8") !== content)
      throw new WorkspaceError(
        "OBJECT_CONFLICT",
        "The retained object does not match its digest.",
        409,
      );
  } else writeFileSync(file, content, { encoding: "utf8", flag: "wx" });
  return file.slice(ROOT.length + 1).replaceAll("\\", "/");
}
function valueFor(kind: string, value: unknown): ProposalData["value"] {
  if (
    ["ingredient", "operation", "part", "state", "contact", "matrix"].includes(
      kind,
    )
  ) {
    if (typeof value !== "string" || !value.trim() || value.length > 500)
      throw new WorkspaceError(
        "INVALID_VALUE",
        "Enter a bounded, non-empty source value.",
      );
    return value.trim();
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new WorkspaceError(
      "INVALID_QUANTITY",
      "Quantity, duration and temperature values require a structured value and unit.",
    );
  const item = value as Record<string, unknown>;
  if (item.relationship === "equal" && kind === "quantity") {
    if (!["mass", "volume", "count", "unknown"].includes(String(item.basis)))
      throw new WorkspaceError(
        "INVALID_BASIS",
        "Choose an explicit quantity basis or unknown.",
      );
    return {
      relationship: "equal",
      basis: String(item.basis),
      dimension: String(item.basis),
    };
  }
  if (
    typeof item.value !== "number" ||
    !Number.isFinite(item.value) ||
    Math.abs(item.value) > 1e9 ||
    (kind !== "temperature" && item.value < 0) ||
    typeof item.unit !== "string" ||
    !item.unit.trim() ||
    item.unit.length > 40
  )
    throw new WorkspaceError(
      "INVALID_QUANTITY",
      "Use a finite, bounded value and unit; absent quantities must stay unknown.",
    );
  if (
    kind === "duration" &&
    !["second", "minute", "hour", "day"].includes(item.unit)
  )
    throw new WorkspaceError(
      "INVALID_TIME_UNIT",
      "Use second, minute, hour or day; unsupported historical units must remain unnormalized.",
    );
  if (kind === "temperature" && (item.unit !== "°C" || item.value < -273.15))
    throw new WorkspaceError(
      "INVALID_TEMPERATURE",
      "The current editor supports recorded Celsius temperatures only.",
    );
  const basis = ["mass", "volume", "count"].includes(String(item.basis))
    ? String(item.basis)
    : "unknown";
  const normalized = normalizedQuantity(item.value, item.unit);
  if (
    kind === "quantity" &&
    basis !== "unknown" &&
    normalized.normalized &&
    normalized.dimension !== basis
  )
    throw new WorkspaceError(
      "INCOMPATIBLE_QUANTITY_BASIS",
      "The declared quantity basis is incompatible with its metric unit.",
    );
  return {
    value: item.value,
    unit: item.unit.trim(),
    basis,
    dimension:
      kind === "duration"
        ? "time"
        : kind === "temperature"
          ? "temperature"
          : basis,
  };
}
export class CurationService {
  constructor(
    private db: Database.Database,
    private taxonomy: TaxonomyService,
  ) {}
  private idempotent<T>(
    operation: string,
    request: { requestId: string },
    action: () => T,
  ): T {
    return this.db
      .transaction(() => {
        const inputHash = scientificHash(request);
        const prior = this.db
          .prepare(
            "SELECT operation,input_hash,response FROM idempotency_keys WHERE id=?",
          )
          .get(request.requestId) as
          | { operation: string; input_hash: string; response: string }
          | undefined;
        if (prior) {
          if (prior.operation !== operation || prior.input_hash !== inputHash)
            throw new WorkspaceError(
              "IDEMPOTENCY_CONFLICT",
              "This request ID was already used for different input.",
              409,
            );
          return parseJsonStrict(prior.response, 20_000_000) as T;
        }
        const result = action();
        this.db
          .prepare("INSERT INTO idempotency_keys VALUES(?,?,?,?)")
          .run(request.requestId, operation, inputHash, JSON.stringify(result));
        return result;
      })
      .immediate();
  }
  private snapshot(base: CorpusData) {
    const next = structuredClone(base);
    next.corpusHistory = [
      ...(base.corpusHistory ?? []),
      { id: base.revision, hash: scientificHash(base) },
    ];
    next.revision = uid("workspace");
    return next;
  }
  private ensureSize(data: CorpusData) {
    if (Buffer.byteLength(JSON.stringify(data)) > 18_000_000)
      throw new WorkspaceError(
        "WORKSPACE_LIMIT",
        "This local workspace has reached its bounded corpus size.",
        413,
      );
  }
  private latest(data: CorpusData, caseId: string, expected?: number) {
    const c = data.cases
      .filter((c) => c.id === caseId)
      .sort((a, b) => b.revision - a.revision)[0];
    if (!c)
      throw new WorkspaceError(
        "NOT_FOUND",
        "The case could not be found.",
        404,
      );
    if (expected !== undefined && c.revision !== expected)
      throw new WorkspaceError(
        "STALE_REVISION",
        `This case is now at revision ${c.revision}. Your unsaved draft is preserved; inspect the latest revision before retrying.`,
        409,
      );
    if (c.revision >= 200)
      throw new WorkspaceError(
        "REVISION_LIMIT",
        "This case has reached the local revision limit.",
        413,
      );
    return c;
  }
  private audit(type: string, subject: string, detail: unknown): number {
    return Number(
      this.db
        .prepare(
          "INSERT INTO audit_events(event_type,subject_id,payload) VALUES(?,?,?)",
        )
        .run(type, subject, JSON.stringify(detail)).lastInsertRowid,
    );
  }
  importText(input: ImportInput, origin: string) {
    return this.idempotent("import_text", input, () => {
      if (!input.text.trim() || !input.text.isWellFormed())
        throw new WorkspaceError(
          "INVALID_SOURCE_TEXT",
          "Source text must be non-empty, well-formed Unicode.",
        );
      const base = readCorpus(this.db);
      if (new Set(base.cases.map((c) => c.id)).size >= 100)
        throw new WorkspaceError(
          "CASE_LIMIT",
          "This workspace is limited to 100 cases.",
          413,
        );
      const data = this.snapshot(base),
        now = new Date().toISOString(),
        id = uid("case"),
        sourceId = uid("user-source"),
        sourceRevisionId = `${sourceId}.r1`;
      const url = input.sourceUrl ?? `${origin}/cases/${id}/source`;
      data.sources.push({
        id: sourceId,
        kind: "user_text",
        title: input.title,
        creators: [input.creator],
        work: input.title,
        edition: input.edition,
        translator: null,
        language: input.language,
        publicationDate:
          "Researcher-supplied passage; publication date not specified",
        compositionDate: "Not established by this import",
        identifiers: { localImport: id },
        canonicalUrl: url,
      });
      const rightsEvidence = JSON.stringify({
        declaration: input.rightsDeclaration,
        rationale: input.rightsRationale,
        actor: input.actor.name,
        qualification: input.actor.qualification,
        recordedAt: now,
      });
      const rightsFile = objectFile("rights", rightsEvidence);
      const r = {
        id: sourceRevisionId,
        sourceId,
        revision: 1,
        retrievedAt: now,
        rawFile: objectFile("objects", input.text),
        rawUrl: `${origin}/api/v1/sources/${sourceId}/revisions/1`,
        rawSha256: sha256(input.text),
        displayText: input.text,
        textSha256: sha256(input.text),
        parser: "recon-user-text-v1",
        editorialNote:
          "Exact researcher-provided Unicode text retained, including whitespace and line breaks. No automatic translation or Unicode normalization was applied.",
        locator: {
          label: "Researcher-provided passage · exact character positions",
        },
        rights: {
          decision: "pending" as const,
          license: `User declared: ${input.rightsDeclaration}`,
          licenseUrl:
            input.rightsDeclaration === "CC0-1.0"
              ? "https://creativecommons.org/publicdomain/zero/1.0/"
              : input.rightsDeclaration === "CC-BY-4.0"
                ? "https://creativecommons.org/licenses/by/4.0/"
                : "https://rightsstatements.org/vocab/CNE/1.0/",
          credit: input.creator,
          storage: true,
          display: true,
          redistribution: false,
          restrictions:
            "Private local research display only. User declaration has not been independently verified; source text must be withheld from public redistribution.",
          verificationUrl: url,
          verifiedAt: now,
          evidenceFile: rightsFile,
          evidenceSha256: sha256(rightsEvidence),
        },
      };
      data.sourceRevisions.push({ ...r, contentHash: contentHash(r) });
      const description: AssertionData = {
        id: uid("assertion"),
        field: "material.composition",
        label: "Imported preparation · not yet reviewed",
        origin: "human_curated",
        references: [
          { kind: "metadata", sourceRevisionId, field: "displayText" },
        ],
        inputAssertionIds: [],
        review: review(input.actor, now, false),
        state: "unknown",
        reason: "not_reviewed",
        rationale:
          "Inspect the source and review individual ingredient, process and quantity claims before treating them as facts.",
      };
      data.assertions.push(description);
      const materialPayload = {
        id: uid("material"),
        kind: "mixture" as const,
        representation: "historical_record" as const,
        label: input.title,
        componentSlots: [],
        quantities: [],
        steps: [],
        assertionIds: [description.id],
      };
      const material: Material = {
        ...materialPayload,
        recordHash: materialRecordHash(materialPayload),
        fingerprint: null,
        fingerprintPayload: null,
        canonicalization: "JCS-RFC8785/recon-science-v1",
      };
      data.materials.push(material);
      const c = {
        id,
        revision: 1,
        title: input.title,
        subtitle:
          "Researcher-provided passage · local rights declaration pending verification",
        kind: input.kind,
        authenticity: "user_import" as const,
        period: "Researcher-provided; historical date not established",
        sourceRevisionIds: [sourceRevisionId],
        primarySourceRevisionId: sourceRevisionId,
        originalSourceRevisionId: null,
        materialVersionId: material.id,
        assertionIds: [description.id],
        historicalUseAssertionIds: [],
        evidenceUnitIds: [],
        baselineScenarioInput: {
          assignments: [],
          hypotheticalOverrides: [],
          rationale:
            "No ingredient identification or composition is assumed by importing a passage.",
        },
        review: review(input.actor, now, false),
        corpusRevision: data.revision,
        supersedes: null,
      };
      data.cases.push({ ...c, contentHash: contentHash(c) });
      this.ensureSize(data);
      seed(this.db, data);
      const auditEventId = this.audit("text_imported", id, {
        actor: input.actor,
        createdAt: now,
        rationale: input.rightsRationale,
        sourceRevisionId,
        rights: "local_only_pending_verification",
      });
      return SaveResponse.parse({
        schemaVersion: "recon-v1",
        result: getCase(data, id),
        auditEventId,
        scientificStatus: "draft_unless_individually_source_checked",
      });
    });
  }
  extract(
    caseId: string,
    input: {
      requestId: string;
      actor: ActorData;
      expectedRevision: number;
      sourceRevisionId: string;
      extractorVersion: string;
    },
  ): ExtractionData {
    return this.idempotent(`extract:${caseId}`, input, () => {
      const data = readCorpus(this.db),
        c = this.latest(data, caseId, input.expectedRevision);
      const source = data.sourceRevisions.find(
        (r) => r.id === input.sourceRevisionId,
      );
      if (
        !source ||
        !c.sourceRevisionIds.includes(source.id) ||
        !canDisplay(source)
      )
        throw new WorkspaceError(
          "SOURCE_UNAVAILABLE",
          "This source is not available for this case.",
        );
      const metadata = data.sources.find((s) => s.id === source.sourceId)!;
      const result = extractPreparation(
        source,
        metadata.language,
        metadata.kind,
      );
      const run: ExtractionData = {
        schemaVersion: "recon-v1",
        id: uid("extraction"),
        caseId,
        caseRevision: c.revision,
        sourceRevisionId: source.id,
        sourceTextSha256: source.textSha256,
        ...result,
        coverage:
          result.proposals.length === 300
            ? result.coverage +
              " Proposal cap reached (300); inspect remaining text manually."
            : result.coverage,
        decisions: [],
        createdAt: new Date().toISOString(),
      };
      this.db
        .prepare("INSERT INTO extraction_runs VALUES(?,?,?,?)")
        .run(run.id, caseId, c.revision, JSON.stringify(run));
      this.audit("extraction_proposed", caseId, {
        actor: input.actor,
        runId: run.id,
        caseRevision: c.revision,
        createdAt: run.createdAt,
        proposals: run.proposals.length,
        status: run.status,
      });
      return ExtractionRun.parse(run);
    });
  }
  getRun(
    caseId: string,
    id?: string,
    revision?: number,
  ): ExtractionData | null {
    const row = id
      ? this.db
          .prepare(
            "SELECT payload FROM extraction_runs WHERE id=? AND case_id=?",
          )
          .get(id, caseId)
      : this.db
          .prepare(
            "SELECT payload FROM extraction_runs WHERE case_id=? ORDER BY rowid DESC LIMIT 1",
          )
          .get(caseId);
    if (!row) return null;
    let run = ExtractionRun.parse(
      parseJsonStrict((row as { payload: string }).payload),
    );
    if (revision !== undefined && run.caseRevision > revision) {
      const old = this.db
        .prepare(
          "SELECT payload FROM extraction_runs WHERE case_id=? AND case_revision<=? ORDER BY rowid DESC LIMIT 1",
        )
        .get(caseId, revision) as { payload: string } | undefined;
      if (!old || id) return null;
      run = ExtractionRun.parse(parseJsonStrict(old.payload));
    }
    const decisions = this.db
      .prepare(
        "SELECT payload FROM proposal_decisions WHERE run_id=? ORDER BY case_revision,rowid",
      )
      .all(run.id) as { payload: string }[];
    return {
      ...run,
      decisions: decisions
        .map(
          (d) =>
            parseJsonStrict(d.payload) as ExtractionData["decisions"][number],
        )
        .filter((d) => revision === undefined || d.caseRevision <= revision),
    };
  }
  save(caseId: string, input: RevisionInput) {
    return this.idempotent(`save_revision:${caseId}`, input, () => {
      if (
        input.actor.mode === "source_checked" &&
        (input.actor.name === "Local researcher" ||
          input.actor.qualification.startsWith("Draft exploration"))
      )
        throw new WorkspaceError(
          "REVIEWER_DETAILS_REQUIRED",
          "Enter your declared reviewer name and qualification before marking individual claims source-checked.",
        );
      const base = readCorpus(this.db),
        old = this.latest(base, caseId, input.expectedRevision),
        data = this.snapshot(base),
        now = new Date().toISOString();
      const c = structuredClone(old);
      c.revision++;
      c.supersedes = `${old.id}.r${old.revision}`;
      c.corpusRevision = data.revision;
      c.review = review(input.actor, now, false);
      const m = structuredClone(
        base.materials.find((m) => m.id === old.materialVersionId)!,
      );
      m.id = uid("material");
      m.fingerprint = null;
      m.fingerprintPayload = null;
      c.materialVersionId = m.id;
      const run = input.runId ? this.getRun(caseId, input.runId) : null;
      if (input.decisions.length && (!run || run.caseRevision !== old.revision))
        throw new WorkspaceError(
          "STALE_EXTRACTION",
          "Run extraction against the current case revision before reviewing these proposals.",
          409,
        );
      const changed: string[] = [];
      const addSource = (id: string) => {
        if (!c.sourceRevisionIds.includes(id)) c.sourceRevisionIds.push(id);
      };
      const sourceFor = (id: string) => {
        const source = data.sourceRevisions.find((r) => r.id === id);
        if (!source || !c.sourceRevisionIds.includes(id) || !canDisplay(source))
          throw new WorkspaceError(
            "SOURCE_UNAVAILABLE",
            "The supporting source is not available in this case.",
          );
        return source;
      };
      const support = (id: string) => {
        const s = data.spans.find((s) => s.id === id);
        if (!s)
          throw new WorkspaceError(
            "SPAN_NOT_FOUND",
            "The supporting source span was not found.",
          );
        sourceFor(s.sourceRevisionId);
        return s;
      };
      const addSpan = (s: SpanData) => {
        validateSpan(s, sourceFor(s.sourceRevisionId));
        if (!data.spans.some((a) => a.id === s.id)) data.spans.push(s);
        return s.id;
      };
      const claim = (
        field: string,
        label: string,
        value: ProposalData["value"],
        spans: string[],
        rationale: string,
        inferred = false,
        origin: AssertionData["origin"] = "human_curated",
      ): string => {
        spans.forEach(support);
        const a: AssertionData = {
          id: uid("assertion"),
          field,
          label,
          origin,
          references: spans.map((spanId) => ({ kind: "span", spanId })),
          inputAssertionIds: [],
          review: review(input.actor, now),
          state: inferred ? "inferred" : "recorded",
          value,
          rationale,
        };
        data.assertions.push(a);
        m.assertionIds.push(a.id);
        c.assertionIds.push(a.id);
        changed.push(a.id);
        return a.id;
      };
      const unknown = (
        field: string,
        label: string,
        sourceId: string,
        reason: "not_reported" | "not_reviewed" | "unreadable" | "ambiguous",
        rationale: string,
      ): string => {
        const a: AssertionData = {
          id: uid("assertion"),
          field,
          label,
          origin: "human_curated",
          references: [
            {
              kind: "metadata",
              sourceRevisionId: sourceId,
              field: "displayText",
            },
          ],
          inputAssertionIds: [],
          review: review(input.actor, now),
          state: "unknown",
          reason,
          rationale,
        };
        data.assertions.push(a);
        m.assertionIds.push(a.id);
        c.assertionIds.push(a.id);
        changed.push(a.id);
        return a.id;
      };
      const replace = (oldId: string, id: string) => {
        m.assertionIds = [
          ...new Set(m.assertionIds.filter((a) => a !== oldId).concat(id)),
        ];
        c.assertionIds = [
          ...new Set(c.assertionIds.filter((a) => a !== oldId).concat(id)),
        ];
      };
      const proposalSlots = new Map<string, string>(),
        proposalSteps = new Map<string, string>(),
        touchedSlots = new Set<string>();
      const addIngredient = (
        value: string,
        span: SpanData,
        rationale: string,
        inferred: boolean,
        proposalId?: string,
      ) => {
        const existing = m.componentSlots.find((s) => {
          const term = data.assertions.find((a) => a.id === s.termAssertionId);
          return (
            !touchedSlots.has(s.id) &&
            term &&
            (term.state === "recorded" || term.state === "inferred") &&
            typeof term.value === "string" &&
            term.value.toLowerCase() === value.toLowerCase() &&
            term.references.some(
              (r) =>
                r.kind === "span" &&
                data.spans.some(
                  (x) =>
                    x.id === r.spanId &&
                    x.sourceRevisionId === span.sourceRevisionId &&
                    x.start <= span.start &&
                    x.end >= span.end,
                ),
            )
          );
        });
        const id = claim(
          "ingredient.term",
          `Ingredient term · ${value}`,
          value,
          [span.id],
          rationale,
          inferred,
          proposalId ? "extractor_proposal" : "human_curated",
        );
        const slotId =
          existing?.id ??
          `occ-${scientificHash({ source: span.sourceRevisionId, start: span.start, end: span.end }).slice(0, 24)}`;
        if (existing) {
          replace(existing.termAssertionId, id);
          existing.termAssertionId = id;
        } else
          m.componentSlots.push({
            id: slotId,
            termAssertionId: id,
            language: data.sources.find(
              (s) => s.id === sourceFor(span.sourceRevisionId).sourceId,
            )!.language,
            kind: /^(wine|water|honey|vinegar|oil|salt|.*gall|.*bile.*)$/i.test(
              value,
            )
              ? "other_natural_material"
              : "plant_material",
            candidateIds: [],
            partAssertionId: unknown(
              "ingredient.part",
              `${value}: part`,
              span.sourceRevisionId,
              "not_reported",
              "Part is not established by the ingredient mention alone.",
            ),
            stateAssertionId: unknown(
              "ingredient.state",
              `${value}: material state`,
              span.sourceRevisionId,
              "not_reported",
              "Fresh, dried or processed state is not established by the name alone.",
            ),
            quantityIds: [],
          });
        touchedSlots.add(slotId);
        if (proposalId) proposalSlots.set(proposalId, slotId);
        return slotId;
      };
      const decisions = new Map<string, RevisionInput["decisions"][number]>();
      for (const d of input.decisions) {
        if (decisions.has(d.proposalId))
          throw new WorkspaceError(
            "DUPLICATE_DECISION",
            "A proposal can receive only one decision in a save.",
          );
        decisions.set(d.proposalId, d);
        if (!run?.proposals.some((p) => p.id === d.proposalId))
          throw new WorkspaceError(
            "PROPOSAL_NOT_FOUND",
            "A selected proposal does not belong to this extraction run.",
          );
      }
      const accepted = (run?.proposals ?? []).filter(
        (p) => decisions.get(p.id)?.decision === "accept",
      );
      for (const p of accepted.filter((p) => p.kind === "ingredient")) {
        const d = decisions.get(p.id)!;
        const value = valueFor(p.kind, d.value ?? p.value);
        addSpan(p.span);
        if (p.polarity === "negated")
          claim(
            "ingredient.absence",
            `Documented exclusion · ${value}`,
            value,
            [p.span.id],
            d.rationale,
            false,
            "extractor_proposal",
          );
        else
          addIngredient(
            String(value),
            p.span,
            d.rationale,
            scientificHash(value) !== scientificHash(p.value),
            p.id,
          );
      }
      for (const p of accepted.filter((p) => p.kind === "operation")) {
        const d = decisions.get(p.id)!;
        const value = valueFor(p.kind, d.value ?? p.value);
        addSpan(p.span);
        const id = claim(
          p.polarity === "negated"
            ? "preparation.negated"
            : "preparation.operation",
          `Operation · ${value}`,
          value,
          [p.span.id],
          d.rationale,
          scientificHash(value) !== scientificHash(p.value),
          "extractor_proposal",
        );
        if (p.polarity === "negated") continue;
        const legacy =
          value === "mature"
            ? m.steps.find(
                (s) =>
                  data.assertions.find((a) => a.id === s.operationAssertionId)
                    ?.field === "preparation.duration",
              )
            : null;
        const existing = m.steps.find((s) =>
          data.assertions
            .find((a) => a.id === s.operationAssertionId)
            ?.references.some(
              (r) => r.kind === "span" && r.spanId === p.span.id,
            ),
        );
        const stepId = existing?.id ?? legacy?.id ?? `step-${p.id.slice(9)}`;
        const follows = p.relatedProposalIds
          .map((id) => proposalSteps.get(id))
          .filter((id): id is string => Boolean(id));
        if (legacy) {
          legacy.detailAssertionIds.push(legacy.operationAssertionId);
          legacy.operationAssertionId = id;
        } else if (existing) {
          replace(existing.operationAssertionId, id);
          existing.operationAssertionId = id;
        } else
          m.steps.push({
            id: stepId,
            operationAssertionId: id,
            inputSlotIds: [],
            followsStepIds: follows,
            detailAssertionIds: [],
          });
        proposalSteps.set(p.id, stepId);
      }
      for (const p of accepted.filter(
        (p) => !["ingredient", "operation"].includes(p.kind),
      )) {
        const d = decisions.get(p.id)!;
        const value = valueFor(p.kind, d.value ?? p.value);
        addSpan(p.span);
        const id = claim(
          p.field,
          p.label,
          value,
          [p.span.id],
          d.rationale,
          scientificHash(value) !== scientificHash(p.value),
          "extractor_proposal",
        );
        if (p.kind === "quantity") {
          const v = value as Record<string, unknown>;
          const equalSlots = p.relatedProposalIds
            .map((id) => proposalSlots.get(id))
            .filter((s): s is string => Boolean(s));
          const q = {
            id: uid("quantity"),
            assertionId: id,
            raw: p.span.exact,
            basis: (v.basis ?? "unknown") as
              | "mass"
              | "volume"
              | "count"
              | "unknown",
            dimension: String(v.dimension ?? "unknown"),
            ...(typeof v.value === "number" ? { value: v.value } : {}),
            ...(typeof v.unit === "string" ? { unit: v.unit } : {}),
            equalToSlotIds: v.relationship === "equal" ? equalSlots : [],
          };
          m.quantities = m.quantities.filter(
            (q) => q.id !== "quantity-historical-equality",
          );
          m.quantities.push(q);
          equalSlots.forEach((slot) =>
            m.componentSlots.find((s) => s.id === slot)!.quantityIds.push(q.id),
          );
        } else {
          const step = p.relatedProposalIds
            .map((id) => proposalSteps.get(id))
            .find(Boolean);
          if (step)
            m.steps.find((s) => s.id === step)!.detailAssertionIds.push(id);
        }
      }
      for (const annotation of input.manualAnnotations) {
        const source = sourceFor(annotation.sourceRevisionId);
        if (annotation.sourceTextSha256 !== source.textSha256)
          throw new WorkspaceError(
            "SOURCE_HASH_CONFLICT",
            "The selected source text has changed.",
            409,
          );
        let span: SpanData;
        try {
          span = makeSpan(
            source,
            uid("span"),
            annotation.start,
            annotation.end,
          );
        } catch {
          throw new WorkspaceError(
            "INVALID_SPAN",
            "The selection has invalid bounds or splits a Unicode character.",
          );
        }
        if (span.exact !== annotation.exact)
          throw new WorkspaceError(
            "INVALID_SPAN",
            "The selection does not match the immutable source text.",
          );
        addSpan(span);
        const value = valueFor(annotation.kind, annotation.value);
        let inferred =
          annotation.interpretation === "inferred" ||
          (typeof value === "string" &&
            value.toLowerCase() !== span.exact.trim().toLowerCase());
        if (typeof value === "object") {
          const language = data.sources.find(
            (s) => s.id === source.sourceId,
          )!.language;
          const literal = extractPreparation(
            source,
            language,
            "user_text",
          ).proposals.some(
            (p) =>
              p.kind === annotation.kind &&
              p.span.start >= span.start &&
              p.span.end <= span.end &&
              scientificHash(p.value) === scientificHash(value),
          );
          if (!literal) inferred = true;
        }
        if (annotation.kind === "ingredient")
          addIngredient(String(value), span, annotation.rationale, inferred);
        else if (annotation.kind === "operation") {
          const id = claim(
            "preparation.operation",
            `Manual operation · ${value}`,
            value,
            [span.id],
            annotation.rationale,
            inferred,
          );
          m.steps.push({
            id: uid("step"),
            operationAssertionId: id,
            inputSlotIds: [],
            followsStepIds: [],
            detailAssertionIds: [],
          });
        } else if (annotation.kind === "part" || annotation.kind === "state") {
          const slot = m.componentSlots.find(
            (s) => s.id === annotation.targetOccurrenceId,
          );
          if (!slot)
            throw new WorkspaceError(
              "TARGET_REQUIRED",
              "Choose the ingredient occurrence this annotation describes.",
            );
          const field =
            annotation.kind === "part" ? "partAssertionId" : "stateAssertionId";
          const id = claim(
            `ingredient.${annotation.kind}`,
            `${annotation.kind} · source annotation`,
            value,
            [span.id],
            annotation.rationale,
            inferred,
          );
          replace(slot[field], id);
          slot[field] = id;
        } else {
          const id = claim(
            annotation.kind === "quantity"
              ? "quantity.amount"
              : `preparation.${annotation.kind}`,
            `Manual ${annotation.kind}`,
            value,
            [span.id],
            annotation.rationale,
            inferred,
          );
          if (annotation.kind === "quantity") {
            const slot = m.componentSlots.find(
              (s) => s.id === annotation.targetOccurrenceId,
            );
            if (!slot)
              throw new WorkspaceError(
                "TARGET_REQUIRED",
                "Choose the ingredient for this quantity.",
              );
            const v = value as Record<string, unknown>;
            const q = {
              id: uid("quantity"),
              assertionId: id,
              raw: span.exact,
              basis: String(v.basis ?? "unknown") as
                | "mass"
                | "volume"
                | "count"
                | "unknown",
              dimension: String(v.dimension ?? "unknown"),
              ...(typeof v.value === "number" ? { value: v.value } : {}),
              ...(typeof v.unit === "string" ? { unit: v.unit } : {}),
              equalToSlotIds: [],
            };
            m.quantities.push(q);
            slot.quantityIds.push(q.id);
          } else {
            const step = m.steps.find((s) => s.id === annotation.targetStepId);
            if (step) step.detailAssertionIds.push(id);
          }
        }
      }
      for (const edit of input.fieldEdits) {
        const slot = m.componentSlots.find((s) => s.id === edit.occurrenceId);
        if (!slot)
          throw new WorkspaceError(
            "OCCURRENCE_NOT_FOUND",
            "The ingredient occurrence is no longer in this material.",
          );
        const field =
          edit.field === "part" ? "partAssertionId" : "stateAssertionId";
        let id: string;
        if (edit.state === "unknown")
          id = unknown(
            `ingredient.${edit.field}`,
            `${edit.field}: explicit unknown`,
            c.primarySourceRevisionId,
            edit.reason ?? "not_reported",
            edit.rationale,
          );
        else if (edit.state === "not_applicable") {
          if (slot.kind === "plant_material")
            throw new WorkspaceError(
              "INVALID_APPLICABILITY",
              "Plant organ/state cannot be dismissed as not applicable for a plant material. Use unknown when unreported.",
            );
          const a: AssertionData = {
            id: uid("assertion"),
            field: `ingredient.${edit.field}`,
            label: `${edit.field}: not applicable`,
            origin: "human_curated",
            references: [
              {
                kind: "metadata",
                sourceRevisionId: c.primarySourceRevisionId,
                field: "displayText",
              },
            ],
            inputAssertionIds: [],
            review: review(input.actor, now),
            state: "not_applicable",
            rationale: edit.rationale,
          };
          data.assertions.push(a);
          m.assertionIds.push(a.id);
          c.assertionIds.push(a.id);
          id = a.id;
          changed.push(a.id);
        } else {
          if (!edit.supportingSpanId || !edit.value)
            throw new WorkspaceError(
              "SUPPORT_REQUIRED",
              "Recorded or inferred fields require a supporting source span and value.",
            );
          const span = support(edit.supportingSpanId);
          id = claim(
            `ingredient.${edit.field}`,
            `${edit.field}: reviewed value`,
            edit.value,
            [span.id],
            edit.rationale,
            edit.state === "inferred" ||
              edit.value.toLowerCase() !== span.exact.toLowerCase(),
          );
        }
        replace(slot[field], id);
        slot[field] = id;
      }
      for (const edit of input.candidateEdits) {
        const slot = m.componentSlots.find((s) => s.id === edit.occurrenceId);
        if (!slot)
          throw new WorkspaceError(
            "OCCURRENCE_NOT_FOUND",
            "The ingredient occurrence is not in this material.",
          );
        edit.supportSpanIds.forEach(support);
        if (
          !edit.supportSpanIds.some((id) => {
            const revision = sourceFor(support(id).sourceRevisionId);
            return (
              data.sources.find((source) => source.id === revision.sourceId)
                ?.kind !== "taxonomy_snapshot"
            );
          })
        )
          throw new WorkspaceError(
            "HISTORICAL_BASIS_REQUIRED",
            "A taxonomic name record cannot support a historical identification by itself. Cite a historical or scholarly passage separately.",
          );
        if (
          edit.status === "documented_plausible" &&
          !edit.supportSpanIds.some((id) =>
            support(id)
              .exact.toLowerCase()
              .includes(
                edit.proposedName.replace(/\?$/, "").trim().toLowerCase(),
              ),
          )
        )
          throw new WorkspaceError(
            "SCHOLARLY_BASIS_REQUIRED",
            "A documented identification requires a passage containing the proposed name. Otherwise label it as an inferred candidate.",
          );
        const assertionId = claim(
          "identity.candidate",
          `Proposed identification · ${edit.proposedName}`,
          edit.proposedName,
          edit.supportSpanIds,
          edit.rationale,
          true,
          "user_hypothesis",
        );
        let taxonConceptId: string | null = null;
        if (edit.taxonomySnapshotId) {
          const snapshot = this.taxonomy.snapshot(edit.taxonomySnapshotId);
          const choice = snapshot?.normalized.choices.find(
            (c) => c.key === edit.taxonomyChoiceKey,
          );
          if (!snapshot || !choice?.selectable || !edit.taxonomyReviewed)
            throw new WorkspaceError(
              "TAXONOMY_REVIEW_REQUIRED",
              "Only an explicitly reviewed, exact, sufficiently specific modern-name record can be attached. Fuzzy, ambiguous and higher-rank results remain unresolved.",
            );
          const reported = edit.proposedName
            .replace(/\?$/, "")
            .trim()
            .toLowerCase();
          if (
            ![choice.canonicalName, choice.scientificName, snapshot.query].some(
              (n) => n.trim().toLowerCase() === reported,
            )
          )
            throw new WorkspaceError(
              "TAXON_NAME_MISMATCH",
              "The taxonomic lookup must normalize this candidate’s proposed name, not a different plant.",
            );
          const sid = uid("gbif-source"),
            rid = `${sid}.r1`,
            rawSha = sha256(snapshot.raw);
          data.sources.push({
            id: sid,
            kind: "taxonomy_snapshot",
            title: `GBIF name match · ${snapshot.query}`,
            creators: ["GBIF Secretariat"],
            work: snapshot.normalized.datasetTitle,
            edition: `GBIF Backbone v1 response retrieved ${snapshot.retrievedAt}`,
            translator: null,
            language: "en",
            publicationDate: snapshot.retrievedAt.slice(0, 10),
            compositionDate: "Modern taxonomic service snapshot",
            identifiers: {
              dataset: snapshot.normalized.datasetId,
              usage: choice.key,
            },
            canonicalUrl: `https://api.gbif.org/v1/species/match?verbose=true&name=${encodeURIComponent(snapshot.query)}`,
          });
          const sr = {
            id: rid,
            sourceId: sid,
            revision: 1,
            retrievedAt: snapshot.retrievedAt,
            rawFile: objectFile("providers", snapshot.raw),
            rawUrl: `https://api.gbif.org/v1/species/match?verbose=true&name=${encodeURIComponent(snapshot.query)}`,
            rawSha256: rawSha,
            displayText: snapshot.raw,
            textSha256: rawSha,
            parser: "recon-gbif-json-v1",
            editorialNote:
              "Unmodified name-match JSON; accepted name usage metadata is retained separately. Service confidence is not historical identity certainty.",
            locator: { label: `GBIF Backbone · match usage ${choice.key}` },
            rights: {
              decision: "bundle_allowed" as const,
              license: "CC BY 4.0",
              licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
              credit:
                "GBIF Secretariat: GBIF Backbone Taxonomy. https://doi.org/10.15468/39omei",
              storage: true,
              display: true,
              redistribution: true,
              restrictions:
                "Retain dataset attribution, original reported name and taxonomic qualifiers. No historical identification is implied.",
              verificationUrl:
                "https://www.gbif.org/dataset/d7dddbf4-2cf0-4f39-9b2a-bb099caae36c",
              verifiedAt: snapshot.retrievedAt,
              evidenceFile: "data/taxonomy/raw/backbone-metadata.json",
              evidenceSha256: sha256(
                readFileSync(
                  resolve(ROOT, "data/taxonomy/raw/backbone-metadata.json"),
                ),
              ),
            },
          };
          data.sourceRevisions.push({ ...sr, contentHash: contentHash(sr) });
          addSource(rid);
          const supportingSourceRevisionIds = [rid];
          if (snapshot.acceptedRaw) {
            const acceptedSid = uid("gbif-usage"),
              acceptedRid = `${acceptedSid}.r1`,
              acceptedUrl = `https://api.gbif.org/v1/species/${choice.acceptedKey}`;
            data.sources.push({
              ...data.sources.find((s) => s.id === sid)!,
              id: acceptedSid,
              title: `GBIF accepted name usage · ${choice.acceptedName}`,
              identifiers: {
                dataset: snapshot.normalized.datasetId,
                usage: choice.acceptedKey,
              },
              canonicalUrl: acceptedUrl,
            });
            const acceptedRevision = {
              ...sr,
              id: acceptedRid,
              sourceId: acceptedSid,
              rawFile: objectFile("providers", snapshot.acceptedRaw),
              rawUrl: acceptedUrl,
              rawSha256: sha256(snapshot.acceptedRaw),
              displayText: snapshot.acceptedRaw,
              textSha256: sha256(snapshot.acceptedRaw),
              editorialNote:
                "Unmodified accepted name usage JSON, retained separately from the matching response.",
              locator: {
                label: `GBIF Backbone · accepted usage ${choice.acceptedKey}`,
              },
            };
            data.sourceRevisions.push({
              ...acceptedRevision,
              contentHash: contentHash(acceptedRevision),
            });
            addSource(acceptedRid);
            supportingSourceRevisionIds.push(acceptedRid);
          }
          taxonConceptId = uid("taxon");
          data.taxa.push({
            id: taxonConceptId,
            authority: "GBIF Backbone Taxonomy v1",
            datasetId: snapshot.normalized.datasetId,
            snapshotId: snapshot.id,
            nameUsageId: choice.key,
            acceptedUsageId: choice.acceptedKey,
            reportedName: choice.scientificName,
            reportedRank: choice.rank,
            acceptedName: choice.acceptedName,
            acceptedRank: choice.acceptedRank,
            qualifiers: [
              ...choice.qualifiers,
              `Historical proposal retained verbatim: ${edit.proposedName}`,
            ],
            sourceRevisionId: rid,
            supportingSourceRevisionIds,
          });
        }
        const candidate = {
          id: uid("candidate"),
          occurrenceId: slot.id,
          proposedName: edit.proposedName,
          taxonConceptId,
          supportAssertionIds: [assertionId],
          rationale: edit.rationale,
          status: edit.status,
        };
        data.candidates.push(candidate);
        slot.candidateIds.push(candidate.id);
      }
      for (const edit of input.stepEdits ?? []) {
        const step = m.steps.find((s) => s.id === edit.stepId);
        if (
          !step ||
          edit.followsStepIds.some((id) => !m.steps.some((s) => s.id === id)) ||
          edit.followsStepIds.includes(step.id)
        )
          throw new WorkspaceError(
            "INVALID_PROCESS_ORDER",
            "Choose valid preceding steps; a step cannot precede itself.",
          );
        support(edit.supportingSpanId);
        const id = claim(
          "preparation.order",
          "Explicit process-order interpretation",
          {
            follows: edit.followsStepIds.map(
              (id) => m.steps.find((s) => s.id === id)!.operationAssertionId,
            ),
          },
          [edit.supportingSpanId],
          edit.rationale,
          true,
          "user_hypothesis",
        );
        step.followsStepIds = [...new Set(edit.followsStepIds)];
        step.detailAssertionIds.push(id);
      }
      for (const edit of input.quantityEdits ?? []) {
        const q = m.quantities.find((q) => q.id === edit.quantityId);
        if (!q)
          throw new WorkspaceError(
            "QUANTITY_NOT_FOUND",
            "The quantity relationship is not in this material.",
          );
        support(edit.supportingSpanId);
        if ((edit.value === undefined) !== (edit.unit === undefined))
          throw new WorkspaceError(
            "QUANTITY_UNIT_REQUIRED",
            "A numeric amount requires a unit; do not replace missing quantities with zero.",
          );
        if (edit.value !== undefined)
          valueFor("quantity", {
            value: edit.value,
            unit: edit.unit!,
            basis: edit.basis,
          });
        const id = claim(
          "quantity.relationship",
          "Reviewed quantity interpretation",
          {
            basis: edit.basis,
            ...(edit.value !== undefined
              ? { value: edit.value, unit: edit.unit! }
              : { relationship: "equal" }),
          },
          [edit.supportingSpanId],
          edit.rationale,
          true,
          "user_hypothesis",
        );
        replace(q.assertionId, id);
        q.assertionId = id;
        q.basis = edit.basis;
        q.dimension = edit.basis;
        if (edit.value === undefined) {
          delete q.value;
          delete q.unit;
        } else {
          q.value = edit.value;
          q.unit = edit.unit!;
        }
      }
      const assigned = new Set<string>();
      for (const assignment of input.assignments) {
        const slot = m.componentSlots.find(
            (s) => s.id === assignment.occurrenceId,
          ),
          candidate = data.candidates.find(
            (c) => c.id === assignment.candidateId,
          );
        if (
          !slot?.candidateIds.includes(assignment.candidateId) ||
          candidate?.occurrenceId !== assignment.occurrenceId ||
          assigned.has(assignment.occurrenceId) ||
          candidate.status === "rejected"
        )
          throw new WorkspaceError(
            "INVALID_ASSIGNMENT",
            "Choose at most one documented candidate per occurrence.",
          );
        assigned.add(assignment.occurrenceId);
      }
      if (input.assignments.length && input.assignmentRationale.length < 3)
        throw new WorkspaceError(
          "ASSUMPTION_RATIONALE_REQUIRED",
          "Explain the selected interpretation; it remains an assumption, not a historical fact.",
        );
      c.baselineScenarioInput = {
        assignments: input.assignments,
        hypotheticalOverrides: old.baselineScenarioInput.hypotheticalOverrides,
        rationale:
          input.assignmentRationale ||
          "No historical botanical identity is selected.",
      };
      let fp: ReturnType<typeof buildMaterialFingerprint>;
      try {
        fp = buildMaterialFingerprint(
          m,
          data.assertions,
          data.candidates,
          data.taxa,
          input.assignments,
        );
      } catch {
        throw new WorkspaceError(
          "INVALID_PROCESS_ORDER",
          "The material contains invalid or cyclic process dependencies. Your draft has not been saved.",
        );
      }
      m.fingerprint = fp.hash;
      m.fingerprintPayload = fp.payload;
      m.assertionIds = [...new Set(m.assertionIds)];
      m.recordHash = materialRecordHash(m);
      data.materials.push(m);
      c.assertionIds = [...new Set(c.assertionIds)];
      c.contentHash = contentHash(c);
      data.cases.push(c);
      this.ensureSize(data);
      try {
        validateCorpus(data);
      } catch (e) {
        throw new WorkspaceError(
          "INVALID_REVISION",
          e instanceof Error && e.message.includes("PROCESS_CYCLE")
            ? "Process ordering contains a cycle. Your draft has not been saved."
            : "The revision contains invalid source references, hashes or relationships. Your draft has not been saved.",
        );
      }
      seed(this.db, data);
      for (const d of input.decisions)
        this.db.prepare("INSERT INTO proposal_decisions VALUES(?,?,?,?,?)").run(
          run!.id,
          d.proposalId,
          caseId,
          c.revision,
          JSON.stringify({
            proposalId: d.proposalId,
            decision: d.decision,
            caseRevision: c.revision,
            rationale: d.rationale,
          }),
        );
      const auditEventId = this.audit("case_revision_saved", caseId, {
        actor: input.actor,
        createdAt: now,
        rationale: input.rationale,
        baseRevision: old.revision,
        revision: c.revision,
        changedAssertionIds: changed,
        runId: run?.id ?? null,
        manualAnnotations: input.manualAnnotations.length,
        fingerprint: fp.hash,
        unresolvedFingerprintFields: fp.unknownCount,
        assumptions: input.assignments,
      });
      return SaveResponse.parse({
        schemaVersion: "recon-v1",
        result: getCase(data, caseId, c.revision),
        auditEventId,
        scientificStatus: "draft_unless_individually_source_checked",
      });
    });
  }
}
