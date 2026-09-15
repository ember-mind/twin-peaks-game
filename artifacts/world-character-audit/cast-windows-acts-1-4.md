# Cast Continuity — canonical windows, baselines and pins for Acts 1–4 (migration truth)

Date: 2026-09-11 · closed by `docs/cast-continuity-lead-decisions-v0.1.md` (D1–D11) · corrected by `docs/cast-continuity-final-consistency-report.md` (final consistency pass, same day). Companion of `docs/cast-continuity-contract-v0.1.md`. **Not implemented.** This file is what the implementation pass compiles into the registry and what V5/V6 pin.

Status: every row LOCKED. B1 (the entry of the Roadhouse gathering for the four diner regulars) CLOSED 2026-09-11 by lead decision, option B: the closing beat of `m8_leland_taxi` authors the Double R closing for the Roadhouse evening (`docs/cast-continuity-b1-resolution.md`).

Authority order: `docs/story/*` > frozen act designs and closure reports > mission JSON (boundaries, node placement, page text) > sprite lists as "engine today" only. Inventories: `cast-window-inventory-acts-1-3.md`, `cast-window-inventory-act-4.md`.

Semantics reminder (contract §2): `OFFSCREEN` = alive and somewhere in story reality, deliberately not represented as a body; `TERMINAL_REMOVED` = can never return under the current story truth. A window may exit only on an authored event; no one leaves a room the player is standing in without a visible authored cause (contract §3, invariant "no silent vanish").

Placement coordinates are today's entity/NPC coordinates kept as data; the environment pass may re-stage them.

## 1. Boundary events

| event | state | set by |
|---|---|---|
| dream done | `flag sogno_fatto` | classic `laura_sogno` (`js/data.js:591`) |
| Act 3 opens | `flag atto3` | classic `truman_atto3` (`js/data.js:614`) |
| car discovered | `flag vagone_scoperto` | M5 `m5_discovery` |
| theory ready | `value_set m5_final_theory` ∧ `P3A.formulation.status=formulated` | M5 |
| custody decided; report closed | `value_set s1`; `node_done m5_report_close` | M5 |
| north cut confirmed | `flag east_route_confirmed` | M5 `m5_tracks_north` (at the cut) |
| ferry taken | `node_done m6_ferry` | M6 (actor jacques, OEJ) |
| Audrey seen at OEJ | `flag audrey_vista_oej` | M6 `m6_audrey` |
| Jacques arrested / dead | `flag jacques_preso` (`m6_arrest`) / `flag jacques_dead` (`m6_news`) | M6 |
| ward visited | `node_done m6_hospital_guard` | M6 |
| night report done | `node_done m6_return_night` | M6 |
| Giant, first statement | `flag gigante1` | classic `specchio315` |
| Act 4 opens | `flag atto4` | M6 `m6_atto4_bridge` |
| promise made | `value_set promise_stance` | M8 `m8_diner` |
| Maddy leaves, Leland's taxi claim, the Double R closes for the evening | `evidence T_LELAND_TAXI` (`m8_leland_taxi`; p00 "(Maddy saluta ed esce. Leland posa il conto sul bancone.)"; closing beat `m8.b0.leland_taxi.chiusura.p01` "(Norma gira il cartello sulla porta e spegne l'insegna. Sedie sui tavoli, cappotti dagli attaccapanni: il Double R chiude alle sei, stasera si va al Roadhouse.)" — approved prose, B1 resolution) | M8 |
| the statement | `value_is presagio_status=active` | M8 `m8_roadhouse_truman` |
| the phone | `value_set warning_target`; `sarah_support_state`; `maddy_action_after_warning` | M8 `m8_roadhouse_phone` (roadhouse, object `roadhouse_phone` 8,5) |
| the threshold / route commit | `value_set focus_destination` | M8 `m8_focus_choice` (town, landmark `town_crossroads` 47,30 — outside the Roadhouse) |
| the shore | `value_set body_found_by`; `flag maddy_trovata` | M8 routes / `m8_discovery` |
| station before dawn | `node_done m8_station` | M8 |
| Act 5 opens / Leland dead | `flag atto5` / `flag leland_morto` | M9 / Act 5 |

Reachability facts (V-suite asserts them): `atto3 ⇒ sogno_fatto`; `east_route_confirmed ⇒ s1 ⇒ m5_final_theory`; `m6_ferry ⇒ east_route_confirmed`; `audrey_vista_oej ⇒ m6_ferry ∧ audrey_indaga`; `jacques_preso ⇒ m6_ferry`; `jacques_dead ⇒ m6_return_night ⇒ m6_hospital_guard ⇒ jacques_preso`; `atto4 ⇒ gigante1 ⇒ jacques_dead`; `promise_stance ⇒ atto4`; `T_LELAND_TAXI ⇒ promise_stance`; `presagio_status ⇒ T_LELAND_TAXI`; `warning_target ⇒ presagio_status=active ∧ value_set sarah_support_state`; `focus_destination ⇒ warning_target`; `body_found_by ⇒ focus_destination`; `maddy_trovata ⇒ body_found_by`; `m8_station ⇒ maddy_trovata`; `atto5 ⇒ m8_station`.

