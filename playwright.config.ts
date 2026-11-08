import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 30000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile:
          process.env.RECON_BROWSER_REPORT ?? "artifacts/browser/results.json",
      },
    ],
  ],
  outputDir:
    process.env.RECON_BROWSER_OUTPUT ?? "artifacts/browser/test-results",
  use: {
    baseURL: "http://127.0.0.1:4318",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: "**/phase-5-cross-browser.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "firefox",
      testMatch: [
        "**/phase-5-cross-browser.spec.ts",
        "**/phase-6-trace.spec.ts",
        "**/phase-7-outcomes.spec.ts",
        "**/research-journey.spec.ts",
      ],
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "webkit",
      testMatch: [
        "**/phase-5-cross-browser.spec.ts",
        "**/phase-6-trace.spec.ts",
        "**/phase-7-outcomes.spec.ts",
        "**/research-journey.spec.ts",
      ],
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://127.0.0.1:4318/api/v1/health",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
