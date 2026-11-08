import { z } from "zod";
import { Hash } from "./base.js";
export const VerificationStudy = z.strictObject({
  version: z.literal("recon-source-cell-study-1"),
  createdAt: z.string(),
  corpusHash: Hash,
  fixtureHash: Hash,
  contentHash: Hash,
  codeHash: Hash,
  nodeVersion: z.string(),
  audit: z.strictObject({
    reviewerType: z.literal("automated"),
    sourceFiles: z.number(),
    spans: z.number(),
    assertions: z.number(),
    checks: z.array(
      z.strictObject({
        assertionId: z.string(),
        state: z.string(),
        referenceCount: z.number(),
        status: z.literal("passed"),
      }),
    ),
  }),
  supportedQueries: z.number(),
  controlledQueries: z.number(),
  independentReviewers: z.literal(0),
  methods: z.array(z.string()),
  metrics: z.array(
    z.strictObject({
      name: z.string(),
      supportedCorrect: z.number(),
      unsupportedAbstained: z.number(),
      unsupportedLinks: z.number(),
      totalCorrect: z.number(),
      total: z.number(),
      accuracy: z.number(),
    }),
  ),
  predictions: z.array(z.json()),
  cellValuesVerified: z.number(),
});
