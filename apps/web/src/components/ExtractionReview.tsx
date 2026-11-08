import type {
  ExtractionData,
  ProposalData,
  RevisionInput,
  SpanData,
} from "@recon/contracts";
import { valueLabel } from "./curation-shared";
type Decision = RevisionInput["decisions"][number];
export function ExtractionReview({
  run,
  decisions,
  onDecision,
  onInspect,
  readOnly,
}: {
  run: ExtractionData;
  decisions: Decision[];
  onDecision: (id: string, d: Decision | null) => void;
  onInspect: (s: SpanData) => void;
  readOnly: boolean;
}) {
  return (
    <div className="proposal-list">
      <div
        className={`capability-note ${run.status === "supported" ? "" : "amber-note"}`}
      >
        <strong>
          {run.status === "supported"
            ? "Scoped English extraction"
            : run.status === "unsupported_language"
              ? "Automatic extraction unavailable for this language"
              : "Automatic extraction is not enabled for study/taxonomy text"}
        </strong>
        <p>{run.coverage}</p>
        {run.status !== "supported" ? (
          <p>
            Use exact manual annotation in the source reader. No translation or
            empty “successful” extraction is substituted.
          </p>
        ) : null}
        <details>
          <summary>Vocabulary & limits</summary>
          <p>{run.terms.join(" · ")}</p>
          <p>
            Version: {run.extractorVersion}. Mentions, negation and
            relationships require review. Unrecognized ingredients can be added
            manually.
          </p>
        </details>
      </div>
      {run.proposals.length === 0 && run.status === "supported" ? (
        <p className="empty">
          No covered terms were proposed. Inspect the source and add exact
          manual annotations.
        </p>
      ) : null}
      {run.proposals.map((p) => {
        const decision = decisions.find((d) => d.proposalId === p.id);
        const previous = run.decisions
          .filter((d) => d.proposalId === p.id)
          .at(-1);
        const set = (action: "accept" | "reject") =>
          onDecision(p.id, {
            proposalId: p.id,
            decision: action,
            rationale:
              decision?.rationale ??
              (action === "accept"
                ? "Selected after inspecting this exact source occurrence."
                : "Excluded from this extraction review; source text remains unchanged."),
            ...(decision?.value !== undefined ? { value: decision.value } : {}),
          });
        return (
          <article className="proposal-card" key={p.id} data-proposal-id={p.id}>
            <div className="section-heading">
              <span className="eyebrow">{p.kind}</span>
              <span
                className={`badge ${p.polarity === "negated" || p.context === "mention_only" ? "amber" : ""}`}
              >
                {p.polarity === "negated"
                  ? "Negated / omitted"
                  : p.context === "mention_only"
                    ? "Mention needs context"
                    : "Proposal · review pending"}
              </span>
            </div>
            <button className="quote-button" onClick={() => onInspect(p.span)}>
              “{p.span.exact}” <span aria-hidden="true">↗</span>
            </button>
            <p className="proposal-value">
              {valueLabel(decision?.value ?? p.value)}
            </p>
            <p className="form-hint">{p.note}</p>
            {previous ? (
              <p className="previous-decision">
                Previously{" "}
                {previous.decision === "accept" ? "used" : "rejected"} in r
                {previous.caseRevision}: {previous.rationale}
              </p>
            ) : null}
            <div className="decision-actions">
              <button
                aria-pressed={decision?.decision === "accept"}
                disabled={readOnly}
                onClick={() => set("accept")}
              >
                Use in draft
              </button>
              <button
                aria-pressed={decision?.decision === "reject"}
                disabled={readOnly}
                onClick={() => set("reject")}
              >
                Reject
              </button>
              {decision ? (
                <button
                  disabled={readOnly}
                  onClick={() => onDecision(p.id, null)}
                >
                  Reset
                </button>
              ) : null}
            </div>
            {decision ? (
              <div className="decision-details">
                {decision.decision === "accept" ? (
                  <ProposalValue
                    proposal={p}
                    value={decision.value ?? p.value}
                    onChange={(value) =>
                      onDecision(p.id, { ...decision, value })
                    }
                    disabled={readOnly}
                  />
                ) : null}
                <label>
                  Decision rationale
                  <textarea
                    rows={2}
                    minLength={3}
                    maxLength={1000}
                    value={decision.rationale}
                    disabled={readOnly}
                    onChange={(e) =>
                      onDecision(p.id, {
                        ...decision,
                        rationale: e.target.value,
                      })
                    }
                  />
                </label>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
function ProposalValue({
  proposal,
  value,
  onChange,
  disabled,
}: {
  proposal: ProposalData;
  value: ProposalData["value"];
  onChange: (v: ProposalData["value"]) => void;
  disabled: boolean;
}) {
  if (typeof value === "string")
    return (
      <label>
        Controlled value
        <input
          value={value}
          maxLength={500}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, ProposalData["value"]>;
  return (
    <div className="form-grid">
      {typeof item.relationship === "string" ? (
        <label>
          Equality basis
          <select
            value={String(item.basis ?? "unknown")}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                ...item,
                basis: e.target.value,
                dimension: e.target.value,
              })
            }
          >
            <option value="unknown">Unknown</option>
            <option value="mass">Equal mass</option>
            <option value="volume">Equal volume</option>
            <option value="count">Equal counts</option>
          </select>
        </label>
      ) : (
        <>
          <label>
            {proposal.kind === "temperature"
              ? "Temperature"
              : "Explicit amount"}
            <input
              type="number"
              step="any"
              disabled={disabled}
              value={typeof item.value === "number" ? item.value : ""}
              onChange={(e) =>
                onChange({
                  ...item,
                  value: Number.isFinite(e.target.valueAsNumber)
                    ? e.target.valueAsNumber
                    : null,
                })
              }
            />
          </label>
          <label>
            Unit
            <input
              value={String(item.unit ?? "")}
              disabled={disabled}
              maxLength={40}
              onChange={(e) => onChange({ ...item, unit: e.target.value })}
            />
          </label>
        </>
      )}
    </div>
  );
}
