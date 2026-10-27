import { selectStoryKind } from "./helpers/moments";
import { expect, test } from "@playwright/test";
import { openLineComparison } from "./helpers/readiness";

test("reference shell uses the available width, layered surfaces and responsive playback order", async ({ page }, info) => {
  await page.goto("/?scenario=line-shift&clock=3360");
  const frame = await page.locator(".matchday").boundingBox();
  expect(frame).not.toBeNull();
  expect(frame!.width).toBeGreaterThan(page.viewportSize()!.width - 52);
  await expect(page.locator(".synthetic-disclosure summary:visible")).toHaveCount(1);
  await expect(page.locator(".synthetic-disclosure summary:visible").filter({ hasText: "Synthetic replay" })).toBeVisible();
  await expect(page.locator(".matchday-investigation")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.locator(".comparison-card")).toHaveCSS("background-color", "rgb(240, 232, 252)");
  await expect(page.locator(".comparison-insights section").first()).toHaveCSS("background-color", "rgb(240, 232, 252)");
  await expect(page.locator(".comparison-card").locator(".comparison-insights")).toHaveCount(0);
  if (info.project.name === "laptop") {
    const desktopPitch = await page.locator(".theatre-pitch").boundingBox();
    const stage = await page.locator(".theatre-stage").boundingBox();
    expect(desktopPitch!.width).toBeGreaterThan(stage!.width - 24);
    expect(desktopPitch!.height).toBeLessThanOrEqual(Math.min(700, Math.max(300, page.viewportSize()!.height * 0.45)) + 1);
    await expect(page.locator(".timeline-heading")).toBeInViewport();
    await expect(page.getByRole("button", { name: "Play replay" })).toBeInViewport({ ratio: 0.95 });
    const navEdge = await page.locator(".app-header nav button.active").evaluate((element) => getComputedStyle(element, "::after").height);
    expect(navEdge).toBe("2px");
  } else {
    const transport = await page.locator(".theatre-transport").boundingBox();
    const investigation = await page.locator(".matchday-investigation").boundingBox();
    expect(transport!.y).toBeLessThan(investigation!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator(".matchday-investigation")).toHaveCSS("background-color", "rgb(32, 16, 44)");
  await expect(page.locator(".comparison-insights section").first()).toHaveCSS("background-color", "rgb(43, 23, 57)");
  const action = page.locator(".evidence-button");
  await action.scrollIntoViewIfNeeded();
  await expect(action).not.toHaveCSS("box-shadow", "none");
  const box = await action.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await expect(action).not.toHaveCSS("transform", "none");
  await page.screenshot({ path: `../output/playwright/turn-of-play/final-${info.project.name}-evidence-pressed.png` });
  await page.mouse.up();
});

test("shot Proof Lens action keeps its label on one line", async ({ page }) => {
  await page.goto("/?scenario=native-goals&clock=1611");
  await expect(page.getByRole("button", { name: "Play replay" })).toBeEnabled({ timeout: 60000 });
  await expect(page.getByRole("button", { name: "Play replay" })).toBeEnabled();
  await selectStoryKind(page,"native-goals",1611);
  const proof = page.locator(".incident-proof");
  await expect(proof).toBeVisible();
  await expect(proof).toHaveCSS("white-space", "nowrap");
  const geometry = await proof.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.clientHeight + 1);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
});

test("Watch, successful source comparison and Explain derive exploration progress", async ({ page }, info) => {
  await openLineComparison(page, info);
  await expect(page.locator(".exploration-caption")).toHaveText("0 of 3 steps explored");
  await expect(page.getByTestId("verified-support")).toBeVisible();
  await page.getByRole("button", { name: "Watch", exact: true }).click();
  await expect(page.locator(".exploration-caption")).toHaveText("1 of 3 steps explored");
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await expect(page.getByRole("dialog", { name: /Proof Lens/ })).toBeVisible();
  await expect(page.getByText("Source arithmetic verified")).toBeVisible();
  await expect(page.locator(".exploration-caption")).toHaveText("2 of 3 steps explored");
  await page.getByRole("button", { name: "Close Proof Lens" }).click();
  await page.getByRole("button", { name: "Explain", exact: true }).click();
  await expect(page.locator(".exploration-caption")).toHaveText("Evidence explored");
  await page.screenshot({ path: `../output/playwright/turn-of-play/final-${info.project.name}-steps-complete.png` });
  await page.getByRole("button", { name: "Select The game between the goals" }).click();
  await expect(page.locator(".exploration-caption")).toHaveText("0 of 3 steps explored");
});

