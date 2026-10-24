# MatchPulse review checkpoint — October 24, 2026

Work stopped at the user's explicit request to review and redirect. This document records completed work and remaining gates; it is not submission confirmation. Source changes and reviewable evidence are pushed. Credentials, account logs, dependency caches, bulk experiment outputs and private mailbox captures are excluded. Public release assets carry the reviewed image and canonical fixtures separately.

## Where to examine

- Public app: https://matchpulse-studio.politesea-3d29a667.eastus.azurecontainerapps.io
- Repository: https://github.com/ansh0eman/matchpulse — public under the later conditional release authorization, after finite audits and private acceptance.
- Image/fixture assets: https://github.com/ansh0eman/matchpulse/releases/tag/viewer-fixtures-v2
- Current premium laptop/mobile captures and design decisions: research/design/.
- Sanitized local release acceptance: research/step3e/artifacts/premium-release-acceptance.json.
- Actual public deployment and partial acceptance: research/step3e/artifacts/public-deployment-checkpoint.json.
- Local narrated demo: backend/output/release/video/matchpulse-demo.mp4 (ignored generated media, not committed or uploaded).

## Implemented product

1. Python viewer API exposes allowlisted, source-verified match views, playback buffers, independently recomputed Proof Lens receipts, restricted questions, recaps and genuine saved agent activity. It makes no model calls while browsing and exposes no public MCP/model service.
2. React/TypeScript Matchday, Analysis Room, Agent Room, guided story and program-output surfaces. Fan/Analyst and favorite-team framing preserve the source facts. Laptop and emulated mobile layouts are implemented; no separate native app was built.
3. Buffered replay keeps the pitch mounted, advances quarter-second causal prefixes, refills bounded windows, holds the last verified state during underruns, and rejects invalid or stale responses after seeking/context changes. No invented movement between unobserved frames is interpolated.
4. Native goal showcase adds a sixth isolated fixture: two source-recorded goals at 26:54 and 36:11.5, with 22,401 original quarter-second position frames. The current opening is 26:51, three source seconds before the first goal. It was selected transparently as a goal-bearing demo; it is not a new accuracy experiment or the saved Foundry fixture.
5. Proof Lens recomputes the positional example from 59 original samples: 21.95m before, 31.96m after, +10.01m. It exposes representative before/after positions, original contributor IDs/coordinates, method, sample support, raw source observations, source hashes, receipt export and explicit limitations. Snapshot proxies are labelled separately from the context-weighted aggregate. Stale evidence is withheld, including the 132-second example.
6. Premium Matchday pass: light canvas/ink typography, dominant observed pitch, compact score strip, timestamped explanation, one Proof Lens action, a linked moment rail, compact replay controls and quieter fixture navigation. Mobile uses the pitch's intrinsic proportions and removes the previous fixed-height gap. Focus states and reduced-motion handling are present. A mobile Program Output cascade bug found by testing was fixed.

## Genuine Microsoft integration and boundaries

- Existing authenticated Microsoft Foundry integration is preserved. Microsoft Agent Framework runs an actual executor graph: Director routing, conditional specialists, Challenger, independent Narrator/Replay branches and source-verified publication.
- One separately authorized successful capture records five role-level request attempts and five successful evidence-tool calls. Match Analyst was selected; Tactical Analyst was skipped for that event-only goal. Challenger narrowed the interpretation. Both presentation branches enriched successfully. Historical narration fallback remains separately inspectable.
- The saved successful capture took about 23.83 seconds, with 11,662 input / 807 output tokens reported. Actual HTTP request count is unknown because the original transport meter missed SDK traffic; it is not relabelled as five network calls.
- These are application-owned definitions with Foundry model inference, not registered Foundry Agent Service agents. Private MCP tests exist, but this capture used direct function tools. Cloud trace delivery is not proven. No new Foundry inference was performed for the UI, release, video or hosting checks.

## Packaging, security and deployment

