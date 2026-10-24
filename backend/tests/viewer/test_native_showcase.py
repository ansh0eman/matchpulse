"""The new goal/position fixture is one run, never a composite broadcast."""
import pytest
from matchpulse.viewer.schemas import ViewQuery, PlaybackQuery
from matchpulse.viewer.service import view
from matchpulse.viewer.playback import segment
from matchpulse.viewer.proof import receipt


@pytest.mark.parametrize("clock,before,after", [(1614, 0, 1), (2171.5, 1, 2)])
def test_native_goal_score_position_and_proof_share_original_source(clock, before, after):
    q = ViewQuery(scenario="native-goals", clock=clock)
    previous = view(q.model_copy(update={"clock": clock - .25}))
    current = view(q)
    assert previous["score"] == {"home": before, "away": 0}
    assert current["score"] == {"home": after, "away": 0}
    assert previous["frame"]["time_seconds"] == clock - .25
    assert current["frame"]["time_seconds"] == clock
    assert len(current["frame"]["players"]) == 22
    goal = next(t for t in current["timeline"] if t["type"] == "goal_context" and t["source_seconds"] == clock)
    assert goal["origin"] == "deterministic"
    proof = receipt(q, goal["claim_ids"][0])
    assert proof["verified"] and proof["match_id"] == current["match_id"]
    assert proof["calculation"]["before"] == previous["score"]
    assert proof["calculation"]["after"] == current["score"]
    with pytest.raises(ValueError):
        receipt(q.model_copy(update={"clock": clock - .25}), goal["claim_ids"][0])
    packet = segment(PlaybackQuery(scenario="native-goals", clock=clock - 1))
    assert len(packet["frames"]) == 65
    assert all(b["time_seconds"] - a["time_seconds"] == .25 for a, b in zip(packet["frames"], packet["frames"][1:]))


def test_source_cache_evicts_before_loading_next_match(monkeypatch):
    from matchpulse.viewer import service
    cache, loads = {}, []
    monkeypatch.setattr(service, "_sources", cache)

    def load(name):
        assert cache == {}  # Old analytical objects must not be cached during a cold load.
        loads.append(name)
        return {"fixture": name}

    monkeypatch.setattr(service, "_load_source", load)
    assert service.source("open-play") is service.source("open-play")
    assert service.source("native-goals") == {"fixture": "native-goals"}
    assert list(cache) == ["native-goals"]
    assert loads == ["open-play", "native-goals"]
    with pytest.raises(KeyError):
        service.source("unknown")
    assert list(cache) == ["native-goals"]
