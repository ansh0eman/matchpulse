"""No provider calls: fake HTTP transport proves the one-shot billing boundary."""

import asyncio
from pathlib import Path
import runpy
import importlib
import pytest

pytest.importorskip(
    "httpx2", reason="Capture guard requires isolated Foundry SDK transport"
)


@pytest.mark.parametrize("module_name", ["httpx", "httpx2"])
def test_capture_stops_before_thirteenth_model_http_request(module_name):
    httpx = importlib.import_module(module_name)
    namespace = runpy.run_path(
        str(Path(__file__).resolve().parents[2] / "scripts/capture_foundry.py")
    )
    budget = namespace["ModelRequestBudget"]()
    exceeded = namespace["CaptureBudgetExceeded"]
    received = []

    def fake(request):
        received.append(request.url.path)
        return httpx.Response(200, json={"fixture": True})

    original = httpx.AsyncClient._send_single_request

    async def exercise():
        async with httpx.AsyncClient(transport=httpx.MockTransport(fake)) as client:
            with budget.enforce():
                for _ in range(12):
                    await client.post("https://example.invalid/responses")
                with pytest.raises(exceeded):
                    await client.post("https://example.invalid/chat/completions")

    asyncio.run(exercise())
    assert len(received) == len(budget.requests) == 12
    assert httpx.AsyncClient._send_single_request is original
