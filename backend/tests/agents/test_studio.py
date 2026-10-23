"""Offline tests never make model calls; actual SDK/live tests are separate."""
import asyncio,gzip,json
from pathlib import Path
from uuid import uuid4
import pytest
from matchpulse.ingestion import validate_stream
from matchpulse.stories.replay import replay
from matchpulse.stories.export import agent_input
from matchpulse.agents.schemas import Preferences,AskRequest,DirectorDecision,NarrationPlan
from matchpulse.agents.provider import FakeProvider,ProviderFailure
from matchpulse.agents.workflow import Studio
from matchpulse.agents.tools import EvidenceTools
from matchpulse.agents.policy import default_overlay,eligible
from matchpulse.agents.overlay_compiler import compile_overlay
from matchpulse.agents.publication import verify_publication
from matchpulse.agents.ask import ask
from matchpulse.agents.config import ProviderConfig
ROOT=Path(__file__).resolve().parents[3]
MID='02840f35-cb05-4812-aa9d-1237e4ab1b9d'

@pytest.fixture(scope='module')
def source():
    raw=gzip.decompress((ROOT/f'research/step3a/artifacts/{MID}.jsonl.gz').read_bytes()).decode()
    return replay(MID,list(validate_stream(raw.splitlines())))

def selected(source,kind='goal_context',prefs=None):
    item=next(t for t in source['timeline'] if t.insight.type==kind)
    env=agent_input(item.insight,{c.claim_id:c for c in source['claims']},(prefs or Preferences()).audience)
    return env,item

def run(source,kind='goal_context',faults=None,prefs=None,mode='adaptive',timeout=.03):
    prefs=prefs or Preferences();e,i=selected(source,kind,prefs);p=FakeProvider(faults)
    studio=Studio(source,p,prefs,timeout=timeout,retries=1)
    a,s=asyncio.run(studio.run(e,i,mode=mode))
    return a,s,studio,p,i

def test_adaptive_roles_tools_and_grounding(source):
    a,s,studio,p,item=run(source)
    assert [c['role'] for c in p.calls][:3]==['director','match_analyst','challenger']
    assert {c['role'] for c in p.calls[-2:]}=={'narrator','replay_producer'}
    assert a.origin=='offline_fake' and a.narration_status=='enriched' and a.overlay_status=='enriched'
    assert [t['tool'] for t in studio.tools.calls]==['resolve_claim','resolve_evidence']
    assert verify_publication(a,s,item,source,studio.tools)
    assert all(c['correlation'] for c in p.calls)
    assert not studio.trace.export()['cloud_delivery']

@pytest.mark.parametrize('role,fault',[('director','malformed'),('director','auth'),('match_analyst','unsupported_tool'),
 ('match_analyst','cross_match'),('match_analyst','unknown_claim'),('challenger','objection'),('challenger','malformed'),
 ('narrator','unknown_claim'),('narrator','causal_prose'),('narrator','timeout'),('replay_producer','wrong_overlay'),
 ('replay_producer','unavailable'),('tactical_analyst','auth')])
def test_failure_isolation(source,role,fault):
    a,s,studio,p,item=run(source,faults={role:fault})
    assert verify_publication(a,s,item,source,studio.tools)
    assert studio.requests.attempts<=12
    if role=='narrator' or (role=='challenger' and fault in ('objection','malformed')):assert a.narration_status=='fallback'
    if role=='replay_producer':assert a.overlay_status=='fallback' and a.narration_status=='enriched'
    if role=='director' and fault=='auth':assert a.origin=='deterministic' and len(p.calls)==1


def test_timeout_retries_bounded_same_correlation(source):
    a,s,studio,p,item=run(source,faults={'narrator':'timeout'})
    calls=[c for c in p.calls if c['role']=='narrator']
    assert len(calls)==2 and calls[0]['correlation']==calls[1]['correlation']
    assert a.overlay_status=='enriched'


def test_rate_limit_budget(source):
    _,_,studio,p,_=run(source,faults={'director':'rate_limit'})
    assert len([c for c in p.calls if c['role']=='director'])==2
    assert studio.requests.logical_calls<=6


def test_cache_and_session_isolation(source):
    a,s,studio,p,item=run(source)
    before=len(p.calls)
    # Identical completed logical request is served from this run's cache.
    asyncio.run(studio.requests.invoke('director',s.model_copy(update={'director':None,'analyses':(),'challenge':None,'narration_plan':None,'overlay_plan':None}),studio.tools))
    assert len(p.calls)==before
    a2,s2,studio2,p2,_=run(source)
    assert a.trace_id!=a2.trace_id and studio.tools is not studio2.tools

