# Viewer deployment and reproduction

Prepared October 24, 2026. No hosting resource was created or deployed.

## Local working environment

Existing isolated Python 3.12 environment: backend/.venv-foundry. Install backend/requirements-viewer.txt there; do not rewrite the frozen research lock. Node 24 and npm are required for web/. Use npm ci with the committed package lock. Development API listens only on 127.0.0.1:8010; Vite proxies /api on 127.0.0.1:5173.

## Canonical fixtures

The catalog in backend/src/matchpulse/viewer/catalog.py is the exact source allowlist. Existing complete local canonical data is required before exporting; never substitute fixtures from a different match or regenerate into frozen experiment paths. Open-play comes from backend/output/stories/source; opening-goal/equalizer from data/step2/inference; line-shift/withheld from data/step25/inference. Export uses the exact UUIDs listed in the catalog, reruns claim verification, copies bytes without transformation and records SHA256 and size. It refuses to overwrite a different existing bundle.

```sh
backend/.venv-foundry/bin/python backend/scripts/export_viewer_fixtures.py
```

This produces eight source files plus manifest.json under ignored backend/output/viewer-bundle (about 22 MiB). Missing fixtures are a release blocker for a fresh checkout: supply this reviewed synthetic bundle as a release artifact after publication approval, or reproduce the existing documented data generations and verify manifest hashes. The bundle is not yet published. Keep full bulk experiments out of a new public release. The small recorded Foundry trace/state/artifact are already in research/step3c/artifacts and contain no authentication material.

## Packaged local server

```sh
npm run build --prefix web
MATCHPULSE_VIEWER_BUNDLE="$PWD/backend/output/viewer-bundle" MATCHPULSE_WEB_DIST="$PWD/web/dist" backend/.venv-foundry/bin/uvicorn matchpulse.viewer.api:app --host 127.0.0.1 --port 8011 --no-access-log
MATCHPULSE_TEST_URL=http://127.0.0.1:8011 npm test --prefix web
```

The browser acceptance suite exercises built assets, the packaged canonical bundle and production security headers through the same origin. No Azure credentials are needed.

## Container and Azure release gate

```sh
docker build -f Dockerfile.viewer -t matchpulse-viewer:step3c .
docker run --rm --name matchpulse-step3c -p 127.0.0.1:8012:8010 matchpulse-viewer:step3c
MATCHPULSE_TEST_URL=http://127.0.0.1:8012 npm test --prefix web
```

The image serves API and built React assets together as a non-root user. Its context is allowlisted and contains no CLI tokens, environment files, private MCP listener or Foundry SDK identity. Viewer-only runtime needs no cloud credentials. MATCHPULSE_ALLOWED_HOSTS must contain the exact hosting hostname; never use a wildcard casually. Health path is /api/health, target port 8010.

Preferred Azure candidate: a single Container App serving this credential-free replay image, minimum replicas zero, maximum one, HTTPS ingress, explicit hostname and modest CPU/memory. This is a candidate configuration, not a deployed or priced resource. Before provisioning: inspect available existing hosting/registry, current trial credit/spending limit and supported region; obtain explicit user approval for any billable hosting/registry operation, image publication and public URL. Do not upgrade the subscription. Do not mount the developer's Azure home directory or configure live model credentials for this replay service.

After an approved release, rerun the same browser suite against HTTPS, inspect headers and health, test cold startup, verify all five scenarios and source fingerprints, and retain the exact image digest/URL. Keep the judging build and video consistent. Production load, abuse/rate limits, platform patching and long-term operations need separate validation.
