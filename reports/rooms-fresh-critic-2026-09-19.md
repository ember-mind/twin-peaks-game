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
