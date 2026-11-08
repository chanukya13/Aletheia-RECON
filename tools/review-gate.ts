import { loadCorpus } from "../apps/server/src/database.js";
const data = loadCorpus();
const pending = data.assertions.filter(
  (a) => a.review.status !== "accepted" || a.review.reviewerType !== "human",
);
if (pending.length) {
  console.error(
    `SCIENTIFIC RELEASE GATE PENDING: ${pending.length}/${data.assertions.length} assertions lack an accepted independent human check. Technical integrity checks do not satisfy this gate. See docs/review/phase-1-corpus-review.md.`,
  );
  process.exitCode = 1;
} else
  console.log(
    "All assertions have an accepted human review. This is an editorial check, not proof of biological truth.",
  );
