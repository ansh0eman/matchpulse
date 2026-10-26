import { revealMoment } from "./helpers/moments";
import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import type { Proof, Story, View } from "../src/contracts";

const openProof = (page: Page) => page.getByRole("button", { name: "Open Proof Lens", exact: true });
const waitForMatch = (page: Page) => expect(openProof(page)).toBeEnabled({ timeout: 30000 });

async function shotAt(page: Page, scenario: string, clock: number, sourceSeconds?: number): Promise<{ story: Story; proof: Proof }> {
  const view: View = await (await page.request.get(`/api/view?scenario=${scenario}&clock=${clock}&audience=fan`)).json();
  const visible = new Set(await page.locator(".md-moments button[data-story-id]").evaluateAll((buttons) => buttons.map((button) => button.getAttribute("data-story-id"))));
  const story = view.timeline.find((item) => item.type === "observed_shot" && (sourceSeconds === undefined || item.source_seconds === sourceSeconds) && visible.has(item.id));
  expect(story).toBeDefined();
  const proof: Proof = await (await page.request.get(`/api/proof?scenario=${scenario}&clock=${clock}&audience=fan&claim_id=${encodeURIComponent(story!.claim_ids[0])}`)).json();
  return { story: story!, proof };
}

async function headingIsInsideDrawerBody(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const body = document.querySelector<HTMLElement>(".proof-drawer > .drawer-body");
    const heading = body?.querySelector<HTMLElement>("h3");
    if (!body || !heading) return false;
    const bodyRect = body.getBoundingClientRect();
    const headingRect = heading.getBoundingClientRect();
    return headingRect.top >= bodyRect.top && headingRect.bottom <= bodyRect.bottom;
  });
}

test("Proof Lens section changes reset only its drawer and retain logical keyboard focus", async ({ page }, info) => {
  await page.goto("/?scenario=line-shift");
  await waitForMatch(page);
  await openProof(page).click();
  await expect(page.locator(".proof-summary")).toBeVisible();
  const initialPageScroll = await page.evaluate(() => window.scrollY);
  const drawer = page.locator(".proof-drawer");
  const body = drawer.locator(":scope > .drawer-body");
  await body.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  expect(await body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Method", exact: true }).click();
  await expect(body).toHaveJSProperty("scrollTop", 0);
  await expect(page.getByRole("button", { name: "Method", exact: true })).toBeFocused();
  expect(await headingIsInsideDrawerBody(page)).toBeTruthy();
  expect(await drawer.evaluate((element) => element.contains(document.activeElement))).toBeTruthy();
  await body.evaluate((element) => { element.scrollTop = element.scrollHeight; });

  await page.getByRole("button", { name: "Audit", exact: true }).click();
  await expect(body).toHaveJSProperty("scrollTop", 0);
  expect(await headingIsInsideDrawerBody(page)).toBeTruthy();
  await body.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await page.getByRole("button", { name: "Provenance", exact: true }).click();
  await expect(body).toHaveJSProperty("scrollTop", 0);
  await expect(page.getByRole("button", { name: "Provenance", exact: true })).toBeFocused();
  expect(await headingIsInsideDrawerBody(page)).toBeTruthy();

  await page.getByRole("button", { name: "Summary", exact: true }).click();
  await expect(body).toHaveJSProperty("scrollTop", 0);
  await expect(page.getByRole("button", { name: "Summary", exact: true })).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(initialPageScroll);

  await body.locator(".summary-actions").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "How calculated", exact: true }).click();
  await expect(body).toHaveJSProperty("scrollTop", 0);
  await expect(page.getByRole("heading", { name: "Show your working." })).toBeFocused();
  await mkdir("../output/playwright/p5-ux", { recursive: true });
  await page.screenshot({ animations: "disabled", path: `../output/playwright/p5-ux/${info.project.name}-proof-section-reset.png` });
  await page.getByRole("button", { name: "Summary", exact: true }).click();
  await body.locator(".summary-actions").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Audit raw evidence" }).click();
  await expect(body).toHaveJSProperty("scrollTop", 0);
  await expect(page.getByRole("heading", { name: "The original observations." })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(openProof(page)).toBeFocused();
});

