# Act 4 — resolver presence trace (2026-09-12)

Source: `GAME.CastPresence.snapshot(state)` on the seeds of `test/fixtures/cast-pins-acts-1-4.json` (derived from story state, not a real-build capture: the population hook is not yet integrated). Includes the mandatory re-entry states (POST_PHONE_INSIDE ×3: crowd + Truman present, Giant absent) and the post-threshold states.

| character | AFTERNOON | PROMISE_MADE | EVENING_GATHERING | ROADHOUSE_PRE_PHONE | POST_PHONE_INSIDE_PALMER | POST_PHONE_INSIDE_CENTRALE | POST_PHONE_INSIDE_NESSUNO | ROUTE_PALMER | ROUTE_DINER | ROUTE_LAKE | SHORE_HAWK | SHORE_COOPER_AFTER | STATION_BEFORE_DAWN |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| andy | PLACED@sheriff 10,7 down [BASELINE] | PLACED@sheriff 10,7 down [BASELINE] | PLACED@sheriff 10,7 down [BASELINE] | PLACED@sheriff 10,7 down [BASELINE] | PLACED@sheriff 10,7 down [BASELINE] | OFFSCREEN(with_sarah) [ACT4_ANDY_WITH_SARAH_VICE] | PLACED@sheriff 10,7 down [BASELINE] | PLACED@sheriff 10,7 down [BASELINE] | PLACED@sheriff 10,7 down [BASELINE] | OFFSCREEN(with_sarah) [ACT4_ANDY_WITH_SARAH_VICE] | OFFSCREEN(with_sarah) [ACT4_ANDY_WITH_SARAH_LATE] | OFFSCREEN(with_sarah) [ACT4_ANDY_WITH_SARAH_VICE] | OFFSCREEN(with_sarah) [ACT4_ANDY_WITH_SARAH_LATE] |
| audrey | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] |
| benhorne | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] |
| bob | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] |
| bobby | PLACED@town 31,16 down [BASELINE] | PLACED@town 31,16 down [BASELINE] | PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING] | PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING] | PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING] | PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING] | PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] |
| donna | PLACED@town 44,10 down [BASELINE] | PLACED@town 44,10 down [BASELINE] | PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING] | PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING] | PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING] | PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING] | PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] |
| gerard | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] |
| giant | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] | PLACED@roadhouse 8,1 down [ACT4_GIANT_STAGE] | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] |
| hawk | PLACED@sheriff 12,8 down [BASELINE] | PLACED@sheriff 12,8 down [BASELINE] | OFFSCREEN(patrol) [ACT4_HAWK_PATROL] | OFFSCREEN(patrol) [ACT4_HAWK_PATROL] | OFFSCREEN(patrol) [ACT4_HAWK_PATROL] | OFFSCREEN(patrol) [ACT4_HAWK_PATROL] | OFFSCREEN(patrol) [ACT4_HAWK_PATROL] | OFFSCREEN(patrol) [ACT4_HAWK_PATROL] | OFFSCREEN(patrol) [ACT4_HAWK_PATROL] | OFFSCREEN(patrol) [ACT4_HAWK_PATROL] | PLACED@town 16,27 down [ACT4_HAWK_SHORE_FOUND_BY_HAWK] | PLACED@town 16,27 down [ACT4_HAWK_SHORE_COOPER] | PLACED@town 16,27 down [ACT4_HAWK_SHORE_FOUND_BY_HAWK] |
| infermiera | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] |
| jacoby | PLACED@town 16,25 down [BASELINE] | PLACED@town 16,25 down [BASELINE] | OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT] | OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT] | OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT] | OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT] | OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT] | OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT] | OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT] | OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT] | OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT] | OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT] | OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT] |
| jacques | TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD] | TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD] | TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD] | TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD] | TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD] | TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD] | TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD] | TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD] | TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD] | TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD] | TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD] | TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD] | TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD] |
| james | PLACED@diner 9,6 down [BASELINE] | PLACED@diner 9,6 down [BASELINE] | PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING] | PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING] | PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING] | PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING] | PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] |
| laura | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] |
| leland | PLACED@diner 11,1 down [ACT4_LELAND_DINER] | PLACED@diner 11,1 down [ACT4_LELAND_DINER] | OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN] | OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN] | OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN] | OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN] | OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN] | OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN] | OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN] | OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN] | OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN] | OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN] | OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN] |
| loglady | PLACED@diner 4,5 down [BASELINE] | PLACED@diner 4,5 down [BASELINE] | PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING] | PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING] | PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING] | PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING] | PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] |
| lucy | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] |
| maddy | PLACED@diner 10,1 down [ACT4_MADDY_DINER] | PLACED@diner 10,1 down [ACT4_MADDY_DINER] | OFFSCREEN(home) [ACT4_MADDY_HOME] | OFFSCREEN(home) [ACT4_MADDY_HOME] | OFFSCREEN(home) [ACT4_MADDY_HOME] | OFFSCREEN(home) [ACT4_MADDY_HOME] | OFFSCREEN(home) [ACT4_MADDY_HOME] | OFFSCREEN(home) [ACT4_MADDY_HOME] | OFFSCREEN(home) [ACT4_MADDY_HOME] | OFFSCREEN(home) [ACT4_MADDY_HOME] | TERMINAL_REMOVED(maddy_trovata) [ACT4_MADDY_GONE] | TERMINAL_REMOVED(maddy_trovata) [ACT4_MADDY_GONE] | TERMINAL_REMOVED(maddy_trovata) [ACT4_MADDY_GONE] |
| mfap | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] |
| norma | PLACED@diner 5,2 down [BASELINE] | PLACED@diner 5,2 down [BASELINE] | PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING] | PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING] | PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING] | PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING] | PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING] | PLACED@diner 5,2 down [BASELINE] | PLACED@diner 5,2 down [BASELINE] | PLACED@diner 5,2 down [BASELINE] | PLACED@diner 5,2 down [BASELINE] | PLACED@diner 5,2 down [BASELINE] | PLACED@diner 5,2 down [BASELINE] |
| piantone | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] |
| piantone_ronette | PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE] | PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE] | PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE] | PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE] | PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE] | PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE] | PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE] | PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE] | PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE] | PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE] | PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE] | PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE] | PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE] |
| ronette | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] |
| sarah | PLACED@palmer 9,7 down [BASELINE] | PLACED@palmer 9,7 down [BASELINE] | PLACED@palmer 9,7 down [BASELINE] | OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP] | OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP] | OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP] | OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP] | OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP] | OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP] | OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP] | OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP] | OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP] | OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP] |
| shelly | PLACED@diner 9,7 down [BASELINE] | PLACED@diner 9,7 down [BASELINE] | PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING] | PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING] | PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING] | PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING] | PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] | OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT] |
| truman | PLACED@sheriff 10,4 down [BASELINE] | PLACED@sheriff 10,4 down [BASELINE] | PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING] | PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING] | PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING] | PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING] | PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING] | PLACED@sheriff 10,4 down [BASELINE] | PLACED@sheriff 10,4 down [BASELINE] | PLACED@sheriff 10,4 down [BASELINE] | PLACED@sheriff 10,4 down [BASELINE] | PLACED@sheriff 10,4 down [BASELINE] | PLACED@sheriff 10,4 down [BASELINE] |

