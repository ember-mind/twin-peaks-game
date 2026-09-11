# Presence sources — every mechanism that can put a character on screen

Read-only forensic audit. Source is reality; docs are intent. No fixes proposed.

Repo: `/Users/ebuccelli/Code/solo/projects/twin-peaks-game`

## Summary

There are exactly **two** mechanisms that create character *presence* (an entry
in the interactable/drawable NPC roster, `S.npcs`): the classic `NPCS` table in
`js/glue.js`, and the dynamic `NARRATIVE_ENTITIES` table in
`js/narrative-engine-adapter.js`, synced into the same roster at runtime. Every
other module either **animates** characters already in that roster
(`character-activity.js`, `ambient-life.js`), **renders** the roster a second
time for the 3D view (`render3d.js`), or draws a character as static furniture
outside the roster entirely (`hospital-art.js`/`hospital-scene.js`, for
Ronette's bedridden sprite). No production/environment module
(`*-production.js`, `*-scene.js`, `*-art.js`, `world-catalog.js`,
`world-engine.js`, `location-connections.js`) registers or spawns a character.

There is **one** authoritative roster: `S.npcs` (engine state), built at map
load from `GAME.Maps[id].npcs` and kept in sync with `NARRATIVE_ENTITIES` on
every state change. `render3d.js` reads that same array; it does not maintain
a parallel one.

---

## Mechanism 1 — Classic per-map NPC table

**NAME**: `NPCS` table
**FILE:LINES**: `js/glue.js:14-87`
**WHO OWNS IT**: classic data (hand-authored, pre-narrative-system)
**WHEN IT RUNS**: table is static; consumed once per map load by `loadMap()`
in `js/engine.js` (~line 114-122), which instantiates `S.npcs` from
`GAME.Maps[id].npcs`. Filtering by `cond` is **not** done at spawn time — every
listed NPC is instantiated; presence is re-evaluated continuously through
`E.npcActive`.
**HOW GATED**: `cond` field on the NPC object — a string or array of strings,
each `flag:X` / `!flag:X` (also legacy `cluesN`, and `evidence:X`/`nflag:X`
which delegate to `GAME.NarrativeAdapter.getState()`). Evaluated by
`E.npcActive(n, st)` (`js/engine.js:337-345`) and `checkCond`
(`js/engine.js:558-580`). No time-of-day or act-number primitive; act gating
is done indirectly via flags such as `flag:atto3`.
**KNOWS ABOUT OTHER MECHANISMS?**: No. The table itself has no awareness of
`NARRATIVE_ENTITIES`. The *adapter* is the one that checks against this table
(see Mechanism 2) — the classic table is passive.
**CAN CREATE DUPLICATE?**: Not with itself (one array per map, ids presumably
unique by convention, not enforced). Can duplicate with Mechanism 2 only if a
data-authoring mistake reintroduces a classic id the adapter also owns — see
Mechanism 2's dedupe, which is id-only.
**SAVE/LOAD RECONSTRUCTS?**: Yes, fully. Nothing about NPC presence is saved;
`S.npcs` is rebuilt from this table (plus the adapter sync) on every map load.
The save snapshot (`classicSnapshot()`, `js/narrative-production.js:17-27`)
persists only `mapId`, player `tx/ty/dir`, `clues`, `flags` — no NPC list.

Representative entry (`js/glue.js:14-21`):
```js
{ id: 'bobby',  x: 31, y: 16, sprite: 'bobby',  name: 'Bobby',
  cond: ['!flag:gigante2'],
  dialogue: [
    { cond: 'flag:done_shelly', then: 'bobby_shelly' },
    { cond: 'flag:done_shelly_bobby', then: 'bobby_shelly' },
    'bobby'
  ], wander: true }
```

Two maps are intentionally emptied because the adapter now owns their cast:
`traincar: []` and `oej: []` (`js/glue.js:85-86`).

Dialogue cascades are a *second*, independent gating layer, separate from the
NPC's own `cond`: `npc.dialogue` can itself be an array of `{cond, then}`
entries, resolved by `resolveDialogue()` (`js/engine.js:582-596`, first true
condition wins, bare string is the fallback). The same cascade shape is reused
for map `objects`/`INTERACT_DLG` entries (`js/glue.js:89-113`).

No `getMapNPCs`/`npcsFor`-style accessor exists anywhere in the codebase
(confirmed by grep) — there is no seam function for "NPCs present on this
map"; every consumer reads `S.npcs` (the instantiated array) directly, or
`GAME.Maps[id].npcs` (the static per-map array) before instantiation.

---

## Mechanism 2 — Narrative adapter dynamic entities

**NAME**: `NARRATIVE_ENTITIES` + `syncNarrativeEntities`
**FILE:LINES**: table at `js/narrative-engine-adapter.js:155-317`; merge
function `syncNarrativeEntities` at `js/narrative-engine-adapter.js:366-390`
(approx, per sub-agent citation); id lookup `indexOfNpc` at `:356-359`;
classic-id snapshot `classicIdsFor` at `:336-343`; condition evaluator
`evalWhen` at `:326-330`.
**WHO OWNS IT**: mission/narrative adapter layer (`GAME.NarrativeAdapter`)
**WHEN IT RUNS**: on adapter `enable`, after `setState`, after
`refreshFromState`, and after **every commit** — i.e. continuously as the
player's flags/nodes change, not just at map load.
**HOW GATED**: each entity carries a `when` predicate using the "unica
semantica" shared with the rest of the narrative runtime: `flag`, `not`,
`all`, `value_set`, `value_is: {name, equals}`, `evidence`, `node_done`.
`when: null` means unconditional presence. Evaluated via
`GAME.NarrativeRuntime.evalCond(state, when, null)` — deliberately reuses the
one true evaluator rather than a second implementation (comment at
`:320-322`).
**KNOWS ABOUT OTHER MECHANISMS?**: Yes, partially. `classicIdsFor` computes
(and caches) the set of ids already present in the *classic* `NPCS` table for
a map, and `syncNarrativeEntities` refuses to touch any id that appears there:
```js
var classic = classicIdsFor(ent.map_id, map);
if (classic.indexOf(ent.npc.id) !== -1) return; // id del gioco classico: mai toccato
```
This is an **id-only** guard. It does **not** check tile position (`x,y`) or
`sprite` against either the classic table or other adapter entities.
**CAN CREATE DUPLICATE?**: Yes, in principle, via two routes:
1. **Position collision, different ids** — nothing prevents a classic NPC and
   an adapter entity with different ids from being placed on the same tile.
   Both get added to `S.npcs`; which one `interact()` picks is purely
   array-order dependent (classic entries are inserted first at map load, so a
   classic NPC wins a shared tile unless its own `cond` is currently false).
2. **Same-map, same id, multiple `when` windows** — the table itself is
   careful about this (see Hawk's three traincar placements, `hawk_bridge`,
   `hawk_door`, `hawk_cut`, each a distinct id precisely because "syncNarrativeEntities
   identifica per npc.id, e tre voci con lo stesso id si rimuoverebbero a
   vicenda" — comment at `js/narrative-engine-adapter.js:~206-210`). This is
   authoring discipline, not a structural guard; a future addition that reuses
   an id across overlapping `when` windows would silently flicker/self-remove.

Merge logic (paraphrased from the sub-agent's citation of
`syncNarrativeEntities`):
```js
NARRATIVE_ENTITIES.forEach(function (ent) {
  var map = GAME.Maps && GAME.Maps[ent.map_id];
  if (!map || !map.npcs) return;
  var classic = classicIdsFor(ent.map_id, map);
  if (classic.indexOf(ent.npc.id) !== -1) return;      // classic id: never touched
  var present = evalWhen(ent.when);
  var at = indexOfNpc(map.npcs, ent.npc.id);
  if (present && at === -1) { map.npcs.push(ent.npc); ... }
  else if (!present && at !== -1) { map.npcs.splice(at, 1); ... }
  if (live && liveMapId === ent.map_id) {
    var lat = indexOfNpc(live, ent.npc.id);
    if (present && lat === -1) live.push(hydrateNpc(ent.npc));
    else if (!present && lat !== -1) live.splice(lat, 1);
  }
});
```
It **adds/removes alongside** the classic list — it never replaces a classic
entry in place. The only "replacement" pattern in this codebase is
authoring-time retirement: a map's classic array is hand-emptied
(`traincar: []`, `oej: []` in `js/glue.js`) so the adapter can own that map's
cast without id collision.

**SAVE/LOAD RECONSTRUCTS?**: Yes, fully. Nothing about adapter-owned NPC
presence is saved. `js/narrative-production.js`'s save/persist path
(`classicSnapshot()`, `persist()`) writes only `mapId`, player position,
`clues`, `flags` to `localStorage['tp_save']`, plus a separate narrative-state
blob (`NarrativeSave`) that stores mission/flag state, not NPC lists.
`syncNarrativeEntities` re-derives the whole adapter-owned roster from current
flags on every load and every commit.

### Same-tile arbitration (`interact()`)

`npcAt(x,y)` (`js/engine.js:647-652`) linear-scans `S.npcs` and returns the
**first** match at the tile, gated by `E.npcActive` (classic-only cond check —
adapter entities have no `cond` field so this always passes for them). Because
classic entries are in the array before adapter entities are appended
(`live.push(...)` in the sync), **a classic NPC sharing a tile with an adapter
entity wins**, unless the classic NPC's own `cond` currently evaluates false —
in which case `npcAt` skips it and finds the adapter entity further down the
array. `interact()` (`js/engine.js:728-770`) then calls
`GAME.NarrativeAdapter.tryInteract(S.mapId, npc.id)`
(`js/engine.js:747`) with whichever npc was found; if that returns falsy it
falls through to `startDialogue(resolveDialogue(npc.dialogue))` using the
found npc's own `dialogue` field — which is always `null` for adapter
entities (presence is resolved by mission-node ownership, not a dialogue
string).

---

## Mechanism 3 — Adapter `WORLD_TARGETS` (objects, not bodies)

**NAME**: `WORLD_TARGETS`
**FILE:LINES**: `js/narrative-engine-adapter.js:69-117`
**WHO OWNS IT**: mission adapter
**WHEN IT RUNS**: resolved by tile coordinate inside `tryInteractAt`
(`:639-674`) at interact time, not registered into any roster.
**HOW GATED**: keyed by `map_id → target_id → {x, y, kind}`, `kind` in
`landmark | sign | object`.
**KNOWS ABOUT OTHER MECHANISMS?**: n/a — resolved by tile, independent of the
NPC roster.
**CAN CREATE DUPLICATE?**: No — these are not character bodies. No entry
contains a `sprite`/draw key; comments in the file are explicit that actors
live in `NARRATIVE_ENTITIES`/classic `NPCS`, not here (`:88-89`, `:93-94`).
**SAVE/LOAD RECONSTRUCTS?**: n/a (static table, no state).

---

## Mechanism 4 — Off-books furniture draw (Ronette, hospital)

**NAME**: Ronette bedridden sprite suppression + furniture redraw
**FILE:LINES**: `js/hospital-scene.js:114-120` (suppression patch on
`GAME.Sprites.drawChar`), `js/hospital-art.js` `drawRonetteBed` (~line
327-333, dispatched from `drawProp` ~513-520)
**WHO OWNS IT**: environment module (`hospital-scene.js`/`hospital-art.js`)
**WHEN IT RUNS**: every frame, inside the structures render pass, once
`HospitalScene.install()` has patched the draw hooks (installed once at load
by `js/hospital-production.js`).
**HOW GATED**: hardcoded to `npcId === 'ronette'` on the hospital map — not a
generic mechanism, a one-off special case.
**KNOWS ABOUT OTHER MECHANISMS?**: Yes, explicitly. It reads the *result* of
Mechanism 2: Ronette's npc record is registered normally by
`NARRATIVE_ENTITIES` (`{ map_id: 'hospital', when: null, npc: {id: 'ronette', ...} }`),
so she stays interactable and drives `interact()`'s normal picker. The scene
module intercepts only the **draw** call for her id and returns early,
routing her visual to `drawRonetteBed` instead. Comment:
"Ronette e' distesa nel letto: la sua figura fa parte dell'arredo, non del
cast in piedi."
**CAN CREATE DUPLICATE?**: No duplicate roster entry, but this is the one
mechanism in the audit that decouples "is in the interactable roster" from
"is drawn by the normal character-sprite path" — worth flagging as an
off-books draw route for anyone tracing "why can't I see NPC X" or "why is
NPC X's sprite the wrong shape."
**SAVE/LOAD RECONSTRUCTS?**: Yes — purely a render-time branch on npc id, no
separate state.

---

## Mechanisms that DO NOT create presence (checked and ruled out)

- **`js/character-activity.js`** (`GAME.CharacterActivity`) — `registerActors(mapId, profiles)`
  (`:27`) only stores animation profiles keyed by an id string. Every consumer
  looks up the actual NPC via `findNpc(state,id)` (`:21-25`), scanning
  `state.npcs` (the roster built by Mechanisms 1+2); if no matching NPC
  exists the profile is inert (`actorEligible`, `:75`, fails on `npc` null).
  It cannot spawn a character. Runs every frame from `js/engine.js:823`
  (`CharacterActivity.update(dt,S)`) and on interact from `js/engine.js:743`
  (`reactToInteractor`). Draws nothing itself except two cosmetic pixel
  overlays for Norma's diner gestures (`drawSip`/`drawWipe`,
  `character-activity.js:261-289`) layered on top of her already-drawn
  sprite — not new characters.
- **`js/character-life-scenes.js`** — pure data file, one call registering
  animation profiles for `truman`, `lucy`, `andy` on the `sheriff` map,
  matching existing classic `NPCS` ids. No spawning.
- **`js/ambient-life.js`** (`GAME.AmbientLife`) — has no NPC concept at all.
  `register(id, defs)` (`:19`) stores typed pixel-effect archetypes (steam,
  neon, clock ticks, light variation, glass reflection) — not characters.
  `draw()` paints directly to canvas, independent of the sprite/NPC system.
  Runs every frame from `js/engine.js:824`/`:1012`/`:1033`.
- **`js/ambient-life-scenes.js`** — pure data file registering furniture/
  environment ambient effects for `diner` and `sheriff`. No actors.
- **`js/render3d.js`** — reads the **same** `S.npcs` array
  (`reconcileWorldNpcActors(cur, S.npcs, ...)`, called at `:11298`/`:11300`;
  initial build at `:10936`). `addWorldNpcActor` (`:6470`) only fires from
  that reconciliation loop. Per-frame pose update (`:11420-11474`) sets
  `s.visible = GAME.Engine.npcActive(npc)` — same activity gate as the 2D
  path. No reference to `CharacterActivity` or `AmbientLife` in this file
  (confirmed by grep) — the 3D renderer does not consume character-activity
  animation data; it derives pose from `npc.dir/moving/moveT` plus a few
  hardcoded sprite special cases. There is a single authoritative roster, not
  parallel spawn paths, across 2D and 3D rendering.
- **All `*-production.js` / `*-scene.js` / `*-art.js` environment modules**
  (sheriffs-station, sheriffs-station-exterior, double-r-exterior, room-315,
  traincar): installer IIFEs that call `*Scene.install()` and register door
  connections / `EnvironmentReactions` (visual door-open effects, not
  characters). Several contain explicit ownership comments confirming they
  never touch NPCs, e.g. `js/sheriffs-station-scene.js:74-78` — "glue.js
  possiede il record della mappa (porte/oggetti/NPC narrativi): qui non lo
  sostituiamo" — and `js/room-315-scene.js:~100` — "glue.js owns the map
  record (doors, interact objects, narrative NPCs)." Several exterior scene
  modules explicitly hardcode `npcs: []` on their map object
  (`js/sheriffs-station-exterior-scene.js:14`,
  `js/double-r-exterior-scene.js:8`), confirming those exteriors are
  intentionally cast-empty at the classic-data level (their population, if
  any, is entirely from Mechanism 2 — see location matrix).
- **`js/world-catalog.js` / `js/world-engine.js` / `js/location-connections.js`**
  — pure location/connection catalog and door-connection compiler; no
  character content, confirmed by grep.
- **`js/narrative-finale-production.js`** — orchestrates finale-stage
  transitions, references `actorId` values already resolved elsewhere (e.g.
  `mapId==='hospital' && actorId==='ronette'` at `:283-284` for epilogue exit
  logic) but does not register or draw anything itself.
- **`js/narrative-production.js`** — the sync/persistence orchestrator. Boots
  on window `load`, then runs a `setInterval(..., 180)` poll loop
  (`:316-358`) while `mode==='play'`, calling
  `NarrativeFinaleProduction.poll()`, `syncClassicToNarrative`,
  `syncCarryoverEvidence()`, `syncNarrativeToClassic`, `persist(...)`. It
  **triggers** Mechanism 2's sync but does not itself add/remove NPCs.
- **`js/narrative-data.gen.js`** — generated narrative/mission data (dialogue
  nodes, act structure); not inspected in this pass for entity sections, but
  no code path from any traced mechanism reads it for NPC roster purposes —
  entity presence is fully owned by `NARRATIVE_ENTITIES` in the adapter file,
  which is hand-authored, not generated.
- **`js/retro-cast-matrices-a.js` / `-b.js`** — sprite pixel-art data tables
  only, not presence — confirmed by name/structure, not a registration
  mechanism.

---

## Open items / not fully verified in this pass

- `js/traincar-art.js` contains a `ronette` string match not resolved to
  line/context in this pass — worth a follow-up grep if traincar-related
  Ronette art ever matters (she has no adapter entity on `traincar`, only on
  `hospital`, so this is likely an unrelated comment/reference, but
  unconfirmed).
- `js/double-r-exterior-art.js` was grepped (no npc/register hits) but not
  read in full — assumed consistent with sibling pure-art files.
- The exact per-key semantics of `GAME.NarrativeRuntime.evalCond` (the
  `flag/not/all/value_set/value_is/evidence/node_done` operators) live outside
  `narrative-engine-adapter.js` and were not independently re-verified here;
  the adapter's own comment (`:320-322`) is the source for this list.
- `checkCond`'s `evidence:`/`nflag:` branches in the classic evaluator
  implicitly reach into `GAME.NarrativeAdapter.getState()` when no explicit
  state is passed (`js/engine.js:~570-572`) — a hidden runtime coupling
  between the classic and narrative cond evaluators, noted but not further
  traced.
