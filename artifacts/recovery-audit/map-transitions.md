# Map transitions audit

Source of truth: `js/maps.js` (raw ASCII tables + declared doors), `js/glue.js`
(normalizes `GAME.maps` → `GAME.Maps`, used by the engine), plus a second,
code-only registration path where native "production" scripts overwrite/add
door entries into `GAME.Maps` at page load. Docs describe intent; this file
reports what actually runs.

## 1. Every map

`js/maps.js` declares 13 map ids in its `M` table (all consumed via
`js/glue.js` → `GAME.Maps`):

| id | size (rows × row length) | renderer | spawn(s) used by doors | native module claiming it |
|---|---|---|---|---|
| `arrival` | small, 1 door out | legacy tile | door `4,8`→town(30,33) | none |
| `town` | 36 rows × 58 cols | legacy tile (base) + native overlays for some props | multiple doors (see §2) | none for the base map; art overlays only |
| `sheriff` | native 16×12 | **native** (`js/sheriffs-station-scene.js`) | raw `doors: {}` (empty); doors added at runtime by `js/sheriffs-station-production.js` | `sheriffs-station-scene.js`, art in `sheriffs-station-art.js` |
| `palmer` | legacy tile | legacy | door `7,11`/`8,11`→town(42,7) | none |
| `room_315` | legacy tile | legacy | doors `{}` (raw); reachable only via `hotel_gn`'s door `8,11`→room_315(2,6) | none noted as native here (see Room 315 memory) |
| `hotel_gn` | legacy tile | legacy | doors `8,11`/`9,11`→town(9,7) | none |
| `hospital` | legacy tile | legacy | doors `7,11`/`8,11`→town(23,7) | `hospital-scene.js`/`hospital-art.js` (native, per file list) |
| `diner` | legacy tile | legacy base, **but its exit door is overwritten at runtime** (see §2) | raw doors `6,9`/`7,9`→town(42,21); **overwritten** to → `double_r_exterior_prototype`(6,7 down) | none for `diner` itself |
| `woods` | legacy tile | legacy | doors `0,7`→town(54,14); `21,0`→oej (needs `east_route_confirmed`) | none |
| `redroom` | legacy tile | legacy | doors `14,4`→redroom(8,9); `14,21`→town(50,1) | none |
| `traincar` | native (`js/traincar-scene.js`) | native | door `8,11`→room_315(2,6) | `traincar-scene.js`, `traincar-art.js` |
| `oej` | legacy tile | legacy | doors `7,9`/`8,9`→traincar(21,1) | none |
| `roadhouse` | legacy tile | legacy | doors `7,9`/`8,9`→town(47,29) | none |

Two more scene ids exist **only** as native scene modules, not as entries in
`js/maps.js`'s `M` table. They are registered directly into `GAME.Maps` at
load time by their own "production" scripts (see §2):

| id | size | renderer | source file |
|---|---|---|---|
| `sheriffs_station_exterior` | native 16×12 | `js/sheriffs-station-exterior-scene.js` (art: `sheriffs-station-exterior-art.js`) |
| `double_r_exterior_prototype` | native 16×12 | `js/double-r-exterior-scene.js` (art: `double-r-exterior-art.js`) |

`index.html` load order (relevant excerpt): `js/glue.js` (line 554) →
`js/location-connections.js` (565) → `js/double-r-location-production.js`
(569) → `js/sheriffs-station-production.js` (575) → `js/world-engine.js`
(589) → `js/world-catalog.js` (590). So by the time `world-catalog.js` runs,
`GAME.Maps.sheriffs_station_exterior` and `GAME.Maps.double_r_exterior_prototype`
already exist — `world-catalog.js` only *labels* them for the (separate,
currently non-authoritative) `GAME.World` registry, it does not create them.

## 2. The town → exterior lot → interior chain (both branches)

### Sheriff's station

