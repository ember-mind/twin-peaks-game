# Act 3 baseline — forensic source audit

Read-only verification of claims in `docs/act-3-closure-report.md` and
`docs/act-3-implementation-pass-01-report.md` against source
(`narrative/missions/M5.json`, `M6.json`, `js/narrative-engine-adapter.js`,
`js/glue.js`, `js/data.js`, `js/maps.js`, `js/narrative-production.js`). No
tracked file was edited.

## M5

**1. Preliminary theory choice — degeneration / withheld only — VERIFIED**
`m5_theory_initial` (`narrative/missions/M5.json:406-450`) offers exactly two
choices: `theory_degeneration` ("Un incontro degenerato.") and
`theory_withhold` ("Non scrivo ancora."). Domain pinned at
`js/narrative-data.gen.js:6887-6890`: `m5_initial_theory_domain: ["degeneration","withheld"]`.
No staging/disposition option at the door.

**2. Ring↔dust comparison mandatory on path to act end — VERIFIED**
`milestone_theory_revision` and `milestone_theory_first`
(`M5.json:39-104`) both require `proposition_path P3A.formulation.status == formulated`
in their `pending_when`, and both `blocks.kind: node_prepare` on
`m5_report_intro`. `m5_report_intro` itself also directly conditions on
`proposition_path P3A.formulation.status == formulated` (`M5.json:1098-1109`).
`m5_s1` → `m5_tracks_north` (sole writer of `east_route_confirmed`, the M5
completion flag) both chain after the report, so the comparison node
(`m5_cmp_ring`, only writer of `P3A`) is unavoidable.

**3. Revision node requires premises — VERIFIED**
`m5_theory_revision` conditions (`M5.json:867-884`): `m5_initial_theory == degeneration`
∧ `node_done m5_mound` ∧ `node_done m5_scene` ∧ `P3A.formulation.status == formulated`.
`m5_theory_first` mirrors this for `withheld` (`M5.json:75-100`). Matches the
report's "mound + centre + comparison" claim (note: `m5_scene` is the "centre"
node per its beat label A4-A6).

