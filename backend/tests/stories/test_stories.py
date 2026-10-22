"""Adversarial contract, streaming and real-source tests (no provider calls)."""
import gzip,json,subprocess,sys
from pathlib import Path
from uuid import uuid4
import pytest
from matchpulse.schemas import CanonicalEvent
from matchpulse.ingestion import validate_stream
from matchpulse.stories.replay import replay
from matchpulse.stories.schemas import Claim,MatchInsight,TimelineItem
from matchpulse.stories.export import agent_input,grounded_response
from matchpulse.stories.event_semantics import high_transition,linked_shot
from matchpulse.stories.evidence import EvidenceIndex

ROOT=Path(__file__).resolve().parents[3]
MID='5cc7f774-c215-4773-9318-3a01ad8b23af'

def event(n,kind='dribble',team='NORTH',score=(0,0),time=None,pos='pos_1',owner=None,player='north',secondary=None,period=1,x=75):
    return CanonicalEvent.model_validate(dict(schema_version=1,id=f'evt_{n:06}',sequence=n,
        time_seconds=float(n if time is None else time),period=period,team_id=team,player_id=player,
        secondary_player_id=secondary,type=kind,position_m={'x':float(x if (team=='NORTH')==(period==1) else 105-x),'y':34.},
        attacking_position_m={'x':float(x),'y':34.} if team else None,outcome=None,
        possession_id=pos,possession_team_id=owner or team,score={'home':score[0],'away':score[1]},
        evidence={'source_index':n,'field_zones':[],'attack_pattern':'none','chance_quality':None,'possession_final_third_entries':0}))

@pytest.mark.parametrize('scores,teams,contexts',[
 ([(1,0)],['NORTH'],['opening_goal']),
 ([(1,0),(1,1)],['NORTH','SOUTH'],['opening_goal','equalizer']),
 ([(1,0),(1,1),(2,1)],['NORTH','SOUTH','NORTH'],['opening_goal','equalizer','go_ahead']),
 ([(1,0),(2,0),(2,1)],['NORTH','NORTH','SOUTH'],['opening_goal','extends_lead','reduces_deficit'])])
def test_goal_context(scores,teams,contexts):
    rows=[event(0,'match_start')]+[event(n+1,'goal',t,s,player=None) for n,(s,t) in enumerate(zip(scores,teams))]
    r=replay(MID,rows)
    assert [c.value.context for c in r['claims'] if c.type=='goal_context']==contexts
    assert len([i for i in r['timeline'] if i.insight.type=='goal_context'])==len(scores)
    assert all(r['index'].verify(c) for c in r['claims'])

def test_bad_score_and_duplicates_fail():
    with pytest.raises(ValueError):replay(MID,[event(0,'goal',score=(0,1))])
    with pytest.raises(ValueError):replay(MID,[event(0),event(0)])
    with pytest.raises(ValueError):replay(MID,[event(0),event(1,score=(1,0))])

@pytest.mark.parametrize('outcome',['save','miss','blocked_shot'])
def test_shot_outcome(outcome):
    opposite=outcome!='miss'
    rows=[event(0,'shot'),event(1,outcome,team='SOUTH' if opposite else 'NORTH',player='south' if opposite else 'north',secondary='north' if opposite else None)]
    r=replay(MID,rows)
    assert [c.type for c in r['claims']]==['observed_shot','shot_outcome']
    assert not linked_shot(rows[0],rows[1].model_copy(update={'secondary_player_id':'wrong','player_id':'wrong'}))
    assert not linked_shot(rows[0],rows[1].model_copy(update={'time_seconds':16.}))

def test_turnovers_and_sequence():
    rows=[event(0,team='SOUTH',player='south',pos='old'),event(1,'interception',pos='new'),event(2,'shot',pos='new')]
    r=replay(MID,rows)
    assert [c.type for c in r['claims']]==['high_turnover','turnover_to_shot','observed_shot']
    assert all(r['index'].verify(c) for c in r['claims'])
    assert not high_transition(rows[0].model_copy(update={'possession_team_id':'NORTH'}),rows[1])
    assert not high_transition(None,rows[1])
    assert not high_transition(rows[0],rows[1].model_copy(update={'possession_id':'old'}))
    assert not high_transition(rows[0].model_copy(update={'type':'save'}),rows[1])
    broken=rows[:2]+[event(2,'shot',pos='different')]
    assert 'turnover_to_shot' not in [c.type for c in replay(MID,broken)['claims']]

@pytest.mark.parametrize('mutation',[
 {'team_id':'SOUTH'},{'unit':'m'},{'match_id':str(uuid4())},{'as_of_seconds':0.},
 {'player_ids':('wrong',)},{'window':(0.,4.)},{'type':'player_dismissal'},
 {'verification_method':'presentation_gate_v1'}])
