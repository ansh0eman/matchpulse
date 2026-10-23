"""Python owns observations, temporal access and every published factual sentence."""

import hashlib
import json
from bisect import bisect_right
from functools import lru_cache
from .catalog import SCENARIOS, CONFIG, ROOT
from ..agents.cli import load_source
from ..agents.schemas import Preferences, AskRequest, BroadcastArtifact, WorkflowState
from ..agents.publication import verify_publication
from ..agents.policy import eligible, default_narration, default_overlay
from ..agents.narrative_compiler import compile_narration
from ..agents.overlay_compiler import compile_overlay
from ..agents.tools import EvidenceTools
from ..agents.ask import ask
from ..stories.export import agent_input


def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            h.update(block)
    return h.hexdigest()


@lru_cache(maxsize=5)
def source(scenario_id):
    s = SCENARIOS[scenario_id]
    result = load_source(s.events, s.frames, CONFIG if s.tracking else None)
    result["event_times"] = [e.time_seconds for e in result["index"].ordered]
    result["ordered_frames"] = sorted(
        result["index"].frames.values(), key=lambda f: f.time_seconds
    )
    result["frame_times"] = [f.time_seconds for f in result["ordered_frames"]]
    result["fingerprints"] = {
        "events": digest(s.events),
        "tracking": digest(s.frames) if s.frames else None,
        "config": digest(CONFIG) if s.frames else None,
    }
    result["duration"] = max(
        result["event_times"][-1],
        result["frame_times"][-1] if result["frame_times"] else 0,
    )
    return result


def checked(query):
    if query.scenario not in SCENARIOS:
        raise KeyError("Unknown scenario")
    result = source(query.scenario)
    if query.clock > result["duration"]:
        raise ValueError("Clock exceeds observed match duration")
    return result


def preferences(query):
    return Preferences(audience=query.audience, favorite_team=query.favorite)


def visible_items(result, query):
    return [
        t
        for t in result["timeline"]
        if t.presented_at_seconds <= query.clock and eligible(t, preferences(query))
    ]


def observation(e):
    return {
        "source_id": e.id,
        "time_seconds": e.time_seconds,
        "period": e.period,
        "action": e.type,
        "team": e.team_id,
        "player": e.player_id,
        "ball_position_m": e.position_m.model_dump(),
        "score": e.score.model_dump(),
        "possession_id": e.possession_id,
    }


def recorded_goal():
    captured = ROOT / "research/step3d/artifacts/foundry-goal"
    if not captured.with_suffix(".broadcast.json").exists():
        captured = ROOT / "research/step3c/artifacts/recorded-goal-partial"
    return (
        BroadcastArtifact.model_validate_json(
            captured.with_suffix(".broadcast.json").read_text()
        ),
        WorkflowState.model_validate_json(
            captured.with_suffix(".state.json").read_text()
        ),
    )


def render(item, result, query):
    index = result["index"]
    registry = {c.claim_id: c for c in result["claims"]}
    envelope = agent_input(item.insight, registry, query.audience)
    tools = EvidenceTools(result, index.match_id, query.clock)
    pref = preferences(query)
    narration = compile_narration(
        default_narration(envelope, pref), envelope, tools, pref
    )
    overlay = compile_overlay(default_overlay(envelope), envelope, tools)
    origin = "deterministic"
    nstatus = "deterministic"
    ostatus = "deterministic"
    if query.scenario == "opening-goal" and item.insight.type == "goal_context":
        artifact, state = recorded_goal()
        # A historic model plan is displayed only after current source recompilation.
        if (
            artifact.preferences == pref
            and artifact.insight_id == item.insight.insight_id
            and verify_publication(artifact, state, item, result, tools)
        ):
            narration = artifact.narration
            overlay = artifact.overlay
            origin = "recorded_foundry"
            nstatus = artifact.narration_status
            ostatus = artifact.overlay_status
    return {
        "id": item.insight.insight_id,
        "type": item.insight.type,
        "team": item.insight.team_id,
        "source_seconds": item.insight.event_time_seconds,
        "available_seconds": item.insight.as_of_seconds,
        "presented_seconds": item.presented_at_seconds,
        "narration": narration.model_dump(mode="json"),
        "overlay": overlay.model_dump(mode="json")
        if overlay
        else {"coordinates": [], "metrics": []},
        "origin": origin,
        "narration_status": nstatus,
        "overlay_status": ostatus,
        "claim_ids": list(item.insight.claim_ids),
    }


