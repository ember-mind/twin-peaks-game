# State Ownership Forensic Audit

Method: `grep -n` for each key across `narrative/missions/{M4,M5,M6,M8,M9}.json`,
`js/data.js`, `js/glue.js`, `js/narrative-production.js`,
`js/narrative-engine-adapter.js`, `js/narrative-runtime.js`, followed by manual
inspection of surrounding JSON to classify each hit as a WRITER (`effects[].set`,
`effects[].value`/`to`, `effects[].flag`/`evidence`, classic `setFlag:`) or a
READER (`condition`/`conditions`/`when`/`repeat_when`, classic `cond:`/`flag:`).
`test/*.js` excluded per instructions. Node ids for writers were resolved by
walking backward from the effect line to the nearest enclosing `"id":` at node
indentation level (6 spaces) in the mission JSON.

---

## east_route_confirmed

- WRITERS:
  - `narrative/missions/M5.json:1399` — node `m5_tracks_north` (map_id `traincar`,
    target `tracks_north`), `effects: [{"evidence":"E_TRACCE_EST"},{"set":"east_route_confirmed"},{"notebook":...}]`.
    Node invariant at `M5.json:1408` states verbatim: *"UNICO writer di
    east_route_confirmed e di E_TRACCE_EST"*.
  - `js/narrative-production.js:157` — `syncNarrativeToClassic`:
    `if (state.flags.east_route_confirmed) classicFlags.east_route_confirmed = true;`
    (narrative→classic sync, not a second independent writer of narrative truth).
- READERS:
  - `narrative/missions/M6.json:11` — M6 `entry_condition: {"flag":"east_route_confirmed"}`.
  - `narrative/missions/M5.json:108` — mission `completion.when`.
  - `narrative/missions/M5.json:117` — objective `obj_m5_7.when`.
  - `narrative/missions/M5.json:131` — objective `obj_m5_6.when` (`not` branch).
  - `narrative/missions/M5.json:1225` — node `m5_report_intro`? `repeat_when: {"flag":"east_route_confirmed"}` (node ending at line ~1224).
  - `narrative/missions/M5.json:1467` — node `m5_sign_oej`, `conditions: [{"flag":"east_route_confirmed"}]`.
  - `js/narrative-engine-adapter.js:197` — `NARRATIVE_ENTITIES` Truman@traincar `when: {all:[{value_set:'m5_final_theory'},{not:{flag:'east_route_confirmed'}}]}`.
  - Classic: `js/maps.js:375` — `traincar` door `'21,0'`: `needsFlag: 'east_route_confirmed'` (gates the door to `oej`). This is the physical consumer that requires the narrative→classic sync above.

## jacques_dead

- WRITERS:
  - `narrative/missions/M6.json:1492` — node `m6_news` (id at `M6.json:1422`), `effects: [{"set":"jacques_dead"},{"set":"jacques_testimony_lost"}, ...]`. Invariant at `M6.json:1506`: *"la fine critica scrive SOLO jacques_dead + jacques_testimony_lost (+ P9)"*.
  - `js/narrative-production.js:158` — sync out: `if (state.flags.jacques_dead) classicFlags.jacques_morto = true;` (renames to classic `jacques_morto`, not an independent writer).
- READERS:
  - `narrative/missions/M6.json:105,123` — objectives `obj_m6_5`/`obj_m6_6` `when`.
  - `narrative/missions/M6.json:148,171,1246` — `NARRATIVE_ENTITIES`-adjacent node conditions (`jacques_preso` ∧ `not jacques_dead`).
  - `narrative/missions/M6.json:200,1431` — node conditions `not jacques_dead` (post `m6_return_night`).
  - `narrative/missions/M6.json:1291` — invariant text only, not a condition (annotation that `m6_hospital` is exclusive with the same target).
  - `narrative/missions/M6.json:1315` — node condition.
  - `narrative/missions/M6.json:1538,1644` — `m6_atto4_bridge` and an M6-B8b optional node, `conditions: [{"flag":"jacques_dead"}, ...]`.
  - `js/narrative-engine-adapter.js:167` — hospital `piantone` entity `when: {all:[{flag:'jacques_preso'},{not:{flag:'jacques_dead'}}]}`.
  - `js/narrative-engine-adapter.js:174` — hospital `piantone_ronette` entity `when: {flag:'jacques_dead'}`.
  - Classic: no direct `flag:jacques_dead` reads in `js/data.js`/`js/glue.js`; classic layer reads the synced `jacques_morto` instead (`js/glue.js:100` `cond: 'flag:jacques_morto'`).

