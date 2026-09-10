# Project recovery audit — repository reality vs approved milestones

Date: 2026-09-10 (23:05–23:35). Forensic milestone: no feature work, no design, no environment production, no M9. Evidence directory: `artifacts/recovery-audit/` (matrix, gap classification, per-area forensics, test tables, before/after playthroughs and captures, ledgers, pre-restore copies).

## 1. Git / working-tree state encountered

`00-git-state.md`. Branch `main` at `b4ef050` (merge of `codex/hd2d-cabin-prototype` into `b5de5d2` "Implementa Atto 4 (M8)"), tree clean except `.DS_Store` files. Commit `b5de5d2` (22:56) had bundled the whole working tree of the day: the Act 4 pass, the concurrent cast/retro-UI/QA session, the exterior-lot production modules, and — as this audit found — a working tree that a third process had already altered: `coldstage.config.mjs`, `test/coldstage-config.js`, `test/coldstage-baselines/**` deleted, and `index.html` / `js/engine.js` reverted to versions predating the R129 portrait fix. The vault (canonical authoring home) still held the coherent files.

## 2. Milestone reality matrix (before repair)

`artifacts/recovery-audit/milestone-reality-matrix.md`. Summary: every studio system, Act 1, Act 2, Act 3 and Act 4 pass-01 component VERIFIED COMPLETE from source, tests and runtime; one REVERTED item (index.html presentation CSS); Roadhouse and lake-shore native NOT EXPECTED YET (no partial work exists anywhere); canonical sync and four test pins DRIFTED; coldstage files CONFLICTING.

## 3. Report claims vs reality

`report-claims.md` (13 reports). NO LONGER TRUE: two point-in-time claims later superseded (the extraction report's `audrey_indaga` known-open defect — closed by Act 3 closure, `js/narrative-production.js:141`; the NVS01 "working tree only" note). PARTIALLY TRUE: ring clue fixed by rewording (object and tile kept, as the maintenance report itself says); older test counts grown by later passes. Everything else CONFIRMED; test-count claims re-established by running the suites (§7). Act 3 forensics (`act3-forensics.md`): 16/16 items verified, six retired classic ids absent, single writers confirmed (`east_route_confirmed` M5.json:1399, `jacques_preso`, `jacques_dead`, `audrey_vista_oej`, `gigante1`). Act 4 forensics (`act4-forensics.md`): all 16 M8 nodes present (the echo node's id is `m8_promise_echo`), Maddy coach schedule with no pie text, taxi claim "sette", Leland visible pre-promise, Sarah nameless, no classic Giant anywhere, phone after statement, crossroads 47,30, routes exclusive on `focus_destination`, discovery keyed on `body_found_by`, hook pages present with no "bugia/mentito", M9 starts at `m9_verifica_taxi`; ten retired classic tokens absent; `narrative-data.gen.js` regenerates byte-identical.

## 4. Gaps classified A–G

`gap-classification.md`. A: G1 index.html CSS loss. D: G2 engine.js comment lines (same session as G1; a test pins the vault literal), G3 three vault-stale items. E: G4–G7 test pins/mocks. G (untouched, lead decision): G8 coldstage deletion, G12 vault-only orphan `js/station-population-scenes.js`. C (untouched): G9 sprite-gates 15 px profile, G10 Norma/Shelly/James/Log Lady double presence Roadhouse+diner in the night window, G11 `narrative_m8_owned` dead write. F: G13 Roadhouse/shore native. Doc: G14 "nine templates" wording.

## 5. Repairs made

`repair-ledger-lead.md`, `repair-ledger-tests.md`.
- `index.html` ← vault (G1): restores `#speaker-portrait-hires/#speaker-name-hires[data-speaker-source="narrative"]` overrides, R129 comment, desktop-cabinet block. Pre-restore copy kept.
- `js/engine.js` ← vault (G2): two comment lines.
- vault ← repo (G3): `js/render3d.js` (PONTE 4,6 = `sign_ponte`/`bridge_rail`), two `tools/build-*-frames.js`, `assets/portraits/cooper-speaker-r1.png`.
- `test/narrative-validate-m9.js` M8 count 12→16 (G4); `test/retro-production.js` three cache tags to live values (G5); `test/narrative-repair-contract.js` ring wording (G6); `test/double-r-exterior-native.js`, `test/double-r-location-native.js` mock `getAttribute` (G7).
- Three `artifacts/C*B-validation-log.json` touched only by running the validator (timestamp) were restored to HEAD.

## 6. Ambiguous items deliberately untouched

