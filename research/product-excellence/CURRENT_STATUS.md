# MatchPulse — authoritative current status

Reconciled **October 25, 2026 (Asia/Kolkata)**. Product-Focused Development Plan v2 authorizes **Priority 1 only**. State reconciliation is complete pending user review. No implementation, application tests, cloud/billing queries, deployment, video work, messages or publication occurred in this milestone.

**Product promise:** See what changed. Understand what supports it. Know what remains uncertain. Numerical validity, evidence strength and human usefulness are separate questions.

## Revision and evidence scope

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
