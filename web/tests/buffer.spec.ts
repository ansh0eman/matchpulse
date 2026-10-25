import { test, expect } from "@playwright/test";
import type { PlaybackSegment, View } from "../src/contracts";
import { prefixView, validateSegment } from "../src/playback/segment";
test.use({
  video:
    process.env.MATCHPULSE_RECORD_PLAYBACK === "1"
      ? { mode: "on", size: { width: 1366, height: 768 } }
      : "off",
});

test("buffer prefixes equal the existing authoritative view across score, evidence and fixture boundaries", async ({
  request,
}) => {
  for (const [scenario, start] of [
    ["native-goals", 1613.5],
    ["opening-goal", 2370],
    ["equalizer", 4241],
    ["line-shift", 3359.5],
    ["withheld", 1349],
    ["open-play", 355],
    ["open-play", 2699.5],
  ] as const) {
    const packet: PlaybackSegment = await (
      await request.get(
        `/api/playback?scenario=${scenario}&clock=${start}&audience=fan`,
      )
    ).json();
    const seed: View = await (
      await request.get(
        `/api/view?scenario=${scenario}&clock=${start}&audience=fan`,
      )
    ).json();
    validateSegment(
      packet,
      { scenario, audience: "fan", favorite: "" },
      seed,
      start,
    );
    for (const clock of [
      start,
      start + 0.25,
      start + 0.5,
      start + 1,
      start + 2,
      packet.end,
    ]) {
      const actual = prefixView(packet, clock);
      const expected: View = await (
        await request.get(
          `/api/view?scenario=${scenario}&clock=${clock}&audience=fan`,
        )
      ).json();
      for (const key of [
        "score",
        "period",
        "clock",
        "frame",
        "frame_age",
        "timeline",
        "diagnostics",
        "recap",
        "source_hashes",
        "preferences",
      ] as const)
        expect(actual[key], `${scenario} ${clock} ${key}`).toEqual(
          expected[key],
        );
      expect(
        actual.recent_events.map((e) => {
          const { sequence: _, ...original } = e as typeof e & {
            sequence: number;
          };
          return original;
        }),
      ).toEqual(expected.recent_events);
      expect(
        actual.timeline.every((t) => t.presented_seconds <= clock),
      ).toBeTruthy();
      expect(
        actual.frame === null || actual.frame.time_seconds <= clock,
      ).toBeTruthy();
    }
    expect(() => prefixView(packet, start - 0.25)).toThrow();
    expect(() => prefixView(packet, packet.end + 0.25)).toThrow();
  }
});

test("invalid buffer ordering, identities, clocks, sources and viewer context fail closed", async ({
  request,
}) => {
  const packet: PlaybackSegment = await (
    await request.get("/api/playback?scenario=line-shift&clock=3360")
  ).json();
  const seed: View = await (
    await request.get("/api/view?scenario=line-shift&clock=3360")
  ).json();
  const scope = {
    scenario: "line-shift",
    audience: "fan" as const,
    favorite: "" as const,
  };
  const mutations = [
    (p: PlaybackSegment) => {
      p.frames[0].players[0].x = Number.NaN;
    },
    (p: PlaybackSegment) => {
      p.frames[0].players[1].id = p.frames[0].players[0].id;
    },
    (p: PlaybackSegment) => {
      p.events[0].score.home = -1;
    },
    (p: PlaybackSegment) => {
      p.base.timeline.find(
        (t) => t.overlay.metrics.length,
      )!.overlay.metrics[0].value = Number.NaN;
    },
    (p: PlaybackSegment) => {
      p.frames[1].sequence = p.frames[0].sequence;
    },
    (p: PlaybackSegment) => {
      p.frames[1].frame_id = p.frames[0].frame_id;
    },
    (p: PlaybackSegment) => {
      p.frames.splice(1, 1);
    },
    (p: PlaybackSegment) => {
      p.frames[0].time_seconds = p.end + 1;
    },
    (p: PlaybackSegment) => {
      p.base.match_id = "wrong-match";
    },
    (p: PlaybackSegment) => {
      p.base.preferences.audience = "analyst";
    },
    (p: PlaybackSegment) => {
      p.base.source_hashes.events = "changed";
    },
    (p: PlaybackSegment) => {
      p.base.timeline[0].claim_ids = ["wrong:claim:id"];
    },
    (p: PlaybackSegment) => {
      p.events = [];
      p.frames = [];
    },
    (p: PlaybackSegment) => {
      p.frames = p.frames.filter((f) => f.time_seconds > p.start);
    },
    (p: PlaybackSegment) => {
      p.frames.pop();
    },
    (p: PlaybackSegment) => {
      p.end = p.start;
      p.base = structuredClone(seed);
      p.events = p.events.filter((e) => e.time_seconds <= p.start);
      p.frames = p.frames.filter((f) => f.time_seconds <= p.start);
    },
  ];
  for (const mutate of mutations) {
    const invalid = structuredClone(packet);
    mutate(invalid);
    expect(() => validateSegment(invalid, scope, seed, 3360)).toThrow();
  }
});

