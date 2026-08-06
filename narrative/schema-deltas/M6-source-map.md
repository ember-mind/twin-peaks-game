# M6 — Source map (nodo → sezione del Lock) e dichiarazioni di provenienza

Autorità canonica: **M5-M6 v1.1.1 LOCK.md, §5** (unica sorgente testuale).
Ogni testo di pagina è trascritto dal Lock; le trasformazioni sono elencate qui.
I conteggi autorevoli sono STAMPATI da `test/narrative-validate-m6.js` a ogni run
(mai mantenuti a mano in questo documento).

## Mappa nodi

| Nodo | Sezione Lock | Pagine (rese) | Note di trascrizione |
|---|---|---|---|
| m6_ferry | M6-B1-B2 | 4 | fiume + sala; nessun effetto (solo ingresso) |
| m6_audrey | M6-B3 | 2 | facoltativo (`audrey_indaga`); la riga «→ flag» = effetto `audrey_vista_oej` |
| m6_tactic | M6-B4 | 2 + widget | p01 azione + p02 prompt; la SCELTA è il widget (3 tattiche → `m6_tactic`) |
| m6_interrogation_prova | M6-PROVA | 9 | le righe «→ evidenza/nota» sono EFFETTI post-ultima-pagina (2 domande esclusive q1,q2 + 1 di colore) |
| m6_interrogation_pressione | M6-PRESSIONE | 9 | idem (2 esclusive q1,q2) |
| m6_interrogation_falsa | M6-FALSA_SICUREZZA | 8 | idem (2 esclusive q1,q2 + 1 di colore) |
| m6_p5 | M6-B6b | 1 prompt + feedback | choice; A→P5 (formulata), B retry, C retry per-ramo (`feedback_pages_by_value`); il ✔ del Lock NON è renderizzato |
| m6_arrest | M6-B7 | 7 | catena d'arresto; «→ flag/nota» = effetto `jacques_preso` + taccuino |
| m6_return_night | M6-B7b | 4 | tempo percepibile; ultima pagina mostra telefono di Lucy che squilla e lei che risponde; «→ obiettivo» = obiettivo derivato (nessun flag) |
| m6_news | M6-B8 | 3 + 1(per tattica) | `pages_by_value` su `m6_tactic`; «→ jacques_dead…/P9/obiettivo» = effetti |
| m6_atto4_bridge | M6-B9 / `data.js` `truman_atto4` | 4 | **[P/N]** porta nel runtime canonico il rapporto già presente nel gioco classico; richiede `jacques_dead` + `gigante1`, scrive `atto4` solo al commit |
| m6_hospital | M6-B8b | 4 | coda facoltativa; «→ evidenza/…» = effetti `night_log_no_visitor` + `jacques_death_suspicious` |

## Conteggi pagine: riconciliazione col §8 del Lock (dichiarata, non pareggiata)

Il §8 del Lock dichiara **72 pagine** con la ripartizione
`6+4+3+11+12+12+3+6+4+6+5`. La proposta trascrive le righe-pagina del §5 senza
inventare pagine per pareggiare i numeri (stessa dottrina di M5). Le discrepanze,
tutte nella stessa direzione (il Lock conta anche le righe-effetto/obiettivo/flag,
e conta entrambi i rami dei costrutti per-valore), sono DICHIARATE qui:

| Beat | Lock §8 | Rese nel §5 | Δ | Causa della differenza |
|---|---|---|---|---|
| B1-B2 | 6 | 4 | −2 | il §5 contiene 4 righe-pagina |
| B3 | 4 | 2 | −2 | 2 righe-pagina + 1 riga-effetto (`audrey_vista_oej`) |
| B4 | 3 | 2 (+widget) | −1 | azione + prompt; la scelta è il widget |
| PROVA | 11 | 9 | −2 | 9 righe-pagina + 3 righe-effetto (evidenza/evidenza/nota) |
| PRESSIONE | 12 | 9 | −3 | 9 righe-pagina + 3 righe-effetto |
| FALSA | 12 | 8 | −4 | 8 righe-pagina + 3 righe-effetto (il §8 sovrastima) |
| B6b (P5) | 3 | 1 prompt + fb | ~ | 1 prompt + feedback per opzione (A/B/C-per-ramo) |
| B7 | 6 | 7 | +1 | il §5 rende due azioni distinte sul molo (il §8 le fonde) |
| B7b | 4 | 3 | −1 | 3 righe-pagina + 1 riga-obiettivo |
| B8 | 6 | 3 + 1/tattica | ~ | 3 pagine LUCY + 1 battuta Cooper per tattica + 3 righe-effetto |
| B8b | 5 | 4 | −1 | 4 righe-pagina + 1 riga-effetto (evidenza) |

