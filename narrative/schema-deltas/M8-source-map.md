# M8 — Source map (nodo → sezione del Lock) e dichiarazioni di provenienza

Autorità canonica: **M8 v1.1 LOCK.md, §9** (unica sorgente testuale); §13 =
contratto dati/scope/test. **Autorità condivisa corrente: World & Story Bible v1.0.md.**
Nota storica: M8 v1.1 LOCK fu redatto contro **Bible v0.9.1** (+ M4 v1.1.1 + M5-M6
v1.1.1), poi consolidata nella **v1.0** — la v0.9.1 vale solo come provenienza
storica, non come autorità corrente. Ogni testo di pagina è trascritto dal §9. I
conteggi autorevoli sono STAMPATI da `test/narrative-validate-m8.js` a ogni run.

## Mappa nodi (11, segmentazione raccomandata dal revisore)

| Nodo | Sezione Lock | Pagine (rese) | Note |
|---|---|---|---|
| m8_diner | M8-A | 7 + choice | scena ordinaria + promise_stance; nessuna voce di taccuino |
| m8_roadhouse | M8-B | 6 + choice | Gigante → `presagio_status: active`; warning_target; obiettivo |
| m8_focus_choice | M8-C | 2 + choice | focus_destination; nessun goto (la route si CAMMINA, world-root gated) |
| m8_route_palmer | M8-C | 4 | body_found_by=hawk; valigia/biglietto [condizionale: warning=palmer]; chiamata centrale |
| m8_route_lake | M8-C | 1 | body_found_by=cooper (primo) |
| m8_route_diner | M8-C | 2 | body_found_by=hawk; Norma + radio di Hawk |
| m8_discovery | M8-D | 4/2 (per body_found_by) | pages_by_value; E9A/E9B; `letter_o_chain=standard` in ENTRAMBE le versioni (Bible consolidata, nessun «in_situ solo se Cooper primo»); `presagio` active→verified; maddy_trovata |
| m8_promise_echo | M8-D | 1 + 1/promise + 2 | pages_by_value su promise_stance (Diane) + tovagliolo + silenzio |
| m8_cmp_letters | M8-E | 1 | confronto E9A↔E3 (lettera R), node_commit, nota metodo/ordine |
| m8_cmp_diary | M8-E | 3 + feedback | retry B/C; A formula P8 |
| m8_station | M8-F | 1 + 1/sarah + valigia? + 2 | pages_by_value su **sarah_support_state** (none/vice, dominio nominale); valigia condizionale [warning=palmer ∧ focus≠palmer]; obiettivo → M9 dopo il commit; repeat |

## Conteggi pagine: riconciliazione col §13 del Lock (dichiarata, non pareggiata)

Il §13 dichiara **51 pagine** (A 12 + B 10 + C 8 + D 10 + E 6 + F 5), 11 nodi, 12
label, 6 voci taccuino, 11 moduli combinabili. La proposta trascrive le
righe-pagina del §9 senza inventare pagine per pareggiare i numeri (dottrina M5/M6).
Le discrepanze sono nella stessa direzione di M5/M6 (il §13 conta anche
righe-effetto/obiettivo/flag e, per i beat a diramazione, tutte le varianti). Il
conteggio TOTALE reso è **stampato dal validatore**; la riconciliazione per beat:
- A: §13=12; §9 = 7 righe-pagina + 1 prompt + 3 feedback (choice); righe-effetto
  (promise_stance/nota) non sono pagine.
- B: §13=10; §9 = 5 righe-pagina + 1 prompt + 4 feedback (2 per palmer) +
  righe-effetto (presagio/warning).
- C: §13=8; il beat C è SPEZZATO in 4 nodi (focus_choice + 3 route) per la
  modularità (motivazione di source-map, come consentito); righe-pagina totali del
  §9-C = prompt + azione + 3 righe-route.
- D: §13=10; `pages_by_value` (D1=4, D2=2) + monologo (1 + 3 eco + 2) — il §13
  conta entrambe le versioni + tutte le eco.
- E: §13=6; cmp_letters (1) + cmp_diary (prompt+diario+prompt + 3 feedback).
- F: §13=5; azione + logistica-per-warning + valigia [cond.] + 2 righe finali.

**Interpretazione adottata**: il §13 include righe-effetto/obiettivo e tutte le
varianti dei beat a diramazione; la proposta rende le sole righe-pagina e non
fabbrica pagine. **[L — nessuna pagina artificiale].**

## Conteggio nodi: 11 (== §13)

I 11 nodi coincidono con la segmentazione raccomandata dal revisore. Il beat C è
reso come 4 nodi (focus_choice + route_palmer/lake/diner) per la modularità
derivata (ogni route scrive `body_found_by` col proprio valore, condizionato da
`focus_destination`): motivazione di source-map, ammessa dal contratto.
`node_count.runtime_total = 11` == `nodes.length` (verificato dal validatore).

## Dichiarazioni [N] / [OPEN]

1. **Entrata `atto4`** — **[N→L]**: il contratto chiede il gate reale del repository
   (atto4 / accesso al Roadhouse), NON `presagio_status: active` (nasce dentro M8).
   `atto4` è già in booleans_allowed. Fra M6 e M8 c'è M7: nessun gate diretto da M6.
2. **Testimonianza taxi come obiettivo intermedio** — obj_m8_25 porta
   fisicamente da Leland al diner; obj_m8_2 usa `value_is presagio_status=active`
   più `evidence T_LELAND_TAXI` (acquisita prima del Roadhouse).
