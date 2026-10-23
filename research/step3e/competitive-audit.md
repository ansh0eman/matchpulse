# Bounded competitive implementation audit

Inspected October 24, 2026. MatchPulse baseline: b9862d7. This is a source review of the seven specified public repositories, not a ranking, eligibility verdict, independent benchmark or usability study. GitHub API commit/tree reads pinned the revisions below; selected implementation, evaluation and UI files were read at those exact revisions. No competitor code was run, no paid service was called, and no code or visual asset was copied into MatchPulse.

Public README/demo descriptions are leads, not proof of a currently deployed service. A registration function proves an implementation path exists; it does not prove the author's tenant is healthy today. Committed evaluation reports are author-recorded observations unless reproduced independently. Comparisons of their latency or accuracy with our different workloads would be invalid.

## Snapshots

| Repository | Inspected revision | License metadata observed |
|---|---|---|
| [Matchroom](https://github.com/saisyalla96/matchroom/tree/01847d6e6310f41bc5d2eeb57a05626f51300981) | 01847d6e6310f41bc5d2eeb57a05626f51300981 | MIT |
| [MatchDirector](https://github.com/paulap887/matchdirector/tree/83b5fb9b0c939bebb7958b8b1c553d405b4dc9c6) | 83b5fb9b0c939bebb7958b8b1c553d405b4dc9c6 | MIT |
| [The Dugout](https://github.com/lauramiro/the-dugout/tree/e05ee64c1327c142cd4fc2000a24666a05ca0b6f) | e05ee64c1327c142cd4fc2000a24666a05ca0b6f | MIT |
| [MatchSense](https://github.com/VishalKJ-ai/matchsense/tree/6903ef61b488f0828d120cdcf646903340dba786) | 6903ef61b488f0828d120cdcf646903340dba786 | MIT |
| [Beyond the Scoreline](https://github.com/mateotoniolo/beyond-the-scoreline/tree/9f624e74d51ce67012ad116db2d084773d4e6d78) | 9f624e74d51ce67012ad116db2d084773d4e6d78 | MIT |
| [Matchday Crew](https://github.com/timsheldon1/matchday-crew/tree/374de95f4f7474c9a784e01a3ceafb2ce0a16ad5) | 374de95f4f7474c9a784e01a3ceafb2ce0a16ad5 | No license returned by repository metadata |
| [Football Universe Copilot](https://github.com/Mike-Demo/football-universe-copilot/tree/c0f740793dbb3e770fa8fc2ec15ee570d9355bbb) | c0f740793dbb3e770fa8fc2ec15ee570d9355bbb | NOASSERTION; do not assume reuse permission |

The metadata is not a complete legal audit. The decisions below adapt product principles, not implementation or assets, so they do not rely on permission to reuse competitor code.

## Matchroom: platform-visible agents and grounding

**Source-supported:** [`ensure_agents`](https://github.com/saisyalla96/matchroom/blob/01847d6e6310f41bc5d2eeb57a05626f51300981/agents/foundry.py) uses PromptAgentDefinition, lists existing versions, compares a model/instruction hash and creates a version when the definition changes. [`LLM`](https://github.com/saisyalla96/matchroom/blob/01847d6e6310f41bc5d2eeb57a05626f51300981/agents/llm.py) initializes these definitions, chooses agent invocation or model fallback, and records role/version/usage telemetry attributes. [`Verifier.check`](https://github.com/saisyalla96/matchroom/blob/01847d6e6310f41bc5d2eeb57a05626f51300981/agents/agents.py) checks numeric/unit/name compatibility with supplied facts; `FaultyLLM` in agents/faults.py deliberately corrupts model output.

**Boundary:** this verifies registration, invocation, fault-injection and checking code, not current agent registrations, successful cloud trace delivery, deployment health or evaluation outcomes in their subscription. Number compatibility is not equivalent to independent recomputation from raw player coordinates.

**Useful principle:** show which concrete role/version or local definition produced a result, which evidence it received, and what fallback protected the viewer. MatchPulse should make local MAF roles versus server-managed Foundry agents explicit, then lead with its original samples and recomputed arithmetic. **Adapt** the clarity; **defer** new managed registrations unless useful, safe and independently testable without inference spend.

## MatchDirector: fast output and slower review

**Source-supported:** [`StudioPipeline.AirAsync` and `ReviewAsync`](https://github.com/paulap887/matchdirector/blob/83b5fb9b0c939bebb7958b8b1c553d405b4dc9c6/src/MatchDirector.Agents/Studio/StudioPipeline.cs) separate first narration/number checks from tactical review, critic decisions, rewrite/recheck and safe template fallback. [`Worker.ExecuteAsync`](https://github.com/paulap887/matchdirector/blob/83b5fb9b0c939bebb7958b8b1c553d405b4dc9c6/src/MatchDirector.Agents/Worker.cs) concurrently runs stream readers, narration, review and recap loops. LiveEval and RedTeam are committed evaluation implementations.

**Reported, not rerun here:** their [evaluation report](https://github.com/paulap887/matchdirector/blob/83b5fb9b0c939bebb7958b8b1c553d405b4dc9c6/docs/evaluation.md) records 80 narrated moments over two synthetic matches, 33 critic-reviewed moments and narrator p50/p95 of 1,739/2,353ms. These are author-recorded results, not our measurement, and are not the latency of its full review pipeline. We did not test their public endpoint.

**Useful principle:** deterministic information can remain useful while richer processing is slower. **Adapt** that explanation in MatchPulse: source-derived replay information is immediate after loading; the saved full Foundry workflow took 23.83s and is not rerun on each click. **Reject** a two-second live-narration claim for our current graph. **Defer** new streaming/cloud queues before release.

## The Dugout: one memorable question and a guided product story

**Source-supported:** [`true_gap` and `_results`](https://github.com/lauramiro/the-dugout/blob/e05ee64c1327c142cd4fc2000a24666a05ca0b6f/dugout/sim/counterfactual.py) fork hidden simulator state, apply candidate substitutions and compare outcomes under common random streams. This is a concrete simulation-based managerial-decision product, not merely a narrative label. [`StoryIntro`, `StoryOverlay`, `StoryEnd`](https://github.com/lauramiro/the-dugout/blob/e05ee64c1327c142cd4fc2000a24666a05ca0b6f/web/components/story/Story.tsx) provide an explicit start/skip, progress, pause/next/leave and next destination. YourCall.tsx implements viewer interaction. [`workflow.py`](https://github.com/lauramiro/the-dugout/blob/e05ee64c1327c142cd4fc2000a24666a05ca0b6f/dugout/agents/workflow.py) builds actual Agent Framework narrator/check/localizer/check stages with retry and fallback.

**Boundary:** simulator counterfactual outcomes and committed evaluation reports do not establish actual managerial causality or professional-football calibration. The source-based UX observation is not an independent user test.

**Useful principle:** explain one compelling value in the opening seconds, then guide a visitor through it. **Adapt** this principle to recomputable evidence: meaningful observed line change → source frames → method → restraint → saved agent execution. **Reject** adding substitution counterfactuals to MatchPulse's frozen detector project before this deadline.

## MatchSense: native tracking depth

**Source-supported:** [`MatchSimulator`](https://github.com/VishalKJ-ai/matchsense/blob/6903ef61b488f0828d120cdcf646903340dba786/src/matchsense/sim/engine.py) advances player/ball state, records `f_xy`/`f_ball` and exports tracking arrays; its README describes 10Hz output. [`Pitch.render`](https://github.com/VishalKJ-ai/matchsense/blob/6903ef61b488f0828d120cdcf646903340dba786/src/matchsense/web/static/pitch.js) consumes frame coordinates rather than generating every player's position from a display formation. [`allowed_numbers` and `check_text`](https://github.com/VishalKJ-ai/matchsense/blob/6903ef61b488f0828d120cdcf646903340dba786/src/matchsense/agents/factcheck.py) constrain generated numbers, name spelling and lengths. Agent crew and shift-evaluation source are present.

**Boundary:** existence of simulator mechanics and evaluation scripts does not independently validate claimed realism, accuracy or physical calibration. Our audit did not rerun its seed/evaluation suite.

**Useful principle:** make the pitch carry the explanation and distinguish original frames from derived measures. **Adapt** visual emphasis on the specific deepest-player contributors in MatchPulse. **Defer** a new simulator, higher-frequency tracking, player speed, pressure effectiveness, xG and richer metrics: our current source and frozen conclusions do not authorize those claims.

## Beyond the Scoreline: grounded free text and cached speech

**Source-supported:** [`QAAgent.ask` / `make_qa_agent`](https://github.com/mateotoniolo/beyond-the-scoreline/blob/9f624e74d51ce67012ad116db2d084773d4e6d78/src/bts/insights/qa/agent.py) use an Agent Framework agent with live-match tools, a bounded run, limited conversation memory, citation checking and bilingual fallback. [`check_citations`](https://github.com/mateotoniolo/beyond-the-scoreline/blob/9f624e74d51ce67012ad116db2d084773d4e6d78/src/bts/insights/qa/checker.py) rechecks evidence against served context. [`Narrator._speak`](https://github.com/mateotoniolo/beyond-the-scoreline/blob/9f624e74d51ce67012ad116db2d084773d4e6d78/src/bts/speech/narrator.py) synthesizes SSML through a supplied client, caches clips and tracks characters. Broadcast.tsx is a distinct viewing surface.

**Boundary:** these paths substantiate implemented behavior; this audit did not synthesize audio, run questions against their model or verify deployment/paid-service configuration. API-shaped integration is not proof of current live success.

**Useful principle:** keep questions near the evidence and give the viewer a clear return to the match. **Adapt** useful guided questions/receipt inspection within our restricted Ask contract. **Defer** free-form model questions, Speech resources and multilingual synthesis under the zero-inference-spend constraint; their cost and verification burden are not justified before core release.

## Matchday Crew: presentation motion is not source tracking

**Source-supported:** [`teamShape`](https://github.com/timsheldon1/matchday-crew/blob/374de95f4f7474c9a784e01a3ceafb2ce0a16ad5/web/src/teamShape.js) estimates all 22 positions from ball position, formation slots, possession, period and elapsed time; it adds smooth drift and moves a nearby defender toward the carrier. The file explicitly distinguishes this simulation from tracking. [`Pitch`](https://github.com/timsheldon1/matchday-crew/blob/374de95f4f7474c9a784e01a3ceafb2ce0a16ad5/web/src/components/Pitch.jsx) renders this display; teamShape tests exist. [`ungroundedNumbers`](https://github.com/timsheldon1/matchday-crew/blob/374de95f4f7474c9a784e01a3ceafb2ce0a16ad5/src/agents/grounding.js) compares narration numbers with an allowed set derived from evidence.

**Boundary:** this is a legitimate illustrative animation technique when labeled. It cannot be used as proof that every shown player's position was source-observed. We did not run its multilingual model or voice pipeline. Repository metadata did not establish a reuse license.

**Useful principle:** clear temporal presentation and handoff/fallback labels. **Adapt** readable staged reveals and actual recorded execution. **Reject** estimated formations, smooth inferred trajectories or decorative pressure movement in MatchPulse Proof Lens. Event-only goal fixtures must stay event-only even if this makes the pitch visually quieter.

## Football Universe Copilot: graph exploration, with a runtime boundary

**Source-supported:** [`Universe.shortest_path`](https://github.com/Mike-Demo/football-universe-copilot/blob/c0f740793dbb3e770fa8fc2ec15ee570d9355bbb/src/graph/universe.py) searches a seeded relationship graph; [`agents.py`](https://github.com/Mike-Demo/football-universe-copilot/blob/c0f740793dbb3e770fa8fc2ec15ee570d9355bbb/src/agents/agents.py) separates interpretation, graph context, narration and personalization. [`azure_narrate`](https://github.com/Mike-Demo/football-universe-copilot/blob/c0f740793dbb3e770fa8fc2ec15ee570d9355bbb/src/agents/azure_narrator.py) optionally calls a configured Azure endpoint and otherwise falls back. Crucially, [`describe_runtime`](https://github.com/Mike-Demo/football-universe-copilot/blob/c0f740793dbb3e770fa8fc2ec15ee570d9355bbb/src/agents/framework_adapter.py) identifies a local orchestrator and explicitly says the Framework package is not its pipeline runtime. An agent manifest alone is not an executed MAF graph.

**Boundary:** graph records are seeded source data, not automatically current player-history truth. This inspection did not establish active Azure inference, deployed health or live Framework execution in that project. License metadata was inconclusive.

**Useful principle:** a distinctive, approachable exploration model is memorable. **Adapt** evidence exploration around our actual match claim graph, not celebrity/player-history data. **Reject** unrelated graph ingestion and “four agents means MAF” claims. Our own saved MAF execution should be demonstrated with its actual graph, tool requests and verifier.

## Ranked decisions for MatchPulse

These are engineering estimates for adapting principles, not measured development durations or author costs. No additional inference is necessary for the proposed local work.

| Principle | Decision and concrete scope | Estimated work / cost / risk |
|---|---|---|
| Immediate product value, motivated by The Dugout | Implement a meaningful existing tracked positional fixture as the first impression, with one evidence CTA; keep goal chapter separate | 1–2h; local ₹0; low factual risk if catalog IDs/clocks remain fixed |
| Source-depth made visible, motivated by MatchSense/Matchroom | Adapt a staged before/after contributor reveal, plain-language meaning, Method/Audit and visible limitations | 2–3h; local ₹0; medium UI/accessibility risk, require keyboard/reduced-motion/source tests |
| Understandable role contribution, motivated by Matchroom/MatchDirector | Adapt actual route/skip/challenge/branch outcomes in Agent Room; retain recorded labels and HTTP-count uncertainty | 1–2h; local ₹0; low risk with original saved events and source revalidation |
| Explain the two time scales, motivated by MatchDirector | Implement honest source replay versus asynchronous/saved richer processing explanation | <1h; local ₹0; low risk; no new streaming service |
| Guided questions, motivated by Beyond the Scoreline | Adapt concise supported questions over the existing restricted API and clear evidence navigation | <1h if necessary; local ₹0; low risk; defer free-form calls |
| Multilingual speech, new counterfactuals, high-frequency physical metrics | Defer; these require new inputs, validation or possible service spend and dilute the core demonstration | Multiple days/unknown service spend; high deadline/correctness risk |
| Formation-based “tracking”, unrelated player-history graph, more agents for count | Reject for this release | No implementation; prevents misleading evidence and scope expansion |

## Scope of this pass

Seven supplied public repositories were inspected through pinned code and committed reports. Their public demo endpoints were not acceptance-tested and their paid services were not invoked. No authenticated Innovation Studio directory or additional private submission was checked in this bounded pass; no claim is made about unseen entries. Further competitive research should yield to product acceptance, a reliable zero-out-of-pocket deployment, a genuine narrated video and confirmed submission.

The competitive proposition remains a concrete testable behavior: **a viewer can ask to inspect an approved football explanation, see original observations, and receive an independently recomputed evidence receipt.** This is a scope-specific differentiator, not proof that no competitor has any equivalent capability or that MatchPulse will win.
