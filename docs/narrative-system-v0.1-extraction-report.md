# Narrative System v0.1 — extraction report

Date: 2026-09-10. Milestone: turn the narrative knowledge and practices accumulated in NVS01 / Act 2 / Act 3 (design, doctrine audit, implementation pass 01) into the permanent operating system of the studio. Nothing narrative was rewritten; no runtime code changed; Act 3 stays at pass 01.

Deliverables: `docs/narrative-system-v0.1.md` (22 sections) · `docs/narrative/README.md` (entry point) · `docs/narrative/CHANGELOG.md` · `docs/narrative/templates/` (10) · `docs/story/` (truth-model schema, unpopulated) · `tools/narrative/lint-missions.js` + `lint-allowlist.json` + `README.md` · `test/narrative-lint.js` · `CLAUDE.md` "Narrative work" pointer. Vault mirrored.

## 1. System boundaries

Three layers (system §1): **A. Story knowledge** (what is true in this game; `docs/story/`, Role Contract, per-act ledgers; changes entirely for another game) · **B. Authoring system** (pipeline, ledgers, contracts, audits, probes, human test; reusable) · **C. Runtime / validation** (missions, runtime, adapter, classic layer, tests, lint; documented, not redesigned). The Bible is authoring + review doctrine only: not canon, not runtime spec, not proof of quality.

## 2. Canonical authoring workflow

23 steps (system §2), each tagged mandatory / conditional / optional with its template and its owner tier. Scale-down rules: an examine-only beat needs six steps; a one-line fix needs three; an act needs all. The shape is justified by where defects were actually found: NVS01 and Act 2 in the topology audit, the diagnosis and the played transcript; Act 3 in the doctrine audit before any code (theory by recognition).

## 3. Hard gates vs heuristics

Fourteen hard gates, each with the Acts 1–3 failure that justifies it and its detection point (system §3): knowledge before acquisition · payoff/setup status · required beat without required evidence · read-before-write / unreachable writer / dead state · duplicated owner · objective/gate disagreement · UI anticipates deduction · move stored not rendered · effects at wrong phase · fake meaningful choice · proposition truth ≠ NPC acceptance · rendered metadata · silent refusal · runtime physical. Heuristics (mannerism, aphorism budget, enter late / leave early, NPC budget, attachment model, revelation patterns, rhythm, pacing minutes) are diagnostics that must be reported and argued, never auto-fixed.

## 4. Canonical artifacts / templates

Ten templates, each with PURPOSE · WHEN REQUIRED · FIELDS · PASS/FAIL · WHAT NOT TO PUT HERE: act-design (absorbs beat map, pacing estimate, engine pressure, implementation plan), fact-knowledge-ledger, setup-payoff-ledger, evidence-map, scene-contract (full + lightweight), voice-contract, doctrine-audit (absorbs agency, channel, order audits, probes, three repairs), implementation-report, freeze-report (absorbs pacing and played-transcript review), human-test. Not created: beat-map, pacing-review, implementation-plan (drift evidence: Acts 1–2 restated the beat map three times across files).

## 5. Story truth model

`docs/story/` schema (README + skeleton files): truth · timeline · characters/ · facts/ · revelations/ · relationships/. Every entry carries `source` (canon · adaptation · project-fact · new-proposal · interpretation · uncertain) and `status` (locked · open · deprecated) as independent dimensions; a locked interpretation stays an interpretation; only canon / adaptation / project-fact may be objective truth. Four things never collapsed: objective truth · what Cooper knows · what an NPC knows / falsely believes / withholds · what the player has seen. Update rules require a CHANGELOG record and a ledger pass. Population deferred to a story-owned milestone (inventory + tagging of the vault Bible, Grammatica, LOCK and the ledgers; never a rewrite of the mystery).

## 6. Validators adopted

One generic deterministic linter, `tools/narrative/lint-missions.js` (wrapper `test/narrative-lint.js`), seven checks selected by the rule "caught a real defect or protects a proven invariant": dangling state (warning, allowlist with reasons) · read-before-write (error; external writers declared) · multiple writers of evidence / write-once values / declared single-writer flags (error; mutually exclusive writer conditions recognised) · required evidence declared optional (error) · shadow pairs (error) · rendered metadata (error) · `pages_by_value` domain coverage (error). Tool-level lessons found while building: `node_done` is global across missions; `presentationOptions` reads every proposition under `presentation.on`; exclusive writer conditions must be recognised or the check produces noise.

