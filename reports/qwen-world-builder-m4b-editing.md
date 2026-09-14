# World Builder M4b — editing wired

Branch `qwen/night-world-builder-m4b-editing` from `main` @ d199a28 (after the M4a merge 93c5f05).
Worktree `.worktrees/m4b`. Not pushed. Replaces `qwen-world-registry-editor.md` and
`qwen-world-builder-m4-registry-editing.md`.

## What a developer can now do

1. Serve the repo (`python3 -m http.server 8000`) and open `http://127.0.0.1:8000/world-builder.html`.
   Over `file://` the page still loads, but the story-moment list stays empty because it fetches a test fixture.
2. Pick a **SCENE**. Catalog scenes come first, then the maps outside the catalog (roadhouse, palmer,
   woods…).
3. Click a marker. The **INSPECTOR** shows its stable id. For a connection endpoint it shows
   CONNECTION, ENDPOINT, SCENE, TRIGGERS (chips that select the trigger), SPAWN x/y, FACING and PAIRED
   ENDPOINT. The **jump** button switches to the paired scene and selects the other endpoint.
4. Switch to **EDIT**. Then you can:
   - type spawn x/y or pick a facing;
   - **MOVE SPAWN**, then click a tile (it snaps to the integer tile);
   - select a trigger and use **MOVE** (click the destination) or **REMOVE**;
   - **ADD TRIGGER**, then click an empty tile. A tile that holds anything is refused with a notice.
   - `Esc` cancels a pending tile pick.
5. On the canvas the draft markers are solid, the original markers are dimmed and dashed, and an invalid
   draft is drawn red. A spawn outside the map is drawn clamped to the edge with an `OUT x,y` label. The
   header reads `WORLD BUILDER · N unsaved changes`. Drafts survive scene switches.
6. **VALIDATION** lists every invalid draft. The messages from `GAME.LocationConnections.validateConnection`
   are shown verbatim, plus these checks: connection id exists, endpoint exists, scene exists, and the paired
   endpoint is still valid.
7. Undo with **Ctrl+Z** (or UNDO). Revert with **REVERT SELECTED** or **REVERT ALL**; both can be undone too.
8. **EXPORT CHANGESET** opens a textarea with the JSON and a COPY button. While any draft is invalid, the
   export is blocked and a red warning names the invalid drafts.
9. Save the JSON and run `node tools/world-apply.js cs.json --dry-run`, then run it again without `--dry-run`.
10. **STORY MOMENT** (read-only) lists the seeds in `test/fixtures/cast-pins-acts-1-4.json`. Picking one
    redraws the NPCs from `GAME.CastPresence.resolveCast(state)`. The default is the baseline cast.

## Identity fix

Selection used to be keyed `kind:tx,ty`. Two items on one tile shared that key, and moving an item changed
it. Selection and hit-testing now use `js/editor/core/identity.js` ids, built by
`GameWorldBuilderCore.sceneItems(model, scene, {connections: draft, npcs})`:

| kind | id |
| --- | --- |
| endpoint | `connection-endpoint:<connectionId>:<a\|b>` |
| trigger | `trigger:<connectionId>:<a\|b>:<index>` (side added; before this, a/0 and b/0 collided) |
| npc | `npc:<characterId>:<scene>` |
| legacy door | `legacy-door:<scene>:<x>,<y>` (read-only, never moves) |
| object | `object:<scene>:<index>` (no authored object has a source id; `object:<scene>:<sourceId>` is supported) |

The canvas paints items in the order legacy-door < object < npc < trigger < endpoint. The same list is fed to
`Editor.hitTest`, so the item painted on top is the one a click selects. `identity.dedupe` throws if two items
ever share an id.

I also fixed a latent bug: every core module declared a top-level `const Editor`. Loading two of them as
`<script>` tags threw a redeclaration SyntaxError, which is why M4a could not load the core in a browser. They
are now plain IIFEs.

## Changeset schema

```json
{ "format": "world-connections-changeset", "version": 1, "target": "world/connections.json",
  "operations": [ { "op": "upsert", "id": "<connectionId>", "endpoints": ["a"], "connection": { "id": "...", "a": {}, "b": {} } } ] }
```

- The M4a contract is kept: each operation upserts a whole record, or `{op:"remove", id}` removes one.
  `endpoints` names the sides that changed.
