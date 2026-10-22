# Observable tracking audit

Engine: MIT source commit `39529b19c40868d66aa47db084ebc9ea29c86e70`; research base `0e9bce8`. The separate upstream checkout and THIRD_PARTY_NOTICES.md are preserved. No competitor application code or npm replacement is introduced.

## Source execution trace

`upstream/football-simulator/RealTimeEngine.ts:639` (`tick`) advances the clock, handles time boundaries/restarts, updates endogenous tactics and formation targets, decides intents, resolves ball actions, moves players/ball and detects events. `commitSnapshot` at line 679 appends events and materializes a snapshot before deferred restart state changes. Thus a sampled record is post-tick geometry with that tick's phase/score, not a prediction of the next tick. Several events may share its timestamp. Canonical events retain their own observed event positions; we never invent pass endpoints from a later player coordinate.

`applyTacticalChange` at line 598 changes base/current tactics and updates targets. It emits a control event. The canonical adapter filters that administrative event and assigns contiguous observable indices afterward. The tracking callback samples every integer second regardless of interventions. Neither the control event nor its source gap is supplied to analytics.

`updateTacticalState` adapts press/tempo/mentality to score, late match time, stamina and card/injury load. A null match therefore has endogenous changes. `updateTacticalTargetPositions` at line 1460 combines formation, defensive-line setting, possession, ball position and compactness. `formationSlots` includes `(defensiveLine-50)*0.16` metres. `movePlayersAndBall` at line 1934 moves toward hidden intent targets and follows the active ball owner. Press influences intent choice, coverage, tackles and fatigue; `pressureAround` at line 4138 also depends on distance and system terms. A parameter named press is not guaranteed to reduce measured carrier distance. The development experiment confirms that distinction.

`snapshot` at line 3052 exposes actual player x/y but also stamina, intent, target, active-pass target and other internal state. Only explicit projection fields in `poc/src/tracking/schema.ts::projectSnapshot` survive. It constructs new nested objects; it never spreads a snapshot. Intent/target/policy/possession-pattern internals are absent. A goalkeeper designation is retained as a roster fact; all other tactical roles are excluded.

## Roster, ownership and direction

Snapshots enumerate `state.players`. Dismissal removes a player at line 2186; substitution replaces the outgoing slot with a new player ID at line 2327. We retain observed IDs and changing active counts. Feature contexts include both outfield counts, and fewer than seven outfielders on either side produces no eligible feature. Synthetic tests exercise removal/replacement; actual cohort counts are in verification.json. This does not simulate every possible professional roster rule.

NORTH attacks increasing x in period 1, decreasing x in period 2; SOUTH reverses it. `attack_point` rotates both axes using `(105-x,68-y)` when needed. Period comes from the snapshot; no fixed 45-minute boundary is guessed. Window and detector state reset at observed period transitions. Ended maps to period 2 with full_time phase, which is ineligible for geometry.

A discovered upstream defect leaves occasional owner IDs absent from the active snapshot roster. We preserve that ID with `owner_status=inactive_reference`; it is excluded from carrier features. We do not repair upstream state or substitute the nearest player. Development: 256 such frames / 939,638 frames, with zero sampling gaps. The aborted earlier owner-strict pilot is archived locally; the refinement is documented in decisions.jsonl.

## Cadence and non-regression

1Hz is an engineering operating point, not a proven optimal frequency. The first four development families have 1Hz and 2Hz runs of all seven scenarios. Integer-second geometry and canonical hashes agree in all 28 pairs, and raw/cached replay comparisons agree exactly. Alert schedules differ at the two frequencies; diagnostics.json reports both unchanged frame-count minima and doubled 2Hz minima to preserve minimum exposure approximately. Sub-second trajectories and timing of possession changes are lost at 1Hz; extra samples are correlated and are not new independent matches. No 2Hz holdout tuning occurs.

`poc/tests/tracking.test.ts` checks a complete seed-11 event hash against the existing Step 1 event artifact with extraction on/off, plus scheduled 1Hz/2Hz equality and strict hidden-field rejection. All ten TypeScript tests pass. Instrumentation reads snapshots without RNG draws or engine mutations. That is tested parity for the executed cases, not a formal proof for every engine execution.

## Data layout

`data/step25/inference/<UUID>.jsonl` is the canonical observation feed; `<UUID>.tracking.jsonl.gz` is the observable sampled feed. Labels, seeds, scenarios, intervention times and source hashes live separately in evaluation manifests used only by research scripts. CLI identities must be UUID filenames. Large new data/cache/exports are ignored; small examples and calculation-reference excerpts are retained in fixtures. Old tracked experiments remain intact.
