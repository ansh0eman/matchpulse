"""Render measured reports and compact provenance summaries, without tuning."""
from __future__ import annotations
import csv
from hashlib import sha256
import json
from pathlib import Path
from statistics import mean,median
from matchpulse.schemas import MatchIdentity
from matchpulse.ingestion import load_match
from matchpulse.replay import observations
from matchpulse.signals import changes

ROOT=Path(__file__).resolve().parents[2];ART=ROOT/'research/step2-artifacts';RESEARCH=ROOT/'research'
dev=json.loads((ART/'development.json').read_text());h=json.loads((ART/'holdout.json').read_text())
frozen=json.loads((ART/'frozen-config.json').read_text());final=h['selected_result'];s=final['summary'];rows=final['rows']
meta=json.loads((ROOT/'data/step2/evaluation/holdout-manifest.json').read_text());lookup={r['match_id']:r for r in meta['records']}
example=json.loads((ART/'example-evidence.json').read_text());pack=example['pack'];before=pack['facts']['before'];after=pack['facts']['after'];w=pack['comparison']
verification=json.loads((ART/'verification.json').read_text())

def write(name,text):(RESEARCH/name).write_text(text.rstrip()+'\n')
def number(value,digits=3):return 'undefined (no emitted positives)' if value is None else f'{value:.{digits}f}'
def pct(value):return 'undefined' if value is None else f'{100*value:.1f}%'
def table(results):
    lines=['| Method / features | W seconds / score threshold / stream setting | Precision | Recall | F1 | Null alerts/match | Median delay s | Detector ms/match |','|---|---|---:|---:|---:|---:|---:|---:|']
    for r in results:
        c=r['config'];v=r['summary'];setting=f"PH lambda={c['stream_threshold']}" if c['method']=='page_hinkley' else f"ADWIN delta={c['adwin_delta']}" if c['method']=='adwin' else '—'
        lines.append(f"| {c['method']} / {c['features']} | {c['window_seconds']} / {c['threshold']} / {setting} | {pct(v['precision'])} | {pct(v['recall'])} | {number(v['f1'])} | {number(v['false_alerts_per_null_match'])} | {number(v['median_delay_seconds'],0)} | {r['detector_seconds']*1000/len(r['rows']):.3f} |")
    return '\n'.join(lines)

