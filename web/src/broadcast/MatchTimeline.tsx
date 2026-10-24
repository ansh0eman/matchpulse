import { ArrowUpRightIcon } from "@phosphor-icons/react";
import type { Audience, Story } from "../contracts";
import { clockText } from "../ProofLens";
import { momentCopy } from "./presentation";

const labels: Record<string, string> = {
  goal_context: "Goal",
  observed_shot: "Shot",
  observed_line_height_change: "Position change",
  turnover_to_shot: "Regain to shot",
  match_boundary: "Match event",
  shot_outcome: "Shot outcome",
  recent_attacking_activity: "Attacking spell",
  high_turnover: "High regain",
  player_dismissal: "Red card",
};
export function MatchTimeline(p: {
  moments: Story[];
  audience: Audience;
  selected?: string;
  select: (story: Story) => void;
}) {
  const moments = [...p.moments]
    .sort(
      (a, b) =>
        b.presented_seconds - a.presented_seconds || b.priority - a.priority,
    )
    .slice(0, 8);
  return (
    <aside className="md-moments theatre-available" aria-label="Match moments">
      <header>
        <h2>The match so far</h2>
        <span>
          {p.audience === "analyst" ? "Analyst selection" : "Key moments"}
        </span>
      </header>
      {moments.length ? (
        <ol>
          {moments.map((story) => (
            <li key={story.id}>
              <button
                aria-current={p.selected === story.id ? "true" : undefined}
                onClick={() => p.select(story)}
              >
                <time>{clockText(story.source_seconds)}</time>
                <div>
                  <small>{labels[story.type] ?? "Moment"}</small>
                  <strong>{momentCopy(story, p.audience).title}</strong>
                </div>
                <ArrowUpRightIcon size={15} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p>Moments appear here as the match unfolds.</p>
      )}
      <footer>Select a moment to revisit it.</footer>
    </aside>
  );
}
