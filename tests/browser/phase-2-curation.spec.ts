import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { CaseResponse } from "@recon/contracts";
const screenshots = resolve("artifacts/browser/screenshots");
mkdirSync(screenshots, { recursive: true });
async function importPassage(
  page: Page,
  language = "en",
  text = "𐐀 Take garlic and honey in equal quantities. Mix, then strain. Do not boil.",
) {
  await page.goto("/cases");
  await page.getByRole("button", { name: "Import passage" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Case title")
    .fill(`Browser curation ${language} ${Date.now()}`);
  await dialog.getByLabel("Language").fill(language);
  await dialog
    .getByLabel("Author / source credit")
    .fill("Browser fixture author");
  await dialog.getByLabel("Edition").fill("Synthetic private test passage");
  await dialog.getByLabel("Exact source passage").fill(text);
  await dialog
    .getByLabel("Rights basis / permission note")
    .fill("Synthetic browser fixture; local test only.");
  await dialog.getByRole("button", { name: "Create local draft" }).click();
  await expect(
    page.getByRole("heading", { name: "From wording to material" }),
  ).toBeVisible();
  return page.url().match(/cases\/(case-[^/]+)\//)![1]!;
}
async function current(page: Page, id: string) {
  return CaseResponse.parse(
    await (await page.request.get(`/api/v1/cases/${id}`)).json(),
  );
}
async function save(page: Page, revision: number) {
  await page
    .getByRole("button", { name: "Save new revision", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: `Saved revision ${revision}.` }),
  ).toBeVisible();
}
async function selectActualText(page: Page, quote: string) {
  const box = await page
    .getByRole("region", { name: "Edition passage" })
    .evaluate((el, value) => {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = w.nextNode())) {
        const at = node.textContent!.indexOf(value);
        if (at >= 0) {
          const r = document.createRange();
          r.setStart(node, at);
          r.setEnd(node, at + value.length);
          const bounds = r.getBoundingClientRect();
          return {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
          };
        }
      }
      return null;
    }, quote);
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + 1, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width - 1, box!.y + box!.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
  await page
    .getByRole("button", { name: "Inspect selection", exact: false })
    .click();
  await expect(
    page.getByRole("region", { name: "Selection inspection" }),
  ).toContainText(quote);
  await page
    .getByRole("button", { name: "Annotate selection", exact: true })
    .click();
}
for (const viewport of [
  { width: 1440, height: 900, name: "desktop" },
  { width: 1024, height: 768, name: "tablet" },
  { width: 390, height: 844, name: "phone" },
]) {
  test(`import, review, immutable history and unknowns · ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [],
      failures: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
    });
    page.on("requestfailed", (r) => {
      if (r.failure()?.errorText !== "net::ERR_ABORTED") failures.push(r.url());
    });
    const id = await importPassage(page);
    const original = await current(page, id);
    expect(original.sourceRevisions[0]!.rights.redistribution).toBe(false);
    await page
      .getByRole("button", { name: "Find preparation proposals" })
      .click();
    const garlic = page
      .locator(".proposal-card")
      .filter({ has: page.locator(".quote-button", { hasText: "“garlic”" }) });
    await garlic.getByRole("button", { name: "“garlic”" }).click();
    await expect(page.locator("[data-annotation]").first()).toBeVisible();
    await garlic.getByRole("button", { name: "Use in draft" }).click();
    await garlic.getByLabel("Controlled value").fill("garlic");
    await page
      .locator(".proposal-card")
      .filter({ has: page.locator(".quote-button", { hasText: "“honey”" }) })
      .getByRole("button", { name: "Reject", exact: true })
      .click();
    for (const verb of ["Mix", "strain"])
      await page
        .locator(".proposal-card")
        .filter({
          has: page.locator(".quote-button", { hasText: `“${verb}”` }),
        })
        .getByRole("button", { name: "Use in draft" })
        .click();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Case library" })
      .click();
    const blocker = page.getByRole("dialog", {
      name: "Leave unsaved changes?",
    });
    await expect(blocker).toBeVisible();
    await blocker.getByRole("button", { name: "Stay in editor" }).click();
    await page
      .getByRole("textbox", { name: "Revision rationale", exact: true })
      .fill(
        "Accepted exact garlic and ordered operations; rejected honey in this synthetic test.",
      );
    await save(page, 2);
    await page.reload();
    const record = await current(page, id);
    expect(record.case.revision).toBe(2);
    expect(record.material.componentSlots).toHaveLength(1);
    expect(record.material.steps).toHaveLength(2);
    expect(record.material.fingerprint).toHaveLength(64);
    expect(
      record.assertions.find(
        (a) => a.id === record.material.componentSlots[0]!.termAssertionId,
      )!.review.status,
    ).toBe("pending");
    await page.getByRole("tab", { name: "Ingredients", exact: true }).click();
    const ingredient = page.locator(".ingredient-card").first();
    await expect(ingredient).toContainText("Unknown");
    await ingredient.getByText("Edit part / material state").click();
    await ingredient.getByLabel("Unknown reason").selectOption("not_reported");
    await save(page, 3);
    await page.getByRole("tab", { name: "History", exact: true }).click();
    await expect(page.getByText("Revision 3", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Inspect r1", exact: false }).click();
    await expect(
      page.getByText("Pinned revision · editing disabled"),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Ingredients", exact: true }).click();
    await expect(
      page.getByText("No ingredient occurrences have been saved yet.", {
        exact: false,
      }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "open the latest revision to edit" })
      .click();
    await page.getByRole("tab", { name: "Preparation", exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: resolve(screenshots, `material-${viewport.name}.png`),
      fullPage: true,
    });
    const a11y = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      a11y.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    expect(errors).toEqual([]);
    expect(failures).toEqual([]);
  });
}
test("unsupported Unicode manual annotation through actual selection and keyboard fallback", async ({
  page,
}) => {
  const text = "𐐀 ά · Ƿyrc cropleac ⁊ garleac · cropleac";
  const id = await importPassage(page, "ang", text);
  await page
    .getByRole("button", { name: "Find preparation proposals" })
    .click();
  await expect(
    page.getByText("Automatic extraction unavailable for this language", {
      exact: true,
    }),
  ).toBeVisible();
  await selectActualText(page, "cropleac");
  let dialog = page.getByRole("dialog", { name: "Annotate exact source text" });
  await dialog
    .getByLabel("Rationale", { exact: true })
    .fill("Exact original wording; no automatic modern translation.");
  await dialog.getByRole("button", { name: "Add annotation to draft" }).click();
  await save(page, 2);
  await page.getByText("Locate exact text with the keyboard").click();
  await page.getByLabel("Exact text to annotate").fill("cropleac");
  await page
    .getByRole("combobox", { name: "Occurrence", exact: true })
    .selectOption("1");
  await page
    .getByRole("button", { name: "Locate and annotate", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Rationale", { exact: true })
    .fill("Separate repeated occurrence selected with keyboard.");
  await dialog.getByRole("button", { name: "Add annotation to draft" }).click();
  await save(page, 3);
  const data = await current(page, id);
  expect(data.material.componentSlots).toHaveLength(2);
  expect(new Set(data.material.componentSlots.map((s) => s.id)).size).toBe(2);
  for (const slot of data.material.componentSlots) {
    const a = data.assertions.find((a) => a.id === slot.termAssertionId)!;
    const ref = a.references.find((r) => r.kind === "span")!;
    if (ref.kind !== "span") throw Error("Missing span");
    const span = data.spans.find((s) => s.id === ref.spanId)!;
    expect(text.slice(span.start, span.end)).toBe("cropleac");
  }
});
test("candidate normalization, explicit assumptions, taxonomy failure and race handling", async ({
  page,
}) => {
  await page.goto("/cases/balds-eyesalve/material");
  await page.getByRole("tab", { name: "Ingredients", exact: true }).click();
  const ingredient = page.locator(".ingredient-card").filter({
    has: page.getByRole("heading", { name: "cropleek", exact: true }),
  });
  await ingredient
    .getByRole("button", { name: "Inspect / normalize name" })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Scientific name to look up").fill("Allium porrum");
  await dialog.getByRole("button", { name: "Look up modern name" }).click();
  await expect(dialog.locator(".taxonomy-result")).toContainText("HIGHERRANK");
  await expect(dialog.getByRole("checkbox")).toHaveCount(0);
  await dialog.getByLabel("Scientific name to look up").fill("Allium cepa");
  await dialog.getByRole("button", { name: "Look up modern name" }).click();
  await expect(dialog.getByRole("checkbox")).toBeVisible();
  await dialog.getByRole("checkbox").check();
  await dialog
    .getByRole("button", { name: "Stage candidate", exact: true })
    .click();
  await save(page, 2);
  let data = await current(page, "balds-eyesalve");
  const normalized = data.candidates.find(
    (c) => c.proposedName === "Allium cepa" && c.taxonConceptId,
  )!;
  expect(normalized).toBeTruthy();
  expect(
    data.taxa!.find((t) => t.id === normalized.taxonConceptId)!.reportedName,
  ).toBe("Allium cepa L.");
  expect(data.case.baselineScenarioInput.assignments).toEqual([]);
  await page.getByRole("tab", { name: "Ingredients", exact: true }).click();
  await page.locator(`input[value="${normalized.id}"]`).check();
  await page
    .getByLabel("Interpretation rationale")
    .fill(
      "Explicit synthetic onion assumption; historical identity is unresolved.",
    );
  await save(page, 3);
  data = await current(page, "balds-eyesalve");
  expect(data.case.baselineScenarioInput.assignments[0]!.candidateId).toBe(
    normalized.id,
  );
  await page.getByRole("tab", { name: "Ingredients", exact: true }).click();
  await page
    .locator(".ingredient-card")
    .first()
    .getByRole("button", { name: "Add source-backed candidate" })
    .click();
  const name = dialog.getByLabel("Scientific name to look up");
  await page.route("**/taxonomy/candidates?*", async (route) => {
    const query = new URL(route.request().url()).searchParams.get(
      "scientificName",
    );
    if (query === "Slowus plantus") {
      await new Promise((r) => setTimeout(r, 500));
      await route.fulfill({
        json: {
          schemaVersion: "recon-v1",
          query,
          snapshotId: null,
          state: "unavailable",
          source: "none",
          stale: false,
          retrievedAt: null,
          datasetId: "d7dddbf4-2cf0-4f39-9b2a-bb099caae36c",
          datasetTitle: "GBIF Backbone Taxonomy",
          licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
          matchType: "UNAVAILABLE",
          choices: [],
          message: "Synthetic delayed provider failure",
        },
      });
    } else await route.continue();
  });
  await name.fill("Slowus plantus");
  await dialog.getByRole("button", { name: "Look up modern name" }).click();
  await name.fill("Allium cepa");
  await dialog.getByRole("button", { name: "Look up modern name" }).click();
  await expect(dialog.locator(".taxonomy-result")).toContainText(
    "Allium cepa L.",
  );
  await page.waitForTimeout(650);
  await expect(dialog.locator(".taxonomy-result")).not.toContainText("Slowus");
  await name.fill("Uncachedus plantus");
  await dialog.getByRole("button", { name: "Look up modern name" }).click();
  await expect(dialog.locator(".taxonomy-result")).toContainText("unavailable");
  await expect(dialog.getByRole("checkbox")).toHaveCount(0);
  await page.keyboard.press("Escape");
});
test("stale revision keeps the visible draft and returns 409", async ({
  page,
}) => {
  const id = await importPassage(page);
  await page
    .getByRole("textbox", { name: "Revision rationale", exact: true })
    .fill("Keep this local unsaved draft.");
  const other = await page.context().newPage();
  await other.goto(`/cases/${id}/material`);
  await other
    .getByRole("textbox", { name: "Revision rationale", exact: true })
    .fill("Concurrent revision from another editor.");
  await save(other, 2);
  await other.close();
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/cases/${id}/revisions`) &&
      r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Save new revision", exact: true })
    .first()
    .click();
  expect((await response).status()).toBe(409);
  await expect(page.getByRole("alert")).toContainText("Draft not saved");
  await expect(
    page.getByRole("textbox", { name: "Revision rationale", exact: true }),
  ).toHaveValue("Keep this local unsaved draft.");
});
test("keyboard editor tabs, zoom-equivalent reflow, reduced motion and inert imported text", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:4318",
    viewport: { width: 720, height: 450 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  try {
    await importPassage(
      page,
      "en",
      "<script>window.RECON_INJECTED=true</script> Take garlic.",
    );
    await expect(
      page.getByRole("region", { name: "Edition passage" }),
    ).toContainText("<script>");
    expect(await page.evaluate(() => "RECON_INJECTED" in window)).toBe(false);
    await page.getByRole("tab", { name: "Proposals", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      page.getByRole("tab", { name: "Ingredients", exact: true }),
    ).toBeFocused();
    await expect(
      page.getByRole("tab", { name: "Ingredients", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("End");
    await expect(
      page.getByRole("tab", { name: "History", exact: true }),
    ).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: resolve(screenshots, "material-200-percent-reflow.png"),
      fullPage: true,
    });
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          reason: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  } finally {
    await context.close();
  }
});
