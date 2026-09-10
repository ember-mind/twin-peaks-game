# Milestone reality matrix — BEFORE repair (2026-09-10 23:20)

Evidence files in this directory: `00-git-state.md`, `tests-before.md`, `act3-forensics.md`, `act4-forensics.md`, `state-ownership.md`, `map-transitions.md`, `studio-systems.md`, `report-claims.md`, `system-integrity.md`, `vault-divergence.md`, `playthrough-before/`. Repository = HEAD `b4ef050` (clean tree). Reports are intent; the classification below is from source, tests and runtime only.

Classes: VERIFIED COMPLETE · PARTIAL · MISSING · REVERTED · DRIFTED · CONFLICTING · NOT EXPECTED YET.

## Studio system

| component | class | evidence |
|---|---|---|
| World Visual Bible | VERIFIED COMPLETE | `docs/world-visual-bible-v0.1.md` present; every js/ file it names exists (`studio-systems.md`) |
| World Engine | VERIFIED COMPLETE | `docs/world-engine-v0.1.md`; `js/world-engine.js`, `js/world-catalog.js`, `js/location-connections.js` present; exterior lots (sheriff, Double R) registered at runtime by production modules — documented as a known unrefactored seam |
| Ambient Life | VERIFIED COMPLETE | doc + `js/ambient-life*.js` + validators present |
| Character Life | VERIFIED COMPLETE (thin doc) | `docs/character-activity.md` 32 lines; `js/character-activity.js`, `js/character-life-scenes.js`; `test/character-life.js` passes |
| Narrative System v0.1 | VERIFIED COMPLETE | workflow, hard gates vs heuristics, 10 templates (prose says "nine": cosmetic), model economy, human-test boundary all present (`system-integrity.md`); `narrative-lint` PASS (1 known-open M9 P7) |
| Story Truth v0.1 | VERIFIED COMPLETE | README contract, source/status separation, truth-vs-knowledge; Maddy coach schedule locked, taxi lie active authority, ring unresolved, BOB ambiguity intentional; `story-truth-lint` PASS 1043; `tools/story/validate-story.js` PASS |
| Agent discoverability | VERIFIED COMPLETE | CLAUDE.md → `docs/narrative/README.md`, `docs/story/README.md`; AGENTS.md → CLAUDE.md (intentional indirection, system doc §18) |

## Act 1

| component | class | evidence |
|---|---|---|
| narrative production (M1–M3 / classic) | VERIFIED COMPLETE | `smoke` 420 and `walkthrough` 81 pass; M1–M3 validators pass (`tests-before.md`) |
| frozen corrections (ring clue wording, diary wording, Sarah page 3) | VERIFIED COMPLETE | `js/data.js`: `anello` "Niente qui dice di chi sia"; `diario` canonical wording; `sarah_visione` no BOB (`act4-forensics.md` b) |
| native environments (diner, sheriff, Room 315, hospital) | VERIFIED COMPLETE | scene modules present and loaded by index.html (`map-transitions.md`) |

## Act 2

| component | class | evidence |
|---|---|---|
| Room 315 | VERIFIED COMPLETE | `js/room-315-*.js`; `test/room-315-*.js` pass |
| hospital | VERIFIED COMPLETE | `js/hospital-*.js`; validators pass |
| Ronette mandatory path | VERIFIED COMPLETE | `test/act-2-ronette-required.js` PASS; `test/act-2-flow.js` PASS |
| Act 2 closure gates | VERIFIED COMPLETE | all act-2 tests pass; `audrey_indaga` sync now exists (`js/narrative-production.js:141`) — the extraction report's known-open defect is closed (report-claims: NO LONGER TRUE, superseded) |

## Act 3

| component | class | evidence |
|---|---|---|
| topology cleanup | VERIFIED COMPLETE | six retired classic ids absent (`act3-forensics.md`) |
| M5 investigation | VERIFIED COMPLETE | preliminary theory = degeneration/withheld only; ring↔dust comparison mandatory; revision needs premises |
| ring comparison / theory under pressure | VERIFIED COMPLETE | M5 node conditions quoted in `act3-forensics.md` |
| Truman merit response | VERIFIED COMPLETE | Truman contests degeneration, does not refute (pages quoted) |
| north-cut route | VERIFIED COMPLETE | `east_route_confirmed` single writer `M5.json:1399` (m5_tracks_north); OEJ gated by walked route |
| M6 stitch | VERIFIED COMPLETE | cards/stove consumption, `jacques_preso`/`jacques_dead` single mission writers |
| hospital guard | VERIFIED COMPLETE | node, condition and gate verified |
| Lucy impeto correction | VERIFIED COMPLETE | Lucy theory echo node verified |
| S1 procedural echo | VERIFIED COMPLETE | text quoted |
| native traincar | VERIFIED COMPLETE | 5 `js/traincar-*.js` wired in index.html:584-588; map 24×12 in `js/maps.js:349`; golden in `artifacts/traincar-v01/` |
| real-build Act 3 flow | see `playthrough-before/` | act-3-flow 242, mirror-gate 14 pass; browser run recorded in phase 7 |

