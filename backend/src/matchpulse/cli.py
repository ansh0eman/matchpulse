"""Offline deterministic demonstration; no evaluation labels or cloud calls."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from .schemas import MatchIdentity
from .ingestion import load_match
from .detectors.rolling import DetectorConfig
from .replay import replay

def main():
    parser=argparse.ArgumentParser(description='Replay opaque canonical JSONL and emit auditable tactical evidence')
    parser.add_argument('input',type=Path)
    parser.add_argument('--config',type=Path,default=Path(__file__).resolve().parents[2]/'config/selected.json')
    parser.add_argument('--output',type=Path)
    parser.add_argument('--debug',action='store_true')
    args=parser.parse_args()
    try:
        identity=MatchIdentity(match_id=args.input.stem)
        config=DetectorConfig.model_validate_json(args.config.read_text())
        events=list(load_match(args.input,identity))
        packs=replay(iter(events),identity,config,debug=args.debug)
    except (OSError,ValueError) as exc:
        parser.exit(2,f'MatchPulse input/configuration error: {exc}\n')
    print(f'MATCHPULSE — TACTICAL ANALYSIS\nMatch: {identity.match_id}\nEvents processed: {len(events)}\nTurning points detected: {len(packs)}')
    for pack in packs:
        before,after=pack.facts.before,pack.facts.after
        print(f'\nTime: {pack.detected_at_seconds/60:.1f} minutes | Team: {pack.team_id}')
        print(f'Signal: {pack.statement}')
        print(f'Recovery location: {before.mean_recovery_x_m:.2f} -> {after.mean_recovery_x_m:.2f} m')
        print(f'High recovery actions: {before.high_recovery_count} -> {after.high_recovery_count}; exposure {before.exposure_seconds/60:g} minutes each')
        print(f'Detector: {config.method} v{config.version}; uncalibrated score {pack.detection_score:.3f}')
        print(f'Illustrative evidence: {", ".join(pack.illustrative_event_ids)}')
        print(f'Complete calculation references: {len(pack.calculation_references)}')
    if args.output:
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(json.dumps([p.model_dump() for p in packs],indent=2,allow_nan=False)+'\n')
        print(f'Evidence saved: {args.output}')

if __name__=='__main__':main()
