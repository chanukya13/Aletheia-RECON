import { transportSchema } from "./transport-schema.js";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import {
  AnalysisRecord,
  BundleImportList,
  BundleImportRecord,
  EvaluationArtifact,
  EvaluationArtifactList,
  Id,
  ImportBundlePreview,
  ImportBundleRequest,
  ImportedBundleResponse,
  ImportTextRequest,
} from "@recon/contracts";
import {
  buildDossier,
  dossierHtml,
  parseJsonStrict,
  replayDossier,
  scientificHash,
  validateDossier,
  validateCorpus,
} from "@recon/core";
import { ROOT } from "./database.js";
import { WorkspaceError } from "./errors.js";
import { bibliographyDownload, referencesFor } from "./bibliography.js";
import type { CurationService } from "./curation.js";
import { requestOrigin } from "./request-origin.js";

export function registerDossierRoutes(
  app: FastifyInstance,
  db: Database.Database,
  guard: (r: FastifyRequest) => void,
  curation: CurationService,
  publicOrigin?: string,
) {
  const schema = (v: z.ZodType) => transportSchema(v);
  const safe = <T>(fn: () => T): T => {
    try {
      return fn();
    } catch (e) {
      if (e instanceof WorkspaceError) throw e;
      const message =
        e instanceof z.ZodError
          ? e.issues
              .slice(0, 3)
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join("; ")
          : e instanceof Error
            ? e.message
            : "Dossier validation failed.";
      throw new WorkspaceError("INVALID_DOSSIER", message.slice(0, 2000), 422);
    }
  };
  const record = (id: string) => {
    const row = db
      .prepare("SELECT payload FROM analysis_records WHERE id=?")
      .get(id) as { payload: string } | undefined;
    if (!row)
      throw new WorkspaceError("NOT_FOUND", "Frozen analysis not found.", 404);
    return AnalysisRecord.parse(parseJsonStrict(row.payload, 32_000_000));
  };
  const bundle = (id: string) =>
    safe(() => {
      const r = record(id);
      const snapshot = r.context
        ? (db
            .prepare("SELECT payload FROM corpus_revisions WHERE id=?")
            .get(r.context.corpusRevision) as { payload: string } | undefined)
        : undefined;
      return buildDossier(
        r,
        snapshot
          ? validateCorpus(parseJsonStrict(snapshot.payload, 32_000_000))
          : undefined,
      );
    });
  const download = (
    reply: import("fastify").FastifyReply,
    body: string,
    type: string,
    name: string,
  ) =>
    reply
      .header("Content-Type", type)
      .header("Content-Disposition", `attachment; filename="${name}"`)
      .send(body);
  app.get<{ Params: { id: string }; Querystring: { format: "json" | "html" } }>(
    "/api/v1/analyses/:id/export",
    {
      schema: {
        params: schema(z.strictObject({ id: Id })),
        querystring: schema(
          z.strictObject({ format: z.enum(["json", "html"]) }),
        ),
      },
    },
    async (req, reply) => {
      const b = bundle(req.params.id);
      return req.query.format === "json"
        ? download(
            reply,
            JSON.stringify(b, null, 2) + "\n",
            "application/json; charset=utf-8",
            `${req.params.id}.json`,
          )
        : download(
            reply,
            dossierHtml(b),
            "text/html; charset=utf-8",
            `${req.params.id}.html`,
          );
    },
  );
  app.get<{ Params: { id: string } }>(
    "/api/v1/analyses/:id/dossier",
    { schema: { params: schema(z.strictObject({ id: Id })) } },
    async (req) => bundle(req.params.id),
  );
  app.get<{
    Params: { id: string };
    Querystring: { format: "csl-json" | "bibtex" | "ris" };
  }>(
    "/api/v1/analyses/:id/references",
    {
      schema: {
        params: schema(z.strictObject({ id: Id })),
        querystring: schema(
          z.strictObject({ format: z.enum(["csl-json", "bibtex", "ris"]) }),
        ),
      },
    },
    async (req, reply) => {
      const refs = referencesFor(bundle(req.params.id));
      return download(
        reply,
        bibliographyDownload(refs, req.query.format),
        req.query.format === "csl-json"
          ? "application/json; charset=utf-8"
          : "text/plain; charset=utf-8",
        `${req.params.id}-references.${{ "csl-json": "csl.json", bibtex: "bib", ris: "ris" }[req.query.format]}`,
      );
    },
  );
  const decode = (input: unknown) =>
    typeof input === "string" ? parseJsonStrict(input, 32_000_000) : input;
  const preview = (input: unknown) => {
    const b = validateDossier(decode(input)),
      receipt = replayDossier(b);
    return ImportBundlePreview.parse({
      bundleHash: b.bundleHash,
      title: b.title,
      kind: b.kind,
      caseCount: b.scientific.corpus.cases.length,
      assertionCount: b.scientific.corpus.assertions.length,
      omittedSourceCount: b.sources.filter((s) => !s.textIncluded).length,
      receipt,
      warnings: [
        "Imported content is untrusted research data. Declared reviewers are not authenticated.",
        "Original identifiers stay inside a separate namespace. Existing case/source records are unchanged.",
        ...b.limitations,
      ],
    });
  };
  app.post(
    "/api/v1/imports/bundle/preview",
    {
      bodyLimit: 32_000_000,
      preHandler: async (r) => guard(r),
      schema: {
        body: schema(ImportBundleRequest),
        response: { 200: schema(ImportBundlePreview) },
      },
    },
    async (req) =>
      safe(() => preview(ImportBundleRequest.parse(req.body).bundle)),
  );
  app.post(
    "/api/v1/imports/bundle",
    {
      bodyLimit: 32_000_000,
      preHandler: async (r) => guard(r),
      schema: {
        body: schema(ImportBundleRequest),
        response: { 200: schema(BundleImportRecord) },
      },
    },
    async (req) =>
      safe(() => {
        const input = ImportBundleRequest.parse(req.body),
          p = preview(input.bundle),
          prior = db
            .prepare("SELECT record FROM imported_dossiers WHERE bundle_hash=?")
            .get(p.bundleHash) as { record: string } | undefined;
        if (prior)
          return BundleImportRecord.parse(parseJsonStrict(prior.record));
        const record = BundleImportRecord.parse({
          id: `import-${randomUUID()}`,
          bundleHash: p.bundleHash,
          title: p.title,
          createdAt: new Date().toISOString(),
          receipt: p.receipt,
        });
        db.prepare("INSERT INTO imported_dossiers VALUES(?,?,?,?)").run(
          record.id,
          p.bundleHash,
          JSON.stringify(record),
          JSON.stringify(decode(input.bundle)),
        );
        return record;
      }),
  );
  app.get(
    "/api/v1/imports",
    { schema: { response: { 200: schema(BundleImportList) } } },
    async () => ({
      items: db
        .prepare(
          "SELECT record FROM imported_dossiers ORDER BY rowid DESC LIMIT 100",
        )
        .all()
        .map((row) =>
          BundleImportRecord.parse(
            parseJsonStrict((row as { record: string }).record),
          ),
        ),
    }),
  );
  const imported = (id: string) => {
    const row = db
      .prepare("SELECT record,bundle FROM imported_dossiers WHERE id=?")
      .get(id) as { record: string; bundle: string } | undefined;
    if (!row)
      throw new WorkspaceError("NOT_FOUND", "Isolated dossier not found.", 404);
    return ImportedBundleResponse.parse({
      record: parseJsonStrict(row.record),
      bundle: parseJsonStrict(row.bundle, 32_000_000),
    });
  };
  app.get<{ Params: { id: string } }>(
    "/api/v1/imports/:id",
    {
      schema: {
        params: schema(z.strictObject({ id: Id })),
        response: { 200: schema(ImportedBundleResponse) },
      },
    },
    async (req) => imported(req.params.id),
  );
  app.post<{ Params: { id: string } }>(
    "/api/v1/imports/:id/replay",
    {
      preHandler: async (r) => guard(r),
      schema: { params: schema(z.strictObject({ id: Id })) },
    },
    async (req) => safe(() => replayDossier(imported(req.params.id).bundle)),
  );
  app.post<{ Params: { id: string } }>(
    "/api/v1/imports/:id/editable-copy",
    {
      preHandler: async (r) => guard(r),
      schema: {
        params: schema(z.strictObject({ id: Id })),
        body: schema(z.strictObject({ requestId: Id, caseId: Id })),
      },
    },
    async (req) =>
      safe(() => {
        const b = imported(req.params.id).bundle,
          q = req.body as { requestId: string; caseId: string },
          c = b.scientific.corpus.cases
            .filter((c) => c.id === q.caseId)
            .sort((a, b) => b.revision - a.revision)[0];
        if (!c)
          throw new WorkspaceError(
            "CASE_NOT_FOUND",
            "Case not in this isolated dossier.",
            404,
          );
        const r = b.scientific.corpus.sourceRevisions.find(
            (r) => r.id === c.primarySourceRevisionId,
          )!,
          s = b.scientific.corpus.sources.find((s) => s.id === r.sourceId)!;
        if (
          !b.sources.find((v) => v.id === r.id)?.textIncluded ||
          r.displayText.length > 50000
        )
          throw new WorkspaceError(
            "EDITABLE_COPY_UNAVAILABLE",
            "The original is omitted or exceeds the plain-text import limit. Import your own authorized passage instead.",
          );
        return curation.importText(
          ImportTextRequest.parse({
            requestId: q.requestId,
            actor: {
              name: "Local dossier import",
              qualification:
                "Unreviewed source copy; no imported review is promoted",
              mode: "draft",
            },
            title: `${c.title} / isolated copy`.slice(0, 200),
            text: r.displayText,
            language: s.language,
            creator: s.creators.join("; ").slice(0, 300),
            edition: s.edition.slice(0, 300),
            rightsDeclaration: "local_research_only",
            rightsRationale:
              "Explicit local editable copy from a validated isolated dossier; original attribution and namespace remain in the retained bundle.",
            kind: c.kind,
          }),
          requestOrigin(req, publicOrigin),
        );
      }),
  );
  const evaluationRoot = resolve(ROOT, "artifacts/evaluation");
  const evaluationIndex = () =>
    existsSync(resolve(evaluationRoot, "index.json"))
      ? EvaluationArtifactList.parse(
          parseJsonStrict(
            readFileSync(resolve(evaluationRoot, "index.json"), "utf8"),
          ),
        )
      : { items: [] };
  app.get(
    "/api/v1/evaluation/runs",
    { schema: { response: { 200: schema(EvaluationArtifactList) } } },
    async () => evaluationIndex(),
  );
  app.get<{ Params: { id: string } }>(
    "/api/v1/evaluation/runs/:id",
    {
      schema: {
        params: schema(z.strictObject({ id: Id })),
        response: { 200: schema(EvaluationArtifact) },
      },
    },
    async (req) => {
      if (!evaluationIndex().items.some((r) => r.id === req.params.id))
        throw new WorkspaceError(
          "NOT_FOUND",
          "Computed evaluation artifact not found.",
          404,
        );
      const result = EvaluationArtifact.parse(
        parseJsonStrict(
          readFileSync(
            resolve(evaluationRoot, req.params.id, "report.json"),
            "utf8",
          ),
          32_000_000,
        ),
      );
      const { contentHash, ...rest } = result;
      if (contentHash !== scientificHash(rest))
        throw new WorkspaceError(
          "EVALUATION_INTEGRITY",
          "Evaluation artifact integrity check failed.",
          422,
        );
      return result;
    },
  );
}
