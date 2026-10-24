import {
  ArrowsOutIcon,
  ArrowRightIcon,
  FingerprintIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import type { Audience, Scenario, Story, Team, View } from "../contracts";
import { Pitch } from "../Pitch";
import { clockText } from "../ProofLens";
import { momentCopy } from "./presentation";
import { ReplayControls } from "./ReplayControls";
import { MatchTimeline } from "./MatchTimeline";

interface Props {
  data: View | null;
  current: Story | undefined;
  scenario: Scenario | undefined;
  scenarios: Scenario[];
  clock: number;
  playing: boolean;
  loading: boolean;
  buffering: boolean;
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
  const metrics = p.current?.overlay.metrics ?? [];
  const before = metrics.find((m) => m.name === "before")?.value;
  const after = metrics.find((m) => m.name === "after")?.value;
  const positional = p.current?.type === "observed_line_height_change";
  const frameCount = new Set(
    p.current?.overlay.references
      .filter((r) => r.category === "tracking")
      .map((r) => r.source_id),
  ).size;
  const withheld = p.data?.diagnostics.find((d) =>
    d.reasons.includes("stale_recent_evidence"),
  );
  return (
    <main
      id="matchday"
      className={`theatre matchday ${p.clean ? "program-output" : ""}`}
      aria-label="Broadcast Theatre"
    >
      <div className="md-context theatre-caption">
        <div>
          <span>Matchday</span>
          <h2>
            North <i>v</i> South
          </h2>
        </div>
        <div className="md-context-actions">
          <span>Synthetic match replay</span>
          <button onClick={p.toggleClean}>
            <ArrowsOutIcon size={17} aria-hidden="true" />
            {p.clean ? "Exit program output" : "Program output"}
          </button>
        </div>
      </div>
      {p.error && (
        <section role="alert" className="theatre-error">
          <ShieldCheckIcon size={24} aria-hidden="true" />
          <div>
            <h2>The replay couldn’t load.</h2>
            <p>{p.error}</p>
          </div>
          <button onClick={p.retry}>Retry source connection</button>
        </section>
      )}
      <div className="md-arena">
        <section
          className={`theatre-stage ${p.loading ? "is-loading" : ""}`}
          aria-label="Observed match stage"
        >
          <div className="md-score-row">
            <div className="theatre-scorebug">
              <span className="score-club">
                <i className="md-team-north" />
                North
              </span>
              <strong
                data-testid="score"
                key={`${p.data?.score.home}:${p.data?.score.away}`}
              >
                {p.data?.score.home ?? "–"}
                <i>:</i>
                {p.data?.score.away ?? "–"}
              </strong>
              <span className="score-club">
                South
                <i className="md-team-south" />
              </span>
              <time data-testid="clock">
                {clockText(p.data?.clock ?? p.clock)}
              </time>
              <span className="score-period">
                {p.data ? `Half ${p.data.period}` : ""}
              </span>
            </div>
            <span className="theatre-source" role="status">
              {p.buffering
                ? "Buffering replay…"
                : p.data
                  ? "Recorded replay"
                  : p.error
                    ? "Replay unavailable"
                    : "Loading match…"}
            </span>
          </div>
          <div className="theatre-pitch">
            <Pitch
              frame={p.data?.frame ?? null}
              events={p.data?.recent_events ?? []}
            />
            {!p.data && (
              <div className="theatre-loading" role="status">
                {p.error
                  ? "Match observations unavailable"
                  : "Loading the match…"}
              </div>
            )}
            <div className="md-pitch-key">
              <span>
                <i className="md-team-north" />
                North
              </span>
              <span>
                <i className="md-team-south" />
                South
              </span>
              <small>
                {p.data?.tracking_available
                  ? "Observed positions"
                  : p.data
                    ? "Ball locations only"
                    : ""}
              </small>
            </div>
          </div>
          <div className="moment-lower-third" key={p.current?.id ?? "empty"}>
            <div className="moment-copy" aria-live="polite" aria-atomic="true">
              <span className="moment-label">
                {withheld
                  ? "Position review"
                  : p.current
                    ? `At ${clockText(p.current.source_seconds)}`
                    : "Your matchday"}
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
              onClick={p.inspect}
              disabled={!p.current || p.loading}
            >
              <FingerprintIcon size={19} aria-hidden="true" />
              Open Proof Lens
            </button>
            {positional && before !== undefined && after !== undefined && (
              <div
                className="stage-measurements"
                aria-label="Verified line comparison"
              >
                <strong>
                  {before.toFixed(2)}
                  <small>m</small>
                </strong>
                <ArrowRightIcon size={18} aria-hidden="true" />
                <strong>
                  {after.toFixed(2)}
                  <small>m</small>
                </strong>
                <p>
                  {frameCount} original source frames · context-weighted means
                </p>
              </div>
            )}
          </div>
        </section>
        {!p.clean && (
          <>
            <ReplayControls
              clock={p.clock}
              duration={p.data?.duration ?? 0}
              playing={p.playing}
              disabled={!p.data || p.loading || !!p.error}
              speed={p.speed}
              moments={p.data?.timeline ?? []}
              play={p.play}
              seek={p.seek}
              setSpeed={p.setSpeed}
            />
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
            </div>
            <MatchTimeline
              moments={p.data?.timeline ?? []}
              audience={p.audience}
              selected={p.current?.id}
              select={p.selectStory}
            />
          </>
        )}
      </div>
      {!p.clean && (
        <footer className="md-library">
          <span>Explore another match</span>
          <nav
            className="scenario-chapters"
            aria-label="Separate synthetic scenarios"
          >
            {p.scenarios.map((s) => (
              <button
                key={s.id}
                aria-label={`Select ${s.title}`}
                aria-pressed={s.id === p.scenario?.id}
                onClick={() => p.choose(s)}
              >
                {s.title}
              </button>
            ))}
          </nav>
          <details className="md-replay-info">
            <summary>About this replay</summary>
            <p>
              Each demo is a separate synthetic match. Player labels are source
              IDs, not shirt numbers. Positions are original observations;
              movement between them is not inferred.{" "}
              {p.current?.origin === "recorded_foundry"
                ? "This moment uses a saved Microsoft Foundry run, checked against its original match."
                : "This presentation is compiled from verified observations."}{" "}
              No live model call is made during playback.
            </p>
          </details>
        </footer>
      )}
    </main>
  );
}
