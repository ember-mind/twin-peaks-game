# M8 extraction — verbatim working base

Read-only extraction. Sources: `narrative/missions/M8.json`, `narrative/state-enums.json`, `narrative/schema-deltas/M8.md` (+ `diff-*-M8.json`), `narrative/missions/M9.json` (reads only), `narrative/evidence.json`, `narrative/propositions.json`, `tools/narrative/lint-allowlist.json`, `docs/act-3-closure-report.md`, `docs/story-truth-v0.1-population-report.md`.
All quoted text is copied verbatim; nothing is reworded, abbreviated, or interpreted.

## A. Mission header

| field | value |
|---|---|
| `mission` | `M8` |
| `title` | Sta accadendo di nuovo |
| `narrative_package` | `narrative-v1.0` |
| `source.document` | M8 v1.1 LOCK.md |
| `source.package` | narrative-v1.0 |
| `schema_delta` | `narrative/schema-deltas/M8.md` |
| `entry_condition` | `{"flag":"atto4"}` |
| `completion.when` | `{"node_done":"m8_station"}` |
| `completion.sets` | `[]` |
| `node_count.runtime_total` | `12` |

There is no `milestones` field in `M8.json`. Progress is expressed only through the objectives ladder below, `completion.when`, and per-node `completion_when`.

### A.1 Objectives ladder (every rung, verbatim)

Listed in file order. `priority` is the rung value.

| id | priority | `when` (verbatim) | text (verbatim) |
|---|---|---|---|
| `obj_m8_4` | 400 | `{"all":[{"flag":"maddy_trovata"},{"proposition_path":"P8.formulation.status","equals":"formulated"},{"node_done":"m8_station"}]}` | Porta a Truman una contraddizione che regga. |
| `obj_m8_35` | 350 | `{"all":[{"flag":"maddy_trovata"},{"proposition_path":"P8.formulation.status","equals":"formulated"},{"not":{"node_done":"m8_station"}}]}` | Porta il nesso a Truman, alla centrale. |
| `obj_m8_3` | 300 | `{"all":[{"flag":"maddy_trovata"},{"not":{"proposition_path":"P8.formulation.status","equals":"formulated"}}]}` | Rileggi le lettere e il diario di Laura. |
| `obj_m8_25` | 250 | `{"all":[{"value_set":"promise_stance"},{"not":{"evidence":"T_LELAND_TAXI"}}]}` | Prima di uscire dal diner, parla con Leland. |
| `obj_m8_2` | 200 | `{"all":[{"evidence":"T_LELAND_TAXI"},{"value_is":{"name":"presagio_status","equals":"active"}},{"not":{"flag":"maddy_trovata"}}]}` | Torna all’incrocio: casa Palmer, lago o diner. |
| `obj_m8_1` | 100 | `{"all":[{"value_set":"promise_stance"},{"evidence":"T_LELAND_TAXI"},{"not":{"value_set":"presagio_status"}}]}` | Il paese si ritrova al Roadhouse, stasera. |
| `obj_m8_0` | 50 | `{"not":{"value_set":"promise_stance"}}` | Passa dal diner, questo pomeriggio. |

#### Objective provenance notes (verbatim)

- **`obj_m8_4`** — [L] testo esatto del Lock §9-F. Il Lock consegna questo obiettivo DOPO la conversazione alla stazione, come passaggio a M9 (gate node_done:m8_station); prima della stazione è attivo obj_m8_35
- **`obj_m8_35`** — [N] derivato: obiettivo intermedio (P8 formulata, stazione non ancora fatta) che indirizza alla centrale; la consegna della «contraddizione a Truman» (obj_m8_4) resta post-stazione per rispettare la cronologia del Lock §9-F e la matrice C8-D
- **`obj_m8_3`** — [N] derivato dal beat E (le lettere e il diario)
- **`obj_m8_25`** — [N→L] rende obbligatoria la falsa storia del taxi richiesta dal lock M9 nel pomeriggio: dopo la promessa a Maddy, prima del Roadhouse e del presagio.
- **`obj_m8_2`** — [L] testo esatto del Lock §9-B
- **`obj_m8_1`** — [N] obiettivo del Roadhouse (pre-enunciato del Gigante): attivo SOLO dopo la promessa al diner (value_set promise_stance), perché m8_roadhouse richiede promise_stance — altrimenti l'obiettivo punterebbe a una root non ancora azionabile
- **`obj_m8_0`** — [N] obiettivo d'ingresso M8 (pre-diner): punta alla root azionabile m8_diner (dove nasce promise_stance) prima del Roadhouse — chiude il softlock semantico/wayfinding del verdetto C8-A.2. Testo di sola direzione (nessuna «raggiungi/salva Maddy»: igiene falsa colpa)

### A.2 Authorial timeline (T0–T7)

`authorial_timeline.note` (verbatim):

Timeline autoriale UNICA (Lock §8). DATO DICHIARATIVO, mai stato runtime, mai contatore, mai ramo: nessun effetto scrive T0..T7. Nessun percorso del player intercetta Leland/BOB.

| step | text (verbatim) |
|---|---|
| `T0` | pomeriggio — Maddy al diner decide la prima corriera del mattino (fermata del lago) |
| `T1` | sera — torna a casa Palmer |
| `T2` | Leland/BOB è GIÀ dentro la casa: il pericolo è interno, mai un estraneo sulla strada |
| `T3` | il Gigante appare al Roadhouse: il processo è avviato, l'aggressione non ancora |
| `T4` | la telefonata (se fatta) trova Maddy in casa: cambia ciò che fa NELLA casa, mai il percorso dell'omicidio |
| `T5` | l'attacco avviene in casa, prima che chiunque possa arrivare |
| `T6` | il corpo viene portato al lago |
| `T7` | una chiamata civile anonima segnala la riva: la centrale manda Hawk (processo del mondo, indipendente dalla scelta del player) |

### A.3 Mission-level value transitions

- `{"name":"presagio_status","from":"active","to":"verified"}`
  - note (verbatim): active nasce al Roadhouse (m8_roadhouse), verified nasce SOLO al ritrovamento (m8_discovery); mai inversa. Primitiva generica DICHIARATA nello schema-delta, da implementare in C8-B.

### A.4 `source_section` per node

| node | `beat` | `source_section` |
|---|---|---|
| `m8_diner` | `A` | `M8-A` |
| `m8_roadhouse` | `B` | `M8-B` |
| `m8_leland_taxi` | `B0` | `M8-B0 / contratto M9 pre-ritrovamento` |
| `m8_focus_choice` | `C` | `M8-C` |
| `m8_route_palmer` | `C` | `M8-C` |
| `m8_route_lake` | `C` | `M8-C` |
| `m8_route_diner` | `C` | `M8-C` |
| `m8_discovery` | `D` | `M8-D` |
| `m8_promise_echo` | `D` | `M8-D` |
| `m8_cmp_letters` | `E` | `M8-E` |
| `m8_cmp_diary` | `E` | `M8-E` |
| `m8_station` | `F` | `M8-F` |

## B. Node table (graph order)

Graph order = file order in `M8.json` (`nodes[]`). Conditions and effects are verbatim compact JSON.

| # | id | beat | kind | channel | map_id | target_kind/target_id | actor_id | interaction_slot | role |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `m8_diner` | A | choice | world | `diner` | actor / maddy | `maddy` | primary | promise |
| 2 | `m8_roadhouse` | B | choice | world | `roadhouse` | object / roadhouse_phone | — | primary | warning |
| 3 | `m8_leland_taxi` | B0 | dialogue | world | `diner` | actor / leland | `leland` | primary | — |
| 4 | `m8_focus_choice` | C | choice | world | `town` | landmark / town_crossroads | — | primary | focus |
| 5 | `m8_route_palmer` | C | dialogue | world | `palmer` | landmark / palmer_entrance | — | primary | — |
| 6 | `m8_route_lake` | C | dialogue | world | `town` | landmark / lago_maddy | — | primary | — |
| 7 | `m8_route_diner` | C | dialogue | world | `diner` | actor / norma | `norma` | primary | — |
| 8 | `m8_discovery` | D | dialogue | world | `town` | landmark / lago_maddy | — | primary | — |
| 9 | `m8_promise_echo` | D | dialogue | world | `town` | landmark / lago_maddy | — | primary | — |
| 10 | `m8_cmp_letters` | E | comparison | notebook | — | — / — | — | primary | — |
| 11 | `m8_cmp_diary` | E | comparison | notebook | — | — / — | — | primary | proposition |
| 12 | `m8_station` | F | dialogue | world | `sheriff` | actor / truman | `truman` | primary | — |