def test_tamper_rejected(mutation):
    r=replay(MID,[event(0,'match_start'),event(1,'goal',score=(1,0))]);c=r['claims'][-1]
    assert not r['index'].verify(c.model_copy(update=mutation))

def test_values_references_and_future_rejected():
    r=replay(MID,[event(0,'shot'),event(1,'miss'),event(2,'red_card')]);c=r['claims'][0]
    for ref in [c.references[0].model_copy(update={'match_id':str(uuid4())}),c.references[0].model_copy(update={'source_id':'missing'}),c.references[0].model_copy(update={'source_id':'evt_000002'})]:
        assert not r['index'].verify(c.model_copy(update={'references':(ref,)}))
    assert not r['index'].verify(c.model_copy(update={'value':c.value.model_copy(update={'action':'goal'})}))

def test_activity_counts_periods_and_sparse_clock():
    rows=[event(0,'shot',time=10),event(1,'shot',time=20),event(2,'shot',time=30),event(3,'half_time',time=2903,period=2),event(4,'shot',time=2904,period=2)]
    r=replay(MID,rows);activity=next(c for c in r['claims'] if c.type=='recent_attacking_activity')
    assert activity.value.shots==3
    assert not r['index'].verify(activity.model_copy(update={'value':activity.value.model_copy(update={'shots':4})}))
    assert len([c for c in r['claims'] if c.type=='recent_attacking_activity'])==1
    assert r['recent_state_high_water']==3

@pytest.mark.parametrize('cut',[1,2,3,4])
def test_prefix_and_equal_times(cut):
    rows=[event(0,'match_start',time=0),event(1,'shot',time=0),event(2,'goal',score=(1,0),time=1),event(3,'kickoff',score=(1,0),time=1)]
    full=replay(MID,rows);short=replay(MID,rows[:cut])
    assert full['insights'][:len(short['insights'])]==short['insights']
    assert all(t in full['timeline'] for t in short['timeline'])
    assert replay(MID,rows)['timeline']==full['timeline']

def test_scheduler_duplicate_cooldown_priority_delay():
    from matchpulse.stories.scheduler import StoryScheduler
    r=replay(MID,[event(0,'shot'),event(1,'goal',score=(1,0),time=0)])
    s=StoryScheduler();shot,goal=r['insights'];s.submit(shot);s.submit(shot);s.submit(goal)
    assert s.suppressed[0]['reason']=='duplicate'
    assert s.timeline[-1].presented_at_seconds==goal.as_of_seconds
    later=shot.model_copy(update={'insight_id':'another'})
    s.submit(later);assert s.suppressed[-1]['reason']=='incident_already_narrated'
    later=later.model_copy(update={'evidence':(later.evidence[0].model_copy(update={'source_id':'another-shot'}),)})
    s.submit(later);assert s.timeline[-1].presented_at_seconds>later.as_of_seconds
    assert s.timeline[-1].insight==later
    activity=shot.model_copy(update={'type':'recent_attacking_activity','insight_id':'a'})
    s.submit(activity);s.submit(activity.model_copy(update={'insight_id':'b'}))
    assert s.suppressed[-1]['reason']=='editorial_cooldown'

def test_agent_fails_closed_and_schema():
    r=replay(MID,[event(0,'shot')]);i=r['insights'][0];env=agent_input(i,{c.claim_id:c for c in r['claims']})
    assert not grounded_response('{"headline":"coach ordered press"}',env)[1]
    payload=json.dumps(dict(schema_version=1,match_id=MID,insight_id=i.insight_id,selected_claim_ids=list(i.claim_ids),template='deterministic_fallback'))
    assert grounded_response(payload,env)==(i.fallback,True)
    for model in (Claim,MatchInsight,TimelineItem):assert model.model_json_schema()['additionalProperties'] is False
    assert Claim.model_validate_json(r['claims'][0].model_dump_json())==r['claims'][0]

def test_real_prefix_fixture_cli(tmp_path):
    path=ROOT/'research/step25/fixtures/success-event-prefix.jsonl.gz'
    raw=gzip.decompress(path.read_bytes());events=list(validate_stream(raw.decode().splitlines()))
    source=tmp_path/f'{MID}.jsonl';source.write_bytes(raw)
    out=tmp_path/'out'
    proc=subprocess.run([sys.executable,'-m','matchpulse.stories.cli','--events',str(source),'--output',str(out)],capture_output=True,text=True)
    assert proc.returncode==0,proc.stderr
    summary=json.loads((out/'summary.json').read_text())
    assert summary['all_claims_verified'] and summary['dangling_references']==0
    full=replay(MID,events);prefix=replay(MID,events[:1000])
    assert full['insights'][:len(prefix['insights'])]==prefix['insights']
    assert replay(str(uuid4()),events)['claims'][0].claim_id!=full['claims'][0].claim_id

