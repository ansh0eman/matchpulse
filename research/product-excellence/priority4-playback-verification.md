# Priority 4 — playback reliability and causal state

Local review, 25 October 2026. Base: `8ab1c1c42895b2dcb19b45cdfdabaeb30b8e015a`. Priority 4 only; changes are uncommitted. Public acceptance remains open.

## Findings and classification

**An application defect was reproduced.** Ordering checks accepted empty or future-only observation arrays. A controlled packet erased the verified pitch without an alert; an empty event prefix changed an already observed 1:0 into 0:0. Missing diagnostic age and a zero-progress window also passed validation. [Before-fix observations](../../output/playwright/p4/diagnosis-before-fix.json), [score/timing probes](../../output/playwright/p4/diagnosis-additional-before-fix.json), [genuine before-fix screenshot](../../output/playwright/p4/before-fix-truncated-prefix.png).

**The historical wrong-match failure had an upstream-dependent assertion deadline.** Read-only inspection of its saved trace found `route.fetch()` at 235598.823–240580.175 ms: **4,981.352 ms**. The error assertion began at 235601.084; fulfilment completed at 240592.419, only **8.665 ms before the nominal five-second deadline**. The recorded UI was still buffering. This establishes the test's timing dependency; it does not prove an application rejection defect for that wrong-match response. The test now prepares its malformed packet before Play and fulfils directly, retaining the five-second assertion. [Extracted trace timing](../../output/playwright/p4/public-trace-timing.json).

**Public performance remains uncertain.** The trace records a slow intercepted fetch, but does not identify Azure CPU, cold start, network, or instrumentation as its cause. No new public request was made. The historical complete public run remains **25 passed / 1 failed / 7 uncompleted**, not upgraded by local results.

**A mobile buffering defect was also confirmed:** the status contained “Buffering replay…” but computed `display: none`. A scoped status class and responsive rule now make buffering visible. [Pre-fix browser observation](../../output/playwright/p4/mobile-buffer-status-before-fix.json).

## Actual request and recovery paths

1. `App.tsx` toggles `playing`. Its paused `/api/view` effect cancels on playback/context changes; `visibleSnapshot` admits only the same scenario/audience/favorite and a loaded clock no later than the requested clock.
2. `useBufferedReplay` captures the scope and verified seed. `fill()` permits one pending request and asks `get()` for a 16-second `/api/playback` window. `get()` rejects HTTP/JSON failures; its AbortSignal cancels the fetch.
3. The API's `dispatch()` validates `PlaybackQuery`; `segment()` uses `checked()`, bisected canonical source arrays, and `view(end)` to compile bounded original observations and presentation. Its end view contains prefetched future data and must never be published wholesale.
4. `validateSegment()` checks scope, match, hashes, bounds, sequences, identities, numeric/render fields and claim namespace. The repair additionally checks diagnostic timing and progress, then compares score, period, frame and recent events at the request anchor with the verified seed, and at the declared end with the packet's end view. `fill()` now captures an anchor view from the current verified packet before each refill; it does not compare later refills with the original startup clock.
5. `tick()` advances quarter-second presentation ticks, clamps at the packet end and prefetches with eight seconds remaining. `prefixView()` selects only events, frames, diagnostics and presented stories at/before the tick. `onView()` updates clock, snapshot and loaded key together; App further filters incidents by source, availability and presentation clocks. `Pitch` displays original source coordinates without interpolation.
6. A rejected request sets the effect inactive, cancels animation, clears buffering, records the actionable fault and pauses. The paused view refresh can retain the last verified state. Retry clears the fault and increments the retry context to reload; pressing Play then starts a fresh valid buffer. Delayed valid responses resume from the held clock without a time jump.

Cancellation relies on effect-local `active` plus AbortController, not cancellation alone. Scope/retry/play changes clean up the old effect; the latest ref carries callbacks and speed without restarting every tick. Paused view responses check their own aborted signal. Tests release superseded responses after a newer seek, scenario or playback session has started. Elapsed time per animation tick is capped at 0.25 seconds; this is recorded replay, not wall-clock live ingestion.

## Exact affected files

- `web/src/playback/segment.ts` — boundary preservation, progress and diagnostic timing checks.
- `web/src/playback/useBufferedReplay.ts` — capture the verified refill anchor.
- `web/src/broadcast/BroadcastTheatre.tsx` — buffering status class.
- `web/src/design/matchday.css` — visible, wrapping buffering status on narrow screens.
- `web/tests/buffer.spec.ts` — deterministic malformed packet and additional invalid-boundary assertions.
- `web/tests/playback-reliability.spec.ts` — controlled browser cases and source-oracle observations.
- `research/product-excellence/priority4-playback-verification.md` — this report.

