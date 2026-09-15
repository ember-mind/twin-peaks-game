# Gauntlet — e7

## Goal

Native Red Room reaches reference top-panel grammar while preserving gameplay geometry

## External bar

assets/ref/red-room-sheet.png top panel; style anchor artifacts/act-4-implementation/diner-maddy-leland.png

## Scope and inventory

| Unit | Floor | Round 1 | Status |
|---|---:|---:|---|
| Curtains | 7 | 5 → 7 | passed; ship R2 |
| Chevron floor | 7 | 5 → 6 → 6 → 3 | **capped below floor; ship R2 (6)** |
| Furniture + statue | 7 | 3 → 6 → 6 → 5 | **capped below floor; ship R3 (6)** |
| Light | 7 | 4 → 4 → 4 → 6 | **capped below floor; ship R4 (6)** |

## Evidence

- Reference: `artifacts/art-pass-e/e7/reference-top.png`
- Baseline: `artifacts/art-pass-e/e7/baseline.png`
- Round 1: `artifacts/art-pass-e/e7/round-1.png`
- Curtains round 2: `artifacts/art-pass-e/e7/curtains/round-2.png`
- Floor round 2: `artifacts/art-pass-e/e7/floor/round-2.png`
- Floor round 3: `artifacts/art-pass-e/e7/floor/round-3.png`
- Floor round 4: `artifacts/art-pass-e/e7/floor/round-4.png`
- Light round 2: `artifacts/art-pass-e/e7/light/round-2.png`
- Light round 3: `artifacts/art-pass-e/e7/light/round-3.png`
- Light round 4: `artifacts/art-pass-e/e7/light/round-4.png`
- Furniture round 2: `artifacts/art-pass-e/e7/furniture-statue/round-2.png`
- Furniture round 3: `artifacts/art-pass-e/e7/furniture-statue/round-3.png`
- Furniture round 4: `artifacts/art-pass-e/e7/furniture-statue/round-4.png`
- Fixed capture: `test/shot.sh redroom 8 9 up <out> --retro`

## Latest verdict

Light round 4, fresh Luna: 6/10; rank versus round 3: BETTER. Unit capped below floor.

## Gap queue

1. Furniture ends below floor. Best round 3 remains dark and blocky; round 4 saturated bright red and regressed.
2. Floor ends below floor. Best R2/R3 scored 6; R4 overcorrected to sparse oversized chevrons.
3. Light ends below floor. Lighting remains too flat/uniform versus reference's warm dimensional spotlight and shadow falloff.
