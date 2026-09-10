# Act 4 — environment inventory

Read-only inventory. Facts only, no recommendations. Date: 2026-09-10.

Sources: `js/maps.js`, `js/glue.js`, `js/data.js`, `js/world-catalog.js`,
`js/narrative-engine-adapter.js`, `js/*-location-data.js`, `index.html`,
`narrative/missions/M8.json`, `docs/world-visual-bible-v0.1.md`, `artifacts/*`.

Act 4 = mission **M8 "Sta accadendo di nuovo"** (`narrative/missions/M8.json`,
entry condition flag `atto4`, 12 nodes) plus the classic Act 4 content in
`js/data.js` / `js/glue.js` gated on `flag:atto4`, `flag:gigante2`,
`flag:maddy_trovata`.

M8 node → map/target table (from `narrative/missions/M8.json`):

| node | beat | map_id | target_id |
|---|---|---|---|
| `m8_diner` | A | diner | maddy |
| `m8_leland_taxi` | B0 | diner | leland |
| `m8_roadhouse` | B | roadhouse | roadhouse_phone |
| `m8_focus_choice` | C | town | town_crossroads |
| `m8_route_palmer` | C | palmer | palmer_entrance |
| `m8_route_lake` | C | town | lago_maddy |
| `m8_route_diner` | C | diner | norma |
| `m8_discovery` | D | town | lago_maddy |
| `m8_promise_echo` | D | town | lago_maddy |
| `m8_cmp_letters` | E | — (notebook) | — |
| `m8_cmp_diary` | E | — (notebook) | — |
| `m8_station` | F | sheriff | truman |

`hotel_gn`, `hospital`, `woods` carry **no** M8 node. They appear in Act 4 only
through classic content (`hotel_gn`: none beyond Act 2 NPCs; `hospital`:
`gerard_a4`; `woods`: none).

---

## diner (Double R interior)

| field | value |
|---|---|
| Map id | `diner` |
| Size | 10 rows × 14 cols (`js/maps.js:265`) |
| Interior/exterior | `indoor: true` |
| Doors (authored) | `6,9` and `7,9` → `town` 42,21 down |
| Doors (installed) | `double-r-front-entrance` overrides `6,9`/`7,9` → `double_r_exterior_prototype` 6,7 down, `departureReaction: 'front-door'` (`js/double-r-location-data.js:6`) |
| Spawn from exterior | 6,8 up |
| Town access | town door `42,20` → `double_r_exterior_prototype` 6,10 up (`js/maps.js:119`) |
| Special data | `interior:` object literal (material `diner`, counter, 5 stools, 4 booths, 2 seated guests, plant, coat rack, specials board, island plant) |

**Rendering tier: native (authored 2D interior).** The only map with an
`interior` model consumed by `INTERIOR_MATERIALS` in `js/retro-authored.js:4203`
(`diner` is the sole entry in that table). Files: `js/double-r-exterior-art.js`,
`js/double-r-exterior-scene.js`, `js/double-r-location-data.js`,
`js/double-r-location-production.js`, plus the diner branches in
`js/retro-authored.js` (4993, 4619, 6821, 6867) and
`js/character-activity.js` (diner gestures). No `js/diner-art.js` /
`js/diner-scene.js` exists; the interior art lives inside `retro-authored.js`.

**Artifacts:** the largest cluster in the repo —
`artifacts/diner-final-art` (2 PNG, newest `final.png`, 2026-09-08, README),
`artifacts/diner-flagship` (`final.png` 2026-09-08, README + `gpt-5.6-review.md`),
`artifacts/diner-polish` (`final.png` 2026-09-08), `artifacts/diner-redesign`
(`final.png`, README + review), `artifacts/diner-seating` (`final.png`),
`artifacts/diner-ambient` (301 PNG, newest `motion-preview.png`, README),
`artifacts/diner-ambient-011` (637 PNG, newest `overlap-preview.png`, README),
`artifacts/diner-ambient-readable`, `artifacts/diner-ambient-visible`,
`artifacts/diner-preview-controls`, `artifacts/diner-preview-replay` (README only),
`artifacts/diner-environment-02` (677 PNG, newest `minute-frames/frame-599.png`),
`artifacts/diner-gestures` (83 PNG, newest `sip-detail-montage.png`, README),
`artifacts/diner-wipe-fix` (81 PNG), `artifacts/double-r-exterior-v01`
(`double-r-exterior-v01-final.png`, README), `artifacts/double-r-exterior-v02`
(3 PNG, newest `native-entrance.png` 2026-09-08, README),
`artifacts/double-r-location-03` (README only).

