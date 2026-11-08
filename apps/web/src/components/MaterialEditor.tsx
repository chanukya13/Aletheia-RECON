import { useState } from "react";
import type { CaseData, RevisionInput, SpanData } from "@recon/contracts";
import {
  assertionLabel,
  SpanOptions,
  StateTag,
  type Draft,
} from "./curation-shared";
type Field = RevisionInput["fieldEdits"][number];
export function IngredientTable({
  data,
  draft,
  onChange,
  onCandidate,
  onInspect,
  readOnly,
}: {
  data: CaseData;
  draft: Draft;
  onChange: (d: Draft) => void;
  onCandidate: (
    occurrence: string,
    existing?: CaseData["candidates"][number],
  ) => void;
  onInspect: (s: SpanData) => void;
  readOnly: boolean;
}) {
  const assertion = (id: string) => data.assertions.find((a) => a.id === id);
  return (
    <section className="ingredient-list">
      <div className="editor-section-intro">
        <h3>Ingredient occurrences</h3>
        <p>
          Recorded words stay separate from botanical interpretations. Unknown
          parts, states and quantities remain explicit.
        </p>
      </div>
      {data.material.componentSlots.length === 0 ? (
        <p className="empty">
          No ingredient occurrences have been saved yet. Review proposals or
          manually annotate the source, then save a revision.
        </p>
      ) : null}
      {data.material.componentSlots.map((slot) => {
        const term = assertion(slot.termAssertionId);
        const candidates = data.candidates.filter((c) =>
          slot.candidateIds.includes(c.id),
        );
        const assignment = draft.assignments.find(
          (a) => a.occurrenceId === slot.id,
        );
        const spanRef = term?.references.find((r) => r.kind === "span");
        const span =
          spanRef?.kind === "span"
            ? data.spans.find((s) => s.id === spanRef.spanId)
            : null;
        return (
          <article className="ingredient-card" key={slot.id}>
            <div className="section-heading">
              <h3>{assertionLabel(term)}</h3>
              <StateTag assertion={term} />
            </div>
            <p className="mono">
              {slot.id} · {slot.language} · {slot.kind.replaceAll("_", " ")}
            </p>
            {span ? (
              <button className="text-button" onClick={() => onInspect(span)}>
                Locate source occurrence ↗
              </button>
            ) : null}
            <div className="ingredient-facts">
              <div>
                <span>Part</span>
                <strong>
                  {assertionLabel(assertion(slot.partAssertionId))}
                </strong>
              </div>
              <div>
                <span>Material state</span>
                <strong>
                  {assertionLabel(assertion(slot.stateAssertionId))}
                </strong>
              </div>
            </div>
            <UnknownField
              slotId={slot.id}
              plant={slot.kind === "plant_material"}
              data={data}
              edits={draft.fieldEdits}
              onEdit={(edit) =>
                onChange({
                  ...draft,
                  fieldEdits: draft.fieldEdits
                    .filter(
                      (e) =>
                        !(e.occurrenceId === slot.id && e.field === edit.field),
                    )
                    .concat(edit),
                })
              }
              readOnly={readOnly}
            />
            <fieldset className="identity-options">
              <legend>Identity interpretation</legend>
              <label className="radio-label">
                <input
                  type="radio"
                  name={`identity-${slot.id}`}
                  checked={!assignment}
                  disabled={readOnly}
                  onChange={() =>
                    onChange({
                      ...draft,
                      assignments: draft.assignments.filter(
                        (a) => a.occurrenceId !== slot.id,
                      ),
                    })
                  }
                />{" "}
                Keep identity unresolved
              </label>
              {candidates.map((candidate) => {
                const taxon = data.taxa?.find(
                  (t) => t.id === candidate.taxonConceptId,
                );
                return (
                  <div className="identity-option" key={candidate.id}>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name={`identity-${slot.id}`}
                        value={candidate.id}
                        checked={assignment?.candidateId === candidate.id}
                        disabled={readOnly || candidate.status === "rejected"}
                        onChange={() =>
                          onChange({
                            ...draft,
                            assignments: draft.assignments
                              .filter((a) => a.occurrenceId !== slot.id)
                              .concat({
                                occurrenceId: slot.id,
                                candidateId: candidate.id,
                              }),
                          })
                        }
                      />
                      <span>
                        <strong>{candidate.proposedName}</strong>
                        <small>
                          {candidate.status.replaceAll("_", " ")}
                          {taxon
                            ? ` · GBIF ${taxon.nameUsageId}`
                            : " · taxonomy not normalized"}
                        </small>
                      </span>
                    </label>
                    <p className="form-hint">{candidate.rationale}</p>
                    {taxon ? (
                      <p className="taxon-preserved">
                        Reported: {taxon.reportedName} ({taxon.reportedRank})
                        <br />
                        Accepted: {taxon.acceptedName} ({taxon.acceptedRank})
                        <br />
                        <span>
                          Original qualifiers retained. This does not establish
                          historical identity.
                        </span>
                      </p>
                    ) : null}
                    <div className="candidate-actions">
                      <button
                        className="text-button"
                        disabled={readOnly}
                        onClick={() => onCandidate(slot.id, candidate)}
                      >
                        Inspect / normalize name
                      </button>
                      <button
                        className="text-button"
                        onClick={() => {
                          const a = data.assertions.find((a) =>
                            candidate.supportAssertionIds.includes(a.id),
                          );
                          const r = a?.references.find(
                            (r) => r.kind === "span",
                          );
                          if (r?.kind === "span") {
                            const s = data.spans.find((s) => s.id === r.spanId);
                            if (s) onInspect(s);
                          }
                        }}
                      >
                        Locate identification basis ↗
                      </button>
                    </div>
                  </div>
                );
              })}
            </fieldset>
            <button
              className="secondary-button"
              disabled={readOnly}
              onClick={() => onCandidate(slot.id)}
            >
              Add source-backed candidate
            </button>
          </article>
        );
      })}
      {draft.candidateEdits.length ? (
        <div className="draft-queue">
          <strong>
            {draft.candidateEdits.length} candidate addition(s) staged
          </strong>
          {draft.candidateEdits.map((c, i) => (
            <p key={i}>
              {c.proposedName} · {c.status.replaceAll("_", " ")}{" "}
              <button
                className="text-button"
                onClick={() =>
                  onChange({
                    ...draft,
                    candidateEdits: draft.candidateEdits.filter(
                      (_, j) => j !== i,
                    ),
                  })
                }
              >
                Remove
              </button>
            </p>
          ))}
          <p className="form-hint">
            Save first to give new candidates immutable IDs; then select an
            interpretation if needed.
          </p>
        </div>
      ) : null}
      <label className="assumption-rationale">
        Interpretation rationale
        <textarea
          rows={3}
          value={draft.assignmentRationale}
          maxLength={1000}
          disabled={readOnly}
          onChange={(e) =>
            onChange({ ...draft, assignmentRationale: e.target.value })
          }
        />
      </label>
      <p className="form-hint">
        Selections are explicit scenario assumptions. They do not replace
        unresolved identities in the historical record.
      </p>
    </section>
  );
}
function UnknownField({
  slotId,
  plant,
  data,
  edits,
  onEdit,
  readOnly,
}: {
  slotId: string;
  plant: boolean;
  data: CaseData;
  edits: Field[];
  onEdit: (e: Field) => void;
  readOnly: boolean;
}) {
  const [field, setField] = useState<"part" | "state">("part");
  const existing = edits.find(
    (e) => e.occurrenceId === slotId && e.field === field,
  );
  const current: Field = existing ?? {
    occurrenceId: slotId,
    field,
    state: "unknown",
    reason: "not_reported",
    rationale: "This field is not established by the selected source record.",
  };
  const change = (patch: Partial<Field>) => onEdit({ ...current, ...patch });
  return (
    <details className="field-editor">
      <summary>
        Edit part / material state{existing ? " · draft change" : ""}
      </summary>
      <label>
        Field
        <select
          value={field}
          disabled={readOnly}
          onChange={(e) => setField(e.target.value as typeof field)}
        >
          <option value="part">Part / organ</option>
          <option value="state">Fresh, dried or processed state</option>
        </select>
      </label>
      <label>
        Documentation state
        <select
          value={current.state}
          disabled={readOnly}
          onChange={(e) => change({ state: e.target.value as Field["state"] })}
        >
          <option value="unknown">Explicit unknown</option>
          <option value="recorded">Recorded value</option>
          <option value="inferred">Inferred interpretation</option>
          {!plant ? (
            <option value="not_applicable">
              Not applicable (non-plant material only)
            </option>
          ) : null}
        </select>
      </label>
      {current.state === "unknown" ? (
        <label>
          Unknown reason
          <select
            value={current.reason ?? "not_reported"}
            disabled={readOnly}
            onChange={(e) =>
              change({ reason: e.target.value as Field["reason"] })
            }
          >
            <option value="not_reported">Not reported</option>
            <option value="ambiguous">Ambiguous</option>
            <option value="unreadable">Unreadable</option>
            <option value="not_reviewed">Not reviewed</option>
          </select>
        </label>
      ) : current.state === "not_applicable" ? null : (
        <>
          <label>
            Field value
            <input
              value={current.value ?? ""}
              maxLength={200}
              disabled={readOnly}
              onChange={(e) => change({ value: e.target.value })}
            />
          </label>
          <label>
            Supporting span
            <select
              value={current.supportingSpanId ?? ""}
              disabled={readOnly}
              onChange={(e) => change({ supportingSpanId: e.target.value })}
            >
              <SpanOptions spans={data.spans} />
            </select>
          </label>
        </>
      )}
      <label>
        Field rationale
        <textarea
          rows={2}
          value={current.rationale}
          disabled={readOnly}
          onChange={(e) => change({ rationale: e.target.value })}
        />
      </label>
      <p className="form-hint">
        Changes are staged for the next revision. Missing is never converted
        into a matching or zero value.
      </p>
    </details>
  );
}
export function PreparationSequence({
  data,
  draft,
  onChange,
  onInspect,
  readOnly,
}: {
  data: CaseData;
  draft: Draft;
  onChange: (d: Draft) => void;
  onInspect: (s: SpanData) => void;
  readOnly: boolean;
}) {
  const lookup = (id: string) => data.assertions.find((a) => a.id === id);
  return (
    <section>
      <div className="editor-section-intro">
        <h3>Preparation & quantities</h3>
        <p>
          Source order and explicit order interpretations are preserved.
          Unrecorded temperature, duration and quantity basis remain unknown.
        </p>
      </div>
      {data.material.steps.length === 0 ? (
        <p className="empty">
          No process steps have been saved. Use source-backed proposals or
          manual annotation.
        </p>
      ) : null}
      {data.material.steps.map((step) => {
        const a = lookup(step.operationAssertionId),
          edit = draft.stepEdits?.find((e) => e.stepId === step.id),
          initialSpan = a?.references.find((r) => r.kind === "span");
        const spanId = initialSpan?.kind === "span" ? initialSpan.spanId : "";
        const update = (
          patch: Partial<NonNullable<Draft["stepEdits"]>[number]>,
        ) =>
          onChange({
            ...draft,
            stepEdits: (draft.stepEdits ?? [])
              .filter((e) => e.stepId !== step.id)
              .concat({
                stepId: step.id,
                followsStepIds: step.followsStepIds,
                supportingSpanId: spanId,
                rationale:
                  "Explicit interpretation of the recorded process order; not an invented historical sequence.",
                ...edit,
                ...patch,
              }),
          });
        return (
          <article className="process-card" key={step.id}>
            <div className="section-heading">
              <h3>{assertionLabel(a)}</h3>
              <StateTag assertion={a} />
            </div>
            {a?.field !== "preparation.operation" ? (
              <p className="form-hint">
                Legacy process detail: review an operation proposal to map the
                operation explicitly.
              </p>
            ) : null}
            <p className="mono">{step.id}</p>
            <ul className="step-details">
              {step.detailAssertionIds.map((id) => (
                <li key={id}>
                  {lookup(id)?.label}: {assertionLabel(lookup(id))}
                </li>
              ))}
            </ul>
            {spanId ? (
              <button
                className="text-button"
                onClick={() => {
                  const s = data.spans.find((s) => s.id === spanId);
                  if (s) onInspect(s);
                }}
              >
                Inspect operation source ↗
              </button>
            ) : null}
            <details className="field-editor">
              <summary>Review order constraints</summary>
              <fieldset>
                <legend>Must follow these recorded steps</legend>
                {data.material.steps
                  .filter((s) => s.id !== step.id)
                  .map((previous) => (
                    <label className="checkbox-label" key={previous.id}>
                      <input
                        type="checkbox"
                        disabled={readOnly}
                        checked={(
                          edit?.followsStepIds ?? step.followsStepIds
                        ).includes(previous.id)}
                        onChange={(e) =>
                          update({
                            followsStepIds: e.target.checked
                              ? [
                                  ...(edit?.followsStepIds ??
                                    step.followsStepIds),
                                  previous.id,
                                ]
                              : (
                                  edit?.followsStepIds ?? step.followsStepIds
                                ).filter((id) => id !== previous.id),
                          })
                        }
                      />
                      {assertionLabel(lookup(previous.operationAssertionId))}
                    </label>
                  ))}
                {data.material.steps.length < 2 ? (
                  <p className="form-hint">
                    No other saved step is available as a predecessor.
                  </p>
                ) : null}
              </fieldset>
              <label>
                Order support
                <select
                  value={edit?.supportingSpanId ?? spanId}
                  disabled={readOnly}
                  onChange={(e) => update({ supportingSpanId: e.target.value })}
                >
                  <SpanOptions spans={data.spans} />
                </select>
              </label>
              <label>
                Order rationale
                <textarea
                  rows={2}
                  value={
                    edit?.rationale ??
                    "Explicit interpretation of the recorded process order; not an invented historical sequence."
                  }
                  disabled={readOnly}
                  onChange={(e) => update({ rationale: e.target.value })}
                />
              </label>
            </details>
          </article>
        );
      })}
      <h3 className="quantity-heading">Quantity relationships</h3>
      {data.material.quantities.length === 0 ? (
        <p className="empty">
          No explicit quantity constraint has been saved. Absence is not zero.
        </p>
      ) : null}
      {data.material.quantities.map((q) => {
        const a = lookup(q.assertionId),
          edit = draft.quantityEdits?.find((e) => e.quantityId === q.id),
          ref = a?.references.find((r) => r.kind === "span"),
          spanId = ref?.kind === "span" ? ref.spanId : "";
        const update = (
          patch: Partial<NonNullable<Draft["quantityEdits"]>[number]>,
        ) =>
          onChange({
            ...draft,
            quantityEdits: (draft.quantityEdits ?? [])
              .filter((e) => e.quantityId !== q.id)
              .concat({
                quantityId: q.id,
                basis: q.basis,
                ...(q.value !== undefined ? { value: q.value } : {}),
                ...(q.unit ? { unit: q.unit } : {}),
                supportingSpanId: spanId,
                rationale:
                  "Explicit reviewed quantity interpretation; unknown basis is preserved unless documented.",
                ...edit,
                ...patch,
              }),
          });
        return (
          <article className="quantity-card" key={q.id}>
            <blockquote>“{q.raw}”</blockquote>
            <p>
              {q.basis === "unknown"
                ? "Unknown quantity basis"
                : `${q.basis} basis`}{" "}
              ·{" "}
              {q.value !== undefined
                ? `${q.value} ${q.unit ?? ""}`
                : "Numeric amount not reported"}
            </p>
            <p className="form-hint">
              {q.equalToSlotIds.length
                ? `Linked occurrences: ${q.equalToSlotIds.map((id) => assertionLabel(lookup(data.material.componentSlots.find((s) => s.id === id)!.termAssertionId))).join(", ")}`
                : "Relationship target not yet explicitly mapped."}
            </p>
            <details className="field-editor">
              <summary>Review quantity constraint</summary>
              <label>
                Quantity basis
                <select
                  value={edit?.basis ?? q.basis}
                  disabled={readOnly}
                  onChange={(e) =>
                    update({ basis: e.target.value as typeof q.basis })
                  }
                >
                  <option value="unknown">
                    Unknown · do not infer mass or volume
                  </option>
                  <option value="mass">Mass</option>
                  <option value="volume">Volume</option>
                  <option value="count">Count</option>
                </select>
              </label>
              <div className="form-grid">
                <label>
                  Explicit amount (optional)
                  <input
                    type="number"
                    step="any"
                    disabled={readOnly}
                    value={edit ? (edit.value ?? "") : (q.value ?? "")}
                    onChange={(e) => {
                      const base = {
                        quantityId: q.id,
                        basis: edit?.basis ?? q.basis,
                        supportingSpanId: edit?.supportingSpanId ?? spanId,
                        rationale:
                          edit?.rationale ??
                          "Explicit reviewed quantity interpretation.",
                      };
                      const next = Number.isFinite(e.target.valueAsNumber)
                        ? {
                            ...base,
                            value: e.target.valueAsNumber,
                            unit: edit?.unit ?? q.unit ?? "",
                          }
                        : base;
                      onChange({
                        ...draft,
                        quantityEdits: (draft.quantityEdits ?? [])
                          .filter((e) => e.quantityId !== q.id)
                          .concat(next),
                      });
                    }}
                  />
                </label>
                <label>
                  Unit
                  <input
                    value={edit ? (edit.unit ?? "") : (q.unit ?? "")}
                    disabled={readOnly}
                    maxLength={40}
                    onChange={(e) => update({ unit: e.target.value })}
                  />
                </label>
              </div>
              <label>
                Quantity support
                <select
                  value={edit?.supportingSpanId ?? spanId}
                  disabled={readOnly}
                  onChange={(e) => update({ supportingSpanId: e.target.value })}
                >
                  <SpanOptions spans={data.spans} />
                </select>
              </label>
              <label>
                Quantity rationale
                <textarea
                  rows={2}
                  value={
                    edit?.rationale ??
                    "Explicit reviewed quantity interpretation; unknown basis is preserved unless documented."
                  }
                  disabled={readOnly}
                  onChange={(e) => update({ rationale: e.target.value })}
                />
              </label>
            </details>
          </article>
        );
      })}
    </section>
  );
}
export function MaterialFingerprintPanel({
  data,
  dirty,
}: {
  data: CaseData;
  dirty: boolean;
}) {
  const payload = data.material.fingerprintPayload;
  return (
    <section className="fingerprint-panel">
      <div className="section-heading">
        <h3>Scientific input fingerprint</h3>
        <span className={`badge ${dirty || !payload ? "amber" : ""}`}>
          {dirty
            ? "Stored version · draft changed"
            : payload
              ? "Stored fingerprint"
              : "Not constructed yet"}
        </span>
      </div>
      <p>
        A reproducible digest of reviewed fields and explicit interpretation
        assignments. Matching digests do not establish material, chemical or
        therapeutic equivalence.
      </p>
      {data.material.fingerprint ? (
        <>
          <p className="mono hash">{data.material.fingerprint}</p>
          <details>
            <summary>Inspect normalized input and unknowns</summary>
            <pre className="fingerprint-json">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </details>
        </>
      ) : (
        <p className="form-hint">
          Save a reviewed draft revision to construct the semantic input
          payload. The Phase 1 record hash is an integrity check only.
        </p>
      )}
      {dirty ? (
        <p className="form-hint">
          This digest belongs to saved r{data.case.revision}; it updates after a
          successful save.
        </p>
      ) : null}
    </section>
  );
}
