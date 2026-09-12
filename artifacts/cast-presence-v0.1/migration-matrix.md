# Migration matrix (2026-09-12)

Truth (`artifacts/world-character-audit/cast-windows-acts-1-4.md`) → data (`narrative/cast/windows.json`) → old body owner to delete (Phase 10, pending on the adapter collision).

## Characters (baselines)

| character | class | baseline | old owner today |
|---|---|---|---|
| andy | PERSISTENT | sheriff 10,7 | classic sheriff |
| audrey | PERSISTENT | hotel_gn 12,9 | classic hotel_gn + adapter oej |
| benhorne | PERSISTENT | hotel_gn 5,7 | classic hotel_gn |
| bob | STORY_BOUND | OFFSCREEN(force) | classic redroom |
| bobby | PERSISTENT | town 31,16 | classic town + adapter roadhouse |
| donna | PERSISTENT | town 44,10 | classic town + adapter roadhouse |
| gerard | PERSISTENT | hospital 11,4 | classic hospital |
| giant | STORY_BOUND | OFFSCREEN(offscreen) | adapter roadhouse (gigante) |
| hawk | PERSISTENT | sheriff 12,8 | classic sheriff + adapter traincar×3/town×2 |
| infermiera | PERSISTENT | hospital 11,8 | adapter hospital |
| jacoby | PERSISTENT | town 16,25 | classic town |
| jacques | STORY_BOUND | TERMINAL_REMOVED(jacques_dead) | adapter oej |
| james | PERSISTENT | diner 9,6 | classic diner + adapter roadhouse |
| laura | STORY_BOUND | redroom 11,2 | classic redroom |
| leland | PERSISTENT | OFFSCREEN(mourning) | classic sheriff (atto5) + adapter diner |
| loglady | PERSISTENT | diner 4,5 | classic diner + adapter roadhouse |
| lucy | PERSISTENT | sheriff 2,6 | classic sheriff |
| maddy | STORY_BOUND | OFFSCREEN(not_in_town) | adapter diner |
| mfap | STORY_BOUND | redroom 8,4 | classic redroom |
| norma | PERSISTENT | diner 5,2 | classic diner + adapter roadhouse |
| piantone | STORY_BOUND_SCENOGRAPHY | OFFSCREEN(scenography) | adapter hospital |
| piantone_ronette | STORY_BOUND_SCENOGRAPHY | OFFSCREEN(scenography) | adapter hospital |
| ronette | PERSISTENT | hospital 3,5 | adapter hospital |
| sarah | PERSISTENT | palmer 9,7 | classic palmer |
| shelly | PERSISTENT | diner 9,7 | classic diner + adapter roadhouse |
| truman | PERSISTENT | sheriff 10,4 | classic sheriff + adapter traincar/roadhouse |

## Windows

