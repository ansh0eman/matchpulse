# CONDITIONAL GO — verified line facts; intervention target fails

**Outcome B.** Useful observable defensive-line information exists and replicates on unseen families. Broad tactical-intervention identification remains below target. Proceed only with a tightly scoped fact-explanation prototype; do not build the presentation around a claim of reliable hidden high-press/coach-intent detection.

## The result that matters

Strong line shifts: held-out paired mean +11.91m,95% family interval+11.01 to+12.68,37 supported pairs / 40. Moderate+3.96m; press-only+0.14m with interval crossing zero. Closing-down and pressing-zone density do not show consistent high-press separation. The primary research question therefore has a positive answer for line geometry and a negative/inconclusive answer for the broader pressure premise.

Selected fused 7m detector,40 held-out families, 280 matches,200 primary matches,160 external targets:

| Gate | Actual600s | Target | Assessment |
| --- | --- | --- | --- |
| Precision | 47.54% [33.80%, 65.00%] | >=75% | FAIL |
| Recall | 36.25% [30.00%, 41.88%] | >=70% | FAIL |
| F1 | 0.411 | reported, no separate target | limited |
| Null alerts/match | 0.350 [0.175, 0.525] | <=.25 | FAIL point estimate |
| Median matched delay | 195.0s [150, 210] | <=480s | PASS, conditional on matched targets |
| 95th percentile matched delay | 454.5s | report tail | misses excluded |
| Evidence arithmetic | 180/180 | 100% | PASS for executed packs |
| Raw/cache, deterministic and prefix | 280/280 each | 100% tested | PASS for executed tests |

58 hits,102 misses,64 unmatched primary alerts;14 alerts/40 unchanged matches. Strong33/40; moderate5/40; press-only0/40; low-block20/40. At1200s, precision48.36%, recall36.88%, F1 0.418; only one extra hit. Full uncertainty/denominators are in evaluation-results.md. This holdout is now consumed; no retuning is justified without a fresh test set.

## Quality review

| Dimension | Review |
|---|---|
| Scientific credibility | Registered families/targets, feature-first decision, validation freeze, negative results retained; single synthetic engine and supported-window selection limit inference |
| Football correctness | Explicit GK/direction/possession/context geometry; no assertion that proximity proves pressing success |
| Generalization | New seeds and declared variations tested; team/time confounded, same squads/engine, unseen policy families/real matches untested |
| False positives | Improved versus event baseline but still above null target; intervention claim fails |
| Interpretability | Metres, counts, windows, independent arithmetic and complete resolvable references |
| Evidence integrity |180 packs numerically verified, including failed external-target cases; not pattern-label accuracy |
| Reproducibility | Pinned source, locked dependencies, source/config hashes, manifest hashes, scripts and small examples |
| Maintainability | Tracking subpackage separate from unchanged Step2 inference; optional TS callback, explicit contracts,58 Python / 10 TS tests |
| Operational cost | Local deterministic analytics, compact agent facts; harness runtime/memory measured, cloud latency/cost unmeasured |
| Integration readiness | Suitable only for constrained facts-to-narrative experiment; no Foundry/UI/deployment implemented |
| Differentiation | Replicated observability study and falsifiable evidence path; no invented algorithm novelty or winner claim |

The next engineering boundary and required claim restrictions are specified in product-decision.md. Experimental decisions remain in protocol.json/decisions.jsonl and freeze-receipt.json so context/model changes cannot silently rewrite methodology.
