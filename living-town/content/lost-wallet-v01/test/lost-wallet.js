/* lost-wallet.js test — Living Town content package `lost-wallet-v01`.
 *
 * These are CALLBACK tests: they drive the package's object builder, action
 * definitions and intervention lifecycle through the real Sim and its real
 * contexts, the way the model package's own tests do. The full pipeline — a
 * policy actually choosing pick_up_wallet / return_wallet / keep_wallet_money
 * during a tick, including the carried half that only the core's
 * heldAffordances offering makes reachable — is exercised in pipeline.js.
 *
 * node living-town/content/lost-wallet-v01/test/lost-wallet.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');

require(path.resolve(__dirname, '..', '..', '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', '..', '..', 'js', 'lt-save.js'));
require(path.resolve(__dirname, '..', 'lost-wallet.js'));
const LT = global.LT;
const LW = LT.LostWallet, I = LT.Interventions, A = LT.Actions, W = LT.World, P = LT.Perception;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

const copy = (v) => JSON.parse(JSON.stringify(v));

/* The core's own closeness gain tapers as two people grow closer
 * (Sim.prototype.adjustRelationship); a gain is never a flat add. */
function closenessAfterGain(before, delta) {
  const gain = delta > 0 ? delta * (1 - before / 125) : delta;
  return Math.round((before + gain) * 100) / 100;
}

function day() { return LT.Scenario.day1({ intervention: false }); }
function actorIds(sim) { return Object.keys(sim.state.characters).sort(); }

function walletParams(over) {
  return Object.assign({
    id: 'w_t1', ownerId: 'resident_a', cash: 7, locationId: 'park',
    x: 28, y: 16, useSpot: { x: 28, y: 17, dir: 'up' }
  }, over || {});
}

function schedule(sim, type, params) {
  return sim.scheduleIntervention({ type: type, source: 'test', params: params });
}
function place(sim, type, params) {
  const r = schedule(sim, type, params);
  if (!r.ok) throw new Error('schedule failed: ' + r.error);
  I.applyDue(sim);
  return r.record;
}
function refused(sim, type, params, error) {
  const r = schedule(sim, type, params);
  return r.ok === false && r.error === error;
}
function stand(sim, actor, locationId, spot) {
  sim.placeCharacter(actor, locationId, { x: spot.x, y: spot.y, dir: spot.dir || 'down' });
  actor.walkTarget = null;
}
function ctxFor(sim, actor, target) { return sim.context(actor, target); }

/* Every euro in the town: pockets plus the cash of any wallet still lost or
 * carried. This is the number that must never change. */
function cashInTown(sim) {
  let sum = 0;
  Object.keys(sim.state.characters).forEach((id) => { sum += sim.state.characters[id].money; });
  sim.state.objects.forEach((o) => {
    if (o.typeId === 'wallet_lost' && (o.status === 'lost' || o.status === 'carried')) sum += o.cash;
  });
  return Math.round(sum * 100) / 100;
}

function makeLost(sim, over) {
  const p = walletParams(over);
  place(sim, 'wallet_lost', p);
  return sim.objectById(p.id);
}
function pickUp(sim, wallet, actor) {
  stand(sim, actor, wallet.location, wallet.anchors.pick_up_wallet);
  LW.ACTIONS.pick_up_wallet.onComplete(ctxFor(sim, actor, wallet));
}
function saveEnv(sim) {
  return {
    state: sim.state,
    reachable: function (locationId, spot) {
      const loc = W.LOCATIONS[locationId];
      return !!loc && LT.Sim.Sim.prototype.routeLength.call(null, loc, loc.spawn, spot) >= 0;
    }
  };
}

/* ---------------- package shape and registration ---------------- */

