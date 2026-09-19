# DEEPSEEK TASK — Living Town content package `lost-wallet-v01`

One deliverable: a content package. No engine work, no UI, no graphics, no model calls.
If you believe this task is wrong or impossible as written, STOP and say so. Do not build a
substitute, do not re-scope, do not "pre-fix" anything outside the fence.

## Base and fence

- Repo `ember-mind/twin-peaks-game`. Create a worktree from branch `feat/living-town-foundation`
  at commit `3ed2f2a1d38ff92f553ef3878b8000b84daaa053` (verify with `git rev-parse HEAD`).
  New branch: `feat/living-town-lost-wallet`. Never push. Never touch `main`.
- Write ONLY under `living-town/content/lost-wallet-v01/`:
  `lost-wallet.js`, `README.md`, `test/lost-wallet.js`, `test/pipeline.js`.
- Do NOT edit anything in `living-town/js/`, `living-town/test/`, `living-town/index.html`
  or any other package. If the core lacks something, write it in the README under
  "Needed from the core" and keep going with the callback tests.
- Your model is the existing package `living-town/content/everyday-opportunities-v01/`
  (read `everyday-opportunities.js` and both tests completely before writing a line). Same style:
  ES5 IIFE, `LT` global, works under Node with `global.window = global`, no dependencies.
- Contracts to read, not to change: `living-town/js/lt-actions.js` (header + `A.define`),
  `living-town/js/lt-content.js`, `living-town/js/lt-interventions.js` (`define`),
  `living-town/js/policy/lt-utility-policy.js` (`defineScore`, the helpers it passes).

## What the package adds

A wallet someone has lost, which someone else may find. All state lives on the object in
`sim.state.objects`; nothing in closures.

Object type `wallet_lost`:
`id`, `typeId:'wallet_lost'`, `name`, `ownerId` (a character id), `cash` (number > 0, finite),
`location`,`x`,`y` while on the ground (`null` while carried), `anchors.pick_up_wallet {x,y,dir}`,
`heldBy` (`actorId|null`), `status`: `'lost' | 'carried' | 'returned' | 'kept'`,
`foundBy`, `interventionId`, `affordances: ['pick_up_wallet']` while `lost` (empty otherwise),
`heldAffordances: ['return_wallet','keep_wallet_money']` while `carried` (empty otherwise).

Intervention `wallet_lost` — params `{ id, ownerId, cash, locationId, x, y, useSpot:{x,y,dir} }`.
`validate` refuses by name: unknown owner, unknown place, non-floor tile, unreachable use spot,
`cash <= 0` or more than the owner's `money`, an `id` already in `state.objects`.
`apply` takes `cash` out of `owner.money` exactly once and creates the object. The owner is NOT told
where it is: the event is `private`, with `subjectId` the owner and no `notify`.
Event `WALLET_LOST`.

Actions (register with `LT.Actions.define`, all three):

1. `pick_up_wallet` — `targetKind:'object'`, `position:'use_spot'`, `exclusive:true`, 2 minutes,
   not interruptible. Eligible only if `status==='lost'`. The owner may pick up their own wallet:
   then `onComplete` returns the cash to `owner.money`, sets `status:'returned'`, event
   `WALLET_RECOVERED`. Anyone else: `status:'carried'`, `heldBy`, `foundBy`, `location:null`,
   event `WALLET_FOUND` (private to the finder; the owner is not notified).
2. `return_wallet` — `targetKind:'person'`, `position:'beside_person'`, 3 minutes. Eligible only if
   the actor holds a `carried` wallet whose `ownerId` is the target, and the target is in the same
   place and not in transit. `onComplete`: cash goes to `owner.money` once, `status:'returned'`,
   `heldBy:null`; `sim.adjustRelationship(owner, actor.id, {trust:+10, closeness:+6})` and
   `sim.adjustRelationship(actor, owner.id, {closeness:+3})`; event `WALLET_RETURNED` with
   `notify:[ownerId]`.
3. `keep_wallet_money` — `targetKind:'person'` is WRONG for this one: it needs no person. Give it
   `targetKind:null`, `position:'anywhere'`, 1 minute, eligible only if the actor holds a `carried`
   wallet. `onComplete`: cash goes to `actor.money` once, `status:'kept'`, `heldBy:null`; event
   `WALLET_KEPT`, `private:true`. No relationship change: nobody knows. Do not invent a way for the
   owner to find out.

No action changes hunger, energy, savings or goals directly.

Scores, offered with `offerScores(policy)` exactly as the model package does (suggestions in the
policy's own units, never rules; nothing like "always return"):
- `pick_up_wallet`: small curiosity term.
- `return_wallet`: grows with `trait('conscientiousness')` and with closeness to the owner
  (`req.relationships[ownerId].closeness`).
- `keep_wallet_money`: grows with `cash` times `urgency`, shrinks with `trait('conscientiousness')`
  and `trait('caution')`.
`candidateMeta` exposes `{ cash, ownerId, ownerName }` for the two carried actions and nothing for
`pick_up_wallet` (a finder learns whose it is only after picking it up).

`LT.Content.register({ id:'lost-wallet', version:'v01', interventionTypes:['wallet_lost'],
objectTypes:{ wallet_lost:{ validate, visual } } })`. `visual` returns
`{typeId:'wallet_lost', state:'lost'}` while `status==='lost'`, otherwise `null` (a carried,
returned or kept wallet is not lying anywhere). `validate(object, env)` type-checks every field
above and refuses by name: unknown owner, unknown `heldBy`, a `status`/`heldBy`/`location`
combination that cannot happen (e.g. `carried` with a location, `lost` with `heldBy`).

## Needed from the core (NOT present at the base commit — do not add it yourself)

Perception offers an object's `affordances` only for objects lying in the actor's place. Nothing yet
offers `heldAffordances` of an object the actor carries. So:
- `test/lost-wallet.js` tests every callback directly (eligible / duration / onComplete / validate /
  apply / visual / scores), the way the model package's 81 checks do.
- `test/pipeline.js` runs a real `LT.Sim` with `MockPolicy`. The find half (intervention → perceive →
  walk to the use spot → pick up) MUST run and pass at the base commit. The carried half is gated:
  if `LT.Perception.HELD_AFFORDANCES !== true`, print exactly `PIPELINE HELD HALF NOT RUN` and
  exit code 2. Exit 0 is allowed only when both halves ran. Never shim the core to get a pass.

## Done means these commands, with this output

```
node living-town/content/lost-wallet-v01/test/lost-wallet.js     # last line: lost-wallet: N/N   (N >= 60), exit 0
node living-town/content/lost-wallet-v01/test/pipeline.js        # find half all ok, then PIPELINE HELD HALF NOT RUN, exit 2
node living-town/test/run-all.js                                 # PASS living-town/test — 569 checks total (unchanged)
git status --short                                               # only files under living-town/content/lost-wallet-v01/
```
Required checks among the N (name them so they can be grepped): cash leaves the owner once and
only once across two `apply` calls with the same id; cash is never duplicated (sum of all
`money` + wallet `cash` while lost/carried is constant through every path); a second
`return_wallet`/`keep_wallet_money` on the same wallet is refused; the owner's observation does not
contain the wallet's location before they perceive it themselves; `JSON.parse(JSON.stringify(state))`
round-trips a wallet in each of the four statuses and `validate` accepts all four and refuses six
named corruptions.

## Report back

Branch, full commit hash, the four command outputs pasted verbatim (not summarised), the list of
"Needed from the core", and anything you could not do. Do not describe results you did not run.