## Real-build capture (Chrome headless, 2026-09-13)

Scatti presi con `node test/act-4-playthrough.js` sulla build reale
(`index.html`), leggendo `GAME.CastPresence.where()` (js/cast-presence.js)
nei momenti chiave della giocata. Confrontati coi pin di
`test/fixtures/cast-pins-acts-1-4.json` quando la combinazione
avviso/focus/ritrovamento del percorso coincide con quella del pin;
altrimenti solo catturati (nessun pin adatto) e controllati per doppioni.

### A — pomeriggio al diner (prima della promessa)

Pin di riferimento: `ACT4_AFTERNOON` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@town 31,16 down [BASELINE]` |
| donna | `PLACED@town 44,10 down [BASELINE]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@sheriff 12,8 down [BASELINE]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `PLACED@town 16,25 down [BASELINE]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `PLACED@diner 11,1 down [ACT4_LELAND_DINER]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `PLACED@diner 10,1 down [ACT4_MADDY_DINER]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### A — diner dopo la promessa

Pin di riferimento: `ACT4_PROMISE_MADE` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@town 31,16 down [BASELINE]` |
| donna | `PLACED@town 44,10 down [BASELINE]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@sheriff 12,8 down [BASELINE]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `PLACED@town 16,25 down [BASELINE]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `PLACED@diner 11,1 down [ACT4_LELAND_DINER]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `PLACED@diner 10,1 down [ACT4_MADDY_DINER]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### A — ingresso al Roadhouse (raduno serale)

