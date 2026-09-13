# Cast Continuity — lead decisions v0.1 (Acts 1–4)

Date: 2026-09-11. Closes every open decision in `artifacts/world-character-audit/cast-windows-acts-1-4.md` under the frozen `docs/cast-continuity-contract-v0.1.md`. Authority order applied: Story Truth → frozen act designs / scene contracts → explicit narrative causality → current implementation as evidence only. **No implementation occurred** (§9).

Every decision below answers one question: where is this named person at this story moment, and what story event caused that state. Nothing is answered from sprite placement. Where a decision is a lead choice, the alternative rejected and the reason are recorded.

## 1. Decisions made

Format per item: CHARACTER · WINDOW · BEFORE · EVENT/CAUSE · AFTER · NEXT TRANSITION · PLAYER VISIBILITY · SOURCE · STATUS.

### D1 — Sarah at night

- **Sarah** · `ACT4_SARAH_ASLEEP` = `value_set presagio_status ∧ ¬atto5` (2026-09-13: was `=active`; `presagio_status` becomes `verified` at the shore, the intent "asleep until dawn" is unchanged)
- BEFORE: `palmer` 9,7 (baseline; afternoon and evening, the optional vision `sarah_visione` reachable — D8).
- CAUSE: night. Maddy came home in the evening (T51) and Sarah went upstairs; by the phone she is asleep (M8 `m8_station.invariant`: "Sarah non è mai oracolo (dorme; il vice la sostiene)"; feedback `warning_palmer`: "Svegli Sarah").
- AFTER: **`OFFSCREEN` — asleep upstairs, the house dark.** The night Palmer map is authored as an empty dark ground floor (`m8.c.route_palmer.p01` "La casa: buio al piano di sopra"; valise page). A visible Sarah body would contradict that page on every route.
- Warning branch `palmer`: Maddy wakes her and stays with her; still upstairs, unseen → same state. Branch `centrale` / `nessuno`: same state, Andy joins her (D2). Post-tragedy (`maddy_trovata` → `m8_station`): "does not find the body" (characters/sarah.md), covered by Andy/Truman → same state.
- NEXT TRANSITION: `atto5` (M9 owns her morning; she returns to baseline `palmer` by window exit unless M9 authors otherwise).
- VISIBILITY: experienced as absence (dark house) and inferred from Lucy/Truman lines ("Svegli Sarah", "Sono passato io da Sarah", "Andy era già con Sarah").
- SOURCE: Story Truth (characters/sarah.md; truth.md "she suspected the house, never knew"), M8 invariant, route_palmer page. Lead choice between (a) body asleep and (b) OFFSCREEN: (b), because the authored page shows a dark house, not a sleeping figure.
- STATUS: LOCKED.

### D2 — Andy when the warning did not dispatch him

- **Andy** · two exclusive windows, both → `OFFSCREEN` (Palmer house, with Sarah):
  - `ACT4_ANDY_WITH_SARAH_VICE` = `sarah_support_state=vice ∧ ¬atto5` (branch `centrale`): CAUSE Lucy dispatches him ("Mando Andy a casa Palmer, agente. Ci mette dieci minuti", T4′).
  - `ACT4_ANDY_WITH_SARAH_LATE` = `sarah_support_state=none ∧ maddy_trovata ∧ ¬atto5` (branches `palmer`, `nessuno`): CAUSE the shore call reaches the station; Truman goes to the Palmers himself and leaves Andy with Sarah before returning ("Sono passato io da Sarah prima di tornare qui. Adesso Andy resta con lei", T7′).
- BEFORE (both): `sheriff` 10,7 baseline — at the station through the afternoon, the Roadhouse window ("Andy at the station", scene-contracts S3 authority line) and, on `none` branches, the post-phone walk and the shore.
- Physically shown or OFFSCREEN while dispatched: **OFFSCREEN**. Reason: on `centrale` + `focus=palmer` Cooper enters the Palmer house while Andy is already inside; the authored house page is dark and silent; Andy is upstairs with Sarah ("resta con lei"), not a body at the door. Rendering him would require a page the design never wrote.
- NEXT TRANSITION: `atto5` → baseline `sheriff` (M9 may re-author).
- VISIBILITY: inferred from Lucy (`centrale` feedback) and Truman (`m8_station` pages_by_value); experienced as his absence from the station before dawn.
- SOURCE: M8.json :588, :1488-1502; offscreen-timeline T4′/T7′. Lead choice among (a) station until `m8_station`, (b) Palmer from `maddy_trovata`, (c) Palmer from `warning_target` on every branch: (b). (a) makes Truman's "Adesso Andy resta con lei" false at the moment it is said only if Andy were still at the station; (c) contradicts "Sono passato io da Sarah".
- STATUS: LOCKED.

