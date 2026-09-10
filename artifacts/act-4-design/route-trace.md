# Act 4 — route trace of the proposed beat map (facts + defect rows)

Read-only. No story wording proposed; open choices are option lists with evidence.

## Route algebra

| axis | values | branch source |
|---|---|---|
| `P` promise | accompagno / autonomia / prudenza | `m8_diner.choices` |
| `W` warning | palmer / centrale / nessuno | `m8_roadhouse.choices` |
| `F` focus | palmer / lago / diner | `m8_focus_choice.choices` |
| `L` Lucy | seen / not | proposed `m8_lucy_evening` |
| `S` Sarah | before diner / between diner and Roadhouse / never | classic `sarah_visione` |
| `G` Log Lady | seen / not | classic `loglady_a4` |

27 mandatory × 12 optional = **324 route classes**. No axis constrains another: `P`/`W`/`F` are write-once values read only
downstream; `L`/`S`/`G` write nothing but `sarah_visione_ascoltata` (`js/data.js:742`). `S=before diner` is reachable — the Sarah
cascade opens on `flag:atto4` (`js/glue.js:46`) and the Palmer door `42,6` has no `needsFlag` (`js/maps.js:119`). Defects below are
predicates over these axes.

## O-list

### O1 · 4.8 · crossroads label "casa Palmer — la casa continua a tornare" · premise: the house has returned

Pages that put the house in front of the player before `m8_focus_choice`:

- **Act 1 house visit is mandatory.** `laura_room` is the only source of `cuore` and `lettera_r`; the woods barrier needs 3 clues
  (`js/glue.js:183`, `WOODS_MIN_CLUES` `test/walkthrough.js:79`) and the only three obtainable before it are `diario`, `cuore`,
  `lettera_r` — two of them inside casa Palmer.
- **Act 1 classic `sarah` is NOT mandatory.** No `PREREQ` entry names it (`test/walkthrough.js:53-76`); it gives no clue, sets no
  flag, and the NPC carries no `cond` (`js/glue.js:45-47`).
- **M4 `truman_a2`** (`js/data.js:615-622`): four pages, no house reference.
- **`m8_leland_taxi` p01** — "passa da casa alle sette". Mandatory on every route (`obj_m8_25`). The only Act 4 page naming the
  house that all 324 routes render.
- **`m8_roadhouse` feedback** names the house on `W=palmer` and on `W=centrale`; silent on `W=nessuno`.

**Defect** — on `W=nessuno ∧ S=never` (36 routes) the premise rests on Act 1 plus one Leland line; on `W∈{palmer,centrale} ∧
S=never` (72 routes) on Act 1 plus Leland plus one feedback page. **Fixes** — *condition on value*: a page `condition` keyed on
`warning_target` or `sarah_visione_ascoltata` (`conditional_pages` exists, frozen at prepare, `js/narrative-runtime.js:305`); *make
mandatory*: promote `sarah_visione` into M8; *degrade gracefully*: relabel to an Act 1 premise. **Risk** — none for the page
condition; high for promoting `sarah_visione`, a classic dialogue with `setFlag` that M9 reads through the bridge at
`js/narrative-production.js:150`.

### O2 · 4.9a · valise `when: warning_target=palmer ∧ gigante2` · premise: `gigante2` is readable narratively

**The conjunction is expressible.** `evalWhen` delegates to `NR.evalCond` (`js/narrative-engine-adapter.js:244-249`); `COND_KEYS`
are `not, all, flag, evidence, proposition_path, contains, equals, node_done, value_set, value_is, groups_completed`
(`js/narrative-runtime.js:79`), with `value_is` shaped `{name, equals}` (`:84`). **There is no `any`/OR operator** — an OR must be
written `not{all[not…]}`.

**But `gigante2` never becomes true in the narrative state.** It flows one way only: `js/narrative-production.js:163` sets
`classicFlags.gigante2` from `state.nodes_done.m8_roadhouse`. The reverse bridge `syncClassicToNarrative` (`:145`) whitelists
`sogno_fatto, atto3, atto4, atto5, gigante1, maddy_trovata, leland_morto, sarah_visione_ascoltata, audrey_indaga` — `gigante2` is
absent.

