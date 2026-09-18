# World Builder M10b — props editing

Branch `opus/world-builder-m10b-props-ui`, cut from `main` (`621ebf1`). Not pushed.
Worked in `.worktrees/m10b`; the shared checkout was left alone.

Built what `reports/opus-world-builder-m10a-depth.md` "What M10b needs from
`js/editor/core`" asked for: a game-free props core, the Builder UI over it, the
format registration moved into `splitChangesets`, and the game-free half of the
props validation moved out of `tools/world-apply.js` so the tool and the Builder
run one implementation.

## What is new

| file | what |
| --- | --- |
| `js/editor/core/props.js` | new, 424 lines — the store, the edits, the changeset, the geometry, the validation |
| `js/world-builder.js` | PROPS layer, catalog, ghost, place / move / flip / nudge / delete, inspector, export |
| `js/world-builder-data.js` | `propsContext(GAME, atlasOf)` — registry + injected map and atlas sizes |
| `js/editor/core/cast.js` | `splitChangesets` owns `world/props.json` (the fourth writable target) |
| `tools/world-apply.js` | `liftProps` deleted; the shape rules now come from the core (−160 lines, +26) |
| `world-builder.html` | loads `js/editor/core/props.js` and `js/props.gen.js` |
| `test/props-core.js` | new, 122 checks |
| `test/world-builder-browser.js` | cases 20–22, 190 → 229 checks |

## The core

`createPropStore(registry)` → frozen `{ data, base, draft }`, `base` a frozen map
`id -> instance`. Every edit returns a **new frozen draft**:
`placeProp`, `moveProp`, `nudgeProp`, `flipProp`, `deleteProp`, `revertEntry`,
`revertScene`; plus `changes`, `buildPropsChangeset`, `registryWithDraft`,
`suggestInstanceId`. Same conventions as `scene-objects.js`, including the
`fail()` prefix and `freezeDeep`.

Three decisions worth naming:

- **`nudgeProp` is a separate verb from `moveProp`.** `tx/ty` is the anchor in
  tiles; `ox/oy` is the pixel offset. A nudge back to 0 **drops the field**, so a
  nudge and a nudge back is the base entry byte for byte (`test/props-core.js`
  asserts `changes()` is then empty). Same for `flipX`, which the registry only
  allows when true.
- **`registryWithDraft` reproduces the tool's key order** — base order first,
  created ids appended — so the Builder's preview and what
  `tools/world-apply.js` writes are the same bytes. The test asserts that
  against `applyPropsChangeset` on the same changeset, `JSON.stringify` included.
- **`layer` is read, not written.** The inspector shows the effective layer,
  whether it is an instance override, and whether it sits above `ACTOR_LAYER`.
  M10a left "should `world/props.json` be re-layered" open, and that is a
  decision for the lead, not something the UI should let a drag make by accident.

## The validation split

`propsShapeProblems` in `tools/world-apply.js` was 80 lines of rules plus disk
reads. The rules are now `PropsCore.registryErrors(ctx, data)`; what stayed is
the part that needs a file system:

```js
atlasSize: function (atlas, at) { ... pngSize(file) ... }   // and the "does not exist" problem
```

`propsWorldProblems` keeps everything that needs the booted game — the Roadhouse
locks, the door / interact / Cast Presence footprint warnings — and calls
`PropsCore.sceneErrors` with the map sizes injected for the canvas rule. The
tool prints exactly what it printed before: every core message is its registry
path, and the tool prepends `INVALID `.

That equality is a test, not a claim. `test/props-core.js` mutates the **real**
`world/props.json` ten ways (missing definition, off-canvas anchor, bad layer,
forbidden transform, unknown field, sub-pixel anchor, frame outside the atlas,
missing definition field, bad canvas, unknown scene field) and asserts

```js
assert.deepEqual(tool, core.map((e) => 'INVALID ' + e));
```

## The UI

`PROPS` toggles the layer; it starts **off**. That is deliberate: with props
drawn, a prop wins the click over the tile marker under it, and every pre-M10b
case (the roadhouse spawn of case 5, for one) must keep the click it had. With
the layer off, `propItems` is still readable but nothing draws and nothing
selects.

- **Catalog**: `NEW PROP` lists every definition with its label, id and tags,
  filtered by one search box; picking one suggests a free instance id
  (`roadhouse.candle.brass` → `roadhouse-candle-03`).
- **Ghost**: the real sprite at 55 % alpha plus a dashed frame, following the
  hover until the tile is picked. Atlases are decoded once and the page
  re-renders when one arrives; a prop whose atlas has not decoded draws as a
  translucent frame box, never a placeholder sprite.
- **Selection**: props are **not** `sceneItems`. They live in scene pixels, not
  whole tiles, so they carry their own selection (`ui.selectedProp`) and their
  own hit-test (`P.hitTest`, the reverse of the runtime draw order: layer, foot
  y, id). The test proves the stacking rule with two overlapping frames.
