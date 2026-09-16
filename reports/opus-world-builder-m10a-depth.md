# World Builder M10a — prop depth banding + World Builder fixture repair

Branch `opus/world-builder-m10a-depth`, cut from `main` (which now carries M9). Not pushed.

Two deliverables: props interleave with actors by foot y instead of drawing above
everything, and `test/world-builder-browser.js` case 15 is 189/189 again — now
190/190, one check having been added.

## Deliverable 1 — depth

### Choice: (a), because (b) is not reachable from the fence

The brief said to prefer (b), "the scene loop collects actors + props into one list
and sorts once", unless it needs edits beyond `js/roadhouse-scene.js` and
`js/props-production.js`. It does. **The scene loop is not in `js/roadhouse-scene.js`**
— that file only swaps art hooks (`drawStructures`, `drawForegroundStructures`,
`drawTile`) for its map. The actor loop lives in `js/engine.js` `paintWorld`
(`js/engine.js:1005`), which sorts `entityList()` by `wy` and, after each actor,
calls `GAME.sprites.drawForegroundStructures` with that actor's depth band. (b)
would mean editing `js/engine.js`, outside the fence, and rewriting the depth
contract every other scene already relies on.

So: (a), and `js/roadhouse-scene.js` is untouched — every edit is in
`js/props-production.js`, which now hooks the three moments the frame already has:

| moment | hook | what it does |
| --- | --- | --- |
| ground pass, once per frame, before every actor | `GAME.sprites.drawStructures` | `beginFrame(sceneId)` — bookkeeping only, draws nothing |
| immediately before each actor | `GAME.Sprites.drawChar` | releases every undrawn prop with foot y <= that actor's foot y |
| the open-ended depth band, after the last actor | `GAME.sprites.drawForegroundStructures` | releases everything left, the layers above `ACTOR_LAYER` included |

The middle hook is the one the band calls alone cannot give. The engine calls
`drawForegroundStructures` *after* an actor, so a band can only ever place a prop
**behind the next** actor — there is no call before the first one. A prop behind
everybody, or a scene with a single actor (the common case in a capture: Cooper
alone), would have no moment to draw in. `drawChar` is that moment, it carries the
actor's world position in its `meta` argument (`meta.wy`, and the camera falls out
of `meta.wx - x`), and wrapping `GAME.Sprites` is the pattern the scene files
already use (`js/roadhouse-scene.js` wraps `GAME.Sprites.drawTile`).

`drawBand(ctx, sceneId, cx, cy, upToFoot)` is public, as the brief's option (a)
asked, with the band expressed as "everything up to this foot y" rather than a
`[from, to)` pair — the release is cumulative, so a single bound is all a caller
needs and nothing can be skipped by a gap between two bands.

### Order

Sort stays `(layer, foot y, id)`. Within one release the list order is kept, so a
batch of props freed by the same actor keeps the full three-key order; across
batches the order is the actors' foot y, which is the point of the exercise. Ties
resolve prop-first because a prop with foot y exactly equal to an actor's is
released by the `drawChar` hook, which runs before that actor is painted.

### ACTOR_LAYER = 6, and a correction to the brief

`ACTOR_LAYER` is 6. An instance on a layer **strictly above** it always draws after
every actor whatever its foot y. Of the 12 seeded definitions, two sit above it:

| layer | definition | above ACTOR_LAYER? |
| --- | --- | --- |
| 1 | `roadhouse.stage.velvet` | no |
| 2 | `roadhouse.neon.sign` | no |
| 2 | `roadhouse.trophy.deer` | no |
| 3 | `roadhouse.piano.upright` | no |
| 3 | `roadhouse.pendant.brass` | no |
| 4 | `roadhouse.bar.segment` | no |
| 4 | `roadhouse.booth.red` | no |
| 5 | `roadhouse.payphone.wall` | no |
| 5 | `roadhouse.table.round` | no |
| 6 | `roadhouse.chair.red` | no |
| 7 | `roadhouse.candle.brass` | **yes** |
| 8 | `roadhouse.door.double` | **yes** |

6 is the highest layer the seeded Roadhouse gives a floor object (the chairs), so
everything above it is a thing that is not standing on the floor.

