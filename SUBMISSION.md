# Turn of Play

**See what changed. Understand what supports it. Know what remains uncertain.**

Built for the Microsoft × Premier League Inside the Game: Developer Hackathon.

- [Open the working browser demo](https://matchpulse-studio.politesea-3d29a667.eastus.azurecontainerapps.io/?view=theatre&scenario=native-goals)
- [Watch/download the 1:53 product video](https://github.com/ansh0eman/matchpulse/releases/download/turn-of-play-20261026-0b06707/turn-of-play-demo.mp4)
- [Project page and video](https://ansh0eman.in/projects/turn-of-play/)
- [Project image](https://github.com/ansh0eman/matchpulse/releases/download/turn-of-play-20261026-0b06707/turn-of-play-demo.png)

## What I built

Turn of Play makes football intelligence something fans can investigate. Watch a synthetic match, catch a key moment, switch between Fan and Analyst views, then open the proof behind the explanation. The score, timeline and observed player positions follow the original source clock. Proof Lens independently recomputes the numbers, exposes the original samples and keeps unsupported interpretations out of the broadcast.

The line-comparison example uses 41 earlier and 18 recent source frames: 59 original observations, 21.95m to 31.96m, approximately +10.01m. The comparison is a sampled-window estimate, not a continuous trajectory. When evidence is stale or insufficient, the current explanation is withheld. The player inspector exposes the original synthetic source player's coordinates and identity.

Microsoft Foundry and Microsoft Agent Framework coordinate a genuine recorded workflow with distinct roles: Director, Match Analyst, Evidence Challenger, Narrator and Replay Producer. Models select registered evidence; deterministic code independently verifies the output against source observations. Narration and replay have separate branches. The public viewer revalidates the saved execution and makes no new model call when opened. Azure Container Apps hosts the experience.

## Judge access

The public demo requires no login. Use Matchday for playback and audience controls, Investigate for source observations and original player coordinates, and Studio for the saved workflow. Open Proof Lens on the line-comparison example to inspect the independent receipt, method, source samples and uncertainty. A cold start may take a short time.

## Stack

Python, Pydantic, React, TypeScript, Microsoft Foundry, Microsoft Agent Framework, Azure Container Apps, GitHub Actions and GHCR. See [README.md](README.md) for setup, architecture, source provenance and verification records, and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attribution.

## Scope

All football observations are synthetic. Club names and colours are presentation metadata, not actual club performance or real-player identities. The product does not establish coaching intent, pressing success, real-world calibration or measured human usefulness. The hosted experience is a prototype; full public browser acceptance remains open. Saved model activity is identified as recorded activity.

The demo video and screenshot are hosted as public GitHub release assets for the manual-submission route supplied by the hackathon support team. Platform entry/receipt confirmation is pending; no acceptance or award is claimed.
