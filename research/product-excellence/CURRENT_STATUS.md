# MatchPulse — authoritative current status

Updated **October 26, 2026 (Asia/Kolkata)** for the user-authorized sequential release plan; P7/P8 locally accepted; P9 offline comparison and P10/P11 reconciliation recorded; P12 active. Local P4/P5 checkpoints remain accepted.

## Current checkpoint

- **Release-plan authority:** the user requested completion of the remaining steps and a detailed plan to follow. [Execution plan](release-execution-plan-2026-10-26.md) owns the sequence; one application milestone at a time. Repair handoff verified against raw JSON and72 fingerprints.
- **P7–P11 local work; P12 active:** serialized background analysis keeps health/catalog responsive; independently verified recorded activity no longer evicts the selected tracking match. [P7 evidence](priority7-performance-acceptance.md):215 backend passes/two live skips,30 browser passes,31/31 measured response hashes equal. P8 original-source player inspection passed14 browser cases/typecheck ([acceptance](priority8-investigate-acceptance.md)). P9 same-source comparison independently reverified the saved artifact: evidence hook differs while metrics/geometry/limitations agree, human quality unmeasured ([review](priority9-foundry-value-review.md)). README/notices and bounded ownership cleanup recorded ([P10/P11](priority10-11-documentation-and-ownership.md)). P12 candidate verification is active. No deployment/publication performed.

- **Post-review repair R1–R4 — complete locally, awaiting review:** request ownership, explicit startup readiness, pitch-first desktop layout and visible timeline context repaired. Final unfiltered result: **142 passed / 1 intentional skip / 0 failed / 0 flaky**, all 143 collected cases; typecheck/build/whitespace pass. [Repair acceptance](../design/turn-of-play/product-sprint-1-review-repair-acceptance.md), [repair ledger](../design/turn-of-play/product-sprint-1-review-repair-progress.md). Prior 116/1 suite and fresh reviewer 5/2 +1/1 failures remain separate historical records. The later user instruction authorizes the sequential release plan above.

- **Priority 4 — playback reliability:** independently accepted for local technical closure. Commit `f0c95c40352679abffd8fecf715ab388baa8da33`; acceptance: [priority4-acceptance.md](priority4-acceptance.md); detailed verification: [priority4-playback-verification.md](priority4-playback-verification.md).
- **Priority 5 — UX candidate:** accepted for local technical/heuristic closure at `6fa99c854e17e64c2b0a3934e630de817b64872f`; [acceptance record](priority5-acceptance.md). Local `main` remains four commits ahead of recorded `origin/main`; no network refresh was performed in P6.1. P4/P5 have not been pushed or deployed by this workstream.
- **Checks recorded from prior acceptance work:** P4 report records TypeScript/build success, backend **37 passed**, local browser **59 passed**, and focused follow-up **12 passed**. P5 review recorded TypeScript success and **17 passed / 1 expected skip** across 1366×768 and 390×844 Chromium projects, plus inspected screenshots. These suites were **not rerun during checkpoint closure or P6.1**. Checkpoint closure checked Git scope and whitespace; P6.1 verification is recorded below.
- The human comprehension study remains **uncollected**. These acceptances are technical and heuristic, not participant research, public deployment acceptance or proof of product usefulness.
- **P6 / Product Sprint 1 — complete locally, awaiting review:** the new sprint authorization superseded P6.1-only scope. Shared shell/source session, editorial/time axis, PL display clubs/header preferences and grounded local commentary are implemented. [Sprint acceptance](../design/turn-of-play/product-sprint-1-acceptance.md) and [P6 acceptance](priority6-implementation-acceptance.md) contain current evidence. Original sprint unfiltered result (historical): **116 passed / 1 intentional skip / 0 failed / 0 flaky**, all 117 cases accounted for; superseded for current repaired-source acceptance by the new repair result above. No next milestone is authorized.
- **Turn of Play — current local UI:** Outfit/DM Sans and light/dark theme retained; proportion-preserving green-fill pitch, clustered source-time rail, independent playhead and one proof dialog. The older1 passed/2 failed/90 skipped run remains a historical failed record; this sprint retained failures and executed a fresh repaired baseline and final complete integration. Current source remains uncommitted over `6fa99c8`; no push/deployment. Existing hosted app is unchanged and was not checked in this sprint.
- **Submission access update (user-reported):** Innovation Studio works in a private browser window. Project-editor access and actual submission remain unverified; another conversation owns portal navigation. The historical regular-session tenant error does not establish revoked access. No portal action or support message is authorized here.

## Preserved roadmap — each item requires separate authorization

