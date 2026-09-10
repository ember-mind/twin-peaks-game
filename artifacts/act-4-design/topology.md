# Act 4 — live production topology (read-only audit)

Scope: from M6 completion (`atto4`) to M9 entry, as the shipped build plays it.
Facts only, with `file:line`. No proposals.

Method note: "production" = `index.html` boot, where `js/narrative-production.js`
runs `boot()` with missions `['M4','M5','M6','M8','M9']` (`js/narrative-production.js:282`)
and the 180 ms sync loop (`js/narrative-production.js:313`). Classic reachability
is judged against `A.tryInteract` / `A.tryInteractAt`
(`js/narrative-engine-adapter.js:516`, `:557`) and `E.npcActive` (`js/engine.js:337`).

---

## 1. Act 4 entry

- **Writer of `atto4` in production**: mission node `m6_atto4_bridge`
  (`narrative/missions/M6.json:1533`), channel `world`, `map_id: sheriff`,
  `actor_id: truman`, conditions `[{flag:jacques_dead},{flag:gigante1},{not:{flag:atto4}}]`
  (`:1536-1548`), effects `[{set:"atto4"}]` (`:1616-1618`).
  It is also `M6.completion.when.node_done` (`narrative/missions/M6.json:92-96`).
  Invariant text: "atto4 nasce solo dopo l'ultima pagina e apre M8 senza fallback
  legacy" (`:1627`).
- **Classic `truman_atto4`** (`js/data.js:710-718`, `setFlag: 'atto4'`) is still in the
  data and still wired in the Truman cascade (`js/glue.js:30`, `cond: 'flag:gigante1'`),
  but it is SHADOWED: M4 owns `sheriff/truman` (`present_truman_m4`, `truman_a2`) and
  M6 owns it too (`m6_atto4_bridge`, `m6_return_night*`), so `A.tryInteract` finds an
  `owner` and returns `true` before `startDialogue` is ever reached
  (`js/engine.js:747`, `js/narrative-engine-adapter.js:527-555`).
- **`atto4` reaches the classic layer** only through the bridge:
  `syncNarrativeToClassic` sets `classicFlags.atto4` (`js/narrative-production.js:152`).
  The reverse bridge `syncClassicToNarrative` also lists `atto4`
  (`js/narrative-production.js:141`), so a legacy save that already has it is honoured.
- **M8 `entry_condition`**: `{flag: "atto4"}` (`narrative/missions/M8.json:10-12`).
- **M9 `entry_condition`**: `{all:[{flag:"atto4"},{node_done:"m8_station"},{evidence:"T_LELAND_TAXI"}]}`
  (`narrative/missions/M9.json:12-24`). Entry note explicitly refuses `atto5` as a gate
  (`:25`).
- **What M8 reads at entry**: nothing but `atto4`. Its first actionable objective
  `obj_m8_0` fires on `{not:{value_set:"promise_stance"}}` and reads
  "Passa dal diner, questo pomeriggio." (`narrative/missions/M8.json`, objectives block).
  The first root `m8_diner` has conditions `[{not:{value_set:"promise_stance"}}]`.

---

## 2. M8 runtime map

`narrative/missions/M8.json`, 12 nodes, 73 pages (counted by
`test/narrative-validate-m8.js:364`). Completion: `{node_done: "m8_station"}`,
`sets: []` (`:36-41`).

