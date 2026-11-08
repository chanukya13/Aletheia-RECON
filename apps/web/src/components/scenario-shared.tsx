import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import type { CorrespondenceData } from "@recon/contracts";
import { ProvenanceClosure } from "@recon/contracts";
import { mutateApi } from "../api";
import { Dialog } from "./Dialog";
import { SourceReader } from "./SourceReader";
export type Proof = z.infer<typeof ProvenanceClosure>;
export const verdictLabel: Record<string, string> = {
  materially_incompatible: "Recorded material mismatch",
  insufficient_information: "Insufficient information",
  partial_match: "Partial recorded match",
  comparable_on_recorded_dimensions: "Comparable on recorded dimensions",
};
export function useScenarioTask<T>(schema: z.ZodType<T>) {
  const [data, setData] = useState<T | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [signature, setSignature] = useState("");
  const sequence = useRef(0),
    controller = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      sequence.current++;
      controller.current?.abort();
    },
    [],
  );
  const cancel = () => {
    sequence.current++;
    controller.current?.abort();
    setBusy(false);
    setError(
      "Stopped waiting in this view. A save already received by the server may finish; check saved history before retrying.",
    );
  };
  const clear = () => {
    sequence.current++;
    controller.current?.abort();
    setBusy(false);
    setError("");
    setData(null);
    setSignature("");
  };
  const run = async (path: string, body: unknown) => {
    const n = ++sequence.current;
    controller.current?.abort();
    controller.current = new AbortController();
    setBusy(true);
    setError("");
    setData(null);
    setSignature(JSON.stringify({ path, body }));
    try {
      const result = await mutateApi(
        path,
        body,
        schema,
        false,
        controller.current.signal,
      );
      if (n === sequence.current) {
        setData(result);
        return result;
      }
    } catch (e) {
      if (n === sequence.current)
        setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      if (n === sequence.current) setBusy(false);
    }
  };
  return { data, busy, error, signature, run, cancel, clear };
}
export function TaskStatus({
  task,
}: {
  task: { busy: boolean; error: string; cancel: () => void };
}) {
  return (
    <>
      {task.busy ? (
        <div className="task-status" role="status">
          Computing bounded scientific inputs…{" "}
          <button className="text-button" onClick={task.cancel}>
            Cancel request
          </button>
        </div>
      ) : null}
      {task.error ? (
        <p className="form-error" role="alert">
          {task.error} Your editor inputs remain available.
        </p>
      ) : null}
    </>
  );
}
export function SourceProof({
  proof,
  assertionIds,
  title = "Inspect supporting source",
}: {
  proof: Proof;
  assertionIds: string[];
  title?: string;
}) {
  const [open, setOpen] = useState(false),
    [spanId, setSpanId] = useState("");
  const assertions = proof.assertions.filter((a) =>
      assertionIds.includes(a.id),
    ),
    spans = proof.spans.filter((s) =>
      assertions.some((a) =>
        a.references.some((r) => r.kind === "span" && r.spanId === s.id),
      ),
    );
  const active = spans.find((s) => s.id === spanId) ?? spans[0];
  const revision = proof.sourceRevisions.find(
    (r) => r.id === active?.sourceRevisionId,
  );
  return (
    <>
      <button className="text-button" onClick={() => setOpen(true)}>
        {title} ↗
      </button>
      {open ? (
        <Dialog
          title="Source basis and review status"
          onClose={() => setOpen(false)}
        >
          {assertions.length ? (
            assertions.map((a) => (
              <div className="proof-claim" key={a.id}>
                <strong>{a.label}</strong>
                <p>{a.rationale}</p>
                <span className="badge amber">
                  {a.review.status === "accepted"
                    ? "Locally source-checked"
                    : "Draft / review pending"}
                </span>
              </div>
            ))
          ) : (
            <p>
              Source text is withheld, or no structured assertion establishes
              this field. Metadata identifiers remain in the result.
            </p>
          )}
          {spans.length > 1 ? (
            <label>
              Supporting passage
              <select
                value={active?.id ?? ""}
                onChange={(e) => setSpanId(e.target.value)}
              >
                {spans.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.locator.label} / {s.exact.slice(0, 70)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {active && revision ? (
            <>
              <p>{active.locator.label}</p>
              <SourceReader revision={revision} selectedSpan={active} />
              <p className="form-hint">
                {revision.rights.credit} / {revision.rights.license}
              </p>
            </>
          ) : (
            <p className="form-hint">
              No displayable exact passage is available for these inputs.
            </p>
          )}
        </Dialog>
      ) : null}
    </>
  );
}
export function CorrespondenceTable({
  rows,
  proof,
  unitLabel,
}: {
  rows: CorrespondenceData[];
  proof: Proof;
  unitLabel: (id: string) => string;
}) {
  return (
    <div className="correspondence-list">
      {!rows.length ? (
        <p>No identity interpretation is selected.</p>
      ) : (
        rows.map((row) => (
          <article key={`${row.evidenceUnitId}-${row.occurrenceId}`}>
            <strong>{unitLabel(row.evidenceUnitId)}</strong>
            <p>
              {row.proposedName}: <b>{row.state.replaceAll("_", " ")}</b>
            </p>
            <p className="form-hint">{row.limitation}</p>
            <SourceProof
              proof={proof}
              assertionIds={row.assertionIds}
              title="Inspect name correspondence basis"
            />
          </article>
        ))
      )}
    </div>
  );
}
