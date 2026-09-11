# World Engine v0.1

## 1. Purpose

World Engine v0.1 is the implemented data layer and registration boundary for authored places. It records how existing playable environments belong to a location and which existing connections join them. It orchestrates; it does not replace maps, renderer, movement, saves, Ambient Life, reactions, or narrative.

## 2. Domain model

| Concept | Represents / owns | References | Does not own / lifecycle |
|---|---|---|---|
| World catalog | Named set of locations | Location records | No runtime simulation, map data, renderer, or save state. Bootstrap registers it once. |
| Location | Semantic player-facing place with one or more environments and connections | Environment IDs, connection IDs | No tile map, collision, art, trigger behavior, or transition execution. |
| Environment | One playable authored scene inside location | Existing `GAME.Maps` scene ID; existing scene registrations | No location routing policy, art generation, or generic material policy. Existing map/scene installer owns registration. |
| Connection | Semantic paired traversal between environments | Existing `GAME.LocationConnections` record | No fade, movement, collision, save, or arrival-event handling. Existing primitive installs it. |

`Location` is justified now: Double R is one named place with exterior and interior environments joined by one named entrance. A location may also contain one environment: traincar crossing and One Eyed Jacks are separate player-facing places. No deeper hierarchy is justified.

## 3. Ownership boundaries

| System | World Engine v0.1 role |
|---|---|
| Catalog, location/environment membership, connection membership | **IMPLEMENTED.** World Engine owns immutable declarative records and lookup indexes. |
| `GAME.Maps`, scene installers, renderer hooks, Ambient Life, Environment Reactions, `LocationConnections` | **REFERENCED EXISTING SYSTEM.** Current APIs and authored registrations remain authoritative. |
| Engine movement, collision, depth drawing, fade, audio, save transaction, committed-arrival event | **REFERENCED EXISTING SYSTEM.** `engine.js` continues to own runtime behavior. |
| Narrative, dialogue, quests, AI, social simulation, audio authoring | **DEFERRED / OUTSIDE.** These are not World Engine v0.1 concerns. |
| Physical presence of named characters (who is in which scene for a given story state) | **OUTSIDE — owned by Cast Continuity** (`docs/cast-continuity-contract-v0.1.md`, 2026-09-11). World Engine validates the `sceneId`s that cast windows name; it never places or removes bodies. Location briefs must carry the Cast Continuity fields (contract §7). |

Current accidental Double R coupling remains visible, not generalized: town door `42,20` names `double_r_exterior_prototype`; exterior installer uses map-ID-gated global renderer overrides; `front-door` reaction is registered from existing Double R setup. v0.1 records these boundaries; it does not refactor them.

## 4. Implemented data contract

**IMPLEMENTED.** `GAME.World.register(catalog)` accepts exactly one catalog for the page lifetime. Registration validates required records and nonempty string IDs, nonempty location/environment arrays, dense arrays, duplicate location IDs, duplicate local environment IDs, duplicate global scene IDs, and malformed or duplicate connection references within a location. Connection arrays may be empty; sharing a connection across locations is valid. It builds null-prototype object indexes and stores a copied, recursively frozen catalog. The method returns that immutable copy. Invalid registration leaves the world unregistered; a second successful registration is rejected.

When `GAME.Maps` is available at registration, each environment's `sceneId` must name an existing map. When it is absent, registration does not defer a second validation pass.

`GAME.World.catalog` is a getter. It is `undefined` before registration and returns the registered immutable copy afterward. Mutating the caller's source object after registration cannot change World Engine state.

The canonical catalog lives in `js/world-catalog.js`. It registers the established v0.1 catalog after existing scene installers have run and before `main.js` starts; `test/world-engine-v0.1-catalog.js` consumes that runtime catalog. References point at existing authored/runtime data; the contract embeds none of it.

```js
{
  id: 'twin-peaks',
  locations: [
     { id: 'double-r', environments: [{ id: 'exterior', sceneId: 'double_r_exterior_prototype' }, { id: 'interior', sceneId: 'diner' }], connections: ['double-r-front-entrance', 'town-double-r-lot'] },
     { id: 'town', environments: [{ id: 'town', sceneId: 'town' }], connections: ['town-traincar-east', 'town-sheriffs-station-lot', 'town-double-r-lot'] },
     { id: 'sheriffs-station', environments: [{ id: 'exterior', sceneId: 'sheriffs_station_exterior' }, { id: 'interior', sceneId: 'sheriff' }], connections: ['sheriffs-station-front-entrance', 'town-sheriffs-station-lot'] },
     { id: 'traincar-crossing', environments: [{ id: 'traincar', sceneId: 'traincar' }], connections: ['town-traincar-east', 'traincar-oej-entrance'] },
     { id: 'one-eyed-jacks', environments: [{ id: 'interior', sceneId: 'oej' }], connections: ['traincar-oej-entrance'] },
     { id: 'great-northern', environments: [{ id: 'room-315', sceneId: 'room_315' }, { id: 'lobby', sceneId: 'hotel_gn' }], connections: ['great-northern-room-315-hall'] },
     { id: 'hospital', environments: [{ id: 'ward', sceneId: 'hospital' }], connections: [] }
   ]
}
```

Connection membership appears in each endpoint location. Existing paired connection records remain sole authority for endpoint triggers, spawns, directions, and optional existing door gate fields. Scene art, rows, walkability, palette, depth hooks, ambient definitions, reaction definitions, and door frames stay authored data.

Environment IDs are local to their location. Reusing `interior` under `double-r` and `one-eyed-jacks` is valid; scene IDs remain unique across the catalog.

### Lookup API

