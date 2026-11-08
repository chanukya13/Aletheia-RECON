import { it, expect } from "vitest";
import { normalizePublicOrigin } from "../../apps/server/src/request-origin.js";
it("requires a canonical secure deployment origin and allows explicit loopback HTTP for local verification", () => {
  expect(normalizePublicOrigin("https://recon.example/")).toBe(
    "https://recon.example",
  );
  expect(normalizePublicOrigin("http://127.0.0.1:4321")).toBe(
    "http://127.0.0.1:4321",
  );
  for (const value of [
    "http://recon.example",
    "https://user:pass@recon.example",
    "https://recon.example/path",
    "https://recon.example/?q=1",
    "https://recon.example/#fragment",
    "ftp://recon.example",
  ])
    expect(() => normalizePublicOrigin(value)).toThrow();
});