| node (line) | ch | map | actor / target | conditions | effects (summary) | choices |
|---|---|---|---|---|---|---|
| `m8_diner` (181) | world | diner | actor `maddy` | `not value_set promise_stance` | — (choices write) | `promise_accompagno` / `promise_autonomia` / `promise_prudenza` → `promise_stance` |
| `m8_leland_taxi` (490) | world | diner | actor `leland` | `value_set promise_stance`, `not evidence T_LELAND_TAXI` | `evidence T_LELAND_TAXI` | — |
| `m8_roadhouse` (317) | world | roadhouse | object `roadhouse_phone` | `value_set promise_stance`, `evidence T_LELAND_TAXI`, `not value_set warning_target` | `presagio_status=active`, notebook `m8.note.presagio` | `warning_palmer` / `warning_centrale` / `warning_nessuno` → `warning_target`, `maddy_action_after_warning`, `sarah_support_state` |
| `m8_focus_choice` (597) | world | town | landmark `town_crossroads` | `evidence T_LELAND_TAXI`, `value_set warning_target`, `not value_set focus_destination` | — | `focus_palmer` / `focus_lago` / `focus_diner` → `focus_destination` |
| `m8_route_palmer` (678) | world | palmer | landmark `palmer_entrance` | `focus_destination == palmer`, `not value_set body_found_by` | `body_found_by=hawk` | — |
| `m8_route_lake` (748) | world | town | landmark `lago_maddy` | `focus_destination == lago`, `not value_set body_found_by` | `body_found_by=cooper` | — |
| `m8_route_diner` (795) | world | diner | actor `norma` | `focus_destination == diner`, `not value_set body_found_by` | `body_found_by=hawk` | — |
| `m8_discovery` (849) | world | town | landmark `lago_maddy` | `value_set body_found_by`, `not flag maddy_trovata` | `E9A_LETTERA_O`, `E9B_STESSO_METODO`, `letter_o_chain=standard`, `letter_o_observation_source` derived from `body_found_by`, `presagio_status active→verified`, `set maddy_trovata`, notebook `m8.note.letter_o` | — (`next: m8_promise_echo`, `:849` block) |
| `m8_promise_echo` (963) | world | town | landmark `lago_maddy` | `flag maddy_trovata`, `not node_done m8_promise_echo` | — | — |
| `m8_cmp_letters` (1040) | notebook | — | — | `E9A_LETTERA_O`, `E3_LETTERA_R`, `node_done m8_promise_echo` | `notebook_observation m8.obs.letters` | — |
| `m8_cmp_diary` (1086) | notebook | — | — | `E9A_LETTERA_O`, `E1_DIARIO`, `node_done m8_promise_echo`, `node_done m8_cmp_letters` | — | `diary_a` → `P8 formulated` (from E3+E9A+E9B+E1); `diary_b`, `diary_c` no effects |
| `m8_station` (1205) | world | sheriff | actor `truman` | `P8.formulation.status == formulated` | — | — |

Graph order: `m8_diner` → `m8_leland_taxi` → `m8_roadhouse` → `m8_focus_choice` →
one of `m8_route_{palmer,lake,diner}` → `m8_discovery` → (`next`, mandatory)
`m8_promise_echo` → notebook `m8_cmp_letters` → `m8_cmp_diary` → `m8_station`.

Branching text: `m8_discovery.pages_by_value` on `body_found_by`
(cases `cooper` / `hawk`), `m8_promise_echo.pages_by_value` on `promise_stance`
(3 cases), `m8_station.pages_by_value` on `sarah_support_state` (`none` / `vice`).

Objectives (7, priority-ordered): `obj_m8_0` (50) → `obj_m8_1` (100) →
`obj_m8_2` (200) → `obj_m8_25` (250) → `obj_m8_3` (300) → `obj_m8_35` (350) →
`obj_m8_4` (400). No `milestone` key on any M8 node.

### WORLD_TARGETS relevant to Act 4 (`js/narrative-engine-adapter.js:69-111`)

| map | target_id | coords | kind | line | tile |
|---|---|---|---|---|---|
| roadhouse | `roadhouse_phone` | 8,5 | object | :102 | floor `f` |
| town | `town_crossroads` | 30,30 | landmark | :105 | `S` (sign), classic interact `cartello` |
| town | `lago_maddy` | 15,28 | landmark | :106 | `F`, classic interact `lago_riva` |
| palmer | `palmer_entrance` | 8,10 | landmark | :109 | floor `f`, no classic interact |
| hospital | `night_register` | 13,8 | object | :90 | M6-owned, not Act 4 |

The adapter comment at `:95-100` states `lago_maddy` deliberately coincides with the
classic `lago_riva` tile: "target CONDIVISO, la missione corrente vince latest-first,
altrimenti il classico risponde".

### NARRATIVE_ENTITIES for Act 4 (`js/narrative-engine-adapter.js:149-235`)

