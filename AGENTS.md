# MatchPulse AI agent instructions

Build an original synthetic-football intelligence system: Detect -> Prove -> Explain -> Explore. Preserve Step 1 provenance and research. Current upstream source is pinned at 39529b19c40868d66aa47db084ebc9ea29c86e70 (MIT); retain THIRD_PARTY_NOTICES.md. Never change that source or substitute an arbitrary npm release silently.

Step 2 is Python 3.12/Pydantic v2 with uv lockfile, causal event analytics, rolling/River comparisons and EvidencePacks. The verdict and actual measurements in research/step2-final-verdict.md and step2-evaluation-results.md outrank aspirations. Do not claim Foundry, UI, deployment, real-world calibration, coach intent or detector accuracy beyond actual evidence.

Before changes inspect git status and give a precise file plan. Preserve unrelated edits. Do not commit, push, merge or deploy unless explicitly requested. No cloud/LLM calls are needed for local analytical work. Keep changes scoped.

Inference modules schemas/ingestion/signals/replay/detectors/evidence may use only canonical observations, opaque UUID match identity and detector configuration. Never import evaluation or read manifests, ground-truth, results, source audit files, labels or policy-encoding paths. CLI requires a UUID-named JSONL. Event sequence/source indices must remain contiguous; administrative control events must not leak via gaps. Tests must cover online-prefix invariance, hidden metadata rejection, evidence recomputation and match isolation.

Evaluation uses 56 independent seed families (24 development, 32 holdout), grouped by seed across five scenarios. Original Step 1 seeds excluded. Development config is frozen and hashed before holdout scoring. Do not tune on final holdout; new tuning requires a new untouched test set and transparent reporting. Report null-match alert rate, miss/duplicate counts, denominators, uncertainty and failures. Zero-alert detectors do not count as successful detection.

Commands from repository root:
- `uv sync --project backend --frozen --extra dev`
- `uv run --project backend pytest backend/tests -q`
- `cd poc && npm run typecheck && npm test` (artifact tests require both Step 1 experiments)
- `cd poc && npx tsx src/step2-dataset.ts` (development); add `--holdout` for held-out generation
- `uv run --project backend python backend/scripts/evaluate.py development` then `holdout` only after freezing
- `uv run --project backend matchpulse data/step2/inference/<UUID>.jsonl --debug --output backend/output/demo.json`

The user explicitly requested that generated datasets, experiment outputs, EvidencePack exports and logs be versioned in this private repository. Keep installed dependencies, virtual environments, credentials and the separate upstream checkout excluded. Research summaries, configuration hashes, code, tests, protocol, charts and uv.lock are reviewable artifacts. Never fabricate metrics, remove meaningful failing assertions or call an arbitrary score a probability.

For verbose noninteractive test/build/search/log output use `set -o pipefail` and pipe through distill with a precise question and required output fields; wait for completion. Skip for small output or bounded exact evidence. If Distill omits requested fields or fails open, inspect bounded deterministic slices. Never rely on lossy summaries alone for security, destructive or production decisions. This environment forbids permission escalation; use the permitted tool execution path.
