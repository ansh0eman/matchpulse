# P7 — local responsiveness and source retention

26 October 2026. Passed local bounded regression checks. Execution authority: the user's instruction to complete the remaining work, followed by the sequential release plan. R1–R4 handoff was checked first: raw 142-pass/one-skip JSON, all 72 saved source fingerprints matching.

## Measured cause and correction

An isolated API on loopback18110 reproduced event-loop blocking: the synchronous cold native-match compilation took2.180s; a health probe100ms after its start took2.075s. Analytical work now runs on one process-lifetime standard-library executor worker. Heavy requests remain serialized to preserve the existing one-large-match memory policy; health/catalog/static work can proceed. No thread-pool concurrency increase, provider calls, new dependency or analytic change.

Studio activity also used the selected-match cache for its small recorded-goal verification, evicting tracking. It now loads that fixed event-only source transiently and independently verifies publication on every request. It does not cache a successful verification or enlarge the tracking cache. Regression tests assert both retention of the selected source object and two real verifier calls for two activity requests.

## Before/after observations

Same machine, separate fresh owned API processes, existing canonical fixture bundle. One declared diagnostic sequence each, not a load/scalability study. Measurements were taken without a competing regression suite. Responses are compared by label, not concurrent completion order.

| Observation | Before | After |
|---|---:|---:|
| Health during cold native compilation |2.0753s |0.0030s |
| Native cold view itself |2.1802s |2.2572s |
| Second line view after Studio activity |0.6579s |0.0376s |
| Third line view after Studio activity |0.6456s |0.0384s |

The first line selection after a different native match still legitimately loads cold:0.6600s before /0.7268s after. Cold computation has not been accelerated. The improvement is responsiveness and avoiding subsequent unnecessary eviction, not a claim that all requests became faster.31/31 canonical JSON response hashes match, including the independently recomputed59-sample proof and three playback packets.

Measured native RSS snapshot:694,608KiB before /694,656KiB after. End snapshots232,144KiB /241,232KiB. These are sampling points, not peak-memory or cloud-memory certification. Multiple heavy clients still queue behind one worker; cancellation does not forcibly terminate a running source computation. The worker is joined by Python's executor exit handling. No managed provider/client or secret is held by it.

## Commands and verification

- Existing Python3.12 SDK environment; owned uvicorn processes3582(before),4574(after). The earlier shared8010 process was not stopped. Static build served from existing `web/dist` in the after process.
- `backend/.venv-foundry/bin/python backend/scripts/measure_viewer_performance.py --url http://127.0.0.1:18110 --pid <owned PID> --output output/product-excellence/p7/<before|after>.json` —31 requests each; zero model calls. Raw results and label-based comparison retained.
- `MATCHPULSE_LIVE_TEST=0 MATCHPULSE_LIVE_WORKFLOW_TEST=0 backend/.venv-foundry/bin/python -m pytest backend/tests/viewer -q` —56 passed,11.52s.
- Same environment with `pytest backend/tests -q` —215 passed /2 intentional live opt-in skips,20.21s. No live calls.
- Node24, `MATCHPULSE_TEST_URL=http://127.0.0.1:18110`, unique JSON/output paths, `npm test --prefix web -- tests/buffer.spec.ts tests/playback-reliability.spec.ts tests/native-showcase.spec.ts tests/sprint-session.spec.ts --reporter=list,json --output=<absolute p7/browser/traces>` —30 passed /0 skipped /0 unexpected /0 flaky,103.947s. Tests cover scoped transitions, source prefixes, goal boundaries, invalid refill recovery and proof/support isolation.
- Python compile checks and `git diff --check` passed. Frontend source was unchanged in P7; the142-pass frontend repair suite remains historical, and this30-case result is a separate focused backend-integration check.

Evidence: `output/product-excellence/p7/{before,after,comparison}.json`, `viewer-tests.log`, `backend-tests.log`, `browser/{raw.log,results.json,traces}`. Original repair failures/evidence and frozen research remain untouched.

Changed application files: viewer/api.py, viewer/service.py. Added measurement script and three meaningful viewer regression tests. No frozen inference, observations, thresholds, lockfiles, cloud resources, commits, pushes or deployment changed. This is local acceptance; human comprehension, scale testing and public deployment acceptance remain distinct.
