# GPT-6 Luna prompt: Turn of Play Step 2 layout recovery

Implement this single local frontend milestone in the existing project. Read the whole prompt before changing files. The goal is a faithful implementation of the already selected visual composition, with functioning existing data and interactions. This is not another palette-only pass.

## 1. Establish the current checkpoint

- Read AGENTS.md, research/product-excellence/CURRENT_STATUS.md, the accepted P4/P5 records and any Step 1 theme acceptance/handoff now present.
- Inspect git status and the relevant diff before editing. Other work is in progress. Preserve all unrelated changes; do not reset, stash, clean, bulk-stage or rewrite another agent's edits.
- Read research/design/turn-of-play/competitor-review-2026-10-26.md for recommendations and research limits. It is context, not permission to implement every recommendation.
- Open research/design/turn-of-play/reference.png. Inspect the actual image, not only its filename or prose description.
- The user explicitly selected Turn of Play as the name and requested the same font appearance as the screenshot. Keep Outfit for display roles and DM Sans for body/UI text, with locally bundled font assets. The generated image has no recoverable exact font metadata; visually match its hierarchy and proportions using these selected families.
- Give the exact file plan and checks, then implement. If Step 1 is concurrently editing the same components, establish a stable handoff before modifying them; do not overwrite work in progress.

## 2. Visual acceptance target

Use reference.png as the composition authority. Replace MATCHQUEST with Turn of Play. Keep its lavender/plum/violet/pink palette, substantial rounded corners and green pitch. Do not generate a new concept, replace it with a generic dashboard, or change direction because a different layout is easier.

At 1366×768 desktop, aim for these relationships (visual starting values, not screenshot coordinates to hardcode):

- Rounded application frame with about 16–24px outside spacing; responsive width, no 960px fixed screenshot wrapper.
- Header roughly 56–64px high. Wordmark left, restrained pill navigation around the centre, replay/theme controls right. Active Matchday is an inset lavender pill with violet detail, not a full-height purple rectangle. Retain access to Guided demo without making it the dominant header element.
- Main workspace begins shortly below the header. Two columns near 70/30, about 12–16px gap. Keep the investigation rail around 330–380px at this viewport; left column uses remaining width. Reconcile pitch aspect ratio and available height so score, pitch, key moments and essential controls are visible without arbitrary clipping.
- Left workspace: compact score strip, dominant full pitch, discreet team legend, key-moments timeline, then integrated replay controls. Remove the redundant large “Matchday / North v South” context band and the large lower-third as separate desktop blocks. Reuse their useful information in the score strip and investigation rail.
- Right workspace: Watch / Compare / Explain orientation, “Spot the shift” heading for an eligible positional comparison, concise explanation, comparison card, support and uncertainty, then primary proof/explanation action.
- Major panels about 20–24px radius; secondary panels 14–18px. Soft borders and minimal shadows. No heavy gradients or decorative glow. Violet denotes controls, pink the selected measurement/moment, green the actual playing field.
- Outfit approximately 800 for short wordmark/headline/score/large metrics. DM Sans 400–600 for readable body text and controls. Do not use an enormous weight-800 multi-line technical sentence where a short headline and supporting sentence work.
- Preserve the working theme toggle and its state/persistence. Dark mode preserves geometry and hierarchy, with coordinated plum surfaces and readable text; remove leftover teal/cyan UI accents. Keep semantically appropriate verification/error indicators, with contrast in both themes.

Do not copy the image's illustrative player coordinates, clock total, date, completed-step count, logo or future-event markers. Real contracts govern all factual content.

## 3. Bind the rail to existing authoritative data

Inspect BroadcastTheatre's existing `current`, `latestRecorded`, `explicitlySelected`, overlay metrics/references, diagnostics and proof flow. Reuse those contracts and presentation helpers. Do not change inference, scheduler eligibility or measurements.

- Use the current eligible/explicitly selected story. Keep selected historical incidents visibly distinct from the replay clock and from a current claim.
- For the positional fixture, show earlier/recent means, signed difference and support from the approved payload or independently recomputed proof. The known fixture displays 21.95m, 31.96m, +10.01m and 59 samples (41 earlier, 18 recent), but these are acceptance expectations, never literal UI constants.
- Inspect whether the current frontend payload actually contains the two support counts. Do not derive 41/18 by dividing totals, reuse another match's proof, or fetch proof on every replay tick. If needed, reuse the existing evidence client/cache and cancellation contract keyed by match + story + evidence cutoff. Keep unverified/loading support visibly pending until the scoped request succeeds. Preserve independent proof verification and existing errors.
- “Three deepest observed outfielders” remains the measurement scope. Do not call it a back four or prove pressing/coaching intent. A short headline can say “Spot the shift”; explanatory copy must describe the sampled comparison accurately.
- Explanation and limits stay readable beside the pitch. Put technical windows, original coordinates, receipts and full method inside the existing Proof Lens. Do not delete those details.
- For goals, shots and other existing story types, render a purposeful incident-specific rail using supported facts. Do not show positional numbers for a shot, or a positional headline on every fixture.
- For withheld evidence, explain why a current comparison cannot be supported and retain the existing absence of a current-proof action. Historical selections retain their explicit historical context.
- No eligible story/loading/error/ball-only states must have intentional layouts. Never substitute fake data to make a screenshot look complete.

