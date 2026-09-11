# Cast Continuity — canonical windows, baselines and pins for Acts 1–4 (migration truth, CLOSED)

Date: 2026-09-11 (derived) · closed 2026-09-11 by `docs/cast-continuity-lead-decisions-v0.1.md` (D1–D11). Companion of `docs/cast-continuity-contract-v0.1.md`. **Not implemented.** This file is what the implementation pass compiles into the registry and what V5/V6 pin. Every row is LOCKED; no DECISION rows remain.

Authority order: `docs/story/timeline.md`, `docs/story/truth.md`, `docs/story/characters/*.md` > frozen act designs > mission JSON (boundaries, node placement) > sprite lists (`js/glue.js` `NPCS`, adapter `NARRATIVE_ENTITIES`) as "engine today" only. Inventories: `cast-window-inventory-acts-1-3.md`, `cast-window-inventory-act-4.md`.

Placement coordinates are today's entity/NPC coordinates kept as data; the environment pass may re-stage them.

## 1. Boundary events

| event | state | set by |
|---|---|---|
| dream done | `flag sogno_fatto` | classic `laura_sogno` (`js/data.js:591`) |
| Act 3 opens | `flag atto3` | classic `truman_atto3` (`js/data.js:614`) |
| car discovered | `flag vagone_scoperto` | M5 |
| theory ready | `value_set m5_final_theory` ∧ `P3A.formulation.status=formulated` | M5 `m5_theory_first` / `m5_theory_revision` |
| custody decided | `value_set s1` | M5 `m5_s1` |
| north cut confirmed | `flag east_route_confirmed` | M5 `m5_tracks_north` |
| Audrey investigates / seen at OEJ | `flag audrey_indaga` (`js/data.js:442,449`) / `flag audrey_vista_oej` (`M6.json:349`) | classic / M6 |
| Jacques arrested / dead | `flag jacques_preso` (`M6.json:1217`) / `flag jacques_dead` (`M6.json:1492`; classic `jacques_morto`) | M6 |
| Giant, first statement | `flag gigante1` (`js/data.js:689`) | classic |
| Act 4 opens | `flag atto4` (`M6.json:1617`) | M6 |
| promise made | `value_set promise_stance` ∈ {accompagno, autonomia, prudenza} | M8 `m8_diner` |
| Leland's taxi claim | `evidence T_LELAND_TAXI` | M8 `m8_leland_taxi` |
| the statement | `value_is presagio_status=active` (classic `gigante2` derived; no longer a world switch) | M8 `m8_roadhouse_truman` |
| the phone | `value_set warning_target` ∈ {palmer, centrale, nessuno}; `sarah_support_state` ∈ {none, vice, none}; `maddy_action_after_warning` | M8 `m8_roadhouse_phone` |
| the walk | `value_set focus_destination` ∈ {palmer, lago, diner} | M8 `m8_focus_choice` |
| the shore | `value_set body_found_by` ∈ {hawk, cooper}; `flag maddy_trovata`; `presagio_status=verified` | M8 routes / `m8_discovery` |
| station before dawn | `node_done m8_station` | M8 |
| Act 5 opens | `flag atto5` (`M9.json:447`) | M9 |
| Leland dead | `flag leland_morto` | Act 5 classic |

Reachability facts (V-suite asserts them on the enumerated set): `atto3 ⇒ sogno_fatto`; `east_route_confirmed ⇒ s1 ⇒ m5_final_theory`; `jacques_preso ⇒ east_route_confirmed`; `jacques_dead ⇒ jacques_preso`; `atto4 ⇒ gigante1 ⇒ jacques_dead`; `promise_stance ⇒ atto4`; `T_LELAND_TAXI ⇒ promise_stance`; `presagio_status ⇒ T_LELAND_TAXI`; `warning_target ⇒ presagio_status=active`; `warning_target ⇒ value_set sarah_support_state`; `focus_destination ⇒ warning_target`; `body_found_by ⇒ focus_destination`; `maddy_trovata ⇒ body_found_by`; `m8_station ⇒ maddy_trovata`; `atto5 ⇒ m8_station`.

