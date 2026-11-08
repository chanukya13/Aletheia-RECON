import { it, expect } from "vitest";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
it("boots built Fastify/Vite from a different working directory with isolated API fallbacks", () => {
  const root = resolve(import.meta.dirname, "../..");
  const cwd = resolve(root, "artifacts/tmp/startup");
  mkdirSync(cwd, { recursive: true });
  const moduleUrl = pathToFileURL(
    resolve(root, "apps/server/dist/app.js"),
  ).href;
  const script = `import {createApp} from ${JSON.stringify(moduleUrl)}; const app=await createApp({databasePath:":memory:",liveTaxonomy:false}); try { const page=await app.inject('/cases/hippocratic-oxymel/source'); if(page.statusCode!==200||!page.body.includes('id="root"'))throw Error('Deep route failed'); const api=await app.inject('/api/v1/missing'); if(api.statusCode!==404||!api.headers['content-type'].includes('application/json'))throw Error('API fallback failed'); const asset=await app.inject('/missing-asset.js');if(asset.statusCode!==404)throw Error('Missing asset captured by SPA'); console.log('STARTUP_OK'); } finally {await app.close();}`;
  const result = execFileSync(
    process.execPath,
    ["--input-type=module", "-e", script],
    { cwd, encoding: "utf8", windowsHide: true, timeout: 15000 },
  );
  expect(result).toContain("STARTUP_OK");
});
