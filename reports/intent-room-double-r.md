# Double R — second Intent-Driven Environment experiment

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