### D3 — James's arrival at the Roadhouse

- **James** · `ACT4_EVENING_GATHERING` (shared crowd window, §D7).
- BEFORE: `diner` 9,6 (baseline since `sogno_fatto`).
- CAUSE: the town gathers at the Roadhouse for the night (T52 "Il paese c'è tutto"; Lucy p01 "Stasera il paese è tutto al Roadhouse"). James is one of the townsfolk Cooper has met; scene-contracts S3 point 2 lists him at a table. No individual arrival beat exists and none is created.
- AFTER: `roadhouse` 2,4, silent.
- NEXT TRANSITION: `warning_target` (the Roadhouse closes) → `ACT4_TOWN_HOME_NIGHT` (§D7b) → `atto5` → baseline.
- VISIBILITY: seen (a body at a table).
- SOURCE: scene-contracts S3; T52. Lead choice (a) accept the gathering as cause vs (b) require a staging page: (a).
- STATUS: LOCKED.

### D4 — Jacoby at night

- **Jacoby** · `ACT4_JACOBY_HOME_NIGHT` = `T_LELAND_TAXI ∧ ¬atto5`.
- BEFORE: `town` 16,25 (baseline by day; classic Act 1 dialogue "nel mio studio").
- CAUSE: evening. The town goes to the Roadhouse or home; Jacoby is not among the people Cooper finds at the Roadhouse (S3 fixed the crowd: bobby, donna, james, shelly, norma, loglady, truman). He is home.
- AFTER: `OFFSCREEN` (home).
- NEXT TRANSITION: `atto5` → baseline `town`.
- VISIBILITY: experienced as absence from the night streets ("le strade sono solo distanza").
- SOURCE: S3 crowd set (design), lead decision on the complement. Rejected: (b) add him to the crowd — S3 froze the entity set and the room is "full and still" with the people the player has met at the diner and in town; a new body is a staging change to a frozen scene. Rejected: (a) leave him on the streets all night — a doctor standing at his corner at 1 a.m. during the walk contradicts the empty-streets caption.
- STATUS: LOCKED.

### D5 — Hawk after the station scene

- **Hawk** · `ACT4_HAWK_SHORE` extended: `(body_found_by=hawk ∨ (body_found_by=cooper ∧ maddy_trovata)) ∧ ¬atto5`.
- BEFORE: `town` 16,27 (the shore, perimeter marked).
- CAUSE preserving the state: he keeps custody of the scene until the county takes over at dawn ("L'ho trovata io. Non l'ho mossa"; environment brief: "Il lago è recintato" is the only change the player can see later).
- AFTER: `town` 16,27 through `m8_station`.
- NEXT TRANSITION: `atto5` → baseline `sheriff` (M9 morning).
- VISIBILITY: seen if the player returns to the lake before dawn; inferred otherwise (Truman: "Hawk è partito subito").
- SOURCE: M8 `m8_discovery` hawk pages; shore environment brief. Rejected: (b) back to the station — nothing brings him back and the perimeter would be unattended; (c) OFFSCREEN — the brief wants the shore preserved.
- STATUS: LOCKED.

### D6 — Hawk in the Act 4 afternoon

- **Hawk** · `ACT4_HAWK_PATROL` = `T_LELAND_TAXI ∧ ¬(body_found_by=hawk) ∧ ¬(body_found_by=cooper ∧ maddy_trovata)`.
- BEFORE: `sheriff` 12,8 (morning bridge T36 at the station; afternoon at the station).
- CAUSE: evening. When the town moves to the Roadhouse, Truman puts his one free deputy on the road for the night (Lucy p03 "Hawk è di pattuglia"; `centrale` feedback "è di pattuglia"; draft §4.6 "absent by design (patrol)"). A daytime patrol has no cause in any source.
- AFTER: `OFFSCREEN` (patrol).
- NEXT TRANSITION: the anonymous call (`body_found_by`, T7) → shore (`hawk` branch immediately; `cooper` branch when `maddy_trovata`, "Arrivano le torce di Hawk e del vice").
- VISIBILITY: seen at the station in the afternoon; his night absence is dialogue-rendered (Lucy) and experienced at the station.
- SOURCE: M8 Lucy pages, offscreen-timeline T3/T4′. Lead choice: patrol from `T_LELAND_TAXI` (the evening event) rather than from `atto4` or from `presagio_status=active`.
- STATUS: LOCKED.

