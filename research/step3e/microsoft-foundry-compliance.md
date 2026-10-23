# Microsoft Foundry: implementation and evidence audit

Inspected October 24, 2026 against baseline `b9862d7` and the actual source. This audit made no model-inference call, registered no agent and created no Azure resource. All findings concern the inspected project and repository, not every subscription or account.

## 1. Genuine Foundry model inference: supported

`FoundryProvider.complete` in [provider.py](../../backend/src/matchpulse/agents/provider.py) (lines 59–96 at the baseline) opens an async `AzureCliCredential`, then an `AIProjectClient` for the configured project. It constructs `FoundryChatClient(project_client=project, model=config.model)`, passes it to an application-owned `Agent`, and calls `Agent.run` with a strict role schema. Credential, project client and agent close through their async context managers. Every request gets a fresh agent/client and no cross-match conversation memory. Authentication/provider errors become bounded error codes; raw response bodies, credentials and prompts are not exported.

This matches Microsoft's documented [Foundry model-provider pattern](https://learn.microsoft.com/en-us/agent-framework/integrations/by-component/model-providers/microsoft-foundry): `Agent(client=FoundryChatClient(...))` uses a project model through the Responses endpoint while code owns the instructions and tools. It differs from the server-managed `FoundryAgent` pattern.

Existing live evidence:

- [Minimal authenticated proof](../step3b/artifacts/foundry-authenticated-proof.json) and [integration record](../step3b/artifacts/live-foundry-validation.json): authenticated structured grounding and a complete goal workflow passed in the original opted-in run. Four tests in that module passed; two are live tests, while private MCP and schema validation are separate checks. It is inaccurate to call all four authenticated model tests.
- [Persisted Step 3D capture](../step3d/artifacts/foundry-capture.json): existing `matchpulse-gpt41-mini` deployment, genuine origin, enriched narration and replay, five agent request attempts, five successful evidence-tool calls, 23.8287 seconds, SDK-reported 11,662 input / 807 output tokens. No cost, broad reliability or production latency conclusion follows.
- [Artifact](../step3d/artifacts/foundry-goal.broadcast.json), [typed state](../step3d/artifacts/foundry-goal.state.json) and [safe trace](../step3d/artifacts/foundry-goal.trace.json) are preserved. `viewer.service.activity()` freshly passed source-publication verification during this audit. Viewer browsing does not invoke the model.

The original capture's HTTP meter missed the installed SDK's `httpx2` transport. Actual model HTTP request total is **unknown**, not zero or five. Compliance with its requested 12-wire-request cap cannot be retrospectively established. The repaired guard is mock-tested for both transports; no repeat capture was made. See [full disclosure](../step3d/foundry-capture.md).

## 2. Actual Microsoft Agent Framework execution: supported

[`framework.run_graph`](../../backend/src/matchpulse/agents/framework.py), lines 6–36, imports real `Executor`, `WorkflowBuilder`, `WorkflowContext` and `handler`. Typed `Stage.process` calls a `Studio` operation and sends the resulting `WorkflowState`; `Publisher.process` yields the verified `BroadcastArtifact`.

```text
director → conditional_specialists → conditional_challenger
         → parallel_narration_and_replay → verified_publisher
```

The graph has five executors. The six logical role contracts are **not** six separate graph nodes or six service-managed deployments. Relevant model work happens inside those typed stage operations. Specialist and presentation concurrency use `asyncio.gather` within stages. The SDK graph is built and executed with `graph.run(state)`; the adapter requires one typed output.

`Studio.run(..., runtime="framework")` selects this path. `runtime="offline"` deliberately uses another harness and is not described as MAF execution. Microsoft's [workflow documentation](https://learn.microsoft.com/en-us/agent-framework/concepts/workflows/builder-and-execution?pivots=programming-language-python) explains the executor/edge/message model used here; our installed SDK version and passing integration evidence remain authoritative over changes to latest documentation.

The exact live test is [`test_real_foundry_framework_and_tool_use`](../../backend/tests/agents/test_optional_integrations.py), lines 43–57. It asserts `origin == "foundry"`, enriched narration/replay and successful `resolve_claim`/`resolve_evidence`. It requires its separate live opt-in. The saved capture trace also records `runtime: microsoft_agent_framework`.

## 3. Model roles, deterministic work and bypasses

