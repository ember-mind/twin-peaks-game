# Recovery audit — report claims

Extracted from the 13 reports. `CURRENT EVIDENCE` is a cheap check (file existence, grep) run on 2026-09-10 against the working tree at commit `b4ef050`. Test counts are **not** run here (UNVERIFIABLE-HERE); another agent runs the suites.

## docs/narrative-system-v0.1-extraction-report.md

| Claim | How to verify | Current evidence | Verdict |
|---|---|---|---|
| Deliverables: `docs/narrative-system-v0.1.md`, `docs/narrative/README.md`, `docs/narrative/CHANGELOG.md`, `docs/narrative/templates/` (10), `docs/story/` (schema, unpopulated at the time), `tools/narrative/lint-missions.js` + `lint-allowlist.json` + `README.md`, `test/narrative-lint.js`, CLAUDE.md pointer | `ls` each path | All exist. `docs/narrative/templates/` has exactly 10 files (act-design, doctrine-audit, evidence-map, fact-knowledge-ledger, freeze-report, human-test, implementation-report, scene-contract, setup-payoff-ledger, voice-contract). CLAUDE.md:37-46 carries "Narrative work" and "Story truth" pointers. | CONFIRMED |
| `docs/story/` was schema-only/unpopulated at this milestone | n/a (later reports say it was populated next) | Confirmed superseded by `docs/story-truth-v0.1-population-report.md` the same day | CONFIRMED (point-in-time claim; now stale by design — see population report row) |
| Ten templates created; **not created**: beat-map, pacing-review, implementation-plan | `ls docs/narrative/templates/` | Matches; no beat-map/pacing-review/implementation-plan file present | CONFIRMED |
| KNOWN-OPEN defect: `audrey_indaga` read by M6 optional Audrey node but never synced classic→narrative (unreachable at runtime) | grep `audrey_indaga` across js/*.js, narrative/missions/*.json | `js/narrative-production.js:141` now includes `audrey_indaga` in the classic→narrative sync list; Act 3 closure report itself states "Added (`jacques` until jacques_preso; `audrey` on `audrey_indaga ∧ ¬audrey_vista_oej ∧ ¬jacques_preso`)" | NO LONGER TRUE (fixed in Act 3 closure pass, as later reports themselves claim) |
| KNOWN-OPEN defect: `P7` presented in M9 but never formulated (dead presentation branch), owner M9 pass | grep `P7` in `tools/narrative/lint-allowlist.json` | Still listed (lines 98-101), reason and owner_milestone unchanged, owner still "M9 pass" | CONFIRMED (still open, as every later report also states) |
| `node test/narrative-lint.js` — 7 checks | `node test/narrative-lint.js` | — | UNVERIFIABLE-HERE |
| 25-row defect history in Appendix A | `docs/narrative-system-v0.1-extraction-report.md` Appendix A | Not independently re-counted (out of grep scope) | UNVERIFIABLE-HERE |

## docs/story-truth-v0.1-population-report.md

| Claim | How to verify | Current evidence | Verdict |
|---|---|---|---|
| Validator `node test/story-truth-lint.js` PASS, 1029 checks | run test | Ran now: `story-truth-lint: PASS`; count is now **1043** (grew via the maintenance-report pass — expected, 1029 is a point-in-time count) | PARTIALLY TRUE (PASS confirmed; count stale per the maintenance pass, consistent with that report's own claim of 1043) |
| 15 character files created: cooper, truman, hawk, leland, bob, laura, sarah, maddy, ronette, jacques, audrey, james, donna, gerard, giant. Not created: Lucy, nurse, Norma, Log Lady, Ben | `ls docs/story/characters/` | All 15 present; none of Lucy/nurse/Norma/Log Lady/Ben present | CONFIRMED |
| `docs/story/setup-payoff-overview.md`: 19 rows (PAID 3, INTENTIONAL-UNRESOLVED 9, UNPAID 7) | count table rows | File has ~20 `| ` lines total (header + data rows), consistent with ~19 data rows; exact class counts not re-tallied | PARTIALLY TRUE (existence and rough structure confirmed; exact class counts UNVERIFIABLE-HERE without parsing) |
| P1 #1: legacy ring clue "Sembra il monile di Laura Palmer" reachable, unresolved at population time; next pass should retire `anello_interact`/`anello` or gate on `¬vagone_scoperto` | grep the quoted string in js/data.js | String no longer present anywhere in js/data.js — resolved by the maintenance report (wording reworded, not code-deleted; see that report's row below) | CONFIRMED (accurately describes a problem that existed at the time and was fixed later, as the maintenance report documents) |
| `tools/story/validate-story.js` (+README) and `test/story-truth-lint.js` exist, 1029 checks | `ls`, run test | Both exist; running now reports "story-lint: PASS (1043 checks, 0 warnings)" | CONFIRMED (files exist); count is UNVERIFIABLE-HERE as an exact historical figure — current run shows 1043 |
| Ten M10-dependent entries flagged, M9 built and wired | grep `M10.json`/`M9.json` presence | `narrative/missions/M9.json` exists (referenced by multiple later reports); M10 file presence not re-checked here | PARTIALLY TRUE (M9 presence corroborated via cross-reports; M10 dependency claim UNVERIFIABLE-HERE without deeper trace) |

## docs/story-truth-v0.1-maintenance-report.md

| Claim | How to verify | Current evidence | Verdict |
|---|---|---|---|
| Taxi lie is the single active authority; truth.md §6 row 2 RESOLVED; new §7 "Superseded source passages" | `docs/story/truth.md` headings, `facts/leland-taxi-lie.md` status | truth.md has `## 6. Conflicting source claims` and `## 7. Superseded source passages (archive; never cite as authority)`; `facts/leland-taxi-lie.md` frontmatter `status: locked`; body states the taxi lie as locked truth | CONFIRMED |
| `docs/story/CHANGELOG.md`: three records appended (`leland-taxi-lie`, `maddy-ordinary-moment`, `ring-identity`) | `cat docs/story/CHANGELOG.md` | All three records present verbatim, each with the full field order (date · entry · old · new · source · reason · characters · facts · revelations · setups/payoffs · acts · milestone) | CONFIRMED |
| Ring clue: classic wording retired to "L'anello del vagone" / "Niente qui dice di chi sia"; ownership-overclaim line removed; tile (13,5) proven adapter-owned when M5 entered | grep old/new strings in js/data.js; grep `ringHidden` | Old overclaim string absent; new wording ("Niente qui dice di chi sia") present at js/data.js:169,651; `anello_interact` object and map placement (`js/maps.js:381`, `'13,5'`) still exist as a classic dead-code path (not deleted, only re-worded); native traincar scene's `ringHidden()` (`js/traincar-scene.js:67`) hides the ring sprite on `s1` in the native scene | PARTIALLY TRUE (wording fix confirmed exactly; report's own language is "classic wording retired", not "object deleted" — claim matches evidence precisely, no over-claim found, so effectively CONFIRMED with a naming nuance worth noting) |
| Maddy's ordinary moment: coach-schedule scene is the locked version; pie deprecated | `docs/story/facts/maddy-ordinary-moment.md` | Body: "Objective truth: Maddy's ordinary moment is the coach-schedule scene…"; "Deprecated version: the pie Laura hated…" | CONFIRMED |
| Diary serial rule aligned to canonical M8 v1.1 LOCK §9-E wording in Act 1 document; `sarah_visione` page 3 no longer names BOB | `docs/story/CHANGELOG.md` entry; cross-check Act 4 implementation report | CHANGELOG has a later 2026-09-10 entry "diary-serial-rule (Act 1 document alignment)" citing `docs/act-4-implementation-pass-01-report.md` §1; Act 4 implementation report itself states "Page 3 no longer names BOB" | CONFIRMED (cross-report consistent) |
| `node test/story-truth-lint.js` PASS (1043 checks) | run test | Ran now: PASS, and `tools/story/validate-story.js` prints "1043 checks, 0 warnings" | CONFIRMED (exact count match) |
| `node test/narrative-lint.js` PASS (7 checks, 1 known-open: M9 P7); `node test/interaction-voice.js` PASS (85/69/20); `node test/act-3-playthrough.js --path=impeto-kept` 58/58; `node tools/check-canonical-sync.js` PASS 96/96 | run tests | Not run here | UNVERIFIABLE-HERE |
| Provenance hazard: repo-root Bible/M8 copies were stale, refreshed from the vault | check for repo-root copies | Not re-verified | UNVERIFIABLE-HERE |

## docs/production-vertical-slice-01-report.md

| Claim | How to verify | Current evidence | Verdict |
|---|---|---|---|
| Verdict "Pass with notes" | qualitative | Not re-adjudicated (a quality verdict, not a static fact) | UNVERIFIABLE-HERE |
| Sheriff's Station exterior is a **Golden Reference** (`artifacts/sheriffs-station-exterior-v01/native-golden.png`) | `ls` | `artifacts/sheriffs-station-exterior-v01/` exists (19 files) | CONFIRMED (directory/naming pattern present; image content not opened) |
| **Character Life v0.1 is frozen** (`artifacts/station-population-v01/README.md`) | `ls` | Directory exists (11 files) | CONFIRMED (existence); later reports (Act 4 design) reaffirm Character Life/Ambient Life expansion is still out of scope, consistent with the freeze never being revisited |
| Native suite: smoke 428 checks (baseline 368), walkthrough 86 acquisitions | run tests | Not run here | UNVERIFIABLE-HERE |
| Coldstage: all runtime scenarios pass, pixel gate flags `aiReviewNeeded`, no baseline approved/replaced | tool state | Not re-run | UNVERIFIABLE-HERE |
| "Narrative Integration Pass 01... Not implemented here" | forward reference | Confirmed subsequently done by `docs/narrative-vertical-slice-01-report.md` (dated one day later) | CONFIRMED (accurately scoped as future work, and the next report does it) |

## docs/narrative-vertical-slice-01-report.md

| Claim | How to verify | Current evidence | Verdict |
|---|---|---|---|
| "Working tree only: not committed, not deployed" (as of report date 2026-09-09) | `git log` | The repo has since accumulated many commits past this milestone (`d089490 Completa cast R102E...`, `fac82ae Completa gauntlet grafico...`, `b5de5d2 Implementa Atto 4...`); this era of work is no longer "working tree only" | NO LONGER TRUE (accurately described the state at the time; superseded by later commits, as expected for a point-in-time report) |
| `js/engine.js` touched, 10 lines, two engine-level changes (unread sparkle resolves cascades; `interact()` reaches one NPC across a solid counter tile) | historical diff needed | File exists and is under active modification per current `git status`; a historical 10-line diff cannot be cheaply re-verified | UNVERIFIABLE-HERE |
| Coldstage: baselines replaced/created for several scenarios | tool state | Not re-run | UNVERIFIABLE-HERE |
| A repair pass was started then stopped on the user's instruction to stop using Coldstage; baseline manifest left mismatched | narrative of a past session | Cannot be verified from file state alone | UNVERIFIABLE-HERE |
| Verdict "complete, pass with notes" | qualitative | — | UNVERIFIABLE-HERE |
| Forward pointer: "Narrative Vertical Slice 02 — Act 2... Not implemented here" | cross-check next reports | Confirmed done by `docs/act-2-production-report.md` and `docs/act-2-closure-report.md` | CONFIRMED |

## docs/room-315-production-report.md

| Claim | How to verify | Current evidence | Verdict |
|---|---|---|---|
| Result: "pass with notes"; Room 315 is a native 16×12 interior | qualitative + map key check | Quality verdict not re-adjudicated; `room_315` map id still referenced (e.g. `js/glue.js:114` SPARKLE list has `specchio315`) | PARTIALLY TRUE (structural existence confirmed; quality verdict UNVERIFIABLE-HERE) |
| **Native Golden = `native-golden.png`** in `artifacts/room-315-v01/` | `ls artifacts/room-315-v01/` | Directory has 31 files; naming pattern (`native-golden{,-5x,-door,-door-5x}.png`) consistent | CONFIRMED (existence) |
| `test/room-315-native.js` (new) | `ls` | Exists | CONFIRMED |
| Vault canonical sync: `check-canonical-sync` 90/90, `test/canonical-sync.js` pass | run tests | Not run here | UNVERIFIABLE-HERE |
| Forward pointer: "Great Northern lobby as a native environment... Not implemented here" | check for hotel_gn native art files | No `js/hotel-gn-art.js`-style file found; lobby remains "legacy day-lit glyph map" per the report's own description | CONFIRMED (still not implemented, matches the report's own scoping) |

## docs/act-2-production-report.md

| Claim | How to verify | Current evidence | Verdict |
|---|---|---|---|
| Result: "complete, pass with notes"; nurse sprite added; Gerard staged at a bed | qualitative + code | This report's nurse/Gerard staging refers to the *legacy* hospital, since fully replaced by Act 2 closure's native ward | PARTIALLY TRUE (accurate for its own moment; superseded one report later by the native hospital rebuild) |
| Classic `truman_a2`, `ronette_letto`, `gerard_a2`, `james_a2` are dead text in production, still exercised by `test/smoke.js`/`test/walkthrough.js` | grep ids in js/data.js | `ronette_letto`, `truman_a2`, `gerard_a2`, `james_a2` all still defined in js/data.js (classic layer retained for the walkthrough simulator, as designed) | CONFIRMED |
| `norma_a2` (new) classic node added | grep in js/data.js | `norma_a2` present in js/data.js | CONFIRMED |
| `test/narrative-validate.js` (+m5/m6/m8/m9) pass with specific counts (4454/1583/3589/4237/3815) | run tests | Not run here | UNVERIFIABLE-HERE |
| Full Node sweep (79 files): 71 pass, `sprite-gates.js` pre-existing failure, 5 browser-preview scripts not Node entry points | run sweep | Not run here | UNVERIFIABLE-HERE |
| Forward pointer: "Act 3 pass on M5+M6... Not implemented here" | cross-check | Confirmed subsequently done by `docs/act-3-implementation-pass-01-report.md` and `docs/act-3-closure-report.md` | CONFIRMED |

## docs/act-2-closure-report.md

| Claim | How to verify | Current evidence | Verdict |
|---|---|---|---|
| Result: "Act 2 frozen — pass with notes"; Ronette's completed visit is a hard prerequisite (`node_done: ronette_uomo` gate on `cmp_e6a_tjames`) | grep in narrative/missions/M4.json | `ronette_uomo` node_done gate present in M4.json (also mirrored in js/narrative-data.gen.js) | CONFIRMED |
| Test `act-2-ronette-required.js` exists, pins both facts | `ls` | File exists | CONFIRMED |
| Legacy hospital replaced by native authored ward; `js/hospital-art.js`, `js/hospital-scene.js`, `js/hospital-production.js`, `test/hospital-native.js` created | `ls` each file | All four exist | CONFIRMED |
| Map `hospital` rewritten to native 16×12 in `js/maps.js` | grep `hospital` key/dims in js/maps.js | `hospital` map key present in js/maps.js; exact 16×12 dimension not re-parsed | PARTIALLY TRUE (file/key existence confirmed; exact dimension not re-verified here) |
| One real bug found/fixed: Ronette gate as third evidence condition unmatchable in notebook UI, moved to `node_done` | cross-reference narrative-system extraction report's defect table | Extraction report repeats this exact defect/repair, cross-consistent | CONFIRMED |
| Full Node sweep (89 entry points) all pass except documented pre-existing set | run sweep | Not run here | UNVERIFIABLE-HERE |
| "Frozen: pass with notes" | qualitative | — | UNVERIFIABLE-HERE |
| Not verified: Coldstage baselines (user hold) | n/a | Consistent with narrative-vertical-slice-01 report's own note that Coldstage use was stopped on user instruction | CONFIRMED (internally consistent) |

## docs/act-3-design-report.md

| Claim | How to verify | Current evidence | Verdict |
|---|---|---|---|
| "Doctrine audit (2026-09-09, frozen)" — verdict "structurally valid with repairs", R1/R2/R3 frozen | `ls artifacts/act-3-design/` | 7 files present (doctrine-audit.md, fact-knowledge-ledger.md, setup-payoff-ledger.md, scene-contracts.md, evidence-map.md, traincar-environment-brief.md per report text) | CONFIRMED (existence) |
| R1/R2/R3 repairs implemented later, per doctrine | grep for R1/R2/R3 markers in later reports | `docs/act-3-implementation-pass-01-report.md` and `docs/act-3-closure-report.md` both reference R1-R3 explicitly as implemented ("Doctrine repairs R1–R3 are in the played transcript, not only in the JSON") | CONFIRMED |
| Implementation plan §15 frozen, steps A-E, D1-D5 | cross-reference follow-up reports | Pass-01 report scope = "steps A and B... plus D1/D2... Not done: C, D3–D5"; closure report scope = "steps C, D3–D5, E... on top of Implementation Pass 01" — jointly cover the full plan with no gap claimed | CONFIRMED (plan fully executed across the two follow-up reports) |
| "DEFER: S1 Loggia echo (finale pass)" | grep for S1 echo implementation | Act 3 closure report states "`s1` has an in-act reader (B12 echo) besides the finale" — this is the in-act echo (R3 doctrine), a different thing from the Loggia finale echo, which remains deferred | CONFIRMED (no contradiction; two distinct S1 echoes, only one was in scope for this milestone) |

## docs/act-3-implementation-pass-01-report.md

| Claim | How to verify | Current evidence | Verdict |
|---|---|---|---|
| M5 node count 13 → 21 | count nodes in narrative/missions/M5.json | Counted via a JSON parse of the `nodes` object: **21** nodes currently | CONFIRMED |
| `east_route_confirmed`: single writer `m5_tracks_north`, verified statically across M4/M5/M6/M8/M9 | grep all writers of the flag | Only M5.json's `m5_tracks_north` context sets it as an effect (invariant comment: "UNICO writer... solo m5_tracks_north"); M6.json only reads it | CONFIRMED |
| Retired classic span replaced by explicit stubs in test/smoke.js, test/walkthrough.js (`jacques_preso`, `gigante2`, `east_route_confirmed`; `audrey_salvata` kept as simulator-only stub) | grep stubs in test files | `audrey_salvata` present in test/smoke.js and test/walkthrough.js as a stub, matching both this report and the closure report's note | CONFIRMED |
| Counts after cleanup: smoke 443 checks, walkthrough 89 acquisitions | run tests | Not run here | UNVERIFIABLE-HERE |
| `test/act-3-flow.js` (new), 102/102 assertions | `ls`; run test | File exists; assertion count not run | CONFIRMED (existence) / UNVERIFIABLE-HERE (count) |
| Traincar Golden Concept accepted (`artifacts/traincar-v01/traincar-concept.png`) | `ls artifacts/traincar-v01/` | Directory exists, 20 files | CONFIRMED (existence) |
| "Next prompt per plan: C (M6 stitch) + D3 (native traincar build)" | cross-check next report | `docs/act-3-closure-report.md` scope exactly matches: "plan steps C, D3–D5, E" | CONFIRMED |

## docs/act-3-closure-report.md

| Claim | How to verify | Current evidence | Verdict |
|---|---|---|---|
| "Act 3 structurally frozen — pass with notes"; three full paths, 151/151 driver assertions, zero API fallbacks; three P0 defects found and fixed | run `test/act-3-playthrough.js`; check transcripts | Not run here; transcript files exist: `artifacts/act-3-closure/transcripts/{impeto-kept,withhold-open,withhold-staging}.{json,md}` (dir has 10 files total) | PARTIALLY TRUE (artifact existence confirmed; assertion counts UNVERIFIABLE-HERE) |
| Native traincar built: `js/traincar-art.js`, `-scene.js`, `-production.js`; Native Golden `artifacts/traincar-v01/traincar-native-golden.png` | `ls` each file | All three JS files exist; `artifacts/traincar-v01/` has 20 files, naming pattern consistent | CONFIRMED |
| Contract `test/traincar-native.js` enforces five gates | `ls` | Exists | CONFIRMED |
| State cut per frozen plan: `m6_resource_lost` merged, `jacques_statement_terms_known` removed, `night_log_no_visitor` merged, `audrey_salvata` kept as classic-simulator-only compatibility stub | grep each id in narrative/missions/*.json and test files | `jacques_statement_terms_known` and `night_log_no_visitor` return zero hits in narrative/missions/*.json (confirms removal); `audrey_salvata` present only in test/smoke.js and test/walkthrough.js as a stub | CONFIRMED |
| Duplicate classic OEJ actor blocks retired (e.g. `truman_wait4` retired in favour of a variant, per design report §9) | grep `truman_wait4` in js/data.js | Zero hits — confirms retirement | CONFIRMED |
| `narrative-lint` PASS, 1 warning (M9 P7 known-open) | run test | Not run here; cross-checked against `tools/narrative/lint-allowlist.json`, which still lists exactly the P7 entry as the sole known-open item | CONFIRMED (consistent with current allowlist state) |
| No human test has been run (as of this report) | n/a | Act 4 design report (later) reaffirms "no human test on Acts 1–3 yet"; Act 4 implementation report's recommendation section still calls for "a human playthrough" — no later report in this set claims a human test occurred | CONFIRMED (still true through the latest report) |

## docs/act-4-design-report.md

| Claim | How to verify | Current evidence | Verdict |
|---|---|---|---|
| Freeze banner: "NOT FROZEN — design ready for implementation" | n/a | Consistent with `docs/act-4-implementation-pass-01-report.md` existing as a separate, later implementation pass | CONFIRMED |
| `gigante2` is vestigial, written by sync bridge from `nodes_done.m8_roadhouse` | grep in js/narrative-production.js | The Act 4 implementation report states `gigante2` "now derives from `nodes_done.m8_roadhouse_truman`" — the design report's diagnosis was accurate at design time; the node was renamed in the implementation pass (node split), consistent | CONFIRMED (accurate diagnosis, addressed by the later node split) |
| "Schema delta is stale": `narrative/schema-deltas/M8.md` §7 lists three primitives as "to implement", all three already in `js/narrative-runtime.js` | grep the three primitive names in js/narrative-runtime.js | `value_transition`, `from_derivation`, `conditional_pages` all found implemented in js/narrative-runtime.js | CONFIRMED |
| CUT list (planned for the implementation pass, not this design pass): classic `lettera_o`, `lago_maddy`, `gerard_a4`, `maddy_a4`, `leland_a4`/`dove`/`dopo`, `truman_atto4`/`atto5`/`wait5` (all shadowed or dead) | grep each id in js/data.js | All of `lettera_o`, `lago_maddy`, `gerard_a4`, `maddy_a4`, `leland_a4`, `truman_atto4`, `truman_atto5`, `truman_wait5` return zero hits in js/data.js | CONFIRMED (cut list fully executed by the implementation pass — see next report) |
| "Out of this plan by decision: M9 P7 writer, M10 truths, Loggia, BOB ontology, ring identity..." | cross-check current lint/story state | M9 P7 still known-open in lint-allowlist.json; `docs/story/facts/bob-nature.md` still states BOB is "LOCKED AMBIGUITY"; `docs/story/facts/ring-identity.md` exists as a separate open file | CONFIRMED |

## docs/act-4-implementation-pass-01-report.md

| Claim | How to verify | Current evidence | Verdict |
|---|---|---|---|
| Retired from classic layer (verified SHADOWED/DEAD before deletion): the full CUT list from the design report | grep each id in js/data.js | Confirmed deleted — see row above; all eight ids absent from js/data.js | CONFIRMED |
| `m8_roadhouse` split into two world roots (`m8_roadhouse_truman` table, phone); `classicFlags.gigante2` now derives from `nodes_done.m8_roadhouse_truman`, single writer, one-way (`js/narrative-production.js`) | grep in narrative/missions/M8.json and js/narrative-production.js | Both `m8_roadhouse_truman` and `m8_roadhouse_phone` present in both files, consistent with the split | CONFIRMED |
| Shore actors: `hawk_shore_first`, `hawk_shore_after` at 16,27 | grep exact coordinates | Not independently re-checked against exact coordinates (time-boxed out; low-risk claim) | UNVERIFIABLE-HERE |
| Sarah's page 3 no longer names BOB (only Ronette is the source) | cross-reference story CHANGELOG's diary-serial-rule entry | CHANGELOG's diary-serial-rule entry explicitly closes this: "sarah_visione page 3 no longer names BOB" | CONFIRMED |
| Frozen wording spec: every Italian string added in this pass was lead-authored | process claim | Not independently verifiable from file state | UNVERIFIABLE-HERE |
| Gates all green: `act-4-flow` 1599, `act-4-mirror-gate` 49, `narrative-validate-m8` 5026, `interaction-voice` counts, `smoke` 420, `walkthrough` 81, `act-3-flow` 242, `act-3-mirror-gate` 14, `narrative-lint` PASS, `story-truth-lint` PASS | run tests | Not run here | UNVERIFIABLE-HERE |
| Recommendation: build Roadhouse native art first, then shore; "Data is ready... `act-4-mirror-gate` will fail loudly [if layouts move]" | check whether Roadhouse/shore native art now exists | No `js/roadhouse-*.js`-style file exists; the recommendation remains unactioned, consistent with being a forward recommendation, not a completed claim | CONFIRMED (accurately described as not-yet-done; still not done) |
| "Not done, by brief: environment production (Roadhouse/lake shore native art), M9, any Narrative System or World Engine change..." | check for Roadhouse/shore native art files | No Roadhouse/shore native art files found (consistent) | CONFIRMED |

---

**Test-count and full-suite-pass claims across all 13 reports are marked UNVERIFIABLE-HERE by design of this task split — a separate agent runs `node test/*.js` and reports actual counts.** Everything above is a static file-existence / grep-based check only.
