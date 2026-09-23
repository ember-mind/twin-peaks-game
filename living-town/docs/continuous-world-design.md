# Continuous world: putting the simulation on the kit map

Phase 2 of `playable-town-plan.md`. The picture already exists: the kit map
prototype (`living-town/proto/town-map/`) draws one outdoor map from the
village kit on the shared engine (`engine/ember-worldmap.js`,
`engine/ember-worldview.js`). This note is what it takes for the real
simulation (`js/lt-sim.js`) to live on that map instead of on the separate
`street` and `park` rooms, and which calls the owner has to make.

## Status (2026-09-23): done, as built

Owner decisions: 3 cells per town minute; the park is a zone of the town;
outdoor perception within 10 cells, in sight; the map stays 48x27.

How it was built differs from the plan below in one way that kept content
untouched: `street` and `park` stay location ids, but they are two **zones of
one grid** (`grid: 'town'`, rows generated from the kit map by
`tools/gen-town-map.js` into `js/lt-town.gen.js`). Which zone someone is in is
where they stand (`W.zoneAt`), updated as they walk. So `'park'` in content
still means the lawn, and nothing that says `park` had to change.

- **Walking** (`lt-sim.js` beginTransit/walkStep): leaving a room puts a person
  on its doorstep; they walk the grid to the next door or the park's entry
  (22,18) at `W.WALK_CELLS_PER_MINUTE`; the walk's minutes are the route
  (`sim.travelMinutesFor`, `W.travelMinutes` for the advertised door-to-door
  times). Someone going out to meet a person already at the park walks up to
  them (`meetingCell`). A walk stopped half way leaves them outside.
- **Together** (`sim.together`): indoors the same room; outside within
  `W.SIGHT_CELLS` with no house or tree between (`W.inSight`), or, for two
  people with an appointment at that place around its time, anywhere in that
  zone (they look for each other). Witnessing an event is sight only.
- **Collision** checks compare the grid (`W.samePlace`), not the zone.
- **View**: `js/lt-kit-town.js` hands the people to the engine's kit view
  (`EMBER.WorldView`), relit in the kit's light, seated on kit benches; the
  sim records the cells walked each minute (`sim.stepsWalked`) so three steps
  are drawn as three steps. Rooms are drawn as before.
- **Saves**: world migration `d7dfa67e -> 98626395` in `lt-save.js` moves
  everyone and everything outside by rule, written against two real saves
  (`test/fixtures/save-town-d7dfa67e-*.json`). A question open at save time is
  re-asked under the key it was first asked with (people walk while an answer
  is awaited; a late mirror diverged without this).
- **Baselines** regenerated: the town is quieter. Pair, 3 days: dead minutes
  213 -> 287, beats 54 -> 40, together 1422 -> 1044. Town of five: dead 258 ->
  279, beats 128 -> 111, together 2105 -> 1909. Cause: outside, "together" is
  now sight, not the whole park.
- The old street/park painter (`content/town-places-v01`) still paints homes;
  its tests keep the two-room outside it was written for.

Open: the kit and map still live under `proto/` (`proto/town-kit`,
`proto/town-map/town.json`); moving them is a rename. The prototype page's
own mini-sim (`proto/town-map/town-core.js`) is now superseded by the real one.

## What changes

**One outdoor location, `town`.** Its cell rows are generated from the kit
map's collision grid (engine `WM.build`): blocked cells `#`, walkable `-`,
door cells `D`. Indoor rooms (`flat_a` … `cafe`) stay as they are, each with
its own rows; their street door becomes the kit building's door cell
(`world.places[...]`), replacing `W.STREET_PORTALS`.

**The park becomes an area of `town`, not a room.** Content that says
`park` means "the lawn by the river": a named zone (a set of cells) inside
`town`. Benches, the bin and anything placed there keep their affordances;
their cells come from the kit objects' positions. `street` disappears as a
place: it is where one walks.

**Walking is real.** `beginTransit`/`endTransit` go away; leaving a room
puts the person on its door cell in `town`, and they walk the engine route
cell by cell (`WM.route`, deterministic) to the next door or spot. Travel
time is the route length; `W.travelMinutes` becomes the route length
divided by walking speed, so the brief's `walkMinutes` stays honest.

**Perception outdoors by distance.** Indoors "here" stays "same room".
Outdoors, "here" becomes "within N cells and in sight" so two people at
opposite ends of the street are not in each other's scene. N is a content
number (proposed 10).

**Fingerprint, saves, baselines.** The world fingerprint gains the kit
map's hash. Saves at schema v(n+1) map old `street`/`park` positions to
`town` cells through a fixed table (portal cells, bench cells, lawn
centre); the four `test/fixtures/save-*` files are the migration's test
set. Both boredom baselines are regenerated and the change in their
numbers is reported, not hidden.

**View.** The observer's outdoor scene is the kit world
(`WV.create(world, kit)`): overview and follow camera as in the prototype;
indoors, the rooms as today.

## Size

162 references to `'park'`/`'street'` in 37 files (sim, save, hand,
scenario, four content packages and their tests, 15 test files, 5 save
fixtures). Estimate: sim + world + save migration a day; content and test
remap half a day; baselines and browser checks half a day.

## Decisions for the owner

1. **Walking speed.** The sim moves one cell per town minute today. On the
   48x27 map, trips are 10–40 cells: at 1 cell/min a walk to the café takes
   up to 40 town minutes (the old table said 5–16), and at 6x live one step
   takes 10 real seconds. Proposed: **3 cells per town minute** (trips
   4–13 min, close to the old table; at 6x a step every ~3 s, smoothed by
   the view). Alternatives: 1 (slow, "real" size town) or 5 (brisk).
2. **Park as a zone inside `town`** (proposed) vs. keeping `park` as a
   separate room reached through the gate. A zone is what the map shows;
   a room keeps content untouched but people vanish at the gate.
3. **Outdoor perception radius**: proposed 10 cells, in sight.
4. **Map size**: keep 48x27 (the painting) for phase 2, grow later with the
   editor (`engine/tools/kit-editor.html`), or grow now.

## Order of work

1. `town` location from the kit map; doors from kit places; zone `park`.
2. Walking on routes with the chosen speed; `travelMinutes` from routes.
3. Perception radius outdoors.
4. Save migration + fixtures; fingerprint.
5. Content remap (everyday opportunities, lost wallet, shared meal, town
   places) and tests.
6. Baselines regenerated; observer view on the kit world; live mirror
   checks (`test/live-mirror.js`, `test/page-live-browser.js`).