selected_dev=next(r for r in dev['candidates'] if r['config']==frozen['selected'])
family_dev=[next(r for r in dev['candidates'] if r['config']==c) for c in frozen['finalists'].values()]
ablations=[r for r in dev['candidates'] if r['config']['features']!='both']
write('step2-detector-comparison.md',f'''# Detector comparison — NO-GO for Foundry integration

The selected **research candidate** is the original causal rolling spatial-recovery detector, chosen from development results before holdout scoring. It is the best active configuration in this bounded grid, not a reliable production detector. No active method met the false-alarm target. Its held-out precision/recall are {pct(s['precision'])}/{pct(s['recall'])}.

## Selection and exact configuration

20 configurations: nine rolling (W=300/480/600s x threshold=1/1.5/2); six Page-Hinkley (W=480, spatial threshold=1/1.5 x lambda=.2/.4/.8); three ADWIN (W=480, spatial threshold=1, delta=.01/.05/.2); two ablations (W=480, threshold=1.5, location-only/share-only). All configurations are in development-summary.json. There was no unbounded search and no additional candidate after holdout.

Shared guards: >=8 recovery actions in each window; minimum mean-location increase 6m and high-share increase .08 for the combined method; two consecutive minute checks; 900s same-team cooldown; windows must lie inside the current period. Separate team/match state. Alerts describe upward observed spatial changes only; this is not a general taxonomy of tactical changes.

Frozen selected config:

```json
{json.dumps(frozen['selected'],indent=2)}
```

Composite score = .6*z_location + .4*z_high_share. Location denominator is sqrt(v_before/n_before+v_after/n_after)+2m. High-share denominator is sqrt(pooled_p*(1-pooled_p)*(1/n_before+1/n_after)+.0025). Floors regularize small/noisy samples; the features are correlated and the score is neither a p-value nor probability. Persistence smooths fluctuations but overlapping windows are not independent votes.

River alternatives use nonoverlapping minute observations with scalar .6*clipped(mean_x/105)+.4*high_share when recovery samples exist. Page-Hinkley min_instances=8, delta=.005, alpha=.99, mode=up; ADWIN clock=1, min_window_length=5, grace_period=10, default max_buckets=5. A River drift opens a 180s eligibility interval; the same spatial/support/persistence guards are still required. Each period resets its River instance. Thus these are guarded River pipelines, not claims about the best possible configuration of either algorithm.

The initial null-target-first selection preferred completely silent ADWIN. Before any holdout scoring, selection was corrected to require an active candidate with at least one development true detection; the null-rate target then takes priority, followed by F1, precision and lower median delay. No active candidate met that null target, so best active F1 was retained as a diagnostic research candidate. selection-audit.json preserves this development-only correction. A silent model cannot be a successful detector. Frozen SHA-256: `{h['frozen_config_sha256']}`; source/config hashes were checked on holdout entry.

## Development: 24 seed families, 120 matches

Primary scoring uses 72 null/bundle/moderate matches with 48 eligible interventions; 48 tempo/pulse stress cases are reported separately. Both teams' alerts count against external-target precision. Every family stays on one side of the split.

{table(family_dev)}

Ablations (same W=480 and threshold=1.5; limited development-only comparison):

{table(ablations)}

Location-only did not solve false alarms. The limited ablation does not establish that both features are independently necessary, nor that an untested location-only threshold could not be better. We retained the highest-F1 active configuration actually measured, not an exhaustive optimum.

## Independent holdout: 32 seed families, 160 matches

The frozen family finalists below are diagnostics. The selected winner was not changed based on this table.

{table(h['comparisons'])}

ADWIN emitted no alerts in the tested settings: precision and delay are undefined; recall/F1=0. Page-Hinkley reduced activity relative to some rolling settings but lost sensitivity and did not improve the practical trade-off. The rolling method preserves clearer evidence, small dependency-free detector logic and the best measured active development F1, but fails the target badly. River remains a comparison dependency; production extraction could remove it if the future selected method no longer needs it.

## Runtime and statistical limits

Detector ms/match measures cached minute observations only, excluding canonical validation, feature extraction, EvidencePack creation and verification. Development feature extraction took {dev['feature_seconds']:.3f}s across 120 matches and three window choices. Actual held-out validation/replay timings are in step2-evaluation-results.md. Timing is one local run, not a controlled benchmark or service SLO.

All scenarios are synthetic, generated by one rule engine with uniform role attributes plus small roster offsets. A match's many events are not independent trials. The holdout has 32 independent seed families and correlated scenario pairs, not 160 independent seeds. Algorithm choice used development only; clustered uncertainty is reported for the fixed selected method. No claim that a more complex detector is inherently worse follows from this bounded grid. Offline PELT is excluded from live claims because batch segmentation uses future observations. Neural modeling, Foundry and UI work cannot repair the observed label/feature weakness.

See step2-failure-analysis.md for actual misses, ordinary-match alerts and negative/ambiguous controls. The appropriate next task is analytics/data-target repair with a new untouched test set, not narrative integration.
''')

intervals=final['cluster_bootstrap_95_intervals']
interval_table=['| Metric | Estimate | Seed-cluster bootstrap 95% interval |','|---|---:|---|']
for key in ['precision','recall','f1','false_alerts_per_null_match','median_delay_seconds']:
    ci=intervals[key];interval_table.append(f"| {key} | {number(s[key])} | [{number(ci['lower'])}, {number(ci['upper'])}] |")
