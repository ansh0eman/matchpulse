# Milestone: stop clearing the match on every playback tick

## Acceptance fixed before implementation

Keep the original SVG mounted and verified score visible through two source requests delayed1250ms each; allow at most one automatic playback request in flight; keep Pause usable; a backward seek must clear future facts immediately and a late forward response must not resurrect them. Run on laptop and phone. Preserve source arithmetic and all original viewer behavior.

## Cause and implementation

`App` used exact requested/loaded query equality to decide whether any match data could render. Each forward tick therefore set `data` to null, showing a loading state and replacing the pitch. The next interval could abort a response slower than one second. This was a UI/request-lifecycle defect, not missing observations.

`web/src/playback/causal.ts:visibleSnapshot` retains a verified snapshot only when scenario/audience/favorite match, its loaded clock is consistent and it is **at or before** the requested clock. A backward seek cannot retain a future snapshot. Context changes still clear immediately. `App` uses a request-pending ref to apply backpressure: automatic ticks do not replace an in-flight source request, and aborted callbacks cannot publish data. Only blocking loads replace the stage.

`BroadcastTheatre` and Studio display the verified snapshot clock alongside its score. The transport can show the requested playhead; while waiting, the source caption states the verified clock. No new goal, player position, trajectory or interpolation is fabricated. React can update the observed SVG nodes; the entire pitch is no longer removed and rebuilt each tick.

## Measured result

Targeted real-browser cases in web/tests/playback.spec.ts: **4 passed**, laptop and phone, 19.2s. A retained SVG element remained connected after two slow responses; maximum simultaneous automatic requests was one; no canceled forward request; backward seek remained at01:40 without the later +10.01m claim. TypeScript passed. Full development-browser regression: **21/21**, 132.038s. Packaged native regression: **21/21**, zero failures/skips/flaky, 122.949s, start2026-10-24T11:28:38.796Z. Image: sha256:7b2fc03d7fbd0c27c009ae44f0e6a68af193b0531ee897aee3be1a607fadf71f. The user's open preview at8013 was reloaded and actual playback visibly advanced56:00→56:36 with the stage intact. This is not AMD64/cloud acceptance.

This is a causal-replay continuity repair, **not** a live producer, SSE stream, perfect wall-clock playback or a new latency benchmark. Under slow transport it preserves verified observations and delays advancement. Bounded buffering is the next architectural dependency; actual observed frame cadence still limits motion. The previous Step3E image cannot be published as though it contained this repair.
