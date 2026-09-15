# Debt: pacing probes and adapter WORLD_TARGETS

Branch `opus/debt-probes-adapter` from `main` at `b7f704e`. Not pushed. Items 4 and 5 of the open list in `reports/test-debt-triage.md`, plus the WORLD_TARGETS question.

**Result.** Both probes are green. No file under `js/` changed. In the Act 2 artifact every number is byte-identical; one prose note changed. In the Act 4 artifact two things changed, both from changes to the world: Leland's taxi node gained a page, and the Roadhouse walk got longer because Truman and the evening gathering are now real bodies that block tiles. **WORLD_TARGETS cannot be derived** from the three registries. 9 of its 14 entries have no source record, and the other 5 match only by coordinate. So the adapter is untouched, there is no new test, and the gap list is below.

## Deliverable 1: probe-act2-pacing

**Before.** `test/probe-act2-pacing.js:178` threw `Error: npc "truman" non trovato su sheriff`.
**After.** Exits 0 and writes `artifacts/act-2-nvs02/pacing.md`.

**What changed.**
- The probe loads `narrative-data.gen.js`, `cast-presence.js` and `narrative-bootstrap.js`, installs the catalogs, and defines `syncCast(state)`, which calls `GAME.CastPresence.syncMaps(GAME.Maps, state, null)`. It does not use the adapter or `A._debugNarrativeEntities`.
- On the required path, the probe syncs against the live `m4State` before each approach (sheriff ×2, hospital, diner) and snapshots that state there.
- Each optional beat syncs against the snapshot from the required point it starts at: hotel_gn entry for Ben Horne and Audrey, the first sheriff visit for Hawk, the hospital for Gerard, the diner for Norma. Every snapshot is taken before `atto3`. `infermiera_ctx` runs on a copy of the state just before `present_truman_m4`, not on the post-`atto3` state.
- **Why this measures the same thing as before.** The old probe resolved glue bodies with `cond` against the classic `E.state`, and that state never had `atto3`. So its optional beats were always measured in a pre-`atto3` world. The new probe keeps that meaning explicitly. It no longer depends on the optional section happening to run after `atto3`, where `ACT3_HAWK_BRIDGE` moves Hawk to the traincar.

**Artifact diff.** All numbers are identical: every tile, page, character and second in every table. One line in "Altre note" changed:

```
-  ... connessione "great-northern-room-315-hall" (js/room-315-location-data.js, applicata da js/room-315-production.js) ...
+  ... connessione "great-northern-room-315-hall" (js/world-connections.gen.js, applicata da js/room-315-production.js) ...
```

This is a world change. The probe's string was updated in 8db5e5e (the connection registry replaced `room-315-location-data.js`), but the artifact was never regenerated after that. The committed artifact dates from b5de5d2.

## Deliverable 2: probe-act4-pacing

**Before.** `test/probe-act4-pacing.js:143` threw `Error: npc "truman" non trovato su sheriff`. After a sync, it failed at `:148` with `NARRATIVE_ENTITIES: "maddy" non registrato su diner`.
**After.** Exits 0 and writes `artifacts/act-4-design/pacing-current.md`.

**What changed.**
- `ENTITIES = A._debugNarrativeEntities` is removed. `approachNpcTile(map, id, preferred, s)` now syncs Cast Presence against the run's M8 state `s`, then reads the body from `GAME.Maps[map].npcs`. `approachEntityTile(map, id, s)` is the same lookup with no preferred tile, which matches the old entity path. All 6 call sites pass `s`. Beat labels `(NARRATIVE_ENTITIES)` and `(NPC classico)` now read `(Cast Presence)`.
- **Cast state.** Bodies are resolved on `test/fixtures/cast-pins-acts-1-4.json` `seeds.ACT4_AFTERNOON`, with the live M8 state layered on top. Resolving on the bare probe seed (`atto4` and two evidences, no `sogno_fatto`) throws at the Roadhouse: `CastPresence OVERLAP: {"characterId":"james","windows":["ACT4_EVENING_GATHERING","JAMES_NOT_YET"], ...}`. `test/m8-engine-harness.html::seedBase()` already moved to this history for the same reason.
- The M8 run itself keeps the probe's original seed, so page and character counts cannot move because of the probe. I also checked that seeding the M8 run with the full history produces a byte-identical artifact, so the choice does not affect any number.

