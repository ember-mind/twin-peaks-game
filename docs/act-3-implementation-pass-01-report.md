# Act 3 — Implementation pass 01: topology cleanup + M5 investigation (with traincar D1/D2)

Date: 2026-09-10. Scope: plan steps A (topology cleanup) and B (M5 data / investigation) of `docs/act-3-design-report.md` §15, plus D1 (Golden Concept) and D2 (native translation brief) in parallel. Not done, by brief: M6 stitch (C), native traincar build (D3–D5), playthrough/freeze (E), Act 4. Sources honoured: design report §5/§6/§7/§12, `doctrine-audit.md` R1–R3 and O1–O11, `scene-contracts.md` S1–S5, the two ledgers, `evidence-map.md`, `traincar-environment-brief.md`, Narrative Craft Bible. No engine primitive was added; no World Engine change.

State: working tree, uncommitted; vault mirrored (guard 93/93). Coldstage not run (user hold).

## 1. Topology cleanup summary (Part A)

| # | Task | Done as |
|---|---|---|
| A1 | traincar → oej door gated | `js/maps.js` door `'21,0'`: `needsFlag: 'east_route_confirmed', blockedMsg: 'oej_bloccato'`; mirrored in `js/traincar-location-data.js`. New classic dialogue `oej_bloccato` (js/data.js): "Il sentiero sale a nord, fra gli alberi." / COOPER: "Non ancora. Prima le impronte che ci arrivano, poi il sentiero." |
| A2 | Retire conflicting classic content | Removed: `hawk_vagone` NPC + dialogue (traincar now has no classic NPCs); classic `jacques` (`jacques_a3`) and `audrey` (`audrey_oej`) NPCs on oej + dialogues; `truman_wait4` cascade entry + dialogue; roadhouse `'8,1': 'palco_gigante'` interact, its cascade, `gigante2_dlg` and `palco_dopo`. Mission-owned versions preserved (M5/M6/M8). |
| A3 | Re-pin affected tests | `test/smoke.js` and `test/walkthrough.js`: the retired classic span replaced by explicit stubs equal to the `syncNarrativeToClassic` outcome (`jacques_preso`, `gigante2`, `east_route_confirmed`; `audrey_salvata` kept as a simulator-only stub). `test/dialogue-craft-regression.js` (audrey_oej spec removed), `test/narrative-repair-contract.js` (gigante2_dlg assertion removed), `test/traincar-location-traversal.js` (flag set before the gated crossing), `test/interaction-voice.js` (gigante2 Diane allowance removed; supports state-conditioned pages; counts 48 roots / 63 variants / 18 repeats), `test/narrative-validate-m6/m8/m9.js` (M5 node count 13 → 21). Counts after cleanup: smoke 443 checks, walkthrough 89 acquisitions, finale reached. |
| A4 | Mirror gate regression | New `test/act-3-mirror-gate.js` (13/13): `specchio315` cascade → `gigante1_dlg` only with classic `jacques_morto` and not `gigante1`; `syncNarrativeToClassic` maps `jacques_dead` → `jacques_morto` only when true; `jacques_a3` gone and `lucy_a3` the sole classic writer of `jacques_morto`; door gate + `oej_bloccato` exist. |

Correction to the plan's premise: classic `jacques_a3` wrote `jacques_preso`, not `jacques_morto`; `jacques_morto` is written by the classic `lucy_a3` bridge (kept). The live path is: M6 `jacques_preso` → classic sync → `lucy_a3` → `jacques_morto` → mirror. The mission `jacques_dead` → `jacques_morto` sync also exists. `audrey_salvata` now has no writer in the game (evidence map verdict CUT); it is read by nothing.

## 2. Final M5 runtime topology (21 nodes)

```
m5_bridge (bridge_rail) ─E_PONTE_DIREZIONE─┐
m5_hawk_bridge (actor hawk_bridge, placement line)
m5_discovery (traincar_entrance) ─vagone_scoperto─ next→ m5_theory_initial (internal choice: degeneration | withheld)
  ├ m5_mound (E7A,E7B)          ┐
  ├ m5_ring  (E8A,E8B) ──────── m5_cmp_ring (notebook comparison, MANDATORY: ring_a → P3A formulated; ring_b/ring_c retry)
  ├ m5_scene (E_SCENE, positional)┘
  ├ m5_stove (E_STUFA, optional) ┐ conditional 4th page "non una sera sola" on whichever is second
  ├ m5_cards (E_CARTE, optional) ┘
  └ m5_hawk_door (actor hawk_door, placement line)
milestone_theory_revision / milestone_theory_first (pending_when: initial=degeneration|withheld ∧ mound ∧ scene ∧ P3A formulated; resolved_when final theory; blocks m5_report_intro)
  m5_theory_revision (keep | rivedo→staging | open)   m5_theory_first (degeneration | staging | open)
m5_report_intro (actor truman; final theory ∧ P3A) ─pages_by_value─ next→ m5_s1 (institutional | documented_custody) goto→ m5_report_close (no effects)
m5_tracks_north_early (tracks_north, ¬s1: Cooper refusal, repeat)  |  m5_tracks_north (tracks_north, s1: E_TRACCE_EST + east_route_confirmed)
m5_hawk_cut (actor hawk_cut, placement line)   m5_sign_oej (optional)   m5_cmp_ticket_e5 (optional, unchanged)
```

