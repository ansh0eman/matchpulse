"""Same-source deterministic/saved-Foundry comparison; never requests inference."""

import argparse
import json
from pathlib import Path

from matchpulse.agents.narrative_compiler import compile_narration
from matchpulse.agents.overlay_compiler import compile_overlay
from matchpulse.agents.policy import default_narration, default_overlay
from matchpulse.agents.publication import verify_publication
from matchpulse.agents.tools import EvidenceTools
from matchpulse.stories.export import agent_input
from matchpulse.viewer.catalog import ROOT
from matchpulse.viewer.proof import receipt
from matchpulse.viewer.schemas import ViewQuery
from matchpulse.viewer.service import preferences, recorded_goal, source


def compare():
    artifact, state = recorded_goal()
    result = source("opening-goal")
    item = next(row for row in result["timeline"] if row.insight.insight_id == artifact.insight_id)
    query = ViewQuery(scenario="opening-goal", clock=item.presented_at_seconds,
                      audience=artifact.preferences.audience, favorite=artifact.preferences.favorite_team)
    pref = preferences(query)
    tools = EvidenceTools(result, result["index"].match_id, query.clock)
    assert artifact.preferences == pref
    assert verify_publication(artifact, state, item, result, tools)
    envelope = agent_input(item.insight, {c.claim_id: c for c in result["claims"]}, query.audience)
    deterministic_plan = default_narration(envelope, pref)
    deterministic = compile_narration(deterministic_plan, envelope, tools, pref)
    deterministic_overlay = compile_overlay(default_overlay(envelope), envelope, tools)
    proofs = [receipt(query, claim_id) for claim_id in item.insight.claim_ids]
    assert all(p["verified"] and p["match_id"] == artifact.match_id for p in proofs)
    for sentence in deterministic.sentences:
        assert set(sentence.claim_ids) <= set(item.insight.claim_ids)
    trace = json.loads((ROOT / "research/step3d/artifacts/foundry-goal.trace.json").read_text())
    public = lambda narration: narration.model_dump(mode="json")
    return {
        "scope": "One genuine recorded goal compared with current deterministic compilation; no quality experiment or new inference",
        "scenario": query.scenario, "match_id": artifact.match_id,
        "insight_id": artifact.insight_id, "clock": query.clock,
        "preferences": pref.model_dump(mode="json"), "source_hashes": result["fingerprints"],
        "new_model_calls": 0, "recorded_publication_reverified": True,
        "claim_receipts_recomputed": len(proofs),
        "claim_ids": list(item.insight.claim_ids),
        "deterministic": {"plan": deterministic_plan.model_dump(mode="json"), "narration": public(deterministic), "overlay": deterministic_overlay.model_dump(mode="json")},
        "recorded_foundry": {
            "original_director": state.director.model_dump(mode="json") if state.director else None,
            "challenge": state.challenge.model_dump(mode="json") if state.challenge else None,
            "final_plan": state.narration_plan.model_dump(mode="json") if state.narration_plan else None,
            "narration": public(artifact.narration), "overlay": artifact.overlay.model_dump(mode="json"),
            "role_attempts": sum(row["event"] == "request_started" for row in trace["events"]),
            "recorded_tool_rows": len(trace["tools"]), "original_http_request_count": None,
        },
        "differences": {
            "headline": deterministic.headline != artifact.narration.headline,
            "sentences": deterministic.sentences != artifact.narration.sentences,
            "limitations": deterministic.limitations != artifact.narration.limitations,
            "overlay_metrics": deterministic_overlay.metrics != artifact.overlay.metrics,
            "overlay_coordinates": deterministic_overlay.coordinates != artifact.overlay.coordinates,
        },
        "human_preference": None, "language_quality_superiority": None,
        "verdict": "Recorded orchestration and narrowing demonstrated; human usefulness advantage is not established",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    report = compare()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"output": str(args.output), "reverified": report["recorded_publication_reverified"], "differences": report["differences"], "new_model_calls": 0}))
