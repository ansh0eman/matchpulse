import { test, expect, type Page, type APIRequestContext, type TestInfo } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import type { PlaybackSegment, View } from "../src/contracts";

test.use({ reducedMotion: "reduce" });
const play = (page: Page) => page.getByRole("button", { name: "Play replay", exact: true });
const pause = (page: Page) => page.getByRole("button", { name: "Pause replay", exact: true });
const clock = (page: Page) => page.getByRole("slider", { name: "Replay clock", exact: true });
const source = (page: Page) => page.locator(".theatre-source");
function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  return { promise, release };
}
async function packet(request: APIRequestContext, scenario: string, start: number): Promise<PlaybackSegment> {
  const response = await request.get(`/api/playback?scenario=${scenario}&clock=${start}`);
  expect(response.ok()).toBe(true);
  return response.json();
}
async function load(page: Page, scenario = "line-shift") {
  await page.goto(`/?scenario=${scenario}`);
  await expect(play(page)).toBeEnabled();
  await expect(source(page)).toHaveText("Recorded replay");
}
// Inspect actual committed DOM states, including transient states between actions.
async function watch(page: Page) {
  await page.evaluate(() => {
    const state = { running: true, rows: [] as unknown[], last: "" };
    Object.assign(window, { playbackAudit: state });
    function tick() {
      if (!state.running) return;
      const svg = document.querySelector(".theatre-pitch svg");
      const row = {
        clock: Number((document.querySelector('[aria-label="Replay clock"]') as HTMLInputElement).value),
        displayed: document.querySelector('[data-testid="clock"]')?.textContent,
        score: document.querySelector('[data-testid="score"]')?.textContent?.replaceAll(/\s/g, ""),
        players: [...(svg?.querySelectorAll("g") ?? [])].filter((g) => g.querySelector(":scope > title")).map((g) => {
          const dot = g.querySelector("circle")!;
          return { id: g.querySelector("title")!.textContent!.split(":")[0].replace("Source ID ", ""), x: Number(dot.getAttribute("cx")), y: Number(dot.getAttribute("cy")) };
        }),
        moments: [...document.querySelectorAll("[data-story-id]")].map((e) => e.getAttribute("data-story-id")),
        headline: document.querySelector(".moment-copy h1")?.textContent,
        receipt: !!document.querySelector(".proof-drawer .proof-summary"),
        status: document.querySelector(".theatre-source")?.textContent,
      };
      const key = JSON.stringify(row);
      if (key !== state.last) { state.rows.push({ ...row, elapsed: performance.now() }); state.last = key; }
      requestAnimationFrame(tick);
    }
    tick();
  });
}
async function observed(page: Page): Promise<any[]> {
  return page.evaluate(() => {
    const state = (window as any).playbackAudit;
    state.running = false;
    return state.rows;
  });
}
async function evidence(info: TestInfo, name: string, value: unknown) {
  await mkdir("../output/playwright/p4", { recursive: true });
  await writeFile(`../output/playwright/p4/${info.project.name}-${name}.json`, JSON.stringify(value, null, 2));
}
async function oracle(request: APIRequestContext, scenario: string, rows: any[]) {
  for (const time of [...new Set(rows.map((r) => r.clock))]) {
    const view: View = await (await request.get(`/api/view?scenario=${scenario}&clock=${time}`)).json();
    for (const row of rows.filter((r) => r.clock === time)) {
      if (row.score === "–:–") continue; // A backward/context transition may withhold the entire old view.
      expect(row.score, `score at ${time}`).toBe(`${view.score.home}:${view.score.away}`);
      expect(row.players, `original positions at ${time}`).toEqual(view.frame?.players.map(({ id, x, y }) => ({ id, x, y })) ?? []);
      const eligible = view.timeline.filter((t) => t.source_seconds <= time && t.available_seconds <= time && t.presented_seconds <= time).map((t) => t.id);
      expect(row.moments.every((id: string) => eligible.includes(id)), `causal incidents at ${time}`).toBe(true);
    }
  }
}

