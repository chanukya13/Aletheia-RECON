import { it, expect } from "vitest";
import { createApp } from "../../apps/server/src/app.js";
import { openDatabase, readCorpus } from "../../apps/server/src/database.js";
import { VerificationStudy } from "@recon/contracts";
import { scientificHash } from "@recon/core";
it("serves the executed query-level study with a verifiable hash, separate controlled tasks and unchanged database", async () => {
  const db = openDatabase(":memory:"),
    app = await createApp({ db, ui: false, editor: false });
  try {
    const before = scientificHash(readCorpus(db)),
      response = await app.inject("/api/v1/verification-study");
    expect(response.statusCode, response.body).toBe(200);
    const report = VerificationStudy.parse(response.json()),
      { contentHash, ...body } = report;
    expect(scientificHash(body)).toBe(contentHash);
    expect(report.audit.assertions).toBe(report.audit.checks.length);
    expect(report.audit.reviewerType).toBe("automated");
    expect(report.independentReviewers).toBe(0);
    expect(report.predictions).toHaveLength(
      report.supportedQueries + report.controlledQueries,
    );
    expect(report.methods.join(" ")).toContain("correlated");
    const recon = report.metrics.find(
        (m) => m.name === "RECON structured cell lookup",
      )!,
      filtered = report.metrics.find(
        (m) => m.name === "BM25 + exact context filters",
      )!;
    expect(recon.totalCorrect).toBe(filtered.totalCorrect);
    for (const m of report.metrics) {
      expect(m.totalCorrect).toBe(m.supportedCorrect + m.unsupportedAbstained);
      expect(m.unsupportedLinks + m.unsupportedAbstained).toBe(
        report.controlledQueries,
      );
      expect(m.accuracy).toBe(m.totalCorrect / m.total);
    }
    expect(scientificHash(readCorpus(db))).toBe(before);
  } finally {
    await app.close();
    db.close();
  }
});
