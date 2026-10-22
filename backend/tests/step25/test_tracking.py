from __future__ import annotations
import ast,json,gzip
from dataclasses import replace
from pathlib import Path
import pytest
from pydantic import ValidationError
from matchpulse.schemas import MatchIdentity
from matchpulse.tracking.schemas import TrackingFrame
from matchpulse.tracking.ingestion import validate_frames,load_frames
from matchpulse.tracking.features import extract_features,attack_point,FeatureSample,FEATURE_NAMES
from matchpulse.tracking.windows import TrackingWindows
from matchpulse.tracking.detector import TrackingConfig,PositionalDetector
from matchpulse.tracking.replay import comparisons_from_frames,comparisons_from_samples,detect
from matchpulse.tracking.evidence import make_pack,verify_geometry,compact_agent_facts

ROOT=Path(__file__).resolve().parents[3]
MATCH='6b7b55d0-7f2c-4ae6-a289-af552535d21d'

def frame(t=1,shift=0,period=1,team='NORTH'):
    # SOUTH owns the ball in its own half; NORTH defends toward its own goal.
    players=[{'id':f'N{i}','team_id':'NORTH','goalkeeper':i==0,'x':float(2 if i==0 else 10+i*3+shift),'y':float(i*5)} for i in range(11)]
    players += [{'id':f'S{i}','team_id':'SOUTH','goalkeeper':i==0,'x':float(65+i*3),'y':float(i*5)} for i in range(11)]
    data={'schema_version':1,'frame_id':f'f{t}','sequence':int(t),'time_seconds':float(t),'period':period,'phase':'open_play',
        'score':{'home':0,'away':0},'ball':{'x':80.,'y':25.,'owner_id':'S5','owner_status':'active'},'players':players}
    if period==2:
        for p in data['players']:p['x']=105-p['x'];p['y']=68-p['y']
        data['ball']['x']=105-data['ball']['x'];data['ball']['y']=68-data['ball']['y']
    return TrackingFrame.model_validate(data)

def toy_frames():return [frame(t,shift=0 if t<=300 else 15) for t in range(1,901)]
def config(**kwargs):return TrackingConfig(reference_seconds=300,recent_seconds=60,min_reference=5,min_recent=3,**kwargs)

@pytest.mark.parametrize('field',['currentIntent','target','policy','scenario','intervention_time','rng_state'])
def test_allowlist_rejects_hidden_fields_at_every_level(field):
    for level in ['frame','player','ball']:
        data=frame().model_dump();target=data if level=='frame' else data['players'][1] if level=='player' else data['ball'];target[field]='hidden'
        with pytest.raises(ValidationError):TrackingFrame.model_validate(data)

@pytest.mark.parametrize('field',['period','schema_version','time_seconds','sequence'])
def test_strict_boolean_and_nonfinite_rejection(field):
    d=frame().model_dump();d[field]=True
    with pytest.raises(ValidationError):TrackingFrame.model_validate(d)
    d=frame().model_dump();d['players'][0]['x']=float('nan')
    with pytest.raises(ValidationError):TrackingFrame.model_validate(d)

def test_coordinates_goalkeeper_and_halftime():
    a=extract_features(frame(), 'NORTH');b=extract_features(frame(period=2),'NORTH')
    assert a and b and a.values==pytest.approx(b.values)
    assert a.values['line3_m']==16 # 13,16,19; goalkeeper at2 excluded
    assert attack_point(80,25,'SOUTH',1)==(25,43)
    assert extract_features(frame(),'SOUTH') is None
    d=frame().model_dump();d['phase']='corner'
    assert extract_features(TrackingFrame.model_validate(d),'NORTH') is None

def test_owner_quality_roster_and_missing_frames():
    d=frame().model_dump();d['players']=[p for p in d['players'] if p['id']!='S5'];d['ball']['owner_status']='inactive_reference'
    assert extract_features(TrackingFrame.model_validate(d),'NORTH') is None
    d=frame().model_dump();d['players']=[p for p in d['players'] if p['id']!='N3']
    sample=extract_features(TrackingFrame.model_validate(d),'NORTH');assert sample.context[2]==9
    d['players'].append({'id':'SUB1','team_id':'NORTH','goalkeeper':False,'x':22.,'y':20.})
    assert extract_features(TrackingFrame.model_validate(d),'NORTH').context[2]==10
    rows=[frame(1).model_dump_json(),frame(3).model_dump_json()]
    assert len(list(validate_frames(rows)))==2 # gaps aren't fabricated, no interpolation
    with pytest.raises(ValueError):list(validate_frames(rows[::-1]))
    d=frame(3).model_dump();d['frame_id']='f1'
    with pytest.raises(ValueError):list(validate_frames([rows[0],json.dumps(d)]))
    d=frame().model_dump();d['ball']['owner_status']='unowned'
    with pytest.raises(ValidationError):TrackingFrame.model_validate(d)

