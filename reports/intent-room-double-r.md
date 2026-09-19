# Double R — second Intent-Driven Environment experiment

> Visual implementation note: this Program experiment remains architecture history. Current room-scale art and vitality result lives in [intent-room-double-r-vitality.md](intent-room-double-r-vitality.md); older booth-only verdicts below are superseded, not current art approval.

## Research frame

Question: can the existing `environment.program` and unchanged Room Critic describe and improve a socially dense diner without importing the Sheriff's Station visual recipe? This branch starts at the completed Sheriff pilot `cfdc0c7`, whose parent is current `main` `e581124`. Generic Program code is frozen during the first Double R pass. All observations below use actual production-native game captures, not concept art.

## Phase 0 — Sheriff lessons, separated

Reusable method: state room intent and visual goals before changing art; reason in groups and contributions rather than functional necessity alone; classify ordinary ambient residue without inventing narrative events; compare claims against the player's real frame; change one visual cause, recapture, and keep or revert on evidence. Sheriff's empty-floor experiment failed even though the theory of negative space sounded right; visual review corrected it.

Sheriff-specific outcome, **not** a Double R rule: quiet central floor, edge-loaded work density, one warm desk focal point, a directional runner, and oak-versus-institutional-steel contrast. Diner seating rhythm and service circulation may demand opposite choices.

## Phase 1–2 — Double R as observed, before Program authoring

Normal front-door arrival from `double_r_exterior_prototype` spawns at diner tile `(6,8)` facing up. The fixed [before frame](../artifacts/intent-room-double-r/before-native.png) is native 256×192 with baseline narrative population. [Unpopulated frame](../artifacts/intent-room-double-r/before-unpopulated-native.png) isolates architectural masses. The 14×10 map sits within the 256×192 camera; no composed camera crop hides the entrance or rear service wall.

First notice: the long pale counter, red fascia, glass pie case and branded upper wall form a strong service band. Second: red booth pairs flank both sides of the checker floor. Third: named people and two authored seated diners make that rhythm social rather than merely geometric. Warm pendant and wall lamps, wood panels, cups, menus, pie, crockery and staff equipment make this unmistakably a diner. Floor plant and specials board form a central island rather than an empty police-station-style aisle.

Observed eye flow is **branching**: entrance → center island / checker floor → counter service **or** left/right booth conversations → rear sign and menu. Counter supplies orientation; booth repetition supplies social scale. Large masses remain coherent without cups, faces or single-pixel highlights: rear service wall, counter, red booth modules, checker floor, and small center island. Dense upper service band is intentional; the floor offers circulation but is not wholly quiet. Potential tension: checker contrast and central island compete with small moving characters, while the red booth modules risk looking mirrored if authored table states and people are ignored. Neither is a proven defect yet.

The existing two occupied booths, two differently used empty tables, cups/menus/plates, counter equipment, working lights and staff gestures already provide ordinary activity traces. They are not evidence of a particular plot event. No new clutter is justified by this first observation.

Canonical ownership map: `js/maps.js` provides the diner tuple model; generated `map.rows` provide collision and door glyphs; `js/retro-authored.js` paints the native room from that model. `world/connections.json` owns front-door links and spawns, installed later by `js/world-connections-production.js`. `narrative/cast/windows.json` and Cast Presence own named NPC placement; the tuple model's two generic booth guests are authored visual life, not named-cast claims. Narrative Runtime owns story state. `js/ambient-life-scenes.js` and `js/character-activity.js` own steam, lamps, reflections, sipping and staff motion. Diner has no separate scene-object, prop, or narrative-target records. `environment.program` in the World Catalog refers to these facts; it owns no geometry, actors, doors, animation, or event state. The 256×192 camera and player frame remain Engine-owned.

## Frozen-framework diagnosis before code changes

`visualGoals` can describe several linked social pulls in plain language. One `groups` record can name the four booth modules without creating runtime Zone entities. `composition` plus a concrete reason can justify rhythm and asymmetry; no new contribution enum is needed. `NEAR` can express counter-to-stool adjacency; `REACHABLE` can express entry-to-service approach without pretending to verify facing or sightline. Ambient residue can describe existing cups, menus, cleared plate and staff traces; no new story state is needed. Thus the Program shape and Room Critic can be tested unchanged.

