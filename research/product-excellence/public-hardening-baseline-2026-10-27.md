# Corrected-public hardening baseline — October27

Untouched runtime0b06707; tests at efba043.149applicable cases:127passed,1intentional skip,21failed,0flaky. Duration4,761,355.728ms. Two pre-existing development-module hook tests were excluded; no other case was excluded. The failed run is retained and does not become a pass because a later focused check succeeds.

Evidence directory: `output/product-excellence/p12/public-recheck-20261027-01/`. Contains `run.log`, complete `results.json`, every failure trace, `trace-summary.json`, `environment-overlap.json` and the813-file protected-source baseline.

The trace parser checks response transfer failures as well as status: several HTTP200 headers are followed by `net::ERR_NETWORK_CHANGED` and do not represent a successfully consumed body. No completed4xx/5xxresponse was present in the inspected failure traces. macOS sleep intervals were matched against each failed case's actual UTC start and duration; overlap is correlation, not blanket proof of root cause.

## Every failed case

| Project / test | Direct evidence | Sleep overlap | Disposition |
|---|---|---:|---|
| Laptop broadcast: positional Proof Lens / withheld | Withheld fixture request pending when5s `.withheld` assertion expired |0s| Await real switched view before unchanged assertion; public rerun needed |
| Laptop editorial: source axis/history | Line view took4.233s; proof headers arrived near the5s assertion cutoff, body not yet complete |0s| Await source and independently validated support before unchanged assertion |
| Mobile buffer: one request advances ticks | Packet completed; source-clock predicate did not advance during host suspension |103.97s| Keep assertion; rerun awake before classifying app behavior |
| Mobile buffer: malformed prefetch recovery | Retry Play remained disabled/pending; overall test ended |71s| Keep malformed packet, recovery and clock assertions; rerun |
| Mobile layout: secondary details/history | Withheld switch still pending; earlier source call took32.809s; overall test timeout |251s| Actual switched-view prerequisite added; preserve full-budget failure |
| Mobile matchday composition | CSS/JS HTTP200 headers followed by `ERR_NETWORK_CHANGED`; no API startup reached |0s| Initial source/proof readiness now explicit; network failure itself is not fixed by a test edit |
| Mobile playback: initial/refill delays | Oracle request pending when test context disposed; no fabricated packet published in trace |181s| Deliberate delay/oracle assertions retained; rerun |
| Mobile playback: malformed packets | Long series of valid assertions, then pending view/request context disposed |902s| All malformed variants/assertions retained; rerun |
| Mobile playback: backward seek isolation | Initial view took5.020s; Play assertion's5s startup deadline expired before readiness |0s| Await actual initial view before original Play/source assertions |
| Mobile playback: fixture isolation | Initial activity/view pending at teardown |92s| Keep isolation assertions; actual initial-view prerequisite shared with load helper |
| Mobile UX: selected shot | Navigation `ERR_NETWORK_CHANGED` |102.53s| No shot/source assertion weakened; rerun |
| Mobile UX: pointer selection | Initial view transfer `ERR_NETWORK_CHANGED` |0s| No interaction assertion changed; rerun |
| Mobile ownership: obsolete valid packet |60s proof wait expired; startup did not complete |67.74s| Existing request-ownership assertions retained; rerun |
| Mobile ownership: obsolete malformed packet |60s proof wait expired; startup did not complete |80s| Existing malformed/stale completion assertions retained; rerun |
| Mobile ownership: pending pause | Packet request pending; request context disposed |97s| Cancellation assertions retained; rerun |
| Mobile session: preferences | Initial view took4.565s; source/proof UI was not ready at5s assertion |1.43s| Reuse validated initial source/proof helper; retain continuity assertions |
| Mobile session: shared header | Navigation `ERR_NETWORK_CHANGED` |5.34s| No geometry assertion weakened; use same real initial prerequisites |
| Mobile theatre: guided story | Initial readiness failed with startup not completed |198s| Keep guided source/clock/duration assertions; rerun |
| Mobile theme: saved themes/fonts | Activity/view transfer `ERR_NETWORK_CHANGED`; app correctly displayed unavailable instead of recorded replay |0s| Do not relabel unavailable as success; rerun stable connection |
| Mobile timeline: dense contexts | Initial activity/view still pending after suspension; proof wait expired |200s| All source/hover/focus assertions retained; rerun |
| Mobile timeline: coincident incidents | Initial native view pending at teardown; Play never ready |425s| All cluster/touch/keyboard assertions retained; rerun |

## Execution correction

A temporary `caffeinate -i` process prevents idle system sleep during the verification session; no system configuration was changed. Initial local/public health attempts after the run timed out; a later public health request returned200 in0.839s. A fresh complete public run includes the newly added hardening fault regressions rather than hiding them. The old deployed runtime does not contain those repairs; any resulting public failures must stay explicit until a reviewed replacement is deployed and verified.

Local application fixes concern only paused-view error ownership, shared HTTP error decoding and a leaf time utility. No source fixture, proof arithmetic, frozen experiment, threshold or backend dependency changed. New test prerequisites do not warm the source, retry the failed operation, extend the overall60s budget or delete a meaningful assertion.

## Complete awake follow-up and focused corrections

The second complete public run collected155applicable cases: **143 passed / 1 intentional skip / 11 failed / 0 flaky**,1,889,140.853ms. Its80source/test/config fingerprints were unchanged during execution. Sleep overlap was0for all11failures; failure traces contain no `ERR_NETWORK_CHANGED` transfers. Raw JSON/logs, every trace and the environment comparison are retained in `public-hardening-20261027-02/`.

Every failure:

| Cases | Direct evidence | Correction / remaining gate |
|---|---|---|
| Club mapping, laptop + mobile | Initial line view took nearly5s; the short support assertion began before proof completed | Reuse actual source/proof readiness, then retain the59-sample, colors, menu, identity, clock and source assertions |
| Watch/Compare/Explain progress, laptop + mobile | Initial support check ran while the actual proof was pending | Await the same validated receipt first; every exploration-step assertion retained |
| Receipt request-count test, laptop + mobile | Initial support check began before the proof response existed | Await the actual initial receipt; retain the assertion that replay ticks do not refetch |
| Stale paused-view error, laptop + mobile | Controlled obsolete generic rejection creates an alert after the newer Fan view is ready | Fixed locally and in compiled preview; existing public bundle still exhibits the defect |
| Current malformed HTTP error, laptop + mobile | Controlled503/null response shows a TypeError rather than the usable fallback | Fixed locally and in compiled preview; existing public bundle still exhibits the defect |
| Malformed-packet matrix, mobile | All15corruption variants completed; >100requests consumed the60s budget before the final real valid-packet advancement could complete | Split into15independent fault tests with the same60s deadline. Preserve every mutation, invalid-packet/source-oracle/retry assertion; additionally require actual valid-packet recovery and recovered source-oracle checks for every fault |

After those test corrections, **36 focused public checks passed in6.3minutes**: the3startup cases and all15separate packet faults, each on laptop/mobile. Raw evidence: `public-hardening-prerequisites-03/`. The application source did not change between the143/11run and these follow-ups.

These are separate results, not a fabricated combined full-suite pass. Parameterization adds28collected cases across both projects because one15-fault loop became15tests; it is not a detector-quality metric. The4controlled runtime-defect cases require a released repaired build and a fresh complete applicable public run. Public acceptance remains open; no deployment was performed.
