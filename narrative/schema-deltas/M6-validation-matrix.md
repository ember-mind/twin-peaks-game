# M6 — Matrice di validazione (contratto dei test dinamici per C6-B)

Perimetro: questa matrice è il CONTRATTO della copertura dinamica. I percorsi
saranno eseguiti DAL runtime esteso (prepare/commit reali, save/load a ogni
passo) dentro `test/narrative-validate.js`, come per M4+M5 — mai da una
simulazione parallela. In C6-A esiste la copertura STATICA
(`test/narrative-validate-m6.js` — il numero dei controlli è STAMPATO dal
validatore a ogni esecuzione; questo documento non mantiene conteggi a mano).

## 1. La matrice canonica

```
3 tattiche  ×  2 coda ospedale (sì/no)  ×  2 Audrey (sì/no)  =  12 percorsi canonici
```

Le opzioni respinte di P5 (B, C) sono attraversate come SOTTO-passi di ogni
percorso (retry per-comparison), non moltiplicano i rami: P5 si risolve sempre
sull'opzione A (la sola che formula). Le due domande esclusive di ogni ramo sono
FISSE nel ramo, non generano combinazioni.

**Tattiche**: `prova · pressione · falsa_sicurezza`
**Coda ospedale (B8b)**: `esaminata · non esaminata`
**Audrey (B3)**: `audrey_indaga on · off`

Seed unico ammesso: lo stato di fine M5 (`east_route_confirmed`), prodotto dal
percorso M5 già validato (dottrina anti-greybox: nessuna semina arbitraria).

### Asserzioni per OGNI percorso

1. `m6_tactic` valorizzata esattamente una volta (write-once; secondo tentativo =
   `repeated`, mai mutazione); il `value_is` apre ESATTAMENTE un ramo interrogatorio.
2. Il ramo entrato scrive `jacques_admitted_presence` (forma propria) + la SUA
   risorsa (Prova: `JACQUES_MIDNIGHT_CLAIM` + `jacques_statement_terms_known`;
   Pressione: `JACQUES_LIST_GIVEN`; Falsa: `JACQUES_THIRD_MAN_DETAIL`); gli altri
   due rami restano irraggiungibili (nessuna loro evidenza nello stato).
3. Le 2 domande esclusive del ramo sono le sole poste; disgiunte dagli altri rami.
4. Beat P5: `m6_arrest` NON preparabile finché P5 non è formulata
   (`milestone_pending: milestone_p5`); B respinta nel merito, C respinta con la
   battuta della tattica corrente; A formula P5 e sblocca l'arresto.
5. Catena d'arresto: `jacques_preso` scritto SOLO dopo l'ultima pagina di
   `m6_arrest`; ordine colloquio → uscita → fermo lato contea → ferimento.
6. `m6_return_night` SEMPRE fra arresto e notizia: `m6_news` NON preparabile
   finché `m6_return_night` non è committato (tempo percepibile).
7. Notizia critica (`m6_news`): scrive SOLO `jacques_dead`, `jacques_testimony_lost`,
   `m6_resource_lost`, P9. **`jacques_death_suspicious` ancora FALSO**; nessun
   `jacques_murder_*`. Battuta di Cooper = quella della tattica corrente.
8. Ponte M8: dopo la visione del Gigante, `m6_atto4_bridge` richiede
   `jacques_dead` + `gigante1`, rende il rapporto a Truman, poi scrive SOLO
   `atto4`; M6 è completa e M8 diventa la missione corrente.
9. Coda ospedale (se esaminata): `night_log_no_visitor` + `jacques_death_suspicious`
   scritti SOLO qui, SOLO dopo l'ultima pagina; se non esaminata restano falsi e
   M6 è comunque completa (`jacques_dead`).
10. Audrey: se `audrey_indaga`, `m6_audrey` disponibile e scrive `audrey_vista_oej`;
   altrimenti il nodo è saltato e M6 resta completabile.
11. Obiettivo UNIVOCO e fisicamente onesto a ogni passo (catena
    100→200→300→400→450→500→600): dopo il fermo punta a Truman; dopo la notte a
    Lucy solo dopo che squillo e risposta sono già visibili; mai all'ospedale prima che esista una root pertinente.
