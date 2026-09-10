# Footbridge / traincar — native build notes (D3 + D5)

Native scene: `js/traincar-art.js` + `js/traincar-scene.js` + `js/traincar-production.js`,
hooked exactly like `js/sheriffs-station-exterior-*` (drawTile no-op on the authored
rows, drawStructures / drawForegroundStructures delegated to the art module,
`limitBackgroundPalettes` bypassed on this map). No new engine primitive, no roof or
interior manager: the roof-cut car is authored tiles.

Contract: `node test/traincar-native.js`.
Full-map captures: `node tools/traincar-captures.js <out.png> [--scale=N] [--overlay] [--ring-hidden]`
(the art is only flat integer rectangles, so the whole 384×192 map is rasterised
deterministically in Node — no browser). In-game frames still come from
`node test/native-shot.js --map=traincar … --narrative=1 --nstate=<base64>`.

## Tile plan actually built (24×12)

```
      000000000011111111112222
      012345678901234567890123
 0    TTTTTTTTTTTTTTTTTTTTTDTT   D (21,0) → oej, needsFlag east_route_confirmed
 1    TTTTTTTTTTTTTTTTTTTTTpTT   the cut
 2    TTTwwTTTTiiiiiiiiiTTSpTT   48 px north faces: canopy rows 0-2, car rows 2-3
 3    TggwwggggiiiiiiiiigggpgT   car north rim, stove on it at (12,3)
 4    TggwwggggifffffffigggpgT   interior floor 10..16 × 4..6, bent sheet (16,4)
 5    TggwwggggifffffffigggpgT   crossbeam 12..14, ring at (13,5)
 6    TggwwggggifffffffigggpgT   torn seat + cards (10,6), mound (13,6)
 7    pppbbprrriiiiDDiiigggpgT   bridge 3-4, rails 6-8, south face, door 13-14
 8    TggwwggggggggggggggggpgT   open ballast: Truman (9,8), Hawk (14,8)
 9    TggwwggggggggggggggggpgT
10    TggwwggggggggggggggggpgT   spawn from town (1,7) facing right
11    TTTTTTTTTTTTTTTTTTTTTTTT
```

Legend: `T` trees, `g` dead grass, `p` path, `w` creek (solid), `b` bridge plank,
`r` rail, `i` car rim (solid), `f` car floor, `D` door tile, `S` sign (solid).
The only solids are `T`, `w`, `i`, `S` — asserted by the contract test.

Doors: `0,7` → town 54,14; `21,0` → oej, `needsFlag: east_route_confirmed`,
`blockedMsg: oej_bloccato` (unchanged). Town `55,14`/`55,15` now spawn at (1,7).

## Interactables actually keyed (D5)

| id | tile | player stands | note |
|---|---|---|---|
| bridge_rail | 4,6 | 4,7 up | east parapet over the planks (was sign_ponte 5,6) |
| traincar_entrance | 13,7 | 13,8 up | west leaf of the sliding door |
| mound | 13,6 | 13,7 up | also reachable from 12,6 / 14,6 |
| ring | 13,5 | 13,6 up | on the crossbeam, exact centre |
| scene_center | 12,5 | 12,6 up | one tile west of the door column |
| stove | 12,3 | 12,4 up | on the north rim |
| cards | 10,6 | 11,6 left | under the torn seat |
| tracks_north | 21,2 | 21,3 up | the tile before the cut |
| sign_oej | 20,2 | 20,3 up | solid |

Actors: truman (9,8) right, hawk_bridge (5,7) left, hawk_door (14,8) down,
hawk_cut (22,3) up. Ids and `when` conditions unchanged. Nobody stands inside the
car and nobody stands in the door column (13, rows 8-10) — both test-enforced.

## What the first native lacked (`native-first.png`)

- The tree wall was a flat green field: the conifer stamps used the same value as
  the base, so no silhouette read at 1×. The canopy looked like a painted band.
- The ballast was one blue-grey slab with a straight top edge; gravel and asphalt
  were indistinguishable, and the dead grass carried too much of the frame in a
  bright ochre that broke the same-world sheet against the station and Double R lots.
- The car read as a kitchen cabinet: a flat red slab north, a flat pale rectangle
  inside, a red band south. No boarding, no recessed panels, no roof-cut edge, no
  door track, no trucks that read as trucks.
- The ring was invisible at 1×; the cards were invisible; the mound, the seat and
  the beam were three brown/grey boxes.
- The creek had no bank, and the bridge deck read as a light plank with no worn
  half and no contact shadow.
- The trail to the cut was a bright continuous olive stripe that read as a wall.

## What polish did

1. **Vegetation.** Base of every wall is `forestDeep`; conifers are stamped every
   8 px at four heights, alternating a lit and an unlit value, clipped to their
   band so nothing spills onto walkable ground. Side walls use the same family
   seen edge-on.
2. **Materials separated by value structure.** Ballast is a dark bed + mid patches
   + eighteen placed pale stones and six dark ones; dead grass is a darker ochre
   with drifts and 2 px tufts; creek slate has a darker channel, a 1 px bank line
   each side and a wet-stone strip; the dust film inside the car is a single flat
   value with a 2 px rim shade only where the walls meet it.
3. **Ballast now carries the clearing** instead of the dead grass, which moved the
   scene back into the world's cool slate family without adopting the dusk grade.
