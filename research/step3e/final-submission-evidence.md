# Final release and submission evidence

The user authorizes audited source/image/video publication and final submission without routine reconfirmation, conditional on ₹0 out of pocket, retained trial protection, no PAYG/Marketplace/new payment method and no extra paid Foundry inference.

| Gate | Actual state |
|---|---|
| Product | Premium Matchday source 50da7ea; 33/33 packaged ARM64 and 33/33 saved/load-roundtrip AMD64 browser cases passed at 0.5 CPU / 1 GiB |
| Security/license/provenance | 25-commit history scan and packaged application scan: zero findings; six served license files byte-matched; ten fixture manifest hashes verified; fresh npm audit zero advisories |
| Hosting | Protected trial verified; credit valid through Nov22; ACA Consumption + public GHCR selected |
| Public source | Audited repository made public under conditional release authorization: https://github.com/ansh0eman/matchpulse |
| Fixture/image distribution | Published image/fixture prerelease viewer-fixtures-v2; GitHub workflow 40115489766 succeeded; anonymous GHCR manifest access verified and config digest matches accepted image |
| HTTPS app | Not deployed |
| Narrated video | Actual six-scene browser recording plus local stock narration assembled: 112s, H.264/AAC and embedded English captions; visual review sampled actual assembled frames; listening review/public upload pending |
| Innovation Studio fields | Not rechecked this milestone |
| Entry submitted | **No confirmed submission** |

The later Product Excellence directive supersedes the arbitrary October24/25 feature freeze. Work now proceeds by independent acceptance gates; do not publish an unfinished artifact to meet that internal date. Hackathon deadline remains October27,23:59Pacific / October28,12:29IST. Keep judge access through November10; no immediate post-deadline deletion. Current system/gaps are consolidated under research/product-excellence/.

Replace pending states only with verified commit/digest/URL, actual browser result or platform confirmation. Uploading a video or editing fields is not submission acceptance.

October 24 release recheck: normal Azure sign-in/MFA completed; subscription restored. ARM reports Enabled / FreeTrial_2014-09-01 / spendingLimit On. Billing reports USD 200 current and estimated credit, expiring November 22. No policy, billing or model changes were made. Microsoft.App registration was requested for the authorized Consumption deployment; resource creation and HTTPS remain separate gates.

Exact local image/config identity, browser statistics, finite scan scope and video assembly identity: [premium release acceptance](artifacts/premium-release-acceptance.json). Reproduce a real recording with `node web/scripts/record-release.mjs`; optionally pass scene IDs to recapture selected scenes. Assemble existing scene recordings and locally generated narration with `python3 web/scripts/assemble-release.py`. The video assembly checks do not establish listening review or submission success.

Published runtime reference: `ghcr.io/ansh0eman/matchpulse-viewer@sha256:2f6718b03c0fe983fa6a10fae6bbc2f2ab739066fe33897ec208dd12d71db12c`. Anonymous registry response identifies accepted config `sha256:5d09c5ca3469014830048aaa3087702346f8422cdd51f5f88096ddd7d513339c`. [Asset prerelease](https://github.com/ansh0eman/matchpulse/releases/tag/viewer-fixtures-v2) and [publishing workflow](https://github.com/ansh0eman/matchpulse/actions/runs/40115489766). The compressed image SHA256 is `7bbea4953a284e586bc4dc6d26d1549f506d30a65fb61cdb1313c5a7f6e626a2`; canonical fixture archive SHA256 is `2b6770ed687c761e054b8b7bf81d006ad672bf6ca8d852ad60c732ca385e947f`. Neither publication alone establishes public application acceptance or submission.
