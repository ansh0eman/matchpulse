"""Fixed-feature final replication; no candidate selection or parameter changes."""
import json
import numpy as np
from common import ART,manifest,prepare,samples_from_cache,dump
from matchpulse.tracking.windows import TrackingWindows
rows=[]
for r in manifest('holdout'):
    cache=prepare(r);window=TrackingWindows(600,300,4,4);end=r['planned_onset']+300
    for s in samples_from_cache(cache):
        if s.time>end:break
        if s.team==r['target_team']:window.update(s)
    o=window.compare(end,r['target_team']);rows.append({'seed':r['seed'],'scenario':r['scenario'],'delta':o.delta if o else None})
nulls={r['seed']:r for r in rows if r['scenario']=='null'};out={};rng=np.random.default_rng(20261023)
for scenario in ['strong','moderate','press_only','low_block','tempo','pulse']:
    out[scenario]={}
    for feature in ['line3_m','nearest_m','density10']:
        d=np.asarray([r['delta'][feature]-nulls[r['seed']]['delta'][feature] for r in rows if r['scenario']==scenario and r['delta'] and nulls[r['seed']]['delta']])
        boot=np.array([rng.choice(d,len(d),replace=True).mean() for _ in range(1000)])
        out[scenario][feature]={'supported_pairs':len(d),'mean_paired_difference':float(d.mean()),'family_bootstrap95':[float(np.quantile(boot,.025)),float(np.quantile(boot,.975))]}
dump(ART/'holdout-feature-replication.json',{'note':'Fixed development definitions, reported after freeze; no retuning','supported_windows':sum(r['delta'] is not None for r in rows),'all_windows':len(rows),'results':out})
print(json.dumps(out,indent=2))
