import { z } from "zod";
import { Hash, Id, Source, SourceRevision, Span } from "./base.js";

export const OutcomeObservation = z.strictObject({
  id: Id,
  studyId: Id,
  sourceRevisionId: Id,
  rawSourceHash: Hash,
  tableId: z.string(),
  rowLabel: z.string(),
  columnLabel: z.string(),
  rowIndex: z.number().int().positive().nullable(),
  columnIndex: z.number().int().positive().nullable(),
  organism: z.string(),
  strain: z.string(),
  assay: z.string(),
  endpoint: z.string(),
  statistic: z.string(),
  unit: z.string(),
  value: z.number().finite().nullable(),
  qualifier: z.enum(["exact", "greater_than", "less_than", "missing"]),
  rawValue: z.string(),
  minimumBiologicalReplicates: z.number().int().positive().nullable(),
  materialVersionId: Id.nullable(),
  spanId: Id,
  composition: z.array(
    z.strictObject({ ingredient: z.string(), included: z.boolean() }),
  ),
});
export const OutcomeCatalogue = z.strictObject({
  version: z.literal("recon-outcomes-1"),
  contentHash: Hash,
  observations: z.array(OutcomeObservation),
  sources: z.array(Source),
  sourceRevisions: z.array(SourceRevision),
  spans: z.array(Span),
});
export const OutcomePair = z.strictObject({ left: Id, right: Id });
export const OutcomeContrast = z.strictObject({
  version: z.literal("recon-outcomes-1"),
  left: OutcomeObservation,
  right: OutcomeObservation,
  status: z.enum(["available", "unavailable"]),
  ratio: z.number().finite().nullable(),
  reasons: z.array(z.string()),
  inputHash: Hash,
  resultHash: Hash,
});
export type OutcomeObservationData = z.infer<typeof OutcomeObservation>;
export type OutcomeCatalogueData = z.infer<typeof OutcomeCatalogue>;
export type OutcomeContrastData = z.infer<typeof OutcomeContrast>;
