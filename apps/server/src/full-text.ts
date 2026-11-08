import { DOMParser } from "@xmldom/xmldom";
import type Database from "better-sqlite3";
import { parseJsonStrict, sha256 } from "@recon/core";
import { PendingFullText, PendingStudy } from "@recon/contracts";
export function licensedParagraphs(xml: string) {
  if (/<!ENTITY|<!DOCTYPE[^>]*\[/i.test(xml))
    throw Error("Unsafe XML entity declaration");
  const document = new DOMParser({
    errorHandler: {
      warning: () => {},
      error: () => {
        throw Error("Invalid XML");
      },
      fatalError: () => {
        throw Error("Invalid XML");
      },
    },
  }).parseFromString(xml, "text/xml");
  const front = document.getElementsByTagName("front")[0];
  const licenses = Array.from(
    front?.getElementsByTagName("permissions") ?? [],
  ).flatMap((p) => Array.from(p.getElementsByTagName("license")));
  const license = licenses
    .flatMap((node) => [
      node.getAttribute("xlink:href") ?? "",
      node.getAttribute("href") ?? "",
      ...Array.from(node.getElementsByTagName("ext-link")).flatMap((link) => [
        link.getAttribute("xlink:href") ?? "",
        link.getAttribute("href") ?? "",
      ]),
    ])
    .find((href) =>
      /^https?:\/\/creativecommons.org\/(licenses\/by\/4\.0|publicdomain\/zero\/1\.0)\/?$/.test(
        href,
      ),
    );
  if (!license) throw Error("No supported explicit article license");
  const body = document.getElementsByTagName("body")[0];
  if (!body) throw Error("No article body");
  const paragraphs = Array.from(body.getElementsByTagName("p"))
    .filter((node) => {
      let parent = node.parentNode;
      while (parent && parent !== body) {
        if (
          ["fig", "table-wrap", "supplementary-material", "ref-list"].includes(
            parent.nodeName,
          )
        )
          return false;
        parent = parent.parentNode;
      }
      return true;
    })
    .map((node) => node.textContent ?? "");
  const text = paragraphs.join("\n\n");
  if (!text || text.length > 500000) throw Error("Paragraph limit");
  return { license, text };
}
export async function retrievePendingFullText(
  db: Database.Database,
  id: string,
  live: boolean,
  fetcher: typeof fetch = fetch,
) {
  const row = db
    .prepare("SELECT payload FROM pending_studies WHERE id=?")
    .get(id) as { payload: string } | undefined;
  if (!row) throw Error("Pending study not found");
  const study = PendingStudy.parse(parseJsonStrict(row.payload));
  const unavailable = (reason: string) => ({
    status: "metadata_only" as const,
    reason,
    text: "",
    license: null as string | null,
    sha256: null as string | null,
    url: null as string | null,
    retrievedAt: new Date().toISOString(),
  });
  const prior = db
    .prepare("SELECT payload FROM pending_fulltext WHERE id=?")
    .get(id) as { payload: string } | undefined;
  if (prior) return PendingFullText.parse(parseJsonStrict(prior.payload));
  if (
    !study.metadata.pmcid ||
    !study.metadata.openAccess ||
    !/^cc\s*by(?:\s*4\.0)?$|^cc0$/i.test(
      (study.metadata.license ?? "").replaceAll("-", " "),
    )
  )
    return unavailable(
      "No supported open-license metadata and PMCID; metadata retained without text.",
    );
  if (!live) return unavailable("Live full-text retrieval is disabled.");
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/${study.metadata.pmcid}/fullTextXML`;
  try {
    const response = await fetcher(url, { signal: AbortSignal.timeout(7000) });
    if (!response.ok || !response.body) throw Error("Provider unavailable");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        length += part.value.length;
        if (length > 5000000) throw Error("Response limit");
        chunks.push(part.value);
      }
    } finally {
      await reader.cancel();
    }
    const raw = Buffer.concat(chunks).toString("utf8");
    const parsed = licensedParagraphs(raw);
    const result = {
      status: "retained",
      reason:
        "Pending source paragraphs; explicit article license checked. Figures, table blocks, references and supplements excluded. No material, assay or outcome claims were accepted.",
      ...parsed,
      sha256: sha256(raw),
      url,
      retrievedAt: new Date().toISOString(),
    };
    db.prepare("INSERT OR IGNORE INTO pending_fulltext VALUES(?,?,?)").run(
      id,
      raw,
      JSON.stringify(result),
    );
    return result;
  } catch {
    return unavailable(
      "Full text unavailable, malformed, unsafe, over limit or without a supported explicit article license. Metadata remains usable.",
    );
  }
}
