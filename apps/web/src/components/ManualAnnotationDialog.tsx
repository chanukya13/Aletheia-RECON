import { useState } from "react";
import type {
  CaseData,
  RevisionInput,
  SourceRevisionData,
} from "@recon/contracts";
import type { InspectedSelection } from "../adapters/SourceAnnotationAdapter";
import { Dialog } from "./Dialog";
import { assertionLabel } from "./curation-shared";
type Manual = RevisionInput["manualAnnotations"][number];
export function ManualAnnotationDialog({
  data,
  revision,
  selection,
  onAdd,
  onClose,
}: {
  data: CaseData;
  revision: SourceRevisionData;
  selection: InspectedSelection;
  onAdd: (a: Manual) => void;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<Manual["kind"]>("ingredient"),
    [value, setValue] = useState(selection.exact),
    [amount, setAmount] = useState(""),
    [unit, setUnit] = useState(""),
    [basis, setBasis] = useState("unknown"),
    [target, setTarget] = useState(""),
    [step, setStep] = useState(""),
    [interpretation, setInterpretation] = useState<"recorded" | "inferred">(
      "recorded",
    ),
    [rationale, setRationale] = useState(""),
    [error, setError] = useState("");
  const structured = ["quantity", "duration", "temperature"].includes(kind);
  return (
    <Dialog title="Annotate exact source text" onClose={onClose}>
      <form
        className="curation-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (
            structured &&
            (!amount.trim() || !Number.isFinite(Number(amount)) || !unit.trim())
          ) {
            setError(
              "Enter an explicit numeric amount and unit; do not use zero for unreported quantities.",
            );
            return;
          }
          if (["part", "state", "quantity"].includes(kind) && !target) {
            setError(
              "Select the ingredient occurrence this annotation describes.",
            );
            return;
          }
          onAdd({
            sourceRevisionId: revision.id,
            sourceTextSha256: revision.textSha256,
            start: selection.start,
            end: selection.end,
            exact: selection.exact,
            kind,
            value: structured
              ? {
                  value: Number(amount),
                  unit,
                  basis,
                  dimension:
                    kind === "duration"
                      ? "time"
                      : kind === "temperature"
                        ? "temperature"
                        : basis,
                }
              : value,
            ...(target ? { targetOccurrenceId: target } : {}),
            ...(step ? { targetStepId: step } : {}),
            interpretation,
            rationale,
          });
        }}
      >
        <blockquote className="manual-quote">{selection.exact}</blockquote>
        <p className="mono">
          UTF-16 [{selection.start}, {selection.end}) · {revision.id}
        </p>
        <label>
          Annotation kind
          <select
            value={kind}
            onChange={(e) => {
              const kind = e.target.value as Manual["kind"];
              setKind(kind);
              setUnit(
                kind === "duration"
                  ? "day"
                  : kind === "temperature"
                    ? "°C"
                    : "",
              );
            }}
          >
            <option value="ingredient">Ingredient mention</option>
            <option value="operation">Preparation operation</option>
            <option value="part">Plant / material part</option>
            <option value="state">Fresh, dried or processed state</option>
            <option value="quantity">Ingredient quantity</option>
            <option value="duration">Duration</option>
            <option value="temperature">Temperature</option>
            <option value="contact">Contact / vessel material</option>
            <option value="matrix">Solvent / matrix</option>
          </select>
        </label>
        {structured ? (
          <div className="form-grid">
            <label>
              Explicit amount
              <input
                type="number"
                required
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label>
              Unit
              <input
                required
                value={unit}
                maxLength={40}
                onChange={(e) => setUnit(e.target.value)}
              />
            </label>
            <label>
              Quantity basis
              <select value={basis} onChange={(e) => setBasis(e.target.value)}>
                <option value="unknown">Unknown basis</option>
                <option value="mass">Mass</option>
                <option value="volume">Volume</option>
                <option value="count">Count</option>
              </select>
            </label>
          </div>
        ) : (
          <label>
            Recorded value / controlled interpretation
            <input
              value={value}
              required
              maxLength={500}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
        )}
        {["part", "state", "quantity"].includes(kind) ? (
          <label>
            Ingredient occurrence
            <select
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">Select ingredient</option>
              {data.material.componentSlots.map((s) => (
                <option value={s.id} key={s.id}>
                  {assertionLabel(
                    data.assertions.find((a) => a.id === s.termAssertionId),
                  )}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {["duration", "temperature", "contact", "matrix"].includes(kind) ? (
          <label>
            Associated step (optional)
            <select value={step} onChange={(e) => setStep(e.target.value)}>
              <option value="">Keep as unassigned material detail</option>
              {data.material.steps.map((s) => (
                <option value={s.id} key={s.id}>
                  {assertionLabel(
                    data.assertions.find(
                      (a) => a.id === s.operationAssertionId,
                    ),
                  )}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label>
          Claim type
          <select
            value={interpretation}
            onChange={(e) =>
              setInterpretation(e.target.value as typeof interpretation)
            }
          >
            <option value="recorded">Recorded wording</option>
            <option value="inferred">
              Explicit interpretation / inference
            </option>
          </select>
        </label>
        <p className="form-hint">
          A value differing from the selected wording is labeled inferred. No
          modern taxon is generated from a historical word.
        </p>
        <label>
          Rationale
          <textarea
            required
            minLength={3}
            maxLength={1000}
            rows={2}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
          />
        </label>
        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : null}
        <button className="primary-button">Add annotation to draft</button>
      </form>
    </Dialog>
  );
}
export function SpanSelector({
  revision,
  onSelect,
  disabled = false,
}: {
  revision: SourceRevisionData;
  onSelect: (s: InspectedSelection) => void;
  disabled?: boolean;
}) {
  const [quote, setQuote] = useState(""),
    [occurrence, setOccurrence] = useState(0);
  const positions: number[] = [];
  if (quote) {
    let at = 0;
    while (positions.length < 100) {
      const found = revision.displayText.indexOf(quote, at);
      if (found < 0) break;
      positions.push(found);
      at = found + Math.max(1, quote.length);
    }
  }
  const selected =
    positions[Math.min(occurrence, Math.max(0, positions.length - 1))];
  return (
    <details className="span-selector">
      <summary>Locate exact text with the keyboard</summary>
      <label>
        Exact text to annotate
        <input
          value={quote}
          disabled={disabled}
          onChange={(e) => {
            setQuote(e.target.value);
            setOccurrence(0);
          }}
          maxLength={4000}
        />
      </label>
      {positions.length > 1 ? (
        <label>
          Occurrence
          <select
            value={occurrence}
            onChange={(e) => setOccurrence(Number(e.target.value))}
          >
            {positions.map((p, i) => (
              <option key={p} value={i}>
                {i + 1} · {revision.displayText.slice(Math.max(0, p - 24), p)}[
                {quote}]
                {revision.displayText.slice(
                  p + quote.length,
                  p + quote.length + 24,
                )}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <p className="form-hint">
        {quote
          ? positions.length
            ? `${positions.length} exact occurrence${positions.length === 1 ? "" : "s"} found. Accents and case are preserved.`
            : "Exact text not found. Match case, accents and spacing."
          : "Select text in the reader, or enter an exact phrase here."}
      </p>
      <button
        type="button"
        className="secondary-button"
        disabled={disabled || selected === undefined}
        onClick={() => {
          if (selected !== undefined)
            onSelect({
              start: selected,
              end: selected + quote.length,
              exact: quote,
            });
        }}
      >
        Locate and annotate
      </button>
    </details>
  );
}
