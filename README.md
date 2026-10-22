# MatchPulse AI — simulator research workspace

**Verdict: CONDITIONAL GO.** Reuse the pinned MIT source through an adapter for offline synthetic scenarios. Press-only intervention is weak; the bundled high-press policy shows a measurable spatial shift. Detector accuracy and real-world validity are not established.

Start with [the verdict](research/feasibility-verdict.md), then [the measured tactical experiment](research/tactical-experiment.md). This workspace contains no main application, frontend, cloud configuration or AI provider integration. Nothing has been committed, pushed or published.

## Reports and teaching path

- [simulator-audit.md](research/simulator-audit.md): source, verified APIs, example events, performance, tests and limitations.
- [licensing-audit.md](research/licensing-audit.md): MIT source, deficient npm artifact, dependency inventory and alternatives.
- [architecture-analysis.md](research/architecture-analysis.md): actual function-by-function execution trace, types and state transitions.
- [event-schema.md](research/event-schema.md): coordinate, timestamp, actor, ordering and evidence contract.
- [tactical-experiment.md](research/tactical-experiment.md): matched-seed press-only and bundled-policy measurements.
- [feasibility-verdict.md](research/feasibility-verdict.md): adoption conditions, alternatives, architecture and next milestone.
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md): retained upstream license and dependency notice pointers.

## Run on Node 24

The current workspace already contains the pinned research checkout and installed PoC dependencies. From `poc/`:

```sh
npm ci --ignore-scripts
npm run experiment
npm run experiment -- --bundle
npm run typecheck
npm test
python3 src/replay-example.py
```

Generate both experiments before running the artifact tests. Each experiment runs 12 baseline/intervention pairs plus one repeat. The two modes intentionally share baseline seeds; their 48 scenario runs are **not 48 independent seeds**. Generation takes about a minute for both modes on the measured machine; actual time varies. Outputs occupy roughly 429 MiB including source audit projections. Do not feed output directory names or truth into a detector.

For a fresh copy of this research's original files, restore the external source at the workspace root first (do not initialize a production app):

```sh
git clone https://github.com/tbleckert/football-simulator.git upstream/football-simulator
git -C upstream/football-simulator checkout --detach 39529b19c40868d66aa47db084ebc9ea29c86e70
git -C upstream/football-simulator rev-parse HEAD
```

The PoC imports this checkout directly. It does not require installing upstream dependencies. Do not replace it with an arbitrary npm release. The lockfile pins the PoC dependencies. The source pin is documented here, not automatically fetched by npm.

To repeat upstream's own four suites and typecheck (optional, separate development tooling):

```sh
cd upstream/football-simulator
npm ci --ignore-scripts
npm test
npm run typecheck
```

The upstream development dependency audit has advisories; see the saved audit and licensing report. No upstream demo server was launched.

## Files and data flow

`poc/src/experiment.ts` executes first. It calls `runMatch()` in `simulation.ts`, which constructs fictional teams and a seeded RealTimeEngine, ticks to fulltime, applies the optional minute-60 policy, and normalizes source events with `schema.ts`. `metrics.ts` computes fixed-window observations. `benchmark.ts` separately compares snapshot retention. `replay-example.py` demonstrates streaming JSONL into standard Python; the future Pydantic backend is not implemented.

`poc/tests/` contains engine integration, reproducibility, schema/reference checks, intervention-prefix comparisons, snapshot equivalence, and artifact/source/hash integrity tests.

`poc/output/` contains canonical JSONL, baseline repeat, roster, ground truth, result statistics, benchmark measurements and logs. `output/bundle/` holds the second policy experiment. `audit/*.source.jsonl` contains corresponding source projections with administrative control events removed. `ground-truth.json` is a separate evaluation artifact. `results.json` holds metrics and hashes; it must not be an inference input. The matching canonical line's `evidence.source_index` joins to its audit projection. Events have run-local IDs; supply an opaque match ID during later ingestion.

`upstream/` is an inspection-only dependency checkout plus downloaded npm artifact. Our source adapter does not modify it. Root `.gitignore` excludes upstream, node_modules and generated outputs for any future version control; outputs remain available locally for review. No Git repository was created in the workspace.

## Next milestone

Implement Python ingestion, rolling signals, a causal detector, and an evidence pack with disjoint evaluation seeds and null scenarios. Cut counterfactual simulation, animated tracking and cloud/agents from that milestone. Do not treat the known injected minute as a detected turning point.
# matchpulse