test("known initial and exhausted-buffer delays preserve verified state and resume source prefixes", async ({ page, request }, info) => {
  await load(page);
  const initial = await packet(request, "line-shift", 3360);
  const view: View = await (await request.get("/api/view?scenario=line-shift&clock=3360&audience=fan")).json();
  const lineStory = view.timeline.find((story) => story.type === "observed_line_height_change");
  expect(lineStory?.claim_ids?.length).toBeGreaterThan(0);
  const proof = await (await request.get(`/api/proof?scenario=line-shift&clock=3360&audience=fan&claim_id=${encodeURIComponent(lineStory!.claim_ids[0])}`)).json();
  const support = proof.calculation.support;
  expect(support.reference_frames + support.recent_frames).toBe(59);
  const first = gate(), refill = gate();
  const timings: any[] = [];
  let calls = 0, refillStarted = false;
  await page.route("**/api/playback?**", async (route) => {
    const start = Number(new URL(route.request().url()).searchParams.get("clock"));
    const n = ++calls, started = performance.now();
    // Only the valid refill is generated at its observed anchor. Fault packets in
    // the next test are prepared before Play and never wait on route.fetch().
    const response = n === 1 ? initial : await packet(request, "line-shift", start);
    if (n === 1) await first.promise;
    if (n === 2) { refillStarted = true; await refill.promise; }
    try { await route.fulfill({ json: response }); } catch { /* paused cleanup */ }
    timings.push({ n, start, requestHeldMs: performance.now() - started });
  });
  await page.getByRole("combobox", { name: "Playback speed" }).selectOption("4");
  await watch(page);
  const began = performance.now();
  await play(page).click();
  await expect(source(page)).toHaveText("Buffering replay…");
  await expect(source(page)).toBeVisible();
  await page.waitForTimeout(700); // Deliberate, measured transport hold.
  await expect(clock(page)).toHaveValue("3360");
  await expect(page.getByLabel("Verified line comparison")).toContainText(
    `${support.reference_frames + support.recent_frames} verified samples · ${support.reference_frames} earlier / ${support.recent_frames} recent`,
  );
  first.release();
  await expect.poll(() => refillStarted).toBe(true);
  await expect(clock(page)).toHaveValue("3376");
  await expect(source(page)).toHaveText("Buffering replay…");
  await expect(source(page)).toBeVisible();
  await page.waitForTimeout(250);
  await expect(clock(page)).toHaveValue("3376");
  await page.screenshot({ path: `../output/playwright/p4/${info.project.name}-buffer-exhausted.png`, fullPage: true });
  refill.release();
  await expect.poll(async () => Number(await clock(page).inputValue())).toBeGreaterThan(3376);
  await expect(source(page)).toHaveText("Recorded replay");
  await pause(page).click();
  await expect(play(page)).toBeEnabled();
  const rows = await observed(page);
  await oracle(request, "line-shift", rows);
  await evidence(info, "delayed-valid", { elapsedMs: performance.now() - began, timings, rows });
  await page.unrouteAll({ behavior: "wait" });
});

