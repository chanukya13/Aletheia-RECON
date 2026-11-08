import { z } from "zod";
import { Hash, Id, Source, SourceRevision, Span } from "./base.js";

export const TraceRole = z.enum([
  "original_language_edition",
  "translation",
  "editorial_note",
  "modern_interpretation",
  "modern_tested_material",
  "unclassified",
]);
export const TraceManifest = z.strictObject({
  version: z.literal("recon-trace-1"),
  corpusHash: Hash,
  entries: z.array(
    z.strictObject({
      spanId: Id,
      role: TraceRole,
      workGroup: z.string().min(1).max(200),
    }),
  ),
  terms: z.array(
    z.strictObject({
      forms: z.array(z.string().min(1).max(80)),
      candidateIds: z.array(Id),
      spanIds: z.array(Id),
    }),
  ),
});
export const TraceRequest = z.strictObject({
  q: z.string().trim().min(1).max(80),
  excludedSpanIds: z.array(Id).max(100).default([]),
});
export const InterpretationTrace = z.strictObject({
  version: z.literal("recon-trace-1"),
  query: z.string(),
  corpusHash: Hash,
  inputHash: Hash,
  resultHash: Hash,
  sourceCount: z.number().int(),
  literals: z.array(Span),
  contributions: z.array(
    z.strictObject({
      spanId: Id,
      role: TraceRole,
      workGroup: z.string(),
      excluded: z.boolean(),
    }),
  ),
  candidates: z.array(
    z.strictObject({
      id: Id,
      name: z.string(),
      review: z.string(),
      paths: z.array(
        z.strictObject({
          assertionIds: z.array(Id),
          spanId: Id,
          excluded: z.boolean(),
        }),
      ),
      survivingPaths: z.number().int(),
    }),
  ),
  sources: z.array(Source),
  sourceRevisions: z.array(SourceRevision),
  spans: z.array(Span),
});
export type TraceManifestData = z.infer<typeof TraceManifest>;
export type InterpretationTraceData = z.infer<typeof InterpretationTrace>;
