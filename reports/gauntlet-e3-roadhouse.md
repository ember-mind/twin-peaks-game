# Gauntlet E3 — Roadhouse

## Outcome

Native Roadhouse scene shipped on `qwen/night-art-e3-roadhouse` from main `d199a28`. Bar: `assets/ref/roadhouse-B.png`; only neon sign, upright piano, and trophies borrowed from A.

Budget amendment arrived after 16 shared full-scene build/critic rounds. Existing run had already exceeded new four-round limit. Work stopped immediately: zero post-amendment build/critic rounds. One material revision already in flight completed before amendment receipt; it was checkpointed but not sent to another critic. Latest scored verdict remains `BAR_WINS`.

## Before / after

| State | Evidence | SHA-256 |
|---|---|---|
| Baseline | `artifacts/art-pass-e/e3/baseline.png` | `c48a416cd523d4cb4fee9491c89fb93d1d8a5358a9ff17e200946a92aa6475f0` |
| Latest scored | `artifacts/art-pass-e/e3/round-16.png` | `8abebc19ae5ea36e4dbb0156670a3b74ec38c387ea337f057d4f8ddfcaa2e9b1` |
| Shipped cap checkpoint | `artifacts/art-pass-e/e3/final.png` | `9aed59c81cc0648791e0a5f27e52fc6e2c9bd83eab50d04b5e85737578101fa9` |

All use fixed capture: `test/shot.sh roadhouse 7 8 up <path> --retro`.

## Per-unit results

Every critic before amendment scored all six units from same locked scene capture. `Rounds used` therefore means shared pre-amendment rounds, not unit-isolated passes. Post-amendment rounds used: 0 for every unit. Shared elapsed wall time: about 90 minutes; per-unit time and token counts unavailable.

| Unit | Baseline → latest | Best | Floor | Rounds used | Shipped round | Status |
|---|---:|---:|---:|---:|---|---|
| Floor + walls | 2 → 6.5 | 7.0 | 7 | 16 pre-cap / 0 post-cap | cap checkpoint after R16, unscored | best met; latest below |
| Stage | 1 → 6.5 | 7.2 | 7 | 16 pre-cap / 0 post-cap | cap checkpoint after R16, unscored | best met; latest below |
| Bar | 1 → 7.0 | 7.1 | 7 | 16 pre-cap / 0 post-cap | cap checkpoint after R16, unscored | pass |
| Booths + tables | 2 → 6.5 | 7.1 | 7 | 16 pre-cap / 0 post-cap | cap checkpoint after R16, unscored | best met; latest below |
| Lighting | 1 → 6.0 | 6.5 | 7 | 16 pre-cap / 0 post-cap | cap checkpoint after R16, unscored | **below floor** |
| Door | 6 → 7.0 | 7.8 | 7 | 16 pre-cap / 0 post-cap | cap checkpoint after R16, unscored | pass |

Scores per shared round (`R1…R16`):

| Unit | Scores |
|---|---|
| Floor + walls | `5, 5.5, 6, 6.5, 6.5, 7, 6, 6.5, 7, 6, 6, 6.5, 6.5, 7, 7, 6.5` |
| Stage | `5.5, 4.5, 7, 6.5, 7, 7.2, 7.2, 7, 7, 6.5, 7, 6, 7, 6.5, 7, 6.5` |
| Bar | `6.5, 6, 6.5, 7, 7, 7.1, 7.1, 7, 6, 7, 7, 7, 7, 7, 7, 7` |
| Booths + tables | `6, 5, 7, 6.5, 7, 7.1, 6.8, 7, 6, 6.5, 7, 6.5, 6.5, 6, 6, 6.5` |
| Lighting | `4, 4.5, 5.5, 5, 6.5, 6.5, 6.2, 6, 6, 5.5, 6, 6, 6, 6, 6, 6` |
| Door | `7, 7, 7.5, 7.5, 7.5, 7.5, 7.8, 7.5, 7, 7, 7, 7, 7.5, 7, 7.5, 7` |

## Critic vetoes

| Rounds | Veto / one gap |
|---|---|
| 1, 3–4 | Practical sources lacked bounded receiving pools. |
| 2 | Stage obscured by table/chair overlap. |
| 5, 7 | Checker floor and wall separation too weak. |
| 6, 8–13 | Warm light still read as isolated strips/symbols more than shaped surface light. |
| 14–15 | Booth/table silhouettes merged; tabletops lacked clear candlelit usable surfaces. |
| 16 | Practical lights still shaped nearby wood/floor insufficiently. |

Best unresolved gap: lighting, 6.5/10. Latest critic also placed floor+walls, stage, and booths+tables at 6.5. No extra round ran after budget amendment.

## Scene and invariants

- Native scene: `js/roadhouse-art.js`, `js/roadhouse-scene.js`, `js/roadhouse-production.js`.
- Registered in `index.html` and `test/retro-scene.html`.
- Ambient registered in `js/ambient-life-scenes.js` using existing `LIGHT_NEON`, `LIGHT_WARM_VARIATION`, `MACHINE_IDLE_ACTIVITY`, and `STEAM_SMALL` archetypes only.
- Map rows, double door, pay phone `(8,5)`, stage/Giant `(8,1)`, Cast Presence body coordinates, and walkability unchanged.
- Protected files untouched: `js/retro.js`, `js/retro-authored.js`, `js/tiles.js`.
- `test/retro-production.js` updated two stale cache-token expectations to current main values (`narrative-data` v20cast; adapter v12). No runtime production behavior changed there.

## Files

- `js/roadhouse-art.js`
- `js/roadhouse-scene.js`
- `js/roadhouse-production.js`
- `js/ambient-life-scenes.js`
- `index.html`
- `test/retro-scene.html`
- `test/retro-production.js`
- `artifacts/art-pass-e/e3/`
- `.gauntlet/e3/`
- `reports/gauntlet-e3-roadhouse.md`

## Commits

| Commit | Contents |
|---|---|
| `59dbb7a8930b4f3dda88c58fe1fae11e67da9ec9` | Native scene, registration, ambient, test-token repair, shipped checkpoint PNG |
| `e0229eeba34bae9966d3b128c6dddec56023d906` | Gauntlet evidence, critic notes, progress, run state, manifest |

No push performed.

## Gates

| Gate | Result |
|---|---|
| `node test/smoke.js` | PASS — 415/415 |
| `node test/walkthrough.js` | PASS — 85 acquisitions |
| `node test/retro-production.js` | PASS — 54/54 |
| `node test/mobile-production.js` | PASS — 20/20 |
| `node test/cast-continuity-validate.js` | PASS — all invariants |
| `node test/act-4-flow.js` | PASS — 1611/1611 |
| `node test/act-4-playthrough.js --path=all` | PASS — 530/530, A/B/C/D, Chrome headless SwiftShader; one expected test-server `favicon.ico` 404 observation |
| Gauntlet evidence manifest | PASS — 19 files, no duplicate hashes |
| Gauntlet release audit | FAIL by design — latest independent visual scores below 7 and unresolved lighting gap |

Playthrough evidence copied to `final-gathering.png`, `final-giant-stage.png`, and `final-phone-widget.png` under `artifacts/art-pass-e/e3/`. Generated Act 4 fixture artifacts were restored after verification; only E3 copies are committed.
