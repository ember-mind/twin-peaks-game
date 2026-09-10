# Act 4 (M8) Forensic Audit

READ-ONLY audit. All facts below are quoted/sourced directly from repo files as of this
session. File:line references point at `narrative/missions/M8.json` unless noted otherwise.

---

## 1. NODE STRUCTURE

`narrative/missions/M8.json` declares `"node_count": {"runtime_total": 16}` (M8.json:1604) and
the `nodes` array contains exactly 16 entries. Order in file: `m8_diner`, `m8_leland_waiting`,
`m8_roadhouse_truman`, `m8_giant_stage`, `m8_roadhouse_phone`, `m8_leland_taxi`, `m8_lucy`,
`m8_focus_choice`, `m8_route_palmer`, `m8_route_lake`, `m8_route_diner`, `m8_discovery`,
`m8_promise_echo`, `m8_cmp_letters`, `m8_cmp_diary`, `m8_station`.

**Expected-node check**: every expected id from the task is present, with one naming
mismatch: the task names an expected node `m8_echo`; the actual id in the file is
`m8_promise_echo` (M8.json:1232). The three "exclusive route nodes" are
`m8_route_palmer` (M8.json:947), `m8_route_lake` (M8.json:1017), `m8_route_diner`
(M8.json:1064) — mutually exclusive via `focus_destination` value match + `not value_set
body_found_by` guard, each writing `body_found_by`. No node present in the file is outside
the expected set (accounting for the `m8_echo`/`m8_promise_echo` naming variance) — no
extras.

Per-node detail:

### m8_diner (M8.json:210-344)
- channel `world`, `map_id: "diner"`, `target_kind: "actor"`, `target_id: "maddy"`, `actor_id: "maddy"`.
- conditions: `[{"not":{"value_set":"promise_stance"}}]` (M8.json:214-220).
- 8 pages (M8.json:221-272), 3 choices (`promise_accompagno`, `promise_autonomia`,
  `promise_prudenza`, M8.json:273-330), each writes `value: promise_stance` to
  `accompagno`/`autonomia`/`prudenza` respectively.
- no `repeat` block.
- `completion_when: {"value_set":"promise_stance"}` (M8.json:341-343). `kind: "choice"`.

### m8_leland_waiting (M8.json:346-389)
- channel `world`, `map_id: "diner"`, actor `leland`.
- conditions: `flag:atto4` AND `not value_set:promise_stance` (M8.json:349-357).
- 2 pages (M8.json:359-372), `effects: []` (M8.json:373).
- HAS a `repeat` block (`m8.repeat.leland_waiting`, M8.json:374-380).
- No `completion_when`/`next` pointer; `kind: "dialogue"`.

### m8_roadhouse_truman (M8.json:391-458)
- channel `world`, `map_id: "roadhouse"`, actor `truman`.
- conditions: `value_set:promise_stance` AND `evidence:T_LELAND_TAXI` AND
  `not value_set:presagio_status` (M8.json:394-406).
- 5 pages (M8.json:407-437). Effects: `value presagio_status -> active` and a notebook entry
  `m8.note.presagio` (M8.json:438-449).
- No `repeat` block.
- No `completion_when`; invariant text states "gigante2 (sync classico) deriva da QUESTO nodo
  (node_done:m8_roadhouse_truman)" (M8.json:450).

### m8_giant_stage (M8.json:460-497)
- channel `world`, `map_id: "roadhouse"`, actor `gigante`.
- conditions: `presagio_status == active` AND `not value_set:warning_target`
  (M8.json:463-475).
- 1 page (M8.json:476-482), `effects: []`.
- HAS a `repeat` block (M8.json:484-488, identical action text).
- No `completion_when`. `kind: "dialogue"`.

### m8_roadhouse_phone (M8.json:499-630)
- channel `world`, `map_id: "roadhouse"`, `target_kind: "object"`, `target_id:
  "roadhouse_phone"`.
