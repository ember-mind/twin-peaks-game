# Playable Build 01: real touch preflight

This bounded test starts ordinary index.html in fresh Chrome mobile-emulation profiles at 390x844 and 844x390. It uses CDP touch events on the real on-screen controls, never keyboard shortcuts, seeded saves, runtime effects or teleports. The read-only observer projects labelled controller geometry and notebook Close focus, without widening the driver API.

The test starts New Game, verifies single-page advance, reaches the actual opening position, turns without overshoot, steps once and releases, opens the notebook/casebook and tries to close it through the same on-screen UI. Visible controls must remain within the configured viewport. Only touch events are allowed in its input ledger. Each run has exclusive evidence files and missing evidence/browser faults are failures.

19 local geometry contracts and the existing 66 browser boundary, 16 route and report-safety tests passed. These are not hosted touch results. The PR remains draft until the actual production touch runs and maintained tests pass; any failed interaction must be diagnosed rather than bypassed.

This is not a full mobile campaign, physical Safari/Android device test, rotation test, accessibility audit or human playtest. No main merge, deployment or Vault synchronization.