First real gap is **TOOLING**, not yet a data-model failure: the diner is authored as tuple-based `map.interior` plus generated collision rows and renderer helpers, but has no named `map.layout` anchors. Current Program correctly rejects anchor claims without such a layout. We can derive a *read-only, diner-local view* of named footprints/targets from the existing `map.interior` and rows at location install, verify glyphs, and expose it through the same `map.layout` boundary used by Sheriff. It will own no second coordinates or collision. If this fails in practice, record failure rather than loosening World Engine validation.

**Interim decision: YES, proceed using existing system.** No generic schema, relationship kind, critic concept, or registry change is required for a meaningful first Double R Program and visual trial. This diagnosis precedes any generic architecture modification.

## Proposed Double R Program, before visual changes

Intent: a public working diner where food service and conversation coexist; player should read comfort, everyday occupancy and several possible social destinations at once. Tone: warm and familiar, busy enough to feel used, composed rather than cluttered. This describes current game content, not a new plot fact.

Visual goals: (1) counter and pie case remain clear orientation landmarks without suppressing booth life; (2) four booth modules form a coherent red rhythm, with table state and occupancy providing controlled variation; (3) warm local practicals link service and seating, while checker floor remains recognizable without outranking people; (4) central plant/specials island breaks the grid and keeps two circulation branches legible. These are falsifiable against the native frame; they are not yet claims of success.

Normal activities: ordering, serving, eating, conversation, staff work, and moving between counter and booths. They do not determine named Cast Presence. Intended groups: `service-counter` (dense horizontal service band), `booth-seating` (repeated social modules), and `center-island` (small visual/circulation hinge). Important contributions: counter for service/orientation; booth repetition for diner identity/social scale; plant for organic silhouette break; specials board for service information and island reading. Ambient residue: cups, menus, crockery/food, one cleared table, seated generic patrons and staff gestures already present. No narrative residue is authored.

The authored [Double R Program](../js/world-catalog.js) uses exactly the existing Sheriff Program fields. Diner-local install exposes named footprints computed from `map.interior` tuples and verified against the already-generated map glyphs; no coordinates are entered into Program. Registration fails on unknown anchor IDs, and [targeted test](../test/diner-program.js) verifies both routes around the island, all refs, immutable registered metadata, and unchanged map rows/model. Initial checks: diner Program, World Engine catalog, Builder data (123/123), diner layout, location traversal and smoke (415 checks) all pass. Generic World Engine and Builder rendering code remain unmodified.

[Program-only native capture](../artifacts/intent-room-double-r/program-only-native.png) uses the same entrance and state. It is evidence that authoring metadata alone is not a visual pass; actual art experiments begin only after this baseline. Baseline frame SHA-256 `05f69db06fa0f6547756d9f270685bfb9a3592c29a66ec2b2bf0cf486fdbf419`; unpopulated frame `5bd5a70d01da7e5fc87911f3a750d3f723b4baacaa5711e3a86b56c24a5316d0`.

Independent hostile architecture review found no second Cast Presence or Narrative Runtime owner, but identified three concrete risks. Response: deeply freeze the derived layout view (not only its map property); read booth backrests from canonical row glyphs rather than repeating the generator's side rule; and add `test/diner-program.js` to the Node 24 release workflow so anchor/collision/route integrity is gated. Re-ran diner Program, World Engine catalog and diner layout checks after those fixes.

Final independent architecture review found two more adapter integrity gaps: two footprint IDs could claim one cell, and collision checks could be skipped if the collision helper were missing. The installer now rejects overlapping footprint cells, requires `GAME.Maps.isSolid`, checks every footprint cell solid and both targets walkable, and has isolated negative tests for duplicate stools and absent collision helper. Reviewer rechecked the fixes and found no blocker. These validations protect the existing geometry owner; they do not add a second geometry source.