test("failed proof cannot earn the Compare exploration step", async ({ page }) => {
  await page.route("**/api/proof**", (route) => route.fulfill({ status: 503, body: JSON.stringify({ error: "proof unavailable" }) }));
  await page.goto("/?scenario=line-shift&clock=3360");
  await page.getByRole("button", { name: "Watch", exact: true }).click();
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("proof unavailable");
  await expect(page.locator(".exploration-caption")).toHaveText("1 of 3 steps explored");
});

test("continuous playback rings and comments on a newly eligible event, while seeking does not replay it", async ({ page }, info) => {
  await page.addInitScript(() => {
    const log = { spoken: [] as string[], cancels: 0 };
    Object.defineProperty(window, "__speechLog", { value: log, configurable: true });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: class { text: string; voice: unknown = null; lang = "en-US"; rate = 1; onend: (() => void) | null = null; onerror: (() => void) | null = null; constructor(text: string) { this.text = text; } }, configurable: true,
    });
    Object.defineProperty(window, "speechSynthesis", {
      value: { getVoices: () => [{ name: "Local English", lang: "en-US", localService: true }], speak: (item: { text: string }) => log.spoken.push(item.text), cancel: () => { log.cancels += 1; }, onvoiceschanged: null }, configurable: true,
    });
  });
  await page.goto("/?scenario=native-goals&clock=1611");
  await expect(page.getByRole("button", { name: "Commentary off" })).toBeEnabled();
  expect(await page.evaluate(() => (window as unknown as { __speechLog: { spoken: string[] } }).__speechLog.spoken)).toEqual([]);
  await page.getByRole("button", { name: "Commentary off" }).click();
  await expect(page.getByRole("button", { name: "Commentary on" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Captions on" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Play replay" }).click();
  await expect(page.locator(".incident-anchor.is-arrival")).toHaveCount(1, { timeout: 15000 });
  await page.screenshot({ path: `../output/playwright/turn-of-play/final-${info.project.name}-key-moment-arrival.png` });
  await expect.poll(() => page.evaluate(() => (window as unknown as { __speechLog: { spoken: string[] } }).__speechLog.spoken.length)).toBe(1);
  const uttered = await page.evaluate(() => (window as unknown as { __speechLog: { spoken: string[] } }).__speechLog.spoken[0]);
  expect(uttered).toBe("Manchester City have scored. It's one–nil.");
  const caption = await page.locator(".replay-caption-line").innerText();
  expect(caption).toBe(uttered);
  const currentClock=Number(await page.getByRole("slider",{name:"Replay clock",exact:true}).inputValue());
  await selectStoryKind(page,"native-goals",currentClock);
  await page.getByRole("button", { name: "Preview commentary for selected historical moment" }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __speechLog: { spoken: string[] } }).__speechLog.spoken.length)).toBe(2);
  const historical = await page.evaluate(() => (window as unknown as { __speechLog: { spoken: string[] } }).__speechLog.spoken[1]);
  expect(historical).toContain("Selected historical moment");
  await page.getByRole("button", { name: "Captions on" }).click();
  await expect(page.getByRole("button", { name: "Captions off" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".replay-caption-line")).toHaveCount(0);
  await page.getByRole("button", { name: "Captions off" }).click();
  await expect(page.locator(".replay-caption-line")).toBeVisible();
  await page.getByRole("slider", { name: "Replay clock" }).fill("1000");
  await expect(page.getByTestId("clock")).toHaveText("16:40");
  expect(await page.evaluate(() => (window as unknown as { __speechLog: { spoken: string[]; cancels: number } }).__speechLog.cancels)).toBeGreaterThan(0);
  expect(await page.evaluate(() => (window as unknown as { __speechLog: { spoken: string[] } }).__speechLog.spoken.length)).toBe(2);
});

test("missing local voice is an honest unavailable state and captions remain usable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { value: { getVoices: () => [], cancel: () => {}, speak: () => {}, onvoiceschanged: null }, configurable: true });
  });
  await page.goto("/?scenario=line-shift&clock=3360");
  const commentary = page.getByRole("button", { name: "Commentary unavailable: no local English voice" });
  await expect(commentary).toBeDisabled();
  await expect(page.getByRole("button", { name: "Captions on" })).toBeEnabled();
});
