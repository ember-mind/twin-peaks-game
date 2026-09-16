# World Builder M9 — prop registry data layer (no UI)

Branch `opus/world-builder-m9-props`, cut from `main` at `ba8e67f`. Not pushed.
Implementation commit: `0f4b85c` feat(world-builder): M9 prop registry data layer.

Delivers the data layer the prop-prototype handoff asked for: a validated registry
(`world/props.json`), its generated runtime binding (`js/props.gen.js`), a `props`
target in `tools/world-apply.js` with changeset ops and validation, a flag-gated
runtime consumer (`js/props-production.js`), and four new tests. No UI, no editor
core, no visual change: `GAME.PROPS_ENABLED` defaults to false and the Roadhouse
renders byte-identically to `main`.

## Schema decisions that deviate from the handoff

### 1. A third top-level map: `scenes`

The handoff's contract shows two maps, `definitions` and `instances`. The shipped
file has three: `version`, `scenes`, `definitions`, `instances`.

`scenes` holds one entry per scene, `{ "roadhouse": { "canvas": [256, 192] } }`.
It exists because the "out-of-map tx/ty" reject needs a canvas to reject against,
and **the Roadhouse scene canvas is two tiles taller than its collision map**:
`js/roadhouse-art.js:620` paints `R(0, 0, 256, 192)` while `js/maps.js` gives the
map 16x10 tiles = 256x160. The prototype room uses the same 256x192 space (wall
band 0..32, floor 32..160, south band 160..192). Without a declared canvas, three
of the nineteen instances the milestone is told to promote — the double door at
`ty 11.875` and two chairs — would be refused as out of map, and the only way to
keep them would be to weaken the reject into nothing.

The canvas is itself validated: whole tiles, and never smaller than the scene's
map (`propsWorldProblems`). Footprint/tile rules only apply to instances whose
anchor tile falls inside the map; the art-only band below the rows claims nothing.

### 2. `defaultLayer` is an integer, not a band name

The handoff's example writes `"defaultLayer": "furniture"` on the definition and
`"layer": 6` on the instance. Two different types for the same axis makes the
"layer is an integer 0..9" reject undefinable. Both are integers 0..9 here; the
definition's value is the default and the instance's, when present, overrides it.
Tag strings (`furniture`, `light`, `wall`, …) carry the grouping the band name was
reaching for, which is what M10's catalog actually needs.

### 3. Instances are placed in scene pixel space, expressed in tiles

`tx`/`ty` name the **anchor point**, in scene pixels divided by 16, so they are
fractional (`5.3125`) exactly as the handoff's example (`6.8`, `7.65`). The draw
rule, in one place (`js/props-production.js` `originOf`):

```
left = round(tx * 16) - (flipX ? frame[2] - anchor[0] : anchor[0]) + (ox || 0)
top  = round(ty * 16) - anchor[1]                                  + (oy || 0)
```

Subtracting the mirrored anchor on a flip keeps the anchor point fixed while the
image box stays put. A reject fires if `tx`/`ty` does not land on a whole pixel,
so the registry can never describe a half-pixel prop.

### 4. Changeset format lives in `tools/world-apply.js`, not in `js/editor/core/`

`js/editor/core/cast.js` `splitChangesets` knows only the three M4b–M8 targets and
refuses an unknown `format`. `js/editor/` is outside this milestone's fence, so
`liftProps()` in `tools/world-apply.js` lifts a `props-changeset` (standalone or
inside a bundle) out before the split. **M10 should move this into
`js/editor/core/props.js`** next to the other changeset cores and register the
target in `splitChangesets`; `liftProps` then goes away.

### 5. Regeneration lives in `tools/world-apply.js`, not `test/gen-world-data.js`