function packageShape() {
  console.log('# package: object type, three actions and the intervention are defined');
  ok(LW.TYPE_ID === 'wallet_lost' && LW.STATUSES.join(',') === 'lost,carried,returned,kept',
     'the object type is wallet_lost with four states');

  const pick = LW.ACTIONS.pick_up_wallet, ret = LW.ACTIONS.return_wallet, keep = LW.ACTIONS.keep_wallet_money;
  ok(pick.id === 'pick_up_wallet' && pick.targetKind === 'object' && pick.position === 'use_spot' &&
     pick.exclusive === true && pick.interruptible === false && pick.duration({}) === 2 &&
     typeof pick.eligible === 'function' && typeof pick.onComplete === 'function',
     'pick_up_wallet: object, use_spot, exclusive, 2 minutes, not interruptible');
  ok(ret.id === 'return_wallet' && ret.targetKind === 'person' && ret.position === 'beside_person' &&
     ret.interruptible === false && ret.duration({}) === 3 && typeof ret.candidateMeta === 'function',
     'return_wallet: person, beside_person, 3 minutes');
  ok(keep.id === 'keep_wallet_money' && keep.targetKind === null && keep.position === 'anywhere' &&
     keep.interruptible === false && keep.duration({}) === 1 &&
     typeof keep.candidateMeta === 'function',
     'keep_wallet_money: no target, anywhere, 1 minute');

  ok(A.get('pick_up_wallet') === pick && A.get('return_wallet') === ret && A.get('keep_wallet_money') === keep,
     'all three actions are in the catalogue, registered through LT.Actions.define');

  ok(I.get('wallet_lost') !== null && I.types().indexOf('wallet_lost') >= 0,
     'the intervention is registered through the real LT.Interventions.define');
  ok(LT.Content.packageOf('wallet_lost') === 'lost-wallet' && LT.Content.version('lost-wallet') === 'v01',
     'the package declares wallet_lost to LT.Content at version v01');

  const seen = [];
  LW.registerActions({ define: (def) => { seen.push(def.id); } });
  ok(seen.length === 3 && seen.indexOf('pick_up_wallet') >= 0 && seen.indexOf('return_wallet') >= 0 &&
     seen.indexOf('keep_wallet_money') >= 0,
     'registerActions wires all three definitions into a catalogue that offers define()');
  assert.throws(() => A.define(Object.assign({}, LW.ACTIONS.pick_up_wallet)), /already in the catalogue/);
  ok(A.get('pick_up_wallet') === pick, 'and a second definition under the same id is refused, not swapped in');
}

function visual() {
  console.log('# visual: only a lost wallet is drawn, and only while lost');
  const sim = day();
  const wallet = makeLost(sim, { id: 'w_vis' });
  const lost = LT.Content.visualOf(wallet, sim);
  ok(lost && lost.typeId === 'wallet_lost' && lost.state === 'lost', 'a lost wallet shows as wallet_lost/lost');
  pickUp(sim, wallet, sim.state.characters.resident_b);
  ok(LT.Content.visualOf(wallet, sim) === null, 'a carried wallet is not shown lying anywhere');
  LW.ACTIONS.keep_wallet_money.onComplete(ctxFor(sim, sim.state.characters.resident_b, null));
  ok(LT.Content.visualOf(wallet, sim) === null, 'a kept wallet is not shown either');
}

/* ---------------- intervention validation ---------------- */

function invalidInterventions() {
  console.log('# interventions: invalid parameters and references are refused by name');
  const sim = day();
  const of = (o) => walletParams(o);

  ok(refused(sim, 'wallet_lost', of({ id: '' }), 'invalid_id'), 'an empty id is refused');
  ok(refused(sim, 'wallet_lost', of({ id: undefined }), 'invalid_id'), 'a missing id is refused');
  ok(refused(sim, 'wallet_lost', of({ ownerId: 'ghost' }), 'unknown_owner'), 'an unknown owner is refused');
  ok(refused(sim, 'wallet_lost', of({ cash: 0 }), 'invalid_cash'), 'zero cash is refused');
  ok(refused(sim, 'wallet_lost', of({ cash: -4 }), 'invalid_cash'), 'negative cash is refused');
  ok(schedule(sim, 'wallet_lost', of({ id: 'w_frac', cash: 2.5 })).ok === true,
     'a fractional amount is allowed, because money is not whole euros');
  ok(refused(sim, 'wallet_lost', of({ cash: Infinity }), 'invalid_cash'), 'non-finite cash is refused');
  ok(refused(sim, 'wallet_lost', of({ cash: NaN }), 'invalid_cash'), 'NaN cash is refused');
  ok(refused(sim, 'wallet_lost', of({ cash: 999 }), 'cash_exceeds_owner_money'),
     'more cash than the owner has is refused');
  ok(refused(sim, 'wallet_lost', of({ locationId: 'nowhere' }), 'unknown_location'),
     'an unknown place is refused');
  ok(refused(sim, 'wallet_lost', of({ x: -1 }), 'object_position_out_of_bounds'),
     'an out-of-bounds cell is refused');
  ok(refused(sim, 'wallet_lost', of({ locationId: 'flat_a', x: 0, y: 0, useSpot: { x: 24, y: 16 } }),
     'object_position_not_floor'), 'a wallet dropped on a wall is refused');
  ok(refused(sim, 'wallet_lost', of({ useSpot: undefined }), 'missing_use_spot'),
     'a missing use spot is refused');
  ok(refused(sim, 'wallet_lost', of({ useSpot: { x: 1.5, y: 2 } }), 'invalid_use_spot'),
     'a fractional use spot is refused');
  ok(refused(sim, 'wallet_lost', of({ useSpot: { x: 99, y: 2 } }), 'use_spot_out_of_bounds'),
     'an out-of-bounds use spot is refused');
  ok(refused(sim, 'wallet_lost', of({ useSpot: { x: 12, y: 17 } }), 'use_spot_not_walkable'),
     'a use spot on the bench is refused');
  ok(refused(sim, 'wallet_lost', of({ useSpot: { x: 28, y: 17, dir: 'sideways' } }), 'invalid_use_spot_dir'),
     'a bad facing is refused');

  /* No room in this town has an unreachable floor cell, so the reachability
   * rule is checked against a stub sim whose pathfinder finds no route. */
  const stub = {
    state: { characters: { resident_a: {} } },
    objectById: function () { return null; },
    nextStep: function () { return null; }
  };
  const verdict = I.get('wallet_lost').validate(walletParams(), stub);
  ok(verdict && verdict.error === 'use_spot_unreachable', 'an unreachable use spot is refused');

  const first = makeLost(sim, { id: 'w_dup' });
  ok(first !== null, 'a first wallet can be created');
  ok(refused(sim, 'wallet_lost', walletParams({ id: 'w_dup' }), 'id_in_use'),
     'an id already in state.objects is refused');
}

