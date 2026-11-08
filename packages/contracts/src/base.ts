import { z } from "zod";

export const SCHEMA_VERSION = "recon-v1" as const;
export const Id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/);
export const Hash = z.string().regex(/^[a-f0-9]{64}$/);
export const Text = z.string().min(1).max(20000);
export const SafeUrl = z
  .url()
  .refine(
    (s) => ["https:", "http:"].includes(new URL(s).protocol),
    "Only HTTP(S) links are allowed",
  );
export const Review = z.strictObject({
  reviewerType: z.enum(["human", "automated"]).optional(),
  status: z.enum(["pending", "accepted", "rejected"]),
  reviewer: Text,
  qualification: Text,
  reviewedAt: z.iso.datetime(),
  rationale: Text,
});
export const Locator = z.strictObject({
  label: Text,
  page: Text.optional(),
  chapter: Text.optional(),
  xmlPath: Text.optional(),
  canvasUrl: SafeUrl.optional(),
  manuscript: Text.optional(),
});
export const Rights = z.strictObject({
  decision: z.enum(["bundle_allowed", "metadata_only", "blocked", "pending"]),
  license: Text,
  licenseUrl: SafeUrl,
  credit: Text,
  storage: z.boolean(),
  display: z.boolean(),
  redistribution: z.boolean(),
  restrictions: Text,
  verificationUrl: SafeUrl,
  verifiedAt: z.iso.datetime(),
  evidenceFile: Text,
  evidenceSha256: Hash,
});
export const Source = z.strictObject({
  id: Id,
  kind: z.enum([
    "historical_edition",
    "primary_study",
    "user_text",
    "taxonomy_snapshot",
  ]),
  title: Text,
  creators: z.array(Text).min(1),
  work: Text,
  edition: Text,
  translator: Text.nullable(),
  language: Text,
  publicationDate: Text,
  compositionDate: Text,
  identifiers: z.record(z.string(), Text),
  canonicalUrl: SafeUrl,
});
export const SourceRevision = z.strictObject({
  id: Id,
  sourceId: Id,
  revision: z.number().int().positive(),
  retrievedAt: z.iso.datetime(),
  rawFile: Text,
  rawUrl: SafeUrl,
  rawSha256: Hash,
  displayText: z.string().max(1000000),
  textSha256: Hash,
  parser: Text,
  editorialNote: Text,
  rights: Rights,
  locator: Locator,
  contentHash: Hash,
});
export const Span = z
  .strictObject({
    id: Id,
    sourceRevisionId: Id,
    sourceTextSha256: Hash,
    start: z.number().int().nonnegative(),
    end: z.number().int().positive(),
    exact: Text,
    prefix: z.string().max(80),
    suffix: z.string().max(80),
    locator: Locator,
  })
  .refine(
    (s) => s.end > s.start,
    "A span must have a non-empty half-open range",
  );
export const Reference = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("span"), spanId: Id }),
  z.strictObject({
    kind: z.literal("metadata"),
    sourceRevisionId: Id,
    field: Text,
  }),
]);
const AssertionBase = {
  id: Id,
  field: Text,
  label: Text,
  origin: z.enum([
    "human_curated",
    "agent_curated",
    "extractor_proposal",
    "user_hypothesis",
    "rule_derived",
    "provider_metadata",
  ]),
  references: z.array(Reference),
  inputAssertionIds: z.array(Id),
  review: Review,
};
export const recorded = <T extends z.ZodType>(value: T) =>
  z.discriminatedUnion("state", [
    z.strictObject({
      ...AssertionBase,
      state: z.literal("recorded"),
      value,
      rationale: Text,
    }),
    z.strictObject({
      ...AssertionBase,
      state: z.literal("inferred"),
      value,
      rationale: Text,
    }),
    z.strictObject({
      ...AssertionBase,
      state: z.literal("contested"),
      competingAssertionIds: z.array(Id).min(2),
      rationale: Text,
    }),
    z.strictObject({
      ...AssertionBase,
      state: z.literal("unknown"),
      reason: z.enum([
        "not_reported",
        "unreadable",
        "not_reviewed",
        "ambiguous",
      ]),
      rationale: Text,
    }),
    z.strictObject({
      ...AssertionBase,
      state: z.literal("not_applicable"),
      rationale: Text,
    }),
  ]);