3. **Obiettivi non canonici [N]** (obj_m8_4 «Porta a Truman una contraddizione
   che regga.» resta [L]). Sono derivati dichiarati, tutti registrati qui:
   [L]). Sono derivati dichiarati, tutti registrati qui:
   - **obj_m8_0** (priority 50, pre-diner): «Passa dal diner, questo pomeriggio.» —
     obiettivo d'ingresso, punta alla root azionabile `m8_diner` (dove nasce
     `promise_stance`). Sola direzione, nessuna «raggiungi/salva Maddy» (igiene
     falsa colpa). Chiude il softlock semantico del C8-A.2.
   - **obj_m8_1** (priority 100, Roadhouse): «Il paese si ritrova al Roadhouse,
     stasera.» — attivo SOLO dopo `promise_stance` e `T_LELAND_TAXI`.
   - **obj_m8_25** (priority 250): «Prima di uscire dal diner, parla con Leland.»
     — acquisisce `T_LELAND_TAXI` prima del Roadhouse, della scelta strada e del
     ritrovamento; impedisce la conoscenza retroattiva in M9.
   - **obj_m8_3** (priority 300): «Rileggi le lettere e il diario di Laura.»
   - **obj_m8_35** (priority 350): «Porta il nesso a Truman, alla centrale.» —
     finestra P8-formulata / stazione-non-fatta (l'obiettivo M9 obj_m8_4 resta
     post-stazione).
   Priorità dichiarate: 50/100/200/250/300/350/400; catena raggiungibile:
   50→250→100→200→300→350→400. L'obiettivo d'ingresso punta sempre a
   una root disponibile (`entry_objective_points_to_actionable_root`,
   `diner_precedes_roadhouse_in_objective_chain`).
4. **`value_transition` (presagio active→verified)** — **[N]** costrutto generico
   (schema-delta §1), da implementare in C8-B.
5. **`letter_o_observation_source` derivato da `body_found_by`** — **[N]**
   dichiarato (schema-delta §3), non implementato in C8-A.
6. **Pagina condizionale valigia** (`m8.f.station.p_valigia`) — **[N]** costrutto
   `conditional_pages` dichiarato (schema-delta §3) per C8-B.
7. **`authorial_timeline` T0-T7** — **[N]** dato dichiarativo, mai scritto da un
   effetto (schema-delta §2); provato staticamente (nessun effetto/condizione lo tocca).
8. **map_id/target_id** (`diner`, `roadhouse`, `town`, `palmer`, `sheriff`;
   `roadhouse_phone`, `town_crossroads`, `lago_maddy`, `palmer_entrance`) — mappe
   reali del motore per i map_id; i target_id interni sono logici, risolti
   dall'adapter in C8-C. `lago_maddy` [P] (town 15,28) e `maddy`/`norma` come attori
   (maddy [N] da posizionare; norma esiste).
9. **P8** — factual_status ≤ corroborated (chi resta ignoto); P7 resta ipotesi
   non-procedurale. M8 NON completa la funzione procedurale di M9.

## Correzioni v1.1 rispettate (checklist dal §14 del Lock)

- Nessuna frase di falsa colpa («avresti/se fossi arrivato/strada sbagliata/dovevi
  chiamare/raggiungi-salva Maddy»); obiettivo «scegli dove andare», non «raggiungi
  Maddy». ✓ (vietato dal validatore)
- Maddy non doppio di Laura: l'avventore la chiama Laura UNA volta perché lei lo
  CORREGGE («con due D»). ✓
- Azioni di Maddy sue, mai collegate al percorso: «Lucy manda Andy» (non «hai
  mandato»); la valigia è la sua decisione. ✓
- Sarah dorme, mai oracolo; il vice la sostiene, non scopre corpi. ✓
- Il Gigante orienta, non risolve. ✓
- P8 dal doppio confronto; B/C respinte; «resta ignoto se…». ✓
- M4/M5/M6 byte-invariati. ✓

## Revisione 24/30 — correzioni C8-A.1 (contratto di esecuzione)

Stamp: **STATIC CONTENT MODEL VALIDATED; EXECUTION CONTRACT PATCH REQUIRED**.
Canone/testo/tragedia-fissa/falsa-colpa/timeline/value_transition/11-nodi-59-pagine
APPROVATI. Correzioni data-only recepite (schema-delta §8):
- **B1** `m8_focus_choice` senza `goto`: la destinazione si CAMMINA (world-root
  gated da `focus_destination`), mai consumata al crocevia.
- **B2** `maddy_action_after_warning [none,departure_prepared]` e
  `sarah_support_state [none,vice]` = STATI NOMINALI (non booleani); ogni scelta
  telefonica scrive entrambi (`none` = deciso-nessuna-azione ≠ undefined).
- **B3** valigia = pagine con `condition` (route: warning=palmer; station:
  warning=palmer ∧ focus≠palmer), congelate in prepareNode (conditional_pages).
- **B4** `letter_o_observation_source` = EFFETTO derivato (`from_derivation` da
  `body_found_by`), primitiva runtime (mai adapter), unica autorità.
- **B5** `completion = { node_done: m8_station }` (mai `maddy_trovata` da solo).
- **B6** rimossa la guardia `not node_done m8_station` → il `repeat` è raggiungibile.
- **Bible consolidata**: `letter_o_chain=standard` in entrambe le versioni (nessun
  «in_situ solo se Cooper primo»). Matrice a **27 percorsi** (promise×warning×focus).
