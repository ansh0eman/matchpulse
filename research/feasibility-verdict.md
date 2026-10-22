# Verdict: CONDITIONAL GO

Reuse the **pinned, MIT-licensed source** of tbleckert/football-simulator through our adapter for offline synthetic scenario generation and replay. Do not adopt its npm tarball as an unaudited substitute, its legacy random engine path, or its commentary/reporting as our own product innovation.

## Why this passes conditionally

- Same configuration/seed produces byte-identical canonical events. Different tested seeds diverge. Events are rich enough for an original detector, with stable actors, coordinates, possession context, scores and source evidence.
- Direct press-only change does **not** establish a consistent useful spatial recovery shift. A broader, explicitly bundled high-press strategy does: high recovery actions increase in 11/12 matched seeds, averaging +13 in the post-change 30-minute window. This supports a synthetic scenario family, not attribution to pressing alone or validation of real football.
- Offline performance is sufficient; snapshots dominate retained history. The adapter drains them without changing event bytes in the tested snapshot-equivalence run.
- The integration does not force TypeScript into the backend. JSONL is a replaceable boundary, and a dependency-free Python reader has consumed the generated baseline end to end.

## Conditions before building the main product

1. Keep source pinned to the audited commit; preserve full MIT notices and package provenance. Use source imports/a controlled local build, not the unverified npm artifact. Keep upstream dev server/build dependencies out of deployment.
2. Use the tested bundled tactical intervention as a labeled synthetic scenario. Do not advertise press-only causality, real-match predictions, realistic calibration or detector accuracy.
3. Implement the detector using only canonical events, with match identity supplied separately. Do not give it audit files, result summaries, truth files or policy-encoding filenames. Control events and even their indexing gaps are filtered out.
4. Evaluate on held-out seeds, variable intervention times, and no-intervention matches. Measure false positives per match, detection delay, sensitivity and evidence correctness. The same seeds used to choose the bundled policy cannot serve as independent validation. A strong simulator effect does not prove a detector works.
5. Freeze a match-aware canonical contract and a matching Python validator before downstream features. Retain a simple deterministic generator as a fallback if held-out scenario/detector tests fail; do not spend a day rewriting upstream football physics.

## Alternatives and trade-offs

| Choice | License | Reproducibility / richness | Tactical control / performance | Coupling, maintenance, effort | Decision |
|---|---|---|---|---|---|
| A: pinned primary source | Verified MIT with notices | Measured repeatability; many event types, positional and possession evidence | Press-only weak; bundled policy spatial signal; ~seconds per match, history drain available | Thin TS adapter; small maintainer base; PoC already works | Best current option with restrictions |
| B: footysim or soccerSim | No full license file verified; README-only MIT claim for soccerSim | Source not executed; capability claims not accepted as tested | Unmeasured | New integration and license clarification add uncertainty | Do not switch now |
| C: own minimal seeded generator | Original implementation under chosen project terms | Determinism can be designed; less football interaction richness | Can explicitly control action-rate/zone changes, likely lightweight but not benchmarked | Small schema-focused implementation; clear synthetic assumptions; still needs validation | Fallback if held-out engine scenarios fail |

No time estimates or performance claims for unimplemented alternatives are presented as measurements. A minimal generator would make injected changes easier to control but risks tautological evaluation if the detector merely rediscovers a hand-set signal; use realistic noise/null cases and independent validation.

## Recommended final architecture

Pinned TS generator -> original Zod adapter -> immutable canonical JSONL plus separate ground truth -> Python 3.12/Pydantic replay -> original rolling signals and detector -> original EvidencePack -> Microsoft Agent Framework/Foundry analyst and narrator -> React broadcast interface. Generate matches once, replay incrementally. Deploy only after independent validation and a separate implementation milestone.

Safely reusable now: inspected primary engine source with notices, Zod schema validation and locked TS tooling. Python/FastAPI/Pydantic/pytest, River, Microsoft's samples, React/Recharts/shadcn are proposed future components, not integrated or individually license-audited here.

Original work still required: stable match-aware contract, rolling football metrics, online change detection, before/after evidence with source-event references, evaluation harness, numeric narrative verification, fan/analyst explanations and final UI. Simulator hints are not a replacement for those components.

## Exact next milestone

Create the Python ingestion and detector experiment only: Pydantic model matching canonical schema version 1, ordered replay, two or three defined rolling signals, a simple causal rolling-window detector, and EvidencePack with contributing event IDs. Use a fixed training seed set and a disjoint evaluation set. Report null-match false positives and shift detection delays before adding River or agents. Assign run IDs at ingestion without exposing scenario labels. No UI/cloud work until those results are reviewable.

For the October 27 submission target supplied in the brief, remove counterfactual policy branching, player-trajectory animation, real-match data ingestion, complex xT/xG models, authentication/admin/settings, extra providers and multi-agent infrastructure experiments from initial scope. Keep one readable timeline, one tested turning-point flow, auditable evidence and two grounded narrative styles. This audit does not establish submission-rule compliance or production readiness.
