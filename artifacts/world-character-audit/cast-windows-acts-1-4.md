# Cast Continuity — canonical windows, baselines and pins for Acts 1–4 (migration truth)

Date: 2026-09-11. Companion of `docs/cast-continuity-contract-v0.1.md`. **Not implemented.** This file is what the implementation pass compiles into the registry and what V5/V6 pin.

Authority order: `docs/story/timeline.md`, `docs/story/truth.md`, `docs/story/characters/*.md` > frozen act designs (`artifacts/act-3-design/`, `artifacts/act-4-design/`, `docs/act-*-design-report.md`) > mission JSON (window boundaries and node placement) > sprite lists (`js/glue.js` `NPCS`, adapter `NARRATIVE_ENTITIES`), reported only as "engine today" and never used as truth where they conflict. Inventories: scratchpad `windows-acts-1-3.md`, `windows-act-4.md` (cheap agents, 2026-09-11); Act 4 branch values from `narrative/missions/M8.json`.

Status labels: **LOCKED** (a story-truth or frozen-design source states it), **DERIVED** (follows from a locked statement by necessity: e.g. "must stay HIDDEN" ⇒ `OFFSCREEN`), **PROPOSED** (baseline taken from today's classic placement because no source moves the character; harmless to adopt, listed for the lead to confirm), **DECISION** (sources are silent or diverge on something that changes what the player sees; the lead must close it before step 3 of the plan). Nothing labelled DECISION is defaulted anywhere in this file.

Placement coordinates are today's entity/NPC coordinates, kept as data; they are not truth and may be re-staged by the environment pass.

## 1. Boundary events (story state that opens or closes windows)

| event | state | set by |
|---|---|---|
| dream done | `flag sogno_fatto` | classic `laura_sogno` (`js/data.js:591`) |
| Act 3 opens | `flag atto3` | classic `truman_atto3` (`js/data.js:614`) |
| footbridge reached | `node_done m5_bridge` (fires on map entry, no conditions) | `M5.json` |
| car discovered | `flag vagone_scoperto` | M5 |
| theory ready | `value_set m5_final_theory` ∧ `P3A.formulation.status=formulated` | M5 `m5_theory_first` / `m5_theory_revision` |
| custody decided | `value_set s1` | M5 `m5_s1` |
| north cut confirmed | `flag east_route_confirmed` | M5 `m5_tracks_north` |
| Audrey investigates / seen at OEJ | `flag audrey_indaga` (`js/data.js:442,449`) / `flag audrey_vista_oej` (`M6.json:349`) | classic / M6 |
| Jacques arrested | `flag jacques_preso` (`M6.json:1217`) | M6 |
| Jacques dead | `flag jacques_dead` (`M6.json:1492`); classic mirror `jacques_morto` | M6 / sync |
| Giant, first statement | `flag gigante1` (`js/data.js:689`, `specchio315`) | classic |
| Act 4 opens | `flag atto4` (`M6.json:1617`, `m6_atto4_bridge`) | M6 |
| promise made | `value_set promise_stance` ∈ {accompagno, autonomia, prudenza} | M8 `m8_diner` |
| Leland's taxi claim | `evidence T_LELAND_TAXI` | M8 `m8_leland_taxi` |
| the statement | `value_is presagio_status=active`; classic `gigante2` derived from `nodes_done.m8_roadhouse_truman` | M8 `m8_roadhouse_truman` |
| the phone | `value_set warning_target` ∈ {palmer, centrale, nessuno}; writes `sarah_support_state` ∈ {none, vice, none}, `maddy_action_after_warning` | M8 `m8_roadhouse_phone` |
| the walk | `value_set focus_destination` ∈ {palmer, lago, diner} | M8 `m8_focus_choice` |
| the shore | `value_set body_found_by` ∈ {hawk, cooper} (routes); `flag maddy_trovata`, `presagio_status=verified` | M8 routes / `m8_discovery` |
| station before dawn | `node_done m8_station` | M8 |
| Act 5 opens | `flag atto5` (`M9.json:447`) | M9 |
| Leland dead | `flag leland_morto` | Act 5 classic |

Reachability facts the exclusion proofs rely on: `atto3 ⇒ sogno_fatto`; `east_route_confirmed ⇒ s1 ⇒ m5_final_theory`; `jacques_preso ⇒ east_route_confirmed`; `jacques_dead ⇒ jacques_preso`; `atto4 ⇒ gigante1 ⇒ jacques_dead`; `promise_stance ⇒ atto4`; `T_LELAND_TAXI ⇒ promise_stance`; `presagio_status ⇒ T_LELAND_TAXI`; `warning_target ⇒ presagio_status=active`; `focus_destination ⇒ warning_target`; `body_found_by ⇒ focus_destination`; `maddy_trovata ⇒ body_found_by`; `m8_station ⇒ maddy_trovata`; `atto5 ⇒ m8_station`. (All from node conditions; V-suite must assert them on the enumerated state set.)

## 2. Baselines (one per registry character)

| character | class | baseline | status | note |
|---|---|---|---|---|
| truman | PERSISTENT | `sheriff` 10,4 | LOCKED (T20, T25, T32, T36, T55) | |
| hawk | PERSISTENT | `sheriff` 12,8 | PROPOSED | no source places him before the bridge; the station is where every source finds him when not out |
| lucy | PERSISTENT | `sheriff` 2,6 | LOCKED (T32, T34; M8 Lucy pages) | never moves in Acts 1–4 |
| andy | PERSISTENT | `sheriff` 10,7 | LOCKED by implication (scene-contracts S3 "he has Andy at the station") | |
| sarah | PERSISTENT | `palmer` 9,7 | LOCKED (Act 1 witness; Act 4 "dorme", never at the shore) | see D1 for the night rendering |
| leland | PERSISTENT | `OFFSCREEN` ("composed public mourning, in the house/town, unseen") | DECISION D9 | T40 says visible-composed; no scene ever stages him in Acts 1–3 |
| maddy | STORY-BOUND | `OFFSCREEN` (not in town) | LOCKED (arrives Act 4) | |
| norma | PERSISTENT | `diner` 5,2 | LOCKED for Act 4 afternoon (env-requirements "Norma at the counter"); PROPOSED elsewhere | |
| shelly | PERSISTENT | `diner` 9,7 | PROPOSED | |
| loglady | PERSISTENT | `diner` 4,5 | PROPOSED | |
| james | PERSISTENT | `OFFSCREEN` until `sogno_fatto`, then `diner` 9,6 → modelled as baseline `diner` + window JAMES_NOT_YET (below) | LOCKED (Act 2 arrival: characters/james.md; classic cond) | |
| bobby | PERSISTENT | `town` 31,16 wander | PROPOSED | |
| donna | PERSISTENT | `town` 44,10 wander | PROPOSED; see D10 | characters/donna.md "Act 2 (with James)" describes function, not absence |
| jacoby | PERSISTENT | `town` 16,25 | PROPOSED; see D4 | |
| audrey | PERSISTENT | `hotel_gn` 12,9 wander | PROPOSED; see D10 | |
| benhorne | PERSISTENT | `hotel_gn` 5,7 | PROPOSED | |
| gerard | PERSISTENT | `hospital` 11,4 | PROPOSED | |
| ronette | PERSISTENT | `hospital` 3,5 (bed; scene special draw stays) | LOCKED (T11 hospitalised) | |
| infermiera | PERSISTENT | `hospital` 11,8 | LOCKED (T23) | |
| jacques | STORY-BOUND | `oej` 7,5 until arrest; then `TERMINAL_REMOVED` → modelled as baseline `TERMINAL_REMOVED` + window JACQUES_AT_OEJ | LOCKED (T30, T33 hidden, T34 dead) | |
| giant (gigante) | STORY-BOUND | `OFFSCREEN` | LOCKED | Room 315 appearance is the mirror interact (object-mediated), not a body; Roadhouse appearance is a window |
| laura | STORY-BOUND | `redroom` 6,5 (dream/finale map only) | LOCKED (T22, T58) | the Red Room map is reachable only inside scripted sequences; no cross-map identity issue |
| mfap | STORY-BOUND | `redroom` | PROPOSED | no story sheet |
| bob | STORY-BOUND | `OFFSCREEN` until `leland_morto`, then `redroom` → baseline `OFFSCREEN` + window BOB_LODGE (Act 5, out of scope here) | LOCKED (force, no body in Acts 1–4) | |
| piantone / piantone_ronette | STORY-BOUND (scenography, `andy` sprite) | `OFFSCREEN` | LOCKED (M6 comment "SCENOGRAFIA") | windows below; `piantone_ronette` needs an end (D11) |
| cooper | player | exempt | | |

## 3. Windows (the authoring source)

Predicates use the mission `when` grammar. `¬` = `not`. Each window names only the characters that differ from baseline/previous window. Exclusion argument per character in §6.

### Acts 1–2

| WINDOW ID | ENTRY | EXIT / transition | CAST CHANGES (cause) | status |
|---|---|---|---|---|
| `JAMES_NOT_YET` | game start | `flag sogno_fatto` (the dream: Cooper is ready to hear him) | james → `OFFSCREEN` ("not yet met") | LOCKED (characters/james.md; classic cond) |
| `LAURA_DREAM` | scripted Red Room entry (classic) | `sogno_fatto` | laura, mfap → `redroom` (the dream) | LOCKED (T22); rendered by the scripted map, registry baseline suffices |

No other named character moves in Acts 1–2 per any source. Act 2's hospital ward (Ronette, nurse, Gerard) and Great Northern (Audrey, Ben Horne) are baselines. D9/D10 decide whether Leland, Donna, Audrey get Act 1 windows.

### Act 3

| WINDOW ID | ENTRY | EXIT / transition | CAST CHANGES (cause) | status |
|---|---|---|---|---|
| `ACT3_HAWK_BRIDGE` | `flag atto3` ∧ `¬flag vagone_scoperto` | `vagone_scoperto` (the car is found) | hawk → `traincar` 5,6 "bridge, east bank" (T26: partner on the prints) | LOCKED (T26–T27); entry today gated on `node_done m5_bridge`, which fires on map entry — equivalent |
| `ACT3_HAWK_DOOR` | `flag vagone_scoperto` ∧ `¬value_set s1` | `s1` (custody decided) | hawk → `traincar` 14,8 "outside the door" (T27: Hawk outside) | LOCKED |
| `ACT3_HAWK_CUT` | `value_set s1` ∧ `¬flag east_route_confirmed` | `east_route_confirmed` (T29) | hawk → `traincar` 22,3 "north cut" | LOCKED (T29). **Engine today has no exit**: `hawk_cut` is `value_set s1` forever (adapter:221) — a body on the traincar map through Act 4 |
| `ACT3_TRUMAN_REPORT` | `value_set m5_final_theory` ∧ `P3A.formulation.status=formulated` ∧ `¬flag east_route_confirmed` | `east_route_confirmed` (Truman leaves after signing; T28→T29) | truman → `traincar` 9,8 (T28: comes to receive the report) | LOCKED (T28). Note: entity today uses `value_set m5_final_theory` only; the P3A clause matches `m5_report_intro` |
| `ACT3_JACQUES_AT_OEJ` | game start | `flag jacques_preso` (arrest, T30) | jacques → `oej` 7,5 (dealer at the table) | LOCKED (T3, T7, T30); after exit baseline `TERMINAL_REMOVED` (T33 hidden, T34 dead) |
| `ACT3_AUDREY_AT_OEJ` | `flag audrey_indaga` ∧ `¬flag audrey_vista_oej` ∧ `¬flag jacques_preso` | `audrey_vista_oej` (seen) or `jacques_preso` (the boat home with Truman, T42) | audrey → `oej` 13,7 (investigates alone) | LOCKED (T30, T42) |
| `ACT3_GUARD_JACQUES` | `flag jacques_preso` ∧ `¬flag jacques_dead` | `jacques_dead` | piantone → `hospital` 7,3 (T31 "Piantonato") | LOCKED (T31) |
| `ACT3_GUARD_RONETTE` | `flag jacques_dead` | **none today** → D11 | piantone_ronette → `hospital` 3,6 (surveillance moves to Ronette) | LOCKED entry; exit DECISION |
| `ACT3_GIANT_ROOM315` | — | — | no body: the mirror interact (`specchio315`, `jacques_morto` → `gigante1_dlg`) carries the appearance | LOCKED (T35) as object-mediated; no window |

Truman's boat trip with Audrey (T42) is narrated at the night report and never staged; no window (Truman stays baseline, the report node is at the station).

### Act 4

| WINDOW ID | ENTRY | EXIT / transition | CAST CHANGES (cause) | status |
|---|---|---|---|---|
| `ACT4_MADDY_DINER` | `flag atto4` ∧ `¬value_set promise_stance` | `promise_stance` (Maddy leaves: "Maddy saluta ed esce") | maddy → `diner` 10,1 (T50: the coach decision) | LOCKED (T50) |
| `ACT4_LELAND_DINER` | `flag atto4` ∧ `¬evidence T_LELAND_TAXI` | `T_LELAND_TAXI` (he pays and leaves, T0.5) | leland → `diner` 11,1 (waits beside Maddy) | LOCKED (T50, offscreen-timeline T0.5) |
| `ACT4_MADDY_HOME` | `value_set promise_stance` ∧ `¬flag maddy_trovata` | `maddy_trovata` | maddy → `OFFSCREEN` ("home; then the house with Leland inside" T51–T53: must stay HIDDEN) | DERIVED (truth.md "the house is never the body's scene") |
| `ACT4_MADDY_GONE` | `flag maddy_trovata` | never | maddy → `TERMINAL_REMOVED` (T54: the body is a form on the shore, never a figure) | LOCKED (Bible §8 Maddy) |
| `ACT4_LELAND_HIDDEN` | `evidence T_LELAND_TAXI` ∧ `¬flag atto5` | `atto5` (M9 calls him in) | leland → `OFFSCREEN` ("già dentro la casa", T2/T51; must stay HIDDEN) | DERIVED. Baseline is already `OFFSCREEN` (D9), so this window is a *record*, not a change — keep it for V6 causality |
| `ACT4_HAWK_PATROL` | `flag atto4` ∧ `¬value_set body_found_by` | `body_found_by` (the anonymous call sends him to the shore, T7) | hawk → `OFFSCREEN` ("di pattuglia": Lucy `centrale` feedback; draft §4.6; T3 "Hawk on patrol, absent") | LOCKED from `presagio_status=active`; **entry at `atto4` is D6** |
| `ACT4_TOWN_AT_ROADHOUSE` | `evidence T_LELAND_TAXI` ∧ `¬value_set warning_target` | `warning_target` (the phone; "Il Roadhouse ha chiuso") | truman → `roadhouse` 4,8 (waits for Cooper: S3 actor node); norma 5,6, shelly 3,6, bobby 3,4, donna 5,4, james 2,4, loglady 2,6 → `roadhouse` (T52 "Il paese c'è tutto"; Lucy p01 "Norma chiude alle sei per andarci") | LOCKED for the pre-phone moment (S3); **entry time is D7** (design fixes the room only when Cooper arrives; engine today starts at `atto4`) |
| `ACT4_GIANT_STAGE` | `value_is presagio_status=active` ∧ `¬value_set warning_target` | `warning_target` | giant → `roadhouse` 8,1 (the statement, T52; `m8_giant_stage`) | LOCKED |
| `ACT4_ANDY_TO_PALMER_VICE` | `value_is sarah_support_state=vice` ∧ `¬node_done m8_station` | `m8_station` (merges into ANDY_WITH_SARAH) | andy → `palmer` (Lucy: "Mando Andy a casa Palmer… dieci minuti", T4′) | LOCKED (M8.json:588, :1492) |
| `ACT4_ANDY_WITH_SARAH` | `node_done m8_station` ∧ `¬flag atto5` | `atto5` (M9 opens; Act 5 design decides) | andy → `palmer` (Truman: "Adesso Andy resta con lei" / "era già con Sarah") | LOCKED (M8.json:1488-1502). **Andy on `none` branches between `warning_target` and `m8_station` is D2** |
| `ACT4_HAWK_SHORE` | `value_set body_found_by` ∧ `¬node_done m8_station` | `m8_station` → D5 | hawk → `town` 16,27 (T7: dispatched by the anonymous call; `hawk` branch: already there with the perimeter; `cooper` branch: arrives with the torches after `maddy_trovata`) | LOCKED (T54). On the `cooper` branch before `maddy_trovata`, Hawk is still on the road: sub-window `ACT4_HAWK_SHORE` must be split: `body_found_by=hawk ∧ ¬m8_station` → shore; `body_found_by=cooper ∧ maddy_trovata ∧ ¬m8_station` → shore; `body_found_by=cooper ∧ ¬maddy_trovata` stays in `ACT4_HAWK_PATROL` (adjust its exit accordingly — see §6) |
| `ACT4_SARAH_NIGHT` | `value_is presagio_status=active` ∧ `¬flag atto5` | `atto5` | sarah → **D1**: `palmer` (asleep, no interaction) or `OFFSCREEN` ("house dark") | DECISION D1; both branches are at the Palmer house per truth (M8 invariant "dorme"; "does not find the body") |
| `ACT4_JACOBY_NIGHT` | — | — | **D4** (no source mentions Jacoby in Act 4; engine hides him forever from `gigante2`) | DECISION D4 |

Norma after the phone: `ACT4_TOWN_AT_ROADHOUSE` exits at `warning_target`, so Norma resolves to baseline `diner` — exactly where `m8_route_diner` (actor `norma`) needs her ("Poi è tornata dai Palmer"). No second window needed: this is the return-by-exit the contract requires.

## 4. Pin tables (V5 — whole relevant cast per story moment)

Seeds are reachable states from the flow harnesses. Values not listed = baseline. `?Dn` = pending decision.

| moment (seed) | truman | hawk | lucy | andy | sarah | leland | maddy | norma | shelly | loglady | james | bobby | donna | jacoby | audrey | jacques | giant |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `ACT1_TOWN` (start) | sheriff | sheriff | sheriff | sheriff | palmer | OFFSCREEN ?D9 | OFFSCREEN | diner | diner | diner | **OFFSCREEN** | town | town ?D10 | town | hotel_gn ?D10 | oej | OFFSCREEN |
| `ACT2_DAY2` (`sogno_fatto`) | sheriff | sheriff | sheriff | sheriff | palmer | OFFSCREEN ?D9 | OFFSCREEN | diner | diner | diner | diner | town | town | town | hotel_gn | oej | OFFSCREEN |
| `ACT3_BRIDGE` (`atto3`, ¬`vagone_scoperto`) | sheriff | **traincar 5,6** | sheriff | sheriff | palmer | OFFSCREEN | OFFSCREEN | diner | diner | diner | diner | town | town | town | hotel_gn | oej | OFFSCREEN |
| `ACT3_TRAINCAR_REPORT` (`m5_final_theory`, P3A formulated, `s1` unset) | **traincar 9,8** | **traincar 14,8** | sheriff | sheriff | palmer | OFFSCREEN | OFFSCREEN | diner | diner | diner | diner | town | town | town | hotel_gn | oej | OFFSCREEN |
| `ACT3_NORTH_CUT` (`s1`, ¬`east_route_confirmed`) | traincar 9,8 | **traincar 22,3** | sheriff | sheriff | palmer | OFFSCREEN | OFFSCREEN | … | … | … | … | … | … | … | hotel_gn | oej | OFFSCREEN |
| `ACT3_OEJ` (`east_route_confirmed`, `audrey_indaga`, ¬`audrey_vista_oej`, ¬`jacques_preso`) | **sheriff** | **sheriff** | sheriff | sheriff | palmer | OFFSCREEN | OFFSCREEN | diner | diner | diner | diner | town | town | town | **oej 13,7** | oej 7,5 | OFFSCREEN |
| `ACT3_OEJ_NO_AUDREY` (same, ¬`audrey_indaga`) | sheriff | sheriff | sheriff | sheriff | palmer | OFFSCREEN | OFFSCREEN | … | … | … | … | … | … | … | **hotel_gn** | oej 7,5 | OFFSCREEN |
| `ACT3_GUARDED_HOSPITAL` (`jacques_preso`, ¬`jacques_dead`) + piantone=hospital 7,3 | sheriff | sheriff | sheriff | sheriff | palmer | OFFSCREEN | OFFSCREEN | … | … | … | … | … | … | … | hotel_gn | **TERMINAL_REMOVED** | OFFSCREEN |
| `ACT3_NIGHT_STATION` (`jacques_dead`, ¬`gigante1`) + piantone_ronette=hospital 3,6 | sheriff | sheriff | sheriff | sheriff | palmer | OFFSCREEN | OFFSCREEN | … | … | … | … | … | … | … | hotel_gn | TERMINAL_REMOVED | OFFSCREEN (mirror only) |
| `ACT4_AFTERNOON` (`atto4`, ¬`promise_stance`) | sheriff | sheriff ?D6 | sheriff | sheriff | palmer | **diner 11,1** | **diner 10,1** | diner | diner | diner | diner | town | town | town | hotel_gn | TERMINAL_REMOVED | OFFSCREEN |
| `ACT4_PROMISE_MADE` (`promise_stance`, ¬`T_LELAND_TAXI`) | sheriff | sheriff ?D6 | sheriff | sheriff | palmer | diner 11,1 | **OFFSCREEN** | diner | diner | diner | diner | town | town | town | hotel_gn | TERMINAL_REMOVED | OFFSCREEN |
| `ACT4_EVENING_GATHERING` (`T_LELAND_TAXI`, ¬`presagio_status`) ?D7 | roadhouse 4,8 | OFFSCREEN ?D6 | sheriff | sheriff | palmer | **OFFSCREEN** | OFFSCREEN | roadhouse | roadhouse | roadhouse | roadhouse | roadhouse | roadhouse | town ?D4 | hotel_gn | TERMINAL_REMOVED | OFFSCREEN |
| **`ACT4_ROADHOUSE_PRE_PHONE`** (`presagio_status=active`, ¬`warning_target`) | **roadhouse 4,8** | **OFFSCREEN (patrol)** | sheriff | sheriff | palmer ?D1 | OFFSCREEN | OFFSCREEN | **roadhouse** | **roadhouse** | **roadhouse** | **roadhouse** | **roadhouse** | **roadhouse** | ?D4 | hotel_gn | TERMINAL_REMOVED | **roadhouse 8,1** |
| `ACT4_POST_PHONE_PALMER` (`warning_target=palmer`, ¬`focus_destination`) | sheriff | OFFSCREEN | sheriff | sheriff ?D2 | palmer ?D1 | OFFSCREEN | OFFSCREEN | diner | diner | diner | diner | town | town | ?D4 | hotel_gn | TERMINAL_REMOVED | OFFSCREEN |
| `ACT4_POST_PHONE_CENTRALE` (`warning_target=centrale`) | sheriff | OFFSCREEN | sheriff | **palmer** | palmer ?D1 | OFFSCREEN | OFFSCREEN | diner | diner | diner | diner | town | town | ?D4 | hotel_gn | TERMINAL_REMOVED | OFFSCREEN |
| `ACT4_POST_PHONE_NESSUNO` (`warning_target=nessuno`) | sheriff | OFFSCREEN | sheriff | sheriff ?D2 | palmer ?D1 | OFFSCREEN | OFFSCREEN | diner | diner | diner | diner | town | town | ?D4 | hotel_gn | TERMINAL_REMOVED | OFFSCREEN |
| `ACT4_ROUTE_DINER` (`focus_destination=diner`, ¬`body_found_by`) | sheriff | OFFSCREEN | sheriff | per branch | palmer ?D1 | OFFSCREEN | OFFSCREEN | **diner** (actor node) | diner | diner | diner | town | town | ?D4 | hotel_gn | TERMINAL_REMOVED | OFFSCREEN |
| `ACT4_SHORE_HAWK` (`body_found_by=hawk`, `maddy_trovata`, ¬`m8_station`) | sheriff | **town 16,27** | sheriff | per branch | palmer ?D1 | OFFSCREEN | **TERMINAL_REMOVED** | diner | diner | diner | diner | town | town | ?D4 | hotel_gn | TERMINAL_REMOVED | OFFSCREEN |
| `ACT4_SHORE_COOPER_FIRST` (`body_found_by=cooper`, ¬`maddy_trovata`) | sheriff | **OFFSCREEN (on the road)** | sheriff | per branch | palmer ?D1 | OFFSCREEN | OFFSCREEN | … | … | … | … | … | … | ?D4 | hotel_gn | TERMINAL_REMOVED | OFFSCREEN |
| `ACT4_SHORE_COOPER_AFTER` (`body_found_by=cooper`, `maddy_trovata`, ¬`m8_station`) | sheriff | **town 16,27** (torches) | sheriff | per branch | palmer ?D1 | OFFSCREEN | TERMINAL_REMOVED | … | … | … | … | … | … | ?D4 | hotel_gn | TERMINAL_REMOVED | OFFSCREEN |
| **`ACT4_STATION_BEFORE_DAWN`** (`m8_station`, ¬`atto5`) | **sheriff** | ?D5 | sheriff | **palmer** | palmer ?D1 | OFFSCREEN | TERMINAL_REMOVED | diner | diner | diner | diner | town | town | ?D4 | hotel_gn | TERMINAL_REMOVED | OFFSCREEN |

Ronette, nurse, Gerard, Ben Horne: baseline in every row. Laura/mfap: `redroom` baseline (map unreachable outside scripts). Bob: `OFFSCREEN` in every row.

## 5. Cast change records (V6)

| # | character | CAST BEFORE | EVENT / CAUSE | CAST CHANGE | CAST AFTER | RETURN / NEXT |
|---|---|---|---|---|---|---|
| C1 | james | OFFSCREEN (not met) | `sogno_fatto`: the dream makes Cooper ready for the heart's other half (T22→T24) | → diner | diner (baseline) | none (baseline) |
| C2 | hawk | sheriff | `atto3`: the east road opens, Hawk leads Cooper to the footbridge (T26) | → traincar bridge | traincar 5,6 | `vagone_scoperto` → door 14,8 → `s1` → cut 22,3 → `east_route_confirmed` → sheriff |
| C3 | truman | sheriff | theory ready: Truman comes to receive the report (T28) | → traincar 9,8 | traincar | `east_route_confirmed` → sheriff |
| C4 | audrey | hotel_gn | `audrey_indaga`: she goes to OEJ alone (T30) | → oej | oej 13,7 | `audrey_vista_oej` or `jacques_preso` (the eight o'clock boat with Truman, T42) → hotel_gn |
| C5 | jacques | oej | `jacques_preso`: arrest, broken leg, guarded room (T30–T31); T33 smothered, hidden | → TERMINAL_REMOVED | — | never |
| C6 | piantone | OFFSCREEN | `jacques_preso`: "Piantonato" (T31) | → hospital 7,3 | hospital | `jacques_dead` → OFFSCREEN; piantone_ronette → hospital 3,6 (D11 for its end) |
| C7 | maddy | OFFSCREEN (not in town) | `atto4`: Act 4 afternoon, the coach decision (T50) | → diner 10,1 | diner | `promise_stance` → OFFSCREEN (home, T51) → `maddy_trovata` → TERMINAL_REMOVED (T54) |
| C8 | leland | OFFSCREEN (D9) | `atto4`: waits beside Maddy at the counter (T50) | → diner 11,1 | diner | `T_LELAND_TAXI` → OFFSCREEN ("già dentro la casa", T51) → `atto5` → sheriff (M9) |
| C9 | hawk | sheriff | `atto4` (D6) / `presagio_status=active`: sent on patrol (Lucy "è di pattuglia"; draft §4.6) | → OFFSCREEN patrol | OFFSCREEN | `body_found_by` (anonymous call, T7) → town 16,27 (`hawk` branch immediately; `cooper` branch at `maddy_trovata`) → `m8_station` → D5 |
| C10 | truman, norma, shelly, loglady, james, bobby, donna | baselines | `T_LELAND_TAXI` (D7): the town gathers at the Roadhouse for the night (T52; Lucy p01 "Norma chiude alle sei per andarci") | → roadhouse | roadhouse | `warning_target` ("Il Roadhouse ha chiuso") → baselines (Norma at the diner for `m8_route_diner`) |
| C11 | giant | OFFSCREEN | `presagio_status=active`: the statement (T52) | → roadhouse stage 8,1 | roadhouse | `warning_target` → OFFSCREEN |
| C12 | andy | sheriff | `warning_target=centrale`: Lucy dispatches him (T4′) | → palmer | palmer | stays: `m8_station` "era già con Sarah" → `atto5` (Act 5 decides) |
| C13 | andy | sheriff | `m8_station` on `sarah_support_state=none`: Truman passed by Sarah, "Adesso Andy resta con lei" (T7′) | → palmer | palmer | `atto5` |
| C14 | sarah | palmer | `presagio_status=active`: night, she sleeps (M8 invariant) | → D1 | D1 | `atto5` |

## 6. Per-character exclusion (what V2 must prove over reachable states)

- **hawk**: BRIDGE (`atto3 ∧ ¬vagone_scoperto`), DOOR (`vagone_scoperto ∧ ¬s1`), CUT (`s1 ∧ ¬east_route_confirmed`), PATROL (`atto4 ∧ ¬body_found_by`, or for the `cooper` branch `¬maddy_trovata`), SHORE (`body_found_by=hawk ∧ ¬m8_station` ∪ `body_found_by=cooper ∧ maddy_trovata ∧ ¬m8_station`). Pairwise exclusive: the three Act 3 windows partition `atto3 ∧ ¬east_route_confirmed`; `atto4 ⇒ east_route_confirmed` separates them from Act 4; PATROL and SHORE are exclusive by `body_found_by`/`maddy_trovata`. **Exact PATROL predicate** (order-free): `atto4 ∧ ¬(body_found_by=hawk) ∧ ¬(body_found_by=cooper ∧ maddy_trovata)`. D5 decides what follows `m8_station`.
- **truman**: REPORT (`m5_final_theory ∧ P3A formulated ∧ ¬east_route_confirmed`) vs ROADHOUSE (`T_LELAND_TAXI ∧ ¬warning_target`): exclusive because `T_LELAND_TAXI ⇒ atto4 ⇒ east_route_confirmed`.
- **norma, shelly, loglady, bobby, donna, james**: one window each (ROADHOUSE) plus James's NOT_YET (`¬sogno_fatto`), exclusive because `atto4 ⇒ sogno_fatto`.
- **maddy**: DINER (`atto4 ∧ ¬promise_stance`), HOME (`promise_stance ∧ ¬maddy_trovata`), GONE (`maddy_trovata`): a partition of `atto4`.
- **leland**: DINER (`atto4 ∧ ¬T_LELAND_TAXI`), HIDDEN (`T_LELAND_TAXI ∧ ¬atto5`), Act 5 station (`atto5 ∧ ¬leland_morto`), TERMINAL (`leland_morto`): a partition of `atto4`.
- **andy**: VICE (`sarah_support_state=vice ∧ ¬m8_station`) and WITH_SARAH (`m8_station ∧ ¬atto5`): exclusive by `m8_station`. D2 may add a third window for `none` branches; it must be exclusive with both.
- **audrey, jacques, giant, piantone**: single windows.
- **sarah, jacoby**: pending D1/D4; whatever is chosen is one window each.

## 7. Engine today vs truth — what the migration deletes or corrects

| fact today | truth | migration action |
|---|---|---|
| classic `truman`, `hawk`, `lucy`, `andy` at `sheriff` without cond (`js/glue.js`) | baselines | become registry baselines; classic entries deleted (V7) |
| adapter roadhouse crowd `when atto4 ∧ ¬warning_target` (adapter:254-291) | window entry is D7 (`T_LELAND_TAXI` proposed) | replace by `ACT4_TOWN_AT_ROADHOUSE`; adapter bodies deleted |
| classic diner Norma/Shelly/Log Lady/James without Act 4 cond; town Bobby/Donna/Jacoby/palmer Sarah `!flag:gigante2` | window exit returns them | delete the four `!flag:gigante2` conds; `gigante2` stops being a world switch; the 180 ms sync-poll race noted in route-trace O6 disappears (the resolver reads narrative state directly) |
| `hawk_cut` `value_set s1` with no exit (adapter:221) | CUT ends at `east_route_confirmed` | window exit added |
| `hawk_shore_after` ends at `m8_station` with nothing after | D5 | window per decision |
| classic `leland` at `sheriff` only for `atto5 ∧ ¬leland_morto` | Act 5 window; Acts 1–4 per D9/derived | registry |
| Giant: no body in Room 315; `gigante` entity at the Roadhouse | matches truth | registry window; mirror interact untouched |
| `piantone_ronette` permanent from `jacques_dead` | D11 | window exit per decision |
| Ronette bed draw special (`hospital-scene.js:114-120`) | scene special referencing the resolved body | unchanged |

## 8. Open decisions for the lead (block plan step 3)

| id | question | what the sources say | options (no default taken) |
|---|---|---|---|
| **D1** | Sarah's body at night (`presagio_status=active` → `atto5`) | truth: at the Palmer house, asleep, "il vice la sostiene", never at the shore; pass-01 staging intent: house dark (hidden) | (a) `palmer` placement, `dialogue: null` or a one-line asleep caption; (b) `OFFSCREEN` "house dark" — the route_palmer page "buio al piano di sopra" reads naturally either way |
| **D2** | Andy between `warning_target ∈ {palmer, nessuno}` and `m8_station` | only the `centrale` branch dispatches him; at the station Truman says he passed by Sarah and Andy now stays with her | (a) `sheriff` until `m8_station` then `palmer`; (b) `palmer` from `maddy_trovata` (Truman's pass-by happens between shore and station); (c) `palmer` from `warning_target` on every branch (contradicts "Sono passato io da Sarah") — listed for completeness |
| **D3** | James's arrival at the Roadhouse | no page stages it; he is in the crowd list; his diner presence is gated by `sogno_fatto` | (a) accept "the town gathers" as his cause (C10, no own beat); (b) require a one-line staging page in the environment pass |
| **D4** | Jacoby at night | no Act 4 source mentions him; engine hides him forever from `gigante2`; he is not in the crowd list | (a) baseline `town` all night (no window); (b) `roadhouse` in C10; (c) `OFFSCREEN` from `presagio_status=active` to `atto5` |
| **D5** | Hawk after `m8_station` (before dawn) | `hawk_shore_after` vanishes; no text relocates him; "Il lago è recintato" is the echo the shore brief wants | (a) stays `town` 16,27 until `atto5` (perimeter kept); (b) `sheriff` baseline; (c) `OFFSCREEN` |
| **D6** | Hawk in the Act 4 afternoon (`atto4` → `presagio_status`) | Lucy p01 (afternoon) does not mention him; p03 (night) says "di pattuglia"; draft §4.6 absent at T3 | (a) `OFFSCREEN` patrol from `atto4` (one window, C9 as written); (b) `sheriff` in the afternoon, patrol from `presagio_status=active` |
| **D7** | When the town is already at the Roadhouse | S3 fixes the room only when Cooper enters; Lucy p01: "Norma chiude alle sei per andarci"; engine: from `atto4` (duplicates) | (a) from `T_LELAND_TAXI` (afternoon over: Leland has paid and left); (b) from `promise_stance`; (c) from `atto4` with the diner emptied (contradicts "Norma at the counter" in the afternoon) |
| **D8** | Sarah's afternoon vision vs D1 window | `sarah_visione` is classic, optional, `atto4 → sarah_visione`; today hidden by `gigante2` | confirm the vision stays reachable until `presagio_status=active` (baseline `palmer` covers it) |
| **D9** | Leland in Acts 1–3 | T40: composed public mourning, visible to the town; no scene stages him; engine: no body | (a) baseline `OFFSCREEN` (no new content); (b) a `palmer` placement with a classic line (new content; out of this milestone) |
| **D10** | Donna and Audrey in Act 1 | character sheets start their function in Act 2; engine shows them from the start; Act 1 design never hid them | (a) keep baselines (present from start); (b) add `OFFSCREEN` windows before `sogno_fatto` (removes two Act 1 wanderers) |
| **D11** | End of `piantone_ronette` | permanent from `jacques_dead`; no source retires the guard | (a) until `atto4` (the morning after); (b) until `atto5`; (c) permanent, accepted |

## 9. What this file does not decide

Coordinates and facing per placement (environment pass); the `dialogue: null` policy for crowd bodies (per window, S3 says the room is "full and still"); Act 5 windows (M9/M10 design owns them; `leland` Act 5 station and `bob` Lodge rows are placeholders for the registry's exclusion proofs only).
