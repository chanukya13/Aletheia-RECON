import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { browserEnvironment, root } from "./browser-environment.mjs";
const args = process.argv.slice(2),
  selected = args
    .filter((a) => a.startsWith("--project="))
    .map((a) => a.slice(10));
const projects = selected.length ? selected : ["chromium", "firefox", "webkit"],
  reports = [];
const folder = resolve(root, "artifacts/deployment/hosted-projects");
mkdirSync(folder, { recursive: true });
let exitCode = 0;
for (const project of projects) {
  const reportFile = resolve(folder, `${project}.json`),
    env = browserEnvironment(),
    engines = resolve(root, "artifacts/browser-engines");
  if (
    process.platform === "win32" &&
    project !== "chromium" &&
    existsSync(engines)
  )
    env.PLAYWRIGHT_BROWSERS_PATH = engines;
  const result = spawnSync(
    process.execPath,
    [
      resolve(root, "node_modules/@playwright/test/cli.js"),
      "test",
      "--config=playwright.hosted.config.ts",
      ...args.filter((a) => !a.startsWith("--project=")),
      `--project=${project}`,
    ],
    {
      cwd: root,
      stdio: "inherit",
      windowsHide: true,
      env: {
        ...env,
        RECON_HOSTED_REPORT: reportFile,
        PORT: "4321",
        RECON_PUBLIC_ORIGIN: "http://127.0.0.1:4321",
        RECON_DATA_DIR: resolve(
          root,
          `data/local/hosted-browser-${randomUUID()}`,
        ),
        RECON_LIVE_TAXONOMY: "0",
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
  const first = reports[0],
    combined = {
      ...first,
      suites: reports.flatMap((r) => r.suites),
      errors: reports.flatMap((r) => r.errors),
      stats: {
        ...first.stats,
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
      process.env.RECON_HOSTED_REPORT ??
        "artifacts/deployment/hosted-browser.json",
    ),
    JSON.stringify(combined, null, 2) + "\n",
  );
}
process.exitCode = exitCode;
