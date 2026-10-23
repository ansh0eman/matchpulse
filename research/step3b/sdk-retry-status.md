# Historical isolated SDK dependency retry — 2026-10-23

**Superseded:** the later isolated SDK installation and validation succeeded. See [SDK validation evidence](artifacts/sdk-integration-validation.json). The failure report below and its JSON are preserved unchanged as evidence of the earlier network restriction.

**BLOCKED: package-download DNS, before compatibility resolution.**

Created `backend/.venv-foundry` successfully using existing CPython3.12.13. Retried installation of the candidate cloud requirements plus editable backend with a separate temporary UV cache. The install exited2 after retries: `pypi.org` could not resolve while fetching `https://pypi.org/simple/pydantic/`. This is not evidence of a package-version conflict; resolution never completed.

No framework, Foundry, MCP, jsonschema, Pydantic or pytest distribution is installed in the isolated environment. Therefore there is no actual SDK version set or transitive compatibility lock to report.

Executed only the three non-provider integration-test gates using the existing analytical environment: SDK-only framework graph, private MCP in-memory integration and external JSON Schema meta-validation. Pytest exited0 with **0 passed,3 skipped**, explicitly because those dependencies are absent. None of these integrations actually executed. No live test was selected, and no provider call, authentication attempt, resource creation, commit, push or deployment occurred.

`backend/uv.lock` remains identical to HEAD (Git blob `cd956650bb555d83b09366c93ad2ca887d0492de`). Frozen tracking/stories sources, configurations and Step2.5/3A artifacts have no changes. Earlier fake-provider artifacts and their provenance were not regenerated or overwritten. The new isolated environment is ignored by Git.

Exact argv/statuses are in [sdk-retry-status.json](artifacts/sdk-retry-status.json). Full local error/test logs: `backend/output/agents/sdk-retry-install.log` and `sdk-retry-checks.log`.

Next prerequisite: restore package-network access in this environment, or use a trusted prepopulated package cache/wheelhouse. Then rerun the isolated install, investigate any actual resolver conflicts without changing the frozen lock, record installed versions and run the SDK-only/MCP/schema tests. Azure project/access is a separate prerequisite for later real model tests; this retry did not attempt those.
