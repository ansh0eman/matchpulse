# BroadcastArtifact v2 for Step3C

Contract: artifacts/BroadcastArtifact.schema.json. Each artifact contains match/insight IDs, original observation/source/availability/presentation match clocks, preferences, approved claim IDs, controlled explanation category/angle, compiled headline/sentences with per-sentence claim IDs, limitations, VerifiedOverlay, exact event/frame references, trace ID, origin and independent narration/overlay statuses.

origin is foundry/offline_fake/deterministic. Show a visible fake-provider demo label for offline_fake. If narration falls back but overlay is valid, show the safe headline and retain that overlay; if visual output fails, preserve narration/evidence access. Do not turn errors or arbitrary model strings into public factual content.

Overlay contains a validated family/emphasis, source refs, replay bounds, source-derived numeric metrics with units and ball coordinates. Tracking comparison resolves referenced observed frames; interpolation is a visual effect only. Do not infer pass endpoints, player trajectories or coach formations. Agent-selected emphasis can control which verified components to foreground, never their values.

These are offline replay match-clock fields. Wall-clock request latency is in traces; no live streaming scheduler/service latency has been implemented. React must not assume that the source clock already accounts for future live network delays. No hosting/API has been deployed.

Recommended next local API: administrator loads a source/replay once; authorized POST /broadcast accepts match/insight ID and Preferences, not caller-supplied claims/facts; POST /ask accepts AskRequest; read-only evidence endpoint enforces server match/time capabilities. Cache only within a source-hash/clock/preference namespace. Do not expose an unauthenticated inference/MCP endpoint. Keep credentials and analytical authority in Python.

Step3C should first render deterministic/fake artifacts with explicit status, scoreline, timeline, evidence inspector and sourced replay overlays. Switch on real-provider status only after minimal Foundry proof, full SDK/tool integration and endpoint authentication have actually passed.


SDK validation update: actual framework graph/FakeProvider, private MCP in-memory and external schema checks now pass (159 passed,2 live tests skipped overall). Existing broadcast/trace fixtures remain their original offline artifacts. The next local UI slice is the0–0 fan timeline with a pitch and Proof Lens drawer, followed by separate goal/position fixture views; live model branding remains gated on authenticated inference.


Live integration update: minimal authenticated proof and a complete goal workflow/tool gate now pass (4 live-module tests). Preserve origin per displayed artifact: existing repository demo fixtures are still offline_fake/deterministic; saved coordination workflow captures are historical partial/fallback Foundry runs. The fully enriched live test did not save its BroadcastArtifact. Show cached genuine proof metadata separately from the current card's provenance, and never synthesize a successful live capture from test assertions. Step3C's exact file plan and source recomputation routes are in step3c-implementation-plan.md.
