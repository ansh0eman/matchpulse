import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: process.env.MATCHPULSE_TEST_URL ?? "http://127.0.0.1:5173",
    headless: true,
    trace: "retain-on-failure",
  },
  outputDir: "../output/playwright/results",
  reporter: [
    ["list"],
    ["json", { outputFile: "../output/playwright/results.json" }],
  ],
  projects: [
    { name: "laptop", use: { viewport: { width: 1366, height: 768 } } },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
