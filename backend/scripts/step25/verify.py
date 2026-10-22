"""After final scoring: exercise real observable inference and raw evidence for every match."""
from __future__ import annotations
import json,time,resource,gzip,hashlib,sys
from pathlib import Path
from common import ROOT,DATA,ART,manifest,prepare,samples_from_cache,dump,digest
from compare import hashes,matched,PRIMARY
from matchpulse.schemas import MatchIdentity
from matchpulse.ingestion import load_match
from matchpulse.tracking.ingestion import load_frames
from matchpulse.tracking.detector import TrackingConfig
from matchpulse.tracking.replay import comparisons_from_frames,comparisons_from_samples,detect
from matchpulse.tracking.evidence import make_pack,verify_geometry,verify_events,compact_agent_facts,PositionalEvidencePack

def independent_spatial_check(pack,frames):
    """Separate coordinate arithmetic for core displayed quantities, no feature extractor."""
    from math import hypot,isclose
    from statistics import mean
    from collections import defaultdict
    by_id={f.frame_id:f for f in frames};groups={}
    for side,ids in pack.tracking_references.items():
        groups[side]=defaultdict(list)
        for frame_id in ids:
            f=by_id[frame_id];own=[p for p in f.players if p.team_id==pack.team_id and not p.goalkeeper]
            other=[p for p in f.players if p.team_id!=pack.team_id and not p.goalkeeper]
            owner=next(p for p in f.players if p.id==f.ball.owner_id)
            forward=(pack.team_id=='NORTH')==(f.period==1)
            xs=sorted(p.x if forward else 105-p.x for p in own)
            distances=[hypot(p.x-owner.x,p.y-owner.y) for p in own]
            carrier_forward=(owner.team_id=='NORTH')==(f.period==1);carrier_x=owner.x if carrier_forward else 105-owner.x
            diff=f.score.home-f.score.away
            if pack.team_id=='SOUTH':diff=-diff
            key=(int(carrier_x>=35),int(diff>0)-int(diff<0),len(own),len(other))
            if pack.detector.method=='unconditioned':key=(0,0,0,0)
            idx=(len(xs)-1)*.2;left=int(idx);q20=xs[left]+(xs[min(left+1,len(xs)-1)]-xs[left])*(idx-left)
            groups[side][key].append({'line3_m':sum(xs[:3])/3,'line4_m':sum(xs[:4])/4,'line_q20_m':q20,
                'nearest_m':min(distances),'density10':float(sum(d<=10 for d in distances))})
    total=sum(len(v) for v in groups['recent'].values())
    for side,claim in [('reference',pack.before),('recent',pack.after)]:
        for feature in ['line3_m','line4_m','line_q20_m','nearest_m','density10']:
            value=sum(len(groups['recent'][key])*mean(row[feature] for row in groups[side][key]) for key in sorted(groups['recent']))/total
            if not isclose(value,claim[feature],abs_tol=1e-9,rel_tol=1e-12):return False
    return True

