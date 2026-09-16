# Great Northern lobby — spatial study

Status: architectural brief for next native-scene rebuild, not a claim that
current scene passes. Visual bar: **bottom panel only** of
`assets/ref/great-northern-lobby-sheet.png`. Current production comparison:
`artifacts/art-pass-e/e8-architecture/after-cast.png`.

## What this room does

This is a working hotel lobby, not a collection of recognizable props. A guest
arrives, understands where to check in, can wait comfortably, and can reach the
upper rooms without crossing somebody else's activity. Staff need a work side
of the desk, sight of the entrance, and access to keys and luggage. These uses
determine the plan before decoration.

The intended first read from the south entrance is **arrival → reception →
rooms**, with **waiting** available to one side. A guest should not need to
walk through lounge furniture or behind the clerk to reach stairs. Reception
and stairs should be visible choices from the entry frame; the rear route
should feel deeper than the foreground threshold.

## Plan and object relationships

| Zone | Placement | Why it belongs there |
|---|---|---|
| Arrival | South double doors, clear central floor and runner to the rear receiving space | Establishes orientation and lets several guests pass. Runner must not terminate in a chair, desk, or solid tile. |
| Reception | Right perimeter, beside but not across the route to stairs; counter faces arriving guests | Clerk can see entry and stair approach. Desk forms guest/staff boundary, not freestanding island. |
| Staff work | Behind counter, against wall: Ben, key pigeonholes, room register, Great Northern sign, desk lamp, and a side-entry service aisle | Objects operate together. Sign and storage have a supporting wall; bell sits on guest edge. Staff can enter behind desk without climbing over it. |
| Upper rooms | Stair flight against far-right wall, open foot, rail and red runner ending at real hall door | Visual stairs and playable Room 315 connection describe one destination. Guest route does not pass through desk or lounge. |
| Waiting | Left-side fireplace attached to wall, bear above, two chairs angled toward fire and each other, small table and one bounded rug | Creates social pocket outside circulation; table serves seats rather than blocking route. |
| Luggage | Small bay near reception/stair service edge | Bellhop can collect bags without parking cart across entry runner or lounge. |
| Plants and wall art | At structural bays and thresholds, clear of approach tiles | Human scale, softness and hotel identity; never conceal door, clerk or route. |
| Chandelier and practical lamps | Chandelier over open arrival volume; desk lamp at worktop; fire in hearth | Sources explain nearby light on parquet, stone, wood and fabric. |

Reference bottom panel places hearth/lounge left, paired rear doors on the
arrival axis, reception right, and stairs at far right. Its broad, shallow
composition is useful evidence about **relationships**, not permission to
paint a false door or a carpet over solid cells. Existing 16×12-tile camera
shows less than a wider map; composition must be checked at actual entry and
hall-arrival frames, not only on a whole-map illustration.

## Current scene: observed failure

Current map is 18×12 tiles (288×192 map pixels), viewed through a 16×12-tile
retro camera. Counter collision occupies `(4..7,8)`, sign sits behind it, and
Ben stands at `(5,7)`. In production capture the counter still projects into
centre-left arrival space. Calling it “fixed to the west wall” was incorrect:
wall-mounted sign does not make protruding counter read as perimeter
construction. Hearth and lounge occupy central axis; runner stops at lounge.
Stairs dominate right edge, while arrival lacks a convincing rear destination.
Lighting exists and animates, but source-to-material response is too faint.

Moving only pixels would leave invisible counter/chair collision and mislead
players. Adding width without relocating functions would merely add empty
floor. Redesign must change map geometry, authored art, lobby-side connection
coordinates, Cast Presence positions and tests as one coherent revision.

## Rebuild study, not final coordinates

Start with **20×12 tiles** as smallest broader plan worth testing (320×192 map
pixels, 256×192 viewport). Keep room depth so entrance, lounge, desk and rear
wall share one camera-language. Stage fireplace/lounge in west third, clear
arrival spine near centre, reception/staff zone in east third, and stair/hall
at east edge. Place luggage beside service route. Move lobby-side town and
Room 315 connection endpoints and Ben/Audrey body tiles only where plan and
walkability require; update registry-generated data and continuity fixtures
together. Room 315 interior and protected `js/retro.js`,
`js/retro-authored.js`, `js/tiles.js` remain untouched.

20 tiles is a **hypothesis**, not a visual pass. Viewport shows only 16 tiles:
verify entry shot reveals reception and stair approach simultaneously, and
walking toward hall reveals full stair without losing route meaning. If 20
tiles cannot do both, revise plan or camera presentation before adding more
width. Never widen to 24 solely to hide layout defects outside frame.

Reception requires a continuous **staff-side aisle at least one walkable tile
wide** behind its solid counter. An open end or service gate connects that
aisle to the hotel's service/luggage side, clear of stair foot and guest queue.
Ben's body tile sits inside this aisle, with access to keys, register and bag
handling. Counter cannot seal him into a decorative alcove. A reachable guest
interaction tile remains on the opposite side of the counter.

## Acceptance checks for a livable level

1. From entry, identify check-in, waiting and upstairs without moving or
reading HUD; no large furniture in central arrival route.
2. Walk entry → guest side of counter, entry → stair foot → actual hall door,
entry → lounge, and lounge → desk. Each route uses adjacent walkable tiles and
does not pass through an object silhouette.
3. Trace staff-service entry → Ben's aisle → key/register work position →
luggage bay on walkable tiles, without crossing a solid counter, chair or
stair. Guest-side desk approach stays separate. Ben remains interactable
across the counter; Audrey stays in public guest space; neither body blocks
entrance, stair or counter approach.
4. Counter, hearth, stairs, sign, luggage and rugs each have plausible support
and use. Visible solids match collision exactly; decoration never masquerades
as a usable door or stair.
5. Light has visible receivers: fire warms stone and nearby chair faces; desk
lamp warms worktop/cubbies; chandelier softens centre floor. Existing ambient
archetypes animate slowly, with distinct but non-busy states.
6. Native 256×192 entry and hall frames preserve readable silhouettes and
reference material hierarchy. Independent critic judges both against bottom
reference panel; each important unit and integrated room must reach 8/10.
7. Room 315 interior, protected renderer files, full door graph, Cast
Continuity, narrative, smoke, walkthrough, retro/mobile production and Act 3/4
browser routes remain valid after coordinate migration.

The test is not “does every prop appear?” It is “can a guest use this room,
and does the image make that use immediately believable?”
