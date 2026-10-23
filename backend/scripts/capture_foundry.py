"""Explicitly authorized one-shot capture; hard cap actual model HTTP requests.

Operator utility only. Never imported by the public viewer or called by tests.
No provider/SDK source is modified; the transport guard exists for this process.
"""

import asyncio
from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
from importlib.metadata import version
import json
import logging
import os
from pathlib import Path
import time

import httpx
import httpx2
from matchpulse.agents.cli import load_source
from matchpulse.agents.config import ProviderConfig
from matchpulse.agents.provider import FoundryProvider
from matchpulse.agents.publication import verify_publication
from matchpulse.agents.schemas import Preferences
from matchpulse.agents.workflow import Studio
from matchpulse.stories.export import agent_input, write_json

ROOT = Path(__file__).resolve().parents[2]


class CaptureBudgetExceeded(RuntimeError):
    pass


class ModelRequestBudget:
    def __init__(self):
        self.limit = 12
        self.requests = []

    @contextmanager
    def enforce(self):
        originals = {
            cls: cls._send_single_request
            for cls in (httpx.AsyncClient, httpx2.AsyncClient)
        }
        budget = self

        async def guarded(client, request):
            original = next(
                method for cls, method in originals.items() if isinstance(client, cls)
            )
            is_model = request.method == "POST" and request.url.path.rstrip(
                "/"
            ).endswith(("/responses", "/chat/completions"))
            row = None
            if is_model:
                if len(budget.requests) >= budget.limit:
                    raise CaptureBudgetExceeded("Authorized model-request cap reached")
                row = {"number": len(budget.requests) + 1, "status_code": None}
                budget.requests.append(row)
            response = await original(client, request)
            if row is not None:
                row["status_code"] = response.status_code
            return response

        for cls in originals:
            cls._send_single_request = guarded
        try:
            yield self
        finally:
            for cls, original in originals.items():
                cls._send_single_request = original


async def capture():
    if os.environ.get("MATCHPULSE_CAPTURE_AUTHORIZED") != "1":
        raise ValueError("Separate explicit capture authorization is required")
    logging.disable(logging.CRITICAL)
    config = ProviderConfig.from_environment()
    events = ROOT / "data/step2/inference/02840f35-cb05-4812-aa9d-1237e4ab1b9d.jsonl"
    result = load_source(events)
    item = next(t for t in result["timeline"] if t.insight.type == "goal_context")
    envelope = agent_input(item.insight, {c.claim_id: c for c in result["claims"]})
    output = ROOT / "backend/output/agents/step3d-authorized-capture"
    output.mkdir(parents=True, exist_ok=False)
    budget = ModelRequestBudget()
    studio = Studio(
        result,
        FoundryProvider(config),
        Preferences(),
        timeout=18,
        retries=0,
        budget_seconds=60,
    )
    started = time.perf_counter()
    metadata = {
        "origin": "foundry",
        "authorized_model_request_limit": budget.limit,
        "started_utc": datetime.now(timezone.utc).isoformat(),
        "model_deployment": config.model,
        "match_id": envelope.match_id,
        "source_sha256": hashlib.sha256(events.read_bytes()).hexdigest(),
        "sdk_versions": {
            n: version(n)
            for n in (
                "agent-framework-core",
                "agent-framework-foundry",
                "azure-ai-projects",
                "azure-identity",
                "httpx",
                "httpx2",
            )
        },
        "cloud_trace_delivery": False,
    }
    try:
        with budget.enforce():
            artifact, state = await studio.run(envelope, item, runtime="framework")
        verified = verify_publication(
            artifact, state, item, result, studio.tools, mode=studio.mode
        )
        assert verified and len(budget.requests) <= 12
        write_json(output / "goal.broadcast.json", artifact.model_dump(mode="json"))
        write_json(output / "goal.state.json", state.model_dump(mode="json"))
        metadata.update(
            source_publication_verified=verified,
            narration_status=artifact.narration_status,
            overlay_status=artifact.overlay_status,
            fully_enriched=artifact.narration_status
            == artifact.overlay_status
            == "enriched",
            successful_tool_calls=sum(
                t["status"] == "success" for t in studio.tools.calls
            ),
        )
    except Exception as exc:
        metadata.update(
            source_publication_verified=False,
            fully_enriched=False,
            failure_code=type(exc).__name__,
        )
    finally:
        write_json(output / "goal.trace.json", studio.trace.export())
        write_json(
            output / "goal.tools.json", studio.tools.calls if studio.tools else []
        )
        write_json(output / "goal.otlp.json", studio.trace.otlp())
        metadata.update(
            model_http_requests=len(budget.requests) if budget.requests else None,
            counter_status="observed" if budget.requests else "not_observed",
            model_http_attempts=budget.requests,
            agent_request_attempts=studio.requests.attempts,
            elapsed_seconds=time.perf_counter() - started,
        )
        write_json(output / "capture.json", metadata)
    print(json.dumps(metadata))


if __name__ == "__main__":
    asyncio.run(capture())
