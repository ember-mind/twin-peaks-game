# Narrative System v0.1 — how narrative is made in this studio

Status: FROZEN 2026-09-10 (extracted from Act 1 / NVS01, Act 2 production + closure, Act 3 design + doctrine audit + implementation pass 01). Doctrine reference: `docs/narrative-craft-bible-v0.1.md` (the Bible). This document is the operating system; the Bible is the reasoning behind it. Templates: `docs/narrative/templates/`. Validators: `tools/narrative/`. Entry point: `docs/narrative/README.md`.

Scope rule: this is an authoring + review + validation system. It is not story canon, not a runtime spec, and not proof that anything is moving or fun. Structural claims can be certified; quality claims stay HYPOTHESIS until humans test them (Bible §15).

---

## 1. Three layers

| Layer | Question it answers | Lives in | Changes for another game? |
|---|---|---|---|
| **A. Story knowledge** | What is true in *this* game: objective truth, timeline, who knows / suspects / falsely believes what, the mystery's solution, the revelation order, setup–payoff obligations, the player-role contract | `docs/story/` (truth model, §5), `Twin Peaks Game.md` §Role Contract, the vault Bible/Grammatica pages, the per-act ledgers | Completely |
| **B. Authoring system** | How we design, review and prepare narrative: pipeline, ledgers, contracts, audits, probes, human test | this document, the Bible, `docs/narrative/templates/` | Reused as is |
| **C. Runtime / validation** | How authored narrative is represented and checked in the build: missions, nodes, flags, evidence, propositions, conditions, choices, notebook comparisons, objectives, entities, save/reload | `narrative/`, `js/narrative-*.js`, `js/glue.js` + `js/data.js` (classic), `test/narrative-*`, `test/act-*`, `tools/narrative/` | Representation may be reused; content and pins are per game |

Rules across layers: A never leaks into B's templates as prose; B never assumes a C feature that does not exist (check `js/narrative-runtime.js` before authoring a condition); C is documented, not redesigned (§20).

---

## 2. Canonical authoring pipeline (an act or a major milestone)

Legend: **M** mandatory · **C** conditional (stated trigger) · **O** optional. "Scale-down" says what a small milestone (one scene, one environment, a text fix) may skip.

