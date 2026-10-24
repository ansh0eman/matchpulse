"""Bounded recorded-source prefetch; never a live ingestion/model endpoint.

Each packet contains future observations in an explicitly labelled window.
Consumers must select the causal prefix, never publish the entire packet as now.
Analytical presentation still comes from the unchanged server compilers.
"""
from bisect import bisect_right
import json
from .schemas import ViewQuery
from .service import checked, view, observation


def segment(query):
    source_query = ViewQuery.model_validate(query.model_dump(exclude={"window_seconds"}))
    result = checked(source_query)
    end = min(query.clock + query.window_seconds, result["duration"])
    event_end = bisect_right(result["event_times"], end)
    event_start = max(0, bisect_right(result["event_times"], query.clock) - 12)
    frame_end = bisect_right(result["frame_times"], end)
    frame_start = max(0, bisect_right(result["frame_times"], query.clock) - 1)
    events = result["index"].ordered[event_start:event_end]
    frames = result["ordered_frames"][frame_start:frame_end]
    diagnostics = [
        d.model_dump(mode="json", exclude={"claim"})
        for d in result["presentation"]
        if d.status == "suppressed" and d.detected_at_seconds <= end
    ]
    prior = [d for d in diagnostics if d["detected_at_seconds"] <= query.clock]
    upcoming = [d for d in diagnostics if d["detected_at_seconds"] > query.clock]
    diagnostics = prior[-5:] + upcoming
    if len(events) > 512 or len(frames) > 512 or len(diagnostics) > 512:
        raise ValueError("Playback window exceeds observation bound")
    packet = {
        "schema_version": 1,
        "mode": "prefetched_causal_replay",
        "start": query.clock,
        "end": end,
        "base": view(source_query.model_copy(update={"clock": end})),
        "events": [dict(observation(e), sequence=e.sequence) for e in events],
        "frames": [f.model_dump(mode="json") for f in frames],
        "diagnostics": diagnostics,
        "publication_rule": "Select only observations/claims at or before the displayed clock; this packet is not a current view or live ingestion.",
    }
    if len(json.dumps(packet)) > 2_000_000:
        raise ValueError("Playback packet exceeds byte bound")
    return packet
