import RealTimeEngine from '../../upstream/football-simulator/RealTimeEngine';
import Player, { type PlayerAttributes } from '../../upstream/football-simulator/Player';
import Team from '../../upstream/football-simulator/Team';
import { Position } from '../../upstream/football-simulator/enums/Position';
import type { Tactics, TeamSide } from '../../upstream/football-simulator/RealTimeEngine';
import { eventSchema, type CanonicalEvent } from './schema';

// Park-Miller: explicit valid seed range; no global Math.random patch.
export function seededRandom(seed: number): () => number {
  if (!Number.isInteger(seed) || seed < 1 || seed >= 2147483647) throw new Error('Invalid seed');
  let state = seed;
  return () => { state = (state * 16807) % 2147483647; return (state - 1) / 2147483646; };
}
const attributeNames = `aggression anticipation bravery composure concentration decisions determination flair leadership offTheBall positioning teamwork vision workRate acceleration agility balance jumpingReach naturalFitness pace stamina strength corners crossing dribbling finishing firstTouch freeKickTaking heading longShots longThrows marking passing penaltyTaking tackling technique aerialReach commandOfArea communication eccentricity handling oneOnOnes reflexes rushingOut tendencyToPunch throwing`.split(' ');
function createTeam(home: boolean, attributeOffset = 0): Team {
  const roles = [Position.GK, Position.LB, Position.LCB, Position.RCB, Position.RB, Position.LM, Position.LCM, Position.RCM, Position.RM, Position.CF, Position.ST];
  return new Team(home, home ? 'Northbridge Aurora' : 'Southmere Comets', roles.map((role, i) => {
    const attributes = Object.fromEntries(attributeNames.map(key => [key, Math.max(1, Math.min(20, 12 + attributeOffset))])) as unknown as PlayerAttributes;
    return new Player({name: `${home ? 'North' : 'South'} Player ${i + 1}`, number: i + 1}, {height: 180, weight: 75}, attributes, role);
  }));
}
export type ScheduledChange = {at: number; side: TeamSide; changes: Partial<Tactics>};
export type RunOptions = { seed: number; intervention?: boolean; retainSnapshots?: boolean; length?: number; changeAt?: number; policy?: 'press-only' | 'high-press-bundle'; schedule?: ScheduledChange[]; homeAttributeOffset?: number; awayAttributeOffset?: number; instrumentSnapshots?: boolean };
export function runMatch({ seed, intervention = false, retainSnapshots = false, length = 5400, changeAt = 3600, policy = 'press-only', schedule = [], homeAttributeOffset = 0, awayAttributeOffset = 0, instrumentSnapshots = true }: RunOptions) {
  const started = performance.now();
  const engine = new RealTimeEngine(createTeam(true, homeAttributeOffset), createTeam(false, awayAttributeOffset), {
    random: seededRandom(seed), tickSeconds: 0.25, matchLengthSeconds: length,
    homeTactics: {style: 'balanced', press: 50}, awayTactics: {style: 'balanced', press: 50},
  });
  const roster = [...engine.state.players, ...engine.state.bench.home, ...engine.state.bench.away]
    .map(p => ({id: p.id, team_id: p.side === 'home' ? 'NORTH' : 'SOUTH', name: p.player.info.name}));
  const events: CanonicalEvent[] = [];
  const sourceEvents: object[] = [];
  const changes = policy === 'press-only' ? {press: 90} : {style: 'high_press' as const, press:90, defensiveLine:85, tempo:65, compactness:45, mentality:'attacking' as const};
  const appliedChanges: {time_seconds:number; side:TeamSide; changes:Partial<Tactics>; score:{home:number;away:number}}[] = [];
  let nextChange = 0;
  let applied = false, sourceCursor = 0, snapshotCount = 0, snapshotBytes = 0, maxHeap = 0;
  function drain() {
    for (const snapshot of engine.snapshots) {
      snapshotCount++;
      if (instrumentSnapshots) snapshotBytes += Buffer.byteLength(JSON.stringify(snapshot));
    }
    // The loop hands drain() only the newly created snapshot.
    const period = engine.state.period === 1 ? 1 : 2;
    for (; sourceCursor < engine.events.length; sourceCursor++) {
      const raw = engine.events[sourceCursor];
      const {team, player, secondaryPlayer, ...evidence} = raw;
      // Filter before assigning indices: even an index gap could reveal the intervention.
      if (raw.type === 'tactical_change' || raw.type === 'role_change') continue;
      const sourceIndex = sourceEvents.length;
      sourceEvents.push({source_index: sourceIndex, period, ...evidence});
      const side = raw.teamSide;
      const forward = (side === 'home' && period === 1) || (side === 'away' && period === 2);
      events.push(eventSchema.parse({
        schema_version: 1, id: `evt_${String(events.length).padStart(6, '0')}`, sequence: events.length,
        time_seconds: raw.time, period, team_id: side ? (side === 'home' ? 'NORTH' : 'SOUTH') : null,
        player_id: raw.playerId ?? null, secondary_player_id: raw.secondaryPlayerId ?? null,
        type: raw.type, position_m: raw.position,
        attacking_position_m: side ? (forward ? raw.position : {x: 105 - raw.position.x, y: 68 - raw.position.y}) : null,
        outcome: raw.outcome ?? null, possession_id: `pos_${raw.possession.id}`,
        possession_team_id: raw.possession.teamSide ? (raw.possession.teamSide === 'home' ? 'NORTH' : 'SOUTH') : null,
        score: raw.score, evidence: {source_index: sourceIndex, field_zones: raw.fieldZones,
          attack_pattern: raw.activeAttackPattern, chance_quality: raw.chanceQuality ?? null,
          possession_final_third_entries: raw.possession.finalThirdEntries},
      }));
    }
    if (!retainSnapshots) engine.snapshots.length = 0;
    maxHeap = Math.max(maxHeap, process.memoryUsage().heapUsed);
  }
  engine.start(); drain();
  // Keep only the latest snapshot in the drain accounting while retaining history separately.
  let retained: typeof engine.snapshots = [];
  while (engine.state.period !== 'ended') {
    while (nextChange < schedule.length && engine.state.time >= schedule[nextChange].at) {
      const entry = schedule[nextChange++];
      engine.applyTacticalChange(entry.side, entry.changes, 'scheduled_research_change');
      appliedChanges.push({time_seconds:engine.state.time, side:entry.side, changes:entry.changes, score:{...engine.state.score}});
    }
    if (intervention && !applied && engine.state.time >= changeAt) {
      engine.applyTacticalChange('home', changes, 'research_press_intervention');
      applied = true;
    }
    if (retainSnapshots) { retained.push(...engine.snapshots); engine.snapshots.length = 0; }
    engine.tick(); drain();
  }
  if (retainSnapshots) retained.push(...engine.snapshots);
  return {events, sourceEvents, roster, appliedChanges, score: engine.state.score, endTime: engine.state.time,
    intervention: applied ? {time_seconds: changeAt, team_id: 'NORTH', policy, changes} : null,
    performance: {runtime_ms: performance.now() - started, snapshot_count: snapshotCount,
      snapshot_json_bytes: snapshotBytes, sampled_heap_max_bytes: maxHeap,
      retained_snapshot_count: retainSnapshots ? retained.length : engine.snapshots.length},
  };
}
export function serialize(events: CanonicalEvent[]): string { return events.map(e => JSON.stringify(e)).join('\n') + '\n'; }
