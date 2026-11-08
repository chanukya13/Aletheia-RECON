import type { FastifyInstance } from "fastify";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  OutcomeCatalogue,
  OutcomeContrast,
  OutcomePair,
} from "@recon/contracts";
import { contrastOutcomes, matchingSourceCells } from "@recon/core";
import { loadCorpus, ROOT } from "./database.js";
import { extractOutcomeTables } from "./outcome-tables.js";
import { transportSchema } from "./transport-schema.js";
import { WorkspaceError } from "./errors.js";

export function registerOutcomeRoutes(app: FastifyInstance) {
  const data = loadCorpus();
  const catalogue = () => {
    try {
      return extractOutcomeTables(
        readFileSync(resolve(ROOT, "data/sources/raw/PMC6261618.xml"), "utf8"),
        data,
      );
    } catch (error) {
      throw new WorkspaceError(
        "OUTCOME_SOURCE_UNAVAILABLE",
        error instanceof Error && /^[A-Z_]+$/.test(error.message)
          ? error.message
          : "The pinned outcome table could not be read.",
        422,
      );
    }
  };
  app.get(
    "/api/v1/outcome-observations",
    { schema: { response: { 200: transportSchema(OutcomeCatalogue) } } },
    async () => catalogue(),
  );
  app.get<{ Querystring: { left: string; right: string } }>(
    "/api/v1/outcome-contrast",
    {
      schema: {
        querystring: transportSchema(OutcomePair),
        response: { 200: transportSchema(OutcomeContrast) },
      },
    },
    async (req) => {
      const rows = catalogue().observations,
        left = rows.find((o) => o.id === req.query.left),
        right = rows.find((o) => o.id === req.query.right);
      if (!left || !right)
        throw new WorkspaceError(
          "OBSERVATION_NOT_FOUND",
          "A selected observation is unavailable.",
          404,
        );
      if (
        [left, right].some((row) => matchingSourceCells(rows, row).length !== 1)
      )
        throw new WorkspaceError(
          "OBSERVATION_AMBIGUOUS",
          "Source-cell context is not unique.",
          422,
        );
      return contrastOutcomes(left, right);
    },
  );
}