## 2. Baselines (one per registry character; all LOCKED)

| character | class | baseline | authority |
|---|---|---|---|
| truman | PERSISTENT | `sheriff` 10,4 | T20, T25, T32, T36, T55 |
| hawk | PERSISTENT | `sheriff` 12,8 | T11, T32; M8 Lucy routes calls from the station (decisions §1 "confirmed") |
| lucy | PERSISTENT | `sheriff` 2,6 | T32, T34; M8 Lucy pages |
| andy | PERSISTENT | `sheriff` 10,7 | scene-contracts S3 "he has Andy at the station" |
| sarah | PERSISTENT | `palmer` 9,7 | Act 1 witness; Act 4 vision (L3) |
| leland | PERSISTENT | `OFFSCREEN` (composed mourning, out of frame) | T40; D9 |
| maddy | STORY-BOUND | `OFFSCREEN` (not in town) | arrives Act 4 |
| norma | PERSISTENT | `diner` 5,2 | environment-requirements "Norma at the counter"; `m8_route_diner` |
| shelly | PERSISTENT | `diner` 9,7 | works there (classic diner cascade) |
| loglady | PERSISTENT | `diner` 4,5 | the regular (classic `atto4 → a4` at the diner) |
| james | PERSISTENT | `diner` 9,6 (+ `JAMES_NOT_YET`) | T24; characters/james.md |
| bobby | PERSISTENT | `town` 31,16 wander | Act 1 classic |
| donna | PERSISTENT | `town` 44,10 wander | Act 1 classic (`js/data.js:283`); D10 |
| jacoby | PERSISTENT | `town` 16,25 | Act 1 classic (`js/data.js:290`); D10 |
| audrey | PERSISTENT | `hotel_gn` 12,9 wander | Act 1 classic (`js/data.js:297`); D10 |
| benhorne | PERSISTENT | `hotel_gn` 5,7 | Act 2 classic line; the hotel is his |
| gerard | PERSISTENT | `hospital` 11,4 | T23 ward; no source moves him |
| ronette | PERSISTENT | `hospital` 3,5 (bed draw = scene special) | T11 |
| infermiera | PERSISTENT | `hospital` 11,8 | T23 |
| jacques | STORY-BOUND | `TERMINAL_REMOVED` (+ `ACT3_JACQUES_AT_OEJ`) | T30–T34 |
| giant | STORY-BOUND | `OFFSCREEN` | Room 315 = mirror interact (T35); Roadhouse = window |
| laura, mfap | STORY-BOUND | `redroom` (scripted map only) | T22, T58 |
| bob | STORY-BOUND | `OFFSCREEN` | a force, no body in Acts 1–4 |
| piantone, piantone_ronette | STORY-BOUND scenography (`andy` sprite) | `OFFSCREEN` | M6 "SCENOGRAFIA" |
| cooper | player | exempt | |

## 3. Windows (authoring source; predicates in the mission `when` grammar, `¬` = `not`, `∨` = `any`)

### Acts 1–2

