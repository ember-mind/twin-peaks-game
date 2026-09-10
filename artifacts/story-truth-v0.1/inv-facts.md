# Story Truth Layer — Inventory of Facts & Evidence (ZERO-INVENTION)

Extracted only, no reconciliation. Sources: narrative/evidence.json, narrative/propositions.json,
narrative/state-enums.json, narrative/missions/{M4,M5,M6,M8,M9}.json, js/data.js,
js/narrative-production.js, artifacts/act-3-design/{fact-knowledge-ledger,evidence-map,setup-payoff-ledger}.md,
artifacts/act-2-nvs02/{design,pacing}.md, docs/act-2-closure-report.md, docs/act-3-closure-report.md.

---

## A. EVIDENCE TABLE

Source: `narrative/evidence.json` (full file) cross-referenced with mission node writers.

| id | human statement (label) | category (kind) | writer node(s) | rendered acquisition | supports (propositions) | act |
|---|---|---|---|---|---|---|
| E1_DIARIO | "il diario di Laura" | document | source doc World & Story Bible §4-E1; acquired_in M2 (pre-narrative-system: classic clue `diario`, dialogue `truman`, js/data.js:332-346, text "Nel registro cifrato: \"Dice che lascerà il suo nome un pezzo alla volta.\" Ricorre il nome ROBERT.") | M2 / classic `truman` dialogue | P1, P2, P8 (bridge_for P8) | 1-2 |
| E2_CUORE | "metà del pendaglio" | object | source §4-E2; acquired_in M2 (classic clue `cuore`, dialogues `laura_room`/`laura_room_andy`, js/data.js:395-419) | M2 / classic `laura_room` | P1, P2 | 1-2 |
| E3_LETTERA_R | "la lettera R" | object | source §4-E3; acquired_in M2 (classic clue `lettera_r`, same dialogues as E2_CUORE) | M2 / classic `laura_room` | P8 | 1-2 |
| E4_NOME | "un nome dimenticato al risveglio" | phantom | source §4-E4; acquired_in M3 (classic clue `nome_sussurrato`, dialogue `laura_sogno`, js/data.js:598-612, sets `sogno_fatto`) | M3 / classic `laura_sogno` | P4 | 2 |
| E5_POESIA | "la formula recitata da Gerard" | testimony_recited | M4 v1.1.1 LOCK §B3; M4 node `gerard_a2` — Gerard: "Attraverso il buio del futuro passato... il mago desidera vedere." / "Uno canta fra due mondi... FUOCO CAMMINA CON ME." (condition: flag `sogno_raccontato`; optional). Classic parallel: clue `poesia_fuoco`, dialogue `gerard_a2`, js/data.js:489-498 | M4 `gerard_a2` | P4 | 2 |
| E6A_CUORE_INTERO | "le due metà combaciano" | object | M4 §B4; M4 node `james_a2` — James: "Gliel'avevo data a febbraio. Al lago. Aveva riso — ha detto che i cuori interi portano sfortuna." action: "(Le unisce; le due metà combaciano...)" (condition: flag `sogno_raccontato`; mandatory_beat). Classic: clue `cuore_intero`, dialogue `james_a2`, js/data.js:552-561 | M4 `james_a2`; UI origin "Double R — il pendaglio ricomposto" | P2 (function: corroborazione della fonte / relazione) | 2 |
| T_JAMES_EST | "James: oltre il ponte, verso i binari" | testimony | M4 §B4; same node `james_a2` — James: "Oltre la strada a est. Dopo il ponte — dove finiscono le case e cominciano i binari." (invariant: "James non formula mai P2") | M4 `james_a2`; UI origin "Double R — testimonianza di James" | P2 (function: geografia) | 2 |
| T1_RONETTE_BOB | "Ronette grida BOB alla domanda sull'uomo" | testimony | M4 §B2-ronette_uomo; M4 node `ronette_uomo` — Ronette: "BOB. BOB. BOB." (invariant: "pronunciata SOLO da Ronette"; terminal choice `q_uomo` from `ronette_q`). Classic: flag `ronette_bob`, dialogue `ronette_letto`, js/data.js:475-487, "...BOB... BOB!" | M4 `ronette_uomo` | P4 | 2 |
| E7A_BIGLIETTO_TESTO | "FUOCO CAMMINA CON ME (inciso)" | object | M5-M6 LOCK §M5-B5; M5 node `m5_mound` — Notebook: "FUOCO CAMMINA CON ME." (condition: node_done m5_discovery; mandatory_beat; invariant: "unico writer di E7A/E7B; nessuna datazione tramite pioggia"). Classic: clue `biglietto_fuoco`, dialogue `mucchio_terra`, js/data.js:651-662, "Vi è scritto, a mano: \"FUOCO CAMMINA CON ME\". Macchie scure sui bordi." | M5 `m5_mound`; UI origin "Il vagone — il biglietto nel mucchio" | P3A | 3 |
| E7B_BIGLIETTO_POSIZIONE | "piegato in quattro, inserito nel mucchio, pieghe pulite" | observation | M5-M6 LOCK §M5-B5; same node `m5_mound` — Notebook: "Un biglietto piegato in quattro, nella terra. Pieghe interne pulite. Un lembo lasciato sopra la terra, alla luce. Nascosto a chi?" | M5 `m5_mound`; UI origin "Il vagone — il mucchio presso la porta" | P3A | 3 |
| E8A_ANELLO_POSIZIONE | "anello in piano al centro della traversa" | observation | M5-M6 LOCK §M5-B6; M5 node `m5_ring` — Notebook: "Un anello, in piano, al centro esatto della traversa." (condition: node_done m5_discovery; mandatory_beat). Classic: clue `anello`, dialogue `anello_interact`, js/data.js:664-674, "Un anello d'oro giace piatto sotto l'asse. Sembra il monile di Laura Palmer." | M5 `m5_ring`; UI origin "Il vagone — la traversa centrale" | P3A | 3 |
| E8B_ANELLO_SUPERFICIE | "polvere intatta, nessun segno di rotolamento" | observation | M5-M6 LOCK §M5-B6; same node `m5_ring` — Notebook: "La polvere intorno è intatta fino al bordo. Nessuna striscia, nessun percorso di caduta. Caduto, o fermato?". Classic: same clue `anello`, "polvere interrotta intorno, nessuna traccia di rotolamento." | M5 `m5_ring`; UI origin "Il vagone — la polvere intorno all'anello" | P3A | 3 |
| E_SCENE | "violenza ai bordi, centro senza passaggi" | observation | M5-M6 LOCK §M5-B7; M5 node `m5_scene` — Notebook: "I segni ai bordi. Il centro vuoto. Nessun trascinamento fra i due. Che cosa ha attraversato questo spazio, e come?" (invariant: "E_SCENE scritta SOLO qui... mai entrando nel vagone") | M5 `m5_scene`; UI origin "Il vagone — la disposizione della scena" | P3A | 3 |
| JACQUES_MIDNIGHT_CLAIM | "l'orario del merci di mezzanotte" | testimony | M5-M6 LOCK §M6-PROVA; M6 node `m6_interrogation_prova` — Jacques: "Col merci di mezzanotte. Chiedete ai binari, se sanno l'ora." (conditional m6_tactic=prova; provenance N→L delega 2026-07-22) | M6 `m6_interrogation_prova`; UI origin "One Eyed Jacks — Jacques al banco" | (evidence.json lists none; fact-knowledge-ledger row #9 ties to Jacques's third-man claim per tactic) | 3 |
| JACQUES_LIST_GIVEN | "quattro figure; la voce cala sui fiammiferi" | testimony | M5-M6 LOCK §M6-PRESSIONE; M6 node `m6_interrogation_pressione` — Jacques: "Il camionista della birra... quello del Roadhouse. Il barista, quello nuovo. Un ragazzo del paese che non nomino — ha una madre. E quello dei fiammiferi." / "Uno che accendeva e spegneva. Accendeva e spegneva. Senza mai fumare." (conditional m6_tactic=pressione; provenance N→L) | M6 `m6_interrogation_pressione`; UI origin "One Eyed Jacks — la lista di Jacques" | (none listed) | 3 |
| JACQUES_THIRD_MAN_DETAIL | "il terzo uomo guardava la stufa" | testimony | M5-M6 LOCK §M6-FALSA_SICUREZZA; M6 node `m6_interrogation_falsa` — Jacques: "(la risata cala) Non beveva. Guardava la stufa come si guarda una persona." (conditional m6_tactic=falsa_sicurezza; provenance N→L). NOTE (conflict, see §E): setup-payoff-ledger.md:12 quotes same line but omits "(la risata cala) Non beveva." | M6 `m6_interrogation_falsa`; UI origin "One Eyed Jacks — il terzo uomo al tavolo" | (none listed) | 3 |
| E9A_LETTERA_O | "una O incisa sotto l'unghia" | object | M8 v1.1 LOCK §D; M8 node `m8_discovery` — notebook: "Una O, incisa sotto l'unghia dell'anulare — stessa posizione e stesso tipo di incisione della R." (condition: value_set body_found_by, not flag maddy_trovata). Classic: clue `lettera_o`, dialogue `lago_maddy`, js/data.js:798-808, "Sotto l'unghia di Maddy: una O, dopo la R di Laura. Potrebbe essere una sequenza; non prova un nome né un'identità.", sets `maddy_trovata` | M8 `m8_discovery`; UI origin "Il lago — la O sotto l'unghia di Maddy" | P8 | 3-4 |
| E9B_STESSO_METODO | "stessa posizione e tipo di incisione della R" | observation | M8 v1.1 LOCK §D; co-written on M8 node `m8_discovery` (no separate label text; same effects/condition as E9A) | M8 `m8_discovery`; UI origin "Il lago — stessa incisione della R" | P8 | 3-4 |
| T_LELAND_TAXI | "«Ho chiamato la Twin Peaks Taxi» (Leland, prima del Roadhouse)" | testimony | M9-M10 CONFESSION LOCK §1; M8 node `m8_leland_taxi` — Leland: "Maddy prende la prima corriera domattina. Ho chiamato la Twin Peaks Taxi: passa da casa alle sette." (condition: value_set promise_stance, not evidence T_LELAND_TAXI). Classic: dialogue `leland_dove`, js/data.js:755, identical line; synced classic→narrative as `done_leland_dove` → T_LELAND_TAXI via `ensureEvidence` (js/narrative-production.js:147; comment: canonical new source is M8 node, M9 never writes it) | acquired_in field says "M8" though evidence.json header lists acquired_in "M8" | P6 | 3-4 |
| D_TAXI | "Twin Peaks Taxi: nessuna corsa prenotata per casa Palmer" | document | M9-M10 CONFESSION LOCK §M9-B1; M9 node `m9_verifica_taxi` — Lucy: "Ho chiamato la Twin Peaks Taxi. Nessuna corsa per casa Palmer alle sette. Nessuna prenotazione di Leland, né oggi né per domattina." (condition: evidence T_LELAND_TAXI, not evidence D_TAXI; provenance N→L) | M9 `m9_verifica_taxi` | P6 | 4 |
| E_PONTE_DIREZIONE | "paletto della contea sulla sponda del paese, assi consumate da quella parte" | observation | docs/act-3-design-report.md §12 A2; M5 node `m5_bridge` — Hawk: "Le altre sono più vecchie della pioggia. Portano a est, nessuna torna indietro." / "Il paletto l'ha messo la contea, tre giorni fa. La terra la leggo io. Il resto lo leggi tu." (no listed conditions; invariant: "unico writer di E_PONTE_DIREZIONE; nessuno dice «scappava verso il paese»: la direzione resta inferenza del giocatore") | M5 `m5_bridge`; UI origin "Il ponte — la sponda del paese" | (evidence.json: supports []) | 3 |
| E_TRACCE_EST | "le impronte passano il vagone ed entrano nel taglio a nord" | observation | docs/act-3-design-report.md §12 A14; M5 node `m5_tracks_north` — Hawk: "Dal cartello in poi il sentiero non serve altre proprietà. Un'ora di cammino. Finisce a One Eyed Jacks." (condition: value_set s1; mandatory_beat; invariant: "UNICO writer di east_route_confirmed e di E_TRACCE_EST") | M5 `m5_tracks_north`; UI origin "Il taglio a nord — oltre il vagone" | (evidence.json: supports []) | 3 |
| E_STUFA | "stufa fredda, cenere rastrellata in cerchio, un angolo di fiammiferi bruciato" | object | docs/act-3-design-report.md §12 A7; M5 node `m5_stove` (optional) — Notebook: "Stufa fredda. Cenere in cerchio, rastrellata. Un angolo di fiammiferi bruciato. Chi l'ha guardata spegnersi?" (condition: node_done m5_discovery; invariant: "unico writer di E_STUFA; facoltativo") | M5 `m5_stove`; UI origin "Il vagone — la stufa sulla parete di fondo"; also read at M6 `m6_interrogation_falsa` p06 (unchanged text) | (evidence.json: supports []) | 3 |
| E_CARTE | "mazzo umido sotto il sedile, taglio del mazziere ancora squadrato" | object | docs/act-3-design-report.md §12 A8; M5 node `m5_cards` (optional) — Notebook: "Carte umide sotto il sedile. Il taglio ancora squadrato. Cera a strati sul pavimento. Chi teneva il banco, e quante sere?" (condition: node_done m5_discovery; invariant: "facoltativo; nessuna testimonianza di Jacques qui: solo l'oggetto") | M5 `m5_cards`; UI origin "Il vagone — sotto il sedile divelto"; also read at M6 `m6_tactic` prompt page ("(Le carte del vagone erano tagliate così.)") and M6 `m6_p5` (optional pair with JACQUES_* for P5 support_strong) | P5 | 3 |

### A-continued: classic clue ids not mapped 1:1 to a narrative evidence id

Source: js/data.js (all `setClue` grants).

| classic clue id | granting dialogue | text (`desc`) | flag set alongside |
|---|---|---|---|
| diario | `truman`, js/data.js:332-346 | "Nel registro cifrato: \"Dice che lascerà il suo nome un pezzo alla volta.\" Ricorre il nome ROBERT." (L32) | none |
| cuore | `laura_room` / `laura_room_andy`, js/data.js:395-419 | "Un ciondolo a metà. Qualcuno conserva l'altra metà." (L53) | none |
| lettera_r | `laura_room` / `laura_room_andy`, js/data.js:395-419 | "Un frammento trovato sotto l'unghia di Laura." (L70) | none |
| nome_sussurrato | `laura_sogno`, js/data.js:598-612 | "Laura ha detto il nome dell'assassino. Al risveglio, era svanito." (L83) | sogno_fatto (L608) |
| poesia_fuoco | `gerard_a2`, js/data.js:489-498 | "\"Fuoco cammina con me.\" Il monco l'ha recitata in trance." (L104) | none |
| cuore_intero | `james_a2`, js/data.js:552-561 | "James custodiva l'altra metà del ciondolo di Laura." (L117) | none |
| biglietto_fuoco | `mucchio_terra`, js/data.js:651-662 | "Un brandello di carta nel vagone, accanto a un mucchio di terra." (L134) | none |
| anello | `anello_interact`, js/data.js:664-674 | "Era sotto un'asse del vagone. Perché l'assassino non l'ha preso?" (L155) | none |
| lettera_o | `lago_maddy`, js/data.js:798-808 | "Sotto l'unghia di Maddy: una O, dopo la R di Laura. Potrebbe essere una sequenza; non prova un nome né un'identità." (L184) | maddy_trovata (L807) |

Also: carryover evidence `T_SARAH_VISIONE` listed in M9 as `carryover_evidence` (not written by an M9 node) — source js/data.js dialogue `sarah_visione` (L735-743), gated on flag `sarah_visione_ascoltata`, marked `attachable_only: true, never_in_support_min: true`.

---

## B. PROPOSITION TABLE

Source: `narrative/propositions.json` (full) + mission node formulation/presentation data.

| id | statement | formulation writers (node + choice) | readers (conditions/presentations) | created_from | factual_status/other fields | act |
|---|---|---|---|---|---|---|
| P1 | "Laura conduceva una vita doppia." | formulable_in M2; support_min all_of[E1_DIARIO]; support_strong all_of[E1_DIARIO,E2_CUORE] | presentable: false | — | — | 1-2 |
| P2 | "Il pendaglio conferma che James aveva con Laura un rapporto privato. James colloca alcuni dei loro incontri oltre il ponte, verso i binari: una rotta investigativa da verificare." (ui_short: "James colloca alcuni incontri oltre il ponte, verso i binari. Il pendaglio conferma il rapporto da cui parla.") | M4 node `cmp_e6a_tjames` choice `b8_a` (label: "Conferma che James parlava da un rapporto privato realmente esistito."; result SOURCE_CORROBORATION); condition: evidence E6A_CUORE_INTERO, evidence T_JAMES_EST, node_done ronette_uomo; mandatory_beat | presented_to truman, presented_in M4, node `present_truman_m4`: result accepted, reason_code SUFFICIENT_RELEVANT_SUPPORT, acceptance_type investigatory_route; unlocks east_route, M5. Rejected alt choices at cmp_e6a_tjames: `b8_b` (GEOGRAPHIC_OVERREACH), `b8_c` (SYMBOLIC_OVERREACH) | born_from_comparison: cmp_e6a_tjames | — | 2 |
| P3A | "La posizione non è compatibile con una caduta casuale: una collocazione deliberata è la lettura più forte." (ui_short as-is) | M5 node `m5_cmp_ring` choice `ring_a` (label "Che non è caduto. È stato posato." result DELIBERATE_PLACEMENT); condition: evidence E8A_ANELLO_POSIZIONE, evidence E8B_ANELLO_SUPERFICIE; mandatory_beat; invariant "P3A nasce SOLO da questo confronto" | read at M5 `m5_report_intro` via `m5_final_theory` value: degeneration→Truman contests ("La polvere, Cooper. L'hai scritta tu..."); staging→accepted as Cooper's reading; open→both readings, "one fact". Rejected alts at m5_cmp_ring: `ring_b` (NO_ENTRY_OVERREACH), `ring_c` (OWNERSHIP_OVERREACH) | born_from_comparison: cmp_e8a_e8b (per propositions.json); mission node is named `m5_cmp_ring` | factual_ceiling: unconfirmed | 3 |
| P3B | "[IPOTESI] Il vagone è stato usato come scena preparata." | formulable_in M5 (not located as a distinct node in M5.json read; propositions.json only) | — | — | hypothesis: true; factual_ceiling: unconfirmed | 3 |
| P4 | "L'aggressore è associato al nome BOB." | formulable_in M4; support_min all_of[T1_RONETTE_BOB]; support_strong all_of[T1_RONETTE_BOB,E4_NOME,E5_POESIA] (no dedicated formulation node located in M4.json — T1_RONETTE_BOB and E5_POESIA are written at `ronette_uomo`/`gerard_a2` but P4 formulation node not found in M4/M5) | presentable: true | — | acceptance: "annotata, mai accettata come base" | 2 |
| P4B | "[IPOTESI] Il nome e il fuoco potrebbero riguardare lo stesso uomo." | M4 node `cmp_t1_e5` (formulate; created_from T1_RONETTE_BOB, E5_POESIA); condition: evidence T1_RONETTE_BOB, evidence E5_POESIA; optional; comparison_completion: node_commit | presented at M4 `present_truman_m4`: result rejected, reason_code PREMATURE_SYMBOLIC_LINK; repeat page Truman: "Me l'hai già mostrato. Non è cambiato niente." | born_from_comparison: cmp_t1_e5; requires [T1_RONETTE_BOB, E5_POESIA] | presentation_reason_code_if_presented: PREMATURE_SYMBOLIC_LINK; also a related unnamed M5 comparison `m5_cmp_ticket_e5` (result RECURRENCE_NOT_IDENTITY, notebook: "La stessa formula, detta in un letto e incisa in un vagone. Ricorrenza — non ancora identità.") does not confirm P4B (invariant: "P4B non confermata") | 2/3 |
| P5 | "Jacques può essere collocato sulla scena. La sua presenza non basta ad attribuirgli l'omicidio." | M6 node `m6_p5` choice `p5_present` (created_from jacques_admitted_presence); condition: flag jacques_admitted_presence | Rejected alts at m6_p5: `p5_killed` (ATTRIBUTION_OVERREACH), `p5_no_third_man` (UNSUPPORTED_BY_TACTIC, per-tactic feedback). Related comparison nodes `m6_cmp_cards_prova/_pressione/_falsa` (choice `cards_hand`, annotation only, does NOT formulate P5; condition evidence E_CARTE + branch evidence + jacques_admitted_presence); reject alt `cards_killer` ATTRIBUTION_OVERREACH | support_min all_of[jacques_admitted_presence] | never: "Jacques è innocente" | 3 |
| P6 | "Il racconto di Leland sulla partenza prevista di Maddy non trova riscontro: il taxi che dice di aver chiamato non risulta prenotato. Una discrepanza che riguarda la vittima e va chiarita di persona." | M9 node `m9_cmp_taxi` (auto on node_commit; formulate; created_from T_LELAND_TAXI, D_TAXI; reason TAXI_CLAIM_UNVERIFIED); condition: evidence T_LELAND_TAXI, evidence D_TAXI | presented_to truman at M9 `m9_present_truman`: case `complete` (both atoms attached) → accepted, reason SUFFICIENT_RELEVANT_SUPPORT, acceptance_type colloquio_necessario, sets atto5; case `missing_corroboration` → rejected, reason NO_CORROBORATION, Truman: "Una frase detta nel dolore non è una contraddizione. Fammi vedere la verifica."; case `_none_formulated` → rejected NOT_YET_FORMULATED | born_from_comparison: cmp_taxi | factual_path: [unconfirmed, confirmed_as_lie]; confirmed_in: M10-B6 | 4 |
| P7 | "[IPOTESI] La ripetizione è legata alla famiglia Palmer." | formulable_in M8 (no dedicated node located in M8/M9.json read) | presented at M9 `m9_present_truman`: result rejected, reason VALID_BUT_NOT_PROCEDURAL, Truman: "Lo tengo a mente. Ma non convoco un uomo per una teoria." | — | hypothesis: true; procedural: false | 3-4 |
| P8 | "Le lettere seguono una firma seriale che il diario associa a Robert." (ui_short: "Le lettere seguono una firma progressiva che il diario aveva annunciato. Resta ignoto se sia dell'assassino, di «lui», o una messinscena.") | M8 node `m8_cmp_diary` choice `diary_a` (PROGRESSIVE_SIGNATURE; created_from E3_LETTERA_R, E9A_LETTERA_O, E9B_STESSO_METODO, E1_DIARIO); condition: evidence E9A_LETTERA_O, evidence E1_DIARIO, node_done m8_promise_echo, node_done m8_cmp_letters. Preceded by non-proposition comparison `m8_cmp_letters` (LETTERS_SAME_METHOD, notebook_observation only) | presented at M9 `m9_present_truman`: result rejected, reason VALID_BUT_NOT_PROCEDURAL (same line as P7). Rejected alts at m8_cmp_diary: `diary_b` (NAME_OVERREACH), `diary_c` (HOUSE_OVERREACH) | support_min all_of[E3_LETTERA_R,E9A_LETTERA_O,E9B_STESSO_METODO,E1_DIARIO] | factual_ceiling: corroborated; unknown: "se la firma sia dell'assassino, di BOB, o una messinscena" | 3-4 |
| P9 | "La perdita di Jacques favorisce chiunque protegga il segreto, qualunque ne sia la causa." (ui_short as-is) | M6 node `m6_news` (auto, no choice; formulate; created_from jacques_dead, jacques_testimony_lost); condition: node_done m6_return_night, not jacques_dead | — | support_min all_of[jacques_dead, jacques_testimony_lost] | factual_ceiling: unconfirmed | 3 |
| P10_R7 | "La responsabilità è fratturata, non cancellata." | experienced_in M10 (not in M4/M5/M6/M8/M9 files read) | — | — | never_quantified: true | finale |

---

## C. FLAG TABLE (story-bearing only)

### C1. Narrative-system flags/values (missions M4-M9)

| flag | meaning as documented | writers | readers | classic↔narrative sync |
|---|---|---|---|---|
| sogno_fatto | mission entry condition (M4 requires it true) | classic dialogue `laura_sogno` (js/data.js:608) | M4 entry_condition | classic→narrative via `ensureFlag`, narrative-production.js:141-142 |
| sogno_raccontato | central act-2 gating flag: once dream told to Truman, hospital/diner visits open | M4 `truman_a2` (set on choice) | M4 `ronette_attesa`,`infermiera_attesa`,`gerard_attesa`,`james_attesa` (not-flag gate before), `ronette_q`,`gerard_a2`,`james_a2`,`present_truman_m4` (flag-present gate) | narrative-only (not in classic sync list read) |
| atto3 | M4 completion effect once P2 accepted_by truman | M4 `completion.sets` when P2.social_status.accepted_by contains truman | M5 entry_condition.all; classic dialogue `truman_atto3` (js/data.js:624-632) also sets classic atto3 independently | bidirectional: classic→narrative (:141-142) and narrative→classic `classicFlags.atto3` (:151) |
| ronette_visita | marks Ronette visit occurred | M4 `ronette_q` effects | — | not in sync list read |
| vagone_scoperto | discovery-of-scene gate | M5 `m5_discovery` | M5 `m5_hawk_bridge` (not-flag), `m5_hawk_door` (flag), objectives obj_m5_1/obj_m5_2 | not in sync list read |
| east_route_confirmed | "UNICO writer... aggiunge SOLO il fatto specifico del vagone, mai «nessuna torna indietro»"; mission completion flag | M5 `m5_tracks_north` | M5 `m5_report_intro` repeat_when, `m5_sign_oej` conditions, completion.when, objectives obj_m5_6/obj_m5_7 | narrative→classic (:155-157); comment: classic door `traincar 21,0`→`oej` reads this; act-3-closure-report §10 defect #2: this sync was missing in production playthrough and was fixed by adding it to `syncNarrativeToClassic` |
| m5_initial_theory (value) | "Prima lettura?" theory role | M5 `m5_theory_initial` (choices theory_degeneration/theory_withhold) | M5 `m5_theory_revision`/`m5_theory_first` conditions, milestones | — |
| m5_final_theory (value) | final theory domain | M5 `m5_theory_revision`/`m5_theory_first` | M5 `m5_report_intro` pages_by_value, objectives, milestones resolved_when; M6 `m6.b8.news.cooper_impeto` conditional page (Cooper: "Avevo scritto impeto, Harry... un cuscino aspetta.") | — |
| s1 (value: institutional/documented_custody) | write-once, mai giudicata; "il significato dell'anello non è detto... letto più tardi da m6_atto4_bridge (R3)" | M5 `m5_s1` (choices s1_institutional→institutional, s1_documented→documented_custody) | M5 `m5_hawk_door`,`m5_tracks_north_early`,`m5_tracks_north`,`m5_hawk_cut`; objectives obj_m5_5/obj_m5_6; M6 `m6.b9.atto4.s1_safe`/`s1_pocket` conditional pages | — |
| m6_tactic (value: prova/pressione/falsa_sicurezza) | "Una sola tattica per playthrough (immutabile)"; write-once | M6 `m6_tactic` | M6 `m6.b8.news.pages_by_value` (Cooper's reaction line), m6_interrogation_* nodes, m6_cmp_cards_* nodes | — |
| jacques_admitted_presence | "tutti scrivono jacques_admitted_presence, mai l'omicidio" — admission of presence only, never murder | M6 `m6_interrogation_prova`/`_pressione`/`_falsa` (all three write it) | M6 `m6_p5` (condition) | — |
| jacques_preso | unico writer; "nessuna attribuzione dell'omicidio" | M6 `m6_arrest` | M6 objectives, `m6_hospital_guard`, `m6_return_night*`, `m6_news` | narrative→classic `classicFlags.jacques_preso` (:154) |
| jacques_dead | invariant: "la fine critica scrive SOLO jacques_dead + jacques_testimony_lost (+ P9); MAI jacques_death_suspicious, MAI jacques_murder_confirmed/attributed" | M6 `m6_news` | M6 objectives obj_m6_5/obj_m6_6, `m6_hospital`, `m6_atto4_bridge` | narrative→classic `classicFlags.jacques_morto` (:158) |
| jacques_testimony_lost | co-written with jacques_dead; feeds P9 | M6 `m6_news` | P9 formulation condition | — |
| jacques_death_suspicious | "unico writer... formulated, factual_status unconfirmed — SOLO qui"; optional tail node | M6 `m6_hospital` | M6 `m6_atto4_bridge.register` conditional page — Truman: "Il registro dice nessuno. Allora era qualcuno che non firma." | — |
| gigante1 | (content not re-quoted in mission files; classic dialogue `gigante1_dlg` js/data.js:696-707: "È successo di nuovo. E accadrà ancora." / "I gufi non sono ciò che sembrano." / "Senza sostanze chimiche, lui torna.") | classic `gigante1_dlg` | M6 objectives, `m6_atto4_bridge` (gates act 4 bridge to M8) | classic→narrative (:141-142) |
| atto4 | "atto4 nasce solo dopo l'ultima pagina e apre M8 senza fallback legacy" | M6 `m6_atto4_bridge`; classic dialogue `truman_atto4` (js/data.js:710-718) independently | M8, M9 entry_condition | bidirectional (:141-142, :152) |
| audrey_indaga | gates optional Audrey node | classic dialogues `audrey_a2`/`audrey_a2_ben` (js/data.js:454-467) | M6 `m6_audrey` condition | classic→narrative (:141-142; comment :138-140 explains bridge unlocks node m6_audrey) |
| audrey_vista_oej | unico writer; Truman line about "la nuova del guardaroba" | M6 `m6_audrey` | M6 `m6.b7b.night.audrey` | — |
| promise_stance (value: accompagno/autonomia/prudenza) | write-once; "nessuna opzione «giusta»" | M8 `m8_diner` | M8 `m8_leland_taxi` (per-branch dialogue), `m8_promise_echo` (pages_by_value), objectives; M9 `m9_verifica_taxi.accompagno` branch, `m9_present_truman` | — |
| warning_target (value: palmer/centrale/nessuno) | write-once; "intenzione non comando" | M8 `m8_roadhouse` | M8 `m8_route_palmer` conditional page, `m8_station` (valigia conditional page); M9 `m9_present_truman.accept.valigia.truman` — Truman: "E la valigia era ancora nell'ingresso, con il biglietto per Sarah. Questo lo so io." (only if palmer) | — |
| maddy_action_after_warning (value: departure_prepared/none) | tied to warning choice | M8 `m8_roadhouse` | — | — |
| sarah_support_state (value: none/vice) | "stato NOMINALE" | M8 `m8_roadhouse` | M8 `m8_station.pages_by_value`; M9 `m9_present_truman.accept.sarah.vice/.none` (Lucy's "Andy è ancora con Sarah..." vs Truman rising with hat) | — |
| presagio_status (value: active/verified) | "active nasce al Roadhouse... verified nasce SOLO al ritrovamento; mai inversa" | M8 `m8_roadhouse` (→active); `m8_discovery` (value_transition active→verified) | M8 obj_m8_2 | — |
| focus_destination (value: palmer/lago/diner) | write-once; "NESSUN goto" | M8 `m8_focus_choice` | — | — |
| body_found_by (value: hawk/hawk/cooper) | drives m8_discovery pages_by_value | M8 `m8_route_palmer`/`_lake`/`_diner` | M8 `m8_discovery` | — |
| letter_o_chain (value: standard) | "sempre" per invariant | M8 `m8_discovery` | — | — |
| letter_o_observation_source (value: cooper_primary/hawk_preserved) | derived effect, frozen at prepareNode, never re-read at commit | M8 `m8_discovery` (from_derivation of body_found_by) | M9 `m9_present_truman.eco_o.cooper/.hawk` conditional pages | — |
| maddy_trovata | unico writer [P] | M8 `m8_discovery`; classic dialogue `lago_maddy` (js/data.js:807) independently | M8 objectives, `m8_promise_echo` | bidirectional (:141-142, `classicFlags.maddy_trovata` :159; also `classicFlags.narrative_m8_owned` :160-162, comment: "M8 narrativa possiede Maddy e Leland: i duplicati classici a Palmer restano nascosti") |
| atto5 | "atto5 nasce QUI (unico writer): il mondo classico diventa vero — Leland alla centrale" | M9 `m9_present_truman` complete-branch effects; classic dialogue `truman_atto5` (js/data.js:815-824) independently | M9 `m9_arrivo` condition; plus `leland` NPC world-gate `flag:atto5 && !flag:leland_morto` | bidirectional (:141-142, :153) |
| sarah_visione_ascoltata | data.js-origin flag; "Nessun atto4 implicito concede conoscenza al player" | classic dialogue `sarah_visione` (js/data.js:735-743) | carryover_evidence entry gate for T_SARAH_VISIONE (M9) | classic→narrative (:141-142) |
| leland_morto | — | classic dialogue `leland_morte` (js/data.js:847-861) | `leland` NPC world-gate condition | classic→narrative (:141-142); narrative→classic `classicFlags` not explicitly listed beyond `atto5` combo |
| state.nodes_done.m8_roadhouse | — | M8 `m8_roadhouse` node completion | — | narrative→classic `classicFlags.gigante2` (:163) |

### C2. Classic-only flags (js/data.js `setFlag`, story-bearing)

| flag | dialogue id:line | value | context |
|---|---|---|---|
| audrey_indaga | `audrey_a2` L454-460 / `audrey_a2_ben` L461-467 | true | Audrey: "Al telefono di mio padre risponde la segretaria. Le lascio un messaggio?" |
| ronette_bob | `ronette_letto` L475-487 | true | Ronette: "...BOB... BOB!" |
| double_r_visitato | `norma` L502-515 | true | Norma: "Chieda a Shelly. Io servo caffè." |
| shelly_bobby | `shelly_bobby` L530-537 | true | Shelly: "Se l'orario glielo dà lui, è un orario. Se glielo do io, è una denuncia." |
| met_mfap | `mfap` L579-591 | true | MFAP dream first encounter, Red Room |
| sogno_fatto | `laura_sogno` L598-612 | true | Laura's shadow whispers name to Cooper |
| atto3 | `truman_atto3` L624-632 | true | Truman: "One Eyed Jacks. Poi il vagone del treno. Domani passiamo il confine." |
| jacques_morto | `lucy_a3` L679-687 | true | Lucy: "Jacques Renault... soffocato nel suo letto." |
| gigante1 | `gigante1_dlg` L696-707 | true | Giant's three warnings delivered |
| atto4 | `truman_atto4` L710-718 | true | Truman: "Allora qualcuno teme ciò che Jacques sapeva." |
| sarah_visione_ascoltata | `sarah_visione` L735-743 | true | Sarah: "BOB. È il nome che mi viene. Non so da dove." |
| maddy_trovata | `lago_maddy` L798-808 | true | Cooper: "Maddy Ferguson. Con due D." + letter O found |
| atto5 | `truman_atto5` L815-824 | true | Truman: "E Maddy era a casa Palmer." → decision to bring in Leland |
| leland_confessa | `leland_interr` L833-845 | true | Leland: "Laura e Maddy le ho uccise io. BOB è dentro di me dall'infanzia..." |
| leland_morto | `leland_morte` L847-861 | true | "Il respiro di Leland si spezza. Poi non riprende." |
| mfap_finale_visto | `mfap_finale` L871-879 | true | MFAP: "È LUI che stai cercando?" |

### C3. Full sync table, js/narrative-production.js:141-163

| classic id | narrative id | direction | file:line |
|---|---|---|---|
| sogno_fatto | sogno_fatto | classic→narrative | :141-142 |
| atto3 | atto3 | classic→narrative | :141-142 |
| atto4 | atto4 | classic→narrative | :141-142 |
| atto5 | atto5 | classic→narrative | :141-142 |
| gigante1 | gigante1 | classic→narrative | :141-142 |
| maddy_trovata | maddy_trovata | classic→narrative | :141-142 |
| leland_morto | leland_morto | classic→narrative | :141-142 |
| sarah_visione_ascoltata | sarah_visione_ascoltata | classic→narrative | :141-142 |
| audrey_indaga | audrey_indaga | classic→narrative | :141-142 |
| done_leland_dove | T_LELAND_TAXI (evidence, via ensureEvidence) | classic→narrative | :147 (comment :144-146: "il vecchio dialogo classico vale come testimonianza"; canonical source is node m8_leland_taxi, M9 never writes it) |
| state.flags.atto3 | classicFlags.atto3 | narrative→classic | :151 |
| state.flags.atto4 | classicFlags.atto4 | narrative→classic | :152 |
| state.flags.atto5 | classicFlags.atto5 | narrative→classic | :153 |
| state.flags.jacques_preso | classicFlags.jacques_preso | narrative→classic | :154 |
| state.flags.east_route_confirmed | classicFlags.east_route_confirmed | narrative→classic | :155-157 (comment: classic door `traincar 21,0`→`oej` reads this; only writer is narrative node m5_tracks_north) |
| state.flags.jacques_dead | classicFlags.jacques_morto | narrative→classic | :158 |
| state.flags.maddy_trovata | classicFlags.maddy_trovata | narrative→classic | :159 |
| state.flags.atto4 | classicFlags.narrative_m8_owned | narrative→classic | :160-162 |
| state.nodes_done.m8_roadhouse | classicFlags.gigante2 | narrative→classic | :163 |

No E1_DIARIO-style evidence sync or proposition sync found in js/narrative-production.js beyond the T_LELAND_TAXI row above.

---

## D. CLAIMS BY CHARACTER IN RENDERED TEXT

Only characters that appear making case-relevant statements are listed. "Small talk" excluded.

### LAURA (as diary quote / shadow)
- M8 `m8.e.cmp_diary.p02`: diary quote — "«Ha un nome da persona perbene.»" — feeds P8 formulation.
- M8 `m8.e.cmp_diary.p02b`: diary quote — "«Dice che me lo darà un pezzo alla volta, come le cose che non si possono restituire.»" — feeds P8 formulation.
- classic `laura_finale2`, js/data.js:890-891 — Ombra di Laura: "Non cancellare quel nome." (referring to Leland Palmer's signature) — sets `end: true`.

### RONETTE
- M4 `ronette_uomo`: "BOB. BOB. BOB." — writes T1_RONETTE_BOB.
- classic `ronette_letto`, js/data.js:479 — "...BOB... BOB!" — sets flag `ronette_bob`.

### JAMES
- M4 `james_a2`: "Gliel'avevo data a febbraio. Al lago. Aveva riso — ha detto che i cuori interi portano sfortuna." — writes E6A_CUORE_INTERO.
- M4 `james_a2`: "Non l'ho più vista ridere così, dopo."
- M4 `james_a2`: "Non in paese. Qui una macchina parcheggiata diventa una storia prima di sera." (contextual, feeds T_JAMES_EST)
- M4 `james_a2`: "Oltre la strada a est. Dopo il ponte — dove finiscono le case e cominciano i binari." — writes T_JAMES_EST.
- M4 `james_a2`: "Se là fuori c'è qualcosa, agente... io gliel'ho indicato. Non me lo racconti mai."
- classic `james_a2`, js/data.js:554-556 — "Ho un video. Il picnic, quello di cui parla Donna." / "Laura ne portava metà. L'altra metà è mia." — gives clue `cuore_intero`.

### JACQUES
- M6 `m6.b5.prova.p04/p05/p07/p09` (tactic=prova): "C'ero. Giocavamo. Questo è tutto quello che dico." / "Se volete una firma, portatemi un avvocato e riportatemi il foglio." / "Col merci di mezzanotte. Chiedete ai binari, se sanno l'ora." / "(mescola) L'avvocato, agente. Poi il foglio. Poi vediamo chi restava." — writes jacques_admitted_presence, JACQUES_MIDNIGHT_CLAIM.
- M6 `m6.b5.pressione.p02/p04/p05/p07/p09` (tactic=pressione): "(alza le mani, ride male) Piano, agente. Piano. Quella notte al vagone c'ero, sì — ma c'era mezzo mondo." / "Il camionista della birra, quello del Roadhouse. Il barista, quello nuovo. Un ragazzo del paese che non nomino — ha una madre. E quello dei fiammiferi." / "(Sulla parola \"fiammiferi\" la voce cala. Le mani smettono di muoversi.)" / "Uno che accendeva e spegneva. Accendeva e spegneva. Senza mai fumare." / "(le mani ferme) Quella notte... (si riprende) Quella notte io tenevo il banco e guardavo le carte. Le facce, chiedetele alle carte." — writes jacques_admitted_presence, JACQUES_LIST_GIVEN.
- M6 `m6.b5.falsa.p02/p04/p06/p08` (tactic=falsa_sicurezza): "(ride) Chi gliel'ha detto sapeva stare al tavolo?" / "Io. Io tengo sempre il banco — anche fuori di qui. Anche al vagone si giocava, quella notte, e il banco era mio." / "(la risata cala) Non beveva. Guardava la stufa come si guarda una persona. (pausa) Io i tipi così li lascio guardare." / "(raccoglie le fiches) Questa è una domanda da tavolo alto, agente. Si gioca un'altra sera." — writes jacques_admitted_presence, JACQUES_THIRD_MAN_DETAIL.
- M6 `m6.b7.arrest.p05`: "Un foglio. Poi torno. (al traghetto) Il fiume ha due lati, agente. Ricordatevelo quando lo riattraversate."

### LELAND
- M8 `m8.b0.leland_taxi.p01`: "Maddy prende la prima corriera domattina. Ho chiamato la Twin Peaks Taxi: passa da casa alle sette." — writes T_LELAND_TAXI.
- M8 `m8.b0.leland_taxi.accompagno.p02` (only if promise_stance=accompagno): "Sarah si tranquillizza se c'è un'auto davanti. Aspetterà fino alle sette e dieci. Il suo accompagnamento resta, agente."
- M9 `m9.b3.arrivo.p04`: "(a Truman) Harry. Mi hai chiesto di chiarire una partenza. Le partenze, di questi tempi, sono la cosa più difficile da chiarire."
- M9 `m9.b3.arrivo.p06`: "(posa il cappotto, siede al centro esatto della sedia) Allora facciamola bene."
- classic `leland_dove`, js/data.js:755: "Maddy prende la prima corriera domattina. Ho chiamato la Twin Peaks Taxi: passa da casa alle sette." (referenced by narrative-production.js as `done_leland_dove`)
- classic `leland_interr`, js/data.js:836-841 — LELAND: "Laura e Maddy le ho uccise io. BOB è dentro di me dall'infanzia; il mio nome resta sul verbale." — sets `leland_confessa`. (NOTE: M9 explicitly states no confession content occurs in M9; confession is M10-scoped per node `m9_arrivo` invariant: "NESSUN segnale BOB in M9 (i due segnali — ritratto e cambio di registro — esistono SOLO in M10-B5).")

### SARAH
- classic `sarah`, js/data.js:382-383: "Era in fondo al corridoio. Capelli lunghi. Chino sul letto di Laura." / "Quando ho acceso la luce non c'era nessuno. Ma il sorriso è rimasto."
- classic `sarah_visione`, js/data.js:737-739: "Il divano era vuoto. Poi c'era un uomo accovacciato..." / "Capelli grigi. Lo stesso sorriso che vedo quando chiudo gli occhi." / "BOB. È il nome che mi viene. Non so da dove." — sets `sarah_visione_ascoltata`.

### MADDY
- classic `maddy_a4`, js/data.js:724: "Sono Maddy. Non Laura."

### AUDREY
- classic `audrey_a2`, js/data.js:455: "Laura lavorava al banco profumi. Qui, nella hall. Il turno lo firmava mio padre." — sets `audrey_indaga`.

### BEN
- classic `benhorne_a2`, js/data.js:449: "Laura Palmer era una ragazza perbene. Di quello che faceva la sera non so nulla. Nulla."

### TRUMAN
- M4 `truman_a2`: "Se torna, lo mettiamo a verbale. Per ora abbiamo persone sveglie." / "Sarah ha detto capelli lunghi. E il sorriso. Se fosse di qui, avrei già un nome." / "Ronette si è svegliata stanotte. Non parla — ma è sveglia." / "E James è al Double R da stamattina. Norma dice che non tocca il caffè."
- M4 `present_truman_m4`: "Il pendaglio dice che James parlava da dentro. La strada resta da controllare." / "Dopo il ponte non ci sono case. C'è il ponticello di legno dove hanno raccolto Ronette, la notte di Laura." / "Da est. Hawk è già al ponte. Non toccate niente, nessuno dei due." / Truman on P4B: "Me l'hai già mostrato. Non è cambiato niente." / on none-formulated: "Non ho ancora un nesso da giudicare. Cosa collega le tue visite?"
- M5 `m5_report_intro` (degeneration branch): "La polvere, Cooper. L'hai scritta tu: intatta fino al bordo. Cosa la tiene al centro?" / "Allora a verbale vanno i fatti. La lettura resta tua." (staging branch): "La lettura la verbalizziamo come tua. I fatti come nostri." (open branch): "Due letture, tutte e due a nome tuo. I fatti, uno solo: il nostro." / "(guarda l'anello senza toccarlo) Questo va nella cassaforte delle prove. Stasera."
- M5 `m5_report_close`: "Prima che faccia buio. Se il sentiero va dove penso, laggiù il banco lo tiene Renault. Io resto con l'anello e con il verbale."
- M6 `m6.b9.atto4.p02/register/p04`: "Un gigante non so dove metterlo. Jacques sì: qualcuno ha superato un piantone." / "Il registro dice nessuno. Allora era qualcuno che non firma." / "Se qualcuno temeva ciò che Jacques sapeva, ora abbiamo perso il modo di verificarlo."
- M9 `m9.b2.p6.accept.p02/p04/p05/p06`: "Il lutto confonde, Cooper. Un uomo che ha perso la figlia—" / "(pausa lunga) La compagnia può aver perso la corsa." / "Può. Allora lo chiariamo: di persona, con calma, da persona informata. È il suo diritto — ed è il nostro lavoro." / "Lo chiamo io. A casa sua non mando nessuno con la divisa."
- M9 `m9.b2.p6.accept.valigia.truman` (only if warning_target=palmer): "E la valigia era ancora nell'ingresso, con il biglietto per Sarah. Questo lo so io."
- classic `truman`, js/data.js:334-338: "Agente Cooper. Harry Truman. Il diario di Laura: l'ho letto io, stanotte. Non avrei dovuto. Conosco ogni nome che c'è dentro." / "Nelle pagine cifrate c'è un «lui». E un nome che qui non è di nessuno: ROBERT." / "Sarah Palmer. Ha chiamato due volte: c'era qualcuno in casa, dice. Con me non riesce a finire la frase." / "E il Double R. Laura portava i pasti a domicilio per Norma." — gives clue `diario`.
- classic `truman_atto5`, js/data.js:815-820: "E Maddy era a casa Palmer." — sets `atto5`.

### HAWK
- M5 `m5_bridge`: "(raggiungendolo) Truman mi manda a farti da ombra. Da qui in poi le impronte sono mie e tue." / "Le altre sono più vecchie della pioggia. Portano a est, nessuna torna indietro." / "Il paletto l'ha messo la contea, tre giorni fa. La terra la leggo io. Il resto lo leggi tu." — writes E_PONTE_DIREZIONE.
- M5 `m5_tracks_north`: "Dal cartello in poi il sentiero non serve altre proprietà. Un'ora di cammino. Finisce a One Eyed Jacks." — writes E_TRACCE_EST, east_route_confirmed.
- M8 `m8.d.discovery.hawk.p02`: "L'ho trovata io. Non l'ho mossa. Non ho toccato le mani. Guarda l'anulare."
- classic `hawk`, js/data.js:363: "Stanotte non ho sentito animali. Solo passi. Si fermavano quando mi fermavo io."
- classic `hawk_a2`, js/data.js:369: "Ha dormito con le scarpe. Si vede da come poggia i piedi."

### LUCY
- M6 `m6.b8.news.p02/p03`: "Jacques Renault... soffocato nel suo letto. Un cuscino. Nessun testimone." / "Chi entra ed esce da un ospedale senza farsi notare, agente? Chi?" — writes jacques_dead, jacques_testimony_lost.
- M9 `m9.b1.verifica.p03`: "(solleva la cornetta. Tre minuti dopo:) Ho chiamato la Twin Peaks Taxi. Nessuna corsa per casa Palmer alle sette. Nessuna prenotazione di Leland, né oggi né per domattina." — writes D_TAXI.
- classic `lucy_a3`, js/data.js:682-683: "Jacques Renault... soffocato nel suo letto. Un cuscino. Nessun testimone." — sets `jacques_morto`.

### GERARD (MIKE)
- M4 `gerard_a2`: "Attraverso il buio del futuro passato... il mago desidera vedere." / "Uno canta fra due mondi... FUOCO CAMMINA CON ME." — writes E5_POESIA.
- classic `gerard_a2`, js/data.js:493-494: "...Attraverso l'oscurità del futuro passato... il mago desidera vedere." / "FUOCO CAMMINA CON ME." — gives clue `poesia_fuoco`.
- classic `gerard_a4`, js/data.js:771: "BOB è vicino. Una casa di legno, circondata da alberi. Lo ospita da vent'anni."

### GIANT
- M8 `m8.b.roadhouse.p04`: "Sta accadendo di nuovo." — sets presagio_status→active.
- classic `gigante1_dlg`, js/data.js:700-702: "È successo di nuovo. E accadrà ancora." / "I gufi non sono ciò che sembrano." / "Senza sostanze chimiche, lui torna." — sets `gigante1`.

### BOB
- classic `leland_interr`, js/data.js: BOB: "Hai il tuo bavaglio, agente? Vuoi giocare... col FUOCO?"
- classic `bob_finale`, js/data.js:883-884: "Leland era solo un guanto. La mano... è ancora qui." / "Ci rivedremo, agente. Noi ci rivediamo SEMPRE."

### LOG LADY
- classic `loglady`, js/data.js:546-547: "Il mio ceppo ha visto qualcosa, quella notte. Lui vede sempre tutto." / "Attenzione al fuoco che cammina con me."
- classic `loglady_a4`, js/data.js:779: "Il mio ceppo dice: stanotte, al roadhouse. Le civette sono già lì."

### NORMA
- classic `norma`, js/data.js:506-508: "Laura portava i pasti a domicilio per me. Il giovedì. Tutti le volevano bene. O quasi." / "Chieda a Shelly. Io servo caffè." — sets `double_r_visitato`.

### SHELLY
- classic `shelly`, js/data.js:524-525: "Bobby veniva da me quando diceva di essere con Laura. E da Laura quando diceva di essere con me." / "Se gli chiedevo di lei, prima controllava la porta."
- classic `shelly_bobby`, js/data.js:532-533: "Con me. Non tutta la notte." / "Se l'orario glielo dà lui, è un orario. Se glielo do io, è una denuncia." — sets `shelly_bobby`.

### BOBBY
- classic `bobby`, js/data.js:294-297: "Io non c'entro NIENTE, chiaro?! Chieda a Donna chi vedeva Laura di nascosto. Io ero con Shelly, quella notte."
- classic `bobby_shelly`, js/data.js:541: "Shelly dice un sacco di cose quando ha paura."

### DONNA
- classic `donna`, js/data.js:302: "Ho un video del picnic: Laura che ride, per l'obiettivo di James."

### JACOBY
- classic `jacoby`, js/data.js:309,311: "Laura mentiva bene. Non per gioco: cambiava risposta appena prendevo la penna." / "Quella resta tra medico e paziente. La penna no: appena la prendevo, Laura cambiava versione."

### COOPER (self-statements bearing on case facts, for completeness)
- M4 `truman_a2`: "Harry. Stanotte ho sognato una stanza rossa. Laura era lì." / "Mi ha detto un nome all'orecchio. L'ho portato fino alla porta. Poi niente." / "C'era anche un uomo. Capelli lunghi, grigi. Sorrideva mentre nessun altro lo faceva." — sets sogno_raccontato.
- M5 `m5_ring`: "Centro esatto, polvere intatta. Prima di chiedere di chi fosse, annotiamo come stava qui."
- M5 `m5_stove`: "Fuoco. Qualcuno l'ha guardato spegnersi." / (conditioned on node_done m5_cards) "Cera a strati sotto il sedile, cenere a strati qui. Non è stata una sera sola."
- M5 `m5_cards`: "Qui qualcuno teneva il banco." / (conditioned on node_done m5_stove) "Cenere a strati nella stufa, cera a strati qui. Più di una sera."
- M8 `m8.d.discovery.cooper.p02/p03`: "(fermo) Signorina Ferguson. Maddy. Con due D." / "(Si china senza toccare. Sotto l'unghia dell'anulare: un segno.)"
- classic `anello_interact`, js/data.js:667-668: "Un anello d'oro giace piatto sotto l'asse. Sembra il monile di Laura Palmer." / "polvere interrotta intorno, nessuna traccia di rotolamento." — gives clue `anello`.
- classic `lago_laura`, js/data.js:789-790: "Qui l'hanno trovata. Non qui l'hanno uccisa: i giunchi sono intatti, nessuno ha lottato su questa sabbia." / "Chi l'ha lasciata sapeva di non essere visto."
- classic `lago_maddy`, js/data.js:802-804: "Maddy Ferguson. Con due D." / "Sotto l'unghia: una lettera. La \"O\"." / "R, poi O. Potrebbe essere l'inizio di una firma." — gives clue `lettera_o`, sets maddy_trovata.
- classic `leland_morte`, js/data.js:854: "Ora del decesso, 2:30. Sigilliamo la cella; l'acqua resta parte della scena." — sets leland_morto.
- M9 `m9.b3.arrivo.p07`: "Diane. Nodo perfetto, barba di tre giorni. Due righe separate."

---

## E. CONFLICTS

1. **E8A_ANELLO_POSIZIONE detail level.** `narrative/evidence.json` label: "anello in piano al centro della traversa" (matches M5 node text). `artifacts/act-3-design/evidence-map.md:13` independently describes it as "flat, exact centre" — same substance, but the design doc commits to a specific geometry description not present as a distinct summary elsewhere.

2. **E7B_BIGLIETTO_POSIZIONE significance — disputed between two act-3 design docs.** `artifacts/act-3-design/evidence-map.md:12` calls the "one flap left visible" detail "weak (why does it matter is never said)" and proposes a REWRITE. `artifacts/act-3-design/fact-knowledge-ledger.md:10` (fact #2) treats the same flap detail as already load-bearing proof of staging ("flap of ticket left showing... = staged for discovery"). Both design docs, differing on whether the significance is stated in-game.

3. **P3A wording specificity.** `narrative/propositions.json` P3A text: "La posizione non è compatibile con una caduta casuale: una collocazione deliberata è la lettura più forte." `artifacts/act-3-design/fact-knowledge-ledger.md:9` (fact #1) restates the objective truth more narrowly as "Placed deliberately at the exact centre (report §5A/§9 table)."

4. **East-direction / bridge confirmation status — three-way disagreement.** `artifacts/act-3-design/setup-payoff-ledger.md:9` (row 1) classifies the Act2→M5 bridge payoff as CLASS **PAID** ("Solid, symmetric payoff") but notes in the same row "Direction itself is still only *told*, not walked." `artifacts/act-3-design/fact-knowledge-ledger.md:11` (fact #3) flags the same claim as only "currently only implied, not a seen fact... a soft violation" (WORDING GUARD). `artifacts/act-3-design/evidence-map.md:43` independently states: "no page or landmark makes the direction a *seen* fact" (gap). Same underlying claim (east direction toward the car), three different verdicts (PAID / soft violation / gap) across three design documents dated as frozen.

5. **east_route_confirmed wiring — design-time complaint vs later closure-report fix, not confirmed to be the same issue.** `artifacts/act-3-design/fact-knowledge-ledger.md:12` (fact #4, "Violation 2") states the flag is "committed by dialogue, not by the trace" — an unresolved design-time complaint. `docs/act-3-closure-report.md:93` (§10, playthrough defect #2) reports a fix: "`east_route_confirmed` was written only in narrative state and never mirrored to the classic flag the door reads. Added to `syncNarrativeToClassic`." These are two different-sounding problems (semantic gating mechanism vs. classic/narrative state mirroring) attributed to the same flag; the closure report does not state whether the earlier design-doc complaint was also addressed.

6. **JACQUES_THIRD_MAN_DETAIL quoted text differs between two design docs citing the same node/line.** `artifacts/act-3-design/fact-knowledge-ledger.md` (fact #6, quoting node `m6.b5.falsa.p06`): "(la risata cala) Non beveva. Guardava la stufa come si guarda una persona." `artifacts/act-3-design/setup-payoff-ledger.md:12` (row 4), citing the same node id, quotes only: "Guardava la stufa come si guarda una persona." — omitting the "(la risata cala) Non beveva." lead-in. The actual mission file `narrative/missions/M6.json` node `m6.b5.falsa.p06` (per the M6/M8/M9 extraction pass) matches the fact-knowledge-ledger's fuller quotation: "(la risata cala) Non beveva. Guardava la stufa come si guarda una persona. (pausa) Io i tipi così li lascio guardare." — so setup-payoff-ledger's quotation is a truncated/partial excerpt versus both the ledger and the mission source.

7. **East route payoff mechanism — three-way disagreement (separate from #5).** `artifacts/act-3-design/setup-payoff-ledger.md:21` (row 13) classifies "north tracks" payoff as "PAID, but by the wrong mechanism," later resolved per its own frozen-resolution table (line 39-40 region) to "PAID by right mechanism, `east_route_confirmed` written by north-cut node (O3)." This differs in framing from `docs/act-3-closure-report.md:93`'s framing of the same area as a classic/narrative sync defect (see #5) — the two documents describe corrections to what appears to be the same flag from different angles (mechanism-of-writing vs. mechanism-of-mirroring) without explicitly cross-referencing each other.

8. **Evidence-map vs fact-ledger verdict on Row 12/hospital register.** `artifacts/act-3-design/fact-knowledge-ledger.md` frozen-corrections note (row12, line ~42): "pre-death visit writes a note only; reader of jacques_death_suspicious is one Truman variant at m6_atto4_bridge." `artifacts/act-3-design/setup-payoff-ledger.md:17` (row 9, hospital register) independently classifies the same setup as CLASS **UNPAID** in the "as-built" table, before its own frozen-resolution table (line ~37) reclassifies it "PAID, Truman variant in m6_atto4_bridge" — i.e. the ledger describes the corrected/frozen state directly while the setup-payoff-ledger's as-built table still shows the pre-fix UNPAID state; both documents are dated as part of the same frozen act-3-design milestone, so it is unclear which table represents current truth without an explicit versioning note.

9. **`m6_resource_lost` / `jacques_statement_terms_known` / `night_log_no_visitor` / `audrey_salvata` — cut per closure report, but earlier evidence-map.md still lists them as live state.** `artifacts/act-3-design/evidence-map.md:29,30,31,33` lists these as as-built state keys with CUT/DEFER/MERGE verdicts already noted in that same document. `docs/act-3-closure-report.md:43` (§3) confirms: "State cut per frozen plan: `m6_resource_lost` (merged into jacques_testimony_lost), `jacques_statement_terms_known`, `night_log_no_visitor` (merged into jacques_death_suspicious), `audrey_salvata` (narrative catalogue; the classic walkthrough simulator still carries a phantom acquisition, left as compatibility)." Not a contradiction, but flagged since evidence-map.md was not itself updated to remove the cut entries — the cut is recorded only in the later closure report.

No conflicts were found regarding P1, P2, P4, P4B, P5, P6, P7, P8, P9, P10_R7 statement wording between propositions.json and the mission/ledger sources read (mission node text matches or extends, without contradicting, the propositions.json summaries for these ids).
