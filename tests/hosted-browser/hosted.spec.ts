import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  freezeCase,
  downloadFile,
  readJson,
  replayFile,
} from "../browser/phase5-helpers";

for (const width of [1440, 390])
  test(`private hosted research, real export and second-browser isolation at ${width}px`, async ({
    page,
    browser,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    await page.goto("/research");
    await expect(
      page.getByRole("button", { name: "Private workspace", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Private workspace", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      "clearing cookies removes access",
    );
    await page.keyboard.press("Escape");
    const name = `Hosted ${test.info().project.name} ${width}`,
      id = await freezeCase(page, "balds-eyesalve", name);
    const file = await downloadFile(
        page,
        "Download replay JSON",
        `hosted-${test.info().project.name}-${width}.json`,
      ),
      bundle = readJson(file);
    expect(replayFile(file).scientificResultHash).toBe(
      bundle.scientificResultHash,
    );
    await page.reload();
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    const peer = await browser.newContext({
        baseURL: new URL(page.url()).origin,
      }),
      peerPage = await peer.newPage();
    try {
      await peerPage.goto("/analyses");
      await expect(
        peerPage.getByRole("heading", {
          name: "Frozen dossiers.",
          exact: true,
        }),
      ).toBeVisible();
      await expect(peerPage.getByText(name, { exact: true })).toHaveCount(0);
      expect(
        (await peer.request.get(`/api/v1/analyses/${id}/dossier`)).status(),
      ).toBe(404);
    } finally {
      await peer.close();
    }
    await page.goto("/outcomes");
    await page
      .getByRole("combobox", { name: "Bacterial strain", exact: true })
      .selectOption("LAC");
    await expect(page.getByTestId("outcome-ratio")).toHaveText("2.00");
    await page.screenshot({
      path: `artifacts/deployment/hosted-${test.info().project.name}-${width}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
