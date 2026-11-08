import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { CaseData } from "@recon/contracts";
const screenshots = resolve("artifacts/browser/screenshots");
mkdirSync(screenshots, { recursive: true });
const casesPath = "/api/v1/cases/balds-eyesalve";
async function assertNoOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
}
for (const viewport of [
  { width: 1440, height: 900, name: "desktop" },
  { width: 1024, height: 768, name: "tablet" },
  { width: 390, height: 844, name: "phone" },
]) {
  test(`source reader end to end · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    const failures: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("requestfailed", (r) => {
      if (r.failure()?.errorText !== "net::ERR_ABORTED")
        failures.push(`${r.url()}: ${r.failure()?.errorText}`);
    });
    page.on("response", (r) => {
      if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
    });
    await page.goto("/cases");
    await expect(
      page.getByRole("heading", { name: "Start with the source." }),
    ).toBeVisible();
    await page.getByRole("searchbox", { name: "Find a case" }).fill("oxymel");
    await expect(page.locator(".case-card")).toHaveCount(1);
    await page.getByRole("searchbox").fill("");
    await assertNoOverflow(page);
    await page.screenshot({
      path: resolve(screenshots, `library-${viewport.name}.png`),
      fullPage: true,
    });
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      accessibility.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    await page.getByRole("link", { name: /Bald’s eyesalve/ }).click();
    const passage = page.getByRole("region", { name: "Edition passage" });
    await expect(passage).toContainText("Work an eye salve for a wen");
    const record = (await (
      await page.request.get(casesPath)
    ).json()) as CaseData;
    const source = record.sourceRevisions.find(
      (r) => r.id === record.case.primarySourceRevisionId,
    )!;
    expect(await passage.textContent()).toBe(source.displayText);
    await expect(passage).toHaveAttribute(
      "data-text-sha256",
      source.textSha256,
    );
    await page
      .getByRole("button", { name: "Provenance", exact: false })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Public Domain Mark 1.0");
    await expect(
      dialog.getByRole("link", { name: "Open scanned page" }),
    ).toHaveAttribute("href", /_0085.jp2\/full\/1400,\/0\/default.jpg$/);
    await expect(dialog).toContainText(source.locator.canvasUrl!);
    await dialog.getByText("Integrity & immutable identifiers").click();
    await expect(dialog).toContainText(source.rawSha256);
    await page.screenshot({
      path: resolve(screenshots, `provenance-${viewport.name}.png`),
    });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Provenance", exact: false }).first(),
    ).toBeFocused();
    await page
      .getByRole("button", { name: /^Historical ingredient term/ })
      .click();
    await expect(dialog).toContainText("span-cropleek");
    await dialog.getByRole("button", { name: "Locate in source" }).click();
    await expect(page.locator(".active-locator")).toContainText(
      "span-cropleek",
    );
    await expect(
      page.locator('[data-annotation="span-cropleek"]').first(),
    ).toBeVisible();
    expect(await passage.textContent()).toBe(source.displayText);
    await page
      .getByRole("button", { name: "Original excerpt", exact: true })
      .click();
    await expect(passage).toContainText("Ƿyrc eagsealfe wiþ");
    await expect(passage).toContainText("cropleac ⁊ garleac");
    await page
      .getByRole("button", { name: "Translation", exact: true })
      .click();
    await expect(passage).toContainText("Work an eye salve");
    await assertNoOverflow(page);
    await page.screenshot({
      path: resolve(screenshots, `reader-${viewport.name}.png`),
      fullPage: true,
    });
    const readerA11y = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      readerA11y.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    await page.getByRole("button", { name: /2018 Fuchs et al/ }).click();
    await expect(
      page.getByRole("heading", { name: "Primary study text" }),
    ).toBeVisible();
    await expect(passage).toContainText("Bald");
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Case library" })
      .click();
    await page.getByRole("link", { name: /Hippocratic oxymel/ }).click();
    await expect(passage).toContainText("freedom of breathing");
    await expect(page.getByText("Original Greek not bundled")).toBeVisible();
    await page.reload();
    await expect(passage).toContainText("16. You will find");
    await assertNoOverflow(page);
    expect(errors).toEqual([]);
    expect(failures).toEqual([]);
  });
}
test("keyboard navigation, dialog focus, 200% zoom-equivalent reflow and reduced motion", async ({
  page,
  browser,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/cases");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  await page.getByRole("link", { name: /Bald’s eyesalve/ }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Bald’s eyesalve", exact: true }),
  ).toBeVisible();
  const trigger = page
    .getByRole("button", { name: "Provenance", exact: false })
    .first();
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() =>
      Boolean(
        document.querySelector("dialog")?.contains(document.activeElement),
      ),
    ),
  ).toBe(true);
  await page.keyboard.press("Shift+Tab");
  expect(
    await page.evaluate(() =>
      Boolean(
        document.querySelector("dialog")?.contains(document.activeElement),
      ),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  // Half the CSS viewport at DPR 2 reproduces 200% desktop zoom reflow in a
  // 1440x900 physical image. This does not claim use of Chrome's OS zoom menu.
  const zoomContext = await browser.newContext({
    baseURL: "http://127.0.0.1:4318",
    viewport: { width: 720, height: 450 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const zoomPage = await zoomContext.newPage();
  await zoomPage.goto("/cases/balds-eyesalve/source");
  await assertNoOverflow(zoomPage);
  await expect(
    zoomPage.getByRole("region", { name: "Edition passage" }),
  ).toBeVisible();
  await zoomPage.screenshot({
    path: resolve(screenshots, "reader-200-percent-reflow.png"),
    fullPage: true,
  });
  expect(
    await zoomPage.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  ).toBe(true);
  expect(await zoomPage.evaluate(() => devicePixelRatio)).toBe(2);
  await zoomContext.close();
});

test("phone touch navigation and source locator", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:4318",
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  try {
    await page.goto("/cases");
    await page.getByRole("link", { name: /Bald’s eyesalve/ }).tap();
    await page
      .getByRole("button", { name: /^Historical ingredient term/ })
      .tap();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Locate in source" })
      .tap();
    await expect(
      page.locator('[data-annotation="span-cropleek"]').first(),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Edition passage" }),
    ).toBeFocused();
    await assertNoOverflow(page);
  } finally {
    await context.close();
  }
});
test("unknown routes and API errors remain truthful and recoverable", async ({
  page,
}) => {
  const response = await page.request.get("/api/v1/not-implemented");
  expect(response.status()).toBe(404);
  expect(response.headers()["content-type"]).toContain("application/json");
  await page.goto("/cases/missing/source");
  await expect(
    page.getByRole("heading", { name: "We couldn’t find that record." }),
  ).toBeVisible();
  await page.goto("/cases/hippocratic-oxymel/source?revision=1");
  await expect(page.getByText(/pinned revision/)).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Edition passage" }),
  ).toContainText("oxymel");
  await page.route("**/api/v1/cases", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "UNAVAILABLE",
          message: "Local records are temporarily unavailable.",
          retryable: true,
          requestId: "browser-test-fixture",
        },
      }),
    }),
  );
  await page.goto("/cases");
  await expect(
    page.getByRole("heading", { name: "Records could not be loaded" }),
  ).toBeVisible();
  await page.unroute("**/api/v1/cases");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator(".case-card")).toHaveCount(2);
});
test("source HTML stays inert text", async ({ page }) => {
  await page.route(`**${casesPath}`, async (route) => {
    const response = await route.fetch();
    const data = (await response.json()) as CaseData;
    data.sourceRevisions[0]!.displayText =
      '<img src=x onerror="window.sourceExecuted=true"><script>window.sourceExecuted=true</script>';
    await route.fulfill({ response, json: data });
  });
  await page.goto("/cases/balds-eyesalve/source");
  const passage = page.getByRole("region", { name: "Edition passage" });
  await expect(passage).toContainText("<script>");
  expect(await passage.locator("script,img").count()).toBe(0);
  expect(
    await page.evaluate(() => Object.hasOwn(window, "sourceExecuted")),
  ).toBe(false);
});
