# MatchPulse agent card

Purpose: select useful editorial structure and replay plans over a verified incident, with independently checked final output. Models never become the authority for football facts.

Platform boundary: these are app-owned Microsoft Agent Framework executors using Foundry model inference, not named/versioned Foundry Agent Service definitions (read-only audit found zero registered definitions). The original four-check module includes two live tests plus MCP/schema checks, not four model tests. MCP is tested privately in-memory; the live goal uses direct function tools. Cloud trace delivery remains unproven. [Detailed audit](research/step3e/microsoft-foundry-compliance.md).

| Role | Responsibility | Boundary |
|---|---|---|
| Director | Select incident-relevant specialist route and bounded request budget | Unknown routes fail validation; routine moments can bypass enrichment |
| Match Analyst | Resolve registered event claims and evidence | No arbitrary network, files or new factual prose |
| Tactical Analyst | Review eligible positional claims | Observed geometry only; not demonstrated by the recorded goal run |
| Evidence Challenger | Accept, narrow or reject the interpretation | Unsupported causal claims cannot be promoted to facts |
| Narrator | Choose controlled narrative structure | Compiler derives factual numbers/names from approved source |
| Replay Producer | Select a compatible graphic/metric family | Coordinates/metrics are reverified independently |
| Deterministic gate | Recompute narrative, overlay and publication eligibility | Safe branch fallback or refusal; no invented substitute facts |

Implementation: backend/src/matchpulse/agents. Microsoft Agent Framework provides the live graph adapter; the offline harness is explicitly a separate runtime. Shared state is typed and incident-scoped; narration/replay branches run independently. Bounded resolve_claim and resolve_evidence tools enforce match, time, category and allowed references. Optional MCP is private stdio, not a public HTTP service.

Model evidence: an authenticated GPT-4.1 mini deployment in the existing Microsoft Foundry project; four recorded integration checks passed, including one enriched live goal workflow with actual model-requested tools. A separate newly authorized real workflow is now saved with enriched narration and replay and independently reverified against the source: 23.8287 seconds, five agent requests, five successful tool calls and 11,662 input / 807 output reported tokens. The earlier partial goal capture retains fallback narration and enriched replay as a separate recovery example. Both keep their original labels. The UI revalidates the new artifact for its exact Fan/no-favorite preferences; other viewer cards/adaptations compile deterministically. Browsing performs no model calls.

Capture metering limitation: the original transport counter targeted httpx while the installed SDK used httpx2, so actual network request count is unobserved and remains null. Five agent requests are not relabeled as five total model requests. The guard now covers both libraries and is mock-tested to reject the thirteenth request before transport; no second capture was made to repair the past measurement. See research/step3d/foundry-capture.md.

Minimal recorded proof: 4.687 seconds, 878 input / 136 output tokens, one observed request. This is not a p50/p95 latency or cost estimate. Full workflow reliability, model-quality advantage and cloud per-match cost are unmeasured. See EVALUATION.md for the separate offline A/B/C engineering comparison and the pending real-model/human protocol. New live captures require explicit authorization and a finite budget; do not change billing or deploy additional paid resources to refresh these figures.
