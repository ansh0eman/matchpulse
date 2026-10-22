# Simulator audit

Date: 2026-10-22. Repository https://github.com/tbleckert/football-simulator, inspected commit `39529b19c40868d66aa47db084ebc9ea29c86e70`, source manifest 2.0.0. Checkout remains unmodified. Node v24.19.0, darwin arm64. The current machine is Apple Silicon; no other platform was tested.

## Scope and source

Root TypeScript classes include RealTimeEngine, Team, Player, legacy Engine/Game/Field, reporters/commentator and SeasonSimulator. `enums/`, `types/`, `lib/`, `test/`, `docs/`, `demo/`, and `data/` supply supporting definitions, tests, docs and examples. Source package.json declares Node >=18 and exports dist/index.js with dist/index.d.ts. We directly execute the pinned TypeScript source using tsx, rather than assuming built npm code equals source. There is one declared runtime dependency (`events`) and eight development dependencies. Zod is the only direct PoC runtime dependency.

Inspected files: LICENSE, package.json/package-lock.json, index.ts, RealTimeEngine.ts, Player.ts, Team.ts, Field.ts, enums/Position.ts, lib/getRandomElement.ts, .npmignore, README, and upstream test entry points. The architecture report traces the actual functions. No club/player sample data or upstream narratives are used by the PoC.

The repository is not archived. Latest inspected commit and GitHub pushed_at are October 4, 2026; recent prior work includes licensing September 18 and engine geometry August 22. The retrieved metadata shows zero open issues/PRs. That is limited activity evidence, not proof of active support, correctness or absence of bugs. Saved metadata is a snapshot; future maintenance is uncertain. A small project with no external support commitment remains a maintenance risk.

## Verified capabilities and limits

- `new RealTimeEngine(home, away, options)` creates 22 active player states plus a bench. Fictional generated bench names remain within the invented team universe.
- `options.random` permits deterministic RNG injection. There is no numeric `seed` option. Default Math.random is nondeterministic. The legacy path also contains global random draws and is excluded.
- `start()`, `tick()`, `simulate()` and `applyTacticalChange()` work on inspected source. Mid-match tactical calls affect base tactics, targets, movement/action selection and later output. We only experimentally verified home policy interventions and snapshot draining, not every API combination.
- `engine.events` includes typed events with fractional seconds, actors, ball position, score, outcome, possession context, zones and patterns. `engine.snapshots` includes all players every tick. Direct tactical calls append to events outside snapshot events, so snapshot-only flattening would miss them.
- Pass attempt, receive, interception, tackle, loose-ball recovery, shot and goal are available; source lists 36 event kinds including two excluded administrative controls. No invented pressure event is added. No calibrated xG, real-world causal inference, detector or save/restore branching is verified.
- Press-only and bundled high-press experiments are both preserved, including their negative/weak findings. See tactical-experiment.md.
- Stable IDs, halftime direction rotation and ordered timestamps are checked. Location is ball-at-event, not necessarily a player's precise tackle coordinate or pass destination. Coordinates can be outside the pitch on out-of-play events.

## Reproducibility

Two independent full matches for seed 11 have identical normalized files. SHA-256:

`6cc3592bf669ef1f093ca4397e22f93c2571475e41dea0b1007671d0aaa9ff0f`

The repeat has the same hash. Seed 29 differs. Both policies' first-seed repeats pass. Canonical files exclude wall-clock measurements and administrative markers. Every paired run has the same complete event prefix through 3600 seconds. Tests also validate all exported runs, source correspondence, actor references and timestamp order. Reproducibility is established for this pinned implementation, runtime and tested settings; cross-version/architecture bitwise equivalence is not established.

## Measurements

For the 24 press-only scenario matches, instrumented end-to-end generation runtimes ranged 1327.8–1568.8ms, median 1386.9ms. There were 6545–6913 canonical events and 3,711,123–3,919,292 UTF-8 JSONL bytes per match. Snapshot counts ranged 22,081–22,701 including boundaries and added time.

Runtime includes team setup, simulation, Zod normalization, per-tick snapshot JSON-size instrumentation and process heap sampling; it excludes filesystem exports and final canonical serialization. It is not a pure engine throughput claim. First/GC/JIT effects apply; these are observations on this machine, not service latency estimates.

Separate fresh-process, sequential seed-11 retention benchmarks:

| Metric | Drain history | Retain history |
|---|---:|---:|
| Runtime ms | 1344.3 | 1464.3 |
| Events | 6,637 | 6,637 |
| Created snapshots | 22,361 | 22,361 |
| Retained snapshots at end | 0 | 22,361 |
| Sampled JS heap maximum bytes | 40,490,496 | 305,175,080 |
| Process high-water RSS bytes | 155,418,624 | 444,071,936 |
| Sum of snapshot JSON bytes | 291,138,556 | 291,138,556 |
| Canonical JSONL bytes | 3,765,612 | 3,765,612 |

These are one run per retention mode, not an isolated statistical performance comparison. Snapshot byte count sums independently serialized snapshots (with source event objects), not an actual snapshot file size or retained memory measurement. Heap samples include events, source projections, V8 allocation/GC effects and instrumentation; they are not engine-only memory. RSS uses Node's documented maxRSS kilobytes converted to bytes. Clearing engine.snapshots still constructs one snapshot per tick; it bounds history retention without eliminating allocation cost. The engine's event history remains retained. The retained-mode harness accumulates snapshots in an equivalent external history so each is counted exactly once.

