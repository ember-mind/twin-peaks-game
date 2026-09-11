# Cast Continuity v0.1 — final consistency report

Date: 2026-09-11. Cross-check of `docs/cast-continuity-lead-decisions-v0.1.md` and `artifacts/world-character-audit/cast-windows-acts-1-4.md` against frozen Act 3 / Act 4 production (`docs/act-3-design-report.md` B1/B6, `docs/act-3-closure-report.md`, `docs/act-4-design-report.md`, `docs/act-4-implementation-pass-01-report.md`) and the mission page text they froze (`narrative/missions/M5.json`, `M6.json`, `M8.json`). No runtime was implemented (§9).

## 1. Hawk at One Eyed Jacks — corrected

Was: Hawk resolved to `sheriff` during `ACT3_OEJ`. Frozen Act 3 says otherwise: B1 "Hawk waits at the dock", B6 "Arrest, dock … Hawk on the dock"; `m6.b1.ferry.p04` HAWK "(fuori, piano) Io resto qui. Se chiudono il molo, restiamo dentro."; `m6_arrest` "(Sul molo della contea, Jacques spinge Hawk e prova a correre…)". Cooper's own line at the cut fixes the handover: `m5_hawk_cut` "Hawk viene fino alla riva. Dalla riva in poi, io."

Now:

| window | predicate | placement | cause |
|---|---|---|---|
| `ACT3_HAWK_OEJ_DOCK` | `east_route_confirmed ∧ ¬jacques_preso` | `oej` 6,8 (the landing by the south door; coordinate is a proposal on the walkable row next to the spawn) | crosses with Cooper, waits at the threshold while Cooper handles the interior |
| `ACT3_HAWK_ESCORT` | `jacques_preso ∧ ¬node_done m6_hospital_guard` | `OFFSCREEN` (escort) | takes Jacques to the ward and signs him in: "Ultima riga: la firma di Hawk, ora del ricovero" |
| baseline | after `m6_hospital_guard` | `sheriff` | "In centrale … Hawk scrive, Cooper firma" (`m6_return_night`) |

Also corrected on the same chain: `ACT3_HAWK_DOOR` now ends at `node_done m5_report_close` ("(dalla porta) … Vieni.") and `ACT3_HAWK_CUT` runs from there to `east_route_confirmed`; the cut→dock handover is authored by Cooper's line, so the exit is not a silent vanish even though Cooper is still at the cut when `east_route_confirmed` is written.

## 2. Roadhouse exit — corrected

Was: Truman and the six townsfolk ended at `warning_target`, i.e. the room emptied while Cooper was still standing at the phone.

Production sequence verified: `m8_roadhouse_phone` is an object node on the `roadhouse` map (phone 8,5) writing `warning_target`; `m8_focus_choice` is a landmark node on the `town` map at `town_crossroads` 47,30, outside the Roadhouse, writing `focus_destination`; its repeat page is "Il Roadhouse ha chiuso. Da qui, le strade sono solo distanza." There is no state between leaving the room and the crossroads, and `focus_destination` is the first state the player reaches after the threshold, so it is exact — chosen on the sequence, not on the prompt's suggestion.

Now:

```
ROADHOUSE PRE-PHONE   presagio_status=active ∧ ¬warning_target   crowd + Truman + Giant
PHONE                 warning_target                             Giant → OFFSCREEN (p05); crowd + Truman remain
COOPER LEAVES         (no state; the door)                       room intact, may be re-entered
ROUTE COMMIT          focus_destination                          Truman → sheriff; Norma → diner; Shelly/Log Lady/James/Bobby/Donna → OFFSCREEN home
```

`ACT4_EVENING_GATHERING` exit = `value_set focus_destination`; `ACT4_TOWN_HOME_NIGHT` entry = `value_set focus_destination`; new pin row `ACT4_POST_PHONE_INSIDE` (`warning_target ∧ ¬focus_destination`) asserts the intact room on all three branches. The Act 4 Environment Pass inherits this: the Roadhouse has three authored population states (gathered; gathered without the Giant; closed), and "closed" begins at the crossroads.

## 3. Jacques arrested and alive — corrected

Was: `TERMINAL_REMOVED` from `jacques_preso`, collapsing "not shown" into "gone from the story". Frozen Act 3 inserts the guarded-hospital beat between arrest and death (T31 `m6_hospital_guard`: "Renault piantonato, stanza in fondo al reparto. Registro aperto sul banco, ultima firma di Hawk. Dichiarazione domattina."; T33–T34 the death, `m6_news`).

Now: `ACT3_JACQUES_AT_OEJ` (`¬jacques_preso`) → `ACT3_JACQUES_GUARDED` (`jacques_preso ∧ ¬jacques_dead`) = `OFFSCREEN`, label "guarded room, alive" → `JACQUES_DEAD` (`jacques_dead`) = `TERMINAL_REMOVED`. The three windows partition every reachable state, so V3 holds without the baseline. No bed sprite: the guard (`piantone`), the door and the register are the rendered representation of his custody.

