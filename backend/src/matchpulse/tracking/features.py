"""Geometry from observable coordinates; no tactical roles, intents or targets."""
from __future__ import annotations
from dataclasses import dataclass
from math import hypot,sqrt
from ..schemas import Team
from .schemas import TrackingFrame

FEATURE_NAMES=('line3_m','line4_m','line_q20_m','nearest_m','density5','density10','density15','length_m','width_m','centroid_x_m','dispersion_m','advanced_players','interline_gap_m')

def quantile(values:list[float],q:float)->float:
    ordered=sorted(values);index=(len(ordered)-1)*q;left=int(index);right=min(left+1,len(ordered)-1)
    return ordered[left]+(ordered[right]-ordered[left])*(index-left)

def attack_point(x:float,y:float,team:Team,period:int)->tuple[float,float]:
    return (x,y) if (team=='NORTH')==(period==1) else (105-x,68-y)

@dataclass(frozen=True)
class FeatureSample:
    frame_id:str
    time:float
    period:int
    team:Team
    context:tuple[int,int,int,int]
    values:dict[str,float]

@dataclass(frozen=True)
class Comparison:
    time:float
    team:Team
    period:int
    reference_start:float
    split:float
    recent_end:float
    before:dict[str,float]
    after:dict[str,float]
    delta:dict[str,float]
    before_frames:int
    after_frames:int
    reference_ids:tuple[str,...]
    recent_ids:tuple[str,...]
    contexts:tuple[tuple[int,int,int,int],...]
    missing_seconds:float=0.

def extract_features(frame:TrackingFrame,team:Team,build_up_only:bool=True)->FeatureSample|None:
    if frame.phase!='open_play' or frame.ball.owner_status!='active':return None
    if not (0<=frame.ball.x<=105 and 0<=frame.ball.y<=68):return None
    owner=next(p for p in frame.players if p.id==frame.ball.owner_id)
    if owner.team_id==team:return None
    owner_x,_=attack_point(owner.x,owner.y,owner.team_id,frame.period)
    if build_up_only and owner_x>52.5:return None
    own=[p for p in frame.players if p.team_id==team and not p.goalkeeper]
    opponent=[p for p in frame.players if p.team_id!=team and not p.goalkeeper]
    if len(own)<7 or len(opponent)<7:return None
    positions=[attack_point(p.x,p.y,team,frame.period) for p in own]
    xs=sorted(p[0] for p in positions);ys=[p[1] for p in positions]
    distances=[hypot(p.x-owner.x,p.y-owner.y) for p in own]
    cx=sum(xs)/len(xs);cy=sum(ys)/len(ys)
    score_diff=frame.score.home-frame.score.away
    if team=='SOUTH':score_diff=-score_diff
    values={'line3_m':sum(xs[:3])/3,'line4_m':sum(xs[:4])/4,'line_q20_m':quantile(xs,.2),
        'nearest_m':min(distances),'density5':float(sum(d<=5 for d in distances)),
        'density10':float(sum(d<=10 for d in distances)),'density15':float(sum(d<=15 for d in distances)),
        'length_m':quantile(xs,.9)-quantile(xs,.1),'width_m':quantile(ys,.9)-quantile(ys,.1),
        'centroid_x_m':cx,'dispersion_m':sqrt(sum((x-cx)**2+(y-cy)**2 for x,y in positions)/len(positions)),
        'advanced_players':float(sum(x>=52.5 for x in xs)),'interline_gap_m':quantile(xs,.6)-quantile(xs,.2)}
    return FeatureSample(frame.frame_id,frame.time_seconds,frame.period,team,
        (int(owner_x>=35),int(score_diff>0)-int(score_diff<0),len(own),len(opponent)),values)
