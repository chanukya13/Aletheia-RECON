import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { browserEnvironment, root } from "./browser-environment.mjs";
const result = spawnSync(
  process.execPath,
  [
    resolve(root, "node_modules/@playwright/test/cli.js"),
    "test",
    "--project=firefox",
    "--project=webkit",
  ],
  {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
    env: {
      ...browserEnvironment(),
      PLAYWRIGHT_BROWSERS_PATH: resolve(root, "artifacts/browser-engines"),
      RECON_BROWSER_REPORT: "artifacts/browser/cross-results.json",
      RECON_BROWSER_OUTPUT: "artifacts/browser/cross-test-results",
      RECON_PORT: "4318",
      RECON_DATABASE_PATH: `data/local/cross-${randomUUID()}.sqlite`,
      RECON_LIVE_TAXONOMY: "0",
    },
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
