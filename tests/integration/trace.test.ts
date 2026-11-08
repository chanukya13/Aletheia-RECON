import { it, expect } from "vitest";
import { createApp } from "../../apps/server/src/app.js";
import { InterpretationTrace } from "@recon/contracts";
it("serves bounded read-only trace requests and explicit invalid input errors", async () => {
  const app = await createApp({
    databasePath: ":memory:",
    ui: false,
    editor: false,
  });
  try {
    const result = await app.inject(
      "/api/v1/interpretation-trace?q=cropleac&exclude=span-edition-gloss",
    );
    expect(result.statusCode, result.body).toBe(200);
    expect(
      InterpretationTrace.parse(result.json()).candidates.find(
        (c) => c.id === "candidate-edition-oleraceum",
      )?.survivingPaths,
    ).toBe(0);
    expect(
      (await app.inject("/api/v1/interpretation-trace?q=" + "x".repeat(81)))
        .statusCode,
    ).toBe(400);
    expect(
      (
        await app.inject(
          "/api/v1/interpretation-trace?q=cropleac&exclude=missing",
        )
      ).statusCode,
    ).toBe(422);
    expect(
      (await app.inject("/api/v1/interpretation-trace?q=oxymel")).json()
        .candidates,
    ).toHaveLength(0);
  } finally {
    await app.close();
  }
});
