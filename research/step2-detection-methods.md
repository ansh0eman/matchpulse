# Step 2 detection-method research

Initial recommendation (before development scoring): compare a causal two-window spatial-recovery baseline with River Page-Hinkley and ADWIN on the same minute observations. No winner is selected in this document. Final selection is in step2-detector-comparison.md.

| Method | Assumptions, cost and sparse-event behavior | Decision before experiments |
|---|---|---|
| Two adjacent windows | Fixed exposure makes rates comparable. O(events in retained windows) for this small implementation. Larger windows improve support but delay detection. Require minimum recovery samples, absolute effect floors, persistence and cooldown; overlapping comparisons are dependent, so scores are not significance tests. | Mandatory interpretable baseline |
| Page-Hinkley / CUSUM | Processes scalar observations with an incremental mean and cumulative deviations; constant scalar state. Warm-up, tolerance, forgetting and threshold determine sensitivity. Correlated rolling inputs violate simple independent-observation interpretations. | Implement River alternative; compare on fixed nonoverlapping minute inputs with supporting rolling evidence |
| ADWIN | Variable historical reference using compressed buckets and mean comparisons. Bucket storage grows logarithmically with retained history; update/check cost depends on bucket count. Sparse/correlated minute values may be slow or noisy. Its delta is not a calibrated football-alert probability. | Small third comparison if available without additional runtime dependency |
| Multivariate composite | A few transparent, scaled spatial changes can combine recovery location and high share. Those features are correlated; averaging does not create independent confirmation. An effect floor makes scores interpretable. More features require ablation. | Compare two spatial features and ablations; no neural model |
| PELT / binary segmentation | Retrospective partitioning minimizes segment loss plus penalties; pruning can reduce PELT cost under appropriate conditions. Whole-series results may use future evidence and endpoints can change as data grows. | Research only; not live inference, no extra installed package |

## Sources and exact implementation checks

[River PageHinkley API](https://riverml.xyz/latest/api/drift/PageHinkley/) documents scalar update, min_instances, delta, threshold, alpha and up/down/both modes. [Implementation](https://github.com/online-ml/river/blob/main/river/drift/page_hinkley.py) maintains running mean, fading sums and extrema; the next update resets after drift. Defaults (30 samples, threshold 50) are not accepted without tuning to observation units. We inspect the installed pinned 0.22.0 implementation and constructor before using it; web main may differ.

[River ADWIN API](https://riverml.xyz/latest/api/drift/ADWIN/) describes adaptive subwindow mean comparisons, compressed ADWIN2 buckets, clock, grace_period and minimum subwindow support. Lower checking frequency can add delay. Its reference is Bifet and Gavaldà (2007), linked in that official documentation. We inspect the installed implementation/reset behavior rather than assuming a signal persists indefinitely.

[ruptures PELT documentation](https://centre-borelli.github.io/ruptures-docs/user-guide/detection/pelt/) explains penalized segmentation, candidate-grid jump/min_size and pruning. This does not make batch fit/predict causal. [The library overview](https://github.com/deepcharles/ruptures) explicitly provides offline change-point methods. No offline result is used as an online success metric.

## License and integration

River source [LICENSE](https://github.com/online-ml/river/blob/main/LICENSE) is BSD-3-Clause: retain copyright/conditions/disclaimer and do not imply endorsement. ruptures [LICENSE](https://github.com/deepcharles/ruptures/blob/master/LICENSE) is BSD-2-Clause. No implementation is copied from ruptures. River is pinned as an installed dependency, with installed notices retained and a separate dependency inventory. The rolling/composite implementation is original MatchPulse code. Python dependencies are locked with uv; numerical/reporting tooling is kept separate from inference architecture.

## Evaluation rules fixed before selection

56 new independent seed families: 24 development, 32 holdout. Five correlated scenarios per family remain together in the partition. Original 12 Step 1 seeds excluded. New seeds follow 1009+7919*i (i=0..55), never chosen from detector performance. Injection times cycle through 55/60/65/70 cumulative match minutes. Moderate bundle and roster strength ±1 add fixed variation. Tempo-only and a three-minute bundle pulse are ambiguous/negative stress cases, not proof of absent statistical change.

Match only NORTH upward alerts in [true onset, onset+600s], one-to-one; extra alerts, other teams and pre-onset alerts are unmatched. Report the unmatched rate on unchanged matches separately. Internal target: <=0.25 alerts per no-external-intervention match, with precision>=.75, recall>=.70 and median delay<=480s aspirations. These targets do not authorize holdout retuning. Explicit external intervention labels are a proxy target; endogenous score/fatigue responses can cause legitimate observed changes.

A bounded candidate grid will compare 5/8/10-minute windows and a small number of thresholds; development scores select one configuration, serialized and hashed before any final scoring. Holdout comparisons are diagnostics only and cannot change the selected winner. Failure to meet targets results in a conditional/no-go verdict.
