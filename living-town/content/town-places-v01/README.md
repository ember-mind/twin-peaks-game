# Town places v01

The park, the street and the five homes, painted by the production interior kit
in Café Meridiana's own idiom. Graphics only. Nothing in here simulates,
decides, schedules, stores or remembers anything.

**Nothing is wired.** `lt-view.js` still paints these places with the
placeholder cell painter. What someone has to change to switch them over is at
the bottom, and it is **not implemented**.

**The collision truth is the location's `rows` in `living-town/js/lt-world.js`,
and this package does not touch it.** Every solid cell
(`#` `T` `w` `B` `K` `G` `C` `t` `b` `=`) is painted as the thing it is, at its
own tile. Every walkable cell is painted as ground. `test/town-places.js` holds
the two in agreement in both directions, the way `living-town/test/cafe-scene.js`
does for the café.

## Drawing a place

```js
LT.TownPlaces.draw(g, locationId, rows, camX, camY, opts);
LT.TownPlaces.drawForeground(g, locationId, rows, camX, camY, footMin, footMax, opts);
```

| argument | what it is |
|---|---|
| `g` | a 2D context, the native 256×192 one |
| `locationId` | `park`, `street`, or any `flat_*` |
| `rows` | that location's `rows`, read, never written |
| `camX`, `camY` | **exactly what the view passes `GAME.sprites.drawStructures`**: world (0,0) lands at `(-camX, -camY)`. Both are rounded to whole pixels |
| `footMin`, `footMax` | the depth band, in world pixels, from `EMBER.Tilemap.paintDepthBands` |
| `opts` | `{ kit, palette, minute }`, all optional |

**Both return `false` when they cannot draw that place** — an unknown id, no
rows, no kit — so the caller falls back to the placeholder painter in the same
frame instead of showing a hole. Nothing else in the API can fail.

`opts.kit` defaults to `GAME.Retro2D.interiorKit`; `opts.palette` overrides the
material. `opts.minute` is the minute of the simulated day, and the **only**
thing it changes is whether a lantern is burning and whether a window shows a
lit sky. Day and night colour is `LT.DayLight`'s job, applied to the finished
frame after the people; this package never tints anything.

Four more calls, all pure:

| call | what it answers |
|---|---|
| `LT.TownPlaces.handles(locationId)` | whether `draw` would paint it |
| `LT.TownPlaces.materialFor(locationId)` | the kit material id it paints in |
| `LT.TownPlaces.plan(locationId, rows)` | the pieces, machine-readable |
| `LT.TownPlaces.claims(locationId, rows)` | cell → the kind of piece painted there |

The materials install themselves onto the first kit that draws with them, so
there is no registration step and no load order to get right.

## The three places

| place | ids | material | drawn from |
|---|---|---|---|
| park | `park` | `lt_park` | grass, a pond with a shore, trees, benches, a gateway |
| street | `street` | `lt_street` | a carriageway with kerbs, footpaths, verges, house doorways, a gateway |
| home | `flat_a` … `flat_e` | `lt_home_a` … `lt_home_e` | one painter, five rooms |

**There is one home painter.** What makes a home different is its own `rows` —
where the bed lies, which side the kitchen is on, where the window is, where the
door is, how much floor is left — and one accent colour read off the location
id. Nothing about a room is read from, or varies with, whoever lives in it: the
word `resident` does not appear in the source, and a test asserts that.

| id | accent |
|---|---|
| `flat_a` | slate blue |
| `flat_b` | plum |
| `flat_c` | olive |
| `flat_d` | terracotta |
| `flat_e` | sea green |

The accent is the quilt, the rug border, the front door, the curtains and the
crockery. Everything else — plaster, oak boards, the dado, the
kitchen — is shared, which is what keeps five rooms one town.

### What the rows are read for

Nothing in this package is placed by hand. Each shape comes off `rows`:

| in `rows` | painted as | how it is decided |
|---|---|---|
| `T` | a tree | trunk in the cell, crown above it, in the foreground pass |
| `w` | a pond | the run of `w` cells; the waterline is inset 3–8 px from each edge that has a grass neighbour and the shore runs on past the cell, so the pond's outline is not its cells' outline |
| `b` | a park bench | a narrow backrest, a gap the ground shows through, a lit seat; it faces the pond, which is found by taking the centroid of the `w` cells |
| `B` | a bed | the block's shape: two cells across is a bed lying across, two cells down is a bed lying down |
| `K` | a kitchen run | one worktop across the block, sink in the top cell, hob below; a splashback only where the cell above is really `#` |
| `G` | a guitar | on a stand: a wide lower bout, a waist, a short neck up into the cell above |
| `t` | a table | with a cloth and a cup on it |
| `c` | a chair | **walkable**: drawn low, with floor all round it |
| `=` | a window | wall brought down to meet it, curtains, a sill |
| `#` | a wall | back wall with a dado, rising off the top of the map; side walls in the same plaster and dado; a cutaway front wall with the door in it |
| `D` | a door or a gateway | paving on its south side makes it a house door; anything else makes it a gateway |
| `-` | paving | a row that is paving edge to edge is a carriageway; anything else is a footpath |
| `,` | grass | two greens in large patches, mown bands, tufts, the odd clump of flowers — **except** on the street, where the row against the carriageway and the row the house doors stand on are painted as the pavement a street has |
| `-` on the park's gateway, `,` on its approach | a gravel path | worn out of the gate, walkable, never paving |

## Depth

A piece carries a `depth`: its own floor line, `(y + h) * 16`. `drawForeground`
paints the pieces whose depth falls in the band it was given, exactly the way
`lt-cafe-scene.js` `foreground` does, so a tree crown covers whoever is standing
behind it and not whoever is in front.

Two kinds are deliberately **not** foreground pieces:

- **the bed**, because the sleeping pose draws a person lying on the bed's own
  tile. A bed repainted in that band would paint over the sleeper. Nobody can
  stand north of a bed anyway — the rows put a wall there.
- **the chair**, because its cell is walkable and a chair is where somebody
  stands to sit down. Repainting it would paint over the person using it.

## Files

| path | what it is |
|---|---|
| `lt-town-places.js` | the only source: the palettes, the plan, the painters |
| `town-places.manifest.json` | the plan, machine-readable, written by the capture tool |
| `gallery.html` | the preview, drawn by the real renderer |
| `test/town-places.js` | the Node checks: rows agreement, purity, depth, lettering |
| `tools/capture-gallery.js` | drives the gallery in headless Chrome and writes `images/` and the manifest |
| `images/` | frames captured off the renderer |

There is no sheet and no asset: every pixel is a `kit.rect` call at paint time,
so nothing can drift out of date with the kit or the rows.

## Commands

Serve the checkout over HTTP, then:

```
# the gallery
open http://localhost:<port>/living-town/content/town-places-v01/gallery.html

# rows agreement, purity, depth, lettering — no browser
node living-town/content/town-places-v01/test/town-places.js

# regenerate every captured image and the manifest
node living-town/content/town-places-v01/tools/capture-gallery.js

# verify what is on disk is what the renderer produces now (writes nothing)
node living-town/content/town-places-v01/tools/capture-gallery.js --check
```

`--check` writes nothing and exits non-zero the moment an image or the manifest
on disk stops being what the renderer produces now. Both capture runs start
their own Chrome and their own server, and they take `/tmp/lt-chrome.lock`
themselves and wait for it, because **one Chrome driver at a time** on this
machine. The capture also fails, before writing anything, if a solid cell is
unpainted or a walkable cell is painted as furniture.

## Wiring it in — what someone else has to do

Nothing below is done.

**1. Load the file.** In `living-town/index.html`, after `lt-world.js` and
before `lt-view.js`:

```html
<script src="content/town-places-v01/lt-town-places.js"></script>
```

No init call: the materials install themselves onto the kit the first time a
place is drawn.

**2. Replace the body of `View.prototype.drawTemporaryPlace`** in
`living-town/js/lt-view.js`. Today it is an `EMBER.Tilemap.paintWindow` over
`LT.Art.drawCell`, and then `ents.forEach(drawInhabitant)`. It becomes the same
two-pass shape `drawProductionRoom` already uses:

```js
View.prototype.drawTemporaryPlace = function (g, loc, ents, cx, cy, how) {
  var self = this, TP = LT.TownPlaces;
  var mapId = (TP && TP.materialFor(loc.id)) || 'lt_temporary';
  var opts = { minute: this.sim.state.minute };
  if (TP && TP.draw(g, loc.id, loc.rows, cx, cy, opts) !== false) {
    EMBER.Tilemap.paintDepthBands(ents, TILE, function (e) {
      self.drawInhabitant(g, e, cx, cy, mapId, how);
    }, function (footY, nextFootY, afterIndex) {
      if (afterIndex < 0) return;
      TP.drawForeground(g, loc.id, loc.rows, cx, cy, footY, nextFootY, opts);
    });
  } else {
    /* unchanged: the ink fill, paintWindow over LT.Art.drawCell, ents.forEach */
  }
  this.drawActivityMarks(g, cx, cy, ents.filter(function (e) { return e.kind !== 'thing'; }));
};
```

