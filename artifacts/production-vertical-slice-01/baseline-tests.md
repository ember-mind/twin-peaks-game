# Native test baseline (PVS-01)

Run: `node test/<file>.js` individually, macOS (no `timeout(1)`; enforced via
background-kill after 120s). Working tree had pre-existing uncommitted
changes per `git status` at session start.

## Skipped (not run)

| File | Reason |
|---|---|
| capture-chrome.js | launches Chrome (spawn) for screenshot capture |
| native-shot.js | launches Chrome via CHROME_BIN + local server |
| performance-gate.js | launches Chrome |
| visual-audit-capture.js | launches Chrome |
| town-route-captures.js | spawns native-shot.js (Chrome) |
| coldstage-config.js | RAN (does not launch Chrome; see table) |
| bosco-lib.js | shared library, `module.exports` only, no runnable assertions |
| gen-narrative-data.js | generator, unconditionally writes `js/narrative-data.gen.js` (repo mutation), not a test |
| verify-shot.js | CLI helper, requires a PNG path argument, no default test mode |
| greyscale.js | CLI helper, requires in/out PNG args, no default test mode |
| sheriffs-station-preview.js | browser-only harness (`window`/`document`), loaded via HTML page, not Node-runnable |
| station-population-preview.js | browser-only harness, same as above |
| character-life-preview.js | browser-only harness, same as above |
| double-r-exterior-prototype.js | browser-only, only runnable via `require()` under a shimmed DOM (see double-r-exterior-native.js) |

## Results

| File | Result | Notes |
|---|---|---|
| smoke.js | PASS | **368 controlli superati** |
| walkthrough.js | PASS | **86 acquisizioni**, finale raggiunto |
| genmaps.js | PASS | |
| ambient-life.js | PASS | |
| ambient-preview-controls.js | PASS | |
| authored-cast-contract.js | PASS | |
| bosco-gates.js | SKIP-as-run (exit 2) | CLI usage helper: `uso: bosco-gates.js <frame.png> ...` — needs image arg, not a self-contained test |
| canonical-sync.js | FAIL | `AssertionError`: 4 files report `unaudited_divergence` (index.html, js/ambient-life-scenes.js, js/location-connections.js, js/maps.js) vs expected `[]` |
| cast-sprite-sheet.js | PASS | |
| character-activity.js | PASS | |
| character-life.js | PASS | |
| character-quality.js | PASS | |
| character-runtime-contract.js | PASS | |
| choice-prompt-dedup.js | PASS | |
| choice-prompts.js | PASS | |
| classic-object-grounding.js | PASS | |
| coldstage-config.js | FAIL | `AssertionError`: array diff, actual selectChanged list missing `'stationPopulation'` (line 13) |
| cooper-sprite-sheet.js | PASS | |
| dialogue-craft-regression.js | PASS | |
| dialogue-presentation.js | PASS | |
| diner-layout.js | PASS | |
| double-r-exterior-native.js | PASS | |
| double-r-location-native.js | PASS | |
| double-r-location.js | FAIL (exit 1) | `ReferenceError: window is not defined` at line 3 — browser-only script, not standalone-runnable (only via double-r-location-native.js shim) |
| edifici-gates.js | SKIP-as-run (exit 2) | CLI usage helper: `uso: edifici-gates.js <frame.png> ...` |
| environment-entry.js | PASS | |
| environment-life.js | PASS | |
| environmental-interactions.js | PASS | |
| gen-m6-check.js | PASS | |
| gold-tone-gates.js | PASS | |
| graphic-pass-contract.js | PASS | |
| heartgold-visual-contract.js | PASS | |
| initial-spawn.js | PASS | |
| interaction-voice.js | PASS | |
| interior-prop-semantics.js | PASS | |
| interior-zoning-reachability.js | PASS | |
| letter-chain-provenance.js | PASS | |
| level-autopsy.js | PASS | |
| level-autopsy2.js | PASS | |
| level-autopsy3.js | PASS | |
| location-connections.js | PASS | |
| location-traversal.js | PASS | |
| mobile-production.js | PASS | |
| movement-feel.js | PASS | |
| narrative-finale.js | PASS | |
| narrative-m9-runtime.js | PASS | |
| narrative-repair-contract.js | PASS | |
| narrative-validate-m5.js | PASS | |
| narrative-validate-m6.js | PASS | |
| narrative-validate-m8.js | PASS | |
| narrative-validate-m9.js | PASS | |
| narrative-validate.js | PASS | writes artifacts/{C5B,C6B,C8B}-validation-log.json as side effect |
| notebook-objective.js | PASS | |
| objective-notebook-visibility.js | PASS | |
| objective-resolver.js | PASS | |
| pixel-gates.js | SKIP-as-run (exit 2) | CLI usage helper: `uso: pixel-gates.js <frame.png> ...` |
| portrait-evidence-parity.js | FAIL | `AssertionError`: portrait evidence drift, `test/smoke.js` reports `byte_drift`, expected `[]` |
| portrait-gates.js | PASS | |
| r69-reference-gates.js | PASS | |
| retro-font.js | PASS | |
| retro-production.js | PASS | |
| ronette-bob-provenance.js | PASS | |
| sheriffs-station-ambient.js | PASS | |
| sheriffs-station-native.js | PASS | |
| sprite-gates.js | FAIL | `Error: missing authored cast matrix: cooper` thrown from js/retro-authored.js:6758, via Spr.drawChar |
| station-population.js | PASS | |
| touch-runtime.js | PASS | |
| town-map-coherence.js | PASS | |
| town-structure-semantics.js | PASS | |
| tracks-provenance.js | PASS | |
| traincar-location-traversal.js | PASS | |
| walk-phase-contract.js | PASS | |
| world-engine-v0.1-catalog.js | PASS | |

## Summary

- Genuine PASS: 61
- Genuine FAIL: 5 (canonical-sync.js, coldstage-config.js, double-r-location.js, portrait-evidence-parity.js, sprite-gates.js)
- Usage-only exits (need image/args, not real failures): bosco-gates.js, edifici-gates.js, pixel-gates.js
- Skipped (Chrome/puppeteer or non-test helper): 8 files (see table above)
