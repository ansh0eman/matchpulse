# Turn of Play — final reference, depth and interaction implementation

## The assignment

Finish the visual and interaction experience shown in the user's selected reference before continuing broader product development. The current application is functionally grounded and consistently themed, but still feels too flat, constrained and passive. Implement this pass in the existing application. Do not return another plan or a recolour-only result.

Open both `research/design/turn-of-play/reference.png` and the newly supplied larger `reference-detail.png`. The larger reference makes the required details clear: a workspace filling the available width, white outer panels, lavender inner panels, richly coloured football pitch, raised selected navigation, round player pieces, a pink/red key-moment ring, expressive progress steps, speaker/caption controls and a substantial primary action.

Keep the product name **Turn of Play**, the existing selected Outfit/DM Sans direction, the purple/plum/lavender/pink palette and the underlying evidence architecture. The reference is the art direction; real source observations determine every player position, score, incident and measurement. The corner “viz” overlay, MATCHQUEST branding, illustrative date and future incident are not application content to copy.

This prompt supersedes earlier conflicting visual instructions. In particular, the user's latest instruction explicitly replaces the earlier narrow centred workspace recommendation. **Use the available screen width.** It also authorizes functional local commentary/preview/caption controls and real exploration state, rather than leaving those reference controls decorative. No new cloud/paid provider calls are authorized.

Read AGENTS.md and CURRENT_STATUS.md; inspect Git status/diffs and preserve concurrent changes. Announce an exact file plan. Work sequentially, no parallel agents, no dependency installation. Preserve private Priority 2/5 material and historical reports. The separately queued P6–P13 analytics work does not start as part of this pass. No commits, pushes, merges, deployments, Azure changes, new experiments or detector retuning.

## Art direction — a tactile football console

Make this feel like a carefully designed interactive football console: the pitch is the stage, player markers feel like small physical pieces, controls have a shallow raised edge, the active moment has a bright pink focus ring, and the investigation feels like a guided discovery beside the match.

Imagine a soft white moulded shell, lavender inserts, polished purple buttons and a green miniature playing field viewed directly from above. Light comes consistently from above-left. A raised surface gets a fine upper highlight and a soft shadow below it. A button depresses when pressed. A selected navigation pill has a small coloured lower edge. These material cues should explain what can be pressed or selected.

Use depth in a disciplined hierarchy. The field enclosure, active buttons, selected progress step and opened dialog deserve the strongest treatment. Ordinary paragraphs, table rows and every small label do not need their own floating card. Keep the result mature, legible and playful, with no cartoon mascot, random trophy badges, noisy neon, particle backgrounds or decorative clutter.

## 1. Fill the width — correct the page geometry

- Audit `.matchday`, `.md-arena`, `.theatre-stage`, `.matchday-investigation`, outer shell max-width rules and viewport-height-derived width calculations. Remove the constraints currently creating large empty left/right margins at 1366px.
- The application shell fills the viewport. Main workspace uses roughly `calc(100% - 32px to 48px)`, with 16–24px outside padding and a 12–16px column gap. No 980/1100/1150px laptop cap or width calculated to make a small centred dashboard.
- At desktop widths use approximately 68–70% for the left match workspace and 30–32% for the investigation. Keep both fluid; do not leave a huge unused canvas to keep the rail at exactly 350px.
- Header spans the same full width and aligns with the workspace edges. Brand left; navigation centred; synthetic replay, guide and theme utilities right.
- The score, pitch, moments and transport form one coherent left assembly. The investigation is a white assembly of its own. Their top edges align.
- Preserve true field aspect ratio and all source coordinates. A fuller-width field can require more vertical document space than the original compact app. Accept deliberate vertical scrolling; do not shrink the entire app, distort the field, crop goals or use tiny text to force a 768px-tall screenshot.
- At 390px, use 12–16px gutters. Put score/pitch first, replay controls immediately next, then the selected investigation and moments. Playback must be reachable before a long explanation. Preserve mobile moment-selection reveal and current replay time.
- Use a breakpoint based on readable columns, not an arbitrary desire to keep two columns on tablets. Check 768px, 968px, 1366px, 1440px and a wider desktop. Retain fluid width and intentional stacking.

## 2. Reproduce the white shell / lavender insert structure

The reference's right side is not one large purple card. Implement its actual layering:

