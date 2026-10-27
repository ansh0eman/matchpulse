import { useClubs } from "../clubs/Clubs";
import { CheckIcon, FingerprintIcon, LightbulbIcon, PlayIcon, QuestionIcon, SpeakerHighIcon } from "@phosphor-icons/react";
import type { RefObject } from "react";
import type { Audience, Scenario, Story, Team, View } from "../contracts";
import { clockText } from "../time";
import { momentCopy } from "./presentation";
import type { SupportState } from "./useStorySupport";
import type { ExplorationStep } from "./useExploration";

export function MatchdayInvestigation(p: {
  data: View | null;
  story?: Story;
  scenario?: Scenario;
  audience: Audience;
  favorite: Team | "";
  replayClock: number;
  selected: boolean;
  diagnostic?: View["diagnostics"][number];
  presentationKind: string;
  withheld: boolean;
  railRef: RefObject<HTMLElement | null>;
  support: SupportState;
  explored: ExplorationStep[];
  onWatch: () => void;
  onCompare: () => void;
  onExplain: () => void;
  preview: () => void;
}) {
  const clubs = useClubs();
  const story = p.story;
  const positional = story?.type === "observed_line_height_change";
  const copy = momentCopy(story, p.audience);
  const metric = (name: string) => story?.overlay.metrics.find((item) => item.name === name)?.value;
  const before = metric("before");
  const after = metric("after");
  const change = metric("change");
  const limitations = story?.narration.limitations ?? [];
  const team = clubs.name(story?.team);
  const tellsUs = positional && change !== undefined
    ? `Their recent samples averaged ${Math.abs(change).toFixed(2)} m ${change >= 0 ? "farther from" : "closer to"} their own goal.`
    : clubs.text(story?.narration.sentences[0]?.text ?? copy.detail);

  const currentStep: ExplorationStep = !p.explored.includes("watch") ? "watch" : !p.explored.includes("compare") ? "compare" : "explain";
  const steps: { id: ExplorationStep; label: string; action: () => void; disabled?: boolean }[] = [
    { id: "watch", label: "Watch", action: p.onWatch, disabled: !story || p.withheld },
    { id: "compare", label: "Compare", action: p.onCompare, disabled: !story || p.withheld || !story.claim_ids.length },
    { id: "explain", label: "Explain", action: p.onExplain, disabled: !story || p.withheld },
  ];
  return (
    <aside className="matchday-investigation" aria-label="Selected moment investigation" ref={p.railRef}>
      <div className="exploration-caption" aria-live="polite">
        <span>{p.explored.length === 3 ? "Evidence explored" : `${p.explored.length} of 3 steps explored`}</span>
      </div>
      <ol className="investigation-steps" aria-label="Watch, compare and explain">
        {steps.map((step, index) => {
          const complete = p.explored.includes(step.id);
          return <li key={step.id} className={`${complete ? "is-complete" : ""} ${!complete && currentStep === step.id ? "is-current" : ""}`}>
            {index > 0 && <span className={`step-connector ${p.explored.includes(steps[index - 1]!.id) ? "is-complete" : ""}`} aria-hidden="true" />}
            <button type="button" disabled={step.disabled} aria-label={step.label} aria-current={!complete && currentStep === step.id ? "step" : undefined} onClick={step.action}>
              <i aria-hidden="true">{complete ? <CheckIcon size={14} weight="bold" aria-hidden="true" /> : index + 1}</i><span>{step.label}</span>
            </button>
          </li>;
        })}
      </ol>

      <section className="investigation-content" key={story?.id ?? (p.withheld ? "withheld" : "empty")}>
        <div className="moment-copy" aria-live="polite" aria-atomic="true">
          <span className="moment-label">
            {p.withheld ? "Position review" : p.selected ? "Selected moment" : story ? "Recorded moment" : "Your matchday"}
          </span>
          <h1>{p.withheld ? "The evidence says wait." : !story ? p.presentationKind === "loading" ? "Updating explanation…" : "No new featured moment." : positional ? "Spot the shift." : clubs.text(copy.title)}</h1>
          <p>{p.withheld
            ? `${p.data?.tracking_available ? "Tracking observations are available. " : ""}At the recorded review at ${clockText(p.diagnostic?.detected_at_seconds ?? p.replayClock)}, the relevant evidence age was ${p.diagnostic?.recent_age_seconds == null ? "unknown" : `${p.diagnostic.recent_age_seconds} seconds`}. Recent comparable observations are needed to support a current positional comparison.`
            : positional
              ? `Compare ${team}'s three deepest outfielders in similar samples.`
              : !story ? "Explore the recorded moments. Score and positions follow the replay clock." : clubs.text(copy.detail)}</p>
        </div>

        {story && !p.withheld && (
          <div className="moment-timing" aria-label="Incident and replay timing">
            <span><small>Incident</small><time>{clockText(story.source_seconds)}</time></span>
            <span><small>Replay</small><time>{clockText(p.replayClock)}</time></span>
            <details>
              <summary>Source timing</summary>
              <p>Recorded {clockText(story.source_seconds)} · available {clockText(story.available_seconds)} · presented {clockText(story.presented_seconds)}</p>
            </details>
          </div>
        )}

        {positional && !p.withheld && (
          <section className="comparison-card" aria-label="Verified line comparison">
            <div className="comparison-heading">
              <strong>Compare the evidence</strong>
              <button type="button" className="comparison-open" onClick={p.onCompare} aria-label="Open Proof Lens"><FingerprintIcon size={17} aria-hidden="true" /></button>
            </div>
            <span className="comparison-measure-label">Line-height difference</span>
            {before !== undefined && after !== undefined && change !== undefined ? (
              <>
                <p className="comparison-delta" data-testid="line-change">
                  {change >= 0 ? "+" : ""}{change.toFixed(2)}<small>m</small>
                </p>
                <div className="comparison-values">
                  <span><small>Earlier window</small><strong>{before.toFixed(2)}<i>m</i></strong></span>
                  <span><small>Recent window</small><strong>{after.toFixed(2)}<i>m</i></strong></span>
                </div>
              </>
            ) : <p className="comparison-basis">Comparison measurements are unavailable for this moment.</p>}
            {p.support.status === "loading" && <p className="support-status" role="status">Verifying source sample support…</p>}
            {p.support.status === "ready" && p.support.proof?.calculation.support && (
              <p className="support-status" data-testid="verified-support">
                {p.support.proof.calculation.support.reference_frames + p.support.proof.calculation.support.recent_frames} verified samples · {p.support.proof.calculation.support.reference_frames} earlier / {p.support.proof.calculation.support.recent_frames} recent
              </p>
            )}
            {p.support.status === "error" && (
              <div className="support-error" role="status">
                <span>Sample support could not be verified.</span>
                <button onClick={p.support.retry}>Retry source check</button>
              </div>
            )}
          </section>
        )}

        {!positional && story && !p.withheld && (
          <>
          <section className="incident-card" aria-label="Source incident">
            <span>{team} · {story.type.replaceAll("_", " ")}</span>
            <strong>{clockText(story.source_seconds)}</strong>
            <p>Source-linked incident · replay {clockText(p.replayClock)}</p>
          </section>
          <button type="button" className="comparison-open incident-proof" onClick={p.onCompare} aria-label="Open Proof Lens"><FingerprintIcon size={17} aria-hidden="true" /> Open Proof Lens</button>
          </>
        )}

        {(story || p.withheld) && <div className="comparison-insights" id="moment-explanation" tabIndex={-1} aria-label="Explanation and uncertainty">
          <section>
            <span className="insight-medallion"><LightbulbIcon size={18} aria-hidden="true" /></span>
            <div><h2>What this tells us</h2><p>{p.withheld ? "Available tracking alone does not establish a supported current comparison. This recorded review withheld the explanation." : tellsUs}</p></div>
          </section>
          <section>
            <span className="insight-medallion"><QuestionIcon size={18} aria-hidden="true" /></span>
            <div><h2>What stays uncertain</h2><p>{limitations[0] ?? "These observed events do not establish a cause, outcome or intention beyond the registered source evidence."}</p></div>
          </section>
        </div>}

        {story && !p.withheld && <div className="investigation-actions">
          <button className="evidence-button" aria-label="Reveal controlled explanation" onClick={p.onExplain}><PlayIcon size={16} weight="fill" aria-hidden="true" />Explain this moment</button>
          <button className="preview-commentary" aria-label={`Preview commentary for ${p.selected ? "selected historical moment" : "this moment"}`} disabled={!story} onClick={p.preview}><SpeakerHighIcon size={19} aria-hidden="true" /><span>Preview commentary</span></button>
        </div>}
        {p.withheld && p.diagnostic && <details className="withheld-diagnostics"><summary>Recorded review diagnostics</summary><p>Review {clockText(p.diagnostic.detected_at_seconds)} · {p.diagnostic.reasons.join(", ")}. Recent span: {p.diagnostic.recent_span_seconds ?? "unknown"} seconds. These are recorded review values.</p></details>}
        {p.withheld && <div className="withheld-note"><strong>No current comparison available</strong><span>Choose an earlier recorded moment to inspect its historical evidence.</span></div>}
        {!story && !p.withheld && <p className="investigation-empty">Play the replay or choose an available moment to inspect its source.</p>}
      </section>
    </aside>
  );
}
