# Trace the actual implementation

All examples here use real synthetic-football source observations but scripted offline provider responses. The historical examples below use the offline harness. A later separate test now validates actual Microsoft SDK graph execution with FakeProvider; the later separately recorded live integration tests also prove authenticated goal workflow/tool use. The examples below retain their original fake-provider provenance. No output below is a cached genuine model response.

## Goal through the studio

Source match 02840f35-cb05-4812-aa9d-1237e4ab1b9d; event clock2370.5s; claim `02840f35-cb05-4812-aa9d-1237e4ab1b9d:claim:e6e7fb2df33dccb5eecd1e77`. The preceding source score is0–0, goal score1–0. Step3A's exact event walk-through remains in research/step3a/execution-walkthrough.md.

| Stage | Real function and responsibility | Input → output / error behavior |
|---|---|---|
| Simulator/canonical | RealTimeEngine.tick → runMatch.drain → CanonicalEvent validation | Observable events only, contiguous sequence; source errors fail ingestion. |
| State/registry | stories.state.MatchStoryState.update → claims.make_claim → EvidenceIndex.verify → ClaimRegistry.register | Score context from actual before/after snapshots; wrong score/team/ref fails closed. Original sources unchanged. |
| Entry | agents.cli.load_source and Studio.run | Replays source, chooses existing scheduled insight, validates exact AgentInput and audience policy; arbitrary caller facts are rejected. |
| Director | Studio.direct → Requests.invoke → FakeProvider.complete (or optional FoundryProvider.complete) | WorkflowState→DirectorDecision: event specialist, score angle, required review and bounded budget. Invalid route falls back to deterministic policy. |
| Analyst | Studio.specialists → EvidenceTools.resolve_claim / resolve_evidence | Retrieves same-match<=clock facts; returns Analysis with approved IDs/references/category. Invalid ID or tool fails this role without changing facts. |
| Challenger | Studio.challenge | Returns Challenge.accept/narrow/fallback. Narrow forces evidence-first wording; failure/objection can skip narrator. This is not proof authority. |
| Parallel plans | Studio.presentation uses asyncio.gather | NarrationPlan and OverlayPlan are isolated. Models supply enums/IDs, not numbers/prose/coordinates. One branch failure preserves the other. |
| Narration | narrative_compiler.compile_narration | Code resolves GoalValue, inserts NORTH1/SOUTH0 and controlled hook; each sentence maps to the claim. Analyst adds windows/units/IDs. |
| Visuals | overlay_compiler.compile_overlay | Resolves ball event coordinates and score metrics, exact refs and replay bounds. Invented family/coordinates are rejected. |
| Publisher | Studio.publish and publication.verify_publication | Reverify source, clocks, namespace and deterministic renderings → BroadcastArtifact v2. Altered score/text/overlay fails verification. |
| Export | agents.cli.execute → write_json | Broadcast, state, redacted tool logs, event trace and local OTLP JSON. No provider credentials/prompts are exported. |

Actual compiled goal output:

```json
{
  "angle": "score_first",
  "available_seconds": 2370.5,
  "category": "score_context",
  "claim_ids": [
    "02840f35-cb05-4812-aa9d-1237e4ab1b9d:claim:e6e7fb2df33dccb5eecd1e77"
  ],
  "errors": [],
  "evidence": [
    {
      "category": "event",
      "match_id": "02840f35-cb05-4812-aa9d-1237e4ab1b9d",
      "source_id": "evt_002782"
    },
    {
      "category": "event",
      "match_id": "02840f35-cb05-4812-aa9d-1237e4ab1b9d",
      "source_id": "evt_002783"
    }
  ],
  "insight_id": "02840f35-cb05-4812-aa9d-1237e4ab1b9d:insight:e6e7fb2df33dccb5eecd1e77",
  "match_id": "02840f35-cb05-4812-aa9d-1237e4ab1b9d",
  "narration": {
    "headline": "NORTH view \u2014 Replay the evidence: NORTH: opening goal. The observed score is NORTH 1, SOUTH 0.",
    "limitations": [
      "Synthetic uncalibrated football; observations do not establish coach intent."
    ],
    "schema_version": 2,
    "sentences": [
      {
        "claim_ids": [
          "02840f35-cb05-4812-aa9d-1237e4ab1b9d:claim:e6e7fb2df33dccb5eecd1e77"
        ],
        "text": "Replay the evidence: NORTH: opening goal. The observed score is NORTH 1, SOUTH 0."
      }
    ]
  },
  "narration_status": "enriched",
  "origin": "offline_fake",
  "overlay": {
    "coordinates": [
      [
        "evt_002782",
        88.29,
        27.0
      ],
      [
        "evt_002783",
        113.01,
        31.45
      ]
    ],
    "metrics": [
      {
        "claim_id": "02840f35-cb05-4812-aa9d-1237e4ab1b9d:claim:e6e7fb2df33dccb5eecd1e77",
        "name": "NORTH_before",
        "unit": "goals",
        "value": 0.0
      },
      {
        "claim_id": "02840f35-cb05-4812-aa9d-1237e4ab1b9d:claim:e6e7fb2df33dccb5eecd1e77",
        "name": "SOUTH_before",
        "unit": "goals",
        "value": 0.0
      },
      {
        "claim_id": "02840f35-cb05-4812-aa9d-1237e4ab1b9d:claim:e6e7fb2df33dccb5eecd1e77",
        "name": "NORTH_after",
        "unit": "goals",
        "value": 1.0
      },
      {
        "claim_id": "02840f35-cb05-4812-aa9d-1237e4ab1b9d:claim:e6e7fb2df33dccb5eecd1e77",
        "name": "SOUTH_after",
        "unit": "goals",
        "value": 0.0
      }
    ],
    "observation_semantics": "source ball/player coordinates only; interpolation is visualization",
    "plan": {
      "claim_ids": [
        "02840f35-cb05-4812-aa9d-1237e4ab1b9d:claim:e6e7fb2df33dccb5eecd1e77"
      ],
      "emphasis": "incident",
      "family": "scoreline_change",
      "schema_version": 2
    },
    "references": [
      {
        "category": "event",
        "match_id": "02840f35-cb05-4812-aa9d-1237e4ab1b9d",
        "source_id": "evt_002782"
      },
      {
        "category": "event",
        "match_id": "02840f35-cb05-4812-aa9d-1237e4ab1b9d",
        "source_id": "evt_002783"
      }
    ],
    "replay_window": [
      2370.0,
      2370.5
    ],
    "schema_version": 2
  },
  "overlay_status": "enriched",
  "preferences": {
    "audience": "fan",
    "favorite_team": "NORTH",
    "language": "en"
  },
  "presented_seconds": 2370.5,
  "schema_version": 2,
  "source_seconds": 2370.5,
  "trace_id": "b05ed62c930749779553a474e1013fd1"
}
```

