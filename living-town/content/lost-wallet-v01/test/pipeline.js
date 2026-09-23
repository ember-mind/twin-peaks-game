/* pipeline.js — Living Town content package `lost-wallet-v01`: the FULL pipeline.
 *
 * A real LT.Sim, a real clock, and two small local policies of the kind
 * living-town/test/everyday.js calls `chooser`: each decision request is
 * answered by preferring an action id, in order, from the real candidates the
 * simulation actually offers — never a shortcut into the object or the state.
 *
 * The core already offers `heldAffordances` of a carried object
 * (LT.Perception.HELD_AFFORDANCES, lt-perception.js): a wallet a finder is
 * carrying is what makes return_wallet / keep_wallet_money reachable at all,
 * toward the owner or on the finder's own, exactly as it makes pick_up_wallet
 * reachable while the wallet still lies on the ground. There is no gated half
 * any more: both halves of this file must run and pass.
 *
 * Two full runs, the two endings:
 *   - a finder who returns the wallet: the owner's money moves once, their
 *     relationship moves, the owner is notified.
 *   - a finder who keeps the money: the finder's money moves once, nobody is
 *     told, no relationship moves.
 * In both, the sum of everyone's money plus the wallet's own cash while it is
 * still `lost` or `carried` is checked at every minute the run takes, not only
 * before and after.
 *
 * A third run proves a wallet in each of the four reachable statuses survives
 * the real save round trip — LT.Save.serialize -> JSON -> LT.Save.deserialize —
 * including a `carried` wallet, whose `location` is `null`.
 *
 * node living-town/content/lost-wallet-v01/test/pipeline.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');

require(path.resolve(__dirname, '..', '..', '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', '..', '..', 'js', 'lt-save.js'));
require(path.resolve(__dirname, '..', 'lost-wallet.js'));
const LT = global.LT;
const LW = LT.LostWallet, W = LT.World, P = LT.Perception;

/* A gate, not a courtesy: without this, a carried wallet could never be
 * offered return_wallet or keep_wallet_money, and running only the find half
 * would be pretending a pipeline that cannot work does. */
if (P.HELD_AFFORDANCES !== true) {
  console.error('lost-wallet pipeline: this checkout is wrong for this package. ' +
    'LT.Perception.HELD_AFFORDANCES is not true, so perception can never offer the ' +
    'actions a carried wallet lists in heldAffordances. Stopping rather than running ' +
    'only the find half.');
  process.exit(1);
}

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

let chooserSeq = 0;
/* The same shape as living-town/test/everyday.js's `chooser`: a policy that
 * answers every request by preferring an action id, in the given order, from
 * the real candidates it was actually offered this minute. */
function chooser(prefs) {
  const id = 'lost_wallet_chooser_' + (++chooserSeq);
  const api = {
    id, asked: [],
    decide(request) {
      api.asked.push(request.candidates.map((c) => c.id));
      for (const p of prefs) {
        const c = request.candidates.find((x) => x.actionId === p);
        if (c) return Promise.resolve(LT.Policy.selected(request, c.id, id));
      }
      return Promise.resolve(LT.Policy.selected(request, 'wait', id));
    }
  };
  LT.Policy.register(api);
  return api;
}

/* Every euro in the town this minute: pockets, plus the cash still sitting in
 * a wallet that is `lost` or `carried` (not yet landed anywhere). This is the
 * number that must never move, along any path. */
function cashInTown(sim) {
  let sum = 0;
  Object.keys(sim.state.characters).forEach((id) => { sum += sim.state.characters[id].money; });
  sim.state.objects.forEach((o) => {
    if (o.typeId === 'wallet_lost' && (o.status === 'lost' || o.status === 'carried')) sum += o.cash;
  });
  return Math.round(sum * 100) / 100;
}

/* A known-walkable pair of cells in the park, reused from the package's own
 * callback tests: the wallet's own cell and its declared use spot. */
const PARK_WALLET_CELL = { x: 28, y: 17 };
const PARK_USE_SPOT = { x: 28, y: 18, dir: 'up' };
/* Far enough from the use spot that picking the wallet up is a real walk, not
 * an instant grab from where the finder already stands. */
