"""Research candidate development/validation/freeze; holdout untouched until sealed."""
from __future__ import annotations
import argparse,json,hashlib,gzip,time
from dataclasses import asdict
import numpy as np
from scipy.optimize import minimize
from common import ROOT,DATA,ART,manifest,prepare,samples_from_cache,dump,digest
from matchpulse.schemas import MatchIdentity
from matchpulse.ingestion import load_match
from matchpulse.detectors.rolling import DetectorConfig
from matchpulse.replay import replay as event_replay
from matchpulse.tracking.detector import TrackingConfig,model_vector
from matchpulse.tracking.replay import comparisons_from_samples,detect
from matchpulse.evaluation import match_alerts,cluster_intervals,summarize

PRIMARY={'null','strong','moderate','press_only','low_block'}

def load_data(split):
    data={};records=manifest(split)
    for i,record in enumerate(records):
        cache=prepare(record)
        identity=MatchIdentity(match_id=record['match_id'])
        data[record['match_id']]={'cache':cache,'samples':samples_from_cache(cache),
            'events_path':DATA/'inference'/f'{identity.match_id}.jsonl'}
        if (i+1)%28==0:print(f'{split} validated features/events {i+1}/{len(records)}',flush=True)
    return records,data

def score(config,records,data,model=None):
    rows=[];start=time.perf_counter()
    for record in records:
        item=data[record['match_id']];cache=item['cache']
        events=list(load_match(item['events_path'],MatchIdentity(match_id=record['match_id']))) if config is None or config.method=='fused' else []
        if config is None:
            packs=event_replay(iter(events),MatchIdentity(match_id=record['match_id']),DetectorConfig.model_validate_json((ROOT/'backend/config/selected.json').read_text()))
            alerts=[{'time':p.detected_at_seconds,'team':p.team_id,'direction':'advance','score':p.detection_score} for p in packs]
        else:
            comparisons=comparisons_from_samples(item['samples'],cache['end_time'],config,cache['period_starts'])
            found=detect(comparisons,config,iter(events),model)
            alerts=[{'time':a.comparison.time,'team':a.comparison.team,'direction':a.direction,'score':a.score} for a in found]
        onset=record['changes'][0]['time_seconds'] if record['scenario'] not in ['null','tempo','pulse'] else None
        rows.append({'match_id':record['match_id'],'seed':record['seed'],'scenario':record['scenario'],'target_team':record['target_team'],
            'expected_direction':record['expected_direction'],'onset':onset,'alerts':alerts,'end_time_seconds':record['end_time_seconds']})
    return {'config':config.model_dump() if config else {'method':'event_baseline'},'rows':rows,
        'metrics':{str(h):metrics(rows,h) for h in [600,1200]},'seconds':time.perf_counter()-start}

def score_many(configs,records,data,models):
    """Evaluate each independent detector on shared immutable comparisons, one match at a time."""
    results=[{'config':c.model_dump() if c else {'method':'event_baseline'},'rows':[],'seconds':0.} for c in configs]
    for index,record in enumerate(records):
        item=data[record['match_id']];cache=item['cache'];observations={}
        events=None
        for c,result in zip(configs,results):
            start=time.perf_counter()
            if c is None or c.method=='fused':
                if events is None:events=list(load_match(item['events_path'],MatchIdentity(match_id=record['match_id'])))
            if c is None:
                packs=event_replay(iter(events),MatchIdentity(match_id=record['match_id']),DetectorConfig.model_validate_json((ROOT/'backend/config/selected.json').read_text()))
                alerts=[{'time':p.detected_at_seconds,'team':p.team_id,'direction':'advance','score':p.detection_score} for p in packs]
            else:
                key=(c.method!='unconditioned',c.reference_seconds,c.recent_seconds,c.cadence_seconds,c.min_reference,c.min_recent)
                if key not in observations:
                    observations[key]=list(comparisons_from_samples(item['samples'],cache['end_time'],c,cache['period_starts']))
                found=detect(iter(observations[key]),c,iter(events or ()),models.get(c.model_id))
                alerts=[{'time':a.comparison.time,'team':a.comparison.team,'direction':a.direction,'score':a.score} for a in found]
            onset=record['changes'][0]['time_seconds'] if record['scenario'] not in ['null','tempo','pulse'] else None
            result['rows'].append({'match_id':record['match_id'],'seed':record['seed'],'scenario':record['scenario'],'target_team':record['target_team'],
                'expected_direction':record['expected_direction'],'onset':onset,'alerts':alerts,'end_time_seconds':record['end_time_seconds']})
            result['seconds']+=time.perf_counter()-start
        if (index+1)%14==0:print(f'Compared all candidates {index+1}/{len(records)}',flush=True)
    for result in results:result['metrics']={str(h):metrics(result['rows'],h) for h in [600,1200]}
    return results