| Logical operation | Implementation | Inspected successful goal |
|---|---|---|
| Director | Model selects a permitted route/angle; `validate_director` enforces it | Requested; selects Match Analyst, required challenge, six-call logical budget |
| Match Analyst | Model selects registered event claims/evidence; code validates | Requested; verified handoff |
| Tactical Analyst | Model selects approved positional claims only | Not routed for this event-only goal; no live tactical success claimed |
| Challenger | Model selects accept/narrow/fallback; code enforces scope | Requested; `narrow`, objection `missing_evidence` |
| Narrator | Model chooses controlled IDs/angle/hook/depth/qualification | Requested; narrowed to evidence-first; narration enriched |
| Replay Producer | Model chooses approved metric/graphic family | Requested concurrently with Narrator; replay enriched |
| Publication | Source revalidation and deterministic narrative/overlay compilation | No model request; artifact verified |
| Routine/fallback path | Scheduler/audience checks and deterministic compilation | Supported separately; no request for a bypassed incident |

`policy.expensive`, `policy.eligible`, `Studio.run`, `Studio.challenge` and `Studio.presentation` determine bypasses. The simple comparison omits a model Director/Challenger and model replay branch; fallback uses no model. Do not confuse these offline comparison modes with the saved adaptive live run. `Requests` limits logical calls, application retries and elapsed time; those counters do not measure every SDK transport request or prove billed-request limits.

## 4. Model-requested evidence tools and enforcement

[`EvidenceTools`](../../backend/src/matchpulse/agents/tools.py) exposes only `resolve_claim`, `resolve_evidence` and `get_match_context`. `sdk_functions` supplies local Python callables to the model on Match Analyst, Tactical Analyst and Challenger requests. The model can request a function; code executes and validates it locally. These are genuine model-requested tools in the saved run, not public network endpoints.

Capabilities bind to one match and an evidence clock. Claims are independently verified, future observations are refused, category/source IDs are looked up only in canonical indexes, arbitrary tool names/paths/URLs are rejected, context is capped at eight claims, results at 32,768 bytes, and an incident defaults to eight tool invocations. A historical context request may use an earlier permitted clock; it cannot advance beyond the incident capability.

The safe capture retains two successful `resolve_claim` and three `resolve_evidence` rows, all at 2370.5 seconds. These compact rows omit per-call role attribution, raw arguments and result bodies. Do not infer which role made each row or fabricate an event/frame ID for it. The typed state supplies the selected claim/evidence scope; it is a distinct evidence source from transport-level logs.

## 5. Coordination, challenge, concurrent outcomes and recovery

[`WorkflowState`](../../backend/src/matchpulse/agents/schemas.py), lines 107–117, carries the verified envelope, preferences, Director decision, specialist analyses, Challenger decision, narration/overlay plans and bounded errors. `Studio` stages return validated copies of that state. A model cannot introduce a new match or arbitrary source authority.

`Studio.challenge` validates one review. `narrow` changes narrative angle/hook to evidence-first; it does not create a new model conversation or validate arithmetic by consensus. `fallback` or invalid challenge blocks the Narrator branch. `Studio.presentation` runs Narrator and Replay Producer independently; failure in one need not discard the other.

`Studio.publish` derives factual text and coordinates through compilers, verifies source claims, and records `artifact_verified`. [`verify_publication`](../../backend/src/matchpulse/agents/publication.py) recomputes narration/overlay and checks identities, clocks, preferences and claims before a saved result is displayed. The historical genuine goal retains `narration_status: fallback`, `overlay_status: enriched`, `narrator:grounding_failed`. That is evidence of compiler rejection/recovery even though the Narrator request itself succeeded. It must not be relabeled as a network outage.

## 6. Foundry Agent Service registration/versioning: absent in inspected project

The repository creates local `Agent(name=role, ...)` instances, not `FoundryAgent`, `AgentReference` or `agents.create_version` definitions. A read-only authenticated `AIProjectClient.agents.list(limit=100)` completed during this audit: **zero definitions returned**, not truncated. No registration or inference operation was issued.