const FINDER_START = { x: 14, y: 18, dir: 'right' };
const OWNER_START = { x: 36, y: 18, dir: 'left' };

/* Run the sim a minute at a time until `done(wallet)` is true or the run has
 * gone on unreasonably long, checking the money invariant at every single
 * minute along the way (not only before and after). Returns how many minutes
 * it took. */
async function runUntilSampling(sim, wallet, total, done, cap) {
  const violations = [];
  let minute = 0;
  while (!done(wallet) && minute < cap) {
    await sim.runMinutes(1);
    minute++;
    const now = cashInTown(sim);
    if (now !== total) violations.push('minute ' + minute + ': ' + now + ' (was ' + total + ')');
  }
  ok(violations.length === 0,
     'the sum of everyone\'s money plus the wallet\'s cash held constant at ' + total +
     ' through all ' + minute + ' sampled minutes' +
     (violations.length ? ' (broke at ' + violations.slice(0, 3).join('; ') + ')' : ''));
  return minute;
}

/* ---------------- ending one: the wallet is returned ---------------- */

async function returnedEnding() {
  console.log('# pipeline (return ending): found, walked over, returned — cash and relationship move once');
  const ownerPolicy = chooser([]);                              // never leaves, never asked for anything relevant
  const finderPolicy = chooser(['pick_up_wallet', 'return_wallet']);
  const sim = LT.Scenario.day1({
    intervention: false, everyday: false,
    policies: { resident_a: ownerPolicy.id, resident_b: finderPolicy.id }
  });
  const owner = sim.state.characters.resident_a, finder = sim.state.characters.resident_b;
  sim.placeCharacter(owner, 'park', OWNER_START);
  sim.placeCharacter(finder, 'park', FINDER_START);

  const ownerRelBefore = JSON.parse(JSON.stringify(owner.relationships.resident_b));
  const finderRelBefore = JSON.parse(JSON.stringify(finder.relationships.resident_a));
  const ownerMoneyBefore = owner.money, finderMoneyBefore = finder.money;

  const total = cashInTown(sim);
  const params = {
    id: 'wallet_pipe_ret', ownerId: 'resident_a', cash: 9, locationId: 'park',
    x: PARK_WALLET_CELL.x, y: PARK_WALLET_CELL.y, useSpot: PARK_USE_SPOT
  };
  const scheduled = sim.scheduleIntervention({ type: 'wallet_lost', source: 'pipeline', params: params });
  assert(scheduled.ok, 'the wallet intervention schedules: ' + scheduled.error);
  sim.applyDueInterventions();
  ok(cashInTown(sim) === total, 'the cash the owner just lost is already counted by the invariant, at minute 0');

  const wallet = sim.objectById('wallet_pipe_ret');
  ok(wallet !== null && wallet.status === 'lost', 'the wallet exists, lost, before any decision');
  ok(owner.money === Math.round((ownerMoneyBefore - 9) * 100) / 100, 'the cash left the owner exactly once, at the loss');
  const distance = sim.routeLength(W.LOCATIONS.park, finder.pos, params.useSpot);
  ok(distance > 0, 'the finder has a real walk to the use spot (' + distance + ' steps), not an instant pick-up');

  const minutes = await runUntilSampling(sim, wallet, total, (w) => w.status === 'returned', 90);
  ok(wallet.status === 'returned', 'the wallet reached "returned" through the real tick, within ' + minutes + ' minutes');
  ok(wallet.heldBy === null && wallet.location === null, 'and is held by nobody, lying nowhere, once returned');

  const found = sim.state.events.filter((e) => e.type === 'ACTIVITY_STARTED' && e.data.actionId === 'pick_up_wallet' && e.actorId === 'resident_b');
  const returned = sim.state.events.filter((e) => e.type === 'ACTIVITY_STARTED' && e.data.actionId === 'return_wallet' && e.actorId === 'resident_b');
  ok(found.length === 1 && found[0].data.source === finderPolicy.id, 'pick_up_wallet was chosen once, by the finder\'s own policy');
  ok(returned.length === 1 && returned[0].data.source === finderPolicy.id,
     'return_wallet was chosen once, by the same policy — offered only because the core lists it in the carried wallet\'s heldAffordances');

  ok(owner.money === Math.round((ownerMoneyBefore - 9 + 9) * 100) / 100 && finder.money === finderMoneyBefore,
     'the cash landed back in the owner\'s pocket exactly once, and never in the finder\'s');
  ok(sim.state.events.filter((e) => e.type === 'WALLET_RETURNED').length === 1,
     'exactly one WALLET_RETURNED event, not one per tick');

  const ownerRelAfter = owner.relationships.resident_b, finderRelAfter = finder.relationships.resident_a;
  ok(ownerRelAfter.trust > ownerRelBefore.trust && ownerRelAfter.closeness > ownerRelBefore.closeness,
     'the owner\'s trust and closeness toward the finder moved (' + ownerRelBefore.trust + '->' + ownerRelAfter.trust +
     ', ' + ownerRelBefore.closeness + '->' + ownerRelAfter.closeness + ')');
  ok(finderRelAfter.closeness > finderRelBefore.closeness,
     'the finder\'s own closeness to the owner moved as well');

  ok((owner.memories || []).some((m) => m.type === 'WALLET_RETURNED'),
     'the owner was notified: WALLET_RETURNED is in their memory');
  ok(!(owner.memories || []).some((m) => m.type === 'WALLET_LOST'),
     'and still never learned where it fell in the first place');
}

