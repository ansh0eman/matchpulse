# Turn of Play — complete visual implementation prompt for GPT-6 Luna

## Assignment and scope

Finish the selected Turn of Play visual design throughout the existing application. The user has rejected the current visual result despite functional progress. This assignment authorizes a local frontend visual correction across existing surfaces, with relevant local verification. It does not authorize the unrelated queued P6–P13 analytics/product milestones, cloud calls, publication or deployment.

Implement the work; do not stop at a plan or documentation. Work sequentially in the stages below, keeping the application usable. Finish all stages in this scope before the final review handoff. Do not introduce parallel agents or competing redesigns.

This prompt supersedes the earlier layout correction prompts for this visual scope. Their factual safety requirements remain applicable. Read AGENTS.md and research/product-excellence/CURRENT_STATUS.md first; the historical P6.1 stop is not an instruction to refuse this newly requested frontend work or to begin P6.2 editorial-policy implementation.

The accepted visual authority is `research/design/turn-of-play/reference.png`. Open and inspect that file before coding. It shows the selected purple rounded Matchday design, temporarily labelled MATCHQUEST. The product name is **Turn of Play**. Use the same selected font appearance: locally bundled Outfit for display roles and DM Sans for body/UI roles. Do not generate another design, substitute a fashionable font pairing, or make a generic analytics dashboard.

Preserve the existing application and verified factual behavior. No detector, backend analytics, evidence, scheduler, fixture, experiment or provider changes. No dependency installation, new UI library, package renaming, repository rename, commits, pushes, merges, deployments, paid inference, Speech calls, account changes or global configuration.

## Stage 0 — inspect and establish a reviewable baseline

1. Read current Git status/diffs and latest Step 1/Step 2 reports. Identify concurrent changes before editing. Do not reset, stash, clean, bulk-stage or overwrite unrelated work. Preserve private/untracked Priority 2 and Priority 5 materials.
2. Name the exact intended file scope and local verification plan. The ownership map below gives likely files, not permission for an unrelated refactor.
3. Check existing local servers and verify the URL actually serves the current intended code. Do not stop another workstream's processes. Resolve stale/dist/dev ambiguity using evidence, not speculative cache explanations. Verify both development and production-preview behavior at the end.
4. Capture the current loaded line-shift Matchday, Investigate, Studio, Proof Lens and guided demo in both themes before changing them. Use a permitted browser tool; preserve user browser state. Identify the source-backed scenario and replay clock for every capture.
5. Write a short checklist in a new `research/design/turn-of-play/full-visual-checklist.md`. Track each surface as untouched / implemented / technically checked / visually reviewed / remaining issues. Preserve old acceptance records as historical evidence; append a new report rather than rewriting their results.

## Design contract — applies everywhere

The feeling is a welcoming, confident football viewing experience: soft lavender, rich plum typography, vivid violet actions, pink selected measurements and a clearly drawn green pitch. The main visual event is the football comparison. Every other surface uses the same visual vocabulary while keeping its own job and density.

### Color tokens

Use one semantic token authority in `web/src/design/theme.css`. Audit and reconcile the cascade in styles.css, broadcast.css and matchday.css. Do not pile another long override tail on top of conflicting declarations.

| Role | Light | Dark |
| --- | --- | --- |
| Canvas | #F7F3FF | #130A1B |
| Primary surface | #FFFFFF | #20102C |
| Raised surface | #FFFFFF | #251432 |
| Subtle surface | #F0E8FC | #2B1739 |
| Primary text | #360D3A | #FAF7FF |
| Secondary text | #655472 | #C5B6D2 |
| Border | #E5D9F4 | #493454 |
| Brand violet | #963CFF | #963CFF |
| Selected measurement/moment | #E90052 | #FF4A88 |

Keep `brand` distinct from accessible `action` color. The existing light action #7923DB is a useful starting point for small white button text; do not force white normal-size text onto #963CFF without checking contrast. Adjust foreground/background pairs when needed while preserving the palette. Pink is the selected metric/moment accent, not a universal error or verification color.

Define success/warning/error/info tokens with readable foreground, subtle background, border and icon treatment in each theme. Verification may retain a restrained green accent, but green must not become the background of every proof surface. The field and team markers have their own semantic colors. Remove legacy teal/cyan UI accents outside those explicitly justified semantic uses.