### D7 — When the town is at the Roadhouse; where it goes after

- **Truman, Norma, Shelly, Log Lady, James, Bobby, Donna** · `ACT4_EVENING_GATHERING` = `T_LELAND_TAXI ∧ ¬warning_target`.
- BEFORE: baselines (Truman station; Norma, Shelly, Log Lady, James diner; Bobby, Donna town).
- CAUSE: the afternoon ends when Leland pays and leaves the diner (T0.5, `T_LELAND_TAXI`) and the Double R closes early for the Roadhouse evening, shown on screen by the closing beat of the same node (`m8.b0.leland_taxi.chiusura.p01`, §8c); "Norma chiude alle sei per andarci" (Lucy p01); the town gathers (T52). Truman goes to wait for Cooper there (S3 actor node; Lucy p01 "Lei ci va?").
- AFTER: all → `roadhouse` (S3 table placements; Truman 4,8 near the door).
- NEXT TRANSITION: `warning_target` — the phone; "Il Roadhouse ha chiuso" (`m8.c.focus.repeat`).
- **D7b — after the Roadhouse closes** (`ACT4_TOWN_HOME_NIGHT` = `warning_target ∧ ¬atto5`): Shelly, Log Lady, James, Bobby, Donna → `OFFSCREEN` (gone home; "Stanotte le strade sono solo distanza"). Norma → baseline `diner` (the Double R is her house; `m8_route_diner` finds her there: "Poi è tornata dai Palmer. Non era ancora partita"). Truman → baseline `sheriff` (he returns to coordinate; `p_lago`: "La chiamata sulla riva è arrivata qui").
- NEXT: `atto5` → baselines.
- VISIBILITY: the crowd seen at the Roadhouse; the empty streets experienced; Norma seen on the diner route; Truman seen at the station.
- SOURCE: S3, Lucy p01, focus repeat page, route_diner node, station p_lago. Rejected: crowd from `atto4` (engine today; contradicts "Norma at the counter" in the afternoon, environment-requirements); crowd back at a night diner (false: the diner is closed, Norma alone).
- STATUS: LOCKED.

### D8 — Sarah's afternoon vision

- Reachable through baseline `palmer` from `atto4` until `presagio_status=active` (afternoon and evening). Nothing hides her before the night. `gigante2` is no longer a world switch.
- SOURCE: scene-contracts L3 (optional afternoon). STATUS: LOCKED.

### D9 — Leland in Acts 1–3

- **Leland** · baseline **`OFFSCREEN`** ("composed public mourning, in the house or in town, never in frame").
- CAUSE preserving the state: T40 — he collaborates with public mourning, too composed; no Act 1–3 scene stages him; the game keeps his first body for the counter beside Maddy (T50), where the player meets him as an ordinary father the afternoon before.
- NEXT TRANSITION: `atto4` → `diner` 11,1 (`ACT4_LELAND_DINER`); `T_LELAND_TAXI` → `OFFSCREEN` ("già dentro la casa", must stay HIDDEN); `atto5` → `sheriff` (M9); `leland_morto` → `TERMINAL_REMOVED`.
- VISIBILITY: absence is not noticed in Acts 1–3 (nobody asks for him); the Act 1 house scene is Sarah's.
- SOURCE: timeline T40, characters/leland.md; lead choice against a silent Palmer body (new staging in a frozen Act 1 scene).
- STATUS: LOCKED.

### D10 — Donna and Audrey in Act 1

- Baselines kept: Donna `town` 44,10, Audrey `hotel_gn` 12,9, Jacoby `town` 16,25 — **LOCKED by Act 1 design**: the classic Act 1 dialogues exist for all three (`js/data.js:283` donna picnic video, `:290` jacoby, `:297` audrey introduction) and Act 1 is classic-owned by the Narrative System. The character sheets' "Act 2" lines describe their first function in the mission layer, not an absence.
- STATUS: LOCKED.

