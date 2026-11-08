import { expect, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
export async function freezeCase(
  page: Page,
  id = "balds-eyesalve",
  name = "Browser final dossier",
) {
  await page.goto(`/cases/${id}/interpretations?revision=1`);
  await expect(page.locator(".scenario-evidence input")).toHaveCount(14);
  for (const box of await page.locator(".scenario-evidence input").all())
    await box.uncheck();
  const studies = await (await page.request.get("/api/v1/studies")).json();
  const unit = studies.evidenceUnits.find(
    (u: { studyId: string }) =>
      u.studyId ===
      (id === "balds-eyesalve"
        ? "study-furner-pardoe-2020"
        : "study-harrison-2023"),
  );
  await page
    .getByRole("checkbox", { name: unit.armLabel, exact: true })
    .check();
  if (id === "balds-eyesalve")
    await page
      .getByLabel("Identity interpretation slot-cropleek", { exact: true })
      .selectOption("candidate-onion");
  await page.getByLabel("Scenario name", { exact: true }).fill(name);
  await page
    .getByRole("button", { name: "Save scenario revision", exact: true })
    .click();
  await expect(
    page.getByText("Saved scenario r1", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Evaluate this scenario", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Scenario evaluation", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Analysis name", { exact: true }).fill(name);
  await page
    .getByRole("button", { name: "Save frozen analysis", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Open dossier and downloads", exact: true })
    .click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  return page.url().split("/").at(-1)!;
}
export async function downloadFile(page: Page, label: string, file: string) {
  mkdirSync(resolve("artifacts/browser/downloads"), { recursive: true });
  const awaited = page.waitForEvent("download");
  await page.getByRole("link", { name: label, exact: true }).click();
  const download = await awaited;
  const target = resolve("artifacts/browser/downloads", file);
  await download.saveAs(target);
  expect(await download.failure()).toBeNull();
  return target;
}
export function replayFile(file: string) {
  const replay = spawnSync(
    process.execPath,
    [
      "--require",
      resolve("tools/offline-network.cjs"),
      "tools/replay-dossier.mjs",
      file,
    ],
    { encoding: "utf8", windowsHide: true, timeout: 90000 },
  );
  expect(replay.status, replay.stderr).toBe(0);
  return JSON.parse(replay.stdout);
}
export const readJson = (file: string) =>
  JSON.parse(readFileSync(file, "utf8"));
