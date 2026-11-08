import { useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  AnalysisList,
  BundleImportList,
  BundleImportRecord,
  ComparisonResult,
  DossierBundleV1,
  ImportedBundleResponse,
  ImportBundlePreview,
  ReplayReceipt,
  SaveResponse,
  ScenarioAuditResponse,
  type DossierData,
} from "@recon/contracts";
import { api } from "../api";
import {
  SourceProof,
  TaskStatus,
  useScenarioTask,
  verdictLabel,
} from "./scenario-shared";
import "../dossiers.css";

export default function DossierWorkspace() {
  const { id } = useParams();
  const imported = useLocation().pathname.startsWith("/imports/");
  return id ? <DossierPage id={id} imported={imported} /> : <DossierLibrary />;
}
function DossierLibrary() {
  const navigate = useNavigate(),
    [text, setText] = useState(""),
    [fileError, setFileError] = useState("");
  const analyses = useQuery({
      queryKey: ["analyses"],
      staleTime: 0,
      queryFn: ({ signal }) => api("/analyses", AnalysisList, signal),
    }),
    imports = useQuery({
      queryKey: ["imports"],
      staleTime: 0,
      queryFn: ({ signal }) => api("/imports", BundleImportList, signal),
    });
  const preview = useScenarioTask(ImportBundlePreview),
    commit = useScenarioTask(BundleImportRecord),
    body = { bundle: text };
  const current =
    preview.signature ===
    JSON.stringify({ path: "/imports/bundle/preview", body })
      ? preview.data
      : null;
  return (
    <div className="dossier-workspace page-width">
      <p className="eyebrow">Reproducible research</p>
      <h1>Frozen dossiers.</h1>
      <p>
        Exact inputs, source rights and decisions. Portable replay without a
        model or network.
      </p>
      <div className="dossier-columns">
        <section>
          <h2>Saved analyses</h2>
          {analyses.isPending ? (
            <p role="status">Loading analyses…</p>
          ) : analyses.isError ? (
            <p role="alert">
              Analyses unavailable.{" "}
              <button onClick={() => void analyses.refetch()}>
                Retry analyses
              </button>
            </p>
          ) : analyses.data.items.length ? (
            analyses.data.items.map((r) => (
              <article key={r.id}>
                <Link to={`/analyses/${r.id}`}>{r.name}</Link>
                <p>
                  {r.kind.replaceAll("_", " ")} /{" "}
                  {new Date(r.createdAt).toLocaleString()}
                </p>
              </article>
            ))
          ) : (
            <p>
              No frozen analysis yet. Open a case, evaluate or audit, then save
              a frozen analysis.
            </p>
          )}
          <Link to="/cases">Open case library</Link>
          <h2>Isolated imports</h2>
          {imports.isError ? (
            <p role="alert">
              Imports unavailable.{" "}
              <button onClick={() => void imports.refetch()}>
                Retry imports
              </button>
            </p>
          ) : imports.data?.items.length ? (
            imports.data.items.map((r) => (
              <article key={r.id}>
                <Link to={`/imports/${r.id}`}>{r.title}</Link>
                <p>Separate namespace / original identifiers preserved</p>
              </article>
            ))
          ) : (
            <p>No dossier has been imported.</p>
          )}
        </section>
        <section>
          <h2>Validate a dossier</h2>
          <p>
            Import original JSON. It is checked and replayed before any isolated
            record is stored. Existing cases remain untouched.
          </p>
          <label>
            Choose dossier JSON
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 30_000_000) {
                  setFileError(
                    "The file exceeds the 30 MB browser import limit.",
                  );
                  return;
                }
                void file
                  .text()
                  .then((v) => {
                    setText(v);
                    setFileError("");
                  })
                  .catch(() => setFileError("The file could not be read."));
              }}
            />
          </label>
          <label>
            Dossier JSON
            <textarea
              value={text}
              rows={8}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
            />
          </label>
          {fileError ? <p role="alert">{fileError}</p> : null}
          <button
            className="primary-button"
            disabled={!text || preview.busy}
            onClick={() => void preview.run("/imports/bundle/preview", body)}
          >
            Validate and replay preview
          </button>
          <TaskStatus task={preview} />
          {current ? (
            <div className="dossier-notice">
              <h3>{current.title}</h3>
              <p>
                {current.caseCount} case revision(s), {current.assertionCount}{" "}
                structured assertions, {current.omittedSourceCount} original
                text(s) omitted.
              </p>
              <p>Offline decision replay: {current.receipt.status}</p>
              <ul>
                {current.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
              <button
                className="secondary-button"
                disabled={commit.busy}
                onClick={async () => {
                  const result = await commit.run("/imports/bundle", body);
                  if (result) navigate(`/imports/${result.id}`);
                }}
              >
                Store isolated dossier
              </button>
            </div>
          ) : null}
          <TaskStatus task={commit} />
          {commit.data ? (
            <Link to={`/imports/${commit.data.id}`}>Open isolated dossier</Link>
          ) : null}
        </section>
      </div>
    </div>
  );
}
function DossierPage({ id, imported }: { id: string; imported: boolean }) {
  const cache = useQueryClient();
  const local = useQuery({
      queryKey: ["dossier", id],
      enabled: !imported,
      queryFn: ({ signal }) =>
        api(`/analyses/${id}/dossier`, DossierBundleV1, signal),
    }),
    isolated = useQuery({
      queryKey: ["import", id],
      enabled: imported,
      queryFn: ({ signal }) =>
        api(`/imports/${id}`, ImportedBundleResponse, signal),
    });
  const query = imported ? isolated : local,
    b = imported ? isolated.data?.bundle : local.data;
  const replay = useScenarioTask(ReplayReceipt),
    copy = useScenarioTask(SaveResponse);
  if (query.isPending)
    return (
      <div className="state-panel" role="status">
        Loading immutable dossier…
      </div>
    );
  if (query.isError || !b)
    return (
      <div className="state-panel" role="alert">
        Dossier could not be opened.{" "}
        {query.error instanceof Error ? query.error.message : ""}{" "}
        <button onClick={() => void query.refetch()}>Retry dossier</button>
        <Link to="/analyses">Dossier library</Link>
      </div>
    );
  const d = b.scientific.corpus,
    proof = {
      assertions: d.assertions,
      spans: d.spans.filter(
        (s) => b.sources.find((r) => r.id === s.sourceRevisionId)?.textIncluded,
      ),
      sources: d.sources,
      sourceRevisions: d.sourceRevisions.filter(
        (r) => b.sources.find((s) => s.id === r.id)?.textIncluded,
      ),
    };
  return (
    <div className="dossier-workspace page-width">
      <div className="breadcrumbs">
        <Link to="/analyses">Dossiers</Link>
        <span>/</span>
        <span>{imported ? "Isolated import" : "Frozen analysis"}</span>
      </div>
      <p className="eyebrow">Pinned evidence chain</p>
      <h1>{b.title}</h1>
      <p>
        {b.kind.replaceAll("_", " ")} / policy {b.scientific.policy.version} /{" "}
        {b.engineVersion}
      </p>
      <div className="dossier-notice">
        <strong>
          {imported
            ? "Untrusted imported research data."
            : "Source checks and assumptions preserved."}
        </strong>
        <p>
          {imported
            ? "Declared reviewers and source identities are not authenticated. Original IDs live in an isolated namespace; existing cases are unchanged."
            : "This dossier preserves the saved analysis, including unknowns and explicit hypotheses. A source correspondence does not establish clinical efficacy."}
        </p>
      </div>
      <div className="dossier-actions">
        {!imported ? (
          <>
            <a
              className="primary-button"
              href={`/api/v1/analyses/${id}/export?format=json`}
              download
            >
              Download replay JSON
            </a>
            <a
              className="secondary-button"
              href={`/api/v1/analyses/${id}/export?format=html`}
              download
            >
              Download readable HTML
            </a>
            {(["csl-json", "bibtex", "ris"] as const).map((format) => (
              <a
                key={format}
                className="secondary-button"
                href={`/api/v1/analyses/${id}/references?format=${format}`}
                download
              >
                Download{" "}
                {format === "csl-json"
                  ? "CSL-JSON"
                  : format === "bibtex"
                    ? "BibTeX"
                    : "RIS"}
              </a>
            ))}
          </>
        ) : (
          <button
            className="primary-button"
            disabled={replay.busy}
            onClick={() => void replay.run(`/imports/${id}/replay`, {})}
          >
            Replay isolated dossier
          </button>
        )}
      </div>
      <TaskStatus task={replay} />
      {replay.data ? (
        <p role="status">
          Scientific result reproduced:{" "}
          <span className="hash">{replay.data.scientificResultHash}</span>
        </p>
      ) : null}
      <section>
        <h2>Scientific fingerprint</h2>
        <dl>
          <dt>Result hash</dt>
          <dd className="hash">{b.scientificResultHash}</dd>
          <dt>Scientific input hash</dt>
          <dd className="hash">{b.scientificPayloadHash}</dd>
          <dt>Export integrity hash</dt>
          <dd className="hash">{b.bundleHash}</dd>
        </dl>
        <p>
          Timestamped file integrity is separate from scientific results.
          Omitted originals cannot be independently text-hash verified here.
        </p>
      </section>
      <DecisionSummary bundle={b} />
      <section>
        <h2>Assumptions and limitations</h2>
        <ul>
          {b.limitations.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
        <details>
          <summary>Exact frozen request</summary>
          <pre>{JSON.stringify(b.scientific.request, null, 2)}</pre>
        </details>
        <details>
          <summary>All scientific decisions</summary>
          <pre>{JSON.stringify(b.scientific.result, null, 2)}</pre>
        </details>
      </section>
      <section>
        <h2>Source chain and rights</h2>
        {b.sources.map((item) => {
          const rev = d.sourceRevisions.find((r) => r.id === item.id)!,
            source = d.sources.find((s) => s.id === rev.sourceId)!;
          return (
            <article key={item.id}>
              <h3>{source.title}</h3>
              <p>
                {source.creators.join("; ")} / {source.edition}
              </p>
              <p>
                {rev.rights.credit} / {rev.rights.license}
              </p>
              <span className="badge amber">
                {item.textIncluded
                  ? "Included original text verified"
                  : "Original text omitted"}
              </span>
              <p>{item.reason}</p>
              <p className="hash">
                Original text SHA-256: {item.originalTextHash}
              </p>
              <a
                href={source.canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Original source reference ↗
              </a>
              {item.textIncluded ? (
                <SourceProof
                  proof={proof}
                  assertionIds={d.assertions
                    .filter((a) =>
                      a.references.some(
                        (r) =>
                          r.kind === "span" &&
                          d.spans.some(
                            (s) =>
                              s.id === r.spanId &&
                              s.sourceRevisionId === item.id,
                          ),
                      ),
                    )
                    .map((a) => a.id)}
                  title="Inspect exact source passages"
                />
              ) : null}
            </article>
          );
        })}
      </section>
      {imported && d.cases.length ? (
        <section>
          <h2>Continue as a new local draft</h2>
          <p>
            This copies an included primary passage through the normal import
            workflow. Original bundle IDs and declared reviews are never
            promoted to local accepted evidence.
          </p>
          {d.cases
            .filter(
              (c, i, all) =>
                !all.some(
                  (x, j) => j !== i && x.id === c.id && x.revision > c.revision,
                ),
            )
            .map((c) => {
              const rev = d.sourceRevisions.find(
                (r) => r.id === c.primarySourceRevisionId,
              )!;
              const allowed =
                b.sources.find((s) => s.id === rev.id)?.textIncluded &&
                rev.displayText.length <= 50000;
              return (
                <article key={c.contentHash}>
                  <strong>{c.title}</strong>
                  {allowed ? (
                    <button
                      className="secondary-button"
                      disabled={copy.busy}
                      onClick={async () => {
                        const saved = await copy.run(
                          `/imports/${id}/editable-copy`,
                          {
                            requestId: crypto.randomUUID(),
                            caseId: c.id,
                          },
                        );
                        if (saved) {
                          void cache.invalidateQueries({ queryKey: ["cases"] });
                          void cache.invalidateQueries({
                            queryKey: ["health"],
                          });
                        }
                      }}
                    >
                      Create editable copy
                    </button>
                  ) : (
                    <p>
                      Editable copy unavailable: the original is omitted or
                      exceeds the passage limit. Import an authorized passage
                      from the case library.
                    </p>
                  )}
                </article>
              );
            })}
          <TaskStatus task={copy} />
          {copy.data ? (
            <Link to={`/cases/${copy.data.result.case.id}/material`}>
              Open new draft material workspace
            </Link>
          ) : null}
        </section>
      ) : null}
      <section>
        <h2>Reference metadata</h2>
        <p>
          CSL-JSON retains literal creators/roles and supplied identifiers.
          BibTeX/RIS may lose creator roles, date precision, unknown dates, or
          source-specific fields; the dossier preserves the full source records.
          Bibliographic independent review remains pending. No full-text
          resolver is used.
        </p>
        {d.bibliography.map((r) => (
          <article key={r.id}>
            <h3>{r.title}</h3>
            <p>
              {r.creators.map((c) => `${c.name} (${c.role})`).join("; ")} /{" "}
              {r.issued}
            </p>
            <p>
              {Object.entries(r.identifiers)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ")}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
function DecisionSummary({ bundle }: { bundle: DossierData }) {
  const value = bundle.scientific.result as Record<string, unknown>,
    rows = z.array(ComparisonResult).safeParse(value.results),
    audit = ScenarioAuditResponse.shape.audit.safeParse(value.audit),
    unitLabel = (id: string) =>
      bundle.scientific.corpus.evidenceUnits.find((u) => u.id === id)
        ?.armLabel ?? id;
  return (
    <section>
      <h2>Decision summary</h2>
      {rows.success ? (
        rows.data.map((r) => (
          <article key={r.id}>
            <h3>{unitLabel(r.evidenceUnitId)}</h3>
            <strong>{verdictLabel[r.materialComparison.verdict]}</strong>
            <p>
              Context: {r.contextComparison.verdict.replaceAll("_", " ")}.
              Reported observation remains separate.
            </p>
            <details>
              <summary>Dimension findings</summary>
              <ul>
                {r.materialComparison.dimensions.map((d) => (
                  <li key={d.dimension}>
                    {d.dimension.replaceAll("_", " ")}: {d.state} /{" "}
                    {d.reasonCodes.join(", ").replaceAll("_", " ")}
                  </li>
                ))}
              </ul>
            </details>
          </article>
        ))
      ) : audit.success ? (
        <>
          <p>
            {audit.data.worldCount} exact world(s).{" "}
            {audit.data.domainLimitation}
          </p>
          {audit.data.units.map((u) => (
            <article key={u.evidenceUnitId}>
              <h3>{unitLabel(u.evidenceUnitId)}</h3>
              <p>
                {u.status.replaceAll("_", " ")} / strictly comparable in{" "}
                {u.comparableWorldCount} of {audit.data.worldCount} worlds.
              </p>
            </article>
          ))}
        </>
      ) : value.verdict ? (
        <p>{verdictLabel[String(value.verdict)]}</p>
      ) : (
        <p>
          Before/after results, recomputed-unchanged comparisons and
          correspondence changes are preserved in the full scientific decisions
          below.
        </p>
      )}
    </section>
  );
}