**Visual bible:** named as a Golden reference in the header block —
"Double R Interior Golden: `artifacts/diner-final-art/final.png`" and
"Double R Exterior Native Reference: `artifacts/double-r-exterior-v02/native-clean.png`".
Cited under "## 0. World state of the current slice", "## 4. Material grammar",
"## 5. Lighting grammar", "## 9. Exterior ↔ interior continuity".

**Act 4 entities/staging.**
NARRATIVE_ENTITIES (`js/narrative-engine-adapter.js`):
- `maddy` at 10,1 sprite `maddy` — `when: atto4 AND NOT value_set promise_stance`
- `leland` at 11,1 sprite `leland` — `when: atto4 AND value_set promise_stance AND NOT evidence T_LELAND_TAXI`

Classic NPCs (`js/glue.js:69`): `norma` 5,2; `shelly` 9,7; `loglady` 4,5
(cascade `{cond:'flag:atto4' → 'loglady_a4'}`); `james` 9,6 (`cond flag:sogno_fatto`).

**Ambient / Character Life hooks.**
- `js/ambient-life-scenes.js:10` — `AmbientLife.register('diner', …)`.
- `js/ambient-life-scenes.js:57` — `EnvironmentReactions.register('diner', [front-door])`.
- `js/double-r-location-production.js:10` — same `front-door` doorway reaction, registered in the production chain.
- `js/character-activity.js:12` — `clock.register('diner', dinerDefs)`, the two authored Diner gestures (sip detail via `INTERIOR_MATERIALS.diner`).

---

## palmer (Palmer house)

| field | value |
|---|---|
| Map id | `palmer` |
| Size | 12 rows × 16 cols (`js/maps.js:166`) |
| Interior/exterior | `indoor: true` |
| Doors | `7,11` and `8,11` → `town` 42,7 down |
| Town access | town door `42,6` → `palmer` 7,10 up, no flag gate |
| Spawn | 7,10 |
| Interact | `6,1` → `cameraLaura` (sparkle) |

**Rendering tier: legacy tile-only.** No `js/palmer-*.js` of any kind. Rendered
by the generic glyph path in `js/retro-authored.js` (single `mapId === 'palmer'`
branch at line 5085, inside the generic interior wall/panel routine). Not in
`world-catalog.js`, so no World Engine location, no installed connection.
`js/render3d.js:298` carries only a town-footprint palette entry
(`'3': … kind: 'palmer'`), i.e. the exterior building mass on the town map.

**Artifacts:** none. No `artifacts/palmer*` directory exists.

**Visual bible:** not mentioned anywhere in `docs/world-visual-bible-v0.1.md`.

**Act 4 entities/staging.** NARRATIVE_ENTITIES: none for `palmer`.
Classic NPCs (`js/glue.js:45`):
- `sarah` 9,7 — cascade `{cond:'flag:atto4' → 'sarah_visione'}` (sets `sarah_visione_ascoltata`)
- `leland` 12,8 — `cond: ['!flag:atto5','!flag:gigante2','!flag:narrative_m8_owned']`; cascade `maddy_trovata → leland_dopo`, `gigante2 → leland_dove`, `atto4 → leland_a4`
- `maddy` 11,7 — `cond: ['flag:atto4','!flag:gigante2','!flag:narrative_m8_owned']`, dialogue `maddy_a4`

WORLD_TARGETS (`js/narrative-engine-adapter.js`): `palmer_entrance` at 8,10, kind `landmark`.

**Ambient / Character Life hooks.** None registered for `palmer`.

---

## roadhouse

| field | value |
|---|---|
| Map id | `roadhouse` |
| Size | 10 rows × 16 cols (`js/maps.js:409`) |
| Interior/exterior | `indoor: true` |
| Doors | `7,9` and `8,9` → `town` 47,29 down |
| Town access | town door `47,28` → `roadhouse` 7,8 up, `needsFlag: 'atto4'`, `blockedMsg: 'roadhouse_chiuso'` |
| Spawn | 7,8 / 8,8 |
| Interact | `{}` — empty. The classic `'8,1': 'palco_gigante'` interact was removed in the Act 3 implementation pass (`docs/act-3-implementation-pass-01-report.md:12`) |
| Layout | stage row 1 (solid `C`), tables rows 3 and 7, bar + stools row 5, phone tile 8,5 kept free |

