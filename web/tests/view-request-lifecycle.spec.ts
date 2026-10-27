import { test, expect } from "@playwright/test";
import { get } from "../src/api";
import { openLineComparison } from "./helpers/readiness";

const unavailable = "The evidence service is unavailable. Please retry.";

test("malformed HTTP errors produce a usable message while declared errors remain intact", async () => {
  const original = globalThis.fetch;
  try {
    for (const body of [null, [], { error: {} }, { error: 12 }, { error: "" }, { error: "   " }]) {
      globalThis.fetch = async () => new Response(JSON.stringify(body), { status: 503 });
      await expect(get("/api/view")).rejects.toThrow(unavailable);
    }
    globalThis.fetch = async () => new Response("Gateway unavailable", { status: 502 });
    await expect(get("/api/view")).rejects.toThrow(unavailable);
    globalThis.fetch = async () => new Response(JSON.stringify({ error: "Declared source unavailable." }), { status: 503 });
    await expect(get("/api/view")).rejects.toThrow("Declared source unavailable.");
    const controller = new AbortController();
    globalThis.fetch = async (_input, init) => {
      expect(init?.signal).toBe(controller.signal);
      return new Response(JSON.stringify({ verified: false }));
    };
    expect(await get("/api/proof", controller.signal)).toEqual({ verified: false });
  } finally {
    globalThis.fetch = original;
  }
});

type DelayedView = { signal: AbortSignal; reject: () => void };
type InstrumentedWindow = Window & { delayedView?: DelayedView };

test("an obsolete paused-view rejection cannot replace the newer ready projection", async ({ page }, info) => {
  await openLineComparison(page, info);
  await page.evaluate(() => {
    const original = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = String(input);
      if (url.startsWith("/api/view?") && url.includes("audience=analyst")) {
        // Model a transport/body wrapper that settles after cancellation. Signal
        // cleanup alone must not authorize this obsolete error to change UI.
        return new Promise<Response>((_resolve, reject) => {
          (window as InstrumentedWindow).delayedView = {
            signal: init!.signal!,
            reject: () => reject(new TypeError("Obsolete transport failure")),
          };
        });
      }
      return original(input, init);
    };
  });
  await page.getByRole("button", { name: "Analyst view", exact: true }).click();
  await expect.poll(() => page.evaluate(() => Boolean((window as InstrumentedWindow).delayedView))).toBe(true);
  const currentResponse = page.waitForResponse(response => {
    const url = new URL(response.url());
    return url.pathname === "/api/view" && url.searchParams.get("audience") === "fan";
  });
  await page.getByRole("button", { name: "Fan view", exact: true }).click();
  expect((await currentResponse).ok()).toBe(true);
  await expect(page.getByRole("button", { name: "Play replay", exact: true })).toBeEnabled();
  expect(await page.evaluate(() => (window as InstrumentedWindow).delayedView!.signal.aborted)).toBe(true);
  await page.evaluate(() => (window as InstrumentedWindow).delayedView!.reject());
  // Two frames drain promise publication and React's queued render, not a
  // timed network sleep or a retry of the failed interaction.
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Play replay", exact: true })).toBeEnabled();
  await expect(page.getByTestId("clock")).toHaveText("56:00");
  await expect(page.getByTestId("verified-support")).toHaveText("59 verified samples · 41 earlier / 18 recent");
});

test("a current malformed HTTP error stays actionable and a real retry recovers", async ({ page }, info) => {
  await openLineComparison(page, info);
  await page.route("**/api/view?**audience=analyst**", route => route.fulfill({ status: 503, json: null }));
  await page.getByRole("button", { name: "Analyst view", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(unavailable);
  await expect(page.getByRole("alert")).not.toContainText("Cannot read properties");
  await expect(page.getByRole("button", { name: "Play replay", exact: true })).toBeDisabled();
  await page.unrouteAll({ behavior: "wait" });
  const retry = page.waitForResponse(response => response.url().includes("/api/view?") && response.ok());
  await page.getByRole("button", { name: "Retry source connection", exact: true }).click();
  await retry;
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Play replay", exact: true })).toBeEnabled();
});