The two existing gen files are written by `test/gen-world-data.js`. That file is
outside the fence, and the milestone asked for regeneration in the `props` target,
so `regenProps(root)` lives in `tools/world-apply.js` and is also reachable as
`node tools/world-apply.js --gen-props`. `test/props-registry.js` rebuilds the
expected text with the same function and byte-compares, so a hand edit of
`js/props.gen.js` fails. If a later milestone prefers one generator, move
`propsGenText` into `test/gen-world-data.js` and have both call it.

### 6. The fifth Roadhouse lock is enforced by the rows check, not per tile

The handoff lists "every Cast Presence body tile remains walkable". A per-tile
assert would fail on the shipped game: the Giant's body tile `roadhouse 8,1` is
the raised stage and is deliberately solid
(`js/roadhouse-scene.js`, "the stage placement is intentionally solid"). Since
props own no map row — the schema has no field that could write one — the only way
a body tile's walkability could change is a row edit, which the rows lock already
catches. Footprint overlap with a body tile stays a **warning**, per the handoff's
"warn or reject … according to explicit policy".

### 7. One promoted instance moved: the south seating cluster

`world/props.json` seeds the 12 prototype definitions verbatim (frame, anchor and
footprint are byte-compared against the prototype JSON in `test/props-registry.js`)
and all 19 native-canvas instances. Four of them — `roadhouse-table-02`,
`roadhouse-chair-03`, `roadhouse-chair-04`, `roadhouse-candle-02` — are shifted **up
exactly one tile** from the prototype, preserving the cluster's internal layout.
The prototype's 12-tile-tall room puts that cluster on rows 9–10; the real map's
row 9 is the south wall, and `roadhouse-table-02`'s footprint landed on the south
door tile `8,9`, which the Roadhouse lock refuses. This is prototype-vs-map drift,
not a validation bug — the handoff itself says the prototype is "not to be promoted
as-is". Nothing ships visually from it: the flag is off.

### 8. Atlas path

`assets/prototypes/direct-reference/expanded/runtime/roadhouse-props-expanded-atlas.png`
(256x96), the prototype PNG, as the milestone allows. Promoting it to
`assets/props/roadhouse.png` is a file move plus one string per definition; the
frame-bounds reject reads the PNG IHDR, so the new file is checked the same way.

### 9. `--repin` is not applicable

Props carry no pinned placement — Cast Presence owns pins — so the props target
prints `REPIN --repin does not apply to world/props.json` and ignores the flag.

## Validation matrix

Every rule below has a named error and one test case. `test/props-registry.js`
drives the rule directly; `test/props-changeset.js` drives the same rule through
the CLI and asserts the exit code and that nothing was written.