Pin di riferimento: `ACT4_EVENING_GATHERING` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING]` |
| donna | `PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING]` |
| truman | `PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING]` |

### A — Roadhouse dopo la dichiarazione (pre-telefono)

Pin di riferimento: `ACT4_ROADHOUSE_PRE_PHONE` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING]` |
| donna | `PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `PLACED@roadhouse 8,1 down [ACT4_GIANT_STAGE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING]` |
| truman | `PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING]` |

### A — pre-telefono: dopo il reload

Pin di riferimento: `ACT4_ROADHOUSE_PRE_PHONE` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING]` |
| donna | `PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `PLACED@roadhouse 8,1 down [ACT4_GIANT_STAGE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING]` |
| truman | `PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING]` |

### A — Roadhouse dopo il telefono (dentro la sala)

Pin di riferimento: `ACT4_POST_PHONE_INSIDE_PALMER` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING]` |
| donna | `PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING]` |
| truman | `PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING]` |

### A — Roadhouse: rientro dopo il telefono, prima del crocevia

Pin di riferimento: `ACT4_POST_PHONE_INSIDE_PALMER` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING]` |
| donna | `PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING]` |
| truman | `PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING]` |

### A — dopo la scelta di focus, al crocevia

Pin di riferimento: `ACT4_ROUTE_PALMER` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| donna | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### A — riva dopo il ritrovamento

Pin di riferimento: `ACT4_SHORE_HAWK` — combacia

| personaggio | presenza |
|---|---|
| andy | `OFFSCREEN(with_sarah) [ACT4_ANDY_WITH_SARAH_LATE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| donna | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@town 16,27 down [ACT4_HAWK_SHORE_FOUND_BY_HAWK]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `TERMINAL_REMOVED(maddy_trovata) [ACT4_MADDY_GONE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### A — centrale prima dell'alba (fine giocata)

Pin di riferimento: `ACT4_STATION_BEFORE_DAWN` — combacia

| personaggio | presenza |
|---|---|
| andy | `OFFSCREEN(with_sarah) [ACT4_ANDY_WITH_SARAH_LATE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| donna | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@town 16,27 down [ACT4_HAWK_SHORE_FOUND_BY_HAWK]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `TERMINAL_REMOVED(maddy_trovata) [ACT4_MADDY_GONE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

## Real-build capture (Chrome headless, 2026-09-13)

Scatti presi con `node test/act-4-playthrough.js` sulla build reale
(`index.html`), leggendo `GAME.CastPresence.where()` (js/cast-presence.js)
nei momenti chiave della giocata. Confrontati coi pin di
`test/fixtures/cast-pins-acts-1-4.json` quando la combinazione
avviso/focus/ritrovamento del percorso coincide con quella del pin;
altrimenti solo catturati (nessun pin adatto) e controllati per doppioni.

### B — pomeriggio al diner (prima della promessa)

Pin di riferimento: `ACT4_AFTERNOON` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@town 31,16 down [BASELINE]` |
| donna | `PLACED@town 44,10 down [BASELINE]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@sheriff 12,8 down [BASELINE]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `PLACED@town 16,25 down [BASELINE]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `PLACED@diner 11,1 down [ACT4_LELAND_DINER]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `PLACED@diner 10,1 down [ACT4_MADDY_DINER]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### B — diner dopo la promessa

Pin di riferimento: `ACT4_PROMISE_MADE` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@town 31,16 down [BASELINE]` |
| donna | `PLACED@town 44,10 down [BASELINE]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@sheriff 12,8 down [BASELINE]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `PLACED@town 16,25 down [BASELINE]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `PLACED@diner 11,1 down [ACT4_LELAND_DINER]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `PLACED@diner 10,1 down [ACT4_MADDY_DINER]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### B — ingresso al Roadhouse (raduno serale)

Pin di riferimento: `ACT4_EVENING_GATHERING` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING]` |
| donna | `PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING]` |
| truman | `PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING]` |

### B — Roadhouse dopo la dichiarazione (pre-telefono)

Pin di riferimento: `ACT4_ROADHOUSE_PRE_PHONE` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING]` |
| donna | `PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `PLACED@roadhouse 8,1 down [ACT4_GIANT_STAGE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING]` |
| truman | `PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING]` |

### B — Roadhouse dopo il telefono (dentro la sala)

Pin di riferimento: `ACT4_POST_PHONE_INSIDE_CENTRALE` — combacia

| personaggio | presenza |
|---|---|
| andy | `OFFSCREEN(with_sarah) [ACT4_ANDY_WITH_SARAH_VICE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING]` |
| donna | `PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING]` |
| truman | `PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING]` |

### B — Roadhouse: rientro dopo il telefono, prima del crocevia

Pin di riferimento: `ACT4_POST_PHONE_INSIDE_CENTRALE` — combacia

| personaggio | presenza |
|---|---|
| andy | `OFFSCREEN(with_sarah) [ACT4_ANDY_WITH_SARAH_VICE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING]` |
| donna | `PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING]` |
| truman | `PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING]` |

### B — dopo la scelta di focus, al crocevia

Pin di riferimento: `ACT4_ROUTE_LAKE` — combacia

| personaggio | presenza |
|---|---|
| andy | `OFFSCREEN(with_sarah) [ACT4_ANDY_WITH_SARAH_VICE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| donna | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### B — riva dopo il ritrovamento

Pin di riferimento: `ACT4_SHORE_COOPER_AFTER` — combacia

| personaggio | presenza |
|---|---|
| andy | `OFFSCREEN(with_sarah) [ACT4_ANDY_WITH_SARAH_VICE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| donna | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@town 16,27 down [ACT4_HAWK_SHORE_COOPER]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `TERMINAL_REMOVED(maddy_trovata) [ACT4_MADDY_GONE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### B — centrale prima dell'alba (fine giocata)

_nessun pin adatto a questa combinazione: solo cattura + controllo doppioni_

| personaggio | presenza |
|---|---|
| andy | `OFFSCREEN(with_sarah) [ACT4_ANDY_WITH_SARAH_VICE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| donna | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@town 16,27 down [ACT4_HAWK_SHORE_COOPER]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `TERMINAL_REMOVED(maddy_trovata) [ACT4_MADDY_GONE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |


## Real-build capture (Chrome headless, 2026-09-13)

Scatti presi con `node test/act-4-playthrough.js` sulla build reale
(`index.html`), leggendo `GAME.CastPresence.where()` (js/cast-presence.js)
nei momenti chiave della giocata. Confrontati coi pin di
`test/fixtures/cast-pins-acts-1-4.json` quando la combinazione
avviso/focus/ritrovamento del percorso coincide con quella del pin;
altrimenti solo catturati (nessun pin adatto) e controllati per doppioni.

### C — pomeriggio al diner (prima della promessa)

Pin di riferimento: `ACT4_AFTERNOON` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@town 31,16 down [BASELINE]` |
| donna | `PLACED@town 44,10 down [BASELINE]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@sheriff 12,8 down [BASELINE]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `PLACED@town 16,25 down [BASELINE]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `PLACED@diner 11,1 down [ACT4_LELAND_DINER]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `PLACED@diner 10,1 down [ACT4_MADDY_DINER]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### C — diner dopo la promessa

Pin di riferimento: `ACT4_PROMISE_MADE` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@town 31,16 down [BASELINE]` |
| donna | `PLACED@town 44,10 down [BASELINE]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@sheriff 12,8 down [BASELINE]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `PLACED@town 16,25 down [BASELINE]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `PLACED@diner 11,1 down [ACT4_LELAND_DINER]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `PLACED@diner 10,1 down [ACT4_MADDY_DINER]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### C — ingresso al Roadhouse (raduno serale)

Pin di riferimento: `ACT4_EVENING_GATHERING` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING]` |
| donna | `PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING]` |
| truman | `PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING]` |

### C — Roadhouse dopo la dichiarazione (pre-telefono)

Pin di riferimento: `ACT4_ROADHOUSE_PRE_PHONE` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING]` |
| donna | `PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `PLACED@roadhouse 8,1 down [ACT4_GIANT_STAGE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING]` |
| truman | `PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING]` |

### C — Roadhouse dopo il telefono (dentro la sala)

Pin di riferimento: `ACT4_POST_PHONE_INSIDE_NESSUNO` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING]` |
| donna | `PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING]` |
| truman | `PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING]` |

### C — Roadhouse: rientro dopo il telefono, prima del crocevia

Pin di riferimento: `ACT4_POST_PHONE_INSIDE_NESSUNO` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING]` |
| donna | `PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING]` |
| truman | `PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING]` |

