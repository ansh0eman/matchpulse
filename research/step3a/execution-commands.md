# Reproduction

From repository root, use existing locked Python3.12 environment (`uv sync --project backend --frozen --extra dev` when dependencies need installation). No new runtime dependencies were introduced.

Generate the declared actual demo (first/only date seed20261023; no intervention):

```sh
cd poc
/Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node --import tsx src/stories-demo.ts
cd ..
```

Event-only replay:

```sh
backend/.venv/bin/python -m matchpulse.stories.cli --events backend/output/stories/source/5cc7f774-c215-4773-9318-3a01ad8b23af.jsonl --output backend/output/stories/event-only --debug
```

Tracking enrichment:

```sh
backend/.venv/bin/python -m matchpulse.stories.cli --events backend/output/stories/source/5cc7f774-c215-4773-9318-3a01ad8b23af.jsonl --tracking backend/output/stories/source/5cc7f774-c215-4773-9318-3a01ad8b23af.tracking.jsonl.gz --positional-config research/step25/artifacts/selected.json --output backend/output/stories/demo --debug
backend/.venv/bin/python backend/scripts/step3a_review.py
```

Runner additionally replays the two existing complete Step2.5 fresh/stale UUID feeds and the declared goal-bearing Step2 UUID, verifies outputs, repeats runs byte-for-byte, tests prefixes, exports schemas, compressed canonical fixtures, metrics and packet. Full literal argv, cwd, timings and statuses: artifacts/evaluation.json. Step2.5 bulk inputs must exist locally (regenerate with its original pinned protocol if absent); missing sources fail clearly. Complete new canonical demo fixture can be decompressed from artifacts/5cc7f774-c215-4773-9318-3a01ad8b23af.jsonl.gz into an identically UUID-named JSONL for event-only replay without simulator generation. Tracking bulk stays local.

Full suites executed by runner:

```sh
backend/.venv/bin/python -m pytest backend/tests -q
cd poc
/Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node --import tsx --test tests/*.test.ts
/Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node node_modules/typescript/bin/tsc --noEmit
```

Use a fresh output directory per replay. Exports: timeline, insights, claims, evidence-index, suppressed, summary, presentation and agent-inputs JSON. Full histories/frames belong in local evidence inspection, never an LLM prompt. Debug prints only first12 timeline items.
