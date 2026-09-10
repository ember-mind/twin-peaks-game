# Test suite recovery audit — before state

Run 2026-09-10. Node v24.16.0, macOS (no `timeout`/`gtimeout` binary available;
used a portable bash watchdog instead, 90s cap, checked every 1s).

Command inventory: every `test/*.js` (109 files) plus `tools/check-canonical-sync.js`.
6 files were not executed (screenshot/CDP capture drivers and playthrough drivers per
task scope) — see "Not run" below. 103 files were run. No run hit the 90s timeout.

**Totals: 103 run, 86 passed, 17 failed, 0 timed out.**

## Not run (by design, per task scope)

| file | why skipped |
|---|---|
| test/act-3-playthrough.js | playthrough driver (Chrome via CDP), excluded by task instructions |
| test/act-4-playthrough.js | playthrough driver (Chrome via CDP), excluded by task instructions |
| test/capture-chrome.js | CDP screenshot helper library, not a standalone check |
| test/native-shot.js | CLI screenshot capture tool, requires `--map/--x/--y/--dir/--out` args + Chrome |
| test/verify-shot.js | CLI PNG-dimension checker, requires a `<file>` argument |
| test/visual-audit-capture.js | CDP screenshot-matrix driver, requires Chrome + `--matrix` args |

## Results table

