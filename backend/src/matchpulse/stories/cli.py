"""Local real-match replay; no credentials, evaluation metadata or cloud dependencies."""
import argparse,hashlib
from pathlib import Path
from ..schemas import MatchIdentity
from ..ingestion import load_match
from ..tracking.ingestion import load_frames
from ..tracking.detector import TrackingConfig
from .replay import replay
from .export import export

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--events',type=Path,required=True);p.add_argument('--tracking',type=Path)
    p.add_argument('--positional-config',type=Path);p.add_argument('--output',type=Path,required=True)
    p.add_argument('--debug',action='store_true');a=p.parse_args()
    try:
        identity=MatchIdentity(match_id=a.events.stem)
        events=list(load_match(a.events,identity));frames=list(load_frames(a.tracking,identity)) if a.tracking else []
        if not events:raise ValueError('Empty event stream')
        config=TrackingConfig.model_validate_json(a.positional_config.read_text()) if a.positional_config else None
        result=replay(identity.match_id,events,frames,config)
        paths={'events':a.events,'tracking':a.tracking,'positional_config':a.positional_config}
        provenance={k:{'filename':v.name,'sha256':hashlib.sha256(v.read_bytes()).hexdigest()} for k,v in paths.items() if v}
        summary=export(result,a.output,provenance)
    except (ValueError,OSError) as exc:p.exit(2,f'Story input/configuration error: {exc}\n')
    print(f"{identity.match_id}: {summary['verified_candidates']} verified insights; {summary['emitted']} timeline items; {summary['suppressed']} suppressed")
    if a.debug:
        for item in result['timeline'][:12]:
            i=item.insight
            print(f'[{i.event_time_seconds/60:.2f}m] {i.type} -> typed claim -> evidence validated -> registry -> scheduler at {item.presented_at_seconds:g}s')
            print(' ',i.fallback.headline)
        print('Debug limited to first 12 items; complete evidence in exports.')
if __name__=='__main__':main()