## 4. Additional contradictions found in the cross-check

| id | class | finding | resolution |
|---|---|---|---|
| A1 Maddy | 1/7 | `ACT4_MADDY_DINER` ended at `promise_stance`; her exit is authored one node later, as the first page of `m8_leland_taxi` ("(Maddy saluta ed esce. Leland posa il conto sul bancone.)"). Ending at `promise_stance` removes her from the counter while Cooper stands there and before the caption. Engine today has the same defect (`adapter:228-232`). | exit = `evidence T_LELAND_TAXI` (fixed by frozen text) |
| A2 Truman | 4/7 | `ACT3_TRUMAN_REPORT` ended at `east_route_confirmed`, written at the cut while Cooper is on the traincar map. Frozen `m5_report_close`: TRUMAN "Io resto con l'anello e con il verbale." He stays. | exit = `jacques_preso` (station for `m6_return_night_early`: "Voglio che tu veda dove l'ho messo"); or `audrey_vista_oej` → `ACT3_TRUMAN_BOAT` `OFFSCREEN` ("La nuova del guardaroba è rientrata con la barca delle otto. L'ho accompagnata io.") |
| A3 Hawk chain | 3 | Hawk's door→cut move was keyed to `s1` (a notebook value); the authored move is `m5_report_close` ("Vieni"). | exit/entry re-keyed (fixed by frozen text) |
| **B1 gathering entry** | 7 | The diner regulars (Norma, Shelly, Log Lady, James) were sent to the Roadhouse at `T_LELAND_TAXI`, which is written at the diner counter with Cooper present; no page authors their leaving. `presagio_status=active` is too late (S3 p01 "Il paese c'è tutto" needs them there). No existing state marks Cooper leaving the diner or reaching the Roadhouse. | **lead blocker**, not fixed here; options in `cast-windows-acts-1-4.md` §8: (a) one new derived world state from the committed arrival on the `roadhouse` map, (b) a one-line closing caption in `m8_leland_taxi` (dialogue change, deferred to the implementation pass by lead permission), (c) rejected: accept the vanish. Truman, Bobby, Donna keep `T_LELAND_TAXI` (Cooper is not in their room) |
| R1 Audrey | 7 (residual, accepted) | if never addressed, Audrey leaves at `jacques_preso` while Cooper is on the OEJ map; the arrest ends the visit and T42 (the boat) is the offscreen cause | accepted |
| R2 Giant | 7 (residual, accepted) | leaves the stage at `warning_target` in front of Cooper; p05 authors it and the brief accepts the narrow supernatural window | accepted |

