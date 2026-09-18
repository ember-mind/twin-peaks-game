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

2026-09-10: Project recovery audit. Production scripts changed: `index.html` and `js/engine.js` RESTORED FROM THE VAULT (repo had a reverted copy lacking the narrative-widget portrait/nameplate CSS; ledger `artifacts/recovery-audit/repair-ledger-lead.md`); vault refreshed FROM the repo for `js/render3d.js`, `tools/build-character-life-frames.js`, `tools/build-station-population-frames.js`, `assets/portraits/cooper-speaker-r1.png` (repo newer). Audited scope 96/96. Non-runtime mirrored: `docs/project-recovery-report.md`, `artifacts/recovery-audit/`, tests re-pinned (`narrative-validate-m9`, `retro-production`, `narrative-repair-contract`, `double-r-exterior-native`, `double-r-location-native`). Not restored (lead decision pending): coldstage config/baselines deleted in the repo but present in the vault.

2026-09-11: Coldstage removed by explicit decision: deleted `test/hd2d-cabin-coldstage.config.mjs` (repo; coldstage-only harness config for the throwaway HD-2D prototype) and, in the vault, `coldstage.config.mjs`, `test/coldstage-config.js`, `test/coldstage-baselines/**` (10 scenario baselines + version history PNGs). The main `coldstage.config.mjs`, `test/coldstage-config.js` and `test/coldstage-baselines/` were already absent from the repo working tree as of the 2026-09-10 recovery audit commit (`5ceb6c5`); this pass brings the vault in line. `CLAUDE.md` Coldstage bullet removed (repo already clean; vault edited to match). `test/hd2d-cabin-prototype.md` recheck instruction rewritten (coldstage-only invocation is gone). No `canonical-sync.manifest.json` entries referenced coldstage in either repo or vault (nothing to remove there). Visual QA infrastructure (`test/*-gates.js`, capture/screenshot scripts) unchanged. Left in place: vault `.coldstage/` runtime output directory (one run + one review, not in the explicit deletion list; repeated deletion attempts were blocked by the local tool-permission classifier) — flagging for a follow-up pass if it should go too.

2026-09-11: World + character architecture audit v1 (no production script changed by the audit). Non-runtime mirrored: `docs/world-character-architecture-audit.md`, `artifacts/world-character-audit/` (presence sources, cast/location matrices, ownership trace, enumerator + output, failure catalog, save/load audit, test coverage, options, validation and migration plans). Known live divergences from a concurrent Codex session: `js/engine.js`, `js/sheriffs-station-art.js` (not mirrored, not committed).

2026-09-11: Cast Continuity amendment (no production script changed). The audit's "ordered rules / first match wins" is rejected by the lead; new contract `docs/cast-continuity-contract-v0.1.md` (exact-one presence, order-independent resolution, windows + causal change records, validators V1–V8); `docs/world-character-architecture-audit.md` amended; migration truth `artifacts/world-character-audit/cast-windows-acts-1-4.md` (+ two cheap-agent inventories); `options.md`, `validation-plan.md`, `migration-plan.md` amended; narrative templates (`scene-contract`, `act-design`, `freeze-report`) gain CAST CONTINUITY fields; `docs/world-engine-v0.1.md` §3 gains the presence-ownership row. All mirrored to the vault. Live Codex divergences now: `index.html`, `js/engine.js`, `js/retro-authored.js`, `js/sheriffs-station-art.js`, `js/town-dusk.js`, new `js/diorama.js` (not mirrored, not committed).

2026-09-11: Cast Continuity lead decisions pass (no production script changed). `docs/cast-continuity-lead-decisions-v0.1.md` (new) closes D1–D11; `artifacts/world-character-audit/cast-windows-acts-1-4.md` rewritten as closed migration truth (baselines, windows, V5 pins, change records, exclusion proofs). Mirrored to the vault. No implementation.