### D11 — End of the Ronette guard

- **piantone_ronette** (STORY-BOUND scenography) · `ACT3_GUARD_RONETTE` = `jacques_dead ∧ ¬leland_morto`.
- BEFORE: `piantone` at Jacques's room (`jacques_preso ∧ ¬jacques_dead`).
- CAUSE: Jacques is smothered under guard with no witness (T33/T41); the county moves the guard to the only living witness (Ronette). It stays until the author is no longer a threat.
- AFTER: `hospital` 3,6. NEXT TRANSITION: `leland_morto` → `OFFSCREEN`. Act 5 design may refine the end (recorded in §8), but the window has a cause and an end now.
- VISIBILITY: seen whenever the ward is visited.
- SOURCE: T31, T34, T41; lead decision on the end.
- STATUS: LOCKED.

### Confirmed without a decision (asked by the brief)

- **Norma / Shelly**: Double R baseline (Norma LOCKED by environment-requirements "Norma at the counter"; Shelly works there); gathering per D7; after the phone Norma diner, Shelly OFFSCREEN (D7b).
- **Truman**: `sheriff` baseline (T20, T25, T32, T36, T55) · traincar `ACT3_TRUMAN_REPORT` (T28, cause: comes to receive the report; exit `east_route_confirmed`) · Roadhouse per D7 · station before dawn = baseline (`m8_station`). His pass-by Sarah (T7′) is narrated, un-timed, and occupies no window.
- **Hawk**: `sheriff` baseline (PROPOSED → **LOCKED**: every source that names his rest position names the station — T11 "Truman, Hawk" open the investigation there, T32 night report, Act 4 Lucy routes calls to him from the station) · traincar bridge/door/cut (T26–T29) · patrol (D6) · shore (T54, D5) · return at `atto5`.
- **Leland / Maddy**: diner afternoon (T50; Leland until `T_LELAND_TAXI`, Maddy until `promise_stance`) · Palmer house at night = `OFFSCREEN` for both (T51–T53 must stay HIDDEN: "la casa NON è la scena del corpo") · Maddy `TERMINAL_REMOVED` at `maddy_trovata` (the body is a form, never a figure).
- **Lucy**: `sheriff` in every window (T32, T34, M8 Lucy pages).
- **Giant**: `OFFSCREEN` baseline; Room 315 is the mirror interact (object-mediated, T35); `roadhouse` 8,1 during `ACT4_GIANT_STAGE` (T52).

## 2. Rationale and sources — summary

| decision | source class | rejected because |
|---|---|---|
| D1 OFFSCREEN asleep | Story Truth + M8 invariant + route_palmer page | a body contradicts "buio al piano di sopra" |
| D2 OFFSCREEN with Sarah from dispatch / from `maddy_trovata` | M8 pages :588, :1488-1502 | station-until-dawn falsifies Truman's line; Palmer-from-phone falsifies "Sono passato io" |
| D3 gathering is the cause | S3 + T52 | a staging page would be a new beat |
| D4 OFFSCREEN home | S3 crowd set + night caption | crowd body changes a frozen scene; night street body false |
| D5 shore until dawn | discovery pages + shore brief | unattended perimeter; no return cause |
| D6 patrol from the evening | Lucy pages + draft §4.6 | daytime patrol has no cause |
| D7 gathering from `T_LELAND_TAXI`; home after | Lucy p01, S3, focus repeat, route_diner | `atto4` start empties the afternoon diner |
| D8 vision until night | L3 | — |
| D9 Leland OFFSCREEN baseline | T40 + first-body dramaturgy | silent body in a frozen Act 1 scene |
| D10 keep Act 1 baselines | classic Act 1 dialogues | — |
| D11 guard until `leland_morto` | T31/T34/T41 | unexplained vanish at `atto4`/`atto5` |

## 3. Final baselines (all registry characters)

