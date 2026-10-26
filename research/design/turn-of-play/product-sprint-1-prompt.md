# Turn of Play — Product Sprint 1 specification

Revision: checkpointed execution, 26 October 2026.

## Execution contract

### Authority and scope

This file is the sole implementation specification for Product Sprint 1. The launch message points here; do not treat excerpts from old chat prompts or earlier visual prompts as additional specifications. Follow applicable system/developer/user instructions. Read AGENTS.md and CURRENT_STATUS.md for repository constraints and current evidence; reconcile historical P6.1-only scope to the user's newer authorization for this sprint.

Supporting inputs are evidence/context, not competing execution instructions: the actual current code, reference.png, reference-detail.png, premier-league-colour-sources.json, and priority6-editorial-design.md. Frozen analytical verdicts/contracts remain authoritative about factual capability. Never use an older visual prompt to override a requirement below.

Authorized scope: local regression repair; a preservation-first shared-shell/session refactor; time-aligned timeline plus P6.2 editorial behavior; real PL club identities/colours plus header preferences; grounded natural commentary; and integration acceptance. The selected tactile design stays in place. No broader redesign or unrelated P7–P13 work.

Inspect Git/concurrent changes before editing. Preserve unrelated dirty/untracked files, private Priority 2/5 materials and historical acceptance records. No parallel agents, new dependencies, backend experiments, source-fixture/frozen-lock/config changes, paid/provider calls, Azure changes, commits, pushes, merges or deployment.

### One ordered execution path

Execute exactly Stages A, B, C, D, E and F, in that order. Start product implementation immediately after Stage A passes; do not return a regression-only handoff. Work on one stage at a time. Checkpoints are internal and require no new permission when they pass. Do not jump ahead or mutate a tested checkout while its verification command is still running.

At the beginning, create or resume `research/design/turn-of-play/product-sprint-1-progress.md`. Record the specification revision and this table:

| Stage | Status | Changed files | Evidence paths | Remaining issue / next action |
| --- | --- | --- | --- | --- |
| A | pending | | | |
| B | pending | | | |
| C | pending | | | |
| D | pending | | | |
| E | pending | | | |
| F | pending | | | |

Allowed statuses: pending, in_progress, passed, blocked. This is a work ledger, not a Git commit. Update it before advancing or ending a run. Preserve exact failing evidence even after repair. Never mark a stage passed based on a plan, old screenshots or checks from a different source revision.

If the context/run ends, leave the exact last command/result, active stage, unfinished files, artifact paths and next action. On resume, inspect the actual diff and ledger, verify they agree, then continue the first unfinished stage. Do not restart passed stages without a new change or concern that justifies it.

### Required checkpoint after EVERY stage

1. Give a short purpose/file plan before changes; capture starting scope and preserve concurrent ownership.
2. Implement the current stage in small responsibility-based steps. Repair or undo only your own offending hunks when a regression appears; never reset the whole dirty worktree.
3. Run the stage's listed focused checks, plus typecheck if TypeScript changed and `git diff --check`. Inspect failures. Preserve raw stdout/stderr before using Distill summaries; retain exit status and unique run paths.
4. For UI changes, inspect fresh loaded laptop/mobile and light/dark captures of the affected surfaces. For timing/audio/network changes, retain interaction/request evidence as well; screenshots alone cannot verify them.
5. Record exact commands, counts, source context, artifacts, outstanding issues and the pass/block decision in the progress ledger. Advance only after its exit gate passes.

Run the full frontend suite once for Stage A baseline and once for Stage F integration. Intermediate stages use appropriate focused checks. Repeat a passing check only after relevant new changes, failures or unresolved concerns. Keep purposeful scope instead of repeatedly running every suite after each CSS tweak.

For verbose noninteractive output, use `set -o pipefail`, save a complete raw log through tee, then Distill with a precise question for exit status, counts, failing names/assertions and artifact paths. Wait for completion. If a summary omits evidence, inspect bounded raw failures. Do not lose failures because a summarizer succeeded.

### Blocking failures and permitted limits

A stage is BLOCKED if its required check fails and remains unresolved; an introduced behavior regression remains; source/claim/match/time/audience isolation cannot be demonstrated; intended tests did not execute for an unexplained reason; required local fixtures/runtime are unavailable; a material visual requirement remains unmet; or completing it requires forbidden backend/cloud/billing/private-data access.

First investigate and fix within the current authorized scope. Do not advance dependent stages while blocked, mark failures accepted by implication, weaken assertions, raise timeouts merely to get green, hide failures behind skips, or substitute an isolated passing rerun for the required broad result. Record the exact reproducible blocker and attempted fixes. End for user input only when resolving it actually needs missing information, access or a scope decision; ordinary debugging is not a permission checkpoint.

