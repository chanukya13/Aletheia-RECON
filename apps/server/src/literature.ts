import type Database from "better-sqlite3";
import {
  LiteratureSearch,
  LiteratureItem,
  PendingStudy,
} from "@recon/contracts";
import { parseJsonStrict, scientificHash } from "@recon/core";
import { WorkspaceError } from "./errors.js";
export class LiteratureService {
  constructor(
    private db: Database.Database,
    private live = true,
    private fetcher: typeof fetch = fetch,
  ) {}
  async search(query: string, cursor = "*") {
    const key = scientificHash({ query, cursor });
    const cached = this.db
      .prepare(
        "SELECT payload FROM literature_snapshots WHERE query_key=? ORDER BY rowid DESC LIMIT 1",
      )
      .get(key) as { payload: string } | undefined;
    if (cached) {
      const parsed = LiteratureSearch.parse(parseJsonStrict(cached.payload));
      if (Date.now() - Date.parse(parsed.retrievedAt) < 86400000) return parsed;
    }
    const retrievedAt = new Date().toISOString();
    try {
      if (!this.live) throw Error("OFFLINE");
      const url = new URL(
        "https://www.ebi.ac.uk/europepmc/webservices/rest/search",
      );
      // Literal phrase search: user text cannot inject Europe PMC query operators.
      url.searchParams.set("query", `"${query.replace(/["\\]/g, " ")}"`);
      url.searchParams.set("format", "json");
      url.searchParams.set("resultType", "core");
      url.searchParams.set("pageSize", "10");
      url.searchParams.set("cursorMark", cursor);
      const response = await this.fetcher(url, {
        signal: AbortSignal.timeout(7000),
        headers: { accept: "application/json" },
      });
      if (!response.ok) throw Error(`HTTP_${response.status}`);
      if (Number(response.headers.get("content-length") ?? 0) > 1000000)
        throw Error("SIZE");
      if (!response.body) throw Error("EMPTY");
      const reader = response.body.getReader();
      let size = 0;
      const chunks: Uint8Array[] = [];
      try {
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          size += part.value.length;
          if (size > 1000000) throw Error("SIZE");
          chunks.push(part.value);
        }
      } finally {
        await reader.cancel();
      }
      const raw = Buffer.concat(chunks).toString("utf8");
      const json = parseJsonStrict(raw, 1000000) as {
        resultList?: { result?: Record<string, unknown>[] };
        nextCursorMark?: string;
      };
      if (!Array.isArray(json.resultList?.result)) throw Error("MALFORMED");
      const items = json.resultList.result.slice(0, 10).map((r) =>
        LiteratureItem.parse({
          id: String(r.id ?? ""),
          source: String(r.source ?? ""),
          title: String(r.title ?? "Title not supplied"),
          authorString: String(r.authorString ?? "Authors not supplied"),
          year: String(r.pubYear ?? ""),
          doi: typeof r.doi === "string" ? r.doi : null,
          pmcid:
            typeof r.pmcid === "string" && /^PMC\d+$/.test(r.pmcid)
              ? r.pmcid
              : null,
          license: typeof r.license === "string" ? r.license : null,
          openAccess: r.isOpenAccess === "Y",
          publicationTypes:
            (r.pubTypeList as { pubType?: string[] })?.pubType ?? [],
          fullTextStatus: "not_retrieved",
        }),
      );
      const snapshotId = `literature-${scientificHash({ raw, retrievedAt, key }).slice(0, 24)}`;
      const result = LiteratureSearch.parse({
        schemaVersion: "recon-v1",
        state: "ready",
        query,
        cursor,
        nextCursor:
          json.nextCursorMark && json.nextCursorMark !== cursor
            ? json.nextCursorMark
            : null,
        retrievedAt,
        stale: false,
        message:
          "Metadata only. Open-access flags do not independently authorize full-text reuse. Publication types may identify corrections/retractions; no exhaustive status clearance is claimed.",
        snapshotId,
        items,
      });
      this.db
        .prepare("INSERT INTO literature_snapshots VALUES(?,?,?,?)")
        .run(snapshotId, key, raw, JSON.stringify(result));
      return result;
    } catch {
      if (cached)
        return {
          ...LiteratureSearch.parse(parseJsonStrict(cached.payload)),
          stale: true,
          message:
            "Provider unavailable; retained metadata shown with its retrieval date.",
        };
      return LiteratureSearch.parse({
        schemaVersion: "recon-v1",
        state: "unavailable",
        query,
        cursor,
        nextCursor: null,
        retrievedAt,
        stale: false,
        message:
          "Europe PMC is unavailable. Local studies and comparisons remain usable.",
        snapshotId: `unavailable-${key.slice(0, 24)}`,
        items: [],
      });
    }
  }
  import(snapshotId: string, id: string, source: string) {
    const row = this.db
      .prepare("SELECT payload FROM literature_snapshots WHERE id=?")
      .get(snapshotId) as { payload: string } | undefined;
    if (!row)
      throw new WorkspaceError(
        "SNAPSHOT_NOT_FOUND",
        "Search again to select a retained provider snapshot.",
        404,
      );
    const metadata = LiteratureSearch.parse(
      parseJsonStrict(row.payload),
    ).items.find((x) => x.id === id && x.source === source);
    if (!metadata)
      throw new WorkspaceError(
        "RECORD_NOT_FOUND",
        "Select a record from this retained search result.",
        404,
      );
    const pending = PendingStudy.parse({
      schemaVersion: "recon-v1",
      id: `pending-study-${scientificHash({ id, source }).slice(0, 24)}`,
      metadata,
      review: "pending",
      contentStatus: "metadata_only",
      snapshotId,
    });
    this.db
      .prepare("INSERT OR IGNORE INTO pending_studies VALUES(?,?)")
      .run(pending.id, JSON.stringify(pending));
    return PendingStudy.parse(
      parseJsonStrict(
        (
          this.db
            .prepare("SELECT payload FROM pending_studies WHERE id=?")
            .get(pending.id) as { payload: string }
        ).payload,
      ),
    );
  }
}
