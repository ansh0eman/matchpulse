# Tracking and evidence contracts

The closed version-1 contract is defined independently by `poc/src/tracking/schema.ts::trackingFrameSchema` and `backend/src/matchpulse/tracking/schemas.py::TrackingFrame`. The generated JSON schema is in artifacts/tracking-json-schema.json. A frame has exactly these fields:

| Field | Meaning |
|---|---|
| schema_version, frame_id, sequence | Version 1; stable sample ID; increasing sample ordinal |
| time_seconds, period | Cumulative simulator seconds; observed period 1 or 2 |
| phase, score | Enumerated observed phase; nonnegative integer home/away score |
| ball.x/y, owner_id, owner_status | Pitch metres, observed ID or null; active/unowned/inactive_reference |
| players[].id/team_id/goalkeeper/x/y | Active roster, NORTH/SOUTH, goalkeeper flag and pitch metres |

Pitch axes are 105 by 68 metres before attack-relative normalization. Numbers must be finite; Python strict validation rejects boolean numerics and unknown keys at every level. Duplicate player/frame IDs and inconsistent owner quality are rejected. Ball coordinates may represent out-of-play locations; eligible features require an in-pitch ball. Timestamps/sequence must increase and period must not regress. Missing sample gaps may be represented, but no interpolation or fabricated continuity is introduced. This version's support minima are frame counts at its frozen 1Hz operating point; missing/opportunity-sparse windows may not produce a comparison.

Identity is supplied externally as an opaque UUID, not repeated as a scenario-bearing field. `load_frames` accepts only `<UUID>.tracking.jsonl.gz`, with matching MatchIdentity. Policy, role changes, hidden target/intent, RNG, scenario and intervention metadata have no schema slots. Precomputed features are generated from validated observations by research caching, not accepted as arbitrary CLI input. The production replay takes raw frames.

## Evidence v2

`tracking/evidence.py::PositionalEvidencePack` extends rather than replaces the existing Step 2 evidence engine. Fields include observed line-shift wording, direction, detector/configuration and non-probabilistic score semantics; explicit `(start,end]` windows; all 13 before/after/delta values; common contexts and support; complete selected frame IDs; representative frames; fused event facts and complete canonical event references; raw observable artifact resolver; definitions and limitations.

`verify_geometry` reconstructs eligible feature observations and context-weighted means from raw positions, checks all references/support/deltas, direction, statement and detection identity. `verify_events` reconstructs fused counters and reference IDs from canonical events through detection time. Sequential/model score integrity requires deterministic prefix replay as well as geometry checks. A pack alone cannot prove that its source artifact is complete; the research harness verifies manifest hashes and compares full raw inference against scoring. Fixtures contain every geometry calculation frame for the chosen examples and identify the full reproducible source hashes.

`compact_agent_facts` removes full tracking/event reference arrays, definitions and raw history. It retains numeric facts, support, representative IDs, observed wording and caveats; it is suitable for a later bounded agent prompt. Full source histories stay in deterministic evidence storage. Numerical recomputation does not validate an external intervention label or a causal explanation.