An intentional existing platform-specific skip is acceptable only when named and explained. Unavailable local speech voices are an expected capability state if the specified captions/disabled-state fallback works; that does not certify voice quality. Small documented source/reference geometry differences can be explicit visual limits, but cannot excuse a broken requested layout/control. Human comprehension, new detector accuracy and deployment acceptance are outside this sprint and must not be claimed.

A passed checkpoint requires its listed outcomes and all applicable preservation checks, not a guarantee that software can never regress.

## Stage A — regression baseline

The last broad run reported 1 passed / 2 failed / 90 skipped; exact failures were not preserved. The latest JSON contains only the later 12-test interaction run. Do not claim the broad failures are fixed by that focused success.

Verify the actual current local frontend/API, source fixture prerequisites and Node 24 environment. Reuse servers safely and do not terminate other workstreams' processes.

Run the complete frontend suite, without grep or test-file filters, with a UNIQUE directory for each attempt. Preserve a raw log, JSON, failure traces/screenshots and actual exit status. `--reporter=dot` overrides configured reporters; use `--reporter=list,json`, an absolute `PLAYWRIGHT_JSON_OUTPUT_FILE`, and a unique `--output` path. Pipe verbose output through Distill only AFTER `tee` has preserved the raw output; `set -o pipefail` must preserve upstream failures. Wait for long-running commands instead of treating tool yielding as completion. Never overwrite a failed run with a later focused run.

Inspect every failure and explain the 90 skipped/not-run cases. Distinguish deliberate mobile-only skips, interrupted/unstarted cases, setup failures and genuine assertion failures. Repair actual code/harness defects. Preserve meaningful assertions and existing timeouts; do not add skips or remove coverage to get green. Retain original failures and focused repair evidence separately.

### Stage A exit gate

Retain a complete broad-run JSON/raw log/traces, names and causes of failures, and classification of every skipped/not-run case. The full intended frontend baseline must finish with no unresolved unexpected failures or unexplained unexecuted tests. If repairs were needed, retain original results and the final repaired baseline separately. Record commands, scope, totals and artifacts, then proceed directly to Stage B.

## Stage B — shared shell, safe session refactor and cross-view design

The user explicitly requests a refactor because recurring style and state defects are spreading across duplicated surfaces. Address the owners, not another tail of highly specific overrides. Refactor incrementally within this frontend scope; do not migrate frameworks or build a generic component library.

### Establish the actual causes

Current static source evidence, to recheck before editing:

- App.tsx combines replay, preferences, selection, proof, API effects and all major view/dialog markup.
- `.matchday-shell .app-header` and `.matchday-shell .synthetic-disclosure > summary` own important styles, leaving Investigate on a different cascade. The Synthetic replay native marker and icon therefore appear differently outside Matchday.
- `params` includes scenario, clock, audience and favourite. `visibleSnapshot` intentionally rejects mismatched preference scopes. Simply retaining a stale `View` under new preferences would weaken correctness.
- `useBufferedReplay` includes audience/favourite in `context`; changing them tears down the effect, cancels its request/frame loop and sets buffering on a new fill. The generation/proof-reset effect also responds to preferences and clock. This is a real lifecycle issue, not only a slow button animation.
- Static inspection currently finds one ProofLens component mount in App.tsx, with several stage/story/claim evidence entry points. Diagnose whether the user's duplicate experience is multiple visible dialogs, duplicate panels, duplicate primary actions or repeated loads. Do not invent a duplicate mount finding or delete useful per-claim navigation blindly.

### Create a small stable set of owners

Use focused equivalents of these components/hooks where they improve actual reuse:

- `AppShell` / `AppHeader`: one brand/navigation/source/guide/theme structure for every normal view.
- `SourceDisclosure`: the same working Synthetic replay control everywhere.
- `ViewModeControl` and `FollowingControl`: one appearance, accessibility contract and preference state, reused by Matchday and Investigate.
- `Surface`, `TactileButton`, `StatusBanner`: a few typed variants for real existing use cases. Keep native semantics and pass useful HTML/ARIA props through. Avoid a sprawling abstraction with arbitrary visual props.
- `InvestigateView`, `StudioDialog`, `GuidedDemoDialog`: extract existing presentation from App without changing their facts or timers.
- One proof controller/modal host; all valid evidence entry points call it with explicit match/claim/cutoff identity.
- A focused viewer-session hook/controller if needed to separate replay lifecycle, preference projection and view navigation. Keep existing request and validation owners readable.

Names/folders may follow repository conventions. Extract behavior-preservingly, one responsibility at a time. Do not impose a line-count target, memoize everything, create a global store dependency or duplicate state between extracted parents/children.

### Keep replay continuous when presentation changes

