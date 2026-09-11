import { defineConfig } from "@playwright/test";

import { E2E_ORIGIN } from "./tests/e2e/env";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "tests/e2e/report" }],
  ],
  outputDir: "tests/e2e/test-results",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    baseURL: E2E_ORIGIN,
    trace: "off",
    screenshot: "off",
    video: "off",
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: "desktop",
      use: {
        browserName: "chromium",
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "npx tsx tests/e2e/dev-server.ts",
    url: `${E2E_ORIGIN}/admin/login`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
