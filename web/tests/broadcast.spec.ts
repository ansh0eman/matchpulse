import { follow } from "./helpers/preferences";
import { selectCanonicalFixture } from "./helpers/readiness";
import { revealMoment } from "./helpers/moments";
import { test, expect, Page } from "@playwright/test";
async function ready(page: Page) {
  await expect(
    page.getByRole("button", { name: "Open Proof Lens", exact: true }),
  ).toBeEnabled({ timeout: 60000 });
}
async function select(page: Page, name: string) {
  if (name === "When the evidence says wait") {
    await selectCanonicalFixture(page, { name, scenario: "withheld", clock: 1350 });
    await expect(page.locator(".withheld")).toBeVisible();
    await expect(page.getByRole("button", { name: "Open Proof Lens", exact: true })).toHaveCount(0);
  } else {
    await page.getByRole("button", { name: `Select ${name}`, exact: true }).click();
    await ready(page);
  }
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
    page.getByText("Source arithmetic verified", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Audit", exact: true }).click();
  await page.getByRole("button", { name: "Source observations", exact: true }).click();
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
  await follow(page,"NORTH");
  await expect(page.locator(".current-story h2")).toContainText("Manchester City view");
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
    page.getByText("Source arithmetic verified", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".aggregate-values")).toContainText("21.95");
  await expect(page.locator(".aggregate-values")).toContainText("31.96");
  await expect(page.locator(".drawer-body")).toContainText(
    "41 earlier / 18 recent",
  );
  await page.screenshot({
    animations: "disabled",
    path: `../output/playwright/${info.project.name}-proof-lens.png`,
    fullPage: false,
  });
  await page.getByRole("button", { name: "Audit", exact: true }).click();
  await page.getByRole("button", { name: "Source observations", exact: true }).click();
  await expect(
    page.getByText("Three deepest outfielders, attack-relative x:", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Provenance", exact: true }).click();
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

test("the goal Proof Lens keeps its score transition path without positional presentation", async ({ page }) => {
  await page.goto("/?view=studio");
  await ready(page);
  await select(page, "The opening goal");
  await page.getByRole("button", { name: "Open Proof Lens", exact: true }).click();
  await expect(page.locator(".proof-summary h3")).toHaveText("The score changed. Here is the source.");
  await expect(page.locator(".summary-score")).toContainText("0 – 0");
  await expect(page.locator(".summary-score")).toContainText("1 – 0");
  await expect(page.getByRole("button", { name: "Save receipt", exact: true })).toBeVisible();
});

test("explicit moments stay separate from replay time and disappear before availability", async ({
  page,
}, info) => {
  await page.goto("/?scenario=line-shift");
  await ready(page);
  const currentClock = await page.getByTestId("clock").textContent();
  const initialView = await (await page.request.get("/api/view?scenario=line-shift&clock=3360&audience=fan")).json();
  const initialStory = initialView.timeline.find((story: {type:string})=>story.type==="observed_line_height_change");
  const moment = await revealMoment(page,initialStory.id);
  await expect(moment).toBeVisible();
  const storyId = await moment.getAttribute("data-story-id");
  expect(storyId).toBeTruthy();
  await moment.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".moment-label")).toHaveText(
    "Selected moment",
  );
  await expect(page.getByTestId("clock")).toHaveText(currentClock!);
  await expect(moment).toHaveAttribute("aria-current", "true");
  const timing = page.getByLabel("Incident and replay timing");
  await expect(timing).toContainText("Incident");
  await expect(timing).toContainText("Replay");
  await timing.getByText("Source timing").click();
  await expect(timing).toContainText("Recorded");
  await expect(timing).toContainText("available");
  await expect(timing).toContainText("presented");

  const replay = page.getByRole("slider", { name: "Replay clock", exact: true });
  await replay.fill("3400");
  await expect(page.getByTestId("clock")).toHaveText("56:40");
  await expect(page.locator(".moment-label")).toHaveText(
    "Selected moment",
  );
  await expect(page.locator(`[data-story-id="${storyId}"]`)).toHaveAttribute(
    "aria-current",
    "true",
  );
  if (info.project.name === "mobile") {
    await page.screenshot({
      animations: "disabled",
      path: "../output/playwright/mobile-p3.1-selected-moment.png",
      fullPage: true,
    });
  } else {
    await page.screenshot({
      animations: "disabled",
      path: "../output/playwright/laptop-p3.1-selected-moment.png",
      fullPage: true,
    });
  }

  const response = await page.request.get(
    "/api/view?scenario=line-shift&clock=3360&audience=fan",
  );
  expect(response.ok()).toBeTruthy();
  const view = await response.json();
  const story = view.timeline.find((item: { id: string }) => item.id === storyId);
  expect(story).toBeTruthy();
  const availableReplaySecond = Math.ceil(story.presented_seconds);
  const earlierThanAvailability = Math.max(0, availableReplaySecond - 1);
  await replay.fill(String(earlierThanAvailability));
  await expect(page.locator(`[data-story-id="${storyId}"]`)).toHaveCount(0);
  await expect(page.locator(".moment-label")).not.toHaveText(
    "Selected moment",
  );
  await expect(page.getByTestId("clock")).toHaveText(
    `${String(Math.floor(earlierThanAvailability / 60)).padStart(2, "0")}:${String(earlierThanAvailability % 60).padStart(2, "0")}`,
  );

  await replay.fill(String(availableReplaySecond));
  await expect(page.locator(".moment-label")).not.toHaveText("Selected moment");
  await expect(page.locator(`[data-story-id="${storyId}"]`)).not.toHaveAttribute("aria-current", "true");
  // A cleared choice stays cleared after forward seek. The newly eligible automatic feature is distinct.
  await expect(page.getByTestId("clock")).toHaveText("56:00");
  await page
    .getByRole("button", { name: "Select The opening goal", exact: true })
    .click();
  await ready(page);
  await expect(page.locator(".moment-label")).not.toHaveText(
    "Selected moment",
  );
  await expect(page.locator(`[data-story-id="${storyId}"]`)).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  if (info.project.name === "mobile") {
    await expect(page.locator(".md-moments")).toBeVisible();
    await expect(
      page.getByRole("slider", { name: "Replay clock", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      animations: "disabled",
      path: "../output/playwright/mobile-moment-timing.png",
      fullPage: true,
    });
  } else {
    await page.screenshot({
      animations: "disabled",
      path: "../output/playwright/desktop-moment-timing.png",
      fullPage: true,
    });
  }
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
      .getByRole("button", { name: "Open Studio", exact: true })
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
      .getByRole("button", { name: "Studio", exact: false })
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
