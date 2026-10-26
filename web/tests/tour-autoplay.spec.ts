import { test, expect } from "@playwright/test";
test.use({
  video: process.env.MATCHPULSE_RECORD_VIDEO === "1"
    ? { mode: "on", size: { width: 1366, height: 768 } }
    : "off",
});
test("the full guided story completes automatically with real elapsed time", async ({
  page,
}) => {
  test.setTimeout(105000);
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Play replay", exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  await page.getByRole("button", { name: "Guided demo", exact: false }).click();
  const start = Date.now();
  await page
    .getByRole("button", { name: "Watch the story · 76 seconds", exact: true })
    .click();
  await expect(page.getByLabel("Guided judge story")).toBeVisible();
  await expect(page.getByLabel("Guided judge story")).toHaveCount(0, {
    timeout: 90000,
  });
  expect(Date.now() - start).toBeLessThan(90000);
  await expect(page.locator(".moment-copy")).toContainText("recorded review at 22:30, the relevant evidence age was 132 seconds");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
