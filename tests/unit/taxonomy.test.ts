import { afterEach, describe, expect, it, vi } from "vitest";
import {
  normalizeGbif,
  TaxonomyService,
} from "../../apps/server/src/taxonomy.js";
import { migrate, openDatabase } from "../../apps/server/src/database.js";
const now = new Date().toISOString();
const exact = {
  usageKey: 1,
  scientificName: "Testus species L.",
  canonicalName: "Testus species",
  rank: "SPECIES",
  status: "ACCEPTED",
  matchType: "EXACT",
  confidence: 100,
};
const closers: Array<() => void> = [];
afterEach(() => {
  for (const close of closers.splice(0)) close();
});
function service(fetcher: typeof fetch) {
  const db = openDatabase(":memory:");
  migrate(db);
  closers.push(() => db.close());
  return { db, adapter: new TaxonomyService(db, true, fetcher) };
}
describe("GBIF provider contract and conservative scientific-name matching", () => {
  it("never promotes an alternative when the primary usage is absent", () => {
    const response = normalizeGbif(
      { matchType: "NONE", alternatives: [exact] },
      "Testus species",
      "test",
      now,
      "live",
    );
    expect(response.state).toBe("needs_review");
    expect(response.choices[0]!.selectable).toBe(false);
  });
  it.each(["FUZZY", "HIGHERRANK", "NONE"])(
    "blocks %s despite a high service confidence",
    (matchType) => {
      expect(
        normalizeGbif(
          { ...exact, matchType },
          "Testus species",
          "test",
          now,
          "live",
        ).choices.every((c) => !c.selectable),
      ).toBe(true);
    },
  );
  it("blocks competing exact homonyms and higher accepted ranks", () => {
    const ambiguous = normalizeGbif(
      { ...exact, alternatives: [{ ...exact, usageKey: 2 }] },
      "Testus species",
      "test",
      now,
      "live",
    );
    expect(ambiguous.state).toBe("needs_review");
    expect(ambiguous.choices.every((c) => !c.selectable)).toBe(true);
    const synonym = { ...exact, status: "SYNONYM", acceptedUsageKey: 3 };
    expect(
      normalizeGbif(synonym, "Testus species", "test", now, "live").state,
    ).toBe("needs_review");
    expect(
      normalizeGbif(synonym, "Testus species", "test", now, "live", {
        key: 3,
        scientificName: "Testus",
        rank: "GENUS",
      }).state,
    ).toBe("needs_review");
    const qualified = normalizeGbif(
      synonym,
      "Testus species",
      "test",
      now,
      "live",
      { key: 3, scientificName: "Testus acceptedus L.", rank: "SPECIES" },
    );
    expect(qualified.choices[0]).toMatchObject({
      scientificName: exact.scientificName,
      acceptedName: "Testus acceptedus L.",
      selectable: true,
    });
  });
  it("fetches only an encoded name, coalesces concurrent calls and retains raw cache", async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () =>
        new Response(JSON.stringify(exact), {
          headers: { "content-type": "application/json" },
        }),
    );
    const { adapter, db } = service(fetcher);
    const [a, b] = await Promise.all([
      adapter.lookup("Testus species"),
      adapter.lookup("Testus species"),
    ]);
    expect(a).toEqual(b);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(String(fetcher.mock.calls[0]![0])).toBe(
      "https://api.gbif.org/v1/species/match?verbose=true&name=Testus%20species",
    );
    expect(a.source).toBe("live");
    expect((await adapter.lookup("Testus species")).source).toBe("cache");
    expect(adapter.snapshot(a.snapshotId!)?.raw).toBe(JSON.stringify(exact));
    expect(db.pragma("foreign_key_check")).toEqual([]);
  });
  it.each(["429", "503", "malformed", "timeout", "oversized"])(
    "returns an honest unavailable state for %s",
    async (failure) => {
      const fetcher: typeof fetch = async () => {
        if (failure === "timeout")
          throw new DOMException("Timed out", "TimeoutError");
        if (failure === "malformed") return new Response("{broken");
        if (failure === "oversized")
          return new Response("{}", {
            headers: { "content-length": "999999" },
          });
        return new Response("", { status: Number(failure) });
      };
      const { adapter } = service(fetcher);
      const response = await adapter.lookup("Testus species");
      expect(response.state).toBe("unavailable");
      expect(response.snapshotId).toBeNull();
      expect(response.choices).toEqual([]);
    },
  );
  it("retains stale cached names on provider failure", async () => {
    const { adapter, db } = service(
      async () => new Response("", { status: 503 }),
    );
    for (const row of db
      .prepare("SELECT id,payload FROM provider_cache")
      .all() as { id: string; payload: string }[]) {
      const snapshot = JSON.parse(row.payload);
      snapshot.retrievedAt = "2000-01-01T00:00:00.000Z";
      db.prepare(
        "UPDATE provider_cache SET retrieved_at=?,payload=? WHERE id=?",
      ).run(snapshot.retrievedAt, JSON.stringify(snapshot), row.id);
    }
    const r = await adapter.lookup("Allium cepa");
    expect(r.source).toBe("cache");
    expect(r.stale).toBe(true);
    expect(r.choices[0]!.scientificName).toContain("Allium cepa");
  });
});