**Baseline check.** I extracted `b5de5d2` (the commit that wrote the old artifact) to a scratch directory and ran the old probe there. It reproduces the committed `pacing-current.md` byte for byte. I then dumped the canonical beat log from both the old and new probes and diffed them. Only three beats differ:

| beat | old | new | cause |
|---|---|---|---|
| `m8_leland_taxi` | 5 pages, 435 chars | 6 pages, 595 chars | **World change.** b75ed10 (Cast Presence v0.1, "B1 page") added `m8.b0.leland_taxi.chiusura.p01` (160 chars, mode `action`): "Norma gira il cartello sulla porta e spegne l'insegna…" |
| roadhouse 7,8 → Truman approach 3,8 | 4 tiles | 32 tiles | **World change.** In the old probe, Truman at 4,8 was a row in the entity table, not a body on the map, so the BFS walked straight through his tile. Now `ACT4_EVENING_GATHERING` (M8) places Truman at 4,8 and the gathering at james 2,4, bobby 3,4, donna 5,4, loglady 2,6, shelly 3,6, norma 5,6, and all of them block tiles. The only open route is east to 13,8, up to row 2, west to column 1 and back down (6+6+12+6+2 = 32). |
| Truman 3,8 → phone 8,5 | 10 tiles | 28 tiles | **Same cause.** The old route went up column 2 through row 6. Now 2,6 and 3,6 are occupied, so the route goes via column 1, row 2 and column 13 (2+6+12+3+5 = 28). |

The approach tiles are the same as before (diner 10,2 and 11,2; roadhouse 3,8 and 8,5). Only the walked distance changed.

