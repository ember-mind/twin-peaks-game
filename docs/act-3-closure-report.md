# Act 3 — closure report (M6 stitch · native traincar · production playthrough · freeze)

Date: 2026-09-10. Scope: plan steps C, D3–D5, E of `docs/act-3-design-report.md` §15, on top of Implementation Pass 01. Structure per `docs/narrative/templates/freeze-report.md`. Design, doctrine audit and pass 01 are treated as frozen; nothing below re-opens them.

**Result: Act 3 structurally frozen — pass with notes.** M5 + M6 play end to end on the production build through three full paths (151/151 driver assertions, zero API fallbacks) after three P0 defects found only by the real playthrough were fixed. The footbridge/traincar is native (Native Golden). The hospital guard is mandatory before the night report. Narrative lint is down to the single M9-owned known-open. Measured required path is ~13 min, below the 15–17 min estimate; the gap is travel over-estimated in the design, not content. No human test has been run.

## 1. Final beat map

| # | Beat | M/O | Node(s) | State written |
|---|---|---|---|---|
| A1 | East road | M | classic town door → traincar spawn (1,7) | — |
| A2 | Bridge | M | `m5_bridge` (bridge_rail 4,6) | E_PONTE_DIREZIONE, note |
| A3 | Car door + preliminary theory | M | `m5_discovery` → `m5_theory_initial` (impeto / withhold) | `vagone_scoperto`, `m5_initial_theory` |
| A4–A6 | Mound, ring, centre (any order) | M | `m5_mound`, `m5_ring`, `m5_scene` | E7A/E7B, E8A/E8B, E_SCENE |
| A7–A8 | Stove, cards | O | `m5_stove`, `m5_cards` (4th page if the other was seen) | E_STUFA, E_CARTE |
| A9 | Ring ↔ dust | M | `m5_cmp_ring` (action feedback, no "therefore") | P3A formulated |
| A10 | Revision / first theory | M | `m5_theory_revision` (keep/switch) · `m5_theory_first` (3) | `m5_final_theory` |
| A11 | Ticket ↔ verse | O | `m5_cmp_ticket_e5` | note |
| A12 | Truman on site | M | `m5_report_intro` (`pages_by_value`: contest / accept / open) | — |
| A13 | Custody | M | `m5_s1` (institutional / documented_custody) | `s1` |
| A14 | North cut | M | `m5_tracks_north` (early refusal `m5_tracks_north_early`) | E_TRACCE_EST, `east_route_confirmed` (sole writer) |
| B1 | Table | M | `m6_ferry` | — |
| B2 | Audrey | O | `m6_audrey` (needs `audrey_indaga`, now synced) | `audrey_vista_oej` |
| B3 | Tactic | M | `m6_tactic` (+ cards recall page on E_CARTE) | `m6_tactic` |
| B4 | Interrogation | M | `m6_interrogation_{prova,pressione,falsa}` | `jacques_admitted_presence` + branch evidence |
| B5 | P5 (+ cards pair) | M (+O) | `m6_p5` · `m6_cmp_cards_{prova,pressione,falsa}` | P5 formulated · note only |
| B6 | Arrest | M | `m6_arrest` | `jacques_preso` |
| **B7** | **Hospital, guarded** | **M (new)** | `m6_hospital_guard` (hospital, register; early refusal `m6_return_night_early` at Truman) | note only |
| B8 | Night report | M | `m6_return_night` (requires B7; Audrey page on `audrey_vista_oej`) | — |
| B9 | Lucy's call | M | `m6_news` (`pages_by_value` tactic + `pages_after_branch` impeto) | `jacques_dead`, `jacques_testimony_lost`, P9 |
| B10 | Register return | O | `m6_hospital` | `jacques_death_suspicious` |
| B11 | Mirror, Giant | M | classic `gigante1_dlg` (room 315) | `gigante1` |
| B12 | Act 4 bridge | M | `m6_atto4_bridge` (register page · S1 echo page) | `atto4` |

