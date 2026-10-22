# Canonical semantics audit

Source is the unchanged pinned `upstream/football-simulator/RealTimeEngine.ts` (39529b1). `poc/src/simulation.ts::runMatch/drain` projects through eventSchema; it filters administrative events before assigning contiguous indices. Source files are local ignored upstream checkout, not new dependencies.

| Canonical types | Exact source evidence / safe interpretation |
|---|---|
| goal, shot | startShot:1898 emits attempt; detectShotOutcome:2919 increments score then emits goal. Goal is not another shot. |
| save, miss, blocked_shot | detectShotOutcome:2919 and detectShotBlock:3018. Save/block player belongs to defending team; secondary player is shooter. Miss/goal player is shooter. |
| penalty | resolvePhaseAction:1079 / penalty resolution around1187: increments score BEFORE penalty and goal at same clock; no separate shot. A penalty goal must not double-increment score. Immediate pre-goal snapshot can already equal post-goal score. Emit goal observed with score_already_updated, without fabricated lead-change classification. |
| pass, receive | startPass:1853 records ATTEMPT and target progression; detectPassOutcome:2466 / resolveFirstTouch:2534 determine reception or interception. No general explicit shot/pass linkage IDs or pass-endpoint contract. No pass completion/progression percentages. |
| dribble | resolveBallAction:1823 observed carrying action, no guaranteed distance or speed. |
| interception, tackle | detectPassOutcome:2466 / detectTackleOrFoul:2008 assign owner and registerTouch BEFORE event creation. |
| challenge | detectTackleOrFoul:2008 records an attempt; need not win ball. |
| recovery | detectLooseBallRecovery:2411 chooses loose-ball collector; may be SAME team. Not inherently a turnover. |
| second_ball | createSecondBall:2663 describes loose ball, not secure ownership. |
| foul, yellow_card, red_card, injury | resolveFoul:2058, including second yellow dismissal. Explicit events, not evidence of tactical response; no canonical complete active roster. |
| substitution | detectSubstitutionEvents:2199 / performSubstitution:2298. Preserve observations; do not infer new formation. |
| corner, kickoff, goal_kick, free_kick, throw_in, offside | prepareRestart:1347, resolveOffside:2609 and handleTimeBoundaries:1009. Restarts are excluded from gain inference. |
| half_time, full_time | handleTimeBoundaries:1009 uses matchLength/2 PLUS actual addedTime; half_time event is already period2. Never reset cumulative clock or assume 2700s. |

createEvent:3126 snapshots current score/possession, uses ball position (NOT actor's exact position), and attributes team from primary player or current possession. Null players are legitimate; boundary team is not necessarily a scoring/acting team. registerTouch:4512 starts new possession ONLY when side changes; startPossession:782 increments possession id. Some touches (blocks/spills) are not controlled ownership. This is an imperfect observational contract.

High-regain definition: adjacent earlier controlled-action observation (pass/receive/dribble/tackle/interception/recovery) belonging to its possession side; current explicit tackle/interception/recovery by opposite side, changed possession ID and matching new owner-side, same period, <=15s apart, attack-relative x >=70m. This is a conservative observed transition, not a press-success label or complete turnover taxonomy. No extrapolation across restarts or missing ownership.

Sequence: same possession ID/team/period from regain through shot, <=20s. No causal claim. Outcome linkage: one outstanding shot, same period, <=15s, exact shooter identity from primary or secondary ID; no intervening shot/outcome/restart. This heuristic lacks native linkage IDs; ambiguous/unmatched outcomes are omitted. No assistant inference; chance_quality remains uncalibrated.

Real examples: `artifacts/real-goal.json` references evt_002782/evt_002783 at2370.5s, NORTH0–0 to1–0. Complete sources retained as compressed canonical fixtures. Demo source examples and exact IDs are in demo-match-walkthrough.md. Boundary, possession and counter definitions are tested independently; tests use constructed cases for adversarial semantics, not fabricated showcase data.
