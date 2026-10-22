import json
import pytest
from matchpulse.schemas import CanonicalEvent, MatchIdentity

MATCH='12345678-1234-4123-a123-123456789abc'

def event(index=0,time=0.,x=25.,team='NORTH',period=1,kind='recovery',possession='pos_1',entries=0):
    forward=(team=='NORTH')==(period==1)
    raw={'x':x if forward else 105-x,'y':34.}
    return CanonicalEvent.model_validate({'schema_version':1,'id':f'evt_{index:06}','sequence':index,'time_seconds':float(time),'period':period,
        'team_id':team,'player_id':f'{team}_01','secondary_player_id':None,'type':kind,'position_m':raw,
        'attacking_position_m':{'x':float(x),'y':34.},'outcome':None,'possession_id':possession,'possession_team_id':team,
        'score':{'home':0,'away':0},'evidence':{'source_index':index,'field_zones':[],'attack_pattern':'none','chance_quality':None,'possession_final_third_entries':entries}})

@pytest.fixture
def identity():return MatchIdentity(match_id=MATCH)

@pytest.fixture
def toy_events():return [event(i,i*10.,25. if i*10<1200 else 90.,possession=f'pos_{i}') for i in range(241)]
