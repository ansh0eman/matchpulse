import type { Story, Audience } from "../contracts";

/** Presentation phrases use only already verified compiler values. No new claims. */
export function momentCopy(story: Story | undefined, audience: Audience) {
  if (!story)
    return {
      title: "North v South",
      detail: "Play the match, then open a moment to explore it.",
    };
  const metric = (name: string) =>
    story.overlay.metrics.find((m) => m.name === name)?.value;
  const club =
    story.team === "NORTH"
      ? "North"
      : story.team === "SOUTH"
        ? "South"
        : "The match";
  const number = (n: number) =>
    Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, "");
  let title = story.narration.headline;
  let detail =
    story.narration.sentences[0]?.text ?? "Source observations verified.";
  if (story.type === "turnover_to_shot" && metric("elapsed") !== undefined) {
    title = `A regain. A shot. ${number(metric("elapsed")!)} seconds.`;
    detail = `${club}'s high regain was followed by a shot in the same possession.`;
  } else if (
    story.type === "observed_line_height_change" &&
    metric("change") !== undefined
  ) {
    const change = metric("change")!;
    title = `Line-height difference: ${number(Math.abs(change))} metres.`;
    detail = `${club}'s three deepest outfielders, compared across sampled windows in similar situations.`;
  } else if (
    story.type === "goal_context" &&
    metric("NORTH_after") !== undefined &&
    metric("SOUTH_after") !== undefined
  ) {
    const home = metric("NORTH_after")!,
      away = metric("SOUTH_after")!;
    title =
      home === away
        ? `Level again. ${home}–${away}.`
        : `${home > away ? "North" : "South"} lead ${home}–${away}.`;
    detail = "Rewind the moment, or explore the events behind it.";
  } else if (story.type === "observed_shot") {
    title = `${club} take a shot.`;
    detail = "A shot attempt. Explore the moment for the details.";
  } else if (story.type === "high_turnover") {
    title = `A high regain for ${club}.`;
    detail = "Possession changes hands high up the pitch.";
  }
  return {
    title,
    detail:
      audience === "analyst" && story.type !== "observed_line_height_change"
        ? story.narration.sentences.map((s) => s.text).join(" ")
        : detail,
  };
}