scenario_table=['| Scenario | Matches | Eligible external onsets | Matched detections | Alerts |','|---|---:|---:|---:|---:|']
for scenario in ['null','bundle','moderate','tempo','pulse']:
    group=[r for r in rows if r['scenario']==scenario]
    scenario_table.append(f"| {scenario} | {len(group)} | {sum(r['tp']+r['fn'] for r in group) if scenario in ['bundle','moderate'] else 'not a primary positive'} | {sum(r['tp'] for r in group) if scenario in ['bundle','moderate'] else 'not scored as recall'} | {sum(r['alert_count'] for r in group)} |")
event_count=sum(r['event_count'] for r in meta['records'])
write('step2-evaluation-results.md',f'''# Independent evaluation results

**NO-GO for Foundry integration.** The causal analytics/evidence path works, but the external-intervention detector does not meet the predeclared accuracy or false-alarm targets.

## Dataset and frozen protocol

56 new seed families total: 24 development (i=0..23), 32 holdout (i=24..55), seed=1009+7919*i. The original 12 Step 1 seeds are excluded. Each family contains null, strong bundle, moderate bundle, tempo-only and 180s bundle pulse; all share the same side of the split. Five runs per family yields 120 development and 160 holdout matches. All generated runs were included; none were removed for poor outcomes. No source audit or simulator-control data entered inference.

Cumulative injection times cycle 3300/3600/3900/4200 seconds. Home/away roster strengths vary oppositely by -1/0/+1 attribute point. Score is generated organically, not manually injected; onset score is recorded only for evaluation stratification. Bundle matches use the Step 1 bundle. Moderate: style high_press, press75, line70, tempo58, compactness48, balanced mentality. Tempo-only sets tempo70. Pulse restores the original base tactics after 180s. Endogenous score/fatigue/injury/card adaptation remains enabled in every scenario.

Primary accuracy includes null, bundle and moderate only (96 holdout matches). Tempo and pulse are ambiguous stress cases: they can create observed statistical changes, so they are not assigned manufactured 'no change' truth labels or mixed into primary precision. Their alert activity is disclosed separately. This definition is implemented in evaluation.py and was set before final scoring.

Credit the first NORTH upward alert in [onset,onset+600s], one-to-one. Further eligible alerts count as duplicates/unmatched; wrong-team, earlier or later alerts are unmatched. No-intervention alerts count toward the conservative external-target false-alarm proxy. This evaluates alignment with injected interventions, not the truth of every naturally observed statistical shift.

## Primary held-out metrics

- Independent holdout families: **{s['independent_seed_families']}**.
- Eligible interventions: **{s['eligible_interventions']}**; matched **{s['true_positives']}**, missed **{s['missed_interventions']}**.
- Total primary alerts: **{s['true_positives']+s['false_positives']}**; unmatched **{s['false_positives']}**.
- Precision: **{pct(s['precision'])}**; recall **{pct(s['recall'])}**; F1 **{s['f1']:.3f}**.
- No-external-intervention matches: **{s['null_matches']}**; alerts **{s['null_alerts']}**, **{s['false_alerts_per_null_match']:.3f}/match**.
- Exposure-normalized no-intervention alert rate: **{s['false_alerts_per_null_90_minutes']:.3f} per 90 simulated minutes**, including added-time exposure in the denominator.
- Median delay among matched targets: **{s['median_delay_seconds']:.0f}s ({s['median_delay_seconds']/60:.1f}min)**; missed targets do not enter this delay statistic.
- Duplicate matches within the 600s horizon: **{s['duplicate_alerts']}**, partly by construction because cooldown=900s exceeds the horizon. This does not prove no repeat alerts over a whole match.

{chr(10).join(interval_table)}

Intervals use 1,000 deterministic percentile bootstrap resamples of entire seed families, retaining correlated scenarios. They quantify local sampling variability, not professional-football validity, simulator uncertainty or model-selection uncertainty. Small family count and reused synthetic mechanics limit interpretation.

{chr(10).join(scenario_table)}

## Reliability and processing performance

All {h['evidence']['total']} emitted holdout EvidencePacks (including stress-case alerts) were recomputed from their complete canonical-prefix references: **{h['evidence']['valid']}/{h['evidence']['total']} valid**. All 160 matches replayed deterministically, including IDs, facts and references. Prefix invariance at 3660s passed for **{h['evidence']['prefix_checks']} matches**. Additional pytest fixtures append adversarial future coordinates and reject hidden truth/policy parameters. These are actual tested properties, not proof against arbitrary malicious Python code.

The 160 holdout matches contain {event_count:,} canonical events. One measured validation pass took {h['performance']['validation_seconds']:.3f}s total ({1000*h['performance']['validation_seconds']/160:.2f}ms/match average). Actual first inference replay plus EvidencePack construction took {h['performance']['replay_seconds']:.3f}s total ({1000*h['performance']['replay_seconds']/160:.2f}ms/match average), excluding independent verification, repeated replay, prefix checks, plotting, file exports and generation. These averages are not p95 event latency or production service benchmarks. Python 3.12.13, Apple Silicon, local files, fixed dependency lock.

Frozen configuration/source fingerprint: `{h['frozen_config_sha256']}`. Holdout manifest SHA-256: `{h['holdout_manifest_sha256']}`. Detailed ignored local JSON retains every match/alert; compact summaries and per-match CSV retain reviewable results.

## Visual evidence

![Held-out metrics](step2-artifacts/evaluation-overview.png)

![Real signal and evaluation-only annotations](step2-artifacts/signal-example.png)

The true intervention clock appears only in evaluation plotting code. All NORTH alerts in the example are shown, not just its matched alert. Sparse bins and halftime reset remain visible. Chart annotations are not inference inputs.

## Reproduction

See the root README for exact setup/generation/selection/holdout commands. verification.json records actual argv, working directories, logs and exit codes. No holdout-driven parameter changes were made. Future tuning must reserve a new untouched seed-family set, rather than reuse this holdout as confirmatory evidence.
''')

