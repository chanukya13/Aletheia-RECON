import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const width of [1440, 390])
  test(`source trace exclusion, exact source, restore and oxymel at ${width}px`, async ({
    page,
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
    await page.goto("/cases");
    await page
      .getByRole("link", { name: "Interpretation trace", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Trace an interpretation." }),
    ).toBeVisible();
    const editorial = page.locator("article").filter({
      has: page.getByRole("heading", {
        name: "Allium oleraceum?",
        exact: true,
      }),
    });
    await expect(
      editorial.getByText("Recorded support available", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "Exclude editorial note · span-edition-gloss",
        exact: true,
      })
      .click();
    await expect(
      editorial.getByText("No remaining recorded support", { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .locator("article")
        .filter({
          has: page.getByRole("heading", { name: "Allium cepa", exact: true }),
        })
        .getByText("Recorded support available", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "Restore editorial note · span-edition-gloss",
        exact: true,
      })
      .click();
    await expect(
      editorial.getByText("Recorded support available", { exact: true }),
    ).toBeVisible();
    const original = page
      .locator("article")
      .filter({
        has: page.getByRole("button", {
          name: "Exclude original-language printed edition · span-cropleac-original",
          exact: true,
        }),
      });
    await original
      .getByRole("button", { name: "Inspect exact passage" })
      .click();
    await expect(page.getByRole("dialog")).toContainText("Ƿyrc");
    await page.keyboard.press("Escape");
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
      path: `artifacts/browser/screenshots/phase6-trace-${width}.png`,
      fullPage: true,
    });
    await page.getByLabel("Historical term", { exact: true }).fill("oxymel");
    await page
      .getByRole("button", { name: "Search sources", exact: true })
      .click();
    await expect(
      page.getByText(
        "No explicit interpretation mapping is recorded for this query.",
      ),
    ).toBeVisible();
    await expect(
      page.locator("blockquote").filter({ hasText: "expectoration" }),
    ).toBeVisible();
    await page.goBack();
    await expect(
      page.getByLabel("Historical term", { exact: true }),
    ).toHaveValue("cropleac");
    await expect(
      page.getByRole("heading", { name: "Allium cepa", exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
