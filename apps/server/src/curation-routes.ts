import { transportSchema } from "./transport-schema.js";
import { registerScenarioRoutes } from "./scenario-routes.js";
import { registerDossierRoutes } from "./dossier-routes.js";
import { registerEvidenceRoutes } from "./evidence-routes.js";
import { randomBytes } from "node:crypto";
import type Database from "better-sqlite3";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  AuditResponse,
  EditorSession,
  ExtractionRequest,
  ExtractionRun,
  Id,
  ImportTextRequest,
  RevisionHistory,
  RevisionRequest,
  SaveResponse,
  ScientificName,
  TaxonomyResponse,
} from "@recon/contracts";
import { parseJsonStrict } from "@recon/core";
import { CurationService } from "./curation.js";
import { WorkspaceError } from "./errors.js";
import { TaxonomyService } from "./taxonomy.js";
import { readCorpus } from "./database.js";
import { requestOrigin } from "./request-origin.js";

export function registerCurationRoutes(
  app: FastifyInstance,
  db: Database.Database,
  options: {
    editor: boolean;
    liveTaxonomy: boolean;
    fetcher?: typeof fetch;
    publicOrigin?: string;
  },
) {
  const token = randomBytes(32).toString("hex");
  const taxonomy = new TaxonomyService(
    db,
    options.liveTaxonomy,
    options.fetcher,
  );
  const service = new CurationService(db, taxonomy);
  const schema = (s: z.ZodType) => transportSchema(s);
  const requests = new Map<string, number[]>();
  const rate = (key: string, max: number) => {
    const now = Date.now();
    const items = (requests.get(key) ?? []).filter((t) => t > now - 60000);
    if (items.length >= max)
      throw new WorkspaceError(
        "RATE_LIMITED",
        "This local workspace is rate-limited. Wait a minute before trying again.",
        429,
      );
    items.push(now);
    requests.set(key, items);
  };
  const guard = (req: FastifyRequest) => {
    if (!options.editor)
      throw new WorkspaceError(
        "READ_ONLY",
        "This application is running in read-only mode.",
        403,
      );
    const origin = req.headers.origin;
    const expected = requestOrigin(req, options.publicOrigin);
    if (
      origin !== expected ||
      req.headers["x-recon-csrf"] !== token ||
      (req.headers["sec-fetch-site"] &&
        req.headers["sec-fetch-site"] !== "same-origin" &&
        req.headers["sec-fetch-site"] !== "none")
    )
      throw new WorkspaceError(
        "ORIGIN_REJECTED",
        "The local editor requires a same-origin request and its session token.",
        403,
      );
    rate("write", 60);
  };
  registerScenarioRoutes(app, db, guard);
  registerDossierRoutes(app, db, guard, service, options.publicOrigin);
  registerEvidenceRoutes(app, db, guard, options.liveTaxonomy, options.fetcher);
  app.get(
    "/api/v1/editor-session",
    { schema: { response: { 200: schema(EditorSession) } } },
    async () => ({
      schemaVersion: "recon-v1",
      enabled: options.editor,
      csrfToken: token,
      provider: "GBIF Backbone v1",
      liveTaxonomyEnabled: options.liveTaxonomy,
    }),
  );
  app.post(
    "/api/v1/imports/text",
    {
      schema: {
        body: schema(ImportTextRequest),
        response: { 200: schema(SaveResponse) },
      },
      preHandler: async (req) => guard(req),
    },
    async (req) =>
      service.importText(
        ImportTextRequest.parse(req.body),
        requestOrigin(req, options.publicOrigin),
      ),
  );
  app.post<{ Params: { id: string } }>(
    "/api/v1/cases/:id/extraction-proposals",
    {
      schema: {
        params: schema(z.strictObject({ id: Id })),
        body: schema(ExtractionRequest),
        response: { 200: schema(ExtractionRun) },
      },
      preHandler: async (req) => guard(req),
    },
    async (req) =>
      service.extract(req.params.id, ExtractionRequest.parse(req.body)),
  );
  app.get<{
    Params: { id: string };
    Querystring: { runId?: string; caseRevision?: number };
  }>(
    "/api/v1/cases/:id/extraction-proposals",
    {
      schema: {
        params: schema(z.strictObject({ id: Id })),
        querystring: schema(
          z.strictObject({
            runId: Id.optional(),
            caseRevision: z.number().int().positive().optional(),
          }),
        ),
        response: { 200: schema(ExtractionRun.nullable()) },
      },
    },
    async (req) =>
      service.getRun(req.params.id, req.query.runId, req.query.caseRevision),
  );
  app.post<{ Params: { id: string } }>(
    "/api/v1/cases/:id/revisions",
    {
      schema: {
        params: schema(z.strictObject({ id: Id })),
        body: schema(RevisionRequest),
        response: { 200: schema(SaveResponse) },
      },
      preHandler: async (req) => guard(req),
    },
    async (req) => service.save(req.params.id, RevisionRequest.parse(req.body)),
  );
  app.get<{ Params: { id: string } }>(
    "/api/v1/cases/:id/revisions",
    {
      schema: {
        params: schema(z.strictObject({ id: Id })),
        response: { 200: schema(RevisionHistory) },
      },
    },
    async (req) => {
      const data = readCorpus(db);
      const rows = data.cases
        .filter((c) => c.id === req.params.id)
        .sort((a, b) => b.revision - a.revision);
      if (!rows.length)
        throw new WorkspaceError(
          "NOT_FOUND",
          "The case could not be found.",
          404,
        );
      const events = db
        .prepare(
          "SELECT payload FROM audit_events WHERE subject_id=? AND event_type IN ('case_revision_saved','text_imported') ORDER BY id DESC",
        )
        .all(req.params.id) as { payload: string }[];
      return RevisionHistory.parse({
        schemaVersion: "recon-v1",
        caseId: req.params.id,
        items: rows.map((c) => {
          const event = events
            .map(
              (e) =>
                parseJsonStrict(e.payload) as {
                  revision?: number;
                  actor?: { name: string };
                  createdAt?: string;
                  rationale?: string;
                },
            )
            .find((e) => (e.revision ?? 1) === c.revision);
          return {
            revision: c.revision,
            contentHash: c.contentHash,
            corpusRevision: c.corpusRevision,
            materialVersionId: c.materialVersionId,
            rationale:
              event?.rationale ??
              "Bundled source-checked draft; independent human review pending.",
            actor: event?.actor?.name ?? c.review.reviewer,
            createdAt: event?.createdAt ?? null,
          };
        }),
      });
    },
  );
  app.get<{ Params: { id: string } }>(
    "/api/v1/cases/:id/audit",
    {
      schema: {
        params: schema(z.strictObject({ id: Id })),
        response: { 200: schema(AuditResponse) },
      },
    },
    async (req) => {
      const rows = db
        .prepare(
          "SELECT id,event_type,subject_id,payload FROM audit_events WHERE subject_id=? ORDER BY id DESC LIMIT 200",
        )
        .all(req.params.id) as {
        id: number;
        event_type: string;
        subject_id: string;
        payload: string;
      }[];
      return {
        schemaVersion: "recon-v1",
        events: rows.map((r) => ({
          id: r.id,
          type: r.event_type,
          subjectId: r.subject_id,
          detail: parseJsonStrict(r.payload),
        })),
      };
    },
  );
  app.get<{ Querystring: { scientificName: string } }>(
    "/api/v1/taxonomy/candidates",
    {
      schema: {
        querystring: schema(z.strictObject({ scientificName: ScientificName })),
        response: { 200: schema(TaxonomyResponse) },
      },
    },
    async (req) => {
      rate("taxonomy", 20);
      return taxonomy.lookup(req.query.scientificName);
    },
  );
}