**How the rest of the diff follows** (every other changed number comes from the three rows above):
- Canonical walk 562 → 608 tiles (+28 +18). Pages 50 → 51, chars 3757 → 3917 (+1 page, +160 chars). Totals 463.0 → 486.7 s @12cps and 400.4 → 421.4 s @15cps.
- The 27-variant range and every row of the warning × destination table: +46 tiles, +1 page and +160 chars on every variant, since the Roadhouse and the Leland beat are on every path. The per-promise ranges shift by the same amount.
- "Obbligato + opzionale" 509.5 → 533.3 s: the same +23.8 s.
- Longest uninterrupted walk 142 → 170 tiles (+28, toward Truman's table).
- Page modes: action 15 → 16 (the new Leland page is `action`).
- Map-change note "su 562" → "su 608". Its 12 segments and 332 tiles are unchanged.
- Unchanged: time before the first choice, the longest passive block, nodes traversed, the non-required content.

## Deliverable 3: WORLD_TARGETS from registry

**Premise correction.** `WORLD_TARGETS` (`js/narrative-engine-adapter.js:69`) has no npc→map rows. All 14 entries are object, landmark or sign targets that `tryInteractAt` resolves by tile. The actors already moved to Cast Presence in b529711.

For each entry, I searched `world/connections.json` (triggers and spawns), `narrative/cast/windows.json` (every `map_id`/`x`/`y` in the baselines and windows) and `world/scene-objects.json` (`objects` bounding boxes and `interact` keys) for a record on the same map and tile:

| map | target_id (kind) | x,y | registry source |
|---|---|---|---|
| traincar | bridge_rail (landmark) | 4,6 | coordinate only: `scene-objects traincar.interact["4,6"] = "sign_ponte"`. That is a different id (a classic dialogue key) with no kind field |
| traincar | sign_oej (sign) | 20,2 | coordinate only: `scene-objects traincar.interact["20,2"] = "sign_oej"`. The id happens to match, but there is no kind field |
| traincar | mound (object) | 13,6 | coordinate only: `scene-objects traincar.interact["13,6"] = "mucchio_terra"`. Different id, no kind |
| traincar | ring (object) | 13,5 | coordinate only: `scene-objects traincar.interact["13,5"] = "anello_interact"`. Different id, no kind |
| traincar | scene_center (landmark) | 12,5 | no registry source: no record on this tile in any of the three files |
| traincar | traincar_entrance (landmark) | 13,7 | no registry source: no record on this tile |
| traincar | stove (object) | 12,3 | no registry source: no record on this tile |
| traincar | cards (object) | 10,6 | no registry source: no record on this tile |
| traincar | tracks_north (landmark) | 21,2 | no registry source: no record on this tile |
| hospital | night_register (object) | 13,8 | no registry source: no record on this tile |
| roadhouse | roadhouse_phone (object) | 8,5 | no registry source: `scene-objects.roadhouse` is empty |
| town | town_crossroads (landmark) | 47,30 | no registry source: moved on purpose to 47,30 (pass 01 B4/O8) and not written to any registry |
| town | lago_maddy (landmark) | 15,28 | coordinate only: `scene-objects town.interact["15,28"] = "lago_riva"`. The adapter comment calls it a shared target. Different id, no kind |
| palmer | palmer_entrance (landmark) | 8,10 | no registry source: not a door trigger or spawn in `connections.json`, and no record in `scene-objects.palmer` |

**Verdict: not derivable. 0 of 14 entries are fully sourced.** 9 have no record at all. The other 5 share only a tile with a classic `interact` key. `target_id` (the identity mission nodes match on, `n.target_id === tid`) and `target_kind` (`n.target_kind === tkind`) exist in no registry, so even a coordinate join cannot rebuild the table. Deriving it would take a new registry field (for example `narrative_targets: {id: {x, y, kind}}` per scene in `world/scene-objects.json`) plus data entry for all 14 entries. That is authoring work, not a migration. The code is untouched, there is no `test/adapter-world-targets.js`, and `A._debugWorldTargets` is unchanged.

## Gates

Output below is verbatim (the final lines of each run).

```
$ node test/smoke.js
415 controlli superati ✔
$ node test/walkthrough.js
OK: cammino completo simulato, 85 acquisizioni, finale raggiunto ✔
$ node test/narrative-lint.js
WARN  [read-before-write] KNOWN-OPEN: proposition_path "P7.formulation.status" is read but never written by any mission effect, and has no declared external writer [owner: M9 pass: formulate P7 or cut the dead presentation branch; found 2026-09-10, narrative-lint v0.1 first run; M9's m9_present_truman node (narrative/missions/M9.json:517) has a presentation.on.P7 branch, but no mission node anywhere formulates P7 (no {proposition: "P7", to: "formulated"} effect exists); the branch is currently dead code.]
narrative-lint: PASS (7 checks, 1 warnings)
$ node test/story-truth-lint.js
story-lint: PASS (1043 checks, 0 warnings)
story-truth-lint: PASS
$ node test/probe-act2-pacing.js   # exit 0
Report scritto in /Users/ebuccelli/Code/solo/projects/twin-peaks-game/artifacts/act-2-nvs02/pacing.md
$ node test/probe-act4-pacing.js   # exit 0
Report scritto in /Users/ebuccelli/Code/solo/projects/twin-peaks-game/artifacts/act-4-design/pacing-current.md (68 righe)
$ node test/act-3-playthrough.js && node test/act-4-playthrough.js
act-3-playthrough: 189/189 assertions passed
console errors: 1
act-4-playthrough: 530/530 assertions passed
console errors: 1
  Failed to load resource: the server responded with a status of 404 (File not found)  <http://127.0.0.1:24072/favicon.ico>
```

Counts compared with the after table in `reports/test-debt-triage.md`: smoke 415 (same), walkthrough 85 acquisitions (same), act-4-playthrough 530/530 (same). act-3-playthrough is not in that table; it ran 189/189. The favicon 404 is the known harness noise.

Side effects: the C5B/C6B/C8B validation logs were not rewritten. The Chrome runs rewrote tracked PNGs, transcripts and presence traces under `artifacts/act-3-closure/`, `artifacts/act-4-implementation/` and `artifacts/cast-presence-v0.1/`. All three were clean before the gates, and I restored them with `git checkout --`. `js/retro-authored.js` (dirty from the other session) was not staged or touched.

## Commits

- `1c21634` test: probe-act2-pacing places bodies from Cast Presence (probe + `artifacts/act-2-nvs02/pacing.md`)
- `55dd1ac` test: probe-act4-pacing migrates approaches to Cast Presence (probe + `artifacts/act-4-design/pacing-current.md`)
- Deliverable 3: no commit (verdict: not derivable, code left alone)
- This report: the next commit
