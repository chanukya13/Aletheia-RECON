import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/hosted-browser",
  timeout: 90000,
  expect: { timeout: 10000 },
  workers: 1,
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile:
          process.env.RECON_HOSTED_REPORT ??
          "artifacts/deployment/hosted-browser.json",
      },
    ],
  ],
  outputDir: "artifacts/deployment/browser-results",
  use: {
    baseURL: process.env.RECON_TEST_URL ?? "http://127.0.0.1:4321",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  ...(process.env.RECON_TEST_URL
    ? {}
    : {
        webServer: {
          command: "npm run start:hosted",
          url: "http://127.0.0.1:4321/api/v1/health",
          timeout: 30000,
          reuseExistingServer: false,
        },
      }),
});
