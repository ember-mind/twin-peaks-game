# Act 4 — narrative + gameplay design report (M8 under Narrative System v0.1 + Story Truth v0.1)

Date: 2026-09-10. Design only: no mission JSON, no runtime dialogue, no art, no engine change. Inputs: the live topology (`artifacts/act-4-design/topology.md`), the verbatim M8 corpus (`m8-extraction.md`), the measured current path (`pacing-current.md`), the environment inventory, the vault M8 v1.1 LOCK (with re-lock R12), Story Truth v0.1 (`docs/story/`), the Narrative System v0.1 and Craft Bible. Artifacts: `artifacts/act-4-design/{topology, fact-knowledge-ledger, setup-payoff-ledger, evidence-map, scene-contracts, voice-contracts, doctrine-audit, environment-requirements, offscreen-timeline, route-trace, pacing-current}.md`.

**One-paragraph answer.** Act 4 is *the warning without an address*: Cooper has been told "it will happen again" by something that does not use method, and nothing he knows how to do — read a scene, question a witness — applies to a sentence in the future tense. So he looks at the living. The act's gameplay is **attention allocation under uncertainty**: whom to look at in the afternoon, whom to warn on the phone, where to run in the night — and the design's honesty is that none of it changes whether Maddy dies; it changes who knew, who was with Sarah, who found her, what she did in her last hours, and what Cooper can say afterwards. Maddy is the act's human centre and she is never a clue: she is a woman with a job held for her until Monday, a 7:40 coach, and one more day given to an aunt. The method returns only on the shore, and when it returns it reads *forward*: the R of Act 1 was not an initial but a count, and the one thing left that a county can check is an hour a composed man said in daylight. The act ends on that hour. No new engine primitive is needed; three classic bridges and one classic scene are retired; two beats get staging so that what the pages assert ("il paese c'è tutto"; "arrivano le torce") is on screen.

**Doctrine audit (2026-09-10, frozen with this report).** `artifacts/act-4-design/doctrine-audit.md`. Verdict: *structurally valid with three repairs* — **R1** the afternoon is a look, not a fetch (Leland visible beside Maddy from the first frame; the town's evening announced by a person; Sarah's afternoon window closed at night) · **R2** the Roadhouse as a room (crowd present, Truman as the actor, the Giant a silent presence on the stage after the statement, the phone as the action, the crossroads at the door) · **R3** the end hook is a scene and the arithmetic stays unsaid (the taxi hour put on the table; nobody counts letters; the referent of "di nuovo" stays open). Mechanical O-list folded into §14.

---

## 1. Experience promise

