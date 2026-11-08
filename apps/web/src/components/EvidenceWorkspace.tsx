import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CaseResponse,
  Evaluation,
  LiteratureSearch,
  PendingStudy,
  PendingFullText,
  PendingStudyList,
  StudyDetail,
  StudyList,
  type AssertionData,
  type SpanData,
} from "@recon/contracts";
import { api, mutateApi } from "../api";
import { Dialog } from "./Dialog";
import { SourceReader } from "./SourceReader";
import { assertionLabel } from "./curation-shared";
import "../curation.css";
import "../evidence.css";
const labels: Record<string, string> = {
  materially_incompatible: "Recorded material mismatch",
  insufficient_information: "Insufficient information",
  partial_match: "Partial recorded match",
  comparable_on_recorded_dimensions: "Comparable on recorded dimensions",
};
export default function EvidenceWorkspace() {
  const { id = "" } = useParams(),
    [params] = useSearchParams();
  const revision = params.get("revision");
  const [selected, setSelected] = useState<string[]>([]),
    [inspected, setInspected] = useState<SpanData | null>(null),
    [studyId, setStudyId] = useState(""),
    [studyOpen, setStudyOpen] = useState(false);
  const record = useQuery({
    queryKey: ["case", id, revision],
    queryFn: ({ signal }) =>
      api(
        `/cases/${id}${revision ? `?revision=${revision}` : ""}`,
        CaseResponse,
        signal,
      ),
  });
  const library = useQuery({
    queryKey: ["studies"],
    queryFn: ({ signal }) => api("/studies", StudyList, signal),
  });
  const study = useQuery({
    queryKey: ["study", studyId],
    enabled: Boolean(studyId),
    queryFn: ({ signal }) => api(`/studies/${studyId}`, StudyDetail, signal),
  });
  const evaluation = useMutation({
    mutationFn: (body: Parameters<typeof Evaluation.parse>[0]) =>
      mutateApi(`/cases/${id}/evaluate`, body, Evaluation),
  });
  if (record.isPending || library.isPending)
    return (
      <div role="status" className="state-panel">
        Loading source-grounded evidence…
      </div>
    );
  if (record.isError || library.isError)
    return (
      <div className="state-panel" role="alert">
        Evidence could not be loaded.{" "}
        <button
          className="secondary-button"
          onClick={() => {
            void record.refetch();
            void library.refetch();
          }}
        >
          Retry evidence
        </button>
      </div>
    );
  const data = record.data;
  const units = library.data.evidenceUnits;
  const result =
    evaluation.data &&
    evaluation.data.case.id === id &&
    evaluation.data.case.contentHash === data.case.contentHash &&
    JSON.stringify(
      (evaluation.variables as { evidenceUnitIds?: string[] })?.evidenceUnitIds,
    ) === JSON.stringify(selected)
      ? evaluation.data
      : null;
  const a = (id: string): AssertionData | undefined =>
    result?.assertions.find((a) => a.id === id) ??
    study.data?.assertions.find((a) => a.id === id) ??
    data.assertions.find((a) => a.id === id);
  const showAssertion = (assertion?: AssertionData) =>
    assertion ? (
      <div className="reported-value">
        <RecordedValue assertion={assertion} />
        <span className="badge amber">
          {assertion.review.status === "accepted"
            ? "Locally source-checked"
            : "Draft · review pending"}
        </span>
        {assertion.references.flatMap((ref) => {
          const span =
            ref.kind === "span"
              ? (result?.spans.find((s) => s.id === ref.spanId) ??
                study.data?.spans.find((s) => s.id === ref.spanId) ??
                data.spans.find((s) => s.id === ref.spanId))
              : undefined;
          return span
            ? [
                <button
                  className="text-button"
                  key={span.id}
                  onClick={() => setInspected(span)}
                >
                  Inspect {span.locator.label} ↗
                </button>,
              ]
            : [];
        })}
      </div>
    ) : (
      <p>Not available under source rights.</p>
    );
  const source = inspected
    ? (result?.sourceRevisions.find(
        (r) => r.id === inspected.sourceRevisionId,
      ) ??
      study.data?.sourceRevisions.find(
        (r) => r.id === inspected.sourceRevisionId,
      ) ??
      data.sourceRevisions.find((r) => r.id === inspected.sourceRevisionId))
    : undefined;
  return (
    <div className="evidence-workspace page-width">
      <div className="breadcrumbs">
        <Link to="/cases">Case library</Link>
        <span>/</span>
        <span>{data.case.title}</span>
      </div>
      <section className="workspace-heading">
        <div>
          <p className="eyebrow">Evidence transfer audit · material-audit-v1</p>
          <h1>{data.case.title}</h1>
          <p>
            Compare the recorded preparation with a specific formulation and
            assay.
          </p>
        </div>
        <span className="badge amber">
          Automated source checks / review provenance retained
        </span>
      </section>
      <nav className="workspace-tabs" aria-label="Case workspace">
        <Link to={`/cases/${id}/source`}>Source record</Link>
        <Link to={`/cases/${id}/material`}>Material & interpretations</Link>
        <span className="active-tab">Evidence audit</span>
        <Link
          to={`/cases/${id}/interpretations${revision ? `?revision=${revision}` : ""}`}
        >
          Scenarios & robustness
        </Link>
        <span className="mono">Pinned input r{data.case.revision}</span>
      </nav>
      <div className="capability-note">
        <Link to="/outcomes">
          Compare reported onion/leek assay outcomes ↗
        </Link>
        <strong>Unknowns are a valid research result.</strong>
        <p>
          Pending claims cannot establish a match. A material verdict does not
          establish chemical identity or clinical effectiveness. Study outcomes
          remain unchanged by interpretation choices.
        </p>
      </div>
      <div className="evidence-layout">
        <aside className="evidence-selector">
          <h2>Tested formulations & assays</h2>
          <p className="form-hint">
            {library.data.studies.length} studies · {units.length} formulation ×
            assay records. Arms are not independent papers.
          </p>
          {library.data.studies.map((s) => (
            <section className="evidence-study" key={s.id}>
              <h3>
                {s.authors[0]} · {s.year}
              </h3>
              <p>{s.title}</p>
              <button
                className="text-button"
                onClick={() => {
                  setStudyId(s.id);
                  setStudyOpen(true);
                }}
              >
                Inspect study & methods ↗
              </button>
              {units
                .filter((u) => u.studyId === s.id)
                .map((u) => (
                  <label className="checkbox-label" key={u.id}>
                    <input
                      type="checkbox"
                      checked={selected.includes(u.id)}
                      onChange={(e) =>
                        setSelected((ids) =>
                          e.target.checked
                            ? [...ids, u.id]
                            : ids.filter((id) => id !== u.id),
                        )
                      }
                    />
                    <span>{u.armLabel}</span>
                  </label>
                ))}
            </section>
          ))}
        </aside>
        <section className="evidence-results" aria-labelledby="audit-title">
          <h2 id="audit-title">Recorded-material comparison</h2>
          <p className="form-hint">
            Uses saved r{data.case.revision} and its explicit identity
            assumptions. Unsaved material edits are excluded.
          </p>
          <button
            className="primary-button"
            disabled={!selected.length || evaluation.isPending}
            onClick={() =>
              evaluation.mutate({
                caseRevision: data.case.revision,
                policyId: "material-audit-v1",
                scenario: data.case.baselineScenarioInput,
                evidenceUnitIds: selected,
              })
            }
          >
            {evaluation.isPending
              ? "Evaluating recorded dimensions…"
              : `Compare selected evidence (${selected.length})`}
          </button>
          {!selected.length ? (
            <p className="empty">
              Choose one or more specific assays to begin.
            </p>
          ) : null}
          {evaluation.isError ? (
            <p className="form-error" role="alert">
              {evaluation.error.message}
            </p>
          ) : null}
          {result ? (
            <>
              <p className="mono hash audit-hash">
                Policy {result.policyHash} · Inputs {result.inputHash}
              </p>
              {result.results.map((r) => {
                const unit = units.find((u) => u.id === r.evidenceUnitId)!;
                return (
                  <article className="audit-result" key={r.id}>
                    <p className="eyebrow">{unit.armLabel}</p>
                    <h3>{labels[r.materialComparison.verdict]}</h3>
                    <p className="form-hint">
                      Strict full-material policy. All nine dimensions were
                      evaluated.
                    </p>
                    {r.materialComparison.dimensions.map((d) => (
                      <details className="dimension-reason" key={d.dimension}>
                        <summary>
                          <span>{d.dimension.replaceAll("_", " ")}</span>
                          <span
                            className={`badge ${d.state === "unknown" ? "amber" : ""}`}
                          >
                            {d.state.replaceAll("_", " ")}
                          </span>
                        </summary>
                        {d.reasonCodes.map((code) => (
                          <p key={code}>
                            {result.policy.reasonCodes.find(
                              (c) => c.code === code,
                            )?.definition ?? code}
                          </p>
                        ))}
                        {d.assertionIds.length ? (
                          d.assertionIds.map((id) => (
                            <div className="reason-assertion" key={id}>
                              <strong>{a(id)?.label ?? id}</strong>
                              {showAssertion(a(id))}
                            </div>
                          ))
                        ) : (
                          <p className="form-hint">
                            No usable structured source assertion establishes
                            this dimension.
                          </p>
                        )}
                        {d.hypothesisIds.length ? (
                          <p>
                            Explicit assumptions: {d.hypothesisIds.join(", ")}
                          </p>
                        ) : null}
                      </details>
                    ))}
                    <section className="assay-context">
                      <h4>
                        Assay context ·{" "}
                        {r.contextComparison.verdict.replaceAll("_", " ")}
                      </h4>
                      {unit.contextAssertionIds.map((id) => (
                        <div key={id}>{showAssertion(a(id))}</div>
                      ))}
                      {showAssertion(a(unit.endpointAssertionId))}
                      <p>
                        No validated historical-disease crosswalk or clinical
                        transfer is established.
                      </p>
                    </section>
                    <section className="reported-outcome">
                      <h4>Reported outcome · preserved from the source</h4>
                      {showAssertion(a(r.reportedOutcomeAssertionId))}
                      {showAssertion(a(unit.comparatorAssertionId))}
                    </section>
                    <details>
                      <summary>Dependencies & reproducibility</summary>
                      <pre>{r.dependencies.join("\n")}</pre>
                      <p className="mono hash">Result {result.resultHash}</p>
                    </details>
                  </article>
                );
              })}
            </>
          ) : null}
          <LiteraturePanel />
        </section>
      </div>
      {studyId && studyOpen ? (
        <Dialog
          title="Study record & methods"
          onClose={() => setStudyOpen(false)}
        >
          {study.isPending ? (
            <p role="status">Loading study…</p>
          ) : study.isError ? (
            <p role="alert">{study.error.message}</p>
          ) : study.data ? (
            <>
              <h3>{study.data.studies[0]!.title}</h3>
              <p>{study.data.studies[0]!.design}</p>
              <p>{study.data.studies[0]!.correctionStatus}</p>
              <p className="mono">
                DOI {study.data.studies[0]!.doi} ·{" "}
                {study.data.studies[0]!.pmcid}
              </p>
              {study.data.spans.map((s) => (
                <div className="reference-quote" key={s.id}>
                  <p>{s.locator.label}</p>
                  <blockquote>{s.exact}</blockquote>
                  <button
                    className="text-button"
                    onClick={() => {
                      setInspected(s);
                      setStudyOpen(false);
                    }}
                  >
                    Locate exact passage ↗
                  </button>
                </div>
              ))}
            </>
          ) : null}
        </Dialog>
      ) : null}
      {inspected && source ? (
        <Dialog
          title="Supporting source passage"
          onClose={() => setInspected(null)}
        >
          <p>{inspected.locator.label}</p>
          <SourceReader revision={source} selectedSpan={inspected} />
          <p className="form-hint">
            {source.rights.credit} · {source.rights.license}
          </p>
          <p className="mono hash">{source.textSha256}</p>
        </Dialog>
      ) : null}
    </div>
  );
}
function LiteraturePanel() {
  const pending = useQuery({
    queryKey: ["pending-studies"],
    queryFn: ({ signal }) => api("/pending-studies", PendingStudyList, signal),
  });
  const [query, setQuery] = useState(""),
    [submitted, setSubmitted] = useState(""),
    [cursor, setCursor] = useState("*");
  const cache = useQueryClient();
  const search = useQuery({
    queryKey: ["literature", submitted, cursor],
    enabled: Boolean(submitted),
    queryFn: ({ signal }) =>
      api(
        `/literature/search?q=${encodeURIComponent(submitted)}&cursor=${encodeURIComponent(cursor)}`,
        LiteratureSearch,
        signal,
      ),
  });
  const imported = useMutation({
    mutationFn: (item: { id: string; source: string }) =>
      mutateApi(
        "/studies/import",
        {
          requestId: crypto.randomUUID(),
          snapshotId: search.data!.snapshotId,
          ...item,
        },
        PendingStudy,
      ),
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ["pending-studies"] });
    },
  });
  const fullText = useMutation({
    mutationFn: () =>
      mutateApi(
        `/pending-studies/${imported.data!.id}/full-text`,
        {},
        PendingFullText,
      ),
  });
  return (
    <section className="literature-panel">
      <h2>Find additional literature</h2>
      {pending.data?.items.length ? (
        <details>
          <summary>Saved pending records ({pending.data.items.length})</summary>
          {pending.data.items.map((item) => (
            <article key={item.id}>
              <h3>{item.metadata.title}</h3>
              <p>
                {item.metadata.source} {item.metadata.id} / DOI{" "}
                {item.metadata.doi ?? "not supplied"}
              </p>
              <p>
                {item.metadata.publicationTypes.join(", ")} / review pending /{" "}
                {item.metadata.license ?? "license not supplied"}
              </p>
            </article>
          ))}
        </details>
      ) : null}
      <p>
        Literal phrase search in Europe PMC. New records enter as pending
        metadata; they do not create evidence claims or retrieve unverified full
        text.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setCursor("*");
          setSubmitted(query.trim());
          if (submitted === query.trim()) void search.refetch();
        }}
      >
        <label>
          Literature phrase
          <input
            required
            minLength={2}
            maxLength={200}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button className="secondary-button" disabled={search.isFetching}>
          {search.isFetching ? "Searching Europe PMC…" : "Search literature"}
        </button>
      </form>
      {search.isError ? <p role="alert">{search.error.message}</p> : null}
      {search.data ? (
        <>
          <p role="status">{search.data.message}</p>
          <p className="form-hint">
            Retrieved {search.data.retrievedAt}
            {search.data.stale ? " · stale snapshot" : ""}
          </p>
          {search.data.items.map((item) => (
            <article key={`${item.source}-${item.id}`}>
              <h3>{item.title}</h3>
              <p>
                {item.authorString} · {item.year}
              </p>
              <p>
                License: {item.license ?? "not supplied"} · Full text not
                retrieved
              </p>
              <p>{item.publicationTypes.join(" · ")}</p>
              <button
                className="text-button"
                onClick={() =>
                  imported.mutate({ id: item.id, source: item.source })
                }
                disabled={imported.isPending}
              >
                Save pending metadata
              </button>
            </article>
          ))}
          {search.data.nextCursor ? (
            <button
              className="secondary-button"
              onClick={() => setCursor(search.data!.nextCursor!)}
            >
              Next literature page
            </button>
          ) : null}
        </>
      ) : null}
      {imported.isSuccess ? (
        <div>
          <button
            className="secondary-button"
            disabled={fullText.isPending}
            onClick={() => fullText.mutate()}
          >
            {fullText.isPending
              ? "Checking eligible full text / "
              : "Check and retrieve licensed paragraphs"}
          </button>
          {fullText.isError ? (
            <p role="alert">{fullText.error.message}</p>
          ) : fullText.data ? (
            <div>
              <p role="status">{fullText.data.reason}</p>
              {fullText.data.text ? (
                <details>
                  <summary>
                    Inspect pending licensed paragraphs /{" "}
                    {fullText.data.license}
                  </summary>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      maxHeight: 500,
                      overflow: "auto",
                    }}
                  >
                    {fullText.data.text}
                  </pre>
                </details>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {imported.isSuccess ? (
        <p role="status">
          Saved pending metadata: {imported.data.metadata.title}. No scientific
          acceptance or full text was added.
        </p>
      ) : imported.isError ? (
        <p role="alert">{imported.error.message}</p>
      ) : null}
    </section>
  );
}

function RecordedValue({ assertion }: { assertion: AssertionData }) {
  if (
    (assertion.state === "recorded" || assertion.state === "inferred") &&
    assertion.value &&
    typeof assertion.value === "object" &&
    !Array.isArray(assertion.value) &&
    !("unit" in assertion.value)
  )
    return (
      <dl className="assay-fields">
        {Object.entries(assertion.value).map(([key, value]) => (
          <div key={key}>
            <dt>
              {key.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ")}
            </dt>
            <dd>
              {value === null
                ? "Unreported"
                : typeof value === "boolean"
                  ? value
                    ? "Present"
                    : "Absent"
                  : typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    );
  return <p>{assertionLabel(assertion)}</p>;
}
