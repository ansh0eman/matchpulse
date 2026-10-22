import type { CanonicalEvent } from './schema';
export function metrics(events: CanonicalEvent[], start: number, end: number) {
  const window = events.filter(e => e.time_seconds >= start && e.time_seconds < end && e.team_id === 'NORTH');
  const recoveries = window.filter(e => ['recovery','interception','tackle'].includes(e.type));
  const high = recoveries.filter(e => (e.attacking_position_m?.x ?? -1) >= 70);
  const knownEntries = new Map<string, number>();
  let entries = 0;
  // Count newly observed increments, including the first event of a possession.
  for (const e of events) {
    if (e.time_seconds >= end) break;
    if (e.possession_team_id !== 'NORTH') continue;
    const value = e.evidence.possession_final_third_entries;
    const delta = Math.max(0, value - (knownEntries.get(e.possession_id) ?? 0));
    if (e.time_seconds >= start) entries += delta;
    knownEntries.set(e.possession_id, value);
  }
  return {
    recovery_actions: recoveries.length, high_recovery_actions: high.length,
    advanced_defensive_actions: window.filter(e => ['challenge','tackle','interception'].includes(e.type) && (e.attacking_position_m?.x ?? -1) >= 70).length,
    observed_final_third_entries: entries, shots: window.filter(e => e.type === 'shot').length,
    possession_sequences: new Set(window.filter(e => e.possession_team_id === 'NORTH').map(e => e.possession_id)).size,
    mean_recovery_x_m: recoveries.length ? recoveries.reduce((n,e) => n + e.attacking_position_m!.x, 0) / recoveries.length : null,
  };
}
