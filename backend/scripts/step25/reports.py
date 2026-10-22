"""Render actual measured results into review reports; never invent missing results."""
from __future__ import annotations
import json
from statistics import median
from common import ROOT,ART,digest
R=ROOT/'research/step25'
def read(name):return json.loads((ART/name).read_text())
def write(name,text):
    import re
    replacements={'Step2.5':'Step 2.5','Step1/Step2':'Step 1/Step 2','Step2 already':'Step 2 already','ObjectiveB':'Objective B','contains16':'contains 16','adjacent180':'adjacent 180','thresholds12':'thresholds 12','with2.5':'with 2.5','penalties1/10':'penalties 1/10','scores.5/.75':'scores .5/.75','conditioned5m':'conditioned 5m','then600':'then 600','precision69':'precision 69','recall46':'recall 46','F1.561':'F1 0.561','F1.497':'F1 0.497','median150':'median 150','are57':'are 57','Brier0':'Brier 0','ECE0':'ECE 0','separation24':'separation 24','seed11':'seed 11','scheduled1/2':'scheduled 1/2','all28':'all 28','plus28':'plus 28','predeclared3300':'predeclared 3300','full13':'full 13','same7m':'same 7m','claim100':'claim 100','takes295':'takes 295','RSS613':'RSS 613','is1.051':'is 1.051','p951.157':'p95 1.157','is12242bytes':'is 12,242 bytes','facts3718bytes':'facts 3,718 bytes','final40':'final 40','use1,000':'use 1,000','across200':'across 200','Duplicates0':'Duplicates 0','alerts25':'alerts 25','alerts48':'alerts 48','is0.338':'is 0.338','pass280':'pass 280','become280':'become 280','NORTH55/65minutes':'NORTH 55/65 minutes','SOUTH60/70':'SOUTH 60/70','from24':'from 24','families,280':'families, 280',';200':'; 200','and160':'and 160','line3/line4/q20':'line3/line4/q20','at3/5/7':'at 3/5/7','132s':'132 s','at1218':'at 1218','is1350':'is 1350'}
    for old,new in replacements.items():text=text.replace(old,new)
    text=re.sub(r'(?<=[0-9%]),(?=[a-zA-Z])',', ',text)
    (R/name).write_text(text.strip()+'\n')
def pct(x):return f'{100*x:.2f}%' if x is not None else 'undefined'
def num(x):return f'{x:.3f}' if x is not None else 'undefined'
def interval(m,key):
    x=m.get('cluster_intervals',{}).get(key)
    if not x:return 'not estimated'
    return f"[{pct(x['lower'])}, {pct(x['upper'])}]" if key in ['precision','recall'] else f"[{x['lower']:.3g}, {x['upper']:.3g}]"
def table(headers,rows):return '| '+' | '.join(headers)+' |\n| '+' | '.join(['---']*len(headers))+' |\n'+'\n'.join('| '+' | '.join(map(str,row))+' |' for row in rows)
s=read('feature-separation.json');rep=read('holdout-feature-replication.json');h=read('holdout-summary.json');dev=read('development-summary.json');val=read('validation-summary.json');v=read('verification.json');ex=read('examples.json');f=read('frozen.json');cal=read('ml-calibration-diagnostic.json');details=read('verification-detail.json');m=h['selected_metrics']['600'];m20=h['selected_metrics']['1200'];cfg=f['selected']
feature_rows=[]
for scenario in ['strong','moderate','press_only','low_block','tempo','pulse']:
 a=s['results'][scenario]['line3_m'];b=rep['results'][scenario]['line3_m'];ci=a['cluster_bootstrap_95'];ci2=b['family_bootstrap95']
 feature_rows.append([scenario,a['paired_families'],f"{a['mean_paired_DiD']:+.2f} [{ci[0]:+.2f},{ci[1]:+.2f}]",num(a['development_distribution_auc']),b['supported_pairs'],f"{b['mean_paired_difference']:+.2f} [{ci2[0]:+.2f},{ci2[1]:+.2f}]"])
