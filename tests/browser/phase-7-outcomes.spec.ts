import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
for (const width of [1440, 390])
  test(`matched outcome cells, strain change, real incompatible endpoint and offline replay at ${width}px`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/trace");
    await page
      .getByRole("link", { name: "Compare measured onion/leek outcomes" })
      .click();
    await expect(page.getByTestId("outcome-ratio")).toHaveText("1.00");
    await page
      .getByRole("combobox", { name: "Bacterial strain", exact: true })
      .selectOption("LAC");
    await expect(page.getByTestId("outcome-ratio")).toHaveText("2.00");
    await page
      .getByRole("button", { name: "Inspect ES-O source cell" })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      "Original table body row 3, column 2.",
    );
    await expect(page.getByRole("dialog").locator("mark")).toHaveText("2.5");
    await page.keyboard.press("Escape");
    const download = page.waitForEvent("download");
    await page
      .getByRole("link", { name: "Download reproducible comparison JSON" })
      .click();
    const file = resolve(`artifacts/browser/downloads/phase7-${width}.json`);
    await (await download).saveAs(file);
    const saved = JSON.parse(readFileSync(file, "utf8"));
    expect(saved.ratio).toBe(2);
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
    expect(JSON.parse(replay.stdout).resultHash).toBe(saved.resultHash);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `artifacts/browser/screenshots/phase7-outcomes-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("combobox", { name: "Compare onion with", exact: true })
      .selectOption("biofilm");
    await expect(
      page.getByRole("heading", { name: "Ratio unavailable", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Not numerically curated",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByTestId("outcome-ratio")).toHaveCount(0);
    await expect(
      page.getByText(
        "Incompatible or unreported endpoint across the selected observations.",
        { exact: true },
      ),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
