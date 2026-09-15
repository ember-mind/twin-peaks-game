# Pacing Atto 2 (NVS02) — stato attuale

Misurato headless con `node test/probe-act2-pacing.js`, a partire direttamente dal risveglio in `room_315` (non ri-simula l'Atto 1) fino alla presentazione a Truman del nesso P2 (nodo M4 `present_truman_m4`, che imposta `flags.atto3` nel runtime narrativo).

Velocita' giocatore reale (da `js/engine.js`): SPEED=0.075, TILE=16px -> 213.33 ms/tile (4.688 tile/s).

Velocita' di lettura stimata: 12 caratteri/s (riferimento) e 15 caratteri/s (lettore veloce), + 0.6s per pagina (tempo di lettura/input).

Il testo live dell'Atto 2 arriva da due sistemi: dialoghi **classici** (`js/data.js`, colonna Sistema = `classico`) e nodi del **runtime narrativo M4** (`narrative/missions/M4.json`, colonna Sistema = `narrativo(M4)`), misurati chiamando direttamente `prepareNode`/`commitNode`/`prepareChoice`/`commitChoice`/`preparePresentation`/`commitPresentation`, mai attraverso la dialogue box classica.

## Beat per beat (percorso obbligato)

| # | Tipo | Sistema | Dettaglio | Tiles a piedi | Sec. camminati | Pagine | Caratteri | Sec. lettura (12cps) | Sec. lettura (15cps) |
|---|------|---------|-----------|---------------:|----------------:|-------:|----------:|---------------:|---------------:|
| 1 | mappa | — | room_315 @(2,6) | 0 | 0.00 | | | | |
| 2 | dialogo | classico | Risveglio (hotel_risveglio) (`hotel_risveglio`) | | | 7 | 336 | 32.20 | 26.60 |
| 3 | mappa | — | room_315 @(7,11) — porta verso hotel_gn | 10 | 2.13 | | | | |
| 4 | mappa | — | hotel_gn @(14,2) (~approx) — arrivo da room_315 | 16 | 3.41 | | | | |
| 5 | mappa | — | hotel_gn @(9,11) — porta verso town | 14 | 2.99 | | | | |
| 6 | mappa | — | town @(9,7) (~approx) — arrivo da hotel_gn | 4 | 0.85 | | | | |
| 7 | mappa | — | town @(12,20) — porta verso sheriffs_station_exterior | 18 | 3.84 | | | | |
| 8 | mappa | — | sheriffs_station_exterior @(7,10) (~approx) — arrivo da town | 15 | 3.20 | | | | |
| 9 | mappa | — | sheriffs_station_exterior @(7,6) — porta verso sheriff | 4 | 0.85 | | | | |
| 10 | mappa | — | sheriff @(7,10) (~approx) — arrivo da sheriffs_station_exterior | 4 | 0.85 | | | | |
| 11 | mappa | — | sheriff @(11,4) | 10 | 2.13 | | | | |
| 12 | nodo M4 | narrativo(M4) | Truman: racconta il sogno (M4 B1) (`truman_a2`) | | | 7 | 491 | 45.12 | 36.93 |
| 13 | mappa | — | sheriff @(8,11) — porta verso sheriffs_station_exterior | 10 | 2.13 | | | | |
| 14 | mappa | — | sheriffs_station_exterior @(7,7) (~approx) — arrivo da sheriff | 5 | 1.07 | | | | |
| 15 | mappa | — | sheriffs_station_exterior @(7,11) — porta verso town | 4 | 0.85 | | | | |
| 16 | mappa | — | town @(12,21) (~approx) — arrivo da sheriffs_station_exterior | 15 | 3.20 | | | | |
| 17 | mappa | — | town @(23,6) — porta verso hospital | 26 | 5.55 | | | | |
| 18 | mappa | — | hospital @(7,10) (~approx) — arrivo da town | 20 | 4.27 | | | | |
| 19 | mappa | — | hospital @(3,6) | 8 | 1.71 | | | | |
| 20 | nodo M4 | narrativo(M4) | Ronette: interrogatorio, "chi era l'uomo?" (M4 B2) (`ronette_q + ronette_uomo`) | | | 9 | 477 | 45.15 | 37.20 |
| 21 | mappa | — | hospital @(7,11) — porta verso town | 9 | 1.92 | | | | |
| 22 | mappa | — | town @(23,7) (~approx) — arrivo da hospital | 20 | 4.27 | | | | |
| 23 | mappa | — | town @(42,20) — porta verso double_r_exterior_prototype | 34 | 7.25 | | | | |
| 24 | mappa | — | double_r_exterior_prototype @(6,10) (~approx) — arrivo da town | 46 | 9.81 | | | | |
| 25 | mappa | — | double_r_exterior_prototype @(6,6) — porta verso diner | 4 | 0.85 | | | | |
| 26 | mappa | — | diner @(6,8) (~approx) — arrivo da double_r_exterior_prototype | 2 | 0.43 | | | | |
| 27 | mappa | — | diner @(9,7) | 4 | 0.85 | | | | |
| 28 | nodo M4 | narrativo(M4) | James: l'altra meta' del cuore (M4 B4) (`james_a2`) | | | 10 | 688 | 63.33 | 51.87 |
| 29 | nodo M4 | narrativo(M4) | Taccuino: confronto E6A/T_JAMES_EST -> P2 (M4 B8, 0 tile) (`cmp_e6a_tjames + b8_a`) | | | 4 | 319 | 28.98 | 23.67 |
| 30 | mappa | — | diner @(7,9) — porta verso double_r_exterior_prototype | 4 | 0.85 | | | | |
| 31 | mappa | — | double_r_exterior_prototype @(6,7) (~approx) — arrivo da diner | 3 | 0.64 | | | | |
| 32 | mappa | — | double_r_exterior_prototype @(6,11) — porta verso town | 4 | 0.85 | | | | |
| 33 | mappa | — | town @(42,21) (~approx) — arrivo da double_r_exterior_prototype | 46 | 9.81 | | | | |
| 34 | mappa | — | town @(12,20) — porta verso sheriffs_station_exterior | 31 | 6.61 | | | | |
| 35 | mappa | — | sheriffs_station_exterior @(7,10) (~approx) — arrivo da town | 15 | 3.20 | | | | |
| 36 | mappa | — | sheriffs_station_exterior @(7,6) — porta verso sheriff | 4 | 0.85 | | | | |
| 37 | mappa | — | sheriff @(7,10) (~approx) — arrivo da sheriffs_station_exterior | 4 | 0.85 | | | | |
| 38 | mappa | — | sheriff @(11,4) | 10 | 2.13 | | | | |
| 39 | nodo M4 | narrativo(M4) | Presenta a Truman il nesso P2 (M4 B9) (`present_truman_m4 + present(P2)`) | | | 8 | 559 | 51.38 | 42.07 |

## Totali (a) solo percorso obbligato

| Metrica | Valore |
|---|---|
| Camminata totale (tile) | 423 |
| Camminata totale (sec) | 90.2 |
| Interazioni obbligatorie (dialoghi classici + nodi M4) | 6 |
| Pagine totali | 45 |
| Caratteri totali | 2870 |
| Tempo di lettura a 12 caratteri/s (sec) | 266.2 |
| Tempo di lettura a 15 caratteri/s (sec) | 218.3 |
| **Tempo totale (12cps): cammino + lettura** | **356.4 sec (~5.9 min)** |
| **Tempo totale (15cps): cammino + lettura** | **308.6 sec (~5.1 min)** |

## Totali (b) percorso obbligato + tutte le opzionali misurate

| Metrica | Valore |
|---|---|
| Camminata totale (tile, obbl.+opz.) | 499 |
| Camminata totale (sec, obbl.+opz.) | 106.5 |
| Interazioni totali (obbl.+opz.) | 15 |
| Pagine totali (obbl.+opz.) | 75 |
| Caratteri totali (obbl.+opz.) | 4995 |
| Tempo di lettura a 12 caratteri/s (sec, obbl.+opz.) | 461.3 |
| Tempo di lettura a 15 caratteri/s (sec, obbl.+opz.) | 378.0 |
| **Tempo totale (12cps): cammino + lettura, obbl.+opz.** | **567.7 sec (~9.5 min)** |
| **Tempo totale (15cps): cammino + lettura, obbl.+opz.** | **484.5 sec (~8.1 min)** |

## Tempo prima della prima interazione significativa

Somma di tile/secondi camminati dallo spawn in `room_315` (dopo il monologo del risveglio, ESCLUSO) fino alla tile di approccio a Truman (prima visita, prima di `truman_a2`): attraversa room_315 -> hotel_gn -> town -> sheriffs_station_exterior -> sheriff. Include SOLO cammino, non il dialogo di risveglio.

- Tile camminati: **95**
- Secondi camminati: **20.3**

## Dialogo/nodo piu' lungo (percorso obbligato)

`james_a2` — James: l'altra meta' del cuore (M4 B4) (sistema: narrativo(M4)) — 688 caratteri, 10 pagine (~63.3s a 12cps).

## Conteggi

| Metrica | Valore |
|---|---|
| Interazioni obbligatorie (dialoghi + nodi M4) | 6 |
| Interazioni opzionali misurate | 9 |
| Tile camminati (solo obbligatorio) | 423 |
| Tile camminati (obbligatorio + opzionale) | 499 |

## Interazioni opzionali (misurate: BFS reale + pagine/caratteri statici)

| Mappa | Sistema | Etichetta (id) | Tiles a piedi | Sec. camminati | Pagine | Caratteri | Sec. lettura (12cps) |
|---|---|---|---:|---:|---:|---:|---:|
| hotel_gn | classico | Ben Horne (`benhorne_a2`) | 13 | 2.77 | 4 | 287 | 26.32 |
| hotel_gn | classico | Audrey (dopo Ben Horne) (`audrey_a2_ben`) | 10 | 2.13 | 4 | 356 | 32.07 |
| sheriff | classico | Hawk (`hawk_a2`) | 8 | 1.71 | 3 | 194 | 17.97 |
| hospital | classico | Gerard (`gerard_a2`) | 11 | 2.35 | 5 | 364 | 33.33 |
| hospital | narrativo(M4) | Infermiera (contesto, M4) (`infermiera_ctx`) | 0 | 0.00 | 4 | 212 | 20.07 |
| diner | classico | Norma (`norma_a2`) | 18 | 3.84 | 3 | 188 | 17.47 |
| room_315 | classico | Letto (room 315) (`letto_315`) | 0 | 0.00 | 2 | 159 | 14.45 |
| room_315 | classico | Specchio (room 315) (`specchio315`) | 13 | 2.77 | 2 | 169 | 15.28 |
| room_315 (~approx) | classico | Scrivania (room 315, dopo Ronette) (`scrivania_315_bob`) | 3 | 0.64 | 3 | 196 | 18.13 |

## Note di approssimazione (cambi mappa / BFS senza percorso)

- room_315(7,11) -> hotel_gn(14,2): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- hotel_gn(9,11) -> town(9,7): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- town(12,20) -> sheriffs_station_exterior(7,10): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- sheriffs_station_exterior(7,6) -> sheriff(7,10): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- sheriff(8,11) -> sheriffs_station_exterior(7,7): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- sheriffs_station_exterior(7,11) -> town(12,21): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- town(23,6) -> hospital(7,10): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- hospital(7,11) -> town(23,7): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- town(42,20) -> double_r_exterior_prototype(6,10): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- double_r_exterior_prototype(6,6) -> diner(6,8): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- diner(7,9) -> double_r_exterior_prototype(6,7): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- double_r_exterior_prototype(6,11) -> town(42,21): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- town(12,20) -> sheriffs_station_exterior(7,10): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- sheriffs_station_exterior(7,6) -> sheriff(7,10): cambio mappa, distanza reale non BFS-abile, Manhattan approssimato
- opzionale "Scrivania (room 315, dopo Ronette)": salto diretto sheriff(11,4) -> room_315(8,4), Manhattan, instradamento intermedio non modellato

## Altre note

- room_315.doors e' {} in js/maps.js (statico): la porta verso hotel_gn e' installata a runtime dalla connessione "great-northern-room-315-hall" (js/world-connections.gen.js, applicata da js/room-315-production.js). Dump a runtime: room_315.doors["7,11"] -> hotel_gn(14,2,down); hotel_gn.doors["14,1"] -> room_315(7,10,up).

## Limiti dichiarati

- Le distanze a piedi ENTRO la stessa mappa fra due interazioni consecutive sono BFS reale sulla griglia calpestabile (stessa nozione di "tile bloccato" di `test/walkthrough.js`/`test/probe-acts12-pacing.js`), valutata sullo stato reale della run.
- Ogni attraversamento di porta e' scomposto in DUE beat: cammino fino alla porta (BFS reale sulla mappa di partenza) e arrivo sulla mappa successiva (Manhattan fra le coordinate della porta e lo spawn di arrivo, perche' non si modella qui un router multi-hop reale fra porte diverse — stesso limite dichiarato di `test/probe-acts12-pacing.js`).
- Le porte con piu' tile trigger (piazzali) usano la tile piu' vicina alla posizione corrente, non un routing reale.
- Le interazioni OPZIONALI non vengono "giocate" attraverso la dialogue box classica: le pagine/caratteri sono letti direttamente dai dati statici (`GAME.Data.dialogues`/nodi M4, come per le obbligatorie), e la distanza a piedi e' un BFS reale dal punto piu' vicino gia' raggiunto dal percorso obbligato sulla stessa mappa — non un secondo playthrough integrale con motore e stato duplicati. E' una via di mezzo dichiarata fra "solo enumerazione" (come nel riferimento Atto1->2) e un secondo passaggio completo: restituisce cifre misurate (non solo un elenco), a un costo di implementazione minore.
- Il beat opzionale "Scrivania (room 315, dopo Ronette)" collassa in un UNICO salto Manhattan l'intero instradamento sheriff -> piazzale -> town -> hotel_gn -> room_315: e' una deviazione facoltativa di fine tratto, non si e' ritenuto utile scomporla porta per porta come il percorso obbligato.
- Sincronizzazione flag classici / runtime M4: `T1_RONETTE_BOB` viene scritto SOLO su `m4State.evidence` (runtime M4) dalla scelta `ronette_uomo`, mai su `S().evidence` (stato classico di `E.state`, usato da `E.resolveDialogue` per la cascata di `scrivania_315`). Per misurare la variante "_bob" — quella realmente raggiungibile narrativamente a quel punto — il beat opzionale della scrivania specchia manualmente `T1_RONETTE_BOB: true` in un oggetto di stato passato a `E.resolveDialogue`, senza toccare `S()` reale: e' una lettura mirata, non un'integrazione dei due sistemi.
- Tempo di lettura: stima lineare caratteri/velocita' + costante per pagina; non modella riletture, esitazioni o skip.
- `truman_a2`/`ronette_q`+`ronette_uomo`/`james_a2`/`cmp_e6a_tjames`+`b8_a`/`present_truman_m4`+P2 sono misurati chiamando direttamente le API del runtime M4 (non tramite `E.state.dialogue`): per `cmp_e6a_tjames` e `ronette_q`, il contenuto reso da una scelta (`feedback_pages`/nodo `goto`) e' catturato esplicitamente dal `prepared` di `prepareChoice`, perche' il wrapper `doChoice` di `test/act-2-flow.js`, copiato alla lettera, scarterebbe quelle pagine dal proprio return.
