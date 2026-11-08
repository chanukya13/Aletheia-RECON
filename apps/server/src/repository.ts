import type {
  CaseData,
  CaseListData,
  CorpusData,
  SourceRevisionData,
} from "@recon/contracts";

export function canDisplay(r: SourceRevisionData): boolean {
  return (
    r.rights.display &&
    (r.rights.decision === "bundle_allowed" ||
      (r.parser === "recon-user-text-v1" &&
        r.rights.storage &&
        r.rights.decision === "pending"))
  );
}
export function filterRevision(r: SourceRevisionData): SourceRevisionData {
  return canDisplay(r)
    ? r
    : {
        ...r,
        displayText: "",
        editorialNote:
          "Text withheld under the artifact rights decision. Metadata and pinned hash retained.",
      };
}
export function listCases(
  data: CorpusData,
  offset: number,
  limit: number,
): CaseListData {
  const latest = new Map<string, CorpusData["cases"][number]>();
  for (const c of data.cases)
    if (!latest.has(c.id) || latest.get(c.id)!.revision < c.revision)
      latest.set(c.id, c);
  const items = [...latest.values()].map((c) => ({
    id: c.id,
    revision: c.revision,
    title: c.title,
    subtitle: c.subtitle,
    kind: c.kind,
    authenticity: c.authenticity,
    period: c.period,
    review: c.review,
    sourceCount: c.sourceRevisionIds.length,
    assertionCount: c.assertionIds.length,
    studyCount: new Set(
      data.evidenceUnits
        .filter((u) => c.evidenceUnitIds.includes(u.id))
        .map((u) => u.studyId),
    ).size,
    evidenceUnitCount: c.evidenceUnitIds.length,
  }));
  return {
    schemaVersion: "recon-v1",
    studyCount: data.studies.length,
    sourceRevisionCount: data.sourceRevisions.length,
    evidenceUnitCount: data.evidenceUnits.length,
    corpusRevision: data.revision,
    items: items.slice(offset, offset + limit),
    total: items.length,
    offset,
    limit,
  };
}
export function getCase(
  data: CorpusData,
  id: string,
  revision?: number,
): CaseData | undefined {
  const c = data.cases
    .filter(
      (c) => c.id === id && (revision === undefined || c.revision === revision),
    )
    .sort((a, b) => b.revision - a.revision)[0];
  if (!c) return;
  const sourceRevisions = data.sourceRevisions.filter((r) =>
    c.sourceRevisionIds.includes(r.id),
  );
  const allowedRevisions = new Set(
    sourceRevisions.filter(canDisplay).map((r) => r.id),
  );
  const spans = data.spans.filter((s) =>
    allowedRevisions.has(s.sourceRevisionId),
  );
  const allowedSpans = new Set(spans.map((s) => s.id));
  const assertions = data.assertions.filter((a) =>
    a.references.every((r) =>
      r.kind === "span"
        ? allowedSpans.has(r.spanId)
        : allowedRevisions.has(r.sourceRevisionId),
    ),
  );
  const evidenceUnits = data.evidenceUnits.filter((u) =>
    c.evidenceUnitIds.includes(u.id),
  );
  return {
    schemaVersion: "recon-v1",
    selection: revision === undefined ? "latest" : "pinned",
    case: c,
    sources: data.sources.filter((s) =>
      sourceRevisions.some((r) => r.sourceId === s.id),
    ),
    sourceRevisions: sourceRevisions.map(filterRevision),
    spans,
    assertions,
    material: data.materials.find((m) => m.id === c.materialVersionId)!,
    candidates: data.candidates.filter((ca) =>
      data.materials
        .find((m) => m.id === c.materialVersionId)!
        .componentSlots.some(
          (s) => s.id === ca.occurrenceId && s.candidateIds.includes(ca.id),
        ),
    ),
    taxa: data.taxa.filter((t) =>
      data.candidates.some(
        (ca) =>
          ca.taxonConceptId === t.id &&
          data.materials
            .find((m) => m.id === c.materialVersionId)!
            .componentSlots.some((s) => s.candidateIds.includes(ca.id)),
      ),
    ),
    studies: data.studies.filter((s) =>
      evidenceUnits.some((u) => u.studyId === s.id),
    ),
    evidenceUnits,
  };
}
