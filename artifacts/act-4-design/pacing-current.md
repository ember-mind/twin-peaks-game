# Pacing Atto 4 (M8) — stato attuale

Misurato headless con `node test/probe-act4-pacing.js` (metodo di `test/probe-act3-pacing.js`), da Cooper davanti a Truman alla centrale subito dopo `m6_atto4_bridge` (M6 B9, `flags.atto4`) fino a `node_done: m8_station` (completion di M8). Stato narrativo seminato come `test/m8-engine-harness.html::seedBase()` (atto4 + E3_LETTERA_R + E1_DIARIO), senza rigiocare M4/M5/M6.

Velocita': 213.33 ms/tile (4.688 tile/s). Lettura: 12/15 car/s + 0.6s/pagina.

## Riepilogo

| Metrica | Valore |
|---|---|
| Percorso obbligato canonico (accompagno/palmer/palmer) | 562 tile (119.9s), 50 pagine, 3757 car, 12 opzioni su 4 scelte -> **463.0s (~7.72 min) @12cps / 400.4s (~6.67 min) @15cps** |
| Range percorso obbligato, 27 varianti (promessa x avviso x destinazione) | 404.2-473.3s (~6.74-7.89 min) @12cps; 347.7-409.8s @15cps |
| Obbligato + tutto l'opzionale (solo layer classico atto4, sola lettura) | 509.5s (~8.49 min) @12cps; cammino opzionale NON modellato |
| Tempo prima della prima scelta significativa (promise_stance) | 129 tile (27.5s) + 59.7s di lettura = **87.2s** |
| Blocco passivo piu' lungo (pagine senza scelta ne' cambio mappa) | 12 pagine, 743 car (~69.1s): m8_discovery + m8_promise_echo + m8_cmp_letters + m8_cmp_diary |
| Tratto a piedi ininterrotto piu' lungo | 142 tile (30.3s) verso "Roadhouse: il Gigante, al tavolo (B)" via double_r_exterior_prototype > town > roadhouse |
| Pagine per modo (canonico, feedback inclusi) | action 15 (di cui 4 dentro nodi a scelta, prima della scelta) / dialogue 26 / notebook 9 |
| Nodi M8 attraversati / totali | 11 / 16 (i 2 route node non scelti sono alternative esclusive; nessun nodo opzionale in M8) |

## Beat per beat (canonico: promessa accompagno, avviso palmer, destinazione palmer)

| # | Beat | Mappa | Nodo | Cammino dal beat prec. | Sec. cammino | Pagine | Car | Sec. lettura (12cps) | Opzioni |
|---|---|---|---|---:|---:|---:|---:|---:|---:|
| 1 | A | diner | Diner: la promessa a Maddy (A, accompagno) (`m8_diner + promise_accompagno`) | 129 ~ via sheriffs_station_exterior>town>double_r_exterior_prototype>diner | 27.52 | 9 | 747 | 67.65 | 3 |
| 2 | B0 | diner | Diner: Leland e il taxi (B0) (`m8_leland_taxi`) | 1 | 0.21 | 5 | 435 | 39.25 |  |
| 3 | B | roadhouse | Roadhouse: il Gigante, al tavolo (B) (`m8_roadhouse_truman`) | 142 ~ via double_r_exterior_prototype>town>roadhouse | 30.29 | 5 | 333 | 30.75 |  |
| 4 | B | roadhouse | Roadhouse: la telefonata (B, palmer) (`m8_roadhouse_phone + warning_palmer`) | 10 | 2.13 | 4 | 331 | 29.98 | 3 |
| 5 | C | town | Crocevia: dove vai? (C, palmer) (`m8_focus_choice + focus_palmer`) | 74 ~ via town | 15.79 | 3 | 190 | 17.63 | 3 |
| 6 | C | palmer | Casa Palmer: la chiamata della centrale (C) (`m8_route_palmer`) | 73 ~ via palmer | 15.57 | 5 | 337 | 31.08 |  |
| 7 | D | town | Il ritrovamento (D) (`m8_discovery`) | 86 ~ via town | 18.35 | 3 | 265 | 23.88 |  |
| 8 | D | town | L'eco della promessa (D) (`m8_promise_echo`) | 0 | 0.00 | 4 | 205 | 19.48 |  |
| 9 | E | town | Taccuino: confronto lettere R<->O (E) (`m8_cmp_letters`) | 0 | 0.00 | 1 | 54 | 5.10 |  |
| 10 | E | town | Taccuino: confronto lettere <-> diario, P8 (E) (`m8_cmp_diary + diary_a`) | 0 | 0.00 | 5 | 365 | 33.42 | 3 |
| 11 | F | sheriff | Centrale, prima dell'alba (F) (`m8_station`) | 47 ~ via sheriffs_station_exterior>sheriff | 10.03 | 6 | 495 | 44.85 |  |

