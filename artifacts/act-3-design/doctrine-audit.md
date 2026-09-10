# Act 3 — doctrine audit (Portable Briefing v0.1 vs. act-3-design-report)

Doctrine source: `docs/narrative-craft-bible-v0.1.md` (= vault "Portable Briefing — Narrative and Dialogue Craft"). It is authoring/review doctrine, not canon, not a runtime spec. HARD GATES (§10 table, §5 evidence rules, §2 precondition check) are treated as pass/fail; everything about how a scene *lands* is HYPOTHESIS.

**Verdict: STRUCTURALLY VALID WITH REPAIRS.** Three design repairs (§14) and eleven mechanical corrections (§11) are required before implementation. No scene is structurally not ready. No new system is needed.

Finding format: exact beat/node → gate → mechanism → minimal repair → regression risk.

---

## 1. Dramatic engine check

| Element | Act 3 as designed | Status | Repair |
|---|---|---|---|
| Want | "Reconstruct the night materially, then one man in a room with a pen" (report §4) — statable | PASS | — |
| Obstacle | the scene is mute and weather-contaminated; the witness sits outside jurisdiction; the ring cannot be read | PASS | — |
| Opposition acting without waiting | the scene was arranged before Cooper came (A6/A9); prints left and did not return (A2/A14); the witness is killed under guard (B9) | PASS at act level; the death is timed *after* the arrest, i.e. reactive. Acceptable: the story-level opposition's independent strategy is Act 4's job (Maddy), and the Bible declares the offscreen action deliberately. | none — do not add a scene to fill the slot |
| Escalation demanding a changed strategy | reading (M5) → interrogation tactic (M6) → the material method fails at the bed → the mirror (a channel Cooper cannot file) | PASS | — |
| Hidden truth contribution | "prepared, local, repeatable" advances "the crime was out there → the crime is in the house" without resolving it | PASS | — |
| Value conflict contribution | S1 (institutional vs personal custody, Truman signs against himself); Truman filing the guard and not the giant | PASS (contribution, not resolution) | S1 needs a legible in-act echo (§9 → repair R3) |

Protagonism: Cooper is *confirmed* at the arrest and *broken* at the call — two of the four allowed outcomes within one act; the climax proper is later. No change.

## 2. Partial-order / precondition audit (from the order trace)

Findings that fail the §2 check "preconditions guaranteed on every valid path":

