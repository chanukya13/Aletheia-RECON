import { resolve } from "node:path";
import {
  loadCorpus,
  migrate,
  openDatabase,
  ROOT,
  seed,
} from "../apps/server/src/database.js";
const db = openDatabase(resolve(ROOT, "data/local/recon.sqlite"));
try {
  migrate(db);
  seed(db, loadCorpus());
  console.log("Corpus seeded; immutable revisions preserved.");
} finally {
  db.close();
}
