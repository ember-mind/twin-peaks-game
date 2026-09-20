# everyday-opportunities-v01

Living Town content package v01: one shared book a person can read, and one
food parcel delivered to a home and opened into the pantry, introduced by two
typed interventions. Original content, no assets, no Jev, no voting.

## Integration status (foundation branch)

Integrated. The sections below describe the package as delivered; where they
say the catalogue has no registration hook or that the pipeline cannot run,
that is history. What changed on integration:

- `LT.Actions.define` exists (validated, refuses an id already taken). The
  package registers on load; `test/pipeline.js` is a gate and exits 1 if the
  actions are not registered.
- Both actions declare `position: 'use_spot'`; the core walks the person there
  and only then runs duration, tick and completion.
- The single copy of a book is claimed by the core (`exclusive: true`):
  reserved when reading is chosen, released when that activity ends for any
  reason. The package no longer has `onStart` / `onInterrupt`, and the
  `book_in_use` refusal is now the core's `in_use`.
- Reading is done in sittings of at most 45 minutes (`SITTING_MINUTES`).
- The package registers with `LT.Content`: version `v01`, per-type validation
  of saved instances, and the visual state of an instance (`closed`/`open`,
  `sealed`/`open`/`empty`) for `everyday-props-v01` to draw.
- It offers `UtilityPolicy` a score for each action (`defineScore`). The
  priorities suggested in this README were not adopted as rules.
- Event texts were being passed as a third argument `sim.emit` ignores; they
  are now in the event.
- Unit checks: 81 (were 80). World-level tests: `living-town/test/everyday.js`.

## Files

- `everyday-opportunities.js` — the objects, the two actions, the two
  interventions.
- `test/everyday-opportunities.js` — callback tests (80 checks). Run:
  `node living-town/content/everyday-opportunities-v01/test/everyday-opportunities.js`
- `test/pipeline.js` — the full-pipeline test. It needs the action registration
  hook (below); until then it prints `PIPELINE NOT RUN` and counts nothing.

## What it adds to `sim.state`

Objects are pushed into `state.objects`; all progress lives there, never in a
closure.

`book_used`:

| field | meaning |
| --- | --- |
| `id` | unique instance id, distinct from `typeId` |
| `typeId` | `'book_used'` |
| `title` / `name` | the original, configurable title |
| `location`, `x`, `y` | where the copy rests |
| `anchors.read_book` | the declared use spot `{x,y,dir}` |
| `requiredReadMinutes` | finite reading needed to finish |
| `readBy` | `{ actorId: minutes }`, per person per copy |
| `completedBy` | `{ actorId: stamp }`, written once per person |
| `inUseBy` | `actorId` or `null` — the single-copy availability claim |
| `interventionId`, `affordances`, `tags` | provenance / candidate discovery |

`food_parcel`:

| field | meaning |
| --- | --- |
| `id`, `typeId` | instance id and `'food_parcel'` |
| `toId` | recipient character id (parameter, never a fixed name) |
| `location`, `x`, `y` | the recipient home and cell |
| `anchors.unpack_food_parcel` | the declared use spot |
| `portions` | configured content |
| `contentsLeft` | finite remainder; `0` after opening |
| `status` | `'sealed'` → `'empty'`, exactly once |
| `openedBy`, `openedStamp` | who opened it and when |

### Save/load fields Fable must preserve and validate

`lt-save.js` deep-copies `state`, so nothing here is dropped today. What needs
an explicit check when the save layer is extended:

- `book_used`: `id`, `typeId`, `requiredReadMinutes` (finite > 0 ≤ 600),
  `readBy` (every value a finite number ≥ 0 ≤ `requiredReadMinutes`, every key a
  character id present in `state.characters`), `completedBy` (keys character
  ids), `inUseBy` (`null` or a character id **that also has a live `read_book`
  activity**, otherwise clear it on load), `anchors.read_book` (a walkable,
  reachable cell in `location`).
- `food_parcel`: `id`, `typeId`, `toId` (character id), `location` (== that
  character's `homeId`), `x/y`, `anchors.unpack_food_parcel`, `portions` (int
  1..24), `contentsLeft` (int 0..`portions`), `status` (`sealed`/`empty`),
  `openedBy` (`null` or character id).
- The room fingerprint already covers rooms; these runtime objects are not in
  `W.OBJECTS`, so they are not fingerprinted. If you want a save to reject a
  changed package, extend the fingerprint or validate object shape on load.

## Actions (definition-only until the catalogue can accept them)

`read_book` — `targetKind:'object'`, interruptible, yields to conversation.
- `eligible`: same room, not already finished/held.
- `tick`: adds minutes **only at the declared use spot with no walk target
  pending**; caps at `requiredReadMinutes`.
- `onStart`: claims `inUseBy`.
- `onComplete`: releases, then completes once if `readBy >= requiredReadMinutes`.
- `onInterrupt`: releases and keeps the minutes read.
- No money, trust, goal or intelligence is touched.

`unpack_food_parcel` — `targetKind:'object'`, 5 minutes, not interruptible.
- `eligible`: recipient, in the room, parcel `sealed` with contents.
- `onComplete` at the use spot: `contentsLeft` → pantry once, parcel `empty`.
- Does **not** touch hunger; `eat_at_home` remains the only eating mechanics.

