# Supported football signals

All analytics use canonical v1 ball-at-event coordinates. No pressure label, tactical control, coach intent, score prediction or calibrated xG is inferred. Source semantics are verified in Step 1's pinned RealTimeEngine; `tackle` is emitted on successful transfer, `challenge` records an attempt, `pass` records an attempt, and `recovery` can be a same-team loose-ball action.

Windows have explicit `(start,end]` event-time boundaries and equal clock exposure. Observation clock is every 60 match seconds, not every N events. Both teams have separate detector state; team-relative x always points toward that team's attacking goal. Half-time clears window state and imposes a fresh two-window support period; no window spanning periods can trigger an alert. Added time remains cumulative clock time, without guessing halftime at exactly 2700s.

| Signal | Definition, units and support | Risks and use |
|---|---|---|
| Recovery action rate | Recovery/interception/tackle; deduplicate `(team, possession, timestamp, actor)`. `60*N/window_seconds`, actions/minute. Count=0 gives rate 0. | Not all are turnovers. Related same-tick recovery/tackle records count once. Dedup is event-key based, not a reconstruction of physical actions over several ticks. Diagnostic. |
| High recovery rate/share | High means normalized x>=70m. Rate `60*H/window_seconds`; share `H/N`, null if N=0. | Rate depends on possession opportunities; share measures location conditional on recovery activity. Selected spatial evidence uses share, not rate alone. |
| Mean recovery location | Arithmetic mean x of distinct recovery actions, metres. Variance is sample variance, null below two actions; mean null with none. Detector requires >=8 per window. | Ball location, not exact player tracking. Same-team recoveries included. Long tactical effects can be obscured by short-term match cycling. Used with share; ablated separately. |
| Advanced defensive episodes | Challenge/tackle/interception grouped by team, actor and possession until >=5s gap. Episode location is its first event. High episode requires x>=70m. | Removes repeated challenge spam and paired challenge/tackle counting. Attempts are explicitly episodes, not successful takeaways. Location near the window boundary can be attributed to an earlier window. Diagnostic, not a claim about coach pressing intensity. |
| Observed final-third entries | Maintain the last observed cumulative count for each possession across the entire prefix. At each event, contribute current-minus-last to the possession team. Sum increments in a window. | Possession can start already in final third, contributing its initial count; no duplicate sums of repeated counters. Dependencies may precede the window and are included in calculation references. Missing observations near window ends remain a limitation. Diagnostic. |
| Attacking event tempo | Count passes, receives and dribbles; normalize by clock minutes if displayed as a rate. | A pass and its receive are two observations, not two completed passes. No possession-duration exposure is available from compact data; this is an event tempo proxy. Diagnostic. |
| Shots | Count shot events per clock window. | Sparse, volatile; excludes save/miss/goal duplicates. chance_quality is deliberately unused as calibrated xG. Diagnostic. |

## Normalization and confounding

Clock exposure yields comparable rates for equal windows, but does not adjust for opponent possession or game interruptions. Conditional high share reduces action-volume dependence. Mean location and share are correlated; the composite is not two independent statistical tests. There is no credible denominator for exact possession-time share in the compact event model.

Natural adaptation to fatigue, score, injuries and cards stays enabled in unchanged matches. In-window goals/red cards/injuries/substitutions produce EvidencePack warnings, not invented causal labels. Period transitions reset the detector rather than pretending that a changed physical direction is an attacking shift. The generator varies roster attributes by +/-1 and intervention times; evaluation also stratifies by observed score and onset time without manually altering scores.

## Ablation interpretation

The development grid includes location-only and share-only versions at the same 480s window and score threshold 1.5. Their actual metrics are in step2-detector-comparison.md and development.json. Neither ablation nor the composite establishes adequate external-intervention classification. Diagnostic features are not silently added after holdout inspection. This limited ablation is not an exhaustive feature-importance study.

Implementation: `backend/src/matchpulse/signals.py` (`SignalState.update`, `observe`, `window_stats`, `changes`). Inference never reads simulator audit files or ground truth. Every pack provides all causal-prefix canonical references for independent recomputation, including counter and episode dependencies outside the displayed windows.
