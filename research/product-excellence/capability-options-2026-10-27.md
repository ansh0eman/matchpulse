# Turn of Play — capability development options

October 27, 2026. Design proposal, not implemented features or measured human usefulness. The public hardening gate runs first. No new provider calls, data ingestion, detector tuning or infrastructure is authorized by this document.

## What already exists

| Capability | Current authority / implementation | Practical limit |
|---|---|---|
| Replay, score and player positions | App replay clock; canonical source projections; buffered prefixes | Recorded sources, not a live match producer. Some scenarios contain only event ball locations. |
| Select and inspect moments | Source-time timeline, historical selection, editorial prominence window | Matchday selection intentionally does not seek; Investigate feed/recap navigation already jumps to the story's presentation time. Neither provides a bounded lead-in passage replay. |
| Independent proof | Source-recomputed claim receipts, sample contributors, observations, method and audit | A valid number does not establish coach intent or pressing success. |
| Player inspection | Original match-scoped source IDs and coordinates in Investigate | One frame at a time; synthetic IDs are not real players or shirt numbers. |
| Ask and recap | Restricted question intents and deterministic source-grounded responses | Not general conversational football analysis. |
| Personalization | Fan/analyst preferences, followed side, real club display labels/colors | Club presentation does not turn synthetic results into a real Manchester derby. |
| Commentary | Optional local speech with deterministic event/explanation text | Voice quality depends on the platform; no real professional commentary provider. |
| Studio | Saved genuine Foundry/MAF workflow, evidence tools and source revalidation | Saved execution, not a new live run; managed agent registration and cloud tracing are not established. |

Do not spend the next sprint rebuilding these capabilities under new names.

## The product problem to solve next

The app can say that something happened and expose its proof. It is less effective at helping a viewer follow the sequence that produced the observation. The next useful step is a connected journey: **pick a moment → replay the passage → inspect the source sequence → compare the relevant observations → understand the limit**.

This is a design hypothesis. We have no participant results establishing that it is the right journey. Test it with real people rather than treating another heuristic review as acceptance.

## Three development paths

| Path | User benefit | Information available | Effort / evidence burden | Recommendation |
|---|---|---|---|---|
| A. Incident exploration | Understand a selected passage without manually hunting through the replay | Existing canonical events, tracking frames, match IDs, clocks and verified claim registry | Small-to-medium product changes; source contracts and browser verification, no new detector accuracy claim | Start here after hardening |
| B. Incremental match engine | Watch genuinely arriving synthetic observations; refresh/reconnect without replaying an entire file | Pinned simulator and existing causal inference interfaces, but new ingestion/session contracts are required | Larger backend lifecycle, persistence, ordering, backpressure and isolation work; fresh producer scenarios | Next foundation if live use is the chosen product direction |
| C. New tactical measurements and real-data adapter | Examine broader football patterns and eventually real matches | Existing synthetic data cannot validate all desired claims; external sources have different semantics/coverage | Research protocol, license/provenance review, adapter validation and untouched evaluation data | Separate research stream; do not retune the consumed holdout |

### A1. Replay this passage

Add one explicit action beside the selected incident: **Replay this passage**. Preserve Matchday selection-without-seeking and Investigate's existing story-navigation behavior. This adds a bounded start/end passage and lead-in, not another name for the existing `seekStory` jump. The action names its actual start/end source times before activation. Event passages use linked canonical event IDs/possession boundaries; positional comparisons offer the existing earlier/recent windows. A single playback authority remains in App.

Handle an event-only fixture honestly: show its recorded ball locations and say that player tracking is unavailable. Do not manufacture player markers, interpolated runs, pass endpoints or continuous paths to make the replay attractive.

Acceptance:

- Matchday selection alone leaves the replay clock unchanged; activating the replay action seeks exactly once to the declared start. Existing Investigate story jumps retain their documented behavior.
- Clock, score, timeline, commentary and proof retain their existing source-prefix/availability rules.
- Rewinding before the selected incident's eligibility hides its future score, narration, proof and sequence rows. A match-scoped passage-navigation intent may retain bounded playback coordinates, but cannot authorize future claims or resurrect an invalid historical selection.
- Pause, seek, preference changes, fixture changes and cancellation cannot revive an old passage.
- Keyboard and touch users can enter, stop and leave the passage; reduced motion does not alter its meaning.
- Event-only and withheld cases have explicit supported alternatives rather than fake current proof.

### A2. Source sequence strip

Under the pitch, show the few canonical observations linked to the incident as a sequence: time, side, source action and an inspect action. Use an expandable source detail for IDs and raw fields. Clearly distinguish a recorded event from a derived relation such as a regain followed by a shot. The strip is not a generated possession animation.

Reuse existing authority rather than inventing another incident engine: `agents/ask.py` already resolves bounded preceding observations for `before_goal` and claim-linked events for `shot_sequence`. The product addition is a navigable visual sequence and explicit playback handoff. Any wider sequence definition needs a documented event/period/possession contract first.

Acceptance:

- Every row resolves by match + category + source ID to an original observation available at the current cutoff.
- Sequence membership is deterministic; unrelated future events, another match and unverified relations are rejected.
- A shot cannot silently become a goal; a recovery cannot silently become a confirmed turnover; a pass location cannot silently become its endpoint.
- A person can reach the same observation from the timeline, sequence and Proof Lens without losing context.

