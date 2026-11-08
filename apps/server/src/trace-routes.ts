import type { FastifyInstance } from "fastify";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { InterpretationTrace, TraceManifest } from "@recon/contracts";
import { traceInterpretations } from "@recon/core";
import { loadCorpus, ROOT } from "./database.js";
import { transportSchema } from "./transport-schema.js";
import { WorkspaceError } from "./errors.js";

export function registerTraceRoutes(app: FastifyInstance) {
  const data = loadCorpus();
  const manifest = TraceManifest.parse(
    JSON.parse(readFileSync(resolve(ROOT, "data/trace-manifest.json"), "utf8")),
  );
  app.get<{ Querystring: { q: string; exclude?: string } }>(
    "/api/v1/interpretation-trace",
    {
      schema: {
        querystring: transportSchema(
          z.strictObject({
            q: z.string().trim().min(1).max(80),
            exclude: z.string().max(12000).optional(),
          }),
        ),
        response: { 200: transportSchema(InterpretationTrace) },
      },
    },
    async (req) => {
      try {
        return traceInterpretations(data, manifest, {
          q: req.query.q,
          excludedSpanIds: req.query.exclude?.split(",").filter(Boolean) ?? [],
        });
      } catch (error) {
        throw new WorkspaceError(
          "TRACE_UNAVAILABLE",
          error instanceof Error ? error.message : "Trace unavailable",
          422,
        );
      }
    },
  );
}
