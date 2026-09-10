# Story Truth Layer v0.1 — population report

Date: 2026-09-10. Scope: populate `docs/story/` from existing authoritative material (Phases 0–15 of the brief). No act rewritten, no runtime changed, no truth invented. Validator: `node test/story-truth-lint.js` (PASS, 1029 checks). Extraction evidence kept in `artifacts/story-truth-v0.1/` (four cheap-agent inventories + the continuity audit).

**Result.** The author is no longer mysterious to themselves: the killer, the guest, the two murders, the letters, the lie, the night at the car, Jacques's death and its agent, the dream, Sarah, the Giant and the fixed endgame are written down once with source and status. Seven questions stay open by decision and are listed as such. One live P1 continuity conflict exists in Acts 1–3 (a legacy ring clue); ten locked truths depend on the unbuilt M10.

## 1. Authoritative sources used (Phase 0 source map)

| Class | Sources |
|---|---|
| PRIMARY STORY AUTHORITY | vault `Bible - Twin Peaks Game.md` (Canon Lock; §0 hierarchy, §3, §4, §6–§9, §13, §20); `M9-M10 v1.1 (confession lock).md`; `M8 - Sta accadendo di nuovo (pacchetto).md` (re-lock R12); `Loggia-Epilogo (pacchetto finale).md`; `M5-M6 v1.1 (script lock).md`, `M4 - I Frammenti v1.1 (script lock).md` (via their design summaries) |
| SUPPORTING PRODUCTION EVIDENCE | `Architettura Causale` (binding revision + §3 offscreen timeline), `Grammatica Indagine`, `docs/act-2-closure-report.md`, `docs/act-3-design-report.md`, `docs/act-3-closure-report.md`, `artifacts/act-3-design/{fact-knowledge-ledger, setup-payoff-ledger, scene-contracts, doctrine-audit, evidence-map}.md` |
| IMPLEMENTATION / RUNTIME | `narrative/evidence.json`, `propositions.json`, `state-enums.json`, `missions/M4–M9.json`, `js/data.js` (classic), `js/narrative-production.js` (sync) |
| LEGACY / SHADOWED | `Esercizio - *.txt`, non-v1.1 pacchetti, classic Act 4–5 dialogues (`gerard_a4`, `leland_interr`, `bob_finale`) — read only where a lock points to them |
| INTERPRETIVE | `docs/narrative-craft-bible-v0.1.md`, `docs/narrative-system-v0.1.md` (doctrine, not canon); `Piano Personaggi.md` checked and excluded (sprite plan) |

Authority order applied: human decisions > repository facts > adopted canon > approved adaptations > proposals > interpretations (Bible §0). Later explicit locks (M8 R12, M9–M10 §0) override older Bible wording where they say so.

## 2. Objective truths captured

`docs/story/truth.md` §1: 17 locked paragraphs; `facts/`: 36 files, of which 30 carry `Objective truth:` (source canon 8, adaptation 19, project-fact 3). Backbone: Leland killed Laura at the car and Maddy in the house; the guest since the white house; responsibility fractured and never quantified; letters R/O left by Leland under the diary's rule; the taxi lie; Laura's two acts of custody and the car as a chosen place; Jacques present, not author, the third man = Leland; the scene arranged; Ronette's flight and scream; Jacques smothered under guard by Leland/BOB (author-known, never confessed, never certified); the dream face = the guest; Sarah suspected, never knew; the Giant's three statements; the fixed endgame.

## 3. Intentional ambiguities preserved (truth.md §3)

What BOB is; the Leland/BOB partition and Leland's memory; Laura's "Mio padre non lo sapeva. LUI sì."; the third Giant statement's meaning (S4); whether the confession was BOB's provocation; the cipher pages; the ring's meaning. Two are files with `source: uncertain, status: locked` (`bob-nature`, `leland-bob-partition`): locked refusals, not open questions.

## 4. Unresolved authorial questions (truth.md §4)

What the ring is and who placed it; who wrote the ticket; Jacques's prova timing and the true name in the pressione list; other people at the car; date and hour of the murder; S2; two or three M10 methods; epilogue breadth; writing budget; Maddy's ordinary moment (source conflict); the referent of "È successo di nuovo" at the mirror. Files: `facts/ring-identity`, `scene-arranger`, `ticket-author` (source uncertain, status open).

## 5. Character-knowledge coverage

15 files: cooper, truman, hawk, leland, bob, laura, sarah, maddy, ronette, jacques, audrey, james, donna, gerard, giant. Every Knows/Suspects/Falsely-believes/Withholds bullet ends with a `(src: …)` tag (validator-enforced). Not created: Lucy, the nurse, Norma, the Log Lady, Ben (non load-bearing for disclosure; the Log Lady is a mystery thread by taxonomy). Voice contracts stay in the design reports.

## 6. Major revelation structure

`revelations/`: R1 double life → R2 Laura feared → R3 non-ordinary channel → R4 scene arranged (+ R4b Jacques present-not-author, design-level) → R5 witness eliminated → R6 signature points home (M8/M9 built, M10 unbuilt) → R7 fractured responsibility (M10 unbuilt). Each cites its facts and the prior apparent explanation it retires.

## 7. Setup / payoff debt

`docs/story/setup-payoff-overview.md`: 19 rows. PAID 3 · INTENTIONAL-UNRESOLVED 9 · UNPAID 7. UNPAID with owners: the fire-motif Act 4 hook (M8 design pass: decide real hook or close the row), the M10 reads (letters/P8, Sarah's vision, the taxi lie, Jacques's branch claims — M10 pass), Maddy's ordinary moment and S2 (lead decisions). Per-act ledgers remain authoritative for page detail; Act 2 has no ledger of its own (gap, §14).

