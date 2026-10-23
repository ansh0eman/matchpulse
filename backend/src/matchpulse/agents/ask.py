"""Narrow user-initiated investigation; separate from live broadcast latency."""
from .schemas import AskRequest,Preferences
from .tools import EvidenceTools
from ..stories.export import agent_input
from .policy import default_narration
from .narrative_compiler import compile_narration

def ask(request,result):
    if request.match_id!=result['index'].match_id:raise ValueError('Question match mismatch')
    if request.question in ('coach_intent','xg','possession_percentage','counterfactual'):
        return {'schema_version':1,'status':'unsupported','claim_ids':[],
            'explanation':'The canonical observations do not support that measurement, intent or causal certainty.','evidence':[]}
    insight=next((i for i in result['insights'] if i.insight_id==request.insight_id and i.as_of_seconds<=request.as_of_seconds),None)
    if insight is None:return {'schema_version':1,'status':'unavailable','claim_ids':[],'explanation':'No approved incident at that clock.','evidence':[]}
    kinds={'before_goal':('goal_context',),'shot_sequence':('observed_shot','shot_outcome','turnover_to_shot'),
        'position_change':('observed_line_height_change',),'compare_position':('observed_line_height_change',)}
    if request.question in kinds and insight.type not in kinds[request.question]:
        return {'schema_version':1,'status':'unavailable','claim_ids':[],'explanation':'No matching approved incident for this question.','evidence':[]}
    tools=EvidenceTools(result,request.match_id,request.as_of_seconds)
    registry={c.claim_id:c for c in result['claims']};env=agent_input(insight,registry,'analyst')
    c=registry[insight.claim_ids[0]]
    tools.resolve_claim(match_id=request.match_id,claim_id=c.claim_id,as_of_seconds=request.as_of_seconds)
    # Source evidence only: do not infer an assist from events preceding a goal.
    refs=[r.model_dump(mode='json') for r in c.references]
    observations=[]
    if request.question=='before_goal':
        end=insight.as_of_seconds
        preceding=[e for e in tools.index.ordered if max(0.,end-12)<=e.time_seconds<end and e.period==insight.period][-5:]
        for event in preceding:
            tools.resolve_evidence(match_id=request.match_id,category='event',source_id=event.id,as_of_seconds=request.as_of_seconds)
            observations.append(event.model_dump(mode='json'))
            reference={'match_id':request.match_id,'category':'event','source_id':event.id}
            if reference not in refs:refs.append(reference)
    elif request.question=='shot_sequence':
        for reference in c.references:
            if reference.category=='event':
                tools.resolve_evidence(match_id=request.match_id,category='event',source_id=reference.source_id,as_of_seconds=request.as_of_seconds)
                observations.append(tools.index.events[reference.source_id].model_dump(mode='json'))
    detail=compile_narration(default_narration(env,Preferences(audience='analyst')),env,tools,Preferences(audience='analyst'))
    explanation=' '.join(s.text for s in detail.sentences)
    if observations:
        explanation+=' Bounded source observations: '+'; '.join(f"{e['type']} attributed to {e['team_id'] or 'no team'} at {e['time_seconds']:g}s [{e['id']}]" for e in observations)+'. No assist or causal link is inferred.'
    if request.question=='why_highlighted':explanation+=f' Highlighted by the deterministic {insight.type} rule; editorial priority {insight.priority}, not probability.'
    return {'schema_version':1,'status':'verified','claim_ids':list(insight.claim_ids),
        'explanation':explanation,'evidence':refs,'source_observations':observations,'tool_calls':tools.calls,
        'limitations':list(c.limitations),'mode':'deterministic restricted question set; no conversational model called'}
