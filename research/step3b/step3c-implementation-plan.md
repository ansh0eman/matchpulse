# Step3C implementation file plan — before frontend changes

Planning only. No frontend, API or analytical source is implemented in this turn. Preserve the existing uncommitted provider.py repair, frozen simulator/analytics and backend/uv.lock. User scope does not authorize deployment, source publication, extra cloud provisioning, paid inference to refresh status or trial/PAYG changes.

## First reviewable slice

A local React/TypeScript match stage with synchronized source clock, observed score, latest authorized pitch frame,18-item fan timeline and sentence-linked Proof Lens. Then separate opening-goal, equalizer, regain-to-shot, approved-position and withheld-position views; audience/team controls; cached role activity; restricted question buttons; deterministic recap. Keep one match UUID active at a time. A running Python evidence boundary serves only verified/cached data. Browser acceptance, not build success alone, completes the slice.

Choose a separate `web/` Vite React TypeScript application; do not turn the pinned simulator poc/ into a UI or add a second factual Next.js server. It is an interactive local replay, with Python retaining truth and credentials. Verify/pin compatible package versions when implementation begins; no new package version is asserted installed by this plan. Follow applicable frontend/browser skills at implementation time. Default backend binds loopback only. Do not add public model inference or MCP listeners.

## Exact planned file changes

| Planned path | Purpose and dependency boundary |
|---|---|
| `backend/src/matchpulse/viewer/__init__.py` | Viewer package, no inference fork. |
| `backend/src/matchpulse/viewer/schemas.py` | Closed ViewerRequest/ViewResponse/ProofReceipt/Recap contracts; reference existing BroadcastArtifact v2 rather than replace it. |
| `backend/src/matchpulse/viewer/catalog.py` | Explicit allowed fixture IDs to UUID source paths, input hashes and artifact provenance. No caller filesystem paths, manifests, ground truth or interventions. |
| `backend/src/matchpulse/viewer/service.py` | Load/replay a declared source via agents.cli.load_source; audience filter; prefix score/frame/insight lookup; local deterministic adaptation only. Cache key includes match/source hash/clock/preferences. |
| `backend/src/matchpulse/viewer/proof.py` | Source-bound proof receipts invoking existing verification and exposing exact arithmetic/units/windows/support. No detector changes. |
| `backend/src/matchpulse/viewer/api.py` | Small loopback-only read API with bounded IDs/clock queries; restricted AskRequest POST; no provider/provisioning endpoint. Starlette/uvicorn may reuse the isolated SDK environment; explicitly pin viewer runtime in a separate requirements file. |
| `backend/src/matchpulse/viewer/recap.py` | Deterministic chronological recap of eligible observed events at/before requested clock; no new LLM prose or fabricated goal. |
| `backend/scripts/export_viewer_fixtures.py` | Build bounded safe local fixture exports by re-verifying source/artifact/state; never invoke Foundry. |
| `backend/requirements-viewer.txt` | Explicit isolated viewer dependencies, verified before installation; preserve frozen pyproject/uv.lock. |
| `backend/tests/viewer/test_service.py` | Prefix score/frame isolation, match namespace, cache identity, audience/team invariants, sparse observations. |
| `backend/tests/viewer/test_proof.py` | Independent score/count/line receipts; wrong claim/unit/frame, missing source, stale/future evidence fail closed. |
| `backend/tests/viewer/test_api.py` | API schema/bounds/loopback configuration, restricted Ask/refusals, no provider calls, fallback status. |
| `web/package.json`, `web/package-lock.json` | Isolated React/TypeScript/Vite app with pinned tested dependencies and browser checks. |
| `web/index.html`, `web/vite.config.ts`, `web/tsconfig.json` | Local build/dev setup and loopback API proxy. No Azure secrets or endpoints exposed to client env. |
| `web/src/main.tsx`, `web/src/App.tsx`, `web/src/styles.css` | Match-first laptop layout, responsive mobile treatment, clear synthetic/source/provider labeling. |
| `web/src/contracts.ts`, `web/src/api.ts` | Derived/validated API types and bounded fetches; no numerical authority or arbitrary model text. Abort and generation-check old requests after seeking/match changes. |
| `web/src/replay/useReplayClock.ts` | Single clock/playback owner with play/pause/seek, monotone playback and explicit backward seek reset. |
| `web/src/components/MatchStage.tsx` | Score/period/source clock and one current insight. Never use final summary score before it occurred. |
| `web/src/components/ObservedPitch.tsx` | SVG observed player/ball positions from latest frame<=clock; scale105x68m to pixels only. No formation/pressure inference. |
| `web/src/components/StoryTimeline.tsx` | Approved timeline entries ordered by presentation clock; separate source/as-of clocks preserved. |
| `web/src/components/InsightCard.tsx` | Per-sentence buttons open only the sentence's registered claims. Explicit narration/overlay/origin status. |
| `web/src/components/ProofLens.tsx` | Claim IDs, namespace, source IDs, actual observations, recomputed result, units/windows/support/limitations. No arbitrary dashboard-number list. |
| `web/src/components/PositionComparison.tsx` | Authorized before/recent source frames, deepest-three proxy and matched-context weights; withheld states cannot become cards. |
| `web/src/components/StudioActivity.tsx` | Allowlisted structured roles/dispositions/branch outcomes/latency; never prompts or simulated reasoning. |
| `web/src/components/AudienceControls.tsx` | Fan/Analyst and favorite team; English only. |
| `web/src/components/AskMatch.tsx`, `web/src/components/MatchRecap.tsx` | Existing restricted question enums/refusals and deterministic recap. |
| `web/tests/broadcast.spec.ts`, `web/tests/proof-lens.spec.ts` | Real-browser laptop/narrow acceptance: seek, score, evidence, preferences, failures and mismatched/future IDs. |
| `research/step3c/browser-acceptance.md`, `research/step3c/artifacts/` | Commands, screenshots, viewport sizes and actual interaction evidence. No screenshots fabricated as product proof. |
| `research/step3c/execution-walkthrough.md`, README/AGENTS additions | Actual completed API/UI flow, limitations, run instructions and next gate. |

