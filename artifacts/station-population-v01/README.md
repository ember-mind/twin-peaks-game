# Character Population Pass 01 — Sheriff's Station (closed 2026-09-09)

Closes the pass started earlier the same day (`validation/` holds the before-snapshots). Uses Character Life v0.1 unchanged; no architecture extension.

## Cast and placement (map `sheriff`, 16×12 native interior)

| Character | Tile | Role reading | Generic | Contextual | Reactive |
|---|---|---|---|---|---|
| Truman | 10,4 | beside the sheriff desk, task focus down | blink 12–38 s | reads a file 32–65 s (2.4–3.4 s) | existing action-key facing, returns to desk focus |
| Lucy | 2,6 | behind the reception counter (body occluded, head visible: reads seated) | blink 16–34 s | telephone receiver 26–44 s (2.2–3.2 s) | existing facing |
| Andy | 10,7 | standing at the end of the deputies' north desk | blink 23–47 s | checks a note 48–78 s (1.3–1.9 s) | existing facing |
| Hawk | 12,8 | at the deputies' south desk (occluded by the desk front: reads seated) | none | none | existing facing |
| Leland | 8,5 | only during act 5, in front of the sheriff desk | none | none | existing |

Hawk evaluation: his dialogue is a counted narrative acquisition (walkthrough 86), so he stays in the station; he receives no Character Life profile. Stillness remains dominant for every actor; the three profiled actors have different idle ranges and independent seeded timers.

NPC records (with narrative dialogue cascades) live in `js/glue.js` `NPCS.sheriff`; profiles in `js/character-life-scenes.js` (single registration, `js/station-population-scenes.js` removed); frames in `assets/sprites/station-population-v01.png` (192×24) via `js/retro-authored.js` `LIFE_FRAMES`.

## Review

Native capture with the full cast: `../production-vertical-slice-01/interior-cast-native.png` (5×: `interior-cast-5x.png`). Art-direction verdict: **pass with notes**. The room reads as one working station (reception, sheriff, two deputies) with the aisle and entrance column clear. Note: Andy stands in open floor beside his desk rather than behind it; acceptable, revisit only if the desk zone is re-authored.

Tests: `test/station-population.js`, `test/character-life.js`, `test/sheriffs-station-native.js`, `test/sheriffs-station-location.js`, smoke 416, walkthrough 86.

## Freeze

**Character Life v0.1 is frozen.** No v0.2 work (looks, posture, schedules, gestures) is authorised by this pass.
