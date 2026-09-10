# Canonical source sync

Canonical authoring home remains:

`/Users/ebuccelli/Vault/1. Projects/Twin Peaks Game`

Deploy repository is tested publication copy. Vault contains exact runtime mirror plus historical design material. Deploy was selected as more advanced runtime after semantic diff and full playthrough; stronger Vault dialogue was selectively merged before synchronization.

Exact-equality scope:

- `index.html`;
- 29 production scripts loaded by `index.html`;
- 25 high-resolution portrait PNGs loaded by speaker cards;
- archived comparative cast atlas `assets/sprites/cast-walkcycles-16.png`;
- production cast atlas `assets/sprites/cast-walkcycles-hg-24.png`;
- 8 canonical source JSON files listed in manifest.

Vault-only books, gauntlet records, source portraits and 3D models remain knowledge/archive material. They are outside deployed bundle and are never deleted by sync.

Run before selective sync, commit, or deploy:

```bash
node tools/check-canonical-sync.js
```

Normal and strict modes both require complete equality. Strict form is CI/deploy gate:

```bash
node tools/check-canonical-sync.js --strict
```

Use `TP_CANONICAL_ROOT=/path/to/canonical` on another machine only in normal
diagnostic mode. Strict evidence mode rejects environment overrides and refuses
to compare the canonical root with itself. Reconciliation order:

1. inspect semantic diff;
2. choose winner per file or per isolated hunk;
3. apply selective patch;
4. regenerate derived narrative data when mission JSON changes;
5. run native and production probes;
6. copy only selected runtime files into Vault; never use `--delete`;
7. require strict guard PASS.

Guard never selects winner by timestamp. Semantic review and tests select winner first; hashes only prove equality afterward.

Ambient Life v0.1 adds two production scripts (`ambient-life.js`, `ambient-life-scenes.js`); audited playable scope is now67 exact-mirror files.

Environment Life v0.2 adds `environment-reactions.js`; audited playable scope is now 68 exact-mirror files.

Character gestures add `character-activity.js`; audited playable scope is now 69 exact-mirror files.

2026-09-09: Room 315 adds four production scripts (`room-315-art.js`, `room-315-scene.js`, `room-315-location-data.js`, `room-315-production.js`); audited playable scope is now 73 exact-mirror files.

2026-09-09: Act 2 (NVS02) milestone synced into no new production scripts; updates land inside the existing 90-file audited scope (`index.html`, `js/chars.js`, `js/data.js`, `js/environmental-inspect.js`, `js/glue.js`, `js/narrative-data.gen.js`, `js/narrative-engine-adapter.js`, `js/retro-authored.js`, `js/retro-cast-matrices-b.js`, `js/retro-ui.js`, `narrative/missions/M4.json`, `assets/sprites/cast-walkcycles-hg-24.png`); guard confirms 90/90 equal. Non-runtime production artifacts also mirrored to Vault (never checker-scoped): `assets/sprites/cast-hg-24/infermiera.png`, `assets/sprites/CAST.md`, `assets/sprites/character-life-v01.manifest.json`, `docs/act-2-production-report.md`, `artifacts/act-2-nvs02/`, selected `artifacts/character-life-v01/` and `artifacts/station-population-v01/` validation files, and the corresponding `test/` and `tools/` scripts.

2026-09-09: Act 2 closure milestone (Ronette required + native hospital ward) adds three production scripts (`js/hospital-art.js`, `js/hospital-scene.js`, `js/hospital-production.js`); audited playable scope is now 93 exact-mirror files. `index.html`, `js/environmental-inspect.js`, `js/glue.js`, `js/maps.js`, `js/narrative-data.gen.js`, `js/narrative-engine-adapter.js`, `js/retro-authored.js`, `js/world-catalog.js` and `narrative/missions/M4.json` re-synced to close guard-reported divergences alongside the three new scripts. Non-runtime production artifacts also mirrored to Vault (never checker-scoped): whole `artifacts/hospital-v01/` directory, `docs/act-2-closure-report.md`, and the corresponding modified/new `test/` scripts and harnesses (including `test/hospital-native.js` and `test/act-2-ronette-required.js`); guard confirms 93/93 equal.

2026-09-10: Act 3 implementation pass 01 (topology cleanup + M5 investigation) adds no production script; updates land inside the 93-file audited scope (`index.html`, `js/data.js`, `js/environmental-inspect.js`, `js/glue.js`, `js/maps.js`, `js/narrative-data.gen.js`, `js/narrative-engine-adapter.js`, `js/traincar-location-data.js`, `narrative/evidence.json`, `narrative/missions/M5.json`, `narrative/state-enums.json`); guard confirms 93/93 equal. Non-runtime mirrored (never checker-scoped): `docs/act-3-implementation-pass-01-report.md`, `artifacts/traincar-v01/` (Golden Concept + native translation brief), `artifacts/act-3-pass-01/`, `narrative/schema-deltas/M5.md` + `diff-state-enums.json`, and the new/re-pinned `test/` scripts (`act-3-flow.js`, `act-3-mirror-gate.js`, validators, simulators, `retro-scene.html`, `native-shot.js`).

