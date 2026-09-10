# Act 4 — doctrine audit (design, before implementation)

Template: `docs/narrative/templates/doctrine-audit.md`. Audited object: `docs/act-4-design-report.md` §6 proposed beat map + `scene-contracts.md`, against `docs/narrative-craft-bible-v0.1.md` and the hard gates of `docs/narrative-system-v0.1.md` §3. Date 2026-09-10. Verdict: **structurally valid with three repairs** (§14). Everything about how it lands is hypothesis (§13, §15).

## 1. Dramatic engine check

| element | where | verdict | note |
|---|---|---|---|
| value conflict (knowing vs protecting) | report §2; S1, S4, S6 | PASS | rendered as actions (promise, phone, the recorder not switched on), never as a thesis line |
| protagonist want now | §2; obj 50 + S1 | PASS with R1 | the want exists in the design; in the build it was carried by a HUD line only |
| threat | offscreen-timeline T0.5–T7 | PASS | active without Cooper; visible only through absences and ordinary facts |
| why now | S3 (present tense), S4 | PASS | the statement's tense is the clock; no timer |
| END HOOK as a scene | S8 (PROPOSED pages) | PASS with R3 | today it is `obj_m8_4` text only |
| act turn | S6 | PASS | class of action changes (allocate → read forward → verify) |

## 2. Partial-order / precondition audit (O-list)

Route space: promise 3 × warning 3 × focus 3 = 27, × optional afternoon axes (Lucy / Sarah before-between-never / Log Lady) = 324 route classes. Cheap trace with `file:line`: `artifacts/act-4-design/route-trace.md`. Rows resolved by the lead:

| O# | beat | defect on which routes | fix (menu: mandatory / degrade / fail-forward / condition / move) | runtime risk |
|---|---|---|---|---|
| O1 | 4.8 label "la casa continua a tornare" | on 108 routes without any Sarah (Act 1 `sarah` is optional; Act 4 Sarah optional) the premise rests on the mandatory Act 1 house visit (diary, R, the heart), the diary's "lui", and Leland's "passa da casa alle sette" (every route) | degrade gracefully: label kept (lock text); the premise is the house itself, not Sarah; Sarah's afternoon window strengthens it where played. Accepted heuristic tension with `m8.c.focus.p03` ("Nessun fatto ne preferisce uno") — the house "returns" as attention, not as a fact | none |
| O2 | 4.9a valise condition | `gigante2` never enters narrative state (one-way sync): any entity/page `when` on it is false forever | condition on value: `value_is warning_target=palmer` (set only after the Roadhouse) — no `gigante2` in any narrative condition | none |
| O3 | 4.9a valise as an object | no prop sprite exists; an unknown sprite renders as a second Cooper | degrade gracefully: the valise stays the caption `m8.c.route_palmer.p02` (built); no object entity, no caption edit (B5/C3 withdrawn) | none |
| O4 | 4.6 Giant on the stage | an entity with `dialogue: null` and no node is mute (sound + turn, nothing else) | fail forward: one-line actor node `m8_giant_stage` (actor `gigante`, cond `presagio_status=active ∧ ¬warning_target`), the Hawk pattern; caption gives nothing | none |
| O5 | 4.6 tile 8,1 | solid `C` tile; no entity precedent on a solid tile | mechanically sound (`npcAt` precedes solidity; cannot be displaced); faceable from 8,2; pin in `act-4-flow` | low |
| O6 | node split → `gigante2` sync key | renaming `m8_roadhouse` silently stops `gigante2` forever (Palmer classic NPCs visible again, `lago_riva` cascade, objective line) | make mandatory: repoint `js/narrative-production.js:163` to `nodes_done.m8_roadhouse_truman`; `gigante2` flips at the statement (the night begins there); update `smoke.js`, `probe-act4-pacing.js`, `narrative-validate-m8.js`, the three harnesses | high if missed → cross-layer pin in `act-4-mirror-gate` (pattern of Act 3) |
| O7 | 4.8 town at night | a flag-keyed render grade has no precedent and would share the dusk memo (stale colours) | wanderers hidden by classic `cond: '!flag:gigante2'` (precedent `js/glue.js:49,57`) — never by registry entities (they would replace the classic definitions). The night **grade is deferred** (environment class E for this act; captions carry the night) | low for the cond; the grade is out of plan |
| O8 | 4.8 crossroads move | a landmark on the spawn tile 47,29 never fires; 30,30 today shadows the town sign | move to **47,30** (faced on arrival, dir `down`); side effects accepted: `sign_town` at 30,30 restored; 47,30 narrative-owned from `atto4` on → add a `repeat` page to `m8_focus_choice` so a later interact never replays the night captions | low |
| O9 | 4.6/4.7 objective window | with `presagio_status=active` written at the table, obj 100 dies and obj 200 ("Torna all'incrocio") fires before the phone; the crossroads refuses | rung **150** "Il telefono del Roadhouse." ([L] text, lock §9-B) gated `presagio_status=active ∧ ¬warning_target`; obj 200 gains `warning_target` set; obj 100 gated `¬node_done m8_roadhouse_truman`. Never chain the two nodes with `next` (same lease, no walk) | low; partition test must stay exactly one objective per state |
| O10 | 4.1 Leland present early | interact before the promise → `showNoRootsFeedback`: "Non c'è altro da chiedere qui, per ora." to a man never met | fail forward: `m8_leland_waiting` with `¬value_set promise_stance` (never co-rooted with the taxi node: fail-closed ambiguity otherwise) | none |
| O11 | Lucy in Act 4 | already a silent void today (M6 completed consumes the keypress, no page) | one M8 node `m8_lucy` cond `atto4 ∧ ¬node_done m8_station`, three conditional pages (before the statement: the evening; during: the switchboard; after the shore: "il centralino muto a quell'ora" [L §12]) + `repeat`; M9 takes her afterwards | none (per-page `condition` exists) |
| O12 | reload mid-Roadhouse | Giant re-appears, phone is the only root — confirmed | — | none |
| O13 | P7 | no writer anywhere; the M9 branch is dead data | M9 pass owns; Act 4 guarantees premises only | none |
| O14 | 4.6 two Trumans | classic Truman at the station has no cond during the Roadhouse window (precedent `truman@traincar`) | accepted (the station is off the objective path in that window; an interact yields the no-roots line) | low; optional later cond |
| O15 | walkthrough false-green | classic simulator walks retired bridges | stub `narrative_m8_owned`; retire the bridges | test re-pins |
| O16 | schema-delta §7 stale | three primitives listed as unimplemented | docs fix | none |
| O17 | `focus=lago` | the anonymous call is never rendered on that route | condition: one Truman page at S8 (`focus_destination=lago`) | none |