Required UX: switching Fan/Analyst, changing Following or moving between Matchday/Investigate must not unnecessarily blank/recreate the pitch, reset clock/speed, restart replay, discard valid history intent or show a full source-buffer spinner. Source exhaustion, actual source errors and real fixture changes retain honest buffering/error behavior.

Separate concepts explicitly:

1. Replay/source session: scenario + opaque match identity + seek generation, authoritative source clock/score/frame, play/pause/speed and validated transport coverage.
2. Presentation request scope: audience + favourite + source identity/cutoff and request generation. Club display mapping is presentation metadata, not a source match.
3. View mode and dialog visibility: layout/navigation intent, not a new football session.

The existing API legitimately recompiles presentation by audience/favourite. A bounded background projection request is acceptable. Do NOT remove audience/favourite from keys, pretend old Analyst stories are Fan-authorized, relabel old packets or disable `visibleSnapshot`/`validateSegment` to hide loading.

Keep the already-validated SAME-MATCH source geometry/score playing while the new presentation scope is prepared where existing transport coverage permits it. Any reusable source projection must explicitly contain only verified source fields; old audience-sensitive timeline, narrative, diagnostics, Ask results or proof cannot be passed off as a new scoped View. Show a small “Updating explanation…” state for pending presentation, with dependent actions guarded, rather than replacing the field with a spinner.

Validate the new scoped projection/packet, align it to the current published clock and swap only when safe. If it no longer covers that clock, request the correct anchor; never roll back the clock to an old response or expose a packet's future end view. Preserve the P4 anchor/refill/causal validators unchanged in meaning. A delayed old preference response must never overwrite a newer choice.

Preserve a still-eligible selected incident across a mode/preference transition; clear it if it genuinely becomes unavailable in the new audience scope. Keep proof scoped and fail closed while required context changes. Do not preserve a stale receipt merely to keep a modal looking smooth.

Avoid new request waterfalls: no repeat `/api/scenarios` or `/api/activity` fetch on a view toggle; no proof request per replay tick; no preference request caused solely by changing visual mode/theme. Retain real request cancellation and errors. If eliminating an interruption would require a forbidden backend contract change, make the safe frontend improvement, retain honest limits and report the exact boundary instead of weakening validation.

### Prove the transition behavior

Add meaningful before/after browser checks for Fan→Analyst→Fan while paused and while playing, Follow changes, theme changes and Matchday↔Investigate. Assert stable match identity, correct selected IDs, no unintended backward/zero clock reset, correct pause/speed state, source-valid observations and no full-field reload for a presentation-only transition. Use delayed and out-of-order projection responses to prove stale data cannot win. Distinguish a necessary projection request from a physical replay-session restart in network evidence.

Do not rely on CSS visibility to keep two independent replay controllers running. There must remain one authoritative session and clock.

Use the existing selected reference and Matchday's tactile controls as the visual authority. Matchday, Investigate and Studio must feel like the same application. The checkpoint must show actual component geometry and interactions, not only matching text colours.

### One constant, sticky header

- Use the same AppHeader component, DOM structure, brand size, padding, control dimensions, gaps and responsive rules in Matchday and Investigate. Switching views changes the active destination, not the header's height/position/utility arrangement.
- Place the normal header at the page's top with `position: sticky`, `top: 0`, an opaque theme surface and a subtle lower border/shadow. It remains visible when the Investigate document scrolls.
- Audit ancestor overflow, transforms and competing height/position rules that can defeat sticky behavior. Keep main scroll ownership intentional. Do not fix it by trapping each column in a different unnecessary scroll pane.
- Use shared header-height/offset tokens for content anchors, sticky sidebars and mobile reveal. Heading focus and `scrollIntoView` must not put relevant content under the header. On mobile the deliberate two-row header has the same layout in both views.
- Dropdowns anchor to their actual trigger and remain above content. Header/popover/dialog stacking uses a small shared z-index scale; dialogs remain above the header, and the header cannot cover their close buttons.
- Clean program output still intentionally hides normal app chrome. Studio is a dialog over the shared shell, not a second independent site header. Preserve existing URL compatibility and exactly one `aria-current` destination.

### Repair Synthetic replay across modes

- Promote its styles from Matchday-only selectors to the shared SourceDisclosure owner.
- Use an inline-flex trigger with 8px icon/text/chevron gaps, 12px horizontal padding, 38–40px height, rounded pill shape and the same shallow lower edge in both views.
- Suppress the native details triangle visually using scoped marker rules while preserving native keyboard semantics. The user screenshot's extra triangle, wave icon and text must no longer run together.
- The wrapper is the positioned anchor for its menu. Use a padded, rounded theme surface with a sensible viewport-constrained width, clear close/Escape behavior and focus return.
- Keep the real source/scenario/club disclosure and synthetic-data boundary. No decorative chevron with no working action, clipped menu or absolutely positioned content relative to the wrong ancestor.