export const Assertion = recorded(z.json());
export const QuantityConstraint = z.strictObject({
  id: Id,
  assertionId: Id,
  raw: Text,
  basis: z.enum(["mass", "volume", "count", "unknown"]),
  dimension: Text,
  value: z.number().finite().optional(),
  unit: Text.optional(),
  equalToSlotIds: z.array(Id),
});
export const IngredientSlot = z.strictObject({
  id: Id,
  termAssertionId: Id,
  language: Text,
  kind: z.enum([
    "plant_material",
    "isolated_compound",
    "other_natural_material",
  ]),
  candidateIds: z.array(Id),
  partAssertionId: Id,
  stateAssertionId: Id,
  quantityIds: z.array(Id),
});
export const PreparationStep = z.strictObject({
  id: Id,
  operationAssertionId: Id,
  inputSlotIds: z.array(Id),
  followsStepIds: z.array(Id),
  detailAssertionIds: z.array(Id),
});
export const MaterialPayload = z.strictObject({
  id: Id,
  kind: z.enum([
    "mixture",
    "plant_material",
    "isolated_compound",
    "other_natural_material",
  ]),
  representation: z.enum([
    "historical_record",
    "documented_reconstruction",
    "hypothetical",
  ]),
  label: Text,
  componentSlots: z.array(IngredientSlot),
  quantities: z.array(QuantityConstraint),
  steps: z.array(PreparationStep),
  assertionIds: z.array(Id),
});
export const MaterialVersion = MaterialPayload.extend({
  recordHash: Hash,
  fingerprint: Hash.nullable(),
  fingerprintPayload: z.json().nullable(),
  canonicalization: z.literal("JCS-RFC8785/recon-science-v1"),
});
export const TaxonConcept = z.strictObject({
  supportingSourceRevisionIds: z.array(Id).optional(),
  id: Id,
  authority: Text,
  datasetId: Text,
  snapshotId: Text,
  nameUsageId: Text,
  acceptedUsageId: Text,
  reportedName: Text,
  reportedRank: Text,
  acceptedName: Text,
  acceptedRank: Text,
  qualifiers: z.array(Text),
  sourceRevisionId: Id,
});
export const MappingCandidate = z.strictObject({
  id: Id,
  occurrenceId: Id,
  proposedName: Text,
  taxonConceptId: Id.nullable(),
  supportAssertionIds: z.array(Id).min(1),
  rationale: Text,
  status: z.enum([
    "documented_plausible",
    "inferred",
    "rejected",
    "unresolved",
  ]),
});
export const ScenarioInput = z.strictObject({
  assignments: z.array(z.strictObject({ occurrenceId: Id, candidateId: Id })),
  hypotheticalOverrides: z.array(
    z.strictObject({ field: Text, value: z.json(), rationale: Text }),
  ),
  rationale: Text,
});
export const CaseRevision = z.strictObject({
  id: Id,
  revision: z.number().int().positive(),
  title: Text,
  subtitle: Text,
  kind: z.enum(["recipe", "preparation_mention"]),
  authenticity: z.enum(["authentic", "synthetic_fixture", "user_import"]),
  period: Text,
  sourceRevisionIds: z.array(Id).min(1),
  primarySourceRevisionId: Id,
  originalSourceRevisionId: Id.nullable(),
  materialVersionId: Id,
  assertionIds: z.array(Id),
  historicalUseAssertionIds: z.array(Id),
  evidenceUnitIds: z.array(Id),
  baselineScenarioInput: ScenarioInput,
  review: Review,
  corpusRevision: Id,
  supersedes: Id.nullable(),
  contentHash: Hash,
});
export const Study = z.strictObject({
  id: Id,
  title: Text,
  authors: z.array(Text).min(1),
  year: z.number().int(),
  doi: Text,
  pmcid: Text,
  pmid: Text,
  journal: Text,
  volume: Text,
  sourceRevisionIds: z.array(Id).min(1),
  design: Text,
  familyId: Id,
  correctionStatus: Text,
  review: Review,
});
export const BibliographicRecord = z.strictObject({
  id: Id,
  type: z.enum(["article-journal", "book", "chapter"]),
  title: Text,
  creators: z.array(
    z.strictObject({
      name: Text,
      role: z.enum(["author", "editor", "translator"]),
    }),
  ),
  issued: Text,
  edition: Text,
  identifiers: z.record(z.string(), Text),
  sourceRevisionId: Id,
});
export const EvidenceUnit = z.strictObject({
  id: Id,
  studyId: Id,
  testedMaterialVersionId: Id,
  armLabel: Text,
  contextAssertionIds: z.array(Id).min(1),
  comparatorAssertionId: Id,
  endpointAssertionId: Id,
  outcomeAssertionId: Id,
  supportSpanIds: z.array(Id).min(1),
  review: Review,
});
export const InterpretationGroup = z.strictObject({
  id: Id,
  label: Text,
  alternatives: z
    .array(
      z.strictObject({
        id: Id,
        assignments: ScenarioInput.shape.assignments,
        supportingAssertionIds: z.array(Id).min(1),
      }),
    )
    .min(1)
    .max(4),
  exhaustive: z.boolean(),
  limitation: Text,
  review: Review,
});
export const Scenario = z.strictObject({
  id: Id,
  revision: z.number().int().positive(),
  caseId: Id,
  caseRevision: z.number().int().positive(),
  baseScenarioId: Id.nullable(),
  input: ScenarioInput,
  hash: Hash,
});
export const Dimension = z.enum([
  "identity",
  "composition",
  "part_state",
  "preparation",
  "processing_order",
  "contact",
  "maturation_thermal",
  "quantity",
  "characterization",
]);
export const MaterialVerdict = z.enum([
  "materially_incompatible",
  "insufficient_information",
  "partial_match",
  "comparable_on_recorded_dimensions",
]);
export const DimensionFinding = z.strictObject({
  dimension: Dimension,
  state: z.enum(["match", "mismatch", "unknown", "not_applicable"]),
  reasonCodes: z.array(Text),
  assertionIds: z.array(Id),
  hypothesisIds: z.array(Id),
  sourceReferences: z.array(Reference),
});
export const ComparisonResult = z.strictObject({
  id: Id,
  evidenceUnitId: Id,
  materialComparison: z.strictObject({
    verdict: MaterialVerdict,
    dimensions: z.array(DimensionFinding),
  }),
  contextComparison: z.strictObject({
    verdict: z.enum([
      "different_context",
      "context_not_established",
      "aligned_on_recorded_context",
    ]),
    assertionIds: z.array(Id),
    reasons: z.array(Text),
  }),
  reportedOutcomeAssertionId: Id,
  dependencies: z.array(Id),
});
export const ComparisonPolicy = z.strictObject({
  id: Id,
  version: Text,
  scope: z.literal("full_material"),
  criticalDimensions: z.array(Dimension),
  contextualDimensions: z.array(Dimension),
  reasonCodes: z.array(
    z.strictObject({
      code: Text,
      definition: Text,
      requiredFields: z.array(Text),
    }),
  ),
});
export const AnalysisSnapshot = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: Id,
  caseId: Id,
  caseRevision: z.number().int().positive(),
  corpusRevision: Id,
  policyId: Id,
  policyHash: Hash,
  scenario: ScenarioInput,
  sourceRevisionHashes: z.record(Id, Hash),
  materialVersionIds: z.array(Id),
  evidenceUnitIds: z.array(Id),
  results: z.array(ComparisonResult),
  createdAt: z.iso.datetime(),
  contentHash: Hash,
});
export const Corpus = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  revision: Id,
  corpusHistory: z.array(z.strictObject({ id: Id, hash: Hash })).optional(),
  sources: z.array(Source),
  sourceRevisions: z.array(SourceRevision),
  spans: z.array(Span),
  assertions: z.array(Assertion),
  materials: z.array(MaterialVersion),
  candidates: z.array(MappingCandidate),
  taxa: z.array(TaxonConcept),
  cases: z.array(CaseRevision),
  studies: z.array(Study),
  evidenceUnits: z.array(EvidenceUnit),
  bibliography: z.array(BibliographicRecord),
  interpretationGroups: z.array(InterpretationGroup),
});
export const CaseSummary = CaseRevision.pick({
  id: true,
  revision: true,
  title: true,
  subtitle: true,
  kind: true,
  authenticity: true,
  period: true,
  review: true,
}).extend({
  sourceCount: z.number().int().nonnegative(),
  assertionCount: z.number().int().nonnegative(),
  studyCount: z.number().int().nonnegative(),
  evidenceUnitCount: z.number().int().nonnegative(),
});
export const CaseListResponse = z.strictObject({
  studyCount: z.number().int().nonnegative(),
  sourceRevisionCount: z.number().int().nonnegative(),
  evidenceUnitCount: z.number().int().nonnegative(),
  schemaVersion: z.literal(SCHEMA_VERSION),
  corpusRevision: Id,
  items: z.array(CaseSummary),
  total: z.number().int().nonnegative(),
  offset: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});
