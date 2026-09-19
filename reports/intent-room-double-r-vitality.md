# Double R — room beauty and vitality pass

Status: implementation plan recorded before renderer changes. Final evidence and verdict will replace the provisional sections below.

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

Proposed-direction rubric: composition 8, form 8, storytelling 8, vitality 8, playable experience 8. These are targets, not results.

## Phase 4 — implementable plan

1. Redraw service band using broad native planes: continuous dark work recess, few structural verticals, substantial worktop/cabinets, explicit open patch behind Norma, grounded public-counter apron.
2. Keep neon, menu, side door, pie case, coffee equipment and current booths; simplify only competing seams/details.
3. Move first eligible `counter-wipe` window earlier and strengthen body/surface silhouette without changing Norma placement or state ownership.
4. Upgrade coffee-machine marks using existing `MACHINE_IDLE_ACTIVITY`; no new archetype. Keep steam continuous, neon/glass/lights independent.
5. Capture fixed native before/after and 3× comparison. Capture real stationary temporal sequence and inspect first 30 seconds.
6. Test diner program/layout, Ambient Life, Character Activity, renderer contracts, reachability, smoke, walkthrough and real Chrome Act 4 diner route.

Unchanged: map rows/model, collision, doors, cast windows, narrative state, player camera, environment Program schema and global Ambient Life scheduler.

## Final evidence and verdict

Pending implementation.
