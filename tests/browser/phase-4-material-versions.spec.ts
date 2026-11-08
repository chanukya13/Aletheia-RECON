import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { resolve } from "node:path";
for (const viewport of [
  { width: 1440, height: 900, name: "desktop" },
  { width: 1024, height: 768, name: "tablet" },
  { width: 390, height: 844, name: "phone" },
])
  test(`two authentic material versions → sources on both sides → swap → snapshot · ${viewport.name}`, async ({
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
    page.on("requestfailed", (r) =>
      errors.push(`${r.failure()?.errorText} ${r.url()}`),
    );
    await page.goto("/materials/compare");
    await expect(
      page.getByLabel("Left material version", { exact: true }),
    ).toHaveValue("material-2018-es-o");
    await expect(
      page.getByLabel("Right material version", { exact: true }),
    ).toHaveValue("material-2020-eso");
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
    await expect(page.locator(".version-notes")).toContainText("cropleac");
    await expect(page.locator(".version-notes")).toContainText(
      "Draft / review pending",
    );
    for (const side of ["Left", "Right"]) {
      await page
        .getByRole("button", { name: `${side} source passage`, exact: false })
        .first()
        .click();
      await expect(
        page.getByRole("dialog", { name: "Source basis and review status" }),
      ).toBeVisible();
      await expect(
        page.getByRole("region", { name: "Edition passage" }),
      ).not.toBeEmpty();
      await page.keyboard.press("Escape");
    }
    await page.getByRole("button", { name: "Swap sides", exact: true }).click();
    await expect(
      page.getByLabel("Left material version", { exact: true }),
    ).toHaveValue("material-2020-eso");
    await expect(page.locator(".version-results")).toHaveCount(0);
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
    await page
      .getByLabel("Analysis name", { exact: true })
      .fill(`Material snapshot ${viewport.name}`);
    await page
      .getByRole("button", { name: "Freeze material comparison", exact: true })
      .click();
    await expect(
      page.getByText(/Frozen material comparison saved/),
    ).toBeVisible();
    await page.screenshot({
      path: resolve(
        `artifacts/browser/screenshots/material-versions-${viewport.name}.png`,
      ),
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      axe.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: "Compare material versions.",
        exact: true,
      }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
