# Town places v01

**Street status: visual bar not passed after four independent critic rounds.**
Technical gates pass. The conditional park/home object review was not started.

Graphics for the park, Via del Ponte and five homes, drawn through the production
interior kit at native 256×192. Geometry and collision remain owned by
`living-town/js/lt-world.js`. This package reads rows; it never changes the world.

The production view already uses this package. It checks `LT.World.blockedCells`
against `LT.TownPlaces.claims` and falls back to the cell painter if a place has
an uncovered solid cell. The street painter covers all 94 solid cells of the street as it is in
world `e41937ba`: the north fronts, the park boundary, and on the near side the
garden walls and fences (`f`), front gardens and the eaves of the south houses.

The near side was first painted as roofs with a door portal standing on the
pavement (world `e6451950`). Two independent fresh critics read a person at those
doors as standing on a roof, and the same strict critic scored that version
8 / 7 / 6 (same game / recognisability / walkability). The map was changed — the
south houses stand behind front gardens — and the same critic, same prompt,
scored this one 8 / 8 / 7. The bar is 9 each, so it is still not accepted. What
remains, in the critic's words: the eave strip at the foot of the frame does not
say "house"; the cap colours that tell the south homes apart are specks at
native size and collapse at night; south-side figures have no contact shadow;
the street is flat and prop-less next to the café; the park reads as a dark void.

## API and construction

```js
LT.TownPlaces.draw(g, locationId, rows, camX, camY, opts);
LT.TownPlaces.drawForeground(g, locationId, rows, camX, camY, footMin, footMax, opts);
```

Both calls return `false` for an unsupported location, absent rows or absent kit.
World `(0,0)` is drawn at `(-camX,-camY)`; camera values are rounded to pixels.
`opts` accepts `{ kit, palette, minute }`. The default kit is
`GAME.Retro2D.interiorKit`. Materials register on first use.

`handles`, `materialFor`, `plan` and `claims` are pure queries. Every planned
solid cell must have exactly one owner. Doorways, gateways and chairs are the
only permitted claims on walkable cells. Pixels use the kit's rectangles,
windows, contact shadows and other existing primitives. No external images,
resampling, second renderer, lettering, resident identifiers or random draws.

`minute` controls lanterns and window illumination only. `LT.DayLight` applies
the final frame tint, after actors. This package does not alter it.

## Via del Ponte

The `H` and `D` rows determine the two building bands and their openings. The
first and last all-paving rows are pavements (3 and 7); only the rows between
them are carriageway (4–6). Their kerbs and different stone sizes remain visible.
The old grate slabs are gone.

The north side has 48px plaster walls, an eave above them, cream-framed windows,
a darker base and a two-pixel pavement shadow. The café uses its production teal,
a striped awning and a cup-and-saucer pictogram without lettering. The south side
shows slate roof slopes, chimneys, rooflights and open entrances facing the pavement.
The park entrance is an open iron gate within a stone garden boundary with trees.

| Street door run | Destination | Accent |
|---|---|---|
| north 3–4 | `flat_a` | slate blue |
| north 9–10 | `flat_c` | olive |
| north 15–16 | café | production teal |
| south 1–2 | `flat_b` | plum |
| south 8–9 | park | stone and iron |
| south 13–14 | `flat_e` | sea green |
| south 17–18 | `flat_d` | terracotta |

The destination sequence assigns materials only; door coordinates come from
rows. A regression test compares every assignment with `World.STREET_PORTALS`,
including the park portal which lies in the opening itself.

## Depth

Pieces carry their floor depth, `(y + h) * 16`. `drawForeground` paints only the
pieces within the requested depth band, as used by `Ember.Tilemap.paintDepthBands`.
North doors repaint piers, lintels and the café awning; they never repaint a door leaf over an actor. The near houses face north: their open door thresholds align with the pavement at the north edge of D. Their lintels and roof surfaces stay behind approaching actors; only the outer reveals use the foreground band. The D recesses are cut out of the roofs and painted as floor, including when occupied.

Trees and gate piers use the foreground pass. Beds remain background because a
sleeping actor lies on them. Chairs remain background because their cells are
walkable. Home furniture and windows otherwise keep their existing painters.

## Evidence and commands

```sh
node living-town/content/town-places-v01/test/town-places.js
node living-town/content/town-places-v01/tools/capture-gallery.js
node living-town/content/town-places-v01/tools/capture-gallery.js --check
node living-town/test/run-all.js
```

Use Node **24.16.0** for the general suite in this checkout. The installed Node
26.5.0 uses a different zlib and fails the existing byte-for-byte inhabitant-atlas
check: regenerated PNG pixels and dimensions match, but compressed bytes differ.
Node 24.16.0 passes without changing that atlas or any test outside this package.

Capture starts its own HTTP server and Chrome, acquiring `/tmp/lt-chrome.lock`
first. `--check` writes nothing and compares all image bytes plus the manifest.
The gallery uses the production kit, atlas, depth bands and daylight. Its actors
are fixed preview placements, not a simulation demonstration. Every placement is
checked against collision; the former `flat_e` preview occupant on its table was
moved to that home's walkable spawn.

`images/02-*` are native scenes; `03-*` are nearest-neighbour inspection views;
`04-*` compare hours; `05-*` overlay collision. `06-*` show west/east street views,
doorway occlusion and pavement approaches. These native views cover all seven
entrances across the wider 320px world. The manifest records their camera focus
and people placements.

Reference: `artifacts/living-town-poses/03-noon-cafe.png` and
`05-evening-cafe.png`. Critic records, the fixed evaluation contract, baseline,
round captures and verification logs live in `.gauntlet/street-fronts/`.
See `.gauntlet/street-fronts/progress.md` for the current verdict and remaining gaps.

## Limits

- Geometry, world fingerprint and save migration are unchanged.
- Door piers and lintels project north of their door cells. This is
  the existing doorway exception, not an extra solid collision footprint.
- The south roofs are a compact exterior view, not enterable rooms or new map
  cells. Park foliage stands behind its boundary, not on an added walking path.
- House identity uses interior accents; there is no lettering or address label.
- Night contrast is inherited from `LT.DayLight`; no private tint is added.
- The page's main suite still omits this package's test, per the existing
  temporary exclusion. Re-enabling that gate requires an owner change outside
  this task's write fence. The package test runs explicitly in this delivery.
- The original park/home scale limits remain: one-cell benches and tables,
  two-cell beds, a compact pond, and sparse furniture constrained by their rows.
