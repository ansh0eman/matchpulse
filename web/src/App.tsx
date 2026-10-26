import { selectEditorial, eligibleAt, type HistoricalSelection } from "./broadcast/editorial";
import { sourceSnapshot, validateProjection, type SourceSnapshot } from "./playback/source";
import { AppShell, AppHeader } from "./shell/AppHeader";
import { InvestigateView } from "./views/InvestigateView";
import { StudioDialog } from "./views/StudioDialog";
import { GuidedDemoDialog } from "./views/GuidedDemoDialog";
import { useEffect, useRef, useState } from "react";

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
import { useDialog } from "./useDialog";
import { ProofLens } from "./ProofLens";
import { BroadcastTheatre } from "./broadcast/BroadcastTheatre";
import { CHAPTERS, GuidedStory } from "./demo/GuidedStory";
import { visibleSnapshot } from "./playback/causal";
import { useBufferedReplay } from "./playback/useBufferedReplay";
import { useTheme } from "./design/useTheme";

function initialReplay(mode: string) {
  const starts: Record<string, number> = {
    "native-goals": 1611,
    "open-play": 356,
    "opening-goal": 2371,
    equalizer: 4242,
    "line-shift": 3360,
    withheld: 1350,
  };
  const requested = new URLSearchParams(window.location.search).get("scenario");
  const scenario =
    requested && Object.hasOwn(starts, requested)
      ? requested
      : mode === "studio"
        ? "open-play"
        : "native-goals";
  const requestedClock = Number(new URLSearchParams(window.location.search).get("clock") ?? NaN);
  return { scenario, clock: Number.isFinite(requestedClock) && requestedClock >= 0 ? requestedClock : starts[scenario] };
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState(() => {
    const view = new URLSearchParams(window.location.search).get("view");
    return view === "studio" || view === "broadcast" ? view : "theatre";
  });
  const [tour, setTour] = useState<number | null>(null),
    [tourSeconds, setTourSeconds] = useState(0),
    [tourRunning, setTourRunning] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]),
    [scenario, setScenario] = useState(() => initialReplay(mode).scenario),
    [clock, setClock] = useState(() => initialReplay(mode).clock),
    [seekRevision, setSeekRevision] = useState(0),
    [audience, setAudience] = useState<Audience>("fan"),
    [favorite, setFavorite] = useState<Team | "">("");
  const [sourceState, setSourceState] = useState<SourceSnapshot | null>(null);
  const [snapshot, setData] = useState<View | null>(null),
    [loadedParams, setLoadedParams] = useState(""),
    [error, setError] = useState<string | null>(null),
    [loading, setLoading] = useState(true),
    [playbackFault, setPlaybackFault] = useState<string | null>(null),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(4),
    [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<HistoricalSelection | null>(null),
    [drawer, setDrawer] = useState(false),
    [proof, setProof] = useState<Proof | null>(null),
    [proofError, setProofError] = useState<string | null>(null),
    [proofLoading, setProofLoading] = useState(false),
    [proofContext, setProofContext] = useState(""),
    [proofRetry, setProofRetry] = useState(0),
    [claimId, setClaimId] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null),
    [room, setRoom] = useState(false),
    [guide, setGuide] = useState(false),
    [answer, setAnswer] = useState<Answer | null>(null),
    [asking, setAsking] = useState(false);
  const generation = useRef(0),
    proofGeneration = useRef(0),
    askController = useRef<AbortController | null>(null);
  const rememberDialogInvoker = useDialog(drawer || room || guide);
  const currentScenario = scenarios.find((s) => s.id === scenario);
  const params = new URLSearchParams({
    scenario,
    clock: String(clock),
    audience,
    ...(favorite ? { favorite } : {}),
  }).toString();
  const data = visibleSnapshot(snapshot, loadedParams, params);
  const source = sourceState?.scenario === scenario && sourceState.match_id === currentScenario?.match_id && sourceState.clock === clock ? sourceState : data ? sourceSnapshot(data) : null;
  const blocking = loading && !data && !source;
  const presentationPending = !data && !!source;
  const buffering = useBufferedReplay({
    playing,
    clock,
    speed,
    retry,
    scenario,
    audience,
    favorite,
    seed: snapshot,
    onSource: (value) => { setSourceState(value); setClock(value.clock); },
    onView: (v, key) => {
      setClock(v.clock);
      setData(v);
      setLoadedParams(key);
      setLoading(false);
    },
    onStop: () => setPlaying(false),
    onError: setPlaybackFault,
  });
  const editorial = selectEditorial({ view: data, scenario, clock, matchId: currentScenario?.match_id, selection: selected });
  const availableMoments = editorial.available;
  const latestRecorded = editorial.latestRecorded;
  const selectedMoment = editorial.presentation.kind === "selected" ? editorial.presentation.story : undefined;
  const current = editorial.presentation.kind === "selected" || editorial.presentation.kind === "featured" ? editorial.presentation.story : undefined;
  useEffect(() => { if (editorial.selectionDisposition === "clear") setSelected(null); }, [editorial.selectionDisposition]);
  const proofKey = JSON.stringify([params, claimId, data?.match_id]);
  const visibleProof =
    proofContext === proofKey && proof?.verified === true &&
    proof.claim_id === claimId && proof.match_id === data?.match_id &&
    proof.as_of_seconds <= clock ? proof : null;
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", mode);
    url.searchParams.set("scenario", scenario);
    window.history.replaceState(null, "", url);
  }, [mode, scenario]);
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
      inspect(item.claim_ids[0]);
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
    if (playing) return;
    const c = new AbortController();
    setLoading(true);
    setError(null);
    get<View>(`/api/view?${params}`, c.signal)
      .then((v) => {
        if (c.signal.aborted) return;
        validateProjection(v, { scenario, audience, favorite }, clock, currentScenario?.match_id, sourceState);
        setSourceState(sourceSnapshot(v));
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
  }, [params, retry, playing]);
  useEffect(() => {
    generation.current++;
    setPlaybackFault(null);
    askController.current?.abort();
    setAnswer(null);
    setAsking(false);
    setDrawer(false);
    setProof(null);
  }, [scenario, clock, audience, favorite]);
  useEffect(() => {
    if (!drawer || !claimId || !data) return;
    const c = new AbortController();
    const request = ++proofGeneration.current;
    const requestedKey = proofKey;
    const requestedMatch = data.match_id;
    const requestedClock = clock;
    setProofLoading(true);
    setProofError(null);
    get<Proof>(
      `/api/proof?${params}&claim_id=${encodeURIComponent(claimId)}`,
      c.signal,
    )
      .then((p) => {
        if (c.signal.aborted || request !== proofGeneration.current) return;
        if (p.verified !== true || p.claim_id !== claimId || p.match_id !== requestedMatch ||
            !Number.isFinite(p.as_of_seconds) || p.as_of_seconds > requestedClock) {
          throw new Error("The returned proof does not match this incident and replay. Please retry.");
        }
        setProof(p);
        setProofContext(requestedKey);
        setProofLoading(false);
      })
      .catch((e) => {
        if (!c.signal.aborted && request === proofGeneration.current && e.name !== "AbortError") {
          setProof(null);
          setProofContext(requestedKey);
          setProofError(e.message);
          setProofLoading(false);
        }
      });
    return () => c.abort();
  }, [drawer, claimId, params, data?.match_id, proofRetry]);
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
    setSelected(null);
    setPlaying(false);
    setData(null);
    setRetry((v) => v + 1);
    setScenario(s.id);
    setClock(s.start);
    setSeekRevision((revision) => revision + 1);
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
  function seekReplay(value: number) {
    setSelected((intent) => intent && value < intent.eligibleAt ? null : intent);
    setPlaying(false); setClock(value); setSeekRevision((revision) => revision + 1);
  }
  function seekStory(story: Story, keepReplayClock = false) {
    setPlaying(false);
    setAnswer(null);
    setSelected({ scenario, matchId: data!.match_id, storyId: story.id, eligibleAt: eligibleAt(story) });
    if (!keepReplayClock && clock !== story.presented_seconds)
      setClock(story.presented_seconds);
  }
  function inspect(id?: string) {
    const target = id ?? current?.claim_ids[0] ?? null;
    if (drawer && target === claimId && !proofError) return;
    setRoom(false); setGuide(false);
    // Invalidate synchronously, before the drawer's first render or any old response.
    proofGeneration.current++;
    setProof(null);
    setProofContext("");
    setProofError(null);
    setProofLoading(true);
    setProofRetry((value) => value + 1);
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
    <AppShell
      className={`app-shell ${mode !== "studio" ? "theatre-shell matchday-shell" : ""} ${mode === "broadcast" ? "clean-shell" : ""} ${tour !== null ? "tour-active" : ""}`}
      onClickCapture={rememberDialogInvoker}
    >
      <AppHeader mode={mode} room={room} scenario={currentScenario} provenance={data?.provenance} theme={theme} toggleTheme={toggleTheme} navigate={(next) => { setMode(next); setRoom(false); setGuide(false); }} openStudio={() => { setDrawer(false); setGuide(false); setRoom(true); }} openGuide={() => { setDrawer(false); setRoom(false); setGuide(true); }} />
      {mode !== "studio" ? (
        <BroadcastTheatre
          data={data}
          source={source}
          editorial={editorial}
          presentationPending={presentationPending}
          current={current}
          latestRecorded={latestRecorded}
          explicitlySelected={!!selectedMoment}
          scenario={currentScenario}
          scenarios={scenarios}
          clock={clock}
          playing={playing}
          loading={blocking}
          buffering={buffering}
          playbackReady={snapshot !== null}
          speed={speed}
          audience={audience}
          favorite={favorite}
          error={error ?? playbackFault}
          clean={mode === "broadcast"}
          proofReady={!!visibleProof}
          seekRevision={seekRevision}
          choose={choose}
          seek={seekReplay}
          play={() => { if (snapshot) setPlaying((v) => !v); }}
          setSpeed={setSpeed}
          setAudience={setAudience}
          setFavorite={setFavorite}
          inspect={() => inspect()}
          retry={() => {
            setPlaybackFault(null);
            setRetry((v) => v + 1);
          }}
          selectStory={(story) => {
            if (availableMoments.some((moment) => moment.id === story.id))
              seekStory(story, true);
          }}
          toggleClean={() =>
            setMode(mode === "broadcast" ? "theatre" : "broadcast")
          }
        />
      ) : (
        <InvestigateView seek={seekReplay} editorial={editorial} source={source} presentationPending={presentationPending} scenarios={scenarios} scenario={scenario} currentScenario={currentScenario} data={data} audience={audience} favorite={favorite} error={error} playbackFault={playbackFault} playbackReady={snapshot !== null} blocking={blocking} current={current} clock={clock} playing={playing} speed={speed} answer={answer} asking={asking} choose={choose} inspect={inspect} ask={ask} seekStory={seekStory} setGuide={setGuide} setRoom={setRoom} setAudience={setAudience} setFavorite={setFavorite} setPlaybackFault={setPlaybackFault} setRetry={setRetry} setPlaying={setPlaying} setSpeed={setSpeed} />
      )}
      {!drawer && !room && tourControls}
      {drawer && (
        <ProofLens
          key={claimId}
          proof={visibleProof}
          replayClock={data?.clock ?? clock}
          close={() => setDrawer(false)}
          loading={proofLoading || (!visibleProof && !(proofContext === proofKey && proofError))}
          error={proofContext === proofKey ? proofError : null}
          retry={() => inspect(claimId ?? undefined)}
          footer={tourControls}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}
      {room && <StudioDialog activity={activity} onClose={() => setRoom(false)} theme={theme} toggleTheme={toggleTheme} />}
      {guide && <GuidedDemoDialog scenarios={scenarios} choose={choose} goChapter={goChapter} onClose={() => setGuide(false)} theme={theme} toggleTheme={toggleTheme} />}
    </AppShell>
  );
}
