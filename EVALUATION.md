# Agent evaluation

The engineering question is whether adaptive routing adds useful evidence selection or independent recovery without compromising the deterministic baseline. A larger graph is not itself a benefit.

## Pre-registered scope — October 24, 2026

Reuse all 22 existing Step 3A review episodes, without changing that packet or its human ratings. The evaluation-only review key resolves original match/claim identities; it is never passed into inference or models. Run Fan and Analyst preferences through A (deterministic fallback), B (simple specialist → narrator) and C (adaptive studio) using the same source and publication verifier. Respect scheduler/audience suppression rather than resurrecting ineligible episodes.

Packet inspection corrected initial harness assumptions before any comparison completed: the existing packet contains **19 keyed claim episodes and three controls without registered claim identities**. The review key has 20 entries because one stale control has a match identity but deliberately no claim; two further controls (normal interval and borderline measurement) are unkeyed. Keep all three controls in the denominator and report them separately as not published/no provider request. They are not fabricated into supported claim envelopes. The unchanged packet remains a human-review asset; this accounting is not a new quality rating for those controls.

The new local comparison uses the existing FakeProvider and offline workflow harness. It tests request counts, verified publication, tool validity and injected recovery. It **does not** measure Microsoft Agent Framework execution, real-model usefulness, language quality, cloud latency, tokens or cost. Those fields remain null. Do not reuse mock timings as production telemetry.

Engineering gates: all supported published outputs must independently verify; cross-match/future requests must remain rejected by the existing adversarial suite; deterministic A must use zero provider requests. Inject narrator timeout/malformed output, invalid replay plan, analyst invalid claim and Challenger objection against B/C where applicable. Record each branch's resulting status and actual request attempts.

## Real-model and human comparison — pending

Before a separately authorized live experiment, fix the source cases, deployed model and maximum budget. Report all calls/tokens/latency and failures for B/C. Have a human blindly rate usefulness and evidence relevance; leave missing ratings missing. The proposed decision thresholds from the product brief are C +0.5/5 usefulness over A and +0.3/5 over B, or a measured recovery/evidence-selection benefit, with 2× B cost as a review threshold. These are proposed product decisions, not official hackathon requirements or achieved results. If no useful benefit is demonstrated, simplify the implementation and claims.

## Reproduce offline engineering evidence

```sh
backend/.venv-foundry/bin/python backend/scripts/step3d_evaluate.py
```

The script writes the compact result under research/step3d/artifacts/offline-comparison.json. It makes no network/model calls and does not alter frozen experiments, the review packet, existing Step 3B evidence or its live integration results. Read the generated summary with its denominators; suppressed cases are reported separately from successes.

## Observed offline result

Each configuration considers 44 episode/audience combinations. Twenty-six are published and independently verified; twelve are scheduler/audience-suppressed and six are the three claim-less review controls across two audiences. None of the suppressed/control rows consumes a provider request.

| Configuration | Verified publications | Scripted provider requests | Mean requests per publication |
|---|---:|---:|---:|
| A — deterministic | 26/26 supported outputs | 0 | 0 |
| B — simple | 26/26 | 52 | 2 |
| C — adaptive | 26/26 | 94 | 3.615 |

C bypasses enrichment for four eligible routine moments. Across ten fault configurations, eight actually invoke the injected faulty role; two simple-path configurations never request that role. All ten final artifacts verify. These observations demonstrate finite routing/recovery behavior, not better language or real-model evidence selection. The adaptive graph uses more scripted requests overall; real token/cost efficiency and human preference remain unmeasured.
