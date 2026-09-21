# DEEPSEEK TASK — Living Town content package `shared-meal-v01`

One deliverable: a content package. No engine work, no UI, no graphics, no model calls.
If you believe this task is wrong or impossible as written, STOP and say so. Do not build a
substitute, do not re-scope, do not "pre-fix" anything outside the fence.

## Base and fence

- Repo `ember-mind/twin-peaks-game`. Create a worktree from `origin/main` at its current head (it must
  contain the front-gardens street; verify with `git merge-base --is-ancestor f843abd HEAD && echo ok`).
  First run `git branch -a | grep shared-meal`; if anything is listed, STOP and say so.
  New branch: `feat/living-town-shared-meal`. Never push. Never touch `main`. Stage explicit paths only.
- BEFORE writing anything, run `node living-town/test/run-all.js` and note its last line
  (`PASS living-town/test — K checks total`). K must be the same when you finish.
- Write ONLY under `living-town/content/shared-meal-v01/`:
  `shared-meal.js`, `README.md`, `test/shared-meal.js`, `test/pipeline.js`, `tools/measure.js`.
- Do NOT edit anything in `living-town/js/`, `living-town/test/`, `living-town/index.html`,
  `living-town/docs/` or any other package. If the core lacks something, write it in the README under
  "Needed from the core" and keep going.
- Your model is `living-town/content/lost-wallet-v01/` (read `lost-wallet.js` and both tests
  completely before writing a line). Same style: ES5 IIFE, `LT` global, works under Node with
  `global.window = global`, no dependencies, no `Math.random`, no `Date`.
- Contracts to read, not to change: `living-town/js/lt-actions.js` (header, `A.define`, `help_out`),
  `living-town/js/lt-content.js`, `living-town/js/policy/lt-utility-policy.js` (`defineScore` and the
  helpers it passes), and in `living-town/js/lt-sim.js`: `acceptOffer` (the shape of a commitment it
  pushes), `settleMeeting`, `evaluateCommitments`, `keepCommitment`, `breakCommitment`.

## What the package adds

One person invites another to eat together at a named place and hour; the other accepts or declines
by their own policy; if accepted, both carry an ordinary `social` commitment that the core already
knows how to keep (they talk there inside the window) or break (the hour passes). Nobody is decided
for: the invitation is a question put to the invitee's policy, never an outcome.

All state lives on an object in `sim.state.objects`; nothing in closures.

Object type `meal_invitation`:
`id`, `typeId:'meal_invitation'`, `name`, `fromId`, `toId` (character ids, different),
`locationId` (where to meet), `dueDay`, `dueMin`, `expiresAbs` (absolute minute after which it can no
longer be answered), `status`: `'open' | 'accepted' | 'declined'`, `answeredAbs` (`null` while open),
`location: null`, `x: null`, `y: null` (it never lies anywhere), `heldBy`: the invitee while `open`,
`null` otherwise, `affordances: []`, `heldAffordances: ['accept_meal','decline_meal']` while `open`,
`[]` otherwise.

Actions (register with `LT.Actions.define`, all three):

1. `invite_to_meal` — `targetKind:'person'`, `position:'beside_person'`, `offeredToPresent:true`,
   2 minutes. The meal is the next of two fixed sittings: lunch 13:00 or dinner 19:30, same day, at
   `cafe`. Eligible only if ALL hold: target is in the same place and not in transit; it is at least
   60 and at most 360 minutes before that sitting; the café is open at the sitting
   (`LT.World.LOCATIONS.cafe.opens/closes`); neither person already has an `open` commitment of kind
   `social` with the other; no `open` `meal_invitation` exists between the two in either direction;
   the actor has issued no other invitation today (count objects, not a closure). `onComplete`
   creates the object (id `meal_<day>_<fromId>_<toId>_<sitting>`), `expiresAbs` = sitting − 45.
   Event `MEAL_INVITED`, `notify:[toId]`.
2. `accept_meal` — `targetKind:null`, `position:'anywhere'`, 1 minute. Eligible only if the actor
   holds an `open` invitation and `now <= expiresAbs`. `onComplete`: `status:'accepted'`,
   `heldBy:null`, `heldAffordances:[]`, `answeredAbs`; pushes ONE commitment on EACH of the two people,
   in exactly the shape `acceptOffer` pushes: `id:'cmt_meal_' + invitation.id`, `kind:'social'`,
   `strength:'soft'`, `withId` the other person, `locationId`, `label`, `dueDay`, `dueMin`,
   `graceMin:30`, `status:'open'`. Event `MEAL_ACCEPTED`, `notify:[fromId]`.
   `sim.adjustRelationship` both ways `{closeness:+1}`.