Inspect every foreground/background pair, including inactive navigation, placeholder text, table headers, disabled controls, selected rows, focus, hover and modal scrims. Aim for WCAG AA text contrast and distinguish states through words/icons as well as color. Do not claim full compliance from screenshots alone.

### Typography

- Outfit: wordmark 24–28px/800; short main headings 28–32px/800; section headings 18–22px/700; scores and large comparison numbers 30–36px/800. Tune against the reference.
- DM Sans: body 14–16px/400–500; controls 13–14px/600; labels and metadata generally 12–13px/500. Avoid shrinking meaningful copy below 12px to force a layout fit.
- IBM Plex Mono only for raw IDs, hashes, formulas and code where it helps; not as the default for every label or time.
- Give numeric comparisons tabular figures and stable unit alignment. Units are smaller, but remain legible. Do not give every metric the same emphasis.
- Keep heading tracking restrained (approximately -0.02em); do not compress the wordmark or long technical headings with aggressive negative spacing.
- Use sentence case and concise labels. No ALL-CAPS eyebrows above every region, extra AI badges, decorative slogans or gradients inside the wordmark.
- Long factual claims use a short title plus supporting copy. Preserve qualifiers and full details; shorten presentation rather than discarding evidence boundaries.

### Geometry and components

- Spacing scale: 4, 8, 12, 16, 20, 24, 32px. Make grouping deliberate; do not put 32px gaps between every piece of a single comparison.
- Major workspace/dialog radii 20–24px; secondary containers 14–18px; ordinary controls 10–12px. Reserve fully rounded pills for chips and appropriate compact controls.
- Use subtle 1px borders. Default surfaces do not all need shadows; reserve a soft shadow for raised dialogs/menus or the selected reference's floating rail treatment.
- Buttons: consistent 36–40px desktop heights, comfortable mobile touch targets, balanced horizontal padding, icon/text alignment and pressed/loading/disabled/focus states. One main action per region. Icon-only controls need accessible labels.
- Inputs/selects/range controls: use the same typography, borders, violet selection and focus treatment in all modes. Do not leave an unstyled teal browser range next to carefully designed buttons.
- Keep Phosphor icons from the installed package. No emoji UI, invented lion mark, extra illustration system, decorative SVG mascot or copied competitor characters.
- Motion: short 120–180ms action feedback where helpful; no repeated pulsing, unnecessary entrance animations or fake live processing. Respect reduced motion.

## Stage 1 — global shell and Matchday composition

### Header, brand and navigation — App.tsx and owning CSS

- Write the brand as readable **Turn of Play**, preserving the word spaces. Use a clean wordmark; do not add an unapproved logo.
- Header approximately 56–64px high, with vertically centred contents. Brand left, Matchday / Investigate / Studio around the centre, quiet utilities right.
- Active navigation is an inset lavender pill around 34–38px high, with restrained violet detail. It must not stretch to the header's full height or become a huge capsule.
- Inspect inherited `height: 100%`, vertical padding and active-state specificity. Fix the owning rules, including theme.css selectors that currently compete with matchday.css.
- Keep Guided demo and the global theme toggle reachable without dominating navigation. Synthetic replay disclosure should appear once in a sensible place, not disappear or repeat in several bars.
- Preserve URL compatibility. Internal `mode=studio` historically opens Analysis Room/Investigate; `room` opens the Agent room/Studio. Do not swap behavior just because display labels changed.

### Matchday frame — BroadcastTheatre.tsx / matchday.css

- Main hierarchy: header, then a two-column workspace near 70/30. Left is score + field + moments + transport; right is the investigation.
- Remove the standalone archive row and redundant “Matchday / North v South” context band. The reference has neither a large archive heading nor a second match title above the scoreboard. Preserve program-output access in quiet utility chrome.
- Start with a 12–16px main column gap. At laptop size, the rail should be approximately 320–350px. Do not let it expand to a huge half-page prose column on a wide monitor.
- Constrain overall width intentionally. Reconcile width with viewport height: derive the stage's width from the available height when necessary, rather than putting a fixed-height field inside an ever-wider stage. At 1366×768, a workspace around 1100–1150px wide is a useful initial fit budget, not a mandatory final constant. Test rather than assuming.
- Essential selected evidence, score, field and transport should be readily visible at 1366×768. Use a little document scrolling where content genuinely requires it instead of clipping, shrinking typography, or adding many nested scroll panes.
- Wider screens may gain balanced margins and moderately wider workspace, not unlimited card widths. Do not scale the entire app using CSS transform/zoom.

