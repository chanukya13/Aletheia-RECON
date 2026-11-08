import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { browserEnvironment, root } from "./browser-environment.mjs";

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run through npm run verify:extensions");
const folder = resolve(
  root,
  process.env.RECON_VERIFICATION_FOLDER ?? "artifacts/verification/extensions",
);
mkdirSync(folder, { recursive: true });
const report = {
  startedAt: new Date().toISOString(),
  node: process.versions.node,
  status: "running",
  scientificRelease: "draft_pending_human_review",
  gates: [],
};
for (const script of [
  "licenses",
  "build",
  "typecheck",
  "lint",
  "data:validate",
  "evaluation:run",
  "evidence:report",
  "test:unit",
  "test:integration",
  "test:e2e",
  "test:cross-browser",
  ...(process.env.RECON_INCLUDE_HOSTED === "1" ? ["test:hosted"] : []),
]) {
  console.log(`Verifying ${script}`);
  const started = Date.now();
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
    durationMs: Date.now() - started,
    error: result.error?.message ?? null,
  });
  if (result.status !== 0 || result.error) {
    report.status = "failed";
    break;
  }
}
if (report.status !== "failed") {
  report.status = "technical_passed";
  copyFileSync(
    resolve(root, "artifacts/browser/results.json"),
    resolve(folder, "chromium.json"),
  );
  copyFileSync(
    resolve(root, "artifacts/browser/cross-results.json"),
    resolve(folder, "cross-browser.json"),
  );
}
report.finishedAt = new Date().toISOString();
writeFileSync(
  resolve(folder, "report.json"),
  JSON.stringify(report, null, 2) + "\n",
);
if (report.status !== "technical_passed") process.exitCode = 1;
