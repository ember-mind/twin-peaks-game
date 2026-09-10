# Town world-cohesion pass — brief (Phase 4)

Decision D1/D5: the Town joins the slice's early-dusk state through one authored grade plus two frontage rewrites and warm/cool practicals on the civic strip. No day/night system, no time value, no procedural exterior generator.

## A. Dusk grade (`js/town-dusk.js`, new)

Wrap `GAME.Retro2D.limitBackgroundPalettes` (same wrapping pattern as `js/double-r-exterior-scene.js`): for `mapId === 'town'` run the grade on the background composite (before OBJ sprites), then call the original. Deterministic per-pixel mapping, memoised by 24-bit key, integer output, no blur, no dithering, no neighbourhood reads.

Grade rules (tune by looking at native captures, not by theory). Work in linear-ish RGB, `L = 0.2126R+0.7152G+0.0722B`:

1. Value compression: `L' = 26 + 0.66·L` (creams drop to mid tan-gray, inks lift slightly so ground detail survives).
2. Cool cast: after compression mix 22% toward slate `#485665` for low-saturation pixels (sat < 0.25), 12% for others.
3. Vegetation family (hue 90°–170°, sat > 0.3): darken an extra 12% and desaturate 25% — vegetation must become the darkest family, matching the exterior lots' shrub values (`#233a2f`, `#2f4d3b`, `#3e6248`).
4. Warm accent family (hue < 20° or > 340°, sat > 0.4 — burgundy, red cars): keep hue, darken 20%, no cool mix beyond 8%.
5. Blues (hue 190°–250°): keep, compress only.
6. Never output a pure black; clamp min channel 8.

Reference checks: the town road/sidewalk beside the Double R lot must land within ±12 per channel of the lot's slate `#485665` / concrete `#7d7b72` after grading (adjust the rule constants, not per-pixel exceptions).

## B. Emissive practicals overlay (same file, authored table)

After the grade, paint authored emissive rectangles in world coordinates (integer, camera-relative), only for the slice landmarks:

- `sheriff` landmark (anchor tile 10,17, door 12,20): two window glows pale cool `#cfe0cf` with a 2-step apron pool (`#8a9184` then `#6f7a72`), one cool door lamp pixel pair; one warm 3×3 lamp dot `#f2c76a` in the right window.
- `double-r` landmark (anchor 39,18, door 42,20): two window glows warm `#e9bd5d`/`#f4e6c8` with a 2-step warm pool on the sidewalk, sign letters `#c45a61` on dark board, door glass warm.
- Street lamps on the civic strip (rows 13–24, cols 5–50) where a lamp prop exists (`townUtilityAnchor`): warm bulb 2×2 `#f2c76a` and a 3-step pool on the ground under it (radius ≤ 12 px). No pulsing, no animation.

Coordinates come from the landmark table in `js/retro-authored.js` (~line 4018) so the overlay cannot drift from the frontage.

## C. Frontage rewrites (in `js/retro-authored.js`, bounded)

- `townDoubleR` (~3394–3563): replace the red/white awning day frontage with the Double R exterior native language — low charcoal roof with 1 px warm rim, cream/sage clapboard with 2 px courses, burgundy fascia and base course, two low broad windows (dark glass, warm fill), centred two-leaf burgundy door with gold panes, "DOUBLE R" sign on dark forest board with cream border above the door, one small roadside "RR" pole sign. Keep the landmark's tile footprint, door tile 42,20, `visualBounds` and camera focus unchanged.
- Sheriff block inside `townHeroAccents` (~3806–3844): charcoal-green shallow roof, sage board siding with oak corner boards, stone base course, two low windows, oak two-leaf door centred on 12,20, "SHERIFF" sign on forest board with cream border, slim flagpole at the right end. Match `artifacts/sheriffs-station-exterior-v01/final.png`. Footprint/door/bounds unchanged.

Both frontages are drawn pre-grade (they get the dusk cast like everything else); their lit parts come from the overlay in B.

## D. Strip grounding (only if captures show it missing)

Benches, planters, cars, sign posts on rows 13–24 receive a 1 px contact band on their south edge if they lack one. Nothing else on the map changes.

## Tests

- New `test/town-dusk.js`: grade is deterministic and memoised, never outputs black, maps the day cream/grass/road samples into the target ranges above, emissive rects stay inside their landmark `visualBounds`, overlay draws nothing outside `town`.
- Existing visual gate tests that assert daytime town colours (`test/gold-tone-gates.js`, `test/r69-reference-gates.js`, `test/graphic-pass-contract.js`, `test/town-route-captures.js`): report which assertions break and why; update only the assertions that encode the day palette, keep structural ones. Do not delete tests.
- `node test/smoke.js`, `node test/walkthrough.js`, `node test/genmaps.js` unchanged.

## Evidence

Native captures at town (12,21) up, (42,21) up, (27,15) up, (20,24) up before/after under `artifacts/town-cohesion-v01/`. The review compares them beside `artifacts/double-r-exterior-v02/native-clean.png` and the sheriff exterior native result.
