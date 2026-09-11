# Act 4 (M8) Cast Window Inventory — Story Design vs Engine

Sources read: `docs/story/timeline.md` (T50–T59), `docs/story/truth.md`, `docs/story/characters/{truman,hawk,sarah,leland,maddy,giant,donna}.md`, `artifacts/act-4-design/{offscreen-timeline,scene-contracts,route-trace,environment-requirements}.md`, `narrative/missions/M8.json` (full, 1606 lines), `js/narrative-engine-adapter.js` (`NARRATIVE_ENTITIES` + `WORLD_TARGETS`), `js/glue.js` (`NPCS`), `js/narrative-production.js` (`gigante2` derivation).

`docs/act-4-design-report.md` / `docs/act-4-implementation-pass-01-report.md` were read but not separately quoted below — their content is already covered by the four artifact files (offscreen-timeline, scene-contracts, route-trace, environment-requirements).

## Windows

### W1 — Afternoon diner
Entry `flag:atto4 ∧ ¬value_set:promise_stance` (`m8_diner.conditions`, M8.json:214-219). Exit: `value_set:promise_stance` (one of `promise_accompagno/autonomia/prudenza`, M8.json:275-330).

| character | location (design) | cause | citation |
|---|---|---|---|
| Maddy | diner | `m8_diner` scene itself | M8.json:210-338 |
| Leland | diner, at the counter beside Maddy, silent | `m8_leland_waiting` (¬promise_stance) | M8.json:346-389; scene-contracts S1b |
| Norma | diner counter | environment note: "Norma at the counter (present)" | environment-requirements.md:7 |
| Log Lady | UNSPECIFIED by M8 design for this exact window (classic `loglady` NPC has no Act-4 cond) | — | js/glue.js diner list |
| Truman, Lucy, Hawk, Andy | UNSPECIFIED by design | — | — |
| Sarah | Palmer house (optional vision `sarah_visione`, afternoon/evening window) | classic `sarah` cond `!flag:gigante2` | js/glue.js:36; scene-contracts L3 |
| all others (Jacoby, Bobby, Donna, James, Shelly, Jacques, Ronette, Audrey, Benhorne, Gerard, Giant, mfap, Bob, Laura, Infermiera) | UNSPECIFIED by design | — | — |

Engine today: Maddy entity `diner {flag:atto4, ¬value_set:promise_stance}` (adapter:228-232); Leland entity `diner {flag:atto4, ¬evidence:T_LELAND_TAXI}` (adapter:238-242, spans W1+W2); Norma/Log Lady/James/Shelly are classic diner NPCs, no Act-4 cond (glue.js:57-64); Sarah classic `palmer` cond `!flag:gigante2` (glue.js:36); Bobby/Donna/Jacoby classic town NPCs, cond `!flag:gigante2` (glue.js:16-21).

### W2 — After promise, before Roadhouse statement
Entry `value_set:promise_stance ∧ ¬evidence:T_LELAND_TAXI` → `m8_leland_taxi` fires (mandatory), then holds until `¬value_set:presagio_status` (`m8_roadhouse_truman.conditions`, M8.json:394-406).

| character | location (design) | cause | citation |
|---|---|---|---|
| Leland | diner counter, until `T_LELAND_TAXI` evidence is set, then GONE (no further diner entity) | `m8_leland_taxi`, entity `when:¬evidence:T_LELAND_TAXI` | M8.json:632-737; adapter:238-242 |
| Maddy | OFFSCREEN — "sera, torna a casa Palmer" (T1, author-only declarative) | timeline | offscreen-timeline.md:12 (T1); timeline.md:65 (T51) |
| "Who is at the Roadhouse already?" | **UNSPECIFIED by the design docs** — S3's contract only fixes the scene at the moment Cooper arrives ("Il paese c'è tutto"); no source dates the crowd's arrival earlier | scene-contracts S3 | scene-contracts.md:47-58 |

