# World Builder M8 — scene objects and interact keys into a registry, then editable

Branch `qwen/night-world-builder-m8-objects`, worktree `.worktrees/m8`. Not pushed.

**Base commit.** M7 was committed on its branch but not merged into main when M8 started. M8 branches from the M7 tip
`662702e` (main `b124584` + the three M7 commits), as "b124584+" allows, so the M7 bundle is available. Merge M7 first,
then M8.

After M8, every scene object and interact key the game boots from a `js/maps.js` map lives in
`world/scene-objects.json`. `js/maps.js` carries no `objects` or `interact` key on any map. `js/glue.js` reads only the
registry, and throws when a map still carries either key or when the registry is not loaded. In the Builder, an object
or interact key can be moved, resized (rects), deleted, created and exported. `tools/world-apply.js` applies the
export on its own or inside the M7 bundle.

## Phase 1 — inventory

`node test/scene-objects-inventory.js` boots the index.html chain. At `662702e` it found 4 `objects[]` entries and
16 `interact` keys in `js/maps.js`, which boot as 21 entries on 15 maps. The 21st entry comes from a native scene file.
Commit `6f335fa` pins those counts and writes the fixture `test/fixtures/objects-before-m8.json` (source blocks plus
booted `GAME.Maps[*].objects`).

| scene | origin | type/kind | tile or rect | dialogue | sparkle |
| --- | --- | --- | --- | --- | --- |
| hospital | maps.js interact "3,5" = ronette_letto | plain | 3,5 | ronette_letto | no |
| palmer | maps.js interact "6,1" = cameraLaura | sparkle | 6,1 | cascade [{"cond":"flag:done_andy","then":"laura_room_andy"},"laura_room"] | yes |
| room_315 | maps.js interact "13,3" = specchio315 | sparkle | 13,3 | cascade [{"cond":"flag:gigante1","then":"specchio_dopo"},{"cond":"flag:jacques_morto","then":"gigante1_dlg"},"specchio315"] | yes |
| room_315 | maps.js interact "1,5" = letto_315 | plain | 1,5 | letto_315 | no |
| room_315 | maps.js interact "2,5" = letto_315 | plain | 2,5 | letto_315 | no |
| room_315 | maps.js interact "3,5" = letto_315 | plain | 3,5 | letto_315 | no |
| room_315 | maps.js interact "8,3" = scrivania_315 | plain | 8,3 | cascade [{"cond":"evidence:T1_RONETTE_BOB","then":"scrivania_315_bob"},"scrivania_315"] | no |
| sheriffs_station_exterior | native scene (own map record) | plain | 9,6 | bacheca_centrale | no |
| town | maps.js objects[0] | landmark/waterfall | 1,0 5x6 | landmark_waterfall | no |
| town | maps.js objects[1] | landmark/cemetery | 48,21 6x4 | landmark_cemetery | no |
| town | maps.js objects[2] | landmark/tracks | 53,1 2x33 | cascade [{"cond":"nflag:vagone_scoperto","then":"landmark_tracks_vagone"},{"cond":["evidence:E6A_CUORE_INTERO","evidence:T_JAMES_EST"],"then":"landmark_tracks_route"},"landmark_tracks"] | no |
| town | maps.js objects[3] | landmark/welcomesign | 30,30 | sign_town | no |
| town | maps.js interact "30,30" = cartello | plain | 30,30 | sign_town | no |
| town | maps.js interact "15,28" = lago_riva | plain | 15,28 | cascade [{"cond":"flag:maddy_trovata","then":"lago_dopo"},{"cond":"flag:sogno_fatto","then":"lago_sguardo"},"lago_laura"] | no |
| town | maps.js interact "50,22" = tomba_laura | plain | 50,22 | tomba_laura | no |
| traincar | maps.js interact "4,6" = sign_ponte | plain | 4,6 | sign_ponte | no |
| traincar | maps.js interact "20,2" = sign_oej | plain | 20,2 | sign_oej | no |
| traincar | maps.js interact "13,6" = mucchio_terra | sparkle | 13,6 | mucchio_terra | yes |
| traincar | maps.js interact "13,5" = anello_interact | sparkle | 13,5 | anello_interact | yes |
| woods | maps.js interact "14,12" = olio | sparkle | 14,12 | olio | yes |
| woods | maps.js interact "11,16" = cartelloBosco | plain | 11,16 | sign_grove | no |

