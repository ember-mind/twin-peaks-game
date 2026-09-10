# Repair ledger — stale test pins G4–G7

Run 2026-09-10. Scope: `test/narrative-validate-m9.js`, `test/retro-production.js`,
`test/narrative-repair-contract.js`, `test/double-r-exterior-native.js`,
`test/double-r-location-native.js`. No `js/`, `narrative/`, `docs/`, or `index.html`
files touched.

| FILE | PRE-AUDIT STATE | REASON | APPROVED SOURCE | CHANGE | VALIDATION |
|---|---|---|---|---|---|
| test/narrative-validate-m9.js | `ok(M8.node_count.runtime_total === 12 && M6.node_count.runtime_total === 17 && M5.node_count.runtime_total === 21, 'M5 (21) / M6 (17, ...) / M8 (12) coerenti');` | M8 grew from 12 to 16 runtime nodes as part of the approved Act 4 pass 01 implementation; the hardcoded pin was never updated. | `narrative/missions/M8.json` `node_count.runtime_total` = 16; `narrative/schema-deltas/M8.md` §10 | `ok(M8.node_count.runtime_total === 16 && M6.node_count.runtime_total === 17 && M5.node_count.runtime_total === 21, 'M5 (21) / M6 (17, ...) / M8 (16) coerenti');` | `node test/narrative-validate-m9.js` → exit 0, "3967 controlli statici M9 superati ✔ ... 4 nodi" |
| test/retro-production.js | `production_cache_busts_layout_fix` required literal `js/narrative-data.gen.js?v=18act3c`; `production_cache_busts_objective_notebook_fix` also pinned `js/narrative-engine-adapter.js?v=10` and `js/narrative-production.js?v=21`. | Cache-bust tags were legitimately bumped for Act 4 content; the test's pinned literals were not updated to match. The adapter/production pins were masked in the original audit because `assert()` throws on the first failing check (`production_cache_busts_layout_fix`), so the downstream mismatches on `narrative-engine-adapter.js` and `narrative-production.js` only surfaced once the first pin was corrected. | live `index.html` tags: `js/narrative-data.gen.js?v=19act4b1`, `js/narrative-engine-adapter.js?v=11`, `js/narrative-production.js?v=22` | `.../narrative-data\.gen\.js\?v=19act4b1/`, `.../narrative-engine-adapter\.js\?v=11/`, `.../narrative-production\.js\?v=22/` | `node test/retro-production.js` — see "Remaining failure" below; still fails on an unrelated, out-of-scope check (`heartgold_flat_world_projection`) requiring an `engine.js` change |
| test/narrative-repair-contract.js | `ok(Data.clues.anello.desc.includes('Perché') && /Una sola occasione/.test(corpus(D.gerard_a2)), 'grammatica corretta nei due errori noti');` | `docs/story/CHANGELOG.md` (2026-09-10, `ring-identity` entry) documents the classic "Perché"-bearing wording as intentionally retired; no truth changed. | `docs/story/CHANGELOG.md` (ring-identity entry, 2026-09-10); live `js/data.js` `Data.clues.anello.desc` = `"Era sotto un'asse del vagone, al centro. Niente qui dice di chi sia."` | `ok(Data.clues.anello.desc.includes('Niente qui dice di chi sia') && /Una sola occasione/.test(corpus(D.gerard_a2)), 'grammatica corretta nei due errori noti');` | `node test/narrative-repair-contract.js` → exit 0, "NARRATIVE-REPAIR-CONTRACT-PASS 34/34" |
| test/double-r-exterior-native.js | `function el(id){return els[id]||(els[id]={..., setAttribute:noop, addEventListener:noop});}` (no `getAttribute`) | `syncSpeakerPortrait` (added in today's Act 4 commit `b5de5d2`) now calls `image.getAttribute('data-speaker-source')` every render frame; the DOM mock implemented `setAttribute`/`removeAttribute`(absent)/`classList` but not `getAttribute`, so any render pass crashed with `TypeError: image.getAttribute is not a function`. | `js/engine.js:1571` (`syncSpeakerPortrait`) — real browser DOM elements implement `getAttribute` natively; mock was incomplete, not production. | Added a minimal attribute store backing `setAttribute`/`getAttribute`/`removeAttribute` on the same mock element: `_attrs:{}, setAttribute(n,v){this._attrs[n]=v;}, getAttribute(n){return n in this._attrs?this._attrs[n]:null;}, removeAttribute(n){delete this._attrs[n];}` | `node test/double-r-exterior-native.js` → exit 0, "DOUBLE-R-EXTERIOR-NATIVE-PASS 18/18" |
| test/double-r-location-native.js | `function el(id){return els[id]||(els[id]={..., setAttribute:noop, addEventListener:noop});}` (no `getAttribute`) | Same crash and root cause as above, in the sibling native-DOM harness. | Same as above | Same attribute-store addition as `double-r-exterior-native.js` | `node test/double-r-location-native.js` → exit 0, "DOUBLE-R-LOCATION-CONTROLLER-PASS demo round trip, save/reaction ledger and reset cancellation" |

## Cross-suite validation

- `node test/smoke.js` → exit 0, "420 controlli superati ✔"
- `node test/walkthrough.js` → exit 0, "OK: cammino completo simulato, 81 acquisizioni, finale raggiunto ✔"

No drop in check/acquisition counts vs. the pre-repair run.

## Remaining failure (still open, out of boundary)

`test/retro-production.js` still fails after the three cache-bust literals above
were corrected. The next assertion in file order, `heartgold_flat_world_projection`
(`/var SCALE = 1/.test(engine) && /viewport DS-like: 16x12 metatile/.test(engine)`),
fails because `js/engine.js` contains `var SCALE = 1;` but does not contain the
string `"viewport DS-like: 16x12 metatile"`. This is unrelated to the G5 stale
cache-bust pin (it was masked in the original audit only because `assert()` throws
on first failure) and fixing it would require editing `js/engine.js`, which is
outside this task's stated boundary. Left unfixed and flagged for the lead.