- conditions: `presagio_status == active` AND `not value_set:warning_target`
  (M8.json:503-515).
- 2 pages, 3 choices (`warning_palmer`, `warning_centrale`, `warning_nessuno`,
  M8.json:530-616), each writes `warning_target` plus `maddy_action_after_warning` and
  `sarah_support_state`.
- no `repeat` block (has `effects: []` at node level, M8.json:618).
- `completion_when: {"value_set":"warning_target"}` (M8.json:627-629). `kind: "choice"`.

### m8_leland_taxi (M8.json:632-737)
- channel `world`, `map_id: "diner"`, actor `leland`, `mandatory_beat: true`.
- conditions: `value_set:promise_stance` AND `not evidence:T_LELAND_TAXI`
  (M8.json:635-644).
- 7 pages incl. 3 promise-stance-conditioned variants (M8.json:645-714).
- effects: `evidence: T_LELAND_TAXI` (M8.json:716-720).
- HAS a `repeat` block (`m8.repeat.leland_taxi`, M8.json:721-727).
- No `completion_when`/`next`; `kind: "dialogue"`.

### m8_lucy (M8.json:739-857)
- channel `world`, `map_id: "sheriff"`, actor `lucy`.
- conditions: `flag:atto4` AND `not node_done:m8_station` (M8.json:742-751).
- 7 conditional pages (M8.json:752-838) covering the
  `presagio_status × maddy_trovata` domain; `effect_policy: "always"` (M8.json:841).
- HAS a `repeat` block (M8.json:842-848).
- No `completion_when`; `kind: "dialogue"`.

### m8_focus_choice (M8.json:859-945)
- channel `world`, `map_id: "town"`, `target_kind: "landmark"`, `target_id:
  "town_crossroads"`.
- conditions: `evidence:T_LELAND_TAXI` AND `value_set:warning_target` AND
  `not value_set:focus_destination` (M8.json:863-875).
- 3 pages, 3 choices (`focus_palmer`, `focus_lago`, `focus_diner`, M8.json:895-926), each
  writes `focus_destination`.
- HAS a `repeat` block (M8.json:938-944).
- `completion_when: {"value_set":"focus_destination"}` (M8.json:935-937). `kind: "choice"`.

### m8_route_palmer (M8.json:947-1015)
- channel `world`, `map_id: "palmer"`, `target_kind: "landmark"`, `target_id:
  "palmer_entrance"`, `mandatory_beat: true`.
- conditions: `focus_destination == palmer` AND `not value_set:body_found_by`
  (M8.json:950-962).
- 5 pages (one conditional on `warning_target == palmer`, M8.json:970-980). Effects:
  `body_found_by -> hawk` (M8.json:1001-1006).
- No `repeat`; no `completion_when`.

### m8_route_lake (M8.json:1017-1062)
- channel `world`, `map_id: "town"`, `target_kind: "landmark"`, `target_id: "lago_maddy"`,
  `mandatory_beat: true`.
- conditions: `focus_destination == lago` AND `not value_set:body_found_by`
  (M8.json:1020-1032).
- 2 pages. Effects: `body_found_by -> cooper` (M8.json:1047-1052).
- No `repeat`; no `completion_when`. `provenance_note: "[P] lago_maddy (town 15,28) dal
  repository"` (M8.json:1061).

### m8_route_diner (M8.json:1064-1116)
- channel `world`, `map_id: "diner"`, actor `norma`, `mandatory_beat: true`.
- conditions: `focus_destination == diner` AND `not value_set:body_found_by`
  (M8.json:1067-1079).
- 3 pages. Effects: `body_found_by -> hawk` (M8.json:1101-1106).
- No `repeat`; no `completion_when`.

### m8_discovery (M8.json:1118-1230)
- channel `world`, `map_id: "town"`, `target_kind: "landmark"`, `target_id: "lago_maddy"`,
  `mandatory_beat: true`.
