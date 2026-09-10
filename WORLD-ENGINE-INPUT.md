# World Engine input — Double R freeze

## WHAT EXISTS

- Native scene rendering with authored collision/walkability and depth ordering.
- Ambient Life: continuous, intermittent, and signature visual behaviors.
- Event-driven Environment Reactions.
- `LocationConnections`: semantic paired endpoints, multiple trigger tiles, non-trigger destination spawns, optional departure reactions, and connection metadata on committed arrival.

## WHAT REMAINS LOCATION-SPECIFIC

Double R art, palette, geometry, foliage, parking, trigger/spawn coordinates, diner door frames/palette, and scene registration remain authored per location.

## LESSONS FROM DOUBLE R

Compile paired endpoint data into existing doors. Land outside trigger tiles. Emit reaction only after successful save/map commit. Freeze reaction through fade. Preserve native depth order and approved static pixels.

## OPEN QUESTIONS

What real second location requires: more than two endpoints, conditional routing, installer-conflict rules, material-policy registration, differently shaped door frames, or world-time semantics?