**Rendering tier: legacy tile-only.** No `js/roadhouse-*.js`. Two glyph-level
branches in `js/retro-authored.js` (4904, and the panel/wall colour selectors at
5049/5052/5093). Not in `world-catalog.js`. `js/render3d.js:301` has only the
town-footprint palette entry (`'6': … kind: 'roadhouse'`).

**Artifacts:** none. No `artifacts/roadhouse*` directory.

**Visual bible:** not mentioned in `docs/world-visual-bible-v0.1.md`.

**Act 4 entities/staging.** NARRATIVE_ENTITIES: none for `roadhouse`.
Classic NPCs: none (`NPCS` in `js/glue.js` has no `roadhouse` key).
WORLD_TARGETS: `roadhouse_phone` at 8,5, kind `object` — the only interactive
target on the map. M8 node `m8_roadhouse` (beat B) fires there; the flag bridge
`js/narrative-production.js:163` sets classic `gigante2` when
`state.nodes_done.m8_roadhouse` is true. The Giant's second appearance is
authored at 8,1 in the map comment ("Gigante, seconda apparizione: 8,1") but has
no entity or interact entry.

**Ambient / Character Life hooks.** None registered for `roadhouse`.

---

## hotel_gn (Great Northern lobby)

| field | value |
|---|---|
| Map id | `hotel_gn` |
| Size | 12 rows × 18 cols (`js/maps.js:212`) — the only 18-wide map |
| Interior/exterior | `indoor: true` |
| Doors (authored) | `8,11` and `9,11` → `town` 9,7 down |
| Doors (installed) | `great-northern-room-315-hall`: trigger `14,1` → `room_315` spawn 7,10 up (`js/room-315-location-data.js:8`) |
| Town access | town door `9,6` → `hotel_gn` 8,10 up, `needsFlag: 'sogno_fatto'`, `blockedMsg: 'hotel_locked'` |
| Spawn | 8,10 (from town), 14,2 down (from Room 315) |
| Interact | `{}` |

**Rendering tier: legacy tile-only.** No `js/hotel-*.js`. One glyph branch in
`js/retro-authored.js:5078` (`mapId === 'hotel_gn'`) plus panel colour at 5049.
Registered in `js/world-catalog.js:46` as environment `lobby` of location
`great-northern`, with the in-file comment *"lobby: legacy glyph map (hotel_gn),
not a native-authored environment"*. `js/room-315-production.js:3` touches
`hotel_gn` only to install the hall connection.

**Artifacts:** none of its own. The sibling `room_315` has
`artifacts/room-315-v01` (25 PNG, newest `same-world-sheet.png` 2026-09-09;
goldens `native-golden.png`, `native-golden-5x.png`, `native-golden-door.png`;
`README.md`, `intent.md`, `native-translation-brief.md`, `integration-spec.md`).

**Visual bible:** not mentioned.

**Act 4 entities/staging.** NARRATIVE_ENTITIES: none. Classic NPCs
(`js/glue.js:59`): `benhorne` 5,7 (`benhorne_a2`), `audrey` 12,9 (`audrey_a2` /
`audrey_a2_ben`, wander). Both are Act 2 content, unchanged in Act 4.
WORLD_TARGETS: none.

**Ambient / Character Life hooks.** None in code. `docs/ambient-life.md:24`
shows a documentation example `GAME.AmbientLife.register('hotel_gn', …)` and a
`lobby-door` reaction example at line 123; neither is registered in any shipped
`js/` file.

**Known visual debt (quoted):**
- `docs/act-2-production-report.md:97` — "| Great Northern lobby (`hotel_gn`, legacy glyph) | B — content adaptation | Ben/Audrey rewrite only |"
- `docs/act-2-production-report.md:158` — "the ward and the lobby remain legacy glyph rooms."
- `docs/room-315-production-report.md:71` — "The hotel lobby (`hotel_gn`) remains the legacy day-lit glyph map; the corridor door into the room is a glyph door. It is registered as `lobby` but is not native quality."
- `docs/room-315-production-report.md:47` — "it is not claimed as finished native content."
- `docs/narrative-vertical-slice-01-report.md:162` — "The wake happens in the Great Northern hall map (legacy art), not in a room: 'Stanza 315' is a line, not a place." (superseded by Room 315 v01 for the room itself, not for the lobby.)

