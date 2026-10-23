# Step 3C implementation and acceptance

October 24, 2026. Base: main at f192981. New implementation remains uncommitted for review. No deployment/publication/billing changes or new model calls.

## Delivered

Python viewer API under backend/src/matchpulse/viewer; React/TypeScript studio under web/. The viewer uses the existing source loader, claim registry, audience policy, publication validator and narration/overlay compilers. It does not replace or retune the analytical engine. Five deliberately separate fixtures demonstrate open play, an opening goal, an equalizer, a verified positional shift and a stale positional claim that must be withheld.

Replay score, positions and available stories are scoped to the replay clock. Feed/recap selection seeks to that story's presentation clock. Changing fixture, clock or preferences immediately clears the previous scope while loading; stale async answers are aborted/ignored. This prevents previously visible future stories from lingering during a backward seek.

Proof Lens independently resolves a visible claim against its original source. Goal proof exposes before/after score snapshots; sequence proof exposes source event rows/timing. Position proof recomputes the three deepest outfield players for each sample, context-conditioned means and recent-context weighting. The demonstrated line moves from 21.951300813008128m to 31.96388888888889m: +10.01258807588076m, with 41 reference and 18 recent samples. All 59 samples expose original player IDs, raw x/y coordinates, attack-relative coordinates, context and timestamps. Two representative pitch snapshots highlight the actual contributors. These are supporting samples, not interpolated tactical paths. Numbers on the replay identify source players, not authenticated shirt numbers.

The studio renders compiler-verified incident metrics as clickable broadcast overlays. Fan/Analyst and favorite team change framing/detail, not source values. Restricted Ask declines unsupported coaching intent. Recaps use only available approved moments. Guided demo and Agent room work on laptop/mobile. Modals support Escape, keyboard focus trapping and scroll containment.

## Honest Foundry boundary

Agent room exposes genuine recorded live validation, five specialist roles, actual evidence-tool calls, timestamps, usage and branch statuses. A historical partial goal artifact is revalidated against the current source before display for its exact Fan/no-favorite preferences; the narrator fallback and enriched overlay remain explicit. Other cards and preference adaptations compile deterministically. The separately successful four-test live integration run did not save a fully enriched broadcast artifact. No replay interaction simulates a fresh Foundry run, streams invented reasoning or incurs cloud inference.

## Verification

| Check | Result |
|---|---|
| Full Python suite, isolated SDK environment | 178 passed, 2 explicitly opted-out live tests skipped |
| Existing simulator suite | 10 passed |
| Existing simulator TypeScript | Passed |
| Viewer TypeScript + Vite production build | Passed |
| Built assets + packaged fixture bundle, browser | 6 passed across 1366×768 laptop and 390×844 touch/mobile |
| Container build | Passed; non-root studio user, patched pip 26.2.2 |
| Python viewer lock audit | Zero known package vulnerabilities |
| npm full dependency audit | Zero reported vulnerabilities |
| Canonical exported fixture hash check | Eight files match manifest |
| Git history secrets | Gitleaks: 17 commits, 1.73 GB, no leaks found |
| New viewer/build/artifact source scan | No leaks found; see security-readiness.md for exact scope |
| Frozen implementation integrity | No changes to agents/, stories/, tracking/, Step 2.5 or backend/uv.lock |

Browser assertions cover fixture selection, source-prefix score transitions (39:30→39:31, 70:41→70:42), tracking absence in event-only fixtures, source evidence tabs, positional numbers/support/sample provenance, Fan/Analyst/favorite changes, unsupported questions, feed seeking, playback, guided demo, actual recorded agent evidence, injected service failure/retry, no horizontal overflow and no page JavaScript errors. A delayed request explicitly checks that old score/timeline content disappears while seeking backward. Screenshots are actual browser captures, not mockups.

Genuine captures: artifacts/laptop-broadcast.png, laptop-proof-lens.png, laptop-agent-room.png, mobile-broadcast.png, mobile-proof-lens.png and laptop-withheld.png. Full raw browser logs/traces remain locally under output/playwright; test command logs under /tmp/matchpulse-step3c-*.log. The acceptance JSON records the final container test outcome and image digest.

The first clean container build exposed missing Node type definitions; the explicit dependency fixed it. The initial base-image pip audit failed and was fixed rather than waived. Container runtime and browser tests exercise the deployment dependency set independently of the local SDK environment.

## Remaining release work

Azure resource inventory currently contains only the existing Foundry account/project; there is no viewer hosting resource. Deployment preparation is in deployment.md; repository/public video/testing-access actions are in submission.md. Public hosting, public repository visibility, a finished video and final Innovation Studio submission are not completed by this implementation. No claim of production load resilience, human relevance ratings, multilingual output, real match calibration or competitive win is made.
