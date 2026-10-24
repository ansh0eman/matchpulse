"""Assemble genuine scene recordings and local narration; no hosted services."""
import hashlib
import json
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[2]
video = root / "backend/output/release/video"
narration = root / "backend/output/release/narration"
records = json.loads((video / "recordings.json").read_text())["scenes"]
script = json.loads((root / "research/step3e/demo-script.json").read_text())
voice = json.loads((narration / "metadata.json").read_text())
assert voice["script_sha256"] == hashlib.sha256((root / "research/step3e/demo-script.json").read_bytes()).hexdigest()
assert [r["id"] for r in records] == [s["id"] for s in script["scenes"]]
assert sum(r["seconds"] for r in records) == 112
assert all(not r["page_errors"] for r in records)
command = ["ffmpeg", "-y", "-hide_banner"]
for row in records:
    command += ["-ss", str(row["trim_start_seconds"]), "-t", str(row["seconds"]), "-i", row["path"]]
command += ["-i", str(narration / "narration.wav"), "-i", str(narration / "narration.srt")]
filters = [f"[{i}:v]fps=25,setpts=PTS-STARTPTS[v{i}]" for i in range(len(records))]
filters += ["".join(f"[v{i}]" for i in range(len(records))) + f"concat=n={len(records)}:v=1:a=0[v]"]
output = video / "matchpulse-demo.mp4"
command += ["-filter_complex", ";".join(filters), "-map", "[v]", "-map", "6:a:0", "-map", "7:s:0",
            "-c:v", "libx264", "-preset", "fast", "-crf", "19", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "160k", "-c:s", "mov_text", "-metadata:s:s:0", "language=eng",
            "-metadata", "title=MatchPulse AI — watch, question, verify",
            "-metadata", "comment=Synthetic match fixtures. Genuine saved Microsoft Foundry execution. Synthetic stock narration: Kokoro-82M / hexgrad, af_heart, Apache 2.0. No new hosted inference.",
            "-t", "112", "-movflags", "+faststart", str(output)]
subprocess.run(command, check=True)
probe = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration,size:stream=codec_name,codec_type,width,height", "-of", "json", str(output)]))
assert 111.8 <= float(probe["format"]["duration"]) < 120
assert {s["codec_type"] for s in probe["streams"]} == {"video", "audio", "subtitle"}
metadata = {"sha256": hashlib.sha256(output.read_bytes()).hexdigest(), "probe": probe,
            "narration": "Local Kokoro stock af_heart, no cloning or hosted inference",
            "captions": "Embedded English track and narration.srt sidecar; proportional alignment, not forced alignment",
            "source": "Six real browser scene recordings, trimmed and joined with local narration",
            "review": "Assembly checks only; visual and listening review required before publication"}
(video / "assembly.json").write_text(json.dumps(metadata, indent=2) + "\n")
print(json.dumps(metadata))
