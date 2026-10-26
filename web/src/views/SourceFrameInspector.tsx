import { useEffect, useState } from "react";
import type { Frame, Observation } from "../contracts";
import { useClubs } from "../clubs/Clubs";
import { Pitch } from "../Pitch";
import { clockText } from "../ProofLens";
import { TactileButton } from "../ui/Surface";

/** Inspect original observations; selection never creates a new analytical claim. */
export function SourceFrameInspector({ matchId, frame, events, replayClock, ready, pause }: {
  matchId?: string;
  frame: Frame | null;
  events: Observation[];
  replayClock: number;
  ready: boolean;
  pause: () => void;
}) {
  const clubs = useClubs();
  const [selection, setSelection] = useState<{ match: string; player: string } | null>(null);
  const observation = frame && frame.time_seconds <= replayClock ? frame : null;
  const player = selection && selection.match === matchId
    ? observation?.players.find(row => row.id === selection.player)
    : undefined;
  useEffect(() => {
    if (selection && (selection.match !== matchId || !observation?.players.some(row => row.id === selection.player))) {
      setSelection(null);
    }
  }, [matchId, observation, selection]);
  const choosePlayer = (id: string) => {
    if (id && matchId && observation?.players.some(row => row.id === id)) {
      pause();
      setSelection({ match: matchId, player: id });
    } else setSelection(null);
  };
  const stepPlayer = (direction: number) => {
    if (!observation?.players.length) return;
    const found = observation.players.findIndex(row => row.id === player?.id);
    const from = found >= 0 ? found : direction > 0 ? -1 : 0;
    choosePlayer(observation.players[(from + direction + observation.players.length) % observation.players.length].id);
  };

  return <>
    <div className="pitch-wrap">
      <Pitch frame={observation} events={events} highlight={player ? [player.id] : []} />
      {!ready && <div className="pitch-loading" role="status">Verifying canonical source…</div>}
    </div>
    {ready && <section className="source-frame-inspector" aria-label="Source position inspector">
      <div className="source-inspector-heading">
        <div><h2>Look closer at a player.</h2><p>Inspect one recorded position. Choosing a player pauses the replay.</p></div>
        {observation && <div className="source-inspector-picker"><label>Source player<select aria-label="Inspect source player" value={player?.id ?? ""} onChange={event => choosePlayer(event.target.value)}>
          <option value="">Choose a source player</option>
          {(["NORTH", "SOUTH"] as const).map(team => <optgroup key={team} label={clubs.name(team)}>
            {observation.players.filter(row => row.team_id === team).map(row => <option key={row.id} value={row.id}>{row.id}{row.goalkeeper ? " · goalkeeper" : ""}</option>)}
          </optgroup>)}
        </select></label><div className="source-player-stepper" role="group" aria-label="Browse source players">
          <TactileButton aria-label="Previous source player" disabled={!observation.players.length} onClick={() => stepPlayer(-1)}>Previous</TactileButton>
          <TactileButton aria-label="Next source player" disabled={!observation.players.length} onClick={() => stepPlayer(1)}>Next</TactileButton>
        </div></div>}
      </div>
      {observation ? <>
        <div className="source-position-readout" role={player ? "status" : undefined} aria-live={player ? "polite" : "off"} data-frame-id={observation.frame_id} data-source-seconds={observation.time_seconds}>
          {player ? <>
            <strong>{clubs.name(player.team_id)} <code>{player.id}</code></strong>
            <dl><div><dt>Source x</dt><dd data-testid="source-player-x">{player.x.toFixed(2)} m</dd></div><div><dt>Source y</dt><dd data-testid="source-player-y">{player.y.toFixed(2)} m</dd></div><div><dt>Observed at</dt><dd>{clockText(observation.time_seconds)}</dd></div></dl>
          </> : <p>Choose a source ID to highlight its position and read the coordinates.</p>}
          <small>Frame <code>{observation.frame_id}</code> · observed {clockText(observation.time_seconds)} · {(replayClock - observation.time_seconds).toFixed(2)}s before the replay clock.</small>
        </div>
        <p className="source-inspector-limit">Coordinates use the original pitch axes, in metres. IDs identify synthetic source players, not real footballers or shirt numbers. One position does not establish a trajectory or tactical intent.</p>
      </> : <p className="source-inspector-empty">Player positions are unavailable at this clock. Event-only fixtures show recorded ball locations; choose a tracking scenario to inspect players.</p>}
    </section>}
  </>;
}
