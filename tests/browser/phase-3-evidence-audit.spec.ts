import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { resolve } from "node:path";
for (const viewport of [
  { width: 1440, height: 900, name: "desktop" },
  { width: 1024, height: 768, name: "tablet" },
  { width: 390, height: 844, name: "phone" },
])
  test(`real evidence and cited comparisons · ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    await page.goto("/cases/balds-eyesalve/source");
    await page
      .getByRole("link", { name: "Evidence audit", exact: false })
      .click();
    await expect(
      page.getByRole("button", { name: "Compare selected evidence (0)" }),
    ).toBeDisabled();
    await page.getByRole("checkbox").first().check();
    await page
      .getByRole("button", { name: "Compare selected evidence (1)" })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Insufficient information",
        exact: true,
      }),
    ).toBeVisible();
    for (const name of ["composition", "preparation"])
      await page
        .locator(".dimension-reason")
        .filter({ has: page.locator("summary", { hasText: name }) })
        .first()
        .locator("summary")
        .click();
    await page.locator(".dimension-reason[open] .text-button").first().click();
    await expect(
      page.getByRole("dialog", { name: "Supporting source passage" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Edition passage" }),
    ).not.toBeEmpty();
    await page.keyboard.press("Escape");
    await page.getByRole("checkbox").nth(1).check();
    await page
      .getByRole("button", { name: "Compare selected evidence (2)" })
      .click();
    await expect(page.locator(".audit-result")).toHaveCount(2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: resolve(
        `artifacts/browser/screenshots/evidence-${viewport.name}.png`,
      ),
      fullPage: true,
    });
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      axe.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    await page.getByLabel("Literature phrase").fill("unavailable fixture");
    await page
      .getByRole("button", { name: "Search literature", exact: true })
      .click();
    await expect(
      page.getByText(
        "Europe PMC is unavailable. Local studies and comparisons remain usable.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(page.locator(".audit-result")).toHaveCount(2);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Recorded-material comparison" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