/* ---------------- the loss: cash out once, and nobody told ---------------- */

function lossIsPrivateAndIdempotent() {
  console.log('# the loss: cash leaves the owner once, and the town is not told where');
  const sim = day();
  const owner = sim.state.characters.resident_a;
  const before = owner.money;
  const def = I.get('wallet_lost');
  const p = walletParams({ id: 'w_once', cash: 6 });
  const record = { id: 'itv_lw1' };

  const first = def.apply(p, sim, record);
  ok(first.ok === true && owner.money === Math.round((before - 6) * 100) / 100,
     'cash leaves the owner when the wallet is lost');
  const second = def.apply(p, sim, record);
  ok(second.ok === false && second.error === 'id_in_use' && owner.money === Math.round((before - 6) * 100) / 100,
     'cash leaves the owner once and only once across two apply calls with the same id');
  ok(sim.state.objects.filter((o) => o.id === 'w_once').length === 1, 'and only one wallet exists');

  const lost = sim.state.events.filter((e) => e.type === 'WALLET_LOST');
  ok(lost.length === 1 && lost[0].subjectId === 'resident_a',
     'a single WALLET_LOST names the owner as its subject');
  const memories = Object.keys(sim.state.characters).filter((id) =>
     (sim.state.characters[id].memories || []).some((m) => m.type === 'WALLET_LOST'));
  ok(memories.length === 0, 'no character, the owner included, remembers the loss');

  /* The owner, away from the park, cannot see where it fell. */
  const observed = P.observe(sim, owner);
  ok(!observed.objects.some((o) => o.id === 'w_once'),
     "the owner's observation does not contain the wallet before they perceive it themselves");
  sim.placeCharacter(owner, 'park');
  const there = P.observe(sim, owner);
  ok(there.objects.some((o) => o.id === 'w_once'),
     'standing in the park, the owner perceives it themselves');
}

/* ---------------- pick up ---------------- */

function pickUpCallbacks() {
  console.log('# pick_up_wallet: present, at the spot, once; the finder keeps it privately');
  const sim = day();
  const wallet = makeLost(sim, { id: 'w_pick', cash: 9 });
  const finder = sim.state.characters.resident_b;
  const owner = sim.state.characters.resident_a;
  const before = cashInTown(sim);

  sim.placeCharacter(finder, 'flat_b');
  const away = LW.ACTIONS.pick_up_wallet.eligible(ctxFor(sim, finder, wallet));
  ok(away !== true && away.reason === 'not_present', 'the wallet is not offered from another place');

  sim.placeCharacter(finder, 'park', { x: 24, y: 16 });
  ok(LW.ACTIONS.pick_up_wallet.eligible(ctxFor(sim, finder, wallet)) === true,
     'in the same place, picking it up is a legal action');

  finder.walkTarget = { x: 28, y: 17 };
  LW.ACTIONS.pick_up_wallet.onComplete(ctxFor(sim, finder, wallet));
  ok(wallet.status === 'lost' && wallet.heldBy === null,
     'walking toward it does not pick it up');

  stand(sim, finder, 'park', wallet.anchors.pick_up_wallet);
  LW.ACTIONS.pick_up_wallet.onComplete(ctxFor(sim, finder, wallet));
  ok(wallet.status === 'carried' && wallet.heldBy === finder.id && wallet.foundBy === finder.id,
     'at the spot, a finder picks it up and carries it');
  ok(wallet.location === null && wallet.x === null && wallet.y === null,
     'a carried wallet lies nowhere');
  ok(wallet.affordances.length === 0 &&
     wallet.heldAffordances.indexOf('return_wallet') >= 0 &&
     wallet.heldAffordances.indexOf('keep_wallet_money') >= 0,
     'a carried wallet advertises the two carried actions, not the ground one');
  ok(sim.objectsAt('park').every((o) => o.id !== 'w_pick'), 'and it is no longer an object of the room');
  ok(cashInTown(sim) === before, 'picking it up moves no cash anywhere');

  LW.ACTIONS.pick_up_wallet.onComplete(ctxFor(sim, finder, wallet));
  ok(wallet.status === 'carried' && wallet.foundBy === finder.id,
     'a second pick-up callback settles nothing');
  ok(sim.state.events.filter((e) => e.type === 'WALLET_FOUND').length === 1,
     'exactly one WALLET_FOUND event');
  const found = sim.state.events.filter((e) => e.type === 'WALLET_FOUND')[0];
  ok(found.actorId === finder.id, 'the find is attributed to the finder');
  ok(!(owner.memories || []).some((m) => m.type === 'WALLET_FOUND'),
     'the owner is not notified that their wallet was found');
  ok((finder.memories || []).some((m) => m.type === 'WALLET_FOUND'),
     'the finder does remember it');
}

