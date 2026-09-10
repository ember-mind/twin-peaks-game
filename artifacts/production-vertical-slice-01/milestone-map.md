# Production Vertical Slice 01 — milestone map (Phase 0 audit, 2026-09-09)

## DONE (proven, do not redesign)
- World Engine v0.1: `js/world-engine.js`, catalog `js/world-catalog.js`, doc `docs/world-engine-v0.1.md`.
- LocationConnections: `js/location-connections.js` (paired endpoints, multi-trigger, non-trigger spawn, door gates, departure reaction).
- Ambient Life + Environment Reactions: `docs/ambient-life.md`; Double R approved; Sheriff interior has 5 restrained elements, no door reaction.
- Character Life v0.1: `js/character-activity.js`, Truman profile, evidence `artifacts/character-life-v01/` (pass-with-notes, 94% stillness).
- Double R Interior Golden: `artifacts/diner-final-art/final.png`. Double R Exterior Native Reference: `artifacts/double-r-exterior-v02/native-clean.png` (dusk, 256×192).
- Sheriff's Station Golden Concept: `artifacts/sheriffs-station-main-interior-v01/final.png`. Native Golden after parity polish: `artifacts/sheriffs-station-main-interior-v021/native-after.png` (pass-with-notes).
- Production framebuffer 256×192 (`js/main.js:237`), 16 px grid, 24 px HeartGold-derived cast atlas.

## IN PROGRESS (unfinished when this milestone started)
- Character Population Pass 01 (`artifacts/station-population-v01/`, started 08:27 today): sheet `assets/sprites/station-population-v01.png` (192×24) built; `js/station-population-scenes.js` registers Truman/Lucy/Andy profiles; Lucy placed at 2,6; **Andy not placed**; `index.html` loads BOTH `character-life-scenes.js` and `station-population-scenes.js` (last registration wins); no README/verdict; `test/coldstage-config.js` fails (`stationPopulation` scenario missing).

## MISSING FOR VERTICAL SLICE
- Sheriff's Station native interior (`sheriffs_station_main_interior`) is **unreachable from Town**: town door `12,20` still targets legacy 10×9 map `sheriff` (`js/maps.js:118`), which carries the narrative cast (glue `NPCS.sheriff`) and is referenced by missions M4/M6/M8/M9 + finale bridge by map id `sheriff`.
- No Sheriff's Station exterior (no concept, no scene, no art).
- No Town ↔ Sheriff exterior ↔ interior connections; World catalog lists sheriffs-station with `connections: []`.
- **Double R exterior has no exit back to Town** (`double_r_exterior_prototype.doors` only gets the front entrance): the player is trapped after entering from town 42,20. Route "back outside → traverse Town" is impossible today.
- Town renders in a daytime olive/cream Pokémon-Gold overworld language; both native scenes are dusk full-color. Town Double R frontage (red awning, day) contradicts the native exterior (charcoal roof, cream/sage, burgundy, dusk).
- No World Visual Bible.

## KNOWN PRE-EXISTING DEBT (not fixed here unless touched)
- Native test baseline (see `baseline-tests.md`): smoke 368 checks, walkthrough 86 acquisitions; failing before any change: `canonical-sync.js` (4 unaudited divergences), `coldstage-config.js` (population pass), `double-r-location.js` standalone (browser-only), `portrait-evidence-parity.js` (byte drift), `sprite-gates.js` (missing cooper authored matrix).
- Working tree carries a large uncommitted prior session (cast R102E etc.).
- Hash-freeze tests per pass (`artifacts/*/validation/frozen-before.json`) ossify shared files (engine.js, world-catalog.js); each later legitimate change must re-receipt.
- Town cemetery landmark at 48,21 renders as a black slab in the retro town capture (outside slice art scope, recorded).

## DECISIONS (evidence-based, recorded instead of asked)
- D1 Slice world state: **early dusk** (from Double R Exterior Native Reference). Town shifts from day to dusk with minimal authored palette corrections; no time system.
- D2 The native interior becomes canonical map id `sheriff` (narrative/tests keyed on it: 9 mission nodes, finale bridge, 15 tests). Legacy 10×9 geometry replaced; NPC records stay in `js/glue.js` with new positions.
- D3 Hawk omitted from the station in this slice (not narratively required at the station; field deputy). Truman 10,4 / Lucy 2,6 / Andy 10,7 / Leland (act 5 only) 8,5.
- D4 Town ↔ exterior lot connections for both Sheriff and Double R use existing LocationConnections (bottom-row exit triggers, non-trigger spawns). No new routing primitive.
- D5 Town cohesion pass bounded to the civic strip (rows 13–25, cols 5–50) plus a town-wide dusk palette (a map cannot be half dusk).
