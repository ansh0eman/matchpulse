# Zero-out-of-pocket hosting decision

Inspected October 24, 2026. This is a read-only hosting audit, not a deployment record. The user's latest release authorization permits an audited public release with **₹0 maximum out-of-pocket cost**, existing protected trial credits, no PAYG conversion and no new paid inference. The earlier Basic Container Registry proposal is superseded.

## Decision

Use **Azure Container Apps Consumption with an audited public GHCR image**, using the existing protected trial subscription for any eligible usage beyond free grants. Keep the existing tested Python source-recomputation service and same-origin React build in one image. Do not create Basic ACR, a registry-pull identity, an AcrPull assignment, Log Analytics, a database, a custom VNet, a dedicated workload profile or another model resource.

This is a conditional release choice, not an assertion that hosting has been deployed or is always free. Private product acceptance, exact image/source audit, resource availability, protected-subscription recheck and public HTTPS acceptance remain deployment gates. Credit exhaustion can disable the service, so available credit must be checked through judging; no free plan or trial establishes an uptime SLA.

## Account facts actually observed

Only non-sensitive fields are recorded here. No subscription/account/object identifiers, billing addresses, tokens or credentials belong in release evidence.

| Read-only check | Observed result |
|---|---|
| ARM subscription policy, API 2022-12-01 | State `Enabled`; quota ID `FreeTrial_2014-09-01`; `subscriptionPolicies.spendingLimit` **`On`** |
| Billing agreement/status | Microsoft Customer Agreement; billing account active; billing subscription active |
| Billing-profile credit summary, API 2026-06-01 | Current and estimated balances both **USD 200.00**; expired credit USD 0.00 |
| Credit lot, API 2024-08-01 | Source **Azure sign-up credit**; original amount USD 200.00; reported closed balance USD 200.00 |
| Actual credit validity | **2026-10-23 09:46:19 UTC → 2026-11-22 09:46:19 UTC** |
| Required judging access | Through November 10, 2026, inside the observed credit-validity window |

Credit balances are the API's reported values, not a claim of zero prior model usage: billing can lag. The billing-profile credit summary and lot were retrieved successfully. An initial subscription-scoped credit URL returned 404; an optional available-balances URL returned 403. Neither failed query is used as evidence of no credits. No resources, role assignments, providers, plan settings or billing settings were changed during this audit.