The remaining 6 maps (arrival, sheriff, hotel_gn, diner, redroom, oej, roadhouse) had `interact: {}` and no objects.
`double_r_exterior_prototype` boots an empty `objects[]` from its own scene file.

Notes:
- **Two entries share town 30,30.** The welcome-sign landmark and the `cartello` interact key both bind `sign_town`.
  `GAME.Maps.objectAt` returns the landmark, the first match.
- **Native scene objects stay out of the registry.** `sheriffs_station_exterior` (`bacheca_centrale`) and
  `double_r_exterior_prototype` build their own map records in their scene files, which glue never touches. The
  Builder shows the bacheca as a read-only overlay, as before.
- **Six interact ids are not `INTERACT_DLG` keys.** `ronette_letto`, `letto_315`, `sign_ponte`, `sign_oej`,
  `mucchio_terra` and `anello_interact` fall through as their own dialogue id.

## Phase 2 — registry

### Schema

```json
{ "version": 1,
  "scenes": {
    "<map id in js/maps.js>": {
      "objects": [ { "sourceId": "welcome-sign", "type": "landmark", "kind": "welcomesign", "x": 30, "y": 30, "dialogue": "sign_town" } ],
      "interact": { "x,y": "<interact id>" } } } }
```

- **Scenes.** All 13 `js/maps.js` maps are present, in `js/maps.js` order, including those with empty
  `objects`/`interact`, so NEW OBJECT works on any of them.
- **Entries.** Objects and interact keys are copied verbatim, in authored order. Dialogue cascades, including the
  tracks `cond` array, are untouched data.
- **sourceIds.** `waterfall`, `cemetery`, `tracks`, `welcome-sign`: kebab-case, unique per scene. A sourceId may not
  start with `interact-`, which the Builder reserves for interact item ids.
- **Generator.** `test/gen-world-data.js` validates the shape and writes `js/scene-objects.gen.js`, which sets
  `GAME.WorldData.sceneObjects = { version, scenes }` deep-frozen.
  - It validates exactly `objects[]` + `interact{}` per scene; known object fields; kebab unique sourceId; integer
    tiles; `w`/`h` together; dialogue as an id or a `{cond, then}` cascade; `"x,y"` keys.
  - The scene objects file is written first, so the last output line is still the connections line that M6's
    `world-apply` prints.
- **Load order.** The binding loads right before `glue.js` in `index.html`, `world-builder.html`, `tools/world-apply.js`
  and every test chain and harness page that loads glue: 83 files, one inserted line or array element each. The
  reviewer checked that no loader of glue lacks it.

### glue.js

- `GAME.WorldData.sceneObjects` missing → throws `load js/scene-objects.gen.js before js/glue.js`. This goes further
  than "when present": without the registry every map would silently lose its objects.
- A registry scene that is not a `js/maps.js` map → throws.
- A map that still has its own `objects` or `interact` key, even an empty one → throws (no dual source).
- Objects are emitted per map as before: registry `objects[]` first (each copied, with `sourceId` moved to the last key),
  then one entry per interact key through `INTERACT_DLG` / `SPARKLE`.
- `GAME.INTERACT_SPARKLE` is newly exposed, next to `GAME.INTERACT_DLG`.
- **`TRANSFORMED_KEYS` keeps `interact` and `objects`.** Glue still reshapes these keys, and smoke's field-propagation
  guard lists them.

### js/maps.js

Every `objects`/`interact` block was deleted: 46 changed lines, no row touched. Neither key is kept.
- **glue** no longer reads them, and refuses them.
- **genmaps** anchors `--write-diner` on `doors:` only. `node test/genmaps.js` output is byte-identical to the base.

### Tests that read `js/maps.js` interact keys now read the registry

`test/smoke.js` (interact→dialogue guard, which keeps 415), `test/level-autopsy.js` and `test/town-map-coherence.js`.
Their stdout is identical to the base.

### Equality diff (verbatim, `node test/scene-objects-equality.js`)

