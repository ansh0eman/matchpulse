"""Prepare a private, allowlisted deployment bundle; never run a model or simulator.

The ignored bundle contains only the declared canonical replay sources.
It is distinct from frozen experiments. Existing different bytes are never overwritten.
"""

import json
import shutil
from pathlib import Path
from matchpulse.viewer.catalog import SCENARIOS, ROOT
from matchpulse.viewer.service import source, digest


def export(destination: Path):
    destination.mkdir(parents=True, exist_ok=True)
    rows = []
    for scenario in SCENARIOS.values():
        result = source(scenario.id)
        if not all(result["index"].verify(c) for c in result["claims"]):
            raise ValueError(f"Unverified source in {scenario.id}")
        for path in (scenario.events, scenario.frames):
            if path is None:
                continue
            target = destination / path.name
            expected = digest(path)
            if target.exists():
                if digest(target) != expected:
                    raise ValueError(
                        f"Refusing to replace different source {target.name}"
                    )
            else:
                shutil.copyfile(path, target)
            if digest(target) != expected:
                raise ValueError("Copy verification failed")
            rows.append(
                {
                    "scenario": scenario.id,
                    "match_id": scenario.match_id,
                    "file": target.name,
                    "sha256": expected,
                    "bytes": target.stat().st_size,
                }
            )
    manifest = {
        "schema_version": 1,
        "origin": "declared canonical synthetic source; no model calls",
        "sources": rows,
    }
    target = destination / "manifest.json"
    content = json.dumps(manifest, indent=2, sort_keys=True) + "\n"
    if target.exists() and target.read_text() != content:
        raise ValueError("Refusing to overwrite different manifest")
    target.write_text(content)
    print(
        f"Prepared and hash-verified {len(rows)} source files. No model or Azure call."
    )


if __name__ == "__main__":
    # The original eight-file bundle remains intact for historical reproduction.
    export(ROOT / "backend/output/viewer-bundle-v2")
