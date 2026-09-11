# Test coverage vs. G10, and the Character Life module boundary

## PART 1 — why no test caught G10

G10: during the Act 4 Roadhouse window (`atto4 ∧ ¬warning_target`, gigante on
`presagio_status=active ∧ ¬warning_target`, classic gate `gigante2`), the
narrative registry `NARRATIVE_ENTITIES` in `js/narrative-engine-adapter.js:155-296`
injects `truman`, `bobby`, `donna`, `james`, `shelly`, `norma`, `loglady`, `gigante`
into `roadhouse.npcs`. Their classic bodies remain live at the same time because
the classic NPC objects that share those ids have no `cond` gating them off:

- `js/glue.js:30` `truman` (sheriff, 10,4) — no `cond`.
- `js/glue.js:39` `hawk` (sheriff, 12,8) — no `cond` (also injected to `town` shore, 16,27).
- `js/glue.js:63` `norma` (diner, 5,2) — no `cond` (only its *dialogue page* is gated).
- `js/glue.js:66` `shelly` (diner, 9,7) — no `cond`.
- `js/glue.js:68` `loglady` (diner, 4,5) — no `cond`.
- `js/glue.js:70` `james` (diner, 9,6) — has `cond: 'flag:sogno_fatto'` (Act 2 gate only, unrelated to `gigante2`).

The only place a `!flag:gigante2` gate exists on the classic layer is
`js/glue.js` entries for `sarah`, `bobby`, `donna`, `jacoby` (town map) — and
that's exactly the id set `test/act-4-flow.js:433-441` and
`test/act-4-mirror-gate.js:96-103` check, via a regex over `js/glue.js` source
text keyed on a **hand-picked id list**. `norma`, `shelly`, `loglady`, `truman`,
`hawk` are simply not in that list, so the gate's absence on them is invisible
to both tests.

### Inventory of presence/position-related tests and their blind spot

| Test | What it checks | Why it can't see G10 |
|---|---|---|
| `test/smoke.js:129,408-411` | One map's `npcs` in isolation per structural check; one hand-picked `E.npcActive` assertion (Sarah/Palmer post-Roadhouse) | Single map, single id, author-chosen — no enumeration over ids that appear on >1 map |
| `test/walkthrough.js:125-126,237,276` | Iterates `map.npcs` per map during one simulated playthrough | One path through the graph, not all reachable states; never compares the same id across two maps |
| `test/narrative-validate.js` (`test/narrative-validate-m5/m6/m8/m9.js`) | Structural/graph validation of `when`/`conditions` shape and writer uniqueness on **narrative facts** (flags/values/evidence) | Operates entirely on `NarrativeData` JSON graph semantics; never touches `GAME.Maps[*].npcs` or the classic `js/glue.js` NPC arrays at all |
| `test/act-4-flow.js:95-186` (27-route loop) | Drives `NR.prepareNode`/`NR.commitNode` through all 27 promise×warning×focus combinations, asserting flags/values/objectives | Pure `NarrativeRuntime` state only — never calls the adapter's `syncNarrativeEntities`/`setState`, never reads `GAME.Maps[*].npcs` after a route. Zero entity-resolution assertions anywhere in this loop |
| `test/act-4-flow.js:433-441` | Regexes `js/glue.js` source for `cond: [...'!flag:gigante2'...]` on a **hardcoded** id list (`sarah`,`bobby`,`donna`) | Hardcoded id list omits `norma`,`shelly`,`loglady`,`truman`,`hawk` — the exact ids that leak |
| `test/act-4-mirror-gate.js:96-107` | Same regex check, hardcoded list (`sarah`,`bobby`,`donna`,`jacoby`); also proves `gigante2` has exactly one writer and no narrative `when` reads it | Same hardcoded-list blind spot; explicitly a "classic-layer topology cross-check" for a **known, named** set of ids chosen when the split (B1) happened — not derived from `NARRATIVE_ENTITIES` |
| `test/act-4-playthrough.js:238,255` | Browser-driven playthrough calling `A.npcsHere()` (a debug helper) at specific script points | Samples the live map at whatever points the script authors chose to look; not exhaustive over states, and normally exercises one route at a time |
| `test/act-2-flow.js:157-173`, `test/narrative-slice-01.js:57-58` | Look up one NPC on one map by id for an Act 2/Act 1 assertion | Single map, single id, single state — same shape as the others |
| `test/diner-layout.js:32,44` | Filters `map.npcs` on the diner map for layout/collision, `james` conditional-presence check | Layout/collision only, one map, doesn't compare against other maps |
| `test/interaction-voice.js:84-85`, `test/interior-zoning-reachability.js:54`, `test/town-map-coherence.js:72`, `test/ronette-bob-provenance.js:75`, `test/probe-*-pacing.js` | Per-map iteration over `map.npcs` for interaction/reachability/pacing checks | All single-map, structural or reachability checks; none cross-reference the same character id across maps or across narrative states |
| `test/station-population.js:187-198,286`, `test/sheriffs-station-native.js:132`, `test/sheriffs-station-location.js:130-135` | Sheriff map `npcs` snapshot/composition (ids, coordinates, `E.npcActive` filter) | Single map (sheriff), and only checks presence of ids that belong there classically — doesn't know `truman`/`hawk` may simultaneously exist on `roadhouse`/`town` |

