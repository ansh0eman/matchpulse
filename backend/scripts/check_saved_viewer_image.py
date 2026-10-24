"""Verify a saved viewer's executable identity without extracting its filesystem.

Docker stores may identify an image by an OCI index or by its config. The config
digest binds runtime settings and ordered rootfs diff IDs across both stores.
This is an identity check, not a source/license/secret audit or permission to push.
"""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import re
import tarfile

DIGEST = re.compile(r"sha256:[0-9a-f]{64}\Z")
BLOB = re.compile(r"blobs/sha256/([0-9a-f]{64})\Z")
CONFIG = re.compile(r"(?:blobs/sha256/([0-9a-f]{64})|([0-9a-f]{64})\.json)\Z")
LAYER = re.compile(r"(?:blobs/sha256/[0-9a-f]{64}|[0-9a-f]{64}/layer\.tar)\Z")


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate JSON key")
        result[key] = value
    return result


def inspect_archive(path: Path, tag: str, source: str, expected_config=None):
    if not re.fullmatch(r"[0-9a-f]{40}", source):
        raise ValueError("Expected a complete source commit")
    if expected_config is not None and not DIGEST.fullmatch(expected_config):
        raise ValueError("Expected a sha256 config digest")
    if path.stat().st_size > 2 * 1024**3:
        raise ValueError("Archive exceeds release-asset bound")
    with tarfile.open(path, "r:*") as archive:
        members = {}
        declared_bytes = 0
        for member in archive:
            if len(members) >= 4096 or member.name in members:
                raise ValueError("Too many or duplicate archive paths")
            if not (member.isfile() or member.isdir()):
                raise ValueError("Archive links/devices are not allowed")
            declared_bytes += member.size
            if member.size > 1024**3 or declared_bytes > 4 * 1024**3:
                raise ValueError("Declared archive contents exceed bound")
            members[member.name] = member

        def file(name):
            item = members.get(name)
            if item is None or not item.isfile():
                raise ValueError("Missing declared image component")
            return archive.extractfile(item)

        def small_json(name, limit):
            if name not in members or members[name].size > limit:
                raise ValueError("Missing or oversized image metadata")
            with file(name) as stream:
                raw = stream.read(limit + 1)
            if len(raw) > limit:
                raise ValueError("Oversized image metadata")
            return json.loads(raw, object_pairs_hook=unique_object), raw

        manifest, _ = small_json("manifest.json", 256 * 1024)
        if not isinstance(manifest, list) or len(manifest) != 1:
            raise ValueError("Require exactly one saved image")
        image = manifest[0]
        if image.get("RepoTags") != [tag]:
            raise ValueError("Unexpected image tag or additional image reference")
        name = image.get("Config", "")
        match = CONFIG.fullmatch(name)
        if not match:
            raise ValueError("Unsafe config path")
        config, raw = small_json(name, 2 * 1024**2)
        config_hex = hashlib.sha256(raw).hexdigest()
        config_digest = "sha256:" + config_hex
        if config_hex != (match.group(1) or match.group(2)):
            raise ValueError("Config bytes do not match their digest")
        if expected_config is not None and config_digest != expected_config:
            raise ValueError("Loaded image differs from accepted config")
        settings = config.get("config", {})
        if config.get("architecture") != "amd64" or config.get("os") != "linux":
            raise ValueError("Viewer release requires Linux AMD64")
        if settings.get("Labels", {}).get("org.opencontainers.image.revision") != source:
            raise ValueError("Source revision label differs")
        if settings.get("User") not in {"studio", "10001", "10001:10001"}:
            raise ValueError("Viewer must use its reviewed non-root user")
        rootfs = config.get("rootfs", {})
        diffs = rootfs.get("diff_ids", [])
        layers = image.get("Layers", [])
        if rootfs.get("type") != "layers" or not 1 <= len(layers) <= 128 or len(layers) != len(diffs):
            raise ValueError("Invalid rootfs layer contract")
        total = 0
        for name, expected in zip(layers, diffs):
            if not isinstance(name, str) or not LAYER.fullmatch(name) or not isinstance(expected, str) or not DIGEST.fullmatch(expected):
                raise ValueError("Unsafe layer path/digest")
            # OCI save stores compressed blobs; classic Docker save uses layer.tar.
            blob = BLOB.fullmatch(name)
            with file(name) as stream:
                raw_hash = hashlib.sha256()
                while block := stream.read(65536):
                    raw_hash.update(block)
                if blob and raw_hash.hexdigest() != blob.group(1):
                    raise ValueError("Layer blob digest differs")
            with file(name) as stream:
                magic = stream.read(2)
                stream.seek(0)
                content = gzip.GzipFile(fileobj=stream) if magic == b"\x1f\x8b" else stream
                diff = hashlib.sha256()
                size = 0
                while block := content.read(65536):
                    size += len(block)
                    total += len(block)
                    if size > 1024**3 or total > 4 * 1024**3:
                        raise ValueError("Uncompressed rootfs exceeds bound")
                    diff.update(block)
                if "sha256:" + diff.hexdigest() != expected:
                    raise ValueError("Rootfs bytes differ from config")
        return {"status": "passed", "config_digest": config_digest, "source_sha": source,
                "architecture": "amd64", "os": "linux", "layers": len(layers),
                "verified_uncompressed_bytes": total, "tag": tag,
                "scope": "Saved config and ordered rootfs identity; not a security or functional acceptance audit"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", required=True, type=Path)
    parser.add_argument("--tag", required=True)
    parser.add_argument("--source", required=True)
    parser.add_argument("--expected-config")
    args = parser.parse_args()
    print(json.dumps(inspect_archive(args.archive, args.tag, args.source, args.expected_config), indent=2))
