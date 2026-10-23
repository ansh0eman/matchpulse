"""Acceptance of source facts and temporal/capability boundaries, without cloud calls."""

import math
from dataclasses import replace
import pytest
from starlette.testclient import TestClient
from matchpulse.viewer.api import app
from matchpulse.viewer.schemas import ViewQuery
from matchpulse.viewer.service import source, view
from matchpulse.viewer.proof import receipt

client = TestClient(app)


def query(s="opening-goal", t=2371.0, **kw):
    return ViewQuery(scenario=s, clock=t, **kw)


def goal(r):
    return next(t for t in r["timeline"] if t["type"] == "goal_context")


def test_score_transition_and_future_claim_rejection():
    before = view(query(t=2370.0))
    after = view(query())
    assert before["score"] == {"home": 0, "away": 0}
    assert after["score"] == {"home": 1, "away": 0}
    g = goal(after)
    with pytest.raises(ValueError):
        receipt(query(t=2370.0), g["claim_ids"][0])
    p = receipt(query(), g["claim_ids"][0])
    assert p["calculation"]["before"] == {"home": 0, "away": 0}
    assert p["calculation"]["after"] == {"home": 1, "away": 0}
    assert p["observations"][-1]["source_id"] == "evt_002783"


def test_equalizer_is_separate_and_prefix_score_is_correct():
    assert view(query("equalizer", 4241.0))["score"] == {"home": 0, "away": 1}
    assert view(query("equalizer", 4242.0))["score"] == {"home": 1, "away": 1}
    c = goal(view(query()))["claim_ids"][0]
    with pytest.raises(ValueError):
        receipt(query("equalizer", 4242.0), c)


def test_tracking_never_uses_future_frame_and_zero_zero_stays_honest():
    for t in (0.0, 356.0, 1800.0, 4000.0):
        r = view(query("open-play", t))
        assert r["score"] == {"home": 0, "away": 0}
        assert r["frame"] is None or r["frame"]["time_seconds"] <= t
        assert all(i["presented_seconds"] <= t for i in r["timeline"])
        assert not any(i["type"] == "goal_context" for i in r["timeline"])


def test_personalization_preserves_measurements_and_exposes_detail():
    fan = view(query())
    analyst = view(query(audience="analyst", favorite="NORTH"))
    a, b = goal(fan), goal(analyst)
    assert a["claim_ids"] == b["claim_ids"]
    assert a["overlay"]["metrics"] == b["overlay"]["metrics"]
    assert len(b["narration"]["sentences"]) > len(a["narration"]["sentences"])
    assert b["narration"]["headline"].startswith("NORTH view")
    result = source("open-play")
    duration = result["duration"]
    assert len(view(query("open-play", duration))["timeline"]) == 18
    assert len(view(query("open-play", duration, audience="analyst"))["timeline"]) == 63


def test_position_arithmetic_comes_from_observed_coordinates():
    q = query("line-shift", 3360.0)
    r = view(q)
    t = next(t for t in r["timeline"] if t["type"] == "observed_line_height_change")
    p = receipt(q, t["claim_ids"][0])
    c = p["calculation"]
    assert c["before_m"] == pytest.approx(21.951300813008128)
    assert c["after_m"] == pytest.approx(31.96388888888889)
    assert c["change_m"] == pytest.approx(10.01258807588076)
    assert len(p["samples"]) == 59
    for s in p["samples"]:
        assert s["line3_m"] == pytest.approx(
            sum(x["attack_x"] for x in s["players"]) / 3
        )
        assert s["time"] <= q.clock


def test_stale_position_is_withheld():
    r = view(query("withheld", 1350.0))
    assert not any(t["type"] == "observed_line_height_change" for t in r["timeline"])
    d = next(d for d in r["diagnostics"] if d["detected_at_seconds"] == 1350.0)
    assert "stale_recent_evidence" in d["reasons"] and d["recent_age_seconds"] == 132.0


def test_corrupted_goal_source_fails_closed(monkeypatch):
    r = view(query())
    cid = goal(r)["claim_ids"][0]
    index = source("opening-goal")["index"]
    event = index.events["evt_002783"]
    monkeypatch.setitem(
        index.events, event.id, event.model_copy(update={"type": "pass"})
    )
    with pytest.raises(ValueError):
        receipt(query(), cid)


@pytest.mark.parametrize(
    "params",
    [
        {"scenario": "../private", "clock": 1},
        {"scenario": "opening-goal", "clock": "nan"},
        {"scenario": "opening-goal", "clock": -1},
        {"scenario": "opening-goal", "clock": 99999},
        {"scenario": "opening-goal", "clock": 1, "path": "/etc/passwd"},
    ],
)
def test_bad_requests_are_rejected(params):
    assert client.get("/api/view", params=params).status_code in (400, 404)


def test_restricted_questions_and_clock_scope():
    r = view(query())
    i = goal(r)["id"]
    body = {
        "view": {"scenario": "opening-goal", "clock": 2371.0},
        "insight_id": i,
        "question": "coach_intent",
    }
    response = client.post("/api/ask", json=body)
    assert response.status_code == 200 and response.json()["status"] == "unsupported"
    body["question"] = "before_goal"
    answer = client.post("/api/ask", json=body).json()
    assert (
        answer["status"] == "verified"
        and "No assist or causal link is inferred" in answer["explanation"]
    )
    body["view"]["clock"] = 1.0
    assert client.post("/api/ask", json=body).status_code == 400
    body["question"] = "invent_a_goal"
    assert client.post("/api/ask", json=body).status_code == 400


def test_recorded_activity_is_honest_and_contains_no_credentials():
    r = client.get("/api/activity").json()
    assert r["mode"] == "recorded_validation" and r["tests_passed"] == 4
    assert not r["full_broadcast_capture"]
    assert r["proof"]["authenticated_call_succeeded"]
    assert r["capture"]["origin"] == "foundry"
    assert r["capture"]["narration_status"] == "fallback"
    assert all(t["status"] == "success" for t in r["capture"]["tools"])


def test_recorded_card_is_reverified_and_preference_scoped():
    r = goal(view(query()))
    assert r["origin"] == "recorded_foundry"
    assert r["narration_status"] == "fallback" and r["overlay_status"] == "enriched"
    assert goal(view(query(audience="analyst")))["origin"] == "deterministic"


def test_source_failure_is_actionable_without_paths(monkeypatch):
    def fail(_):
        raise FileNotFoundError("/private/secret")

    monkeypatch.setattr("matchpulse.viewer.service.source", fail)
    r = client.get("/api/view", params={"scenario": "opening-goal", "clock": 1})
    assert r.status_code == 503 and "/private" not in r.text


def test_host_and_methods():
    assert (
        client.get("/api/health", headers={"host": "malicious.example"}).status_code
        == 400
    )
    assert client.post("/api/view", json={}).status_code == 405


def test_oversized_question_is_rejected_without_source_access(monkeypatch):
    def forbidden(_):
        raise AssertionError("Invalid oversized input must not read a match")

    monkeypatch.setattr("matchpulse.viewer.service.source", forbidden)
    response = client.post("/api/ask", content=b" " * 4097)
    assert response.status_code == 400


def test_packaged_security_headers(monkeypatch):
    monkeypatch.setenv("MATCHPULSE_WEB_DIST", "/unused-for-health")
    response = client.get("/api/health")
    assert response.headers["x-frame-options"] == "DENY"
    assert "script-src 'self'" in response.headers["content-security-policy"]
    assert "'unsafe-inline'" not in response.headers["content-security-policy"]
