# Double R — room beauty and vitality pass

Status: implemented and verified in real native renderer. Plan checkpoint: `e9b8398`.

## Phase 1 — repo and Vault audit

### Room fantasy and ownership

Double R is **the social space outside institutions**: a warm working diner where food service, ordinary ritual and several conversations coexist. The canonical sensory identity is the percolator; tables associated with James and the Log Lady make social use specific without turning the room into a narrative tableau. `environment.program` describes intent, groups and contributions. It does not own map rows, collision, doors, Cast Presence, narrative state, runtime animation or prop coordinates.

Operational ownership remains unchanged:

- `js/maps.js`: diner rows and tuple model;
- `js/retro-authored.js`: native room drawing;
- `js/ambient-life-scenes.js` and `js/character-activity.js`: temporal life;
- `narrative/cast/windows.json`: named cast placement;
- `world/connections.json`: doors and spawns.

Vault/runtime note: canonical Vault mirror still reflects production before experimental `environment.program`; Program and Room Critic live on current intent-room branches. Vault supplies approved room fantasy, sensory hierarchy and art constraints. This pass does not silently write experimental branch code back into Vault or treat stale viewport notes as operational truth.

### Vault principles applied

This pass uses project notes plus general game-design knowledge in the Vault:

- judge sightlines and staging in the playable level, not only a screenshot;
- solve macro massing and value hierarchy before prop detail;
- use asymmetric clusters and the counterfactual prop test instead of uniform clutter;
- treat the diner primarily as an **evocative** and **staging** space: ordinary routine establishes meaning, while bodies and access make social relationships readable;
- translate desired aesthetics through real dynamics: a readable work surface plus a completed staff gesture should produce “working hospitality” better than decorative blinking;
- permit one dominant movement; keep unrelated ambient clocks independent and subordinate.

### What worked already

- Burgundy/cream counter, dark branded wall and pie case identify Double R immediately.
- Four booth modules create social scale and repetition; different occupants/table states stop exact cloning.
- Checker floor, plant and specials board preserve two circulation branches.
- Existing steam, lights, neon, glass reflection, sip and wipe provide real deterministic motion.
- Earlier Ambient Life QA already proved that animation can be technically active yet invisible; accepted motion used larger clusters and measurable native deltas.
- Current booth candidate improves table/seat volume, especially at 3×.

### What did not work

- Earlier floor/light trials were honest but only modest.
- Exact-grid booth rounds improved a crop, not whole-room experience.
- Brighter reds competed with faces and counter; reverted.
- Static generated studies failed exact native scale, actors and playable context.
- Previous service study added formal bays but retained too many horizontal seams and lost some accumulated diner warmth.
- Existing machine motion is tiny; first recognizable human actions may occur after player has crossed room.

Constraints: preserve rows, collision, routes, doors, Cast, narrative state, camera and canonical activity ownership. No new Room system, clutter pass or invented event.

## Phase 2 — whole-room critic

Actual first read at native entrance view:

`neon/menu → bright counter and pie case → faces and red booths → center island → player/door`

Intended experience:

`entrance → understand working service zone → choose person/table → notice another ordinary action while moving`

Major masses remain good without small details: upper service band, long public counter, four booth blocks, checker floor and center island. Problem is upper third collapses into one decorated elevation. Wall, work zone and counter share many adjacent horizontal edges. Four pale tabletops then carry similar weight. Room is readable immediately but offers limited reward for second look.

No human evidence proves players do not pause. Current diagnosis is hypothesis: room tells its full visual proposition too quickly, while meaningful residue and gestures are too small or too late.

### Provisional baseline rubric

| Dimension | Baseline | Evidence |
| --- | ---: | --- |
| Composition | 7/10 | Strong identity and bilateral rhythm; service band visually compressed. |
| Form/material readability | 7/10 | Booths improved; counter/backbar still read as stacked stripes at 1×. |
| Environmental storytelling | 7/10 | Routine, food and occupancy visible; several clues require close inspection. |
| Vitality/temporal life | 6/10 | Many real loops, but dominant human action is late/subtle. |
| Playable experience | 6/10 | Memorable diner; second-look reward not yet proven and likely weak. |

## Phase 3 — three room-scale directions

### A. Working counter with space behind it

Rebuild upper third as three readable depth planes: dark wall/recess, inhabited staff work zone and public counter. Consolidate thin rails; stage coffee left, clear Norma work patch near center, pie/service right. Preserve equipment and warmth. Existing wipe becomes legible because body, surface and background separate.

Risk: over-clean architectural bays could erase Double R specificity. Scope: substantial redraw of `interiorBackbar` and `drawDinerCounter`; no geometry change.

### B. Four tables, different invitations

