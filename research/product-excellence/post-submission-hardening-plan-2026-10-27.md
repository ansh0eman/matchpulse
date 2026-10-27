# Post-submission hardening and capability review

Authorized October 27, 2026: close the outstanding public regression gate, inspect maintainability and fix concrete issues, then investigate improvements to current capabilities. Execute sequentially; the submitted entry and historical results remain preserved.

## 1. Reproduce the public gate

Run the complete applicable frontend suite against the current public deployment with existing assertions, timeouts and one worker. Exclude only the two existing development-only hook-module imports. Retain the raw log, complete JSON, screenshots and failure traces in a new dated output directory. Record source/test/deployment identities and every case disposition. A focused rerun never replaces the complete result.

## 2. Resolve every failure

Trace failed cases through browser state, request ownership, actual API responses, source/proof validation and timing. Reproduce product defects locally before changing implementation. Repair incorrect test prerequisites using actual readiness evidence without deleting assertions, extending timeouts merely to obtain green results or treating all latency as harmless. Retain failing baselines. Run focused checks after each justified change, then the complete applicable suite on the final candidate. Any deployment follows the existing archive/privacy/license/spending-protection gates; no new paid inference or billing changes.

## 3. Maintainability audit

Inspect App/shell/session state, playback request ownership, source and proof lifecycles, shared controls, styling ownership, endpoint caching and error contracts. Produce a severity-ranked report with source locations, concrete triggers and proposed changes. Fix demonstrated duplication/ownership problems that affect correctness or near-term maintenance. Preserve the single replay authority, independent evidence recomputation and failure states. Avoid an unmotivated framework migration or repository-wide rewrite. Run only checks relevant to changes, followed by the necessary integration checks.

## 4. Capability discovery

Inventory what the system already supports and what users cannot yet accomplish. Research approaches using current primary sources where needed. Compare three development paths: deeper exploration of verified existing observations; a genuine incremental match producer; and new analytics evaluated with fresh untouched data. Rank by user value, information available, evidence burden, implementation effort and failure risk. Distinguish source-supported features from ideas requiring new data/contracts/evaluation.

Produce a short recommended design and milestone queue with measurable acceptance criteria. New analytical claims never reuse or retune the consumed holdout. Preserve the frozen 7m detector, source fixtures/fingerprints, previous negative conclusions and human-comprehension status. Seek a specific product-direction decision after presenting the concrete options; do not silently add new cloud services, dependencies or speculative features.

## Completion evidence

- Full public result with exact counts and unresolved failures explicitly named.
- Maintainability findings and fixes with appropriate regression evidence.
- Capability inventory, options and a prioritized design proposal.
- Current status updated without rewriting historical reports.
- Private research, credentials, user recordings and generated bulk outputs excluded from commits.
