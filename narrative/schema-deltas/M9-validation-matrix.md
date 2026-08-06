# M9 — Matrice di validazione (contratto dei test dinamici per C9-B)

Perimetro: contratto della copertura DINAMICA, eseguita DAL runtime esteso in C9-B
(mai simulata). In C9-A esiste la copertura STATICA (`test/narrative-validate-m9.js`
— il numero dei controlli è STAMPATO dal validatore).

## 1. La matrice canonica: 12 percorsi × 2 esiti di allegato

M9 non genera stato nuovo: **legge** lo stato d'uscita di M8 e lo trasforma in righe.
La matrice canonica è quindi lo spazio degli stati d'ingresso letti:

```
letter_o_observation_source × sarah_support_state × warning_target = 2 × 2 × 3 = 12 percorsi
```
`letter_o_observation_source`: cooper_primary · hawk_preserved
`sarah_support_state`: none · vice
`warning_target`: palmer · centrale · nessuno

A questi si moltiplica l'**asse di allegato** (l'unica agency nuova di M9), a 2 esiti:

| esito | allegato | verdetto | reason_code | seguito |
|---|---|---|---|---|
| completo | `T_LELAND_TAXI` + `D_TAXI` | accepted | `SUFFICIENT_RELEVANT_SUPPORT` (`acceptance_type: colloquio_necessario`) | `atto5` scritto → `m9_arrivo` |
| incompleto | manca `D_TAXI` | rejected | `NO_CORROBORATION` | widget riaperto, ripresentabile; alla ripetizione `ALREADY_REJECTED` |

**24 combinazioni** provate (12 × 2). Gli assi non sono ortogonali per caso: i 12
percorsi cambiano **righe**, l'asse di allegato cambia il **verdetto** — è esattamente
la proprietà da dimostrare (l'eco M8 non tocca il gate).

### Asserzioni per OGNI percorso

1. `D_TAXI` acquisita **solo** dopo l'interazione con Lucy (`m9_verifica_taxi`);
   mai da un documento aperto da solo, mai da un altro nodo.
   (`d_taxi_only_from_player_request`)
2. `T_LELAND_TAXI` scritta una volta sola, dallo stesso nodo (richiamo del taccuino).
3. P6 formulata **solo** da `m9_cmp_taxi` e **solo** con entrambi gli atomi
   (`created_from == support_min.all_of`). (`p6_requires_both_atoms`)
4. `P6.factual_status` **resta `unconfirmed`** in tutta M9: nessun percorso scrive
   `confirmed_as_lie` (è M10-B6). (`p6_factual_status_unconfirmed_in_m9`)
5. Accettazione: `social_status.accepted_by ∋ truman`, `acceptance_type:
   colloquio_necessario`. Rifiuto per allegato incompleto: `NO_CORROBORATION`, il nodo
   **si riapre** (`completion_when` è l'accettazione, non il commit).
   (`presentation_reopens_after_rejection`)
6. P7/P8 presentate come base → `VALID_BUT_NOT_PROCEDURAL`, mai accettate; alla
   ripetizione → `ALREADY_REJECTED`.
7. La visione di Sarah, se allegata, produce **una pagina additiva** e **non** cambia
   ramo/risultato/reason_code; non entra in nessun `support_min`.
8. Eco M8 (copertura totale del dominio, nessun percorso muto):
   `letter_o_observation_source` → una riga di Cooper (cooper_primary | hawk_preserved);
   `sarah_support_state` → la riga di Truman su Sarah (vice) o la didascalia del
   cappello (none); `warning_target` → Truman (palmer) o Andy (fallback non-palmer).
   **Nessuna eco cambia il gate.**
9. `atto5` scritto **una sola volta** e **solo** all'accettazione
   (`atto5_written_only_on_acceptance`); `m9_arrivo` richiede `atto5`
   (`arrival_requires_acceptance`) → il gate narrativo e la presenza NPC di
   `leland@sheriff` coincidono.
10. Obiettivo univoco a ogni passo (catena priorità **100→200→300→400**):
    obj_m9_1 (100, ingresso: «Chiedi a Lucy se il taxi di Leland era prenotato.» → `m9_verifica_taxi`) →
    obj_m9_2 (200, il confronto nel taccuino) →
    obj_m9_3 (300, «Porta a Truman una contraddizione che regga.», attivo anche dopo
    un rifiuto) → obj_m9_4 (400, terminale, «Leland Palmer è alla centrale. Decidete
    come parlargli.», gated su `node_done: m9_present_truman`).
11. Nessun softlock; save/load a ogni passo; M10 raggiungibile da tutti gli stati.
12. **Nessun arresto in M9**: nessun percorso produce fermo/provvedimento; nessuna
    divisa a casa Palmer; l'arrivo è volontario, a piedi, da solo.
13. **Nessuna comparsa di BOB**: i due segnali (ritratto, cambio di registro) esistono
    SOLO in M10-B5. Asserzione sull'ASSENZA.
14. Nessuna riga attribuisce un omicidio: P6 prova che il colloquio è **necessario**,
    non che Leland sia colpevole.

## 2. Allegato manuale (contratto transazionale)

`attachment_branch_frozen_in_prepare` · `commit_does_not_revalidate_attachment` ·
`unacquired_evidence_rejected_fail_closed` · `attachment_partition_is_total`
(ogni combinazione cade in esattamente un ramo di `by_support`) ·
`record_carries_evidence_attached` (non `evidence_shown`) ·
`rejection_is_representable` · `already_rejected_after_repeat`.

## 3. Record critici screen-truth (C9-D)

| Momento a schermo | Stato ancora falso/nullo |
|---|---|
| pagina della domanda a Lucy (`m9.b1.verifica.p02`) | `D_TAXI` non acquisita |
| ultima pagina di Lucy (`m9.b1.verifica.p03`) | `D_TAXI` ancora falsa (scritta al commit) |
| nota del confronto (`m9.b1.cmp_taxi.p02`) | P6 ancora `unformulated` |
| widget di allegato aperto | nessun record di presentazione |
| ultima pagina del ramo accettato (`m9.b2.p6.accept.p06`) | `atto5` ancora falso, P6 non ancora accettata |
| pagina `NO_CORROBORATION` | P6 formulata, `accepted_by` vuoto, nodo riapribile |
| ultima pagina dell'arrivo (`m9.b3.arrivo.p06`) | M9 non ancora completata |

## 4. Percorso fisico (C9-E)

M9 vive interamente su `sheriff`: il keypath da provare è **camminato** dentro la
centrale — Lucy → (taccuino) → Truman → Leland — con transizioni di PRODUZIONE e
`leland@sheriff` che compare **solo** dopo `atto5` (e sparisce con `leland_morto`).
Almeno due percorsi: allegato completo al primo colpo, e allegato incompleto →
rifiuto → ripresentazione.

## 5. Igiene participant-facing (statica, C9-A)

nessun token interno nei testi (ID di evidenza/proposizione/valore, reason code,
`atto5`, `m9_*`) · nessuna frase di falsa colpa · nessuna riga che attribuisca
l'omicidio · nessun `arresto`/`stato di fermo` · nessuna comparsa di `BOB` · nessuna
traccia della semantica rimossa (`Missoula … lavoro`, `trasferta`, `registro della
contea`, `garage municipale`) · writer unici · page ID globalmente unici
(M4+M5+M6+M8+M9) · `map_id` solo reali (`js/maps.js`) · nessun `goto`.
