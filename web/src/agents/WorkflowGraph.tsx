import type { Capture } from "../contracts";
import { DecisionEvidence } from "./DecisionEvidence";
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
  const verified = capture.events.some(
    (event) => event.role === "publisher" && event.event === "artifact_verified",
  );
  const framework = capture.events.some(
    (event) =>
      event.role === "runtime" && event.event === "microsoft_agent_framework",
  );
  const successfulTools = capture.tools.filter((tool) => tool.status === "success");
  const toolSummary = capture.tools
    .map((tool) => `${tool.tool} (${tool.status}, as-of ${tool.as_of_seconds}s)`)
    .join("; ");
  const narrationLabel = capture.narration_status === "enriched"
    ? "Source-verified narration"
    : "Safe narration fallback";
  const replayLabel = capture.overlay_status === "unavailable"
    ? "replay unavailable"
    : "source-verified replay";
  return (
    <section className="workflow-graph" aria-label={label}>
      <header>
        <h3>One incident. Distinct responsibilities.</h3>
        <p>
          Saved execution, not live activity. Times show recorded role-request
          intervals. Narration and replay run as independent branches.
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
          const failed = capture.events.find(
            (e) => e.role === role && e.event === "request_failed",
          );
          const outcome =
            role === "narrator"
              ? capture.narration_status
              : role === "replay_producer"
                ? capture.overlay_status
                : role === "challenger"
                  ? capture.events.find(
                      (e) => e.role === role && e.event === "review",
                    )?.reason ?? (failed ? "request failed" : "Review not recorded")
                  : end
                    ? "completed"
                    : failed
                      ? "request failed"
                      : "Not recorded";
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
              {end && end.usage_input !== null && (
                <small>
                  {end.usage_input} in / {end.usage_output} out tokens
                </small>
              )}
            </article>
          );
        })}
        <article className="workflow-node grounding">
          <span>Deterministic publication gate</span>
          <strong>
            {verified ? "Verified artifact" : "Verification not recorded"}
          </strong>
          <small>
            {verified
              ? `${narrationLabel} + ${replayLabel}`
              : "Only an explicit saved verification event is shown as passed."}
          </small>
        </article>
      </div>
      <DecisionEvidence capture={capture} />
      <p className="workflow-caption">
        Narrator and Replay Producer branch independently. A rejected narration
        plan does not discard the verified replay. {successfulTools.length}{" "}
        successful evidence lookups are recorded for this run.
      </p>
      <details className="workflow-platform-boundary">
        <summary>Microsoft platform and tool evidence</summary>
        <p>
          {framework
            ? capture.origin === "foundry"
              ? "The recording used a local Microsoft Agent Framework graph with Foundry model inference. The application owns its role definitions; these are not server-managed, versioned Agent Service agents."
              : `The recording used Microsoft Agent Framework with origin ${capture.origin}. This is not authenticated Foundry inference evidence.`
            : "A Microsoft Agent Framework runtime event was not saved in this capture."}
        </p>
        <p>
          Recorded tool rows: {toolSummary || "none"}.
          The compact export omits per-tool role attribution and raw arguments.
          These rows do not establish the number of model HTTP requests.
        </p>
      </details>
    </section>
  );
}
