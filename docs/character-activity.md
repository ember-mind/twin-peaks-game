# Double R — first character routines

Two small authored gestures are integrated into the production renderer:

- The upper-right seated patron lifts the existing coffee cup, holds it at the mouth, lowers it and restores the resting pose. The saucer stays on the table; the table cup is omitted while held. Idle delay: 12–26 seconds, action duration: 3.0–3.4 seconds.
- Norma wipes a clear patch of counter with two short passes. Her shoulder stays anchored; forearm, hand and cloth move together. Idle delay: 18–34 seconds, action duration: 2.8–3.2 seconds.

`CharacterActivity` owns an independent seeded clock instance using the existing generic intermittent scheduling implementation (`ACTOR_ACTIVITY`). It does not consume the environment instance's RNG and does not trigger reactive doors. Each actor routine has a stable ID and independent schedule. Production uses a session seed; evidence uses 1989.

Rendering uses authored integer poses. Seated elbow/forearm poses reuse the existing seated mirroring and clothing palette. The cup is drawn once in its current location. Norma retains the existing atlas head, torso and legs; only the resting right-arm region is omitted during the gesture and replaced by the authored bent arm. The foreground counter pass redraws the active hand/cloth at the correct depth. No atlas file, map, collision footprint, camera or resolution changes.

Norma must be stationary at her existing workstation. While cleaning she faces the counter; idle random turns wait until the action ends. Dialogue cancels the current wipe; it never resumes halfway through that cancelled action. The seated patron can continue sipping while the player talks to Norma. Menus pause routine time, scene exits stop that scene's clock, and unrelated maps draw no gestures.

The frame painters separate palette/pose mirroring from timing. Another seated character can reuse the authored arm poses and cup painter with an appropriate anchor; another service station needs matching authored arm/cloth positions. No full NPC behavior framework was added.

## Preview and validation

`test/ambient-life-preview.html` includes **Prova sorso** and **Prova pulizia** buttons. These call the same production pose painters through explicit preview overrides. Normal gameplay triggers both routines automatically; no preview button is required.

`?record=1&clip=gestures` produces an eight-second native clip: sip at 0.5 seconds, wipe at 4 seconds. Existing environmental timers are held steady and no door event is injected in this clip. Static comparison disables character routines too.

`test/character-activity.js` checks seeded timing, separate starts, pause/disable, scene/workstation guards and wipe cancellation. Coldstage `dinerGestures` captures rest, reach, lift, sip, return, left/middle/right wipe and restored rest. Existing diner/environment scenarios continue guarding approved artwork and effects.

These changes are local until the game is separately published. No deployment or audio change is part of this pass.

Wipe refinement: wrist travel reduced from 8 to 4 world pixels, sleeve/forearm shortened and cloth moved one pixel toward the rear counter edge. This keeps the gesture close to Norma rather than extending across the counter.

Preview controls now show animation mode explicitly. Prova sorso/pulizia and the direct light/neon/glass tests restore all layers and unpause; switching to Static or Reactive only can no longer leave ambient life silently disabled after a gesture test. Production effect strengths and timers are unchanged.

Ambient effect preview buttons now show a nearest-neighbor 8× crop with before/live comparison, replaying three real seeded cycles at one-eighth speed with short rests. Production effect strength and scheduling remain unchanged. Another mode/action cancels the replay; completion restores the live ambient clock. The regression test uses the real AmbientLife implementation to exercise cycle duration, rest, cancellation and layer recovery.

The September 8 visibility correction supersedes the slowed ambient preview above: ambient buttons now replay three cycles at normal speed using the revised production lighting. Comparison crops are below the room, and browser pixel checks supplement native controller tests. Coffee sip and counter wipe are unchanged.