**First run caught two real defects, recorded as KNOWN-OPEN with owner milestones (not fixed here, out of scope):** `audrey_indaga` is read by M6's optional Audrey node but never synced classic→narrative (node unreachable at runtime; owner: Act 3 step C) · `P7` is presented in M9 but never formulated anywhere (dead presentation branch; owner: M9 pass). Known-open entries print on every run and must be removed when fixed.

Kept where they are (proven, mission-specific): objective partition per reachable state, route matrices, save/reload round trips, `choice-prompts`, `choice-prompt-dedup`, `interaction-voice`, `act-*-flow`, `act-3-mirror-gate`. Not automated on purpose: knowledge provenance (ledger judgement), speaker swap (lead), pacing verdicts, any quality score.

## 7. Model-economy allocation

System §19: Fable / lead owns engine, truth, beat structure, evidence interpretation, scene and voice contracts, wording, repairs, Golden Concept direction, final review. Cheap agents own discovery, topology extraction, ledger filling, route tracing, state analysis, wiring from a frozen spec, tests, captures, documentation mechanics, vault sync. Hybrid rule: cheap evidence → Fable decides; never the reverse; Fable never greps; a cheap agent never chooses a word or a gate verdict. This extraction followed it: one discovery agent, one validator agent, all boundaries and templates by the lead.

## 8. Lessons traced to Acts 1–3

System §21 table (14 practices). Highlights with their first real failure: topology audit (Double R orphaned; station contradictions) · objective/gate contract (silent HUD, wake/HUD contradiction) · "observations a system depends on cannot be optional" (Ronette optional; ring comparison optional) · rendered acquisition over metadata ("veniva da est" never stood on; cards/stove claimed without objects) · ledger + order trace (theory offered before premises; north route unlocked by a line at the door) · setup–payoff ablation (S1 without an in-act reader) · scene contract before prose (Truman file dispenser; Ben/Audrey never touching; Truman handing the answer) · speaker swap (Cooper closer formula; Hawk/Truman collapse risk) · single owner (two Hawks, two Jacqueses, duplicated Giant, teleporting Truman) · dangling-state review (`m5_theory_revised`, `jacques_statement_terms_known`, `audrey_salvata`) · played transcript in the real UI (a three-condition notebook pair that unit tests passed and the UI could not match; Hawk entities cancelling each other). The full defect history (25 rows: defect · where found · what caught it · repair) is in Appendix A.

## 9. Existing runtime intentionally untouched

System §20 documents ownership (classic vs mission per span), the two-way flag sync list, the interact cascade order (finale → adapter → classic), known duplication (mirrored flags, doors gated by classic flags that missions write, double-keyed interacts), proven pain (two Hawks / Jacqueses / Giants, simulator stubs, three tests re-pinned per retired node, a wrong premise about which classic node writes which flag) and the migration trigger (a classic span rewritten twice for mission logic, or a cross-layer bug reaching a human test). No Narrative Engine v2; no classic-to-mission migration.

## 10. Agent-discoverability change