Make seating emotional center. Preserve shared booth construction, but stage occupied diagonal booths, ready table and cleared table as four readable social states. Subordinate specials-board value slightly. Use clustered residue, not added noise.

Risk: theatrical spotlights or individualized clutter could destroy rhythm. Scope: seating-group redraw and light redistribution.

### C. Room continues while Cooper watches

Create a 25–35 second observation passage: quiet continuous percolation; one readable Norma service action within roughly 5–8 seconds; later booth sip; long quiet return. Human action dominates, ambient effects stay background and independent.

Risk: synchronized pulses feel staged; motion must remain eligible only when actors/state permit it. Scope: tune existing Character Activity and Ambient Life registrations, no scheduler/system change.

### Selection

Choose **A + restrained C**. Both express one causal idea: create a believable working surface, then show someone using it. Keep B as comparison logic, not additive decoration.

Implementation note: first A+C still was materially indistinguishable from baseline at native scale in blind review. One restrained part of B was then admitted: value/light differentiation of existing table states. No new booth prop or geometry was added.

Proposed-direction rubric: composition 8, form 8, storytelling 8, vitality 8, playable experience 8. These are targets, not results.

## Phase 4 — implementable plan

1. Redraw service band using broad native planes: continuous dark work recess, few structural verticals, substantial worktop/cabinets, explicit open patch behind Norma, grounded public-counter apron.
2. Keep neon, menu, side door, pie case, coffee equipment and current booths; simplify only competing seams/details.
3. Move first eligible `counter-wipe` window earlier and strengthen body/surface silhouette without changing Norma placement or state ownership.
4. Upgrade coffee-machine marks using existing `MACHINE_IDLE_ACTIVITY`; no new archetype. Keep steam continuous, neon/glass/lights independent.
5. Capture fixed native before/after and 3× comparison. Capture real stationary temporal sequence and inspect first 30 seconds.
6. Test diner program/layout, Ambient Life, Character Activity, renderer contracts, reachability, smoke, walkthrough and real Chrome Act 4 diner route.

Unchanged: map rows/model, collision, doors, cast windows, narrative state, player camera, environment Program schema and global Ambient Life scheduler.

Plan variance found during real capture: independent wipe/sip clocks could still overlap in opening passage. Small optional `firstDelay` support was added to existing Ambient Life scheduler, with recurrence left unchanged. This is documented, tested and reviewed below; it is not another lifecycle or activity system.

## Final evidence and verdict

### Phase 5 — implementation

Static art changed at room scale, without moving geometry:

- upper service wall now reads as three depth planes: wood wall, one continuous 135×31 px near-black-green work recess, public counter;
- duplicate rails and drawer rhythm were reduced; storage masses stay left/right, leaving one quiet work patch behind Norma;
- counter now has a deeper cream top, thin front edge, broad burgundy apron and compressed dark plinth;
- booth construction stays shared, but existing occupied/ready/cleared states use broad surface value and local light. Occupied diagonal tables support faces and hands; cleared lower-right table recedes;
- no decorative prop was added. Existing equipment, sign, pie case, guests, center island and circulation remain.

Temporal changes use existing ownership and archetypes:

- `counter-wipe` gets one early 5–7 s opening window, larger wrist travel and an 8×2 px cloth;
- `booth-sip` becomes later 16–20 s beat;
- recurrence remains slow and independent: wipe 22–30 s, sip 26–34 s;
- existing `MACHINE_IDLE_ACTIVITY` percolator marks become compact native-readable clusters with a 6.5–12.5 s rest and 1.1–1.5 s action;
- Ambient Life gains optional `firstDelay` only for initial observation. Normal `delay` still owns recurrence. It stores no narrative or actor state.

An early capture exposed wipe/sip overlap. That version was rejected. In final seeded 30-second Chrome reel, relative to first stationary frame, wipe is visible around 8.6–13.8 s, room returns quiet, and sip arrives around 26.4–29.0 s. No human-action overlap.

### Phase 6 — visual and playable review

[Native before/after](../artifacts/intent-room-double-r-grid/vitality-pass/final/before-after-native.png) · [3× inspection](../artifacts/intent-room-double-r-grid/vitality-pass/final/before-after-3x.png) · [six-frame temporal evidence](../artifacts/intent-room-double-r-grid/vitality-pass/final/motion-sequence-native.png) · [service gesture 4×](../artifacts/intent-room-double-r-grid/vitality-pass/final/wipe-service-4x.png) · [real Chrome manifest](../artifacts/intent-room-double-r-grid/vitality-pass/final/cdp-real/manifest.json)

Final still differs from baseline in 7,642 of 49,152 native pixels (15.5%). This is scale evidence, not quality proof. SHA-256: final native `28e6d02d…a52496`; temporal grid `04ab8a37…cc843`; capture manifest `958323d3…fa80`.

