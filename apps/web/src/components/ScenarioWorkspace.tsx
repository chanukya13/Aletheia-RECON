import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  useBeforeUnload,
  useBlocker,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  AnalysisList,
  AnalysisRecord,
  AuditRequest,
  CaseResponse,
  DiffResponse,
  DomainPreview,
  InterpretationDomain,
  ScenarioAuditResponse,
  ScenarioEvaluation,
  ScenarioList,
  ScenarioRecord,
  StudyList,
  type CaseData,
  type DomainData,
  type ScenarioInputData,
} from "@recon/contracts";
import { api } from "../api";
import { Dialog } from "./Dialog";
import { DEFAULT_ACTOR, assertionLabel } from "./curation-shared";
import {
  CorrespondenceTable,
  SourceProof,
  TaskStatus,
  useScenarioTask,
  verdictLabel,
  type Proof,
} from "./scenario-shared";
import "../curation.css";
import "../scenarios.css";
type EvaluationData = z.infer<typeof ScenarioEvaluation>;
type AuditData = z.infer<typeof ScenarioAuditResponse>;
export default function ScenarioRoute() {
  const { id = "" } = useParams(),
    [params] = useSearchParams(),
    revision = params.get("revision");
  const record = useQuery({
      queryKey: ["case", id, revision],
      queryFn: ({ signal }) =>
        api(
          `/cases/${id}${revision ? `?revision=${revision}` : ""}`,
          CaseResponse,
          signal,
        ),
    }),
    domain = useQuery({
      queryKey: ["domain", id, revision],
      queryFn: ({ signal }) =>
        api(
          `/cases/${id}/interpretation-domain${revision ? `?revision=${revision}&selection=pinned` : ""}`,
          InterpretationDomain,
          signal,
        ),
    }),
    studies = useQuery({
      queryKey: ["studies"],
      queryFn: ({ signal }) => api("/studies", StudyList, signal),
    });
  if (record.isPending || domain.isPending || studies.isPending)
    return (
      <div className="state-panel" role="status">
        Loading pinned interpretation workspace…
      </div>
    );
  if (record.isError || domain.isError || studies.isError)
    return (
      <div className="state-panel" role="alert">
        Interpretation workspace could not be loaded.{" "}
        <button
          className="secondary-button"
          onClick={() => {
            void record.refetch();
            void domain.refetch();
            void studies.refetch();
          }}
        >
          Retry workspace
        </button>
      </div>
    );
  return (
    <ScenarioEditor
      key={`${record.data.case.contentHash}-${domain.data.context.policyHash}-${params.get("candidate") ?? ""}-${params.get("study") ?? ""}`}
      data={record.data}
      domain={domain.data}
      studies={studies.data}
      initialCandidateId={params.get("candidate")}
      initialStudyId={params.get("study")}
    />
  );
}
function ScenarioEditor({
  data,
  domain,
  studies,
  initialCandidateId,
  initialStudyId,
}: {
  data: CaseData;
  domain: DomainData;
  studies: z.infer<typeof StudyList>;
  initialCandidateId: string | null;
  initialStudyId: string | null;
}) {
  const id = data.case.id,
    context = domain.context,
    cache = useQueryClient();
  const baseline: ScenarioInputData = {
    ...data.case.baselineScenarioInput,
    rationale:
      data.case.baselineScenarioInput.rationale || "Unresolved saved baseline.",
  };
  const candidate = data.candidates.find(
    (c) => c.id === initialCandidateId && c.status !== "rejected",
  );
  const initialScenario = structuredClone(baseline);
  if (candidate)
    initialScenario.assignments = [
      ...initialScenario.assignments.filter(
        (a) => a.occurrenceId !== candidate.occurrenceId,
      ),
      { occurrenceId: candidate.occurrenceId, candidateId: candidate.id },
    ];
  const initialName = candidate
    ? `${data.case.title} / ${candidate.proposedName} interpretation`.slice(
        0,
        100,
      )
    : "Interpretation notebook";
  const initialEvidenceIds = studies.evidenceUnits
    .filter(
      (u) =>
        u.studyId === initialStudyId &&
        data.case.evidenceUnitIds.includes(u.id),
    )
    .map((u) => u.id);
  const [scenario, setScenario] = useState<ScenarioInputData>(
      () => initialScenario,
    ),
    [baselineForDiff, setBaselineForDiff] = useState<ScenarioInputData>(() =>
      structuredClone(baseline),
    ),
    [name, setName] = useState(initialName),
    [savedId, setSavedId] = useState<string | null>(null),
    [savedRevision, setSavedRevision] = useState(0),
    [savedSignature, setSavedSignature] = useState(() =>
      JSON.stringify({ scenario: initialScenario, name: initialName }),
    ),
    [actorName, setActorName] = useState(DEFAULT_ACTOR.name),
    [actorRole, setActorRole] = useState(DEFAULT_ACTOR.qualification),
    [evidenceIds, setEvidenceIds] = useState(
      initialEvidenceIds.length
        ? initialEvidenceIds
        : data.case.evidenceUnitIds,
    ),
    [mode, setMode] = useState<"reviewed" | "draft_exploration">("reviewed"),
    [selections, setSelections] = useState<
      z.infer<typeof AuditRequest>["selections"]
    >([]),
    [subsetRationale, setSubsetRationale] = useState(""),
    [constraints, setConstraints] = useState<
      z.infer<typeof AuditRequest>["constraints"]
    >([]),
    [target, setTarget] = useState<z.infer<typeof AuditRequest>["target"]>(
      "material_verdict_vector",
    ),
    [targetDimension, setTargetDimension] =
      useState<z.infer<typeof AuditRequest>["targetDimension"]>("identity"),
    [snapshotName, setSnapshotName] = useState(
      "Pinned interpretation analysis",
    ),
    [frozen, setFrozen] = useState<z.infer<typeof AnalysisRecord> | null>(null);
  const saved = useQuery({
      queryKey: ["scenarios", id],
      queryFn: ({ signal }) =>
        api(`/cases/${id}/scenarios`, ScenarioList, signal),
    }),
    analyses = useQuery({
      queryKey: ["analyses"],
      queryFn: ({ signal }) => api("/analyses", AnalysisList, signal),
    });
  const evaluation = useScenarioTask(ScenarioEvaluation),
    diff = useScenarioTask(DiffResponse),
    preview = useScenarioTask(DomainPreview),
    audit = useScenarioTask(ScenarioAuditResponse),
    save = useScenarioTask(ScenarioRecord),
    freeze = useScenarioTask(AnalysisRecord);
  const dirty = JSON.stringify({ scenario, name }) !== savedSignature;
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
  );
  useBeforeUnload(
    useCallback(
      (event) => {
        if (dirty) {
          event.preventDefault();
          event.returnValue = "";
        }
      },
      [dirty],
    ),
  );
  const saveKey = useRef({ signature: "", id: "" });
  const saveBody = {
    actor: { name: actorName, qualification: actorRole, mode: "draft" },
    context,
    name,
    scenario,
    expectedRevision: savedRevision,
    ...(savedId ? { id: savedId } : {}),
  };
  const evaluationBody = { context, scenario, evidenceUnitIds: evidenceIds },
    evaluationPath = `/cases/${id}/scenario-evaluate`,
    auditBody = {
      context,
      mode,
      scenario,
      selections,
      constraints,
      subsetRationale,
      evidenceUnitIds: evidenceIds,
      target,
      targetDimension:
        target === "named_dimension_vector" ? targetDimension : null,
    };
  const evaluated =
    evaluation.signature ===
    JSON.stringify({ path: evaluationPath, body: evaluationBody })
      ? evaluation.data
      : null;
  const audited =
    audit.signature ===
    JSON.stringify({ path: `/cases/${id}/robustness`, body: auditBody })
      ? audit.data
      : null;
  const previewed =
    preview.signature ===
    JSON.stringify({ path: `/cases/${id}/domain-preview`, body: auditBody })
      ? preview.data
      : null;
  const diffBody = {
    context,
    before: baselineForDiff,
    after: scenario,
    evidenceUnitIds: evidenceIds,
  };
  const differenced =
    diff.signature ===
    JSON.stringify({ path: `/cases/${id}/scenario-diff`, body: diffBody })
      ? diff.data
      : null;
  const activeRun =
    audited?.runHash ?? differenced?.runHash ?? evaluated?.runHash;
  useEffect(() => {
    if (!save.data) return;
    setSavedId(save.data.id);
    setSavedRevision(save.data.revision);
    setSavedSignature(
      JSON.stringify({ scenario: save.data.scenario, name: save.data.name }),
    );
    void cache.invalidateQueries({ queryKey: ["scenarios", id] });
  }, [save.data, cache, id]);
  useEffect(() => {
    if (freeze.data) void cache.invalidateQueries({ queryKey: ["analyses"] });
  }, [freeze.data, cache]);
  const unitLabel = (key: string) =>
    studies.evidenceUnits.find((u) => u.id === key)?.armLabel ?? key;
  const groupLabel = (key: string) =>
    domain.groups.find((g) => g.id === key)?.label ?? key;
  const selectCandidate = (occurrenceId: string, candidateId: string) =>
    setScenario((s) => ({
      ...s,
      assignments: s.assignments
        .filter((a) => a.occurrenceId !== occurrenceId)
        .concat(candidateId ? [{ occurrenceId, candidateId }] : []),
    }));
  const load = (record: z.infer<typeof ScenarioRecord>) => {
    if (
      dirty &&
      !window.confirm("Replace the unsaved editor with this saved scenario?")
    )
      return;
    if (save.busy) return;
    if (record.context.caseHash !== context.caseHash) {
      window.open(
        `/cases/${id}/interpretations?revision=${record.context.caseRevision}`,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }
    setScenario(structuredClone(record.scenario));
    save.clear();
    setName(record.name);
    const samePins =
      record.context.corpusRevision === context.corpusRevision &&
      record.context.policyHash === context.policyHash;
    setSavedId(samePins ? record.id : null);
    setSavedRevision(samePins ? record.revision : 0);
    if (!samePins) setName(`${record.name} fork`.slice(0, 100));
    setSavedSignature(
      JSON.stringify({ scenario: record.scenario, name: record.name }),
    );
  };
  return (
    <div className="scenario-workspace page-width">
      <div className="breadcrumbs">
        <Link to="/cases">Case library</Link>
        <span>/</span>
        <span>{data.case.title}</span>
      </div>
      <section className="workspace-heading">
        <div>
          <p className="eyebrow">Exact interpretation audit</p>
          <h1>{data.case.title}</h1>
          <p>
            Trace assumptions to evidence. Investigate changes and genuine
            invariance.
          </p>
        </div>
        <span className="badge amber">
          {dirty
            ? "Unsaved scenario edits"
            : savedId
              ? `Saved scenario r${savedRevision}`
              : candidate
                ? "Prepared interpretation"
                : "Saved-case baseline"}
        </span>
      </section>
      <nav className="workspace-tabs" aria-label="Case workspace">
        <Link to={`/cases/${id}/source`}>Source record</Link>
        <Link to={`/cases/${id}/material`}>Material & interpretations</Link>
        <Link to={`/cases/${id}/evidence`}>Evidence audit</Link>
        <span className="active-tab">Scenarios & robustness</span>
        <Link to="/materials/compare">Compare material versions</Link>
      </nav>
      <div className="capability-note">
        <strong>Interpretations remain assumptions.</strong>
        <p>
          Choose what to test; RECON keeps your assumptions separate from source
          facts.
        </p>
        <details>
          <summary>Scope and scientific limits</summary>
          <p>
            {domain.limitation} All runs pin case r{context.caseRevision},
            corpus and policy hashes. A count of worlds is not a probability.
          </p>
        </details>
      </div>
      <div className="scenario-layout">
        <section className="scenario-editor">
          <h2>Scenario editor</h2>
          <label>
            Scenario name
            <input
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          {data.material.componentSlots
            .filter((slot) =>
              slot.candidateIds.some((candidateId) =>
                data.candidates.some(
                  (candidate) =>
                    candidate.id === candidateId &&
                    candidate.status !== "rejected",
                ),
              ),
            )
            .map((slot) => (
              <fieldset key={slot.id}>
                <legend>
                  {data.assertions.find((a) => a.id === slot.termAssertionId)
                    ?.state === "recorded"
                    ? String(
                        (
                          data.assertions.find(
                            (a) => a.id === slot.termAssertionId,
                          ) as { value: unknown }
                        ).value,
                      )
                    : slot.id}
                </legend>
                <label>
                  Identity interpretation
                  <select
                    aria-label={`Identity interpretation ${slot.id}`}
                    value={
                      scenario.assignments.find(
                        (a) => a.occurrenceId === slot.id,
                      )?.candidateId ?? ""
                    }
                    onChange={(e) => selectCandidate(slot.id, e.target.value)}
                  >
                    <option value="">Keep unresolved</option>
                    {data.candidates
                      .filter(
                        (c) =>
                          slot.candidateIds.includes(c.id) &&
                          c.status !== "rejected",
                      )
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.proposedName} / {c.status.replaceAll("_", " ")}
                        </option>
                      ))}
                  </select>
                </label>
                {data.candidates
                  .filter((c) => slot.candidateIds.includes(c.id))
                  .map((c) => (
                    <SourceProof
                      key={c.id}
                      proof={data}
                      assertionIds={c.supportAssertionIds}
                      title={`Source basis: ${c.proposedName}`}
                    />
                  ))}
              </fieldset>
            ))}
          <p className="form-hint">
            Other recorded ingredients remain in the audit.{" "}
            <Link to={`/cases/${id}/material`}>
              Inspect all material details
            </Link>
            .
          </p>
          <label>
            Scenario rationale
            <textarea
              value={scenario.rationale}
              rows={3}
              maxLength={1000}
              onChange={(e) =>
                setScenario((s) => ({ ...s, rationale: e.target.value }))
              }
            />
          </label>
          <HypothesisEditor
            data={data}
            scenario={scenario}
            onChange={setScenario}
          />
          <details>
            <summary>Save attribution</summary>
            <label>
              Recorded by
              <input
                value={actorName}
                maxLength={100}
                onChange={(e) => setActorName(e.target.value)}
              />
            </label>
            <label>
              Role / qualification
              <input
                value={actorRole}
                maxLength={300}
                onChange={(e) => setActorRole(e.target.value)}
              />
            </label>
            <p className="form-hint">
              Saving a scenario does not accept source claims or authenticate an
              identity.
            </p>
          </details>
          <div className="form-actions">
            <button
              className="secondary-button"
              disabled={save.busy}
              onClick={() => {
                save.clear();
                setScenario(structuredClone(baseline));
                setBaselineForDiff(structuredClone(baseline));
                setSavedId(null);
                setSavedRevision(0);
                setName("Interpretation notebook");
                setSavedSignature(
                  JSON.stringify({
                    scenario: baseline,
                    name: "Interpretation notebook",
                  }),
                );
              }}
            >
              Reset to saved-case baseline
            </button>
            <button
              className="primary-button"
              disabled={save.busy}
              onClick={() => {
                const signature = JSON.stringify(saveBody);
                if (saveKey.current.signature !== signature)
                  saveKey.current = { signature, id: crypto.randomUUID() };
                void save.run(`/cases/${id}/scenarios`, {
                  requestId: saveKey.current.id,
                  ...saveBody,
                });
              }}
            >
              Save scenario revision
            </button>
            <button
              className="secondary-button"
              disabled={!savedId || save.busy}
              onClick={() => {
                save.clear();
                setSavedId(null);
                setSavedRevision(0);
                setName(`${name} fork`.slice(0, 100));
              }}
            >
              Fork as new scenario
            </button>
          </div>
          <TaskStatus task={save} />
          {save.data ? (
            <p role="status">
              Saved scenario revision {save.data.revision}. Earlier revisions
              remain immutable.
            </p>
          ) : null}
          <h3>Saved scenario history</h3>
          {saved.isError ? (
            <p role="alert">Scenario history unavailable.</p>
          ) : saved.data?.items.length ? (
            saved.data.items.map((record) => (
              <article
                className="saved-scenario"
                key={`${record.id}.${record.revision}`}
              >
                <strong>
                  {record.name} / r{record.revision}
                </strong>
                <p>
                  {record.kind.replaceAll("_", " ")} / case r
                  {record.context.caseRevision}
                </p>
                <button
                  className="text-button"
                  disabled={save.busy}
                  onClick={() => load(record)}
                >
                  Load {record.name} r{record.revision}
                </button>
              </article>
            ))
          ) : (
            <p className="form-hint">No named scenario has been saved.</p>
          )}
        </section>
        <section className="scenario-results">
          <h2>Select tested evidence</h2>
          <p className="form-hint">
            Each checked record is a formulation × assay, not an independent
            paper.
          </p>
          <details open>
            <summary>Evidence selection ({evidenceIds.length})</summary>
            <div className="scenario-evidence">
              {studies.evidenceUnits.map((u) => (
                <label className="checkbox-label" key={u.id}>
                  <input
                    type="checkbox"
                    checked={evidenceIds.includes(u.id)}
                    onChange={(e) =>
                      setEvidenceIds((ids) =>
                        e.target.checked
                          ? [...ids, u.id]
                          : ids.filter((id) => id !== u.id),
                      )
                    }
                  />
                  {u.armLabel}
                </label>
              ))}
            </div>
          </details>
          <div className="form-actions">
            <button
              className="primary-button"
              disabled={!evidenceIds.length || evaluation.busy}
              onClick={() =>
                void evaluation.run(evaluationPath, evaluationBody)
              }
            >
              Evaluate this scenario
            </button>
            <button
              className="secondary-button"
              disabled={!evidenceIds.length || diff.busy}
              onClick={() =>
                void diff.run(`/cases/${id}/scenario-diff`, diffBody)
              }
            >
              Compare with reference
            </button>
            <button
              className="secondary-button"
              onClick={() => setBaselineForDiff(structuredClone(scenario))}
            >
              Use current input as reference
            </button>
          </div>
          <TaskStatus task={evaluation} />
          <TaskStatus task={diff} />
          {evaluated ? (
            <EvaluationPanel result={evaluated} unitLabel={unitLabel} />
          ) : null}
          {differenced ? (
            <section className="diff-panel">
              <h2>Before / after consequences</h2>
              <p>{differenced.summary}</p>
              <p>
                {differenced.diff.changed.length} changed result(s),{" "}
                {differenced.diff.recomputedUnchangedIds.length} recomputed
                unchanged, {differenced.diff.unaffectedIds.length} unaffected.
              </p>
              {differenced.diff.changed.map((row) => (
                <article key={row.resultId}>
                  <strong>{unitLabel(row.after.evidenceUnitId)}</strong>
                  <p>
                    {verdictLabel[row.before.materialComparison.verdict]} →{" "}
                    {verdictLabel[row.after.materialComparison.verdict]}
                  </p>
                  <p>
                    Changed dimensions:{" "}
                    {row.changedDimensions.join(", ") ||
                      "input provenance only"}
                  </p>
                </article>
              ))}
              <h3>Conditional name correspondence changes</h3>
              <p>
                {differenced.changedCorrespondenceUnitIds.length}{" "}
                formulation/assay correspondence(s) changed. Strict material
                verdicts may remain unchanged.
              </p>
              <CorrespondenceTable
                rows={differenced.afterCorrespondence.filter((r) =>
                  differenced.changedCorrespondenceUnitIds.includes(
                    r.evidenceUnitId,
                  ),
                )}
                proof={differenced}
                unitLabel={unitLabel}
              />
              <details>
                <summary>Source → assumption → dependent result</summary>
                <p className="form-hint">
                  {differenced.dependencyEdges.length} dependency edges
                  retained. Showing the first 50.
                </p>
                <ul>
                  {differenced.dependencyEdges.slice(0, 50).map((edge, i) => (
                    <li className="mono" key={i}>
                      {edge.from} → {edge.to}
                    </li>
                  ))}
                </ul>
              </details>
            </section>
          ) : null}
          <details className="research-disclosure scenario-advanced">
            <summary>Advanced: test alternative readings</summary>
            <section className="robustness-controls">
              <h2>Exact bounded robustness audit</h2>
              <label>
                Domain review mode
                <select
                  value={mode}
                  onChange={(e) => {
                    const mode = e.target.value as
                      | "reviewed"
                      | "draft_exploration";
                    setMode(mode);
                    setSelections(
                      domain.groups.flatMap((g) => {
                        const alternatives = g.alternatives.filter(
                          (a) =>
                            mode === "draft_exploration" || a.eligibleReviewed,
                        );
                        return alternatives.length
                          ? [
                              {
                                groupId: g.id,
                                alternativeIds: alternatives.map((a) => a.id),
                              },
                            ]
                          : [];
                      }),
                    );
                    setConstraints([]);
                  }}
                >
                  <option value="reviewed">Reviewed alternatives only</option>
                  <option value="draft_exploration">
                    Draft exploration / not a reviewed domain
                  </option>
                </select>
              </label>
              {mode === "draft_exploration" ? (
                <p className="draft-banner">
                  Exploratory source-backed drafts. Results cannot be presented
                  as reviewed-domain robustness.
                </p>
              ) : (
                <p className="form-hint">
                  Pending alternatives are excluded. Zero selected groups means
                  exactly one fixed baseline world.
                </p>
              )}
              {domain.groups.map((group) => (
                <fieldset key={group.id}>
                  <legend>{group.label}</legend>
                  {group.alternatives.map((a) => (
                    <label className="checkbox-label" key={a.id}>
                      <input
                        type="checkbox"
                        disabled={mode === "reviewed" && !a.eligibleReviewed}
                        checked={
                          selections
                            .find((s) => s.groupId === group.id)
                            ?.alternativeIds.includes(a.id) ?? false
                        }
                        onChange={(e) =>
                          setSelections((old) => {
                            const selected =
                              old.find((s) => s.groupId === group.id)
                                ?.alternativeIds ?? [];
                            const ids = e.target.checked
                              ? [...selected, a.id]
                              : selected.filter((id) => id !== a.id);
                            return old
                              .filter((s) => s.groupId !== group.id)
                              .concat(
                                ids.length
                                  ? [{ groupId: group.id, alternativeIds: ids }]
                                  : [],
                              );
                          })
                        }
                      />
                      {a.label} / {a.reviewState}
                    </label>
                  ))}
                  <SourceProof
                    proof={data}
                    assertionIds={group.alternatives.flatMap(
                      (a) => a.supportAssertionIds,
                    )}
                    title={`Inspect ${group.label} alternatives`}
                  />
                </fieldset>
              ))}
              <label>
                Subset rationale
                <textarea
                  value={subsetRationale}
                  rows={2}
                  maxLength={1000}
                  onChange={(e) => setSubsetRationale(e.target.value)}
                  placeholder="Required when excluding alternatives from a selected group…"
                />
              </label>
              <ConstraintEditor
                domain={domain}
                constraints={constraints}
                onChange={setConstraints}
                disabled={mode === "reviewed"}
              />
              <label>
                Clarification target
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value as typeof target)}
                >
                  <option value="material_verdict_vector">
                    Strict material verdicts
                  </option>
                  <option value="conditional_identity_vector">
                    Conditional reported-name correspondence
                  </option>
                  <option value="named_dimension_vector">
                    Named strict dimension
                  </option>
                </select>
              </label>
              {target === "named_dimension_vector" ? (
                <label>
                  Target dimension
                  <select
                    value={targetDimension ?? "identity"}
                    onChange={(e) =>
                      setTargetDimension(
                        e.target.value as typeof targetDimension,
                      )
                    }
                  >
                    {[
                      "identity",
                      "composition",
                      "part_state",
                      "preparation",
                      "processing_order",
                      "contact",
                      "maturation_thermal",
                      "quantity",
                      "characterization",
                    ].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              <div className="form-actions">
                <button
                  className="secondary-button"
                  disabled={!evidenceIds.length || preview.busy}
                  onClick={() =>
                    void preview.run(`/cases/${id}/domain-preview`, auditBody)
                  }
                >
                  Preview exact domain
                </button>
                <button
                  className="primary-button"
                  disabled={!previewed || audit.busy}
                  onClick={() =>
                    void audit.run(`/cases/${id}/robustness`, auditBody)
                  }
                >
                  Audit all selected alternatives
                </button>
              </div>
              <TaskStatus task={preview} />
              <TaskStatus task={audit} />
              {previewed ? (
                <p role="status">
                  {previewed.worldCount} admissible world(s) /{" "}
                  {previewed.rawWorldCount} raw combinations.{" "}
                  {previewed.excludedAlternatives.length} alternative(s)
                  excluded by subset choice. {previewed.limitation}
                </p>
              ) : null}
            </section>
          </details>
          {audited ? (
            <AuditPanel
              result={audited}
              unitLabel={unitLabel}
              groupLabel={groupLabel}
            />
          ) : null}
          <section className="freeze-panel">
            <h2>Freeze an analysis</h2>
            <p>
              Freeze the current server-computed result with its exact inputs,
              source closure and policy/corpus pins.
            </p>
            <label>
              Analysis name
              <input
                value={snapshotName}
                maxLength={100}
                onChange={(e) => setSnapshotName(e.target.value)}
              />
            </label>
            <button
              className="secondary-button"
              disabled={!activeRun || freeze.busy}
              onClick={() =>
                void freeze.run("/analyses", {
                  requestId: crypto.randomUUID(),
                  runHash: activeRun!,
                  name: snapshotName,
                })
              }
            >
              Save frozen analysis
            </button>
            <TaskStatus task={freeze} />
            {freeze.data ? (
              <div role="status">
                <p>Frozen analysis saved: {freeze.data.name}</p>
                <Link to={`/analyses/${freeze.data.id}`}>
                  Open dossier and downloads
                </Link>
              </div>
            ) : null}
            <h3>Saved analyses</h3>
            {analyses.data?.items.map((record) => (
              <p key={record.id}>
                <Link to={`/analyses/${record.id}`}>
                  Dossier / {record.name}
                </Link>{" "}
                <button
                  className="text-button"
                  onClick={() => {
                    void api(`/analyses/${record.id}`, AnalysisRecord)
                      .then(setFrozen)
                      .catch(() =>
                        window.alert("Frozen analysis could not be loaded."),
                      );
                  }}
                >
                  {record.name} / {record.kind.replaceAll("_", " ")}
                </button>
              </p>
            ))}
          </section>
        </section>
      </div>
      {frozen ? (
        <FrozenAnalysis
          record={frozen}
          unitLabel={unitLabel}
          groupLabel={groupLabel}
          onClose={() => setFrozen(null)}
        />
      ) : null}
      {blocker.state === "blocked" ? (
        <Dialog title="Leave unsaved scenario?" onClose={() => blocker.reset()}>
          <p>
            These scenario edits have not been saved. Saved case/source records
            are unchanged.
          </p>
          <div className="form-actions">
            <button
              className="secondary-button"
              onClick={() => blocker.reset()}
            >
              Stay in scenario
            </button>
            <button
              className="primary-button"
              onClick={() => blocker.proceed()}
            >
              Discard and leave
            </button>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
function HypothesisEditor({
  data,
  scenario,
  onChange,
}: {
  data: CaseData;
  scenario: ScenarioInputData;
  onChange: (s: ScenarioInputData) => void;
}) {
  const eligible = data.assertions.filter(
    (a) =>
      data.material.assertionIds.includes(a.id) &&
      /^(ingredient\.(part|state)|preparation\.(duration|temperature|contact|matrix)|quantity\.)/.test(
        a.field,
      ),
  );
  const [field, setField] = useState(eligible[0]?.id ?? ""),
    [value, setValue] = useState(""),
    [unit, setUnit] = useState("day"),
    [basis, setBasis] = useState("unknown"),
    [rationale, setRationale] = useState(""),
    [error, setError] = useState("");
  const selected = eligible.find((a) => a.id === field),
    numeric = Boolean(
      selected && /duration|temperature|quantity/.test(selected.field),
    );
  return (
    <details className="hypothesis-editor">
      <summary>Explicit hypothetical field override</summary>
      <p className="form-hint">
        Overrides are conditional inputs, never source claims. They are excluded
        from documented-alternative audits.
      </p>
      <label>
        Material assertion
        <select
          aria-label="Material assertion"
          value={field}
          onChange={(e) => setField(e.target.value)}
        >
          {eligible.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label} / {a.field}
            </option>
          ))}
        </select>
      </label>
      <label>
        Hypothetical value
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type={numeric ? "number" : "text"}
          step={numeric ? "any" : undefined}
        />
      </label>
      {numeric ? (
        <>
          <label>
            Unit
            <input value={unit} onChange={(e) => setUnit(e.target.value)} />
          </label>
          <label>
            Quantity basis
            <select value={basis} onChange={(e) => setBasis(e.target.value)}>
              <option value="unknown">Unknown</option>
              <option value="mass">Mass</option>
              <option value="volume">Volume</option>
              <option value="count">Count</option>
            </select>
          </label>
        </>
      ) : null}
      <label>
        Hypothesis rationale
        <textarea
          value={rationale}
          rows={2}
          onChange={(e) => setRationale(e.target.value)}
        />
      </label>
      <button
        className="secondary-button"
        disabled={!field}
        onClick={() => {
          if (
            !value.trim() ||
            rationale.trim().length < 3 ||
            (numeric && !Number.isFinite(Number(value)))
          ) {
            setError(
              "Enter an explicit value and rationale. Missing is never zero.",
            );
            return;
          }
          setError("");
          onChange({
            ...scenario,
            hypotheticalOverrides: scenario.hypotheticalOverrides
              .filter((o) => o.field !== field)
              .concat({
                field,
                value: numeric
                  ? {
                      value: Number(value),
                      unit,
                      ...(selected?.field.startsWith("quantity.")
                        ? { basis }
                        : {}),
                    }
                  : value,
                rationale,
              }),
          });
        }}
      >
        Add hypothetical override
      </button>
      {error ? <p role="alert">{error}</p> : null}
      {scenario.hypotheticalOverrides.map((o) => (
        <article key={o.field}>
          <strong>
            {data.assertions.find((a) => a.id === o.field)?.label}
          </strong>
          <p>
            {typeof o.value === "object"
              ? JSON.stringify(o.value)
              : String(o.value)}{" "}
            / {o.rationale}
          </p>
          <button
            className="text-button"
            onClick={() =>
              onChange({
                ...scenario,
                hypotheticalOverrides: scenario.hypotheticalOverrides.filter(
                  (x) => x.field !== o.field,
                ),
              })
            }
          >
            Remove hypothesis
          </button>
        </article>
      ))}
    </details>
  );
}
function ConstraintEditor({
  domain,
  constraints,
  onChange,
  disabled,
}: {
  domain: DomainData;
  constraints: z.infer<typeof AuditRequest>["constraints"];
  onChange: (c: z.infer<typeof AuditRequest>["constraints"]) => void;
  disabled: boolean;
}) {
  const options = domain.groups.flatMap((g) =>
    g.alternatives.map((a) => ({
      groupId: g.id,
      alternativeId: a.id,
      label: `${g.label}: ${a.label}`,
    })),
  );
  const [first, setFirst] = useState(""),
    [second, setSecond] = useState(""),
    [rationale, setRationale] = useState("");
  return (
    <details>
      <summary>Explicit correlation constraints</summary>
      <p className="form-hint">
        Exclude one alternative or a pair that cannot coexist. Constraints
        require draft exploration and a rationale; they are not validated
        historical relations.
      </p>
      <label>
        Forbidden choice
        <select
          value={first}
          disabled={disabled}
          onChange={(e) => setFirst(e.target.value)}
        >
          <option value="">Choose alternative</option>
          {options.map((o, i) => (
            <option key={i} value={i}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Only when combined with (optional)
        <select
          value={second}
          disabled={disabled}
          onChange={(e) => setSecond(e.target.value)}
        >
          <option value="">Exclude the first choice alone</option>
          {options.map((o, i) => (
            <option key={i} value={i}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Constraint rationale
        <input
          value={rationale}
          disabled={disabled}
          maxLength={1000}
          onChange={(e) => setRationale(e.target.value)}
        />
      </label>
      <button
        className="secondary-button"
        disabled={
          disabled ||
          first === "" ||
          rationale.trim().length < 3 ||
          constraints.length >= 16
        }
        onClick={() => {
          const choices = [
            options[Number(first)]!,
            ...(second !== "" ? [options[Number(second)]!] : []),
          ];
          onChange([
            ...constraints,
            {
              forbidden: choices.map((o) => ({
                groupId: o.groupId,
                alternativeId: o.alternativeId,
              })),
              rationale,
            },
          ]);
        }}
      >
        Add correlation constraint
      </button>
      {constraints.map((c, i) => (
        <p key={i}>
          {c.rationale}{" "}
          <button
            className="text-button"
            onClick={() => onChange(constraints.filter((_, j) => i !== j))}
          >
            Remove constraint
          </button>
        </p>
      ))}
    </details>
  );
}
function EvaluationPanel({
  result,
  unitLabel,
}: {
  result: EvaluationData;
  unitLabel: (id: string) => string;
}) {
  return (
    <section className="scenario-evaluation">
      <h2>
        {result.kind === "hypothetical"
          ? "Conditional hypothetical evaluation"
          : "Scenario evaluation"}
      </h2>
      <p
        className={
          result.kind === "hypothetical" ? "draft-banner" : "form-hint"
        }
      >
        {result.warning}
      </p>
      <p className="mono hash">Scenario {result.scenarioHash}</p>
      {result.results.map((r) => (
        <article className="scenario-result" key={r.id}>
          <h3>{unitLabel(r.evidenceUnitId)}</h3>
          <strong>{verdictLabel[r.materialComparison.verdict]}</strong>
          <details>
            <summary>All dimension reasons and sources</summary>
            {r.materialComparison.dimensions.map((d) => (
              <div className="scenario-dimension" key={d.dimension}>
                <strong>
                  {d.dimension.replaceAll("_", " ")}: {d.state}
                </strong>
                <p>{d.reasonCodes.join(", ").replaceAll("_", " ")}</p>
                {d.hypothesisIds.length ? (
                  <p>Explicit assumptions: {d.hypothesisIds.join(", ")}</p>
                ) : null}
                <SourceProof proof={result} assertionIds={d.assertionIds} />
              </div>
            ))}
          </details>
          <p className="form-hint">
            Context: {r.contextComparison.verdict.replaceAll("_", " ")}.
            Reported outcome (unchanged):{" "}
            {assertionLabel(
              result.assertions.find(
                (a) => a.id === r.reportedOutcomeAssertionId,
              ),
            )}
            .
          </p>
        </article>
      ))}
      <details>
        <summary>Conditional reported-name correspondence</summary>
        <CorrespondenceTable
          rows={result.correspondence}
          proof={result}
          unitLabel={unitLabel}
        />
      </details>
    </section>
  );
}
function AuditPanel({
  result,
  unitLabel,
  groupLabel,
}: {
  result: Pick<
    AuditData,
    "audit" | "clarification" | "studyCoverage" | "mode" | "correspondence"
  > &
    Proof;
  unitLabel: (id: string) => string;
  groupLabel: (id: string) => string;
}) {
  const [world, setWorld] = useState(0);
  const active =
    result.audit.worlds[Math.min(world, result.audit.worlds.length - 1)]!;
  return (
    <section className="audit-panel">
      <h2>Exact audit / {result.audit.worldCount} world(s)</h2>
      <p
        className={
          result.mode === "draft_exploration" ? "draft-banner" : "form-hint"
        }
      >
        {result.audit.domainLimitation}
      </p>
      {result.audit.units.map((u) => (
        <article key={u.evidenceUnitId}>
          <strong>{unitLabel(u.evidenceUnitId)}</strong>
          <p>
            {u.status.replaceAll("_", " ")} / strictly comparable in{" "}
            {u.comparableWorldCount} of {result.audit.worldCount} worlds
          </p>
        </article>
      ))}
      <h3>Study coverage / quantifiers kept separate</h3>
      {result.studyCoverage.map((s) => (
        <article key={s.studyId}>
          <strong>{s.studyId}</strong>
          <p>
            At least one arm has conditional name correspondence in{" "}
            {s.worldsWithAnyCorrespondence} of {result.audit.worldCount} worlds.
          </p>
          <p>
            Fixed arms covering every world:{" "}
            {s.fixedCorrespondingArmIds.map(unitLabel).join("; ") || "none"}.
          </p>
          <p>
            At least one strictly comparable material in{" "}
            {s.worldsWithAnyComparableMaterial} worlds. Fixed strictly
            comparable arms: {s.fixedComparableArmIds.length}.
          </p>
        </article>
      ))}
      <label>
        Inspect enumerated world
        <select
          value={Math.min(world, result.audit.worlds.length - 1)}
          onChange={(e) => setWorld(Number(e.target.value))}
        >
          {result.audit.worlds.map((w, i) => (
            <option key={w.id} value={i}>
              World {i + 1}:{" "}
              {w.assignments.map((a) => a.candidateId).join(", ") ||
                "fixed baseline"}
            </option>
          ))}
        </select>
      </label>
      <CorrespondenceTable
        rows={
          result.correspondence.find((c) => c.worldId === active.id)?.items ??
          []
        }
        proof={result}
        unitLabel={unitLabel}
      />
      <h3>Minimal sufficient interpretation questions</h3>
      <p>
        Target: {result.clarification.target.replaceAll("_", " ")}
        {result.clarification.targetDimension
          ? ` / ${result.clarification.targetDimension}`
          : ""}
        .
      </p>
      {result.clarification.inclusionMinimalSufficientSets.map((set, i) => (
        <div className="question-set" key={i}>
          {set.length ? (
            <strong>Resolve jointly: {set.map(groupLabel).join(" + ")}</strong>
          ) : (
            <strong>
              Empty set: this target is already invariant within the selected
              domain.
            </strong>
          )}
        </div>
      ))}
      <p>
        Minimum cardinality: {result.clarification.minimumCardinality}. These
        are inclusion-minimal sufficient sets, not a prediction of biological
        benefit.
      </p>
      {result.clarification.singleGroupEffects.map((g) => (
        <p key={g.groupId}>
          {groupLabel(g.groupId)}: {g.rationale}
        </p>
      ))}
      <h3>Missing documentation / separate from questions</h3>
      {result.clarification.missingDocumentation.map((m, i) => (
        <article key={i}>
          <strong>{m.field.replaceAll("_", " ")}</strong>
          <p>
            {m.reason.replaceAll("_", " ")} / {m.dependencyCount} dependent
            comparison(s). This count is not scientific value.
          </p>
          <SourceProof
            proof={result}
            assertionIds={result.assertions
              .filter((a) =>
                a.references.some((ref) =>
                  m.sourceReferences.some(
                    (x) => JSON.stringify(x) === JSON.stringify(ref),
                  ),
                ),
              )
              .map((a) => a.id)}
            title={`Inspect missing ${m.field.replaceAll("_", " ")} documentation`}
          />
        </article>
      ))}
    </section>
  );
}
function FrozenAnalysis({
  record,
  unitLabel,
  groupLabel,
  onClose,
}: {
  record: z.infer<typeof AnalysisRecord>;
  unitLabel: (id: string) => string;
  groupLabel: (id: string) => string;
  onClose: () => void;
}) {
  const payload =
    record.payload &&
    typeof record.payload === "object" &&
    !Array.isArray(record.payload)
      ? record.payload
      : {};
  const evaluation = ScenarioEvaluation.safeParse({
    ...payload,
    runHash: record.runHash,
  });
  const audit = ScenarioAuditResponse.safeParse({
    ...payload,
    runHash: record.runHash,
    elapsedMs: 0,
  });
  return (
    <Dialog title={`Frozen analysis: ${record.name}`} onClose={onClose}>
      <p>
        Immutable {record.kind} / saved {record.createdAt}
      </p>
      <p className="mono hash">Content {record.contentHash}</p>
      <details>
        <summary>Frozen inputs and policy</summary>
        <pre className="frozen-json">
          {JSON.stringify(record.inputs, null, 2)}
        </pre>
      </details>
      {evaluation.success ? (
        <EvaluationPanel result={evaluation.data} unitLabel={unitLabel} />
      ) : audit.success ? (
        <AuditPanel
          result={audit.data}
          unitLabel={unitLabel}
          groupLabel={groupLabel}
        />
      ) : (
        <div>
          <p>
            This frozen {record.kind} record retains its exact server result and
            provenance.
          </p>
          <details>
            <summary>Inspect frozen scientific payload</summary>
            <pre className="frozen-json">
              {JSON.stringify(record.payload, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </Dialog>
  );
}
