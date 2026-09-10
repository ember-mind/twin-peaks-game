# Full `node test/*.js` sweep — Act 3 closure (task E2, part 2)

Run: every `node test/*.js` entry point (102 files, including the new
`test/probe-act3-pacing.js` written for part 1), plus `node test/narrative-lint.js`
(already inside `test/*.js`) and `node tools/check-canonical-sync.js`. 120s timeout
per file (macOS has no `timeout` binary; used a background-process + kill wrapper).

Totals: **85 pass, 18 fail** out of 103 files run (102 from the `test/*.js` glob +
`tools/check-canonical-sync.js`, plus the new `test/probe-act3-pacing.js` verified
separately after part 1 was finished).

## Pass/fail table (failures only; full pass list omitted for length)

| File | Result | First failing signal |
|---|---|---|
| test/bosco-gates.js | FAIL (exit 2) | `uso: bosco-gates.js <frame.png> [--mockup=ox,oy,f] [--exclude=x0,y0,x1,y1]` |
| test/canonical-sync.js | FAIL (exit 1) | `AssertionError [ERR_ASSERTION]` — `deepStrictEqual`, divergence list below |
| test/capture-chrome.js | FAIL (exit 2) | `capture-chrome: Error: Chrome binary missing` |
| test/character-life-preview.js | FAIL (exit 1) | `ReferenceError: window is not defined` |
| test/double-r-exterior-native.js | FAIL (exit 1) | `TypeError: image.getAttribute is not a function` |
| test/double-r-exterior-prototype.js | FAIL (exit 1) | `ReferenceError: window is not defined` |
| test/double-r-location-native.js | FAIL (exit 1) | `TypeError: image.getAttribute is not a function` |
| test/double-r-location.js | FAIL (exit 1) | `ReferenceError: window is not defined` |
| test/edifici-gates.js | FAIL (exit 2) | `uso: edifici-gates.js <frame.png> [--mockup=ox,oy,fx,fy] [--json]` |
| test/greyscale.js | FAIL (exit 2) | `uso: greyscale.js <in.png> <out.png>` |
| test/pixel-gates.js | FAIL (exit 2) | `uso: pixel-gates.js <frame.png> [--rect=...] [--tile-discipline] [--stamp=y0,y1]` |
| test/portrait-evidence-parity.js | FAIL (exit 1) | `AssertionError [ERR_ASSERTION]: portrait evidence drift: [{file:'test/smoke.js', error:'byte_drift'}]` |
| test/sheriffs-station-preview.js | FAIL (exit 1) | `ReferenceError: window is not defined` |
| test/sprite-gates.js | FAIL (exit 1) | `node:internal/assert/utils` — `operator: '=='` |
| test/station-population-preview.js | FAIL (exit 1) | `ReferenceError: window is not defined` |
| test/verify-shot.js | FAIL (exit 2) | `verify-shot: file mancante: (nessuno)` |
| test/visual-audit-capture.js | FAIL (exit 2) | `Error: --output è obbligatorio` |
| test/probe-act3-pacing.js | **PASS** | (new file, written for part 1) |
| tools/check-canonical-sync.js | FAIL (exit 1) | `checked=96 equal=88 known=0 errors=8` — divergence list below |

## Classification against the pre-existing failure set

`docs/act-3-implementation-pass-01-report.md` §"Full `node test/*.js` sweep" names
the pre-existing, unchanged-by-design failure set as: `sprite-gates`, `pixel-gates`,
`bosco/edifici-gates`, `greyscale`, browser-only `*-preview` / `double-r-*` /
`verify-shot` / `visual-audit-capture`.

**Matches the documented pre-existing set (no regression):**
- `bosco-gates.js`, `edifici-gates.js`, `greyscale.js`, `pixel-gates.js`,
  `sprite-gates.js` — CLI tools that need a `<frame.png>` argument or fail an
  image-content assertion; exactly the named classes.
- `character-life-preview.js`, `sheriffs-station-preview.js`,
  `station-population-preview.js` — `*-preview`, browser-only (`window is not
  defined` under Node).
- `double-r-exterior-native.js`, `double-r-exterior-prototype.js`,
  `double-r-location-native.js`, `double-r-location.js` — `double-r-*`.
- `verify-shot.js`, `visual-audit-capture.js` — named explicitly.

**Not literally named, same class (browser/CLI tooling, not a code regression):**
- `capture-chrome.js` — `Chrome binary missing`; a headless-Chrome capture tool,
  same "requires a browser/external binary" class as the `*-preview`/
  `verify-shot`/`visual-audit-capture` group, just not spelled out by name in the
  pass-01 report.

**Not in the documented list — flagged, not fixed:**
- `canonical-sync.js`, `portrait-evidence-parity.js`, `tools/check-canonical-sync.js`
  all fail with content-drift assertions (`deepStrictEqual`/`portrait evidence
  drift`), not argument/environment errors. Given the working tree at the start of
  this session (`git status` showed dozens of modified files — `CANONICAL-SYNC.md`,
  `canonical-sync.manifest.json`, most of `js/`, most of `test/`, plus several
  untracked `artifacts/*` directories from other in-flight agent work), this reads
  as uncommitted-changes drift against the canonical manifest, not a defect
  introduced by the Act 3 pacing/sweep work in this task. Reported verbatim below
  for the team lead to reconcile against whichever agent's commit closes that
  drift; not something this task should silently "fix" by mirroring files.

### `tools/check-canonical-sync.js` — exact out-of-sync files

```
checked=96 equal=88 known=0 errors=8
ERROR index.html [unaudited_divergence]
ERROR js/environmental-inspect.js [unaudited_divergence]
ERROR js/maps.js [unaudited_divergence]
ERROR js/narrative-engine-adapter.js [unaudited_divergence]
ERROR js/traincar-art.js [canonical_missing]
ERROR js/traincar-location-data.js [unaudited_divergence]
ERROR js/traincar-production.js [canonical_missing]
ERROR js/traincar-scene.js [canonical_missing]
```

`test/canonical-sync.js` fails on the same 8 files (plus SHA-256 pairs per file,
omitted here — same list). No files were mirrored or touched to resolve this.

### `test/portrait-evidence-parity.js` — exact assertion

```
AssertionError [ERR_ASSERTION]: portrait evidence drift:
[ { file: 'test/smoke.js', error: 'byte_drift' } ]
+ actual - expected
+ [ { error: 'byte_drift', file: 'test/smoke.js' } ]
- []
```

## Summary for the team lead

- Regressions found: **none** beyond the pre-existing/documented set.
- Failures not in the documented list: the three canonical-sync-family checks
  (`canonical-sync.js`, `portrait-evidence-parity.js`,
  `tools/check-canonical-sync.js`) — all content-drift against the canonical
  manifest, consistent with the dozens of uncommitted modified files already
  present in the working tree at session start, not with anything this task
  changed. `capture-chrome.js` is browser-tooling failure in the same spirit as
  the documented `*-preview`/`verify-shot` group, just not named explicitly.
- `test/probe-act3-pacing.js` (new, part 1 of this task) passes.