Objectives: M5 100/200/250/275/300/350/400, M6 100/200/300/350/400/450/500/600 — strict partitions (validated).

## 2. Investigation loop

Observe (tile-anchored examine) → record (notebook fact + question) → compare (notebook pair, action feedback) → theory under pressure (revision at the door; Truman contests with memory, never refutes) → the world corrects (Lucy's call). Six mandatory observations, five deductions, four write-once choices (probe counts). Order inside the car is free; the comparison is the last mandatory observation; the revision needs mound + centre + comparison.

## 3. Evidence / state results

New this pass: no new evidence atoms (E_STUFA/E_CARTE from pass 01 now pay off in M6). State cut per frozen plan: `m6_resource_lost` (merged into `jacques_testimony_lost`), `jacques_statement_terms_known`, `night_log_no_visitor` (merged into `jacques_death_suspicious`), `audrey_salvata` (narrative catalogue; the classic walkthrough simulator still carries a phantom acquisition, left as compatibility). `jacques_death_suspicious` now has exactly one reader (B12 register page). `s1` has an in-act reader (B12 echo) besides the finale. `audrey_indaga` now crosses classic → narrative (sync list); `east_route_confirmed` now crosses narrative → classic (sync list, see §10).

## 4. Theory-path outcomes (played)

| Path | A3 | A10 | A12 Truman | B9 extra | B12 |
|---|---|---|---|---|---|
| impeto-kept | degeneration | keep | contest (memory: "l'hai scritta tu") | `cooper_impeto` fires after the tactic regret | register page (B10 played) + `s1_safe` |
| withhold-open | withheld | open | both readings carried | none | `s1_pocket`, no register page |
| withhold-staging | withheld | staging | "come tua" | none | register page + `s1_pocket` |

The kept impeto is never called wrong by anyone; the pillow does it.

## 5. M6 stitch (Part C)

Implemented verbatim from the Fable text spec: cards recall (action page, `evidence: E_CARTE`, no deduction stated); cards ↔ testimony comparison as three exclusive nodes (the notebook pair matcher needs a fixed second atom; `hide_attempted_results: false` so the pair is never mute on revisit); `m6_hospital_guard` (4 pages, nurse "Piantonato. Firma domattina.", note only, no register flags) + `m6_return_night_early` (Truman sends Cooper to the ward, never silent); night report Audrey page; Lucy impeto page via `pages_after_branch`; Act 4 bridge register + S1 echo pages; guard sprites (`piantone` in front of the ward's north double door while Renault lives; `piantone_ronette` beside Ronette after). M6: 12 → 17 nodes, 95 pages.

## 6. Traincar production result (Part D)

Native 24×12 (`js/traincar-art.js`, `-scene.js`, `-production.js`), exterior hook pattern of the station exterior, roof-cut car as authored tiles, no new primitive. Golden Concept → native first → parity polish (rails from the plank end to the buffer block under the east trucks; ballast slab removed; three-value gravel) → **Native Golden** (`artifacts/traincar-v01/traincar-native-golden.png`, `-5x.png`). Deviations from the D2 brief, all in `artifacts/traincar-v01/native-notes.md`: two-leaf door (13–14,7) because the walkthrough treats authored objects as blocking; planks at cols 3–4 over the creek; three-line sign; value ladder rebuilt (the brief's hexes contradicted its own order). Contract `test/traincar-native.js` enforces the five gates (one ember, unbroken dust film, creek < ballast, tape step, ring hidden on `s1`) plus collision/reachability of all nine targets and actors outside the car. Spatial requirements 1–9 verified on the capture: bridge town-side, rails bridge → car and ending under the car, south entrance, mound inside the door, door → mound → beam one column, tracks past the car into the cut, sign beside the trace.

## 7. Character / voice changes

Nurse: one procedural line. Truman: four new lines, all procedure/record ("verbale", "cassaforte", "lo cito"). Cooper: clock and door, never the man; the impeto correction names his own note. Hawk unchanged. Speaker-swap probe (`artifacts/act-3-closure/destructive-probes.md`): Hawk 6/9 lines carry an age/duration/direction marker, the three without are duty-assignment lines; Truman 7/9, the two without are the deliberate gnomic unsaid; Jacques 7/8 through the cards; Cooper 4/5. Verdict: pass, no repair.

## 8. Agency / echo results

S1 read back once in-act by procedure (`s1_safe` / `s1_pocket`), ring meaning unstated. Tactic read back at Lucy's call (existing) and at P5 feedback. Theory read back by Truman (contest / accept / open) and by the world (pillow). Audrey's promise paid by one Truman line only if seen; silence otherwise. Register revisit read back once at B12. Hospital guard: the resource is seen before it is lost (payoff ablation confirms the act cannot complete without it).

## 9. Pacing (measured, `test/probe-act3-pacing.js`)

| Metric | Value |
|---|---|
| Required path, 12 cps (6 theory × tactic combos) | 12.7–13.0 min |
| Required path, 15 cps | 10.8–11.1 min |
| Walking | 688 tiles, 2.4 min |
| Investigation + dialogue | ~10.5 min |
| Optional content measured | 2.2 min (stove, cards, sign, cards pair, register) |
| Longest passive block | ferry → tactic → interrogation → P5 → arrest, 27 pages, ~153 s, no map change |
| Longest uninterrupted walk | town door → traincar spawn, 62 tiles, 13 s |
| Time to first interaction | 31 s |
| Mandatory observations / deductions / write-once choices | 6 / 5 / 4 |

Against the 15–17 min estimate: short by 2–4 min, entirely in travel (design assumed 3.5–4 min, topology needs 2.4). Content buckets match the design. Not padded. The long OEJ block is the one pacing risk for the human test (two player questions and one choice inside it).

## 10. Played-transcript findings (real build, `test/act-3-playthrough.js`)

Three paths, 298 pages; emitted speaker = authored speaker on every page; variants only in their state; no result ids or metadata; no classic duplicate actor on traincar/oej; Giant only via Room 315; Audrey line only when seen; S1 echo matches custody; save/reload after the arrest and at the north cut restore objective, entities and tile identically.

Defects found by the playthrough and fixed (none was visible to the node tests):
1. **Softlock on the bridge.** Hawk state 1 at (5,7) stood on the only creek crossing; Cooper could not leave the planks. Moved to (5,6); `act-3-flow` now forbids any traincar entity on the crossing row.
2. **One Eyed Jacks unreachable.** `east_route_confirmed` was written only in narrative state and never mirrored to the classic flag the door reads. Added to `syncNarrativeToClassic`; `act-3-mirror-gate` pins it.
3. **Jacques and Audrey absent.** Pass 01 retired the classic OEJ NPCs without registering narrative entities. Added (`jacques` until `jacques_preso`; `audrey` on `audrey_indaga ∧ ¬audrey_vista_oej ∧ ¬jacques_preso`).
4. **Guard placement** contradicted its text (counter side vs "davanti a una porta chiusa"); moved in front of the ward's north double door.
5. **Not a defect, investigated:** the classic wake-up monologue rendered on the night return to Room 315. The `once` gate held; the driver had teleported out of the Red Room after the dream instead of walking its exit door, which leads to Room 315 where the wake fires in Act 2 for real players. Driver corrected (`artifacts/act-3-closure/room-315-onenter-night.png`).

Not a defect, recorded: M5 rung 400 never shows because M6 enters on the same commit and its rung 100 takes the HUD; HUD lags state by one 180 ms poll.

## 11. Validators / destructive probes

| Check | Result |
|---|---|
| `act-3-flow` | 237/237 (M5 runtime, adapter placements, M6 stitch, guards, sync proof for `audrey_indaga`) |
| `act-3-mirror-gate` | 14/14 |
| `narrative-validate` / `-m5` / `-m6` | 3525 / 2898 / 4819 |
| `interaction-voice` | classic 85, narrative 69, repeat 20 |
| `narrative-lint` | PASS, 1 warning (M9 P7 known-open, untouched by decision) |
| `traincar-native` | PASS |
| `smoke` / `walkthrough` | 443 / 89 (no drop) |
| Node sweep (103 entry points) | 85 pass; 18 failures = the documented pre-existing set + vault drift (closed by the mirror, §13) |
| Browser playthrough | 151/151, three paths |

Destructive probes (`artifacts/act-3-closure/destructive-probes.md`): deleting the tile-anchored traincar nodes makes `east_route_confirmed` unwritable (the place is causal, not decoration); deleting the hospital guard kills the act; deleting the S1 echo leaves `s1` without an in-act reader; all three route links single-writer. One runtime finding, not player-reachable: `NR.prepareChoice` does not re-check node conditions, so P5 could be formulated by direct API call with the Jacques branch deleted. Logged as debt (runtime untouched by decision).

## 12. Visual same-world review

`artifacts/traincar-v01/same-world-sheet.png`: traincar beside station exterior, Double R lot, Room 315, hospital ward at 1×. Same conifer family, same 24 px actor, same contact band, same 48 px north face; the traincar is the only overcast state and the darkest ground, justified by the beat. Rougher subject, not lower production. World Visual Bible §12 added: the four outdoor rules (authored weather state, three-value ground, roof-cut interior, flag-driven overlay) were all needed and are adopted.

## 13. Known debt

- Classic walkthrough simulator still carries an `audrey_salvata` phantom acquisition (compatibility; narrative catalogue cut).
- M5 objective 400 is dead content (M6 takes the HUD in the same commit).
- `NR.prepareChoice` trusts call order for node conditions (see §11).
- Guarded room is a door sprite-less convention: the guard stands before the ward's north double door; no Jacques room exists in the ward art.
- Ticket ↔ verse pair and Audrey depend on optional Act 2 content; unmeasured in pacing.
- The long OEJ passive block (~153 s) is untested on humans.
- Coldstage baselines not refreshed (user hold); Node sweep failures outside the documented set were vault drift only.

## 14. Structural verdict

Frozen. Hard gates all pass (partition, single writers, no read-before-write except the M9 known-open, no silent refusal, no shadow pairs, sync both ways). Doctrine repairs R1–R3 are in the played transcript, not only in the JSON.

## 15. Human-test hypotheses (unvalidated)

1. Players will read the ring as placed from the dust before the notebook asks (A9 feedback lands as confirmation, not instruction).
2. A kept impeto will feel corrected by the pillow, not scolded by Truman.
3. Players will attribute Hawk/Truman lines blind ≥ 80% on the marked lines.
4. The hospital guard walk will be remembered when Lucy calls (resource seen before lost).
5. The custody choice will be recalled at B12 with its cost (Truman's dissent / the safe).
Protocol: `docs/narrative/templates/human-test.md`, five fixed questions, raw answers.

## 16. Recommended next milestone

First human test on Acts 1–3 (the quality-validation milestone the system defines). Before it: nothing mandatory. After it: M8/Act 4 design pass, OEJ native, M9 P7.

## Artifacts

`artifacts/traincar-v01/`: `traincar-concept.png` (Golden Concept), `native-first.png`, `traincar-native-golden.png`, `traincar-native-golden-5x.png`, `ingame-investigation.png`, `hawk-states.png`, `overlay-post-report.png`, `same-world-sheet.png`, `native-notes.md`. `artifacts/act-3-closure/`: `transcripts/{impeto-kept,withhold-open,withhold-staging}.{json,md}`, `assertions.json`, `comparison-ring-feedback.png`, `truman-contest-impeto.png`, `hospital-guard.png`, `lucy-impeto.png`, `atto4-s1-echo.png`, `pacing.md`, `node-sweep.md`, `destructive-probes.md`. Drivers: `test/act-3-playthrough.js` + `-probe.html`, `test/probe-act3-pacing.js`.
