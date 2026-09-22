# tp-exteriors-v01: Twin Peaks exterior kit

This is the first Twin Peaks art kit for the shared engine (`engine/ember-ground.js`, `ember-worldmap.js`, `ember-worldview.js`). It uses the same manifest, tile set and object schema as the Living Town kit (`living-town/proto/town-kit/`), so the engine loads it unchanged.

## Sources

The kit comes from two approved concepts, both brought to native pixels (256x192, 5.66 source px per native px) with one shared 64-colour palette:

- `artifacts/double-r-exterior-v01/double-r-exterior-v01-final.png` becomes `source/double-r-plate.png`
- `artifacts/sheriffs-station-exterior-v01/concept-raw.png` becomes `source/sheriff-plate.png`

At that scale the doors come out 30-38 px tall, which fits the production 24 px cast without resizing. The sign lettering does not survive the downscale, so `source/build-plates.py` re-letters DOUBLE R, RR DINER and SHERIFF with native glyphs.

## Rebuild

```
sh build-all.sh <python with Pillow+numpy>     # plates, ground, objects, grades
node maps/compose.js                            # maps/main-street.json
node ../../../test/kit-exteriors.js             # Node check
sh evidence/shoot.sh 8793 <python>              # page captures (serve the worktree root on 8793 first)
```

`engine/tools/grade-kit.py` (the shared grader) makes the day and night grades. `grade-fix.py` then regrades surfaces that only look warm, such as the cream siding and painted lines, so they read as unlit. The day grade of `light-spill` is left empty.

## What exists

| Part | Contents |
|---|---|
| `ground/` | `ground.json` + `ground.png` (382 cells). Materials: `asphalt`, `concrete`, `grass` and `forest` (forest is not walkable). All are coursed with L/R edge codes, and no feature crosses a horizontal edge, so any arrangement is seamless. Rules: the kerb is a `fringe` of concrete against asphalt (lip, face and shadow on the road side), plus a grass-lip `fringe` on asphalt and concrete, and grass creeping onto forest. There is no separate kerb material. |
| `objects/` | Cut from the plates: `double-r` (door, open-door frame, windows), `sheriff-station` (same), `rr-sign`, `planter-l`/`-r`, `bin`, `bench`, `shrub-1..4`, `flagpole`, `wheel-stop`, `stall-line`, `asphalt-patch-1..4`, `light-spill`, `wall-lamp`. Drawn in the concepts' palette and manner: `pine-s/m/m2/l/l2/xl`, `street-lamp`, `fence` + `fence-post`, `bush-1/2`, `road-dash`, `backdrop` (dusk sky and three rows of dark pines). |
| `kit.json` | Same fields as Living Town's. Both buildings are `alwaysLit`, so their windows light the cast at night. |
| `maps/main-street.json` | 44x22 tiles: the Double R, a verge with the RR sign and pines, the station with bench, shrubs, flagpole and fence; the sidewalk and kerb, the lots, the road, the far walk, lamps and forest. Places: `double_r` and `sheriff` (the doors) and the spots `bench`, `rr_sign`, `diner_lot`, `station_lot`, `far_walk`, `fence`. `cast` lists who walks where. |
| `maps/street-cast.js` | The cast's day as a pure function of the minute, built on engine routes. The page and the Node check both use it. |
| `test/kit-exteriors.html` | Overview and a 256x192 follow camera. Cooper, Truman, Lucy, Andy and Hawk are drawn with `GAME.Sprites.drawChar` from the default cast sheet and relit by `EMBER.WorldView.relight`. Doors open with `EMBER.WorldMap.doorOpen`. Params: `start`, `mode`, `paused`, `debug`, `focus`, `rate`, `ppm`, `capture=<n>` and `door=<place>&dir=in\|out`, which jumps to the next time someone uses that door. |

Objects that stand against a building (planters, bench, shrubs, flagpole) are aligned to that building's tile grid, so `compose.js` places them exactly where the concept draws them. They are depth-sorted at their own ground line.

## Evidence (`evidence/`, 2x)

- `overview-dusk/day/night.png` and `overview-debug.png` (collision, doors, spots, live routes)
- `follow-double-r-out-dusk`, `-in-dusk`, `-in-night`, `follow-sheriff-out-dusk`, `-in-dusk` and `-out-day`, each at a door as someone comes or goes
- `compare-double-r-<grade>.png` and `compare-sheriff-<grade>.png`: the concept plate on the left, the kit on the street on the right, same frame
- `objects-sheet.png` and `ground-field(-day/-night).png`, a test field laid by the engine's own picker

## Known gaps

- **Open door.** The open door is lit by the engine's generic doorway (a flat warm panel in Living Town's colours) over one leaf. A Twin Peaks doorway colour would need a kit hook in `ember-worldview.js`.
- **Windows.** `lit` is kept empty on purpose. The engine's lit-window pane would paint over the concepts' interiors. Window light for relighting comes from `alwaysLit`.
- **Drawn objects.** Pines, the street lamp, the fence and the bushes are drawn, not cut, because the concepts crop every pine and show no lamp or fence run. They match the palette and manner but not the exact hand of the concept.
- **Diner lot.** The diner concept's warm tan sidewalk and slanted stall lines give way to the shared grey walk and straight lines, so the two lots read as one street.
- **Pixel-level artefacts.** The downscale leaves a few one-pixel artefacts, such as the diner's roof rim at top left and the handles on the diner door.
- **Backdrop at day.** The backdrop sky stays dusky blue at day.
- **Ground materials.** No driveway or crosswalk tiles yet, and no grass-to-forest transition beyond the creep fringe.
