"""Reproduce Step3A tests, full CLI cases, evidence checks and compact review artifacts."""
import gzip,hashlib,json,subprocess,sys,time,tracemalloc
from collections import Counter
from pathlib import Path
from matchpulse.ingestion import load_match
from matchpulse.schemas import MatchIdentity
from matchpulse.tracking.ingestion import load_frames
from matchpulse.tracking.detector import TrackingConfig
from matchpulse.stories.replay import replay
from matchpulse.stories.schemas import Claim,MatchInsight,TimelineItem,AgentInput,AgentOutput
from matchpulse.stories.export import write_json
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'backend/output/stories';ART=ROOT/'research/step3a/artifacts';ART.mkdir(parents=True,exist_ok=True)
NODE='/Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node'
commands=[]
def run(name,args,cwd=ROOT):
    start=time.perf_counter()
    with (OUT/f'{name}.log').open('w') as stream:
        p=subprocess.run(args,cwd=cwd,stdout=stream,stderr=subprocess.STDOUT)
    commands.append({'name':name,'argv':args,'cwd':str(cwd),'exit_status':p.returncode,'runtime_seconds':time.perf_counter()-start})
    if p.returncode:raise RuntimeError(f'{name} failed; inspect {OUT/name}.log')
run('pytest',[sys.executable,'-m','pytest','backend/tests','-q'])
run('typescript-tests',[NODE,'--import','tsx','--test',*[str(p.relative_to(ROOT/'poc')) for p in sorted((ROOT/'poc/tests').glob('*.test.ts'))]],ROOT/'poc')
run('typecheck',[NODE,'node_modules/typescript/bin/tsc','--noEmit'],ROOT/'poc')
models=(Claim,MatchInsight,TimelineItem,AgentInput,AgentOutput)
for model in models:write_json(ART/f'{model.__name__}.schema.json',model.model_json_schema())
config_path=ROOT/'research/step25/artifacts/selected.json'
config=TrackingConfig.model_validate_json(config_path.read_text())
cases=[('demo','5cc7f774-c215-4773-9318-3a01ad8b23af',OUT/'source',True),
       ('fresh','f2a3e267-d3e5-4c90-ae07-b5a39607ab2d',ROOT/'data/step25/inference',True),
       ('stale','31c70a92-4ce1-4ec2-a570-e8112bfcc5fc',ROOT/'data/step25/inference',True),
       ('goal','02840f35-cb05-4812-aa9d-1237e4ab1b9d',ROOT/'data/step2/inference',False)]
results=[];packet=[];key=[]
for label,mid,source,tracking in cases:
    event_path=source/f'{mid}.jsonl';frame_path=source/f'{mid}.tracking.jsonl.gz'
    args=[sys.executable,'-m','matchpulse.stories.cli','--events',str(event_path),'--output',str(OUT/label),'--debug']
    if tracking:args+=['--tracking',str(frame_path),'--positional-config',str(config_path)]
    run('cli-'+label,args)
    before={p.name:p.read_bytes() for p in (OUT/label).glob('*.json')}
    run('cli-repeat-'+label,args)
    assert before=={p.name:p.read_bytes() for p in (OUT/label).glob('*.json')}
    identity=MatchIdentity(match_id=mid);events=list(load_match(event_path,identity));frames=list(load_frames(frame_path,identity)) if tracking else []
    tracemalloc.start();start=time.perf_counter();r=replay(mid,events,frames,config if tracking else None)
    elapsed=time.perf_counter()-start;_,peak=tracemalloc.get_traced_memory();tracemalloc.stop()
    assert all(r['index'].verify(c) for c in r['claims'])
    for n in (100,1000,len([e for e in events if e.time_seconds<=3400])):
        clipped=events[:n];clock=clipped[-1].time_seconds
        short=replay(mid,clipped,[f for f in frames if f.time_seconds<=clock],config if tracking else None)
        assert short['insights']==[i for i in r['insights'] if i.as_of_seconds<=clock]
    for name,model in [('claims',Claim),('insights',MatchInsight),('timeline',TimelineItem),('agent-inputs',AgentInput)]:
        for row in json.loads((OUT/label/f'{name}.json').read_text()):model.model_validate_json(json.dumps(row))
    summary=json.loads((OUT/label/'summary.json').read_text())
    assert summary['goals_source']==summary['goals_verified']==summary['goals_emitted']
    assert summary['shots_source']==summary['shots_verified']
    # Shot incident coverage includes richer regain-to-shot stories.
    shot_ids={e.id for e in events if e.type=='shot'}
    covered={t.insight.evidence[-1].source_id for t in r['timeline'] if t.insight.type in ('observed_shot','turnover_to_shot')}
    summary.update(shot_incidents_emitted=len(shot_ids & covered),shot_incidents_source=len(shot_ids),
        suppression_reasons=dict(Counter(str(s.get('reason',s.get('reasons'))) for s in r['suppressed'])),
        replay_deterministic=True,prefix_checks=3,runtime_seconds=elapsed,tracemalloc_peak_bytes=peak)
    summary['positional_decisions']=[d.model_dump(mode='json') for d in r['presentation']]
    results.append({'case':label,**summary})
    # Blind packet: no match UUID, filenames, scenario/onset or external classification.
    picked=[]
    for kind in ('goal_context','observed_shot','high_turnover','turnover_to_shot','recent_attacking_activity','observed_line_height_change'):
        i=next((i for i in r['insights'] if i.type==kind),None)
        if i:picked.append(i)
    for i in picked:
        c=next(c for c in r['claims'] if c.claim_id in i.claim_ids)
        value=c.value.model_dump(mode='json')
        if 'line' in value:value['line']={k:v for k,v in value['line'].items() if k not in ('match_id','claim_id','detection_id')}
        code=f'episode-{len(packet)+1:03}'
        rows=[r['index'].events[ref.source_id].model_dump(mode='json') for ref in c.references if ref.category=='event']
        packet.append({'episode_id':code,'time_seconds':i.as_of_seconds,'type':i.type,'fact':value,
            'source_events':rows,'source_frame_ids':[ref.source_id for ref in c.references if ref.category=='tracking'],
            'source_frames':[r['index'].frames[ref.source_id].model_dump(mode='json') for ref in c.references if ref.category=='tracking'],
            'fallback':i.fallback.model_dump(),'limitations':i.limitations,'human_ratings':None})
        key.append({'episode_id':code,'case':label,'match_id':mid,'claim_id':c.claim_id})
    for d in r['presentation']:
        if d.claim is None:
            pack=r['index'].packs[d.detection_id]
            code=f'episode-{len(packet)+1:03}'
            packet.append({'episode_id':code,'time_seconds':d.detected_at_seconds,'type':'suppressed_position',
                'before':pack.before,'after':pack.after,'support':pack.support,
                'age_seconds':d.recent_age_seconds,'recent_span_seconds':d.recent_span_seconds,'reasons':d.reasons,'human_ratings':None})
            key.append({'episode_id':code,'case':label,'match_id':mid})
    # Compressed complete canonical fixture for reproducible event-only tests.
    if label in ('demo','goal'):
        (ART/f'{mid}.jsonl.gz').write_bytes(gzip.compress(event_path.read_bytes(),mtime=0))
