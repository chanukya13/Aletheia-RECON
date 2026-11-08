import { openNavigation } from "./phase5-helpers";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  downloadFile,
  freezeCase,
  readJson,
  replayFile,
} from "./phase5-helpers";
for (const viewport of [
  { width: 1440, height: 900, name: "desktop" },
  { width: 1024, height: 768, name: "tablet" },
  { width: 390, height: 844, name: "phone" },
  { width: 320, height: 740, name: "narrow" },
])
  test(`frozen authentic case → real files → standalone HTML → offline replay → isolated import · ${viewport.name}`, async ({
    page,
    browser,
  }) => {
    test.setTimeout(150000);
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
    async function openDossierLibrary() {
      // Cached entries can render before the background refresh finishes.
      // Complete both real reads before the next navigation so deliberately
      // canceled reads are not confused with unexpected network failures.
      const refreshed = Promise.all(
        ["analyses", "imports"].map(async (path) => {
          const response = await page.waitForResponse(
            (r) =>
              r.url().endsWith(`/api/v1/${path}`) &&
              r.request().method() === "GET",
          );
          expect(response.ok()).toBe(true);
          await response.finished();
        }),
      );
      await openNavigation(page);
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Dossiers", exact: true })
        .click();
      await refreshed;
    }
    const name = `End-to-end dossier ${viewport.name}`;
    await freezeCase(page, "balds-eyesalve", name);
    await expect(
      page.getByRole("heading", {
        name: "Scientific fingerprint",
        exact: true,
      }),
    ).toBeVisible();
    const jsonFile = await downloadFile(
        page,
        "Download replay JSON",
        `phase5-${viewport.name}.json`,
      ),
      b = readJson(jsonFile);
    expect(replayFile(jsonFile).scientificResultHash).toBe(
      b.scientificResultHash,
    );
    expect(b.scientific.corpus.cases[0].authenticity).toBe("authentic");
    const htmlFile = await downloadFile(
      page,
      "Download readable HTML",
      `phase5-${viewport.name}.html`,
    );
    for (const label of ["CSL-JSON", "BibTeX", "RIS"]) {
      const file = await downloadFile(
        page,
        `Download ${label}`,
        `phase5-${viewport.name}.${label === "CSL-JSON" ? "csl.json" : label === "BibTeX" ? "bib" : "ris"}`,
      );
      expect(readFileSync(file, "utf8")).toContain("Characterization");
    }
    await page
      .getByRole("button", {
        name: "Inspect exact source passages",
        exact: false,
      })
      .first()
      .click();
    await expect(
      page.getByRole("dialog", { name: "Source basis and review status" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Edition passage" }),
    ).not.toBeEmpty();
    await page.keyboard.press("Escape");
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
    await page.screenshot({
      path: resolve(
        `artifacts/browser/screenshots/dossier-${viewport.name}.png`,
      ),
    });
    const offline = await browser.newContext({ viewport }),
      html = await offline.newPage(),
      external: string[] = [];
    html.on("request", (r) => {
      if (/^https?:/.test(r.url())) external.push(r.url());
    });
    await offline.setOffline(true);
    await html.goto(`file:///${htmlFile.replaceAll("\\", "/")}`);
    await expect(
      html.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(
      html.getByText(b.scientificResultHash, { exact: false }),
    ).toBeVisible();
    expect(await html.locator("script").count()).toBe(0);
    expect(external).toEqual([]);
    await html.screenshot({
      path: resolve(
        `artifacts/browser/screenshots/exported-html-${viewport.name}.png`,
      ),
    });
    await offline.close();
    await openDossierLibrary();
    await page.getByLabel("Choose dossier JSON").setInputFiles(jsonFile);
    await page
      .getByRole("button", { name: "Validate and replay preview", exact: true })
      .click();
    await expect(
      page.getByText("Offline decision replay: reproduced", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Store isolated dossier", exact: true })
      .click();
    await expect(
      page.getByText("Untrusted imported research data.", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Replay isolated dossier", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Scientific result reproduced:",
    );
    // Returning through client navigation must show the newly saved namespace,
    // and an editable copy must invalidate an already cached case library.
    await openNavigation(page);
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Case library", exact: true })
      .click();
    await expect(page.locator(".case-card").first()).toBeVisible();
    await openDossierLibrary();
    const importedLink = page
      .locator('a[href^="/imports/"]')
      .filter({ hasText: name });
    await expect(importedLink).toBeVisible();
    await importedLink.click();
    if (viewport.name === "desktop") {
      await page
        .getByRole("button", { name: "Create editable copy", exact: true })
        .click();
      await expect(
        page.getByRole("link", {
          name: "Open new draft material workspace",
          exact: true,
        }),
      ).toBeVisible();
      await openNavigation(page);
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Case library", exact: true })
        .click();
      await expect(
        page.getByRole("heading", {
          name: `${b.scientific.corpus.cases[0].title} / isolated copy`,
          exact: true,
        }),
      ).toBeVisible();
      await openDossierLibrary();
      await page
        .locator('a[href^="/imports/"]')
        .filter({ hasText: name })
        .click();
    }
    await page.reload();
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
test("second authentic family preserves a preparation mention through export and replay", async ({
  page,
}) => {
  test.setTimeout(90000);
  await freezeCase(page, "hippocratic-oxymel", "Oxymel bounded dossier");
  const file = await downloadFile(
    page,
    "Download replay JSON",
    "oxymel-dossier.json",
  );
  const b = readJson(file);
  expect(
    b.scientific.corpus.cases.find(
      (c: { id: string }) => c.id === "hippocratic-oxymel",
    ).kind,
  ).toBe("preparation_mention");
  expect(replayFile(file).status).toBe("reproduced");
});
test("new private passage → actual extraction/revision → selected evidence → frozen export with protected original omitted", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/cases");
  await page
    .getByRole("button", { name: "Import passage", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Case title")
    .fill("Private preparation research note");
  await dialog.getByLabel("Language").fill("en");
  await dialog
    .getByLabel("Author / source credit")
    .fill("Browser-created local note, not historical evidence");
  await dialog.getByLabel("Edition").fill("Private local research note");
  const text =
    "Take garlic and honey in equal quantities. Mix, then strain. This is a private local research note.";
  await dialog.getByLabel("Exact source passage").fill(text);
  await dialog
    .getByLabel("Rights basis / permission note")
    .fill(
      "Private browser verification note; redistribution is not authorized.",
    );
  await dialog
    .getByRole("button", { name: "Create local draft", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Find preparation proposals", exact: true })
    .click();
  const card = page
    .locator(".proposal-card")
    .filter({ has: page.locator(".quote-button", { hasText: "“garlic”" }) });
  await card.getByRole("button", { name: "Use in draft", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Revision rationale", exact: true })
    .fill(
      "Garlic is explicitly mentioned in this private note; keep its claim draft.",
    );
  await page
    .getByRole("button", { name: "Save new revision", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Saved revision 2." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Scenarios & robustness", exact: true })
    .click();
  await expect(page.locator(".scenario-evidence input")).toHaveCount(14);
  await page.locator(".scenario-evidence input").first().check();
  await page
    .getByRole("button", { name: "Evaluate this scenario", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Scenario evaluation", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Analysis name", { exact: true })
    .fill("Imported private note dossier");
  await page
    .getByRole("button", { name: "Save frozen analysis", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Open dossier and downloads", exact: true })
    .click();
  const file = await downloadFile(
      page,
      "Download replay JSON",
      "private-note-dossier.json",
    ),
    b = readJson(file);
  expect(
    b.sources.some((s: { textIncluded: boolean }) => !s.textIncluded),
  ).toBe(true);
  expect(readFileSync(file, "utf8")).not.toContain(text);
  expect(replayFile(file).status).toBe("reproduced");
  await expect(
    page.getByText("Original text omitted", { exact: true }),
  ).toBeVisible();
});
test("actual evaluation ledger, malformed import, keyboard and zoom-equivalent reflow are truthful", async ({
  page,
}) => {
  await page.setViewportSize({ width: 720, height: 450 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/evaluation");
  await page
    .locator("summary")
    .filter({ hasText: "Authentic development diagnostic" })
    .click();
  await page
    .locator("summary")
    .filter({ hasText: "Synthetic engineering panel" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Authentic development diagnostic",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("not scored", { exact: true })).toBeVisible();
  await expect(
    page.getByText("40 / 40 aggregation safety sentinels passed; 0 failed.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: resolve("artifacts/browser/screenshots/evaluation-ledger.png"),
  });
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
  await openNavigation(page);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Dossiers", exact: true })
    .click();
  await page
    .getByLabel("Dossier JSON", { exact: true })
    .fill('{"unsafe":true,"unsafe":false}');
  await page
    .getByRole("button", { name: "Validate and replay preview", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("alert")).toContainText("JSON_DUPLICATE_KEY");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});
