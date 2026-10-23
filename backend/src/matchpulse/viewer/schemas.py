"""Closed public request contracts."""

from typing import Literal
from pydantic import BaseModel, ConfigDict, Field
from ..agents.schemas import AskRequest


class ViewQuery(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    scenario: str = Field(min_length=1, max_length=40)
    clock: float = Field(ge=0, le=20000)
    audience: Literal["fan", "analyst"] = "fan"
    favorite: Literal["NORTH", "SOUTH"] | None = None


class Question(BaseModel):
    model_config = ConfigDict(extra="forbid")
    view: ViewQuery
    question: AskRequest.model_fields["question"].annotation
    insight_id: str = Field(min_length=1, max_length=180)
