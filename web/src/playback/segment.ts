import type { Audience, PlaybackSegment, Team, View } from "../contracts";

export interface ReplayScope {
  scenario: string;
  audience: Audience;
  favorite: Team | "";
}
export function replayKey(scope: ReplayScope, clock: number) {
  return new URLSearchParams({
    scenario: scope.scenario,
    clock: String(clock),
    audience: scope.audience,
    ...(scope.favorite ? { favorite: scope.favorite } : {}),
  }).toString();
}

const point = (p: { x: number; y: number } | null | undefined) =>
  !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
const score = (s: { home: number; away: number } | null | undefined) =>
  !!s &&
  Number.isInteger(s.home) &&
  Number.isInteger(s.away) &&
  s.home >= 0 &&
  s.away >= 0;
const identifier = (s: unknown) =>
  typeof s === "string" && s.length > 0 && s.length <= 200;

export function validateSegment(
  p: PlaybackSegment,
  scope: ReplayScope,
  seed: View,
  start: number,
) {
  if (
    p.schema_version !== 1 ||
    p.mode !== "prefetched_causal_replay" ||
    p.start !== start ||
    !Number.isFinite(p.end) ||
    p.end < p.start ||
    p.end > p.start + 16 ||
    p.end > p.base.duration ||
    p.base.clock !== p.end ||
    p.base.duration !== seed.duration ||
    p.base.scenario !== scope.scenario ||
    p.base.match_id !== seed.match_id ||
    p.base.preferences.audience !== scope.audience ||
    (p.base.preferences.favorite_team ?? "") !== scope.favorite ||
    ["events", "tracking", "config"].some(
      (k) =>
        p.base.source_hashes[k as keyof View["source_hashes"]] !==
        seed.source_hashes[k as keyof View["source_hashes"]],
    )
  )
    throw new Error("Playback source/context changed");
  for (const rows of [p.events, p.frames]) {
    if (rows.length > 512)
      throw new Error("Playback observation bound exceeded");
    rows.forEach((row, i) => {
      if (
        !Number.isInteger(row.sequence) ||
        row.sequence < 0 ||
        !Number.isFinite(row.time_seconds) ||
        row.time_seconds > p.end ||
        row.time_seconds < 0 ||
        (i &&
          (row.sequence !== rows[i - 1].sequence + 1 ||
            row.time_seconds < rows[i - 1].time_seconds))
      )
        throw new Error(
          "Playback observations are duplicated, missing or out of order",
        );
    });
  }
  if (
    new Set(p.events.map((e) => e.source_id)).size !== p.events.length ||
    new Set(p.frames.map((f) => f.frame_id)).size !== p.frames.length
  )
    throw new Error("Duplicate playback observation identity");
  // Transport/render safety only. Canonical ingestion and server compilers own factual verification.
  if (
    p.events.some(
      (e) =>
        !identifier(e.source_id) ||
        typeof e.action !== "string" ||
        !point(e.ball_position_m) ||
        !score(e.score) ||
        ![1, 2].includes(e.period),
    )
  )
    throw new Error("Malformed event observation");
  if (
    p.frames.some(
      (f) =>
        !identifier(f.frame_id) ||
        !point(f.ball) ||
        ![1, 2].includes(f.period) ||
        !Array.isArray(f.players) ||
        f.players.length > 22 ||
        f.players.some(
          (p) =>
            !identifier(p.id) ||
            !point(p) ||
            !["NORTH", "SOUTH"].includes(p.team_id) ||
            typeof p.goalkeeper !== "boolean",
        ) ||
        new Set(f.players.map((p) => p.id)).size !== f.players.length,
    )
  )
    throw new Error("Malformed player observation");
  if (
    p.diagnostics.length > 512 ||
    p.diagnostics.some(
      (d) =>
        !Number.isFinite(d.detected_at_seconds) ||
        d.detected_at_seconds > p.end ||
        !Array.isArray(d.reasons) ||
        d.reasons.some((r) => typeof r !== "string"),
    )
  )
    throw new Error("Invalid diagnostic window");
  if (!p.base.tracking_available && p.frames.length)
    throw new Error("Unexpected player tracking");
  if (
    p.base.timeline.some(
      (t) =>
        !identifier(t.id) ||
        typeof t.type !== "string" ||
        (t.priority !== undefined &&
          (!Number.isInteger(t.priority) || t.priority < 0 || t.priority > 100)) ||
        !Number.isFinite(t.source_seconds) ||
        !Number.isFinite(t.available_seconds) ||
        !Number.isFinite(t.presented_seconds) ||
        typeof t.narration?.headline !== "string" ||
        !Array.isArray(t.narration.sentences) ||
        t.narration.sentences.some((s) => typeof s.text !== "string") ||
        !Array.isArray(t.narration.limitations) ||
        t.narration.limitations.some((s) => typeof s !== "string") ||
        !Array.isArray(t.overlay?.metrics) ||
        t.overlay.metrics.some(
          (m) => typeof m.name !== "string" || !Number.isFinite(m.value),
        ) ||
        !Array.isArray(t.overlay.references) ||
        t.overlay.references.some(
          (r) =>
            !r ||
            r.match_id !== p.base.match_id ||
            !identifier(r.source_id) ||
            typeof r.category !== "string",
        ) ||
        t.presented_seconds > p.end ||
        t.claim_ids.some((id) => !id.startsWith(p.base.match_id + ":")),
    )
  )
    throw new Error("Playback claim outside its namespace/window");
}

/** Select an original-source prefix. Never derive a goal from counts or interpolate positions. */
export function prefixView(p: PlaybackSegment, clock: number): View {
  if (!Number.isFinite(clock) || clock < p.start || clock > p.end)
    throw new Error("Clock outside playback buffer");
  const events = p.events.filter((e) => e.time_seconds <= clock);
  const last = events.at(-1);
  const frame = p.frames.filter((f) => f.time_seconds <= clock).at(-1) ?? null;
  const timeline = p.base.timeline.filter((t) => t.presented_seconds <= clock);
  return {
    ...p.base,
    clock,
    score: last?.score ?? { home: 0, away: 0 },
    period: last?.period ?? 1,
    frame,
    frame_age: frame ? clock - frame.time_seconds : null,
    recent_events: events.slice(-12),
    timeline,
    diagnostics: p.diagnostics
      .filter((d) => d.detected_at_seconds <= clock)
      .slice(-5),
    recap: timeline.slice(-5).map((t) => ({
      id: t.id,
      time: t.source_seconds,
      text: t.narration.headline,
    })),
  };
}
