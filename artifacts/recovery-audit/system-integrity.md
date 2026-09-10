# Recovery audit — system integrity

Checked 2026-09-10 against the working tree at commit `b4ef050`.

## (a) Narrative System v0.1

`docs/narrative-system-v0.1.md` (status line: "FROZEN 2026-09-10") contains all five required sections:

- **Canonical workflow** — `## 2. Canonical authoring pipeline (an act or a major milestone)` at line 21.
- **Hard gates vs heuristics** — `## 3. Hard gates vs heuristics` at line 57 (14-row hard-gate table, each row citing where it failed in Acts 1–3, plus a heuristics list).
- **Canonical templates** — `## 4. Standard artifacts (templates)` at line 86. Note: the section text says "Nine templates" but its own table lists 10 rows and `docs/narrative/templates/` holds exactly 10 files: `act-design.md`, `doctrine-audit.md`, `evidence-map.md`, `fact-knowledge-ledger.md`, `freeze-report.md`, `human-test.md`, `implementation-report.md`, `scene-contract.md`, `setup-payoff-ledger.md`, `voice-contract.md`. This is a small internal wording/count mismatch in the doc itself (nine vs. ten) — not a missing file, but worth a one-line fix.
- **Model-economy rules** — `## 19. Model economy (part of the system)` at line 281 (FABLE/lead vs CHEAP tier table + hybrid rule).
- **Human-test boundary** — `## 15. Human validation contract` at line 229: "Model/automated validation certifies structural validity only... As of v0.1 no human test has been run on any act."

`docs/narrative/README.md` exists as the entry point (7 headings: Three layers, An act end to end, Story truth, Non-negotiables, Who does what, What can be certified, Paste-able contract) and correctly points onward to `docs/narrative-system-v0.1.md`, the Bible and the templates.

`docs/narrative/templates/` — all 10 files present and match the system doc's table exactly (see above).

`docs/narrative-craft-bible-v0.1.md` — present at repo root of `docs/` (not separately re-read in full for this pass; existence confirmed by earlier `ls`).

`docs/narrative/CHANGELOG.md` — last 5 entries (it has exactly 3 dated entries total, all shown; "last 5" is satisfied by showing everything present):
1. `## v0.1 — 2026-09-10` — System extracted from Act 1 (NVS01), Act 2 (production + closure), Act 3 (design, doctrine audit, implementation pass 01); no Bible rule changed; records the two runtime facts about proposition/choice-node "done" semantics, evidence `docs/act-3-implementation-pass-01-report.md` §2.
2. `## 2026-09-10 — Story Truth Layer v0.1 populated` — `docs/story/` populated from frozen Acts 1–3 material; validator `test/story-truth-lint.js`; report `docs/story-truth-v0.1-population-report.md`.
3. `## 2026-09-10 — Story Truth v0.1 maintenance` — resolves the Bible T2/taxi-lie and Maddy pie/coach conflicts plus the classic ring clue wording; evidence `docs/story-truth-v0.1-maintenance-report.md`.

(Only 3 changelog entries exist; there is no 4th or 5th to list — flagging this rather than padding the count.)

## (b) Story Truth v0.1

`docs/story/README.md` confirmed to carry the full contract: Layout (truth/timeline/characters/facts/revelations/relationships), the two independent provenance dimensions (`source` × `status`), the "Four things never collapsed" section (objective truth · what Cooper knows · what an NPC knows/falsely believes/withholds · what the player has seen), update rules requiring a `docs/narrative/CHANGELOG.md`-style record, entry skeleton, and the full `validate-story.js` check list.

`docs/story/truth.md` headings confirm the source/status separation and the objective-truth vs. knowledge distinction:
- `## 1. Known objective truths (locked; the author never doubts these)`
- `## 2. Locked but player-hidden truths`
- `## 3. Intentionally ambiguous questions (by statute; the author refuses to decide, forever)`
- `## 4. Open authorial questions (undecided; do not fill by inference)`
- `## 5. Interpretations that must not become truth yet`
- `## 6. Conflicting source claims (both recorded; resolution = provisional, by authority order)`
- `## 7. Superseded source passages (archive; never cite as authority)`

`docs/story/facts/maddy-ordinary-moment.md` — coach schedule is the locked version, pie deprecated, quoted verbatim:
> "Objective truth: Maddy's ordinary moment is the coach-schedule scene at the diner on the afternoon of Act 4: a napkin full of times, the 7:40 with the Spokane connection and the lake stop..."
> "Deprecated version: the pie Laura hated, 'almeno su questo non eravamo parenti' (defined in opposition to Laura, which PATCH §8(c) forbids)."

