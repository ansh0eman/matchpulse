# P12 — source and AMD64 working-tree candidate acceptance

26 October 2026. Source and working-tree image gates passed; final commit-labeled archive/public/deployment identity remains the next release step. Do not treat this candidate as already published.

## Final local checks

| Check | Actual result |
|---|---|
| Complete frontend on owned Vite18151/API18110 |146 passed/one intentional skip/zero unexpected/zero flaky;147 collected;589.524s |
| TypeScript/production build |Passed; Vite build414ms; JS397.77KB raw/118.02KB gzip; CSS115.34KB raw/22.20KB gzip |
| Simulator typecheck and tests, Node24 |Passed;10 tests/zero failures |
| Full backend with both live opt-ins0 |215 passed/two intentional live skips;20.21s |
| Focused AMD64 packaged browser on18112 |26 passed/zero skip/failure/flaky;161.781s |
| HTTP image source/proof/goal smoke |Passed;59 samples/+10.01258807588076m; original native goal boundary and source hashes;zero model calls |
| Whitespace |Passed |

Full frontend command: Node24 PATH, `MATCHPULSE_TEST_URL=http://127.0.0.1:18151 PLAYWRIGHT_JSON_OUTPUT_FILE=<absolute p12/frontend-final/results.json> npm test --prefix web -- --reporter=list,json --output=<absolute p12/frontend-final/traces>`. Unfiltered. Raw logs/JSON, classification, exit0 and source SHA256 map retained. The single skip is the existing laptop mobile-only pointer-reveal test; mobile counterpart executed. All tested source fingerprints still match after the run. This supersedes no historical failure by implication: repair142/1, P8 initial13/1 failures and earlier sprint/reviewer results remain separately preserved.

Packaged command selects `tests/broadcast.spec.ts tests/evidence-navigation.spec.ts tests/native-showcase.spec.ts tests/investigate-spatial.spec.ts` with the same reporter/evidence pattern and URL18112. Source/claim/match/time rejection, independent59-frame proof, actual native goal, preferences, raw-player inspection, failure recovery and keyboard/mobile navigation pass. Development-only module-import harnesses remain part of the complete dev suite, not misrepresented as packaged checks.

## Candidate artifact and resource boundary

`docker build --platform linux/amd64 -f Dockerfile.viewer -t matchpulse-viewer:turnofplay-candidate ...` completed. This provisional image explicitly carries a working-tree snapshot label, not an inaccurate HEAD label. It runs with0.5CPU/1GiB and no credentials/host mounts; tests used owned loopback18112. API health first availability8.118s and first line view6.950s in the emulated constrained container are observations, not cloud cold-start guarantees.

Runtime audit: UID10001; all8 bundled font/component notice files present; no `.env`, account caches, `.git` or private key paths under/app; no AZURE/OPENAI/FOUNDRY credential environment names. Container cgroup peak750,616,576bytes (about716MiB), including the audit probe. This is finite candidate evidence under this workload, not a load/abuse/SLA certification.

The existing publication workflow now accepts a validated release_tag with its old tag as default, retaining archive/source/config/rootfs verification and least-privilege permissions. This lets the new archive use a separate release rather than overwrite the historical fixture/image asset. YAML parses and tag input is validated before shell download.

Next: privacy-checked local source commit; cache-reused build with exact full revision label; saved archive/config/ordered-rootfs verification; then publication and protected deployment/public acceptance. Candidate runtime/source bytes must agree with the final image; labels alone are not proof.

## Evidence and scope

Ignored evidence under `output/product-excellence/p12/`: frontend-final, packaged-browser, build/simulator logs, image HTTP/runtime audits and source-audit. P7 response-hash equivalence and P8 acceptance remain linked from current status. Frozen analytical inputs/observations/thresholds/lockfiles/holdouts were not changed. No new model call, dependency declaration, payment change, deployment or participant rating was used to obtain these results.
