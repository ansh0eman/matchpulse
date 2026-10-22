# Tactical intervention experiment

## Design

Measured on 2026-10-22 using the pinned source, Node v24.19.0, darwin arm64. Both scenarios use seeds 11, 29, 47, 83, 101, 137, 173, 211, 257, 307, 353, 401. Fictional identical-strength teams have explicit attributes 12/20, balanced base tactics, formation 4-4-2 and 0.25-second ticks. Each mode has 12 baseline + 12 intervention matches and one identical-seed repeat. Baselines are repeated across modes, not independent extra samples.

At cumulative match-clock 3600 seconds, intervention changes North's base policy before the next tick. Equal windows are pre [1800,3600), post [3600,5400); added time after 5400 is excluded from window comparisons. Halftime may fall in the pre window because the engine includes first-half added time. Both paired runs are identical through the change time, so halftime and pre-window confounds are shared up to that point.

Baseline means unchanged base settings; engine adaptive score/fatigue/card/injury responses remain active. Matched seeds give identical initial conditions and exact prefixes. Divergent policies consume RNG draws differently after the change; they do not preserve action-level common randomness. No branching save/restore API was used.

Truth is exported separately in ground-truth.json. No detector exists yet. Canonical and source-audit analytic streams exclude tactical_change/role_change records **before** indexing. No gaps reveal control events. Do not expose truth, results, source-audit directories or scenario filenames to future inference.

## Metric definitions

All statistics below are North observations. Recovery actions = recovery/interception/tackle events; same-team loose-ball recoveries are included, so these are not all turnovers. High recovery actions = those actions at attack-relative x >=70m. Advanced defensive actions = challenge/tackle/interception at x >=70m; attempts and successful tackles can both be counted. Shots count shot events, not goals or xG. Observed final-third entries sum increases in event-time possession counters. Possession sequences count distinct observed North possession IDs. Mean recovery x averages attack-relative coordinates of recovery actions (null if no actions).

Event-time final-third counters can miss an unobserved crossing near a window end. These are reproducible proxies rather than complete tracking metrics. The adapter retains exact positions and source metadata for audit. Metrics are computed by metrics.ts without reading ground truth.

## Experiment 1 — press parameter only

Change `{press: 50}` to `{press: 90}`; all other base settings stay the same.

| North metric | Mean paired post difference | Paired SD | Descriptive normal 95% interval | Positive pairs |
|---|---:|---:|---|---:|
| recovery_actions | 1.250 | 9.873 | [-4.336, 6.836] | 4/12 |
| high_recovery_actions | 2.417 | 12.795 | [-4.823, 9.656] | 7/12 |
| advanced_defensive_actions | 1.500 | 37.915 | [-19.952, 22.952] | 6/12 |
| observed_final_third_entries | 3.083 | 14.145 | [-4.920, 11.087] | 6/12 |
| shots | 0.917 | 1.832 | [-0.120, 1.953] | 8/12 |
| possession_sequences | -0.500 | 8.491 | [-5.304, 4.304] | 7/12 |
| mean_recovery_x_m | 0.466 | 8.002 | [-4.062, 4.993] | 7/12 |

Press-only intervention changes trajectories, but recovery and progression results vary too widely to claim a reliable spatial pressing signal. Its uncertainty intervals span zero. This does not prove that the parameter has no effect; it means this test is insufficient as the sole tactical-detection scenario.

## Experiment 2 — bundled high-press strategy

Exploratory follow-up after seeing experiment 1: `{style:'high_press', press:90, defensiveLine:85, tempo:65, compactness:45, mentality:'attacking'}`. Formation, width and focus remain at their balanced initial values. Baseline values are press=50, line=50, tempo=50, compactness=50, mentality=balanced, style=balanced.

| North metric | Mean paired post difference | Paired SD | Descriptive normal 95% interval | Positive pairs |
|---|---:|---:|---|---:|
| recovery_actions | -3.833 | 18.379 | [-14.232, 6.566] | 4/12 |
| high_recovery_actions | 13.000 | 13.218 | [5.521, 20.479] | 11/12 |
| advanced_defensive_actions | 47.333 | 35.328 | [27.345, 67.322] | 11/12 |
| observed_final_third_entries | 20.083 | 15.084 | [11.549, 28.618] | 11/12 |
| shots | 1.250 | 1.545 | [0.376, 2.124] | 6/12 |
| possession_sequences | -8.333 | 9.306 | [-13.599, -3.068] | 3/12 |
| mean_recovery_x_m | 8.957 | 7.667 | [4.619, 13.295] | 10/12 |

Spatial recovery and advanced defensive action shifts are large enough to justify a detector feasibility milestone. High recovery actions increase in 11/12 pairs and average recovery position moves forward by about 9m. However, total recovery action count does not consistently increase; the primary signal is **where** play occurs. The intervention changes multiple mechanisms; do not attribute this result to press alone. Shot count improvements are sparse and should not be the main detection signal.

The second policy was selected after inspecting results and reused the same seeds. Its intervals are descriptive, not confirmatory evidence. The table uses mean ±1.96*sample-SD/sqrt(12), not a bootstrap, randomization test, causal estimate, multiplicity adjustment or guaranteed population confidence interval. There are only 12 independent seed pairs per policy. No claim of generalization beyond these seeds, realism, statistical significance or detector accuracy is established.

## Verification and recommendation

Both modes have byte-identical baseline/repeat hashes and differing tested seeds. Full pre-intervention event prefixes and pre-window statistics match within every pair. Artifact tests validate all 48 exported scenario runs and source joins; seed-11 repeat files are additionally compared byte-for-byte. Full engine histories and drained-snapshot histories yield identical events in the tested equivalence seed.

Use the bundled policy for a clearly labeled synthetic scenario. Before a demo claims detection quality, evaluate a causal detector on new seeds, multiple change times and unchanged null matches. Report false positives and detection delay; avoid a fixed minute-60 heuristic. Isolate truth physically from inference and supply opaque match identities. Do not implement counterfactual policy comparisons yet.

Raw evidence: `../poc/output/results.json`, `../poc/output/bundle/results.json`, both ground-truth.json files, individual JSONL files, `audit/` source projections, and test logs. Configuration and per-seed differences are saved, including negative pairs. This report does not replace those records.
