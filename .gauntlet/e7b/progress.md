# Gauntlet — e7b

## Goal

Red Room floor uses exact period-16 diagonal zigzag formula and reaches 7/10 against reference top panel

## External bar

assets/ref/red-room-sheet.png top panel; mechanical floor formula supplied by user

## Scope and inventory

One unit: Red Room floor, hard floor 7/10, maximum three rounds. Mechanical geometry fixed by user formula; post-round tuning limited to colors.

## Evidence

- Reference: `assets/ref/red-room-sheet.png`, top panel only
- Before: `artifacts/art-pass-e/e7b/floor/before.png`
- Fixed capture: `test/shot.sh redroom 8 9 up <out> --retro`

## Latest verdict

Round 1: 7/10, BETTER. Fresh Luna judged reference top + before + after PNG only. Floor met; loop stopped immediately.

## Gap queue

Empty. Critic observed denser/thinner bands than reference, but E7b mechanical geometry is immutable and score met floor.

## Gates

- `node test/redroom-scene.js`: pass; exact formula and 1px draw stream
- `node test/smoke.js`: 415/415
- `node test/retro-production.js`: 54/54
- `node test/narrative-finale.js`: 27/27
- `node test/act-4-playthrough.js --path=all`: 530/530; one harness `favicon.ico` 404
