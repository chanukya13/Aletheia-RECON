import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
export const root = resolve(import.meta.dirname, "..");
export function browserEnvironment() {
  const temp = resolve(root, "artifacts/tmp");
  mkdirSync(temp, { recursive: true });
  const env = { ...process.env, TEMP: temp, TMP: temp, TMPDIR: temp };
  if (env.FORCE_COLOR) delete env.NO_COLOR;
  // Windows sandbox profiles redirect LOCALAPPDATA. Reuse the actual user's
  // existing browser cache when available; never install a second hidden browser.
  const userCache = resolve(homedir(), "AppData/Local/ms-playwright");
  if (
    !env.PLAYWRIGHT_BROWSERS_PATH &&
    process.platform === "win32" &&
    existsSync(userCache)
  )
    env.PLAYWRIGHT_BROWSERS_PATH = userCache;
  return env;
}
