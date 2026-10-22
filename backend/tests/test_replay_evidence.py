import json
import pytest
from pathlib import Path
from pydantic import ValidationError
from matchpulse.replay import replay,observations
from matchpulse.detectors.rolling import DetectorConfig,RollingDetector
from matchpulse.evidence import EvidencePack,verify_evidence
from conftest import event,MATCH

CONFIG=DetectorConfig(window_seconds=300,threshold=1.,min_recoveries=8)

def test_step_change_determinism_cooldown_and_evidence(toy_events,identity):
    packs=replay(iter(toy_events),identity,CONFIG)
    assert packs and 1200<packs[0].detected_at_seconds<1800
    assert packs==replay(iter(toy_events),identity,CONFIG)
    for a,b in zip(packs,packs[1:]):assert b.detected_at_seconds-a.detected_at_seconds>=900
    assert all(verify_evidence(p,toy_events) for p in packs)
    p=packs[0];assert p.score_semantics.startswith('Uncalibrated')
    assert json.loads(p.model_dump_json())['detection_score']>0
    # Independent arithmetic from the canonical windows, without SignalState.
    for name,start,end in [('before',p.comparison.before_start,p.comparison.split),('after',p.comparison.split,p.comparison.after_end)]:
        xs=[e.attacking_position_m.x for e in toy_events if start<e.time_seconds<=end]
        facts=getattr(p.facts,name)
        assert facts.recovery_count==len(xs)
        assert facts.mean_recovery_x_m==sum(xs)/len(xs)
        assert facts.high_recovery_count==sum(x>=70 for x in xs)
    assert all(r.match_id==MATCH for r in p.calculation_references)

def test_prefix_invariance_and_future_poisoning(toy_events,identity):
    through=1500
    prefix=[e for e in toy_events if e.time_seconds<=through]
    earlier=replay(iter(prefix),identity,CONFIG)
    full=replay(iter(toy_events),identity,CONFIG)
    assert earlier==[p for p in full if p.detected_at_seconds<=through]
    poison=[event(i,i*10.,-400 if i%2 else 600,possession=f'pos_{i}') for i in range(151,241)]
    assert earlier==[p for p in replay(iter(prefix+poison),identity,CONFIG) if p.detected_at_seconds<=through]

@pytest.mark.parametrize('method',['rolling','page_hinkley','adwin'])
def test_stable_stream_and_isolation(method,identity):
    stream=[event(i,i*10.,40.,possession=f'pos_{i}') for i in range(601)]
    config=DetectorConfig(method=method,window_seconds=300,threshold=1.)
    assert replay(iter(stream),identity,config)==[]
    assert replay(iter(stream),identity,config)==[]

def test_tampered_or_future_evidence_fails(toy_events,identity):
    pack=replay(iter(toy_events),identity,CONFIG)[0]
    bad=pack.model_copy(update={'calculation_references':pack.calculation_references[:-1]})
    assert not verify_evidence(bad,toy_events)
    bad=pack.model_copy(update={'facts':pack.facts.model_copy(update={'before':pack.facts.before.model_copy(update={'recovery_count':999})})})
    assert not verify_evidence(bad,toy_events)
    with pytest.raises(ValidationError):EvidencePack.model_validate({**pack.model_dump(),'detection_score':float('nan')})

def test_no_metadata_io_or_extra_inference_parameters(toy_events,identity,monkeypatch):
    def forbidden(*args,**kwargs):raise AssertionError('Inference attempted filesystem I/O')
    monkeypatch.setattr(Path,'open',forbidden)
    assert replay(iter(toy_events),identity,CONFIG)
    with pytest.raises(TypeError):replay(iter(toy_events),identity,CONFIG,ground_truth={'onset':1200})
    with pytest.raises(TypeError):replay(iter(toy_events),identity,CONFIG,policy='high_press')

def test_match_and_team_state_isolation(toy_events,identity):
    packs=replay(iter(toy_events),identity,CONFIG)
    assert {p.team_id for p in packs}=={'NORTH'}
    other=identity.model_copy(update={'match_id':'87654321-1234-4123-a123-123456789abc'})
    other_packs=replay(iter(toy_events),other,CONFIG)
    assert [p.detected_at_seconds for p in packs]==[p.detected_at_seconds for p in other_packs]
    assert {p.detection_id for p in packs}.isdisjoint(p.detection_id for p in other_packs)

def test_detection_score_and_definition_tampering(toy_events,identity):
    pack=replay(iter(toy_events),identity,CONFIG)[0]
    assert not verify_evidence(pack.model_copy(update={'detection_score':pack.detection_score+1}),toy_events)
    assert not verify_evidence(pack.model_copy(update={'metric_definitions':{}}),toy_events)
    with pytest.raises(ValidationError):DetectorConfig(window_seconds=-1)
    with pytest.raises(ValidationError):DetectorConfig(persistence=0)