Real Chrome World Builder passed **196/196**, including two new Double R checks. Its [read-only Program inspector capture](../artifacts/intent-room-double-r/builder-program.png) shows diner goals in the same UI as Sheriff; changing scene hides/shows the appropriate Program and exposes no edit controls. Builder-generated tracked test artifacts were restored after the run.

## Unchanged Room Critic on the before frame

| Level / target | Observation and why it matters | Smallest recommendation | Evidence / confidence |
| --- | --- | --- | --- |
| ROOM / identity | Counter, pie case, red booths, checker floor, local lights and people immediately read as a working diner. Extra clutter would weaken rather than establish identity. | Keep recognizable service/seating masses. | Native populated and unpopulated frames; high. |
| ROOM / visual hierarchy | Service band is dominant, but eye can branch into occupied booths. This is a distributed composition, not a failed attempt at one warm desk-style focus. | Preserve several social pulls; test whether floor contrast competes with people. | Fixed entrance frame; medium-high. |
| ROOM / circulation | Central plant and specials board split movement around them; door and both sides remain visually apparent. A still frame cannot prove path reachability. | Verify both branches against collision/walkthrough before altering island. | Frame plus canonical map rows; medium until path test. |
| GROUP / service-counter | Pale top, red fascia, pie case and backbar make one convincing service mass. Pie case and neon produce useful asymmetry and identity. | Keep; avoid increasing top-band brightness. | Native frame/art; high. |
| GROUP / booth-seating | Four booth units repeat intentionally, with two occupied and two other table states. Repetition is structure, not copy-paste by itself. | Keep rhythm; only change variation if native comparison proves gain. | Populated/unpopulated frames and authored model; high. |
| GROUP / center-island | Plant and specials board soften rigid geometry, but their isolated silhouettes compete with people against the checker floor. | Test floor-value hierarchy before moving objects or adding more. | Native frame; medium. |
| OBJECT / island plant | Removing green shape would lose organic contrast and a fork cue, even though it has no direct practical function. | Keep unless actual render test proves it distracts. | Native frame and contribution question; medium. |
| OBJECT / cleared table | One booth's plate/napkin state signals everyday turnover, not a named incident. At 256×192 the variation is subtle. | Keep; do not exaggerate into narrative evidence. | Renderer source plus frame; medium. |

The critic's existing question about how each group relates to **the** main focus is misleading here: counter is an orientation landmark, while booths are legitimate parallel social foci. Its ROOM/GROUP/OBJECT evidence and contribution questions still work. This is a candidate **CRITIC authoring-guidance** gap, not proof that Program data needs a new focal schema. Static PNGs also cannot verify ambient timing; existing Ambient Life registrations/tests are separate evidence.

## Massing, repetition, residue and local art direction

| Mass | Native role | Contrast / density | Critical distinction |
| --- | --- | --- | --- |
| Backbar, neon and menus | Brands place and frames service | Dense, warm, strong upper band | Should orient, not monopolize every first glance. |
| Counter and pie case | Food/service threshold | Long pale top, red face, bright glass at right | Strongest horizontal form; its right-end asymmetry is useful. |
| Four booths | Repeated social modules | Burgundy, paired left/right, medium density | Repetition creates diner identity; varied table states/occupancy prevent exact clone reading. |
| Checker floor | Shared circulation ground | Regular two-value rhythm across lower half | Diner-specific pattern; possible competition with small actors, not a call for an empty center. |
| Plant and specials board | Center-island accent | Two smaller green/dark vertical forms | Organic break and route fork, but potential isolated-object feel. |

If cups, faces and tiny highlights disappeared, service and four seating modules would still make a clear room. Unlike Sheriff, Double R's repetition is load-bearing; making all booths unique would likely damage the architecture. Existing menus, cups, plates, generic seated patrons, coffee-machine activity, steam, wiping and localized light constitute **ambient life** because they imply routine use only. Maddy/Leland/Norma/regulars and their state-dependent locations remain Cast Presence/Narrative Runtime facts, never Program-owned residue.