**IMPLEMENTED.** All successful collection results and their records are frozen views of the copied catalog. Missing lookups return `undefined`.

| API | Result |
|---|---|
| `GAME.World.getLocation(id)` | Location record for the world-unique location ID. |
| `GAME.World.getEnvironment(locationId, environmentId)` | Environment record addressed by its location and local environment ID. |
| `GAME.World.getLocationForScene(sceneId)` | Owning location record for a catalog-unique existing scene ID. |
| `GAME.World.getConnections()` | Frozen, deduplicated list of connection IDs across the catalog, preserving catalog order. |
| `GAME.World.getConnections(locationId)` | Frozen connection-reference list for that location; `undefined` when the location is missing. |

**REFERENCED EXISTING SYSTEM.** Connection IDs correspond to descriptors authored by `GAME.DoubleRLocationConnections`, `GAME.SheriffsStationLocationConnections`, `GAME.TraincarLocationConnections`, and `GAME.Room315LocationConnections`, which existing scene setup passes through `GAME.LocationConnections.install`. World Engine does not create a connection registry, copy endpoint descriptors, or perform traversal.

## 5. Double R example

`double-r` groups environments `double_r_exterior_prototype` and `diner`. Existing connection `double-r-front-entrance` compiles exterior triggers `[6,6]`/`[7,6]` to diner spawn `[6,8,up]`; diner triggers `[6,9]`/`[7,9]` return to exterior spawn `[6,7,down]`. Diner departure names existing reaction `front-door`. Town access remains authored map door `town:42,20 → double_r_exterior_prototype`.

```text
World catalog
  └─ Location: double-r
       ├─ Environment: exterior → GAME.Maps.double_r_exterior_prototype
       ├─ Environment: interior → GAME.Maps.diner
       └─ Connection: double-r-front-entrance
            └─ existing LocationConnections → Engine fade/save/arrival event
```

## 6. Proven capabilities

- **IMPLEMENTED:** one immutable registered catalog plus location, environment, scene-owner, and connection-membership lookups.
- **REFERENCED EXISTING SYSTEM:** authored native rendering, collision/walkability, and depth per environment.
- **REFERENCED EXISTING SYSTEM:** continuous, intermittent, and signature Ambient Life.
- **REFERENCED EXISTING SYSTEM:** event-driven Environment Reactions.
- **REFERENCED EXISTING SYSTEM:** paired semantic connections with multiple physical triggers, non-trigger spawns, optional departure reaction, and committed-arrival metadata.
- **REFERENCED EXISTING SYSTEM:** engine-owned save rollback/retry, no-bounce landing, and fade behavior.

## 7. Deferred questions

| Question | Answer only when real use case exists |
|---|---|
| More than two endpoints | One authored place needs a true multi-destination connection, not separate paired doors. |
| Conditional routing | One connection needs destination choice from real world state. |
| Installer conflicts | Two installed authored scenes conflict over one renderer/global hook. |
| Material-policy registration | Second native scene needs renderer policy beyond current map-ID-gated setup. |
| Differently shaped reactive objects | Real doorway/object cannot use existing authored door frames. |
| World-time semantics | Real environment needs behavior driven by shared time rather than local scene time. |

## Second location findings

**IMPLEMENTED.** `traincar` participates in independent paired connections `town-traincar-east` and `traincar-oej-entrance`. Oej’s two door leaves and traincar’s single north trigger prove asymmetric endpoint geometry. Both use explicit non-trigger spawns and existing map/door/fade/save behavior.

**IMPLEMENTED.** Locations can contain one environment. Connections may join separate locations; each endpoint location lists shared connection membership. Existing door gate metadata belongs to endpoint authored connection data, preserving `atto3` access without conditional routing.

**REFERENCED EXISTING SYSTEM.** No new routing primitive is required. `LocationConnections` already carries `needsFlag` and `blockedMsg` descriptor fields for paired endpoints; this preserves existing door infrastructure.

**DEFERRED.** More-than-two-endpoint connections, conditional routing, installer conflicts, material policy registration, reactive-object shapes, and world-time semantics. Traincar’s two destinations are two independent paired connections, not one multi-endpoint connection.

### Third location: Sheriff's Station

**IMPLEMENTED.** The native interior is registered as existing map id `sheriff` (narrative-keyed). Location `sheriffs-station` has environments `exterior` (`sheriffs_station_exterior`) and `interior` (`sheriff`) joined by `sheriffs-station-front-entrance`. `town-sheriffs-station-lot` and `town-double-r-lot` join both lots to Town — bottom-row multi-trigger exits, non-trigger spawns. **REFERENCED EXISTING SYSTEM.** No new primitive was needed: classification is EXISTING SYSTEM ALREADY SUPPORTS IT.

## 8. Repository recommendation

**IMPLEMENTED:** A — data layer inside the existing repository. The contract depends directly on `GAME.Maps`, renderer hooks, Ambient Life, `LocationConnections`, and engine save/transition lifecycle. It has no independent runtime or package boundary. Keep the specification and catalog beside these systems; no repository migration.

## 9. Implemented second-location coverage

**IMPLEMENTED:** **traincar ↔ oej** is the second-location case. It has outdoor traincar with two destinations plus indoor Oej with two physical return triggers and an explicit non-trigger traincar spawn. It verifies that one environment can participate in multiple semantic connections and that asymmetric endpoint geometry stays clear.

**REFERENCED EXISTING SYSTEM:** existing maps, doors, movement, collision, fades, saves, and renderer remain unchanged. **DEFERRED:** generalized endpoint count, conditional routing, material policy, and reactive-object shapes await a concrete need.
