# Priority 3.5 — final local fan-journey acceptance

**Verdict: PASS for Journeys A, B and C. Priority 3 can close for the local technical fan journey.** This agent review does not establish human comprehension (Priority 5), physical-device acceptance, or deployed/public acceptance. No application behavior changed during this review.

## Reviewed revision and scope

October 25, 2026, Asia/Kolkata. Base: **`127c30876d9e7d6df1d163277392f0c5a1e8d7c8`**, plus the actual uncommitted P3.1/P3.2/P3.4 implementation and P3.3 test correction. Reviewed 11 source files and five test files:

- `web/src/`: `App.tsx`, `ProofLens.tsx`, `contracts.ts`, `useDialog.ts`; `broadcast/{BroadcastTheatre.tsx,MatchTimeline.tsx,presentation.ts}`; `design/{broadcast,matchday}.css`; `playback/segment.ts`; `proof/ProofSummary.tsx`.
- `web/tests/`: `broadcast.spec.ts`, `experience.spec.ts`, `playback.spec.ts`, `theatre.spec.ts`, and untracked `evidence-navigation.spec.ts`.

The tracked diff's SHA-256 remained **`6941d464ad71e1f5f5d4a74f945c0e8a409daf082526dfeff1b768694df942da`** throughout review. No unrelated implementation changes were identified. The optional editorial priority and additional TypeScript receipt fields adapt presentation to existing API output; backend evidence contracts/formulas were not changed. No tracked diff exists under `backend/`, `data/` or `research/step25/`.

All **46 Priority 2 files** remained byte-identical to the review's starting snapshot; its inventory is complete and episode-manifest hash matches. Existing acceptance history was preserved. [Starting-state evidence](../../output/playwright/p35/start-state.json), [source/preservation checks](../../output/playwright/p35/source-consistency.json).

## Complete journeys — fresh desktop and mobile sessions

Chromium: **1366×768 desktop**, **390×844 mobile**, reduced motion. Screenshots below were captured and visually inspected in this review. Journey screenshots use real local API responses, without response interception.

| Journey | Verdict and observed behavior | Current screenshots |
|---|---|---|
| **A — supported positional comparison** | **PASS.** Watched 56:00→56:02 at 1×, then sought to 56:40 and selected the 56:00 positional moment without rewinding. Opened Proof Lens by keyboard, inspected original frames/contributors, Method, Audit and provenance, exported the exact receipt, and returned with replay/selection and invoking-button focus intact. First summary content states the qualified comparison; windows, snapshot labels and limitation agree. | [Desktop selected](../../output/playwright/p35/desktop-A-selected.png), [proof](../../output/playwright/p35/desktop-A-proof.png), [frames](../../output/playwright/p35/desktop-A-frames.png), [Method](../../output/playwright/p35/desktop-A-method.png), [Audit](../../output/playwright/p35/desktop-A-audit.png), [limitation](../../output/playwright/p35/desktop-A-limits.png); [mobile proof](../../output/playwright/p35/mobile-A-proof.png), [frames](../../output/playwright/p35/mobile-A-frames.png), [limitation](../../output/playwright/p35/mobile-A-limits.png). |
| **B — earlier recorded shot after positional proof** | **PASS.** Selected South's 54:39 shot while replay stayed 56:40. Correct claim, match, event and evidence time appeared. None of the 30 sampled opening frames per viewport contained A's title, aggregate or frame identifier. Exported receipt equals the actual API response. Audit identifies South's shot `evt_003876` at **3279.5s**. Closing preserves selected shot/replay and restores focus. Gated focused checks separately cover loading, error/retry and superseded responses. | [Desktop proof](../../output/playwright/p35/desktop-B-proof.png), [source audit](../../output/playwright/p35/desktop-B-audit.png); [mobile proof](../../output/playwright/p35/mobile-B-proof.png). |
| **C — withheld positional evidence** | **PASS.** At 22:30, the explanation states that relevant positional evidence is 132s old and too old for a current comparison. No positional claim, attached shot timestamps or unrelated proof button appears. Explicitly selecting the separate historical shot restores its own legitimate evidence (09:26), with a different fixture identity from A/B. Seeking to zero removes the unavailable historical selection; fixture switching remains isolated. Actual future/wrong-fixture proof requests return **400**. | [Desktop withheld](../../output/playwright/p35/desktop-C-withheld.png), [explicit historical proof](../../output/playwright/p35/desktop-C-historical-proof.png); [mobile withheld](../../output/playwright/p35/mobile-C-withheld.png), [historical proof](../../output/playwright/p35/mobile-C-historical-proof.png). |

