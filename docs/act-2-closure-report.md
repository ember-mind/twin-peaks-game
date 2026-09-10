# Act 2 — closure report (Ronette required · native hospital · freeze)

Date: 2026-09-09. Follows `docs/act-2-production-report.md` (NVS02, pass with notes). Working tree only: not committed, not deployed. Artifacts: `artifacts/hospital-v01/`. Coldstage not run (user hold).

**Result: Act 2 frozen — pass with notes.** Ronette's completed visit is now a hard prerequisite for the notebook comparison that closes the act, in either order, with the HUD naming the missing branch. The legacy hospital is replaced by a native authored ward (Native Golden, in-game verified with Ronette lying, nurse, Gerard). Full Act 2 played in the browser twice (Ronette-first, James-first) through the Act 3 hook. One real bug found and fixed during the playthrough (§9). Engine untouched.

## 1. Ronette progression change

Before: M4 completed through proposition P2 alone; `cmp_e6a_tjames` needed only James's two evidence atoms, so a player could reach `atto3` without hearing BOB. After: the comparison additionally requires `node_done: ronette_uomo`, the terminal node of Ronette's visit and the sole writer of evidence `T1_RONETTE_BOB`. That is the completed visit, not its start (`ronette_visita` is set on entry and would let a player leave mid-visit). No new state, no new framework: one condition added to one node, and the objective ladder re-partitioned so the HUD always names the missing branch.

Why `node_done` rather than a third `evidence` condition: the notebook UI compares **pairs**, and the runtime derives the pair to match from the node's evidence conditions. A third evidence condition made the pair unmatchable in the real notebook (§9). `node_done` gates the node without entering the pair. Test `act-2-ronette-required.js` now pins both facts: the pair is `none` before Ronette and `available` after.

Objective ladder (`sogno_raccontato ∧ ¬P2`, split by J = `node_done james_a2`, R = `evidence T1_RONETTE_BOB`):

| Rung | State | Text |
|---|---|---|
| 100 | before the report | Riferisci il sogno a Truman. |
| 200 | ¬J ∧ ¬R | Parla con Ronette all'ospedale e con James al Double R. (+ Facoltativo: la stanza 315; il vicino di stanza che recita versi.) |
| 210 | ¬J ∧ R | James, al Double R. Norma dice che non tocca il caffè. |
| 225 | J ∧ ¬R | Ronette, all'ospedale: ha dieci minuti. Poi il taccuino (T). |
| 250 | J ∧ R | Taccuino (T): accosta le due metà del cuore alla strada di James. |
| 300 | P2 formulated | Mostra a Truman il nesso che regge. |
| 400 | P2 accepted | Verifica la rotta di James: oltre il ponte, verso i binari. |

No dialogue was added to explain the gate: the comparison simply answers "nessun filo, per ora" until both witnesses have been heard, and the HUD says which one is missing in Cooper's terms.

## 2. Final Act 2 dependency graph

