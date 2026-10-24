# Local ₹0 narration proof

Verified October 24, 2026. A local CPU run generated only the public test sentence below. No Foundry, Azure Speech, hosted inference, account signup, subscription or paid API was used. The application and frozen Python environments were not modified. macOS system voices were not used.

## Permission and provenance

- The official [hexgrad/Kokoro-82M model card](https://huggingface.co/hexgrad/Kokoro-82M) labels the model repository **Apache-2.0**, describes Apache-licensed weights and explicitly permits production use. The observed model repository metadata has no separate standalone LICENSE file; the permission basis is its published repository/model-card license declaration, not an invented extra license.
- The official [`hexgrad/kokoro` inference library](https://github.com/hexgrad/kokoro) has an [Apache-2.0 LICENSE](https://github.com/hexgrad/kokoro/blob/main/LICENSE). This run uses the corresponding PyPI package `kokoro==0.9.4`.
- The [official voice catalog](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md) lists **af_heart**, which is stored in the same Apache-licensed model repository. No separately restrictive stock-voice license was found in the inspected repository. The run uses that unmodified stock embedding, not a custom voice clone or a real-person imitation.
- English preprocessing uses the official [Explosion en_core_web_sm 3.8.0](https://github.com/explosion/spacy-models/blob/master/meta/en_core_web_sm-3.8.0.json), whose published model metadata says MIT. Its own source acknowledgments remain in the installed package.

For a published demo, identify narration as a synthetic stock voice and credit “Kokoro-82M / hexgrad, stock af_heart, Apache 2.0,” linking the model card and inference-code license. Preserve the model card's data acknowledgments. If distributing code, weights or runtime dependencies, include their original licenses/notices and any modification notices; this proof does not bundle those assets into MatchPulse or its viewer image. Do not imply the model author or voice endorses MatchPulse. There is no paid-service license to activate.

## Exact assets and isolation

All tooling, dependencies, cache and outputs are local under `/tmp/matchpulse-tts`; they are not repository files. Public downloads were unauthenticated. Model revision: `f3ff3571791e39611d31c381e3a41a3af07b4987`.

| Official asset | SHA-256 |
|---|---|
| config.json | 5abb01e2403b072bf03d04fde160443e209d7a0dad49a423be15196b9b43c17f |
| kokoro-v1_0.pth | 496dba118d1a58f5f3db2efc88dbdc216e0483fc89fe6e47ee1f2c53f18ad1e4 |
| voices/af_heart.pt | 0ab5709b8ffab19bfd849cd11d98f75b60af7733253ad0d67b12382a102cb4ff |

The weight hash matches the model card. The voice hash prefix matches VOICES.md. PyTorch loads both official tensors using `weights_only=True` in the inspected inference library. The runner supplies explicit pinned local model/config/voice paths rather than silently selecting a future main-branch weight.

Verified environment: CPython 3.12.13; kokoro 0.9.4; torch 2.14.1; transformers 5.20.2; misaki 0.9.4; soundfile 0.14.0; spaCy 3.8.16; en_core_web_sm 3.8.0. A complete resolved package freeze is retained at `/tmp/matchpulse-tts/requirements.lock.txt`. Dependencies installed successfully and the actual CPU generation passed; compatibility is not inferred from installation alone.

## Reproduce the local proof

The current saved runner is `/tmp/matchpulse-tts/proof.py`; it reads the pinned asset manifest `/tmp/matchpulse-tts/model-files.json`. To repeat that local proof:

```sh
HF_HOME=/tmp/matchpulse-tts/hf \
HF_HUB_DISABLE_IMPLICIT_TOKEN=1 \
TORCH_HOME=/tmp/matchpulse-tts/torch \
/tmp/matchpulse-tts/venv/bin/python /tmp/matchpulse-tts/proof.py
```

For a fresh equivalent isolated setup, create a Python 3.12 venv and install the official package and English model:

```sh
uv venv /tmp/matchpulse-tts/venv --python 3.12
UV_CACHE_DIR=/tmp/matchpulse-tts/uv-cache uv pip install \
  --python /tmp/matchpulse-tts/venv/bin/python \
  kokoro==0.9.4 soundfile==0.14.0 torch==2.14.1 \
  transformers==5.20.2 misaki==0.9.4 spacy==3.8.16
UV_CACHE_DIR=/tmp/matchpulse-tts/uv-cache uv pip install \
  --python /tmp/matchpulse-tts/venv/bin/python \
  https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl
```

The generation core is:

```python
from huggingface_hub import hf_hub_download
from kokoro import KModel, KPipeline
import numpy as np
import soundfile as sf
import torch

repo = 'hexgrad/Kokoro-82M'
revision = 'f3ff3571791e39611d31c381e3a41a3af07b4987'
asset = lambda name: hf_hub_download(repo, name, revision=revision)
torch.set_num_threads(4)
model = KModel(repo_id=repo, config=asset('config.json'),
               model=asset('kokoro-v1_0.pth')).to('cpu').eval()
pipeline = KPipeline(lang_code='a', repo_id=repo, model=model)
sentence = 'MatchPulse lets you inspect the evidence behind a football explanation.'
parts = list(pipeline(sentence, voice=asset('voices/af_heart.pt'), speed=0.95))
audio = np.concatenate([part.audio.numpy() for part in parts])
assert len(audio) and np.isfinite(audio).all()
sf.write('/tmp/matchpulse-tts/proof.wav', audio, 24000, subtype='PCM_16')
```

Set the same HF_HOME/TORCH_HOME before running the core; retain/verify the hashes above. The first setup downloads public packages and model files, not cloud inference. The tested local environment already contains them.

## Actual output and remaining review

Text: “MatchPulse lets you inspect the evidence behind a football explanation.” Output `/tmp/matchpulse-tts/proof.wav`: **5.15 seconds**, 24,000 Hz, mono, PCM 16-bit, 123,600 samples, 247,244 bytes. SHA-256: `10e433f847648db65689a347153cdee607f110cc1ed4ec662ce1970a9ea3cf68`. Generation, including constructing the local model, took **2.869 seconds** in this one run; it is not a benchmark or latency guarantee. Peak amplitude 0.352 and RMS 0.0478; all samples are finite. `proof.json` contains the exact text, phonemes, versions and metadata. WAV decoding independently confirmed the sample count and duration.

No full script, final mix or public video was synthesized or published by this proof. The release owner should listen for pronunciation/pace, synthesize the approved final script locally, align narration with genuine screen recordings, add readable captions, inspect the full result and confirm a duration strictly below two minutes. Keep voice synthesis separate from claims of Microsoft Foundry model execution. Final audio hashes and credits belong in the actual release evidence once that work is complete.

## Subsequent full-script synthesis — completed locally

The release owner subsequently authored `research/step3e/demo-script.json` and authorized all six scenes. The initial closing text exceeded its eight-second slot's 0.3s margin by 0.2s at the maximum allowed speed, so synthesis stopped without trimming text. The owner then changed the goal slot from 20s to 19s and the closing slot from 8s to 9s, retaining a 112s total and all original wording. The revised script was synthesized successfully on local CPU using the same pinned model and stock voice. HF/Transformers offline flags were enabled; there were **zero hosted inference calls**.

| Scene | Timeline start | Assigned duration | Actual speech | Kokoro speed | Padding |
|---|---:|---:|---:|---:|---|
| opening | 0s | 14s | 13.600s | 1.06 | 0.15s before / 0.250s after |
| goal | 14s | 19s | 16.700s | 1.00 | 0.15s before / 2.150s after |
| proof | 33s | 30s | 24.575s | 1.00 | 0.15s before / 5.275s after |
| restraint | 63s | 13s | 12.325s | 1.00 | 0.15s before / 0.525s after |
| agents | 76s | 27s | 26.525s | 1.13 | 0.15s before / 0.325s after |
| close | 103s | 9s | 8.550s | 1.00 | 0.15s before / 0.300s after |

Every speech segment fits within its assigned duration minus at least 0.3s. No words were removed, no speech was cut, and no speed exceeded 1.15. Each scene has an original speech WAV and an exact-duration padded WAV under the ignored local directory `backend/output/release/narration/`.

The combined `narration.wav` is **112.000 seconds**, mono 24,000 Hz PCM16, 2,688,000 frames and 5,376,044 bytes. SHA-256: `cefbb4f26c49d05b03e1f44dd21f12300cd6b44e51e28734cab8a826e348f458`. All floating-point samples are finite; peak amplitude 0.6751, RMS 0.04914, no full-scale clipping. This local synthesis took 24.273s in one run, not a promised performance bound.

`metadata.json` records the exact text, per-scene attempts/speeds, actual speech/padding, source model/voice hashes, package versions, output hashes and zero-hosted-call boundary. Approved script SHA-256: `f6dd25c288432e7c785beb96e44a452cd05b847570c62a8353e02402d267cbb7`; the runner checked that its bytes remained unchanged during synthesis.

`narration.srt` contains **22** ordered, nonoverlapping captions. Independent checks confirmed that joining their words reproduces the complete approved script exactly, and every timestamp is within 0–112s. Its SHA-256 is `977c54fcf1764c0075c7930008e5a5e6b928d3a4c9d18efff758335dd072bea8`. Timing is word-count-proportional within actual speech spans, **not forced word alignment**. Listening and final-video synchronization review remain necessary; successful file validation is not an independent speech-quality or usability review.

Exact local reproduction, using the current approved script and existing isolated assets:

```sh
/tmp/matchpulse-tts/venv/bin/python /tmp/matchpulse-tts/narrate_release.py
```

The runner sets its own isolated cache and offline flags, verifies pinned asset hashes, allows bounded speed adjustment only within 0.95–1.15, and fails explicitly if a scene cannot fit. It pads rather than stretching the final audio timeline. WAV decoding independently confirmed all scene lengths and the combined 112s duration. Final screen recording, mixing, public upload and submission are owned by the release process; none is implied by producing this audio track.