```
SCENE-OBJECTS-EQUALITY-DIFF vs test/fixtures/objects-before-m8.json
migrated (block deleted from js/maps.js; entry now in world/scene-objects.json): 20 source entries on 13 maps
booted entries: 21 before, 21 after; byte-identical except +sourceId on 4
  town[0] +sourceId waterfall  {"type":"landmark","kind":"waterfall","x":1,"y":0,"w":5,"h":6,"dialogue":"landmark_waterfall"}
  town[1] +sourceId cemetery  {"type":"landmark","kind":"cemetery","x":48,"y":21,"w":6,"h":4,"dialogue":"landmark_cemetery"}
  town[2] +sourceId tracks  {"type":"landmark","kind":"tracks","x":53,"y":1,"w":2,"h":33,"dialogue":[{"cond":"nflag:vagone_scoperto","then":"landmark_tracks_vagone"},{"cond":["evidence:E6A_CUORE_INTERO","evidence:T_JAMES_EST"],"then":"landmark_tracks_route"},"landmark_tracks"]}
  town[3] +sourceId welcome-sign  {"type":"landmark","kind":"welcomesign","x":30,"y":30,"dialogue":"sign_town"}
SCENE-OBJECTS-EQUALITY-PASS 21 booted entries across 15 maps byte-identical to the pre-M8 fixture (+sourceId on 4), registry alone reproduces 20, 0 entries left in js/maps.js, 107 checks
```

**Allowed extra field.** `sourceId` is added as the last key on the 4 town objects. Interact-derived entries carry no
sourceId.

**What the equality test also checks:**
1. No map in `js/maps.js` has either key.
2. For every map, the registry alone dictates the booted objects byte for byte.
3. Every dialogue id, including cascade `then`s and defaults, exists in `GAME.Data.dialogues`. The brief says
   `GAME.DIALOGUES`, which does not exist; the game's table is `GAME.Data.dialogues`.
4. Glue run in a VM sandbox throws for a map with `objects`, a map with `interact`, and a missing registry.
5. The generator, run on a temp copy, reproduces the committed binding (stale guard).

**`--registry-only`** skips the fixture comparison. `tools/world-apply.js` uses it after writing: once an entry has
moved, the pre-M8 fixture no longer applies, but checks 1–5 must still hold.

`node test/scene-objects-inventory.js` now prints `0 entries left in js/maps.js`.

## Phase 3 — Builder

### Core: `js/editor/core/scene-objects.js` (game-free, `Editor.sceneObjects`)

**Store.** `base`/`draft` map scene → `{ objects: [entry], interact: [{ ref, x, y, id }] }`. An interact key's `ref`
is its base `"x,y"` (or `new-<n>` when created), so its identity survives a move.

**Operations and validation.**
- **Operations:** `moveObject`, `resizeObject` (rects only), `deleteObject`, `createObject`, `moveInteract`,
  `deleteInteract`, `createInteract`, `revertEntry`.
- **NEW OBJECT inputs:** `kinds` (the kinds already present, with their type) and `suggestSourceId`.
- **`draftErrors`:**
  - bounds, including a rect's far edge;
  - duplicate sourceId;
  - two interact keys on one tile;
  - a created object needs an existing single dialogue id; a cascade is refused ("cascades are hand-edited");
  - a created interact key needs an `INTERACT_DLG` id.
- **`missionReferences`:** mission nodes holding an id as an exact string value, such as `target_id`. Prose that only
  contains the word, like "il cartello", does not count.

**Changeset `scene-objects-changeset` v1, target `world/scene-objects.json`:**

```json
{ "op": "upsert", "scene": "town", "sourceId": "welcome-sign", "object": { "...": "whole entry" } }
{ "op": "create", "scene": "woods", "sourceId": "grove-sign", "object": { "...": "whole entry" } }
{ "op": "delete", "scene": "town", "sourceId": "cemetery" }
{ "op": "upsert", "scene": "traincar", "interact": "13,5", "to": "13,7" }
{ "op": "create", "scene": "woods", "interact": "13,12", "id": "olio" }
{ "op": "delete", "scene": "traincar", "interact": "4,6" }
```