No backend, detector, canonical fixture, frozen experiment, source fingerprint or Priority 2 research changes. Existing Priority 3 assertions remain in place. No dependencies or playback architecture were added.

## Controlled verification and evidence

Isolated frontend/backend listeners: **15140 / 18140**. The backend was started from this checkout with an explicit `--app-dir`; direct current-source `segment()` output equalled its HTTP packet. [Process and source identity](../../output/playwright/p4/server-identity.json).

| Case | Browser checks |
|---|---|
| A — valid delay | Measured initial hold, then exhaust the first packet while its refill is gated; clock/positions/score remain verified, buffering is visible, release resumes. |
| B — malformed | Fifteen deterministic cases per viewport: wrong match; events/tracking/config hashes; duplicate/reversed frames; invalid coordinate; missing field; empty prefix; future-only frames; truncated end; erased observed goal; missing diagnostic age; invalid diagnostic span; zero progress. All pause with Retry and publish no invalid state. Direct validation also covers NaN and namespace/context corruption. |
| C — backward seek | Hold old playback and the new paused view separately, seek 56:00 → 01:40, release old response first. No future incident, comparison, positions or receipt returns; proof action remains disabled while loading. |
| D — scenario | Release the old fixture's packet after selecting withheld evidence. Different match IDs and event/tracking hashes stay isolated; the new fixture can play normally. |
| E — recovery | Network rejection, explicit cancellation, invalid cancelled response arriving during newer playback, Retry then valid playback, and three seeks whose older responses settle last. |

Committed DOM observations compare scores, every rendered player ID/coordinate and visible incident IDs with `/api/view` at the displayed tick. The existing regression also checks observed goal transitions and full packet-prefix equality across all six fixtures, including halftime. Priority 3 proof switching, receipts, withheld explanations, keyboard focus and the complete guided journey passed the core regression.

- TypeScript and production build: passed; final display-patch build recorded separately.
- Backend viewer/source regression: **37 passed, 11.47s**. [Raw result](../../output/playwright/p4/backend-regression.log).
- Initial targeted run: **10 passed / 1 failed**. The new test incorrectly expected a loading proof control to be absent; source showed it is disabled. Corrected activation assertion plus cancelled/new-session check: **2 passed**. No timeout increase or source-validation assertion removal.
- Full browser regression after the core fix: **59 passed, 0 failed/skipped/flaky, 414.50s**, laptop and mobile Chromium. [Exact result](../../output/playwright/p4/core-regression-results.json).
- After the final mobile-status fix, focused buffering, source continuity, backward seek, native goal and Priority 3 opening/layout regression: **12 passed, 0 failed/skipped/flaky, 81.08s**, laptop and mobile; initial and exhausted buffering status explicitly asserted visible. [Exact final-candidate result](../../output/playwright/p4/final-status-followup-results.json). Final TypeScript/Vite build passed (376ms Vite build).

Genuine captures: [desktop rejection](../../output/playwright/p4/laptop-invalid-prefix-rejected.png), [mobile recovery](../../output/playwright/p4/mobile-recovered.png), [desktop buffer exhaustion](../../output/playwright/p4/laptop-buffer-exhausted.png), [visible mobile buffering](../../output/playwright/p4/mobile-buffer-exhausted.png). Detailed per-viewport JSON and screenshots remain ignored local output under `output/playwright/p4/`.

## Limits and public acceptance

The fifteen preloaded local malformed cases reached the error assertion in roughly 61–102 ms in the initial desktop run; this excludes upstream fetch/cold-start time and is not a public latency guarantee. Final laptop/mobile initial responses were held 763/771ms; refills were held 2494/2492ms, long enough to exhaust the old packet at 4×. Both resumed without publishing beyond coverage, with 70 recorded state samples per viewport matching the source oracle. [Laptop timing/states](../../output/playwright/p4/laptop-delayed-valid.json), [mobile timing/states](../../output/playwright/p4/mobile-delayed-valid.json). Once a valid packet is exhausted, holding its last verified clock is expected; no invented intermediate positions are generated.

These are local Chromium results with emulated mobile geometry, not physical-device or Azure acceptance. Canonical server views remain the factual oracle; matching source hash labels alone do not independently authenticate arbitrary transport contents. The underlying public latency cause remains unresolved.

Public acceptance still requires separate authorization and an identified reviewed deployed revision: complete the previously unfinished browser coverage, run deterministic malformed-response/recovery cases against that app, verify fixture hashes and score/position/proof isolation, measure real upstream response timing separately, and check cold/warm buffering on the hosted app. No public test, deployment, Foundry inference, Azure/billing operation, commit, push, asset publication or video work occurred. Temporary local servers are stopped on completion. **Stop for Priority 4 review; Priority 5 is not started.**