Routes named per row; no row needs a new primitive; the one no-precedent item (a state-keyed grade) is deferred, not built.

## 3. Fact & knowledge results (hard-gate rows)

From `fact-knowledge-ledger.md` (lead verdicts applied there):

- F1 **Sarah names "BOB"** (`sarah_visione` p3) — FAIL today → rewrite (Act 4 owns; guard: only Ronette sources the name; Sarah stops before it).
- F2 **"casa di legno … vent'anni"** (`gerard_a4`) — FAIL (contradicts `facts/bob-guest-since-childhood`; hands the house) → CUT; shadowed anyway.
- F3 **Leland's taxi is false** — nobody may say it in Act 4 (rendered acquisition of the falsity = M9 `D_TAXI`). The proposed S8 hook reads the *claim* aloud, never its falsity. PASS by specification (guard on the hook wording).
- F4 **"Di nuovo" referent** — never certified; the notebook note says "significato ancora irrisolto"; `presagio verified` at the shore certifies only that something happened again. PASS; ambiguity preserved (R3).
- F5 **Maddy died in the house** — never rendered in M8 (the route-palmer page shows an empty house; the shore shows a placed body). PASS.
- F6 **No route saves her** — never stated, never contradicted; no page evaluates the night (M8 §14 hygiene kept; hook pages must obey it). PASS by specification.
- F7 **The crowd** — "Il paese c'è tutto" (p01) asserts what the map must show → staging (R2). PASS after C2.
- F8 **"Arrivano le torce"** — same, shore staging (C4).
- F9 **The valise** — rendered iff `warning=palmer` (truth table kept); the object entity must obey the same condition. PASS after C3 + B5.
- F10 **P7** — no writer in M8; the M9 branch is dead (M9 known-open, owned there). Act 4 guarantees the premises only. PASS (deferred by decision).

## 4. Setup–payoff results