## Exact evidence consistency

Independently recomputed from the downloaded receipt and compared with original canonical tracking observations:

- Earlier mean **21.951300813008128m**, recent mean **31.96388888888889m**, difference **+10.01258807588076m**; display rounding to 21.95 / 31.96 / +10.01 is consistent.
- **59 samples: 41 earlier, 18 recent**, one matched context. Every original player ID, raw x/y, attack-relative x and frame time matches. Every three-player proxy and recent-context weight was recomputed.
- Earlier window **(2710,3180] = after 45:10 through 53:00**; recent **(3180,3360] = after 53:00 through 56:00**. All samples obey exclusive-start/inclusive-end boundaries.
- Representative snapshots **3114s / 3360s** have proxies **21.50m / 34.41m**, explicitly separate from aggregate means. Evidence cutoff **3360s** versus replay **3400s** is labeled, including the 40s difference and age at cutoff.
- Event, tracking and configuration file hashes match the receipt. The downloaded JSON equals the API response. [Exact receipt](../../output/playwright/p35/desktop-A-receipt.json), [independent calculations](../../output/playwright/p35/source-consistency.json).
- The explicit manager-instruction/pressing-effectiveness limitation remains visible in its own summary section. Neither a continuous trajectory nor tactical intent/effectiveness is established by these measurements.

## Verification, keyboard and remaining findings

**Fresh evidence:** six complete journey executions (A/B/C on two viewports), plus **10/10 focused checks passed in 34.2s**, with no behavioral failures or browser page errors. [Journey observations and opening-frame samples](../../output/playwright/p35/independent-journeys.json), [exact focused results](../../output/playwright/target-15135/results.json), [focused test source](../../web/tests/evidence-navigation.spec.ts). Coverage includes both gated proof-transition directions, obsolete-response cancellation, wrong-claim/wrong-match/future receipts, error/retry, same-incident reopening, historical selection, modal tab containment, Escape/Close restoration and missing-invoker fallbacks. No new test was needed.

**Prior evidence reviewed:** P3.4's **47 passed / zero skipped / zero flaky**, TypeScript and production build success, and transient mutation/frame recordings. [P3.4 record](../../output/playwright/p34/verification.json). The full suite was not repeated: current source is unchanged and the independent/focused checks supplied the missing acceptance evidence. `git diff --check` passes.

Keyboard opening, source inspection and return work at both viewport sizes. Score/current replay and selected history remain distinct. No horizontal overflow occurred. Mobile viewport/keyboard emulation is not a physical-phone test.

Remaining findings, ranked; **none blocks this local journey acceptance**:

1. **Low — ordinary-event summary wording.** “The observation, checked” and “1 original event observations” are generic; team/action are clear in Matchday and Audit. Editorial improvement remains useful.
2. **Low — retained scroll positions.** Mobile timeline selection leaves the explanation above the viewer's current position. Switching Method/Audit after scrolling Summary also retains the drawer offset, requiring scrolling up to the panel's opening formula/heading. [Mobile selection](../../output/playwright/p35/mobile-A-selected.png), [mobile Method](../../output/playwright/p35/mobile-A-method.png); controls and evidence remain reachable.
3. **Low — specialist language/source-label visibility.** Context weighting/proxy terminology benefits from plain-language help. The synthetic-source label is visible on desktop but absent from the captured mobile first viewport; source limitations remain available in Method/Audit/About replay.

No high/medium correctness or navigation defect was reproduced. Human comprehension is **UNRESOLVED**, explicitly reserved for Priority 5; no usability score is claimed.

## Closure and commit readiness

**Priority 3: ready to close for this local scope, subject to user review.** Minor findings above can remain separately tracked. No conclusion about public deployment or submission readiness follows from this review.

**One reviewed local commit: ready for the reviewed P3 viewer/tests and acceptance documents after explicit authorization and staged-diff review.** Do not indiscriminately stage the entire untracked research tree: Priority 2 includes an unignored private review key and a generated font cache, which must remain excluded. This review preserved that packet; it did not approve those private/generated files for versioning. No staging, commit, push, deployment, cloud operation, inference, video change or progression occurred.

The only repository edit made in P3.5 is this acceptance document. **STOP FOR USER REVIEW.**
