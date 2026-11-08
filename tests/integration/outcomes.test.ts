import { it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createApp } from "../../apps/server/src/app.js";
import { openDatabase, readCorpus } from "../../apps/server/src/database.js";
import { OutcomeCatalogue, OutcomeContrast } from "@recon/contracts";
import { scientificHash } from "@recon/core";
it("serves source cells and strict pairs read-only, preserves database and replays the downloaded JSON in a network-blocked fresh process", async () => {
  const db = openDatabase(":memory:"),
    app = await createApp({ db, ui: false, editor: false });
  try {
    const before = scientificHash(readCorpus(db)),
      response = await app.inject("/api/v1/outcome-observations");
    expect(response.statusCode, response.body).toBe(200);
    const catalogue = OutcomeCatalogue.parse(response.json());
    expect(catalogue.observations).toHaveLength(17);
    const response2 = await app.inject(
      "/api/v1/outcome-contrast?left=obs-2018-lac-es-o&right=obs-2018-lac-es-l",
    );
    expect(response2.statusCode, response2.body).toBe(200);
    const comparison = OutcomeContrast.parse(response2.json());
    expect(comparison.ratio).toBe(2);
    const folder = mkdtempSync(resolve("artifacts/tmp/outcome-")),
      file = resolve(folder, "comparison.json");
    writeFileSync(file, response2.body);
    const replay = spawnSync(
      process.execPath,
      [
        "--require",
        resolve("tools/offline-network.cjs"),
        "tools/replay-outcome.mjs",
        file,
      ],
      { encoding: "utf8", windowsHide: true, timeout: 10000 },
    );
    expect(replay.status, replay.stderr).toBe(0);
    expect(JSON.parse(replay.stdout).resultHash).toBe(comparison.resultHash);
    const bad = await app.inject(
      "/api/v1/outcome-contrast?left=obs-2018-lac-es-o&right=obs-2020-esl-newman",
    );
    expect(bad.json().status).toBe("unavailable");
    expect(bad.json().ratio).toBeNull();
    expect(
      (await app.inject("/api/v1/outcome-contrast?left=missing&right=missing"))
        .statusCode,
    ).toBe(404);
    expect(
      (
        await app.inject(
          "/api/v1/outcome-contrast?left=../../secret&right=missing",
        )
      ).statusCode,
    ).toBe(400);
    expect(scientificHash(readCorpus(db))).toBe(before);
  } finally {
    await app.close();
    db.close();
  }
});