From `setup-payoff-ledger.md` (frozen resolution there): the napkin → PAID at the shore (object-mediated, ablation run: deleting S1 voids the echo and the promise reads — the return changes function); the promise → PAID (three counter-moves + echo + M9 accompagno read); the taxi → PAID within the act as the END HOOK (the hour on the table), verified in M9; statement 1 → PAID in the present tense; the owls → INTENTIONAL-UNRESOLVED (Lodge/never); Sarah's vision → INTENTIONAL-UNRESOLVED to M9/M10 (P7 premise); the fire motif (story overview row 5) → **reclassified INTENTIONAL-UNRESOLVED, owner M10/finale**: the M8 lock §12 forbids symbolic surplus in this act and no repository material places fire in Act 4; inventing one would be a new proposal outside scope; the ring/S1 → no Act 4 reference (correct: the finale pass owns it); "Il lago è recintato" → an environmental echo once the shore state exists.

## 5. Investigation fairness

| check | result |
|---|---|
| clues precede conclusions | R (Act 1), the rule (M2), the O (S6) precede P8 (S7) — PASS |
| premises visible | both comparison pages show the two items; feedback names the missing link (name / house) — PASS |
| UI does not anticipate | no option names Maddy as a target (phone, threshold); the P8 option exists only after both comparisons — PASS |
| propositions multi-state | P8 formulated, ceiling corroborated; P6 formulated only in M9 — PASS |
| feedback answers the link | "Due lettere non compongono niente. Un ordine e una promessa, forse." / "Il diario nomina 'lui'. Non dice chi, né dove abita." — PASS |
| suboptimal choices fail forward | every warning/focus reaches the shore; no sealed thread; the cost is who/where, never the outcome — PASS |

## 6. Preliminary-theory verdict