def test_penalty_score_snapshot_precedes_goal():
    penalty=event(1,'penalty',score=(1,0),time=5).model_copy(update={'outcome':'goal'})
    rows=[event(0,'match_start'),penalty,event(2,'goal',score=(1,0),time=5)]
    r=replay(MID,rows)
    c=next(c for c in r['claims'] if c.type=='goal_context')
    assert c.value.context=='score_already_updated'
    assert c.value.before==c.value.after
    assert r['index'].verify(c)

def test_unsupported_prose_in_limitations_rejected():
    r=replay(MID,[event(0,'shot')]);c=r['claims'][0]
    assert not r['index'].verify(c.model_copy(update={'limitations':('Coach ordered a press.',)}))

@pytest.mark.parametrize('name,eligible',[('success',True),('false_alert',False)])
def test_real_positional_registry(name,eligible):
    from matchpulse.tracking.evidence import PositionalEvidencePack
    from matchpulse.tracking.ingestion import validate_frames
    from matchpulse.tracking.presentation import review_episode
    from matchpulse.stories.schemas import Reference
    from matchpulse.stories.claims import claim_id
    directory=ROOT/'research/step25/fixtures'
    pack=PositionalEvidencePack.model_validate_json((directory/f'{name}-evidence.json').read_text())
    frames=list(validate_frames(gzip.decompress((directory/f'{name}-{pack.match_id}.tracking.jsonl.gz').read_bytes()).decode().splitlines()))
    events=list(validate_stream(gzip.decompress((directory/f'{name}-event-prefix.jsonl.gz').read_bytes()).decode().splitlines()))
    decision=review_episode(pack,frames,events)
    assert (decision.claim is not None)==eligible
    if not eligible:return
    line=decision.claim;refs=tuple(Reference(match_id=pack.match_id,category='tracking',source_id=i) for i in pack.tracking_references['reference']+pack.tracking_references['recent'])
    window=tuple(line.recent_window)
    c=Claim(claim_id=claim_id(pack.match_id,'observed_line_height_change',refs,window),match_id=pack.match_id,
        type='observed_line_height_change',team_id=line.team_id,player_ids=(),value={'kind':'observed_line_height_change','line':line},
        unit='m',window=window,as_of_seconds=line.as_of_seconds,references=refs,verification_method='presentation_gate_v1',limitations=(line.qualification,))
    index=EvidenceIndex(pack.match_id,events,frames,[pack])
    assert index.verify(c)
    assert not index.verify(c.model_copy(update={'value':c.value.model_copy(update={'line':line.model_copy(update={'change_m':999.})})}))

def test_long_sparse_stream_bounds_rolling_state():
    from matchpulse.stories.state import MatchStoryState
    state=MatchStoryState()
    for n in range(4000):state.update(event(n,'shot' if n%100==0 else 'dribble',time=n*10))
    assert state.high_water_recent<=1
    assert len(state.shots)<=1

def test_invalid_link_and_goal_numbers_fail_closed():
    rows=[event(0,'shot'),event(1,'shot'),event(2,'save',team='SOUTH',player='south',secondary='north')]
    r=replay(MID,rows);c=next(c for c in r['claims'] if c.type=='shot_outcome')
    # Alter a reference and regenerate its stable ID: correctness still cannot be bypassed.
    from matchpulse.stories.claims import claim_id
    refs=(c.references[0].model_copy(update={'source_id':rows[0].id}),c.references[1])
    bad=c.model_copy(update={'references':refs,'window':(0.,2.),'claim_id':claim_id(MID,c.type,refs,(0.,2.))})
    assert not r['index'].verify(bad)
    r=replay(MID,[event(0,'match_start'),event(1,'goal',score=(1,0))]);c=r['claims'][-1]
    assert not r['index'].verify(c.model_copy(update={'value':c.value.model_copy(update={'context':'equalizer'})}))

def test_activity_window_excludes_left_boundary_zero():
    rows=[event(0,'shot',time=0),event(1,'shot',time=10),event(2,'shot',time=20),event(3,'shot',time=30)]
    r=replay(MID,rows)
    activity=[c for c in r['claims'] if c.type=='recent_attacking_activity']
    assert len(activity)==1 and activity[0].value.shots==3
    assert r['index'].verify(activity[0])