# Additional observed-only packet episodes: quiet interval and borderline comparison.
mid=cases[0][1];source=cases[0][2];identity=MatchIdentity(match_id=mid)
ev=list(load_match(source/f'{mid}.jsonl',identity));fr=list(load_frames(source/f'{mid}.tracking.jsonl.gz',identity))
packet.append({'episode_id':f'episode-{len(packet)+1:03}','type':'normal_observed_interval',
    'window':[1800,1830],'source_events':[e.model_dump(mode='json') for e in ev if 1800<e.time_seconds<=1830],'human_ratings':None})
from matchpulse.tracking.replay import comparisons_from_frames
comparisons=[c for _,_,c in comparisons_from_frames(fr,config) if c is not None]
border=min(comparisons,key=lambda c:abs(abs(c.delta['line3_m'])-7))
packet.append({'episode_id':f'episode-{len(packet)+1:03}','type':'borderline_measurement_only',
    'time_seconds':border.time,'team_id':border.team,'before':border.before,'after':border.after,
    'delta':border.delta,'note':'Not a verified story; persistence, fusion and presentation not established by a comparison.',
    'human_ratings':None})
assert len(results[1]['positional_decisions'])==1 and results[1]['positional_decisions'][0]['status']=='eligible'
assert len(results[2]['positional_decisions'])==1 and results[2]['positional_decisions'][0]['status']=='suppressed'
frozen=subprocess.check_output(['git','diff','--name-only','HEAD','--','backend/src/matchpulse/tracking','backend/config','research/step25','research/step2-artifacts'],cwd=ROOT,text=True).strip()
assert not frozen,frozen
write_json(ART/'review-packet.json',{'review_kind':'blinded human packet; no human ratings yet','episodes':packet})
write_json(ART/'review-key.json',key)
write_json(ART/'evaluation.json',{'commands':commands,'matches':results,'frozen_paths_unchanged':True,
    'schema_validation':'Pydantic JSON roundtrip against exported model contracts; no external JSON Schema meta-validator installed',
    'source_hashes':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT/'backend/src/matchpulse/stories').glob('*.py'))}})
# Persist a compact real incident for teaching.
goal=next(i for i in replay(cases[-1][1],list(load_match(cases[-1][2]/f'{cases[-1][1]}.jsonl',MatchIdentity(match_id=cases[-1][1]))))['insights'] if i.type=='goal_context')
write_json(ART/'real-goal.json',goal.model_dump(mode='json'))
print(json.dumps({'commands':len(commands),'cases':len(results),'packet_episodes':len(packet),'status':'passed'}))
