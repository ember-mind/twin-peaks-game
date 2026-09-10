# Pacing Atto 1 -> Atto 2 (stato attuale)

Misurato headless con `node test/probe-acts12-pacing.js`, ripercorrendo esattamente il percorso obbligato di `test/smoke.js` fino al primo trigger di Atto 3 (dialogo `truman_atto3`, flag `atto3`).

Velocita' giocatore reale (da `js/engine.js`): SPEED=0.075, TILE=16px -> 213.33 ms/tile (4.688 tile/s).

Velocita' di lettura stimata: 12 caratteri/s + 0.6s per pagina (tempo di lettura/input).

## Beat per beat

| # | Tipo | Dettaglio | Tiles a piedi | Sec. camminati | Pagine | Caratteri | Sec. lettura |
|---|------|-----------|---------------:|----------------:|-------:|----------:|---------------:|
| 1 | mappa | town @(28,31) | 0 | 0.00 | | | |
| 2 | mappa | sheriff @(11,4) (~approx) | 44 | 9.39 | | | |
| 3 | dialogo | Truman iniziale (`truman`) | | | 6 | 568 | 50.93 |
| 4 | flag | `done_truman` impostato | | | | | |
| 5 | mappa | palmer @(6,2) (~approx) | 7 | 1.49 | | | |
| 6 | dialogo | camera di Laura (`laura_room`) | | | 4 | 296 | 27.07 |
| 7 | flag | `done_laura_room` impostato | | | | | |
| 8 | mappa | woods @(14,5) (~approx) | 11 | 2.35 | | | |
| 9 | mappa | redroom @(8,8) — hold ArrowUp nel bosco fino alla porta della Lodge, poi warp automatico | 1 | 0.21 | | | |
| 10 | mappa | redroom @(8,5) | 3 | 0.64 | | | |
| 11 | dialogo | Nano (mfap) (`mfap`) | | | 4 | 233 | 21.82 |
| 12 | flag | `met_mfap` impostato | | | | | |
| 13 | flag | `done_mfap` impostato | | | | | |
| 14 | mappa | redroom @(11,3) | 5 | 1.07 | | | |
| 15 | dialogo | sogno di Laura (`laura_sogno`) | | | 6 | 385 | 35.68 |
| 16 | flag | `sogno_fatto` impostato | | | | | |
| 17 | flag | `done_laura_sogno` impostato | | | | | |
| 18 | mappa | sheriff @(11,4) (~approx) | 1 | 0.21 | | | |
| 19 | dialogo | Truman post-sogno (`truman_a2`) | | | 4 | 351 | 31.65 |
| 20 | flag | `done_truman_a2` impostato | | | | | |
| 21 | mappa | hotel_gn @(5,6) (~approx) | 8 | 1.71 | | | |
| 22 | dialogo | Ben Horne (`benhorne_a2`) | | | 4 | 287 | 26.32 |
| 23 | flag | `done_benhorne_a2` impostato | | | | | |
| 24 | mappa | hotel_gn @(12,10) | 11 | 2.35 | | | |
| 25 | dialogo | Audrey (Great Northern) (`audrey_a2_ben`) | | | 4 | 356 | 32.07 |
| 26 | flag | `audrey_indaga` impostato | | | | | |
| 27 | flag | `done_audrey_a2_ben` impostato | | | | | |
| 28 | mappa | hospital @(12,4) (~approx) | 6 | 1.28 | | | |
| 29 | dialogo | Gerard (`gerard_a2`) | | | 5 | 364 | 33.33 |
| 30 | flag | `done_gerard_a2` impostato | | | | | |
| 31 | mappa | hospital @(3,6) | 11 | 2.35 | | | |
| 32 | dialogo | Ronette (`ronette_letto`) | | | 4 | 246 | 22.90 |
| 33 | flag | `ronette_bob` impostato | | | | | |
| 34 | flag | `done_ronette_letto` impostato | | | | | |
| 35 | mappa | diner @(9,7) (~approx) | 7 | 1.49 | | | |
| 36 | dialogo | James (`james_a2`) | | | 5 | 424 | 38.33 |
| 37 | flag | `done_james_a2` impostato | | | | | |
| 38 | mappa | sheriff @(11,4) (~approx) | 5 | 1.07 | | | |
| 39 | dialogo | Truman Atto 3 (trigger) (`truman_atto3`) | | | 4 | 263 | 24.32 |
| 40 | flag | `atto3` impostato | | | | | |
| 41 | flag | `done_truman_atto3` impostato | | | | | |

