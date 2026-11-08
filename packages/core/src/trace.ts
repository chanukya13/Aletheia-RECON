import {
  InterpretationTrace,
  TraceManifest,
  TraceRequest,
  type CorpusData,
  type TraceManifestData,
} from "@recon/contracts";
import { scientificHash } from "./integrity.js";

export function traceInterpretations(
  data: CorpusData,
  manifest: TraceManifestData,
  raw: unknown,
) {
  const request = TraceRequest.parse(raw);
  TraceManifest.parse(manifest);
  if (
    new Set(manifest.entries.map((e) => e.spanId)).size !==
      manifest.entries.length ||
    manifest.entries.some((e) => !data.spans.some((s) => s.id === e.spanId))
  )
    throw new Error("TRACE_MANIFEST_INVALID");
  if (scientificHash(data) !== manifest.corpusHash)
    throw new Error("TRACE_CORPUS_CHANGED");
  const excluded = new Set(request.excludedSpanIds);
  if (
    [...excluded].some((id) => !manifest.entries.some((e) => e.spanId === id))
  )
    throw new Error("UNKNOWN_CONTRIBUTION");
  const visibleRevisions = data.sourceRevisions.filter(
    (r) => r.rights.display && r.rights.decision === "bundle_allowed",
  );
  const spans = data.spans.filter((s) =>
    visibleRevisions.some((r) => r.id === s.sourceRevisionId),
  );
  const term = manifest.terms.find((t) =>
    t.forms.some(
      (f) => f.toLocaleLowerCase("en") === request.q.toLocaleLowerCase("en"),
    ),
  );
  const escaped = request.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])(${escaped})(?=$|[^\\p{L}\\p{N}])`,
    "giu",
  );
  const literals = visibleRevisions.flatMap((r) =>
    [...r.displayText.matchAll(pattern)].slice(0, 200).map((m, index) => {
      const start = m.index! + m[1]!.length,
        end = start + m[2]!.length;
      return {
        id: `literal-${r.id}-${index}`,
        sourceRevisionId: r.id,
        sourceTextSha256: r.textSha256,
        start,
        end,
        exact: r.displayText.slice(start, end),
        prefix: r.displayText.slice(Math.max(0, start - 40), start),
        suffix: r.displayText.slice(end, end + 40),
        locator: r.locator,
      };
    }),
  );
  const related = new Set(term?.spanIds ?? []);
  const candidates = data.candidates
    .filter((c) => term?.candidateIds.includes(c.id))
    .map((c) => {
      const paths: Array<{
        assertionIds: string[];
        spanId: string;
        excluded: boolean;
      }> = [];
      function visit(id: string, ancestors: string[]) {
        if (ancestors.includes(id)) return;
        const assertion = data.assertions.find((a) => a.id === id);
        if (!assertion || assertion.review.status === "rejected") return;
        const assertionIds = [...ancestors, id];
        for (const ref of assertion.references)
          if (ref.kind === "span" && spans.some((s) => s.id === ref.spanId)) {
            related.add(ref.spanId);
            paths.push({
              assertionIds,
              spanId: ref.spanId,
              excluded: excluded.has(ref.spanId),
            });
          }
        for (const input of assertion.inputAssertionIds)
          visit(input, assertionIds);
      }
      for (const id of c.supportAssertionIds) visit(id, []);
      const reviews = data.assertions
        .filter((a) => c.supportAssertionIds.includes(a.id))
        .map((a) => a.review.status);
      return {
        id: c.id,
        name: c.proposedName,
        review: [...new Set(reviews)].join(", ") || "unreviewed",
        paths,
        survivingPaths: paths.filter((p) => !p.excluded).length,
      };
    });
  for (const s of spans)
    if (
      literals.some(
        (l) =>
          l.sourceRevisionId === s.sourceRevisionId &&
          l.start >= s.start &&
          l.end <= s.end,
      )
    )
      related.add(s.id);
  const contributions = spans
    .filter((s) => related.has(s.id))
    .map((s) => {
      const entry = manifest.entries.find((e) => e.spanId === s.id);
      return {
        spanId: s.id,
        role: entry?.role ?? ("unclassified" as const),
        workGroup: entry?.workGroup ?? "Unclassified source",
        excluded: excluded.has(s.id),
      };
    });
  const selectedSpans = spans.filter((s) => related.has(s.id));
  const revisions = visibleRevisions.filter(
    (r) =>
      selectedSpans.some((s) => s.sourceRevisionId === r.id) ||
      literals.some((s) => s.sourceRevisionId === r.id),
  );
  const body = {
    version: manifest.version,
    query: request.q,
    corpusHash: manifest.corpusHash,
    inputHash: scientificHash({
      manifest,
      query: request.q,
      excludedSpanIds: [...excluded].sort(),
    }),
    sourceCount: visibleRevisions.length,
    literals,
    contributions,
    candidates,
    sources: data.sources.filter((s) =>
      revisions.some((r) => r.sourceId === s.id),
    ),
    sourceRevisions: revisions,
    spans: selectedSpans,
  };
  return InterpretationTrace.parse({
    ...body,
    resultHash: scientificHash(body),
  });
}
