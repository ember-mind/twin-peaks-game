# Activity poses v01

Two things a viewer needs before a town looks alive: what a person's body is
doing, and what hour it is. Graphics only. Nothing in here simulates, decides,
schedules, stores or remembers anything.

**Nothing is wired.** No inhabitant chooses a pose, no action sets one, no room
asks for a minute. `LT.ActivityPoses` and `LT.DayLight` are projections: they
read their arguments and write pixels. Integration is described at the bottom
and is **not implemented**.

## Drawing a pose

```js
LT.ActivityPoses.draw(g, sheetId, poseId, dir, x, y, t, { kit: kit, palette: p });
```

| argument | what it is |
|---|---|
| `g` | a 2D context |
| `sheetId` | a look id from `LT.Appearance.ORDER`, `_work` apron variants included |
| `poseId` | a key of `LT.ActivityPoses.POSES`. A pose id, never a name, a character id or an action id |
| `dir` | `'down'` · `'up'` · `'right'` · `'left'`; `left` is the mirror of `right`, as in the walk atlas |
| `x`, `y` | **exactly what you would pass `GAME.Sprites.drawChar`** |
| `t` | milliseconds, for looping poses; `0` pins the first frame |
| `opts` | `{ alpha, frame, sheet, shadow, kit, palette }` |

`opts.frame` pins a frame instead of deriving it from `t`. `opts.sheet` blits
from an image you already hold. `opts.shadow: false` leaves the contact shadow
off; the shadow needs `kit` and `palette`, and without them it is skipped.

**It returns `false` when it cannot draw** — unknown pose, a direction that
pose does not have, unknown sheet id, sheet not decoded yet — so the caller
falls back to the standing sprite instead of showing a hole. Nothing else in
the API can fail.

`LT.ActivityPoses.load()` fetches the sheet once and resolves to `true` when it
is usable. Until then every `draw` returns `false`.

## The poses

| poseId | directions | frames | frame ms | pivot | box | shadow | reads as |
|---|---|---|---|---|---|---|---|
| `seated` | down · right (+ left) | 1 | — | 12,24 | 16×21 | yes | narrow chest over a wide lap, shins straight down |
| `reading` | down | 2 | 900 | 12,24 | 16×20 | yes | seated, both hands holding an open book across the chest |
| `work_counter` | down | 3 | 320 | 12,24 | 16×24 | yes | head dropped over the work, a pale slab travelling under the hands |
| `unpacking` | down | 2 | 520 | 12,24 | 20×20 | yes | bent at the waist, crown of the head to the viewer, both arms down |
| `sleeping` | right (+ left) | 1 | — | 12,24 | 24×12 | no | lying flat, head on a pillow, blanket in the wearer's own colour |
| `talking` | down · right (+ left) | 2 | 430 | 12,24 | 20×24 | yes | one forearm lifting and falling clear of the silhouette |

`LT.ActivityPoses.POSES` is that same table, read at load, so it cannot drift
from what the runtime draws. Four things are deliberately separate:

- **pivot** — `12,24` in every pose: bottom centre of the 24px actor cell. The
  cell is placed at `(x-4, y-8)`, which is what `GAME.Sprites.drawChar` does,
  so a pose lands exactly where the standing sprite stood and **a person never
  jumps when the pose changes**. `tools/capture-gallery.js` fails if any
  standing-height pose leaves that ground line.
- **box** — what the art is allowed to cover inside the cell. `unpacking` and
  `talking` are wider than a standing figure because an arm leaves the
  silhouette; `sleeping` is wider still and only half as tall. Both tools fail
  if a cell paints outside its box.
- **frames / frame ms** — a loop, derived from `t` by
  `LT.ActivityPoses.frameAt(poseId, t)`. Nothing advances on its own.
- **directions** — `left` has no cell of its own; it is `right` flipped at draw
  time, on whole pixels.

`sleeping` has one direction. `right` lays the body with the head to the left
and the feet to the right; `left` mirrors it. A sleeper's facing is not a fact
this package can represent — which way the bed runs is.

### How a pose is built

Poses are **not** a second art style. Each cell is a head matrix from the
production paper-doll library stacked on an authored body matrix, in the same
slot alphabet (`O` outline, `H/h` hair, `S/s` skin, `W/w` shirt, `J/j/K`
jacket or dress, `P/p` pants or skirt, `B/b` shoes), rasterised with the same
palette the look's walk frames use and written with the same PNG writer. Three
levers do all the work:

- **fewer rows** sit lower in the cell, because rows are bottom-aligned. That
  is `seated` (20 rows), `unpacking` (18) and `sleeping` (11).
- **padding** adds transparent columns to the head so a body can be authored
  wider than 15 and an arm can leave the silhouette without moving the figure.
- **blankTop** drops the head without lifting the feet. That is
  `work_counter`: a head leaning over the work.

The apron overlay is re-authored per pose wherever the standing one would land
on shins or on an open book. `reading`, `unpacking` and `sleeping` show no
apron at all — a book, a bent back and a blanket each hide one — so for those
three a `_work` sheet id draws the same cell as the plain one.

