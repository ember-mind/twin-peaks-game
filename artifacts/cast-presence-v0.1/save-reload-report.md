# Save / reload determinism (2026-09-12)

V8 on every seed: snapshot(state) === snapshot(JSON.parse(NR.serialize(state))). Presence is never persisted (the serialized state has no location keys). Browser reloads on the real build are pending on the population hook (see report §13).

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