3. `decline_meal` — same shape and eligibility as `accept_meal`. `onComplete`: `status:'declined'`,
   `heldBy:null`, `heldAffordances:[]`, `answeredAbs`; no commitment; event `MEAL_DECLINED`,
   `notify:[fromId]`; `sim.adjustRelationship(inviter, invitee.id, {closeness:-1})` and nothing else.

An invitation nobody answers simply stops being answerable after `expiresAbs` (both actions
ineligible); it stays `open` in state and that is fine — do not add a ticking hook.
No action changes hunger, energy, money or goals directly. Keeping or breaking the meeting is the
core's business: do NOT call `keepCommitment`/`breakCommitment` yourself and do not reimplement them.

Scores, offered with `offerScores(policy)` exactly as the model package does (suggestions in the
policy's own units, never rules; nothing like "always accept"):
- `invite_to_meal`: grows with closeness to the target (`req.relationships[targetId].closeness`) and
  with `trait('sociability')`; zero or negative when closeness is low.
- `accept_meal`: grows with closeness to the inviter and with trust; shrinks when the actor already
  has an `open` commitment due within 90 minutes of the sitting (`req.commitments`).
- `decline_meal`: the mirror — grows with that clash and with low closeness.
`candidateMeta` exposes `{ fromId, fromName, locationId, dueDay, dueMin }` for accept/decline and
`{ locationId, dueDay, dueMin }` for the invitation.

`LT.Content.register({ id:'shared-meal', version:'v01', interventionTypes:[],
objectTypes:{ meal_invitation:{ validate, visual } } })`. `visual` always returns `null`.
`validate(object, env)` type-checks every field above and refuses by name: unknown `fromId`/`toId`,
`fromId === toId`, unknown `locationId`, a `status`/`heldBy`/`heldAffordances` combination that
cannot happen (`open` not held by the invitee, `accepted` still held, …), non-finite times.

`tools/measure.js`: loads the core + this package, runs `LT.Scenario.town({})` for 3 days with the
default policy, prints ONE JSON line: `{"invited":n,"accepted":n,"declined":n,"kept":n,"broken":n}`
counted from `sim.state.events` and commitments whose id starts with `cmt_meal_`; run twice in the
same process from fresh sims and exit non-zero if the two lines differ.

## Done means these commands, with this output

```
node living-town/content/shared-meal-v01/test/shared-meal.js   # last line: shared-meal: N/N (N >= 50), exit 0
node living-town/content/shared-meal-v01/test/pipeline.js      # last line: shared-meal pipeline: M/M (M >= 12), exit 0
node living-town/content/shared-meal-v01/tools/measure.js      # one JSON line, invited >= 2, accepted >= 1, kept + broken >= 1, exit 0
node living-town/test/run-all.js                               # same K as before you started, exit 0
git status --short                                             # only files under living-town/content/shared-meal-v01/
```
`pipeline.js` must drive the REAL path, not call `onComplete` by hand: a town sim where perception
offers `invite_to_meal`, a policy picks it, the invitee is then offered `accept_meal`/`decline_meal`
through `HELD_AFFORDANCES`, picks one, and — in the accepted case — the two talk at the café inside
the window and the core marks both commitments `kept`; and a second run where the invitee never goes
and the core marks them `broken`. Use a scripted policy for those choices (see how the model
package's pipeline does it); the default `UtilityPolicy` is only for `measure.js`.

Required checks among the N (name them so they can be grepped): an invitation cannot be answered
twice; a second invitation between the same two while one is open is refused in both directions;
one invitation per inviter per day; accept after `expiresAbs` is refused; exactly two commitments
appear on accept and none on decline; the two commitments are mirror images (`withId` swapped, same
due); `JSON.parse(JSON.stringify(state))` round-trips an invitation in each of the three statuses and
`validate` accepts all three and refuses six named corruptions; a save taken with an open invitation
(`LT.Save.serialize` → `deserialize`) evolves identically to the sim that never stopped for 120 minutes.

If `measure.js` cannot reach its numbers with honest scores, do NOT inflate the scores until it
does and do NOT loosen the eligibility: report the numbers you get and why.

## Report back

Branch, full commit hash, the five command outputs pasted verbatim (not summarised), the list of
"Needed from the core", and anything you could not do. Do not describe results you did not run.