test("one buffered request advances multiple source ticks without refetching the full view", async ({
  page,
}) => {
  let views = 0,
    buffers = 0;
  page.on("request", (r) => {
    if (r.url().includes("/api/view?")) views++;
    if (r.url().includes("/api/playback?")) buffers++;
  });
  await page.goto("/?scenario=line-shift");
  await expect(
    page.getByRole("button", { name: "Open Proof Lens", exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  const initialViews = views;
  await page
    .getByRole("combobox", { name: "Playback speed" })
    .selectOption("1");
  await page.getByRole("button", { name: "Play replay", exact: true }).click();
  await expect
    .poll(
      async () => (await page.getByTestId("clock").innerText()) >= "56:03",
      { timeout: 10000 },
    )
    .toBeTruthy();
  expect(views).toBe(initialViews);
  expect(buffers).toBe(1);
  await expect(page.locator(".theatre-loading")).toHaveCount(0);
  await page.getByRole("button", { name: "Pause replay", exact: true }).click();
});

test("an invalid prefetched packet pauses with an actionable error and recovers without publishing it", async ({
  page,
  request,
}) => {
  // Prepare the packet before starting the error deadline. The old route.fetch()
  // consumed almost all five seconds of the recorded public assertion window.
  const invalid = await (await request.get(
    "/api/playback?scenario=line-shift&clock=3360",
  )).json();
  invalid.base.match_id = "wrong-match";
  await page.goto("/?scenario=line-shift");
  await expect(
    page.getByRole("button", { name: "Open Proof Lens", exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  await page.route("**/api/playback?**", async (route) => {
    await route.fulfill({ json: invalid });
  });
  await page.getByRole("button", { name: "Play replay", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Playback buffer unavailable",
  );
  await page.unroute("**/api/playback?**");
  await page
    .getByRole("button", { name: "Retry source connection", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Play replay", exact: true }),
  ).toBeEnabled();
  await expect(page.getByTestId("clock")).toHaveText("56:00");
});

test("buffered goal playback publishes the score only at its observed source boundary", async ({
  page,
  request,
}) => {
  await page.goto("/?scenario=line-shift");
  await expect(
    page.getByRole("button", { name: "Open Proof Lens", exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  await page
    .getByRole("button", { name: "Select The opening goal", exact: true })
    .click();
  await expect(page.getByTestId("score")).toHaveText("1:0");
  await page
    .getByRole("slider", { name: "Replay clock", exact: true })
    .fill("2370");
  await expect(page.getByTestId("score")).toHaveText("0:0");
  await page
    .getByRole("combobox", { name: "Playback speed" })
    .selectOption("1");
  await page.getByRole("button", { name: "Play replay", exact: true }).click();
  const seen = await page.evaluate(
    () =>
      new Promise<{ clock: number; score: string }[]>((resolve, reject) => {
        const rows: { clock: number; score: string }[] = [];
        const deadline = performance.now() + 8000;
        function inspect() {
          const clock = Number(
            (
              document.querySelector(
                '[aria-label="Replay clock"]',
              ) as HTMLInputElement
            ).value,
          );
          const score = document
            .querySelector('[data-testid="score"]')!
            .textContent!.replaceAll(/\s/g, "");
          if (
            !rows.length ||
            rows.at(-1)!.clock !== clock ||
            rows.at(-1)!.score !== score
          )
            rows.push({ clock, score });
          if (clock >= 2371.25) resolve(rows);
          else if (performance.now() > deadline)
            reject(new Error("Buffered goal did not advance"));
          else requestAnimationFrame(inspect);
        }
        inspect();
      }),
  );
  await page.getByRole("button", { name: "Pause replay", exact: true }).click();
  expect(seen.some((r) => r.score === "0:0")).toBeTruthy();
  expect(seen.some((r) => r.score === "1:0")).toBeTruthy();
  for (const row of seen) {
    const oracle = await (
      await request.get(`/api/view?scenario=opening-goal&clock=${row.clock}`)
    ).json();
    expect(row.score, `observed UI clock ${row.clock}`).toBe(
      `${oracle.score.home}:${oracle.score.away}`,
    );
  }
});
