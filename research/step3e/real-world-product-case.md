# From a match explanation to an editorial evidence receipt

MatchPulse is a prototype for a broadcast operator who must decide which explanation is safe to put beside a match. A viewer sees a concise story; an analyst can inspect the original events or positions behind it. The distinguishing behavior is independently recomputed evidence, not a claim that an AI can infer a manager's intent.

## A concrete operator workflow

1. A synthetic canonical source becomes verified, namespaced claims through `agents.cli.load_source`, `stories.replay.replay` and `ClaimRegistry.register`.
2. A studio selects an editorial plan over those approved IDs. `compile_narration` and `compile_overlay` recompute factual content; `verify_publication` checks the final artifact. Invalid branches fall back independently instead of turning a model guess into a fact.
3. An operator consumes `BroadcastArtifact` v2: match/insight identity, `source_seconds`, `available_seconds`, `presented_seconds`, preferences, claim IDs, origin, branch status and evidence references. Its `VerifiedOverlay` carries a replay window, verified metrics and original source coordinates. These are defined in [schemas.py](../../backend/src/matchpulse/agents/schemas.py); [overlay_compiler.py](../../backend/src/matchpulse/agents/overlay_compiler.py) is the authority for their calculation.
4. A rendering integration could schedule that timed artifact alongside its own match feed. Today's implemented consumer is the Theatre/Studio and clean program-output view, not an authenticated integration with a commercial rendering partner. The existing [story exporter](../../backend/src/matchpulse/stories/export.py) writes machine-readable timelines, insights, claims and evidence indexes for local review.
5. An editor or viewer opens Proof Lens. `viewer.proof.receipt` checks the current match/clock/claim, verifies original input and recalculates contributing positions. Its downloaded JSON is an auditable receipt, not a screenshot or an LLM-written justification.

## What the signature example establishes

For one explicitly identified synthetic fixture, 41 earlier and 18 later contributing observations produce context-weighted line proxies of approximately 21.95m and 31.96m: +10.01m. The proxy averages the three deepest outfield players in attack-relative coordinates. Representative frames show original observations, while the aggregate uses all 59 samples. Proof Lens discloses that distinction.

This supports a narrow editorial sentence: the sampled deepest outfielders were farther forward in comparable observed situations. It does **not** establish a high-press instruction, pressing success, expected goals, a coaching intervention or professional-match accuracy. In a different fixture the latest relevant positional evidence is 132 seconds old, so the positional statement is withheld. The refusal is an intentional editorial safeguard.

## One factual core, different audiences

Fan mode prioritizes readable controlled phrasing and the current moment. Analyst mode exposes supporting measurements and source detail. Favorite-team controls adapt permitted framing while preserving values; `viewer.service.preferences`, policy and the deterministic compiler enforce this boundary. Ask the Match deliberately offers a supported closed question set rather than an unbounded generative endpoint. The [viewer tests](../../backend/tests/viewer/test_viewer.py) check personalization, source-clock scope, stale withholding and independent arithmetic.

## What exists today and what a production feed would require

The actual viewer is causal replay over five isolated catalogued synthetic sources. `viewer.service.source` caches ingestion/analysis; `view` slices observations and approved moments at the selected clock. Seeking does not trigger a new model run. One saved source-verified goal workflow proves real Foundry/MAF integration, while the 23.83-second recorded workflow is not a production real-time latency promise. [Foundry evidence](microsoft-foundry-compliance.md) explains the provider and platform boundaries.

A production event vendor could eventually feed the canonical contracts, but that requires licensed data rights, schema adaptation, timestamp/availability semantics, player identity mapping, duplicate/out-of-order handling, feed failure behavior, a fresh validation set and operational/load/security testing. Different source semantics cannot be silently substituted for today's touch-based possession or observed positions. Synthetic accuracy, frozen detector failures and the consumed holdout remain disclosed in [DATA_CARD.md](../../DATA_CARD.md); no commercial data access, calibrated coaching inference or production scalability is claimed.

## Small useful next steps

The current Step 3E visual changes are candidates until browser acceptance passes. Complete a clear opening, source comparison, readable real agent decisions and the existing machine-readable output documentation before adding a database, event bus or another Azure service. Public deployment is not yet completed; the release owner must apply the [zero-cost hosting decision](zero-cost-hosting-decision.md), verify the exact HTTPS build and keep judge access available through November 10. Broader usefulness and editorial preference require actual human review; no reviewer or rating is invented here.
