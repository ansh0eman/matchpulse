# Proposed next sprint — follow the incident

Design for review, October27. No feature below is implemented by this document. Depends on accepting the local hardening candidate; public release remains a separate gate.

## One user journey

On the tracked native-goal fixture, select an available goal in Matchday without moving the clock. Choose **Replay the lead-in**. See the declared source-time range before starting. Watch the canonical replay through that range, stop at the declared end and inspect a compact list of actual recorded observations. Open one observation's existing proof detail and return without losing the passage context.

Reuse the current pitch, timeline, proof drawer, theme and controls. Add capability within the existing design; do not begin another redesign or agent orchestration layer.

## Existing behavior to preserve

`App.seekStory(story, true)` serves Matchday selection without seeking; Investigate's feed/recap calls `seekStory(story)` and already jumps to presentation time. `seekReplay` clears invalid selections on backward seek. Keep those contracts. The new action is a bounded passage, not a replacement for either navigation behavior.

The backend already verifies bounded `before_goal` and `shot_sequence` observations through `EvidenceTools`. The frontend `Answer` type currently exposes only status, explanation and limitations; it does not provide a typed, navigable source sequence. Build on the existing evidence authority rather than writing a second incident detector.

## Playback design: explicit passage playback

Files: new `web/src/playback/passage.ts` for pure range/ownership rules; a small `usePassageReplay.ts` only if the stateful stop/clear logic warrants a hook; `useBufferedReplay.ts` for a validated optional source-clock stop boundary; `App.tsx` for the single clock and playback authority; `MatchdayInvestigation.tsx` for the action; focused browser tests.

State is a navigation intent scoped to scenario + match + source hashes, declared start/end and target incident ID. It is not an approved factual claim. Existing buffered replay still owns actual source advancement. Do not add another timer or independently move players.

For the first goal-only version, use a labelled editorial lead-in of up to12source seconds, bounded by the actual period start and approved incident cutoff. It is not a claim that those12seconds caused the goal. Resolve start/end from verified source metadata; never estimate periods using fixed45-minute arithmetic. Treat distinct source/available/presented clocks explicitly. A fixture without the required boundary data gets an unavailable action until a supported range can be resolved.

Starting rewinds once through the existing seek path. Pause/cancel, arbitrary manual seek, fixture change, retry failure or source-fingerprint mismatch clears the passage intent. Stop at the declared endpoint exactly once. Preferences may change projections while the canonical passage remains valid. Before the incident's eligibility, its future outcome, narration, proof and sequence rows remain hidden. A remembered navigation target cannot bypass editorial eligibility.

Clamp advancement inside the existing buffered source-clock calculation to the verified endpoint before publishing. An App effect that stops only after observing an overshot clock is insufficient, especially at12×speed. Preserve prefix validation and cancel obsolete stop boundaries with their passage owner.

## Source design: typed source sequence

Files: `backend/src/matchpulse/viewer/service.py` only at the existing question response boundary; a closed sequence DTO in viewer schemas; `web/src/contracts.ts`; new `web/src/broadcast/useIncidentSequence.ts` and `IncidentSequence.tsx`; integration in the existing investigation rail. Existing `agents/ask.py`, tracking and story inference remain factual authority and are not retuned.

Recommended transport: extend the supported question response with an optional versioned, bounded sequence receipt and source-verified passage/period boundaries. Normalize verified raw events to the viewer's existing `Observation` fields; do not render arbitrary model prose or raw untyped objects. Bind the receipt to match, insight, scenario, query cutoff, audience/favorite and original source fingerprints. Echo identity from independently checked server state, not caller-supplied measurement fields. Use the existing POST/Ask endpoint and `readJson`; no new service or dependency.

The hook has one immutable request identity, controller/owner guard, bounded cache and explicit loading/error/empty states. It does not reuse App's general Ask answer state or let one question cancel an unrelated passage request. On scope changes, hide the old sequence synchronously. Reject cross-match IDs, duplicate IDs, nonfinite/future times, impossible ordering and unsupported actions. A missing preceding event remains missing; no guessed assist, successful pass endpoint or causal arrow.

Show time, side and recorded action for each available row. Put original IDs/coordinates behind a source detail. Expose historical inspection separately from an explicit seek action. Filter rows to the currently allowed replay cutoff during rewind. Do not play a spoken backlog from previously seen sequence rows.

## Implementation order and verification

1. Define/test the closed server receipt and source/period range resolution on the native tracked goal and event-only fallback. Reject unknown scope/future evidence first.
2. Implement/test pure range ownership and buffered-clock clamping, including12×overshoot and cancellation. No UI can activate an unverified placeholder range.
3. Wire the request hook, explicit action and source strip into the existing views. Preserve current navigation and proof ownership.
4. Verify the complete useful/unavailable journeys below, then the required full gates. Prepare actual participant tasks separately.

Mandatory cases:

1. Native tracked goal: source-positioned players, exact score transition, explicit lead-in start/end and original observation IDs.
2. Event-only goal: recorded ball locations and an honest player-tracking-unavailable state.
3. Line comparison: the existing59-sample receipt is unchanged; do not pretend a goal-only passage resolver supports positional windows yet.
4. Withheld case: no current-proof or unsupported passage action.
5. Backward seek/cancellation: no future goal, stale narration, obsolete sequence publication, second clock or late speech.
6. Laptop/mobile, keyboard/touch, light/dark and reduced-motion behavior; failed/late/malformed responses remain actionable.

Before release: relevant backend tests, the complete local frontend suite, typecheck/build/whitespace, source fingerprints, accepted image verification and the complete public suite on the actual released candidate. Keep logs/JSON/traces. No paid inference is required.

## Product validation

Recruit actual participants separately. Give a concrete task: identify the incident, replay its lead-in, find a source observation and state one thing the evidence cannot establish. Record responses and navigation trouble without coaching. Predeclare the task rubric before collecting answers; report actual denominators and disagreements. The prototype is not human-accepted because its automated tests pass.

Only after this slice should we decide between interactive line contributors, exposing more existing restricted Ask intents, and fingerprinted viewer materialization for lower switching latency. A real incremental producer or new tactical detector gets a separate design/data/evaluation milestone.