| # | id | conditions (verbatim) | effects (verbatim) | completion_when | other gates |
|---|---|---|---|---|---|
| 1 | `m8_diner` | `[{"not":{"value_set":"promise_stance"}}]` | — | `{"value_set":"promise_stance"}` | — |
| 2 | `m8_roadhouse` | `[{"value_set":"promise_stance"},{"evidence":"T_LELAND_TAXI"},{"not":{"value_set":"warning_target"}}]` | `[{"value":"presagio_status","to":"active"},{"notebook":{"id":"m8.note.presagio","text":"Il secondo enunciato del Gigante: «Sta accadendo di nuovo». Significato ancora irrisolto."}}]` | `{"value_set":"warning_target"}` | — |
| 3 | `m8_leland_taxi` | `[{"value_set":"promise_stance"},{"not":{"evidence":"T_LELAND_TAXI"}}]` | `[{"evidence":"T_LELAND_TAXI"}]` | — | `mandatory_beat:true` |
| 4 | `m8_focus_choice` | `[{"evidence":"T_LELAND_TAXI"},{"value_set":"warning_target"},{"not":{"value_set":"focus_destination"}}]` | — | `{"value_set":"focus_destination"}` | — |
| 5 | `m8_route_palmer` | `[{"value_is":{"name":"focus_destination","equals":"palmer"}},{"not":{"value_set":"body_found_by"}}]` | `[{"value":"body_found_by","to":"hawk"}]` | — | `mandatory_beat:true` |
| 6 | `m8_route_lake` | `[{"value_is":{"name":"focus_destination","equals":"lago"}},{"not":{"value_set":"body_found_by"}}]` | `[{"value":"body_found_by","to":"cooper"}]` | — | `mandatory_beat:true` |
| 7 | `m8_route_diner` | `[{"value_is":{"name":"focus_destination","equals":"diner"}},{"not":{"value_set":"body_found_by"}}]` | `[{"value":"body_found_by","to":"hawk"}]` | — | `mandatory_beat:true` |
| 8 | `m8_discovery` | `[{"value_set":"body_found_by"},{"not":{"flag":"maddy_trovata"}}]` | `[{"evidence":"E9A_LETTERA_O"},{"evidence":"E9B_STESSO_METODO"},{"value":"letter_o_chain","to":"standard"},{"value":"letter_o_observation_source","from_derivation":{"of":"body_found_by","map":{"cooper":"cooper_primary","hawk":"hawk_preserved"}}},{"value_transition":{"name":"presagio_status","from":"active","to":"verified"}},{"set":"maddy_trovata"},{"notebook":{"id":"m8.note.letter_o","text":"Una O, incisa sotto l'unghia dell'anulare — stessa posizione e stesso tipo di incisione della R."}}]` | — | `mandatory_beat:true` · `next:m8_promise_echo` · `pages_by_value on body_found_by` |
| 9 | `m8_promise_echo` | `[{"flag":"maddy_trovata"},{"not":{"node_done":"m8_promise_echo"}}]` | — | — | `mandatory_beat:true` · `pages_by_value on promise_stance` |
| 10 | `m8_cmp_letters` | `[{"evidence":"E9A_LETTERA_O"},{"evidence":"E3_LETTERA_R"},{"node_done":"m8_promise_echo"}]` | `[{"notebook_observation":{"id":"m8.obs.letters","text":"Le due lettere sembrano appartenere allo stesso metodo. Un ordine: prima la R, poi la O."}}]` | — | `comparison_completion:node_commit` · `result:LETTERS_SAME_METHOD` |
| 11 | `m8_cmp_diary` | `[{"evidence":"E9A_LETTERA_O"},{"evidence":"E1_DIARIO"},{"node_done":"m8_promise_echo"},{"node_done":"m8_cmp_letters"}]` | — | `{"proposition_path":"P8.formulation.status","equals":"formulated"}` | `rules:{"attempt_scope":"comparison","hide_attempted_results":true,"track_assistance":false}` |
| 12 | `m8_station` | `[{"proposition_path":"P8.formulation.status","equals":"formulated"}]` | — | — | `mandatory_beat:true` · `pages_by_value on sarah_support_state` |

| # | id | objectives gated on this node | pages (total) | page breakdown |
|---|---|---|---|---|
| 1 | `m8_diner` | — | 11 | pages 8 + feedback 3 |
| 2 | `m8_roadhouse` | — | 11 | pages 7 + feedback 4 |
| 3 | `m8_leland_taxi` | — | 8 | pages 7 + repeat 1 |
| 4 | `m8_focus_choice` | — | 3 | pages 3 |
| 5 | `m8_route_palmer` | — | 5 | pages 5 |
| 6 | `m8_route_lake` | — | 2 | pages 2 |
| 7 | `m8_route_diner` | — | 3 | pages 3 |
| 8 | `m8_discovery` | — | 7 | pages 0 + pages_by_value[cooper] 4 + pages_by_value[hawk] 3 |
| 9 | `m8_promise_echo` | — | 6 | pages 1 + pages_by_value[accompagno] 1 + pages_by_value[autonomia] 1 + pages_by_value[prudenza] 1 + pages_after_branch 2 |
| 10 | `m8_cmp_letters` | — | 2 | pages 1 + completed_recall 1 |
| 11 | `m8_cmp_diary` | — | 8 | pages 4 + feedback 3 + completed_recall 1 |
| 12 | `m8_station` | `obj_m8_4`, `obj_m8_35` | 7 | pages 1 + pages_by_value[vice] 1 + pages_by_value[none] 1 + pages_after_branch 3 + repeat 1 |

### B.1 Choices per node (id, label, effects, feedback page ids)

| node | choice id | label (verbatim) | result | retry | effects (verbatim) | feedback page ids |
|---|---|---|---|---|---|---|
| `m8_diner` | `promise_accompagno` | «Lunedì ti accompagno io alla corriera.» | — | — | `[{"value":"promise_stance","to":"accompagno"}]` | `m8.a.diner.feedback.accompagno` |
| `m8_diner` | `promise_autonomia` | «Missoula ti aspetta. Vai.» | — | — | `[{"value":"promise_stance","to":"autonomia"}]` | `m8.a.diner.feedback.autonomia` |
| `m8_diner` | `promise_prudenza` | «Chiama quando arrivi. Sempre.» | — | — | `[{"value":"promise_stance","to":"prudenza"}]` | `m8.a.diner.feedback.prudenza` |
| `m8_roadhouse` | `warning_palmer` | Avverti casa Palmer. | — | — | `[{"value":"warning_target","to":"palmer"},{"value":"maddy_action_after_warning","to":"departure_prepared"},{"value":"sarah_support_state","to":"none"}]` | `m8.b.roadhouse.feedback.palmer.p01`, `m8.b.roadhouse.feedback.palmer.p02` |
| `m8_roadhouse` | `warning_centrale` | Chiedi alla centrale di mandare un vice. | — | — | `[{"value":"warning_target","to":"centrale"},{"value":"maddy_action_after_warning","to":"none"},{"value":"sarah_support_state","to":"vice"}]` | `m8.b.roadhouse.feedback.centrale` |
| `m8_roadhouse` | `warning_nessuno` | Non perdere altro tempo: esci. | — | — | `[{"value":"warning_target","to":"nessuno"},{"value":"maddy_action_after_warning","to":"none"},{"value":"sarah_support_state","to":"none"}]` | `m8.b.roadhouse.feedback.nessuno` |
| `m8_focus_choice` | `focus_palmer` | casa Palmer — la casa continua a tornare (a nord, lontana) | — | — | `[{"value":"focus_destination","to":"palmer"}]` | — |
| `m8_focus_choice` | `focus_lago` | la fermata del lago — la corriera di Maddy (a ovest, lontana) | — | — | `[{"value":"focus_destination","to":"lago"}]` | — |
| `m8_focus_choice` | `focus_diner` | il Double R — Norma sa se è partita (vicino) | — | — | `[{"value":"focus_destination","to":"diner"}]` | — |
| `m8_cmp_diary` | `diary_a` | Le lettere seguono una firma progressiva che il diario aveva annunciato. | `PROGRESSIVE_SIGNATURE` | — | `[{"proposition":"P8","to":"formulated","created_from":["E3_LETTERA_R","E9A_LETTERA_O","E9B_STESSO_METODO","E1_DIARIO"]}]` | `m8.e.cmp_diary.feedback.a` |
| `m8_cmp_diary` | `diary_b` | R+O compongono un nome. | `NAME_OVERREACH` | `true` | `[]` | `m8.e.cmp_diary.feedback.b` |
| `m8_cmp_diary` | `diary_c` | Il diario accusa qualcuno di casa. | `HOUSE_OVERREACH` | `true` | `[]` | `m8.e.cmp_diary.feedback.c` |