## Riepilogo

| Metrica | Valore |
|---|---|
| Camminata totale (tile) | 120 |
| Camminata totale (sec) | 25.6 |
| Interazioni obbligatorie (dialoghi) | 11 |
| Pagine totali di dialogo obbligatorio | 50 |
| Caratteri totali di dialogo obbligatorio | 3773 |
| Tempo di lettura stimato (sec) | 344.4 |
| Dialogo obbligatorio piu' lungo | `truman` (568 caratteri, 6 pagine) |
| Flag impostati lungo il percorso | 16 (done_truman, done_laura_room, met_mfap, done_mfap, sogno_fatto, done_laura_sogno, done_truman_a2, done_benhorne_a2, audrey_indaga, done_audrey_a2_ben, done_gerard_a2, ronette_bob, done_ronette_letto, done_james_a2, atto3, done_truman_atto3) |
| Interazioni opzionali raggiungibili sulle mappe toccate | 10 |
| **Tempo totale stimato (cammino + lettura)** | **370.0 sec (~6.2 min)** |

## Interazioni opzionali per mappa (stima prudente per eccesso)

NPC/oggetti presenti e attivi con lo stato di flag/indizi raggiunto a fine tratto, non parte della sequenza obbligata. Alcuni potrebbero sbloccarsi solo più avanti nel tratto stesso (sovrastima).

| Mappa | Opzionali | Elenco |
|---|---:|---|
| town | 7 | npc:donna (`donna`), npc:jacoby (`jacoby`), object:1,0 (`landmark_waterfall`), object:48,21 (`landmark_cemetery`), object:30,30 (`sign_town`), object:30,30 (`sign_town`), object:50,22 (`tomba_laura`) |
| sheriff | 1 | npc:andy (`andy`) |
| palmer | 0 | - |
| woods | 2 | object:14,12 (`olio`), object:11,16 (`sign_grove`) |
| redroom | 0 | - |
| hotel_gn | 0 | - |
| hospital | 0 | - |
| diner | 0 | - |

## Note di approssimazione

Distanze NON derivate da BFS reale (cambio mappa: la topologia porta-a-porta multi-hop non è modellata qui, per scelta dichiarata nel task; si usa Manhattan riga/colonna fra le coordinate di arrivo/partenza registrate):

- town(28,31) -> sheriff(11,4): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- sheriff(11,4) -> palmer(6,2): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- palmer(6,2) -> woods(14,5): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- redroom(11,3) -> sheriff(11,4): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- sheriff(11,4) -> hotel_gn(5,6): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- hotel_gn(12,10) -> hospital(12,4): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- hospital(3,6) -> diner(9,7): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- diner(9,7) -> sheriff(11,4): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato

## Limiti dichiarati

- Le distanze a piedi ENTRO la stessa mappa fra due interazioni consecutive sono BFS reale sulla griglia calpestabile (stessa nozione di "tile bloccato" di `test/walkthrough.js`: solidità, porte, NPC attivi, oggetti), valutata sullo stato reale della run.
- Le distanze quando l'interazione successiva richiede un CAMBIO MAPPA sono approssimate con Manhattan fra le coordinate registrate (riga/colonna), come esplicitamente concesso dal task: non si modella qui il routing porta-a-porta fra mappe diverse.
- Il tratto nel bosco (bosco -> Stanza Rossa) usa un vero `hold(ArrowUp, 800ms)`: la distanza a piedi lì è 1 tile reale prima del warp automatico, il resto del tempo di hold è dissolvenza/caricamento, non camminata a tile aggiuntivi (non ci sono altri tile calpestabili fra 14,5 e 14,4 su quella mappa in questo punto).
- Tempo di lettura: stima lineare caratteri/velocità + costante per pagina; non modella riletture, esitazioni o skip.
