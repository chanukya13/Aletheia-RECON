import { useQuery } from "@tanstack/react-query";
import { VerificationStudy } from "@recon/contracts";
import { api } from "../api";

export function VerificationSummary() {
  const study = useQuery({
    queryKey: ["verification-study"],
    queryFn: ({ signal }) =>
      api("/verification-study", VerificationStudy, signal),
  });
  if (study.isPending)
    return <p role="status">Loading executed source checks…</p>;
  if (study.isError)
    return (
      <section>
        <h2>Source-cell evaluation unavailable</h2>
        <p>{study.error.message}</p>
        <button onClick={() => void study.refetch()}>
          Retry source-cell evaluation
        </button>
      </section>
    );
  const report = study.data;
  return (
    <section className="verification-summary">
      <h2>Executed source checks and retrieval comparison</h2>
      <div className="metric-grid">
        <div>
          <strong>
            {report.audit.assertions}/{report.audit.assertions}
          </strong>
          <span>Assertion reference checks passed</span>
        </div>
        <div>
          <strong>{report.audit.spans}</strong>
          <span>Exact passages verified</span>
        </div>
        <div>
          <strong>{report.audit.sourceFiles}</strong>
          <span>Source artifacts verified</span>
        </div>
        <div>
          <strong>{report.cellValuesVerified}/16</strong>
          <span>Published cell values reproduced</span>
        </div>
      </div>
      <p>
        Seed corpus checked automatically against the retained sources, exact
        spans and artifact hashes. Independent human adjudication is unrecorded.
      </p>
      <h3>Source-cell retrieval / development fixture</h3>
      <p>
        {report.supportedQueries} published-cell questions and{" "}
        {report.controlledQueries} separately labeled context-conflict
        questions. Each method receives the same fields and candidate
        representations.
      </p>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Source-cell retrieval results"
      >
        <table>
          <caption>
            Correct source location or correct abstention on this fixture
          </caption>
          <thead>
            <tr>
              <th scope="col">Method</th>
              <th scope="col">Published cells</th>
              <th scope="col">Conflicts excluded</th>
              <th scope="col">Total correct</th>
            </tr>
          </thead>
          <tbody>
            {report.metrics.map((m) => (
              <tr key={m.name}>
                <th scope="row">{m.name}</th>
                <td>
                  {m.supportedCorrect}/{report.supportedQueries}
                </td>
                <td>
                  {m.unsupportedAbstained}/{report.controlledQueries}
                </td>
                <td>
                  {m.totalCorrect}/{m.total} ({(m.accuracy * 100).toFixed(1)}%)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        The metadata-filtered baseline provides the stronger comparison. The
        rows above retain its actual result alongside RECON. These scores
        concern source-cell location and controlled context conflicts.
      </p>
      <a
        className="text-button"
        href="/api/v1/verification-study"
        download="recon-source-cell-study.json"
      >
        Download queries, predictions and source-check record ↗
      </a>
      <details>
        <summary>Methods, scope and reproducibility</summary>
        {report.methods.map((m) => (
          <p key={m}>{m}</p>
        ))}
        <p className="hash-value">Corpus {report.corpusHash}</p>
        <p className="hash-value">Fixture {report.fixtureHash}</p>
        <p className="hash-value">Code {report.codeHash}</p>
        <p>
          Generated {new Date(report.createdAt).toLocaleString()} / Node{" "}
          {report.nodeVersion}
        </p>
      </details>
    </section>
  );
}
