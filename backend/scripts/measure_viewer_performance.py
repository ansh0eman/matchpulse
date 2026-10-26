"""Measure an owned loopback viewer without model calls or regenerated fixtures.

Run against separate fresh processes before/after a change. Each sequence also
contains repeated warm requests. Response hashes establish an equality oracle,
not an accuracy or scalability claim.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import subprocess
import time
from urllib.parse import urlencode, urlparse
from urllib.request import urlopen


def measure(base, pid=None):
    parsed = urlparse(base)
    if parsed.scheme != "http" or parsed.hostname not in {"127.0.0.1", "localhost"}:
        raise ValueError("Performance measurement requires an owned loopback API")
    rows = []

    def request(label, path, **params):
        started = time.perf_counter()
        url = base.rstrip("/") + path + ("?" + urlencode(params) if params else "")
        with urlopen(url, timeout=120) as response:
            payload = response.read()
            status = response.status
        value = json.loads(payload)
        rows.append({
            "label": label, "path": path, "params": params, "status": status,
            "seconds": time.perf_counter() - started, "bytes": len(payload),
            "response_sha256": hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest(),
        })
        return value

    def memory():
        if not pid:
            return None
        value = subprocess.check_output(["ps", "-o", "rss=", "-p", str(pid)], text=True).strip()
        return int(value) if value else None

    rss = [{"label": "start", "rss_kib": memory()}]
    request("health_before", "/api/health")
    for scenario, clock in [("line-shift", 3360), ("opening-goal", 2371), ("open-play", 356), ("equalizer", 4242), ("withheld", 1350)]:
        for repeat in range(3):
            view = request(f"{scenario}_view_{repeat}", "/api/view", scenario=scenario, clock=clock, audience="fan")
            assert view["clock"] == clock
            assert all(s["presented_seconds"] <= clock for s in view["timeline"])
        if scenario == "line-shift":
            story = next(s for s in view["timeline"] if s["type"] == "observed_line_height_change")
            proof = request("line_proof", "/api/proof", scenario=scenario, clock=clock, audience="fan", claim_id=story["claim_ids"][0])
            assert proof["verified"] and len(proof["samples"]) == 59
            assert abs(proof["calculation"]["change_m"] - 10.01258807588076) < 1e-10
        rss.append({"label": scenario, "rss_kib": memory()})

    # Cold native load on a background client; health responsiveness is separate
    # from the heavy request's duration. This is a single-user diagnostic only.
    with ThreadPoolExecutor(max_workers=2) as clients:
        work = clients.submit(request, "native_cold", "/api/view", scenario="native-goals", clock=1611, audience="fan")
        time.sleep(0.1)  # Declared probe offset, not a readiness assertion.
        request("health_during_native_load", "/api/health")
        work.result()
    for repeat in range(3):
        request(f"native_warm_{repeat}", "/api/view", scenario="native-goals", clock=1611, audience="fan")
    rss.append({"label": "native", "rss_kib": memory()})

    for repeat in range(3):
        request(f"activity_{repeat}", "/api/activity")
        request(f"line_after_activity_{repeat}", "/api/view", scenario="line-shift", clock=3360, audience="fan")
    for repeat in range(3):
        packet = request(f"line_playback_{repeat}", "/api/playback", scenario="line-shift", clock=3360 + repeat * 8, audience="fan", window_seconds=16)
        assert packet["start"] == 3360 + repeat * 8
    rss.append({"label": "end", "rss_kib": memory()})
    return {"scope": "Owned loopback, one diagnostic sequence; not a load or deployment benchmark", "health_probe_offset_seconds": 0.1, "requests": rows, "memory": rss, "model_calls": 0}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", required=True)
    parser.add_argument("--pid", type=int)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = measure(args.url, args.pid)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"output": str(args.output), "requests": len(result["requests"]), "model_calls": 0}))
