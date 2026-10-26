import type { View } from "../contracts";
import type { ReplayScope } from "./segment";

/** Audience-independent source fields only. Never contains stories, diagnostics, recap or preferences. */
export type SourceSnapshot = Pick<View, "scenario" | "match_id" | "clock" | "duration" | "period" | "score" | "frame" | "frame_age" | "tracking_available" | "recent_events" | "source_hashes" | "provenance">;
export function sourceSnapshot(view: View): SourceSnapshot {
  return { scenario: view.scenario, match_id: view.match_id, clock: view.clock, duration: view.duration,
    period: view.period, score: view.score, frame: view.frame, frame_age: view.frame_age,
    tracking_available: view.tracking_available, recent_events: view.recent_events,
    source_hashes: view.source_hashes, provenance: view.provenance };
}
export function validateProjection(view: View, scope: ReplayScope, clock: number, matchId?: string, source?: SourceSnapshot | null) {
  if (view.scenario !== scope.scenario || (matchId && view.match_id !== matchId) ||
      !Number.isFinite(view.clock) || view.clock !== clock ||
      view.preferences.audience !== scope.audience || (view.preferences.favorite_team ?? "") !== scope.favorite ||
      view.frame && view.frame.time_seconds > clock ||
      view.recent_events.some((event) => event.time_seconds > clock) ||
      view.timeline.some((story) => Math.max(story.source_seconds, story.available_seconds, story.presented_seconds) > clock ||
        story.claim_ids.some((id) => !id.startsWith(view.match_id + ":")))) {
    throw new Error("The explanation does not match this replay and viewer scope.");
  }
  if (source?.scenario === scope.scenario && (source.match_id !== view.match_id ||
    Object.keys(source.source_hashes).some((key) => source.source_hashes[key as keyof View["source_hashes"]] !== view.source_hashes[key as keyof View["source_hashes"]]))) {
    throw new Error("The explanation's source identity changed.");
  }
}
