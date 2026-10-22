"""Real CLI plumbing on a small controlled feed, not a football accuracy sample."""
from __future__ import annotations
import gzip,json,subprocess,sys
from pathlib import Path
from matchpulse.ingestion import load_match
from matchpulse.schemas import MatchIdentity
from matchpulse.tracking.detector import TrackingConfig
from matchpulse.tracking.ingestion import load_frames
from matchpulse.tracking.replay import comparisons_from_frames,detect
from matchpulse.tracking.evidence import make_pack,compact_agent_facts
from matchpulse.tracking.presentation import review_episode

ROOT=Path(__file__).resolve().parents[3]
IDENTITY=MatchIdentity(match_id='6b7b55d0-7f2c-4ae6-a289-af552535d21d')


def write_feed(directory):
    frames=[];events=[]
    for t in range(901):
        shift=15 if t>300 else 0
        players=[{'id':f'N{i}','team_id':'NORTH','goalkeeper':i==0,
                  'x':float(2 if i==0 else 10+i*3+shift),'y':float(i*5)} for i in range(11)]
        players += [{'id':f'S{i}','team_id':'SOUTH','goalkeeper':i==0,
                     'x':float(65+i*3),'y':float(i*5)} for i in range(11)]
        frames.append({'schema_version':1,'frame_id':f'f{t}','sequence':t,'time_seconds':t,
            'period':1,'phase':'open_play','score':{'home':0,'away':0},
            'ball':{'x':80,'y':25,'owner_id':'S5','owner_status':'active'},'players':players})
        if t%10==0:
            i=len(events);position={'x':80 if t>300 else 30,'y':25}
            events.append({'schema_version':1,'id':f'e{i}','sequence':i,'time_seconds':t,
                'period':1,'team_id':'NORTH','player_id':'N1','secondary_player_id':None,
                'type':'recovery','position_m':position,'attacking_position_m':position,
                'outcome':None,'possession_id':f'p{i}','possession_team_id':'NORTH',
                'score':{'home':0,'away':0},'evidence':{'source_index':i,'field_zones':[],
                'attack_pattern':'open_play','chance_quality':None,'possession_final_third_entries':0}})
    tracking=directory/f'{IDENTITY.match_id}.tracking.jsonl.gz'
    tracking.write_bytes(gzip.compress(('\n'.join(map(json.dumps,frames))+'\n').encode(),mtime=0))
    canonical=directory/f'{IDENTITY.match_id}.jsonl'
    canonical.write_text('\n'.join(map(json.dumps,events))+'\n')
    return tracking,canonical


def test_real_cli_exports_all_research_and_only_verified_claims(tmp_path):
    tracking,canonical=write_feed(tmp_path);output=tmp_path/'demo.json'
    config_path=ROOT/'research/step25/artifacts/selected.json'
    result=subprocess.run([sys.executable,'-m','matchpulse.tracking.cli',str(tracking),
        '--events',str(canonical),'--config',str(config_path),'--debug','--output',str(output)],
        cwd=ROOT,capture_output=True,text=True)
    assert result.returncode==0,result.stderr
    frames=list(load_frames(tracking,IDENTITY));events=list(load_match(canonical,IDENTITY))
    config=TrackingConfig.model_validate_json(config_path.read_text())
    alerts=detect(comparisons_from_frames(iter(frames),config),config,events)
    packs=[make_pack(IDENTITY.match_id,a,config) for a in alerts]
    assert len(packs)==1
    assert json.loads(output.read_text())==[p.model_dump() for p in packs]
    assert json.loads(output.with_suffix('.facts.json').read_text())==[compact_agent_facts(p) for p in packs]
    decisions=[review_episode(p,frames,events) for p in packs]
    assert json.loads(output.with_suffix('.presentation.json').read_text())==[d.model_dump() for d in decisions]
    broadcast=json.loads(output.with_suffix('.broadcast.json').read_text())
    assert broadcast==[d.claim.model_dump() for d in decisions if d.claim]
    assert len(broadcast)==1
    assert broadcast[0]['as_of_seconds']==broadcast[0]['latest_observation_seconds']
    assert broadcast[0]['reference_frames']>=12 and broadcast[0]['recent_frames']>=6
    assert 'coach' not in broadcast[0]['statement'].lower()
    assert 'probability' not in broadcast[0]['statement'].lower()
    assert 'detection_score' not in broadcast[0]


def test_real_cli_missing_fused_events_exits_without_export(tmp_path):
    tracking,_=write_feed(tmp_path);output=tmp_path/'demo.json'
    result=subprocess.run([sys.executable,'-m','matchpulse.tracking.cli',str(tracking),
        '--config',str(ROOT/'research/step25/artifacts/selected.json'),'--output',str(output)],
        cwd=ROOT,capture_output=True,text=True)
    assert result.returncode==2
    assert 'Fused replay requires canonical events' in result.stderr
    assert not output.exists()
    assert not output.with_suffix('.broadcast.json').exists()
