"""Real retained positional evidence exercises tactical routing and failure handling."""
import asyncio,gzip
from pathlib import Path
from matchpulse.ingestion import validate_stream
from matchpulse.tracking.ingestion import validate_frames
from matchpulse.tracking.evidence import PositionalEvidencePack
from matchpulse.tracking.presentation import review_episode
from matchpulse.stories.evidence import EvidenceIndex
from matchpulse.stories.schemas import Claim,Reference,MatchInsight,TimelineItem
from matchpulse.stories.claims import claim_id,wording
from matchpulse.stories.export import agent_input
from matchpulse.agents.provider import FakeProvider
from matchpulse.agents.workflow import Studio
from matchpulse.agents.schemas import Preferences
from matchpulse.agents.publication import verify_publication

ROOT=Path(__file__).resolve().parents[3]
def retained_position():
    d=ROOT/'research/step25/fixtures'
    pack=PositionalEvidencePack.model_validate_json((d/'success-evidence.json').read_text())
    frames=list(validate_frames(gzip.decompress((d/f'success-{pack.match_id}.tracking.jsonl.gz').read_bytes()).decode().splitlines()))
    events=list(validate_stream(gzip.decompress((d/'success-event-prefix.jsonl.gz').read_bytes()).decode().splitlines()))
    line=review_episode(pack,frames,events).claim;assert line is not None
    refs=tuple(Reference(match_id=pack.match_id,category='tracking',source_id=i) for i in pack.tracking_references['reference']+pack.tracking_references['recent'])
    window=tuple(line.recent_window)
    c=Claim(claim_id=claim_id(pack.match_id,'observed_line_height_change',refs,window),match_id=pack.match_id,
        type='observed_line_height_change',team_id=line.team_id,player_ids=(),value={'kind':'observed_line_height_change','line':line},
        unit='m',window=window,as_of_seconds=line.as_of_seconds,references=refs,verification_method='presentation_gate_v1',limitations=(line.qualification,))
    i=MatchInsight(insight_id=c.claim_id.replace(':claim:',':insight:'),match_id=c.match_id,type=c.type,
        event_time_seconds=c.as_of_seconds,as_of_seconds=c.as_of_seconds,team_id=c.team_id,player_ids=(),period=events[-1].period,
        priority=70,claim_ids=(c.claim_id,),evidence=refs,observed_score=events[-1].score,fallback=wording(c),limitations=c.limitations)
    item=TimelineItem(insight=i,presented_at_seconds=i.as_of_seconds,visualization='tracking_comparison')
    result={'claims':[c],'insights':[i],'timeline':[item],'index':EvidenceIndex(pack.match_id,events,frames,[pack])}
    return result,item,agent_input(i,{c.claim_id:c},'analyst')

def test_tactical_route_and_challenge_actually_narrows():
    result,item,env=retained_position();provider=FakeProvider();studio=Studio(result,provider,Preferences(audience='analyst'))
    artifact,state=asyncio.run(studio.run(env,item))
    assert 'tactical_analyst' in [c['role'] for c in provider.calls] and 'match_analyst' not in [c['role'] for c in provider.calls]
    assert state.challenge.disposition=='narrow' and state.narration_plan.angle=='evidence_first'
    assert artifact.overlay.plan.family=='positional_comparison'
    assert verify_publication(artifact,state,item,result,studio.tools)

def test_tactical_unavailable_is_real_invoked_failure():
    result,item,env=retained_position();provider=FakeProvider({'tactical_analyst':'unavailable'})
    studio=Studio(result,provider,Preferences(audience='analyst'))
    artifact,state=asyncio.run(studio.run(env,item))
    assert [c['role'] for c in provider.calls]==['director','tactical_analyst']
    assert any(e.startswith('tactical_analyst:unavailable') for e in artifact.errors)
    assert artifact.narration_status=='fallback' and artifact.overlay_status=='fallback'
    assert verify_publication(artifact,state,item,result,studio.tools)