test("deterministic malformed packets never publish and retry restores valid playback", async ({ page, request }, info) => {
  const original = await packet(request, "line-shift", 3360);
  const held = await packet(request, "withheld", 1350);
  const goal = await packet(request, "opening-goal", 2371);
  const cases: [string, string, PlaybackSegment, (p: any) => unknown][] = [
    ["wrong match", "line-shift", original, (p) => p.base.match_id = "wrong-match"],
    ["events hash", "line-shift", original, (p) => p.base.source_hashes.events = "invalid"],
    ["tracking hash", "line-shift", original, (p) => p.base.source_hashes.tracking = "invalid"],
    ["config hash", "line-shift", original, (p) => p.base.source_hashes.config = "invalid"],
    ["duplicate frame", "line-shift", original, (p) => p.frames[1] = p.frames[0]],
    ["out of order", "line-shift", original, (p) => p.frames.reverse()],
    ["invalid number", "line-shift", original, (p) => p.frames[0].players[0].x = null],
    ["missing field", "line-shift", original, (p) => delete p.events],
    ["missing prefix", "line-shift", original, (p) => { p.events = []; p.frames = []; }],
    ["future only", "line-shift", original, (p) => p.frames = p.frames.filter((f: any) => f.time_seconds > p.start)],
    ["truncated end", "line-shift", original, (p) => p.frames.pop()],
    ["erased observed goal", "opening-goal", goal, (p) => p.events = []],
    ["missing diagnostic age", "withheld", held, (p) => delete p.diagnostics[0].recent_age_seconds],
    ["invalid diagnostic span", "withheld", held, (p) => p.diagnostics[0].recent_span_seconds = "invalid"],
    ["no progress", "line-shift", original, (p) => { p.end = p.start; p.base.clock = p.start; p.events = p.events.filter((e: any) => e.time_seconds <= p.start); p.frames = p.frames.filter((f: any) => f.time_seconds <= p.start); }],
  ];
  const measurements: any[] = [];
  for (const [name, scenario, valid, mutate] of cases) {
    await load(page, scenario);
    const errors: string[] = [];
    const listener = (e: Error) => errors.push(e.message);
    page.on("pageerror", listener);
    const invalid = structuredClone(valid);
    mutate(invalid);
    await page.route("**/api/playback?**", (route) => route.fulfill({ json: invalid }));
    await watch(page);
    const started = performance.now();
    await play(page).click();
    await expect(page.getByRole("alert")).toContainText("Playback buffer unavailable");
    const latencyMs = performance.now() - started;
    await expect(play(page)).toBeDisabled();
    await expect(clock(page)).toHaveValue(String(valid.start));
    const rows = await observed(page);
    await oracle(request, scenario, rows);
    await expect(page.getByRole("button", { name: "Retry source connection", exact: true })).toBeEnabled();
    expect(errors).toEqual([]);
    measurements.push({ name, latencyMs, rows });
    await page.unrouteAll({ behavior: "wait" });
    await page.getByRole("button", { name: "Retry source connection", exact: true }).click();
    await expect(play(page)).toBeEnabled();
    await expect(page.getByRole("alert")).toHaveCount(0);
    page.off("pageerror", listener);
  }
  // Exercise a real valid packet after rejection, not merely a successful view refresh.
  await page.getByRole("combobox", { name: "Playback speed" }).selectOption("1");
  await play(page).click();
  await expect.poll(async () => Number(await clock(page).inputValue())).toBeGreaterThan(3360);
  await pause(page).click();
  await evidence(info, "malformed", measurements);
});

test("a pending future packet cannot resurrect score, positions, incident or proof after backward seeking", async ({ page, request }, info) => {
  await load(page);
  const old = await packet(request, "line-shift", 3360);
  const oldGate = gate(), seekGate = gate();
  let started = false, settled = false, viewPending = false;
  await page.route("**/api/playback?**", async (route) => {
    started = true;
    await oldGate.promise;
    try { await route.fulfill({ json: old }); } catch { /* expected client cancellation */ }
    settled = true;
  });
  await page.route("**/api/view?**", async (route) => {
    if (Number(new URL(route.request().url()).searchParams.get("clock")) !== 100) return route.continue();
    const view = await (await request.get("/api/view?scenario=line-shift&clock=100")).json();
    viewPending = true;
    await seekGate.promise;
    await route.fulfill({ json: view });
  });
  await play(page).click();
  await expect.poll(() => started).toBe(true);
  await clock(page).fill("100");
  await watch(page);
  await expect.poll(() => viewPending).toBe(true);
  await expect(page.getByLabel("Verified line comparison")).toHaveCount(0);
  oldGate.release();
  await expect.poll(() => settled).toBe(true);
  await expect(page.getByTestId("clock")).toHaveText("01:40");
  await expect(page.getByRole("button", { name: "Open Proof Lens", exact: true })).toHaveCount(0);
  await expect(page.locator(".proof-drawer")).toHaveCount(0);
  seekGate.release();
  await expect(play(page)).toBeEnabled();
  const rows = await observed(page);
  expect(rows.every((r) => r.clock === 100 && !r.moments.includes(old.base.timeline.at(-1)!.id))).toBe(true);
  await oracle(request, "line-shift", rows);
  await evidence(info, "backward-seek", rows);
  await page.unrouteAll({ behavior: "wait" });
});