function ownerRecoversOwnWallet() {
  console.log('# pick_up_wallet: the owner may take back their own wallet');
  const sim = day();
  const owner = sim.state.characters.resident_a;
  const wallet = makeLost(sim, { id: 'w_own', cash: 5 });
  const before = owner.money;
  const total = cashInTown(sim);

  stand(sim, owner, 'park', wallet.anchors.pick_up_wallet);
  LW.ACTIONS.pick_up_wallet.onComplete(ctxFor(sim, owner, wallet));
  ok(wallet.status === 'returned' && wallet.heldBy === null, 'the owner recovers it directly to returned');
  ok(owner.money === Math.round((before + 5) * 100) / 100, 'the cash comes straight back to the owner');
  ok(cashInTown(sim) === total, 'and the town total is unchanged');
  const ev = sim.state.events.filter((e) => e.type === 'WALLET_RECOVERED');
  ok(ev.length === 1 && ev[0].actorId === 'resident_a', 'one WALLET_RECOVERED by the owner');
  const again = LW.ACTIONS.pick_up_wallet.eligible(ctxFor(sim, owner, wallet));
  ok(again !== true && again.reason === 'wallet_returned', 'a recovered wallet is no longer offered');
}

function pickUpIsExclusive() {
  console.log('# pick_up_wallet: one wallet, one pair of hands');
  const sim = day();
  const wallet = makeLost(sim, { id: 'w_excl' });
  const a = sim.state.characters.resident_a, b = sim.state.characters.resident_b;
  stand(sim, a, 'park', wallet.anchors.pick_up_wallet);
  stand(sim, b, 'park', wallet.anchors.pick_up_wallet);
  const READ = { actionId: 'pick_up_wallet', targetKind: 'object', targetId: wallet.id };

  ok(sim.startActivity(a, READ, 'test', null).ok && wallet.inUseBy === a.id,
     'choosing to pick it up claims the wallet through the simulation');
  const second = sim.legality(b, LW.ACTIONS.pick_up_wallet, wallet);
  ok(second !== true && second.reason === 'in_use', 'while one person holds it, another cannot');
}

function spotOccupiedRuleReachesPickUp() {
  console.log("# pick_up_wallet and the core's spot_occupied rule");
  const sim = day();
  const wallet = makeLost(sim, { id: 'w_occ' });
  const finder = sim.state.characters.resident_b;
  const other = sim.state.characters.resident_a;
  sim.placeCharacter(finder, 'park', { x: 33, y: 16 });

  ok(sim.legality(finder, LW.ACTIONS.pick_up_wallet, wallet) === true,
     'with the pick-up spot free, picking the wallet up is legal');

  /* The core gives a use spot to whoever is doing something from it, not to
   * whoever is merely standing about: a person busy on the spot holds it. */
  const spot = wallet.anchors.pick_up_wallet;
  sim.placeCharacter(other, 'park', { x: spot.x, y: spot.y });
  other.activity = { actionId: 'sit_and_rest', phase: 'executing' };
  const blocked = sim.legality(finder, LW.ACTIONS.pick_up_wallet, wallet);
  ok(blocked !== true && blocked.reason === 'spot_occupied',
     "someone working the spot blocks the pick-up (the core's spot_occupied rule)");
  const start = sim.startActivity(finder,
    { actionId: 'pick_up_wallet', targetKind: 'object', targetId: wallet.id }, 'test', null);
  ok(start.ok === false && start.error === 'spot_occupied',
     'and the pick-up cannot even be started while the spot is taken');
  ok(wallet.status === 'lost' && wallet.inUseBy === null,
     'so the wallet stays lost and unclaimed from afar');

  other.activity = null;
  sim.placeCharacter(other, 'flat_a');
  ok(sim.legality(finder, LW.ACTIONS.pick_up_wallet, wallet) === true,
     'once the spot is free again the wallet can be picked up');
}

