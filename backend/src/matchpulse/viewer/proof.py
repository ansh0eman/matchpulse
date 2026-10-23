"""Independent, bounded proof receipts. Numerical authority stays in Python."""

from collections import defaultdict
from statistics import mean
from .service import checked, visible_items, observation
from ..tracking.features import extract_features, attack_point
from ..tracking.evidence import verify_geometry, verify_events
from ..tracking.presentation import review_episode


def receipt(query, claim_id):
    result = checked(query)
    index = result["index"]
    allowed = {cid for t in visible_items(result, query) for cid in t.insight.claim_ids}
    if claim_id not in allowed:
        raise ValueError("Claim not available in this match, audience and clock")
    claim = next(c for c in result["claims"] if c.claim_id == claim_id)
    if not index.verify(claim):
        raise ValueError("Source verification failed")
    rows = [
        observation(index.events[r.source_id])
        for r in claim.references
        if r.category == "event"
    ]
    calculation = {
        "method": claim.verification_method,
        "unit": claim.unit,
        "window": list(claim.window),
        "boundary": "(start, end]",
        "value": claim.value.model_dump(mode="json"),
    }
    frames = []
    samples = []
    contexts = []
    if claim.type == "observed_line_height_change":
        pack = index.packs[claim.value.line.detection_id]
        all_frames = list(index.frames.values())
        if not verify_geometry(pack, all_frames) or not verify_events(
            pack, index.ordered
        ):
            raise ValueError("Position arithmetic failed")
        decision = review_episode(pack, all_frames, index.ordered)
        if decision.claim != claim.value.line:
            raise ValueError("Position no longer eligible")
        groups = {"reference": defaultdict(list), "recent": defaultdict(list)}
        for side in groups:
            for frame_id in pack.tracking_references[side]:
                frame = index.frames[frame_id]
                feature = extract_features(frame, claim.team_id)
                if feature is None:
                    raise ValueError("Invalid sample")
                players = sorted(
                    (
                        p
                        for p in frame.players
                        if p.team_id == claim.team_id and not p.goalkeeper
                    ),
                    key=lambda p: attack_point(p.x, p.y, p.team_id, frame.period)[0],
                )[:3]
                points = [
                    {
                        "id": p.id,
                        "x": p.x,
                        "y": p.y,
                        "attack_x": attack_point(p.x, p.y, p.team_id, frame.period)[0],
                    }
                    for p in players
                ]
                recomputed = sum(p["attack_x"] for p in points) / 3
                groups[side][feature.context].append(recomputed)
                samples.append(
                    {
                        "frame_id": frame_id,
                        "time": frame.time_seconds,
                        "side": side,
                        "context": list(feature.context),
                        "players": points,
                        "line3_m": recomputed,
                    }
                )
        total = sum(len(v) for v in groups["recent"].values())
        for key in sorted(groups["reference"]):
            weight = len(groups["recent"][key]) / total
            contexts.append(
                {
                    "context": list(key),
                    "weight": weight,
                    "before_m": mean(groups["reference"][key]),
                    "after_m": mean(groups["recent"][key]),
                    "reference_count": len(groups["reference"][key]),
                    "recent_count": len(groups["recent"][key]),
                }
            )
        before = sum(c["weight"] * c["before_m"] for c in contexts)
        after = sum(c["weight"] * c["after_m"] for c in contexts)
        if (
            abs(before - claim.value.line.before_m) > 1e-9
            or abs(after - claim.value.line.after_m) > 1e-9
        ):
            raise ValueError("Independent receipt mismatch")
        calculation.update(
            before_m=before,
            after_m=after,
            change_m=after - before,
            formula="Σ recent-context weight × mean(three deepest outfield x), excluding goalkeeper",
            support=pack.support,
            reference_window=pack.reference_window,
            recent_window=pack.recent_window,
            latest_observation=decision.latest_recent_seconds,
            age=decision.recent_age_seconds,
        )
        frames = [
            index.frames[f].model_dump(mode="json")
            for f in (
                pack.tracking_references["reference"][-1],
                pack.tracking_references["recent"][-1],
            )
        ]
    elif claim.type == "goal_context":
        calculation.update(
            formula="Immediate canonical score snapshots; penalty pairs are never counted twice.",
            before=rows[0]["score"],
            after=rows[-1]["score"],
        )
    elif claim.type == "recent_attacking_activity":
        count = sum(
            e.type == "shot"
            and e.team_id == claim.team_id
            and e.period == index.events[claim.references[-1].source_id].period
            and claim.window[0] < e.time_seconds <= claim.window[1]
            for e in index.ordered
        )
        if count != claim.value.shots:
            raise ValueError("Shot count mismatch")
        calculation.update(
            formula="Count source shot attempts by team and period inside the window.",
            recomputed_shots=count,
        )
    elif claim.type == "turnover_to_shot":
        calculation.update(
            formula="Shot time − regain time; identical canonical possession and period.",
            elapsed_seconds=rows[-1]["time_seconds"] - rows[1]["time_seconds"],
            regain_x_m=claim.value.regain_x_m,
        )
    else:
        calculation.update(
            formula="Canonical action and bounded linkage reverified against original source rows."
        )
    return {
        "schema_version": 1,
        "verified": True,
        "match_id": claim.match_id,
        "claim_id": claim_id,
        "type": claim.type,
        "team": claim.team_id,
        "as_of_seconds": claim.as_of_seconds,
        "source_hashes": result["fingerprints"],
        "calculation": calculation,
        "observations": rows,
        "frames": frames,
        "samples": samples,
        "contexts": contexts,
        "references": [r.model_dump(mode="json") for r in claim.references],
        "limitations": list(claim.limitations),
        "verification": "Recomputed on this request from immutable canonical observations",
    }
