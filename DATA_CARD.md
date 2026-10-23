# MatchPulse synthetic data card

MatchPulse demonstrates explainable football intelligence on synthetic observations, not licensed Premier League footage or calibrated real-match data. Fictional North FC and South FC are used throughout. No player identity or shirt number is authenticated; display labels identify source players.

Source simulator: Tobias Bleckert's MIT football-simulator at commit 39529b19c40868d66aa47db084ebc9ea29c86e70, adapted into canonical typed observations. Full provenance and notices: THIRD_PARTY_NOTICES.md and the Step 1 research. Python source ingestion accepts opaque match UUIDs, contiguous event sequences, touch-based possession and observed score snapshots. Tracking fixtures contain observed player/ball positions; event-only fixtures do not gain invented players or trajectories.

The viewer catalog fixes five separate fixtures: goalless open play; opening goal; equalizer; verified line-height change; stale positional evidence. They are not parts of one match. Exported bundle files retain their original bytes; the eight-file manifest records SHA256 and size. See research/step3c/deployment.md for local preparation. Public distribution remains pending; the repository remains private per user instruction.

Only supported claims pass presentation eligibility and source verification. Goals are not invented for the goalless fixture. Penalty/score conventions follow original events. A regain does not establish pressing effectiveness; positioning does not establish a coach instruction; shot attempts do not establish expected goals or assists. Proof's representative snapshots illustrate actual source frames, while context-conditioned aggregate values use all contributing samples. There is no interpolation presented as observed movement.

Step 2/2.5 experimental freezes, holdout consumption, failed detection targets and conclusions remain authoritative and unchanged. See research/step25/final-verdict.md and research/step2-final-verdict.md. No new training, calibration or accuracy study was performed for the product redesign. The Step 3A review packet is a human-review asset, not a new detector evaluation set.
