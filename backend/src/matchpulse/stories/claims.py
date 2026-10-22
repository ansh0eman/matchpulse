"""Typed candidate facts and deterministic wording, separate from verification."""
from hashlib import sha256
from .schemas import Claim, Reference, Fallback
from .event_semantics import goal_context

UNITS={'goal_context':'score','observed_shot':'event','shot_outcome':'event','high_turnover':'m_and_s',
       'turnover_to_shot':'m_and_s','recent_attacking_activity':'shots','player_dismissal':'event',
       'match_boundary':'event','observed_line_height_change':'m'}

def claim_id(match_id,kind,refs,window):
    token=sha256(repr((kind,tuple((r.category,r.source_id) for r in refs),window)).encode()).hexdigest()[:24]
    return f'{match_id}:claim:{token}'

def make_claim(match_id,c):
    end=c.sources[-1];team=end.team_id
    refs=tuple(Reference(match_id=match_id,category='event',source_id=e.id) for e in c.sources)
    value={'kind':c.kind}
    if c.kind=='goal_context':
        from ..schemas import Score
        before=c.sources[0].score if len(c.sources)>1 else Score(home=0,away=0)
        value.update(before=before,after=end.score,context=('score_already_updated' if before==end.score and len(c.sources)>1 and c.sources[0].type=='penalty' and c.sources[0].outcome=='goal' else goal_context(before,end.score,team)))
    elif c.kind in ('high_turnover','turnover_to_shot'):
        before,gain=c.sources[:2];team=gain.team_id
        value.update(from_team=before.possession_team_id,possession_id=gain.possession_id,
                     regain_x_m=gain.attacking_position_m.x,elapsed_seconds=end.time_seconds-gain.time_seconds)
    elif c.kind=='recent_attacking_activity':value['shots']=len(c.sources)
    else:value['action']=end.type
    return Claim(claim_id=claim_id(match_id,c.kind,refs,c.window),match_id=match_id,type=c.kind,team_id=team,
        player_ids=tuple(sorted({e.player_id for e in c.sources if e.player_id and e.team_id==team})),
        value=value,unit=UNITS[c.kind],window=c.window,as_of_seconds=end.time_seconds,references=refs,
        verification_method='canonical_prefix_v1')

def wording(c:Claim)->Fallback:
    v=c.value;t=c.team_id or 'Match';clock=f'{c.as_of_seconds/60:.1f} cumulative minutes'
    if c.type=='goal_context':
        label='goal observed (score updated on penalty event)' if v.context=='score_already_updated' else v.context.replace('_',' ')
        text=f'{t}: {label}. Score {v.after.home}–{v.after.away} (NORTH–SOUTH).'
    elif c.type=='observed_shot':text=f'{t} register a shot attempt.'
    elif c.type=='shot_outcome':text=f'Observed {v.action.replace("_"," ")} in the referenced shot sequence.'
    elif c.type=='high_turnover':text=f'{t} gain possession at {v.regain_x_m:.1f}m along their attacking axis.'
    elif c.type=='turnover_to_shot':text=f'{t}: a high regain was followed by a shot {v.elapsed_seconds:g}s later in the same possession.'
    elif c.type=='recent_attacking_activity':text=f'{t} recorded {v.shots} shot attempts in the preceding {c.window[1]-c.window[0]:g} seconds.'
    elif c.type=='player_dismissal':text=f'{t} receive a red card.'
    elif c.type=='match_boundary':text=f'Observed {v.action.replace("_"," ")}. '
    else:text=v.line.statement
    return Fallback(headline=text,explanation=f'{text} Observed at {clock}. '+ ' '.join(c.limitations))