## gigante1

- WRITERS:
  - `js/data.js:689` — classic dialogue `gigante1_dlg` (triggered from `specchio315` interact cascade, `js/glue.js:100`), `setFlag: 'gigante1'`. Sole writer; no mission-layer node sets this flag.
- READERS:
  - `narrative/missions/M6.json:109,126` — objectives `obj_m6_5`/`obj_m6_6` `when` (`not gigante1`, `gigante1`).
  - `narrative/missions/M6.json:1627` — invariant text (annotation, not a live condition).
  - `js/data.js:811` — objective-text cascade `{ cond: 'flag:gigante1', text: 'Riferisci a Truman alla centrale.' }`.
  - `js/glue.js:99` — interact cascade `{ cond: 'flag:gigante1', then: 'specchio_dopo' }`.
  - `js/narrative-production.js:141` — `syncClassicToNarrative`: `gigante1` is in the array of classic flags mirrored into narrative state (`ensureFlag`) so `M6.json`'s `gigante1` conditions can see it — this is the classic→narrative sync line consumed by the M6 readers above.

## atto4

- WRITERS:
  - `narrative/missions/M8.json:11` — mission-level `flag: "atto4"` (declares/defines the flag entry for M8, schema header, not an effects write per se — see 351/744 for actual effect sites).
  - `narrative/missions/M8.json:351` — node effect `{"flag":"atto4"}`-style write (need node context: located inside an `effects` block near `m8_diner`/entry area).
  - `narrative/missions/M8.json:744` — second effect-site occurrence.
  - `narrative/missions/M6.json:130,1545,1617` — node `m6_atto4_bridge` (`M6.json:1533`) `effects: [..., {"flag":"atto4"}, ...]`, and `"set": "atto4"` at `M6.json:1617`. Invariant `M6.json:1627`: *"atto4 nasce solo dopo l'ultima pagina e apre M8 senza fallback legacy"* — a single logical writer (`m6_atto4_bridge`), M8's own `flag`/`351`/`744` lines are the mission's declared-value echoes of the same schema key, not a second independent trigger contradicting M6's stated sole-writer claim; both mission files reference the identical flag id.
  - `js/narrative-production.js:152` — sync out: `if (state.flags.atto4) classicFlags.atto4 = true;`.
  - `js/narrative-production.js:162` — derived sync out: `if (state.flags.atto4) classicFlags.narrative_m8_owned = true;` (see FLAGS section).
- READERS:
  - `narrative/missions/M9.json:25` — `entry_note` (annotation, not machine condition) referencing `atto4` as part of the M9 gate together with `node_done m8_station` and taxi testimony.
  - `js/data.js:810` — `{ cond: 'flag:atto4', text: 'Stasera: il Roadhouse.' }`.
  - `js/glue.js:50` — Sarah@palmer dialogue cascade `{ cond: 'flag:atto4', then: 'sarah_visione' }`.
  - `js/glue.js:69` — Log Lady@diner dialogue cascade `{ cond: 'flag:atto4', then: 'loglady_a4' }`.
  - `js/narrative-engine-adapter.js:231,241,255,260,269,274,279,284,289` — 9 `NARRATIVE_ENTITIES` `when` clauses gate diner Maddy/Leland and every roadhouse crowd NPC (`truman,bobby,donna,james,shelly,norma,loglady`) on `{flag:'atto4'}` combined with a second condition.

## narrative_m8_owned

- WRITERS:
  - `js/narrative-production.js:162` — `if (state.flags.atto4) classicFlags.narrative_m8_owned = true;` — only occurrence of a write anywhere in `js/` or `narrative/`.
- READERS: **none found.** `grep -rn "narrative_m8_owned" js/ narrative/` returns exactly one hit (the writer above) plus one prose mention in `narrative/schema-deltas/M8.md:321` (documentation, not code): *"`narrative_m8_owned` (gated su `atto4`, come `gigante2`)"*. No `cond:`/`flag:` check in `js/data.js` or `js/glue.js` references `narrative_m8_owned`, and no classic NPC table entry for Maddy or Leland exists under `palmer:` in `js/glue.js` (`NPCS.palmer` only contains `sarah`, `js/glue.js:47-51`) for this flag to plausibly gate. See FLAGS section.

