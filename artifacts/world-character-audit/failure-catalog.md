# Failure catalog — world / character presence (2026-09-11)

Evidence: `cast-presence-matrix.md`, `presence-enumeration.md` (code-driven, `tools/presence-enumerator.js`), `ownership-trace.md`, `location-population-matrix.md`. Windows W1–W11 as defined in the cast matrix.

| class | instance | where | window | status |
|---|---|---|---|---|
| A DUPLICATE PRESENCE | Truman: sheriff 10,4 (classic, no cond) + roadhouse 4,8 (adapter) | `js/glue.js:30`, `js/narrative-engine-adapter.js:253-257` | W6–W8 | ACTUAL (enumerator) |
| A | Truman: sheriff + traincar 9,8 (adapter, `m5_final_theory ∧ ¬east_route_confirmed`) | glue.js:30, adapter:195-199 | W4 (after the preliminary theory) | ACTUAL |
| A | Hawk: sheriff 12,8 (classic, no cond) + traincar `hawk_*` (adapter) | glue.js:33/39, adapter:210-224 | W4–W5 | ACTUAL |
| A | Hawk: sheriff + town shore 16,27 (`hawk_shore_first/after`) | adapter:307-316 | W9–W10 | ACTUAL (enumerator) |
| A | Norma, Shelly, James, Log Lady: diner (classic, no cond) + roadhouse crowd | glue.js:63-70, adapter:267-291 | W6–W8 (**G10**) | ACTUAL |
| A | Bobby, Donna: town (classic `!flag:gigante2`) + roadhouse crowd (`atto4 ∧ ¬warning_target`) | glue.js:12,19, adapter:258-266 | W6–W7 (before `gigante2`) | ACTUAL |
| A | Audrey: hotel_gn (classic, no cond) + oej (adapter) | glue.js:41, adapter:187-191 | W4–W5 | ACTUAL |
| B PHANTOM PRESENCE | Andy at the station while the story has him at the Palmer house (`sarah_support_state=vice`) | glue.js:32; offscreen-timeline T4′/T7′ | W9–W10 | ACTUAL |
| B | Truman at the station during the Roadhouse statement (see A) | — | W7–W8 | ACTUAL |
| B | `piantone_ronette` posted forever after `jacques_dead` | adapter:172-176 | W6–W11 | ACTUAL (harmless, unowned) |
| C MISSING PRESENCE | Sarah has no body from W8 on, though M9 reads `sarah_support_state` and the house is a route destination | glue.js:47 (`!flag:gigante2`) | W8–W11 | ACTUAL |
| C | Andy absent at the Palmer house when dispatched there | no entity | W9–W10 | ACTUAL (caption carries it — accepted in pass 01, still a C) |
| D PERMANENT SUPPRESSION | `!flag:gigante2` on sarah, bobby, donna, jacoby: flag set once from `nodes_done.m8_roadhouse_truman`, never unset | glue.js:12,19,22,47; `js/narrative-production.js:165-166` | W8→end | ACTUAL (accepted as "known debt" in pass 01 — that acceptance is the defect) |
| D | `flag:jacques_preso` removes the OEJ Jacques with no successor body | adapter:184 | W5→end | INTENDED (dead/arrested) but expressed as suppression, not status |
| E OWNERSHIP COLLISION | Every named character appearing in both `NPCS` (glue) and `NARRATIVE_ENTITIES` (adapter): truman, hawk, norma, shelly, james, loglady, bobby, donna, audrey | see A | — | STRUCTURAL: the two mechanisms only dedupe by id **within one map** (`classicIdsFor`, adapter:155-190) |
| F SAVE/RELOAD DISAGREEMENT | none in normal play: nothing about presence is persisted; population is recomputed from flags/values/nodes_done; narrative boot precedes the first map load (`save-load-audit.md`) | — | — | NOT OBSERVED; hazard only if `restoreClassicSave` runs before narrative boot (harness misuse) |
| G TRANSITION WITHOUT CAUSE | Truman "teleports" station→traincar→station→roadhouse→station: no authored departure/return anywhere; the same for Hawk, Norma, crowd; return is the accidental consequence of a `when` turning false | ownership-trace Q1–Q4: NOTHING | all | STRUCTURAL |
| H DEAD/INCAPACITATED STILL PRESENT | none found (Jacques removed at arrest; Maddy never a body; Leland's Act 5 sheriff body gated on `¬leland_morto`) | — | — | NOT OBSERVED |
| I VISUAL-ONLY DUPLICATE | Roadhouse crowd entities (`dialogue: null`) are bodies without interaction while the diner bodies keep their dialogue: the sprite is in two places, the voice in one | adapter:258-291 | W6–W8 | ACTUAL |
| J INTERACTION-ONLY GHOST | Classic `leland` dialogue cascade on the sheriff map for Act 5 and `bob` gated on `leland_morto` are bodies-in-waiting (not ghosts). No dialogue reachable without a body was found. `anello_interact`/`mucchio_terra` classic interacts on mission-owned traincar tiles are objects, not characters | — | — | NOT OBSERVED for characters |

## Root cause (one sentence)

There is no notion of a character: the game has two per-map lists of sprites (classic `NPCS`, adapter `NARRATIVE_ENTITIES`), each gated by its own condition language, deduplicated only by string id inside one map, so "Norma at the Roadhouse" is a new sprite added to a map, never a statement about where Norma is.

## Why G10 was possible and not caught

Possible: the Roadhouse crowd was authored as *staging for a room* (pass 01 §4), not as *movement of six people*; the diner entries have no condition because the classic layer never needed one; the only suppression tool available (`!flag:gigante2`) is one-shot and cannot express "back at six the next morning". Not caught: every presence test checks one map or one state at a time and none normalises identity across maps (`test-coverage-and-life-boundary.md`); the mirror gate pins the conds that exist, not the conds that are missing.