No theory beat before the shore by design (the act's mode is allocation, not theory). KEEP. The only theory (P8) is post-loss and forward-looking; its overreach options are retryable.

## 7. Scene contracts summary

Eight full (S1–S8; S5 single-speaker), six lightweight (L1–L6). Stubs: S3 (the Giant's silent caption; split-node conditions), S8 (two hook pages). None STRUCTURALLY NOT READY.

## 8. Voice audit (speaker-swap plan and pre-verdict)

Clusters: {Maddy, Lucy}: both count — Lucy routes others ("Mando Andy… Ci mette dieci minuti"), Maddy routes herself ("La 7:40 prende la coincidenza"); attributable by object of the schedule. {Truman, Leland}: both give hours — Truman's are checks ("Alle sette lo sappiamo" spec), Leland's are arrangements for someone else ("passa da casa alle sette"); attributable by whose morning the hour belongs to. {Cooper, Hawk} at the shore: Cooper names and stops ("Con due D"; "Fermo al perimetro"), Hawk reports what he did not do ("Non l'ho mossa. Non ho toccato le mani"); attributable by negative vs nominative. Pre-verdict PASS on built lines; the cheap anonymised probe runs at implementation on the emitted transcript (E2).

## 9. Agency audit

| choice | options | reaction | state | echo | visible gain | visible cost | honest? |
|---|---|---|---|---|---|---|---|
| the promise (S1) | accompagno / autonomia / prudenza | Maddy's counter-move per stance | `promise_stance` | Leland's 7:10 line (accompagno); the lake monologue; M9 accompagno read | a relationship stated | each stance costs something visible: a commitment Cooper cannot keep / a goodbye without a "ma" / a call that will never come — priced by the echo, not by approval | yes (expressive + relationship; no "correct" stance) |
| the phone (S4) | palmer / centrale / nessuno | Maddy's action / Lucy's dispatch / the door | three values | valise (route/station), Andy with Sarah (station, M9), silence | someone moves | time on the phone; Sarah alone (palmer/nessuno); Maddy unwarned (centrale/nessuno) | yes (intention labels; no option names the target; no outcome change advertised) |
| the threshold (S5) | palmer / lago / diner | a different arrival scene | `focus_destination` → `body_found_by` | who found her; the custody line in M9; the valise in person or by report | being first (lago) or informed (diner) or seeing the house (palmer) | distance; arriving second | yes (local + expressive; the world is ahead on every route) |
| the diary (S7) | a / b / c | formulate / two merit refusals | P8 | station line; M9 | the reading | none (claim test; retry) | yes |

No fake meaningful choice: every option has reaction + state + echo. Pareto: each stance/intention has a visible gain and a visible cost; none dominates.

## 10. Channel-selection audit

| fact | channel | why |
|---|---|---|
| Maddy's plan (7:40, job, one day) | dialogue | social; her voice is the content |
| Leland beside her, paying | environment (entity) + one caption | the player should infer the proximity, not be told |
| the taxi at seven | dialogue + notebook | a claim to be written down (verified later) |
| the town all present | environment (crowd entities) | inference of absence must be the player's |
| "Sta accadendo di nuovo" | witnessed pages (brief non-interactive) | exact timing; the intended experience is witnessing, not deciding |
| the Giant after the statement | environment (silent entity) | presence without instruction; nothing to decide |
| the warning | interactive dialogue (intention widget) | the player owns whom they move |
| where to run | player action (walk) after an intention widget at the door | the cost is paid in tiles; the choice is made where the directions are visible |
| the dark house, the valise | environment (object) + one caption for the note | infer her action; do not narrate what is on screen |
| the anonymous call | dialogue (Lucy) / radio caption | the world is ahead; social channel |
| the O, same incision | action captions + notebook | observation before interpretation; the notebook asks |
| the promise read back | monologue (dialogue to Diane) | expressive echo; object-mediated (the napkin) |
| the taxi hour on the table | dialogue (S8) | the hook is a scene between two people with different wants |
| the perimeter afterwards | environment (state) | absence/change as echo; no line needed |

## 11. Destructive probes (design-time; runtime re-run at E4)

| probe | evidence | result |
|---|---|---|
| move deletion — the promise | delete `promise_stance` writes: S2 accompagno page, `m8_promise_echo` cases and M9 `m9_verifica_taxi` accompagno read all collapse | causal, not decorative |
| move deletion — the phone | delete `warning_target`: valise/note, Andy with Sarah, the three feedbacks and two M9 lines vanish; the tragedy is unchanged (by design) | causal on the world, honest on the outcome |
| move deletion — the threshold | delete `focus_destination`: `body_found_by`, both discovery versions and the M9 custody line collapse | causal |
| world substitution — the Roadhouse | replace the full room + phone with an empty room + a page: the statement still fires but "who is not here" and the cost of the call (a public phone, a loud room) disappear; the scene becomes text | R2 justified |
| world substitution — the napkin | replace the timetable with generic small talk: the echo line "Sul tovagliolo aveva scritto tre partenze" loses its object; the 7:40 that M9 and `D.endText` depend on loses its origin | the object causes the scene |
| speaker swap | §8 clusters | pre-verdict PASS |
| author-thesis deletion | candidates: `m8.c.focus.p03` "Nessun fatto ne preferisce uno. Il primo costo è la distanza." — deleting it leaves the labels carrying the same information: KEEP as Cooper's refusal to rank (performable: he does not choose for the player); `m8.b.roadhouse.p07` "quello che dico adesso farà muovere qualcuno" — the line names the phone's cost before the choice: KEEP (it is the price tag, not a thesis); `m8.d.echo.p03` "(Silenzio.)" — KEEP (a refusal to comment, performable by the recorder left off) | no thesis line found; the lock's §14 already cut them |
| payoff ablation — the napkin | delete S1: the echo has nothing to quote; the stance reads in M8/M9 vanish; Maddy becomes a stranger found on a shore | payoff real |
| payoff ablation — the hook | neutralise S8's hook (keep the HUD line only): M9 starts from an objective, not from a scene; the player's exit impulse is a menu | R3 justified |
| route causality | O-list §2 | eleven rows, none needing a primitive |
| runtime injection | to run at E1/E4 (reload mid-Roadhouse after the split; the crossroads target on the threshold; entity windows) | pending |

## 12. NPC function budget

Maddy: person-with-a-plan, corrector, (branch) housekeeper of her own night — 3. Leland: host/payer, arranger — 2. Truman: appointment-keeper, dispatcher, inventory — 3. Lucy: router — 1. Norma: the room, the last sighting — 2. Hawk: preserver — 1. Sarah: witness — 1. Log Lady: wayfinder — 1. Giant: statement — 1. No answer-bundle.

## 13. Player / audience state — HYPOTHESES

Entry (after the mirror): want = do something with the warning; certainty low, control high (the HUD says where). S1 exit: attachment (hypothesis) to a person with a plan; expectation = tomorrow 7:40. S3 exit: fear generic; suspicion split between a girl near Laura and the house (the lock's two reasonable theories); control high (the phone). S5 exit: emotional pressure without cognitive load (three places, no facts). S6: grief (hypothesis), no guilt asserted; certainty rises (a death again), control drops (nothing to do but read). S8 exit: exit impulse = seven o'clock. Per cohort: palmer-warners carry the valise image; centrale-warners carry Andy; nessuno carry silence. All untested.

## 14. Exactly three repairs (impact-ordered)

**R1 — The afternoon is a look, not a fetch.** PROBLEM: the act's central irony (the danger beside her) and its want exist only as captions and a HUD line (diagnosis 1, 2, 4). MECHANISM: channel selection + scene test. MINIMAL CHANGE: Leland present at the counter from the first frame (entity `when` widened) with a one-caption idle node; the optional Lucy line that puts the Roadhouse in the world; Sarah's afternoon window (`!gigante2`) and her page 3 rewritten to stop before the name. INTENDED PLAYER EFFECT: the player may notice what Cooper does not; the evening has an address before the HUD gives one. NEW RISK: a player who reads Leland's presence as a signpost — mitigated by his silence and by the lock's rule that nothing names the target.

**R2 — The Roadhouse is a room.** PROBLEM: the page asserts a crowd, a sheriff and a giant that the map does not contain; the crossroads is a walk away from the door (diagnosis 5, 6). MECHANISM: world necessity + legibility of cost. MINIMAL CHANGE: split the node (Truman actor node with the built pages → phone object node with the built choices, objective rung 150 between them); crowd/Truman/Giant entities with windows (the Giant with a one-line node); move `town_crossroads` to 47,30 with a repeat page; hide the wanderers by classic cond while `gigante2` (the night grade deferred). INTENDED PLAYER EFFECT: absence becomes visible (the Palmers are not here); the statement is witnessed among people; the three directions are real from the door. NEW RISK: the silent Giant read as a marker — mitigated by a caption that gives nothing and by no objective naming him.

**R3 — The hook is a scene and the arithmetic stays unsaid (ambiguity preserved).** PROBLEM: the act ends on an objective string; meanwhile the letters invite counting (diagnosis 7). MECHANISM: Bible §14 final hook + the feedback-b guard ("Due lettere non compongono niente"). MINIMAL CHANGE: two pages at S8 where Cooper puts Leland's seven o'clock on the table and Truman answers with who checks it; an explicit guard that no page in Act 4 counts letters, names the referent of "di nuovo", or calls the taxi a lie. INTENDED PLAYER EFFECT: the player leaves wanting seven o'clock, holding a theory whose size they do not know. NEW RISK: the hook reads as suspicion of Leland — mitigated by wording (the hour, not the man) and by Truman's belief "il lutto confonde" staying intact until M9.

**Deliberately not repaired:** the 87 s before the first choice (the walk is the act's "daylight"; a shorter opening would delete the ordinary); the 69 s passive block at the shore (silence is the content; summarization test passes); the act's 7–8 min length (a fixed tragedy is not padded); the classic Log Lady duplication of objective 100 (texture; second channel by design); P7's dead M9 branch (M9 owns it).

## 15. Claim boundary

Certified (structural): single owner per actor/target after the retirements; every state write has a reader or an allowlisted forward reference (`maddy_action_after_warning`, `letter_o_chain`); rendered acquisition for every fact spoken (F1/F2 fixed by rewrite/cut); route causality per the O-list; agency rows honest; no design metadata in text; no new primitive. Hypotheses: everything in §13. Maximum defect: F1 (Sarah naming BOB) — a live wording-guard breach in the shipped classic layer. Mechanism worth preserving: the lock's `maddy_departure_plan`/`maddy_action_after_warning` separation (her agenda vs her reaction), which keeps the player's warnings from ever becoming the cause of anything. New tests: `act-4-flow.js` entity windows (Giant only between statement and phone, on 8,1 faceable from 8,2; Sarah never after the statement; wanderers hidden; Leland present before the promise with a live root; Lucy never mute in Act 4); `act-4-mirror-gate.js` (the `gigante2` sync key points at the node that owns the statement); objective partition with rung 150; walkthrough stub `narrative_m8_owned`; a wording-guard grep over Act 4 pages for "BOB" outside Ronette/M10, letter counts, "salvat", "troppo tardi", "se fossi".
