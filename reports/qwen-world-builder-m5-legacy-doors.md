# World Builder M5 — legacy doors into the registry

Branch `qwen/night-world-builder-m5-legacy-doors` from `main` @ b284dd2 (after the M4b merge eef0326).
Worktree `.worktrees/m5`. Not pushed.

After M5 every door the game uses is a record in `world/connections.json` (15 records). `js/maps.js` carries
`doors: {}` on all 13 maps and no `gate`. One installer, `js/world-connections-production.js`, writes every
door. The World Builder shows no legacy doors in any scene, so every door can be edited and exported.

## Phase 1 — inventory and truth

`node test/legacy-door-inventory.js` booted the real chain on main (b284dd2) and classified the 27 classic
source entries: 26 `doors{}` entries plus the town `gate`, which glue compiles into a door with
`needsClues: 3`. The brief expected 25 doors.

| map | tile | origin | target | status | evidence |
| --- | --- | --- | --- | --- | --- |
| arrival | 4,8 | doors | town | live one-way | no door town → arrival |
| town | 9,6 | doors | hotel_gn | live paired | hotel_gn 8,11 / 9,11 → town |
| town | 23,6 | doors | hospital | live paired | hospital 7,11 / 8,11 → town |
| town | 42,6 | doors | palmer | live paired | palmer 7,11 / 8,11 → town |
| town | 12,20 | doors | sheriffs_station_exterior | shadowed | town-sheriffs-station-lot |
| town | 42,20 | doors | double_r_exterior_prototype | shadowed | town-double-r-lot |
| town | 47,28 | doors | roadhouse | live paired | roadhouse 7,9 / 8,9 → town |
| town | 55,14 | doors | traincar | shadowed | town-traincar-east |
| town | 55,15 | doors | traincar | shadowed | town-traincar-east |
| town | 50,0 | gate | woods | live paired | woods 14,21 → town |
| palmer | 7,11 | doors | town | live paired | town 42,6 → palmer |
| palmer | 8,11 | doors | town | live paired | town 42,6 → palmer |
| hotel_gn | 8,11 | doors | town | live paired | town 9,6 → hotel_gn |
| hotel_gn | 9,11 | doors | town | live paired | town 9,6 → hotel_gn |
| hospital | 7,11 | doors | town | live paired | town 23,6 → hospital |
| hospital | 8,11 | doors | town | live paired | town 23,6 → hospital |
| diner | 6,9 | doors | town | shadowed | double-r-front-entrance |
| diner | 7,9 | doors | town | shadowed | double-r-front-entrance |
| woods | 14,4 | doors | redroom | live one-way | no door redroom → woods |
| woods | 14,21 | doors | town | live paired | town 50,0 → woods |
| redroom | 8,11 | doors | room_315 | live one-way | no door room_315 → redroom |
| traincar | 0,7 | doors | town | shadowed | town-traincar-east |
| traincar | 21,0 | doors | oej | shadowed | traincar-oej-entrance |
| oej | 7,9 | doors | traincar | shadowed | traincar-oej-entrance |
| oej | 8,9 | doors | traincar | shadowed | traincar-oej-entrance |
| roadhouse | 7,9 | doors | town | live paired | town 47,28 → roadhouse |
| roadhouse | 8,9 | doors | town | live paired | town 47,28 → roadhouse |

Counts: 10 shadowed, 14 live paired, 3 live one-way, 0 conflict. The test pinned these counts in commit
599da51 and flipped them to 0 in the migration commit.

**Conflict decision: there is no traincar↔oej conflict.** The brief placed `traincar-oej-entrance` at
oej 13,6 / 14,6. The registry record actually sits on traincar 21,0 ↔ oej 7,9 / 8,9, the same tiles as the
classic entries (traincar 13,6 is the `mucchio_terra` interact). Both classic sides were therefore already
shadowed. Evidence:

- **Boot state.** The pre-M5 fixture shows traincar 21,0 and oej 7,9 / 8,9 carrying
  `connectionId: traincar-oej-entrance` after boot.
