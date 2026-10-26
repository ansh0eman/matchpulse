import { useClubs } from "../clubs/Clubs";
import { ArrowRightIcon, DownloadSimpleIcon } from "@phosphor-icons/react";
import type { Proof } from "../contracts";
import { Pitch } from "../Pitch";

const clockText = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

const windowText = (window?: [number, number]) =>
  window ? `after ${clockText(window[0])} through ${clockText(window[1])} (start excluded, end included)` : null;

export function downloadProof(proof: Proof) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(proof, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `matchpulse-proof-${proof.match_id}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ProofSummary({
  proof,
  replayClock,
  method,
  audit,
}: {
  proof: Proof;
  replayClock: number;
  method: () => void;
  audit: () => void;
}) {
  const clubs = useClubs();
  const c = proof.calculation;
  const position = c.before_m !== undefined;
  const club = clubs.name(proof.team);
  const shotObservation = proof.type === "observed_shot"
    ? proof.observations.find((observation) => observation.action === "shot" && observation.team === proof.team)
    : undefined;
  const shot = !!shotObservation && proof.team !== null;
  const shotCount = c.recomputed_shots ?? (shot ? 1 : proof.observations.length);
  const direction = (c.change_m ?? 0) >= 0 ? "farther forward" : "farther back";
  const latest = c.latest_observation ?? proof.as_of_seconds;
  return (
    <section className="proof-summary">
      <h3>
        {position
          ? `${club}'s sampled line comparison`
          : c.before
            ? "The score changed. Here is the source."
            : c.elapsed_seconds !== undefined
              ? "From regain to shot."
              : shot
                ? `${club} recorded a shot attempt at ${clockText(shotObservation.time_seconds)}.`
              : "The observation, checked."}
      </h3>
      <p className="summary-subtitle">
        {position
          ? "Context-weighted comparison of the three deepest observed outfielders across eligible tracking frames. It compares sampled windows, not continuous movement."
          : shot
            ? "The original event records a shot attempt. Its incident time is separate from the current replay clock."
            : "Observed facts. Independently recomputed on this request."}
      </p>
      <div className="proof-time-context" aria-label="Evidence and replay time">
        <span><strong>Evidence as of</strong> {clockText(proof.as_of_seconds)}</span>
        <span><strong>Replay clock</strong> {clockText(replayClock)}</span>
        {shot && <span><strong>Selected incident</strong> {clockText(shotObservation.time_seconds)}</span>}
        {position && <span>Latest source observation {clockText(latest)} · {c.age ?? Math.max(0, proof.as_of_seconds - latest)}s old at evidence cutoff · {Math.max(0, replayClock - latest)}s before replay</span>}
      </div>
      {position ? (
        <>
          <section className="aggregate-comparison" aria-label="Aggregate comparison">
            <div className="aggregate-heading">
              <div><span className="eyebrow">Window means · metres</span><h4>Aggregate comparison</h4></div>
              <p>Context-weighted means across eligible source frames</p>
            </div>
            <div className="aggregate-values">
              <div><span>Earlier mean</span><strong>{c.before_m?.toFixed(2)}<small>m</small></strong></div>
              <div><span>Recent mean</span><strong>{c.after_m?.toFixed(2)}<small>m</small></strong></div>
              <div className="aggregate-delta"><span>Recent minus earlier</span><strong>{(c.change_m ?? 0) >= 0 ? "+" : ""}{c.change_m?.toFixed(2)}<small>m</small></strong></div>
            </div>
            <p className="aggregate-direction">Higher attack-relative x means farther forward. The difference is a comparison of sampled-window estimates, not a continuous trajectory.</p>
            <div className="summary-windows">
              {windowText(c.reference_window) && <span><strong>Earlier window</strong>{windowText(c.reference_window)}</span>}
              {windowText(c.recent_window) && <span><strong>Recent window</strong>{windowText(c.recent_window)}</span>}
            </div>
          </section>

          <section className="representative-frames" aria-label="Representative source frames">
            <div className="aggregate-heading"><div><span className="eyebrow">Original tracking observations</span><h4>Representative source frames</h4></div><p>Single-frame snapshots; positions are observed, not interpolated.</p></div>
            <div className="summary-comparison measurement">
              {proof.frames.map((frame) => {
                const sample = proof.samples.find((item) => item.frame_id === frame.frame_id);
                const side = sample?.side === "reference" ? "Earlier window" : "Recent window";
                return <figure key={frame.frame_id}>
                  <Pitch frame={frame} compact highlight={sample?.players.map((player) => player.id) ?? []} />
                  <figcaption><span>{side}</span></figcaption>
                  <small>Source snapshot · {clockText(frame.time_seconds)} · frame {frame.frame_id}</small>
                  {sample && <p className="summary-frame-proxy">Single-frame proxy: {sample.line3_m.toFixed(2)} m <span>Not the window mean</span></p>}
                </figure>;
              })}
            </div>
          </section>

          <div className="summary-support">
            <strong>{proof.samples.length} source frames</strong>
            <span>{c.support?.reference_frames} earlier / {c.support?.recent_frames} recent</span>
            {c.support?.common_contexts !== undefined && <span>{c.support.common_contexts} matched context{c.support.common_contexts === 1 ? "" : "s"}</span>}
            <span>Frames can be temporally correlated; counts are not independent trials.</span>
          </div>
          <details className="contributor-inspector">
            <summary>Inspect original players and coordinates</summary>
            <p>White rings identify the three deepest outfielders in each displayed source frame. The aggregate above uses eligible frames across both windows, not just these snapshots.</p>
            {proof.frames.map((frame) => {
              const sample = proof.samples.find((item) => item.frame_id === frame.frame_id);
              return sample ? <section key={frame.frame_id}>
                <h4>{sample.side === "reference" ? "Earlier" : "Recent"} source snapshot · {clockText(frame.time_seconds)}</h4>
                <table><caption>Original source contributors · {frame.frame_id}</caption>
                  <thead><tr><th>Source player ID</th><th>x / y (m)</th><th>Attack-relative x (m)</th></tr></thead>
                  <tbody>{sample.players.map((player) => <tr key={player.id}><th scope="row">{player.id}</th><td>{player.x.toFixed(2)} / {player.y.toFixed(2)}</td><td>{player.attack_x.toFixed(2)}</td></tr>)}</tbody>
                </table>
              </section> : null;
            })}
          </details>
        </>
      ) : c.before ? (
        <div className="summary-score measurement"><div><span>BEFORE</span><strong>{c.before.home} – {c.before.away}</strong></div><ArrowRightIcon size={30} /><div><span>AFTER</span><strong>{c.after?.home} – {c.after?.away}</strong></div></div>
      ) : (
        <div className="summary-single measurement"><strong>{c.elapsed_seconds ?? c.recomputed_shots ?? (shot ? shotCount : proof.observations.length)}</strong><span>{c.elapsed_seconds !== undefined ? "seconds from regain to shot" : c.recomputed_shots !== undefined ? `observed shot attempt${c.recomputed_shots === 1 ? "" : "s"}` : shot ? `source shot attempt${shotCount === 1 ? "" : "s"}` : `original event observation${proof.observations.length === 1 ? "" : "s"}`}</span></div>
      )}
      <div className="summary-boundaries">
        <section><h4>What this supports</h4><p>{position ? `Across comparable observed situations, ${club}’s three-deepest-outfielder proxy averaged ${Math.abs(c.change_m ?? 0).toFixed(2)} m ${direction} in the recent window.` : c.before ? "The score snapshots on the two original source events establish this recorded transition." : c.elapsed_seconds !== undefined ? "A recorded high regain was followed by a shot in the same possession, separated by the recomputed time." : shot ? `The original event record identifies a ${club} shot attempt at ${clockText(shotObservation.time_seconds)}.` : "These source observations support this registered incident; inspect the method for its exact definition."}</p></section>
        <section><h4>What it does not support</h4><p>{position ? "Observed player positioning does not establish a manager's instruction or prove pressing effectiveness." : shot ? "This event record alone does not establish the shot's outcome or chance quality, an assist, or a causal link to another event." : "An event sequence alone does not establish causation, an assist or expected goals."}</p></section>
      </div>
      <div className="summary-actions">
        <button className="evidence-button" onClick={method}>How calculated<ArrowRightIcon size={19} /></button>
        <button className="quiet-action" onClick={audit}>Audit raw evidence</button>
        <button className="quiet-action" onClick={() => downloadProof(proof)}><DownloadSimpleIcon size={18} />Save receipt</button>
      </div>
    </section>
  );
}
