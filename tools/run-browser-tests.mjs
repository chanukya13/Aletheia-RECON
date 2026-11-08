import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { browserEnvironment, root } from "./browser-environment.mjs";

const requested = process.argv.slice(2);
const phaseFiles = [
  ["annotation-spike.spec.ts"],
  ["phase-1-source-reader.spec.ts"],
  ["phase-2-curation.spec.ts"],
  ["phase-3-evidence-audit.spec.ts"],
  ["phase-4-interpretations.spec.ts", "phase-4-material-versions.spec.ts"],
  ["phase-5-end-to-end.spec.ts"],
  ["phase-6-trace.spec.ts", "phase-7-outcomes.spec.ts"],
  ["research-journey.spec.ts"],
];
const batches = requested.length
  ? [requested]
  : phaseFiles.map((files) => files.map((file) => `tests/browser/${file}`));
const reports = [];
const reportDirectory = resolve(root, "artifacts/browser/phase-reports");
mkdirSync(reportDirectory, { recursive: true });
let exitCode = 0;
for (const [index, args] of batches.entries()) {
  const reportFile = resolve(reportDirectory, `batch-${index + 1}.json`);
  const result = spawnSync(
    process.execPath,
    [
      resolve(root, "node_modules/@playwright/test/cli.js"),
      "test",
      ...(args.some((a) => a.startsWith("--project"))
        ? []
        : ["--project=chromium"]),
      ...args,
    ],
    {
      cwd: root,
      stdio: "inherit",
      windowsHide: true,
      env: {
        ...browserEnvironment(),
        RECON_PORT: "4318",
        RECON_DATABASE_PATH: `data/local/e2e-${randomUUID()}.sqlite`,
        RECON_LIVE_TAXONOMY: "0",
        RECON_BROWSER_REPORT: reportFile,
        RECON_BROWSER_OUTPUT: resolve(
          root,
          `artifacts/browser/test-results/batch-${index + 1}`,
        ),
      },
    },
  );
  if (result.error) throw result.error;
  try {
    reports.push(JSON.parse(readFileSync(reportFile, "utf8")));
  } catch {
    exitCode = 1;
  }
  if (result.status !== 0) {
    exitCode = result.status ?? 1;
    break;
  }
}
if (reports.length) {
  const combined = {
    ...reports[0],
    suites: reports.flatMap((r) => r.suites),
    errors: reports.flatMap((r) => r.errors),
    stats: {
      ...reports[0].stats,
      duration: reports.reduce((n, r) => n + r.stats.duration, 0),
      expected: reports.reduce((n, r) => n + r.stats.expected, 0),
      skipped: reports.reduce((n, r) => n + r.stats.skipped, 0),
      unexpected: reports.reduce((n, r) => n + r.stats.unexpected, 0),
      flaky: reports.reduce((n, r) => n + r.stats.flaky, 0),
    },
  };
  writeFileSync(
    resolve(
      root,
      process.env.RECON_BROWSER_REPORT ?? "artifacts/browser/results.json",
    ),
    JSON.stringify(combined, null, 2) + "\n",
  );
}
process.exitCode = exitCode;
