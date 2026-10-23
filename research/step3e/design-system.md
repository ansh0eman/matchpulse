# A broadcast with an inspectable fact

The opening is the existing tracked line-change fixture at 3360s. It deliberately shows a 0–0 score alongside a meaningful **+10.01m observed comparison**. A different event-only fixture supplies the goal chapter; no goal or tracking has been invented to combine them.

## Composition and references

The working baseline was exercised in a real browser: six original Theatre checks passed before edits. Genuine baseline captures are in artifacts/before-*.png. The new composition places one editorial statement beside the observed pitch, rather than laying prose across players. At 1366×768 the comparison, source clock, proof action and replay controls fit the first viewport. Mobile stacks score → observed pitch → insight → proof → transport. Geometry and overlap are acceptance assertions, not assumptions.

Public references were studied for principles, not copied: [Matchboard](https://dribbble.com/shots/27235118-Matchboard-Football-Match-Dashboard) uses compact score/event hierarchy; [AI Match Zone](https://dribbble.com/shots/27043360-AI-Powered-Football-Match-Zone) groups related information on a dark stage; [Live Match App](https://dribbble.com/shots/26643988-Football-App-UI-Live-Match-App) emphasizes score-first mobile navigation. These are design concepts, not verified live products. We reject their unmeasured heatmaps, real club assets, footage and ratings.

A fresh image-to-code reference informed the left statement/right pitch proportions. Its generated spectator counts and invented timeline events were rejected. The image is a concept, never browser proof; runtime visuals are native CSS/SVG over original observations.

## Restrained tokens

| Token | Value / use |
|---|---|
| Canvas / surface / boundary | #080b0c / #101516 / #2a3435 |
| Body / secondary text | #f5f7f3 / #9ba6a1 |
| Active / evidence / verified | #d5ff45 / #55ddf7 / #71f2b6 |
| Typeface | Locally bundled Manrope Variable; IBM Plex Mono for clocks, IDs, coordinates |
| Type scale | 34–58px lead, 29px measurements, 14–15px explanation, 10–12px secondary provenance |
| Space / radii | 8, 12, 16, 24, 32px; controls 4px, stage 6px |
| Motion | 220ms score reveal, 280ms proof reveal, 350ms moment reveal; opacity/short vertical entry only |
| States | Loading clears stale facts; disabled proof until current context exists; explicit retry on failure; caution for withheld evidence |

Calculated WCAG token contrast: body/canvas 18.32:1; secondary/canvas 7.86:1; lime/surface 15.97:1; cyan/surface 11.46:1; dark CTA text/cyan 11.72:1. This is a finite token check, not a whole-site accessibility certification. Keyboard and reduced-motion behavior have explicit browser cases. Secondary provenance stays available without competing with the match.

No player transition or path is animated. Score changes animate only after source state changes. Before/after frames reveal without generating intermediate positions. Proof controls occupy their own row; evidence scrolls above them. Full acceptance and genuine after captures are indexed in browser-acceptance.md.
