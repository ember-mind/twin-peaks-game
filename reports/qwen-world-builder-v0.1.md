# World Builder v0.1 — M1/M2/M3 (read-only dev tool)

**Branch:** `qwen/night-world-builder-m1-m3` · **Status:** implemented + tested, no game-logic change.

## What it is
A standalone dev page (`world-builder.html`) that visualizes the **real, shipped** world catalog and
scene maps — not a second model. It reads the same data the production game uses
(`GAME.World.catalog`, `GAME.Maps`, and the four `*LocationConnections` arrays) through the
world-engine bootstrap, then renders it read-only on a canvas.

## Constraints honored
- **No gameplay / world-model change.** The engine, catalog, scene installers, doors, and connections
  are untouched; this only *reads* them. A future authoring feature is out of scope (flagged for later).
- **Read-only v0.1:** the editor offers **no save/persistence** and **cannot mutate tile data**. This
  is enforced by a deep-frozen view-model and an automated guard that forbids any `save`/`edit`/
  `persist`/`localStorage`/`writeFile` surface.
- **Inert without user action.** Nothing renders until a location is picked; `planScene(undefined)` is a
  no-op, so the tool does nothing on load and stays out of the game's runtime path.

## Files (all new in this branch)
| file | role |
|---|---|
| `js/world-builder-data.js` | **Pure** view-model builder: `buildWorldSnapshot({maps,catalog,connections})` → frozen tree of `{locations[environments[sceneId]], scenes[overlays], connections[a,b]}`. `collectWorldSource(GAME)` pulls it straight off the live `GAME`. Exposes itself on `GAME.WorldBuilderData` (browser) and `module.exports` (node). |
| `js/world-builder-coords.js` | **Pure** geometry: `tileToPixel`, `pixelToTile` (inverse), `hitTest(overlays,px,py,zoom)` → overlay. Exposes `GAME.WorldBuilderCoords`. |
| `js/world-builder.js` | Browser glue: M1 location/scene selector over all 7 catalog locations + status counts; M2 canvas grid + overlays (exits=arrows at trigger tiles pointing to target, objects=squares, npcs=dots) + legend; M3 click → hit-test → select → property inspector showing the documented fields (`TYPE/KIND`, `SOURCE` tile, `TARGET scene+spawn`, `CONNECTION id` with both a/b endpoints, `DIALOGUE`). Exposes a pure `planScene(scene)` so the renderer's output is node-testable. |
| `world-builder.html` | Standalone page: loads the identical world chain as `index.html` (up to `world-catalog.js`) then the three builder modules; the glue self-mounts a fixed overlay panel. |
| `test/world-builder.js` | Node test (**44 checks**, no jsdom/canvas): loads the real chain via tolerant bootstrap, asserts discovery + per-scene overlay accuracy + M2 render-plan + M3 click-select over three distinct locations, plus the read-only/inert guards. |

## Verification
- `node test/world-builder.js` → **WORLD-BUILDER-PASS 44/44**.
  - **M1:** all 7 catalog locations discovered; `double-r` = {exterior, diner}, `sheriffs-station` =
    {interior, exterior}, `great-northern` / `hospital` (no connections), `town` single-env.
  - **M2:** render-plan per-kind counts equal the source overlay counts for **three distinct scenes**:
    town interior-exterior **9 exits / 7 objects / 3 npcs**, diner **2/0/4** (indoor), sheriff **2/0/5**
    (interior 16×12, 5 npcs). One marker per overlay, in the documented paint order.
  - **M3:** clicking the center pixel of a real exit selects that exact overlay on each of the three scenes.
  - **Connection resolution:** `double-r-front-entrance` resolves to b = `diner` spawn **(6,8) dir up**;
    a-endpoint is the exterior with triggers on row 6.
  - **Guards:** no `save`/`edit`/`persist` API; no `localStorage`/`writeFile` in source; snapshot frozen
    (mutating throws in strict mode); building + planning does not mutate live `GAME.Maps`.
- `node test/smoke.js` → **420** (unchanged). `node test/walkthrough.js` → **81** (unchanged).

## Manual step remaining
The automated suite covers all M1–M3 logic and guards. A human should open `world-builder.html` in a
browser over a local server (so image/audio deps resolve) to visually confirm the canvas overlays on at
least town, diner, and sheriff — the renderer's *data* is fully asserted; only pixel-on-screen confirmation
needs a browser, which cannot be done without jsdom/canvas in this environment.
