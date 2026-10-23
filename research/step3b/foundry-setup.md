# Foundry setup — authenticated proof and goal workflow verified

Current integration gate passed. Existing coordination evidence verifies an authenticated structured proof and a complete real Foundry/Agent Framework goal workflow with enriched narration, overlay and model-requested claim/evidence tools. The separately opted-in integration module reports4 passed in29.87s; a separate non-live regression reports159 passed/2 live skips. No tests or paid calls were rerun for this documentation update.

Deployment: `matchpulse-gpt41-mini`, first-party GPT-4.1 mini2025-04-14, project `matchpulse`, AzureCliCredential. Protected FreeTrial and spending-limit On are reported in the coordination management checkpoint, not re-queried here. Preserve that protection: no PAYG conversion, extra provisioning or key export is authorized by this documentation turn. Developer login is not public deployment identity. Non-secret settings remain in the coordination handoff; no credential material was copied here. Minimal proof:4.687s,878 input/136 output tokens, strict structured grounding passed. See artifacts/live-foundry-validation.json and foundry-authenticated-proof.json.

The setup commands below remain reproduction/reference instructions, not a request to recreate existing resources or repeat billed checks. A configured project is available in the coordination environment; a new shell must load its authorized non-secret settings.

## Provision and authorize — reference only; existing setup already works

1. Sign into [Microsoft Foundry](https://ai.azure.com/) using the intended Azure tenant/subscription. Follow [resource/project setup](https://learn.microsoft.com/en-us/azure/foundry/tutorials/quickstart-create-foundry-resources). Choose a region/model available to that subscription; creating resources/deployments can incur charges.
2. Deploy a model supporting Responses inference, JSON structured output and function tools. Copy its DEPLOYMENT name; do not assume a catalog model name is the deployed identifier.
3. Copy the project endpoint shaped `https://RESOURCE.services.ai.azure.com/api/projects/PROJECT`. This implementation currently allowlists that commercial-cloud hostname shape. No keys are required in the app.
4. Subscription administrator: grant the developer Foundry User at the appropriate project scope, with account-scope inference permissions if the chosen model deployment requires them. Deployment management requires additional control-plane permissions; project access alone is not deployment authority. Current [RBAC guidance](https://learn.microsoft.com/azure/ai-foundry/concepts/rbac-ai-foundry) explains the recently renamed roles; do not substitute Azure AI Developer, which applies to different resources. Use portal IAM and least privilege rather than copying an unverified role GUID.
5. Install Azure CLI from Microsoft's supported installer, then authenticate locally:

```sh
az login
az account set --subscription 'YOUR_SUBSCRIPTION_ID'
export FOUNDRY_PROJECT_ENDPOINT='https://YOUR_RESOURCE.services.ai.azure.com/api/projects/YOUR_PROJECT'
export FOUNDRY_MODEL='YOUR_DEPLOYMENT_NAME'
```

Do not paste tokens/keys into chat or commit credentials. Shell variables are sufficient; .env files are ignored and not automatically loaded by this client. Confirm role propagation and model quota in the portal. A403 may mean missing data-plane permissions even if resource management works.

## Installed and validated isolated SDK environment

Keep the frozen analytical environment intact:

```sh
uv venv --python 3.12 backend/.venv-foundry
uv pip install --python backend/.venv-foundry/bin/python -e 'backend[dev]' -r backend/src/matchpulse/agents/requirements-cloud.txt
MATCHPULSE_LIVE_TEST=0 MATCHPULSE_LIVE_WORKFLOW_TEST=0 backend/.venv-foundry/bin/python -m pytest backend/tests -q -ra
```

Installation and this non-provider full-suite run completed in the coordination execution environment; logs were verified for this documentation update without rerunning the suite. Result:159 passed,2 skipped in29.19s. Core1.23.0, Foundry1.15.0, MCP2.3.0, jsonschema4.25.1, azure-identity1.26.0, azure-ai-projects2.7.0, agent-framework-openai1.17.0, openai3.37.0, pytest8.4.2 coexist with unchanged Pydantic2.12.3. SDK graph/FakeProvider, MCP in-memory and external schema checks passed. Exact inventory and evidence hashes are in artifacts/sdk-integration-validation.json and sdk-environment-inventory.json. The frozen backend/uv.lock is unchanged; no cross-platform reproducibility or live provider compatibility is inferred from this environment snapshot.

First genuine proof against a replayed real source:

```sh
backend/.venv-foundry/bin/python -m matchpulse.agents.cli proof --events data/step2/inference/02840f35-cb05-4812-aa9d-1237e4ab1b9d.jsonl --insight-type goal_context --output backend/output/agents/live-proof.json
```

Optional `--saved-envelope FILE` requires an exact saved Step3A AgentInput matching that incident; a whole agent-inputs array must first be reduced to its one selected object. The proof uses unchanged AgentOutput v1 and grounded_response, recording deployment, installed SDK versions, latency, available usage and validation only AFTER success. Project endpoint/authentication secrets are not exported. SDK-managed wire API version and transport retries need inspection during live proof; no hand-invented api-version is passed.

Then execute the real graph:

```sh
backend/.venv-foundry/bin/python -m matchpulse.agents.cli studio --events data/step2/inference/02840f35-cb05-4812-aa9d-1237e4ab1b9d.jsonl --insight-type goal_context --provider foundry --runtime framework --output backend/output/agents/live-goal.json
MATCHPULSE_LIVE_TEST=1 backend/.venv-foundry/bin/python -m pytest backend/tests/agents/test_optional_integrations.py::test_real_foundry_minimal_proof -q
```

The opt-in test makes a real potentially billed request. Main offline suite never does. Foundry CLI refuses to silently use the offline runtime. Authentication/SDK failure yields explicit errors or deterministic fallback; it never becomes a successful Foundry claim.

Later hosting: switch explicitly to a managed identity credential and scoped RBAC; configure Application Insights with approved non-prompt telemetry. No hosting, telemetry resource or service agent has been deployed.

After the proof succeeds, the separately opted-in full integration test must observe real framework execution and model-requested tool resolution:

```sh
MATCHPULSE_LIVE_WORKFLOW_TEST=1 backend/.venv-foundry/bin/python -m pytest backend/tests/agents/test_optional_integrations.py::test_real_foundry_framework_and_tool_use -q
```

This makes several real requests, including specialist/challenger/narrator/producer. Do not conflate the minimal proof, SDK-only fake-provider graph test and full authenticated workflow test.


Provider compatibility repair: FoundryChatClient is not used as an async context manager. provider.py manages AIProjectClient with async context, then constructs FoundryChatClient(project_client=project, model=...). Exact fractional evidence clocks, required route budget, narrator qualification and Challenger consistency remain enforced by deterministic validators; instructions now communicate those constraints, with studio response max_tokens1024. Preserve this uncommitted repair.