`CLAUDE.md` (the repo's single agent entry point; `AGENTS.md` defers to it) gained a five-line "Narrative work" section pointing to `docs/narrative/README.md`, which points to the system, the Bible and the templates and names the lint command. No second mechanism; nothing narrative needs to be pasted into future prompts.

## 11. Deferred questions

- Population of `docs/story/` (inventory + tagging of the vault Bible, Grammatica, LOCK, ledgers): story-owned milestone.
- Whether `interaction-voice`'s count pins should become allowlisted deltas rather than literals (every new node re-pins three numbers).
- A generic objective-partition validator: today per-mission (Gate 10); a generic version needs route enumeration per mission and was not justified by a defect the per-mission tests missed.
- Whether `presentations[]` should be written by `pages_by_value` presentations (P3A "presented/contested" is a documented state mapping); revisit only if a later reader needs the record.
- Human test: none has been run on any act; every "five-question verdict" so far is the lead's diagnostic. The first real session is the first evidence for any quality claim.
- Classic simulators (`smoke`, `walkthrough`) now stub mission-owned spans; whether they should drive the mission runtime instead is a tooling question, not a narrative one.

## 12. Recommended point to revisit v0.1

After Act 3 steps C–E (M6 stitch, native traincar, playthrough, freeze) and the first human test: those are the first milestones executed *under* the system rather than before it. Revisit earlier only if Act 4's confession script (per-fact tracking, first-person admission) proves a class of problem the ledgers do not model, or if the lint's known-open list grows instead of shrinking.

---

Sources read: `docs/narrative-craft-bible-v0.1.md`, the three act reports, the Act 3 design report and artifacts, the implementation pass 01 report, `test/narrative-validate*.js`, `test/act-*.js`, `test/interaction-voice.js`, `test/choice-prompt*.js`, `js/narrative-production.js`, `js/narrative-runtime.js`, `js/narrative-engine-adapter.js`, `CLAUDE.md`, `AGENTS.md`, `Twin Peaks Game.md`.

## Appendix A — defect history, Acts 1–3 (what caught it)

| Defect | Where found | Caught by | Repair |
|---|---|---|---|
| Truman page 2 repeats the intro verbatim | NVS01 §2.1 | lead beat-map audit | Truman rewritten with a want and a leak |
| Truman is a file dispenser (no want/cost/leak) | NVS01 §2.2 | lead audit | leak ("shouldn't have read the diary") + route to the Double R |
| Cooper closer formula on every dialogue | NVS01 §2.3; Act 3 audit §8 | lead audit; speaker-swap probe | aphorisms cut; one per scene |
| Station contradictions (Hawk "patrolling" ten tiles away; guide offered before the gate) | NVS01 §2.4 | lead audit | new Hawk line |
| Double R orphaned; Norma's "O quasi" unresolved; Shelly's contradiction has no listener | NVS01 §2.5 | five-question lens (4th fails) | Norma routes to Shelly; cross-echo nodes |
| Intro clock 11:30 in a dusk slice | NVS01 §2.6 | lead audit | clock line |
| Act 1 climax delivered by HUD text | NVS01 §2.7 | lead audit | wake monologue node |
| Quest language at the woods gate | NVS01 §2.8 | lead audit | Cooper's in-fiction refusal |
| Act-4 lake text used on the day of discovery | NVS01 §2.9 | lead audit | act-specific text |
| Wake want vs HUD sends players to the hospital first | Act 2 §2.1 | beat-map trace | "Harry per primo. Poi lei." + HUD |
| Silent HUD after both visits (notebook step unprompted) | Act 2 §2.2 | lead audit | rungs 225/250 |
| Adapter stubs in the two rooms the act is about | Act 2 §2.3 | lead audit | guard nodes |
| Ben dispenses an aphorism; Audrey never touches him | Act 2 §2.4 | lead audit | Ben leaks a catchable lie; Audrey variant |
| Nobody but Truman answers the dream | Act 2 §2.5 | lead audit | Hawk variant |
| Dream man never tied to Sarah's sighting | Act 2 §2.6 | lead audit | Truman page 5 |
| Room 315 static after "BOB" | Act 2 §2.8 | lead audit | desk cascade node |
| Nurse = Norma sprite; Gerard mid-floor | Act 2 §2.9 | visual audit | nurse sprite; Gerard at the bed |
| Ronette gate as a third evidence condition unmatchable in the real notebook UI | Act 2 closure §9 | Chrome playthrough | `node_done` gate; `notebookPairStatus` pairs only |
| M4 completable without hearing "BOB" | Act 2 closure §1 | design review; `act-2-ronette-required.js` | `node_done ronette_uomo` precondition; ladder re-partitioned |
| "Disposizione" offered before its premises (theory by recognition) | Act 3 audit §5/§6/§14 | doctrine audit vs Bible §5 | R1 |
| Truman's drafted rebuttal hands the answer | Act 3 audit §11 | move-deletion probe | R2 |
| S1 custody with no in-act echo | Act 3 audit §11/§14 | payoff ablation | R3 |
| `east_route_confirmed` written by a line, not the walked trace | Act 3 audit O3 | precondition audit | writer moved to the north-cut node |
| Report not gated on the ring comparison | Act 3 audit O2 | precondition audit | P3A gate on the report |
| Hospital guard walk skippable (loss told-then-told) | Act 3 audit O5 | payoff ablation | mandatory `m6_hospital_guard` (step C) |
| Hawk/Truman swap survives ("plain fact then stop") | Act 3 audit §8 | speaker-swap probe | ages/directions vs clocks/procedure |
| Classic `jacques_a3` assumed to write `jacques_morto` (wrote `jacques_preso`) | pass 01 §1 | `act-3-mirror-gate.js` | contract corrected |
| Duplicate classic actors shadowing mission characters (Hawk, Jacques, Audrey, Truman wait, Giant) | Act 3 design §3; topology.md | topology audit | retired in pass 01 |
| Three Hawk placements sharing one entity id cancelled each other | pass 01 §8 | in-game capture | distinct ids + one-line actor nodes |
| `audrey_indaga` never synced classic→narrative (M6 Audrey node unreachable) | this milestone | `tools/narrative/lint-missions.js` first run | KNOWN-OPEN, owner Act 3 step C |
| P7 presented in M9 but never formulated | this milestone | lint first run | KNOWN-OPEN, owner M9 pass |