### Score strip

- Compact lavender-tinted strip inside the left workspace, roughly 44–48px high. Team names and score form the focal group; time and half are aligned on the right.
- Use source-prefix score, actual clock/period and existing loading/buffering/error states. No hardcoded score, date, total duration or status copied from the concept image.
- Team dots/markers should be circular or clean kit swatches, not arbitrary skinny rectangles. Preserve team identity across field, legend and text.
- Keep a historical selected incident's time distinct from the replay clock; do not put four duplicate timestamps across the score strip.

### Field — Pitch.tsx and stage wrappers

- Fix the current `height: clamp(280px, 40dvh, 450px)` sizing trap. The SVG preserves its aspect ratio; the imposed height currently leaves huge horizontal gutters.
- Use the SVG's intrinsic `113 / 76` framing and original 105×68 metre field geometry. The actual field boundary should occupy approximately 85–93% of the green panel's width, not roughly half. Inspect actual transformed field bounds, not only the outer SVG's 100%-width box.
- Preserve original coordinates and aspect ratio. Never use `preserveAspectRatio="none"`, stretch x/y differently, crop goals/touchlines or move players to imitate generated reference coordinates.
- Make stripes and field lines clearly visible against a richer green field. Style existing SVG elements/tokens with source-neutral visual changes; retain source coordinates and GK/team/highlight semantics. Avoid muddy uniform dark green or decorative stadium effects.
- Keep modest internal edge clearance, a discreet team legend and an “Observed positions” / ball-only label appropriate to actual data.
- Scope styling so smaller Proof Lens pitches remain correct. If multiple pitches are displayed, preserve or correct SVG definition IDs to be instance-safe rather than letting one pitch borrow another's pattern.
- Contributor highlights are allowed only when verified IDs belong to the exact displayed calculation frame. Do not highlight arbitrary live/current players or imply a representative snapshot alone equals the aggregate.

### Moments and transport — MatchTimeline.tsx / ReplayControls.tsx

- Replace the large “The match so far” card carousel with the reference's compact horizontal key-moments timeline. This requires changing component presentation, not just card border radius.
- Put key moments above transport, below the field, within one coherent left workspace. Use a small label, slim ticks/line, eligible incident points, concise time/type labels and a clear pink selection ring. Decorative ticks may span the duration; factual incident markers must never expose future events.
- Use chronological placement from actual available/presentation semantics, with incident time clearly labelled. Handle dense nearby incidents with readable grouping or accessible compact disclosure; do not silently drop source moments or fabricate timestamps to spread markers.
- Keep original story IDs, all three source/available/presented <= replay checks, explicit historical selection, keyboard selection and P5 touch/pen reveal behavior.
- If a viewport uses a compact overflow list for accessibility/density, keep it secondary. Do not recreate the giant horizontal card rail as the primary timeline.
- Integrate play/pause, current/total time, range and speed in a compact row. Violet progress track/thumb; selected event pink. Preserve restart access and existing available speeds.
- Reuse the single replay clock and existing causal buffer/refill engine. No new replay timer, duplicated player, seek-on-highlight surprise or state reset on theme change.
- Consolidate Fan/Analyst, favourite team and scenario selection into compact accessible secondary controls. Keep all six fixture choices accessible; remove the full library strip from competing with the main default composition. Do not delete controls merely to clean a screenshot.

### Investigation rail — MatchdayInvestigation.tsx / useStorySupport.ts

Use this exact positional information hierarchy:

1. Small Watch / Compare / Explain orientation: three circular nodes, short connectors, labels below or neatly beside them. No hardcoded completed count/checks. Active/completed claims must reflect genuine actions; otherwise present neutral orientation.
2. Main heading **“Spot the shift.”**, followed by one concise source-scoped sentence identifying the team/comparison. Do not lead with a long “Line-height difference: 10.01 metres.” headline.
3. A pale comparison surface headed **“Compare the evidence”**. The most prominent measurement is the approved signed difference, pink, with the descriptive label “line-height difference”. For the known fixture it displays **+10.01m**; derive it from the actual approved values/contract, never a literal constant.
4. Two aligned columns: **Earlier window** and **Recent window**, with the actual means (known fixture 21.95m and 31.96m) and smaller units. No oversized arrow pushing these to opposite edges of an overly wide box.
5. Source-verified support: known fixture **59 samples**, followed by **41 earlier / 18 recent**. Derive counts from the scoped proof, not from a guessed split or a count of two representative snapshots. Keep loading/error/retry states honest.
6. Two distinct compact sections: **“What this tells us”** and **“What stays uncertain”**. State the three deepest observed outfielders, sampled windows and meaningful limits in plain language. Do not infer coaching intent, successful pressure or continuous movement. Keep these sections short and readable, with installed icons if useful.
7. Full-width primary action **“Compare the evidence”**, opening the existing independently verified Proof Lens for this exact story. Do not call a proof action “Play narration” or imply a model call.

Keep timing accessible through a compact labelled line plus expandable timing details where needed. Preserve source, availability, presentation and current replay clocks in the UI/data contract, but do not repeat all four at equal visual weight in the headline region. Remove the redundant selected-story footer if its useful context already appears above.

For non-positional stories, keep a short incident-specific title and source-grounded content. Shots must identify their original team/incident time; goals preserve their actual score boundary; unavailable facts remain unavailable. Never reuse the positional numbers, headline or support card for every story type.

For withheld evidence, show why current comparison cannot be supported and the actual diagnostic age. No current-proof action, triumphant verification badge or stale claim presented as current. Historical evidence stays explicitly historical.

Preserve useStorySupport's match/story/claim/time validation and request caching/cancellation. Ordinary replay ticks must not trigger repeated proof requests. Changing fixtures must never flash previous proof counts as the new match's evidence.

## Stage 2 — carry the theme through existing investigation and evidence surfaces

“Carry the theme” means shared typography, semantic colors, spacing, control states and restrained geometry. It does not mean turning every advanced screen into the exact Matchday layout.

### Investigate / Analysis Room — App.tsx sections under studio-layout

- Use the same header, canvas, plum text and violet/pink semantics as Matchday. Remove old dark-green/acid-lime chrome in light mode and mismatched dark surfaces in dark mode.
- Scenario rail: compact readable entries with a subtle selected lavender background and violet state, descriptive fixture names and clear current fixture. Remove decorative sequence numbering if it has no navigational meaning; preserve actual guided chapter numbering elsewhere.
- Main heading: concise “Investigate” or an equivalent clear existing title; smaller source/replay metadata below. Avoid another giant slogan above the pitch.
- Audience and favourite-team controls use the shared segmented/select styles. Mode changes preserve actual match, clock and selection as existing contracts require.
- Scoreboard, field wrapper, transport and verified metrics adopt the same token system. Preserve technical density and facts without a second visual brand. Keep scope-specific sizing so advanced analysis remains usable.
- Current explanation: short headline, clear source/selected context, readable sentences and one main proof action. Registered claim links should look interactive, with hover/focus/selected states in both themes.
- Timeline/feed sidebar: align time/type/summary, distinguish selected past incident from latest recorded moment, avoid giant green rows or unreadable muted labels. Preserve causal availability and accessible selection.
- Ask: keep the existing restricted question buttons and deterministic answer contract. Restyle supported, unsupported, unavailable, loading and error outcomes. Do not add a free-text composer that pretends unrestricted chat is supported.
- Recap: compact source-clock rows with readable text and genuine navigation. Preserve source-prefix filtering; no future/full-match summary leakage.
- Withheld/error areas: purposeful shared warning/error components with clear recovery actions. Keep diagnostic statements distinct from approved broadcast facts.

### Proof Lens shell — ProofLens.tsx / useDialog.ts behavior

- A coordinated light surface in light mode and plum surface in dark mode; consistent radii, borders and padding. It must feel like part of Turn of Play rather than a separate green developer console.
- Desktop dialog approximately min(1040px, viewport minus comfortable margins), sized to content with a usable maximum height; adjust after comparing real content. Mobile uses nearly the available width/height without offscreen close controls.
- Header is compact: Proof Lens title, quiet context, theme and close controls. Align utilities to the right without overlapping the title. Keep dialog focus containment, Escape, background click handling and return focus.
- Verification banner is restrained: icon, “Source arithmetic verified” or equally scoped existing wording, short qualifier. It proves the recomputation performed on this request, not coaching intent, overall model accuracy or universal factual truth.
- Summary / Method / Audit tabs share the navigation system and clear selected state. Preserve keyboard behavior, section-scroll reset and heading focus when sections change.
- Loading: stable geometry and honest source-recomputation status. Error: readable message plus Retry proof; no success badge from cached prior state. Do not hardcode a delay or show fake percentage completion.