**The brief expected neon and pendants to be the ones above `ACTOR_LAYER`** — "that
is how neon and pendants stay on top". They are not, and they should not be. The
seeded layer numbers came from the prototype's back-to-front paint order, where
`neon` is 2 and `pendant` 3 precisely because they are painted early, against the
back wall. Re-numbering them would need `world/props.json`, which is outside this
fence — but it is also not wanted, because foot y already puts them right:

| instance | layer | foot y | nearest Roadhouse actor feet |
| --- | --- | --- | --- |
| `roadhouse-neon-01` | 2 | 10 | every body is 32 or lower down the screen |
| `roadhouse-trophy-01` | 2 | 9 | idem |
| `roadhouse-pendant-01/02` | 3 | 44 | the Giant's stage body is 32, the rest 80+ |

The neon and the trophy are on the back wall, above every actor's foot, so they
draw behind everyone — which is correct for something hanging on the far wall. The
pendants sit at 44: the Giant on the stage (foot 32) passes behind them, the bodies
down in the room (80, 112, 144) pass in front. That is the right orthographic
reading, and it is what ships. `ACTOR_LAYER` stays as the escape hatch for the two
definitions that genuinely need it and for whatever M10b adds.

### Flag

`GAME.PROPS_ENABLED` still gates everything. All three hooks return before doing
anything when it is false, so a flag-off frame is byte-identical to before:
`test/props-flag-off.js` is unchanged and still green, on the same 14388-byte shot
it pinned in M9.

### Tests

`test/props-render-order.js` grew from 21 to 32 checks. The new section installs
the real hooks over a fake sprite surface and replays the engine's frame (ground →
per actor: `drawChar`, then the band) against two floor props and one prop above
`ACTOR_LAYER`, recording what actually reaches the context:

- both actors north of both props → `ground @a @b far near ceiling`
- both actors south → `ground far near @a @b ceiling`
- one actor between them → `ground far @a near @b ceiling`
- one actor either side → `ground @a far near @b ceiling`
- tie on foot y → `ground far @a near @b ceiling` (prop first)
- one actor only → `ground far @solo near ceiling`
- flag off → `ground @a`

It keeps printing a single `PROPS-RENDER-ORDER-PASS` line, because
`tools/world-apply.js` uses this file's last line as the props target's CHECK and
`test/props-changeset.js` matches that exact prefix.

`test/props-depth-chrome.js` is new: 9 checks, four headless Chrome captures, flag
on. Every coordinate is computed — `roadhouse-table-01`'s frame `[180,48,21,22]`
and anchor `[10,20]` from `world/props.json` give the frame box and the anchor foot
y 102; the page transform (integer scale 3, stage centred, map centred in the
viewport so the camera sits at y −16) is derived from the canvas and map sizes, not
measured off an image. It asserts the table is intact over Cooper when his foot is
north of 102, that those same pixels do change with the props off (so the first
assertion is not vacuous), and that Cooper paints over the table when his foot is
south of it.

Two things about that test worth knowing:

- **The two tiles are the anchor tile's northern neighbour and the anchor tile
  itself**, not "one row north and one row south of the anchor tile". Their foot y
  values are 96 and 112, which straddle the anchor foot 102 — that is the axis
  under test. The tile a full row further south cannot be used: Cooper's sprite is
  24px tall (measured as the height of the pixels that change when he moves, with
  the props off), so standing there his sprite starts at 128 − 24 = 104, and the
  table's frame ends at 104. There is no overlapping pixel to compare, in either
  direction.
- **`?freezeMs=0` does not render.** At 0 (and at 1) the capture lands before the
  scene is painted — 3146 bytes of nothing. The test uses 1000, which M9 already
  pinned. Separately, `test/retro-scene.html` declares `TP-RETRO-READY` while the
  title card is still on screen about half the time — a race between
  `GAME.Engine.start` and its `prepareScene` timer, out of this fence. The test
  rejects and re-captures such a frame: the title card is a green outdoor
  illustration (0.587 of pixels green-dominant) and the Roadhouse a dark room
  (0.008), so the threshold is 0.1 with a wide margin. **That race is worth fixing
  in the harness** — it makes every Chrome gate in the repo flaky by luck of timing.

## Deliverable 2 — world-builder-browser case 15

