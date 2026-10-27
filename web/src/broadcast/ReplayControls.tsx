import type { ReactNode } from "react";
import { timePercent } from "./timeAxis";
import {
  ArrowCounterClockwiseIcon,
  PauseIcon,
  PlayIcon,
  SpeakerHighIcon,
} from "@phosphor-icons/react";
import { clockText } from "../time";
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
  commentary: boolean;
  commentaryAvailable: boolean;
  onToggleCommentary: () => void;
  captions: boolean;
  onToggleCaptions: () => void;
  caption: string;
  voiceSettings?: ReactNode;
}) {
  const ticks = [...new Set(p.moments.map((m) => m.source_seconds))];
  return (
    <div className="theatre-transport" role="group" aria-label="Replay controls">
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
          data-time-percent={timePercent(p.clock,p.duration) ?? 0}
          onChange={(e) => p.seek(Number(e.target.value))}
        />
        <div className="md-event-ticks" aria-hidden="true">
          {ticks.map((t) => (
            <i
              key={t}
              style={{ left: `${timePercent(t,p.duration) ?? 0}%` }}
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
      <div className="replay-audio-controls" aria-label="Audio and captions">
        <button
          type="button"
          className="replay-audio-toggle"
          aria-label={p.commentaryAvailable ? `Commentary ${p.commentary ? "on" : "off"}` : "Commentary unavailable: no local English voice"}
          aria-pressed={p.commentary}
          disabled={!p.commentaryAvailable}
          onClick={p.onToggleCommentary}
        ><SpeakerHighIcon size={17} aria-hidden="true" />{p.commentaryAvailable ? `Commentary ${p.commentary ? "on" : "off"}` : "Voice unavailable"}</button>
        <button
          type="button"
          className="replay-caption-toggle"
          aria-label={`Captions ${p.captions ? "on" : "off"}`}
          aria-pressed={p.captions}
          onClick={p.onToggleCaptions}
        ><span aria-hidden="true">CC</span>Captions {p.captions ? "on" : "off"}</button>
      </div>
      {p.voiceSettings}
      {p.captions && p.caption && <output className="replay-caption-line" aria-live="polite">{p.caption}</output>}
    </div>
  );
}
