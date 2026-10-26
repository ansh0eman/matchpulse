# Turn of Play: competitor review

Reviewed 26 October 2026. This is product/source research, not a comparative accuracy benchmark or a production/security certification. The two supplied repositories are the scope; this is not an exhaustive survey of hackathon entrants.

## Evidence inspected

- Rematch: current public README, Decision Explorer and Pick Your Pass components, scoring and evidence code, verifier and narrator code/contracts, simulation rendering source, judge guide, ASK and Match Centre reports, deployment workflow.
- Virtual Studio Crew: current public README, RefChecker, StudioCrew workflow, GalleryProducer, Pitch metrics, WhyReplay, commentary voice and replay hooks, and published evaluation report. Its existing hosted tab was inspected in Fan view with AI crew and commentary OFF. No new model or Speech calls were initiated.
- Turn of Play: current local AGENTS/status, BroadcastTheatre, ProofSummary, theme/Matchday CSS, frozen Step 2.5 verdict; selected reference.png and the user's two new implementation screenshots. Concurrent frontend changes were not edited or tested.
- Rematch's public running frontend URL was not established from the inspected material. Its UI findings below are source/design-intent findings, not a fresh browser acceptance claim. Its reports contain historical, sometimes conflicting integration statements; source and explicit limitations take precedence over marketing prose.

## What the competitors do well

| Product | Strong product idea | What Turn of Play should learn |
| --- | --- | --- |
| Rematch | Pick a moment, inspect the frame, compare available actions, inspect evidence. Pick Your Pass makes the user participate. | Give users a concrete question and an action on the pitch. Make Inspect lead somewhere useful. |
| Virtual Studio Crew | Original characters communicate analyst, tactician, checker, producer and presenter roles; fan profiles, event commentary and a condensed replay make an end-to-end broadcast. | Explain the product through a memorable experience, pace quiet periods, and make voice optional and synchronized. |
| Turn of Play opportunity | A source-grounded before/after investigation with explicit freshness, contributors, support and limits. | Make the investigation itself attractive and understandable, instead of hiding most value inside an audit modal. This is positioning to test, not demonstrated market superiority. |

