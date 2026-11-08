import { chromium, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { browserEnvironment } from "./browser-environment.mjs";
Object.assign(process.env, browserEnvironment());
mkdirSync(resolve("artifacts/verification/phase-4"), { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  page.on("requestfailed", (r) =>
    errors.push(`${r.failure()?.errorText} ${r.url()}`),
  );
  const base = "http://127.0.0.1:4317",
    health = await (await page.request.get(`${base}/api/v1/health`)).json();
  const before = await (
    await page.request.get(`${base}/api/v1/cases/balds-eyesalve?revision=1`)
  ).json();
  await page.goto(`${base}/cases/balds-eyesalve/interpretations?revision=1`);
  await expect(page.locator(".scenario-evidence input")).toHaveCount(14);
  const studies = await (
    await page.request.get(`${base}/api/v1/studies`)
  ).json();
  for (const box of await page.locator(".scenario-evidence input").all())
    await box.uncheck();
  for (const unit of studies.evidenceUnits.filter(
    (u) => u.studyId === "study-furner-pardoe-2020",
  ))
    await page
      .getByRole("checkbox", { name: unit.armLabel, exact: true })
      .check();
  await page
    .getByLabel("Identity interpretation slot-cropleek", { exact: true })
    .selectOption("candidate-onion");
  const response = page.waitForResponse((r) =>
    r.url().endsWith("/scenario-evaluate"),
  );
  await page
    .getByRole("button", { name: "Evaluate this scenario", exact: true })
    .click();
  const evaluated = await (await response).json();
  await expect(page.locator(".scenario-result")).toHaveCount(2);
  await page.screenshot({
    path: resolve("artifacts/browser/screenshots/phase4-live-desktop.png"),
  });
  await page
    .getByRole("button", { name: "Source basis: Allium cepa", exact: false })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Edition passage" }),
  ).not.toBeEmpty();
  await page.screenshot({
    path: resolve("artifacts/browser/screenshots/phase4-live-source.png"),
  });
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Reset to saved-case baseline", exact: true })
    .click();
  await expect(
    page.getByLabel("Identity interpretation slot-cropleek", { exact: true }),
  ).toHaveValue("");
  await page.goto(`${base}/materials/compare`);
  await page
    .getByRole("button", {
      name: "Compare pinned material versions",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Insufficient information",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: resolve(
      "artifacts/browser/screenshots/phase4-live-material-desktop.png",
    ),
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: resolve(
      "artifacts/browser/screenshots/phase4-live-material-phone.png",
    ),
  });
  const after = await (
    await page.request.get(`${base}/api/v1/cases/balds-eyesalve?revision=1`)
  ).json();
  expect(after).toEqual(before);
  expect(errors).toEqual([]);
  expect(health.migration).toBe(5);
  const report = {
    checkedAt: new Date().toISOString(),
    baseURL: base,
    health,
    caseHashBefore: before.case.contentHash,
    caseHashAfter: after.case.contentHash,
    scenarioRunHash: evaluated.runHash,
    scenarioKind: evaluated.kind,
    verdicts: evaluated.results.map((r) => r.materialComparison.verdict),
    correspondence: evaluated.correspondence.map((r) => ({
      unit: r.evidenceUnitId,
      state: r.state,
    })),
    errors,
    scope:
      "Actual user workspace; only computed run records were added. No source/assertion/material/case revision or human review was changed.",
  };
  writeFileSync(
    resolve("artifacts/verification/phase-4/live-browser.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
