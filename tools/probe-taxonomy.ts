import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { migrate, openDatabase, ROOT } from "../apps/server/src/database.js";
import { TaxonomyService } from "../apps/server/src/taxonomy.js";
import { sha256 } from "@recon/core";
const db = openDatabase(":memory:");
migrate(db);
try {
  const service = new TaxonomyService(db, true);
  const response = await service.lookup("Allium cepa L.");
  const snapshot = response.snapshotId
    ? service.snapshot(response.snapshotId)
    : null;
  const directory = resolve(ROOT, "artifacts/providers");
  mkdirSync(directory, { recursive: true });
  if (snapshot)
    writeFileSync(resolve(directory, "gbif-live-match.json"), snapshot.raw);
  const report = {
    executedAt: new Date().toISOString(),
    liveVerified: response.source === "live",
    response,
    rawFile: snapshot ? "artifacts/providers/gbif-live-match.json" : null,
    rawSha256: snapshot ? sha256(snapshot.raw) : null,
  };
  writeFileSync(
    resolve(directory, "gbif-live-probe.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      liveVerified: report.liveVerified,
      state: response.state,
      matchType: response.matchType,
      names: response.choices.map((c) => c.scientificName),
    }),
  );
  if (!report.liveVerified) process.exitCode = 1;
} finally {
  db.close();
}
