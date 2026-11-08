import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const root = resolve(import.meta.dirname, "..");
const temp = resolve(root, "artifacts/tmp");
mkdirSync(temp, { recursive: true });
const project = process.argv[2];
if (!["unit", "integration"].includes(project))
  throw new Error("Unknown test project");
const result = spawnSync(
  process.execPath,
  [
    resolve(root, "node_modules/vitest/vitest.mjs"),
    "run",
    "--config",
    "vitest.config.ts",
    "--project",
    project,
    ...process.argv.slice(3),
  ],
  {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
    env: { ...process.env, TEMP: temp, TMP: temp, TMPDIR: temp },
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
