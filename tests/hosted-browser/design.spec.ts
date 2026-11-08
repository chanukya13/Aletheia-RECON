import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("first-use explanation, licensed assets and keyboard navigation reflow across five widths", async ({
  page,
}) => {
  test.setTimeout(process.env.RECON_TEST_URL ? 240000 : 90000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/research");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Old remedies.",
    );
    await expect(
      page.getByText(
        "Discover what a historical remedy meant—and what modern researchers actually tested.",
        { exact: true },
      ),
    ).toBeVisible();
    const image = page.getByRole("img", { name: /Illustrative still life/ });
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.naturalWidth),
      )
      .toBeGreaterThan(0);
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.fonts.check("16px Manrope")),
    ).toBe(true);
    await expect(
      page.getByRole("link", { name: "Start the eyesalve investigation" }),
    ).toHaveAttribute("href", "/cases/balds-eyesalve/source");
    const menu = page.getByRole("button", {
      name: "Open navigation",
      exact: true,
    });
    if (width <= 820) {
      await expect(
        page.getByRole("navigation", { name: "Main navigation" }),
      ).toBeHidden();
      await menu.focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("navigation", { name: "Main navigation" }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(menu).toBeFocused();
      await menu.click();
    }
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Case library", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Start with the source.",
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
  await page.goto("/research");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 740, height: 375 });
  await page.locator("html").evaluate((element) => {
    element.style.fontSize = "200%";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("published measurement chart changes with strain and disappears for incompatible endpoints", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/outcomes");
  await expect(page.getByTestId("outcome-ratio")).toHaveText("1.00");
  await page
    .getByRole("combobox", { name: "Bacterial strain", exact: true })
    .selectOption("LAC");
  await expect(page.getByTestId("outcome-ratio")).toHaveText("2.00");
  const chart = page.locator(".measurement-chart");
  await expect(chart).toContainText("2.5 % v/v");
  await expect(chart).toContainText("1.25 % v/v");
  const widths = await chart
    .locator(".measurement-track > span")
    .evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().width),
    );
  expect(widths[0]! / widths[1]!).toBeCloseTo(2, 1);
  await chart.getByRole("button", { name: "Inspect ES-O source cell" }).click();
  await expect(page.getByRole("dialog").locator("mark")).toHaveText("2.5");
  await page.keyboard.press("Escape");
  await page
    .getByRole("combobox", { name: "Compare onion with", exact: true })
    .selectOption("biofilm");
  await expect(
    page.getByRole("heading", { name: "Ratio unavailable", exact: true }),
  ).toBeVisible();
  await expect(chart).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Not numerically curated", exact: true }),
  ).toBeVisible();
});

test("source quotations and advanced scientific controls are accessible on demand", async ({
  page,
}) => {
  await page.goto("/trace");
  const quotation = page.locator("article").filter({
    has: page.getByRole("button", {
      name: "Exclude original-language printed edition · span-cropleac-original",
      exact: true,
    }),
  });
  await expect(quotation.locator("blockquote")).toBeHidden();
  await quotation
    .locator("summary")
    .filter({ hasText: "Read quoted passage" })
    .click();
  await expect(quotation.locator("blockquote")).toHaveText("cropleac");
  await quotation
    .getByRole("button", { name: "Inspect exact passage" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Ƿyrc");
  await page.keyboard.press("Escape");
  await page.goto("/cases/balds-eyesalve/interpretations");
  await expect(
    page.getByLabel("Identity interpretation slot-cropleek", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Domain review mode")).toBeHidden();
  await page
    .locator("summary")
    .filter({ hasText: "Advanced: test alternative readings" })
    .click();
  await expect(page.getByLabel("Domain review mode")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Preview exact domain", exact: true }),
  ).toBeEnabled();
});
