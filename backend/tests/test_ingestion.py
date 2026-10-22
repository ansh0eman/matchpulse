import json
import pytest
from pydantic import ValidationError
from matchpulse.schemas import CanonicalEvent, MatchIdentity
from matchpulse.ingestion import validate_stream,load_match,IngestionError
from conftest import event,MATCH

def lines(events):return [e.model_dump_json() for e in events]

def test_valid_nullable_and_out_of_play():
    e=event(x=110.)
    assert list(validate_stream(lines([e])))[0].position_m.x==110
    data=e.model_dump();data.update(team_id=None,player_id=None,attacking_position_m=None,possession_team_id=None)
    assert CanonicalEvent.model_validate(data).team_id is None

@pytest.mark.parametrize('change',[{'schema_version':2},{'schema_version':True},{'sequence':'0'}, {'time_seconds':float('nan')},{'time_seconds':float('inf')},{'type':'tactical_change'}, {'hidden_truth':3600},{'id':''}])
def test_strict_bad_fields(change):
    data=event().model_dump();data.update(change)
    with pytest.raises(ValidationError):CanonicalEvent.model_validate(data)

@pytest.mark.parametrize('raw',['{bad','null','{}',''])
def test_malformed_json(raw):
    with pytest.raises(IngestionError,match='line 1'):list(validate_stream([raw]))

def test_order_duplicate_gap_and_counter():
    a=event();b=event(1,10)
    assert len(list(validate_stream(lines([a,b]))))==2
    for bad in [b.model_copy(update={'id':a.id}),event(2,10),b.model_copy(update={'time_seconds':-1.})]:
        with pytest.raises(IngestionError):list(validate_stream(lines([a,bad])))

def test_direction_is_checked_not_clamped():
    data=event().model_dump();data['attacking_position_m']['x']=90.
    with pytest.raises(ValidationError,match='disagree'):CanonicalEvent.model_validate(data)

def test_team_and_period_consistency():
    data=event(1,10).model_dump();data['team_id']='SOUTH';data['attacking_position_m']['x']=80.
    with pytest.raises(IngestionError,match='changed teams'):list(validate_stream([event().model_dump_json(),json.dumps(data)]))
    with pytest.raises(IngestionError,match='regressed'):list(validate_stream(lines([event(period=2),event(1,10,period=1)])))

def test_opaque_identity_and_path(tmp_path,identity):
    with pytest.raises(ValidationError):MatchIdentity(match_id='high_press_at_3600')
    with pytest.raises(ValidationError):MatchIdentity(match_id=MATCH,ground_truth=3600)
    path=tmp_path/f'{MATCH}.jsonl';path.write_text(event().model_dump_json()+'\n')
    assert len(list(load_match(path,identity)))==1
    with pytest.raises(IngestionError,match='opaque'):list(load_match(tmp_path/'bundle.jsonl',identity))
