import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, relative, dirname } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { root, browserEnvironment } from "./browser-environment.mjs";
const base = resolve(root, "artifacts/verification/phase-5"),
  fresh = resolve(base, `clean-${randomUUID()}`);
mkdirSync(fresh, { recursive: true });
for (const name of ["apps", "packages", "tools", "tests", "data"])
  cpSync(resolve(root, name), resolve(fresh, name), {
    recursive: true,
    filter: (path) =>
      !path.endsWith(".tsbuildinfo") &&
      !relative(root, path)
        .split(/[\\/]/)
        .some((part) => ["node_modules", "dist", "local"].includes(part)),
  });
for (const name of [
  "package.json",
  "package-lock.json",
  "tsconfig.base.json",
  "tsconfig.tools.json",
  "eslint.config.js",
  "vitest.config.ts",
  "playwright.config.ts",
])
  cpSync(resolve(root, name), resolve(fresh, name));
const npm = process.env.npm_execpath;
if (!npm) throw Error("Run clean verification through npm");
const logs = [];
function run(args) {
  const p = spawnSync(process.execPath, args, {
    cwd: fresh,
    encoding: "utf8",
    windowsHide: true,
    env: browserEnvironment(),
    maxBuffer: 20_000_000,
    timeout: 600000,
  });
  logs.push({ args, exitCode: p.status });
  writeFileSync(
    resolve(base, `clean-${logs.length}.log`),
    (p.stdout ?? "") + (p.stderr ?? ""),
  );
  if (p.status !== 0)
    throw Error(
      `Clean gate failed: ${args.join(" ")}; see clean-${logs.length}.log`,
    );
}
run([npm, "ci"]);
run([npm, "run", "build"]);
run([
  "--input-type=module",
  "-e",
  `import {pathToFileURL} from 'node:url'; const url=import.meta.resolve('@recon/core'); if(!url.startsWith(pathToFileURL(process.cwd()+'/').href))throw Error('Clean workspace resolved a parent dependency'); console.log(url);`,
]);
run([npm, "run", "data:validate"]);
run([npm, "run", "evaluation:run"]);
run([npm, "run", "evidence:report"]);
run([npm, "run", "db:seed"]);
const child = spawn(process.execPath, ["apps/server/dist/index.js"], {
    cwd: fresh,
    windowsHide: true,
    stdio: "ignore",
    env: {
      ...browserEnvironment(),
      RECON_PORT: "4319",
      RECON_LIVE_TAXONOMY: "0",
    },
  }),
  url = "http://127.0.0.1:4319";
try {
  let token = "";
  const deadline = Date.now() + 30000;
  while (true) {
    try {
      const response = await fetch(url + "/api/v1/health");
      if (response.ok) break;
    } catch {
      /* Server is not listening yet; readiness has a bounded deadline. */
    }
    if (Date.now() > deadline) throw Error("Clean server startup failed");
    await new Promise((r) => setTimeout(r, 200));
  }
  const api = async (path, payload) => {
    const response = await fetch(
      url + "/api/v1" + path,
      payload
        ? {
            method: "POST",
            headers: {
              "content-type": "application/json",
              origin: url,
              "x-recon-csrf": token,
            },
            body: JSON.stringify(payload),
          }
        : {},
    );
    if (!response.ok)
      throw Error(
        `Clean API failed ${response.status}: ${await response.text()}`,
      );
    return response.json();
  };
  const health = await api("/health");
  token = (await api("/editor-session")).csrfToken;
  const context = (await api("/cases/balds-eyesalve/interpretation-domain"))
    .context;
  const evaluated = await api("/cases/balds-eyesalve/scenario-evaluate", {
    context,
    scenario: {
      assignments: [],
      hypotheticalOverrides: [],
      rationale: "Clean-install verification; not a scientific review.",
    },
    evidenceUnitIds: ["eu-2020-eso-newman"],
  });
  const frozen = await api("/analyses", {
    requestId: randomUUID(),
    name: "Clean installation verification",
    runHash: evaluated.runHash,
  });
  const bundle = await api(`/analyses/${frozen.id}/dossier`);
  writeFileSync(resolve(fresh, "clean-replay.json"), JSON.stringify(bundle));
  run([
    "--require",
    resolve(fresh, "tools/offline-network.cjs"),
    "tools/replay-dossier.mjs",
    "clean-replay.json",
  ]);
  const preview = await api("/imports/bundle/preview", {
    bundle: JSON.stringify(bundle),
  });
  if (preview.receipt.scientificResultHash !== bundle.scientificResultHash)
    throw Error("Clean replay mismatch");
  const report = {
    checkedAt: new Date().toISOString(),
    workspace: fresh,
    node: process.versions.node,
    npm: JSON.parse(
      readFileSync(resolve(dirname(npm), "../package.json"), "utf8"),
    ).version,
    lockfileVersion: JSON.parse(
      readFileSync(resolve(fresh, "node_modules/.package-lock.json"), "utf8"),
    ).lockfileVersion,
    health,
    gates: logs,
    scientificResultHash: bundle.scientificResultHash,
    isolatedImportPreview: preview.receipt.status,
    status: "passed",
  };
  writeFileSync(
    resolve(base, "clean-install.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  child.kill();
}
