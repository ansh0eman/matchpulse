"""Measured OFFLINE studio review; never masquerades as live Foundry evaluation."""
import asyncio,hashlib,json,shutil,subprocess,sys,tempfile,time
from collections import Counter
from pathlib import Path
from statistics import median
from matchpulse.agents.cli import load_source
from matchpulse.agents.schemas import Preferences,DirectorDecision,Analysis,Challenge,NarrationPlan,OverlayPlan,VerifiedOverlay,BroadcastArtifact,WorkflowState,AskRequest
from matchpulse.agents.provider import FakeProvider
from matchpulse.agents.workflow import Studio
from matchpulse.agents.publication import verify_publication
from matchpulse.agents.policy import eligible
from matchpulse.agents.ask import ask
from matchpulse.stories.export import agent_input,write_json
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'backend/output/agents';ART=ROOT/'research/step3b/artifacts'
OUT.mkdir(parents=True,exist_ok=True);ART.mkdir(parents=True,exist_ok=True)
commands=[]
def run(name,args,expected=0):
    start=time.perf_counter()
    with (OUT/f'{name}.log').open('w') as log:p=subprocess.run(args,cwd=ROOT,stdout=log,stderr=subprocess.STDOUT)
    commands.append({'name':name,'argv':args,'exit_status':p.returncode,'runtime_seconds':time.perf_counter()-start})
    assert p.returncode==expected,f'{name} failed; inspect local log'
# Required old review is rerun without replacing historical Step3A artifacts.
old=ROOT/'research/step3a/artifacts'
with tempfile.TemporaryDirectory(prefix='matchpulse-step3a-preserve-') as temporary:
    backup=Path(temporary)/'artifacts';shutil.copytree(old,backup)
    try:
        run('story-review',[sys.executable,'backend/scripts/step3a_review.py'])
        write_json(ART/'story-review-rerun.json',json.loads((old/'evaluation.json').read_text()))
    finally:
        for path in old.iterdir():
            if path.is_file() and not (backup/path.name).exists():path.unlink()
        for path in backup.iterdir():shutil.copyfile(path,old/path.name)
for model in (Preferences,DirectorDecision,Analysis,Challenge,NarrationPlan,OverlayPlan,VerifiedOverlay,BroadcastArtifact,WorkflowState,AskRequest):
    write_json(ART/f'{model.__name__}.schema.json',model.model_json_schema())
CONFIG=ROOT/'research/step25/artifacts/selected.json'
paths={
 'demo':(ROOT/'backend/output/stories/source/5cc7f774-c215-4773-9318-3a01ad8b23af.jsonl',ROOT/'backend/output/stories/source/5cc7f774-c215-4773-9318-3a01ad8b23af.tracking.jsonl.gz'),
 'goal':(ROOT/'data/step2/inference/02840f35-cb05-4812-aa9d-1237e4ab1b9d.jsonl',None),
 'equalizer':(ROOT/'data/step2/inference/031c8ca1-662c-4255-a615-eb29bd25c249.jsonl',None),
 'position':(ROOT/'data/step25/inference/f2a3e267-d3e5-4c90-ae07-b5a39607ab2d.jsonl',ROOT/'data/step25/inference/f2a3e267-d3e5-4c90-ae07-b5a39607ab2d.tracking.jsonl.gz'),
 'stale':(ROOT/'data/step25/inference/31c70a92-4ce1-4ec2-a570-e8112bfcc5fc.jsonl',ROOT/'data/step25/inference/31c70a92-4ce1-4ec2-a570-e8112bfcc5fc.tracking.jsonl.gz')}
results={name:load_source(events,tracking,CONFIG if tracking else None) for name,(events,tracking) in paths.items()}
selection=[('opening_goal','goal','goal_context'),('equalizer','equalizer','goal_context'),('high_regain','demo','high_turnover'),
           ('regain_to_shot','demo','turnover_to_shot'),('routine_shot','demo','observed_shot'),('position','position','observed_line_height_change')]