### Investigate panels and controls

- Retain its useful denser layout but put distinct major surfaces on the shared lavender canvas with 12–16px gutters, 20–24px radii and restrained panel shadows.
- Match/story sidebar and broadcast-feed panel get intentional outer padding and rounded boundaries. Selected fixture rows use the same tactile system as selected Matchday controls. Inactive rows have breathing room and a quieter hover.
- Fan/Analyst and Following use the SAME shared controls specified in Stage D. Remove the old sharp-corner segmented control, grey/green legacy text and inconsistent selected outlines. The active mode is readable; the inactive mode is not styled like a disabled feature.
- The Investigate match heading/score/transport adopt the same material tokens and consistent radius/padding. Keep the field geometry and advanced source information intact.
- Current explanation becomes a padded Surface: about 20–24px desktop padding, 16px mobile, a concise title, readable factual detail, compact timing disclosure and a clean action row. Long source metadata is not a giant headline.
- Raw source windows, units, UUIDs and claim IDs remain inspectable through Analyst detail/disclosure. They must not leak as an unformatted paragraph competing with the main fan explanation.

### Ask the match, recap and related rectangles

- `.ask-panel`, `.recap-panel`, answers, current-story blocks, withheld/error panels and comparable regions use actual shared Surface ownership, not square divs whose only theme change is their background.
- Outer corners 20–24px; padding 20–24px desktop / 16px mobile; at least 12px between heading and controls; 8–12px between related actions. Preserve meaningful text sizes and line length.
- Ask question buttons use the same 12–14px rounded tactile secondary style as Matchday, with an aligned icon/chevron and comfortable inner spacing. Wrap cleanly; mobile can use full-width rows. Preserve restricted question IDs, disabled/loading behavior and unsupported answers; no fake free-form chat.
- Answer variants show a padded semantic status treatment. Loading and errors do not inherit a verified success badge.
- Recap rows have 12–16px internal spacing, aligned time/text columns, consistent rounding where standalone, and quiet separators. Keep source-clock navigation and prefix availability. Do not cut text off or remove useful rows to make the panel shorter.

### Proof Lens and evidence actions

- Inspect whether duplicate Proof Lens is multiple dialogs or repeated entry points. The current source has one mount, so test actual visible counts before changing architecture.
- Keep ONE proof-dialog host and ONE primary “Open Proof Lens” action per current incident surface. All stage/claim/history actions call the same scoped controller.
- Remove redundant primary actions targeting the exact same claim/cutoff on the same surface. Retain useful per-claim drilldown as small properly labelled inline source actions; do not delete evidence access.
- Floating fingerprint glyphs at the far edge of a long sentence become intentional inline controls/chips with proper spacing and hit area. No absolute icon pasted outside a panel, and no unlabelled icon-only evidence button.
- Opening evidence repeatedly must not stack duplicate dialogs or duplicate fetches. Opening a DIFFERENT claim updates the existing proof context safely. Late responses from the prior claim remain rejected. Preserve full independent proof validation, section-scroll reset, keyboard focus and return focus.
- Verification banner uses a flex row with 12px gap, 16px horizontal/12–16px vertical padding and a 14–16px radius. Icon container is around 24–28px with `flex-shrink: 0`; text is a min-width:0 block. Remove negative margins/absolute placement causing the green tick to touch the side.
- Preserve “Source arithmetic verified” and its scope qualifier. Rounded green treatment does not mean general tactical truth. Check text/icon alignment and contrast in both themes, including loading and error states.

### Studio details and decision timeline

- Bring ALL inner Studio regions into the shared system: integration banners, workflow nodes, skipped/fallback notes, decision rows, tool disclosures and recorded-run blocks.
- The user's square Tactical Analyst note and lavender decision rectangles need actual 14–18px corners, 14–18px internal padding and consistent 8–12px vertical gaps.
- Decision rows use an approximately 64–80px time column, 12–16px column gap and a flexible text column. The timestamp must have LEFT padding and stay inside the panel. At narrow widths put time above text rather than squeezing or overflowing it.
- Icons sit in aligned fixed-size containers, with breathing room on both sides. Text wraps independently; no SVG shrinking to a sliver or overflowing the right edge.
- “Microsoft platform and tool evidence” uses a padded rounded disclosure with a proper chevron and open/closed treatment. Preserve all original provenance, request/token distinctions, branch independence, skipped-not-failed statuses and actual recorded values.
- Keep hierarchy restrained: roles/statuses readable, no huge empty node padding, no shadow on every table cell, no fake live processing. Preserve the original meaningful detail, with progressive disclosure rather than deleting limitations.

### Shared CSS and component rules