| # | Step | M/C/O | Output (template) | Owner |
|---|---|---|---|---|
| 1 | Experience promise + dramatic engine (what the act does to the player; value conflict, want, threat, why *now*) | M for an act; C for a scene (inherit the act's) | act-design §1–2 | FABLE |
| 2 | Production topology audit (what is actually live: classic vs mission ownership per map/actor, gates, flags, objectives) | M | act-design §3 (cheap agent produces; Fable reads) | CHEAP → FABLE |
| 3 | Current beat map (as built) | M | act-design §4 | CHEAP |
| 4 | Critical diagnosis (Bible §10 lenses; name the *mechanism*, cite the line) | M | act-design §5 | FABLE |
| 5 | Fact & Knowledge Ledger | M when any beat transfers a fact; O for pure atmosphere | fact-knowledge-ledger | CHEAP fills from sources → FABLE verdicts |
| 6 | Setup–Payoff Ledger | M for an act; C for a scene that opens or closes a setup | setup-payoff-ledger | CHEAP inventory → FABLE status |
| 7 | Evidence map (KEEP / REWRITE / MERGE / CUT / DEFER / ADD) | M for investigation content; skip for non-investigative scenes | evidence-map | FABLE |
| 8 | Proposed beat map (PURPOSE · ACTION · QUESTION · NEW INFO · STATE · CHARACTER FUNCTION · HOOK per beat) | M | act-design §6 | FABLE |
| 9 | Scene contracts (ten answers; five per central speaker) | M for every scene with a turn or a choice; **lightweight beat contract** for environmental beats and one-exchange witnessing beats | scene-contract | FABLE |
| 10 | Voice contracts | C: only for speakers with new or rewritten material; not needed for dialogue-free beats | voice-contract | FABLE |
| 11 | Agency / choice audit | C: only when a choice is claimed meaningful (stance, tactic, relationship) | doctrine-audit §agency | FABLE |
| 12 | Channel-selection audit | M for every load-bearing fact (which channel carries it and why) | doctrine-audit §channels | FABLE |
| 13 | Order / partial-order audit (every load-bearing beat verified on every valid route) | M when the milestone has free ordering; O for linear scenes | doctrine-audit §order (CHEAP traces, FABLE resolves) | CHEAP → FABLE |
| 14 | Doctrine audit + exactly three repairs | M for an act design before implementation; O for a scene fix | doctrine-audit | FABLE |
| 15 | Dialogue / content authoring (pages, prompts, objectives, notebook text) | M | mission JSON / classic data | FABLE (wording) |
| 16 | Implementation spec (plan split with FABLE / CHEAP tags, engine-pressure classes A–D) | M | act-design §last | FABLE |
| 17 | Runtime implementation (JSON, adapter targets/entities, tests) | M | code | CHEAP (bounded briefs) |
| 18 | Structural validation (validators, mission tests, simulators, sweep) | M | implementation-report §validation | CHEAP |
| 19 | Destructive probes (§14) | M for an act; C for a scene with a turn | doctrine-audit §probes | CHEAP precomputes → FABLE judges |
| 20 | Played-transcript review (browser path, emitted speaker vs tag, variant only for its state) | M before freeze | freeze-report | CHEAP drives → FABLE reads |
| 21 | Pacing review (reading-rate probe on the mandatory spine; spine short, minutes from optional texture) | M for an act; O for a scene | act-design §pacing / freeze-report | CHEAP counts → FABLE decides |
| 22 | Human test (§15) | M before any quality claim; never a gate for freezing structure | human-test | HUMAN (Fable prepares protocol) |
| 23 | Freeze (report + vault mirror + claim boundary) | M | freeze-report | FABLE |

Scale-down: an environment-only beat (a room with one examine) needs 2, 5 (one row), 9 (lightweight), 12, 17, 18, 23. A one-line dialogue fix needs 5 (the row it touches), 15, 18. A new act needs everything.

Evidence for the shape: NVS01 and Act 2 ran 2–4, 8–10, 15–21, 23 and found their defects in steps 2, 4 and 20; Act 3 added 5–7, 11–14 and found its worst defect (theory by recognition) in step 14, before any code.

---

## 3. Hard gates vs heuristics

**Hard gate** = can be structurally wrong; fails the milestone; repaired by rewriting, never by loosening the test. **Heuristic** = diagnostic; may be violated on purpose; an agent must *report* the violation, not "fix" it.

### Hard gates (evidence: each one failed at least once in Acts 1–3)

| Gate | Failure | Detection |
|---|---|---|
| Knowledge before acquisition | a fact or wording used before the player/actor has a rendered acquisition | ledger row "rendered acquisition" vs page order; Act 3 F1/F2 |
| Payoff without setup / setup without designated status | mandatory payoff whose setup is unplayed; setup with no PAID / INTENTIONAL-UNRESOLVED / UNPAID status | setup-payoff ledger; Act 3 S1 |
| Required beat reachable without required evidence | a system or scene depends on an observation declared optional | `tools/narrative/lint-missions.js` (required-evidence-optional); Act 2 Ronette, Act 3 ring comparison |
| Read-before-write / unreachable writer / dead state | condition on a key nobody writes; writer no route reaches; state written and never read | lint (dangling-state, read-before-write); Act 3 `m5_theory_revised`, `audrey_salvata` |
| Duplicated or conflicting owner | two layers or two nodes own the same actor/target with compatible conditions | lint (shadow pairs) + topology audit; Act 3 two Hawks, two Jacqueses |
| Objective / gate disagreement | HUD says one thing, gates or declarations another; more or fewer than one true objective in a reachable state | per-mission partition test (Gate 10); Act 2 silent HUD |
| UI anticipates deduction | an interpretation is offered as a menu item before its premises exist, or the feedback hands the conclusion | doctrine audit §fairness; Act 3 R1 |
| Player move stored but not rendered | a choice writes state and no page acknowledges it | act flow tests; Bible §13 |
| Effects at the wrong semantic phase | state committed before the last page / before the counter-move | node invariants ("effetti SOLO dopo l'ultima pagina"); runtime prepare/commit |
| Fake meaningful choice | a choice claimed meaningful with no state, no reaction, no later echo | agency audit; Act 3 S1 → R3 |
| Proposition truth ≠ NPC acceptance | an NPC's acceptance written as world truth, or a player theory treated as system truth | proposition states (§10); Act 3 R2 |
| Design metadata rendered | node ids, result codes, evidence ids, "R1", "A12" in player-facing text | act flow regex + `choice-prompts` |
| Silent refusal | a blocked action with no in-fiction answer | Role Contract (diegetic refusal); Act 3 O-list |
| Runtime physical | overflow, orphan label, lost commit, broken reload/revisit | harnesses, save/reload tests |

### Heuristics (diagnostic; violation must be argued, never auto-fixed)

Mannerism frequency (one semantic family > 20%, three polished devices in a row) · Cooper aphorism budget (one per scene) · enter late / leave early · NPC function budget · one-companion attachment model (Bible §9) · preferred revelation patterns · prose rhythm and anti-polish · "a fact exposed twice is a cut" (unless the second instance adds content) · six-part scene diagnosis order · pacing target minutes.

---

## 4. Standard artifacts (templates)

Nine templates in `docs/narrative/templates/`; each states PURPOSE · WHEN REQUIRED · FIELDS · PASS/FAIL · WHAT NOT TO PUT HERE.

| Template | Replaces / absorbs | Required for |
|---|---|---|
| `act-design.md` | beat-map, implementation-plan, pacing estimate, engine-pressure table | every act; a scene-level design uses only its §1, §5, §6 |
| `fact-knowledge-ledger.md` | — | any milestone transferring facts |
| `setup-payoff-ledger.md` | — | acts; scenes that open/close a setup |
| `evidence-map.md` | — | investigation content |
| `scene-contract.md` (full + lightweight variant) | beat contract | every scene with a turn/choice; lightweight for environmental/witnessing beats |
| `voice-contract.md` | — | speakers with new material |
| `doctrine-audit.md` | agency audit, channel audit, order audit, probes, three repairs | act designs; scene fixes optionally |
| `implementation-report.md` | implementation spec results, validation table, blockers | every implementation pass |
| `freeze-report.md` | closure report, pacing review, played-transcript review | every freeze |
| `human-test.md` | — | any quality claim |

Not created on purpose: `beat-map.md`, `pacing-review.md`, `implementation-plan.md` (all live inside act-design or freeze-report; separate files produced drift in Acts 1–2 where beat maps were restated three times).

---

## 5. Story truth model (`docs/story/`)

Author-only. The runtime never reads it. Structure (schema defined now; population is a later, story-owned milestone):

```
docs/story/
  README.md        ownership, schema, update rules (this section, expanded)
  truth.md         objective truth of the case: what happened, when, who did what, what the ring is (author-only)
  timeline.md      dated/ordered events, including off-screen ones the traces must agree with
  characters/      one file per character: what they know / suspect / falsely believe / withhold, at each act boundary
  facts/           one file per load-bearing fact (mirrors ledger rows across acts): source, status, acquisitions
  revelations/     the order in which truths reach Cooper and the player; what each revelation retires
  relationships/   who owes / fears / protects whom; what each relationship is for dramatically
```

Every entry carries two independent dimensions:

- `source`: `canon` (the series) · `adaptation` (changed from the series on purpose) · `project-fact` (invented, needed for consistency) · `new-proposal` (not yet accepted) · `interpretation` (a reading, not a fact) · `uncertain`.
- `status`: `locked` · `open` · `deprecated`.

A **locked interpretation is still an interpretation**: locking freezes the wording we use, not the truth-value. Only `project-fact`, `adaptation` and `canon` can be objective truth. The system (runtime) never certifies any of them; it only tracks rendered acquisition.

Four distinct things, never collapsed: **objective truth** (truth.md) · **what Cooper knows** (fact ledger "who knows", advanced only by a rendered acquisition) · **what an NPC knows / falsely believes / withholds** (character files; the source of leaks and lies) · **what the player has actually seen** (pages rendered on the player's route; the only thing a deduction may be built on).

Update rule: a change to `truth.md` or a `status: locked` entry needs the OLD / NEW / EVIDENCE / WHY record (§22) and a check of every ledger row that cites it.

---

## 6. Fact & Knowledge Ledger (standard)

Fields (proved useful in Act 3; nothing else): `fact` · `objective truth` · `source/status` (§5) · `who knows` · `who suspects` · `who falsely believes` · `when discoverable` · `supporting evidence` (ids) · `rendered acquisition` (page id + quoted text) · `commit phase` (prepare node / commit node) · `wording guard` (what nobody may say before this row fires).

Central rule: **schema metadata is not acquisition.** A flag, an evidence record or a proposition state does not license a line. A fact is *known* to an actor only when a page has transferred it to that actor on every route that reaches the line. The ledger's job is to name that page.

Two runtime facts that shape rows: a notebook comparison never sets `nodes_done` (read its proposition's `formulation.status`); a choice-only node never sets `nodes_done` (read its value). See `narrative/schema-deltas/M5.md`.

---

## 7. Setup–Payoff Ledger (standard)

Fields: `setup` (page id) · `payoff` (page id or "none") · `status` = **PAID** / **INTENTIONAL-UNRESOLVED** / **UNPAID** · `what the player must have experienced` (route condition) · `ablation result` (delete the setup / neutralise the return → does the payoff still perform the same function?).

INTENTIONAL-UNRESOLVED is not a defect (Lucy's breathing calls in Act 1; the ring's meaning through Act 3). UNPAID is a defect only when the setup is mandatory and the act claims it. Run ablation only where the payoff is claimed important (S1 in Act 3 → R3).

---

## 8. Scene contract (standard)

Full contract (Bible §6, ten answers) for any scene with a turn or a choice: what changes · each participant's want now · knows / suspects / falsely believes / withholds · authority and capability · world or material constraint that shapes the moves · behavioural and voice difference · pressure forcing the scene now · proof of the turn (an action, not a line) · unsaid but inferable content · channel / length / interruption limits. For each central speaker: `self_image` · `declared_content` · `leak` · `protected_truth` · `exit_cost`.

Lightweight beat contract (environmental examine, one-exchange witnessing beat, blocked-tile line): what changes · what the player must be able to infer · the one page that carries it · the channel · what must *not* be said yet. No speaker block.

Threshold: if a scene has a second speaker with a want, it is not lightweight.

---

## 9. Voice contract (standard)

A voice is a **mechanism**, not a lexicon: attention (what the character notices first) · protected value · tactic under pressure · disclosure strategy (what they volunteer, what they hide, how they leak) · syntax and rhythm · politeness under pressure · the admission they avoid · relationship to this interlocutor (tu/lei, partner/guide/adversary). Catchphrases, job vocabulary alone and accent gimmicks are forbidden as the *only* differentiator.

Proven pairs: Hawk speaks in ages, durations, directions and distances; Truman in clocks of procedure (stasera / domattina / a verbale); Cooper measures first and separates the object from its story; Jacques turns every question into a game he is dealing; Norma answers with the room; Lucy with three sentences, the third a question.

**Speaker-swap probe**, institutionalised: a cheap critic strips names and job words from a cluster of lines and shuffles them; the lead (Fable) attributes and names the mechanism that proves each attribution. Failure = two speakers swap without changing attention, tactic or disclosure. `test/interaction-voice.js` guards the mechanical part (generic Cooper lines, mannerism counts, entry/repeat presence); it does not certify voice.

---

## 10. Investigation authoring contract

Grammar proven in Acts 2–3 (not a generator; a shape to check against):

QUESTION → OBSERVATIONS (objects, positions) and TESTIMONY (claims) → COMPARISON (notebook pair; voluntary or **required** when a system depends on it) → PROVISIONAL THEORY (few options, only premises already seen) → NEW OBSERVATION / PRESSURE (the mandatory last observation) → REVISION / MAINTAIN / OPEN → PRESENTATION (to an NPC with a want) → SOCIAL RESPONSE (accept-as-yours / contest with memory / both) → WORLD CONFIRMATION or CONTEST (events, never a lecture).

Distinctions that are hard rules: **object ≠ testimony** (Jacques's cards are a claim; the deck under the seat is a fact) · **presence ≠ authorship** (P5) · **NPC acceptance ≠ world truth** (Truman "come tua") · **player theory ≠ system truth** (`m5_final_theory` is never graded).

Proposition states available: `formulated` (by a comparison) · `presented` (to an actor) · `accepted` (by that actor: `social_status.accepted_by`) · `contested` · `confirmed` · `refuted`. Use only the states a beat needs; record in the node invariant how a state that has no runtime field is represented (Act 3: presented/contested = node done + theory value).

Two UI rules: **the UI must not anticipate deduction** (no option that names the conclusion before its premises; feedback is an action or the missing link, never the verdict) and **the notebook asks, does not explain** (bare facts + one question per entry; no Cooper reading in the notebook). Wrong readings are retryable with merit feedback; a wrong *theory* fails forward and is corrected by the world.

---

## 11. Partial-order / storylet rules (authoring model, not a runtime)

Every node is described by **preconditions** (conditions) · **effects** · **dependencies** (which facts it assumes as *seen*) · **re-evaluation** (which pages change with state: `pages_by_value`, per-page `condition`, `pages_after_branch`, `repeat_when`).

For every load-bearing beat: enumerate the valid routes (cheap agent) and verify each assumption on each route. Resolution menu, in order of preference: make the premise mandatory (order stays free, coverage does not) · degrade gracefully (conditional page) · fail forward (the world corrects later) · condition the dialogue on the value · move the payoff to where its premise is guaranteed. Act 3 used all five (O1–O11).

Authoring constraints from the runtime: one `pages_by_value` per node (a second is last-wins); two-axis variants use `pages_after_branch` with per-page `condition`; milestones use `after_groups` or `pending_when` and always `resolved_when`; write-once values are the norm for stances and tactics.

---

## 12. Agency contract

Levels: **LOCAL** (order, optional texture, re-reads) · **GLOBAL** (a state that changes later scenes: tactic, custody) · **EXPRESSIVE** (a stance rendered back, no branch: the notebook's second line). This game is honestly linear at the macro level (Role Contract); agency is local and expressive with a few global values.

Kinds of player answer, judged differently: **claim test** (a deduction with a right link: retry + merit feedback; no cost matrix required) · **stance** (S1 custody: gain + cost visible, echo required) · **tactical choice** (M6 tactic: write-once, per-branch leak channel, per-branch loss) · **relationship choice** (promise stances: echo in the person's next scene).

A "meaningful choice" claim requires all four: understandable intention · immediate reaction · recorded state · later legible echo proportional to the claim. Pareto costs are demanded of stances and tactics, never of claim tests.

---

## 13. Channel selection

Matrix: PLAYER ACTION · INTERACTIVE DIALOGUE · ENVIRONMENT · ANIMATION / SOUND · CUTSCENE · OPTIONAL TEXT. For each load-bearing fact ask "what should the player *experience* here?": environment when the player should infer; player action when the player should own the conclusion (walk to the north cut, stand at the centre); dialogue for social moves; cutscene when witnessing or timing is the experience; optional text for texture. A fact carried by two channels needs a named reason (each repetition must add content) or one instance is cut. Record the choice in the doctrine audit's channel table.

---

## 14. Destructive probe suite

| Probe | Question | Failure means | Who runs | Evidence recorded |
|---|---|---|---|---|
| Move deletion | delete one player/NPC move: does the response change? | the move is decorative; no turn causality | CHEAP deletes + diffs; FABLE judges | node id, page ids, unchanged response |
| World substitution | replace the material constraint with an inert one: same leverage, moves, outcome? | the world dresses the scene instead of causing it | FABLE (with CHEAP substitution draft) | the substituted element, what stayed identical |
| Speaker swap | de-lexicalised clusters: can the lead attribute them by mechanism? | voices differ only by lexicon | CHEAP anonymises; FABLE attributes | cluster, attribution, mechanism named |
| Author-thesis deletion | delete a line that explains theme/emotion: is anything performable lost? | the line was the author speaking | CHEAP lists candidates; FABLE decides | line id, verdict |
| Payoff ablation | delete the setup / neutralise the return: same function? | the payoff is cosmetic or the setup unnecessary | CHEAP ablates; FABLE reads | setup/payoff ids, function before/after |
| Route causality | trace every route: unreachable writer, read-before-write, dead state, access without rendered antecedent | broken causality under free ordering | CHEAP (lint + route trace); FABLE resolves | O-list rows (id, defect, fix, runtime risk) |
| Runtime injection | route with no opening, effects before counter, invalid cursors, reload mid-chain | physical runtime defect | CHEAP (harnesses) | harness name, failing case |

Every finding: `exact line/node → gate/mechanism → proof → minimal repair → regression risk`. The audit closes with: maximum defect · mechanism worth preserving · new test · claim boundary.

---

## 15. Human validation contract

Model/automated validation certifies **structural validity** only. It cannot certify fun, natural dialogue, memorability, emotional impact, attachment or suspense. Those remain hypotheses in every report (Act 3 audit §13 lists them as such). As of v0.1 no human test has been run on any act: every "five-question verdict" in the act reports is the lead's own diagnostic, labelled as such.

Protocol (`human-test.md`): one observer, one tester, no intervention. Five fixed questions after the session, in this order: 1. What were you trying to do? 2. What do you want to know next? 3. What did you expect would happen? 4. What confused you? 5. Which moment or image do you remember? **Raw answers are stored verbatim** before any interpretation; the model's prediction sits in a separate column.

Separate sessions/cohorts (never mixed with the five questions, because the question teaches the tester what to notice): blind speaker attribution · delayed recall (declare the interval) · choice–cost–echo recall · world-substitution blind A/B (counterbalanced). Report raw counts beside percentages; a formative pass is not validation evidence.

---

## 16. Validators (adopted)

Criterion: a check becomes a studio validator only if it (A) caught a real defect in Acts 1–3, or (B) protects a proven high-risk invariant. Deterministic scripts only; no LLM calls.

`tools/narrative/lint-missions.js` (generic, runs over every mission JSON + the adapter; wrapper `test/narrative-lint.js`):
1. **Dangling state** — flags/values/evidence written by an effect and read by nothing (conditions, `pages_by_value`, objectives, entity `when`, classic sync) → warning list with an allowlist file for INTENTIONAL-UNRESOLVED. Caught: `m5_theory_revised`, `jacques_statement_terms_known`, `audrey_salvata`, `jacques_death_suspicious` (no reader).
2. **Read-before-write** — a condition key no mission writes and not in the declared external-writer list (classic sync, carry-over evidence) → error. Protects the Act 3 single-writer moves.
3. **Multiple writers** of one evidence id or one write-once value across missions → error. Caught: `east_route_confirmed` double-writer risk (O3).
4. **Required evidence declared optional** — evidence required by a condition of a mandatory node or of an objective, written only by an `optional` / non-mandatory node → error. Caught: Ronette optional (Act 2), ring comparison optional (Act 3).
5. **Shadow pairs** — two world nodes on the same (map, target) with identical or empty condition lists → error. Protects the anti-shadow rule from `narrative-validate-m6`.
6. **Rendered metadata** — node ids, evidence ids, result codes, design tags in any page/label/prompt/objective text → error. Caught: result ids in feedback (Act 3 pass 01 gate).
7. **`pages_by_value` domain coverage** — every value in the domain has a case or the node declares `pages_by_value.partial: true` → error. Protects Bible §13.2.

Kept where they are (mission-specific, already proven): objective partition per reachable state (Gate 10 in `narrative-validate*.js`, `act-*-flow.js`), route matrices, save/reload round-trips, `choice-prompts` (≤ 48 chars), `choice-prompt-dedup`, `interaction-voice` (mechanical voice hygiene), `act-3-mirror-gate` (cross-layer gate). Not automated on purpose: knowledge provenance (needs the ledger's judgement), speaker swap (lead), pacing verdicts, any quality score.

---

## 17. Narrative authoring contract (paste-able)

```
NARRATIVE AUTHORING CONTRACT (v0.1)
Before any narrative design or dialogue work read docs/narrative/README.md, docs/narrative-system-v0.1.md
and docs/narrative-craft-bible-v0.1.md. Produce the templates the milestone requires (system §2/§4).
Hard structural gates (system §3) are requirements; heuristics are diagnostics; emotional-quality claims are hypotheses.
Every load-bearing fact has provenance (source/status) and a rendered acquisition on every route that reaches its line.
Every important scene has a named intended change and a proof of the turn that is an action.
Every significant state write has a reachable reader or an explicit INTENTIONAL-UNRESOLVED designation.
No player-facing deduction is offered before its premises; feedback answers the link, never the verdict.
Objectives, gates and optional/mandatory declarations are one contract; refusals speak in the fiction.
No new narrative engine abstraction without repeated production pressure (system §20).
Fable owns judgement and wording; cheap agents own discovery, wiring, tests and mechanics (system §19).
Run node test/narrative-lint.js and the mission validators before claiming structural validity.
```

---

## 18. Agent discoverability

Mechanism in this repo: `CLAUDE.md` at the project root is the agent entry point (`AGENTS.md` defers to it; `Twin Peaks Game.md` holds architecture and MEMORY). A short "Narrative work" section in `CLAUDE.md` directs to `docs/narrative/README.md`; the README points to this document, the Bible and the templates. No second instruction mechanism; nothing narrative is pasted into prompts any more.

---

## 19. Model economy (part of the system)

| Work | Tier |
|---|---|
| Dramatic engine, hidden truth, major beat structure, evidence interpretation, important scene contracts, character voice, dialogue, ambiguity, value conflicts, three repairs, final judgement, Golden Concept direction, final review | **FABLE / lead** |
| Topology extraction, ledger filling from known sources, route tracing, state read/write analysis, setup/payoff inventory, precondition checking, pacing counts, validator execution, transcript extraction, JSON/adapter wiring from a frozen spec, tests, captures, documentation mechanics, vault sync | **CHEAP** (sonnet/haiku, bounded brief, concise return) |
| Hybrid | cheap agent produces evidence → Fable interprets and decides; never the reverse |

Rules: Fable never greps or counts flags; a cheap agent never chooses a wording, a repair or a gate verdict; briefs to cheap agents state the file boundary and "stop and report if the data looks wrong, do not weaken tests".

---

## 20. Runtime architecture — documented, not rewritten

**Ownership today.** Two layers: classic (`js/data.js` dialogues, `js/glue.js` NPC cascades + `INTERACT_DLG`, `js/maps.js` doors/interacts) and mission (`narrative/missions/M*.json` → `js/narrative-data.gen.js`; `js/narrative-runtime.js` pure state machine; `js/narrative-engine-adapter.js` targets, entities, sessions; `js/narrative-production.js` HUD + classic↔narrative flag sync). The mission layer preempts classic per (map, actor/target) in `tryInteract`; `NARRATIVE_ENTITIES.when` controls sprite presence only. Act 1 and the finale are classic-owned; Acts 2–3 (M4–M6) and M8/M9 are mission-owned with classic bridges (`lucy_a3`, `specchio315`, Roadhouse).

**Known duplication.** Flags mirrored both ways in `narrative-production.js` (atto3/4/5, jacques_preso, jacques_dead→jacques_morto, maddy_trovata, gigante2, narrative_m8_owned); doors gated by classic flags that mission nodes write; the same map interact keyed twice (`mucchio_terra` classic vs `mound` adapter).

**Proven pain.** Two Hawks / two Jacqueses / two Giants (Act 3 design §3); simulators needing stubs for mission-owned spans; every retired classic node re-pins three tests; a premise error about which classic node writes which flag (pass 01 §1).

**Migration trigger.** Consolidate only when a future act must *rewrite* a classic-owned span for mission logic twice, or when a cross-layer bug reaches a human test. Until then: retire classic content that conflicts, keep bridges, add a cross-layer regression test per bridge (pattern: `test/act-3-mirror-gate.js`). No Narrative Engine v2.

---

## 21. What Acts 1–3 taught (evidence table)

| Practice | First real failure it caught | Repair | Standard? |
|---|---|---|---|
| Production topology audit before design | Double R orphaned from Act 1; contradictions in the station (Hawk "patrolling" ten tiles away) | route + rewrite (NVS01) | YES (step 2) |
| Objective/gate contract | Silent HUD after both visits; want/HUD contradiction at the wake (Act 2) | objective partition + in-fiction rungs | YES (hard gate) |
| "Observations a system depends on cannot be optional" | Ronette's visit optional while the act's comparison depended on it (Act 2 closure) | `node_done` gate, never a third evidence condition | YES (lint #4) |
| Rendered acquisition over metadata | "veniva da est" asserted from an Act 2 line with no bridge-side page; cards/stove claimed by Jacques with no object (Act 3 F3/F4) | E_PONTE_DIREZIONE, E_STUFA, E_CARTE atoms | YES (ledger rule) |
| Fact ledger + partial-order trace | theory offered before its premises (A10 after A9 alone in 2/6 orders); north route unlocked by a line at the door, not by walking (O1, O3) | R1; single writer moved to the north-cut node | YES (steps 5, 13) |
| Setup–payoff ledger + ablation | S1 custody with no in-act reader (a recorded state with no perceivable consequence) | R3 procedural echo at B12 | YES (step 6) |
| Scene contract before prose | Truman as file dispenser (Act 1); Ben/Audrey never touching (Act 2); Truman's drafted "L'impeto non posa un anello" handing the answer (Act 3) | wants, leaks, exit costs; R2 | YES (step 9) |
| Speaker-swap / voice mechanism | Cooper closer formula on every dialogue (Act 1); Hawk and Truman collapsing into "short factual man" risk (Act 3) | aphorism budget; ages vs procedure contracts | YES (step 10 + probe) |
| Anti-shadow / single owner | two Hawks, two Jacqueses, duplicated second Giant; Truman teleporting | classic retirement, entity `when`, mirror-gate test | YES (lint #5, topology audit) |
| Dangling state review | `m5_theory_revised`, `jacques_statement_terms_known`, `audrey_salvata`, register flag with no reader | cut / merge / give one reader | YES (lint #1) |
| Played-transcript review in the browser | Ronette gate as a third evidence condition passed unit tests and was unmatchable in the real UI; hospital text debt ("finestra", "Sei letti"); Hawk entities cancelling each other (pass 01) | node_done gate; re-grounding; distinct entity ids | YES (step 20, before any freeze) |
| Milestone rung + pacing probe | spine too long / padding risk (NVS01) | spine short, echoes on `done_*` flags | YES as heuristic |
| Five-question verdict (model-run) | Act 2 "fourth question fails" (exploration produces no connection) | Double R routed | YES as diagnostic; human answers required for evidence |
| World state is narrative | intro clock 11:30 in a dusk slice | clock line | YES (freeze checklist) |

---

## 22. Versioning

This is **Narrative System v0.1**. Revisit when: Act 3 full implementation (C–E) reveals a failure the system did not predict · Act 4 introduces a new class of problem (the confession script, per-fact tracking) · a human test contradicts a current assumption · another game exposes a Twin-Peaks-specific assumption hiding in layer B.

The Bible is not edited casually. Every doctrine change is recorded in `docs/narrative/CHANGELOG.md` as OLD RULE · NEW RULE · PRODUCTION EVIDENCE · WHY, and the Bible's version number moves.