- **MOVE keeps the sub-tile fraction.** The seeded anchors sit at 7.8125, 6.5625
  and so on; a move by whole tiles that snapped them to the corner would silently
  re-art the room. Case 20 asserts 7.8125 → 4.8125.
- **Inspector**: definition, anchor, nudge, flip (disabled when the definition
  allows no transform), layer, footprint tiles, draft state, and a warning when
  two footprints share a tile — the same overlap `tools/world-apply.js` warns
  about. Arrow keys nudge by a pixel; `MOVE`, `FLIP X`, `REVERT`, `DELETE`
  (with a confirm step) are buttons.
- **Undo** is the existing single stack: history now holds
  `{ conn, cast, objects, props }` and Ctrl+Z crosses all four.
- **Export** adds the props changeset to the same bundle:

```json
{ "format": "props-changeset", "version": 2, "target": "world/props.json",
  "operations": [ { "op": "upsert", "id": "roadhouse-chair-02",
    "instance": { "propId": "roadhouse.chair.red", "sceneId": "roadhouse",
                  "tx": 4.8125, "ty": 7.25, "ox": -1, "flipX": true } } ] }
```

`world-builder.html` loads `js/props.gen.js` but **not** `js/props-production.js`:
the Builder draws its own preview and must not hook `GAME.sprites`.
`GAME.PROPS_ENABLED` is untouched and still defaults to false in production.

## What the Builder does not refuse

Case 22 moves a table onto the roadhouse south door tile. The Builder accepts it
— the Roadhouse locks need the booted game and the map rows, which the page does
not have — and `tools/world-apply.js` refuses it:

```
LOCK roadhouse: south door tile 7,9 is claimed by roadhouse-table-02; the south door is unchanged
LOCK roadhouse: south door tile 8,9 is claimed by roadhouse-table-02; the south door is unchanged
world-apply: 2 problem(s); nothing written
```

The test asserts exit 1 and the lock text, so the division of labour is pinned:
schema errors block the export, world locks block the apply.

## Two test strings I had to change, and why

The brief said the four props gates stay unchanged. Two assertions could not,
because they pinned the wording of the shim the brief asked me to delete.

- `test/props-changeset.js`: a props changeset with a foreign target and a bundle
  carrying two props changesets are now refused by `splitChangesets`, one layer
  earlier, with its wording (`is a props changeset targeting …`,
  `changesets[1] is a second changeset for world/props.json`) instead of
  `liftProps`'s. Still exit 2, still nothing written; the check count is
  unchanged at 47.
- `test/editor/cast.js`: the "only … are writable" list grew a fourth target.
- `test/world-builder.js`: the module-api pin grew `propsContext` (110/110).

No assertion was weakened or removed.

## Gates

```
node test/props-registry.js       PROPS-REGISTRY-PASS 12 definitions, 19 instances, 53 checks
node test/props-changeset.js      PROPS-CHANGESET-PASS 47 checks
node test/props-render-order.js   PROPS-RENDER-ORDER-PASS 32 checks (order, flip, camera, flag, depth banding)
node test/props-flag-off.js       PROPS-FLAG-OFF-PASS 9 checks, roadhouse 7,6 up, 14388 byte shot
node test/props-core.js           PROPS-CORE-PASS 122 checks            (new)
node test/world-builder-browser.js  WORLD-BUILDER-BROWSER 229/229       (was 190)
node test/world-builder.js        WORLD-BUILDER-PASS 110/110
node test/editor/cast.js          EDITOR-CAST-PASS 54
node test/editor/scene-objects.js EDITOR-SCENE-OBJECTS-PASS 74
node test/world-apply.js          WORLD-APPLY-PASS 91
node test/smoke.js                415 controlli superati ✔
node test/walkthrough.js          OK: … 85 acquisizioni, finale raggiunto ✔
node tools/run-release-tests.js --out=/tmp/tp-m10b   PASS: 115/115 Node commands
```

One Chrome driver at a time; none left behind. `world/props.json`,
`world/connections.json` and `world/scene-objects.json` are hashed before and
after every browser case and never changed.

Evidence: `artifacts/world-builder-m10b/` (three screenshots, three changesets,
three `--dry-run` transcripts).

## Left open

- **Re-layering `world/props.json`** now that `ACTOR_LAYER` gives the numbers
  meaning. The inspector exposes the layer and says when a prop sits above the
  actors; changing one is still a hand edit, deliberately.
- **Definitions stay hand-edited.** No op reaches them, in the core or in the
  changeset, exactly as M9 and M10a said.
- **A prop's footprint is not checked against the map** in the Builder (doors,
  interact tiles, Cast Presence bodies). Those warnings need the booted game;
  `tools/world-apply.js` prints them, and case 20's transcript carries one.