2026-09-10: Narrative System v0.1 extraction adds no production script; audited scope unchanged (93/93). Non-runtime mirrored (never checker-scoped): `docs/narrative-system-v0.1.md`, `docs/narrative-system-v0.1-extraction-report.md`, `docs/narrative/` (README, CHANGELOG, 10 templates), `docs/story/` (truth-model schema, unpopulated), `tools/narrative/` (lint-missions.js, lint-allowlist.json, README), `test/narrative-lint.js`, `CLAUDE.md` (Narrative work pointer).

2026-09-10: Act 3 closure (M6 stitch + native traincar + production playthrough + freeze) adds three production scripts (`js/traincar-art.js`, `js/traincar-scene.js`, `js/traincar-production.js`); audited playable scope is now 96 exact-mirror files. Re-synced inside scope: `index.html`, `js/environmental-inspect.js`, `js/maps.js`, `js/narrative-engine-adapter.js`, `js/narrative-production.js`, `js/narrative-data.gen.js`, `js/traincar-location-data.js`, `narrative/missions/M6.json`, `narrative/state-enums.json`. Non-runtime mirrored (never checker-scoped): `docs/act-3-closure-report.md`, `docs/world-visual-bible-v0.1.md` (§12), `artifacts/traincar-v01/` (native captures + notes), `artifacts/act-3-closure/` (transcripts, pacing, sweep, probes, captures), `narrative/schema-deltas/M6.md` + diff, `tools/narrative/lint-allowlist.json`, `tools/traincar-captures.js`, new/re-pinned `test/` (act-3-playthrough, probe-act3-pacing, traincar-native, act-3-flow, act-3-mirror-gate, validators, harnesses).

2026-09-10: Story Truth Layer v0.1 population adds no production script; audited scope unchanged (96/96). Non-runtime mirrored (never checker-scoped): `docs/story/` (truth, timeline, facts/, characters/, relationships/, revelations/, setup-payoff-overview, CHANGELOG, README contract), `docs/story-truth-v0.1-population-report.md`, `docs/narrative/README.md` + `CHANGELOG.md`, `tools/story/` (validate-story.js, README), `test/story-truth-lint.js`, `CLAUDE.md` (story-truth pointer), `artifacts/story-truth-v0.1/` (extraction inventories + continuity audit).

2026-09-10: Story Truth v0.1 maintenance changes one production script (`js/data.js`: classic ring clue `anello` / `anello_interact` reworded to "Niente qui dice di chi sia"); mirrored, audited scope unchanged (96/96). Non-runtime mirrored (never checker-scoped): `docs/story/` (truth §6–§7, README, facts/maddy-ordinary-moment + leland-taxi-lie + ring-identity, characters/maddy, setup-payoff-overview, CHANGELOG), `docs/narrative/CHANGELOG.md`, `docs/story-truth-v0.1-maintenance-report.md`, `test/act-3-flow.js` (ring pin), `test/smoke.js` (comment). Repo-root `Bible - Twin Peaks Game.md` and `M8 - Sta accadendo di nuovo (pacchetto).md` refreshed FROM the vault (they were stale copies).

2026-09-10: Act 4 design pass (M8 under Narrative System v0.1 + Story Truth v0.1) adds no production script; audited scope unchanged (96/96). Non-runtime mirrored (never checker-scoped): `docs/act-4-design-report.md`, `artifacts/act-4-design/` (topology, m8-extraction, pacing-current, environment-inventory, route-trace, offscreen-timeline, fact-knowledge-ledger, setup-payoff-ledger, evidence-map, scene-contracts, voice-contracts, doctrine-audit, environment-requirements), `test/probe-act4-pacing.js` (measurement probe), `docs/story/` (diary-rule wording decision: facts/diary-serial-rule, truth §1, timeline T5, CHANGELOG). No mission JSON, runtime or classic text changed.

2026-09-10: Act 4 implementation pass 01 changes production scripts `js/data.js` (retired classic Act 4 dialogues/clue, Sarah page 3, diary wording), `js/glue.js` (cascade entries removed, gigante2 conds on sarah/bobby/donna/jacoby), `js/narrative-engine-adapter.js` (WORLD_TARGETS crossroads 47,30; Act 4 entities), `js/narrative-production.js` (gigante2 ← m8_roadhouse_truman), `js/narrative-data.gen.js` (regenerated from `narrative/missions/M8.json`, 16 nodes), `index.html` (cache tags); mirrored. Non-runtime mirrored (never checker-scoped): `narrative/missions/M8.json`, `narrative/schema-deltas/M8.md` + validation matrix + source map, `docs/act-4-implementation-pass-01-report.md`, `docs/story/CHANGELOG.md`, `artifacts/act-4-implementation/` (transcripts, assertions, probes, captures, run-1), `artifacts/act-4-design/pacing-current.md`, tests (`act-4-flow`, `act-4-mirror-gate`, `act-4-playthrough` + probe html, `probe-act4-pacing`, updated `interaction-voice`, `walkthrough`, `smoke`, `narrative-validate-m8`, `narrative-validate`, m8 harnesses, provenance/regression tests).
