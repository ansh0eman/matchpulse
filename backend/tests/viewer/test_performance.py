"""Responsiveness and source retention; no timing claims about detector accuracy."""

from concurrent.futures import ThreadPoolExecutor
from threading import Event, Lock

from starlette.testclient import TestClient

from matchpulse.viewer import api, service


def test_health_and_catalog_remain_responsive_while_analysis_is_blocked(monkeypatch):
    started, release = Event(), Event()

    def blocked_view(query):
        started.set()
        assert release.wait(5), "Test did not release the controlled analytical job"
        return {"scenario": query.scenario}

    monkeypatch.setattr(api, "view", blocked_view)
    with TestClient(api.app) as client, ThreadPoolExecutor(max_workers=2) as callers:
        heavy = callers.submit(client.get, "/api/view?scenario=line-shift&clock=3360")
        try:
            assert started.wait(5)
            health = callers.submit(client.get, "/api/health")
            assert health.result(timeout=1).json()["status"] == "ok"
            catalog = callers.submit(client.get, "/api/scenarios")
            assert len(catalog.result(timeout=1).json()) == 6
            assert not heavy.done()
        finally:
            release.set()
        assert heavy.result(timeout=5).json()["scenario"] == "line-shift"


def test_analytical_requests_remain_serialized(monkeypatch):
    started, release = Event(), Event()
    guard = Lock()
    active = maximum = completed = 0

    def controlled_view(query):
        nonlocal active, maximum, completed
        with guard:
            active += 1
            maximum = max(maximum, active)
            started.set()
        try:
            assert release.wait(5)
            return {"clock": query.clock}
        finally:
            with guard:
                active -= 1
                completed += 1

    monkeypatch.setattr(api, "view", controlled_view)
    with TestClient(api.app) as client, ThreadPoolExecutor(max_workers=2) as callers:
        first = callers.submit(client.get, "/api/view?scenario=line-shift&clock=3360")
        second = callers.submit(client.get, "/api/view?scenario=withheld&clock=1350")
        try:
            assert started.wait(5)
            assert client.get("/api/health").status_code == 200
        finally:
            release.set()
        assert first.result(timeout=5).status_code == second.result(timeout=5).status_code == 200
    assert maximum == 1 and completed == 2


def test_recorded_activity_reverifies_without_evicting_selected_tracking_source(monkeypatch):
    selected = service.source("line-shift")
    original = service.verify_publication
    checks = []

    def verify(*args):
        checks.append(True)
        return original(*args)

    monkeypatch.setattr(service, "verify_publication", verify)
    for _ in range(2):
        assert service.activity()["full_broadcast_capture"] is True
        assert service.source("line-shift") is selected
    assert len(checks) == 2  # Current source checks, not an activity response cache.