| window | owner | when | cast → placement | authored (V6b) |
|---|---|---|---|---|
| JAMES_NOT_YET | classic | `{"not":{"flag":"sogno_fatto"}}` | james → OFFSCREEN(not_met) | — |
| ACT3_HAWK_BRIDGE | M5 | `{"all":[{"flag":"atto3"},{"not":{"flag":"vagone_scoperto"}}]}` | hawk → traincar 5,6 | entry: {"hawk":"classic:truman_atto3"} · exit: {"hawk":"m5.hawk.hawk_door.p01"} |
| ACT3_HAWK_DOOR | M5 | `{"all":[{"flag":"vagone_scoperto"},{"not":{"node_done":"m5_report_close"}}]}` | hawk → traincar 14,8 | exit: {"hawk":"m5.b9.report.p06"} |
| ACT3_HAWK_CUT | M5 | `{"all":[{"node_done":"m5_report_close"},{"not":{"flag":"east_route_confirmed"}}]}` | hawk → traincar 22,3 | exit: {"hawk":"m5.hawk.hawk_cut.repeat"} |
| ACT3_HAWK_OEJ_DOCK | M6 | `{"all":[{"flag":"east_route_confirmed"},{"not":{"flag":"jacques_preso"}}]}` | hawk → oej 6,8 | exit: {"hawk":"m6.b7.arrest.p06"} |
| ACT3_HAWK_ESCORT | M6 | `{"all":[{"flag":"jacques_preso"},{"not":{"node_done":"m6_hospital_guard"}}]}` | hawk → OFFSCREEN(escort) | — |
| ACT3_TRUMAN_REPORT | M5 | `{"all":[{"value_set":"m5_final_theory"},{"proposition_path":"P3A.formulation.status","equals":"formulated"},{"not":{"flag":"jacques_preso"}},{"not":{"flag":"audrey_vista_oej"}}]}` | truman → traincar 9,8 | — |
| ACT3_TRUMAN_BOAT | M6 | `{"all":[{"flag":"audrey_vista_oej"},{"not":{"flag":"jacques_preso"}}]}` | truman → OFFSCREEN(boat) | — |
| ACT3_JACQUES_AT_OEJ | M6 | `{"not":{"flag":"jacques_preso"}}` | jacques → oej 7,5 | exit: {"jacques":"m6.b7.arrest.p06"} |
| ACT3_JACQUES_GUARDED | M6 | `{"all":[{"flag":"jacques_preso"},{"not":{"flag":"jacques_dead"}}]}` | jacques → OFFSCREEN(guarded) | — |
| JACQUES_DEAD | M6 | `{"flag":"jacques_dead"}` | jacques → TERMINAL_REMOVED | — |
| ACT3_AUDREY_AT_OEJ | M6 | `{"all":[{"flag":"audrey_indaga"},{"not":{"flag":"audrey_vista_oej"}},{"not":{"flag":"jacques_preso"}}]}` | audrey → oej 13,7 | entry: {"audrey":"classic:audrey_a2"} · exit: {"audrey":"m6.b3.audrey.p02"} · residual: {"audrey":"R1"} |
| ACT3_GUARD_JACQUES | M6 | `{"all":[{"flag":"jacques_preso"},{"not":{"flag":"jacques_dead"}}]}` | piantone → hospital 7,3 | — |
| ACT3_GUARD_RONETTE | M6 | `{"all":[{"flag":"jacques_dead"},{"not":{"flag":"leland_morto"}}]}` | piantone_ronette → hospital 3,6 | — |
| ACT4_MADDY_DINER | M8 | `{"all":[{"flag":"atto4"},{"not":{"evidence":"T_LELAND_TAXI"}}]}` | maddy → diner 10,1 | exit: {"maddy":"m8.b0.leland_taxi.p00"} |
| ACT4_MADDY_HOME | M8 | `{"all":[{"evidence":"T_LELAND_TAXI"},{"not":{"flag":"maddy_trovata"}}]}` | maddy → OFFSCREEN(home) | — |
| ACT4_MADDY_GONE | M8 | `{"flag":"maddy_trovata"}` | maddy → TERMINAL_REMOVED | — |
| ACT4_LELAND_DINER | M8 | `{"all":[{"flag":"atto4"},{"not":{"evidence":"T_LELAND_TAXI"}}]}` | leland → diner 11,1 | exit: {"leland":"m8.b0.leland_taxi.p00"} |
| ACT4_LELAND_HIDDEN | M8 | `{"all":[{"evidence":"T_LELAND_TAXI"},{"not":{"flag":"atto5"}}]}` | leland → OFFSCREEN(hidden) | — |
| ACT5_LELAND_STATION | story | `{"all":[{"flag":"atto5"},{"not":{"flag":"leland_morto"}}]}` | leland → sheriff 8,5 | — |
| LELAND_DEAD | story | `{"flag":"leland_morto"}` | leland → TERMINAL_REMOVED | — |
| ACT4_EVENING_GATHERING | M8 | `{"all":[{"evidence":"T_LELAND_TAXI"},{"not":{"value_set":"focus_destination"}}]}` | truman → roadhouse 4,8; norma → roadhouse 5,6; shelly → roadhouse 3,6; loglady → roadhouse 2,6; james → roadhouse 2,4; bobby → roadhouse 3,4; donna → roadhouse 5,4 | entry: {"norma":"m8.b0.leland_taxi.chiusura.p01","shelly":"m8.b0.leland_taxi.chiusura.p01","loglady":"m8.b0.leland_taxi.chiusura.p01","james":"m8.b0.leland_taxi.chiusura.p01"} |
| ACT4_GIANT_STAGE | M8 | `{"all":[{"value_is":{"name":"presagio_status","equals":"active"}},{"not":{"value_set":"warning_target"}}]}` | giant → roadhouse 8,1 | residual: {"giant":"R2"} |
| ACT4_HAWK_PATROL | M8 | `{"all":[{"evidence":"T_LELAND_TAXI"},{"not":{"value_is":{"name":"body_found_by","equals":"hawk"}}},{"not":{"all":[{"value_is":{"name":"body_found_by","equals":"cooper"}},{"flag":"maddy_trovata"}]}}]}` | hawk → OFFSCREEN(patrol) | — |
| ACT4_HAWK_SHORE_FOUND_BY_HAWK | M8 | `{"all":[{"value_is":{"name":"body_found_by","equals":"hawk"}},{"not":{"flag":"atto5"}}]}` | hawk → town 16,27 | — |
| ACT4_HAWK_SHORE_COOPER | M8 | `{"all":[{"value_is":{"name":"body_found_by","equals":"cooper"}},{"flag":"maddy_trovata"},{"not":{"flag":"atto5"}}]}` | hawk → town 16,27 | — |
| ACT4_SARAH_ASLEEP | M8 | `{"all":[{"value_is":{"name":"presagio_status","equals":"active"}},{"not":{"flag":"atto5"}}]}` | sarah → OFFSCREEN(asleep) | — |
| ACT4_ANDY_WITH_SARAH_VICE | M8 | `{"all":[{"value_is":{"name":"sarah_support_state","equals":"vice"}},{"not":{"flag":"atto5"}}]}` | andy → OFFSCREEN(with_sarah) | — |
| ACT4_ANDY_WITH_SARAH_LATE | M8 | `{"all":[{"value_is":{"name":"sarah_support_state","equals":"none"}},{"flag":"maddy_trovata"},{"not":{"flag":"atto5"}}]}` | andy → OFFSCREEN(with_sarah) | — |
| ACT4_TOWN_HOME_NIGHT | M8 | `{"all":[{"value_set":"focus_destination"},{"not":{"flag":"atto5"}}]}` | shelly → OFFSCREEN(home); loglady → OFFSCREEN(home); james → OFFSCREEN(home); bobby → OFFSCREEN(home); donna → OFFSCREEN(home) | — |
| ACT4_JACOBY_HOME_NIGHT | M8 | `{"all":[{"evidence":"T_LELAND_TAXI"},{"not":{"flag":"atto5"}}]}` | jacoby → OFFSCREEN(home) | — |
| BOB_FINALE | classic | `{"flag":"leland_morto"}` | bob → redroom 14,2 | — |