**Defect** — `{flag:'gigante2'}` inside any entity `when` is false forever; the valise never appears. All 324 routes. **Fixes** —
write it as `{node_done:'m8_roadhouse_truman'}`, or add `gigante2` to the whitelist. **Risk** — `node_done` is zero-risk (precedent
`hawk_bridge`, adapter `:203`); widening the whitelist creates a second writer for a flag `syncNarrativeToClassic` also writes, with
no ordering guarantee.

### O3 · 4.9a · valise sprite · premise: a placed object can carry a non-character sprite

The catalogue has exactly 25 ids (`js/chars.js:48-72`, mirrored by `CAST_SHEET_ORDER` `js/retro-authored.js:29-34`): cooper, truman,
lucy, andy, hawk, sarah, leland, norma, shelly, loglady, bobby, donna, jacoby, audrey, mfap, laura, gerard, benhorne, giant, maddy,
bob, james, jacques, ronette, infermiera. **No `valigia`/`suitcase`/prop sprite.** An unknown id does not fail loudly:
`js/engine.js:1015` and `:1113` both do `CHARS[e.sprite] || CHARS.cooper`, and `js/chars.js:149` repeats it.

**Defect** — the valise renders as a second Cooper in the Palmer hall. All `W=palmer` routes. **Fixes** — *move payoff*: a
`WORLD_TARGETS` landmark plus a map `interact` entry, no body; *degrade gracefully*: keep the caption-only p02. **Risk** — the
landmark route is precedented (`palmer_entrance`, adapter `:107`); an authored prop sprite means a new atlas slot, `PIXEL16` entry
and cast matrices.

### O4 · 4.6 / 4.9a · entity with `dialogue: null` and no owning node · premise: interact produces something

`interact()` (`js/engine.js:728-752`): `npcAt` → `audioSfx('interact')` → the body turns to face Cooper → finale `tryInteract` →
`NarrativeAdapter.tryInteract` → else `startDialogue(resolveDialogue(npc.dialogue))`. With `dialogue: null`, `resolveDialogue`
returns null (`:583`) and `startDialogue` returns immediately (`:599`). `A.tryInteract` returns **false** when no entered mission
has a world node with that `actor_id` on that map (adapter `:527`).

