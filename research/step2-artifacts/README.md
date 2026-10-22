# Reproducible Step 2 evidence

`frozen-config.json` and its SHA-256 record the selected parameters, development protocol/seeds and inference source hashes before holdout scoring. `selection-audit.json` records correction of a development-only rule that initially favored silent ADWIN. Final holdout results cannot change the selected model.

Compact development/holdout summaries, per-match CSV, verification argv/exit statuses, installed River API/source excerpts, dependency notices and charts are retained for review. Detailed development.json/holdout.json/example-evidence.json and command logs are generated locally and ignored. Canonical match streams and full evaluation metadata are in ignored data/step2/. Evidence exports are in ignored backend/output/.

Use backend/scripts/evaluate.py and plot_results.py to regenerate results and charts. Logs are retained locally rather than pasted into reports. Missing detailed data requires regeneration; summary files are observations, not a substitute input to inference.
