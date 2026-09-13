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
- `node test/world-builder.js` → **WORLD-BUILDER-PASS 48/48**.
   - **M1:** all 7 catalog locations discovered; `double-r` = {exterior, diner}, `sheriffs-station` =
     {interior, exterior}, `great-northern` / `hospital` (no connections), `town` single-env.
   - **M2:** render-plan per-kind counts equal the source overlay counts for **three distinct scenes**:
    town interior-exterior **9 exits / 7 objects / 3 npcs**, diner **2/0/4** (indoor), sheriff **2/0/5**
     (interior 16×12, 5 npcs). One marker per overlay, in the documented paint order. Connection-endpoint
    spawn markers are a *separate* `planSpawns` pass (diamond+A/B label) and do not perturb these counts;
     it asserts `planSpawns('diner')` carries `double-r-front-entrance` B@(6,8)/up.
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

---

## PR #2 corrections (BLOCKER 1/2 + issues 3–7, 10)

Applied on commit `857dd10`. The review found two blockers and five issues; all are closed below with
automated guards, and the global gates stay at baseline (**smoke 420**, **walkthrough 81**).

- **BLOCKER 1 — deep-freeze leak.** `buildWorldSnapshot` used to `freezeDeep` values that still
  *referenced* live source arrays (a connection's `.triggers`, an object's `.dialogue`, a location's
  `.connections`), so building the snapshot froze authoritative data. Now every such value is cloned at
  the source boundary (`clone()` in `world-builder-data.js`); the snapshot owns its own frozen copies and
  the live source stays writable or pre-frozen as authored. Guard: reference-distinctness between a live
  trigger/connections array and its snapshot copy (the source being itself pre-frozen is *correct*, so we
  assert "own distinct copy", not "source unfrozen").
- **BLOCKER 2 — base geometry.** Added `planBaseMap(scene)`: real per-tile chars map to a fixed semantic
  colour palette (`T`/`.`/`g`/`w`/`i`/`f`/`r`/`D`/`d`) so Town/Diner/Sheriff render distinct layouts, not
  an empty grid. The snapshot keeps detached row copies (`rows.slice()`) for the renderer; guard asserts
  `planBaseMap(town) ≠ planBaseMap(diner)` by signature and is inert without a scene.
- **Issue 3 + 4 — one source of truth.** `selectablePlan(snap, sceneId)` returns a single z-ordered item
  list (`overlays` then first-class `{kind:'connection-spawn'}` markers) that drives BOTH the paint loop
  and the hit-test. A visible overlay/exit/spawn is therefore always selectable; selection identity is a
  `selKey` (`kind:tx,ty`) so it survives re-renders. Guard: clicking a spawn-tile pixel selects that spawn,
  and the topmost-painted item wins an overlap hit-test.
- **Issue 5 — inspector fields.** The property inspector now shows `LOCATION`, `SCENE`, `TYPE` for every
  overlay kind (exit/object/npc/spawn), and connection overlays expose `CONNECTION ID` plus both paired
  endpoints' scene / spawn tile+dir, with a "no paired record loaded" fallback when `connectionId` is unset.
- **Issue 6 — non-vacuous guard.** The no-mutation check now counts the live door *SET* via `Object.keys`
  (the source has no `.length`) and asserts a non-zero baseline, so it can't pass vacuously.
- **Issue 7 — fail loud on missing connections.** `buildWorldSnapshot` builds an `unresolved` list: every
  catalog connection id with no authored record surfaces there instead of being silently dropped; the real
  fixture asserts `unresolved.length === 0`, and a synthetic injection proves detection. (Note: connected
  locations are pre-frozen, so injection is done on a snapshot input copy, not the live object.)
- **Issue 10 — CI.** `.github/workflows/test.yml` runs `world-builder.js`, `smoke.js`, and
  `walkthrough.js` on push/PR (Node 24), turning the local gates into an automated pipeline. No project-wide
  `.github` existed before; this is branch-scoped and game-logic-neutral.

Suite grew to **64 checks** (`WORLD-BUILDER-PASS 64/64`); `smoke`/`walkthrough` unchanged.

