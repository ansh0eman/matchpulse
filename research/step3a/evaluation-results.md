# Actual Step3A exploratory results

Four source-selected examples; not a held-out accuracy benchmark. Demo seed was fixed before generation. Existing research examples are already consumed and only used for engineering checks.

| Case | Candidates / verified | Timeline | Suppressed | Goals source/emitted | Shots / narrated incidents | Runtime s | Incremental traced peak MiB |
|---|---:|---:|---:|---:|---:|---:|---:|
| demo | 147 / 147 | 63 | 84 | 0/0 | 12/12 | 1.260 | 1.48 |
| fresh | 171 / 171 | 76 | 95 | 0/0 | 22/22 | 1.478 | 2.04 |
| stale | 136 / 136 | 69 | 68 | 1/1 | 17/17 | 1.282 | 1.44 |
| goal | 210 / 210 | 86 | 124 | 1/1 | 22/22 | 0.111 | 1.54 |

Registry facts reverified: 664/664. Missing/dangling references0; duplicate insight IDs0. Exact-byte repeated CLI exports agree4/4. Three clipped event/tracking prefixes per match agree with full replay; one reaches3400s and includes the3360s positional claim. This establishes finite causal regression checks, not universal proof. All73 observed shot incidents are narrated via attempt or richer sequence; raw routine-shot cards intentionally have lower coverage. All2 valid observed goals emitted; 2/2 is tiny engineering coverage, not estimated population performance.

Candidate availability is immediate at sufficient evidence, excluding actual measurement lookback and positional decision cadence. Scheduler delay max4s in all four examples. Delayed cards retain original source/as-of times. Positional decision availability is not hidden-intervention detection latency.

Runtime uses tracemalloc-enabled replay, excluding preloaded event/frame parsing; incremental traced memory excludes input objects and total process RSS. Full CLI timings are separately recorded in artifacts/evaluation.json. No throughput/service-load or bounded total-RAM claim is made. State shot deque max 6 in examples; source indexes and exports grow linearly.

Suppression counts and reason denominators:
- demo: {'editorial_cooldown': 65, 'incident_already_narrated': 19}; 83 cumulative-clock minute bins contain no priority>=70 emitted item.
- fresh: {'editorial_cooldown': 62, 'incident_already_narrated': 33}; 79 cumulative-clock minute bins contain no priority>=70 emitted item.
- stale: {"['stale_recent_evidence', 'insufficient_recent_time_coverage']": 1, 'editorial_cooldown': 47, 'incident_already_narrated': 20}; 87 cumulative-clock minute bins contain no priority>=70 emitted item.
- goal: {'editorial_cooldown': 94, 'incident_already_narrated': 30}; 81 cumulative-clock minute bins contain no priority>=70 emitted item.

Goal context, raw events, measured positioning and editorial choices have different validation standards. No classification precision from self-generated thresholds; no improved tactical accuracy claim.
