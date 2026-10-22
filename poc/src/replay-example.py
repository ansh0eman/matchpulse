"""Read-only JSONL boundary demonstration; no Python backend or dependencies."""
import json
from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'output' / 'seed-11-baseline.jsonl'
previous = (-1.0, -1)
count = 0
with path.open() as stream:
    for line in stream:
        event = json.loads(line)
        order = (event['time_seconds'], event['sequence'])
        assert order > previous
        previous = order
        count += 1
print(f'Read {count} canonical events; ordered through {previous[0]} match seconds.')