| Milestone | Scope / status |
|---|---|
| P6 | Editorial eligibility and Product Sprint 1 implemented/locally verified; stop for user review |
| P7 | Local responsiveness/source-retention correction accepted; measurements and limits recorded |
| P8 | Original-source player inspector locally accepted:14 browser passes/typecheck |
| P9 | Same-source offline comparison complete; human preference/quality advantage unmeasured |
| P10 | Current README/links/notices reconciled; original README preserved |
| P11 | Targeted ownership cleanup; no further broad rewrite justified |
| P12 | Final candidate source/image regression active |
| P13 | Expanded football analytics and bounded synthetic exploration; queued |

Human comprehension remains uncollected. Public release acceptance, video review/publication and submission remain open, each with separate authorization requirements. Existing hosting and unknown current spend are unchanged observations, not refreshed checks. Preserve the 46 untracked Priority 2 files/private material and four Priority 5 participant documents; neither directory is approved for inclusion. **Follow the user-authorized sequential release plan; preserve release/security/cost and portal-owner gates.**

**Product promise:** See what changed. Understand what supports it. Know what remains uncertain. Numerical validity, evidence strength and human usefulness are separate questions.

The following sections preserve the dated Priority 1 status snapshot as historical context. Their branch revision, authorization and pending-state statements describe October 25 before P4/P5 closure and are superseded by the current checkpoint above.

## Historical Priority 1 snapshot — October 25, 2026

- Local branch `main`, clean before edits: **`a3275a71ec87131e99406ea52cf4372d0287d2ec`**. Read-only `git ls-remote origin refs/heads/main` returned the same latest public main SHA today. These three documentation edits are an uncommitted local layer over it.
- Deployed product source: **`50da7eadb384890415c4c888f47a7bcc23b22622`**; deployment-template correction: `cdb3d20`. Later documentation commits do not imply a rebuilt product image.
- Recorded image: `ghcr.io/ansh0eman/matchpulse-viewer@sha256:2f6718b03c0fe983fa6a10fae6bbc2f2ab739066fe33897ec208dd12d71db12c`.
- Accepted AMD64 config: `sha256:5d09c5ca3469014830048aaa3087702346f8422cdd51f5f88096ddd7d513339c`.
- Recorded app: https://matchpulse-studio.politesea-3d29a667.eastus.azurecontainerapps.io . Public observations below are from **October 24**, not fresh availability checks. Azure was not queried today.
- This document indexes current state. Preserve dated [CHECKPOINT.md](CHECKPOINT.md), research and acceptance reports unchanged. Earlier “pending” prose describes its own revision; it does not override later artifacts.

## Subsystem status

**Implemented** means code exists; **Locally verified** and **Publicly verified** identify recorded checks, not universal correctness or current uptime. Categories can coexist.

| Subsystem | Classification | Evidence and limits |
|---|---|---|
| Viewer API, Matchday/Analysis Room, personalization, restricted Ask/recaps | Implemented; Locally verified | Existing Python/React source and packaged acceptance. Ask is restricted, not free-form. |
| Replay/buffering, source-prefix score/positions | Implemented; Locally verified; Incomplete or unresolved | Continuity and seek isolation tested. Public malformed-prefetch timing failure unresolved; replay is not a live producer. |
| Six canonical fixtures/native goals | Implemented; Locally verified; Publicly verified | Ten local files rehashed today: all match manifest, 31,984,795 bytes. Recorded public smoke verifies native goal boundary/hashes, not every interaction. |
| Proof Lens/presentation gate | Implemented; Locally verified; Publicly verified | Recorded public recomputation: +10.01258807588076m / 59 samples. Contributors, method, observations, receipts and limitations exist. Arithmetic alone does not prove usefulness, a back-four measurement or tactical intent. |
| Foundry / Microsoft Agent Framework | Implemented; Locally verified; Incomplete or unresolved | Genuine saved enriched goal, evidence tools, Challenger narrowing and separate fallback. Public activity smoke checks saved evidence, not new live inference. Comparative value unmeasured. |
| Image/fixture publication and ACA | Implemented; Locally verified; Publicly verified; Incomplete or unresolved | Saved-image identity, anonymous pull and public HTTP smoke passed. Deployment succeeded: 0.5 CPU / 1 GiB, 0–1 replicas, HTTPS only, no identity/registry credentials. Full public acceptance and current spend unresolved. |
| Human usefulness and complete fan journey | Incomplete or unresolved | No independent usefulness evidence; historical/current temporal context needs review. |
| Video/portal submission | Incomplete or unresolved; Deferred | Local 112s video; listening review/upload pending. Recorded tenant error blocks portal; support follow-up sent. No confirmed submission. Further release work needs authorization. |
| Live producer/SSE, broader player exploration, new detector, managed agents/cloud tracing | Deferred | Not authorized. Existing app-owned Foundry orchestration is real; managed Agent Service registration/cloud trace delivery are not established. |