### Proof summary — proof/ProofSummary.tsx

- Replace the huge long factual heading with a concise incident title and readable qualified explanation. Example for position: short “North's sampled line comparison”, then the actual signed change, means and measurement scope. Preserve direction for negative changes and neutral handling when unavailable.
- Use one clear aggregate comparison with pink delta and equal earlier/recent columns, matching the rail's visual system. Do not put dark-green panels inside a purple modal or background-color whole data rows purple by accident.
- Two source snapshots are equally sized and aligned. Captions distinguish original source time and representative snapshot proxy from sampled-window means. Keep source IDs accessible; do not rename snapshots as the aggregate.
- Keep the contributor inspector, raw player coordinates, source-frame references, support counts, matched context and correlation limitation. Present these progressively; do not delete them to make the modal shorter.
- For shots/goals/event chains, use their actual existing calculation and incident copy. Preserve the South 54:39 shot's original incident time even when replay is 56:00.
- Download action retains its actual export semantics and source provenance. Visible product text may say Turn of Play; historical record identifiers and compatibility-sensitive artifact/schema names remain unchanged unless explicitly safe and necessary.

### Method and audit — ProofLens.tsx

- Formula: readable code block on a subtle theme surface, wrapping or deliberate horizontal scrolling without overflowing the dialog.
- Sample/window controls: same select/range/button system as the rest of the app; active sample/state visibly clear.
- Tables: semantic headers, readable text, restrained separators, subtle header surface and sufficient cell spacing. Small-screen horizontal scrolling belongs to the table region, not the whole page. IDs and precise numbers remain copyable.
- Provenance: readable metadata list, wrap hashes/UUIDs safely, preserve full values and verification receipts. No pink success score or “100% trust” invented from an arithmetic check.

## Stage 3 — Studio, guided demo and every shared state

### Studio / Agent room — App.tsx, agents/WorkflowGraph.tsx, agents/DecisionEvidence.tsx, RecordedRun.tsx

- Use the same dialog frame, header/close controls, typography, theme surfaces and progressive-disclosure treatment as Proof Lens. This is a technical view with the same brand, not a cartoon crew clone.
- Keep an immediately visible **“Recorded execution”** label and the existing distinction between saved genuine Foundry output, deterministic cards and historical recovery. Opening Studio must not start a model call.
- Lead with a short description and actual narration/replay outcomes. Group the workflow and its source-verification result coherently; move lengthy platform/tool/hash details into their existing disclosures without hiding important boundary labels.
- Workflow nodes: consistent role title, actual status, duration and recorded usage if present. Violet for selection/structure; semantic success/warning/error for actual results. Skipped is distinct from failed. Missing evidence says not recorded/unavailable.
- Preserve independent Narrator and Replay Producer branches in the visual flow. Do not depict a simple linear pipeline if the recorded orchestration branches. Use existing DOM/CSS structure and installed icons; no new chart library.
- No continuously animated “thinking” nodes, fabricated percentage progress, fake live cursors or randomly replayed activity over a saved trace.
- Decision evidence list: clear chronological rows with small time column and short decision text. Actual challenger narrowing/recovery stays visible, not rewritten as universal success.
- RecordedRun: consistent timeline/status chips and expandable tool details. Preserve source labels, original match namespace/hash and actual event values. Request attempts are not relabelled HTTP requests; reported tokens are not fabricated cost.
- Avoid duplicating the same timing/token totals in several equally prominent cards. Retain full technical detail in clearly labelled disclosure.

### Guided demo entry and active story — App.tsx / demo/GuidedStory.tsx

