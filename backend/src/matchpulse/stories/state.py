"""Online candidate generation; no future observations, no research metadata."""
from collections import deque
from dataclasses import dataclass, field
from ..schemas import CanonicalEvent, Score
from .event_semantics import BOUNDARIES, RESTARTS, high_transition, linked_shot

@dataclass
class Candidate:
    kind: str
    sources: tuple[CanonicalEvent,...]
    window: tuple[float,float]

@dataclass
class MatchStoryState:
    previous: CanonicalEvent | None = None
    score: Score = field(default_factory=lambda:Score(home=0,away=0))
    shot: CanonicalEvent | None = None
    regain: tuple[CanonicalEvent,CanonicalEvent] | None = None
    shots: deque = field(default_factory=deque)
    high_water_recent: int = 0

    def update(self,e:CanonicalEvent) -> list[Candidate]:
        if self.previous and (e.sequence!=self.previous.sequence+1 or e.time_seconds<self.previous.time_seconds or e.period<self.previous.period):
            raise ValueError('Story ordering regressed or duplicate event')
        if not self.previous and e.sequence!=0:raise ValueError('Story stream must begin at sequence zero')
        if self.previous and e.period!=self.previous.period:
            self.shots.clear();self.shot=None;self.regain=None
        out=[]
        def add(kind,sources=(e,),window=None):
            out.append(Candidate(kind,tuple(sources),window or (sources[0].time_seconds,e.time_seconds)))
        if e.type=='goal':add('goal_context',((self.previous,e) if self.previous else (e,)))
        elif e.type=='shot':
            add('observed_shot');self.shot=e
            if self.regain:
                before,gain=self.regain
                if (e.possession_id==gain.possession_id and e.possession_team_id==gain.team_id==e.team_id and
                    e.period==gain.period and 0<=e.time_seconds-gain.time_seconds<=20):
                    add('turnover_to_shot',(before,gain,e))
        elif e.type in ('save','miss','blocked_shot'):
            if linked_shot(self.shot,e):add('shot_outcome',(self.shot,e))
            self.shot=None
        elif e.type=='red_card':add('player_dismissal')
        elif e.type in BOUNDARIES:add('match_boundary')
        if high_transition(self.previous,e):
            self.regain=(self.previous,e);add('high_turnover',self.regain)
        elif self.regain and (e.possession_id!=self.regain[1].possession_id or e.type in RESTARTS):self.regain=None
        if e.type in RESTARTS or e.type=='goal':self.shot=None
        while self.shots and self.shots[0].time_seconds<=max(0.,e.time_seconds-480):self.shots.popleft()
        if e.type=='shot':
            self.shots.append(e)
            own=tuple(s for s in self.shots if s.team_id==e.team_id)
            if len(own)>=3:add('recent_attacking_activity',own,(max(0.,e.time_seconds-480),e.time_seconds))
        self.high_water_recent=max(self.high_water_recent,len(self.shots))
        self.previous=e;self.score=e.score
        return out