def matched(row,horizon):
    onset=row['onset'];alerts=row['alerts']
    eligible=[a for a in alerts if onset is not None and a['team']==row['target_team'] and a['direction']==row['expected_direction'] and onset<=a['time']<=onset+horizon]
    first=min(eligible,key=lambda a:a['time']) if eligible else None
    return {'tp':int(first is not None),'fp':len(alerts)-int(first is not None),'fn':int(onset is not None and first is None),
        'duplicate_alerts':max(0,len(eligible)-1),'delay_seconds':first['time']-onset if first else None,
        'wrong_team_alerts':sum(a['team']!=row['target_team'] for a in alerts) if onset is not None else 0,
        'early_alerts':sum(a['time']<onset for a in alerts) if onset is not None else 0}

def metrics(rows,horizon):
    selected=[r for r in rows if r['scenario'] in PRIMARY]
    converted=[{**r,'scenario':'null' if r['scenario']=='null' else 'bundle','alert_count':len(r['alerts']),**matched(r,horizon)} for r in selected]
    base=summarize(converted)
    base['wrong_team_alerts']=sum(matched(r,horizon)['wrong_team_alerts'] for r in selected)
    base['early_alerts']=sum(matched(r,horizon)['early_alerts'] for r in selected)
    base['per_scenario']={scenario:{'matches':sum(r['scenario']==scenario for r in rows),
        'eligible':sum(r['onset'] is not None for r in rows if r['scenario']==scenario),
        'hits':sum(matched(r,horizon)['tp'] for r in rows if r['scenario']==scenario),
        'alerts':sum(len(r['alerts']) for r in rows if r['scenario']==scenario)} for scenario in ['null','strong','moderate','press_only','low_block','tempo','pulse']}
    return base

def grid(models):
    configs=[None]
    for method in ['unconditioned','conditioned']:
        for threshold in [3.,5.,7.]:configs.append(TrackingConfig(method=method,line_threshold_m=threshold))
    for threshold in [5.,7.]:configs.append(TrackingConfig(method='fused',line_threshold_m=threshold))
    for threshold in [12.,24.]:configs.append(TrackingConfig(method='cusum',cusum_threshold=threshold,line_threshold_m=2.5))
    for model_id in models:
        for threshold in [.5,.75]:configs.append(TrackingConfig(method='logistic',model_id=model_id,model_threshold=threshold,line_threshold_m=2.5))
    configs.append(TrackingConfig(method='conditioned',line_threshold_m=5.,cadence_seconds=60))
    return configs

def fit_models(records,data):
    x=[];y=[];families=[]
    config=TrackingConfig()
    for record in records:
        if record['scenario'] not in PRIMARY:continue
        item=data[record['match_id']];cache=item['cache']
        times={record['planned_onset']-60:0,record['planned_onset']+300:int(record['scenario']!='null')}
        for t,team,o in comparisons_from_samples(item['samples'],cache['end_time'],config,cache['period_starts']):
            if team==record['target_team'] and t in times and o is not None:
                x.append(model_vector(o));y.append(times[t]);families.append(record['seed'])
    x=np.asarray(x);y=np.asarray(y);mu=x.mean(0);scale=np.maximum(x.std(0),.1);z=(x-mu)/scale
    models={}
    for penalty in [1.,10.]:
        def loss(beta):
            logits=z@beta[:3]+beta[3]
            return np.logaddexp(0,logits).sum()-(y*logits).sum()+penalty*(beta[:3]@beta[:3])/2
        def jac(beta):
            logits=np.clip(z@beta[:3]+beta[3],-40,40);error=1/(1+np.exp(-logits))-y
            return np.r_[z.T@error+penalty*beta[:3],error.sum()]
        result=minimize(loss,np.zeros(4),jac=jac,method='L-BFGS-B')
        if not result.success:raise ValueError('Logistic optimization failed: '+result.message)
        model={'mean':mu.tolist(),'scale':scale.tolist(),'weights':result.x[:3].tolist(),'intercept':float(result.x[3]),
            'features':['absolute_line3_delta','direction_aligned_carrier_closing','direction_aligned_density10_delta'],
            'score_semantics':'uncalibrated sigmoid score, not validated probability'}
        model_id=f'logistic_l2_{int(penalty)}';models[model_id]=model
    return models,{'examples':len(y),'positive_examples':int(y.sum()),'independent_families':len(set(families)),
        'selection':'one pre and one +300s window per primary scenario; unsupported windows excluded from training, not evaluation'}

def rank(result):
    s=result['metrics']['600'];return (s['true_positives']>0,s['false_alerts_per_null_match']<=.25,s['f1'] or 0,s['precision'] or 0,-(s['median_delay_seconds'] or 999999))

