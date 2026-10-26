"""Loopback API. No uploads, caller paths, model calls, credentials or public MCP."""

import json
import os
import asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.staticfiles import StaticFiles
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import ValidationError
from .schemas import ViewQuery, Question, PlaybackQuery
from .playback import segment
from .service import catalog, view, question, activity
from .proof import receipt


# Process-lifetime, single analytical worker. Source loading and verification
# remain serialized to preserve the one-large-match memory budget. The stdlib
# executor joins this worker at process exit; no provider/client lives here.
_analysis_worker = ThreadPoolExecutor(max_workers=1, thread_name_prefix="viewer-analysis")


async def analytical(function, *args):
    return await asyncio.get_running_loop().run_in_executor(
        _analysis_worker, partial(function, *args)
    )


async def dispatch(request: Request):
    try:
        path = request.url.path
        if path == "/api/health":
            result = {"status": "ok", "mode": "local source-verified replay"}
        elif path == "/api/scenarios":
            result = catalog()
        elif path == "/api/activity":
            result = await analytical(activity)
        elif path == "/api/playback":
            result = await analytical(segment, PlaybackQuery.model_validate(dict(request.query_params)))
        elif path == "/api/ask":
            body = bytearray()
            async for chunk in request.stream():
                if len(body) + len(chunk) > 4096:
                    raise ValueError("Request too large")
                body.extend(chunk)
            result = await analytical(question, Question.model_validate_json(bytes(body)))
        else:
            params = dict(request.query_params)
            claim = params.pop("claim_id", None)
            query = ViewQuery.model_validate(params)
            result = await analytical(receipt, query, claim) if path == "/api/proof" else await analytical(view, query)
        return JSONResponse(
            result,
            headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
        )
    except KeyError:
        return JSONResponse(
            {"error": "Unknown scenario or source reference"}, status_code=404
        )
    except (ValidationError, ValueError, json.JSONDecodeError):
        return JSONResponse(
            {"error": "Invalid or unavailable match, clock, claim or question"},
            status_code=400,
        )
    except OSError:
        return JSONResponse(
            {"error": "Declared source unavailable. Restore the documented fixtures."},
            status_code=503,
        )


class SecurityHeaders(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers.update(
            {
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "Referrer-Policy": "no-referrer",
                "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
            }
        )
        if os.environ.get("MATCHPULSE_WEB_DIST"):
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
            )
        return response


app = Starlette(
    routes=[
        Route(p, dispatch, methods=["POST"] if p == "/api/ask" else ["GET"])
        for p in (
            "/api/health",
            "/api/scenarios",
            "/api/view",
            "/api/playback",
            "/api/proof",
            "/api/ask",
            "/api/activity",
        )
    ],
    middleware=[Middleware(SecurityHeaders)],
)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "testserver"]
    + [
        h.strip()
        for h in os.environ.get("MATCHPULSE_ALLOWED_HOSTS", "").split(",")
        if h.strip()
    ],
)
static = os.environ.get("MATCHPULSE_WEB_DIST")
if static:
    app.mount("/", StaticFiles(directory=static, html=True), name="studio")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8010, access_log=False)