What the act does to the player: it takes away the verb the player has learned to trust (examine → compare → theory → present) and replaces it, for one evening, with a verb the game has never asked for: *decide where insufficient attention goes*. The player should leave the act able to say what they changed (who knew, who was there, what was preserved, which promise is unpaid) without believing they could have saved her; and remembering Maddy for the napkin with three departures and "con due D", not for the shore (M8 lock §14, adopted as the act's success criterion — a hypothesis until humans test it).

Freeze banner: NOT FROZEN — design ready for implementation; no human test on Acts 1–3 yet (§14 lists what should wait for it).

## 2. Dramatic engine

- **Value conflict:** knowing versus protecting. Acts 1–3 taught Cooper that knowing more protects more; Act 4 gives him a warning he cannot turn into protection, and a woman he does not know is in danger sitting next to the man who is.
- **ACT 4 WANT (Cooper):** find who "ancora" is about, and be there. Concretely: look at the people near Laura (the counter, the house, the town) because the objects and the witness have stopped speaking.
- **OBSTACLE:** the statement has a tense and no address; the method needs a fact and the only facts of the afternoon are ordinary (a timetable, a bill, a taxi at seven); the town is in one room and the danger is in another.
- **OPPOSITION ACTING WITHOUT WAITING:** Leland pays Maddy's bill, declares a taxi, leaves the diner before Cooper, and is inside the house by evening (T0.5–T2). While the town is at the Roadhouse he acts (T5–T6); a civilian's call, not Cooper's, sends Hawk to the shore (T7). `artifacts/act-4-design/offscreen-timeline.md`.
- **CORE PLAYER QUESTION:** whom is this about, and where should I be?
- **HUMAN REVELATION:** Maddy has a life of her own that has nothing to do with the case; the danger is not a stranger on a road but the composure of the family; Cooper's method cannot protect, only verify.
- **MYSTERY REVELATION:** the R was one piece of a series announced in the diary (P8, ceiling corroborated); the taxi story is the only checkable claim in the whole act.
- **ESCALATION:** in Act 3 the method won and then failed the witness; in Act 4 the method is not applicable until after the loss. The class of action changes twice: from reading to acting-before-certainty, and back to reading with a changed object (the letters read forward).
- **ACT TURN:** the shore. Before it, Cooper allocates; after it, he reads a serial signature and holds one verifiable hour.
- **END HOOK (a scene):** the station before dawn (S8): Truman asks what is left "oltre a quello che abbiamo perso"; Cooper gives him the theory and then the hour — the seven o'clock taxi Leland said he called — and Truman answers with who checks it before it is day. Exit impulse: seven o'clock. M9 begins by verifying it.

Not this: "follow the Giant's clues." The Giant says one sentence and indicates nothing; the routing is the objective's, the meaning is the player's.

## 3. Production topology audit (what is live)

Full map with `file:line` in `artifacts/act-4-design/topology.md`. Summary:

- **Entry is mission-only.** `atto4` is written by `m6_atto4_bridge` (M6 completion); classic `truman_atto4` is shadowed forever (M4/M6 own Truman at the station).
- **M8 is a 12-node, 73-page linear chain** with three value branches (promise 3 × warning 3 × focus 3 = 27 routes) and a fixed tragedy. No optional node exists in M8.
- **Palmer house is dead in the classic layer** from `atto4` on: `narrative_m8_owned` is set in the same sync tick, so classic Maddy (`maddy_a4`: "Sono Maddy. Non Laura"), Leland (`leland_a4` dance/white hair, `leland_dove`, `leland_dopo`) never satisfy their own presence conditions. Both live at the diner as narrative entities.
- **Two classic survivors:** Sarah at Palmer (`sarah_visione`, feeds M9's carryover `T_SARAH_VISIONE`) and the Log Lady at the diner (`loglady_a4`: "stanotte, al roadhouse. Le civette sono già lì").
- **Gerard's Act 4 line is shadowed** (M4 owns Gerard at the hospital; `gerard_a2` stays a live root). The only "casa di legno … vent'anni" line in the build never plays.
- **`gigante2` is vestigial:** written by the sync bridge from `nodes_done.m8_roadhouse`; every reader is dead or shadowed.
- **Roadhouse is the thinnest map in the game:** no NPCs, empty interact table, the phone target only; the Giant's second appearance is pages, not a presence.
- **Shared tiles:** `lago_maddy` (15,28) and `town_crossroads` (30,30) coincide with classic interacts; the mission wins from `atto4`.
- **Tests:** `narrative-validate-m8` (4357 checks), three M8 harnesses (engine/physical/screentruth), no `act-4*` file. `test/walkthrough.js` stubs `gigante2` but not `narrative_m8_owned`, so the classic simulator walks `truman_atto4`, `gerard_a4`, `lago_maddy` — a path production never plays.
- **Schema delta is stale:** `narrative/schema-deltas/M8.md` §7 lists `value_transition`, `from_derivation`, `conditional_pages` as "to implement"; all three are in `js/narrative-runtime.js` (C8-B done). Documentation debt, not runtime debt.

Known-issue ownership (as briefed): `gerard_a4` "vent'anni" — shadowed, Act 4 owns → **CUT** (§7). M9 P7 known-open — M9 owns; Act 4 guarantees the premises and defers the writer (§7). `prepareChoice` condition hole — runtime debt, untouched. Great Northern lobby — unused by Act 4, visual debt only.

## 4. Current beat map (as built)

| # | beat | M/O | owner | state written | reader | defect? |
|---|---|---|---|---|---|---|
| 1 | Walk to the diner (obj 50 "Passa dal diner, questo pomeriggio") | M | M8 objective | — | — | a fetch, no want in the world; 87 s before the first choice |
| 2 | Diner: Maddy, the napkin, the promise (`m8_diner`) | M | M8 | `promise_stance` | Leland page, echo, M9 | none (the act's best scene) |
| 3 | Diner: Leland pays, the taxi (`m8_leland_taxi`) | M | M8 | `T_LELAND_TAXI` | Roadhouse gate, M9 | Leland appears only after the promise (entity `when`): the danger is never *beside* her on screen |
| 4 | Log Lady (classic `loglady_a4`) | O | classic | — | — | duplicates obj 100; harmless texture; owls = open setup |
| 5 | Sarah's vision (classic `sarah_visione`) | O | classic | `sarah_visione_ascoltata` | M9 carryover | page 3 has Sarah say "BOB" (guard violation: only Ronette sources the name); reachable at night after the tragedy (no window) |
| 6 | Gerard (classic `gerard_a4`) | O | classic | — | — | shadowed; "vent'anni" contradicts locked childhood; NPC vending |
| 7 | Roadhouse: the room, Truman, the statement, the phone (`m8_roadhouse`) | M | M8 | `presagio_status`, `warning_target`, `maddy_action_after_warning`, `sarah_support_state` | routes, station, M9 | one node does room + statement + phone; the crowd the page asserts is absent from the map; the Giant is a page; Truman is a line with no body on the map |
| 8 | Crossroads (`m8_focus_choice` at 30,30) | M | M8 | `focus_destination` | routes, station | the choice is made at the welcome sign south-west, not where the three directions diverge (the Roadhouse door) |
| 9a/b/c | Routes: Palmer (dark house, valise, Lucy's call) / lake (first) / diner (Norma, Hawk's radio) | M excl. | M8 | `body_found_by` | discovery | valise is a caption, not an object; town at night keeps its dusk and its wanderers |
| 10 | Discovery, two versions (`m8_discovery`) → echo (`m8_promise_echo`) | M | M8 | E9A, E9B, `letter_o_*`, `presagio verified`, `maddy_trovata` | comparisons, M9 | torches are a caption; the shore is a classic tile |
| 11 | Notebook: R↔O, letters↔diary → P8 (`m8_cmp_letters`, `m8_cmp_diary`) | M | M8 | observation; P8 | station, M9 | none; 69 s passive block with 10 |
| 12 | Station before dawn (`m8_station`) | M | M8 | — | M9 entry | the hook is the HUD line "Porta a Truman una contraddizione che regga"; no scene puts a checkable thing on the table |
| — | Classic bridges `truman_atto4`, `truman_atto5`, `lago_maddy` + `lettera_o` | — | classic | `atto4`, `atto5`, `maddy_trovata` | — | all shadowed; the simulator still walks them |

Also recorded: dialogue-only beats 2, 3, 7, 12; environmental beats 9a (house), 10 (shore); player deductions 11 (two); choices 2, 7, 8, 11; travel 1, 7, 8, 9; supernatural 7; major character moments 2 (Maddy), 10 (Cooper's monologue), 12 (Truman's loss).

## 5. Critical diagnosis

1. **The act opens on a fetch.** After the M6 bridge, Cooper's only reason to go to the diner is objective 50. Mechanism: scene test (no want in the world) + Bible §14 "the final hook is a scene" applied to the opening. Line: `obj_m8_0`. Kept by decision (M6 is frozen; the HUD text is honest); repaired by giving the afternoon a look (R1: Leland beside her; Lucy's optional evening line; the crowd later).
2. **The danger is never beside her on screen.** `NARRATIVE_ENTITIES.leland` appears only after `promise_stance` (`js/narrative-engine-adapter.js:230-234`). The act's central irony — the uncle who administers her morning — is delivered by a caption ("Leland posa il conto") after she has left. Mechanism: channel selection (environment should carry it). R1.
3. **Sarah names BOB** (`js/data.js` `sarah_visione` p3: "BOB. È il nome che mi viene"). Story truth: her sentences stop before the name; Ronette is the only source (`truman_atto5`, Bible). Mechanism: knowledge gate / wording guard. Fix: rewrite page 3 (Act 4 owns; classic ownership kept).
4. **Sarah has no window.** The classic Sarah NPC stays interactable at night after the tragedy; the vision would play with the deputy in the house. Mechanism: route causality (access with wrong antecedent). Fix: hide when `gigante2` (gives the vestigial flag a live reader).
5. **The Roadhouse is a page, not a room.** `m8.b.roadhouse.p01` asserts "Il paese c'è tutto"; the map has no NPCs; Truman speaks (`p02`) without being on the map; the Giant "appears" as text. Mechanism: world necessity (the world dresses the scene instead of causing it) + channel (dialogue describing what should be on screen). R2.
6. **The crossroads is in the wrong place.** The choice fires at 30,30 (welcome sign) after a walk west; the labels talk about distances from the Roadhouse door. Mechanism: world necessity / legibility of cost. R2.
7. **The end hook is a HUD line.** `obj_m8_4` "Porta a Truman una contraddizione che regga" points at M9 with nothing on the table in the scene. Mechanism: Bible §14 final hook. R3.
8. **Gerard vends the house.** `gerard_a4` hands "una casa di legno" and a duration that contradicts locked truth; it is shadowed anyway. Mechanism: NPC vending + knowledge. Cut.
9. **The classic simulator is green on a path production does not play** (`test/walkthrough.js` stubs). Mechanism: harness false-green (Bible §10 "attack the harness"). Fix: stub `narrative_m8_owned`; retire the shadowed classic bridges so the two layers agree.
10. **Schema delta stale** (three primitives listed as unimplemented, all implemented). Documentation debt; fix in the implementation pass.
11. **The diary rule has two player-facing wordings.** Act 1 document (`js/data.js:32,46`) vs the M8 re-read (`m8.e.cmp_diary.p02/p02b`). Mechanism: knowledge/continuity (a re-read must quote the document held). Authority: Bible PATCH §1 left the formulation OPEN; the M8 v1.1 LOCK closed it. Decision recorded in `docs/story/CHANGELOG.md`; the Act 1 text is aligned in the implementation pass (A4).
12. **The world's process is invisible on the lake route.** `focus=lago`: the anonymous call (T7) is never rendered; Hawk's torches arrive without cause. Mechanism: offscreen opposition legibility. Fix: one conditional Truman page at S8 (B7).

**What is good and must be kept:** the napkin scene (autonomous, no foreboding, her correction is hers); the three-stance promise with per-branch counter-moves and the object-mediated echo at the shore; the phone with intention labels and three different world reactions; the walk-your-route rule (no goto); the two discovery versions and Hawk's preserved scene; the two comparisons with retryable overreach feedback (name / house) and the P8 ceiling; Truman's logistic grief; the 27-path contract and the suitcase truth table; the false-guilt hygiene of §14 of the lock ("solo distanza", no "troppo tardi"); `maddy_departure_plan` as her own agenda. None of it is changed.

## 6. Proposed beat map

| # | beat | M/O | PURPOSE | PLAYER ACTION | PLAYER QUESTION | NEW INFORMATION | STATE/EVIDENCE | CHARACTER FUNCTION | FORWARD HOOK |
|---|---|---|---|---|---|---|---|---|---|
| 4.0 | ACT OPEN — the bridge (frozen M6) and the walk | M | carry the warning into daylight | walk to the diner | who is "ancora" about? | (frozen) a guard is a case, a giant is not | `atto4` | Truman files what can be filed | the diner (obj 50) |
| 4.0b | Lucy at the switchboard (`m8_lucy`, PROPOSED: one node, three conditional pages across the act + repeat) | O | put the Roadhouse in the world before the HUD does; never a mute Lucy | talk to Lucy | where is everyone tonight? | the town gathers at the Roadhouse; Norma closes early (later: the switchboard mute at that hour) | — | Lucy routes people | the counter, then the room |
| 4.1 | The napkin (`m8_diner` KEEP; Leland present from the first frame, S1b `m8_leland_waiting` PROPOSED) | M | the ordinary future; the stance | listen; choose a promise | who is she? | 7:40, the lake stop, the switchboard held until Monday, one day for Sarah; "con due D" | `promise_stance` | Maddy: a person with a plan; Leland: the host who pays, silent; Norma: the room | the taxi |
| 4.2 | The bill and the taxi (`m8_leland_taxi` KEEP) | M | the one claim of the act | talk to Leland | how does she leave? | Twin Peaks Taxi, seven; (accompagno) waits until 7:10 | `T_LELAND_TAXI` | Leland administers her morning | seven o'clock (paid at S8/M9) |
| 4.3 | Log Lady (classic KEEP) | O | a second channel names the place | talk | what are the owls? | Roadhouse tonight; owls already there | — | wayfinding without HUD | statement 2 stays open |
| 4.4 | Sarah's afternoon (classic `sarah_visione`, p3 REWRITE, window closed at night) | O | the house returns; the face was inside | talk | what did she see? | the sofa, the crouched man, the smile; the name does not arrive | `sarah_visione_ascoltata` | Sarah: witness, never oracle | P7 premise (M9) |
| 4.5 | Gerard | — | CUT | — | — | — | — | — | — |
| 4.6 | The room slows (`m8_roadhouse_truman` PROPOSED split; pages KEEP; `m8_giant_stage` one-line node; objective rung 150 "Il telefono del Roadhouse.") | M | witness the statement among the whole town | walk to Truman's table | why here? who is not here? | "Sta accadendo di nuovo."; the room resumes; the Giant on the stage, silent | `presagio_status=active`, note; classic `gigante2` flips here | Truman keeps an appointment; the town is present; the Giant says one thing | the phone |
| 4.7 | The phone (`m8_roadhouse_phone`, choices KEEP) | M | make someone move with the little that can be said | choose whom to warn | whom? | Maddy's own action / Andy in ten minutes / the door | `warning_target`, `maddy_action_after_warning`, `sarah_support_state` | Maddy answers a warning with housekeeping; Lucy dispatches | where |
| 4.8 | The threshold (`m8_focus_choice` KEEP; target moved to town 47,30, faced on exit; repeat page added) | M | decide where attention goes with no fact to prefer | choose; walk | where? | distances (labels) | `focus_destination` | Cooper refuses to rank | the route |
| 4.9 | Routes (KEEP; the valise stays the built caption; wanderers absent at night) | M excl. | arrive after the world | walk; enter | — | dark upstairs + valise/note (if warned); the shore first; Norma + Hawk's radio | `body_found_by` | Lucy/Norma/Hawk: the world is ahead | the shore |
| 4.10 | The shore (`m8_discovery` + `m8_promise_echo` KEEP; torches as entities) | M | the referent; the name said right; the promise read back | approach; stop | what is "di nuovo"? | the O; same incision as the R; who arrived first | E9A, E9B, `letter_o_*`, `presagio verified`, `maddy_trovata` | Cooper protects the scene and quotes her; Hawk preserved it | the notebook |
| 4.11 | The letters and the diary (KEEP) | M | read forward | compare twice; formulate | what does the O change? | an order R→O; "un pezzo alla volta" was a count | observation; P8 | — | the station |
| 4.12 | Before dawn (`m8_station` KEEP + hook pages PROPOSED) | M | inventory what is left; put the checkable hour on the table | talk to Truman | what holds? | who is with Sarah; the valise if unseen; the taxi at seven | — | Truman: logistics of loss; Cooper: the note read aloud | M9: verify the booking |

**Escalation check:** ordinary → warning → allocation → loss → reading forward → one verifiable hour. Each stage removes an option the previous one had (after the statement, staying is a choice; after the shore, warning is impossible; after P8, only verification remains).
**Counts:** player deductions 2 (R↔O; letters↔diary), positional beats 3 (the threshold, the shore approach, the Giant on the stage), optional discoveries 4 (Lucy, Log Lady, Sarah, the Giant's silence), stances 1, intentions 2, exclusive routes 3.
**ACT OPEN** 4.0 · **MIDPOINT / MAJOR REVALUATION** 4.6–4.7 (the sentence in the present tense; the town in one room and the house empty of everyone but the family) · **CRISIS / TURN** 4.10 (the shore) · **END HOOK** 4.12 (seven o'clock).

## 7. Evidence model summary

Full table in `artifacts/act-4-design/evidence-map.md`. KEEP: every M8 atom, value, comparison and proposition as built. REWRITE: readers of `gigante2` (Sarah's window, town wanderers, night state), `sarah_visione` page 3, the valise caption (object on screen). MERGE: none. CUT: classic `lettera_o` item + `lago_maddy`, `gerard_a4`, `maddy_a4`, `leland_a4`/`dove`/`dopo`, `truman_atto4`/`atto5`/`wait5` (all shadowed or dead). DEFER: P7 formulation (premises guaranteed here; the writer belongs to the M9 pass, which owns the reader). ADD: none (no new atom, value or proposition).

## 8. Companion / secondary character roles

- **Truman** — keeps an appointment he cannot file (Roadhouse), then turns the loss into dispatch (Andy with Sarah; who checks the taxi). He never says "I believe you" and never accuses a friend.
- **Hawk** — on patrol all evening (absent from the room by function), sent to the shore by a civilian's call; hands over a preserved scene and asks to be told he did right.
- **Lucy** — routes: the evening (optional), Andy (branch), the anonymous call (route). Never comments.
- **Norma** — the room: the cup refilled without asking; later the only person who can say Maddy went back to the Palmers.
- **Leland** — present, paying, silent; then the taxi; then absent from every line of the night (the tell the player may notice).
- **Sarah** — the afternoon witness with a window; at night asleep, then supported; never in scene after the news.
- **The Log Lady** — a second channel naming the place; the owls left open.
- **The Giant** — one sentence; a presence on the stage that indicates nothing.
- **Maddy** — the human centre; see §2 and the scene contract S1: what she wants (home, the job, her name), what she expects (7:40, a taxi at seven, one calm night for Sarah), what she does (chooses a departure on a napkin; corrects a stranger; carries her valise to the hall so as not to wake her aunt). What Cooper notices: the times, the correction. What he fails to notice: the man paying her bill; where she sleeps tonight. What the player may notice: both. Destructive test (setup ledger #1/#3): deleting the napkin scene voids the echo, the promise stance's reads in M8 and M9, and the "guest of the house" premise of P7 — the arc loses its weight. Passes.

## 9. Environment brief pointers

`artifacts/act-4-design/environment-requirements.md`: diner A · sheriff A · Roadhouse **C** (brief: the room where the whole town is; the stage; Truman's table; the phone; the Giant's tile) · town threshold + streets **B** (crossroads at 47,30; wanderers hidden by classic cond; the night render grade **deferred** — no state-keyed grade exists and the dusk memo would leak) · the lake shore **C** (brief: perimeter, water, torches, a covered shape never a figure) · Palmer **B** staging (Sarah's window only; the valise stays a caption: no prop sprite exists) + **E** visuals · hotel lobby, hospital, woods E/A. No concept art this milestone.

## 10. Segmentation and Giant-class beats

One mission (M8), one movement in three tempi: afternoon (4.0–4.5), night (4.6–4.10), before dawn (4.11–4.12). Giant-class beats: statement 1 — classic `gigante1_dlg` (Act 3, frozen); statement 2 — M8 `m8_roadhouse_truman` (PROPOSED node; pages as built), the only owner; the stage entity is presence, not a second utterance. No duplicate: the classic stage tile is already retired. `gigante2` remains a derived classic flag with three live readers (Sarah window, wanderers, night state) and its sync key follows the node rename.

## 11. Voice contracts

`artifacts/act-4-design/voice-contracts.md`: Maddy (schedules answer people; corrections without acidity; forbidden framings), Leland (arrangements on others' behalf; no dance, no white hair), Truman (the hour is the plan), Cooper (no counting, no "se fossi arrivato prima"), the Giant (a rule), Sarah (the sentence that stops before the name), Lucy (three sentences). Speaker-swap clusters listed for the audit.

## 12. Pacing estimate

Measured today (`pacing-current.md`): required path 6.2–7.6 min at 12 cps over the 27 routes; 87 s to the first choice; longest passive block 69 s (shore + echo + two comparisons); longest walk 32 s (diner → Roadhouse); with all classic optional texture ~9.3 min reading. Proposed: spine +2 hook pages (+~15 s), Roadhouse split (+1 short caption, +one walk of a few tiles), crossroads move (−~15 s of walking to the sign), optional Lucy (+20 s), Sarah rewrite (=). Estimate **7–8 min required, 9–11 min with optional texture**. The act is short by design: a fixed tragedy must not be padded (Bible §14); the minutes that matter are the afternoon's (attachment) and the shore's (silence). Below the 12–15 min a "full act" might suggest — reported, not repaired: the lock sizes M8 at 51 pages, and the human test is the only instrument that can say whether the afternoon needs one more ordinary touch (hypothesis, §14).

## 13. Engine-pressure classification

| element | class | mechanism |
|---|---|---|
| Leland/Maddy/crowd/Hawk/deputy entities with `when` | **A** (data) | `NARRATIVE_ENTITIES` + `evalWhen` (Act 3 Hawk placements precedent) |
| Giant entity on the stage with a one-line node | **A** | Hawk pattern (`hawk_*` entities + `m5_hawk_*` nodes); `giant` sprite exists in every renderer; tile 8,1 solid but interactable (no precedent, mechanically sound) |
| Node split `m8_roadhouse` → `_truman` + `_phone`; objectives 100/200 rewired; sync key rename | **A** | mission JSON; `syncNarrativeToClassic` line edit (`nodes_done.m8_roadhouse` → new id) |
| `town_crossroads` moved to the Roadhouse threshold | **A** | `WORLD_TARGETS` coordinate (route-trace: walkable/faceable tile) |
| Sarah NPC window, wanderers hidden at night | **A** | classic `cond: ['!flag:gigante2']` (precedent `js/glue.js:49,57`); `gigante2` sync key repointed to `m8_roadhouse_truman`; never `gigante2` inside a narrative `when` (one-way sync) |
| Town night render grade | **deferred** (would be C with a new memo per state: no precedent, `js/town-dusk.js` is unconditional and memoised on colour only) | captions carry the night in this act |
| Objective rung 150 + gates on 100/200 | **A** | objectives `when` (partition test) |
| Shore staging (perimeter/stakes as sprites) | **B/C** | placed sprites on the town map; if the map cannot carry it, a lot scene on the traincar model (D only if that fails in review — argued in the environment brief) |
| Roadhouse native art | **C** (cosmetic code + art pipeline, existing hook pattern) | `js/<map>-art/-scene/-production.js` as traincar/hospital |
| Band loop / "sala rallenta" effect | **not required** | captions carry it; no new audio or time primitive |
| Two hook pages at the station; Lucy optional node; Leland waiting node; Sarah p3 rewrite | **A** | pages/nodes/classic text |
| Walkthrough stub `narrative_m8_owned`; retire shadowed classic bridges | **A** (tests/data) | `test/walkthrough.js`, `js/glue.js`, `js/data.js` |

No class D. The only candidate (a lake lot scene) is a fallback with a stated trigger.

## 14. Implementation plan (frozen design; NOT executed in this milestone)

Tags: FABLE = judgement/wording; CHEAP = bounded wiring/tests/docs; HYBRID = cheap evidence → Fable decides.

**A. Topology cleanup (CHEAP, one brief)**
- A1 Retire classic `truman_atto4`, `truman_atto5`, `truman_wait5` cascade entries and dialogues; `lago_maddy` + `lettera_o` item; `maddy_a4`; `leland_a4`/`leland_dove`/`leland_dopo`; `gerard_a4` + its cascade entry. Re-pin `smoke.js`, `walkthrough.js` (add the `narrative_m8_owned` stub so the simulator walks the shipped path), `interaction-voice.js` counts, `act-3-mirror-gate` if touched.
- A2 Add classic conds: Sarah NPC `!flag:gigante2`; town wanderers `bobby`, `donna` `!flag:gigante2`.
- A3 Update `narrative/schema-deltas/M8.md` §7 (primitives implemented) — docs only.
- A4 Align the Act 1 diary document text (`js/data.js:32,46`) to the canonical rule wording (story CHANGELOG 2026-09-10); re-pin the Act 1 tests that quote it.

**B. M8 narrative/data changes (HYBRID: FABLE wording, CHEAP wiring)**
- B1 Split `m8_roadhouse` into `m8_roadhouse_truman` (actor truman@roadhouse; pages p01–p05; effects presagio+note) and `m8_roadhouse_phone` (object; p06–p07 + choices); rewire objectives 100/200 and the sync key; regenerate `narrative-data.gen.js`; update `narrative-validate-m8`, the three harnesses, node-count pins. (CHEAP from this spec; FABLE: the Giant's silent caption.)
- B2 Add `m8_leland_waiting` (optional, one caption, cond `¬promise_stance`, FABLE wording), `m8_giant_stage` (one caption, cond `presagio_status=active ∧ ¬warning_target`, FABLE wording) and `m8_lucy` (three conditional pages + repeat, FABLE wording).
- B3 Station hook: two pages after `m8.f.station.p03` (FABLE wording per S8 spec); no state.
- B4 Move `town_crossroads` to town 47,30; add a `repeat` page to `m8_focus_choice` (FABLE wording); objective rung 150 "Il telefono del Roadhouse." + gates on 100/200; repoint the `gigante2` sync key (CHEAP).
- B5 (withdrawn: the valise stays the built caption — no prop sprite exists).
- B6 Classic `sarah_visione` page 3 rewrite (FABLE wording per L3 guard).
- B7 One conditional Truman page at S8 for `focus_destination=lago` (the anonymous call reached the station while Cooper was at the shore) — FABLE wording, per-page `condition` wiring.

**C. Character/staging work (CHEAP from the entity table; FABLE reviews placements in a capture)**
- C1 Diner: Leland entity from `atto4 ∧ ¬T_LELAND_TAXI`; Maddy as today.
- C2 Roadhouse: Truman entity; crowd entities (bobby, donna, james, shelly, norma, loglady) `atto4 ∧ ¬warning_target`; Giant entity at 8,1 `presagio_status=active ∧ ¬warning_target` with its node; phone target as today.
- C3 (withdrawn: no valise object).
- C4 Shore: Hawk + deputy entities per `body_found_by` / `maddy_trovata` window.
- C5 Town wanderers `bobby`, `donna` hidden by classic cond while `gigante2`; the night render grade deferred to an environment milestone.

**D. Environment production (FABLE direction, CHEAP production; separate milestone(s))**
- D1 Roadhouse native (class C brief) — concept → native parity as traincar-v01.
- D2 Lake shore at night (class C brief) — town state first; lot-scene fallback only if review fails.
- D3 Palmer visuals — deferred (E).

**E. Runtime / playthrough validation (CHEAP drives, FABLE reads)**
- E1 Extend the 27-path contract in the M8 harnesses to the split node and the optional nodes; add `act-4-flow.js` on the Act 3 pattern (entity windows: Giant only between statement and phone; Sarah never after the statement; wanderers hidden; Leland rooted before the promise; Lucy never mute; objective partition with rung 150) and `act-4-mirror-gate.js` (the `gigante2` sync key follows the statement node).
- E2 Real-build playthrough driver on the Act 3 pattern (three routes minimum: palmer/palmer, centrale/lago, nessuno/diner) with transcripts; check emitted speaker vs tag, no classic bridge fires, zero API fallbacks.
- E3 Pacing re-measure with `test/probe-act4-pacing.js` (already written this milestone).
- E4 Destructive probes per `doctrine-audit.md` §11.

**Out of this plan by decision:** M9 P7 writer (M9 pass); M10 truths; the Loggia; BOB ontology; ring identity; any real-time clock; Narrative System changes; Character Life / Ambient Life expansion (the crowd is static entities, not routines).

**Should wait for human feedback from Acts 1–3 (hypotheses, not decisions):** whether one ordinary Maddy scene is enough for the loss to weigh (Q5 recall of "con due D"/the napkin); whether the phone's three intentions read as honest rather than as a puzzle (no "correct" option); whether the Roadhouse statement lands as witnessed or as interruption; whether the 7–8 minute spine feels short or right. None of these blocks the structural implementation above; they block only D-class investment in the Roadhouse if the human test shows the beat is not read as intended.

**The next prompt (when authorised):** "ACT 4 — IMPLEMENTATION PASS 01: A (topology cleanup) + B1–B6 + C1–C5 from `docs/act-4-design-report.md` §14; validators, harnesses, `act-4-flow.js`, real-build playthrough on three routes; report as `docs/act-4-implementation-pass-01-report.md`. No D."

---

## The twelve answers (final report requirement)

1. **What is Act 4 about?** A warning with no address, and what a man of method does with it: he looks at the living, promises what he can, warns whom he can, runs where he can, and arrives after the world. Knowing does not protect; it only verifies.
2. **How is the gameplay different from Act 3?** Act 3: read the past, form a theory, make a witness talk. Act 4: allocate attention before any fact exists (a stance, an intention, a direction), then read forward on a signature. The two comparisons come last, not first; the "crime scene" is where the world already finished.
3. **What does Maddy want, independent of the mystery?** To go home to a job that is hers (the library switchboard, held for her in writing until Monday), on the 7:40 with the Spokane connection, having given her aunt one more day — and to hear her name said right.
4. **What does the player actually do?** Talks to Maddy and promises one of three things; hears Leland's arrangement; (optionally) hears Lucy, the Log Lady, Sarah; walks into a full room and witnesses one sentence; chooses whom to warn; chooses where to run and walks it; stops at a shore; compares twice; puts an hour on Truman's table.
5. **Which Giant statements matter now and which remain open?** Statement 1 ("È successo di nuovo. E accadrà ancora") is verified in the present tense at the Roadhouse and at the shore — the only one Act 4 pays; its referent (Jacques, Laura, the pattern) stays open by statute. Statement 2 (owls) is set up again by the Log Lady and left open. Statement 3 belongs to the Lodge. The HUD never translates any of them.
6. **How does the opposition act while Cooper is elsewhere?** Leland pays, declares a taxi, leaves before Cooper, is inside the house by evening, acts while the town is at the Roadhouse, moves the body; a civilian's call sends Hawk. Visible to the player: the bill, the taxi, the absence of the Palmers from the room, the dark upstairs, the valise moved by Maddy, the anonymous call, the absence of Leland from every line of the night (`offscreen-timeline.md`).
7. **Which earlier scenes are recontextualized?** The R under Laura's nail (Act 1) becomes a count; "un pezzo alla volta" (M2 diary) becomes literal; "accadrà ancora" (Act 3 mirror) acquires a present tense; Sarah's corridor (Act 1) becomes the house that keeps returning; the taxi at seven (this afternoon) becomes the only lie a register can catch (M9).
8. **What player agency is real?** Causal on the world, never on the death: who is with Sarah, what Maddy does in the house, who finds the body and how the O is preserved, which promise is read back, which lines Truman and M9 speak. Expressive: the promise. Audience anticipation: the room, the threshold. Honest linearity at the macro level (Role Contract); no option names Maddy as a target; no text evaluates the night.
9. **Which environments are genuinely required?** Diner and station as they are; the Roadhouse as a room (class C brief); the lake shore at night (class C brief); the crossroads at the Roadhouse door with the wanderers gone (B; the night render grade deferred); Palmer staging only (Sarah's window). Nothing else.
10. **What does the act deliberately NOT reveal?** That the danger was inside the house; who the hand is; that the taxi was never called (M9); whose signature it is (P8 ceiling); what the owls are; what "di nuovo" counts; that no route could have saved her (the player must never be told, only never contradicted).
11. **Why must the player continue into M9?** Because the only checkable claim of the whole act is an hour said by a composed man in daylight, and at seven a taxi will or will not come to a house where nobody is leaving.
12. **Does any new engine capability need to exist?** No. Entities with conditions, a node split, a target move, classic conditions, a second authored town state on an existing hook. The lake lot scene is a fallback, not a requirement.

**Claim boundary.** Certified here: structure (ownership, gates, single writers, rendered acquisitions, route causality per the O-list, agency honesty). Hypotheses: attachment to Maddy from one scene; the Roadhouse beat read as witnessing; the false-guilt hygiene holding with real players; the spine's length. Maximum defect found: the act's central irony and its central room existed only as captions. Mechanism worth preserving: the lock's separation of Maddy's own agenda from the player's warnings.

**Amendment (2026-09-11, Cast Continuity B1).** `m8_leland_taxi` gains one closing action page, `m8.b0.leland_taxi.chiusura.p01`, placed before its notebook page: "(Norma gira il cartello sulla porta e spegne l'insegna. Sedie sui tavoli, cappotti dagli attaccapanni: il Double R chiude alle sei, stasera si va al Roadhouse.)" It authors the Double R closing for the Roadhouse evening so the diner regulars leave on screen before `T_LELAND_TAXI` commits. Frozen wording; added to M8 by the Cast Presence implementation pass. Spec: `docs/cast-continuity-b1-resolution.md`.