1. White outer investigation panel, 22–26px radius, 16–20px padding, soft ambient shadow and a fine upper highlight.
2. Progress, main heading and supporting sentence sit directly on that white surface.
3. A lavender comparison insert contains the comparison heading, measurement icon, large pink delta, earlier/recent means and sample support.
4. Two separate lavender explanation inserts sit BELOW the comparison insert: “What this tells us” and “What stays uncertain”. Each has a circular lavender icon medallion and readable copy.
5. The main action and preview speaker sit at the bottom of the white panel.

Move `.comparison-insights` out of `.comparison-card` when necessary. The current white subcards nested inside the lavender metric box reverse the reference's structure. Fix the markup, not only the background colours.

Left side: a white rim around the score/field assembly; lavender score insert; green field inside; white timeline/control assembly below. Keep visible separation from the lavender canvas. Avoid thick borders around every interior element.

Dark mode uses the SAME surface relationships: deep-plum outer shell, a lighter plum insert and raised controls with a fine light edge. Do not turn every surface into the same near-black shade or compensate with neon glow.

## 3. Give the controls convincing depth

Introduce a small shared elevation vocabulary in theme.css and use it consistently. These are starting values; tune against the reference:

```css
/* Light surfaces: fine contact shadow + broader ambient shadow. */
--shadow-panel:
  0 2px 3px rgb(54 13 58 / 5%),
  0 14px 30px -14px rgb(54 13 58 / 18%),
  inset 0 1px 0 rgb(255 255 255 / 90%);
--shadow-insert:
  inset 0 1px 0 rgb(255 255 255 / 70%),
  0 2px 6px rgb(54 13 58 / 4%);
--shadow-action:
  0 4px 0 #55129c,
  0 9px 16px -7px rgb(86 25 145 / 35%),
  inset 0 1px 0 rgb(255 255 255 / 25%);
```

- Selected Matchday/Investigate/Studio tab: lavender top, shallow violet lower edge, soft contact shadow, rounded 12–14px corners. It should resemble the selected Matchday tab in the reference. Keep it 36–40px high, never header-height.
- Primary purple button: 3–4px lower edge; on press translate down 2px and reduce the edge/shadow. Keep the hit target stable by transforming an inner visual surface or equivalent safe structure. Keyboard activation has the same feedback.
- Main play button: a substantial circular purple control with a slightly darker lower edge and a crisp white play/pause icon. It looks touchable even before hover.
- Secondary pills: only a 1–2px lower edge/contact shadow; do not give every secondary action the primary button's prominence.
- Progress circles: softly domed violet disc when current, slightly recessed outlined disc when unvisited, a check only when the corresponding interaction actually occurred.
- Pink delta: crisp heavy typography. Use a tiny optional contact shadow at most; no blurred glowing text.
- Dialogs: soft ambient shadow and edge highlight; plain readable inner tables. Mobile must not inherit giant desktop shadows that consume useful space.
- Hover lift is subtle (about 1px) and restricted to genuinely interactive elements. Press feedback is 100–150ms, small state transitions 150–200ms. Reduced motion removes travel/pulses while preserving clear static states. No continuously bobbing panels.
- Use richer light/dark-specific tokens rather than pasting the same black shadow on every theme. Preserve contrast; the brand violet #963CFF may use the existing deeper accessible action shade for small white text.

## 4. Match typography and icons

Keep Outfit and DM Sans installed locally; do not start another font search. Match the reference's hierarchy instead of using the same heavy weight for every line:

- Wordmark: Outfit 800, 25–30px, real spaces in Turn of Play, restrained tracking.
- Main positional heading “Spot the shift.”: Outfit 800/900, approximately 30–36px desktop, 26–30px phone, compact 1.05–1.12 line height.
- Score and signed delta: Outfit 800, visually strongest numeric values. Delta around 36–44px desktop where the wider rail permits. Keep signs and units readable.
- Supporting sentence: DM Sans 14–16px. Section titles 15–17px/700. Body 13–15px; meaningful explanations must not be compressed to 10–11px.
- Make the white/lavender surface grouping do the work; reduce tiny uppercase metadata and redundant labels.

Use the installed Phosphor icon family consistently, generally 18–22px, with matching weight:

