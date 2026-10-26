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
    "Spot the shift.",
  );
  const view = await (await page.request.get("/api/view?scenario=line-shift&clock=3360&audience=fan")).json();
  const story = view.timeline.find((item: { type: string }) => item.type === "observed_line_height_change");
  expect(story?.claim_ids?.length).toBeGreaterThan(0);
  const proof = await (await page.request.get(`/api/proof?scenario=line-shift&clock=3360&audience=fan&claim_id=${encodeURIComponent(story.claim_ids[0])}`)).json();
  const support = proof.calculation.support;
  expect(support.reference_frames + support.recent_frames).toBe(59);
  await expect(page.getByLabel("Verified line comparison")).toContainText(
    `${support.reference_frames + support.recent_frames} verified samples · ${support.reference_frames} earlier / ${support.recent_frames} recent`,
  );
  const actionBox = await action.boundingBox();
  expect(actionBox).not.toBeNull();
  if (info.project.name === "laptop") {
    expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  } else {
    await action.scrollIntoViewIfNeeded();
    await expect(action).toBeInViewport();
  }
  const pitch = await page.locator(".theatre-pitch").boundingBox();
  const copy = await page.locator(".moment-copy").boundingBox();
  const overlaps = !(
    pitch!.x + pitch!.width <= copy!.x ||
    copy!.x + copy!.width <= pitch!.x ||
    pitch!.y + pitch!.height <= copy!.y ||
    copy!.y + copy!.height <= pitch!.y
  );
  expect(overlaps).toBe(false);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(
    await page
      .locator(".moment-copy")
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
    "Spot the shift.",
  );
  await page
    .getByRole("slider", { name: "Replay clock", exact: true })
    .fill("3360");
  await expect(page.locator(".moment-copy h1")).toHaveText(
    "Spot the shift.",
    { timeout: 60000 },
  );
});
