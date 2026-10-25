import { test, expect } from "@playwright/test";
test.use({ reducedMotion: "reduce" });

test("signature opening is readable in the first viewport with real source geometry", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?scenario=line-shift");
  const action = page.getByRole("button", {
    name: "Open Proof Lens",
    exact: true,
  });
  await expect(action).toBeEnabled({ timeout: 60000 });
  await expect(page.locator(".moment-copy h1")).toHaveText(
    "Line-height difference: 10.01 metres.",
  );
  await expect(page.getByLabel("Verified line comparison")).toContainText(
    "59 original source frames",
  );
  const actionBox = await action.boundingBox();
  expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(
    page.viewportSize()!.height,
  );
  const pitch = await page.locator(".theatre-pitch").boundingBox();
  const copy = await page.locator(".moment-copy").boundingBox();
  expect(pitch!.y + pitch!.height).toBeLessThanOrEqual(copy!.y);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(
    await page
      .locator(".moment-lower-third")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  await page.screenshot({
    path: `../output/playwright/${info.project.name}-signature-opening.png`,
    animations: "disabled",
    fullPage: false,
  });
  if (info.project.name === "laptop") {
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(action).toBeInViewport();
    await page.screenshot({
      path: "../output/playwright/1440-signature-opening.png",
      animations: "disabled",
      fullPage: false,
    });
  }
  await action.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".aggregate-delta")).toContainText("+10.01", {
    timeout: 60000,
  });
  await page
    .getByText("Inspect original players and coordinates", { exact: true })
    .click();
  await expect(page.locator(".contributor-inspector tbody tr")).toHaveCount(6);
  await expect(page.locator(".contributor-inspector")).toContainText(
    "not just these snapshots",
  );
  await page.screenshot({
    path: `../output/playwright/${info.project.name}-contributors.png`,
    animations: "disabled",
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("reselecting the same fixture recovers and backward seeking removes the future comparison", async ({
  page,
}) => {
  await page.goto("/?scenario=line-shift");
  const action = page.getByRole("button", {
    name: "Open Proof Lens",
    exact: true,
  });
  await expect(action).toBeEnabled({ timeout: 60000 });
  await page
    .getByRole("button", { name: "Select A higher line, proved", exact: true })
    .click();
  await expect(action).toBeEnabled({ timeout: 60000 });
  await expect(page.getByTestId("clock")).toHaveText("56:00");
  await page
    .getByRole("slider", { name: "Replay clock", exact: true })
    .fill("100");
  await expect(page.getByTestId("clock")).toHaveText("01:40");
  await expect(page.getByLabel("Verified line comparison")).toHaveCount(0);
  await expect(page.locator(".moment-copy h1")).not.toHaveText(
    "Line-height difference: 10.01 metres.",
  );
  await page
    .getByRole("slider", { name: "Replay clock", exact: true })
    .fill("3360");
  await expect(page.locator(".moment-copy h1")).toHaveText(
    "Line-height difference: 10.01 metres.",
    { timeout: 60000 },
  );
});
