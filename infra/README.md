# Protected-trial Container Apps release

The updated user authorization permits an audited release at **₹0 out of pocket**. The actual Free Trial was rechecked Enabled / spendingLimit On; its reported credit expires November 22, beyond November 10 judging. Reporting can lag. See [verified policy, credit and alternatives](../research/step3e/zero-cost-hosting-decision.md). No PAYG conversion, payment change, Marketplace purchase or paid inference is authorized.

This template now creates only a Consumption environment and one HTTPS app: 0–1 replica, 0.5 vCPU/1 GiB, exact trusted hostname, local probes and no cloud logging sink. It pulls an audited anonymous-public GHCR image by immutable digest. **No Basic registry, pull identity, role assignment, database, dedicated profile or model resource.** The original ACR proposal is superseded.

## Release sequence

1. Pass private product acceptance and final source/history/license/provenance audits.
2. Commit source, build/accept the exact AMD64 image with its revision label, and save it as an ignored archive. Publish the reviewed current fixture bundle and exact image as release assets only after the audit gate.
3. Make the audited repository public under the conditional authorization. The manual workflow refuses private repositories; it uses a standard no-charge public runner, validates archive SHA256/image ID/source label, smoke-tests the loaded image, and pushes that same image with a short-lived repository GITHUB_TOKEN. No rebuild, PAT, Azure credential or secret build argument.
4. Verify GHCR package visibility and anonymous manifest/pull. Public repository visibility alone does not establish public package access. Match registry config/image identity to the locally accepted image.
5. Recheck trial protection, register Microsoft.App if necessary, and deploy to the existing resource group with the immutable public image digest.

```sh
az bicep build --file infra/viewer.bicep --outfile /tmp/matchpulse-viewer-arm.json
# Only after all gates and protected-trial recheck:
az deployment group create --resource-group matchpulse-hackathon-rg \
  --name matchpulse-viewer-release --template-file infra/viewer.bicep \
  --parameters image=ghcr.io/ansh0eman/matchpulse-viewer@sha256:VERIFIED_DIGEST
```

Run backend/scripts/check_viewer_release.py against the actual HTTPS URL, then all browser checks. Verify startup, phone/keyboard/reduced-motion, source hashes, receipts, saved Foundry success and separate fallback. Compilation/upload alone is not deployment/submission proof. Do not delete the app/image before judging. Trial exhaustion can interrupt service; a replica limit is not a cash cap or uptime guarantee.

The native goal showcase supersedes the original fixture bundle for a future release: export uses `backend/output/viewer-bundle-v2` (ten source files / 31,984,795 bytes plus manifest). The old eight-file bundle is preserved for historical reproduction. Do not publish an earlier image as if it contained buffered replay or native goals. The viewer keeps one analytical source cached per process to fit its measured 1 GiB budget; source switches have a cold-load cost and multi-user load acceptance remains pending.

References: [Azure protection](https://learn.microsoft.com/azure/cost-management-billing/manage/spending-limit), [Container Apps grants/billing](https://learn.microsoft.com/azure/container-apps/billing), [GHCR billing](https://docs.github.com/en/billing/concepts/product-billing/github-packages), [release asset limits](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases). Only eligible first-party Azure consumption may draw protected credit; no separate license/support/Marketplace charge is allowed.