The files are planned, not all mandatory regardless of need: combine cohesive modules if implementation proves smaller. Report scope changes before adding unrelated infrastructure. Full bulk fixture exports stay local/ignored; version only compact approved examples, schemas, source hashes and browser evidence consistent with existing policy.

## Fixture mapping and provenance

| Scenario | Match/source | Approved artifact and intended use |
|---|---|---|
| Honest0–0 | UUID `5cc7f774-c215-4773-9318-3a01ad8b23af`; `backend/output/stories/source/<UUID>.jsonl` and `.tracking.jsonl.gz`; declared seed20261023 | Default source:6650 events,5521 frames,12 shots. Step3A schedule63; Fan policy18. Never add a goal/position card to improve the showcase. Compressed canonical source is also in research/step3a/artifacts/. |
| Opening goal | UUID `02840f35-cb05-4812-aa9d-1237e4ab1b9d`; `data/step2/inference/<UUID>.jsonl` | Goal at2370.5s, NORTH0–0→1–0, refs evt_002782/evt_002783, claim suffix e6e7fb2df33dccb5eecd1e77. Repository `opening_goal-{fan,analyst}.broadcast.json` is offline_fake, not live AI. No tracking source is present for this fixture: show honest event-location markers instead of invented22-player animation. |
| Equalizer | UUID `031c8ca1-662c-4255-a615-eb29bd25c249`; `data/step2/inference/<UUID>.jsonl` | NORTH equalizer at4241.5s,0–1→1–1; `equalizer-{fan,analyst}.broadcast.json` is offline_fake. Explicit separately selected existing source, not spliced into0–0. |
| Regain→shot | Honest0–0 source above | `regain_to_shot-{fan,analyst}.broadcast.json`; exact claim IDs/references/windows from fixture. Do not call this proof of successful pressing or causal goal creation. |
| Approved position | UUID `f2a3e267-d3e5-4c90-ae07-b5a39607ab2d`; `data/step25/inference/<UUID>.jsonl` and `.tracking.jsonl.gz`; frozen selected.json | At3360s,21.951300813008128→31.96388888888889m,delta10.01258807588076m; support41/18,one context. `position-{fan,analyst}.broadcast.json` is offline_fake. Retained calculation frames/full event prefix live under research/step25/fixtures/. |
| Withheld stale position | UUID `31c70a92-4ce1-4ec2-a570-e8112bfcc5fc`; matching Step2.5 event/tracking files |1350s decision uses last recent observation1218s:132s age and13s span. Show as withheld diagnostics only; no public positional insight. Ordinary eligible match events may still be shown. |
| Genuine Foundry proof | `research/step3b/artifacts/foundry-authenticated-proof.json` | Cached authenticated structured proof:4.687s,878/136 tokens. It proves model access/grounding, not a full narration fixture. Label precomputed genuine call. |
| Genuine partial Foundry runs | Coordination folder's foundry-workflow-final/success/verified JSON, trace/state/tool files | Filenames are not acceptance. All observed saved variants have fallback narration; some have enriched overlay. Use only after source/publication recheck as an explicitly partial/recovery capture. Never relabel as complete enrichment. |
| Complete live goal workflow | `research/step3b/artifacts/live-integration-validation.log` and live-foundry-validation.json | Passing test asserts Foundry origin, enriched narration/overlay and real tool use. Its BroadcastArtifact was not saved by the test. A complete cached live card remains an export/capture gap; do not synthesize from assertions or make a new paid call in this turn. |