| Rule | Error text (fragment) | Test |
| --- | --- | --- |
| missing definition | `missing definition "…"` | props-registry.js:104, props-changeset.js (exit 1) |
| duplicate instance id | raw-text scan, `duplicate instance id` | props-registry.js:131 |
| frame outside atlas (x) | `falls outside atlas` | props-registry.js:105 |
| frame outside atlas (y) | `falls outside atlas` | props-registry.js:106 |
| atlas file missing | `does not exist` | props-registry.js:107 |
| NaN tx | `.tx must be a finite number` | props-registry.js:108 |
| non-numeric ty | `.ty must be a finite number` | props-registry.js:109 |
| tx off canvas | `falls outside roadhouse` | props-registry.js:110, props-changeset.js (exit 1) |
| ty off canvas | `falls outside roadhouse` | props-registry.js:111 |
| negative tx | `falls outside roadhouse` | props-registry.js:112 |
| sub-pixel tx | `must land on a whole pixel` | props-registry.js:113 |
| transform not allowed | `transform flipX is not allowed by …` | props-registry.js:114, props-changeset.js (exit 1) |
| unknown transform in a definition | `.transforms may only list flipX` | props-registry.js:115 |
| instance layer not an integer | `.layer must be an integer 0..9` | props-registry.js:116 |
| instance layer out of 0..9 | `.layer must be an integer 0..9` | props-registry.js:117, props-changeset.js (exit 1) |
| defaultLayer out of 0..9 | `.defaultLayer must be an integer 0..9` | props-registry.js:118 |
| unknown instance field | `has unknown field "…"` | props-registry.js:119 |
| unknown definition field | `has unknown field "…"` | props-registry.js:120 |
| scene with no canvas | `has no canvas in world/props.json` | props-registry.js:121 |
| anchor outside its frame | `falls outside its own frame` | props-registry.js:122 |
| malformed footprint | `.footprint must be an array of [dx, dy] integer pairs` | props-registry.js:123 |
| bad instance id | `instance id must be kebab-case` | props-registry.js:124 |
| bad definition id | `definition id must be dotted lowercase` | props-registry.js:125 |
| canvas not whole tiles | `.canvas must be [w, h], positive whole tiles` | props-registry.js:126 |
| PNG IHDR reader itself | `is not a PNG (no IHDR)` | props-registry.js:136 |
| canvas smaller than its map | `is smaller than the map` | props-registry.js:182 |
| scene that is not a map | `is not a map in js/maps.js` | props-registry.js:183 |
| **LOCK** roadhouse rows changed | `map rows changed (props never own collision)` | props-registry.js:190 |
| **LOCK** south door tile claimed | `south door tile 7,9 is claimed by …` | props-registry.js:179, props-changeset.js (exit 1) |
| **LOCK** pay phone tile claimed | `pay phone tile 8,5 is claimed by …` | props-registry.js:180 |
| **LOCK** pay phone not walkable | `pay phone tile 8,5 is not walkable` | rule present in `propsWorldProblems`; unreachable while the rows lock holds, so no case |
| **LOCK** stage moved south | `the stage stays north` | props-registry.js:181, props-changeset.js (exit 1) |
| **WARN** footprint on a door tile | `is a door tile` | props-registry.js:164 |
| **WARN** footprint on an interact tile | `is the scene-objects interact tile "olio"` | props-registry.js:173 |
| **WARN** footprint on a body tile | `is a Cast Presence body tile` | props-registry.js:165 |
| changeset: create of an existing id | `creates …, which already exists` | props-changeset.js (exit 2) |
| changeset: upsert/delete of unknown id | `upserts/deletes unknown instance …` | props-changeset.js (exit 2) |
| changeset: unknown op | `.op must be create, upsert or delete` | props-changeset.js (exit 2) |
| changeset: two ops on one id | `is a second operation on …` | props-changeset.js (exit 2) |
| changeset: upsert changes propId/sceneId | `changes propId/sceneId of …` | props-changeset.js (exit 2) |
| changeset: unknown field / touches definitions | `carries unknown field "…"` | props-changeset.js (exit 2) |
| changeset: wrong version / target | `version must be 2` / `target must be world/props.json` | props-changeset.js (exit 2) |
| changeset: two props parts in a bundle | `bundle carries a second changeset for …` | props-changeset.js (exit 2) |
| delete refused: id referenced under js/ test/ narrative/ | `REFUSED delete …: referenced by N file(s)` | props-changeset.js |
| rollback after a failed check | `ROLLED BACK world/props.json, js/props.gen.js` | props-changeset.js |

The seeded slice itself warns once (`roadhouse-booth-01` overlaps the Log Lady's
body tile `roadhouse 2,6`). That is data to look at when M10 turns the flag on,
not a defect in the layer.

## Two things the harness needed

**`?freezeMs=N` in `test/retro-scene.html`.** The milestone asks for a PNG
byte-compare with the flag off. That was impossible as written: five successive
`test/shot.sh --retro` captures of the same Roadhouse camera produced five
different PNGs (`14400 / 14395 / …` bytes), because the scene animates off the real
clock. The new opt-in parameter pins `performance.now`, `Date.now`, the rAF
timestamp and `Math.random` before any game script loads. Absent the parameter the
page behaves exactly as before; with it, repeated captures are byte-identical, and
`test/props-flag-off.js` asserts that reproducibility explicitly before comparing
anything.

