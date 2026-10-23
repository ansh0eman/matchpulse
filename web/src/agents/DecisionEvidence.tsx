import type { Capture } from "../contracts";

const EVENT_ONLY_GOAL = "02840f35-cb05-4812-aa9d-1237e4ab1b9d";

export function DecisionEvidence({ capture }: { capture: Capture }) {
  const event = (role: string, name: string) =>
    capture.events.find((row) => row.role === role && row.event === name);
  const route = event("director", "route");
  const handoff = event("match_analyst", "verified_handoff");
  const review = event("challenger", "review");
  const revision = event("narrator", "challenge_revision");
  const publication = event("publisher", "artifact_verified");
  const tacticalSkipped =
    capture.match_id === EVENT_ONLY_GOAL &&
    route?.reason === "match_analyst" &&
    !event("tactical_analyst", "request_started");
  const decisions = [
    route && {
      recorded: route,
      title:
        route.reason === "match_analyst"
          ? "Event specialist selected"
          : "Specialist route recorded",
      text:
        route.reason === "match_analyst"
          ? "The Director sent this incident to the Match Analyst."
          : `Recorded route: ${route.reason ?? "reason not recorded"}.`,
    },
    handoff && {
      recorded: handoff,
      title: "Evidence handoff checked",
      text: "The analyst’s selected claims passed validation before review.",
    },
    review && {
      recorded: review,
      title:
        review.reason === "narrow"
          ? "Challenger narrowed the scope"
          : review.reason === "accept"
            ? "Challenger accepted the scope"
            : review.reason === "fallback"
              ? "Challenger requested safe fallback"
              : "Challenger decision recorded",
      text:
        review.reason === "narrow"
          ? "The interpretation needed a more cautious presentation. Source arithmetic remains independently checked."
          : review.reason === "fallback"
            ? "The model narration branch is held back; code can still compile a verified fallback."
            : `Recorded review: ${review.reason ?? "reason not recorded"}. Another model is not proof.`,
    },
    revision?.reason === "narrowed_to_evidence" && {
      recorded: revision,
      title: "Narration changed to evidence first",
      text: "The controlled plan’s angle and hook were narrowed before publication.",
    },
    publication && {
      recorded: publication,
      title: "Final source check passed",
      text:
        capture.narration_status === "fallback" &&
        capture.overlay_status === "enriched"
          ? "Safe fallback narration and the enriched replay passed the independent publication gate."
          : "The final narrative and available replay passed independent source verification.",
    },
  ].filter((decision) => !!decision);

  return (
    <section className="workflow-decisions" aria-label="Recorded agent decisions">
      <h4>What changed along the way</h4>
      {tacticalSkipped && (
        <p className="workflow-skip">
          <strong>Tactical Analyst · skipped, not failed.</strong> This goal is
          event-only. The recorded route did not request positional analysis.
        </p>
      )}
      {decisions.length ? (
        <ol className="decision-list">
          {decisions.map((decision) => (
            <li key={`${decision.recorded.role}:${decision.recorded.event}`}>
              <span className="decision-time">
                {(decision.recorded.elapsed_ms / 1000).toFixed(2)}s
              </span>
              <div>
                <strong>{decision.title}</strong>
                <p>{decision.text}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p>No decision handoff events were saved in this capture.</p>
      )}
    </section>
  );
}