| file | exit | dur | classification |
|---|---|---|---|
| test/act-2-flow.js | 0 | 1s | pass |
| test/act-2-ronette-required.js | 0 | 1s | pass |
| test/act-3-flow.js | 0 | 1s | pass |
| test/act-3-mirror-gate.js | 0 | 1s | pass |
| test/act-4-flow.js | 0 | 1s | pass |
| test/act-4-mirror-gate.js | 0 | 1s | pass |
| test/ambient-life.js | 0 | 1s | pass |
| test/ambient-preview-controls.js | 0 | 1s | pass |
| test/authored-cast-contract.js | 0 | 1s | pass |
| **test/bosco-gates.js** | 2 | 1s | EXPECTED ENVIRONMENT-CLI LIMITATION |
| test/bosco-lib.js | 0 | 1s | pass |
| **test/canonical-sync.js** | 1 | 1s | CANONICAL-VAULT DRIFT |
| test/cast-sprite-sheet.js | 0 | 1s | pass |
| test/character-activity.js | 0 | 1s | pass |
| **test/character-life-preview.js** | 1 | 1s | EXPECTED ENVIRONMENT-CLI LIMITATION |
| test/character-life.js | 0 | 1s | pass |
| test/character-quality.js | 0 | 1s | pass |
| test/character-runtime-contract.js | 0 | 1s | pass |
| test/choice-prompt-dedup.js | 0 | 1s | pass |
| test/choice-prompts.js | 0 | 1s | pass |
| test/classic-object-grounding.js | 0 | 1s | pass |
| test/cooper-sprite-sheet.js | 0 | 1s | pass |
| test/dialogue-craft-regression.js | 0 | 1s | pass |
| test/dialogue-presentation.js | 0 | 1s | pass |
| test/diner-layout.js | 0 | 1s | pass |
| **test/double-r-exterior-native.js** | 1 | 1s | NEW REAL REGRESSION |
| **test/double-r-exterior-prototype.js** | 1 | 1s | EXPECTED ENVIRONMENT-CLI LIMITATION |
| **test/double-r-location-native.js** | 1 | 1s | NEW REAL REGRESSION |
| **test/double-r-location.js** | 1 | 1s | EXPECTED ENVIRONMENT-CLI LIMITATION |
| **test/edifici-gates.js** | 2 | 1s | EXPECTED ENVIRONMENT-CLI LIMITATION |
| test/environment-entry.js | 0 | 1s | pass |
| test/environment-life.js | 0 | 1s | pass |
| test/environmental-interactions.js | 0 | 1s | pass |
| test/gen-m6-check.js | 0 | 1s | pass |
| test/gen-narrative-data.js | 0 | 1s | pass |
| test/genmaps.js | 0 | 1s | pass |
| test/gold-tone-gates.js | 0 | 1s | pass |
| test/graphic-pass-contract.js | 0 | 1s | pass |
| **test/greyscale.js** | 2 | 1s | EXPECTED ENVIRONMENT-CLI LIMITATION |
| test/hd2d-cabin-prototype.js | 0 | 1s | pass |
| test/heartgold-visual-contract.js | 0 | 12s | pass |
| test/hospital-native.js | 0 | 1s | pass |
| test/initial-spawn.js | 0 | 1s | pass |
| test/interaction-voice.js | 0 | 1s | pass |
| test/interior-prop-semantics.js | 0 | 1s | pass |
| test/interior-zoning-reachability.js | 0 | 1s | pass |
| test/letter-chain-provenance.js | 0 | 1s | pass |
| test/level-autopsy.js | 0 | 1s | pass |
| test/level-autopsy2.js | 0 | 1s | pass |
| test/level-autopsy3.js | 0 | 1s | pass |
| test/location-connections.js | 0 | 1s | pass |
| test/location-traversal.js | 0 | 1s | pass |
| test/mobile-production.js | 0 | 1s | pass |
| test/movement-feel.js | 0 | 1s | pass |
| test/narrative-finale.js | 0 | 1s | pass |
| test/narrative-lint.js | 0 | 1s | pass |
| test/narrative-m9-runtime.js | 0 | 1s | pass |
| **test/narrative-repair-contract.js** | 1 | 1s | PRE-EXISTING |
| test/narrative-slice-01.js | 0 | 1s | pass |
| test/narrative-validate-m5.js | 0 | 1s | pass |
| test/narrative-validate-m6.js | 0 | 1s | pass |
| test/narrative-validate-m8.js | 0 | 1s | pass |
| **test/narrative-validate-m9.js** | 1 | 1s | STALE COUNT-PIN |
| test/narrative-validate.js | 0 | 1s | pass |
| test/notebook-objective.js | 0 | 1s | pass |
| test/objective-notebook-visibility.js | 0 | 1s | pass |
| test/objective-resolver.js | 0 | 1s | pass |
| test/performance-gate.js | 0 | 1s | pass |
| **test/pixel-gates.js** | 2 | 1s | EXPECTED ENVIRONMENT-CLI LIMITATION |
| test/portrait-evidence-parity.js | 0 | 1s | pass |
| test/portrait-gates.js | 0 | 1s | pass |
| test/probe-act2-pacing.js | 0 | 1s | pass |
| test/probe-act3-pacing.js | 0 | 1s | pass |
| test/probe-act4-pacing.js | 0 | 1s | pass |
| test/probe-acts12-pacing.js | 0 | 1s | pass |
| test/r69-reference-gates.js | 0 | 1s | pass |
| test/retro-font.js | 0 | 1s | pass |
| **test/retro-production.js** | 1 | 1s | STALE COUNT-PIN |
| test/ronette-bob-provenance.js | 0 | 1s | pass |
| test/room-315-location.js | 0 | 1s | pass |
| test/room-315-native.js | 0 | 1s | pass |
| test/sheriffs-station-ambient.js | 0 | 1s | pass |
| test/sheriffs-station-door.js | 0 | 1s | pass |
| test/sheriffs-station-location.js | 0 | 1s | pass |
| test/sheriffs-station-native.js | 0 | 1s | pass |
| **test/sheriffs-station-preview.js** | 1 | 1s | EXPECTED ENVIRONMENT-CLI LIMITATION |
| test/smoke.js | 0 | 1s | pass |
| **test/sprite-gates.js** | 1 | 1s | NEW REAL REGRESSION |
| **test/station-population-preview.js** | 1 | 1s | EXPECTED ENVIRONMENT-CLI LIMITATION |
| test/station-population.js | 0 | 1s | pass |
| test/story-truth-lint.js | 0 | 1s | pass |
| test/touch-runtime.js | 0 | 1s | pass |
| test/town-dusk.js | 0 | 1s | pass |
| test/town-map-coherence.js | 0 | 1s | pass |
| test/town-route-captures.js | 0 | 1s | pass (no-arg mode; `--capture-tag` path not exercised) |
| test/town-structure-semantics.js | 0 | 1s | pass |
| test/tracks-provenance.js | 0 | 1s | pass |
| test/traincar-location-traversal.js | 0 | 1s | pass |
| test/traincar-native.js | 0 | 1s | pass |
| test/walk-phase-contract.js | 0 | 1s | pass |
| test/walkthrough.js | 0 | 1s | pass |
| test/world-engine-v0.1-catalog.js | 0 | 1s | pass |
| **tools/check-canonical-sync.js** | 1 | 1s | CANONICAL-VAULT DRIFT |

## Failure details

### EXPECTED ENVIRONMENT-CLI LIMITATION (10 files)

Two distinct sub-causes, neither a code defect:

**a) CLI visual-QA tools that require a PNG argument** — `test/bosco-gates.js`,
`test/edifici-gates.js`, `test/greyscale.js`, `test/pixel-gates.js`. All four print a
`uso: <script> <frame.png> [...]` usage line and exit 2 when invoked with no
arguments, e.g.:
```
uso: bosco-gates.js <frame.png> [--mockup=ox,oy,f] [--exclude=x0,y0,x1,y1]
```
These are gates meant to be run against a captured screenshot, not standalone.

**b) Browser-preview scripts that assume `window`/`document`** —
`test/character-life-preview.js`, `test/double-r-exterior-prototype.js`,
`test/double-r-location.js`, `test/sheriffs-station-preview.js`,
`test/station-population-preview.js`. All fail immediately with:
```
ReferenceError: window is not defined
```
Each file opens with `var G = window.GAME;` and is written as an IIFE meant to be
loaded inside an HTML harness (`<script>` tag in a browser page), not run via
`node`. Confirmed by inspecting each file's header — they reference
`window.location.search`, `document.getElementById`, etc. with no Node shim.

