# lost-wallet-v01

One wallet Nadia-style: someone loses it, someone else may find it. The finder
may return it (the owner's trust rises) or keep the money (privately, with no way
for the owner to find out). Nothing here decides anything — it defines an object,
three actions, one typed intervention, what a saved instance may look like, and
what each action is worth to a person's own policy.

## Files

- `lost-wallet.js` — object `wallet_lost`, actions `pick_up_wallet`,
  `return_wallet`, `keep_wallet_money`, intervention `wallet_lost`, the
  `LT.Content` declaration and the UtilityPolicy scores.
- `test/lost-wallet.js` — callback tests (119 checks). Run:
  `node living-town/content/lost-wallet-v01/test/lost-wallet.js`
- `test/pipeline.js` — the full pipeline. The find half runs here; the carried
  half is gated (see "Needed from the core").

## The object

All state lives on the object in `sim.state.objects`; nothing in closures.

| field | meaning |
| --- | --- |
| `id` / `typeId` | instance id and `'wallet_lost'` |
| `name` | `'a lost wallet'` — never the owner's name, so a finder learns whose it is only by picking it up |
| `ownerId` | the character it belongs to |
| `cash` | EUR inside, finite and > 0; stays with the wallet record after it is paid out |
| `location`, `x`, `y` | where it lies while `lost`; all `null` once it is not lying anywhere |
| `anchors.pick_up_wallet` | `{x,y,dir}` the cell it is picked up from |
| `heldBy` | the carrier's id while `carried`, otherwise `null` |
| `foundBy` | who picked it up first, or `null` |
| `status` | `'lost'` → `'carried'` → `'returned'` or `'kept'` |
| `affordances` | `['pick_up_wallet']` while `lost`, otherwise `[]` |
| `heldAffordances` | `['return_wallet','keep_wallet_money']` while `carried`, otherwise `[]` |
| `inUseBy` | the core's claim while someone is picking it up (set by `Sim.claim`) |
| `interventionId` | the record that created it |

The pick-up spot is a declaration, not a reservation: it is the core that gives a
use spot to whoever is doing something from it. If somebody is busy on that tile,
the core's one-tile-one-person rule (`spot_occupied`) makes `pick_up_wallet`
illegal for everyone else and the wallet stays `lost` and unclaimed — no one
picks it up from across the room. The callback tests prove the rule reaches this
action, and that it lifts as soon as the spot is free.

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
left without a location for the same reason. The owner learns where it fell only
by being there and perceiving it themselves.

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
   target is in the same place and not in transit. `onComplete`: cash to
   `owner.money` once, `status:'returned'`, `heldBy:null`;
   `adjustRelationship(owner, actor.id, {trust:+10, closeness:+6})` and
   `adjustRelationship(actor, owner.id, {closeness:+3})`; event
   `WALLET_RETURNED` with `notify:[ownerId]`.
3. **`keep_wallet_money`** — no target, anywhere, 1 min. Eligible while the
   actor carries a `carried` wallet. `onComplete`: cash to `actor.money` once,
   `status:'kept'`, `heldBy:null`; event `WALLET_KEPT`, private. No relationship
   moves, and nothing lets the owner find out.

No action touches hunger, energy, savings or goals. The cash is never
duplicated: pockets + the cash of wallets that are still `lost` or `carried` is
constant through every path (test: "cash is never duplicated").

## Scores

Offered with `offerScores(LT.UtilityPolicy)` in the policy's own units, never as
rules:

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
`{typeId:'wallet_lost', state:'lost'}` while `status==='lost'`, otherwise `null`.

`validate(object, env)` accepts a wallet in all four states and refuses
corruptions by name, including: an owner who is not in the town, a `heldBy` who
is not in the town, `carried` with a location, `lost` with a holder, a cash
amount that is not positive, and an unknown status.

## Needed from the core (NOT present at this base commit)

`LT.Perception.observe`/`candidates` offer an object's `affordances` only for
objects lying in the actor's place (`lt-perception.js`, the loop over
`sim.objectsAt(actor.location)`). Nothing offers `heldAffordances` of an object
the actor carries. So a person who has picked a wallet up is never offered
`return_wallet` or `keep_wallet_money`.

The package does **not** add this to the core, does not write to the perception
code, and does not shim it in a test. It ships the affordances on the object
(`heldAffordances`, maintained by the three actions) and documents the gap here.

**The one hook needed:** when perception can also walk the objects a character
carries (`o.heldBy === actor.id`, `o.status === 'carried'`) and consider their
`heldAffordances`, the carried half becomes reachable. Name that capability
`LT.Perception.HELD_AFFORDANCES = true` so the pipeline can tell the two builds
apart.

`test/pipeline.js` behaves accordingly:

- the **find half** (intervention → perceive → walk to the use spot → pick up)
  runs now, on a real `LT.Sim` and a `MockPolicy`, and prints its `ok` lines;
- if `LT.Perception.HELD_AFFORDANCES !== true` it then prints exactly
  `PIPELINE HELD HALF NOT RUN` and exits **2** — never 0, because a half that did
  not run has not passed;
- it exits **0** only when both halves ran.

Nothing in a test sets `HELD_AFFORDANCES` or wraps `Perception.candidates`; the
flag is the core's to set.

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
  the five-inhabitant `LT.Scenario.town`, where a neighbour (`resident_e`) loses
  the wallet.

## Commands

```
node living-town/content/lost-wallet-v01/test/lost-wallet.js   # lost-wallet: 119/119, exit 0
node living-town/content/lost-wallet-v01/test/pipeline.js      # find half all ok, then PIPELINE HELD HALF NOT RUN, exit 2
node living-town/test/run-all.js                               # PASS living-town/test — 695 checks total (unchanged by this package)
```