south=sum(a['team']=='SOUTH' for r in rows if r['scenario'] in ['null','bundle','moderate'] for a in r['alerts'])
early=sum(a['time']<r['onset'] for r in rows if r['onset'] is not None for a in r['alerts'])
coincidences=0
for r in rows:
    if r['scenario']=='null':
        paired=next(x for x in rows if x['seed']==r['seed'] and x['scenario']=='bundle')
        coincidences+=any(a['team']=='NORTH' and paired['onset']<=a['time']<=paired['onset']+600 for a in r['alerts'])
misses=sorted([r for r in rows if r['scenario']=='bundle' and r['fn']],key=lambda r:r['seed'])[:3]
null_cases=sorted([r for r in rows if r['scenario']=='null'],key=lambda r:(-r['alert_count'],r['seed']))[:3]
failure_rows=['| Case | Seed / opaque ID | Result |','|---|---|---|']
for r in misses:failure_rows.append(f"| First strong-bundle misses by seed | {r['seed']} / {r['match_id']} | onset {r['onset']:.0f}s, {r['alert_count']} unmatched alerts, no match within 600s |")
for r in null_cases:failure_rows.append(f"| Largest unchanged alert counts, tie by seed | {r['seed']} / {r['match_id']} | {r['alert_count']} alerts |")
strata=['| Condition | Eligible onsets | Matched | Recall |','|---|---:|---:|---:|']
for onset in [3300,3600,3900,4200]:
    group=[r for r in rows if r['onset']==onset];tp=sum(r['tp'] for r in group);strata.append(f'| onset {onset}s | {len(group)} | {tp} | {tp/len(group):.3f} |')
for name in ['trailing','level','leading']:
    group=[]
    for r in rows:
        if r['onset'] is None:continue
        score=lookup[r['match_id']]['changes'][0]['score'];diff=score['home']-score['away']
        if ('trailing' if diff<0 else 'leading' if diff>0 else 'level')==name:group.append(r)
    tp=sum(r['tp'] for r in group);strata.append(f"| home {name} at onset | {len(group)} | {tp} | {number(tp/len(group) if group else None)} |")
