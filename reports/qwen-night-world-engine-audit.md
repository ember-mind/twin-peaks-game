# Qwen night-shift audit — World Engine hardening & invariant guard

- **Date:** 2026-09-11 (night pass)
- **Branch at start:** `main` (work not yet committed; see Git summary in §5 when finalized)
- **Scope:** The World Engine catalog boundary (`js/world-engine.js`, `js/world-catalog.js`) and the authored two-way connection layer (`js/location-connections.js` + the per-location `*LocationConnections` arrays). No art or runtime behavior was changed; only a regression test and this report.
- **Method:** Read-only reconnaissance first, then a single high-value test that pins an invariant currently guarded in only one direction. Baseline re-verified before any change.

This audit intentionally keeps changes small and reviewable: it adds one focused guard rather than refactoring the engine, which `docs/world-engine-v0.1.md` already classifies as complete for v0.1.

---

## 1. Architecture discovered

### 1.1 The catalog boundary — `js/world-engine.js`

A single IIFE installs a frozen `GAME.World` API on the global `G` (line 5-6). It owns **only declarative records and lookup indexes**; it never touches maps, the renderer, movement, saves, or reactions (consistent with doc §3 "Ownership boundaries").

Key pieces:

- **`register(catalog)`** (lines 103-118): runs `prepare()`, stores a recursively frozen copy via `deepFreeze(structuredClone(...))` (line 12), returns it, and sets the one-shot `registered` flag. A second registration throws ("only one catalog may be registered"). The source object is cloned, so post-registration mutations by the caller cannot reach World state — proven by the existing catalog test (its "source mutations cannot alter registered catalog" check).
- **`prepare(raw)`** (lines 19-96): validates a dense location array with `requireDense`, nonempty string world id and location IDs via `requireId` (which also rejects `Object.prototype` keys like `__proto__`/`constructor`), one-or-more environments per location, unique global `sceneId`s, and — crucially for this audit — connection-reference integrity:
   - `localConnections` is reset **per location** (line 77): a duplicate connection id *within one location* throws ("duplicate local connection reference") while an empty array is allowed.
   - `connectionSeen` is global across the whole catalog and a connection id shared by two locations is **explicitly allowed** (`if (!shared) ...`, line 84-87). This is the contract for "a shared connection belongs to both endpoint locations."
   - Scene existence (`GAME.Maps[sceneId]`) is checked only when `GAME.Maps` is present at registration (line 66-67); otherwise it is skipped by design ("registration does not defer a second validation pass", doc §4).
- **`World` object** (lines 121-139): frozen. `catalog` is an enumerable getter that is `undefined` until registered. `getLocation`, `getEnvironment(locationId, environmentId)`, and `getLocationForScene(sceneId)` return the immutable records or `undefined`. `getConnections()` returns the deduped catalog-wide id list (preserving author order); `getConnections(locationId)` returns that location's own reference list.

Indexes are built with null prototypes (`Object.create(null)` / `Map`) so prototype keys like `__proto__` cannot poison lookups — the existing test verifies this explicitly (§ "world-engine-v0.1-catalog" proto block).

### 1.2 The catalog data — `js/world-catalog.js`

Registers exactly one catalog (`id: 'twin-peaks'`) and then freezes nothing further (the engine does that). The **live** location membership is seven locations, each a dense array of environments + connection ids:

| Location | Environments (env id → sceneId) | Connections |
|---|---|---|
| `double-r` | exterior→`double_r_exterior_prototype`, interior→`diner` | `double-r-front-entrance`, `town-double-r-lot` |
| `town` | town→`town` | `town-traincar-east`, `town-sheriffs-station-lot`, `town-double-r-lot` |
| `sheriffs-station` | exterior→`sheriffs_station_exterior`, interior→`sheriff` | `sheriffs-station-front-entrance`, `town-sheriffs-station-lot` |
| `traincar-crossing` | traincar→`traincar` | `town-traincar-east`, `traincar-oej-entrance` |
| `one-eyed-jacks` | interior→`oej` | `traincar-oej-entrance` |
| `great-northern` | room-315→`room_315`, lobby→`hotel_gn` | `great-northern-room-315-hall` |
| `hospital` | interior→`hospital` | *(none)* |

Seven locations, ten environments, **seven distinct connection ids** after dedup.

### 1.3 The authored connection layer — `js/location-connections.js` + four `*LocationConnections` arrays

