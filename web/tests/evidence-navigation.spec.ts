import { test, expect, type Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { Proof, Story, View } from "../src/contracts";

const open = (page: Page) => page.getByRole("button", { name: "Open Proof Lens", exact: true });
const close = (page: Page) => page.getByRole("button", { name: "Close Proof Lens", exact: true });
const titleA = "North’s recent line estimate is 10.01 m farther forward than its earlier estimate.";
const titleB = "South recorded a shot attempt at 54:39.";
const frames = (page: Page) => page.evaluate(() => new Promise<void>((resolve) => {
  let remaining = 6;
  const tick = () => --remaining ? requestAnimationFrame(tick) : resolve();
  requestAnimationFrame(tick);
}));
function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  return { promise, release };
}
async function setup(page: Page) {
  await page.goto("/?scenario=line-shift");
  await expect(open(page)).toBeEnabled();
  const view: View = await (await page.request.get("/api/view?scenario=line-shift&clock=3360&audience=fan")).json();
  const a = view.timeline.find((story) => story.type === "observed_line_height_change")!;
  let b: Story | undefined;
  for (const story of [...view.timeline].reverse().filter((story) => story.type === "observed_shot")) {
    if (await page.locator(`.md-moments button[data-story-id="${story.id}"]`).count()) { b = story; break; }
  }
  expect(b).toBeDefined();
  const receipt = async (story: Story): Promise<Proof> =>
    (await page.request.get(`/api/proof?scenario=line-shift&clock=3360&audience=fan&claim_id=${encodeURIComponent(story.claim_ids[0])}`)).json();
  return { a, b: b!, proofA: await receipt(a), proofB: await receipt(b!) };
}
async function select(page: Page, story: Story) {
  const button = page.locator(`.md-moments button[data-story-id="${story.id}"]`);
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-current", "true");
}
async function inspect(page: Page, title: string) {
  await open(page).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".proof-summary h3")).toHaveText(title);
}
async function savedReceipt(page: Page) {
  const saved = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save receipt", exact: true }).click();
  return JSON.parse(await readFile((await (await saved).path())!, "utf8"));
}
async function watchDrawer(page: Page) {
  await page.evaluate(() => {
    const state = { samples: [] as string[], running: true, observer: null as MutationObserver | null };
    Object.assign(window, { proofNavigationAudit: state });
    const sample = () => state.samples.push(document.querySelector(".proof-drawer")?.textContent ?? "");
    state.observer = new MutationObserver(sample);
    state.observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const tick = () => { if (state.running) { sample(); requestAnimationFrame(tick); } };
    requestAnimationFrame(tick);
  });
}
async function stopWatching(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const state = (window as unknown as { proofNavigationAudit: { running: boolean; observer: MutationObserver; samples: string[] } }).proofNavigationAudit;
    state.running = false;
    state.observer.disconnect();
    return state.samples;
  });
}

test("proof transitions invalidate every old title, measurement, snapshot and receipt before delayed requests settle", async ({ page }, info) => {
  const { a, b, proofA, proofB } = await setup(page);
  await inspect(page, titleA);
  await page.keyboard.press("Escape");
  const audits: { direction: string; samples: string[] }[] = [];
  for (const [story, receipt, expected, forbidden] of [
    [b, proofB, titleB, titleA], [a, proofA, titleA, titleB],
  ] as const) {
    await select(page, story);
    const pending = gate();
    await page.route("**/api/proof?**", async (route) => {
      await pending.promise;
      await route.fulfill({ json: receipt });
    });
    await watchDrawer(page);
    await open(page).click();
    await expect(page.locator(".proof-drawer .loading-line")).toBeVisible();
    await frames(page);
    await expect(page.locator(".proof-summary, .comparison, .summary-comparison")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Save receipt", exact: true })).toHaveCount(0);
    const loadingSamples = await stopWatching(page);
    expect(loadingSamples.length).toBeGreaterThan(5);
    for (const text of loadingSamples) {
      expect(text).not.toContain(forbidden);
      expect(text).not.toContain("Save receipt");
      expect(text).not.toContain("21.95");
      expect(text).not.toContain("frame_003114");
    }
    audits.push({ direction: story === b ? "A to B" : "B to A", samples: loadingSamples });
    pending.release();
    await expect(page.locator(".proof-summary h3")).toHaveText(expected);
    expect(await savedReceipt(page)).toEqual(receipt);
    if (story === b) await page.screenshot({ path: `../output/playwright/p34/${info.project.name}-shot-proof.png` });
    await page.keyboard.press("Escape");
    await page.unroute("**/api/proof?**");
  }
  await mkdir("../output/playwright/p34", { recursive: true });
  await writeFile(`../output/playwright/p34/${info.project.name}-transition-observations.json`, JSON.stringify(audits, null, 2));
});

test("late responses cannot overwrite a newer selection; same-incident reopening remains usable", async ({ page }) => {
  const { a, b, proofA, proofB } = await setup(page);
  const pending = gate(), arrived = gate(), finished = gate();
  await page.route("**/api/proof?**", async (route) => {
    if (new URL(route.request().url()).searchParams.get("claim_id") === b.claim_ids[0]) {
      arrived.release();
      await pending.promise;
      await route.fulfill({ json: proofB }).catch(() => {});
      finished.release();
    } else await route.fulfill({ json: proofA });
  });
  await select(page, b);
  await open(page).click();
  await arrived.promise;
  await page.keyboard.press("Escape");
  await select(page, a);
  await inspect(page, titleA);
  pending.release();
  await finished.promise;
  await frames(page);
  await expect(page.locator(".proof-summary h3")).toHaveText(titleA);
  expect(await savedReceipt(page)).toEqual(proofA);
  await page.keyboard.press("Escape");
  await inspect(page, titleA);
  expect(await savedReceipt(page)).toEqual(proofA);
});

test("wrong-claim, wrong-match, future and failed responses show no previous receipt and can retry", async ({ page }) => {
  const { b, proofA, proofB } = await setup(page);
  await inspect(page, titleA);
  await page.keyboard.press("Escape");
  await select(page, b);
  for (const fault of ["claim", "match", "future", "network"] as const) {
    let broken = true;
    await page.route("**/api/proof?**", async (route) => {
      if (!broken) return route.fulfill({ json: proofB });
      broken = false;
      if (fault === "network") return route.fulfill({ status: 503, json: { error: "Evidence temporarily unavailable" } });
      const payload = { ...proofB,
        ...(fault === "claim" ? { claim_id: proofA.claim_id } : {}),
        ...(fault === "match" ? { match_id: proofA.match_id + "-other" } : {}),
        ...(fault === "future" ? { as_of_seconds: 3361 } : {}),
      };
      return route.fulfill({ json: payload });
    });
    await open(page).click();
    await expect(page.getByRole("alert")).toContainText(fault === "network" ? "Evidence temporarily unavailable" : "does not match this incident and replay");
    await expect(page.locator(".proof-summary")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Save receipt", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Retry proof", exact: true }).click();
    await expect(page.locator(".proof-summary h3")).toHaveText(titleB);
    expect(await savedReceipt(page)).toEqual(proofB);
    await page.keyboard.press("Escape");
    await page.unroute("**/api/proof?**");
  }
});