Initial UI can ship locally with honest deterministic/fake/cached-proof status while retaining exact source identity. For a different audience/preference not present in a cached model artifact, deterministic adaptation must be labeled as such; do not call the adapted text another model response. No browser credentials, automatic live inference or paid refresh button in the initial slice.

## Exact authority and recomputation paths

1. Source: `agents.cli.load_source` -> `ingestion.load_match/validate_stream` and `tracking.ingestion.load_frames` -> `stories.replay.replay`. Filename UUID and source hashes bind match namespace. Viewer catalog contains only declared sources, not evaluation labels.
2. Claims: `stories.evidence.EvidenceIndex.verify/_verify`; stored `ClaimRegistry` values remain authoritative. Goal transition checks immediate source snapshots including penalty score_already_updated convention; event/shot counts are independently recomputed within `(start,end]`; gain/shot requires source period/possession/time linkage.
3. Position: `tracking.evidence.verify_geometry` and `verify_events`, then `tracking.presentation.review_episode`. Do not modify these functions or thresholds. `verify_geometry` resolves all source frames<=as_of, extracts eligible samples, reconstructs common contexts and minimum12/6 support, calculates both context means using recent-context weights, then verifies deltas/refs/support. Viewer proof receipt exposes that arithmetic and sampled coordinates, not a new detector score.
4. Position receipt math: per-frame attack-relative mean of three deepest active outfielders, explicitly excluding GK; for each common context c, w_c=recent_count_c/sum recent_count. Before=sum(w_c*reference_mean_c), after=sum(w_c*recent_mean_c), change=after−before. Unit metres; exact windows and current-period filtering. Show recent age/span and why withheld when gate fails. No coach/back-four/pressure claim.
5. Artifact: `agents.grounding.validate_envelope` -> `narrative_compiler.compile_narration`, `overlay_compiler.compile_overlay` -> `publication.verify_publication`. Recheck exact source/availability/presentation clocks, namespace, approved IDs, wording, overlay family/metrics/coordinates and branch statuses. Failed historical plans never become upgraded claims on load.
6. Runtime access: reuse `agents.tools.EvidenceTools.resolve_claim/resolve_evidence/get_match_context` with active match and playback clock. API callers pass IDs/clock/preferences, not authoritative claims, source paths, prompts or URLs. Add bounded proof receipt serialization in viewer/; do not send full evidence indexes or future histories to the browser/model.
7. Ask: `agents.ask.ask` uses the closed AskRequest enum. before_goal resolves up to five prior observations within12s and makes no assist inference. xG/possession%/coach-intent/counterfactual questions retain their refusal. No external search/model request for button interactions.
8. Timeline: `agents.policy.eligible` filters existing scheduled stories by audience, while `stories.scheduler.StoryScheduler` retains original event/presentation order and facts. Recap reads eligible verified moments<=clock only. The score bug comes from last canonical score<=clock, not summary/final result or card count.

## Time/access and browser acceptance

Use latest observed frame at/before current clock by default. Do not interpolate with a future frame on backward seek. If interpolation is added later, it must be labeled visualization with explicit authorized observation bounds; never become a measurement. Discard responses from a previous match/clock generation; reset evidence drawer if its insight is not yet available at the new clock. Server capabilities and cache keys include match/as_of/source hash/preferences. Caller-provided future event IDs must be rejected by the scoped resolver.

Acceptance targets: actual browser at1366x768 and390x844; play/pause/seek, opening goal and equalizer scores before/after,0–0 preserved, distinct fan/analyst text and unchanged facts, exact sentence proof, verified line receipt, stale withholding, unsupported Ask refusal, cross-match/future rejection, branch failure independence and honest origin badges. Default stage must remain readable while Proof Lens is open. Screenshots plus interaction logs are required; build/API tests alone are insufficient. No frontend files have been created or edited by this plan.

Implementation order: Python prefix/scoped view and proof contracts -> first0–0 React clock/pitch/timeline/Proof Lens -> separate goal/line/recovery fixtures -> preferences/questions/recap -> responsive real-browser acceptance. Integration status is now sufficient to proceed locally; public hosting identity, live tactical validation, model-quality comparisons and the successful enriched artifact capture remain separate gates.