**Common root cause across every row:** no test enumerates *(reachable narrative
state) × (every map that can host each character id)* and asserts uniqueness.
Every existing check is either (a) narrative-state-only (never touches
`GAME.Maps`/entity resolution), (b) map-only (one map, one state, no state
sweep), or (c) a hand-picked id list keyed to a specific historical fix
(`gigante2` split) rather than derived generically from the entity registry.
There is also no "identity" concept: `truman` at sheriff and `truman` injected
at roadhouse are never compared as *the same character*, because nothing
walks `NARRATIVE_ENTITIES` against `classicIdsFor` reachability the way this
report requires.

### Can the harnesses enumerate reachable states, and can entities be resolved in node?

**Yes to both**, and the pieces already exist, just never wired together.

1. **State enumeration in node, without a browser.** `test/act-4-flow.js:106-186`
   already drives the pure `NarrativeRuntime` (`NR.createState()`,
   `NR.prepareNode`, `NR.commitNode`, `NR.prepareChoice`/`commitChoice`) through
   all 27 M8 route combinations in plain node, producing a `state` object after
   each node. `test/narrative-validate-m8.js:159-160,266-292` similarly builds
   `enums.enums.warning_target × enums.enums.focus_destination` (9 combos) and
   `combos2` (further environment combos) — so the "give me every reachable
   state" data and driving code already exists per mission/act. The function
   that gives "the state after each node" is simply `NR.commitNode(state,
   mission, NR.prepareNode(state, mission, nodeId))`, called in a loop over the
   route/branch id lists each act's flow test already defines (`PROMISES`,
   `WARNINGS`, `FOCUSES` in `act-4-flow.js:102-104`, and equivalents in
   `act-2-flow.js`/`act-3-flow.js`).

2. **Entity resolution in node, for a given state and map.** The adapter is a
   plain script requiring only DOM stubs, exactly as `test/act-4-mirror-gate.js:19-40`
   already does (`global.window = global`, stub `addEventListener`/`requestAnimationFrame`,
   stub canvas context, `require` the same 12 files in the same order, then
   `GAME.Engine.init(canvasStub)`). Once loaded:
   - `GAME.NarrativeAdapter.enable({mission, missions:[mission], state, container:{}})`
     runs `syncNarrativeEntities('enable')` once, mutating `GAME.Maps[map_id].npcs`
     in place (push/splice) to match `state`.
   - `GAME.NarrativeAdapter.setState(s)` (`js/narrative-engine-adapter.js:465`)
     re-runs `syncNarrativeEntities('setState')` for an arbitrary `state` —
     this is the API to call per enumerated state.
   - `GAME.NarrativeAdapter._debugNarrativeEntities` (`:322`) exposes the raw
     `NARRATIVE_ENTITIES` registry (map_id, npc.id, `when`) for introspection.
   - After `setState(s)`, `GAME.Maps[map_id].npcs` holds the resolved body list
     for that map at that state (classic entries as authored in `js/glue.js`,
     narrative entries added/removed by the sync). Classic-entry visibility
     under `cond` still needs the classic evaluator (`GAME.Engine.npcActive`,
     used at `smoke.js:411` and `sheriffs-station-location.js:130`) applied
     per-npc, since `cond` gating on classic entries is evaluated at draw/query
     time, not baked into `map.npcs` membership.

