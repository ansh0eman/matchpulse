# Final verdict: NO-GO for Microsoft Foundry integration

Step 2 implementation and independent evaluation are complete. The software reliably validates/replays observations and produces auditable facts; its alert accuracy is insufficient to justify the next development step on narratives. Do not promote the current research candidate into a convincing tactical-detection demo by hiding failures.

## A. Selected detector

Original rolling spatial-recovery comparison, W=480s, threshold=2, two consecutive one-minute-observation checks, minimum 8 recoveries/window, mean shift>=6m, high-share shift>=.08, cooldown=900s, separate team/period state. Selected solely from development results as best active measured F1 after correcting the silent-detector selection trap. Frozen source/config SHA: `cb8848b5bfca606b88abe27b8b42e35650cc6f0acafbe5719e49741e16ea9812`.

## B. Actual independent evidence

32 unseen seed families, 160 matches total; 96 primary accuracy matches and 64 ambiguous stress cases. 64 eligible bundled/moderate interventions: 31 detected, 33 missed. Precision **13.3%**, recall **48.4%**, F1 **0.209**; **84/32=2.625 alerts per no-external-intervention match**. Median matched delay **7.0 minutes**, conditional on successful matching. Internal targets precision>=.75, recall>=.70 and null alerts<=.25/match were not met; the delay target alone is not enough.

The model is not a coach-intent classifier. 'False' here means unmatched to the external intervention target; naturally adaptive synthetic matches can contain real observed changes. Those limitations do not justify reporting better accuracy by relabeling after the fact. Detailed denominators, uncertainty and strata are in step2-evaluation-results.md/failure-analysis.md.

## C. Comparison

Rolling had the best active development F1 in a bounded 20-configuration comparison. Guarded Page-Hinkley had lower held-out sensitivity/precision in the frozen candidate. ADWIN emitted no alerts, with undefined precision/delay and zero recall. Location/share ablations did not fix false alarms at their tested settings. Offline PELT was researched but excluded from online claims; neural methods are unjustified. These measurements reject these particular configurations, not every possible implementation of those algorithm families.

## D. Reliability

All 417 EvidencePacks recomputed correctly; all 160 held-out matches had deterministic replay and passing prefix checks. Strict canonical validation, opaque identity, source-index continuity, finite coordinates, real cumulative-counter increments and separate metadata/inference paths are implemented. Exact commands/exits are in verification.json; the current pytest/TypeScript results are in README. The upstream simulator was not modified. Step 1 behavior passed its existing regressions.

## E. Known weaknesses

Frequent ordinary-match spatial swings, wrong-team alerts and pre-intervention alerts dominate precision; moderate/late/sparse changes can be missed. Eight-minute local evidence does not inherit Step 1's 30-minute exploratory effect size. Two related spatial features do not create independent evidence. Synthetic uniform-strength rosters, sparse shots and engine adaptivity limit realism. The code only seeks upward spatial recovery shifts, not all tactical states. Whole-prefix evidence is intentionally verbose and memory grows with match size.

## F. Claims supported now

- A pinned licensed simulator feeds a replaceable canonical event contract and a strict Python inference package.
- The analytical path is causal in implemented replay and tested prefixes, deterministic on these fixtures, and supplies verifiable event-level facts.
- We compared rolling, Page-Hinkley and ADWIN and exposed real independent failures rather than claiming a fixed-time synthetic trigger was intelligent detection.
- All reported held-out numbers come from included seed families/runs, with separate null and ambiguous stress analyses.

## G. Unsupported claims

Do not claim reliable unseen tactical detection, calibrated alert confidence, real Premier League validity, observed coaching decisions, pressing-only causal effects, goal causation, real-world prediction, Foundry integration, dashboard or deployment. No claim that all possible detectors or simulator scenarios are intrinsically unsuitable follows from this grid. The current evidence says **this tested feature/detector pipeline is not ready**.

## H. Decision and next task

**NO-GO for Foundry integration.** Preserve ingestion, signal tests, EvidencePack contract, CLI and evaluation machinery. Next implement a bounded analytics/target-repair experiment on development data, reserve a new untouched seed-family test set, and require adequate precision/recall/null-rate behavior before narration. Do not tune again on these 32 holdout families and call it confirmatory evidence.

## I. Deferred agent contract

After a detector clears validation: **EvidencePack -> Foundry Tactical Analyst -> Broadcast Narrator -> deterministic Grounding Validator**. Input is strictly validated `EvidencePack` schema v1: match/detection IDs, emission time/team, observed change/direction, exact windows, before/after facts, method/uncalibrated score, complete references, definitions and quality warnings. Agents should cite stable fact keys (e.g. facts.after.high_recovery_count), never recalculate authoritative numbers. Grounding validation must resolve citations/numeric references and preserve uncertainty. Full prefix references may later be served by a resolver while the agent receives validated fact handles. That API/service optimization and all agents are planned, not implemented.