```
Room 315 wake (hotel_risveglio)
        │
        ▼
Truman: dream report (truman_a2 → sogno_raccontato)
        │
   ┌────┴─────────────────┐
   ▼                      ▼
Ronette visit          James (james_a2 →
(ronette_q → ronette_uomo   E6A_CUORE_INTERO,
 → T1_RONETTE_BOB)          T_JAMES_EST)
   │  [either order; guards before the report]
   └────┬─────────────────┘
        ▼
Notebook: cmp_e6a_tjames (pair E6A ↔ T_JAMES_EST, gated on node_done ronette_uomo) → b8_a → P2
        ▼
Truman: present P2 → accepted → atto3 (completion) → east road → M5 footbridge
```
Optional, unchanged: Ben, Audrey, Hawk, Norma, Gerard, nurse ctx, `cmp_t1_e5` (P4B, rejected), Room 315 inspects (desk reacts after BOB), hospital bed inspect (changes after BOB, Ronette's bed only).

## 3. Hospital concept summary

Intent: `artifacts/hospital-v01/intent.md`. Prompt: `prompt.txt`, two strict references (Sheriff's Station interior native for camera/wall height/player, Room 315 native for finish/scale). Codex produced two variants from one run; **variant B is the Golden Concept** (`hospital-concept.png`): all-cool palette (mint upper wall, ivory rail, blue-gray linoleum, chrome), no walnut. Variant A (`concept-a.png`) was rejected for its warm walnut wainscot, which reads as the station/hotel family. Composition accepted as authored: two beds on the north wall, Ronette lying under the sheet with the monitor and drip at her head (focal, brightest plane), Gerard's bed half-hidden by a privacy curtain, wall cabinet between the beds, clock and chair on the west wall, nurse's counter south-east between the door and the beds, centred double door with wired-glass panes, wide empty linoleum in between. Concept-only elements dropped for native: bed-foot perspective, Gerard's sitting pose (he stands beside his bed), the dark south wall band.

## 4. Hospital native implementation

Same pattern as Room 315 and the station: `js/hospital-art.js` (palette, integer rects, six prop definitions with cells/bounds/shadow/footY, `draw`, `foreground` with a door-frame band at foot 192), `js/hospital-scene.js` (authored-rows guard against `js/maps.js`, five scoped hooks incl. a `GAME.Sprites.drawChar` wrap that suppresses Ronette's standing sprite on this map only, `uninstall()`), `js/hospital-production.js` (installer). Script tags in `index.html` and `test/retro-scene.html` after the Room 315 block. Contract test `test/hospital-native.js`.

Map: `hospital` rewritten to native 16×12 (`js/maps.js`). Ronette bed (3-4, 3-5; actor tile 3,5), monitor stand (1-2,3), chair (1,6), curtain (8, 3-5), Gerard bed (9-10, 3-5; Gerard stands at 11,4 facing left), nurse counter (12-14, 8; nurse at 11,8; night register target 13,8), spawn 7,10 facing up, double door 7-8,11 → town 23,7.

Re-keyed call sites (about 30): adapter actor coords, Gerard in `js/glue.js`, environmental inspect (`hospital:T` wall line, twelve bed cells as COORD, state rule with the new optional `coords` scope so only Ronette's six cells change after BOB, plus `room_315:T` wall line closing the evergreen-forest gap), world catalog (`hospital` location, ward environment, no connections), interior prop footprints in `js/retro-authored.js` (five families, all physical on `T`), tests and nine HTML harnesses, `test/retro-scene.html?narrative=1` and `native-shot.js --narrative=1` so a production frame can include the two narrative actors.

Iteration: `hospital-native-first.png` → `native-polished.png` … `native-polished10.png` (ten rounds; curtain rebuilt column-by-column until it read as cloth, pillow rows added, chrome headboards, mint wall lowered six luma to open the curtain margin, chair reopened, drip bag tapered) → `hospital-native-golden.png` (= polished10 + Ronette's hair matched to the cast's HAIR.brown, captured with nurse and Ronette present).

Per-plane luma on the golden capture (gates in the test): Ronette sheets 237, Gerard sheets 213, curtain 170, mint wall 165, steel counter 140, floor 122. One green-trace cluster. No warm pixel outside Ronette's head and hand and the three cast sprites.

Ambient: **stillness chosen**, no effect added. The monitor trace is static; the room's only motion is the actors. Considered and rejected after seeing the frame: a two-frame trace blink would be the only moving pixel in the ward and would pull the eye off the bed.

## 5. Concept → native parity decisions

- Kept: cool triad (mint · ivory · blue-gray), chrome as 2–3 value greys, Ronette's bed brightest, curtain second, floor quietest, door centred with wired-glass panes, counter SE, clock over the chair, cabinet between the beds, open floor rows 6–10.
- Changed: curtain shifted east to overlap Gerard's west rail (the occlusion is what sells it as cloth); Gerard stands rather than sits (existing cast sprite, no pose work); bed feet drawn flat (no perspective); no dark south band (door frame carries the wall); nurse's counter is a low steel cart rather than a desk; Ronette's hair is the cast brown, not the concept's chestnut, so bed figure and walking sprite agree (the hires portrait is blonde — pre-existing portrait/cast mismatch, out of scope, logged in §11).
- Dropped: concept's fine linoleum grain, window-less already, no posters, no grime.

Same-world sheet `same-world-sheet.png` (station · Room 315 · Double R · hospital, 3× each): same 48 px wall face, same player scale, same contact-shadow grounding. The ward is the coldest and emptiest panel by design; nothing from the station's green or Room 315's walnut/teal leaks in.

## 6. Ronette / nurse / Gerard staging result

- Ronette lies in bed as part of the bed art; her NPC record stays at 3,5 and answers from the approach tile 3,6 (standing sprite suppressed by the scene hook). In-game: `hospital-ingame-ronette.png` (dialogue "BOB. BOB. BOB." with hires portrait and name label).
- Nurse (`infermiera`, 24 px authored, 25th cast slot) stands at 11,8 in front of the counter, facing down. Her guard, frame and closing lines all fire from 11,9.
- Gerard stands at 11,4 beside the second bed, facing the curtain; guard from 12,4. Depth: actors sort against prop `footY` (beds 96, chair 112, counter 144, door frame 192) — verified walking behind the curtain and in front of the counter.
- Texts re-grounded to the ward (§7).

## 7. Narrative changes

M4 data: `cmp_e6a_tjames` gains `{node_done: ronette_uomo}`; objective rungs 200/210/225/250 (§1). Four lines re-grounded to the new room, no meaning change: Ronette's frame "guarda la porta, non il soffitto" (was "la finestra": the ward has none); Gerard guard "(Gerard è in piedi accanto al letto, girato verso la tenda. La manica sinistra è vuota.)" and Cooper "Guarda la tenda, non me. Non è lui che devo sentire per primo." (he stands, he does not sleep); Gerard open "girato verso la tenda". Environmental bed line "Due letti uguali in corsia…" (was six beds). New Room 315 wall line. No new nodes, no new choices, dialogue text otherwise as frozen in NVS02.

## 8. Engine changes

None. `js/engine.js`, `js/retro.js`, `js/sprites.js` untouched by this pass. All hospital behaviour lives in the three scene scripts and data.

## 9. Validation

| Check | Result |
|---|---|
| `act-2-ronette-required.js` (new) | 40/40: James-first, Ronette-first, skip-Ronette hard block (`NOT_YET_FORMULATED`, `atto3` never set), wrong answers b8_b/b8_c retryable, save/reload mid-branch, exactly one true objective at every sampled state, notebook pair `none`→`available` |
| `act-2-flow.js` | 48/48 |
| `narrative-validate.js` | 4474 checks |
| `interaction-voice.js` | classic 92/92, narrative 56/56, repeat 14/14 |
| `environmental-interactions.js` | 98 checks (bed cells, Gerard-bed non-leak, Room 315 wall) |
| `hospital-native.js` (new) | pass: hooks, sprite suppression, geometry parity, collision/approach tiles, keyboard routes, depth intervals, value order, single trace, skin-only warmth |
| `interior-prop-semantics.js` | 24/24 families |
| `smoke.js` / `walkthrough.js` | 460 checks / 96 acquisitions, finale reached (no drop) |
| `probe-act2-pacing.js` | required path 356 s at 12 cps, 309 s at 15 cps (unchanged from NVS02) |
| Full Node sweep (89 entry points) | all pass (vault re-synced: `canonical-sync.js` 93/93, `portrait-evidence-parity.js` 11/11) except: `sprite-gates.js` (pre-existing, documented in NVS02), five browser-only scripts (`*-preview.js`, `double-r-*`; `window is not defined`, pre-existing), four CLI tools that need arguments (`bosco-gates`, `edifici-gates`, `greyscale`, `pixel-gates`) |
| Browser playthrough A (Ronette-first) | wake → three guards (Ronette, Gerard, nurse) → Truman → Ronette (q_luogo, q_uomo) → HUD 210 → **reload from save** → HUD 210 held → James → HUD 250 → notebook pair → wrong answer (b8_b) rejected, retry → b8_a → P2 → Truman accepts → `atto3` true, M5 active, Cooper's east-road line |
| Browser playthrough B (James-first) | Truman → James → HUD 225 → notebook pair "nessun filo" (blocked) → Ronette (q_uomo) → HUD 250 → pair → P2 → HUD 300 |

**Bug found and fixed in playthrough A:** with the Ronette gate expressed as a third `evidence` condition, the notebook's two-item compare could never match `cmp_e6a_tjames` ("nessun filo" even after Ronette): `NR.notebookPairStatus` compares the sorted evidence list of the node against the chosen pair. The unit tests had been adjusted to a 3-tuple and passed; the real UI cannot select three. Gate moved to `node_done: ronette_uomo`; tests restored to the pair and extended to pin `notebookPairStatus`.

Not verified: Coldstage baselines (user hold). Mobile/touch on the new map (out of scope; `mobile-production.js` passes).

## 10. Final Act 2 verdict

**Frozen: pass with notes.** The act has one required spine (wake → Truman → Ronette + James → notebook → Truman → east road), every branch order reaches the same hook, and the act cannot be completed without hearing BOB. The hospital is now the fourth native room in the same world. Notes are cosmetic (§11) and none blocks Act 3.

## 11. Remaining known debt

- Ronette's hires portrait is blonde; cast sprite and bed figure are brown (cast frozen at 24 px; portrait pipeline separate). Pick one when portraits are next touched.
- Nurse repeat after the closed visit is an INFERMIERA line ("Quando si stanca, ricomincia dal soffitto. Per oggi basta."), by design the room's closing voice; the voice test's Cooper-only rule applies to world repeats and is green, but the exception is worth a line in the voice contract.
- Ronette's `q_laura` option disappears once `q_luogo` has been asked (visit budget rule from NVS02). Intended, undocumented in the player-facing text.
- `↔` in the comparison page renders as `?` in the classic pixel font (retro font lacks the glyph). Cosmetic; replace with "·" or extend the font.
- Hospital `night_register` (13,8) target is dormant in Act 2 (its M5+ node) and the counter cells answer with the generic ward wall line; a counter-specific inspect line would be one COORD entry.
- Pre-existing failures untouched: `sprite-gates.js` (16 px archive vs 24 px cast), browser-only preview scripts run as Node.
- Coldstage baselines not refreshed (hold).

## 12. Recommended Act 3 preparation

1. Read M5 as it stands (`narrative/missions/M5.json`: footbridge, traincar, mound/ring/scene observation groups, theory choices, Truman report, OEJ sign) and run the same audit as NVS02 §1 before touching text.
2. The traincar/footbridge exterior is the next environment; it is the first outdoor native scene, so settle the outdoor camera/tree-line rules (spawn row ≤ 23, varco) before concept work.
3. Reuse the closure pattern: gate on `node_done` of terminal nodes, never on visit-start flags; keep comparison nodes to two evidence conditions.
4. Hawk is already "al ponte" in Truman's line: he needs a placed sprite and a guard on the M5 map at entry.
5. Keep the hospital dormant but reachable in Act 3 (Ronette repeat and bed inspect already hold), do not add a visit.

## Artifacts

`artifacts/hospital-v01/`: `intent.md`, `prompt.txt`, `ref-station.png`, `ref-315.png`, `concept-a.png`, `concept-b.png`, **`hospital-concept.png`**, `native-translation-brief.md`, **`hospital-native-first.png`** (+`-5x`), `native-polished.png` … `native-polished10.png` (+`-5x`), **`hospital-native-golden.png`**, **`hospital-native-golden-5x.png`**, **`hospital-ingame-ronette.png`**, **`same-world-sheet.png`** (+`-small`), `codex-run.log`.