- conditions: `value_set:body_found_by` AND `not flag:maddy_trovata` (M8.json:1121-1130).
- `pages_by_value` branching on `body_found_by` (`cooper` 4 pages, `hawk` 3 pages,
  M8.json:1131-1180).
- effects: `evidence E9A_LETTERA_O`, `evidence E9B_STESSO_METODO`, `value letter_o_chain ->
  standard`, `value letter_o_observation_source` (derived from `body_found_by`),
  `value_transition presagio_status active->verified`, `set maddy_trovata`, notebook entry
  (M8.json:1181-1218).
- No `repeat`; has `next: "m8_promise_echo"` (M8.json:1227) — mandatory follow-on pointer.

### m8_promise_echo (this is the node the task calls "m8_echo") (M8.json:1232-1307)
- channel `world`, `map_id: "town"`, `target_kind: "landmark"`, `target_id: "lago_maddy"`,
  `mandatory_beat: true`.
- conditions: `flag:maddy_trovata` AND `not node_done:m8_promise_echo` (M8.json:1235-1244).
- 1 intro page + `pages_by_value` on `promise_stance` (3 branches) + `pages_after_branch` (2
  pages) (M8.json:1245-1297).
- `effects: []` (M8.json:1298).
- No `repeat`; no `completion_when`/`next`.

### m8_cmp_letters (M8.json:1309-1353)
- channel `notebook`, `kind: "comparison"`, no `map_id`.
- conditions: `evidence:E9A_LETTERA_O` AND `evidence:E3_LETTERA_R` AND
  `node_done:m8_promise_echo` (M8.json:1312-1322).
- 1 page. effects: `notebook_observation` (M8.json:1331-1338).
- No `repeat`. `comparison_completion: "node_commit"`, `result: "LETTERS_SAME_METHOD"`
  (M8.json:1343-1344). Has `completed_recall` (not a repeat block).

### m8_cmp_diary (M8.json:1355-1472)
- channel `notebook`, `kind: "comparison"`.
- conditions: `evidence:E9A_LETTERA_O` AND `evidence:E1_DIARIO` AND
  `node_done:m8_promise_echo` AND `node_done:m8_cmp_letters` (M8.json:1359-1372).
- 4 pages, 3 choices (`diary_a` result `PROGRESSIVE_SIGNATURE` writes `proposition P8 ->
  formulated`; `diary_b`/`diary_c` are `retry: true` dead ends, M8.json:1398-1449).
- No `repeat`. `completion_when: {"proposition_path":"P8.formulation.status","equals":
  "formulated"}` (M8.json:1460-1463). Has `completed_recall`.

### m8_station (M8.json:1474-1601)
- channel `world`, `map_id: "sheriff"`, actor `truman`, `mandatory_beat: true`.
- conditions: `proposition_path P8.formulation.status == formulated` (M8.json:1477-1482).
- `pages_by_value` on `sarah_support_state` (`vice`/`none`, M8.json:1483-1505) + 1 intro page
  + `pages_after_branch` (6 pages incl. two conditional "hook" pages, M8.json:1507-1583).
- `effects: []` (M8.json:1584).
- HAS a `repeat` block (`m8.repeat.station`, M8.json:1585-1591).
- No node-level `completion_when`, but mission-level `completion.when.node_done ==
  "m8_station"` (M8.json:36-41).

---

## (a) Maddy diner pages / Leland taxi claim / Leland visibility

- Coach-schedule content IS present, verbatim: "La 7:40 prende la coincidenza a Spokane.
  Passa alla fermata del lago — quella delle 11 no, ma parte a orario." (M8.json:232) and
  "Torno al centralino della biblioteca. Mi tengono il posto fino a lunedì — l'ho fatto
  promettere per iscritto." (M8.json:246).
- `grep -n "torta" narrative/missions/M8.json` returns **zero hits** — no "torta" (pie) text
  anywhere in M8.json.
- Leland's taxi claim says "sette": "Ho chiamato la Twin Peaks Taxi: passa da casa alle
  sette." (M8.json:656). Additional "sette" occurrences at M8.json:663, 689, 702, 726.