write('feature-separation.md',f'''
# Does observable signal exist?

**Yes for defensive-line geometry; no convincing improvement in carrier-closing or local pressing density for the high-press interventions examined.** This distinction was established on development before model fitting, then replicated with the same fixed definitions after the final freeze.

## Paired line-height changes

Each number is (post-minus-pre in intervention) minus (post-minus-pre in paired null), context reweighted. Units are metres. Intervals are 95% seed-family percentile bootstrap intervals (1,000 resamples). Five-minute windows use at least four observations per common context; support exclusions are explicit.

{table(['Scenario','Dev pairs /24','Dev paired change [95%]','Dev distribution AUC','Holdout pairs /40','Holdout paired change [95%]'],feature_rows)}

AUC compares treatment and null change distributions with a prespecified expected direction. It is descriptive development separability, not cross-validated classifier accuracy or intervention recall. Bootstrap uncertainty is conditional on this simulator, feature definition and supported families. Paired seed prefixes are controlled; subsequent RNG consumption can diverge, so these are not isolated causal effects of one tactic parameter.

## Pressure hypotheses that failed

Strong development carrier-distance paired change is +0.156m (95% -0.376 to +0.673), AUC .459; density within 10m is +0.127 players (-0.108 to +0.364), AUC .522. Holdout repeats the lack of a reliable carrier-closing effect: nearest distance +0.404m (-0.028 to +0.823), density +0.125 (-0.136 to +0.382). There is no evidence here to say that the strong policy consistently closes the carrier more aggressively. Moderate and press-only measurements also overlap ordinary fluctuation. Low block produces a lower line and less local density, with fewer supported paired cases.

The four-family pilot was optimistic about proximity; the complete development cohort corrected it. It was never counted as a separate validation set. No pressure composite or neural network was promoted to rescue an unsupported premise.

## Noise, support and redundancy

Development has {s['supported_changes']}/{s['records']} supported window comparisons; holdout {rep['supported_windows']}/{rep['all_windows']}. Primary detector evaluation keeps every match, including unsupported cases. Development strong line change is 5.82 null-change standard deviations; moderate 2.00. These ratios are descriptive effect/noise measures, not independent-frame test statistics. The JSON includes means, medians, direction fractions, null SD and uncertainty for all 13 features.

Line3 and q20 changes correlate almost perfectly, line4 .884 and centroid .844 across supported development changes. Adding them as independent votes would exaggerate evidence. Nearest distance correlates -.254 with line3; its weak response is not a reliable confirming signal. Density radii5/10/15 were fixed before the screen and all remain reported.

The secondary ten-minute recent view preserves line separation (strong +11.86m, moderate +4.10m, press-only +0.30m), while carrier distance still shows little consistent effect. Event recovery-location AUC is .809 strong and .720 moderate, weaker than positional line AUC1.000/.887; all 168 event windows meet the diagnostic four-recovery support threshold. Event outcomes are available but noisier.

![All supported development families](figures/feature-distributions.png)
![Feature redundancy](figures/feature-correlations.png)

The scientifically plausible problem is detecting a sufficiently large observed line shift under comparable possession conditions. The broader claim of identifying every hidden press instruction is not supported.
''')
comparison=[]
for r in h['results']:
 a=r['metrics']['600'];b=r['metrics']['1200'];comparison.append([r['config']['method'],pct(a['precision']),pct(a['recall']),num(a['f1']),f"{a['null_alerts']}/{a['null_matches']} = {num(a['false_alerts_per_null_match'])}",a['median_delay_seconds'],pct(b['recall'])])