**`applyObjectsChangeset` is strict.**
- **Refused ops:** unknown scene or entry; creating an existing sourceId; two ops on one entry; a bad shape.
- **Upsert limits:** an upsert may change only `x`/`y`/`w`/`h`. Changing `dialogue`, `type` or `kind`, or adding or
  dropping `w`/`h`, is refused.
- **Created objects** bind one dialogue id.
- **Interact keys:** a moved key keeps its place in key order; an interact key collision after all ops is refused.

`splitChangesets` (M7, `js/editor/core/cast.js`) accepts the third target, so a `world-builder-bundle` may carry
connections, cast and scene objects, one changeset each.

### Builder UI (`js/world-builder.js`, `js/world-builder-core.js`, `js/world-builder-data.js`)

**Items and history.**
- **Registry objects** are editable items `object:<scene>:<sourceId>`. **Interact keys** are
  `object:<scene>:interact-<ref>`, where `ref` is the base `x,y` with a dash, or `new-<n>`.
- Scenes without a registry entry keep read-only booted overlays.
- History holds `{ conn, cast, objects }`: one undo stack.
- `objectsContext(GAME)` is the only game-aware piece: registry, map sizes, `GAME.Data.dialogues`, `INTERACT_DLG` and
  sparkle flags, and `GAME.NarrativeData.missions`. `test/world-builder.js`'s API pin gains it.

**ON THIS TILE.** Lists every item under the last clicked tile. Clicking 30,30 lands on the topmost item (the
`cartello` key); the chip selects the welcome sign.

**EDIT on an object:**
- **MOVE:** click the new origin.
- **RESIZE:** `w`/`h` inputs, rects only.
- **REVERT.**
- **DELETE:** with a confirm step. DELETE is disabled while MISSION REFS is non-empty, and the refusal names the
  mission node.
