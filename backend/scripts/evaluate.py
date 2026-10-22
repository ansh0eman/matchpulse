"""Bounded development selection and one frozen holdout evaluation."""
from __future__ import annotations
import argparse
from dataclasses import asdict
from hashlib import sha256
import json
from pathlib import Path
from time import perf_counter
from matchpulse.ingestion import load_match
from matchpulse.schemas import MatchIdentity
from matchpulse.replay import observations, replay
from matchpulse.signals import Observation, WindowStats
from matchpulse.detectors.rolling import DetectorConfig
from matchpulse.detectors.streaming import make_detector
from matchpulse.evaluation import match_alerts, summarize, cluster_intervals
from matchpulse.evidence import verify_evidence

ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/'data/step2'
OUT=ROOT/'research/step2-artifacts'

def source_hashes():
    return {str(path.relative_to(ROOT)):sha256(path.read_bytes()).hexdigest()
        for path in sorted((ROOT/'backend/src/matchpulse').rglob('*.py'))}

def dump(path:Path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(value,indent=2,allow_nan=False)+'\n')

def cache_observations(records, windows):
    cache={}
    started=perf_counter()
    for index,record in enumerate(records):
        identity=MatchIdentity(match_id=record['match_id'])
        path=DATA/'inference'/f'{identity.match_id}.jsonl'
        if sha256(path.read_bytes()).hexdigest()!=record['sha256']: raise ValueError('Dataset hash mismatch')
        events=list(load_match(path,identity))
        for window in windows:
            cache[(identity.match_id,window)]=list(observations(events,window))
        if (index+1)%20==0: print(f'Validated/features {index+1}/{len(records)}',flush=True)
    return cache,perf_counter()-started

def score(config,records,cache):
    rows=[]
    started=perf_counter()
    for record in records:
        detectors={team:make_detector(config) for team in ('NORTH','SOUTH')}
        alerts=[]
        for observation in cache[(record['match_id'],config.window_seconds)]:
            alert=detectors[observation.team].update(observation)
            if alert: alerts.append({'time':alert.time,'team':alert.team,'score':alert.score})
        onset=record['changes'][0]['time_seconds'] if record['eligible'] else None
        matched=match_alerts(alerts,onset)
        rows.append({**{k:record[k] for k in ('match_id','seed','scenario','end_time_seconds')},
            'onset':onset,'alert_count':len(alerts),'alerts':alerts,**matched})
    return {'config':config.model_dump(),'summary':summarize(rows),'rows':rows,
        'detector_seconds':perf_counter()-started}

def candidates():
    result=[]
    for window in (300,480,600):
        for threshold in (1.,1.5,2.):
            result.append(DetectorConfig(window_seconds=window,threshold=threshold))
    for stream_threshold in (.2,.4,.8):
        for threshold in (1.,1.5):
            result.append(DetectorConfig(method='page_hinkley',window_seconds=480,threshold=threshold,stream_threshold=stream_threshold))
    for delta in (.01,.05,.2):
        result.append(DetectorConfig(method='adwin',window_seconds=480,threshold=1.,adwin_delta=delta))
    for feature in ('location','share'):
        result.append(DetectorConfig(features=feature,window_seconds=480,threshold=1.5))
    return result

def rank(result):
    s=result['summary']
    # Predeclared: first respect null alert target, then F1, precision, lower delay.
    return (s['true_positives']>0,s['false_alerts_per_null_match']<=.25,s['f1'] or 0,s['precision'] or 0,-(s['median_delay_seconds'] or 100000))