- The export contains only connections that differ from the registry, sorted by id. Key order is ignored
  when comparing, so an edit followed by its inverse exports nothing.
- `Editor.edit.reapply(source, changeset)` is strict. It throws on an unknown connection id, an unknown
  endpoint (either in `endpoints` or as a record key), a missing endpoint, an id that disagrees with
  `connection.id`, or a `target` other than `world/connections.json`.

## CLI

```
node tools/world-apply.js <changeset.json> [--dry-run] [--root=<dir>]
```

The CLI:
- loads `world/connections.json` and reapplies the changeset strictly (exit 2 if refused);
- validates every resulting record against the real maps with `validateConnection` (exit 1 if invalid, nothing written);
- prints the following for each changed endpoint:

```
TARGET world/connections.json :: sheriffs-station-front-entrance
BEFORE {"scene":"sheriffs_station_exterior","triggers":[[7,6],[8,6]],"spawn":{"tx":7,"ty":7,"dir":"down"}}
AFTER  {"scene":"sheriffs_station_exterior","triggers":[[7,6],[8,6],[8,9]],"spawn":{"tx":8,"ty":8,"dir":"left"}}
```

Without `--dry-run` it writes only `world/connections.json` (record order and version kept, 2-space JSON),
then runs `test/gen-world-data.js`. If the changeset changes nothing it prints `NO-OP` and writes nothing.
`--root` exists only for the temp-fixture test.

## Legacy door inventory

These are map doors with no connection id. They appear as read-only `legacy-door` items (2 or 5 per map):

| map | doors → target |
| --- | --- |
| arrival | 4,8 → town |
| town | 9,6 → hotel_gn · 23,6 → hospital · 42,6 → palmer · 47,28 → roadhouse · 50,0 → woods |
| palmer | 7,11 / 8,11 → town |
| hotel_gn | 8,11 / 9,11 → town |
| hospital | 7,11 / 8,11 → town |
| woods | 14,4 → redroom · 14,21 → town |
| redroom | 8,11 → room_315 |
| roadhouse | 7,9 / 8,9 → town |

`test/world-builder.js` pins this set of maps.

## CI steps added

`.github/workflows/test.yml` went from 3 node steps to 21, one `node test/<file>.js` per step. Added:
- `test/editor/{changeset,edit,history,hit-test,identity,inspector,interaction,model,world-builder-core}.js`
- `test/world-door-equality.js`, `test/test-world-registry.js`, `test/apply-changeset.js`
- `test/editor-apply-preflight.js`, `test/editor-runtime-isolation.js`, `test/world-apply.js`
- `test/cast-continuity-validate.js`, `test/cast-presence-sync.js`, `test/world-engine-v0.1-catalog.js`

`test/world-builder.js`, smoke and walkthrough were already there. The browser proof needs Chrome, so it is
not in CI.

## Browser proof — `node test/world-builder-browser.js` → 38/38

The script uses headless Chrome over CDP with `--headless=new --enable-unsafe-swiftshader --use-angle=swiftshader`.
Canvas clicks are real `Input.dispatchMouseEvent` events and Ctrl+Z is a real key event. The sha256 of
`world/connections.json` is checked unchanged after every case.

1. **double-r-front-entrance / b (diner).** EDIT → MOVE SPAWN 8,8 → facing left → ADD trigger 8,9.
   **Finding: 8,9 is the diner's wall row (`iiiiiiDDiiiiii`),** so the validator rejects it with
   `b.triggers[2] must be walkable`, the draft turns red and export is blocked. Ctrl+Z then removes the
   trigger, the spawn-only draft is valid and the export textarea holds just that connection. After that,
   REVERT ALL.
   Shots:
   - `artifacts/world-builder-m4b/case1-before.png`
   - `case1-draft.png`
   - `case1-export-blocked.png`
   - `case1-export.png`
2. **sheriffs-station-front-entrance / a (sheriffs_station_exterior).** Same workflow. The draft is valid
   and the export has exactly one upsert (spawn 8,8 left, triggers `[[7,6],[8,6],[8,9]]`). Drafts survive a
   scene switch, and jump selects endpoint b in `sheriff`.
   Shots: `case2-before.png`, `case2-draft.png`, `case2-export.png`. The exported JSON is
   `case2-changeset.json`, and `tools/world-apply.js --dry-run` accepts it.