## Recorded acceptance and known failure

- Latest recorded full backend: **212 passed / 2 opt-in live skips**; earlier simulator: **10 passed**. [Checkpoint](CHECKPOINT.md).
- Packaged ARM64 browser: **33/33 passed**, 272.04s. [Evidence](../design/after/acceptance.json).
- Saved/load-roundtrip AMD64 browser: **33/33 passed**, 383.97s. [Image/acceptance](../step3e/artifacts/premium-release-acceptance.json).
- Public HTTP smoke passed; public browser run: **25 passed, 1 failed, 7 uncompleted**, stopped by user. [Public checkpoint](../step3e/artifacts/public-deployment-checkpoint.json).
- Failure: malformed-prefetch case in `web/tests/buffer.spec.ts` expected “Playback buffer unavailable” within **5000ms**. It fetches a real upstream response before corruption. Transport delay is a hypothesis; validation/UI/interception cause remains unknown. No timeout or implementation fix is authorized here.
- [Genuine capture](../step3d/artifacts/foundry-capture.json): enriched narration/overlay, five role-level attempts and five successful tool calls; **HTTP request count unknown**. Adjacent saved state/trace/broadcast supersede earlier statements that a full artifact had not yet been persisted. These are application-owned agents, not proof of managed registration.
- Frozen Step2.5 results/consumed holdout remain unchanged. Broad external-intervention detection failed its targets; independently verified positional facts do not establish coaching intent or human usefulness.

## Local startup and prerequisites

From repository root, use the existing isolated **Python 3.12** viewer/SDK environment and **Node 24**. The environment executable, `web/node_modules`, `web/dist` and verified `backend/output/viewer-bundle-v2` were found today. Missing dependencies require justified permission; no install or startup was performed here.

Fixture prerequisite: ten manifest-matching event/tracking files for six UUID-scoped scenarios. Allowlist: `backend/src/matchpulse/viewer/catalog.py`. A fresh checkout lacks ignored bulk fixtures; reviewed assets exist in the `viewer-fixtures-v2` GitHub release. Do not substitute arbitrary sources or regenerate consumed experiments. Preserve frozen `backend/uv.lock`.

```sh
# Terminal 1: API at 127.0.0.1:8010, using existing local bundle
MATCHPULSE_VIEWER_BUNDLE="$PWD/backend/output/viewer-bundle-v2" \
  backend/.venv-foundry/bin/python -m matchpulse.viewer.api
# Terminal 2: frontend at http://127.0.0.1:5173; proxies /api locally
npm run dev --prefix web
```

Reference test entrypoints for a separately authorized milestone; **not run in Priority 1**:

```sh
MATCHPULSE_LIVE_TEST=0 MATCHPULSE_LIVE_WORKFLOW_TEST=0 \
  backend/.venv-foundry/bin/python -m pytest backend/tests -q
npm run typecheck --prefix web
MATCHPULSE_TEST_URL=http://127.0.0.1:5173 npm test --prefix web
npm run typecheck --prefix poc
npm test --prefix poc
```

Simulator tests require their documented artifacts. Public browser tests and live-model runs need separate authorization. Use Distill for verbose output under AGENTS.md; documentation-only checks suffice for Priority 1.

## Cost and action control

**Current Azure spend is unknown.** October 24 records show Free Trial / spending limit On / USD 200 credit / November 22 expiry. These are historical, not a current spend measurement, balance or renewed billing assurance. Replica limits are not a monetary cap. Existing hosting is untouched and may continue consuming resources/credits. A separately authorized **read-only billing review** is needed to establish current spend.

Plan v2 supersedes earlier autonomous execution/release permissions. No Azure writes, paid inference, deployment, public release changes/pushes, video work, emails or submission without separately scoped authorization. No new dependencies/skills/MCP servers without justification and permission. Historical gap ranks are not an active queue.

## Next proposal and stop

**Priority 2: study usefulness of observed line-change explanations — not authorized.** If approved, define measurement and reproducible development-only selection rules first; prepare up to twelve blinded episode cards and distinguish numerical validity, evidence strength and actual usefulness. Report missing categories and uncertainty; do not tune the frozen detector or reuse its consumed holdout.

Priority 1 ends when these three allowed files are reconciled and local documentation checks pass, followed by a concise report. **STOP FOR USER REVIEW. Await explicit approval before any next task.**
