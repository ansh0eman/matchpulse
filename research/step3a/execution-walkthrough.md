# Teach the actual execution flow

No supervised ML is used in this story pipeline. Canonical events, measured geometry, counters and deterministic rules produce the facts; priority/cooldowns are editorial rules. The selected positional detector is unchanged fused7m. An LLM enters only after the verified envelope in Step3B and cannot calculate authoritative statistics.

## Real goal: simulator to story

Match 02840f35-cb05-4812-aa9d-1237e4ab1b9d; goal evt_002783 at 2370.5s, period1. Source excerpt:

```json
[
  {
    "attacking_position_m": {
      "x": 88.29,
      "y": 27.0
    },
    "evidence": {
      "attack_pattern": "second_ball",
      "chance_quality": 0.21281833551735116,
      "field_zones": [
        "attacking_third",
        "final_third",
        "half_space_left",
        "box"
      ],
      "possession_final_third_entries": 1,
      "source_index": 2782
    },
    "id": "evt_002782",
    "outcome": "second_ball",
    "period": 1,
    "player_id": "home-starter-8-9",
    "position_m": {
      "x": 88.29,
      "y": 27.0
    },
    "possession_id": "pos_261",
    "possession_team_id": "NORTH",
    "schema_version": 1,
    "score": {
      "away": 0,
      "home": 0
    },
    "secondary_player_id": null,
    "sequence": 2782,
    "team_id": "NORTH",
    "time_seconds": 2370.0,
    "type": "shot"
  },
  {
    "attacking_position_m": {
      "x": 113.01,
      "y": 31.45
    },
    "evidence": {
      "attack_pattern": "second_ball",
      "chance_quality": 0.21281833551735116,
      "field_zones": [
        "attacking_third",
        "final_third",
        "central_lane",
        "box",
        "byline"
      ],
      "possession_final_third_entries": 1,
      "source_index": 2783
    },
    "id": "evt_002783",
    "outcome": "second_ball_goal",
    "period": 1,
    "player_id": "home-starter-8-9",
    "position_m": {
      "x": 113.01,
      "y": 31.45
    },
    "possession_id": "pos_261",
    "possession_team_id": "NORTH",
    "schema_version": 1,
    "score": {
      "away": 0,
      "home": 1
    },
    "secondary_player_id": null,
    "sequence": 2783,
    "team_id": "NORTH",
    "time_seconds": 2370.5,
    "type": "goal"
  }
]
```

1. upstream/football-simulator/RealTimeEngine.ts::tick advances physics/actions. detectShotOutcome increments state.score then createEvent snapshots it; commitSnapshot records the result. This is synthetic state, not real match data.
2. poc/src/simulation.ts::runMatch calls engine.tick and drain. drain removes control events before contiguous canonical sequence assignment and rotates ball coordinates into attacking direction. eventSchema.parse validates TypeScript output. serialize creates JSONL.
3. matchpulse/ingestion.py::load_match enforces UUID filename; validate_stream calls CanonicalEvent.model_validate_json, rejects unknown metadata, duplicate IDs, gaps, regressing clocks/scores and changed actor teams. Error raises IngestionError and CLI exits2.
4. stories/replay.py::replay builds EvidenceIndex, which separately validates observable score transitions and exact penalty pairs. MatchStoryState.update receives one event at a time. For this goal its previous.score is0–0 and event.score1–0; it creates a goal_context candidate. No future shot/goal assists are read.
5. stories/claims.py::make_claim builds GoalValue before/after and opening_goal from total prior goals0 and own-score increment1. Stable claim ID hashes type+references+window in the match namespace. Player ID is copied from verified source; no assist inferred.
6. stories/registry.py::ClaimRegistry.register calls EvidenceIndex.verify. evidence.py resolves exact namespaced references, independently checks adjacent source score, unit, team, time, player IDs and context. A wrong score/team/future/missing reference returnsFalse and raises ValueError; replay retains suppression instead of narrating. Score corruption in canonical source fails earlier index creation.
7. replay.accept creates MatchInsight only after verification. claims.wording renders registered numbers into deterministic text. The real result is:

```json
{
  "as_of_seconds": 2370.5,
  "claim_ids": [
    "02840f35-cb05-4812-aa9d-1237e4ab1b9d:claim:e6e7fb2df33dccb5eecd1e77"
  ],
  "event_time_seconds": 2370.5,
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
  "fallback": {
    "explanation": "NORTH: opening goal. Score 1\u20130 (NORTH\u2013SOUTH). Observed at 39.5 cumulative minutes. Synthetic uncalibrated football; observations do not establish coach intent.",
    "headline": "NORTH: opening goal. Score 1\u20130 (NORTH\u2013SOUTH)."
  },
  "insight_id": "02840f35-cb05-4812-aa9d-1237e4ab1b9d:insight:e6e7fb2df33dccb5eecd1e77",
  "limitations": [
    "Synthetic uncalibrated football; observations do not establish coach intent."
  ],
  "match_id": "02840f35-cb05-4812-aa9d-1237e4ab1b9d",
  "observed_score": {
    "away": 0,
    "home": 1
  },
  "period": 1,
  "player_ids": [
    "home-starter-8-9"
  ],
  "priority": 100,
  "priority_semantics": "editorial ordering, not probability",
  "provenance": "pinned synthetic simulator canonical observations",
  "quality": "verified_observation",
  "schema_version": 1,
  "team_id": "NORTH",
  "type": "goal_context",
  "verified": true
}
```

8. StoryScheduler.submit assigns goal100 priority; it bypasses routine slots, preserves source/as-of and emits at2370.5s. Duplicate IDs and related routine shot incidents cannot reannounce the same fact.
9. export.export writes timeline/claims/insights/evidence-index/suppressed/summary and agent-inputs. AgentInput contains compact approved facts and resolver IDs. Future grounded_response rejects unknown model claims or free prose and returns this same fallback.

## Real positioning path

TrackingFrame at1Hz -> tracking/features.py::extract_features removes GK, rotates coordinates and samples comparable opponent build-up -> TrackingWindows.compare computes matched-context weighted before/recent means -> tracking/replay.py::detect updates frozen PositionalDetector -> evidence.make_pack -> presentation.review_episode independently verifies raw geometry/event confirmation, counts, age and spans -> VerifiedLineClaim -> stories registry verifies gate again -> MatchInsight -> StoryScheduler.

Real separate research example UUIDf2a3e267-d3e5-4c90-ae07-b5a39607ab2d at3360s: mean three-deepest-outfielder x21.951300813008128 ->31.96388888888889m; delta10.01258807588076m. Reference41/recent18 frames, one common context; recent age0s/span64s; reference span382s. Detector threshold ratio abs(delta)/7=1.43037 (not confidence). Reference window(2710,3180], recent(3180,3360]. Geometry averages per context, then weights both means by recent-context sample share; no back-four identity is asserted.

The stale example at1350s has last relevant observation1218s: age1350−1218=132s>60s and span13s<30s, so review_episode emits no VerifiedLineClaim. Original research pack remains unchanged. The stories export records suppression; no fallback tactical narration is generated.

Errors are bounded messages and exit2 for source/config faults; individual candidate verification failures are retained as suppressed. Prefix tests clip both streams, including after3360s, and show future observations do not rewrite accepted insights.