## gigante2

- WRITERS:
  - `js/narrative-production.js:166` — `if (state.nodes_done.m8_roadhouse_truman) classicFlags.gigante2 = true;`. Comment at `narrative-production.js:163-165`: *"pass 01 (node split B1): il tavolo (Truman, dichiarazione del Gigante) e' ora m8_roadhouse_truman; il telefono e' un nodo separato (m8_roadhouse_phone) che NON deve pilotare gigante2."* This is the only place `gigante2` is ever assigned; it is purely classic-side, derived from mission `node_done` state, not written from within any mission JSON `effects` block (no `"gigante2"` string appears in any `narrative/missions/*.json`).
- READERS:
  - `js/data.js:809` — `{ cond: 'flag:gigante2', text: 'Parla con Sarah a casa Palmer; poi vai al lago.' }`.
  - `js/glue.js:16` — town `bobby` NPC `cond: ['!flag:gigante2']`.
  - `js/glue.js:23` — town `donna` NPC `cond: ['!flag:gigante2']`.
  - `js/glue.js:26` — town `jacoby` NPC `cond: ['!flag:gigante2']`.
  - `js/glue.js:49` — palmer `sarah` NPC `cond: ['!flag:gigante2']`.
  - `narrative/missions/M8.json:450` — invariant text (not a live condition) documents the derivation: *"gigante2 (sync classico) deriva da QUESTO nodo (node_done:m8_roadhouse_truman)"*.

## audrey_indaga

- WRITERS:
  - `js/data.js:442` — classic dialogue `audrey_a2` (hotel_gn), `setFlag: 'audrey_indaga'`.
  - `js/data.js:449` — classic dialogue `audrey_a2_ben`, `setFlag: 'audrey_indaga'`. (Two alternative dialogue entry points on the same NPC cascade at `hotel_gn`, not a cross-layer duplication — both are classic.)
- READERS:
  - `narrative/missions/M6.json:320` — node `m6_audrey` `conditions: [{"flag":"audrey_indaga"}, ...]`.
  - `narrative/missions/M6.json:352` — invariant text: *"solo con audrey_indaga; unico writer di audrey_vista_oej"*.
  - `js/narrative-engine-adapter.js:189` — `NARRATIVE_ENTITIES` Audrey@oej `when: {all:[{flag:'audrey_indaga'},{not:{flag:'audrey_vista_oej'}},{not:{flag:'jacques_preso'}}]}`.
  - `js/narrative-production.js:141` — `syncClassicToNarrative` mirrors `audrey_indaga` (classic→narrative), comment at lines 138-140 explains: *"senza questo ponte il nodo facoltativo m6_audrey resta irraggiungibile a runtime"*.

## audrey_vista_oej

- WRITERS:
  - `narrative/missions/M6.json:349` — node `m6_audrey`, `effects: [{"set":"audrey_vista_oej"}]`. Invariant `M6.json:352`: *"unico writer di audrey_vista_oej"*.
- READERS:
  - `narrative/missions/M6.json:327` — same node's own `conditions` block (`not audrey_vista_oej`, guards re-entry).
  - `narrative/missions/M6.json:1393` — conditional page `m6.b7b.night.audrey` (`condition: {"flag":"audrey_vista_oej"}`), Truman line about the ferry return.
  - `js/narrative-engine-adapter.js:189` — same `NARRATIVE_ENTITIES` Audrey@oej entry as above.
  - No classic reader found.

## promise_stance

- WRITERS:
  - `narrative/missions/M8.json:279,298,317` — node `m8_diner`, three mutually exclusive choice effects: `promise_accompagno → {"value":"promise_stance","to":"accompagno"}`, `promise_autonomia → to:"autonomia"`, `promise_prudenza → to:"prudenza"` (write-once, single node, three branches).
