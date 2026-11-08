import { transportSchema } from "./transport-schema.js";
import { retrievePendingFullText } from "./full-text.js";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type Database from "better-sqlite3";
import { z } from "zod";
import {
  EvaluateRequest,
  Evaluation,
  Id,
  LiteratureImport,
  LiteratureSearch,
  PendingStudy,
  PendingFullText,
  StudyDetail,
  StudyList,
} from "@recon/contracts";
import {
  evaluateUnit,
  MATERIAL_POLICY,
  POLICY_HASH,
  scientificHash,
  parseJsonStrict,
} from "@recon/core";
import { readCorpus } from "./database.js";
import { canDisplay, filterRevision } from "./repository.js";
import { WorkspaceError } from "./errors.js";
import { LiteratureService } from "./literature.js";
export function registerEvidenceRoutes(
  app: FastifyInstance,
  db: Database.Database,
  guard: (r: FastifyRequest) => void,
  live: boolean,
  fetcher?: typeof fetch,
) {
  const schema = (s: z.ZodType) => transportSchema(s);
  const literature = new LiteratureService(db, live, fetcher);
  let lookups: number[] = [];
  app.get(
    "/api/v1/studies",
    { schema: { response: { 200: schema(StudyList) } } },
    async () => {
      const d = readCorpus(db);
      return {
        schemaVersion: "recon-v1",
        studies: d.studies,
        evidenceUnits: d.evidenceUnits,
      };
    },
  );
  app.get<{ Params: { id: string } }>(
    "/api/v1/studies/:id",
    {
      schema: {
        params: schema(z.strictObject({ id: Id })),
        response: { 200: schema(StudyDetail) },
      },
    },
    async (r) => {
      const d = readCorpus(db),
        study = d.studies.find((s) => s.id === r.params.id);
      if (!study)
        throw new WorkspaceError("NOT_FOUND", "Study not found.", 404);
      const revisions = d.sourceRevisions.filter((s) =>
        study.sourceRevisionIds.includes(s.id),
      );
      const spans = d.spans.filter((s) =>
        revisions.some((r) => r.id === s.sourceRevisionId && canDisplay(r)),
      );
      const assertions = d.assertions.filter((a) =>
        a.references.every((ref) =>
          ref.kind === "span"
            ? spans.some((s) => s.id === ref.spanId)
            : revisions.some(
                (r) => r.id === ref.sourceRevisionId && canDisplay(r),
              ),
        ),
      );
      return {
        schemaVersion: "recon-v1",
        studies: [study],
        evidenceUnits: d.evidenceUnits.filter((u) => u.studyId === study.id),
        materials: d.materials.filter((m) =>
          d.evidenceUnits.some(
            (u) => u.studyId === study.id && u.testedMaterialVersionId === m.id,
          ),
        ),
        assertions,
        spans,
        sourceRevisions: revisions.map(filterRevision),
        sources: d.sources.filter((s) =>
          revisions.some((r) => r.sourceId === s.id),
        ),
      };
    },
  );
  app.post<{ Params: { id: string } }>(
    "/api/v1/cases/:id/evaluate",
    {
      schema: {
        params: schema(z.strictObject({ id: Id })),
        body: schema(EvaluateRequest),
        response: { 200: schema(Evaluation) },
      },
      preHandler: async (r) => guard(r),
    },
    async (r) => {
      const input = EvaluateRequest.parse(r.body),
        d = readCorpus(db),
        c = d.cases.find(
          (c) => c.id === r.params.id && c.revision === input.caseRevision,
        );
      if (!c)
        throw new WorkspaceError(
          "CASE_REVISION_NOT_FOUND",
          "Pinned case revision not found.",
          404,
        );
      if (input.scenario.hypotheticalOverrides.length)
        throw new WorkspaceError(
          "OVERRIDES_UNSUPPORTED",
          "Hypothetical field overrides require the later scenario workflow.",
        );
      const material = d.materials.find((m) => m.id === c.materialVersionId)!;
      const seen = new Set<string>();
      for (const a of input.scenario.assignments) {
        if (
          seen.has(a.occurrenceId) ||
          !material.componentSlots.some(
            (s) =>
              s.id === a.occurrenceId && s.candidateIds.includes(a.candidateId),
          ) ||
          d.candidates.find((c) => c.id === a.candidateId)?.status ===
            "rejected"
        )
          throw new WorkspaceError(
            "INVALID_ASSIGNMENT",
            "Choose one available candidate per occurrence.",
          );
        seen.add(a.occurrenceId);
      }
      if (new Set(input.evidenceUnitIds).size !== input.evidenceUnitIds.length)
        throw new WorkspaceError(
          "DUPLICATE_EVIDENCE",
          "Choose each evidence unit once.",
        );
      const units = input.evidenceUnitIds.map((id) => {
        const u = d.evidenceUnits.find((u) => u.id === id);
        if (!u)
          throw new WorkspaceError(
            "EVIDENCE_NOT_FOUND",
            "Evidence unit not found.",
            404,
          );
        return u;
      });
      const results = units.map((u) =>
        evaluateUnit(d, c, u, input.scenario.assignments),
      );
      const refs = results.flatMap((x) =>
        x.materialComparison.dimensions.flatMap((f) => f.sourceReferences),
      );
      const ids = new Set(results.flatMap((x) => x.dependencies));
      units.forEach((u) => {
        u.supportSpanIds.forEach((id) =>
          refs.push({ kind: "span", spanId: id }),
        );
        u.contextAssertionIds.forEach((id) => ids.add(id));
      });
      const assertions = d.assertions.filter((a) => ids.has(a.id));
      const spanIds = new Set(
        [...refs, ...assertions.flatMap((a) => a.references)].flatMap((r) =>
          r.kind === "span" ? [r.spanId] : [],
        ),
      );
      const allowed = d.sourceRevisions.filter(canDisplay);
      const spans = d.spans.filter(
        (s) =>
          spanIds.has(s.id) && allowed.some((r) => r.id === s.sourceRevisionId),
      );
      const revisions = allowed.filter(
        (r) =>
          spans.some((s) => s.sourceRevisionId === r.id) ||
          assertions.some((a) =>
            a.references.some(
              (ref) => ref.kind === "metadata" && ref.sourceRevisionId === r.id,
            ),
          ),
      );
      const safeAssertions = assertions.filter((a) =>
        a.references.every((ref) =>
          ref.kind === "span"
            ? spans.some((s) => s.id === ref.spanId)
            : revisions.some((r) => r.id === ref.sourceRevisionId),
        ),
      );
      const inputHash = scientificHash({
        caseHash: c.contentHash,
        corpus: d.revision,
        policyHash: POLICY_HASH,
        input,
      });
      const result = Evaluation.parse({
        schemaVersion: "recon-v1",
        case: c,
        policy: MATERIAL_POLICY,
        policyHash: POLICY_HASH,
        inputHash,
        resultHash: scientificHash(results),
        results,
        assertions: safeAssertions,
        spans,
        sourceRevisions: revisions,
        sources: d.sources.filter((s) =>
          revisions.some((r) => r.sourceId === s.id),
        ),
      });
      db.prepare("INSERT OR IGNORE INTO evaluation_runs VALUES(?,?)").run(
        inputHash,
        JSON.stringify(result),
      );
      return result;
    },
  );
  app.get(
    "/api/v1/literature/search",
    {
      schema: {
        querystring: schema(
          z.strictObject({
            q: z.string().trim().min(2).max(200),
            cursor: z.string().max(2000).optional(),
          }),
        ),
        response: { 200: schema(LiteratureSearch) },
      },
    },
    async (r) => {
      lookups = lookups.filter((t) => t > Date.now() - 60000);
      if (lookups.length >= 20)
        throw new WorkspaceError(
          "RATE_LIMITED",
          "Wait a minute before another literature lookup.",
          429,
        );
      lookups.push(Date.now());
      const q = r.query as { q: string; cursor?: string };
      return literature.search(q.q, q.cursor);
    },
  );
  app.post(
    "/api/v1/studies/import",
    {
      schema: {
        body: schema(LiteratureImport),
        response: { 200: schema(PendingStudy) },
      },
      preHandler: async (r) => guard(r),
    },
    async (r) => {
      const b = LiteratureImport.parse(r.body);
      return literature.import(b.snapshotId, b.id, b.source);
    },
  );
  app.post<{ Params: { id: string } }>(
    "/api/v1/pending-studies/:id/full-text",
    {
      schema: {
        params: schema(z.strictObject({ id: Id })),
        body: schema(z.strictObject({})),
      },
      preHandler: async (r) => guard(r),
    },
    async (r) =>
      retrievePendingFullText(db, r.params.id, live, fetcher).then((result) =>
        PendingFullText.parse(result),
      ),
  );
  app.get("/api/v1/pending-studies", async () => ({
    items: db
      .prepare(
        "SELECT payload FROM pending_studies ORDER BY rowid DESC LIMIT 100",
      )
      .all()
      .map((row) =>
        PendingStudy.parse(
          parseJsonStrict((row as { payload: string }).payload),
        ),
      ),
  }));
}
