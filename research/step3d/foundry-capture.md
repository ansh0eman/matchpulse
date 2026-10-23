# Authorized real Foundry capture

October 24, 2026 India time (start 2026-10-23T19:58:53.451732Z). The user explicitly authorized one existing-deployment workflow capture, with a maximum of 12 model requests and no resource/billing changes. Exactly one capture workflow was executed. No new model deployment, subscription change, API key export or cloud trace collector was created.

## Observed result

- Genuine Foundry provider through the existing Microsoft Agent Framework graph, deployment matchpulse-gpt41-mini.
- Opening-goal source 02840f35-cb05-4812-aa9d-1237e4ab1b9d, independently replayed and verified using the unchanged publication validator.
- **Enriched narration and enriched replay**, saved as structured BroadcastArtifact and WorkflowState, not reconstructed from assertions or edited into success.
- Elapsed workflow time **23.828737125 seconds**; **five agent request attempts** and **five successful evidence-tool calls**.
- SDK-reported usage summed over successful role requests: **11,662 input / 807 output tokens**. No monetary cost or latency percentile is inferred.
- Exact Fan/no-favorite preferences. Other viewer preferences continue deterministic compilation. Goal card and Agent Room reverify the saved artifact before displaying it.

Files: artifacts/foundry-goal.broadcast.json, foundry-goal.state.json, foundry-goal.trace.json and foundry-capture.json. The trace is allowlisted role/event/reason/timing/usage/tool metadata. It contains no prompts, raw provider response bodies, credentials or hidden reasoning. Original full operator outputs remain ignored under backend/output/agents/step3d-authorized-capture. The historical Step 3C narration-fallback capture is preserved independently and remains inspectable in Agent Room.

## Request-limit measurement defect

The initial capture guard intercepted httpx, but the installed azure-ai-projects/OpenAI SDK stack used **httpx2**. It therefore observed zero transport events even though the genuine workflow completed. Zero was **not** exported as “zero model calls”: the reviewed capture metadata records actual model HTTP count as **null**, the original counter observations as zero and the instrumentation defect explicitly. Five agent requests cannot be substituted for total model requests because tool rounds and SDK retries may add network requests. The transport-level maximum cannot be retrospectively attested for this run.

Read-only account metrics were checked, but their generic TotalCalls did not establish the model-request total, so they are not used to manufacture a count. No additional model call or second capture was performed to repair the measurement.

The operator-only runner now guards both httpx and httpx2 transport boundaries, including tool rounds/retries/redirect sends, and mock-transport tests for both libraries prove that a thirteenth matching request is rejected before reaching transport. This repairs the guard for future separately authorized captures; it does not retroactively validate the past count. The user was informed of the defect. The existing production provider and SDK source files are unchanged.

This single success establishes persisted live integration and source-valid presentation. It does not establish model-quality superiority, human editorial value, broad reliability, production latency or cost efficiency. The independent A/B/C report remains an offline FakeProvider engineering comparison.