- Town door `12,20` → `{ to: 'sheriffs_station_exterior', tx: 7, ty: 10, dir: 'up' }` (`js/maps.js:118`).
- `js/sheriffs-station-production.js` runs at load and does, in order:
  1. `G.SheriffsStationExteriorScene.install()` — creates `GAME.Maps.sheriffs_station_exterior` (16×12, `doors: {}` at creation, one object `bacheca_centrale` at (9,6), `npcs: []`).
  2. `G.SheriffsStationScene.install()` — creates/overwrites `GAME.Maps.sheriff` (native, raw doors empty).
  3. Runs `G.SheriffsStationLocationConnections` (from `js/sheriffs-station-location-data.js`) through `G.LocationConnections.install()`, which **writes door entries directly into both maps' `doors` objects**:
     - `sheriffs-station-front-entrance`: exterior tiles `[7,6],[8,6]` → sheriff spawn `(7,10,down)`; sheriff tiles `[7,11],[8,11]` → exterior spawn `(7,7,down)`.
     - `town-sheriffs-station-lot`: town tile `[12,20]` → exterior spawn `(7,10,up)` — **redundant with, and identical to, the door already declared in `js/maps.js`**; exterior tiles row 11, x=2..13 → town spawn `(12,21,down)`.
  4. Registers an `ENTITY_ENTERED_DOORWAY` environment reaction (`front-door`) on `sheriff`, gated on arriving from `sheriffs_station_exterior` at `7,10`.

Full chain: **town(12,20) → exterior(spawn 7,10) → exterior door(7,6/8,6) → sheriff(spawn 7,10) → interior**. Return: **sheriff(7,11/8,11) → exterior(spawn 7,7,down) → exterior(row11) → town(12,21,down)**.

### Double R

- Town door `42,20` → `{ to: 'double_r_exterior_prototype', tx: 6, ty: 10, dir: 'up' }` (`js/maps.js:119`).
- `js/double-r-location-production.js` runs at load:
  1. `G.DoubleRExteriorScene.install()` — creates `GAME.Maps.double_r_exterior_prototype` (16×12, `objects: []`, `npcs: []` — **no interacts, no NPCs at all**, unlike the sheriff lot's one bacheca object).
  2. Runs `G.DoubleRLocationConnections` (from `js/double-r-location-data.js`):
     - `double-r-front-entrance`: exterior tiles `[6,6],[7,6]` → diner spawn `(6,8,up)`; diner tiles `[6,9],[7,9]` → exterior spawn `(6,7,down)`. **This overwrites `diner`'s raw door at `(6,9)/(7,9)`, which in `js/maps.js` points straight to `town(42,21,down)`** (`js/maps.js:137-138`). After this script runs, that raw target is dead code — the live door goes to the exterior lot instead.
     - `town-double-r-lot`: town `[42,20]` → exterior spawn `(6,10,up)` (redundant with the `js/maps.js` door, same as the sheriff case); exterior row 11, x=2..13 → town spawn `(42,21,down)`.
  3. Registers `front-door` environment reaction on `diner`.

Full chain: **town(42,20) → exterior(spawn 6,10) → exterior door(6,6/7,6) → diner(spawn 6,8) → interior**. Return: **diner(6,9/7,9) → exterior(spawn 6,7,down) → exterior(row11) → town(42,21,down)**.

Neither lot map has any NPC. The sheriff lot has one plain-dialogue object
(`bacheca_centrale`, a notice board); the Double R lot has zero interacts —
`objects: []`.

### When these were added

`git log -S"sheriffs_station_exterior" --oneline --all` and the same for
`double_r_exterior_prototype` both return a single commit for all code
matches:

```
b5de5d2 Implementa Atto 4 (M8): topologia, staging, playthrough reale
```

Both exterior lots (and the door rewiring that routes `diner`'s exit through
one of them) were introduced together in the Act 4 (M8) topology commit —
this is not legacy scaffolding, it is the current, deliberate Act 4 world
shape.

### Authorizing docs/artifacts

- `docs/world-engine-v0.1.md:27` explicitly names this as a known, unrefactored
  seam: *"Current accidental Double R coupling remains visible, not
  generalized: town door `42,20` names `double_r_exterior_prototype`; exterior
  installer uses map-ID-gated global renderer overrides; `front-door` reaction
  is registered from existing Double R setup. v0.1 records these boundaries;
  it does not refactor them."* Line 72 documents the exact trigger/spawn
  wiring for the Double R connection, matching what's in code.
- `docs/world-engine-v0.1.md:43` lists `sheriffs-station` as a `GAME.World`
  location grouping `sheriffs_station_exterior` (exterior) + `sheriff`
  (interior) via connections `sheriffs-station-front-entrance` and
  `town-sheriffs-station-lot`.
- `docs/double-r-vertical-slice.md:5` states the route directly:
  `town (42,20) → double_r_exterior_prototype → front entrance → diner → double_r_exterior_prototype`.
- `docs/production-vertical-slice-01-report.md` documents the full connection
  graph including `town-double-r-lot` and `town-sheriffs-station-lot`, and the
  `test/native-shot.js --map=<...>` harness accepting these exact ids.
- `artifacts/sheriffs-station-exterior-v01/native-translation-brief.md`,
  `artifacts/double-r-exterior-v01/README.md`, `artifacts/double-r-exterior-v02/README.md`
  (v0.2, test-only prototype hardening), and `artifacts/double-r-location-03/`
  cover the individual builds of each lot.

### "Prototype" naming

`double_r_exterior_prototype` is not a placeholder name for something
unfinished — it is the permanent scene id, referenced live by
`js/double-r-exterior-scene.js:3`, `js/double-r-location-data.js` (both
connections), `js/world-catalog.js:13`, and `docs/world-engine-v0.1.md`.
There is **no non-prototype `double_r_exterior` map** anywhere in `js/` —
`grep -rn "'double_r_exterior'" js/` returns nothing. `artifacts/double-r-exterior-v02/README.md`
calls it *"Double R exterior prototype v0.2"* and describes it as
*"test-only and does not alter the 69-file canonical runtime mirror"* for
the purposes of that v0.2 QA pass specifically — but the scene itself is
wired into the live game, not gated behind a flag. `docs/world-visual-bible-v0.1.md:123`
gives the general definition of what counts as a "prototype" vs. a full
translation art-wise (drops focal hierarchy/collision/lighting fidelity),
which is the sense the name is used in.

## 3. Narrative impact

- `js/narrative-engine-adapter.js`'s `WORLD_TARGETS` registry (coordinates for
  landmark/object interactions keyed by `map_id`) has **no entries for**
  `sheriffs_station_exterior` or `double_r_exterior_prototype` — only
  `traincar`, `hospital`, `oej`, `diner`, `roadhouse`, `town`. NPC actors like
  `norma@diner` and `truman@sheriff` stay keyed to the *interior* map ids, so
  the exterior lots don't need their own narrative targets today.
