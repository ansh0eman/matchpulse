"""Post-detection presentation policy: never retune the frozen detector."""
from __future__ import annotations
from pathlib import Path
from types import SimpleNamespace
import pytest
from matchpulse.tracking.evidence import PositionalEvidencePack
from matchpulse.tracking.presentation import PresentationPolicy, review_episode

ROOT = Path(__file__).resolve().parents[3]


def case(which: str):
    pack = PositionalEvidencePack.model_validate_json(
        (ROOT / 'research/step25/fixtures' / f'{which}-evidence.json').read_text()
    )
    import gzip
    from matchpulse.tracking.ingestion import validate_frames
    path = ROOT / 'research/step25/fixtures' / f'{which}-{pack.match_id}.tracking.jsonl.gz'
    with gzip.open(path, 'rt') as source:
        frames = list(validate_frames(source))
    return pack, frames


def test_successful_episode_has_bounded_freshness(monkeypatch):
    monkeypatch.setattr('matchpulse.tracking.presentation.verify_geometry', lambda *args: True)
    monkeypatch.setattr('matchpulse.tracking.presentation.verify_events', lambda *args: True)
    pack, frames = case('success')
    before = pack.model_dump()
    decision = review_episode(pack, frames, [])
    assert decision.status == 'eligible'
    assert decision.claim and decision.claim.metric == 'three_deepest_outfield_mean_x'
    assert decision.claim.change_m == pytest.approx(10.01258807588076)
    assert 'coach' not in decision.claim.statement.lower()
    assert 'pressing' not in decision.claim.statement.lower()
    assert pack.model_dump() == before


def test_known_unchanged_false_alert_is_stale(monkeypatch):
    monkeypatch.setattr('matchpulse.tracking.presentation.verify_geometry', lambda *args: True)
    monkeypatch.setattr('matchpulse.tracking.presentation.verify_events', lambda *args: True)
    pack, frames = case('false_alert')
    decision = review_episode(pack, frames, [])
    assert decision.status == 'suppressed'
    assert decision.claim is None
    assert decision.recent_age_seconds == pytest.approx(132.0)
    assert 'stale_recent_evidence' in decision.reasons


def test_sample_count_does_not_guarantee_temporal_support(monkeypatch):
    monkeypatch.setattr('matchpulse.tracking.presentation.verify_geometry', lambda *args: True)
    monkeypatch.setattr('matchpulse.tracking.presentation.verify_events', lambda *args: True)
    pack, frames = case('success')
    recent = set(pack.tracking_references['recent'])
    clustered = [SimpleNamespace(frame_id=f.frame_id,
                   time_seconds=pack.detected_at_seconds-(i % 6)
                   if f.frame_id in recent else f.time_seconds)
                 for i, f in enumerate(frames)]
    decision = review_episode(pack, clustered, [])
    assert decision.status == 'suppressed'
    assert 'insufficient_recent_time_coverage' in decision.reasons


def test_forged_geometry_and_missing_event_stream_fail_closed(monkeypatch):
    pack, frames = case('success')
    monkeypatch.setattr('matchpulse.tracking.presentation.verify_geometry', lambda *args: False)
    monkeypatch.setattr('matchpulse.tracking.presentation.verify_events', lambda *args: True)
    result = review_episode(pack, frames, [])
    assert result.status == 'suppressed' and 'unverified_geometry' in result.reasons
    monkeypatch.setattr('matchpulse.tracking.presentation.verify_geometry', lambda *args: True)
    result = review_episode(pack, frames, None)
    assert result.status == 'suppressed' and 'missing_canonical_events' in result.reasons


def test_quality_policy_is_not_detector_configuration():
    pack, _ = case('success')
    original = pack.detector.model_dump()
    assert 'max_recent_age_seconds' not in original
    assert PresentationPolicy().max_recent_age_seconds == 60
    assert pack.detector.model_dump() == original


def raw_case(which: str):
    import gzip
    from matchpulse.ingestion import validate_stream
    pack, frames = case(which)
    directory = ROOT / 'research/step25/fixtures'
    with gzip.open(directory / f'{which}-event-prefix.jsonl.gz', 'rt') as source:
        events = list(validate_stream(source))
    return pack, frames, events


def test_real_fixture_verification_and_staleness_without_mocks():
    for name, expected in [('success', 'eligible'), ('false_alert', 'suppressed')]:
        pack, frames, events = raw_case(name)
        original = pack.model_dump()
        decision = review_episode(pack, frames, events)
        assert decision.status == expected
        assert pack.model_dump() == original
        if name == 'false_alert':
            assert decision.recent_age_seconds == 132
            assert decision.claim is None
        else:
            assert decision.claim.before_m == pack.before['line3_m']
            assert decision.claim.after_m == pack.after['line3_m']
            assert decision.claim.reference_frames == 41
            assert decision.claim.recent_frames == 18


