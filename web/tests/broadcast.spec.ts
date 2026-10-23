import { test, expect, Page } from "@playwright/test";
async function ready(page: Page) {
  await expect(
    page.getByRole("button", { name: "Open Proof Lens", exact: true }),
  ).toBeEnabled({ timeout: 60000 });
}
async function select(page: Page, name: string) {
  await page
    .getByRole("button", { name: `Select ${name}`, exact: true })
    .click();
  await ready(page);
}
async function seek(page: Page, clock: number) {
  await page
    .getByRole("slider", { name: "Replay clock", exact: true })
    .fill(String(clock));
  await expect(page.getByTestId("clock")).toHaveText(
    `${String(Math.floor(clock / 60)).padStart(2, "0")}:${String(Math.floor(clock % 60)).padStart(2, "0")}`,
  );
  await expect(page.locator(".match-stage.refreshing")).toHaveCount(0);
}
test("broadcast, source proof, preferences and temporal score transitions", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?view=studio");
  await ready(page);
  await expect(page.getByTestId("score")).toHaveText("0:0");
  const initial = await (
    await page.request.get(
      "/api/view?scenario=open-play&clock=356&audience=fan",
    )
  ).json();
  const earliest = initial.timeline[0];
  await page.locator(".timeline-item").last().click();
  const seconds = earliest.presented_seconds;
  await expect(page.getByTestId("clock")).toHaveText(
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`,
  );
  await expect(page.locator(".match-stage.refreshing")).toHaveCount(0);
  await seek(page, 356);
  await expect(
    page.getByRole("img", { name: "Observed player and ball positions" }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    animations: "disabled",
    path: `../output/playwright/${info.project.name}-broadcast.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Open Proof Lens", exact: true })
    .click();
  await expect(
    page.getByText("Recomputed. Verified.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "audit", exact: true }).click();
  await page.getByRole("button", { name: "observations", exact: true }).click();
  await expect(
    page.getByText("The original observations.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close Proof Lens" }).click();
  await select(page, "The opening goal");
  await expect(page.getByTestId("score")).toHaveText("1:0");
  await expect(
    page.getByRole("img", {
      name: "Observed event ball locations; no tracking available",
    }),
  ).toBeVisible();
  await seek(page, 2370);
  await expect(page.getByTestId("score")).toHaveText("0:0");
  await seek(page, 2371);
  await expect(page.getByTestId("score")).toHaveText("1:0");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/view?**", async (route) => {
    await gate;
    await route.continue();
  });
  await page
    .getByRole("slider", { name: "Replay clock", exact: true })
    .fill("2370");
  await expect(page.locator(".timeline-item")).toHaveCount(0);
  await expect(page.getByTestId("score")).toHaveText("–:–");
  release();
  await expect(page.getByTestId("score")).toHaveText("0:0");
  await page.unroute("**/api/view?**");
  await seek(page, 2371);
  await page.getByRole("button", { name: "Analyst view", exact: true }).click();
  await expect(page.locator(".match-stage.refreshing")).toHaveCount(0);
  await page.getByLabel("Favorite team").selectOption("NORTH");
  await expect(page.locator(".current-story h2")).toContainText("NORTH view");
  await page
    .getByRole("button", { name: "Did the coach intend this?", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Not supported");
  await select(page, "Back on level terms");
  await expect(page.getByTestId("score")).toHaveText("1:1");
  await seek(page, 4241);
  await expect(page.getByTestId("score")).toHaveText("0:1");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
test("positional Proof Lens exposes source geometry and stale evidence is withheld", async ({
  page,
}, info) => {
  await page.goto("/?view=studio");
  await ready(page);
  await select(page, "A higher line, proved");
  await expect(page.locator(".current-story h2")).toContainText("10.0m");
  await expect(page.getByLabel("Verified incident overlay")).toContainText(
    "21.95",
  );
  await expect(page.getByLabel("Verified incident overlay")).toContainText(
    "31.96",
  );
  await page
    .getByRole("button", { name: "Open Proof Lens", exact: true })
    .click();
  await expect(
    page.getByText("Recomputed. Verified.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".measurement")).toContainText("21.95");
  await expect(page.locator(".measurement")).toContainText("31.96");
  await expect(page.locator(".drawer-body")).toContainText(
    "41 before / 18 after",
  );
  await page.screenshot({
    animations: "disabled",
    path: `../output/playwright/${info.project.name}-proof-lens.png`,
    fullPage: false,
  });
  await page.getByRole("button", { name: "audit", exact: true }).click();
  await page.getByRole("button", { name: "observations", exact: true }).click();
  await expect(
    page.getByText("Three deepest outfielders, attack-relative x:", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "provenance", exact: true }).click();
  await expect(page.locator(".proof-drawer")).toContainText(
    "f2a3e267-d3e5-4c90-ae07-b5a39607ab2d",
  );
  await page.keyboard.press("Escape");
  await select(page, "When the evidence says wait");
  await expect(
    page.getByText("A positional claim was withheld.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".withheld")).toContainText("132s");
  await page.screenshot({
    animations: "disabled",
    path: `../output/playwright/${info.project.name}-withheld.png`,
    fullPage: true,
  });
});
test("recorded agent evidence, playback and service recovery", async ({
  page,
}, info) => {
  await page.goto("/?view=studio");
  await ready(page);
  await page.getByRole("button", { name: "Play replay", exact: true }).click();
  await expect(page.getByTestId("clock")).not.toHaveText("05:56");
  await page.getByRole("button", { name: "Pause replay", exact: true }).click();
  await page.getByRole("button", { name: "Guided demo", exact: false }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Interrogate the explanation",
  );
  await page.getByRole("button", { name: "Close guided demo" }).click();
  if (info.project.name === "mobile") {
    await page
      .getByRole("button", { name: "Open agent room", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      "4 integration checks passed",
    );
    await expect(page.getByRole("dialog")).toContainText(
      "A real run, source-verified end to end.",
    );
    await page.getByRole("button", { name: "Close agent room" }).click();
  } else {
    await page
      .getByRole("button", { name: "Agent room", exact: false })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      "4 integration checks passed",
    );
    await expect(page.getByRole("dialog")).toContainText("resolve_claim");
    await page.screenshot({
      animations: "disabled",
      path: "../output/playwright/laptop-agent-room.png",
    });
    await page.getByRole("button", { name: "Close agent room" }).click();
  }
  await page.route("**/api/view?**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"error":"Evidence temporarily unavailable"}',
    }),
  );
  await page.getByRole("button", { name: "Analyst view", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Evidence temporarily unavailable",
  );
  await page.unroute("**/api/view?**");
  await page
    .getByRole("button", { name: "Retry source connection", exact: true })
    .click();
  await ready(page);
});