Shared world grammar: integer pixel rectangles, hard cluster edges, oak/cream/metal material distinctions, grounded objects, practical light and native 256×192 camera. Sheriff local grammar: institutional sage/steel, restrained density, cool room with one warm work pool, one clear approach axis. Double R local grammar: burgundy/cream/gold, wood/chrome, warm distributed practicals, branded service band, repeated booth rhythm, checker floor, and branchable social attention. The existing [World Visual Bible](../docs/world-visual-bible-v0.1.md) gets palette/material differences right but its universal “one focal object” and function-only prop wording do not describe this diner well; that is an art-direction/critic guidance issue to evaluate after visual trials, not a reason to add Program fields now.

## Bounded visual experiments proposed before art edits

1. **Floor-value compression.** Problem: checker contrast is a large high-frequency mass below people. Evidence: populated and unpopulated native frames; checker darks approach furniture contrast. Hypothesis: moderately closer two floor values preserve diner pattern but let booth conversations and small bodies read more clearly. Smallest change: adjust only the existing diner floor-value pair, with no geometry or extra detail. Expected: better social hierarchy, still checker. Risk: floor becomes bland or navigation less legible.
2. **Center-island visual weight, only if floor pass leaves a gap.** Problem: plant and specials board may compete as two detached silhouettes. Evidence: same fixed frame and collision island. Hypothesis: a more restrained existing shape/value on one element could keep route cue while making actors stronger. Smallest intervention: one local value/silhouette adjustment, no moved footprint. Expected: island reads as support, not destination. Risk: lose useful organic break or floor orientation.
3. **Booth light/rhythm, only if a later capture proves the seating weak.** Problem: counter may outrank booth social zones. Hypothesis: source-linked booth value change could strengthen social legibility without changing module count. Smallest intervention: local booth lighting/value only, preserving repeated geometry. Expected: distributed attention. Risk: flatten hierarchy or make authored table states look noisy.

These are hypotheses, not authorization for three cosmetic changes. Each gets one change, a fresh native frame and an independent comparison; otherwise revert.

## Native visual trials — fixed entrance, one cause at a time

All captures use `test/native-shot.js --map=diner --x=6 --y=8 --dir=up --narrative=1` at the same 256×192 native camera. Independent Luna xhigh reviewers saw only anonymous A/B PNGs, without code, hypothesis, or which image was new. Main-model judgment kept changes only when the image still respected the room's social structure.

| Trial | One intervention | Blind comparison | Decision |
| --- | --- | --- | --- |
| [1: floor values](../artifacts/intent-room-double-r/experiment-1-floor-soft.png) | Checker dark `#898b75`→`#9b9b85`, edge shade `#80836e`→`#90917b`; no pattern/geometry change. | New frame **narrowly wins**: checker recedes, people and saturated booths read first. Reviewer also noted older floor's moodier quality. | **KEEP**. Modest improvement, not a room transformation. |
| [2: booth practical light](../artifacts/intent-room-double-r/experiment-2-booth-light.png) | Raise only four existing booth light strengths from `[.55,.85,.7,.3]` to `[.75,1.05,.9,.5]`; no new lights or assets. | New frame **narrowly wins**, difference minor: upholstery separates slightly better from floor while layout stays warm. | **KEEP**. Useful but restrained. |
| [3: brighter booth panels](../artifacts/intent-room-double-r/experiment-3-booth-red.png) | Render the broad booth panels in existing `redHi` instead of `red`; no geometry, palette expansion, or light change. | Older/darker frame **clearly wins**: coral-bright panels compete with counter, sign, and central people; new frame feels friendlier but less moody. | **REVERT**. Preserved failed capture as evidence. |

Trial 1 SHA-256 `5ed4e792144c0281255312f7cffd2ee6172a387a85206ce3f4fc44ae53ddb7b8`; trial 2 `6b2bda006f7e32e7feba1713c966cae6d4bdb6434f600219355e8dddbc913792`; rejected trial 3 `9ca3dcf6b7cb7c67dec7df7b3bdbe09fd980a927ef04b58573b32f6d05bee7c2`. Local tests after trial 2: `diner-layout`, `diner-program`, `retro-production` **54/54**, and `ambient-life` pass.