| # | Beat/node | Mechanism | Minimal repair | Risk |
|---|---|---|---|---|
| O1 | A10 theory | can fire after A9 alone; the "disposizione" premise (E7B flap, E_SCENE) may be unseen in 2 of 6 orders and after A9 in all 6 | A10 conditions: `node_done m5_mound ∧ node_done m5_scene ∧ node_done m5_cmp_ring`; drop the milestone's group-count blocking for this pair | none (plain node conditions) |
| O2 | A12 Truman | `m5_report_intro` not gated on the comparison; Truman could quote the dust before the player produced it (Bible §13.1 shape) | add `node_done m5_cmp_ring` to `m5_report_intro` conditions | none |
| O3 | A14 / `east_route_confirmed` | writer is the door-side line in `m5_report_close`; the walk would be decorative | move the `set` to the north-cut node; delete from `m5_report_close`; rewrite the "unico writer" invariant; re-pin `narrative-validate-m5` | the flag fires twice if both keep it → test must assert single writer |
| O4 | rung between A13 and A14 | stale "Riferisci a Truman" after Truman was met | new rung 350: `node_done m5_s1 ∧ ¬east_route_confirmed` → "Hawk è ai binari, oltre il vagone." | none |
| O5 | B7 hospital walk | skippable: `m6_return_night` needs only `jacques_preso` | new node `m6_hospital_guard` (`jacques_preso ∧ ¬jacques_dead`, target `night_register`); add `node_done m6_hospital_guard` to `m6_return_night`; rung 350 in M6 | a second node on the same target as `m6_hospital` (post-death) — anti-shadow test must see mutually exclusive conditions |
| O6 | B7 vs B10 flags | pre-death visit must not write `night_log_no_visitor` / `jacques_death_suspicious` | B7 effects: notebook note only | authoring mistake only |
| O7 | B9 Lucy-call theory variant | a second `pages_by_value` on the same node is last-wins (Bible §13.2) | `pages_after_branch` page conditioned on `m5_final_theory == degeneration` (M5's own report-intro precedent) | none |
| O8 | A14 page | would restate the bridge's "nessuna torna indietro" | the north-cut page adds only the car-specific fact (the prints pass the car and enter the cut) | none |
| O9 | oej door | ungated today | `needsFlag: east_route_confirmed`, in-fiction `blockedMsg` in Cooper's voice | classic `jacques_a3` becomes unreachable → simulators (`smoke`, `walkthrough`) need the M6 path or a stub |
| O10 | B11 mirror before the death | HUD-only? No: the classic cascade keys `gigante1_dlg` on `jacques_morto` (Giant trace §1) | none; document the gate | none |
| O11 | Hawk's north-cut line | currently inside `m5_report_close` (`m5.b9.report.p06`) | move to the A14 node; do not duplicate | plays twice if left |

## 3. Fact & knowledge ledger — hard-gate results

Ledger in `fact-knowledge-ledger.md`. Knowledge gate (wording before acquisition):

- **F1** `m5_theory_initial` offers "disposto" at 2 groups, before P3A exists → fails; fixed by R1 + O1.
- **F2** `east_route_confirmed` written by a line, not by the trace → O3.
- **F3** Jacques's cards/stove claims have no antecedent clue (assertion, not clue) → build E_CARTE/E_STUFA (design already includes them; ledger confirms they are load-bearing for *fairness of the tactic choice*, not merely texture).
- **F4** Ronette's direction is told (James, Act 2) and never shown → E_PONTE_DIREZIONE as environment (stake + planks), Hawk only *dates* the prints.
- **F5** "Laura came here more than once" has no page; it is Cooper's synthesis of A2+A7+A8 → allowed only as an optional Cooper line after both A7 and A8 (`conditions: node_done stove ∧ node_done cards`); otherwise unsaid. Never a Truman or Hawk line.
- No character says "Jacques ha ucciso" as fact; the system never certifies the third man's identity; death / testimony-lost / suspicious stay separate. PASS.

## 4. Setup–payoff ledger — results

Ledger in `setup-payoff-ledger.md`. PAID: bridge/east, ticket↔verse (optional), arrest→call, guard→Lucy→bridge, Hawk's pact. INTENTIONAL-UNRESOLVED: the ring's meaning, S1's Loggia echo, the Giant's object. UNPAID today, paid by the frozen design: stove, cards, Audrey's promise (Truman variant at the night report), register (Truman variant at the bridge), north tracks (re-gated on the walk). Ablation confirms the two river-crossing setups (cards, stove) are the ones that make the tactic choice fair rather than blind.

## 5. Investigation fairness

| Rule | Beat | Result |
|---|---|---|
| Clues precede conclusions | A9 before A10 before A12 | PASS after O1/O2 |
| Atomic evidence | E7A/E7B split; E8A/E8B split; E_CARTE (object) never bundled with Jacques's testimony | PASS |
| Presence ≠ authorship | B5 `p5_killed` rejected: "Le prove collocano. Non attribuiscono." | PASS |
| Player sees premises | theory options restate their premise (A10) | PASS with R1 (no "disposizione" before its premises) |
| UI does not anticipate | A10 as drafted offered "disposizione" as a menu item once its premises are held → *recognition* | **FAIL → R1** |
| Propositions multi-state | P3A: formulated (A9) → presented (A12) → accepted-as-yours / contested; P5 formulated → arrest; P9 formulated | PASS after R2 (A12 makes P3A *presented*) |
| Feedback answers the link | `ring_a` feedback restates the chosen label verbatim (`m5.b8c.feedback.deliberate` = the label) — a restatement, not a link; Truman's drafted impeto answer "L'impeto non posa un anello al centro" hands the answer | **FAIL → R1 (feedback = action page) and R2 (Truman asks the link with memory)** |
| Suboptimal choices fail forward | ring_b/ring_c retry with merit ("Le impronte fuori dicono altro" / "Niente qui dice di chi sia"); impeto proceeds with the world correcting it | PASS after R2 |
| Central evidence cannot be missed | A4–A6, A9 mandatory; cards/stove optional with graceful defaults; register optional with one reader | PASS |
| Design metadata never renders | results (`DELIBERATE_PLACEMENT`, `SOURCE_CORROBORATION`) are ids; must stay unrendered — add to the implementation test | PASS (guard in tests) |
| Triple explanation | ring: page → comparison feedback → Cooper to Truman | reduce: feedback becomes an action; Cooper states only the reading; Truman does the third voice. Rule for prose: every restatement carries new content or dies |
| Notebook asks, not explains | `m5.note.cooper_reading` ("Leggere la scena prima che il tempo la legga per me") and `m5.b7.scene.p02` explain | rewrite notebook entries as bare facts + one question; cut the Cooper aphorism note |

## 6. Preliminary theory under pressure — verdict: MODIFY

Doctrine (§5): preliminary theory on partial evidence → mandatory last observation → keep / revise / both, recorded. "A false lead offered as a menu option and corrected later is recognition; a false lead that was *your* theory and met resistance is investigation."

The report's A10 (interpretation after the mandatory comparison) makes "impeto" a dumb option and "disposizione" a recognition — the comparison has already answered. Modification, using the two existing nodes:

- **A3-end, preliminary (`m5_theory_initial`, rewritten):** after the first look from the door (torn corners, bent sheet, a mound in the doorway, something on the beam) the notebook asks "Prima lettura?" with two options only: **"Un incontro degenerato."** (impeto) / **"Non scrivo ancora."** (withhold — Cooper's method, a real stance). No "disposizione": its premise is unseen.
- **Mandatory last observation:** A9 ring↔dust (after A4, A6, A5). Feedback = action, not verdict: "(Cooper non lo tocca. Fotografa il bordo della polvere, poi il centro.)"
- **Revision (`m5_theory_revision`, conditions O1):** "La polvere è intatta. Regge ancora?" — if impeto held: **keep** / **rivedo → disposizione** / **aperta**; if withheld: **impeto** / **disposizione** / **aperta**. Recorded as `m5_final_theory`; `m5_theory_revised` cut.
- **Truman (A12):** contests or accepts-as-yours (R2). No loop.

Why not KEEP: player ownership is the act's stated purpose (§5 "the player must participate in inference"); with the comparison first, the interpretation is a label pick. Why the UI stays non-anticipatory: each prompt offers only readings whose premise has been rendered; the withhold option is always available.

## 7. Scene contracts

`scene-contracts.md`: 12 scenes, 10 answers each, per-speaker self_image/declared/leak/protected/exit_cost for Hawk, Truman, Jacques. All READY; three stubs (S3 pre-report blocked line; S7 nurse line and guard placement; S4 impeto merit page) resolved by R2/O-list. Nothing STRUCTURALLY NOT READY.

## 8. Character voice audit (speaker-swap, de-lexicalised)

Clusters tested (names, places, catchphrases stripped):

- **Hawk vs Truman** — both plain, short, fact-then-stop. Swap "Nessuno ci è entrato dopo la pioggia. La polvere è d'accordo con me." with "Non avete toccato niente. Bene: adesso tocca a me guardare." → attribution *degrades* to marginal. Mechanism: both use "fact with a place". **Contract revision:** Hawk speaks in **ages, durations and directions** (older than the rain, none return, three steps from the door) and never in clocks of procedure; Truman speaks in **clocks and turns of procedure** (stasera, domattina, tocca a me, a verbale) and never in distances. Hawk's avoided admission: "penso". Truman's: "credo" about the case (he says "le credo" only about people, and the mission version rightly cut it).
- **Jacques vs Cooper** — survives: Jacques changes the subject in a long sentence and bargains in a short one; Cooper asks one thing and waits.
- **Cooper across nodes** — a *closing-formula tell* (§14): nearly every M5 node ends on a Cooper aphorism (`p04`, `p05` ×3, `sign_oej.p02`). Rule for prose: at most one aphorism per scene; the others become measurements or silence.
- **Lucy, nurse, Audrey, Giant** — single-scene voices; pass by construction (Audrey: cover identity decoded by Cooper; nurse: procedure-first).

No contract collapses; two are tightened (Hawk, Truman) and one prose rule added (Cooper).

## 9. Choice / agency audit

| Choice | Intention | Immediate reaction | Recorded | Later echo (legible) | Visible cost | Visible gain | Pareto |
|---|---|---|---|---|---|---|---|
| Preliminary theory (A3) | commit early or withhold | notebook records; no NPC | `m5_initial_theory` | revision prompt differs; Lucy-call variant if impeto survives | committing early can be contested by Truman | early commitment makes the revision *yours* | yes (commit vs withhold) |
| Revision (A10) | keep / revise / open | — | `m5_final_theory` | Truman's merit page; Lucy variant | impeto: contested on the record; disposizione: "la lettura è tua" (exposure); aperta: nothing filed | impeto: consistency; disposizione: Truman's attention; aperta: no exposure | yes |
| S1 custody | safe vs pocket | Truman's page (objection on record) | `s1` | **today none in act → R3:** B12 procedure line; Loggia deferred | pocket: Truman's dissent; safe: Cooper loses sight of the object | pocket: keep looking; safe: cited at the warrant | yes |
| Tactic (B3) | proof / pressure / ease | branch | `m6_tactic` | Lucy regret; M9/M10 per LOCK | each branch's named cost (lawyer's shadow / polluted names / the part to keep) | each branch's atom | yes (three incomparable) |
| P5 | claim what holds | feedback in the merit | P5 | arrest | retry costs a page | — | not a stance (a claim test) — acceptable |

No fake agency once R3 lands. Honest linearity declared: macro-sequence locked, local agency in five choices.

## 10. Channel-selection audit

| Fact | Channel (frozen) | Named gain of any move |
|---|---|---|
| Ring placement | ENVIRONMENT (two pages) + PLAYER ACTION (comparison) | — |
| Ticket | ENVIRONMENT; text as OPTIONAL comparison with the verse | — |
| Bridge direction | ENVIRONMENT (stake, worn planks) with Hawk only dating the prints | moved from dialogue: the player *infers* the direction instead of hearing it (fixes F4) |
| Cards, stove | ENVIRONMENT, optional | — |
| Tracks north | PLAYER ACTION (walk) + one Hawk fact | moved from dialogue at the door: the OEJ gate is caused by the player (fixes F2/O3) |
| Guarded room | ENVIRONMENT (guard sprite, door) + one nurse line | new B7: the resource is *experienced* before it is mourned (§14) |
| Register | OPTIONAL TEXT with one reader | — |
| Giant | brief CUTSCENE (witnessing) reached by going to bed, never by an HUD line naming him | — |
| Jacques's death | DIALOGUE (Lucy) — off-screen by design; a cutscene would make it witnessed rather than lost | — |

No other moves. Mandatory facts never live only in optional content (checked: cards/stove/register/Audrey are optional and non-load-bearing for progression).

## 11. Destructive probes

| Probe | Result | Repair |
|---|---|---|
| MOVE DELETION | Jacques branches: deleting q2 (prova) removes the midnight atom; deleting `p07` (falsa) removes the table's closing — both change the response → PASS. Truman on-site: deleting Cooper's theory line leaves Truman's `p03` unchanged in the *current* JSON → FAIL → R2 (Truman's page depends on the value) | R2 |
| WORLD SUBSTITUTION | warehouse instead of car: rails ending (a chosen place), the creek bridge (only crossing), rain-dated prints, the county line as jurisdiction, the dock planks (escape fails) all change leverage/outcome → PASS. Note: the *car interior* alone would survive substitution; the world specificity lives outside it — the environment brief must keep bridge/rails/cut, not just the car | brief already does |
| SPEAKER SWAP | Hawk/Truman marginal → contract tightened (§8) | §8 |
| AUTHOR-THESIS DELETION | `m5.note.cooper_reading` ("Leggere la scena prima che il tempo…") — deleting changes nothing performable → CUT. `m5.b3.discovery.p04` ("…prima di diventare una storia") → keep one of the two, not both. Hawk's classic "Il treno era il suo tempio" → already cut | prose step |
| PAYOFF ABLATION | guard: delete B7 → Lucy's question still functions but the loss is told-then-told → keep B7 mandatory. Cards: delete A8 → tactic page silent, P5 plain → graceful. S1: neutralise the return → today the choice has no return in the act → R3 | R3 |
| ROUTE CAUSALITY | O1–O11 above | O-list |

