# Saved-image identity across Docker stores

The prepared publishing workflow originally compared `docker image inspect .Id` to a local value. The local Docker Desktop store actually reports an OCI **index digest**, while a classic Linux store can identify the loaded image by its **config digest**. Comparing those values could reject identical executable content or encourage an unsafe bypass.

## Verified cause and repair

The actual saved prior AMD64 image (`matchpulse-viewer:step3e-amd64`, source 2b7097200549c264c2ceb8aeca9b68a6b1d1f973) has a different index ID from its archived config. `check_saved_viewer_image.py` verified config `sha256:a4a0404ab3c8acfdfd16be63e21916f68f3085f580abbb1f4947bfe76408fd9d`, Linux AMD64, source label, reviewed non-root user and **16 original layers / 500,269,568 decompressed bytes**. This probe is historical evidence, not acceptance of that old application for release.

The checker reads archive members without extracting a filesystem. It requires one expected image/tag, unique paths and JSON keys, bounded metadata/member/layer counts and byte sizes, safe declared config/layer paths, no archive links/devices, correct config-byte hash, expected source and Linux AMD64. For OCI blobs it checks compressed blob hashes; for both OCI and classic archives it independently hashes each decompressed layer against the config's ordered rootfs diff IDs. The config digest therefore binds runtime settings and ordered executable filesystem content across store formats.

The manual public-only workflow checks the entire downloaded archive SHA256, validates this identity, loads the image, saves the loaded tag and validates it again against the **same expected config**. It then runs the source-specific HTTP smoke checker at 0.5 CPU / 1 GiB before a possible registry push. No CI rebuild or PAT is involved. The workflow now checks out the image's labeled commit, so that commit must include the verifier. Current future assets use release tag `viewer-fixtures-v2`; no release or workflow dispatch has occurred.

The HTTP smoke checker also verifies the new native goal's exact event/tracking hashes, quarter-second frames, 0–0→1–0 score and recomputed proof. The saved Foundry capture stays a separate original match, and its actual HTTP model-request count stays null. The checker makes zero model calls.

## Tests and limits

**14 targeted tests passed** for classic and OCI/gzip archives, altered config/layer bytes, wrong architecture/source/root user/expected digest, duplicate JSON/archive paths, traversal references, extra images/tags and symlinks. Full backend regression: **212 passed / two deliberately disabled live tests skipped**, 18.89 seconds. Workflow YAML parses and both shell bodies pass `bash -n`. The strengthened HTTP smoke check passed against the accepted native application.

Actual current-source AMD64 build, save/load roundtrip and browser acceptance are the next gate. The Linux GitHub workflow is not executed yet; fixture-format tests are not a claim of a completed independent Linux-store transfer. Registry config/digest/anonymous pull and public HTTPS remain unverified. An identity match does not replace security, license, source-provenance or functional acceptance, and does not authorize publishing an unfinished product.