| character | baseline | status |
|---|---|---|
| truman | `sheriff` 10,4 | LOCKED |
| hawk | `sheriff` 12,8 | LOCKED (D-confirmed) |
| lucy | `sheriff` 2,6 | LOCKED |
| andy | `sheriff` 10,7 | LOCKED |
| sarah | `palmer` 9,7 | LOCKED |
| leland | `OFFSCREEN` | LOCKED (D9) |
| maddy | `OFFSCREEN` | LOCKED |
| norma | `diner` 5,2 | LOCKED |
| shelly | `diner` 9,7 | LOCKED (works there) |
| loglady | `diner` 4,5 | LOCKED (the regular; classic `atto4 → a4` line at the diner) |
| james | `diner` 9,6 (with `JAMES_NOT_YET` before `sogno_fatto`) | LOCKED |
| bobby | `town` 31,16 wander | LOCKED (Act 1 classic) |
| donna | `town` 44,10 wander | LOCKED (D10) |
| jacoby | `town` 16,25 | LOCKED (D10) |
| audrey | `hotel_gn` 12,9 wander | LOCKED (D10) |
| benhorne | `hotel_gn` 5,7 | LOCKED (Act 2 classic line; the hotel is his) |
| gerard | `hospital` 11,4 | LOCKED (Act 2 ward; no source moves him) |
| ronette | `hospital` 3,5 | LOCKED |
| infermiera | `hospital` 11,8 | LOCKED |
| jacques | `TERMINAL_REMOVED` (with `ACT3_JACQUES_AT_OEJ` before arrest) | LOCKED |
| giant | `OFFSCREEN` | LOCKED |
| laura, mfap | `redroom` (scripted map only) | LOCKED |
| bob | `OFFSCREEN` | LOCKED |
| piantone, piantone_ronette | `OFFSCREEN` | LOCKED |

## 4. Final window snapshots (V5)

See `artifacts/world-character-audit/cast-windows-acts-1-4.md` §4 for the full tables (relevant cast only; every listed character has exactly one state). Load-bearing rows, resolved:

- **ACT1_TOWN**: truman/hawk/lucy/andy sheriff · sarah palmer · leland OFFSCREEN · norma/shelly/loglady diner · james OFFSCREEN · bobby/donna/jacoby town · audrey/benhorne hotel_gn · gerard/ronette/infermiera hospital · jacques oej · giant OFFSCREEN.
- **ACT2_DAY2** (`sogno_fatto`): as Act 1 with james diner.
- **ACT3_TRAINCAR_REPORT**: truman traincar 9,8 · hawk traincar 14,8 · everyone else baseline · jacques oej.
- **ACT3_OEJ** (`audrey_indaga`): truman/hawk sheriff · audrey oej 13,7 · jacques oej 7,5. Without `audrey_indaga`: audrey hotel_gn.
- **ACT3_GUARDED_HOSPITAL**: jacques TERMINAL_REMOVED · piantone hospital 7,3 · ronette/infermiera/gerard hospital · rest baseline.
- **ACT4_AFTERNOON** (`atto4`, ¬`promise_stance`): maddy diner 10,1 · leland diner 11,1 · norma/shelly/loglady/james diner · truman/hawk/lucy/andy sheriff · sarah palmer · bobby/donna/jacoby town · giant OFFSCREEN.
- **ACT4_EVENING_GATHERING** (`T_LELAND_TAXI`, ¬`presagio_status`): truman + norma/shelly/loglady/james/bobby/donna roadhouse · hawk OFFSCREEN patrol · lucy/andy sheriff · sarah palmer (vision reachable) · leland/maddy OFFSCREEN · jacoby OFFSCREEN · giant OFFSCREEN.
- **ACT4_ROADHOUSE_PRE_PHONE** (`presagio_status=active`, ¬`warning_target`): as gathering + giant roadhouse 8,1 · sarah OFFSCREEN asleep.
- **ACT4_POST_PHONE_PALMER / NESSUNO** (`warning_target`, ¬`focus_destination`): truman sheriff · hawk OFFSCREEN · lucy/andy sheriff · sarah OFFSCREEN · norma diner · shelly/loglady/james/bobby/donna OFFSCREEN · jacoby OFFSCREEN · leland/maddy OFFSCREEN · giant OFFSCREEN.
- **ACT4_POST_PHONE_CENTRALE**: as above with andy OFFSCREEN (Palmer, with Sarah).
- **ACT4_ROUTE_PALMER** (`focus_destination=palmer`, ¬`body_found_by`): Palmer map = nobody (sarah OFFSCREEN; andy OFFSCREEN on `centrale`, sheriff otherwise); rest as post-phone.
- **ACT4_ROUTE_DINER**: norma diner (actor node); rest as post-phone.
- **ACT4_ROUTE_LAKE**: hawk OFFSCREEN (on the road) until `maddy_trovata`; rest as post-phone.
- **ACT4_SHORE_HAWK** (`body_found_by=hawk`, `maddy_trovata`): hawk town 16,27 · maddy TERMINAL_REMOVED · andy OFFSCREEN (all branches: vice already, none from `maddy_trovata`) · rest as post-phone.
- **ACT4_SHORE_COOPER_AFTER** (`body_found_by=cooper`, `maddy_trovata`): identical to SHORE_HAWK.
- **ACT4_STATION_BEFORE_DAWN** (`m8_station`, ¬`atto5`): truman/lucy sheriff · andy OFFSCREEN (with Sarah) · hawk town 16,27 · sarah OFFSCREEN · leland OFFSCREEN · maddy TERMINAL_REMOVED · norma diner · crowd + jacoby OFFSCREEN · giant OFFSCREEN.