def test_opaque_filenames(tmp_path):
    bad=tmp_path/'strong.tracking.jsonl.gz'
    with gzip.open(bad,'wt') as f:f.write(frame().model_dump_json()+'\n')
    with pytest.raises(ValueError):list(load_frames(bad,MatchIdentity(match_id=MATCH)))

def test_context_mixture_and_support():
    w=TrackingWindows(300,60,2,2)
    def s(t,value,context):return FeatureSample(f'f{t}',t,1,'NORTH',context,{k:value for k in FEATURE_NAMES})
    # Old and new context mix differ, within-context values unchanged.
    for t in range(1,181):w.update(s(t,10 if t%3 else 30,(t%3==0,0,10,10)))
    for t in range(181,241):w.update(s(t,30 if t%3 else 10,(t%3!=0,0,10,10)))
    o=w.compare(240,'NORTH');assert o and o.delta['line3_m']==pytest.approx(0)
    assert TrackingWindows().compare(60,'NORTH') is None
    w.reset(2,241);assert w.compare(270,'NORTH') is None

def test_raw_cache_replay_prefix_and_no_future():
    frames=toy_frames();c=config();samples=[extract_features(f,'NORTH') for f in frames]
    a=list(comparisons_from_frames(iter(frames),c));b=list(comparisons_from_samples(samples,900,c,{'1':1}))
    assert a==b
    full=detect(iter(a),c);assert len(full)==1 and full[0].direction=='advance'
    for boundary in [299,300,330,420,600,899]:
        prefix=detect(comparisons_from_frames(iter(frames[:boundary]),c),c)
        assert prefix==[alert for alert in full if alert.comparison.time<=boundary]
    stable=[frame(t) for t in range(1,901)]
    assert detect(comparisons_from_frames(iter(stable),c),c)==[]
    assert detect(comparisons_from_frames(iter(frames),c),c)==full
    # Missing unrelated-team comparisons cannot change NORTH state.
    north=detect((row for row in a if row[1]=='NORTH'),c)
    assert north==full

def test_evidence_recomputed_from_raw_not_claims():
    frames=toy_frames();c=config();a=detect(comparisons_from_frames(iter(frames),c),c)[0]
    pack=make_pack(MATCH,a,c)
    assert verify_geometry(pack,frames)
    assert verify_geometry(pack,[f for f in frames if f.time_seconds<=pack.detected_at_seconds])
    bad=pack.model_copy(deep=True);bad.after['line3_m']+=1
    assert not verify_geometry(bad,frames)
    bad=pack.model_copy(deep=True);bad.tracking_references['recent'].pop()
    assert not verify_geometry(bad,frames)
    facts=compact_agent_facts(pack);assert 'tracking_references' not in facts and 'players' not in facts and 'frames' not in facts
    assert 'not a probability' in pack.score_semantics

@pytest.mark.parametrize('method',['cusum','logistic'])
def test_sequential_and_model_deterministic(method):
    c=config(method=method,line_threshold_m=2.5)
    model={'mean':[0,0,0],'scale':[1,1,1],'weights':[1,0,0],'intercept':-5}
    a=detect(comparisons_from_frames(iter(toy_frames()),c),c,model=model)
    b=detect(comparisons_from_frames(iter(toy_frames()),c),c,model=model)
    assert a==b and len(a)>0

def test_inference_import_boundary():
    directory=ROOT/'backend/src/matchpulse/tracking'
    for p in directory.glob('*.py'):
        tree=ast.parse(p.read_text())
        for node in ast.walk(tree):
            if isinstance(node,ast.ImportFrom):assert not any(v in (node.module or '') for v in ['evaluation','scripts','ground_truth'])
            if isinstance(node,ast.Constant) and isinstance(node.value,str):
                assert not any(v in node.value for v in ['data/step25/evaluation','manifest.json','source-audit'])
    assert not (ROOT/'data/step25/evaluation/holdout-manifest.json').exists() or (ROOT/'research/step25/artifacts/frozen.json').exists()

def test_retained_real_geometry_fixtures():
    from matchpulse.tracking.evidence import PositionalEvidencePack
    directory=ROOT/'research/step25/fixtures'
    for kind in ['success','false_alert']:
        pack=PositionalEvidencePack.model_validate_json((directory/f'{kind}-evidence.json').read_text())
        path=directory/f'{kind}-{pack.match_id}.tracking.jsonl.gz'
        with gzip.open(path,'rt') as source:frames=list(validate_frames(source))
        assert verify_geometry(pack,frames)
        referenced=set(pack.tracking_references['reference']+pack.tracking_references['recent'])
        assert referenced=={f.frame_id for f in frames}
