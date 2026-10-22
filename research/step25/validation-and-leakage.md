# What was validated, and its limits

Frozen artifact `6b8f4682ec3e8c4b966c8821fd006a89b14746dca49667cbbafbf296d7c8ec24` binds inference files, old event components/config, protocol, generator/projection, lockfile, research comparator/common code, trained weights and development/validation seed manifests. The final holdout was generated only after that freeze; no inference parameter or frozen source was repaired after inspection. Tests confirm exact exclusion of Step 1/Step 2 families and separation 24/16/40. The now-inspected holdout cannot be used to tune another model; a new untouched test set is required.

## Executed checks

| Property | Actual evidence |
|---|---|
| Python regression/adversarial suite |58 passed, including 22 new Step 2.5 cases |
| TypeScript suite / strict typing |10 passed; tsc --noEmit exit0 |
| Extraction parity |Full seed 11 matches old canonical hash; scheduled 1/2Hz case; all 28 real diagnostic pairs share canonical hashes and integer-second geometry |
| Raw/cache replay |280/280 final matches, plus 28 development diagnostics; exact comparison records and scored alert signatures |
| Deterministic replay |280/280 fresh detector runs |
| Real raw-prefix checks |280/280 at predeclared 3300/3900/4500s cutoffs cycling by match ordinal |
| Evidence geometry |180/180 packs recomputed from raw observable frames |
| Separate coordinate arithmetic |180/180 line3/line4/q20/proximity/density10 checks without calling the feature extractor |
| Event confirmation |180/180 packs recomputed from canonical event prefixes |
| Feed quality |1566370 holdout frames;507 inactive-owner frames excluded;0 sampling gaps |
| Actual roster exposure |1780 substitutions;54 dismissals across280 matches; active-count histogram recorded |

Strict nested schemas reject intent/target/policy/scenario/RNG/control metadata; loader requires opaque UUID filenames and monotone samples. Canonical ingestion rejects administrative event types and source-index gaps. Synthetic tests exercise missing frames, sparse/mixed contexts, GK exclusion, halftime rotation, changed active roster, tampered facts/references, wrong direction/team and duplicate temporal matching. Team detectors/windows are independent per replay. Raw-prefix tests clip events as well as positions so future aggregates cannot influence earlier scored output.

These are concrete attacks and finite tests, not a proof of universal information-flow security. Per-frame arithmetic and feature extraction have separate coordinate checks for five core facts; full 13-feature recomputation still shares the underlying feature definition. No independent blinded football-pattern labels were collected. Objective B precision/recall is undefined; it would be circular to label episodes using the same 7m threshold and claim 100% classification.

## Cost and compactness

The full verification harness takes 295.4s, peak RSS 613.7MiB. Median per-match loading+replays+prefix+pack verification is 1.051s, p95 1.157s. These are local offline harness costs, not network/service latency. Candidate summaries amortize shared feature comparisons; pipeline throughput cannot be inferred from those fields alone.

Median full evidence pack is 12,242 bytes; compact agent facts 3,718 bytes. The two executed full CLI examples each finish in about0.66s locally, including parsing, replay and export; two examples are not a throughput/load test. Full raw histories are not an agent prompt. New bulk data/cache/exports stay ignored and reproducible; examples retain complete geometry references with full-source hashes. Exact versions and command statuses are in runtime.json and command-results.json. No cloud/LLM calls, Foundry, frontend or deployment are part of this implementation.
