import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  OutcomeCatalogue,
  OutcomeContrast,
  type OutcomeCatalogueData,
  type OutcomeObservationData,
} from "@recon/contracts";
import { api } from "../api";
import { Dialog } from "./Dialog";
import { SourceReader } from "./SourceReader";
import { PassageInspection } from "./PassageInspection";
import "../research.css";

function InspectCell({
  observation,
  catalogue,
}: {
  observation: OutcomeObservationData;
  catalogue: OutcomeCatalogueData;
}) {
  const [open, setOpen] = useState(false);
  const revision = catalogue.sourceRevisions.find(
      (r) => r.id === observation.sourceRevisionId,
    )!,
    span = catalogue.spans.find((s) => s.id === observation.spanId)!;
  const cells = catalogue.observations.filter(
      (o) => o.tableId === observation.tableId,
    ),
    labels = [...new Set(cells.map((o) => o.columnLabel))],
    strains = [...new Set(cells.map((o) => o.strain))];
  return (
    <>
      <button className="text-button" onClick={() => setOpen(true)}>
        Inspect {observation.columnLabel} source cell ↗
      </button>
      {open ? (
        <Dialog title="Reported source cell" onClose={() => setOpen(false)}>
          <h3>{observation.tableId}</h3>
          <p>
            {observation.organism} / {observation.rowLabel} /{" "}
            {observation.columnLabel}
          </p>
          {observation.rowIndex ? (
            <>
              <p>
                Original table body row {observation.rowIndex}, column{" "}
                {observation.columnIndex}. Reported cell text{" "}
                <strong>{observation.rawValue}</strong>.
              </p>
              <div className="table-scroll">
                <table>
                  <caption>
                    Table 2 / MIC in % v/v / medians of at least three
                    biological replicates
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Strain</th>
                      {labels.map((h) => (
                        <th scope="col" key={h}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {strains.map((strain) => (
                      <tr key={strain}>
                        <th scope="row">{strain}</th>
                        {labels.map((label) => {
                          const cell = cells.find(
                            (c) =>
                              c.strain === strain && c.columnLabel === label,
                          )!;
                          return (
                            <td key={label}>
                              {cell.id === observation.id ? (
                                <mark>{cell.rawValue}</mark>
                              ) : (
                                cell.rawValue
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p>{observation.rawValue}</p>
          )}
          <p className="hash-value">
            Original XML SHA-256 {observation.rawSourceHash}
          </p>
          <SourceReader revision={revision} selectedSpan={span} />
          <p>
            {revision.rights.credit} / {revision.rights.license}
          </p>
        </Dialog>
      ) : null}
    </>
  );
}

function MeasuredPair({ catalogue }: { catalogue: OutcomeCatalogueData }) {
  const [strain, setStrain] = useState("ATCC 6538"),
    [comparison, setComparison] = useState("leek");
  const left = catalogue.observations.find(
    (o) => o.strain === strain && o.columnLabel === "ES-O",
  )!;
  const right =
    comparison === "biofilm"
      ? catalogue.observations.find((o) => o.id === "obs-2020-esl-newman")!
      : catalogue.observations.find(
          (o) => o.strain === strain && o.columnLabel === "ES-L",
        )!;
  const query = `left=${left.id}&right=${right.id}`;
  const contrast = useQuery({
    queryKey: ["outcome-contrast", left.id, right.id],
    queryFn: ({ signal }) =>
      api(`/outcome-contrast?${query}`, OutcomeContrast, signal),
  });
  const preparation = catalogue.spans.find(
    (s) => s.id === "span-2018-preparation",
  )!;
  return (
    <>
      <div className="research-grid outcome-selectors">
        <label>
          Bacterial strain
          <select value={strain} onChange={(e) => setStrain(e.target.value)}>
            <option>ATCC 6538</option>
            <option>LAC</option>
          </select>
        </label>
        <label>
          Compare onion with
          <select
            value={comparison}
            onChange={(e) => setComparison(e.target.value)}
          >
            <option value="leek">Leek / same 2018 broth MIC assay</option>
            <option value="biofilm">Leek / 2020 Newman biofilm endpoint</option>
          </select>
        </label>
      </div>
      <details className="research-disclosure" open={comparison === "biofilm"}>
        <summary>Source observations and assay context</summary>
        <div className="research-grid">
          {[left, right].map((o) => (
            <article key={o.id} className="research-card">
              <p className="eyebrow">Modern reconstruction / {o.columnLabel}</p>
              <h2>
                {o.value === null
                  ? "Not numerically curated"
                  : `${o.rawValue} ${o.unit}`}
              </h2>
              <p>
                {o.organism} / {o.strain}
              </p>
              <p>
                {o.endpoint} / {o.statistic}
              </p>
              <p className="form-hint">{o.assay}</p>
              <InspectCell observation={o} catalogue={catalogue} />
            </article>
          ))}
        </div>
      </details>
      {contrast.isPending ? (
        <p role="status">Checking the matched observations…</p>
      ) : contrast.isError ? (
        <div role="alert">
          Outcome comparison unavailable. {contrast.error.message}
          <button onClick={() => void contrast.refetch()}>
            Retry comparison
          </button>
        </div>
      ) : contrast.data ? (
        <section className="research-card outcome-result" aria-live="polite">
          {contrast.data.status === "available" ? (
            <>
              <figure
                className="measurement-chart"
                aria-labelledby="measurement-caption"
              >
                <figcaption id="measurement-caption">
                  Reported median MIC{" "}
                  <span>
                    {strain} · {left.unit}
                  </span>
                </figcaption>
                {[left, right].map((o) => (
                  <div className="measurement-row" key={o.id}>
                    <div>
                      <strong>
                        {o.columnLabel === "ES-O"
                          ? "Onion preparation"
                          : "Leek preparation"}
                      </strong>
                      <span>
                        {o.rawValue} {o.unit}
                      </span>
                    </div>
                    <div className="measurement-track" aria-hidden="true">
                      <span
                        className={
                          o.columnLabel === "ES-O" ? "onion-bar" : "leek-bar"
                        }
                        style={{
                          width: `${(o.value! / Math.max(left.value!, right.value!, Number.EPSILON)) * 100}%`,
                        }}
                      />
                    </div>
                    <InspectCell observation={o} catalogue={catalogue} />
                  </div>
                ))}
                <p className="chart-scale">
                  Bars start at zero. Values are reported medians, not clinical
                  outcomes.
                </p>
              </figure>
              <div className="ratio-summary">
                <h2>Ratio of reported medians</h2>
                <p className="outcome-ratio" data-testid="outcome-ratio">
                  {contrast.data.ratio!.toFixed(2)}
                </p>
                <p>
                  {left.columnLabel} divided by {right.columnLabel} /{" "}
                  {left.rawValue} ÷ {right.rawValue}
                </p>
                <p>
                  Within this assay only. Historical identity and ingredient
                  causation remain unresolved.
                </p>
              </div>
            </>
          ) : (
            <>
              <h2>Ratio unavailable</h2>
              <ul>
                {contrast.data.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </>
          )}
          <a
            className="text-button"
            href={`/api/v1/outcome-contrast?${query}`}
            download="recon-outcome-contrast.json"
          >
            Download reproducible comparison JSON ↗
          </a>
          <details>
            <summary>Calculation fingerprint</summary>
            <p className="hash-value">{contrast.data.resultHash}</p>
          </details>
        </section>
      ) : null}
      <details className="research-disclosure">
        <summary>Recorded preparation differences</summary>
        <p>
          Both arms share garlic, wine, bovine bile and brass. The authors used
          minced onion and leek leaves in the respective preparations. The
          source gives their amounts and preparation conditions.
        </p>
        <div className="table-scroll">
          <table>
            <caption>
              2018 Table 1 / composition of the onion and leek formulations
            </caption>
            <thead>
              <tr>
                <th scope="col">Material component</th>
                <th scope="col">ES-O</th>
                <th scope="col">ES-L</th>
              </tr>
            </thead>
            <tbody>
              {left.composition.map((c) => (
                <tr key={c.ingredient}>
                  <th scope="row">{c.ingredient}</th>
                  <td>{c.included ? "Included" : "Excluded"}</td>
                  <td>
                    {catalogue.observations
                      .find(
                        (o) => o.strain === strain && o.columnLabel === "ES-L",
                      )!
                      .composition.find((x) => x.ingredient === c.ingredient)!
                      .included
                      ? "Included"
                      : "Excluded"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PassageInspection
          revision={
            catalogue.sourceRevisions.find(
              (r) => r.id === preparation.sourceRevisionId,
            )!
          }
          span={preparation}
          label="Inspect preparation and plant parts"
        />
      </details>
      <section className="research-card interpretation-choice">
        <h2>Record the interpretation you want to investigate</h2>
        <p>
          Choose a reading to examine, not a historical conclusion. Both use the
          same eight curated 2018 assay records.
        </p>
        <div className="journey-choices">
          <Link
            className="secondary-button"
            to="/cases/balds-eyesalve/interpretations?candidate=candidate-onion&study=study-fuchs-2018"
          >
            Audit the onion interpretation ↗
          </Link>
          <Link
            className="secondary-button"
            to="/cases/balds-eyesalve/interpretations?candidate=candidate-leek&study=study-fuchs-2018"
          >
            Audit the leek interpretation ↗
          </Link>
        </div>
      </section>
    </>
  );
}
export default function OutcomeWorkspace() {
  const catalogue = useQuery({
    queryKey: ["outcome-observations"],
    queryFn: ({ signal }) =>
      api("/outcome-observations", OutcomeCatalogue, signal),
  });
  return (
    <div className="research-workspace outcomes-workspace page-width">
      <p className="eyebrow">Interpretations and measured evidence</p>
      <h1>Compare measured outcomes.</h1>
      <p>
        Same historical word. Two modern preparations. Compare the published
        measurements.
      </p>
      <div className="research-notice">
        Fuchs et al., 2018 · Reported medians from Tables 1 and 2. Every value
        links to its source cell.
      </div>
      {catalogue.isPending ? (
        <p role="status">Reading pinned source tables…</p>
      ) : catalogue.isError ? (
        <div role="alert">
          Source table unavailable. {catalogue.error.message}
          <button onClick={() => void catalogue.refetch()}>
            Retry source table
          </button>
        </div>
      ) : catalogue.data ? (
        <MeasuredPair catalogue={catalogue.data} />
      ) : null}
      <p>
        <Link to="/trace?q=cropleac">
          Trace the historical onion/leek interpretation ↗
        </Link>
      </p>
    </div>
  );
}