## 5. Transition causality (adjacent windows: who moved, why)

| from → to | who moved | why (in-story) |
|---|---|---|
| ACT1 → ACT2 | james appears at the diner | the dream: Cooper is ready to hear him (T22→T24) |
| ACT2 → ACT3 bridge | hawk sheriff → footbridge | the east road opens; Hawk leads Cooper (T26) |
| bridge → door → cut | hawk | the car is found; custody decided; the prints enter the cut (T27–T29) |
| discovery → report | truman sheriff → traincar | he comes to receive the report (T28) |
| report → OEJ | truman, hawk → sheriff | north cut confirmed, the report is over (T29); audrey → oej: she investigates alone (T30) |
| OEJ → guarded hospital | jacques → TERMINAL; audrey → hotel; piantone appears | arrest, broken leg, guard (T30–T31); the boat home with Truman (T42) |
| guarded → night station | piantone → OFFSCREEN; piantone_ronette appears | Jacques killed under guard; the witness is now Ronette (T33–T34, T41) |
| night → Act 4 afternoon | maddy, leland appear at the diner | Act 4 opens on Maddy's last ordinary afternoon (T50) |
| afternoon → promise made | maddy → OFFSCREEN | she leaves for home (T51) |
| promise → evening gathering | leland → OFFSCREEN; crowd + truman → roadhouse; hawk → patrol; jacoby → home | Leland pays and leaves (T0.5); the town gathers, Truman waits for Cooper, one deputy on the road (T52) |
| gathering → pre-phone | giant appears; sarah → asleep | the statement (T52); night |
| pre-phone → post-phone | giant → OFFSCREEN; crowd → home; norma → diner; truman → sheriff; (centrale) andy → Palmer | the phone; the Roadhouse closes; Lucy dispatches Andy |
| post-phone → shore | hawk → shore | the anonymous call (T7; world process) |
| shore → station | (none branches) andy → Palmer | Truman passed by Sarah and left Andy with her (T7′) |
| station → Act 5 | everyone → baseline; leland → sheriff; hawk → sheriff | dawn; M9 opens (T55) |

No transition is justified by "the next scene needs them there".

## 6. Explicitly OFFSCREEN states

| character | window | label |
|---|---|---|
| james | `¬sogno_fatto` | not yet met |
| leland | baseline Acts 1–3 | composed mourning, out of frame |
| leland | `T_LELAND_TAXI ∧ ¬atto5` | inside the house (HIDDEN) |
| maddy | baseline; `promise_stance ∧ ¬maddy_trovata` | not in town; gone home (HIDDEN) |
| hawk | `ACT4_HAWK_PATROL` | on patrol |
| sarah | `ACT4_SARAH_ASLEEP` | asleep upstairs, house dark |
| andy | `…_VICE`, `…_LATE` | at the Palmers with Sarah |
| shelly, loglady, james, bobby, donna | `ACT4_TOWN_HOME_NIGHT` | gone home |
| jacoby | `ACT4_JACOBY_HOME_NIGHT` | home |
| giant | baseline | not manifest |
| bob | baseline (Acts 1–4) | a force, not a body |
| piantone, piantone_ronette | baseline | not posted |

## 7. Terminal removals

| character | at | reason |
|---|---|---|
| jacques | `jacques_preso` | arrested, hidden in the guarded room, killed (T30–T34); never a body again |
| maddy | `maddy_trovata` | the body is a form on the shore, never a figure (Bible §8) |
| leland | `leland_morto` | dies in the cell (T57; Act 5) |

## 8. Decisions deliberately NOT made

