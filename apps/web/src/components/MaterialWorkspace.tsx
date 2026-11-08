import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Link,
  useBeforeUnload,
  useBlocker,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Actor,
  CaseResponse,
  EditorSession,
  ExtractionRun,
  RevisionHistory,
  RevisionRequest,
  SaveResponse,
  type ActorData,
  type CaseData,
  type RevisionInput,
  type SpanData,
} from "@recon/contracts";
import { z } from "zod";
import { api, ApiError, mutateApi } from "../api";
import { Dialog } from "./Dialog";
import { SourceReader } from "./SourceReader";
import {
  ActorFields,
  DEFAULT_ACTOR,
  emptyDraft,
  type Draft,
} from "./curation-shared";
import { ExtractionReview } from "./ExtractionReview";
import {
  IngredientTable,
  MaterialFingerprintPanel,
  PreparationSequence,
} from "./MaterialEditor";
import { IdentityCandidateDialog } from "./IdentityCandidateDialog";
import { ManualAnnotationDialog, SpanSelector } from "./ManualAnnotationDialog";
import type { InspectedSelection } from "../adapters/SourceAnnotationAdapter";
import "../curation.css";

export default function MaterialRoute() {
  const { id = "" } = useParams(),
    [params] = useSearchParams();
  const revision = params.get("revision");
  const cache = useQueryClient();
  const [notice, setNotice] = useState("");
  const status = useRef<HTMLParagraphElement>(null);
  const query = useQuery({
    queryKey: ["case", id, revision],
    queryFn: ({ signal }) =>
      api(
        `/cases/${encodeURIComponent(id)}${revision ? `?revision=${encodeURIComponent(revision)}` : ""}`,
        CaseResponse,
        signal,
      ),
  });
  useEffect(() => {
    if (notice) status.current?.focus();
  }, [notice]);
  if (query.isPending)
    return (
      <div className="state-panel" role="status">
        Loading material record…
      </div>
    );
  if (query.isError)
    return (
      <section className="state-panel">
        <h1>Material record unavailable</h1>
        <p role="alert">{query.error.message}</p>
        <button className="primary-button" onClick={() => void query.refetch()}>
          Retry record
        </button>
        <Link className="text-button" to="/cases">
          Return to case library
        </Link>
      </section>
    );
  return (
    <>
      <p
        className={`save-announcement ${notice ? "has-notice" : ""}`}
        role="status"
        ref={status}
        tabIndex={-1}
      >
        {notice}
      </p>
      <WorkspaceEditor
        key={`${id}.${query.data.case.revision}.${revision ?? "latest"}`}
        data={query.data}
        pinned={Boolean(revision)}
        onSaved={(result) => {
          cache.setQueryData(["case", id, null], {
            ...result.result,
            selection: "latest",
          });
          void cache.invalidateQueries({ queryKey: ["cases"] });
          void cache.invalidateQueries({ queryKey: ["history", id] });
          void cache.invalidateQueries({ queryKey: ["case", id] });
          setNotice(
            `Saved revision ${result.result.case.revision}. Earlier source and case revisions are preserved.`,
          );
        }}
      />
    </>
  );
}
function loadActor(): ActorData {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem("recon.actor.v1") ?? "null",
    );
    const parsed = Actor.safeParse(
      value && typeof value === "object" ? { ...value, mode: "draft" } : null,
    );
    return parsed.success ? parsed.data : DEFAULT_ACTOR;
  } catch {
    return DEFAULT_ACTOR;
  }
}
function WorkspaceEditor({
  data,
  pinned,
  onSaved,
}: {
  data: CaseData;
  pinned: boolean;
  onSaved: (r: z.infer<typeof SaveResponse>) => void;
}) {
  const cache = useQueryClient(),
    navigate = useNavigate();
  const id = data.case.id;
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(data)),
    [rationale, setRationale] = useState(""),
    [actor, setActor] = useState(loadActor),
    [tab, setTab] = useState<
      "extraction" | "ingredients" | "preparation" | "history"
    >("extraction");
  const [sourceId, setSourceId] = useState(data.case.primarySourceRevisionId),
    [span, setSpan] = useState<SpanData | null>(null),
    [manual, setManual] = useState<InspectedSelection | null>(null),
    [candidate, setCandidate] = useState<{
      occurrence: string;
      existing?: CaseData["candidates"][number];
    } | null>(null),
    [validation, setValidation] = useState("");
  const requestKey = useRef<{ text: string; id: string } | null>(null);
  const session = useQuery({
    queryKey: ["editor-session"],
    queryFn: ({ signal }) => api("/editor-session", EditorSession, signal),
  });
  const history = useQuery({
    queryKey: ["history", id, data.case.revision],
    queryFn: ({ signal }) =>
      api(`/cases/${id}/revisions`, RevisionHistory, signal),
  });
  const runs = useQuery({
    queryKey: ["extraction", id, data.case.revision],
    queryFn: ({ signal }) =>
      api(
        `/cases/${id}/extraction-proposals?caseRevision=${data.case.revision}`,
        ExtractionRun.nullable(),
        signal,
      ),
  });
  const readOnly = pinned || !session.data?.enabled;
  const active =
    data.sourceRevisions.find((r) => r.id === sourceId) ??
    data.sourceRevisions[0]!;
  const metadata = data.sources.find((s) => s.id === active.sourceId)!;
  const run = runs.data;
  const currentRun = run?.caseRevision === data.case.revision;
  const changed =
    draft.decisions.length +
    draft.manualAnnotations.length +
    draft.fieldEdits.length +
    draft.candidateEdits.length +
    (draft.stepEdits?.length ?? 0) +
    (draft.quantityEdits?.length ?? 0);
  const assumptionsChanged =
    JSON.stringify(draft.assignments) !==
      JSON.stringify(data.case.baselineScenarioInput.assignments) ||
    draft.assignmentRationale !== data.case.baselineScenarioInput.rationale;
  const dirty =
    !readOnly && (changed > 0 || assumptionsChanged || rationale.length > 0);
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
  useEffect(() => {
    localStorage.setItem(
      "recon.actor.v1",
      JSON.stringify({ name: actor.name, qualification: actor.qualification }),
    );
  }, [actor.name, actor.qualification]);
  const extraction = useMutation({
    mutationFn: () =>
      mutateApi(
        `/cases/${id}/extraction-proposals`,
        {
          requestId: crypto.randomUUID(),
          actor,
          expectedRevision: data.case.revision,
          sourceRevisionId: active.id,
          extractorVersion: "english-preparation-v1",
        },
        ExtractionRun,
      ),
    onSuccess: (result) => {
      cache.setQueryData(["extraction", id, data.case.revision], result);
      setDraft((d) => ({ ...d, runId: result.id, decisions: [] }));
    },
  });
  const save = useMutation({
    mutationFn: (input: RevisionInput) =>
      mutateApi(`/cases/${id}/revisions`, input, SaveResponse),
    onSuccess: onSaved,
  });
  const inspect = (s: SpanData) => {
    setSourceId(s.sourceRevisionId);
    setSpan(s);
  };
  function submit() {
    setValidation("");
    const body = {
      ...draft,
      ...(draft.decisions.length && run ? { runId: run.id } : {}),
      actor,
      expectedRevision: data.case.revision,
      rationale:
        rationale ||
        "Saved explicit draft changes after inspecting the cited source records.",
    };
    const text = JSON.stringify(body);
    if (requestKey.current?.text !== text)
      requestKey.current = { text, id: crypto.randomUUID() };
    const parsed = RevisionRequest.safeParse({
      ...body,
      requestId: requestKey.current!.id,
    });
    if (!parsed.success) {
      setValidation(
        parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .slice(0, 4)
          .join(" · "),
      );
      return;
    }
    save.mutate(parsed.data);
  }
  return (
    <div className="material-workspace page-width">
      <div className="breadcrumbs">
        <Link to="/cases">Case library</Link>
        <span>/</span>
        <span>{data.case.title}</span>
      </div>
      <section className="workspace-heading">
        <div>
          <div className="heading-badges">
            <span
              className={`badge ${data.case.authenticity === "authentic" ? "teal" : ""}`}
            >
              {data.case.authenticity === "authentic"
                ? "Authentic source · draft curation"
                : "Researcher-provided draft"}
            </span>
            <span className="mono">
              Case r{data.case.revision} ·{" "}
              {pinned ? "pinned, read-only" : "latest saved revision"}
            </span>
          </div>
          <h1>{data.case.title}</h1>
          <p>
            Review the recorded material. Keep interpretation and uncertainty
            visible.
          </p>
        </div>
        <div className="save-controls">
          <span className={`draft-status ${dirty ? "dirty" : ""}`}>
            {dirty
              ? `${changed + (assumptionsChanged ? 1 : 0)} staged change(s)`
              : "No unsaved changes"}
          </span>
          <button
            className="primary-button"
            disabled={!dirty || readOnly || save.isPending}
            onClick={submit}
          >
            {save.isPending
              ? "Saving immutable revision…"
              : "Save new revision"}
          </button>
        </div>
      </section>
      <nav className="workspace-tabs" aria-label="Case workspace">
        <Link
          to={`/cases/${id}/source${pinned ? `?revision=${data.case.revision}` : ""}`}
        >
          Source record
        </Link>
        <span className="active-tab">Material & interpretations</span>
        <Link
          to={`/cases/${id}/interpretations${pinned ? `?revision=${data.case.revision}` : ""}`}
        >
          Scenarios & robustness
        </Link>
        <Link
          to={`/cases/${id}/evidence${pinned ? `?revision=${data.case.revision}` : ""}`}
        >
          Evidence audit ↗
        </Link>
        <span className="workspace-revision-picker">
          <label>
            Revision
            <select
              aria-label="View saved revision"
              value={pinned ? String(data.case.revision) : "latest"}
              onChange={(e) =>
                navigate(
                  e.target.value === "latest"
                    ? `/cases/${id}/material`
                    : `/cases/${id}/material?revision=${e.target.value}`,
                )
              }
            >
              <option value="latest">Latest saved</option>
              {history.data?.items.map((h) => (
                <option value={h.revision} key={h.revision}>
                  r{h.revision} · {h.actor}
                </option>
              ))}
            </select>
          </label>
        </span>
      </nav>
      {pinned ? (
        <div className="capability-note">
          <strong>Pinned revision · editing disabled</strong>
          <p>
            Inspect this immutable record or{" "}
            <Link to={`/cases/${id}/material`}>
              open the latest revision to edit
            </Link>
            .
          </p>
        </div>
      ) : session.isError ? (
        <div className="form-error" role="alert">
          Editor session unavailable.{" "}
          <button
            className="text-button"
            onClick={() => void session.refetch()}
          >
            Retry session
          </button>
        </div>
      ) : session.data && !session.data.enabled ? (
        <div className="capability-note">
          This workspace is read-only. Saved records remain inspectable.
        </div>
      ) : null}
      {validation || save.isError ? (
        <div className="save-error" role="alert">
          <strong>Draft not saved</strong>
          <p>{validation || save.error?.message}</p>
          {save.error instanceof ApiError && save.error.status === 409 ? (
            <a
              href={`/cases/${id}/material`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Inspect latest revision in a new tab ↗
            </a>
          ) : null}
          <p>Your staged changes remain in this editor.</p>
        </div>
      ) : null}
      <div className="curation-layout">
        <section
          className="reading-panel editor-source"
          aria-labelledby="editor-source-title"
        >
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Immutable source</p>
              <h2 id="editor-source-title">Read & annotate</h2>
            </div>
            <span className="badge">{metadata.language}</span>
          </div>
          <label className="source-picker">
            Source text
            <select
              aria-label="Annotation source"
              value={active.id}
              onChange={(e) => {
                setSourceId(e.target.value);
                setSpan(null);
              }}
            >
              {data.sourceRevisions.map((r) => (
                <option key={r.id} value={r.id}>
                  {data.sources
                    .find((s) => s.id === r.sourceId)
                    ?.title.slice(0, 65)}{" "}
                  ·{" "}
                  {r.locator.page
                    ? `p. ${r.locator.page}`
                    : r.id === data.case.originalSourceRevisionId
                      ? "Original"
                      : data.sources
                          .find((s) => s.id === r.sourceId)
                          ?.kind.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <div className="source-locator">{active.locator.label}</div>
          <SourceReader
            key={`${active.id}:${span?.id ?? "none"}`}
            revision={active}
            language={metadata.language}
            selectedSpan={span}
            {...(!readOnly ? { onAnnotate: setManual } : {})}
          />
          {!readOnly ? (
            <SpanSelector revision={active} onSelect={setManual} />
          ) : null}
          <div className="edition-credit">
            <p>{metadata.edition}</p>
            <p>{active.rights.credit}</p>
            <p>
              {active.rights.decision === "pending"
                ? "Local display only · redistribution rights not verified"
                : active.rights.license}
            </p>
            <Link
              className="text-button"
              to={`/cases/${id}/source?revision=${data.case.revision}&source=${active.id}`}
            >
              Inspect full provenance ↗
            </Link>
          </div>
        </section>
        <section className="curation-panel" aria-labelledby="curation-title">
          <div className="curation-panel-heading">
            <p className="eyebrow">Curation workspace</p>
            <h2 id="curation-title">From wording to material</h2>
            <p>
              Proposals become recorded draft changes only after you choose and
              save them.
            </p>
          </div>
          <div
            className="editor-tabs"
            role="tablist"
            aria-label="Material editor sections"
          >
            {(
              ["extraction", "ingredients", "preparation", "history"] as const
            ).map((t) => (
              <button
                key={t}
                role="tab"
                id={`tab-${t}`}
                aria-selected={tab === t}
                aria-controls="editor-active-panel"
                tabIndex={tab === t ? 0 : -1}
                onKeyDown={(e) => {
                  const tabs = [
                    "extraction",
                    "ingredients",
                    "preparation",
                    "history",
                  ] as const;
                  const i = tabs.indexOf(t);
                  const next =
                    e.key === "ArrowRight"
                      ? (i + 1) % 4
                      : e.key === "ArrowLeft"
                        ? (i + 3) % 4
                        : e.key === "Home"
                          ? 0
                          : e.key === "End"
                            ? 3
                            : -1;
                  if (next >= 0) {
                    e.preventDefault();
                    setTab(tabs[next]!);
                    document.getElementById(`tab-${tabs[next]}`)?.focus();
                  }
                }}
                onClick={() => setTab(t)}
              >
                {t === "extraction"
                  ? "Proposals"
                  : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div
            className="editor-panel-body"
            id="editor-active-panel"
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
          >
            {tab === "extraction" ? (
              <>
                <div className="extraction-intro">
                  <h3>Scoped source extraction</h3>
                  <p>
                    English vocabulary and explicit preparation grammar. No LLM,
                    automatic translation or historical-to-modern taxon
                    guessing.
                  </p>
                  <button
                    className="secondary-button"
                    disabled={
                      readOnly ||
                      extraction.isPending ||
                      draft.decisions.length > 0
                    }
                    onClick={() => extraction.mutate()}
                  >
                    {extraction.isPending
                      ? "Finding exact source mentions…"
                      : run
                        ? "Run new proposals"
                        : "Find preparation proposals"}
                  </button>
                  {draft.decisions.length ? (
                    <p className="form-hint">
                      Save or reset staged decisions before running extraction
                      again.
                    </p>
                  ) : null}
                  {extraction.isError ? (
                    <p role="alert" className="form-error">
                      {extraction.error.message}
                    </p>
                  ) : null}
                </div>
                {runs.isPending ? (
                  <p role="status">Loading extraction history…</p>
                ) : runs.isError ? (
                  <p role="alert">
                    Extraction history unavailable.{" "}
                    <button
                      className="text-button"
                      onClick={() => void runs.refetch()}
                    >
                      Retry history
                    </button>
                  </p>
                ) : run ? (
                  <>
                    <p className="form-hint">
                      Run based on r{run.caseRevision} · {run.proposals.length}{" "}
                      proposals.
                      {!currentRun
                        ? " Historical run; start a new run to review against this revision."
                        : ""}
                    </p>
                    <ExtractionReview
                      run={run}
                      decisions={draft.decisions}
                      readOnly={readOnly || !currentRun}
                      onDecision={(id, decision) =>
                        setDraft((d) => ({
                          ...d,
                          decisions: d.decisions
                            .filter((p) => p.proposalId !== id)
                            .concat(decision ? [decision] : []),
                        }))
                      }
                      onInspect={inspect}
                    />
                  </>
                ) : (
                  <div className="empty">
                    Run proposals on this source, or select a passage to
                    annotate it manually.
                  </div>
                )}
              </>
            ) : tab === "ingredients" ? (
              <IngredientTable
                data={data}
                draft={draft}
                onChange={setDraft}
                readOnly={readOnly}
                onInspect={inspect}
                onCandidate={(occurrence, existing) =>
                  setCandidate({
                    occurrence,
                    ...(existing ? { existing } : {}),
                  })
                }
              />
            ) : tab === "preparation" ? (
              <PreparationSequence
                data={data}
                draft={draft}
                onChange={setDraft}
                onInspect={inspect}
                readOnly={readOnly}
              />
            ) : (
              <div className="revision-history">
                <h3>Immutable case history</h3>
                <p>
                  Earlier material, source references and assumptions remain
                  inspectable.
                </p>
                {history.isError ? (
                  <p role="alert">History could not be loaded.</p>
                ) : (
                  history.data?.items.map((h) => (
                    <article className="history-row" key={h.revision}>
                      <div className="section-heading">
                        <strong>Revision {h.revision}</strong>
                        <Link
                          to={`/cases/${id}/material?revision=${h.revision}`}
                        >
                          Inspect r{h.revision} ↗
                        </Link>
                      </div>
                      <p>{h.rationale}</p>
                      <p className="form-hint">
                        {h.actor} ·{" "}
                        {h.createdAt
                          ? `${new Date(h.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Kolkata" })} IST`
                          : "Initial bundled draft"}
                      </p>
                      <span className="mono hash">{h.contentHash}</span>
                    </article>
                  ))
                )}
              </div>
            )}
            {draft.manualAnnotations.length ? (
              <div className="draft-queue">
                <strong>
                  {draft.manualAnnotations.length} manual annotation(s) staged
                </strong>
                {draft.manualAnnotations.map((a, i) => (
                  <div className="queued-annotation" key={i}>
                    <span>
                      “{a.exact}” · {a.kind}
                    </span>
                    <button
                      className="text-button"
                      disabled={readOnly}
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          manualAnnotations: d.manualAnnotations.filter(
                            (_, j) => j !== i,
                          ),
                        }))
                      }
                    >
                      Remove annotation
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <MaterialFingerprintPanel data={data} dirty={dirty} />
          {!readOnly ? (
            <div className="review-save-fields">
              <ActorFields actor={actor} onChange={setActor} />
              <label>
                Revision rationale
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Describe the source-backed changes or explicit assumptions…"
                />
              </label>
              <div className="form-actions">
                <button
                  className="secondary-button"
                  disabled={!dirty || save.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Discard all unsaved changes in this editor?",
                      )
                    ) {
                      setDraft(emptyDraft(data));
                      setRationale("");
                      setValidation("");
                      save.reset();
                    }
                  }}
                >
                  Discard draft
                </button>
                <button
                  className="primary-button"
                  disabled={!dirty || save.isPending}
                  onClick={submit}
                >
                  {save.isPending ? "Saving…" : "Save new revision"}
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
      {manual ? (
        <ManualAnnotationDialog
          data={data}
          revision={active}
          selection={manual}
          onClose={() => setManual(null)}
          onAdd={(annotation) => {
            setDraft((d) => ({
              ...d,
              manualAnnotations: [...d.manualAnnotations, annotation],
            }));
            setManual(null);
          }}
        />
      ) : null}
      {candidate ? (
        <IdentityCandidateDialog
          data={data}
          occurrenceId={candidate.occurrence}
          {...(candidate.existing ? { existing: candidate.existing } : {})}
          onClose={() => setCandidate(null)}
          onAdd={(edit) => {
            setDraft((d) => ({
              ...d,
              candidateEdits: [...d.candidateEdits, edit],
            }));
            setCandidate(null);
          }}
        />
      ) : null}
      {blocker.state === "blocked" ? (
        <Dialog title="Leave unsaved changes?" onClose={() => blocker.reset()}>
          <p>
            Your staged decisions and annotations have not been saved as a
            revision.
          </p>
          <div className="form-actions">
            <button
              className="secondary-button"
              onClick={() => blocker.reset()}
            >
              Stay in editor
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
