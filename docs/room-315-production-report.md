# Room 315 — production environment + narrative integration report

Great Northern, Room 315: the wake-up destination at the end of Act 1. Date: 2026-09-09. Working tree only (not committed, not deployed). Vault synced (§7). Artifacts: `artifacts/room-315-v01/`.

**Result: pass with notes.** Room 315 is a native-authored 16×12 interior with its own identity (walnut, slate-teal, one amber lamp, cold dawn), integrated as the real destination of the Red Room exit, connected to the existing hotel lobby, registered in the World catalog, validated in node and in a real Chrome playthrough with zero console errors. World Engine, Character Life, Ambient Life and the renderer are untouched.

## 1. Scene intent

Cooper wakes at 6:20 after the Red Room dream, dressed, in a real place. The room must say *this is real* (hotel civility, order, morning) and *the dream still matters* (the lamp he fell asleep under is still on; the mirror over the dresser is the Giant's future doorway; the dawn is cold at the window). Full intent: `artifacts/room-315-v01/intent.md`.

Authored state: **dawn, 6:20** — one static state, distinct from the Town's early dusk and justified by the beat (bible amendment in `docs/world-visual-bible-v0.1.md` §0). Two light roles: a cool dawn plane from the north window; one warm tungsten pool from the bedside lamp, the only warm source in the room.

## 2. Concept summary

Golden Concept `artifacts/room-315-v01/concept.png`, one generation from `prompt.txt` with two strict references (Double R interior Golden for finish/scale, Sheriff's Station native Golden for camera/wall height/player). Accepted with notes: focal hierarchy (bed + lit lamp → window → desk/recorder, dresser/mirror → luggage stand), two light roles, lodge identity through two details only (blanket stripe, brass 315 plate). Concept-only elements dropped for native: perspective side walls, bathroom door, mirror on the east wall (moved to the north wall face above the dresser), tissue box, soft carpet shading, pink dawn band.

## 3. Native implementation summary

| File | Role |
|---|---|
| `js/room-315-art.js` | painter: palette, `definitions[]` (bed 3×3 tiles, bedside table, desk, dresser, luggage stand) with bounds/shadow/footY, `draw` (architecture, shadows, player contact, props), `foreground` depth bands |
| `js/room-315-scene.js` | footprints → authored rows, throw guard against `js/maps.js`, scoped hook install (tile/structures/foreground/palette) |
| `js/room-315-location-data.js` | LocationConnection `great-northern-room-315-hall`: room `[7,11]` ⇄ lobby `[14,1]`, spawns `(7,10) up` / `(14,2) down` |
| `js/room-315-production.js` | install order scene → connection; no EnvironmentReactions |
| `js/maps.js` | new record `room_315` (rows, `interact`, `onEnter` wake monologue once); `hotel_gn` row 1 becomes the corridor with the room door; Red Room door `8,11` → `room_315 (2,6) down` |

Tile plan: north wall face rows 0–2 (headboard, lit lamp on the wall, framed print, window with curtains, oval mirror), floor rows 3–10, south wall row 11 with the single-leaf hall door at tile 7. Wake spawn (2,6) at the foot of the bed facing down. Five polish rounds (`native-pass` → `native-polished4`), captures at native and 5× in the artifact folder; **Native Golden = `native-golden.png`** (`README.md` there records each round and the verdict).

## 4. Major parity decisions

- **Bed is the focal object**: rebuilt in round 4 after the first native read as a wardrobe over a teal box — headboard cut to 18 px, two pillows, linen turn-down, quilt at +45 luma over the carpet (test gate ≥ +18), walnut frame rim, lodge blanket with the three-triangle stripe.
- **One warm pool**: lamp shade > table top > pillow edge > three olive-teal carpet steps hugging the table foot and bed edge (warm on teal is olive, not mustard).
- **Dawn as spill, not rug**: bright rectangle under the window plus a dimmer second step within ~6 luma of the carpet with mullion lines continuing — chosen over adding a prop to fill the lower half.
- **Mirror on the north wall**: side walls have no face in this camera; the oval mirror sits above the dresser, where the interact tile is.
- **Restraint**: eight readable objects, no bathroom door, no tissue box, no second warm source, window kept cool.

## 5. Narrative integration changes

- Red Room exit now lands in Room 315 at the foot of the bed; `hotel_risveglio` fires once there (`intro_hotel`), moved off the lobby map. Page 1 split into two screens ("Diane, 6:20. Stanza 315, Great Northern." / "Ho dormito vestito, con la lampada accesa.") so the lamp is in the text and no orphan line remains.
- Mirror interact `specchio315` (cascade: first look → Giant apparition after `jacques_morto` → after-state) moved to the dresser tile `(13,3)`; the mirror gets a sparkle until read.
- Two optional inspects, Cooper voice, with `again` echoes: bed `letto_315` (slept on the covers, "un minuto… sette ore e un sogno") and desk `scrivania_315` (recorder half-tape, blank notebook page: the name never got written).
- **Bug found only in the browser**: `js/narrative-finale-production.js` restored the dream exit to the legacy `hotel_gn (14,2)` literal on every new game, sending the player to the lobby instead of Room 315. `restoreDreamExit` now remembers the canonical map door before the finale reroutes it to the woods, and restores that (fallback `room_315`). Regression check in `test/room-315-location.js`. Cache-busted `?v=14`.
- Objective ladder unchanged ("Parla con Ronette in ospedale e James al diner."); Ben Horne/Audrey stay in the lobby.

## 6. World registration / connection result

Location `great-northern` registered with environments `room-315` (`room_315`, native) and `lobby` (`hotel_gn`, legacy glyph map, marked as such in the catalog). The lobby was registered because the World invariant requires both endpoints of a connection to be catalogued and the lobby is pre-existing playable content; it is not claimed as finished native content. Connection `great-northern-room-315-hall` compiles to doors on both maps through the existing `LocationConnections` installer. The Town → hotel door and the lobby → Town door are unchanged.

## 7. Validation summary

| Check | Result |
|---|---|
| `test/smoke.js` / `test/walkthrough.js` | 455 checks ✔ / 94 acquisitions, finale reached ✔ |
| `test/room-315-native.js` (new) | production hooks, authored geometry, footprint parity, collision, keyboard routes, integer pixels, depth intervals, dawn plane vs lamp pool, quilt ≥ carpet + 18 |
| `test/room-315-location.js` (new) | redroom wake spawn + onEnter once, hall round trip, no arrival bounce, lobby → Town, save round-trip, finale dream-exit restore |
| `interior-zoning-reachability`, `world-engine-v0.1-catalog`, `location-traversal`, `narrative-slice-01`, `retro-production` | pass |
| craft gates `interaction-voice`, `dialogue-craft-regression` (193), `narrative-repair-contract` (36), `environmental-interactions` (96) | pass |
| Real Chrome playthrough (`index.html`, new game, Red Room → Room 315) | wake monologue fires over the room; bed/desk/mirror inspects and `again` echoes fire; hall round trip; save lands in `room_315`; **0 console errors** |
| Coldstage | **not run** (user instruction "do not use coldstage anymore for now"); no baseline or scenario touched |
| Pre-existing failures | `sprite-gates.js`, `portrait-evidence-parity.js` unchanged |
| Vault canonical sync | repo → vault for the 10 changed/new runtime files + test mirror; `check-canonical-sync` 90/90 equal, `test/canonical-sync.js` pass |

Evidence: `artifacts/room-315-v01/native-golden{,-5x,-door,-door-5x}.png`, `wake-beat-ingame.jpg` (in-game with dialogue), `same-world-sheet.png`.

## 8. Same-world review notes

Sheet: Sheriff's Station interior · Room 315 · Double R (`same-world-sheet.png`). Same 48 px wall face, same player and cluster scale, same contact-band grounding, walnut family continuous with the station's oak. Identity contrast holds: the station's cool green institutional plane, the diner's gold hospitality, Room 315's slate-teal and cold dawn with one amber lamp. Density order: diner > station > Room 315 — the room is the calmest tier by design. Nothing reads AI-generated at native; the concept's perspective and grain were not imported.

## 9. Known limitations

- The hotel lobby (`hotel_gn`) remains the legacy day-lit glyph map; the corridor door into the room is a glyph door. It is registered as `lobby` but is not native quality.
- The mirror sparkle draws over the dresser front (engine sparkle placement on the interact tile).
- The wall-face lamp pool is a soft vertical band; one step harder would be better. Not authorised in this milestone.
- Wake presentation: the player stands at the foot of the bed; there is no lying-in-bed frame (would need new cast art, out of scope).
- Coldstage runtime/pixel coverage for the new map does not exist yet (no scenario, no baseline), by instruction.
- Working tree uncommitted, not deployed.

## 10. Recommended next milestone

**Great Northern lobby as a native environment** (the other half of the location already registered): concept → native for `hotel_gn` at the same dawn state, keeping Ben Horne, Audrey, the Town door and the corridor door to Room 315; then re-open Coldstage with scoped review records for Room 315 and the lobby when the user lifts the Coldstage hold. Not implemented here.

## Production play path

Serve the repo root, open `index.html`, press **N**. Act 1 spine as in `docs/narrative-vertical-slice-01-report.md`; at the woods gate (3 clues) → Red Room → talk to Laura → exit between the curtains at `8,11` → **Room 315** (wake monologue) → inspect bed (face up from the spawn), desk (`8,4` up), mirror (`13,4` up) → hall door `7,11` → lobby corridor → lobby → Town. Headless truth: `node test/native-shot.js --map=room_315 --x=2 --y=6 --dir=down --out=...` (the wake dialogue covers the frame unless the harness URL carries `flags=intro_hotel`, as `test/room-315-native.js` does for its reviewed capture).