### CANONICAL-VAULT DRIFT (2 files, same root cause)

`test/canonical-sync.js` and `tools/check-canonical-sync.js` both fail with the
identical divergence:
```
canonical-sync: FAIL
  checked=96 equal=94 known=0 errors=2
  ERROR index.html [unaudited_divergence]
  ERROR js/engine.js [unaudited_divergence]
```
Both `index.html` and `js/engine.js` in the deploy repo now differ from the
audited SHA-256 recorded for the vault canonical source
(`/Users/ebuccelli/Vault/1. Projects/Twin Peaks Game`). This is the expected state
after local edits that have not yet been re-audited/synced back to the vault, per
`CANONICAL-SYNC.md` and the project's `CLAUDE.md` ("the vault is canonical;
ember-mind/twin-peaks-game is a deploy copy, not source of truth"). Not a code bug;
requires a sync pass (`node tools/check-canonical-sync.js` is the documented
pre-sync gate) before the next deploy.

### NEW REAL REGRESSION (3 files)

**`test/double-r-exterior-native.js` and `test/double-r-location-native.js`** — both
crash identically:
```
TypeError: image.getAttribute is not a function
    at syncSpeakerPortrait (js/engine.js:1571:27)
```
`js/engine.js:1571` (`syncSpeakerPortrait`, committed today in `b5de5d2 Implementa
Atto 4 (M8)`) now calls
`image.getAttribute('data-speaker-source')` on the `#speaker-portrait-hires` DOM
node every render frame. Both test harnesses mock `document.getElementById` with a
plain object that only implements `setAttribute`/`removeAttribute`/`classList`, not
`getAttribute` — so any render pass crashes. Other native-DOM tests
(`room-315-native.js`, `hospital-native.js`, `traincar-native.js`,
`sheriffs-station-native.js`) survive only because they mock
`getElementById: () => null`, which short-circuits `syncSpeakerPortrait`'s early
return before reaching the new call — they never exercised this code path either.
This is new code (today's Act 4 commit) that the double-r native test doubles were
never updated for; a real browser has `getAttribute` so production itself is not
provably broken, but these two suites cannot currently verify anything past the
first render tick.

**`test/sprite-gates.js`** — Crystal-reference hard gate fails on profile-view sprite
width:
```
AssertionError [ERR_ASSERTION]: side bbox outside Crystal 12–14px bar
```
The printed per-cast table shows `bbox profilo min/max 12 / 15 px (bar 12–14)` — at
least one cast member's side/profile sprite is 15px wide, one pixel over the
Pokémon Crystal reference-derived bar codified in `test/sprite-gates.js` (`R101:
valori ricostruiti sul commit pret/pokecrystal 7a7881d`). Git history shows the cast
sprite sheet and `assets/sprites/CAST.md` were touched by today's "Completa cast
R102E e QA Gauntlet" commit; no doc or changelog entry documents this bar as
intentionally exceeded, so it reads as a genuine regression in that commit rather
than a pre-known defect.

### STALE COUNT-PIN (2 files)

**`test/narrative-validate-m9.js`** — fails the check `'M5 (21) / M6 (17, ...) / M8
(12) coerenti'`, i.e. it asserts `M8.node_count.runtime_total === 12`. Actual
current value read from `narrative/missions/M8.json`:
```
M8 node_count.runtime_total = 16 (nodes.length = 16)
```
(M5=21 and M6=17 both still match.) M8's node count grew from 12 to 16 as part of
today's Act 4 implementation (`b5de5d2`); `narrative-validate-m9.js`'s hardcoded
expectation was not updated to match.

**`test/retro-production.js`** — fails `production_cache_busts_layout_fix`, which
requires the literal substring `js/narrative-data.gen.js?v=18act3c` in `index.html`.
Actual tag in `index.html`:
```
<script src="js/narrative-data.gen.js?v=19act4b1"></script>
```
The cache-bust version was legitimately bumped for Act 4 content
(`19act4b1`); the test's pinned literal was not updated to match.

### PRE-EXISTING (1 file)

**`test/narrative-repair-contract.js`** — fails `'grammatica corretta nei due errori
noti'`, which asserts `Data.clues.anello.desc.includes('Perché')`. Current
`Data.clues.anello.desc` (`js/data.js`) reads:
```
"Era sotto un'asse del vagone, al centro. Niente qui dice di chi sia."
```
— no "Perché" substring. `docs/story/CHANGELOG.md` (dated 2026-09-10, entry
`ring-identity`) explicitly documents this wording as intentionally retired:
> classic wording retired: "L'anello del vagone" / "Niente qui dice di chi sia" ...
> no truth changed (ring identity stays OPEN)

The doc confirms the content change was deliberate and predates this audit; the test
assertion (written for the old "Perché"-bearing copy) simply was not updated
alongside that documented change.
