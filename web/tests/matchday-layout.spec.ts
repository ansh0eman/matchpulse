import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import type { Proof } from "../src/contracts";
import { openLineComparison } from "./helpers/readiness";

const evidenceDir = "../output/playwright/turn-of-play";
const themeRuntime = new URL(process.env.MATCHPULSE_TEST_URL ?? "http://127.0.0.1:5173").port === "4173" ? "production" : "development";

test("matchday composition is loaded, responsive and shows source-verified support", async ({ page }, info) => {
  await mkdir(evidenceDir, { recursive: true });
  await openLineComparison(page, info);
  await expect(page.getByRole("img", { name: "Observed player and ball positions" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Selected moment investigation" })).toBeVisible();
  await expect(page.locator(".theatre-transport")).toBeVisible();
  await expect(page.locator(".md-moments")).toBeVisible();
  const playhead=page.getByTestId("timeline-playhead");
  await expect(playhead).toHaveAttribute("data-clock","3360");
  const axis=await page.locator(".time-axis").boundingBox();
  const marker=await page.locator('.incident-anchor[data-source-seconds="3360"]').boundingBox();
  const duration=Number(await page.locator(".time-axis").getAttribute("data-duration"));
  expect(Math.abs(marker!.x-axis!.x-axis!.width*3360/duration)).toBeLessThan(1);
  await expect(page.getByTestId("verified-support")).toBeVisible();

  const view = await (await page.request.get("/api/view?scenario=line-shift&clock=3360&audience=fan")).json();
  const lineStory = view.timeline.find((story: { type: string }) => story.type === "observed_line_height_change");
  expect(lineStory).toBeTruthy();
  const proof: Proof = await (await page.request.get(`/api/proof?scenario=line-shift&clock=3360&audience=fan&claim_id=${encodeURIComponent(lineStory.claim_ids[0])}`)).json();
  expect(proof.verified).toBe(true);
  expect(await page.getByTestId("verified-support").innerText()).toBe(
    `${proof.calculation.support!.reference_frames + proof.calculation.support!.recent_frames} verified samples · ${proof.calculation.support!.reference_frames} earlier / ${proof.calculation.support!.recent_frames} recent`,
  );
  await page.screenshot({ path: `${evidenceDir}/${themeRuntime}-${info.project.name}-loaded-light.png`, animations: "disabled" });

  if (info.project.name === "laptop") {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
      await page.setViewportSize(viewport);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({
        path: `${evidenceDir}/${themeRuntime}-matchday-light-${viewport.width}x${viewport.height}.png`,
        animations: "disabled",
      });
    }
    await page.setViewportSize({ width: 1366, height: 768 });
  }

  const bounds = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    pitch: document.querySelector(".theatre-pitch")!.getBoundingClientRect().toJSON(),
    field: document.querySelector(".theatre-pitch .pitch")!.getBoundingClientRect().toJSON(),
    rail: document.querySelector(".matchday-investigation")!.getBoundingClientRect().toJSON(),
  }));
  expect(bounds.document).toBeLessThanOrEqual(bounds.viewport + 1);
  if (info.project.name === "laptop") {
    expect(bounds.pitch.width).toBeGreaterThan(0);
    const geometry = await page.locator('.theatre-pitch svg').evaluate((node) => {
      const svg = node as SVGSVGElement, matrix = svg.getScreenCTM()!;
      return { scaleX: matrix.a, scaleY: matrix.d, meet: svg.getAttribute('preserveAspectRatio'), viewBox: svg.getAttribute('viewBox') };
    });
    expect(geometry.meet).toBe('xMidYMid meet');
    expect(geometry.viewBox).toBe('-4 -4 113 76');
    expect(geometry.scaleX).toBeCloseTo(geometry.scaleY, 6);
    expect(bounds.pitch.width).toBeGreaterThan(bounds.rail.width * 1.7);
  }
  else expect(bounds.rail.width).toBeLessThanOrEqual(bounds.viewport);
  await page.screenshot({ path: `${evidenceDir}/${themeRuntime}-${info.project.name}-matchday-light.png`, fullPage: true, animations: "disabled" });

  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByTestId("clock")).toHaveText("56:00");
  await expect(page.locator(".md-moments [aria-current='true']")).toHaveCount(0);
  await page.screenshot({ path: `${evidenceDir}/${themeRuntime}-${info.project.name}-loaded-dark.png`, animations: "disabled" });
  await page.screenshot({ path: `${evidenceDir}/${themeRuntime}-${info.project.name}-matchday-dark.png`, fullPage: true, animations: "disabled" });

  await page.getByRole("button", { name: "Select When the evidence says wait" }).click();
  await expect(page.getByTestId("clock")).toHaveText("22:30");
  await expect(page.locator(".matchday-investigation")).toContainText("Recent comparable observations are needed to support a current positional comparison.");
  await expect(page.getByRole("button", { name: "Open Proof Lens" })).toHaveCount(0);
  await page.screenshot({ path: `${evidenceDir}/${themeRuntime}-${info.project.name}-withheld.png`, fullPage: true, animations: "disabled" });

  await page.getByRole("button", { name: "Select The game between the goals" }).click();
  await expect(page.getByTestId("clock")).toHaveText("05:56");
  await expect(page.locator(".incident-card")).toBeVisible();
  await expect(page.locator(".comparison-card")).toHaveCount(0);
  await page.screenshot({ path: `${evidenceDir}/${themeRuntime}-${info.project.name}-incident.png`, fullPage: true, animations: "disabled" });
});

test("support receipt is requested once per selected positional story, not per replay tick", async ({ page }, info) => {
  let proofRequests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/proof") proofRequests++;
  });
  await openLineComparison(page, info);
  await expect(page.getByTestId("verified-support")).toBeVisible();
  const afterReady = proofRequests;
  await page.getByRole("slider", { name: "Replay clock" }).fill("3361");
  await expect(page.getByTestId("clock")).toHaveText("56:01");
  await page.waitForTimeout(150);
  expect(proofRequests).toBe(afterReady);
});
