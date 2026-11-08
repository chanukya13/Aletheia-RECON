import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  downloadFile,
  readJson,
  replayFile,
  openNavigation,
} from "./phase5-helpers";

async function usable(page: Page) {
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
}
for (const width of [1440, 390])
  test(`guided source → trace → measurement → explicit assumption → portable audit at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Old remedies.",
    );
    await usable(page);
    await page
      .getByRole("link", { name: "Start the eyesalve investigation" })
      .click();
    await expect(
      page.getByRole("heading", { name: "What the record says", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Automated source checks", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "Research journey" })
      .getByRole("link", { name: "Interpretation", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Trace an interpretation." }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Continue to experiment" }).click();
    await expect(page.getByTestId("outcome-ratio")).toHaveText("1.00");
    await page
      .getByRole("combobox", { name: "Bacterial strain", exact: true })
      .selectOption("LAC");
    await expect(page.getByTestId("outcome-ratio")).toHaveText("2.00");
    await usable(page);
    await page
      .getByRole("link", { name: "Audit the onion interpretation" })
      .click();
    await expect(
      page.getByLabel("Identity interpretation slot-cropleek", { exact: true }),
    ).toHaveValue("candidate-onion");
    await expect(page.locator(".scenario-evidence input:checked")).toHaveCount(
      8,
    );
    await expect(
      page.getByText("Prepared interpretation", { exact: true }),
    ).toBeVisible();
    const name = `Guided investigation ${width}`;
    await page.getByLabel("Scenario name", { exact: true }).fill(name);
    await page
      .getByRole("button", { name: "Save scenario revision", exact: true })
      .click();
    await expect(
      page.getByText("Saved scenario r1", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Evaluate this scenario", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Scenario evaluation", exact: true }),
    ).toBeVisible();
    await page.getByLabel("Analysis name", { exact: true }).fill(name);
    await page
      .getByRole("button", { name: "Save frozen analysis", exact: true })
      .click();
    await page
      .getByRole("link", { name: "Open dossier and downloads", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Source checks and assumptions preserved.", {
        exact: true,
      }),
    ).toBeVisible();
    const file = await downloadFile(
        page,
        "Download replay JSON",
        `journey-${width}.json`,
      ),
      bundle = readJson(file);
    expect(replayFile(file).scientificResultHash).toBe(
      bundle.scientificResultHash,
    );
    await usable(page);
    await page.screenshot({
      path: `artifacts/browser/screenshots/journey-dossier-${width}.png`,
      fullPage: true,
    });
    await page.goto("/outcomes");
    await page
      .getByRole("link", { name: "Audit the leek interpretation" })
      .click();
    await expect(
      page.getByLabel("Identity interpretation slot-cropleek", { exact: true }),
    ).toHaveValue("candidate-leek");
    await expect(page.locator(".scenario-evidence input:checked")).toHaveCount(
      8,
    );
    await page.goto(
      "/cases/balds-eyesalve/interpretations?candidate=missing-candidate&study=missing-study",
    );
    await expect(
      page.getByLabel("Identity interpretation slot-cropleek", { exact: true }),
    ).toHaveValue("");
    const baseline = await (
      await page.request.get("/api/v1/cases/balds-eyesalve")
    ).json();
    await expect(page.locator(".scenario-evidence input:checked")).toHaveCount(
      baseline.case.evidenceUnitIds.length,
    );
    expect(errors).toEqual([]);
  });

test("research home and executed baseline results are usable at four widths; report download and retry are real", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/research");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Old remedies.",
    );
    await usable(page);
    await page.screenshot({
      path: `artifacts/browser/screenshots/research-home-${width}.png`,
      fullPage: true,
    });
    for (const id of ["balds-eyesalve", "hippocratic-oxymel"]) {
      await page.goto(`/cases/${id}/source`);
      await expect(
        page.getByRole("heading", {
          name: "What the record says",
          exact: true,
        }),
      ).toBeVisible();
      await usable(page);
      for (const step of await page
        .getByRole("navigation", { name: "Research journey" })
        .getByRole("link")
        .all())
        await expect(step).toBeInViewport({ ratio: 1 });
      await openNavigation(page);
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
    }
    await openNavigation(page);
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Evaluation", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Executed source checks and retrieval comparison",
        exact: true,
      }),
    ).toBeVisible();
    const table = page.getByRole("region", {
      name: "Source-cell retrieval results",
    });
    await expect(table.getByRole("row")).toHaveCount(5);
    await expect(
      table.getByRole("row", { name: /RECON structured cell lookup/ }),
    ).toContainText("32/32 (100.0%)");
    await usable(page);
  }
  const file = await downloadFile(
      page,
      "Download queries, predictions and source-check record ↗",
      "source-cell-study.json",
    ),
    report = readJson(file);
  expect(report.predictions).toHaveLength(32);
  expect(report.independentReviewers).toBe(0);
  await page.screenshot({
    path: "artifacts/browser/screenshots/verification-summary-320.png",
    fullPage: true,
  });
  // A controlled connection failure exercises the actual retry without changing stored evidence.
  await page.route("**/api/v1/verification-study", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Source-cell evaluation unavailable",
      exact: true,
    }),
  ).toBeVisible();
  await page.unroute("**/api/v1/verification-study");
  await page
    .getByRole("button", { name: "Retry source-cell evaluation", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Source-cell retrieval results" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
