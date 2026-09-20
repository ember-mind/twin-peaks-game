# Six rooms against the bar — fresh-context critic, 2026-09-19

Critic: a separate Opus agent that saw only PNGs (native 256×192 and 3× upscales captured
from local main after the OEJ round 2 and lobby light merges, before woods round 2) plus two
references: the owner's interior art-direction board (`.gauntlet/diner-seating/evidence/
user-earlier-board.png`) and the town target (`artifacts/reference/target.png`). No code, no
builder notes, no scores from earlier rounds. Floor for shipping: 7/10.

| room | score | winner | biggest gap |
| --- | ---: | --- | --- |
| Double R diner | 7 | bar | "DOUBLE R" lettering mushy, D and B collapse into the board |
| Roadhouse (M12 props) | 7 | bar | lower-middle table/chair cluster reads as scattered debris; stage lit as flat as the room |
| Glastonbury Grove | 6 | bar | one sycamore sprite stamped at identical scale around the pool; pool barely darker than the clearing |
| Great Northern lobby | 6 | bar | runner is a flat vertical band splitting the room; log wall repeats at uniform contrast |
| Palmer house | 5 | bar | upper third is a dead tan band; every object an island; Cooper cut by the door sill |
| One Eyed Jacks | 5 | bar | four identical tables in a mirrored grid read as a tilemap test; no floor-to-wall break |

Ranking: diner, Roadhouse, grove, lobby, Palmer, OEJ.
Priority named by the critic: OEJ's symmetric grid, because it makes the room read as tooling
and blocks the floor/wall separation everything else there depends on.

## The systemic finding

In every room the critic wrote a variant of "no character carries a contact shadow, so the
figure sits on the floor pattern rather than in the room". That is not a per-room paint
defect: actors are drawn by `js/chars.js` `drawChar` with no grounding shadow, in every
scene. Fixing it is one engine change plus a re-pin of every golden that shows an actor.
It is the lead's call (it touches every room's evidence at once); it is not in any builder's
fence tonight.

## Dispatched from this verdict

- OEJ round 3 (`lead/oej-casino-3`): per-table identity and orientation, carpet vs wall
  value break with a skirting base line, the blank sign, sconces/bottles that resolve at 1×.
- Palmer round 3 (`lead/palmer-house-3`): panelling/cornice/photo cluster in the upper band,
  seating group clustered on the rug, Cooper standing on the sill instead of cut by it, fan
  as a fixture not a cross.
- Woods round 2 (queued for the same builder): three or four sycamore variants, pool
  contrast, the southern canopy vs Cooper's feet.
- Lobby and diner gaps (runner band, wall repeat; sign lettering, checker tint and alignment)
  are open for the next builder slot.

## Pass 2 — a second fresh critic after the rounds above (same references, same camera)

| room | pass 1 | pass 2 | pass-2 biggest gap |
| --- | ---: | ---: | --- |
| Double R diner | 7 | 7 | counter front reads as a flat red slab, no stool bases or footrail |
| Roadhouse | 7 | 7 | dance floor between stage and tables is a flat brown void |
| Great Northern lobby | 6 | 6 | left half is a plank wall with only the head and the fireplace |
| Glastonbury Grove | 6 | 6 | sycamores still read as one repeated sprite at 1× (three crown variants do not survive native size) |
| Palmer house | 5 | 5 | right third is empty floorboards with one rug and one cabinet |
| One Eyed Jacks | 5 | 5 | four identical table rectangles at the corners, no occlusion, "wall decals on the floor" |

Ranking pass 2: diner, Roadhouse, lobby, grove, Palmer, OEJ. Every room still BAR WINS.
Priority named by pass 2: One Eyed Jacks, "its four identical unoccupied gaming tables make the
room's whole purpose read as placeholder": occupied tables need seated patrons, which is a Cast
Presence and map decision, not paint.

### What this says

Five builder rounds (OEJ 3, Palmer 3, lobby, woods 2, diner) each closed the defect the
first critic named, and the second critic moved to the next defect at the same score. The
new gaps are not paint gaps:

1. **Empty centres.** Palmer's right third, OEJ's centre carpet, the Roadhouse dance floor,
   the lobby's left half: the map rows put every solid cell on the perimeter, and a builder
   under the "no row changes" fence cannot furnish a walkable centre without burying actors.
   Filling them means map-row edits (new solid cells, collision, Cast Presence windows,
   traversal tests), a world-design decision, not an art one.
2. **Repetition the map dictates.** Four `t` pairs in OEJ, three tables in the Roadhouse,
   eight ring trees: the positions are canonical, so "identical sprites in a grid" persists
   until either the rows vary or the sprites get silhouette differences big enough to read
   at 1× (three crown variants were not enough).
3. **No actor contact shadow** (both critics, every room). One engine change in the actor
   draw path plus a re-pin of every golden with a body in it.

Recommendation: stop per-room paint rounds; the next lift comes from (3) as a single
engine change, then a map-row pass per room with the World Builder (the M10b props editor
already exists for the Roadhouse), each followed by one paint round and one fresh critic.

## Pass 3 — 2026-09-20, after the engine shadow and the first map-row passes

Main e31238c switched every indoor actor to a dark neutral 14x5 contact shadow.
Palmer (lead/palmer-rows, d791924) gained five solid cells: piano and phonograph on the
east wall, club chair and telephone table on the braided rug, a wing chair north of the
rug and a coffee table on it. One Eyed Jacks (lead/oej-rows) broke the mirrored grid:
three-cell craps and two-cell blackjack on row 2, a three-cell roulette on the centre
carpet, a poker oval with a free stool on row 7, three painted seated patrons.
A third fresh critic (PNG only, same references) scored the two rooms:

| room | pass 2 | pass 3 | pass-3 biggest gap |
| --- | ---: | ---: | --- |
| Palmer house | 5 | 6 | upper third a bare tan band; sofa and cross float; mid wall repeats one sconce-and-shelf unit four times |
| One Eyed Jacks | 5 | 5 | lower half of the floor empty (SW and SE quadrants); tables read as identical stamps; "no contact shadows at all" |

Measured on the critic's frames (mean luma of the native 256x192, share of pixels above
160): Palmer 94.5 / 10.6%, One Eyed Jacks 40.7 / 1.7%. The HGSS venue references Deep
measured for the Roadhouse gauntlet sit at mean luma 60–125 with 3.9–13.4% light pixels.
The OEJ shadow, the patrons and the table differences exist in the frame and do not
survive 1x because the whole room is a value band too dark to carry them. The next OEJ
round is therefore a value-range round with a number to hit (mean luma >= 60, light
pixels >= 4%, true black under 2%) plus furniture for the two southern quadrants, not
another furniture-only pass.

## Pass 4 — 2026-09-20, One Eyed Jacks after the value-range round

lead/oej-values (4ad777f) lifted the frame to mean luma 70.9, 4.9% light pixels, 0.25%
true black (from 40.7 / 1.7% / 1.75%), inverted the value order so the carpet is the lit
plane and the drapes stay in shadow, and furnished the south: two slot machines on the west
drape, a cocktail table with its stool, a velvet rope at the south-east corner. The whole-
frame numbers are now assertions in `test/oej-native.js` (`tools/frame-values.js`).

| room | pass 3 | pass 4 | pass-4 biggest gap |
| --- | ---: | ---: | --- |
| One Eyed Jacks | 5 | 6 | right-centre floor a bare pink expanse; tables read as islands, not a pit; floor has no carpet pattern or border |

The critic's priority: the floor. A patterned carpet with a bordered pit under the tables
closes the dead right zone and turns islands into one room. The contact shadow is still
"almost none" at 1x: the ellipse's widest row sits on the feet's own row, so the sprite
covers most of it; the next engine tweak moves the mass one row below the feet.

## Pass 5 — 2026-09-20, One Eyed Jacks after the floor round

lead/oej-floor (3440d07) gave the carpet a weave and a beaded border, a bordered pit under
the tables, a standing croupier behind the blackjack, a stool, two standing lamps; the
actor shadow moved one row below the feet (lead/actor-shadow-2). Frame numbers held at
mean luma 70.4, 5.3% light, 0.3% black.

| room | pass 4 | pass 5 | pass-5 biggest gap |
| --- | ---: | ---: | --- |
| One Eyed Jacks | 6 | 6 | mid floor between the bar and the lower tables an empty carpet band; tables still one stamp at 1x; "actors float, no contact shadow under any figure" |

### What this says

Three rounds on OEJ today (rows, values, floor) moved it 5 -> 6 -> 6 -> 6. The three
persistent gaps are now structural to the room as designed:

1. The centre band is the circulation the cast needs (door -> jacques at 7,5, -> audrey
   at 13,7, -> hawk at 6,8). Furnishing it means moving cast cells and the act-3 route.
2. Tables "read as one stamp" at 1x whatever their cloth marks: a 24x16 green rectangle
   is a green rectangle at native size. Only a different silhouette per table (a round
   roulette, a raised craps rail, a kidney blackjack) changes that, which is a sprite
   redesign, not a paint round.
3. The contact shadow exists (dark ellipse, rows 16-19, verified on 8x crops) and the
   critic still writes "no contact shadow". At 1x a 16x4 ellipse under a 16 px sprite is
   a two-pixel-high smudge; the HGSS grammar Deep measured gets its grounding from
   lighter floors and a full-width ellipse that the sprite does not cover.

Recommendation: stop OEJ rounds at 6. It is an act-3 room with short screen time. If the
owner wants it at 7, the lift is a table silhouette redesign plus a review of the cast
lanes, both design decisions, not builder rounds. Palmer (6), lobby (6) and grove (6) are
in the same position: one honest engine/rows pass each moved them one point, and the
next point costs a design call per room.
