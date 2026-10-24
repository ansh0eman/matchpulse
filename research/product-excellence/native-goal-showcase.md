# Native goal showcase

This is a separately generated product example, not a new detector evaluation. The original five fixtures, frozen research data/configuration and all analytical findings remain unchanged. No model calls were made.

## Selection and reproduction

The first predeclared seed, 1833995344, produced **0–0** with 22,481 native snapshots. That result is retained locally under `backend/output/showcase/run-a` and `run-b`; event and projected-tracking hashes agree across the repeat. It was not relabeled as a goal example.

The separate [goal selection protocol](goal-showcase-protocol.json) declares eight SHA256-derived seeds, order, fixed roster offsets (+1 home, −1 away), no intervention, and a stop at the first observed goal. Candidate 1511657676 produced 0–0; candidate **1603656668** produced **2–0**, so selection stopped. The protocol makes no representative scoring-frequency or tactical-accuracy claim. These product seeds are distinct from the preserved research split formulas.

`poc/src/showcase.ts` checks the simulator commit and original simulation/projection fingerprints before running. Event-only selection and native snapshot capture must have identical canonical event bytes. Every snapshot callback is explicitly projected; original sequences and source times remain intact. Both complete goal generations have **6,892 events / 22,401 frames**, end at 5600 seconds and have a measured maximum snapshot interval of **0.25 seconds**, with no repeated source times. No coordinate interpolation or resampling was used.

| Source bytes | SHA256 (identical in goal-a / goal-b) |
|---|---|
| Canonical event JSONL | a0776ea16bf6d4541795da65c4bbfe19a653da2b1203a0e1b1912b95fbd5a2e8 |
| Original projected tracking JSONL | a1694e5ff03f47799fb63054f8425d0fd355da214236cbb3cb85f0b3e764a3e7 |
| Compressed tracking | d01d3e283b6e8a0b1d60014b237cf73b1b29dee4454258e592520323121b61ee |

The first goal is observed at **1614.0s (26:54)**, 0–0→1–0; the second at **2171.5s (36:11.5)**, 1–0→2–0. Independent Python replay verified all **192 claims** and produced 77 scheduled items. At each goal, the original frame at the goal clock agrees with the original event score; the preceding quarter-second frame has the preceding score. The fixture UUID is `fc02c27c-54fc-4104-b428-7e1f9018efea`. These goals are deterministically compiled; they are not the historical Foundry capture from a different match.

## Runtime integration and measured limits

The new `native-goals` scenario, “Goals, in motion,” starts three seconds before the first goal. Native quarter-second positions can advance through buffered replay alongside that same match's actual score and Proof Lens. The original five chapters remain separately selectable. The scenario rail now fits six chapters and scrolls on small screens.

One native-source load on local ARM64 Docker, **0.5 CPU / 1 GiB**, took 10.001 seconds and peaked at 702,627,840 bytes RSS (about 670 MiB). Keeping every analytical match cached could exceed the memory budget. The viewer therefore evicts the previous source **before** loading a different one and keeps only one analytical match per process, with synchronized loads. It does not discard the browser's current verified prefix while refilling. This is not multi-user load acceptance; switching fixtures has a real cold-source cost.

Eight explicit HTTP switches survived within the 1 GiB container: native-goal steady usage 667.2 / 668.5 / 668.7 MiB; tracked original fixtures 212.5–216.5 MiB; event-only fixtures about 66.7 MiB. Individual native cold loads were 8.837 / 5.190 / 5.371 seconds. These are local samples, not cloud p50/p95 or a startup SLA.

The new ignored `backend/output/viewer-bundle-v2` has **10 files / 31,984,795 bytes** plus its manifest. Its original eight manifest rows match the prior bundle exactly. The prior bundle remains intact. The container maps v2 to its existing internal fixture path; no credentials, evaluation metadata or generation sidecars are included. A public bundle/clean checkout is still a release gate.

## Verification and reproduction

Final backend: **198 passed / two disabled live-call tests skipped**, 17.01 seconds. Simulator's existing suite: **10 passed** (10.455 seconds). Simulator and viewer TypeScript pass. Final packaged browser regression: **33 passed, zero failures/skips/flaky**, 282.132368 seconds, start `2026-10-24T13:45:51.490Z`. Image: `sha256:63344b8a0138b1b9064706e5a6eb6f825dc997999436b7b278824c73685c6d52`, ARM64, 0.5 CPU / 1 GiB. The same image replaced localhost:8013; release HTTP smoke checks passed there. This is not AMD64/cloud acceptance.

Both viewport tests play the actual 0–0→1–0 transition, keep the same SVG mounted, inspect its recomputed proof and seek back to 1613.75 seconds without the future score/headline. The packet-prefix oracle now also covers the native fixture. Genuine screenshots: [laptop](artifacts/native-goals-laptop.png) and [mobile](artifacts/native-goals-mobile.png). Full raw log: `/tmp/matchpulse-native-final-browser.log`.

The initial new-test readiness was corrected to wait for verified positions rather than the requested clock (which is immediately visible while loading). A separate focused laptop attempt hit the just-starting server before health readiness; subsequent full acceptance began with a healthy server. These failed attempts are not counted as passes.

The new goal test also exposed a real Theatre selection defect: a goal and its observed shot had identical presentation times, and taking the last timeline row chose the shot. Viewer responses now expose the existing engine's editorial priority (explicitly not confidence/probability). Automatic selection uses latest presentation time, then that original priority, while a user's selected story still takes precedence. Source rows, scheduler decisions and frozen analytical modules are unchanged. The goal assertion remains intact and is rerun against the rebuilt image.

Trace the example: `App.choose` selects `native-goals` at 1611 → `/api/view` resolves the allowlisted UUID → `source/_load_source` loads original events and native frames → unchanged `stories.replay` / `ClaimRegistry` independently verify incidents → viewer `render` uses deterministic narrative/overlay compilers → `/api/playback` prefetches a bounded window → `validateSegment/prefixView` publish only the current prefix → at 1614 the original score becomes 1–0 and engine editorial priority selects the goal. Proof Lens calls `/api/proof`; `receipt` checks current visibility and independently verifies the original score rows. No Foundry call occurs in this path. Agent Room retains the separately labeled historical Foundry fixture.

From a checkout with the pinned simulator and existing fixtures, using new exclusive output directories:

```sh
cd poc
npx tsx src/showcase.ts
npx tsx src/showcase.ts --repeat
npx tsx src/showcase.ts --goal-showcase
npx tsx src/showcase.ts --goal-showcase --repeat
cd ..
backend/.venv-foundry/bin/python backend/scripts/export_viewer_fixtures.py
docker build -f Dockerfile.viewer -t matchpulse-viewer:native-goals .
```

An existing generation directory is never overwritten. Original event and tracking files are local/ignored; protocols, generator, compact evidence and tests are versioned. This does not claim fresh-holdout detector performance, new Foundry orchestration, AMD64 acceptance, public deployment or submission.
