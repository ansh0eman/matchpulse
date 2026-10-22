# Executed verification

Run from repository root: `backend/.venv/bin/python backend/scripts/step3a_review.py`. Full literal argv/cwd/status/timings are in artifacts/evaluation.json. The runner does not regenerate the simulator source; generate it first as documented below.

| Command | Exit | Runtime s |
|---|---:|---:|
| pytest | 0 | 3.488 |
| typescript-tests | 0 | 10.231 |
| typecheck | 0 | 0.457 |
| cli-demo | 0 | 1.269 |
| cli-repeat-demo | 0 | 1.235 |
| cli-fresh | 0 | 1.292 |
| cli-repeat-fresh | 0 | 1.278 |
| cli-stale | 0 | 1.329 |
| cli-repeat-stale | 0 | 1.228 |
| cli-goal | 0 | 0.305 |
| cli-repeat-goal | 0 | 0.287 |

........................................................................ [ 69%]
................................                                         [100%]
104 passed in 3.16s

TypeScript:10 passed,0 failed. Typecheck exit0. All actual CLI exports revalidated through Pydantic JSON contracts;5 JSON Schemas exported. External Draft2020-12 meta-validation was attempted via `UV_CACHE_DIR=/tmp/matchpulse-uv-cache uv run --python backend/.venv/bin/python --with jsonschema --no-project python ...`; exit2: PyPI DNS unavailable. No dependency or lockfile changed. This external validation remains unperformed; it is distinct from successful instance validation.

Failures investigated: initial generator command used repository-relative path while cwd was poc; corrected path before first simulator run. Scheduler regression initially expected a second renamed insight for the same incident to emit; new incident dedup correctly rejected it. Test now explicitly checks this rejection AND uses distinct source evidence to retain delayed-time/immutability assertions. No meaningful assertion removed. jsonschema import checks failed because absent; optional installation failed DNS, recorded above.

Original tracking source/config, Step2/2.5 results, research freeze/fingerprints and previous fixtures have zero diff against starting HEAD. No detector retuning, commits, push, merge, provider calls or deployment. No new runtime dependency; inspected new source and exports for credentials and dynamic shell use. New inference imports only canonical/tracking/story code.

Final review additionally found the time-zero left-boundary mismatch in rolling shot aggregation; fixed generation to match the independently recomputed (start,end] window and added a regression assertion. Final full suite104 passed. All CLI, prefix and repeated-output checks reran after this source change.