## Act 4 (Implementation pass 01)

| component | class | evidence |
|---|---|---|
| classic topology cleanup | VERIFIED COMPLETE | 10 retired tokens: zero hits in `js/data.js`, `js/glue.js` |
| Sarah rewrite / window | VERIFIED COMPLETE | `sarah_visione` page 3 nameless; palmer `sarah` cond `!flag:gigante2` (window closes at night by design) |
| diary wording alignment | VERIFIED COMPLETE | `diario` desc/page = M8 lock §9-E wording |
| M8 Roadhouse split | VERIFIED COMPLETE | `m8_roadhouse_truman` (writes presagio) + `m8_roadhouse_phone` (choices), no `next`; `gigante2` ← `nodes_done.m8_roadhouse_truman` single writer |
| Leland visible with Maddy | VERIFIED COMPLETE | adapter diner `leland` when `atto4 ∧ ¬T_LELAND_TAXI`; `m8_leland_waiting` pre-promise page |
| Lucy optional node | VERIFIED COMPLETE | `m8_lucy`, 4 conditional pages, `effect_policy: always` |
| Giant stage window | VERIFIED COMPLETE | `m8_giant_stage` + adapter `gigante` when `presagio active ∧ ¬warning_target`; no classic Giant NPC anywhere |
| phone warning | VERIFIED COMPLETE | three choices write `warning_target`/`maddy_action_after_warning`/`sarah_support_state`; objective 150 window |
| threshold focus choice | VERIFIED COMPLETE | `town_crossroads` 47,30; `m8_focus_choice` → three exclusive routes on `focus_destination` |
| shore causality | VERIFIED COMPLETE | routes write `body_found_by`; discovery version keyed on it; `hawk_shore_first/after` windows |
| station taxi hook | VERIFIED COMPLETE | `m8.f.station.hook.p01/p02` quoted; no bugia/mentito in M8; M9 `m9_verifica_taxi` gated on `T_LELAND_TAXI ∧ ¬D_TAXI` |
| Act 4 conditional entities | VERIFIED COMPLETE | adapter entities as designed; `narrative-data.gen.js` regenerates byte-identical |
| real-build route support | see `playthrough-before/` | act-4-flow 1599, mirror-gate 49, validate-m8 5026 pass; browser run in phase 7 |
| production presentation (narrative widget portrait CSS) | REVERTED | index.html lost the `[data-speaker-source=narrative]` overrides + desktop cabinet block that the committed `js/retro-ui.js`/`js/engine.js` depend on; vault copy intact (`vault-divergence.md`) |

## Act 4 environments

| component | class | evidence |
|---|---|---|
| Roadhouse native | NOT EXPECTED YET | legacy 16×10 tile map only; no `js/roadhouse-*.js`, no artifacts/roadhouse-* — no partial work found |
| lake shore native / state | NOT EXPECTED YET | town tile cluster only; no shore module or artifacts — no partial work found |

## Cross-cutting

| item | class | evidence |
|---|---|---|
| canonical sync | DRIFTED | 94/96: index.html (repo reverted, vault right), js/engine.js (comment-only); outside checker scope: js/render3d.js, two tools scripts, one portrait PNG (repo right, vault stale); vault-only orphan `js/station-population-scenes.js` |
| coldstage config + visual baselines | CONFLICTING | deleted in the repo tree before `b5de5d2` by an unknown process; vault still has them; standing instruction "no coldstage for now" |
| test pins | DRIFTED | narrative-validate-m9 (M8 node count 12→16), retro-production (cache tag), narrative-repair-contract (ring clue "Perché"), double-r native mocks (no `getAttribute`) |
| sprite-gates | DRIFTED (art) | one profile sprite 15 px vs 12–14 bar; art scope, not narrative recovery |
| M9 | EXISTING LEGACY/DESIGN STATE ONLY | `M9.json` present, first node verifies the taxi; lint known-open P7 |
| M10 | NOT CURRENT MILESTONE | — |