Microsoft documents that the [Azure spending limit](https://learn.microsoft.com/en-us/azure/cost-management-billing/manage/spending-limit) prevents eligible usage beyond the credit allowance by disabling services. It is distinct from an alert or replica limit. Some Marketplace/external services, licenses and support plans can incur separate charges despite that setting. The chosen configuration must use only first-party eligible Container Apps compute/requests, an independently free public registry, and our own application image; no marketplace offer, support purchase, paid license or upgrade is permitted.

## Alternatives compared

| Option | Budget and compatibility evidence | Decision |
|---|---|---|
| **A. Static Web Apps Free + managed functions** | Free static hosting has quotas; exceeding them stops service rather than making the static site unlimited. Managed APIs support HTTP and a 45-second maximum request. The current official runtime table lists Python through 3.11; this repository targets Python 3.12. Preserving the current verifier would require a separately tested compatibility/ASGI-functions packaging change. Bring-your-own backend integration requires Standard. | Defer. A cheap static frontend alone does not preserve the Python Proof Lens. Do not claim current code is compatible without testing. |
| **B. Container Apps Consumption + public GHCR** | Uses the already tested AMD64 container at 0.5 vCPU/1 GiB. Scale-to-zero and subscription-wide free grants reduce consumption. GHCR container storage and bandwidth are currently free under GitHub's official policy; public images permit anonymous pulls. No ACR base charge or pull identity is necessary. | **Selected**, backed by protected unexpired trial credit for eligible overage. |
| **C. Completely free alternative** | Vercel Hobby is a personal/non-commercial free plan with usage pauses, but migrating the current source-verifying ASGI service requires separate bundle/runtime testing. Render Free sleeps after 15 minutes and has quota/overage conditions; its current account/payment state was not inspected. Current Hugging Face documentation says creating Docker compute Spaces requires a paid plan; old “free Docker Space” advice is unsuitable. | Retain Vercel/Render only as unvalidated contingency leads. No paid Hugging Face plan or new hosting account was created. |
| **D. Protected existing Azure trial** | The actual ARM policy and billing credit lot above establish current protection and expiry beyond judging. Eligible first-party charges consume credit; exhausting it can interrupt access. | Budget backstop for B. Never remove the limit, convert to PAYG, add a card or claim free grants alone are a hard cap. |

Primary references: [Static Web Apps pricing](https://azure.microsoft.com/en-us/pricing/details/app-service/static/), [API constraints](https://learn.microsoft.com/en-us/azure/static-web-apps/apis-overview), [managed runtime table](https://learn.microsoft.com/en-us/azure/static-web-apps/languages-runtimes), [GitHub Packages billing](https://docs.github.com/en/billing/concepts/product-billing/github-packages), [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Render Free](https://render.com/docs/free), [Hugging Face Spaces](https://huggingface.co/docs/hub/spaces-overview).

## Allowances, costs and availability

[Container Apps billing](https://learn.microsoft.com/en-us/azure/container-apps/billing) provides monthly subscription-wide grants of 180,000 vCPU-seconds, 360,000 GiB-seconds and two million requests. At 0.5 vCPU/1 GiB, both compute grants correspond to approximately **100 allocated replica-hours** if otherwise unused. Their remaining account-specific allocation was **not** independently established by the credit query. Scale-to-zero consumes no replica compute; scale-up and requests consume resources.

The earlier eastus retail-price inspection recorded active vCPU at USD 0.000024/vCPU-second, memory at USD 0.000003/GiB-second and requests at USD 0.40/million. That replica continuously active costs approximately USD 1.296/day before grants. This is a planning estimate, excludes other usage, and is not a user cash commitment or a monetary cap. The observed USD 200 credit is substantially larger than the compute-only judging-window estimate, but future traffic and credit consumption remain variable. No model calls occur in public viewer endpoints.

To reduce interruption risk, retain 0–1 replica, one active revision, only Consumption, no paid network/logging add-ons, and the exact 1 GiB memory candidate. The locally warmed viewer used about 650 MiB; a 512 MiB “free” host is not a safe substitute without a new memory test. Record the actual cloud cold start and exact source/image fingerprints. Keep the app and image available through November 10; do not delete or expire the release immediately after submission.

## Read-only recheck and release gates

The parent execution agent owns deployment. Before any mutation, recheck the active subscription's policy without printing account details:

```sh
subscription_id=$(az account show --query id --output tsv)
az rest --method get \
  --url "https://management.azure.com/subscriptions/${subscription_id}?api-version=2022-12-01" \
  --query '{state:state,offer:subscriptionPolicies.quotaId,spendingLimit:subscriptionPolicies.spendingLimit}'
```

Use the billing profile associated with that subscription for the following successful API patterns. The profile resource ID stays local; persist only allowlisted balances/validity fields:

```text
GET {billingProfileResourceId}/providers/Microsoft.Consumption/credits/balanceSummary?api-version=2026-06-01
GET {billingProfileResourceId}/providers/Microsoft.Consumption/lots?api-version=2024-08-01
```

See [credit summary API](https://learn.microsoft.com/en-us/rest/api/consumption/credits/get?view=rest-consumption-2026-06-01) and [Microsoft's credit-balance procedure](https://learn.microsoft.com/en-us/azure/cost-management-billing/benefits/credits/mca-check-azure-credits-balance). Suppress raw CLI error bodies because authorization errors can contain account identifiers.

After product acceptance and the public-source/data/license/history audit:

1. Publish only the reviewed immutable AMD64 image to **public GHCR**, using an existing authorized GitHub mechanism or a standard no-charge public-repository workflow. Do not create a PAT, enable a paid Actions runner or purchase package capacity merely to bypass an access issue. Confirm anonymous manifest access and record its digest.
2. Replace the earlier ACR/identity template with a Container Apps environment/app using that public digest, no identity/registry secret, no paid add-ons and the chosen limits. Compile and inspect the exact template. Resource/provider quota must be observed, not assumed.
3. Deploy only while `FreeTrial` + `spendingLimit: On` + valid credit remain confirmed. Stop if Azure demands PAYG, a payment method, a paid marketplace plan or removal of the limit. Use the free alternative only after its own real acceptance testing.
4. Verify the final HTTPS health, source recomputation, exact source hashes, all laptop/mobile interactions, original Foundry/fallback labels and cold startup. Public code/image alone is not a functioning demo.
5. Record the live URL, resource/image identity without secrets, billing protection, validity and actual submission confirmation in final-submission evidence. Recheck available credit/access during the judging period using supported monitoring; an alert is not a cap.

This audit establishes a protected **₹0 out-of-pocket route currently available**, subject to the explicit release gates. It does not establish deployment success, unused free allowances, future uptime or a finished submission.
