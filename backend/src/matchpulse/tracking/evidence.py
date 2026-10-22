"""Compact fact payload plus resolvable, complete observable calculation evidence."""
from __future__ import annotations
from dataclasses import asdict
from hashlib import sha256
from typing import Literal
from collections import defaultdict
from statistics import mean
from ..schemas import StrictModel,MatchId,Nonnegative,Number,Team
from .schemas import TrackingFrame
from .features import extract_features,FEATURE_NAMES
from .detector import TrackingAlert,TrackingConfig,PositionalDetector

DEFINITIONS={
 'line3_m':'Mean of the three deepest observed outfield longitudinal positions; attack-relative metres from own goal.',
 'line4_m':'Complementary check: mean of the four deepest outfield longitudinal positions, metres.',
 'line_q20_m':'Complementary check: interpolated 20th percentile of outfield longitudinal positions, metres.',
 'nearest_m':'Euclidean distance from opponent ball carrier to nearest defending outfielder, metres.',
 'density5':'Defending outfielders within <=5m of the carrier, players.',
 'density10':'Defending outfielders within <=10m of the carrier, players.',
 'density15':'Defending outfielders within <=15m of the carrier, players.',
 'length_m':'90th minus 10th percentile of normalized outfield x, metres.',
 'width_m':'90th minus 10th percentile of normalized outfield y, metres.',
 'centroid_x_m':'Mean outfield attack-relative longitudinal position, metres.',
 'dispersion_m':'Root mean squared outfield distance from centroid, metres.',
 'advanced_players':'Outfield players at attack-relative x >=52.5m, players.',
 'interline_gap_m':'Spatial proxy: 60th minus 20th percentile of outfield x, metres; not a coach-defined formation line.',
}

class PositionalEvidencePack(StrictModel):
    schema_version:Literal[2]=2
    match_id:MatchId
    detection_id:str
    detected_at_seconds:Nonnegative
    team_id:Team
    observed_pattern:Literal['defensive_line_shift']='defensive_line_shift'
    direction:Literal['advance','retreat']
    statement:str
    detector:TrackingConfig
    detection_score:Number
    score_semantics:str
    reference_window:list[Number]
    recent_window:list[Number]
    boundary_rule:Literal['(start,end]']='(start,end]'
    before:dict[str,Number]
    after:dict[str,Number]
    deltas:dict[str,Number]
    support:dict[str,int]
    contexts:list[list[int]]
    tracking_references:dict[str,list[str]]
    representative_frames:list[str]
    event_facts:dict|None
    raw_evidence:dict
    definitions:dict[str,str]
    warnings:list[str]


def make_pack(match_id:str,alert:TrackingAlert,config:TrackingConfig)->PositionalEvidencePack:
    o=alert.comparison
    token=sha256(f'{match_id}:{o.team}:{o.time}:{config.model_dump_json()}'.encode()).hexdigest()[:20]
    wording='advanced' if alert.direction=='advance' else 'retreated'
    score_semantics=('Uncalibrated logistic model score, not a validated probability.' if config.method=='logistic' else
        'Cumulative metre-check score divided by its configured threshold; not a probability.' if config.method=='cusum' else
        'Absolute line-height difference divided by metre threshold; not a probability.')
    warnings=['Synthetic uncalibrated football; an observed line change does not establish coaching intent, effective pressing or causation.',
        'Comparable opponent-build-up observations only; samples are autocorrelated, not independent match trials.',
        'Higher line position does not imply reduced carrier distance or successful possession recovery.']
    return PositionalEvidencePack(match_id=match_id,detection_id='pos_'+token,detected_at_seconds=o.time,team_id=o.team,
        direction=alert.direction,statement=f'The observed defensive line {wording} during comparable opponent build-up.',
        detector=config,detection_score=alert.score,score_semantics=score_semantics,
        reference_window=[o.reference_start,o.split],recent_window=[o.split,o.recent_end],
        before=o.before,after=o.after,deltas=o.delta,support={'reference_frames':o.before_frames,'recent_frames':o.after_frames,'common_contexts':len(o.contexts)},
        contexts=[list(k) for k in o.contexts],tracking_references={'reference':list(o.reference_ids),'recent':list(o.recent_ids)},
        representative_frames=[o.reference_ids[0],o.reference_ids[-1],o.recent_ids[0],o.recent_ids[-1]],
        event_facts=alert.event_facts,raw_evidence={'match_id':match_id,'tracking_artifact':f'{match_id}.tracking.jsonl.gz',
            'scope':'All observable tracking frames through detected_at_seconds; the listed frame IDs are complete geometry calculation references.',
            'event_scope':'Canonical events through detection are required for fused event-counter confirmation.' if config.method=='fused' else None},
        definitions=DEFINITIONS,warnings=warnings)