Rematch references: [README](https://github.com/Adamzuckk/Rematch/blob/main/README.md), [Decision Explorer](https://github.com/Adamzuckk/Rematch/blob/main/rematch-frontend/src/components/decision/DecisionExplorerPanel.tsx), [Match Centre report](https://github.com/Adamzuckk/Rematch/blob/main/MATCH_CENTRE_REDESIGN_REPORT.md).

Studio Crew references: [README](https://github.com/timmytrace/pl-insights-engine/blob/main/README.md), [WhyReplay](https://github.com/timmytrace/pl-insights-engine/blob/main/frontend/src/components/WhyReplay.tsx), [voice queue](https://github.com/timmytrace/pl-insights-engine/blob/main/frontend/src/commentaryVoice.ts).

## Technical distinctions that matter

1. Rematch is also evidence-first. We should stop presenting citations or a verifier alone as unique. Its geometric score adds forward progress and gain in proximity to goal. It does not estimate pass completion, xG, defender reactions, or the outcome of a tactical intervention. Its documentation explicitly preserves that boundary. [Scoring source](https://github.com/Adamzuckk/Rematch/blob/main/backend/app/services/decision/scoring.py), [method and limits](https://github.com/Adamzuckk/Rematch/blob/main/docs/decision-engine.md).
2. Rematch's verifier validates references and registered calculations; natural-language claim support remains `not_assessed`. This is an honest and useful distinction. Turn of Play can demonstrate its own narrower controlled claim/template contracts and independent source recomputation, without claiming a general semantic truth engine. [Verifier contract](https://github.com/Adamzuckk/Rematch/blob/main/docs/verifier.md).
3. Studio Crew checks that numbers appear on a moment's fact sheet, resolves cited fact keys, applies a phrase rulebook, then invokes an LLM reviewer. Numeric membership alone does not bind a number to the correct team, metric, qualifier and time. Our demo should visibly preserve those bindings and show a rejected stale or mismatched claim. This is an architectural distinction, not a measured superiority result. [RefChecker](https://github.com/timmytrace/pl-insights-engine/blob/main/backend/src/Studio.Crew/RefChecker.cs), [workflow](https://github.com/timmytrace/pl-insights-engine/blob/main/backend/src/Studio.Crew/StudioCrew.cs).
4. Studio Crew already has deterministic templates first, concurrency routing and stale-story dropping. These are sensible production patterns, not new differentiators for us. Preserve our existing fallback and freshness contracts. [GalleryProducer](https://github.com/timmytrace/pl-insights-engine/blob/main/backend/src/Studio.Crew/GalleryProducer.cs).
5. Studio Crew's published evaluation covers 30 story moments from two simulated matches with a model from the same family as the crew judging quality. The report warns about that limitation. Its results do not establish independent human usefulness or real-match analytical accuracy. Our own human comprehension study is also uncollected. [Evaluation](https://github.com/timmytrace/pl-insights-engine/blob/main/docs/evaluation/README.md).
6. Studio Crew has broader synthetic metrics; its README says the simulator uses the same functions to choose outcomes. Internal consistency is useful, but does not by itself establish real-world calibration. Our frozen results support line geometry only and do not justify adding high-press, coach-intent or causal-goal claims. [Metrics source](https://github.com/timmytrace/pl-insights-engine/blob/main/backend/src/Studio.Engine/Pitch.cs), [our verdict](../../step25/final-verdict.md).

## Why the current design misses the selected reference

The user's screenshots show a structural mismatch, not simply a color issue. The latest light screenshot is a loading state; it cannot establish a persistent loading defect. Its geometry is still sufficient to inspect.

| Selected reference | Current screenshot | Required correction |
| --- | --- | --- |
| Compact, softly styled header with pill navigation | Tall header with a full-height purple tab | Reduce chrome and use inset rounded selection |
| Approximately 70/30 pitch/investigation composition | Large pitch with a narrow key-moments sidebar | Replace the main sidebar purpose with the selected investigation rail |
| Pitch, score, key moments and controls form one workspace | Separate lower-third, transport and audience blocks extend vertically | Compose a unified left workspace |
| Headline, delta, earlier/recent values, support and uncertainty visible beside pitch | Primary meaning lives below pitch or inside a large Proof Lens | Put a concise claim and support in the rail; retain full proof on demand |
| Deliberate Outfit display roles and DM Sans body roles | Very heavy text spreads into long technical headings | Restore type hierarchy and shorten primary copy without dropping qualifications |
| Consistent lavender/plum/violet/pink UI around a green pitch | Old teal text, cyan highlights and green proof surfaces remain | Resolve semantic tokens at the owning selectors; avoid accumulating overrides |
| Watch → Compare → Explain is clear | Mostly passive playback and modal inspection | Connect steps to actual user actions; no decorative completed counts |

The first theme prompt deliberately deferred layout. That scope explains the recolor, but it was not sufficient to deliver the desired design. The next implementation milestone must address composition explicitly.

## Prioritized improvements

1. **Finish the selected Matchday composition.** Retain the chosen purple rounded design and same font direction. A new aesthetic exploration would delay the accepted target. Ship layout and source-bound investigation rail before more backend breadth.
2. **Make the comparison visual.** Earlier/recent source snapshots, highlighted contributors and an aggregate summary should be one click away. Preserve the distinction between snapshots and sampled-window means. Do not draw continuous movement between them as evidence.
3. **Make one memorable interaction:** “Which snapshot has the higher observed line?” Reveal the measurement and its limits after a choice. Grade observable comparisons only; do not grade speculative coaching intent. Optional participation, no forced onboarding or invented XP.
4. **Make the timeline editorially useful.** Put eligible moments below the pitch; distinguish the selected historical incident from current replay time. Keep future incidents hidden. Implement the pending relevance policy separately, without changing detector measurements or backend scheduling.
5. **Add optional voice with freshness discipline.** Short event lines and selected explanations, captions retained, user opt-in, bounded queue, cancellation on seek/match change/disable and explicit handling of speed changes. Start with existing local capabilities or reviewed recordings; paid Speech is a separate authorization.
6. **Make identities legible.** Use source roster names if present. Existing synthetic North/South players have generic source names; optional fictional display aliases need a stable, explicitly fictional mapping. Do not imply real PL players or alter frozen source records.
7. **Give the demo an intentional opening.** Start with a verified moment and one clear invitation. Keep detailed technical receipts behind progressive disclosure. Distinguish saved Foundry output, deterministic fallback and any future live narration.
8. **Measure comprehension.** Ask participants what changed, what the evidence does and does not prove, and which incident/time is selected. Keep objective task outcomes and wrong inferences, not only preference ratings. No acceptance claim until responses exist.

## What to defer

- A new counterfactual engine, additional detectors, simulator retuning, real-world probabilities and video event extraction.
- Copying competitor characters, visual assets or their product identity.
- Decorative chat that accepts arbitrary questions without a supported backend contract.
- Multiple simultaneous fan panes in the default experience; one useful view should work first.
- More agents or cloud infrastructure solely to increase the architecture diagram.

## Suggested product/demo framing

“Turn of Play helps you spot a change, compare the observations, and see exactly what supports the explanation.”

Suggested three beats: (1) a verified comparison; (2) source snapshots and window support; (3) a stale-evidence example where a current claim is withheld. The third beat demonstrates a real boundary rather than pretending the detector understands every tactic.

## Browser evidence and limits

Current hosted Fan-view capture: `/tmp/turn-of-play-competitor-review/01-crew-fan-view.png`. Four viewer profiles, original crew identities and pitch views were visible. The existing stopped session showed FULL TIME alongside 1ST HALF and partial progress; replay source maps a socket close with a snapshot to `full_time`. This was not a fresh full-match run. It is a useful reminder to distinguish stopped, disconnected and completed states in our own UX, not a broad competitor reliability verdict.

No competitor suites were run; their test and timing results above are repository-reported. No paid calls, deployments, pushes or application source edits were performed for this review.