**Live concurrent session (found at 23:35).** A Codex session (ChatGPT app) is editing this repository while the audit runs: `js/sheriffs-station-art.js` modified at 23:34 (floor palette, one-pixel linoleum seams, a sage rug). Left untouched, not mirrored, excluded from the checkpoint commit. It is the most likely author of the earlier working-tree churn (coldstage deletions, index.html/engine.js reversion). Until that session is closed or its output is reviewed, canonical sync will report that file as unaudited divergence.


G8 coldstage config/baselines (vault copies exist; "no coldstage for now" standing) · G9 sprite bar · G10 crowd/diner double presence (classic conds have no OR; needs a design decision) · G11 dead write · G12 orphan vault module · G14 doc wording · Act 3 driver observation "obiettivo mai mostrato" for `obj_m5_7` (present in the approved closure run too: pre-existing, the OEJ objective is superseded before a HUD sample).

## 7. Tests before / after

Before (`tests-before.md`): 103 suites + sync, 86 pass, 17 fail — 10 CLI/browser-only usage (not failures), 2 canonical drift, 3 stale pins, 1 pre-existing pin, 1 art gate (sprite-gates), 2 mock crashes. After: canonical-sync 96/96; retro-production 54/54; smoke 420; walkthrough 81; act-4-flow 1599; act-4-mirror-gate 49; act-3-flow 242; act-3-mirror-gate 14; validate-m8 5026 (16 nodes); validate-m9 3967; interaction-voice 74/77/24; narrative-lint PASS (1 known-open M9 P7); story-truth-lint PASS (1043); narrative-repair-contract 34; double-r native 18 + controller PASS; portrait-gates 25; character-life, station-population, act-2-flow 48, act-2-ronette-required 40 PASS. Still failing by design: sprite-gates (G9), the 4 CLI tools and 5 browser-only scripts when run bare.

## 8. Real-build results

`playthrough-before/README.md`, `playthrough-after/README.md`. Act 3 `impeto-kept` (town → traincar → OEJ → sheriff → hospital → Room 315 → Act 4 bridge, S1 echo `m6.b9.atto4.s1_safe`) 58/58; Act 4 A 112/112, B 108/108, C 105/105 — identical before and after, zero direct-API fallbacks, only the harness favicon 404 in console, classic dialogue only where optional (A: Sarah; B: Log Lady + Sarah; C: none). Approved evidence dirs snapshotted and verified unchanged.

## 9. Visual evidence

Before: `playthrough-before/act-4/A/station-hook.png`, `playthrough-before/act-3/truman-contest-impeto.png` — portrait card without the speaker nameplate (REGRESSED). After: same captures with COOPER / TRUMAN nameplates (MATCHES APPROVED PASS). Diner Maddy+Leland, Roadhouse populated / Giant / phone, threshold, route arrivals, shore before/after, traincar: MATCHES APPROVED PASS (legacy Roadhouse and shore as expected: NEVER IMPLEMENTED natively, class F). Byte-size changes between before/after PNGs are the restored nameplate/portrait CSS.

## 10. Current true project state

Acts 1–4 reach the expected endpoint in the production build (Act 4 ends at `m8_station`, HUD hands to M9 «Chiedi a Lucy se il taxi di Leland era prenotato.»). Two narrative layers coherent; generated data in sync; single writers hold; canonical sync 96/96. Town → sheriff and town → Double R pass through native exterior lots registered at runtime by `js/sheriffs-station-production.js` / `js/double-r-location-production.js` (World Engine v0.1 documented seam; not narrative-owned; the raw diner door in `js/maps.js` is overridden at load and reads stale in isolation).

## 11. Intentionally unfinished

Roadhouse native environment; lake shore native/state; night render grade; M9 P7; G8–G12, G14 above; the three hand-updated `test/m8-*-harness.html`.

## 12. Recommended next milestone

Lead decision on G8 (restore coldstage files from vault or record the deletion) and G10 (crowd vs diner presence), then **Act 4 Environment Pass D** exactly as `docs/act-4-implementation-pass-01-report.md` §17 (Roadhouse first, then shore), with `act-4-mirror-gate` and the playthrough driver as the regression net.

## CURRENT PROJECT CHECKPOINT

| area | status |
|---|---|
| Narrative System v0.1 | VERIFIED |
| Story Truth v0.1 | VERIFIED |
| Act 1 | VERIFIED |
| Act 2 | VERIFIED |
| Act 3 | VERIFIED FROZEN (pre-existing driver observation on `obj_m5_7`, non-blocking) |
| Act 4 Design | VERIFIED |
| Act 4 Implementation P01 | VERIFIED (after G1 restore; real-build A/B/C green) |
| Act 4 Environment Pass | NOT STARTED (no partial work found) |
| M9 | EXISTING LEGACY/DESIGN STATE ONLY |
| M10 | NOT CURRENT MILESTONE |
| Canonical sync | 96/96 |
| Open lead decisions | G8 coldstage deletion, G10 crowd/diner presence |