Observed final eye flow:

`neon/menu → inhabited dark service recess + Norma → pie/coffee counter → occupied diagonal booths → center island/player`

Clearly improved:

- counter has space behind it; staff no longer sits on same visual stripe as wall storage;
- broad dark/light/cream/burgundy masses survive 1× and separate wood, work void, laminate and vinyl;
- Norma's usable patch and existing tools form one service composition rather than independent props;
- occupied and quiet booth states break repetition without destroying shared diner rhythm;
- first 30 seconds contain two readable human beats separated by quiet time. Room life now has hierarchy, not simultaneous garnish.

Improved only slightly:

- overall architecture remains a wide, nearly bilateral room;
- center island still competes somewhat with small bodies;
- wipe is readable when observing, not guaranteed during fast traversal.

Risk/regression: continuous dark recess is more spatially legible, but also a strong horizontal graphic band. Further contrast would make it theatrical; current value is accepted ceiling.

### Final blind-critic rubric

| Dimension | Baseline | Final | Verdict |
| --- | ---: | ---: | --- |
| Composition | 8.2/10 | 8.4/10 | Service depth and diagonal social emphasis now guide eye. |
| Form/material readability | 7.8/10 | 8.4/10 | Four broad material planes survive native scale. |
| Environmental storytelling | 8.4/10 | 8.8/10 | Existing objects now behave as work/social clusters. |
| Vitality/temporal life | 6.6/10 | 8.3/10 | Early work beat, pause, later social beat; independent clocks. |
| Playable experience | 7.5/10 | 8.1/10 | Real route stays clear; desire to linger still needs human playtest. |

Fresh blind critic saw only supplied PNGs and judged native 1× first. Full note: [final-blind.md](../artifacts/intent-room-double-r-grid/vitality-pass/review/final-blind.md). Main judgment: **material improvement, accepted**. It changes room hierarchy and temporal reading, not only local pixels. Claim stops short of “player definitely pauses”: no human playtest supports that yet.

### Phase 7 — test result

All gates reran after final static v2:

| Gate | Result |
| --- | --- |
| diner layout | PASS |
| diner Program | PASS |
| Ambient Life deterministic | PASS |
| Ambient Life organic | PASS — 48 seamless cycles, 3 variants |
| native ambient frames | PASS — diner 6 animated px / 4 frames; roadhouse 56/2; redroom 16/2 |
| Character Activity | PASS |
| retro production | PASS — 54/54 |
| contact shadows | PASS — 10/10 |
| interior reachability | PASS — 42/42; 8/8 interiors connected |
| prop semantics | PASS — 24/24 |
| smoke | PASS — 415 checks |
| walkthrough | PASS — 85 acquisitions, finale reached |
| Chrome Act 4 route C | PASS — 130/130 assertions |

Chrome logged one expected test-server `favicon.ico` 404. Six tracked route/transcript artifacts regenerated by Chrome were restored to HEAD, as required; they are not part of this art pass.

### Ownership review

No duplicate ownership introduced. Changed production boundaries:

- `js/retro-authored.js`: appearance only;
- `js/ambient-life-scenes.js`: existing diner effect registration;
- `js/character-activity.js`: existing diner behavior registration/drawing;
- `js/ambient-life.js`: generic optional initial-delay scheduling, tested and documented.

Unchanged: `js/maps.js`, rows, collision, doors/connections, Cast Presence, narrative state, camera, Program schema and World Catalog. `firstDelay` schedules observation; it does not assert a world event.

### Review roles

- Astra high: three room directions, service massing, restrained booth-state pass;
- Luna xhigh: bounded repository/constraint audit, fresh PNG-only critics, deterministic gates, hostile final diff review;
- lead integration: Vault synthesis, native-scale visual judgment, acceptance/rejection, ownership and final report.

Bounded delegation followed cavecrew guidance: agents gathered or changed narrow surfaces; final art direction and integration stayed with lead.

Hostile diff review found one valid validation bug: one-element or non-finite timing ranges could pass and later schedule `NaN`. Validation now requires exactly two finite values for `delay`, `duration` and `firstDelay`; regression tests cover malformed new ranges. Review found no geometry, collision, Cast, narrative, coordinate or ownership regression. Capture manifest's dirty-status snapshot truthfully records an intermediate evidence directory that was later excluded from final tree.

After fix, Ambient Life deterministic/organic, native frame, Character Activity, diner Program and smoke 415 reran green.

### Remaining weaknesses / next best follow-up

1. Human five-second-entry playtest: record first/second/third read and whether gesture is noticed while moving.
2. If center island still outranks people, reduce its local contrast—not add props.
3. Test dark-recess value on another display; only tune tone, never reopen geometry without new evidence.
