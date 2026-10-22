# Walkthrough of an actual held-out event and detection

The example below is the first correctly time-matched strong-bundle alert in fixed holdout manifest order, not a representative accuracy claim. The same match can have unmatched alerts; CLI output shows them too. The overall verdict is NO-GO.

## Run it

After the setup/data-generation commands in README:

```sh
uv run --project backend matchpulse data/step2/inference/dc053576-202b-4d5c-ace7-2b5659f68e70.jsonl --debug --output backend/output/demo.json
```

This exact CLI path was executed successfully; verification.json and cli-demo.log record it. It needs no credentials, model, cloud service or frontend. Debug prints a transition only on an alert, not every event. Output includes all detections for the match and complete evidence JSON.

```text
Canonical JSONL
  -> cli.main / load_match
  -> validate_stream / CanonicalEvent
  -> replay / SignalState.update
  -> SignalState.observe / window_stats / changes
  -> RollingDetector.update
  -> build_evidence / EvidencePack
  -> CLI summary and JSON
```

## 1. Real input: validation before analytics

One actual recovery-related event used in the after window:

```json
{
  "schema_version": 1,
  "id": "evt_004042",
  "sequence": 4042,
  "time_seconds": 3335.5,
  "period": 2,
  "team_id": "NORTH",
  "player_id": "home-starter-1-2",
  "secondary_player_id": "away-starter-4-5",
  "type": "interception",
  "position_m": {
    "x": 74.7,
    "y": 55.0
  },
  "attacking_position_m": {
    "x": 30.299999999999997,
    "y": 13.0
  },
  "outcome": null,
  "possession_id": "pos_318",
  "possession_team_id": "NORTH",
  "score": {
    "home": 0,
    "away": 1
  },
  "evidence": {
    "source_index": 4042,
    "field_zones": [
      "defensive_third",
      "wide_left"
    ],
    "attack_pattern": "patient_buildup",
    "chance_quality": null,
    "possession_final_third_entries": 0
  }
}
```

`backend/src/matchpulse/cli.py:main` reads the selected label-free config and builds `MatchIdentity` from the opaque filename. `ingestion.py:load_match` opens only that UUID-named canonical JSONL and calls `validate_stream`. This generator uses `yield` to deliver one validated `CanonicalEvent` at a time. Pydantic's `Annotated` constraints, literal event type and `extra='forbid'` reject malformed values/hidden controls; the model validator checks attacking coordinates using team and period. `None` means unavailable, not zero. Integer sequence, unique ID, actor association and monotone clock/period/score checks preserve ordering and evidence identity. Out-of-play finite ball locations remain legal.

The ID `evt_004042` is only match-local. A reference is the pair `(dc053576-202b-4d5c-ace7-2b5659f68e70, evt_004042)`; it cannot resolve to a similarly named event in another match. A team-relative position is already canonical and is not re-flipped in signals.

## 2. Replay and causal state

`replay.py:replay` is called with events, opaque identity and config only. It constructs fresh NORTH/SOUTH detectors, a `SignalState`, and a prefix list. Before consuming an event with timestamp beyond the next minute boundary, it finalizes observations at that boundary from existing state. Tied-time events are all consumed before that clock tick is finalized. At prefix EOF it emits only completed boundaries <= the latest observed time. Appending future events cannot revise earlier windows or references; this was checked on all 160 holdout matches plus adversarial unit fixtures.

`signals.py:SignalState.update` appends an immutable `Contribution` dataclass. For this event, membership in recovery/interception/tackle determines recovery support; a `(team,possession,time,actor)` key avoids duplicate related action records. The x location contributes to that team's mean and high-share threshold x>=70m. Other event types can contribute episode, entry or tempo diagnostics. The full prefix updates possession counters so later windows count only newly observed final-third increments. A `deque` prunes old window contributions, while the evidence prefix remains available for audit.

`SignalState.observe` builds adjacent windows with `(start,end]` boundaries. Here they are **(2820,3300]** and **(3300,3780]** seconds. It calls `window_stats` independently for each team. No future/full-match mean is used. Half-time resets the positional history and requires two complete windows in the new period before an alert is eligible.

## 3. Actual deterministic facts

Before: 35 recovery actions, 4 high, mean x=35.081714m, high share=0.114286. After: 32 actions, 16 high, mean x=61.369375m, high share=0.500000. Each window has 480s exposure. High recovery rates are 0.500 and 2.000/minute. These are recovery actions, not necessarily turnovers or successful presses.

The complete worked calculation used by `signals.py:changes` and `RollingDetector.gate`:

```text
location delta = 61.369375 - 35.081714 = 26.287661 metres
location z = delta / (sqrt(553.838291/35 + 401.033090/32) + 2) = 3.588731
share delta = 16/32 - 4/35 = 0.385714
pooled p = (4+16)/(35+32)
share z = share delta / sqrt(pooled_p*(1-pooled_p)*(1/35+1/32) + .0025) = 3.146550
score = .6*3.588731 + .4*3.146550 = 3.411859
```

`RollingDetector.update` also requires minimum samples, mean shift>=6m, share shift>=.08, score>=2, two consecutive checks and cooldown. At the previous minute (3720s), score was 3.568218; at 3780s it was 3.411859. Persistence plus cooldown suppress some fluctuations; they demonstrably do not suppress enough ordinary-match alerts. The score is an effect-strength heuristic, not probability or statistical significance. The two spatial components are correlated.

## 4. Detection to evidence

The actual detection is `turn_f630f31c44344b62`, NORTH, emitted at **3780s**. `evidence.py:build_evidence` hashes opaque match/team/time/config into the deterministic detection ID, copies exact window facts and adds units, definitions and confounding/sparse-data warnings. It includes **4600 complete calculation references**, all from the causal prefix, and a separate illustrative list: `evt_004042, evt_004055, evt_004058, evt_004063, evt_004096`. Examples alone do not prove a count: complete dependencies include events before the displayed windows when needed for episode/cumulative counters.

`verify_evidence` resolves every reference to the canonical prefix, rebuilds SignalState, recalculates facts and the score, verifies exact window semantics/definitions, and checks no future references. It does not trust numbers merely because they were generated by the detector. Unit tests also calculate toy-window counts/means independently and deliberately tamper with counts, scores, references and definitions. All 417 holdout packs passed real recomputation.

`cli.py:main` prints these computed facts, not the hidden policy. All alerts (including unmatched ones) are displayed and exported. Later Python API/agents can consume this Pydantic contract without needing TypeScript state or simulator classes.

## 5. Evaluation is a separate caller

Only `backend/scripts/evaluate.py` reads the scenario manifest. It gives canonical events/identity/config to inference; afterwards `evaluation.py:match_alerts` compares emitted clocks with separate truth. For this example the evaluation-only onset is **3300s**, so this alert has **480s** delay under the frozen 600s horizon. That timestamp and policy are absent from the inference interface and EvidencePack.

The development split selected the method; config/source hashes were sealed before holdout scoring. Every correlated seed family stays in one partition. Scenario metadata is used for plots and metrics only. The 160 held-out matches and all failures remain in result artifacts. This one correct example does not change the overall 13.3% precision and 48.4% recall.

## What the next application would own

A future service could stream the same canonical model into replay, persist packs, then pass verified fact keys and evidence references to Foundry. No service, agent or UI exists in this milestone. Current next work is detector/target repair with a new untouched validation set; integration should wait for reliable alert quality.