### A3. Compare observed positions

Extend the existing player inspector to compare two explicit eligible frames for the same synthetic player. Show two source positions with frame IDs/times and coordinate differences. Label the dotted connector as a comparison of recorded positions, not the route travelled. Missing players remain missing. Do not report distance covered, speed or a tactical conclusion from two sparse samples.

For the line-height story, first make the existing 59-frame receipt easier to explore: pick a contributing frame, see the three actual contributing outfielders and their values, and return to the aggregate. Reuse the independent receipt; do not infer contributors from prose or shirt numbers.

Acceptance:

- Comparison uses one match, one canonical player ID and two frames at or before the evidence cutoff.
- Substitution/missing identity/axis changes are explicit; no nearest-player identity guess.
- The existing 21.95m / 31.96m, exact 41 + 18 samples and original fingerprints remain unchanged.
- New direct arithmetic, if published as a claim, gets its own typed schema, independent source recomputation and negative tests.

### A4. Useful questions rather than an unrestricted chatbot

Expand the restricted Ask surface only around an established task: “Which observations contributed?”, “When did this become known?”, “What happened immediately before?” and “What would this evidence fail to prove?”. Responses should resolve to supported registry IDs, times, source rows or explicit insufficiency. A future language model may route a question to these intents; it must not become factual authority.

Some backend intents already exist but are not equally discoverable in the four-button UI: `shot_sequence`, `why_highlighted` and `compare_position`, alongside `evidence`, `before_goal` and `position_change`. First expose applicable existing intents with context-aware labels; do not count those as newly invented analytics. Availability timing can reuse source/available/presented clocks already displayed by the app.

Measure success with recorded participant answers to concrete tasks, including whether they distinguish a sampled line estimate from a continuous trajectory and synthetic club labels from a real match. Keep responses private and report actual counts/denominators. No invented comprehension percentages.

## Foundation for B: reduce source-switch cost before live ingestion

The current API deliberately uses one analytical worker and one cached large source to fit the deployment memory budget. Cold fixture switches reload source models and replay inference. A faster frontend assertion does not remove that backend cost.

Measure cold load, warm view/proof and cross-fixture requests separately, retaining per-request latency, queue delay and peak RSS. Then prototype a compact viewer materialization keyed by exact source/config/code fingerprints. Preserve raw canonical observation lookup for independent proof; never trust cached prose as proof. Compare every projected prefix to the existing oracle. Corrupt or mismatched materializations must fail closed. Do not add parallel large workers inside the current memory limit without measured safety.

A true incremental producer is a separate milestone: monotonic sequence, match identity, source/available/presented clocks, reconnect cursor, bounded retention, late/duplicate observation handling and cancellation. A replayed file over SSE is still replay, not a live data source. No new transport dependency is needed until the lifecycle contract is agreed.

## Data research: possible future adapters, not current integrations

Primary sources checked October 27:

- [StatsBomb Open Data](https://github.com/hudl/open-data): event and lineup JSON, plus 360 data for selected matches. Attribution requirements are stated in the repository. Start with an event-only adapter and an explicit coverage contract; selected 360 records are not evidence of continuous player tracking.
- [Metrica sample data](https://github.com/metrica-sports/sample-data): synchronized tracking and events, anonymized teams/players, documented normalized axes and a 105×68m field for the two CSV samples. Useful for an adapter/geometry exercise; it does not solve real-player naming and cannot validate broad accuracy from a few samples.
- [SkillCorner Open Data](https://github.com/SkillCorner/opendata): broadcast-derived tracking, dynamic events and a detected-versus-extrapolated flag. An adapter must retain that distinction and the documented coordinate origin; inferred positions must not be presented as directly observed. Review the repository terms before publication or bundling.

Inference from those sources: an external adapter should declare its supported observation types and missingness before producing claims. None is a drop-in replacement for the current canonical semantics or a license to claim real-world detector accuracy. No external data was downloaded into the project or consumed for tuning.

## Recommended milestone queue

1. **Harden and measure:** close public regressions; document ownership/error fixes; retain latency and resource limits.
2. **One complete incident journey:** A1 + A2 on the existing tracked `native-goals` fixture, with the event-only goal fixture as a mandatory honest fallback case and full failure states.
3. **Make the proof interactive:** A3 for the exact existing positional receipt; no detector change.
4. **Test usefulness:** real participant tasks, source/limit comprehension and observed navigation problems; use results to choose A4 versus B.
5. **Performance prototype:** fingerprinted materialization and bounded memory/latency comparison before increasing concurrent users or adding live sessions.
6. **Choose a foundation:** incremental synthetic producer or one isolated external adapter. Each needs its own design and evidence contract.
7. **New tactical research:** prospective protocol, fresh development families and a genuinely untouched test set; preserve all old negative conclusions.

The recommended next implementation is **A1 + A2**, not a fresh UI makeover or more agent roles. Product-direction approval remains separate from the already authorized hardening work. Nothing in this proposal claims that implementation, participant acceptance or deployment has occurred.