Net: sound plays, the body turns, nothing else. Intentional precedent: `piantone` / `piantone_ronette`, adapter `:161-172` ("il
piantone della contea è SCENOGRAFIA, non un attore").

**Defect** — the Giant on the stage (all 324) and the valise (`W=palmer`) are mute props unless given a node. **Fixes** — *fail
forward*: a one-line actor node, as M5 did for Hawk (adapter `:197-200`, "mai un NPC muto"); or accept scenery. **Risk** — none; the
node only needs `npc.id === node.actor_id`.

### O5 · 4.6 · Giant on tile 8,1 · premise: a solid tile can be occupied and faced

Roadhouse rows `js/maps.js:412-421`. Row 1 is `iCCCCCCCCCCCCCCi` → **8,1 is `C`, solid** (`M.SOLID.C`, `js/maps.js:28`). Row 2 is
all `f`.

**Solidity does not block interaction.** `interact()` calls `npcAt(fx,fy)` *before* any solidity test (`js/engine.js:733`); the
`isSolid` branch at `:737` is only the talk-across-the-counter fallback for an empty faced tile. An entity at 8,1 faced from 8,2
(dir `up`) resolves normally, and cannot be walked into or displaced (`js/engine.js:676`, `:798`). Precedent for an NPC parked on a
solid tile: **none** — every registry entity currently sits on a walkable tile. Precedent for a *landmark* on a solid tile:
`lago_maddy` at town `15,28`, which is `F` (fence) — adapter `:110`, `js/maps.js` row 28.

Alternatives: the whole stage front `x∈[1,14], y=1` is `C` and faceable from row 2. Approach geometry: spawn 7,8/8,8; column 8 is
blocked at rows 7 and 3 (both `t`), so the walk runs up the `ff` margins at `x∈{1,2}` or `x∈{13,14}`. The phone at 8,5 is `f` and
faceable only from 8,4 or 8,6 (7,5 is `C`, 9,5 is `h`). Sprite `giant` exists in every renderer (`js/chars.js:66/101/136`,
`js/retro-authored.js:33`, `js/portraits.js:51`, `js/render3d.js:6481`/`:11450` already special-case `npc.sprite === 'giant'`) but
**no data places it as an NPC today** — it exists only as `speaker_id: 'gigante'` on `m8.b.roadhouse.p04`. **Risk** — low.

### O6 · 4.4 · Sarah cond `'!flag:gigante2'` · premise: the syntax works and fires on time

**Syntax supported.** `E.npcActive` treats an array as AND and delegates to `checkCond` (`js/engine.js:337-345`); `'!flag:x'` at
`:578`. Same-flag precedent on the same map: `js/glue.js:49` (Leland) and `:57` (Maddy).

**Timing.** (1) `gigante2` is written only inside `syncNarrativeToClassic` (`js/narrative-production.js:163`), which runs on the 180
ms poll and only while `E.state.mode === 'play'` — **not** the same tick as the commit, whereas the entity registry *is* same-tick
(commits are wrapped, adapter `:314-330`). (2) Today `nodes_done.m8_roadhouse` is set after pages p01–p07 and **before** the warning
choice (adapter `:930-940`: pages → `commitNode` → `runChoiceWidget`), so `gigante2` already flips before `warning_target` exists.

**Defect** — renaming `m8_roadhouse` silently stops `gigante2` from ever being set: Sarah, Maddy and Leland stay visible at Palmer
for the rest of the game, `lago_riva` never reaches `lago_maddy` (`js/glue.js:112`), and the objective line at `js/data.js:910`
never fires. All 324 routes. **Fix** — *make mandatory*: repoint `js/narrative-production.js:163` at whichever node owns the presage
after the split, and decide deliberately whether `gigante2` flips at the table or at the phone. **Risk** — high if missed. Other
consumers of the id: `test/smoke.js:406-408`, `test/probe-act4-pacing.js`, `test/narrative-validate-m8.js`,
`test/narrative-validate.js`, the three `test/m8-*-harness.html`, and `m8-extraction.md:743`. `M8.completion` and M9's
`entry_condition` both read `node_done: m8_station` — unaffected.

### O7 · 4.8 · town night state · premise: a second grade can be keyed on a flag

`js/town-dusk.js` installs itself unconditionally at load (`install()` called at `:527`; `index.html:591` loads it before
`narrative-production.js` at `:634`). The hook carries **no state** — the wrapper signature is `limitBackgroundPalettes(ctx, cx, cy,
w, h, mapId)` and the body branches on `mapId === MAP` only (`js/town-dusk.js:492`). A flag-keyed second state would have to reach
into `GAME.Engine.state.flags` from inside the render hook. The grade is memoised on packed RGB alone (`var memo = ..., memoRoad =
...`, `:173-176`), no state in the key: a second grade sharing those tables returns dusk colours for night pixels. No precedent for
a state-conditional grade anywhere.

**Wanderers** `bobby` and `donna` (`js/glue.js:16-21`) have **no `cond`** today, only `wander: true`; `jacoby` likewise. Hiding them
needs a classic `cond` in `js/glue.js` — the registry cannot do it: `syncNarrativeEntities` refuses ids it did not register (adapter
`:294`).

**Defect A** — a flag-keyed grade sharing the dusk memo returns stale colours. All 324. **Defect B** — registering `bobby`/`donna`
as town entities instead of adding a classic `cond` **replaces** the classic definition: `classicIdsFor` excludes any id present in
`NARRATIVE_ENTITIES` for that map (adapter `:255-259`), so after one hide/show cycle the registry pushes its own stripped copy
(`:299`) and the dialogue cascade plus `wander` are gone. All 324. **Fixes** — separate memo tables per state, or one grade with
practicals toggled; for the wanderers, `cond: '!flag:gigante2'` as `js/glue.js:57` does for Maddy. **Risk** — low for the `cond`;
medium for a second grade (`wrapForeground`, `js/town-dusk.js:466`, wraps the tree pass too).

### O8 · 4.8 · moving `town_crossroads` · premise: the new tile fires

Town geometry `js/maps.js:57-90`. The Roadhouse door is `47,28` = `D`; the return spawn is `47,29` dir `down`
(`js/maps.js:424-425`). Walkability: **47,29 = `p`**, **47,30 = `p`**, **47,31 = `p`**; the block `x∈[41,48], y∈[29,31]` is a
walkable forecourt. `46,28` and `48,28` are `6` (solid).

**Defect** — a landmark on the spawn tile 47,29 can never fire: `tryInteractAt` is reached only from `interact()`
(`js/engine.js:760`), which resolves the tile the player is *facing*, and nothing auto-interacts on entry (`town.onEnter` is a
dialogue only, `js/maps.js:136`). All 324 routes. **Working candidate: 47,30** — the player spawns at 47,29 facing `down`, so it
fires on one keypress with no movement. Others: `46,30`/`48,30` (one sidestep), `47,31` (two steps).

Second-order, both directions: `town_crossroads` sits today on **30,30**, which is also the classic `cartello` → `sign_town`
interact and the `welcomesign` object (`js/maps.js:137`, `js/glue.js:97`). `tryInteractAt` runs before `objectAt`
(`js/engine.js:760` vs `:766`) and consumes the tile whenever M8 owns a node on that `target_id`, including after M8 completes via
`completed_mission_repeat` (adapter `:585-590`) — so the town sign is shadowed from `atto4` onward. Moving the target **restores
`sign_town` at 30,30** and **permanently narrative-owns empty pavement at 47,30**. Behaviour changes, not bugs.

### O9 · 4.6/4.7 · node split · premise: no shadow on `truman@roadhouse`; objectives still describe the world

**No shadow.** World nodes by mission: M4 `truman@sheriff` ×2, M5 `truman@traincar`, M6 `truman@sheriff` ×3, M8 `truman@sheriff`
(`m8_station`), M9 `truman@sheriff`. **No mission has any node on map `roadhouse` other than `m8_roadhouse`.** `glue.js` `NPCS` has
**no `roadhouse` key** (`js/glue.js:13-92`) → `NPCS[id] || []` gives the map zero NPCs, so a registry entity is the only way to put
Truman on that stage.

**Duplicate body.** The classic Truman at `sheriff 10,4` has no `cond` (`js/glue.js:24`), so two Trumans exist during the Roadhouse
window. Precedent: `truman@traincar` (adapter `:187-191`) already does this; its comment claims no cross-map duplicate, but the
sheriff Truman is never hidden.

**Objective window gap** (priorities from `m8-extraction.md:29-35`): `obj_m8_1` (100) `promise_stance ∧ T_LELAND_TAXI ∧ ¬value_set
presagio_status`; `obj_m8_2` (200) `T_LELAND_TAXI ∧ presagio_status=active ∧ ¬maddy_trovata`. If the split moves
`presagio_status=active` onto `m8_roadhouse_truman`, then the instant the table scene commits `obj_m8_1` goes inactive and
`obj_m8_2` ("Torna all'incrocio") goes active — while the player still has to walk to the phone, and the crossroads needs `value_set
warning_target` (unset), so it answers with `showNoRootsFeedback`. All 324 routes. **Fixes** — add
`{not:{value_set:'warning_target'}}` to `obj_m8_2`; add an objective at ~150 gated on `presagio_status=active ∧ ¬warning_target`;
re-gate `obj_m8_1` on `{not:{node_done:'m8_roadhouse_truman'}}`. **Risk** — low (`when` is plain `evalCond`), but an empty
`objectiveFor` is a hard failure in `test/walkthrough.js:97-101`.

**Do not chain the two nodes with `next`**: `genericNodeSession` follows `node.next` inside the same lease (adapter `:946-953`), so
the phone beat would play without the player ever walking to 8,5.

### O10 · 4.1 · Leland present from the start · premise: an early interaction is not a meta refusal

Today's `when` is `atto4 ∧ value_set promise_stance ∧ ¬evidence T_LELAND_TAXI` (adapter `:232-236`). With `when: atto4 ∧
¬T_LELAND_TAXI`, interacting before the promise takes this path: M8 *does* have a node with `actor_id:'leland'` on `diner` → `owner
= M8` → `worldRoots` returns 0 (the node's only condition is `{value_set:'promise_stance'}`) → `pendingMilestoneNode` null (**M8
declares no `milestones`** — verified `null`) → `checkCompletion` false → `interaction_no_roots` →
`showNoRootsFeedback({actor:'leland'})`. That renders one page id `adapter.no_roots.actor`, `mode: 'dialogue'`, `speaker_id:
'cooper'`, `display_name: 'COOPER'`, text `"Non c'è altro da chiedere qui, per ora."` (adapter `:471-489`).

**Defect** — Cooper says "nothing more to ask" to a man he has never spoken to. All 324 routes, on any playthrough that approaches
Leland before promising. **Fixes** — *fail forward*: the optional `m8_leland_waiting` node removes the refusal by giving the actor a
live root in that window; *condition on value*: keep today's `when`. **Risk** — none, but `m8_leland_waiting.conditions` must
include `{not:{value_set:'promise_stance'}}` so the two Leland nodes never both have roots: two live roots on one actor is
fail-closed (`ambiguous_world_roots`, adapter `:546`).

### O11 · 4.0b · Lucy · premise: M8 wins Lucy, and today's Lucy is not already silent

**Order.** `missionsList` is `['M4','M5','M6','M8','M9']` (`js/narrative-production.js`); `enteredMissions()` preserves it (adapter
`:114-120`); `tryInteract` iterates **from the end** and takes the first mission with live roots (`:521-530`). In Act 4 M9 is not
entered (its `entry_condition` needs `node_done: m8_station`), so **M8 is the latest entered and wins Lucy**; once M9 enters,
`m9_verifica_taxi` takes her — as expected.

**Today Lucy is already dead in Act 4.** M6 owns `lucy@sheriff` via `m6_news`, conditions `node_done: m6_return_night ∧ ¬flag:
jacques_dead`. In Act 4 `jacques_dead` is true → 0 roots → `checkCompletion(M6)` is **true** (`m6_atto4_bridge` done) →
`completedTargetNode` finds no *done* lucy node → the branch logs `completed_mission_repeat` and **returns true with no session**
(adapter `:584-590`). Talking to Lucy consumes the keypress and renders nothing — not the no-roots line, never the classic
`lucy_a3`.

**Defect** — silent void, all 324; `m8_lucy_evening` fixes it only inside its window (`¬promise_stance`), after which the void
returns. **Fixes** — widen the node's conditions to the whole act, or add a `repeat` page. **Objective interplay** — none; Lucy
carries no objective.

### O12 · 4.7 · save/reload mid-Roadhouse · premise: the world reassembles

With `presagio_status=active ∧ ¬warning_target`: `A.setState` runs `syncCarryoverEvidence` then `syncNarrativeEntities('setState')`
(adapter `:378`), and `refreshFromState` syncs again (`:386`). The Giant's `when` is true → re-added to `GAME.Maps.roadhouse.npcs`
and, if the roadhouse is loaded, to `E.state.npcs` (`:296-303`). `A.currentMissionFor` returns the last entered mission (`:369-374`)
= M8. `worldRoots(state, M8, 'roadhouse')` returns exactly one node, `m8_roadhouse_phone` — `m8_roadhouse_truman`'s
`¬presagio_status` is false. **Confirmed: the Giant re-appears and the phone is the only root.** `gigante2` survives because
`classicSnapshot` persists `flags` (`js/narrative-production.js:20-28`) and `syncNarrativeToClassic` re-derives it on the next poll.
Residual: with no node (O4) the Giant re-appears mute after every reload.

### O13 · 4.11 · P7 · premise: P7 exists as a formulable proposition

**No writer anywhere.** P7 appears exactly three times across all mission data: twice inside `invariant` prose, once as a branch
key. The only proposition-formulating effect in M8 is `m8_cmp_diary/diary_a → {"proposition":"P8","to":"formulated",
created_from:[E3_LETTERA_R, E9A_LETTERA_O, E9B_STESSO_METODO, E1_DIARIO]}`. Nothing writes P7 in M4, M5, M6, M8 or M9.

M9 reads it at `m9_present_truman.presentation.on.P7` (`js/narrative-data.gen.js:6314-6332`): `"result": "rejected", "reason_code":
"VALID_BUT_NOT_PROCEDURAL"`, one Truman page ("Lo tengo a mente. Ma non convoco un uomo per una teoria.") plus an
`already_rejected_page`. The menu is built by `NR.presentationOptions` (`js/narrative-runtime.js:432-439`), which lists a key only
when `peekProp(state, pid).formulation.status === 'formulated'`. The declarative `options_from: "formulated_propositions_only"` is
read by **no code** (grep: two data hits, zero code). Catalogue: `P7 = "[IPOTESI] La ripetizione è legata alla famiglia Palmer.",
hypothesis: true, formulable_in: "M8", procedural: false` (`js/narrative-data.gen.js:7134-7141`).

**Defect** — the P7 branch is unreachable dead data. All 324 routes.

## Part 2 — engine pressure

| proposed element | precedent |
|---|---|
| entity with a `when` | adapter `:150-237`, the whole `NARRATIVE_ENTITIES` registry |
| `when` using `flag`/`not`/`all`/`node_done`/`value_set`/`evidence` | adapter `:161`, `:172`, `:180`, `:188`, `:203`, `:232` |
| `when` using `value_is` | **no precedent in the registry**; supported by `NR.evalCond` (`js/narrative-runtime.js:84`) |
| `when` using OR | **no precedent, no operator** — `COND_KEYS` has no `any` (`js/narrative-runtime.js:79`) |
| entity `dialogue: null`, no node (scenery) | `piantone` — adapter `:161-172` |
| entity `dialogue: null` **with** a one-line actor node | `hawk_bridge`/`hawk_door`/`hawk_cut` — adapter `:197-215`, nodes `m5_hawk_*` |
| entity on a **solid** tile | **no precedent**; mechanically sound (`js/engine.js:733` precedes any solidity test) |
| entity with a non-character sprite | **no precedent**; silent fallback to Cooper (`js/engine.js:1015`, `:1113`, `js/chars.js:149`) |
| `giant` sprite as a placed NPC | **no precedent as data**; full renderer support (`js/chars.js:66/101/136`, `js/retro-authored.js:33`, `js/portraits.js:51`, `js/render3d.js:6481`, `:11450`) |
| second body for an actor who also exists elsewhere | `truman@traincar` vs classic `truman@sheriff` — adapter `:187-191` vs `js/glue.js:24` |
| state-conditional town render grade | **no precedent** — unconditional `install()` (`js/town-dusk.js:487-505`), stateless hook (`:492`), colour-only memo (`:173-176`) |
| moving a `WORLD_TARGETS` coordinate | traincar re-key — adapter `:70-88` |
| landmark target on a solid tile | `lago_maddy` town `15,28` = `F` — adapter `:110` |
| landmark target on a walkable tile | `roadhouse_phone` `8,5` = `f` — adapter `:100`, `js/maps.js:417` |
| one beat split across two nodes on two targets | `m8_diner`(maddy) → `m8_leland_taxi`(leland); also `m5_tracks_north_early`/`m5_tracks_north`, `m6_return_night_early`/`m6_return_night` |
| classic NPC `cond` addition in `glue.js` | `js/glue.js:49` (Leland), `:57` (Maddy), both `'!flag:gigante2'` |
| walkthrough mission stub addition | `test/walkthrough.js:194-199` `MISSION_STUBS`, already carries `gigante2` gated on `atto4` |
| `narrative_m8_owned` as a classic hide-flag | written `js/narrative-production.js:162`, read `js/glue.js:49`/`:57`, set manually `test/probe-act4-pacing.js:212` |
