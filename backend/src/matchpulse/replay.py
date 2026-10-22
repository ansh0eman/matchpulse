"""The inference path takes canonical observations and opaque identity only."""
from __future__ import annotations
from collections.abc import Iterable, Iterator
from .schemas import CanonicalEvent, MatchIdentity
from .signals import Observation, SignalState
from .detectors.rolling import DetectorConfig
from .detectors.streaming import make_detector
from .evidence import EvidencePack, build_evidence

def observations(events: Iterable[CanonicalEvent], window_seconds: int) -> Iterator[Observation]:
    state=SignalState(window_seconds)
    next_boundary=60.0
    last_time=0.0
    for event in events:
        while next_boundary < event.time_seconds:
            for team in ('NORTH','SOUTH'):
                yield state.observe(next_boundary,team)
            next_boundary+=60
        state.update(event)
        last_time=event.time_seconds
    while next_boundary<=last_time:
        for team in ('NORTH','SOUTH'):
            yield state.observe(next_boundary,team)
        next_boundary+=60

def replay(events: Iterable[CanonicalEvent], identity: MatchIdentity, config: DetectorConfig, *, debug: bool=False) -> list[EvidencePack]:
    detectors={team:make_detector(config) for team in ('NORTH','SOUTH')}
    state=SignalState(config.window_seconds)
    prefix=[]
    packs=[]
    next_boundary=60.0
    last_time=0.0
    def tick(time:float):
        for team,detector in detectors.items():
            o=state.observe(time,team)
            alert=detector.update(o)
            if alert:
                pack=build_evidence(identity.match_id,alert,config,prefix)
                packs.append(pack)
                if debug:
                    print(f'[replay -> signals -> {config.method} -> evidence] {time:.0f}s {team}: '
                        f'recoveries {o.before.recovery_count}->{o.after.recovery_count}; '
                        f'x {o.before.mean_recovery_x_m:.1f}->{o.after.mean_recovery_x_m:.1f}m; score {alert.score:.3f}')
    for event in events:
        while next_boundary<event.time_seconds:
            tick(next_boundary)
            next_boundary+=60
        state.update(event)
        prefix.append(event)
        last_time=event.time_seconds
    while next_boundary<=last_time:
        tick(next_boundary)
        next_boundary+=60
    return packs