`docs/story/facts/leland-taxi-lie.md` is the active authority, status line quoted:
> frontmatter `status: locked`
> body: "Leland's lie. The taxi for Maddy's first-morning coach was never called; Leland stated it at the diner after the promise scene. The older 'Missoula business trip' lie is deprecated." (also cross-referenced from `truth.md` §1 and §6 row 2, marked RESOLVED per the CHANGELOG.)

Ring ownership unresolved: `docs/story/facts/ring-identity.md` exists as a standalone open file (alongside `facts/ring-placed.md`); the maintenance report and CHANGELOG both state explicitly "no truth changed (ring identity stays OPEN)" — the wording fix only removed a player-facing overclaim, it did not resolve the underlying authorial question.

BOB ambiguity intentional, quoted from `docs/story/facts/bob-nature.md`:
> "Status of truth: What BOB is — a man, a spirit, a name for trauma, an inhabitant — is deliberately never decided. LOCKED AMBIGUITY, not an open question."
> "Supporting evidence: Bible §7 Q4 ('MAI data [L: ambiguità protetta]'); Loggia §5 MAI list (`bob_true`)."

`docs/story/setup-payoff-overview.md` exists; frontmatter confirms `id: setup-payoff-overview`, `source: project-fact`, `status: locked`, `owner: lead`. Row count: the file contains 20 lines starting with `| ` (table header + separator + data rows); this is consistent with the population report's claimed 19 data rows but was not independently re-tallied by class (PAID/INTENTIONAL-UNRESOLVED/UNPAID) in this pass — see `report-claims.md` for that caveat.

**`node test/story-truth-lint.js`** — ran now: `story-truth-lint: PASS`.
**`node tools/story/validate-story.js`** — ran now: `story-lint: PASS (1043 checks, 0 warnings)`.

`docs/story/CHANGELOG.md` last 6 entries (all 6 that exist, first ~120 chars each):
1. `2026-09-10 · story-truth-v0.1 · population from frozen Acts 1–3 material; no prior locked value existed · — · proje...`
2. `2026-09-10 · leland-taxi-lie (truth.md §1 "Leland's lie", §6 row 2, §7) · truth.md §6 row 2 "provisional; Bible te...`
3. `2026-09-10 · maddy-ordinary-moment (new), truth.md §4 (bullet removed), §6 row 3, §7 · OPEN source conflict: pie a...`
4. `2026-09-10 · ring-identity (contradicting line), continuity P1 #1 · legacy classic clue anello / anello_interact ...`
5. `2026-09-10 · diary-serial-rule (wording), truth.md §1 "The letters", timeline T5 · rule quoted as «Dice che lasce...`
6. `2026-09-10 · diary-serial-rule (Act 1 document alignment) · js/data.js clue diario desc and document page quoted...`

## (c) Agent discoverability

**CLAUDE.md** (project root), lines 37–46, "Narrative work" section:
> "Before designing or writing any narrative content (acts, scenes, dialogue, evidence, objectives), read `docs/narrative/README.md` (two screens) — it points to `docs/narrative-system-v0.1.md`, `docs/narrative-craft-bible-v0.1.md` and `docs/narrative/templates/`. Run `node test/narrative-lint.js` with the mission validators before claiming structural validity."
> "Story truth (what is objectively true, who knows what): `docs/story/README.md` — run `node test/story-truth-lint.js`."

Every path named there exists: `docs/narrative/README.md`, `docs/narrative-system-v0.1.md`, `docs/narrative-craft-bible-v0.1.md`, `docs/narrative/templates/`, `test/narrative-lint.js`, `docs/story/README.md`, `test/story-truth-lint.js` — all confirmed present.

**AGENTS.md** is 4 lines total and does not itself name "narrative" or "story"; it simply says:
> "Read `CLAUDE.md` for project structure, constraints, and native test order; rules apply to every coding agent."

This is a deliberate single-entry-point design (matches `docs/narrative-system-v0.1.md` §18 "Agent discoverability", which states: "CLAUDE.md at the project root is the agent entry point (AGENTS.md defers to it; Twin Peaks Game.md holds architecture and MEMORY)"). Not a gap — the indirection is intentional and documented as such in the system doc itself.

## Summary of gaps found

- **Doc wording mismatch**: `docs/narrative-system-v0.1.md` §4 says "Nine templates" but lists and the directory both have 10. Cosmetic, not a broken pointer.
- **No other integrity gaps found.** Both systems' documented contracts (README, hard gates, templates, model-economy, human-test boundary for narrative; source/status separation, the four-things-never-collapsed rule, changelog contract for story truth) are intact and match the files on disk. Both lint scripts (`test/story-truth-lint.js`, `tools/story/validate-story.js`) run clean today (PASS, 1043 checks, 0 warnings). CLAUDE.md's pointers are accurate and every path they name exists.