---

## room_315 (adjacent, not an M8 map)

| field | value |
|---|---|
| Map id | `room_315` |
| Size | 12 rows × 16 cols (`js/maps.js:190`) |
| Interior/exterior | `indoor: true` |
| Doors (authored) | `{}` |
| Doors (installed) | trigger `7,11` → `hotel_gn` spawn 14,2 down |
| Interact | `13,3` `specchio315` (sparkle), `1,5`/`2,5`/`3,5` `letto_315`, `8,3` `scrivania_315` |
| onEnter | dialogue `hotel_risveglio`, once `intro_hotel` |

**Rendering tier: native.** `js/room-315-art.js`, `js/room-315-scene.js`,
`js/room-315-location-data.js`, `js/room-315-production.js` — all four loaded in
`index.html:607-610`.

**Artifacts / bible:** `artifacts/room-315-v01`, newest PNG `same-world-sheet.png`
(2026-09-09). Bible amendment under "## 0. World state of the current slice":
Room 315 authored at dawn 6:20, reference `artifacts/room-315-v01/native-golden.png`.

**Act 4 use:** none. No M8 node, no `atto4`-gated content. Listed here because it
shares the `great-northern` location with `hotel_gn`.

---

## town

| field | value |
|---|---|
| Map id | `town` |
| Size | 36 rows × 56 cols (`js/maps.js:55`) — the largest map |
| Interior/exterior | exterior (`indoor` absent → false) |
| Doors | `9,6`→hotel_gn (needs `sogno_fatto`); `23,6`→hospital (needs `sogno_fatto`); `42,6`→palmer; `12,20`→sheriffs_station_exterior; `42,20`→double_r_exterior_prototype; `47,28`→roadhouse (needs `atto4`); `55,14`/`55,15`→traincar (needs `atto3`) |
| Gate | `50,0` → `woods` 14,20 up, `needsClues: 3` (compiled in `js/glue.js:148`) |
| Interact | `30,30` `cartello`, `15,28` `lago_riva`, `50,22` `tomba_laura` |
| Objects | 4 landmarks: waterfall (1,0 5×6), cemetery (48,21 6×4), tracks (53,1 2×33), welcomesign (30,30) |
| onEnter | dialogue `town_arrivo`, once `intro_town` |
| Spawn constraint | outdoor spawn row ≤ 23 unless inside the south varco (project CLAUDE.md) |

**Rendering tier: partial / native pass over glyphs.** No `js/town-art.js` or
`js/town-scene.js`. The town is authored inside `js/retro-authored.js`
(`townGround` and the building-group renderers, ~lines 5004-5220),
`js/houses.js` (top-down 3D-oblique building masses for glyphs `1`–`9`), and
graded by `js/town-dusk.js` (authored "early dusk" state, hooked into
`GAME.Retro2D.limitBackgroundPalettes`). `js/render3d.js:528` has a
`mapId === 'town'` branch with the six building palettes (sheriff, diner,
palmer, hotel, hospital, roadhouse). Registered in `world-catalog.js:19` as
location `town`, environment `town`.

**Artifacts:** `artifacts/town-cohesion-v01` (44 PNG, newest `after-walk-5x.png`
2026-09-09, README), `artifacts/production-vertical-slice-01` (17 PNG, newest
`town-street-native.png` 2026-09-09, plus `town-cohesion-brief.md`,
`validation-final.md`, `milestone-map.md`, `baseline-tests.md`,
`validation-run-1.md`), `artifacts/retro-gauntlet` (96 PNG incl.
`r69-final-arrival-native.png`), `artifacts/visual-audit` (482 PNG, newest
`gauntlet-2026-08-13-r98/gameplay-sheet.png`). Coldstage pixel baseline
`test/coldstage-baselines/visual/baseline.json` holds one capture,
`visual-town-entrance-dialogue.png` (1280×720), verdict `pass-with-notes`.

**Visual bible:** no dedicated section. Covered by the global rules —
"## 0. World state of the current slice" (early dusk), "## 3. Player-to-architecture
scale", "## 9. Exterior ↔ interior continuity" (§9.40: "A building's town-map
footprint and its lot scene are different abstractions of the same place").

