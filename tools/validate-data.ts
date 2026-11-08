import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseJsonStrict, sha256, validateCorpus } from "@recon/core";
const root = resolve(import.meta.dirname, "..");
const bytes = readFileSync(resolve(root, "data/corpus/recon-v1.json"));
const corpus = validateCorpus(parseJsonStrict(bytes.toString("utf8")));
const manifest = parseJsonStrict(
  readFileSync(resolve(root, "data/corpus-manifest.json"), "utf8"),
) as Record<string, unknown>;
if (
  sha256(bytes) !== manifest.corpusSha256 ||
  corpus.cases.length !== 2 ||
  corpus.studies.length !== 3 ||
  corpus.evidenceUnits.length < 12 ||
  corpus.evidenceUnits.length !== manifest.evidenceUnitCount
)
  throw new Error("CORPUS_MANIFEST_MISMATCH");
for (const r of corpus.sourceRevisions) {
  for (const [file, hash] of [
    [r.rawFile, r.rawSha256],
    [r.rights.evidenceFile, r.rights.evidenceSha256],
  ]) {
    const target = resolve(root, file!);
    if (!target.startsWith(root + "\\") && !target.startsWith(root + "/"))
      throw new Error("SOURCE_PATH_ESCAPE");
    if (sha256(readFileSync(target)) !== hash)
      throw new Error(`ARTIFACT_HASH_MISMATCH:${file}`);
  }
}
console.log(
  `PASS: ${corpus.sourceRevisions.length} source revisions, ${corpus.spans.length} exact spans, ${corpus.assertions.length} assertions, ${corpus.evidenceUnits.length} evidence units. Raw bytes, rights evidence, hashes and references verified.`,
);
const taxonomyManifest = parseJsonStrict(
  readFileSync(resolve(root, "data/taxonomy/manifest.json"), "utf8"),
) as { files: { file: string; sha256: string }[] };
for (const file of taxonomyManifest.files) {
  const target = resolve(root, file.file);
  if (
    !target.startsWith(resolve(root, "data/taxonomy/raw") + "\\") &&
    !target.startsWith(resolve(root, "data/taxonomy/raw") + "/")
  )
    throw new Error("TAXONOMY_PATH_ESCAPE");
  if (sha256(readFileSync(target)) !== file.sha256)
    throw new Error(`TAXONOMY_SNAPSHOT_DRIFT:${file.file}`);
}
const metadata = parseJsonStrict(
  readFileSync(
    resolve(root, "data/taxonomy/raw/backbone-metadata.json"),
    "utf8",
  ),
) as { key: string; license: string };
if (
  metadata.key !== "d7dddbf4-2cf0-4f39-9b2a-bb099caae36c" ||
  !metadata.license.includes("creativecommons.org/licenses/by/4.0/")
)
  throw new Error("TAXONOMY_LICENSE_MISMATCH");
console.log(
  `PASS: ${taxonomyManifest.files.length} retained GBIF responses/metadata verified against frozen hashes; dataset license verified.`,
);
