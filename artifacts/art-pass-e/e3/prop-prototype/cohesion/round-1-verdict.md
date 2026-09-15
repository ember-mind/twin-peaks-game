# Roadhouse prop/sprite cohesion — round 1

## Frame contract

- Native canvas: `160x144`
- Floor: current `GAME.RoadhouseArt.palette` and exact 8px checker/grain phase
- Atomic kit at 1:1 source-to-destination pixels: `roadhouse.chair.red`, `roadhouse.table.round`, `roadhouse.candle.brass`
- Standing cast: Cooper through production renderer `heartgold-atlas-r116`
- Seated cast: Maddy palette through existing production `interiorKit.seatedGuest` archetype
- Rounds: `1/1`; stopped after critic pass as requested

## Fresh-context critic input

Critic received only:

1. `round-1.png`
2. `artifacts/act-4-implementation/diner-maddy-leland.png`
3. Question: “Do props and sprites belong to the same game?”

No repository, code, metadata, or task history was provided.

## Verdict

ANSWER: BORDERLINE  
SCORE: 7/10  
ONE GAP: The sprites and prop float on an ungrounded checkerboard, lacking the benchmark’s grounded tile-and-shadow context.

## Safety checks

- `node test/cast-continuity-validate.js`: PASS
- `node test/act-4-flow.js`: PASS — `1611/1611`