4. **Car hierarchy.** North face: top rail, boarded body with two recessed panels,
   sill. Rims: outer shell, boarded body, inner face, plus a 2 px lighter cut edge
   all the way round so the missing roof reads as a cut. South face: door track,
   plank seams, one faded panel east of the door, sill, two black trucks with
   wheels clear of the door column.
5. **Props made legible at 1×:** ring 7×7 with a dark centre on the beam, mound as
   a three-value heap with a paper corner, bench with back/seat/legs/torn patch and
   two cards with one pip, corrugated sheet with five ribs and one highlight.
6. **Rails** are ties over a dark bed with two steel lines. They start at the east
   end of the planks (col 5, row 7, still walkable path) and run unbroken to the
   car's west face and on under it; the upper line vanishes behind the south face
   and the lower one ends on the buffer block at the east trucks. Nothing continues
   east. (D4 note 1.)
7. **Bridge** deck: east half weathered, west (town) half two values paler, six 1 px
   joints, end caps, contact shadow on the water. Parapets thinned to 2 px posts and
   a single rail per side; the south parapet repaints over the player (footY 144).
8. **Trail** to the cut broken into four worn segments instead of one stripe.
9. **D4 note 2:** the flat grey plate at cols 5-8 rows 6-7 north of the rails was
   removed. It was not in the brief and read as a concrete platform. West of the
   car the dead grass now runs down to the ballast bed, as in the Golden Concept,
   and the strip that remains is the bed's own wet gravel in the three-value
   grammar (dark base, mid patches, pale stones) with a stepped edge.

## Parity checklist

- [x] **Three zones read at 1×** — bridge + creek left, car centre, cut + sign right
      (`native-1x.png`).
- [x] **Rails visibly stop under the east trucks**; east of the car there is only
      dead grass and the foot tracks.
- [x] **From (12,6)/(13,6) everything is on screen** — door, mound, seat + cards,
      sheet, beam + ring, stove, no rim occluding them (`ingame-investigation.png`).
- [x] **Worn planks two values; stake with tape on the town bank** at (2,6).
- [~] **Foot tracks are the only diagonals** — true. "Rails the only straight lines"
      is met in spirit only: the bridge parapets, the car seams and the sign are
      also straight. The rails are the only *long* straight run.
- [x] **One ember, no other saturated warm** — test-enforced: exactly one cluster
      with `r - g ≥ 80` in the whole map, inside the car bounds, and it is the
      warmest mark on the frame.
- [x] **48 px north face on the canopy and on the car's north rim** — rows 0-2 and
      rows 2-3 respectively; player scale is the shared HeartGold atlas, identical
      to the station exterior (`same-world-sheet.png`).
- [x] **After s1 the ring is gone; after east_route_confirmed the tape is on the
      door and the stake at the bridge** (`overlay-post-report.png`,
      `hawk-states.png` panel 3). Painted by the scene module on the flag, never a
      second map.
- [x] **Nothing from the town dusk grade; no lit openings.**

## Deviations from the brief, and why

1. **Row 2 is solid** (trees / car north wall / sign) instead of walkable ground.
   The brief asks for a 48 px north canopy face; a 48 px face over walkable row 2
   would hide walkable tiles and break Bible §8. Making row 2 part of the wall gives
   a real 48 px face everywhere. The creek still runs from row 2.
2. **The door is two tiles, (13,7) and (14,7)**, not one. `test/walkthrough.js`
   treats authored interact objects as blocking, and the mound object at (13,6) sat
   on the only gateway into the interior, sealing the car and losing the `anello`
   clue. A two-leaf sliding door also matches Bible §3 (entrances are two leaves).
   The x = 13 column (door → mound → beam/ring) is unchanged.
3. **Bridge planks at cols 3-4**, not the brief's 2-3: the creek is at 3-4, so 2-3
   would not have spanned it. Col 2 and col 5 are the banks.
4. **Rail cells are 6..8 on row 7** — the car rim owns 9..17 — while the painted
   rails run through to the buffer block under the east trucks.
5. **`tracks` cells** are the walkable diagonal only, not the whole 18..21 × 2..6
   rectangle, which included the sign and two tree tiles.
6. **Sign is an arrow-shaped board with three glyph lines** (`ONE` / `EYED` /
   `JACKS`). `ONE EYED` at scale 1 is 31 px of native font and does not fit a
   two-tile board.
7. **Value ladder.** The brief's stated order cannot be satisfied by the brief's own
   hexes (its dust is lighter than its faded panel, its dead grass lighter than its
   pale stones). The built ladder is: county tape > car faded panel > interior dust
   > pale ballast stones > dead grass > ballast base > creek slate > evergreen. The
   five gates the brief asks the test to enforce all hold and are asserted.
8. **`canonical-sync.manifest.json` has no runtime-js list** (only narrative JSON,
   sprite sheets and portrait roots), so the three new files were registered in
   `index.html` and `test/retro-scene.html` and nothing was added to the manifest.

## Captures

| file | what |
|---|---|
| `native-first.png` | 1×, full map, no actors, before polish |
| `native-1x.png` | 1×, full map, polished |
| `native-5x.png` | 5× integer, full map, polished |
| `ingame-investigation.png` | Cooper (12,6) facing up, Hawk at the door, narrative on |
| `hawk-states.png` | three-panel sheet: bridge / door / cut, Cooper present in each |
| `overlay-post-report.png` | `east_route_confirmed` + `s1`: tape on the door, stake at the bridge, ring gone |
| `same-world-sheet.png` | traincar 1× beside the station exterior, Double R lot, room 315 and the hospital ward |
