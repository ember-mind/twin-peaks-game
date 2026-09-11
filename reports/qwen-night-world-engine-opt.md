# Night pass 2 — World Engine: closing the stale-doc gap

Follow-up to `reports/qwen-night-world-engine-audit.md` (night-1, which added the
authored↔catalog bijection guard). Scope of this pass: investigate two further
candidate invariants and close the one clean remaining gap — a stale design doc.
No source, art, runtime, or game behaviour changed. One file edited
(`docs/world-engine-v0.1.md`); one new report committed.

## 1. Investigation outcome (and why the work narrowed)

Two candidate invariants were examined before editing anything:

### 1a. Catalog `sceneId` → built map resolution — already covered, no new gate

The hypothesis was that nothing explicitly asserts every catalog
`environment.sceneId` resolves to a real map. It does, implicitly but for real:

- `js/world-engine.js` (`prepare()`, the environment loop) throws
  `map "<sceneId>" does not exist` whenever `GAME.Maps` is present and a
  `sceneId` is missing (line ~67–68).
- The full require chain in `test/world-engine-v0.1-catalog.js` loads
  `js/glue.js`, which builds the normalised uppercase `GAME.Maps`, then registers
  `world-catalog.js`. That test passes, so all live catalog scene IDs resolve
  under that context.

A standalone forward-resolution test would therefore duplicate an already-active
check → **dropped as redundant.**

### 1b. Reverse / orphan-map check — dropped (would false-positive)

The mirror question ("is every built `GAME.Maps` key referenced by some catalog
environment?") is not a valid invariant: maps reachable only via connection
endpoints are legitimately *not* environment `sceneId`s, so an "every map must be
an environment" gate would flag real data. **Dropped as noisy.**

### The `GAME.maps` vs `GAME.Maps` duality is by-design, not a bug

A grep surfaced that `js/maps.js:22` writes lowercase `GAME.maps` while
`js/world-engine.js` reads uppercase `GAME.Maps`. This is intentional and
documented at `js/glue.js:1-5`: `maps.js` exposes the *new* API (`GAME.maps`);
`glue.js` normalises it into the *old* `GAME.Maps = {}` consumed by the engine
(`js/glue.js:120`). **No casing "fix" is warranted** — it would break the bridge.

## 2. The one change made: `docs/world-engine-v0.1.md` §4 + line 71

The §4 "Implemented data contract" example was a stale snapshot of the catalog:

- It listed **5 of the 7** live locations, omitting `great-northern`
  (scenes `room_315`, `hotel_gn`) and `hospital` (scene `hospital`).
- Its "REFERENCED EXISTING SYSTEM" note cited only **2 of the 4** authored
  connection arrays (`DoubleRLocationConnection[s]`,
  `TraincarLocationConnections`), and used a non-existent singular name
  `GAME.DoubleRLocationConnection`; the real arrays are
  `DoubleRLocationConnections`, `SheriffsStationLocationConnections`,
  `TraincarLocationConnections`, `Room315LocationConnections`.

Fix (verbatim to the live catalog, derived from `js/world-catalog.js`):

- §4 example now lists all **7 locations** with exact environments/scene IDs and
  connections (`hospital` carries an empty `connections: []`).
- Line 71 now names all **four** `*LocationConnections` arrays.

This is pure documentation; the live catalog was already correct and unchanged.

## 3. Verification (no regressions)

| Gate | Command | Expected | Result |
|---|---|---|---|
| Smoke | `node test/smoke.js` | 420 checks | **420 controll**i superati ✔ |
| Walkthrough | `node test/walkthrough.js` | 81 acquisitions | **81 acquisizioni** ✔ |
| Catalog integration | `node test/world-engine-v0.1-catalog.js` | PASS | **WORLD-ENGINE-V0.1-CATALOG-PASS** |
| Coverage (night-1) | `node test/world-catalog-coverage.js` | 7↔7 unique/4 | **WORLD-CATALOG-COVERAGE-PASS** |

Doc edits verified by grep: all four array names present, both formerly-missing
locations present, the stale singular reference gone.

## 4. Scope proof (human WIP untouched)

The working tree carries pre-existing uncommitted human work
(`js/engine.js`, `js/retro-authored.js`, `js/town-dusk.js`, `index.html`,
`artifacts/act-3-closure/*`, `artifacts/act-4-implementation/*`). Two facts
prove this pass touched none of it:

1. `test/smoke.js` and `test/walkthrough.js` contain **no** `fs.write` /
   `artifacts` references — running the gates never regenerates any artifact, so
   nothing here was a side effect of verification.
2. By mtime, **only** `docs/world-engine-v0.1.md` carries today's date; every
   other modified file keeps an older timestamp = pre-existing WIP, not edited.

## 5. Git summary

- Branch: `qwen/night-world-engine-opt`, based on `main` (`1a8b94d`), created in
  an isolated worktree so the human's uncommitted WIP was never read or staged.
- Commit contains **only**: `docs/world-engine-v0.1.md` (+9/−7) and this report.
- **Not pushed.** No remote mutation.
