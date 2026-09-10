# Story Truth v0.1 — maintenance report (2026-09-10)

Scope: close the three continuity/provenance issues carried out of the Story Truth v0.1 population before Act 4 design. No Act 4 design, no Acts 1–3 rewrite, no Narrative System or Story Truth architecture change, no engine change.

## 1. Legacy traincar ring clue (issue 1)

Runtime trace. The classic interact at traincar (13,5) (`js/maps.js` `'13,5': 'anello_interact'`) shares its tile with the M5 world target `ring`. `GAME.Engine.interact` asks the narrative adapter before the classic object; `A.tryInteractAt` consumes the tile whenever any entered mission has a node on that target, in every branch (active root, pending milestone, completed mission repeat, no-roots feedback: `return true`). M5 enters on `atto3` + P2 accepted by Truman, and the traincar door itself needs `atto3`, which in production is written only from narrative state. So the classic text was reachable only in the classic fallback mode (adapter disabled after a boot failure) and in `test/smoke.js`. It was still an ownership overclaim on disk.

Fix (smallest content-level change, `js/data.js`): clue `anello` renamed "L'anello del vagone"; desc "Era sotto un'asse del vagone, al centro. Niente qui dice di chi sia."; document page "Aspetto" → "Un anello d'oro. Niente qui dice di chi sia."; `anello_interact` page 2 → "Un anello d'oro giace piatto sotto l'asse. Niente qui dice di chi sia." (the M5 `ring_c` OWNERSHIP_OVERREACH guard wording). Dialogue id, `give: ['anello']`, the `again` page and the sparkle marker are unchanged, so smoke, walkthrough and `traincar-scene.js`'s classic `ringHidden()` keep working. The M5 guard is untouched.

