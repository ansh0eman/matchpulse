import { useClubs } from "./clubs/Clubs";
import type { Frame, Observation } from "./contracts";
import { memo, useId } from "react";
export const Pitch = memo(
  function Pitch({
    frame,
    events = [],
    compact = false,
    highlight = [],
    highlightedBall = false,
  }: {
    frame: Frame | null;
    events?: Observation[];
    compact?: boolean;
    highlight?: string[];
    highlightedBall?: boolean;
  }) {
    const clubs = useClubs();
    const patternId = `grass-${useId().replaceAll(":", "")}`;
    return (
      <svg
        className={`pitch ${compact ? "compact" : ""}`}
        viewBox="-4 -4 113 76"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={
          frame
            ? "Observed player and ball positions"
            : "Observed event ball locations; no tracking available"
        }
      >
        <defs>
          <radialGradient id={`${patternId}-north`} cx="30%" cy="25%">
            <stop offset="0" stopColor="#f1ffad" />
            <stop offset="1" stopColor="#b9dd45" />
          </radialGradient>
          <radialGradient id={`${patternId}-south`} cx="30%" cy="25%">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#d9e1dc" />
          </radialGradient>
          <filter id={`${patternId}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy=".35" stdDeviation=".22" floodColor="#071b10" floodOpacity=".4" />
          </filter>
          <pattern
            id={patternId}
            width="21"
            height="68"
            patternUnits="userSpaceOnUse"
          >
            <rect width="10.5" height="68" fill="#17643a" />
            <rect x="10.5" width="10.5" height="68" fill="#1d7041" />
          </pattern>
        </defs>
        <rect x="-4" y="-4" width="113" height="76" rx="1.4" fill="#104f2d" />
        <rect width="105" height="68" fill={`url(#${patternId})`} />
        <g fill="none" stroke="#e4f1df" strokeOpacity=".78" strokeWidth=".34">
          <rect width="105" height="68" />
          <path d="M52.5 0V68" />
          <circle cx="52.5" cy="34" r="9.15" />
          <rect y="13.84" width="16.5" height="40.32" />
          <rect x="88.5" y="13.84" width="16.5" height="40.32" />
          <rect y="24.84" width="5.5" height="18.32" />
          <rect x="99.5" y="24.84" width="5.5" height="18.32" />
          <path d="M16.5 26.7 A9.15 9.15 0 0 1 16.5 41.3 M88.5 26.7 A9.15 9.15 0 0 0 88.5 41.3" />
          <rect x="-1.7" y="30.34" width="1.7" height="7.32" />
          <rect x="105" y="30.34" width="1.7" height="7.32" />
        </g>
        <g fill="#d5e6d1" opacity=".7">
          <circle cx="11" cy="34" r=".4" />
          <circle cx="94" cy="34" r=".4" />
          <circle cx="52.5" cy="34" r=".4" />
        </g>
        {frame
          ? frame.players.map((p) => (
              <g key={p.id} filter={`url(#${patternId}-shadow)`}>
                {highlight.includes(p.id) && <circle cx={p.x} cy={p.y} r="2.55" fill="none" stroke="#f3e74d" strokeWidth=".48" className="pitch-contributor-ring" />}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={highlight.includes(p.id) ? 2 : 1.35}
                  fill={clubs.marker(p.team_id).fill}
                  data-source-player={p.id}
                  data-team={p.team_id}
                  strokeDasharray={clubs.marker(p.team_id).dashed ? ".4 .2" : undefined}
                  stroke={
                    highlight.includes(p.id)
                      ? "#fff"
                      : p.goalkeeper
                        ? "#e9b36f"
                        : clubs.marker(p.team_id).outline
                  }
                  strokeWidth={highlight.includes(p.id) ? 0.65 : p.goalkeeper ? 0.5 : 0.35}
                />
                {!compact && (
                  <text
                    x={p.x}
                    y={p.y + 0.52}
                    textAnchor="middle"
                    fontSize="1.45"
                    fontWeight="700"
                    fill={clubs.marker(p.team_id).ink}
                  >
                    {p.id.split("-").at(-1)}
                  </text>
                )}
                <title>
                  Source ID {p.id}: {p.x.toFixed(2)}, {p.y.toFixed(2)}m. Numbers
                  identify source players, not shirt numbers.
                </title>
              </g>
            ))
          : events.slice(-8).map((e, i) => (
              <g key={e.source_id} opacity={0.3 + i * 0.09}>
                <circle
                  cx={e.ball_position_m.x}
                  cy={e.ball_position_m.y}
                  r="1.2"
                  fill={e.team ? clubs.marker(e.team).fill : "#fff"}
                />
                <text
                  x={e.ball_position_m.x + 2}
                  y={e.ball_position_m.y}
                  fontSize="2.1"
                  fill="#fff"
                >
                  {e.action.replaceAll("_", " ")}
                </text>
              </g>
            ))}
        {frame && (
          <>
            {highlightedBall && <circle cx={frame.ball.x} cy={frame.ball.y} r="2.25" fill="none" stroke="#ff315f" strokeWidth=".55" className="pitch-contributor-ring" />}
            <circle
              cx={frame.ball.x}
              cy={frame.ball.y}
              r="1.05"
              fill="white"
              stroke="#121b15"
              strokeWidth=".45"
            />
            <circle
              cx={frame.ball.x}
              cy={frame.ball.y}
              r="2.8"
              fill="none"
              stroke="white"
              strokeOpacity=".4"
              strokeWidth=".25"
            />
          </>
        )}
      </svg>
    );
  },
  (before, after) => {
    if (before.frame !== after.frame || before.compact !== after.compact || before.highlightedBall !== after.highlightedBall)
      return false;
    const a = before.highlight ?? [],
      b = after.highlight ?? [];
    if (a.length !== b.length || a.some((id, i) => id !== b[i])) return false;
    // A tracked frame ignores event dots. Keep the SVG unchanged on clock-only ticks.
    if (before.frame) return true;
    const x = before.events ?? [],
      y = after.events ?? [];
    return x.length === y.length && x.every((event, i) => event === y[i]);
  },
);