## 12. NPC function budget

Hawk 2 (reader of the outside; keeper of thresholds: door, dock, ferry). Truman 3 (receives/contests the reading; custody counterpart; files the breach). Jacques 2 (witness-under-tactic; false solution). Audrey 1. Nurse 1. Lucy 1 (messenger whose third sentence is the case's question). Giant 1. No answer-bundle. No change.

## 13. Player / audience state — HYPOTHESES

| Movement | Entry (want / belief / control) | Exit (belief / fear / curiosity / control) | Desired exit impulse |
|---|---|---|---|
| Traincar (A1–A14) | want: see where James's road goes; belief: a stranger's crime, out there; control: high (one road) | belief: arranged, repeated, local; certainty: low on *who*, high on *how*; control: high (Hawk is standing at the trail) | **follow the prints past the car** (not "go to the casino") |
| Jacques arrest (B1–B6) | want: one man who was there; belief: he may be the killer; control: low (out of jurisdiction) | belief: present, not author; fear: none yet; control: high (a signature tomorrow) | **get him signed before he changes his mind** |
| Jacques death (B7–B9) | want: sleep, sign in the morning; belief: the guard is enough | belief: someone can pass a guard; fear: local, active; certainty: the model is broken; control: **low** | **go back to the hospital / ask who signs** — the design deliberately gives the player nothing to do but go to bed: control withheld is the intended state |
| Giant (B11–B12) | control: low; curiosity: high | belief: the material method is not sufficient; curiosity: "why me, and who is next" | **file what can be filed, and watch the town** (Act 4) |

Cohorts: impeto-keepers exit the traincar with a theory Truman disputed (higher pressure at the call); withholders exit with no theory and more control; documented-custody players carry an object into 315 (the Giant's line lands on it); ease-tactic players lose the most named resource at the call. All HYPOTHESES for human testing.

## 14. Exactly three repairs (impact-ordered)

**R1 — Put the player's theory under pressure (A3 → A9 → A10).**
PROBLEM: interpretation after the comparison is recognition, not investigation.
MECHANISM: the menu carries the answer once its premise is held (§5 "UI must not anticipate").
MINIMAL CHANGE: preliminary prompt at the door with two options (impeto / withhold); mandatory last observation = ring↔dust with an *action* feedback; revision prompt after mound+centre+comparison (keep / revise / open, or the full three if withheld). Reuses the two existing M5 nodes; cuts the milestone group-blocking and `m5_theory_revised`.
INTENDED PLAYER EFFECT: the false lead is *yours* and meets the dust; revising is an act, keeping is a stance.
NEW RISK: a withholder reaches the revision with no theory to revise — handled by offering all three; the door prompt must not fire before the whole interior has been rendered from the door (page order in `m5_discovery`).

**R2 — Truman contests, never refutes; the world corrects.**
PROBLEM: Truman's drafted answer to "impeto" hands the answer; a refutation loop would need a value rewrite the runtime does not have.
MECHANISM: feedback must answer the missing link with memory (§5), and fail-forward must not seal the thread (§5 witness fairness).
MINIMAL CHANGE: `pages_by_value` on `m5_report_intro`: impeto → Truman quotes Cooper's own note ("La polvere, Cooper. L'hai scritta tu: intatta fino al bordo. Cosa la tiene al centro?") → Cooper "Non lo so ancora." → Truman "Allora scrivo i fatti. La lettura resta tua." P3A becomes *presented + contested*; the act proceeds; the correction arrives as events (Jacques's admission, the pillow) with one `pages_after_branch` page at the call ("Avevo scritto impeto, Harry. Un cuscino non è un impeto."). disposizione → accepted-as-yours (`p03` as written); aperta → both carried.
INTENDED PLAYER EFFECT: a wrong theory is a cost carried through the act, not a puzzle re-tried.
NEW RISK: an impeto-keeper never explicitly "learns" placement in M5; the ledger accepts this because P3A is formulated by the mandatory comparison regardless of the label chosen, so no later read depends on the label.

**R3 — Read S1 back as procedure, and keep the ring unexplained (ambiguity preserved).**
PROBLEM: the custody choice has no legible echo in the act (§4 "reaction only = cosmetic-but-claimed-meaningful"); the deferred Loggia echo is a credit debt.
MECHANISM: a recorded state with no perceivable consequence.
MINIMAL CHANGE: at B12 one Truman line by `s1`: institutional → "L'anello è in cassaforte. Lo cito nel rapporto." / documented → "L'anello ce l'hai tu. Non lo cito." Nothing says what the ring is; the Giant's "Questo le apparterrà quando sarà vero" stays identical in both branches and is left unglossed.
INTENDED PLAYER EFFECT: the stance is seen in the file, not judged; the object's meaning stays open for the finale.
NEW RISK: none structural; the temptation to explain the ring at B11 must be resisted in prose.

Deliberately *not* repaired: the reactive timing of Jacques's death (Bible-declared), Audrey's thinness (paid with one line, no arc added), the Giant's text (frozen).

## 15. Claim boundary

Certified here: knowledge integrity, route causality, choice architecture, channel choices, scene-contract completeness — *structurally valid after R1–R3 and O1–O11*. Not certified: that the traincar feels like investigation, that the call lands as loss, that Hawk reads as a colleague. Those are hypotheses in §13 and go to a human cohort after the playthrough step.

Maximum defect: theory-by-recognition (R1). Mechanism worth preserving: the three-tactic interrogation with per-branch leak channel. New tests: single-writer for `east_route_confirmed`; A10 unreachable before mound+centre+comparison; B8 unreachable before B7; no rendered result ids; Lucy-call variant emitted only for `degeneration`.
