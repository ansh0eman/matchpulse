import {
  ArrowRightIcon,
  PauseIcon,
  PlayIcon,
  XIcon,
} from "@phosphor-icons/react";
export const CHAPTERS = [
  {
    title: "The moment",
    scenario: "opening-goal",
    text: "Watch the score change at the source boundary. This is the opening-goal fixture.",
    seconds: 16,
  },
  {
    title: "The explanation",
    scenario: "opening-goal",
    text: "Switch to Analyst detail. The measurements stay the same.",
    seconds: 16,
  },
  {
    title: "The proof",
    scenario: "line-shift",
    text: "A different fixture. Inspect the before/after positions, then the method and raw evidence.",
    seconds: 26,
  },
  {
    title: "The restraint",
    scenario: "withheld",
    text: "Another fixture. Evidence 132 seconds old is withheld. Open Agent room to see genuine recorded recovery.",
    seconds: 18,
  },
];
export function GuidedStory({
  chapter,
  seconds,
  playing,
  next,
  toggle,
  close,
}: {
  chapter: number;
  seconds: number;
  playing: boolean;
  next: () => void;
  toggle: () => void;
  close: () => void;
}) {
  const c = CHAPTERS[chapter];
  return (
    <aside className="guided-story" aria-label="Guided judge story">
      <div>
        <span>CHAPTER {chapter + 1} / 4 · SEPARATE SYNTHETIC SCENARIOS</span>
        <strong>{c.title}</strong>
        <p>{c.text}</p>
        <progress
          value={seconds}
          max={c.seconds}
          aria-label="Chapter progress"
        />
      </div>
      <button
        onClick={toggle}
        aria-label={playing ? "Pause guided story" : "Resume guided story"}
      >
        {playing ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
      </button>
      <button
        onClick={next}
        aria-label={
          chapter === 3 ? "Finish guided story" : "Next story chapter"
        }
      >
        {chapter === 3 ? "Finish" : "Next"}
        <ArrowRightIcon size={18} />
      </button>
      <button onClick={close} aria-label="Close guided story">
        <XIcon size={22} />
      </button>
    </aside>
  );
}