## Interventions (registered through the real `LT.Interventions.define`)

Both validate at schedule time and again at apply time, create exactly one
instance, emit a factual event, and never notify the addressee by id.

```js
sim.scheduleIntervention({
  type: 'place_shared_book', source: 'audience',
  params: {
    instanceId: 'book_harbour_1',           // optional; generated if omitted
    title: 'Tide Tables and Other Small Weathers',
    locationId: 'park',
    x: 2, y: 7,                             // object cell
    useSpot: { x: 2, y: 6, dir: 'up' },     // where reading happens
    requiredReadMinutes: 45
  }
});

sim.scheduleIntervention({
  type: 'deliver_food_parcel', source: 'audience',
  params: {
    instanceId: 'parcel_flat_b_1',          // optional; generated if omitted
    toId: 'resident_b',                     // any existing character id
    locationId: 'flat_b',                   // must be that character's home
    x: 8, y: 3,
    useSpot: { x: 7, y: 4, dir: 'up' },
    portions: 4
  }
});
```

Refusals (stable reason strings): `missing_params`, `missing_title`,
`title_too_long`, `invalid_required_read_minutes`,
`required_read_minutes_too_large`, `invalid_instance_id`,
`instance_id_in_use`, `unknown_location`, `object_position_out_of_bounds`,
`object_position_on_wall`, `missing_use_spot`, `invalid_use_spot`,
`use_spot_out_of_bounds`, `use_spot_not_walkable`, `invalid_use_spot_dir`,
`use_spot_unreachable`, `unknown_character`, `not_recipient_home`,
`invalid_portions`, `portions_too_large`.

## Integration boundary — the one thing that is not connected

`living-town/js/lt-actions.js` exposes `A.get`, `A.ids`, `A.all` but **no way to
add an action**. A content package can therefore define `read_book` and
`unpack_food_parcel` and exercise them through real Sim contexts, but the
simulation cannot offer them as candidates. This was left alone on purpose: no
hidden mutation of `A.all()`, no core method replaced.

**Minimal change for Fable** (exact place: next to `A.get`/`A.all`):

```js
A.define = function (def) {
  if (!def || !def.id || typeof def.eligible !== 'function') {
    throw new Error('an action needs an id and an eligible(ctx)');
  }
  DEFS[def.id] = def;
  return def;
};
```

and load the package after the catalogue, then:

```html
<script src="content/everyday-opportunities-v01/everyday-opportunities.js"></script>
```

```js
LT.EverydayV01.registerActions(LT.Actions);
```

The package already detects an available entry point and joins it
automatically; the explicit call is the documented, intentional one.

Still to be connected by Fable, exactly as you listed:
1. action registration (above);
2. availability/reservation of the object — this package ships the minimal
   contract `object.inUseBy` (claim in `onStart`, release in `onComplete` /
   `onInterrupt`) and refuses `read_book` when someone else holds it. It relies
   on decisions being applied sequentially within a tick (they are) and on
   eligibility being re-checked at execution (it is). If the
   approach/execution split ever lets two actors pass eligibility before either
   claims, add a single sequential claim at activity start; do not build a
   second booking manager;
3. candidate collection — automatic once `A.define` exists: objects in the room
   already contribute their `affordances`;
4. UtilityPolicy factors — suggest a preference for `read_book` when idle/at
   home and for `unpack_food_parcel` when hungry and at home (see below);
5. rendering — the objects are plain state; give them art without writing to
   state;
6. save validation — see "Save/load fields" above.

### Approach/execution prerequisite (yours)

This package pays only at the declared use spot with `walkTarget === null`
(`atUseSpot`), so once approach is separated from execution nothing changes.
At the base commit a long walk still consumes the activity's `elapsed`, so
`read_book.onComplete` refuses to complete below target and the reader finishes
on a later attempt instead of completing early. That is the safe fallback, not
the intended experience; your approach/execution fix is the one that makes the
planned block equal the reading done.

## UtilityPolicy — real priorities, not one choice for everybody

Give each person their own weight, not a shared script:
- reading competes with rest and idleness when at home (or wherever the book
  rests) with low hunger, moderate energy, and no open promise due — more
  attractive to the conscientious/curious trait, less to the sociable one;
- a delivered parcel competes with `buy_meal` and `eat_at_home` when hunger is
  high, the person is home, and cash is low — opening it is cheaper than
  buying and speeds the next meal;
- neither should outrank a commitment window or the start of a shift.

## Unresolved / assumptions

- No second reader while a copy is held: `inUseBy` is the whole contract; a
  stale claim is only possible if an activity is cleared outside
  `onComplete`/`onInterrupt`, which the current core never does.
- Reading completion requires the full `requiredReadMinutes`; an interrupted
  reader resumes with the remainder.
- The parcel addressee may open it only in their own home; the home's
  `mayEnter` already keeps others out under normal movement.
- `requiredReadMinutes` and `portions` are integers with fixed caps (600 / 24).
- Nothing here awards money, trust, goals or memory beyond the ordinary
  location-based perception of the emitted factual events.
