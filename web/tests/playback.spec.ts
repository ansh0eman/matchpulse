import { test, expect } from "@playwright/test";

test("forward replay retains the pitch and verified score during slow source responses", async ({
  page,
}) => {
  await page.goto("/?scenario=line-shift");
  await expect(
    page.getByRole("button", { name: "Open Proof Lens", exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  const originalPitch = await page
    .locator(".theatre-pitch svg")
    .elementHandle();
  let pending = 0,
    maximumPending = 0,
    completed = 0,
    abortedBeforePause = 0,
    pauseIssued = false;
  // Measure automatic buffer requests, not the authoritative paused-view refresh.
  await page.route(/\/api\/playback\?/, async (route) => {
    pending++;
    maximumPending = Math.max(maximumPending, pending);
    try {
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, 1250));
      await route.fulfill({ response });
      completed++;
    } catch {
      if (!pauseIssued) abortedBeforePause++;
    } finally {
      pending--;
    }
  });
  await page.getByRole("button", { name: "Play replay", exact: true }).click();
  await expect.poll(() => pending).toBe(1);
  await expect(page.locator(".theatre-loading")).toHaveCount(0);
  await expect(page.getByTestId("score")).toHaveText("0:0");
  await expect(page.getByTestId("clock")).toHaveText("56:00");
  await expect(
    page.getByRole("button", { name: "Pause replay", exact: true }),
  ).toBeEnabled();
  await expect
    .poll(() => completed, { timeout: 15000 })
    .toBeGreaterThanOrEqual(2);
  pauseIssued = true;
  await page.getByRole("button", { name: "Pause replay", exact: true }).click();
  await expect.poll(() => pending).toBe(0);
  await page.unrouteAll({ behavior: "wait" });
  expect(
    await originalPitch!.evaluate((node) => node.isConnected),
  ).toBeTruthy();
  await expect(page.locator(".theatre-loading")).toHaveCount(0);
  expect(maximumPending).toBe(1);
  expect(abortedBeforePause).toBe(0);
  await expect(page.getByTestId("clock")).not.toHaveText("56:00");
});

test("a backward seek cancels a future playback response and never resurrects its claim", async ({
  page,
}) => {
  await page.goto("/?scenario=line-shift");
  await expect(
    page.getByRole("button", { name: "Open Proof Lens", exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  let release!: () => void,
    futureStarted = false,
    futureSettled = false,
    seekIssued = false;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/\/api\/(view|playback)\?/, async (route) => {
    const requested = new URL(route.request().url());
    if (Number(requested.searchParams.get("clock")) > 3360) {
      futureStarted = true;
      try {
        const response = await route.fetch();
        await gate;
        await route.fulfill({ response });
      } catch (error) {
        if (!seekIssued) throw error;
      } finally {
        futureSettled = true;
      }
    } else await route.continue();
  });
  await page.getByRole("button", { name: "Play replay", exact: true }).click();
  await expect.poll(() => futureStarted).toBe(true);
  seekIssued = true;
  await page
    .getByRole("slider", { name: "Replay clock", exact: true })
    .fill("100");
  await expect(page.getByTestId("clock")).toHaveText("01:40");
  await expect(page.getByLabel("Verified line comparison")).toHaveCount(0);
  release();
  await expect.poll(() => futureSettled).toBe(true);
  await page.unrouteAll({ behavior: "wait" });
  await expect(
    page.getByRole("button", { name: "Play replay", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".moment-copy h1")).not.toHaveText(
    "Line-height difference: 10.01 metres.",
  );
  await expect(page.getByTestId("clock")).toHaveText("01:40");
});
