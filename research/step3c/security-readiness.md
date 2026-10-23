# Viewer security and release readiness

Review performed October 24, 2026. This is a finite engineering review, not a security certification or approval to publish.

## Implemented boundaries

- Viewer requests accept only five catalog scenarios, finite bounded clocks, closed audience/team enums and the existing restricted question enum. No caller filesystem paths, arbitrary prompts, uploads, model calls, remote retrieval, subscription operations or public MCP endpoint.
- Claim access is checked against the current match, replay clock, audience and scheduler-approved timeline before independent source verification. Original observation fields are allowlisted. Tracking geometry is recomputed from original positions; corrupt source fails closed. No ground-truth labels are sent to the viewer as authority.
- Score and displayed frame come from observations at or before the current clock. Different fixtures never share state. Browser request cancellation and generation checks prevent stale questions/proofs from replacing a newer context.
- API errors suppress filesystem paths/provider bodies. Responses use no-store and nosniff. Hostnames are explicit. Packaged responses include a same-origin CSP, frame denial, no-referrer and disabled camera/microphone/geolocation. Public TLS, ingress and platform rate limiting remain deployment responsibilities.
- The image runs as studio (UID 10001). It has only the viewer, eight canonical source files, selected config, reviewed small recorded evidence and built assets. No Azure identity, CLI token cache, secrets files or Foundry/MCP network service. Inspecting the final built image found 77 application files and no forbidden credential paths. All six viewer Python source hashes match the current working files.
- Recorded Foundry plans are parsed with existing strict contracts and passed through current publication verification against the actual fixture and exact preferences. The partial capture retains fallback narration/enriched overlay labels. The successful full integration test did not persist a fully enriched broadcast artifact. Replay browsing incurs no inference calls.

## Checks actually performed

- npm audit, including development dependencies: zero reported vulnerabilities in the final package lock, including the added Node type definitions.
- Python viewer lock: pip-audit reports **zero known vulnerabilities** after updating bundled pip from 25.0.1 to 26.2.2. The initial audit reported 12 vulnerability records in pip (some duplicate aliases); these were not dismissed. The new separate viewer lock pins 20 packages and does not alter backend/uv.lock.
- Gitleaks Git scan: 17 commits, about 1.73 GB scanned, no leaks found. A separate stdin scan of 34 new viewer/build/artifact files (about 200 KB) also found none. Reports were redacted and retained locally under /tmp/matchpulse-step3c-*-secrets.json. No secret values were printed.
- Additional bounded working-tree signatures: 750 text files scanned, 465 files above 1 MiB omitted, no matches. This supplementary scan alone would not establish history safety; the Gitleaks history scan is separate.
- Existing tracked modifications are .gitignore, README.md and AGENTS.md. Frozen agents/provider, stories, tracking, Step 2.5 research and backend/uv.lock remain unchanged. New viewer code is isolated. No commit, push, visibility change, hosting deployment or billing change was performed.

Dependency advisories can change. OS image packages, container penetration testing, internet load/abuse, a clean machine install and a public HTTPS deployment have not all been validated. Do not describe these local checks as production certification. Build context exclusions, package audit and Git secret scans do not replace a final human review of what becomes public.

## Public repository checklist

- Review every staged filename and diff, including new JSON state/trace fields; preserve provenance while excluding account details and prompts. Re-run Gitleaks on staged contents and all Git history at the exact release commit.
- Check THIRD_PARTY_NOTICES.md, simulator MIT attribution, frontend dependencies and rights to every screenshot/video asset. No official match footage or real club branding is used in this viewer.
- Confirm all recorded outputs are labeled, source hashes match the eight-file bundle, screenshots depict the actual release build and research limitations remain visible.
- Keep environment files, CLI caches, dependencies, raw account screenshots and coordination records outside the public repository. Do not add the entire local workspace or bulk new experiments.
- Decide how judges obtain the exact synthetic fixture bundle; currently it is local/ignored. An inaccessible fixture dependency makes a fresh checkout incomplete. Prepare a reviewed release artifact or tested reproduction instructions before judging.
- Obtain explicit authorization before changing repository visibility, pushing a release, uploading a bundle/video, publishing an image or provisioning hosting. Inspect exact contents and hosting cost first. The existing private repository is not yet eligible under the public-code requirement.
