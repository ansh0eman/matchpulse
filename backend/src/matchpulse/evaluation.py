"""Evaluation-only labels and matching. Never imported by production replay."""
from __future__ import annotations
from statistics import median
from math import sqrt

HORIZON_SECONDS=600
PRIMARY_SCENARIOS=frozenset({'null','bundle','moderate'})

def match_alerts(alerts: list[dict], onset: float | None, team: str='NORTH', horizon: int=HORIZON_SECONDS) -> dict:
    ordered=sorted(alerts,key=lambda a:(a['time'],a['team']))
    eligible=[a for a in ordered if onset is not None and a['team']==team and onset<=a['time']<=onset+horizon]
    chosen=eligible[0] if eligible else None
    return {'tp':int(chosen is not None),'fp':len(ordered)-int(chosen is not None),
        'fn':int(onset is not None and chosen is None),'duplicate_alerts':max(0,len(eligible)-1),
        'delay_seconds':chosen['time']-onset if chosen is not None else None}

def summarize(rows: list[dict]) -> dict:
    primary=[r for r in rows if r['scenario'] in PRIMARY_SCENARIOS]
    nulls=[r for r in rows if r['scenario']=='null']
    tp=sum(r['tp'] for r in primary); fp=sum(r['fp'] for r in primary); fn=sum(r['fn'] for r in primary)
    delays=[r['delay_seconds'] for r in primary if r['delay_seconds'] is not None]
    precision=tp/(tp+fp) if tp+fp else None
    recall=tp/(tp+fn) if tp+fn else None
    return {'independent_seed_families':len(set(r['seed'] for r in rows)),
        'primary_matches':len(primary),'eligible_interventions':tp+fn,'true_positives':tp,'false_positives':fp,
        'missed_interventions':fn,'precision':precision,'recall':recall,
        'f1':2*tp/(2*tp+fp+fn) if 2*tp+fp+fn else None,
        'null_matches':len(nulls),'null_alerts':sum(r['alert_count'] for r in nulls),
        'false_alerts_per_null_match':sum(r['alert_count'] for r in nulls)/len(nulls) if nulls else None,
        'false_alerts_per_null_90_minutes':sum(r['alert_count'] for r in nulls)/(sum(r['end_time_seconds'] for r in nulls)/5400) if nulls else None,
        'median_delay_seconds':median(delays) if delays else None,
        'delay_seconds':delays,'duplicate_alerts':sum(r['duplicate_alerts'] for r in primary),
        'stress':{s:{'matches':sum(r['scenario']==s for r in rows),'alerts':sum(r['alert_count'] for r in rows if r['scenario']==s)} for s in ('tempo','pulse')}}

def cluster_intervals(rows:list[dict], repeats:int=1000) -> dict:
    import random
    rng=random.Random(20261022)
    seeds=sorted(set(r['seed'] for r in rows))
    groups={seed:[r for r in rows if r['seed']==seed] for seed in seeds}
    keys=['precision','recall','f1','false_alerts_per_null_match','median_delay_seconds']
    samples={k:[] for k in keys}
    for _ in range(repeats):
        selected=[row for seed in rng.choices(seeds,k=len(seeds)) for row in groups[seed]]
        stats=summarize(selected)
        for key in keys:
            if stats[key] is not None: samples[key].append(stats[key])
    return {k:{'lower':sorted(v)[int(.025*(len(v)-1))] if v else None,
        'upper':sorted(v)[int(.975*(len(v)-1))] if v else None,'valid_bootstrap_samples':len(v)} for k,v in samples.items()}
