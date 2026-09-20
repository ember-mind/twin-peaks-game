/* wallet-in-town.js — Living Town: the lost-wallet package where it now lives.
 * Its own tests exercise its definitions. These put it in the five-person town,
 * through the watcher's hand, under the offline policy, with nobody told what to do.
 * node living-town/test/wallet-in-town.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'content', 'lost-wallet-v01', 'lost-wallet.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-save.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-story.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-hand.js'));
const LT = global.LT, H = LT.Hand;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

(async function () {
  console.log('# through the watcher\'s hand');
  ok(H.offered().some((e) => e.id === 'lose_wallet') && H.offered().length === 6, 'with the package loaded, losing a wallet is on offer');
  const sim = LT.Scenario.town({ intervention: false, everyday: false });
  await sim.runUntil(1, 600);
  const owner = sim.state.characters.resident_a, had = owner.money;
  const r = H.make(sim, 'lose_wallet', { who: 'resident_a', spot: 'park_path' });
  ok(r.ok && r.record.type === 'wallet_lost' && r.record.source === 'watcher', 'it goes through the one register');
  ok(!H.make(sim, 'lose_wallet', { who: 'nobody', spot: 'park_path' }).ok && !H.make(sim, 'lose_wallet', { who: 'resident_a', spot: 'the moon' }).ok, 'an unknown person or place is refused');
  await sim.runMinutes(2);
  const wallet = sim.state.objects.find((o) => o.typeId === 'wallet_lost');
  ok(wallet && wallet.status === 'lost' && wallet.location === 'park' && owner.money === had - 10, 'ten euro of theirs is lying in the park');
  ok(!owner.memories.some((m) => /park/i.test(m.summary) && /wallet/i.test(m.summary)), 'and its owner has not been told where');

  console.log('# unprompted');
  await sim.runUntil(3, 0);
  const told = sim.state.events.filter((e) => /^WALLET_/.test(e.type));
  console.log('    ' + (told.map((e) => e.stamp + ' ' + e.type + ' — ' + e.text).join('\n    ') || '(nobody came across it in two days)'));
  ok(told.filter((e) => e.type === 'WALLET_LOST').length === 1 && told.filter((e) => /RETURNED|KEPT|RECOVERED/.test(e.type)).length <= 1, 'lost once; settled at most once');
  const end = sim.state.objects.find((o) => o.typeId === 'wallet_lost');
  ok(['lost', 'carried', 'returned', 'kept'].indexOf(end.status) >= 0 && (end.status === 'lost') === (end.location === 'park') && (end.status === 'carried') === !!end.heldBy, 'it is in one coherent state: ' + end.status);
  const found = told.find((e) => e.type === 'WALLET_FOUND');
  if (found) ok(!sim.state.characters.resident_a.memories.some((m) => m.eventSeq === found.seq) || found.actorId === 'resident_a', 'whoever found it, its owner was not told by the finding');
  const loaded = LT.Save.deserialize(JSON.parse(JSON.stringify(LT.Save.serialize(sim))));
  ok(JSON.stringify(loaded.state.objects.find((o) => o.typeId === 'wallet_lost')) === JSON.stringify(end), 'and it survives a save as it is');
  ok(LT.Story.recap(sim, 1).town.some((t) => /wallet/i.test(t.text)) || told.some((e) => e.day === 1), 'the day\'s recap has it');

  console.log('\nwallet-in-town: ' + checks + '/' + checks);
})().catch((e) => { console.error(e); process.exit(1); });