| entity | map | coords | `when` | line |
|---|---|---|---|---|
| `maddy` | diner | 10,1 | `all:[flag atto4, not value_set promise_stance]` | :223-227 |
| `leland` | diner | 11,1 | `all:[flag atto4, value_set promise_stance, not evidence T_LELAND_TAXI]` | :230-234 |

No narrative entity exists for roadhouse, town, palmer or sheriff in Act 4: the
Giant at the Roadhouse is pages of `m8_roadhouse`, not an NPC; Truman at the station
and Norma at the diner are classic NPCs the adapter interacts with by `actor_id`
(`js/narrative-engine-adapter.js:92-94`).

`syncNarrativeEntities` adds/removes both from `GAME.Maps[map].npcs` and from the live
`E.state.npcs` (`js/narrative-engine-adapter.js:284-307`), and is re-run after every
`NR.commit*` (`:317-329`).

---

## 3. Classic Act 4 content still live

### glue.js conditions touching Act 4 flags

| line | item | cond | verdict |
|---|---|---|---|
| `js/glue.js:28` | `truman` → `truman_wait5` | `flag:atto5` | SHADOWED (M4/M6/M9 own sheriff/truman) |
| `:29` | `truman` → `truman_atto5` | `flag:maddy_trovata` | SHADOWED |
| `:30` | `truman` → `truman_atto4` | `flag:gigante1` | SHADOWED |
| `:42` | sheriff `leland` NPC | `['flag:atto5','!flag:leland_morto']` | Act 5; SHADOWED by M9 `m9_arrivo` (sheriff/leland) |
| `:47` | palmer `sarah` → `sarah_visione` | `flag:atto4` | **LIVE CLASSIC** — no mission owns palmer/sarah |
| `:49` | palmer `leland` NPC presence | `['!flag:atto5','!flag:gigante2','!flag:narrative_m8_owned']` | DEAD from `atto4` on |
| `:51-53` | `leland_dopo` / `leland_dove` / `leland_a4` | `maddy_trovata` / `gigante2` / `atto4` | DEAD (NPC hidden) |
| `:56-57` | palmer `maddy` NPC → `maddy_a4` | `['flag:atto4','!flag:gigante2','!flag:narrative_m8_owned']` | DEAD — `atto4` and `narrative_m8_owned` are written in the same sync tick |
| `:67` | hospital `gerard` → `gerard_a4` | `flag:atto4` | SHADOWED (M4 owns hospital/gerard) |
| `:76` | diner `loglady` → `loglady_a4` | `flag:atto4` | **LIVE CLASSIC** |
| `:106-107` | `specchio315` → `specchio_dopo` / `gigante1_dlg` | `gigante1` / `jacques_morto` | **LIVE CLASSIC** (room_315 has no WORLD_TARGETS entry) |
| `:111-112` | `lago_riva` → `lago_dopo` / `lago_maddy` | `maddy_trovata` / `gigante2` | SHADOWED from `atto4` on (tile 15,28 = `lago_maddy`) |

`narrative_m8_owned` has exactly one writer, `js/narrative-production.js:162`
(`if (state.flags.atto4) classicFlags.narrative_m8_owned = true;`), and is never
cleared. Because `atto4` and `narrative_m8_owned` are set in the same call, the
classic Maddy at Palmer (`js/glue.js:56-57`) can never satisfy its own `cond`.

### data.js Act 4 dialogues (first line quoted)