def compact_agent_facts(pack:PositionalEvidencePack)->dict:
    """Small structured facts; no raw full-match history is sent to an agent."""
    result={key:value for key,value in pack.model_dump().items() if key not in {'tracking_references','definitions','raw_evidence'}}
    if result['event_facts'] is not None:result['event_facts']={k:v for k,v in result['event_facts'].items() if k not in {'reference_ids','recent_ids'}}
    return result


def verify_geometry(pack:PositionalEvidencePack,frames:list[TrackingFrame])->bool:
    """Independent weighted sums from raw points; do not trust detector's window facts."""
    token=sha256(f'{pack.match_id}:{pack.team_id}:{pack.detected_at_seconds}:{pack.detector.model_dump_json()}'.encode()).hexdigest()[:20]
    if pack.detection_id!='pos_'+token:return False
    expected_direction='advance' if pack.deltas.get('line3_m',0)>=0 else 'retreat'
    if pack.direction!=expected_direction:return False
    expected_word='advanced' if expected_direction=='advance' else 'retreated'
    if pack.statement!=f'The observed defensive line {expected_word} during comparable opponent build-up.':return False
    if pack.reference_window[1]!=pack.recent_window[0] or pack.recent_window[1]!=pack.detected_at_seconds:return False
    if set(pack.before)!=set(FEATURE_NAMES) or set(pack.after)!=set(FEATURE_NAMES) or pack.definitions!=DEFINITIONS:return False
    reference=defaultdict(list);recent=defaultdict(list)
    frame_map={f.frame_id:f for f in frames if f.time_seconds<=pack.detected_at_seconds}
    for frame in frame_map.values():
        sample=extract_features(frame,pack.team_id)
        if not sample:continue
        key=sample.context if pack.detector.method!='unconditioned' else (0,0,0,0)
        if pack.reference_window[0]<sample.time<=pack.reference_window[1]:reference[key].append(sample)
        elif pack.recent_window[0]<sample.time<=pack.recent_window[1]:recent[key].append(sample)
    # Only current-period samples are eligible, including short post-half reference support.
    period=max(f.period for f in frame_map.values()) if frame_map else None
    reference={k:[s for s in v if s.period==period] for k,v in reference.items()}
    recent={k:[s for s in v if s.period==period] for k,v in recent.items()}
    keys=sorted(k for k in reference.keys()&recent.keys() if len(reference[k])>=pack.detector.min_reference and len(recent[k])>=pack.detector.min_recent)
    if [list(k) for k in keys]!=pack.contexts:return False
    if not keys:return False
    count=sum(len(recent[k]) for k in keys)
    for side,group in [('before',reference),('after',recent)]:
        calculated={name:sum(len(recent[k])*mean(s.values[name] for s in group[k]) for k in keys)/count for name in FEATURE_NAMES}
        if calculated!=getattr(pack,side):return False
    refs={'reference':[s.frame_id for k in keys for s in reference[k]],'recent':[s.frame_id for k in keys for s in recent[k]]}
    if pack.tracking_references!=refs:return False
    if not set(pack.representative_frames)<=set(refs['reference']+refs['recent']):return False
    if pack.support!={'reference_frames':len(refs['reference']),'recent_frames':len(refs['recent']),'common_contexts':len(keys)}:return False
    if pack.deltas!={name:pack.after[name]-pack.before[name] for name in FEATURE_NAMES}:return False
    # Sequential/model scores are additionally verified by deterministic prefix replay.
    if pack.detector.method in {'conditioned','unconditioned','fused'}:
        expected=abs(pack.deltas['line3_m'])/pack.detector.line_threshold_m
        if pack.detection_score!=expected:return False
    return True


def verify_events(pack:PositionalEvidencePack,events)->bool:
    """Reconstruct event confirmation and complete reference IDs from a canonical prefix."""
    if pack.detector.method!='fused':return pack.event_facts is None
    from ..signals import SignalState,changes
    time=pack.detected_at_seconds;window=pack.detector.recent_seconds;state=SignalState(window)
    for event in events:
        if event.time_seconds>time:break
        state.update(event)
    observed=state.observe(time,pack.team_id);facts=changes(observed.before,observed.after)
    facts['supported']=min(observed.before.recovery_count,observed.after.recovery_count)>=4
    facts['before']=observed.before.model_dump();facts['after']=observed.after.model_dump()
    facts['reference_ids']=[c.event.id for c in state.history if time-2*window<c.event.time_seconds<=time-window]
    facts['recent_ids']=[c.event.id for c in state.history if time-window<c.event.time_seconds<=time]
    return facts==pack.event_facts
