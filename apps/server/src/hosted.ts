import { resolve } from "node:path";
import { createHostedApp } from "./hosted-app.js";

const origin =
  process.env.RECON_PUBLIC_ORIGIN ?? process.env.RENDER_EXTERNAL_URL;
if (!origin)
  throw new Error("RECON_PUBLIC_ORIGIN or RENDER_EXTERNAL_URL is required.");
const directory = process.env.RECON_DATA_DIR;
if (!directory)
  throw new Error("RECON_DATA_DIR must point to persistent storage.");
const port = Number(process.env.PORT ?? 10000);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("PORT must be an unprivileged port.");
const app = await createHostedApp({
  publicOrigin: origin,
  directory: resolve(directory),
  logger: true,
  liveTaxonomy: process.env.RECON_LIVE_TAXONOMY === "1",
});
await app.listen({ host: "0.0.0.0", port });
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.once(signal, () => {
    void app.close().then(() => {
      process.exitCode = 0;
    });
  });
