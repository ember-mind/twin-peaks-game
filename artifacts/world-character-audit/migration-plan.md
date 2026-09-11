# Migration plan — Acts 1–4 named characters → Cast Continuity windows (NOT executed) — amended 2026-09-11

**Amendment.** The per-character "target rules (sketch, order = priority)" column below is superseded: there is no order and no priority. The authoring source is the window table in `cast-windows-acts-1-4.md` (§3 windows, §2 baselines, §5 change records); this table survives only as the inventory of *current owners* to delete (V7) and the tests each character touches. Normative semantics: `docs/cast-continuity-contract-v0.1.md`.

## Sequence (revised)

0. **Lead closes D1–D11** (`cast-windows-acts-1-4.md` §8). Nothing is defaulted.
1. **Registry + compiler + resolver**: `narrative/cast/windows.json` (windows + baselines, ids from the truth file) → generated registry → `resolveCharacterPresence` per contract §3 (all windows evaluated; 1 match, else baseline, else error).
2. **Validators before migration**: `test/cast-continuity-validate.js` V1–V8 wired to the flow harnesses and `tools/presence-enumerator.js`; run against the pre-migration world: must FAIL on G10 (norma diner+roadhouse), Hawk sheriff+traincar/shore, Truman sheriff+traincar/roadhouse, Audrey hotel+oej. A validator that passes on today's world is wrong.
3. **Act 4 cluster**: windows `ACT4_*` + baselines for truman, hawk, lucy, andy, sarah, leland, maddy, norma, shelly, loglady, james, bobby, donna, jacoby, giant; delete their classic `NPCS` entries and adapter bodies; delete the four `!flag:gigante2` conds; V1–V8 green; `act-4-flow`, `act-4-mirror-gate` (rewritten to V7), smoke, walkthrough, real-build A/B/C.
4. **Act 3 cluster**: `ACT3_*` windows (Hawk ×3 with the missing CUT exit, Truman report, Audrey, Jacques, piantone ×2); delete adapter bodies.
5. **Baselines for the rest**: gerard, ronette (bed draw stays a scene special referencing the resolved body), infermiera, benhorne, laura, mfap, bob; V7 then forbids any named id in `NPCS`.
6. Act 4 Environment Pass D resumes, population read from the registry; Roadhouse and shore briefs carry the contract §7 fields.

Each step: no story text changes, no save change, no engine simulation. Save impact: none for every row (derived).

## Current owners to delete (inventory; the "target rules" column is historical)


| character | current owners (delete under V7) | historical rule sketch (superseded by windows) | test | save impact |
|---|---|---|---|---|
| Truman | glue sheriff (no cond); adapter traincar (M5), roadhouse (M8) | traincar when `m5_final_theory ∧ ¬east_route_confirmed`; roadhouse when `atto4 ∧ ¬warning_target`; **home sheriff 10,4** | V1, V2 (W4, W7–W8), V3 | none |
| Hawk | glue sheriff; adapter traincar ×3 (M5/M6), town shore ×2 (M8) | traincar rules (existing whens); town 16,27 when `body_found_by=hawk ∧ ¬maddy_trovata` / `maddy_trovata ∧ ¬node_done m8_station`; patrol = `offscreen` when `presagio_status=active ∧ ¬body_found_by` (Lucy's line "Hawk è di pattuglia" becomes true on screen); home sheriff 12,8 | V1, V2, V3 | none |
| Norma, Shelly, James, Log Lady | glue diner; adapter roadhouse crowd | roadhouse when `atto4 ∧ ¬warning_target` (dialogue null per scene contract); home diner (James keeps `sogno_fatto` as his *arrival* rule: offscreen before) | V1 (G10), V3 return to diner at W9 | none |
| Bobby, Donna | glue town `!flag:gigante2`; adapter roadhouse | roadhouse when `atto4 ∧ ¬warning_target`; home town (wander) — **delete `!flag:gigante2`** | V1, V3 | none |
| Jacoby | glue town `!flag:gigante2` | home town 16,25; `offscreen` when `maddy_trovata ∧ ¬node_done m8_station` (not in the shore frame) — design confirms whether he exists at night at all | V2 | none |
| Sarah | glue palmer `!flag:gigante2` | home palmer 9,7; `offscreen` during W8–W10 only if the design says the house is dark (pass-01 intent) — **design decision required**; back after `m8_station` (M9 reads `sarah_support_state`) | V2, V3 | none |
| Andy | glue sheriff | palmer when `sarah_support_state=vice ∧ ¬node_done m8_station` (offscreen-timeline T4′/T7′); home sheriff | V2 | none |
| Lucy | glue sheriff; M6/M8 nodes on actor | home sheriff (no move in Acts 1–4) | V6 | none |
| Audrey | glue hotel_gn (no cond); adapter oej | oej when (existing when); home hotel_gn | V1 | none |
| Leland | adapter diner (M8), glue sheriff (act5) | diner 11,1 when `atto4 ∧ ¬T_LELAND_TAXI`; sheriff when `atto5 ∧ ¬leland_morto`; `offscreen` otherwise (never a Palmer body in Acts 1–4) | V2, V5 | none |
| Maddy | adapter diner | diner when `atto4 ∧ ¬maddy_trovata ∧ ¬…` (existing); `offscreen` after — terminal | V5 | none |
| Giant | glue room_315 mirror (`gigante1_dlg`), adapter roadhouse stage | room_315 window (existing cond); roadhouse 8,1 when `presagio_status=active ∧ ¬warning_target`; `offscreen` default | V1, V2 | none |
| Jacques | adapter oej (`¬jacques_preso`) | oej when `¬jacques_preso`; `offscreen` terminal | V5 | none |
| Gerard, Ronette | glue hospital (no cond) | home hospital; Ronette's bed draw stays a scene special case (`hospital-scene.js:114-120`) referencing the resolved body | V6 | none |
| Ben Horne | glue hotel_gn | home hotel_gn (residue: confirm the Act 2 line is still wanted) | V6 | none |
| Cooper | player | exempt (player body) | — | — |
| piantone, piantone_ronette, agente_guardia, infermiera | adapter / glue | STORY-BOUND NAMED or LOCAL BACKGROUND per §17; `piantone_ronette` gets an end (`offscreen` after `atto4`) | V2 | none |