Engine today (conflict): the Roadhouse crowd entities (Truman, Bobby, Donna, James, Shelly, Norma, Log Lady) all carry `when:{flag:atto4, ¬value_set:warning_target}` — **no gate on `presagio_status`** — so mechanically they are present at the Roadhouse for the *entire* act from the moment `atto4` opens, i.e. already during W1/W2, not just after the statement (adapter:254-291). Since several of these ids (Norma, Log Lady, James, Shelly) are *also* classic map NPCs with no Act-4 `cond` (diner list, glue.js:57-64) and Bobby/Donna are classic town NPCs gated only on `!flag:gigante2` (glue.js:16-21), **duplicate bodies exist** for Norma/Log Lady/James/Shelly (diner + roadhouse simultaneously) and for Bobby/Donna (town + roadhouse simultaneously) throughout W1–W3, until `gigante2` flips town-side and `warning_target` clears the Roadhouse-side. This is an engine-today fact, not a design statement.

### W3 — Roadhouse pre-phone
Entry `value_is:{presagio_status,active}` (written by `m8_roadhouse_truman` effects, M8.json:438-449). Exit `value_set:warning_target`.

| character | location (design) | cause | citation |
|---|---|---|---|
| Truman | Roadhouse, at his table | `m8_roadhouse_truman` (actor node) | M8.json:391-457 |
| Crowd ("il paese c'è tutto") | Roadhouse | S3 point 2/5, draft entity list `bobby, donna, james, shelly, norma, loglady, truman` | scene-contracts S3; offscreen-timeline.md:30-31 (absences table) |
| Giant | Roadhouse stage, silent | `m8_giant_stage` | M8.json:460-497 |
| Hawk | absent, "on patrol" | draft §4.6 | offscreen-timeline.md:32 |
| Andy | absent (station) | draft §4.6 | offscreen-timeline.md:33 |
| Leland, Maddy, Sarah | absent by design ("the Palmers") | draft §4.6; Sarah hidden by `!flag:gigante2` once `gigante2`=true | offscreen-timeline.md:30-31 |

Engine today: full crowd list matches design (Truman 4,8; Bobby 3,4; Donna 5,4; James 2,4; Shelly 3,6; Norma 5,6; Log Lady 2,6; Gigante 8,1 gated additionally on `presagio_status=active`) — adapter:254-298. `gigante2` is derived here: `if (state.nodes_done.m8_roadhouse_truman) classicFlags.gigante2 = true` (js/narrative-production.js:166), which is what hides classic Sarah/Bobby/Donna/Jacoby (`!flag:gigante2` cond, glue.js:16-21, 36).

**Engine today table (W3):**

| character | map(s) with a body | cond / when |
|---|---|---|
| Truman | roadhouse (narrative entity) + sheriff (classic, no cond — duplicate) | `{flag:atto4, ¬value_set:warning_target}` (adapter:254-256); classic sheriff Truman has no cond (glue.js:24) |
| Bobby, Donna | roadhouse (narrative entity) | `{flag:atto4, ¬value_set:warning_target}` (adapter:259-270); town classic hidden by `!flag:gigante2`, which is now true |
| James, Shelly | roadhouse (narrative entity) only — classic diner James/Shelly have no Act-4 cond, so they are ALSO still "at" diner in classic data | adapter:273-281; glue.js:60-63 |
| Norma, Log Lady | roadhouse (narrative entity) only in intent; classic diner Norma/Log Lady have no Act-4 cond — same duplicate risk | adapter:283-290; glue.js:57-59 |
| Giant | roadhouse stage 8,1 | `{value_is:{presagio_status,active}, ¬value_set:warning_target}` (adapter:295-298) |
| Sarah | hidden (Palmer classic, `!flag:gigante2` now false) | glue.js:36 |
| Hawk, Andy | sheriff (classic default, no cond) | glue.js:29-30 |

### W4 — Post-phone routes
Entry `value_set:warning_target ∧ ¬flag:maddy_trovata`, sub-split by `focus_destination` unset (`m8_focus_choice`, M8.json:859-937) vs set (route nodes 947-1116).

Design per branch:

| character | `warning=palmer` | `warning=centrale` | `warning=nessuno` |
|---|---|---|---|
| Maddy | stays with Sarah, prepares valise in the hall ("Resto con lei. La valigia la porto nell'ingresso…") | UNSPECIFIED (no reaction page) | UNSPECIFIED |
| Sarah | asleep/with Maddy, doors closed | UNSPECIFIED (implied: covered later by Andy, per `sarah_support_state=vice`) | UNSPECIFIED |
| Andy | UNSPECIFIED | dispatched to Palmer house: "Mando Andy a casa Palmer, agente. Ci mette dieci minuti." | UNSPECIFIED |
| Lucy | UNSPECIFIED | routes the call, dispatches Andy | UNSPECIFIED |

Citations: M8.json:532-616 (`m8_roadhouse_phone` choices/feedback).

Norma at the diner route: "Maddy? Ha chiesto della fermata del lago. Poi è tornata dai Palmer. Non era ancora partita." (`m8.c.route_diner.p01`, M8.json:1082-1086). Norma actor node target diner, M8.json:1110-1113.

Focus-destination split (`m8_focus_choice` at `town_crossroads`, M8.json:859-944; landmark coords `town.town_crossroads = {x:47,y:30}`, adapter WORLD_TARGETS):

- `focus=palmer` → `m8_route_palmer` (map `palmer`, target `palmer_entrance`): "(La casa: buio al piano di sopra.)"; valise/note page visible ONLY if `warning_target=palmer` ("In ingresso, la valigia. Sotto la porta di Sarah, un biglietto…"); phone rings — Lucy: "Agente — una chiamata anonima, qualcosa sulla riva del lago. Hawk è già in strada." → writes `body_found_by=hawk`. M8.json:947-1014.
- `focus=lago` → `m8_route_lake` (map `town`, target `lago_maddy`): Cooper arrives first, writes `body_found_by=cooper`. M8.json:1017-1061.
- `focus=diner` → `m8_route_diner` (map `diner`, actor Norma): writes `body_found_by=hawk`, radio call. M8.json:1064-1116.

Crowd/Roadhouse: closed — all crowd `when` gates require `¬value_set:warning_target`, now false, so mechanically empty; design confirms via repeat line "Il Roadhouse ha chiuso. Da qui, le strade sono solo distanza." (M8.json:938-944). Hawk: still not dispatched by any writer in this window (dispatch is the offscreen T7 anonymous call, independent of player choice) — UNSPECIFIED location, world-process only, until `body_found_by` resolves.

**Engine today table (W4):** no `NARRATIVE_ENTITIES` entries fire in this window except the hawk_shore entities, which require `body_found_by` set (see W5) — so mechanically nobody but classic-default NPCs (Truman/Lucy/Hawk/Andy at sheriff, no cond) populate any map besides the route target itself.

### W5 — Shore discovery
Entry `flag:maddy_trovata ∧ ¬node_done:m8_station`, split by `body_found_by`.

