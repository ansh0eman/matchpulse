"""Declared, isolated match sources; callers never provide filesystem paths."""

from dataclasses import dataclass
from pathlib import Path
import os

ROOT = Path(os.environ.get("MATCHPULSE_ROOT", Path(__file__).resolve().parents[4]))
CONFIG = ROOT / "research/step25/artifacts/selected.json"


@dataclass(frozen=True)
class Scenario:
    id: str
    title: str
    subtitle: str
    match_id: str
    directory: str
    tracking: bool
    start: float

    @property
    def events(self):
        bundle = os.environ.get("MATCHPULSE_VIEWER_BUNDLE")
        return (
            Path(bundle) if bundle else ROOT / self.directory
        ) / f"{self.match_id}.jsonl"

    @property
    def frames(self):
        return (
            self.events.with_name(f"{self.match_id}.tracking.jsonl.gz")
            if self.tracking
            else None
        )


SCENARIOS = {
    s.id: s
    for s in (
        Scenario(
            "native-goals",
            "Goals, in motion",
            "Goals and quarter-second positions from the same original run.",
            "fc02c27c-54fc-4104-b428-7e1f9018efea",
            "backend/output/showcase/goal-a",
            True,
            1611.0,
        ),
        Scenario(
            "open-play",
            "The game between the goals",
            "A complete 0–0. Find the story in the observations.",
            "5cc7f774-c215-4773-9318-3a01ad8b23af",
            "backend/output/stories/source",
            True,
            356.0,
        ),
        Scenario(
            "opening-goal",
            "The opening goal",
            "Trace the recorded 0–0 to 1–0 transition.",
            "02840f35-cb05-4812-aa9d-1237e4ab1b9d",
            "data/step2/inference",
            False,
            2371.0,
        ),
        Scenario(
            "equalizer",
            "Back on level terms",
            "A separate match. One source-backed equalizer.",
            "031c8ca1-662c-4255-a615-eb29bd25c249",
            "data/step2/inference",
            False,
            4242.0,
        ),
        Scenario(
            "line-shift",
            "A higher line, proved",
            "Compare the actual sampled positions, in metres.",
            "f2a3e267-d3e5-4c90-ae07-b5a39607ab2d",
            "data/step25/inference",
            True,
            3360.0,
        ),
        Scenario(
            "withheld",
            "When the evidence says wait",
            "Stale positioning is withheld from the broadcast.",
            "31c70a92-4ce1-4ec2-a570-e8112bfcc5fc",
            "data/step25/inference",
            True,
            1350.0,
        ),
    )
}
