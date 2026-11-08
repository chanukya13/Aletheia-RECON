process.env.RECON_VERIFICATION_FOLDER = "artifacts/deployment/verification";
process.env.RECON_INCLUDE_HOSTED = "1";
await import("./verify-extensions.mjs");