- READERS:
  - `narrative/missions/M8.json:110,176,201,217,342,355,396,637,666,679,692,705,1253` — objective `when`, node `conditions`, and `pages_by_value` entries keyed on `promise_stance` across M8.
  - `narrative/missions/M9.json:58,206` — `pages_by_value`/echo keyed on `promise_stance` (M9 reading M8's write-once value).
  - `js/narrative-engine-adapter.js:231` — diner Maddy entity `when: {all:[{flag:'atto4'},{not:{value_set:'promise_stance'}}]}`.
  - No classic (`js/data.js`/`js/glue.js`) reader found.

## warning_target

- WRITERS:
  - `narrative/missions/M8.json:536,570,597` — node `m8_roadhouse_phone`, three choice branches writing `{"value":"warning_target", ...}` (values referenced downstream: `palmer`, and others per `M9.json:395` conditional note). Also `M8.json:628` `value_set: "warning_target"` inside the same node's guard block.
- READERS:
  - `narrative/missions/M8.json:142,147,162,472,489,512,868,975,1539,1592` — objective text, guard conditions (`m8_focus_choice`, `m8_route_palmer`, `m8_station`), and invariants across M8.
  - `narrative/missions/M9.json:27,48,391,395` — mission note and `pages_by_value`/`conditional_note` reads in M9.
  - `js/narrative-engine-adapter.js:255,260,269,274,279,284,289` — the 7 roadhouse-crowd `NARRATIVE_ENTITIES` entries (`truman,bobby,donna,james,shelly,norma,loglady`), all `when: {all:[{flag:'atto4'},{not:{value_set:'warning_target'}}]}`.
  - `js/narrative-engine-adapter.js:297` — Gigante entity `when: {all:[{value_is:{name:'presagio_status',equals:'active'}},{not:{value_set:'warning_target'}}]}`.
  - No classic reader found.

## focus_destination

- WRITERS:
  - `narrative/missions/M8.json:901,911,921` — node `m8_focus_choice`, three branch effects `{"value":"focus_destination","to":"palmer"|"lago"|"diner"}` (exact `to` values not fully re-verified per branch beyond `palmer`/`lago`/`diner` node ids found — see next key).
- READERS:
  - `narrative/missions/M8.json:936,953,1023,1070,1523,1527,1546` — node conditions in `m8_route_palmer` (`M8.json` id at line 947), `m8_route_lake` (id at line 1018), `m8_route_diner` (id at line 1065), plus a `conditional_note` at `M8.json:1527` for a station-page keyed on `focus_destination`.
  - No M9 or classic reader found; `focus_destination` is consumed entirely inside M8.

## body_found_by

- WRITERS:
  - `narrative/missions/M8.json:959` — node `m8_route_palmer`, `effects: [{"value":"body_found_by","to":"hawk"}]`. Invariant `M8.json:1107` (on the diner branch) states *"body_found_by=hawk"*.
  - `narrative/missions/M8.json:1029` — node `m8_route_lake`, `effects: [{"value":"body_found_by","to":"cooper"}]`. Invariant `M8.json:1049`(-area) *"al lago Cooper è primo (cooper_primary)"*.
  - `narrative/missions/M8.json:1076` — node `m8_route_diner`, third branch effect (value presumed `hawk`, per the diner-branch invariant at `M8.json:1107`).
  - All three writers are guarded by `{"not":{"value_set":"body_found_by"}}` in their own `conditions`, i.e. a single logical write-once value with three mutually-exclusive trigger paths (by player's `focus_destination` choice), matching the documented pattern used for `promise_stance`/`warning_target`/`focus_destination`.
- READERS:
  - `narrative/missions/M8.json:1123,1132,1195,1219` — node `m8_discovery` conditions/derivation (`letter_o_observation_source` derived `from body_found_by`).
  - `js/narrative-engine-adapter.js:309` — lake `hawk_shore_first` entity `when: {all:[{value_is:{name:'body_found_by',equals:'hawk'}},{not:{flag:'maddy_trovata'}}]}`.
  - No classic reader found.

## maddy_trovata

- WRITERS:
  - `narrative/missions/M8.json:1210` — node `m8_discovery`, `effects: [..., {"set":"maddy_trovata"}, ...]`. Invariant `M8.json:1220`: *"maddy_trovata [P] unico writer"*.
  - `js/narrative-production.js:159` — sync out: `if (state.flags.maddy_trovata) classicFlags.maddy_trovata = true;` (same name kept, unlike `jacques_dead`/`jacques_morto`).
- READERS:
  - `narrative/missions/M8.json:49,69,91` — objectives `obj_m8_4`, `obj_m8_35`, `obj_m8_3` `when`.
  - `narrative/missions/M8.json:138,793,815` — node conditions `not maddy_trovata` combined with `presagio_status=active`.
  - `narrative/missions/M8.json:826,835` — conditional pages `m8.lucy.p04`/`p04b` (`condition: {"flag":"maddy_trovata"}`).
  - `narrative/missions/M8.json:1127` — `m8_discovery`'s own guard (`not maddy_trovata`, prevents re-entry).
  - `narrative/missions/M8.json:1237` — node `m8_promise_echo`, `conditions: [{"flag":"maddy_trovata"}, ...]`.
  - `js/narrative-engine-adapter.js:309` — lake `hawk_shore_first` entity (`not maddy_trovata`).
  - `js/narrative-engine-adapter.js:314` — lake `hawk_shore_after` entity `when: {all:[{flag:'maddy_trovata'},{not:{node_done:'m8_station'}}]}`.
  - Classic: `js/glue.js:104` — `lago_riva` interact cascade `{ cond: 'flag:maddy_trovata', then: 'lago_dopo' }`.
  - Classic: `js/data.js:808` — objective-text cascade `{ cond: 'flag:maddy_trovata', text: 'Riferisci a Truman alla centrale.' }`.

## T_LELAND_TAXI (evidence)

- WRITERS:
  - `narrative/missions/M8.json:718` — node `m8_leland_taxi` (diner map), `effects: [{"evidence":"T_LELAND_TAXI"}]`. Note text at `M8.json:128`: *"[N→L] rende obbligatoria la falsa storia del taxi ... dopo la promessa a Maddy, prima del Roadhouse e del presagio"*.
  - `js/narrative-production.js:147` — legacy-compat sync: `if (classicFlags.done_leland_dove) ensureEvidence(NR, state, 'T_LELAND_TAXI');`, explicitly scoped to old saves per the surrounding comment (`narrative-production.js:144-146`: *"Compatibilità salvataggi legacy: il vecchio dialogo classico vale come testimonianza ... M9 non la scrive mai"*).
- READERS:
  - `narrative/missions/M8.json:114,128,179,399,641,865` — objective `when`, node `conditions` (`m8_roadhouse_truman`, `m8_leland_waiting`-area at 641, `m8_focus_choice`).
  - `narrative/missions/M9.json:21,25,142,150,170,239,262,343,348,354,459` — entry `all[]` gate, `entry_note`, objective `when`, node `conditions` for `m9_verifica_taxi`/`m9_cmp_taxi`, and `attachment_required`/`by_support` lists for proposition `P6`.
  - `js/narrative-engine-adapter.js:241` — diner Leland entity `when: {all:[{flag:'atto4'},{not:{evidence:'T_LELAND_TAXI'}}]}`.
  - No classic (`js/data.js`/`js/glue.js`) reader found.

## presagio_status (typed value: `active`/`verified`)

- WRITERS:
  - `narrative/missions/M8.json:440` — node `m8_roadhouse_truman`, `effects: [..., {"value":"presagio_status","to":"active"}, ...]` (initial write). Invariant `M8.json:450`: *"presagio_status: active nasce QUI (write iniziale, mai entry-gate)"*.
  - `narrative/missions/M8.json:1204-1210` — node `m8_discovery`, `effects: [{"value_transition":{"name":"presagio_status","from":"active","to":"verified"}}, {"set":"maddy_trovata"}, ...]`.
- READERS:
  - `narrative/missions/M8.json:29,132,156,183,194,403,466,506,761,773,787,809,849,1204` — mission-level declaration, objective `when`, node conditions/`pages_by_value`, `m8_lucy` full-domain coverage (invariant `M8.json:849`).
  - `js/narrative-engine-adapter.js:297` — Gigante entity `when: {all:[{value_is:{name:'presagio_status',equals:'active'}},{not:{value_set:'warning_target'}}]}`.
  - No classic reader found.

## sarah_support_state

- WRITERS:
  - `narrative/missions/M8.json:544,578,605` — node `m8_roadhouse_phone`, three branch effects `{"value":"sarah_support_state", ...}` (same node that writes `warning_target`).
- READERS:
  - `narrative/missions/M8.json:1484,1505` — `pages_by_value` on the nominal states `[none, vice]`; note at `M8.json:1505`: *"M9/epilogo leggono sarah_support_state come stato nominale"*.
  - `narrative/missions/M9.json:39,419,423,431` — `pages_by_value` and `conditional_note` reads in M9 (`m9_present_truman`-area).
  - No classic reader, no adapter `NARRATIVE_ENTITIES`/`WORLD_TARGETS` reader found.

## letter_o_observation_source

- WRITERS:
  - `narrative/missions/M8.json:1193` — node `m8_discovery`, `effects: [..., {"value":"letter_o_observation_source", ...}, ...]`, resolved from `body_found_by` (`cooper_primary` if `body_found_by=cooper`, else `hawk_preserved`). `letter_o_source_note` at `M8.json:1219`: *"letter_o_observation_source è un EFFETTO derivato (from_derivation) del ritrovamento: unico writer eseguibile ... Mai adapter."*
- READERS:
  - `narrative/missions/M9.json:30,314,328` — mission note and `pages_by_value` entries in the `m9_present_truman`-area proposition logic (invariant `M9.json:560`: *"l'eco M8 (letter_o_observation_source / sarah_support_state / warning_target) cambia RIGHE, mai il gate"*).
  - No classic reader, no adapter reader found.

---

## FLAGS

### Multiple-writer check (requested keys)

- **east_route_confirmed** — single writer confirmed: `M5.json:1399` (node `m5_tracks_north`). Own invariant text (`M5.json:1408`, `1321`, `1450`) repeatedly asserts single-writer status and it holds under grep — no second `"set"`/`"value"` write site found anywhere else. The only other assignment is the narrative→classic mirror in `narrative-production.js:157`, which is a sync, not an independent source of truth.
- **gigante2** — single writer confirmed: `js/narrative-production.js:166` only. No mission JSON ever contains the string `"gigante2"` — it is a purely classic-side flag, derived deterministically from `state.nodes_done.m8_roadhouse_truman`.
- **maddy_trovata** — single writer confirmed: `M8.json:1210` (node `m8_discovery`), matching its own invariant (`M8.json:1220`: *"maddy_trovata [P] unico writer"*). Mirror write in `narrative-production.js:159` is a sync, not a second source.
- **narrative_m8_owned** — single writer confirmed: `js/narrative-production.js:162` only. (See "Dead writes" below — the issue with this key is not multiplicity but that nothing reads it.)

No key in the requested set has more than one independent writer. `body_found_by`, `promise_stance`, `warning_target`, `focus_destination`, and `sarah_support_state` each have 2-3 *branch* writers inside a single node, all mutually exclusive and guarded by `{"not":{"value_set": <self>}}` — a documented write-once-with-branches pattern, not a multiple-writer defect.

### Dead writes (written, never read as a condition)

- **narrative_m8_owned** — written at `js/narrative-production.js:162` into `classicFlags.narrative_m8_owned`. `grep -rn "narrative_m8_owned" js/ narrative/` finds no `cond:`/`flag:` consumer anywhere in `js/data.js`, `js/glue.js`, `js/engine.js`, or any mission JSON — only the writer line itself and a prose mention in `narrative/schema-deltas/M8.md:321`. The comment directly above the write (`narrative-production.js:160-161`) states the intent — *"M8 narrativa possiede Maddy e Leland: i duplicati classici a Palmer restano nascosti"* — but no classic NPC table entry for Maddy or Leland exists under `palmer:` in `NPCS` (`js/glue.js:47-51`, which lists only `sarah`) for any such flag to hide. The stated duplicate does not exist in `js/glue.js` as written, and the flag that would gate it is never checked anywhere.

### Reads with no writer (in this key set)

None found. Every key in the 17-key list that is read somewhere also has an identifiable writer.

### Classic+mission duplicate ownership (co-presence, not state duplication)

- **Roadhouse crowd vs diner classic NPCs during the `atto4 ∧ ¬warning_target` window.** `js/narrative-engine-adapter.js:268-291` injects `james`, `shelly`, `norma`, `loglady` as physical NPCs at `roadhouse` whenever `{flag:'atto4', not:{value_set:'warning_target'}}` holds. In parallel, the classic `NPCS.diner` table (`js/glue.js:62-70`) places `shelly` (no `cond` gate at all), `loglady` (no `cond` gate — only its *dialogue* varies with `flag:atto4`), and `james` (`cond: 'flag:sogno_fatto'`, already true by act 4) permanently at `diner` with no gate that removes them once `atto4` is set. Since `atto4` becomes true well before `warning_target` is written (`warning_target` is only set later, at `m8_roadhouse_phone`), these three characters are simultaneously reachable as live NPCs in both `diner` and `roadhouse` for the entire early-`atto4` window. `bobby`/`donna` in `js/glue.js:15-24` (town) do carry an explicit `cond: ['!flag:gigante2']` gate that would eventually hide them, but `gigante2` is set later than `atto4` (`m8_roadhouse_truman` node_done), so the same co-presence window applies to them versus their `roadhouse` narrative counterparts (`js/narrative-engine-adapter.js:265,270`) before `gigante2` flips.

### Sync-direction check (`js/narrative-production.js` / `js/narrative-engine-adapter.js`)

For each of the 17 keys, cross-checked whether it is read by the layer opposite to where it is written, and if so whether a sync line exists:

| key | written in | read in opposite layer | sync present |
|---|---|---|---|
| east_route_confirmed | narrative (M5) | classic (`js/maps.js:375` door `needsFlag`) | yes — `narrative-production.js:157` |
| jacques_dead | narrative (M6) | classic reads `jacques_morto` (renamed), not `jacques_dead` directly | yes — `narrative-production.js:158` (renaming sync) |
| gigante1 | classic (`data.js:689`) | narrative (`M6.json` objectives) | yes — `narrative-production.js:141` |
| atto4 | narrative (M6 `m6_atto4_bridge`) | classic (`data.js:810`, `glue.js:50,69`) | yes — `narrative-production.js:152` |
| narrative_m8_owned | derived-in-narrative-production | nowhere | n/a — see "Dead writes" |
| gigante2 | classic-derived (`narrative-production.js:166`) | classic (`data.js:809`, `glue.js:16,23,26,49`) | same-layer, no cross-sync needed |
| audrey_indaga | classic (`data.js:442,449`) | narrative (`M6.json:320`, adapter `:189`) | yes — `narrative-production.js:141` |
| audrey_vista_oej | narrative (M6) | narrative only | n/a |
| promise_stance | narrative (M8) | narrative only (adapter, M8/M9) | n/a |
| warning_target | narrative (M8) | narrative only (adapter, M8/M9) | n/a |
| focus_destination | narrative (M8) | narrative only (M8) | n/a |
| body_found_by | narrative (M8) | narrative only (M8, adapter) | n/a |
| maddy_trovata | narrative (M8) | classic (`glue.js:104`, `data.js:808`) | yes — `narrative-production.js:159` |
| T_LELAND_TAXI | narrative (M8) | narrative only (M8/M9, adapter) | n/a |
| presagio_status | narrative (M8) | narrative only (M8, adapter) | n/a |
| sarah_support_state | narrative (M8) | narrative only (M8/M9) | n/a |
| letter_o_observation_source | narrative (M8) | narrative only (M9) | n/a |

No sync-direction gap found among the 17 keys: every key that is legitimately read across the classic/narrative boundary has a corresponding line in `syncClassicToNarrative` or `syncNarrativeToClassic`.

### WORLD_TARGETS coordinate/tile check

Checked every `js/narrative-engine-adapter.js` `WORLD_TARGETS` coordinate against `js/maps.js` grid + `M.SOLID` table (script run via Node against the actual map module):

| map | target | x,y | tile char | solid? | note |
|---|---|---|---|---|---|
| traincar | bridge_rail | 4,6 | `w` | **true** | See discrepancy below. |
| traincar | sign_oej | 20,2 | `S` | true | Matches classic `interact['20,2']='sign_oej'` (`js/maps.js:379`); sign-type targets are faced, not stood on — consistent pattern. |
| traincar | mound | 13,6 | `f` | false | Matches classic `interact['13,6']='mucchio_terra'`. |
| traincar | ring | 13,5 | `f` | false | Matches classic `interact['13,5']='anello_interact'`. |
| traincar | scene_center | 12,5 | `f` | false | |
| traincar | traincar_entrance | 13,7 | `D` | false (door) | |
| traincar | stove | 12,3 | `i` | true | Matches "interno, lamiera piegata" wall-mounted-object pattern (row-3 comment places "stufa 12,3"), same face-not-stand pattern as sign_oej. |
| traincar | cards | 10,6 | `f` | false | |
| traincar | tracks_north | 21,2 | `p` | false | Matches classic `interact['4,6']='sign_ponte'` is a *different* coordinate — no overlap here. |
| hospital | night_register | 13,8 | `T` | true | `T` here represents the nurse counter/furniture per the map's own header comment (`js/maps.js:242`, "bancone infermiera ... registro 13,8"), consistent with the face-not-stand pattern. |
| roadhouse | roadhouse_phone | 8,5 | `f` | false | |
| town | town_crossroads | 47,30 | `p` | false | |
| town | lago_maddy | 15,28 | `F` | true | Matches classic `interact['15,28']='lago_riva'` exactly — documented shared target (see below). |
| palmer | palmer_entrance | 8,10 | `f` | false | |

**Discrepancy: `traincar.bridge_rail` (x:4, y:6) lands on tile `w`** (torrente/water, solid per the map legend at `js/maps.js` header and `M.SOLID`), while the adapter's own inline comment at `js/narrative-engine-adapter.js:73-75` describes it as *"il parapetto est del ponte, sopra le assi"* (the east parapet of the bridge, over the planks). The bridge planks (`b`) are on row `y=7` (`js/maps.js:367`, `'pppbbprrriiiiDDiiigggpgT'`, chars at x=3,4 = `b`), not row `y=6` (`js/maps.js:366`, water row). The stated coordinate (y=6) does not match the tile type its own comment describes (a parapet over planks), and the actual tile at y=6,x=4 is water.

### Stale/overlapping classic interact vs mission-owned coordinates

- `js/maps.js:377-382` (`traincar.interact`) defines `'4,6':'sign_ponte'`, `'20,2':'sign_oej'`, `'13,6':'mucchio_terra'`, `'13,5':'anello_interact'` — all four coordinates are also claimed by `js/narrative-engine-adapter.js` `WORLD_TARGETS.traincar` (`bridge_rail`, `sign_oej`, `mound`, `ring` respectively, `js/narrative-engine-adapter.js:76-79`). `js/engine.js:760-761` calls `GAME.NarrativeAdapter.tryInteractAt` before falling through to the classic interact resolution, so the classic dialogues (`js/data.js:624,629,634,647`: `sign_ponte`, `sign_oej`, `mucchio_terra`, `anello_interact`) are shadowed at these four tiles whenever the mission's `tryInteractAt` claims them (i.e., while M5 is entered/current and the corresponding narrative node's `conditions` are met); the classic dialogues remain reachable only before/after the mission owns that tile.
- `js/maps.js:124` (`town.interact`) defines `'15,28':'lago_riva'`, identical to `js/narrative-engine-adapter.js:112` `WORLD_TARGETS.town.lago_maddy` (15,28). This overlap is explicitly documented in the adapter's own comment (`js/narrative-engine-adapter.js:95-97`): *"lago_maddy [P] town 15,28 dal repository (coincide col tile classico lago_riva: target CONDIVISO, la missione corrente vince latest-first, altrimenti il classico risponde)."*

---

## Map-id reference check

Distinct map ids referenced by `WORLD_TARGETS` top-level keys, `NARRATIVE_ENTITIES[].map_id`, and mission node `map_id` fields across `narrative/missions/*.json`:

`sheriff`, `hospital`, `diner`, `traincar`, `oej`, `palmer`, `town`, `roadhouse`

Definitions found in `js/maps.js` (each confirmed present with `grep -n "id: '<id>'" js/maps.js`):

- `traincar` — `js/maps.js:350`
- `oej` — `js/maps.js:386`
- `roadhouse` — `js/maps.js:410`
- `hospital` — `js/maps.js:237`
- `diner` — `js/maps.js:266`
- `palmer` — `js/maps.js:167`
- `town` — `js/maps.js:56`
- `sheriff` — `js/maps.js:146`

All 8 referenced map ids exist as defined maps in `js/maps.js`. No dangling map-id reference found.