"~" = include tratti Manhattan (cambio mappa). I beat E sono a canale taccuino: nessun cammino.

## Range per avviso x destinazione (promessa accompagno; le altre promesse spostano il totale di pochi caratteri)

| Avviso | Destinazione | Tile | Pagine | Car | 12cps | 15cps |
|---|---|---:|---:|---:|---:|---:|
| palmer | palmer | 562 | 50 | 3757 | 463.0s (~7.72 min) | 400.4s |
| palmer | lago | 438 | 50 | 3760 | 436.8s (~7.28 min) | 374.1s |
| palmer | diner | 592 | 49 | 3811 | 473.3s (~7.89 min) | 409.8s |
| centrale | palmer | 562 | 48 | 3499 | 440.3s (~7.34 min) | 382.0s |
| centrale | lago | 438 | 48 | 3538 | 417.1s (~6.95 min) | 358.1s |
| centrale | diner | 592 | 47 | 3589 | 453.6s (~7.56 min) | 393.8s |
| nessuno | palmer | 562 | 48 | 3506 | 440.9s (~7.35 min) | 382.4s |
| nessuno | lago | 438 | 48 | 3545 | 417.7s (~6.96 min) | 358.6s |
| nessuno | diner | 592 | 47 | 3596 | 454.2s (~7.57 min) | 394.2s |

Per promessa (12cps): accompagno 417.1-473.3s; autonomia 404.2-460.4s; prudenza 404.5-460.7s.

## Contenuto non obbligatorio (misurato a parte)

- M8 non ha nodi opzionali. Route node alternativi (non scelti nel canonico): `m8_route_lake` 2 pag/167 car, `m8_route_diner` 3 pag/303 car.
- Righe `repeat` (guardie, 1 pagina se si ri-interagisce): `m8_leland_waiting` 58 car, `m8_giant_stage` 81 car, `m8_leland_taxi` 90 car, `m8_lucy` 41 car, `m8_focus_choice` 61 car, `m8_station` 88 car.
- Layer classico gated su `flag:atto4` (js/glue.js, fuori M8, facoltativo): `maddy_a4` ASSENTE, `sarah_visione` 4 pag/306 car, `leland_a4` ASSENTE, `gerard_a4` ASSENTE, `loglady_a4` 4 pag/195 car -> 8 pagine, 501 car, 46.5s di sola lettura; il cammino (Palmer/diner/hotel) non e' modellato.

## Passi non misurabili / approssimati

- `m8_discovery` -> `m8_promise_echo`: `next` dichiarativo, il runtime non restituisce goto al commit; qui preparato come nodo consecutivo senza cammino (stesso schema del harness M8). Il passaggio scenico in produzione (fade, sync adapter) non e' misurato.
- I beat E (`m8_cmp_letters`, `m8_cmp_diary`) sono a canale taccuino: l'apertura del taccuino e la navigazione fra sezioni non hanno costo modellato (solo pagine).
- Cambio mappa = Manhattan fra la porta di uscita e lo spawn di arrivo (coordinate di mappe diverse, metodo del riferimento): 12 tratti nel canonico per 332 tile (70.8s) su 562; e' un artefatto sistematico (es. roadhouse(7,9)->town(47,29) = 60 tile), da leggere come limite superiore. Nessun BFS intra-mappa e' fallito.
- Le pagine con `condition` (es. valigia a Palmer, `p_valigia` alla centrale) sono conteggiate solo nelle varianti in cui il runtime le include.
- Attesa della banda al Roadhouse, transizioni notte/alba e cutscene grafiche: nessuna e' rappresentata come pagina in M8, quindi non misurata.
- Lettura: stima lineare caratteri/velocita' + costante per pagina; non modella riletture, esitazioni o skip.