### Sketch: a state × map identity-uniqueness validator

Prose:

1. Load the standard node harness (same requires/stubs as `act-4-mirror-gate.js`).
2. For each mission whose flow test already enumerates routes (M4/M5/M6/M8/M9),
   reuse that test's node-walking loop, but instead of asserting only on
   `state.flags`/`state.values`, call `GAME.NarrativeAdapter.setState(state)`
   after each `commitNode`/`commitChoice`.
3. After each `setState`, for every map in `GAME.Maps`, build the *resolved
   body list*: `map.npcs.filter(n => GAME.Engine.npcActive(n, {..., mapId, flags: state.flags-ish stub}))`
   — i.e. classic `cond` evaluated the same way the engine would at that map,
   plus whatever the registry already added/removed via `setState`.
4. For every resolved body, record `(characterIdentity, mapId)`. `characterIdentity`
   normalizes registry ids that share one visual/story identity but differ per
   placement window (`hawk_bridge`/`hawk_door`/`hawk_cut`/`hawk` →`hawk`;
   `hawk_shore_first`/`hawk_shore_after` → `hawk`) — a small explicit alias
   table, since `syncNarrativeEntities` already comments that this per-window
   id pattern is deliberate ("un id per collocazione").
5. Group by `characterIdentity` across all maps for that one state snapshot;
   assert the group's map set has size ≤ 1. On violation, push
   `{state: <route label>, identity, maps: [...]}`.
6. Run across the full state sweep (all enumerated route combinations for the
   act under test, plus a few global sweeps that turn on `atto4` alongside
   each act's own flags, since G10 is a *cross-act* leak — Act 4 registry
   entries interacting with the never-retired classic Act-1/2/3 diner/sheriff
   NPCs).

Pseudo-code:

```js
for (const routeState of enumerateM8Routes()) {   // reuses act-4-flow.js's loop, returns `s` after m8_roadhouse_truman etc.
  A.setState(routeState);
  const seen = {}; // identity -> [mapId,...]
  for (const mapId of Object.keys(GAME.Maps)) {
    const map = GAME.Maps[mapId];
    if (!map.npcs) continue;
    for (const npc of map.npcs) {
      if (!E.npcActive(npc, { flags: routeState.flags, mapId })) continue;
      const id = normalizeIdentity(npc.id); // hawk_bridge -> hawk, etc.
      (seen[id] = seen[id] || []).push(mapId);
    }
  }
  for (const [id, maps] of Object.entries(seen)) {
    ok(new Set(maps).size <= 1,
      `${routeLabel(routeState)}: ${id} present on >1 map: ${maps.join(',')}`);
  }
}
```

**Confirmed this would have flagged G10.** At the state reached right after
`m8_roadhouse_truman` (`atto4=true`, `presagio_status='active'`,
`warning_target` unset), the concrete failing tuple is:

```
state: promise=<any>/warning=<not yet set>/focus=<n/a>, after m8_roadhouse_truman
identity: truman   maps: [sheriff, roadhouse]
identity: norma    maps: [diner, roadhouse]
identity: shelly   maps: [diner, roadhouse]
identity: loglady  maps: [diner, roadhouse]

state: atto4=true ∧ body_found_by=hawk ∧ ¬maddy_trovata (hawk_shore_first window)
identity: hawk     maps: [sheriff, town]
```

i.e. the validator prints exactly `{state: "atto4 ∧ presagio_status=active ∧
¬warning_target (after m8_roadhouse_truman)", identity: "norma", maps:
["diner", "roadhouse"]}` (and the same shape for `shelly`, `loglady`,
`truman`), plus a second, separate tuple `{state: "hawk_shore_first window",
identity: "hawk", maps: ["sheriff", "town"]}` — both are precisely the two
instances of G10 the team lead described.

---

## PART 2 — Character Life boundary (presence/placement vs. idle/react)