**Act 4 entities/staging.** NARRATIVE_ENTITIES: none for `town`.
Classic NPCs (`js/glue.js:14`): `bobby` 31,16 (wander), `donna` 44,10 (wander),
`jacoby` 16,25.
WORLD_TARGETS: `town_crossroads` at 30,30 (`landmark`, shares the tile with the
classic `cartello`/welcome sign) and `lago_maddy` at 15,28 (`landmark`, shares
the tile with the classic `lago_riva` interact). The adapter comment records
this as a **shared target**: the current mission wins latest-first, otherwise
the classic cascade answers.
Classic `lago_riva` cascade (`js/glue.js:110`): `maddy_trovata → lago_dopo`,
`gigante2 → lago_maddy` (sets `maddy_trovata`), `sogno_fatto → lago_sguardo`,
else `lago_laura`.
M8 nodes on town: `m8_focus_choice` (town_crossroads), `m8_route_lake`,
`m8_discovery`, `m8_promise_echo` (all `lago_maddy`).
The three focus destinations named in M8 beat C: palmer (42,6), lago (15,28),
diner (42,20) — the Roadhouse exit is town 47,29.

**Ambient / Character Life hooks.**
- No `AmbientLife.register('town', …)` exists. `town` appears in
  `js/ambient-life-scenes.js:58` only as `fromMapId:'town'`, the arrival side of
  the diner `front-door` reaction.
- `js/town-dusk.js` — authored dusk grade, `town` only.

---

## sheriff (Sheriff's Station interior)

| field | value |
|---|---|
| Map id | `sheriff` |
| Size | 12 rows × 16 cols (`js/maps.js:145`) |
| Interior/exterior | `indoor: true` |
| Doors (authored) | `{}` |
| Doors (installed) | `sheriffs-station-front-entrance`: triggers `7,11`/`8,11` → `sheriffs_station_exterior` spawn 7,7 down |
| Exterior | `sheriffs_station_exterior`, 12 rows × 16 cols (`js/sheriffs-station-exterior-scene.js:13`); town `12,20` → exterior 7,10 up; exterior row 11 (x2..13) → town 12,21 down |
| Spawn | 7,10 up (from exterior) |
| Interact | `{}` |

**Rendering tier: native (the reference implementation).** Files:
`js/sheriffs-station-art.js`, `js/sheriffs-station-exterior-art.js`,
`js/sheriffs-station-scene.js`, `js/sheriffs-station-exterior-scene.js`,
`js/sheriffs-station-location-data.js`, `js/sheriffs-station-production.js` —
six files, `index.html:601-606`. The map comment states the glyphs are collision
only and the art is authored in `js/sheriffs-station-art.js`.

**Artifacts:** `artifacts/sheriffs-station-main-interior-v01` (`final.png`, README),
`artifacts/sheriffs-station-main-interior-v02` (9 PNG, newest
`right-workspace.png`, README, validation logs),
`artifacts/sheriffs-station-main-interior-v021` (12 PNG, newest `comparison.png`
2026-09-08, README), `artifacts/sheriffs-station-exterior-v01` (16 PNG, newest
`native-golden.png` 2026-09-09; also `final.png`, `native-golden-5x.png`,
README, `native-translation-brief.md`), `artifacts/station-population-v01`
(8 PNG, newest `restored-native.png` 2026-09-09, README + `ART-DIRECTION.md`),
`artifacts/retro-gauntlet/r100-sheriff-golden-native.png`.

**Visual bible:** two of the four header references are the station —
"Sheriff's Station Golden Concept: `artifacts/sheriffs-station-main-interior-v01/final.png`"
and "Sheriff's Station Native Golden (parity polish):
`artifacts/sheriffs-station-main-interior-v021/native-after.png`". Cited in
"## 0. World state of the current slice", "## 4. Material grammar",
"## 5. Lighting grammar", "## 9. Exterior ↔ interior continuity",
"## 11. Concept → native parity rule".

**Act 4 entities/staging.** NARRATIVE_ENTITIES: none for `sheriff`.
Classic NPCs (`js/glue.js:24`): `truman` 10,4 with an 8-branch cascade including
`leland_morto → truman_fine`, `atto5 → truman_wait5`, `maddy_trovata → truman_atto5`,
`gigante1 → truman_atto4` (this is the dialogue that sets flag `atto4`,
`js/data.js:710-717`); `andy` 10,7; `hawk` 12,8; `lucy` 2,6; `leland` 8,5
(`cond: ['flag:atto5','!flag:leland_morto']`).
M8 node `m8_station` (beat F) targets actor `truman` here; `node_done: m8_station`
is M8's completion condition.

