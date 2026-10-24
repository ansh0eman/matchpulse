import { test, expect } from "@playwright/test";

test("native goal replay keeps source positions mounted through the actual score transition", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const proof = page.getByRole("button", {
    name: "Open Proof Lens",
    exact: true,
  });
  await expect(proof).toBeEnabled({ timeout: 60000 });
  await expect(page.getByTestId("clock")).toHaveText("26:51");
  await expect(page.getByTestId("score")).toHaveText("0:0");
  await expect(
    page.getByRole("button", { name: "Play replay", exact: true }),
  ).toBeInViewport();
  await page.screenshot({
    path: `../output/playwright/${info.project.name}-matchday-opening.png`,
    fullPage: false,
  });
  await page
    .getByRole("button", { name: "Select Goals, in motion", exact: true })
    .click();
  // The requested clock is visible immediately; verified geometry marks source readiness.
  await expect(
    page.getByRole("img", {
      name: "Observed player and ball positions",
      exact: true,
    }),
  ).toBeVisible({ timeout: 60000 });
  await expect(page.getByTestId("clock")).toHaveText("26:51", {
    timeout: 60000,
  });
  await expect(page.getByTestId("score")).toHaveText("0:0");
  const svg = await page.locator(".theatre-pitch svg").elementHandle();
  await page
    .getByRole("combobox", { name: "Playback speed" })
    .selectOption("1");
  await page.getByRole("button", { name: "Play replay", exact: true }).click();
  await expect(page.getByTestId("score")).toHaveText("1:0", { timeout: 15000 });
  await page.getByRole("button", { name: "Pause replay", exact: true }).click();
  expect(await svg!.evaluate((node) => node.isConnected)).toBeTruthy();
  await expect(page.locator(".theatre-loading")).toHaveCount(0);
  await expect(page.locator(".moment-copy h1")).toHaveText("North lead 1–0.");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `../output/playwright/${info.project.name}-native-goal.png`,
    fullPage: false,
  });
  if (info.project.name === "laptop") {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({
      path: "../output/playwright/1440-native-goal.png",
      fullPage: false,
    });
    await page.setViewportSize({ width: 1366, height: 768 });
  }
  await proof.click();
  await expect(
    page.getByText("Recomputed. Verified.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close Proof Lens" }).click();
  await page
    .getByRole("slider", { name: "Replay clock", exact: true })
    .fill("1613.75");
  await expect(page.getByTestId("score")).toHaveText("0:0");
  await expect(page.locator(".moment-copy h1")).not.toHaveText(
    "North lead 1–0.",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
