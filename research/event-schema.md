# Canonical event contract v1

Implemented in `poc/src/schema.ts` with Zod 4. `CanonicalEvent` is inferred using `z.infer<typeof eventSchema>`: the compile-time interface and runtime validator cannot drift independently. It is a TypeScript structural object type, equivalent to an interface. The adapter is `drain()` inside `poc/src/simulation.ts`.

| Field | Meaning / constraints |
|---|---|
| schema_version | Literal 1 |
| id, sequence | evt_ + zero-padded ordinal; contiguous nonnegative sequence; unique within one run/file |
| time_seconds | Finite nonnegative cumulative match-clock seconds including added time; not wall time |
| period | 1 or 2, captured at extraction, not inferred from 2700 seconds; halftime boundary events use engine's period 2, fulltime uses 2 |
| team_id | NORTH for home, SOUTH for away, or null; source teamSide, not possession-side inference |
| player_id / secondary_player_id | Simulator stable player IDs, nullable; roster includes starters and generated fictional bench |
| type | Exact football/control-boundary types enumerated in schema.ts; tactical_change and role_change excluded |
| position_m | Ball location when source event is created; fixed 105m x 68m pitch axes, origin at one corner |
| attacking_position_m | Team-relative coordinates: attack toward increasing x; when reversed rotate both x=105-x and y=68-y; null if no event side |
| outcome | Exact source string or null; no fabricated success/failure labels |
| possession_id / possession_team_id | Source possession context; pos_0 may represent no established possession; source side nullable |
| score | Nonnegative integer home/away counts copied at event time |
| evidence.source_index | Contiguous index into the matching audit/*.source.jsonl, after filtering administrative tactical/role changes; not original engine.events offset |
| evidence.field_zones / attack_pattern | Unmodified simulator categorical hints; possible future feature inputs, not independently verified real-world annotations |
| evidence.chance_quality | Nullable finite internal heuristic; not calibrated xG |
| evidence.possession_final_third_entries | Nonnegative cumulative source count for the possession, used as observed increments |

All objects reject extra keys. No NaN/Infinity; timestamps must be nonnegative. IDs/order/roster membership and score consistency receive cross-record tests beyond the field validator. Coordinates are finite but deliberately not constrained to pitch bounds: out-of-play ball locations are valid evidence. Unknown outcomes remain null, and no generic pass event is mislabeled completed. There is no pass destination in the source event interface; downstream analytics must not infer exact completed pass vectors from pass origin alone.

Serialization is UTF-8 newline-delimited JSON with one final newline; object keys are constructed in fixed order. Event files contain no generation runtime/date, machine identifiers, policy names or truth markers. The run identity is the filename, not a globally unique event ID. Future ingestion must namespace IDs with its match/run ID. That change belongs to the next schema milestone.

Source audit projections retain the source metadata (including possession state) but remove Team/Player object references to avoid duplication/cycles. Stable actor identifiers are preserved. The production inference loader must accept only canonical event files, never the source audit directory, results.json, hashes, filenames encoding interventions or ground-truth.json.

A recovery action can be a recovery of the same team's loose ball. It is not automatically a turnover. A high recovery action means recovery/interception/tackle with attack-relative x >=70m. Exact player trajectories and true continuous possession-time shares are not preserved by this compact contract. Observed final-third counts come from event-time cumulative observations and can miss a transition with no subsequent event before a window ends. Possession sequence counts are observed distinct IDs, not complete exact duration estimates.
