# Accessibility review scope

Calculated sRGB contrast: ink#163e47 on white **11.58:1**; muted#596d70 on canvas#edf1ef **4.79:1**; muted on white **5.46:1**. These cover the new primary text/button pairs, not a certification of every inherited surface.

Controls retain native buttons, select labels and range input. New decorative icons are aria-hidden; moment selection has aria-current; the current moment uses polite incident updates rather than announcing the clock every tick. Focus-visible is explicit and reduced-motion disables new incident/score effects. Modal focus/Escape behavior remains in the original tested hook. Replay-from-start remains reachable on phone.

Tests retain source-boundary, proof arithmetic, future rejection, failure/retry and geometry assertions. Layout-specific tests now explicitly request the positional fixture because the default is the native goal; they check the new pitch-above-caption composition rather than the removed split. This does not weaken source assertions.

Acceptance covers Chromium laptop and emulated mobile, keyboard proof access, overflow and reduced motion. Physical devices, full screen-reader evaluation, Safari and an independent WCAG audit are not claimed. User direction defers the broad six-size audit in favor of working product and submission readiness.
