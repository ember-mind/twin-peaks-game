# lost-wallet-v01

One wallet someone has lost, which someone else may find. The owner is within
sight of their goal; the finder may return it (the owner's trust and closeness
rise) or keep the money privately, weighed on the finder's own
conscientiousness, caution and need for money. Nothing here decides anything —
it defines an object, three actions, one typed intervention, what a saved
instance may look like, and what each action is worth to a person's own
policy.

## Files

- `lost-wallet.js` — object `wallet_lost`, actions `pick_up_wallet`,
  `return_wallet`, `keep_wallet_money`, intervention `wallet_lost`, the
  `LT.Content` declaration and the UtilityPolicy scores.
- `test/lost-wallet.js` — callback tests (119 checks), the way the model
  package's own tests do. Run:
  `node living-town/content/lost-wallet-v01/test/lost-wallet.js`
- `test/pipeline.js` — the full pipeline, both halves, on a real `LT.Sim`
  (34 checks). Run:
  `node living-town/content/lost-wallet-v01/test/pipeline.js`

## The object

All state lives on the object in `sim.state.objects`; nothing in closures.

| field | meaning |
| --- | --- |
| `id` / `typeId` | instance id and `'wallet_lost'` |
| `name` | `'a lost wallet'` — never the owner's name, so a finder learns whose it is only by picking it up |
| `ownerId` | the character it belongs to |
| `cash` | EUR inside, finite and > 0; stays on the wallet record after it is paid out |
| `location`, `x`, `y` | where it lies while `lost`; all `null` once it is not lying anywhere (`carried`, `returned`, `kept`) |
| `anchors.pick_up_wallet` | `{x,y,dir}` the cell it is picked up from |
| `heldBy` | the carrier's id while `carried`, otherwise `null` |
| `foundBy` | who picked it up first, or `null` |
| `status` | `'lost'` → `'carried'` → `'returned'` or `'kept'` |
| `affordances` | `['pick_up_wallet']` while `lost`, otherwise `[]` |
| `heldAffordances` | `['return_wallet','keep_wallet_money']` while `carried`, otherwise `[]` |
| `inUseBy` | the core's claim while someone is picking it up (`Sim.claim` / `Sim.releaseClaim`, because `pick_up_wallet` is `exclusive`) |
| `interventionId` | the record that created it |

The pick-up spot is a declaration, not a reservation: the core gives a use spot
to whoever is doing something from it. If somebody is busy on that tile, the
core's one-tile-one-person rule (`spot_occupied`) makes `pick_up_wallet`
illegal for everyone else and the wallet stays `lost` and unclaimed — nobody
picks it up from across the room. The callback tests prove the rule reaches
this action, and that it lifts once the spot is free.

Once `carried`, what actually makes `return_wallet` and `keep_wallet_money`
reachable is perception offering an object's `heldAffordances` to whoever
holds it (`lt-perception.js`, `LT.Perception.HELD_AFFORDANCES === true`):
`return_wallet` is offered toward each person present, because its
`targetKind` is `'person'`; `keep_wallet_money` is offered on its own, because
its `targetKind` is `null`. This package only maintains the two lists as the
wallet moves between states; it never touches perception itself. See
`living-town/test/need.js` ("a carried thing can offer actions") for the core
mechanism this package relies on, and `test/pipeline.js` for both actions
actually being chosen and executed through it.

## The intervention `wallet_lost`

```
{ id, ownerId, cash, locationId, x, y, useSpot: { x, y, dir? } }
```

`validate` refuses by name: `invalid_id`, `unknown_owner`, `invalid_cash`,
`cash_exceeds_owner_money`, `id_in_use`, `unknown_location`,
`object_position_out_of_bounds`, `object_position_not_floor`, `missing_use_spot`,
`invalid_use_spot`, `use_spot_out_of_bounds`, `use_spot_not_walkable`,
`invalid_use_spot_dir`, `use_spot_unreachable`.

`apply` takes `cash` out of `owner.money` exactly once (a second application of
the same `id` is refused as `id_in_use` before any money moves) and creates the
object. The owner is **not** told where it is: `WALLET_LOST` is private, its
`subjectId` is the owner, nobody is notified, and the generic applied event is
left without a location for the same reason. The owner learns where it fell
only by being there and perceiving it themselves.

## The actions

1. **`pick_up_wallet`** — object, `use_spot`, exclusive, 2 min, not
   interruptible. Eligible only while `lost` and only from its own room. At the
   use spot: if the actor is the owner, the cash goes straight back
   (`status:'returned'`, event `WALLET_RECOVERED`); anyone else carries it
   (`status:'carried'`, `heldBy`, `foundBy`, `location:null`, event
   `WALLET_FOUND`, private to the finder). No candidate meta: whose wallet it is
   is learned only after picking it up.