start=time.perf_counter();frozen=json.loads((ART/'frozen.json').read_text());assert hashes()==frozen['source_hashes']
config=TrackingConfig(**frozen['selected']);model=frozen['models'].get(config.model_id)
scored=json.loads((ART/'holdout-detail.json').read_text());expected={r['match_id']:r for r in scored['selected']['rows']}
OUT=ROOT/'backend/output/step25';OUT.mkdir(parents=True,exist_ok=True)
fixtures=ROOT/'research/step25/fixtures';fixtures.mkdir(parents=True,exist_ok=True)
counts={'matches':0,'packs':0,'geometry_verified':0,'event_facts_verified':0,'independent_spatial_verified':0,'exact_raw_cache_replay':0,'deterministic_replays':0,'prefix_checks':0,'prefix_passed':0}
examples={};pack_sizes=[];fact_sizes=[];support=[];latency=[];quality={'frames':0,'invalid_owner_frames':0,'gaps':0,'substitutions':0,'red_cards':0,'active_counts':{}}
for i,r in enumerate(manifest('holdout')):
    ident=MatchIdentity(match_id=r['match_id']);t0=time.perf_counter()
    with gzip.open(DATA/'inference'/f'{ident.match_id}.tracking.jsonl.gz','rb') as source:assert hashlib.sha256(source.read()).hexdigest()==r['tracking_sha256']
    assert digest(DATA/'inference'/f'{ident.match_id}.jsonl')==r['event_sha256']
    frames=list(load_frames(DATA/'inference'/f'{ident.match_id}.tracking.jsonl.gz',ident));events=list(load_match(DATA/'inference'/f'{ident.match_id}.jsonl',ident))
    raw=list(comparisons_from_frames(iter(frames),config));alerts=detect(iter(raw),config,iter(events),model)
    cache=prepare(r);cached=list(comparisons_from_samples(samples_from_cache(cache),cache['end_time'],config,cache['period_starts']))
    assert raw==cached,'raw/cache window mismatch'
    signature=[{'time':a.comparison.time,'team':a.comparison.team,'direction':a.direction,'score':a.score} for a in alerts]
    assert signature==expected[ident.match_id]['alerts'],'real inference/scoring mismatch'
    counts['exact_raw_cache_replay']+=1
    assert alerts==detect(iter(raw),config,iter(events),model);counts['deterministic_replays']+=1
    cutoff=[3300,3900,4500][i%3]
    prefix=detect(comparisons_from_frames((f for f in frames if f.time_seconds<=cutoff),config),config,(e for e in events if e.time_seconds<=cutoff),model)
    assert prefix==[a for a in alerts if a.comparison.time<=cutoff],'future position/event changed a prior output'
    counts['prefix_checks']+=1;counts['prefix_passed']+=1
    packs=[]
    for a in alerts:
        pack=make_pack(ident.match_id,a,config)
        assert verify_geometry(pack,frames),'raw evidence geometry failed'
        assert independent_spatial_check(pack,frames),'independent coordinate arithmetic mismatch'
        counts['independent_spatial_verified']+=1
        assert verify_events(pack,events),'event fact recomputation failed'
        packs.append(pack);counts['packs']+=1;counts['geometry_verified']+=1;counts['event_facts_verified']+=1
        pack_sizes.append(len(pack.model_dump_json().encode()));fact_sizes.append(len(json.dumps(compact_agent_facts(pack)).encode()))
    dump(OUT/f'{ident.match_id}.evidence.json',[p.model_dump() for p in packs])
    row=expected[ident.match_id];hit=matched(row,600)
    kind='success' if r['scenario']=='strong' and hit['tp'] else 'false_alert' if r['scenario']=='null' and packs else 'miss' if r['scenario']=='press_only' and hit['fn'] else None
    if kind and kind not in examples:
        chosen=next((p for p in packs if r['scenario']=='null' or p.team_id==r['target_team'] and p.direction==r['expected_direction'] and row['onset']<=p.detected_at_seconds<=row['onset']+600),None)
        if chosen:
            ids=set(chosen.tracking_references['reference']+chosen.tracking_references['recent'])
            excerpt=[f for f in frames if f.frame_id in ids]
            # Every geometry frame used in the chosen pack is retained, not just a pretty picture.
            name=f'{kind}-{ident.match_id}.tracking.jsonl.gz'
            with gzip.open(fixtures/name,'wt',compresslevel=6) as target:
                for f in excerpt:target.write(f.model_dump_json()+'\n')
            event_ids=set(chosen.event_facts['reference_ids']+chosen.event_facts['recent_ids']) if chosen.event_facts else set()
            dump(fixtures/f'{kind}-events.json',[e.model_dump() for e in events if e.id in event_ids])
            dump(fixtures/f'{kind}-evidence.json',chosen.model_dump());dump(fixtures/f'{kind}-facts.json',compact_agent_facts(chosen))
        examples[kind]={'match_id':ident.match_id,'seed':r['seed'],'scenario':r['scenario'],'target_team':r['target_team'],'onset':row['onset'],
            'planned_onset':r['planned_onset'],'external_target_result':hit,'pack':chosen.model_dump() if chosen else None,
            'full_observable_tracking_sha256':r['tracking_sha256'],'events_sha256':r['event_sha256']}
    counts['matches']+=1
    latency.append(time.perf_counter()-t0)
    quality['frames']+=cache['frame_count'];quality['invalid_owner_frames']+=cache['invalid_owner_frames'];quality['gaps']+=cache['gap_count']
    quality['substitutions']+=r['substitutions'];quality['red_cards']+=r['red_cards']
    for k,v in cache['active_counts'].items():quality['active_counts'][k]=quality['active_counts'].get(k,0)+v
    observed_score=next(e.score for e in reversed(events) if e.time_seconds<=r['planned_onset'])
    score_diff=(observed_score.home-observed_score.away)*(1 if r['target_team']=='NORTH' else -1)
    support.append({'score_sign':int(score_diff>0)-int(score_diff<0),'red_cards':r['red_cards'],'substitutions':r['substitutions'],'match_id':r['match_id'],'scenario':r['scenario'],'seed':r['seed'],'first_period2_comparison':next((t for t,team,o in raw if team==r['target_team'] and o and o.period==2),None),
        'onset':r['planned_onset'],'team':r['target_team'],'offset':r['home_attribute_offset'],'alerts':len(packs),'hit600':hit['tp']})
    if (i+1)%14==0:print(f'Raw inference/evidence/prefix verified {i+1}/280',flush=True)
import numpy as np
output={'frozen_sha256':digest(ART/'frozen.json'),**counts,'quality':quality,
    'seconds':time.perf_counter()-start,'peak_rss_bytes':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
    'per_match_verification_seconds_median':float(np.median(latency)),'per_match_verification_seconds_p95':float(np.quantile(latency,.95)),
    'pack_bytes_median':float(np.median(pack_sizes)),'agent_facts_bytes_median':float(np.median(fact_sizes)),
    'note':'Runtime includes loading, repeated inference, raw evidence and prefix checks. Numerical verification is not Objective B classification accuracy.'}
dump(ART/'verification.json',output);dump(ART/'verification-detail.json',{'support':support,'examples':examples})
dump(ART/'examples.json',examples);dump(ART/'tracking-json-schema.json',__import__('matchpulse.tracking.schemas',fromlist=['TrackingFrame']).TrackingFrame.model_json_schema());dump(ART/'evidence-json-schema.json',PositionalEvidencePack.model_json_schema())
print(json.dumps(output,indent=2))
