import { useClubs } from "../clubs/Clubs";
import type { selectEditorial } from "../broadcast/editorial";
import type { SourceSnapshot } from "../playback/source";
import { StatusBanner } from "../ui/Surface";
import type { Dispatch, SetStateAction } from "react";
import { ActivityIcon, ArrowRightIcon, CheckCircleIcon, CaretRightIcon, FingerprintIcon, ListIcon, PauseIcon, PlayIcon, ShieldCheckIcon, SkipBackIcon } from "@phosphor-icons/react";
import type { Answer, Audience, Scenario, Story, Team, View } from "../contracts";
import { SourceFrameInspector } from "./SourceFrameInspector";
import { clockText } from "../ProofLens";
import { ViewModeControl, FollowingControl } from "../shell/Preferences";
import { Surface, TactileButton } from "../ui/Surface";

interface Props {
  seek: (clock: number) => void;
  editorial: ReturnType<typeof selectEditorial>;
  source: SourceSnapshot | null;
  presentationPending: boolean;
  scenarios: Scenario[];
  scenario: string;
  currentScenario: Scenario | undefined;
  data: View | null;
  audience: Audience;
  favorite: Team | "";
  error: string | null;
  playbackFault: string | null;
  blocking: boolean;
  playbackReady: boolean;
  current: Story | undefined;
  clock: number;
  playing: boolean;
  speed: number;
  answer: Answer | null;
  asking: boolean;
  choose: (scenario: Scenario) => void;
  inspect: (claim?: string) => void;
  ask: (question: string) => void;
  seekStory: (story: Story) => void;
  setGuide: Dispatch<SetStateAction<boolean>>;
  setRoom: Dispatch<SetStateAction<boolean>>;
  setAudience: Dispatch<SetStateAction<Audience>>;
  setFavorite: Dispatch<SetStateAction<Team | "">>;
  setPlaybackFault: Dispatch<SetStateAction<string | null>>;
  setRetry: Dispatch<SetStateAction<number>>;
  setPlaying: Dispatch<SetStateAction<boolean>>;
  setSpeed: Dispatch<SetStateAction<number>>;
}
export function InvestigateView({ seek, editorial, source, presentationPending, scenarios, scenario, currentScenario, data, audience, favorite, error, playbackFault, blocking, playbackReady, current, clock, playing, speed, answer, asking, choose, inspect, ask, seekStory, setGuide, setRoom, setAudience, setFavorite, setPlaybackFault, setRetry, setPlaying, setSpeed }: Props) {
  const stage = data ?? source;
  const clubs = useClubs();
  return (
        <main className="studio-layout" style={clubs.style}>
          <aside className="scenario-rail">
            <div className="rail-heading">
                <span className="eyebrow">Match stories</span>
              <button
                onClick={() => setGuide(true)}
                aria-label="Explore scenarios"
              >
                <ListIcon size={19} />
              </button>
            </div>
            {scenarios.map((s) => (
              <button
                className={`scenario-button ${scenario === s.id ? "chosen" : ""}`}
                key={s.id}
                onClick={() => choose(s)}
                aria-label={`Select ${s.title}`}
              >
                <span>
                  <strong>{s.title}</strong>
                  <small>
                    {s.tracking ? "Observed tracking" : "Event evidence"}
                  </small>
                </span>
                <CaretRightIcon size={14} />
              </button>
            ))}
            <div className="rail-note">
              <ShieldCheckIcon size={23} />
              <strong>
                Source-grounded stories
              </strong>
              <p>
                Open any moment to inspect its observations and stated limits.
              </p>
            </div>
            <button className="agent-shortcut" onClick={() => setRoom(true)}>
              <ActivityIcon size={18} />
              Foundry integration
              <CheckCircleIcon size={15} />
            </button>
          </aside>
          <section className="broadcast-main">
            <div className="page-heading">
              <div>
                <h1>Investigate</h1>
                <p>{currentScenario ? `${currentScenario.title} · ${currentScenario.subtitle}` : "Loading source catalog…"}</p>
              </div>
              <span className="replay-badge">Recorded replay</span>
            </div>
            <div className="personalization"><ViewModeControl value={audience} onChange={setAudience} /><FollowingControl value={favorite} onChange={setFavorite} /><span className="local-badge">Verified replay · no live model call</span></div>
            {presentationPending && <StatusBanner>Updating explanation… Source playback continues.</StatusBanner>}
            {error || playbackFault ? (
              <section className="service-error" role="alert">
                <ShieldCheckIcon size={30} />
                <h2>Evidence unavailable.</h2>
                <p>{error ?? playbackFault}</p>
                <button
                  className="primary-button"
                  onClick={() => {
                    setPlaybackFault(null);
                    setRetry((v) => v + 1);
                  }}
                >
                  Retry source connection
                </button>
              </section>
            ) : (
              <>
                <section
                  className={`match-stage ${blocking ? "refreshing" : ""}`}
                  aria-label="Match replay"
                >
                  <div className="scoreboard">
                    <div className="team team-home">
                      <span className="crest north" style={{background:clubs.marker("NORTH").fill,color:clubs.marker("NORTH").ink}}>{clubs.club("NORTH").shortName}</span>
                      <span>
                        {clubs.name("NORTH")}
                      </span>
                    </div>
                    <div className="score-center">
                      <span className="period">PERIOD {stage?.period ?? 1}</span>
                      <strong data-testid="score">
                        {stage?.score.home ?? "–"}
                        <i>:</i>
                        {stage?.score.away ?? "–"}
                      </strong>
                      <span className="match-clock" data-testid="clock">
                        {clockText(data?.clock ?? clock)}
                      </span>
                    </div>
                    <div className="team team-away">
                      <span>
                        {clubs.name("SOUTH")}
                      </span>
                      <span className="crest south" style={{background:clubs.marker("SOUTH").fill,color:clubs.marker("SOUTH").ink}}>{clubs.club("SOUTH").shortName}</span>
                    </div>
                  </div>
                  <div className="pitch-heading">
                    <span>
                      <span className="lime-dot" />
                      {stage?.tracking_available
                        ? "Observed tracking"
                        : "Observed event locations"}
                    </span>
                    <span>
                      {stage?.frame
                        ? `Source frame ${stage.frame.time_seconds}s · age ${stage.frame_age?.toFixed(1)}s`
                        : "No tracking supplied for this match"}
                    </span>
                  </div>
                  {current && (
                    <button
                      className="stage-insight"
                      onClick={() => inspect()}
                      disabled={blocking}
                    >
                      <span>{clubs.text(current.narration.headline)}</span>
                      <span>
                        <FingerprintIcon size={18} /> Inspect evidence
                      </span>
                    </button>
                  )}
                  <SourceFrameInspector matchId={stage?.match_id} frame={stage?.frame ?? null} events={stage?.recent_events ?? []} replayClock={clock} ready={!!stage} pause={() => setPlaying(false)} />
                  <div className="pitch-footer">
                    <span>
                      <i className="team-dot north-dot" />
                      {clubs.name("NORTH")}
                      <i className="team-dot south-dot" />
                      {clubs.name("SOUTH")}
                    </span>
                    <span>
                      {stage?.tracking_available
                        ? "Latest observation at or before the replay clock. No inferred trajectories."
                        : "Event coordinates are ball positions. Player tracking is unavailable."}
                    </span>
                  </div>
                  {!!current?.overlay.metrics.length && (
                    <div
                      className="broadcast-metrics"
                      aria-label="Verified incident overlay"
                    >
                      <span>INCIDENT EVIDENCE</span>
                      {current.overlay.metrics.map((metric) => (
                        <button
                          key={metric.name}
                          onClick={() => inspect(metric.claim_id)}
                          disabled={blocking}
                        >
                          <small>
                            {metric.name === "regain_x"
                              ? "Regain attack-relative x"
                              : metric.name.replaceAll("_", " ")}
                          </small>
                          <strong>
                            {Number.isInteger(metric.value)
                              ? metric.value
                              : metric.value.toFixed(2)}
                            <em>{metric.unit}</em>
                          </strong>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="transport">
                    <button
                      aria-label="Replay from start"
                      onClick={() => {
                        seek(0);
                      }}
                    >
                      <SkipBackIcon size={20} />
                    </button>
                    <button
                      className="play-button"
                      aria-label={playing ? "Pause replay" : "Play replay"}
                      disabled={!stage || blocking || !playbackReady}
                      onClick={() => setPlaying((v) => !v)}
                    >
                      {playing ? (
                        <PauseIcon size={19} weight="fill" />
                      ) : (
                        <PlayIcon size={19} weight="fill" />
                      )}
                    </button>
                    <span className="transport-time">{clockText(clock)}</span>
                    <input
                      aria-label="Replay clock"
                      type="range"
                      min="0"
                      max={stage?.duration ?? 6000}
                      step="0.25"
                      value={clock}
                      onChange={(e) => {
                        seek(+e.target.value);
                      }}
                    />
                    <span className="duration">
                      {clockText(stage?.duration ?? 0)}
                    </span>
                    <select
                      aria-label="Playback speed"
                      value={speed}
                      onChange={(e) => setSpeed(+e.target.value)}
                    >
                      <option value={1}>1×</option>
                      <option value={4}>4×</option>
                      <option value={12}>12×</option>
                    </select>
                  </div>
                </section>
                <Surface
                  className="current-story"
                  aria-label="Current explanation"
                >
                  <div className="story-kicker">
                    <span className="eyebrow">
                      <span className="lime-dot" />
                      In focus
                    </span>
                    <span>
                      {current?.origin === "recorded_foundry"
                        ? current.narration_status === "enriched"
                          ? "Recorded Foundry · validated enrichment"
                          : "Recorded Foundry · safe narration fallback"
                        : "Source-compiled explanation"}
                    </span>
                  </div>
                  {current ? (
                    <>
                      <h2>{clubs.text(current.narration.headline)}</h2>
                      {current.narration.sentences
                        .filter(
                          (s, i) =>
                            i !== 0 ||
                            !current.narration.headline.endsWith(s.text),
                        )
                        .map((s, i) => (
                          <button
                            className="sentence inline-source-action"
                            key={i}
                            onClick={() => inspect(s.claim_ids[0])}
                          >
                            <span>{clubs.text(s.text)}</span>
                            <span className="source-action-label"><FingerprintIcon size={16} /> Source</span>
                          </button>
                        ))}
                      <div className="story-actions">
                        <button
                          className="primary-button"
                          onClick={() => inspect()}
                        >
                          <FingerprintIcon size={18} />
                          Open Proof Lens
                          <ArrowRightIcon size={17} />
                        </button>
                        <span>
                          <CheckCircleIcon size={15} />
                          Source verified · {current.claim_ids.length} claim
                        </span>
                      </div>
                      <div className="story-clocks">
                        Observed {current.source_seconds}s <span>→</span>{" "}
                        Available {current.available_seconds}s <span>→</span>{" "}
                        Presented {current.presented_seconds}s
                      </div>
                      {current.origin === "recorded_foundry" && (
                        <div className="capture-note">
                          <ActivityIcon size={15} />
                          <span>
                            Genuine recorded workflow · narration:{" "}
                            {current.narration_status} · replay:{" "}
                            {current.overlay_status}. Reverified against this
                            source; no new model call.
                          </span>
                          <button onClick={() => setRoom(true)}>
                            Inspect run <ArrowRightIcon size={13} />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <h2>No new featured moment.</h2>
                      <p>
                        Explore the recorded moments. Score and positions follow the replay clock.
                      </p>
                    </>
                  )}
                </Surface>
                {editorial.presentation.kind === "withheld" ? (
                  <section className="withheld">
                    <ShieldCheckIcon size={24} />
                    <div>
                      <strong>A positional claim was withheld.</strong>
                      <p>
                        {editorial.presentation.diagnostic.reasons.map((r) => r.replaceAll("_", " "))
                          .join(" · ")}
                        . Recent evidence age:{" "}
                        {editorial.presentation.diagnostic.recent_age_seconds ?? "unknown"}s at the recorded review {clockText(editorial.presentation.diagnostic.detected_at_seconds)}. This is
                        a diagnostic, not a broadcast fact.
                      </p>
                    </div>
                  </section>
                ) : null}
                <div className="lower-grid">
                  <Surface className="ask-panel">
                    <span className="eyebrow">Ask the match</span>
                    <h3>A good question starts with evidence.</h3>
                    <div className="question-buttons">
                      {[
                        ["evidence", "What supports this?"],
                        ["before_goal", "What happened before?"],
                        ["position_change", "Why this line change?"],
                        ["coach_intent", "Did the coach intend this?"],
                      ].map(([q, l]) => (
                        <TactileButton
                          disabled={!current || asking || blocking}
                          key={q}
                          onClick={() => ask(q)}
                        >
                          {l}
                          <ArrowRightIcon size={14} />
                        </TactileButton>
                      ))}
                    </div>
                    {asking ? (
                      <p role="status">Resolving source evidence…</p>
                    ) : answer ? (
                      <div className={`answer ${answer.status}`} role="status">
                        <strong>
                          {answer.status === "unsupported"
                            ? "Not supported by these observations"
                            : answer.status === "verified"
                              ? "Source-verified answer"
                              : "Unavailable at this incident"}
                        </strong>
                        <p>{clubs.text(answer.explanation)}</p>
                      </div>
                    ) : (
                      <p className="muted">
                        Restricted questions. Deterministic answers. No invented
                        tactical intent.
                      </p>
                    )}
                  </Surface>
                  <Surface className="recap-panel">
                    <span className="eyebrow">The story so far</span>
                    <h3>At a glance.</h3>
                    {data?.recap.length ? (
                      data.recap.slice(-3).map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            const story = data.timeline.find(
                              (t) => t.id === r.id,
                            );
                            if (story) seekStory(story);
                          }}
                        >
                          <time>{clockText(r.time)}</time>
                          <span>{clubs.text(r.text)}</span>
                        </button>
                      ))
                    ) : (
                      <p>No approved moments yet.</p>
                    )}
                    <small>
                      Only observations available by the current clock.
                    </small>
                  </Surface>
                </div>
              </>
            )}
            <button
              className="mobile-agent-entry"
              onClick={() => setRoom(true)}
            >
              <ActivityIcon size={18} />
              Open Studio
              <ArrowRightIcon size={16} />
            </button>
            <footer className="app-footer">
              <span>Turn of Play · Inside the Game 2026</span>
              <span>Synthetic data · English · Observations, with limits.</span>
            </footer>
          </section>
          <aside className="timeline-panel">
            <header>
              <span className="eyebrow">The broadcast feed</span>
              <h2>Moments that matter.</h2>
              <p>
                <span className="lime-dot" />
                {data?.timeline.length ?? 0} available moments ·{" "}
                {audience === "fan" ? "Fan" : "Analyst"} view
              </p>
            </header>
            <div className="timeline-scroll">
              {data?.timeline.length ? (
                [...data.timeline].reverse().map((t) => (
                  <button
                    className={`timeline-item ${current?.id === t.id ? "selected" : ""}`}
                    key={t.id}
                    onClick={() => seekStory(t)}
                  >
                    <time>{clockText(t.source_seconds)}</time>
                    <div>
                      <span className="timeline-kind">
                        {t.type.replaceAll("_", " ")}
                      </span>
                      <strong>{clubs.text(t.narration.headline)}</strong>
                      <small>
                        <CheckCircleIcon size={12} />
                        Verified source
                        <CaretRightIcon size={13} />
                      </small>
                    </div>
                  </button>
                ))
              ) : (
                <p className="empty-feed">
                  Approved moments appear here when their presentation clock is
                  reached.
                </p>
              )}
            </div>
            <div className="feed-footer">
              <ShieldCheckIcon size={17} />
              <span>
                Every sentence links to its evidence.
                <br />
                Seek back to test what was known.
              </span>
            </div>
          </aside>
        </main>
  );
}
