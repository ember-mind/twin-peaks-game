# shared-meal-v01

One person invites another to eat together at the café — lunch at 13:00 or
dinner at 19:30. The invitation is an object the invitee carries; whether to
accept or decline is put to the invitee's own policy, never decided here. If it
is accepted, both people come away with an ordinary `social` commitment and the
core — which already knows how to keep a meeting (they talk there inside the
window) and how to break one (the hour passes) — judges it. This package never
calls `keepCommitment` or `breakCommitment` and never reimplements them.

There is no intervention: a meal begins as one person's question to another, not
as a scheduled circumstance. All state lives on the object in `sim.state.objects`;
nothing in a closure.

## Files

- `shared-meal.js` — object `meal_invitation`, actions `invite_to_meal`,
  `accept_meal`, `decline_meal`, the `LT.Content` declaration and the
  UtilityPolicy scores.
- `test/shared-meal.js` — callback tests (87 checks). Run:
  `node living-town/content/shared-meal-v01/test/shared-meal.js`
- `test/pipeline.js` — the full path through a real sim: offered, asked,
  answered, and then kept or broken by the core (18 checks).
- `tools/measure.js` — three days of the five-inhabitant town on the default
  policy, one deterministic JSON line.

## The object

| field | meaning |
| --- | --- |
| `id` | `meal_<day>_<fromId>_<toId>_<dueMin>` |
| `typeId` | `'meal_invitation'` |
| `name` | `'an invitation to lunch/dinner at the café'` |
| `fromId` / `toId` | the asker and the asked, different people |
| `locationId` | `'cafe'` |
| `dueDay` / `dueMin` | the sitting (780 = 13:00, 1170 = 19:30) |
| `expiresAbs` | `due − 45`: after this it can no longer be answered |
| `status` | `'open'` → `'accepted'` or `'declined'` |
| `answeredAbs` | when it was answered, `null` while open |
| `location`, `x`, `y` | always `null`: an invitation is never lying anywhere |
| `heldBy` | the invitee while `open`, otherwise `null` |
| `affordances` | always `[]` |
| `heldAffordances` | `['accept_meal','decline_meal']` while `open`, otherwise `[]` |

An invitation nobody answers simply stops being answerable after `expiresAbs`
(both actions become ineligible); it stays `open` in state, and there is no
ticking hook.

## The actions

1. **`invite_to_meal`** — person, `beside_person`, `offeredToPresent`, 2 min.
   The sitting is the first of the two that is **60 to 360 minutes away**; the
   café must be open at it. Eligible only if the target is present and not in
   transit, neither already has an open `social` commitment with the other, no
   open invitation exists between them in either direction, and the asker has
   issued no other invitation today (counted from the objects). `onComplete`
   creates the object and emits `MEAL_INVITED`, notifying the invitee.
2. **`accept_meal`** — no target, `anywhere`, 1 min. Eligible only while the
   actor carries an `open` invitation and `now <= expiresAbs`. `onComplete`
   pushes **one commitment on each person**, in exactly the shape `acceptOffer`
   pushes (`id:'cmt_meal_'+invitation.id`, `kind:'social'`, `strength:'soft'`,
   `withId` the other, the café, a label, the sitting, `graceMin:30`,
   `status:'open'`), warms each toward the other by `{closeness:+1}`, and emits
   `MEAL_ACCEPTED` to the asker.
3. **`decline_meal`** — same shape and eligibility. `onComplete` declines it and
   moves only `adjustRelationship(inviter, invitee, {closeness:-1})`; no
   commitment appears; `MEAL_DECLINED` goes to the asker.

No action touches hunger, energy, money or goals.

## Keeping and breaking is the core's

The commitment each person receives is an ordinary social one, so the core's own
machinery judges it: `settleMeeting` (called when a talk ends) keeps it if the
two talked at the café between `due − 90` and `due + grace`, and
`evaluateCommitments` breaks it once that window is past.

## Scores

Offered with `offerScores(policy)` in the policy's own units, never as rules:

- `invite_to_meal`: grows with closeness to the target and with
  `trait('sociability')`; zero or negative toward a stranger.
- `accept_meal`: grows with closeness to the asker and with their trust; shrinks
  by 22 per open commitment due within 90 minutes of the sitting.
- `decline_meal`: the mirror — grows with that clash and as closeness falls.

`candidateMeta` exposes `{ fromId, fromName, locationId, dueDay, dueMin }` for
accept/decline and `{ locationId, dueDay, dueMin }` for the invitation.

## Saved instances

`LT.Content.register({ id:'shared-meal', version:'v01', interventionTypes:[],
objectTypes:{ meal_invitation:{ validate, visual } } })`. `visual` always returns
`null`. `validate(object, env)` type-checks every field and refuses, by name: an
unknown inviter; an unknown invitee; an invitation to oneself; an unknown place;
an `open` invitation not held by the invitee; an `accepted`/`declined` one still
held (or still offering the held actions, or with no answer time); a non-whole or
non-finite due/expiry; and a location or position it can never have.

## Needed from the core

**Nothing at this base.** The one hook this kind of package needs — perception
offering the `heldAffordances` of an object a person carries — is already in the
core (`LT.Perception.HELD_AFFORDANCES === true`, `lt-perception.js`), which is
what lets an invitee be offered `accept_meal` / `decline_meal` and nobody else.
`test/pipeline.js` stops with a clear message if that flag is ever false rather
than pretending a carried answer is reachable. The package never touches
perception itself; it only maintains the invitation's `heldAffordances` list.

## Assumptions / unresolved

- One invitee may hold several open invitations at once (from different askers).
  Since `accept_meal`/`decline_meal` name no target, a single question answers
  the one held invitation that is due soonest (ties by id); the others stay open
  until they expire. With one invitation in hand — the common case — this is
  unambiguous.
- The two sittings are same-day only: no invitation crosses midnight.
- An unanswered invitation is left `open` in state on purpose; there is no
  expiry hook, and both actions simply stop being eligible.

## Commands

```
node living-town/content/shared-meal-v01/test/shared-meal.js   # shared-meal: 87/87, exit 0
node living-town/content/shared-meal-v01/test/pipeline.js      # shared-meal pipeline: 18/18, exit 0
node living-town/content/shared-meal-v01/tools/measure.js      # {"invited":12,"accepted":6,"declined":3,"kept":4,"broken":2}, exit 0
node living-town/test/run-all.js                               # PASS living-town/test — 1045 checks total (unchanged by this package)
```
