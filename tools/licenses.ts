import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { parseJsonStrict } from "@recon/core";
const root = resolve(import.meta.dirname, "..");
type Package = {
  name?: string;
  version?: string;
  license?: string;
  integrity?: string;
  resolved?: string;
  dev?: boolean;
  optional?: boolean;
  link?: boolean;
  repository?: string | { url: string };
};
const lock = parseJsonStrict(
  readFileSync(resolve(root, "package-lock.json"), "utf8"),
) as { packages: Record<string, Package> };
const entries: Array<
  Package & { path: string; installed: boolean; licenseFiles: string[] }
> = [];
const texts = [
  "Aletheia RECON — third-party code notices\nCode and research content have separate licenses. This file contains upstream notices, not a license grant for original Aletheia code.\n",
];
const allowed = new Set([
  "MIT",
  "ISC",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "0BSD",
  "CC0-1.0",
  "CC-BY-4.0",
  "Python-2.0",
  "BlueOak-1.0.0",
  "Unlicense",
  "MPL-2.0",
]);
for (const [path, entry] of Object.entries(lock.packages)) {
  if (!path.includes("node_modules/") || entry.link) continue;
  const folder = resolve(root, path);
  const installed = existsSync(resolve(folder, "package.json"));
  const manifest: Package = installed
    ? (JSON.parse(
        readFileSync(resolve(folder, "package.json"), "utf8"),
      ) as Package)
    : entry;
  const name = manifest.name ?? path.split("node_modules/").at(-1)!;
  const license = manifest.license ?? entry.license ?? "UNKNOWN";
  const tokens = license.replace(/[()]/g, "").split(/\s+(?:OR|AND)\s+/);
  if (tokens.some((t) => !allowed.has(t)))
    throw new Error(`LICENSE_REVIEW_REQUIRED:${name}:${license}`);
  const files = installed
    ? readdirSync(folder).filter((f) =>
        /^(licen[cs]e|copying|notice)([._-]|$)/i.test(f),
      )
    : [];
  entries.push({
    ...entry,
    name,
    version: manifest.version ?? entry.version!,
    license,
    path,
    installed,
    repository: manifest.repository ?? "",
    licenseFiles: files,
  });
  if (installed) {
    texts.push(
      `\n${name}@${manifest.version} — ${license}\n${typeof manifest.repository === "string" ? manifest.repository : (manifest.repository?.url ?? "")}\n`,
    );
    if (name === "@recogito/text-annotator" || name === "@annotorious/core")
      texts.push(
        readFileSync(
          resolve(root, "licenses/recogito-BSD-3-Clause.txt"),
          "utf8",
        ),
      );
    else
      for (const file of files) {
        try {
          texts.push(readFileSync(resolve(folder, file), "utf8"));
        } catch {
          /* Some distributions use a license directory; inventory records it for review. */
        }
      }
  }
}
const fastifyLicense = readFileSync(
  resolve(root, "licenses/fastify-vite-MIT.txt"),
  "utf8",
);
texts.push(
  "\nResearch data attribution: GBIF Secretariat: GBIF Backbone Taxonomy. https://doi.org/10.15468/39omei — CC BY 4.0 https://creativecommons.org/licenses/by/4.0/. Selected raw name-match and accepted-usage responses are retained; normalized projections preserve original usages and qualifiers. See data/taxonomy/manifest.json and source provenance.\n",
);
texts.push(
  "\nAdapted Fastify vanilla TypeScript SPA example\n",
  fastifyLicense,
);
mkdirSync(resolve(root, "docs"), { recursive: true });
mkdirSync(resolve(root, "apps/web/src/public"), { recursive: true });
writeFileSync(
  resolve(root, "docs/dependency-inventory.json"),
  JSON.stringify({ lockfileVersion: 3, packages: entries }, null, 2) + "\n",
);
writeFileSync(
  resolve(root, "apps/web/src/public/THIRD_PARTY_NOTICES.txt"),
  texts.join("\n"),
);
console.log(
  `Reviewed ${entries.length} lockfile packages; ${entries.filter((p) => p.installed).length} installed. No unreviewed license expression. Notices generated.`,
);
console.log(
  "Installed packages without license files:",
  entries
    .filter((p) => p.installed && !p.licenseFiles.length)
    .map((p) => `${p.name}@${p.version}`)
    .join(", "),
);