- Entry dialog: compact title and clear “Start guided demo” action, readable fixture choices and same button/tile system. Keep theme/close controls aligned and keyboard accessible.
- Active story: a compact coordinated chapter strip with real chapter progress, readable explanation and pause/next/close controls. It must not obscure field controls or proof actions on mobile.
- Preserve all four existing chapters, their actual timers, pause/resume, fixture transitions and final close. Make separate synthetic fixtures explicit; never imply the goal, line comparison and withheld example belong to one match.
- No new compulsory onboarding, arbitrary XP or fake completed exploration count. Watch/Compare/Explain gamification can remain neutral orientation until actual supported interactions define completion.

### Program output

- Preserve clean program-output behavior: hide application/editor chrome as currently intended, keep essential score/story/source disclosure legible, provide an accessible way to exit.
- Theme changes do not recreate controls that clean mode should hide. Do not change screenshot/video/publication artifacts or claim new broadcast integrations.

### Global controls and transient states

Audit and correct all of these in both themes: links; primary/secondary/icon buttons; nav/segmented tabs; selects/options; sliders/progress; details/summary; loading skeletons/spinners; empty timeline; no tracking/ball-only; buffering; offline/API errors and Retry; restricted Ask unsupported/unavailable; stale evidence; proof errors; recorded workflow unavailable; selected historical incident; source IDs/code/formulas; tooltips and any existing toast/popover.

Use the root theme as the authority so dialogs/portalled surfaces inherit it too. Preserve saved preference, system-preference behavior, storage-failure handling, prepaint/CSP compatibility and theme-color/color-scheme behavior. No remote font requests or inline bootstrap that violates production CSP. Do not add toast/menu systems or settings pages where none are needed.

## Responsive behavior and accessibility

- Validate 1366×768, 1440×900 and 390×844; inspect a wider monitor and a 768px transition width for awkward gaps. Existing configured laptop/mobile browser projects remain authoritative tests; additional visual widths may use a permitted browser capture.
- Mobile order: compact header and score, field, selected comparison/explanation access, moments/transport, secondary controls. Preserve P5 selection reveal. Keep the compact match controls reachable without scrolling through an oversized proof essay.
- No horizontal page overflow. Tables, densely clustered timeline points or raw code may have intentional contained scrolling. Do not globally hide overflow to conceal broken layout.
- Touch targets around 44px where practical, clear focus, semantic labels/headings, no color-only state, no hover-only essential explanations. Respect reduced motion and browser zoom. Preserve dialog focus/return and section-scroll reset.
- Do not create multiple independently scrolling panels just to force a viewport screenshot. Prefer normal document flow and a bounded dialog body; sticky rail behavior must remain usable at short heights and while zoomed.

## File ownership and boundaries

