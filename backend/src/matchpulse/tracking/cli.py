"""Research CLI: observable inputs only; optional bounded debug trace."""
import argparse,json
from pathlib import Path
from .ingestion import load_frames
from ..ingestion import load_match
from ..schemas import MatchIdentity
from .detector import TrackingConfig
from .replay import comparisons_from_frames,detect
from .evidence import make_pack,compact_agent_facts

def main():
    parser=argparse.ArgumentParser(description='Observable positional replay; no hidden policy metadata')
    parser.add_argument('tracking',type=Path);parser.add_argument('--config',type=Path,required=True)
    parser.add_argument('--events',type=Path);parser.add_argument('--model',type=Path)
    parser.add_argument('--output',type=Path);parser.add_argument('--debug',action='store_true')
    args=parser.parse_args()
    try:
        suffix='.tracking.jsonl.gz'
        identity=MatchIdentity(match_id=args.tracking.name.removesuffix(suffix))
        config=TrackingConfig.model_validate_json(args.config.read_text())
        model=json.loads(args.model.read_text()) if args.model else None
        if config.method=='fused' and args.events is None:raise ValueError('Fused replay requires canonical events')
        events=load_match(args.events,identity) if args.events else ()
        frames=list(load_frames(args.tracking,identity))
        alerts=detect(comparisons_from_frames(iter(frames),config),config,events,model)
        packs=[make_pack(identity.match_id,a,config) for a in alerts]
    except (ValueError,OSError) as exc:parser.exit(2,f'Tracking input/configuration error: {exc}\n')
    print(f'Match {identity.match_id}; {len(frames)} observable frames; {len(packs)} positional alerts')
    for pack in packs:
        print(f'{pack.detected_at_seconds/60:.1f}min {pack.team_id} {pack.direction}: line {pack.before["line3_m"]:.2f}->{pack.after["line3_m"]:.2f}m; uncalibrated score {pack.detection_score:.3f}')
        if args.debug:
            print(f'  validate_frames -> extract_features -> TrackingWindows.compare -> PositionalDetector.update -> make_pack')
            print(f'  support {pack.support}; representative frames {pack.representative_frames}')
    if args.output:
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(json.dumps([p.model_dump() for p in packs],indent=2,allow_nan=False)+'\n')
        args.output.with_suffix('.facts.json').write_text(json.dumps([compact_agent_facts(p) for p in packs],indent=2,allow_nan=False)+'\n')

if __name__=='__main__':main()
