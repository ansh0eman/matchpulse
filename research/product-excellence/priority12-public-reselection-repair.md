# Public acceptance follow-up — replay seed readiness

October26,2026. The first public-image verification identified a real UI lifecycle race in both Matchday and Investigate: reselecting the same fixture clears `snapshot` while retaining an independently verified `sourceState` at the same clock. The pitch remains visible, but Play was enabled using stage presence alone. Clicking it before the replacement view arrived aborted the paused view request and started the buffer hook with no seed. No buffer request was made, so the source clock remained stuck.

## Bounded correction

`App.tsx` passes explicit playback-seed readiness to both views. Matchday and Investigate disable Play while the seed is absent; the retained pitch and score remain visible. Matchday's play callback also rejects missing-seed starts. Preference-only projections retain a nonnull canonical seed and keep the prior continuity behavior. No source observations, analytics, fingerprints, thresholds, resource settings or proof arithmetic changed.

New `reselection-readiness.spec.ts` holds the real reselection view response, asserts that original geometry/score remain visible and Play is disabled, releases the response, then verifies actual playback through the native goal. It covers both views on laptop/mobile. No existing assertion or timeout was changed.

## Evidence

- Regression against prior accepted AMD64 image on18112: **2failed/0passed** (both laptop views). Exact failure was Play enabled while the replacement response was held. Raw JSON and traces retained under `output/product-excellence/p12/reselection-baseline/`.
- Fixed development source on18151: new test plus native showcase/request ownership, **24passed/0failed/flaky**, both projects.
- Full unfiltered fixed frontend: **150passed/1intentional skip/0failed/flaky**,151cases, approximately10.3minutes. Exact JSON under `output/product-excellence/p12/reselection-full/results.json`.
- Typecheck and production build passed. JS397.88KB raw/118.08KB gzip; CSS remains115.34KB raw/22.20KB gzip. Whitespace passed.
- Backend/simulator source did not change. Earlier215backend passes/2live opt-in skips and10simulator passes remain separate candidate evidence; they were not rerun for this frontend-only correction.

## Exact commands

From `web/`, using the installed Node24 binary:

```sh
MATCHPULSE_TEST_URL=http://127.0.0.1:18112 PLAYWRIGHT_JSON_OUTPUT_NAME=../output/product-excellence/p12/reselection-baseline/results.json /Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node node_modules/@playwright/test/cli.js test tests/reselection-readiness.spec.ts --project=laptop --reporter=list,json --output=../output/product-excellence/p12/reselection-baseline/artifacts
MATCHPULSE_TEST_URL=http://127.0.0.1:18151 PLAYWRIGHT_JSON_OUTPUT_NAME=../output/product-excellence/p12/reselection-fixed/results.json /Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node node_modules/@playwright/test/cli.js test tests/reselection-readiness.spec.ts tests/native-showcase.spec.ts tests/request-ownership.spec.ts --reporter=list,json --output=../output/product-excellence/p12/reselection-fixed/artifacts
MATCHPULSE_TEST_URL=http://127.0.0.1:18151 PLAYWRIGHT_JSON_OUTPUT_NAME=../output/product-excellence/p12/reselection-full/results.json /Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node node_modules/@playwright/test/cli.js test --reporter=list,json --output=../output/product-excellence/p12/reselection-full/artifacts
/Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node node_modules/typescript/bin/tsc --noEmit
/Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node node_modules/vite/bin/vite.js build
```

The initial public suite against source0af30ac is retained separately. It includes a rollout-time old-HTML/new-asset404, several pending-view/support assertions and the native reselection race above. Do not relabel all failures as network delay, remove assertions, silently extend deadlines or overwrite that run. Public acceptance of the corrected image remains a separate gate.