**Atlas URLs resolve against the script, not the document.** Atlas paths are
repo-root relative, and `test/retro-scene.html` sits one level down, so the first
flag-on capture drew nothing at all — and the byte-compare passed for the wrong
reason. `js/props-production.js` now resolves atlases against its own
`document.currentScript.src`, and preloads every atlas at install time rather than
on first draw, so a capture cannot land before decode. `test/props-flag-off.js`
keeps the guard that made this visible: a flag-ON shot must **differ** (14388 vs
27700 bytes), otherwise the whole comparison is vacuous.

## What M10 (the UI milestone) needs from this layer

- `GAME.WorldData.props` — frozen `{ version, tilePx, scenes, definitions, instances }`.
- `GAME.Props.instancesFor(sceneId)` — the scene's instances already in draw order,
  each `{ id, inst, def, layer, foot }`; `GAME.Props.originOf(entry)` — the exact
  pixel origin, the same function the renderer uses, for ghost preview and hit test.
- `GAME.Props.drawScene(ctx, sceneId, cx, cy)` — one scene, honouring the flag;
  `install()` / `uninstall()` for a preview canvas.
- `definitions[*].tags` for the catalog grouping/search, `.transforms` for which
  buttons to enable (flip only where allowed), `.footprint` for the selection
  outline and the overlap warnings.
- Still missing, and M10's work: an editor core (`js/editor/core/props.js`) with a
  store/draft/history like `scene-objects.js`, `buildPropsChangeset`, and moving the
  format registration out of `liftProps`. Definitions stay hand-edited for now —
  no op reaches them.
- Depth: props currently draw once, on the last depth band, above every actor. A
  character cannot walk behind a prop yet. Banding them by foot y is an M10 change
  in the same wrapper.

## Files

```
world/props.json            new   12 definitions, 19 instances
js/props.gen.js             new   generated, 517 lines
js/props-production.js      new   runtime consumer, flag-gated
tools/world-apply.js        +~380 props target, validation, changeset, regenProps
index.html                  +2    props.gen.js + props-production.js after roadhouse-production.js
test/retro-scene.html       +2 +freezeMs harness mode
test/props-registry.js      new   53 checks
test/props-changeset.js     new   47 checks
test/props-render-order.js  new   21 checks
test/props-flag-off.js      new   9 checks, 5 Chrome captures
reports/opus-world-builder-m9-props.md
```

`tools/world-apply.js` also gains `roadhouse-art.js`, `roadhouse-scene.js`,
`roadhouse-production.js`, `props.gen.js` and `props-production.js` in its boot
`CHAIN` (index.html order) — the Roadhouse locks validate against the booted scene.

## Gate output