Mechanics used, all pre-existing: `next`/`goto` chains, `pending_when` milestones, `value_is`, `proposition_path`, `pages_by_value` + `pages_after_branch`, per-page `condition` (C8-B conditional pages), `repeat`/`repeat_when`, `NARRATIVE_ENTITIES.when`, `WORLD_TARGETS`.

Two facts about the runtime shaped the data: a comparison never sets `nodes_done`, so "comparison done" is read as `P3A.formulation.status == formulated`; a choice-only node (`m5_s1`) never sets `nodes_done`, so "custody done" is read as `value_set s1`.

## 3. Evidence / state changes

- New atoms (`narrative/evidence.json`, all `acquired_in: M5`): `E_PONTE_DIREZIONE` (bridge), `E_TRACCE_EST` (north cut), `E_STUFA` (stove), `E_CARTE` (cards, supports P5). One writer each.
- `m5_initial_theory_domain` = `["degeneration","withheld"]` (was degeneration|staging): disposition is never offered at the door. `m5_final_theory_domain` unchanged.
- `m5_theory_revised` removed from the enums, the delta and every effect. No flag added.
- `east_route_confirmed`: single writer `m5_tracks_north` (removed from `m5_report_close`), verified statically across M4/M5/M6/M8/M9.
- P3A state after the report is a documented mapping, not a new primitive: presented ⇔ `nodes_done.m5_report_intro`; contested ⇔ `m5_final_theory = degeneration`; accepted-as-Cooper's ⇔ `staging`; both carried ⇔ `open`. (The runtime's `presentation` block is the M4 widget pattern; the frozen design chose `pages_by_value`, so no `presentations[]` record is written for P3A. See §10.)
- `s1` write-once, unchanged, no reader yet in-act (R3 lands in C3).
- Cut: `m5.note.cooper_reading`. Notebook entries are now facts + one question (bridge, mound, ring, centre, stove, cards, north cut).
- Adapter: `WORLD_TARGETS.traincar` re-keyed `sign_ponte → bridge_rail` (5,6) and added `stove` (12,3), `cards` (9,5), `tracks_north` (21,3); Truman moved from inside the car (9,4) to the rails (9,7). Environmental inspect lines added for the three new tiles.

## 4. Objective ladder (strict partition, verified in every reachable state)

| Rung | Condition | Text |
|---|---|---|
| 100 | ¬vagone_scoperto | Verifica la rotta di James: oltre il ponte, verso i binari. |
| 200 | vagone ∧ ¬(mound ∧ ring ∧ scene) | Esamina il vagone senza spostare nulla: la terra, la traversa, il centro. |
| 250 | mound ∧ ring ∧ scene ∧ ¬P3A | Taccuino (T): l'anello e la polvere intorno. |
| 275 | mound ∧ scene ∧ P3A ∧ ¬final theory | Torna sulla soglia del vagone. La prima lettura regge? |
| 300 | final theory ∧ ¬s1 | Truman è sui binari. Riferisci la scena prima che cali la luce. |
| 350 | s1 ∧ ¬east_route_confirmed | Hawk è ai binari, oltre il vagone. |
| 400 | east_route_confirmed | Segui la rotta oltre il confine: One Eyed Jacks. |

No silent refusal remains: the early north-cut tile answers in Cooper's voice; the report is blocked only by a pending milestone, which any interaction on the map re-opens (existing `milestone_resume`).

## 5. Investigation interaction flow

