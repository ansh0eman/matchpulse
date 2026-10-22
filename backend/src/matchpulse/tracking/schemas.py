"""Observable tracking v1: closed allowlist; internal simulator state forbidden."""
from __future__ import annotations
from typing import Literal
from pydantic import Field, model_validator
from ..schemas import StrictModel,Number,Nonnegative,Count,Team,Score

class TrackedPlayer(StrictModel):
    id: str=Field(min_length=1)
    team_id:Team
    goalkeeper:bool
    x:Number
    y:Number

class ObservedBall(StrictModel):
    x:Number
    y:Number
    owner_id:str|None
    owner_status:Literal['active','unowned','inactive_reference']

class TrackingFrame(StrictModel):
    schema_version:Literal[1]
    frame_id:str=Field(min_length=1)
    sequence:Count
    time_seconds:Nonnegative
    period:Literal[1,2]
    phase:Literal['kickoff','open_play','throw_in','corner','goal_kick','free_kick','penalty','injury_stoppage','substitution','half_time','full_time']
    score:Score
    ball:ObservedBall
    players:list[TrackedPlayer]=Field(max_length=22)

    @model_validator(mode='before')
    @classmethod
    def integer_literals(cls,value):
        if isinstance(value,dict) and any(isinstance(value.get(k),bool) for k in ['schema_version','period']):
            raise ValueError('Version and period cannot be boolean')
        return value

    @model_validator(mode='after')
    def owner_consistency(self):
        ids={p.id for p in self.players}
        if len(ids)!=len(self.players):raise ValueError('Duplicate active-player ID')
        expected='unowned' if self.ball.owner_id is None else 'active' if self.ball.owner_id in ids else 'inactive_reference'
        if self.ball.owner_status!=expected:raise ValueError('Owner quality disagrees with active roster')
        return self
