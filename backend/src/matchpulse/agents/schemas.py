"""Controlled decisions contain no model-authored factual numbers or free prose."""
from typing import Literal
from pydantic import Field
from ..schemas import StrictModel,MatchId,Nonnegative,Team
from ..stories.schemas import AgentInput,Reference

Role=Literal['director','match_analyst','tactical_analyst','challenger','narrator','replay_producer']
Category=Literal['score_context','shot_sequence','regain_sequence','attacking_activity','position_comparison','match_state','observed_event']
Angle=Literal['score_first','sequence_first','measurement_first','evidence_first']

class Preferences(StrictModel):
    audience: Literal['fan','analyst']='fan'
    favorite_team: Team | None=None
    language: Literal['en']='en'

class DirectorDecision(StrictModel):
    schema_version: Literal[2]=2
    specialists: tuple[Literal['match_analyst','tactical_analyst'],...]
    angle: Angle
    challenge: bool
    max_calls: int=Field(ge=1,le=6)

class Analysis(StrictModel):
    schema_version: Literal[2]=2
    claim_ids: tuple[str,...]=Field(min_length=1,max_length=8)
    category: Category
    requested_evidence: tuple[Reference,...]=Field(max_length=12)
    limitation_codes: tuple[Literal['synthetic','sampled_position','association_only','incomplete_linkage'],...]
    unsupported_possibilities: tuple[Literal['coach_intent','causal_press','xg','assist','possession_percentage'],...]

class Challenge(StrictModel):
    schema_version: Literal[2]=2
    affected_claim_ids: tuple[str,...]=Field(max_length=8)
    objections: tuple[Literal['narrow_scope','insufficient_context','unsupported_causality','missing_evidence'],...]
    disposition: Literal['accept','narrow','fallback']

class NarrationPlan(StrictModel):
    schema_version: Literal[2]=2
    claim_ids: tuple[str,...]=Field(min_length=1,max_length=8)
    angle: Angle
    hook: Literal['direct','replay','evidence']
    depth: Literal['brief','detailed']
    qualification: Literal['synthetic','sampled','association']

class OverlayPlan(StrictModel):
    schema_version: Literal[2]=2
    claim_ids: tuple[str,...]=Field(min_length=1,max_length=8)
    family: Literal['scoreline_change','event_location','shot_sequence','regain_to_shot','rolling_activity','positional_comparison']
    emphasis: Literal['incident','sequence','measurements']

class Metric(StrictModel):
    claim_id: str
    name: str
    value: float=Field(allow_inf_nan=False)
    unit: Literal['m','s','shots','goals']

class VerifiedOverlay(StrictModel):
    schema_version: Literal[2]=2
    plan: OverlayPlan
    references: tuple[Reference,...]
    replay_window: tuple[Nonnegative,Nonnegative]
    metrics: tuple[Metric,...]
    coordinates: tuple[tuple[str,float,float],...]
    observation_semantics: Literal['source ball/player coordinates only; interpolation is visualization']='source ball/player coordinates only; interpolation is visualization'

class Sentence(StrictModel):
    text: str
    claim_ids: tuple[str,...]

class Narration(StrictModel):
    schema_version: Literal[2]=2
    headline: str
    sentences: tuple[Sentence,...]
    limitations: tuple[str,...]

class TraceEvent(StrictModel):
    schema_version: Literal[1]=1
    trace_id: str
    span_id: str
    role: str
    event: str
    elapsed_ms: Nonnegative
    reason: str | None=None
    usage_input: int | None=None
    usage_output: int | None=None

class BroadcastArtifact(StrictModel):
    schema_version: Literal[2]=2
    match_id: MatchId
    insight_id: str
    source_seconds: Nonnegative
    available_seconds: Nonnegative
    presented_seconds: Nonnegative
    preferences: Preferences
    claim_ids: tuple[str,...]
    category: Category
    angle: Angle
    narration: Narration
    overlay: VerifiedOverlay | None
    evidence: tuple[Reference,...]
    trace_id: str
    origin: Literal['foundry','offline_fake','deterministic']
    narration_status: Literal['enriched','fallback']
    overlay_status: Literal['enriched','fallback','unavailable']
    errors: tuple[str,...]

class WorkflowState(StrictModel):
    schema_version: Literal[2]=2
    envelope: AgentInput
    preferences: Preferences
    trace_id: str
    director: DirectorDecision | None=None
    analyses: tuple[Analysis,...]=()
    challenge: Challenge | None=None
    narration_plan: NarrationPlan | None=None
    overlay_plan: OverlayPlan | None=None
    errors: tuple[str,...]=()

class AskRequest(StrictModel):
    match_id: MatchId
    as_of_seconds: Nonnegative
    question: Literal['evidence','before_goal','shot_sequence','why_highlighted','position_change','compare_position','coach_intent','xg','possession_percentage','counterfactual']
    insight_id: str