2. **`return_wallet`** — person, `beside_person`, 3 min. Eligible only if the
   actor carries a `carried` wallet whose `ownerId` is the target, and the
   target is in the same place and not in transit (the core re-checks this
   every minute it takes: if the owner leaves, the activity fails as
   `partner_left`). `onComplete`: cash to `owner.money` once, `status:'returned'`,
   `heldBy:null`; `adjustRelationship(owner, actor.id, {trust:+10, closeness:+6})`
   and `adjustRelationship(actor, owner.id, {closeness:+3})` — the core's own
   closeness gain tapers as two people grow closer, so the actual rise is not a
   flat number; event `WALLET_RETURNED` with `notify:[ownerId]`.
3. **`keep_wallet_money`** — no target, `anywhere`, 1 min. Eligible while the
   actor carries a `carried` wallet. `onComplete`: cash to `actor.money` once,
   `status:'kept'`, `heldBy:null`; event `WALLET_KEPT`, private. No relationship
   moves, and nothing lets the owner find out.

No action touches hunger, energy, savings or goals. The cash is never
duplicated: pockets + the cash of wallets still `lost` or `carried` is constant
through every path (see "the invariant, every path" in `test/lost-wallet.js`,
and both endings of `test/pipeline.js`, checked at every minute the run takes).

## Scores

Offered with `offerScores(LT.UtilityPolicy)` in the policy's own units, never as
rules — nothing like "always return":

- `pick_up_wallet`: a small curiosity term.
- `return_wallet`: grows with `conscientiousness` and with closeness to the
  owner (`req.relationships[ownerId].closeness`).
- `keep_wallet_money`: grows with `cash × urgency`, shrinks with
  `conscientiousness` and `caution`.

`candidateMeta` exposes `{cash, ownerId, ownerName}` for the two carried actions
and nothing for `pick_up_wallet`.

## Saved instances

`LT.Content.register({ id:'lost-wallet', version:'v01', interventionTypes:['wallet_lost'],
objectTypes:{ wallet_lost:{ validate, visual } } })`. `visual` returns
`{typeId:'wallet_lost', state:'lost'}` while `status==='lost'`, otherwise `null`
(a carried, returned or kept wallet is not lying anywhere).

`validate(object, env)` accepts a wallet in all four states — including
`carried`, `returned` and `kept` with `location: null`, which is the ordinary
shape of those three states, not a corruption — and refuses corruptions by
name, including: an owner who is not in the town, a `heldBy` who is not in the
town, `carried` with a location, `lost` with a holder, a cash amount that is
not positive, and an unknown status. `test/pipeline.js` puts a wallet through
each reachable status and round-trips the whole world through the real save
layer — `LT.Save.serialize` → `JSON.stringify` → `JSON.parse` →
`LT.Save.deserialize` — and the restored world keeps running.

## What the core already gives this package (used, not added)

At this base (`feat/living-town-foundation`, containing commit `1287418`):

- `LT.Perception.HELD_AFFORDANCES === true` — a carried object's
  `heldAffordances` are offered to its holder, toward each person present when
  the action's `targetKind` is `'person'`, or on its own when it is `null`
  (`lt-perception.js`). This is what makes `return_wallet` and
  `keep_wallet_money` reachable at all once the wallet is `carried`.
- `position: 'beside_person'` is re-checked every minute it takes: if the
  person leaves, or `eligible` stops holding, the activity fails
  (`partner_left`) and `onComplete` never runs.
- A use spot someone is busy on is refused (`spot_occupied`); an arrival never
  lands on an occupied tile.
- `help_out` in `living-town/js/lt-actions.js` was the model for `return_wallet`
  as a person-to-person transfer (`targetKind:'person'`, `position:'beside_person'`,
  credit both sides once, `adjustRelationship` on both sides, a `notify`ing
  event).

**Needed from the core: none.** Everything this package needs is present at the
base; nothing was added to `living-town/js/` or `living-town/test/`, and
`test/pipeline.js` runs and passes both halves — the find half and the carried
half — with no gate and no shim.

## Assumptions / unresolved

- A person can carry more than one wallet in principle; the two carried actions
  act on the first `carried` wallet the actor holds. With one wallet per finder
  (the case this package is for) this is unambiguous; a core-side carried-item
  contract would make it explicit.
- `cash` is retained on the wallet record after it is paid out; conservation is
  counted over wallets still `lost`/`carried`, which is the money that has not
  yet landed.
- Returning requires the owner to be in the same place and not in transit; the
  package never teleports the wallet to them.
- The callback tests exercise the package in both casts: the two-person day and
  the five-inhabitant `LT.Scenario.town`, where a neighbour (`resident_e`)
  loses the wallet.

## Commands

```
node living-town/content/lost-wallet-v01/test/lost-wallet.js   # lost-wallet: 119/119, exit 0
node living-town/content/lost-wallet-v01/test/pipeline.js      # lost-wallet pipeline: 34/34, exit 0 (both endings, plus the save round trip)
node living-town/test/run-all.js                               # PASS living-town/test (unchanged by this package: it is not in the FILES list)
```