## 2. Baselines (one per registry character; all LOCKED)

| character | class | baseline | authority |
|---|---|---|---|
| truman | PERSISTENT | `sheriff` 10,4 | T20, T25, T32, T36, T55 |
| hawk | PERSISTENT | `sheriff` 12,8 | T11, T32 ("Hawk scrive"), M8 Lucy routes calls from the station |
| lucy | PERSISTENT | `sheriff` 2,6 | T32, T34; M8 Lucy pages |
| andy | PERSISTENT | `sheriff` 10,7 | scene-contracts S3 |
| sarah | PERSISTENT | `palmer` 9,7 | Act 1 witness; L3 |
| leland | PERSISTENT | `OFFSCREEN` (composed mourning, out of frame) | T40; D9 |
| maddy | STORY-BOUND | `OFFSCREEN` (not in town) | arrives Act 4 |
| norma | PERSISTENT | `diner` 5,2 | environment-requirements; `m8_route_diner` |
| shelly | PERSISTENT | `diner` 9,7 | works there |
| loglady | PERSISTENT | `diner` 4,5 | the regular; classic `atto4 → a4` |
| james | PERSISTENT | `diner` 9,6 (+ `JAMES_NOT_YET`) | T24 |
| bobby | PERSISTENT | `town` 31,16 wander | Act 1 classic |
| donna | PERSISTENT | `town` 44,10 wander | Act 1 classic (`js/data.js:283`) |
| jacoby | PERSISTENT | `town` 16,25 | Act 1 classic (`js/data.js:290`) |
| audrey | PERSISTENT | `hotel_gn` 12,9 wander | Act 1 classic (`js/data.js:297`) |
| benhorne | PERSISTENT | `hotel_gn` 5,7 | Act 2 classic |
| gerard | PERSISTENT | `hospital` 11,4 | T23 |
| ronette | PERSISTENT | `hospital` 3,5 (bed draw = scene special) | T11 |
| infermiera | PERSISTENT | `hospital` 11,8 | T23 |
| jacques | STORY-BOUND | `TERMINAL_REMOVED` — reached only through `JACQUES_DEAD`; before it the OEJ and GUARDED windows cover every reachable state (V3 satisfied by windows, see §6) | T30–T34 |
| giant | STORY-BOUND | `OFFSCREEN` | T35 mirror; T52 window |
| laura, mfap | STORY-BOUND | `redroom` (scripted map only) | T22, T58 |
| bob | STORY-BOUND | `OFFSCREEN` | a force, no body in Acts 1–4 |
| piantone, piantone_ronette | STORY-BOUND scenography | `OFFSCREEN` | M6 "SCENOGRAFIA" |
| cooper | player | exempt | |

## 3. Windows (authoring source; predicates in the mission `when` grammar, `¬` = `not`, `∨` = `any`)

### Acts 1–2

| WINDOW ID | ENTRY | EXIT / transition | CAST CHANGES (cause) | visible exit |
|---|---|---|---|---|
| `JAMES_NOT_YET` | start | `sogno_fatto` | james → `OFFSCREEN` (not met) | player is in Room 315; James appears at the diner |
| `LAURA_DREAM` | scripted Red Room entry | `sogno_fatto` | laura, mfap → `redroom` (record for V6; baseline suffices) | scripted |

### Act 3