**Root cause: the expected count was hardcoded, and it aged out. Not a repin
miscount.** `test/world-builder-browser.js:822` asserted literally 24 repins.
Case 15 moves Lucy off her baseline tile `sheriff@2,6`; every V5 pin in
`test/fixtures/cast-pins-acts-1-4.json` that expects her there legitimately
disagrees and is repinned. The fixture had 24 pins when the case was written and
has 28 now, all 28 expecting `sheriff@2,6` — the Act 5 pins were added by the Act 5
work. The tool was right at 28; the test was stale.

Fixed by deriving it: the case now counts the pins that expect Lucy on her baseline
tile and asserts `--repin --dry-run` previews exactly that many, both in the
`REPIN` lines and in the `DRY-RUN … N repin(s)` summary. One check was added
alongside, that the derived number is a sane fraction of the fixture, so a fixture
that stopped mentioning Lucy would fail loudly instead of asserting zero. The suite
is 190/190.

## What M10b needs from `js/editor/core`

M10b is the editor UI: catalog, ghost, place/move/flip/delete, undo, inspector,
`buildPropsChangeset`. Nothing of that exists yet. The shape to copy is
`js/editor/core/scene-objects.js`.

- **`js/editor/core/props.js`**, game-free, with the store/draft/history contract
  the other cores use: `createPropStore(registry)` → frozen `{ data, base, draft }`;
  `placeProp`, `moveProp`, `flipProp`, `deleteProp`, `revertEntry`, `revertScene`,
  each returning a new frozen draft, never mutating one; `changes(store, draft)`
  for the inspector; `registryWithDraft(store, draft)` for the export preview.
- **`buildPropsChangeset(store, draft)`** emitting the v2 format the apply side
  already accepts: `{ format: 'props-changeset', version: 2, target:
  'world/props.json', operations: [{ op: 'create' | 'upsert' | 'delete', id,
  instance }] }`. Instances only — definitions stay hand-edited, and an op that
  names one is refused today.
- **Move the format registration out of my shim.** `liftProps()` in
  `tools/world-apply.js` exists only because `js/editor/core/cast.js`
  `splitChangesets` does not know the target and `js/editor/` was outside the M9
  fence. M10b should add `props-changeset` / `world/props.json` to
  `splitChangesets` next to the other three and delete `liftProps`.
- **Validation split.** The rules live in `tools/world-apply.js`
  (`propsShapeProblems`, `propsWorldProblems`). The Builder needs the same
  verdicts live, so the game-free half should move into `js/editor/core/props.js`
  as `instanceErrors(ctx, instance)` / `draftErrors(ctx, store, draft)` with the
  scene canvas, atlas sizes and map sizes injected, exactly as
  `scene-objects.js` takes `sceneSize` / `dialogueExists`. `tools/world-apply.js`
  then calls the core instead of owning a second copy.
- **Already available, no work needed:** `GAME.WorldData.props` (frozen registry),
  `GAME.Props.instancesFor(sceneId)` (draw order, each entry `{ id, inst, def,
  layer, foot }`), `GAME.Props.originOf(entry)` (the exact pixel origin — use it
  for the ghost and the hit test, it is the same function the renderer uses),
  `GAME.Props.drawScene` / `drawBand` / `beginFrame` / `ACTOR_LAYER`,
  `install()` / `uninstall()` for a preview canvas, `definitions[*].tags` for
  catalog grouping and search, `.transforms` for which buttons to enable, and
  `.footprint` for the selection outline and the overlap warnings.
- **Still open, and now visible:** the seeded layers are the prototype's paint
  order, not a depth policy. M10b's inspector should expose the layer, and
  someone should decide whether `world/props.json` wants re-layering now that
  `ACTOR_LAYER` gives the numbers meaning.

## Files

```
js/props-production.js      depth banding: beginFrame / drawBand / three hooks, ACTOR_LAYER
test/props-render-order.js  21 -> 32 checks, new depth section
test/props-depth-chrome.js  new, 9 checks, 4 Chrome captures
test/world-builder-browser.js  case 15 repin count derived from the pins fixture
reports/opus-world-builder-m10a-depth.md
```

`js/roadhouse-scene.js` is untouched — see the choice of (a) above.

## Gate output

GATE_OUTPUT_PLACEHOLDER
