# M8 — Matrice di validazione (contratto dei test dinamici per C8-B)

Perimetro: contratto della copertura DINAMICA, eseguita DAL runtime esteso in C8-B
(mai simulata). In C8-A esiste la copertura STATICA (`test/narrative-validate-m8.js`
— il numero dei controlli è STAMPATO dal validatore).

## 1. La matrice canonica: 27 percorsi (C8-A.1)

```
promise_stance × warning_target × focus_destination = 3 × 3 × 3 = 27 percorsi
```
`promise_stance`: accompagno · autonomia · prudenza
`warning_target`: palmer · centrale · nessuno
`focus_destination`: palmer · lago · diner
La tabella causale FONDAMENTALE resta warning × focus = 9; ma servono **27
percorsi** (dynamic_matrix_declares_27_paths) per provare che la promessa è DAVVERO
ORTOGONALE — con 9 percorsi e una promessa distribuita ciclicamente non si
dimostra che, es., `prudenza` non contamina tutte le combinazioni Palmer o lago.
Derivate: versione D da `body_found_by` (cooper se focus=lago, altrimenti hawk);
eco da `promise_stance`; logistica Sarah da `sarah_support_state` (none/vice).

### Asserzioni per OGNI percorso (dal contratto §13)

1. `promise_stance` scritta una volta (write-once), eco corretta al lago.
2. `warning_target` scritta una volta; `presagio_status: active` scritto al
   Roadhouse (mai prima, mai come entry).
3. Stati nominali (scritti in OGNI scelta telefonica, `none` esplicito ≠ undefined):
   `maddy_action_after_warning` = `departure_prepared` **iff** warning=palmer, `none`
   altrimenti; `sarah_support_state` = `vice` **iff** warning=centrale, `none`
   altrimenti. (Non «presente solo se»: entrambi i valori sono sempre scritti.)
4. `focus_destination` scritta una volta; il ramo route corretto raggiungibile,
   gli altri no; `body_found_by` = cooper (lago) / hawk (palmer, diner).
5. Ritrovamento: E9A/E9B scritte SEMPRE; `letter_o_chain=standard`;
   `letter_o_observation_source` = cooper_primary (cooper) / hawk_preserved (hawk);
   `maddy_trovata` SOLO qui; `presagio_status` active→**verified** SOLO qui.
6. `letter_o_chain = standard` in ENTRAMBE le versioni (catalogo consolidato);
   `letter_o_observation_source` = cooper_primary (Cooper primo) / hawk_preserved
   (secondi): arrivare secondi NON indebolisce la prova — cambia una riga di M9,
   mai il gate (nessun «in_situ solo se Cooper primo»).
7. `body_found_by` mai `sarah`; chi arriva al lago mai Sarah.
8. La valigia/biglietto è visibile **se e solo se `warning_target=palmer`**: in C
   (route Palmer) se `focus=palmer`, in F (station) se `focus=lago|diner`; con
   `warning=centrale|nessuno` NESSUNA pagina valigia in alcun percorso. Mai
   «visibile in ogni percorso».
9. P8 formulata SOLO dal doppio confronto (m8_cmp_diary A); B/C respinte;
   `factual_status ≤ corroborated`; P7 resta ipotesi.
10. Obiettivo univoco a ogni passo (priorità 50/100/200/250/300/350/400; catena raggiungibile 50→250→100→200→300→350→400):
    obj_m8_0 (50, pre-diner: «Passa dal diner, questo pomeriggio.» → root azionabile m8_diner)
    → obj_m8_25 (250, Leland al diner dopo promise_stance) → obj_m8_1
    (100, Roadhouse solo dopo T_LELAND_TAXI) → obj_m8_2
    (200, torna all’incrocio; attivo solo con T_LELAND_TAXI) → obj_m8_3 (300, rileggi lettere/diario) → obj_m8_35 (350, porta
    il nesso alla centrale) → obj_m8_4 (400, contraddizione a Truman, dopo la stazione).
    L'obiettivo d'ingresso punta SEMPRE a una root disponibile.
11. Nessun softlock; save/load a ogni passo; M9 raggiungibile da tutti gli stati.
12. **Nessun percorso salva Maddy** (asserzione sull'ASSENZA del flag; nessun
    `maddy_salvabile`).
13. Nessuna contraddizione con la timeline autoriale T0-T7.
14. **Ordine D→E non saltabile (C8-A.2)**: `discovery_continues_to_promise_echo`
    (m8_discovery.next=m8_promise_echo); `comparisons_hidden_before_promise_echo` e
    `promise_echo_cannot_be_skipped_after_load` (cmp_letters/cmp_diary gated su
    node_done:m8_promise_echo, robusto dopo load); `P8_cannot_bypass_first_comparison`
    e `cmp_letters_commit_unlocks_cmp_diary` (cmp_diary gated su node_done:m8_cmp_letters).
15. **Obiettivo M9 post-stazione (C8-A.2)**: `station_objective_not_active_before_commit`
    — obj_m8_4 («contraddizione a Truman») attivo SOLO dopo node_done:m8_station;
    prima è attivo obj_m8_35 («porta il nesso alla centrale»). Sull'ultima pagina
    della stazione l'obiettivo M9 non è ancora attivo.

## 2. Transizione controllata (presagio_status)

`presagio_active_at_roadhouse` · `presagio_verified_only_at_discovery` ·
`presagio_reverse_transition_rejected` · `presagio_undeclared_transition_rejected`
· `presagio_survives_save_load` · `deserialize_rejects_presagio_out_of_domain`.

## 3. Record critici screen-truth (C8-D)

| Momento a schermo | Stato ancora falso/nullo |
|---|---|
| prompt promessa (diner) | promise_stance null |
| enunciato del Gigante (roadhouse p04) | presagio_status null (active al commit del nodo Roadhouse, dopo l'ultima pagina — mai «dopo la scelta») |
| ultima pagina ritrovamento (per body_found_by) | E9A/E9B false, maddy_trovata false, presagio ancora `active` |
| feedback A di P8 (cmp_diary) | P8 unformulated (formulata dopo il commit) |
| ultima pagina stazione | obiettivo ≠ «contraddizione a Truman» prima del commit |

## 4. Percorso fisico (C8-E)

Almeno DUE combinazioni camminate nel motore vero (es. palmer×lago e centrale×diner)
con transizioni di PRODUZIONE (porte reali, no teleport sui segmenti); route log.

## 5. Igiene participant-facing (statica, C8-A)

nessun `maddy_salvabile` · nessuna frase di falsa colpa («avresti/se fossi
arrivato/strada sbagliata/dovevi chiamare/raggiungi-salva Maddy») · nessuna opzione
nomina Maddy come bersaglio · nessun token interno nei testi · `authorial_timeline`
mai scritta da un effetto · writer unici · page ID globalmente unici (M4+M5+M6+M8).