test("pending replay remains isolated when the scenario changes", async ({ page, request }, info) => {
  await load(page);
  const old = await packet(request, "line-shift", 3360);
  const newPacket = await packet(request, "withheld", 1350);
  expect(old.base.match_id).not.toBe(newPacket.base.match_id);
  expect(old.base.source_hashes.events).not.toBe(newPacket.base.source_hashes.events);
  expect(old.base.source_hashes.tracking).not.toBe(newPacket.base.source_hashes.tracking);
  const delayed = gate();
  let started = false, settled = false;
  await page.route("**/api/playback?**", async (route) => {
    const query = new URL(route.request().url()).searchParams;
    if (query.get("scenario") === "withheld") return route.continue();
    started = true;
    await delayed.promise;
    try { await route.fulfill({ json: old }); } catch { /* expected cancellation */ }
    settled = true;
  });
  await play(page).click();
  await expect.poll(() => started).toBe(true);
  await page.getByRole("button", { name: "Select When the evidence says wait", exact: true }).click();
  await watch(page);
  await expect(page.getByTestId("clock")).toHaveText("22:30");
  await expect(play(page)).toBeEnabled();
  delayed.release();
  await expect.poll(() => settled).toBe(true);
  await expect(page.locator(".moment-copy h1")).toHaveText("The evidence says wait.");
  await expect(page.getByLabel("Verified line comparison")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  const rows = await observed(page);
  await oracle(request, "withheld", rows);
  await evidence(info, "scenario-isolation", { oldMatch: old.base.match_id, newMatch: newPacket.base.match_id, oldHashes: old.base.source_hashes, newHashes: newPacket.base.source_hashes, rows });
  await page.unrouteAll({ behavior: "wait" });
  await play(page).click();
  await expect.poll(async () => Number(await clock(page).inputValue())).toBeGreaterThan(1350);
  await pause(page).click();
});

test("network rejection is actionable and a cancelled request does not poison a subsequent play", async ({ page, request }, info) => {
  await load(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/playback?**", (route) => route.abort("failed"));
  const started = performance.now();
  await play(page).click();
  await expect(page.getByRole("alert")).toContainText("Playback buffer unavailable");
  const rejectedMs = performance.now() - started;
  await page.unrouteAll({ behavior: "wait" });
  await page.getByRole("button", { name: "Retry source connection", exact: true }).click();
  await expect(play(page)).toBeEnabled();
  const delayed = gate();
  let startedPending = false, settled = false, calls = 0;
  const invalid = await packet(request, "line-shift", 3360);
  invalid.base.match_id = "invalid-cancelled-packet";
  await page.route("**/api/playback?**", async (route) => {
    if (++calls > 1) return route.continue();
    startedPending = true;
    await delayed.promise;
    try { await route.fulfill({ json: invalid }); } catch { /* expected cancellation */ }
    settled = true;
  });
  await play(page).click();
  await expect.poll(() => startedPending).toBe(true);
  await pause(page).click();
  await expect(play(page)).toBeEnabled();
  await play(page).click();
  await expect.poll(async () => Number(await clock(page).inputValue())).toBeGreaterThan(3360);
  delayed.release();
  await expect.poll(() => settled).toBe(true);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(pause(page)).toBeEnabled();
  await pause(page).click();
  await page.unrouteAll({ behavior: "wait" });
  expect(errors).toEqual([]);
  await evidence(info, "network-cancel-recovery", { rejectedMs, settled, errors });
});

test("rapid successive seeks publish only the latest eligible request even when older responses settle last", async ({ page, request }, info) => {
  await load(page);
  const gates = new Map([100, 200, 300].map((time) => [time, gate()]));
  const started: number[] = [], settled: number[] = [];
  await page.route("**/api/view?**", async (route) => {
    const time = Number(new URL(route.request().url()).searchParams.get("clock"));
    const delayed = gates.get(time);
    if (!delayed) return route.continue();
    const view = await (await request.get(`/api/view?scenario=line-shift&clock=${time}`)).json();
    started.push(time);
    await delayed.promise;
    try { await route.fulfill({ json: view }); } catch { /* superseded */ }
    settled.push(time);
  });
  for (const time of [100, 200, 300]) {
    await clock(page).fill(String(time));
    await expect.poll(() => started.includes(time)).toBe(true);
  }
  await watch(page);
  gates.get(300)!.release();
  await expect(play(page)).toBeEnabled();
  gates.get(200)!.release(); gates.get(100)!.release();
  await expect.poll(() => settled.length).toBe(3);
  await expect(page.getByTestId("clock")).toHaveText("05:00");
  await expect(page.getByRole("alert")).toHaveCount(0);
  const rows = await observed(page);
  expect(rows.every((r) => r.clock === 300)).toBe(true);
  await oracle(request, "line-shift", rows);
  await evidence(info, "rapid-seeks", { started, settled, rows });
  await page.unrouteAll({ behavior: "wait" });
});
