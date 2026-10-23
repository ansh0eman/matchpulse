# Azure viewer candidate — not deployed

The local Bicep template prepares a concrete release for review. Do not run deployment commands until the user authorizes public hosting, metered trial-credit usage and the narrow managed-identity role assignment. The earlier Foundry capture approval does not authorize these resources.

## Exact candidate

Use existing matchpulse-hackathon-rg in eastus. Create one Basic private Container Registry, a consumption-only Container Apps environment, a user-assigned identity with AcrPull scoped only to that registry, and one HTTPS Container App. Keep registry admin/anonymous access disabled. The app has no Foundry permissions or credentials. No Log Analytics workspace, database, custom network, dedicated profile or public image/source repository is created.

Container: 0.5 vCPU / 1 GiB, minimum zero / maximum one replica, single active revision. The locally warmed viewer used approximately 638 MiB, so a 0.5 GiB limit is unsuitable. Exact public hostname is derived from the environment domain and added to TrustedHost; probes explicitly use localhost. Scale-to-zero can introduce cold starts. Use an amd64 build and verify it before publishing; the initial local ARM64 image is not interchangeable with an Azure-compatible image digest.

## Costs checked October 24, 2026

[Microsoft Retail Prices API](https://prices.azure.com/api/retail/prices) returned eastus USD consumption prices: Basic Registry Unit $0.1666/day; Container Apps Standard vCPU Active Usage $0.000024/vCPU-second; Standard Memory Active Usage $0.000003/GiB-second; Standard Requests $0.40/million. At this replica size, continuously active compute is approximately $1.296/day **before** free grants. Registry base charges continue while the registry exists. Extra storage/build, bandwidth, applicable taxes and other Azure services are separate; local Docker builds avoid paid ACR build tasks.

[Container Apps billing](https://learn.microsoft.com/azure/container-apps/billing) documents subscription-wide monthly grants of 180,000 vCPU-seconds, 360,000 GiB-seconds and two million requests. They are not an assertion of zero cost for this account. Actual usage/availability and invoice currency can differ. Replica limits are not a monetary spending cap. Preserve the existing trial spending protection and never convert to PAYG. No billable resource has been created by this preparation.

## Local validation and later authorized sequence

```sh
az bicep build --file infra/viewer.bicep --outfile /tmp/matchpulse-viewer-arm.json
docker build --platform linux/amd64 -f Dockerfile.viewer -t matchpulse-viewer:step3d-amd64 .
```

After explicit approval, first inspect active subscription, trial protection, provider registration and existing conflicting names. Register required providers only within the approved scope. Deploy with empty imageDigest to bootstrap the registry/environment/identity. Sign into the private registry through existing Entra CLI authentication, push the **tested** amd64 image without exposing passwords, capture its registry digest, then deploy the same template with imageDigest=sha256:… . Do not substitute a mutable tag or public placeholder image. Compilation and local tests do not establish Azure deployment success or quota.

After provisioning, verify actual HTTPS host equals the allowlist, source fingerprints and image digest; run all browser checks against that URL, confirm health/cold startup, and document the deployed resources/cost state. Keep the project available for judging. A later authorized cleanup should remove only the named viewer app/environment/registry/identity and its scoped role, preserving the original Foundry resources. No automatic cleanup or continued monitoring is promised here.

References: [Container App ARM schema](https://learn.microsoft.com/en-us/azure/templates/microsoft.app/2024-03-01/containerapps), [managed-identity image pulls](https://learn.microsoft.com/azure/container-apps/managed-identity-image-pull), and [AcrPull role](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles/containers#acrpull).
