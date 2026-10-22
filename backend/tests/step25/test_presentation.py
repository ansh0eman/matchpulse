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
    # Stored 1Hz research fixture IDs encode observation seconds. The existing
    # tracking tests separately verify raw geometry from full fixture frames.
    ids = pack.tracking_references['reference'] + pack.tracking_references['recent']
    frames = [SimpleNamespace(frame_id=i, time_seconds=float(i.removeprefix('frame_'))) for i in ids]
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