records=[];examples=[]
async def evaluate():
 for name,source,kind in selection:
    result=results[source]
    candidates=[t for t in result['timeline'] if t.insight.type==kind]
    if name=='equalizer':candidates=[t for t in candidates if next(c for c in result['claims'] if c.claim_id==t.insight.claim_ids[0]).value.context=='equalizer']
    assert candidates,name
    item=candidates[0]
    for audience in ('fan','analyst'):
      preferences=Preferences(audience=audience,favorite_team='NORTH')
      envelope=agent_input(item.insight,{c.claim_id:c for c in result['claims']},audience)
      for mode in ('fallback','simple','adaptive'):
        if not eligible(item,preferences):
            records.append({'case':name,'audience':audience,'configuration':mode,'status':'audience_suppressed','requests':0});continue
        provider=FakeProvider();studio=Studio(result,provider,preferences)
        start=time.perf_counter();artifact,state=await studio.run(envelope,item,mode)
        duration=time.perf_counter()-start
        assert verify_publication(artifact,state,item,result,studio.tools,mode=studio.mode)
        row={'case':name,'audience':audience,'configuration':mode,'status':'published',
            'grounded_acceptance':True,'overlay_valid':artifact.overlay is not None,'fallback':artifact.narration_status=='fallback',
            'requests':studio.requests.attempts,'logical_calls':studio.requests.logical_calls,'seconds':duration,
            'tools_successful':sum(c['status']=='success' for c in studio.tools.calls),'tools_attempted':len(studio.tools.calls),
            'tokens':None,'model_cost':None,'origin':artifact.origin}
        records.append(row)
        if mode=='adaptive':
            examples.append({'case':name,'artifact':artifact.model_dump(mode='json')})
            write_json(ART/f'{name}-{audience}.broadcast.json',artifact.model_dump(mode='json'))
            write_json(ART/f'{name}-{audience}.trace.json',studio.trace.export())
            write_json(ART/f'{name}-{audience}.otlp.json',studio.trace.otlp())
            write_json(ART/f'{name}-{audience}.state.json',state.model_dump(mode='json'))
            write_json(ART/f'{name}-{audience}.tools.json',studio.tools.calls)
 result=results['goal'];item=next(t for t in result['timeline'] if t.insight.type=='goal_context')
 envelope=agent_input(item.insight,{c.claim_id:c for c in result['claims']})
 for role,fault in [('tactical_analyst','unavailable'),('director','auth'),('director','rate_limit'),('match_analyst','unknown_claim'),('match_analyst','unsupported_tool'),('challenger','objection'),('narrator','timeout'),('narrator','malformed'),('replay_producer','wrong_overlay'),('replay_producer','unavailable')]:
    fault_result=results['position'] if role=='tactical_analyst' else result
    fault_item=next(t for t in fault_result['timeline'] if t.insight.type=='observed_line_height_change') if role=='tactical_analyst' else item
    fault_envelope=agent_input(fault_item.insight,{c.claim_id:c for c in fault_result['claims']})
    studio=Studio(fault_result,FakeProvider({role:fault}),Preferences(),timeout=.03)
    start=time.perf_counter();artifact,state=await studio.run(fault_envelope,fault_item)
    assert verify_publication(artifact,state,fault_item,fault_result,studio.tools)
    assert studio.requests.attempts<=12
    records.append({'case':'failure:'+role+':'+fault,'configuration':'adaptive','audience':'fan','status':'safe_recovery',
        'requests':studio.requests.attempts,'seconds':time.perf_counter()-start,'narration_status':artifact.narration_status,
        'overlay_status':artifact.overlay_status,'errors':artifact.errors})
    write_json(ART/f'failure-{role}-{fault}.trace.json',studio.trace.export())
    if role=='narrator' and fault=='timeout':
        write_json(ART/'failure-recovery.broadcast.json',artifact.model_dump(mode='json'));write_json(ART/'failure-recovery.otlp.json',studio.trace.otlp())
 q=AskRequest(match_id=envelope.match_id,as_of_seconds=item.insight.as_of_seconds,question='coach_intent',insight_id=item.insight.insight_id)
 assert ask(q,result)['status']=='unsupported'
 write_json(ART/'ask-evidence.json',ask(q.model_copy(update={'question':'before_goal'}),result))