| WINDOW ID | ENTRY | EXIT / transition | CAST CHANGES (cause) |
|---|---|---|---|
| `JAMES_NOT_YET` | start | `sogno_fatto` (the dream makes Cooper ready for the heart's other half) | james → `OFFSCREEN` |
| `LAURA_DREAM` | scripted Red Room entry | `sogno_fatto` | laura, mfap → `redroom` (rendered by the scripted map; baseline suffices, recorded for V6) |

### Act 3

| WINDOW ID | ENTRY | EXIT / transition | CAST CHANGES (cause) |
|---|---|---|---|
| `ACT3_HAWK_BRIDGE` | `atto3 ∧ ¬vagone_scoperto` | `vagone_scoperto` | hawk → `traincar` 5,6 (the east road opens; he leads Cooper to the footbridge, T26) |
| `ACT3_HAWK_DOOR` | `vagone_scoperto ∧ ¬value_set s1` | `s1` | hawk → `traincar` 14,8 (outside the door, T27) |
| `ACT3_HAWK_CUT` | `value_set s1 ∧ ¬east_route_confirmed` | `east_route_confirmed` (T29) | hawk → `traincar` 22,3 (north cut). Engine today has no exit (`hawk_cut` = `value_set s1` forever) |
| `ACT3_TRUMAN_REPORT` | `value_set m5_final_theory ∧ P3A.formulation.status=formulated ∧ ¬east_route_confirmed` | `east_route_confirmed` | truman → `traincar` 9,8 (comes to receive the report, T28) |
| `ACT3_JACQUES_AT_OEJ` | start | `jacques_preso` (arrest, T30) | jacques → `oej` 7,5 (dealer at the table); after: baseline `TERMINAL_REMOVED` |
| `ACT3_AUDREY_AT_OEJ` | `audrey_indaga ∧ ¬audrey_vista_oej ∧ ¬jacques_preso` | `audrey_vista_oej` or `jacques_preso` (the eight o'clock boat with Truman, T42) | audrey → `oej` 13,7 (investigates alone, T30) |
| `ACT3_GUARD_JACQUES` | `jacques_preso ∧ ¬jacques_dead` | `jacques_dead` | piantone → `hospital` 7,3 ("Piantonato", T31) |
| `ACT3_GUARD_RONETTE` | `jacques_dead ∧ ¬leland_morto` | `leland_morto` (the author is no longer a threat; D11) | piantone_ronette → `hospital` 3,6 (the guard moves to the only living witness, T34/T41) |

Giant in Room 315: no body (mirror interact `specchio315`); no window. Truman's boat trip with Audrey (T42) is narrated at the night report; no window.

### Act 4

| WINDOW ID | ENTRY | EXIT / transition | CAST CHANGES (cause) |
|---|---|---|---|
| `ACT4_MADDY_DINER` | `atto4 ∧ ¬value_set promise_stance` | `promise_stance` ("Maddy saluta ed esce") | maddy → `diner` 10,1 (the coach decision, T50) |
| `ACT4_MADDY_HOME` | `value_set promise_stance ∧ ¬maddy_trovata` | `maddy_trovata` | maddy → `OFFSCREEN` (home; the house with Leland inside, T51–T53, HIDDEN) |
| `ACT4_MADDY_GONE` | `maddy_trovata` | never | maddy → `TERMINAL_REMOVED` (T54; the body is a form, never a figure) |
| `ACT4_LELAND_DINER` | `atto4 ∧ ¬evidence T_LELAND_TAXI` | `T_LELAND_TAXI` (he pays and leaves, T0.5) | leland → `diner` 11,1 (waits beside Maddy, T50) |
| `ACT4_LELAND_HIDDEN` | `evidence T_LELAND_TAXI ∧ ¬atto5` | `atto5` (M9 calls him in) | leland → `OFFSCREEN` ("già dentro la casa", T2/T51; HIDDEN). Baseline is `OFFSCREEN`; the window exists for V6 causality |
| `ACT5_LELAND_STATION` (placeholder, M9 owns) | `atto5 ∧ ¬leland_morto` | `leland_morto` | leland → `sheriff` 8,5 (T55–T56) |
| `LELAND_DEAD` | `leland_morto` | never | leland → `TERMINAL_REMOVED` (T57) |
| `ACT4_EVENING_GATHERING` | `evidence T_LELAND_TAXI ∧ ¬value_set warning_target` | `warning_target` ("Il Roadhouse ha chiuso") | truman → `roadhouse` 4,8 (waits for Cooper, S3); norma 5,6, shelly 3,6, loglady 2,6, james 2,4, bobby 3,4, donna 5,4 → `roadhouse` (the town gathers, T52; "Norma chiude alle sei per andarci") — D3, D7 |
| `ACT4_GIANT_STAGE` | `value_is presagio_status=active ∧ ¬value_set warning_target` | `warning_target` | giant → `roadhouse` 8,1 (the statement, T52) |
| `ACT4_HAWK_PATROL` | `evidence T_LELAND_TAXI ∧ ¬value_is body_found_by=hawk ∧ ¬(value_is body_found_by=cooper ∧ maddy_trovata)` | the anonymous call (`body_found_by`; on the `cooper` branch, `maddy_trovata`) | hawk → `OFFSCREEN` (patrol: Truman puts his free deputy on the road for the night; Lucy "è di pattuglia") — D6 |
| `ACT4_HAWK_SHORE` | `(value_is body_found_by=hawk ∨ (value_is body_found_by=cooper ∧ maddy_trovata)) ∧ ¬atto5` | `atto5` (dawn; M9) | hawk → `town` 16,27 (dispatched by the call, T7; keeps custody of the scene until dawn, "Il lago è recintato") — D5 |
| `ACT4_SARAH_ASLEEP` | `value_is presagio_status=active ∧ ¬atto5` | `atto5` | sarah → `OFFSCREEN` (asleep upstairs, house dark; "Svegli Sarah"; "dorme") — D1 |
| `ACT4_ANDY_WITH_SARAH_VICE` | `value_is sarah_support_state=vice ∧ ¬atto5` | `atto5` | andy → `OFFSCREEN` (Palmer house with Sarah; Lucy dispatches him, T4′) — D2 |
| `ACT4_ANDY_WITH_SARAH_LATE` | `value_is sarah_support_state=none ∧ maddy_trovata ∧ ¬atto5` | `atto5` | andy → `OFFSCREEN` (Truman passed by Sarah and left Andy with her, T7′) — D2 |
| `ACT4_TOWN_HOME_NIGHT` | `value_set warning_target ∧ ¬atto5` | `atto5` | shelly, loglady, james, bobby, donna → `OFFSCREEN` (the Roadhouse closed; the town went home; "le strade sono solo distanza") — D7b. Norma and Truman are NOT in this window: they return to baseline by the gathering's exit (Norma at the diner for `m8_route_diner`; Truman at the station, `p_lago`) |
| `ACT4_JACOBY_HOME_NIGHT` | `evidence T_LELAND_TAXI ∧ ¬atto5` | `atto5` | jacoby → `OFFSCREEN` (home; not among the people at the Roadhouse) — D4 |

## 4. Pin tables (V5 — relevant cast per story moment; unlisted = baseline)

Abbreviations: SH sheriff · DR diner · TW town · RH roadhouse · PL palmer · HG hotel_gn · HO hospital · TC traincar · OFF OFFSCREEN · TERM TERMINAL_REMOVED.

| moment (seed) | truman | hawk | lucy | andy | sarah | leland | maddy | norma | shelly | loglady | james | bobby | donna | jacoby | audrey | jacques | giant | piantone/ronette-guard |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `ACT1_TOWN` (start) | SH | SH | SH | SH | PL | OFF | OFF | DR | DR | DR | **OFF** | TW | TW | TW | HG | oej | OFF | OFF/OFF |
| `ACT2_DAY2` (`sogno_fatto`) | SH | SH | SH | SH | PL | OFF | OFF | DR | DR | DR | **DR** | TW | TW | TW | HG | oej | OFF | OFF/OFF |
| `ACT3_BRIDGE` (`atto3`, ¬`vagone_scoperto`) | SH | **TC 5,6** | SH | SH | PL | OFF | OFF | DR | DR | DR | DR | TW | TW | TW | HG | oej | OFF | OFF/OFF |
| `ACT3_TRAINCAR_REPORT` (theory ready, ¬`s1`) | **TC 9,8** | **TC 14,8** | SH | SH | PL | OFF | OFF | DR | DR | DR | DR | TW | TW | TW | HG | oej | OFF | OFF/OFF |
| `ACT3_NORTH_CUT` (`s1`, ¬`east_route_confirmed`) | TC 9,8 | **TC 22,3** | SH | SH | PL | OFF | OFF | DR | DR | DR | DR | TW | TW | TW | HG | oej | OFF | OFF/OFF |
| `ACT3_OEJ` (`east_route_confirmed`, `audrey_indaga`, ¬`audrey_vista_oej`, ¬`jacques_preso`) | **SH** | **SH** | SH | SH | PL | OFF | OFF | DR | DR | DR | DR | TW | TW | TW | **oej 13,7** | oej 7,5 | OFF | OFF/OFF |
| `ACT3_OEJ_NO_AUDREY` (same, ¬`audrey_indaga`) | SH | SH | SH | SH | PL | OFF | OFF | DR | DR | DR | DR | TW | TW | TW | **HG** | oej | OFF | OFF/OFF |
| `ACT3_GUARDED_HOSPITAL` (`jacques_preso`, ¬`jacques_dead`) | SH | SH | SH | SH | PL | OFF | OFF | DR | DR | DR | DR | TW | TW | TW | HG | **TERM** | OFF | **HO 7,3**/OFF |
| `ACT3_NIGHT_STATION` (`jacques_dead`, ¬`gigante1`) | SH | SH | SH | SH | PL | OFF | OFF | DR | DR | DR | DR | TW | TW | TW | HG | TERM | OFF (mirror) | OFF/**HO 3,6** |
| `ACT4_AFTERNOON` (`atto4`, ¬`promise_stance`) | SH | SH | SH | SH | PL | **DR 11,1** | **DR 10,1** | DR | DR | DR | DR | TW | TW | TW | HG | TERM | OFF | OFF/HO 3,6 |
| `ACT4_PROMISE_MADE` (`promise_stance`, ¬`T_LELAND_TAXI`) | SH | SH | SH | SH | PL | DR 11,1 | **OFF** | DR | DR | DR | DR | TW | TW | TW | HG | TERM | OFF | OFF/HO 3,6 |
| `ACT4_EVENING_GATHERING` (`T_LELAND_TAXI`, ¬`presagio_status`) | **RH 4,8** | **OFF patrol** | SH | SH | PL | **OFF** | OFF | **RH** | **RH** | **RH** | **RH** | **RH** | **RH** | **OFF** | HG | TERM | OFF | OFF/HO 3,6 |
| **`ACT4_ROADHOUSE_PRE_PHONE`** (`presagio_status=active`, ¬`warning_target`) | RH 4,8 | OFF patrol | SH | SH | **OFF asleep** | OFF | OFF | RH | RH | RH | RH | RH | RH | OFF | HG | TERM | **RH 8,1** | OFF/HO 3,6 |
| `ACT4_POST_PHONE_PALMER` (`warning_target=palmer`, ¬`focus_destination`) | **SH** | OFF | SH | SH | OFF | OFF | OFF | **DR** | **OFF** | **OFF** | **OFF** | **OFF** | **OFF** | OFF | HG | TERM | **OFF** | OFF/HO 3,6 |
| `ACT4_POST_PHONE_NESSUNO` (`warning_target=nessuno`) | SH | OFF | SH | SH | OFF | OFF | OFF | DR | OFF | OFF | OFF | OFF | OFF | OFF | HG | TERM | OFF | OFF/HO 3,6 |
| `ACT4_POST_PHONE_CENTRALE` (`warning_target=centrale`) | SH | OFF | SH | **OFF (Palmer)** | OFF | OFF | OFF | DR | OFF | OFF | OFF | OFF | OFF | OFF | HG | TERM | OFF | OFF/HO 3,6 |
| `ACT4_ROUTE_PALMER` (`focus_destination=palmer`, ¬`body_found_by`) — Palmer map: nobody | SH | OFF | SH | per branch | OFF | OFF | OFF | DR | OFF | OFF | OFF | OFF | OFF | OFF | HG | TERM | OFF | OFF/HO 3,6 |
| `ACT4_ROUTE_DINER` (`focus_destination=diner`, ¬`body_found_by`) | SH | OFF | SH | per branch | OFF | OFF | OFF | **DR (actor)** | OFF | OFF | OFF | OFF | OFF | OFF | HG | TERM | OFF | OFF/HO 3,6 |
| `ACT4_ROUTE_LAKE` (`focus_destination=lago`, ¬`body_found_by`) | SH | OFF (on the road) | SH | per branch | OFF | OFF | OFF | DR | OFF | OFF | OFF | OFF | OFF | OFF | HG | TERM | OFF | OFF/HO 3,6 |
| `ACT4_SHORE_COOPER_FIRST` (`body_found_by=cooper`, ¬`maddy_trovata`) | SH | **OFF (on the road)** | SH | per branch | OFF | OFF | OFF | DR | OFF | OFF | OFF | OFF | OFF | OFF | HG | TERM | OFF | OFF/HO 3,6 |
| `ACT4_SHORE_HAWK` (`body_found_by=hawk`, `maddy_trovata`, ¬`m8_station`) | SH | **TW 16,27** | SH | **OFF (Palmer)** | OFF | OFF | **TERM** | DR | OFF | OFF | OFF | OFF | OFF | OFF | HG | TERM | OFF | OFF/HO 3,6 |
| `ACT4_SHORE_COOPER_AFTER` (`body_found_by=cooper`, `maddy_trovata`, ¬`m8_station`) | SH | **TW 16,27** | SH | OFF (Palmer) | OFF | OFF | TERM | DR | OFF | OFF | OFF | OFF | OFF | OFF | HG | TERM | OFF | OFF/HO 3,6 |
| **`ACT4_STATION_BEFORE_DAWN`** (`m8_station`, ¬`atto5`) | **SH** | TW 16,27 | SH | OFF (Palmer) | OFF | OFF | TERM | DR | OFF | OFF | OFF | OFF | OFF | OFF | HG | TERM | OFF | OFF/HO 3,6 |

"per branch" for Andy = OFF (Palmer) on `centrale`; SH on `palmer`/`nessuno` until `maddy_trovata`. Ronette, nurse, Gerard, Ben Horne: baseline in every row. Laura/mfap: `redroom`. Bob: OFF.

## 5. Cast change records (V6)

| # | character | CAST BEFORE | EVENT / CAUSE | CAST AFTER | RETURN / NEXT |
|---|---|---|---|---|---|
| C1 | james | OFF (not met) | `sogno_fatto` (T22→T24) | DR | — |
| C2 | hawk | SH | `atto3`: the east road opens (T26) | TC bridge | `vagone_scoperto` → door → `s1` → cut → `east_route_confirmed` → SH |
| C3 | truman | SH | theory ready: comes to receive the report (T28) | TC 9,8 | `east_route_confirmed` → SH |
| C4 | audrey | HG | `audrey_indaga`: OEJ alone (T30) | oej | `audrey_vista_oej` / `jacques_preso` (the boat, T42) → HG |
| C5 | jacques | oej | `jacques_preso` (T30–T34) | TERM | never |
| C6 | piantone | OFF | `jacques_preso` (T31) | HO 7,3 | `jacques_dead` → OFF; piantone_ronette HO 3,6 → `leland_morto` → OFF |
| C7 | maddy | OFF | `atto4` (T50) | DR 10,1 | `promise_stance` → OFF (T51) → `maddy_trovata` → TERM |
| C8 | leland | OFF | `atto4` (T50) | DR 11,1 | `T_LELAND_TAXI` → OFF (HIDDEN) → `atto5` → SH → `leland_morto` → TERM |
| C9 | hawk | SH | `T_LELAND_TAXI`: on the road for the night (D6) | OFF patrol | `body_found_by` (call, T7; `cooper` branch at `maddy_trovata`) → TW 16,27 → `atto5` → SH |
| C10 | truman, norma, shelly, loglady, james, bobby, donna | baselines | `T_LELAND_TAXI`: the town gathers (T52) | RH | `warning_target` → truman SH, norma DR, others OFF (home) → `atto5` → baselines |
| C11 | giant | OFF | `presagio_status=active`: the statement (T52) | RH 8,1 | `warning_target` → OFF |
| C12 | andy | SH | `sarah_support_state=vice`: Lucy dispatches him (T4′) | OFF (Palmer) | `atto5` → SH |
| C13 | andy | SH | `sarah_support_state=none ∧ maddy_trovata`: Truman left him with Sarah (T7′) | OFF (Palmer) | `atto5` → SH |
| C14 | sarah | PL | `presagio_status=active`: night, asleep | OFF | `atto5` → PL |
| C15 | jacoby | TW | `T_LELAND_TAXI`: evening, home | OFF | `atto5` → TW |

## 6. Per-character exclusion (V2 proves over reachable states)

- **hawk**: BRIDGE (`atto3 ∧ ¬vagone_scoperto`), DOOR (`vagone_scoperto ∧ ¬s1`), CUT (`s1 ∧ ¬east_route_confirmed`) partition `atto3 ∧ ¬east_route_confirmed`; PATROL and SHORE are complements inside `T_LELAND_TAXI ∧ ¬atto5` (SHORE = `hawk ∨ (cooper ∧ maddy_trovata)`, PATROL = its negation); `T_LELAND_TAXI ⇒ east_route_confirmed` separates Act 3 from Act 4.
- **truman**: REPORT vs GATHERING exclusive (`T_LELAND_TAXI ⇒ atto4 ⇒ east_route_confirmed`).
- **norma**: GATHERING only. **shelly, loglady, bobby, donna**: GATHERING (`¬warning_target`) vs HOME_NIGHT (`warning_target`). **james**: + NOT_YET (`¬sogno_fatto`; `atto4 ⇒ sogno_fatto`).
- **maddy**: DINER / HOME / GONE partition `atto4`. **leland**: DINER / HIDDEN / STATION / DEAD partition `atto4`.
- **andy**: VICE (`sarah_support_state=vice`) vs LATE (`=none ∧ maddy_trovata`) exclusive by value.
- **sarah, jacoby, giant, audrey, jacques, piantone ×2**: single windows (piantone/piantone_ronette are distinct ids).

## 7. Engine today vs truth — what the migration deletes or corrects

| fact today | truth | migration action |
|---|---|---|
| classic `truman`, `hawk`, `lucy`, `andy` at `sheriff` (no cond) | baselines | registry baselines; classic entries deleted (V7) |
| adapter roadhouse crowd `atto4 ∧ ¬warning_target` | `ACT4_EVENING_GATHERING` from `T_LELAND_TAXI` | replace; adapter bodies deleted |
| classic diner four without Act 4 cond; town/palmer `!flag:gigante2` | gathering exit + HOME_NIGHT / SARAH_ASLEEP / JACOBY_HOME_NIGHT | delete the four conds; `gigante2` stops being a world switch; route-trace O6 180 ms race disappears |
| `hawk_cut` no exit | CUT ends at `east_route_confirmed` | window exit |
| `hawk_shore_first/after` end at `m8_station` | SHORE until `atto5` | window |
| classic `leland` only `atto5 ∧ ¬leland_morto` | Acts 1–4 OFF; DINER window; Act 5 placeholder | registry |
| `piantone_ronette` permanent | until `leland_morto` | window exit |
| Giant: no Room 315 body; roadhouse entity | matches | registry window; mirror untouched |
| Ronette bed draw special | references the resolved body | unchanged |

## 8. Open decisions — CLOSED

All eleven decisions (D1–D11) are closed in `docs/cast-continuity-lead-decisions-v0.1.md` §1 with BEFORE / CAUSE / AFTER / NEXT / VISIBILITY / SOURCE and the rejected alternatives. Not decided on purpose (§8 there): Act 5 windows (M9/M10/Loggia design), the guard's end inside Act 5, coordinates/facing/`dialogue: null` per body (environment pass).

## 9. What this file does not decide

Coordinates and facing per placement; the `dialogue: null` policy for crowd bodies (S3: "full and still"); Act 5 windows (placeholders only, for the exclusion proofs).