### C — dopo la scelta di focus, al crocevia

Pin di riferimento: `ACT4_ROUTE_DINER` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| donna | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### C — riva dopo il ritrovamento

_nessun pin adatto a questa combinazione: solo cattura + controllo doppioni_

| personaggio | presenza |
|---|---|
| andy | `OFFSCREEN(with_sarah) [ACT4_ANDY_WITH_SARAH_LATE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| donna | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@town 16,27 down [ACT4_HAWK_SHORE_FOUND_BY_HAWK]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `TERMINAL_REMOVED(maddy_trovata) [ACT4_MADDY_GONE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### C — centrale prima dell'alba (fine giocata)

_nessun pin adatto a questa combinazione: solo cattura + controllo doppioni_

| personaggio | presenza |
|---|---|
| andy | `OFFSCREEN(with_sarah) [ACT4_ANDY_WITH_SARAH_LATE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| donna | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@town 16,27 down [ACT4_HAWK_SHORE_FOUND_BY_HAWK]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `TERMINAL_REMOVED(maddy_trovata) [ACT4_MADDY_GONE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |


## Real-build capture (Chrome headless, 2026-09-13)

Scatti presi con `node test/act-4-playthrough.js` sulla build reale
(`index.html`), leggendo `GAME.CastPresence.where()` (js/cast-presence.js)
nei momenti chiave della giocata. Confrontati coi pin di
`test/fixtures/cast-pins-acts-1-4.json` quando la combinazione
avviso/focus/ritrovamento del percorso coincide con quella del pin;
altrimenti solo catturati (nessun pin adatto) e controllati per doppioni.

### D — pomeriggio al diner (prima della promessa)

Pin di riferimento: `ACT4_AFTERNOON` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@town 31,16 down [BASELINE]` |
| donna | `PLACED@town 44,10 down [BASELINE]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@sheriff 12,8 down [BASELINE]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `PLACED@town 16,25 down [BASELINE]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `PLACED@diner 11,1 down [ACT4_LELAND_DINER]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `PLACED@diner 10,1 down [ACT4_MADDY_DINER]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### D — diner dopo la promessa

Pin di riferimento: `ACT4_PROMISE_MADE` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@town 31,16 down [BASELINE]` |
| donna | `PLACED@town 44,10 down [BASELINE]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@sheriff 12,8 down [BASELINE]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `PLACED@town 16,25 down [BASELINE]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `PLACED@diner 11,1 down [ACT4_LELAND_DINER]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `PLACED@diner 10,1 down [ACT4_MADDY_DINER]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### D — ingresso al Roadhouse (raduno serale)

Pin di riferimento: `ACT4_EVENING_GATHERING` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING]` |
| donna | `PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING]` |
| truman | `PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING]` |

### D — Roadhouse dopo la dichiarazione (pre-telefono)

Pin di riferimento: `ACT4_ROADHOUSE_PRE_PHONE` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING]` |
| donna | `PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `PLACED@roadhouse 8,1 down [ACT4_GIANT_STAGE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING]` |
| truman | `PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING]` |

### D — Roadhouse dopo il telefono (dentro la sala)

Pin di riferimento: `ACT4_POST_PHONE_INSIDE_PALMER` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING]` |
| donna | `PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING]` |
| truman | `PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING]` |