| character | `body_found_by=hawk` | `body_found_by=cooper` |
|---|---|---|
| Hawk | already at shore, perimeter marked, "L'ho trovata io. Non l'ho mossa. Non ho toccato le mani. Guarda l'anulare." | arrives after Cooper with the deputy, torches: "(Arrivano le torce di Hawk e del vice. Cooper non si è mosso di un passo.)" |
| deputy | not present in `hawk` case pages | mentioned only in caption, no sprite ("il deputato non esiste come sprite proprio," route-trace O-note) |
| Cooper | arrives to a preserved perimeter, does not move | is first, stops before the perimeter, "(fermo) Signorina Ferguson. Maddy. Con due D." | 
| Sarah | UNSPECIFIED (home, asleep by design; never at the shore — "does not find the body") | same |
| Andy, Truman | UNSPECIFIED in this exact window (Truman's pass-by Sarah is implied to precede the station scene, never dramatized) | same |

Citations: M8.json:1118-1230 (`m8_discovery` pages_by_value + effects: `E9A_LETTERA_O`, `E9B_STESSO_METODO`, `presagio_status: active→verified`, `flag maddy_trovata` set); characters/sarah.md:36 ("does not find the body"); offscreen-timeline.md T7 row.

`m8_discovery` chains mandatorily into `m8_promise_echo` (Cooper's monologue by `promise_stance`, M8.json:1231-1307), then `m8_cmp_letters`/`m8_cmp_diary` (notebook comparisons, no character location content, M8.json:1309-1472).

Engine today: `hawk_shore_after` entity `{flag:maddy_trovata, ¬node_done:m8_station}` at town 16,27 (adapter:312-316) — present regardless of which branch, matching both text variants loosely (design distinguishes "already there" vs "torches arriving," engine renders one static sprite either way — a design/engine granularity gap, not a contradiction). `hawk_shore_first` entity `{value_is:{body_found_by,hawk}, ¬flag:maddy_trovata}` at the same coords covers the pre-discovery moment on the `hawk` branch only (adapter:308-311).

### W6 — Station before dawn
Entry `node_done:m8_station`, i.e. `proposition_path:P8.formulation.status=formulated` (M8.json:1477-1481). Exit is Act 5 (`atto5`, out of M8 scope).

| character | location (design) | cause | citation |
|---|---|---|---|
| Truman | sheriff station | `m8_station` actor node | M8.json:1474-1601 |
| Cooper | sheriff station | player | — |
| Sarah | Palmer house, covered — `sarah_support_state=vice`: "Andy era già con Sarah quando è arrivata la chiamata." / `=none`: "Sono passato io da Sarah prima di tornare qui. Adesso Andy resta con lei." | `m8_station.pages_by_value` | M8.json:1483-1505 |
| Andy | with Sarah (either branch), not at the station | same | M8.json:1488-1502 |
| Lucy | UNSPECIFIED by M8 text at this exact beat (design gap; `m8_lucy`'s own conditions `¬node_done:m8_station` go false the instant this node completes) | — | M8.json:742-750 |
| Hawk | UNSPECIFIED — the `hawk_shore_after` entity's `when` also requires `¬node_done:m8_station`, so it disappears the instant this node completes, with no replacement location written anywhere | — | adapter:313-315 |

Additional conditional pages at this node: `p_lago` (if `focus_destination=lago`) fills in who received the anonymous call while Cooper was already at the lake ("La chiamata sulla riva è arrivata qui mentre tu eri già al lago. Un civile, senza nome; Hawk è partito subito.", M8.json:1516-1527); `p_valigia` (if `warning_target=palmer ∧ focus_destination≠palmer`) relays the valise/note through Truman ("In ingresso c'era la valigia pronta, e un biglietto per Sarah. Voleva partire domattina.", M8.json:1530-1553). The hook (`hook.p01`/`hook.p02`) has Cooper read back the taxi hour and Truman commit to verifying it before 7am, M8.json:1570-1582.

**Engine today table (W6):** Truman at sheriff (actor node target, `m8_station`); no other `NARRATIVE_ENTITIES` entry has a `when` that remains true once `node_done:m8_station` — Lucy and Hawk both fall back to their classic no-cond sheriff placements (glue.js:24-30), which happen to coincide with "at the station" but are not narratively asserted for Hawk (he is textually elsewhere, with Sarah's coverage having already happened offscreen) or contradicted for Lucy.

## Branch values written by M8 choices (a)

| value | domain | writer node / choice |
|---|---|---|
| `promise_stance` | `accompagno` / `autonomia` / `prudenza` | `m8_diner` choices `promise_accompagno`/`promise_autonomia`/`promise_prudenza` (M8.json:275-330) |
| `warning_target` | `palmer` / `centrale` / `nessuno` | `m8_roadhouse_phone` choices `warning_palmer`/`warning_centrale`/`warning_nessuno` (M8.json:532-616) |
| `maddy_action_after_warning` | `departure_prepared` (palmer) / `none` (centrale) / `none` (nessuno) | same node, same choices (M8.json:540-543, 574-577, 601-604) |
| `sarah_support_state` | `none` (palmer) / `vice` (centrale) / `none` (nessuno) | same node, same choices (M8.json:544-547, 578-581, 605-608) |
| `focus_destination` | `palmer` / `lago` / `diner` | `m8_focus_choice` choices `focus_palmer`/`focus_lago`/`focus_diner` (M8.json:897-925) |
| `body_found_by` | `hawk` (route_palmer) / `cooper` (route_lake) / `hawk` (route_diner) | `m8_route_palmer`:1001-1006, `m8_route_lake`:1047-1052, `m8_route_diner`:1101-1106 |

## Requested wording (b)

**James at the Roadhouse.** No page individually stages his arrival. He exists only as a silent roadhouse-crowd entity (`{id:'james', x:2, y:4, dialogue:null}`, `when:{flag:atto4, ¬value_set:warning_target}`, adapter:273-276), drawn from the design's undifferentiated entity list `bobby, donna, james, shelly, norma, loglady, truman` (draft §4.6, cited at offscreen-timeline.md:30-31 and scene-contracts.md via S3 point 5). No design text explains how or when he got there.

**Norma's return to the diner (`route_diner` page).** `m8.c.route_diner.p01`, speaker Norma: *"Maddy? Ha chiesto della fermata del lago. Poi è tornata dai Palmer. Non era ancora partita."* (M8.json:1082-1086).

## Design statements on Sarah at night / Andy at Palmer / Jacoby at night (c)

- **Sarah at night:** `m8_station.invariant` states explicitly "Sarah non è mai oracolo (dorme; il vice la sostiene, non scopre corpi)" (M8.json:1592) — she sleeps; `characters/sarah.md:36` locks "does not find the body." No design source places her anywhere but the Palmer house.
- **Andy at the Palmer house:** only stated on the `warning_centrale` branch — Lucy: *"Mando Andy a casa Palmer, agente. Ci mette dieci minuti."* (M8.json:588) — and retrospectively at the station, `sarah_support_state=vice`: *"Andy era già con Sarah quando è arrivata la chiamata."* (M8.json:1492). No design statement covers Andy on the `palmer`/`nessuno` branches.
- **Jacoby at night:** no design source (timeline, truth, offscreen-timeline, scene-contracts, route-trace, environment-requirements) mentions Jacoby in Act 4 at all. UNSPECIFIED by design. Engine hides classic Jacoby (`cond:'!flag:gigante2'`, glue.js:20) once the Roadhouse statement fires, but he is **not** among the roadhouse crowd entities (adapter:254-298) — so post-statement he has no location anywhere in the engine, a gap rather than a deliberate absence.

## Conflicts between design sources (d)

1. **Roadhouse crowd timing.** Route-trace/offscreen-timeline (2026-09-10 audit) describe the Roadhouse crowd staging as "none yet (staging proposed)" (offscreen-timeline.md:30-35) and scene-contracts S3 marks the split node "READY WITH STUB." The live `narrative-engine-adapter.js` (adapter:254-298) already implements this staging, gated only on `warning_target`, not `presagio_status` — meaning engine-today crowd presence starts earlier (whole act) than the design windows imply, and creates duplicate bodies with classic diner/town NPCs (Norma, Log Lady, James, Shelly, Bobby, Donna) until `gigante2`/`warning_target` clear them. This is a documentation-lag conflict: the artifact files predate a later implementation pass not reflected back into them.
2. **"None yet" vs shipped `m8_route_diner.actor_id: norma`.** Scene-contracts L5 describes the diner route as "Norma answers with what she saw" without flagging it as an actor node; route-trace doesn't list Norma among O-list defects — no real conflict, just confirms it's live.
3. **Sarah's `gigante2` cond source of truth.** Route-trace O6 flags a genuine engine timing risk (`gigante2` set async via a 180ms poll, not same-tick as node commit) that could leave Sarah/Maddy/Leland visible at Palmer briefly after the Roadhouse statement — this is an engine defect noted in the design docs themselves (route-trace.md:104-120), not a design contradiction.
4. **Hawk's shore presence window vs station window.** `hawk_shore_after`'s `when` requires `¬node_done:m8_station` (adapter:313-315), so Hawk vanishes from every map the instant the station beat completes, while `m8_station`'s own text never relocates him — no design source resolves where Hawk stands during W6; treated as a gap above, not asserted as a location.

No other named-character location claim in the higher-priority sources (`docs/story/*`) contradicts the M8.json data; the story-truth layer intentionally leaves Act 4 physical blocking to the M8 package and only fixes the *authorial* facts (who killed whom, what stays hidden).