- Leland visibility: `js/narrative-engine-adapter.js:239-243` — the diner `leland` entity's
  `when` is:
  ```
  when: { all: [{ flag: 'atto4' }, { not: { evidence: 'T_LELAND_TAXI' } }] }
  ```
  This gates ONLY on `atto4` and the absence of `T_LELAND_TAXI` evidence — it does **not**
  depend on `promise_stance`. So Leland is visible at the diner from the start of Act 4,
  i.e. before the taxi promise/claim is made (the m8_leland_waiting node, whose own
  condition is `not value_set:promise_stance`, occupies the pre-promise sub-window; both
  windows are subsets of the same `when`).

---

## (b) Sarah

`js/data.js:694-702` — dialogue key is `sarah_visione` (exact grep match; no
`sarea_visione` key exists), full pages verbatim:
```
694:    sarah_visione: {
695:      pages: [
696:        { name: 'SARAH', text: 'Il divano era vuoto. Poi c\'era un uomo accovacciato, come se aspettasse che lo guardassi.' },
697:        { name: 'SARAH', text: 'Capelli grigi. Lo stesso sorriso che vedo quando chiudo gli occhi.' },
698:        { name: 'SARAH', text: 'Ha un nome, so che ce l\'ha. Mi arriva fino ai denti e poi—' },
699:        { name: 'COOPER', text: 'Signora Palmer, descriva ancora il sorriso. Questa volta io scrivo e lei non deve difendersi.' }
700:      ],
701:      setFlag: 'sarah_visione_ascoltata'
702:    },
```
`grep -n "BOB" js/data.js` shows BOB tokens only at lines 277-278, 280 (`BOBBY`), 426, 428,
462, 524-525, 737-740, 764, 781-783, 789 — none inside the `sarah_visione` block
(694-702). Confirmed: **no "BOB" token in Sarah's Act-4 vision dialogue.**

`js/glue.js:47-51` — palmer map's `sarah` NPC entry:
```
47:    palmer: [
48:      { id: 'sarah',  x: 9,  y: 7, sprite: 'sarah',  name: 'Sarah',
49:        cond: ['!flag:gigante2'],
50:        dialogue: [{ cond: 'flag:atto4', then: 'sarah_visione' }, 'sarah'], dir: 'down' }
51:    ],
```
The `cond` field is `['!flag:gigante2']` — the classic Sarah NPC entry is gated OFF once the
classic `gigante2` flag is set. `m8_roadhouse_truman`'s invariant text
(M8.json:450) states `gigante2` is synced from `node_done:m8_roadhouse_truman`. This means
the classic Sarah NPC (and thus the `sarah_visione` dialogue) becomes unreachable via
`js/glue.js` once the player has passed the Roadhouse beat, since `gigante2` flips to true
at that point. No narrative-engine-adapter entity for `sarah` was found in
`js/narrative-engine-adapter.js` (grep below in section c) — Sarah is not in
`NARRATIVE_ENTITIES`.

---

## (c) Roadhouse

`js/narrative-engine-adapter.js:101-103` — `WORLD_TARGETS.roadhouse`:
```
101:    roadhouse: {
102:      roadhouse_phone: { x: 8, y: 5, kind: 'object' }
103:    },
```

`NARRATIVE_ENTITIES` roadhouse entries (`js/narrative-engine-adapter.js:253-299`):
- `truman`: `when: { all: [{ flag: 'atto4' }, { not: { value_set: 'warning_target' } }] }`,
  coords `x:4, y:8` (lines 253-257).
- `bobby`: same `when`, coords `x:3, y:4` (258-266) — comment notes a fix from a real
  playthrough: "Playthrough RUN 1 (2026-09-10): a crowd on row 2 walled off the stage
  corridor (8,2 unreachable, the Giant unfaceable)." (line 261-264).
