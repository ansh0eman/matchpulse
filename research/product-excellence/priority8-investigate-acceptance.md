# P8 — inspect original player observations

26 October 2026. Local bounded acceptance; human usefulness remains uncollected.

Investigate now offers a source-player selector and Previous/Next keyboard-accessible controls. Choosing an original source ID pauses replay, highlights exactly that player and exposes original x/y, frame ID, observation time and age against the replay clock. The inspector retains the existing rounded white/lavender surfaces and theme/type system. It adds no inference, model calls, player-name fabrication or API endpoint. A visible qualification distinguishes synthetic source IDs from real players/shirt numbers and one observation from a trajectory or tactical intent.

Scope: `web/src/views/SourceFrameInspector.tsx`, `views/investigation.css`, integration in `InvestigateView.tsx` and `main.tsx`, plus `web/tests/investigate-spatial.spec.ts`. Matchday composition and original Pitch geometry are unchanged. Selection is match-scoped, cleared when unavailable and never used as proof authority. Event-only fixtures explain unavailable player positions.

## Verification

- Node24 `npm run typecheck --prefix web`: passed after correcting nullable state narrowing; original diagnostic retained in `output/product-excellence/p8/typecheck.log`.
- Against owned Vite18151/API18110: `npm test --prefix web -- tests/investigate-spatial.spec.ts tests/evidence-navigation.spec.ts --reporter=list,json --output=<absolute p8/final/traces>` with unique JSON/log paths: **14 passed,0 failed/skipped/flaky,41.4s**.
- API oracle verifies selected player's original coordinates and frame identity; selector does not request proof or change the replay clock while paused. Selection during playback pauses; scenario switches clear it. Keyboard Previous/Next wrap through actual frame players. Both themes/mobile overflow checked; existing wrong-claim/wrong-match/future/failure/late response, proof focus and59-sample/+10.01m assertions pass.
- Initial two selections each recorded13 passes/one failure: Mac headless native select did not change via key events. The separate native-popup probe also retained value/index0 through Space/ArrowDown/Enter. Added useful HTML Previous/Next buttons and tested actual Enter/Space activation; exact selection/readout assertions remain. Failed attempts are retained; no timeout or source assertion weakened.
- Inspected fresh laptop/mobile light captures and dark evidence from `output/product-excellence/p8/final/traces/*/source-player-*.png`. Readable padding/wrapping and original-position highlight; no horizontal overflow. Source readout live announcements are off until a player is chosen, avoiding frame-by-frame announcement spam.

No backend, frozen source, experiment, analytical threshold, dependency, provider, deployment, Git commit or push changed in P8. Coordinate formatting is two decimals over original observations, not a new registered tactical claim. This source-inspection feature is technically verified; participant understanding and real-player applicability are not established.
