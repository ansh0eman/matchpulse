"""Pure causal tracking replay. Evaluation metadata has no input slot."""
from __future__ import annotations
from collections.abc import Iterable,Iterator
from .schemas import TrackingFrame
from .features import extract_features,Comparison
from .windows import TrackingWindows
from .detector import TrackingConfig,PositionalDetector,TrackingAlert
from ..schemas import CanonicalEvent
from ..signals import SignalState,changes

def comparisons_from_samples(samples,end_time:float,config:TrackingConfig,period_starts:dict|None=None):
    windows={team:TrackingWindows(config.reference_seconds,config.recent_seconds,config.min_recent,config.min_reference,config.method!='unconditioned') for team in ('NORTH','SOUTH')}
    timeline=[(sample.time,1,sample) for sample in samples]
    timeline += [(float(time),0,int(period)) for period,time in (period_starts or {}).items()]
    timeline.sort(key=lambda row:(row[0],row[1]))
    next_tick=float(config.cadence_seconds)
    for time,kind,payload in timeline:
        while next_tick<time:
            for team,window in windows.items():yield next_tick,team,window.compare(next_tick,team)
            next_tick+=config.cadence_seconds
        if kind==0:
            for window in windows.values():window.reset(payload,time)
        else:windows[payload.team].update(payload)
    while next_tick<=end_time:
        for team,window in windows.items():yield next_tick,team,window.compare(next_tick,team)
        next_tick+=config.cadence_seconds

def comparisons_from_frames(frames:Iterable[TrackingFrame],config:TrackingConfig):
    windows={team:TrackingWindows(config.reference_seconds,config.recent_seconds,config.min_recent,config.min_reference,config.method!='unconditioned') for team in ('NORTH','SOUTH')}
    next_tick=float(config.cadence_seconds);period=None;last=0.
    for frame in frames:
        while next_tick<frame.time_seconds:
            for team,window in windows.items():yield next_tick,team,window.compare(next_tick,team)
            next_tick+=config.cadence_seconds
        if frame.period!=period:
            period=frame.period
            for window in windows.values():window.reset(period,frame.time_seconds)
        for team,window in windows.items():
            sample=extract_features(frame,team)
            if sample:window.update(sample)
        last=frame.time_seconds
    while next_tick<=last:
        for team,window in windows.items():yield next_tick,team,window.compare(next_tick,team)
        next_tick+=config.cadence_seconds

def detect(comparisons,config:TrackingConfig,events:Iterable[CanonicalEvent]=(),model:dict|None=None)->list[TrackingAlert]:
    detectors={team:PositionalDetector(config,model) for team in ('NORTH','SOUTH')}
    event_state=SignalState(config.recent_seconds);iterator=iter(events);pending=next(iterator,None);alerts=[]
    for time,team,comparison in comparisons:
        facts=None
        while pending is not None and pending.time_seconds<=time:
            event_state.update(pending);pending=next(iterator,None)
        if config.method=='fused':
            observed=event_state.observe(time,team);facts=changes(observed.before,observed.after)
            facts['supported']=min(observed.before.recovery_count,observed.after.recovery_count)>=4
            facts['before']=observed.before.model_dump();facts['after']=observed.after.model_dump()
            facts['reference_ids']=[c.event.id for c in event_state.history if time-2*config.recent_seconds<c.event.time_seconds<=time-config.recent_seconds]
            facts['recent_ids']=[c.event.id for c in event_state.history if time-config.recent_seconds<c.event.time_seconds<=time]
        alert=detectors[team].update(comparison,facts)
        if alert:alerts.append(alert)
    return alerts
