# Acts 1–3 — resolver presence trace (2026-09-12)

Source: `GAME.CastPresence.snapshot(state)` on the seeds of `test/fixtures/cast-pins-acts-1-4.json` (derived from story state, not a real-build capture: the population hook is not yet integrated, see the implementation report). Each cell is the single authored answer.

| character | ACT1_TOWN | ACT2_DAY2 | ACT3_BRIDGE | ACT3_TRAINCAR_REPORT | ACT3_NORTH_CUT | ACT3_OEJ | ACT3_OEJ_AUDREY_SEEN | ACT3_OEJ_NO_AUDREY | ACT3_AFTER_ARREST | ACT3_GUARDED_HOSPITAL | ACT3_NIGHT_STATION |
|---|---|---|---|---|---|---|---|---|---|---|---|
| andy | PLACED@sheriff 10,7 down [BASELINE] | PLACED@sheriff 10,7 down [BASELINE] | PLACED@sheriff 10,7 down [BASELINE] | PLACED@sheriff 10,7 down [BASELINE] | PLACED@sheriff 10,7 down [BASELINE] | PLACED@sheriff 10,7 down [BASELINE] | PLACED@sheriff 10,7 down [BASELINE] | PLACED@sheriff 10,7 down [BASELINE] | PLACED@sheriff 10,7 down [BASELINE] | PLACED@sheriff 10,7 down [BASELINE] | PLACED@sheriff 10,7 down [BASELINE] |
| audrey | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@oej 13,7 down [ACT3_AUDREY_AT_OEJ] | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] | PLACED@hotel_gn 12,9 down [BASELINE] |
| benhorne | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] | PLACED@hotel_gn 5,7 down [BASELINE] |
| bob | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] | OFFSCREEN(force) [BASELINE] |
| bobby | PLACED@town 31,16 down [BASELINE] | PLACED@town 31,16 down [BASELINE] | PLACED@town 31,16 down [BASELINE] | PLACED@town 31,16 down [BASELINE] | PLACED@town 31,16 down [BASELINE] | PLACED@town 31,16 down [BASELINE] | PLACED@town 31,16 down [BASELINE] | PLACED@town 31,16 down [BASELINE] | PLACED@town 31,16 down [BASELINE] | PLACED@town 31,16 down [BASELINE] | PLACED@town 31,16 down [BASELINE] |
| donna | PLACED@town 44,10 down [BASELINE] | PLACED@town 44,10 down [BASELINE] | PLACED@town 44,10 down [BASELINE] | PLACED@town 44,10 down [BASELINE] | PLACED@town 44,10 down [BASELINE] | PLACED@town 44,10 down [BASELINE] | PLACED@town 44,10 down [BASELINE] | PLACED@town 44,10 down [BASELINE] | PLACED@town 44,10 down [BASELINE] | PLACED@town 44,10 down [BASELINE] | PLACED@town 44,10 down [BASELINE] |
| gerard | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] | PLACED@hospital 11,4 left [BASELINE] |
| giant | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] | OFFSCREEN(offscreen) [BASELINE] |
| hawk | PLACED@sheriff 12,8 down [BASELINE] | PLACED@sheriff 12,8 down [BASELINE] | PLACED@traincar 5,6 left [ACT3_HAWK_BRIDGE] | PLACED@traincar 14,8 down [ACT3_HAWK_DOOR] | PLACED@traincar 22,3 up [ACT3_HAWK_CUT] | PLACED@oej 6,8 up [ACT3_HAWK_OEJ_DOCK] | PLACED@oej 6,8 up [ACT3_HAWK_OEJ_DOCK] | PLACED@oej 6,8 up [ACT3_HAWK_OEJ_DOCK] | OFFSCREEN(escort) [ACT3_HAWK_ESCORT] | PLACED@sheriff 12,8 down [BASELINE] | PLACED@sheriff 12,8 down [BASELINE] |
| infermiera | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] | PLACED@hospital 11,8 down [BASELINE] |
| jacoby | PLACED@town 16,25 down [BASELINE] | PLACED@town 16,25 down [BASELINE] | PLACED@town 16,25 down [BASELINE] | PLACED@town 16,25 down [BASELINE] | PLACED@town 16,25 down [BASELINE] | PLACED@town 16,25 down [BASELINE] | PLACED@town 16,25 down [BASELINE] | PLACED@town 16,25 down [BASELINE] | PLACED@town 16,25 down [BASELINE] | PLACED@town 16,25 down [BASELINE] | PLACED@town 16,25 down [BASELINE] |
| jacques | PLACED@oej 7,5 down [ACT3_JACQUES_AT_OEJ] | PLACED@oej 7,5 down [ACT3_JACQUES_AT_OEJ] | PLACED@oej 7,5 down [ACT3_JACQUES_AT_OEJ] | PLACED@oej 7,5 down [ACT3_JACQUES_AT_OEJ] | PLACED@oej 7,5 down [ACT3_JACQUES_AT_OEJ] | PLACED@oej 7,5 down [ACT3_JACQUES_AT_OEJ] | PLACED@oej 7,5 down [ACT3_JACQUES_AT_OEJ] | PLACED@oej 7,5 down [ACT3_JACQUES_AT_OEJ] | OFFSCREEN(guarded) [ACT3_JACQUES_GUARDED] | OFFSCREEN(guarded) [ACT3_JACQUES_GUARDED] | TERMINAL_REMOVED(jacques_dead) [JACQUES_DEAD] |
| james | OFFSCREEN(not_met) [JAMES_NOT_YET] | PLACED@diner 9,6 down [BASELINE] | PLACED@diner 9,6 down [BASELINE] | PLACED@diner 9,6 down [BASELINE] | PLACED@diner 9,6 down [BASELINE] | PLACED@diner 9,6 down [BASELINE] | PLACED@diner 9,6 down [BASELINE] | PLACED@diner 9,6 down [BASELINE] | PLACED@diner 9,6 down [BASELINE] | PLACED@diner 9,6 down [BASELINE] | PLACED@diner 9,6 down [BASELINE] |
| laura | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] | PLACED@redroom 11,2 down [BASELINE] |
| leland | OFFSCREEN(mourning) [BASELINE] | OFFSCREEN(mourning) [BASELINE] | OFFSCREEN(mourning) [BASELINE] | OFFSCREEN(mourning) [BASELINE] | OFFSCREEN(mourning) [BASELINE] | OFFSCREEN(mourning) [BASELINE] | OFFSCREEN(mourning) [BASELINE] | OFFSCREEN(mourning) [BASELINE] | OFFSCREEN(mourning) [BASELINE] | OFFSCREEN(mourning) [BASELINE] | OFFSCREEN(mourning) [BASELINE] |
| loglady | PLACED@diner 4,5 down [BASELINE] | PLACED@diner 4,5 down [BASELINE] | PLACED@diner 4,5 down [BASELINE] | PLACED@diner 4,5 down [BASELINE] | PLACED@diner 4,5 down [BASELINE] | PLACED@diner 4,5 down [BASELINE] | PLACED@diner 4,5 down [BASELINE] | PLACED@diner 4,5 down [BASELINE] | PLACED@diner 4,5 down [BASELINE] | PLACED@diner 4,5 down [BASELINE] | PLACED@diner 4,5 down [BASELINE] |
| lucy | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] | PLACED@sheriff 2,6 down [BASELINE] |
| maddy | OFFSCREEN(not_in_town) [BASELINE] | OFFSCREEN(not_in_town) [BASELINE] | OFFSCREEN(not_in_town) [BASELINE] | OFFSCREEN(not_in_town) [BASELINE] | OFFSCREEN(not_in_town) [BASELINE] | OFFSCREEN(not_in_town) [BASELINE] | OFFSCREEN(not_in_town) [BASELINE] | OFFSCREEN(not_in_town) [BASELINE] | OFFSCREEN(not_in_town) [BASELINE] | OFFSCREEN(not_in_town) [BASELINE] | OFFSCREEN(not_in_town) [BASELINE] |
| mfap | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] | PLACED@redroom 8,4 down [BASELINE] |
| norma | PLACED@diner 5,2 down [BASELINE] | PLACED@diner 5,2 down [BASELINE] | PLACED@diner 5,2 down [BASELINE] | PLACED@diner 5,2 down [BASELINE] | PLACED@diner 5,2 down [BASELINE] | PLACED@diner 5,2 down [BASELINE] | PLACED@diner 5,2 down [BASELINE] | PLACED@diner 5,2 down [BASELINE] | PLACED@diner 5,2 down [BASELINE] | PLACED@diner 5,2 down [BASELINE] | PLACED@diner 5,2 down [BASELINE] |
| piantone | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | PLACED@hospital 7,3 up [ACT3_GUARD_JACQUES] | PLACED@hospital 7,3 up [ACT3_GUARD_JACQUES] | OFFSCREEN(scenography) [BASELINE] |
| piantone_ronette | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | OFFSCREEN(scenography) [BASELINE] | PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE] |
| ronette | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] | PLACED@hospital 3,5 up [BASELINE] |
| sarah | PLACED@palmer 9,7 down [BASELINE] | PLACED@palmer 9,7 down [BASELINE] | PLACED@palmer 9,7 down [BASELINE] | PLACED@palmer 9,7 down [BASELINE] | PLACED@palmer 9,7 down [BASELINE] | PLACED@palmer 9,7 down [BASELINE] | PLACED@palmer 9,7 down [BASELINE] | PLACED@palmer 9,7 down [BASELINE] | PLACED@palmer 9,7 down [BASELINE] | PLACED@palmer 9,7 down [BASELINE] | PLACED@palmer 9,7 down [BASELINE] |
| shelly | PLACED@diner 9,7 down [BASELINE] | PLACED@diner 9,7 down [BASELINE] | PLACED@diner 9,7 down [BASELINE] | PLACED@diner 9,7 down [BASELINE] | PLACED@diner 9,7 down [BASELINE] | PLACED@diner 9,7 down [BASELINE] | PLACED@diner 9,7 down [BASELINE] | PLACED@diner 9,7 down [BASELINE] | PLACED@diner 9,7 down [BASELINE] | PLACED@diner 9,7 down [BASELINE] | PLACED@diner 9,7 down [BASELINE] |
| truman | PLACED@sheriff 10,4 down [BASELINE] | PLACED@sheriff 10,4 down [BASELINE] | PLACED@sheriff 10,4 down [BASELINE] | PLACED@traincar 9,8 right [ACT3_TRUMAN_REPORT] | PLACED@traincar 9,8 right [ACT3_TRUMAN_REPORT] | PLACED@traincar 9,8 right [ACT3_TRUMAN_REPORT] | OFFSCREEN(boat) [ACT3_TRUMAN_BOAT] | PLACED@traincar 9,8 right [ACT3_TRUMAN_REPORT] | PLACED@sheriff 10,4 down [BASELINE] | PLACED@sheriff 10,4 down [BASELINE] | PLACED@sheriff 10,4 down [BASELINE] |

