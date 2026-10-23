import type { Capture } from "../contracts";
export function WorkflowGraph({
  capture,
  label = "Recorded Foundry workflow",
}: {
  capture: Capture;
  label?: string;
}) {
  const nodes = [
    ["director", "Director"],
    ["match_analyst", "Match Analyst"],
    ["challenger", "Evidence Challenger"],
    ["narrator", "Narrator"],
    ["replay_producer", "Replay Producer"],
  ];
  return (
    <section className="workflow-graph" aria-label={label}>
      <header>
        <h3>One incident. Distinct responsibilities.</h3>
        <p>
          Actual recorded execution. Times measure each request, not simulated
          progress.
        </p>
      </header>
      <div className="workflow-nodes">
        {nodes.map(([role, label]) => {
          const start = capture.events.find(
            (e) => e.role === role && e.event === "request_started",
          );
          const end = capture.events.find(
            (e) => e.role === role && e.event === "request_succeeded",
          );
          const outcome =
            role === "narrator"
              ? capture.narration_status
              : role === "replay_producer"
                ? capture.overlay_status
                : role === "challenger"
                  ? capture.events.find(
                      (e) => e.role === role && e.event === "review",
                    )?.reason
                  : "completed";
          return (
            <article
              key={role}
              className={`workflow-node ${role} ${outcome === "fallback" ? "recovered" : ""}`}
            >
              <span>{label}</span>
              <strong>
                {start && end
                  ? `${((end.elapsed_ms - start.elapsed_ms) / 1000).toFixed(2)}s`
                  : "Not recorded"}
              </strong>
              <small>{outcome ?? "Not recorded"}</small>
              {end?.usage_input !== null && end && (
                <small>
                  {end.usage_input} in / {end.usage_output} out tokens
                </small>
              )}
            </article>
          );
        })}
        <article className="workflow-node grounding">
          <span>Deterministic publication gate</span>
          <strong>Verified artifact</strong>
          <small>
            {capture.narration_status === "enriched"
              ? "Source-verified narration"
              : "Safe narration fallback"}{" "}
            + source-verified replay
          </small>
        </article>
      </div>
      <p className="workflow-caption">
        Narrator and Replay Producer branch independently. A rejected narration
        plan does not discard the verified replay. Recorded tool calls:{" "}
        {capture.tools.map((t) => t.tool).join(", ")}.
      </p>
    </section>
  );
}
