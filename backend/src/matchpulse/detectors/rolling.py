"""Original, interpretable causal comparison with effect/support guards."""
from __future__ import annotations
from dataclasses import dataclass
from typing import Literal
from pydantic import Field
from ..schemas import StrictModel
from ..signals import Observation, changes

class DetectorConfig(StrictModel):
    method: Literal['rolling','page_hinkley','adwin'] = 'rolling'
    version: Literal['1'] = '1'
    window_seconds: int = Field(default=480,ge=60,le=1800)
    threshold: float = Field(default=1.5,gt=0)
    min_recoveries: int = Field(default=8,ge=2)
    location_floor_m: float = Field(default=6.,ge=0)
    share_floor: float = Field(default=.08,ge=0,le=1)
    persistence: int = Field(default=2,ge=1)
    cooldown_seconds: int = Field(default=900,ge=0)
    features: Literal['both','location','share'] = 'both'
    stream_threshold: float = Field(default=.4,gt=0)
    adwin_delta: float = Field(default=.05,gt=0,lt=1)

@dataclass(frozen=True)
class Alert:
    time: float
    team: str
    score: float
    observation: Observation
    method: str

class RollingDetector:
    def __init__(self, config: DetectorConfig):
        self.config=config
        self.period=None
        self.streak=0
        self.last_alert=float('-inf')

    def reset_period(self, period: int) -> None:
        self.period=period
        self.streak=0
        self.last_alert=float('-inf')

    def gate(self, observation: Observation) -> tuple[bool,float]:
        c=self.config
        supported=min(observation.before.recovery_count,observation.after.recovery_count)>=c.min_recoveries
        enough_time=observation.before_start>=observation.period_start
        delta=changes(observation.before,observation.after)
        if c.features=='location':
            score=delta['location_z']
            floors=delta['location_delta_m']>=c.location_floor_m
        elif c.features=='share':
            score=delta['share_z']
            floors=delta['share_delta']>=c.share_floor
        else:
            score=.6*delta['location_z']+.4*delta['share_z']
            floors=delta['location_delta_m']>=c.location_floor_m and delta['share_delta']>=c.share_floor
        return supported and enough_time and floors and score>=c.threshold,score

    def stream_gate(self, observation: Observation) -> bool:
        return True

    def update(self, observation: Observation) -> Alert | None:
        if observation.period != self.period:
            self.reset_period(observation.period)
        streaming=self.stream_gate(observation)
        passed,score=self.gate(observation)
        self.streak=self.streak+1 if passed and streaming else 0
        if self.streak>=self.config.persistence and observation.time-self.last_alert>=self.config.cooldown_seconds:
            self.last_alert=observation.time
            self.streak=0
            return Alert(observation.time,observation.team,score,observation,self.config.method)
        return None
