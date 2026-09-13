# Save / reload determinism (2026-09-12)

V8 on every seed: snapshot(state) === snapshot(JSON.parse(NR.serialize(state))). Presence is never persisted (the serialized state has no location keys). Browser reloads on the real build: see the sections appended by the playthrough drivers below.

| seed | identical after round-trip | serialized bytes | location keys in save |
|---|---|---|---|
| ACT1_TOWN | yes | 268 | none |
| ACT2_DAY2 | yes | 286 | none |
| ACT3_BRIDGE | yes | 299 | none |
| ACT3_TRAINCAR_REPORT | yes | 435 | none |
| ACT3_NORTH_CUT | yes | 479 | none |
| ACT3_OEJ | yes | 544 | none |
| ACT3_OEJ_AUDREY_SEEN | yes | 585 | none |
| ACT3_OEJ_NO_AUDREY | yes | 523 | none |
| ACT3_AFTER_ARREST | yes | 582 | none |
| ACT3_GUARDED_HOSPITAL | yes | 607 | none |
| ACT3_NIGHT_STATION | yes | 650 | none |
| ACT4_AFTERNOON | yes | 702 | none |
| ACT4_PROMISE_MADE | yes | 746 | none |
| ACT4_EVENING_GATHERING | yes | 788 | none |
| ACT4_ROADHOUSE_PRE_PHONE | yes | 842 | none |
| ACT4_POST_PHONE_INSIDE_PALMER | yes | 959 | none |
| ACT4_POST_PHONE_INSIDE_CENTRALE | yes | 961 | none |
| ACT4_POST_PHONE_INSIDE_NESSUNO | yes | 960 | none |
| ACT4_ROUTE_PALMER | yes | 1011 | none |
| ACT4_ROUTE_DINER | yes | 1011 | none |
| ACT4_ROUTE_LAKE | yes | 1011 | none |
| ACT4_SHORE_HAWK | yes | 1055 | none |
| ACT4_SHORE_COOPER_AFTER | yes | 1057 | none |
| ACT4_STATION_BEFORE_DAWN | yes | 1073 | none |

## Browser reloads — Atto 3 (Chrome headless, 2026-09-13)

Ricariche reali dell'iframe di produzione durante `act-3-playthrough.js`.
«registro» = `GAME.CastPresence.where()`; «narrativo» = lo stato serializzato
(flags/values/evidence/nodes_done) letto da `A3.stateDigest()`.

| percorso | momento | stato narrativo identico | registro Cast Continuity identico | salvataggio senza chiavi di posizione |
|---|---|---|---|---|
| impeto-kept | ospedale sorvegliato (dopo il fermo) | sì | sì | sì |


## Browser reloads (Chrome headless, 2026-09-13)

Ricariche reali dell'iframe di produzione durante `act-4-playthrough.js`.
«registro» = `GAME.CastPresence.where()`; «narrativo» = lo stato serializzato
(flags/values/evidence/nodes_done) letto da `A4.stateDigest()`.

| percorso | momento | stato narrativo identico | registro Cast Continuity identico | salvataggio senza chiavi di posizione |
|---|---|---|---|---|
| A | Roadhouse pre-telefono | sì | sì | — |
| A | Roadhouse dopo il telefono | sì | sì | sì |
| A | crocevia dopo la scelta di focus | sì | sì | — |

## Browser reloads (Chrome headless, 2026-09-13)

Ricariche reali dell'iframe di produzione durante `act-4-playthrough.js`.
«registro» = `GAME.CastPresence.where()`; «narrativo» = lo stato serializzato
(flags/values/evidence/nodes_done) letto da `A4.stateDigest()`.

| percorso | momento | stato narrativo identico | registro Cast Continuity identico | salvataggio senza chiavi di posizione |
|---|---|---|---|---|
| B | Roadhouse dopo il telefono | sì | sì | sì |


## Browser reloads (Chrome headless, 2026-09-13)

Ricariche reali dell'iframe di produzione durante `act-4-playthrough.js`.
«registro» = `GAME.CastPresence.where()`; «narrativo» = lo stato serializzato
(flags/values/evidence/nodes_done) letto da `A4.stateDigest()`.

| percorso | momento | stato narrativo identico | registro Cast Continuity identico | salvataggio senza chiavi di posizione |
|---|---|---|---|---|
| C | Roadhouse dopo il telefono | sì | sì | sì |


## Browser reloads (Chrome headless, 2026-09-13)

Ricariche reali dell'iframe di produzione durante `act-4-playthrough.js`.
«registro» = `GAME.CastPresence.where()`; «narrativo» = lo stato serializzato
(flags/values/evidence/nodes_done) letto da `A4.stateDigest()`.

| percorso | momento | stato narrativo identico | registro Cast Continuity identico | salvataggio senza chiavi di posizione |
|---|---|---|---|---|
| D | Roadhouse dopo il telefono | sì | sì | sì |

