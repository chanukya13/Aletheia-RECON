import { transportSchema } from "./transport-schema.js";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { z } from "zod";
import {
  AnalysisList,
  AnalysisRecord,
  AuditRequest,
  DiffResponse,
  DomainPreview,
  InterpretationDomain,
  MaterialComparison,
  MaterialList,
  MaterialVersionComparisonRequest,
  PinnedContext,
  ProvenanceClosure,
  SaveAnalysis,
  ScenarioAuditResponse,
  ScenarioDiffRequest,
  ScenarioEvaluateRequest,
  ScenarioEvaluation,
  ScenarioList,
  ScenarioRecord,
  ScenarioSaveRequest,
  Id,
  type CorpusData,
} from "@recon/contracts";
import {
  aggregateFindings,
  applyScenario,
  buildGroups,
  compareMaterials,
  contentHash,
  diffScenarios,
  evaluateScenario,
  MATERIAL_POLICY,
  POLICY_HASH,
  parseJsonStrict,
  runRobustness,
  scenarioHash,
  scenarioKind,
  scientificHash,
  scopeCorpus,
  selectDomain,
  ScenarioError,
  validateScenario,
} from "@recon/core";
import { readCorpus } from "./database.js";
import { canDisplay, filterRevision } from "./repository.js";
import { WorkspaceError } from "./errors.js";
type Context = z.infer<typeof PinnedContext>;
function closure(d: CorpusData, ids: string[]) {
  const assertions = d.assertions.filter((a) => ids.includes(a.id));
  const spanIds = assertions.flatMap((a) =>
    a.references.flatMap((r) => (r.kind === "span" ? [r.spanId] : [])),
  );
  const revisions = d.sourceRevisions.filter(
    (r) =>
      d.spans.some(
        (s) => spanIds.includes(s.id) && s.sourceRevisionId === r.id,
      ) ||
      assertions.some((a) =>
        a.references.some(
          (ref) => ref.kind === "metadata" && ref.sourceRevisionId === r.id,
        ),
      ),
  );
  const spans = d.spans.filter(
    (s) =>
      spanIds.includes(s.id) &&
      revisions.some((r) => r.id === s.sourceRevisionId && canDisplay(r)),
  );
  return ProvenanceClosure.parse({
    assertions: assertions.filter((a) =>
      a.references.every((ref) =>
        ref.kind === "span"
          ? spans.some((s) => s.id === ref.spanId)
          : revisions.some(
              (r) => r.id === ref.sourceRevisionId && canDisplay(r),
            ),
      ),
    ),
    spans,
    sourceRevisions: revisions.map(filterRevision),
    sources: d.sources.filter((s) =>
      revisions.some((r) => r.sourceId === s.id),
    ),
  });
}
function allProof(
  d: CorpusData,
  c: CorpusData["cases"][number],
  unitIds: string[],
) {
  const materials = d.materials.filter(
    (m) =>
      m.id === c.materialVersionId ||
      d.evidenceUnits.some(
        (u) => unitIds.includes(u.id) && u.testedMaterialVersionId === m.id,
      ),
  );
  return closure(d, [
    ...c.assertionIds,
    ...materials.flatMap((m) => m.assertionIds),
    ...d.candidates
      .filter((a) =>
        materials.some((m) =>
          m.componentSlots.some((s) => s.candidateIds.includes(a.id)),
        ),
      )
      .flatMap((a) => a.supportAssertionIds),
    ...d.evidenceUnits
      .filter((u) => unitIds.includes(u.id))
      .flatMap((u) => [
        ...u.contextAssertionIds,
        u.endpointAssertionId,
        u.comparatorAssertionId,
        u.outcomeAssertionId,
      ]),
  ]);
}
export function registerScenarioRoutes(
  app: FastifyInstance,
  db: Database.Database,
  guard: (r: FastifyRequest) => void,
) {
  const schema = (s: z.ZodType) => transportSchema(s);
  const params = { params: schema(z.strictObject({ id: Id })) };
  const safe = <T>(fn: () => T): T => {
    try {
      return fn();
    } catch (e) {
      if (e instanceof ScenarioError)
        throw new WorkspaceError(
          e.code,
          e.message,
          e.code.includes("LIMIT") ? 422 : 422,
        );
      throw e;
    }
  };
  const pinned = (d: CorpusData, id: string, pin: Context) => {
    const c = d.cases.find(
      (c) => c.id === id && c.revision === pin.caseRevision,
    );
    if (!c)
      throw new WorkspaceError(
        "CASE_REVISION_NOT_FOUND",
        "Pinned case revision not found.",
        404,
      );
    if (
      c.contentHash !== pin.caseHash ||
      pin.policyHash !== POLICY_HASH ||
      d.revision !== pin.corpusRevision ||
      (pin.selection === "latest" &&
        d.cases.some((x) => x.id === id && x.revision > c.revision))
    )
      throw new WorkspaceError(
        "STALE_ANALYSIS",
        "Case, corpus or policy changed. Reload before evaluating or saving; your draft remains in the editor.",
        409,
      );
    return c;
  };
  const units = (d: CorpusData, ids: string[]) => {
    if (new Set(ids).size !== ids.length)
      throw new WorkspaceError(
        "DUPLICATE_EVIDENCE",
        "Choose each evidence unit once.",
      );
    return ids.map((id) => {
      const u = d.evidenceUnits.find((u) => u.id === id);
      if (!u)
        throw new WorkspaceError(
          "EVIDENCE_NOT_FOUND",
          "Evidence unit not found.",
          404,
        );
      return u;
    });
  };
  const domain = (
    d: CorpusData,
    c: CorpusData["cases"][number],
    context: Context,
  ) =>
    InterpretationDomain.parse({
      context,
      groups: buildGroups(d, c),
      excludedCandidateIds: d.candidates
        .filter(
          (a) =>
            d.materials
              .find((m) => m.id === c.materialVersionId)!
              .componentSlots.some((s) => s.candidateIds.includes(a.id)) &&
            a.status !== "documented_plausible",
        )
        .map((a) => a.id),
      limitation:
        "Source-documented proposals are not an exhaustive botanical domain. Draft alternatives require explicit draft exploration. A selected identity is an assumption, not a historical identification.",
    });
  const store = (
    kind: string,
    context: Context | null,
    input: unknown,
    payload: unknown,
  ) => {
    const d = readCorpus(db);
    const request = input as {
      caseId?: string;
      evidenceUnitIds?: string[];
      left?: { materialVersionId: string };
      right?: { materialVersionId: string };
    };
    const cases = d.cases.filter(
      (c) =>
        (c.id === request.caseId && c.revision === context?.caseRevision) ||
        c.materialVersionId === request.left?.materialVersionId ||
        c.materialVersionId === request.right?.materialVersionId,
    );
    const selectedUnits = d.evidenceUnits.filter((u) =>
      request.evidenceUnitIds?.includes(u.id),
    );
    const materialIds = new Set([
      ...cases.map((c) => c.materialVersionId),
      ...selectedUnits.map((u) => u.testedMaterialVersionId),
      request.left?.materialVersionId,
      request.right?.materialVersionId,
    ]);
    const materials = d.materials.filter((m) => materialIds.has(m.id));
    const candidates = d.candidates.filter((c) =>
      materials.some((m) =>
        m.componentSlots.some((s) => s.candidateIds.includes(c.id)),
      ),
    );
    const frozenInput = {
      request: input,
      policy: MATERIAL_POLICY,
      records: {
        cases,
        materials,
        candidates,
        taxa: d.taxa.filter((t) =>
          candidates.some((c) => c.taxonConceptId === t.id),
        ),
        evidenceUnits: selectedUnits,
        studies: d.studies.filter((s) =>
          selectedUnits.some((u) => u.studyId === s.id),
        ),
      },
      replayCorpus: scopeCorpus(d, input),
    };
    const runHash = scientificHash({
      kind,
      context,
      input: frozenInput,
      payload,
    });
    const text = JSON.stringify(payload);
    if (
      Buffer.byteLength(text) + Buffer.byteLength(JSON.stringify(frozenInput)) >
      31_000_000
    )
      throw new WorkspaceError(
        "OUTPUT_LIMIT_EXCEEDED",
        "The complete result and inputs exceed the local snapshot limit; reduce the bounded selection. No partial result was stored.",
        413,
      );
    db.prepare("INSERT OR IGNORE INTO scenario_runs VALUES(?,?,?,?,?)").run(
      runHash,
      kind,
      context ? JSON.stringify(context) : null,
      JSON.stringify(frozenInput),
      text,
    );
    return runHash;
  };
  const idempotent = <T>(
    operation: string,
    request: { requestId: string },
    fn: () => T,
  ) =>
    db
      .transaction(() => {
        const hash = scientificHash(request);
        const row = db
          .prepare(
            "SELECT operation,input_hash,response FROM idempotency_keys WHERE id=?",
          )
          .get(request.requestId) as
          | { operation: string; input_hash: string; response: string }
          | undefined;
        if (row) {
          if (row.operation !== operation || row.input_hash !== hash)
            throw new WorkspaceError(
              "IDEMPOTENCY_CONFLICT",
              "Request ID already used with different input.",
              409,
            );
          return parseJsonStrict(row.response, 32_000_000) as T;
        }
        const response = fn();
        db.prepare("INSERT INTO idempotency_keys VALUES(?,?,?,?)").run(
          request.requestId,
          operation,
          hash,
          JSON.stringify(response),
        );
        return response;
      })
      .immediate();
  const evaluate = (
    id: string,
    input: z.infer<typeof ScenarioEvaluateRequest>,
  ) =>
    safe(() => {
      const d = readCorpus(db),
        c = pinned(d, id, input.context),
        selected = units(d, input.evidenceUnitIds),
        calculated = evaluateScenario(d, c, selected, input.scenario);
      const payload = {
        schemaVersion: "recon-v1" as const,
        context: input.context,
        case: c,
        scenario: input.scenario,
        scenarioHash: scenarioHash(input.scenario),
        ...calculated,
        ...allProof(
          applyScenario(d, c, input.scenario).data,
          applyScenario(d, c, input.scenario).caseRecord,
          input.evidenceUnitIds,
        ),
        warning:
          calculated.kind === "hypothetical"
            ? "Conditional hypothetical result. Overrides are not source facts and cannot enter reviewed robustness audits."
            : "Explicit interpretations do not settle historical identity. Pending claims and unknowns remain visible.",
      };
      return ScenarioEvaluation.parse({
        ...payload,
        runHash: store(
          "scenario",
          input.context,
          { caseId: id, ...input },
          payload,
        ),
      });
    });
  app.get<{
    Params: { id: string };
    Querystring: { revision?: number; selection?: "latest" | "pinned" };
  }>(
    "/api/v1/cases/:id/interpretation-domain",
    {
      schema: {
        ...params,
        querystring: schema(
          z.strictObject({
            revision: z.number().int().positive().optional(),
            selection: z.enum(["latest", "pinned"]).optional(),
          }),
        ),
        response: { 200: schema(InterpretationDomain) },
      },
    },
    async (req) =>
      safe(() => {
        const d = readCorpus(db);
        const c = d.cases
          .filter(
            (c) =>
              c.id === req.params.id &&
              (!req.query.revision || c.revision === req.query.revision),
          )
          .sort((a, b) => b.revision - a.revision)[0];
        if (!c)
          throw new WorkspaceError(
            "CASE_REVISION_NOT_FOUND",
            "Case not found.",
            404,
          );
        return domain(d, c, {
          caseRevision: c.revision,
          caseHash: c.contentHash,
          corpusRevision: d.revision,
          policyHash: POLICY_HASH,
          selection: req.query.selection ?? "latest",
        });
      }),
  );
  app.post<{ Params: { id: string } }>(
    "/api/v1/cases/:id/scenario-evaluate",
    {
      schema: {
        ...params,
        body: schema(ScenarioEvaluateRequest),
        response: { 200: schema(ScenarioEvaluation) },
      },
      preHandler: async (r) => guard(r),
    },
    async (req) =>
      evaluate(req.params.id, ScenarioEvaluateRequest.parse(req.body)),
  );
  app.get<{ Params: { id: string } }>(
    "/api/v1/cases/:id/scenarios",
    { schema: { ...params, response: { 200: schema(ScenarioList) } } },
    async (req) => ({
      items: db
        .prepare(
          "SELECT payload FROM scenario_versions WHERE case_id=? ORDER BY rowid DESC LIMIT 200",
        )
        .all(req.params.id)
        .map((row) =>
          ScenarioRecord.parse(
            parseJsonStrict((row as { payload: string }).payload),
          ),
        ),
    }),
  );
  app.post<{ Params: { id: string } }>(
    "/api/v1/cases/:id/scenarios",
    {
      schema: {
        ...params,
        body: schema(ScenarioSaveRequest),
        response: { 200: schema(ScenarioRecord) },
      },
      preHandler: async (r) => guard(r),
    },
    async (req) =>
      safe(() => {
        const input = ScenarioSaveRequest.parse(req.body);
        return idempotent(`scenario-save:${req.params.id}`, input, () => {
          const d = readCorpus(db),
            c = pinned(d, req.params.id, input.context);
          validateScenario(d, c, input.scenario);
          let revision = 1;
          const id = input.id ?? `scenario-${randomUUID()}`;
          const prior = db
            .prepare(
              "SELECT payload FROM scenario_versions WHERE id=? ORDER BY revision DESC LIMIT 1",
            )
            .get(id) as { payload: string } | undefined;
          if (prior) {
            const record = ScenarioRecord.parse(parseJsonStrict(prior.payload));
            if (
              record.caseId !== c.id ||
              record.context.caseRevision !== c.revision ||
              record.revision !== input.expectedRevision
            )
              throw new WorkspaceError(
                "STALE_SCENARIO",
                "This scenario has changed or belongs to another pinned case. Save a fork or reload its latest revision.",
                409,
              );
            revision = record.revision + 1;
          } else if (input.expectedRevision !== 0 || input.id)
            throw new WorkspaceError(
              "STALE_SCENARIO",
              "Scenario not found at the expected revision.",
              409,
            );
          if (revision > 200)
            throw new WorkspaceError(
              "REVISION_LIMIT",
              "Scenario revision limit reached.",
              413,
            );
          const payload = {
            id,
            revision,
            caseId: c.id,
            context: input.context,
            name: input.name,
            scenario: input.scenario,
            scenarioHash: scenarioHash(input.scenario),
            kind: scenarioKind(d, input.scenario),
            createdAt: new Date().toISOString(),
            actor: input.actor,
          };
          const record = ScenarioRecord.parse({
            ...payload,
            contentHash: contentHash(payload),
          });
          db.prepare("INSERT INTO scenario_versions VALUES(?,?,?,?,?)").run(
            id,
            revision,
            c.id,
            c.revision,
            JSON.stringify(record),
          );
          db.prepare(
            "INSERT INTO audit_events(event_type,subject_id,payload) VALUES(?,?,?)",
          ).run(
            "scenario_saved",
            id,
            JSON.stringify({
              actor: input.actor,
              revision,
              caseId: c.id,
              caseRevision: c.revision,
              scenarioHash: record.scenarioHash,
              createdAt: record.createdAt,
            }),
          );
          return record;
        });
      }),
  );
  app.post<{ Params: { id: string } }>(
    "/api/v1/cases/:id/scenario-diff",
    {
      schema: {
        ...params,
        body: schema(ScenarioDiffRequest),
        response: { 200: schema(DiffResponse) },
      },
      preHandler: async (r) => guard(r),
    },
    async (req) =>
      safe(() => {
        const input = ScenarioDiffRequest.parse(req.body),
          d = readCorpus(db),
          c = pinned(d, req.params.id, input.context),
          selected = units(d, input.evidenceUnitIds);
        const calculated = diffScenarios(
          d,
          c,
          selected,
          input.before,
          input.after,
        );
        const before = applyScenario(d, c, input.before);
        const after = applyScenario(d, c, input.after);
        const beforeProof = allProof(
          before.data,
          before.caseRecord,
          input.evidenceUnitIds,
        );
        const afterProof = allProof(
          after.data,
          after.caseRecord,
          input.evidenceUnitIds,
        );
        const proof = Object.fromEntries(
          Object.keys(beforeProof).map((key) => {
            const field = key as keyof typeof beforeProof;
            return [
              key,
              [
                ...new Map(
                  [...beforeProof[field], ...afterProof[field]].map((item) => [
                    item.id,
                    item,
                  ]),
                ).values(),
              ],
            ];
          }),
        );
        const payload = {
          context: input.context,
          ...calculated,
          ...proof,
        };
        return DiffResponse.parse({
          ...payload,
          runHash: store(
            "diff",
            input.context,
            { caseId: c.id, ...input },
            payload,
          ),
        });
      }),
  );
  const prepare = (id: string, input: z.infer<typeof AuditRequest>) => {
    const d = readCorpus(db),
      c = pinned(d, id, input.context),
      selected = units(d, input.evidenceUnitIds);
    validateScenario(d, c, input.scenario);
    if (
      input.mode === "reviewed" &&
      input.scenario.assignments.some(
        (a) =>
          !domain(d, c, input.context).groups.some((g) =>
            g.alternatives.some(
              (alt) => alt.id === a.candidateId && alt.eligibleReviewed,
            ),
          ),
      )
    )
      throw new WorkspaceError(
        "DOMAIN_REVIEW_REQUIRED",
        "Fixed draft assumptions cannot enter a reviewed-domain audit.",
      );
    return { d, c, selected, domain: domain(d, c, input.context) };
  };
  app.post<{ Params: { id: string } }>(
    "/api/v1/cases/:id/domain-preview",
    {
      schema: {
        ...params,
        body: schema(AuditRequest),
        response: { 200: schema(DomainPreview) },
      },
      preHandler: async (r) => guard(r),
    },
    async (req) =>
      safe(() => {
        const input = AuditRequest.parse(req.body),
          prepared = prepare(req.params.id, input);
        const p = selectDomain(prepared.domain, input);
        return {
          context: input.context,
          requestHash: scientificHash(input),
          worldCount: p.worlds.length,
          rawWorldCount: p.rawWorldCount,
          excludedAlternatives: p.excludedAlternatives,
          mode: input.mode,
          limitation: prepared.domain.limitation,
        };
      }),
  );
  app.post<{ Params: { id: string } }>(
    "/api/v1/cases/:id/robustness",
    {
      schema: {
        ...params,
        body: schema(AuditRequest),
        response: { 200: schema(ScenarioAuditResponse) },
      },
      preHandler: async (r) => guard(r),
    },
    async (req) =>
      safe(() => {
        const input = AuditRequest.parse(req.body),
          p = prepare(req.params.id, input),
          start = performance.now();
        const calculated = runRobustness(p.d, p.c, p.selected, p.domain, input),
          requestHash = scientificHash(input);
        const preview = {
          context: input.context,
          requestHash,
          worldCount: calculated.audit.worldCount,
          rawWorldCount: calculated.selected.rawWorldCount,
          excludedAlternatives: calculated.selected.excludedAlternatives,
          mode: input.mode,
          limitation: calculated.audit.domainLimitation,
        };
        const { selected: _selected, ...result } = calculated;
        const payload = {
          context: input.context,
          requestHash,
          mode: input.mode,
          preview,
          ...result,
          ...allProof(p.d, p.c, input.evidenceUnitIds),
        };
        const runHash = store(
          "robustness",
          input.context,
          { caseId: p.c.id, ...input, interpretationDomain: p.domain },
          payload,
        );
        return ScenarioAuditResponse.parse({
          ...payload,
          runHash,
          elapsedMs: performance.now() - start,
        });
      }),
  );
  app.get(
    "/api/v1/materials",
    { schema: { response: { 200: schema(MaterialList) } } },
    async () => {
      const d = readCorpus(db);
      return {
        policyHash: POLICY_HASH,
        items: d.materials.map((material) => {
          const c = d.cases.find((c) => c.materialVersionId === material.id);
          return {
            material,
            caseId: c?.id ?? null,
            caseRevision: c?.revision ?? null,
            studyIds: [
              ...new Set(
                d.evidenceUnits
                  .filter((u) => u.testedMaterialVersionId === material.id)
                  .map((u) => u.studyId),
              ),
            ],
          };
        }),
      };
    },
  );
  app.post(
    "/api/v1/materials/compare",
    {
      schema: {
        body: schema(MaterialVersionComparisonRequest),
        response: { 200: schema(MaterialComparison) },
      },
      preHandler: async (r) => guard(r),
    },
    async (req) =>
      safe(() => {
        const input = MaterialVersionComparisonRequest.parse(req.body);
        if (input.policyHash !== POLICY_HASH)
          throw new WorkspaceError(
            "STALE_ANALYSIS",
            "Policy changed; reload material versions.",
            409,
          );
        const d = readCorpus(db);
        const side = (s: typeof input.left) => {
          const m = d.materials.find((m) => m.id === s.materialVersionId);
          if (!m)
            throw new WorkspaceError(
              "MATERIAL_NOT_FOUND",
              "Pinned material version not found.",
              404,
            );
          const c = d.cases.find(
            (c) =>
              c.id === s.caseId &&
              c.revision === s.caseRevision &&
              c.materialVersionId === m.id,
          );
          if (d.cases.some((c) => c.materialVersionId === m.id) && !c)
            throw new WorkspaceError(
              "MATERIAL_CASE_REQUIRED",
              "Historical material sides require their exact associated case revision.",
            );
          if (c)
            validateScenario(d, c, {
              assignments: s.assignments,
              hypotheticalOverrides: [],
              rationale: "Explicit material-side assumptions.",
            });
          else if (s.assignments.length)
            throw new WorkspaceError(
              "INVALID_ASSIGNMENT",
              "Fixed tested materials have no historical identity scenario.",
            );
          return m;
        };
        const left = side(input.left),
          right = side(input.right),
          dimensions = compareMaterials(
            d,
            left,
            right,
            input.left.assignments,
            input.right.assignments,
          );
        const ids = (m: typeof left, a: typeof input.left.assignments) => [
          ...new Set([
            ...m.assertionIds,
            ...a.flatMap(
              (x) =>
                d.candidates.find((c) => c.id === x.candidateId)
                  ?.supportAssertionIds ?? [],
            ),
          ]),
        ];
        const leftAssertionIds = ids(left, input.left.assignments),
          rightAssertionIds = ids(right, input.right.assignments);
        const payload = {
          scope: "material_only" as const,
          policyHash: POLICY_HASH,
          left,
          right,
          leftAssertionIds,
          rightAssertionIds,
          verdict: aggregateFindings(dimensions),
          dimensions,
          ...closure(d, [...leftAssertionIds, ...rightAssertionIds]),
          warning:
            "Comparison of recorded material dimensions only. Differences do not establish lineage, chemical consequences or clinical effects. Draft methods summaries remain unstructured and unknown.",
        };
        return MaterialComparison.parse({
          ...payload,
          runHash: store("material_only", null, input, payload),
        });
      }),
  );
  app.post(
    "/api/v1/analyses",
    {
      schema: {
        body: schema(SaveAnalysis),
        response: { 200: schema(AnalysisRecord) },
      },
      preHandler: async (r) => guard(r),
    },
    async (req) => {
      const input = SaveAnalysis.parse(req.body);
      return idempotent("analysis-save", input, () => {
        const row = db
          .prepare(
            "SELECT kind,context,input,payload FROM scenario_runs WHERE hash=?",
          )
          .get(input.runHash) as
          | {
              kind: string;
              context: string | null;
              input: string;
              payload: string;
            }
          | undefined;
        if (!row)
          throw new WorkspaceError(
            "RUN_NOT_FOUND",
            "Run an evaluation or audit before freezing it.",
            404,
          );
        const payload = {
          id: `analysis-${randomUUID()}`,
          name: input.name,
          kind: row.kind,
          runHash: input.runHash,
          createdAt: new Date().toISOString(),
          context: row.context ? parseJsonStrict(row.context) : null,
          payload: parseJsonStrict(row.payload, 32_000_000),
          inputs: parseJsonStrict(row.input, 32_000_000),
        };
        const record = AnalysisRecord.parse({
          ...payload,
          contentHash: contentHash(payload),
        });
        db.prepare("INSERT INTO analysis_records VALUES(?,?)").run(
          record.id,
          JSON.stringify(record),
        );
        return record;
      });
    },
  );
  app.get(
    "/api/v1/analyses",
    { schema: { response: { 200: schema(AnalysisList) } } },
    async () => ({
      items: db
        .prepare(
          "SELECT payload FROM analysis_records ORDER BY rowid DESC LIMIT 100",
        )
        .all()
        .map((row) => {
          const {
            payload: _payload,
            inputs: _inputs,
            ...rest
          } = AnalysisRecord.parse(
            parseJsonStrict((row as { payload: string }).payload, 32_000_000),
          );
          return rest;
        }),
    }),
  );
  app.get<{ Params: { id: string } }>(
    "/api/v1/analyses/:id",
    { schema: { ...params, response: { 200: schema(AnalysisRecord) } } },
    async (req) => {
      const row = db
        .prepare("SELECT payload FROM analysis_records WHERE id=?")
        .get(req.params.id) as { payload: string } | undefined;
      if (!row)
        throw new WorkspaceError(
          "NOT_FOUND",
          "Frozen analysis not found.",
          404,
        );
      return AnalysisRecord.parse(parseJsonStrict(row.payload, 32_000_000));
    },
  );
}
