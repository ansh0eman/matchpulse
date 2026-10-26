import { commentaryCopy, commentaryRank } from "./commentaryCopy";
import { CommentarySettings } from "./CommentarySettings";
import { useClubs } from "../clubs/Clubs";
import type { selectEditorial } from "./editorial";
import type { SourceSnapshot } from "../playback/source";
import { StatusBanner } from "../ui/Surface";
import { ViewModeControl, FollowingControl } from "../shell/Preferences";
import { useEffect, useRef, useState } from "react";
import { ActivityIcon, ArrowsOutIcon, CaretRightIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import type { Audience, Scenario, Story, Team, View } from "../contracts";
import { Pitch } from "../Pitch";
import { clockText } from "../ProofLens";
import { ReplayControls } from "./ReplayControls";
import { MatchTimeline } from "./MatchTimeline";
import { MatchdayInvestigation } from "./MatchdayInvestigation";
import { useStorySupport } from "./useStorySupport";
import { useExploration } from "./useExploration";
import { useCommentary } from "./useCommentary";

interface Props {
  editorial: ReturnType<typeof selectEditorial>;
  source: SourceSnapshot | null;
  presentationPending: boolean;
  data: View | null;
  current: Story | undefined;
  latestRecorded: Story | undefined;
  explicitlySelected: boolean;
  scenario: Scenario | undefined;
  scenarios: Scenario[];
  clock: number;
  playing: boolean;
  loading: boolean;
  buffering: boolean;
  playbackReady: boolean;
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
  proofReady: boolean;
  seekRevision: number;
}
export function BroadcastTheatre(p: Props) {
  const clubs = useClubs();
  const [selectionRevision, setSelectionRevision] = useState(0);
  const [compareRequested, setCompareRequested] = useState(false);
  const [arrival, setArrival] = useState<{ id: string; revision: number; scenario: string; seekRevision: number } | null>(null);
  const investigation = useRef<HTMLElement>(null);
  const pitchStage = useRef<HTMLElement>(null);
  const stage = p.data ?? p.source;
  const replayClock = stage?.clock ?? p.clock;
  const availableMoments = p.editorial.available;
  const withheld = p.editorial.presentation.kind === "withheld" ? p.editorial.presentation.diagnostic : undefined;
  const support = useStorySupport({
    scenario: p.scenario, matchId: p.data?.match_id, story: p.current,
    audience: p.audience, favorite: p.favorite, enabled: !withheld,
  });
  const explorationScope = [p.data?.match_id ?? p.scenario?.match_id ?? "loading", p.current?.id ?? "none", p.current?.claim_ids[0] ?? "no-claim", p.current?.presented_seconds ?? ""].join("|");
  const exploration = useExploration(explorationScope);
  const speech = useCommentary(`${p.scenario?.id ?? ""}|${explorationScope}`, p.seekRevision);
  const playbackCursor = useRef<{ scenario: string; clock: number; seekRevision: number } | null>(null);
  const stageFrame = stage?.frame;
  const exactComparisonSample = stageFrame && support.status === "ready"
    ? support.proof?.samples.find((sample) => sample.frame_id === stageFrame.frame_id)
    : undefined;
  const exactShotEvent = p.current?.type === "observed_shot" && stageFrame && p.current.source_seconds === stageFrame.time_seconds
    ? stage?.recent_events.find((event) => p.current?.overlay.references.some((ref) => ref.source_id === event.source_id) && event.time_seconds === stageFrame.time_seconds)
    : undefined;
  const highlightedPlayers = exactComparisonSample?.players.map((player) => player.id)
    ?? (exactShotEvent?.player && stageFrame?.players.some((player) => player.id === exactShotEvent.player) ? [exactShotEvent.player] : []);
  useEffect(() => {
    const scenario = p.scenario?.id ?? "";
    const cursor = playbackCursor.current;
    if (!cursor || cursor.scenario !== scenario || cursor.seekRevision !== p.seekRevision) {
      playbackCursor.current = { scenario, clock: replayClock, seekRevision: p.seekRevision };
      speech.cancel();
      return;
    }
    playbackCursor.current = { scenario, clock: replayClock, seekRevision: p.seekRevision };
    if (!p.playing || replayClock <= cursor.clock) return;
    const crossed = (p.data?.timeline ?? []).filter((story) => {
      const eligibleAt = Math.max(story.source_seconds, story.available_seconds, story.presented_seconds);
      return eligibleAt > cursor.clock && eligibleAt <= replayClock &&
      story.source_seconds <= replayClock && story.available_seconds <= replayClock &&
      story.presented_seconds <= replayClock;
    }).sort((a, b) => Math.max(a.source_seconds, a.available_seconds, a.presented_seconds) - Math.max(b.source_seconds, b.available_seconds, b.presented_seconds) || (a.priority ?? 0) - (b.priority ?? 0));
    const latest = crossed.at(-1);
    if (latest) {
      setArrival((previous) => ({ id: latest.id, revision: (previous?.revision ?? 0) + 1, scenario, seekRevision: p.seekRevision }));
      const spoken = [...crossed].filter(story => commentaryCopy(story,clubs.name)).sort((a,b)=>(commentaryRank[a.type]??0)-(commentaryRank[b.type]??0)||a.presented_seconds-b.presented_seconds).at(-1);
      if (spoken) speech.onArrival(spoken);
    }
  }, [p.scenario?.id, p.seekRevision, replayClock, p.playing, p.data?.timeline, speech.cancel, speech.onArrival, clubs.name]);
  useEffect(() => { if (!p.playing) speech.cancel(); }, [p.playing, speech.cancel]);
  useEffect(() => { setCompareRequested(false); }, [explorationScope]);
  useEffect(() => {
    const requiredSupportReady = p.current?.type !== "observed_line_height_change" || support.status === "ready";
    if (compareRequested && p.proofReady && requiredSupportReady && !withheld && p.current) exploration.mark("compare");
  }, [compareRequested, p.proofReady, support.status, withheld, p.current, exploration.mark]);
  useEffect(() => {
    if (!selectionRevision || !window.matchMedia("(max-width: 767px)").matches) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frame = window.requestAnimationFrame(() => {
      investigation.current?.scrollIntoView({
        behavior: reducedMotion ? "instant" : "smooth",
        block: "start",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectionRevision]);
  const selectStory = (story: Story, reveal: boolean) => {
    if (!availableMoments.some((moment) => moment.id === story.id)) return;
    p.selectStory(story);
    if (reveal) setSelectionRevision((revision) => revision + 1);
  };
  return (
    <main
      id="matchday"
      className={`theatre matchday ${p.clean ? "program-output" : ""}`}
      style={clubs.style}
      aria-label="Broadcast Theatre"
    >
      <div className="md-livebar">
        <button onClick={p.toggleClean}>
            <ArrowsOutIcon size={17} aria-hidden="true" />
            {p.clean ? "Exit program output" : "Program output"}
        </button>

      </div>
      {p.presentationPending && <StatusBanner className="presentation-pending">Updating explanation… Source playback continues.</StatusBanner>}
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
          ref={pitchStage}
          tabIndex={-1}
        >
          <div className="md-score-row">
            <div className="theatre-scorebug">
              <span className="score-club">
                <i className="md-team-north" />
                <span aria-label={clubs.name("NORTH")}>{clubs.club("NORTH").shortName}</span>
              </span>
              <strong
                data-testid="score"
                key={`${stage?.score.home}:${stage?.score.away}`}
              >
                {stage?.score.home ?? "–"}
                <i>:</i>
                {stage?.score.away ?? "–"}
              </strong>
              <span className="score-club">
                <span aria-label={clubs.name("SOUTH")}>{clubs.club("SOUTH").shortName}</span>
                <i className="md-team-south" />
              </span>
              <span className="clock-context-label">Current replay</span>
              <time data-testid="clock" aria-label="Current replay time">
                {clockText(p.data?.clock ?? p.clock)}
              </time>
              <span className="score-period">
                {stage ? `Half ${stage.period}` : ""}
              </span>
            </div>
            <div className="match-header-preferences"><ViewModeControl value={p.audience} onChange={p.setAudience} /><FollowingControl value={p.favorite} onChange={p.setFavorite} /></div>
            <span className={`theatre-source${p.buffering ? " is-buffering" : ""}`} role="status">
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
              frame={stage?.frame ?? null}
              events={stage?.recent_events ?? []}
              highlight={highlightedPlayers}
              highlightedBall={!!exactShotEvent}
            />
            {!stage && (
              <div className="theatre-loading" role="status">
                {p.error
                  ? "Match observations unavailable"
                  : "Loading the match…"}
              </div>
            )}
            <div className="md-pitch-key">
              <span>
                <i className="md-team-north" />
                <span aria-label={clubs.name("NORTH")}>{clubs.club("NORTH").shortName}</span>
              </span>
              <span>
                <i className="md-team-south" />
                <span aria-label={clubs.name("SOUTH")}>{clubs.club("SOUTH").shortName}</span>
              </span>
              <small>
                {stage?.tracking_available
                  ? "Observed positions"
                  : p.data
                    ? "Ball locations only"
                    : ""}
              </small>
            </div>
          </div>
        </section>
        {!p.clean && (
          <>
            <ReplayControls
              clock={p.clock}
              duration={stage?.duration ?? 0}
              playing={p.playing}
              disabled={!stage || !p.playbackReady || p.loading || !!p.error}
              speed={p.speed}
              moments={availableMoments}
              play={p.play}
              seek={p.seek}
              setSpeed={p.setSpeed}
              commentary={speech.commentary}
              commentaryAvailable={speech.voiceAvailable}
              onToggleCommentary={speech.toggleCommentary}
              captions={speech.captions}
              onToggleCaptions={() => speech.setCaptions((value) => !value)}
              caption={speech.caption}
              voiceSettings={<CommentarySettings speech={speech} />}
            />
            <MatchTimeline
              seekRevision={p.seekRevision}
              scenarioId={p.scenario?.id}
              moments={availableMoments}
              replayClock={replayClock}
              duration={stage?.duration ?? 0}
              audience={p.audience}
              selected={p.explicitlySelected ? p.current?.id : undefined}
              latest={p.latestRecorded?.id}
              arrival={arrival && arrival.scenario === p.scenario?.id && arrival.seekRevision === p.seekRevision ? arrival.id : undefined}
              arrivalRevision={arrival?.revision ?? 0}
              select={selectStory}
            />
            <MatchdayInvestigation
              data={p.data}
              story={p.current}
              scenario={p.scenario}
              audience={p.audience}
              favorite={p.favorite}
              replayClock={replayClock}
              selected={p.explicitlySelected}
              diagnostic={withheld}
              presentationKind={p.editorial.presentation.kind}
              withheld={!!withheld}
              railRef={investigation}
              support={support}
              explored={exploration.explored}
              onWatch={() => {
                if (!p.current || !availableMoments.some((moment) => moment.id === p.current?.id)) return;
                exploration.mark("watch");
                pitchStage.current?.focus({ preventScroll: true });
                pitchStage.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
              }}
              onCompare={() => {
                if (!p.current || withheld || !p.current.claim_ids.length) return;
                setCompareRequested(true);
                p.inspect();
              }}
              onExplain={() => {
                if (!p.current || withheld) return;
                exploration.mark("explain");
                document.getElementById("moment-explanation")?.focus({ preventScroll: true });
                document.getElementById("moment-explanation")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "nearest" });
              }}
              preview={() => {
                const fallback = p.current?.narration.sentences[0]?.text ?? "No verified explanation is available to preview.";
                speech.preview(p.current, fallback, p.explicitlySelected);
              }}
            />

          </>
        )}
      </div>
      {p.clean && p.current && (
        <section className="program-caption" aria-label="Recorded moment">
          <span>{clubs.name(p.current.team)} · {clockText(p.current.source_seconds)}</span>
          <h1>{clubs.text(p.current.narration.headline)}</h1>
          <p>Synthetic replay · club labels only, not actual club performance · recorded source moment · replay {clockText(replayClock)} · {p.current.origin === "recorded_foundry" ? "saved, source-verified Foundry output" : "source-compiled explanation"}</p>
        </section>
      )}
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