## 8. Acts 1–3 continuity findings (audit: `artifacts/story-truth-v0.1/continuity-audit.md`)

| # | Finding | Evidence | Class | Owner |
|---|---|---|---|---|
| 1 | Legacy ring clue asserts ownership: "Sembra il monile di Laura Palmer" as Cooper's own observation; the classic interact at traincar (13,5) is not gated and stays reachable after M5 (and after `s1`, when the ring is no longer on the beam) | js/data.js:154-155, 164, 667; contradicts M5 `ring_c` OWNERSHIP_OVERREACH ("Niente qui dice di chi sia") | **P1** (player-facing wording stronger than authorial evidence; stale after custody) | next narrative pass on Act 3 (retire `anello_interact` / classic clue `anello`, or gate on ¬`vagone_scoperto`) — not fixed here by scope |
| 2 | Classic `gerard_a4` "Lo ospita da vent'anni" vs locked "dodici anni" (childhood) | js/data.js:771; gated `atto4`, out of Acts 1–3 reach | **P1** (timeline duration) | Act 4 / M8 pass (migration of classic Act 4 lines) |
| 3 | Classic `leland_interr` states the confession in one line ("BOB è dentro di me dall'infanzia") | js/data.js:836; gated `atto5` | P2 (superseded by the M9–M10 lock; classic Act 5 awaiting M10) | M10 pass |
| 4 | Sarah "sapeva" (Grammatica) vs "[L: mai 'sapeva']" (Bible) | truth.md §6 #1 | INTENTIONAL wording conflict resolved by authority; no rendered line uses "sapeva" | — (guard on characters/sarah) |
| 5 | Bible §4 T2 "Missoula" vs the taxi lie | truth.md §6 #2 | P2 (Bible text stale; lock explicit) | lead: Bible update |
| 6 | Maddy's pie vs coach schedule | truth.md §6 #3 | P1 (two locks disagree; M8 says the Bible must be updated) | lead |
| 7 | Giant statement 1 rule vs canonical text | truth.md §6 #4 | P2 (example sentence deprecated) | — |
| 8 | M5 objective rung 400 never displays | act-3-closure §13 | P2 (dead content, not continuity) | Act 3 maintenance |
| 9 | All other leads (Hawk Act 1, Truman on Sarah, bridge/Ronette, "disposta da", wording guards, theory-as-fact) | audit Part 1 | NO ISSUE | — |

No P0 found. No character speaks a fact before its acquisition in the mission layer.

## 9. Runtime / story mismatches (audit Part 2)

- **System certifies more than truth:** none. P3B/P4B/P7/P9 stay hypothesis/unconfirmed; `jacques_murder_confirmed` unassigned; P6 `confirmed_as_lie` only at M10.
- **Story requires a fact the runtime cannot acquire yet:** ten entries depend on the missing `M10.json` (laura-killer, maddy-killer, bob-guest-since-childhood, responsibility-fractured, jacques-not-author, third-man-identity, letter-r authorship, maddy-body-lake transport, P6 confirmation, P10_R7). Flagged for the M10 pass, not a defect of Acts 1–3. M9 is built and wired.
- `factual_ceiling`/`hypothesis` fields all agree with their fact files.

## 10. Source / status conflicts

Six recorded in truth.md §6 with provisional resolutions by authority order; two need a lead decision (Maddy's ordinary moment; the Bible's stale T2/torta text). Nothing was silently reconciled.

## 11. Validators / checks added

`tools/story/validate-story.js` (+ README) and `test/story-truth-lint.js`: frontmatter/enums, id uniqueness, objective-truth-only-from-canon/adaptation/project-fact, deprecated→replaced_by, path references resolve, revelations cite facts, relationships cite two characters, timeline order + `after:` constraints, knowledge bullets sourced, README contract present, narrative README and CLAUDE.md pointers, setup/payoff class + UNPAID owner. 1029 checks, PASS. Markdown only, no framework.

## 12. Agent discoverability

`docs/narrative/README.md` → "Story truth" pointer; `CLAUDE.md` → one line under "Narrative work" (process → `docs/narrative/`, truth → `docs/story/`, lint command). `docs/story/README.md` carries the update contract (8 rules) and the model-economy split. No second mechanism.

## 13. Model-economy split used

Fable: source map classification, every truth/status decision, hidden-truth structure, ambiguity vs openness, conflict resolutions, character knowledge/false-belief judgement, continuity classification, this report. Cheap agents (4 Sonnet): facts/evidence/proposition/flag inventory; timeline + character-statement extraction; setup/payoff + revelation inventory + future-locked quotes; continuity diff + runtime cross-check; validator/pointers/changelog mechanics. Cheap agents reported conflicts and never resolved one.

## 14. Decisions explicitly NOT made

Ring identity and placer; ticket author; the hidden true name and the prova timing; the arranger of the scene; S2; M10 method count; epilogue breadth; Maddy's ordinary moment (left as a recorded conflict); the Bible's stale wording (not edited: the vault Bible is the human author's document); any Act 4/5 design; the fate of classic Act 4–5 lines; an Act 2 setup/payoff ledger (gap noted, not backfilled).

## 15. Recommended next truth / story milestone

Before the M10 / Act 5 pass: the lead settles the two open source conflicts (Bible T2 wording; Maddy's ordinary moment) and records them in `docs/story/CHANGELOG.md`; the Act 3 maintenance retires the legacy ring clue (P1 #1). Then the M10 pass populates the ten M10-dependent acquisitions and closes the UNPAID rows it owns. The first human test remains the quality-validation milestone; this layer is what its transcript is read against.
