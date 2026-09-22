# DEEPSEEK TASK — Living Town content package `town-events-v01`

One deliverable: a content package. No engine work, no UI, no graphics, no model calls, no server.
If you believe this task is wrong or impossible as written, STOP and say so. Do not build a
substitute, do not re-scope, do not "pre-fix" anything outside the fence.

## Base and fence

- Repo `ember-mind/twin-peaks-game`. Create a worktree from `origin/main` at its current head (it must
  contain the shared meal; verify with `ls living-town/content/shared-meal-v01/shared-meal.js`).
  First run `git branch -a | grep town-events`; if anything is listed, STOP and say so.
  New branch: `feat/living-town-town-events`. Never push. Never touch `main`. Stage explicit paths only.
- BEFORE writing anything, run `node living-town/test/run-all.js` and note its last line
  (`PASS living-town/test — K checks total`). K must be the same when you finish.
- Write ONLY under `living-town/content/town-events-v01/`:
  `town-events.js`, `README.md`, `test/town-events.js`, `test/pipeline.js`, `tools/measure.js`.
- Do NOT edit anything in `living-town/js/`, `living-town/test/`, `living-town/index.html`,
  `living-town/docs/` or any other package. If the core lacks something, write it in the README under
  "Needed from the core" and keep going.
- Your models are `living-town/content/lost-wallet-v01/` (an object that is picked up and carried to
  a person) and `living-town/content/everyday-opportunities-v01/` (an object placed by an intervention,
  used where it lies). Read both packages and both of their tests completely before writing a line.
  Same style: ES5 IIFE, `LT` global, works under Node with `global.window = global`, no dependencies,
  no `Math.random`, no `Date`. Randomness only through `LT.Util.rng(seed)`.
- Contracts to read, not to change: `living-town/js/lt-interventions.js` (`I.define`, `money_turn`),
  `living-town/js/lt-actions.js` (header, `A.define`), `living-town/js/lt-content.js`,
  `living-town/js/lt-hand.js` (the shape of a catalogue entry: `id, label, blurb, needs, fields, build`),
  `living-town/js/policy/lt-utility-policy.js` (`defineScore`), and in `living-town/js/lt-sim.js`:
  `credit`, `adjustNeed`, `adjustRelationship`, `emit` (an event with `actorId` and `notify:[ids]` is
  what becomes a memory — see where `P.remember` is called in `emit` — there is no other memory writer),
  and `LT.Hand.DOOR_SPOTS` in `lt-hand.js` (where a thing can lie inside each door; read it, do not copy it).

## What the package adds

Things that happen in town because it is a town, not because a watcher asked: a source of
circumstances called `world`. Each is an intervention type (validated when scheduled, applied when
due, in the one register). A seeded calendar says which happen on which day and when. Some of them a
watcher may also ask for; those are offered as catalogue entries in the hand's own shape.

Nobody is decided for. An event changes what is there or what is owed; what anyone does about it is
their policy's choice from candidates perception offers.

All state lives in `sim.state` (objects, offers, commitments, money); nothing in closures.

### Five intervention types (`LT.Interventions.define`, all five; `source` is whatever the scheduler passes)

1. `shared_bill` — `params { amount, what }`, 5 ≤ amount ≤ 50, `what` a few words. Every resident pays
   an equal share (`amount / number of residents`, `U.round2`), from the pocket first then savings, via
   `sim.credit` exactly as `money_turn` does; one private `BILL_PAID` event per person plus one town
   event `SHARED_BILL` (`text`: "The building's <what> came to N EUR, M each."). Someone who cannot
   cover their share pays what they have; the event says so for them.
2. `birthday` — `params { toId }`. A `birthday_cake` object appears at the café (`location:'cafe'`,
   a free cell you choose beside the counter; refuse if occupied by another object) with
   `affordances:['have_cake']`, `forId: toId`, `slices: 6`, `expiresAbs` = midnight. Action `have_cake`
   (`A.define`): 10 minutes, `targetKind:'object'`, eligible while `slices > 0` and the café is open;
   `onComplete`: `slices--`, `sim.adjustNeed(actor,'hunger', -15)`, and if `forId` is present in the café
   and is not the actor, `sim.adjustRelationship` both ways `{closeness:+1}` and a memory for both
   ("had cake for <name>'s birthday" / "<name> had cake at my birthday"). Town event `BIRTHDAY` when
   scheduled-and-applied; `CAKE_EATEN` per slice, `notify:[forId]`.
