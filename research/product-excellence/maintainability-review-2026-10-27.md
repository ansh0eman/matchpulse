# Maintainability review — October 27, 2026

Scope: App request/publication lifecycles, shared shell and preferences, buffered playback, source-player inspection, Proof Lens/support validation, API error contracts, time-format imports and viewer source loading. This is a bounded source review plus regression reproduction, not a claim that every possible defect has been eliminated.

## Findings and corrections

| Severity | Trigger / implication | Correction | Evidence |
|---|---|---|---|
| P2 | A paused analyst projection is cancelled by switching back to Fan. If its transport/body wrapper later rejects with a generic error, the old catch can replace the newer ready Fan projection with an error and pause state. The success path already rejected aborted owners; the error path did not. | `App.tsx` now rejects aborted owners before publishing paused-view errors. No new replay authority or controller framework. | Controlled browser regression failed before the change with an obsolete error alert despite the old signal being aborted; passes after. This is a reproduced lifecycle failure under a controlled late-rejecting transport, not an assertion that a production user encountered it. |
| P2 | A non-OK JSON body of `null` causes a TypeError in the shared GET error decoder; an object-valued error becomes `[object Object]`. Ask had a duplicate, equally unvalidated decoder. | `api.ts` exposes shared `readJson`; GET and Ask accept only a nonblank string error or use the existing usable fallback. Successful data still goes through existing domain validators. | Regression initially received `Cannot read properties of null`; browser current-failure case reproduces the same text. Tests cover null/array/object/number/blank/non-JSON errors, preservation of declared errors, signal forwarding and a real view retry. |
| P3 | Six unrelated replay/source UI modules imported clock formatting from the Proof Lens component. This coupled a leaf utility to a large UI module. | Exact floor-based formatting moved to `time.ts`; Proof Lens and its consumers import the leaf module. No rounding, source-clock or display-text change. | Existing clock, timeline, source-player, proof and navigation assertions remain the behavior checks. |
| P2 test reliability | Some fixture-switch and first-load checks immediately started short UI deadlines before the new canonical view or independently verified support response existed. | Watch the actual view/proof before the action, validate source identity/clock/claim/support, then run unchanged UI assertions. Reuse the existing startup helper. | Original public laptop withheld and line-support traces retained. Test timeout remains60s; no retry, warming, fixed network sleep or deleted assertion. Cold public performance remains a separate limit. |

## Preserved boundaries

- App remains the single replay clock owner. The source-player inspector owns only match-scoped selection.
- Buffered playback already has explicit request identity/scope ownership; no rewrite was justified.
- Support and Proof Lens still independently validate match, claim, evidence cutoff and source arithmetic. The59-frame receipt is unchanged.
- Ask controls disable concurrent same-context requests and context generations invalidate old answers. No user-reachable same-context overlap was established, so the speculative controller refactor was not made.
- The cache/worker policy is intentional: one heavy source and one analytical worker within the existing memory budget. Adding parallel workers without measurement could break that boundary.
- CSS size/component length alone did not justify a migration or repository-wide formatting. Dense preference code remains a readability opportunity, not a demonstrated correctness defect in this review.

## Evidence and environment

Initial new laptop regressions:3failures, retained in `output/product-excellence/p12/hardening-red/`. The third report includes an overall timeout, but its raw assertion explicitly received the null-body TypeError rather than the expected usable error. After the repair, focused laptop/mobile run:6passed in7.0s, retained in `hardening-focused/`.

Typecheck, production build and whitespace checks passed after the source changes. Complete integration evidence is recorded in the hardening acceptance report once available; focused success does not substitute for it.

Final local integration is184passed/1intentional skip, with all80source/test/config hashes unchanged during execution. Backend215passed/2live opt-in skips; simulator10passed/typecheck. The compiled production-preview fault suite passed6checks. The final test-only refinement isolates15malformed variants and validates real recovery for each; focused public checks passed36/36. Complete public release acceptance remains separate from those focused results.

The unmodified public baseline was127passed/1skipped/21failed. macOS sleep-log intervals overlap many later failures, and several traces explicitly contain `ERR_NETWORK_CHANGED`, including HTTP200 headers followed by failed asset/body transfer. Those responses must not be counted as successfully received solely from the status. Two initial laptop failures had no sleep overlap and exposed real readiness-prerequisite problems. All public failures remain an open gate until a complete stable rerun succeeds; none is discarded as harmless latency.

No detector, backend inference, observation, experiment, fingerprint, consumed holdout or lockfile was edited. No paid provider calls, new dependency, Azure configuration change, commit, push or deployment occurred during this review.
