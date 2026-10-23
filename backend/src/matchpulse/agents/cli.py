"""Actual replay inputs -> offline or Foundry studio, never silently fake a live call."""
import argparse,asyncio,json,time
from importlib.metadata import version
from pathlib import Path
from ..ingestion import load_match
from ..schemas import MatchIdentity
from ..tracking.ingestion import load_frames
from ..tracking.detector import TrackingConfig
from ..stories.replay import replay
from ..stories.export import agent_input,write_json,grounded_response
from ..stories.schemas import AgentInput
from .schemas import Preferences,AskRequest
from .provider import FakeProvider,FoundryProvider,ProviderFailure
from .config import ProviderConfig
from .workflow import Studio
from .policy import eligible
from .ask import ask

def load_source(events,tracking=None,config=None):
    identity=MatchIdentity(match_id=events.stem)
    canonical=list(load_match(events,identity))
    if not canonical:raise ValueError('Empty canonical stream')
    frames=list(load_frames(tracking,identity)) if tracking else []
    settings=TrackingConfig.model_validate_json(config.read_text()) if config else None
    return replay(identity.match_id,canonical,frames,settings)

async def execute(a):
    result=load_source(a.events,a.tracking,a.positional_config)
    preferences=Preferences(audience=a.audience,favorite_team=a.favorite_team,language=a.language)
    registry={c.claim_id:c for c in result['claims']}
    if a.command=='timeline':
        selected=[t for t in result['timeline'] if eligible(t,preferences)]
        write_json(a.output,{'schema_version':2,'preferences':preferences.model_dump(mode='json'),
            'timeline':[t.model_dump(mode='json') for t in selected],'original_items':len(result['timeline']),
            'suppressed_by_audience':len(result['timeline'])-len(selected)})
        return
    items=[t for t in result['timeline'] if (not a.insight_type or t.insight.type==a.insight_type) and
           (not a.insight_id or t.insight.insight_id==a.insight_id)]
    if not items:raise ValueError('No scheduled verified incident matches selection')
    item=items[0];envelope=agent_input(item.insight,registry,a.audience)
    if a.command=='ask':
        request=AskRequest(match_id=envelope.match_id,as_of_seconds=item.insight.as_of_seconds,question=a.question,insight_id=item.insight.insight_id)
        write_json(a.output,ask(request,result));return
    if a.command=='proof':
        if a.saved_envelope:
            stored=AgentInput.model_validate_json(a.saved_envelope.read_text())
            if stored!=envelope:raise ValueError('Saved envelope differs from independently replayed source')
        provider=FoundryProvider(ProviderConfig.from_environment())
        started=time.perf_counter()
        raw,usage=await asyncio.wait_for(provider.proof(envelope),provider.config.timeout_seconds)
        latency=time.perf_counter()-started
        fallback,valid=grounded_response(raw,envelope)
        if not valid:raise ValueError('Real Foundry proof failed strict Step3A grounding')
        write_json(a.output,{'schema_version':1,'origin':'foundry','authenticated_call_succeeded':True,
            'model_deployment':provider.config.model,'latency_seconds':latency,
            'sdk_versions':{name:version(name) for name in ('agent-framework-core','agent-framework-foundry','azure-ai-projects','azure-identity')},
            'api_surface':'Foundry project Responses endpoint; SDK-managed API version, not independently observed',
            'authentication':'AzureCliCredential','request_type':'FoundryChatClient Responses structured AgentOutput',
            'structured_validation':True,'tool_availability':'not requested for minimal proof','usage':usage,
            'fallback':fallback.model_dump(),'response':json.loads(raw)})
        return
    if not eligible(item,preferences):raise ValueError('Incident suppressed by audience policy')
    provider=FakeProvider({a.fail_role:a.failure} if a.fail_role else {}) if a.provider=='fake' else FoundryProvider(ProviderConfig.from_environment())
    if a.provider=='foundry' and a.runtime!='framework':raise ValueError('Foundry studio requires --runtime framework; offline is a test harness')
    studio=Studio(result,provider,preferences,timeout=a.timeout,retries=1)
    artifact,state=await studio.run(envelope,item,mode=a.mode,runtime=a.runtime)
    write_json(a.output,artifact.model_dump(mode='json'))
    write_json(a.output.with_suffix('.trace.json'),studio.trace.export())
    write_json(a.output.with_suffix('.tools.json'),studio.tools.calls)
    write_json(a.output.with_suffix('.otlp.json'),studio.trace.otlp())
    write_json(a.output.with_suffix('.state.json'),state.model_dump(mode='json') if state else {'framework_output_only':True})
    print(f'{artifact.origin}: {artifact.narration_status} narration, {artifact.overlay_status} overlay; {studio.requests.attempts} request attempts')

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('command',choices=['studio','proof','ask','timeline'])
    p.add_argument('--events',type=Path,required=True);p.add_argument('--tracking',type=Path)
    p.add_argument('--positional-config',type=Path);p.add_argument('--output',type=Path,required=True)
    p.add_argument('--saved-envelope',type=Path);p.add_argument('--insight-type');p.add_argument('--insight-id')
    p.add_argument('--audience',choices=['fan','analyst'],default='fan');p.add_argument('--favorite-team',choices=['NORTH','SOUTH'])
    p.add_argument('--language',default='en');p.add_argument('--provider',choices=['fake','foundry'],default='fake')
    p.add_argument('--runtime',choices=['offline','framework'],default='offline')
    p.add_argument('--mode',choices=['fallback','simple','adaptive'],default='adaptive')
    p.add_argument('--timeout',type=float,default=12.);p.add_argument('--fail-role',choices=['director','match_analyst','tactical_analyst','challenger','narrator','replay_producer'])
    p.add_argument('--failure',choices=['auth','timeout','rate_limit','malformed','unknown_claim','unsupported_tool','objection','wrong_overlay'],default='timeout')
    p.add_argument('--question',choices=['evidence','before_goal','shot_sequence','why_highlighted','position_change','compare_position','coach_intent','xg','possession_percentage','counterfactual'],default='evidence')
    a=p.parse_args()
    try:asyncio.run(execute(a))
    except (ValueError,OSError,ProviderFailure,ImportError,asyncio.TimeoutError) as exc:
        # Do not emit private provider exception bodies.
        code=exc.code if isinstance(exc,ProviderFailure) else type(exc).__name__
        p.exit(2,f'Studio input/provider error: {code}. Inspect configuration and documented prerequisites.\n')
if __name__=='__main__':main()
