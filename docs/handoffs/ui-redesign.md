# Research desk UI handoff

8 November 2026. The visual redesign is implemented, deployed and verified on the public service.

## Published release

- [Open the research desk](https://aletheia-recon.onrender.com/research).
- Runtime source: [`ffa84821fc65f9cfd22e2cd055d51ff32a414035`](https://github.com/chanukya13/Aletheia-RECON/commit/ffa84821fc65f9cfd22e2cd055d51ff32a414035).
- Render deploy `dep-dbo8ummc6qcc73cvpclg` became live at `2026-11-08T15:05:10Z`, on the existing Singapore Free service. No paid resources or API keys were introduced.
- [Independent Ubuntu CI](https://github.com/chanukya13/Aletheia-RECON/actions/runs/42492861093) passed build, types, lint, data checks, evaluation generation, 131 unit tests, 58 integration tests and 15 hosted-browser cases.
- All 15 browser cases also passed against the actual public HTTPS URL: five each in Chromium, Firefox and WebKit. Final public screenshots, console/network checks and HTTPS/cookie/origin/CSRF checks passed.
- Local public-release evidence is in `artifacts/design/live-browser.json`, `live-security.json`, `live-visual-inspection.json`, `linux-ci.log` and `deployment-receipt.json`. The exact deployed source archive is `aletheia-recon-ui-ffa8482.zip` in the same ignored folder. Private test traces/cookies remain excluded from Git.

Subsequent handoff/README updates are documentation-only; automatic deployment remains disabled.

## Resulting experience

The home page explains historical-remedy investigation in one sentence and offers a single primary starting action. A clearly labeled illustrative still life introduces the onion/leek question. A persistent desktop rail and keyboard-operable mobile menu expose the same working features. The research journey marks the current location; it does not invent completed steps.

Interpretation tracing groups actual source roles, gives common names alongside the proposed Latin names, and reveals quotations, support paths and identifiers on demand. Exclusions still recompute the real recorded support. Measured outcomes plot the selected published medians from zero, preserve units/strain and link each bar to its exact source cell. Incompatible endpoints display no chart or ratio. Scenario controls with no proposed choices no longer dominate the form; advanced robustness controls remain accessible. Evaluation keeps actual baseline results prominent and moves raw diagnostics into disclosures.

The design applies across source reading, library, curation, evidence, scenarios, material comparisons, dossiers and imports. The original scientific engine, contracts, corpus bytes, policies and review status are unchanged. No model/API key or paid service was introduced.

## Executed local gates

`artifacts/design/verification/report.json` finished `technical_passed` at `2026-11-08T15:02:00Z`.

| Gate | Actual result |
| --- | --- |
| Build, TypeScript, lint, license inventory | Passed |
| Retained sources, rights, spans, hashes and references | Passed |
| Evaluation and source-cell report generation | Passed; existing limitations retained |
| Unit tests | 131 passed |
| Integration tests | 58 passed |
| Chromium full regression | 46 passed |
| Firefox/WebKit regression | 18 passed |
| Hosted UI/browser matrix | 15 passed: five per engine |
| Total unique test cases | 268 passed; no skipped, unexpected or flaky final cases |

The new browser checks exercise the explanation/primary action, actual illustration/font loading, keyboard menu opening/closing and navigation at 320/390/768/1024/1440 widths, reduced motion, landscape/root text reflow, source quotation inspection, advanced controls, chart scale changes and incompatible-endpoint rejection. Existing browser workflows verify actual edits, source locations, immutable revisions, saves, file downloads, isolated imports, offline replay, privacy, accessibility and console/network errors.

Fourteen additional local route/width inspections returned no document overflow or unexpected browser errors. Before/after screenshots and machine-readable inspection records remain in ignored `artifacts/design`. The public-facing overview screenshots are [desktop](../screenshots/research-desktop.png) and [phone](../screenshots/research-mobile.png).

An early new test used an incorrect exact label locator and assumed a word-span contained the full opening clause; these checks were corrected against the real UI/source and passed. The broader regression identified an actual inline-link accessibility issue; an underline fixed it, and the complete gate was rerun successfully. Failed reports/traces are retained separately, including `verification-first-accessibility-failure`, `scenario-link-accessibility-failures` and `initial-browser-failures`.

## Scope and limits

This was a heuristic/code/browser redesign, not an independent usability study. Rendered desktop main-content counts fell from 222 to 144 words on Home and 565 to 205 on Evaluation; these are narrow UI text counts, not evidence of better researcher comprehension. Actual source passages remain available.

Free hosting still uses temporary private workspaces and can sleep after inactivity. Dossier downloads/imports/offline replay preserve portable work. Deployment resets temporary server data; the UI states the limit. The corpus remains assistant-checked and pending independent human review. No scientific accuracy, historical identity, clinical efficacy or general benchmark superiority is claimed.

The [design notes](../ui-redesign.md) retain the external guidance, original asset prompt/provenance, locally bundled Manrope license and visual decisions. No registration, Devpost submission, slides or pitch video was created in this task.