**Interpretazione adottata**: il conteggio del Lock include righe-effetto,
righe-obiettivo/flag e, per i beat a diramazione (B6b, B8), entrambe le varianti;
la proposta rende le sole righe-pagina e non fabbrica pagine artificiali. **B7 è
l'unica discrepanza in ECCESSO** (+1): i due momenti sul molo — la spinta/corsa e
la caduta con la gamba che non segue — sono due azioni distinte nel §5, che io
rendo come due pagine; il §8 le conta come una. **[L — RISOLTO in revisione
25/30]**: TENERE due pagine. Autorità del testo §5 > tabella riassuntiva §8;
fondere indebolirebbe la screen-truth (sull'ultima pagina si deve vedere il
ferimento con `jacques_preso` ancora falso, prima del commit — è il ferimento che
motiva il ricovero e cambia il resto della trama). `B7 page count: 7 [L]`,
autorità §5. Ogni altra differenza è −N e coerente con la contabilità del Lock.
Il conteggio TOTALE reso è stampato dal validatore.

## Conteggio nodi: riconciliazione col §8

Il §8 dichiara **14 nodi** «incl. i tre rami come nodi separati + cambio + P5 +
B7b + B8b». Il runtime integrato ha **12 nodi**. La differenza è ONESTA e dichiarata:
- **−1**: il «cambio tattica» del conteggio è un residuo del §8: la v1.1.1 lo ha
  ELIMINATO (manifesto §1.7; §5 non contiene alcun nodo di cambio). Il §8 non è
  stato riallineato. Nodo non implementato per costruzione.
- **−1**: B1-B2 è UN nodo (`m6_ferry`), non due. I tre rami restano tre nodi
  separati. Il dodicesimo nodo è il ponte `m6_atto4_bridge`, necessario perché
  il rapporto classico `truman_atto4` non può essere scritto dal fallback mentre
  l'adapter narrativo possiede Truman.

I 12 nodi: `m6_ferry`, `m6_audrey` (fac.), `m6_tactic`, `m6_interrogation_{prova,
pressione,falsa}`, `m6_p5`, `m6_arrest`, `m6_return_night`, `m6_news`,
`m6_atto4_bridge`, `m6_hospital` (fac.). `node_count.runtime_total = 12` == `nodes.length` (verificato
dal validatore).

## Dichiarazioni [N] / [OPEN]

1. **`m6_tactic` come valore tipizzato** — **[N] proposto**: dominio chiuso già in
   `state-enums.json`; l'unica aggiunta è la riga `values_allowed`. Da approvare.
2. **Obiettivi d'ingresso e intermedi** — `obj_m6_1` («…siediti al tavolo di
   Jacques Renault.»), `obj_m6_2` («Metti a fuoco che cosa puoi sostenere…»),
   `obj_m6_3` («Accompagna Jacques oltre il fiume per formalizzare la dichiarazione.»), `obj_m6_4` («Torna alla
   centrale…») e `obj_m6_4b` («Vai da Lucy: l'ospedale è in linea.») sono **[N]**: orientano sempre
   verso la root fisica realmente azionabile. Il testo Lock «Domattina:
   l'ospedale…» resta nella battuta di Truman, dove non produce un falso
   obiettivo. `obj_m6_5` («Torna alla stanza 315.») è **[L]** dal §5 B8.
3. **Condizione «P5 formulata»** — **[P] RIUSO** della primitiva esistente
   `proposition_path: "P5.formulation.status", equals: "formulated"` (convenzione
   M4/M5), in `resolved_when`, `conditions` di `m6_arrest`, obiettivi e guardia di
   rientro di `m6_p5`. Nessun operatore nuovo (l'inventato `proposition_formulated`
   della v1.0 è abolito, vedi §C6-A.2).
4. **`feedback_pages_by_value`** — **[N]** costrutto generico (schema-delta §3)
   per il testo per-ramo dell'opzione C di P5. Da approvare.
5. **`page.question` (esclusiva/colore)** — **[N]** metadato dati mai renderizzato
   (schema-delta §4); `m6_questions_asked[]` rinviato a C6-B come registro derivato.
6. **`tactic_differentiation`** — **[N]** tabella dei 7 assi (dal Lock §6), usata
   dal validatore per provare che i rami differiscono davvero; mai UI.
7. **`map_id` di M6** — mappe REALI del motore (`maps.js`): `oej`, `sheriff` (la
   centrale dello sceriffo), `hospital`. Gli **`actor_id`** (`jacques`, `audrey`,
   `truman`, `lucy`) sono attori reali di `chars.js`. Solo i **`target_id`** interni
   alla mappa (`night_register`) restano **[N]** logici, risolti
   dall'adapter in C6-B (come i binding ambientali di M5).
8. **Gate d'ingresso M6** — `entry_condition: { flag: "east_route_confirmed" }`:
   la fine di M5 (unico writer `m5_report_close`). **[L]** coerente col Lock
   (M5 chiude su One Eyed Jacks e M6 apre lì).
9. **Provenienza delle tre testimonianze** — `JACQUES_MIDNIGHT_CLAIM`,
   `JACQUES_LIST_GIVEN`, `JACQUES_THIRD_MAN_DETAIL`: `source: N`, `status: locked`
   **[N→L]**, `human_approval: true` (Lock §14, delega 2026-07-22). Già a catalogo.
10. **Ponte M6→M8** — `m6_atto4_bridge` riusa le quattro pagine del dialogo
    classico `truman_atto4` e le rende nel runtime proprietario dell'interazione.
    **[P/N]**: testo preesistente, nuovo binding causale esplicito.

## Correzioni v1.1.1 rispettate (checklist dal §1 del Lock)

- Una sola tattica per playthrough, immutabile; nessun cambio tattica; `m6_tactic`
  valore tipizzato write-once. ✓ (validatore: unico writer; `m6_tactic_changed`
  assente ovunque).
- I tre rami differiscono sui 7 assi; tutti scrivono `jacques_admitted_presence`
  in forma diversa; nessuno attribuisce l'omicidio. ✓ (validatore: pairwise
  distinti; nessuna parola d'attribuzione fuori dall'opzione respinta di P5).
