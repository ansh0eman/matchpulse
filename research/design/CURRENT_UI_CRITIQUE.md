# Current UI critique

The immutable pre-redesign image63344b8… remains the baseline. Thirteen real1440×900 captures are in `before/`. The exploratory capture runner stopped while waiting for its injected error state; that is not completed six-viewport acceptance. Latest user direction replaces the broad matrix with focused laptop/mobile acceptance.

| Finding | Evidence / source | Correction |
|---|---|---|
| Headline and pitch competed for dominance | `before/1440-900-theatre-position.png`; BroadcastTheatre editorial split | Pitch leads; explanation moves below it at a smaller scale. |
| Scenario navigation competed with the match | `before/1440-900-goal.png`; six equal chapter buttons | Quiet text navigation below the main task. |
| Technical prose occupied primary space | Broadcast presentation phrases and provenance strip | Short football copy; provenance stays in About this replay and technical evidence. |
| Mobile used a fixed590px stage with a large internal gap | Legacy broadcast.css mobile editorial rules | Intrinsic pitch aspect ratio and ordinary content flow. |
| Same-time goal could be buried in chronology | Timeline reverse order put lower engine priorities first | Same-time list ordering now follows existing editorial priority. Hero priority repair from5843897 is preserved. |
| CSS ownership was unclear | styles.css1936 lines plus broadcast.css1366 lines | New Matchday rules are scoped in one final stylesheet; no wholesale legacy rewrite. |

Initial real laptop/mobile inspection caught a weak context-heading contrast and playback controls close to the laptop fold. Explicit ink heading color, restrained nav underline and smaller desktop stage/context height correct those issues. No factual authority was changed to improve the appearance.
