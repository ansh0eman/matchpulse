# Geometry, context and exact feature definitions

The implementation is `tracking/features.py::extract_features`; inference imports no evaluation code. Let x' be metres from the defending team's own goal along its attacking axis, rotating x/y at halftime. Use open-play samples with an active opponent ball owner, in-pitch ball, at least seven active outfielders per side, and the opponent carrier in its own half (opponent x' <=52.5m). Exclude goalkeepers explicitly. Each eligible sample belongs to one defending team; the team owning the ball receives no defensive sample.

| Name | Exact per-frame calculation | Limitation |
|---|---|---|
| line3_m | Mean of three smallest defending x' | Spatial backline proxy, not a coach formation label |
| line4_m; line_q20_m | Mean deepest four; linear-interpolated 20th percentile | Complementary, highly correlated checks |
| nearest_m | Minimum Euclidean distance between opponent carrier and defending outfielders | Proximity is not pressure effectiveness |
| density5/10/15 | Counts within <=5/10/15m of carrier | Fixed sensitivity radii; no real-football calibration |
| length_m; width_m | q90-q10 of outfield x'; q90-q10 of y' | Robust extent; excludes extreme players |
| centroid_x_m | Mean outfield x' | Centroid is not a defensive line |
| dispersion_m | RMS Euclidean distance to team centroid | Shape, not intent or synchronization |
| advanced_players | Count with x' >=52.5m | Occupancy, not a pressing action |
| interline_gap_m | q60(x')-q20(x') | Positional quantile gap, not labeled formation lines |

Quantiles interpolate sorted values at index `(n-1)*q`. Geometry uses actual coordinates; no internal target/intent, stamina or policy setting contributes. Invalid owner frames, restarts, own possession and unsupported rosters yield no sample, rather than zero pressure.

## Context weighting and windows

Context key is `(carrier own-third versus middle-half bin, defending score sign, own outfield count, opponent outfield count)`. Own-third boundary is 35m in the carrier team's attacking coordinate. Score is losing/level/leading, not exact goals; fatigue is not directly observed. This does not fully control game state, possession identity or opponent response.

At decision t, reference is `(max(period_start,t-1200,0),t-180]`, recent is `(t-180,t]`. A context must have >=12 reference and >=6 recent frames. For common eligible contexts c, let w_c be recent frames in c divided by all recent common-context frames. Both before and after means use the same w_c. Difference is `sum w_c*(recent_mean_c-reference_mean_c)`. This reduces changing-context-mixture bias without asserting exchangeability or an independent-sample t test. A period reset clears history; the full 20-minute reference duration is a cap, not a mandatory 20-minute warm-up. Support can accrue sooner.

`TrackingWindows.compare` exposes exact windows, context list, complete frame references and denominators. Missing contexts are not extrapolated. More short, correlated frames do not imply more independent evidence; all uncertainty is estimated over seed families. One-minute and half-minute decision cadences are compared as a fixed ablation.

## Events and deliberately excluded claims

The unchanged event engine supplies mean recovery origin, high-recovery share and counts, de-duplicated defensive episodes, final-third counter increments and attacking actions. Fused confirmation uses adjacent 180s windows, >=4 recovery observations each, and direction-aligned recovery location >=3m OR high-share change >=0.05. Recovery events include simulator tackle/interception/recovery conventions; they are not all independently verified opponent-to-team turnovers. No canonical event semantics are silently rewritten.

A standard PPDA metric, pass completion disruption, forced turnovers, counterpressing success, synchronization and causal dangerous-transition attribution are not implemented as new claims. Pass origins and named outcomes are not validated pass endpoints or a complete provider defensive-action taxonomy. A speculative proxy would add ambiguity to an already weak pressure target. Existing event statistics are retained as observable counters; exact endpoint/progression extensions require a separate adapter audit and tests. The literature review lists these research ideas without claiming they were built.

## Tests and trade-offs

Synthetic geometry tests establish known coordinates, GK exclusion, rotation and membership changes. Exact raw/cache parity and raw evidence verification test real generated observations. Correlated line3/line4/q20 are not treated as three independent votes. Nearest distance and density remain reported even when they contradict a tempting pressing explanation. Sparse periods remain evaluation misses, not excluded successful cases.
