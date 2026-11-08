import { DOMParser } from "@xmldom/xmldom";
import {
  OutcomeCatalogue,
  type CorpusData,
  type OutcomeObservationData,
} from "@recon/contracts";
import { scientificHash, sha256 } from "@recon/core";

// Adapter for the pinned Fuchs 2018 table layout. Header names, not their order,
// identify arms. Table cells retain the original row/column coordinates.
export function extractOutcomeTables(xml: string, data: CorpusData) {
  const revision = data.sourceRevisions.find((r) => r.id === "fuchs-2018.r1");
  if (!revision || sha256(xml) !== revision.rawSha256)
    throw new Error("OUTCOME_SOURCE_HASH_CHANGED");
  if (
    !revision.rights.display ||
    !revision.rights.redistribution ||
    revision.rights.decision !== "bundle_allowed"
  )
    throw new Error("OUTCOME_SOURCE_RIGHTS_UNAVAILABLE");
  if (/<!ENTITY|<!DOCTYPE/i.test(xml)) throw new Error("UNSAFE_OUTCOME_XML");
  const document = new DOMParser({
    errorHandler: {
      warning: () => {},
      error: () => {
        throw new Error("INVALID_OUTCOME_XML");
      },
      fatalError: () => {
        throw new Error("INVALID_OUTCOME_XML");
      },
    },
  }).parseFromString(xml, "text/xml");
  const tables = Array.from(document.getElementsByTagName("table-wrap"));
  function table(id: string) {
    const matches = tables.filter((t) => t.getAttribute("id") === id);
    if (matches.length !== 1) throw new Error("MISSING_OR_DUPLICATE_TABLE");
    return matches[0]!;
  }
  const compositionTable = table("pone.0208108.t001"),
    resultTable = table("pone.0208108.t002");
  const text = (node: { textContent: string | null }) =>
    (node.textContent ?? "").replace(/\s+/g, " ").trim();
  const resultHeads = Array.from(
    resultTable.getElementsByTagName("thead")[0]!.getElementsByTagName("tr"),
  );
  const headers = Array.from(resultHeads[1]!.getElementsByTagName("th")).map(
    text,
  );
  if (
    headers.length !== 4 ||
    new Set(headers).size !== 4 ||
    headers.some((h) => !["ES-O", "ES-L", "ES-GBBr", "ES-GB"].includes(h))
  )
    throw new Error("UNSUPPORTED_OUTCOME_HEADERS");
  const feet = text(resultTable.getElementsByTagName("table-wrap-foot")[0]!);
  if (
    !feet.includes("median of at least 3 biological replicates") ||
    !feet.includes("% (v/v)")
  )
    throw new Error("OUTCOME_CONTEXT_CHANGED");
  const compHeads = Array.from(
    compositionTable
      .getElementsByTagName("thead")[0]!
      .getElementsByTagName("th"),
  )
    .map(text)
    .slice(1);
  if (
    compHeads.length !== 6 ||
    new Set(compHeads).size !== 6 ||
    headers.some((h) => !compHeads.includes(h))
  )
    throw new Error("UNSUPPORTED_COMPOSITION_HEADERS");
  const compositions = Array.from(
    compositionTable
      .getElementsByTagName("tbody")[0]!
      .getElementsByTagName("tr"),
  ).map((row) => {
    const cells = Array.from(row.getElementsByTagName("td"));
    const label = cells[0]!.cloneNode(true) as (typeof cells)[number];
    for (const node of Array.from(label.getElementsByTagName("xref")))
      label.removeChild(node);
    if (cells.length !== compHeads.length + 1)
      throw new Error("COMPOSITION_CELL_COUNT_CHANGED");
    return {
      ingredient: text(label),
      values: cells.slice(1).map((c) => {
        const v = text(c);
        if (v !== "+" && v !== "-")
          throw new Error("UNKNOWN_COMPOSITION_VALUE");
        return v === "+";
      }),
    };
  });
  if (
    compositions.map((c) => c.ingredient).join("|") !==
    "Garlic|Wine|Onion|Leek|Bovine bile|Brass"
  )
    throw new Error("COMPOSITION_ROWS_CHANGED");
  const observations: OutcomeObservationData[] = [];
  let organism = "";
  const rows = Array.from(
    resultTable.getElementsByTagName("tbody")[0]!.getElementsByTagName("tr"),
  );
  rows.forEach((row, rowIndex) => {
    const cells = Array.from(row.getElementsByTagName("td")),
      label = text(cells[0]!);
    if (cells.length !== 5) throw new Error("OUTCOME_CELL_COUNT_CHANGED");
    if (label === "S. aureus" || label === "P. aeruginosa") {
      organism =
        label === "S. aureus"
          ? "Staphylococcus aureus"
          : "Pseudomonas aeruginosa";
      if (cells.slice(1).some((c) => text(c) !== ""))
        throw new Error("OUTCOME_GROUP_ROW_CHANGED");
      return;
    }
    if (!organism || !["ATCC 6538", "LAC", "PAO1", "PA215"].includes(label))
      throw new Error("UNSUPPORTED_OUTCOME_STRAIN");
    headers.forEach((arm, index) => {
      const rawValue = text(cells[index + 1]!);
      if (!/^(?:\d+(?:\.\d+)?)$/.test(rawValue))
        throw new Error("MISSING_OR_NONNUMERIC_OUTCOME_CELL");
      const materialVersionId = `material-2018-${arm.toLowerCase()}`;
      if (!data.materials.some((m) => m.id === materialVersionId))
        throw new Error("OUTCOME_MATERIAL_MISSING");
      observations.push({
        id: `obs-2018-${label.replaceAll(" ", "-").toLowerCase()}-${arm.toLowerCase()}`,
        studyId: "study-fuchs-2018",
        sourceRevisionId: revision.id,
        rawSourceHash: revision.rawSha256,
        tableId: "pone.0208108.t002",
        rowLabel: label,
        columnLabel: arm,
        rowIndex: rowIndex + 1,
        columnIndex: index + 2,
        organism,
        strain: label,
        assay: "broth microdilution / crude eyesalve",
        endpoint: "minimum inhibitory concentration",
        statistic: "median",
        unit: "% v/v",
        value: Number(rawValue),
        qualifier: "exact",
        rawValue,
        minimumBiologicalReplicates: 3,
        materialVersionId,
        spanId: "span-2018-mic-table",
        composition: compositions.map((c) => ({
          ingredient: c.ingredient,
          included: c.values[compHeads.indexOf(arm)]!,
        })),
      });
    });
  });
  if (
    observations.length !== 16 ||
    new Set(observations.map((o) => o.id)).size !== 16
  )
    throw new Error("OUTCOME_DUPLICATE_OR_MISSING_KEY");
  const unit = data.evidenceUnits.find((u) => u.id === "eu-2020-esl-newman")!;
  const biofilm = data.sourceRevisions.find(
    (r) => r.id === "furner-pardoe-2020.r1",
  )!;
  observations.push({
    id: "obs-2020-esl-newman",
    studyId: unit.studyId,
    sourceRevisionId: biofilm.id,
    rawSourceHash: biofilm.rawSha256,
    tableId: "Figure 1A discussion",
    rowLabel: unit.armLabel,
    columnLabel: "ESL biofilm",
    rowIndex: null,
    columnIndex: null,
    organism: "Staphylococcus aureus",
    strain: "Newman",
    assay:
      "collagen-based synthetic soft-tissue wound biofilm / 24 h treatment",
    endpoint: "CFU-based log change relative to control",
    statistic: "not curated",
    unit: "log change",
    value: null,
    qualifier: "missing",
    rawValue:
      "No numeric outcome is curated for this arm; inspect the source discussion.",
    minimumBiologicalReplicates: null,
    materialVersionId: unit.testedMaterialVersionId,
    spanId: "span-2020-paired",
    composition: [],
  });
  const revisionIds = new Set(observations.map((o) => o.sourceRevisionId));
  const sourceRevisions = data.sourceRevisions.filter(
    (r) =>
      revisionIds.has(r.id) &&
      r.rights.display &&
      r.rights.decision === "bundle_allowed",
  );
  if (sourceRevisions.length !== 2)
    throw new Error("OUTCOME_SOURCE_RIGHTS_UNAVAILABLE");
  const body = {
    version: "recon-outcomes-1" as const,
    observations,
    sources: data.sources.filter((s) =>
      sourceRevisions.some((r) => r.sourceId === s.id),
    ),
    sourceRevisions,
    spans: data.spans.filter((s) =>
      [
        "span-2018-mic-table",
        "span-2018-formulations",
        "span-2018-preparation",
        "span-2020-paired",
      ].includes(s.id),
    ),
  };
  return OutcomeCatalogue.parse({ ...body, contentHash: scientificHash(body) });
}
