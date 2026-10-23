# Trace one click through MatchPulse

## 1. Open the product

`App` in web/src/App.tsx initializes Theatre to line-shift/3360; the detailed Studio retains its original open-play/356 start. Its `params` key includes scenario, clock, audience and favorite. Only `loadedParams === params` makes a snapshot visible. Seeking immediately hides the previous score/story before a replacement can arrive.

The effect calls `get('/api/view?...')` from web/src/api.ts with an AbortController. `viewer.api.dispatch` parses the closed `ViewQuery`; `service.checked` uses a catalog entry, not a caller path. `source` loads the canonical observations and independently verified claims. `visible_items` enforces clock and audience; `render` compiles a bounded presentation. `view` returns prefix score, source frame, approved timeline and provenance. `Pitch` places original coordinates; `momentCopy` changes wording only from verified incident types and metrics.

The new side-by-side lead uses `before`, `after`, `change` and the unique tracking references in that compiled overlay. It neither reruns a detector in JavaScript nor supplies facts to the backend. `choose` now increments the reload key even for the same scenario: clearing data without changing query parameters previously left the current chapter blank.

## 2. Open Proof Lens

`inspect` selects the current approved claim and opens the drawer. The proof effect requests `/api/proof` with the same scoped parameters and claim ID. `api.dispatch` calls `proof.receipt`, which rechecks visibility/claim identity and recomputes positions from original source. `ProofSummary` presents the returned calculation and original selected samples. Expanding contributors shows original IDs/coordinates; the context-weighted aggregate stays separate from a single snapshot proxy. Downloading serializes this server receipt unchanged.

Tradeoff: recomputation costs more than trusting a cached headline, but makes a concrete explanation inspectable. Original canonical sources are cached in memory; this is progressive replay, not a deployed live ingestion feed. Stale evidence can produce refusal. No cloud model endpoint is invoked by a viewer click.

## 3. Inspect the real agents

`service.activity` revalidates the saved enriched goal through `verify_publication`. `WorkflowGraph` and `DecisionEvidence` read saved events: Director route, verified handoff, Challenger narrowing, evidence-first narration revision and publisher check. No missing event becomes success by default. Tactical Analyst was skipped in this event-only goal; the historical compiler rejection/fallback remains separate. The recorded run's local MAF graph used Foundry inference; no registered Agent Service agents or delivered cloud traces are implied.

## 4. Reproduce and inspect

```sh
MATCHPULSE_LIVE_TEST=0 MATCHPULSE_LIVE_WORKFLOW_TEST=0 backend/.venv-foundry/bin/python -m pytest backend/tests -q
cd poc && npm run typecheck && npm test
cd ../web && npm run build
MATCHPULSE_TEST_URL=http://127.0.0.1:5173 npx playwright test
```

Use the packaged preview for release acceptance, then the actual HTTPS hostname after deployment. Expected: preserved +10.01m/59 samples, no goal before its boundary, no event-only players, stale 132s refusal, actual saved Challenger decision and enriched/fallback labels. New tests cover 1366×768, 1440×900, 390×844, reduced motion, keyboard proof, repeated chapter selection and non-overlap.

This milestone strengthens implementation, UX and multi-agent evidence through observable behavior; it does not establish real-match accuracy, human preference, model superiority or a competition score. Start from README.md and rubric-gap-map.md for the full five-stage/judging map.