- Replay-source utility: waveform/pulse-style icon, “Synthetic replay”, chevron.
- Compare: horizontal measurement/arrows icon inside a small round white medallion; expand/open-evidence icon at the insert's upper-right.
- Explanation: lightbulb in a lavender circle; uncertainty: question icon in a similar circle.
- Commentary and preview: speaker/high-volume icon. Toggle changes icon and text. Preview gets a round icon button plus a short readable label.
- Captions: clear CC treatment using an accessible icon/text badge; actual button semantics and visible pressed state.
- Watch/Compare/Explain: use the existing meaningful labels with numbered/check circles and thin connectors. A Listen action can live inside Explain; do not silently change the three-step journey into a different workflow.

No copied lion logo, emoji icons or fake date. The “Synthetic replay” utility opens the existing scenario/source selector or a small accessible disclosure of actual source/fixture status. Keep program-output access reachable from suitable utility chrome. A chevron must have a working disclosure behind it.

## 5. Make the timeline behave like the reference

The user explicitly wants the pink/red dot and outer ring when playback reaches a key moment.

- Make a slim clock rail with small lavender graduations, quiet grey/violet eligible event dots, labels for real shot/goal/line-comparison incidents and a prominent pink/red playhead/arrival ring.
- Decorative graduations represent time only; do not draw a fake audio waveform or fabricate activity. Map actual incident labels onto an explicit clock domain. Manage crowding with contained scrolling or grouping, keeping every incident reachable.
- A current eligible key moment gets the reference's bright pink centre, thin white separation and a larger pink outer ring. Briefly expand/fade one outer ring once when ordinary playback crosses its presentation boundary; then retain a calm static state. Respect reduced motion.
- A shot gets its actual timestamp/type and an appropriate icon or dot. A goal gets its genuine registered goal context. A positional comparison gets its actual registered claim. Do not label a future incident before it is source/availability/presentation eligible.
- Preserve all THREE clock gates: source, availability and presentation must be <= replay clock. The image's 58:12 shot is not visible as an available incident at 56:00.
- Separate the moving replay playhead, the latest arrival cue and explicit historical selection. They are different UI states. User-selected historical proof must not be replaced or focused away when a new incident arrives.
- Seeking updates the playhead/current eligible cue immediately, without replaying a backlog of arrival animations or speaking all earlier incidents. Selecting a historical marker retains the existing P5 semantics: reveal its explanation while preserving replay time where that is the existing action.
- Use current playback callbacks/data, not another clock/interval. Arrival animation is presentation feedback, not a new detector or editorial freshness policy. No source-event mutation or reordered inference.
- Preserve native score timing, buffered replay/refill checks, keyboard/touch selection and match isolation. Keep timeline labels readable and the active incident visually obvious.

## 6. Make player pieces and source highlights feel alive

Style the existing SVG pieces as shallow physical discs: fine dark edge, tiny contact shadow and subtle upper-left highlight. Lime for North, off-white for South, a warm goalkeeper distinction. Preserve the existing source-ID labels and disclosure that they are not verified shirt numbers.

The THREE rings in the positional reference represent the three contributing outfielders. Obtain them from the independently verified sample for the EXACT displayed frame. In a comparison view, show each original earlier/recent frame with its own verified contributors, ringed lime/white as appropriate.

If the current live/replay frame is not one of those verified calculation frames, do not transfer contributor IDs blindly or decorate three arbitrary players. Offer the real comparison frames through Compare while retaining the live frame's honest state.

For shots, highlight the source shooter/ball location or actual source-linked participants when available; do not invent three contributors just to mirror the positional picture. If a source participant is unknown, highlight the observed ball event and state that limitation. Use the same tactile ring language with correct incident-specific meaning.

Preserve the 105×68 metre field and original coordinates. Keep the camera top-down. Create depth with the enclosure, shadows, material colours and pieces; no tilted/perspective analytical field or fake 3D reconstruction. Use instance-safe SVG IDs for any gradient/filter. Preserve coordinate titles, accessibility and hit targets.

## 7. Replace passive step labels with real exploration state

Make Watch / Compare / Explain feel like a small guided exploration, as in the reference. Keep it optional, with all controls accessible. This measures UI exploration, not comprehension or football expertise.

