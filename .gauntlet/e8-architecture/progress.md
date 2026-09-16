# Gauntlet — E8 architecture

## Goal and bar

AAA Great Northern lobby whose objects participate in believable hotel architecture. Visual bar: `assets/ref/great-northern-lobby-sheet.png`, bottom panel. Hard floor: 8/10 per unit and integrated scene.

## Architectural concept

Locked gameplay geometry prevents literal reference left/right swap. Coherent legal plan:

- south: paired public entry and arrival sightline;
- west: built reception/service wing with luggage bay;
- center-left: wall-anchored hearth and bounded lounge;
- center/east: protected guest circulation and carpet route;
- east: stair/hall zone terminating at Room 315 door;
- ceiling axis: chandelier; functional light zones remain source-linked.

Reception counter is boundary, not loose furniture. Clerk stands staff side; sign and keys mount behind. Chairs face hearth. Luggage supports arrival/reception. Plants frame thresholds. Stairs join landing/door.

## Inventory

| Unit | Floor | Current | Status |
|---|---:|---:|---|
| Architectural shell + floor plane | 8 | 8 | pass |
| Reception + service wing | 8 | 8 | pass |
| Fireplace + lounge | 8 | — | pending |
| Stairs + Room 315 hall | 8 | — | pending |
| Entry + runner + circulation props | 8 | — | pending |
| Lighting + ambient life | 8 | — | pending |
| Integrated lobby world | 8 | — | pending |

## Evidence

- Reference: `.gauntlet/e8-architecture/evidence/reference-bottom.png`
- Baseline: `.gauntlet/e8-architecture/evidence/baseline.png`
- Fixed capture: `test/shot.sh hotel_gn 8 10 up <out> --retro`
- Motion contract: focused 60-second ambient test, three fire frames, chandelier warm variation, bell reflection.

## Latest verdict

Shell R2: 8/10 pass. Reception R2: 8/10 pass; cart bay and service opening accepted. Integrated sprite-clearance check pending. Ben absent from fixed shot even with Act 2 flags; no fake sprite.

## High constraints

- Preserve map rows, registry, doors, Cast Presence, Room 315, protected renderer files.
- Keep entry spine, east bypass, Audrey wander region, and hall corridor open.
- No visual solid may lie about collision semantics.
- Fresh Luna/xhigh critic approves each unit only at >=8/10.
