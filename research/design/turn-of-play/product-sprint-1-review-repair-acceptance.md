# Product Sprint 1 — post-review repair acceptance

26 October 2026, Asia/Kolkata. **R1–R4 PASS for bounded local technical acceptance. Stop for user review.** Authority: user attachment 04dc798c-c0f9-4697-b115-3edcefdf80fe. This is a separate repair, not a restart of A–F, P7, publication or deployment. HEAD remains `6fa99c854e17e64c2b0a3934e630de817b64872f`; index empty.

## Preserved evidence

Original full suite 116 passed/1 intentional skip and its 68 matching fingerprints remain historical evidence. Initial inspection verified those fingerprints still matched. Fresh reviewer run 5 passed/2 failed and rerun 1 passed/1 failed are preserved with traces/logs in `../../../output/product-sprint-1-review-repair/initial-20261026-01`. Both failures concerned startup readiness; the separate controlled stale-packet reproduction exposed a real lifecycle bug. Original sprint acceptance/progress and P6 acceptance are byte-for-byte unchanged. Temporary reviewer files were available and copied; none were discarded or reclassified as passes.

## Repairs and confirmed causes

| Gate | Cause and correction | Evidence |
|---|---|---|
| R1 PASS | RAF cancellation left a window where obsolete scope failures could pause replay. Shared `owns` predicate checks active session/context, desired audience/favourite, playing state, abort flag and pending object identity BEFORE validation/publication, catch and finally. Stale cleanup cannot clear a newer request. Existing source/causal validators and out-of-coverage response handling remain. | Before-fix controlled malformed completion: 1 failure with unwanted alert. After: 18 ownership passes; current invalid scope still fails closed. Original P4/buffer coverage also passed. |
| R2 PASS | Short receipt assertions started before catalogue/view/proof prerequisites. One bounded startup helper observes real responses from navigation, validates actual match/claim/verified proof and 41/18 support, then retains normal short exact assertions. No cache warming, retries, sleeps or blanket timeout increase. Delayed proof gates release in finally; prior support disappearance is read immediately after scope change. | Editorial alone 1 pass, support alone 1 pass, together 4 passes across fresh laptop/mobile contexts; final suite includes both. |
| R3 PASS |43vh constrained grid WIDTH, giving stage 587px/rail 725px. Two-thirds/one-third columns now own hierarchy; independent viewport-height budget caps pitch height, with xMidYMid meet and equal-axis transform. Deliberate stacking<=1100px. Compact duplicate basis/spacing and a controlled shorter observed-fact sentence retain sampled qualifier and full uncertainty. Body ≥13px. | All four requested viewports/both themes; controls and action fit primary desktop. No source coordinates changed. Open timing, long club names, voice settings, complete captions, quiet/history/withheld and P5 paths inspected/tested. |
| R4 PASS | Marker time/type/selection text was hidden, leaving dots/counts. Collision-aware persistent labels, viewport-contained pointer/focus callouts, original-ID touch/Enter lists and a readable selected-history caption now expose context. Original registered boundary headlines distinguish simultaneous events. | Sparse/dense/coincident/selected, pointer/focus/touch, Escape/outside/seek, reduced motion, exact anchor coordinates and independent playhead pass. Hover/focus cause 0 seek/select/proof/speech actions. |

## Exact commands and actual outcomes

Node 24 PATH: `/Users/ansh0eman/.nvm/versions/node/v24.19.0/bin`. Each runner call is from repository root and retains expanded `command.txt`, raw log before Distill, JSON/classifications, source fingerprints, exit status and failure traces. Raw JSON is authoritative.

| Runner label and arguments after `output/product-sprint-1/run-tests.sh` | Actual result |
|---|---|
| `review-repair-r1-before-20261026-01 tests/request-ownership.spec.ts --project=laptop --grep 'obsolete malformed'` |0 pass/1 failure (old bug reproduced);9218ms;exit1 |
| `review-repair-r1-after-20261026-02 tests/request-ownership.spec.ts tests/playback-reliability.spec.ts tests/buffer.spec.ts` |38 pass/2 harness-setup failures;216171ms;exit1 |
| `review-repair-r1-harness-20261026-03 tests/request-ownership.spec.ts` |18 pass;51708ms;exit0 |
| `review-repair-r2-editorial-20261026-01 tests/editorial.spec.ts --project=laptop --grep 'published quarter-second'` |1 pass;7213ms;exit0 |
| `review-repair-r2-support-20261026-02 tests/sprint-session.spec.ts --project=laptop --grep 'comparison support scope'` |1 pass;3100ms;exit0 |
| `review-repair-r2-together-20261026-03` (exact regex command below) |4 pass;17363ms;exit0 |
| `review-repair-r3-focused-20261026-03 tests/layout-repair.spec.ts tests/matchday-layout.spec.ts tests/theatre.spec.ts tests/priority5-ux.spec.ts` |19 pass/1 intentional skip/2 failures;144103ms;exit1 |
| `review-repair-r3-repaired-20261026-04 tests/layout-repair.spec.ts tests/priority5-ux.spec.ts` |11 pass/1 intentional skip;38323ms;exit0 |
| `review-repair-r4-focused-20261026-01 tests/timeline-context.spec.ts tests/editorial.spec.ts tests/priority5-ux.spec.ts tests/layout-repair.spec.ts` |22 pass/1 skip/1 failure;90607ms;exit1 |
| `review-repair-r4-repaired-20261026-02 tests/timeline-context.spec.ts tests/editorial.spec.ts tests/priority5-ux.spec.ts tests/layout-repair.spec.ts` |23 pass/1 intentional skip;89653ms;exit0 |
| `review-repair-r4-boundary-20261026-03 tests/timeline-context.spec.ts` |4 pass;19844ms;exit0 |
| `review-repair-final-20261026-01` (unfiltered; failed, retained) |141 pass/1 skip/1 fail;725065ms;initial commentary receipt before startup |
| `review-repair-r2-commentary-20261026-04 tests/commentary.spec.ts --grep 'local voice controls bound'` |2 pass;7967ms;startup helper adopted only for observed setup failure;exit0 |
| **`review-repair-final-20261026-02` (unfiltered)** |**142 passed / 1 intentional skip / 0 failed / 0 flaky;708.178s;exit0;all 143 collected cases accounted for** |

