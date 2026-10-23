"""Small async transport boundary; offline fake is never described as Foundry."""
import asyncio,json
from typing import Protocol
from .schemas import DirectorDecision,Analysis,Challenge,NarrationPlan,OverlayPlan
from .policy import default_director,default_narration,default_overlay,category

MODELS={'director':DirectorDecision,'match_analyst':Analysis,'tactical_analyst':Analysis,
        'challenger':Challenge,'narrator':NarrationPlan,'replay_producer':OverlayPlan}
INSTRUCTIONS={
'director':'Select an editorial angle and specialist route for verified facts. Use match_analyst for events, tactical_analyst for approved line facts, both only for mixed facts. Set challenge true for positioning, multiple claims, or insight.priority >= 95. Set max_calls to 6 so all required stages fit. Never change the source facts.',
'match_analyst':'Select approved event claims and relevant referenced evidence. Explain score, observed actions or same-possession sequences using the allowed category. Retrieve a claim and its evidence with scoped tools. No xG, assist, possession percentage or causal press inference.',
 'tactical_analyst':'Select only approved line-height claims. Retrieve a claim and sample source frame through scoped tools. Interpret the three-deepest-outfielder proxy in sampled opponent build-up. Do not infer back four, coach intent or effective pressing.',
'challenger':'Challenge interpretation and scope. Use objections to narrow sampled position or association. Another model is not proof. Do not reject source arithmetic merely for narrative preference. Return accept/narrow/fallback and affected approved IDs. If objections is nonempty, disposition must be narrow or fallback. An accept disposition requires an empty objections list. Unsupported possibilities explicitly excluded by an analyst are limitations, not claims the analyst is making.',
'narrator':'Choose a controlled narrative plan. Fan requires brief depth, analyst detailed depth. Choose a useful hook and angle with all primary claims. Use sampled qualifier for line positions, association for regain-to-shot, synthetic otherwise. Do not generate factual prose or numbers.',
'replay_producer':'Choose a supported visual family for approved facts: goal scoreline_change; regain-to-shot regain_to_shot; shot/outcome shot_sequence; activity rolling_activity; position positional_comparison; other event_location. Select claim IDs, not invented coordinates or metrics.'}

class ProviderFailure(Exception):
    def __init__(self,code,transient=False):super().__init__(code);self.code=code;self.transient=transient
class Provider(Protocol):
    origin:str
    async def complete(self,role,state,tools,correlation):...

class FakeProvider:
    """Deterministic scripted CI transport. No claims about language-model reasoning."""
    origin='offline_fake'
    def __init__(self,faults=None,delay=0.):self.faults=faults or {};self.calls=[];self.delay=delay
    async def complete(self,role,state,tools,correlation):
        self.calls.append({'role':role,'correlation':correlation});await asyncio.sleep(self.delay)
        fault=self.faults.get(role)
        if fault=='timeout':await asyncio.sleep(60)
        if fault in ('auth','rate_limit','unavailable'):raise ProviderFailure(fault,fault=='rate_limit')
        if fault=='malformed':return '{broken',{}
        if fault=='unsupported_tool':tools.invoke('read_file',{'path':'private'})
        e=state.envelope;p=state.preferences;ids=tuple(c.claim_id for c in e.claims)
        if role=='director':value=default_director(e)
        elif role in ('match_analyst','tactical_analyst'):
            chosen=tuple(c for c in e.claims if (c.type=='observed_line_height_change')==(role=='tactical_analyst'))
            if not chosen:raise ProviderFailure('missing_specialist_input')
            c=chosen[0]
            tools.resolve_claim(match_id=e.match_id,claim_id=c.claim_id,as_of_seconds=e.insight.as_of_seconds)
            r=c.references[-1]
            tools.resolve_evidence(match_id=r.match_id,category=r.category,source_id=r.source_id,as_of_seconds=e.insight.as_of_seconds)
            value=Analysis(claim_ids=tuple(c.claim_id for c in chosen),category=category(e.insight.type),
                requested_evidence=tuple(r for c in chosen for r in c.references[:1]),limitation_codes=('synthetic',),
                unsupported_possibilities=('coach_intent','causal_press'))
        elif role=='challenger':value=Challenge(affected_claim_ids=ids,objections=('narrow_scope',) if e.insight.type=='observed_line_height_change' else (),disposition='narrow' if e.insight.type=='observed_line_height_change' else 'accept')
        elif role=='narrator':value=default_narration(e,p,state.director.angle if state.director else 'evidence_first').model_copy(update={'hook':'evidence' if p.audience=='analyst' else 'replay'})
        else:value=default_overlay(e)
        raw=value.model_dump(mode='json')
        if fault=='unknown_claim':raw['claim_ids']=['unregistered']
        elif fault=='cross_match' and 'requested_evidence' in raw:
            raw['requested_evidence'][0]['match_id']='00000000-0000-4000-8000-000000000000'
        elif fault=='causal_prose':raw['headline']='The manager caused the goal'
        elif fault=='objection' and role=='challenger':raw.update(disposition='fallback',objections=['unsupported_causality'])
        elif fault=='wrong_overlay':raw['family']='positional_comparison' if raw.get('family')!='positional_comparison' else 'scoreline_change'
        return json.dumps(raw),{}  # Fake token usage is unknown, never fabricated.

