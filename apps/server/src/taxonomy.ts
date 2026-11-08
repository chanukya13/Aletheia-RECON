import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type Database from "better-sqlite3";
import { z } from "zod";
import {
  ScientificName,
  TaxonomyResponse,
  type TaxonomyData,
} from "@recon/contracts";
import { parseJsonStrict, sha256, scientificHash } from "@recon/core";
import { ROOT } from "./database.js";

const DATASET = "d7dddbf4-2cf0-4f39-9b2a-bb099caae36c" as const;
const Match = z.object({
  usageKey: z.number().int().positive().optional(),
  acceptedUsageKey: z.number().int().positive().optional(),
  scientificName: z.string().optional(),
  canonicalName: z.string().optional(),
  rank: z.string().optional(),
  status: z.string().optional(),
  matchType: z.string(),
  confidence: z.number().optional(),
  species: z.string().optional(),
  note: z.string().optional(),
  alternatives: z.array(z.unknown()).optional(),
});
export type TaxonomySnapshot = {
  id: string;
  query: string;
  raw: string;
  acceptedRaw: string | null;
  retrievedAt: string;
  normalized: TaxonomyData;
};
export function normalizeGbif(
  raw: unknown,
  query: string,
  snapshotId: string,
  retrievedAt: string,
  source: TaxonomyData["source"],
  acceptedRaw: unknown = null,
): TaxonomyData {
  const primary = Match.parse(raw);
  const alternatives = (primary.alternatives ?? [])
    .slice(0, 29)
    .map((v) => Match.parse(v));
  const ambiguous = alternatives.some(
    (a) =>
      a.matchType === "EXACT" &&
      a.confidence === primary.confidence &&
      (a.acceptedUsageKey ?? a.usageKey) !==
        (primary.acceptedUsageKey ?? primary.usageKey),
  );
  const accepted = acceptedRaw
    ? z
        .object({
          key: z.number().int(),
          scientificName: z.string(),
          rank: z.string(),
          canonicalName: z.string().optional(),
        })
        .parse(acceptedRaw)
    : null;
  const qualifiedRank = (r?: string) =>
    [
      "SPECIES",
      "SUBSPECIES",
      "VARIETY",
      "FORM",
      "CULTIVAR",
      "INFRASPECIFIC_NAME",
    ].includes(r ?? "");
  const choices = [primary, ...alternatives]
    .map((m, i) => {
      if (!m.usageKey || !m.scientificName) return null;
      const isAccepted = m.status === "ACCEPTED";
      const knownAccepted =
        isAccepted || (i === 0 && accepted?.key === m.acceptedUsageKey);
      const acceptedName = isAccepted
        ? m.scientificName!
        : i === 0 && accepted
          ? accepted.scientificName
          : (m.species ?? "Accepted usage not independently retrieved");
      const acceptedRank = isAccepted
        ? (m.rank ?? "UNKNOWN")
        : i === 0 && accepted
          ? accepted.rank
          : "UNKNOWN";
      return {
        key: String(m.usageKey),
        scientificName: m.scientificName!,
        canonicalName: m.canonicalName ?? m.scientificName!,
        rank: m.rank ?? "UNKNOWN",
        status: m.status ?? "UNKNOWN",
        matchType: m.matchType,
        acceptedKey: String(m.acceptedUsageKey ?? m.usageKey),
        acceptedName,
        acceptedRank,
        selectable:
          i === 0 &&
          m.matchType === "EXACT" &&
          qualifiedRank(m.rank) &&
          qualifiedRank(acceptedRank) &&
          knownAccepted &&
          !ambiguous &&
          ["ACCEPTED", "SYNONYM"].includes(m.status ?? ""),
        qualifiers: [
          query,
          ...(m.status === "SYNONYM"
            ? ["Reported usage is a synonym; original name retained"]
            : []),
        ],
        note: m.note ?? "No additional diagnostics supplied",
      };
    })
    .filter((c) => c !== null);
  const ready = choices.some((c) => c.selectable);
  return TaxonomyResponse.parse({
    schemaVersion: "recon-v1",
    query,
    snapshotId,
    state: ready ? "ready" : "needs_review",
    source,
    stale: false,
    retrievedAt,
    datasetId: DATASET,
    datasetTitle: "GBIF Backbone Taxonomy (legacy v1 match; pinned authority)",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    matchType: primary.matchType,
    choices,
    message: ready
      ? "Exact modern-name match. Review this record before attaching it; this does not identify a historical ingredient."
      : ambiguous
        ? "Competing exact name usages require qualification. Add the botanical author or review the alternatives; no record can be attached automatically."
        : "Fuzzy, higher-rank, absent or unresolved match. Qualify the scientific name; automatic attachment is blocked.",
  });
}
export class TaxonomyService {
  private pending = new Map<string, Promise<TaxonomyData>>();
  constructor(
    private db: Database.Database,
    private live = true,
    private fetcher: typeof fetch = fetch,
  ) {
    this.seedBundled();
  }
  private seedBundled() {
    const folder = resolve(ROOT, "data/taxonomy/raw");
    const queries: Record<string, string> = {
      "allium-cepa.json": "Allium cepa",
      "allium-sativum.json": "Allium sativum",
      "allium-porrum.json": "Allium porrum",
      "allium-porrum-l.json": "Allium porrum L.",
      "allium-oleraceum.json": "Allium oleraceum",
    };
    for (const file of readdirSync(folder)) {
      const query = queries[file];
      if (!query) continue;
      const raw = readFileSync(resolve(folder, file), "utf8");
      const id = `gbif-${sha256(raw).slice(0, 24)}`;
      if (this.db.prepare("SELECT id FROM provider_cache WHERE id=?").get(id))
        continue;
      const acquisition = JSON.parse(
        readFileSync(resolve(ROOT, "data/taxonomy/acquisition.json"), "utf8"),
      ) as { Name: string; retrievedAt: string }[];
      const entry = acquisition.find((e) => e.Name === file);
      if (!entry) throw new Error("Missing taxonomy acquisition record");
      const retrievedAt = new Date(entry.retrievedAt).toISOString();
      const acceptedFile = resolve(folder, "usage-2856037.json");
      const acceptedRaw =
        file === "allium-porrum-l.json"
          ? readFileSync(acceptedFile, "utf8")
          : null;
      const normalized = normalizeGbif(
        parseJsonStrict(raw),
        query,
        id,
        retrievedAt,
        "bundled",
        acceptedRaw ? parseJsonStrict(acceptedRaw) : null,
      );
      const snapshot: TaxonomySnapshot = {
        id,
        query,
        raw,
        acceptedRaw,
        retrievedAt,
        normalized,
      };
      this.db
        .prepare("INSERT INTO provider_cache VALUES(?,?,?,?)")
        .run(id, query.toLowerCase(), retrievedAt, JSON.stringify(snapshot));
    }
  }
  snapshot(id: string): TaxonomySnapshot | null {
    const row = this.db
      .prepare("SELECT payload FROM provider_cache WHERE id=?")
      .get(id) as { payload: string } | undefined;
    return row ? (parseJsonStrict(row.payload) as TaxonomySnapshot) : null;
  }
  private cached(query: string) {
    const row = this.db
      .prepare(
        "SELECT payload FROM provider_cache WHERE query=? ORDER BY retrieved_at DESC LIMIT 1",
      )
      .get(query.toLowerCase()) as { payload: string } | undefined;
    return row ? (parseJsonStrict(row.payload) as TaxonomySnapshot) : null;
  }
  async lookup(input: string): Promise<TaxonomyData> {
    const query = ScientificName.parse(input).replace(/\s+/g, " ");
    const cached = this.cached(query);
    if (cached && Date.now() - Date.parse(cached.retrievedAt) < 86400000)
      return {
        ...cached.normalized,
        source: cached.normalized.source === "bundled" ? "bundled" : "cache",
      };
    if (this.pending.has(query)) return this.pending.get(query)!;
    const task = this.lookupLive(query, cached);
    this.pending.set(query, task);
    try {
      return await task;
    } finally {
      this.pending.delete(query);
    }
  }
  private async read(url: string): Promise<string> {
    const r = await this.fetcher(url, {
      signal: AbortSignal.timeout(5000),
      headers: { accept: "application/json" },
    });
    if (!r.ok)
      throw new Error(
        r.status === 429 ? "GBIF_RATE_LIMITED" : "GBIF_UNAVAILABLE",
      );
    if (Number(r.headers.get("content-length") ?? 0) > 250000)
      throw new Error("GBIF_RESPONSE_LIMIT");
    if (!r.body) throw new Error("GBIF_EMPTY_RESPONSE");
    const reader = r.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 250000) throw new Error("GBIF_RESPONSE_LIMIT");
        chunks.push(chunk.value);
      }
    } finally {
      await reader.cancel();
    }
    const text = Buffer.concat(chunks).toString("utf8");
    parseJsonStrict(text, 250000);
    return text;
  }
  private async lookupLive(
    query: string,
    cached: TaxonomySnapshot | null,
  ): Promise<TaxonomyData> {
    try {
      if (!this.live)
        throw new Error("Live GBIF lookup disabled in this workspace");
      if (this.pending.size >= 3)
        throw new Error("Provider concurrency limit reached");
      const raw = await this.read(
        `https://api.gbif.org/v1/species/match?verbose=true&name=${encodeURIComponent(query)}`,
      );
      const parsed = Match.parse(parseJsonStrict(raw));
      const acceptedRaw =
        parsed.status === "SYNONYM" && parsed.acceptedUsageKey
          ? await this.read(
              `https://api.gbif.org/v1/species/${parsed.acceptedUsageKey}`,
            )
          : null;
      const retrievedAt = new Date().toISOString();
      const id = `gbif-${scientificHash({ query, raw, acceptedRaw, retrievedAt }).slice(0, 24)}`;
      const normalized = normalizeGbif(
        parseJsonStrict(raw),
        query,
        id,
        retrievedAt,
        "live",
        acceptedRaw ? parseJsonStrict(acceptedRaw) : null,
      );
      const snapshot: TaxonomySnapshot = {
        id,
        query,
        raw,
        acceptedRaw,
        retrievedAt,
        normalized,
      };
      this.db
        .prepare("INSERT INTO provider_cache VALUES(?,?,?,?)")
        .run(id, query.toLowerCase(), retrievedAt, JSON.stringify(snapshot));
      return normalized;
    } catch (e) {
      if (cached)
        return {
          ...cached.normalized,
          source: "cache",
          stale: true,
          message:
            "Live lookup unavailable; retained snapshot shown with its retrieval date. " +
            cached.normalized.message,
        };
      return TaxonomyResponse.parse({
        schemaVersion: "recon-v1",
        query,
        snapshotId: null,
        state: "unavailable",
        source: "none",
        stale: false,
        retrievedAt: null,
        datasetId: DATASET,
        datasetTitle: "GBIF Backbone Taxonomy",
        licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
        matchType: "UNAVAILABLE",
        choices: [],
        message:
          e instanceof Error && e.message === "GBIF_RATE_LIMITED"
            ? "GBIF is rate-limited. Your draft remains local; try later."
            : "Taxonomy lookup is unavailable. Preserve the reported name and continue without a normalized taxon.",
      });
    }
  }
}