`GAME.LocationConnections.install(worldConnections, maps, config)` (lines 54-170) compiles each semantic two-way record into the existing map-door system: it resolves both endpoints' scenes from `maps`, reads trigger/spawn tiles out of the authored records, enforces that a spawn tile is **not** inside its own trigger set (`inRects`, lines 52/141-143), carries through optional `door` gate metadata (`needsFlag`/`blockedMsg`) and `arrival` metadata, then writes paired `A->B` / `B->A` doors into each scene's `doors` map. It is guarded by a one-shot `installed` flag so a second call throws (line 55).

The connection **descriptors are authored per location** in four arrays, exposed on `window.GAME`:

| Array | File | Connection ids |
|---|---|---|
| `GAME.DoubleRLocationConnections` (+ singular `DoubleRLocationConnection`) | `js/double-r-location-data.js` | `double-r-front-entrance`, `town-double-r-lot` |
| `GAME.SheriffsStationLocationConnections` | `js/sheriffs-station-location-data.js` | `sheriffs-station-front-entrance`, `town-sheriffs-station-lot` |
| `GAME.TraincarLocationConnections` | `js/traincar-location-data.js` | `town-traincar-east`, `traincar-oej-entrance` |
| `GAME.Room315LocationConnections` | `js/room-315-location-data.js` | `great-northern-room-315-hall` |

The two-way relationship: the catalog lists connection **ids** (membership in each endpoint location); the four arrays hold the **descriptors** (endpoints, triggers, spawns, gates). `LocationConnections.install` joins them at runtime; the World Engine never copies descriptors or performs traversal. The seven catalog ids and the seven authored ids are currently a perfect bijection — which is exactly what this audit hardens.

### 1.4 Production load order (`index.html`, lines 578-623)

