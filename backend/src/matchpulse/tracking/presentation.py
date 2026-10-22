"""Fail-closed broadcast eligibility for already-detected positional episodes.

This does not tune or re-evaluate the frozen research detector. Research alerts
and their EvidencePacks remain intact; presentation is a separate decision.
"""
from __future__ import annotations
from collections.abc import Iterable
from typing import Literal
from pydantic import Field
from ..schemas import CanonicalEvent, MatchId, Nonnegative, Number, StrictModel, Team
from .evidence import PositionalEvidencePack, verify_events, verify_geometry
from .schemas import TrackingFrame


class PresentationPolicy(StrictModel):
    # Conservative presentation defaults, NOT calibrated detector parameters.
    max_recent_age_seconds: float = Field(default=60.0, ge=0)
    min_recent_span_seconds: float = Field(default=30.0, ge=0)
    min_reference_span_seconds: float = Field(default=60.0, ge=0)


class VerifiedLineClaim(StrictModel):
    claim_id: str
    match_id: MatchId
    detection_id: str
    as_of_seconds: Nonnegative
    latest_observation_seconds: Nonnegative
    team_id: Team
    direction: Literal['advance', 'retreat']
    metric: Literal['three_deepest_outfield_mean_x'] = 'three_deepest_outfield_mean_x'
    before_m: Number
    after_m: Number
    change_m: Number
    unit: Literal['m'] = 'm'
    reference_window: list[Number]
    recent_window: list[Number]
    reference_frames: int
    recent_frames: int
    statement: str
    qualification: str = (
        'Observed synthetic positioning only; not evidence that the coach ordered '
        'a tactic or that pressure was effective.'
    )


class PresentationDecision(StrictModel):
    match_id: MatchId
    detection_id: str
    detected_at_seconds: Nonnegative
    status: Literal['eligible', 'suppressed']
    reasons: list[str]
    latest_recent_seconds: Nonnegative | None
    recent_age_seconds: Nonnegative | None
    recent_span_seconds: Nonnegative | None
    reference_span_seconds: Nonnegative | None
    claim: VerifiedLineClaim | None


def review_episode(
    pack: PositionalEvidencePack,
    frames: Iterable[TrackingFrame],
    events: Iterable[CanonicalEvent] | None,
    policy: PresentationPolicy | None = None,
) -> PresentationDecision:
    """Verify evidence, freshness and temporal coverage before emitting a claim.

    Suppression never deletes the original research alert or changes previously
    reported detector precision or recall.
    """
    p = policy or PresentationPolicy()
    frame_list = list(frames)
    event_list = list(events) if events is not None else None
    by_id = {f.frame_id: f for f in frame_list}
    before_ids = pack.tracking_references.get('reference', [])
    recent_ids = pack.tracking_references.get('recent', [])
    missing_ids = any(fid not in by_id for fid in (*before_ids, *recent_ids))
    before_times = [by_id[fid].time_seconds for fid in before_ids if fid in by_id]
    recent_times = [by_id[fid].time_seconds for fid in recent_ids if fid in by_id]
    latest = max(recent_times) if recent_times else None
    age = max(0.0, pack.detected_at_seconds - latest) if latest is not None else None
    recent_span = max(recent_times) - min(recent_times) if recent_times else None
    reference_span = max(before_times) - min(before_times) if before_times else None
    reasons: list[str] = []

    if missing_ids or not before_times or not recent_times:
        reasons.append('missing_tracking_evidence')
    if any(t > pack.detected_at_seconds for t in (*before_times, *recent_times)):
        reasons.append('future_tracking_evidence')
    if (len(before_times) < pack.detector.min_reference or
            len(recent_times) < pack.detector.min_recent):
        reasons.append('insufficient_sample_count')
    if age is None or age > p.max_recent_age_seconds:
        reasons.append('stale_recent_evidence')
    if recent_span is None or recent_span < p.min_recent_span_seconds:
        reasons.append('insufficient_recent_time_coverage')
    if reference_span is None or reference_span < p.min_reference_span_seconds:
        reasons.append('insufficient_reference_time_coverage')

    try:
        geometry_ok = not missing_ids and verify_geometry(pack, frame_list)
    except (ValueError, TypeError, KeyError, IndexError):
        geometry_ok = False
    if not geometry_ok:
        reasons.append('unverified_geometry')

    if pack.detector.method == 'fused' and event_list is None:
        reasons.append('missing_canonical_events')
    else:
        try:
            event_ok = verify_events(pack, event_list or [])
        except (ValueError, TypeError, KeyError, IndexError):
            event_ok = False
        if not event_ok:
            reasons.append('unverified_event_confirmation')

    claim = None
    if not reasons:
        before = pack.before['line3_m']
        after = pack.after['line3_m']
        change = pack.deltas['line3_m']
        movement = 'advanced' if pack.direction == 'advance' else 'retreated'
        wording = (
            f"During sampled opponent build-up, {pack.team_id}'s three deepest "
            f'outfield players averaged {before:.1f}m and then {after:.1f}m '
            f'from their own goal: they {movement} by {abs(change):.1f}m '
            f'between the compared observations.'
        )
        claim = VerifiedLineClaim(
            claim_id=f'{pack.detection_id}:line3', match_id=pack.match_id,
            detection_id=pack.detection_id,
            as_of_seconds=pack.detected_at_seconds,
            latest_observation_seconds=latest,
            team_id=pack.team_id, direction=pack.direction,
            before_m=before, after_m=after, change_m=change,
            reference_window=pack.reference_window,
            recent_window=pack.recent_window,
            reference_frames=len(before_ids), recent_frames=len(recent_ids),
            statement=wording,
        )
    return PresentationDecision(
        match_id=pack.match_id, detection_id=pack.detection_id,
        detected_at_seconds=pack.detected_at_seconds,
        status='eligible' if claim else 'suppressed', reasons=reasons,
        latest_recent_seconds=latest, recent_age_seconds=age,
        recent_span_seconds=recent_span, reference_span_seconds=reference_span,
        claim=claim,
    )