asyncio.run(evaluate())
# Explicit negative cases: absent/stale position produces no positional workflow input.
assert not any(t.insight.type=='observed_line_height_change' for t in results['stale']['timeline'])
assert any(d.status=='suppressed' for d in results['stale']['presentation'])
# No important incidents: empty clock interval does not manufacture a story or model request.
quiet=[t for t in results['demo']['timeline'] if 1800<t.insight.as_of_seconds<=1830 and t.insight.priority>=70]
# Incomplete source is an actual canonical prefix; retain safe prefix stories without invented completion.
events_path=paths['goal'][0];prefix=events_path.read_text().splitlines()[:100]
from matchpulse.ingestion import validate_stream
from matchpulse.stories.replay import replay
incomplete=replay(results['goal']['index'].match_id,list(validate_stream(prefix)))
assert not any(i.type=='goal_context' for i in incomplete['insights'])
# A changed evidence reference must fail before any provider invocation.
from matchpulse.agents.grounding import validate_envelope
result=results['goal'];item=next(t for t in result['timeline'] if t.insight.type=='goal_context')
envelope=agent_input(item.insight,{c.claim_id:c for c in result['claims']})
bad_claim=envelope.claims[0].model_copy(update={'references':(envelope.claims[0].references[0].model_copy(update={'source_id':'wrong'}),)})
try:validate_envelope(envelope.model_copy(update={'claims':(bad_claim,)}),result)
except ValueError:pass
else:raise AssertionError('Wrong evidence accepted')
editorial={}
for audience in ('fan','analyst'):
 original=results['demo']['timeline'];selected=[t for t in original if eligible(t,Preferences(audience=audience))]
 editorial[audience]={'before':dict(Counter(t.insight.type for t in original)),
    'after':dict(Counter(t.insight.type for t in selected)),'before_count':len(original),'after_count':len(selected)}
run('cli-goal',[sys.executable,'-m','matchpulse.agents.cli','studio','--events',str(paths['goal'][0]),'--insight-type','goal_context','--provider','fake','--output',str(OUT/'goal.broadcast.json')])
run('cli-position',[sys.executable,'-m','matchpulse.agents.cli','studio','--events',str(paths['position'][0]),'--tracking',str(paths['position'][1]),'--positional-config',str(CONFIG),'--insight-type','observed_line_height_change','--audience','analyst','--output',str(OUT/'position.broadcast.json')])
run('cli-proof-blocked',[sys.executable,'-m','matchpulse.agents.cli','proof','--events',str(paths['goal'][0]),'--insight-type','goal_context','--output',str(OUT/'live-proof.json')],expected=2)
summary={}
for mode in ('fallback','simple','adaptive'):
 subset=[r for r in records if r['configuration']==mode and r['status']=='published']
 times=sorted(r['seconds'] for r in subset)
 summary[mode]={'published':len(subset),'requests':sum(r['requests'] for r in subset),'p50_seconds':median(times),
    'p95_seconds':times[min(len(times)-1,int(.95*len(times)))],'grounded_acceptance':sum(r['grounded_acceptance'] for r in subset),
    'fallbacks':sum(r['fallback'] for r in subset),'token_usage':None,'model_cost':None}
protected=subprocess.check_output(['git','diff','--name-only','HEAD','--','backend/src/matchpulse/stories','backend/src/matchpulse/tracking','backend/config','backend/uv.lock','research/step25','research/step3a'],cwd=ROOT,text=True).strip()
assert not protected,protected
write_json(ART/'evaluation.json',{'evaluation_kind':'OFFLINE fake-provider engineering comparison; no model-quality superiority claim',
    'records':records,'summary':summary,'editorial':editorial,'commands':commands,'negative_cases':{
    'stale_position_suppressed':True,'wrong_evidence_rejected_before_provider':True,'unsupported_question_declined':True,
    'incomplete_prefix_safe':True,'priority70_items_in_quiet_interval':len(quiet)},
    'foundry_status':'BLOCKED: endpoint/model/Entra authentication and SDK installation unavailable',
    'maf_status':'adapter implemented, not executed: SDK missing','human_ratings':None,
    'source_hashes':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT/'backend/src/matchpulse/agents').glob('*.py'))},
    'input_hashes':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for pair in paths.values() for p in pair if p}})
print(json.dumps({'records':len(records),'summary':summary,'editorial':editorial,'status':'offline checks passed; live integration blocked'}))