## The light

```js
var light = LT.DayLight.at(minuteOfDay);   // pure; same minute, same answer
LT.DayLight.apply(g, light, { width: 256, height: 192 });
```

`at()` takes one number and returns a fresh object:

| field | what a painter does with it |
|---|---|
| `glass`, `glassHi` | the two window-pane values; hand them to the room's material before painting it |
| `ambient` | `{ color, alpha }` — multiplied over the whole frame: the room's air |
| `warm` | `{ color, alpha }` — added back over the frame: what the lamps put into the dark |
| `lamps`, `lampStrength` | whether the lamps are on, and how strongly |
| `phase` | `'night'` · `'dawn'` · `'day'` · `'dusk'`, for a caption |
| `minute` | the minute it answered for, already wrapped into 0–1439 |

`LT.DayLight.material(palette, light)` returns a **copy** of a room's palette
with `glass` and `glassHi` replaced. It writes nothing back.

`apply` is two whole-pixel `fillRect`s over the region — one `multiply`, one
`lighter` — and it restores the context afterwards. No filter, no gradient, no
shadow, no `drawImage`, so nothing is blurred, resampled or scaled and the
pixel art stays exactly as crisp as the painter left it. At true noon it paints
nothing at all. `opts`: `{ x, y, width, height, strength, lamps }`.

Window light comes first and there is nothing else: no particles, no shafts,
no bloom. Nothing in this package draws a light source; it only says what
colour the light is.

Between keyframes everything is eased, and the last keyframe eases back into
the first across midnight. The worst one-minute step anywhere in the day is
**3/255 on any channel** — the Node test measures it and fails above that.

## Files

| path | what it is |
|---|---|
| `activity-poses.table.js` | the pose table and the sheet order; read by the runtime AND the compiler, so they cannot disagree |
| `lt-activity-poses.js` | the runtime: `LT.ActivityPoses.draw` and the sheet loader |
| `lt-daylight.js` | `LT.DayLight.at` / `apply` / `material` |
| `tools/pose-frames.js` | the authored pose matrices, in slot letters |
| `tools/build-poses.js` | compiles the sheet from `lt-appearance.js` + those matrices |
| `tools/capture-gallery.js` | drives the gallery in headless Chrome and writes `images/` and the manifest |
| `assets/activity-poses-v01.png` | the sheet: 14 pose columns × 12 looks, 24px cells, 336×336 |
| `assets/activity-poses-v01.frames.json` | which column and row each cell is at |
| `activity-poses.manifest.json` | the whole package, machine-readable, written by the capture tool |
| `gallery.html` | the preview, drawn by the real renderer |
| `test/activity-poses.js` | the Node checks: table, purity, light continuity |
| `images/` | frames captured off the renderer |

`images/03-stage-anchors.png` is the anchor stage: a registered interior
composition made of nothing but production kit pieces, put at the heights each
pose needs. It is the package's statement of **what a room has to provide** —
a counter low enough to stand behind, a bench a lap lands on, a bench long
enough to lie on, a work table a bent back reaches. `images/03-cafe-posed.png`
is the same poses in Café Meridiana as that room actually is, which is a
harder and less flattering picture; the difference between the two is the
integration work, not the art.

The sheet is square because the production PNG writer writes squares; the
bottom two cell rows are empty on purpose.

## Commands

Serve the checkout over HTTP, then:

```
# the gallery
open http://localhost:<port>/living-town/content/activity-poses-v01/gallery.html

# structure, purity, light continuity — no browser
node living-town/content/activity-poses-v01/test/activity-poses.js

# recompile the pose sheet from the looks and the matrices
node living-town/content/activity-poses-v01/tools/build-poses.js
node living-town/content/activity-poses-v01/tools/build-poses.js --check

# one cell as text, for authoring
node living-town/content/activity-poses-v01/tools/build-poses.js --ascii look_teal_bob/seated/down/0

# regenerate every captured image and the manifest
node living-town/content/activity-poses-v01/tools/capture-gallery.js
node living-town/content/activity-poses-v01/tools/capture-gallery.js --check
```

Both `--check` runs write nothing and exit non-zero the moment anything on
disk stops being what the compiler and the renderer produce now. The capture
tool starts its own Chrome and its own server: **run one Chrome driver at a
time**. It also fails if a cell paints outside its box, if a standing-height
pose leaves the ground line, or if two of the four captured hours share a
window colour.

## Wiring it in — what someone else has to do

Nothing below is done.

**1. Load the three files.** In `living-town/index.html`, after
`lt-appearance.js` and before `lt-view.js`:

```html
<script src="content/activity-poses-v01/activity-poses.table.js"></script>
<script src="content/activity-poses-v01/lt-activity-poses.js"></script>
<script src="content/activity-poses-v01/lt-daylight.js"></script>
```

and call `LT.ActivityPoses.load()` once at startup. `lt-activity-poses.js`
resolves the sheet relative to its own `<script src>`, so it works from any
page that loads it by path.