Every module read decides **only HOW an already-present body idles or
reacts**; none of them decide **whether** a character exists or **where** it
is placed. Evidence:

### `js/character-activity.js` (291 lines) — HOW only

- `js/character-activity.js:16-24` `findProfile`/`findNpc`: `findNpc` does
  `state.npcs.find(n => n.id === id)` — a **lookup into an existing array**,
  never a push/splice. If the id isn't found, the routine simply has no body
  to animate (`rt`/`item` become undefined and downstream code no-ops).
- `js/character-activity.js:27-50` `registerActors(mapId, profiles)` registers
  **behavior/animation schedules** (`ACTOR_ACTIVITY` clock items keyed
  `character:<mapId>:<actorId>:<behaviorId>`), not NPC map membership.
- `js/character-activity.js:53-55` `context...` guard: requires
  `context.mapId==='diner' && context.mode==='play'` and finds `norma` in
  `context.npcs` — again a read, gating **when to animate**, not whether Norma
  exists on the diner map.
- `js/character-activity.js:80-151`: pose/behavior selection, history logging
  (`rt.history.push({time, animation, category, variant})`) — pure animation
  state.
- No `map.npcs.push`/`.splice`, no `mapId` reassignment, no cross-map id
  reference anywhere in the file.

### `js/character-life-scenes.js` (115 lines) — HOW only

- Only NPC reference found is a **comment** at line 4 pointing at
  `GAME.CharacterActivity.actorPose(npc.id)` — i.e. it reads a pose for an
  already-resolved `npc` object passed in by a caller. No id/map mutation
  logic in the file body (declarative anchors/regions per the ambient-life
  pattern, same shape as `js/ambient-life-scenes.js`).

### `js/ambient-life.js` / `js/ambient-life-scenes.js` — no NPC concept at all

- Zero matches for `npc`/`NPC` in either file. Per `docs/ambient-life.md`,
  Ambient Life is exclusively steam/light/glass/neon pixel overlays anchored
  to fixed world coordinates registered per map
  (`GAME.AmbientLife.register('hotel_gn', [...])`) — furniture/environment
  accents, structurally incapable of adding or moving a character body.

### Station population — asset build tool, not a runtime presence decision

- `tools/build-station-population-frames.js` is a **node build script** that
  composites a sprite sheet (`assets/sprites/station-population-v01.png`,
  192px wide, extending the existing 96px legacy cast sheet) for Lucy/Andy
  richer walkcycle frames. It never touches `GAME.Maps`, `npcs`, or any
  runtime state — it's an offline PNG/manifest generator (see header,
  `tools/build-station-population-frames.js:1-11`).
- The only runtime consumer is `js/retro-authored.js:52-54,6896`:
  `LIFE_SHEET_SRC` is loaded as an `Image` and exposed as
  `GAME.Retro2D.characterLifeFrames = {src, frame:[24,24], frames:LIFE_FRAMES}`
  — a **rendering lookup table** (which sheet/rectangle to draw). No other
  `js/*.js` file references `characterLifeFrames`, and `js/retro-authored.js`
  contains no `.npcs.push`/`.splice`/id-based spawn logic anywhere (the only
  `.id ===` hits in that file are `map.id === 'sheriff'`/`'roadhouse'`/etc.
  branches selecting which **background art** to paint, not NPC bodies).
- **Answer to "does it add bodies or animate classic ones, and does it still
  draw a body if the classic entry is hidden by `cond`?"**: it animates
  whichever classic NPC entry already exists in `GAME.Maps.sheriff.npcs` /
  the live `state.npcs` (id match against Lucy/Andy/Hawk as already placed by
  `js/glue.js`). It has no independent existence check — if the classic entry
  is filtered out by `cond` (i.e. `npcActive` returns false, or the engine
  never put it in `state.npcs` for that map/state), the richer sprite frames
  are simply never selected for anyone, because there is no npc object to
  attach them to. It cannot draw a body that isn't already in `state.npcs`.

### `js/environment-reactions.js` (73 lines) — no NPC references

- Zero matches for `npc`, `push(`, `splice(`, `state.npcs`, `mapId`. This
  module reacts to player actions (doors, etc.) with environmental effects,
  entirely decoupled from character identity/placement.

