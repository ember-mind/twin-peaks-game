# Everyday props v01

Four everyday objects for Living Town, drawn by the production renderer in
Café Meridiana's own material. Graphics only. Nothing in here simulates,
decides, carries, stores or remembers anything.

**Use, lending, riding and repair are not implemented.** No inhabitant knows
these objects exist. `umbrella_worn` and `bicycle_old` in particular are
preparatory art: there is no carry rig, no mount, no repair and no weather.

## Drawing one

```js
LT.EverydayProps.draw(g, typeId, state, x, y, { palette: p, kit: kit });
```

`(x, y)` is where the object's **pivot** lands, in the pixel space the scene
painter is drawing in — not the corner of its picture. `kit` defaults to
`GAME.Retro2D.interiorKit` and `palette` to that kit's `lt_cafe` material; any
other kit material works unchanged. `{ shadow: false }` leaves the contact
shadow off for a surface that already has one.

`draw` reads its arguments and writes to the canvas. It has no memory: drawing
a parcel `open` consumes no food, drawing a book `open` advances nobody's
reading. **Visual state is an argument, never a record.**

Every pixel goes down through `kit.rect`, every contact shadow through
`kit.contactShadow`. Nothing is resampled, smoothed or scaled.

## The four objects

| typeId | states | size (px) | pivot | proposed footprint |
|---|---|---|---|---|
| `book_used` | `closed` · `open` | 14×7 · 19×8 | 7,7 · 9,8 | none — it rests on a surface |
| `food_parcel` | `sealed` · `open` · `empty` | 13×16 · 13×17 · 13×11 | 6,h | none — it rests on a surface |
| `umbrella_worn` | `closed` · `open` | 5×24 · 24×20 | 2,24 · 11,20 | 1 cell, `soft` |
| `bicycle_old` | `parked` · `damaged` | 30×17 (both) | 14,17 | 3 cells, `physical`: `[-1,0] [0,0] [1,0]` |

Four things are deliberately separate and must not be confused:

- **visual size** — the box above, and the box the art actually paints in;
  they are equal, and `tools/capture-gallery.js` fails if they stop being.
- **pivot** — the contact point. Bottom-centre of what the object stands or
  rests on.
- **proposed footprint** — the ground it blocks, in tiles, relative to the
  pivot's tile. It is a proposal for whoever wires collision, not a fact yet.
  **Occupied pixels are not solid pixels:** a bicycle paints about two tiles
  wide and a handlebar's worth more, and blocks three cells of floor.
- **variants** — the visual states above. No animation frames: nothing here
  moves.

### Placement and occlusion

- `book_used` — on a table or a counter, after the furniture and before
  whoever is sitting at it.
- `food_parcel` — counter, table or floor. All three states share the pivot
  and the same 13px width; `open` is a row taller because a loaf sticks out
  and `empty` five rows shorter because the bag has slumped. Nothing moves
  sideways between states.
- `umbrella_worn` — `closed` stands on its ferrule with the crook up, against
  a wall or in a stand. `open` stands propped on its handle, drying. Both
  pivots are on the floor, so the object does not jump between states, but
  `open` leans 11 columns to the left of its pivot and 12 to the right: it
  covers what is beside it and must be painted after it.
- `bicycle_old` — both wheels on one floor line, nobody on it. The bars and
  the basket rise into the tile above the footprint and will cross a wall
  drawn there; give it clear ground. Both states keep the same pivot and the
  same box on purpose, so a bicycle that gets damaged does not move.

## Files

| path | what it is |
|---|---|
| `lt-everyday-props.js` | the only source: the table and the draw calls |
| `everyday-props.manifest.json` | the same table, machine-readable, written by the capture tool |
| `gallery.html` | the preview, drawn by the real renderer |
| `tools/capture-gallery.js` | drives the gallery in headless Chrome and writes everything below |
| `assets/everyday-props-v01.png` | the nine frames baked onto one transparent sheet |
| `assets/everyday-props-v01.frames.json` | where each frame is on that sheet, and its pivot |
| `images/` | frames captured off the renderer |

The baked sheet is a convenience, not the source. It is produced from the same
draw calls, so it cannot drift; contact shadows are **not** baked into it,
because `draw` lays them down at paint time against the room's own material.

## Commands

Serve the checkout over HTTP, then:

```
# the gallery
open http://localhost:<port>/living-town/content/everyday-props-v01/gallery.html

# regenerate the sheet, the manifest and every captured image
node living-town/content/everyday-props-v01/tools/capture-gallery.js

# verify what is on disk is what the renderer produces now (writes nothing)
node living-town/content/everyday-props-v01/tools/capture-gallery.js --check
```

The tool starts its own Chrome and its own server. Run one Chrome driver at a
time. It fails if any frame paints outside its declared box.

## Limits, and what integration still needs

- The gallery is a **graphics preview**. It proves the renderer can draw these
  objects in the café; it proves nothing about behaviour.
- Depth: the gallery paints props after the whole room. A real placement has
  to join the scene's depth bands (`lt-cafe-scene.js` `foreground`), or a
  person walking in front of a bicycle will be painted behind it.
- Collision: the footprints above are proposals. Nothing reads them yet.
- Lighting: props take the room's material but not `kit.actorLight`; an object
  standing in a pendant's pool is not lit by it.
- No object is registered anywhere, in any room, in any save. Placing them is
  the mechanical package's business, not this one's.
- `umbrella_worn/closed` is 5px wide, near the floor of what this style can
  carry; its crook reads as a hook and not much more.
