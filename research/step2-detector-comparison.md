# Detector comparison — NO-GO for Foundry integration

The selected **research candidate** is the original causal rolling spatial-recovery detector, chosen from development results before holdout scoring. It is the best active configuration in this bounded grid, not a reliable production detector. No active method met the false-alarm target. Its held-out precision/recall are 13.3%/48.4%.

## Selection and exact configuration

20 configurations: nine rolling (W=300/480/600s x threshold=1/1.5/2); six Page-Hinkley (W=480, spatial threshold=1/1.5 x lambda=.2/.4/.8); three ADWIN (W=480, spatial threshold=1, delta=.01/.05/.2); two ablations (W=480, threshold=1.5, location-only/share-only). All configurations are in development-summary.json. There was no unbounded search and no additional candidate after holdout.

Shared guards: >=8 recovery actions in each window; minimum mean-location increase 6m and high-share increase .08 for the combined method; two consecutive minute checks; 900s same-team cooldown; windows must lie inside the current period. Separate team/match state. Alerts describe upward observed spatial changes only; this is not a general taxonomy of tactical changes.

Frozen selected config:

```json
{
  "method": "rolling",
  "version": "1",
  "window_seconds": 480,
  "threshold": 2.0,
  "min_recoveries": 8,
  "location_floor_m": 6.0,
  "share_floor": 0.08,
  "persistence": 2,
  "cooldown_seconds": 900,
  "features": "both",
  "stream_threshold": 0.4,
  "adwin_delta": 0.05
}
```

Composite score = .6*z_location + .4*z_high_share. Location denominator is sqrt(v_before/n_before+v_after/n_after)+2m. High-share denominator is sqrt(pooled_p*(1-pooled_p)*(1/n_before+1/n_after)+.0025). Floors regularize small/noisy samples; the features are correlated and the score is neither a p-value nor probability. Persistence smooths fluctuations but overlapping windows are not independent votes.

River alternatives use nonoverlapping minute observations with scalar .6*clipped(mean_x/105)+.4*high_share when recovery samples exist. Page-Hinkley min_instances=8, delta=.005, alpha=.99, mode=up; ADWIN clock=1, min_window_length=5, grace_period=10, default max_buckets=5. A River drift opens a 180s eligibility interval; the same spatial/support/persistence guards are still required. Each period resets its River instance. Thus these are guarded River pipelines, not claims about the best possible configuration of either algorithm.

The initial null-target-first selection preferred completely silent ADWIN. Before any holdout scoring, selection was corrected to require an active candidate with at least one development true detection; the null-rate target then takes priority, followed by F1, precision and lower median delay. No active candidate met that null target, so best active F1 was retained as a diagnostic research candidate. selection-audit.json preserves this development-only correction. A silent model cannot be a successful detector. Frozen SHA-256: `cb8848b5bfca606b88abe27b8b42e35650cc6f0acafbe5719e49741e16ea9812`; source/config hashes were checked on holdout entry.

## Development: 24 seed families, 120 matches

Primary scoring uses 72 null/bundle/moderate matches with 48 eligible interventions; 48 tempo/pulse stress cases are reported separately. Both teams' alerts count against external-target precision. Every family stays on one side of the split.

| Method / features | W seconds / score threshold / stream setting | Precision | Recall | F1 | Null alerts/match | Median delay s | Detector ms/match |
|---|---|---:|---:|---:|---:|---:|---:|
| rolling / both | 480 / 2.0 / — | 14.2% | 41.7% | 0.212 | 2.083 | 480 | 0.086 |
| page_hinkley / both | 480 / 1.5 / PH lambda=0.8 | 13.9% | 31.2% | 0.192 | 1.708 | 480 | 0.165 |
| adwin / both | 480 / 1.0 / ADWIN delta=0.01 | undefined | 0.0% | 0.000 | 0.000 | undefined (no emitted positives) | 0.714 |

Ablations (same W=480 and threshold=1.5; limited development-only comparison):

| Method / features | W seconds / score threshold / stream setting | Precision | Recall | F1 | Null alerts/match | Median delay s | Detector ms/match |
|---|---|---:|---:|---:|---:|---:|---:|
| rolling / location | 480 / 1.5 / — | 11.4% | 52.1% | 0.187 | 3.208 | 480 | 0.085 |
| rolling / share | 480 / 1.5 / — | 8.8% | 43.8% | 0.147 | 3.667 | 420 | 0.085 |

Location-only did not solve false alarms. The limited ablation does not establish that both features are independently necessary, nor that an untested location-only threshold could not be better. We retained the highest-F1 active configuration actually measured, not an exhaustive optimum.

## Independent holdout: 32 seed families, 160 matches

The frozen family finalists below are diagnostics. The selected winner was not changed based on this table.

| Method / features | W seconds / score threshold / stream setting | Precision | Recall | F1 | Null alerts/match | Median delay s | Detector ms/match |
|---|---|---:|---:|---:|---:|---:|---:|
| rolling / both | 480 / 2.0 / — | 13.3% | 48.4% | 0.209 | 2.625 | 420 | 0.111 |
| page_hinkley / both | 480 / 1.5 / PH lambda=0.8 | 9.3% | 26.6% | 0.138 | 2.219 | 480 | 0.179 |
| adwin / both | 480 / 1.0 / ADWIN delta=0.01 | undefined | 0.0% | 0.000 | 0.000 | undefined (no emitted positives) | 0.729 |

ADWIN emitted no alerts in the tested settings: precision and delay are undefined; recall/F1=0. Page-Hinkley reduced activity relative to some rolling settings but lost sensitivity and did not improve the practical trade-off. The rolling method preserves clearer evidence, small dependency-free detector logic and the best measured active development F1, but fails the target badly. River remains a comparison dependency; production extraction could remove it if the future selected method no longer needs it.

## Runtime and statistical limits

Detector ms/match measures cached minute observations only, excluding canonical validation, feature extraction, EvidencePack creation and verification. Development feature extraction took 26.961s across 120 matches and three window choices. Actual held-out validation/replay timings are in step2-evaluation-results.md. Timing is one local run, not a controlled benchmark or service SLO.

All scenarios are synthetic, generated by one rule engine with uniform role attributes plus small roster offsets. A match's many events are not independent trials. The holdout has 32 independent seed families and correlated scenario pairs, not 160 independent seeds. Algorithm choice used development only; clustered uncertainty is reported for the fixed selected method. No claim that a more complex detector is inherently worse follows from this bounded grid. Offline PELT is excluded from live claims because batch segmentation uses future observations. Neural modeling, Foundry and UI work cannot repair the observed label/feature weakness.

See step2-failure-analysis.md for actual misses, ordinary-match alerts and negative/ambiguous controls. The appropriate next task is analytics/data-target repair with a new untouched test set, not narrative integration.