- The inspector shows source id, type/kind, tile, size, dialogue (a cascade is labelled "conditions are
  hand-edited"), draft state and mission refs.

**EDIT on an interact key:** MOVE / DELETE / REVERT, with the same guard. The ids checked are the interact id and its
resolved dialogue ids.

**NEW OBJECT** (toolbar, EDIT, registry scene):
- kind select, limited to the kinds present;
- sourceId, suggested kebab-case and editable;
- dialogue id;
- size;
- PICK TILE on the canvas;
- live errors, then CONFIRM.

**NEW INTERACT:** id select over glue's `INTERACT_DLG` keys, PICK TILE, live errors, CONFIRM.

**Canvas.** Changed entries leave a dashed original. A draft with errors turns its changed entries red. Validation
lists the ops, and EXPORT is blocked by `scene-objects:<scene>` errors. Export is a bare `scene-objects-changeset`, or
a bundle when other targets changed.

### `tools/world-apply.js`, objects part

1. Strict apply (exit 2 on refusal).
2. **Validation against the booted game** (exit 1):
   - with `objectErrors` / `interactErrors`: bounds, dialogue ids, `INTERACT_DLG` for a created key;
   - a created object's kind/type must already be present.
3. **Delete guard:** a delete is refused when a node in `narrative/missions/*.json` holds the entry's dialogue id or
   interact id as a value. The nodes are listed, and nothing is written.
4. **Write:**
   - Walkthrough runs first to record its acquisition count.
   - Then `world/scene-objects.json` (2-space JSON) → `test/gen-world-data.js` → `test/scene-objects-equality.js
     --registry-only` → `test/smoke.js` → `test/walkthrough.js`.
   - A failure, or walkthrough acquisitions dropping below the count before the write, restores
     `world/scene-objects.json`, `js/scene-objects.gen.js` and `js/world-connections.gen.js` (plus every file of the other
     bundle parts) byte for byte.

The smoke/walkthrough step was added after review. Act 1 clue sources are classic interact keys that no mission node
references. Deleting woods 14,12 `olio` passes every structural check but drops walkthrough from 85 to 84
acquisitions. The tool now rolls that back.

## Phase 4 — proof

### Browser (`node test/world-builder-browser.js`, real page, headless Chrome)

**189/189 passed:** M4b–M7's 153 checks plus 36 new ones. The run was on `eb071f4`, before the review fixes.
- **After the review fixes** (`c8d0610`), cases 16–19 were rerun with `WB_ONLY_M8=1`: 36/36.
- **Not rerun:** the M4b–M7 cases, which use no file those fixes touch.
- **Hashes:** `world/scene-objects.json` and `world/connections.json` are unchanged across every case.

| case | what it proves | files in `artifacts/world-builder-m8/` |
| --- | --- | --- |
| 16 — welcome sign | click 30,30 hits `cartello`; ON THIS TILE selects `welcome-sign`; EDIT, MOVE → 31,30; export is a bare `scene-objects-changeset` with one upsert; `--dry-run` exits 0, diff `@@ line 57  -"x": 30,  +"x": 31,`; Ctrl+Z restores | `case16-before.png`, `case16-moved.png`, `case16-export.png`, `case16-changeset.json`, `case16-dry-run.txt` |
| 17 — tracks rect | click 53,10 selects `tracks`; h 33 → 30 is one upsert with the cascade untouched; h 40 is red, `falls outside town (56x36)`, EXPORT BLOCKED; `--dry-run` VALID, one `h` line | `case17-invalid.png`, `case17-resized.png`, `case17-changeset.json`, `case17-dry-run.txt` |
| 18 — delete refused | traincar 20,2 `sign_oej`: MISSION REFS `M5 m5_sign_oej (sign_oej)`, DELETE disabled with the refusal; `sign_ponte` 4,6 has no refs and deletes after a confirm step; Ctrl+Z restores it in key order | `case18-delete-refused.png` |
| 19 — NEW INTERACT | id list = the 10 `INTERACT_DLG` keys; `olio` on 14,12 refused (`two interact keys on 14,12`, CONFIRM disabled); 13,12 valid → created, selected, SPARKLE yes; `--dry-run` VALID `+ "13,12": "olio"`; REVERT removes it | `case19-new-interact.png`, `case19-export.png`, `case19-changeset.json`, `case19-dry-run.txt` |

`case16-dry-run.txt` (verbatim):

```
TARGET world/scene-objects.json :: town object welcome-sign
BEFORE {"sourceId":"welcome-sign","type":"landmark","kind":"welcomesign","x":30,"y":30,"dialogue":"sign_town"}
AFTER  {"sourceId":"welcome-sign","type":"landmark","kind":"welcomesign","x":31,"y":30,"dialogue":"sign_town"}
DIFF world/scene-objects.json
  @@ line 57
  -           "x": 30,
  +           "x": 31,
VALID 1 scene object change(s) against real maps and dialogues
DRY-RUN 1 scene object change(s); nothing written
```

### Node tests (new)

- **`test/editor/scene-objects.js` — 74 checks:**
  - store, operations, refusals;
  - draft validation;
  - strict apply refusals, including shape;
  - a moved or deleted key followed by a new key on the same tile;
  - byte-stable round trip on the real registry: the sign move changes exactly one line;
  - mission references on the real missions;
  - the three-target bundle split.
- **`test/world-apply-objects.js` — 44 checks, temp copies:**
  - dry-run; apply + regen + registry-only equality + smoke 415 + walkthrough 85; NO-OP; move back restores bytes;
  - resize; create/delete of an object and of a key, each restoring bytes;
  - the `sign_oej` delete refusal; the olio delete rolled back on acquisitions 85 → 84;
  - refusals (exit 2) and invalid drafts (exit 1);
  - rollback on an injected generator or equality failure;
  - bundles:
    - an `atto3` gate on the station door rolled back by walkthrough;
    - a rollback from the objects part restores the connections part too;
    - a harmless bundle applies both parts.
- **`test/scene-objects-inventory.js`** and **`test/scene-objects-equality.js`**.

**CI.** `.github/workflows/test.yml` gains 4 steps: editor/scene-objects, scene-objects-inventory,
scene-objects-equality, world-apply-objects. That makes 33 steps, 31 `node` runs (M7: 27). YAML parsed with Ruby.

### Gates on the branch (real repo, `c8d0610`)

| gate | result |
| --- | --- |
| `node test/smoke.js` | 415 |
| `node test/walkthrough.js` | 85 acquisitions |
| `node test/world-builder.js` | 110/110 |
| `node test/world-door-equality.js` | PASS (59 descriptors) |
| `node test/scene-objects-equality.js` | PASS (21 entries, +sourceId on 4, 107 checks) |
| `node test/scene-objects-inventory.js` | PASS, 0 entries left in js/maps.js |
| `node test/act-3-flow.js` | 280/280 |
| `node test/act-4-flow.js` | 1611/1611 |
| `node test/cast-presence-sync.js` | 232/232 |
| `node test/cast-continuity-validate.js` | V1–V8 PASS |
| `node test/world-apply.js` / `world-apply-cast.js` / `world-apply-objects.js` | 91 / 47 / 44 |
| editor suites: scene-objects / cast / edit / world-builder-core / runtime-isolation | 74 / 54 / 129 / 27 / 7 |
| `test-world-registry`, `legacy-door-inventory`, `migrated-door-traversal` (45), `world-engine-v0.1-catalog` | PASS |
| `node test/genmaps.js` | exit 0, output byte-identical to the base |
| Chrome `node test/act-3-playthrough.js --path=all` | 189/189 (1 console error, as in the M7 run) |
| Chrome `node test/act-4-playthrough.js --path=all` | 530/530 (1 console error: favicon.ico 404) |
| Chrome `node test/world-builder-browser.js` | 189/189 (`eb071f4`); M8 cases 36/36 on `c8d0610` |

The Chrome drivers regenerated tracked artifacts (`artifacts/act-3-closure/`, `artifacts/act-4-implementation/`,
`artifacts/world-builder-m6/`, `artifacts/world-builder-m7/`). Those were restored with `git checkout`, not committed.

### Whole-suite sweep

**Scope.** Every `node test/*.js` and `test/editor/*.js` ran with a 180 s cap. Excluded:
- the Chrome drivers: act-3/4-playthrough, capture-chrome, native-shot, performance-gate, step6-driver,
  visual-audit-capture, world-builder-browser;
- generators: `gen-*`, `genmaps`.

**Base vs branch.** The base is `662702e`, in a detached worktree. The branch is `c8d0610`, also detached.
- **Exit codes:** all 123 base tests have the same exit code on the branch. 32 fail on both, for example act-2-flow,
  character-life, the probe-act*-pacing tests, sheriffs-station-location, station-population and traincar-native.
- **New tests:** the 4 new ones exit 0.
- **Phase 2 sweep:** a sweep after Phase 2 (`9332786`) already matched.

## Files

- **Registry and runtime:**
  - `world/scene-objects.json` (new), `js/scene-objects.gen.js` (new, generated)
  - `js/glue.js`, `js/maps.js` (objects/interact blocks only)
  - `index.html` (one script line)
- **Editor and Builder:**
  - `js/editor/core/scene-objects.js` (new), `js/editor/core/index.js`, `js/editor/core/cast.js` (bundle split only)
  - `js/world-builder.js`, `js/world-builder-core.js`, `js/world-builder-data.js`, `world-builder.html`
- **Tools:** `tools/world-apply.js`, `test/gen-world-data.js`.
- **Tests (new):**
  - `test/scene-objects-inventory.js`, `test/scene-objects-equality.js`
  - `test/editor/scene-objects.js`, `test/world-apply-objects.js`
  - `test/fixtures/objects-before-m8.json`
- **Tests (updated):**
  - smoke, level-autopsy, town-map-coherence (read the registry);
  - world-builder (API pin), editor/cast (writable-targets message), world-builder-browser (cases 16–19);
  - every chain that loads glue: one inserted `scene-objects.gen.js`, 78 test files and harness pages plus
    `artifacts/world-character-audit/tools/presence-enumerator.js`.
- **CI, artifacts, report:** `.github/workflows/test.yml`, `artifacts/world-builder-m8/` (14 files), this report.

**Boundary.** Nothing under `js/retro*.js`, `js/tiles.js`, map rows, `world/connections.json`, `js/world-catalog.js`,
`narrative/**` or `narrative/cast/` changed. The `test/retro-*.html` and `test/cast-*.js` entries in the diff are only
the inserted script line. `js/editor/core/cast.js` changed only where `splitChangesets` learns the third bundle target.

## Commits

- `6f335fa` test(world): scene objects inventory + pre-M8 objects fixture
- `9332786` feat(world): scene objects and interact keys into world/scene-objects.json
- `91b657d` feat(world): scene objects changeset in the editor core and world-apply
- `eb071f4` feat(world-builder): M8 scene objects and interact keys editable in the Builder
- `c8d0610` fix(world): review fixes for the scene objects apply
- docs(reports): this report

## Limitations

1. **Narrative targets keep their own coordinates.** `js/narrative-engine-adapter.js` `WORLD_TARGETS` pins mission
   targets by tile: traincar `sign_oej` 20,2, `mound` 13,6, `ring` 13,5, `bridge_rail` 4,6, plus hospital and other
   entries. Moving the matching interact key in the Builder does not move the narrative target, so the M5 node would
   keep answering on the old tile. The adapter is outside M8's scope, and the Builder does not warn.
2. **The delete guard covers mission nodes and the walkthrough, nothing else.** The apply tool catches a deleted classic
   clue source through walkthrough acquisitions. In the Builder, DELETE is only disabled for mission references: deleting
   `olio` looks valid there, and the refusal comes at apply.
   - Smoke's check count is not compared: it has one check per dialogue binding, so it follows the number of entries.
   - A classic path that walkthrough does not cover is not guarded.
3. **NEW INTERACT offers only `INTERACT_DLG` keys** (per the brief). The six direct-id keys (`letto_315`,
   `ronette_letto`, `sign_ponte`, `sign_oej`, `mucchio_terra`, `anello_interact`) cannot be created as new keys; a new
   id needs a hand edit of `js/glue.js`.
4. **Hand-edited in `world/scene-objects.json`:**
   - cascades and their conditions, types, kinds;
   - renaming a sourceId;
   - changing an interact key's id;
   - reordering entries.

   **Also by hand:** adding a scene to the registry, and objects on native-scene maps (`sheriffs_station_exterior`,
   `double_r_exterior_prototype`), which glue does not build.
5. **A new object's kind** must already be present: welcomesign, waterfall, cemetery, tracks. All are `landmark`.
   Whether the renderer draws a new landmark of that kind at a new place was not checked; only the booted data and
   the dialogue binding are proven.
6. **Moves are not checked for walkability or overlap.** Objects may sit on solid tiles (signs do). Two objects may
   overlap, and the first match wins at runtime, as the 30,30 pair already shows. Only two interact keys on one tile
   are refused.
7. **Every glue chain must load the binding.** A page or harness that loads `glue.js` without `scene-objects.gen.js`
   now fails at boot instead of silently losing its objects. The artifact snapshot copies under
   `artifacts/station-population-v01/validation/canonical-before/` have their own `js/` and were not touched.
8. **One M6 rollback gap is left.** `gen-world-data` now writes both bindings, but a connections-only apply still lists
   only its own three files for rollback, so M6's rollback message does not change. `js/scene-objects.gen.js` is left
   out of that list, which matters only if the binding was already stale before the run; the equality stale guard in
   CI makes that unlikely.
9. **Merge order.** M8 contains the three M7 commits. `js/glue.js`, `js/maps.js`, `index.html` and many test files
   changed, and other sessions have edits in the main checkout (`js/retro-authored.js` is dirty there), so merge by
   hand if main moves first.

## Gaps (the editor pauses here)

- Narrative `WORLD_TARGETS` coordinates are a second coordinate source for interact targets (limitation 1).
- Interact ids outside `INTERACT_DLG` cannot be created; `INTERACT_DLG`/`SPARKLE` live in `js/glue.js`, not in data.
- Dialogue cascades, their conditions, and types/kinds are text-edited only.
- Native-scene map objects (`sheriffs_station_exterior`, `double_r_exterior_prototype`) are outside the registry.
- The Builder does not predict walkthrough/clue-graph breakage; only `world-apply` finds it, after writing a copy of the
  registry.
- No visual check that a moved or new landmark renders where its data says.
- Carried from M5–M7: the finale override drops `connectionId`; transition-bound cast bodies cannot move; outdoor spawn
  rule for `town-roadhouse`.
