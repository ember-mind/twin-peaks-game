# Hospital ward — native translation brief

Golden Concept: `hospital-concept.png` (variant B). Target: native 256×192, 16×12 tiles, same pipeline as `js/room-315-art.js` / `js/room-315-scene.js`.

## Tile plan (matches `js/maps.js` `hospital.rows`)

```
      0123456789012345
 0-2  TTTTTTTTTTTTTTTT   north wall face, 48 px
 3    TTTTT...TTT....T   monitor/drip stand (1-2,3) · Ronette bed (3-4,3) · curtain (8,3) · Gerard bed (9-10,3)
 4    T..TT...TTT....T   bed (3-4,4) · curtain (8,4) · bed (9-10,4)   [Gerard NPC stands at 11,4 facing left]
 5    T..TT...TTT....T   bed (3-4,5) [Ronette actor tile 3,5] · curtain (8,5) · bed (9-10,5)
 6    TT.............T   chair (1,6)
 7    T..............T
 8    T...........TTTT   nurse counter (12-14,8) [night register target 13,8] · nurse NPC at 11,8
 9    T..............T
 10   T..............T   spawn 7,10 facing up
 11   TTTTTTT..TTTTTTT   double door 7-8,11 → town 23,7
```

Wall-face-only elements (no footprint): wall clock above the chair (x≈1–2), steel wall cabinet between the beds (x≈6–7), chair rail line along the whole face, a small framed notice board is NOT wanted.

## Definitions (props with `cells`, `bounds`, `shadow`, `footY`)

1. `monitorStand` cells (1,3),(2,3): steel cart with the bedside monitor (small dark screen, one thin green trace line, 2–3 px), drip stand pole with bag rising onto the wall face.
2. `ronetteBed` cells (3..4,3..5): chrome rails, headboard against the wall face, white-ivory sheets folded down once, **Ronette lying under the sheet, head on the pillow toward the wall** (dark hair, face toward the room, skin tone from the cast), a chart clipped at the foot rail. This is the brightest plane in the room.
3. `chair` cell (1,6): plain blue-gray waiting chair.
4. `curtain` cells (8,3..5): pale privacy curtain, heavy vertical folds in 3 values, hanging from a ceiling track drawn on the wall face; it must read as tall (foreground band covers the player walking behind it).
5. `gerardBed` cells (9..10,3..5): identical bed, sheets slightly dimmer than Ronette's, no figure in it (Gerard stands beside it at 11,4).
6. `nurseCounter` cells (12..14,8): low steel counter/cart, chart binder and a clipboard on top; a small register book at 13,8.
7. Door: south wall row 11, double leaf at 7–8 with small wired-glass panes; the foreground band paints the door frame over the player when passing.

## Palette roles (World Visual Bible, one authored state: cool fluorescent day)

- Upper wall: pale institutional mint; chair rail 1 px darker; lower wall cool ivory; wall base band slightly cooler.
- Floor: blue-gray linoleum, one quiet darker border band along the walls, no tile grid noise; the floor is the quietest plane.
- Steel/chrome: 2–3 value cool greys with a single 1 px highlight.
- Sheets: the brightest plane (Ronette) and one step dimmer (Gerard); 2–3 crease lines.
- Curtain: three pale values, cooler than the sheets.
- Skin: the only warm notes. Green trace: the only saturated accent.
- No warm pool, no window plane, no lamp. No gradients, no blur.

## Value order (test gates)

Ronette's sheets > Gerard's sheets and curtain > walls > steel > floor. Native test asserts: sheet luma (Ronette) > sheet luma (Gerard) + 6; sheet luma > floor + 40; no pixel warmer than skin outside the two figures; exactly one green-trace cluster.

## Parity checklist (concept → native)

- [ ] Ronette bed reads as the focal object at 1×: brightest, largest continuous light plane, monitor accent beside it.
- [ ] Entrance → nurse → Ronette reads without markers: door centred, counter east of the approach column, bed at the end of the column's diagonal.
- [ ] Curtain reads as a tall soft divider, not a wall.
- [ ] Gerard's bed reads as second: dimmer sheets, half hidden by the curtain.
- [ ] Negative space kept: rows 6–10, columns 2–11 open.
- [ ] 48 px wall face, same player scale, tight 1–2 px contact shadows under every prop and actor.
- [ ] Nothing from the station's green plane or Room 315's walnut/teal.

## Depth and actors

- Ronette's standing sprite is suppressed on this map by a scoped wrap of `GAME.Sprites.drawChar` in `js/hospital-scene.js` (env.mapId === 'hospital' && env.npcId === 'ronette' → return); her figure is part of `ronetteBed` art; depth = bed `footY`. The NPC record stays interactable at (3,5).
- Nurse (11,8) and Gerard (11,4) are normal standing sprites; the counter and beds sort by `footY` as in Room 315.

## Concept-only elements dropped

Perspective on the bed feet, the second patient's sitting pose (Gerard stands), the dark south wall band (the door frame carries the south wall).
