import type {
  ActorData,
  AssertionData,
  CaseData,
  RevisionInput,
  SpanData,
} from "@recon/contracts";
export const DEFAULT_ACTOR: ActorData = {
  name: "Local researcher",
  qualification: "Draft exploration; no independent reviewer assigned",
  mode: "draft",
};
export type Draft = Omit<
  RevisionInput,
  "requestId" | "actor" | "expectedRevision" | "rationale"
>;
export const emptyDraft = (data: CaseData): Draft => ({
  decisions: [],
  manualAnnotations: [],
  fieldEdits: [],
  candidateEdits: [],
  stepEdits: [],
  quantityEdits: [],
  assignments: data.case.baselineScenarioInput.assignments,
  assignmentRationale: data.case.baselineScenarioInput.rationale,
});
export function valueLabel(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "value" in value && "unit" in value)
    return `${value.value} ${value.unit}${value.unit === "day" && value.value !== 1 ? "s" : ""}`;
  if (value && typeof value === "object" && "relationship" in value)
    return `Equal quantities · ${"basis" in value ? value.basis : "unknown"} basis`;
  return JSON.stringify(value);
}
export function assertionLabel(a?: AssertionData): string {
  if (!a) return "Unavailable";
  return a.state === "unknown"
    ? `Unknown · ${a.reason.replaceAll("_", " ")}`
    : a.state === "not_applicable"
      ? "Not applicable"
      : a.state === "contested"
        ? "Contested"
        : valueLabel(a.value);
}
export function ActorFields({
  actor,
  onChange,
}: {
  actor: ActorData;
  onChange: (a: ActorData) => void;
}) {
  return (
    <fieldset className="actor-fields">
      <legend>Review record</legend>
      <div className="form-grid">
        <label>
          Recorded by
          <input
            value={actor.name}
            maxLength={100}
            onChange={(e) => onChange({ ...actor, name: e.target.value })}
          />
        </label>
        <label>
          Role / qualification
          <input
            value={actor.qualification}
            maxLength={300}
            onChange={(e) =>
              onChange({ ...actor, qualification: e.target.value })
            }
          />
        </label>
      </div>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={actor.mode === "source_checked"}
          onChange={(e) =>
            onChange({
              ...actor,
              mode: e.target.checked ? "source_checked" : "draft",
            })
          }
        />{" "}
        I personally checked the individual source claims being changed.
      </label>
      <p className="form-hint">
        Default saves remain drafts. A personal source check is an editorial
        judgment, not expert validation of the case or corpus.
      </p>
    </fieldset>
  );
}
export function SpanOptions({ spans }: { spans: SpanData[] }) {
  return (
    <>
      <option value="">Select a supporting source passage</option>
      {spans.map((s) => (
        <option value={s.id} key={s.id}>
          {s.locator.label} · {s.exact.slice(0, 70)}
        </option>
      ))}
    </>
  );
}
export function StateTag({
  assertion,
}: {
  assertion: AssertionData | undefined;
}) {
  return (
    <span
      className={`badge ${!assertion || assertion.state === "unknown" || assertion.review.status !== "accepted" ? "amber" : "teal"}`}
    >
      {assertion?.review.status === "accepted"
        ? "Individually source-checked"
        : "Draft · review pending"}
    </span>
  );
}
