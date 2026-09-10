# Great Northern — Room 315 v01

Milestone: Room 315 production environment + narrative integration (2026-09-09). Intent: `intent.md`. Concept prompt: `prompt.txt`. Native brief: `native-translation-brief.md`. Wiring/narrative spec: `integration-spec.md`.

## Golden Concept (`concept.png` = `concept-raw.png`)

Generated once from `prompt.txt` with two strict references (Double R interior Golden for finish/scale, Sheriff's Station native Golden for camera/wall height/player). One composition, iteration stopped at 1.

Lead art-direction review — **accepted as Golden Concept, with notes**:
- Focal hierarchy correct: bed with the still-lit brass lamp reads first, the cold window second, desk/recorder and dresser/mirror third, luggage stand last. The carpet is the quietest surface.
- Two light roles exactly as intended: one warm tungsten pool on table, pillows and carpet; a cool dawn rectangle on the carpet under the window. No second warm source.
- Identity: walnut wainscot and frames, calm pine upper wall, slate-teal carpet with border band, lodge blanket with one geometric stripe, brass "315" plate, black telephone, tape recorder and open notebook. Same game as the references: pixel cluster scale, player sprite, 48 px wall face, contact shadows.
- Distinct from Double R (no burgundy/cream/checker) and the Sheriff's Station (no green institutional plane, no steel).

Concept-only, not to be translated: perspective side walls, the bathroom door and the mirror on the east wall (native puts the oval mirror on the north wall face above the dresser, because side walls have no face in the native camera), the tissue box, the soft carpet shading, the pink dawn band (native keeps the window cool so the lamp stays the only warm pool), sheet texture. Bed scale: three tiles wide in native (the concept's double bed), bedside table at tile 4.

## Native translation and parity polish

Runtime: `js/room-315-art.js` (painter), `js/room-315-scene.js` (footprints → rows, throw guard against `js/maps.js`), `js/room-315-location-data.js`, `js/room-315-production.js`. Map id `room_315`, 16×12.

- `native-pass.png`: first pass from the brief.
- `native-polished.png` (builder rounds 1–2): stepped conifers, warm wall pool painted through the board lines, recessed door casing, bedding dropped to linen, pillow gap, tighter carpet pool.
- `native-polished2.png` (builder round 3): bedside cluster separated (shade / telephone / brass base), print and curtain rod moved clear of the shade, blanket ochre desaturated.
- `native-polished3.png` (lead round 4): **bed rebuilt as the focal object** — 18 px headboard, two cream pillows, linen turn-down, quilt raised to +45 luma over the carpet (gate ≥ +18 in `test/room-315-native.js`), walnut frame rim, lodge blanket with the three-triangle stripe; lamp pool anchored to table foot + bed edge; dawn plane extended in two steps; carpet field visible (5.7 luma spread).
- `native-polished4.png` (lead round 5): carpet pool retinted olive (warm on teal, not mustard) and hugged into an L; dim dawn step brought within 6 luma of the carpet so it reads as spill, not a rug.

### Golden freeze

**`native-golden.png` (= `native-polished4.png`; `native-golden-door.png` from the hall spawn) is the Room 315 Native Golden Reference.** Lead art-direction verdict at native, 5×, in-game with the player and the wake dialogue (`wake-beat-ingame.jpg`), and on `same-world-sheet.png` (station interior · Room 315 · Double R): **pass with notes**.

- Focal hierarchy: bed + lit lamp → cold window → desk/recorder, dresser/mirror → luggage stand. Correct.
- Two light roles exactly as intended, one warm source only; lit window is the brightest band; dawn spill and lamp pool are hard-stepped.
- Materials: walnut rims/joints, pine board lines, carpet two-value field + border, bedding planes with creases, curtain folds, cold glass with stepped pines and reflections. Contact bands under every prop and the player.
- Same world: 48 px wall face, identical player and cluster scale as the station and the diner; walnut family continuous with the station oak; identity distinct (slate-teal + walnut + amber, cold dawn vs the station's cool green plane and the diner's gold).
- Notes: the lower half is the largest calm plane of the three interiors — deliberate (density budget spent on eight objects), and the widened dawn spill is the fix chosen over adding a prop; the in-game sparkle on the mirror tile draws over the dresser front (engine sparkle placement, not art); the wall-face lamp pool is a soft vertical band that could be one step harder. No further polish authorised in this milestone.

Ambient/reactive review: **stillness accepted**. The lit lamp is carried by static art; no telephone/clock motion, no door reaction (the hall door is a single leaf with no arrival choreography needed). Character Life and Ambient Life untouched.
