import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { openDatabase, migrate, ROOT } from "../apps/server/src/database.js";
import { LiteratureService } from "../apps/server/src/literature.js";
const db = openDatabase(":memory:");
migrate(db);
try {
  const service = new LiteratureService(db, true);
  const result = await service.search("eyesalve");
  const folder = resolve(ROOT, "artifacts/providers");
  mkdirSync(folder, { recursive: true });
  const raw = db
    .prepare("SELECT raw FROM literature_snapshots WHERE id=?")
    .get(result.snapshotId) as { raw: string } | undefined;
  writeFileSync(
    resolve(folder, "europe-pmc-probe.json"),
    JSON.stringify(
      {
        executedAt: new Date().toISOString(),
        liveVerified: result.state === "ready",
        result,
      },
      null,
      2,
    ),
  );
  if (raw) writeFileSync(resolve(folder, "europe-pmc-search.json"), raw.raw);
  console.log(
    JSON.stringify({
      state: result.state,
      count: result.items.length,
      message: result.message,
    }),
  );
  if (result.state !== "ready") process.exitCode = 1;
} finally {
  db.close();
}
