import { z } from "zod";
import {
  CaseResponse,
  Hash,
  Id,
  SafeUrl,
  SCHEMA_VERSION,
  Span,
  Text,
} from "./base.js";
export const Actor = z.strictObject({
  name: z.string().trim().min(2).max(100),
  qualification: z.string().trim().min(3).max(300),
  mode: z.enum(["draft", "source_checked"]),
});
export const EditorSession = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  enabled: z.boolean(),
  csrfToken: z.string().min(32).max(128),
  provider: z.literal("GBIF Backbone v1"),
  liveTaxonomyEnabled: z.boolean(),
});
export const MutationBase = { requestId: Id, actor: Actor };
export const ImportTextRequest = z.strictObject({
  ...MutationBase,
  title: z.string().trim().min(2).max(200),
  text: z.string().min(1).max(50000),
  language: z
    .string()
    .regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/)
    .max(35),
  creator: z.string().trim().min(1).max(300),
  edition: z.string().trim().min(1).max(300),
  sourceUrl: SafeUrl.optional(),
  rightsDeclaration: z.enum([
    "local_research_only",
    "unknown",
    "CC0-1.0",
    "CC-BY-4.0",
    "public_domain",
  ]),
  rightsRationale: z.string().trim().min(5).max(1000),
  kind: z.enum(["recipe", "preparation_mention"]),
});
export const ProposalKind = z.enum([
  "ingredient",
  "operation",
  "quantity",
  "duration",
  "temperature",
  "contact",
  "matrix",
]);
export const Proposal = z.strictObject({
  id: Id,
  kind: ProposalKind,
  field: Text,
  label: Text,
  value: z.json(),
  span: Span,
  polarity: z.enum(["present", "negated"]),
  context: z.enum(["preparation_syntax", "mention_only"]),
  relatedProposalIds: z.array(Id),
  note: Text,
});
export const ExtractionRequest = z.strictObject({
  ...MutationBase,
  expectedRevision: z.number().int().positive(),
  sourceRevisionId: Id,
  extractorVersion: z.literal("english-preparation-v1"),
});
export const ExtractionRun = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: Id,
  caseId: Id,
  caseRevision: z.number().int().positive(),
  sourceRevisionId: Id,
  sourceTextSha256: Hash,
  extractorVersion: z.literal("english-preparation-v1"),
  status: z.enum(["supported", "unsupported_language", "unsupported_context"]),
  language: Text,
  coverage: Text,
  terms: z.array(Text),
  proposals: z.array(Proposal).max(300),
  decisions: z.array(
    z.strictObject({
      proposalId: Id,
      decision: z.enum(["accept", "reject"]),
      caseRevision: z.number().int().positive(),
      rationale: Text,
    }),
  ),
  createdAt: z.iso.datetime(),
});
export const ProposalDecision = z.strictObject({
  proposalId: Id,
  decision: z.enum(["accept", "reject"]),
  value: z.json().optional(),
  rationale: z.string().trim().min(3).max(1000),
});
export const ManualAnnotation = z.strictObject({
  sourceRevisionId: Id,
  sourceTextSha256: Hash,
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
  exact: z.string().min(1).max(4000),
  kind: z.enum([
    "ingredient",
    "operation",
    "part",
    "state",
    "quantity",
    "duration",
    "temperature",
    "contact",
    "matrix",
  ]),
  value: z.json(),
  targetOccurrenceId: Id.optional(),
  targetStepId: Id.optional(),
  interpretation: z.enum(["recorded", "inferred"]),
  rationale: z.string().trim().min(3).max(1000),
});
export const FieldEdit = z.strictObject({
  occurrenceId: Id,
  field: z.enum(["part", "state"]),
  state: z.enum(["unknown", "recorded", "inferred", "not_applicable"]),
  value: z.string().trim().min(1).max(200).optional(),
  reason: z
    .enum(["not_reported", "unreadable", "not_reviewed", "ambiguous"])
    .optional(),
  supportingSpanId: Id.optional(),
  rationale: z.string().trim().min(3).max(1000),
});
export const CandidateEdit = z.strictObject({
  occurrenceId: Id,
  proposedName: z.string().trim().min(2).max(200),
  status: z.enum(["documented_plausible", "inferred", "unresolved"]),
  supportSpanIds: z.array(Id).min(1).max(8),
  rationale: z.string().trim().min(5).max(1000),
  taxonomySnapshotId: Id.optional(),
  taxonomyChoiceKey: z.string().max(100).optional(),
  taxonomyReviewed: z.boolean().default(false),
});
export const StepEdit = z.strictObject({
  stepId: Id,
  followsStepIds: z.array(Id).max(20),
  supportingSpanId: Id,
  rationale: z.string().trim().min(3).max(1000),
});
export const QuantityEdit = z.strictObject({
  quantityId: Id,
  basis: z.enum(["mass", "volume", "count", "unknown"]),
  value: z.number().finite().min(0).max(1e9).optional(),
  unit: z.string().trim().min(1).max(40).optional(),
  supportingSpanId: Id,
  rationale: z.string().trim().min(3).max(1000),
});
export const RevisionRequest = z.strictObject({
  ...MutationBase,
  expectedRevision: z.number().int().positive(),
  runId: Id.optional(),
  decisions: z.array(ProposalDecision).max(300),
  manualAnnotations: z.array(ManualAnnotation).max(100),
  fieldEdits: z.array(FieldEdit).max(100),
  candidateEdits: z.array(CandidateEdit).max(30),
  stepEdits: z.array(StepEdit).max(50).optional(),
  quantityEdits: z.array(QuantityEdit).max(50).optional(),
  assignments: z
    .array(z.strictObject({ occurrenceId: Id, candidateId: Id }))
    .max(50),
  assignmentRationale: z.string().trim().max(1000),
  rationale: z.string().trim().min(3).max(1000),
});
export const SaveResponse = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  result: CaseResponse,
  auditEventId: z.number().int().positive(),
  scientificStatus: z.literal("draft_unless_individually_source_checked"),
});
export const RevisionHistory = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  caseId: Id,
  items: z.array(
    z.strictObject({
      revision: z.number().int().positive(),
      contentHash: Hash,
      corpusRevision: Id,
      materialVersionId: Id,
      rationale: Text,
      actor: Text,
      createdAt: z.iso.datetime().nullable(),
    }),
  ),
});
export const ScientificName = z
  .string()
  .trim()
  .min(2)
  .max(200)
  .regex(/^[\p{L}\p{M}\p{N}\s.()×'’-]+$/u);
export const TaxonomyChoice = z.strictObject({
  key: z.string().max(100),
  scientificName: Text,
  canonicalName: Text,
  rank: Text,
  status: Text,
  matchType: Text,
  acceptedKey: z.string().max(100),
  acceptedName: Text,
  acceptedRank: Text,
  selectable: z.boolean(),
  qualifiers: z.array(Text),
  note: Text,
});
export const TaxonomyResponse = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  query: ScientificName,
  snapshotId: Id.nullable(),
  state: z.enum(["ready", "needs_review", "unavailable"]),
  source: z.enum(["live", "cache", "bundled", "none"]),
  stale: z.boolean(),
  retrievedAt: z.iso.datetime().nullable(),
  datasetId: z.literal("d7dddbf4-2cf0-4f39-9b2a-bb099caae36c"),
  datasetTitle: Text,
  licenseUrl: SafeUrl,
  matchType: Text,
  choices: z.array(TaxonomyChoice).max(30),
  message: Text,
});
export const AuditResponse = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  events: z.array(
    z.strictObject({
      id: z.number().int(),
      type: Text,
      subjectId: Id,
      detail: z.json(),
    }),
  ),
});
export type ActorData = z.infer<typeof Actor>;
export type ProposalData = z.infer<typeof Proposal>;
export type ExtractionData = z.infer<typeof ExtractionRun>;
export type RevisionInput = z.infer<typeof RevisionRequest>;
export type TaxonomyData = z.infer<typeof TaxonomyResponse>;
export type ImportInput = z.infer<typeof ImportTextRequest>;
