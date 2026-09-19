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
