"""Research CLI, with separate verified broadcast-claim output."""
import argparse, json
from pathlib import Path
from .ingestion import load_frames
from ..ingestion import load_match
from ..schemas import MatchIdentity
from .detector import TrackingConfig
from .replay import comparisons_from_frames, detect
from .evidence import make_pack, compact_agent_facts
from .presentation import review_episode


def main():
    parser = argparse.ArgumentParser(description='Observable positional replay; no hidden policy metadata')
    parser.add_argument('tracking', type=Path)
    parser.add_argument('--config', type=Path, required=True)
    parser.add_argument('--events', type=Path)
    parser.add_argument('--model', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--debug', action='store_true')
    args = parser.parse_args()
    try:
        suffix = '.tracking.jsonl.gz'
        identity = MatchIdentity(match_id=args.tracking.name.removesuffix(suffix))
        config = TrackingConfig.model_validate_json(args.config.read_text())
        model = json.loads(args.model.read_text()) if args.model else None
        if config.method == 'fused' and args.events is None:
            raise ValueError('Fused replay requires canonical events')
        # The original detector and the verification layer consume the same
        # observable event/frame streams, with no evaluation or policy metadata.
        events = list(load_match(args.events, identity)) if args.events else []
        frames = list(load_frames(args.tracking, identity))
        alerts = detect(comparisons_from_frames(iter(frames), config), config, events, model)
        packs = [make_pack(identity.match_id, alert, config) for alert in alerts]
        decisions = [review_episode(pack, frames, events if args.events else None) for pack in packs]
    except (ValueError, OSError) as exc:
        parser.exit(2, f'Tracking input/configuration error: {exc}\n')

    eligible = [decision.claim for decision in decisions if decision.claim is not None]
    print(f'Match {identity.match_id}; {len(frames)} observable frames; '
          f'{len(packs)} research alerts; {len(eligible)} broadcast-eligible observed claims')
    for pack, decision in zip(packs, decisions):
        print(f'{pack.detected_at_seconds/60:.1f}min {pack.team_id} {pack.direction}: '
              f'line {pack.before["line3_m"]:.2f}->{pack.after["line3_m"]:.2f}m; '
              f'uncalibrated score {pack.detection_score:.3f}; presentation {decision.status}')
        if args.debug:
            print('  validate_frames -> extract_features -> TrackingWindows.compare -> '
                  'PositionalDetector.update -> make_pack -> verify -> presentation gate')
            print(f'  support {pack.support}; representative frames {pack.representative_frames}')
            print(f'  recent evidence age {decision.recent_age_seconds}s; '
                  f'recent span {decision.recent_span_seconds}s; suppression reasons {decision.reasons}')

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        # Research artifacts preserve ALL original alerts, including weak ones.
        args.output.write_text(json.dumps([pack.model_dump() for pack in packs], indent=2, allow_nan=False)+'\n')
        args.output.with_suffix('.facts.json').write_text(
            json.dumps([compact_agent_facts(pack) for pack in packs], indent=2, allow_nan=False)+'\n')
        # Only the broadcast file is agent-eligible; research files are NOT.
        args.output.with_suffix('.presentation.json').write_text(
            json.dumps([decision.model_dump() for decision in decisions], indent=2, allow_nan=False)+'\n')
        args.output.with_suffix('.broadcast.json').write_text(
            json.dumps([claim.model_dump() for claim in eligible], indent=2, allow_nan=False)+'\n')


if __name__ == '__main__':
    main()
