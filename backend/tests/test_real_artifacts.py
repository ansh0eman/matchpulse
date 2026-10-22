import hashlib
import json
from pathlib import Path
from matchpulse.ingestion import validate_stream
from matchpulse.replay import observations
from matchpulse.detectors.rolling import DetectorConfig

ROOT=Path(__file__).resolve().parents[2]

def test_real_simulator_prefix_schema_order_actor_and_clock():
    path=Path(__file__).parent/'fixtures/canonical-prefix.jsonl'
    events=list(validate_stream(path.read_text().splitlines()))
    assert len(events)==100 and events[0].type=='match_start'
    assert any(e.type=='interception' for e in events)
    assert all(o.time<=events[-1].time_seconds for o in observations(iter(events),480))

def test_frozen_config_and_actual_partition_records():
    frozen_path=ROOT/'research/step2-artifacts/frozen-config.json'
    frozen=json.loads(frozen_path.read_text())
    assert hashlib.sha256(frozen_path.read_bytes()).hexdigest()==frozen_path.with_suffix('.sha256').read_text().strip()
    selected=DetectorConfig.model_validate_json((ROOT/'backend/config/selected.json').read_text())
    assert selected.model_dump()==frozen['selected']
    assert len(set(frozen['development_seeds']))==24
    assert set(frozen['development_seeds'])=={1009+i*7919 for i in range(24)}
    for source,digest in frozen['inference_source_sha256'].items():
        assert hashlib.sha256((ROOT/source).read_bytes()).hexdigest()==digest
