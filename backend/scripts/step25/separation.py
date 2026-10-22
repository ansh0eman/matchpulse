"""Development-only observability gate, before detector construction/selection."""
from __future__ import annotations
from statistics import mean,median,stdev
from collections import defaultdict
import argparse,json
import numpy as np
from scipy.stats import mannwhitneyu
from common import ROOT,ART,manifest,prepare,samples_from_cache,dump
from matchpulse.tracking.windows import TrackingWindows
from matchpulse.tracking.features import FEATURE_NAMES

parser=argparse.ArgumentParser();parser.add_argument('--pilot',action='store_true');args=parser.parse_args()
records=manifest('development-pilot' if args.pilot else 'development')
changes=[];quality=[]
for index,record in enumerate(records):
    cached=prepare(record);samples=samples_from_cache(cached)
    quality.append({k:v for k,v in cached.items() if k not in ['samples','feature_source']})
    window=TrackingWindows(reference_seconds=600,recent_seconds=300,min_recent=4,min_reference=4)
    end=record['planned_onset']+300
    for sample in samples:
        if sample.time>end:break
        if sample.team==record['target_team']:window.update(sample)
    o=window.compare(end,record['target_team'])
    changes.append({'match_id':record['match_id'],'seed':record['seed'],'scenario':record['scenario'],'onset':record['planned_onset'],
        'target_team':record['target_team'],'supported':o is not None,'delta':o.delta if o else None,
        'before':o.before if o else None,'after':o.after if o else None,
        'before_frames':o.before_frames if o else 0,'after_frames':o.after_frames if o else 0})
    if (index+1)%14==0:print(f'Extracted/separation {index+1}/{len(records)}',flush=True)
nulls={r['seed']:r for r in changes if r['scenario']=='null'}
rng=np.random.default_rng(20261023);results={}
for scenario in ['strong','moderate','press_only','tempo','pulse','low_block']:
    rows=[r for r in changes if r['scenario']==scenario]
    byfeature={}
    for feature in FEATURE_NAMES:
        pairs=[(r['delta'][feature],nulls[r['seed']]['delta'][feature]) for r in rows if r['supported'] and nulls[r['seed']]['supported']]
        expected=-1 if feature=='nearest_m' else 1
        if scenario=='low_block':expected*=-1
        if pairs:
            treatment=np.array([a for a,b in pairs]);control=np.array([b for a,b in pairs]);d=treatment-control
            boot=np.array([rng.choice(d,size=len(d),replace=True).mean() for _ in range(1000)])
            sd=float(np.std(control,ddof=1)) if len(control)>1 else None
            auc=float(mannwhitneyu(expected*treatment,expected*control,alternative='greater').statistic/(len(pairs)**2))
            byfeature[feature]={'paired_families':len(pairs),'mean_treatment_change':float(treatment.mean()),'mean_null_change':float(control.mean()),
                'mean_paired_DiD':float(d.mean()),'median_paired_DiD':float(np.median(d)),
                'cluster_bootstrap_95':[float(np.quantile(boot,.025)),float(np.quantile(boot,.975))],
                'expected_direction_fraction':float(np.mean(expected*d>0)),
                'null_change_sd':sd,'effect_over_null_sd':float(d.mean()/sd) if sd and sd>0 else None,
                'development_distribution_auc':auc}
        else:byfeature[feature]={'paired_families':0}
    results[scenario]=byfeature
supported=[r for r in changes if r['supported']]
features=np.array([[r['delta'][k] for k in FEATURE_NAMES] for r in supported])
correlation=np.nan_to_num(np.corrcoef(features,rowvar=False),nan=0).tolist() if len(features)>1 else []
output={'unit':'seed family, not frames','split':'development','records':len(records),'supported_changes':len(supported),
    'unsupported_changes':len(changes)-len(supported),'window':'(onset-300,onset] versus (onset,onset+300]; context matched',
    'results':results,'quality':{'frame_count':sum(q['frame_count'] for q in quality),'invalid_owner_frames':sum(q['invalid_owner_frames'] for q in quality),'gaps':sum(q['gap_count'] for q in quality)},
    'feature_names':FEATURE_NAMES,'correlation':correlation,'changes':changes}
name='pilot-separation' if args.pilot else 'feature-separation'
dump(ART/f'{name}-detail.json',output)
dump(ART/f'{name}.json',{k:v for k,v in output.items() if k!='changes'})
print(json.dumps({'quality':output['quality'],'supported':len(supported),'total':len(changes),
    'strong_primary':{k:results['strong'][k] for k in ['line3_m','nearest_m','density10']}},indent=2))