**Ambient / Character Life hooks.**
- `js/ambient-life-scenes.js:27` — `AmbientLife.register('sheriff', …)`.
- `js/character-life-scenes.js` — authored Character Life profiles registered for `sheriff` only; ids match the `js/glue.js` NPC ids.
- `js/narrative-finale-production.js:257` — `mapId === 'sheriff'` branch (Act 5 finale).

---

## hospital

| field | value |
|---|---|
| Map id | `hospital` |
| Size | 12 rows × 16 cols (`js/maps.js:236`) |
| Interior/exterior | `indoor: true` |
| Doors | `7,11` and `8,11` → `town` 23,7 down |
| Town access | town door `23,6` → `hospital` 7,10 up, `needsFlag: 'sogno_fatto'`, `blockedMsg: 'hospital_locked'` |
| Spawn | 7,10 up |
| Interact | `3,5` → `ronette_letto` |

**Rendering tier: native (Act 2 closure).** `js/hospital-art.js`,
`js/hospital-scene.js`, `js/hospital-production.js` (`index.html:611-613`).
No location-data file; registered in `js/world-catalog.js:51` as location
`hospital`, environment `ward`, `connections: []` (the only catalogued location
with no connections; the town door remains a plain authored map door).

**Artifacts:** `artifacts/hospital-v01` — 33 PNG, newest
`hospital-ingame-ronette.png` (2026-09-09); goldens `hospital-native-golden.png`,
`hospital-native-golden-5x.png`, `native-golden-narrative.png`; notes
`intent.md` and `native-translation-brief.md` (no README).

**Visual bible:** not named in `docs/world-visual-bible-v0.1.md`. Its authored
state is recorded in `artifacts/hospital-v01/intent.md`: "Day, cool practical
fluorescent light … no window drama, no lamp, no warm pool."

**Act 4 entities/staging.** NARRATIVE_ENTITIES (all `hospital`):
- `ronette` 3,5 sprite `ronette` — `when: null` (unconditional)
- `infermiera` 11,8 sprite `infermiera` — `when: null`
- `piantone` 7,3 sprite `andy` — `when: jacques_preso AND NOT jacques_dead`, dialogue null (scenery)
- `piantone_ronette` 3,6 sprite `andy` — `when: jacques_dead`, dialogue null

Classic NPC (`js/glue.js:65`): `gerard` 11,4 — cascade `{cond:'flag:atto4' → 'gerard_a4'}`.
WORLD_TARGETS: `night_register` at 13,8 (`object`, M6 target).
No M8 node targets `hospital`.

**Ambient / Character Life hooks.** None registered for `hospital`.

**Known visual debt (quoted):** `docs/act-2-production-report.md:98` labels it
"(`hospital`, legacy glyph)" and line 158 says "the ward and the lobby remain
legacy glyph rooms" — both predate the native ward built in the Act 2 closure
pass (`js/hospital-*.js` + `artifacts/hospital-v01`). The report is stale on
this point; the shipped ward is native.

---

## woods

| field | value |
|---|---|
| Map id | `woods` |
| Size | 22 rows × 28 cols (`js/maps.js:288`) |
| Interior/exterior | exterior |
| Doors | `14,4` → `redroom` 8,9 up; `14,21` → `town` 50,1 down |
| Entry from town | gate `50,0`, `needsClues: 3` |
| Spawn | 14,20 up |
| Interact | `14,12` `olio` (sparkle), `11,16` `cartelloBosco` |

**Rendering tier: legacy tile-only, with a night grade.** No `js/woods-*.js`.
Handled by glyph branches in `js/retro-authored.js` (`nightWoods` at 5101, 6943)
and by `js/narrative-finale-production.js:102` (`'woods'`, Act 5 finale).
Not in `world-catalog.js`.

**Artifacts:** none dedicated. Frames appear inside `artifacts/visual-audit` and
`artifacts/retro-gauntlet` sheets.

**Visual bible:** not mentioned.

**Act 4 entities/staging.** NARRATIVE_ENTITIES: none. Classic NPCs: `woods: []`
(empty in `js/glue.js:79`). WORLD_TARGETS: none. No M8 node.

**Ambient / Character Life hooks.** None.

---

## Reference: traincar (Act 3, closest native precedent)