Final [after frame](../artifacts/intent-room-double-r/after-native.png) has SHA-256 `0837faae4a1399d36329dbf9e08702fa13c2c582dac077e755fe3c923fe7c1ed`. Against baseline: checker darks are less insistent, booth seating has slightly more localized warmth, and red furniture remains restrained. Same masses, circulation, NPC staging and ambient machinery. A fourth fresh blind reviewer ranked the final after over before **slightly**, explicitly calling the difference **modest, not material**. The scene was already compositionally strong; increasing booth saturation made it worse.

## Final synthesis

### 1. ELI10

We gave the same room-intent method to a diner instead of a police station. It described the diner without adding another world system: counter says “food service,” repeated booths say “people gather here,” and ordinary table traces say “this place gets used.” It helped us make two small visual improvements and reject one tempting but worse change. It struggled most where critic language assumed one main focal point, and where the diner lacked named anchors for its existing geometry.

### 2. Double R before

The baseline already has strong identity: dark wood upper wall, branded neon, pale counter and pie case, four burgundy booth modules, checker floor, two occupied tables, plant/specials island, warm practicals. First glance goes to the service band; next glance branches toward booth conversations. The center is not a Sheriff-style quiet corridor; its floor rhythm and small island support two routes. Weaknesses are **relative**, not broken: high-contrast checker competes somewhat with small figures, and the counter can outrank the social seating. No new decor is necessary.

### 3. Final Environment Program, human-readable

- **Intent:** working public diner; warm, familiar, occupied; several social destinations alongside clear service orientation.
- **Visual goals:** distributed attention; coherent four-booth rhythm with controlled variation; source-linked warm continuity; recognizable but subordinated checker; plant/sign island as grid break and route split.
- **Activities:** ordering, serving, eating, conversation, staff work, circulation. These describe normal use, not which named person is present.
- **Groups:** `service-counter` is dense horizontal orientation/service band (counter + five stools); `booth-seating` is four repeated social modules with varied table state; `center-island` is the small specials/plant hinge between two walkable branches.
- **Contributions:** counter supplies service and orientation; booths supply function, social scale and visual rhythm; the cleared table supplies mundane turnover; plant supplies organic silhouette and path cue; specials board supplies menu information and compositional accent. Aesthetic contribution alone is accepted.
- **Relationships:** counter `NEAR` first stool; entrance `REACHABLE` service approach. Both are checked against actual map data, not invented orientation data.
- **Residue:** cups, coffee equipment, pie case, ready table and recently cleared table are baseline ambient residue. No narrative residue authored: no supported event-state detail is needed.

### 4–5. Visual experiments and fixed before/after

See trial table above and [before](../artifacts/intent-room-double-r/before-native.png) / [after](../artifacts/intent-room-double-r/after-native.png). **KEEP** compressed checker values and modest booth practical-light rise; **REVERT** brighter red upholstery. Three fresh blind reviewers, one per intervention, ranked each change without being told which PNG was new. Final gain is narrow but repeatable in those comparisons. No floor geometry, booth footprint, doors, actors, or ambient timing was changed. This experiment does **not** demonstrate a dramatic art-direction improvement.

### 6. Sheriff versus Double R

| Dimension | Sheriff's Station | Double R |
| --- | --- | --- |
| Intent | Legible small-town work; focused case activity | Public food service plus social life |
| Visual structure | Several work groups under one warm sheriff-desk priority | Long service band and repeated booth modules share attention |
| Density | Edge-weighted, quieter center | Dense service edge; patterned shared floor; lively side booths |
| Focal strategy | One main work pool | Branching service **and** social pulls |
| Group strategy | Distinct work/reception/waiting vignettes | Repeated seating group plus counter and small island |
| Repetition | Duplicate desks needed stronger distinction | Similar booth modules establish diner identity |
| Negative space | Directional circulation/rest was useful | Over-quieting center would erase checker identity |
| Ambient residue | Papers, mug, desk-use traces | Cups, plates, menus, cleared table, routine service |
| Eye flow | Entrance toward primary work area | Entrance → island/checker → counter **or** booth conversations |
| Local art direction | Sage/steel against oak, restrained work light | Burgundy/cream/gold, wood/chrome, distributed practicals |

Same Program fields produce different room strategies. No Sheriff palette, runner, single-focal goal, or desk-cluster assumption was copied into diner data.

