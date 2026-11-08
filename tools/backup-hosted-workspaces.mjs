import {
  mkdirSync,
  readdirSync,
  copyFileSync,
  chmodSync,
  writeFileSync,
} from "node:fs";
import { resolve, relative, isAbsolute, sep } from "node:path";
import Database from "better-sqlite3";

const [sourceArg, destinationArg] = process.argv.slice(2);
if (!sourceArg || !destinationArg)
  throw new Error(
    "Usage: node tools/backup-hosted-workspaces.mjs SOURCE_DIRECTORY NEW_BACKUP_DIRECTORY",
  );
const source = resolve(sourceArg),
  destination = resolve(destinationArg),
  inside = relative(source, destination);
if (
  !inside ||
  (!(inside === ".." || inside.startsWith(".." + sep)) && !isAbsolute(inside))
)
  throw new Error(
    "Backup destination must be outside the live workspace directory.",
  );
// A fresh directory prevents overwriting an earlier backup.
mkdirSync(destination, { recursive: false, mode: 0o700 });
copyFileSync(
  resolve(source, "workspace-secret.key"),
  resolve(destination, "workspace-secret.key"),
);
chmodSync(resolve(destination, "workspace-secret.key"), 0o600);
const files = readdirSync(source).filter((f) =>
  /^[a-f0-9]{32}\.sqlite$/.test(f),
);
for (const file of files) {
  const db = new Database(resolve(source, file), {
    readonly: true,
    fileMustExist: true,
  });
  try {
    await db.backup(resolve(destination, file));
  } finally {
    db.close();
  }
  chmodSync(resolve(destination, file), 0o600);
}
writeFileSync(
  resolve(destination, "backup-manifest.json"),
  JSON.stringify(
    {
      version: "recon-hosted-backup-1",
      createdAt: new Date().toISOString(),
      databases: files,
      method: "SQLite online backup API; session signing key retained",
      notes:
        "Each database is a consistent snapshot. Databases are backed up individually; source and rights artifacts remain in the deployed code release.",
    },
    null,
    2,
  ) + "\n",
  { mode: 0o600 },
);
console.log(JSON.stringify({ status: "backed_up", databases: files.length }));
