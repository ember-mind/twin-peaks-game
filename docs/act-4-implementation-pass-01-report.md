# Act 4 — Implementation pass 01: topology cleanup + M8 staging + real-build playthrough

Date: 2026-09-10. Scope: plan steps A (classic topology cleanup + Sarah rewrite + diary alignment), B1–B7 (M8 data: Roadhouse split, Leland waiting, Lucy, station hook, threshold, lake-focus page), C1–C5 (entities and staging), E (validation, real production playthrough, transcripts, captures, probes) of `docs/act-4-design-report.md` §14. Not done, by brief: environment production (Roadhouse / lake shore native art), M9, any Narrative System or World Engine change, night render grade, BOB/ring resolution. Sources honoured: design report §14, `artifacts/act-4-design/{doctrine-audit (R1–R3, O-list), scene-contracts, voice-contracts, route-trace, evidence-map, environment-requirements}.md`, Story Truth v0.1, Narrative Craft Bible. Frozen wording spec (lead-authored): every Italian string added in this pass was written by the lead; cheap agents wired, tested and drove the browser.

State: working tree, uncommitted; vault mirrored (see `CANONICAL-SYNC.md`). Coldstage not run (user hold).

Artifacts: `artifacts/act-4-implementation/` — `transcripts/{A,B,C,D}.{md,json}` (real-build transcripts), `transcripts/assertions.json` (425 driver assertions), `destructive-probes.md`, captures `diner-maddy-leland.png`, `roadhouse-populated.png`, `roadhouse-giant-stage.png`, `roadhouse-phone-widget.png`, `threshold-widget-47-30.png`, `route-arrival-{A,B,C,D}.png`, `shore-before-discovery.png`, `shore-after-discovery.png`, `station-hook.png`; `run-1/` (first run, archived). Pacing: `artifacts/act-4-design/pacing-current.md` regenerated.

## 1. Topology cleanup (Part A)

Retired from the classic layer (all verified SHADOWED/DEAD in `artifacts/act-4-design/topology.md` before deletion; none was reachable in the production build once `narrative_m8_owned` is set):

| id | kind | why |
|---|---|---|
| `truman_atto4`, `truman_atto5`, `truman_wait5` | dialogue + Truman cascade lines (`js/glue.js`) | shadowed by `m8_roadhouse_*` / `m8_station`; contained the letter arithmetic the doctrine forbids |
| `lago_maddy` + cascade branch `gigante2 → lago_maddy` | dialogue + `lago_riva` branch | shadowed by `m8_discovery`; `lago_dopo`/`lago_sguardo`/`lago_laura` kept |
| `lettera_o` | clue/item (`D.clues`) | never given in production (`E9A_LETTERA_O` is the atom) |
| `maddy_a4`, `leland_a4`, `leland_dove`, `leland_dopo` | dialogues + Palmer-house NPC entries for Maddy and Leland | duplicate bodies on the Palmer map contradicting the diner afternoon |
| `gerard_a4` | dialogue + cascade | "casa di legno / vent'anni" contradicts `facts/bob-guest-since-childhood`; NPC vending |

