"""Versioned, closed story contracts; priority is editorial, never probability."""
from typing import Annotated, Literal
from pydantic import Field
from ..schemas import StrictModel, MatchId, Team, Nonnegative, Score
from ..tracking.presentation import VerifiedLineClaim

Kind = Literal['goal_context','observed_shot','shot_outcome','high_turnover',
               'turnover_to_shot','recent_attacking_activity','player_dismissal',
               'match_boundary','observed_line_height_change']

class Reference(StrictModel):
    match_id: MatchId
    category: Literal['event','tracking']
    source_id: str

class GoalValue(StrictModel):
    kind: Literal['goal_context'] = 'goal_context'
    before: Score
    after: Score
    context: Literal['opening_goal','equalizer','go_ahead','extends_lead','reduces_deficit','score_already_updated']

class ActionValue(StrictModel):
    kind: Literal['observed_shot','shot_outcome','player_dismissal','match_boundary']
    action: Literal['shot','save','miss','blocked_shot','red_card','match_start','kickoff','half_time','full_time']

class TurnoverValue(StrictModel):
    kind: Literal['high_turnover','turnover_to_shot']
    from_team: Team
    possession_id: str
    regain_x_m: float = Field(ge=70, le=105, allow_inf_nan=False)
    elapsed_seconds: Nonnegative

class ActivityValue(StrictModel):
    kind: Literal['recent_attacking_activity'] = 'recent_attacking_activity'
    shots: int = Field(ge=3)

class LineValue(StrictModel):
    kind: Literal['observed_line_height_change'] = 'observed_line_height_change'
    line: VerifiedLineClaim

Value = Annotated[GoalValue | ActionValue | TurnoverValue | ActivityValue | LineValue, Field(discriminator='kind')]

class Claim(StrictModel):
    schema_version: Literal[1] = 1
    claim_id: str
    match_id: MatchId
    type: Kind
    team_id: Team | None
    player_ids: tuple[str,...]
    value: Value
    unit: Literal['score','event','m_and_s','shots','m']
    window: tuple[Nonnegative,Nonnegative]
    as_of_seconds: Nonnegative
    references: tuple[Reference,...]
    verification_method: Literal['canonical_prefix_v1','presentation_gate_v1']
    limitations: tuple[str,...] = ('Synthetic uncalibrated football; observations do not establish coach intent.',)
    display_rule: Literal['integers; metres one decimal; seconds exact'] = 'integers; metres one decimal; seconds exact'

class Fallback(StrictModel):
    headline: str
    explanation: str

class MatchInsight(StrictModel):
    schema_version: Literal[1] = 1
    insight_id: str
    match_id: MatchId
    type: Kind
    event_time_seconds: Nonnegative
    as_of_seconds: Nonnegative
    team_id: Team | None
    player_ids: tuple[str,...]
    period: Literal[1,2]
    priority: int = Field(ge=0,le=100)
    priority_semantics: Literal['editorial ordering, not probability'] = 'editorial ordering, not probability'
    claim_ids: tuple[str,...]
    evidence: tuple[Reference,...]
    observed_score: Score
    fallback: Fallback
    quality: Literal['verified_observation'] = 'verified_observation'
    limitations: tuple[str,...]
    provenance: Literal['pinned synthetic simulator canonical observations'] = 'pinned synthetic simulator canonical observations'
    verified: Literal[True] = True

class TimelineItem(StrictModel):
    schema_version: Literal[1] = 1
    insight: MatchInsight
    presented_at_seconds: Nonnegative
    visualization: Literal['event_location','scoreline','window_comparison','tracking_comparison']

class AgentInput(StrictModel):
    schema_version: Literal[1] = 1
    match_id: MatchId
    insight: MatchInsight
    claims: tuple[Claim,...]
    audience: Literal['fan','analyst']
    allowed_interpretations: tuple[str,...] = ('Describe the registered observations with their limitations.',)
    resolver: Literal['match_id + reference category + source_id'] = 'match_id + reference category + source_id'

class AgentOutput(StrictModel):
    schema_version: Literal[1] = 1
    match_id: MatchId
    insight_id: str
    selected_claim_ids: tuple[str,...]
    template: Literal['deterministic_fallback'] = 'deterministic_fallback'
