# Deep — town-dusk test re-pinned to the DQ3 contract, then gated

Branch `deep/town-dusk-test-dq3`, worktree `.worktrees/dusk-test`, from `main`
(`d626626`). Grade in `js/town-dusk.js` untouched; `test/town-dusk.js` re-pinned;
`node test/town-dusk.js` added to `.github/workflows/tests.yml` under `node-tests`.

Verdict: **6 checks re-pinned to the DQ3 outputs, 11 unchanged, 0 candidate
regressions.** Every failure traces to a bf6c2c2 hunk and/or the commit sentence
"la gradazione di town-dusk.js è riequilibrata (mid/hi gain, keep di
ground/vegetation)": `@@ -43,8 +43,8` (MID/HI/asphalt gains) and
`@@ -53,8 +53,8` (ground/vegetation keep, dark, anchorMix). Bands were
re-derived from the current outputs with the same shapes (inBand ±12, within ±12,
ordering); no tolerance was widened.

One line per check (17):

| # | check | outcome | DQ3 move / before → after |
| --- | --- | --- | --- |
| 1 | deterministico: stesso ingresso, stessa uscita | unchanged (pass) | — |
| 2 | memoizzato per chiave 24 bit | unchanged (pass) | — |
| 3 | uscita intera in 0..255 e mai nero pieno | unchanged (pass) | — |
| 4 | la curva asfalto e quella terreno restano separate | unchanged (pass) | already re-pinned by 9dbcdaa |
| 5 | creme del terreno -> calcestruzzo | **re-pinned** | ground keep `@@ -53,8`; band `#6f6d64..#7a766c` → `#c4b17e..#d5c390` (`#e8d08f`→`#d5c38f`, `#dfcb91`→`#cebe90`, `#d6bc7d`→`#c5b17e`, `#dbc78d`→`#caba8c`, `#d4be84`→`#c4b284`) |
| 6 | tile di strada -> ardesia #485665 | **re-pinned** | asphalt `@@ -43,8`; target `#485665` → `#9a9a95`, ±12 (`#dfcb91`→`#979793`, `#e8d08f`→`#9a9a95`) |
| 7 | prato e alberi -> verde profondo | **re-pinned** | vegetation `@@ -53,8`; band `#2f4d3b..#33553f` → `#70b891..#77bb97`; ceiling `93/122/90` → `171/176/118` (`#abb076`) |
| 8 | bordeaux resta bordeaux e i legni restano bruni | unchanged (pass) | — |
| 9 | inchiostri e contorni restano scuri | unchanged (pass) | — |
| 10 | le alteluci ... sotto #b8b4a4 | **re-pinned** | MID/HI gain `@@ -43,8`; ceiling `#b8b4a4` → `#f2f2f3` (`#fff8d0`→`#f0ebcb` L234, `#f3dfa8`→`#e1d1a5` L209, `#ffffff`→`#f2f2f3` L242) |
| 11 | il marciapiede atterra sullo stack di calcestruzzo | **re-pinned** | ground keep `@@ -53,8`; slab `#a9a38f`→`#f1f2d2`, seam `#898a7a`→`#dcddbe`, kerb `#777b70`→`#cbd0bb`, ±12 |
| 12 | nessun tono di calcestruzzo cade nella famiglia vegetazione | unchanged (pass) | familyOf boundaries unchanged |
| 13 | ogni rettangolo emissivo sta dentro i visualBounds | unchanged (pass) | — |
| 14 | le luci sono piu' chiare della parete | unchanged (pass) | — |
| 15 | i lampioni nascono dal glifo L | unchanged (pass) | — |
| 16 | l'hook grada e disegna solo per town | unchanged (pass) | — |
| 17 | applyGrade usa la curva asfalto solo dentro le tile di strada | **re-pinned** | ground keep + asphalt `@@ -43,8`; outside `#6f6d64..#7a766c` → `#c4b17e..#d5c390`, inside `#485665` → `#9a9a95` (masking contract unchanged) |

Candidate regressions listed: **0**.

Observation (not a candidate): check 10's ceiling is now the brightest DQ3
highlight, so `#ffffff` sits exactly on it. It still fails if the shoulder is
ever lifted again, but the margin is zero — worth a second look if the grade
moves again.

## Gates

```
node test/town-dusk.js                             17 check ok        exit 0
node test/smoke.js                                 415 controlli superati ✔
node test/walkthrough.js                           OK: 85 acquisizioni, finale raggiunto ✔
node test/ci-workflow-inventory.js                 PASS (browser.yml, tests.yml)
node tools/run-release-tests.js --out=/tmp/tp-dusk-test   PASS 116/116 Node commands
```

`tests.yml` gains one `node-tests` step (`Town dusk grade contract (DQ3 palette)`);
`reports/ci-inventory-after.txt` regenerated to include it. Not pushed.
