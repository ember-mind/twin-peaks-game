# World kits and maps

The Ember Engine draws a world from two things a game supplies:

- a **kit**: the game's art as data (ground tiles, object sprites, light), and
- a **map**: which ground goes where, which objects stand where, which
  places people go.

The engine never names a game's materials or objects. Twin Peaks and Living
Town share the code and keep their own look by shipping different kits.

Modules: `ember-ground.js` (tile picking), `ember-worldmap.js` (collision,
places, routes, doors; pure, runs under Node), `ember-worldview.js` (loading
a kit, drawing). Tools: `tools/kit-editor.html` (map editor for any kit),
`tools/grade-kit.py` (day/night grades). Test: `test/worldmap.js`.

Kits today: `living-town/proto/town-kit/` (riverside village),
`assets/kits/tp-exteriors-v01/` (Twin Peaks exteriors, in progress).

## kit.json

```json
{ "name": "living-town-village-v01", "tile": 16,
  "tileSet": "ground/ground.json", "groundImage": "ground/ground",
  "objects": "objects.json", "backdrop": "objects/backdrop",
  "grades": ["dusk", "day", "night"],
  "schedule": [[0, 300, "night", "night"], [300, 390, "night", "dusk"], ...],
  "darkness": { "night": 1, "dusk": 0.45, "day": 0 },
  "light": { "warm": [255, 170, 80], "reflection": 0.35 },
  "objectMeta": { "cafe": { "alwaysLit": true } } }
```

- Image paths have no extension. The first grade is `name.png`; every other
  grade is `name-<grade>.png` (make them with `tools/grade-kit.py`). A
  missing grade falls back to the first.
- `schedule` rows are `[fromMinute, toMinute, gradeA, gradeB]`: during the
  span gradeA fades into gradeB. `darkness` per grade drives lamps, window
  glow and actor relighting.
- `objectMeta` overrides object fields the art build does not know.

## Tile set (ground.json)

```json
{ "tile": 16, "columns": 16, "image": "ground.png",
  "materials": {
    "cobble": { "kind": "coursed",  "codes": 4, "interiors": 3, "table": [...] },
    "grass":  { "kind": "textured", "codes": 2, "interiors": 3, "table": [...], "rare": { "index": 2, "oneIn": 8 } },
    "water":  { "kind": "animated", "codes": 3, "interiors": 2, "frames": [[...], [...], [...]], "walkable": false, "reflects": true } },
  "rules": [
    { "type": "fringe", "materials": ["cobble", "paving"], "neighbours": ["grass", "garden"], "tables": { "cobble": { "mask,L,R": cell } } },
    { "type": "lip",    "material": "embankment_top", "above": ["grass", "garden"], "table": [...] },
    { "type": "shore",  "material": "water", "aboveNot": ["water"], "frames": [[...], ...] } ] }
```

Cells index the atlas left to right, top to bottom. Seams never show because
edge codes are hashed from edge positions (both neighbours agree); a
material's table holds one tile per combination of its edge codes and
interiors. Kinds, rule types and indexing are specified in the header of
`ember-ground.js`.

## Objects (objects.json)

```json
{ "id": "cottage-1", "kind": "building", "file": "objects/cottage-1.png",
  "w": 96, "h": 99, "anchor": [2, 51], "depth": 99,
  "footprint": [[0, 0], [1, 0], ...],
  "door": { "dx": 2, "dy": 2, "w": 2, "rect": [45, 66, 14, 27], "open": "objects/cottage-1-door-open.png" },
  "windows": [[14, 57, 19, 21], [70, 58, 13, 20]] }
```

- `anchor`: the sprite pixel placed on the top-left corner of the object's
  tile in the map.
- `footprint`: blocked tiles relative to that tile. A door's tiles stay
  walkable.
- `depth`: sprite-local y of the ground line; anyone whose feet are above
  it is drawn behind the object.
- `kind`: free text, except `lamp` (lights at night; optional `light:
  [x, y]` for the head), `backdrop` (drawn once, fixed, behind everything)
  and `foreground` (left out of water reflections).
- `door.rect` / `windows`: rects in sprite pixels. The door gets its open
  frame and a lit hall while someone passes; windows glow while their
  place is lit.

## Map

```json
{ "w": 48, "h": 27, "tile": 16, "seed": 7,
  "legend": { "c": "cobble", "g": "grass", "w": "water" },
  "ground": ["cccc…", …],
  "backdrop": { "x": 0, "y": 0 },
  "objects": [{ "kit": "cottage-1", "id": "cottage-1", "tx": 4, "ty": 7 }],
  "places": { "flat_a": "cottage-1" },
  "spots": { "bench_w": { "tx": 13, "ty": 18, "seats": [[-8, -23], [9, -23]] } },
  "walkable": [[21, 19]], "blocked": [] }
```

- `places` name the object whose door people use; `spots` are outdoor
  cells. Both are routable by name (`WM.route(world, from, to)`).
- `walkable`/`blocked` override single cells (a jetty over water).
- Anything else in the file (residents, a game's own fields) is carried
  along and ignored by the engine.

## Making a kit from a concept painting

The worked example is Living Town's village kit:

1. Re-pixel the painting to native scale, sized so doors fit a character.
   Quantize to a closed palette, with no dither.
2. Cut every object into an RGBA sprite with anchor, footprint, depth,
   door and windows. Where plants or other objects hid part of a sprite,
   repaint that part from the object's own texture.
3. Build seamless ground tiles in the same palette, with transitions as
   rules.
4. Grade day and night (`tools/grade-kit.py`).
5. Compose a map (by script or in `tools/kit-editor.html`). Check that
   every place reaches every other.
