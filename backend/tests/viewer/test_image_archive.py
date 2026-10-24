"""Saved-image verification rejects changed runtime bytes and ambiguous metadata."""
import gzip
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tarfile
import pytest

spec = importlib.util.spec_from_file_location("saved_image_check", Path(__file__).resolve().parents[2] / "scripts/check_saved_viewer_image.py")
check = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check)
SOURCE = "a" * 40
TAG = "matchpulse-viewer:release-amd64"


def fixture(tmp_path, oci=True, fault=""):
    layer = b"a small deterministic rootfs layer for identity tests"
    blob = gzip.compress(layer, mtime=0) if oci else layer
    layer_name = "blobs/sha256/" + hashlib.sha256(blob).hexdigest() if oci else "b" * 64 + "/layer.tar"
    config = {"architecture": "amd64", "os": "linux", "config": {"User": "studio", "Labels": {"org.opencontainers.image.revision": SOURCE}}, "rootfs": {"type": "layers", "diff_ids": ["sha256:" + hashlib.sha256(layer).hexdigest()]}}
    if fault == "architecture": config["architecture"] = "arm64"
    if fault == "source": config["config"]["Labels"]["org.opencontainers.image.revision"] = "b" * 40
    if fault == "root": config["config"]["User"] = "root"
    raw = json.dumps(config).encode()
    if fault == "duplicate_json": raw = raw[:-1] + b', "os":"linux"}'
    digest = hashlib.sha256(raw).hexdigest()
    config_name = "blobs/sha256/" + digest if oci else digest + ".json"
    if fault == "config_bytes": raw += b" "
    if fault == "layer_bytes": blob += b"changed"
    manifest = [{"Config": config_name, "RepoTags": [TAG], "Layers": [layer_name]}]
    if fault == "path": manifest[0]["Layers"] = ["../layer.tar"]
    if fault == "multiple": manifest *= 2
    if fault == "tag": manifest[0]["RepoTags"] += ["another:image"]
    path = tmp_path / "image.tar"
    with tarfile.open(path, "w") as archive:
        def add(name, body):
            item = tarfile.TarInfo(name); item.size = len(body)
            archive.addfile(item, io.BytesIO(body))
        add("manifest.json", json.dumps(manifest).encode())
        add(config_name, raw)
        add(layer_name, blob)
        if fault == "duplicate_path": add(config_name, raw)
        if fault == "link":
            item = tarfile.TarInfo("unexpected-link"); item.type = tarfile.SYMTYPE; item.linkname = "outside"
            archive.addfile(item)
    return path, "sha256:" + digest


@pytest.mark.parametrize("oci", [False, True])
def test_classic_and_oci_archives_have_canonical_config_and_rootfs_identity(tmp_path, oci):
    path, digest = fixture(tmp_path, oci)
    result = check.inspect_archive(path, TAG, SOURCE, digest)
    assert result["status"] == "passed" and result["config_digest"] == digest
    assert result["layers"] == 1 and result["architecture"] == "amd64"


@pytest.mark.parametrize("fault,reason", [
    ("architecture", "AMD64"), ("source", "revision"), ("root", "non-root"),
    ("config_bytes", "Config bytes"), ("layer_bytes", "Layer blob"),
    ("duplicate_json", "Duplicate JSON"), ("duplicate_path", "duplicate archive"),
    ("path", "Unsafe layer"), ("multiple", "exactly one"), ("tag", "Unexpected image tag"),
    ("link", "links/devices"),
])
def test_changed_or_ambiguous_images_fail_closed(tmp_path, fault, reason):
    path, _ = fixture(tmp_path, fault=fault)
    with pytest.raises(ValueError, match=reason):
        check.inspect_archive(path, TAG, SOURCE)


def test_classic_layer_corruption_and_wrong_expected_config_fail(tmp_path):
    path, digest = fixture(tmp_path, oci=False, fault="layer_bytes")
    with pytest.raises(ValueError, match="Rootfs bytes"):
        check.inspect_archive(path, TAG, SOURCE, digest)
    path, _ = fixture(tmp_path)
    with pytest.raises(ValueError, match="accepted config"):
        check.inspect_archive(path, TAG, SOURCE, "sha256:" + "0" * 64)
