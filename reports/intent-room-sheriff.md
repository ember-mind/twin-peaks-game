# Intent-driven environment pilot: Sheriff's Station

## M0 ownership map

| Concern | Canonical owner | Program boundary |
| --- | --- | --- |
| Environment membership | `js/world-catalog.js` → immutable `GAME.World` | `program` attaches to interior environment. |
| Collision and furniture cells | `js/maps.js`, checked against `js/sheriffs-station-scene.js` footprints | Anchor IDs only; native scene exposes its existing layout to the map by reference for install-time ID checks. No copied cells. |
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

The Program now gives selected furniture an optional contribution: function, atmosphere, composition, and other reasons can coexist. This is not a prop inventory. Relationships are limited to `NEAR` (two footprint masses touch within one tile) and `REACHABLE` (a walkable route exists between existing scene targets). No orientation, direct corridor, or exact prop positions are claimed. Registration resolves IDs against the native layout when available; pilot tests verify actual adjacency and route geometry against the canonical scene/map.

| M1 mismatch | Smallest change | Observed after |
| --- | --- | --- |
| Rug competed with primary work desk. | Shrink and mute only the native rug's value blocks. | Center reads quieter; desk/reception remain visually distinct. |
| Warm task light was weak against broad cool floor. | Expand the desk lamp's stepped reflection by a few native pixels. | Warm accent reads locally, without a global light wash. |

Before: [native frame](../artifacts/intent-room-sheriff/before-native.png). After: [M2 native frame](../artifacts/intent-room-sheriff/after-m2-native.png). Both use the same scene, spawn `(7,10)`, facing up, narrative population enabled. [Builder Program inspector](../artifacts/intent-room-sheriff/builder-program.png) is a separate read-only authoring view, not the production game frame. Furniture footprints, map rows, door registry, actor windows, and collisions are unchanged. The change is authored visual weighting, not generated clutter.

PNG SHA-256: before `5c0cebfde4c21976ba3f95e4224283a3a3b92ae05b5f275beedf8b3b0ff495b4`; after `691b2bb39484bab897887f00319fe34a5857a2f93e0fa5acceb681b556fde2ee`.

## M3 ordinary life and narrative boundary

The Program classifies existing mug/steam, desk papers/phone/lamp, file-bank plant, reception forms/tray/phone, and secondary desk stationery as **ambient residue**. These are visible in native art already; steam and lamp variation already have Ambient Life registrations. No random scattering, new prop registry, or duplicate artwork was added in M3. The M2 after frame is also the M3 frame.

No Sheriff's Station detail in the current scene safely proves a specific canonical event. The pilot therefore has **no narrative residue**. The current schema rejects a `residue.narrative` field rather than accepting unconditioned story claims. A later narrative-residue entry should be authored only after naming an existing durable Narrative Runtime condition, deriving a read-only scene-state boolean (as traincar art already does), and rendering a non-interactive trace from that state. Program metadata would describe that trace; Narrative Runtime would remain its owner. No new story fact is introduced here.

Independent source audit matched all five ambient entries to visible native art. Anchor IDs are checked against scene footprints in the pilot test. The wording of a detail is an authoring claim, not something a schema can prove; Room Critic must compare it with the rendered scene.

## M4 Room Critic — first applied review

Method: [Room Critic contract](../docs/environment-program-room-critic.md). Compared the two actual native frames, Program claims, authored art, scene footprint/targets, ambient registrations, and traversal tests. A single frame cannot prove animation timing. Findings below distinguish what works from remaining gaps; no numeric score is used.