@pytest.mark.parametrize('operation,args',[('resolve_claim',{'claim_id':'bad'}),('resolve_evidence',{'category':'event','source_id':'missing'}),
 ('resolve_evidence',{'category':'file','source_id':'/etc/passwd'}),('get_match_context',{'requested_kinds':['goal_context'],'limit':99})])
def test_bad_tool_args(source,operation,args):
    e,_=selected(source);tools=EvidenceTools(source,e.match_id,e.insight.as_of_seconds)
    with pytest.raises((ValueError,KeyError)):
        tools.invoke(operation,dict(match_id=e.match_id,as_of_seconds=e.insight.as_of_seconds,**args))

@pytest.mark.parametrize('clock',[-1.,float('nan'),float('inf'),999999.])
def test_tool_clock_scope(source,clock):
    e,_=selected(source);tools=EvidenceTools(source,e.match_id,e.insight.as_of_seconds)
    with pytest.raises(ValueError):tools.resolve_claim(match_id=e.match_id,claim_id=e.claims[0].claim_id,as_of_seconds=clock)

def test_match_future_oversize_and_budget(source):
    e,_=selected(source);tools=EvidenceTools(source,e.match_id,e.insight.as_of_seconds)
    with pytest.raises(ValueError):tools.resolve_claim(match_id=str(uuid4()),claim_id=e.claims[0].claim_id,as_of_seconds=0.)
    with pytest.raises(ValueError):tools.resolve_claim(match_id=e.match_id,claim_id=e.claims[0].claim_id,as_of_seconds=0.)
    tiny=EvidenceTools(source,e.match_id,e.insight.as_of_seconds,max_bytes=1)
    with pytest.raises(ValueError):tiny.resolve_claim(match_id=e.match_id,claim_id=e.claims[0].claim_id,as_of_seconds=e.insight.as_of_seconds)
    zero=EvidenceTools(source,e.match_id,e.insight.as_of_seconds,max_calls=0)
    with pytest.raises(ValueError):zero.invoke('resolve_claim',dict(match_id=e.match_id,claim_id=e.claims[0].claim_id,as_of_seconds=0.))
    with pytest.raises(ValueError):tools.invoke('shell',{})


def test_publication_mutations_rejected(source):
    a,s,studio,p,item=run(source)
    for changes in ({'match_id':str(uuid4())},{'available_seconds':0.},{'claim_ids':('invented',)},
        {'narration':a.narration.model_copy(update={'headline':'NORTH score 9 goals'})},
        {'overlay':a.overlay.model_copy(update={'coordinates':(('fake',999.,999.),)})}):
        assert not verify_publication(a.model_copy(update=changes),s,item,source,studio.tools)


def test_personalization_audiences_and_policy(source):
    fan,*_=run(source,prefs=Preferences(audience='fan',favorite_team='NORTH'))
    analyst,*_=run(source,prefs=Preferences(audience='analyst',favorite_team='SOUTH'))
    assert fan.claim_ids==analyst.claim_ids
    assert fan.narration!=analyst.narration and len(analyst.narration.sentences)>len(fan.narration.sentences)
    assert fan.narration.headline.startswith('NORTH view')
    assert analyst.narration.headline.startswith('Opposition context for SOUTH')
    with pytest.raises(ValueError):Preferences(language='hi')
    gain=next(t for t in source['timeline'] if t.insight.type=='high_turnover')
    assert not eligible(gain,Preferences()) and eligible(gain,Preferences(audience='analyst'))

@pytest.mark.parametrize('question',['coach_intent','xg','possession_percentage','counterfactual'])
def test_unsupported_questions(source,question):
    e,_=selected(source)
    answer=ask(AskRequest(match_id=e.match_id,as_of_seconds=e.insight.as_of_seconds,question=question,insight_id=e.insight.insight_id),source)
    assert answer['status']=='unsupported' and not answer['claim_ids']

def test_ask_verified_and_missing(source):
    e,_=selected(source)
    q=AskRequest(match_id=e.match_id,as_of_seconds=e.insight.as_of_seconds,question='before_goal',insight_id=e.insight.insight_id)
    assert ask(q,source)['status']=='verified'
    assert ask(q.model_copy(update={'as_of_seconds':0.}),source)['status']=='unavailable'
    with pytest.raises(ValueError):ask(q.model_copy(update={'match_id':str(uuid4())}),source)