12. Nessun softlock: da ogni stato intermedio esiste un'azione che avanza.
13. Nessuna scelta marcata corretta (né a schermo né nello stato).
14. Nessun effetto prima dell'ultima pagina del nodo che lo produce.
15. Save/load a ogni passo: serialize→deserialize→serialize identico; obiettivo,
    tattica, milestone-pending, proposizioni ricostruiti dai dati.

### Invarianti globali su tutti i percorsi

- **Un solo `m6_tactic`** per playthrough; `m6_tactic_changed` mai presente.
- **Mai** `jacques_murder_confirmed` / `jacques_murder_attributed` in nessuno stato.
- `jacques_death_suspicious` == false in ogni stato che NON abbia giocato B8b.
- `jacques_admitted_presence` scritto SOLO dai tre rami; ciascuna testimonianza
  dal solo ramo che la possiede; `jacques_dead`/`jacques_testimony_lost`/
  `m6_resource_lost`/P9 SOLO da `m6_news`.
- **M4 e M5 byte-invariati** (history/valori/confronti); M6.json inerte per i
  validatori runtime e per il motore classico finché C6-B non lo carica.
- `nodes_done` mai usato come gate NARRATIVO: `node_done` compare solo per il
  gating fisico (`m6_ferry` = sala entrata, `m6_return_night` = notte passata);
  i gate di merito usano flag/valori/proposizioni.

## 2. Copertura pairwise aggiuntiva

| Dimensione | Valori |
|---|---|
| Tattica | prova / pressione / falsa_sicurezza |
| P5 | formulata (sempre, via A) / tentativi B,C attraversati |
| Ospedale B8b | esaminato / non esaminato |
| Audrey B3 | on / off |
| Ordine ingresso ramo | subito dopo B4 (unico ordine: la tattica apre il ramo) |

Coppie da coprire (≥6 run aggiuntivi):
- prova × ospedale esaminato × Audrey off → `jacques_death_suspicious` scritto solo in B8b;
- pressione × ospedale non esaminato × Audrey on → suspicious resta falso, M6 completa;
- falsa × ospedale esaminato × Audrey on → terza tattica + coda + Audrey;
- ogni tattica × tentativo C di P5 → la battuta di rifiuto è quella della tattica;
- ogni tattica × tentativo B di P5 → «Le prove collocano. Non attribuiscono.» (comune);
- una tattica × secondo commit di `m6_tactic` → `repeated`, mai un secondo valore.

## 3. Differenziazione delle tattiche sui 7 assi (contratto §6 del Lock)

Per OGNI coppia di tattiche, i valori dei 7 assi (in `tactic_differentiation`)
devono essere DISTINTI: domande esclusive · tattica di Jacques · info verificabile
propria · risorsa specifica · forma dell'ammissione · costo persistente · eco
futura. `own_verifiable_info` coincide con l'evidenza scritta dal ramo. (Provato
staticamente in C6-A; ri-provato dinamicamente sugli stati reali in C6-B.)

## 4. Record critici screen-truth (C6-D)

| Momento a schermo | Stato che DEVE essere ancora falso/nullo |
|---|---|
| prompt tattica visibile (m6.b4.tactic.p02) | `m6_tactic` = null |
| ultima pagina del ramo (…prova.p09 / …pressione.p09 / …falsa.p08) | `jacques_admitted_presence` + la risorsa del ramo ancora false (commit dopo) |
| prompt P5 visibile (m6.b6b.p5.p01) | P5 unformulated; `m6_arrest` non preparabile |
| feedback P5 opzione A visibile (m6.b6b.p5.feedback.present) | P5 ancora unformulated finché non committa il beat |
| ultima pagina arresto (m6.b7.arrest.p07) | `jacques_preso` = false (commit dopo) |
| ultima pagina notizia (per-tattica, m6.b8.news.cooper_*) | `jacques_dead` false, `jacques_death_suspicious` false, obiettivo ≠ «stanza 315» |
| ultima pagina rapporto (m6.b9.atto4.p04) | `atto4` = false; M8 non ancora corrente (commit dopo) |
| ultima pagina ospedale (m6.b8b.hospital.p04) | `jacques_death_suspicious` = false (commit dopo) |

## 5. Percorso fisico (C6-E)