1. Bridge (`bridge_rail`): stake on the town bank, planks worn on the town half; Hawk dates and directs the prints ("più vecchie della pioggia… a est, nessuna torna"), refuses to interpret the stake. Hawk sprite appears here only after this node.
2. Car door: the whole interior is rendered from the doorway in one page (mound, seat, sheet, beam with "qualcosa di piccolo", stove), then the notebook asks **"Prima lettura?"** with exactly two options: "Un incontro degenerato." / "Non scrivo ancora." Hawk moves outside the door, back turned.
3. Inside, any order: mound (E7A text and E7B position as separate facts: clean inner folds, one flap left in the light, "Nascosto a chi?"), ring (flat, exact centre; dust intact to the edge, no roll path, "Caduto, o fermato?"), centre (positional: door→mound→beam one line, violence at the corners, no drag marks), optional stove (cold, ash raked in a ring, burnt matchbook edge), optional cards (damp deck, dealer's cut squared, wax in layers). "Non è stata una sera sola" is said once, only when both optional objects were seen.
4. Notebook comparison ring ↔ dust (mandatory): "Polvere intatta fino al bordo. Che dice?" — "Che non è caduto. È stato posato." formulates P3A; feedback is an action ("Cooper non lo tocca. Fotografa il bordo della polvere, poi il centro. Due scatti, nessuna parola."). "Nessuno entra qui da anni" / "È di Laura" retry with merit feedback.
5. Revision (only after mound ∧ centre ∧ comparison; opened by returning to any target on the map, objective 275 points at the doorway): impeto keeper sees "Regge ancora?" with keep / rivedo / aperta; withholder sees "Ora scrivi?" with impeto / disposizione / aperta.
6. Truman on the rails (only with a final theory and P3A): merit answer by value, then custody S1, then Hawk's "Non te lo dico da qui. Vieni." and Truman's lead ("laggiù il banco lo tiene Renault").
7. North cut (walk): the prints pass the car and enter the cut; Hawk names the property and the hour; Cooper decides on the man who holds the bank. `east_route_confirmed`; the oej door opens.

## 6. Theory-state behaviour

| At the door | After the comparison | `m5_final_theory` | Feedback |
|---|---|---|---|
| degeneration | keep | degeneration | pencil line kept, three facts under it |
| degeneration | rivedo | staging | erased, rewritten in ink |
| degeneration | aperta | open | two lines, none erased |
| withheld | impeto / disposizione / aperta | degeneration / staging / open | first writing |

Only the final state is stored; the initial value stays as history. Proven: the revision node is unreachable in every observation order until mound + centre + comparison; no path can reach the report without P3A even with a forced final value.

## 7. Truman merit behaviour (R2)

- **impeto**: Cooper states the reading; Truman: "La polvere, Cooper. L'hai scritta tu: intatta fino al bordo. Cosa la tiene al centro?" — Cooper: "Non lo so ancora, Harry. Ho fotografato il bordo, non la risposta." — Truman: "Allora a verbale vanno i fatti. La lettura resta tua." No page says "posato/disposto" (validator guard). P3A contested; the act proceeds (custody, north cut); no loop, no retry.
- **disposizione**: "Il centro è stato lasciato così perché venisse letto. Lo firmo io, Harry." — Truman: "La lettura la verbalizziamo come tua. I fatti come nostri." Accepted as Cooper's reading, not as world truth.
- **aperta**: both readings on Cooper's name; "I fatti, uno solo: il nostro."
- Common close: the ring to the safe tonight, Cooper's interval line, then S1.

The correction of a kept impeto by events (Jacques's admission, the pillow, one page at Lucy's call) is step C3, not built here.

## 8. North cut / OEJ gating

- `m5_tracks_north` is the only writer of `east_route_confirmed` and `E_TRACCE_EST`; it requires `s1` (report and custody done). Its page adds only the car-specific fact (the prints pass the car and enter the cut); "nessuna torna indietro" is said once, at the bridge.
- Before the report, the same tile plays `m5_tracks_north_early` (Cooper: "Hawk è ancora alla porta: le impronte aspettano, la luce no. Prima il vagone."), repeatable; conditions are mutually exclusive with the real node.
- Hawk's OEJ/property line moved from the report close to the cut ("Dal cartello in poi il sentiero non serve altre proprietà. Un'ora di cammino. Finisce a One Eyed Jacks.").
- The oej door is closed until the walked discovery (`oej_bloccato`); verified by flow test (flag false before, true after) and by the classic simulators.

Hawk placements (adapter, distinct ids because entity sync matches by `npc.id`): `hawk_bridge` (6,6) after `m5_bridge` until discovery; `hawk_door` (12,7) facing away from the door until `s1`; `hawk_cut` (22,3) facing north after `s1`. Each has a one-line actor node with a Cooper answer and a repeat; none writes state. In-game captures of the three states: `artifacts/act-3-pass-01/traincar-legacy-hawk-states.png`.

## 9. Focused validation results

| Suite | Result |
|---|---|
| `test/narrative-validate-m5.js` (rewritten) | 2898 checks ✔ |
| `test/narrative-validate.js` (C5-B rewritten: 24 paths + stove/cards + retry + pairwise) | 3405 ✔ |
| `test/act-3-flow.js` (new) | 102/102 ✔ — 6 orders; door prompt has 2 options, no staging; revision unreachable early in every order; report gated on P3A even with forced value; P3A created_from exact; impeto contested not refuted (3 contest pages, no "come tua"); withhold → staging; open; stove/cards skipped and found, conditional line exactly once; single writer of `east_route_confirmed` project-wide; oej door gate; no rendered design/result ids; save/reload after revision and after the cut; one `hawk_*` present per state; Truman window |
| `test/act-3-mirror-gate.js` (new) | 13/13 ✔ |
| `test/narrative-validate-m6/m8/m9.js`, `gen-m6-check` | ✔ (node-count pins only) |
| `test/interaction-voice.js` | PASS (85 classic, 63 narrative, 18 repeats) |
| `test/choice-prompts.js`, `choice-prompt-dedup.js` | ✔ (prompts ≤ 48 chars; pages no longer repeat their prompt) |
| `test/smoke.js` / `test/walkthrough.js` | 443 checks / 89 acquisitions, finale ✔ |
| `test/act-2-flow.js`, `act-2-ronette-required.js` | ✔ (Act 2 untouched) |
| `test/retro-production.js` (cache tag `v=17act3`) | 54/54 ✔ |
| `test/canonical-sync.js`, `portrait-evidence-parity.js` | ✔ after vault mirror (93/93) |
| Full `node test/*.js` sweep | 75 pass; remaining failures are the pre-existing set (`sprite-gates`, `pixel-gates`, `bosco/edifici-gates`, `greyscale`, browser-only `*-preview` / `double-r-*` / `verify-shot` / `visual-audit-capture`) — unchanged by this pass |

Not run: Coldstage (user hold); browser playthrough (step E).

## 10. Genuine blockers / decisions

- **P3A "presented + contested" as proposition state**: the runtime records presentations only through the M4 `presentation` widget (`NR.preparePresentation`), which requires the player to pick a proposition. The frozen design uses `pages_by_value` on the final theory. Adding a per-value proposition effect would be a new primitive, so the state is carried by `nodes_done.m5_report_intro` + `m5_final_theory` (documented in the node invariant and §3). Nothing downstream reads `P3A.presentations` today. Decision, not blocker.
- **Comparison completion**: no condition operator reads `comparisons[id].completed`; used `proposition_path P3A.formulation.status == formulated` (existing operator). Equivalent because P3A is formulated only by `ring_a`.
- **`audrey_salvata`**: no writer left after the classic cut and no reader; stays declared in the enums for save compatibility. To delete in the M6 stitch with `jacques_statement_terms_known` (plan C4).
- **Legacy traincar map** still hosts the scene until D3: interior object glyphs (`mucchio_terra`, `anello_interact`) render on the old rows; coordinates in the adapter follow the old 24×14 map and are re-keyed in D5 per the brief's table.

## 11. Traincar Golden Concept (D1)

`artifacts/traincar-v01/`: `intent.md`, `prompt.txt`, `traincar-concept.png` (Codex image tool, one reference: station exterior native golden; one iteration), `traincar-concept-1x-probe.png`, `README.md` with the art-direction review. Verdict: **accepted as Golden Concept**. It carries every gameplay-spatial requirement in one frame: bridge and county stake on the town side, rails ending under the car, roof-cut interior with door→mound→beam→ring on one axis, torn seat with cards, bent sheet, stove with the single ember, unbroken dust; foot tracks into the north cut beside the ONE EYED JACKS sign; Hawk on the bridge, Truman on the rails, nobody inside. Overcast flat light, no dusk grade, restrained palette. Concept-only elements (fifth sprite, gravel speckle, ten-tile car, two-row south tree line) are listed for dropping.

## 12. Native translation brief (D2)

`artifacts/traincar-v01/native-translation-brief.md`: 24×12 tile plan with legend; interactables table (faced-tile rule, scene_center one tile west of the door→ring column so the positional page is earned by standing in the empty middle); 14 definitions with cells/bounds (creek, worn bridge, stake, rails with buffer, car with 48 px north rim, mound, beam+ring hidden on `s1`, seat+cards, sheet, stove+ember, sign in native glyphs, diagonal tracks, post-report overlay on flags, tree faces); palette roles with hexes (station families reused for vegetation/steel/paper; new ballast, dead grass, creek slate, grey timber, rust, dust, ember); luma value-order gates for the native test; Hawk three states and Truman position; parity checklist; re-key list for D5.

---

Artifacts: `artifacts/traincar-v01/` (D1/D2), `artifacts/act-3-pass-01/traincar-legacy-hawk-states.png` (three in-game Hawk states on the legacy map), `test/act-3-flow.js`, `test/act-3-mirror-gate.js`. Cache tag `js/narrative-data.gen.js?v=17act3`. Next prompt per plan: **C (M6 stitch) + D3 (native traincar build)**.
