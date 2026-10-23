import {
  ArrowRightIcon,
  FingerprintIcon,
  PauseIcon,
  PlayIcon,
  ArrowsOutIcon,
  ArrowCounterClockwiseIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import type { Audience, Scenario, Story, Team, View } from "../contracts";
import { Pitch } from "../Pitch";
import { clockText } from "../ProofLens";
import { momentCopy } from "./presentation";

interface Props {
  data: View | null;
  current: Story | undefined;
  scenario: Scenario | undefined;
  scenarios: Scenario[];
  clock: number;
  playing: boolean;
  loading: boolean;
  speed: number;
  audience: Audience;
  favorite: Team | "";
  error: string | null;
  clean: boolean;
  choose: (s: Scenario) => void;
  seek: (s: number) => void;
  play: () => void;
  setSpeed: (s: number) => void;
  setAudience: (a: Audience) => void;
  setFavorite: (t: Team | "") => void;
  inspect: () => void;
  retry: () => void;
  selectStory: (s: Story) => void;
  toggleClean: () => void;
}
export function BroadcastTheatre(p: Props) {
  const copy = momentCopy(p.current, p.audience);
  const withheld = p.data?.diagnostics.find((d) =>
    d.reasons.includes("stale_recent_evidence"),
  );
  return (
    <main
      className={`theatre ${p.clean ? "program-output" : ""}`}
      aria-label="Broadcast Theatre"
    >
      <div className="theatre-caption">
        <p>
          <strong>Proof, not just commentary.</strong>
          <span> A synthetic match. An explanation you can inspect.</span>
        </p>
        <button onClick={p.toggleClean}>
          <ArrowsOutIcon size={17} />
          {p.clean ? "Exit program output" : "Program output"}
        </button>
      </div>
      {p.error ? (
        <section role="alert" className="theatre-error">
          <ShieldCheckIcon size={32} />
          <h1>The source is unavailable.</h1>
          <p>{p.error}</p>
          <button className="evidence-button" onClick={p.retry}>
            Retry source connection
          </button>
        </section>
      ) : (
        <>
          <section
            className={`theatre-stage ${p.loading ? "is-loading" : ""}`}
            aria-label="Observed match stage"
          >
            <div className="theatre-scorebug">
              <span className="score-club">NORTH</span>
              <strong data-testid="score">
                {p.data?.score.home ?? "–"}
                <i>:</i>
                {p.data?.score.away ?? "–"}
              </strong>
              <span className="score-club">SOUTH</span>
              <time data-testid="clock">{clockText(p.clock)}</time>
              <span className="score-period">P{p.data?.period ?? "–"}</span>
            </div>
            <div className="theatre-source">
              <span className="status-dot" />
              Synthetic replay
              <br />
              <small>
                {p.data?.tracking_available
                  ? `Observed frame · ${p.data.frame_age?.toFixed(1) ?? "–"}s old`
                  : "Event locations · no player tracking"}
              </small>
            </div>
            <div className="theatre-pitch">
              <Pitch
                frame={p.data?.frame ?? null}
                events={p.data?.recent_events ?? []}
              />
            </div>
            {!p.data && (
              <div className="theatre-loading" role="status">
                Reconnecting the clock to its source…
              </div>
            )}
            <div className="moment-lower-third" key={p.current?.id ?? "empty"}>
              <div className="moment-copy">
                <span className={`moment-label ${withheld ? "caution" : ""}`}>
                  {withheld
                    ? "EVIDENCE WITHHELD"
                    : `${p.current?.team ?? "MATCH"} · ${p.current?.type.replaceAll("_", " ") ?? "SOURCE REPLAY"}`}
                </span>
                <h1>
                  {withheld ? "Sometimes, the evidence says wait." : copy.title}
                </h1>
                <p>
                  {withheld
                    ? `The latest positional evidence is ${withheld.recent_age_seconds}s old. This claim stays off air.`
                    : copy.detail}
                </p>
              </div>
              <button
                className="evidence-button"
                aria-label="Open Proof Lens"
                onClick={p.inspect}
                disabled={!p.current || p.loading}
              >
                <FingerprintIcon size={22} />
                Open Proof Lens
                <ArrowRightIcon size={20} />
              </button>
            </div>
          </section>
          {!p.clean && (
            <>
              <div className="theatre-transport">
                <button
                  aria-label={p.playing ? "Pause replay" : "Play replay"}
                  onClick={p.play}
                  disabled={!p.data || p.loading}
                >
                  {p.playing ? (
                    <PauseIcon size={22} weight="fill" />
                  ) : (
                    <PlayIcon size={22} weight="fill" />
                  )}
                </button>
                <button
                  aria-label="Replay from start"
                  onClick={() => p.seek(0)}
                >
                  <ArrowCounterClockwiseIcon size={20} />
                </button>
                <time>{clockText(p.clock)}</time>
                <input
                  aria-label="Replay clock"
                  type="range"
                  min={0}
                  max={p.data?.duration ?? p.scenario?.start ?? 6000}
                  step={0.5}
                  value={p.clock}
                  onChange={(e) => p.seek(+e.target.value)}
                />
                <span>{clockText(p.data?.duration ?? 0)}</span>
                <select
                  aria-label="Playback speed"
                  value={p.speed}
                  onChange={(e) => p.setSpeed(+e.target.value)}
                >
                  <option value={1}>1×</option>
                  <option value={4}>4×</option>
                  <option value={12}>12×</option>
                </select>
              </div>
              <div className="theatre-settings">
                <div className="theatre-audience" aria-label="Audience">
                  <button
                    aria-pressed={p.audience === "fan"}
                    onClick={() => p.setAudience("fan")}
                  >
                    Fan view
                  </button>
                  <button
                    aria-pressed={p.audience === "analyst"}
                    onClick={() => p.setAudience("analyst")}
                  >
                    Analyst view
                  </button>
                </div>
                <label>
                  Following{" "}
                  <select
                    aria-label="Favorite team"
                    value={p.favorite}
                    onChange={(e) => p.setFavorite(e.target.value as Team | "")}
                  >
                    <option value="">Both teams</option>
                    <option value="NORTH">North FC</option>
                    <option value="SOUTH">South FC</option>
                  </select>
                </label>
                <span className="theatre-provenance">
                  {p.current?.origin === "recorded_foundry"
                    ? p.current.narration_status === "enriched"
                      ? "Recorded Foundry · validated enrichment"
                      : "Recorded Foundry · narration fallback"
                    : "Source-compiled presentation"}{" "}
                  · no live model call
                </span>
              </div>
              <div
                className="scenario-chapters"
                aria-label="Separate synthetic scenarios"
              >
                {p.scenarios.map((s, i) => (
                  <button
                    key={s.id}
                    aria-label={`Select ${s.title}`}
                    aria-pressed={s.id === p.scenario?.id}
                    onClick={() => p.choose(s)}
                  >
                    <span>0{i + 1}</span>
                    <div>
                      <strong>{s.title}</strong>
                      <small>
                        {s.tracking
                          ? "Observed tracking"
                          : "Event-only fixture"}
                      </small>
                    </div>
                    <ArrowRightIcon size={16} />
                  </button>
                ))}
              </div>
              <div className="theatre-available">
                <span>AVAILABLE MOMENTS</span>
                <div>
                  {[...(p.data?.timeline ?? [])]
                    .reverse()
                    .slice(0, 5)
                    .map((s) => (
                      <button key={s.id} onClick={() => p.selectStory(s)}>
                        <time>{clockText(s.presented_seconds)}</time>
                        {momentCopy(s, p.audience).title}
                      </button>
                    ))}
                </div>
                <p>
                  Each chapter is a separate synthetic fixture. Player labels
                  are source IDs. Positions are observed snapshots; no movement
                  between them is inferred.
                </p>
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
