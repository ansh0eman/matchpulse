# Post-submission hardening — verification record

October27,2026. Local application checks pass. Public defects are reproduced and test corrections verified; packaged-image/release verification follows separately.

## Implemented

- Paused-view failures may publish only while their request still owns the view. A cancelled generic rejection cannot overwrite a newer ready projection.
- GET and Ask share checked HTTP-error decoding. Null, malformed, non-string and non-JSON error bodies receive a usable fallback; declared public error strings remain intact.
- Replay/source UI consumes clock formatting from a leaf utility rather than importing the Proof Lens component. Formatting is unchanged.
- Confirmed source/proof startup and fixture-switch prerequisites are awaited before the original short UI assertions. Actual match, clock, claim and41+18support are checked. The overall60s test budget is unchanged.

Detailed findings: [maintainability review](maintainability-review-2026-10-27.md). Proposed capability work: [options](capability-options-2026-10-27.md) and [incident-exploration design](incident-exploration-sprint-design-2026-10-27.md). Those features are designs, not implemented functionality.

## Completed local evidence

| Check | Result | Raw evidence under `output/product-excellence/p12/` |
|---|---|---|
| New pre-fix laptop regressions |3failed; expected stale error/null-body failures inspected | `hardening-red/results.json`, log and traces |
| Fixed focused desktop/mobile regressions |6passed,0failed | `hardening-focused/results.json` |
| Compiled production-preview fault regressions |6passed,0failed;3.7s | `hardening-production-focused/results.json` |
| Complete local frontend before final test isolation |156passed,1intentional skip,0failed/flaky;157collected;571,801.846ms | `hardening-final/results.json`, log/artifacts |
| Complete final local frontend |184 passed,1intentional skip,0failed/flaky;185collected;596,378.166ms | `hardening-final-2/results.json`, log/artifacts |
| Complete backend, live opt-ins explicitly unset |215passed,2live-provider skips;17.71s | `hardening-final/backend-tests.log`, `backend-junit.xml` |
| Simulator tests/typecheck |10passed,0failed; typecheck passed | `hardening-final/poc-tests.log`, `poc-typecheck.log` |
| Web TypeScript / production build |Passed; JS397.98KB raw/118.16KB gzip; CSS115.34KB raw/22.20KB gzip | Command output retained in the task; no dependency change |
| Whitespace |`git diff --check` passed | Current scoped diff |

The first local integration attempt was intentionally superseded after a test-only readiness change:113passed,1skipped,1interrupted,42did-not-run. Its raw result remains in `hardening-full/`; it is not counted as a complete pass. Both subsequent complete local runs used80fingerprinted source/test/config files without mutation during execution. The final count adds28cases because one15-fault loop became15isolated tests in both projects; no corruption variant or assertion was removed. Every fault now additionally proves real valid-packet recovery and recovered score/position oracle equality.

## Public evidence — separate from local acceptance

Untouched corrected-public baseline:127passed/1skipped/21failed/0flaky across149applicable cases. Every failure is accounted for in [the baseline report](public-hardening-baseline-2026-10-27.md), with raw traces and sleep-log overlap. A system sleep interruption or a transfer failure does not turn a failed case into a pass.

Fresh complete public follow-up:155applicable cases, including the6new hardening checks; only the two pre-existing development-module hook tests excluded. **143 passed / 1 intentional skip / 11 failed / 0 flaky**,31.5minutes, under `public-hardening-20261027-02/`. Every failure was inspected:6initial-support prerequisites,1monolithic packet-test budget exhaustion,4controlled browser regressions reproducing the old runtime's stale-error/null-body defects. No sleep overlap or explicit network-change transfer occurred in those11failure traces.

After correcting the3startup prerequisites and splitting all15packet faults, **36 focused public checks passed** in378,424.493ms under `public-hardening-prerequisites-03/`. These are separate results, not a combined full-suite pass. Four controlled runtime-defect cases require a released repaired build and a fresh complete applicable public run.

No full public pass is claimed, and local success does not certify the old deployed bundle. The historical0af30ac127pass/1skip/17fail result remains a third, separate record.

## Exact verification commands

From `web/`, Node24 at `/Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node`:

```sh
MATCHPULSE_TEST_URL=http://127.0.0.1:5173 PLAYWRIGHT_JSON_OUTPUT_NAME=../output/product-excellence/p12/hardening-red/results.json /Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node node_modules/@playwright/test/cli.js test tests/view-request-lifecycle.spec.ts --project=laptop --output=../output/product-excellence/p12/hardening-red/artifacts --reporter=list,json
MATCHPULSE_TEST_URL=http://127.0.0.1:5173 PLAYWRIGHT_JSON_OUTPUT_NAME=../output/product-excellence/p12/hardening-focused/results.json /Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node node_modules/@playwright/test/cli.js test tests/view-request-lifecycle.spec.ts --output=../output/product-excellence/p12/hardening-focused/artifacts --reporter=list,json
MATCHPULSE_TEST_URL=http://127.0.0.1:5173 PLAYWRIGHT_JSON_OUTPUT_NAME=../output/product-excellence/p12/hardening-final/results.json /Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node node_modules/@playwright/test/cli.js test --output=../output/product-excellence/p12/hardening-final/artifacts --reporter=list,json
MATCHPULSE_TEST_URL=http://127.0.0.1:5173 PLAYWRIGHT_JSON_OUTPUT_NAME=../output/product-excellence/p12/hardening-final-2/results.json /Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node node_modules/@playwright/test/cli.js test --output=../output/product-excellence/p12/hardening-final-2/artifacts --reporter=list,json
MATCHPULSE_TEST_URL=http://127.0.0.1:4173 PLAYWRIGHT_JSON_OUTPUT_NAME=../output/product-excellence/p12/hardening-production-focused/results.json /Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node node_modules/@playwright/test/cli.js test tests/view-request-lifecycle.spec.ts --output=../output/product-excellence/p12/hardening-production-focused/artifacts --reporter=list,json
MATCHPULSE_TEST_URL=https://matchpulse-studio.politesea-3d29a667.eastus.azurecontainerapps.io PLAYWRIGHT_JSON_OUTPUT_NAME=../output/product-excellence/p12/public-hardening-20261027-02/results.json /Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node node_modules/@playwright/test/cli.js test --grep-invert 'React hook unmount invalidates' --output=../output/product-excellence/p12/public-hardening-20261027-02/artifacts --reporter=list,json
MATCHPULSE_TEST_URL=https://matchpulse-studio.politesea-3d29a667.eastus.azurecontainerapps.io PLAYWRIGHT_JSON_OUTPUT_NAME=../output/product-excellence/p12/public-hardening-prerequisites-03/results.json /Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node node_modules/@playwright/test/cli.js test tests/clubs.spec.ts tests/final-reference-interaction.spec.ts tests/matchday-layout.spec.ts tests/playback-reliability.spec.ts --grep 'malformed .+ never publishes and retry restores source-verified playback|club mapping is display-only|Watch, successful source comparison|support receipt is requested once' --output=../output/product-excellence/p12/public-hardening-prerequisites-03/artifacts --reporter=list,json
/Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node node_modules/typescript/bin/tsc --noEmit
/Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node node_modules/vite/bin/vite.js build
```

From repository root:

```sh
env -u MATCHPULSE_LIVE_TEST -u MATCHPULSE_LIVE_WORKFLOW_TEST backend/.venv-foundry/bin/python -m pytest backend/tests -q --junitxml=output/product-excellence/p12/hardening-final/backend-junit.xml
git diff --check
```

From `poc/`:

```sh
/Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node node_modules/typescript/bin/tsc --noEmit
/Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/*.test.ts
```

Verbose test output was redirected to the named logs; exact counts came from JSON/JUnit/raw tails rather than a lossy summary. No test retry setting or timeout was increased. Test prerequisites validate real responses; they do not warm sources or fabricate expected packets.

## Preservation and limitations

All813protected tracked source/config/fixture/research fingerprints still match their pre-change baseline after the backend and simulator checks. No frozen detector, threshold, consumed holdout, original observation, numerical receipt or lockfile was edited. Source/publication, human usefulness, model quality and real-world validity remain separate claims.

At this local review checkpoint no new dependency, provider invocation, source publication or deployment had occurred. The authorized release plan's separate source/image/protection gates follow before any image replacement. Existing dirty documentation, private research and video tooling remain preserved. Complete codebase perfection, human comprehension and production performance guarantees are not established by these tests. Cold source switching and multi-client queue/memory limits still require the separate measurement work described in the capability proposal.