## Real-build capture (Chrome headless, 2026-09-13)

Scatti presi con `node test/act-3-playthrough.js` sulla build reale
(`index.html`), leggendo `GAME.CastPresence.where()` (js/cast-presence.js)
nei momenti chiave della giocata. Confrontati coi pin di
`test/fixtures/cast-pins-acts-1-4.json` quando la fase (teoria/S1/fermo/
ospedale) coincide con quella della semina sintetica; altrimenti solo
catturati (nessun pin adatto) e controllati per doppioni.

### impeto-kept — vagone: prima del rapporto a Truman

_nessun pin adatto a questa combinazione: solo cattura + controllo doppioni_

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@oej 13,7 down [ACT3_AUDREY_AT_OEJ]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@town 31,16 down [BASELINE]` |
| donna | `PLACED@town 44,10 down [BASELINE]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@traincar 14,8 down [ACT3_HAWK_DOOR]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `PLACED@town 16,25 down [BASELINE]` |
| jacques | `PLACED@oej 7,5 down [ACT3_JACQUES_AT_OEJ]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(mourning) [BASELINE]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(not_in_town) [BASELINE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `OFFSCREEN(scenography) [BASELINE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@traincar 9,8 right [ACT3_TRUMAN_REPORT]` |

### impeto-kept — One Eyed Jacks (prima del fermo)

Pin di riferimento: `ACT3_OEJ_AUDREY_SEEN` — combacia

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
| hawk | `PLACED@oej 6,8 up [ACT3_HAWK_OEJ_DOCK]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `PLACED@town 16,25 down [BASELINE]` |
| jacques | `PLACED@oej 7,5 down [ACT3_JACQUES_AT_OEJ]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(mourning) [BASELINE]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(not_in_town) [BASELINE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `OFFSCREEN(scenography) [BASELINE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `OFFSCREEN(boat) [ACT3_TRUMAN_BOAT]` |

### impeto-kept — One Eyed Jacks: dopo il fermo

Pin di riferimento: `ACT3_AFTER_ARREST` — combacia

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
| hawk | `OFFSCREEN(escort) [ACT3_HAWK_ESCORT]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `PLACED@town 16,25 down [BASELINE]` |
| jacques | `OFFSCREEN(guarded) [ACT3_JACQUES_GUARDED]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(mourning) [BASELINE]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(not_in_town) [BASELINE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `PLACED@hospital 7,3 up [ACT3_GUARD_JACQUES]` |
| piantone_ronette | `OFFSCREEN(scenography) [BASELINE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### impeto-kept — ospedale sorvegliato (dopo il registro di turno)

Pin di riferimento: `ACT3_GUARDED_HOSPITAL` — combacia

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
| jacques | `OFFSCREEN(guarded) [ACT3_JACQUES_GUARDED]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(mourning) [BASELINE]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(not_in_town) [BASELINE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `PLACED@hospital 7,3 up [ACT3_GUARD_JACQUES]` |
| piantone_ronette | `OFFSCREEN(scenography) [BASELINE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### impeto-kept — centrale, notte (dopo la chiamata di Lucy)

Pin di riferimento: `ACT3_NIGHT_STATION` — combacia

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
| leland | `OFFSCREEN(mourning) [BASELINE]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(not_in_town) [BASELINE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### withhold-open — vagone: prima del rapporto a Truman

_nessun pin adatto a questa combinazione: solo cattura + controllo doppioni_

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@oej 13,7 down [ACT3_AUDREY_AT_OEJ]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@town 31,16 down [BASELINE]` |
| donna | `PLACED@town 44,10 down [BASELINE]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@traincar 14,8 down [ACT3_HAWK_DOOR]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `PLACED@town 16,25 down [BASELINE]` |
| jacques | `PLACED@oej 7,5 down [ACT3_JACQUES_AT_OEJ]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(mourning) [BASELINE]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(not_in_town) [BASELINE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `OFFSCREEN(scenography) [BASELINE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@traincar 9,8 right [ACT3_TRUMAN_REPORT]` |

### withhold-open — One Eyed Jacks (prima del fermo)

_nessun pin adatto a questa combinazione: solo cattura + controllo doppioni_

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@oej 13,7 down [ACT3_AUDREY_AT_OEJ]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@town 31,16 down [BASELINE]` |
| donna | `PLACED@town 44,10 down [BASELINE]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@oej 6,8 up [ACT3_HAWK_OEJ_DOCK]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `PLACED@town 16,25 down [BASELINE]` |
| jacques | `PLACED@oej 7,5 down [ACT3_JACQUES_AT_OEJ]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(mourning) [BASELINE]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(not_in_town) [BASELINE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `OFFSCREEN(scenography) [BASELINE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@traincar 9,8 right [ACT3_TRUMAN_REPORT]` |

### withhold-open — One Eyed Jacks: dopo il fermo

Pin di riferimento: `ACT3_AFTER_ARREST` — combacia

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
| hawk | `OFFSCREEN(escort) [ACT3_HAWK_ESCORT]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `PLACED@town 16,25 down [BASELINE]` |
| jacques | `OFFSCREEN(guarded) [ACT3_JACQUES_GUARDED]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(mourning) [BASELINE]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(not_in_town) [BASELINE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `PLACED@hospital 7,3 up [ACT3_GUARD_JACQUES]` |
| piantone_ronette | `OFFSCREEN(scenography) [BASELINE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### withhold-open — ospedale sorvegliato (dopo il registro di turno)

Pin di riferimento: `ACT3_GUARDED_HOSPITAL` — combacia

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
| jacques | `OFFSCREEN(guarded) [ACT3_JACQUES_GUARDED]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(mourning) [BASELINE]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(not_in_town) [BASELINE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `PLACED@hospital 7,3 up [ACT3_GUARD_JACQUES]` |
| piantone_ronette | `OFFSCREEN(scenography) [BASELINE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### withhold-open — centrale, notte (dopo la chiamata di Lucy)

Pin di riferimento: `ACT3_NIGHT_STATION` — combacia

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
| leland | `OFFSCREEN(mourning) [BASELINE]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(not_in_town) [BASELINE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### withhold-staging — vagone: prima del rapporto a Truman

_nessun pin adatto a questa combinazione: solo cattura + controllo doppioni_

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@oej 13,7 down [ACT3_AUDREY_AT_OEJ]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@town 31,16 down [BASELINE]` |
| donna | `PLACED@town 44,10 down [BASELINE]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@traincar 14,8 down [ACT3_HAWK_DOOR]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `PLACED@town 16,25 down [BASELINE]` |
| jacques | `PLACED@oej 7,5 down [ACT3_JACQUES_AT_OEJ]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(mourning) [BASELINE]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(not_in_town) [BASELINE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `OFFSCREEN(scenography) [BASELINE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@traincar 9,8 right [ACT3_TRUMAN_REPORT]` |

### withhold-staging — One Eyed Jacks (prima del fermo)

_nessun pin adatto a questa combinazione: solo cattura + controllo doppioni_

| personaggio | presenza |
|---|---|
| andy | `PLACED@sheriff 10,7 down [BASELINE]` |
| audrey | `PLACED@oej 13,7 down [ACT3_AUDREY_AT_OEJ]` |
| benhorne | `PLACED@hotel_gn 5,7 down [BASELINE]` |
| bob | `OFFSCREEN(force) [BASELINE]` |
| bobby | `PLACED@town 31,16 down [BASELINE]` |
| donna | `PLACED@town 44,10 down [BASELINE]` |
| gerard | `PLACED@hospital 11,4 left [BASELINE]` |
| giant | `OFFSCREEN(offscreen) [BASELINE]` |
| hawk | `PLACED@oej 6,8 up [ACT3_HAWK_OEJ_DOCK]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `PLACED@town 16,25 down [BASELINE]` |
| jacques | `PLACED@oej 7,5 down [ACT3_JACQUES_AT_OEJ]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(mourning) [BASELINE]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(not_in_town) [BASELINE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `OFFSCREEN(scenography) [BASELINE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@traincar 9,8 right [ACT3_TRUMAN_REPORT]` |

### withhold-staging — One Eyed Jacks: dopo il fermo

Pin di riferimento: `ACT3_AFTER_ARREST` — combacia

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
| hawk | `OFFSCREEN(escort) [ACT3_HAWK_ESCORT]` |
| infermiera | `PLACED@hospital 11,8 down [BASELINE]` |
| jacoby | `PLACED@town 16,25 down [BASELINE]` |
| jacques | `OFFSCREEN(guarded) [ACT3_JACQUES_GUARDED]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(mourning) [BASELINE]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(not_in_town) [BASELINE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `PLACED@hospital 7,3 up [ACT3_GUARD_JACQUES]` |
| piantone_ronette | `OFFSCREEN(scenography) [BASELINE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### withhold-staging — ospedale sorvegliato (dopo il registro di turno)

Pin di riferimento: `ACT3_GUARDED_HOSPITAL` — combacia

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
| jacques | `OFFSCREEN(guarded) [ACT3_JACQUES_GUARDED]` |
| james | `PLACED@diner 9,6 down [BASELINE]` |
| laura | `PLACED@redroom 11,2 down [BASELINE]` |
| leland | `OFFSCREEN(mourning) [BASELINE]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(not_in_town) [BASELINE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `PLACED@hospital 7,3 up [ACT3_GUARD_JACQUES]` |
| piantone_ronette | `OFFSCREEN(scenography) [BASELINE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

### withhold-staging — centrale, notte (dopo la chiamata di Lucy)

Pin di riferimento: `ACT3_NIGHT_STATION` — combacia

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
| leland | `OFFSCREEN(mourning) [BASELINE]` |
| loglady | `PLACED@diner 4,5 down [BASELINE]` |
| lucy | `PLACED@sheriff 2,6 down [BASELINE]` |
| maddy | `OFFSCREEN(not_in_town) [BASELINE]` |
| mfap | `PLACED@redroom 8,4 down [BASELINE]` |
| norma | `PLACED@diner 5,2 down [BASELINE]` |
| piantone | `OFFSCREEN(scenography) [BASELINE]` |
| piantone_ronette | `PLACED@hospital 3,6 up [ACT3_GUARD_RONETTE]` |
| ronette | `PLACED@hospital 3,5 up [BASELINE]` |
| sarah | `PLACED@palmer 9,7 down [BASELINE]` |
| shelly | `PLACED@diner 9,7 down [BASELINE]` |
| truman | `PLACED@sheriff 10,4 down [BASELINE]` |

