# Turn of Play — Step 2 layout acceptance

**Status: implemented locally; ready for review.** This records technical and visual checks only. No participant session, commit, push, deployment, cloud call, or backend change occurred.

## Composition delivered

- Replaced the large match-context band and lower-third stage treatment with a compact archive label, score/clock strip, large observed-position pitch, and a 70/30 investigation rail on desktop.
- The rail presents Watch / Compare / Explain orientation, story-specific text, incident and replay times, a positional comparison card, explicit limitations, and the existing Proof Lens action. Shot and other event explanations do not inherit positional measurements.
- The timeline remains causality-filtered and horizontal below the pitch. The existing single replay transport, Fan / Analyst setting, favorite-team control, scenario selection, and program-output mode remain available.
- On narrow screens, score and pitch come first, followed by the investigation, transport, timeline, and settings. Tapping a timeline story reveals the selected explanation while preserving replay time and keyboard focus.
- Withheld current evidence uses the live diagnostic age and says why current comparison is unsupported; it offers no current-proof action. A historical story remains independently selectable.
- Positional support counts are requested once per immutable story identity, checked against the returned match, claim, and source time, and displayed only when the source proof response validates. Replay-clock ticks do not trigger that request.
- Reworked the Matchday visual rules to use shared light/dark tokens, violet actions, lavender surfaces, and the compact active navigation pill. The grass pitch and team markers retain their semantic colors.

## Visual comparison

Inspected `research/design/turn-of-play/reference.png` and loaded production-preview screenshots at 1366×768 and 390×844. The desktop retains the reference’s pitch-first 70/30 split, lavender investigation rail, and violet action hierarchy. Mobile stacks the pitch and selected explanation without horizontal page overflow. Both light and dark screenshots were inspected.

Selected evidence files (local generated output, not source-controlled):

- `output/playwright/turn-of-play/production-laptop-loaded-light.png`
- `output/playwright/turn-of-play/production-laptop-loaded-dark.png`
- `output/playwright/turn-of-play/production-mobile-loaded-light.png`
- `output/playwright/turn-of-play/production-mobile-withheld.png`
- `output/playwright/turn-of-play/production-laptop-incident.png`

The mobile withheld and incident captures are full-page. The loaded desktop captures are viewport-sized. At 1366×768 the scenario selector and audience/favorite settings remain below the first viewport and are available by scrolling.

## Verification

- `npm run typecheck` — passed.
- `npm run build` — passed; 4,584 modules transformed.
- `npx playwright test tests/matchday-layout.spec.ts --reporter=dot` on the development server — 4 passed across laptop and mobile projects. Covers layout width, actual source-proof support values, withheld behavior, non-positional incident content, theme transition, and no Proof request per one-second replay advance.
- Targeted playback/theatre/withheld regression checks — 6 passed across laptop and mobile.
- Broad development acceptance across Matchday layout, theatre, playback, Priority 5 UX, evidence navigation, theme, and broadcast — 48 passed, 1 skipped, 1 transient mobile theme readiness timeout. The timed-out theme case passed when rerun alone; its existing five-second readiness assertion was not relaxed.
- Production preview: layout plus theme acceptance — all 4 layout checks and the other 6 theme checks passed. The remaining 2 initial failures came from the theme test recognizing only the development `/src/main.tsx` script; the test now recognizes Vite’s production bundle and those 2 checks passed on rerun.
- Existing theatre, playback, Priority 5 keyboard/pointer navigation, causality, and proof-navigation assertions passed except for the transient timeout recorded above.

## Limits

- The visual reference is a static concept, not a pixel specification; no fabricated players, markers, dates, or incidents were added.
- Human comprehension remains uncollected. Production preview uses the existing local backend and synthetic match fixtures.
- Repository, Azure, and Foundry state were not changed or revalidated as part of this UI milestone.
