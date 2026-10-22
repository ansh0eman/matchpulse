"""Interpretable positional shifts and a bounded sequential/ML comparison."""
from __future__ import annotations
from dataclasses import dataclass
from math import exp
from typing import Literal
from pydantic import Field
from ..schemas import StrictModel
from .features import Comparison

class TrackingConfig(StrictModel):
    method:Literal['unconditioned','conditioned','fused','cusum','logistic']='conditioned'
    reference_seconds:int=Field(default=1200,ge=240)
    recent_seconds:int=Field(default=180,ge=30)
    cadence_seconds:int=Field(default=30,ge=1)
    min_recent:int=Field(default=6,ge=1)
    min_reference:int=Field(default=12,ge=1)
    line_threshold_m:float=Field(default=5.,gt=0)
    persistence:int=Field(default=2,ge=1)
    cooldown_seconds:int=Field(default=900,ge=0)
    cusum_threshold:float=Field(default=12.,gt=0)
    model_threshold:float=Field(default=.5,gt=0,lt=1)
    model_id:str|None=None

@dataclass(frozen=True)
class TrackingAlert:
    comparison:Comparison
    direction:str
    score:float
    event_facts:dict|None=None

# Model vector is derived from observables, not the expected intervention direction.
def model_vector(o:Comparison)->list[float]:
    sign=1 if o.delta['line3_m']>=0 else -1
    return [abs(o.delta['line3_m']),-sign*o.delta['nearest_m'],sign*o.delta['density10']]

def logistic_score(o:Comparison,model:dict)->float:
    x=model_vector(o)
    z=model['intercept']+sum(w*(value-mu)/scale for value,mu,scale,w in zip(x,model['mean'],model['scale'],model['weights']))
    return 1/(1+exp(-max(-40,min(40,z))))

class PositionalDetector:
    def __init__(self,config:TrackingConfig,model:dict|None=None):
        self.config=config;self.model=model;self.period=None;self.last_alert=float('-inf')
        self.pending=None;self.streak=0;self.armed=True;self.quiet=0;self.up=0.;self.down=0.
    def update(self,o:Comparison|None,event_facts:dict|None=None)->TrackingAlert|None:
        c=self.config
        if o is None:self.streak=0;self.pending=None;return None
        if o.period!=self.period:
            self.period=o.period;self.streak=0;self.pending=None;self.armed=True;self.quiet=0;self.up=0.;self.down=0.;self.last_alert=float('-inf')
        delta=o.delta['line3_m'];direction='advance' if delta>=0 else 'retreat';magnitude=abs(delta)
        quiet_floor=(2.5 if c.method=='cusum' else c.line_threshold_m)/2
        if not self.armed:
            self.quiet=self.quiet+1 if magnitude<quiet_floor else 0
            if self.quiet>=3:self.armed=True;self.up=0.;self.down=0.;self.quiet=0
        score=magnitude/c.line_threshold_m
        passed=magnitude>=c.line_threshold_m
        if c.method=='cusum':
            self.up=max(0.,.9*self.up+delta-1.)
            self.down=max(0.,.9*self.down-delta-1.)
            score=max(self.up,self.down)/c.cusum_threshold
            direction='advance' if self.up>=self.down else 'retreat'
            passed=score>=1 and magnitude>=2.5 and ((delta>=0)==(direction=='advance'))
        elif c.method=='logistic':
            if self.model is None:raise ValueError('Logistic method requires frozen observable-feature model')
            score=logistic_score(o,self.model);passed=score>=c.model_threshold and magnitude>=2.5
        elif c.method=='fused':
            sign=1 if direction=='advance' else -1
            passed=passed and event_facts is not None and event_facts['supported'] and (sign*event_facts['location_delta_m']>=3 or sign*event_facts['share_delta']>=.05)
        if passed and direction==self.pending:self.streak+=1
        elif passed:self.pending=direction;self.streak=1
        else:self.pending=None;self.streak=0
        if self.armed and self.streak>=c.persistence and o.time-self.last_alert>=c.cooldown_seconds:
            self.last_alert=o.time;self.streak=0;self.armed=False;self.quiet=0;self.up=0.;self.down=0.
            return TrackingAlert(o,direction,score,event_facts)
        return None