- `donna`: same `when`, coords `x:5, y:4` (267-271).
- `james`: same `when`, coords `x:2, y:4` (272-276).
- `shelly`: same `when`, coords `x:3, y:6` (277-281).
- `norma`: same `when`, coords `x:5, y:6` (282-286).
- `loglady`: same `when`, coords `x:2, y:6` (287-291).
- `gigante`: `when: { all: [{ value_is: { name: 'presagio_status', equals: 'active' } }, {
  not: { value_set: 'warning_target' } }] }`, coords `x:8, y:1`, sprite `'giant'` (295-299).

`grep -n 'gigante' js/glue.js` hits: lines 16, 23, 26, 49 (all `cond: ['!flag:gigante2']` —
gating unrelated classic NPCs OFF once gigante2 fires), and lines 99-100 (the
`specchio315` interact cascade: `{cond:'flag:gigante1', then:'specchio_dopo'}`,
`{cond:'flag:jacques_morto', then:'gigante1_dlg'}` — this is the Act-1/pre-Act-4 mirror
Giant, not Act 4). **There is no classic Giant/gigante NPC entry anywhere in
`js/glue.js`'s `NPCS` table** — `grep -n -i 'giant' js/glue.js` returns zero hits, and no
`{id:'gigante', ...}` object exists in the `NPCS` table shown at `js/glue.js:13-87`.

