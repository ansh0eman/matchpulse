from __future__ import annotations
from collections.abc import Iterable,Iterator
from pathlib import Path
import gzip
from ..schemas import MatchIdentity
from .schemas import TrackingFrame

def validate_frames(lines:Iterable[str])->Iterator[TrackingFrame]:
    previous=None;seen=set()
    for row,line in enumerate(lines,1):
        try:
            frame=TrackingFrame.model_validate_json(line)
            if frame.frame_id in seen:raise ValueError('Duplicate tracking frame ID')
            seen.add(frame.frame_id)
            if previous and (frame.time_seconds<=previous.time_seconds or frame.sequence<=previous.sequence or frame.period<previous.period):
                raise ValueError('Tracking order/identity regressed')
        except ValueError as exc:
            raise ValueError(f'Invalid tracking frame at line {row}: {exc}') from exc
        previous=frame
        yield frame

def load_frames(path:Path,identity:MatchIdentity)->Iterator[TrackingFrame]:
    if path.name!=f'{identity.match_id}.tracking.jsonl.gz':raise ValueError('Tracking filename must be opaque and match identity')
    with gzip.open(path,'rt',encoding='utf8') as source:yield from validate_frames(source)
