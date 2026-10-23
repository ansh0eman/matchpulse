import { ArrowRightIcon, DownloadSimpleIcon } from "@phosphor-icons/react";
import type { Proof } from "../contracts";
import { Pitch } from "../Pitch";

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
  method,
  audit,
}: {
  proof: Proof;
  method: () => void;
  audit: () => void;
}) {
  const c = proof.calculation,
    position = c.before_m !== undefined;
  const club =
    proof.team === "NORTH"
      ? "North"
      : proof.team === "SOUTH"
        ? "South"
        : "The match";
  return (
    <section className="proof-summary">
      <h3>
        {position
          ? `${club} moved ${(c.change_m ?? 0) >= 0 ? "higher" : "deeper"}.`
          : c.before
            ? "The score changed. Here is the source."
            : c.elapsed_seconds !== undefined
              ? "From regain to shot."
              : "The observation, checked."}
      </h3>
      <p className="summary-subtitle">
        Observed facts. Independently recomputed on this request.
      </p>
      {position ? (
        <>
          <div className="summary-comparison measurement">
            {proof.frames.map((frame, i) => (
              <figure key={frame.frame_id}>
                <Pitch
                  frame={frame}
                  compact
                  highlight={
                    proof.samples
                      .find((s) => s.frame_id === frame.frame_id)
                      ?.players.map((p) => p.id) ?? []
                  }
                />
                <figcaption>
                  <span>{i ? "AFTER" : "BEFORE"}</span>
                  <strong>
                    {(i ? c.after_m : c.before_m)?.toFixed(2)}
                    <small>m</small>
                  </strong>
                </figcaption>
                <small>
                  Representative source snapshot · {frame.time_seconds}s
                </small>
              </figure>
            ))}
            <div className="summary-delta">
              <strong>
                {(c.change_m ?? 0) >= 0 ? "+" : ""}
                {c.change_m?.toFixed(2)}
                <small>m</small>
              </strong>
              <span>observed change</span>
            </div>
          </div>
          <div className="summary-support">
            <strong>{proof.samples.length} source samples</strong>
            <span>
              {c.support?.reference_frames} before / {c.support?.recent_frames}{" "}
              after
            </span>
            <span>Latest evidence: {c.age}s old</span>
          </div>
        </>
      ) : c.before ? (
        <div className="summary-score measurement">
          <div>
            <span>BEFORE</span>
            <strong>
              {c.before.home} – {c.before.away}
            </strong>
          </div>
          <ArrowRightIcon size={30} />
          <div>
            <span>AFTER</span>
            <strong>
              {c.after?.home} – {c.after?.away}
            </strong>
          </div>
        </div>
      ) : (
        <div className="summary-single measurement">
          <strong>
            {c.elapsed_seconds ??
              c.recomputed_shots ??
              proof.observations.length}
          </strong>
          <span>
            {c.elapsed_seconds !== undefined
              ? "seconds from regain to shot"
              : c.recomputed_shots !== undefined
                ? "observed shot attempts"
                : "original event observations"}
          </span>
        </div>
      )}
      <div className="summary-boundaries">
        <section>
          <h4>What this supports</h4>
          <p>
            {position
              ? `The three deepest outfield players were about ${Math.abs(c.change_m ?? 0).toFixed(2)}m ${(c.change_m ?? 0) >= 0 ? "farther forward" : "deeper"} in comparable observed situations.`
              : c.before
                ? "The score snapshots on the two original source events establish this recorded transition."
                : c.elapsed_seconds !== undefined
                  ? "A recorded high regain was followed by a shot in the same possession, separated by the recomputed time."
                  : "These source observations support this registered incident; inspect the method for its exact definition."}
          </p>
        </section>
        <section>
          <h4>What it does not support</h4>
          <p>
            {position
              ? "Positioning does not establish a coach’s intent or pressing effectiveness. Representative snapshots are not the aggregate measurement."
              : "An event sequence alone does not establish causation, an assist or expected goals."}
          </p>
        </section>
      </div>
      <div className="summary-actions">
        <button className="evidence-button" onClick={method}>
          How calculated
          <ArrowRightIcon size={19} />
        </button>
        <button className="quiet-action" onClick={audit}>
          Audit raw evidence
        </button>
        <button className="quiet-action" onClick={() => downloadProof(proof)}>
          <DownloadSimpleIcon size={18} />
          Save receipt
        </button>
      </div>
    </section>
  );
}
