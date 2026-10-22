# Step 2.6 — Frozen detector, verified presentation

This is a **presentation quality gate**, not a new tactical-change detector. It does not retune the frozen 7m positional threshold, replace Step 2.5 evaluation, or change previously reported precision (47.54%), recall (36.25%) or false-alert frequency (0.35 unchanged-match alerts). These scores remain below the original targets.

## Exact flow

```text
frozen PositionalDetector -> original positional EvidencePack [research, all alerts]
    -> independent raw-geometry and canonical-event verification
    -> observation recency + temporal-coverage checks
    -> deterministic, narrowly worded verified line claim OR suppression
    -> future Microsoft Foundry fact registry [not implemented]
```

Implemented in `backend/src/matchpulse/tracking/presentation.py`, exposed in `tracking/cli.py`.

## Quality policy (initial, not benchmark-tuned)

- Evidence references must exist; no future frame may contribute.
- Independently recompute the numerical geometry and fused event confirmation.
- Enforce the **original detector's** minimum counts: 12 reference and 6 recent eligible frames under the selected configuration.
- Latest contributing recent tracking observation must be at most **60 match-clock seconds** old at alert emission.
- Recent eligible observations must span at least **30 seconds**, and reference observations at least **60 seconds**. These spans are conservative display checks, **not** proof of statistically independent samples.
- An episode that fails any check is retained in research output but **must not** be advertised as a live verified insight.

The historic unchanged-match example emitted at 1350s uses recent observations ending at 1218s (132s old): this is suppressed from narration even though its numerical line shift is real. The recorded strong example at 3360s has a current recent observation and enough time coverage to pass the recency/span screens, subject to recomputation of its full inputs.

No accuracy numbers are claimed for this new post-filter; its effect on coverage, precision or recall requires a **new untouched test cohort** before publication as an accuracy improvement.

## Claim semantics

An approved narrative describes the **average longitudinal position of the three deepest observed outfielders** during comparable opponent build-up samples, including before/after metres, support, reference and recent windows, detected time and latest relevant observation time.

It does **not** establish a coach's tactical instruction, objectively effective pressing, calibrated probabilities or real professional football performance. A claim says what was observed *during samples*, never that the line is necessarily still positioned that way now.

## CLI outputs

Run the original documented command with `--events`, `--config`, `--output backend/output/step25/demo.json` and optionally `--debug`.

- `demo.json`: **research-only**, all original EvidencePacks.
- `demo.facts.json`: **research-only**, compact unscreened facts (legacy compatibility).
- `demo.presentation.json`: all alert presentation decisions, reasons and observation freshness.
- `demo.broadcast.json`: **only verified presentation-eligible claims**, safe to expose to an eventual fact registry.

The CLI distinguishes research alerts from eligible stories and reports each suppression reason in debug mode. Do not send `demo.facts.json` directly to an agent as verified live narration.

## Research freeze and next engineering step

Retain Step 2.5's source/config hashes, holdout metrics, and negative results. The evaluated classifier of hidden tactical interventions is still below accuracy targets.

**Next:** deterministic multi-event Match Story Engine -> verified facts registry -> Microsoft Foundry Tactical Analyst -> Broadcast Narrator -> numeric/claim grounding verifier with safe fallback -> playback dashboard.

This gate is only one input to that future story registry. Goals, high-turnover-to-shot sequences and other match moments need their own explicit event definitions, independent tests and claim boundaries.