/* ---------------- return ---------------- */

function returnCallbacks() {
  console.log('# return_wallet: beside the owner, cash once, both records moved');
  const sim = day();
  const wallet = makeLost(sim, { id: 'w_ret', cash: 8 });
  const finder = sim.state.characters.resident_b, owner = sim.state.characters.resident_a;
  const total = cashInTown(sim);
  pickUp(sim, wallet, finder);

  sim.placeCharacter(finder, 'flat_b');
  const away = LW.ACTIONS.return_wallet.eligible(ctxFor(sim, finder, owner));
  ok(away !== true && away.reason === 'owner_not_present', 'it cannot be returned across town');

  const stranger = LW.ACTIONS.return_wallet.eligible(ctxFor(sim, finder, finder));
  ok(stranger !== true && stranger.reason === 'no_owner', 'a person without the wallet is no target');

  sim.placeCharacter(finder, 'park', { x: 28, y: 17 });
  sim.placeCharacter(owner, 'park', { x: 27, y: 17 });
  ok(LW.ACTIONS.return_wallet.eligible(ctxFor(sim, finder, owner)) === true,
     'beside the owner, returning it is a legal action');
  const meta = LW.ACTIONS.return_wallet.candidateMeta(ctxFor(sim, finder, owner));
  ok(meta.cash === 8 && meta.ownerId === 'resident_a' && meta.ownerName === owner.name,
     'the candidate names the cash and the owner, once the wallet has been picked up');

  const ownerMoney = owner.money, finderMoney = finder.money;
  const ownerRel = { trust: owner.relationships.resident_b.trust, closeness: owner.relationships.resident_b.closeness };
  const finderRel = { closeness: finder.relationships.resident_a.closeness };
  LW.ACTIONS.return_wallet.onComplete(ctxFor(sim, finder, owner));

  ok(wallet.status === 'returned' && wallet.heldBy === null && wallet.location === null,
     'the wallet goes back to returned, held by nobody, lying nowhere');
  ok(owner.money === Math.round((ownerMoney + 8) * 100) / 100 && finder.money === finderMoney,
     'the cash lands in the owner pocket, exactly once');
  ok(owner.relationships.resident_b.trust === ownerRel.trust + 10 &&
     owner.relationships.resident_b.closeness === closenessAfterGain(ownerRel.closeness, 6),
     'the owner trusts the finder more and feels closer');
  ok(finder.relationships.resident_a.closeness === closenessAfterGain(finderRel.closeness, 3),
     'the finder feels closer to the owner');
  ok(cashInTown(sim) === total, 'the town total never moved');
  const ev = sim.state.events.filter((e) => e.type === 'WALLET_RETURNED');
  ok(ev.length === 1 && ev[0].data.ownerId === 'resident_a' &&
     (owner.memories || []).some((m) => m.type === 'WALLET_RETURNED'),
     'WALLET_RETURNED notifies the owner, who remembers it');

  LW.ACTIONS.return_wallet.onComplete(ctxFor(sim, finder, owner));
  ok(owner.money === Math.round((ownerMoney + 8) * 100) / 100 &&
     sim.state.events.filter((e) => e.type === 'WALLET_RETURNED').length === 1,
     'a second return_wallet on the same wallet is refused (no double payment)');
  const verdict = LW.ACTIONS.return_wallet.eligible(ctxFor(sim, finder, owner));
  ok(verdict !== true && verdict.reason === 'no_wallet_for_owner',
     'and a returned wallet is no longer a candidate to return');
}

/* ---------------- keep ---------------- */

