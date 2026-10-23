# Step3B validation and historical offline evaluation

**Latest live integration evidence:**4 passed in29.87s with both live flags explicitly1. This includes minimal authenticated grounding and a complete Foundry/MAF goal workflow with enriched narration/overlay and actual model-requested evidence tools. Minimal standalone proof:4.687s,878 input/136 output tokens. Separate post-provider-repair local regression:159 passed/2 intentionally skipped live gates. Evidence is in artifacts/live-foundry-validation.json. No paid call or suite was rerun for this documentation update.

The preserved offline comparison below remains a fake-provider engineering comparison; it is NOT a real-model baseline quality or cost benchmark.

Latest isolated SDK validation: **159 passed,2 skipped in29.19s**; only the two explicitly disabled live Foundry tests skipped. Real framework graph execution with FakeProvider, MCP in-memory integration and external schema meta-validation now pass. No provider calls occurred. Evidence: artifacts/sdk-integration-validation.json. The full suite was not rerun during this documentation-only update.

The following measurements are the preserved EARLIER offline comparison, not newly generated SDK/model results.

**No real Foundry/model comparison was possible.** All provider responses below are scripted FakeProvider test artifacts. Authoritative facts came from actual canonical match replays. This is an engineering comparison, not an LLM quality or hackathon-prize result.

| Configuration | Published examples | Grounded acceptance | Application requests | Narration fallbacks | p50 ms | p95 ms |
|---|---:|---:|---:|---:|---:|---:|
| adaptive | 11 | 11 | 38 | 3 | 0.826 | 119.069 |
| fallback | 11 | 11 | 0 | 11 | 0.178 | 77.453 |
| simple | 11 | 11 | 22 | 0 | 0.577 | 489.662 |

A uses the unchanged Step3A deterministic wording; B selects the appropriate analyst then narrator with deterministic visual fallback; C adds Director, selective Challenger and parallel visual planning, while bypassing routine cases. The same audience policy and real source candidate pool apply to all configurations. Each publishes11 of12 audience/case combinations; the fan standalone regain is suppressed in every configuration.

Six actual source cases x two audiences x three configurations =36 records including policy suppressions;10 explicit recovery records bring the total to46. Cases: opening goal, equalizer, standalone gain, gain-to-shot, routine shot and approved position. All33 published baseline/adaptive outputs pass deterministic publication verification;36 is not the denominator because three policy suppressions are not published. All10 recovery cases produce safe output; independent narration/visual statuses are recorded. Additional checks reject wrong evidence before provider use, decline unsupported questions, keep incomplete prefix safe, and prevent stale positional stories.

Request totals are scripted application invocations, not actual model calls or tokens. Tokens, price, cloud latency, independent human ratings, Foundry groundedness/tool-correctness evaluator scores and semantic-quality superiority are unknown/null. Adaptive uses38 requests versus22 for the simple baseline in these examples; do NOT claim an overall cost benefit. Three adaptive narration fallbacks are routine bypasses, not unexplained failures.

Latency is local fake-provider plus deterministic recomputation, single run per example, fixed A/B/C order. Cache/warm-up and positional verification dominate outliers; p95 is descriptive nearest-rank over11 items and is not a fair production latency estimate. No cloud/network/load performance is established. The value observed is selective routing, audited compilation, branch isolation and explicit recovery, not better natural-language reasoning.

Editorial policy on the SAME honest0–0: fan63→18, analyst63→63;45 repetitive standalone gains hidden only for fan. No facts/research outputs removed. This improvement is policy-driven, not attributed to a model. Existing22-episode human packet remains unrated; developer inspection cannot be called independent blind human review.

Historical initial environment:156 passed,5 skipped; TypeScript10 passed; typecheck exit0. Required original story review executed successfully; historical Step3A artifacts preserved, new outcomes in story-review-rerun.json. Skips: external JSON Schema validator, private MCP SDK, SDK graph, minimal live Foundry proof, full live workflow/tool integration. No tests call a real provider without explicit live opt-in.

| Recorded command | Exit | Seconds |
|---|---:|---:|
| story-review | 0 | 29.619 |
| cli-goal | 0 | 0.214 |
| cli-position | 0 | 0.868 |
| cli-proof-blocked | 2 | 0.202 |

cli-proof-blocked exit2 is the EXPECTED unavailable-configuration outcome, not a successful model call. Exact argv are in evaluation.json; underlying full-suite/TypeScript/real-story commands and statuses are in story-review-rerun.json.

Dependency installation was attempted with `UV_CACHE_DIR=/tmp/matchpulse-step3b-uv uv pip install --python backend/.venv/bin/python --dry-run agent-framework-core agent-framework-foundry jsonschema`; resolver failed on PyPI DNS. An initial `uv pip index` probe also failed because this installed uv has no index subcommand; corrected to the documented dry-run resolution command. No environment or lockfile was mutated. No meaningful failing assertions were removed.

Original stories/tracking sources, backend/config, backend/uv.lock and research/step25/step3a have zero diff against starting HEAD. New source/input SHA256 values are persisted in evaluation.json.

Five additional actual CLI demonstrations also exited0: fan timeline, analyst timeline, bounded before-goal question, narrator-timeout recovery and SOUTH preference. Exact argv/status/runtime are in artifacts/cli-checks.json. New retained-evidence tactical tests explicitly exercise Tactical Analyst invocation, Challenger narrowing and unavailable-specialist fallback. At that historical run the dependency/SDK/live gates were skipped, not passed. Its evidence remains in artifacts/final-checks.json. The newer SDK validation supersedes only the three resolved dependency skips; both live gates remain skipped.