/* ---------------- ending two: the finder keeps the money ---------------- */

async function keptEnding() {
  console.log('# pipeline (kept ending): found, and the money is kept — privately, once, no relationship moves');
  const ownerPolicy = chooser([]);
  const finderPolicy = chooser(['pick_up_wallet', 'keep_wallet_money']);
  const sim = LT.Scenario.day1({
    intervention: false, everyday: false,
    policies: { resident_a: ownerPolicy.id, resident_b: finderPolicy.id }
  });
  const owner = sim.state.characters.resident_a, finder = sim.state.characters.resident_b;
  sim.placeCharacter(owner, 'park', OWNER_START);
  sim.placeCharacter(finder, 'park', FINDER_START);

  const ownerRelBefore = JSON.parse(JSON.stringify(owner.relationships.resident_b));
  const finderRelBefore = JSON.parse(JSON.stringify(finder.relationships.resident_a));
  const ownerMoneyBefore = owner.money, finderMoneyBefore = finder.money;

  const total = cashInTown(sim);
  const params = {
    id: 'wallet_pipe_keep', ownerId: 'resident_a', cash: 6, locationId: 'park',
    x: PARK_WALLET_CELL.x, y: PARK_WALLET_CELL.y, useSpot: PARK_USE_SPOT
  };
  const scheduled = sim.scheduleIntervention({ type: 'wallet_lost', source: 'pipeline', params: params });
  assert(scheduled.ok, 'the wallet intervention schedules: ' + scheduled.error);
  sim.applyDueInterventions();
  const wallet = sim.objectById('wallet_pipe_keep');
  ok(wallet !== null && wallet.status === 'lost', 'the wallet exists, lost, before any decision');

  const minutes = await runUntilSampling(sim, wallet, total, (w) => w.status === 'kept', 90);
  ok(wallet.status === 'kept', 'the wallet reached "kept" through the real tick, within ' + minutes + ' minutes');
  ok(wallet.heldBy === null, 'and is held by nobody once settled');

  const kept = sim.state.events.filter((e) => e.type === 'ACTIVITY_STARTED' && e.data.actionId === 'keep_wallet_money' && e.actorId === 'resident_b');
  ok(kept.length === 1 && kept[0].data.source === finderPolicy.id,
     'keep_wallet_money was chosen once, by the finder\'s own policy — offered on its own, needing no person present');

  ok(finder.money === Math.round((finderMoneyBefore + 6) * 100) / 100, 'the cash landed in the finder\'s pocket exactly once');
  ok(owner.money === Math.round((ownerMoneyBefore - 6) * 100) / 100, 'and the owner never got it back');
  ok(sim.state.events.filter((e) => e.type === 'WALLET_KEPT').length === 1,
     'exactly one WALLET_KEPT event, not one per tick');

  ok(!(owner.memories || []).some((m) => m.type === 'WALLET_KEPT' || m.type === 'WALLET_FOUND' || m.type === 'WALLET_LOST'),
     'the owner was never told: not that it was lost, not that it was found, not that the money was kept');
  ok(JSON.stringify(owner.relationships.resident_b) === JSON.stringify(ownerRelBefore),
     'no relationship moved on the owner\'s side');
  ok(JSON.stringify(finder.relationships.resident_a) === JSON.stringify(finderRelBefore),
     'no relationship moved on the finder\'s side either');
}