### 7. Generalization gaps, prioritized

| Priority / class | Evidence | Required response |
| --- | --- | --- |
| 1 — **CRITIC / AUTHORING** | Existing group question asks whether each group supports “the main focal point.” Diner's booths are intentionally independent social pulls; forcing one focus would make it worse. | Later revise critic guidance to let Program declare focal topology in prose (singular, distributed, sequential); evaluate against that declared strategy. No schema field yet. |
| 2 — **TOOLING** | Diner tuple model and rows had no named `map.layout`, so anchor-bearing Program failed validation. Local adapter can derive and freeze named anchors from existing sources, but took more code than Program itself. | Keep adapter local for pilot; later consider a reusable *read-only derivation helper* only if a third room repeats this need. Do not create a new coordinates owner. |
| 3 — **ART-DIRECTION** | `docs/world-visual-bible-v0.1.md` says “one focal object” and leans function-only for props; Double R benefits from distributed attention and purely compositional repetition. | Later qualify shared guidance with room-specific focal strategy and contributions; retain common native-pixel/material grammar. |
| 4 — **GENERATION** | Initial floor and light hypotheses helped only slightly; a stronger booth-red hypothesis damaged hierarchy. Wording alone did not guarantee useful visual changes. | Keep native capture and independent keep/revert loop; no automatic decorator or generative framework. |
| 5 — **ROOM-SPECIFIC** | Counter has stronger service weight than social seating, and center figures can feel isolated. These are diner composition questions, not model failures. | Address only with future room-specific visual evidence, not generic code. |

**DATA MODEL gap: none proven.** Existing `visualGoals` prose, groups, composition contribution reasons, `NEAR`/`REACHABLE`, and ambient residue expressed the important claims. Current representation cannot verify sightlines, but we did not claim it could; image review handles visual judgment.

### 8–9. What stays and what changes

**Do not change:** Environment Program schema; World Engine canonical ownership; Cast Presence; Narrative Runtime; Ambient Life; group-as-metadata concept; optional contributions; current spatial verbs. No generic framework code changed in this experiment.

**Must change now:** nothing generic. A traincar test fixture had to install diner production before registering the expanded catalog; that local regression was fixed without weakening validation.

**Worth changing later:** critic/art-direction wording around focal topology and useful repetition; possibly a source-derived read-only anchor helper if more tuple-based rooms need one. **Do not change:** add a procedural clutter pass, universal room solver, single-focus requirement, new runtime Zone entity, or new narrative-state owner.

### 10. Tests and gameplay

| Gate | Result | Evidence |
| --- | --- | --- |
| CI-pinned Node 24 release suite after all code/review fixes | **100/101** | [Full report](../artifacts/intent-room-double-r/release-node24-reviewed/report.json); only `test/narrative-validate-m10.js` fails on four verbatim keys, reproduced exactly on unchanged main. |
| Diner Program/layout + route tests | **PASS** | Release suite: source-derived anchor parity, no overlapping footprints, mandatory collision, both island bypasses, registered Program references, freeze/ownership checks. |
| World Engine, door equality, Cast Presence, Ambient Life, retro/mobile, smoke, simulator walkthrough | **PASS** | Included in Node 24 report. |
| Real Chrome World Builder Program inspector | **196/196 PASS** | Same read-only UI for Sheriff and Double R; [capture](../artifacts/intent-room-double-r/builder-program.png). |
| Real Chrome Act 3, all paths | **189/189 PASS** | Browser-driven walking, doors, Cast Presence and narrative; one benign harness `favicon.ico` 404 console entry, also documented in prior project reports. |
| Real Chrome Act 4, all four paths | **530/530 PASS** | Diner encounter, cast moves, and route C walking from lot into diner and back; one benign harness `favicon.ico` 404. |

An earlier release run exposed our traincar fixture's missing diner installer (**99/101**). After restoring canonical installer load order, the final run returned to the one pre-existing M10 failure (**100/101**). Node 24 is required by CI; local default Node 26 has unrelated cast-PNG byte-compression drift already documented in the Sheriff pilot. Targeted `diner-layout`, `diner-program`, `world-engine-v0.1-catalog`, `traincar-location-traversal`, `retro-production` (54/54), and `ambient-life` also pass.