- Watch focuses/reveals the actual source-bound moment/pitch without an unexpected seek. Mark it explored only after a genuine user action on the available moment, not merely because the page mounted.
- Compare opens/reveals the real source comparison/Proof Summary. Mark it explored only once the correct independently validated evidence response is successfully shown. Loading, failed and wrong-match receipts do not earn completion.
- Explain reveals the existing controlled explanation and its uncertainty, with an optional Listen action. Mark it explored only after that explicit successful interaction. Do not call paid AI or invent explanatory prose.
- The current step has a raised violet disc, visited step a check, unvisited step an outlined circle. Connectors fill only for actual progression. The small “n of 3 explored” label is derived from this state; never hardcode the image's count.
- Scope state by stable match + incident/claim identity/evidence cutoff. Ordinary replay ticks or theme toggles preserve it. A different incident/fixture cannot inherit a completed badge. Avoid persistence/account/backend additions for this pass.
- When all three have been explored, use a restrained “Evidence explored” state with a one-time gentle acknowledgement. No fabricated points, ranks, football-correctness score, confidence percentage, coin economy or confetti loop.
- Missing positional support, withheld current evidence and other event types get appropriate available actions. Never provide a false completed Compare step for missing evidence. Always keep limits honest.

## 8. Implement the reference's audio and caption controls honestly

The requested speaker controls must work. Implement optional browser text-to-speech for approved match events and selected explanations, with no Azure provisioning, paid model/Speech request, new SDK or exposed credentials. Start OFF. Start audio only through an explicit user gesture.

Use available local browser voices when possible. Voice availability is platform-dependent; when a suitable local voice is unavailable, show a clear disabled/unavailable state and keep captions/text usable. Do not claim a guaranteed offline neural voice or send text to a remote fallback service silently.

Controls:

1. “Commentary off/on” pill with speaker icon. When enabled, reads a short existing approved line for fresh eligible key moments reached during continuous playback. Do not voice raw detector alerts or unrestricted model prose.
2. “Preview commentary” round speaker action beside the primary evidence/explanation action. Reads the selected source-verified explanation on demand. For a historical selection, label it as that incident, not current live play.
3. “Captions on/off” CC pill. Controls the dedicated readable caption line/overlay, not the visibility of essential evidence, uncertainty or errors. Default captions ON; keep the transcript/explanation accessible.

Audio lifecycle:

- Cancel current speech and queued items on seek, fixture change, restart, disabling commentary, leaving the relevant view, or unmount. Pause/speed changes must not leave a stale queued sentence speaking over new play. Use cancellation/generation identity so an old asynchronous voice callback cannot restart cancelled speech.
- Never read the entire historical timeline on initial load at 56:00 or after a seek. Auto-commentary reacts to newly reached eligible incidents in continuous playback only. Explicit Preview is the only route to intentionally speaking a selected historical explanation.
- Bound the queue, favour the newest relevant incident, and handle fast replay without accumulating narration. Do not slow or block the match while speech finishes. Keep event IDs, match identity and clocks attached to queued items.
- Use the original verified text/controlled template; the speech layer does not calculate, paraphrase into new tactical claims or invent coaching intent. Treat withheld evidence as withheld; no spoken current claim from a stale source.
- Separate browser voice from saved Foundry provenance. Reading a saved explanation aloud is not new live Foundry inference.
- Mock speech synthesis in automated tests. No actual paid/service audio calls in tests, no need to capture microphone input, no new permissions.

## 9. Carry the tactile theme across existing surfaces

Use the same white shell/lavender insert, typography, semantic colour and depth system throughout. Preserve each surface's purpose and density:

- Investigate: raised selected fixture/nav affordance, coherent field/score/transport, readable restricted Ask and recap. Keep advanced information structured; ordinary feed rows are not giant 3D buttons. Hover is visibly quieter than active selection.
- Proof Lens: lifted white/plum dialog shell, lavender comparison insert and pink delta. Actual source snapshots and contributors remain authoritative. Method/Audit tables are readable, with contained scrolling and honest provenance. Preserve section-scroll reset, focus return, Escape and wrong/future/cross-match rejection behavior.
- Studio: same dialog materials and control depth. Preserve “Recorded execution”, saved outcomes, real durations, skipped/fallback distinctions and independent branches. No decorative fake live thinking or model progress.
- Guided demo: tactile real chapter controls; preserve separate-fixture disclosures and timers. Theme applies to entry and active strip.
- Program output: preserve clean-mode purpose; show only its permitted source-bound broadcast content and a way to exit. No accidental gamified controls or exploratory badges in clean output.
- Loading/error/withheld/empty/buffering states: same shell and semantic treatments; raised Retry where appropriate. Do not use victory-style success visuals on unsupported facts.