- **Real play.** `node test/act-3-playthrough.js` stands on traincar 21,1 and walks up into 21,0
  (`P.enterDoor(21, 0, 21, 1)`). All three paths log `traincar>traincar[blocked oej_bloccato]` before
  `east_route_confirmed`, then `traincar>oej`.

No crossing was dead-conflict. The 10 shadowed classic entries were deleted.

## Schema delta

- A connection may carry `"one_way": true`.
  - Endpoint `a` then has `triggers` and **no `spawn`**. Nobody arrives there through this record, so no
    value was invented.
  - Endpoint `b` has `triggers: []` and a `spawn`.
  - `install` writes doors only on a's map.
- `validateEndpoint(name, endpoint, maps, { oneWay })` accepts empty triggers only for `b` of a one-way
  record, and requires them to be empty there.
  - A paired record with empty triggers is still rejected (`b.triggers must not be empty`).
  - `one_way` must be `true` when present.
  - A `b` without triggers may not carry `door`.
- `door.needsClues` is a new door field (positive integer). The town woods gate needs it to keep its meaning.
- Trigger tiles of a door with `needsClues` are judged walkable with that many clues held: glue's `X`
  barrier opens at 3. Spawn tiles never assume the gate is open.
- The same rules are applied in:
  - `test/gen-world-data.js`
  - `js/editor/apply/changeset-apply.js`
  - `js/editor/core/validation.js` (`recordCompleteness`)
  - `js/editor/core/edit.js`:
    - `addTrigger` / `moveTrigger` refuse on a one-way `b`;
    - `setSpawn` refuses on a one-way `a`;
    - `reapply` accepts the `one_way` key;
    - `validateDraft` checks the pair under the one-way schema.
- The model and snapshot carry `one_way`. The inspector schema lists it.
- The Builder inspector shows `DIRECTION: ONE-WAY a → b`. It hides MOVE SPAWN on a one-way `a` and ADD
  TRIGGER on a one-way `b`.

## Records added

Spawn and dir values are copied from the classic door on the opposite side. Door fields sit on the endpoint
that owns the trigger.

