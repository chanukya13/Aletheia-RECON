// Keep the earlier phase acceptance reports intact; execute the same full gates.
process.env.RECON_VERIFICATION_FOLDER = "artifacts/verification/product-flow";
await import("./verify-extensions.mjs");
