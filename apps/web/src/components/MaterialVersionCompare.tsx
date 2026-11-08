import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  AnalysisRecord,
  CaseResponse,
  MaterialComparison,
  MaterialList,
  type CaseData,
} from "@recon/contracts";
import { api } from "../api";
import {
  SourceProof,
  TaskStatus,
  useScenarioTask,
  verdictLabel,
  type Proof,
} from "./scenario-shared";
import { assertionLabel } from "./curation-shared";
import "../curation.css";
import "../scenarios.css";
export default function MaterialVersionCompare() {
  const list = useQuery({
    queryKey: ["materials"],
    queryFn: ({ signal }) => api("/materials", MaterialList, signal),
  });
  if (list.isPending)
    return (
      <div className="state-panel" role="status">
        Loading immutable material versions…
      </div>
    );
  if (list.isError)
    return (
      <div className="state-panel" role="alert">
        Material versions unavailable.{" "}
        <button onClick={() => void list.refetch()}>Retry versions</button>
      </div>
    );
  return <CompareEditor list={list.data} />;
}
function CompareEditor({ list }: { list: z.infer<typeof MaterialList> }) {
  const [leftId, setLeft] = useState(
      list.items.find((i) => i.material.id === "material-2018-es-o")?.material
        .id ?? list.items[0]!.material.id,
    ),
    [rightId, setRight] = useState(
      list.items.find((i) => i.material.id === "material-2020-eso")?.material
        .id ?? list.items.at(-1)!.material.id,
    ),
    [leftAssignments, setLeftAssignments] = useState<
      CaseData["case"]["baselineScenarioInput"]["assignments"]
    >([]),
    [rightAssignments, setRightAssignments] = useState<
      CaseData["case"]["baselineScenarioInput"]["assignments"]
    >([]),
    [snapshotName, setName] = useState("Material-version comparison");
  const left = list.items.find((i) => i.material.id === leftId)!,
    right = list.items.find((i) => i.material.id === rightId)!;
  const comparison = useScenarioTask(MaterialComparison),
    freeze = useScenarioTask(AnalysisRecord);
  const side = (item: typeof left, assignments: typeof leftAssignments) => ({
    materialVersionId: item.material.id,
    ...(item.caseId
      ? { caseId: item.caseId, caseRevision: item.caseRevision! }
      : {}),
    assignments,
  });
  const body = {
    policyHash: list.policyHash,
    left: side(left, leftAssignments),
    right: side(right, rightAssignments),
  };
  const result =
    comparison.signature ===
    JSON.stringify({ path: "/materials/compare", body })
      ? comparison.data
      : null;
  return (
    <div className="material-compare page-width">
      <div className="breadcrumbs">
        <Link to="/cases">Case library</Link>
        <span>/</span>
        <span>Material versions</span>
      </div>
      <section className="workspace-heading">
        <div>
          <p className="eyebrow">Two-sided source comparison</p>
          <h1>Compare material versions.</h1>
          <p>
            Recorded differences and unknowns, with provenance on each side.
          </p>
        </div>
        <span className="badge">Material-only scope</span>
      </section>
      <div className="capability-note">
        <strong>
          Differences do not establish lineage or chemical effects.
        </strong>
        <p>
          This view has no inherited assay outcome or clinical-effectiveness
          verdict. Pending methods summaries remain drafts.
        </p>
      </div>
      <div className="version-selectors">
        <VersionSide
          label="Left"
          item={left}
          list={list}
          onSelect={(id) => {
            setLeft(id);
            setLeftAssignments([]);
          }}
          assignments={leftAssignments}
          onAssignments={setLeftAssignments}
        />
        <VersionSide
          label="Right"
          item={right}
          list={list}
          onSelect={(id) => {
            setRight(id);
            setRightAssignments([]);
          }}
          assignments={rightAssignments}
          onAssignments={setRightAssignments}
        />
      </div>
      <div className="form-actions">
        <button
          className="secondary-button"
          onClick={() => {
            setLeft(rightId);
            setRight(leftId);
            setLeftAssignments(rightAssignments);
            setRightAssignments(leftAssignments);
          }}
        >
          Swap sides
        </button>
        <button
          className="primary-button"
          disabled={comparison.busy}
          onClick={() => void comparison.run("/materials/compare", body)}
        >
          Compare pinned material versions
        </button>
      </div>
      <TaskStatus task={comparison} />
      {result ? (
        <section className="version-results">
          <h2>{verdictLabel[result.verdict]}</h2>
          <p>{result.warning}</p>
          <div className="version-notes">
            <SideNotes
              label="Left"
              ids={result.leftAssertionIds}
              proof={result}
            />
            <SideNotes
              label="Right"
              ids={result.rightAssertionIds}
              proof={result}
            />
          </div>
          <h3>Strict recorded dimensions</h3>
          {result.dimensions.map((d) => (
            <details className="dimension-reason" key={d.dimension}>
              <summary>
                <span>{d.dimension.replaceAll("_", " ")}</span>
                <span className="badge amber">{d.state}</span>
              </summary>
              <p>{d.reasonCodes.join(", ").replaceAll("_", " ")}</p>
              <SourceProof
                proof={result}
                assertionIds={d.assertionIds.filter((id) =>
                  result.leftAssertionIds.includes(id),
                )}
                title={`Left ${d.dimension} source`}
              />
              <SourceProof
                proof={result}
                assertionIds={d.assertionIds.filter((id) =>
                  result.rightAssertionIds.includes(id),
                )}
                title={`Right ${d.dimension} source`}
              />
            </details>
          ))}
          <div className="freeze-panel">
            <label>
              Analysis name
              <input
                value={snapshotName}
                maxLength={100}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button
              className="secondary-button"
              disabled={freeze.busy}
              onClick={() =>
                void freeze.run("/analyses", {
                  requestId: crypto.randomUUID(),
                  runHash: result.runHash,
                  name: snapshotName,
                })
              }
            >
              Freeze material comparison
            </button>
            <TaskStatus task={freeze} />
            {freeze.data ? (
              <div role="status">
                <p>Frozen material comparison saved.</p>
                <Link
                  className="dossier-link"
                  to={`/analyses/${freeze.data.id}`}
                >
                  Open dossier and downloads
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
function VersionSide({
  label,
  item,
  list,
  onSelect,
  assignments,
  onAssignments,
}: {
  label: string;
  item: z.infer<typeof MaterialList>["items"][number];
  list: z.infer<typeof MaterialList>;
  onSelect: (id: string) => void;
  assignments: CaseData["case"]["baselineScenarioInput"]["assignments"];
  onAssignments: (
    a: CaseData["case"]["baselineScenarioInput"]["assignments"],
  ) => void;
}) {
  const c = useQuery({
    queryKey: ["material-side-case", item.caseId, item.caseRevision],
    enabled: Boolean(item.caseId),
    queryFn: ({ signal }) =>
      api(
        `/cases/${item.caseId}?revision=${item.caseRevision}`,
        CaseResponse,
        signal,
      ),
  });
  return (
    <section className="version-side">
      <h2>{label} source version</h2>
      <label>
        {label} material version
        <select
          aria-label={`${label} material version`}
          value={item.material.id}
          onChange={(e) => onSelect(e.target.value)}
        >
          {list.items.map((i) => (
            <option key={i.material.id} value={i.material.id}>
              {i.material.label}
              {i.caseRevision ? ` / case r${i.caseRevision}` : ""}
            </option>
          ))}
        </select>
      </label>
      <p>
        {item.material.representation.replaceAll("_", " ")} /{" "}
        {item.material.kind.replaceAll("_", " ")}
      </p>
      <p className="mono hash">{item.material.id}</p>
      {c.data
        ? c.data.material.componentSlots
            .filter((s) => s.candidateIds.length)
            .map((slot) => (
              <label key={slot.id}>
                {label} identity assumption / {slot.id}
                <select
                  value={
                    assignments.find((a) => a.occurrenceId === slot.id)
                      ?.candidateId ?? ""
                  }
                  onChange={(e) =>
                    onAssignments(
                      assignments
                        .filter((a) => a.occurrenceId !== slot.id)
                        .concat(
                          e.target.value
                            ? [
                                {
                                  occurrenceId: slot.id,
                                  candidateId: e.target.value,
                                },
                              ]
                            : [],
                        ),
                    )
                  }
                >
                  <option value="">Keep unresolved</option>
                  {c
                    .data!.candidates.filter(
                      (a) =>
                        slot.candidateIds.includes(a.id) &&
                        a.status !== "rejected",
                    )
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.proposedName}
                      </option>
                    ))}
                </select>
              </label>
            ))
        : null}
      {c.isError ? (
        <p role="alert">Associated case assumptions could not be loaded.</p>
      ) : null}
    </section>
  );
}
function SideNotes({
  label,
  ids,
  proof,
}: {
  label: string;
  ids: string[];
  proof: Proof;
}) {
  const notes = proof.assertions.filter(
    (a) =>
      ids.includes(a.id) &&
      /^(material.composition|preparation.processing|preparation.contact|preparation.duration)/.test(
        a.field,
      ),
  );
  return (
    <section>
      <h3>{label} / source-backed draft notes</h3>
      {notes.map((a) => (
        <article key={a.id}>
          <strong>{a.label}</strong>
          {a.state === "recorded" &&
          a.value &&
          typeof a.value === "object" &&
          !Array.isArray(a.value) ? (
            <dl className="assay-fields">
              {Object.entries(a.value).map(([key, value]) => (
                <div key={key}>
                  <dt>{key.replace(/([a-z])([A-Z])/g, "$1 $2")}</dt>
                  <dd>
                    {typeof value === "boolean"
                      ? value
                        ? "Present"
                        : "Explicitly absent"
                      : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p>{assertionLabel(a)}</p>
          )}
          <p className="form-hint">
            {a.review.status === "accepted"
              ? "Locally source-checked"
              : "Draft / review pending"}
          </p>
          <SourceProof
            proof={proof}
            assertionIds={[a.id]}
            title={`${label} source passage`}
          />
        </article>
      ))}
      {!notes.length ? (
        <p>
          No displayable structured source notes establish these dimensions.
        </p>
      ) : null}
    </section>
  );
}
