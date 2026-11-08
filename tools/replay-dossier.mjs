import { readFileSync } from "node:fs";
import { parseJsonStrict, replayDossier } from "@recon/core";
const file = process.argv[2];
if (!file) throw Error("Usage: npm run replay -- path/to/dossier.json");
console.log(
  JSON.stringify(
    replayDossier(parseJsonStrict(readFileSync(file, "utf8"), 32_000_000)),
    null,
    2,
  ),
);
