# Turn of Play — full visual acceptance

Date: 2026-10-26

Scope: the complete local frontend visual correction in `full-visual-implementation-prompt.md`. This is implementation and technical/visual review evidence, not human-comprehension research, Azure acceptance or deployment acceptance.

## Result

The selected Turn of Play visual system is implemented across the existing viewer surfaces and loaded in the local Vite production preview. The shared direction uses locally bundled Outfit for display type, DM Sans for interface/body type, semantic lavender/plum surfaces, violet actions, pink selected measurements, and the existing green pitch. Light/dark persistence and system preference behavior remain available. Theme contrast was checked for the selected Matchday story tile; this is not a claim that every component has passed a complete WCAG audit.

Matchday now presents the source-backed score and clock, correctly proportioned field, chronological moment rail with the active moment brought into view, integrated replay controls, compact team/audience controls and a right-side investigation. Positional copy distinguishes the incident clock from replay time and preserves the source-derived values: +10.01m, 21.95m and 31.96m, with 59 verified samples (41 earlier and 18 recent). Explanation and uncertainty are separate. Shot identity remains tied to the original team and incident time. Withheld copy does not offer an unsupported current-comparison proof action.

Investigate, restricted Ask/recap, every Proof Lens section, recorded Studio workflows, guided demo and program output use the same type/color/control vocabulary while retaining their distinct density and existing behavior. Loading, unavailable, error and withheld states use their existing contracts. No backend analytics, source observations, evidence calculations, replay chronology, frozen experiments or provider behavior were changed. No dependency was added.

## Technical verification

- `npm run typecheck --prefix web` — passed.
- `npm run build --prefix web` — passed. Vite transformed 4,584 modules; the production bundle completed successfully.
- `git diff --check` — passed before the acceptance records were written; rerun after these records is included in final handoff.
- Targeted Playwright browser suite — 23 passed, 1 skipped, 0 failed/flaky. Laptop project: 11 passed, 1 skipped (the mobile-only pointer-selection case); mobile project: 12 passed. Coverage included theme persistence/system preference, source and replay clocks, 59-sample arithmetic, Proof Lens section reset/focus, shot identity, withheld behavior, pointer/keyboard selection, reduced motion and playback recovery.
- Final Matchday layout/explicit-moment browser selection — 4 passed across laptop/mobile. Final responsive Matchday layout selection after the compact-width correction — 4 passed.
- Loaded local endpoints responded successfully: dev UI `http://127.0.0.1:5173/`, viewer API `http://127.0.0.1:8010/api/view?scenario=line-shift&clock=3360&audience=fan`, and production preview `http://127.0.0.1:4173/`.
- The final production-preview capture at 768×1024 reported `innerWidth=768`, document `scrollWidth=768`, title “Spot the shift.” No horizontal page overflow was observed.

These are targeted checks, not a run of every repository test. The technical result does not establish human comprehension or production/deployment behavior.

## Visual review

The chosen authority `reference.png` was compared with the loaded application at a matching 968×704 viewport. The current preview gives the pitch the intended dominant width, makes the full evidence action fit, and centers the selected 56:00 line-comparison moment within the horizontal timeline. Laptop and transition-width views retain the field/investigation hierarchy. Mobile remains in natural document flow rather than forcing a small desktop workspace into the viewport.

### Matchday — light, 1366×768

![Loaded Matchday light at 1366×768](../../../output/playwright/turn-of-play/current-preview-matchday-light-1366x768.png)

### Matchday — dark, 1366×768

![Loaded Matchday dark at 1366×768](../../../output/playwright/turn-of-play/current-preview-matchday-dark-1366x768.png)

### Matchday — light and dark, mobile 390×844

![Loaded Matchday light at 390×844](../../../output/playwright/turn-of-play/current-preview-matchday-light-390x844.png)

![Loaded Matchday dark at 390×844](../../../output/playwright/turn-of-play/current-preview-matchday-dark-390x844.png)

### Matchday — dark, 768×1024 transition width

![Loaded Matchday dark at 768×1024](../../../output/playwright/turn-of-play/current-preview-matchday-dark-768x1024.png)

### Reference-scale loaded preview, 968×704

![Loaded Matchday at reference scale](../../../output/playwright/turn-of-play/current-preview-reference-scale-968.png)

### Investigate

![Investigate light](../../../output/playwright/turn-of-play/current-preview-investigate-light-1366x768.png)

![Investigate dark](../../../output/playwright/turn-of-play/current-preview-investigate-dark-1366x768.png)

### Proof Lens — Summary, Method and Audit

![Proof Lens Summary light](../../../output/playwright/turn-of-play/current-preview-proof-summary-light-1366x768.png)

![Proof Lens Method light](../../../output/playwright/turn-of-play/current-preview-proof-method-light-1366x768.png)

![Proof Lens Audit light](../../../output/playwright/turn-of-play/current-preview-proof-audit-light-1366x768.png)

![Proof Lens Summary dark](../../../output/playwright/turn-of-play/current-preview-proof-summary-dark-1366x768.png)

![Proof Lens Method dark](../../../output/playwright/turn-of-play/current-preview-proof-method-dark-1366x768.png)

![Proof Lens Audit dark](../../../output/playwright/turn-of-play/current-preview-proof-audit-dark-1366x768.png)

### Studio and other states

![Recorded Studio light](../../../output/playwright/turn-of-play/current-preview-studio-light-1366x768.png)

![Recorded Studio dark](../../../output/playwright/turn-of-play/current-preview-studio-dark-1366x768.png)

![Guided demo active](../../../output/playwright/turn-of-play/current-preview-guided-active-dark-1366x768.png)

![Program output](../../../output/playwright/turn-of-play/current-preview-program-output-dark-1366x768.png)

![Withheld evidence](../../../output/playwright/turn-of-play/current-preview-withheld-light-1366x768.png)

## Remaining visual differences and limits

- At 390×844, the score and field are followed by the investigation, while lower timeline/transport and secondary controls continue below the fold. This is ordinary page scrolling; the page does not overflow horizontally.
- The source event coordinates for the opening-goal scenario can place multiple action labels close together, especially on mobile. They were not moved or altered to improve appearance because those positions are evidence data.
- The reference concept includes decorative/unsupported date, commentary, caption and completion controls. Those controls are intentionally absent. The reference also depicts a later shot; the current 56:00 replay does not expose a future 58:12 incident as available evidence.
- At 768px the two-column composition is intentionally retained; at phone width the layout moves into a vertical flow. Visual screenshots cover 390, 768, 968, and 1366 widths. Other browser zoom levels and device combinations were not exhaustively reviewed.
- Existing model output remains recorded output; opening Studio does not create a new Foundry run. This pass did not verify an Azure deployment.
- No human participant session was conducted and no comprehension result is claimed.

## Worktree and external state

The repository was dirty before this pass, including unrelated documentation, package metadata, application/test work, and private/generated research paths. Those changes were preserved. The full-visual acceptance record and checklist are the only new documentation for this pass. No files were staged; no commit, push, merge, deployment, Azure operation, paid inference or publication was performed. Existing local servers belonging to other work were left running; only this pass's Playwright browser session was closed.
