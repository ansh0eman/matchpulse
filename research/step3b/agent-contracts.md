# Controlled v2 handoffs

Source agents/schemas.py; JSON Schemas in artifacts/. Original Step3A AgentInput/AgentOutput remain v1. WorkflowState v2 carries the original verified envelope, preferences, correlation ID, DirectorDecision, analyses, challenge, narration/overlay plans and bounded error history. It is immutable; code creates replacement states rather than updating facts. Model JSON never deserializes executable objects.

| Role | Input / output | Tools | Failure and reason to exist |
|---|---|---|---|
| Director | Verified envelope/preferences -> DirectorDecision | none | Deterministic route fallback. Chooses angle, optional review and bounded budget. Cannot disable required tactical/high-importance review. |
| Match Analyst | Incident and route -> Analysis | three read-only resolvers | Skip failed analysis; narrator still has verified facts. Handles event significance/sequence context. |
| Tactical Analyst | Approved line incident -> Analysis | same scoped resolvers | Skip; no substitute invented position. Distinguishes sampled line proxy from pressure/intent. |
| Challenger | Approved analysis -> Challenge | same scoped resolvers | Failed review forces safe narration. Narrow changes structure; fallback skips narrator. It is not factual authority. |
| Narrator | Approved facts/analysis/preferences -> NarrationPlan | none | Independent deterministic narration fallback. Chooses angle, hook and audience depth within audited grammar. |
| Replay Producer | Approved facts/analysis -> OverlayPlan | none | Independent source-derived overlay fallback. Chooses a visual family/emphasis; never supplies coordinates/numbers. |

No output has a field for arbitrary factual prose, score, distance or invented player. Claim IDs must be unique, approved and in the same incident. Analysts may request only selected-claim references. Additional historical facts can be inspected but cannot be promoted into this release's broadcast selection. No model can elevate suppressed positional packs.

BroadcastArtifact includes source/available/presentation clocks, audience/team preference, approved claims, compiled narration, source-derived overlay, exact evidence, correlation, provider origin and independent narration/overlay status. `offline_fake`, `foundry` and `deterministic` are distinct. Actual response syntax/provider compatibility still requires live validation.
