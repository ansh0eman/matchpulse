# Reproduction commands and artifacts

Use Node24 and the locked Python3.12 environment. `backend/.venv/bin/python` was used directly in this sandbox to avoid dependency-cache/network writes; `uv run --project backend python` is the equivalent project command after frozen sync. runtime.json records exact installed versions. No dependency or old inference source was changed.

```sh
uv sync --project backend --frozen --extra dev
npm ci --prefix poc --ignore-scripts
# Reuse/verify the existing pinned source checkout; clone only if absent.
git -C upstream/football-simulator rev-parse HEAD
cd poc
node --import tsx src/tracking/generate.ts
node --import tsx src/tracking/generate.ts --validation
node --import tsx src/tracking/generate.ts --2hz
cd ..
backend/.venv/bin/python backend/scripts/step25/separation.py
backend/.venv/bin/python backend/scripts/step25/diagnostics.py
backend/.venv/bin/python backend/scripts/step25/compare.py development
backend/.venv/bin/python backend/scripts/step25/compare.py validation
# Stop here and verify the frozen source/config hash before opening holdout.
cd poc
node --import tsx src/tracking/generate.ts --holdout
cd ..
backend/.venv/bin/python backend/scripts/step25/compare.py holdout
backend/.venv/bin/python backend/scripts/step25/verify.py
backend/.venv/bin/python backend/scripts/step25/replication.py
backend/.venv/bin/python backend/scripts/step25/ml_diagnostic.py
backend/.venv/bin/python backend/scripts/step25/failure_contexts.py
backend/.venv/bin/python backend/scripts/step25/halftime_audit.py
backend/.venv/bin/python backend/scripts/step25/figures.py
backend/.venv/bin/python backend/scripts/step25/reports.py
backend/.venv/bin/python -m pytest backend/tests -q
cd poc
node node_modules/typescript/bin/tsc --noEmit
node --import tsx --test tests/*.test.ts
```

Executed Node path: `/Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node`. The default Node26/tsx IPC launcher failed in this sandbox; explicit Node24 with `--import tsx` works. The initial comparison was interrupted(exit130) before producing selection results and replaced by equivalent shared-comparison execution for efficiency. Available command outcomes are retained in command-results.json (validation completion is artifact-backed; its discarded original shell handle means no exit code is asserted); logs and detailed per-match outputs are local/ignored, compact summaries remain reviewable. The earlier schema-strict pilot failed on stale owner references and is archived; it is not counted as an independent experiment.

Do not rerun validation to select a new candidate after seeing this holdout. A fresh clone can regenerate these fixed cohorts/configurations for reproduction, but any new tuning requires a different untouched evaluation set. Generator/extraction fingerprints deliberately refuse silent stale-cache reuse. New generated data is large and ignored under the Step 2.5 brief; all previously tracked Step1/2 experiments and Git history are preserved.

Review artifacts: development-summary.json, validation-summary.json, frozen.json/frozen.sha256/freeze-receipt.json, holdout-summary.json, holdout-feature-replication.json, diagnostics.json, verification.json, examples.json, schema JSONs, runtime.json and source/license audit. Small fixtures include every geometry reference for selected success/false examples. Full UUID feeds can be regenerated; no source-audit or labels are input to inference.