### B.2 Node invariants and notes (verbatim)

**`m8_diner`**

- `prompt`: Che cosa prometti a Maddy?
- `invariant`: scena ordinaria autonoma (starebbe nel gioco anche senza la tragedia); nessuna voce di taccuino (non appartiene al fascicolo); nessun presagio/paura/«sono come Laura»; promise_stance write-once; nessuna opzione «giusta»

**`m8_roadhouse`**

- `prompt`: Chi deve ricevere l'avvertimento?
- `invariant`: presagio_status: active nasce QUI (write iniziale, mai entry-gate); la label è INTENZIONE non comando; nessuna opzione nomina Maddy come bersaglio; maddy_departure_plan (prima corriera) invariato dal pomeriggio; l'enunciato è solo per Cooper (la banda non si ferma)

**`m8_leland_taxi`**

- `invariant`: La falsa storia nasce fisicamente al diner DOPO la promessa e PRIMA del Roadhouse/presagio/ritrovamento. Se Cooper ha offerto di accompagnare Maddy, verifica subito la compatibilità 7:00/7:10 e Leland conferma che il taxi aspetterà: nessuna contraddizione fabbricata o ignorata. M9 può solo verificare la prenotazione, mai creare la storia retroattivamente né usare gli orari come prova d'omicidio.

**`m8_focus_choice`**

- `prompt`: Dove vai?
- `invariant`: focus_destination write-once; NESSUN goto: il commit scrive focus_destination, chiude il widget e restituisce il gameplay — la world-root della destinazione scelta si CAMMINA (C8-E); ogni destinazione ha una ragione disponibile al player (geografia reale di town); i costi sono distanza dichiarata dallo spazio, mai countdown; nessuna opzione è «giusta»

**`m8_route_palmer`**

