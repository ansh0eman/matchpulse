import { useEffect, useRef, useState } from "react";
import {
  ActivityIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CaretRightIcon,
  CircleNotchIcon,
  FingerprintIcon,
  FootballIcon,
  ListIcon,
  PauseIcon,
  PlayIcon,
  ShieldCheckIcon,
  SkipBackIcon,
  XIcon,
} from "@phosphor-icons/react";
import type {
  Activity,
  Answer,
  Audience,
  Proof,
  Scenario,
  Story,
  Team,
  View,
} from "./contracts";
import { get } from "./api";
import { RecordedRun } from "./RecordedRun";
import { useDialog } from "./useDialog";
import { Pitch } from "./Pitch";
import { ProofLens, clockText } from "./ProofLens";
import { BroadcastTheatre } from "./broadcast/BroadcastTheatre";
import { CHAPTERS, GuidedStory } from "./demo/GuidedStory";
import { WorkflowGraph } from "./agents/WorkflowGraph";

export default function App() {
  const [mode, setMode] = useState(() => {
    const view = new URLSearchParams(window.location.search).get("view");
    return view === "studio" || view === "broadcast" ? view : "theatre";
  });
  const [tour, setTour] = useState<number | null>(null),
    [tourSeconds, setTourSeconds] = useState(0),
    [tourRunning, setTourRunning] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]),
    [scenario, setScenario] = useState(() => mode === "studio" ? "open-play" : "line-shift"),
    [clock, setClock] = useState(() => mode === "studio" ? 356 : 3360),
    [audience, setAudience] = useState<Audience>("fan"),
    [favorite, setFavorite] = useState<Team | "">("");
  const [snapshot, setData] = useState<View | null>(null),
    [loadedParams, setLoadedParams] = useState(""),
    [error, setError] = useState<string | null>(null),
    [loading, setLoading] = useState(true),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(4),
    [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<string | null>(null),
    [drawer, setDrawer] = useState(false),
    [proof, setProof] = useState<Proof | null>(null),
    [proofError, setProofError] = useState<string | null>(null),
    [proofLoading, setProofLoading] = useState(false),
    [claimId, setClaimId] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null),
    [room, setRoom] = useState(false),
    [guide, setGuide] = useState(false),
    [answer, setAnswer] = useState<Answer | null>(null),
    [asking, setAsking] = useState(false);
  const generation = useRef(0),
    pendingSelection = useRef<string | null>(null),
    askController = useRef<AbortController | null>(null);
  useDialog(drawer || room || guide);
  const currentScenario = scenarios.find((s) => s.id === scenario);
  const params = new URLSearchParams({
    scenario,
    clock: String(clock),
    audience,
    ...(favorite ? { favorite } : {}),
  }).toString();
  // Never display a previous clock/audience/fixture while its replacement loads.
  const data = loadedParams === params ? snapshot : null;
  const current: Story | undefined =
    data?.timeline.find((t) => t.id === selected) ??
    [...(data?.timeline ?? [])]
      .reverse()
      .find((t) => !["match_boundary", "high_turnover"].includes(t.type)) ??
    data?.timeline.at(-1);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", mode);
    window.history.replaceState(null, "", url);
  }, [mode]);
  useEffect(() => {
    if (tour === null || !tourRunning || !data || room) return;
    const timer = setInterval(() => setTourSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [tour, tourRunning, data?.scenario, !!data, room]);
  useEffect(() => {
    if (tour === null) return;
    if (tour === 0 && tourSeconds === 3) setClock(2371);
    if (tourSeconds >= CHAPTERS[tour].seconds) nextChapter();
  }, [tour, tourSeconds]);
  useEffect(() => {
    if (tour !== 2 || data?.scenario !== "line-shift") return;
    const item = data.timeline.find(
      (s) => s.type === "observed_line_height_change",
    );
    if (item) {
      setClaimId(item.claim_ids[0]);
      setProof(null);
      setDrawer(true);
    }
  }, [tour, data?.scenario]);
  useEffect(() => {
    const c = new AbortController();
    get<Scenario[]>("/api/scenarios", c.signal)
      .then(setScenarios)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    get<Activity>("/api/activity", c.signal)
      .then(setActivity)
      .catch(() => {});
    return () => c.abort();
  }, []);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    get<View>(`/api/view?${params}`, c.signal)
      .then((v) => {
        setData(v);
        setLoadedParams(params);
        setLoading(false);
        if (v.clock >= v.duration) setPlaying(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(e.message);
          setLoading(false);
          setPlaying(false);
        }
      });
    return () => c.abort();
  }, [params, retry]);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(
      () => setClock((v) => Math.min(data?.duration ?? v, v + speed)),
      1000,
    );
    return () => clearInterval(id);
  }, [playing, speed, data?.duration]);
  useEffect(() => {
    generation.current++;
    askController.current?.abort();
    setAnswer(null);
    setAsking(false);
    setDrawer(false);
    setProof(null);
    setSelected(pendingSelection.current);
    pendingSelection.current = null;
  }, [scenario, clock, audience, favorite]);
  useEffect(() => {
    if (!drawer || !claimId) return;
    const c = new AbortController();
    setProofLoading(true);
    setProofError(null);
    get<Proof>(
      `/api/proof?${params}&claim_id=${encodeURIComponent(claimId)}`,
      c.signal,
    )
      .then((p) => {
        setProof(p);
        setProofLoading(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setProofError(e.message);
          setProofLoading(false);
        }
      });
    return () => c.abort();
  }, [drawer, claimId, params]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawer(false);
        setRoom(false);
        setGuide(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  function choose(s: Scenario) {
    setTour(null);
    pendingSelection.current = null;
    setSelected(null);
    setPlaying(false);
    setData(null);
    setRetry((v) => v + 1);
    setScenario(s.id);
    setClock(s.start);
    setGuide(false);
  }
  function goChapter(index: number) {
    const s = scenarios.find((s) => s.id === CHAPTERS[index].scenario);
    if (!s) return;
    choose(s);
    setMode("theatre");
    setDrawer(false);
    setRoom(false);
    setFavorite("");
    setAudience(index === 1 ? "analyst" : "fan");
    if (index === 0) setClock(2370);
    setTour(index);
    setTourSeconds(0);
    setTourRunning(true);
  }
  function nextChapter() {
    if (tour === null || tour === CHAPTERS.length - 1) {
      setTour(null);
      setTourRunning(false);
    } else goChapter(tour + 1);
  }
  function seekStory(story: Story) {
    setPlaying(false);
    setAnswer(null);
    setSelected(story.id);
    if (clock !== story.presented_seconds) {
      pendingSelection.current = story.id;
      setClock(story.presented_seconds);
    }
  }
  function inspect(id?: string) {
    setPlaying(false);
    setClaimId(id ?? current?.claim_ids[0] ?? null);
    setDrawer(true);
  }
  async function ask(question: string) {
    if (!current || !data) return;
    askController.current?.abort();
    const c = new AbortController();
    askController.current = c;
    const g = generation.current;
    setAsking(true);
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          view: { scenario, clock, audience, favorite: favorite || null },
          question,
          insight_id: current.id,
        }),
        signal: c.signal,
      });
      const a = await r.json();
      if (!r.ok) throw new Error(a.error);
      if (g === generation.current) setAnswer(a);
    } catch (e) {
      if (
        g === generation.current &&
        !(e instanceof DOMException && e.name === "AbortError")
      )
        setAnswer({
          status: "unavailable",
          explanation: e instanceof Error ? e.message : "Question unavailable",
        });
    } finally {
      if (g === generation.current) setAsking(false);
    }
  }
  const tourControls =
    tour === null ? null : (
      <GuidedStory
        chapter={tour}
        seconds={tourSeconds}
        playing={tourRunning}
        next={nextChapter}
        toggle={() => setTourRunning((v) => !v)}
        close={() => {
          setTour(null);
          setTourRunning(false);
        }}
      />
    );
  return (
    <div
      className={`app-shell ${mode !== "studio" ? "theatre-shell" : ""} ${mode === "broadcast" ? "clean-shell" : ""} ${tour !== null ? "tour-active" : ""}`}
    >
      <header className="app-header">
        <a href="/" className="brand" aria-label="MatchPulse home">
          <span className="brand-mark">
            <ActivityIcon size={25} weight="bold" />
          </span>
          matchpulse<span className="brand-ai">AI</span>
        </a>
        <nav aria-label="Studio navigation">
          <button
            className={mode === "theatre" && !room ? "active" : ""}
            onClick={() => {
              setMode("theatre");
              setRoom(false);
            }}
          >
            Theatre
          </button>
          <button
            className={mode === "studio" && !room ? "active" : ""}
            onClick={() => {
              setMode("studio");
              setRoom(false);
            }}
          >
            Broadcast studio
          </button>
          <button onClick={() => setRoom(true)}>
            Agent room
            <span className="nav-dot" />
          </button>
        </nav>
        <div className="header-right">
          <span className="synthetic">
            <span />
            SYNTHETIC MATCH LAB
          </span>
          <button
            className="outline-button guide-button"
            onClick={() => setGuide(true)}
          >
            <PlayIcon size={14} weight="fill" />
            Guided demo
          </button>
        </div>
      </header>
      {mode !== "studio" ? (
        <BroadcastTheatre
          data={data}
          current={current}
          scenario={currentScenario}
          scenarios={scenarios}
          clock={clock}
          playing={playing}
          loading={loading}
          speed={speed}
          audience={audience}
          favorite={favorite}
          error={error}
          clean={mode === "broadcast"}
          choose={choose}
          seek={(value) => {
            setPlaying(false);
            setClock(value);
          }}
          play={() => setPlaying((v) => !v)}
          setSpeed={setSpeed}
          setAudience={setAudience}
          setFavorite={setFavorite}
          inspect={() => inspect()}
          retry={() => setRetry((v) => v + 1)}
          selectStory={seekStory}
          toggleClean={() =>
            setMode(mode === "broadcast" ? "theatre" : "broadcast")
          }
        />
      ) : (
        <main className="studio-layout">
          <aside className="scenario-rail">
            <div className="rail-heading">
              <span className="eyebrow">MATCH STORIES</span>
              <button
                onClick={() => setGuide(true)}
                aria-label="Explore scenarios"
              >
                <ListIcon size={19} />
              </button>
            </div>
            {scenarios.map((s, i) => (
              <button
                className={`scenario-button ${scenario === s.id ? "chosen" : ""}`}
                key={s.id}
                onClick={() => choose(s)}
                aria-label={`Select ${s.title}`}
              >
                <span className="scenario-number">0{i + 1}</span>
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
                Every explanation
                <br />
                has a source.
              </strong>
              <p>
                Verified observations. Explicit limits. Nothing invented to fill
                the silence.
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
                <span className="eyebrow">THE MATCH, EXPLAINED</span>
                <h1>{currentScenario?.title ?? "Broadcast studio"}</h1>
                <p>{currentScenario?.subtitle ?? "Loading source catalog…"}</p>
              </div>
              <span className="replay-badge">RECORDED REPLAY</span>
            </div>
            <div className="personalization">
              <div className="segmented" aria-label="Audience">
                <button
                  aria-pressed={audience === "fan"}
                  className={audience === "fan" ? "active" : ""}
                  onClick={() => setAudience("fan")}
                >
                  Fan view
                </button>
                <button
                  aria-pressed={audience === "analyst"}
                  className={audience === "analyst" ? "active" : ""}
                  onClick={() => setAudience("analyst")}
                >
                  Analyst view
                </button>
              </div>
              <label>
                Following{" "}
                <select
                  aria-label="Favorite team"
                  value={favorite}
                  onChange={(e) => setFavorite(e.target.value as Team | "")}
                >
                  <option value="">Both teams</option>
                  <option value="NORTH">North FC</option>
                  <option value="SOUTH">South FC</option>
                </select>
              </label>
              <span className="local-badge">
                Verified replay · no live model call
              </span>
            </div>
            {error ? (
              <section className="service-error" role="alert">
                <ShieldCheckIcon size={30} />
                <h2>Evidence unavailable.</h2>
                <p>{error}</p>
                <button
                  className="primary-button"
                  onClick={() => setRetry((v) => v + 1)}
                >
                  Retry source connection
                </button>
              </section>
            ) : (
              <>
                <section
                  className={`match-stage ${loading ? "refreshing" : ""}`}
                  aria-label="Match replay"
                >
                  <div className="scoreboard">
                    <div className="team team-home">
                      <span className="crest north">N</span>
                      <span>
                        NORTH <small>FC</small>
                      </span>
                    </div>
                    <div className="score-center">
                      <span className="period">PERIOD {data?.period ?? 1}</span>
                      <strong data-testid="score">
                        {data?.score.home ?? "–"}
                        <i>:</i>
                        {data?.score.away ?? "–"}
                      </strong>
                      <span className="match-clock" data-testid="clock">
                        {clockText(clock)}
                      </span>
                    </div>
                    <div className="team team-away">
                      <span>
                        SOUTH <small>FC</small>
                      </span>
                      <span className="crest south">S</span>
                    </div>
                  </div>
                  <div className="pitch-heading">
                    <span>
                      <span className="lime-dot" />
                      {data?.tracking_available
                        ? "OBSERVED TRACKING"
                        : "OBSERVED EVENT LOCATIONS"}
                    </span>
                    <span>
                      {data?.frame
                        ? `Source frame ${data.frame.time_seconds}s · age ${data.frame_age?.toFixed(1)}s`
                        : "No tracking supplied for this match"}
                    </span>
                  </div>
                  {current && (
                    <button
                      className="stage-insight"
                      onClick={() => inspect()}
                      disabled={loading}
                    >
                      <span>{current.narration.headline}</span>
                      <span>
                        <FingerprintIcon size={18} /> Inspect evidence
                      </span>
                    </button>
                  )}
                  <div className="pitch-wrap">
                    <Pitch
                      frame={data?.frame ?? null}
                      events={data?.recent_events ?? []}
                    />
                    {!data && (
                      <div className="pitch-loading">
                        <CircleNotchIcon className="spin" size={30} />
                        <span>Verifying canonical source…</span>
                      </div>
                    )}
                  </div>
                  <div className="pitch-footer">
                    <span>
                      <i className="team-dot north-dot" />
                      North FC
                      <i className="team-dot south-dot" />
                      South FC
                    </span>
                    <span>
                      {data?.tracking_available
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
                          disabled={loading}
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
                        setPlaying(false);
                        setClock(0);
                      }}
                    >
                      <SkipBackIcon size={20} />
                    </button>
                    <button
                      className="play-button"
                      aria-label={playing ? "Pause replay" : "Play replay"}
                      disabled={!data || loading}
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
                      max={data?.duration ?? 6000}
                      step="0.5"
                      value={clock}
                      onChange={(e) => {
                        setPlaying(false);
                        setClock(+e.target.value);
                      }}
                    />
                    <span className="duration">
                      {clockText(data?.duration ?? 0)}
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
                <section
                  className="current-story"
                  aria-label="Current explanation"
                >
                  <div className="story-kicker">
                    <span className="eyebrow">
                      <span className="lime-dot" />
                      IN FOCUS
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
                      <h2>
                        <button
                          className="headline-proof"
                          onClick={() =>
                            inspect(
                              current.narration.sentences[0]?.claim_ids[0],
                            )
                          }
                        >
                          {current.narration.headline}
                          <FingerprintIcon size={18} />
                        </button>
                      </h2>
                      {current.narration.sentences
                        .filter(
                          (s, i) =>
                            i !== 0 ||
                            !current.narration.headline.endsWith(s.text),
                        )
                        .map((s, i) => (
                          <button
                            className="sentence"
                            key={i}
                            onClick={() => inspect(s.claim_ids[0])}
                          >
                            <span>{s.text}</span>
                            <FingerprintIcon size={18} />
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
                      <h2>Let the game breathe.</h2>
                      <p>
                        No eligible story at this clock. We wait for evidence
                        rather than invent commentary.
                      </p>
                    </>
                  )}
                </section>
                {data?.diagnostics.length ? (
                  <section className="withheld">
                    <ShieldCheckIcon size={24} />
                    <div>
                      <strong>A positional claim was withheld.</strong>
                      <p>
                        {data.diagnostics
                          .at(-1)
                          ?.reasons.map((r) => r.replaceAll("_", " "))
                          .join(" · ")}
                        . Recent evidence age:{" "}
                        {data.diagnostics.at(-1)?.recent_age_seconds}s. This is
                        a diagnostic, not a broadcast fact.
                      </p>
                    </div>
                  </section>
                ) : null}
                <div className="lower-grid">
                  <section className="ask-panel">
                    <span className="eyebrow">ASK THE MATCH</span>
                    <h3>A good question starts with evidence.</h3>
                    <div className="question-buttons">
                      {[
                        ["evidence", "What supports this?"],
                        ["before_goal", "What happened before?"],
                        ["position_change", "Why this line change?"],
                        ["coach_intent", "Did the coach intend this?"],
                      ].map(([q, l]) => (
                        <button
                          disabled={!current || asking || loading}
                          key={q}
                          onClick={() => ask(q)}
                        >
                          {l}
                          <ArrowRightIcon size={14} />
                        </button>
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
                        <p>{answer.explanation}</p>
                      </div>
                    ) : (
                      <p className="muted">
                        Restricted questions. Deterministic answers. No invented
                        tactical intent.
                      </p>
                    )}
                  </section>
                  <section className="recap-panel">
                    <span className="eyebrow">THE STORY SO FAR</span>
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
                          <span>{r.text}</span>
                        </button>
                      ))
                    ) : (
                      <p>No approved moments yet.</p>
                    )}
                    <small>
                      Only observations available by the current clock.
                    </small>
                  </section>
                </div>
              </>
            )}
            <button
              className="mobile-agent-entry"
              onClick={() => setRoom(true)}
            >
              <ActivityIcon size={18} />
              Open agent room
              <ArrowRightIcon size={16} />
            </button>
            <footer className="app-footer">
              <span>MatchPulse AI · Inside the Game 2026</span>
              <span>Synthetic data · English · Observations, with limits.</span>
            </footer>
          </section>
          <aside className="timeline-panel">
            <header>
              <span className="eyebrow">THE BROADCAST FEED</span>
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
                      <strong>{t.narration.headline}</strong>
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
      )}
      {!drawer && !room && tourControls}
      {drawer && (
        <ProofLens
          key={claimId}
          proof={proof}
          close={() => setDrawer(false)}
          loading={proofLoading}
          error={proofError}
          footer={tourControls}
        />
      )}
      {room && (
        <div className="modal-scrim" onClick={() => setRoom(false)}>
          <section
            className="agent-room"
            role="dialog"
            aria-modal="true"
            aria-labelledby="room-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close agent room"
              onClick={() => setRoom(false)}
              autoFocus
            >
              <XIcon size={23} />
            </button>
            <span className="eyebrow">GENUINE INTEGRATION EVIDENCE</span>
            <h2 id="room-title">Inside the agent room.</h2>
            <p>
              Recorded Foundry and Microsoft Agent Framework workflows,
              source-reverified before display. One saved goal has enriched
              narration and replay; other cards are deterministic. Opening this
              panel makes no model request.
            </p>
            {activity ? (
              <>
                <div className="integration-summary">
                  <CheckCircleIcon size={28} weight="fill" />
                  <div>
                    <strong>
                      {activity.tests_passed} integration checks passed
                    </strong>
                    <span>
                      {activity.date} · {activity.deployment}
                    </span>
                  </div>
                </div>
                <WorkflowGraph capture={activity.capture} />
                {activity.capture_summary && (
                  <div className="integration-summary">
                    <ActivityIcon size={26} />
                    <div>
                      <strong>
                        Persisted, source-verified Foundry workflow ·{" "}
                        {activity.capture_summary.elapsed_seconds.toFixed(2)}s
                      </strong>
                      <span>
                        {activity.capture_summary.agent_request_attempts} agent
                        requests · {activity.capture.tools.length} successful
                        evidence-tool calls ·{" "}
                        {activity.capture_summary.reported_tokens.input} input /{" "}
                        {activity.capture_summary.reported_tokens.output} output
                        tokens
                      </span>
                    </div>
                  </div>
                )}
                <RecordedRun capture={activity.capture} />
                {activity.recovery_capture && (
                  <details>
                    <summary>See the historical narration recovery</summary>
                    <WorkflowGraph
                      capture={activity.recovery_capture}
                      label="Historical Foundry recovery"
                    />
                    <RecordedRun capture={activity.recovery_capture} />
                  </details>
                )}
                <h3>Model-requested evidence tools</h3>
                <div className="tool-tags">
                  {activity.tools.map((t) => (
                    <code key={t}>{t}</code>
                  ))}
                </div>
                <div className="proof-metrics">
                  <span>
                    <strong>
                      {activity.proof.latency_seconds.toFixed(2)}s
                    </strong>
                    minimal proof latency
                  </span>
                  <span>
                    <strong>
                      {activity.proof.usage.input_token_count} /{" "}
                      {activity.proof.usage.output_token_count}
                    </strong>
                    proof input / output tokens
                  </span>
                </div>
                <details>
                  <summary>What the recorded checks establish</summary>
                  <ul>
                    {activity.gates.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                  <code className="hash">
                    Proof SHA-256: {activity.proof_sha256}
                  </code>
                </details>
                <div className="limitations">
                  <strong>Evidence boundary</strong>
                  <p>
                    {activity.limitations} A tactical agent exists but is not
                    proved by this goal capture.
                    {activity.capture_summary && (
                      <>
                        <br />
                        {activity.capture_summary.counter_status} Agent requests
                        and reported token counts are available; an actual
                        network-request total is not attested.
                      </>
                    )}
                  </p>
                </div>
              </>
            ) : (
              <p>Recorded integration evidence is unavailable.</p>
            )}
          </section>
        </div>
      )}
      {guide && (
        <div className="modal-scrim" onClick={() => setGuide(false)}>
          <section
            className="guide-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close guided demo"
              onClick={() => setGuide(false)}
              autoFocus
            >
              <XIcon size={23} />
            </button>
            <span className="eyebrow">FIVE WAYS TO TEST THE STORY</span>
            <h2 id="guide-title">
              Don’t just watch.
              <br />
              Interrogate the explanation.
            </h2>
            <p>
              Choose a source-isolated scenario, seek through the match, then
              open a sentence’s Proof Lens.
            </p>
            <button
              className="evidence-button start-story"
              onClick={() => goChapter(0)}
              disabled={!scenarios.length}
            >
              <PlayIcon size={20} />
              Watch the story · 76 seconds
              <ArrowRightIcon size={20} />
            </button>
            {scenarios.map((s, i) => (
              <button
                className="guide-scenario"
                key={s.id}
                onClick={() => choose(s)}
              >
                <span>0{i + 1}</span>
                <div>
                  <strong>{s.title}</strong>
                  <small>{s.subtitle}</small>
                </div>
                <ArrowRightIcon size={22} />
              </button>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
