/* global scrollTo, document, innerWidth */
import { chromium, expect } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { browserEnvironment, root } from "./browser-environment.mjs";
Object.assign(process.env, browserEnvironment());
const folder = resolve(root, "artifacts/verification/phase-5");
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    }),
    base = "http://127.0.0.1:4317",
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
  const health = await (await page.request.get(base + "/api/v1/health")).json();
  expect(health.migration).toBe(6);
  const before = await (
    await page.request.get(base + "/api/v1/cases/balds-eyesalve?revision=1")
  ).json();
  await page.goto(base + "/cases/balds-eyesalve/interpretations?revision=1");
  await expect(page.locator(".scenario-evidence input")).toHaveCount(14);
  for (const box of await page.locator(".scenario-evidence input").all())
    await box.uncheck();
  const studies = await (
    await page.request.get(base + "/api/v1/studies")
  ).json();
  for (const unit of studies.evidenceUnits.filter(
    (u) => u.studyId === "study-furner-pardoe-2020",
  ))
    await page
      .getByRole("checkbox", { name: unit.armLabel, exact: true })
      .check();
  await page.getByLabel("Domain review mode").selectOption("draft_exploration");
  await page
    .locator(".robustness-controls")
    .getByRole("checkbox", { name: /oleraceum/ })
    .uncheck();
  await page
    .getByLabel("Subset rationale")
    .fill(
      "Bounded two-proposal investigation of the source-reported onion/leek alternatives. The tentative edition gloss is excluded explicitly; this is not an exhaustive or independently reviewed botanical domain.",
    );
  await page
    .getByLabel("Clarification target")
    .selectOption("conditional_identity_vector");
  await page
    .getByRole("button", { name: "Preview exact domain", exact: true })
    .click();
  await expect(page.getByText(/2 admissible world\(s\)/)).toBeVisible();
  await page
    .getByRole("button", {
      name: "Audit all selected alternatives",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Exact audit / 2 world(s)",
      exact: true,
    }),
  ).toBeVisible();
  const name = "Eyesalve / bounded onion-leek draft audit";
  await page.getByLabel("Analysis name", { exact: true }).fill(name);
  await page
    .getByRole("button", { name: "Save frozen analysis", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Open dossier and downloads", exact: true })
    .click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  const analysisId = page.url().split("/").at(-1);
  await page.screenshot({
    path: resolve(
      "artifacts/browser/screenshots/phase5-live-dossier-desktop.png",
    ),
  });
  const files = {};
  for (const [label, ext] of [
    ["Download replay JSON", "json"],
    ["Download readable HTML", "html"],
    ["Download CSL-JSON", "csl.json"],
    ["Download BibTeX", "bib"],
    ["Download RIS", "ris"],
  ]) {
    const awaited = page.waitForEvent("download");
    await page.getByRole("link", { name: label, exact: true }).click();
    const download = await awaited,
      target = resolve(folder, `live-dossier.${ext}`);
    await download.saveAs(target);
    expect(await download.failure()).toBeNull();
    files[ext] = target;
  }
  const bundle = JSON.parse(readFileSync(files.json, "utf8")),
    replay = spawnSync(
      process.execPath,
      [
        "--require",
        resolve(root, "tools/offline-network.cjs"),
        resolve(root, "tools/replay-dossier.mjs"),
        files.json,
      ],
      { cwd: root, encoding: "utf8", windowsHide: true, timeout: 90000 },
    );
  expect(replay.status, replay.stderr).toBe(0);
  expect(JSON.parse(replay.stdout).scientificResultHash).toBe(
    bundle.scientificResultHash,
  );
  await page
    .getByRole("button", {
      name: "Inspect exact source passages",
      exact: false,
    })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    path: resolve("artifacts/browser/screenshots/phase5-live-source.png"),
  });
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: resolve(
      "artifacts/browser/screenshots/phase5-live-dossier-narrow.png",
    ),
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  const offline = await browser.newContext({
      offline: true,
      viewport: { width: 1440, height: 900 },
    }),
    html = await offline.newPage();
  await html.goto("file:///" + files.html.replaceAll("\\", "/"));
  await html
    .getByRole("heading", {
      name: "Frozen assumptions and decisions",
      exact: true,
    })
    .scrollIntoViewIfNeeded();
  await html.screenshot({
    path: resolve(
      "artifacts/browser/screenshots/phase5-live-standalone-html.png",
    ),
  });
  await offline.close();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base + "/evaluation");
  await expect(
    page.getByRole("heading", {
      name: "Authentic development diagnostic",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("heading", {
      name: "Authentic development diagnostic",
      exact: true,
    })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: resolve("artifacts/browser/screenshots/phase5-live-evaluation.png"),
  });
  const after = await (
    await page.request.get(base + "/api/v1/cases/balds-eyesalve?revision=1")
  ).json();
  expect(after).toEqual(before);
  expect(errors).toEqual([]);
  const report = {
    checkedAt: new Date().toISOString(),
    health,
    browserVersion: browser.version(),
    analysisId,
    analysisUrl: `${base}/analyses/${analysisId}`,
    scientificResultHash: bundle.scientificResultHash,
    caseHashBefore: before.case.contentHash,
    caseHashAfter: after.case.contentHash,
    files,
    replay: JSON.parse(replay.stdout),
    errors,
    scope:
      "Actual local workspace: saved one genuine explicitly bounded draft analysis. No source/assertion/material/case revision or human review was changed.",
  };
  writeFileSync(
    resolve(folder, "live-browser.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