| id (line) | first line | writes |
|---|---|---|
| `gigante1_dlg` (696) | "Lo specchio vibra. La stanza si fa fredda…" | `setFlag: gigante1` |
| `specchio_dopo` (691) | "Lo specchio riflette solo la stanza. Ma l'aria... vibra ancora." | — |
| `truman_atto4` (710) | "Harry, nello specchio è apparso un uomo alto…" | `setFlag: atto4` |
| `maddy_a4` (722) | "Sono Maddy. Non Laura…" | — (has `again`) |
| `sarah_visione` (735) | "Il divano era vuoto. Poi c'era un uomo accovacciato…" | `setFlag: sarah_visione_ascoltata` |
| `leland_a4` (745) | "Agente Cooper! Entri, entri, si accomodi!" | — |
| `leland_dove` (753) | "Maddy prende la prima corriera domattina. Ho chiamato la Twin Peaks Taxi…" | — |
| `leland_dopo` (760) | "Anche lei, adesso... anche Maddy..." | — |
| `gerard_a4` (768) | "Agente... sento di nuovo la trance arrivare..." | — |
| `loglady_a4` (776) | "Il mio ceppo ha ripreso a parlare, agente." | — |
| `lago_laura` (787) | "Nastro giallo tra i giunchi…" | — |
| `lago_sguardo` (793) | "L'acqua è immobile…" | — |
| `lago_maddy` (798) | "Qualcosa galleggia tra i giunchi. Plastica trasparente…" | `give: ['lettera_o']`, `setFlag: maddy_trovata` |
| `lago_dopo` (810) | "L'acqua è tornata immobile. Io no." | — |
| `truman_atto5` (815) | "Nel diario, ROBERT. Sotto le unghie, R e O…" | `setFlag: atto5` |
| `truman_wait5` (826) | "Quando è pronto, agente. Il distretto è con lei." | — |
| `roadhouse_chiuso` (250) | "Chiuso. Dalla porta filtra un giro di basso…" | — (blockedMsg for the roadhouse door) |
| `lucy_a3` (679) | "Agente Cooper! È appena arrivata una chiamata dall'ospedale…" | `setFlag: jacques_morto` |
| `lettera_o` item (182) | desc "Sotto l'unghia di Maddy: una O, dopo la R di Laura…" | inventory item + `document` |

`lettera_o` is given only by classic `lago_maddy`, which is shadowed; in production the
same fact arrives as evidence `E9A_LETTERA_O` from `m8_discovery`. The classic item
therefore never enters the inventory on the live path.

---

## 4. Giant / Roadhouse

- **`gigante1` (Room 315 mirror)** — owner is the **classic** layer.
  `js/glue.js:105-109` cascades `specchio315` → `gigante1_dlg` when `flag:jacques_morto`;
  `js/data.js:696-707` sets `gigante1`. Map tile `room_315` 13,3
  (`js/maps.js:208`). `room_315` has no `WORLD_TARGETS` entry, so
  `A.tryInteractAt` returns `false` and the classic object answers
  (`js/narrative-engine-adapter.js:561-562`). The flag then crosses to the mission
  layer via `syncClassicToNarrative` (`js/narrative-production.js:141`), where
  `m6_atto4_bridge` requires it (`narrative/missions/M6.json:1539-1542`).
  There is no mission node for the mirror in M4/M5/M6/M8/M9.
- **`gigante2` (Roadhouse)** — owner is the **mission** layer. There is no
  `gigante2_dlg` / `palco_gigante` dialogue left in `js/data.js`; the Act 3 closure
  retired it (`test/walkthrough.js:189-193` names `palco_gigante (gigante2_dlg)` among
  the retired classic beats, alongside `jacques_a3` and `audrey_oej`). The Giant's second
  utterance is page `m8.b.roadhouse.p04`, speaker `gigante`: "Sta accadendo di nuovo."
  (`narrative/missions/M8.json:355-356`).
  `gigante2` survives only as a **derived classic flag**:
  `js/narrative-production.js:163` — `if (state.nodes_done.m8_roadhouse) classicFlags.gigante2 = true;`.
  Its remaining readers (`js/glue.js:49,52,57,112`, `js/data.js:910`) are all in
  shadowed or dead branches.
- Roadhouse map (`js/maps.js:409-428`) has `interact: {}` and no entry in
  `glue.js` `NPCS`, so it carries zero classic content. Access is the town door
  `'47,28'` with `needsFlag: 'atto4'`, `blockedMsg: 'roadhouse_chiuso'`
  (`js/maps.js:120`).

---

## 5. Log Lady wayfinding