@pytest.mark.parametrize('endpoint',['http://localhost/api/projects/x','https://evil.test/api/projects/x','https://x.services.ai.azure.com/api/projects/x?token=secret','https://x.services.ai.azure.com/api/projects/a/b'])
def test_provider_config_rejects_unsafe_endpoint(endpoint):
    with pytest.raises(ValueError):ProviderConfig(endpoint=endpoint,model='deployment')

def test_missing_configuration(monkeypatch):
    monkeypatch.delenv('FOUNDRY_PROJECT_ENDPOINT',raising=False);monkeypatch.delenv('FOUNDRY_MODEL',raising=False)
    with pytest.raises(ValueError):ProviderConfig.from_environment()


def test_simple_and_routine_bypass(source):
    _,_,_,provider,_=run(source,mode='simple')
    assert [c['role'] for c in provider.calls]==['match_analyst','narrator']
    a,s,studio,provider,item=run(source,kind='observed_shot')
    assert provider.calls==[] and a.origin=='deterministic'


def test_framework_runtime_separate(source):
    pytest.importorskip('agent_framework',reason='Microsoft SDK unavailable; offline harness is not MAF execution')
    e,item=selected(source);studio=Studio(source,FakeProvider(),Preferences())
    artifact,_=asyncio.run(studio.run(e,item,runtime='framework'))
    assert artifact.narration_status=='enriched'

def test_parallel_requests_overlap_and_same_request_coalesces(source):
    from matchpulse.agents.runtime import Requests
    from matchpulse.agents.telemetry import Trace
    from matchpulse.agents.schemas import WorkflowState
    e,item=selected(source);p=FakeProvider(delay=.005);trace=Trace()
    requests=Requests(p,trace);tools=EvidenceTools(source,e.match_id,e.insight.as_of_seconds)
    state=WorkflowState(envelope=e,preferences=Preferences(),trace_id=trace.trace_id)
    async def simultaneous():return await asyncio.gather(requests.invoke('director',state,tools),requests.invoke('director',state,tools))
    values=asyncio.run(simultaneous())
    assert values[0]==values[1] and len(p.calls)==1
    _,_,studio,_,_=run(source)
    events=[(e.role,e.event) for e in studio.trace.events]
    assert events.index(('replay_producer','request_started'))<events.index(('narrator','request_succeeded'))
    payload=studio.trace.otlp();spans=payload['resourceSpans'][0]['scopeSpans'][0]['spans']
    assert spans and len(spans[0]['traceId'])==32 and 'matchpulse.match_id' in str(spans)

@pytest.mark.parametrize('changes',[{'specialists':('tactical_analyst',)}, {'challenge':False},{'max_calls':1}])
def test_director_cannot_drop_required_review_or_invent_route(source,changes):
    from matchpulse.agents.policy import default_director
    from matchpulse.agents.grounding import validate_director
    e,_=selected(source)
    with pytest.raises(ValueError):validate_director(default_director(e).model_copy(update=changes),e)


def test_untrusted_input_and_unscheduled_insight_rejected(source):
    e,item=selected(source);studio=Studio(source,FakeProvider(),Preferences())
    fake=e.model_copy(update={'insight':e.insight.model_copy(update={'observed_score':e.insight.observed_score.model_copy(update={'home':99})})})
    with pytest.raises(ValueError):asyncio.run(studio.run(fake,item))
    with pytest.raises(ValueError):asyncio.run(studio.run(e,item.model_copy(update={'presented_at_seconds':9999.})))

@pytest.mark.parametrize('timeout,retries',[(0.,1),(-1.,1),(float('inf'),1),(1.,99)])
def test_invalid_request_limits_rejected(source,timeout,retries):
    with pytest.raises(ValueError):Studio(source,FakeProvider(),Preferences(),timeout=timeout,retries=retries)

def test_direct_studio_cannot_bypass_fan_editorial_policy(source):
    envelope,item=selected(source,'high_turnover')
    studio=Studio(source,FakeProvider(),Preferences())
    with pytest.raises(ValueError):asyncio.run(studio.run(envelope,item))
    assert not studio.provider.calls

def test_before_goal_resolves_bounded_actual_observations(source):
    e,_=selected(source)
    answer=ask(AskRequest(match_id=e.match_id,as_of_seconds=e.insight.as_of_seconds,question='before_goal',insight_id=e.insight.insight_id),source)
    assert 0<len(answer['source_observations'])<=5
    assert all(o['time_seconds']<e.insight.as_of_seconds for o in answer['source_observations'])
    assert 'No assist or causal link' in answer['explanation']
    assert any(c['tool']=='resolve_evidence' for c in answer['tool_calls'])
