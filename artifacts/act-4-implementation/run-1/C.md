# Atto 4 — trascrizione giocata «C» (prudenza → nessun avviso → focus diner; nessuna visita facoltativa)

Registrata sulla build di produzione (`index.html`) in Chrome headless.
Ogni riga è ciò che la UI ha davvero emesso: id di pagina, speaker dal DOM,
testo dal DOM, obiettivo HUD in quel momento. Stato di partenza: fine Atto 3
(seme), Cooper alla centrale davanti a Truman.

## Ripieghi sull'API (nessun tasto possibile)

- `roadhouse/gigante` — NPC "gigante" a 8,1 presente ma nessuna casella adiacente raggiungibile: {"ok":false,"error":"unreachable","target":[8,1],"candidates":[[8,2,"up"]],"diag":{"from":[3,8],"to":[8,2],"reason":"no_path","attempt":4}} · NPC: ["truman@4,8","bobby@3,2","donna@5,2","james@9,2","shelly@11,2","norma@3,6","loglady@11,6","gigante@8,1"]
- `roadhouse/gigante` — NPC "gigante" a 8,1 presente ma nessuna casella adiacente raggiungibile: {"ok":false,"error":"unreachable","target":[8,1],"candidates":[[8,2,"up"]],"diag":{"from":[3,8],"to":[8,2],"reason":"no_path","attempt":4}} · NPC: ["truman@4,8","bobby@3,2","donna@5,2","james@9,2","shelly@11,2","norma@3,6","loglady@11,6","gigante@8,1"]

## Osservazioni del driver

- soglia: posizione d'uscita diversa dall'attesa, si raggiunge il crocevia camminando — `{"map":"town","x":47,"y":30,"dir":"down"}`
- HUD dopo la stazione (M9 diventa corrente) — `{"hud":"Chiedi a Lucy se il taxi di Leland era prenotato.","m8":{"id":"obj_m8_4","text":"Porta a Truman una contraddizione che regga."},"m9":{"id":"obj_m9_1","text":"Chiedi a Lucy se il taxi di Leland era prenotato."}}`

## Entità presenti a ogni ingresso mappa

| mappa | arrivo | NPC |
|---|---|---|
| diner | 6,8,up | norma@5,2 · shelly@9,7 · loglady@4,5 · james@9,6 · maddy@10,1 · leland@11,1 |
| town | 47,29,up | bobby@31,16 · donna@44,10 · jacoby@16,25 |
| roadhouse | 7,8,up | truman@4,8 · bobby@3,2 · donna@5,2 · james@9,2 · shelly@11,2 · norma@3,6 · loglady@11,6 |
| town | 47,30,down | jacoby@16,25 |
| double_r_exterior_prototype | 6,9,up | (nessuno) |
| diner | 6,8,up | norma@5,2 · shelly@9,7 · loglady@4,5 · james@9,6 |
| double_r_exterior_prototype | 6,8,down | (nessuno) |
| town | 42,22,down | jacoby@16,25 · hawk_shore_first@16,27 |
| sheriff | 11,4,left | truman@10,4 · andy@10,7 · hawk@12,8 · lucy@2,6 |

## Sequenza

- _viaggio_ → diner 6,8,up (viaggio: Double R)
- _tasto A_ @diner 11,2 up

> **HUD:** Passa dal diner, questo pomeriggio.

