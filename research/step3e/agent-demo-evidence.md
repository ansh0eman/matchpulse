# Agent Room: demonstrate the actual recorded work

October 24, 2026. All observations below are taken from preserved files, not reconstructed model thoughts. The primary source is the [successful real trace](../step3d/artifacts/foundry-goal.trace.json), [typed state](../step3d/artifacts/foundry-goal.state.json), [artifact](../step3d/artifacts/foundry-goal.broadcast.json) and [capture metadata](../step3d/artifacts/foundry-capture.json). The viewer must keep source verification and exact preference matching before displaying saved enrichment.

## One incident, distinct contributions

The opening-goal fixture is event-only. Source availability is 2370.5 seconds and scheduled presentation is separate. The default saved artifact is Fan/no favorite. Do not graft tracked player positions from the line-height fixture onto it.

| Recorded role/operation | Request interval, seconds from run start | Contribution visible in saved evidence |
|---|---:|---|
| Director | 0.059632–7.072331 | `score_first`; routes to `match_analyst`; challenge enabled; maximum six logical role calls |
| Match Analyst | 7.072987–13.489923 | Successful structured event analysis and `verified_handoff` |
| Tactical Analyst | No request recorded | Correctly skipped for the event-only goal; only approved positional claims route here |
| Challenger | 13.491570–20.620762 | `narrow`, objection `missing_evidence`, affects the original goal claim |
| Narrator | 20.623035–23.820358 | Successful controlled plan; `challenge_revision: narrowed_to_evidence` at 23.820573 |
| Replay Producer | 20.630368–23.617227 | Successful replay plan independently of the Narrator |
| Publisher | Event at 23.823190 | Independent `artifact_verified`; not a model request |

Durations are differences between recorded role-request events, not total transport counts or token-by-token streaming. Narrator and Replay Producer intervals overlap; the graph stage invokes them with `asyncio.gather`. The full workflow elapsed 23.8287 seconds. There are five role request attempts, five successful evidence-tool rows and SDK-reported 11,662 input / 807 output tokens. Exact HTTP model request count is **unknown** because the original counter missed `httpx2`; do not call this a five-model-call or proven 12-wire-request-bounded capture.

## Show what the Challenger actually did

The saved decision is a narrowing, not acceptance and not a fresh validation of arithmetic. Its `missing_evidence` code records the model's objection; it does not overturn the original independently verified goal claim. `Studio.challenge` validates the review and `Studio.presentation` forces an evidence-first angle/hook. The successful final artifact has no errors and both branches enriched. Label the review as a bounded scope decision. Do not invent a free-form explanation of hidden reasoning.

The state includes one analysis with original claim/evidence references. It does not demonstrate both specialists collaborating over a mixed incident; mixed-role schemas and routing are separately supported but not exercised by this goal capture.

## Show tools without manufacturing attribution

The safe trace retains this ordered list:

1. `resolve_claim` — success, as-of 2370.5s.
2. `resolve_evidence` — success, as-of 2370.5s.
3. `resolve_claim` — success, as-of 2370.5s.
4. `resolve_evidence` — success, as-of 2370.5s.
5. `resolve_evidence` — success, as-of 2370.5s.

The compact export does not preserve each row's exact arguments, result body, invocation timestamp or role correlation. An inspector may show this list plus the enforced match/clock boundary; it cannot assign rows to agents by guesswork or fabricate their exact source IDs. The underlying typed state and artifact show selected claim references separately. `EvidenceTools` checks namespace, observation time, verified claims, eight-call/default result budgets and the closed function allowlist. It accepts no model-supplied file path or URL.

## A separate, real recovery example

The [historical partial goal artifact](../step3c/artifacts/recorded-goal-partial.broadcast.json) retains `origin: foundry`, `narration_status: fallback`, `overlay_status: enriched`, error `narrator:grounding_failed`. The [historical trace](../step3c/artifacts/recorded-foundry-trace.json) shows the Narrator request succeeded at the provider boundary; its plan was rejected during final deterministic compilation. The verified replay remained available. This is a useful resilience case precisely because successful model transport did not bypass publication safeguards.

Show it under a clearly separate “Historical recovery” control. Do not blend its durations, tools or states into the successful capture. Do not label it an injected failure, a timeout, or the latest capture. Offline injected-fault tests and the real saved recovery are different evidence.

## Recommended judge-facing sequence

1. Start with the verified goal, then open Agent Room: “Recorded Foundry run; replay makes no new model calls.”
2. Follow the actual Director route. Explain the Tactical Analyst's skip as scope control.
3. Open the Challenger decision: `narrow`, then the recorded evidence-first revision.
4. Compare the overlapping narration/replay intervals and successful independent outcomes.
5. Inspect the real tool list and match/clock restrictions.
6. Open historical recovery: rejected narration plan, verified replay preserved.
7. Finish at deterministic publication verification; a second model is not the source of truth.

Keep technical labels and elapsed time subordinate to these operator-facing questions: What ran? What did it contribute? What was refused? Why could the result be safely displayed? The benefit is purposeful selection and independent recovery; human usefulness or superiority over a single agent has not been measured.

## Trace the exact implementation

`Studio.run` validates an original scheduled incident and preferences, binds `EvidenceTools`, creates `WorkflowState`, and dispatches the real SDK runtime. `framework.run_graph` connects typed stages. `Studio.direct` validates model routing; `specialists` validates selected IDs; `challenge` validates the bounded review; `presentation` executes independent controlled plans; `publish` recompiles numbers/text/geometry and verifies source claims. `verify_publication` rechecks the serialized result before the viewer trusts it.

Primary code: [workflow.py](../../backend/src/matchpulse/agents/workflow.py), [framework.py](../../backend/src/matchpulse/agents/framework.py), [provider.py](../../backend/src/matchpulse/agents/provider.py), [tools.py](../../backend/src/matchpulse/agents/tools.py), [grounding.py](../../backend/src/matchpulse/agents/grounding.py), [publication.py](../../backend/src/matchpulse/agents/publication.py), [viewer service](../../backend/src/matchpulse/viewer/service.py).

Fresh audit checks: the SDK/FakeProvider graph, MCP in-memory and schema tests passed (3 passed, 2 live tests intentionally skipped); `viewer.service.activity()` reverified the saved enriched artifact. No new paid inference was performed. See [complete platform audit](microsoft-foundry-compliance.md) for local role definitions versus service-managed Foundry agents, MCP and cloud-tracing boundaries.
