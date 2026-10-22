"""Deterministic JSON exports and bounded agent envelopes."""
import json
from .schemas import AgentInput,AgentOutput

def write_json(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(value,indent=2,sort_keys=True,allow_nan=False)+'\n')

def agent_input(insight,registry,audience='fan'):
    claims=tuple(registry[cid] for cid in insight.claim_ids)
    if any(c.match_id!=insight.match_id for c in claims):raise ValueError('Agent match namespace mismatch')
    return AgentInput(match_id=insight.match_id,insight=insight,claims=claims,audience=audience)

def grounded_response(payload,envelope):
    """Strict selection/template contract: model supplies no authoritative free prose."""
    try:
        result=AgentOutput.model_validate_json(payload)
        if (result.match_id!=envelope.match_id or result.insight_id!=envelope.insight.insight_id or
            not result.selected_claim_ids or len(set(result.selected_claim_ids))!=len(result.selected_claim_ids) or
            any(cid not in envelope.insight.claim_ids for cid in result.selected_claim_ids)):
            raise ValueError('Unregistered selection')
        return envelope.insight.fallback,True
    except ValueError:return envelope.insight.fallback,False

def export(result,directory,provenance):
    for name in ('timeline','insights','claims','presentation'):
        write_json(directory/f'{name}.json',[x.model_dump(mode='json') for x in result[name]])
    write_json(directory/'suppressed.json',result['suppressed'])
    index=result['index']
    write_json(directory/'evidence-index.json',{'match_id':index.match_id,
        'events':{k:v.model_dump(mode='json') for k,v in index.events.items()},
        'tracking_frames':{k:v.model_dump(mode='json') for k,v in index.frames.items()}})
    registry={c.claim_id:c for c in result['claims']}
    write_json(directory/'agent-inputs.json',[agent_input(i,registry).model_dump(mode='json') for i in result['insights']])
    from collections import Counter
    goals=[e for e in index.ordered if e.type=='goal'];shots=[e for e in index.ordered if e.type=='shot']
    types=Counter(i.type for i in result['insights']);emitted=Counter(t.insight.type for t in result['timeline'])
    summary={'match_id':index.match_id,'provenance':provenance,'events':len(index.events),'frames':len(index.frames),
        'candidates':len(result['claims'])+sum('claim_id' in x or 'event_id' in x for x in result['suppressed']),
        'verified_candidates':len(result['insights']),'emitted':len(result['timeline']),
        'suppressed':len(result['suppressed']),'verified_distribution':dict(types),'emitted_distribution':dict(emitted),
        'goals_source':len(goals),'goals_verified':types['goal_context'],'goals_emitted':emitted['goal_context'],
        'shots_source':len(shots),'shots_verified':types['observed_shot'],'shots_emitted':emitted['observed_shot'],
        'all_claims_verified':all(index.verify(c) for c in result['claims']),
        'dangling_references':sum(not index.verify(c) for c in result['claims']),
        'recent_shot_state_high_water':result['recent_state_high_water'],
        'duplicate_insight_ids':len(result['insights'])-len({i.insight_id for i in result['insights']}),
        'latency_seconds_max':max((t.presented_at_seconds-t.insight.as_of_seconds for t in result['timeline']),default=0),
        'minutes_without_priority_70_story':sum(not any(int(t.presented_at_seconds//60)==m and t.insight.priority>=70
            for t in result['timeline']) for m in range(int(index.ordered[-1].time_seconds//60)+1)) if index.ordered else 0}
    write_json(directory/'summary.json',summary)
    return summary
