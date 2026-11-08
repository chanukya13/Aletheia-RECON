import { z } from "zod";
export const PendingFullText = z.strictObject({
  status: z.enum(["retained", "metadata_only"]),
  reason: z.string(),
  text: z.string().max(500000),
  license: z.string().nullable(),
  sha256: z.string().nullable(),
  url: z.string().nullable(),
  retrievedAt: z.string(),
});
import {
  Assertion,
  CaseRevision,
  ComparisonPolicy,
  ComparisonResult,
  Hash,
  Id,
  MaterialVersion,
  ScenarioInput,
  Source,
  SourceRevision,
  Span,
  Study,
  EvidenceUnit,
} from "./base.js";
export const EvaluateRequest = z.strictObject({
  caseRevision: z.number().int().positive(),
  policyId: z.literal("material-audit-v1"),
  scenario: ScenarioInput,
  evidenceUnitIds: z.array(Id).min(1).max(50),
});
export const Evaluation = z.strictObject({
  schemaVersion: z.literal("recon-v1"),
  case: CaseRevision,
  policy: ComparisonPolicy,
  policyHash: Hash,
  inputHash: Hash,
  resultHash: Hash,
  results: z.array(ComparisonResult),
  assertions: z.array(Assertion),
  spans: z.array(Span),
  sourceRevisions: z.array(SourceRevision),
  sources: z.array(Source),
});
export const StudyList = z.strictObject({
  schemaVersion: z.literal("recon-v1"),
  studies: z.array(Study),
  evidenceUnits: z.array(EvidenceUnit),
});
export const StudyDetail = StudyList.extend({
  materials: z.array(MaterialVersion),
  assertions: z.array(Assertion),
  spans: z.array(Span),
  sourceRevisions: z.array(SourceRevision),
  sources: z.array(Source),
});
export const LiteratureItem = z.strictObject({
  id: z.string().max(100),
  source: z.string().max(50),
  title: z.string().max(2000),
  authorString: z.string().max(5000),
  year: z.string().max(20),
  doi: z.string().max(300).nullable(),
  pmcid: z
    .string()
    .regex(/^PMC\d+$/)
    .nullable(),
  license: z.string().max(300).nullable(),
  openAccess: z.boolean(),
  publicationTypes: z.array(z.string().max(300)),
  fullTextStatus: z.literal("not_retrieved"),
});
export const LiteratureSearch = z.strictObject({
  schemaVersion: z.literal("recon-v1"),
  state: z.enum(["ready", "unavailable"]),
  query: z.string(),
  cursor: z.string().nullable(),
  nextCursor: z.string().nullable(),
  retrievedAt: z.string(),
  stale: z.boolean(),
  message: z.string(),
  snapshotId: Id,
  items: z.array(LiteratureItem).max(10),
});
export const LiteratureImport = z.strictObject({
  requestId: Id,
  snapshotId: Id,
  id: z.string().max(100),
  source: z.string().max(50),
});
export const PendingStudy = z.strictObject({
  schemaVersion: z.literal("recon-v1"),
  id: Id,
  metadata: LiteratureItem,
  review: z.literal("pending"),
  contentStatus: z.literal("metadata_only"),
  snapshotId: Id,
});
export const PendingStudyList = z.strictObject({
  items: z.array(PendingStudy),
});
