import type { Story, View } from "../contracts";
export const FEATURE_WINDOW_SECONDS = 30;
export interface HistoricalSelection { scenario: string; matchId: string; storyId: string; eligibleAt: number }
export type Presentation = { kind: "loading" | "quiet" } | { kind: "selected" | "featured"; story: Story } | { kind: "withheld"; diagnostic: View["diagnostics"][number] };
const featureRank: Record<string, number> = { goal_context: 100, dismissal: 95, player_dismissal: 95, turnover_to_shot: 80, observed_line_height_change: 70, recent_attacking_activity: 50 };
export const eligibleAt = (story: Story) => Math.max(story.source_seconds, story.available_seconds, story.presented_seconds);
export function selectEditorial({ view, scenario, clock, matchId, selection }: { view: View | null; scenario: string; clock: number; matchId?: string; selection: HistoricalSelection | null }) {
  const incompatible = !!selection && (selection.scenario !== scenario || !!matchId && selection.matchId !== matchId || clock < selection.eligibleAt);
  if (!view || view.scenario !== scenario || matchId && view.match_id !== matchId || view.clock > clock) {
    return { available: [] as Story[], latestRecorded: undefined as Story | undefined, presentation: { kind: "loading" } as Presentation, selectionDisposition: incompatible ? "clear" as const : "pending" as const };
  }
  const now = view.clock;
  const available = view.timeline.filter(s => [s.source_seconds,s.available_seconds,s.presented_seconds].every(Number.isFinite) && eligibleAt(s) <= now && s.claim_ids.every(id => id.startsWith(view.match_id + ":")))
    .sort((a,b) => a.source_seconds-b.source_seconds || a.presented_seconds-b.presented_seconds || a.id.localeCompare(b.id));
  const latestRecorded = [...available].sort((a,b) => b.presented_seconds-a.presented_seconds || b.source_seconds-a.source_seconds || a.id.localeCompare(b.id))[0];
  const chosen = !incompatible && selection ? available.find(s => s.id === selection.storyId && selection.matchId === view.match_id) : undefined;
  const selectionDisposition = selection && !chosen ? "clear" as const : "retain" as const;
  if (chosen) return { available, latestRecorded, presentation: { kind:"selected", story:chosen } as Presentation, selectionDisposition };
  const boundary = available.filter(s => s.type === "match_boundary").reduce((latest,s) => Math.max(latest,s.source_seconds), -1);
  const featured = available.filter(s => featureRank[s.type] && now-s.presented_seconds <= FEATURE_WINDOW_SECONDS && s.source_seconds >= boundary)
    .sort((a,b) => featureRank[b.type]-featureRank[a.type] || b.presented_seconds-a.presented_seconds || a.id.localeCompare(b.id))[0];
  if (featured) return { available, latestRecorded, presentation: { kind:"featured", story:featured } as Presentation, selectionDisposition };
  const diagnostic = view.diagnostics.filter(d => Number.isFinite(d.detected_at_seconds) && d.detected_at_seconds <= now && now-d.detected_at_seconds <= FEATURE_WINDOW_SECONDS)
    .sort((a,b) => b.detected_at_seconds-a.detected_at_seconds || a.reasons.join('|').localeCompare(b.reasons.join('|')))[0];
  return { available, latestRecorded, presentation: diagnostic ? {kind:"withheld",diagnostic} as Presentation : {kind:"quiet"} as Presentation, selectionDisposition };
}
