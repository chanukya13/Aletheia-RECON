import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { browserEnvironment, root } from "./browser-environment.mjs";
const result = spawnSync(
  process.execPath,
  [
    resolve(root, "node_modules/@playwright/test/cli.js"),
    "test",
    "--config=playwright.hosted.config.ts",
    ...process.argv.slice(2),
  ],
  {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
    env: {
      ...browserEnvironment(),
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
process.exitCode = result.status ?? 1;
