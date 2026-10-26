# Luna: correct the remaining visual mismatch

This is a focused continuation of the existing Turn of Play frontend redesign. The latest screenshot has the investigation beside the pitch, but the user has rejected its visual fidelity. Preserve the functional work; finish the composition against `research/design/turn-of-play/reference.png`.

Read AGENTS.md, CURRENT_STATUS.md and current handoffs. Inspect Git status/diffs first and preserve concurrent edits. Do not reset, stash, clean, stage or overwrite unrelated files. Announce the exact file plan, then implement this single correction milestone. No new design direction or font search.

## Start with the actual reference and running version

Open reference.png and the running application. The reference's placeholder MATCHQUEST becomes Turn of Play; its illustrative coordinates, date, future incidents and completion count are not factual requirements.

Confirm the running URL serves the latest intended frontend/API. The user's screenshot shows an apparently unstyled `FROM THE ARCHIVEMatchday` row, whereas the current source has flex/gap/type rules for `.md-livebar`. Check the actual cascade/served version before assuming that adding another selector will fix it. Do not dismiss the discrepancy as cache without evidence. Preserve existing running processes owned by other workstreams.

The current desktop composition is too tall and fragmented. Its field occupies only about the middle half of a broad green stage; its separate moments cards/settings/library compete with the pitch and rail. The positive delta is buried in a headline instead of being the main comparison number. These are the primary correction targets.

## 1. Correct field sizing first

Inspect `.matchday .theatre-pitch` in `web/src/design/matchday.css`, currently `height: clamp(280px, 40dvh, 450px)`, and the SVG in `web/src/Pitch.tsx`, currently `viewBox="-4 -4 113 76"`.

The viewport-height clamp and wide container create SVG letterboxing. Give the field an intrinsic, proportional stage instead. Resolve workspace width and available height together. The pitch should occupy almost the full green panel with modest breathing room, rather than float between large blank side gutters.

Keep source coordinates, metre geometry and SVG aspect ratio intact. Do not use `preserveAspectRatio="none"`, crop goals/touchlines, scale x/y differently, or move players to imitate illustrative reference positions. If fitting the whole main workspace requires a more restrained maximum app width, choose that deliberately. Do not compress every label or hide overflowing content to force a viewport fit.

Scope any pitch styling to Matchday so Proof Lens's comparison pitches remain intact. Inspect the actual rendered field boundary, not just the SVG element's 100%-width bounding box.

## 2. Compose one left workspace

Follow the reference's order: compact score strip → dominant pitch → slim key-moments timeline → playback controls. These should read as one composed workspace, with small internal spacing, rather than a stack of unrelated large cards.

- Remove the redundant archive/context row from the primary layout; keep the synthetic replay disclosure and program-output access in compact appropriate locations. No invented archive/date metadata.
- Replace the large “The match so far” card carousel with a compact chronological timeline of eligible source moments. Use a small Key moments label, point markers, timestamps and concise incident labels. Give the selected point a pink ring/clear state.
- Retain original story IDs, historical/current distinction, all source/available/presented eligibility checks, keyboard access and P5 pointer-selection reveal. Future incidents remain hidden. This is a presentation change, not the pending editorial-selection-policy implementation.
- Integrate the existing play/pause, seek and speed controls below that timeline. Use deliberate violet track/thumb styling and coordinated light/dark states instead of the old teal range appearance. Preserve the single replay clock, causal refills, buffering, cancellation and existing speed options.
- Consolidate Fan/Analyst/favourite/scenario controls into a restrained accessible secondary surface. Keep all capabilities and six isolated scenarios available. The default viewport should lead with the match and investigation rather than the scenario library.
- Keep the active nav as a small inset rounded pill. Keep the selected fonts, but use comfortable wordmark spacing so “Turn of Play” is legible rather than compressed into a solid shape.

## 3. Match the investigation rail's hierarchy

Inspect and edit `web/src/broadcast/MatchdayInvestigation.tsx` rather than repeatedly styling its current hierarchy.

For an eligible positional story, use the reference's order:

1. Compact Watch / Compare / Explain orientation with three circular nodes and short connectors. Do not show completed checks/counts without actual interaction state. If these are navigational controls, implement their supported actions and keyboard semantics; otherwise communicate orientation without pretending they are buttons or earned progress.
2. Short main headline: “Spot the shift.” Supporting copy identifies the actual team and comparison. Keep current/selected historical context accurate without making metadata dominate the headline.
3. Comparison surface headed “Compare the evidence”. Its primary number is the source-derived signed difference, pink, around 28–34px. The example fixture is +10.01m; do not hardcode it. Use correct sign/direction for other values.
4. Two evenly aligned columns underneath: earlier and recent window means. The example is 21.95m / 31.96m. Use the existing approved measurements, not representative snapshots as substitutes.
5. Source-verified support, with total and breakdown when available: the example has 59 samples, 41 earlier and 18 recent. Derive from the scoped proof receipt; keep pending/error states honest. Preserve `useStorySupport` request scoping, cancellation/cache behavior and independent verification.
6. Two small readable blocks: “What this tells us” and “What stays uncertain.” Explain the sampled comparison and its actual limitations. Do not imply continuous movement, coaching intent, successful pressing or independent statistical trials. Use existing icon-library icons, not emoji decorations.
7. A full-width primary action, such as “Compare the evidence”, that opens the existing relevant Proof Lens. Keep the action's wording accurate: it does not request live AI narration. Retain absence of a current-proof action in withheld states.

Avoid repeating the same measurement in a headline, subtitle, card label and selected-story footer. Keep necessary source/replay timing accessible in a compact labelled row. Remove decorative duplicate metadata, not evidence requirements.

Non-positional stories need their existing supported incident-specific treatment. Do not put line-height metrics onto goals or shots. Preserve source-scoped loading/error/empty/withheld layouts and all proof navigation/focus behavior.

## 4. Visual rules

Keep Outfit display roles and DM Sans body/UI roles. Match the reference's short heavy headline, strong metric, restrained labels and readable body hierarchy. Do not make every label heavy or every surface a bordered card.

Keep lavender canvas/subtle surfaces, plum text, violet controls, pink selected measurements and a green field. Remove leftover teal/cyan UI accents using the owning semantic tokens. Keep appropriate verification/error semantics. The dark theme uses the same geometry and hierarchy with coordinated plum surfaces.

Use about 12–16px between main regions, 20–24px major radii, 14–18px secondary radii and balanced internal spacing. Reconcile the actual reference proportions at matching viewport size; these numbers are starting constraints, not a substitute for looking.

Highlight contributor players only when their IDs belong to the calculation for the exact displayed source frame. Do not ring arbitrary current players or imply a snapshot alone represents the whole aggregate. Do not implement voice, fictional aliases, challenges, XP, new analytics or new cloud capabilities in this pass.

## 5. Owners and verification

Expected owners: `web/src/design/matchday.css`, `web/src/design/theme.css`, `web/src/broadcast/BroadcastTheatre.tsx`, `MatchdayInvestigation.tsx`, `MatchTimeline.tsx`, `ReplayControls.tsx`, and focused frontend/browser tests. Small App header changes may be justified. Preserve unrelated changes and avoid a broad refactor or a new tail of conflicting CSS overrides. No new dependencies or backend/experiment changes.

Current `web/tests/matchday-layout.spec.ts` checks visible regions, no horizontal overflow, source support and a broad pitch/rail width relationship. Those checks do not establish reference fidelity. Keep meaningful assertions and extend coverage where changed interaction behavior warrants it. Do not weaken them or raise timeouts to get green.

Run TypeScript typecheck/build and the relevant local layout/theme/theatre/evidence-navigation/P4/P5 checks. Use the existing verified fixture bundle and permitted browser workflow, with no cloud calls. Follow AGENTS.md for verbose output. Report exact commands/results and investigate every failure.

Before handoff, inspect loaded line-shift screenshots at 1366×768 and 390×844 in both themes. Also inspect a non-positional incident, withheld state and open Proof Lens. A loading screenshot is not the main acceptance capture.

Compare the loaded light desktop screenshot and reference.png together at the same canvas size or documented proportional scaling. Explicitly assess: actual field occupancy/gutters, header height and nav, timeline density, control grouping, rail width/content order, pink delta, type hierarchy and overall vertical composition. Correct visible differences and recapture. Preserve physical pitch geometry even where the generated reference is imperfect.

Write a short `research/design/turn-of-play/step2b-acceptance.md` with screenshots, exact check results and honest remaining visual differences. Technical checks and visual review are separate acceptance statements; human comprehension remains uncollected.

No commits, pushes, merges, deployments, paid model/Speech calls, detector retuning, dataset edits or private research changes. STOP FOR USER REVIEW after this correction pass.