### Leakage-candidate inventory (every point these modules reference NPC ids or maps)

| File | Reference | Nature |
|---|---|---|
| `js/character-activity.js:22-24` | `state.npcs.find(n=>n.id===id)` (`findNpc`) | Read-only lookup of an existing body — **not** a leakage point, but confirms the module is entity-resolution-agnostic: it will silently animate *whatever* body currently has that id, including a wrongly-duplicated one from a `NARRATIVE_ENTITIES` leak (i.e. if `norma` existed on both `diner` and `roadhouse` simultaneously and both maps were somehow "live", `findNpc` would animate whichever the engine's live `state.npcs` currently holds — it has no cross-map awareness to detect or prevent a double body) |
| `js/character-activity.js:55` | `context.npcs.find(n=>n.id==='norma')` in the counter-wipe guard | Same as above — reads the live npc array, no ownership/placement logic |
| `js/character-life-scenes.js:4` | comment reference to `npc.id` passed from caller | No mutation |
| `js/retro-authored.js:4674,4700,4720,4793,4852,4854,4904` (`map.id === 'sheriff'/'palmer'/'hotel_gn'/'hospital'/'diner'/'oej'/'roadhouse'`) | Per-map **background/decor** branches (furniture painting), not NPC ids | Not a leakage point — confirmed no `.npcs` mutation nearby |
| `js/retro-authored.js:6896` | `GAME.Retro2D.characterLifeFrames` sheet lookup, consumed nowhere else in `js/*.js` | Rendering metadata only |

**Character Life boundary verdict:** clean. None of `character-activity.js`,
`character-life-scenes.js`, `ambient-life.js`, `ambient-life-scenes.js`,
`environment-reactions.js`, or the station-population build tool / sprite
lookup ever decide whether a character exists on a map or where it is placed.
They only consume an already-resolved `state.npcs`/`map.npcs` entry by id and
animate it. The one soft risk worth naming (not a bug in these files, but a
latent hazard given G10): because `findNpc`/`context.npcs.find` match by
**id only** with no map-scoping assertion, if a future duplicate-body bug
like G10 ever put two live bodies with the same id in the same engine
`state.npcs` array at once (not just across `GAME.Maps[*].npcs` at rest),
these modules would animate one of them arbitrarily with no error — they are
not a detection point for identity collisions, only a silent pass-through.

---

## Summary for the team lead

- **Presence-related tests and their blind spot (one line each):** see the
  table in Part 1 — the unifying cause is that every test is either
  narrative-state-only (no map/entity read) or single-map/single-state (no
  cross-map, no state sweep), and the two tests that do check a `cond` gate
  do so against a hand-picked id list that never included `norma`, `shelly`,
  `loglady`, `truman`, `hawk`.
- **Harness-reuse verdict:** yes — reuse `test/act-4-flow.js`'s (and the
  analogous act-2/3/9 flow tests') node-only route-walking loop
  (`NR.createState`/`prepareNode`/`commitNode`/`prepareChoice`/`commitChoice`)
  for state enumeration, and `test/act-4-mirror-gate.js`'s node-harness
  bootstrap (stub `window`/canvas, require the same 12 `js/*.js` files, call
  `GAME.Engine.init`) plus `GAME.NarrativeAdapter.enable`/`.setState`/
  `._debugNarrativeEntities` for entity resolution. No new resolution API is
  needed; only a small identity-normalization table and a cross-map grouping
  pass, sketched above, wired into a new validator (not yet implemented, per
  the read-only scope of this task).
- **Character Life boundary verdict:** clean separation. `js/character-activity.js`,
  `js/character-life-scenes.js`, `js/ambient-life.js`, `js/ambient-life-scenes.js`,
  `js/environment-reactions.js`, and `tools/build-station-population-frames.js`
  (+ its one runtime consumer `js/retro-authored.js:52-54,6896`) all operate
  strictly downstream of an already-resolved `state.npcs`/`map.npcs`, matching
  by id to animate or paint — none of them push, splice, or relocate an NPC,
  and none of them evaluate a classic `cond` gate themselves. No leakage
  points found beyond the general observation that id-only matching gives
  these modules no way to detect a same-id double body, should one occur.
