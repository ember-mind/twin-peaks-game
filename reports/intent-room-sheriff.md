# Intent-driven environment pilot: Sheriff's Station

## M0 ownership map

| Concern | Canonical owner | Program boundary |
| --- | --- | --- |
| Environment membership | `js/world-catalog.js` → immutable `GAME.World` | `program` attaches to interior environment. |
| Collision and furniture cells | `js/maps.js`, checked against `js/sheriffs-station-scene.js` footprints | Anchor IDs only; no copied cells. |
| Visual furniture/detail | `js/sheriffs-station-art.js` | Descriptive claims only. |
| Doors and connections | `world/connections.json` installer | Not repeated. |
| Named people | Cast Presence windows and Narrative Runtime | Activities never place actors. |
| Ambient animation | Ambient Life scene spec | Program may describe existing residue, not animate it. |
| Scene objects/props | `world/scene-objects.json` / `world/props.json` | Sheriff has no registered objects or props; native art is not recast as props. |
| Builder | Frozen projection of `GAME.World.catalog` and live map/registry | Read-only Program inspector; no Program export path. |

## M1 reality check

Capture: [native before](../artifacts/intent-room-sheriff/before-native.png), `test/native-shot.js --map=sheriff --x=7 --y=10 --dir=up --narrative=1`. This is the actual native 256×192 frame, not concept art. Baseline Cast Presence includes four station bodies.

| Claim | Observed result | Verdict | Why |
| --- | --- | --- | --- |
| Sheriff work desk and lamp should be warm primary focus. | Small lamp pool is visible, but central rug occupies more high-contrast area. | PARTIAL | Focal hierarchy tilts toward floor graphic. |
| Density should sit around edges; center should read as circulation. | Files/reception/bench and right desks stay at edges; rug fills central quiet space. | PARTIAL | Route is open, but visually busy in center. |
| Steel/green should be softened by wood, paper, plant, warm light. | All four exist in native art; warm light is relatively weak at full-room scale. | PARTIAL | Material contrast works, emphasis does not fully land. |
| Asymmetry should feel controlled. | Left reception/files and right paired desks balance without exact mirror. | MATCH | Strong large-scale arrangement, though right desks repeat closely. |

M1 metadata records observed design aims. It does not claim these aims already succeed.
