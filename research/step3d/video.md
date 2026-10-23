# Demo recording and narration

Target final duration: 110 seconds, leaving margin under the two-minute submission limit. Show the real application. Keep the synthetic-fixture disclosure visible and announce fixture changes; never splice the score and positional examples into one match.

| Time | Screen | Suggested narration |
|---|---|---|
| 0–6s | Theatre | “MatchPulse makes football explanations inspectable. These are separate synthetic match scenarios.” |
| 6–22s | Guided story: moment | “The score changes only when the source clock reaches the goal. Seek backward and the future result disappears.” |
| 22–38s | Guided story: explanation | “Fan and Analyst views adapt the presentation while keeping the same verified measurements.” |
| 38–64s | Guided story: proof | “Here is a different fixture. North's observed line moves about ten metres higher. Proof Lens recomputes the result from 59 original samples. Open the method, inspect the observations, or download the evidence receipt. Position alone cannot tell us the coach's intent.” |
| 64–82s | Guided story: restraint | “In another fixture the evidence is 132 seconds old. MatchPulse withholds the positional explanation instead of stretching stale evidence.” |
| 82–104s | Agent Room | “This is a saved real Foundry run through Microsoft Agent Framework: five specialist requests with evidence-tool calls, followed by independent source verification. Narration and replay enriched successfully. The earlier narration recovery is separately inspectable. Viewer replay makes no new model calls.” |
| 104–110s | Theatre / Proof Summary | “A broadcast you can watch, question and verify. Current evidence is synthetic; real-match accuracy and broader model quality are unproven.” |

The single-run request meter missed the SDK transport, so actual model HTTP request count is unknown; the five specialist attempts are not a claim of five total model calls. Keep this limitation in the linked technical evidence rather than advertising a cost or request-efficiency result.

For a genuine silent local rough cut of the guided story, run the real-time acceptance recording against the running viewer:

```sh
cd web
MATCHPULSE_TEST_URL=http://127.0.0.1:8013 MATCHPULSE_RECORD_VIDEO=1 npx playwright test tour-autoplay.spec.ts --project=laptop
```

The output is a Playwright video under output/playwright/target-8013/results. It is a source recording, not a finished narrated submission video. Review it for loading, legibility and pacing before editing. Add the actual Agent Room segment and narration, verify final duration, then seek authorization before publishing a video link. Do not show account settings, environment files or credentials.

An actual native-container acceptance recording was captured October 24 and converted locally to output/playwright/matchpulse-guided-story-rough-cut.mp4: H.264, 1366×768, 79.72 seconds, 1,380,618 bytes, no audio. The acceptance suite passed all 13 checks, including the guided-control non-overlap correction. This ignored local output is a genuine silent rough cut; it is not uploaded and is not the final submission video.