```
$ node test/smoke.js
415 controlli superati ✔

$ node test/walkthrough.js
OK: cammino completo simulato, 85 acquisizioni, finale raggiunto ✔

$ node test/retro-production.js
RETRO-PROD-PASS 54/54

$ node test/mobile-production.js
MOBILE-PROD-PASS 20/20

$ node test/cast-continuity-validate.js
cast-continuity-validate: V1 exactly-one PASS · V2 zero-overlaps PASS · V3 no-implicit-absence PASS · V4 order-independence PASS · RC8 order independence (Act 3 chain) PASS · V5 world-window-pins PASS · V5b scene-required-presence PASS · V6 causal-transitions PASS · V6b no-silent-vanish-entry PASS · V7 single-body-owner PASS · V8 save-determinism PASS · terminal lint PASS

$ node test/act-4-flow.js
act-4-flow: 1611/1611

$ node test/act-4-playthrough.js
act-4-playthrough: 530/530 assertions passed

$ node test/act-3-flow.js
act-3-flow: 280/280

$ node test/act-3-playthrough.js
act-3-playthrough: 189/189 assertions passed

$ node test/genmaps.js
ok diner access

World Builder suites listed by the M5-M8 reports:

$ node test/catalog-write.js
CATALOG-WRITE-PASS 39

$ node test/editor-runtime-isolation.js
EDITOR-RUNTIME-ISOLATION-PASS 7

$ node test/legacy-door-inventory.js
LEGACY-DOOR-INVENTORY-PASS sources=0 live=0 shadowed=0 conflict=0 booted-doors=59 unowned=0

$ node test/location-connections.js
LOCATION-CONNECTIONS-PASS shared endpoint descriptors, generic mapping, atomic validation and uninstall, one-way records

$ node test/migrated-door-traversal.js
MIGRATED-DOOR-TRAVERSAL-PASS 45 checks: 4 gates, 14 paired leaves, 3 one-way crossings, no way back

$ node test/scene-objects-equality.js
SCENE-OBJECTS-EQUALITY-PASS 21 booted entries across 15 maps byte-identical to the pre-M8 fixture (+sourceId on 4), registry alone reproduces 20, 0 entries left in js/maps.js, 107 checks

$ node test/scene-objects-inventory.js
SCENE-OBJECTS-INVENTORY-PASS 21 booted entries, 0 entries left in js/maps.js

$ node test/world-door-equality.js
WORLD-DOOR-EQUALITY-PASS 59 door descriptors across 15 scenes byte-identical to the pre-M5 fixture (+connectionId on 17), registry alone reproduces 59, 0 classic entries left in js/maps.js

$ node test/world-engine-v0.1-catalog.js
WORLD-ENGINE-V0.1-CATALOG-PASS registration, immutable catalog, scoped lookups, shared connections, validation, authored references, single registry bijection, filter load-order, legacy-door report

$ node test/world-builder.js
WORLD-BUILDER-PASS 110/110

$ node test/cast-presence-sync.js
cast-presence-sync: 264/264

$ node test/world-apply.js
WORLD-APPLY-PASS 91

$ node test/world-apply-objects.js
WORLD-APPLY-OBJECTS-PASS 44

$ node test/world-apply-cast.js
WORLD-APPLY-CAST-PASS 47

$ node test/world-builder-browser.js
WORLD-BUILDER-BROWSER 188/189

  PRE-EXISTING, not caused by M9. Case 15 expects "24 repins previewed" and the
  fixture now resolves 28 (the ACT5_* pins). Verified by running the same suite in
  a clean `git worktree` of main at ba8e67f: 188/189, the identical case 15 failure.

The four new tests:

$ node test/props-registry.js
PROPS-REGISTRY-PASS 12 definitions, 19 instances, 53 checks

$ node test/props-changeset.js
PROPS-CHANGESET-PASS 47 checks

$ node test/props-render-order.js
PROPS-RENDER-ORDER-PASS 21 checks

$ node test/props-flag-off.js
PROPS-FLAG-OFF-PASS 9 checks, roadhouse 7,6 up, 14388 byte shot

  A (this tree), A again, B1 (prop layer stripped) and B2 (git worktree of main)
  all hash to 17f2dc56a4b7dfb5d1d6663f7ca46b6b, 14388 bytes.
  C (flag forced ON) is 24f6fd104eaf204adb0834ec79d640f4, 27700 bytes — different,
  so the byte-compare is not vacuous.

Counts vs the last MEMORY entry: smoke 415, walkthrough 85 acquisitions,
act-4-flow 1611/1611, act-4-playthrough 530/530 — unchanged, none dropped.
Artifacts rewritten by the Chrome suites (artifacts/act-4-implementation,
artifacts/act-3-closure, artifacts/cast-presence-v0.1, artifacts/world-builder-m6..m8)
were restored with `git checkout -- artifacts/`; `git status` shows none modified.
```