- Consolidate repeated radius, spacing, shadow and interactive-state values in the semantic theme authority. Keep layout in owning styles. Remove obsolete conflicting rules rather than append `!important` or another mode-specific override chain.
- Avoid global `button:hover`/`button:active` rules that unintentionally recolour a destructive/verified/disabled control or transform every disclosure in the app. Use the typed shared variants and consistent focus/disabled states.
- Menus/tables/code can have deliberate contained overflow; do not put `overflow:hidden` on entire panels to conceal displaced icons, crop focus rings or break sticky positioning.
- Test light and dark, hover/active/focus/disabled, long team names, long source IDs and wrapped explanation copy. Header consistency includes Synthetic replay, Guide and theme utilities, not just the active tab.

### Stage B exit gate

Check the affected theme/experience, playback, proof navigation and P5 cases against a current local app. Include paused/playing audience and Follow transitions with delayed/out-of-order responses, Matchday↔Investigate continuity, one proof-dialog host, header stickiness, shared Synthetic replay disclosure and focus return. Inspect fresh top/scrolled Investigate, Ask/recap, Studio detail and proof-banner captures in both themes at laptop/mobile sizes. No removed validation, duplicate replay controller, unnecessary full-field reload, inconsistent header, clipped icons or missing requested padding/corners may remain. Record the checkpoint before Stage C.

## Stage C — synchronized timeline and editorial relevance

### Timeline implementation

Confirmed current defects in `MatchTimeline.tsx` / matchday.css:

- Incidents occupy equal/flex-width slots rather than positions determined by timestamps.
- Large centring padding plus automatic scroll place the latest event near the middle.
- `.is-latest` uses the same pink ring language as a current playhead.
- Two different 00:00 incidents consequently appear at different horizontal times while the clock can be 01:47.

Implement a shared pure time-axis helper used by the key-moments rail and replay transport. Default domain is 0 through the real published match duration. Derive `x = (time - start) / (end - start)` with finite/range checks and clamp only rendering edges. The moving playhead is the CURRENT published replay clock; it must never follow latest/selected incident identity. At 01:47 in a roughly 93-minute replay it belongs near the beginning, not centred on an old 00:00 story.

Separate three states visibly and in code:

1. Moving playback position: thin pink/red indicator, current time label and matching transport position.
2. Newly available incident: a brief one-time ring at its actual incident-time anchor when continuous playback crosses its source/available/presentation eligibility boundary. If presentation was delayed, the incident anchor stays at source time and its timing details explain the delay.
3. Selected historical incident: a distinct static ring/selection label. It preserves intentional exploration and does not move the playhead unless the user explicitly requests a seek.

Keep all three clock gates. Future incidents remain absent even though the empty future time graduations can exist. Seeking updates the playhead immediately without replaying animations/audio for history. No new replay timer or wall-clock drift model.

Same-time events share one honest time coordinate. Group coincident/near-coincident markers into an accessible cluster with a count and a list of the ORIGINAL individual story IDs; do not spread their anchors into fake times or delete them. Offset labels or use callouts/contained scrolling for dense moments while keeping the anchors correct. If a focused/zoomed time window is necessary, label its bounds explicitly and apply the same scale to its playhead and events. Do not add a complex zoom product just to avoid solving label collisions.

Preserve source score boundaries, P4 buffered playback, P5 pointer/keyboard/reduced-motion reveal and explicit history selection. Timeline motion must not steal focus or overwrite an open proof.

### Editorial implementation

Implement the editorial requirements below against the current application. The historical P6.1 document is supporting design context; this specification owns the active scope and resolves its older timeline assumptions.

Add one pure frontend editorial selector, `web/src/broadcast/editorial.ts`, called after the causal visible snapshot is established. It owns available history, latest recorded metadata, explicit selection validity and loading/selected/featured/withheld/quiet presentation. Consumers do not independently rank stories or let an unrelated stale diagnostic overwrite a goal.

Core policy:

- Explicit, still-available historical selection wins and keeps its original claim/cutoff. Preserve Matchday no-surprise-seek behavior and P5 reveal/focus.
- Use the proposed 30 REPLAY-second automatic prominence window from presentation time: inclusive at 30, expired above 30. This is a provisional display policy, not detector tuning, scientific freshness or validated user usefulness.
- Eligible automatic features, in descending stable order: `goal_context`, `dismissal`, `turnover_to_shot`, `observed_line_height_change`, then `recent_attacking_activity`. A routine shot cannot replace a recent important goal. Do not let arbitrary incoming priority promote an unknown/routine type.
- Routine shots/outcomes and boundaries remain accessible in the timeline. The match-start headline must not remain featured indefinitely at 01:47. Quiet state can show “No new featured moment. Explore the recorded moments.”
- Later boundaries reset older automatic features as designed; explicit available selections remain intentional history.
- Withheld diagnostics never override an eligible verified feature or intentional selection. Label the diagnostic age AT ITS RECORDED REVIEW TIME. Null/unknown age remains unknown; do not relabel a frozen age as current or invent tracking outages.
- Backward seek before a selected story's eligibility, match/scenario change, or completed scope that excludes it permanently clears selection. Seeking forward must not resurrect it. Same-scope loading preserves valid pending intent without flashing old proof.
- Fan/Analyst retain the same factual identity and measurement; favourite club changes presentation within the existing contract, never suppressing opposition goals.