write('detector-comparison.md',f'''
# Frozen candidate comparison

Validation selected **fused geometry + event confirmation**, a deterministic statistical/rule hybrid. It is not a trained classifier. Configuration: reference cap 1200s, recent 180s, clock cadence 30s, >=12/6 frames per common context, line threshold 7m, persistence 2, cooldown 900s, and hysteresis rearming after three quiet checks below 3.5m. Event confirmation requires >=4 recoveries in each adjacent180s event window plus direction-aligned recovery-location change>=3m OR high-recovery share change>=.05.

## Bounded selection

The full development/validation grid contains16 candidates: unchanged event baseline; unconditioned and conditioned geometry at3/5/7m; fused 5/7m; leaky CUSUM thresholds12/24 with2.5m instantaneous floor; two development-fitted L2 logistic models (penalties1/10) at scores.5/.75; and a conditioned5m 60s cadence ablation. Unconditioned here still requires opponent build-up; it removes within-build-up score/ball-zone/roster mixture matching. No post-holdout search was run.

Ranking was declared before validation: active detections first; null<=.25 first; then600s F1, precision and delay. Only fused 7m meets the null target on validation (.125 alerts/match), with precision69.8%, recall46.9%, F1.561 and median150s. Development values are57.5%,43.8%, F1.497 and .208 null alerts/match. The selection hash is `{h['frozen_sha256']}`; freeze-receipt.json records that final holdout did not exist at freeze. Each method's validation finalist is evaluated below without reselection.

## Actual final holdout

40 independent families,280 matches;200 primary null/strong/moderate/press-only/low-block matches and160 eligible external interventions. Correct team and direction, one credit/onset, full-match alert denominator.

{table(['Validation finalist','P600','R600','F1','Null alerts /matches','Median delay s','R1200'],comparison)}

![Finalist comparison](figures/detector-comparison.png)

The selected model stays selected even if another finalist happens to have a better holdout statistic. Alternative-finalist results are descriptive, not a new model-selection round. Simple geometry does not automatically control false alarms; event confirmation improves specificity while suppressing weaker positives. Sequential accumulation does not recover the missing press-only information.

## Supervised ablation and calibration

The tiny logistic fit uses three observable changes: absolute line delta, direction-aligned carrier closing and density10. Scaling and weights use only development. Training has {dev['training']['examples']} supported fixed examples from 24 families ({dev['training']['positive_examples']} positives), at one pre and one onset+300s point per primary scenario. Related scenarios stay grouped. Unsupported training windows are excluded from fitting, while every match remains in detector evaluation.

The frozen logistic finalist's diagnostic fixed-window holdout has {cal['supported_examples']}/{cal['eligible_examples']} supported examples, Brier{cal['brier']:.3f} and five-bin ECE{cal['five_bin_ece']:.3f}. This task and its class prevalence differ from full-match alerting. It was not recalibrated on holdout; bins in ml-calibration-diagnostic.json show discrepancies. Sigmoid scores remain uncalibrated and must not be narrated as broadcast confidence probabilities. Neither logistic variant justifies added model complexity for the selected pipeline.

Runtime fields in comparison summaries are amortized: common immutable comparisons are calculated once per match and reused, while each detector has fresh independent state. They are not standalone method benchmarks. Raw real-path runtime/memory is reported in validation-and-leakage.md. No PH/ADWIN rerun on an arbitrary new positional scale or offline PELT is claimed; Step2 already tested their event versions, and CUSUM supplies the bounded positional sequential comparison.
''')
metric_rows=[]
for key,label in [('precision','Precision'),('recall','Recall'),('f1','F1'),('false_alerts_per_null_match','Alerts/unchanged match'),('median_delay_seconds','Median matched delay (s)')]:metric_rows.append([label,pct(m[key]) if key in ['precision','recall'] else num(m[key]),interval(m,key),pct(m20[key]) if key in ['precision','recall'] else num(m20[key]),interval(m20,key)])
scenario_rows=[[k,x['matches'],x['eligible'],x['hits'],x['alerts']] for k,x in m['per_scenario'].items()]
write('evaluation-results.md',f'''
# Actual held-out results

Selected fused 7m detector, frozen before generating the final40 families. Seed-family intervals use1,000 bootstrap draws; correlated scenarios remain together. Confirmatory scope is the fixed synthetic engine and declared scenario distribution.

{table(['Metric','600s','95% family interval','1200s','95% family interval'],metric_rows)}

600s: **{m['true_positives']}/160 detected, {m['missed_interventions']} missed, {m['false_positives']} unmatched alerts** across200 primary matches. Duplicates{m['duplicate_alerts']}; wrong-team alerts{m['wrong_team_alerts']}; early alerts{m['early_alerts']}. Categories can overlap. Null matches produce {m['null_alerts']}/40 alerts; normalized to actual cumulative clock exposure the rate is{m['false_alerts_per_null_90_minutes']:.3f} per 90 minutes. This includes added time and is not a wall-clock broadcast rate. The 95th percentile matched delay is reported in final-verdict.md; delay summaries exclude misses and must be read alongside recall.

{table(['Scenario','Matches','Eligible external targets','Hits600','All alerts'],scenario_rows)}

Tempo and pulse are ambiguous stress cases: they may produce observed changes, so their alerts are reported without falsely calling every one a negative-control error. Press-only remains a primary target even when the spatial effect is tiny. Low block retains the retreat direction; the original event baseline only detects upward recovery shifts and therefore cannot match retreat targets.

All {v['packs']} selected-detector packs pass raw geometry, separate coordinate arithmetic and canonical event-fact recomputation. Exact raw/cache agreement, deterministic replay and one real raw-prefix check per match pass{v['matches']}/{v['matches']}. These establish numerical and tested causal properties, not ObjectiveB classification accuracy or real-football calibration.

![Every primary match](figures/all-alerts.png)
![Matched delays and missing-denominator caveat](figures/detection-delays.png)
![Descriptive strata](figures/robustness-strata.png)

Team and onset are confounded by the declared alternation (NORTH55/65minutes, SOUTH60/70). Strata cannot identify an independent team or timing effect. Score emerges endogenously; strengths vary only+/-1 on two fixed fictional squads. New teams, unseen tactic families, other engines and real professional games remain untested. Forty independent families do not become280 independent experiments or millions of independent tracking frames.
''')
write('validation-and-leakage.md',f'''
# What was validated, and its limits

Frozen artifact `{h['frozen_sha256']}` binds inference files, old event components/config, protocol, generator/projection, lockfile, research comparator/common code, trained weights and development/validation seed manifests. The final holdout was generated only after that freeze; no inference parameter or frozen source was repaired after inspection. Tests confirm exact exclusion of Step1/Step2 families and separation24/16/40. The now-inspected holdout cannot be used to tune another model; a new untouched test set is required.

## Executed checks

| Property | Actual evidence |
|---|---|
| Python regression/adversarial suite |58 passed, including 22 new Step2.5 cases |
| TypeScript suite / strict typing |10 passed; tsc --noEmit exit0 |
| Extraction parity |Full seed11 matches old canonical hash; scheduled1/2Hz case; all28 real diagnostic pairs share canonical hashes and integer-second geometry |
| Raw/cache replay |{v['exact_raw_cache_replay']}/{v['matches']} final matches, plus28 development diagnostics; exact comparison records and scored alert signatures |
| Deterministic replay |{v['deterministic_replays']}/{v['matches']} fresh detector runs |
| Real raw-prefix checks |{v['prefix_passed']}/{v['prefix_checks']} at predeclared3300/3900/4500s cutoffs cycling by match ordinal |
| Evidence geometry |{v['geometry_verified']}/{v['packs']} packs recomputed from raw observable frames |
| Separate coordinate arithmetic |{v['independent_spatial_verified']}/{v['packs']} line3/line4/q20/proximity/density10 checks without calling the feature extractor |
| Event confirmation |{v['event_facts_verified']}/{v['packs']} packs recomputed from canonical event prefixes |
| Feed quality |{v['quality']['frames']} holdout frames;{v['quality']['invalid_owner_frames']} inactive-owner frames excluded;{v['quality']['gaps']} sampling gaps |
| Actual roster exposure |{v['quality']['substitutions']} substitutions;{v['quality']['red_cards']} dismissals across280 matches; active-count histogram recorded |

Strict nested schemas reject intent/target/policy/scenario/RNG/control metadata; loader requires opaque UUID filenames and monotone samples. Canonical ingestion rejects administrative event types and source-index gaps. Synthetic tests exercise missing frames, sparse/mixed contexts, GK exclusion, halftime rotation, changed active roster, tampered facts/references, wrong direction/team and duplicate temporal matching. Team detectors/windows are independent per replay. Raw-prefix tests clip events as well as positions so future aggregates cannot influence earlier scored output.

These are concrete attacks and finite tests, not a proof of universal information-flow security. Per-frame arithmetic and feature extraction have separate coordinate checks for five core facts; full13-feature recomputation still shares the underlying feature definition. No independent blinded football-pattern labels were collected. ObjectiveB precision/recall is undefined; it would be circular to label episodes using the same7m threshold and claim100% classification.

## Cost and compactness

The full verification harness takes{v['seconds']:.1f}s, peak RSS{v['peak_rss_bytes']/2**20:.1f}MiB. Median per-match loading+replays+prefix+pack verification is{v['per_match_verification_seconds_median']:.3f}s, p95{v['per_match_verification_seconds_p95']:.3f}s. These are local offline harness costs, not network/service latency. Candidate summaries amortize shared feature comparisons; pipeline throughput cannot be inferred from those fields alone.

Median full evidence pack is{v['pack_bytes_median']:.0f}bytes; compact agent facts{v['agent_facts_bytes_median']:.0f}bytes. The two executed full CLI examples each finish in about0.66s locally, including parsing, replay and export; two examples are not a throughput/load test. Full raw histories are not an agent prompt. New bulk data/cache/exports stay ignored and reproducible; examples retain complete geometry references with full-source hashes. Exact versions and command statuses are in runtime.json and command-results.json. No cloud/LLM calls, Foundry, frontend or deployment are part of this implementation.
''')
# Scenario/stratum failures, using a fixed deterministic example selection rule.
e=ex['success'];p=e['pack'];false=ex['false_alert'];fp=false['pack'];miss=ex['miss'];delay=p['detected_at_seconds']-e['onset']
write('execution-walkthrough.md',f'''
# Trace real code and real observations

This pipeline detects observed spatial changes with deterministic statistics and event rules. The selected path trains no model. Logistic regression remains a separate research ablation whose fitted constants and task are documented in detector-comparison.md.

```text
RealTimeEngine.tick / commitSnapshot / snapshot
    -> runMatch.drain optional onSnapshot callback
    -> projectSnapshot (strict allowlist)
    -> validate_frames / TrackingFrame
    -> extract_features (one defending team, comparable build-up)
    -> TrackingWindows.compare (context-weighted before/after)
    -> detect / PositionalDetector.update (independent team state)
    -> make_pack
    -> verify_geometry + verify_events + independent arithmetic
    -> compact_agent_facts
```

## 1. Engine to observation

`upstream/football-simulator/RealTimeEngine.ts::tick` advances quarter-second simulation ticks. Positions move toward internal targets; after action resolution `commitSnapshot` calls `snapshot`. Targets/intents are legitimate engine inputs but forbidden analytics observations. `poc/src/simulation.ts::runMatch` calls its drain after start/tick; the optional callback observes the snapshot without RNG/state changes. `poc/src/tracking/generate.ts` selects uniformly sampled integer seconds and calls `projectSnapshot` in schema.ts. That function outputs only clock/period/phase/score, ball ownership/coordinates and observed active players. Administrative interventions are recorded separately by the research driver.

`tracking/ingestion.py::load_frames` validates a UUID-named compressed feed through `validate_frames`, enforcing strict schemas, increasing time/sequence and unique IDs. No metadata argument exists. The match ID is used for output identity, not a predictive feature.

## 2. Observation to geometry

`extract_features(frame,team)` returns None for own possession, restarts, invalid owner, non-build-up or insufficient roster; otherwise it returns a FeatureSample. It rotates coordinates for defending-team direction, removes the GK, averages the three deepest outfield x positions and calculates proximity, densities and shape metrics. It tags an observable context from ball zone, score sign and active counts. State is only observed frame data.

`comparisons_from_frames` maintains one TrackingWindows per team, resets on observed period changes and yields fixed30s clock decisions. It finalizes a decision only after all frames at that time are incorporated, never including a later frame. `TrackingWindows.update` appends eligible samples; `compare` drops expired history and computes common-context weighted means with>=12 reference/>=6 recent frames/context. Before and after use the recent context weights, not different context mixtures. It returns complete selected frame IDs.

## 3. Successful external-target example

First qualifying strong success by manifest order: seed{e['seed']}, UUID `{e['match_id']}`, target{e['target_team']}, external onset{e['onset']:.0f}s (evaluation only). Alert at{p['detected_at_seconds']:.0f}s, delay{delay:.0f}s. Reference window{p['reference_window']}, recent{p['recent_window']}, both `(start,end]`.

Line3: **{p['before']['line3_m']:.3f} -> {p['after']['line3_m']:.3f}m**, delta{p['deltas']['line3_m']:.3f}m. Score = abs({p['deltas']['line3_m']:.3f})/7 = **{p['detection_score']:.3f}**, a threshold ratio, not probability. Support: {p['support']['reference_frames']} reference frames, {p['support']['recent_frames']} recent frames, {p['support']['common_contexts']} common contexts. Carrier distance{p['before']['nearest_m']:.3f}->{p['after']['nearest_m']:.3f}m; those facts must not be replaced with a generic “more aggressive press” sentence.

`detect` causally updates `SignalState` with canonical events through the current decision time. Fused event confirmation has recovery-location delta{p['event_facts']['location_delta_m']:.3f}m and high-share delta{p['event_facts']['share_delta']:.3f}. `PositionalDetector.update` requires a consistent passing direction on two checks; the emitted score describes the final check. After an alert it disarms, tracks cooldown and needs three quiet checks to rearm. The full prefix replay, rather than the pack alone, verifies that history-dependent trigger.

## 4. A false alert with true numerical facts

First unchanged-match alert by the same ordering: seed{false['seed']}, UUID `{false['match_id']}`, at{fp['detected_at_seconds']:.0f}s, team{fp['team_id']}. Line{fp['before']['line3_m']:.3f}->{fp['after']['line3_m']:.3f}m, delta{fp['deltas']['line3_m']:.3f}m; score{fp['detection_score']:.3f}. The windows genuinely differ and their numbers verify. This false case has only eight recent eligible frames, ending at1218s although the decision is1350s; overlapping persistence checks do not guarantee new independent build-up opportunities. The statement describes sampled windows, not an instantaneous current position. There is no external intervention to identify. Context bins do not control every aspect of possession, ball movement, stochastic play or endogenous simulator response; the specific causal source is not established by the detector. It is a false positive for ObjectiveA and cannot simply be relabeled a verified coaching decision.

First press-only miss: seed{miss['seed']}, UUID `{miss['match_id']}`, onset{miss['onset']:.0f}s, target{miss['target_team']}. There is no matching alert within600s. The fixed feature analysis shows why a large line-shift rule can miss this policy; absence of a line alert does not prove no tactical instruction occurred.

![Success and paired control](figures/success-timeseries.png)
![Unchanged false example](figures/false_alert-timeseries.png)
![Missed intervention](figures/miss-timeseries.png)
![Observed spatial frames](figures/spatial-evidence-strip.png)

## 5. Evidence and debug command

`make_pack` combines exact windows/means/deltas, configuration, support, complete tracking/event references and explicit non-causal wording. `verify_geometry` rebuilds weighted facts from raw positions; `verify_events` rebuilds confirmation counters; research verify.py separately calculates five core geometries. `compact_agent_facts` strips complete histories/reference arrays for future narrative work. Fixtures retain complete geometry calculation frames for these success/false packs, not a manufactured perfect demonstration. Regenerate the full UUID feed for online replay; excerpts are intentionally not a complete timeline.

```sh
backend/.venv/bin/python -m matchpulse.tracking.cli data/step25/inference/{e['match_id']}.tracking.jsonl.gz --events data/step25/inference/{e['match_id']}.jsonl --config research/step25/artifacts/selected.json --debug --output backend/output/step25/demo.json
```

Repeat with `{false['match_id']}` for the false case. No event/position after a decision contributes to its facts; the module never imports evaluation. The research driver later matches alerts against hidden onsets. This separation is the key ownership boundary: the detector observes, the evidence engine proves arithmetic, evaluation judges the external target, and a future agent may explain only the verified observations.
''')
write('product-decision.md',f'''
# Outcome B: observable line intelligence, limited intervention identification

**CONDITIONAL GO** for a bounded prototype that narrates verified line-height facts. **Do not promote hidden coaching-decision/high-press detection as a validated flagship.** The external-intervention target misses precision, recall and null-rate goals on fresh holdout. Its matched delay is acceptable but excludes102 misses. Twenty minutes adds only one detected intervention.

The signal-existence milestone succeeds in a narrower scientific sense: strong/moderate/low-block policies produce replicated positional-line effects. It does not establish more effective closing down. An unchanged match can also show a true observed line shift. This is why correct numerical evidence and poor intervention precision can coexist.

Safe presentation: “We measure defensive-line movement during comparable opponent build-up and show exactly which observations support the statement.” Show the paired strong example and an unchanged false example side by side. Quote the complete held-out precision/recall and the strong/moderate/press-only breakdown; do not quote33/40 strong successes as universal accuracy. Do not claim a coach ordered a high press, that pressure became effective, a score caused a goal, or real-world calibration.

## Conditions for the next step

1. Scope the next Foundry work to explaining measured line-height window facts and limitations, including actual observation times and sparse/stale support; keep detector alerts explicitly provisional for external tactical intent.
2. Require deterministic raw-evidence verification before narrative generation; expose support, windows and missing opportunities.
3. Use a strict claim vocabulary and structured numeric slots. Rejection falls back to a deterministic factual template.
4. No confidence probability is inferred from threshold ratios or logistic scores. No alert is not evidence that no tactic changed.
5. Before calling selected episodes consistently “meaningful tactical patterns,” obtain an independently labeled/blinded episode evaluation and a new untouched test set. Do not turn this holdout into a tuning set or same-threshold truth.

A concrete next interface is below. It is a proposed architecture, not implemented Foundry connectivity:

```text
validated PositionalEvidencePack + compact_agent_facts
  -> deterministic facts registry (claim IDs, units, rounding, as_of, support)
  -> Tactical Analyst: select allowed observed claims; identify limitations
  -> Broadcast Narrator: choose template/ordering and fill registered claim slots
  -> deterministic grounding verifier + renderer
  -> grounded insight, or safe factual fallback
```

Proposed analyst output: `{{"as_of_seconds":...,"claim_ids":[...],"limitations":[...],"evidence_ids":[...]}}`. Proposed narrator output: `{{"template_id":"observed_line_shift","claim_ids":[...],"audience":"fan"}}` plus only registered numeric slots. The verifier resolves IDs, matches team/time/windows/units, permits defined rounding, checks direction and support, rejects unregistered values/claims and never permits intervention-intent or causal-goal claims. Deterministic rendering bounds factual language; unrestricted prose would require a separate semantic-grounding evaluation. Tools resolve only evidence through as_of; they cannot access labels, future feeds or experiment manifests.

This is a small, scientifically honest integration experiment, not a claim that core tactical-intervention detection has passed. If the desired presentation still depends on reliable coach-intent detection, the decision for that product remains NO-GO and the next work must be independent signal/episode validation rather than cloud orchestration.
''')
import numpy as np
p95=float(np.quantile(m['delay_seconds'],.95))
write('final-verdict.md',f'''
# CONDITIONAL GO — verified line facts; intervention target fails

**Outcome B.** Useful observable defensive-line information exists and replicates on unseen families. Broad tactical-intervention identification remains below target. Proceed only with a tightly scoped fact-explanation prototype; do not build the presentation around a claim of reliable hidden high-press/coach-intent detection.

## The result that matters

Strong line shifts: held-out paired mean +11.91m,95% family interval+11.01 to+12.68,37 supported pairs / 40. Moderate+3.96m; press-only+0.14m with interval crossing zero. Closing-down and pressing-zone density do not show consistent high-press separation. The primary research question therefore has a positive answer for line geometry and a negative/inconclusive answer for the broader pressure premise.

Selected fused 7m detector,40 held-out families,280 matches,200 primary matches,160 external targets:

{table(['Gate','Actual600s','Target','Assessment'],[
 ['Precision',pct(m['precision'])+' '+interval(m,'precision'),'>=75%','FAIL'],
 ['Recall',pct(m['recall'])+' '+interval(m,'recall'),'>=70%','FAIL'],
 ['F1',num(m['f1']), 'reported, no separate target','limited'],
 ['Null alerts/match',num(m['false_alerts_per_null_match'])+' '+interval(m,'false_alerts_per_null_match'),'<=.25','FAIL point estimate'],
 ['Median matched delay',str(m['median_delay_seconds'])+'s '+interval(m,'median_delay_seconds'),'<=480s','PASS, conditional on matched targets'],
 ['95th percentile matched delay',f'{p95:.1f}s','report tail','misses excluded'],
 ['Evidence arithmetic',f"{v['geometry_verified']}/{v['packs']}",'100%','PASS for executed packs'],
 ['Raw/cache, deterministic and prefix',f"{v['matches']}/{v['matches']} each",'100% tested','PASS for executed tests']])}

{m['true_positives']} hits,{m['missed_interventions']} misses,{m['false_positives']} unmatched primary alerts;{m['null_alerts']} alerts/40 unchanged matches. Strong33/40; moderate5/40; press-only0/40; low-block20/40. At1200s, precision{pct(m20['precision'])}, recall{pct(m20['recall'])}, F1 {num(m20['f1'])}; only one extra hit. Full uncertainty/denominators are in evaluation-results.md. This holdout is now consumed; no retuning is justified without a fresh test set.

## Quality review

| Dimension | Review |
|---|---|
| Scientific credibility | Registered families/targets, feature-first decision, validation freeze, negative results retained; single synthetic engine and supported-window selection limit inference |
| Football correctness | Explicit GK/direction/possession/context geometry; no assertion that proximity proves pressing success |
| Generalization | New seeds and declared variations tested; team/time confounded, same squads/engine, unseen policy families/real matches untested |
| False positives | Improved versus event baseline but still above null target; intervention claim fails |
| Interpretability | Metres, counts, windows, independent arithmetic and complete resolvable references |
| Evidence integrity |{v['packs']} packs numerically verified, including failed external-target cases; not pattern-label accuracy |
| Reproducibility | Pinned source, locked dependencies, source/config hashes, manifest hashes, scripts and small examples |
| Maintainability | Tracking subpackage separate from unchanged Step2 inference; optional TS callback, explicit contracts,58 Python / 10 TS tests |
| Operational cost | Local deterministic analytics, compact agent facts; harness runtime/memory measured, cloud latency/cost unmeasured |
| Integration readiness | Suitable only for constrained facts-to-narrative experiment; no Foundry/UI/deployment implemented |
| Differentiation | Replicated observability study and falsifiable evidence path; no invented algorithm novelty or winner claim |

The next engineering boundary and required claim restrictions are specified in product-decision.md. Experimental decisions remain in protocol.json/decisions.jsonl and freeze-receipt.json so context/model changes cannot silently rewrite methodology.
''')
write('execution-commands.md',f'''
# Reproduction commands and artifacts

Use Node24 and the locked Python3.12 environment. `backend/.venv/bin/python` was used directly in this sandbox to avoid dependency-cache/network writes; `uv run --project backend python` is the equivalent project command after frozen sync. runtime.json records exact installed versions. No dependency or old inference source was changed.

```sh
uv sync --project backend --frozen --extra dev
npm ci --prefix poc --ignore-scripts
# Reuse/verify the existing pinned source checkout; clone only if absent.
git -C upstream/football-simulator rev-parse HEAD
cd poc
node --import tsx src/tracking/generate.ts
node --import tsx src/tracking/generate.ts --validation
node --import tsx src/tracking/generate.ts --2hz
cd ..
backend/.venv/bin/python backend/scripts/step25/separation.py
backend/.venv/bin/python backend/scripts/step25/diagnostics.py
backend/.venv/bin/python backend/scripts/step25/compare.py development
backend/.venv/bin/python backend/scripts/step25/compare.py validation
# Stop here and verify the frozen source/config hash before opening holdout.
cd poc
node --import tsx src/tracking/generate.ts --holdout
cd ..
backend/.venv/bin/python backend/scripts/step25/compare.py holdout
backend/.venv/bin/python backend/scripts/step25/verify.py
backend/.venv/bin/python backend/scripts/step25/replication.py
backend/.venv/bin/python backend/scripts/step25/ml_diagnostic.py
backend/.venv/bin/python backend/scripts/step25/failure_contexts.py
backend/.venv/bin/python backend/scripts/step25/halftime_audit.py
backend/.venv/bin/python backend/scripts/step25/figures.py
backend/.venv/bin/python backend/scripts/step25/reports.py
backend/.venv/bin/python -m pytest backend/tests -q
cd poc
node node_modules/typescript/bin/tsc --noEmit
node --import tsx --test tests/*.test.ts
```

Executed Node path: `/Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node`. The default Node26/tsx IPC launcher failed in this sandbox; explicit Node24 with `--import tsx` works. The initial comparison was interrupted(exit130) before producing selection results and replaced by equivalent shared-comparison execution for efficiency. Available command outcomes are retained in command-results.json (validation completion is artifact-backed; its discarded original shell handle means no exit code is asserted); logs and detailed per-match outputs are local/ignored, compact summaries remain reviewable. The earlier schema-strict pilot failed on stale owner references and is archived; it is not counted as an independent experiment.

Do not rerun validation to select a new candidate after seeing this holdout. A fresh clone can regenerate these fixed cohorts/configurations for reproduction, but any new tuning requires a different untouched evaluation set. Generator/extraction fingerprints deliberately refuse silent stale-cache reuse. New generated data is large and ignored under the Step2.5 brief; all previously tracked Step1/2 experiments and Git history are preserved.

Review artifacts: development-summary.json, validation-summary.json, frozen.json/frozen.sha256/freeze-receipt.json, holdout-summary.json, holdout-feature-replication.json, diagnostics.json, verification.json, examples.json, schema JSONs, runtime.json and source/license audit. Small fixtures include every geometry reference for selected success/false examples. Full UUID feeds can be regenerated; no source-audit or labels are input to inference.
''')
print('Rendered measured Step2.5 reports')
