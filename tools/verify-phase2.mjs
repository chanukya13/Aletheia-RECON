import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { browserEnvironment, root } from "./browser-environment.mjs";
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run through npm run verify:phase2");
const folder = resolve(root, "artifacts/verification/phase-2");
mkdirSync(folder, { recursive: true });
const report = {
  startedAt: new Date().toISOString(),
  node: process.versions.node,
  gates: [],
  status: "running",
  scientificRelease: "draft_pending_human_review",
};
for (const script of [
  "licenses",
  "build",
  "typecheck",
  "lint",
  "data:validate",
  "test:unit",
  "test:integration",
  "test:e2e",
]) {
  console.log(`Verifying ${script}`);
  const started = performance.now();
  const result = spawnSync(process.execPath, [npmCli, "run", script], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    env: browserEnvironment(),
    maxBuffer: 10_000_000,
  });
  const output = (result.stdout ?? "") + (result.stderr ?? "");
  writeFileSync(resolve(folder, `${script.replaceAll(":", "-")}.log`), output);
  process.stdout.write(output);
  report.gates.push({
    script,
    exitCode: result.status,
    durationMs: Math.round(performance.now() - started),
    error: result.error?.message ?? null,
  });
  if (result.status !== 0 || result.error) {
    report.status = "failed";
    break;
  }
}
if (report.status !== "failed") report.status = "technical_passed";
report.finishedAt = new Date().toISOString();
writeFileSync(
  resolve(folder, "report.json"),
  JSON.stringify(report, null, 2) + "\n",
);
if (report.status !== "technical_passed") process.exitCode = 1;