**2. Decide the pose, outside this package.** Something has to map an activity
to a pose id — that mapping is the view's or the simulation's business and
must not move in here, because a pose id is a shape and an action id is a
decision. The obvious seam is beside `LT.Appearance.sheetIdFor(character)` in
`lt-appearance.js`: a `poseIdFor(character)` that reads
`character.activity.actionId` and `.phase` and answers a pose id or `null`.
`null` means "walk sprite".

**3. Replace one call in the view.** In `lt-view.js`,
`View.prototype.drawInhabitant`, the `how === 'atlas'` branch is exactly one
`GAME.Sprites.drawChar`. It becomes:

```js
if (!e.moving && e.poseId &&
    LT.ActivityPoses.draw(g, e.sheetId, e.poseId, e.dir, e.wx - cx, e.wy - cy,
                          this.clock, { kit: GAME.Retro2D.interiorKit,
                                        palette: GAME.Retro2D.interiorKit.materials[mapId] })) {
  return;
}
GAME.Sprites.drawChar(/* unchanged */);
```

`e.poseId` comes from `View.prototype.entitiesAt`, next to `sheetId`. The
order matters: **a moving person is never posed**, and a pose that returns
`false` must fall through to the standing sprite in the same frame.

**4. Leave the depth-band pass alone.** The pose is drawn at the same `(x, y)`
with the same foot line, so `EMBER.Tilemap.paintDepthBands` keeps working
unchanged and the counter still covers whoever is behind it. The only thing
the view must pass in is the room's `kit` and `palette` for the contact
shadow; `sleeping` declares `shadow: false` and lays none.

**5. For the light, two edits, in this order.** Before
`GAME.sprites.drawStructures`, swap the room's material for the minute's:

```js
var light = LT.DayLight.at(this.sim.state.minute);
kit.materials[scene.material] = LT.DayLight.material(basePalette, light);
```

then restore the original palette afterwards — `drawStructures` reads
`kit.materials[...]` at paint time, so this is a borrow, not an edit. After the
whole frame is painted, including people:

```js
LT.DayLight.apply(g, light, { width: 256, height: 192 });
```

It must be the last thing in the frame and it must come after the actors, or
people will stand in yesterday's light. It must come **before** any UI or
dialogue layer, or the text goes dark with the room.

## Limits, honestly

- **Nothing is wired.** No inhabitant knows a pose exists. No room asks for a
  minute. The gallery poses people because the gallery says so.
- **Poses take no actor light.** `GAME.Sprites.drawChar` tints a standing
  sprite with `kit.actorLight` when it stands in a pendant's pool; a posed one
  is not tinted. A person will get very slightly flatter the moment they stop
  walking under a lamp.
- **Café Meridiana cannot currently seat anybody.** This is the largest
  honest gap and it is a room problem, not a pose problem. A pose keeps the
  standing ground line, so a seated figure's lap lands seven or eight pixels
  under its own feet — which is where a seat has to be. The café's stools sit
  above that line, and its banquettes have a depth of their own tile row, so
  an actor low enough to be drawn in front of a banquette is already past its
  seat, and an actor on the seat is repainted over by it. Until the room
  offers seat anchors (a piece saying "a lap goes here, at this y, with this
  depth"), a seated inhabitant in that café reads as sitting near the stool
  rather than on it. The anchor stage shows what the same poses look like
  against furniture placed for them.
- **`work_counter` is a full-height figure.** Café Meridiana's counter slab
  plus its service clusters are taller than a person, so nobody can be framed
  behind that counter at all; in the café capture the worker stands in front
  of it. On the anchor stage the same pose stands behind a bare slab and the
  gesture lands on the counter top, which is what the pose is for.
- **`sleeping` loses the hairstyle.** Lying down, the head is authored once for
  every look; hair and blanket colour identify the sleeper, the silhouette of
  the haircut does not survive. There is also no bed: the pose is a body under
  a blanket and nothing else.
- **`reading` and `unpacking` have one direction, `seated` and `talking` two.**
  There is no `up` for anything. A pose asked for a direction it does not have
  returns `false`, which is a fallback to standing, not a crash.
- **No `_work` difference for three poses.** See the apron note above.
- **The light is one curve for the whole town.** There is no weather, no
  season, no per-room sky and no outdoor variant: `at()` knows the minute and
  nothing else. `apply` tints a rectangle uniformly; it does not know where the
  window is, so a room's far corner darkens exactly as much as its sill.
- **The lamps never go out.** `lampStrength` says whether they should be on,
  but a room's warm pools are painted by the room (`kit.warmLight` inside
  `lt-cafe-scene.js`), unconditionally, at every hour. Nothing here can turn
  them off, so a midday frame still carries its pendants' glow. A room that
  wants lamps that switch has to read `light.lamps` itself.
- **The four captured hours are a fixed set.** 07:00, 13:00, 18:30 and 23:00
  are what the gallery shows and what the capture tool checks; the curve itself
  is continuous over all 1440 minutes and the day ramp image is the evidence.