### D — Roadhouse: rientro dopo il telefono, prima del crocevia

Pin di riferimento: `ACT4_POST_PHONE_INSIDE_PALMER` — combacia

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@roadhouse 3,4 down [ACT4_EVENING_GATHERING]` |
| donna | `PLACED@roadhouse 5,4 down [ACT4_EVENING_GATHERING]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `PLACED@roadhouse 2,4 down [ACT4_EVENING_GATHERING]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `PLACED@roadhouse 2,6 up [ACT4_EVENING_GATHERING]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@roadhouse 5,6 up [ACT4_EVENING_GATHERING]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `PLACED@roadhouse 3,6 down [ACT4_EVENING_GATHERING]` |
| truman | `PLACED@roadhouse 4,8 up [ACT4_EVENING_GATHERING]` |

### D — dopo la scelta di focus, al crocevia

_nessun pin adatto a questa combinazione: solo cattura + controllo doppioni_

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| donna | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `OFFSCREEN(patrol) [ACT4_HAWK_PATROL]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(home) [ACT4_MADDY_HOME]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### D — riva dopo il ritrovamento

_nessun pin adatto a questa combinazione: solo cattura + controllo doppioni_

| personaggio | presenza |
|---|---|
| andy | `OFFSCREEN(with_sarah) [ACT4_ANDY_WITH_SARAH_LATE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| donna | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@town 16,27 down [ACT4_HAWK_SHORE_COOPER]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `TERMINAL_REMOVED(maddy_trovata) [ACT4_MADDY_GONE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### D — centrale prima dell'alba (fine giocata)

_nessun pin adatto a questa combinazione: solo cattura + controllo doppioni_

| personaggio | presenza |
|---|---|
| andy | `OFFSCREEN(with_sarah) [ACT4_ANDY_WITH_SARAH_LATE]` |
| audrey | `PLACED@hotel_gn 12,9 down [BASELINE]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| donna | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@town 16,27 down [ACT4_HAWK_SHORE_COOPER]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `OFFSCREEN(home) [ACT4_JACOBY_HOME_NIGHT]` |
| jacques | `TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD]` |
| james | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(hidden) [ACT4_LELAND_HIDDEN]` |
| loglady | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `TERMINAL_REMOVED(maddy_trovata) [ACT4_MADDY_GONE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `OFFSCREEN(asleep) [ACT4_SARAH_ASLEEP]` |
| shelly | `OFFSCREEN(home) [ACT4_TOWN_HOME_NIGHT]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

