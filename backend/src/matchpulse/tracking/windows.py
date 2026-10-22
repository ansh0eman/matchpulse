"""Comparable football contexts, fixed clock windows and explicit support."""
from __future__ import annotations
from collections import defaultdict,deque
from statistics import mean
from .features import FeatureSample,Comparison,FEATURE_NAMES

class TrackingWindows:
    def __init__(self,reference_seconds:int=1200,recent_seconds:int=180,min_recent:int=6,min_reference:int=12,conditioned:bool=True):
        self.reference_seconds=reference_seconds;self.recent_seconds=recent_seconds
        self.min_recent=min_recent;self.min_reference=min_reference;self.conditioned=conditioned
        self.samples=deque();self.period=None;self.period_start=0.

    def reset(self,period:int,time:float):
        self.samples.clear();self.period=period;self.period_start=time

    def update(self,sample:FeatureSample):
        if sample.period!=self.period:self.reset(sample.period,sample.time)
        self.samples.append(sample)

    def compare(self,time:float,team:str)->Comparison|None:
        start=max(0.,self.period_start,time-self.reference_seconds);split=time-self.recent_seconds
        while self.samples and self.samples[0].time<=start:self.samples.popleft()
        rows=[s for s in self.samples if s.team==team and s.time<=time]
        before=defaultdict(list);after=defaultdict(list)
        for sample in rows:
            key=sample.context if self.conditioned else (0,0,0,0)
            (before if sample.time<=split else after)[key].append(sample)
        contexts=sorted(k for k in before.keys()&after.keys() if len(before[k])>=self.min_reference and len(after[k])>=self.min_recent)
        if not contexts:return None
        # The recent common-context mixture is shared by both window means.
        total=sum(len(after[k]) for k in contexts)
        b={name:sum(len(after[k])*mean(s.values[name] for s in before[k]) for k in contexts)/total for name in FEATURE_NAMES}
        a={name:sum(len(after[k])*mean(s.values[name] for s in after[k]) for k in contexts)/total for name in FEATURE_NAMES}
        ref=tuple(s.frame_id for k in contexts for s in before[k]);rec=tuple(s.frame_id for k in contexts for s in after[k])
        # All observations are samples, not independent statistical replicates.
        return Comparison(time,team,self.period,start,split,time,b,a,{name:a[name]-b[name] for name in FEATURE_NAMES},len(ref),len(rec),ref,rec,tuple(contexts))
