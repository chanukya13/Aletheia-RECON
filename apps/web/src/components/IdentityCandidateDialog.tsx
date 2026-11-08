import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TaxonomyResponse,
  type CaseData,
  type RevisionInput,
} from "@recon/contracts";
import { api } from "../api";
import { Dialog } from "./Dialog";
import { SpanOptions } from "./curation-shared";
type Candidate = RevisionInput["candidateEdits"][number];
export function IdentityCandidateDialog({
  data,
  occurrenceId,
  existing,
  onAdd,
  onClose,
}: {
  data: CaseData;
  occurrenceId: string;
  existing?: CaseData["candidates"][number];
  onAdd: (c: Candidate) => void;
  onClose: () => void;
}) {
  const basis = existing
    ? data.assertions
        .filter((a) => existing.supportAssertionIds.includes(a.id))
        .flatMap((a) =>
          a.references.flatMap((r) => (r.kind === "span" ? [r.spanId] : [])),
        )
    : [];
  const [proposedName, setProposedName] = useState(
      existing?.proposedName ?? "",
    ),
    [status, setStatus] = useState<Candidate["status"]>(
      existing?.status === "documented_plausible"
        ? "documented_plausible"
        : "inferred",
    ),
    [supportId, setSupportId] = useState(basis[0] ?? ""),
    [rationale, setRationale] = useState(existing?.rationale ?? ""),
    [query, setQuery] = useState(
      existing?.proposedName.replace(/\?$/, "").trim() ?? "",
    ),
    [submitted, setSubmitted] = useState(""),
    [reviewedSnapshot, setReviewedSnapshot] = useState(""),
    [error, setError] = useState("");
  const lookup = useQuery({
    queryKey: ["taxonomy", submitted],
    enabled: Boolean(submitted),
    queryFn: ({ signal }) =>
      api(
        `/taxonomy/candidates?scientificName=${encodeURIComponent(submitted)}`,
        TaxonomyResponse,
        signal,
      ),
    retry: false,
  });
  const result =
    submitted && submitted === query.trim() ? lookup.data : undefined;
  const choice = result?.choices.find((c) => c.selectable);
  const chosen = reviewedSnapshot === result?.snapshotId && Boolean(choice);
  const support = data.spans.find((s) => s.id === supportId);
  return (
    <Dialog
      title={
        existing
          ? "Inspect and normalize a candidate"
          : "Add an identification candidate"
      }
      onClose={onClose}
    >
      <form
        className="curation-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (
            !supportId ||
            rationale.trim().length < 5 ||
            proposedName.trim().length < 2
          ) {
            setError(
              "A proposed name, source passage and rationale are required.",
            );
            return;
          }
          onAdd({
            occurrenceId,
            proposedName: proposedName.trim(),
            status,
            supportSpanIds: [supportId],
            rationale,
            ...(chosen && result?.snapshotId && choice
              ? {
                  taxonomySnapshotId: result.snapshotId,
                  taxonomyChoiceKey: choice.key,
                  taxonomyReviewed: true,
                }
              : { taxonomyReviewed: false }),
          });
        }}
      >
        <p className="form-intro">
          Historical identification and modern taxonomic normalization are
          separate judgments. A lookup cannot resolve the meaning of a
          historical ingredient word.
        </p>
        <label>
          Proposed taxon / material name
          <input
            value={proposedName}
            required
            minLength={2}
            maxLength={200}
            onChange={(e) => setProposedName(e.target.value)}
          />
        </label>
        <label>
          Historical identification basis
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Candidate["status"])}
          >
            <option value="inferred">
              Inferred candidate · not a documented alternative
            </option>
            <option value="documented_plausible">
              Source-documented plausible alternative
            </option>
            <option value="unresolved">Unresolved candidate</option>
          </select>
        </label>
        <label>
          Supporting scholarly/source passage
          <select
            value={supportId}
            required
            onChange={(e) => setSupportId(e.target.value)}
          >
            <SpanOptions spans={data.spans} />
          </select>
        </label>
        {support ? (
          <blockquote className="basis-quote">{support.exact}</blockquote>
        ) : null}
        <label>
          Identification rationale
          <textarea
            value={rationale}
            required
            minLength={5}
            maxLength={1000}
            rows={3}
            onChange={(e) => setRationale(e.target.value)}
          />
        </label>
        <section className="taxonomy-section" aria-labelledby="taxonomy-title">
          <h3 id="taxonomy-title">Modern-name normalization</h3>
          <p className="form-hint">
            Only this scientific-name query is sent to GBIF. The case text is
            never sent. Raw reported names, authors and qualifiers remain in the
            record.
          </p>
          <label>
            Scientific name to look up
            <input
              value={query}
              maxLength={200}
              onChange={(e) => {
                setQuery(e.target.value);
                setSubmitted("");
                setReviewedSnapshot("");
              }}
            />
          </label>
          <button
            type="button"
            className="secondary-button"
            disabled={!query.trim() || lookup.isFetching}
            onClick={() => {
              setSubmitted(query.trim());
              setReviewedSnapshot("");
              if (submitted === query.trim()) void lookup.refetch();
            }}
          >
            {lookup.isFetching ? "Looking up name…" : "Look up modern name"}
          </button>
          {lookup.isError ? (
            <p className="form-error" role="alert">
              {lookup.error.message}
            </p>
          ) : null}
          {result ? (
            <div className="taxonomy-result" aria-live="polite">
              <div className="section-heading">
                <span
                  className={`badge ${result.state === "ready" ? "teal" : "amber"}`}
                >
                  {result.matchType.replaceAll("_", " ")}
                </span>
                <span className="muted">
                  {result.source}
                  {result.stale ? " · stale" : ""}
                </span>
              </div>
              <p>{result.message}</p>
              {result.choices.slice(0, 8).map((c) => (
                <div className="taxon-choice" key={c.key}>
                  <strong>{c.scientificName}</strong>
                  <span>
                    {c.rank} · {c.status} · {c.matchType}
                  </span>
                  <span>
                    Accepted usage: {c.acceptedName} ({c.acceptedRank})
                  </span>
                  <span className="mono">
                    GBIF {c.key} → {c.acceptedKey}
                  </span>
                </div>
              ))}
              {choice && result.snapshotId ? (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={chosen}
                    onChange={(e) =>
                      setReviewedSnapshot(
                        e.target.checked ? result.snapshotId! : "",
                      )
                    }
                  />{" "}
                  I reviewed this exact, sufficiently specific modern-name
                  record. Attach it to the candidate.
                </label>
              ) : (
                <p className="form-hint">
                  No taxonomic record can be attached from this response.
                  Qualify the scientific name or keep the candidate
                  unnormalized.
                </p>
              )}
              <p className="form-hint">
                {result.datasetTitle} · CC BY 4.0
                {result.retrievedAt
                  ? ` · Retrieved ${new Date(result.retrievedAt).toISOString()}`
                  : ""}
                . Service match diagnostics are not historical confidence.
              </p>
            </div>
          ) : null}
        </section>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <p className="form-hint">
          This creates a new candidate record. It does not select a historical
          identity or erase earlier proposals.
        </p>
        <button className="primary-button">Stage candidate</button>
      </form>
    </Dialog>
  );
}