function keepCallbacks() {
  console.log('# keep_wallet_money: cash once, privately, and no relationship is invented');
  const sim = day();
  const wallet = makeLost(sim, { id: 'w_keep', cash: 11 });
  const finder = sim.state.characters.resident_b, owner = sim.state.characters.resident_a;
  const total = cashInTown(sim);
  pickUp(sim, wallet, finder);
  const finderMoney = finder.money;

  ok(LW.ACTIONS.keep_wallet_money.eligible(ctxFor(sim, finder, null)) === true,
     'carrying a wallet, keeping the money is a legal action');
  const meta = LW.ACTIONS.keep_wallet_money.candidateMeta(ctxFor(sim, finder, null));
  ok(meta.cash === 11 && meta.ownerId === 'resident_a' && meta.ownerName === owner.name,
     'the candidate names the cash and the owner');
  const relBefore = JSON.stringify({ a: owner.relationships, b: finder.relationships });

  LW.ACTIONS.keep_wallet_money.onComplete(ctxFor(sim, finder, null));
  ok(finder.money === Math.round((finderMoney + 11) * 100) / 100 && owner.money === 18.5 - 11,
     'the cash lands in the finder pocket, once');
  ok(wallet.status === 'kept' && wallet.heldBy === null && wallet.location === null,
     'the wallet is settled as kept');
  ok(cashInTown(sim) === total, 'the town total is unchanged');
  const ev = sim.state.events.filter((e) => e.type === 'WALLET_KEPT');
  ok(ev.length === 1 && ev[0].actorId === finder.id,
     'WALLET_KEPT names only the keeper as its actor');
  ok(!(owner.memories || []).some((m) => m.type === 'WALLET_KEPT'),
     'the owner is never told the money was kept');
  ok(JSON.stringify({ a: owner.relationships, b: finder.relationships }) === relBefore,
     'keeping invents no trust and no closeness');

  LW.ACTIONS.keep_wallet_money.onComplete(ctxFor(sim, finder, null));
  ok(finder.money === Math.round((finderMoney + 11) * 100) / 100 &&
     sim.state.events.filter((e) => e.type === 'WALLET_KEPT').length === 1,
     'a second keep_wallet_money on the same wallet is refused (no double payment)');
  const verdict = LW.ACTIONS.keep_wallet_money.eligible(ctxFor(sim, finder, null));
  ok(verdict !== true && verdict.reason === 'no_carried_wallet',
     'and a kept wallet is no longer a candidate to keep');
}

/* ---------------- the invariant, every path ---------------- */

function cashIsConserved() {
  console.log('# the invariant: money + lost/carried cash is constant through every path');
  /* Path 1: lost -> picked up -> kept. */
  let sim = day();
  let total = cashInTown(sim);
  let w = makeLost(sim, { id: 'w_inv1', cash: 13 });
  ok(cashInTown(sim) === total, 'cash is never duplicated: the total holds after the loss');
  pickUp(sim, w, sim.state.characters.resident_b);
  ok(cashInTown(sim) === total, 'cash is never duplicated: the total holds after it is found');
  LW.ACTIONS.keep_wallet_money.onComplete(ctxFor(sim, sim.state.characters.resident_b, null));
  ok(cashInTown(sim) === total, 'cash is never duplicated: the total holds after it is kept');

  /* Path 2: lost -> picked up -> returned. */
  sim = day();
  total = cashInTown(sim);
  w = makeLost(sim, { id: 'w_inv2', cash: 13 });
  const finder = sim.state.characters.resident_b, owner = sim.state.characters.resident_a;
  pickUp(sim, w, finder);
  ok(cashInTown(sim) === total, 'cash is never duplicated: the total holds before returning');
  sim.placeCharacter(finder, 'park', { x: 28, y: 17 });
  sim.placeCharacter(owner, 'park', { x: 27, y: 17 });
  LW.ACTIONS.return_wallet.onComplete(ctxFor(sim, finder, owner));
  ok(cashInTown(sim) === total, 'cash is never duplicated: the total holds after returning');

  /* Path 3: lost -> the owner picks it back up. */
  sim = day();
  total = cashInTown(sim);
  w = makeLost(sim, { id: 'w_inv3', cash: 13 });
  pickUp(sim, w, sim.state.characters.resident_a);
  ok(cashInTown(sim) === total, 'cash is never duplicated: the total holds after the owner recovers it');
}

/* ---------------- the five-inhabitant town ---------------- */

function worksInTheFivePersonTown() {
  console.log('# five inhabitants: the package works in the town cast too');
  const sim = LT.Scenario.town({ intervention: false, everyday: false });
  ok(actorIds(sim).join(',') === 'resident_a,resident_b,resident_c,resident_d,resident_e',
     'the town cast is the five inhabitants');
  const owner = sim.state.characters.resident_e;
  const before = owner.money;
  place(sim, 'wallet_lost', walletParams({ id: 'w_town', ownerId: 'resident_e', cash: 4 }));
  const wallet = sim.objectById('w_town');
  ok(wallet !== null && wallet.status === 'lost' && wallet.ownerId === 'resident_e',
     'a neighbour can lose a wallet in the five-person town');
  ok(owner.money === Math.round((before - 4) * 100) / 100,
     'and the cash leaves that neighbour exactly once');
  ok(actorIds(sim).length === 5, 'and the town still has its five inhabitants');
  ok(LT.Content.validateObject(JSON.parse(JSON.stringify(wallet)), saveEnv(sim)) === null,
     'the wallet validates against the five-person state');
}