Not an Act 4 map. Included because it is the newest native pipeline and the
model the other briefs cite. 12 rows × 24 cols (`js/maps.js:349`). Files:
`js/traincar-art.js`, `js/traincar-scene.js`, `js/traincar-production.js`,
`js/traincar-location-data.js`, `js/traincar-location-production.js`
(`index.html:615-619`). Artifacts: `artifacts/traincar-v01` — 13 PNG, newest
`hawk-states.png` (2026-09-10); goldens `traincar-native-golden.png`,
`traincar-native-golden-5x.png`; notes `README.md`, `intent.md`,
`native-notes.md`, `native-translation-brief.md`. Bible section
"## 12. Outdoor investigative scenes (amendment, footbridge/traincar, 2026-09-10)"
is written from it. `artifacts/traincar-v01/native-notes.md` states the scene is
"hooked exactly like `js/sheriffs-station-exterior-*`".

---

## Summary

| map | rows×cols | tier | Act 4 use per current data | newest golden / capture |
|---|---|---|---|---|
| `diner` | 10×14 | **native** (authored `interior` model in `retro-authored.js` + Double R exterior chain, 4 files) | M8 beats A, B0, C-diner: `m8_diner` (maddy), `m8_leland_taxi` (leland), `m8_route_diner` (norma); classic `loglady_a4` | `artifacts/diner-final-art/final.png` (2026-09-08, bible Golden) |
| `palmer` | 12×16 | **legacy tile-only** (one glyph branch, no art/scene/production file) | M8 beat C: `m8_route_palmer` at `palmer_entrance` 8,10; classic `sarah_visione`, `leland_a4`/`leland_dove`/`leland_dopo`, `maddy_a4` | none |
| `roadhouse` | 10×16 | **legacy tile-only** (no art/scene/production file, interact table empty) | M8 beat B: `m8_roadhouse` at `roadhouse_phone` 8,5; town door gated `needsFlag: atto4`; commit sets classic `gigante2` | none |
| `hotel_gn` | 12×18 | **legacy tile-only**, catalogued as `lobby`, explicitly "not native quality" | none in M8; classic Act 2 NPCs (Ben, Audrey) persist | none (sibling `room_315`: `native-golden.png`, 2026-09-09) |
| `town` | 36×56 | **partial** (authored in `retro-authored.js` + `houses.js` + `town-dusk.js` grade; no per-map art module) | M8 beats C and D: `town_crossroads` 30,30, `lago_maddy` 15,28 (shared with classic `lago_riva`); routes to palmer/lago/diner | `artifacts/production-vertical-slice-01/town-street-native.png` (2026-09-09); coldstage `visual-town-entrance-dialogue.png` |
| `sheriff` | 12×16 (+ exterior 12×16) | **native** (6 files, reference implementation) | M8 beat F: `m8_station` (truman); classic `truman_atto4` sets `atto4`, `truman_atto5` on `maddy_trovata` | `artifacts/sheriffs-station-main-interior-v021/native-after.png` (bible Golden); exterior `native-golden.png` (2026-09-09) |
| `hospital` | 12×16 | **native** (3 files, Act 2 closure) | none in M8; classic `gerard_a4` on `flag:atto4`; 4 narrative entities present | `artifacts/hospital-v01/hospital-native-golden.png` (dir newest 2026-09-09) |
| `woods` | 22×28 | **legacy tile-only** (night grade only) | none | none |
| `traincar` (ref) | 12×24 | **native** (5 files) | Act 3 only | `artifacts/traincar-v01/traincar-native-golden.png` (dir newest 2026-09-10) |

Three of the four maps M8 nodes actually target are non-native: `palmer`,
`roadhouse` and `town`. The two native Act 4 maps are `diner` and `sheriff`;
`hospital` is native but carries no M8 node.

Ambient / Character Life coverage across all maps, by registration site:

| system | file | maps registered |
|---|---|---|
| Ambient Life | `js/ambient-life-scenes.js` | `diner`, `sheriff` |
| Environment Reactions | `js/ambient-life-scenes.js:57`, `js/double-r-location-production.js:10` | `diner` (`front-door`) |
| Character Activity (gestures) | `js/character-activity.js:12` | `diner` |
| Character Life profiles | `js/character-life-scenes.js` | `sheriff` |

`town`, `palmer`, `roadhouse`, `hotel_gn`, `hospital` and `woods` have no
ambient or character-life registration. `town` is covered only by the
`js/town-dusk.js` authored grade.