/* ---------------- a wallet in each status survives the real save round trip ---------------- */

async function saveRoundTripAcrossStatuses() {
  console.log('# save round trip: LT.Save.serialize -> JSON -> LT.Save.deserialize, a wallet in each of the four reachable statuses');
  const sim = LT.Scenario.day1({ intervention: false, everyday: false });
  const a = sim.state.characters.resident_a, b = sim.state.characters.resident_b;

  function drop(id, ownerId, x, y) {
    const spot = { x: x, y: y + 1, dir: 'up' };
    const r = sim.scheduleIntervention({
      type: 'wallet_lost', source: 'test',
      params: { id: id, ownerId: ownerId, cash: 2, locationId: 'park', x: x, y: y, useSpot: spot }
    });
    assert(r.ok, 'schedule failed for ' + id + ': ' + r.error);
    sim.applyDueInterventions();
    return sim.objectById(id);
  }

  const lost = drop('wallet_save_lost', 'resident_a', 27, 17);

  const carried = drop('wallet_save_carried', 'resident_a', 28, 17);
  sim.placeCharacter(b, 'park', carried.anchors.pick_up_wallet);
  LW.ACTIONS.pick_up_wallet.onComplete(sim.context(b, carried));
  ok(carried.status === 'carried' && carried.location === null, 'the carried instance really does have location: null before it is saved');

  const returned = drop('wallet_save_returned', 'resident_a', 29, 17);
  sim.placeCharacter(a, 'park', returned.anchors.pick_up_wallet);
  LW.ACTIONS.pick_up_wallet.onComplete(sim.context(a, returned));   // the owner recovers their own

  const kept = drop('wallet_save_kept', 'resident_b', 30, 17);
  sim.placeCharacter(a, 'park', kept.anchors.pick_up_wallet);
  LW.ACTIONS.pick_up_wallet.onComplete(sim.context(a, kept));
  LW.ACTIONS.keep_wallet_money.onComplete(sim.context(a, null));

  const statuses = [lost, carried, returned, kept].map((o) => o.status).sort();
  ok(statuses.join(',') === 'carried,kept,lost,returned', 'all four reachable statuses exist in the world before it is saved');

  const serialized = LT.Save.serialize(sim);
  const text = JSON.stringify(serialized);
  const restored = LT.Save.deserialize(JSON.parse(text));

  ['wallet_save_lost', 'wallet_save_carried', 'wallet_save_returned', 'wallet_save_kept'].forEach((id) => {
    const before = sim.objectById(id), after = restored.objectById(id);
    ok(after !== null && after.status === before.status && after.cash === before.cash &&
       after.heldBy === before.heldBy && after.location === before.location,
       'a ' + before.status + ' wallet survives the round trip with its status, cash, holder and location intact');
  });
  ok(restored.objectById('wallet_save_carried').location === null,
     'the restored world still accepts the carried wallet with location: null — validate(object, env) was never asked to refuse it');

  /* And the restored world is not merely data: it is a live Sim that can keep
   * running. */
  await restored.runMinutes(5);
  ok(restored.state.minute !== sim.state.minute || restored.state.day !== sim.state.day,
     'the restored world carries on: five simulated minutes actually passed');
}

async function main() {
  await returnedEnding();
  await keptEnding();
  await saveRoundTripAcrossStatuses();
  console.log('\nlost-wallet pipeline: ' + checks + '/' + checks);
}

main().catch((e) => { console.error(e); process.exit(1); });