| id | a (triggers → spawn used by b's door) | b | door fields |
| --- | --- | --- | --- |
| arrival-town (one-way) | arrival 4,8 | town spawn 30,33 up | — |
| redroom-room-315-wake (one-way) | redroom 8,11 | room_315 spawn 2,6 down | — |
| town-great-northern-lobby | town 9,6, spawn 9,7 down | hotel_gn 8,11 / 9,11, spawn 8,10 up | a: needsFlag sogno_fatto, blockedMsg hotel_locked |
| town-hospital | town 23,6, spawn 23,7 down | hospital 7,11 / 8,11, spawn 7,10 up | a: needsFlag sogno_fatto, blockedMsg hospital_locked |
| town-palmer-house | town 42,6, spawn 42,7 down | palmer 7,11 / 8,11, spawn 7,10 up | — |
| town-roadhouse | town 47,28, spawn 47,29 down | roadhouse 7,9 / 8,9, spawn 7,8 up | a: needsFlag atto4, blockedMsg roadhouse_chiuso |
| town-woods-north | town 50,0, spawn 50,1 down | woods 14,21, spawn 14,20 up | a: needsClues 3 |
| woods-redroom-dream (one-way) | woods 14,4 | redroom spawn 8,9 up | — |

Differences from the brief:

- `town-great-northern-lobby` keeps its classic `sogno_fatto` / `hotel_locked` gate, which the brief's list
  omitted.
- `town-traincar-crossing-east` was not added: town 55,14 / 55,15 were shadowed by `town-traincar-east`, so
  the classic entries were deleted instead.
- traincar↔oej needed no record: see the conflict decision above.

**Outdoor spawn rule.** `town-roadhouse` a.spawn 47,29 is row 29, outside the south varco. It was kept as
the classic value, per the brief. `arrival-town` b.spawn 30,33 is on the varco road.

## Catalog delta

`js/world-catalog.js` gains 5 locations:

| location | environment | scene | connections |
| --- | --- | --- | --- |
| palmer-house | interior | palmer | town-palmer-house |
| roadhouse | interior | roadhouse | town-roadhouse |
| ghostwood | woods | woods | town-woods-north, woods-redroom-dream |
| red-room | dream | redroom | woods-redroom-dream, redroom-room-315-wake |
| arrival | arrival | arrival | arrival-town |

Changes to existing locations:

- `hospital` gains `town-hospital`.
- `great-northern` gains `town-great-northern-lobby` and `redroom-room-315-wake`.
- `town` gains the five town-* ids and `arrival-town`.

The brief asked for each registry id in exactly one location. The existing catalog gate
(`test/world-engine-v0.1-catalog.js`: "`${id}` belongs to endpoint location") requires the opposite: each id
sits in **both** endpoint locations, as `town-double-r-lot` already did. I followed the gate. 12 locations,
15 connection ids, bijective with the registry (`world-catalog-coverage`: 15).

## Installer change

- **New: `js/world-connections-production.js`.**
  - It installs every `GAME.WorldData.connections` record once.
  - It validates all records before writing any door.
  - It refuses a tile claimed by two records, a tile that already holds a door descriptor, or a second
    install. There is no first-match-wins.
  - It is loaded after every map/scene script and before `world-engine.js` in `index.html` and
    `world-builder.html`, and in every test chain that used a location installer.
- **Per-location installers.**
  - `double-r-location-production.js`, `sheriffs-station-production.js` and `room-315-production.js` lost
    their `connectionRecordsFor([...])` install. They keep their scene installs, and Double R keeps its
    diner door reaction.
  - `traincar-location-production.js` held nothing else and was deleted.
- **Tests with their own subset installs** now load the single installer: smoke, walkthrough,
  narrative-slice-01, probe-acts12, location-traversal and traincar-location-traversal.
- **Tests that read `js/maps.js` doors** now read the registry: act-3-flow, act-3-mirror-gate,
  hospital-native, level-autopsy and town-map-coherence.

## js/maps.js door counts

| | doors{} entries | gate | maps with `doors: {}` |
| --- | --- | --- | --- |
| before (b284dd2) | 26 | 1 (town) | 2 of 13 |
| after | 0 | 0 | 13 of 13 |

The booted `GAME.Maps` count is 59 descriptors both before and after. The two native exterior scenes only
ever had registry doors. The `doors` field stays
on every map: glue's `TRANSFORMED_KEYS` and genmaps' `--write-diner` anchor read it. `node test/genmaps.js`
output is identical to main.

## Door-equality diff (verbatim, `node test/world-door-equality.js`)

```
DOOR-EQUALITY-DIFF vs test/fixtures/doors-before-m5.json
migrated (classic entry deleted from js/maps.js; same descriptor now installed by the registry): 17
  ~ arrival 4,8 {"to":"town","tx":30,"ty":33,"dir":"up"}  -> arrival-town
  ~ town 9,6 {"to":"hotel_gn","tx":8,"ty":10,"dir":"up","needsFlag":"sogno_fatto","blockedMsg":"hotel_locked"}  -> town-great-northern-lobby
  ~ town 23,6 {"to":"hospital","tx":7,"ty":10,"dir":"up","needsFlag":"sogno_fatto","blockedMsg":"hospital_locked"}  -> town-hospital
  ~ town 42,6 {"to":"palmer","tx":7,"ty":10,"dir":"up"}  -> town-palmer-house
  ~ town 47,28 {"to":"roadhouse","tx":7,"ty":8,"dir":"up","needsFlag":"atto4","blockedMsg":"roadhouse_chiuso"}  -> town-roadhouse
  ~ town 50,0 {"to":"woods","tx":14,"ty":20,"dir":"up","needsClues":3}  -> town-woods-north
  ~ palmer 7,11 {"to":"town","tx":42,"ty":7,"dir":"down"}  -> town-palmer-house
  ~ palmer 8,11 {"to":"town","tx":42,"ty":7,"dir":"down"}  -> town-palmer-house
  ~ hotel_gn 8,11 {"to":"town","tx":9,"ty":7,"dir":"down"}  -> town-great-northern-lobby
  ~ hotel_gn 9,11 {"to":"town","tx":9,"ty":7,"dir":"down"}  -> town-great-northern-lobby
  ~ hospital 7,11 {"to":"town","tx":23,"ty":7,"dir":"down"}  -> town-hospital
  ~ hospital 8,11 {"to":"town","tx":23,"ty":7,"dir":"down"}  -> town-hospital
  ~ woods 14,4 {"to":"redroom","tx":8,"ty":9,"dir":"up"}  -> woods-redroom-dream
  ~ woods 14,21 {"to":"town","tx":50,"ty":1,"dir":"down"}  -> town-woods-north
  ~ redroom 8,11 {"to":"room_315","tx":2,"ty":6,"dir":"down"}  -> redroom-room-315-wake
  ~ roadhouse 7,9 {"to":"town","tx":47,"ty":29,"dir":"down"}  -> town-roadhouse
  ~ roadhouse 8,9 {"to":"town","tx":47,"ty":29,"dir":"down"}  -> town-roadhouse
shadowed (classic entry deleted from js/maps.js; tile was already registry-owned, descriptor unchanged): 10
  - town 12,20 {"to":"sheriffs_station_exterior","tx":7,"ty":10,"dir":"up"}  (dead before M5: town-sheriffs-station-lot)
  - town 42,20 {"to":"double_r_exterior_prototype","tx":6,"ty":10,"dir":"up"}  (dead before M5: town-double-r-lot)
  - town 55,14 {"to":"traincar","tx":1,"ty":7,"dir":"right","needsFlag":"atto3","blockedMsg":"est_bloccato"}  (dead before M5: town-traincar-east)
  - town 55,15 {"to":"traincar","tx":1,"ty":7,"dir":"right","needsFlag":"atto3","blockedMsg":"est_bloccato"}  (dead before M5: town-traincar-east)
  - diner 6,9 {"to":"town","tx":42,"ty":21,"dir":"down"}  (dead before M5: double-r-front-entrance)
  - diner 7,9 {"to":"town","tx":42,"ty":21,"dir":"down"}  (dead before M5: double-r-front-entrance)
  - traincar 0,7 {"to":"town","tx":54,"ty":14,"dir":"left"}  (dead before M5: town-traincar-east)
  - traincar 21,0 {"to":"oej","tx":8,"ty":8,"dir":"up","needsFlag":"east_route_confirmed","blockedMsg":"oej_bloccato"}  (dead before M5: traincar-oej-entrance)
  - oej 7,9 {"to":"traincar","tx":21,"ty":1,"dir":"down"}  (dead before M5: traincar-oej-entrance)
  - oej 8,9 {"to":"traincar","tx":21,"ty":1,"dir":"down"}  (dead before M5: traincar-oej-entrance)
dead conflict crossings deleted: 0
booted descriptors: 59 before, 59 after; byte-identical except +connectionId on 17
WORLD-DOOR-EQUALITY-PASS 59 door descriptors across 15 scenes byte-identical to the pre-M5 fixture (+connectionId on 17), registry alone reproduces 59, 0 classic entries left in js/maps.js
```

## Driver and browser results

**Chrome, real build.**

- `node test/act-3-playthrough.js`: **189/189**.
  - Doors crossed on all 3 paths: town→traincar (`town-traincar-east`), traincar 21,0 blocked by
    `oej_bloccato`, traincar→oej (`traincar-oej-entrance`).
- `node test/act-4-playthrough.js`: **530/530**.
  - Paths A–D: town→roadhouse and roadhouse→town (migrated `town-roadhouse`).
  - Path A also crosses town→palmer→town (migrated `town-palmer-house`).
  - Path C also crosses town→Double R lot→diner and back.
- The only console error in both runs is `favicon.ico` 404, which is already in the committed transcripts on
  main.
- The drivers regenerated their tracked screenshots and transcripts; I restored those files to keep the diff
  to source.

**Not driven in Chrome.** The Chrome drivers do not walk town→hospital, town↔hotel_gn, town↔woods,
woods→redroom, redroom→room_315 or arrival→town. They reach those states by seeding or loadMap.
`node test/migrated-door-traversal.js` covers them with the real engine and arrow-key input (**45 checks**):

- the 4 gate messages without their flag or clues;
- all 14 paired leaves in both directions;
- the 3 one-way crossings;
- no door back from a one-way arrival.

The same 45 checks pass on main before M5 (run in a detached b284dd2 worktree).

**Builder, `node test/world-builder-browser.js`: 54/54** (M4b's 38 checks plus the new M5 cases, with case 4
rewritten). Screenshots are in `artifacts/world-builder-m5/`.

- **Case 4.** The roadhouse doors are `trigger:town-roadhouse:b:0/1` registry items. There are 0 legacy-door
  items, and the inspector names town-roadhouse paired with town.
- **Case 5.** Select `connection-endpoint:town-roadhouse:b`, EDIT, MOVE SPAWN to 6,8, export.
  - The changeset holds only `town-roadhouse`, `endpoints: ["b"]`; a keeps `atto4` / `roadhouse_chiuso`.
  - `tools/world-apply.js --dry-run` prints `VALID 15 record(s)` and `DRY-RUN 1 endpoint change`.
  - Files: `case5-before.png`, `case5-export.png`, `case5-changeset.json`.
- **Case 6.** One-way `arrival-town`.
  - Arrival 4,8 selects `trigger:arrival-town:a:0`, with no endpoint item on a.
  - The inspector reads `ONE-WAY arrival → town`, with no MOVE SPAWN.
  - jump selects `connection-endpoint:arrival-town:b` on town 30,33, which offers no ADD TRIGGER.
  - Files: `case6-arrival-source.png`, `case6-town-arrival.png`.
- **Case 7.** Every scene in the selector (15+) reports `legacy doors 0` in its header
  (`case7-town-header.png`).
- `world/connections.json` hash is unchanged across every case.

## Tests

| suite | result |
| --- | --- |
| smoke | 415 |
| walkthrough | 85 acquisitions |
| act-3-flow | 280/280 |
| act-4-flow | 1611/1611 |
| world-builder | 110/110 (was 108) |
| world-engine-v0.1-catalog | PASS |
| test-world-registry | PASS (15 sorted, 3 one-way) |
| world-catalog-coverage | PASS (15) |
| cast-continuity-validate | V1–V8 PASS |
| cast-presence-sync | 232/232 |
| world-apply | 35 |
| apply-changeset | 14 |
| editor-apply-preflight | 9 |
| editor-runtime-isolation | 6 |
| editor/changeset | 12 (was 9) |
| editor/edit | 51 (was 44) |
| editor/history | 19 |
| editor/hit-test | 14 |
| editor/identity | 51 |
| editor/inspector | 30 |
| editor/interaction | 31 |
| editor/model | 8 |
| editor/world-builder-core | 27 (was 26) |
| location-connections | PASS (+ one-way, needsClues sections) |
| legacy-door-inventory | PASS: sources 0, live 0, shadowed 0, conflict 0, booted 59, unowned 0 |
| world-door-equality | PASS: 59 descriptors, +connectionId on 17, registry alone reproduces 59 |
| migrated-door-traversal | 45 |
| act-3-playthrough (Chrome) | 189/189 |
| act-4-playthrough (Chrome) | 530/530 |
| world-builder-browser (Chrome) | 54/54 |

**Whole-suite sweep.** Every `node test/*.js` (Chrome drivers and generators excluded, 180 s cap) was run on
main b284dd2 and on this branch, and the exit codes compared.

- The first branch sweep found 5 regressions, all fixed: act-3-mirror-gate, apply-changeset, hospital-native,
  level-autopsy and town-map-coherence. They read `js/maps.js` doors or pinned 7 records.
- **Final sweep (after the last commit):** every exit code matches main, and the two new tests
  (legacy-door-inventory, migrated-door-traversal) pass. Failures that pre-exist on main are unchanged, for
  example:
  - sheriffs-station-location, character-life, station-population: cast / hash asserts;
  - act-2-flow;
  - probe-act*-pacing.

## CI steps

`.github/workflows/test.yml`: 26 steps, 24 `node` runs (was 21). Added:

- `node test/legacy-door-inventory.js`
- `node test/location-connections.js` (holds the new one-way and needsClues tests)
- `node test/migrated-door-traversal.js`

The brief asked for "the two new tests". The traversal test is a third proof test, added because the Chrome
drivers do not cross five of the migrated doors. The world-door-equality step already existed and now runs the
all-maps fixture comparison. YAML parsed with Ruby's YAML loader.

## Files

- **Runtime.**
  - `world/connections.json`, `js/world-connections.gen.js`
  - `js/world-connections-production.js` (new)
  - `js/location-connections.js`, `js/maps.js` (door entries + gate only), `js/world-catalog.js`
  - `js/double-r-location-production.js`, `js/sheriffs-station-production.js`, `js/room-315-production.js`
  - `js/traincar-location-production.js` (deleted)
  - `index.html`
- **Editor and Builder.**
  - `js/editor/core/edit.js`, `js/editor/core/validation.js`, `js/editor/core/model.js`,
    `js/editor/apply/changeset-apply.js`
  - `js/world-builder.js`, `js/world-builder-core.js`, `js/world-builder-data.js`, `world-builder.html`
- **Tools.** `tools/world-apply.js`
- **Tests (new).** `test/legacy-door-inventory.js`, `test/migrated-door-traversal.js`,
  `test/fixtures/doors-before-m5.json`
- **Tests (updated).**
  - world-door-equality, gen-world-data, location-connections, test-world-registry,
    world-engine-v0.1-catalog, world-builder, world-builder-browser, apply-changeset
  - smoke, walkthrough, act-3-flow, act-3-mirror-gate, hospital-native, level-autopsy, town-map-coherence
  - location-traversal, traincar-location-traversal, room-315-location, environment-entry,
    sheriffs-station-door, sheriffs-station-location, step6-driver, character-life, station-population
  - narrative-slice-01, probe-act2/3/4/acts12-pacing
  - editor/changeset, editor/edit, editor/world-builder-core
  - HTML: character-life, sheriffs-station, station-population, retro-scene
- **Artifacts.** `artifacts/world-builder-m5/` (17 files)
- **CI and reports.** `.github/workflows/test.yml`, `reports/qwen-world-builder-m5-legacy-doors.md`

## Commits

- 599da51 test(world): legacy door inventory + pre-M5 doors fixture
- 1007b56 feat(world): one-way connections and needsClues door field
- f927658 feat(world): migrate every classic door into the connection registry
- 8700a4d test(world): M5 proof — migrated door traversal, Builder browser cases, CI
- docs(reports): this report

## Known limitations

1. **Legacy test harness pages have no doors.** m4/m5/m6/m8 `*-harness.html`, `shot.html`,
   `double-r-location.html` and `double-r-exterior-prototype.html` load `maps.js` + glue without the registry
   or the native scene scripts, so they now have no doors.
   - Those that walk doors are `m6-physical-harness` (used by `probe-act3-pacing`, already failing on main)
     and the m4/m5/m8 physical/engine harnesses, whose playthrough driver reads index.html instead.
   - Moving them onto the production chain was out of scope.
2. **Finale override drops the connectionId.** `js/narrative-finale-production.js` (not owned) still rewrites
   `GAME.Maps.redroom.doors['8,11']` at runtime, and its restore writes a copy without `connectionId`.
   - Movement is unchanged (the engine ignores `connectionId`).
   - The inventory and equality guards check the booted state, not the post-finale state.
3. **No paired ↔ one-way toggle.** The Builder cannot switch a record between paired and one-way, or create or
   delete a record. Those need hand edits to `world/connections.json` and the catalog.
4. **Outdoor spawn rule.** `town-roadhouse` a.spawn 47,29 (row 29) keeps the classic value, which breaks the
   outdoor spawn rule in CLAUDE.md. Not fixed, per the brief.
5. **Merge note.** `index.html` on the main checkout has uncommitted edits from another session. This branch
   changes one script line there (the traincar installer becomes `world-connections-production.js`), so merge
   by hand if that session commits first.

## Recommended M6

Create and delete connections in the Builder. Now that every door is a registry record, the remaining
hand-edited authoring is adding a new door: a record plus membership in both endpoint locations in
`js/world-catalog.js`. M6 would extend the changeset with a validated `create` op (both endpoints picked on the
canvas, paired or one-way) and have `tools/world-apply.js` update the catalog in the same atomic write.