3. **Invalid: spawn x=19 on diner.** The error text `b.spawn is outside map bounds` is shown, the marker is
   red at the clamped edge tile (the test checks the canvas pixel), and the export is blocked.
   Shot: `case3-invalid.png`.
4. **Story moment ACT4_EVENING_GATHERING.** The baseline diner has Norma and Shelly. At this moment the
   diner has neither (`case4-diner.png`) and the roadhouse has both (`case4-roadhouse.png`, Norma selected).
   The roadhouse legacy doors show the read-only inspector.

## Tests (exact counts, this worktree)

| suite | result |
| --- | --- |
| test/smoke.js | 415 ✔ |
| test/walkthrough.js | 85 acquisizioni ✔ |
| test/act-4-flow.js | 1611/1611 |
| test/world-builder.js | 108/108 (was 83) |
| test/editor/edit.js (new) | 44 |
| test/editor/identity.js | 51 (was 34) |
| test/editor/changeset / history / hit-test / inspector / interaction / model / world-builder-core | 9 / 19 / 14 / 30 / 31 / 8 / 26 |
| test/world-apply.js (new) | 35 |
| test/world-door-equality.js | PASS (42 descriptors, 9 scenes) |
| test/test-world-registry.js | PASS |
| test/apply-changeset.js | 14 |
| test/editor-apply-preflight.js | 9 |
| test/editor-runtime-isolation.js | 6 |
| test/cast-continuity-validate.js | V1–V8 + RC all PASS |
| test/cast-presence-sync.js | 232/232 |
| test/world-engine-v0.1-catalog.js | PASS |
| test/world-builder-browser.js (new) | 38/38 |

## Files

- **Changed:** `world-builder.html`, `js/world-builder.js` (rewritten), `js/world-builder-core.js`,
  `js/world-builder-data.js`, `js/editor/core/*.js` (all 11 modules: IIFE, identity, index),
  `test/world-builder.js`, `test/editor/identity.js`, `test/editor/model.js`, `.github/workflows/test.yml`.
- **New:** `js/editor/core/edit.js`, `tools/world-apply.js`, `test/editor/edit.js`, `test/world-apply.js`,
  `test/world-builder-browser.js`, `artifacts/world-builder-m4b/*`, this report.
- **Deleted:** `reports/qwen-world-registry-editor.md`, `reports/qwen-world-builder-m4-registry-editing.md`.
- **Not touched:** `world/connections.json`, `js/world-connections.gen.js`, `js/retro*`, `js/tiles.js`,
  `js/roadhouse-*`, `js/ambient-life*`, `narrative/`.

## Commits

- 3941acc fix(editor-core): load core modules as classic scripts; side-scoped trigger + object ids
- 7c0dcbb feat(editor-core): draft edit store and strict changeset export/reapply
- 9931663 feat(world-builder): wire the editor UI (M4b)
- d711ba7 feat(tools): world-apply CLI for editor changesets
- a22e422 ci: run every world builder, editor, registry and cast suite
- 7d995aa test(world-builder): headless Chrome proof for M4b editing workflows
- (this report) docs(reports): M4b editing report, drop superseded M4 reports

## Known limitations

1. The brief's case-1 trigger tile (diner 8,9) is a wall. The editor correctly blocks that export, so the
   case-1 export shot shows the spawn-only draft after Ctrl+Z.
2. There is no redo (Ctrl+Shift+Z) and no multi-select. ADD also refuses tiles that hold an NPC.
3. The editor cannot create or delete connections, change an endpoint's scene, or edit `door` /
   `departureReaction`. Those fields round-trip untouched.
4. Legacy doors (8 maps, 17 doors) are view-only. Converting them to registry connections is not supported.
5. `tools/world-apply.js` does not bump `version` and writes no audit sidecar, unlike M4a's `changeset-apply`
   `commit()`. The two apply paths now disagree on version semantics.

## Recommended M5

Migrate the legacy doors into `world/connections.json`, starting with `roadhouse ↔ town` and `palmer ↔ town`.
Add a "promote legacy door to connection" action in the builder that emits an `upsert` for a new id; the
changeset and CLI would need a guarded create path for that. Keep `world-door-equality` as the byte-identity
gate. That removes the last door mechanism the editor cannot edit.