- No occurrences of `viaggio`/teleport-style travel through these two map ids
  were found in `js/narrative-engine-adapter.js`.
- `test/smoke.js:108` explicitly adds both ids to its scene-id check list:
  `const sceneIds = mapIds.concat(['sheriffs_station_exterior', 'double_r_exterior_prototype']);`
  — so the structural smoke test is aware of them. However every
  `E.loadMap(...)` call in `test/smoke.js` **teleports directly to an interior
  map id** (`sheriff`, `diner`, `hospital`, `palmer`, `hotel_gn`, `room_315`,
  `traincar`, `redroom`, `woods`) — none of the simulated playthrough steps
  ever load `sheriffs_station_exterior` or `double_r_exterior_prototype`
  themselves. The smoke driver bypasses the lots entirely via direct map
  loads, so it does not exercise the door chain described in §2.
- `docs/production-vertical-slice-01-report.md:12` documents a dedicated
  headless-screenshot path for walking the real route:
  `node test/native-shot.js --map=<town|sheriffs_station_exterior|sheriff|double_r_exterior_prototype|diner> ...`.
- No objective/dialogue text was found (grep across `js/narrative-*.js`) that
  names "andare alla centrale"/"andare al Double R" in terms that would
  contradict the two-hop chain; the narrative layer is agnostic to whether
  the trip is one hop or two, since it drives via flags/actors on the
  interior maps, not via door topology.

## 4. Orphans / dangling references

- No door in `js/maps.js` points at a map id that fails to resolve at
  runtime: cross-checking every `to: '...'` target in `js/maps.js` against
  (a) the 13 ids in `M`, and (b) `sheriffs_station_exterior` /
  `double_r_exterior_prototype` (native-registered) accounts for all of them.
- No map is unreachable-from-any-door except `arrival` and `redroom`'s first
  half, which are intentional entry/dream-sequence maps (`arrival` is the
  游 start map; `redroom` is only reached via a non-`doors` red-room-specific
  transition elsewhere in the code, not audited further here — out of scope
  for this door-table pass).
- The one real "orphan-looking" wiring is the raw `diner` door at `(6,9)/(7,9)`
  in `js/maps.js` targeting `town` directly (§2) — it is dead at runtime
  because `js/double-r-location-production.js` always overwrites it on load,
  but the stale target is still sitting in the source file and would mislead
  anyone reading `js/maps.js` alone without also reading the production
  script. No other map's raw door entries are overwritten this way — only
  `diner`'s and `sheriff`'s (`sheriff`'s raw `doors: {}` is simply empty, not
  stale, so it's less misleading).

## 5. Outdoor spawn rule

N/A per task scope — the row ≤ 23 rule is specific to `town` spawns behind
the tree barrier; the two exterior lots are separate small native maps (12
rows) with their own camera framing, not town-row spawns. Not checked further.
