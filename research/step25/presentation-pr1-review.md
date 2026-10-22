# PR #1 review and verification

PR: https://github.com/ansh0eman/matchpulse/pull/1  
Branch: `feat/presentation-quality-gate`  
Frozen experiment base: `759aa226b508df2a69bbe7c5522b3743d812bd4c`

The checkout was clean before switching from main to the PR branch. The six-file PR diff was inspected. The review preserves the frozen detector, experiment configuration, old fixtures, source fingerprints and evaluation results. No new accuracy selection, scoring or calibration was run.

## Findings and resolutions

1. **Recomputed facts did not necessarily confirm a fused episode.** The first adversarial test demonstrated that a fresh, geometrically valid pack could be approved after substituting accurately recomputed empty-event facts (`supported=false`). Equality against raw counters was the only event check. `review_episode` now additionally requires the existing frozen fusion predicate: supported recovery windows and direction-aligned location delta >=3m OR high-recovery-share delta >=0.05. Unsupported and opposite-direction evidence suppress presentation. Research detection and exports are unchanged.
2. **Mocked tests did not exercise actual evidence verification.** Added unmocked geometry/event tests, tampering/missing/future references, observation-prefix invariance, and real CLI export tests. The existing assertions remain.
3. **The old event excerpts are not complete counter history.** The first unmocked success test failed because the excerpt omitted earlier possession progression state: reconstructed reference final-third entries were 7 instead of 5 (false-alert excerpt: 4 instead of 3). The verifier correctly rejected those incomplete inputs. Added deterministic compressed canonical prefixes through each episode, validated with contiguous source indices. The old excerpts and all prior fingerprints remain untouched. New prefixes contain 3,983 and 1,529 events, approximately 199KB combined compressed; hashes are in presentation-review-results.json.

## Exact reproduction

From the repository root:

```sh
backend/.venv/bin/python backend/scripts/step25/review_presentation.py
```

The runner records literal argv, working directory, exit status, runtime, source/input hashes and decisions in [presentation-review-results.json](presentation-review-results.json). Detailed outputs/logs stay in the ignored `backend/output/step25/pr1-review/` directory.

Executed suite commands (the runner expands the TypeScript glob into file arguments):

```sh
backend/.venv/bin/python -m pytest backend/tests -q
cd poc
/Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node --import tsx --test tests/*.test.ts
/Users/ansh0eman/.nvm/versions/node/v24.19.0/bin/node node_modules/typescript/bin/tsc --noEmit
cd ..
```

Actual results: **71 Python tests passed; 10 TypeScript tests passed; TypeScript typecheck passed. All exit 0.** The initial PR also passed its existing 63 Python tests; the newly added adversarial test exposed the unsupported-confirmation hole before the fix.

Both real fixture commands:

```sh
backend/.venv/bin/python -m matchpulse.tracking.cli data/step25/inference/f2a3e267-d3e5-4c90-ae07-b5a39607ab2d.tracking.jsonl.gz --events data/step25/inference/f2a3e267-d3e5-4c90-ae07-b5a39607ab2d.jsonl --config research/step25/artifacts/selected.json --debug --output backend/output/step25/pr1-review/success.json
backend/.venv/bin/python -m matchpulse.tracking.cli data/step25/inference/31c70a92-4ce1-4ec2-a570-e8112bfcc5fc.tracking.jsonl.gz --events data/step25/inference/31c70a92-4ce1-4ec2-a570-e8112bfcc5fc.jsonl --config research/step25/artifacts/selected.json --debug --output backend/output/step25/pr1-review/stale.json
```

Both exit 0. Full input hashes match the original example provenance. The runner also executes the exact original CLI source retrieved from the frozen commit, after verifying its SHA256 and all imported frozen research inputs. For each fixture, research `.json` and `.facts.json` exports are **byte-for-byte identical** to that original CLI. Each research pack also equals the previously retained EvidencePack.

| Real case | Research alerts retained | Broadcast claims | Age | Recent span | Reference/recent frames |
|---|---:|---:|---:|---:|---:|
| Successful strong episode | 1 | 1 | 0s | 64s | 41 / 18 |
| Known stale episode | 1 | 0 | 132s | 13s | 105 / 8 |

The stale episode has both `stale_recent_evidence` and `insufficient_recent_time_coverage` suppression reasons. Its numerical evidence remains in research output.

The broadcast claim is checked against raw tracking and full canonical event history. A separate coordinate calculation recomputes its three-deepest-outfielder means with the same observable context weights, independently of the feature extractor. Claim direction, units, windows, support and observation time match the verified source. Broadcast claims omit detector confidence scores and make no coach-intent or effective-pressing assertion.

## Frozen scope and limitations

- The original 7m fused configuration and every other evaluated input except the intentionally extended CLI wrapper match their recorded hashes. Existing evaluation artifacts and fingerprints are byte-identical to the frozen base.
- The original whole-source research guard deliberately rejects the extended CLI/new module. Historical comparison/verification commands must run on the original frozen commit; this review does not weaken that guard or rewrite the old fingerprint.
- Freshness (60s), coverage spans (30s recent /60s reference) and fusion requirements are display rules, not a newly calibrated accuracy model. No new precision/recall claim is made. Existing 47.54% precision, 36.25% recall and 0.35 null alerts/match remain unchanged.
- These tests establish the executed reliability properties and fixture behavior, not universal leakage security or real-football validity. No remaining implementation blocker was found in this scope.

The reviewed PR is ready for human merge after the review commit is pushed. No merge is performed by this task.
