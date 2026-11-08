import type { FastifyRequest } from "fastify";

export function normalizePublicOrigin(value: string): string {
  const url = new URL(value);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !(loopback && url.protocol === "http:")) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "RECON_PUBLIC_ORIGIN must be an HTTPS origin without a path or credentials.",
    );
  return url.origin;
}
export function requestOrigin(req: FastifyRequest, publicOrigin?: string) {
  return publicOrigin ?? new URL(`http://${req.headers.host}`).origin;
}
