# Bounded recorded replay

The first continuity repair (98cedc3) stopped removing the pitch during requests. This milestone removes the per-clock network dependency: the viewer prefetches up to 16 source seconds and publishes only the prefix at its displayed clock. This is recorded replay, not a live ingestion service or a new Foundry call.

## Implementation and boundaries

- `viewer/playback.py` uses the unchanged viewer compilers and original event/frame sequences. Packets include at most 512 rows per observation category and 2,000,000 serialized bytes, with a maximum 16-second window. Catalog, context and HTTP protections remain in force.
- `playback/segment.ts` validates source hashes, fixture/preferences, sequence continuity, identities, time order, bounds and render-safe values. `prefixView` filters original observations and approved presentation times. Scores come from original score snapshots, never goal counts. Server Proof Lens still independently checks the requested clock; prefetching a future claim does not authorize its proof early.
- `useBufferedReplay` advances a quarter-second source clock through `requestAnimationFrame`, with a single pending refill starting at eight seconds remaining. An underrun retains the last verified view. Pause, seeking and context changes cancel the old controller; late replies cannot publish into a new session. An invalid packet pauses with a retry action.
- `Pitch` is memoized: a clock-only update does not rerender unchanged source geometry. Both replay sliders use the same quarter-second clock resolution. There is no coordinate interpolation or inferred trajectory; visible motion remains limited by actual source sampling.

## Acceptance

The targeted final browser run passed **14/14 in 43.1 seconds**, covering laptop and mobile. Prefixes match the existing `/api/view` oracle across all five fixtures and a halftime boundary, including score, period, frames, frame age, narrative timeline, diagnostics, recap, preferences and hashes. Fault cases reject wrong context/hash, missing/duplicate/out-of-order rows, invalid times and malformed geometry/score/metrics. Real browser playback advances multiple seconds from one packet without per-tick full-view requests. Slow-response tests retain the original SVG, keep one request in flight and preserve backward-seek isolation. Goal playback is compared against the original API at the sampled displayed clock.

TypeScript passes. Full backend regression: **194 passed, two explicitly disabled live tests skipped** (10.32 seconds); no model requests. Final packaged browser acceptance: **31 passed, zero failures/skips/flaky**, 139.852493 seconds, start `2026-10-24T13:12:09.290Z`. This includes the actual elapsed-time guided demo. The tested native ARM64 image is `sha256:aa91bc2fe923901ff18bcac4a63641d53a27b19ba43f88f31567948898e4e1f5`, constrained to 0.5 CPU / 1 GiB at localhost:8017. The same image replaced the user's preview at localhost:8013. This does not establish AMD64 or cloud acceptance. Full raw log: `/tmp/matchpulse-buffer-accepted-native-final.log`.

The goal acceptance test exposed a real UI discrepancy: half-second slider rounding disagreed with the quarter-second controller around the goal boundary. Both sliders were corrected, retaining the score assertion. A separate full-suite failure exposed an unfinished test route callback after a test ended; delayed handlers now settle and drain before teardown. This was test lifecycle repair, not a removed product assertion.

One packaged run reported 30/31 because the continuity test counted an aborted prefetch handler together with the new authoritative paused-view request. The trace showed sequential automatic refills at source clocks 3360, 3368 and 3376; the view request started only after Pause at 3378.25. The test now counts automatic `/api/playback` requests explicitly and rejects cancellations before Pause. It still requires one pending automatic refill, two completed slow replies, retained SVG identity and no blank stage. Cancellation initiated by Pause remains permitted. This is distinct from accepting overlapping automatic refills.

## Measurements and limits

The earlier buffer prototype on local ARM64 Docker with 0.5 CPU / 1 GiB measured a cold first-source packet at 2.912 seconds / 89,907 bytes and one warm packet at 0.094 seconds. A warm full view was 0.099 seconds / 46,772 bytes. These are individual local observations, not p50/p95, cloud latency or a bandwidth/cost advantage. Warmed five-fixture memory was 637.9 MiB. The packet is larger than one view; its benefit is reuse across playback ticks.

This milestone does not establish live producer arrival, SSE/resume/reconnect, new analytical accuracy, AMD64/cloud acceptance or external hosting. Those remain separate gates. Original fixtures, frozen detector findings, source fingerprints and Foundry captures are preserved.
