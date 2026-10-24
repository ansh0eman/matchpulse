import { test, expect } from "@playwright/test";

test("forward replay retains the pitch and verified score during slow source responses", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open Proof Lens", exact: true })).toBeEnabled({ timeout: 60000 });
  const originalPitch = await page.locator(".theatre-pitch svg").elementHandle();
  let pending = 0, maximumPending = 0, completed = 0, aborted = 0;
  await page.route("**/api/view?**", async (route) => {
    pending++;
    maximumPending = Math.max(maximumPending, pending);
    try {
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, 1250));
      await route.fulfill({ response });
      completed++;
    } catch { aborted++; }
    finally { pending--; }
  });
  await page.getByRole("button", { name: "Play replay", exact: true }).click();
  await expect.poll(() => pending).toBe(1);
  await expect(page.locator(".theatre-loading")).toHaveCount(0);
  await expect(page.getByTestId("score")).toHaveText("0:0");
  await expect(page.getByTestId("clock")).toHaveText("56:00");
  await expect(page.getByRole("button", { name: "Pause replay", exact: true })).toBeEnabled();
  await expect.poll(() => completed, { timeout: 15000 }).toBeGreaterThanOrEqual(2);
  await page.getByRole("button", { name: "Pause replay", exact: true }).click();
  expect(await originalPitch!.evaluate((node) => node.isConnected)).toBeTruthy();
  await expect(page.locator(".theatre-loading")).toHaveCount(0);
  expect(maximumPending).toBe(1);
  expect(aborted).toBe(0);
  await expect(page.getByTestId("clock")).not.toHaveText("56:00");
});

test("a backward seek cancels a future playback response and never resurrects its claim", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open Proof Lens", exact: true })).toBeEnabled({ timeout: 60000 });
  let release!: () => void, futureStarted = false;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/view?**", async (route) => {
    const requested = new URL(route.request().url());
    if (Number(requested.searchParams.get("clock")) > 3360) {
      futureStarted = true;
      const response = await route.fetch();
      await gate;
      await route.fulfill({ response }).catch(() => {});
    } else await route.continue();
  });
  await page.getByRole("button", { name: "Play replay", exact: true }).click();
  await expect.poll(() => futureStarted).toBe(true);
  await page.getByRole("slider", { name: "Replay clock", exact: true }).fill("100");
  await expect(page.getByTestId("clock")).toHaveText("01:40");
  await expect(page.getByLabel("Verified line comparison")).toHaveCount(0);
  release();
  await expect(page.getByRole("button", { name: "Play replay", exact: true })).toBeVisible();
  await expect(page.locator(".moment-copy h1")).not.toHaveText("10.01 metres higher.");
  await expect(page.getByTestId("clock")).toHaveText("01:40");
});