`grep -n -i 'gigante' js/data.js` hits: line 672 (comment), 679 (`gigante1_dlg` key — Act
1/pre-4 mirror vision), 682-686 (Giant's three warnings — Act 1 content, not Act 4), 689
(`setFlag: 'gigante1'`), 692 (comment "Atto 4: il gigante e la cugina"), 809 ("cond:
flag:gigante2" in `D.objectives`), 811 ("cond: flag:gigante1"). `grep -n -i 'giant'
js/data.js` returns zero hits (no English "giant" string; only Italian "gigante").
Conclusion: the classic layer's only Giant NPC/dialogue is `gigante1_dlg` (Act 1's mirror
apparition); Act 4's Giant appearance at the Roadhouse exists ONLY via the mission-layer
`m8_giant_stage` node + adapter `NARRATIVE_ENTITIES` entry — there is no classic-layer
duplicate.

`m8_giant_stage` conditions relative to `presagio_status`/`warning_target`
(M8.json:463-475): `value_is presagio_status == active` AND `not value_set:warning_target` —
identical window to the adapter's `gigante` entity `when` above. `m8_roadhouse_phone`
conditions (M8.json:503-515) are the SAME window (`presagio_status == active` AND `not
value_set:warning_target`) — both nodes are live simultaneously until a warning choice is
made, which is consistent with the adapter comment on the `gigante` entity.

---

## (d) Threshold/crossroads

`js/narrative-engine-adapter.js:111` — `WORLD_TARGETS.town.town_crossroads`:
```
111:      town_crossroads: { x: 47, y: 30, kind: 'landmark' },
```
(Comment at lines 104-110 explains 47,30 is one step from the Roadhouse-return spawn
47,29/dir down, and that the classic sign at 30,30 is freed for the rest of the act.)

`m8_focus_choice` choices (M8.json:895-926) and their route targets:
- `focus_palmer` → writes `focus_destination: "palmer"` → leads to `m8_route_palmer`
  (condition `focus_destination == palmer`, M8.json:950-956; effect `body_found_by ->
  hawk`, M8.json:1001-1006).
- `focus_lago` → writes `focus_destination: "lago"` → leads to `m8_route_lake` (condition
  `focus_destination == lago`, M8.json:1020-1026; effect `body_found_by -> cooper`,
  M8.json:1047-1052).
- `focus_diner` → writes `focus_destination: "diner"` → leads to `m8_route_diner`
  (condition `focus_destination == diner`, M8.json:1067-1073; effect `body_found_by ->
  hawk`, M8.json:1101-1106).

All three route nodes additionally guard `not value_set:body_found_by` — mutually
exclusive on first-write of `body_found_by`.

---

## (e) Shore

`js/narrative-engine-adapter.js:307-316` — `hawk_shore_*` entities:
```
307:    {
308:      map_id: 'town',
309:      when: { all: [{ value_is: { name: 'body_found_by', equals: 'hawk' } }, { not: { flag: 'maddy_trovata' } }] },
310:      npc: { id: 'hawk_shore_first', x: 16, y: 27, sprite: 'hawk', name: 'Hawk', dialogue: null, dir: 'down' }
311:    },
312:    {
313:      map_id: 'town',
314:      when: { all: [{ flag: 'maddy_trovata' }, { not: { node_done: 'm8_station' } }] },
315:      npc: { id: 'hawk_shore_after', x: 16, y: 27, sprite: 'hawk', name: 'Hawk', dialogue: null, dir: 'down' }
316:    }
```
Both are `dialogue: null` (scenography only; no narrative node targets these NPCs
directly).

`m8_discovery` uses `pages_by_value` keyed on `body_found_by` with two cases, `cooper` (4
pages) and `hawk` (3 pages) (M8.json:1131-1180) — this is the version/branch selection the
task asks about; `hawk_shore_first`'s `when` (`body_found_by == hawk`) matches exactly the
`hawk` branch of `m8_discovery`, and `hawk_shore_after`'s `when` (`maddy_trovata` set, not
yet `m8_station`) covers the post-discovery scene regardless of which branch fired.

Classic layer: `js/maps.js:124` — town map `interact` entry:
```
124:      interact: { '30,30': 'cartello', '15,28': 'lago_riva', '50,22': 'tomba_laura' },
```
confirms the `lago_riva` cascade key at coordinate `15,28`. In `js/glue.js:103-107`:
```
103:    lago_riva: [
104:      { cond: 'flag:maddy_trovata', then: 'lago_dopo' },
105:      { cond: 'flag:sogno_fatto', then: 'lago_sguardo' },
106:      'lago_laura'
107:    ],
```
`grep -rn "lago_maddy" js narrative test` (repo-wide) shows the string `lago_maddy` survives
ONLY as a **landmark/target id** (a coordinate-identity string, not a dialogue key): it
appears in `js/narrative-engine-adapter.js:95,112,305` (WORLD_TARGETS entry + comments),
`narrative/missions/M8.json:1058,1225,1304` (`target_id` on `m8_route_lake`, `m8_discovery`,
`m8_promise_echo`), `js/narrative-data.gen.js` (generated mirror of the JSON), several
`narrative/schema-deltas/*.md` docs, and multiple test files (`test/act-4-mirror-gate.js:118`
lists it inside a `RETIRED_DIALOGUES` array, `test/narrative-slice-01.js:95` explicitly notes
"lago_riva non risolve più a lago_maddy con gigante2 (branch ritirato...)", `test/smoke.js:415`
notes "classic lago_maddy retired, was shadowed in production"). **No `js/data.js` dialogue
key named `lago_maddy` exists** — it was retired from the classic layer and now exists only
as the shared coordinate/landmark id (15,28) used by both the classic `lago_riva` interact
cascade and the mission-layer `WORLD_TARGETS`/node `target_id` fields.

---

## (f) Station

`m8_station`'s `pages_after_branch` (M8.json:1514-1583), 6 pages, ids in order:
`m8.f.station.p_lago` (conditional, `focus_destination == lago`), `m8.f.station.p_valigia`
(conditional, `warning_target == palmer` AND `focus_destination != palmer`),
`m8.f.station.p02`, `m8.f.station.p03`, and the two "hook" pages
`m8.f.station.hook.p01`/`m8.f.station.hook.p02`. Verbatim hook text:
```
1570-1574: { "id": "m8.f.station.hook.p01", speaker_id: "cooper",
  "text": "E un orario. Ieri al diner Leland ha detto di aver chiamato la Twin Peaks Taxi per le sette, da casa. L'ho scritto io, alla luce del giorno." }
1577-1581: { "id": "m8.f.station.hook.p02", speaker_id: "truman",
  "text": "Allora abbiamo un'ora. Prima delle sette, Lucy chiama la compagnia: una corsa prenotata, o niente." }
```

`grep -noE "\b(bugia|mentito|mente)\b" narrative/missions/M8.json` returns **zero
standalone-word hits** (case-sensitive). A non-word-boundary `grep -no "ment[a-z]*"` does
match substrings embedded in unrelated words (e.g. "fisicamente", "momento", "mentre",
"menti" inside "provenienti"/"movimenti"-type words, "compatibilità"-adjacent text) but none
of these are the standalone tokens "bugia"/"mentito"/"mente". Confirmed: no lie-language
tokens.

`narrative/missions/M9.json` first node in the `nodes` array is `m9_verifica_taxi`
(beat B1, `narrative/missions/M9.json` — node object starts immediately after
`entry_condition`). Its condition:
```
"conditions": [
  { "evidence": "T_LELAND_TAXI" },
  { "not": { "evidence": "D_TAXI" } }
]
```
It targets `map_id: "sheriff"`, actor `lucy`, and its effect writes `evidence: D_TAXI`. The
node's page text: "Prima del ritrovamento, Leland ha detto: «Ho chiamato la Twin Peaks Taxi:
passa da casa alle sette.» Quella corsa era prenotata?" — followed by Lucy's verification
reply: "Ho chiamato la Twin Peaks Taxi. Nessuna corsa per casa Palmer alle sette. Nessuna
prenotazione di Leland, né oggi né per domattina." This is the taxi-verification node/
objective referenced by the audit request.

M9's mission-level `entry_condition`:
```
{ "all": [ { "flag": "atto4" }, { "node_done": "m8_station" }, { "evidence": "T_LELAND_TAXI" } ] }
```

---

## (g) Classic cleanup

`grep -n` across `js/data.js` and `js/glue.js` for each token — all return **zero hits**
(confirmed clean):
- `truman_atto4` — 0 hits
- `truman_atto5` — 0 hits
- `truman_wait5` — 0 hits
- `lago_maddy` — 0 hits (see section e for where the string survives as a non-dialogue id
  elsewhere in the repo)
- `lettera_o` — 0 hits
- `maddy_a4` — 0 hits
- `leland_a4` — 0 hits
- `leland_dove` — 0 hits
- `leland_dopo` — 0 hits
- `gerard_a4` — 0 hits

All ten retired classic-layer identifiers are absent from both files.

---

## (h) Generated data sync check

`test/gen-narrative-data.js` (52 lines) has no CLI flag or output-path override — it always
reads `narrative/missions/{M4,M5,M6,M8,M9}.json` plus `narrative/state-enums.json`,
`narrative/evidence.json`, `narrative/propositions.json`,
`narrative/schema-deltas/diff-evidence-M9.json`, and writes unconditionally to
`js/narrative-data.gen.js` (line 51: `fs.writeFileSync(path.join(root,
'js/narrative-data.gen.js'), out);`). Invocation: `node test/gen-narrative-data.js`.

Procedure followed: copied the tracked `js/narrative-data.gen.js` to
`/private/tmp/.../scratchpad/narrative-data.gen.js.bak` as a backup, ran `node
test/gen-narrative-data.js` (output: "generated js/narrative-data.gen.js (218166 bytes)"),
then ran `git diff --stat js/narrative-data.gen.js`.

**Result: the diff was empty.** The checked-in generated file was already byte-identical to
a fresh regeneration from the mission JSON — **not stale**. Because the diff was empty, no
`git checkout --` cleanup was required (per the task's own instruction: only run checkout
"if the diff was non-empty"). `git status --porcelain js/narrative-data.gen.js` was also
empty both before and after.

Cache-busting tags in `index.html`:
```
597:<script src="js/narrative-data.gen.js?v=19act4b1"></script>
599:<script src="js/narrative-engine-adapter.js?v=11"></script>
```
The two version tags use **inconsistent formats**: `narrative-data.gen.js` uses a
descriptive/versioned tag (`v=19act4b1`, suggesting it has been bumped through iterative
passes up to at least "act4 pass b1"), while `narrative-engine-adapter.js` uses a bare
integer (`v=11`). Both are non-empty/non-default, which is consistent with "recently
bumped" in the sense that neither is left at a stale default, but the two files don't share
a common versioning scheme, so freshness relative to each other cannot be confirmed from
the tag format alone.

---

## (i) Objectives

All 8 objectives from `narrative/missions/M8.json:42-207`, highest priority first:

1. **obj_m8_4** (priority 400, M8.json:44-62): `all[flag:maddy_trovata,
   proposition_path P8.formulation.status==formulated, node_done:m8_station]`. Text: "Porta
   a Truman una contraddizione che regga."
2. **obj_m8_35** (priority 350, M8.json:64-84): `all[flag:maddy_trovata,
   proposition_path P8.formulation.status==formulated, not node_done:m8_station]`. Text:
   "Porta il nesso a Truman, alla centrale."
3. **obj_m8_3** (priority 300, M8.json:86-103): `all[flag:maddy_trovata, not
   proposition_path P8.formulation.status==formulated]`. Text: "Rileggi le lettere e il
   diario di Laura."
4. **obj_m8_25** (priority 250, M8.json:105-121): `all[value_set:promise_stance, not
   evidence:T_LELAND_TAXI]`. Text: "Prima di uscire dal diner, parla con Leland."
5. **obj_m8_2** (priority 200, M8.json:123-148): `all[evidence:T_LELAND_TAXI, value_is
   presagio_status==active, not flag:maddy_trovata, value_set:warning_target]`. Text: "Torna
   all'incrocio: casa Palmer, lago o diner."
6. **obj_m8_15** (priority 150, M8.json:150-169): `all[value_is presagio_status==active,
   not value_set:warning_target]`. Text: "Il telefono del Roadhouse."
7. **obj_m8_1** (priority 100, M8.json:171-195): `all[value_set:promise_stance,
   evidence:T_LELAND_TAXI, not value_set:presagio_status, not
   node_done:m8_roadhouse_truman]`. Text: "Il paese si ritrova al Roadhouse, stasera."
8. **obj_m8_0** (priority 50, M8.json:197-206): `not value_set:promise_stance`. Text: "Passa
   dal diner, questo pomeriggio."

Spot-checked references, all resolvable within M8.json or the codebase:
- `flag:maddy_trovata` — set by `m8_discovery` (M8.json:1210, `"set": "maddy_trovata"`).
- `proposition_path P8.formulation.status` — written by `m8_cmp_diary`'s `diary_a` choice
  effect (M8.json:1403-1413, `"proposition":"P8","to":"formulated"`).
- `node_done:m8_station` — `m8_station` exists as a node id (M8.json:1474).
- `value_set:promise_stance` — written by all three choices of `m8_diner`
  (M8.json:279,298,317).
- `evidence:T_LELAND_TAXI` — written by `m8_leland_taxi` (M8.json:716-720).
- `value_is presagio_status==active` — written by `m8_roadhouse_truman`
  (M8.json:439-442).
- `value_set:warning_target` — written by all three choices of `m8_roadhouse_phone`
  (M8.json:535,569,596).
- `not node_done:m8_roadhouse_truman` — node exists (M8.json:391).
- `value_set:presagio_status` (obj_m8_1's negative guard) — same value as above, consistent.

No objective condition references a flag, value, evidence id, or node id that could not be
located elsewhere in `M8.json` or the adapter/runtime files inspected in this audit.

---

## Final cleanliness check

`git status --porcelain js/narrative-data.gen.js` — output: **empty** (no uncommitted
changes). The regeneration in step (h) produced a byte-identical file, so no `git checkout
--` was necessary and none was run. Repo is clean of this audit's side effects.
