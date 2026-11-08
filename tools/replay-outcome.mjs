import { readFileSync } from "node:fs";
import { OutcomeContrast } from "@recon/contracts";
import { contrastOutcomes, parseJsonStrict } from "@recon/core";
const file = process.argv[2];
if (!file)
  throw new Error("Usage: node tools/replay-outcome.mjs comparison.json");
const original = OutcomeContrast.parse(
  parseJsonStrict(readFileSync(file, "utf8")),
);
const replay = contrastOutcomes(original.left, original.right);
if (
  replay.inputHash !== original.inputHash ||
  replay.resultHash !== original.resultHash ||
  replay.ratio !== original.ratio ||
  replay.status !== original.status ||
  JSON.stringify(replay.reasons) !== JSON.stringify(original.reasons)
)
  throw new Error("OUTCOME_REPLAY_MISMATCH");
console.log(
  JSON.stringify({
    status: "reproduced",
    ratio: replay.ratio,
    resultHash: replay.resultHash,
  }),
);
