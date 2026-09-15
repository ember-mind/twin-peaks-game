# Gauntlet — e8

## Goal

Native Great Northern lobby reaches bottom-panel reference grammar while preserving world geometry and Act 2 continuity.

## Outcome

**BAR_WINS.** Engineering gates pass. Reception and stairs meet visual floor; walls/floor/rugs, fireplace, and light stop below floor at round cap.

| Unit | Floor | Shipped score | Shipped round | Status |
|---|---:|---:|---:|---|
| Log walls + floor + rugs | 7 | 4 | 3 | capped-below-floor |
| Fireplace corner | 7 | 5 | 4 | capped-below-floor |
| Reception desk | 7 | 7 | 4 | pass |
| Stairs + runner + chandelier | 7 | 8 | 3 | pass |
| Light | 7 | 4 | 3 | capped-below-floor |

## Evidence

- Reference: `artifacts/art-pass-e/e8/reference-bottom.png`
- Baseline: `artifacts/art-pass-e/e8/baseline.png`
- Final: `artifacts/art-pass-e/e8/after.png`
- Fixed capture: `test/shot.sh hotel_gn 8 10 up <out> --retro`

## Gates

Native, continuity, door, Room 315, Act 4 flow, Chrome Act 4 530/530, and Act 3 189/189 all pass. Browser-regenerated tracked artifacts restored.

## Unresolved gaps

1. Walls/floor/rugs remain flatter and less compositionally faithful than reference.
2. Fireplace corner lacks reference's large unmistakable stone-and-fire mass.
3. Light remains flatter than reference's deep directional warmth.