Three things about that:

- **`cx` and `cy` are what the view already has**: `Math.round(this.camX)` and
  `Math.round(this.camY)`, the same pair it hands `drawStructures`.
- **The `afterIndex < 0` guard is the same one the café uses.** The band behind
  everybody is already painted by `draw`; repainting it would be work for
  nothing.
- **`mapId` changes what the people are drawn with.** Today the view passes the
  literal `'lt_temporary'`, which is not a registered material, so
  `GAME.Sprites.drawChar` falls back to the outdoor contact shadow and
  `LT.ActivityPoses` falls back to the café's palette. Passing
  `TP.materialFor(loc.id)` gives both the room's own material. It is a real
  improvement and it is also a visible change to how people are shadowed
  indoors, so it belongs in the same review, not smuggled in.

**3. Leave the old cell painter in place.** `draw` returning `false` is the
fallback, and it is the only thing standing between a future location this
package has never seen and a blank screen.

**4. Leave `LT.DayLight` exactly where it is.** It is applied after the whole
frame, people included, and this package draws nothing that expects to be
tinted twice.

## Limits, honestly

- **Nothing is wired.** No view calls this. The gallery places people because
  the gallery says so.
- **A doorway and a gateway rise eleven pixels into the cell above them, and
  that cell is walkable.** This is the one place where the art stands on ground
  the rows leave open, and it is deliberate: a door ten pixels high next to a
  twenty-two pixel person was read by two cold viewers as a market kiosk, not a
  door. The shape that rises is two five-pixel piers and a lintel, so most of
  the cell above still shows ground between them, and a person standing there
  is drawn behind the piers by the foreground pass. It is still an
  encroachment, and anyone who wants it gone has to give the doorways a row of
  wall cells in `lt-world.js`, which is a world change and not this package's
  to make.
- **There is no house behind a street door.** A doorway reads as a doorway; it
  does not read as the front of a building, because the rows put walkable grass
  everywhere a building would stand. The street reads as a road across open
  ground with three ways off it. Cold viewers have consistently failed the
  street on that, and the fix is in `lt-world.js`, not here.
- **There are no street lamps.** A lamp post needs a solid cell to stand on and
  the street's rows have none outside the four corner trees. The lanterns are on
  the doorways, which is where the rows allow something to stand.
- **A one-cell bench, a one-cell table and a two-cell bed are small.** A bed is
  32×16 next to a person 16×24. Everything is legible, nothing is generous.
- **The homes are sparsely furnished, and the rows are why.** Every solid cell
  is already spoken for, so anything else in a room has to be on a wall (the
  framed pictures, the shelf, the lamp) or flat on the floor (the rug, the mat,
  the light from the window). There is no armchair and no wardrobe because
  there is no cell for one. Hanging coats were tried on the side walls and cut:
  a cold viewer read them as bottles.
- **The pond is a plus sign in the rows.** The waterline is pushed 7–10 px in
  from every shore so the outline is irregular, but it is still a small pond
  with two narrow arms, because that is the shape the rows describe.
- **A person is not lit by anything here.** `kit.actorLight` is only consulted
  for a registered interior scene, and these are not registered scenes — they
  are a painter the view calls directly. Someone standing in a doorway's lantern
  glow is not warmed by it.
- **Contact shadows are the kit's three flat rows.** Outdoors, in daylight,
  nothing casts a directional shadow; the trees and the gateway have a painted
  one under them and everything else has the kit's.
- **No weather, no season, no puddles, no snow.** The grass is the same grass
  every day of the year.
- **The street's pavement is painted on cells the rows call grass.** The row
  on each side of the carriageway, and the row the house doors stand on, are
  paved. Those cells are walkable in the rows and they are walkable in the art,
  so the collision agreement is untouched — but the ground material is this
  package's reading, not the world's legend. A road with nothing but lawn
  either side was read by two cold viewers as a lane across a field.
- **Past the last row the ground is closed undergrowth.** Outdoors, the cells
  the camera never lets anybody reach are painted as dark scrub so the place has
  an edge. It is a painted boundary, not a collision one: nothing about it is
  read by anything.
- **`flat_e` is the weakest room.** It is eight cells by seven, and its bed,
  window and kitchen are in one corner with a rug filling much of what is left.
  Two cold viewers called it the worst of the five. Nothing in the art fixes
  that; it is the size of the room.
- **The `=` window is drawn as a window in the back wall even though the rows
  put it on a floor row.** The wall is brought down over that cell to meet it.
  The cell is solid in the rows, so nothing is claimed that a person could walk
  through; but the back wall's silhouette has a notch in it where a window is.
