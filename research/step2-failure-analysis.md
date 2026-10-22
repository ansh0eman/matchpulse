# Failure analysis and repair decision

## Observed failure, not an integration issue

The chosen detector has 202 unmatched alerts across the 96 primary holdout matches and misses 33/64 external interventions. 101 primary alerts concern SOUTH, which has no injected target label; 90 alerts occur before an eligible match's onset. These counts overlap and must not be summed into a new total. Both show why time-coincident target detection is much harder than producing a convincing isolated evidence example.

The matched null counterparts produced a NORTH alert in the same planned 600s target horizon in 4/32 families. That is a diagnostic coincidence rate, not an intervention recall metric. Matching a time window alone does not prove that the external action caused an alert. Paired deterministic prefixes help expose this issue but post-change RNG trajectories diverge.

Step 1's +13 high recoveries was measured over 30-minute windows, after exploratory policy selection. Detecting a smaller local shift within <=8 minutes faces much higher noise. Rolling location/share changes are correlated and ordinary match cycles often satisfy their guards. Low false-alarm ADWIN is silent in these settings; sensitivity cannot be inferred from zero false positives. Page-Hinkley does not solve the precision problem in this grid.

## Concrete cases

| Case | Seed / opaque ID | Result |
|---|---|---|
| First strong-bundle misses by seed | 198984 / 2e431871-ee5f-44bd-ab8f-98a1ca3f9352 | onset 3600s, 1 unmatched alerts, no match within 600s |
| First strong-bundle misses by seed | 246498 / d9a0b385-0423-4a74-a859-d4b888c4cc5d | onset 4200s, 4 unmatched alerts, no match within 600s |
| First strong-bundle misses by seed | 254417 / 5e8b0630-f97b-4b8a-a365-eafe0b8d06e6 | onset 3300s, 2 unmatched alerts, no match within 600s |
| Largest unchanged alert counts, tie by seed | 333607 / 1f8bbfa1-a661-4d43-a7d8-1d87d612ac1e | 5 alerts |
| Largest unchanged alert counts, tie by seed | 396959 / f36909ed-04e0-4b4a-a1b2-61c21710249c | 5 alerts |
| Largest unchanged alert counts, tie by seed | 214822 / 59350225-0687-4842-af08-07512f423af9 | 4 alerts |

All are retained in per-match-results.csv and detailed local holdout.json. Misses are the first three strong-bundle failures by seed; unchanged examples are chosen by alert count with deterministic seed tie-break, not to imply they represent every match.

## Robustness strata (descriptive)

| Condition | Eligible onsets | Matched | Recall |
|---|---:|---:|---:|
| onset 3300s | 16 | 8 | 0.500 |
| onset 3600s | 16 | 4 | 0.250 |
| onset 3900s | 16 | 12 | 0.750 |
| onset 4200s | 16 | 7 | 0.438 |
| home trailing at onset | 16 | 9 | 0.562 |
| home level at onset | 40 | 16 | 0.400 |
| home leading at onset | 8 | 6 | 0.750 |

Onset groups and score groups are overlapping views of the same 64 eligible interventions. Small strata are not independent causal comparisons. Roster strengths vary by predeclared +/-1 offsets; no manually seeded score state or professional-football calibration was introduced. Moderate-bundle recall is lower than strong-bundle recall (see scenario table), but neither is adequate.

## Evidence can be correct while a detector is wrong for its target

Every emitted pack accurately describes its windows. That verifies the facts, not why those windows changed. A null match still has endogenous tactics, possession cycles, fatigue, score effects and stochastic events. Labeling every unmatched alert 'false' is conservative for the external-control target and does not prove there was no football-statistical change. Conversely, changing the target to 'any interesting swing' now would require new labels/validation, not relabeling false positives as successes.

The current system covers upward spatial recovery shifts, not all tactical changes. Successful tackle/recovery event semantics, ball-at-event coordinates, incomplete observed final-third boundaries and uniform synthetic players limit possible interpretations. True coach intent, causal goal attribution and real-match prediction are unsupported.

## Bounded next repair milestone

1. Use development data to estimate whether short-horizon action-level signals separate externally changed and unchanged continuations after controlling for exposure/period/score. Inspect paired null coincidence and effect distributions, not only hand-picked matched plots.
2. Compare a better-supported statistic (for example, explicitly modeled recovery opportunities or validated additional event features) against the current baseline. Any new conditioning or threshold must be developed transparently, not chosen from this final holdout.
3. If the simulator cannot support a reliable short-horizon external-control target, define a narrower observation-based product claim and independently label/evaluate it, or replace the generator with a documented stochastic scenario model. Do not make the generator deterministically announce the detector's exact target feature.
4. Reserve new seed families before further tuning. Retain the existing inference/evidence/CLI contract and tests. Move to Foundry only after a newly frozen detector clears the agreed precision/recall/null-rate targets on untouched data.

Do not repair this with eloquent AI narration, a fixed minute threshold, hidden labels, a cherry-picked demo or silently extended matching horizons. No detector changes were made after this holdout.