test("withheld explanation has no unrelated timestamps or proof action; explicit historical shots retain evidence", async ({ page }, info) => {
  let proofRequests = 0;
  page.on("request", (request) => { if (request.url().includes("/api/proof?")) proofRequests++; });
  await page.goto("/?scenario=withheld");
  await expect(page.locator(".moment-copy h1")).toHaveText("Sometimes, the evidence says wait.");
  await expect(page.locator(".moment-copy")).toContainText("Tracking observations are available for this match.");
  await expect(page.locator(".moment-copy")).toContainText("132s old at 22:30");
  await expect(page.locator(".moment-copy")).toContainText("needs recent, comparable observations");
  await expect(page.locator(".moment-lower-third .moment-time-context")).toHaveCount(0);
  await expect(open(page)).toHaveCount(0);
  await expect(page.getByLabel("Verified line comparison")).toHaveCount(0);
  await frames(page);
  expect(proofRequests).toBe(0);
  await page.screenshot({ path: `../output/playwright/p34/${info.project.name}-withheld.png` });
  const view: View = await (await page.request.get("/api/view?scenario=withheld&clock=1350&audience=fan")).json();
  const shot = [...view.timeline].reverse().find((story) => story.type === "observed_shot")!;
  await select(page, shot);
  await expect(page.locator(".moment-copy h1")).not.toHaveText("Sometimes, the evidence says wait.");
  await expect(page.getByLabel("Moment timing")).toBeVisible();
  const shotClock = `${String(Math.floor(shot.source_seconds / 60)).padStart(2, "0")}:${String(Math.floor(shot.source_seconds % 60)).padStart(2, "0")}`;
  await inspect(page, `${shot.team === "NORTH" ? "North" : "South"} recorded a shot attempt at ${shotClock}.`);
  const receipt = await savedReceipt(page);
  expect(receipt.claim_id).toBe(shot.claim_ids[0]);
  expect(receipt.match_id).toBe(view.match_id);
  await page.keyboard.press("Escape");
  await page.getByLabel("Replay clock", { exact: true }).fill("0");
  await expect(page.getByTestId("clock")).toHaveText("00:00");
  await expect(page.locator(".moment-label")).not.toHaveText("Selected past moment");
  await page.getByRole("button", { name: "Select A higher line, proved", exact: true }).click();
  await expect(page.locator(".moment-copy h1")).toContainText("Line-height difference");
  await inspect(page, titleA);
  expect((await savedReceipt(page)).match_id).not.toBe(view.match_id);
});

test("Proof Lens restores keyboard focus, contains tabs, and shares safe focus behavior with other dialogs", async ({ page }) => {
  await setup(page);
  await inspect(page, titleA);
  await close(page).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Save receipt", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close(page)).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(open(page)).toBeFocused();
  await inspect(page, titleA);
  await close(page).click();
  await expect(open(page)).toBeFocused();
  await inspect(page, titleA);
  await open(page).evaluate((element) => element.remove());
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Matchday", exact: true })).toBeFocused();
  for (const label of ["Agent room", "Guided demo"]) {
    const trigger = page.getByRole("button", { name: label, exact: true }).first();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
  const agentRoom = page.getByRole("button", { name: "Agent room", exact: true }).first();
  await agentRoom.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await agentRoom.evaluate((element) => element.remove());
  await page.locator("[data-dialog-fallback]").evaluate((element) => { element.style.display = "none"; });
  await page.keyboard.press("Escape");
  await expect(page.locator(".app-shell")).toBeFocused();
});
