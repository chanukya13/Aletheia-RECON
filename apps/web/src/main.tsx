// React mount adapted from the MIT Fastify vanilla SPA example; application UI is original.
import "./validation-runtime";
import {
  lazy,
  Suspense,
  StrictMode,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import {
  CaseListResponse,
  CaseResponse,
  HealthResponse,
  SourceResponse,
  type AssertionData,
  type CaseData,
  type SourceRevisionData,
} from "@recon/contracts";
import { api, ApiError } from "./api";
import { SourceReader } from "./components/SourceReader";
import { Dialog } from "./components/Dialog";
import { ImportDialog } from "./components/ImportDialog";
import { ResearchHome, ResearchJourney } from "./components/ResearchJourney";
import { Icon } from "./components/Icon";
import "./styles.css";
import "./curation.css";
import "./dossiers.css";
import "./design.css";
const ScenarioWorkspace = lazy(() => import("./components/ScenarioWorkspace"));
const MaterialVersionCompare = lazy(
  () => import("./components/MaterialVersionCompare"),
);
const EvidenceWorkspace = lazy(() => import("./components/EvidenceWorkspace"));
const MaterialWorkspace = lazy(() => import("./components/MaterialWorkspace"));
const DossierWorkspace = lazy(() => import("./components/DossierWorkspace"));
const TraceWorkspace = lazy(() => import("./components/TraceWorkspace"));
const OutcomeWorkspace = lazy(() => import("./components/OutcomeWorkspace"));
const EvaluationWorkspace = lazy(
  () => import("./components/EvaluationWorkspace"),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity, retry: false, refetchOnWindowFocus: false },
  },
});
const useHealth = () =>
  useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) => api("/health", HealthResponse, signal),
  });
