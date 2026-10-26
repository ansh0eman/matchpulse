# Turn of Play — Step 1 local handoff

**State:** stable local baseline for the separately authorized Step 2 layout milestone. No commit, push or deployment was made. This record is a technical handoff, not human-comprehension or public acceptance.

## Implemented

- Public wordmark/title changed to Turn of Play. Matchday, Investigate and Studio preserve their existing destinations; Guided demo remains available.
- Outfit and DM Sans are self-hosted at exact version 5.3.0. Their OFL license texts are in `web/public/licenses/`.
- Shared light/dark tokens, a keyboard-operable Phosphor theme toggle, persisted preference, OS fallback/change handling, pre-paint same-origin bootstrap, browser theme-color updates and unavailable-storage fallback are in place.
- The toggle remains usable in Proof Lens, Studio and Guided demo dialogs without changing their mounted application state.
- The selected reference is preserved at `reference.png` with SHA-256 `cef2720d81e0623d8fec41d86d1ea05ea09409084d0836212827cf63b8aec5a0`.

## Checks performed for this handoff

- `cd web && npm run typecheck` — passed.
- `cd web && npm run build` — passed; 4,582 modules transformed.
- `MATCHPULSE_TEST_URL=http://127.0.0.1:5173 npx playwright test tests/evidence-navigation.spec.ts tests/theme.spec.ts --reporter=line` — **18 passed** across laptop 1366×768 and mobile 390×844 Chromium projects.
- The browser run covered theme boot/storage/system behavior, keyboard activation and persistence, preserving the selected incident and replay time while Proof Lens stays open, plus dialog focus restoration.
- Inspected loaded light/dark and Proof Lens screenshots at `output/playwright/turn-of-play/development-{laptop,mobile}-{light,dark}*.png`. Font checks passed for Outfit Variable and DM Sans Variable; the tested layouts had no horizontal page overflow.
- A first visual pass exposed a modal focus-order regression after adding the in-dialog toggle; the button order was corrected, and the focused navigation/theme run above passed afterward.

## Handoff limits

Step 1 intentionally left the previous Matchday composition in place: the context band, lower-third, controls and match moments remain separate, and the investigation content is not yet a right-hand rail. The selected composition is Step 2 work. The browser evidence above is local only; P4/P5 and human-comprehension claims remain as recorded in their independent acceptance files.
