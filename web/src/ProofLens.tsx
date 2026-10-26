import { MappingNote, useClubs } from "./clubs/Clubs";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  CheckCircleIcon,
  XIcon,
  ArrowRightIcon,
  FingerprintIcon,
} from "@phosphor-icons/react";
import type { Proof } from "./contracts";
import { Pitch } from "./Pitch";
import { ProofSummary } from "./proof/ProofSummary";
import { ThemeToggle } from "./design/ThemeToggle";
import type { Theme } from "./design/theme";
export const clockText = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
export function ProofLens({
  proof,
  replayClock,
  close,
  loading,
  error,
  retry,
  footer,
  theme,
  toggleTheme,
}: {
  proof: Proof | null;
  replayClock: number;
  close: () => void;
  loading: boolean;
  error: string | null;
  retry: () => void;
  footer?: ReactNode;
  theme: Theme;
  toggleTheme: () => void;
}) {
  const clubs = useClubs();
  const [tab, setTab] = useState("summary");
  const [auditTab, setAuditTab] = useState("observations");
  const [sample, setSample] = useState(0);
  const drawerBody = useRef<HTMLDivElement>(null);
  const sectionHeading = useRef<HTMLHeadingElement>(null);
  const focusNextSection = useRef(false);
  useLayoutEffect(() => {
    if (drawerBody.current) drawerBody.current.scrollTop = 0;
    if (focusNextSection.current) {
      sectionHeading.current?.focus({ preventScroll: true });
      focusNextSection.current = false;
    }
  }, [tab, auditTab]);
  const c = proof?.calculation;
  const current =
    proof?.samples[Math.min(sample, (proof?.samples.length ?? 1) - 1)];
  return (
    <div className="drawer-scrim" onClick={close}>
      <aside
        className="proof-drawer"
        data-section={tab}
        role="dialog"
        aria-modal="true"
        aria-labelledby="proof-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
        }}
      >
        <header>
          <div>
            <h2 id="proof-title">
              Proof Lens
              <span className="lime-dot" />
            </h2>
          </div>
          <button onClick={close} aria-label="Close Proof Lens" autoFocus>
            <XIcon size={22} />
          </button>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </header>
        {loading ? (
          <div className="drawer-body">
            <div className="loading-line" />
            <p>Recomputing from canonical source…</p>
          </div>
        ) : error ? (
          <div className="drawer-body error" role="alert">
            <p>{error}</p>
            <button className="evidence-button" onClick={retry}>Retry proof</button>
          </div>
        ) : proof && c ? (
          <>
            <div className="verified-banner">
              <CheckCircleIcon size={22} weight="fill" />
              <div>
                <strong>Source arithmetic verified</strong>
                <span>The calculation in this request passed its source checks.</span>
              </div>
            </div>
            <MappingNote />
            <nav className="proof-tabs" aria-label="Proof sections">
              {["summary", "method", "audit"].map((t) => (
                <button
                  key={t}
                  className={tab === t ? "active" : ""}
                  aria-pressed={tab === t}
                  onClick={() => setTab(t)}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </nav>
            <div className="drawer-body" ref={drawerBody}>
              {tab === "summary" ? (
                <ProofSummary
                  proof={proof}
                  replayClock={replayClock}
                  method={() => {
                    focusNextSection.current = true;
                    setTab("method");
                  }}
                  audit={() => {
                    setAuditTab("observations");
                    focusNextSection.current = true;
                    setTab("audit");
                  }}
                />
              ) : (
                <>
                  <span className="eyebrow">
                    {proof.type.replaceAll("_", " ")} · {clubs.name(proof.team)} (source {proof.team ?? "MATCH"})
                  </span>
                  {tab === "audit" && (
                    <nav className="audit-tabs" aria-label="Audit detail">
                      <button
                        aria-label="Source observations"
                        aria-pressed={auditTab === "observations"}
                        onClick={() => setAuditTab("observations")}
                      >
                        Source observations
                      </button>
                      <button
                        aria-label="Provenance"
                        aria-pressed={auditTab === "provenance"}
                        onClick={() => setAuditTab("provenance")}
                      >
                        Provenance
                      </button>
                    </nav>
                  )}
                  {tab === "method" ? (
                    <>
                      <h3 ref={sectionHeading} tabIndex={-1}>Show your working.</h3>
                      <p className="formula">{c.formula}</p>
                      {c.before_m !== undefined ? (
                        <>
                          <div className="measurement">
                            <div>
                              <span>Before</span>
                              <strong>
                                {c.before_m.toFixed(2)}
                                <small>m</small>
                              </strong>
                            </div>
                            <ArrowRightIcon size={24} />
                            <div>
                              <span>After</span>
                              <strong>
                                {c.after_m?.toFixed(2)}
                                <small>m</small>
                              </strong>
                            </div>
                          </div>
                          <div className="delta">
                            {c.change_m! >= 0 ? "+" : ""}
                            {c.change_m?.toFixed(2)} m{" "}
                            <span>observed change</span>
                          </div>
                          <div className="comparison">
                            {proof.frames.map((f, i) => (
                              <figure key={f.frame_id}>
                                <Pitch
                                  frame={f}
                                  compact
                                  highlight={
                                    proof.samples
                                      .find((s) => s.frame_id === f.frame_id)
                                      ?.players.map((p) => p.id) ?? []
                                  }
                                />
                                <figcaption>
                                  {i ? "Recent sample" : "Reference sample"} ·{" "}
                                  {f.time_seconds}s
                                </figcaption>
                              </figure>
                            ))}
                          </div>
                          <div className="fact-row">
                            <span>Contributing frames</span>
                            <strong>
                              {c.support?.reference_frames} before /{" "}
                              {c.support?.recent_frames} after
                            </strong>
                          </div>
                          <div className="fact-row">
                            <span>Latest observation</span>
                            <strong>
                              {c.latest_observation}s · age {c.age}s
                            </strong>
                          </div>
                          {proof.contexts.map((ctx, i) => (
                            <div className="context-row" key={i}>
                              <span>
                                Context {i + 1} · weight {ctx.weight.toFixed(3)}
                              </span>
                              <strong>
                                {ctx.before_m.toFixed(3)} →{" "}
                                {ctx.after_m.toFixed(3)} m
                              </strong>
                              <small>
                                {ctx.reference_count} reference /{" "}
                                {ctx.recent_count} recent samples
                              </small>
                            </div>
                          ))}
                        </>
                      ) : c.before ? (
                        <div className="score-proof">
                          <span>Source before</span>
                          <strong>
                            {c.before.home} — {c.before.away}
                          </strong>
                          <ArrowRightIcon size={23} />
                          <strong>
                            {c.after?.home} — {c.after?.away}
                          </strong>
                          <span>Source after</span>
                        </div>
                      ) : (
                        <div className="event-calculation">
                          <strong>
                            {c.recomputed_shots ??
                              c.elapsed_seconds ??
                              proof.observations.length}
                          </strong>
                          <span>
                            {c.recomputed_shots !== undefined
                              ? "source shot attempts"
                              : c.elapsed_seconds !== undefined
                                ? "seconds regain → shot"
                                : "original event observations"}
                          </span>
                        </div>
                      )}
                      <div className="fact-row">
                        <span>Source window</span>
                        <strong>
                          ({c.window[0]}, {c.window[1]}] s
                        </strong>
                      </div>
                      <div className="fact-row">
                        <span>Available at</span>
                        <strong>{proof.as_of_seconds} s</strong>
                      </div>
                    </>
                  ) : auditTab === "observations" ? (
                    <>
                      <h3 ref={sectionHeading} tabIndex={-1}>The original observations.</h3>
                      <p>
                        Exact source IDs and coordinates. Event coordinates
                        describe the ball, not the named player's location.
                      </p>
                      {proof.observations.map((e) => (
                        <article className="observation" key={e.source_id}>
                          <div>
                            <strong>{e.action.replaceAll("_", " ")}</strong>
                            <span>
                              {e.time_seconds}s · {e.team ?? "match"}
                            </span>
                          </div>
                          <code>{e.source_id}</code>
                          <dl>
                            <dt>Ball x / y</dt>
                            <dd>
                              {e.ball_position_m.x.toFixed(3)} /{" "}
                              {e.ball_position_m.y.toFixed(3)} m
                            </dd>
                            <dt>Score snapshot</dt>
                            <dd>
                              {e.score.home} – {e.score.away}
                            </dd>
                            <dt>Player attribution</dt>
                            <dd>{e.player ?? "None"}</dd>
                            <dt>Possession</dt>
                            <dd>{e.possession_id}</dd>
                          </dl>
                        </article>
                      ))}
                      {current && (
                        <>
                          <label className="sample-control">
                            Inspect contributing sample{" "}
                            <input
                              type="range"
                              min={0}
                              max={proof.samples.length - 1}
                              value={sample}
                              onChange={(e) => setSample(+e.target.value)}
                            />
                          </label>
                          <div className="observation">
                            <strong>
                              {current.side} · {current.time}s
                            </strong>
                            <code>{current.frame_id}</code>
                            <p>Three deepest outfielders, attack-relative x:</p>
                            {current.players.map((p) => (
                              <div className="fact-row" key={p.id}>
                                <span>{p.id}</span>
                                <strong>{p.attack_x.toFixed(4)} m</strong>
                              </div>
                            ))}
                            <div className="delta">
                              Mean {current.line3_m.toFixed(4)} m
                            </div>
                          </div>
                          <details>
                            <summary>
                              All {proof.samples.length} contributing samples
                            </summary>
                            <table>
                              <thead>
                                <tr>
                                  <th>Source frame</th>
                                  <th>Time</th>
                                  <th>Mean x</th>
                                </tr>
                              </thead>
                              <tbody>
                                {proof.samples.map((s) => (
                                  <tr key={s.frame_id}>
                                    <td>{s.frame_id}</td>
                                    <td>{s.time}s</td>
                                    <td>{s.line3_m.toFixed(4)}m</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </details>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 ref={sectionHeading} tabIndex={-1}>A traceable chain.</h3>
                      <div className="provenance-step">
                        <FingerprintIcon size={26} />
                        <div>
                          <span>Match namespace</span>
                          <code>{proof.match_id}</code>
                        </div>
                      </div>
                      <p className="code-label">Registered claim</p>
                      <code className="hash">{proof.claim_id}</code>
                      <p className="code-label">
                        Canonical event source · SHA-256
                      </p>
                      <code className="hash">{proof.source_hashes.events}</code>
                      {proof.source_hashes.tracking && (
                        <>
                          <p className="code-label">
                            Tracking source · SHA-256
                          </p>
                          <code className="hash">
                            {proof.source_hashes.tracking}
                          </code>
                        </>
                      )}
                      <p>
                        {proof.verification}. Cross-match and future references
                        are rejected by the API.
                      </p>
                    </>
                  )}
                  <section className="limitations">
                    <span className="eyebrow">WHAT THIS DOESN’T ESTABLISH</span>
                    {proof.limitations.map((l) => (
                      <p key={l}>{l}</p>
                    ))}
                    <p>
                      Sampled synthetic football. No claim of real-match
                      calibration, coach intent, xG or pressing success.
                    </p>
                  </section>
                </>
              )}
            </div>
          </>
        ) : null}
        {footer}
      </aside>
    </div>
  );
}