def main():
    parser=argparse.ArgumentParser();parser.add_argument('stage',choices=['development','holdout']);args=parser.parse_args()
    manifest=json.loads((DATA/'evaluation'/f'{args.stage}-manifest.json').read_text())
    records=manifest['records']
    OUT.mkdir(parents=True,exist_ok=True)
    if args.stage=='development':
        configs=candidates()
        cache,feature_seconds=cache_observations(records,sorted(set(c.window_seconds for c in configs)))
        results=[score(c,records,cache) for c in configs]
        selected=max(results,key=rank)
        result={'selection_rule':'Active candidates first (at least one true detection), then null alerts <=0.25, F1, precision, lower median delay; stable grid order breaks ties. No target-satisfying active method means failure, not GO.',
            'feature_seconds':feature_seconds,'candidates':results,'selected':selected['config']}
        dump(OUT/'development.json',result)
        # Freeze selected config and best configuration of each compared family BEFORE holdout.
        finalists={method:max([r for r in results if r['config']['method']==method and r['config']['features']=='both'],key=rank)['config'] for method in ('rolling','page_hinkley','adwin')}
        frozen={'selected':selected['config'],'finalists':finalists,'protocol':manifest['protocol'],
            'development_manifest_sha256':sha256((DATA/'evaluation/development-manifest.json').read_bytes()).hexdigest(),
            'development_seeds':sorted(set(r['seed'] for r in records)),
            'selection_completed_before_holdout':True,'inference_source_sha256':source_hashes()}
        dump(OUT/'frozen-config.json',frozen)
        dump(ROOT/'backend/config/selected.json',selected['config'])
        (OUT/'frozen-config.sha256').write_text(sha256((OUT/'frozen-config.json').read_bytes()).hexdigest()+'\n')
        print(json.dumps({'selected':selected['config'],'development':selected['summary']},indent=2))
    else:
        frozen_path=OUT/'frozen-config.json'
        digest=sha256(frozen_path.read_bytes()).hexdigest()
        if digest!=(OUT/'frozen-config.sha256').read_text().strip(): raise ValueError('Frozen config hash changed')
        frozen=json.loads(frozen_path.read_text())
        if set(frozen['development_seeds']) & {r['seed'] for r in records}: raise ValueError('Split overlap')
        if frozen['inference_source_sha256']!=source_hashes(): raise ValueError('Frozen inference source changed')
        configs=[DetectorConfig(**c) for c in frozen['finalists'].values()]
        selected=DetectorConfig(**frozen['selected'])
        if selected not in configs: configs.append(selected)
        cache,feature_seconds=cache_observations(records,sorted(set(c.window_seconds for c in configs)))
        comparisons=[score(c,records,cache) for c in configs]
        final=next(r for r in comparisons if r['config']==selected.model_dump())
        final['cluster_bootstrap_95_intervals']=cluster_intervals(final['rows'])
        # Independently exercise the real inference/evidence path for every holdout match.
        validity=0;total=0;deterministic=True;prefix_invariant=True;replay_seconds=0.;validation_seconds=0.;example=None
        for index,record in enumerate(records):
            identity=MatchIdentity(match_id=record['match_id'])
            started=perf_counter();events=list(load_match(DATA/'inference'/f'{identity.match_id}.jsonl',identity))
            validation_seconds+=perf_counter()-started
            started=perf_counter();packs=replay(iter(events),identity,selected);replay_seconds+=perf_counter()-started
            expected=next(r for r in final['rows'] if r['match_id']==identity.match_id)['alerts']
            actual=[{'time':p.detected_at_seconds,'team':p.team_id,'score':p.detection_score} for p in packs]
            if expected!=actual: raise AssertionError('Cached observations and inference diverged')
            for pack in packs:
                total+=1;validity+=int(verify_evidence(pack,events))
            # Every match: repeat fast deterministic replay, including EvidencePack identity/facts/references.
            deterministic &= [p.model_dump() for p in packs]==[p.model_dump() for p in replay(iter(events),identity,selected)]
            cutoff=3660.
            prefix_packs=replay(iter(e for e in events if e.time_seconds<=cutoff),identity,selected)
            prefix_invariant &= prefix_packs==[p for p in packs if p.detected_at_seconds<=cutoff]
            if packs:
                dump(ROOT/'backend/output'/f'{identity.match_id}.evidence.json',[p.model_dump() for p in packs])
            if example is None and record['scenario']=='bundle' and any(p.team_id=='NORTH' and record['changes'][0]['time_seconds']<=p.detected_at_seconds<=record['changes'][0]['time_seconds']+600 for p in packs):
                pack=next(p for p in packs if p.team_id=='NORTH' and record['changes'][0]['time_seconds']<=p.detected_at_seconds<=record['changes'][0]['time_seconds']+600)
                example={'match_id':identity.match_id,'event':next(e.model_dump() for e in events if e.id==pack.illustrative_event_ids[0]),'pack':pack.model_dump(),
                    'evaluation_only_onset_seconds':record['changes'][0]['time_seconds']}
                dump(OUT/'example-evidence.json',example)
            if (index+1)%20==0: print(f'Evidence verified {index+1}/{len(records)}',flush=True)
        dump(OUT/'holdout.json',{'frozen_config_sha256':digest,'feature_seconds':feature_seconds,'comparisons':comparisons,
            'selected_result':final,'evidence':{'valid':validity,'total':total,'deterministic_replay':deterministic,'prefix_invariant':prefix_invariant,'prefix_checks':len(records)},
            'performance':{'validation_seconds':validation_seconds,'replay_seconds':replay_seconds,'matches':len(records)},
            'holdout_manifest_sha256':sha256((DATA/'evaluation/holdout-manifest.json').read_bytes()).hexdigest()})
        if validity!=total or not deterministic or not prefix_invariant:raise AssertionError('Evidence/replay verification failed')
        print(json.dumps(final['summary'],indent=2))

if __name__=='__main__':main()