def catalog():
    # Fixed source descriptions, no future score or insight payload is exposed.
    return [
        {
            "id": s.id,
            "title": s.title,
            "subtitle": s.subtitle,
            "match_id": s.match_id,
            "tracking": s.tracking,
            "start": s.start,
        }
        for s in SCENARIOS.values()
    ]


def view(query):
    result = checked(query)
    index = result["index"]
    items = visible_items(result, query)
    event_n = bisect_right(result["event_times"], query.clock)
    events = index.ordered[:event_n]
    last = events[-1] if events else None
    frame_n = bisect_right(result["frame_times"], query.clock)
    frame = result["ordered_frames"][frame_n - 1] if frame_n else None
    rendered = [render(t, result, query) for t in items]
    diagnostics = [
        d.model_dump(mode="json", exclude={"claim"})
        for d in result["presentation"]
        if d.detected_at_seconds <= query.clock and d.status == "suppressed"
    ]
    return {
        "schema_version": 1,
        "scenario": query.scenario,
        "match_id": index.match_id,
        "clock": query.clock,
        "duration": result["duration"],
        "score": last.score.model_dump() if last else {"home": 0, "away": 0},
        "period": last.period if last else 1,
        "frame": frame.model_dump(mode="json") if frame else None,
        "frame_age": query.clock - frame.time_seconds if frame else None,
        "tracking_available": SCENARIOS[query.scenario].tracking,
        "recent_events": [observation(e) for e in events[-12:]],
        "timeline": rendered,
        "diagnostics": diagnostics[-5:],
        "source_hashes": result["fingerprints"],
        "recap": [
            {
                "id": r["id"],
                "time": r["source_seconds"],
                "text": r["narration"]["headline"],
            }
            for r in rendered[-5:]
        ],
        "provenance": "Synthetic canonical replay · source-verified deterministic presentation",
        "preferences": preferences(query).model_dump(mode="json"),
    }


def question(request):
    result = checked(request.view)
    if request.insight_id not in {
        t.insight.insight_id for t in visible_items(result, request.view)
    }:
        raise ValueError("Insight is not available in this broadcast scope")
    return ask(
        AskRequest(
            match_id=result["index"].match_id,
            as_of_seconds=request.view.clock,
            insight_id=request.insight_id,
            question=request.question,
        ),
        result,
    )


def activity():
    # Genuine recorded integration evidence, independent of the selected replay.
    summary = json.loads(
        (ROOT / "research/step3b/artifacts/live-foundry-validation.json").read_text()
    )
    proof = json.loads(
        (
            ROOT / "research/step3b/artifacts/foundry-authenticated-proof.json"
        ).read_text()
    )
    artifact, state = recorded_goal()
    result = source("opening-goal")
    item = next(
        t for t in result["timeline"] if t.insight.insight_id == artifact.insight_id
    )
    tools = EvidenceTools(result, result["index"].match_id, item.insight.as_of_seconds)
    if not verify_publication(artifact, state, item, result, tools):
        raise ValueError("Recorded capture no longer verifies against source")
    latest = ROOT / "research/step3d/artifacts/foundry-goal.trace.json"
    recovery = json.loads(
        (ROOT / "research/step3c/artifacts/recorded-foundry-trace.json").read_text()
    )
    complete = artifact.narration_status == artifact.overlay_status == "enriched"
    return {
        "mode": "recorded_validation",
        "date": summary["date"],
        "deployment": summary["proof"]["model_deployment"],
        "proof": {
            k: proof[k]
            for k in (
                "authenticated_call_succeeded",
                "structured_validation",
                "latency_seconds",
                "usage",
            )
        },
        "gates": summary["live_tests"]["asserted_gates"],
        "tests_passed": summary["live_tests"]["passed"],
        "full_broadcast_capture": complete,
        "limitations": "One source-reverified recorded goal, exact Fan/no-favorite preferences. Other cards and adaptations are deterministic. Not a reliability, human-quality or cost study. No cloud trace collector delivery is asserted.",
        "roles": [
            {"role": r, "status": "validated in recorded goal test"}
            for r in (
                "Director",
                "Match analyst",
                "Challenger",
                "Narrator",
                "Replay producer",
            )
        ],
        "tools": ["resolve_claim", "resolve_evidence"],
        "proof_sha256": digest(
            ROOT / "research/step3b/artifacts/foundry-authenticated-proof.json"
        ),
        "capture": json.loads(latest.read_text()) if latest.exists() else recovery,
        "recovery_capture": recovery,
        "capture_summary": json.loads(
            (ROOT / "research/step3d/artifacts/foundry-capture.json").read_text()
        )
        if latest.exists()
        else None,
    }