Director→analyst handoff and all controlled plans are in artifacts/opening_goal-fan.state.json; safe tool names and clock are in opening_goal-fan.tools.json; actual local stage order is in opening_goal-fan.trace.json. Default goal path makes5 fake requests (Director, Match Analyst, Challenger, Narrator, Replay Producer).

## Verified positional branch

Separate match f2a3e267-d3e5-4c90-ae07-b5a39607ab2d, at3360.0s; claim `f2a3e267-d3e5-4c90-ae07-b5a39607ab2d:claim:658e2cff3976481744979ab9`. No matches are combined.

TrackingFrame → frozen extract_features/TrackingWindows/PositionalDetector → PositionalEvidencePack → presentation.review_episode → VerifiedLineClaim → stories registry. The measured three-deepest-outfielder proxy is21.951300813008128→31.96388888888889m, change10.01258807588076m. Reference41/recent18 frames; sampled contexts, not identified back four or coach instruction. The studio re-verifies original frames/events, Director routes to Tactical Analyst, local tools resolve claim plus source frame, Challenger narrows to evidence-first, and renderer includes source windows/support. Overlay metrics retain full precision and source refs; display rounds to one decimal.

Actual positional narration:

```json
{
  "headline": "NORTH view \u2014 The recorded observations show: During sampled opponent build-up, NORTH's three deepest outfield players averaged 22.0m and then 32.0m from their own goal: they advanced by 10.0m between the compared observations.",
  "limitations": [
    "Observed synthetic positioning only; not evidence that the coach ordered a tactic or that pressure was effective."
  ],
  "schema_version": 2,
  "sentences": [
    {
      "claim_ids": [
        "f2a3e267-d3e5-4c90-ae07-b5a39607ab2d:claim:658e2cff3976481744979ab9"
      ],
      "text": "The recorded observations show: During sampled opponent build-up, NORTH's three deepest outfield players averaged 22.0m and then 32.0m from their own goal: they advanced by 10.0m between the compared observations."
    },
    {
      "claim_ids": [
        "f2a3e267-d3e5-4c90-ae07-b5a39607ab2d:claim:658e2cff3976481744979ab9"
      ],
      "text": "Source window (3180, 3360] seconds; units m; evidence frame_002732, frame_002734, frame_002742. Before 22.0m; after 32.0m; support 41 reference and 18 recent frames. Latest contributing observation 3360s."
    }
  ]
}
```

The stale1350s detection has132s-old recent observations and13s span; presentation produces no approved claim, therefore no Tactical Analyst input is created. Original research alert remains preserved.

## Failure and cloud-unavailable behavior

In the recorded narrator-timeout case, narration status is fallback while overlay status is enriched. Retry is bounded to one; the other branch continues. See failure-recovery.broadcast.json, failure-narrator-timeout.trace.json and failure-recovery.otlp.json.

Missing configuration still fails explicitly in an unconfigured shell; the authorized coordination environment has now passed the real proof and goal-workflow gates. Auth failures disable further provider attempts for that run and fall back to source-derived output; no fake provider substitutes for a failed live request. Foundry CLI requires runtime=framework; offline demonstrations are explicitly labeled. framework.py has subsequently passed its actual SDK graph test with FakeProvider; the historical example artifacts below were not regenerated or relabeled by that test. No cloud checkpoint/telemetry/service deployment exists.

Compared with a two-role pipeline, this design adds selective routing, explicit challenge/narrowing and independent sourced visual planning/recovery. Its extra reasoning quality has NOT been demonstrated by scripted responses. The next real proof must show valid structured outputs, actual tool use, successful SDK orchestration and visible audience/angle choices with measured usage.
