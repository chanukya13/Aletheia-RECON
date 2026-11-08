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
        <section className="research-card" aria-live="polite">
          <h2>Ratio of reported medians</h2>
          {contrast.data.status === "available" ? (
            <>
              <p className="outcome-ratio" data-testid="outcome-ratio">
                {contrast.data.ratio!.toFixed(2)}
              </p>
              <p>
                {left.columnLabel} divided by {right.columnLabel} /{" "}
                {left.rawValue} ÷ {right.rawValue}
              </p>
              <p>
                Descriptive comparison within this reported assay.
                Interpretation of the historical word and ingredient causation
                remain unresolved.
              </p>
            </>
          ) : (
            <>
              <h3>Ratio unavailable</h3>
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
      <section>
        <h2>Recorded preparation differences</h2>
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
      </section>
      <section className="research-card">
        <h2>Record the interpretation you want to investigate</h2>
        <p>
          Choose an explicit assumption for the audit. The measured outcomes do
          not decide which meaning the historical author intended. Each option
          opens the same eight curated arms from the 2018 study.
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
    <div className="research-workspace page-width">
      <p className="eyebrow">Interpretations and measured evidence</p>
      <h1>Compare measured outcomes.</h1>
      <p>
        Explore the published onion and leek reconstructions by strain and
        assay.
      </p>
      <div className="research-notice">
        Published measurements / Fuchs et al. 2018, Tables 1 and 2. Values are
        reported medians with their source cells, strain and assay preserved.
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