Pre-generating matches and storing compact canonical JSONL is practical. Python can iterate line-by-line without a Node service, and replay can honor event time differences. Source audit files are larger and belong to research/evaluation storage. The whole research output directory is roughly 429 MiB because it retains both policy groups, repeated baselines and source projections; deployment need only selected canonical fixtures and their evidence packages.

## Test results

PoC: 6 tests passed, 0 failed, 0 skipped; TypeScript typecheck passed. Tests cover full-match repeated seeds/divergence, valid RNG range, runtime validation and actor joins, ordering and score, intervention prefixes, index-gap leakage, snapshot equivalence, saved experiment results and all 48 exported scenario/source/hash joins. See ../poc/output/tests.log and typecheck.log. Artifact tests require both experiments to have run.

Upstream: npm test completed successfully (pitch geometry, realtime, calibration, season), and npm run typecheck passed on Node 24. Raw logs are saved as upstream-tests.log/upstream-typecheck.log. Upstream uses ts-node's experimental loader and emits deprecation warnings; these did not fail the suites. Our shell reporting wrapper initially hit zsh's read-only `status` name after tests had run; it was corrected to check_exit and both suites were rerun successfully. No simulator-code fix was needed. An initial PoC implicit-any type error in experiment result collection was fixed with an explicit Result type before final checks.

npm audit findings and license checks are in licensing-audit.md. No live cloud calls, deployment, user-facing app, commits or publishing were performed.

## Actual generated event and source evidence

Seed 11, baseline, first interception (not a fabricated example):

```json
{
  "schema_version": 1,
  "id": "evt_000013",
  "sequence": 13,
  "time_seconds": 13,
  "period": 1,
  "team_id": "NORTH",
  "player_id": "home-starter-6-7",
  "secondary_player_id": "away-starter-5-6",
  "type": "interception",
  "position_m": {
    "x": 11.37,
    "y": 41.81
  },
  "attacking_position_m": {
    "x": 11.37,
    "y": 41.81
  },
  "outcome": null,
  "possession_id": "pos_2",
  "possession_team_id": "NORTH",
  "score": {
    "home": 0,
    "away": 0
  },
  "evidence": {
    "source_index": 13,
    "field_zones": [
      "defensive_third",
      "half_space_right"
    ],
    "attack_pattern": "patient_buildup",
    "chance_quality": null,
    "possession_final_third_entries": 0
  }
}
```

Matching source projection, indexed after filtering control events:

```json
{
  "source_index": 13,
  "period": 1,
  "type": "interception",
  "time": 13,
  "teamSide": "home",
  "playerId": "home-starter-6-7",
  "secondaryPlayerId": "away-starter-5-6",
  "position": {
    "x": 11.37,
    "y": 41.81
  },
  "score": {
    "home": 0,
    "away": 0
  },
  "fieldZones": [
    "defensive_third",
    "half_space_right"
  ],
  "possession": {
    "id": 2,
    "teamSide": "home",
    "startTime": 13,
    "startPhase": "open_play",
    "passCount": 0,
    "lastPassRoute": null,
    "lastSuccessfulPassRoute": null,
    "lastProgressionZone": "defensive_third",
    "finalThirdEntries": 0,
    "wideEntries": 0,
    "boxEntries": 0,
    "secondBallRecoveries": 0,
    "setPieceOrigin": null,
    "activeAttackPattern": "patient_buildup",
    "currentFieldZones": [
      "defensive_third",
      "half_space_right"
    ],
    "lastRecoveryType": null
  },
  "activeAttackPattern": "patient_buildup"
}
```

This event comes from `detectPassOutcome()` transferring possession via registerTouch, then createEvent/commitSnapshot. Our adapter maps home to NORTH, leaves first-half home coordinates unchanged, validates the event and writes line 14 (zero-based sequence 13). The secondary player is the opposing pass actor; roster.json resolves both IDs.

Seed-11 observed type counts:

```json
{
  "match_start": 1,
  "kickoff": 3,
  "pass": 2219,
  "receive": 1517,
  "second_ball": 282,
  "recovery": 300,
  "challenge": 1010,
  "interception": 361,
  "dribble": 666,
  "goalkeeper_punch": 23,
  "goal_kick": 24,
  "goalkeeper_claim": 58,
  "tackle": 51,
  "throw_in": 40,
  "shot": 18,
  "save": 9,
  "foul": 10,
  "free_kick": 20,
  "miss": 8,
  "offside": 1,
  "half_time": 1,
  "corner": 4,
  "substitution": 6,
  "yellow_card": 1,
  "injury": 1,
  "advantage": 1,
  "goal": 1,
  "full_time": 1
}
```

Across 12 baseline seeds, goals average 0.667/match. This low scoring with uniform players is a plausibility limitation, not evidence of realistic professional football. No real-data calibration was performed. Event counts are dense and correlated; many challenge/receive records should not be treated as independent football opportunities.

## Integration conclusion

CONDITIONAL GO for pinned-source synthetic scenario generation with the bundled intervention; NO claim that press-only is an adequate detector benchmark. Own the canonical adapter, analytics, detector and evidence. Keep the generator replaceable and avoid importing simulator state into Python or React. Stop before main-product implementation; the next milestone is independent Python ingestion/detection evaluation, as specified in feasibility-verdict.md.