def hashes():
    names=sorted((ROOT/'backend/src/matchpulse/tracking').glob('*.py'))
    names += [ROOT/name for name in ['backend/scripts/step25/compare.py','backend/scripts/step25/common.py','backend/uv.lock','backend/src/matchpulse/evaluation.py','backend/src/matchpulse/replay.py','backend/src/matchpulse/signals.py','backend/src/matchpulse/schemas.py','backend/src/matchpulse/ingestion.py','backend/src/matchpulse/detectors/rolling.py','backend/config/selected.json','poc/src/simulation.ts','poc/src/tracking/schema.ts','poc/src/tracking/generate.ts']]
    return {str(p.relative_to(ROOT)):digest(p) for p in names}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('stage',choices=['development','validation','holdout']);args=parser.parse_args()
    if args.stage=='development':
        separation=json.loads((ART/'feature-separation.json').read_text())
        if separation['results']['strong']['line3_m']['development_distribution_auc']<.75:raise ValueError('Feature separation gate failed: no classifier is justified')
        records,data=load_data('development');models,training=fit_models(records,data);dump(ART/'models.json',models)
        configs=grid(models);results=score_many(configs,records,data,models)
        dump(ART/'development-detail.json',{'training':training,'results':results})
        dump(ART/'development-summary.json',{'training':training,'results':[{k:v for k,v in r.items() if k!='rows'} for r in results]})
        print('Development comparison complete',len(results),'candidates')
    elif args.stage=='validation':
        models=json.loads((ART/'models.json').read_text());records,data=load_data('validation')
        results=score_many(grid(models),records,data,models)
        selected=max(results,key=rank)
        dump(ART/'validation-detail.json',{'results':results,'selected':selected['config']})
        dump(ART/'validation-summary.json',{'results':[{k:v for k,v in r.items() if k!='rows'} for r in results],'selected':selected['config']})
        # Preserve each method's validation finalist for diagnostic final comparison; no holdout selection.
        finalists={}
        for result in results:
            method=result['config']['method']
            if method not in finalists or rank(result)>rank(finalists[method]):finalists[method]=result
        frozen={'selected':selected['config'],'finalists':{k:r['config'] for k,r in finalists.items()},'models':models,
            'source_hashes':hashes(),'protocol_sha256':digest(ROOT/'research/step25/protocol.json'),
            'training_manifest_sha256':digest(DATA/'evaluation/development-manifest.json'),
            'validation_manifest_sha256':digest(DATA/'evaluation/validation-manifest.json'),
            'development_seeds':sorted({r['seed'] for r in manifest('development')}),
            'validation_seeds':sorted({r['seed'] for r in records})}
        dump(ART/'frozen.json',frozen);(ART/'frozen.sha256').write_text(digest(ART/'frozen.json')+'\n')
        if selected['config']['method']!='event_baseline':
            dump(ART/'selected.json',selected['config'])
            if selected['config'].get('model_id'):dump(ART/'selected-model.json',models[selected['config']['model_id']])
        print(json.dumps({'selected':selected['config'],'validation_metrics':selected['metrics']['600']},indent=2))
    else:
        frozen=json.loads((ART/'frozen.json').read_text())
        if digest(ART/'frozen.json')!=(ART/'frozen.sha256').read_text().strip() or frozen['source_hashes']!=hashes():raise ValueError('Frozen configuration/source changed')
        if frozen['protocol_sha256']!=digest(ROOT/'research/step25/protocol.json'):raise ValueError('Frozen protocol changed')
        records,data=load_data('holdout')
        old=set(frozen['development_seeds'])|set(frozen['validation_seeds'])
        if old & {r['seed'] for r in records}:raise ValueError('Seed leakage')
        configs=[None if raw['method']=='event_baseline' else TrackingConfig(**raw) for raw in frozen['finalists'].values()]
        results=score_many(configs,records,data,frozen['models'])
        selected=next(r for r in results if r['config']==frozen['selected'])
        for horizon in [600,1200]:
            converted=[{**r,'scenario':'null' if r['scenario']=='null' else 'bundle','alert_count':len(r['alerts']),**matched(r,horizon)} for r in selected['rows'] if r['scenario'] in PRIMARY]
            selected['metrics'][str(horizon)]['cluster_intervals']=cluster_intervals(converted)
        dump(ART/'holdout-detail.json',{'results':results,'selected':selected,'frozen_sha256':digest(ART/'frozen.json')})
        dump(ART/'holdout-summary.json',{'results':[{k:v for k,v in r.items() if k!='rows'} for r in results],'selected_config':frozen['selected'],
            'selected_metrics':selected['metrics'],'frozen_sha256':digest(ART/'frozen.json')})
        print(json.dumps(selected['metrics'],indent=2))

if __name__=='__main__':main()
