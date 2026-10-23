# MatchPulse release status

October 24, 2026. This Theatre/product milestone follows private main commit 4efff9f. Resolve the containing commit in Git for the exact source revision. Do not confuse a local container with a public deployment.

| Item | Actual state |
|---|---|
| Repository | Private by explicit user instruction; no visibility change authorized |
| Product | Default Theatre, retained Studio, progressive Proof Lens, four-chapter guided story, recorded workflow graph, program output, receipt export |
| Viewer image | matchpulse-viewer:step3d |
| Local ARM64 image digest | sha256:5ed35f4ac4185d600a89779560ce5a2b46b7a7d74c1f87882deed5a0411ec9dc |
| Azure-compatible AMD64 candidate | sha256:5200e3c83898c81b5da7a71b02ec2336b5322d9b2e9a1c38d3cd1d6b99c97098; all 13 browser checks passed at 0.5 CPU/1 GiB; not published |
| Current preview | http://127.0.0.1:8013 while the local check container is running |
| Azure hosting | Not created/deployed; infra/viewer.bicep compiles locally. Resource, cost, public-endpoint and scoped registry-role approval remains required |
| Fixture bundle | Local eight-file ~22 MiB bundle, exact manifest; no public asset published |
| Foundry | Newly authorized source-verified fully enriched goal capture persisted; historical recovery remains separate. Actual network-request count is unobserved; see capture provenance |
| Video | Genuine silent 79.72-second H.264 rough cut saved locally under output/playwright; 110-second final narration/capture script in research/step3d/video.md. No finished/public video |
| Innovation Studio | Final name/links/entry still require checking and submission |

Local test evidence and genuine screenshots are under research/step3d/. Dockerfile.viewer and research/step3c/deployment.md remain the packaging/run instructions. No Azure CLI identity is baked into the viewer. A hostname allowlist and public HTTPS checks are required for any later hosted release.

The official submission's public-source requirement conflicts with the current private-repository instruction; keep that release gate explicit. Never silently change visibility to satisfy eligibility. A local preview is not judge-accessible hosting.

Before an authorized release, record the final commit and image digest, verify source/fixture fingerprints, run the browser suite against the actual HTTPS host, check cold startup and retained font/dependency notices, scan staged content/history for secrets, and supply fixture access and a real video. Preserve the frozen experiments and all genuine provenance labels.