export const CaseResponse = z.strictObject({
  taxa: z.array(TaxonConcept).optional(),
  schemaVersion: z.literal(SCHEMA_VERSION),
  selection: z.enum(["latest", "pinned"]),
  case: CaseRevision,
  sources: z.array(Source),
  sourceRevisions: z.array(SourceRevision),
  spans: z.array(Span),
  assertions: z.array(Assertion),
  material: MaterialVersion,
  candidates: z.array(MappingCandidate),
  studies: z.array(Study),
  evidenceUnits: z.array(EvidenceUnit),
});
export const SourceResponse = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  source: Source,
  revision: SourceRevision,
  spans: z.array(Span),
  contentAvailable: z.boolean(),
});
export const HealthResponse = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  status: z.literal("ok"),
  runtime: Text,
  migration: z.number().int(),
  corpusRevision: Id,
  mode: z.enum(["local_read_only", "local_editor", "hosted_workspace"]),
  workspaceStorage: z.enum(["persistent", "temporary"]).optional(),
  capabilities: z.strictObject({
    sourceReader: z.literal(true),
    editing: z.boolean(),
    comparison: z.boolean(),
    liveProviders: z.boolean(),
  }),
});
export const ErrorResponse = z.strictObject({
  error: z.strictObject({
    code: Text,
    message: Text,
    fieldErrors: z.array(Text).optional(),
    retryable: z.boolean(),
    requestId: Text,
  }),
});
export type CorpusData = z.infer<typeof Corpus>;
export type SourceRevisionData = z.infer<typeof SourceRevision>;
export type SpanData = z.infer<typeof Span>;
export type AssertionData = z.infer<typeof Assertion>;
export type CaseData = z.infer<typeof CaseResponse>;
export type CaseListData = z.infer<typeof CaseListResponse>;

