"""Fail-closed source resolver; recomputes facts without candidate state."""
from .schemas import Claim
from .claims import UNITS, claim_id
from ..schemas import Score
from ..tracking.presentation import review_episode

class EvidenceIndex:
    def __init__(self,match_id,events,frames=(),packs=()):
        self.match_id=match_id;self.events={};self.ordered=[];score=Score(home=0,away=0)
        for e in events:
            if e.id in self.events or e.sequence!=len(self.ordered):raise ValueError('Invalid event index')
            before=score
            prior=self.ordered[-1] if self.ordered else None
            penalty_pair=bool(e.type=='goal' and prior and prior.type=='penalty' and prior.outcome=='goal' and prior.team_id==e.team_id and prior.player_id==e.player_id and prior.time_seconds==e.time_seconds)
            scoring=(e.type=='goal' and not penalty_pair) or (e.type=='penalty' and e.outcome=='goal')
            expected=(before.home+(scoring and e.team_id=='NORTH'),before.away+(scoring and e.team_id=='SOUTH'))
            if (e.score.home,e.score.away)!=expected:raise ValueError(f'Unexplained score transition at {e.id}')
            self.events[e.id]=e;self.ordered.append(e);score=e.score
        self.frames={f.frame_id:f for f in frames};self.packs={p.detection_id:p for p in packs}

    def verify(self,c:Claim)->bool:
        try:return self._verify(c)
        except (ValueError,KeyError,TypeError,IndexError,AttributeError):return False

    def _verify(self,c):
        if c.match_id!=self.match_id or c.type!=c.value.kind or c.unit!=UNITS[c.type]:return False
        if not c.references or any(r.match_id!=self.match_id for r in c.references):return False
        if len(set(c.references))!=len(c.references):return False
        if c.window[0]>c.window[1] or c.window[1]>c.as_of_seconds:return False
        if c.claim_id!=claim_id(c.match_id,c.type,c.references,c.window):return False
        if c.type!='observed_line_height_change' and c.limitations!=('Synthetic uncalibrated football; observations do not establish coach intent.',):return False
        if c.type=='observed_line_height_change':
            if c.verification_method!='presentation_gate_v1':return False
            line=c.value.line;p=self.packs[line.detection_id]
            decision=review_episode(p,self.frames.values(),self.ordered)
            ids=tuple(p.tracking_references['reference']+p.tracking_references['recent'])
            return (decision.claim==line and c.limitations==(line.qualification,) and line.match_id==c.match_id and c.team_id==line.team_id and
                c.as_of_seconds==line.as_of_seconds and c.window==tuple(line.recent_window) and
                c.player_ids==() and tuple(r.source_id for r in c.references)==ids and
                all(r.category=='tracking' for r in c.references))
        if c.verification_method!='canonical_prefix_v1' or any(r.category!='event' for r in c.references):return False
        rows=[self.events[r.source_id] for r in c.references];end=rows[-1];v=c.value
        if any(e.time_seconds>c.as_of_seconds or e.sequence>end.sequence for e in rows):return False
        if c.as_of_seconds!=end.time_seconds or c.window[1]!=end.time_seconds:return False
        if c.type!='recent_attacking_activity' and c.window[0]!=rows[0].time_seconds:return False
        team=end.team_id
        if c.type in ('high_turnover','turnover_to_shot'):team=rows[1].team_id
        if team!=c.team_id:return False
        players=tuple(sorted({e.player_id for e in rows if e.player_id and e.team_id==team}))
        if players!=c.player_ids:return False
        if c.type=='goal_context':
            if end.type!='goal' or not end.team_id:return False
            before=self.ordered[end.sequence-1].score if end.sequence else Score(home=0,away=0)
            if rows!=( [self.ordered[end.sequence-1],end] if end.sequence else [end]):return False
            own0,opp0=(before.home,before.away) if team=='NORTH' else (before.away,before.home)
            own1,opp1=(end.score.home,end.score.away) if team=='NORTH' else (end.score.away,end.score.home)
            if before==end.score:
                prior=rows[0]
                return (v.before==before and v.after==end.score and v.context=='score_already_updated' and
                    prior.type=='penalty' and prior.outcome=='goal' and prior.team_id==end.team_id and
                    prior.player_id==end.player_id and prior.time_seconds==end.time_seconds)
            context=('opening_goal' if own0+opp0==0 else 'equalizer' if own1==opp1 else
                     'go_ahead' if own0==opp0 else 'extends_lead' if own1>opp1 else 'reduces_deficit')
            return v.before==before and v.after==end.score and v.context==context and (own1,opp1)==(own0+1,opp0)
        if c.type=='recent_attacking_activity':
            expected=[e for e in self.ordered[:end.sequence+1] if e.type=='shot' and e.team_id==team and
                      e.period==end.period and c.window[0]<e.time_seconds<=c.window[1]]
            return c.window[0]==max(0.,end.time_seconds-480) and rows==expected and v.shots==len(expected)>=3
        if c.type in ('high_turnover','turnover_to_shot'):
            if len(rows)!=(2 if c.type=='high_turnover' else 3):return False
            before,gain=rows[:2]
            if gain.sequence!=before.sequence+1 or gain.type not in ('tackle','interception','recovery'):return False
            if (not before.possession_team_id or before.possession_team_id==team or gain.possession_team_id!=team or
                before.possession_id==gain.possession_id or before.period!=gain.period or
                before.type not in ('pass','receive','dribble','tackle','interception','recovery') or before.team_id!=before.possession_team_id or
                not 0<=gain.time_seconds-before.time_seconds<=15):return False
            if (v.from_team!=before.possession_team_id or v.possession_id!=gain.possession_id or
                v.regain_x_m!=gain.attacking_position_m.x or v.elapsed_seconds!=end.time_seconds-gain.time_seconds):return False
            if c.type=='turnover_to_shot':
                span=self.ordered[gain.sequence:end.sequence+1]
                return end.type=='shot' and 0<=v.elapsed_seconds<=20 and all(
                    e.possession_id==gain.possession_id and e.period==gain.period and e.possession_team_id==team for e in span)
            return v.elapsed_seconds==0
        if c.type=='shot_outcome':
            if len(rows)!=2:return False
            shot,outcome=rows
            shooter=outcome.secondary_player_id if outcome.type in ('save','blocked_shot') else outcome.player_id
            team_ok=outcome.team_id!=shot.team_id if outcome.type in ('save','blocked_shot') else outcome.team_id==shot.team_id
            span=self.ordered[shot.sequence+1:outcome.sequence]
            return (shot.type=='shot' and outcome.type in ('save','miss','blocked_shot') and v.action==outcome.type and
                bool(shot.player_id) and shooter==shot.player_id and team_ok and shot.period==outcome.period and
                0<=outcome.time_seconds-shot.time_seconds<=15 and not any(e.type in
                ('shot','goal','save','miss','blocked_shot','kickoff','half_time','full_time') for e in span))
        permitted={'observed_shot':('shot',),'player_dismissal':('red_card',),
                   'match_boundary':('match_start','kickoff','half_time','full_time')}
        return len(rows)==1 and end.type in permitted[c.type] and v.action==end.type