function Arrow() {
  return <span aria-hidden="true">↗</span>;
}
function Badge({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
function External({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children} <Arrow />
    </a>
  );
}
function scannedPageUrl(canvasUrl?: string): string | null {
  // Wellcome canvas identifiers do not dereference. These image-service paths
  // were verified against the retained manifests and inspected page scans.
  const image = canvasUrl?.match(
    /^https:\/\/iiif\.wellcomecollection\.org\/presentation\/b[0-9]+_[0-9]+\/canvases\/(b[0-9]+_[0-9]+_[0-9]+\.jp2)$/,
  )?.[1];
  return image
    ? `https://iiif.wellcomecollection.org/image/${image}/full/1400,/0/default.jpg`
    : null;
}
function formatRecordedValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "value" in value &&
    "unit" in value &&
    typeof value.value === "number" &&
    typeof value.unit === "string"
  )
    return `${value.value} ${value.unit === "day" && value.value !== 1 ? "days" : value.unit}`;
  return JSON.stringify(value) ?? "Unrepresented value";
}
function Shell() {
  const health = useHealth();
  const [statusOpen, setStatusOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const main = useRef<HTMLElement>(null);
  const previousPath = useRef(location.pathname);
  useEffect(() => {
    if (previousPath.current !== location.pathname) main.current?.focus();
    previousPath.current = location.pathname;
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header
        className={`app-header${navOpen ? " nav-open" : ""}`}
        onKeyDown={(event) => {
          if (event.key === "Escape" && navOpen) {
            setNavOpen(false);
            menuButton.current?.focus();
          }
        }}
      >
        <Link
          className="brand"
          to="/research"
          aria-label="Aletheia RECON research home"
        >
          <span className="brand-symbol" aria-hidden="true">
            A<span>·</span>
          </span>
          <span>
            Aletheia <b>RECON</b>
          </span>
        </Link>
        <p className="rail-description">The evidence research desk</p>
        <button
          className="menu-toggle"
          ref={menuButton}
          aria-label={navOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={navOpen}
          aria-controls="main-navigation"
          onClick={() => setNavOpen(!navOpen)}
        >
          <Icon name={navOpen ? "close" : "menu"} />
          <span>{navOpen ? "Close" : "Menu"}</span>
        </button>
        <nav
          id="main-navigation"
          aria-label="Main navigation"
          onClick={() => setNavOpen(false)}
        >
          <Link
            className="nav-link"
            to="/research"
            aria-current={
              location.pathname === "/research" ? "page" : undefined
            }
          >
            <Icon name="home" /> Start here
          </Link>
          <Link
            className="nav-link"
            to="/cases"
            aria-current={
              location.pathname.startsWith("/cases") ? "page" : undefined
            }
          >
            <Icon name="book" /> Case library
          </Link>
          <Link
            className="nav-link"
            to="/trace"
            aria-current={location.pathname === "/trace" ? "page" : undefined}
          >
            <Icon name="trace" /> Interpretation trace
          </Link>
          <Link
            className="nav-link"
            to="/outcomes"
            aria-current={
              location.pathname === "/outcomes" ? "page" : undefined
            }
          >
            <Icon name="flask" /> Measured outcomes
          </Link>
          <Link
            className="nav-link"
            to="/analyses"
            aria-current={
              /^\/(analyses|imports)/.test(location.pathname)
                ? "page"
                : undefined
            }
          >
            <Icon name="folder" /> Dossiers
          </Link>
          <Link
            className="nav-link"
            to="/evaluation"
            aria-current={
              location.pathname.startsWith("/evaluation") ? "page" : undefined
            }
          >
            <Icon name="check" /> Evaluation
          </Link>
        </nav>
        <button
          className="workspace-status"
          onClick={() => setStatusOpen(true)}
        >
          <i className={health.isSuccess ? "online" : "offline"} />
          <span>
            {health.isError
              ? "Connection unavailable"
              : health.isPending
                ? "Connecting…"
                : health.data?.mode === "hosted_workspace"
                  ? "Private workspace"
                  : "Local workspace"}
          </span>
        </button>
      </header>
      <main id="main" ref={main} tabIndex={-1}>
        {health.data?.workspaceStorage === "temporary" ? (
          <div className="hosting-notice" role="note">
            <Icon name="download" size={16} />
            <p>
              <strong>Temporary workspace.</strong> Server restarts clear saved
              work. Download dossiers to keep it.
            </p>
            <button className="text-button" onClick={() => setStatusOpen(true)}>
              Details
            </button>
          </div>
        ) : null}
        <ResearchJourney />
        <Routes>
          <Route path="/research" element={<ResearchHome />} />
          <Route
            path="/outcomes"
            element={
              <Suspense fallback={<Loading />}>
                <OutcomeWorkspace />
              </Suspense>
            }
          />
          <Route
            path="/trace"
            element={
              <Suspense fallback={<Loading />}>
                <TraceWorkspace />
              </Suspense>
            }
          />
          <Route path="/" element={<Navigate to="/research" replace />} />
          <Route
            path="/analyses"
            element={
              <Suspense fallback={<Loading />}>
                <DossierWorkspace />
              </Suspense>
            }
          />
          <Route
            path="/analyses/:id"
            element={
              <Suspense fallback={<Loading />}>
                <DossierWorkspace />
              </Suspense>
            }
          />
          <Route
            path="/imports/:id"
            element={
              <Suspense fallback={<Loading />}>
                <DossierWorkspace />
              </Suspense>
            }
          />
          <Route
            path="/evaluation"
            element={
              <Suspense fallback={<Loading />}>
                <EvaluationWorkspace />
              </Suspense>
            }
          />
          <Route path="/cases" element={<Library />} />
          <Route path="/cases/:id/source" element={<CaseWorkspace />} />
          <Route
            path="/cases/:id/material"
            element={
              <Suspense fallback={<Loading />}>
                <MaterialWorkspace />
              </Suspense>
            }
          />
          <Route
            path="/cases/:id/evidence"
            element={
              <Suspense fallback={<Loading />}>
                <EvidenceWorkspace />
              </Suspense>
            }
          />
          <Route
            path="/cases/:id/interpretations"
            element={
              <Suspense fallback={<Loading />}>
                <ScenarioWorkspace />
              </Suspense>
            }
          />
          <Route
            path="/materials/compare"
            element={
              <Suspense fallback={<Loading />}>
                <MaterialVersionCompare />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ResearchJourney next />
      </main>
      <footer className="app-footer">
        <span>
          Aletheia RECON <span className="footer-divider">/</span> Source
          integrity workspace
        </span>
        <span>
          Research use · Human review pending ·{" "}
          <a href="/THIRD_PARTY_NOTICES.txt">Code notices</a>
        </span>
      </footer>
      {statusOpen ? (
        <Dialog title="Workspace status" onClose={() => setStatusOpen(false)}>
          {health.data ? (
            <>
              <Badge tone="teal">
                {health.data.mode === "hosted_workspace"
                  ? "Private hosted workspace"
                  : "Running locally"}
              </Badge>
              {health.data.mode === "hosted_workspace" ? (
                <p>
                  Your edits, imports and dossiers are stored in a private
                  workspace on this server. This browser's secure cookie grants
                  access. Download dossiers for a portable copy; clearing
                  cookies removes access to this workspace.
                </p>
              ) : null}
              {health.data.workspaceStorage === "temporary" ? (
                <p>
                  This free preview uses temporary storage. Download dossiers
                  before leaving: server restarts and idle shutdowns erase this
                  workspace. The next session starts fresh; you can import a
                  downloaded dossier to inspect it again.
                </p>
              ) : null}
              <dl className="metadata">
                <dt>Runtime</dt>
                <dd>{health.data.runtime}</dd>
                <dt>Corpus revision</dt>
                <dd className="mono">{health.data.corpusRevision}</dd>
                <dt>Database migration</dt>
                <dd>{health.data.migration}</dd>
                <dt>Mode</dt>
                <dd>
                  {health.data.capabilities.editing
                    ? health.data.mode === "hosted_workspace"
                      ? "Private source curation"
                      : "Local source curation"
                    : "Read-only source inspection"}
                </dd>
              </dl>
              <p>
                Source snapshots are immutable.{" "}
                {health.data.capabilities.editing
                  ? "Annotations and interpretations are saved as new revisions."
                  : "Editing is disabled in this workspace."}{" "}
                Modern-name lookup is{" "}
                {health.data.capabilities.liveProviders
                  ? "available through GBIF with an offline cache."
                  : "using retained local GBIF snapshots."}{" "}
                Recorded-material comparisons are available in Evidence audit.
              </p>
            </>
          ) : (
            <>
              <p role="alert">
                The workspace API is unavailable. Retry the connection.
              </p>
              <button
                className="primary-button"
                onClick={() => void health.refetch()}
              >
                Retry connection
              </button>
            </>
          )}
        </Dialog>
      ) : null}
    </>
  );
}
function Loading() {
  return (
    <div className="state-panel" role="status">
      <span className="loading-dot" /> Loading source records…
    </div>
  );
}
function Failure({ error, retry }: { error: Error; retry: () => void }) {
  return error instanceof ApiError && error.status === 404 ? (
    <NotFound />
  ) : (
    <section className="state-panel" role="alert">
      <h1>Records could not be loaded</h1>
      <p>{error.message}</p>
      <button className="primary-button" onClick={retry}>
        Try again
      </button>
      {error instanceof ApiError ? (
        <p className="mono">Request {error.requestId}</p>
      ) : null}
    </section>
  );
}
function NotFound() {
  return (
    <section className="state-panel">
      <p className="eyebrow">Record unavailable</p>
      <h1>We couldn’t find that record.</h1>
      <p>Check the case identifier or return to the source library.</p>
      <Link className="primary-button" to="/cases">
        Open case library
      </Link>
    </section>
  );
}
function Library() {
  const health = useHealth();
  const [importOpen, setImportOpen] = useState(false);
  const query = useQuery({
    queryKey: ["cases"],
    queryFn: async ({ signal }) => {
      const first = await api("/cases", CaseListResponse, signal);
      const pages = await Promise.all(
        Array.from(
          {
            length: Math.ceil(
              Math.max(0, first.total - first.items.length) / 50,
            ),
          },
          (_, i) =>
            api(
              `/cases?offset=${first.items.length + i * 50}&limit=50`,
              CaseListResponse,
              signal,
            ),
        ),
      );
      return {
        ...first,
        items: [...first.items, ...pages.flatMap((page) => page.items)],
      };
    },
  });
  const [search, setSearch] = useState("");
  if (query.isPending) return <Loading />;
  if (query.isError)
    return <Failure error={query.error} retry={() => void query.refetch()} />;
  const items = query.data.items.filter((c) =>
    `${c.title} ${c.subtitle} ${c.period}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div className="library page-width">
      <section className="library-intro">
        <div>
          <p className="eyebrow">
            <span className="small-line" /> Preparation-sensitive research
          </p>
          <h1>Start with the source.</h1>
          <p className="intro-copy">
            Inspect what was recorded, what was tested,
            <br className="desktop-break" /> and what remains unresolved.
          </p>
        </div>
        <div className="corpus-stamp">
          <span className="stamp-symbol" aria-hidden="true">
            ⌘
          </span>
          <div>
            <strong>Source-grounded corpus</strong>
            <p>
              {query.data.total} source cases · {query.data.studyCount} primary
              studies
            </p>
            <span className="mono">{query.data.corpusRevision}</span>
          </div>
        </div>
      </section>
      <section aria-labelledby="library-title">
        <div className="library-toolbar">
          <div>
            <h2 id="library-title">
              Case library{" "}
              <span>{query.data.total.toString().padStart(2, "0")}</span>
            </h2>
            <p>Authentic passages, edition-specific provenance.</p>
          </div>
          <div className="library-actions">
            <button
              className="primary-button"
              disabled={!health.data?.capabilities.editing}
              onClick={() => setImportOpen(true)}
            >
              Import passage <span aria-hidden="true">＋</span>
            </button>
            <label className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a case…"
                aria-label="Find a case"
              />
              <kbd aria-hidden="true">⌕</kbd>
            </label>
          </div>
        </div>
        <div className="case-grid">
          {items.map((c, index) => (
            <Link
              to={`/cases/${c.id}/source`}
              className={`case-card case-card-${c.id}`}
              key={c.id}
            >
              <div className="card-top">
                <span className="case-number">
                  CASE {(index + 1).toString().padStart(2, "0")}
                </span>
                <Badge>
                  {c.authenticity === "user_import"
                    ? "Researcher draft"
                    : c.kind === "recipe"
                      ? "Historical recipe"
                      : "Preparation mention"}
                </Badge>
              </div>
              <div className="card-art" aria-hidden="true">
                {c.id === "balds-eyesalve" ? (
                  <>
                    <span className="orbit orbit-one" />
                    <span className="orbit orbit-two" />
                    <span className="orbit orbit-three" />
                    <span className="artifact-letter">æ</span>
                    <span className="art-caption">
                      cropleac · garleac · win
                    </span>
                  </>
                ) : c.id === "hippocratic-oxymel" ? (
                  <>
                    <span className="vessel-top" />
                    <span className="vessel-body" />
                    <span className="artifact-letter greek">ὀξύμελι</span>
                    <span className="art-caption">
                      a preparation named in the text
                    </span>
                  </>
                ) : (
                  <>
                    <span className="artifact-letter">¶</span>
                    <span className="art-caption">
                      Researcher-provided source
                    </span>
                  </>
                )}
              </div>
              <div className="card-content">
                <p className="eyebrow">{c.period}</p>
                <h3>
                  {c.title}
                  <span className="card-arrow" aria-hidden="true">
                    ↗
                  </span>
                </h3>
                <p>{c.subtitle}</p>
                <div className="card-metrics">
                  <span>
                    <b>{c.sourceCount}</b> source texts
                  </span>
                  <span>
                    <b>{c.evidenceUnitCount}</b> assay records
                  </span>
                  <span>
                    <b>{c.studyCount}</b>{" "}
                    {c.studyCount === 1 ? "study" : "studies"}
                  </span>
                </div>
                <div className="card-bottom">
                  <span className="review-dot" />
                  Human review pending
                  <span className="mono">r{c.revision}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {!items.length ? (
          <p className="empty" role="status">
            No cases match “{search}”. Try a different term.
          </p>
        ) : null}
      </section>
      <aside className="integrity-note">
        <span className="note-symbol" aria-hidden="true">
          ↳
        </span>
        <div>
          <strong>Uncertainty belongs in the record.</strong>
          <p>
            Historical claims, modern observations and interpretation are kept
            distinct. The bundled corpus awaits independent human review.
            Imported passages retain their declared rights and individual review
            records.
          </p>
        </div>
        <Badge tone="amber">No efficacy inference</Badge>
      </aside>
      {importOpen ? (
        <ImportDialog onClose={() => setImportOpen(false)} />
      ) : null}
    </div>
  );
}
function CaseWorkspace() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const revisionParam = params.get("revision");
  const query = useQuery({
    queryKey: ["case", id, revisionParam],
    queryFn: ({ signal }) =>
      api(
        `/cases/${encodeURIComponent(id)}${revisionParam ? `?revision=${encodeURIComponent(revisionParam)}` : ""}`,
        CaseResponse,
        signal,
      ),
  });
  if (query.isPending) return <Loading />;
  if (query.isError)
    return <Failure error={query.error} retry={() => void query.refetch()} />;
  const data = query.data;
  const requested = params.get("source");
  const revisionId = data.sourceRevisions.some((r) => r.id === requested)
    ? requested!
    : data.case.primarySourceRevisionId;
  const active = data.sourceRevisions.find((r) => r.id === revisionId)!;
  const spanId = params.get("span");
  const selectedSpan =
    data.spans.find(
      (s) => s.id === spanId && s.sourceRevisionId === active.id,
    ) ?? null;
  const changeSource = (source: string, span?: string) => {
    const next = new URLSearchParams(params);
    next.set("source", source);
    if (span) next.set("span", span);
    else next.delete("span");
    setParams(next, { replace: true });
  };
  return (
    <WorkspaceContent
      key={`${id}-${data.case.revision}`}
      data={data}
      active={active}
      selectedSpan={selectedSpan}
      changeSource={changeSource}
    />
  );
}
function WorkspaceContent({
  data,
  active,
  selectedSpan,
  changeSource,
}: {
  data: CaseData;
  active: SourceRevisionData;
  selectedSpan: CaseData["spans"][number] | null;
  changeSource: (id: string, span?: string) => void;
}) {
  const [dialog, setDialog] = useState<"source" | AssertionData | null>(null);
  const [locateRequest, setLocateRequest] = useState(0);
  const source = data.sources.find((s) => s.id === active.sourceId)!;
  // Verify the separately fetched source boundary as well as the case aggregate.
  const sourceQuery = useQuery({
    queryKey: ["source", active.sourceId, active.revision],
    queryFn: ({ signal }) =>
      api(
        `/sources/${active.sourceId}/revisions/${active.revision}`,
        SourceResponse,
        signal,
      ),
  });
  const assertions = data.case.assertionIds
    .map((id) => data.assertions.find((a) => a.id === id))
    .filter((a): a is AssertionData => Boolean(a));
  const inspect = (a: AssertionData) => setDialog(a);
  const visibleAssertions = assertions.filter(
    (a) =>
      !a.field.startsWith("ingredient.part") &&
      !a.field.startsWith("ingredient.state") &&
      !(a.field === "ingredient.term" && a.id !== "a-cropleek-word"),
  );
  return (
    <div className="workspace page-width">
      <div className="breadcrumbs">
        <Link to="/cases">Case library</Link>
        <span aria-hidden="true">/</span>
        <span>{data.case.title}</span>
      </div>
      <section className="workspace-heading">
        <div>
          <div className="heading-badges">
            <Badge
              tone={data.case.authenticity === "authentic" ? "teal" : "amber"}
            >
              {data.case.authenticity === "authentic"
                ? "Authentic source"
                : "Researcher-provided draft"}
            </Badge>
            <span className="mono">
              Case r{data.case.revision} ·{" "}
              {data.selection === "latest"
                ? "latest revision"
                : "pinned revision"}
            </span>
          </div>
          <h1>{data.case.title}</h1>
          <p>{data.case.subtitle}</p>
        </div>
        <Badge tone="amber">Human review pending</Badge>
      </section>
      <div className="workspace-tabs">
        <span className="active-tab">Source record</span>
        <Link to={`/cases/${data.case.id}/interpretations`}>
          Scenarios & robustness
        </Link>
        <Link to={`/cases/${data.case.id}/evidence`}>Evidence audit ↗</Link>
        <Link
          to={`/cases/${data.case.id}/material${data.selection === "pinned" ? `?revision=${data.case.revision}` : ""}`}
        >
          Material & interpretations ↗
        </Link>
        <span>
          {data.case.kind === "preparation_mention"
            ? "Preparation mention · composition incomplete"
            : "Historical recipe · identity unresolved"}
        </span>
      </div>
      <div className="workspace-grid">
        <section className="reading-panel" aria-labelledby="source-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Edition witness</p>
              <h2 id="source-title">
                {source.kind === "primary_study"
                  ? "Primary study text"
                  : active.id === data.case.originalSourceRevisionId
                    ? "Old English excerpt"
                    : source.kind === "user_text"
                      ? "Researcher-provided passage"
                      : source.kind === "taxonomy_snapshot"
                        ? "Taxonomy authority snapshot"
                        : "English translation"}
              </h2>
            </div>
            <button
              className="secondary-button"
              onClick={() => setDialog("source")}
            >
              Provenance <Arrow />
            </button>
          </div>
          <div className="source-switcher">
            {[
              data.case.primarySourceRevisionId,
              data.case.originalSourceRevisionId,
            ]
              .filter(Boolean)
              .map((r) => (
                <button
                  key={r}
                  aria-pressed={r === active.id}
                  onClick={() => changeSource(r!)}
                >
                  {r === data.case.primarySourceRevisionId
                    ? data.case.authenticity === "user_import"
                      ? "Imported passage"
                      : "Translation"
                    : "Original excerpt"}
                </button>
              ))}
            {!data.case.originalSourceRevisionId &&
            data.case.id === "hippocratic-oxymel" ? (
              <span className="absence-note">Original Greek not bundled</span>
            ) : null}
          </div>
          <label className="source-picker">
            Source text
            <select
              aria-label="Source text"
              value={active.id}
              onChange={(e) => changeSource(e.target.value)}
            >
              {data.sourceRevisions.map((r) => (
                <option value={r.id} key={r.id}>
                  {data.sources.find((s) => s.id === r.sourceId)?.kind ===
                  "primary_study"
                    ? `${data.studies.find((s) => s.sourceRevisionIds.includes(r.id))?.authors[0]} et al. · ${data.studies.find((s) => s.sourceRevisionIds.includes(r.id))?.year}`
                    : r.id === data.case.originalSourceRevisionId
                      ? "Cockayne · Old English opening excerpt"
                      : data.case.authenticity === "user_import" ||
                          data.sources.find((s) => s.id === r.sourceId)
                            ?.kind === "taxonomy_snapshot"
                        ? data.sources.find((s) => s.id === r.sourceId)?.title
                        : `${data.case.id === "hippocratic-oxymel" ? "Adams" : "Cockayne"} · English translation`}
                </option>
              ))}
            </select>
          </label>
          <div className="source-locator">
            <span className="locator-dot" />
            {active.locator.label}
          </div>
          {sourceQuery.isError ? (
            <div className="inline-note" role="alert">
              Source verification request failed.{" "}
              <button
                className="text-button"
                onClick={() => void sourceQuery.refetch()}
              >
                Retry
              </button>
            </div>
          ) : sourceQuery.data &&
            sourceQuery.data.revision.textSha256 !== active.textSha256 ? (
            <p role="alert">
              Source revision conflict. Reload this case before continuing.
            </p>
          ) : (
            <SourceReader
              key={`${active.id}:${locateRequest}`}
              revision={active}
              selectedSpan={selectedSpan}
              language={source.language}
            />
          )}
          {selectedSpan ? (
            <div className="active-locator" role="status">
              <strong>Located passage</strong>
              <p>{selectedSpan.locator.label}</p>
              <span className="mono">
                {selectedSpan.id} · [{selectedSpan.start}, {selectedSpan.end})
              </span>
            </div>
          ) : null}
          <div className="edition-credit">
            <p>{source.edition}</p>
            <p>
              {source.translator
                ? `Translation: ${source.translator}`
                : "Original-language edition excerpt"}{" "}
              · {active.rights.license}
            </p>
            <button className="text-button" onClick={() => setDialog("source")}>
              Inspect text transformations & rights <Arrow />
            </button>
          </div>
        </section>
        <aside className="record-panel" aria-labelledby="record-title">
          <div className="record-heading">
            <p className="eyebrow">Curation notebook</p>
            <h2 id="record-title">What the record says</h2>
            <p>
              Source claims and missing information, with a route back to the
              text.
            </p>
          </div>
          <div className="assertion-list">
            {visibleAssertions.map((a) => (
              <button
                className="assertion-row"
                key={a.id}
                onClick={() => inspect(a)}
              >
                <span className="assertion-label">
                  {a.label}
                  <span aria-hidden="true">↗</span>
                </span>
                <span
                  className={`assertion-value ${a.state === "unknown" ? "unknown" : ""}`}
                >
                  {a.state === "unknown"
                    ? a.reason.replaceAll("_", " ")
                    : a.state === "contested"
                      ? "Contested interpretations"
                      : a.state === "not_applicable"
                        ? "Not applicable"
                        : formatRecordedValue(a.value)}
                </span>
                <span className="assertion-state">
                  {a.state === "unknown"
                    ? "Explicit unknown"
                    : a.state === "inferred"
                      ? "Editorial inference"
                      : a.state === "contested"
                        ? "Contested interpretations"
                        : a.state === "not_applicable"
                          ? "Not applicable"
                          : "Recorded in source"}{" "}
                  ·{" "}
                  {a.review.status === "accepted"
                    ? "locally source-checked"
                    : "review pending"}
                </span>
              </button>
            ))}
          </div>
          <section className="studies-section">
            <div className="section-heading">
              <h3>Linked primary studies</h3>
              <span className="count-bubble">{data.studies.length}</span>
            </div>
            <p className="muted">
              {data.evidenceUnits.length} distinct formulation × assay records.
              These counts do not indicate clinical support.
            </p>
            {data.studies.map((s) => (
              <button
                className="study-row"
                key={s.id}
                onClick={() => changeSource(s.sourceRevisionIds[0]!)}
              >
                <span className="study-year">{s.year}</span>
                <span>
                  <strong>{s.authors[0]?.split(" ").at(-1)} et al.</strong>
                  <small>{s.title}</small>
                  <span className="mono">{s.pmcid}</span>
                </span>
                <Arrow />
              </button>
            ))}
          </section>
          <div className="review-note">
            <strong>Automated source checks</strong>
            <p>
              Source bytes, exact passages and references are checked
              automatically. Review provenance records the remaining historical
              and experimental uncertainty.
            </p>
          </div>
        </aside>
      </div>
      {dialog ? (
        <Dialog
          title={dialog === "source" ? "Source provenance" : dialog.label}
          onClose={() => setDialog(null)}
        >
          {dialog === "source" ? (
            <Provenance revision={active} source={source} />
          ) : (
            <>
              <Badge tone={dialog.state === "unknown" ? "amber" : "teal"}>
                {dialog.state.replaceAll("_", " ")}
              </Badge>
              <p className="assertion-detail">
                {dialog.state === "recorded" || dialog.state === "inferred"
                  ? formatRecordedValue(dialog.value)
                  : dialog.state === "unknown"
                    ? dialog.reason.replaceAll("_", " ")
                    : dialog.rationale}
              </p>
              <p>{dialog.rationale}</p>
              <h3>Supporting locations</h3>
              {dialog.references.map((r, i) =>
                r.kind === "span" ? (
                  <div className="reference-quote" key={r.spanId}>
                    <blockquote>
                      {data.spans.find((s) => s.id === r.spanId)?.exact}
                    </blockquote>
                    <button
                      className="text-button"
                      onClick={() => {
                        const span = data.spans.find((s) => s.id === r.spanId);
                        if (span) {
                          changeSource(span.sourceRevisionId, span.id);
                          setLocateRequest((n) => n + 1);
                        }
                        setDialog(null);
                      }}
                    >
                      Locate in source <Arrow />
                    </button>
                    <p className="mono">{r.spanId}</p>
                  </div>
                ) : (
                  <p key={i}>
                    Source scope:{" "}
                    <span className="mono">{r.sourceRevisionId}</span> ·{" "}
                    {r.field}
                  </p>
                ),
              )}
              <ReviewDetails assertion={dialog} />
            </>
          )}
        </Dialog>
      ) : null}
    </div>
  );
}
function ReviewDetails({ assertion }: { assertion: AssertionData }) {
  return (
    <section className="review-details">
      <h3>Review record</h3>
      <dl className="metadata">
        <dt>State</dt>
        <dd>
          {assertion.review.status === "accepted"
            ? "Locally source-checked (declared reviewer)"
            : "Pending human review"}
        </dd>
        <dt>Source check</dt>
        <dd>{assertion.review.reviewer}</dd>
        <dt>Qualifications</dt>
        <dd>{assertion.review.qualification}</dd>
        <dt>Origin</dt>
        <dd>{assertion.origin.replaceAll("_", " ")}</dd>
        <dt>Assertion ID</dt>
        <dd className="mono">{assertion.id}</dd>
      </dl>
    </section>
  );
}
function Provenance({
  revision: r,
  source: s,
}: {
  revision: SourceRevisionData;
  source: CaseData["sources"][number];
}) {
  return (
    <>
      <Badge tone="teal">{r.rights.license}</Badge>
      <h3 className="provenance-title">{s.title}</h3>
      <p>{r.rights.credit}</p>
      <dl className="metadata">
        <dt>Work</dt>
        <dd>{s.work}</dd>
        <dt>Edition</dt>
        <dd>{s.edition}</dd>
        <dt>Language</dt>
        <dd>{s.language}</dd>
        <dt>Composition</dt>
        <dd>{s.compositionDate}</dd>
        <dt>Locator</dt>
        <dd>{r.locator.label}</dd>
        {r.locator.canvasUrl ? (
          <>
            <dt>Canvas identifier</dt>
            <dd className="mono">{r.locator.canvasUrl}</dd>
          </>
        ) : null}
        <dt>Retrieved</dt>
        <dd>{new Date(r.retrievedAt).toISOString()}</dd>
        <dt>Rights decision</dt>
        <dd>{r.rights.decision.replaceAll("_", " ")}</dd>
      </dl>
      <h3>Text preparation</h3>
      <p>{r.editorialNote}</p>
      <p className="muted">{r.rights.restrictions}</p>
      <div className="provenance-links">
        <External href={s.canonicalUrl}>Open source record</External>
        {scannedPageUrl(r.locator.canvasUrl) ? (
          <External href={scannedPageUrl(r.locator.canvasUrl)!}>
            Open scanned page
          </External>
        ) : null}
        <External href={r.rights.licenseUrl}>License terms</External>
      </div>
      <details className="hash-details">
        <summary>Integrity & immutable identifiers</summary>
        <dl className="metadata">
          <dt>Revision</dt>
          <dd className="mono">{r.id}</dd>
          <dt>Display-text SHA-256</dt>
          <dd className="mono hash">{r.textSha256}</dd>
          <dt>Raw-byte SHA-256</dt>
          <dd className="mono hash">{r.rawSha256}</dd>
          <dt>Revision hash</dt>
          <dd className="mono hash">{r.contentHash}</dd>
          <dt>Parser</dt>
          <dd className="mono">{r.parser}</dd>
          <dt>Permission evidence SHA-256</dt>
          <dd className="mono hash">{r.rights.evidenceSha256}</dd>
        </dl>
      </details>
    </>
  );
}

const router = createBrowserRouter([{ path: "*", element: <Shell /> }]);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
