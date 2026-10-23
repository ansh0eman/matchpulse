"""Bounded requests, strict output parsing, run-local idempotent success cache."""
import asyncio,hashlib,time,math
from .provider import MODELS,ProviderFailure
class Requests:
    def __init__(self,provider,trace,timeout=12,retries=1,max_calls=6,budget_seconds=35):
        if not (math.isfinite(timeout) and 0<timeout<=30 and math.isfinite(budget_seconds) and 0<budget_seconds<=60 and retries in (0,1) and 1<=max_calls<=6):raise ValueError('Invalid bounded request configuration')
        self.provider=provider;self.trace=trace;self.timeout=timeout;self.retries=retries;self.max_calls=max_calls
        self.deadline=time.monotonic()+budget_seconds;self.attempts=0;self.logical_calls=0;self.cache={};self.inflight={};self.disabled=False
    async def invoke(self,role,state,tools):
        key=hashlib.sha256((role+state.model_dump_json()).encode()).hexdigest()
        if key in self.cache:return self.cache[key]
        if key in self.inflight:return await self.inflight[key]
        task=asyncio.create_task(self._invoke(role,state,tools,key))
        self.inflight[key]=task
        try:return await task
        finally:self.inflight.pop(key,None)
    async def _invoke(self,role,state,tools,key):
        if self.logical_calls>=self.max_calls or self.disabled:raise ProviderFailure('request_budget_or_disabled')
        self.logical_calls+=1
        for attempt in range(self.retries+1):
            remaining=self.deadline-time.monotonic()
            if remaining<=0:raise ProviderFailure('workflow_deadline')
            self.attempts+=1;self.trace.record(role,'request_started')
            try:
                with self.trace.span('agent.'+role):
                    raw,usage=await asyncio.wait_for(self.provider.complete(role,state,tools,key),min(self.timeout,remaining))
                value=MODELS[role].model_validate_json(raw)
                self.cache[key]=value;self.trace.record(role,'request_succeeded',usage=usage)
                return value
            except asyncio.TimeoutError:failure=ProviderFailure('timeout',True)
            except ProviderFailure as exc:failure=exc
            except (ValueError,TypeError,KeyError):failure=ProviderFailure('invalid_output_or_tool')
            self.trace.record(role,'request_failed',failure.code)
            if failure.code in ('auth','sdk_unavailable','unavailable'):self.disabled=True
            if not failure.transient or attempt==self.retries:raise failure
            self.trace.record(role,'retry',failure.code);await asyncio.sleep(min(.05,max(0,self.deadline-time.monotonic())))
