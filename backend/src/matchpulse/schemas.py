"""Strict canonical v1 models; no simulator-control metadata is accepted."""
from __future__ import annotations
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator

Team = Literal['NORTH', 'SOUTH']
Number = Annotated[float, Field(allow_inf_nan=False)]
Nonnegative = Annotated[float, Field(ge=0, allow_inf_nan=False)]
Count = Annotated[int, Field(ge=0)]
MatchId = Annotated[str, Field(pattern=r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')]
EventType = Literal['match_start','kickoff','half_time','full_time','offside','throw_in','corner','goal_kick','free_kick','penalty','dribble','challenge','yellow_card','red_card','injury','substitution','advantage','aerial_duel','blocked_shot','goalkeeper_claim','goalkeeper_punch','pass','receive','second_ball','interception','tackle','shot','save','miss','foul','goal','recovery']

class StrictModel(BaseModel):
    model_config = ConfigDict(strict=True, extra='forbid', frozen=True, allow_inf_nan=False)

class Point(StrictModel):
    x: Number
    y: Number

class Score(StrictModel):
    home: Count
    away: Count

class SourceEvidence(StrictModel):
    source_index: Count
    field_zones: list[str]
    attack_pattern: str
    chance_quality: Number | None
    possession_final_third_entries: Count

class CanonicalEvent(StrictModel):
    schema_version: Literal[1]
    id: Annotated[str, Field(min_length=1)]
    sequence: Count
    time_seconds: Nonnegative
    period: Literal[1, 2]
    team_id: Team | None
    player_id: str | None
    secondary_player_id: str | None
    type: EventType
    position_m: Point
    attacking_position_m: Point | None
    outcome: str | None
    possession_id: str
    possession_team_id: Team | None
    score: Score
    evidence: SourceEvidence

    @model_validator(mode='before')
    @classmethod
    def reject_boolean_literals(cls, value):
        if isinstance(value, dict):
            for key in ('schema_version', 'period'):
                if isinstance(value.get(key), bool):
                    raise ValueError(f'{key} must be an integer, not a boolean')
        return value

    @model_validator(mode='after')
    def consistent_direction(self):
        if self.team_id is None:
            if self.attacking_position_m is not None:
                raise ValueError('Teamless event must have null attacking coordinates')
        else:
            if self.attacking_position_m is None:
                raise ValueError('Team event requires attacking coordinates')
            forward = (self.team_id == 'NORTH') == (self.period == 1)
            expected = self.position_m if forward else Point(x=105-self.position_m.x, y=68-self.position_m.y)
            if abs(expected.x-self.attacking_position_m.x)>1e-6 or abs(expected.y-self.attacking_position_m.y)>1e-6:
                raise ValueError('Attacking coordinates disagree with period/team')
        return self

class MatchIdentity(StrictModel):
    match_id: MatchId
