import type { Frame, Observation } from "./contracts";
export function Pitch({
  frame,
  events = [],
  compact = false,
  highlight = [],
}: {
  frame: Frame | null;
  events?: Observation[];
  compact?: boolean;
  highlight?: string[];
}) {
  return (
    <svg
      className={`pitch ${compact ? "compact" : ""}`}
      viewBox="-4 -4 113 76"
      role="img"
      aria-label={
        frame
          ? "Observed player and ball positions"
          : "Observed event ball locations; no tracking available"
      }
    >
      <defs>
        <pattern
          id="grass"
          width="21"
          height="68"
          patternUnits="userSpaceOnUse"
        >
          <rect width="10.5" height="68" fill="#284c38" />
          <rect x="10.5" width="10.5" height="68" fill="#2b503b" />
        </pattern>
      </defs>
      <rect x="-4" y="-4" width="113" height="76" rx="1.4" fill="#203e2d" />
      <rect width="105" height="68" fill="url(#grass)" />
      <g fill="none" stroke="#bdd3bf" strokeOpacity=".48" strokeWidth=".3">
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
            <g key={p.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={highlight.includes(p.id) ? 2 : 1.35}
                fill={p.team_id === "NORTH" ? "#d9f27b" : "#e4e8e5"}
                stroke={
                  highlight.includes(p.id)
                    ? "#fff"
                    : p.goalkeeper
                      ? "#e9b36f"
                      : "#0d2417"
                }
                strokeWidth={highlight.includes(p.id) ? 0.65 : 0.35}
              />
              {!compact && (
                <text
                  x={p.x}
                  y={p.y + 0.52}
                  textAnchor="middle"
                  fontSize="1.45"
                  fontWeight="700"
                  fill="#16241b"
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
                fill={e.team === "NORTH" ? "#d9f27b" : "#fff"}
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
}
