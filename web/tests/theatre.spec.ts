import { revealMoment } from "./helpers/moments";
import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
async function ready(page: Page) {
  await expect(
    page.getByRole("button", { name: "Open Proof Lens", exact: true }),
  ).toBeEnabled({ timeout: 60000 });
}
async function scenario(page: Page, name: string) {
  await page
    .getByRole("button", { name: `Select ${name}`, exact: true })
    .click();
  await ready(page);
}
test("Theatre is source-synchronized and program output removes studio chrome", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?scenario=line-shift");
  await ready(page);
  await expect(
    page.getByRole("main", { name: "Broadcast Theatre" }),
  ).toBeVisible();
  await expect(page.getByTestId("score")).toHaveText("0:0");
  await expect(page.locator(".moment-copy h1")).toHaveText(
    "Spot the shift.",
  );
  await expect(page.getByTestId("clock")).toHaveText("56:00");
  await expect(page.getByLabel("Replay clock", { exact: true })).toBeVisible();
  await expect(page.locator(".moment-label")).toHaveText(
    "Recorded moment",
  );
  await expect(page.getByTestId("timeline-playhead")).toHaveAttribute("data-clock","3360");
  await expect(page.getByLabel("Incident and replay timing")).toContainText("56:00");
  await expect(page.getByLabel("Verified line comparison")).toContainText("21.95m");
  await expect(page.getByLabel("Verified line comparison")).toContainText("31.96m");
  await expect(
    page.getByRole("img", { name: "Observed player and ball positions" }),
  ).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    path: `../output/playwright/${info.project.name}-theatre.png`,
    fullPage: true,
  });
  await scenario(page, "The opening goal");
  await expect(page.locator(".moment-copy h1")).toHaveText("Manchester City lead 1–0.");
  await expect(
    page.getByRole("img", {
      name: "Observed event ball locations; no tracking available",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Program output", exact: true })
    .click();
  await expect(page.locator(".app-header")).toBeHidden();
  await expect(page.locator(".theatre-transport")).toHaveCount(0);
  await expect(page.getByRole("button", {name:"Fan view",exact:true})).toBeHidden();
  await expect(page.getByRole("button", {name:/^Favorite team:/})).toBeHidden();
  await expect(page.locator(".program-caption")).toContainText("Synthetic replay");
  await expect(page.locator(".program-caption h1")).toContainText("Manchester City");
  await expect(page.locator(".program-caption h1")).not.toContainText("NORTH");
  await expect(page.getByTestId("score")).toHaveText("1:0");
  await page
    .getByRole("button", { name: "Exit program output", exact: true })
    .click();
  await expect(page.locator(".app-header")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
test("Proof Summary progressively discloses method and audit, and exports the source receipt", async ({
  page,
}, info) => {
  await page.goto("/?scenario=line-shift");
  await ready(page);
  await scenario(page, "A higher line, proved");
  await page.getByLabel("Replay clock").fill("3400");
  await expect(page.getByTestId("clock")).toHaveText("56:40", { timeout: 15000 });
  const replay = await (await page.request.get("/api/view?scenario=line-shift&clock=3400&audience=fan")).json();
  const lineStory = replay.timeline.find((story: { type: string }) => story.type === "observed_line_height_change");
  expect(lineStory?.claim_ids?.length).toBeGreaterThan(0);
  const claimId = lineStory.claim_ids[0];
  await (await revealMoment(page,lineStory.id)).click();
  const futureProof = await page.request.get(`/api/proof?scenario=line-shift&clock=3359&audience=fan&claim_id=${encodeURIComponent(claimId)}`);
  expect(futureProof.status()).toBe(400);
  const otherMatchProof = await page.request.get(`/api/proof?scenario=open-play&clock=3400&audience=fan&claim_id=${encodeURIComponent(claimId)}`);
  expect(otherMatchProof.status()).toBe(400);
  await page
    .getByRole("button", { name: "Open Proof Lens", exact: true })
    .click();
  await expect(page.locator(".proof-summary h3")).toHaveText(
    "Manchester City's sampled line comparison",
    { timeout: 30000 },
  );
  await expect(page.getByRole("heading", { name: "Aggregate comparison" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Representative source frames" })).toBeVisible();
  await expect(page.locator(".aggregate-values")).toContainText("21.95");
  await expect(page.locator(".aggregate-values")).toContainText("31.96");
  await expect(page.locator(".aggregate-values")).toContainText("+10.01");
  await expect(page.locator(".summary-windows")).toContainText("after 45:10 through 53:00");
  await expect(page.locator(".summary-windows")).toContainText("after 53:00 through 56:00");
  await expect(page.locator(".summary-frame-proxy").first()).toContainText("Not the window mean");
  await expect(page.locator(".proof-time-context")).toContainText("Evidence as of 56:00");
  await expect(page.locator(".proof-time-context")).toContainText("Replay clock 56:40");
  await expect(page.locator(".proof-time-context")).toContainText("40s before replay");
  await expect(page.locator(".summary-support")).toContainText(
    "59 source frames",
  );
  await expect(page.locator(".aggregate-delta")).toContainText("+10.01");
  await expect(
    page.getByText("What it does not support", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".summary-boundaries")).toContainText("Observed player positioning does not establish a manager's instruction or prove pressing effectiveness.");
  await expect(page.locator(".summary-support")).toContainText("not independent trials");
  await page.screenshot({
    animations: "disabled",
    path: `../output/playwright/${info.project.name}-proof-summary.png`,
  });
  await page.locator(".representative-frames").scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: "Representative source frames" })).toBeInViewport();
  await page.screenshot({
    animations: "disabled",
    path: `../output/playwright/${info.project.name}-proof-source-frames.png`,
  });
  const saved = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save receipt", exact: true }).click();
  const download = await saved;
  const path = await download.path();
  const receipt = JSON.parse(await readFile(path!, "utf8"));
  expect(receipt.verified).toBe(true);
  expect(receipt.samples).toHaveLength(59);
  expect(receipt.match_id).toBe("f2a3e267-d3e5-4c90-ae07-b5a39607ab2d");
  await page
    .getByRole("button", { name: "How calculated", exact: true })
    .click();
  await expect(page.locator(".formula")).toBeVisible();
  await page.getByRole("button", { name: "Audit", exact: true }).click();
  await expect(
    page.getByText("The original observations.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Provenance", exact: true }).click();
  await expect(page.locator(".drawer-body")).toContainText(
    receipt.source_hashes.events,
  );
  await page.keyboard.press("Escape");
});
test("Guided story visits distinct fixtures and the Agent Room shows actual recorded durations", async ({
  page,
}, info) => {
  await page.goto("/?scenario=line-shift");
  await ready(page);
  await page.getByRole("button", { name: "Guided demo", exact: false }).click();
  await page
    .getByRole("button", { name: "Watch the story · 76 seconds", exact: true })
    .click();
  await expect(page.getByTestId("clock")).toHaveText("39:30");
  await expect(page.getByTestId("clock")).toHaveText("39:31", {
    timeout: 12000,
  });
  await page.getByRole("button", { name: "Pause guided story" }).click();
  await page.getByRole("button", { name: "Next story chapter" }).click();
  await ready(page);
  await expect(
    page.getByRole("button", { name: "Analyst view", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Next story chapter" }).click();
  await expect(page.locator(".proof-summary h3")).toHaveText(
    "Manchester City's sampled line comparison",
    { timeout: 60000 },
  );
  const evidenceBody = await page.locator(".proof-drawer > .drawer-body").boundingBox();
  const storyBar = await page.getByLabel("Guided judge story").boundingBox();
  expect(evidenceBody).not.toBeNull();
  expect(storyBar).not.toBeNull();
  expect(evidenceBody!.y + evidenceBody!.height).toBeLessThanOrEqual(storyBar!.y + 1);
  await page.screenshot({
    animations: "disabled",
    path: `../output/playwright/${info.project.name}-guided-proof.png`,
    fullPage: false,
  });
  await page.getByRole("button", { name: "Next story chapter" }).click();
  await expect(page.locator(".moment-copy h1")).toHaveText("The evidence says wait.");
  await expect(page.getByRole("button", { name: "Open Proof Lens", exact: true })).toHaveCount(0);
  await expect(page.locator(".moment-copy")).toContainText("recorded review at 22:30, the relevant evidence age was 132 seconds");
  await page.getByRole("button", { name: "Finish guided story" }).click();
  await expect(page.getByLabel("Guided judge story")).toHaveCount(0);
  await page.getByRole("button", { name: "Studio", exact: true }).click();
  const decisions = page.getByLabel("Recorded Foundry workflow", { exact: true }).getByLabel("Recorded agent decisions", { exact: true });
  await expect(decisions).toContainText("Challenger narrowed the scope");
  await expect(decisions).toContainText("Tactical Analyst · skipped, not failed.");
  const workflow = page.getByLabel("Recorded Foundry workflow", {
    exact: true,
  });
  await expect(workflow.locator(".workflow-node.director strong")).toHaveText(
    /^\d+\.\d{2}s$/,
  );
  await expect(workflow.locator(".workflow-node.narrator")).toContainText(
    "enriched",
  );
  await expect(
    workflow.locator(".workflow-node.replay_producer"),
  ).toContainText("enriched");
  await page.screenshot({
    animations: "disabled",
    path: `../output/playwright/${info.project.name}-workflow-graph.png`,
    fullPage: false,
  });
  await decisions.getByText("Challenger narrowed the scope", { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ animations: "disabled", path: `../output/playwright/${info.project.name}-agent-decisions.png`, fullPage: false });
  await page
    .getByText("See the historical narration recovery", { exact: true })
    .click();
  await expect(
    page
      .getByLabel("Historical Foundry recovery")
      .locator(".workflow-node.narrator"),
  ).toContainText("fallback");
});