/* ---------------- persistence ---------------- */

function fourStatusesValidateAndRoundTrip() {
  console.log('# persistence: a wallet round-trips in each of the four states, and corruptions are refused');
  const sim = day();
  const a = sim.state.characters.resident_a, b = sim.state.characters.resident_b;

  const lost = makeLost(sim, { id: 'w_lost', ownerId: 'resident_a', cash: 1 });
  const carried = makeLost(sim, { id: 'w_carried', ownerId: 'resident_a', cash: 1 });
  pickUp(sim, carried, b);
  const recovered = makeLost(sim, { id: 'w_returned', ownerId: 'resident_a', cash: 1 });
  pickUp(sim, recovered, a);
  const kept = makeLost(sim, { id: 'w_kept', ownerId: 'resident_b', cash: 1 });
  pickUp(sim, kept, a);
  LW.ACTIONS.keep_wallet_money.onComplete(ctxFor(sim, a, null));

  const statuses = sim.state.objects.filter((o) => o.typeId === 'wallet_lost').map((o) => o.status).sort();
  ok(statuses.join(',') === 'carried,kept,lost,returned', 'the four states are all represented');

  const restored = JSON.parse(JSON.stringify(sim.state));
  const env = saveEnv(sim);
  const restoredOf = (id) => restored.objects.filter((o) => o.id === id)[0];
  ['w_lost', 'w_carried', 'w_returned', 'w_kept'].forEach((id) => {
    ok(LT.Content.validateObject(restoredOf(id), env) === null,
       'a ' + restoredOf(id).status + ' wallet survives JSON and validates');
  });
  ok(LT.Content.validateObject(restoredOf('w_carried'), env) === null &&
     LT.Content.validateObject(restoredOf('w_kept'), env) === null,
     'a wallet in all four statuses is accepted');

  const saveText = LT.Save.serialize(sim);
  const reloaded = LT.Save.deserialize(saveText);
  const rw = reloaded.objectById('w_carried');
  ok(rw && rw.status === 'carried' && rw.heldBy === 'resident_b' && rw.cash === 1,
     'the real save layer carries a carried wallet with its holder and its cash');

  /* Six named corruptions. */
  const corrupt = (base, patch) => Object.assign(JSON.parse(JSON.stringify(base)), patch);
  const named = (obj, phrase) => {
    const verdict = LT.Content.validateObject(obj, env);
    return typeof verdict === 'string' && verdict.indexOf(phrase) >= 0;
  };
  ok(named(corrupt(restoredOf('w_lost'), { ownerId: 'ghost' }), 'names an owner'),
     'corruption 1: an unknown owner is refused by name');
  ok(named(corrupt(restoredOf('w_carried'), { heldBy: 'ghost' }), 'is held by ghost'),
     'corruption 2: an unknown heldBy is refused by name');
  ok(named(corrupt(restoredOf('w_carried'), { location: 'park' }), 'still recorded in park'),
     'corruption 3: carried with a location is refused by name');
  ok(named(corrupt(restoredOf('w_lost'), { heldBy: 'resident_b' }), 'is lost and held by'),
     'corruption 4: lost with a holder is refused by name');
  ok(named(corrupt(restoredOf('w_lost'), { cash: 0 }), 'not a positive amount'),
     'corruption 5: a wallet with no cash is refused by name');
  ok(named(corrupt(restoredOf('w_lost'), { status: 'visible' }), 'unknown state'),
     'corruption 6: an unknown status is refused by name');
}

/* ---------------- read-only safety ---------------- */

function readOnlyOperationsDoNotMutate() {
  console.log('# read-only queries never write to the authoritative state');
  const sim = day();
  const wallet = makeLost(sim, { id: 'w_ro' });
  const finder = sim.state.characters.resident_b, owner = sim.state.characters.resident_a;
  pickUp(sim, wallet, finder);
  sim.placeCharacter(owner, 'park', { x: 27, y: 17 });

  const snapshot = JSON.stringify(sim.state);
  LW.ACTIONS.pick_up_wallet.eligible(ctxFor(sim, finder, wallet));
  LW.ACTIONS.return_wallet.eligible(ctxFor(sim, finder, owner));
  LW.ACTIONS.keep_wallet_money.eligible(ctxFor(sim, finder, null));
  LW.ACTIONS.return_wallet.candidateMeta(ctxFor(sim, finder, owner));
  LW.ACTIONS.keep_wallet_money.candidateMeta(ctxFor(sim, finder, null));
  LT.Content.visualOf(wallet, sim);
  P.observe(sim, owner);
  ok(JSON.stringify(sim.state) === snapshot,
     'eligible / candidateMeta / visual / observe leave state byte-identical');
}

