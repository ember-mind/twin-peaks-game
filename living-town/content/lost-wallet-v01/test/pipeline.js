/* pipeline.js — Living Town content package `lost-wallet-v01`: the FULL pipeline.
 *
 * Two halves:
 *   - the FIND half runs at this base commit: the wallet intervention applies,
 *     the finder perceives the wallet lying in the room, chooses pick_up_wallet,
 *     walks to the use spot and picks it up. All of it through a real LT.Sim and
 *     a MockPolicy.
 *   - the CARRIED half needs the core to offer the heldAffordances of an object
 *     a person carries. That hook does not exist here. When it does the core
 *     sets LT.Perception.HELD_AFFORDANCES = true; until then this file prints
 *     PIPELINE HELD HALF NOT RUN and exits 2. A half that did not run is not a
 *     pass, and the core is never shimmed to make one.
 *
 * node living-town/content/lost-wallet-v01/test/pipeline.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');

require(path.resolve(__dirname, '..', '..', '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', '..', '..', 'js', 'policy', 'lt-mock-policy.js'));
require(path.resolve(__dirname, '..', 'lost-wallet.js'));
const LT = global.LT;
const LW = LT.LostWallet, A = LT.Actions, P = LT.Perception;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

/* A policy that never leaves home, so the only person near the wallet is the
 * finder. Waiting is a real action from the catalogue, not a shim. */
function idleScript(n) {
  const script = [];
  for (let i = 0; i < n; i++) script.push({ prefer: 'wait' });
  return script;
}

async function findHalf() {
  console.log('# pipeline find half: intervention -> perceive -> walk -> pick up');
  LT.MockPolicy.create({ id: 'lw-idle', script: idleScript(40) });
  LT.MockPolicy.create({ id: 'lw-find', script: [{ prefer: 'pick_up_wallet' }, { prefer: 'pick_up_wallet' }] });
  const sim = LT.Scenario.day1({
    intervention: false,
    policies: { resident_a: 'lw-idle', resident_b: 'lw-find' }
  });
  const owner = sim.state.characters.resident_a;
  const finder = sim.state.characters.resident_b;

  const params = {
    id: 'wallet_pipe', ownerId: 'resident_a', cash: 7, locationId: 'park',
    x: 2, y: 1, useSpot: { x: 2, y: 2, dir: 'up' }
  };
  const scheduled = sim.scheduleIntervention({ type: 'wallet_lost', source: 'pipeline', params: params });
  assert(scheduled.ok, 'the wallet intervention schedules: ' + scheduled.error);
  sim.applyDueInterventions();

  const wallet = sim.objectById('wallet_pipe');
  ok(wallet !== null && wallet.status === 'lost', 'the wallet exists in the state, lost, before any decision');
  const ownerMoney = owner.money;
  ok(ownerMoney === Math.round((18.5 - 7) * 100) / 100, 'the cash has left the owner exactly once');

  /* The finder starts at the park's own spawn, away from the use spot. */
  sim.placeCharacter(finder, 'park');
  const distance = sim.routeLength(LT.World.LOCATIONS.park, finder.pos, params.useSpot);
  ok(distance > 0, 'the finder has a real walk to the use spot (' + distance + ' steps)');

  await sim.runMinutes(25);

  ok(wallet.status === 'carried', 'the finder walked over and picked the wallet up');
  ok(wallet.heldBy === 'resident_b' && wallet.foundBy === 'resident_b', 'the wallet is carried by the finder');
  ok(wallet.location === null && wallet.x === null && wallet.y === null, 'and it lies nowhere now');
  const started = sim.state.events.filter((e) => e.type === 'ACTIVITY_STARTED' && e.data.actionId === 'pick_up_wallet');
  ok(started.length === 1 && started[0].data.phase === 'approaching',
     'the pick-up began as an approach, not as an instant grab');
  ok(sim.state.events.some((e) => e.type === 'WALLET_FOUND'), 'a WALLET_FOUND event was emitted');
  ok(owner.money === ownerMoney, 'picking it up paid the owner nothing back');
  ok(!(owner.memories || []).some((m) => m.type === 'WALLET_LOST'),
     "the owner's memory never learned where the wallet fell");
  ok(A.get('pick_up_wallet') === LW.ACTIONS.pick_up_wallet &&
     A.get('return_wallet') === LW.ACTIONS.return_wallet &&
     A.get('keep_wallet_money') === LW.ACTIONS.keep_wallet_money,
     'all three actions were registered by the package at load');
  return sim;
}

async function heldHalf(sim) {
  console.log('# pipeline carried half: a carried wallet offers its held actions');
  LT.MockPolicy.create({ id: 'lw-keep', script: [{ prefer: 'keep_wallet_money' }, { prefer: 'keep_wallet_money' }] });
  const finder = sim.state.characters.resident_b;
  finder.policyId = 'lw-keep';   // the same person, now deciding about what they carry
  const before = finder.money;
  const wallet = sim.objectById('wallet_pipe');

  await sim.runMinutes(15);

  ok(wallet.status === 'kept', 'the finder kept the money through the real tick');
  ok(wallet.heldBy === null, 'and no longer carries the wallet');
  ok(finder.money === Math.round((before + 7) * 100) / 100, 'the cash landed in the finder pocket exactly once');
  ok(sim.state.events.some((e) => e.type === 'WALLET_KEPT'), 'a WALLET_KEPT event was emitted');
}

async function main() {
  const sim = await findHalf();
  if (P.HELD_AFFORDANCES !== true) {
    console.log('PIPELINE HELD HALF NOT RUN');
    process.exit(2);
  }
  await heldHalf(sim);
  console.log('\nlost-wallet pipeline: ' + checks + '/' + checks);
}

main().catch((e) => { console.error(e); process.exit(1); });