write('step2-failure-analysis.md',f'''# Failure analysis and repair decision

## Observed failure, not an integration issue

The chosen detector has {s['false_positives']} unmatched alerts across the 96 primary holdout matches and misses {s['missed_interventions']}/{s['eligible_interventions']} external interventions. {south} primary alerts concern SOUTH, which has no injected target label; {early} alerts occur before an eligible match's onset. These counts overlap and must not be summed into a new total. Both show why time-coincident target detection is much harder than producing a convincing isolated evidence example.

The matched null counterparts produced a NORTH alert in the same planned 600s target horizon in {coincidences}/32 families. That is a diagnostic coincidence rate, not an intervention recall metric. Matching a time window alone does not prove that the external action caused an alert. Paired deterministic prefixes help expose this issue but post-change RNG trajectories diverge.

Step 1's +13 high recoveries was measured over 30-minute windows, after exploratory policy selection. Detecting a smaller local shift within <=8 minutes faces much higher noise. Rolling location/share changes are correlated and ordinary match cycles often satisfy their guards. Low false-alarm ADWIN is silent in these settings; sensitivity cannot be inferred from zero false positives. Page-Hinkley does not solve the precision problem in this grid.

## Concrete cases

{chr(10).join(failure_rows)}

All are retained in per-match-results.csv and detailed local holdout.json. Misses are the first three strong-bundle failures by seed; unchanged examples are chosen by alert count with deterministic seed tie-break, not to imply they represent every match.

## Robustness strata (descriptive)

{chr(10).join(strata)}

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
''')
# Worked example is the first matched strong-bundle record in fixed manifest order.
identity=MatchIdentity(match_id=example['match_id'])
events=list(load_match(ROOT/'data/step2/inference'/f'{identity.match_id}.jsonl',identity))
obs=[o for o in observations(events,frozen['selected']['window_seconds']) if o.team=='NORTH' and o.time in [pack['detected_at_seconds']-60,pack['detected_at_seconds']]]
current=next(o for o in obs if o.time==pack['detected_at_seconds']);delta=changes(current.before,current.after)
prior=next(o for o in obs if o.time==pack['detected_at_seconds']-60);pd=changes(prior.before,prior.after);prior_score=.6*pd['location_z']+.4*pd['share_z']
worked=f'''location delta = {after['mean_recovery_x_m']:.6f} - {before['mean_recovery_x_m']:.6f} = {delta['location_delta_m']:.6f} metres
location z = delta / (sqrt({before['recovery_x_variance']:.6f}/{before['recovery_count']} + {after['recovery_x_variance']:.6f}/{after['recovery_count']}) + 2) = {delta['location_z']:.6f}
share delta = {after['high_recovery_count']}/{after['recovery_count']} - {before['high_recovery_count']}/{before['recovery_count']} = {delta['share_delta']:.6f}
pooled p = ({before['high_recovery_count']}+{after['high_recovery_count']})/({before['recovery_count']}+{after['recovery_count']})
share z = share delta / sqrt(pooled_p*(1-pooled_p)*(1/{before['recovery_count']}+1/{after['recovery_count']}) + .0025) = {delta['share_z']:.6f}
score = .6*{delta['location_z']:.6f} + .4*{delta['share_z']:.6f} = {pack['detection_score']:.6f}'''
command=f"uv run --project backend matchpulse data/step2/inference/{identity.match_id}.jsonl --debug --output backend/output/demo.json"
write('step2-execution-walkthrough.md',f'''# Walkthrough of an actual held-out event and detection

The example below is the first correctly time-matched strong-bundle alert in fixed holdout manifest order, not a representative accuracy claim. The same match can have unmatched alerts; CLI output shows them too. The overall verdict is NO-GO.

## Run it

After the setup/data-generation commands in README:

```sh
{command}
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
{json.dumps(example['event'],indent=2)}
```

`backend/src/matchpulse/cli.py:main` reads the selected label-free config and builds `MatchIdentity` from the opaque filename. `ingestion.py:load_match` opens only that UUID-named canonical JSONL and calls `validate_stream`. This generator uses `yield` to deliver one validated `CanonicalEvent` at a time. Pydantic's `Annotated` constraints, literal event type and `extra='forbid'` reject malformed values/hidden controls; the model validator checks attacking coordinates using team and period. `None` means unavailable, not zero. Integer sequence, unique ID, actor association and monotone clock/period/score checks preserve ordering and evidence identity. Out-of-play finite ball locations remain legal.

The ID `{example['event']['id']}` is only match-local. A reference is the pair `({identity.match_id}, {example['event']['id']})`; it cannot resolve to a similarly named event in another match. A team-relative position is already canonical and is not re-flipped in signals.

## 2. Replay and causal state

`replay.py:replay` is called with events, opaque identity and config only. It constructs fresh NORTH/SOUTH detectors, a `SignalState`, and a prefix list. Before consuming an event with timestamp beyond the next minute boundary, it finalizes observations at that boundary from existing state. Tied-time events are all consumed before that clock tick is finalized. At prefix EOF it emits only completed boundaries <= the latest observed time. Appending future events cannot revise earlier windows or references; this was checked on all 160 holdout matches plus adversarial unit fixtures.

`signals.py:SignalState.update` appends an immutable `Contribution` dataclass. For this event, membership in recovery/interception/tackle determines recovery support; a `(team,possession,time,actor)` key avoids duplicate related action records. The x location contributes to that team's mean and high-share threshold x>=70m. Other event types can contribute episode, entry or tempo diagnostics. The full prefix updates possession counters so later windows count only newly observed final-third increments. A `deque` prunes old window contributions, while the evidence prefix remains available for audit.

`SignalState.observe` builds adjacent windows with `(start,end]` boundaries. Here they are **({w['before_start']:.0f},{w['split']:.0f}]** and **({w['split']:.0f},{w['after_end']:.0f}]** seconds. It calls `window_stats` independently for each team. No future/full-match mean is used. Half-time resets the positional history and requires two complete windows in the new period before an alert is eligible.

## 3. Actual deterministic facts

Before: {before['recovery_count']} recovery actions, {before['high_recovery_count']} high, mean x={before['mean_recovery_x_m']:.6f}m, high share={before['high_recovery_share']:.6f}. After: {after['recovery_count']} actions, {after['high_recovery_count']} high, mean x={after['mean_recovery_x_m']:.6f}m, high share={after['high_recovery_share']:.6f}. Each window has {before['exposure_seconds']:.0f}s exposure. High recovery rates are {before['high_recovery_rate_per_minute']:.3f} and {after['high_recovery_rate_per_minute']:.3f}/minute. These are recovery actions, not necessarily turnovers or successful presses.

The complete worked calculation used by `signals.py:changes` and `RollingDetector.gate`:

```text
{worked}
```

`RollingDetector.update` also requires minimum samples, mean shift>=6m, share shift>=.08, score>=2, two consecutive checks and cooldown. At the previous minute ({prior.time:.0f}s), score was {prior_score:.6f}; at {current.time:.0f}s it was {pack['detection_score']:.6f}. Persistence plus cooldown suppress some fluctuations; they demonstrably do not suppress enough ordinary-match alerts. The score is an effect-strength heuristic, not probability or statistical significance. The two spatial components are correlated.

## 4. Detection to evidence

The actual detection is `{pack['detection_id']}`, NORTH, emitted at **{pack['detected_at_seconds']:.0f}s**. `evidence.py:build_evidence` hashes opaque match/team/time/config into the deterministic detection ID, copies exact window facts and adds units, definitions and confounding/sparse-data warnings. It includes **{len(pack['calculation_references'])} complete calculation references**, all from the causal prefix, and a separate illustrative list: `{', '.join(pack['illustrative_event_ids'])}`. Examples alone do not prove a count: complete dependencies include events before the displayed windows when needed for episode/cumulative counters.

`verify_evidence` resolves every reference to the canonical prefix, rebuilds SignalState, recalculates facts and the score, verifies exact window semantics/definitions, and checks no future references. It does not trust numbers merely because they were generated by the detector. Unit tests also calculate toy-window counts/means independently and deliberately tamper with counts, scores, references and definitions. All 417 holdout packs passed real recomputation.

`cli.py:main` prints these computed facts, not the hidden policy. All alerts (including unmatched ones) are displayed and exported. Later Python API/agents can consume this Pydantic contract without needing TypeScript state or simulator classes.

## 5. Evaluation is a separate caller

Only `backend/scripts/evaluate.py` reads the scenario manifest. It gives canonical events/identity/config to inference; afterwards `evaluation.py:match_alerts` compares emitted clocks with separate truth. For this example the evaluation-only onset is **{example['evaluation_only_onset_seconds']}s**, so this alert has **{pack['detected_at_seconds']-example['evaluation_only_onset_seconds']:.0f}s** delay under the frozen 600s horizon. That timestamp and policy are absent from the inference interface and EvidencePack.

The development split selected the method; config/source hashes were sealed before holdout scoring. Every correlated seed family stays in one partition. Scenario metadata is used for plots and metrics only. The 160 held-out matches and all failures remain in result artifacts. This one correct example does not change the overall {pct(s['precision'])} precision and {pct(s['recall'])} recall.

## What the next application would own

A future service could stream the same canonical model into replay, persist packs, then pass verified fact keys and evidence references to Foundry. No service, agent or UI exists in this milestone. Current next work is detector/target repair with a new untouched validation set; integration should wait for reliable alert quality.
''')

