import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  InterpretationTrace,
  type InterpretationTraceData,
} from "@recon/contracts";
import { api } from "../api";
import { PassageInspection } from "./PassageInspection";
import "../research.css";

const roles: Record<
  InterpretationTraceData["contributions"][number]["role"],
  string
> = {
  original_language_edition: "Original-language printed edition",
  translation: "Translation",
  editorial_note: "Editorial note",
  modern_interpretation: "Modern interpretation",
  modern_tested_material: "Modern tested material",
  unclassified: "Unclassified passage",
};
export default function TraceWorkspace() {
  const [params, setParams] = useSearchParams(),
    query = params.get("q") ?? "cropleac",
    excluded = params.getAll("exclude");
  const [draft, setDraft] = useState(query);
  useEffect(() => setDraft(query), [query]);
  const trace = useQuery<InterpretationTraceData>({
    queryKey: ["trace", query, [...excluded].sort()],
    placeholderData: (previous) =>
      previous?.query === query ? previous : undefined,
    queryFn: ({ signal }) =>
      api(
        `/interpretation-trace?q=${encodeURIComponent(query)}&exclude=${encodeURIComponent(excluded.join(","))}`,
        InterpretationTrace,
        signal,
      ),
  });
  const data = trace.data;
  function toggle(id: string) {
    const next = excluded.includes(id)
      ? excluded.filter((x) => x !== id)
      : [...excluded, id];
    setParams({ q: query, exclude: next });
  }
  return (
    <div className="research-workspace page-width">
      <p className="eyebrow">Words, interpretations and sources</p>
      <h1>Trace an interpretation.</h1>
      <p>
        Search six pinned source revisions. Follow the recorded basis for each
        proposed identity.
      </p>
      <form
        className="research-search"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) setParams({ q: draft.trim() });
        }}
      >
        <label>
          Historical term
          <input
            value={draft}
            maxLength={80}
            onChange={(e) => setDraft(e.target.value)}
            required
          />
        </label>
        <button className="primary-button">Search sources</button>
      </form>
      {trace.isPending ? (
        <p role="status">Searching pinned sources…</p>
      ) : trace.isError ? (
        <div role="alert">
          Trace unavailable. {trace.error.message}{" "}
          <button onClick={() => void trace.refetch()}>Retry trace</button>
        </div>
      ) : data ? (
        <>
          {trace.isFetching ? (
            <p role="status">Updating source support…</p>
          ) : null}
          <div className="research-notice">
            Automated source checks preserve the original wording and each
            contributor’s role. Exclusion shows which recorded support survives
            within these indexed passages.
          </div>
          <section aria-labelledby="interpretation-heading">
            <h2 id="interpretation-heading">Linked interpretations</h2>
            <div className="research-grid">
              {data.candidates.length ? (
                data.candidates.map((c) => (
                  <article key={c.id} className="research-card">
                    <h3>{c.name}</h3>
                    <p role="status">
                      <strong>
                        {c.survivingPaths
                          ? "Recorded support available"
                          : "No remaining recorded support"}
                      </strong>
                    </p>
                    <p>
                      {c.survivingPaths} active supporting path(s) / {c.review}{" "}
                      review
                    </p>
                    {c.paths.map((p, i) => (
                      <p className="form-hint" key={i}>
                        {p.assertionIds.join(" → ")} /{" "}
                        {p.excluded ? "excluded" : "active"}
                      </p>
                    ))}
                    <Link
                      to={`/cases/balds-eyesalve/interpretations?candidate=${c.id}&study=study-fuchs-2018`}
                    >
                      Audit this interpretation ↗
                    </Link>
                  </article>
                ))
              ) : (
                <p>
                  No explicit interpretation mapping is recorded for this query.
                </p>
              )}
            </div>
          </section>
          <section>
            <h2>Source contributions</h2>
            <p>
              Pages from the same edition share a group. Each contribution keeps
              its exact wording.
            </p>
            {data.contributions.length ? (
              data.contributions.map((c) => {
                const span = data.spans.find((s) => s.id === c.spanId)!,
                  revision = data.sourceRevisions.find(
                    (r) => r.id === span.sourceRevisionId,
                  )!,
                  source = data.sources.find(
                    (s) => s.id === revision.sourceId,
                  )!;
                return (
                  <article
                    className={`research-card ${c.excluded ? "excluded-contribution" : ""}`}
                    key={c.spanId}
                  >
                    <p className="eyebrow">
                      {c.workGroup} / {roles[c.role]}
                    </p>
                    <h3>{source.creators.join(", ")}</h3>
                    <blockquote>{span.exact}</blockquote>
                    <p className="form-hint">
                      {source.publicationDate} / {span.locator.label}
                    </p>
                    <div className="research-actions">
                      <button
                        className="secondary-button"
                        disabled={trace.isFetching}
                        onClick={() => toggle(c.spanId)}
                        aria-label={`${excluded.includes(c.spanId) ? "Restore" : "Exclude"} ${roles[c.role].toLowerCase()} · ${c.spanId}`}
                      >
                        {excluded.includes(c.spanId)
                          ? "Restore contribution"
                          : "Exclude contribution"}
                      </button>
                      <PassageInspection revision={revision} span={span} />
                    </div>
                  </article>
                );
              })
            ) : (
              <p>No indexed source contribution matched.</p>
            )}
          </section>
          <section>
            <h2>Literal matches</h2>
            <p className="form-hint">
              Showing up to 200 occurrences per source revision.
            </p>
            <p>
              {data.literals.length} exact word occurrence(s) for “{data.query}
              ”.
            </p>
            {data.literals.map((s) => (
              <article className="research-card" key={s.id}>
                <p>
                  …{s.prefix}
                  <mark>{s.exact}</mark>
                  {s.suffix}…
                </p>
                <PassageInspection
                  revision={
                    data.sourceRevisions.find(
                      (r) => r.id === s.sourceRevisionId,
                    )!
                  }
                  span={s}
                />
              </article>
            ))}
          </section>
          <div className="research-actions">
            <Link to="/outcomes">Compare measured onion/leek outcomes ↗</Link>
            <Link to="/cases/balds-eyesalve/interpretations">
              Open eyesalve interpretations ↗
            </Link>
          </div>
          <details>
            <summary>Reproducibility fingerprints</summary>
            <p className="hash-value">Corpus {data.corpusHash}</p>
            <p className="hash-value">Result {data.resultHash}</p>
          </details>
        </>
      ) : null}
    </div>
  );
}