def test_recomputed_but_unsupported_fused_facts_fail_closed():
    from matchpulse.signals import SignalState, changes
    from matchpulse.tracking.evidence import verify_events, verify_geometry
    pack, frames, _ = raw_case('success')
    observed = SignalState(pack.detector.recent_seconds).observe(
        pack.detected_at_seconds, pack.team_id)
    facts = changes(observed.before, observed.after)
    facts.update(supported=False, before=observed.before.model_dump(),
                 after=observed.after.model_dump(), reference_ids=[], recent_ids=[])
    unconfirmed = pack.model_copy(update={'event_facts': facts})
    assert verify_geometry(unconfirmed, frames)
    assert verify_events(unconfirmed, [])  # Correct arithmetic is not confirmation.
    decision = review_episode(unconfirmed, frames, [])
    assert decision.status == 'suppressed'
    assert decision.claim is None
    assert 'unconfirmed_event_evidence' in decision.reasons


def test_real_tampering_missing_and_future_references_fail_closed():
    pack, frames, events = raw_case('success')
    tampered = pack.model_copy(deep=True)
    tampered.after['line3_m'] += 1
    assert 'unverified_geometry' in review_episode(tampered, frames, events).reasons
    assert 'missing_tracking_evidence' in review_episode(pack, frames[:-1], events).reasons
    future = [f.model_copy(update={'time_seconds': pack.detected_at_seconds + 1})
              if f.frame_id == pack.tracking_references['recent'][-1] else f for f in frames]
    decision = review_episode(pack, future, events)
    assert decision.claim is None and 'future_tracking_evidence' in decision.reasons
    missing_events = review_episode(pack, frames, [])
    assert missing_events.claim is None and 'unverified_event_confirmation' in missing_events.reasons


def test_observation_prefix_matches_full_episode_review():
    pack, frames, events = raw_case('success')
    original = review_episode(pack, frames, events)
    future = frames[-1].model_copy(update={'frame_id': 'future', 'sequence': 99999,
                                          'time_seconds': pack.detected_at_seconds + 30})
    assert review_episode(pack, [*frames, future], events) == original


def test_supported_but_opposite_event_movement_is_not_confirmation():
    from matchpulse.schemas import Point
    from matchpulse.signals import SignalState, changes
    from matchpulse.tracking.evidence import verify_events
    pack, frames, events = raw_case('success')
    reversed_events = [e.model_copy(update={
        'position_m': Point(x=105-e.position_m.x, y=e.position_m.y),
        'attacking_position_m': Point(x=105-e.attacking_position_m.x,
                                     y=e.attacking_position_m.y)
        if e.attacking_position_m else None}) for e in events]
    state = SignalState(pack.detector.recent_seconds)
    for e in reversed_events:
        state.update(e)
    observation = state.observe(pack.detected_at_seconds, pack.team_id)
    facts = changes(observation.before, observation.after)
    facts.update(supported=True, before=observation.before.model_dump(),
                 after=observation.after.model_dump(),
                 reference_ids=pack.event_facts['reference_ids'],
                 recent_ids=pack.event_facts['recent_ids'])
    unconfirmed = pack.model_copy(update={'event_facts': facts})
    assert verify_events(unconfirmed, reversed_events)
    assert facts['location_delta_m'] < 0 and facts['share_delta'] < 0
    decision = review_episode(unconfirmed, frames, reversed_events)
    assert decision.status == 'suppressed'
    assert 'unconfirmed_event_evidence' in decision.reasons


def test_frozen_research_configuration_and_inputs_are_unchanged():
    import hashlib, json
    directory = ROOT / 'research/step25/artifacts'
    raw = (directory / 'frozen.json').read_bytes()
    assert hashlib.sha256(raw).hexdigest() == (directory / 'frozen.sha256').read_text().strip()
    frozen = json.loads(raw)
    assert json.loads((directory / 'selected.json').read_text()) == frozen['selected']
    assert frozen['selected']['line_threshold_m'] == 7
    assert frozen['selected']['method'] == 'fused'
    # The CLI wrapper is the sole intentionally extended frozen path. Keep the
    # original whole-snapshot fingerprint intact; its historical runner rightly
    # rejects this new wrapper. Every other evaluated input must match exactly.
    wrapper = 'backend/src/matchpulse/tracking/cli.py'
    checked = []
    for name, expected in frozen['source_hashes'].items():
        if name == wrapper:
            continue
        assert hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == expected, name
        checked.append(name)
    assert 'backend/src/matchpulse/tracking/detector.py' in checked
    assert 'backend/src/matchpulse/tracking/evidence.py' in checked
    assert 'backend/src/matchpulse/tracking/features.py' in checked
