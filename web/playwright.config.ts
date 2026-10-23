import { defineConfig } from "@playwright/test";
const baseURL = process.env.MATCHPULSE_TEST_URL ?? "http://127.0.0.1:5173";
const artifacts = `../output/playwright/target-${new URL(baseURL).port || "https"}`;
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL,
    headless: true,
    trace: "retain-on-failure",
  },
  outputDir: `${artifacts}/results`,
  reporter: [
    ["list"],
    ["json", { outputFile: `${artifacts}/results.json` }],
  ],
  projects: [
    { name: "laptop", use: { viewport: { width: 1366, height: 768 } } },
    {
      name: "mobile",
      testIgnore: "**/tour-autoplay.spec.ts",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