- Act 5 windows (Leland at the station, Andy/Sarah/Hawk return, Ronette awake, the Lodge, BOB): owned by the M9/M10/Loggia design passes; only placeholders with exclusion proofs exist.
- The end of `piantone_ronette` beyond `leland_morto` (Act 5 may end it earlier with a cause).
- Coordinates, facing, `dialogue: null` policy per crowd body: the Act 4 environment pass, inside the S3 "full and still" rule.
- Ronette's bed draw special case: stays a scene special referencing the resolved body.

## 8b. Amendment (final consistency pass, 2026-09-11)

`docs/cast-continuity-final-consistency-report.md` corrects this document where it contradicted frozen Act 3 / Act 4 text. The corrections supersede the matching lines above:

- **Hawk, Act 3**: after the north cut Hawk is at the **OEJ landing** (`ACT3_HAWK_OEJ_DOCK`, `east_route_confirmed ∧ ¬jacques_preso`; "(fuori, piano) Io resto qui"; B1/B6), then **`OFFSCREEN` escorting Jacques** to the ward (`jacques_preso ∧ ¬m6_hospital_guard`; the register's last line is his signature), then the station ("Hawk scrive"). The earlier "sheriff during OEJ" is withdrawn.
- **Truman, Act 3**: he **stays at the traincar** with the ring and the file after the report (`m5_report_close`: "Io resto con l'anello e con il verbale") until `jacques_preso` (station for `m6_return_night_early`), or until `audrey_vista_oej`, when he is `OFFSCREEN` meeting the eight o'clock boat (T42). The earlier exit at `east_route_confirmed` is withdrawn.
- **Jacques**: `OFFSCREEN` (guarded room, alive) from `jacques_preso` to `jacques_dead`; `TERMINAL_REMOVED` only from `jacques_dead`. The earlier terminal at arrest is withdrawn.
- **D7 / D7b — Roadhouse exit**: the town gathering and Truman end at **`focus_destination`** (the route commit at the crossroads, outside the Roadhouse), not at `warning_target`. Only the Giant ends at the phone. Post-phone, pre-threshold, the room is intact. `ACT4_TOWN_HOME_NIGHT` starts at `focus_destination`.
- **Maddy**: she leaves the diner at **`T_LELAND_TAXI`** (the page "(Maddy saluta ed esce…)" is the first page of the node that sets it), not at `promise_stance`.
- **D7 entry for the diner regulars was reopened as lead blocker B1** (`cast-windows-acts-1-4.md` §8): the only nightfall state, `T_LELAND_TAXI`, fires while Cooper stands at the counter, and no page authored Norma, Shelly, the Log Lady and James leaving. Closed in §8c.

## 8c. B1 closed (lead decision, 2026-09-11)

Option B. `m8_leland_taxi` ends with an authored closing beat, `m8.b0.leland_taxi.chiusura.p01` (action caption, unconditional, before the notebook page): "(Norma gira il cartello sulla porta e spegne l'insegna. Sedie sui tavoli, cappotti dagli attaccapanni: il Double R chiude alle sei, stasera si va al Roadhouse.)". The transition is:

| from | via | to | cast | cause |
|---|---|---|---|---|
| DINER AFTERNOON (`promise_stance ∧ ¬T_LELAND_TAXI`) | `m8_leland_taxi` closing beat | EVENING GATHERING (`T_LELAND_TAXI ∧ ¬focus_destination`) | Norma, Shelly, Log Lady, James: Double R → Roadhouse | the Double R closes for the Roadhouse evening |

Entry stays `T_LELAND_TAXI` (no new flag, value, evidence or proposition; player position is never Cast Continuity state). The gathering window carries `entry_authored_by: m8.b0.leland_taxi.chiusura.p01` for the four. Truman, Bobby and Donna are unchanged (Cooper is not in their origin rooms). Full record: `docs/cast-continuity-b1-resolution.md`.

## 9. Confirmation

No implementation occurred: no registry, resolver, validator, mission JSON, adapter, or classic data was created or changed. Files changed by this pass: this document, `artifacts/world-character-audit/cast-windows-acts-1-4.md` (open decisions closed; windows, pins and change records resolved), `CANONICAL-SYNC.md`. Success condition: every Act 4 cluster character has a baseline and exclusive windows with a cause; a coder can compile them without deciding where anyone "should probably be".
