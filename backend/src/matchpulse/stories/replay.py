"""Unify independent inference paths only at verified claims."""
from .schemas import Claim, Reference, MatchInsight
from .claims import make_claim,claim_id,wording
from .state import MatchStoryState
from .evidence import EvidenceIndex
from .registry import ClaimRegistry
from .scheduler import StoryScheduler,PRIORITY
from ..tracking.presentation import review_episode
from ..tracking.replay import comparisons_from_frames,detect
from ..tracking.evidence import make_pack


def replay(match_id,events,frames=(),config=None):
    events=list(events);frames=list(frames)
    packs=[]
    if frames:
        if config is None:raise ValueError('Tracking requires explicit positional configuration')
        packs=[make_pack(match_id,a,config) for a in detect(comparisons_from_frames(frames,config),config,events)]
    index=EvidenceIndex(match_id,events,frames,packs);registry=ClaimRegistry(index)
    state=MatchStoryState();scheduler=StoryScheduler();insights=[];rejected=[];pending=[];decisions=[]
    for pack in packs:
        decision=review_episode(pack,frames,events);decisions.append(decision)
        if decision.claim is None:
            rejected.append({'detection_id':pack.detection_id,'reasons':decision.reasons});continue
        line=decision.claim
        refs=tuple(Reference(match_id=match_id,category='tracking',source_id=i) for i in
                   pack.tracking_references['reference']+pack.tracking_references['recent'])
        window=tuple(line.recent_window)
        c=Claim(claim_id=claim_id(match_id,'observed_line_height_change',refs,window),match_id=match_id,
            type='observed_line_height_change',team_id=line.team_id,player_ids=(),value={'kind':'observed_line_height_change','line':line},
            unit='m',window=window,as_of_seconds=line.as_of_seconds,references=refs,verification_method='presentation_gate_v1',
            limitations=(line.qualification,))
        pending.append(c)
    def accept(c,e):
        try:registry.register(c)
        except ValueError:
            rejected.append({'claim_id':c.claim_id,'reason':'evidence_verification_failed'});return
        i=MatchInsight(insight_id=c.claim_id.replace(':claim:',':insight:'),match_id=match_id,type=c.type,
            event_time_seconds=c.window[1],as_of_seconds=c.as_of_seconds,team_id=c.team_id,player_ids=c.player_ids,
            period=e.period,priority=PRIORITY[c.type],claim_ids=(c.claim_id,),evidence=c.references,
            observed_score=e.score,fallback=wording(c),limitations=c.limitations)
        insights.append(i);scheduler.submit(i)
    # Insert tracking at availability time, after event prefix through equal time.
    cursor=0
    for n,e in enumerate(events):
        while cursor<len(pending) and pending[cursor].as_of_seconds<e.time_seconds:
            if n:accept(pending[cursor],events[n-1])
            cursor+=1
        for candidate in sorted(state.update(e),key=lambda c:-PRIORITY[c.kind]):
            try:c=make_claim(match_id,candidate)
            except ValueError:
                rejected.append({'event_id':e.id,'reason':'invalid_candidate'});continue
            accept(c,e)
    # Frames may extend beyond the final event. Their own availability clock is preserved.
    while cursor<len(pending):
        if events:accept(pending[cursor],events[-1])
        cursor+=1
    return {'claims':list(registry.claims.values()),'insights':insights,
            'timeline':sorted(scheduler.timeline,key=lambda x:(x.presented_at_seconds,-x.insight.priority,x.insight.insight_id)),
            'suppressed':rejected+scheduler.suppressed,'presentation':decisions,'index':index,
            'recent_state_high_water':state.high_water_recent}
