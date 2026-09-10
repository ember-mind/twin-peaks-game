# Validation run 1 — 2026-09-09

## Native sweep (vs baseline-tests.md)

- `smoke.js`: **428 controlli superati** (baseline 368 — up, no drop).
- `walkthrough.js`: **86 acquisizioni**, finale raggiunto (same as baseline 86, no drop).

Status changes vs baseline:
- **NEW FAIL**: `character-life.js`, `station-population.js`, `traincar-location-traversal.js` — all three throw
  `TypeError: Cannot read properties of undefined (reading 'register')` at `js/sheriffs-station-production.js:17`
  (`G.EnvironmentReactions.register('sheriff', ...)`), because these test harnesses `require()` that file without
  first loading `js/environment-reactions.js` (which index.html loads first, at line 578 vs 590). All three files
  are untracked/new (never committed), so this looks like in-progress work whose test harness hasn't kept pace
  with a production script dependency — not caused by this verification run.
- **NEW PASS (baseline was FAIL)**: `coldstage-config.js` — now `Coldstage routing: all checks passed`.

Unchanged FAILs (same as baseline): `canonical-sync.js` (4 files `unaudited_divergence`/`canonical_missing`:
index.html, js/sheriffs-station-scene.js, js/town-dusk.js, js/world-catalog.js), `double-r-location.js`
(`window is not defined`, browser-only shim-required script), `portrait-evidence-parity.js` (`byte_drift` on
`test/smoke.js`), `sprite-gates.js` (`missing authored cast matrix: cooper`).

All other ~60 files: PASS, unchanged from baseline.

## Coldstage browser run (`run changed --json`)

Overall status: **fail**. `changedFileCount: 70`. Baseline advancement: `held-after-failure` (previousStatus
`ready`). Top-level `pixelGate.aiReviewNeeded: true`.

20 scenarios run. Runtime checks (all 100% pass where checks existed): desktop 14/14, gameplay 9/9, mobile 14/14,
mobileGameplay 15/15, mobileLandscapeGameplay 13/13, cooperDown/Up/Right/Left 6/6 each, visual 3/3, diner 4/4,
dinerAmbient 3/3, dinerEnvironment 3/3, dinerGestures 3/3, dinerExterior 8/8, dinerLocation 11/11.

3 scenarios **runtime-failed** (0/0 checks, execution aborted before checks ran), all in the sheriff's-station
area — consistent with the same `EnvironmentReactions` dependency issue seen in the native sweep:
- `sheriffsStation`: `javascript error: Route to center ended at 7,9`
- `characterLife`: `javascript error: Truman did not return to his task focus`
- `stationP`: `javascript error: Truman did not restore task focus`

`consoleSevere: 0` on every scenario (no severe console errors anywhere).

Per-scenario `pixelGate` (only scenarios needing review listed; per instructions, screenshots were NOT opened):
- `visual`: `review-required`, aiReviewNeeded true → reviewSheet `.coldstage/diffs/2026-09-09T07-52-40-937Z-.../visual/visual-diff-sheet.webp`
- `dinerAmbient`: `review-required`, aiReviewNeeded true → reviewSheet `.coldstage/diffs/2026-09-09T07-52-40-937Z-.../dinerAmbient/dinerAmbient-diff-sheet.webp`
- `dinerEnvironment`: `review-required`, aiReviewNeeded true → reviewSheet `.coldstage/diffs/2026-09-09T07-52-40-937Z-.../dinerEnvironment/dinerEnvironment-diff-sheet.webp`
- `dinerExterior`, `dinerLocation`: `baseline-missing`, aiReviewNeeded **false** (nextAction visual-review-then-baseline-approval, no reviewSheet)
- `diner`, `dinerGestures`: `unchanged`, aiReviewNeeded false
- `sheriffsStation`, `characterLife`, `stationP`: `skipped-runtime-failure` (runtime failed before pixel diff)

No baseline was approved or replaced. Full JSON: `artifacts/production-vertical-slice-01/coldstage-run.json`;
report at `.coldstage/runs/2026-09-09T07-52-40-937Z-.../report.json`.