Only classic. NPC `loglady` at diner 4,5 (`js/glue.js:75-76`), cascade
`{cond:'flag:atto4', then:'loglady_a4'}` else `loglady`.
`js/data.js:776-783` — "Il mio ceppo dice: stanotte, al roadhouse. Le civette sono già
lì." No mission in M4/M5/M6/M8/M9 declares a `loglady` actor, so `A.tryInteract`
returns `false` and the classic dialogue plays (`js/narrative-engine-adapter.js:526`).
This is the only classic wayfinding line that still fires in Act 4, and it duplicates
mission objective `obj_m8_1` "Il paese si ritrova al Roadhouse, stasera."

---

## 6. Palmer house in Act 4

| character | classic | mission | live? |
|---|---|---|---|
| Maddy | NPC `js/glue.js:56-57` → `maddy_a4` | entity at **diner** 10,1 (`js/narrative-engine-adapter.js:223-227`), node `m8_diner` | classic DEAD, mission LIVE at the diner |
| Leland | NPC `js/glue.js:48-55` → `leland_a4`/`leland_dove`/`leland_dopo` | entity at **diner** 11,1 (`:230-234`), node `m8_leland_taxi`; later sheriff `m9_arrivo` | classic DEAD, mission LIVE at the diner |
| Sarah | NPC `js/glue.js:46-47` → `sarah_visione` | no M8 node; M9 `carryover_evidence` `T_SARAH_VISIONE` gated on `flag sarah_visione_ascoltata` (`narrative/missions/M9.json:70-80`) | **LIVE CLASSIC**, and a SYNC source |

Retirement conditions: both Maddy and Leland at Palmer carry `!flag:narrative_m8_owned`
(`js/glue.js:49`, `:57`), which is permanently true from `atto4` onward. The mission
counterpart moves both to the diner and removes them once their window closes
(Maddy after `promise_stance`, Leland after `T_LELAND_TAXI`).

The house itself is still entered in Act 4, but as a **landmark**: `palmer_entrance`
(palmer 8,10) drives `m8_route_palmer`, whose pages describe the empty house
("La casa: buio al piano di sopra.", "In ingresso, la valigia…") and end with Lucy's
phone call redirecting Cooper to the lake.

`sarah_visione_ascoltata` crosses to the mission layer via
`js/narrative-production.js:141`.

---

## 7. Gerard

`js/data.js:768-774`, verbatim:

```
GERARD: Agente... sento di nuovo la trance arrivare...
GERARD: BOB è vicino. Una casa di legno, circondata da alberi. Lo ospita da vent'anni.
COOPER: Gerard, «una casa nel bosco» è un inizio. Mi dia un suono, un odore, qualcosa che una pattuglia riconosca.
```

Cond in glue: `js/glue.js:66-67` — hospital NPC `gerard`, dialogue cascade
`[{cond:'flag:atto4', then:'gerard_a4'}, 'gerard_a2']`.

Reachability: **SHADOWED**. M4 declares two world nodes on `hospital/gerard`
(`gerard_attesa`, conditions `[{flag:sogno_fatto},{not:{flag:sogno_raccontato}}]`;
`gerard_a2`, conditions `[{flag:sogno_raccontato}]`). M4's `entry_condition` is
`{flag:"sogno_fatto"}`, satisfied since Act 2, so from Act 2 onward `A.tryInteract`
finds `owner = M4` and returns `true` before `startDialogue`
(`js/narrative-engine-adapter.js:527-555`, `js/engine.js:747`). `worldRoots` does not
filter out already-done nodes (`js/narrative-runtime.js:555-576`), so `gerard_a2`
stays an active root and re-runs; `gerard_a4` is never selected.

Consequence: the only "casa di legno nel bosco / vent'anni" line in the build is
unreachable in production, though `test/walkthrough.js` still traverses it
(trace step 63, `done:gerard_a4 [hospital]`).

---

## 8. Other Act 4 locations

- **Double R (diner)** — classic NPCs `norma` 5,2, `shelly` 9,7, `loglady` 4,5,
  `james` 9,6 (`js/glue.js:69-78`). `norma` is owned by M8 (`m8_route_diner`) and
  `james` by M4 (`james_attesa`, `james_a2`), so both are shadowed in Act 4;
  `shelly` and `loglady` are not claimed by any mission and stay classic.
  Narrative entities `maddy` (10,1) and `leland` (11,1) are injected here.
  Map is 14×10, `interact: {}` (`js/maps.js`, `diner` block).
