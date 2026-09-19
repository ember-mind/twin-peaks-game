/* need.js — Living Town: going hungry, being seen, being helped.
 * Hunger past a point costs strength and shows; only someone in the room can
 * see it, and not how bad it is; helping moves money once, between two people,
 * and decides nothing for the person helped. Carried things can offer actions.
 * node living-town/test/need.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'policy', 'lt-mock-policy.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-save.js'));
const LT = global.LT;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }
const quiet = (s) => { s.requestDecision = function () { return null; }; return s; };
const tickN = (s, n) => { for (let i = 0; i < n; i++) s.tick(); };
const total = (s) => s.actorIds().reduce((t, id) => t + s.state.characters[id].money + s.state.characters[id].savings, 0);

(async function () {
  console.log('# going hungry');
  const sim = quiet(LT.Scenario.town({ intervention: false }));
  const C = sim.state.characters, e = C.resident_e, d = C.resident_d, a = C.resident_a;
  sim.placeCharacter(e, 'park'); sim.placeCharacter(d, 'park');
  e.needs.hunger = 87; e.needs.energy = 80; d.needs.energy = 80; d.needs.hunger = 10;
  tickN(sim, 30);
  const went = sim.state.events.filter((x) => x.type === 'WENT_HUNGRY');
  ok(went.length === 1 && e.unwell && e.unwell.stamp === went[0].stamp, 'past the line it shows, and is said once (' + went[0].stamp + ')');
  tickN(sim, 60);
  ok(sim.state.events.filter((x) => x.type === 'WENT_HUNGRY').length === 1, 'not again every minute');
  ok((80 - e.needs.energy) > 2 * (80 - d.needs.energy), 'it wears them down more than twice as fast as the person next to them (' + (80 - e.needs.energy).toFixed(1) + ' against ' + (80 - d.needs.energy).toFixed(1) + ')');
  ok(d.memories.some((m) => m.type === 'WENT_HUNGRY') && !a.memories.some((m) => m.type === 'WENT_HUNGRY'), 'whoever is in the park saw it; someone at home did not');
  const seen = LT.Perception.observe(sim, d).present.find((p) => p.id === 'resident_e');
  ok(seen.looksUnwell === true && !('hunger' in seen) && !('money' in seen) && JSON.stringify(seen).indexOf('8') < 0, 'what is visible is that they look unwell — not the number, and not their purse');

  console.log('# helping out');
  const cands = (who) => LT.Perception.candidates(sim, who);
  ok(cands(d).legal.some((c) => c.actionId === 'help_out' && c.targetId === 'resident_e' && c.meta.amount === 8), 'someone beside them with money to spare may help');
  ok(cands(e).rejected.some((c) => c.id === 'help_out:resident_d' && c.reason === 'they_seem_fine'), 'nobody is offered help they do not need');
  d.money = 15;
  ok(cands(d).rejected.some((c) => c.id === 'help_out:resident_e' && c.reason === 'cannot_spare_it'), 'nor by someone who cannot spare it');
  d.money = 60;
  const before = total(sim), eMoney = e.money, trust = (e.relationships.resident_d || {}).trust || 0;
  assert(sim.startActivity(d, { actionId: 'help_out', targetKind: 'person', targetId: 'resident_e' }, 'test', null).ok);
  tickN(sim, 12);
  ok(e.money === eMoney + 8 && d.money === 52 && Math.abs(total(sim) - before) < 1e-9, 'eight euro change hands once; none is made or lost');
  ok(e.relationships.resident_d.trust > trust && sim.state.events.filter((x) => x.type === 'HELPED_OUT').length === 1, 'it is remembered between them');
  ok(e.needs.hunger > 85 && !e.activity, 'the person helped has not been fed or sent anywhere: what they do next is theirs');
  ok(cands(d).rejected.some((c) => c.id === 'help_out:resident_e' && c.reason === 'already_helped_today'), 'once a day');
  e.needs.hunger = 40; tickN(sim, 1);
  ok(e.unwell === null, 'having eaten, they are well again');

  console.log('# found in review: the person has to still be there');
  const gone = quiet(LT.Scenario.town({ intervention: false }));
  const G = gone.state.characters;
  gone.placeCharacter(G.resident_e, 'park'); gone.placeCharacter(G.resident_d, 'park');
  G.resident_e.needs.hunger = 95; tickN(gone, 1);
  assert(gone.startActivity(G.resident_d, { actionId: 'help_out', targetKind: 'person', targetId: 'resident_e' }, 'test', null).ok);
  while (G.resident_d.activity && G.resident_d.activity.phase !== 'executing') gone.tick();
  const purse = [G.resident_d.money, G.resident_e.money];
  gone.placeCharacter(G.resident_e, 'flat_e');                       // they have left before the money changed hands
  tickN(gone, 6);
  ok(G.resident_d.money === purse[0] && G.resident_e.money === purse[1] && !gone.state.events.some((x) => x.type === 'HELPED_OUT'), 'nothing is handed to someone who is no longer there');
  ok(gone.state.events.some((x) => x.type === 'ACTIVITY_FAILED' && x.actorId === 'resident_d' && x.data.reason === 'partner_left'), 'and the attempt is on the record as having failed: they left');

  console.log('# unprompted, over four days of five people');
  const town = LT.Scenario.town({});
  await town.runUntil(5, 0);
  const ev = (t) => town.state.events.filter((x) => x.type === t);
  const hungry = ev('WENT_HUNGRY'), helped = ev('HELPED_OUT');
  console.log('    ' + hungry.concat(helped).sort((x, y) => x.seq - y.seq).map((x) => x.stamp + ' ' + x.text).join('\n    '));
  ok(hungry.length >= 1 && helped.length >= 1 && helped[0].absMinute > hungry[0].absMinute, 'someone runs out, goes where people are, and somebody chooses to help');
  ok(helped.every((h) => ev('ATE').some((x) => x.actorId === h.data.toId && x.absMinute > h.absMinute && x.absMinute - h.absMinute < 180)), 'and each time they then went and ate, by their own choice');
  const loaded = LT.Save.deserialize(JSON.parse(JSON.stringify(LT.Save.serialize(town))));
  ok(JSON.stringify(loaded.state.characters.resident_e.unwell) === JSON.stringify(town.state.characters.resident_e.unwell) && JSON.stringify(loaded.state.characters.resident_d.helpedOut || null) === JSON.stringify(town.state.characters.resident_d.helpedOut || null), 'all of it survives a save');

  console.log('# a carried thing can offer actions');
  const held = quiet(LT.Scenario.day1({ intervention: false }));
  const ha = held.state.characters.resident_a;
  let ran = 0;
  if (!LT.Actions.get('test_show_token')) LT.Actions.define({ id: 'test_show_token', label: 'Show the token to', targetKind: 'person', position: 'beside_person', interruptible: false,
    duration: () => 2, eligible: () => true, tick: () => {}, onComplete: () => { ran++; } });
  if (!LT.Actions.get('test_pocket_token')) LT.Actions.define({ id: 'test_pocket_token', label: 'Turn the token over', targetKind: null, position: 'anywhere', interruptible: false,
    duration: () => 1, eligible: () => true, tick: () => {}, onComplete: () => { ran++; } });
  held.placeCharacter(ha, 'cafe');
  const ids = () => LT.Perception.candidates(held, ha).legal.map((c) => c.id);
  ok(LT.Perception.HELD_AFFORDANCES === true && !ids().some((id) => /test_/.test(id)), 'with nothing in hand, nothing is offered');
  held.state.objects.push({ id: 'token_1', name: 'token', location: null, heldBy: 'resident_a', heldAffordances: ['test_show_token', 'test_pocket_token'] });
  ok(ids().indexOf('test_show_token:resident_b') >= 0 && ids().indexOf('test_pocket_token') >= 0, 'carrying it offers both: toward the person here, and on one\'s own');
  ok(!LT.Perception.candidates(held, held.state.characters.resident_b).legal.some((c) => /test_/.test(c.id)), 'only to the one carrying it');
  ok(!held.objectsAt('cafe').some((o) => o.id === 'token_1'), 'and a carried thing is not lying in the room');

  console.log('\nneed: ' + checks + '/' + checks);
})().catch((e) => { console.error(e); process.exit(1); });
