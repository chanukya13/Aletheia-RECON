import { z } from "zod";
import {
  Assertion,
  CaseRevision,
  ClarificationResult,
  ComparisonResult,
  Dimension,
  DimensionFinding,
  Hash,
  Id,
  MaterialVersion,
  ScenarioDiff,
  ScenarioInput,
  Source,
  SourceRevision,
  Span,
  RobustnessResult,
} from "./base.js";
import { Actor } from "./curation.js";
export const PinnedContext = z.strictObject({
  caseRevision: z.number().int().positive(),
  caseHash: Hash,
  corpusRevision: Id,
  policyHash: Hash,
  selection: z.enum(["latest", "pinned"]).default("latest"),
});
export const BoundedScenario = ScenarioInput.extend({
  assignments: ScenarioInput.shape.assignments.max(50),
  hypotheticalOverrides: z
    .array(
      z.strictObject({
        field: Id,
        value: z.json(),
        rationale: z.string().trim().min(3).max(1000),
      }),
    )
    .max(20),
  rationale: z.string().trim().min(3).max(1000),
});
export const ScenarioKind = z.enum([
  "baseline",
  "source_interpretation",
  "hypothetical",
]);
export const InterpretationDomain = z.strictObject({
  context: PinnedContext,
  groups: z
    .array(
      z.strictObject({
        id: Id,
        occurrenceId: Id,
        label: z.string(),
        exhaustive: z.literal(false),
        alternatives: z
          .array(
            z.strictObject({
              id: Id,
              label: z.string(),
              assignments: ScenarioInput.shape.assignments,
              supportAssertionIds: z.array(Id),
              eligibleReviewed: z.boolean(),
              reviewState: z.enum(["reviewed", "draft"]),
            }),
          )
          .max(4),
      }),
    )
    .max(50),
  excludedCandidateIds: z.array(Id),
  limitation: z.string(),
});
export const Selection = z.strictObject({
  groupId: Id,
  alternativeIds: z.array(Id).min(1).max(4),
});
export const DomainConstraint = z.strictObject({
  forbidden: z
    .array(z.strictObject({ groupId: Id, alternativeId: Id }))
    .min(1)
    .max(4),
  rationale: z.string().trim().min(3).max(1000),
});
export const AuditRequest = z.strictObject({
  context: PinnedContext,
  mode: z.enum(["reviewed", "draft_exploration"]),
  scenario: BoundedScenario,
  selections: z.array(Selection).max(4),
  constraints: z.array(DomainConstraint).max(16),
  subsetRationale: z.string().max(1000),
  evidenceUnitIds: z.array(Id).min(1).max(50),
  target: z.enum([
    "material_verdict_vector",
    "named_dimension_vector",
    "conditional_identity_vector",
  ]),
  targetDimension: Dimension.nullable(),
});
export const ProvenanceClosure = z.strictObject({
  assertions: z.array(Assertion),
  spans: z.array(Span),
  sourceRevisions: z.array(SourceRevision),
  sources: z.array(Source),
});
export const Correspondence = z.strictObject({
  evidenceUnitId: Id,
  occurrenceId: Id,
  candidateId: Id,
  proposedName: z.string(),
  state: z.enum(["corresponds", "differs", "not_established"]),
  assertionIds: z.array(Id),
  limitation: z.string(),
});
export const ScenarioEvaluation = ProvenanceClosure.extend({
  schemaVersion: z.literal("recon-v1"),
  context: PinnedContext,
  case: CaseRevision,
  scenario: BoundedScenario,
  scenarioHash: Hash,
  kind: ScenarioKind,
  results: z.array(ComparisonResult),
  correspondence: z.array(Correspondence),
  runHash: Hash,
  warning: z.string(),
});
export const DomainPreview = z.strictObject({
  context: PinnedContext,
  requestHash: Hash,
  worldCount: z.number().int().min(1).max(64),
  rawWorldCount: z.number().int().min(1).max(256),
  excludedAlternatives: z.array(Id),
  mode: z.enum(["reviewed", "draft_exploration"]),
  limitation: z.string(),
});
export const ScenarioAuditResponse = ProvenanceClosure.extend({
  context: PinnedContext,
  requestHash: Hash,
  runHash: Hash,
  mode: z.enum(["reviewed", "draft_exploration"]),
  preview: DomainPreview,
  audit: RobustnessResult.extend({
    exhaustiveWithinDocumentedDomain: z.boolean(),
  }),
  clarification: ClarificationResult.extend({
    target: z.enum([
      "material_verdict_vector",
      "named_dimension_vector",
      "conditional_identity_vector",
    ]),
  }),
  correspondence: z.array(
    z.strictObject({ worldId: Id, items: z.array(Correspondence) }),
  ),
  studyCoverage: z.array(
    z.strictObject({
      studyId: Id,
      worldsWithAnyCorrespondence: z.number().int(),
      fixedCorrespondingArmIds: z.array(Id),
      worldsWithAnyComparableMaterial: z.number().int(),
      fixedComparableArmIds: z.array(Id),
    }),
  ),
  elapsedMs: z.number().nonnegative(),
});
export const ScenarioSaveRequest = z.strictObject({
  requestId: Id,
  actor: Actor,
  context: PinnedContext,
  name: z.string().trim().min(2).max(100),
  scenario: BoundedScenario,
  id: Id.optional(),
  expectedRevision: z.number().int().nonnegative(),
});
export const ScenarioRecord = z.strictObject({
  id: Id,
  revision: z.number().int().positive(),
  caseId: Id,
  context: PinnedContext,
  name: z.string(),
  scenario: BoundedScenario,
  scenarioHash: Hash,
  kind: ScenarioKind,
  createdAt: z.string(),
  actor: Actor,
  contentHash: Hash,
});
export const ScenarioList = z.strictObject({ items: z.array(ScenarioRecord) });
export const ScenarioEvaluateRequest = z.strictObject({
  context: PinnedContext,
  scenario: BoundedScenario,
  evidenceUnitIds: z.array(Id).min(1).max(50),
});
export const ScenarioDiffRequest = z.strictObject({
  context: PinnedContext,
  before: BoundedScenario,
  after: BoundedScenario,
  evidenceUnitIds: z.array(Id).min(1).max(50),
});
export const DiffResponse = ProvenanceClosure.extend({
  context: PinnedContext,
  runHash: Hash,
  diff: ScenarioDiff,
  kind: ScenarioKind,
  changedCorrespondenceUnitIds: z.array(Id),
  beforeCorrespondence: z.array(Correspondence),
  afterCorrespondence: z.array(Correspondence),
  dependencyEdges: z.array(z.strictObject({ from: Id, to: Id })),
  summary: z.string(),
});
export const MaterialVersionComparisonRequest = z.strictObject({
  policyHash: Hash,
  left: z.strictObject({
    materialVersionId: Id,
    caseId: Id.optional(),
    caseRevision: z.number().int().positive().optional(),
    assignments: ScenarioInput.shape.assignments.max(50),
  }),
  right: z.strictObject({
    materialVersionId: Id,
    caseId: Id.optional(),
    caseRevision: z.number().int().positive().optional(),
    assignments: ScenarioInput.shape.assignments.max(50),
  }),
});
export const MaterialComparison = ProvenanceClosure.extend({
  scope: z.literal("material_only"),
  policyHash: Hash,
  runHash: Hash,
  left: MaterialVersion,
  right: MaterialVersion,
  leftAssertionIds: z.array(Id),
  rightAssertionIds: z.array(Id),
  verdict: ComparisonResult.shape.materialComparison.shape.verdict,
  dimensions: z.array(DimensionFinding),
  warning: z.string(),
});
export const MaterialList = z.strictObject({
  items: z.array(
    z.strictObject({
      material: MaterialVersion,
      caseId: Id.nullable(),
      caseRevision: z.number().int().positive().nullable(),
      studyIds: z.array(Id),
    }),
  ),
  policyHash: Hash,
});
export const SaveAnalysis = z.strictObject({
  requestId: Id,
  runHash: Hash,
  name: z.string().trim().min(2).max(100),
});
export const AnalysisRecord = z.strictObject({
  id: Id,
  name: z.string(),
  kind: z.enum(["scenario", "diff", "robustness", "material_only"]),
  runHash: Hash,
  createdAt: z.string(),
  context: PinnedContext.nullable(),
  payload: z.json(),
  inputs: z.json(),
  contentHash: Hash,
});
export const AnalysisList = z.strictObject({
  items: z.array(AnalysisRecord.omit({ payload: true, inputs: true })),
});
export type ScenarioInputData = z.infer<typeof BoundedScenario>;
export type DomainData = z.infer<typeof InterpretationDomain>;
export type AuditInput = z.infer<typeof AuditRequest>;
export type CorrespondenceData = z.infer<typeof Correspondence>;
