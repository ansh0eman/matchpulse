# Architecture and execution trace

Inspected source: `../upstream/football-simulator`, commit `39529b19c40868d66aa47db084ebc9ea29c86e70`, package manifest 2.0.0. All engine references below refer to this commit, not to the npm bundle.

## Two engines; choose the right one

`index.ts` exports both the legacy `Engine`/`Game` path and `RealTimeEngine`. This PoC imports `RealTimeEngine.ts`, `Player.ts`, `Team.ts`, and `enums/Position.ts` directly. The older path and `Team.getProbablePlayer()` use global `Math.random`; they are not used for event generation here. No AI, reporter, commentator, frontend, or real-club data is imported. `Team.ts` imports old helper modules, but the RealTimeEngine path does not invoke their random action methods.

The public engine has `state`, `events`, `snapshots`, `start()`, `tick()`, `simulate(untilSeconds?)`, `applyTacticalChange()`, and `applyRoleChange()`. There is no seed option and no tested public save/restore/fork API. `options.random` accepts a `() => number`. `simulate(3600)` advances to an absolute clock target; `simulate()` completes both halves plus added time. We use `tick()` to drain snapshots.

## Ownership, inputs, outputs, side effects, and callers

| Function / file | Input -> output | State changed / caller |
|---|---|---|
| top level, `poc/src/experiment.ts` | CLI `--bundle` -> JSONL, summaries, hashes, truth | Creates output files; first code executed by `npm run experiment` |
| `runMatch`, `poc/src/simulation.ts` | seed, policy, snapshot choice -> events, roster, truth, measurements | Owns fresh teams, RNG and engine per run; called by experiment/tests/benchmark |
| `seededRandom`, same file | valid positive integer < 2147483647 -> random function | Closure holds Park–Miller state; injected into constructor |
| `createTeam`, same file | home boolean -> Team with 11 fictional Players | Creates all attributes explicitly at 12/20; called twice per run |
| `Player.constructor`, `Player.ts:105` | info, biometrics, attributes, Position -> Player | Stores supplied values; called by createTeam and engine bench generation |
| `Team.constructor`, `Team.ts:90` | home flag, name, players -> Team | Stores roster; called by createTeam |
| `RealTimeEngine.constructor`, `RealTimeEngine.ts:488` | teams, partial options -> engine | Sets 0.25s tick, 5400s regulation, base tactics, RNG, state and bench; calls tacticsFromOptions/createPlayers/createBenchPlayers |
| `createPlayers`, `:874` | team, side, tactics, players -> SimulatedPlayer[] | Stable IDs, attributes, formation targets, stamina=100; constructor and bench setup call it |
| `start`, `:553` | none -> MatchSnapshot | Initializes targets/positions, randomly selects kickoff, emits match_start/kickoff; runMatch calls once |
| `tick`, `:639` | none -> MatchSlice | Advances clock, boundaries/restarts, tactics, intents, actions, movement and event detection; runMatch loops until ended |
| `handleTimeBoundaries`, `:1009` | none -> event array | Adds halftime/fulltime transitions; halftime sets period=2 before boundary events; called by tick |
| `updateTacticalState`, `:1410` | state/base tactics -> void | Derives effective tactics using score, fatigue, discipline/injuries; called by tick |
| `updateTacticalTargetPositions`, `:1459` | state -> void | Updates formation/ball-relative movement targets; tick/start/tactical changes call it |
| `decidePlayerIntents`, `:1513` | state -> void | Assigns intents based on carrier, receiver, teammates, opponents, loose ball; called by tick |
| `intentForBallOwner`, `:1559` | carrier -> PlayerIntent | Chooses shoot/pass/dribble using attributes, position, tactics and RNG; decidePlayerIntents calls it |
| `intentForOutOfPossession`, `:1723` | defender, carrier -> PlayerIntent | Uses pressDistance/pressUrgency/pressRisk to press, cover or recover; decidePlayerIntents calls it |
| `pressDistance`, `:1760` | defender, carrier -> radius in metres | Pure read of tactics/roles/zones; includes press * .16 and line * .05, plus style and trap modifiers |
| `resolveBallAction`, `:1823` | state -> event array | Executes carrier intent; can call startPass/startShot |
| `startPass`, `:1853` | carrier, recipient -> pass event | Creates in-flight pass with quality/error, velocity and target; registers touch, cooldown |
| `startShot`, `:1898` | carrier -> shot event | Creates in-flight shot and quality; clears ownership; resolveBallAction calls it |
| `movePlayersAndBall`, `:1934` | state -> void | Moves players and ball, drains stamina, records position; called by tick |
| `detectEvents`, `:1978` | state -> event array | Delegates shot/pass outcomes, ball-out, tackle/foul or loose-ball recovery; called by tick |
| `detectTackleOrFoul`, `:2008` | carrier -> event array | Requires nearest opponent within challenge radius; stochastic tackle/foul, possible transfer; detectEvents calls it |
| `detectPassOutcome`, `:2466` | active action -> event array | Interception/receive/offside/loose-ball outcomes; exact location can be found with rg |
| `detectLooseBallRecovery`, `:2411` | state -> event array | Nearest eligible player gains ball; emits recovery, including same-side recoveries |
| `registerTouch`, `:4512` | player or null -> void | Starts new possession if side changes, updates last touch and progression position; action/movement/outcome functions call it |
| `startPossession`, `:782` | side, phase, optional restart -> void | Increments possession ID, resets counters and start time; registerTouch/restarts call it |
| `recordPossessionPosition`, `:817` | side, point -> void | Updates zone counters on crossings; registerTouch calls it |
| `createEvent`, `:3126` | type, optional actors/outcome/details -> RealTimeMatchEvent | Captures ball location, score, actor IDs, possession copy/zones/quality; action and boundary functions call it |
| `commitSnapshot`, `:679` | event array -> MatchSlice | Appends events/history, registers added time, applies deferred phase transitions; start/tick call it |
| `snapshot`, `:3052` | events -> snapshot | Copies ball, 22 player states, possession and tactical targets; commitSnapshot calls it |
| `applyTacticalChange`, `:598` | side, partial tactics, reason -> event | Updates base/effective tactics and targets; appends control event directly to engine.events, not a tick snapshot; runMatch calls at 3600s |
| `drain`, inside runMatch | engine history -> validated canonical events and source audit | Filters control events before indexing, normalizes coordinates, validates with Zod, clears snapshot history unless retaining for benchmark |
| `serialize`, simulation.ts | canonical events -> newline-terminated JSONL | Stable object construction/order, no dates or wall-clock metrics in event bytes |
| `metrics`, metrics.ts | ordered events, [start,end) -> counts/means | Reads only observed events; no truth file access |

