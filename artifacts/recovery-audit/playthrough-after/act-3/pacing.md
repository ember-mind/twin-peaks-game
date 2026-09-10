# Pacing Atto 3 (M5 + M6) — stato attuale

Misurato headless con `node test/probe-act3-pacing.js`, a partire da Cooper alla centrale dello sceriffo con l'Atto 2 gia' chiuso (`flags.atto3`, P2 accettata da Truman — ricostruito silenziosamente rigiocando la stessa catena M4 di `test/act-3-flow.js::m5Base()`, non loggato come contenuto dell'Atto 3) fino al nodo `m6_atto4_bridge` (imposta `flags.atto4`).

Velocita' giocatore reale: SPEED=0.075, TILE=16px -> 213.33 ms/tile (4.688 tile/s). Lettura: 12/15 caratteri/s + 0.6s/pagina.

Confronto con la stima di design (docs/act-3-design-report.md §13): **15-17 min** per il percorso obbligato.

## Percorso obbligato: range su teorie e tattiche

| Teoria iniziale | Tattica | Tile a piedi | Pagine | Caratteri | Tempo (12cps) | Tempo (15cps) |
|---|---|---:|---:|---:|---:|---:|
| degeneration | prova | 688 | 93 | 6878 | 775.7s (~12.93 min) | 661.1s (~11.02 min) |
| degeneration | pressione | 688 | 91 | 6961 | 781.5s (~13.02 min) | 665.4s (~11.09 min) |
| degeneration | falsa_sicurezza | 688 | 90 | 6801 | 767.5s (~12.79 min) | 654.2s (~10.90 min) |
| withheld | prova | 688 | 91 | 6698 | 759.5s (~12.66 min) | 647.9s (~10.80 min) |
| withheld | pressione | 688 | 91 | 6927 | 778.6s (~12.98 min) | 663.2s (~11.05 min) |
| withheld | falsa_sicurezza | 688 | 90 | 6767 | 764.7s (~12.74 min) | 651.9s (~10.87 min) |

**Range percorso obbligato (12cps): 759.5s (~12.66 min) — 781.5s (~13.02 min).**

**Range percorso obbligato (15cps): 647.9s (~10.80 min) — 665.4s (~11.09 min).**

Stima di design: 900-1020s (15-17 min). Range misurato (12cps) NON interseca la stima di design.

## Beat per beat (percorso canonico: teoria "degeneration"/impeto, tattica "prova")

| # | Tipo | Sistema | Dettaglio | Tiles a piedi | Sec. camminati | Pagine | Caratteri | Sec. lettura (12cps) |
|---|------|---------|-----------|---------------:|----------------:|-------:|----------:|---------------:|
| 1 | mappa | — | sheriff @(11,4) | 0 | 0.00 | | | |
| 2 | mappa | — | sheriff @(8,11) — porta verso sheriffs_station_exterior | 10 | 2.13 | | | |
| 3 | mappa | — | sheriffs_station_exterior @(7,7) (~approx) — arrivo da sheriff | 5 | 1.07 | | | |
| 4 | mappa | — | sheriffs_station_exterior @(7,11) — porta verso town | 4 | 0.85 | | | |
| 5 | mappa | — | town @(12,21) (~approx) — arrivo da sheriffs_station_exterior | 15 | 3.20 | | | |
| 6 | mappa | — | town @(55,15) — porta verso traincar | 49 | 10.45 | | | |
| 7 | mappa | — | traincar @(1,7) (~approx) — arrivo da town | 62 | 13.23 | | | |
| 8 | mappa | — | traincar @(4,7) | 3 | 0.64 | | | |
| 9 | narrativo | narrativo(M5) | Ponte: direzione e impronte (M5 A2) (`m5_bridge`) | | | 6 | 537 | 48.35 |
| 10 | mappa | — | traincar @(13,7) | 11 | 2.35 | | | |
| 11 | narrativo | narrativo(M5) | Vagone scoperto + prima lettura (M5 A3) (`m5_discovery + m5_theory_initial.theory_degeneration`) | | | 5 | 477 | 42.75 |
| 12 | mappa | — | traincar @(13,6) | 1 | 0.21 | | | |
| 13 | narrativo | narrativo(M5) | Mucchio: biglietto (M5 A4) (`m5_mound`) | | | 5 | 429 | 38.75 |
| 14 | mappa | — | traincar @(13,5) | 1 | 0.21 | | | |
| 15 | narrativo | narrativo(M5) | Anello (M5 A5) (`m5_ring`) | | | 5 | 339 | 31.25 |
| 16 | mappa | — | traincar @(12,5) | 1 | 0.21 | | | |
| 17 | narrativo | narrativo(M5) | Centro della scena (M5 A6) (`m5_scene`) | | | 3 | 360 | 31.80 |
| 18 | narrativo | narrativo(M5) | Confronto: la polvere intorno all'anello (M5 A9) (`m5_cmp_ring + ring_a`) | | | 2 | 167 | 15.12 |
| 19 | narrativo | narrativo(M5) | Revisione della teoria (M5 A10, m5_theory_revision) (`m5_theory_revision + revision_switch`) | | | 2 | 166 | 15.03 |
| 20 | narrativo | narrativo(M5) | Rapporto a Truman sul posto (M5 A12) (`m5_report_intro`) | | | 6 | 465 | 42.35 |
| 21 | narrativo | narrativo(M5) | Custodia S1 (M5 A13) (`m5_s1 + s1_documented`) | | | 3 | 247 | 22.38 |
| 22 | narrativo | narrativo(M5) | Chiusura del rapporto (M5 A13) (`m5_report_close`) | | | 0 | 0 | 0.00 |
| 23 | mappa | — | traincar @(21,2) | 20 | 4.27 | | | |
| 24 | narrativo | narrativo(M5) | Il taglio a nord (M5 A14) (`m5_tracks_north`) | | | 3 | 258 | 23.30 |
| 25 | mappa | — | traincar @(21,0) — porta verso oej | 2 | 0.43 | | | |
| 26 | mappa | — | oej @(8,8) (~approx) — arrivo da traincar | 21 | 4.48 | | | |
| 27 | mappa | — | oej @(7,5) | 4 | 0.85 | | | |
| 28 | narrativo | narrativo(M6) | Jacques: il tavolo (M6 B1-B2) (`m6_ferry`) | | | 5 | 235 | 22.58 |
| 29 | narrativo | narrativo(M6) | Scelta della tattica (M6 B3, prova) (`m6_tactic + tactic_prova`) | | | 4 | 267 | 24.65 |
| 30 | narrativo | narrativo(M6) | Interrogatorio (M6 B4-B6, m6_interrogation_prova) (`m6_interrogation_prova`) | | | 9 | 546 | 50.90 |
| 31 | narrativo | narrativo(M6) | Formulazione di P5 (M6 B6b) (`m6_p5 + p5_present`) | | | 2 | 140 | 12.87 |
| 32 | narrativo | narrativo(M6) | Fermo di Jacques (M6 B7) (`m6_arrest`) | | | 7 | 456 | 42.20 |
| 33 | mappa | — | oej @(7,9) — porta verso traincar | 4 | 0.85 | | | |
| 34 | mappa | — | traincar @(21,1) (~approx) — arrivo da oej | 22 | 4.69 | | | |
| 35 | mappa | — | traincar @(0,7) — porta verso town | 29 | 6.19 | | | |
| 36 | mappa | — | town @(54,14) (~approx) — arrivo da traincar | 61 | 13.01 | | | |
| 37 | mappa | — | town @(23,6) — porta verso hospital | 39 | 8.32 | | | |
| 38 | mappa | — | hospital @(7,10) (~approx) — arrivo da town | 20 | 4.27 | | | |
| 39 | mappa | — | hospital @(13,7) | 9 | 1.92 | | | |
| 40 | narrativo | narrativo(M6) | Il piantone in ospedale (M6 B7c) (`m6_hospital_guard`) | | | 4 | 303 | 27.65 |
| 41 | mappa | — | hospital @(8,11) — porta verso town | 9 | 1.92 | | | |
| 42 | mappa | — | town @(23,7) (~approx) — arrivo da hospital | 19 | 4.05 | | | |
| 43 | mappa | — | town @(12,20) — porta verso sheriffs_station_exterior | 26 | 5.55 | | | |
| 44 | mappa | — | sheriffs_station_exterior @(7,10) (~approx) — arrivo da town | 15 | 3.20 | | | |
| 45 | mappa | — | sheriffs_station_exterior @(7,6) — porta verso sheriff | 4 | 0.85 | | | |
| 46 | mappa | — | sheriff @(7,10) (~approx) — arrivo da sheriffs_station_exterior | 4 | 0.85 | | | |
| 47 | mappa | — | sheriff @(11,4) | 10 | 2.13 | | | |
| 48 | narrativo | narrativo(M6) | Rapporto notturno a Truman (M6 B7b) (`m6_return_night`) | | | 5 | 417 | 37.75 |
| 49 | mappa | — | sheriff @(2,5) | 10 | 2.13 | | | |
| 50 | narrativo | narrativo(M6) | La telefonata di Lucy (M6 B8) (`m6_news`) | | | 4 | 287 | 26.32 |
| 51 | mappa | — | sheriff @(7,11) — porta verso sheriffs_station_exterior | 11 | 2.35 | | | |
| 52 | mappa | — | sheriffs_station_exterior @(7,7) (~approx) — arrivo da sheriff | 4 | 0.85 | | | |
| 53 | mappa | — | sheriffs_station_exterior @(7,11) — porta verso town | 4 | 0.85 | | | |
| 54 | mappa | — | town @(12,21) (~approx) — arrivo da sheriffs_station_exterior | 15 | 3.20 | | | |
| 55 | mappa | — | town @(9,6) — porta verso hotel_gn | 18 | 3.84 | | | |
| 56 | mappa | — | hotel_gn @(8,10) (~approx) — arrivo da town | 5 | 1.07 | | | |
| 57 | mappa | — | hotel_gn @(14,1) — porta verso room_315 | 15 | 3.20 | | | |
| 58 | mappa | — | room_315 @(7,10) (~approx) — arrivo da hotel_gn | 16 | 3.41 | | | |
| 59 | mappa | — | room_315 @(13,4) | 12 | 2.56 | | | |
| 60 | dialogue | classico | Specchio: il Gigante (classico gigante1_dlg, dopo M6 B8) (`gigante1_dlg`) | | | 7 | 350 | 33.37 |
| 61 | mappa | — | room_315 @(7,11) — porta verso hotel_gn | 13 | 2.77 | | | |
| 62 | mappa | — | hotel_gn @(14,2) (~approx) — arrivo da room_315 | 16 | 3.41 | | | |
| 63 | mappa | — | hotel_gn @(9,11) — porta verso town | 14 | 2.99 | | | |
| 64 | mappa | — | town @(9,7) (~approx) — arrivo da hotel_gn | 4 | 0.85 | | | |
| 65 | mappa | — | town @(12,20) — porta verso sheriffs_station_exterior | 18 | 3.84 | | | |
| 66 | mappa | — | sheriffs_station_exterior @(7,10) (~approx) — arrivo da town | 15 | 3.20 | | | |
| 67 | mappa | — | sheriffs_station_exterior @(7,6) — porta verso sheriff | 4 | 0.85 | | | |
| 68 | mappa | — | sheriff @(7,10) (~approx) — arrivo da sheriffs_station_exterior | 4 | 0.85 | | | |
| 69 | mappa | — | sheriff @(11,4) | 10 | 2.13 | | | |
| 70 | narrativo | narrativo(M6) | Il ponte all'Atto 4 (M6 B9) (`m6_atto4_bridge`) | | | 6 | 432 | 39.60 |

## Contenuto opzionale (misurato separatamente)

| Mappa | Sistema | Etichetta (id) | Tiles a piedi | Sec. camminati | Pagine | Caratteri | Sec. lettura (12cps) |
|---|---|---|---:|---:|---:|---:|---:|
| traincar | narrativo(M5) | Stufa (M5 A7, opzionale) (`m5_stove`) | 1 | 0.21 | 3 | 306 | 27.30 |
| traincar | narrativo(M5) | Carte (M5 A8, opzionale) (`m5_cards`) | 3 | 0.64 | 4 | 353 | 31.82 |
| traincar | narrativo(M5) | Cartello One Eyed Jacks (M5 A14, opzionale) (`m5_sign_oej`) | 2 | 0.43 | 2 | 165 | 14.95 |
| oej | narrativo(M6) | Confronto carte <-> testimonianza (M6 B4c, opzionale, m6_cmp_cards_prova) (`m6_cmp_cards_prova`) | 0 | 0.00 | 2 | 152 | 13.87 |
| hospital (~approx) | narrativo(M6) | Registro notturno, ritorno (M6 B10, opzionale) (`m6_hospital`) | 89 | 18.99 | 4 | 271 | 24.98 |

**Totale contenuto opzionale misurato: 95 tile (20.3s), 15 pagine, 1247 caratteri -> 133.2s (12cps) / 112.4s (15cps).**

## Contenuto opzionale NON misurato in questo run (stato non raggiunto)

- Confronto biglietto <-> verso (M5 A11): richiede E5_POESIA (Atto 2 opzionale "Letto, room 315"), non presente in questo run che non rigioca il contenuto opzionale dell'Atto 2.
- Audrey a One Eyed Jacks (M6 B3): richiede flags.audrey_indaga, scritto solo dal ramo classico audrey_a2/audrey_a2_ben (Atto 2 opzionale), non presente in questo run.

## Blocco passivo piu' lungo (pagine consecutive senza cambio mappa)

m6_ferry + m6_tactic + tactic_prova + m6_interrogation_prova + m6_p5 + p5_present + m6_arrest — 27 pagine, 1644 caratteri (~153.2s a 12cps).

## Tratto a piedi ininterrotto piu' lungo

traincar @(1,7) — 62 tile (13.2s).

## Tempo prima della prima interazione significativa

Cammino dalla centrale (Truman) fino al ponte (`m5_bridge`), ESCLUSO il dialogo: **145 tile (30.9s)**.

## Conteggi (percorso canonico)

| Metrica | Valore |
|---|---|
| Osservazioni obbligatorie (M5) | 6 (m5_bridge, m5_mound, m5_ring, m5_scene, m5_cmp_ring, m5_tracks_north) |
| Deduzioni del giocatore (nodi choice con >= 2 opzioni non-retry) | 5 (m5_theory_initial, m5_theory_revision, m5_cmp_ring, m6_tactic, m6_p5) |
| Scelte significative (valori write-once) | 4 (m5_initial_theory, m5_final_theory, s1, m6_tactic) |
| Tile camminati (percorso obbligato, canonico) | 688 |
| Pagine (percorso obbligato, canonico) | 93 |
| Caratteri (percorso obbligato, canonico) | 6878 |

## Note di approssimazione (cambi mappa / BFS senza percorso)

- opzionale "Registro notturno, ritorno": deviazione sceriffo->piazzale->town->ospedale (andata e ritorno non modellati separatamente, solo l'andata); tile della deviazione ESPUNTI dal percorso obbligato.
- sheriff(8,11) -> sheriffs_station_exterior(7,7): Manhattan (cambio mappa)
- sheriffs_station_exterior(7,11) -> town(12,21): Manhattan (cambio mappa)
- town(55,15) -> traincar(1,7): Manhattan (cambio mappa)
- traincar(21,0) -> oej(8,8): Manhattan (cambio mappa)
- oej(7,9) -> traincar(21,1): Manhattan (cambio mappa)
- traincar(0,7) -> town(54,14): Manhattan (cambio mappa)
- town(23,6) -> hospital(7,10): Manhattan (cambio mappa)
- hospital(8,11) -> town(23,7): Manhattan (cambio mappa)
- town(12,20) -> sheriffs_station_exterior(7,10): Manhattan (cambio mappa)
- sheriffs_station_exterior(7,6) -> sheriff(7,10): Manhattan (cambio mappa)
- sheriff(7,11) -> sheriffs_station_exterior(7,7): Manhattan (cambio mappa)
- town(9,6) -> hotel_gn(8,10): Manhattan (cambio mappa)
- hotel_gn(14,1) -> room_315(7,10): Manhattan (cambio mappa)
- room_315(7,11) -> hotel_gn(14,2): Manhattan (cambio mappa)
- hotel_gn(9,11) -> town(9,7): Manhattan (cambio mappa)

## Limiti dichiarati

- Stesso schema del riferimento (`test/probe-act2-pacing.js`): BFS reale entro la stessa mappa, Manhattan approssimato fra la porta di partenza e lo spawn di arrivo su ogni cambio mappa, piazzali a piu' tile risolti sulla tile piu' vicina.
- La catena M4 (Atto 1->2, fino a `present_truman_m4`+P2) e' rigiocata silenziosamente con `NR.prepareNode`/`commitNode`/`prepareChoice`/`commitChoice`/`preparePresentation`/`commitPresentation` (stesso helper di `test/act-3-flow.js::m5Base()`), ma NON compare nel log dei beat: e' gia' misurata da `probe-act2-pacing.js`.
- Contenuto opzionale che richiede evidenza scritta SOLO da contenuto opzionale dell'Atto 2 (E5_POESIA per il confronto biglietto<->verso, audrey_indaga per Audrey a One Eyed Jacks) non e' raggiungibile in questo run e viene elencato separatamente come "non misurato", non stimato.
- Il confronto carte<->testimonianza (M6 B4c) e' misurato solo se le carte del vagone (M5 A8) sono state visitate nello stesso run: qui SI' (contenuto opzionale incluso nel run canonico).
- La scena classica dello specchio (`gigante1_dlg`) e' l'UNICO contenuto classico di questo percorso: il ponte fra `m6State.flags.jacques_dead` e `S().flags.jacques_morto`, e fra `S().flags.gigante1` e `m6State.flags.gigante1`, e' impostato manualmente qui (stesso schema dichiarato di `js/narrative-production.js::syncNarrativeToClassic/syncClassicToNarrative`, MAI attivato per intero: solo queste due variabili sono specchiate).
- I range "teoria x tattica" (6 combinazioni) misurano SOLO il percorso obbligato (nessun contenuto opzionale, nessun log beat-per-beat): il log dettagliato sopra e' quello del run canonico (`degeneration`/impeto, `prova`) soltanto.
- `m6_return_night_early`/`m5_tracks_north_early`/`m6_hospital_guard`-refusal e i tre posizionamenti di Hawk (`hawk_bridge`/`hawk_door`/`hawk_cut`, riga muta via `repeat`) non sono attraversati: sono guardie di sequenza, non contenuto misurabile in pagine.
- Tempo di lettura: stima lineare caratteri/velocita' + costante per pagina; non modella riletture, esitazioni o skip.
