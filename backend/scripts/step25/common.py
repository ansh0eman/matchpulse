from __future__ import annotations
import gzip,json,hashlib
from pathlib import Path
from dataclasses import asdict
from matchpulse.schemas import MatchIdentity
from matchpulse.tracking.ingestion import load_frames
from matchpulse.tracking.features import extract_features,FeatureSample

ROOT=Path(__file__).resolve().parents[3]
DATA=ROOT/'data/step25';ART=ROOT/'research/step25/artifacts';ART.mkdir(exist_ok=True,parents=True)

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def dump(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(value,indent=2,allow_nan=False)+'\n')
def manifest(split,diagnostic=False):
    name=f'{split}-2hz' if diagnostic else split
    return json.loads((DATA/'evaluation'/f'{name}-manifest.json').read_text())['records']

def prepare(record,diagnostic=False):
    directory=DATA/('diagnostic' if diagnostic else 'inference')
    path=directory/f"{record['match_id']}.tracking.jsonl.gz"
    feature_source=hashlib.sha256(b''.join((ROOT/name).read_bytes() for name in ['backend/src/matchpulse/tracking/features.py','backend/src/matchpulse/tracking/schemas.py'])).hexdigest()
    cache=DATA/'cache'/f"{record['match_id']}-{record['hz']}hz.features.json.gz"
    if cache.exists():
        with gzip.open(cache,'rt') as source:cached=json.load(source)
        if cached['feature_source']!=feature_source:raise ValueError('Feature source changed: cached extraction must be regenerated explicitly')
        return cached
    identity=MatchIdentity(match_id=record['match_id']);samples=[]
    with gzip.open(path,'rb') as source:raw_hash=hashlib.sha256(source.read()).hexdigest()
    if raw_hash!=record['tracking_sha256']:raise ValueError('Raw frame hash mismatch')
    if digest(directory/f'{identity.match_id}.jsonl')!=record['event_sha256']:raise ValueError('Canonical hash mismatch')
    frame_count=0;invalid_owner=0;gaps=0;previous=None;last=0.;period_starts={};active_counts={};warnings=[]
    for frame in load_frames(path,identity):
        frame_count+=1;last=frame.time_seconds
        period_starts.setdefault(str(frame.period),frame.time_seconds)
        invalid_owner+=frame.ball.owner_status=='inactive_reference'
        if previous is not None and frame.time_seconds-previous>1/record['hz']+1e-6:gaps+=1
        previous=frame.time_seconds
        active_counts[str(len(frame.players))]=active_counts.get(str(len(frame.players)),0)+1
        for team in ('NORTH','SOUTH'):
            sample=extract_features(frame,team)
            if sample:samples.append(asdict(sample))
    if frame_count!=record['frame_count']:raise ValueError('Unexpected frame count')
    cached={'feature_source':feature_source,'frame_count':frame_count,'invalid_owner_frames':invalid_owner,'gap_count':gaps,
        'period_starts':period_starts,'active_counts':active_counts,'end_time':last,'samples':samples}
    cache.parent.mkdir(parents=True,exist_ok=True)
    with gzip.open(cache,'wt',compresslevel=4) as target:json.dump(cached,target,allow_nan=False)
    return cached

def samples_from_cache(cached):
    return [FeatureSample(frame_id=s['frame_id'],time=s['time'],period=s['period'],team=s['team'],context=tuple(s['context']),values=s['values']) for s in cached['samples']]
