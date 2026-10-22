"""Prespecified development diagnostics, never final-holdout tuning."""
from __future__ import annotations
import json,gzip,time,resource
from collections import defaultdict
from statistics import mean,median,stdev
import numpy as np
from scipy.stats import mannwhitneyu
from common import ROOT,DATA,ART,manifest,prepare,samples_from_cache,dump
from matchpulse.schemas import MatchIdentity
from matchpulse.ingestion import load_match
from matchpulse.signals import SignalState,changes
from matchpulse.tracking.ingestion import load_frames
from matchpulse.tracking.windows import TrackingWindows
from matchpulse.tracking.detector import TrackingConfig
from matchpulse.tracking.replay import comparisons_from_frames,comparisons_from_samples,detect

start=time.perf_counter();records=manifest('development');secondary=[];event_rows=[];strata=[]
for i,r in enumerate(records):
    cached=prepare(r);samples=samples_from_cache(cached);onset=r['planned_onset'];end=onset+600
    window=TrackingWindows(reference_seconds=900,recent_seconds=600,min_recent=4,min_reference=4)
    for s in samples:
        if s.time>end:break
        if s.team==r['target_team']:window.update(s)
    o=window.compare(end,r['target_team'])
    secondary.append({'seed':r['seed'],'scenario':r['scenario'],'delta':o.delta if o else None})
    state=SignalState(300)
    for e in load_match(DATA/'inference'/f"{r['match_id']}.jsonl",MatchIdentity(match_id=r['match_id'])):
        if e.time_seconds>onset+300:break
        state.update(e)
    observation=state.observe(onset+300,r['target_team']);delta=changes(observation.before,observation.after)
    supported=min(observation.before.recovery_count,observation.after.recovery_count)>=4
    event_rows.append({'seed':r['seed'],'scenario':r['scenario'],'supported':supported,'delta':delta,
        'before_recoveries':observation.before.recovery_count,'after_recoveries':observation.after.recovery_count})
    strata.append({'seed':r['seed'],'scenario':r['scenario'],'onset':onset,'team':r['target_team'],
        'score_contexts':sorted({s.context[1] for s in samples if onset<s.time<=onset+300 and s.team==r['target_team']}),
        'eligible_frames_pre':sum(onset-300<s.time<=onset and s.team==r['target_team'] for s in samples),
        'eligible_frames_post':sum(onset<s.time<=onset+300 and s.team==r['target_team'] for s in samples)})
    if (i+1)%28==0:print(f'Development diagnostics {i+1}/{len(records)}',flush=True)

def summaries(rows,keys):
    null={r['seed']:r for r in rows if r['scenario']=='null'};out={}
    for scenario in ['strong','moderate','press_only','low_block','tempo','pulse']:
        out[scenario]={}
        for feature in keys:
            pairs=[(r['delta'][feature],null[r['seed']]['delta'][feature]) for r in rows if r['scenario']==scenario and r['delta'] is not None and null[r['seed']]['delta'] is not None and r.get('supported',True) and null[r['seed']].get('supported',True)]
            direction=(-1 if feature=='nearest_m' else 1)*(-1 if scenario=='low_block' else 1)
            if pairs:
                a=np.array([x for x,y in pairs]);b=np.array([y for x,y in pairs])
                out[scenario][feature]={'pairs':len(pairs),'mean_paired_difference':float((a-b).mean()),
                    'directional_auc':float(mannwhitneyu(direction*a,direction*b).statistic/len(pairs)**2)}
            else:out[scenario][feature]={'pairs':0}
    return out
freq=[]
for i,r in enumerate(manifest('development-2hz')):
    ident=MatchIdentity(match_id=r['match_id']);one=list(load_frames(DATA/'inference'/f'{ident.match_id}.tracking.jsonl.gz',ident))
    two=list(load_frames(DATA/'diagnostic'/f'{ident.match_id}.tracking.jsonl.gz',ident));at={f.time_seconds:f for f in two};equal=True
    for f in one:
        a=f.model_dump();b=at[f.time_seconds].model_dump()
        for k in ['frame_id','sequence']:a.pop(k);b.pop(k)
        equal &= a==b
    c=TrackingConfig();cache=prepare(next(q for q in records if q['match_id']==r['match_id']));sample_cache=samples_from_cache(cache)
    raw=list(comparisons_from_frames(iter(one),c));cached=list(comparisons_from_samples(sample_cache,cache['end_time'],c,cache['period_starts']))
    if raw!=cached:raise ValueError('Raw/cache comparison mismatch')
    a=detect(iter(raw),c);b=detect(comparisons_from_frames(iter(two),c),c)
    scaled=detect(comparisons_from_frames(iter(two),c.model_copy(update={'min_reference':24,'min_recent':12})),c.model_copy(update={'min_reference':24,'min_recent':12}))
    sig=lambda alerts:[(x.comparison.time,x.comparison.team,x.direction) for x in alerts]
    freq.append({'match_id':r['match_id'],'integer_second_frames_equal':equal,'raw_cache_exact':True,
        'canonical_hash_equal':r['event_sha256']==next(q['event_sha256'] for q in records if q['match_id']==r['match_id']),
        'one_hz_alerts':sig(a),'two_hz_alerts':sig(b),'same_alert_schedule':sig(a)==sig(b),'two_hz_exposure_scaled_alerts':sig(scaled),'same_alert_schedule_scaled':sig(a)==sig(scaled)})
    print(f'Cadence diagnosis {i+1}/28',flush=True)
output={'secondary_window':'(onset-300,onset] versus (onset,onset+600] context reweighted',
    'secondary_separation':summaries(secondary,['line3_m','nearest_m','density10']),
    'event_separation':summaries(event_rows,['location_delta_m','share_delta']),
    'event_windows_supported':sum(r['supported'] for r in event_rows),'event_windows_total':len(event_rows),
    'frequency':freq,'frequency_equal_alert_schedules':sum(r['same_alert_schedule'] for r in freq),
    'seconds':time.perf_counter()-start,'peak_rss_bytes':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss}
dump(ART/'diagnostics.json',output);dump(ART/'diagnostics-detail.json',{'secondary':secondary,'event':event_rows,'support_strata':strata})
print(json.dumps({k:v for k,v in output.items() if k not in ['frequency','secondary_separation','event_separation']},indent=2))