- `invariant`: la casa NON è la scena del corpo (T2/T5: l'attacco è interno, il corpo è al lago); a Palmer arriva la chiamata della centrale → Hawk; la valigia/biglietto di Maddy sono la SUA azione, mai collegata al percorso della morte

**`m8_route_lake`**

- `invariant`: al lago Cooper è primo (cooper_primary); il fatto fisso non si evita da nessuna strada
- `provenance_note`: [P] lago_maddy (town 15,28) dal repository

**`m8_route_diner`**

- `invariant`: al diner Norma non sa più dell'orario; la chiamata anonima manda Hawk (processo del mondo); body_found_by=hawk

**`m8_discovery`**

- `invariant`: E9A/E9B scritte in OGNI percorso (unico writer = discovery); letter_o_chain=standard sempre; presagio active→verified SOLO qui (value_transition); maddy_trovata [P] unico writer; nessun testo valuta le scelte della notte; effetti SOLO dopo l'ultima pagina
- `next_note`: il ritrovamento continua obbligatoriamente all'eco della promessa (Lock: il monologo comune è parte del ritrovamento); i confronti del taccuino sono gated su node_done:m8_promise_echo, così l'eco non è saltabile nemmeno dopo load
- `letter_o_source_note`: letter_o_observation_source è un EFFETTO derivato (from_derivation) del ritrovamento: unico writer eseguibile (Cooper primo → cooper_primary; altrimenti Hawk preserva → hawk_preserved). Disciplina runtime (schema-delta §3, C8-B): prepareNode legge body_found_by, valida dominio e copertura, risolve cooper_primary|hawk_preserved e CONGELA il risultato nel prepared; commitNode consuma il valore risolto — NON rilegge il sorgente al commit. Arrivare secondi NON indebolisce la prova — cambia una riga di M9, mai il gate. Mai adapter.

**`m8_promise_echo`**

- `invariant`: l'eco della promessa deriva da promise_stance (pages_by_value, copertura totale del dominio); il monologo porta la colpa PERCEPITA, il testo non la conferma; nessun testo qui valuta le scelte della notte

**`m8_cmp_letters`**

- `invariant`: confronto senza scelte, completed al node commit (result LETTERS_SAME_METHOD); produce SOLO la nota di ordine/metodo, nessuna proposizione; nessuna identità della mano
- `gate_note`: i confronti del taccuino sono nascosti finché l'eco della promessa non è avvenuta (node_done:m8_promise_echo): protegge l'ordine drammaturgico D→E del Lock anche dopo crash/load, senza fare della promessa una causa della tragedia

**`m8_cmp_diary`**

- `prompt`: Che cosa puoi formulare?
- `invariant`: P8 nasce SOLO dal doppio confronto (A); factual_status ≤ corroborated (chi resta ignoto: assassino/«lui»/messinscena); B respinta (le due lettere non compongono un nome), C respinta (il diario non nomina chi né dove — P7 resta ipotesi non-procedurale); tentativi in comparisons[node].attempts
- `gate_note`: P8 non può saltare il primo confronto: il diario (che formula P8) è nascosto finché il confronto lettere R↔O non è committato (node_done:m8_cmp_letters). Gate: cmp_diary_hidden_before_cmp_letters, cmp_letters_commit_unlocks_cmp_diary, P8_cannot_bypass_first_comparison. Anche gated su m8_promise_echo (ordine D→E robusto dopo load).

**`m8_station`**

- `invariant`: Sarah non è mai oracolo (dorme; il vice la sostiene, non scopre corpi); la valigia/biglietto è visibile SE E SOLO SE warning_target=palmer (di persona in C se focus=palmer, via Truman qui se focus=lago|diner; con warning=centrale|nessuno nessuna pagina valigia in alcun percorso); il lutto di Truman è logistico; obiettivo «contraddizione a Truman» → M9; M8 NON completa la funzione procedurale di M9, non tratta P8 come base della convocazione
- `pages_by_value.note`: la logistica di Sarah deriva dallo STATO NOMINALE sarah_support_state (vice = il vice è già con Sarah; none = Truman ci è passato). pages_by_value su un valore tipizzato: copertura totale del dominio [none, vice]. M9/epilogo leggono sarah_support_state come stato nominale.

## C. Every page, verbatim, in order

Order inside each node: `pages[]`, then `pages_by_value.cases` (case order as in file), then `pages_after_branch[]`, then each choice with its `feedback_pages[]`, then `repeat`, then `completed_recall.page`. Speaker shown as `display_name` with `speaker_id` in parentheses.

### `m8_diner` — beat A (`M8-A`)

Prompt: **Che cosa prometti a Maddy?**

#### pages[]

- `m8.a.diner.p01` · `action` · _no speaker_

  > (Maddy al bancone, un tovagliolo pieno di numeri. Norma le riempie la tazza senza chiedere.)

- `m8.a.diner.p02` · `dialogue` · MADDY (`maddy`)

  > La 7:40 prende la coincidenza a Spokane. Passa alla fermata del lago — quella delle 11 no, ma parte a orario.

- `m8.a.diner.p03` · `dialogue` · COOPER (`cooper`)

  > Torna a casa, signorina Ferguson?

- `m8.a.diner.p04` · `dialogue` · MADDY (`maddy`)

  > Torno al centralino della biblioteca. Mi tengono il posto fino a lunedì — l'ho fatto promettere per iscritto.

- `m8.a.diner.p05` · `action` · _no speaker_

  > (Un avventore la saluta: "Ciao, Laura". Maddy non si volta subito.)

- `m8.a.diner.p06` · `dialogue` · MADDY (`maddy`)

  > (senza acidità) Maddy. Con due D. Laura era mia cugina — io sono quella che porta gli occhiali nelle foto.

- `m8.a.diner.p07` · `dialogue` · MADDY (`maddy`)

  > Sono rimasta un giorno in più per zia Sarah. Uno. Poi Missoula si riprende il suo centralino.

- `m8.a.diner.p08` · `action` · _no speaker_

  > (Maddy piega il tovagliolo sugli orari e aspetta.)

#### choices — labels and feedback pages

##### choice `promise_accompagno`

Label (verbatim):

> «Lunedì ti accompagno io alla corriera.»

Effects: `[{"value":"promise_stance","to":"accompagno"}]`

Feedback pages:

- `m8.a.diner.feedback.accompagno` · `dialogue` · MADDY (`maddy`)

  > (sorride) Alle 7:10, agente. Io i federali li faccio aspettare al massimo cinque minuti.

##### choice `promise_autonomia`

Label (verbatim):

> «Missoula ti aspetta. Vai.»

Effects: `[{"value":"promise_stance","to":"autonomia"}]`

Feedback pages:

- `m8.a.diner.feedback.autonomia` · `dialogue` · MADDY (`maddy`)

  > (annuisce, piano) È la prima persona in questa città che me lo dice senza un "ma".

##### choice `promise_prudenza`

Label (verbatim):

> «Chiama quando arrivi. Sempre.»

Effects: `[{"value":"promise_stance","to":"prudenza"}]`

Feedback pages:

- `m8.a.diner.feedback.prudenza` · `dialogue` · MADDY (`maddy`)

  > (ride) Lei parla come il mio centralino. Va bene: chiamerò. Sempre.

### `m8_roadhouse` — beat B (`M8-B`)

Prompt: **Chi deve ricevere l'avvertimento?**

#### pages[]

- `m8.b.roadhouse.p01` · `action` · _no speaker_

  > (La banda suona. Il paese c'è tutto: birre, risate basse, il microfono che fischia una volta.)

- `m8.b.roadhouse.p02` · `dialogue` · TRUMAN (`truman`)

  > Se i tuoi enigmi avevano un seguito, questo è il posto che mi hai chiesto di aspettare.

- `m8.b.roadhouse.p03` · `action` · _no speaker_

  > (La musica non si ferma. Ma per Cooper la sala rallenta — solo per lui.)

- `m8.b.roadhouse.p04` · `dialogue` · GIGANTE (`gigante`)

  > Sta accadendo di nuovo.

- `m8.b.roadhouse.p05` · `action` · _no speaker_

  > (La sala riprende il suo tempo. Nessuno ha visto niente.)

- `m8.b.roadhouse.p06` · `notebook` · _no speaker_

  > Il telefono del Roadhouse.

- `m8.b.roadhouse.p07` · `dialogue` · COOPER (`cooper`)

  > Harry, non so ancora cosa si ripeta. La linea è libera; quello che dico adesso farà muovere qualcuno.

#### choices — labels and feedback pages

##### choice `warning_palmer`

Label (verbatim):

> Avverti casa Palmer.

Effects: `[{"value":"warning_target","to":"palmer"},{"value":"maddy_action_after_warning","to":"departure_prepared"},{"value":"sarah_support_state","to":"none"}]`

Feedback pages:

- `m8.b.roadhouse.feedback.palmer.p01` · `dialogue` · COOPER (`cooper`)

  > Maddy. Sono Cooper. Svegli Sarah — restate insieme e non aprite a nessuno. Mando qualcuno.

- `m8.b.roadhouse.feedback.palmer.p02` · `dialogue` · MADDY (`maddy`)

  > Le porte sono già chiuse, agente. Resto con lei. La valigia la porto nell'ingresso, così domattina non la sveglio.

##### choice `warning_centrale`

Label (verbatim):

> Chiedi alla centrale di mandare un vice.

Effects: `[{"value":"warning_target","to":"centrale"},{"value":"maddy_action_after_warning","to":"none"},{"value":"sarah_support_state","to":"vice"}]`

Feedback pages:

- `m8.b.roadhouse.feedback.centrale` · `dialogue` · LUCY (`lucy`)

  > Glielo passo— no, è di pattuglia. Mando Andy a casa Palmer, agente. Ci mette dieci minuti.

##### choice `warning_nessuno`

Label (verbatim):

> Non perdere altro tempo: esci.

Effects: `[{"value":"warning_target","to":"nessuno"},{"value":"maddy_action_after_warning","to":"none"},{"value":"sarah_support_state","to":"none"}]`

Feedback pages:

- `m8.b.roadhouse.feedback.nessuno` · `action` · _no speaker_

  > (Il telefono resta sulla forcella. La porta del Roadhouse è già alle spalle.)

### `m8_leland_taxi` — beat B0 (`M8-B0 / contratto M9 pre-ritrovamento`)

#### pages[]

- `m8.b0.leland_taxi.p00` · `action` · _no speaker_

  > (Maddy saluta ed esce. Leland posa il conto sul bancone.)

- `m8.b0.leland_taxi.p01` · `dialogue` · LELAND (`leland`)

  > Maddy prende la prima corriera domattina. Ho chiamato la Twin Peaks Taxi: passa da casa alle sette.

- `m8.b0.leland_taxi.accompagno.p01` · `dialogue` · COOPER (`cooper`)
  - `condition`: `{"value_is":{"name":"promise_stance","equals":"accompagno"}}`

  > Con Maddy ci siamo accordati: la accompagno alle sette e dieci. Il taxi aspetterà?

- `m8.b0.leland_taxi.autonomia.p01` · `dialogue` · COOPER (`cooper`)
  - `condition`: `{"value_is":{"name":"promise_stance","equals":"autonomia"}}`

  > Maddy ha scelto Missoula. Non aggiungo un «ma»: verifico gli orari e le lascio la partenza.

- `m8.b0.leland_taxi.prudenza.p01` · `dialogue` · COOPER (`cooper`)
  - `condition`: `{"value_is":{"name":"promise_stance","equals":"prudenza"}}`

  > Ho chiesto a Maddy una telefonata. Il taxi delle sette aggiunge un orario, non una garanzia.

- `m8.b0.leland_taxi.accompagno.p02` · `dialogue` · LELAND (`leland`)
  - `condition`: `{"value_is":{"name":"promise_stance","equals":"accompagno"}}`

  > Sarah si tranquillizza se c'è un'auto davanti. Aspetterà fino alle sette e dieci. Il suo accompagnamento resta, agente.

- `m8.b0.leland_taxi.p02` · `notebook` · _no speaker_

  > Prima del Roadhouse, al diner: Leland dice di aver prenotato il taxi di Maddy.

#### repeat

- `m8.repeat.leland_taxi` · `dialogue` · COOPER (`cooper`)

  > Taxi alle sette, corriera alle 7:40. Ripeto gli orari finché non compare una prenotazione.

### `m8_focus_choice` — beat C (`M8-C`)

Prompt: **Dove vai?**

#### pages[]

- `m8.c.focus.p01` · `action` · _no speaker_

  > (Lo stesso paese di ogni giorno. Stanotte le strade sono solo distanza.)

- `m8.c.focus.p02` · `notebook` · _no speaker_

  > Sul taccuino, tre luoghi restano senza segni di priorità.

- `m8.c.focus.p03` · `dialogue` · COOPER (`cooper`)

  > Nessun fatto ne preferisce uno. Il primo costo è la distanza.

#### choices — labels and feedback pages

##### choice `focus_palmer`

Label (verbatim):

> casa Palmer — la casa continua a tornare (a nord, lontana)

Effects: `[{"value":"focus_destination","to":"palmer"}]`

_(no feedback pages)_

##### choice `focus_lago`

Label (verbatim):

> la fermata del lago — la corriera di Maddy (a ovest, lontana)

Effects: `[{"value":"focus_destination","to":"lago"}]`

_(no feedback pages)_

##### choice `focus_diner`

Label (verbatim):

> il Double R — Norma sa se è partita (vicino)

Effects: `[{"value":"focus_destination","to":"diner"}]`

_(no feedback pages)_

### `m8_route_palmer` — beat C (`M8-C`)

#### pages[]

- `m8.c.route_palmer.p01` · `action` · _no speaker_

  > (La casa: buio al piano di sopra.)

- `m8.c.route_palmer.p02` · `action` · _no speaker_
  - `condition`: `{"value_is":{"name":"warning_target","equals":"palmer"}}`
  - `conditional_note`: valigia/biglietto = azione autonoma di Maddy, visibile QUI solo se warning=palmer (e focus=palmer, cioè si è a casa); altrimenti la riga arriva via Truman in F

  > (In ingresso, la valigia. Sotto la porta di Sarah, un biglietto: "Torno lunedì. Non svegliarla." Di Maddy, nessuna traccia.)

- `m8.c.route_palmer.p03` · `action` · _no speaker_

  > (Il telefono squilla: è la centrale.)

- `m8.c.route_palmer.p04` · `dialogue` · LUCY (`lucy`)

  > Agente — una chiamata anonima, qualcosa sulla riva del lago. Hawk è già in strada.

- `m8.c.route_palmer.p05` · `dialogue` · COOPER (`cooper`)

  > Lucy, ricevuto. Non tocco nulla qui; raggiungo Hawk al lago.

### `m8_route_lake` — beat C (`M8-C`)

#### pages[]

- `m8.c.route_lake.p01` · `action` · _no speaker_

  > (L'acqua è ferma. Sulla riva, una forma che l'acqua non reclama. Cooper arriva per primo.)

- `m8.c.route_lake.p02` · `dialogue` · COOPER (`cooper`)

  > Fermo al perimetro. Prima proteggo la scena; poi troverò le parole per Maddy.

### `m8_route_diner` — beat C (`M8-C`)

#### pages[]

- `m8.c.route_diner.p01` · `dialogue` · NORMA (`norma`)

  > Maddy? Ha chiesto della fermata del lago. Poi è tornata dai Palmer. Non era ancora partita.

- `m8.c.route_diner.p02` · `action` · _no speaker_

  > (Il tempo di uscire: la radio di Hawk gracchia il nome del lago — una chiamata anonima ha segnalato qualcosa sulla riva.)

- `m8.c.route_diner.p03` · `dialogue` · COOPER (`cooper`)

  > Hawk ha il lago. Norma conferma che Maddy è tornata dai Palmer; porto con me questo ordine.

### `m8_discovery` — beat D (`M8-D`)

#### pages[]

_(empty: this node has no unconditional pages)_

#### pages_by_value — on value `body_found_by`

##### case `body_found_by` = `cooper`

- `m8.d.discovery.cooper.p01` · `action` · _no speaker_

  > (Sulla riva: Maddy. Cooper si ferma prima del perimetro.)

- `m8.d.discovery.cooper.p02` · `dialogue` · COOPER (`cooper`)

  > (fermo) Signorina Ferguson. Maddy. Con due D.

- `m8.d.discovery.cooper.p03` · `action` · _no speaker_

  > (Si china senza toccare. Sotto l'unghia dell'anulare: un segno.)

- `m8.d.discovery.cooper.p04` · `action` · _no speaker_

  > (Arrivano le torce di Hawk e del vice. Cooper non si è mosso di un passo.)

##### case `body_found_by` = `hawk`

- `m8.d.discovery.hawk.p01` · `action` · _no speaker_

  > (Quando Cooper arriva, il perimetro è già segnato. Hawk gli va incontro, si toglie il cappello.)

- `m8.d.discovery.hawk.p02` · `dialogue` · HAWK (`hawk`)

  > L'ho trovata io. Non l'ho mossa. Non ho toccato le mani. Guarda l'anulare.

- `m8.d.discovery.hawk.p03` · `dialogue` · COOPER (`cooper`)

  > Hawk, hai fatto bene. Osservo da dove ti sei fermato; una scena preservata ha due paia d'occhi.

### `m8_promise_echo` — beat D (`M8-D`)

#### pages[]

- `m8.d.echo.p01` · `action` · _no speaker_

  > (Cooper prende il registratore. Non lo accende.)

#### pages_by_value — on value `promise_stance`

##### case `promise_stance` = `accompagno`

- `m8.d.echo.accompagno` · `dialogue` · COOPER (`cooper`)

  > Diane. Aveva fissato le 7:10. Disse che un federale poteva aspettare cinque minuti.

##### case `promise_stance` = `autonomia`

- `m8.d.echo.autonomia` · `dialogue` · COOPER (`cooper`)

  > Diane. Disse che Missoula l'aspettava senza un "ma".

##### case `promise_stance` = `prudenza`

- `m8.d.echo.prudenza` · `dialogue` · COOPER (`cooper`)

  > Diane. Rise della mia voce da centralino. Disse che avrebbe chiamato.

#### pages_after_branch[]

- `m8.d.echo.p02` · `dialogue` · COOPER (`cooper`)

  > Sul tovagliolo aveva scritto tre partenze. Ne aveva scelta una.

- `m8.d.echo.p03` · `action` · _no speaker_

  > (Silenzio.)

### `m8_cmp_letters` — beat E (`M8-E`)

#### pages[]

- `m8.e.cmp_letters.p01` · `notebook` · _no speaker_

  > (Confronta: la O incisa sotto l'unghia ↔ la lettera R)

#### completed_recall — section `notes`

- `m8.notebook.cmp_letters.recorded` · `notebook` · _no speaker_

  > (Questo confronto è già annotato negli Appunti.)

### `m8_cmp_diary` — beat E (`M8-E`)

Prompt: **Che cosa puoi formulare?**

#### pages[]

- `m8.e.cmp_diary.p01` · `notebook` · _no speaker_

  > (Confronta: le lettere ↔ il diario di Laura)

- `m8.e.cmp_diary.p02` · `notebook` · DIARIO DI LAURA

  > «Ha un nome da persona perbene.»

- `m8.e.cmp_diary.p02b` · `notebook` · DIARIO DI LAURA

  > «Dice che me lo darà un pezzo alla volta, come le cose che non si possono restituire.»

- `m8.e.cmp_diary.p03` · `notebook` · _no speaker_

  > Cooper affianca la promessa del diario alla sequenza R–O.

#### choices — labels and feedback pages

##### choice `diary_a` · result `PROGRESSIVE_SIGNATURE`

Label (verbatim):

> Le lettere seguono una firma progressiva che il diario aveva annunciato.

Effects: `[{"proposition":"P8","to":"formulated","created_from":["E3_LETTERA_R","E9A_LETTERA_O","E9B_STESSO_METODO","E1_DIARIO"]}]`

Feedback pages:

- `m8.e.cmp_diary.feedback.a` · `notebook` · _no speaker_

  > Le lettere seguono una firma progressiva che il diario aveva annunciato. Resta ignoto se la firma sia dell'assassino, di "lui", o una messinscena.

##### choice `diary_b` · result `NAME_OVERREACH` · `retry: true`

Label (verbatim):

> R+O compongono un nome.

Feedback pages:

- `m8.e.cmp_diary.feedback.b` · `notebook` · _no speaker_

  > Due lettere non compongono niente. Un ordine e una promessa, forse.

##### choice `diary_c` · result `HOUSE_OVERREACH` · `retry: true`

Label (verbatim):

> Il diario accusa qualcuno di casa.

Feedback pages:

- `m8.e.cmp_diary.feedback.c` · `notebook` · _no speaker_

  > Il diario nomina "lui". Non dice chi, né dove abita.

#### completed_recall — section `propositions`

- `m8.notebook.cmp_diary.recorded` · `notebook` · _no speaker_

  > (Questo nesso è già registrato nelle Proposizioni.)

### `m8_station` — beat F (`M8-F`)

#### pages[]

- `m8.f.station.p01` · `action` · _no speaker_

  > (La centrale, prima dell'alba.)

#### pages_by_value — on value `sarah_support_state`

`note`: la logistica di Sarah deriva dallo STATO NOMINALE sarah_support_state (vice = il vice è già con Sarah; none = Truman ci è passato). pages_by_value su un valore tipizzato: copertura totale del dominio [none, vice]. M9/epilogo leggono sarah_support_state come stato nominale.

##### case `sarah_support_state` = `vice`

- `m8.f.station.sarah_vice` · `dialogue` · TRUMAN (`truman`)

  > Andy era già con Sarah quando è arrivata la chiamata.

##### case `sarah_support_state` = `none`

- `m8.f.station.sarah_truman` · `dialogue` · TRUMAN (`truman`)

  > Sono passato io da Sarah prima di tornare qui. Adesso Andy resta con lei.

#### pages_after_branch[]

- `m8.f.station.p_valigia` · `dialogue` · TRUMAN (`truman`)
  - `condition`: `{"all":[{"value_is":{"name":"warning_target","equals":"palmer"}},{"not":{"value_is":{"name":"focus_destination","equals":"palmer"}}}]}`
  - `conditional_note`: rende visibile la valigia/biglietto a chi NON è passato da casa (warning=palmer ∧ focus≠palmer); congelata in prepareNode (conditional_pages, schema-delta §3)

  > In ingresso c'era la valigia pronta, e un biglietto per Sarah. Voleva partire domattina.

- `m8.f.station.p02` · `dialogue` · TRUMAN (`truman`)

  > Dimmi che cosa abbiamo, oltre a quello che abbiamo perso.

- `m8.f.station.p03` · `dialogue` · COOPER (`cooper`)

  > Una firma che procede, Harry. Il diario dice che qualcuno le prometteva il proprio nome a pezzi.

#### repeat

- `m8.repeat.station` · `dialogue` · COOPER (`cooper`)

  > Il lago è recintato. Nessuno usa più quel sentiero; la scena, almeno, può restare ferma.

## D. State inventory

### D.1 Typed values

| value | enum domain (state-enums.json) | written by (M8) | read by (M8) | read by M9 |
|---|---|---|---|---|
| `body_found_by` | `["cooper","hawk"]` | `m8_route_palmer`, `m8_route_lake`, `m8_route_diner` | `m8_route_palmer`, `m8_route_lake`, `m8_route_diner`, `m8_discovery`, `m8_discovery (pages_by_value)` | — |
| `focus_destination` | `["palmer","lago","diner"]` | `m8_focus_choice/focus_palmer`, `m8_focus_choice/focus_lago`, `m8_focus_choice/focus_diner` | `m8_focus_choice`, `m8_focus_choice (completion_when)`, `m8_route_palmer`, `m8_route_lake`, `m8_route_diner`, `m8_station/m8.f.station.p_valigia` | — |
| `letter_o_chain` | `["standard"]` | `m8_discovery` | — | — |
| `letter_o_observation_source` | `["cooper_primary","hawk_preserved"]` | `m8_discovery` | — | reads_only_from_m8 → m9_present_truman (pagine di nodo, prima del widget), node `m9_present_truman` |
| `maddy_action_after_warning` | `["none","departure_prepared"]` | `m8_roadhouse/warning_palmer`, `m8_roadhouse/warning_centrale`, `m8_roadhouse/warning_nessuno` | — | — |
| `presagio_status` | `["active","verified"]` | `m8_roadhouse`, `m8_discovery (transition)` | `objective obj_m8_2`, `objective obj_m8_1` | — |
| `promise_stance` | `["accompagno","autonomia","prudenza"]` | `m8_diner/promise_accompagno`, `m8_diner/promise_autonomia`, `m8_diner/promise_prudenza` | `m8_diner`, `m8_diner (completion_when)`, `m8_roadhouse`, `m8_leland_taxi`, `m8_leland_taxi/m8.b0.leland_taxi.accompagno.p01`, `m8_leland_taxi/m8.b0.leland_taxi.autonomia.p01`, `m8_leland_taxi/m8.b0.leland_taxi.prudenza.p01`, `m8_leland_taxi/m8.b0.leland_taxi.accompagno.p02`, `m8_promise_echo (pages_by_value)`, `objective obj_m8_25`, `objective obj_m8_1`, `objective obj_m8_0` | reads_only_from_m8 → m9_verifica_taxi (eco investigativa solo per accompagno) + m9_present_truman (taccuino degli orari), node `m9_verifica_taxi` |
| `sarah_support_state` | `["none","vice"]` | `m8_roadhouse/warning_palmer`, `m8_roadhouse/warning_centrale`, `m8_roadhouse/warning_nessuno` | `m8_station (pages_by_value)` | reads_only_from_m8 → m9_present_truman (ramo accettato), node `m9_present_truman` |
| `warning_target` | `["palmer","centrale","nessuno"]` | `m8_roadhouse/warning_palmer`, `m8_roadhouse/warning_centrale`, `m8_roadhouse/warning_nessuno` | `m8_roadhouse`, `m8_roadhouse (completion_when)`, `m8_focus_choice`, `m8_route_palmer/m8.c.route_palmer.p02`, `m8_station/m8.f.station.p_valigia` | reads_only_from_m8 → m9_present_truman (ramo accettato, eco valigia), node `m9_present_truman` |

`values_allowed` mapping in `state-enums.json` for the M8 values: `{"promise_stance":"promise_stance","warning_target":"warning_target","focus_destination":"focus_destination","body_found_by":"body_found_by","letter_o_observation_source":"letter_o_observation_source","letter_o_chain":"letter_o_chain","presagio_status":"presagio_status","maddy_action_after_warning":"maddy_action_after_warning","sarah_support_state":"sarah_support_state"}`

Declared transition: `{"presagio_status":[["active","verified"]]}`

### D.2 Flags

| flag | written by (M8) | read by (M8) | read by M9 |
|---|---|---|---|
| `atto4` | — | `mission entry` | entry_condition |
| `maddy_trovata` | `m8_discovery` | `objective obj_m8_2`, `objective obj_m8_3`, `objective obj_m8_35`, `objective obj_m8_4`, `m8_promise_echo`, `m8_discovery` | — |

### D.3 Evidence atoms

| id | catalog `label` (verbatim) | kind | acquired_in | supports | written by (M8) | read by (M8) | read by M9 |
|---|---|---|---|---|---|---|---|
| `E1_DIARIO` | il diario di Laura | document | M2 | ["P1","P2","P8"] | — | `m8_cmp_diary` | — |
| `E3_LETTERA_R` | la lettera R | object | M2 | ["P8"] | — | `m8_cmp_letters` | — |
| `E9A_LETTERA_O` | una O incisa sotto l'unghia | object | M8 | ["P8"] | `m8_discovery` | `m8_cmp_letters`, `m8_cmp_diary` | — |
| `E9B_STESSO_METODO` | stessa posizione e tipo di incisione della R | observation | M8 | ["P8"] | `m8_discovery` | — | — |
| `T_LELAND_TAXI` | «Ho chiamato la Twin Peaks Taxi» (Leland, prima del Roadhouse) | testimony | M8 | ["P6"] | `m8_leland_taxi` | `m8_leland_taxi`, `objective obj_m8_25`, `objective obj_m8_1`, `m8_focus_choice`, `m8_roadhouse`, `objective obj_m8_2` | entry_condition, node `m9_verifica_taxi`, node `m9_cmp_taxi`, node `m9_present_truman` |

`ui_origin` values (from catalog / `diff-evidence-M8.json`):

- `E9A_LETTERA_O` → Il lago — la O sotto l'unghia di Maddy
- `E9B_STESSO_METODO` → Il lago — stessa incisione della R

### D.4 Propositions

| id | catalog `text` (verbatim) | `support_min` | `factual_ceiling` | `formulable_in` | written by (M8) | read by (M8) | read by M9 |
|---|---|---|---|---|---|---|---|
| `P7` | [IPOTESI] La ripetizione è legata alla famiglia Palmer. | `—` | — | M8 | — | — | node `m9_present_truman` |
| `P8` | Le lettere seguono una firma seriale che il diario associa a Robert. | `{"all_of":["E3_LETTERA_R","E9A_LETTERA_O","E9B_STESSO_METODO","E1_DIARIO"]}` | `corroborated` | M8 | `m8_cmp_diary/diary_a` | `objective obj_m8_35`, `m8_cmp_diary (completion_when)`, `objective obj_m8_4`, `m8_station`, `objective obj_m8_3` | node `m9_present_truman` |

Factual note on `P7`: the catalog gives it `formulable_in: "M8"` and `procedural: false`, but no node, choice or objective in `M8.json` writes or reads `P7`. Its only reader in the built data is M9 `m9_present_truman`.

`ui_short` (participant-facing) for the M8 propositions:

- `P7` → [Ipotesi] La ripetizione è legata alla famiglia Palmer.
- `P8` → Le lettere seguono una firma progressiva che il diario aveva annunciato. Resta ignoto se sia dell'assassino, di «lui», o una messinscena.
- `P7`.`procedural` → `false`
- `P7`.`hypothesis` → `true`
- `P8`.`unknown` → se la firma sia dell'assassino, di BOB, o una messinscena

P6 (formulated in M9, not M8) depends on `T_LELAND_TAXI`, which M8 writes:

- `P6.text`: Il racconto di Leland sulla partenza prevista di Maddy non trova riscontro: il taxi che dice di aver chiamato non risulta prenotato. Una discrepanza che riguarda la vittima e va chiarita di persona.
- `P6.support_min`: `{"all_of":["T_LELAND_TAXI","D_TAXI"]}`
- `P6.born_from_comparison`: `cmp_taxi` · `formulable_in`: `M9` · `confirmed_in`: `M10-B6`

### D.5 What M9 reads at entry and in nodes

`M9.entry_condition`: `{"all":[{"flag":"atto4"},{"node_done":"m8_station"},{"evidence":"T_LELAND_TAXI"}]}`

`M9.entry_note` (verbatim): [N] M9 comincia dove M8 finisce. T_LELAND_TAXI è stato ascoltato fisicamente al diner DOPO la promessa a Maddy e PRIMA del Roadhouse; M9 lo verifica, non lo crea retroattivamente. Il gate è la CONSEGNA di M8 (node_done m8_station, == M8.completion.when), il flag atto4 e quella testimonianza. NON è `atto5`: atto5 viene scritto dalla presentazione accettata (m9_present_truman), quando Leland passa alla centrale.

`M9.reads_only_from_m8.note` (verbatim): M9 LEGGE tre valori tipizzati scritti da M8 e non ne scrive nessuno. Le eco O e Sarah hanno copertura totale; warning_target produce una riga sulla valigia solo quando quella valigia esiste davvero (palmer), con silenzio intenzionale negli altri rami.

| value M9 reads | domain | `used_in` | `coverage` |
|---|---|---|---|
| `letter_o_observation_source` | `["cooper_primary","hawk_preserved"]` | m9_present_truman (pagine di nodo, prima del widget) | totale |
| `sarah_support_state` | `["none","vice"]` | m9_present_truman (ramo accettato) | totale |
| `warning_target` | `["palmer","centrale","nessuno"]` | m9_present_truman (ramo accettato, eco valigia) | palmer + assenza intenzionale non-palmer (nessuna valigia inventata) |
| `promise_stance` | `["accompagno","autonomia","prudenza"]` | m9_verifica_taxi (eco investigativa solo per accompagno) + m9_present_truman (taccuino degli orari) | totale; accompagno registra la doppia organizzazione, gli altri rami non inventano un accordo |

M9 nodes that touch M8-written ids:

- `m9_verifica_taxi` (beat B1) → `promise_stance`, `T_LELAND_TAXI`
- `m9_cmp_taxi` (beat B1) → `T_LELAND_TAXI`
- `m9_present_truman` (beat B2) → `warning_target`, `letter_o_observation_source`, `sarah_support_state`, `T_LELAND_TAXI`, `P8`, `P7`

## E. Comparison nodes in M8

### `m8_cmp_letters`

| field | value |
|---|---|
| conditions | `[{"evidence":"E9A_LETTERA_O"},{"evidence":"E3_LETTERA_R"},{"node_done":"m8_promise_echo"}]` |
| evidence pair compared | `E9A_LETTERA_O`, `E3_LETTERA_R` |
| `comparison_completion` | `node_commit` |
| node-level `result` | `LETTERS_SAME_METHOD` |
| `rules` | — |
| `completion_when` | — |
| effects | `[{"notebook_observation":{"id":"m8.obs.letters","text":"Le due lettere sembrano appartenere allo stesso metodo. Un ordine: prima la R, poi la O."}}]` |

`invariant` (verbatim): confronto senza scelte, completed al node commit (result LETTERS_SAME_METHOD); produce SOLO la nota di ordine/metodo, nessuna proposizione; nessuna identità della mano

`gate_note` (verbatim): i confronti del taccuino sono nascosti finché l'eco della promessa non è avvenuta (node_done:m8_promise_echo): protegge l'ordine drammaturgico D→E del Lock anche dopo crash/load, senza fare della promessa una causa della tragedia

### `m8_cmp_diary`

| field | value |
|---|---|
| conditions | `[{"evidence":"E9A_LETTERA_O"},{"evidence":"E1_DIARIO"},{"node_done":"m8_promise_echo"},{"node_done":"m8_cmp_letters"}]` |
| evidence pair compared | `E9A_LETTERA_O`, `E1_DIARIO` |
| `comparison_completion` | — |
| node-level `result` | — |
| `rules` | `{"attempt_scope":"comparison","hide_attempted_results":true,"track_assistance":false}` |
| `completion_when` | `{"proposition_path":"P8.formulation.status","equals":"formulated"}` |
| effects | — |

| choice id | result (reason code) | retry | label (verbatim) | effects | feedback text (verbatim) |
|---|---|---|---|---|---|
| `diary_a` | `PROGRESSIVE_SIGNATURE` | — | Le lettere seguono una firma progressiva che il diario aveva annunciato. | `[{"proposition":"P8","to":"formulated","created_from":["E3_LETTERA_R","E9A_LETTERA_O","E9B_STESSO_METODO","E1_DIARIO"]}]` | Le lettere seguono una firma progressiva che il diario aveva annunciato. Resta ignoto se la firma sia dell'assassino, di "lui", o una messinscena. |
| `diary_b` | `NAME_OVERREACH` | `true` | R+O compongono un nome. | `[]` | Due lettere non compongono niente. Un ordine e una promessa, forse. |
| `diary_c` | `HOUSE_OVERREACH` | `true` | Il diario accusa qualcuno di casa. | `[]` | Il diario nomina "lui". Non dice chi, né dove abita. |

`invariant` (verbatim): P8 nasce SOLO dal doppio confronto (A); factual_status ≤ corroborated (chi resta ignoto: assassino/«lui»/messinscena); B respinta (le due lettere non compongono un nome), C respinta (il diario non nomina chi né dove — P7 resta ipotesi non-procedurale); tentativi in comparisons[node].attempts

`gate_note` (verbatim): P8 non può saltare il primo confronto: il diario (che formula P8) è nascosto finché il confronto lettere R↔O non è committato (node_done:m8_cmp_letters). Gate: cmp_diary_hidden_before_cmp_letters, cmp_letters_commit_unlocks_cmp_diary, P8_cannot_bypass_first_comparison. Anche gated su m8_promise_echo (ordine D→E robusto dopo load).

## F. Notes, KNOWN-OPEN, TODO and allowlist entries about M8

### F.1 `tools/narrative/lint-allowlist.json`

Two entries, both in the `dangling` list (a key written but with no reader yet). No M8 entry
appears in `external_writers`, `external_writer_patterns`, `single_writer_flags`,
`write_once_values`, `documented_multiple_writers` or `known_open`.

```json
{ "key": "maddy_action_after_warning",
  "reason": "forward-referenced: reader is the unbuilt epilogue, narrative/schema-deltas/M8.md." }
{ "key": "letter_o_chain",
  "reason": "forward-referenced: reader is the unbuilt epilogue, narrative/schema-deltas/M8.md." }
```

The only `known_open` entry in the file concerns `P9.formulation.status`, not M8:
`"open TODO: design report §5 'give the register one reader'; owner Act 3 step C3."`

### F.2 `narrative/schema-deltas/M8.md` — §7 extensions still to implement (C8-B)

Verbatim list heading: **"Estensioni da implementare in C8-B (elenco)"**.

1. `value_transition` + catalogo `value_transitions` (§1: transizione controllata, prepare puro/commit transazionale/save-load, solo coppie dichiarate).
2. `from_derivation` (§3a: effetto derivato, RUNTIME; prepare risolve e congela, commit consuma; MAI legge al commit, MAI adapter).
3. `conditional_pages` (§3b: `condition` valutata e congelata in prepareNode).
4. Copertura DINAMICA della **matrice a 27 percorsi** (promise×warning×focus) eseguita DAL runtime esteso, con save/load a ogni passo; gate dell'ordine D→E (§3c: `discovery_continues_to_promise_echo`, `comparisons_hidden_before_promise_echo`, `promise_echo_cannot_be_skipped_after_load`, `cmp_diary_hidden_before_cmp_letters`, `cmp_letters_commit_unlocks_cmp_diary`, `P8_cannot_bypass_first_comparison`) e dell'obiettivo post-stazione (§3d: `station_objective_not_active_before_commit`).

Header warning at the top of the same file (verbatim):

> **Semantica unica.** Questo documento descrive UNA sola semantica viva — quella definitiva dopo le revisioni C8-A.1 (24→25) e C8-A.2. Le versioni precedenti (goto sul crocevia, «9 combinazioni», `letter_o` come metadato/adapter, catena O «in_situ solo se Cooper primo», `from_derivation` che legge al commit, guardia `not node_done` sulla stazione) sono **eliminate, non superate**: NON vanno implementate. Il changelog in §9 le registra come rimosse. Uno sviluppatore di C8-B segue esclusivamente §0-§7.

### F.3 `narrative/schema-deltas/M8.md` — §9 changelog (semantics REMOVED, do not implement)

- **C8-A.1 (24→25)** — rimosse: `goto` sul crocevia (B1: la route si cammina); `maddy_action_after_warning`/`sarah_support_state` come booleani (B2: stati nominali tipizzati); `letter_o_observation_source` come metadato laterale o scrittura d'adapter (B4: `from_derivation`, unica autorità); `completion` su `maddy_trovata` (B5: `node_done m8_station`); guardia `not node_done` su `m8_station` (B6: il repeat sarebbe irraggiungibile); catena O «in_situ solo se Cooper primo» (consolidata: `letter_o_chain=standard` in entrambe le versioni); «9 combinazioni» come contratto della matrice (→ 27 percorsi).
- **C8-A.2 (25→…)** — rimosse: `from_derivation` che «legge il sorgente al commit» (§3a: prepare risolve e congela, commit consuma); `mandatory_beat` come unica protezione dell'eco della promessa (§3c: `next` + gate `node_done`); `m8_cmp_diary` raggiungibile senza `m8_cmp_letters` (§3c: precedenza); `obj_m8_4` attivo prima della stazione (§3d: gate `node_done m8_station` + `obj_m8_35` intermedio).

### F.4 `narrative/schema-deltas/M8.md` — §4 the 27-path validator contract (verbatim)

> `promise_stance × warning_target × focus_destination` = 3×3×3 = **27 percorsi**, verificati uno a uno (la tabella causale fondamentale resta warning×focus = 9, ma servono 27 percorsi per provare che la promessa è DAVVERO ortogonale). In ogni percorso: `promise_stance`/`warning_target`/`focus_destination` write-once; la valigia/biglietto è visibile **se e solo se `warning_target=palmer`** (di persona in C se `focus=palmer`, via Truman in F se `focus=lago|diner`; con `warning=centrale|nessuno` NESSUNA pagina valigia in alcun percorso — mai «visibile in ogni percorso»); chi arriva al lago non è mai Sarah; `letter_o_chain=standard`; `letter_o_observation_source` = cooper_primary (lago) / hawk_preserved (altrimenti); il dialogo di Truman coerente; nessuna contraddizione con T0-T7; nessun percorso salva Maddy.

Suitcase visibility truth table (§3b, verbatim):

| warning | focus=palmer | valigia in C (route) | valigia in F (station) |
|---|---|---|---|
| palmer | sì | **sì** (`m8.c.route_palmer.p02`) | no |
| palmer | no | no | **sì** (`m8.f.station.p_valigia`) |
| centrale | qualunque | no | no |
| nessuno | qualunque | no | no |

### F.5 `docs/act-3-closure-report.md`

One M8 mention, in §16 "Recommended next milestone" (verbatim):

> First human test on Acts 1–3 (the quality-validation milestone the system defines). Before it: nothing mandatory. After it: M8/Act 4 design pass, OEJ native, M9 P7.

### F.6 `docs/story-truth-v0.1-population-report.md`

Four M8 mentions (verbatim):

- Line 11, PRIMARY STORY AUTHORITY row lists `M8 - Sta accadendo di nuovo (pacchetto).md` (re-lock R12) among the authorities.
- Line 17: "Authority order applied: human decisions > repository facts > adopted canon > approved adaptations > proposals > interpretations (Bible §0). Later explicit locks (M8 R12, M9–M10 §0) override older Bible wording where they say so."
- Line 37 (`revelations/`): "… → R6 signature points home (M8/M9 built, M10 unbuilt) → R7 fractured responsibility (M10 unbuilt)."
- Line 41: "`docs/story/setup-payoff-overview.md`: 19 rows. PAID 3 · INTENTIONAL-UNRESOLVED 9 · UNPAID 7. UNPAID with owners: the fire-motif Act 4 hook (M8 design pass: decide real hook or close the row), the M10 reads (letters/P8, Sarah's vision, the taxi lie, Jacques's branch claims — M10 pass), Maddy's ordinary moment and S2 (lead decisions). Per-act ledgers remain authoritative for page detail; Act 2 has no ledger of its own (gap, §14)."

Open findings table in the same report, rows naming M8 (verbatim cells):

| # | Finding | Evidence | Class | Owner |
|---|---|---|---|---|
| 2 | Classic `gerard_a4` "Lo ospita da vent'anni" vs locked "dodici anni" (childhood) | js/data.js:771; gated `atto4`, out of Acts 1–3 reach | **P1** (timeline duration) | Act 4 / M8 pass (migration of classic Act 4 lines) |
| 6 | Maddy's pie vs coach schedule | truth.md §6 #3 | P1 (two locks disagree; M8 says the Bible must be updated) | lead |

### F.7 Related M8 open items found outside the four requested files

Included because they are open decisions attached to M8; flagged as out-of-scope of the requested grep.

- `docs/story-truth-v0.1-maintenance-report.md:15` — "OLD CONFLICT: Bible §6 M8 / §8 Maddy \"[L] la torta che Laura odiava\" vs M8 package v1.1 \"[L SUPERSEDED] … scena degli orari della corriera\" (truth.md §6 row 3, left OPEN at population)." The same report records the conflict as resolved in favour of the coach-schedule scene, and states that Bible open item 4 ("posizione esatta") is closed by the M8 lock (diner, afternoon, T0).
- `docs/story/facts/maddy-body-lake.md:27` — "Actual current rendered acquisition: M8 `m8_discovery` (E9A_LETTERA_O, E9B_STESSO_METODO) — built."
- `docs/story/CHANGELOG.md:20` — setup-payoff row 17 (Maddy's ordinary moment) is "still UNPAID, owner M8 pass".
- `narrative/schema-deltas/M8-source-map.md` and `M8-validation-matrix.md` exist alongside the schema delta and carry per-node source rows and the validation matrix; not extracted here.
