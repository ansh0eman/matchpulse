import pytest
from starlette.testclient import TestClient
from matchpulse.viewer.api import app
from matchpulse.viewer.playback import segment
from matchpulse.viewer.schemas import PlaybackQuery

client = TestClient(app)


@pytest.mark.parametrize("scenario,clock", [("open-play", 356), ("opening-goal", 2370), ("equalizer", 4241), ("line-shift", 3359), ("withheld", 1349)])
def test_prefetch_is_bounded_and_preserves_original_order_and_namespace(scenario, clock):
    p = segment(PlaybackQuery(scenario=scenario, clock=clock))
    assert p["mode"] == "prefetched_causal_replay"
    assert p["start"] == clock and p["end"] <= clock + 16
    assert p["base"]["scenario"] == scenario
    for rows, field in [(p["events"], "time_seconds"), (p["frames"], "time_seconds")]:
        assert len(rows) <= 512
        assert all(r[field] <= p["end"] for r in rows)
        assert [r["sequence"] for r in rows] == sorted(set(r["sequence"] for r in rows))
        assert all(b["sequence"] == a["sequence"] + 1 for a, b in zip(rows, rows[1:]))
    assert all(t["presented_seconds"] <= p["end"] for t in p["base"]["timeline"])
    assert all(c.startswith(p["base"]["match_id"] + ":") for t in p["base"]["timeline"] for c in t["claim_ids"])


def test_event_only_window_does_not_generate_tracking_or_authorize_future_proof():
    p = segment(PlaybackQuery(scenario="opening-goal", clock=2370))
    assert p["frames"] == [] and p["base"]["tracking_available"] is False
    future = next(t for t in p["base"]["timeline"] if t["type"] == "goal_context")
    response = client.get("/api/proof", params={"scenario": "opening-goal", "clock": 2370, "claim_id": future["claim_ids"][0]})
    assert response.status_code == 400


@pytest.mark.parametrize("extra", [{"window_seconds": 17}, {"window_seconds": -1}, {"window_seconds": "NaN"}, {"window_seconds": "Infinity"}, {"path": "/private"}, {"claim_id": "unexpected"}])
def test_invalid_or_unbounded_playback_requests_fail_closed(extra):
    r = client.get("/api/playback", params={"scenario": "line-shift", "clock": 3360, **extra})
    assert r.status_code == 400


def test_window_clips_to_observed_end():
    from matchpulse.viewer.service import source
    end = source("opening-goal")["duration"]
    p = segment(PlaybackQuery(scenario="opening-goal", clock=end - .25))
    assert p["end"] == end
    assert client.get("/api/playback", params={"scenario": "opening-goal", "clock": end + 1}).status_code == 400
