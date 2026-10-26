import { ActivityIcon, ArrowRightIcon, CheckCircleIcon, PlayIcon, XIcon } from "@phosphor-icons/react";
import type { Theme } from "../design/theme";
import { ThemeToggle } from "../design/ThemeToggle";
import type { Activity } from "../contracts";
import { WorkflowGraph } from "../agents/WorkflowGraph";
import { RecordedRun } from "../RecordedRun";
export function StudioDialog({ activity, onClose, theme, toggleTheme }: { activity: Activity | null; onClose: () => void; theme: Theme; toggleTheme: () => void; }) { return (

        <div className="modal-scrim" onClick={() => onClose()}>
          <section
            className="agent-room"
            role="dialog"
            aria-modal="true"
            aria-labelledby="room-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close agent room"
              onClick={() => onClose()}
              autoFocus
            >
              <XIcon size={23} />
            </button>
            <ThemeToggle theme={theme} onToggle={toggleTheme} className="modal-theme-toggle" />
            <span className="eyebrow">Recorded execution</span>
            <h2 id="room-title">Inside the agent room.</h2>
            <p>
              Recorded Foundry and Microsoft Agent Framework workflows,
              source-reverified before display. One saved goal has enriched
              narration and replay; other cards are deterministic. Opening this
              panel makes no model request.
            </p>
            {activity ? (
              <>
                <div className="integration-summary">
                  <CheckCircleIcon size={28} weight="fill" />
                  <div>
                    <strong>
                      {activity.tests_passed} integration checks passed
                    </strong>
                    <span>
                      {activity.date} · {activity.deployment}
                    </span>
                  </div>
                </div>
                <WorkflowGraph capture={activity.capture} />
                {activity.capture_summary && (
                  <div className="integration-summary">
                    <ActivityIcon size={26} />
                    <div>
                      <strong>
                        Persisted, source-verified Foundry workflow ·{" "}
                        {activity.capture_summary.elapsed_seconds.toFixed(2)}s
                      </strong>
                      <span>
                        {activity.capture_summary.agent_request_attempts} agent
                        requests · {activity.capture.tools.length} successful
                        evidence-tool calls ·{" "}
                        {activity.capture_summary.reported_tokens.input} input /{" "}
                        {activity.capture_summary.reported_tokens.output} output
                        tokens
                      </span>
                    </div>
                  </div>
                )}
                <RecordedRun capture={activity.capture} />
                {activity.recovery_capture && (
                  <details>
                    <summary>See the historical narration recovery</summary>
                    <WorkflowGraph
                      capture={activity.recovery_capture}
                      label="Historical Foundry recovery"
                    />
                    <RecordedRun capture={activity.recovery_capture} />
                  </details>
                )}
                <h3>Model-requested evidence tools</h3>
                <div className="tool-tags">
                  {activity.tools.map((t) => (
                    <code key={t}>{t}</code>
                  ))}
                </div>
                <div className="proof-metrics">
                  <span>
                    <strong>
                      {activity.proof.latency_seconds.toFixed(2)}s
                    </strong>
                    minimal proof latency
                  </span>
                  <span>
                    <strong>
                      {activity.proof.usage.input_token_count} /{" "}
                      {activity.proof.usage.output_token_count}
                    </strong>
                    proof input / output tokens
                  </span>
                </div>
                <details>
                  <summary>What the recorded checks establish</summary>
                  <ul>
                    {activity.gates.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                  <code className="hash">
                    Proof SHA-256: {activity.proof_sha256}
                  </code>
                </details>
                <div className="limitations">
                  <strong>Evidence boundary</strong>
                  <p>
                    {activity.limitations} A tactical agent exists but is not
                    proved by this goal capture.
                    {activity.capture_summary && (
                      <>
                        <br />
                        {activity.capture_summary.counter_status} Agent requests
                        and reported token counts are available; an actual
                        network-request total is not attested.
                      </>
                    )}
                  </p>
                </div>
              </>
            ) : (
              <p>Recorded integration evidence is unavailable.</p>
            )}
          </section>
        </div>

); }