- **Sheriff's Station** — Truman classic cascade (`js/glue.js:25-35`) fully shadowed
  by M4/M6/M8/M9 nodes on `sheriff/truman`. Lucy (`js/glue.js:39-40`,
  `{cond:'flag:jacques_preso', then:'lucy_a3'}`) is claimed by M6 `m6_news` and later
  M9 `m9_verifica_taxi`, so `lucy_a3` is shadowed from M6 entry
  (`east_route_confirmed`) onward. Andy and Hawk at the station are unclaimed and
  stay classic. `m8_station` is the Act 4 delivery beat here.
- **Hospital** — reached through town door `'23,6'`, `needsFlag: 'sogno_fatto'`
  (`js/maps.js:116`). Classic `gerard` shadowed (§7); classic interact `'3,5': 'ronette_letto'`
  (`js/maps.js:262`) collides with the narrative entity `ronette` at 3,5
  (`js/narrative-engine-adapter.js:152`) — the NPC wins because `npcAt` is tested first
  (`js/engine.js:733,741`). No M8 content in the hospital.
- **Room 315** — `js/maps.js:208`, interacts `specchio315` (13,3), `letto_315`,
  `scrivania_315` (8,3). No `WORLD_TARGETS` entry for `room_315`; all classic.
  `specchio315` is the sole `gigante1` writer.
- **Town gates / doors** (`js/maps.js:116-124`):
  - `'23,6'` → hospital, `needsFlag: sogno_fatto`, `blockedMsg: hospital_locked`
  - `'42,6'` → palmer, ungated
  - `'47,28'` → roadhouse, `needsFlag: atto4`, `blockedMsg: roadhouse_chiuso`
  - `interact` map: `'30,30': 'cartello'`, `'15,28': 'lago_riva'`, `'50,22': 'tomba_laura'`
  No door anywhere carries `needsFlag: gigante2`.
- **Woods / lake** — `woods` has no NPCs (`js/glue.js:79`) and no Act 4 content. The
  lake is the town tile 15,28, shared between classic `lago_riva` and mission
  `lago_maddy` (three M8 nodes: `m8_route_lake`, `m8_discovery`, `m8_promise_echo`).

---

## 9. Transition to M9

- **M8 completion**: `{when:{node_done:"m8_station"}, sets:[]}`
  (`narrative/missions/M8.json:36-41`).