| Level / target | Observation and why it matters | Suggested change | Evidence / confidence |
| --- | --- | --- | --- |
| ROOM / identity | Signage, records, reception, desks, and occupied cast make a working small-town station legible. Familiar routine reads; subtle unease is mostly in cool light, not a specific story claim. | Keep identity; avoid event-shaped clutter. | Native after frame + art; high. |
| ROOM / focal hierarchy | Muted rug no longer competes as strongly with warm sheriff desk. Desk remains small at full-room scale, so `warm-focus` is improved but not absolute. | If refining, tune local desk contrast/light only; do not darken aisle again. | Before/after native frames; high. |
| ROOM / circulation | Entry-to-work path stays open and visual center is quieter. Map route to desk is walkable, but `REACHABLE` does not prove a direct sightline or actor occupancy at every moment. | Keep central negative space; recheck in live play after any future prop move. | Native frames + 83/83 connected-floor and target-route tests; high. |
| GROUP / shared-work | Reused right-desk art makes two workstations too similar; papers exist but read weakly at native scale. This makes secondary work feel less lived-in than Program claims. | Differentiate one existing desk with a tiny authored surface/value change, only if a later art pass warrants it. | `drawOfficeDesk` used twice + after frame; high. |
| GROUP / reception | Counter, return, phone, tray, and forms clearly mark public/staff boundary. Return's value is close to counter, so corner turn takes a moment to read. | Slightly clarify return edge/value; preserve footprint and route. | Native after frame + art; medium-high. |
| GROUP / waiting | Low bench occupies southwest corner without stealing focus or blocking arrival. It makes waiting understandable. | Keep quiet silhouette. | Native after frame + walkable layout; high. |
| OBJECT / rug | Its role is compositional, not functional: it gives aisle texture and rhythm. Removing it entirely would flatten center; old high-contrast version distracted from desk. | Keep muted version. | Before/after native frames; high. |
| OBJECT / file-bank plant | Plant breaks repeated steel silhouette and softens institutional mass. Removing it would make left wall colder without improving navigation. | Keep; no second plant. | Native after frame + `drawFiles`; high. |
| OBJECT / mug and steam | Mug marks everyday work, and existing steam gives one continuous ambient sign of life. Static PNG alone cannot judge timing, but Ambient Life tests verify continuous behavior. | Keep; do not duplicate with a prop. | Native art + ambient registration/test; high. |

Independent critic also questioned the rear frosted door from a static frame. Source inspection shows `rear-door-presence` already uses an Ambient Life light-variation archetype, so “static door” is **not** accepted as a finding. A timed capture would be needed to judge its actual motion quality.

## Integration review and response

Independent hostile review found **no second World Engine**: Program carries no coordinates, actor placement, narrative flags, doors, collision, prop registry, or scene lifecycle. It found a real stale-anchor risk. Response: native Sheriff installer now exposes its existing `layout` by a non-enumerable, non-replaceable reference on the map; World Engine resolves group, contribution, relationship, and residue IDs at registration. A loaded map with Program anchors but no native layout fails loudly. Registration fails on unknown IDs; pilot tests still check actual adjacency and route reachability. No new coordinate table was introduced.

Review also noted free-form ambient prose cannot be mechanically proven non-narrative. Current entries were checked against existing art and Ambient Life; `residue.narrative` is rejected until a canonical-state binding is designed. A closed, explicit Program shape in World Engine is intentional for this one pilot; no generic decorator/solver or editable Builder export was added. Visual review found M2 improvement modest, so a small native-art rectangle sentinel now guards the muted rug and desk reflection. Program registration also has a no-map-mutation test.

## Gate status

| Gate | Result | Notes |
| --- | --- | --- |
| CI-pinned Node 24 release suite | 99/100 | Only `narrative-validate-m10.js` fails: four verbatim-lock drifts reproduced on unmodified main. [Evidence](../artifacts/intent-room-sheriff/release-final-node24/report.json). |
| Local Node 26 release suite | 98/100 | Same M10 drift plus cast-PNG byte-compression mismatch; latter disappears under CI Node 24, and decoded pixel data matches. Not a Sheriff branch regression. |
| Sheriff native/location/door/ambient/population | PASS | Includes connected floor, depth, new art sentinels, and ambient containment. |
| World Engine + Builder data | PASS | Optional Program, deep-freeze, anchor binding, spatial pilot checks. |
| Smoke + walkthrough | PASS | Walkthrough reaches finale, 85 acquisitions. |
| Genmaps, world-door-equality, cast-continuity, narrative-finale | PASS | Door registry 59 descriptors; finale 27/27. |
| World Builder Chrome | 194/194 PASS | Real read-only inspector, including all Program sections and no edit controls; all existing edit/export cases pass. |
| Act 3 Chrome | 189/189 PASS | Three paths; one non-assertion 404 console entry. |
| Act 4 Chrome `--path=all` | 530/530 PASS | Four paths, including station arrival, Truman interaction, and return. One non-assertion favicon 404 from the test server. |

M10 drift keys: `m10.b5.affioramento.list`, `m10.b6.probatorio.p04`, `m10.b6.probatorio.p10`, `m10.b6.intuitivo.p13` (4/1773). All four fail identically in the main checkout; this pilot does not edit narrative content. CI uses Node 24. Node 26's separate cast-PNG failure is a byte-level zlib compression difference with matching decoded pixels, not a changed sprite; it disappears on Node 24.
