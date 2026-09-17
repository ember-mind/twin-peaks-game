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

## M2 composition and spatial claims

The Program now gives selected furniture an optional contribution: function, atmosphere, composition, and other reasons can coexist. This is not a prop inventory. Relationships are limited to `NEAR` (two footprint masses touch within one tile) and `REACHABLE` (a walkable route exists between existing scene targets). No orientation, direct corridor, or exact prop positions are claimed. Generic registration checks shape; pilot tests resolve Sheriff anchors against canonical scene layout.

| M1 mismatch | Smallest change | Observed after |
| --- | --- | --- |
| Rug competed with primary work desk. | Shrink and mute only the native rug's value blocks. | Center reads quieter; desk/reception remain visually distinct. |
| Warm task light was weak against broad cool floor. | Expand the desk lamp's stepped reflection by a few native pixels. | Warm accent reads locally, without a global light wash. |

Before: [native frame](../artifacts/intent-room-sheriff/before-native.png). After: [M2 native frame](../artifacts/intent-room-sheriff/after-m2-native.png). Both use the same scene, spawn `(7,10)`, facing up, narrative population enabled. Furniture footprints, map rows, door registry, actor windows, and collisions are unchanged. The change is authored visual weighting, not generated clutter.

## M3 ordinary life and narrative boundary

The Program classifies existing mug/steam, desk papers/phone/lamp, file-bank plant, reception forms/tray/phone, and secondary desk stationery as **ambient residue**. These are visible in native art already; steam and lamp variation already have Ambient Life registrations. No random scattering, new prop registry, or duplicate artwork was added in M3. The M2 after frame is also the M3 frame.

No Sheriff's Station detail in the current scene safely proves a specific canonical event. The pilot therefore has **no narrative residue**. The current schema rejects a `residue.narrative` field rather than accepting unconditioned story claims. A later narrative-residue entry should be authored only after naming an existing durable Narrative Runtime condition, deriving a read-only scene-state boolean (as traincar art already does), and rendering a non-interactive trace from that state. Program metadata would describe that trace; Narrative Runtime would remain its owner. No new story fact is introduced here.

Independent source audit matched all five ambient entries to visible native art. Anchor IDs are checked against scene footprints in the pilot test. The wording of a detail is an authoring claim, not something a schema can prove; Room Critic must compare it with the rendered scene.
