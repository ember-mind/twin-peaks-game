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
| Fireplace + lounge | 8 | 8 | pass |
| Stairs + Room 315 hall | 8 | 8 | pass |
| Entry + runner + circulation props | 8 | selected R4 7.1 | below floor; locked layout |
| Lighting + ambient life | 8 | 6.5 | below floor |
| Integrated lobby world | 8 | 7.3 with real Cast Presence | below floor |

## Evidence

- Reference: `.gauntlet/e8-architecture/evidence/reference-bottom.png`
- Baseline: `.gauntlet/e8-architecture/evidence/baseline.png`
- Fixed capture: `test/shot.sh hotel_gn 8 10 up <out> --retro`
- Motion contract: focused 60-second ambient test, three fire frames, chandelier warm variation, bell reflection.

## Latest verdict

Shell R2: 8/10 pass. Reception R2: 8/10 pass. Hearth/lounge R1: 8/10 pass. Stair R1: 3/10 reject; R2: 8/10 pass. Entry R1: 7, R2: 5, R3: 6, R4: 7.1, R5: 4, R6: 5/10; R4 best legal version. Literal reference geometry requires moving locked lounge, counter, cart, and Cast Presence. Light R1: 4.5, R2: 5, R3: 3, R4: 6.5, R5: 6.5/10; R5 cleaner local masks but motion remains subtle. Integrated independent critic: 7.3 fixed, 7.3 with real Cast Presence. No fake sprite; short arrival axis remains.

## High constraints

- Preserve map rows, registry, doors, Cast Presence, Room 315, protected renderer files.
- Keep entry spine, east bypass, Audrey wander region, and hall corridor open.
- No visual solid may lie about collision semantics.
- Fresh Luna/xhigh critic approves each unit only at >=8/10.

## Final checkpoint

All runtime gates passed, including Act 4 Chrome 530/530 and Act 3 Chrome 189/189. Integrated independent verdict remains **7.3/10, reject**; entry 7.1 and light 6.5 also below 8. Release audit fails honestly. Best legal layout retained, tracked Chrome-generated artifacts restored, no push.