test("a selected shot keeps replay time and gives a source-grounded team, action and incident time", async ({ page }, info) => {
  await page.goto("/?scenario=line-shift");
  await waitForMatch(page);
  const { story, proof } = await shotAt(page, "line-shift", 3360, 3279.5);
  expect(story.source_seconds).toBe(3279.5);
  expect(story.team).toBe("SOUTH");
  expect(proof.observations).toHaveLength(1);
  expect(proof.observations[0]).toMatchObject({ source_id: "evt_003876", time_seconds: 3279.5, team: "SOUTH", action: "shot" });
  const row = await revealMoment(page, story.id);
  await row.click();
  await expect(row).toHaveAttribute("aria-current", "true");
  await expect(page.getByTestId("clock")).toHaveText("56:00");
  await expect(page.locator(".moment-copy")).toContainText("Selected moment");
  const timing = page.getByLabel("Incident and replay timing");
  await expect(timing.locator("span").nth(0)).toContainText("Incident");
  await expect(timing.locator("span").nth(0).locator("time")).toHaveText("54:39");
  await expect(timing.locator("span").nth(1)).toContainText("Replay");
  await expect(timing.locator("span").nth(1).locator("time")).toHaveText("56:00");
  await timing.getByText("Source timing").click();
  const clockText = (value: number) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
  await expect(timing).toContainText(`Recorded ${clockText(story.source_seconds)} · available ${clockText(story.available_seconds)} · presented ${clockText(story.presented_seconds)}`);
  await openProof(page).click();
  await expect(page.locator(".proof-summary h3")).toHaveText("Manchester United recorded a shot attempt at 54:39.");
  await expect(page.locator(".proof-time-context")).toContainText("Selected incident 54:39");
  await expect(page.locator(".proof-time-context")).toContainText("Replay clock 56:00");
  await expect(page.locator(".summary-single")).toContainText("source shot attempt");
  await expect(page.locator(".summary-boundaries")).toContainText("does not establish the shot's outcome or chance quality");
  await expect(page.locator(".summary-boundaries")).not.toContainText("causation");
  await expect(page.locator(".summary-single")).not.toContainText("observations");
  await expect(page.locator(".proof-summary")).not.toContainText("line estimate");
  await mkdir("../output/playwright/p5-ux", { recursive: true });
  await page.screenshot({ animations: "disabled", path: `../output/playwright/p5-ux/${info.project.name}-shot-summary.png` });
  await page.getByRole("button", { name: "Audit", exact: true }).click();
  await expect(page.locator(".observation")).toContainText("evt_003876");
  await expect(page.locator(".observation")).toContainText("3279.5s");
});

test("mobile pointer selection reveals the explanation without moving focus or replay time and honors reduced motion", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "The scroll adjustment is mobile-only.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const original = Element.prototype.scrollIntoView;
    Object.defineProperty(window, "selectionScrollBehaviors", { value: [] as string[], configurable: true });
    Element.prototype.scrollIntoView = function (options?: boolean | ScrollIntoViewOptions) {
      const behavior = typeof options === "object" ? options.behavior ?? "auto" : "auto";
      (window as unknown as { selectionScrollBehaviors: string[] }).selectionScrollBehaviors.push(behavior);
      return original.call(this, options);
    };
  });
  await page.goto("/?scenario=line-shift");
  await waitForMatch(page);
  const { story } = await shotAt(page, "line-shift", 3360, 3279.5);
  const row = await revealMoment(page, story.id);
  await row.tap();
  await expect(row).toHaveAttribute("aria-current", "true");
  await expect(page.locator(".moment-copy")).toContainText("Manchester United take a shot.");
  await expect(page.getByRole("complementary", { name: "Selected moment investigation" })).toBeInViewport();
  await expect(openProof(page)).toBeInViewport();
  await expect(page.getByTestId("clock")).toHaveText("56:00");
  expect(await page.evaluate(() => document.activeElement?.getAttribute("data-story-id"))).toBe(story.id);
  expect(await page.evaluate(() => (window as unknown as { selectionScrollBehaviors: string[] }).selectionScrollBehaviors.at(-1))).toBe("instant");
  await mkdir("../output/playwright/p5-ux", { recursive: true });
  await page.screenshot({ animations: "disabled", path: `../output/playwright/p5-ux/${info.project.name}-mobile-selection.png` });
});

test("keyboard timeline selection keeps focus and withheld copy explains available but stale tracking", async ({ page }, info) => {
  await page.goto("/?scenario=withheld");
  await expect(page.getByTestId("clock")).toHaveText("22:30", { timeout: 30000 });
  await expect(page.getByTestId("clock")).toHaveText("22:30");
  await expect(page.getByRole("img", { name: "Observed player and ball positions" })).toBeVisible();
  const view: View = await (await page.request.get("/api/view?scenario=withheld&clock=1350&audience=fan")).json();
  expect(view.tracking_available).toBe(true);
  const diagnostic = view.diagnostics.find((item) => item.reasons.includes("stale_recent_evidence"));
  expect(diagnostic?.recent_age_seconds).toBe(132);
  await expect(page.locator(".moment-copy")).toContainText("Tracking observations are available.");
  await expect(page.locator(".moment-copy")).toContainText(`recorded review at 22:30, the relevant evidence age was ${diagnostic!.recent_age_seconds} seconds`);
  await expect(page.locator(".moment-copy")).toContainText("Recent comparable observations are needed to support a current positional comparison.");
  await expect(openProof(page)).toHaveCount(0);
  await mkdir("../output/playwright/p5-ux", { recursive: true });
  await page.screenshot({ animations: "disabled", path: `../output/playwright/p5-ux/${info.project.name}-withheld.png` });

  const { story, proof } = await shotAt(page, "withheld", 1350);
  const row = await revealMoment(page, story.id);
  await row.focus();
  await page.keyboard.press("Enter");
  await expect(row).toHaveAttribute("aria-current", "true");
  await expect(page.getByTestId("clock")).toHaveText("22:30");
  await expect(page.locator(".moment-copy")).toContainText(`${story.team === "SOUTH" ? "Manchester United" : "Manchester City"} take a shot.`);
  expect(await page.evaluate(() => document.activeElement?.getAttribute("data-story-id"))).toBe(story.id);
  await openProof(page).click();
  await expect(page.locator(".proof-summary h3")).toContainText("recorded a shot attempt at");
  await page.getByRole("button", { name: "Audit", exact: true }).click();
  await expect(page.locator(".observation")).toContainText(proof.observations[0].source_id);
  await mkdir("../output/playwright/p5-ux", { recursive: true });
  await page.screenshot({ animations: "disabled", path: `../output/playwright/p5-ux/${info.project.name}-withheld-and-history.png` });
});