class FoundryProvider:
    origin='foundry'
    def __init__(self,config):self.config=config
    async def complete(self,role,state,tools,correlation):
        try:
            from agent_framework import Agent
            from agent_framework.foundry import FoundryChatClient
            from azure.identity.aio import AzureCliCredential
            from azure.ai.projects.aio import AIProjectClient
        except ImportError as exc:raise ProviderFailure('sdk_unavailable') from exc
        try:
            # Fresh credential/client/agent per request: no cross-match conversation memory.
            async with AzureCliCredential() as credential:
                async with AIProjectClient(endpoint=self.config.endpoint,credential=credential) as project:
                    client=FoundryChatClient(project_client=project,model=self.config.model)
                    clock=state.envelope.insight.as_of_seconds
                    instructions=(INSTRUCTIONS[role]+f' The active evidence clock is exactly {clock!r} seconds. '
                        'Use that exact as_of_seconds for tool requests; never round it. '
                        'Copy the complete match ID, claim IDs and source IDs from envelope.claims. '
                        'For a specialist, call resolve_claim once and resolve_evidence once using its reference, then return the structured plan. '
                        'Include synthetic in analysis limitation_codes. Do not repeat successful lookups.')
                    if role=='narrator':
                        required=default_narration(state.envelope,state.preferences)
                        instructions+=f' For this incident, qualification must be {required.qualification} and depth must be {required.depth}; a challenger narrowing does not change these fields.'
                    async with Agent(client=client,name=role,instructions=instructions,
                        tools=tools.sdk_functions() if role in ('match_analyst','tactical_analyst','challenger') else []) as agent:
                        response=await agent.run(state.model_dump_json(),options={'response_format':MODELS[role],'max_tokens':1024})
                        value=response.value
                        raw=value.model_dump_json() if hasattr(value,'model_dump_json') else json.dumps(value) if value is not None else response.text
                        usage=response.usage_details if hasattr(response,'usage_details') else None
                        safe_usage={k:usage.get(k) for k in ('input_token_count','output_token_count')} if isinstance(usage,dict) else {}
                        return raw,safe_usage
        except Exception as exc:
            # Never expose raw provider body, headers, tokens, endpoint or prompts.
            name=type(exc).__name__;status=getattr(exc,'status_code',None)
            if status in (401,403) or 'Authentication' in name or 'Credential' in name:raise ProviderFailure('auth') from None
            if status==429:raise ProviderFailure('rate_limit',True) from None
            if status in (408,500,502,503,504) or 'Timeout' in name:raise ProviderFailure('transient',True) from None
            raise ProviderFailure('provider_error') from None

    async def proof(self,envelope):
        """Mandatory minimal authenticated call using the unchanged Step3A contract."""
        from ..stories.schemas import AgentOutput
        try:
            from agent_framework import Agent
            from agent_framework.foundry import FoundryChatClient
            from azure.identity.aio import AzureCliCredential
            from azure.ai.projects.aio import AIProjectClient
        except ImportError as exc:raise ProviderFailure('sdk_unavailable') from exc
        try:
            async with AzureCliCredential() as credential:
                async with AIProjectClient(endpoint=self.config.endpoint,credential=credential) as project:
                    client=FoundryChatClient(project_client=project,model=self.config.model)
                    async with Agent(client=client,name='matchpulse-foundry-proof',instructions='Return the exact match_id and insight_id; select the registered claim IDs and deterministic_fallback template. Do not invent fields.') as agent:
                        response=await agent.run(envelope.model_dump_json(),options={'response_format':AgentOutput})
                        value=response.value
                        usage=getattr(response,'usage_details',None)
                        safe_usage={k:usage.get(k) for k in ('input_token_count','output_token_count')} if isinstance(usage,dict) else {}
                        return value.model_dump_json() if hasattr(value,'model_dump_json') else json.dumps(value),safe_usage
        except Exception as exc:
            name=type(exc).__name__;status=getattr(exc,'status_code',None)
            code='auth' if status in (401,403) or 'Credential' in name or 'Authentication' in name else 'provider_error'
            raise ProviderFailure(code) from None