3. `market_in_park` — `params { fromMin, toMin }` (day minutes, 60 ≤ span ≤ 300, inside the park's hours).
   A `market_stall` object in the park (free cell you choose, refuse if occupied) with
   `affordances:['browse_market']`, `opensMin`, `closesMin`, `expiresAbs` = that day's `closesMin`.
   Action `browse_market`: 15 minutes, eligible only inside the window; `onComplete`: costs 3 EUR if the
   actor has it (`sim.credit(actor,{money:-3})`) and then `sim.adjustNeed(actor,'energy', +4)` and a memory
   ("browsed the market in the park"); with less than 3 EUR they browse without buying (no cost, no
   energy, memory "looked at the market stalls"). One browse per person per day (count from memories
   or a `browsedBy:{}` map on the object, not a closure). Town event `MARKET_OPENED`.
4. `wrong_delivery` — `params { forId, atHomeId }` where `atHomeId` is the home of a *different*
   resident. A `misdelivered_parcel` object appears inside that door (use the door spots the way the
   everyday package's parcel does; refuse `spot_taken`), `forId`, `heldBy:null`, `affordances:['pick_up_parcel']`,
   `heldAffordances:['hand_over_parcel']`, `expiresAbs` = midnight. Model the whole life on the lost
   wallet: `pick_up_parcel` (object, 1 min) → the object is held; `hand_over_parcel` (`targetKind:'person'`,
   `beside_person`, eligible only when the target is `forId`, 2 min) → the object is removed,
   `sim.adjustRelationship` both ways `{closeness:+2, trust:+2}`, `forId` gets `pantry += 2`, memories for
   both, event `PARCEL_HANDED_OVER` `notify:[forId]`.
5. `stray_dog` — `params { locationId, minutes }`, `locationId` ∈ `park | street`, 30 ≤ minutes ≤ 120.
   A `stray_dog` object at that place's spawn cell (refuse if occupied), `affordances:['pet_dog']`,
   `expiresAbs` = now + minutes. Action `pet_dog`: 5 minutes; `onComplete`: `sim.adjustNeed(actor,'energy',+2)`,
   a memory ("stopped for a stray dog"), event `DOG_PETTED`.

The core has no expiry for objects (offers expire; things do not). So `expiresAbs` means: past it, every
action on the thing is ineligible (check it in `eligible`, not in a hook) and `validate` still accepts
the object. The thing stays in `sim.state.objects`; removing it needs a core hook — write one paragraph
under "Needed from the core" saying what you would want (a `sweep(sim)` the core calls each minute is the
likely shape). Do not add a ticking hook of your own and do not mutate objects from `eligible`.

All objects: `typeId` as named, `kind`, `name`, `portable:false` except the parcel (`true` while held),
`location`, `x`, `y`, `useSpot` where the model packages have one. `LT.Content.register({ id:'town-events',
version:'v01', interventionTypes:[the five], objectTypes:{ birthday_cake, market_stall,
misdelivered_parcel, stray_dog: { validate, visual } } })`. `visual` returns `null` for all four.
`validate(object, env)` type-checks every field and refuses by name (unknown `forId`, a parcel `heldBy`
someone who does not exist, `slices` not an integer in 0..6, a window outside the day, a cell that is
not floor via `env.reachable`, …).

### The calendar (`LT.TownEvents`)

- `LT.TownEvents.plan(seed, day)` → an array of `{ type, params, atMinute }` for that day, pure, from
  `LT.Util.rng((seed ^ (day * 0x9e3779b9)) >>> 0)`: the same seed and day always give the same list.
  Odds per day: `shared_bill` 1 in 7 (any day, 09:00–11:00, amount 20–45), `birthday` for each resident
  on a fixed day of the year derived from the seed (day % 30 for a 30-day cycle, so every resident has one
  in a month), `market_in_park` 2 in 7 (11:00–16:00), `wrong_delivery` 2 in 7 (10:00–15:00, random pair),
  `stray_dog` 3 in 7 (any time 08:00–21:00, 30–90 minutes). Never more than three events in a day.
  Every `params` object must pass that type's `validate` on a fresh town.
- `LT.TownEvents.scheduleDay(sim, day)` → schedules each planned entry with
  `sim.scheduleIntervention({ type, params, source:'world', atDay: day, atMinute })` and returns the
  records; a refusal (e.g. a spot taken) is skipped, not thrown, and returned under `skipped`.
  Do not call this from anywhere in the package at load time: the core (later) or a test calls it.
- `LT.TownEvents.handEntries()` → catalogue entries in exactly the shape of `LT.Hand.CATALOGUE`
  entries (`id, label, blurb, needs, fields(sim), build(sim, answers, atAbs)`) for the three a watcher may
  ask for: `stray_dog` (where), `wrong_delivery` (for whom, at whose door), `birthday` (whose). Not
  `shared_bill`, not `market_in_park`. The core will merge them into the hand; you do not.

Scores, offered with `offerScores(policy)` as the model packages do (suggestions in the policy's own
units, never rules): `have_cake` grows with hunger and with closeness to `forId`; `browse_market` grows
with energy below 60 and money above 10; `pick_up_parcel` small positive, larger with
`trait('conscientiousness')`; `hand_over_parcel` grows with closeness to `forId` and conscientiousness;
`pet_dog` small, grows with `trait('sociability')` and shrinks when a commitment is due within 30 minutes.

`tools/measure.js`: loads the core + this package, runs `LT.Scenario.town({ seed: 7 })` for 3 days with
the default policy, calling `scheduleDay` at each day start (before the first minute of the day), and
prints ONE JSON line: `{"planned":n,"applied":n,"skipped":n,"cake":n,"browsed":n,"parcels":n,"handed":n,"dogs":n}`
from `sim.state.interventions` and `sim.state.events`; run twice in the same process from fresh sims
and exit non-zero if the two lines differ.

## Done means these commands, with this output

```
node living-town/content/town-events-v01/test/town-events.js   # last line: town-events: N/N (N >= 60), exit 0
node living-town/content/town-events-v01/test/pipeline.js      # last line: town-events pipeline: M/M (M >= 12), exit 0
node living-town/content/town-events-v01/tools/measure.js      # one JSON line, planned >= 4, applied >= 3, exit 0
node living-town/test/run-all.js                               # same K as before you started, exit 0
git status --short                                             # only files under living-town/content/town-events-v01/
```
`pipeline.js` must drive the REAL path, not call `onComplete` by hand: a town sim where a planned day is
scheduled, the interventions apply at their minutes, perception offers `have_cake` / `browse_market` /
`pick_up_parcel` / `pet_dog` to someone present, a scripted policy picks them, and the parcel is carried
to the right person and handed over; and a second run where nobody picks the parcel up and, after
midnight, `pick_up_parcel` is no longer offered for it although it still lies there.

Required checks among the N (name them so they can be grepped): `plan` is identical for the same seed
and day and differs across days; every planned params passes `validate` on a fresh town; a fourth event
in a day is never planned; a `shared_bill` share that exceeds someone's pocket takes from savings and
stops at zero; `have_cake` is refused when `slices` is 0 and when the café is closed; `browse_market`
outside the window is refused; a second browse in a day is refused; `hand_over_parcel` to the wrong
person is refused; `wrong_delivery` at the recipient's own door is refused; a `stray_dog` on an occupied
cell is refused by name; `JSON.parse(JSON.stringify(state))` round-trips each object type and `validate`
accepts each and refuses eight named corruptions; a save taken with a held parcel and a cake half eaten
(`LT.Save.serialize` → `deserialize`) evolves identically to the sim that never stopped for 120 minutes;
`handEntries()` entries build params that `validate` accepts, and a watcher's `stray_dog` and a world's
`stray_dog` are the same type with a different `source`.

If `measure.js` cannot reach its numbers with honest scores, do NOT inflate the scores until it does and
do NOT loosen the odds or the eligibility: report the numbers you get and why.

Night events (a noise that wakes someone, a fall, a storm) are NOT in this task: they need the core to
let a sleeper be woken. If, while reading `lt-sim.js`, you see exactly what hook that would take, write
one paragraph under "Needed from the core" in the README; do not implement it.

## Report back

Branch, full commit hash, the five command outputs pasted verbatim (not summarised), the list of
"Needed from the core", and anything you could not do. Do not describe results you did not run.