Almeno DUE tattiche camminate end-to-end nel motore (una con coda ospedale, una
senza), più la copertura runtime dei 12 percorsi canonici nel validatore. Il
walker attraversa i segmenti (no teletrasporto); route log del mondo. Semina:
solo lo stato di fine M5.

## 6. Invarianti statiche (GIÀ coperte in C6-A: numero stampato dal run)

writer unici (tattica, admission×3-rami, 3 testimonianze, jacques_preso,
jacques_dead, jacques_testimony_lost, m6_resource_lost, P5, P9,
night_log_no_visitor, jacques_death_suspicious, audrey_vista_oej) · nessun
`murder_*` mai scritto · `m6_tactic_changed` assente ovunque · `jacques_death_
suspicious` SOLO da B8b · P5 SOLO dal beat B6b · le 3 tattiche pairwise distinte
sui 7 assi · own_verifiable_info == evidenza del ramo · nessun token interno nei
testi · nessuna parola che attribuisce l'omicidio (fuori dall'opzione respinta di
P5) · obiettivi a partizione esatta (tabella di verità) · `pages_by_value` e
`feedback_pages_by_value` coprono il dominio intero di `m6_tactic` · page ID
stabili e globalmente unici (M4+M5+M6) · binding ambientali senza coordinate ·
`node_done` solo per il gating fisico · `node_count == nodes.length`.

## 7. Contratto di esecuzione (C6-B) — gate dinamici dalla revisione 25/30

Gate che il runtime esteso DEVE soddisfare (eseguiti dal motore, non simulati),
oltre a quelli già coperti staticamente in C6-A.1:

- `exactly_one_actionable_root_per_target_per_reachable_state` — provato anche a
  RUNTIME: a nessuno stato due world-root condividono un target azionabile (le
  guardie di rientro `not` più la de-duplicazione delle root concluse).
- `roots_do_not_shadow_unresolved_nodes` / `shadow_unresolved_nodes` — il registro
  dei nodi irrisolti include i choice-node con `milestone` pendente (P5), così il
  beat forzato resta riapribile dopo abort/blur.
- `tactic_to_branch_same_lease`, `branch_to_p5_same_lease`,
  `p5_success_continues_to_arrest` — la catena tattica→ramo→P5→arresto vive in UN
  solo lease (zero frame di gameplay fra i beat forzati), come la domanda forzata
  di Ronette e le milestone-teoria di M5.
- `p5_b_attempt_recorded`, `p5_c_attempt_recorded`,
  `p5_attempts_hide_only_same_result`, `p5_attempts_survive_save_load`,
  `p5_attempts_do_not_touch_m4_history`, `p5_attempts_do_not_increment_assistance`
  — la primitiva generica «`attempt_scope==='comparison'` registra a prescindere
  dal `kind`» (schema-delta §9.4).
- `all_actor_targets_have_actor_id`, `all_map_ids_exist_in_engine_catalog` —
  ri-provati sul catalogo del motore caricato.
- `m4_m5_state_and_data_unchanged` — M4/M5 (history/valori/confronti) invariati a
  runtime quando M6 è caricata nel bundle.

- `feedback_pages_by_value` TRANSAZIONALE (dalla revisione 27/30): il feedback
  per-valore dell'opzione C di P5 si risolve in `prepareChoice` e si CONGELA nel
  prepared; `commitChoice` consuma il prepared e non riseleziona — la stessa
  regola «il commit consuma una decisione congelata, non ricalcola il mondo» di
  M5. Gate:
  - `feedback_by_value_resolved_in_prepare_choice`
  - `prepare_choice_with_value_feedback_is_pure`
  - `prepared_feedback_is_frozen`
  - `state_change_after_prepare_makes_choice_stale`
  - `commit_choice_never_reselects_feedback`
  - `missing_value_case_fails_during_prepare`
- `p5_success_has_declarative_continuation` (statico, già in C6-A.2: `m6_p5.next
  == m6_arrest`) ri-provato a runtime: dopo l'opzione A la continuazione conduce
  all'arresto senza una nuova interazione nel mondo; dopo B/C la milestone resta
  pending e il retry ha precedenza.

Solo dopo questi gate il GO a C6-B è pieno.
