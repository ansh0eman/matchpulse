"""I/O boundary. Only UUID-named canonical JSONL files are opened."""
from __future__ import annotations
from collections.abc import Iterable, Iterator
from pathlib import Path
from .schemas import CanonicalEvent, MatchIdentity

class IngestionError(ValueError):
    pass

def validate_stream(lines: Iterable[str]) -> Iterator[CanonicalEvent]:
    seen: set[str] = set()
    previous: CanonicalEvent | None = None
    actors: dict[str, str] = {}
    for line_number, line in enumerate(lines, 1):
        try:
            event = CanonicalEvent.model_validate_json(line)
            if event.id in seen:
                raise ValueError('Duplicate event ID')
            if event.sequence != line_number-1 or event.evidence.source_index != event.sequence:
                raise ValueError('Noncontiguous sequence or source index')
            if previous and (event.time_seconds < previous.time_seconds or event.period < previous.period):
                raise ValueError('Event ordering regressed')
            if previous and (event.score.home < previous.score.home or event.score.away < previous.score.away):
                raise ValueError('Score regressed')
            if event.player_id and event.team_id:
                if event.player_id in actors and actors[event.player_id] != event.team_id:
                    raise ValueError('Player changed teams')
                actors[event.player_id] = event.team_id
        except ValueError as exc:
            # Bounded context: no dumping the entire private input line.
            raise IngestionError(f'Invalid canonical event at line {line_number}: {exc}') from exc
        seen.add(event.id)
        previous = event
        yield event

def load_match(path: Path, identity: MatchIdentity) -> Iterator[CanonicalEvent]:
    if path.name != f'{identity.match_id}.jsonl':
        raise IngestionError('Inference requires an opaque UUID filename matching match_id')
    with path.open(encoding='utf8') as stream:
        yield from validate_stream(stream)
