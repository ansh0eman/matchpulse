# Hardening progress — October 27, 2026

## Completed: untouched public baseline

- Test source: `efba043b29911b72cb5ebb964fecf9006a5f775b` (application source unchanged since runtime `0b06707`; test readiness correction in `7c47105`).
- Command from `web/`: `MATCHPULSE_TEST_URL=https://matchpulse-studio.politesea-3d29a667.eastus.azurecontainerapps.io PLAYWRIGHT_JSON_OUTPUT_NAME=../output/product-excellence/p12/public-recheck-20261027-01/results.json node node_modules/@playwright/test/cli.js test --grep-invert 'React hook unmount invalidates' --output=../output/product-excellence/p12/public-recheck-20261027-01/browser-artifacts --reporter=list,json`.
- 149 applicable cases completed: 127 passed / 1 intentional skip / 21 failed / 0 flaky. One worker, original timeout/assertion values. Raw log/JSON and every failure trace are retained in the named directory. All failures are accounted for in `public-hardening-baseline-2026-10-27.md`; sleep-log overlap and explicit transfer failures do not convert failures to passes.
- First main journey passed in52.1seconds. Initial failures include the withheld-fixture switch in broadcast/editorial cases. First inspected trace reached the5second withheld assertion while the actual source view was pending; this is evidence to investigate, not a conclusion that every failure is transport-only.
- No application/test mutations during baseline. Existing dirty documentation and video scripts are preserved. No inference, frozen data/config, lockfile, Azure configuration or deployment changed.

## Initial read-only maintainability inspection

Current module boundaries: shared shell and controls; one App replay authority; dedicated buffered source/presentation lifecycle; scoped source-player selection; independent Proof Lens request validation; story-time support receipts; deterministic editorial/timeline/commentary functions. TypeScript strict mode is enabled and no explicit `any` was found in `web/src`.

Candidate issues for isolated reproduction after public baseline:

1. The paused-view request catch checks error name but not its aborted signal, whereas its success path and proof paths explicitly check ownership. Test a generic obsolete rejection after a newer scope succeeds.
2. Ask completion uses context generation but lacks the controller-identity guard used in playback. Test overlapping same-context completion/error/finally paths before deciding whether user-reachable behavior requires a fix.
3. Shared GET error decoding assumes the JSON error body is non-null and its `error` member is a string. Test malformed error responses without any provider/API call.
4. Time formatting is exported from the Proof Lens UI component and imported by unrelated playback/shell/source components. A small leaf utility would remove this avoidable dependency.
5. Following/menu logic and several hooks are compressed into long lines. Improve only owned, audited functions where readability helps lifecycle review; no mass formatting.
6. Backend analytical work is intentionally serialized and retains one source match. Its cold switching and multi-client queue limits remain explicit; do not add concurrent heavy workers within the1GiB budget without measurement.

CSS size and central component length alone are not proof of a defect. Broad CSS migration, generalized state frameworks and speculative analytics remain outside the repair slice.

## Local hardening and verification completed

- Reproduced3new pre-fix regressions; repaired stale paused-view error ownership and malformed HTTP error decoding. GET/Ask share the error contract. Exact clock formatting moved to a leaf module.
- Focused development6passes; compiled production-preview6passes. Complete local frontend156passes/1intentional skip/0failed/flaky. Complete backend215passes/2live-provider skips; simulator10passes/typecheck. Web typecheck/build/whitespace pass.
-80web source/test/config fingerprints were unchanged during the complete local final run. All813protected source/config/data/research fingerprints still match after backend/simulator checks.
- Initial local diagnostic run was superseded after a test-only prerequisite edit:113passed/1skipped/1interrupted/42did-not-run. It is not counted as a full pass; its evidence remains in `hardening-full/`.
- Maintainability review, capability inventory/options and concrete incident-exploration sprint design are saved locally. No new feature implementation or human usefulness result is claimed.

Final test refinement:3additional support-startup checks await real receipts, and the15malformed-packet variants are isolated with actual recovery/oracle verification for each. The updated complete local run is184passed/1intentional skip/0failed/flaky (185collected); source/test hashes remained unchanged during execution. This count increase comes from test isolation, not new detector accuracy.

## Completed: fresh public follow-up and focused corrections

155applicable cases completed:143passed/1intentional skip/11failed/0flaky. Evidence under `public-hardening-20261027-02/`. All11failures inspected:6support-startup prerequisites,1monolithic fault-test budget exhaustion and4controlled runtime defect cases on the old build. No sleep overlap or network-change transfer in those failures. After the test corrections,36focused public checks passed; this does not become a combined full-suite pass.

## Active: authorized release-plan gates

Public acceptance remains open until the repaired image is released and its complete applicable suite passes. The existing user-authorized release plan covers this follow-through. Actual Azure policy was rechecked:Enabled/FreeTrial_2014-09-01/spendingLimit On. Source/privacy review covers27owned paths,10canonical bundle files/31,984,795bytes,813unchanged protected files and unchanged dependencies/notices. Unrelated dirty documentation/private/video material is excluded. Build/archive identity, packaged checks, immediate protection recheck and image-only update still precede final public verification; no new resource or paid inference.