- **`maddy_trovata` writer**: `m8_discovery` effect `{set:"maddy_trovata"}`
  (`narrative/missions/M8.json`, `m8_discovery` at :849; invariant "maddy_trovata [P]
  unico writer"). The classic writer `lago_maddy` (`js/data.js:807`) is shadowed.
- **M9 reads at entry**: `atto4`, `node_done m8_station`, `evidence T_LELAND_TAXI`
  (`narrative/missions/M9.json:12-24`). M9's own chain is
  `m9_verifica_taxi` (sheriff/lucy, writes `D_TAXI`) → `m9_cmp_taxi` (notebook, `P6`
  formulated) → `m9_present_truman` (sheriff/truman, writes `atto5` at
  `narrative/missions/M9.json:445-448`) → `m9_arrivo` (sheriff/leland, gated on
  `P6.social_status.accepted_by contains truman` **and** `flag atto5`).
- **Sync, narrative → classic** (`js/narrative-production.js:150-164`):

```js
if (state.flags.atto3) classicFlags.atto3 = true;
if (state.flags.atto4) classicFlags.atto4 = true;
if (state.flags.atto5) classicFlags.atto5 = true;
if (state.flags.jacques_preso) classicFlags.jacques_preso = true;
if (state.flags.east_route_confirmed) classicFlags.east_route_confirmed = true;
if (state.flags.jacques_dead) classicFlags.jacques_morto = true;
if (state.flags.maddy_trovata) classicFlags.maddy_trovata = true;
if (state.flags.atto4) classicFlags.narrative_m8_owned = true;
if (state.nodes_done.m8_roadhouse) classicFlags.gigante2 = true;
```

- **Sync, classic → narrative** (`js/narrative-production.js:137-148`):

```js
['sogno_fatto','atto3','atto4','atto5','gigante1','maddy_trovata','leland_morto',
 'sarah_visione_ascoltata','audrey_indaga'].forEach(function (name) {
  if (classicFlags[name]) ensureFlag(NR, state, name);
});
if (classicFlags.done_leland_dove) ensureEvidence(NR, state, 'T_LELAND_TAXI');
```

The `done_leland_dove` line is a legacy-save bridge only; the comment at `:144-146`
states the canonical source is `m8_leland_taxi` and that M9 never writes it.

- After `m9_arrivo`, the loop hands off to the finale: `A.disable({keepNotebook:true})`
  once `state.nodes_done.m9_arrivo && !A.active()` (`js/narrative-production.js:339-352`).
  From that point classic NPCs are no longer shadowed by the adapter.

---

## 10. Tests that pin Act 4

| file | size / count |
|---|---|
| `test/narrative-validate-m8.js` | 366 lines; **4357 static checks**, reports "73 pagine M8, 12 nodi" |
| `test/narrative-validate-m9.js` | 546 lines; **3935 static checks**, "36 pagine M9, 4 nodi" |
| `test/narrative-m9-runtime.js` | 109 lines |
| `test/m8-engine-harness.html` | 834 lines; **176** `out.checks[...]` gates, G0–G8 (bootstrap, promise, presagio, routes, valigia classes, comparisons, ambiguity fail-closed, DOM token scan) |
| `test/m8-physical-harness.html` | 672 lines; B0 bootstrap gates + COVER gates (`nine_route_classes_warning_x_focus`, `seven_targets_walked_and_interacted`, `routes_completed`) |
| `test/m8-screentruth-harness.html` | 679 lines; B0 gates + ~20 CONTRACT gates on recorded page ids, visible text and value coverage |

Other files referencing Act 4 flags or M8 nodes: `test/smoke.js`, `test/walkthrough.js`,
`test/narrative-validate.js`, `test/letter-chain-provenance.js`,
`test/narrative-repair-contract.js`, `test/narrative-finale.js`,
`test/narrative-slice-01.js`, `test/dialogue-craft-regression.js`,
`test/interaction-voice.js`, `test/production-narrative-probe.html`,
`test/production-finale-probe.html`, `test/narrative-bootstrap-probe.html`.
There is no `act-4*` test file.

Native suite at audit time: `node test/smoke.js` → 443 checks green;
`node test/walkthrough.js` → 89 acquisitions, finale reached.

**Caveat found**: `test/walkthrough.js` simulates the classic layer with mission stubs
(`:194-199`) that set `east_route_confirmed`, `jacques_preso`, `audrey_salvata`,
`gigante2` — but **not** `narrative_m8_owned`. Its Act 4 trace therefore visits
`truman_atto4` (step 61), `gerard_a4` (step 63), `lago_maddy` (step 73) and
`clue:lettera_o` (step 71), all of which are shadowed in production. The classic
walkthrough validates a path the shipped build does not play.

---

## Ownership classification

| item | layer | class | evidence |
|---|---|---|---|
| `atto4` write | mission | LIVE MISSION | `narrative/missions/M6.json:1533,1616` |
| `truman_atto4` (classic bridge) | classic | SHADOWED | `js/glue.js:30`, `js/data.js:710`, `js/narrative-engine-adapter.js:527` |
| `atto4` → classic flags | both | SYNC | `js/narrative-production.js:152` |
| `narrative_m8_owned` | derived | SYNC | `js/narrative-production.js:162` |
| M8 entry | mission | LIVE MISSION | `narrative/missions/M8.json:10` |
| M9 entry | mission | LIVE MISSION | `narrative/missions/M9.json:12` |
| `m8_diner` / Maddy promise | mission | LIVE MISSION | `narrative/missions/M8.json:181`, entity `js/narrative-engine-adapter.js:223` |
| `m8_leland_taxi` / `T_LELAND_TAXI` | mission | LIVE MISSION | `narrative/missions/M8.json:490`, entity `:230` |
| classic `maddy_a4` (palmer) | classic | DEAD | `js/glue.js:56-57` + `js/narrative-production.js:162` |
| classic `leland_a4` / `leland_dove` / `leland_dopo` | classic | DEAD | `js/glue.js:48-55` |
| classic `sarah_visione` (palmer) | classic | LIVE CLASSIC | `js/glue.js:46-47`, `js/data.js:735` |
| `sarah_visione_ascoltata` → `T_SARAH_VISIONE` | both | SYNC | `js/narrative-production.js:141`, `narrative/missions/M9.json:70-80` |
| `gigante1_dlg` (Room 315 mirror) | classic | LIVE CLASSIC | `js/glue.js:105-109`, `js/data.js:696` |
| `gigante1` → mission | both | SYNC | `js/narrative-production.js:141` |
| Giant #2 (Roadhouse) | mission | LIVE MISSION | `narrative/missions/M8.json:355` |
| classic `palco_gigante` / `gigante2_dlg` | — | RETIRED (absent) | `test/walkthrough.js:189-193` |
| `gigante2` flag | derived | SYNC (readers all dead/shadowed) | `js/narrative-production.js:163`, `js/glue.js:49,52,57,112` |
| `gerard_a4` | classic | SHADOWED | `js/glue.js:67`, M4 `hospital/gerard` nodes, `js/narrative-runtime.js:555` |
| `loglady_a4` | classic | LIVE CLASSIC | `js/glue.js:76`, `js/data.js:776` |
| classic `norma` / `norma_a2` (Act 4) | classic | SHADOWED | `js/glue.js:70-72`, `m8_route_diner` |
| classic `shelly` (Act 4) | classic | LIVE CLASSIC | `js/glue.js:73-74` |
| classic Truman cascade (`truman_atto5`, `truman_wait5`, `truman_fine`) | classic | SHADOWED | `js/glue.js:26-34`, M4/M6/M8/M9 `sheriff/truman` |
| classic `lucy_a3` | classic | SHADOWED | `js/glue.js:40`, M6 `m6_news`, M9 `m9_verifica_taxi` |
| classic Andy / Hawk (sheriff) | classic | LIVE CLASSIC | `js/glue.js:36-38` |
| `lago_riva` tile 15,28 | shared | DUPLICATED OWNERSHIP, mission wins from `atto4` | `js/glue.js:110-115`, `js/narrative-engine-adapter.js:106,557` |
| classic `lago_maddy` (+ `lettera_o` item) | classic | SHADOWED | `js/data.js:798-808`, `js/maps.js:124` |
| `maddy_trovata` write | mission | LIVE MISSION | `narrative/missions/M8.json:849` |
| `maddy_trovata` → classic | both | SYNC | `js/narrative-production.js:159` |
| `cartello` tile 30,30 | shared | DUPLICATED OWNERSHIP, mission wins from `atto4` | `js/glue.js:99`, `js/narrative-engine-adapter.js:105` |
| `palmer_entrance` 8,10 | mission | LIVE MISSION (no classic rival) | `js/narrative-engine-adapter.js:109` |
| `roadhouse_phone` 8,5 | mission | LIVE MISSION (roadhouse has no classic content) | `js/narrative-engine-adapter.js:102`, `js/maps.js:409-428` |
| roadhouse door `47,28` `needsFlag: atto4` | classic | LIVE CLASSIC (fed by sync) | `js/maps.js:120` |
| `m8_station` → M9 handoff | mission | LIVE MISSION | `narrative/missions/M8.json:36`, `narrative/missions/M9.json:12` |
| `atto5` write | mission | LIVE MISSION | `narrative/missions/M9.json:445-448` |
| classic `truman_atto5` (`setFlag: atto5`) | classic | SHADOWED | `js/data.js:815-824` |
| classic `D.objectives` Act 4 rows | classic | SHADOWED while M8 entered | `js/data.js:908-912`, `js/narrative-engine-adapter.js:424-441` |
| sheriff `leland` NPC (Act 5) | classic | SHADOWED by M9 `m9_arrivo` | `js/glue.js:41-43` |