Reconcile the old design with current implementation: do NOT restore the old card carousel/eight-row layout merely because the earlier design mentioned it. Keep the new time-based rail and all source history accessible. Preserve exploration-state and audio scoping; an automatically expired feature cannot leave stale current-proof/auto-speech actions enabled. Intentional historical preview/proof remains available.

Do not retune the frozen 7m detector, change server scheduling, remove research alerts or create new football analytics. Preserve the exact 59-frame line receipt and South shot `evt_003876` at 3279.5 seconds. Claim and source time are independent of display club names.

### Stage C exit gate

Verify shared time coordinates at zero, 01:47, eligible incident arrival, seek and end; coincident-event grouping; manual history selection and future-marker rejection. Verify the 29.75/30/30.25 replay-second prominence boundaries, goal priority, quiet/withheld behavior, recorded diagnostic timing and non-resurrecting selection. Retain exact source receipt checks and fresh laptop/mobile screenshots for featured, quiet, withheld and selected history. Run appropriate editorial/timeline plus existing navigation/playback preservation cases. Record the checkpoint before Stage D.

## Stage D — Premier League clubs and match-header preferences

### Club identities and colours

Use real Premier League clubs. Default NORTH presentation to **Manchester City**, SOUTH presentation to **Manchester United**. Add home/away club selection from the verified current membership list. Do not keep the earlier fictional-club plan.

Read `research/design/turn-of-play/premier-league-colour-sources.json`. It contains all 20 clubs from the current official 2026/27 PL article, exact badge asset URLs/hashes, extracted colour tokens and method notes. It is research input, not already installed app code. Verify its entries while creating the app registry; do not copy incomplete metadata blindly.

Primary sources:

- Club membership: https://www.premierleague.com/en/news/4365156
- Current kit reference/gallery: https://www.premierleague.com/en/news/4672981
- City's home-kit colour description: https://www.mancity.com/news/club/new-puma-home-kit-gallery-63914855
- United's home-kit description: https://m.store.manutd.com/en-gb/c/kit/home/mens

The registry's values are official-asset-derived UI colour candidates, not a declaration that every hex is an official brand-manual specification or exact current-season jersey colour. In particular, badge gold/red does not become City's primary kit colour. Respect each record's direct-token / embedded-pixel / implicit-fill / neutral-contrast provenance. Use club kit references to confirm colour roles, especially white/black and striped kits. Do not silently replace the current club list with a remembered older season.

Create a small typed registry and side-mapping owner, e.g. `web/src/clubs/clubRegistry.ts` and a focused hook/context only if needed. Store stable club IDs, proper names, short labels, primary/secondary colours, marker/text contrast and provenance. Keep official source URLs in reviewable metadata. Do not fetch assets remotely on every replay tick.

Apply the selected mapping consistently to:

- Header/scoreboard names and colour dots, pitch player discs and outlines, team legends.
- Following choices and selected preference pill.
- Investigation subject labels and controlled presentation copy.
- Timeline team labels, recap and restricted Ask subject labels.
- Proof headings, source-frame legends and comparison keys.
- Commentary team names and caption text.

Keep the overall Turn of Play purple visual system. Club colours belong to team identity and data marks; they must not recolour the entire navigation or turn success/error meanings into club colours. For red-vs-red, blue-vs-blue or low-contrast club pairings use secondary colours, outlines/patterns and clear abbreviations to distinguish sides. Do not claim an invented away kit is official.

Data honesty: this remains a synthetic replay using real club identities/colours. Label that clearly in the source disclosure; do not imply actual City/United performance, real fixture outcomes or real player tracking. This feature changes presentation identity, not the recorded game. Selecting clubs does not generate a fresh match.

Preserve canonical `NORTH`/`SOUTH`, opaque match UUIDs, player IDs, claim IDs, proof keys, source observations, hashes and experiment fingerprints. Do not replace strings in persisted compiled artifacts or mutate inference input to make club labels match. Use a controlled display adapter with the explicit side mapping; raw evidence continues to show original identity with a clear club-label mapping. No fabricated real-player names/statistics.

Changing club presentation preserves clock, score, selected incident, evidence and playback. A Follow change retains the existing audience/favourite contract; it does not filter out opponent goals or change measured values. Do not confuse choosing the two clubs with following one of them.