2026-09-11: Cast Continuity final consistency pass (no production script changed). `docs/cast-continuity-final-consistency-report.md` (new): Hawk at the OEJ landing then escorting Jacques; Roadhouse empties only at `focus_destination`; Jacques OFFSCREEN (guarded, alive) until `jacques_dead`; plus Maddy's exit at `T_LELAND_TAXI`, Truman staying at the car, Hawk's chain re-keyed; one lead blocker B1 (diner regulars' departure). Contract gains OFFSCREEN/TERMINAL semantics, no-silent-vanish, V5b/V6b; decisions doc §8b; truth file and validation corpus corrected. Verdict NOT READY until B1. Mirrored to the vault.

2026-09-11: Cast Continuity B1 closed (no production script changed). Lead option B: `m8_leland_taxi` closing beat `m8.b0.leland_taxi.chiusura.p01` authors the Double R closing for the Roadhouse evening; diner regulars move at `T_LELAND_TAXI` with `entry_authored_by`. `docs/cast-continuity-b1-resolution.md` (new); decisions §8c; truth file, consistency report (verdict READY), contract V6b (entries), validation plan RC7, act-4 design report amendment. Page not yet in M8.json (implementation pass adds it). Mirrored to the vault.

2026-09-12: Cast Presence v0.1 — validators first + Acts 1–4 truth compiled (one new production script `js/cast-presence.js`, not yet loaded by index.html; `narrative/missions/M8.json` gains the B1 closing page `m8.b0.leland_taxi.chiusura.p01`; `js/narrative-data.gen.js` regenerated with `D.cast`). New: `narrative/cast/windows.json`, `test/cast-continuity-validate.js`, `test/cast-presence-pre-migration.js`, `test/cast-presence-sync.js`, `test/fixtures/cast-*.json`, `docs/cast-presence-v0.1-implementation-report.md`, `docs/cast-presence-authoring.md`, `artifacts/cast-presence-v0.1/`. Adapter/glue/index.html NOT touched (collision with the concurrent session's uncommitted inspector work) — Phases 6/10/13 pending, verdict NOT READY. Mirrored to the vault.

2026-09-13: Cast Presence v0.1 integrated (production scripts changed: `js/narrative-engine-adapter.js` — NARRATIVE_ENTITIES emptied, sync delegates to `GAME.CastPresence.syncMaps`, `tryInteract` honours authored `actor_ids`; `js/glue.js` — NPCS emptied; `js/cast-presence.js` — syncMaps + actor_ids; `js/narrative-data.gen.js` regenerated; `index.html` loads `js/cast-presence.js`, cache tags bumped). V7 PASS, all node suites green, real-build drivers Act 3 189/189 and Act 4 A–D green with Cast Presence traces and browser reloads. Vault mirrors the COMMITTED adapter/index.html (without the concurrent session's uncommitted inspector hunks). Test migrations: smoke, walkthrough, act-3/4-flow, act-4-mirror-gate, character-life, playthrough probes/drivers, m8-engine-harness; 14 harness pages load cast-presence.js. Verdict READY to resume Act 4 Environment Pass.

2026-09-13: Merged PR #2 (qwen/night-world-builder-m1-m3: `js/world-builder.js`, `js/world-builder-data.js`, `js/world-builder-coords.js`, `world-builder.html`, `test/world-builder.js`, `.github/workflows/test.yml`, report). Adapted to Cast Presence: the builder's npc overlay reads the authored baseline cast (`GAME.CastPresence.bodiesFor(scene, null)`), page loads narrative-runtime/narrative-data.gen/cast-presence; sheriff baseline = 4 bodies (Leland is an Act 5 window). WORLD-BUILDER 64/64. Mirrored to the vault.
- 2026-09-13 mirror: assets/ref/ (7 art-direction targets) + docs/art-direction-pass-e-briefs.md (Pass E brief pack)
- 2026-09-14 mirror: merge M4a 93c5f05 (world/connections.json registry, world-connections.gen.js, js/editor/*, tests; four *-location-data.js deleted)
- 2026-09-14 mirror: assets/ref/ second pack (8 targets) + docs/art-direction-pass-e-briefs.md briefs E5–E10
- 2026-09-14 mirror: merge M4b eef0326 (World Builder editing UI, tools/world-apply.js, CI 21 suites, editor core loader fix)

- 2026-09-14 — merged E3 Roadhouse gauntlet (34d8ab3): native roadhouse scene + ambient + evidence; lighting unit 6.5/10 below floor, see reports/gauntlet-e3-roadhouse.md. Mirrored changed files to vault.

- 2026-09-14 — merged M5 legacy doors → registry (569267c): 15 records, 3 one-way, single installer js/world-connections-production.js, js/maps.js door-free; merge fix removed E3 roadhouse-scene door assertion. Mirrored to vault, deleted js/traincar-location-production.js in vault.

- 2026-09-14 — merged M6 create/delete connections (1371fff): changeset v2, atomic world-apply with catalog write + rollback, Builder NEW/DELETE CONNECTION. Mirrored to vault.

- 2026-09-15 — merged M7 door gating + cast placement editing (38179ca): bundle changesets, world-apply --repin (V5 only). Mirrored to vault.

- 2026-09-15 — merged E3 follow-up (98489bc): roadhouse lighting round, Blender + ImageGen prop prototypes, World Builder prop handoff; prototype browser scripts relocated to assets/prototypes/direct-reference/browser/. Mirrored to vault.

- 2026-09-15 — merged M8 scene objects registry + Builder editing (d08e2d5): world/scene-objects.json, glue reads registry only, world-apply guarded by smoke+walkthrough. Editor pauses here. Mirrored to vault.

- 2026-09-15 — merged E3 cohesion round (ebd6466): props at native scale vs sprites, critic 7/10 borderline, gap = grounding shadows. Mirrored.

- 2026-09-15 — merged Act 5 pass 01 (M9 refresh + M10 from confession lock, act-5-playthrough 203/203) and E7 Red Room native scene (3c086b2). Lead sign-off pending on SG-1..8; E7b floor follow-up open. Mirrored to vault.

- 2026-09-15 — merged E7b floor evidence (0f2ade1): Red Room zigzag 7/10, floor unit met. Mirrored.

- 2026-09-15 — merged test debt triage (ef1e7e3): 23/28 red tests closed, 64 CI steps; vault refreshed from HEAD for diorama.js, engine.js, sheriffs-station-art.js, town-dusk.js, retro-authored.js (canonical-sync stays red only on retro-authored.js while another session has WIP there).
- 2026-09-15 5951a02 opus/debt-probes-adapter → main: pacing probes on Cast Presence, WORLD_TARGETS gap list, 5 files mirrored
- 2026-09-16 44ac895 opus/world-builder-m9-props → main: prop registry data layer, flag off, 11 files mirrored
- 2026-09-17 da1790b main: M10a depth (7aca0e9), Deep loglady + ambient-life-01, GPT Playable Build 01 (#3–#15, #5 minus CLAUDE.md), muted Chrome drivers, gen regenerated; 106 files mirrored
- 2026-09-17 9b71b48 main: M10 confession-lock rulings v1.1.2 (SG-3/5/6/8), CLAUDE.md rewrite; 4 files mirrored
- 2026-09-17 35198df main: opus/campaign-turn-mac (focus emulation fix) + deep/harness-ready-race (freezeMs clamp); 6 files mirrored
- 2026-09-17 0267c30 main: E0b closed as already grounded, test/retro-contact-shadow.js gate added; 1 file mirrored
- 2026-09-17 9afa14a main: E0 evidence shots artifacts/art-pass-e/e0 (4 png) mirrored; stale worktrees pruned
- 2026-09-18 410f2d4 main: opus reaper (03f6c27) + deep CI consolidation (12 workflows → tests.yml/browser.yml); 11 files mirrored, 12 removed
- 2026-09-18 afbf3cc main: opus M10b props editor UI (b39717c); CI green on 621ebf1 (tests+browser), local release 115/115; 23 files mirrored
- 2026-09-18 9dbcdaa main: deep town-dusk readback measurement (cba7122, no render change) + town-dusk test contract after DQ3; 6 files mirrored
- 2026-09-18 4414730 main: deep town-dusk test re-pinned to DQ3 (255bd6a), test in CI (116 gates); 4 files mirrored
- 2026-09-18 7100c23 main: opus M11 evidence (a7e0294), verdict do not flip props; 20 files mirrored