- Saved-image verifier checks config/rootfs identity, architecture, source label, safe archive paths, layer bounds and digests. Fourteen meaningful verifier tests were added. Save/load round-trip identity passed for the current AMD64 image.
- GitHub workflow publishes the already tested saved image without rebuilding or creating a PAT. It succeeded; anonymous GHCR manifest access was independently verified. Published config matches the locally accepted config.
- Canonical bundle v2: ten files, 31,984,795 bytes plus manifest; all hashes verified and the original eight rows preserved. Compressed image and bundle checksums accompany the public assets.
- Finite scans: 25-commit history (~1.73 GB) and packaged application source/data had zero Gitleaks findings. Fresh npm audit had zero advisories. Earlier viewer Python lock audit was clean; that dependency lock was not changed by the UI work. Six served font/runtime notices byte-matched local license files. Public author metadata in existing Git history was not rewritten.
- Viewer runs non-root with no host mounts, Azure credential environment keys, identity or registry credentials. Public HTTPS response headers were checked, including CSP, frame denial, nosniff and no-referrer. This is not a security certification or load/abuse-resilience claim.
- Azure trial access was restored through user-completed normal sign-in/MFA. Immediately before deployment: Enabled, FreeTrial_2014-09-01, spendingLimit On. Billing showed USD 200 remaining, valid through November 22. No PAYG conversion, payment method, purchased credits or additional model resource was introduced.
- ACA Consumption deployment succeeded: one environment and app, accepted immutable GHCR image, 0.5 CPU / 1 GiB, min 0 / max 1 replica, HTTPS only. No ACR, identity, database or logging workspace. Existing Foundry resources were preserved. The first preflight failed on logging destination `none`; omitting that optional property fixed it.

## Verification actually completed

- Latest full backend run before this frontend pass: 212 passed; two opt-in live tests skipped. No backend source changed during the premium UI pass.
- Earlier simulator suite: 10 passed; native source reproducibility and source-boundary evidence retained in research/product-excellence/native-goal-showcase.md.
- TypeScript, production image build, whitespace checks and recording-tool syntax/execution passed.
- Premium packaged ARM64 browser suite: 33/33 passed in 272.04 seconds at 0.5 CPU / 1 GiB.
- Current saved/load-roundtrip AMD64 browser suite: 33/33 passed in 383.97 seconds at the same resource limits.
- Public HTTPS HTTP smoke passed: original +10.01258807588076m / 59-sample proof, native 0–0 to 1–0 goal boundary, source hashes, separate historical Foundry/fallback evidence and stale-evidence handling.
- Public browser suite was explicitly stopped: 25 passed, one failed, seven uncompleted. The invalid-prefetch test did not see its expected error alert within 5000ms. Remote-response delay is suspected but not established. No assertion was removed or timeout relaxed to conceal it. Full public browser acceptance is NOT complete.
- Actual Chromium screenshots and video frames were inspected. Physical phones, Safari, a full screen-reader audit, independent usability testing, scale-zero cold-start benchmarking and production load testing are not claimed.

## Demo and submission preparation

- Six real browser scenes recorded and assembled with licensed local Kokoro-82M stock af_heart narration; no voice cloning or hosted narration calls.
- Current MP4: 112 seconds, 1366×768, H.264/AAC, embedded English captions; SRT sidecar retained. Original player-row inspection was recaptured after visual review showed it below the fold. Captions use proportional timing, not forced alignment.
- Actual assembled frames were reviewed; independent listening review remains outstanding because this session cannot hear audio. Video is not uploaded. Official rules require the video URL on YouTube, Vimeo, Facebook Video or Youku; a GitHub MP4 asset alone does not satisfy that requirement.
- Four requested skills are installed globally for this local Codex user: frontend-design, webapp-testing, vercel-react-best-practices and web-design-guidelines. This does not imply installation on remote hosts or every available plugin.
- Competitor/source research, rubric mapping, Foundry compliance, zero-out-of-pocket hosting decision, data/agent cards and demo scripts are retained. Public code benchmarks informed UX/features; competitor implementation was not copied.
- Innovation Studio still rejects the registered personal account as missing from tenant Microsoft. Original invitation loops. The user reproduced the failure. A specifically authorized support follow-up was sent in the existing thread from the registered mailbox; Gmail confirmed Message sent. Private mailbox evidence remains only in coordination, not the repository.
- Portal fields/title/category/links have not been updated or verified, and the entry has NOT been submitted. Existing project 126924 was previously registered as Touchline AI; product/code use MatchPulse AI.

## Remaining work for the next direction

1. Diagnose the public invalid-prefetch failure and finish the seven remaining public browser cases; fix an actual product fault if found.
2. Confirm practical cold-start/judging access and retain the protected trial through November 10; no uptime guarantee is claimed.
3. Review narration/audio, finish any requested video changes, upload to an officially allowed video platform and verify anonymous playback/captions.
4. Restore Innovation Studio access without switching the registered identity or creating duplicate registration/project; then reconcile title, description, category, code/demo/video links and testing instructions.
5. Complete final submission only after all gates and any unavoidable contract/account confirmations; record platform confirmation. Deadline remains October 27, 2026, 11:59 PM Pacific (October 28, 12:29 PM IST).

Frozen Step 2.5 experiments, source fingerprints, analytical conclusions and the successful Step 3B integration were preserved. No competitive win, real-match calibration, coaching intent or broad detector accuracy is claimed.
