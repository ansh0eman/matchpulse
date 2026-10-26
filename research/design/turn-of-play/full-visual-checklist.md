# Turn of Play — complete visual implementation checklist

Status for the full visual pass requested in `full-visual-implementation-prompt.md`. This checklist records the work in this pass; the Step 1 and Step 2 records remain historical. Detailed evidence and limits are in [full-visual-acceptance.md](full-visual-acceptance.md).

| Surface | Implementation | Technical check | Visual review | Remaining issues |
|---|---|---|---|---|
| Shared tokens, shell, theme persistence | Implemented | Typecheck, build, theme tests pass | Light/dark loaded shell screenshots reviewed | No automated full-app contrast audit |
| Matchday field, score, timeline and transport | Implemented | Playback, layout, responsive and source assertions pass | Reference-scale, laptop, transition and mobile captures reviewed | Mobile uses normal page scroll for lower controls |
| Matchday investigation / positional / incident / withheld | Implemented | Source arithmetic, clocks, samples, availability and withheld tests pass | Positional and withheld states reviewed in both themes | Dense event labels can converge on source locations |
| Investigate, restricted Ask and recap | Implemented | Existing experience/browser checks pass | Investigate light/dark loaded captures reviewed | Existing functionality remains bounded by source availability |
| Proof Lens summary, method and audit | Implemented | Navigation, keyboard focus, exact evidence and theme checks pass | Three sections captured in light/dark; representative captures reviewed | Dense technical tables retain their existing contained scrolling |
| Studio / recorded workflow | Implemented | Typecheck/build and existing workflow checks pass | Studio light/dark captures reviewed | Recorded execution only; no new live model capability added |
| Guided demo and program output | Implemented | Existing experience checks pass | Entry, active chapter and clean program-output captures reviewed | Source-grounded event labels can visually cluster on the opening-goal frame |
| Responsive, keyboard, reduced motion and transient states | Implemented | Laptop/mobile targeted tests pass; 768px width has no page overflow | 390×844, 768×1024, 968×704 and 1366×768 loaded captures reviewed | A human comprehension session is outside this visual acceptance |
| Development and production preview | Checked | Dev, API and Vite preview returned HTTP 200 | Captures taken from loaded Vite production preview | No Azure/deployed verification was performed in this scope |

## Screenshot evidence

See [full-visual-acceptance.md](full-visual-acceptance.md) for embedded Matchday light/dark/mobile, Investigate, Proof Lens Summary/Method/Audit, Studio, guided, program-output and withheld screenshots, plus the reference-scale capture.

## Preservation

The worktree was already dirty at inspection. Existing concurrent documentation, package metadata, Priority 2/Priority 5 research and generated/private artifacts were preserved. No files were staged and no commit, push, deployment, cloud operation or paid call was made.