- `m8.a.leland_waiting.p01` [m8_leland_waiting] _(scena)_ — (Leland al bancone, accanto a Maddy. Il conto è già sotto la sua mano; aspetta che lei finisca.)
- _commit_ `m8_leland_waiting`
- _stato_: {"nodes_done":["m8_leland_waiting"]}
- _obiettivo (dopo l'interazione)_: Passa dal diner, questo pomeriggio.
- _tasto A_ @diner 10,2 up
- `m8.a.diner.p01` [m8_diner] _(scena)_ — (Maddy al bancone, un tovagliolo pieno di numeri. Norma le riempie la tazza senza chiedere.)
- `m8.a.diner.p02` [m8_diner] **MADDY** — La 7:40 prende la coincidenza a Spokane. Passa alla fermata del lago — quella delle 11 no, ma parte a orario.
- `m8.a.diner.p03` [m8_diner] **COOPER** — Torna a casa, signorina Ferguson?
- `m8.a.diner.p04` [m8_diner] **MADDY** — Torno al centralino della biblioteca. Mi tengono il posto fino a lunedì — l'ho fatto promettere per iscritto.
- `m8.a.diner.p05` [m8_diner] _(scena)_ — (Un avventore la saluta: "Ciao, Laura". Maddy non si volta subito.)
- `m8.a.diner.p06` [m8_diner] **MADDY** — (senza acidità) Maddy. Con due D. Laura era mia cugina — io sono quella che porta gli occhiali nelle foto.
- `m8.a.diner.p07` [m8_diner] **MADDY** — Sono rimasta un giorno in più per zia Sarah. Uno. Poi Missoula si riprende il suo centralino.
- `m8.a.diner.p08` [m8_diner] _(scena)_ — (Maddy piega il tovagliolo sugli orari e aspetta.)
- _commit_ `m8_diner`
- **scelte** [m8_diner] @diner 10,2,up: promise_accompagno · promise_autonomia · promise_prudenza
- _stato_: {"nodes_done":["m8_diner"]}
- _obiettivo (dopo l'interazione)_: Passa dal diner, questo pomeriggio.
- **scelta presa**: `promise_prudenza`
- `m8.a.diner.feedback.prudenza` [m8_diner] **MADDY** — (ride) Lei parla come il mio centralino. Va bene: chiamerò. Sempre.
- _stato_: {"values":{"promise_stance":"prudenza"}}
- _obiettivo (dopo l'avanzamento)_: Prima di uscire dal diner, parla con Leland.
- _tasto A_ @diner 10,1 right

> **HUD:** Prima di uscire dal diner, parla con Leland.

- `m8.b0.leland_taxi.p00` [m8_leland_taxi] _(scena)_ — (Maddy saluta ed esce. Leland posa il conto sul bancone.)
- `m8.b0.leland_taxi.p01` [m8_leland_taxi] **LELAND** — Maddy prende la prima corriera domattina. Ho chiamato la Twin Peaks Taxi: passa da casa alle sette.
- `m8.b0.leland_taxi.prudenza.p01` [m8_leland_taxi] **COOPER** — Ho chiesto a Maddy una telefonata. Il taxi delle sette aggiunge un orario, non una garanzia.
- `m8.b0.leland_taxi.p02` [m8_leland_taxi] _(scena)_ — Prima del Roadhouse, al diner: Leland dice di aver prenotato il taxi di Maddy.
- _commit_ `m8_leland_taxi`
- _stato_: {"evidence":["T_LELAND_TAXI"],"nodes_done":["m8_leland_taxi"]}
- _obiettivo (dopo l'interazione)_: Il paese si ritrova al Roadhouse, stasera.
- _viaggio_ → town 47,29,up (viaggio: davanti al Roadhouse)
- **porta** town → roadhouse
- _tasto A_ @roadhouse 3,8 right

> **HUD:** Il paese si ritrova al Roadhouse, stasera.

- `m8.b.truman.p01` [m8_roadhouse_truman] _(scena)_ — (La banda suona. Il paese c'è tutto: birre, risate basse, il microfono che fischia una volta.)
- `m8.b.truman.p02` [m8_roadhouse_truman] **TRUMAN** — Se i tuoi enigmi avevano un seguito, questo è il posto che mi hai chiesto di aspettare.
- `m8.b.truman.p03` [m8_roadhouse_truman] _(scena)_ — (La musica non si ferma. Ma per Cooper la sala rallenta — solo per lui.)
- `m8.b.truman.p04` [m8_roadhouse_truman] **GIGANTE** — Sta accadendo di nuovo.
- `m8.b.truman.p05` [m8_roadhouse_truman] _(scena)_ — (La sala riprende il suo tempo. Nessuno ha visto niente.)
- _commit_ `m8_roadhouse_truman`
- _stato_: {"nodes_done":["m8_roadhouse_truman"],"values":{"presagio_status":"active"}}
- _obiettivo (dopo l'interazione)_: Il telefono del Roadhouse.
- ⚠️ **API** `roadhouse/gigante` — NPC "gigante" a 8,1 presente ma nessuna casella adiacente raggiungibile: {"ok":false,"error":"unreachable","target":[8,1],"candidates":[[8,2,"up"]],"diag":{"from":[3,8],"to":[8,2],"reason":"no_path","attempt":4}} · NPC: ["truman@4,8","bobby@3,2","donna@5,2","james@9,2","shelly@11,2","norma@3,6","loglady@11,6","gigante@8,1"]

> **HUD:** Il telefono del Roadhouse.

- `m8.b.giant.p01` [m8_giant_stage] _(scena)_ — (Sul palco, dietro la banda, un uomo alto. Nessuno lo guarda. Non indica niente.)
- _commit_ `m8_giant_stage`
- _stato_: {"nodes_done":["m8_giant_stage"]}
- ⚠️ **API** `roadhouse/gigante` — NPC "gigante" a 8,1 presente ma nessuna casella adiacente raggiungibile: {"ok":false,"error":"unreachable","target":[8,1],"candidates":[[8,2,"up"]],"diag":{"from":[3,8],"to":[8,2],"reason":"no_path","attempt":4}} · NPC: ["truman@4,8","bobby@3,2","donna@5,2","james@9,2","shelly@11,2","norma@3,6","loglady@11,6","gigante@8,1"]
- `m8.b.giant.repeat` [m8_giant_stage] _(scena)_ — (Sul palco, dietro la banda, un uomo alto. Nessuno lo guarda. Non indica niente.)
- _tasto A_ @roadhouse 8,4 down
- `m8.b.phone.p01` [m8_roadhouse_phone] _(scena)_ — Il telefono del Roadhouse.
- `m8.b.phone.p02` [m8_roadhouse_phone] **COOPER** — Harry, non so ancora cosa si ripeta. La linea è libera; quello che dico adesso farà muovere qualcuno.
- _commit_ `m8_roadhouse_phone`
- **scelte** [m8_roadhouse_phone] @roadhouse 8,4,down: warning_palmer · warning_centrale · warning_nessuno
- _stato_: {"nodes_done":["m8_roadhouse_phone"]}
- _obiettivo (dopo l'interazione)_: Il telefono del Roadhouse.
- **scelta presa**: `warning_nessuno`
- `m8.b.roadhouse.feedback.nessuno` [m8_roadhouse_phone] _(scena)_ — (Il telefono resta sulla forcella. La porta del Roadhouse è già alle spalle.)
- _stato_: {"values":{"warning_target":"nessuno","maddy_action_after_warning":"none","sarah_support_state":"none"}}
- _obiettivo (dopo l'avanzamento)_: Torna all’incrocio: casa Palmer, lago o diner.

> **SALVA + RICARICA** — roadhouse 8,5 → roadhouse 8,5
> obiettivo prima: «Torna all’incrocio: casa Palmer, lago o diner.» · dopo: «Torna all’incrocio: casa Palmer, lago o diner.»
> entità prima: (nessuna) · dopo: (nessuna)
> valori dopo: {"promise_stance":"prudenza","presagio_status":"active","warning_target":"nessuno","maddy_action_after_warning":"none","sarah_support_state":"none"}

- **porta** roadhouse → town
- _tasto A_ @town 47,29 down

> **HUD:** Torna all’incrocio: casa Palmer, lago o diner.

- `m8.c.focus.p01` [m8_focus_choice] _(scena)_ — (Lo stesso paese di ogni giorno. Stanotte le strade sono solo distanza.)
- `m8.c.focus.p02` [m8_focus_choice] _(scena)_ — Sul taccuino, tre luoghi restano senza segni di priorità.
- `m8.c.focus.p03` [m8_focus_choice] **COOPER** — Nessun fatto ne preferisce uno. Il primo costo è la distanza.
- _commit_ `m8_focus_choice`
- **scelte** [m8_focus_choice] @town 47,29,down: focus_palmer · focus_lago · focus_diner
- _stato_: {"nodes_done":["m8_focus_choice"]}
- _obiettivo (dopo l'interazione)_: Torna all’incrocio: casa Palmer, lago o diner.
- **scelta presa**: `focus_diner`
- _obiettivo (dopo l'avanzamento)_: Torna all’incrocio: casa Palmer, lago o diner.
- **porta** town → double_r_exterior_prototype
- **porta** double_r_exterior_prototype → diner
- _tasto A_ @diner 5,1 down
- `m8.c.route_diner.p01` [m8_route_diner] **NORMA** — Maddy? Ha chiesto della fermata del lago. Poi è tornata dai Palmer. Non era ancora partita.
- `m8.c.route_diner.p02` [m8_route_diner] _(scena)_ — (Il tempo di uscire: la radio di Hawk gracchia il nome del lago — una chiamata anonima ha segnalato qualcosa sulla riva.)
- `m8.c.route_diner.p03` [m8_route_diner] **COOPER** — Hawk ha il lago. Norma conferma che Maddy è tornata dai Palmer; porto con me questo ordine.
- _commit_ `m8_route_diner`
- _stato_: {"nodes_done":["m8_route_diner"],"values":{"body_found_by":"hawk"}}
- _obiettivo (dopo l'interazione)_: Torna all’incrocio: casa Palmer, lago o diner.
- **porta** diner → double_r_exterior_prototype
- **porta** double_r_exterior_prototype → town
- _tasto A_ @town 16,28 left
- `m8.d.discovery.hawk.p01` [m8_discovery] _(scena)_ — (Quando Cooper arriva, il perimetro è già segnato. Hawk gli va incontro, si toglie il cappello.)
- `m8.d.discovery.hawk.p02` [m8_discovery] **HAWK** — L'ho trovata io. Non l'ho mossa. Non ho toccato le mani. Guarda l'anulare.
- `m8.d.discovery.hawk.p03` [m8_discovery] **COOPER** — Hawk, hai fatto bene. Osservo da dove ti sei fermato; una scena preservata ha due paia d'occhi.
- _commit_ `m8_discovery`
- `m8.d.echo.p01` [m8_promise_echo] _(scena)_ — (Cooper prende il registratore. Non lo accende.)

> **HUD:** Rileggi le lettere e il diario di Laura.

- `m8.d.echo.prudenza` [m8_promise_echo] **COOPER** — Diane. Rise della mia voce da centralino. Disse che avrebbe chiamato.
- `m8.d.echo.p02` [m8_promise_echo] **COOPER** — Sul tovagliolo aveva scritto tre partenze. Ne aveva scelta una.
- `m8.d.echo.p03` [m8_promise_echo] _(scena)_ — (Silenzio.)
- _commit_ `m8_promise_echo`
- _stato_: {"flags":["maddy_trovata"],"evidence":["E9A_LETTERA_O","E9B_STESSO_METODO"],"nodes_done":["m8_discovery","m8_promise_echo"],"values":{"presagio_status":"verified","letter_o_observation_source":"hawk_preserved","letter_o_chain":"standard"}}
- _obiettivo (dopo l'interazione)_: Rileggi le lettere e il diario di Laura.
- _obiettivo (prima del taccuino)_: Rileggi le lettere e il diario di Laura.
- _obiettivo (nel taccuino)_: OBIETTIVO: Rileggi le lettere e il diario di Laura.
- **taccuino** coppia E9A_LETTERA_O + E3_LETTERA_R → available (m8_cmp_letters)

> **HUD:** (nessun obiettivo)

- `m8.e.cmp_letters.p01` [m8_cmp_letters] _(scena)_ — (Confronta: la O incisa sotto l'unghia ↔ la lettera R)
- _commit_ `m8_cmp_letters`
- _obiettivo (prima del taccuino)_: Rileggi le lettere e il diario di Laura.
- _obiettivo (nel taccuino)_: OBIETTIVO: Rileggi le lettere e il diario di Laura.
- **taccuino** coppia E9A_LETTERA_O + E1_DIARIO → available (m8_cmp_diary)
- `m8.e.cmp_diary.p01` [m8_cmp_diary] _(scena)_ — (Confronta: le lettere ↔ il diario di Laura)
- `m8.e.cmp_diary.p02` [m8_cmp_diary] **DIARIO DI LAURA** — «Ha un nome da persona perbene.»
- `m8.e.cmp_diary.p02b` [m8_cmp_diary] **DIARIO DI LAURA** — «Dice che me lo darà un pezzo alla volta, come le cose che non si possono restituire.»
- `m8.e.cmp_diary.p03` [m8_cmp_diary] _(scena)_ — Cooper affianca la promessa del diario alla sequenza R–O.
- _commit_ `m8_cmp_diary`
- **scelte** [m8_cmp_diary] @town 16,28,left: diary_a · diary_b · diary_c
- **scelta presa**: `diary_a`
- `m8.e.cmp_diary.feedback.a` [m8_cmp_diary] _(scena)_ — Le lettere seguono una firma progressiva che il diario aveva annunciato. Resta ignoto se la firma sia dell'assassino, di "lui", o una messinscena.
- _obiettivo (dopo l'avanzamento)_: (nessuno)
- _viaggio_ → sheriff 11,4,left (viaggio: centrale)
- _tasto A_ @sheriff 11,4 left

> **HUD:** Porta il nesso a Truman, alla centrale.

- `m8.f.station.p01` [m8_station] _(scena)_ — (La centrale, prima dell'alba.)
- `m8.f.station.sarah_truman` [m8_station] **TRUMAN** — Sono passato io da Sarah prima di tornare qui. Adesso Andy resta con lei.
- `m8.f.station.p02` [m8_station] **TRUMAN** — Dimmi che cosa abbiamo, oltre a quello che abbiamo perso.
- `m8.f.station.p03` [m8_station] **COOPER** — Una firma che procede, Harry. Il diario dice che qualcuno le prometteva il proprio nome a pezzi.
- `m8.f.station.hook.p01` [m8_station] **COOPER** — E un orario. Ieri al diner Leland ha detto di aver chiamato la Twin Peaks Taxi per le sette, da casa. L'ho scritto io, alla luce del giorno.
- `m8.f.station.hook.p02` [m8_station] **TRUMAN** — Allora abbiamo un'ora. Prima delle sette, Lucy chiama la compagnia: una corsa prenotata, o niente.
- _commit_ `m8_station`
- _stato_: {"nodes_done":["m8_station"]}
- _obiettivo (dopo l'interazione)_: Chiedi a Lucy se il taxi di Leland era prenotato.
