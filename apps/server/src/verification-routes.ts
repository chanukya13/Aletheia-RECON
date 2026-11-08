import type { FastifyInstance } from "fastify";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { VerificationStudy } from "@recon/contracts";
import { parseJsonStrict, scientificHash } from "@recon/core";
import { ROOT } from "./database.js";
import { transportSchema } from "./transport-schema.js";
import { WorkspaceError } from "./errors.js";
export function readVerificationStudy(file: string) {
  if (!existsSync(file))
    throw new WorkspaceError(
      "STUDY_NOT_RUN",
      "Run the documented source-cell evaluation to generate this artifact.",
      404,
    );
  try {
    const report = VerificationStudy.parse(
      parseJsonStrict(readFileSync(file, "utf8")),
    );
    const { contentHash, ...body } = report;
    if (scientificHash(body) !== contentHash)
      throw new Error("STUDY_INTEGRITY");
    return report;
  } catch {
    throw new WorkspaceError(
      "STUDY_INTEGRITY",
      "Source-cell evaluation integrity check failed.",
      422,
    );
  }
}
export function registerVerificationRoutes(app: FastifyInstance) {
  app.get(
    "/api/v1/verification-study",
    { schema: { response: { 200: transportSchema(VerificationStudy) } } },
    async () => {
      const file = resolve(
        ROOT,
        "artifacts/evaluation/source-cell-study/report.json",
      );
      return readVerificationStudy(file);
    },
  );
}
