# Overlap / implicit-absence report (2026-09-12)

V2 (zero overlaps) and V3 (no implicit absence) over every seed of the pin fixture, every registry character. Static pair table: window pairs that share a character, with whether any seed makes both true.

Result: overlapping pairs reachable on the seed corpus = **0**; resolver errors (OVERLAP/NO_PLACEMENT) over 24 seeds × 26 characters = **0**.

| character | window A | window B | co-true on a seed |
|---|---|---|---|
| james | JAMES_NOT_YET | ACT4_EVENING_GATHERING | no |
| james | JAMES_NOT_YET | ACT4_TOWN_HOME_NIGHT | no |
| james | ACT4_EVENING_GATHERING | ACT4_TOWN_HOME_NIGHT | no |
| hawk | ACT3_HAWK_BRIDGE | ACT3_HAWK_DOOR | no |
| hawk | ACT3_HAWK_BRIDGE | ACT3_HAWK_CUT | no |
| hawk | ACT3_HAWK_BRIDGE | ACT3_HAWK_OEJ_DOCK | no |
| hawk | ACT3_HAWK_BRIDGE | ACT3_HAWK_ESCORT | no |
| hawk | ACT3_HAWK_BRIDGE | ACT4_HAWK_PATROL | no |
| hawk | ACT3_HAWK_BRIDGE | ACT4_HAWK_SHORE_FOUND_BY_HAWK | no |
| hawk | ACT3_HAWK_BRIDGE | ACT4_HAWK_SHORE_COOPER | no |
| hawk | ACT3_HAWK_DOOR | ACT3_HAWK_CUT | no |
| hawk | ACT3_HAWK_DOOR | ACT3_HAWK_OEJ_DOCK | no |
| hawk | ACT3_HAWK_DOOR | ACT3_HAWK_ESCORT | no |
| hawk | ACT3_HAWK_DOOR | ACT4_HAWK_PATROL | no |
| hawk | ACT3_HAWK_DOOR | ACT4_HAWK_SHORE_FOUND_BY_HAWK | no |
| hawk | ACT3_HAWK_DOOR | ACT4_HAWK_SHORE_COOPER | no |
| hawk | ACT3_HAWK_CUT | ACT3_HAWK_OEJ_DOCK | no |
| hawk | ACT3_HAWK_CUT | ACT3_HAWK_ESCORT | no |
| hawk | ACT3_HAWK_CUT | ACT4_HAWK_PATROL | no |
| hawk | ACT3_HAWK_CUT | ACT4_HAWK_SHORE_FOUND_BY_HAWK | no |
| hawk | ACT3_HAWK_CUT | ACT4_HAWK_SHORE_COOPER | no |
| hawk | ACT3_HAWK_OEJ_DOCK | ACT3_HAWK_ESCORT | no |
| hawk | ACT3_HAWK_OEJ_DOCK | ACT4_HAWK_PATROL | no |
| hawk | ACT3_HAWK_OEJ_DOCK | ACT4_HAWK_SHORE_FOUND_BY_HAWK | no |
| hawk | ACT3_HAWK_OEJ_DOCK | ACT4_HAWK_SHORE_COOPER | no |
| hawk | ACT3_HAWK_ESCORT | ACT4_HAWK_PATROL | no |
| hawk | ACT3_HAWK_ESCORT | ACT4_HAWK_SHORE_FOUND_BY_HAWK | no |
| hawk | ACT3_HAWK_ESCORT | ACT4_HAWK_SHORE_COOPER | no |
| hawk | ACT4_HAWK_PATROL | ACT4_HAWK_SHORE_FOUND_BY_HAWK | no |
| hawk | ACT4_HAWK_PATROL | ACT4_HAWK_SHORE_COOPER | no |
| hawk | ACT4_HAWK_SHORE_FOUND_BY_HAWK | ACT4_HAWK_SHORE_COOPER | no |
| truman | ACT3_TRUMAN_REPORT | ACT3_TRUMAN_BOAT | no |
| truman | ACT3_TRUMAN_REPORT | ACT4_EVENING_GATHERING | no |
| truman | ACT3_TRUMAN_BOAT | ACT4_EVENING_GATHERING | no |
| jacques | ACT3_JACQUES_AT_OEJ | ACT3_JACQUES_GUARDED | no |
| jacques | ACT3_JACQUES_AT_OEJ | JACQUES_DEAD | no |
| jacques | ACT3_JACQUES_GUARDED | JACQUES_DEAD | no |
| maddy | ACT4_MADDY_DINER | ACT4_MADDY_HOME | no |
| maddy | ACT4_MADDY_DINER | ACT4_MADDY_GONE | no |
| maddy | ACT4_MADDY_HOME | ACT4_MADDY_GONE | no |
| leland | ACT4_LELAND_DINER | ACT4_LELAND_HIDDEN | no |
| leland | ACT4_LELAND_DINER | ACT5_LELAND_STATION | no |
| leland | ACT4_LELAND_DINER | LELAND_DEAD | no |
| leland | ACT4_LELAND_HIDDEN | ACT5_LELAND_STATION | no |
| leland | ACT4_LELAND_HIDDEN | LELAND_DEAD | no |
| leland | ACT5_LELAND_STATION | LELAND_DEAD | no |
| shelly | ACT4_EVENING_GATHERING | ACT4_TOWN_HOME_NIGHT | no |
| loglady | ACT4_EVENING_GATHERING | ACT4_TOWN_HOME_NIGHT | no |
| bobby | ACT4_EVENING_GATHERING | ACT4_TOWN_HOME_NIGHT | no |
| donna | ACT4_EVENING_GATHERING | ACT4_TOWN_HOME_NIGHT | no |
| andy | ACT4_ANDY_WITH_SARAH_VICE | ACT4_ANDY_WITH_SARAH_LATE | no |
