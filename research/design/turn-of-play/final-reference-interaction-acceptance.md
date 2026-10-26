# Turn of Play — final reference depth and interaction acceptance

Date: 2026-10-26 (Asia/Kolkata)

## Result

The local Matchday layout now follows the reference's green-stage treatment. The green stage is a responsive 16:9 box; the pitch SVG retains its intrinsic proportions (`xMidYMid meet`), so green side gutters appear instead of stretching or cropping the field. The stage width and height cap respond to viewport dimensions: on short desktop windows the field reduces to keep timeline and replay controls visible; taller windows allow a larger field. Mobile keeps its natural 113:76 field box and vertical reading order. The “Open Proof Lens” action remains a single-line, full-width control for shot evidence.

The browser captures at 1440×900 and 1920×1080 show the selected pitch, timeline and replay transport together. The current 1366×768 desktop browser checks retain the play control in the viewport. The green side gutters are intentional and match the supplied reference; player positions and source geometry are unchanged.

## Verification performed

- `npm run typecheck --prefix web` — passed after removing the now-unused `fillBox` prop.
- `npm run build --prefix web` — passed after the final proportional-rendering cleanup.
- `MATCHPULSE_TEST_URL=http://127.0.0.1:5173 npm test --prefix web -- --grep 'matchday composition'` — **2 passed** (laptop and mobile) after the final green-stage/fit treatment.
- `MATCHPULSE_TEST_URL=http://127.0.0.1:5173 npm test --prefix web -- tests/final-reference-interaction.spec.ts` — **12 passed** across desktop and mobile after the Matchday geometry change. This covers the interaction suite; it does not replace the repository-wide suite.
- A broader `npm test --prefix web -- --reporter=dot` run ended **1 passed, 2 failed, 90 skipped** (exit 1, approximately 10 minutes). The compact command output did not retain failing test names/diagnostics and the later focused run replaced its JSON report. Treat the broad suite as failed/inconclusive; no failures are claimed fixed by the focused passes.
- `git diff --check` — passed after writing this record and updating current status.

## Visual evidence

### Desktop light and dark

![Loaded Matchday light, 1366×768](../../../output/playwright/turn-of-play/development-laptop-matchday-light.png)

![Loaded Matchday dark, 1366×768](../../../output/playwright/turn-of-play/development-laptop-matchday-dark.png)

![Loaded Matchday light, 1440×900](../../../output/playwright/turn-of-play/development-matchday-light-1440x900.png)

![Loaded Matchday light, 1920×1080](../../../output/playwright/turn-of-play/development-matchday-light-1920x1080.png)

### Mobile

![Loaded Matchday light, 390×844](../../../output/playwright/turn-of-play/development-mobile-matchday-light.png)

![Loaded Matchday dark, 390×844](../../../output/playwright/turn-of-play/development-mobile-matchday-dark.png)

### Interaction states

![Selected key moment and arrival ring](../../../output/playwright/turn-of-play/final-laptop-key-moment-arrival.png)

![Three evidence steps complete](../../../output/playwright/turn-of-play/final-laptop-steps-complete.png)

![Mobile selected key moment and arrival ring](../../../output/playwright/turn-of-play/final-mobile-key-moment-arrival.png)

![Mobile evidence steps complete](../../../output/playwright/turn-of-play/final-mobile-steps-complete.png)

## Limits and worktree state

- Full-suite failures remain unresolved because their test names and diagnostics were not preserved. The next technical review should rerun the suite with failure output retained before treating the full frontend regression as accepted.
- Visual comparison covered the listed captures and loaded Matchday states, not every browser, zoom factor, or OS rendering combination. The earlier full visual acceptance record remains the source for Investigate, Proof Lens and Studio captures.
- No backend analytics, fixtures, evidence calculations, playback chronology, provider behavior or frozen data were edited in this iteration.
- The worktree had extensive concurrent and untracked changes before this iteration. They remain untouched; no files were staged, and nothing was committed, pushed or deployed. Local frontend/backend servers were left running.
