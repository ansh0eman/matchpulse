import {
  ArrowCounterClockwiseIcon,
  PauseIcon,
  PlayIcon,
} from "@phosphor-icons/react";
import { clockText } from "../ProofLens";
import type { Story } from "../contracts";

export function ReplayControls(p: {
  clock: number;
  duration: number;
  playing: boolean;
  disabled: boolean;
  speed: number;
  moments: Story[];
  play: () => void;
  seek: (clock: number) => void;
  setSpeed: (speed: number) => void;
}) {
  const ticks = [...new Set(p.moments.map((m) => m.presented_seconds))];
  return (
    <div className="theatre-transport" aria-label="Replay controls">
      <button
        className="md-play"
        aria-label={p.playing ? "Pause replay" : "Play replay"}
        onClick={p.play}
        disabled={p.disabled}
      >
        {p.playing ? (
          <PauseIcon size={20} weight="fill" aria-hidden="true" />
        ) : (
          <PlayIcon size={20} weight="fill" aria-hidden="true" />
        )}
      </button>
      <button aria-label="Replay from start" onClick={() => p.seek(0)}>
        <ArrowCounterClockwiseIcon size={19} aria-hidden="true" />
      </button>
      <time>{clockText(p.clock)}</time>
      <div className="md-scrubber">
        <input
          aria-label="Replay clock"
          type="range"
          min={0}
          max={p.duration || 6000}
          step={0.25}
          value={p.clock}
          onChange={(e) => p.seek(Number(e.target.value))}
        />
        <div className="md-event-ticks" aria-hidden="true">
          {ticks.map((t) => (
            <i
              key={t}
              style={{ left: `${(100 * t) / (p.duration || 6000)}%` }}
            />
          ))}
        </div>
      </div>
      <span>{clockText(p.duration)}</span>
      <select
        aria-label="Playback speed"
        value={p.speed}
        onChange={(e) => p.setSpeed(Number(e.target.value))}
      >
        <option value={1}>1×</option>
        <option value={4}>4×</option>
        <option value={12}>12×</option>
      </select>
    </div>
  );
}