`maps.js` (578) → `data.js` (579) → `glue.js` (585, builds `GAME.Maps = {}`) → per-location art/scene/data/**production** installers (596-619) → `world-engine.js` (620) → `world-catalog.js` (621) → `diorama.js` (622, untracked human WIP) → `main.js` (623). Because `glue.js` and every `*-scene.js` load **before** `world-catalog.js`, `GAME.Maps` is fully populated at registration time — so the conditional scene-existence check (§1.1) is exercised in-page, not skipped.

---

## 2. Issues found (classified by severity)

### 2.1 [MEDIUM] Authored↔catalog bijection guarded in only one direction — regression gap
**Class:** test-coverage gap. **Classification of the system itself:** `REFERENCED EXISTING SYSTEM ALREADY SUPPORTS IT` — the install mechanism is sound; only its *invariant* is under-tested.

`test/world-engine-v0.1-catalog.js` (lines 151-163) proves **catalog→authored**: for every id in `World.getConnections()` it resolves an authored record and re-checks endpoints/spawn/doors/membership. But it has two blind spots:

1. **Cross-file id uniqueness is unguarded.** The lookup is built as a `Map` keyed by connection id (line 152). If two `*LocationConnections` arrays ever shared an id, the second silently overwrote the first in the Map and the test would still pass. A typo'd duplicate id is therefore invisible today.
2. **The reverse direction is never checked.** An authored door added to a `*LocationConnections` array but forgotten in `js/world-catalog.js` would not appear in any catalog check and would silently go unregistered.

**Current data is consistent** (7↔7 bijection holds, verified in §1.3), so this is a latent regression risk, not an active bug. **Fix:** add `test/world-catalog-coverage.js` that asserts (a) each array element has a nonempty string `id`, (b) ids are unique across all four arrays, and (c) the authored id set equals the catalog id set bidirectionally. This is the regression guard added in this pass (§3).

### 2.2 [LOW] Stale documentation vs live catalog — `docs/world-engine-v0.1.md`
**Class:** documentation drift (no runtime impact; the test enforces reality, not the doc).

- The embedded example catalog (§4, lines 43-50) lists **five** locations and stops at `one-eyed-jacks`; it omits the later-added `great-northern` (envs `room_315`/`hotel_gn`) and `hospital`.
- §4 line 69 names only `GAME.DoubleRLocationConnection` and `GAME.TraincarLocationConnections`, omitting the `SheriffsStationLocationConnections` and `Room315LocationConnections` arrays that now carry half the seven ids.

The doc is a snapshot from an earlier milestone. **Recommendation:** update the example and §4 prose to match `js/world-catalog.js` (the canonical source), or add a one-line pointer that the live catalog is authoritative. Not touched in this pass — flagged for a human docs commit.

### 2.3 [LOW / INFORMATIONAL] Conditional scene validation
**Class:** by-design behavior, confirmed safe in production.

`prepare()` validates each `sceneId` against `GAME.Maps` only when `Maps` is present (line 66-67). In an isolated test context that omits `Maps`, a bad `sceneId` would pass without error. **Mitigated:** the production load order (§1.4) guarantees `Maps` is populated before registration, so the path is exercised in-page; and the catalog test loads real maps, so a missing scene fails implicitly. No change needed.

### 2.4 [OK] Things checked and found sound
- Single-registration + deep-freeze immutability, null-proto lookup indexes, `__proto__`/`constructor`/`toString` key rejection — all present and covered by the existing catalog test.
- Shared connections (`town-traincar-east`, `traincar-oej-entrance`, `town-double-r-lot`, `town-sheriffs-station-lot`) correctly appear in both endpoint locations' lists; `prepare()` allows this via `shared` while still deduping the catalog-wide view.
- No connection descriptor copies or traversal logic leaked into the World Engine — it stays a declarative/index layer as designed.

---

## 3. Work completed

Added one file, `test/world-catalog-coverage.js` — a self-contained gate pinning the
invariant behind issue 2.1, which the existing catalog test guarded in only one direction.
It asserts three things over the four `*LocationConnections` arrays and the registered catalog:
- every array element declares a nonempty string `id`;
- connection ids are unique across all four arrays (cross-file), reporting both sources on failure;
- the authored id set equals `World.getConnections()` bidirectionally.

It is deliberately scoped to id coverage — no door, scene, or spawn geometry is re-checked,
which remains the job of `test/world-engine-v0.1-catalog.js`. No source, art, runtime, or
documentation file was modified.

The gate was also negatively verified: a throwaway `/tmp` probe (not committed) injected each
fault class — a cross-file duplicate id, an authored id absent from the catalog, and a catalog
id with no authored descriptor — and confirmed all three comparison phases throw with a
diagnostic message naming the offender.

---

## 4. Verification

All gates run with `node` (Node 24). No aggregate runner exists; each gate is invoked by name.

Baseline, re-verified before any change (matches the start of this pass):
- `node test/world-engine-v0.1-catalog.js` → `WORLD-ENGINE-V0.1-CATALOG-PASS registration, immutable catalog, scoped lookups, shared connections, validation, authored references` (exit 0)
- `node test/smoke.js` → `420 controlli superati ✔`
- `node test/walkthrough.js` → `OK: cammino completo simulato, 81 acquisizioni, finale raggiunto ✔`

After the change — no regressions:
- `node test/world-catalog-coverage.js` → `WORLD-CATALOG-COVERAGE-PASS 7 authored connections biject with the catalog, ids unique across 4 arrays` (exit 0)
- `node test/world-engine-v0.1-catalog.js` → still `WORLD-ENGINE-V0.1-CATALOG-PASS ...` (exit 0); the untouched gate stays green
- `node test/smoke.js` → still `420 controlli superati ✔`
- `node test/walkthrough.js` → still `81 acquisizioni, finale raggiunto ✔`

Scope: `git status --porcelain` shows the only additions are `?? reports/` and
`?? test/world-catalog-coverage.js`; none of the audited source files
(`world-engine.js`, `world-catalog.js`, the four `*-location-data.js`,
`location-connections.js`) appear in the modified set, confirming no audited file was touched.

---

## 5. Git summary

Committed locally on a dedicated branch (`qwen/night-world-engine-audit`, created from `main`)
so the change is reviewable in isolation and **never pushed**. The commit subject is
`test: guard authored↔catalog connection bijection; add world-engine audit report`.

Staged for that commit — and nothing else:
- `test/world-catalog-coverage.js` (new)
- `reports/qwen-night-world-engine-audit.md` (new, this file)

The ~30 pre-existing modified/untracked entries in the working tree (`js/engine.js`,
`js/retro-authored.js`, `js/town-dusk.js`, `index.html`, the PNG/JSON artifacts under
`artifacts/act-3-closure/` and `artifacts/act-4-implementation/`, plus untracked human WIP such as
`js/diorama.js`) are unrelated to this pass. They were left untouched and unstaged: they remain
as working-tree changes on the branch, ready for their own review, not mixed into this commit.
No remote was contacted; nothing was pushed.