- Prova: niente firma al primo colloquio (`jacques_statement_terms_known`; persa:
  la formalizzazione). ✓
- Pressione: lista SCRITTA; il sistema non certifica «uno vero» — mostra solo la
  reazione (voce calata). ✓
- P5 beat giocato (mai automatico); presenza ≠ omicidio; A accettata, B respinta
  nel merito, C respinta con testo per-ramo. ✓
- Catena dell'arresto completa; ferimento sul molo → ricovero → tempo percepibile
  (B7b sempre prima della notizia) → morte. ✓
- Fine M6: SOLO `jacques_dead` + `jacques_testimony_lost` (+ `m6_resource_lost`,
  P9). `jacques_death_suspicious` SOLO dalla coda ospedale giocata (B8b).
  `jacques_murder_confirmed`/`_attributed` MAI. ✓ (validatore: writer unici).
- `lucy_a3` [P] conservata integralmente; «un cuscino, nessun testimone» è la
  domanda di Lucy, non un fatto di sistema. ✓
- Nessun testo compara le tattiche o dice «avresti dovuto». ✓
- M4 e M5 byte-invariati (M6.json inerte per i validatori runtime/motore). ✓

## Revisione 25/30 — correzioni C6-A.1 applicate (contratto di esecuzione)

Stamp: **C6-A — STATIC NARRATIVE MODEL VALIDATED**; C6-B autorizzata dopo il
micro-patch. Risoluzioni e correzioni recepite:

- **B7 = 7 pagine [L]** e **11 nodi originari** — APPROVATI dal revisore (autorità §5 > §8;
  il 14 conteneva il cambio-tattica abolito + diversa segmentazione B1-B2).
- **Root-contract (softlock)**: guardia di rientro `not` sull'effetto proprio su
  OGNI nodo; nuovo gate `exactly_one_actionable_root_per_target_per_reachable_state`
  (simulazione dei 12 percorsi, 108 stati) — schema-delta §9.1.
- **Binding reale**: `map_id` = mappe reali del motore (`oej`/`sheriff`/`hospital`;
  `centrale`→`sheriff`); `actor_id` su ogni target attore (attori reali di
  `chars.js`). Gate `all_map_ids_exist_in_engine_catalog`,
  `all_actor_targets_have_actor_id` — schema-delta §9.2.
- **Continuazione tattica→ramo**: `goto` per scelta; gate
  `tactic_choice_goto_matches_selected_value` — schema-delta §9.3.
- **Condizione P5**: riuso di `proposition_path`/`equals` (convenzione M4/M5), non
  più l'operatore inventato `proposition_formulated` — schema-delta §2.
- **P5 attempt-recording** e **riapertura del beat**: primitive generiche per C6-B
  dichiarate — schema-delta §9.4-9.5.
- **M4/M5 invariati**: gate `m4_m5_state_and_data_unchanged` (i diff solo
  aggiungono; M5 resta 13 nodi).

## Revisione 27/30 — correzioni C6-A.2

Stamp: *C6-A.1 STATIC DATA PATCH TECHNICALLY VALIDATED*; C6-B NO-GO fino a
C6-A.2. Scope residuo (nessuna riscrittura narrativa):

- **`m6_p5.next = "m6_arrest"`**: continuazione dichiarativa dopo l'opzione A
  (senza, la sessione finirebbe e l'arresto resterebbe scollegato). Gate
  `p5_success_has_declarative_continuation`.
- **Una sola semantica «P5 formulata»** nei documenti e nei dati: solo
  `proposition_path`/`equals`; `proposition_formulated` resta solo come voce di
  changelog (abolito). Gate `contract_contains_no_live_proposition_formulated_operator`.
- **Source-map: solo map_id reali** (`oej`/`sheriff`/`hospital`, mai `centrale`
  come mappa). Gate `source_map_uses_only_engine_map_ids`.
- **`obj_m6_3`** [N, non bloccante]: «Accompagna Jacques oltre il fiume per
  formalizzare la dichiarazione.» (non anticipa il fermo, che avviene dopo
  l'attraversamento volontario e il tentativo di fuga).
- **feedback_pages_by_value transazionale**: cinque gate dinamici per C6-B
  (prepareChoice congela, commit non riseleziona) — matrix §7.
