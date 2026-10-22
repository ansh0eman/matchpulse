# Preregistered Step 2.5 protocol

Authoritative machine-readable record: protocol.json; decisions.jsonl is append-only. Initial registration preceded generation. Research base commit: 0e9bce8; source engine pin: 39529b19c40868d66aa47db084ebc9ea29c86e70. Step 1/2 data are now exploratory only.

## Partitions and scenarios

80 independent fresh families, seed=700001+104729*i. Development i=0..23 (24 families); validation i=24..39 (16); untouched final holdout i=40..79 (40). All seven scenarios per family stay together. No seed is selected for detector success. The exclusion test checks exact prior seed sets.

Scenarios: unchanged, strong bundle, moderate bundle, press-only, tempo-only, three-minute strong pulse with restoration, and supported low-block bundle. Target team alternates by family parity; home/away attributes vary by +/-1. Onset cycles 3300/3600/3900/4200 cumulative seconds. The primary external-intervention target includes strong/moderate/press-only/low-block plus null matches. Tempo/pulse are stress cases, not falsely labeled 'no statistical change.' Per-scenario performance must be reported, even if it is poor.

Strong and moderate use the existing Step 2 bundles. Press-only changes press50->90. Low block sets style low_block, press25, line25, tempo45, compactness65, defensive mentality. Target direction is advance for press-family scenarios and retreat for low block. These are policy bundles, not isolated causal manipulations. Matched seeds ensure identical prefixes; later RNG draw consumption can diverge.

## Phase 1: establish observability

At 1Hz, extract only allowlisted positions, score, phase, clock and ownership. Never store hidden intents/targets in detector inputs. For each new development family/scenario, compare context-matched five-minute pre/post windows, plus a secondary ten-minute view where feasible. Paired null differences, null variability, distribution overlap/rank AUC, support, correlations and bootstrap intervals use families as the statistical unit. Unsupported/sparse cases remain counted and reported, not fabricated as zero-effect observations.

A first four-family pilot audits schema/cadence/ownership and performance; it is development data, not independent validation. It identified stale owner references; source behavior is preserved, explicit quality flags exclude them from carrier features. This schema refinement and preserved pilot archive are recorded. Full development separation must be reviewed before training/selecting a more complex detector. AUC of four pilot families is not a model validation result.

1Hz versus 2Hz is compared on the first four development families; integer-second subsets must be identical and event hashes unchanged. Higher sampling frequency is not assumed to create independent observations or better accuracy.

## Phase 2: bounded detector comparison

Preserve the Step 2 event baseline unchanged. Compare original tracking-only and context-conditioned tracking pipelines, a fused event confirmation option, and one sequential alternative. Use a small supervised ablation only if development separation shows useful signal; its training data must consist of a few fixed examples per match/family rather than millions of overlapping rows. Learned scaling/weights are fit on development only. Validation selects candidates; final holdout selects nothing.

Candidate specifications are appended to decisions.jsonl after separation and before validation scoring. Freeze selected parameters, any fitted model, feature definitions, source hashes and protocol hash before opening holdout feature/score results. No holdout retuning; any repair requires a new untouched test set. Primary update cadence is 30s, with 60s ablation. Repeated checks and persistence are dependent, not independent statistical tests.

## Objectives and matching

A: match external intervention onset/team/direction. First matching alert in [onset,onset+horizon], one-to-one; extra, wrong-team/direction, early and late alerts are unmatched. Report 600s (primary) and 1200s (secondary) horizons separately, never substitute the more permissive metric. Cooldowns must not be used to hide missed targets or wrong-team activity. Full-match precision includes all primary-scenario alerts, not only the target interval.

B: describe observable shape/proximity changes. Numerical facts are verified from raw positions and complementary measures. No B classification precision/recall is reported without independently labeled episodes; detector-threshold truth would be circular. A coaching decision can be undetectable and a real observed pattern can occur without a scripted decision.

Targets: precision>=.75, recall>=.70, median matched delay<=480s, <=.25 alerts per null match, 100% evidence validity and deterministic replay, no observed prefix leakage violations. These are aspirations, not grounds for changing denominators or ignoring adverse scenarios.

Uncertainty: whole-family percentile bootstrap, keeping correlated scenarios together. Misses, duplicates, early/wrong-team alerts, null alerts per match and per actual 90-minute clock exposure, method runtime and evidence integrity are explicit. Calibration scores, if any, apply only to the labeled fixed-window ML task and do not turn a raw model score into a calibrated broadcast probability.

## Data and publishing

New large data is local/ignored for this milestone, overriding the earlier blanket push-all instruction for newly generated Step 2.5 data. Previously committed data/history is preserved. Small fixtures, selected observable frame samples, summaries, protocol, source fingerprints, tests and scripts remain reviewable. No Foundry calls or implementation, UI, cloud infrastructure or publication occurs during the research experiment.