## Implementation owners

Inspect and amend the existing owners: App.tsx; design/theme.css, matchday.css, broadcast.css and styles.css; broadcast/BroadcastTheatre.tsx, MatchdayInvestigation.tsx, MatchTimeline.tsx, ReplayControls.tsx; Pitch.tsx; ProofLens.tsx; proof/ProofSummary.tsx; and the existing Studio/guide presentation components.

Add a small frontend-owned commentary controller/hook and exploration-state helper if needed. Keep them isolated, bounded and readable. Reuse existing API/proof contracts and useStorySupport validation/caching. No broad state rewrite or independent replay transport. No backend changes, frozen lockfile changes, fixture regeneration or source fingerprint changes.

The validated positional example remains 21.95m → 31.96m, +10.01m, 59 source samples: 41 earlier / 18 recent. Those are acceptance expectations for this fixture, never UI constants. Sample counts are not independent trials. Broader pressing, coaching intent and detector accuracy limits remain unchanged.

## Verification — show the exact requested result

Work locally with existing dependencies, Node 24, documented source fixtures and a permitted browser workflow. Inspect existing processes/URLs; do not stop others' servers or confuse dev and old production assets.

Run typecheck, production build, relevant focused tests during implementation, then the existing full frontend suite after integration and `git diff --check`. Follow AGENTS.md for Distill and exit-code handling. Investigate failures; preserve meaningful assertions and report any broad-run failure separately from an isolated rerun. No application/backend experiment reruns to manufacture a visual pass.

Add meaningful coverage for:

- Fluid desktop width: no old narrow centred cap at 1366/1440/wider widths; field geometry correct and no horizontal page overflow.
- Actual white outer shell / lavender sibling inserts and usable mobile playback placement.
- Eligible moment arrival ring, seek behavior, manual historical selection, future marker exclusion and unchanged replay clock semantics.
- Real exploration progression, failed-proof non-completion, match isolation and preservation over theme/replay ticks.
- Commentary off by default, explicit gesture, no history backlog, bounded queue, cancellation/race cases and unsupported voice fallback with captions available.
- Correct positional contributors for exact frames; shot highlight does not invent source participants.
- P4 buffering/refill, P5 keyboard/pointer reveal, proof navigation/freshness/isolation, native score boundary and original shot incident timing.

Capture full-resolution light/dark Matchday at 1366×768, 1440×900 and a wider desktop; mobile at 390×844; representative Investigate, Proof Lens and Studio. Capture both resting and pressed/current states so the requested depth is visible. A screenshot cannot establish audio or temporal behavior: verify those interactions and preserve a short local recording or an explicit interaction log where practical.

Compare the reference and current loaded screen at equivalent viewport dimensions. Specifically inspect: use of width; white shell vs lavender insert hierarchy; tactile selected tab; raised play/evidence buttons; font roles; richer field/player pieces; pink/red event ring; actual three-contributor comparison; progress steps; speaker/CC/replay utilities; dark theme and mobile readability. Correct mismatches before handoff. Do not call a page visually accepted because visibility tests pass.

Write a new `research/design/turn-of-play/final-reference-interaction-acceptance.md` with exact file scope, commands/results, screenshots, interaction checks, source preservation and remaining gaps. Preserve old reports as historical evidence. Reconcile the current visual milestone in CURRENT_STATUS.md without rewriting prior acceptance claims.

## Exit and product-development handoff

Finish this scope first. No automatic claim of human comprehension, new detector accuracy, cloud validation or deployment. If audio/voice availability is platform-limited, explain the actual fallback; do not show fake functionality.

Show the loaded full-width light/dark/mobile result, demonstrate the key-moment ring and real step progression, then STOP FOR USER VISUAL REVIEW. No commits or publication.

After this is accepted, the next product milestone is editorial relevance: make the right explanation appear at the right moment, preserve explicit historical exploration, and keep stale facts out of current presentation. Re-read the existing P6.1 design before implementing that separately scoped product work. Do not reopen broad visual exploration or silently start every queued milestone.
