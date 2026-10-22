"""Causal event contributions and fixed-exposure football observations."""
from __future__ import annotations
from collections import deque
from dataclasses import dataclass
from math import sqrt
from .schemas import CanonicalEvent, StrictModel, Team

RECOVERIES = frozenset({'recovery','interception','tackle'})

class WindowStats(StrictModel):
    exposure_seconds: float
    recovery_count: int
    high_recovery_count: int
    recovery_rate_per_minute: float
    high_recovery_rate_per_minute: float
    high_recovery_share: float | None
    mean_recovery_x_m: float | None
    recovery_x_variance: float | None
    defensive_episodes: int
    advanced_defensive_episodes: int
    final_third_entries: int
    attacking_actions: int
    shots: int

@dataclass(frozen=True)
class Contribution:
    event: CanonicalEvent
    recovery: bool = False
    defensive_episode: bool = False
    entry_delta: int = 0

@dataclass(frozen=True)
class Observation:
    time: float
    team: Team
    period: int
    period_start: float
    before_start: float
    split: float
    before: WindowStats
    after: WindowStats
    minute: WindowStats

class SignalState:
    def __init__(self, window_seconds: int):
        if window_seconds <= 0: raise ValueError('Window must be positive')
        self.window = window_seconds
        self.history: deque[Contribution] = deque()
        self.entries: dict[str, int] = {}
        self.recovery_key: tuple | None = None
        self.defense_last: dict[tuple, float] = {}
        self.period = 1
        self.period_start = 0.0

    def update(self, event: CanonicalEvent) -> None:
        if event.period != self.period:
            self.history.clear()
            self.defense_last.clear()
            self.recovery_key = None
            self.period = event.period
            self.period_start = event.time_seconds
        key = (event.team_id,event.possession_id,event.time_seconds,event.player_id)
        recovery = event.type in RECOVERIES and key != self.recovery_key
        if event.type in RECOVERIES: self.recovery_key = key
        defense = False
        if event.type in {'challenge','tackle','interception'}:
            episode_key=(event.team_id,event.player_id,event.possession_id)
            previous = self.defense_last.get(episode_key, float('-inf'))
            defense = event.time_seconds-previous >= 5
            self.defense_last[episode_key] = event.time_seconds
        old=self.entries.get(event.possession_id,0)
        current=event.evidence.possession_final_third_entries
        if current < old:
            raise ValueError('Possession progression counter regressed')
        self.entries[event.possession_id]=current
        self.history.append(Contribution(event,recovery,defense,current-old))

    def observe(self, time: float, team: Team) -> Observation:
        while self.history and self.history[0].event.time_seconds <= time-2*self.window:
            self.history.popleft()
        split=time-self.window
        return Observation(time,team,self.period,self.period_start,time-2*self.window,split,
            window_stats(self.history,team,time-2*self.window,split),
            window_stats(self.history,team,split,time),
            window_stats(self.history,team,time-60,time))

def window_stats(contributions, team: Team, start: float, end: float) -> WindowStats:
    if end <= start: raise ValueError('Nonpositive exposure')
    rows=[c for c in contributions if start < c.event.time_seconds <= end]
    own=[c for c in rows if c.event.team_id==team]
    xs=[c.event.attacking_position_m.x for c in own if c.recovery and c.event.attacking_position_m is not None]
    mean=sum(xs)/len(xs) if xs else None
    variance=sum((x-mean)**2 for x in xs)/(len(xs)-1) if len(xs)>1 else None
    high=sum(x>=70 for x in xs)
    defensive=[c for c in own if c.defensive_episode]
    return WindowStats(exposure_seconds=float(end-start),recovery_count=len(xs),high_recovery_count=high,
        recovery_rate_per_minute=len(xs)*60/(end-start),high_recovery_rate_per_minute=high*60/(end-start),
        high_recovery_share=high/len(xs) if xs else None,mean_recovery_x_m=mean,recovery_x_variance=variance,
        defensive_episodes=len(defensive),advanced_defensive_episodes=sum(c.event.attacking_position_m is not None and c.event.attacking_position_m.x>=70 for c in defensive),
        final_third_entries=sum(c.entry_delta for c in rows if c.event.possession_team_id==team),
        attacking_actions=sum(c.event.type in {'pass','receive','dribble'} for c in own),shots=sum(c.event.type=='shot' for c in own))

def changes(before: WindowStats, after: WindowStats) -> dict[str,float]:
    if before.mean_recovery_x_m is None or after.mean_recovery_x_m is None or before.high_recovery_share is None or after.high_recovery_share is None:
        return {'location_delta_m':0.,'share_delta':0.,'location_z':0.,'share_z':0.}
    n0,n1=before.recovery_count,after.recovery_count
    location=after.mean_recovery_x_m-before.mean_recovery_x_m
    se=sqrt((before.recovery_x_variance or 0)/n0+(after.recovery_x_variance or 0)/n1)+2
    pooled=(before.high_recovery_count+after.high_recovery_count)/(n0+n1)
    share=after.high_recovery_share-before.high_recovery_share
    share_se=sqrt(pooled*(1-pooled)*(1/n0+1/n1)+0.0025)
    return {'location_delta_m':location,'share_delta':share,'location_z':location/se,'share_z':share/share_se}
