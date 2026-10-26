# Product Sprint 1 — progress ledger

Specification: `product-sprint-1-prompt.md`, revision **checkpointed execution, 26 October 2026**. User launch authorizes this complete sprint over historical P6.1-only text. No parallel agents, external operations, dependencies or Git publication.

Starting HEAD: `6fa99c854e17e64c2b0a3934e630de817b64872f`; extensive pre-existing dirty/untracked frontend and research work, index empty. Preserved snapshots/hashes: `output/product-sprint-1/stage-a-baseline-20261026-01/starting-*`.

| Stage | Status | Changed files | Evidence paths | Remaining issue / next action |
| --- | --- | --- | --- | --- |
| A | passed | matchday.css; broadcast.spec.ts; ledger | stage-a-baseline-20261026-01; stage-a-repair-20261026-02; stage-a-repaired-baseline-20261026-03 under output/product-sprint-1 | 92 passed / 1 deliberate laptop skip; no unexplained cases |
| B | passed | App; shell/*; views/*; ui/Surface; playback/source/useBufferedReplay; useStorySupport; owning CSS; sprint-session tests | output/product-sprint-1/stage-b-* | 53 pass/1 named skip +20 pass +4 pass; typecheck/whitespace pass |
| C | passed | editorial/timeAxis; timeline/transport; App selection; nullable diagnostics; owning styles and focused tests | output/product-sprint-1/stage-c-complete-20261026-07 | 53 pass / 1 named skip; provisional editorial policy, not usefulness validation |
| D | passed | clubs/*; shared preferences; Pitch/Proof/Investigate and clean-output labels | output/product-sprint-1/stage-d-repaired-20261026-03; stage-d-provenance-20261026-01 | 30 pass; 20 asset hashes verified; display-only mapping |
| E | passed | commentaryCopy/useCommentary/voiceChoices/CommentarySettings; transport; tests | output/product-sprint-1/stage-e-repaired-20261026-02; stage-e-local-voice-probe-20261026-01 | 26 pass; separate user listening acceptance; platform voice limits retained |
| F | passed | buffering/program/note display repairs; tests; two acceptance records; current execution controls | output/product-sprint-1/stage-f-integrated-20261026-03; stage-f-visual-20261026-03 | 116 pass / 1 deliberate skip; build/typecheck/whitespace pass; STOP FOR REVIEW |

## Stage A

- API 8010 and frontend 5173 return HTTP 200; API catalog returns six canonical scenarios with their UUIDs. Existing processes reused, not terminated.
- Login-shell default `node --version` in the repo reported v26.7.0; installed Node24 is available at `/Users/ansh0eman/.nvm/versions/node/v24.19.0/bin`. Commands explicitly prepend that bin directory.
- Active action: complete baseline. No app/test changes made yet.

### A baseline attempt 01 — failed and retained

- Exact command: Node24 PATH + `MATCHPULSE_TEST_URL=http://127.0.0.1:5173 PLAYWRIGHT_JSON_OUTPUT_FILE=<absolute run>/results.json npm test --prefix web -- --reporter=list,json --output=<absolute run>/traces`, piped through `tee <run>/raw.log` before Distill; pipefail enabled, exit 1 retained.
- JSON/raw totals: **91 passed / 1 failed / 1 intentional skip**, all 93 intended cases accounted for; no unstarted cases. Distill incorrectly summarized 91 as 1; raw JSON is authoritative. Original historical 90 not-run classifications cannot be reconstructed because that run lost its raw evidence; this new baseline executed the complete set.
- Only failure: mobile `broadcast.spec.ts:175`, click at line258 “Select The opening goal”, 60s timeout. Trace: `stage-a-baseline-20261026-01/traces/broadcast-explicit-moments-4f6fd-sappear-before-availability-mobile/trace.zip`; extracted failure screenshot and diagnosis script/log retained in that run directory.
- Only skip: laptop `priority5-ux.spec.ts:113`, explicitly mobile-only pointer reveal. Its mobile counterpart passed.
- Reproduction: expanded Source timing overflows mobile row, visual viewport offset and enlarged innerHeight (1009 vs viewport844); normal click fails with md-arena/nav interception. Fix owning mobile timing layout to wrap on its own row; add overflow assertion to existing test. No force click, timeout increase or skip.
- Ten fixture manifest hashes verified, 31,984,795 bytes. Active stage remains A; focused reproduction then full repaired baseline required.

### A exit gate — passed

Repaired complete baseline command retained in `stage-a-repaired-baseline-20261026-03/command.txt`; **92 passed / 1 deliberate skip / 0 failed / 0 flaky**, 538,354ms, exit0. All 93 intended cases accounted for. Original failure remains in attempt01. Focused repaired case:1 passed/4.4s. Typecheck exit0 and diff whitespace passed. Fresh timing screenshots inspected laptop/mobile in both themes (`stage-a-repair-20261026-02/*-source-timing.png`); geometry JSON shows mobile390×844, scrollWidth390, visualHeight844 (formerly innerHeight1009). Only CSS/timing test source changed from starting fingerprint.

## Stage B

Plan: shared AppHeader/SourceDisclosure/preferences and small UI surfaces; extract Investigate/Studio/guide presentation; retain one proof host; isolate source geometry from audience-sensitive data and remove preference-triggered physical replay restarts. Keep segment validation unchanged in meaning. Capture before/after requests and delayed transitions; run focused preservation checks, typecheck, whitespace and light/dark laptop/mobile visual review.

### B exit gate — passed

- `run-tests.sh stage-b-focused-20261026-01 tests/sprint-session.spec.ts tests/theme.spec.ts tests/evidence-navigation.spec.ts tests/priority5-ux.spec.ts tests/playback-reliability.spec.ts tests/buffer.spec.ts`: **53 passed / 1 deliberate laptop mobile-only skip**, 327,027ms; all54 cases accounted for.
- `run-tests.sh stage-b-followup-20261026-02 tests/sprint-session.spec.ts tests/experience.spec.ts tests/final-reference-interaction.spec.ts`: **20 passed**,90,138ms. New checks compare source geometry with actual API view during delayed projection, change Follow while playing/paused, and retain clock/speed/eligible selection.
- `run-tests.sh stage-b-scope-20261026-03 --grep 'comparison support scope|support receipt is requested'`: **4 passed**,17,431ms. Added synchronous receipt-key guard after discovering prior support state could remain for one render. Typecheck exit0; whitespace clean.
- Each run contains command, raw log, source fingerprints, complete JSON/summary and exit status; failure traces are configured. Source validators in segment.ts unchanged.
- Before capture: `stage-b-before-20261026-01/network.json` recorded0 player titles/full-field loading on delayed preference; header64px scrolled to y=-600. After: new session test retains mounted22-player geometry, validates coordinates/score against canonical view, source clock advances under delayed projection, stale responses rejected, header62pxdesktop/104pxmobile remains y0, unchanged catalog/activity request count on view toggle. Totals are not a performance comparison: the after journey performs additional preference changes. StrictMode causes2 initial catalog/activity requests (one aborted); none added on view/theme changes.
- Fresh top/scrolled Ask/recap, Studio decisions/disclosures, Proof verification banner and Matchday screenshots inspected for laptop/mobile/light/dark in followup02/traces/sprint-session-shared-head-e6dca-st-have-consistent-geometry-{laptop,mobile}. Padding/corners/containment and native-marker suppression inspected. One primary Open Proof Lens per explanation surface, one dialog host; prior proof identity/receipt/focus tests pass.

## Stage C

Plan: pure editorial selector after visibleSnapshot; shared source-time axis for rail/transport; original-ID clusters at honest anchors; independent moving playhead/arrival/history selection states; replay-second prominence and recorded diagnostic timing. Preserve source receipts, P4 validators and P5 interactions. Update only assertions whose product meaning deliberately changes; retain identity, arithmetic, focus and failure protections.

### C attempt01 — interrupted for repair, not acceptance

`stage-c-focused-20261026-01` retains all raw/JSON/traces/source fingerprints, exit130 after deliberately interrupting the owned Playwright process.4 passed,4 failed,1 interrupted,43 unstarted. Failures include withheld setup waiting for a deliberately absent current-proof action, plus Matchday startup render crash: optional arrival scenario compared equal to an undefined catalog scenario, then read seekRevision on null. Browser pageerror reproduced the null dereference; explicit null guard added. Preserve source assertions and existing60s timeout. Fix helper to assert withheld/no-proof directly; rerun smoke then the complete stage selection. Pure editorial policy boundary test passed in this attempt; it does not establish the whole stage.

### C attempt04 — failed and retained

Complete stage selection:47 passed/4 failed/1 named deliberate skip,270,663ms, exit1 (`stage-c-focused-20261026-04`). Failures: laptop/mobile shot-button-fit setup did not open its clustered original-ID row; mobile source-zero test inspected a placeholder clock before canonical source readiness; mobile historical-seek case left its cluster open across seek, covering a fixture button. Reproduced source-zero canonical API returns2 original0s incidents; source readiness is now awaited via the existing enabled Play contract/60s fixture-ready pattern, keeping the5s coordinate assertions unchanged. Real popover lifecycle repair closes on explicit seek/scenario change and outside pointer interaction without stealing new-target focus; Escape restores trigger focus. No assertion/timeout removal or weaker receipts. Next: smoke failures then complete repaired stage selection.

C repair05 targeted the three failing journeys in both projects: **6 passed**,41,791ms, exit0. Added explicit cluster seek/outside dismissal (real UI repair), retained keyboard focus on intentional selection, source-loaded readiness, and original-ID shot navigation. All failures remain in attempt04. Added actual browser29.75/30/30.25 prominence boundaries, paused/speed behavior, source-duration endpoint and dark history captures to the final complete stage selection.

C attempt06 deliberately interrupted after an incorrect newly added endpoint assertion:17 passed/1 failed/1 interrupted/35 unstarted, exit130. Test expected forward-to-end to clear a still-eligible explicit line selection, contradicting the specification. Actual app correctly preserved it; test now asserts the exact retained story ID and Selected moment label while separately verifying end score/playhead and no stale arrival. This is a test expectation correction, with the failed record retained. No app behavior or meaningful validation weakened. Full complete stage selection is rerun in07.

### C exit gate — passed

Complete stage selection07: **53 passed / 1 intentional laptop mobile-only skip / 0 failures / 0 flaky**,214680ms, exit0. Command/raw/JSON/exit/source fingerprints retained in `output/product-sprint-1/stage-c-complete-20261026-07`. Typecheck0 and whitespace clean. Inspected fresh laptop quiet107/light and mobile historical/end dark captures; correct source-time playhead, distinct historical selection, unchanged +10.01m /59sample receipt. Earlier failures and interrupted attempts remain retained.

## Stage D

Implement club registry with reviewed provenance, display-only mapping, shared header preferences and local voice-safe presentation propagation. Canonical source objects remain untouched. Official membership and kit pages reread26October2026; all20 badge hashes checked separately.

D attempt01:27 passed/1 deliberate skip,94045ms. Attempt02:23 passed/1 failed,95992ms; retained keyboard-menu race (deferred rAF focus loses immediate End). Corrected menu opening to synchronous layout-effect focus; original assertions retained. Investigate colours and Proof mapping added; speech temporarily maps approved prose pending Stage E adapter.20/20 fetched badge SHA256s match research records (`stage-d-provenance-20261026-01/badge-checks.json`).

### D exit gate — passed

Repaired complete D selection03: **30 passed /0 skipped /0 failures /0 flaky**,116432ms,exit0. Attempt01 additionally27pass/1 deliberate skip across navigation/P5. Typecheck0 and whitespace clean.20 badge hashes match; current official membership and City sky-blue/United red roles verified against supplied primary URLs. Fresh default City/United light/mobile and contrasting Arsenal/Liverpool light/laptop +dark/mobile screenshots inspected under D03/traces. Header preferences inside lavender row, mapped pitch/Investigate/Proof and exact59sample/+10.01m preserved. Club-only changes issue0 API requests. Canonical IDs and raw evidence unchanged. No speech-quality claim; natural-copy work follows in E.

## Stage E

Plan: deterministic supported complete spoken templates, actual local-English voice/rate selection, single replaceable utterance, exact-reference deduplication with priority upgrades and generation-guarded cancellation. Mocks never speak; real local voice availability/listening recorded separately.

E attempt01:24 passed/2 failed,223614ms,exit1. Both failures are new test setup using visible Preview commentary text instead of the existing full accessible label. Corrected to the actual accessible action without changing timeout/assertions. Existing arrival/seek and new supported-copy checks passed. Real local probe found41 English local voices (including novelty effects); explicit novelty filtering and conservative Daniel default added. Separate local Daniel review clip generated; model audio-input tool explicitly reports audio unsupported. Listening is pending real user review; mocked success is not listening evidence.

### E exit gate — passed

Repaired E02 complete selection: **26 passed /0 skips /0 failed /0 flaky**,111628ms,exit0; typecheck0. Supported-copy, exact identity, local voice/rate, one-utterance replacement, stale callbacks, pause/seek/view exit, mapping cancellation, captions and unavailable voices tested without real speech in tests. Real separate local browser probe:26 suitable local English voices, defaultDaniel; preview started and ended (~5.65s), recorded `stage-e-local-voice-probe-20261026-01/actual-browser-preview.json`. Known novelty effects excluded. Assistant audio input is unsupported, so it does not claim listening. User listened to representative OS-generated Daniel clip and answered **Yes, acceptable for this sprint**; recorded separately in listening-review.json. Same local voice, not a cross-platform quality guarantee or participant study.

## Stage F

Run unfiltered integrated frontend suite, retain all raw/JSON/classifications/exit/source hashes, typecheck/build/whitespace and final visual/reference review. Write acceptance/current-control records only after actual results. No external operations.

### F integrated attempt01 — failed, retained

Unfiltered **115 passed /1 intentional skip /1 failure /0 flaky**,636098ms,exit1; all117 intended cases executed. Only failure:desktop P4 buffering badge hidden by new redundant-label CSS. Restored visible genuine buffering/loading status; kept normal Recorded replay metadata in source utility. Visual review additionally found duplicate mapping notes and preferences leaking into program output; removed only duplicate Summary note, kept one shared note, hid preferences in clean output and mapped its caption with explicit synthetic disclaimer. Added assertions for note uniqueness and clean output; unchanged P4 visibility assertion. Focused repair02: **6 passed**,38208ms,exit0 across both viewports (buffer delay, program output, mapping). An optional formatter API was unavailable in native TypeScript7; no install or automated rewrite occurred. Commentary owner was manually line-formatted for readability before the final full run, without changing its behavior. Full unfiltered rerun is required.

### F exit gate — passed

Final unfiltered03: **116 passed / 1 intentional skip / 0 failed / 0 flaky**, 639.535s,exit0; all 117 intended cases executed. Source hashes remained unchanged through the run. Typecheck/build0; final whitespace clean. Final fresh visual03 sequential main/state capture scripts exit0 with no recorded overflow/page errors, same5s proof-readiness assertions; original visual02 contention failures retained. Inspected current light/dark desktop/mobile Matchday, source controls, Proof summary/method/audit, Ask/recap, Studio, guide, program and actual buffering states; equal-scale968×704 reference board retained. Wrote sprint/P6 acceptance and updated only current AGENTS/CURRENT_STATUS sections. Preserved original failures and historical records. Ten fixtures / 31,984,795 bytes and 14 research inputs unchanged; HEAD6fa99c8,index empty; no backend/dependency/cloud/Git publication operations. Voice review user-accepted separately from mocks; human comprehension remains UNCOLLECTED. **Stop for user review; no automatic next milestone.**

Final visual follow-up: long Brighton & Hove Albion / Nottingham Forest labels at mobile390×844 in both themes preserve56:00 and59-sample support, no overflow; `stage-f-visual-20261026-03/long-club-labels.json`. Exact final owned-path manifest:50 frontend/test paths plus5 records. Explicit-scope trailing-whitespace check found0; tracked diff whitespace exit0. HEAD remains6fa99c8; index/backend tracked diff empty; tested source hash differences0.
