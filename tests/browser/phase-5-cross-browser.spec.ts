import { openNavigation } from "./phase5-helpers";
import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import {
  downloadFile,
  freezeCase,
  readJson,
  replayFile,
} from "./phase5-helpers";
for (const viewport of [
  { width: 1440, height: 900, name: "desktop" },
  { width: 390, height: 844, name: "phone" },
])
  test(`key scientific/export workflow · ${viewport.name}`, async ({
    page,
    browser,
    browserName,
  }) => {
    test.setTimeout(120000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    await freezeCase(
      page,
      "balds-eyesalve",
      `${browserName} source-backed dossier ${viewport.name}`,
    );
    const file = await downloadFile(
        page,
        "Download replay JSON",
        `${browserName}-${viewport.name}.json`,
      ),
      bundle = readJson(file);
    expect(replayFile(file).scientificResultHash).toBe(
      bundle.scientificResultHash,
    );
    await downloadFile(
      page,
      "Download readable HTML",
      `${browserName}-${viewport.name}.html`,
    );
    await page
      .getByRole("button", {
        name: "Inspect exact source passages",
        exact: false,
      })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: resolve(
        `artifacts/browser/screenshots/${browserName}-dossier-${viewport.name}.png`,
      ),
    });
    await openNavigation(page);
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Dossiers", exact: true })
      .click();
    await page.getByLabel("Choose dossier JSON").setInputFiles(file);
    await page
      .getByRole("button", { name: "Validate and replay preview", exact: true })
      .click();
    await expect(
      page.getByText("Offline decision replay: reproduced", { exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
    await test.info().attach("actual-browser-version", {
      body: JSON.stringify({
        browser: browserName,
        version: browser.version(),
      }),
      contentType: "application/json",
    });
  });