Exact two-case command:

```sh
output/product-sprint-1/run-tests.sh review-repair-r2-together-20261026-03 tests/editorial.spec.ts tests/sprint-session.spec.ts --grep 'published quarter-second|comparison support scope'
```

Final `npm run typecheck --prefix web`, `npm run build --prefix web`, `git diff --check`:exit0. Only skip is the existing laptop mobile-only pointer reveal; its mobile counterpart passed. No flaky/interrupted/unexplained unexecuted cases in final integration. Source fingerprints match checkout after testing. An isolated passing subset never substitutes for this full result.

The first complete repair integration also exposed the same R2 startup pattern in the commentary test: catalogue/view took approximately 2441ms and proof was pending at 5s. Its startup now uses the identical bounded readiness helper; voice/queue/callback assertions and production behavior are unchanged. The failed complete run remains distinct from the final one.

Preserved repair failures: R1 test harness needed default-export normalization for Vite CJS createRoot (production ownership tests passed); R3 inherited 12px mobile body corrected to 13px and open cluster dismissed with existing Escape before fixture navigation; R4 test incorrectly required a callout above already off-screen mobile controls, corrected to strict rectangle non-overlap. No force clicks, weaker source/count assertions, timeout increases, retries or race sleeps. Critical R1 ordering holds RAF explicitly, delivers responses independently of abort success and uses MessageChannel task barriers; cleanup restores browser functions and releases routes. Actual hook unmount callbacks remain0.

## Visual evidence and measured geometry

[Before capture/geometry](../../../output/product-sprint-1-review-repair/r3-before-20261026-01/), [final loaded views/geometry](../../../output/product-sprint-1-review-repair/final-visual-20261026-01/), [before/reference/after](../../../output/product-sprint-1-review-repair/final-visual-20261026-01/before-reference-after-02.png). Comparison is whole-view width-normalized, not a pixel diff; original screenshots remain available.

| Viewport | Before stage/rail | After stage/rail | After closed transport/action bottom |
|---|---|---|---|
|1366×768 |587.08/724.92px; action bottom821.27 |874.66/437.34px |764px / approximately740px |
|1440×900 |Baseline JSON retained |924/462px |896px / approximately740px |
|1024×768 |Baseline JSON retained |Deliberately stacked,984px each |Essential transport directly after stage; document scroll for investigation |
|390×844 |Baseline JSON retained |Stacked,366px each |Essential transport directly after stage; investigation scrolls naturally |

Both themes inspected. Full13px+ explanation body, observed fact, similar-sample qualifier, signed delta, exact earlier/recent values/support and uncertainty remain. Full field viewBox and isotropic screen transform checked; honest green surrounding space remains instead of stretching. No independent panel scroll traps introduced. Source timing/voice expansion and full captions may increase document height; no clipping or hidden controls. Persistent labels expose a subset where collision-free; every eligible original incident remains reachable through its marker/cluster, full callout and selected context. Source anchors and current playhead do not move with label placement.

Final standalone comparison utility01 failed on a relative API URL without a base URL. Utility02 corrected only that local capture setup and passed; both logs/exit statuses remain. No application code changed. All eight final loaded viewport/theme screenshots and the resulting comparison/callout were inspected.

This improves the selected reference hierarchy; it is not a pixel-identical clone. Source-backed positions, colours and factual disclaimers differ from the concept; the honest full-match timeline differs from the concept's focused interval. No invented position/player/coach story was added.

## Ownership and preservation

[Exact repair file ownership](../../../output/product-sprint-1/review-repair-final-20261026-02/repair-ownership.json) lists 13 application/test paths and 4 record/control paths. Shared files contain preserved prior uncommitted work. No staging is authorized. Initial diff/status/hashes, reviewer evidence and all failed attempts remain.

All 10 fixture files/31,984,795 bytes unchanged. Original analytical data, 7m detector, consumed holdout, fingerprints, negative conclusions, source observations, canonical NORTH/SOUTH/UUID identities and backend unchanged. 59 samples remain 41 earlier/18 recent; line measurements unchanged; shot `evt_003876` remains 3279.5s. Wrong/future/cross-match rejection, buffered replay/refill, P5 focus/reveal/section resets, display-only PL mapping, optional speech/captions/cancellation and synthetic disclosure remain covered.

Only current execution/status sections in AGENTS/CURRENT_STATUS are updated. Old sprint acceptance and reviewer failures are historical, not silently rewritten. Human comprehension is UNCOLLECTED. The prior user listening acceptance is historical and was not re-performed or generalized by this repair. Local Chromium technical/geometry acceptance is not public, physical-device, other-browser or pixel-perfect visual certification. Existing hosted source and current Azure spend were not checked or changed. No dependencies, cloud/paid/remote speech, provider migration, commit/push/merge/deployment/publication or next milestone.

**STOP FOR USER REVIEW.**
