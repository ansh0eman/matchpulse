"""Evidence includes complete causal-prefix dependencies, not cherry-picked IDs."""
from __future__ import annotations
from hashlib import sha256
from typing import Literal
from .schemas import CanonicalEvent, MatchId, Nonnegative, Number, StrictModel, Team
from .signals import SignalState, WindowStats
from .detectors.rolling import Alert, DetectorConfig

class Reference(StrictModel):
    match_id: MatchId
    event_id: str

class Windows(StrictModel):
    before_start: float
    split: float
    after_end: float
    boundary_rule: Literal['(start,end]'] = '(start,end]'

class Facts(StrictModel):
    before: WindowStats
    after: WindowStats

class EvidencePack(StrictModel):
    schema_version: Literal[1] = 1
    match_id: MatchId
    detection_id: str
    detected_at_seconds: Nonnegative
    team_id: Team
    turning_point_type: Literal['advanced_recovery_shift'] = 'advanced_recovery_shift'
    direction: Literal['increase'] = 'increase'
    statement: str = 'An increase in recovery location and/or advanced recovery share was detected.'
    detector: DetectorConfig
    detection_score: Number
    score_semantics: str = 'Uncalibrated standardized effect score; not a probability or significance level.'
    comparison: Windows
    facts: Facts
    calculation_references: list[Reference]
    illustrative_event_ids: list[str]
    metric_definitions: dict[str,str]
    warnings: list[str]

DEFINITIONS={
    'recovery_count':'Distinct recovery/interception/tackle action keys (team, possession, time, actor); not necessarily turnovers.',
    'high_recovery_count':'Recovery actions with team-relative x >=70 metres.',
    'recovery_rate_per_minute':'Recovery count * 60 / window exposure seconds.',
    'high_recovery_rate_per_minute':'High recovery count * 60 / window exposure seconds.',
    'high_recovery_share':'High recovery count / recovery count; null when count is zero.',
    'mean_recovery_x_m':'Arithmetic mean team-relative recovery x in metres; null without recoveries.',
    'recovery_x_variance':'Sample variance of recovery x (metres squared); null with fewer than two recoveries.',
    'defensive_episodes':'Challenge/tackle/interception grouped per actor/possession/team until a 5-second gap.',
    'advanced_defensive_episodes':'Defensive episodes whose first event has team-relative x >=70 metres.',
    'final_third_entries':'Positive increments in possession counter, counted by possession team at observation time.',
    'attacking_actions':'Pass attempts, receives and dribbles; an event-tempo proxy, not completed passes.',
    'shots':'Shot events, not calibrated xG or goal probability.',
    'exposure_seconds':'Length of the comparison window in cumulative match-clock seconds.',
}

def build_evidence(match_id: str, alert: Alert, config: DetectorConfig, prefix: list[CanonicalEvent]) -> EvidencePack:
    o=alert.observation
    digest=sha256(f'{match_id}:{alert.team}:{alert.time}:{config.model_dump_json()}'.encode()).hexdigest()[:16]
    contributing=[e for e in prefix if e.time_seconds<=alert.time]
    examples=[e.id for e in contributing if o.split<e.time_seconds<=o.time and e.team_id==alert.team and e.type in {'recovery','interception','tackle'}][:5]
    warnings=['Synthetic uncalibrated match; observed change does not establish coach intent or causation.',
        'Complete prefix references support counter and episode dependencies; illustrative IDs are only examples.',
        'Final-third counters are observed at event times and may miss unobserved crossings near window edges.']
    if min(o.before.recovery_count,o.after.recovery_count)<12:
        warnings.append('Sparse recovery support: fewer than 12 observations in at least one comparison window.')
    if any(e.type in {'goal','red_card','injury','substitution'} and o.before_start<e.time_seconds<=o.time for e in contributing):
        warnings.append('Score/discipline/injury/substitution event in comparison windows; possible confounding.')
    return EvidencePack(match_id=match_id,detection_id=f'turn_{digest}',detected_at_seconds=alert.time,team_id=alert.team,
        detector=config,detection_score=alert.score,comparison=Windows(before_start=o.before_start,split=o.split,after_end=o.time),
        facts=Facts(before=o.before,after=o.after),
        calculation_references=[Reference(match_id=match_id,event_id=e.id) for e in contributing],
        illustrative_event_ids=examples,metric_definitions=DEFINITIONS,warnings=warnings)

def verify_evidence(pack: EvidencePack, events: list[CanonicalEvent]) -> bool:
    prefix=[e for e in events if e.time_seconds<=pack.detected_at_seconds]
    expected=[(pack.match_id,e.id) for e in prefix]
    if [(r.match_id,r.event_id) for r in pack.calculation_references]!=expected:
        return False
    if not set(pack.illustrative_event_ids)<=set(e.id for e in prefix): return False
    if pack.comparison.after_end!=pack.detected_at_seconds: return False
    if pack.comparison.split-pack.comparison.before_start!=pack.detector.window_seconds: return False
    if pack.comparison.after_end-pack.comparison.split!=pack.detector.window_seconds: return False
    # Rebuild all contribution dependencies from canonical observations, never supplied facts.
    state=SignalState(pack.detector.window_seconds)
    for event in prefix: state.update(event)
    o=state.observe(pack.detected_at_seconds,pack.team_id)
    from .detectors.rolling import RollingDetector
    _,score=RollingDetector(pack.detector).gate(o)
    return (pack.facts==Facts(before=o.before,after=o.after)
        and pack.detection_score==score and pack.metric_definitions==DEFINITIONS
        and o.before_start>=o.period_start
        and all(e.time_seconds<=pack.detected_at_seconds for e in prefix))
