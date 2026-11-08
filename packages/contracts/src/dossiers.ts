import { z } from "zod";
import {
  Corpus,
  ComparisonPolicy,
  Hash,
  Id,
  BibliographicRecord,
} from "./base.js";
import { AnalysisRecord } from "./scenarios.js";
export const DossierBundleV1 = z.strictObject({
  schemaVersion: z.literal("recon-dossier-v1"),
  engineVersion: z.literal("recon-replay-1.0.0"),
  exportedAt: z.iso.datetime(),
  title: z.string().max(200),
  kind: AnalysisRecord.shape.kind,
  originalAnalysisId: Id,
  originalAnalysisContentHash: Hash,
  scientific: z.strictObject({
    corpus: Corpus,
    policy: ComparisonPolicy,
    request: z.json(),
    nameFacts: z.record(Id, z.string().max(100).nullable()),
    result: z.json(),
  }),
  sources: z.array(
    z.strictObject({
      id: Id,
      textIncluded: z.boolean(),
      reason: z.string(),
      originalTextHash: Hash,
      originalRevisionHash: Hash,
      independentTextVerification: z.boolean(),
    }),
  ),
  limitations: z.array(z.string().max(2000)),
  scientificPayloadHash: Hash,
  scientificResultHash: Hash,
  bundleHash: Hash,
});
export const ReplayReceipt = z.strictObject({
  status: z.literal("reproduced"),
  scientificPayloadHash: Hash,
  scientificResultHash: Hash,
  engineVersion: z.string(),
  sourceTextsVerified: z.number().int(),
  sourceTextsOmitted: z.number().int(),
  warning: z.string(),
});
// AJV must not coerce arbitrary nested JSON through anyOf string/array branches.
// The strict parser and full dossier validator own this untrusted boundary.
export const ImportBundleRequest = z.strictObject({ bundle: z.unknown() });
export const ImportBundlePreview = z.strictObject({
  bundleHash: Hash,
  title: z.string(),
  kind: AnalysisRecord.shape.kind,
  caseCount: z.number().int(),
  assertionCount: z.number().int(),
  omittedSourceCount: z.number().int(),
  receipt: ReplayReceipt,
  warnings: z.array(z.string()),
});
export const BundleImportRecord = z.strictObject({
  id: Id,
  bundleHash: Hash,
  title: z.string(),
  createdAt: z.iso.datetime(),
  receipt: ReplayReceipt,
});
export const BundleImportList = z.strictObject({
  items: z.array(BundleImportRecord),
});
export const ImportedBundleResponse = z.strictObject({
  record: BundleImportRecord,
  bundle: DossierBundleV1,
});
export const ReferenceDownload = z.strictObject({
  items: z.array(BibliographicRecord),
  limitations: z.array(z.string()),
});
export const EvaluationArtifact = z.strictObject({
  id: Id,
  createdAt: z.iso.datetime(),
  manifest: z.json(),
  metrics: z.json(),
  predictions: z.array(z.json()),
  failures: z.array(z.json()),
  timings: z.json(),
  contentHash: Hash,
});
export const EvaluationArtifactList = z.strictObject({
  items: z.array(
    z.strictObject({
      id: Id,
      createdAt: z.iso.datetime(),
      authenticRecords: z.number().int(),
      syntheticRecords: z.number().int(),
      reviewedAuthenticLabels: z.number().int(),
      status: z.string(),
    }),
  ),
});
export type DossierData = z.infer<typeof DossierBundleV1>;