## 4. Integrate existing controls and navigation

- Reuse the existing Pitch SVG and observations. Styling the surrounding stage is allowed. Preserve coordinates, aspect ratio and original-frame semantics. Do not turn a raster reference into the playing field or manufacture tracking samples.
- Move the existing timeline into the left workspace below the pitch. Keep source/available/presented clock checks and selection identity. Never expose the image's 58:12 incident at replay time 56:00.
- Reuse the single replay clock, transport, speed, buffering handling and source-refill implementation. No duplicate player, interval or independent progress clock.
- Consolidate audience/favourite/scenario controls into a compact visible or expandable surface. Keep all six scenarios accessible and isolated. Do not remove capabilities simply to match a clean screenshot.
- The Watch / Compare / Explain orientation may indicate the active action. Completion must reflect actual interactions; don't hardcode “1 of 3 explored” or give completed checks on load. A full challenge/XP/notebook system is a later milestone.
- Main evidence/explanation button opens the existing relevant proof flow, with correct story/match/time. Keep close/focus return/section reset behavior. Do not make an “Explain” label launch unsupported live AI.
- Keep existing Investigate and Studio destinations compatible with URL behavior and internal modes. Inspect their mapping; internal `mode=studio` historically means Analysis Room while Agent room is separate.
- Optional commentary has been requested, but working audio is a later scoped task. Do not display a fake active speaker/caption toggle. If a future voice control is shown, label it clearly unavailable and do not displace working controls.

## 5. Scope and architecture

Likely existing owners to inspect: web/src/App.tsx, web/src/broadcast/BroadcastTheatre.tsx, ReplayControls.tsx, MatchTimeline.tsx, presentation.ts, web/src/design/matchday.css, theme.css and the relevant existing browser tests.

Prefer small extracted presentational components such as MatchdayInvestigation.tsx and MatchdayWorkspace.tsx where this makes ownership clearer. Use existing contracts; do not broaden them with guessed fields. If a selector/formatter is shared, give it a focused owner rather than duplicating numerical formatting in multiple components.

Audit the existing CSS cascade first. Amend the owning rules and theme tokens; avoid adding another long override tail or `!important` blanket. Preserve the other app surfaces. Proof Lens typography/color fixes may be included where required for a coherent theme, but a full modal information-architecture rewrite is outside this milestone.

No new packages, backend changes, model calls, experiment reruns, threshold retuning, dataset edits, real-player identities or paid Speech calls. Preserve frozen detector fingerprints, all original research alerts and full evidence paths. Preserve private/untracked Priority 2/5 material. No commit, push, merge or deployment.

## 6. Responsive and interaction acceptance

- Desktop: inspect both 1366×768 and a wider viewport. Essential pitch/rail/timeline/control composition should resemble the reference at equivalent proportions, not merely have similar colors. Do not crop the field or hide text to force a fit.
- Mobile 390×844: stack score, pitch, selected incident summary, timeline/controls and details in a readable order. Keep proof reachable and preserve P5 selection reveal. Avoid horizontal page overflow, tiny text, or an investigation rail that disappears without an alternative.
- Verify keyboard operation, visible focus and accessible labels; reduced-motion behavior; theme contrast across loading, buffering, withheld and proof states.
- Toggling theme or navigating between Watch/Compare/Explain must preserve match, replay time, playback state and selected story. Evidence remains correctly scoped after seeking or switching fixtures.

## 7. Verification and visual review

Use the project's existing documented Node 24/Python viewer setup and verified local fixtures; inspect available processes before starting a duplicate server. Run no cloud calls. Use Distill for verbose command output as AGENTS.md specifies and preserve upstream exit codes.

Run TypeScript typecheck/build and relevant existing frontend/browser tests for theatre, evidence navigation, theme, P4 playback and P5 selection/focus behavior. Add focused coverage for the new rail's story types, withheld state, timeline causality and context preservation. Investigate failures; don't remove assertions, weaken data checks or inflate timeouts to get green.

Visual review is mandatory:

1. Wait for the actual line-shift fixture to load at the existing selected time. A loading screenshot does not satisfy the primary composition acceptance.
2. Capture the loaded desktop light state, dark state, mobile states, open Proof Lens, non-positional incident and withheld scenario.
3. Compare reference.png and the loaded implementation at the same overall canvas size, or with documented proportional scaling. Inspect them together. Reconcile major layout proportions, header/nav geometry, rail density, pitch fit, type hierarchy, spacing and colors.
4. Correct visible mismatches and capture again. Do not call it faithful merely because tests pass.
5. Preserve honest empty/error captures as additional states; do not use them instead of the loaded primary state.

Write a compact Step 2 acceptance record under research/design/turn-of-play/ with exact commands/results, screenshot paths, reference comparison findings and unresolved differences. Do not claim human comprehension, public deployment acceptance or new detector accuracy.

Final handoff: files changed and why; tests/checks and exact failures if any; loaded light/dark/mobile screenshots; explicit remaining mismatches. STOP FOR USER REVIEW. Do not continue into voice, identities, editorial policy or gamification challenges.