Microsoft distinguishes [application-owned model inference from named/versioned Agent Service definitions](https://learn.microsoft.com/en-us/agent-framework/integrations/by-component/agent-services/foundry). The current Git revision versions our local role instructions/contracts; this is not a Foundry-hosted agent version. Submission copy should say “Microsoft Agent Framework workflow using Foundry model inference.”

## 7. MCP: actual private integration; not the live tool transport

[`mcp_server.main`](../../backend/src/matchpulse/agents/mcp_server.py) defines a real private stdio MCP server over the same scoped callables. [`test_private_mcp_in_memory`](../../backend/tests/agents/test_optional_integrations.py), lines 13–28, uses actual MCP client/server APIs and resolves a claim. It freshly passed. A subprocess/stdio round trip and a Foundry-hosted MCP connection are **not** established by that in-memory test. The saved Foundry run uses direct local function tools; there is no evidence it used MCP. No public MCP listener ships in the viewer.

## 8. Tracing: local evidence; no cloud collector delivery

[`Trace.record`, `Trace.export`, `Trace.otlp`](../../backend/src/matchpulse/agents/telemetry.py) preserve allowlisted timing/event/usage metadata. `Trace.span` optionally creates OTel spans if the library is available. An OTLP-shaped file and SDK spans do not establish delivery; the capture explicitly records `cloud_trace_delivery: false`.

Microsoft's [Foundry tracing setup](https://learn.microsoft.com/en-us/azure/foundry/observability/how-to/trace-agent-setup) requires connected Application Insights for portal storage and notes its billing/retention dependency. No such delivery is claimed here. A [local Foundry Toolkit collector](https://learn.microsoft.com/en-us/azure/foundry/how-to/develop/vs-code-tracing) can receive exported spans without Application Insights, but it does not instrument automatically and model runs can still cost money. Existing JSON/OTLP files cannot retroactively become a newly observed cloud trace.

## 9. Official category fit and limits

[Official rules, sections 4.1, 4.2 and 6](https://github.com/microsoft/insidethegamehackathon/blob/main/OFFICIAL%20RULES.md) require a viable five-stage synthetic-football product and assess five equally weighted dimensions. Best Multi-Agent values distinct responsibilities, shared state/handoffs, recovery and a useful complete outcome. Best Use of Foundry values effective development/orchestration/management and useful platform leverage. The rules do not prescribe a particular number of registered prompt agents or require every hero technology. This is a reading of the published wording, not organizer approval or a prediction of scores.

MatchPulse has real Foundry/MAF evidence and independent publication checks. Broader usefulness over a single-agent baseline, real-model A/B/C quality/cost, cloud telemetry and live tactical-role reliability remain unmeasured. The interactive viewer progressively replays canonical sources and revalidates saved plans; it is not a newly inferred model stream per click or a demonstrated production ingestion service.

## 10. Most useful zero-cost improvement

**Implement presentation of the existing evidence:** show the skipped Tactical Analyst with the route reason, actual Challenger `narrow` decision, independent branch intervals and compiler recovery. This strengthens the demonstrated handoffs without another model call, Azure service or changed verification boundary.

**Defer service-managed migration.** Microsoft's [prompt-agent sample](https://github.com/microsoft/agent-framework/blob/main/python/samples/02-agents/providers/foundry/foundry_prompt_agents.py) separates converting/publishing a definition (`to_prompt_agent`, `agents.create_version`) from invoking it. Metadata registration alone would not prove runtime correctness, preserve the currently tested dynamic tool/structured-output path, establish zero cost or improve the saved run. The converter is marked experimental in that source. No definitions were created merely for a logo; no new inference is authorized.

**Optional later development:** a local redacted OTel collector and non-sensitive instruction/schema fingerprints can aid reproducibility, but must be tested offline and labeled correctly. Do not add Application Insights, search, storage, code interpreter or remote MCP without a concrete product need and verified financial scope.

## Checks performed in this audit

```sh
MATCHPULSE_LIVE_TEST=0 MATCHPULSE_LIVE_WORKFLOW_TEST=0 \
  backend/.venv-foundry/bin/python -m pytest \
  backend/tests/agents/test_optional_integrations.py \
  backend/tests/agents/test_studio.py::test_framework_runtime_separate -q
```

Result: **3 passed, 2 deliberately skipped live tests, 0.63 seconds**. This rechecks real SDK graph construction/execution with FakeProvider, MCP in-memory and external schema validation; it is not another authenticated model test. A separate direct `viewer.service.activity()` call independently reverified the stored enriched artifact. No frozen agents, provider code, experiments, claims, saved captures or dependency locks changed for this audit.
