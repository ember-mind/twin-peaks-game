# Validation final — 2026-09-09

## 1. Native sweep (`node test/*.js`, vs baseline-tests.md)

- `smoke.js`: **428 controlli superati** (baseline 368, run-1 428 — no drop).
- `walkthrough.js`: **86 acquisizioni**, finale raggiunto (unchanged vs baseline 86 and run-1).

Status changes vs baseline (skip rules identical to run-1: Chrome-launching
scripts, generators, CLI helpers, browser-only harnesses skipped):
- **coldstage-config.js**: baseline FAIL → now PASS (`Coldstage routing: all checks passed`), matching run-1.
- **character-life.js, station-population.js, traincar-location-traversal.js**: run-1 reported these as
  NEW FAIL (`EnvironmentReactions` undefined `.register`). In this run all three **PASS** cleanly — the
  dependency-ordering issue from run-1 is no longer reproducible.

Unchanged FAILs (same set as baseline and run-1), first lines:
- `canonical-sync.js` — `AssertionError`: 18 files now `unaudited_divergence`/`canonical_missing` (grew
  from baseline's 4; see full list in §3 below — same failure class, wider divergence).
- `double-r-location.js` — `ReferenceError: window is not defined` at line 3 (browser-only, needs shim).
- `portrait-evidence-parity.js` — `AssertionError`: portrait evidence drift, `test/smoke.js` `byte_drift`.
- `sprite-gates.js` — `Error: missing authored cast matrix: cooper` (`js/retro-authored.js:6790`).

New files not in baseline (`sheriffs-station-door.js`, `sheriffs-station-location.js`, `town-dusk.js`): all PASS.

All other ~60 files: PASS, unchanged.

## 2. Coldstage (`run changed --json`)

Top-level `status: pass`. `changedFileCount: 70`. `baseline.status: held-for-pixel-gate` (`advanced: false`,
`previousStatus: ready`). Top-level `pixelGate: {status: pending, aiReviewNeeded: true}`.

19 scenarios, all runtime checks 100% pass, `consoleSevere: 0` everywhere (including sheriffsStation,
characterLife, stationP, which run-1 reported as `runtime-failed` — now fully green, 9/9, 16/16, 21/21):
desktop 14/14, gameplay 9/9, mobile 14/14, mobileGameplay 15/15, mobileLandscapeGameplay 13/13,
cooperDown/Up/Right/Left 6/6 each, visual 3/3, diner 4/4, dinerAmbient 3/3, dinerEnvironment 3/3,
dinerGestures 3/3, dinerExterior 8/8, dinerLocation 11/11, sheriffsStation 9/9, characterLife 16/16, stationP 21/21.

Per-scenario pixelGate (screenshots NOT opened, per instructions):
- **review-required** (aiReviewNeeded true): `visual`, `diner`, `dinerAmbient`, `dinerEnvironment`,
  `sheriffsStation` → reviewSheets:
  - `.coldstage/diffs/2026-09-09T08-29-11-.../visual/visual-diff-sheet.webp`
  - `.coldstage/diffs/2026-09-09T08-29-11-.../diner/diner-diff-sheet.webp`
  - `.coldstage/diffs/2026-09-09T08-29-11-.../dinerAmbient/dinerAmbient-diff-sheet.webp`
  - `.coldstage/diffs/2026-09-09T08-29-11-.../dinerEnvironment/dinerEnvironment-diff-sheet.webp`
  - `.coldstage/diffs/2026-09-09T08-29-11-.../sheriffsStation/sheriffsStation-diff-sheet.webp`
- **baseline-missing** (aiReviewNeeded false, no reviewSheet): `dinerExterior`, `dinerLocation`,
  `characterLife`, `stationP`.
- **unchanged** (aiReviewNeeded false): `dinerGestures`.

No baseline approved or replaced. Full JSON: `artifacts/production-vertical-slice-01/coldstage-final.json`;
report: `.coldstage/runs/2026-09-09T08-29-11-.../report.json`.

## 3. `node tools/check-canonical-sync.js`

`canonical-sync: FAIL` — checked=86 equal=68 known=0 errors=18. Divergent files (name only):
- index.html
- js/ambient-life-scenes.js
- js/character-life-scenes.js
- js/double-r-location-data.js
- js/double-r-location-production.js
- js/environmental-inspect.js
- js/glue.js
- js/location-connections.js
- js/maps.js
- js/retro-authored.js
- js/sheriffs-station-art.js
- js/sheriffs-station-exterior-art.js (canonical_missing)
- js/sheriffs-station-exterior-scene.js (canonical_missing)
- js/sheriffs-station-location-data.js (canonical_missing)
- js/sheriffs-station-production.js
- js/sheriffs-station-scene.js
- js/town-dusk.js (canonical_missing)
- js/world-catalog.js

