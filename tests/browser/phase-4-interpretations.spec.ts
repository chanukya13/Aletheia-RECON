import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { resolve } from "node:path";

async function twoArms(page: Page) {
  await page
    .getByText("Advanced: test alternative readings", { exact: true })
    .click();
  await expect(page.locator(".scenario-evidence input")).toHaveCount(14);
  const data = await (await page.request.get("/api/v1/studies")).json();
  const labels = data.evidenceUnits
    .filter(
      (u: { studyId: string }) => u.studyId === "study-furner-pardoe-2020",
    )
    .map((u: { armLabel: string }) => u.armLabel);
  for (const box of await page.locator(".scenario-evidence input").all())
    await box.uncheck();
  for (const name of labels)
    await page.getByRole("checkbox", { name, exact: true }).check();
}
const choice = (page: Page) =>
  page.getByLabel("Identity interpretation slot-cropleek", { exact: true });
async function draftPair(page: Page) {
  await page.getByLabel("Domain review mode").selectOption("draft_exploration");
  await page
    .locator(".robustness-controls")
    .getByRole("checkbox", { name: /oleraceum/ })
    .uncheck();
  await page
    .getByLabel("Subset rationale")
    .fill(
      "Two modern discussion proposals only; tentative edition gloss deliberately excluded.",
    );
  await page
    .getByLabel("Clarification target")
    .selectOption("conditional_identity_vector");
  await page
    .getByRole("button", { name: "Preview exact domain", exact: true })
    .click();
  await expect(
    page.getByText(/2 admissible world\(s\) \/ 2 raw combinations/),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Audit all selected alternatives",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Exact audit / 2 world(s)",
      exact: true,
    }),
  ).toBeVisible();
}
for (const viewport of [
  { width: 1440, height: 900, name: "desktop" },
  { width: 1024, height: 768, name: "tablet" },
  { width: 390, height: 844, name: "phone" },
])
  test(`real interpretation → saved revisions → diff → exact audit → freeze · ${viewport.name}`, async ({
    page,
  }) => {
    test.setTimeout(90000);
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
    await page.goto("/cases/balds-eyesalve/interpretations?revision=1");
    await twoArms(page);
    await expect(
      page.locator(".robustness-controls").getByRole("checkbox").first(),
    ).toBeDisabled();
    await choice(page).selectOption("candidate-onion");
    await page
      .getByRole("button", { name: "Evaluate this scenario", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Scenario evaluation", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".scenario-result")).toHaveCount(2);
    await expect(page.locator(".scenario-result").first()).toContainText(
      "Insufficient information",
    );
    const name = `Browser notebook ${viewport.name}`;
    await page.getByLabel("Scenario name", { exact: true }).fill(name);
    await page
      .getByRole("button", { name: "Save scenario revision", exact: true })
      .click();
    await expect(
      page.getByText("Saved scenario r1", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "Use current input as reference",
        exact: true,
      })
      .click();
    await choice(page).selectOption("candidate-leek");
    await page
      .getByRole("button", { name: "Compare with reference", exact: true })
      .click();
    await expect(page.locator(".diff-panel")).toContainText(
      "2 recomputed unchanged",
    );
    await expect(page.locator(".diff-panel")).toContainText(
      "2 formulation/assay correspondence(s) changed",
    );
    await page
      .getByRole("button", { name: "Save scenario revision", exact: true })
      .click();
    await expect(
      page.getByText("Saved scenario r2", { exact: true }),
    ).toBeVisible();
    await draftPair(page);
    const panel = page.locator(".audit-panel");
    await expect(panel).toContainText(
      "At least one arm has conditional name correspondence in 2 of 2 worlds.",
    );
    await expect(panel).toContainText("Fixed arms covering every world: none.");
    await expect(panel).toContainText("Minimum cardinality: 1.");
    await expect(panel).toContainText("strictly comparable in 0 of 2 worlds");
    await page.getByLabel("Inspect enumerated world").selectOption("1");
    await expect(panel.locator(".correspondence-list")).toContainText(
      "corresponds",
    );
    await panel
      .getByRole("button", {
        name: "Inspect name correspondence basis",
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
    await page
      .getByLabel("Analysis name", { exact: true })
      .fill(`Frozen audit ${viewport.name}`);
    await page
      .getByRole("button", { name: "Save frozen analysis", exact: true })
      .click();
    await expect(
      page.getByText(`Frozen analysis saved: Frozen audit ${viewport.name}`, {
        exact: true,
      }),
    ).toBeVisible();
    await page.screenshot({
      path: resolve(
        `artifacts/browser/screenshots/scenarios-${viewport.name}.png`,
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
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.reload();
    await page
      .getByRole("button", { name: `Load ${name} r2`, exact: true })
      .click();
    await expect(choice(page)).toHaveValue("candidate-leek");
    await page
      .getByRole("button", {
        name: `Frozen audit ${viewport.name} / robustness`,
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("dialog", {
        name: `Frozen analysis: Frozen audit ${viewport.name}`,
      }),
    ).toContainText("Exact audit / 2 world(s)");
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", {
        name: "Reset to saved-case baseline",
        exact: true,
      })
      .click();
    await expect(choice(page)).toHaveValue("");
    expect(errors).toEqual([]);
  });
test("strict invariance, baseline domain, hypothetical exclusion, unsaved navigation and keyboard", async ({
  page,
}) => {
  await page.goto("/cases/balds-eyesalve/interpretations?revision=1");
  await twoArms(page);
  await page
    .getByRole("button", { name: "Preview exact domain", exact: true })
    .click();
  await expect(
    page.getByText(/1 admissible world\(s\) \/ 1 raw combinations/),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Audit all selected alternatives",
      exact: true,
    })
    .click();
  await expect(page.locator(".question-set")).toContainText(
    "Empty set: this target is already invariant",
  );
  await page
    .getByRole("button", { name: "Source basis: Allium cepa", exact: false })
    .first()
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.locator(".hypothesis-editor summary").click();
  await page
    .getByLabel("Material assertion", { exact: true })
    .selectOption("a-brass");
  await page
    .getByLabel("Hypothetical value", { exact: true })
    .fill("glass vessel");
  await page
    .getByLabel("Hypothesis rationale", { exact: true })
    .fill("Conditional contact assumption, not a historical claim.");
  await page
    .getByRole("button", { name: "Add hypothetical override", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Evaluate this scenario", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Conditional hypothetical evaluation",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Preview exact domain", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Hypothetical");
  await expect(
    page.getByRole("button", {
      name: "Audit all selected alternatives",
      exact: true,
    }),
  ).toBeDisabled();
  await page
    .getByRole("link", { name: "Compare material versions", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Leave unsaved scenario?" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Stay in scenario", exact: true })
    .click();
  await expect(
    page.getByLabel("Hypothetical value", { exact: true }),
  ).toHaveValue("glass vessel");
});
test("delayed results cannot overwrite current inputs and cancellation retains the draft", async ({
  page,
}) => {
  await page.goto("/cases/balds-eyesalve/interpretations?revision=1");
  await twoArms(page);
  await page.route("**/scenario-evaluate", async (route) => {
    const response = await route.fetch();
    await new Promise((r) => setTimeout(r, 700));
    await route.fulfill({ response });
  });
  await choice(page).selectOption("candidate-onion");
  await page
    .getByRole("button", { name: "Evaluate this scenario", exact: true })
    .click();
  await choice(page).selectOption("candidate-leek");
  await page.waitForResponse("**/scenario-evaluate");
  await expect(page.locator(".scenario-evaluation")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Evaluate this scenario", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Scenario evaluation", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Evaluate this scenario", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cancel request", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Stopped waiting");
  await expect(choice(page)).toHaveValue("candidate-leek");
});
test("two actual tabs reject a stale scenario revision without discarding edits", async ({
  page,
  context,
}) => {
  await page.goto("/cases/balds-eyesalve/interpretations?revision=1");
  await page
    .getByLabel("Scenario name", { exact: true })
    .fill("Two tab revision fixture");
  await page
    .getByRole("button", { name: "Save scenario revision", exact: true })
    .click();
  await expect(
    page.getByText("Saved scenario r1", { exact: true }),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto("/cases/balds-eyesalve/interpretations?revision=1");
  await other
    .getByRole("button", {
      name: "Load Two tab revision fixture r1",
      exact: true,
    })
    .click();
  await choice(other).selectOption("candidate-leek");
  await choice(page).selectOption("candidate-onion");
  await page
    .getByRole("button", { name: "Save scenario revision", exact: true })
    .click();
  await expect(
    page.getByText("Saved scenario r2", { exact: true }),
  ).toBeVisible();
  await other
    .getByRole("button", { name: "Save scenario revision", exact: true })
    .click();
  await expect(other.getByRole("alert")).toContainText(
    "This scenario has changed",
  );
  await expect(choice(other)).toHaveValue("candidate-leek");
  await other.close();
});