### Header view/follow controls

The user wants Fan view / Analyst view and Following IN the lavender score/header area above the pitch, not beneath the replay or inside an unrelated global navigation row.

- Desktop: compact score/team group, clock/half, view switch and Following pill share a tidy row where width permits. Use short club names with full accessible labels. Keep the match readable and move redundant “Recorded replay” metadata into the existing source utility if needed.
- Narrow desktop/tablet: a deliberate second row INSIDE the same lavender header is acceptable; do not clip names or shrink meaningful text to fit.
- Mobile: compact score row then a short view/following row inside the same header. Essential playback controls remain immediately below the pitch.
- Fan/Analyst: a raised segmented control with shallow violet lower edge, installed fan/chart icons if useful, clear pressed state and stable hit targets. Hover looks quieter than selected. Preserve focus and `aria-pressed`; no score or XP for choosing a mode.
- Following: a tactile pill showing Both teams or the actual chosen club's name/colour mark. Its menu contains Both teams and the two current clubs, with an accessible selected check. Use consistent white shell/lavender selection, clear keyboard behavior, Escape and focus return.
- Keep one owner for each control state; remove duplicated below-pitch controls rather than mounting two independent versions. The same preference is reflected in Investigate.

### Stage D exit gate

Verify all 20 club registry entries against provenance, default City/United presentation, same-colour readability, cross-surface names/colours and unchanged canonical IDs/receipts. Test the shared view/follow controls, keyboard menus, both themes and narrow/wide layouts while preserving clock/play/speed and still-eligible intent. Inspect Matchday and Investigate headers together. No false real-match or player-performance claim. Record the checkpoint before Stage E.

## Stage E — grounded natural commentary

Confirmed current limitations in `useCommentary.ts`: it joins raw analytical headline + first sentence, picks the first local English voice, fixes rate at 1, and slices at 360 characters. This is why “Observed match start” and technical descriptions can sound robotic or repetitive.

Add a frontend-owned deterministic spoken-copy adapter, e.g. `commentaryCopy.ts`. It receives only a current eligible registered story, approved values/references, side-to-club presentation mapping and historical/live context. Keep its returned spoken line/transcript tied to the exact incident. It does not become a new source of authoritative measurements or semantic claims.

Tone: a calm, interested football presenter speaking to one viewer. Short sentences, natural contractions where appropriate, clean pauses and one main fact per utterance. Avoid reading schema labels, raw UUIDs, all-uppercase teams, duplicated headline/body, decimal-heavy paragraphs or every uncertainty statement at every routine event. Important qualifications stay present in the relevant explanation/captions and in the actual spoken factual claim where required.

Examples of permitted direction, only when supported by that exact story:

- Shot: “A shot from Manchester United.” No saved/off-target/brilliant-chance claim unless the approved event actually supplies it.
- Goal: “Manchester City have scored. It's one–nil.” Require the actual scoring side and registered post-goal score; don't infer the scorer's name or say “take the lead” without before/after support.
- Positional preview: “City's three deepest outfielders were about ten metres higher in the recent samples.” Retain sampled comparison, direction and scope; no coaching-intent or pressing-success claim. Display the exact registered metric in the evidence UI.
- Match start: “We're under way.” Only for a verified start boundary at the right moment; never read it again at 01:47 because it remains the latest record.

These are template examples, not literal strings to force onto every incident. Inspect actual available fields; unsupported cases use an honest concise approved phrase or remain silent. Use controlled spoken number/time formatting; normal text-to-speech is not SSML, so do not pass raw SSML tags.

Offer selection among actually available suitable LOCAL English voices, with a short user-triggered preview and modest speaking-rate control. Use conservative prosody tuned per event without random pitch/rate wobble. Voice availability is platform-dependent: do not promise neural/human-level delivery, silently use a remote voice, or provision a paid provider. Keep text/captions available when no suitable local voice exists. Higher-quality cloud speech can be a later separately scoped feature.

Keep optional commentary OFF by default. Maintain voice/caption state consistently across themes. Speak newly reached eligible key incidents only during actual playback, never the whole backlog on load/seek or a stale selected boundary. Deduplicate goal/shot-outcome variants belonging to one actual incident where identity supports it; don't suppress distinct events by a loose same-minute heuristic.

Use complete short utterances instead of cutting mid-sentence at 360 characters. Bound/replace queued stale narration at fast speeds, without slowing the replay. Cancel safely on pause, seek, restart, fixture/club mapping change, disabled commentary, relevant view exit and unmount. Old completion/voiceschanged callbacks cannot resurrect cancelled work. Explicit historical Preview remains available with clear context; automatic commentary never promotes old proof to current.

Retain caption semantics and actual speech/error status. Automated tests mock speech APIs and must not make service calls or actually speak. Measure and document text/queue/state behavior; listening review is separate from mocked test success.

