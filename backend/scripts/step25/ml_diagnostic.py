"""Diagnostic calibration of the frozen logistic finalist on its fixed-window task."""
import json,math
import numpy as np
from common import ART,manifest,prepare,samples_from_cache,dump
from compare import PRIMARY
from matchpulse.tracking.detector import TrackingConfig,logistic_score
from matchpulse.tracking.replay import comparisons_from_samples
frozen=json.loads((ART/'frozen.json').read_text());config=TrackingConfig(**frozen['finalists']['logistic']);model=frozen['models'][config.model_id]
pred=[];truth=[];families=[];total=0
for r in manifest('holdout'):
    if r['scenario'] not in PRIMARY:continue
    total+=2;cache=prepare(r);times={r['planned_onset']-60:0,r['planned_onset']+300:int(r['scenario']!='null')}
    for t,team,o in comparisons_from_samples(samples_from_cache(cache),cache['end_time'],config,cache['period_starts']):
        if team==r['target_team'] and t in times and o:
            pred.append(logistic_score(o,model));truth.append(times[t]);families.append(r['seed'])
pred=np.array(pred);truth=np.array(truth);bins=[]
for lo,hi in zip(np.arange(0,1,.2),np.arange(.2,1.01,.2)):
    mask=(pred>=lo)&(pred<=hi if hi>.99 else pred<hi)
    bins.append({'lower':float(lo),'upper':float(hi),'count':int(mask.sum()),'mean_score':float(pred[mask].mean()) if mask.any() else None,'positive_fraction':float(truth[mask].mean()) if mask.any() else None})
ece=sum(b['count']*abs(b['mean_score']-b['positive_fraction']) for b in bins if b['count'])/len(pred)
dump(ART/'ml-calibration-diagnostic.json',{'task':'Fixed pre/onset+300 windows, external intervention label; not full-match alert precision or a broadcast confidence',
    'model_id':config.model_id,'families':len(set(families)),'eligible_examples':total,'supported_examples':len(pred),'positives':int(truth.sum()),
    'brier':float(np.mean((pred-truth)**2)),'five_bin_ece':ece,'bins':bins,'no_calibration_or_threshold_fit_on_this_holdout':True})
print('Frozen model calibration diagnostic complete',len(pred),'supported fixed windows')
