"""Per-incident typed stages; SDK adapter and offline harness share the same stages."""
import asyncio
from .schemas import WorkflowState,BroadcastArtifact,Narration,Sentence
from .policy import default_director,default_narration,default_overlay,category,expensive,eligible
from .grounding import validate_envelope,validate_director,validate_analysis,validate_challenge
from .narrative_compiler import compile_narration
from .overlay_compiler import compile_overlay
from .runtime import Requests
from .provider import ProviderFailure
from .tools import EvidenceTools
from .telemetry import Trace

class Studio:
    def __init__(self,result,provider,preferences,timeout=12,retries=1,budget_seconds=35):
        self.result=result;self.provider=provider;self.preferences=preferences
        self.trace=Trace();self.requests=Requests(provider,self.trace,timeout,retries,budget_seconds=budget_seconds)
        self.tools=None;self.mode='adaptive'
    async def direct(self,state):
        decision=default_director(state.envelope);errors=state.errors
        try:
            value=await self.requests.invoke('director',state,self.tools)
            decision=validate_director(value,state.envelope)
            self.requests.max_calls=decision.max_calls
        except (ProviderFailure,ValueError) as exc:
            errors+=('director:'+getattr(exc,'code','invalid_route'),);self.trace.record('director','fallback',errors[-1])
        self.trace.record('director','route',','.join(decision.specialists))
        return state.model_copy(update={'director':decision,'errors':errors})
    async def specialists(self,state):
        async def one(role):
            try:
                value=await self.requests.invoke(role,state,self.tools)
                validate_analysis(value,state.envelope,self.tools,role)
                self.trace.record(role,'verified_handoff');return value,None
            except (ProviderFailure,ValueError) as exc:return None,role+':'+getattr(exc,'code','invalid_analysis')
        roles=state.director.specialists if self.mode=='adaptive' else state.director.specialists[:1]
        results=await asyncio.gather(*(one(role) for role in roles))
        return state.model_copy(update={'analyses':tuple(v for v,e in results if v),
            'errors':state.errors+tuple(e for v,e in results if e)})
    async def challenge(self,state):
        if not state.director.challenge or self.mode!='adaptive':return state
        try:
            value=await self.requests.invoke('challenger',state,self.tools)
            validate_challenge(value,state.envelope,self.tools)
            self.trace.record('challenger','review',value.disposition)
            return state.model_copy(update={'challenge':value})
        except (ProviderFailure,ValueError) as exc:
            return state.model_copy(update={'errors':state.errors+('challenger:'+getattr(exc,'code','invalid_challenge'),)})
    async def presentation(self,state):
        # Isolated concurrent branches; either can fail without invalidating the other.
        async def one(role):
            if role=='narrator' and ((state.challenge and state.challenge.disposition=='fallback') or any(e.startswith('challenger:') for e in state.errors)):
                return None,'narrator:challenge_fallback'
            if role=='replay_producer' and self.mode=='simple':return None,None
            try:return await self.requests.invoke(role,state,self.tools),None
            except ProviderFailure as exc:return None,role+':'+exc.code
        n,p=await asyncio.gather(one('narrator'),one('replay_producer'))
        if n[0] and state.challenge and state.challenge.disposition=='narrow':
            n=(n[0].model_copy(update={'angle':'evidence_first','hook':'evidence'}),n[1])
            self.trace.record('narrator','challenge_revision','narrowed_to_evidence')
        return state.model_copy(update={'narration_plan':n[0],'overlay_plan':p[0],
            'errors':state.errors+tuple(x for x in (n[1],p[1]) if x)})
    def publish(self,state,item):
        e=state.envelope;errors=state.errors;nstatus='enriched' if state.narration_plan else 'fallback'
        ostatus='enriched' if state.overlay_plan else 'fallback'
        try:
            narration=compile_narration(state.narration_plan or default_narration(e,state.preferences),e,self.tools,state.preferences)
        except ValueError:
            errors+=('narrator:grounding_failed',);nstatus='fallback'
            narration=compile_narration(default_narration(e,state.preferences),e,self.tools,state.preferences)
        if self.mode=='fallback':
            narration=Narration(headline=e.insight.fallback.headline,
                sentences=(Sentence(text=e.insight.fallback.explanation,claim_ids=e.insight.claim_ids),),limitations=e.insight.limitations)
        try:overlay=compile_overlay(state.overlay_plan or default_overlay(e),e,self.tools)
        except (ValueError,KeyError):
            errors+=('replay_producer:grounding_failed',);ostatus='fallback'
            try:overlay=compile_overlay(default_overlay(e),e,self.tools)
            except (ValueError,KeyError):overlay=None;ostatus='unavailable'
        claims=tuple(self.tools.claims[cid] for cid in e.insight.claim_ids)
        # Final re-verification includes deterministic re-rendering, not a keyword blacklist.
        validate_envelope(e,self.result)
        if self.mode!='fallback':
            expected_plan=state.narration_plan if nstatus=='enriched' else default_narration(e,state.preferences)
            if narration!=compile_narration(expected_plan,e,self.tools,state.preferences):raise ValueError('Final narration mutation')
        if overlay and overlay!=compile_overlay(overlay.plan,e,self.tools):raise ValueError('Final overlay mutation')
        for c in claims:
            if not self.result['index'].verify(c):raise ValueError('Final claim verification failed')
        succeeded=any(t.event=='request_succeeded' for t in self.trace.events)
        self.trace.record('publisher','artifact_verified')
        return BroadcastArtifact(match_id=e.match_id,insight_id=e.insight.insight_id,
            source_seconds=e.insight.event_time_seconds,available_seconds=e.insight.as_of_seconds,
            presented_seconds=item.presented_at_seconds,preferences=state.preferences,
            claim_ids=e.insight.claim_ids,category=category(e.insight.type),angle=state.narration_plan.angle if state.narration_plan and nstatus=='enriched' else 'evidence_first',
            narration=narration,overlay=overlay,evidence=e.insight.evidence,trace_id=state.trace_id,
            origin=self.provider.origin if succeeded else 'deterministic',narration_status=nstatus,overlay_status=ostatus,errors=errors)
    async def run(self,envelope,item,mode='adaptive',runtime='offline'):
        if mode not in ('fallback','simple','adaptive'):raise ValueError('Unknown orchestration mode')
        validate_envelope(envelope,self.result)
        if not eligible(item,self.preferences):raise ValueError('Audience policy suppresses this routine incident')
        if item.insight!=envelope.insight or item.presented_at_seconds<item.insight.as_of_seconds:raise ValueError('Untrusted timeline item')
        if not any(item==t for t in self.result['timeline']):raise ValueError('Only scheduler-approved incidents may be enriched')
        self.trace.match_id=envelope.match_id;self.trace.insight_id=envelope.insight.insight_id
        self.mode=mode;self.tools=EvidenceTools(self.result,envelope.match_id,envelope.insight.as_of_seconds)
        state=WorkflowState(envelope=envelope,preferences=self.preferences,trace_id=self.trace.trace_id)
        self.trace.record('editorial','accepted')
        if mode=='fallback' or (mode=='adaptive' and not expensive(envelope.insight)):
            self.mode='fallback';self.trace.record('editorial','deterministic_bypass');return self.publish(state,item),state
        if runtime=='framework':
            from .framework import run_graph
            return await run_graph(self,state,item)
        if runtime!='offline':raise ValueError('Unknown workflow runtime')
        # Offline harness is deliberately not called Microsoft Agent Framework execution.
        self.trace.record('runtime','offline_harness')
        if mode=='adaptive':state=await self.direct(state)
        else:state=state.model_copy(update={'director':default_director(envelope)})
        state=await self.specialists(state);state=await self.challenge(state)
        state=await self.presentation(state)
        return self.publish(state,item),state