**4. Truman contests, does not refute — VERIFIED**
`m5.b9.report.contest.p01-p03` (`M5.json:1129-1149`): Truman cites the dust
evidence Cooper himself recorded ("La polvere, Cooper. L'hai scritta tu:
intatta fino al bordo. Cosa la tiene al centro?"), Cooper admits he hasn't
answered it, Truman closes with "Allora a verbale vanno i fatti. La lettura
resta tua." No refutation language (no "posato"/"disposto" claim by Truman);
the node's own `invariant` field states this guard explicitly.

**5. `east_route_confirmed` — exactly one writer, at the north cut — VERIFIED**
Only `"set": "east_route_confirmed"` occurrence project-wide is in
`m5_tracks_north` (`M5.json:1399`, mirrored `js/narrative-data.gen.js:2689`).
All other `east_route_confirmed` occurrences are read-conditions (`M5.json:108,117,131,1225,1467`; `M6.json:11`; `js/maps.js:375`; `js/narrative-engine-adapter.js:197`;
`js/traincar-scene.js:79,83`) or invariant comments confirming single-writer
status (`M5.json:1321,1408,1450`). `js/data.js`/classic layer has no writer;
it only reads via the sync bridge (`js/narrative-production.js:157`: `if (state.flags.east_route_confirmed) classicFlags.east_route_confirmed = true;`).

**6. One Eyed Jacks gated by walked route — VERIFIED**
`js/maps.js:375`: `'21,0': { to: 'oej', ..., needsFlag: 'east_route_confirmed', blockedMsg: 'oej_bloccato' }`.
Mirrored in `js/traincar-location-data.js:14`. Since `east_route_confirmed` is
set only by the physical north-cut node (`m5_tracks_north`), the door is
gated on having walked that route, not merely on having a final theory or
having filed the report.

## M6

**7. Cards/stove consumption — VERIFIED (as evidence-conditioned callback, not inventory consumption)**
`m6.b4.tactic.cards_recall` (`M6.json:387-394`): `condition: { "evidence": "E_CARTE" }`,
text "(Il mazzo è tagliato squadrato, di piatto. Come le carte sotto il
sedile, nel vagone.)" — an action page, no deduction/proposition effect
attached, matching the closure report's "action page … no deduction stated."
The three-node cards↔testimony comparison (`M6.json:830,907,984`, all
`condition: {"evidence": "E_CARTE"}`) plays only if E_CARTE was acquired in
M5; no stove-equivalent recall node was found distinct from the cards one in
M6 (stove pays off via M5's own optional 4th page, per pass-01 report §3).
No literal item-removal mechanic exists in this engine — "consumption" here
means gated by prior evidence acquisition, consistent with report wording.

**8. Jacques mission ownership — VERIFIED, with a documented dual classic writer**
`jacques_preso`: single writer `m6_arrest` (`"set": "jacques_preso"`,
`M6.json:1217`, invariant at `M6.json:1226` states "unico writer di
jacques_preso"). `jacques_dead`: single mission writer `m6_news`
(`"set": "jacques_dead"`, `M6.json:1492`, invariant at `M6.json:1497`:
"la fine critica scrive SOLO jacques_dead + jacques_testimony_lost (+ P9)").
The classic layer has **two** paths to the mirrored flag `jacques_morto`: (a)
sync bridge `js/narrative-production.js:158`
(`if (state.flags.jacques_dead) classicFlags.jacques_morto = true;`), and (b)
classic dialogue `lucy_a3` (`js/data.js:662-671`, `setFlag: 'jacques_morto'`)
directly. This matches the pass-01 report's explicit correction: "jacques_a3
wrote jacques_preso, not jacques_morto; jacques_morto is written by the
classic lucy_a3 bridge (kept)... The mission jacques_dead → jacques_morto
sync also exists." Not a drift — documented as intentional.

**9. Hospital guard mandatory — VERIFIED**
`m6_hospital_guard` (`M6.json:1237-1249`), condition `flag: jacques_preso` ∧
`not flag: jacques_dead`. It gates `m6_return_night`
(`M6.json:1350-1353`, condition `node_done: m6_hospital_guard`), which in turn
gates `m6_news` (`M6.json:1426`, condition `node_done: m6_return_night`) —
the Lucy's-call/night-report chain. `m6_return_night_early`
(`M6.json:1300-1318`) is the in-fiction refusal before the guard visit is
done ("Prima l'ospedale, Cooper..."), mutually exclusive with
`m6_return_night` per its own `invariant`.

**10. Audrey reachability — VERIFIED**
`audrey_indaga` is written by the classic layer (per
`js/narrative-production.js:138-141` comment and sync list — not itself an M6
mission writer). `audrey_vista_oej`: single writer `m6_audrey`
(`M6.json:349`, `"set": "audrey_vista_oej"`; invariant at `M6.json:352`:
"unico writer di audrey_vista_oej; M6 completabile senza (nodo facoltativo)").
Entity window: `js/narrative-engine-adapter.js:189`
(`when: { all: [{flag:'audrey_indaga'},{not:{flag:'audrey_vista_oej'}},{not:{flag:'jacques_preso'}}] }`),
comment at line 181 notes `m6_audrey` is the sole writer of
`audrey_vista_oej`, closing the window once seen.

**11. Lucy theory echo — VERIFIED**
`m6.b8.news.cooper_impeto` (`M6.json:1516-1531`), a `pages_after_branch` page
with `condition: { value_is: { name: "m5_final_theory", equals: "degeneration" } }`,
text: "Avevo scritto impeto, Harry. Lo tengo a verbale. Ma un cuscino non è
un impeto: un cuscino aspetta." — fires only on the kept-impeto path, matching
"the pillow does it" from the closure report's theory-path table.

**12. S1 procedural echo — VERIFIED**
`m6_atto4_bridge` (`M6.json:1533+`) carries two exclusive conditional pages:
`m6.b9.atto4.s1_safe` (condition `value_is s1 == institutional`, text "L'anello
è in cassaforte. Lo cito nel rapporto.") and `m6.b9.atto4.s1_pocket`
(condition `value_is s1 == documented_custody`, text "L'anello ce l'hai tu,
con la mia firma sotto. Non lo cito."). Exactly the "register/S1 echo page"
claimed for B12.

**13. Giant Room 315 chain — VERIFIED**
`gigante1` has a single writer: classic `gigante1_dlg`
(`js/data.js:679-689`, `setFlag: 'gigante1'`) — no M6 mission node writes it.
`m6_atto4_bridge` conditions on `flag: jacques_dead` ∧ `flag: gigante1` ∧
`not flag: atto4` (`M6.json:1536-1547`) and its only effect is `"set": "atto4"`
(`M6.json:1615-1619`, invariant: "jacques_dead e gigante1 sono conoscenza
acquisita prima del rapporto; atto4 nasce solo dopo l'ultima pagina e apre M8
senza fallback legacy."). No `narrative_m8_owned` flag present anywhere in
M6.json — the checklist's "if present" clause does not apply.

## Visual / runtime

**14. Native traincar files — VERIFIED**
`js/traincar-art.js` (25,796 B), `traincar-location-data.js` (936 B),
`traincar-location-production.js` (267 B), `traincar-production.js` (574 B),
`traincar-scene.js` (7,347 B) all exist, all timestamped 2026-09-10, and all
five are wired into `index.html:584-588`. `js/maps.js:349` defines map id
`traincar` (24×12 native grid, comment: "geometria nativa 24x12", source of
truth cross-checked against `js/traincar-scene.js`). `artifacts/traincar-v01/`
holds `traincar-concept.png`, `traincar-native-golden.png` (4,139 B),
`traincar-native-golden-5x.png` (29,149 B), `native-notes.md`,
`native-translation-brief.md`, `same-world-sheet.png`, `hawk-states.png`,
`ingame-investigation.png`, `overlay-post-report.png`, plus `native-1x.png`/
`native-5x.png`/`native-first.png` and `footbridge-clearing-study.png`.

**15. WORLD_TARGETS / NARRATIVE_ENTITIES map ids + walkability — VERIFIED, with an expected caveat**
`WORLD_TARGETS.traincar` (`js/narrative-engine-adapter.js:69-84`) lists
`bridge_rail(4,6)`, `sign_oej(20,2)`, `mound(13,6)`, `ring(13,5)`,
`scene_center(12,5)`, `traincar_entrance(13,7)`, `stove(12,3)`, `cards(10,6)`,
`tracks_north(21,2)`. Checked against `js/maps.js:349-378` grid rows:
`mound`, `ring`, `scene_center`, `stove`, `cards`, `tracks_north` all land on
walkable tiles (`f` floor or `p` path). `bridge_rail(4,6)` lands on `w`
(creek, solid — legend "torrente solido"); `traincar_entrance(13,7)` lands on
`D` (door tile, solid); `sign_oej(20,2)` lands on `S` (sign, solid). These
three are `kind: 'landmark'`/`'sign'` targets, matching the `interact` map
(`js/maps.js:376-379`: `'4,6':'sign_ponte'`, `'20,2':'sign_oej'`) — by this
engine's convention, interact/landmark targets are the solid tile the player
faces from an adjacent walkable tile, not a tile walked onto, so this is
expected, not a defect.

**16. Hawk entity states — VERIFIED, no overlap**
Five Hawk `NARRATIVE_ENTITIES` entries total, all mutually exclusive:
- `hawk_bridge` (5,6, traincar) `when: node_done m5_bridge ∧ ¬vagone_scoperto` (`js/narrative-engine-adapter.js:210-214`)
- `hawk_door` (14,8, traincar) `when: vagone_scoperto ∧ ¬value_set(s1)` (`:215-219`)
- `hawk_cut` (22,3, traincar) `when: value_set(s1)` (`:220-224`)
- `hawk_shore_first` (16,27, town) `when: body_found_by==hawk ∧ ¬maddy_trovata` (`:308-311`)
- `hawk_shore_after` (16,27, town) `when: maddy_trovata ∧ ¬node_done(m8_station)` (`:313-316`)

The traincar trio is a strict progression (bridge→door→cut) gated on
mutually exclusive flag states; the shore pair (same coordinates, same map)
is also mutually exclusive on `maddy_trovata`. No two Hawk entities can be
simultaneously true. Note: the pass-01 report's text describes `hawk_door`
at "(12,7)" as a pre-D5-rekey coordinate; current source has it at (14,8) —
this is explicitly caveated in the pass-01 report itself ("coordinates in the
adapter follow the old 24×14 map and are re-keyed in D5"), not a drift.

## Retired classic Act 3 content — confirmed absent

Grepped `js/data.js` and `js/maps.js` for all six identifiers the closure/
pass-01 reports claim were retired: `hawk_vagone`, `jacques_a3`,
`audrey_oej`, `truman_wait4`, `gigante2_dlg`, `palco_dopo`. **Zero hits for
all six** — confirms full removal as claimed in pass-01 report §1/A2.

## Discrepancy list

None found. All 16 checklist items plus the retired-dialogue check verify
cleanly against source, with two items carrying a documented, non-drift
caveat (item 8's dual `jacques_morto` writer is explicitly called out by the
report itself as intentional; item 16's stale pre-rekey coordinate mention in
the pass-01 report is self-caveated in the same report).

Report written to `artifacts/recovery-audit/act3-forensics.md`.
