# One Eyed Jacks — native art rounds

Camera for every shot: `node test/native-shot.js --map=oej --x=8 --y=8 --dir=up --narrative=1`.
`--narrative=1` already places Jacques at 7,5, so every round below IS the act-3
state with Jacques at the counter.

- **baseline** — generic retro interior: flat purple carpet, a green cross where the
  C run and a stray vertical band are painted, desk-shaped tables, red pillars. No
  casino reading at all.
- **round 1** — first native pass: red velvet drapes on all four walls with a gold rod
  and two chandelier silhouettes, burgundy carpet with a gold lattice, four green-felt
  tables (roulette north, cards south), four velvet stools, the 96px bar counter with a
  back shelf of bottles and two gold lamps, the service cabinet, wall sconces with floor
  pools, and the double door in a recessed jamb.
- **round 2** — the engine centres the 160px map in the 192px viewport, so the painted
  band is map y in [-16,176), not [0,192). Round 1 left a black strip along the top.
  Painted the ceiling, a swagged drape head and a taller north wall; ended the south
  face at 176. Wrong now: tables read as brown boxes with a green sliver.
- **round 3** — rebuilt the tables: thin mahogany rail, felt bed twice as tall, a round
  roulette wheel north and a dealt card layout south. Wrong now: the back bar is a thin
  line with bottle-sticks floating above a dark gap.
- **round 4** — rebuilt the back bar back to front: mirrored recess, the shelf plank the
  bottles stand on, gold nosing, padded front, brass footrail. Wrong now: the sconce
  light pools are detached horizontal dashes in the middle of the carpet.
- **round 5** — narrowed the sconces (the wide receiving bars read as glitch dashes on
  the drape), darkened the roulette body, darkened the contact shadows so they read on
  burgundy. Wrong now: the floor pools are still detached blocks.
- **round 6** — anchored each pool to its wall as a wedge that fades outward; shrank the
  roulette to a dark disc with a gold hub. Wrong now: the wedge steps read as bars.
- **round 7** — gave the wedges a quiet base and finer chandelier candles. Wrong now:
  the chandelier flames lost their read.
- **round 8** — restored a lit halo on each candle. Final frame:
  `.gauntlet/oej-casino/evidence/oej-native-golden.png` (= round-8.png) and its 3x.
  Still wrong, honestly: the back-bar bottles are near-noise at native size, the roulette
  disc reads as a dark hole in the felt rather than a wheel, the pool wedges are still
  visibly stepped, and the room's centre is a large empty carpet the map geometry forces.