write('step2-final-verdict.md',f'''# Final verdict: NO-GO for Microsoft Foundry integration

Step 2 implementation and independent evaluation are complete. The software reliably validates/replays observations and produces auditable facts; its alert accuracy is insufficient to justify the next development step on narratives. Do not promote the current research candidate into a convincing tactical-detection demo by hiding failures.

## A. Selected detector

Original rolling spatial-recovery comparison, W=480s, threshold=2, two consecutive one-minute-observation checks, minimum 8 recoveries/window, mean shift>=6m, high-share shift>=.08, cooldown=900s, separate team/period state. Selected solely from development results as best active measured F1 after correcting the silent-detector selection trap. Frozen source/config SHA: `{h['frozen_config_sha256']}`.

## B. Actual independent evidence

32 unseen seed families, 160 matches total; 96 primary accuracy matches and 64 ambiguous stress cases. 64 eligible bundled/moderate interventions: {s['true_positives']} detected, {s['missed_interventions']} missed. Precision **{pct(s['precision'])}**, recall **{pct(s['recall'])}**, F1 **{s['f1']:.3f}**; **{s['null_alerts']}/{s['null_matches']}={s['false_alerts_per_null_match']:.3f} alerts per no-external-intervention match**. Median matched delay **{s['median_delay_seconds']/60:.1f} minutes**, conditional on successful matching. Internal targets precision>=.75, recall>=.70 and null alerts<=.25/match were not met; the delay target alone is not enough.

The model is not a coach-intent classifier. 'False' here means unmatched to the external intervention target; naturally adaptive synthetic matches can contain real observed changes. Those limitations do not justify reporting better accuracy by relabeling after the fact. Detailed denominators, uncertainty and strata are in step2-evaluation-results.md/failure-analysis.md.

## C. Comparison

Rolling had the best active development F1 in a bounded 20-configuration comparison. Guarded Page-Hinkley had lower held-out sensitivity/precision in the frozen candidate. ADWIN emitted no alerts, with undefined precision/delay and zero recall. Location/share ablations did not fix false alarms at their tested settings. Offline PELT was researched but excluded from online claims; neural methods are unjustified. These measurements reject these particular configurations, not every possible implementation of those algorithm families.

## D. Reliability

All 417 EvidencePacks recomputed correctly; all 160 held-out matches had deterministic replay and passing prefix checks. Strict canonical validation, opaque identity, source-index continuity, finite coordinates, real cumulative-counter increments and separate metadata/inference paths are implemented. Exact commands/exits are in verification.json; the current pytest/TypeScript results are in README. The upstream simulator was not modified. Step 1 behavior passed its existing regressions.

## E. Known weaknesses

Frequent ordinary-match spatial swings, wrong-team alerts and pre-intervention alerts dominate precision; moderate/late/sparse changes can be missed. Eight-minute local evidence does not inherit Step 1's 30-minute exploratory effect size. Two related spatial features do not create independent evidence. Synthetic uniform-strength rosters, sparse shots and engine adaptivity limit realism. The code only seeks upward spatial recovery shifts, not all tactical states. Whole-prefix evidence is intentionally verbose and memory grows with match size.

## F. Claims supported now

- A pinned licensed simulator feeds a replaceable canonical event contract and a strict Python inference package.
- The analytical path is causal in implemented replay and tested prefixes, deterministic on these fixtures, and supplies verifiable event-level facts.
- We compared rolling, Page-Hinkley and ADWIN and exposed real independent failures rather than claiming a fixed-time synthetic trigger was intelligent detection.
- All reported held-out numbers come from included seed families/runs, with separate null and ambiguous stress analyses.

## G. Unsupported claims

Do not claim reliable unseen tactical detection, calibrated alert confidence, real Premier League validity, observed coaching decisions, pressing-only causal effects, goal causation, real-world prediction, Foundry integration, dashboard or deployment. No claim that all possible detectors or simulator scenarios are intrinsically unsuitable follows from this grid. The current evidence says **this tested feature/detector pipeline is not ready**.

## H. Decision and next task

**NO-GO for Foundry integration.** Preserve ingestion, signal tests, EvidencePack contract, CLI and evaluation machinery. Next implement a bounded analytics/target-repair experiment on development data, reserve a new untouched seed-family test set, and require adequate precision/recall/null-rate behavior before narration. Do not tune again on these 32 holdout families and call it confirmatory evidence.

## I. Deferred agent contract

After a detector clears validation: **EvidencePack -> Foundry Tactical Analyst -> Broadcast Narrator -> deterministic Grounding Validator**. Input is strictly validated `EvidencePack` schema v1: match/detection IDs, emission time/team, observed change/direction, exact windows, before/after facts, method/uncalibrated score, complete references, definitions and quality warnings. Agents should cite stable fact keys (e.g. facts.after.high_recovery_count), never recalculate authoritative numbers. Grounding validation must resolve citations/numeric references and preserve uncertainty. Full prefix references may later be served by a resolver while the agent receives validated fact handles. That API/service optimization and all agents are planned, not implemented.
''')

# Keep reviewable compact summaries and full local details separate.
for name,data in [('development',dev),('holdout',h)]:
    if name=='development':
        compact={k:v for k,v in data.items() if k!='candidates'}
        compact['candidates']=[{k:v for k,v in r.items() if k!='rows'} for r in data['candidates']]
    else:
        compact={k:v for k,v in data.items() if k not in ['comparisons','selected_result']}
        compact['comparisons']=[{k:v for k,v in r.items() if k!='rows'} for r in data['comparisons']]
        compact['selected_result']={k:v for k,v in data['selected_result'].items() if k!='rows'}
    compact['raw_result_sha256']=sha256((ART/f'{name}.json').read_bytes()).hexdigest()
    (ART/f'{name}-summary.json').write_text(json.dumps(compact,indent=2,allow_nan=False)+'\n')
with (ART/'per-match-results.csv').open('w') as stream:
    fields=['match_id','seed','scenario','onset','alert_count','tp','fp','fn','duplicate_alerts','delay_seconds','end_time_seconds']
    writer=csv.DictWriter(stream,fieldnames=fields,lineterminator="\n");writer.writeheader()
    writer.writerows({k:r[k] for k in fields} for r in rows)
print('Wrote five measured reports, compact summaries and per-match CSV')
