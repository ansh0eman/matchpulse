# Reproducible demonstrations (all current outputs use OFFLINE FAKE)

Prerequisites: existing locked backend Python3.12 environment, existing Step3A/Step2 source data. No Azure credentials required for these commands. Generate the date-seed source with the unchanged Step3A instructions if it is missing. Each command replays canonical source observations and verifies registry facts before selecting a scheduled incident.

Goal-driven adaptive incident:

```sh
backend/.venv/bin/python -m matchpulse.agents.cli studio --events data/step2/inference/02840f35-cb05-4812-aa9d-1237e4ab1b9d.jsonl --insight-type goal_context --provider fake --runtime offline --output backend/output/agents/goal.json
```

Positional branch:

```sh
backend/.venv/bin/python -m matchpulse.agents.cli studio --events data/step25/inference/f2a3e267-d3e5-4c90-ae07-b5a39607ab2d.jsonl --tracking data/step25/inference/f2a3e267-d3e5-4c90-ae07-b5a39607ab2d.tracking.jsonl.gz --positional-config research/step25/artifacts/selected.json --insight-type observed_line_height_change --audience analyst --provider fake --output backend/output/agents/position.json
```

Fan/analyst comparisons: repeat with `--audience fan` or `--audience analyst` and separate output files. `--favorite-team NORTH` or `SOUTH` changes editorial emphasis only. All compiled factual sentences retain claim references. Only English is supported; unsupported language requests are rejected.

Failure recovery (bounded fake timeout):

```sh
backend/.venv/bin/python -m matchpulse.agents.cli studio --events data/step2/inference/02840f35-cb05-4812-aa9d-1237e4ab1b9d.jsonl --insight-type goal_context --fail-role narrator --failure timeout --timeout 0.03 --output backend/output/agents/recovery.json
```

Ask the Match narrow investigation:

```sh
backend/.venv/bin/python -m matchpulse.agents.cli ask --events data/step2/inference/02840f35-cb05-4812-aa9d-1237e4ab1b9d.jsonl --insight-type goal_context --question before_goal --output backend/output/agents/question.json
```

Questions are a controlled CLI set, not a completed free-text chatbot. before_goal resolves up to five actual preceding observations within12s; it does not infer assists. shot_sequence returns referenced events. why_highlighted explains the deterministic editorial rule. position_change/compare_position render approved sampled measurements. coach_intent/xg/possession_percentage/counterfactual are declined. This separate deterministic workflow makes no ordinary-broadcast model calls.

Audience timeline (original sources/facts unchanged):

```sh
backend/.venv/bin/python -m matchpulse.agents.cli timeline --events backend/output/stories/source/5cc7f774-c215-4773-9318-3a01ad8b23af.jsonl --audience fan --output backend/output/agents/fan-timeline.json
backend/.venv/bin/python -m matchpulse.agents.cli timeline --events backend/output/stories/source/5cc7f774-c215-4773-9318-3a01ad8b23af.jsonl --audience analyst --output backend/output/agents/analyst-timeline.json
```

The honest demo remains0–0; goal/equalizer/position examples are separate explicitly identified matches, never combined into one fictional source match. Equalizer source031c8ca1-662c-4255-a615-eb29bd25c249 was the first equalizing-goal file in lexicographic Step2 source order (four inspected); this is exploratory example selection, not representative sampling.

Complete offline tests, old story review, three configurations, source cases and recovery cases:

```sh
backend/.venv/bin/python backend/scripts/step3b_review.py
```

Artifacts retain source claim IDs, schemas, fake traces, controlled plans, compiled visual metrics, evaluation records and failure recovery. Full local CLI outputs remain ignored. Actual Foundry commands are in foundry-setup.md; **none has succeeded here**. Cached fake files are labeled offline_fake and must never be presented as genuine cached model calls.