Checked and clean for all seven classes: `JAMES_NOT_YET` (Cooper in Room 315), Leland's exit (the bill caption), Sarah asleep, Andy (both windows fire while Cooper is elsewhere), Hawk patrol/shore, Jacoby, Norma's return (by the gathering's exit, at the crossroads, before `m8_route_diner` needs her), Andy's LATE window (shore), guards, Act 5 placeholders. No `TERMINAL_REMOVED` remains that is not a death (Jacques, Maddy, Leland). No `OFFSCREEN` remains without a label and a cause.

## 5. Final affected V5 snapshots

| moment | truman | hawk | jacques | audrey | crowd (norma/shelly/loglady/james/bobby/donna) | giant | maddy |
|---|---|---|---|---|---|---|---|
| `ACT3_OEJ` (`east_route_confirmed`, `audrey_indaga`, ¬seen, ¬arrest) | traincar 9,8 | **oej 6,8** | oej 7,5 | oej 13,7 | baseline | OFF | OFF |
| `ACT3_OEJ_AUDREY_SEEN` | **OFF (boat)** | oej 6,8 | oej 7,5 | hotel_gn | baseline | OFF | OFF |
| `ACT3_AFTER_ARREST` (`jacques_preso`, ¬ward visited) | sheriff | **OFF (escort)** | **OFF (guarded)** | hotel_gn | baseline | OFF | OFF |
| `ACT3_GUARDED_HOSPITAL` (ward visited, ¬`jacques_dead`) | sheriff | sheriff | **OFF (guarded)** | hotel_gn | baseline | OFF | OFF |
| `ACT3_NIGHT_STATION` (`jacques_dead`) | sheriff | sheriff | **TERM** | hotel_gn | baseline | OFF (mirror) | OFF |
| `ACT4_PROMISE_MADE` (`promise_stance`, ¬`T_LELAND_TAXI`) | sheriff | sheriff | TERM | hotel_gn | diner ×4, town ×2 | OFF | **diner 10,1** |
| `ACT4_EVENING_GATHERING` (`T_LELAND_TAXI`, ¬statement) | roadhouse | OFF patrol | TERM | hotel_gn | **B1** ×4; roadhouse ×2 | OFF | OFF |
| `ACT4_ROADHOUSE_PRE_PHONE` | roadhouse | OFF patrol | TERM | hotel_gn | roadhouse ×6 | roadhouse 8,1 | OFF |
| **`ACT4_POST_PHONE_INSIDE`** (`warning_target`, ¬`focus_destination`) | **roadhouse** | OFF | TERM | hotel_gn | **roadhouse ×6** | **OFF** | OFF |
| `ACT4_ROUTE_*` (`focus_destination`) | **sheriff** | OFF / road | TERM | hotel_gn | **norma diner; five OFF home** | OFF | OFF / TERM |

Full tables: `artifacts/world-character-audit/cast-windows-acts-1-4.md` §4.

## 6. Final transition causality (Act 3 chain and Act 4 night)

| transition | who | cause (authored) |
|---|---|---|
| bridge → door | hawk | "La soglia la tengo io" (`m5_hawk_door`) |
| door → cut | hawk | "(dalla porta) … Vieni." (`m5_report_close`) |
| cut → OEJ landing | hawk | "Hawk viene fino alla riva. Dalla riva in poi, io." (`m5_hawk_cut`); "Io resto qui" (`m6_ferry`) |
| report → stays | truman | "Io resto con l'anello e con il verbale" |
| car → boat (variant) | truman | "L'ho accompagnata io" (night report) |
| car/boat → station | truman | the arrest; "Voglio che tu veda dove l'ho messo" |
| OEJ → guarded room | jacques | the arrest pages; "Renault piantonato" |
| landing → escort → station | hawk | the register's last signature; "Hawk scrive" |
| guarded → dead | jacques | Lucy's call (`m6_news`) |
| diner → home | maddy | "(Maddy saluta ed esce…)" |
| Roadhouse: statement → phone | giant | "(La sala riprende il suo tempo. Nessuno ha visto niente.)" |
| Roadhouse → closed | truman, crowd | the route commit at the crossroads: "Il Roadhouse ha chiuso" |
| diner → Roadhouse | norma, shelly, loglady, james | **B1** (no authored event yet) |

## 7. OFFSCREEN vs TERMINAL_REMOVED

Added to the contract §1: `OFFSCREEN` may mean physically present somewhere deliberately not represented as a body (traces may render it); `TERMINAL_REMOVED` means the named physical character can never return under the current story truth. Hiding a sprite is never a reason for `TERMINAL_REMOVED`. Added to §3: the **no silent vanish** rule (a window ends only on an authored event; nobody leaves the player's room without a visible beat; the ending state must be reached after leaving the room or its node must author the exit).

## 8. Validator cases that would catch each defect

`artifacts/world-character-audit/validation-plan.md` "Regression corpus": RC1 Hawk at OEJ (V5 + V5b scene-required presence: `m6_arrest.map_id = oej` names `hawk` in its pages), RC2 Roadhouse depopulation (V5 pin `ACT4_POST_PHONE_INSIDE` + V6b: the exit node `m8_roadhouse_phone` is on the map where the crowd stands and authors no departure), RC3 Jacques alive (V5 + terminal-only-on-death lint), RC4 Maddy, RC5 Truman, RC6 Hawk escort, RC7 B1 must fail loudly until closed, RC8 order independence on the Act 3 chain. New validator clauses in the contract: **V5b** (every actor node's character resolves to the node's map when its conditions hold; page-asserted presences pinned per act) and **V6b** (window exits on a map the departing character occupies must name the page that authors the departure).

## 9. Confirmation

No runtime implementation occurred: no resolver, registry, validator code, NPC migration, mission JSON, dialogue, Act 3/4 structure, environment production or M9 work. Files changed: this report, `docs/cast-continuity-contract-v0.1.md` (semantics + no-silent-vanish + V5b/V6b), `docs/cast-continuity-lead-decisions-v0.1.md` (§8b amendment), `artifacts/world-character-audit/cast-windows-acts-1-4.md` (corrected truth), `artifacts/world-character-audit/validation-plan.md` (regression corpus), `CANONICAL-SYNC.md`.

## 10. Verdict

**NOT READY — one lead blocker (B1).** Everything else in Acts 1–4 is internally consistent and mechanically compilable: Hawk, Truman, Jacques, Maddy, the Roadhouse exit and the Act 3 chain are fixed from frozen text. The Act 4 cluster migration cannot start until the lead chooses how the four diner regulars leave the Double R without vanishing in front of Cooper (`cast-windows-acts-1-4.md` §8 B1, options a/b). Once B1 is closed with one line in the truth file, the verdict becomes READY without further audit.
