import { chromium, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { cpus, totalmem, release } from "node:os";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { browserEnvironment, root } from "./browser-environment.mjs";
Object.assign(process.env, browserEnvironment());
const folder = resolve(root, "artifacts/verification/phase-5");
mkdirSync(folder, { recursive: true });
const child = spawn(process.execPath, ["apps/server/dist/index.js"], {
    cwd: root,
    windowsHide: true,
    stdio: "ignore",
    env: {
      ...browserEnvironment(),
      RECON_PORT: "4320",
      RECON_DATABASE_PATH: `data/local/performance-${randomUUID()}.sqlite`,
      RECON_LIVE_TAXONOMY: "0",
    },
  }),
  base = "http://127.0.0.1:4320";
let browser;
try {
  const deadline = Date.now() + 30000;
  while (true) {
    try {
      if ((await fetch(`${base}/api/v1/health`)).ok) break;
    } catch {
      /* Server is not listening yet; readiness has a bounded deadline. */
    }
    if (Date.now() > deadline) throw Error("Performance server not ready");
    await new Promise((r) => setTimeout(r, 200));
  }
  browser = await chromium.launch({ headless: true });
  const cold = [],
    warm = [];
  for (let i = 0; i < 5; i++) {
    const context = await browser.newContext(),
      page = await context.newPage(),
      start = performance.now();
    await page.goto(`${base}/cases/balds-eyesalve/source?revision=1`);
    await expect(
      page.getByRole("region", { name: "Edition passage" }),
    ).not.toBeEmpty();
    cold.push(performance.now() - start);
    await context.close();
  }
  const context = await browser.newContext(),
    page = await context.newPage();
  await page.goto(`${base}/cases/balds-eyesalve/source?revision=1`);
  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    await page.reload();
    await expect(
      page.getByRole("region", { name: "Edition passage" }),
    ).not.toBeEmpty();
    warm.push(performance.now() - start);
  }
  const api = async (path, payload) => {
    const response = await fetch(
      `${base}/api/v1${path}`,
      payload
        ? {
            method: "POST",
            headers: {
              "content-type": "application/json",
              origin: base,
              "x-recon-csrf": token,
            },
            body: JSON.stringify(payload),
          }
        : {},
    );
    if (!response.ok)
      throw Error(`${response.status}: ${await response.text()}`);
    return response.json();
  };
  const token = (await api("/editor-session")).csrfToken,
    domain = await api("/cases/balds-eyesalve/interpretation-domain");
  const input = {
      context: domain.context,
      scenario: {
        assignments: [],
        hypotheticalOverrides: [],
        rationale:
          "Isolated performance measurement; source claims remain draft.",
      },
      evidenceUnitIds: ["eu-2020-eso-newman"],
    },
    comparison = [];
  let result;
  for (let i = 0; i < 11; i++) {
    const start = performance.now();
    result = await api("/cases/balds-eyesalve/scenario-evaluate", input);
    comparison.push(performance.now() - start);
  }
  const frozen = await api("/analyses", {
    requestId: randomUUID(),
    name: "Isolated performance snapshot",
    runHash: result.runHash,
  });
  const exports = [];
  let bytes = 0;
  for (let i = 0; i < 11; i++) {
    const start = performance.now();
    const response = await fetch(
      `${base}/api/v1/analyses/${frozen.id}/export?format=json`,
    );
    if (!response.ok) throw Error("Export failed");
    const text = await response.text();
    bytes = Buffer.byteLength(text);
    exports.push(performance.now() - start);
  }
  const stats = (values) => {
    const a = [...values].sort((a, b) => a - b);
    return {
      samplesMs: values,
      p50Ms: a[Math.floor(a.length * 0.5)],
      p95Ms: a[Math.ceil(a.length * 0.95) - 1],
    };
  };
  const report = {
    measuredAt: new Date().toISOString(),
    hardware: {
      cpu: cpus()[0]?.model,
      memoryGB: Math.round(totalmem() / 1024 ** 3),
      windows: release(),
      node: process.versions.node,
      browser: browser.version(),
    },
    scope:
      "Isolated production server after readiness; cold = fresh browser context/cache, not OS/disk-cold server. Timings include HTTP and actual DOM readiness. No latency or accuracy generalization.",
    firstUsableCaseCold: stats(cold),
    firstUsableCaseWarm: stats(warm),
    comparisonApi: { coldMs: comparison[0], warm: stats(comparison.slice(1)) },
    exportJsonApi: { coldMs: exports[0], warm: stats(exports.slice(1)), bytes },
    firstUsableCaseTargetMs: 2000,
    coldTargetMet: Math.max(...cold) < 2000,
  };
  writeFileSync(
    resolve(folder, "performance.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
  await context.close();
} finally {
  await browser?.close();
  child.kill();
}