// Frozen envelopes for later phases. No corresponding routes or results are
// exposed until their implementations and verification gates pass.
export const DependencyGraph = z.strictObject({
  nodes: z.array(
    z.strictObject({
      id: Id,
      kind: z.enum([
        "assertion",
        "scenario_choice",
        "policy_field",
        "comparison",
        "summary",
      ]),
    }),
  ),
  edges: z.array(z.strictObject({ from: Id, to: Id })),
});
export const ScenarioDiff = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  beforeHash: Hash,
  afterHash: Hash,
  changed: z.array(
    z.strictObject({
      resultId: Id,
      before: ComparisonResult,
      after: ComparisonResult,
      changedDimensions: z.array(Dimension),
    }),
  ),
  recomputedUnchangedIds: z.array(Id),
  unaffectedIds: z.array(Id),
  fullRecomputeFallback: z.boolean(),
});
export const RobustnessResult = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  caseId: Id,
  caseRevision: z.number().int().positive(),
  policyId: Id,
  groupIds: z.array(Id).max(4),
  worldCount: z.number().int().min(1).max(64),
  exhaustiveWithinDocumentedDomain: z.literal(true),
  candidateListExhaustive: z.boolean(),
  domainLimitation: Text,
  worlds: z
    .array(
      z.strictObject({
        id: Id,
        assignments: ScenarioInput.shape.assignments,
        results: z.array(ComparisonResult).max(50),
      }),
    )
    .min(1)
    .max(64),
  units: z.array(
    z.strictObject({
      evidenceUnitId: Id,
      status: z.enum([
        "robust_within_domain",
        "interpretation_dependent",
        "mismatched_throughout_domain",
        "undetermined",
      ]),
      comparableWorldCount: z.number().int().min(0).max(64),
      verdictCounts: z.record(MaterialVerdict, z.number().int().nonnegative()),
    }),
  ),
});
export const ClarificationResult = z.strictObject({
  target: z.enum(["material_verdict_vector", "named_dimension_vector"]),
  targetDimension: Dimension.nullable(),
  inclusionMinimalSufficientSets: z.array(z.array(Id).max(4)),
  minimumCardinality: z.number().int().min(0).max(4),
  singleGroupEffects: z.array(
    z.strictObject({
      groupId: Id,
      independentlyVariable: z.boolean(),
      changedResultIds: z.array(Id),
      rationale: Text,
    }),
  ),
  missingDocumentation: z.array(
    z.strictObject({
      field: Text,
      reason: Text,
      sourceReferences: z.array(Reference),
      affectedResultIds: z.array(Id),
      dependencyCount: z.number().int().nonnegative(),
    }),
  ),
});
export const EvaluationManifest = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: Id,
  corpusRevision: Id,
  policyId: Id,
  createdAt: z.iso.datetime(),
  split: z.enum(["development", "held_out_family", "synthetic_metamorphic"]),
  familyIds: z.array(Id),
  frozenBeforeRun: z.boolean(),
  goldStatus: z.enum([
    "team_curated",
    "independently_reviewed",
    "synthetic_known_relation",
  ]),
  reviewerRecords: z.array(Review),
  baselines: z.array(
    z.enum(["taxon_only", "preparation_blind", "all_abstain", "full_audit"]),
  ),
  examples: z.array(
    z.strictObject({
      id: Id,
      caseId: Id,
      caseRevision: z.number().int().positive(),
      scenario: ScenarioInput,
      evidenceUnitId: Id,
      expectedVerdict: MaterialVerdict.nullable(),
      expectedDimensions: z.array(DimensionFinding),
      rationale: Text,
      sourceReferences: z.array(Reference),
      review: Review,
    }),
  ),
});
export const ExportBundle = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  bundleVersion: z.literal(1),
  canonicalization: z.literal("JCS-RFC8785/recon-science-v1"),
  snapshot: AnalysisSnapshot,
  corpus: Corpus,
  policy: ComparisonPolicy,
  dependencyGraph: DependencyGraph,
  robustness: RobustnessResult.nullable(),
  clarification: ClarificationResult.nullable(),
  omittedSourceContent: z.array(
    z.strictObject({ sourceRevisionId: Id, reason: Text, textSha256: Hash }),
  ),
  bundleHash: Hash,
});