| File / owner | Permitted work |
| --- | --- |
| web/src/design/theme.css | semantic palette, type/spacing/radius/control tokens and shared theme states |
| web/src/styles.css | base ownership cleanup and existing Investigate/control rules |
| web/src/design/broadcast.css | proof, studio, guide and shared existing-surface visual rules |
| web/src/design/matchday.css | actual Matchday composition, field frame, timeline, transport, rail and responsive rules |
| web/src/App.tsx | scoped header, secondary controls and existing dialog/Investigate presentation changes; preserve state ownership |
| web/src/broadcast/BroadcastTheatre.tsx | compose unified Matchday surface and quiet utilities |
| web/src/broadcast/MatchdayInvestigation.tsx | exact rail hierarchy and state-specific content |
| web/src/broadcast/MatchTimeline.tsx | compact real timeline preserving causality and selection |
| web/src/broadcast/ReplayControls.tsx | integrated visual transport preserving callbacks/clock |
| web/src/Pitch.tsx | source-neutral visual styling and instance-safe defs if needed; preserve coordinates/geometry |
| web/src/ProofLens.tsx and proof/ProofSummary.tsx | coordinated evidence presentation, full preserved details and interactions |
| web/src/agents/WorkflowGraph.tsx, DecisionEvidence.tsx, RecordedRun.tsx | consistent recorded-execution presentation |
| web/src/demo/GuidedStory.tsx | chapter-strip visual treatment; preserve chapter behavior |
| web/tests/* relevant specs | meaningful updated behavior/theme/geometry assertions; preserve safety cases |
| research/design/turn-of-play/ | new checklist and final visual acceptance record |

Small presentational helpers or a focused shared component are allowed when they reduce real duplication. Avoid an application-wide component-library migration. Keep React components readable; visual work does not require rewriting network/state hooks.

Protected: backend/, poc/, data/, frozen research/step2*, original evaluation fingerprints, backend/uv.lock, provider behavior, playback causal validation, evidence validators/contracts and private participant/review materials. Read existing contracts as needed; do not broaden APIs or return shapes to make a visual component convenient. `useStorySupport.ts` should retain behavior; if an actual defect is found, report and make only a necessary focused repair with a meaningful regression test.

## Verification and acceptance gates

Use existing Node 24/local viewer setup, available dependency installations and verified fixtures. Inspect current scripts instead of inventing commands. From repository root:

```sh
npm run typecheck --prefix web
npm run build --prefix web
MATCHPULSE_TEST_URL=http://127.0.0.1:<verified-local-port> npm test --prefix web
git diff --check
```

Replace the port placeholder with the actual existing local server. This authorizes relevant local frontend checks, not public-host testing or cloud inference. For verbose noninteractive output follow AGENTS.md: `set -o pipefail`, precise Distill question with exit/failure/test counts, wait for completion; inspect bounded raw failures if fields are omitted. No permission escalation in this environment.

Run focused checks after substantive stages, then the existing full frontend suite after integration. Preserve P4 buffering/refill, P5 pointer/keyboard/reveal, causal timeline, proof freshness/match isolation, source incident timing, theme/prepaint/CSP and guided-story tests. Adapt copy assertions only when legitimate UI copy changes; do not remove contract coverage. Do not raise timeouts, remove assertions, disable cases or relabel a broad-run failure as success because an isolated rerun passed.

The current layout checks prove visibility, broad region widths and source support. They do not prove visual fidelity. Add useful geometry/interaction coverage for the new compact timeline and field occupancy, but visual inspection remains separate.

### Required visual captures

Capture loaded application states, not placeholders:

| Surface | Required captures |
| --- | --- |
| Matchday line-shift | laptop + mobile, light + dark |
| Matchday non-positional shot/goal | laptop both themes; mobile representative |
| Withheld state | laptop/mobile; no current-proof action |
| Investigate | laptop light/dark; mobile representative; Ask supported/unsupported state |
| Proof summary | laptop/mobile light/dark, original snapshots/aggregate distinction |
| Proof Method / Audit | laptop both themes; mobile table/ID handling |
| Studio recorded workflow | laptop/mobile both themes, actual saved provenance visible |
| Guided demo entry + active chapter | laptop/mobile representative and dark-theme check |
| Loading/error/buffering | representative deliberately exercised existing local test states in both themes |
| Program output | one clean-mode capture and exit check |

Use correct native fixture boundaries and original times; do not splice screenshots of separate matches into a supposedly single-source story. Never expose private material or credentials in captures.

Compare reference.png and the final loaded Matchday screenshot together at matching canvas size or documented proportional scaling. Assess actual field occupancy, header/nav shape, timeline size/order, rail content order, pink delta, type scale, grouping and vertical composition. Correct the visible mismatches and recapture; do not simply say the concept is static and therefore any similar layout passes. Preserve accurate physical field geometry if the generated reference is imperfect, and explicitly document that bounded exception.

For other surfaces, visually check the theme system has actually propagated: no legacy teal/green panels, white-on-white text, dark islands in light mode, giant inherited headings, default browser controls, clipped code, inconsistent pills or excessive nested cards. Use captured evidence to substantiate the review. Do not invent a visual-fidelity percentage.

## Final handoff

Write `research/design/turn-of-play/full-visual-acceptance.md` containing:

- Exact files changed and purpose, preserving ownership of unrelated edits.
- Each surface's implemented / technical-check / visual-review / remaining-issue status.
- Exact commands, actual totals/skips/failures, and any isolated reruns labelled separately.
- Screenshot paths and the actual reference-comparison findings, including remaining differences.
- Confirmation that source-bound measurements, chronology, proof verification, fallback/provenance and theme state remained intact, supported by checks rather than assertion alone.
- Explicit limits: local only; no new human comprehension acceptance, detector accuracy, cloud validation, deployment or publication.

Return loaded light/dark/mobile Matchday captures and representative Proof/Investigate/Studio captures so the user can review the visual result. Do not claim “ready” while a material visual mismatch remains. Report blockers honestly, finish the authorized feasible work, then STOP FOR USER REVIEW. Do not advance to voice, player aliases, new analytics or unrelated roadmap items.
