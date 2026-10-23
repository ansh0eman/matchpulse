"""Operator smoke check of a credential-free viewer. No model requests."""
import argparse
import json
import math
import time
from urllib.parse import urlencode, urlparse
from urllib.request import urlopen


def check(base):
    parsed = urlparse(base)
    if parsed.scheme != "https" and not (
        parsed.scheme == "http" and parsed.hostname in {"localhost", "127.0.0.1"}
    ):
        raise ValueError("Use public HTTPS or an explicit localhost preview")

    def get(path, **query):
        url = base.rstrip("/") + path
        if query:
            url += "?" + urlencode(query)
        with urlopen(url, timeout=120) as response:
            assert response.status == 200
            return json.load(response)

    started = time.perf_counter()
    for attempt in range(60):
        try:
            assert get("/api/health")["status"] == "ok"
            break
        except (OSError, AssertionError):
            if attempt == 59:
                raise
            time.sleep(2)
    health_seconds = time.perf_counter() - started
    started = time.perf_counter()
    view = get("/api/view", scenario="line-shift", clock=3360, audience="fan")
    view_seconds = time.perf_counter() - started
    item = next(x for x in view["timeline"] if x["type"] == "observed_line_height_change")
    proof = get("/api/proof", scenario="line-shift", clock=3360,
                audience="fan", claim_id=item["claim_ids"][0])
    assert proof["verified"] is True and len(proof["samples"]) == 59
    assert math.isclose(proof["calculation"]["change_m"], 10.01258807588076, abs_tol=1e-10)
    assert proof["match_id"] == view["match_id"]
    before = get("/api/view", scenario="opening-goal", clock=2370, audience="fan")
    after = get("/api/view", scenario="opening-goal", clock=2371, audience="fan")
    assert before["score"] == {"home": 0, "away": 0}
    assert after["score"] == {"home": 1, "away": 0}
    assert after["tracking_available"] is False and after["frame"] is None
    activity = get("/api/activity")
    assert activity["full_broadcast_capture"] is True
    assert activity["capture"]["origin"] == "foundry"
    assert activity["recovery_capture"]["narration_status"] == "fallback"
    assert activity["capture_summary"]["model_http_requests"] is None
    stale = get("/api/view", scenario="withheld", clock=1350, audience="analyst")
    assert any(d["recent_age_seconds"] == 132 for d in stale["diagnostics"])
    return {"status": "passed", "url": base, "health_seconds": health_seconds,
            "first_line_view_seconds": view_seconds, "verified_samples": 59,
            "change_m": proof["calculation"]["change_m"],
            "source_hashes": proof["source_hashes"], "model_calls": 0,
            "scope": "HTTP release smoke check; not a scale-zero cold-start or load benchmark"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    args = parser.parse_args()
    print(json.dumps(check(args.url), indent=2))
