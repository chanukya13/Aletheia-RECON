import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { EvaluationArtifact, EvaluationArtifactList } from "@recon/contracts";
import { api } from "../api";
import "../dossiers.css";
import { VerificationSummary } from "./VerificationSummary";
const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
export default function EvaluationWorkspace() {
  const list = useQuery({
      queryKey: ["evaluation-runs"],
      queryFn: ({ signal }) =>
        api("/evaluation/runs", EvaluationArtifactList, signal),
    }),
    [selected, setSelected] = useState("");
  const id = selected || list.data?.items[0]?.id;
  const run = useQuery({
    queryKey: ["evaluation-run", id],
    enabled: Boolean(id),
    queryFn: ({ signal }) =>
      api(`/evaluation/runs/${id}`, EvaluationArtifact, signal),
  });
  if (list.isPending)
    return (
      <div className="state-panel" role="status">
        Loading computed evaluation artifacts…
      </div>
    );
  if (list.isError)
    return (
      <div className="state-panel" role="alert">
        Evaluation index unavailable.{" "}
        <button onClick={() => void list.refetch()}>
          Retry evaluation index
        </button>
      </div>
    );
  const manifest = record(run.data?.manifest),
    metrics = record(run.data?.metrics),
    authentic = record(metrics.authentic),
    synthetic = record(metrics.synthetic),
    systems = record(authentic.systemOutputs),
    extraction = record(metrics.extraction),
    retrieval = record(metrics.retrieval);
  return (
    <div className="dossier-workspace page-width">
      <p className="eyebrow">Executed methods and limitations</p>
      <h1>Evaluation ledger.</h1>
      <p>
        Inspect what we tested, compare the baselines and download the actual
        results.
      </p>
      <VerificationSummary />
      <div className="dossier-notice">
        <strong>Scientific accuracy is not established.</strong> Independent
        reference labels are unavailable. Synthetic checks test the software,
        not clinical or historical accuracy.
      </div>
      {list.data.items.length ? (
        <label>
          Evaluation run
          <select value={id} onChange={(e) => setSelected(e.target.value)}>
            {list.data.items.map((r) => (
              <option value={r.id} key={r.id}>
                {r.id} / {r.status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <section>
          <h2>No run generated</h2>
          <p>
            Run the documented local evaluation command to generate actual
            artifacts. No placeholder result is displayed.
          </p>
        </section>
      )}
      {run.isPending && id ? (
        <p role="status">Loading frozen run…</p>
      ) : run.isError ? (
        <p role="alert">
          Run could not be loaded.{" "}
          <button onClick={() => void run.refetch()}>
            Retry evaluation run
          </button>
        </p>
      ) : run.data ? (
        <>
          <details className="research-disclosure">
            <summary>Authentic development diagnostic</summary>
            <section>
              <h2>Authentic development diagnostic</h2>
              <div className="metric-grid">
                <div>
                  <strong>{String(authentic.records)}</strong>
                  <span>Correlated comparison records</span>
                </div>
                <div>
                  <strong>{String(authentic.evidenceUnits)}</strong>
                  <span>Formulation × assay units</span>
                </div>
                <div>
                  <strong>{String(authentic.studies)}</strong>
                  <span>Primary studies</span>
                </div>
                <div>
                  <strong>{String(authentic.reviewedLabels)}</strong>
                  <span>Independent reference labels</span>
                </div>
              </div>
              <p>{String(authentic.reason)}</p>
              <p>
                Accuracy, macro-F1, false acceptance and comparable recall:{" "}
                <strong>not scored</strong>.
              </p>
              <div
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label="Actual system output counts"
              >
                <table>
                  <caption>
                    Actual output counts / identical supplied facts
                  </caption>
                  <thead>
                    <tr>
                      <th>System</th>
                      <th>Strict comparable</th>
                      <th>Insufficient</th>
                      <th>Denominator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(systems).map(([key, value]) => {
                      const v = record(value);
                      return (
                        <tr key={key}>
                          <td>{key.replaceAll("_", " ")}</td>
                          <td>{String(v.comparable)}</td>
                          <td>{String(v.insufficient)}</td>
                          <td>{String(v.denominator)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p>
                B0 lexical linkage: {String(retrieval.acceptedLinks)} of{" "}
                {String(retrieval.denominator)} links meet a fixed{" "}
                {String(retrieval.threshold)} threshold. This is retrieval
                linkage, not scientific comparability. Retrieval recall/MRR are
                unavailable without a relevance set.
              </p>
              <p>
                B2 retrieval + LLM audit:{" "}
                <strong>not run — credentials or model unavailable</strong>. No
                model comparison or cost claim is made.
              </p>
            </section>
          </details>
          <details className="research-disclosure">
            <summary>Synthetic engineering panel</summary>
            <section>
              <h2>Synthetic engineering panel</h2>
              <p>
                {String(synthetic.passed)} / {String(synthetic.records)}{" "}
                aggregation safety sentinels passed; {String(synthetic.failed)}{" "}
                failed.
              </p>
              <p>{String(synthetic.scope)}</p>
              <p>
                Source extraction diagnostic: {String(extraction.passages)}{" "}
                actual passage segments from {String(extraction.works)} works.
                Independent span precision/recall/F1 are not scored.
              </p>
            </section>
          </details>
          <details className="research-disclosure">
            <summary>Protocol and scope</summary>
            <section>
              <h2>Protocol and scope</h2>
              <ul>
                {Array.isArray(manifest.limitations)
                  ? manifest.limitations.map((v, i) => (
                      <li key={i}>{String(v)}</li>
                    ))
                  : null}
              </ul>
              <p className="hash">
                Artifact content hash: {run.data.contentHash}
              </p>
              <details>
                <summary>Frozen protocol, environment and label hash</summary>
                <pre>{JSON.stringify(run.data.manifest, null, 2)}</pre>
              </details>
              <details>
                <summary>Measured timings</summary>
                <pre>{JSON.stringify(run.data.timings, null, 2)}</pre>
              </details>
            </section>
          </details>
          <details className="research-disclosure">
            <summary>Failures and raw predictions</summary>
            <section>
              <h2>Failures and raw predictions</h2>
              {run.data.failures.length ? (
                <pre>{JSON.stringify(run.data.failures, null, 2)}</pre>
              ) : (
                <p>
                  No engineering sentinel failure was recorded. Authentic errors
                  cannot be classified while reference labels are pending.
                </p>
              )}
              <details>
                <summary>
                  All executed predictions and source dependencies
                </summary>
                <pre>{JSON.stringify(run.data.predictions, null, 2)}</pre>
              </details>
            </section>
          </details>
        </>
      ) : null}
    </div>
  );
}