### Stage E exit gate

Run mocked speech/caption lifecycle tests covering off-by-default, supported complete copy, selected voice, duplicate prevention, no backlog, queue bounds, cancellation races, speed/pause/seek and unavailable voices. Verify hearing-related controls by actual local listening where a voice is available; record what was heard and platform limits separately from mocks. No paid/remote fallback or unsupported spoken claim. Record evidence before Stage F.

## Stage F — integrated verification and handoff

Expected scope: frontend App/contracts presentation types as needed; focused shared shell/UI/view components and viewer-session orchestration; broadcast editorial/time-axis/club/spoken-copy helpers; BroadcastTheatre, MatchdayInvestigation, MatchTimeline, ReplayControls, useCommentary/useExploration integration; necessary safe integration edits to useBufferedReplay while preserving its validators and causal semantics; Pitch/Proof display labels and legends; existing Studio/guide presentation; owning CSS; focused tests and current status/acceptance records. Keep backend, simulator and source datasets unchanged. Avoid a broad state/library migration.

Verify meaningful journeys, not implementation-mirroring snapshots:

1. Playhead/timeline/transport agree at 0, 01:47, incident boundaries, after seek and at end. Coincident events share a time coordinate; all remain accessible. No future incident or stale arrival pulse.
2. City/United colours/names agree across pitch, header, Following, explanation, proof and speech. All 20 registry entries have provenance. Swap/select clubs and view mode without losing time/selection/verified values. Check same-colour club contrast and both themes.
3. Commentary uses only supported facts, natural complete phrases and the selected available local voice. Test duplicate suppression, queue limits, cancellation races, unsupported voices and no historical backlog. Preserve a short local listening-review note; don't claim human voice quality from mocks.
4. Editorial boundaries at 29.75/30/30.25 replay seconds, pause/speed invariance, goal over routine shot, quiet startup, selected historical shot/line claim, withholding versus unrelated goal and null diagnostic timing.
5. Backward/forward seek cannot resurrect selection; delayed old view/proof/audio callbacks cannot flash another match's content. Exact source arithmetic/receipts remain unchanged.
6. Laptop/mobile header controls, timeline touch/keyboard selection, P4 buffering/refill and P5 focus/reveal/section reset remain intact.
7. Exactly one visible proof dialog through repeated stage/claim/history entry actions; correct current claim identity, no stacked overlays, no duplicate network waterfall, correct focus return and old-response rejection.
8. Fan/Analyst/Following transitions during paused and playing states retain correct source identity/clock/speed and eligible intent without unnecessary full-field buffering. Delayed old preferences cannot win; no audience-sensitive data is relabelled to bypass validation.
9. The same sticky header remains visible after scroll in Matchday and Investigate, with stable geometry at the same viewport and correct dropdown/overlay stacking. Synthetic replay has one aligned icon/text/chevron treatment with no native duplicate marker.
10. Screenshot/geometry review confirms padding and rounded corners for Ask, recap, current explanation, verification banners, Studio notes/decision rows/disclosures, plus icon containment and visible keyboard focus. An overall purple screenshot is not sufficient evidence.

Capture loaded laptop/mobile light/dark views demonstrating the PL club header, view/follow controls, time-aligned pink playhead, an arriving shot, selected historical evidence and quiet/featured/withheld states. Also capture Investigate at top and after scrolling to Ask/recap; Studio decision rows/disclosures; a padded Proof verification banner; the same Synthetic replay menu in both views; and evidence-action/dialog uniqueness. Include delayed preference-switch interaction evidence and a brief before/after request summary. Retain the current tactile theme; no new broad redesign.

Write `research/product-excellence/priority6-implementation-acceptance.md` for editorial results and a compact `research/design/turn-of-play/product-sprint-1-acceptance.md` covering regression, timeline, clubs, header and commentary. Update only current execution/status sections in AGENTS.md and CURRENT_STATUS.md; preserve historical records, frozen conclusions and the original failed-run record.

### Stage F exit gate and final handoff

Run the complete integrated frontend suite with retained unique raw logs, JSON, traces and exit status, then typecheck, production build and whitespace checks. All intended tests must execute; classify expected skips explicitly. Inspect final affected-surface screenshots and retained temporal/network/audio evidence. Update the two acceptance records and current execution/status sections without rewriting historical results. The ledger must show A–F passed with evidence, or identify the exact blocked stage honestly. Preserve failures/skips and distinguish isolated reruns from the complete result; no public-host tests or paid calls.

Return one concise outcome, changed-file ownership, exact test commands/totals, screenshot/evidence links and remaining limits. No new human-study/accuracy/cloud claim. Stop for review after this sprint; no automatic P7, provider migration, commit, push or deployment.