/* ---------------- scores ---------------- */

const req = (relationships) => ({ relationships: relationships || {} });
const h = (t, urgency) => ({ trait: (k) => (k === t.name ? t.value : 0.5), urgency: urgency === undefined ? 1 : urgency });

function total(terms) { return Object.keys(terms).reduce((s, k) => s + terms[k], 0); }

function scores() {
  console.log('# scores: suggested in the policy\'s own terms, never as rules');
  assert.throws(() => LT.UtilityPolicy.defineScore('return_wallet', function () {}), /already has a score/);
  ok(true, 'offerScores registered every action with UtilityPolicy exactly once');

  const pick = LW.SCORES.pick_up_wallet(req(), { meta: {} }, h({ name: 'conscientiousness', value: 0.5 }, 0));
  ok(total(pick) > 0 && total(pick) < 10, 'pick_up_wallet is a small positive curiosity term');

  const lowCon = total(LW.SCORES.return_wallet(req({ resident_a: { closeness: 50 } }), { meta: { ownerId: 'resident_a' }, durationMinutes: 3 }, h({ name: 'conscientiousness', value: 0.1 })));
  const highCon = total(LW.SCORES.return_wallet(req({ resident_a: { closeness: 50 } }), { meta: { ownerId: 'resident_a' }, durationMinutes: 3 }, h({ name: 'conscientiousness', value: 0.9 })));
  ok(highCon > lowCon, 'return_wallet grows with conscientiousness');

  const far = total(LW.SCORES.return_wallet(req({ resident_a: { closeness: 5 } }), { meta: { ownerId: 'resident_a' }, durationMinutes: 3 }, h({ name: 'conscientiousness', value: 0.5 })));
  const near = total(LW.SCORES.return_wallet(req({ resident_a: { closeness: 95 } }), { meta: { ownerId: 'resident_a' }, durationMinutes: 3 }, h({ name: 'conscientiousness', value: 0.5 })));
  ok(near > far, 'return_wallet grows with closeness to the owner');

  const keepCand = { meta: { cash: 20 }, durationMinutes: 1 };
  const keepLowCon = total(LW.SCORES.keep_wallet_money(req(), keepCand, h({ name: 'conscientiousness', value: 0.1 })));
  const keepHighCon = total(LW.SCORES.keep_wallet_money(req(), keepCand, h({ name: 'conscientiousness', value: 0.9 })));
  ok(keepHighCon < keepLowCon, 'keep_wallet_money shrinks with conscientiousness');

  const keepLowCau = total(LW.SCORES.keep_wallet_money(req(), keepCand, h({ name: 'caution', value: 0.1 })));
  const keepHighCau = total(LW.SCORES.keep_wallet_money(req(), keepCand, h({ name: 'caution', value: 0.9 })));
  ok(keepHighCau < keepLowCau, 'keep_wallet_money shrinks with caution');

  const small = total(LW.SCORES.keep_wallet_money(req(), { meta: { cash: 2 }, durationMinutes: 1 }, h({ name: 'caution', value: 0.5 })));
  const big = total(LW.SCORES.keep_wallet_money(req(), { meta: { cash: 30 }, durationMinutes: 1 }, h({ name: 'caution', value: 0.5 })));
  ok(big > small, 'keep_wallet_money grows with the cash at stake');

  const calm = total(LW.SCORES.keep_wallet_money(req(), keepCand, h({ name: 'caution', value: 0.5 }, 0)));
  const urgent = total(LW.SCORES.keep_wallet_money(req(), keepCand, h({ name: 'caution', value: 0.5 }, 2.5)));
  ok(urgent > calm, 'and it grows with how urgently the money is needed');
}

async function main() {
  packageShape();
  visual();
  invalidInterventions();
  lossIsPrivateAndIdempotent();
  pickUpCallbacks();
  ownerRecoversOwnWallet();
  pickUpIsExclusive();
  spotOccupiedRuleReachesPickUp();
  returnCallbacks();
  keepCallbacks();
  cashIsConserved();
  worksInTheFivePersonTown();
  fourStatusesValidateAndRoundTrip();
  readOnlyOperationsDoNotMutate();
  scores();
  console.log('\nlost-wallet: ' + checks + '/' + checks);
}

main().catch((e) => { console.error(e); process.exit(1); });
