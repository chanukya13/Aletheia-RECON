import { createApp } from "./app.js";
import { resolve } from "node:path";
import { ROOT } from "./database.js";
const port = Number(process.env.RECON_PORT ?? 4317);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("RECON_PORT must be a valid unprivileged port");
const requestedPath = process.env.RECON_DATABASE_PATH;
const databasePath = requestedPath ? resolve(ROOT, requestedPath) : undefined;
if (
  databasePath &&
  !databasePath.startsWith(resolve(ROOT, "data/local") + "\\") &&
  !databasePath.startsWith(resolve(ROOT, "data/local") + "/")
)
  throw new Error("Database path must stay inside data/local");
const app = await createApp({
  dev: process.argv.includes("--dev"),
  logger: true,
  editor: !process.argv.includes("--read-only"),
  liveTaxonomy:
    process.env.RECON_LIVE_TAXONOMY !== "0" &&
    !process.argv.includes("--read-only"),
  ...(databasePath ? { databasePath } : {}),
});
try {
  await app.listen({ host: "127.0.0.1", port });
} catch (error) {
  app.log.error(error);
  await app.close();
  process.exitCode = 1;
}
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.once(signal, () => {
    void app.close().then(() => {
      process.exitCode = 0;
    });
  });
