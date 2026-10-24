# Matchday design system

Direction: **Touchline Studio**. A cool, light working surface frames a dominant green observed pitch. Commentary is an attached broadcast caption; chronology is a single list. This is a bounded primary-surface redesign, not a claim that every legacy advanced panel has been redesigned.

Tokens in `web/src/design/matchday.css`: ink#163e47, muted#596d70, paper#fff, canvas#edf1ef, line#ced9d5. Existing green pitch and distinct lime/white player markers remain data categories, not extra CTA colors. Focus uses#b64c24.

Manrope remains the licensed interface/display family; IBM Plex Mono remains for clocks/numbers. No font/dependency churn. Headlines23–34px, body12–14px, editorial weight650, small labels sentence case. Borders separate tasks rather than enclose every row in a card. Corners2–4px; no glow, glass or decorative gradients.

Desktop: observed stage plus274px moment rail; transport and preferences sit under the stage. Mobile≤700px: score→intrinsic-aspect pitch→explanation/evidence→transport/preferences→chronology. Scene height is content-driven on mobile. Only incident/score changes animate,180ms opacity/translation; reduced motion disables them. Original coordinates are never tweened.