Line references are navigation aids; source and function names are authoritative. No engine implementation was modified.

## Types and algorithms from zero

A `Player` is a roster record. `SimulatedPlayer` wraps it with evolving position, role, stamina and intent. A `PlayerIntent` is what the player plans to do; an `ActiveBallAction` tracks an in-flight pass/shot. A `RealTimeMatchEvent` records an observation after an action. `MatchSnapshot` records the entire scene, even on ticks with no events. `MatchSlice` returns current mutable state, events and the copied snapshot.

`Partial<Tactics>` means the caller can change a subset of settings. The engine merges that subset with base settings, then clamps numeric tactical values to 0–100. Changing only `style` does not necessarily replace all existing merged numeric values with that style's presets: supply the numeric policy explicitly.

Park–Miller updates `state = state * 16807 mod 2147483647`. With the validated seed range these integer products are safe JavaScript integers. Each run gets its own closure. This makes random draws reproducible; diverging policies consume draws differently, so after intervention the same draw number need not describe the same action. These are paired initial conditions, not identical post-intervention random trajectories.

The simulation is a rule/probability engine, not a learned model of Premier League football. It chooses actions from tactical/attribute/geometry rules and random draws, moves objects, then resolves outcomes. Pass attempts are separate from receptions; a pass event is not proof of completion. Shot quality is an internal simulator heuristic, not calibrated real-world xG.

## Concrete trace

The actual event example and original projection are embedded in `simulator-audit.md`. To follow it:

1. `npm run experiment` executes `experiment.ts` top level, calls `runMatch({seed:11,...})`.
2. `createTeam()` -> `new Player(...)` -> `new Team(...)` -> `new RealTimeEngine(...)`.
3. `engine.start()` sets the initial carrier. `engine.tick()` calls the functions above every 0.25 seconds.
4. A carrier's pass intent reaches `resolveBallAction()` -> `startPass()`. Later ticks reach `detectEvents()` -> `detectPassOutcome()` and may emit `receive` or `interception`.
5. `registerTouch()` changes possession when a different side touches the ball. `createEvent()` copies the current possession and ball position. `commitSnapshot()` appends it to `engine.events`.
6. Our `drain()` sees that event, assigns a contiguous analytic source index, maps home/away to NORTH/SOUTH, and rotates second-half coordinates when needed. `eventSchema.parse()` validates the projected object.
7. `serialize()` writes one canonical object per line into `output/seed-11-baseline.jsonl`. `output/audit/seed-11-baseline.source.jsonl` preserves the corresponding non-control source projection, excluding cyclic Team/Player objects. Actor IDs join to roster.json.
8. At 3600s, runMatch calls `applyTacticalChange('home', changes, ...)` before the next tick. Only the separate ground-truth file records that policy. Even source-index gaps are removed so the canonical stream cannot trivially reveal control events.
9. `metrics()` compares fixed windows; experiment.ts writes results and hashes. No detector or Microsoft agent is implemented here.

Future Python path: `for line in file: event = CanonicalEvent.model_validate_json(line)` using a matching Pydantic model, then update rolling aggregates and detectors in timestamp/sequence order. This is the proposed boundary, not an implemented backend. Replay schedules events using differences in `time_seconds`; ties use `sequence`. Keep truth and source audit files out of the inference process entirely.
