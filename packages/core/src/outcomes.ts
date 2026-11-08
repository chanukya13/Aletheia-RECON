import {
  OutcomeContrast,
  OutcomeObservation,
  type OutcomeObservationData,
} from "@recon/contracts";
import { scientificHash } from "./integrity.js";

export function contrastOutcomes(
  leftInput: OutcomeObservationData,
  rightInput: OutcomeObservationData,
) {
  const left = OutcomeObservation.parse(leftInput),
    right = OutcomeObservation.parse(rightInput),
    reasons: string[] = [];
  if (left.id === right.id || left.columnLabel === right.columnLabel)
    reasons.push("Choose two distinct measured arms.");
  const fields = [
    "sourceRevisionId",
    "rawSourceHash",
    "studyId",
    "organism",
    "strain",
    "assay",
    "endpoint",
    "statistic",
    "unit",
  ] as const;
  for (const field of fields)
    if (
      left[field] !== right[field] ||
      !left[field] ||
      left[field] === "unreported"
    )
      reasons.push(
        `Incompatible or unreported ${field} across the selected observations.`,
      );
  if (left.qualifier !== "exact" || right.qualifier !== "exact")
    reasons.push(
      "A value is missing or censored; an exact ratio is unavailable.",
    );
  if (
    left.value === null ||
    right.value === null ||
    left.value <= 0 ||
    right.value <= 0
  )
    reasons.push(
      "Both observations must have positive reported numeric values.",
    );
  const ratio = reasons.length ? null : left.value! / right.value!;
  if (ratio !== null && !Number.isFinite(ratio))
    throw new Error("NONFINITE_OUTCOME_RATIO");
  const body = {
    version: "recon-outcomes-1" as const,
    left,
    right,
    status: reasons.length ? ("unavailable" as const) : ("available" as const),
    ratio,
    reasons,
    inputHash: scientificHash({ left, right }),
  };
  return OutcomeContrast.parse({ ...body, resultHash: scientificHash(body) });
}
