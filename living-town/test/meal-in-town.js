/* meal-in-town.js — Living Town: the shared-meal package where it now lives.
 * Its own tests exercise its definitions. These put it in the five-person town
 * under the offline policy with nobody told what to do, and hold what was found
 * when it was put there: an invitation nobody answered must not stand between
 * two people for ever, nor hide a later one from the person holding both.
 * node living-town/test/meal-in-town.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-save.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-story.js'));
const LT = global.LT, SM = LT.SharedMeal;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }
const quiet = (s) => { s.requestDecision = function () { return null; }; return s; };
const tickN = (s, n) => { for (let i = 0; i < n; i++) s.tick(); };
const legal = (sim, who, id) => LT.Perception.candidates(sim, who).legal.some((c) => c.id === id || (c.actionId === id && !c.targetId));
const why = (sim, who, id) => (LT.Perception.candidates(sim, who).rejected.find((c) => c.id === id) || {}).reason;

(async function () {
  console.log('# it is part of the town');
  ok(SM && LT.Actions.get('invite_to_meal') && LT.Actions.get('accept_meal') && LT.Actions.get('decline_meal'), 'a town made by the scenario has the three actions without anybody loading anything');

  console.log('# unprompted, three days');
  const town = LT.Scenario.town({});
  await town.runUntil(4, 0);
  const ev = (t) => town.state.events.filter((e) => e.type === t);
  const invited = ev('MEAL_INVITED'), accepted = ev('MEAL_ACCEPTED'), declined = ev('MEAL_DECLINED');
  console.log('    ' + invited.concat(accepted, declined).sort((a, b) => a.seq - b.seq).slice(0, 8).map((e) => e.stamp + ' ' + e.text).join('\n    '));
  ok(invited.length >= 2 && accepted.length >= 1, 'people ask each other to eat, and some say yes (' + invited.length + ' asked, ' + accepted.length + ' yes, ' + declined.length + ' no)');
  const meals = [];
  town.actorIds().forEach((id) => (town.state.characters[id].commitments || []).forEach((c) => { if (/^cmt_meal_/.test(c.id)) meals.push(c); }));
  ok(meals.length === 2 * accepted.length && meals.every((c) => c.kind === 'social' && ['open', 'kept', 'broken'].indexOf(c.status) >= 0), 'every yes left one ordinary promise on each of the two, and the core has judged them: ' + meals.map((c) => c.status).join(' '));
  const recap = LT.Story.recap(town, invited[0].day);
  ok(JSON.stringify(recap).indexOf(invited[0].text) >= 0 || JSON.stringify(recap).indexOf('invited') >= 0, 'the day looked back on mentions it');

  console.log('# found at integration: an invitation nobody answered');
  const sim = quiet(LT.Scenario.town({ intervention: false, everyday: false }));
  const C = sim.state.characters, a = C.resident_c, b = C.resident_d   // two with no promise between them;
  sim.state.minute = 660;                                  // 11:00, lunch is askable
  sim.placeCharacter(a, 'park', { x: 7, y: 8, dir: 'right' }); sim.placeCharacter(b, 'park', { x: 8, y: 8, dir: 'left' });
  assert(sim.startActivity(a, { actionId: 'invite_to_meal', targetKind: 'person', targetId: 'resident_d' }, 'test', null).ok);
  tickN(sim, 12);
  const lunch = sim.state.objects.find((o) => o.typeId === 'meal_invitation');
  ok(lunch && lunch.status === 'open' && lunch.heldBy === 'resident_d' && legal(sim, b, 'accept_meal'), 'asked at 11:00; she may answer');
  sim.state.minute = 900;                                  // 15:00: lunch has gone unanswered, dinner is askable
  ok(lunch.status === 'open' && SM.lapsed(sim.state, lunch) && !legal(sim, b, 'accept_meal'), 'by 15:00 it can no longer be answered, and still says open on record');
  ok(why(sim, b, 'invite_to_meal:resident_c') !== 'invitation_already_open' && LT.Perception.candidates(sim, b).legal.some((c) => c.actionId === 'invite_to_meal' && c.targetId === 'resident_c'),
     'it does not stand between them: she may ask him to dinner');
  assert(sim.startActivity(C.resident_d, { actionId: 'invite_to_meal', targetKind: 'person', targetId: 'resident_c' }, 'test', null).ok);
  tickN(sim, 12);
  const dinner = sim.state.objects.find((o) => o.typeId === 'meal_invitation' && o.dueMin === 1170);
  ok(dinner && dinner.heldBy === 'resident_c' && legal(sim, a, 'accept_meal'), 'and he, holding nothing stale, may answer');
  /* the other half: someone holding a lapsed one AND a live one */
  const live = SM.makeInvitation({ fromId: 'resident_e', toId: 'resident_d', sitting: { min: 1170, label: 'dinner' } }, sim.state.day);
  sim.state.objects.push(live);
  ok(legal(sim, b, 'accept_meal'), 'holding a lapsed lunch invitation and a live dinner one, she is asked about the live one');
  assert(sim.startActivity(b, { actionId: 'accept_meal', targetKind: null, targetId: null }, 'test', null).ok);
  tickN(sim, 3);
  ok(live.status === 'accepted' && lunch.status === 'open' && (b.commitments || []).some((c) => c.id === 'cmt_meal_' + live.id), 'and it is the live one she accepted');

  console.log('# a save with invitations in every state');
  const loaded = quiet(LT.Save.deserialize(JSON.parse(JSON.stringify(LT.Save.serialize(sim)))));
  tickN(sim, 240); tickN(loaded, 240);
  ok(JSON.stringify(loaded.state) === JSON.stringify(sim.state), 'loaded, it is the town that never stopped, four hours on');

  console.log('\nmeal-in-town: ' + checks + '/' + checks);
})().catch((e) => { console.error(e); process.exit(1); });
