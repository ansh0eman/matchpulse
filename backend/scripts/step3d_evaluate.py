"""Offline engineering A/B/C comparison. No Foundry, SDK graph or quality claims."""

import asyncio
import json
from collections import Counter
from pathlib import Path
from statistics import mean
from matchpulse.agents.schemas import Preferences
from matchpulse.agents.provider import FakeProvider
from matchpulse.agents.workflow import Studio
from matchpulse.agents.policy import eligible
from matchpulse.agents.publication import verify_publication
from matchpulse.stories.export import agent_input
from matchpulse.viewer.catalog import ROOT, SCENARIOS
from matchpulse.viewer.service import source


async def run():
    packet = json.loads(
        (ROOT / "research/step3a/artifacts/review-packet.json").read_text()
    )
    review_keys = json.loads(
        (ROOT / "research/step3a/artifacts/review-key.json").read_text()
    )
    keys = [k for k in review_keys if "claim_id" in k]
    assert len(packet["episodes"]) == 22
    keyed_ids = {k["episode_id"] for k in keys}
    assert keyed_ids <= {e["episode_id"] for e in packet["episodes"]}
    controls = [e for e in packet["episodes"] if e["episode_id"] not in keyed_ids]
    matches = {s.match_id: s.id for s in SCENARIOS.values()}
    records = []
    faults = []
    # The packet has 19 registered claim episodes and three review controls.
    # One stale control has a match key but deliberately has no claim identity.
    # Controls have no registered authority: never invent an envelope for them.
    for control in controls:
        for audience in ("fan", "analyst"):
            for mode in ("fallback", "simple", "adaptive"):
                records.append(
                    {
                        "episode": control["episode_id"],
                        "audience": audience,
                        "mode": mode,
                            "status": "review_control_not_published",
                        "requests": 0,
                    }
                )
    for key in keys:
        result = source(matches[key["match_id"]])
        item = next(
            (t for t in result["timeline"] if key["claim_id"] in t.insight.claim_ids),
            None,
        )
        for audience in ("fan", "analyst"):
            preferences = Preferences(audience=audience)
            for mode in ("fallback", "simple", "adaptive"):
                row = {"episode": key["episode_id"], "audience": audience, "mode": mode}
                if item is None or not eligible(item, preferences):
                    records.append(
                        {
                            **row,
                            "status": "scheduler_or_audience_suppressed",
                            "requests": 0,
                        }
                    )
                    continue
                envelope = agent_input(
                    item.insight, {c.claim_id: c for c in result["claims"]}, audience
                )
                studio = Studio(result, FakeProvider(), preferences)
                artifact, state = await studio.run(envelope, item, mode=mode)
                verified = verify_publication(
                    artifact, state, item, result, studio.tools, mode=studio.mode
                )
                assert verified
                assert all(c["status"] == "success" for c in studio.tools.calls)
                if mode == "fallback":
                    assert studio.requests.attempts == 0
                records.append(
                    {
                        **row,
                        "status": "verified_publication",
                        "requests": studio.requests.attempts,
                        "actual_mode": studio.mode,
                        "tool_calls": len(studio.tools.calls),
                        "narration_status": artifact.narration_status,
                        "overlay_status": artifact.overlay_status,
                    }
                )
    result = source("opening-goal")
    item = next(t for t in result["timeline"] if t.insight.type == "goal_context")
    envelope = agent_input(item.insight, {c.claim_id: c for c in result["claims"]})
    for mode in ("simple", "adaptive"):
        for role, fault in (
            ("narrator", "timeout"),
            ("narrator", "malformed"),
            ("replay_producer", "wrong_overlay"),
            ("match_analyst", "unknown_claim"),
            ("challenger", "objection"),
        ):
            studio = Studio(
                result, FakeProvider({role: fault}), Preferences(), timeout=0.02
            )
            artifact, state = await studio.run(envelope, item, mode=mode)
            assert verify_publication(
                artifact, state, item, result, studio.tools, mode=studio.mode
            )
            requested = role in {c["role"] for c in studio.provider.calls}
            faults.append(
                {
                    "mode": mode,
                    "fault_role": role,
                    "fault": fault,
                    "fault_role_requested": requested,
                    "verified": True,
                    "requests": studio.requests.attempts,
                    "narration_status": artifact.narration_status,
                    "overlay_status": artifact.overlay_status,
                    "errors": list(artifact.errors),
                }
            )
    summaries = {}
    for mode in ("fallback", "simple", "adaptive"):
        subset = [r for r in records if r["mode"] == mode]
        published = [r for r in subset if r["status"] == "verified_publication"]
        summaries[mode] = {
            "considered": len(subset),
            "published_and_verified": len(published),
            "suppressed": len(subset) - len(published),
            "statuses": dict(Counter(r["status"] for r in subset)),
            "total_provider_requests": sum(r["requests"] for r in subset),
            "mean_requests_per_published_moment": mean(r["requests"] for r in published)
            if published
            else None,
            "actual_modes": dict(Counter(r["actual_mode"] for r in published)),
        }
    output = {
        "kind": "OFFLINE FakeProvider engineering comparison; not real-model quality or MAF execution",
        "source_packet_episodes": 22,
        "review_key_entries": len(review_keys),
        "registered_claim_episodes": len(keys),
        "review_controls_without_registered_claim": [
            {"episode": e["episode_id"], "type": e["type"]} for e in controls
        ],
        "considered_preferences": ["fan", "analyst"],
        "human_ratings": None,
        "cloud_latency": None,
        "tokens": None,
        "cloud_cost": None,
        "summaries": summaries,
        "records": records,
        "fault_cases": faults,
        "conclusion": "Finite source-publication, routing and recovery checks only. Real-model and human superiority unmeasured.",
    }
    destination = ROOT / "research/step3d/artifacts/offline-comparison.json"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(output, indent=2) + "\n")
    print(
        json.dumps(
            {
                "summaries": summaries,
                "verified_fault_configurations": len(faults),
                "fault_role_actually_requested": sum(f["fault_role_requested"] for f in faults),
                "cloud_calls": 0,
            }
        )
    )


if __name__ == "__main__":
    asyncio.run(run())