Validation after custody: the tile stays adapter-owned (M5 completed → `completed_mission_repeat`, the ring node's repeat), and `ringHidden()` hides the sprite on `s1`. Pinned in `test/act-3-flow.js` (adapter section): target `ring` at (13,5) equals the classic interact tile; M5 owns nodes on `ring`; M5 entry needs `atto3`; classic clue and dialogue contain neither "Laura" nor "monile". Real-build proof: see §7 (browser playthrough, no classic dialogue on the beam).

## 2. Maddy's ordinary moment (issue 2)

OLD CONFLICT: Bible §6 M8 / §8 Maddy "[L] la torta che Laura odiava" vs M8 package v1.1 "[L SUPERSEDED] … scena degli orari della corriera" (truth.md §6 row 3, left OPEN at population).

Source hierarchy reconstructed:
1. Human lock / later explicit lock — the Bible's own PATCH v0.9.1 CHANGELOG (2026-07-23) item 2: "[L SUPERSEDED] momento-torta → scena degli orari della corriera (M8 v1.1)"; the patch header: "Il patch PREVALE sul corpo (v0.9, conservato per archivio)". The vault package `Twin Peaks Narrative Production v1.0/source_manifest.md` (declared "l'UNICA fonte canonica", reviewer-approved 2026-07-23) lists the same supersession as "Decisioni superseded" item 2. PATCH §8(c) fixes the function: the moment shows "Maddy vuole vivere altrove", never "Maddy non è Laura".
2. Project authority — M8 package §0 "Provenienza [L SUPERSEDED] (decisione registrata, delega dell'autore umano)"; Bible §8 Maddy already reads "andarsene (fatto: la corriera)".
3. Repository fact — `narrative/missions/M8.json` `m8_diner` p01–p08 implements the coach-schedule scene; no pie exists in repo content.
4. Earlier superseded material — Bible body §6 M8, §8 "[L: la torta]", §0/§20 open item 4 (position): archived v0.9 wording.

DECISION: LOCKED — the coach-schedule scene at the diner, afternoon of Act 4 (T50). The pie is deprecated.
SOURCE: project-fact (Bible tag [N→L]); citations above.
STATUS: locked (`facts/maddy-ordinary-moment.md`, new).
RATIONALE: the human lock inside the prevailing patch and the repository fact agree; the pie defines Maddy against Laura, which PATCH §8(c) forbids, so the intended emotional function ("dove concentro attenzione incompleta", her own future) is preserved better by the coach version; the coach version already carries the lake stop and the 7:40 that T_LELAND_TAXI (re-lock R12), M9 D_TAXI and `D.endText` depend on; the timeline (T50) already said coach, so nothing is retroactively rewritten; Bible open item 4 ("posizione esatta") is closed by the M8 lock (diner, afternoon, T0).
AFFECTED FUTURE SETUPS/PAYOFFS: overview row 17 (setup built in `m8_diner`; payoff = her post-warning actions and the empty seat on the 7:40, Act 4 unfrozen → UNPAID, owner M8 pass); T_LELAND_TAXI consistency (7:00 taxi / 7:40 coach); Loggia/epilogue `D.endText` line. No Maddy scene implemented.

## 3. T2 / taxi-lie authority (issue 3)

Trace: Bible body §4 evidence row "T2 bugia-Missoula [P]" and proposition row "P6 Leland ha mentito su Missoula" (both vault Bibles, lines 105/118; PATCH item 4 also names T_LELAND_MISSOULA / D_REGISTRO_MISSOULA). Deprecation: the same Bible's PATCH CHANGELOG (2026-07-23) item 1: P6 Missoula = DEPRECATED, canonical P6 = T_LELAND_TAXI [P] + D_TAXI [N→L]; `source_manifest.md` "Decisioni superseded" item 1; M8 package §0 re-lock R12 (2026-08-06); M9–M10 v1.1.1 §0 ("la v1.0 aveva inventato una 'trasferta di lavoro'"); runtime `m8_leland_taxi`, `m9_verifica_taxi`; `test/narrative-validate-m9.js` forbids `trasferta`. Classic `leland_dove` already carries the taxi wording and is unreachable on the classic path (actor and branch conditions exclusive). Remaining "Missoula" in runtime = Maddy's home town only (`M8.json` p07, `D.endText`).

DECISION: the taxi lie is the single active authority (confirms the population report). The Bible is not edited (human-owned; `docs/narrative-system-v0.1.md` "not edited casually"). Marking: truth.md §6 row 2 RESOLVED; new truth.md §7 "Superseded source passages (archive; never cite as authority)" listing the passages, the prevailing authority and the active truth; `facts/leland-taxi-lie.md` contradicting line reworded to "archived v0.9 wording"; README pointer.

Provenance hazard found and closed: the repo-root copies `Bible - Twin Peaks Game.md` (missing the 2026-07-23 changelog) and `M8 - Sta accadendo di nuovo (pacchetto).md` (pre-v1.1, no R12, no taxi) were stale; refreshed from the vault (documented direction vault → repo). truth.md §7 and README now name the canonical package path.

## 4. Files changed

- `js/data.js` — clue `anello` (name, desc, "Aspetto" page), dialogue `anello_interact` page 2.
- `test/act-3-flow.js` — ring tile ownership + wording pin (237 → 242 checks). `test/smoke.js` — comment only.
- `docs/story/truth.md` — §4 bullet removed, §6 rows 2–3 resolved, new §7. `docs/story/README.md` — canonical-source pointer.
- `docs/story/facts/maddy-ordinary-moment.md` (new), `facts/leland-taxi-lie.md`, `facts/ring-identity.md`, `characters/maddy.md`, `setup-payoff-overview.md` row 17.
- `docs/story/CHANGELOG.md` (3 records), `docs/narrative/CHANGELOG.md` (1 entry).
- Repo-root mirrors refreshed from vault: `Bible - Twin Peaks Game.md`, `M8 - Sta accadendo di nuovo (pacchetto).md`.
- This report; `CANONICAL-SYNC.md` line.

## 5. Story CHANGELOG entries

Three records appended to `docs/story/CHANGELOG.md` (full field order: date · entry · old · new · source · reason · characters · facts · revelations · setups/payoffs · acts · milestone): `leland-taxi-lie` (resolution + §7), `maddy-ordinary-moment` (new lock, §4/§6/§7), `ring-identity` (legacy clue retired; truth unchanged).

## 6. Continuity recheck (read-only agent, after the fixes)

All eight checks PASS: (1) no reachable ring-ownership overclaim (only the refused `ring_c` label remains, as a wrong reading); (2) the pie survives only as archived/deprecated mentions; coach schedule in maddy.md, T50, row 17; (3) every "Missoula" in docs/story is Maddy's home town or explicitly deprecated; (4) every node id cited by the maddy/leland/cooper/truman knowledge files resolves in M4/M5/M6/M8/M9.json; (5) all 35 fact references in the 8 revelation files resolve, none deprecated; (6) overview classes valid (3 PAID · 9 INTENTIONAL-UNRESOLVED · 7 UNPAID, all with owner), no "source conflict" cell; (7) all 32 objective-truth facts have source ∈ {canon, adaptation, project-fact}; the 5 `uncertain` files carry none; (8) new fact details match `m8_diner` and `D.endText`. Nothing unrelated reopened.

## 7. Lint / test results

| Gate | Result |
|---|---|
| `node test/story-truth-lint.js` | PASS (1043 checks) |
| `node test/narrative-lint.js` | PASS (7 checks, 1 known-open: M9 P7, untouched) |
| `node test/act-3-flow.js` | 242/242 |
| `node test/act-3-mirror-gate.js` | 14/14 |
| `node test/smoke.js` | 443 ✔ (no drop) |
| `node test/walkthrough.js` | 89 acquisitions, finale reached ✔ (no drop) |
| `node test/interaction-voice.js` | PASS (85/69/20) |
| `node test/narrative-validate-m5/m6/m9.js` | 2898 / 4819 / 3935 ✔ |
| `node test/choice-prompts.js`, `choice-prompt-dedup.js` | 16/16, 15/15 |
| `node test/act-3-playthrough.js --path=impeto-kept` (real build) | 58/58; classic dialogues on traincar = `oej_bloccato` only (no `anello_interact`), zero API fallbacks; one console line = a 404 resource load (harness noise, not gated) |
| `node tools/check-canonical-sync.js` | PASS 96/96 after mirroring `js/data.js` to the vault |

No new validator: the defect classes (stale player-facing wording, stale mirror copies) were each one-off; `act-3-flow` pin covers the ring recurrence.

## 8. Unresolved truth questions intentionally left open

Ring identity and placer; ticket author; BOB ontology / partition (locked ambiguity); Jacques's prova timing and the true name in the pressione list; other people at the car; date and hour of the murder; S2, M10 method count, epilogue breadth, writing budget; the referent of "È successo di nuovo"; M10-dependent acquisitions (ten facts); M9 P7 known-open. Out of scope but observed: four `SHA256SUMS` entries in the vault v1.0 package no longer match (locks edited after consolidation, e.g. R12 2026-08-06); repo-root `M5-M6 v1.1 (script lock).md` and `Twin Peaks Game.md` also differ from the vault — not touched.

## 9. Act 4 not designed

No Act 4 node, scene, dialogue or map was designed or implemented; `M8.json` unchanged; no M10 truth populated; Narrative System v0.1 and Acts 1–3 untouched except the classic ring wording above.