First Act 4 Chrome attempt passed gameplay assertions through path A but stopped while writing its transcript with `ENOSPC` (host disk at 122 MiB free); this was an environment-capacity failure, not a game assertion. Three inactive, regenerable temporary Chrome test profiles were removed after exact-path/process checks (61 + 151 + 155 MiB); no project asset was deleted. The all-path gate was restarted from the beginning with adequate free space.

### 11. Verdict

**PARTIALLY.** Architecture/generalization test passes: same Program and Builder can describe a markedly different room without schema redesign or Sheriff exceptions. Visual proof is weaker: two blind-reviewed improvements are small, and third attempt was worse. This is better evidence for the *method* than for a major Double R art leap. Do not claim full success on “materially improved visual design.”

### 12. Research notes for eventual article

- The strongest result came from what **not** to import: Sheriff's quiet center, single warm focal desk and anti-repetition instinct would each damage diner identity.
- Program could describe distributed social attention with existing text goals; critic phrasing, not data structure, was the limiting assumption.
- An exact map/collision owner mattered: adding anchor metadata without deriving it from tuple model would have created a second room geometry. The first hostile review caught mutability and a repeated booth rule; both were removed.
- First two blind comparisons preferred new frames only **narrowly**. “We added warmth” is not equivalent to a meaningful improvement at 256×192.
- Brighter booth panels sounded like a stronger social read; independent reviewer preferred the darker baseline and explained why: saturation fought the counter/sign. Failed PNG is preserved.
- Final blind reviewer preferred retained after only slightly and called it non-material. They suggested more central activity/clutter; main review rejects automatic clutter as a shortcut because current cast and authored table traces already have canonical/intentional roles. A future change would need a concrete social staging hypothesis and gameplay check.
- A broad release run caught a traincar fixture that loaded World Catalog without diner installer. Fail-loud Program validation exposed a real integration oversight; fixing fixture load order was better than disabling validation.
- Independent overfitting reviewer found no Sheriff-specific code or catalog assumptions in Double R. It did flag Sheriff-scoped critic wording and one-focal/quiet-ground defaults in the visual bible; those are guidance gaps, not grounds for a new Program schema. It also noted Builder unit tests freeze-check Sheriff only; Double R's own freeze test and real Builder inspector check cover this pilot, while a later multi-environment unit test could reduce future risk.

### 13. Single next generic improvement — recommendation only

Revise **Room Critic guidance** to assess the Program's chosen *focal topology*—one focus, distributed parallel foci, or a sequence—rather than implicitly demanding a single dominant object. Include repetition-as-structure and purely aesthetic contributions in examples. This is a small guidance change supported by Sheriff **and** Double R; do **not** add fields or implement it in this branch.

## Implementation inventory and final review

`js/world-catalog.js` authors only the Double R interior Program. `js/double-r-location-production.js` derives validated, frozen anchors from canonical tuple/row/collision data. `js/retro-authored.js` changes only two diner floor values and four existing booth-light strengths. `test/diner-program.js` exercises real registration, references, route reachability, immutable metadata, collision parity and install-time negative cases; catalog/traversal/Builder tests and CI workflow include the new room. This report and `artifacts/intent-room-double-r/` preserve before/after, rejected trial and test evidence. No generic World Engine, Room Critic, Cast, Narrative, Ambient Life, door registry, map row, or collision file changed.

Independent reviews: first architecture pass found mutable derived layout, repeated booth-backrest rule and missing CI gate; all fixed. Final hostile architecture pass found overlapping anchor cells and optional solidity; both fixed and rechecked, with no remaining blocker. Separate overfitting pass found no Sheriff-specific code leak, but identified single-focus/quiet-ground guidance and limited multi-room Builder unit coverage. Three fresh PNG-only critics reviewed individual art trials, and a fourth reviewed final before/after blind. Their narrow rankings—not Program prose—set the KEEP/REVERT decisions. Tracked artifacts regenerated by tests were restored after the gates; only Double R evidence remains.
