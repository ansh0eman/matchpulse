import type { Capture } from "./contracts";
export function RecordedRun({ capture }: { capture: Capture }) {
  return (
    <section className="recorded-run">
      <h3>A real run, including the recovery.</h3>
      <p>
        {capture.label}. Recorded at source time {capture.source_seconds}s, in
        the opening-goal fixture. This is separate from the complete passing
        test above.
      </p>
      <div className="run-outcomes">
        <span>
          Narration <strong>{capture.narration_status}</strong>
        </span>
        <span>
          Replay <strong>{capture.overlay_status}</strong>
        </span>
      </div>
      <ol>
        {capture.events
          .filter((e) =>
            [
              "request_started",
              "request_succeeded",
              "request_failed",
              "review",
              "artifact_verified",
            ].includes(e.event),
          )
          .map((e, i) => (
            <li key={i}>
              <time>{(e.elapsed_ms / 1000).toFixed(2)}s</time>
              <div>
                <strong>{e.role.replaceAll("_", " ")}</strong>
                <span>
                  {e.event.replaceAll("_", " ")}
                  {e.reason ? ` · ${e.reason}` : ""}
                </span>
                {e.usage_input !== null && (
                  <small>
                    {e.usage_input} input / {e.usage_output} output tokens
                  </small>
                )}
              </div>
            </li>
          ))}
      </ol>
      <details>
        <summary>Actual model-requested tool calls</summary>
        {capture.tools.map((t, i) => (
          <div className="tool-call" key={i}>
            <code>{t.tool}</code>
            <span>
              {t.status} · clock {t.as_of_seconds}s
            </span>
          </div>
        ))}
        <p>Match namespace</p>
        <code className="hash">{capture.match_id}</code>
        <p>Original trace SHA-256</p>
        <code className="hash">{capture.source_sha256}</code>
      </details>
    </section>
  );
}