| WINDOW ID | ENTRY | EXIT / transition | CAST CHANGES (cause) | visible exit |
|---|---|---|---|---|
| `ACT3_HAWK_BRIDGE` | `atto3 ∧ ¬vagone_scoperto` | `vagone_scoperto` | hawk → `traincar` 5,6 (leads Cooper to the footbridge, T26; "Hawk resta sulle impronte") | the discovery; the door node's own line "La soglia la tengo io" authors his new post |
| `ACT3_HAWK_DOOR` | `vagone_scoperto ∧ ¬node_done m5_report_close` | `m5_report_close` ("(dalla porta) … Non te lo dico da qui. Vieni.") | hawk → `traincar` 14,8 (holds the threshold, T27) | Hawk himself says he leads on |
| `ACT3_HAWK_CUT` | `node_done m5_report_close ∧ ¬east_route_confirmed` | `east_route_confirmed` (T29; Cooper's own line at the cut: "Hawk viene fino alla riva. Dalla riva in poi, io.") | hawk → `traincar` 22,3 (north cut) | authored by the line above: he goes ahead to the bank |
| **`ACT3_HAWK_OEJ_DOCK`** (corrected) | `east_route_confirmed ∧ ¬jacques_preso` | `jacques_preso` (the arrest on the dock: "Sul molo della contea, Jacques spinge Hawk…") | hawk → `oej` 6,8 (the landing by the south door; "(fuori, piano) Io resto qui. Se chiudono il molo, restiamo dentro.") — frozen B1 "Hawk waits at the dock", B6 "Hawk on the dock" | the arrest pages |
| **`ACT3_HAWK_ESCORT`** (new, frozen text) | `jacques_preso ∧ ¬node_done m6_hospital_guard` | `m6_hospital_guard` (the register: "Ultima riga: la firma di Hawk, ora del ricovero") | hawk → `OFFSCREEN` (escorts Jacques to the ward, signs him in, T31) | Cooper is at OEJ/town/station; the signature is the rendered trace; back at the station for "Hawk scrive" (`m6_return_night`) |
| `ACT3_TRUMAN_REPORT` (corrected exit) | `value_set m5_final_theory ∧ P3A.formulation.status=formulated ∧ ¬jacques_preso ∧ ¬audrey_vista_oej` | `jacques_preso` (the site closes; he is at the station with the file for `m6_return_night_early`) or `audrey_vista_oej` (→ BOAT) | truman → `traincar` 9,8 (comes to receive the report, T28; **stays**: "Io resto con l'anello e con il verbale", `m5_report_close`) | Cooper is at OEJ when either exit fires |
| **`ACT3_TRUMAN_BOAT`** (new, frozen text) | `audrey_vista_oej ∧ ¬jacques_preso` | `jacques_preso` | truman → `OFFSCREEN` (meets the eight o'clock boat and walks Audrey home: "La nuova del guardaroba è rientrata con la barca delle otto. L'ho accompagnata io.", T42) | Cooper is at OEJ |
| `ACT3_JACQUES_AT_OEJ` | `¬jacques_preso` | `jacques_preso` (the arrest, T30) | jacques → `oej` 7,5 | the arrest pages (he falls between the planks) |
| **`ACT3_JACQUES_GUARDED`** (corrected) | `jacques_preso ∧ ¬jacques_dead` | `jacques_dead` (T33–T34) | jacques → `OFFSCREEN` ("piantonato, stanza in fondo al reparto" — alive, in custody, deliberately not a body; the guard, the door and the register render it) | Cooper is at the station when Lucy's call lands |
| **`JACQUES_DEAD`** | `jacques_dead` | never | jacques → `TERMINAL_REMOVED` | — |
| `ACT3_AUDREY_AT_OEJ` | `audrey_indaga ∧ ¬audrey_vista_oej ∧ ¬jacques_preso` | `audrey_vista_oej` ("esce da quella porta entro dieci minuti") or `jacques_preso` | audrey → `oej` 13,7 | her own line; at the arrest the visit is over (residual R1, §8) |
| `ACT3_GUARD_JACQUES` | `jacques_preso ∧ ¬jacques_dead` | `jacques_dead` | piantone → `hospital` 7,3 | — |
| `ACT3_GUARD_RONETTE` | `jacques_dead ∧ ¬leland_morto` | `leland_morto` (D11) | piantone_ronette → `hospital` 3,6 | — |

Giant in Room 315: no body (mirror interact); no window.

### Act 4

| WINDOW ID | ENTRY | EXIT / transition | CAST CHANGES (cause) | visible exit |
|---|---|---|---|---|
| `ACT4_MADDY_DINER` (corrected exit) | `atto4 ∧ ¬evidence T_LELAND_TAXI` | `T_LELAND_TAXI` — p00 "(Maddy saluta ed esce…)" | maddy → `diner` 10,1 (T50) | her exit is the first page of the node that sets the exit state |
| `ACT4_MADDY_HOME` | `evidence T_LELAND_TAXI ∧ ¬maddy_trovata` | `maddy_trovata` | maddy → `OFFSCREEN` (home; the house with Leland inside, HIDDEN) | — |
| `ACT4_MADDY_GONE` | `maddy_trovata` | never | maddy → `TERMINAL_REMOVED` (T54) | — |
| `ACT4_LELAND_DINER` | `atto4 ∧ ¬evidence T_LELAND_TAXI` | `T_LELAND_TAXI` — p00 "Leland posa il conto sul bancone" (pays, states the taxi, leaves: T0.5) | leland → `diner` 11,1 | the bill caption |
| `ACT4_LELAND_HIDDEN` | `evidence T_LELAND_TAXI ∧ ¬atto5` | `atto5` | leland → `OFFSCREEN` (HIDDEN) | — |
| `ACT5_LELAND_STATION` (owner M10 since Act 5 pass 01) | `atto5 ∧ ¬node_done m10_fermo ∧ ¬leland_morto` | `m10_fermo` — `exit_authored_by m10.b9.fermo.p03` «(La porta si vede per intero, da fuori. La serratura fa il suo suono.)» | leland → `sheriff` 8,5 | M9-B3 arrival; M10-B9 cell |
| `ACT5_LELAND_CELL` (Act 5 pass 01) | `node_done m10_fermo ∧ ¬leland_morto` | `leland_morto` (M10-B10) | leland → `OFFSCREEN` (cell: the station map has no playable cell; authored by m10.b9.fermo.p02–p03) | — |
| `ACT5_TRUMAN_OUT_INTUITIVE` (Act 5 pass 01) | `value_is m10_method=intuitivo ∧ node_done m10_domande ∧ ¬node_done m10_confessione` | `m10_confessione` — `exit_authored_by m10.b6.intuitivo.p07` «(Truman rientra. Il blocco è aperto.)» | truman → `OFFSCREEN` (corridor; `entry_authored_by m10.b3.intuitivo.p09` «… Torno quando ce l'ha. (esce)») | Cooper in the room: both pages on sheriff |
| `LELAND_DEAD` | `leland_morto` | never | leland → `TERMINAL_REMOVED` | — |
| `ACT4_EVENING_GATHERING` (corrected exit; entry closed, B1) | `evidence T_LELAND_TAXI` for all seven. For norma, shelly, loglady, james the entry displaces them from the map Cooper stands on, so it carries `entry_authored_by: m8.b0.leland_taxi.chiusura.p01` (the closing beat of the same node: the Double R closes for the Roadhouse evening). Truman, bobby, donna are not in the player's room when it fires | `value_set focus_destination` (Cooper is at the crossroads outside; "Il Roadhouse ha chiuso") | truman → `roadhouse` 4,8; norma 5,6, shelly 3,6, loglady 2,6, james 2,4, bobby 3,4, donna 5,4 → `roadhouse` (the town gathers, T52) | the departure is visible before the state commits; the Roadhouse closes after Cooper has left it |
| `ACT4_GIANT_STAGE` | `value_is presagio_status=active ∧ ¬value_set warning_target` | `warning_target` (p05 "La sala riprende il suo tempo. Nessuno ha visto niente.") | giant → `roadhouse` 8,1 | supernatural narrow window; accepted |
| `ACT4_HAWK_PATROL` | `evidence T_LELAND_TAXI ∧ ¬value_is body_found_by=hawk ∧ ¬(value_is body_found_by=cooper ∧ maddy_trovata)` | the anonymous call | hawk → `OFFSCREEN` (patrol; D6) | Cooper at the diner when it starts |
| `ACT4_HAWK_SHORE` | `(value_is body_found_by=hawk ∨ (value_is body_found_by=cooper ∧ maddy_trovata)) ∧ ¬atto5` | `atto5` | hawk → `town` 16,27 (T7; keeps the scene until dawn, D5) | — |
| `ACT4_SARAH_ASLEEP` (predicate corrected 2026-09-13) | `value_set presagio_status ∧ ¬atto5` (`=active` was wrong: `m8_discovery` turns it to `verified`, which would have put Sarah back in her living room at night) | `atto5` | sarah → `OFFSCREEN` (asleep upstairs; D1) | Cooper at the Roadhouse |
| `ACT4_ANDY_WITH_SARAH_VICE` | `value_is sarah_support_state=vice ∧ ¬atto5` | `atto5` | andy → `OFFSCREEN` (dispatched, T4′; D2) | Cooper at the Roadhouse |
| `ACT4_ANDY_WITH_SARAH_LATE` | `value_is sarah_support_state=none ∧ maddy_trovata ∧ ¬atto5` | `atto5` | andy → `OFFSCREEN` (Truman left him with Sarah, T7′; D2) | Cooper at the shore |
| `ACT4_TOWN_HOME_NIGHT` (corrected entry) | `value_set focus_destination ∧ ¬atto5` | `atto5` | shelly, loglady, james, bobby, donna → `OFFSCREEN` (home; D7b). Norma → baseline `diner` and Truman → baseline `sheriff` by the gathering's exit | — |
| `ACT4_JACOBY_HOME_NIGHT` | `evidence T_LELAND_TAXI ∧ ¬atto5` | `atto5` | jacoby → `OFFSCREEN` (D4) | Cooper at the diner |

Post-phone, pre-threshold (`warning_target ∧ ¬focus_destination`): the Roadhouse keeps Truman and the six; the Giant is gone; Cooper may still be inside or re-enter. This is the corrected world state the environment pass inherits: **the room empties only after the route commit at the crossroads**.

## 4. Pin tables (V5 — relevant cast per story moment; unlisted = baseline)

SH sheriff · DR diner · TW town · RH roadhouse · PL palmer · HG hotel_gn · HO hospital · TC traincar · OEJ oej · OFF OFFSCREEN · TERM TERMINAL_REMOVED.

| moment (seed) | truman | hawk | lucy | andy | sarah | leland | maddy | norma | shelly | loglady | james | bobby | donna | jacoby | audrey | jacques | giant | guards |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `ACT1_TOWN` | SH | SH | SH | SH | PL | OFF | OFF | DR | DR | DR | **OFF** | TW | TW | TW | HG | OEJ 7,5 | OFF | OFF |
| `ACT2_DAY2` (`sogno_fatto`) | SH | SH | SH | SH | PL | OFF | OFF | DR | DR | DR | **DR** | TW | TW | TW | HG | OEJ | OFF | OFF |
| `ACT3_BRIDGE` (`atto3`, ¬`vagone_scoperto`) | SH | **TC 5,6** | SH | SH | PL | OFF | OFF | DR | DR | DR | DR | TW | TW | TW | HG | OEJ | OFF | OFF |
| `ACT3_TRAINCAR_REPORT` (theory ready, ¬`m5_report_close`) | **TC 9,8** | **TC 14,8** | SH | SH | PL | OFF | OFF | DR | DR | DR | DR | TW | TW | TW | HG | OEJ | OFF | OFF |
| `ACT3_NORTH_CUT` (`m5_report_close`, ¬`east_route_confirmed`) | **TC 9,8** | **TC 22,3** | SH | SH | PL | OFF | OFF | DR | DR | DR | DR | TW | TW | TW | HG | OEJ | OFF | OFF |
| **`ACT3_OEJ`** (`east_route_confirmed`, `audrey_indaga`, ¬`audrey_vista_oej`, ¬`jacques_preso`) | **TC 9,8** | **OEJ 6,8** | SH | SH | PL | OFF | OFF | DR | DR | DR | DR | TW | TW | TW | **OEJ 13,7** | OEJ 7,5 | OFF | OFF |
| `ACT3_OEJ_AUDREY_SEEN` (`audrey_vista_oej`, ¬`jacques_preso`) | **OFF (boat)** | OEJ 6,8 | SH | SH | PL | OFF | OFF | DR | DR | DR | DR | TW | TW | TW | **HG** | OEJ 7,5 | OFF | OFF |
| `ACT3_OEJ_NO_AUDREY` (¬`audrey_indaga`) | TC 9,8 | OEJ 6,8 | SH | SH | PL | OFF | OFF | DR | DR | DR | DR | TW | TW | TW | HG | OEJ 7,5 | OFF | OFF |
| `ACT3_AFTER_ARREST` (`jacques_preso`, ¬`m6_hospital_guard`) | **SH** | **OFF (escort)** | SH | SH | PL | OFF | OFF | DR | DR | DR | DR | TW | TW | TW | HG | **OFF (guarded)** | OFF | piantone HO 7,3 |
| **`ACT3_GUARDED_HOSPITAL`** (`m6_hospital_guard`, ¬`jacques_dead`) | SH | **SH** | SH | SH | PL | OFF | OFF | DR | DR | DR | DR | TW | TW | TW | HG | **OFF (guarded)** | OFF | piantone HO 7,3 |
| `ACT3_NIGHT_STATION` (`jacques_dead`, ¬`gigante1`) | SH | SH | SH | SH | PL | OFF | OFF | DR | DR | DR | DR | TW | TW | TW | HG | **TERM** | OFF (mirror) | piantone_ronette HO 3,6 |
| `ACT4_AFTERNOON` (`atto4`, ¬`promise_stance`) | SH | SH | SH | SH | PL | **DR 11,1** | **DR 10,1** | DR | DR | DR | DR | TW | TW | TW | HG | TERM | OFF | HO 3,6 |
| `ACT4_PROMISE_MADE` (`promise_stance`, ¬`T_LELAND_TAXI`) | SH | SH | SH | SH | PL | DR 11,1 | **DR 10,1** | DR | DR | DR | DR | TW | TW | TW | HG | TERM | OFF | HO 3,6 |
| `ACT4_EVENING_GATHERING` (`T_LELAND_TAXI`, ¬`presagio_status`) | **RH 4,8** | **OFF patrol** | SH | SH | PL | **OFF** | **OFF** | **RH 5,6** | **RH 3,6** | **RH 2,6** | **RH 2,4** | **RH** | **RH** | **OFF** | HG | TERM | OFF | HO 3,6 |
| **`ACT4_ROADHOUSE_PRE_PHONE`** (`presagio_status=active`, ¬`warning_target`) | RH 4,8 | OFF patrol | SH | SH | **OFF asleep** | OFF | OFF | **RH** | **RH** | **RH** | **RH** | RH | RH | OFF | HG | TERM | **RH 8,1** | HO 3,6 |
| **`ACT4_POST_PHONE_INSIDE`** (`warning_target`, ¬`focus_destination`; all three branches; `centrale` adds andy OFF) | **RH 4,8** | OFF | SH | SH / OFF | OFF | OFF | OFF | **RH** | **RH** | **RH** | **RH** | **RH** | **RH** | OFF | HG | TERM | **OFF** | HO 3,6 |
| `ACT4_ROUTE_PALMER` (`focus_destination=palmer`, ¬`body_found_by`) — Palmer map: nobody | **SH** | OFF | SH | per branch | OFF | OFF | OFF | **DR** | **OFF** | **OFF** | **OFF** | **OFF** | **OFF** | OFF | HG | TERM | OFF | HO 3,6 |
| `ACT4_ROUTE_DINER` (`focus_destination=diner`) | SH | OFF | SH | per branch | OFF | OFF | OFF | **DR (actor)** | OFF | OFF | OFF | OFF | OFF | OFF | HG | TERM | OFF | HO 3,6 |
| `ACT4_ROUTE_LAKE` (`focus_destination=lago`, ¬`maddy_trovata`) | SH | OFF (on the road) | SH | per branch | OFF | OFF | OFF | DR | OFF | OFF | OFF | OFF | OFF | OFF | HG | TERM | OFF | HO 3,6 |
| `ACT4_SHORE_HAWK` (`body_found_by=hawk`, `maddy_trovata`, ¬`m8_station`) | SH | **TW 16,27** | SH | OFF | OFF | OFF | **TERM** | DR | OFF | OFF | OFF | OFF | OFF | OFF | HG | TERM | OFF | HO 3,6 |
| `ACT4_SHORE_COOPER_AFTER` (`body_found_by=cooper`, `maddy_trovata`, ¬`m8_station`) | SH | **TW 16,27** | SH | OFF | OFF | OFF | TERM | DR | OFF | OFF | OFF | OFF | OFF | OFF | HG | TERM | OFF | HO 3,6 |
| **`ACT4_STATION_BEFORE_DAWN`** (`m8_station`, ¬`atto5`) | **SH** | TW 16,27 | SH | OFF | OFF | OFF | TERM | DR | OFF | OFF | OFF | OFF | OFF | OFF | HG | TERM | OFF | HO 3,6 |

| `ACT5_THRESHOLD` (`m9_arrivo`, `atto5`) | SH | **SH** | SH | **SH** | **PL** | **SH 8,5** | TERM | DR | **DR** | **DR** | **DR** | **TW** | **TW** | **TW** | HG | TERM | OFF | HO 3,6 |
| `ACT5_TRUMAN_OUT_INTUITIVE` (`m10_method=intuitivo`, `m10_domande`, ¬`m10_confessione`) | **OFF corridor** | SH | SH | SH | PL | SH 8,5 | TERM | DR | DR | DR | DR | TW | TW | TW | HG | TERM | OFF | HO 3,6 |
| `ACT5_LELAND_CELL` (`m10_fermo`, ¬`leland_morto`) | **SH** | SH | SH | SH | PL | **OFF cell** | TERM | DR | DR | DR | DR | TW | TW | TW | HG | TERM | OFF | HO 3,6 |
| `ACT5_LELAND_DEAD` (`leland_morto`) | SH | SH | SH | SH | PL | **TERM** | TERM | DR | DR | DR | DR | TW | TW | TW | HG | TERM | OFF | **OFF** (bob `redroom` 14,2) |

Act 5 rows (pass 01) verified against §5 C6/C8/C9/C12–C15 return columns: `atto5` returns hawk, andy, sarah, jacoby and the town to their baselines; `leland_morto` removes piantone_ronette and places bob in the redroom.

"per branch" (Andy) = OFF on `centrale`; SH on `palmer`/`nessuno` until `maddy_trovata`. Ronette, nurse, Gerard, Ben Horne: baseline everywhere. Laura/mfap `redroom`; Bob OFF.

## 5. Cast change records (V6)

| # | character | BEFORE | EVENT / CAUSE | AFTER | RETURN / NEXT |
|---|---|---|---|---|---|
| C1 | james | OFF | `sogno_fatto` (T22→T24) | DR | — |
| C2 | hawk | SH | `atto3`: Hawk leads Cooper to the footbridge (T26) | TC 5,6 | `vagone_scoperto` → door ("La soglia la tengo io") → `m5_report_close` ("Vieni") → cut → `east_route_confirmed` ("Hawk viene fino alla riva") → OEJ dock |
| C2b | hawk | TC 22,3 | `east_route_confirmed`: he goes ahead to the bank and crosses; waits at the landing ("Io resto qui", B1) | OEJ 6,8 | `jacques_preso` → OFF escort (signs Jacques in, T31) → `m6_hospital_guard` → SH ("Hawk scrive", T32) |
| C3 | truman | SH | theory ready: comes to receive the report (T28) | TC 9,8 | stays with the ring and the file (`m5_report_close`); `audrey_vista_oej` → OFF (the eight o'clock boat, T42); `jacques_preso` → SH (`m6_return_night_early`: "Voglio che tu veda dove l'ho messo") |
| C4 | audrey | HG | `audrey_indaga`: OEJ alone (T30) | OEJ 13,7 | `audrey_vista_oej` ("esce entro dieci minuti") / `jacques_preso` → HG (the boat, T42) |
| C5 | jacques | OEJ 7,5 | `jacques_preso`: arrest, broken leg (T30) | OFF (guarded room, alive; T31) | `jacques_dead` (T33–T34) → TERM |
| C6 | piantone | OFF | `jacques_preso` (T31) | HO 7,3 | `jacques_dead` → OFF; piantone_ronette HO 3,6 → `leland_morto` → OFF |
| C7 | maddy | OFF | `atto4` (T50) | DR 10,1 | `T_LELAND_TAXI` ("Maddy saluta ed esce") → OFF (T51) → `maddy_trovata` → TERM |
| C8 | leland | OFF | `atto4` (T50) | DR 11,1 | `T_LELAND_TAXI` ("posa il conto") → OFF HIDDEN → `atto5` → SH → `leland_morto` → TERM |
| C9 | hawk | SH | `T_LELAND_TAXI`: on the road for the night (D6) | OFF patrol | `body_found_by` (T7) → TW 16,27 → `atto5` → SH |
| C10 | truman, bobby, donna | baselines | `T_LELAND_TAXI`: the town gathers (T52) | RH | `focus_destination` ("Il Roadhouse ha chiuso") → truman SH, bobby/donna OFF home → `atto5` |
| C10b | norma, shelly, loglady, james | DR | `T_LELAND_TAXI`: the Double R closes for the Roadhouse evening, authored on screen by `m8.b0.leland_taxi.chiusura.p01` (sign turned, lights off, chairs up, coats down) in the same node that commits the state | RH | `focus_destination` → norma DR, others OFF home → `atto5` |
| C11 | giant | OFF | `presagio_status=active` (T52) | RH 8,1 | `warning_target` (p05) → OFF |
| C12 | andy | SH | `sarah_support_state=vice` (T4′) | OFF (Palmer) | `atto5` → SH |
| C13 | andy | SH | `sarah_support_state=none ∧ maddy_trovata` (T7′) | OFF (Palmer) | `atto5` → SH |
| C14 | sarah | PL | `presagio_status=active`: asleep | OFF | `atto5` → PL |
| C15 | jacoby | TW | `T_LELAND_TAXI`: home | OFF | `atto5` → TW |

| C16 | leland | OFF HIDDEN | `atto5`: Truman accepts P6 and calls him in; he walks in alone (M9-B2/B3) | SH 8,5 | `m10_fermo` → OFF cell |
| C17 | truman | SH | `m10_method=intuitivo` ∧ `m10_domande`: pen down, leaves the room (authored m10.b3.intuitivo.p09) | OFF corridor | `m10_confessione` → SH (m10.b6.intuitivo.p07) |
| C18 | truman | OFF corridor | `m10_confessione` (intuitivo): back to the facts | SH | — |
| C19 | leland | SH 8,5 | `m10_fermo`: fermo per i fatti ammessi, Truman opens the cell (authored m10.b9.fermo.p03) | OFF cell | `leland_morto` → TERM |
| C20 | leland | OFF cell | `leland_morto` (M10-B10) | TERM | never |

Change record 2026-09-15 (Act 5 pass 01): `ACT5_LELAND_STATION` placeholder replaced by the M10 window pair (station → cell), `ACT5_TRUMAN_OUT_INTUITIVE` added; fixtures `cast-pins-acts-1-4.json` (+4 seeds/pins) and `cast-transitions-acts-1-4.json` (+C16–C20) updated in the same change; V1–V8 green.

## 6. Per-character exclusion (V2 proves over reachable states)

- **hawk**: BRIDGE (`atto3 ∧ ¬vagone_scoperto`), DOOR (`vagone_scoperto ∧ ¬m5_report_close`), CUT (`m5_report_close ∧ ¬east_route_confirmed`), OEJ_DOCK (`east_route_confirmed ∧ ¬jacques_preso`), ESCORT (`jacques_preso ∧ ¬m6_hospital_guard`) — a chain of adjacent half-open intervals over the Act 3 order; PATROL/SHORE inside `T_LELAND_TAXI` are complements; `T_LELAND_TAXI ⇒ m6_hospital_guard` separates Act 3 from Act 4. Between `m6_hospital_guard` and `T_LELAND_TAXI`: baseline SH.
- **truman**: REPORT (`theory ∧ ¬jacques_preso ∧ ¬audrey_vista_oej`), BOAT (`audrey_vista_oej ∧ ¬jacques_preso`), GATHERING (`T_LELAND_TAXI ∧ ¬focus_destination`): pairwise exclusive (`T_LELAND_TAXI ⇒ jacques_preso`).
- **jacques**: AT_OEJ (`¬jacques_preso`), GUARDED (`jacques_preso ∧ ¬jacques_dead`), DEAD (`jacques_dead`): a partition of all states — V3 satisfied without relying on the baseline.
- **maddy**: DINER (`atto4 ∧ ¬T_LELAND_TAXI`) / HOME (`T_LELAND_TAXI ∧ ¬maddy_trovata`) / GONE (`maddy_trovata`) partition `atto4`. **leland**: DINER / HIDDEN / STATION / DEAD partition `atto4`.
- **norma**: GATHERING only. **shelly, loglady, bobby, donna**: GATHERING (`¬focus_destination`) vs HOME_NIGHT (`focus_destination`). **james**: + NOT_YET.
- **andy**: VICE vs LATE exclusive by value. **sarah, jacoby, giant, audrey, piantone ×2**: single windows.

## 7. Engine today vs truth — what the migration deletes or corrects

| fact today | truth | migration action |
|---|---|---|
| classic `truman`, `hawk`, `lucy`, `andy` at `sheriff` (no cond) | baselines | registry baselines; classic entries deleted (V7) |
| adapter roadhouse crowd `atto4 ∧ ¬warning_target` | GATHERING: entry `T_LELAND_TAXI` (closing beat authored), exit `focus_destination` | replace; adapter bodies deleted |
| adapter `maddy` diner `atto4 ∧ ¬promise_stance` | exit `T_LELAND_TAXI` (her exit caption) | window |
| adapter `truman` traincar `m5_final_theory ∧ ¬east_route_confirmed` | REPORT exits at `jacques_preso` / `audrey_vista_oej` | window |
| no Hawk body at OEJ; `hawk_cut` never exits | OEJ_DOCK, ESCORT; CUT exits at `east_route_confirmed` | windows |
| Jacques absent from `jacques_preso` (implicit) | GUARDED `OFFSCREEN` then TERMINAL at `jacques_dead` | windows |
| classic diner four no cond; `!flag:gigante2` ×4 | gathering + night windows | delete conds; `gigante2` no longer a world switch |
| `hawk_shore_*` end at `m8_station` | SHORE until `atto5` | window |
| classic `leland` only Act 5 | Acts 1–4 per §3 | registry |
| `piantone_ronette` permanent | until `leland_morto` | window exit |

## 8. Lead blockers and accepted residuals

**B1 — CLOSED (2026-09-11, lead decision, option B).** Norma, Shelly, the Log Lady and James leave the Double R at `T_LELAND_TAXI` because the node that commits it, `m8_leland_taxi`, now ends with an authored closing beat: `m8.b0.leland_taxi.chiusura.p01` (mode `action`, unconditional, placed after the last dialogue page and before the notebook page `m8.b0.leland_taxi.p02`): "(Norma gira il cartello sulla porta e spegne l'insegna. Sedie sui tavoli, cappotti dagli attaccapanni: il Double R chiude alle sei, stasera si va al Roadhouse.)". Sequence: Maddy leaves (p00) → Leland pays and states the taxi (p01/p02) → the Double R closes early for the Roadhouse evening (closing beat) → `T_LELAND_TAXI` commits → the four resolve to `ACT4_EVENING_GATHERING`. The state change and its visible cause are one narrative transaction; no new flag, value, evidence or proposition; player map position is not Cast Continuity state. Rejected: (a) a derived arrival state; (c) the vanish. The page is not yet in `narrative/missions/M8.json`: the Cast Presence implementation pass adds it (spec: `docs/cast-continuity-b1-resolution.md`), and V6b fails until it exists.

**R1 (accepted residual)** — Audrey's OEJ window ends at `jacques_preso` if Cooper never speaks to her: she leaves at the arrest, while Cooper is on the OEJ map, with T42 (the eight o'clock boat) as the offscreen cause. The arrest ends the visit (Jacques: "Ricordatevelo quando lo riattraversate"); accepted.

**R2 (accepted residual)** — the Giant leaves the stage at `warning_target` while Cooper is in the room: authored by p05 and by the brief (narrow supernatural window).

## 9. What this file does not decide

Coordinates and facing per placement (the OEJ landing tile 6,8 is a proposal on row 8 next to the spawn); the `dialogue: null` policy for crowd bodies; Act 5 windows.