Classic conditions added (`js/glue.js`): Palmer `sarah`, town `bobby`, `donna`, and (after the playthrough captures) `jacoby` → `cond: ['!flag:gigante2']`. Sarah page 3 (`sarah_visione`) rewritten to the nameless line («Ha un nome, so che ce l'ha. Mi arriva fino ai denti e poi—»). Diary clue and document page (`js/data.js` `diario`) aligned to the canonical rule wording (M8 lock §9-E), the page split in two for the 8-line bitmap limit; the old "lascerà il suo nome" wording no longer appears anywhere in `js/data.js`. Tests updated: `test/walkthrough.js` stubs `narrative_m8_owned` and the shipped Act 4→5 path (89 → 81 acquisitions, the 8 removed were shadow acquisitions), `test/smoke.js` 443 → 420, `test/interaction-voice.js` classic 85 → 74.

## 2. Final M8 topology (16 nodes)

`m8_diner` · `m8_leland_waiting` (new) · `m8_roadhouse_truman` (split) · `m8_giant_stage` (new) · `m8_roadhouse_phone` (split) · `m8_leland_taxi` · `m8_lucy` (new) · `m8_focus_choice` · three routes · `m8_discovery` · `m8_echo` · `m8_cmp_letters` · `m8_cmp_diary` · `m8_station`. 89 pages. No new value, evidence, proposition or runtime primitive; `effect_policy: "always"` (pre-existing generic field) used for the first time with a non-"once" value on `m8_lucy`. Objective chain 50→100→150→200→250→300→350→400, partition verified (exactly one objective true per reachable state). `node_count.runtime_total` 12 → 16. Details: `narrative/schema-deltas/M8.md` §10.

## 3. Roadhouse split

`m8_roadhouse` became two world roots on the same map with no `next`: the table (actor Truman at 4,8: pages p01–p05 verbatim, writes `presagio_status=active` + notebook note) and the phone (object at 8,5: the two phone pages + three warning choices). The player walks from the table to the phone. `classicFlags.gigante2` now derives from `nodes_done.m8_roadhouse_truman` (`js/narrative-production.js`, single writer, one-way). Both silent-by-design nodes (Truman table, Giant) carry an explicit exemption in `test/interaction-voice.js`.

## 4. Staging (entities, `js/narrative-engine-adapter.js`)

- **Diner**: `leland` at 11,1 beside Maddy while `atto4 ∧ ¬T_LELAND_TAXI` — visible from the first frame (R1).
- **Roadhouse**: `truman` 4,8 facing the room; crowd `bobby` 3,4 · `donna` 5,4 · `james` 2,4 · `shelly` 3,6 · `norma` 5,6 · `loglady` 2,6 (presence only, `dialogue: null`, while `atto4 ∧ ¬warning_target`); `gigante` (sprite `giant`) at 8,1 on the stage, facing down, while `presagio_status=active ∧ ¬warning_target`. The crowd was first placed on row 2 and blocked the stage corridor (RUN 1 defect); moved to the west tables, BFS-verified that 8,2 / 8,4 / 8,6 stay reachable.
- **Shore**: `hawk_shore_first` and `hawk_shore_after` at 16,27 (two windows: `body_found_by=hawk ∧ ¬maddy_trovata`; `maddy_trovata ∧ ¬node_done m8_station`).
- **Town**: wanderers hidden by the classic cond (they are at the Roadhouse); `town_crossroads` 30,30 → 47,30.

## 5. Maddy / Leland afternoon

Transcript A: Maddy's pages are specific (the 7:40, Spokane, the library switchboard held until Monday, "un giorno in più per zia Sarah") and never a clue; Leland is administrative (the bill under his hand, the taxi "per le sette, da casa"); interacting with Leland before the promise yields the observation page instead of the meta refusal. Payoff ablation (`destructive-probes.md` §2): removing `m8_diner` leaves 17 readers of `promise_stance` unfed and empties the lake monologue and the M9 echo — the beat is load-bearing.

## 6. Sarah (optional, afternoon)

Transcript B: Sarah played between the diner and the Roadhouse; her window closes when `gigante2` is set. Page 3 no longer names BOB (Ronette stays the only source, `test/ronette-bob-provenance.js`). Cooper's two lines are unchanged.

## 7. The warning

Phone widget on the real build (`roadhouse-phone-widget.png`): three choices, palmer / centrale / nessuno, each with its feedback page; `warning_target`, `maddy_action_after_warning`, `sarah_support_state` written as designed. Objective 150 «Il telefono del Roadhouse.» fills the former gap between the table and the phone. The Giant is on the stage with one caption and never a direction (A: `m8.b.giant.p01`, repeat identical).

## 8. Focus / threshold

The crossroads fires at 47,30, one step from the Roadhouse return spawn; the widget row in every transcript shows 47,29 facing 47,30 (`threshold-widget-47-30.png`). Repeat page after the commit. Driver observation "Cooper moved one tile before the key" is the walk onto the target tile, not a defect.

## 9. Shore causal chain

Routes write `body_found_by`; the discovery renders the matching version (Cooper first in A/C/D lake-focus, Hawk first elsewhere); `letter_o_observation_source` derives from it. Route causality chains checked writer → reader (`destructive-probes.md` §3): no dead writer, no orphan reader in M8.

## 10. Station hook

Every transcript ends on the two hook pages (Cooper reads the taxi hour aloud; Truman: "Prima delle sette, Lucy chiama la compagnia: una corsa prenotata, o niente."). Nobody says "lie"; nobody counts letters. `m8.f.station.p_lago` fires only on the lake focus (D) before `p_valigia`. After `m8_station` the HUD shows M9's first objective «Chiedi a Lucy se il taxi di Leland era prenotato.» — consistent handoff.

## 11. Objectives and state

Objectives 100/150/200 gated as in §2. `gigante2` never appears in a narrative `when` (one-way sync). `maddy_trovata`, `gigante2`, `narrative_m8_owned` synced to classic. `letter_o_chain`, `maddy_action_after_warning` stay allowlisted dangling (epilogue readers).

## 12. Playthrough findings (real production build)

Driver `test/act-4-playthrough.js` + `test/act-4-playthrough-probe.html` (plain `index.html`, Chrome headless), four paths: A accompagno/palmer/palmer + Lucy; B autonomia/centrale/lago + Log Lady + Sarah; C prudenza/nessuno/diner; D accompagno/palmer/lago.

| run | assertions | fallbacks | console | outcome |
|---|---|---|---|---|
| RUN 1 | 408/425 | 0 | favicon 404 | Giant unreachable (crowd on row 2); threshold assertion measured after the widget; interim text rows |
| RUN 2 | 425/425 | 0 | favicon 404 only | clean |

Captures reviewed by the lead: diner (Maddy + Leland at the counter end; stool placement is polish), Roadhouse populated / Giant / phone widget, threshold, four route arrivals, shore before/after, station hook. One staging defect found only in the captures: classic Jacoby stood at 16,25, two tiles from Hawk, inside the shore frame — fixed with the same `!flag:gigante2` cond as Bobby/Donna, pinned in the mirror gate (49/49).

## 13. Pacing (re-measured)

| metric | value |
|---|---|
| canonical mandatory path @12 cps | 463 s (~7.72 min), 50 pages, 562 tiles |
| 27 mandatory variants | 6.74–7.89 min |
| with every optional beat | ~8.49 min |
| time to first choice | 87 s |
| longest passive stretch | 69 s (Roadhouse table) |
| longest walk | 30 s |

Within the design band (design report §10: 7–9 min). Not lengthened for duration.

## 14. Validation and probes

Gates, all green: `act-4-flow` 1599 · `act-4-mirror-gate` 49 · `narrative-validate-m8` 5026 (89 pages, 16 nodes) · `interaction-voice` classici 74 / narrative 77 / repeat 24 · `smoke` 420 · `walkthrough` 81 · `act-3-flow` 242 · `act-3-mirror-gate` 14 · `narrative-lint` PASS (1 known-open: M9 P7) · `story-truth-lint` PASS. Destructive probes (`artifacts/act-4-implementation/destructive-probes.md`): world substitution (deleting the Roadhouse entities stalls the act: the statement targets Truman), payoff ablation, route causality, speaker swap (Maddy vs generic by numbers and institutions; Truman dispatches vs Cooper measures; Sarah vs oracle by naming and pointing — Lucy's replies were re-worded once when the swap showed Cooper borrowing Truman's dispatch register), author-thesis (no page carries the staging in the text). Narrative system check: M9 P7 stays M9-owned; no M8 page evaluates the night or names a saver.

## 15. Visual feasibility verdict

**YES WITH NATIVE POLISH.** The act plays end to end on the legacy Roadhouse and the town shore; nothing is asserted by a page that the screen contradicts. What the captures show as thin: the Roadhouse reads as half-full (six figures on the west tables, the east empty, no band on the stage); the shore has no perimeter, no covered shape, no torches — the captions carry all three; the diner stools. These are the class-C briefs in `artifacts/act-4-design/environment-requirements.md`, unchanged by this pass.

## 16. Known debt

- Sarah, Bobby, Donna, Jacoby hidden for the rest of the game once `gigante2` is set (classic conds have no OR); to be re-opened when M9/M10 need them.
- Classic Truman (sheriff 10,4) and Hawk (sheriff 12,8) stay on the station map during the Roadhouse/night window — duplicate bodies while Truman is at the Roadhouse and Hawk "di pattuglia"/on the shore. Not fixed: both ids are narrative targets for earlier and later missions and cannot be split without an OR cond.
- Night render grade deferred (`js/town-dusk.js` memoises on colour only).
- The three `test/m8-*-harness.html` files were hand-updated, not browser-run; the real-build driver supersedes them.
- M9 P7 (narrative-lint known-open); diner stool placement; test-server favicon 404 (harness noise).
- Roadhouse and shore native environments (class C) not started.

## 17. Recommendation for Environment Pass D

Build the Roadhouse first (the act's major beat and the game's thinnest room): stage with a band, tables on both sides, Truman's table by the door, phone visible from it; then the shore as a state of the town tile cluster (perimeter, covered low shape, one torch source), parity workflow as `artifacts/traincar-v01/native-notes.md`. Data is ready: entity tiles, windows and targets need only re-pointing if the layouts move (`act-4-mirror-gate` will fail loudly). Freeze the act after a human playthrough of paths A and B on the new rooms.
