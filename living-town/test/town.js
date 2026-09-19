/* town.js — Living Town: five people on one street.
 * The 'town' cast adds three neighbours to the two the world began with. The
 * pair world must be untouched by their existence; the five must be distinct,
 * stay out of each other's homes and off each other's tiles; and a town must
 * save, load and carry on exactly like a pair does.
 * node living-town/test/town.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-save.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-hand.js'));
const LT = global.LT, W = LT.World;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }
const strip = (s) => { const c = JSON.parse(JSON.stringify(s.state)); delete c.version; return JSON.stringify(c).replace(/"requestId":"req_(\d+)\.\d+"/g, '"requestId":"req_$1"'); };

(async function () {
  console.log('# who lives here');
  const pair = LT.Scenario.day1({}), town = LT.Scenario.town({});
  const P = pair.state.characters, T = town.state.characters;
  ok(pair.actorIds().length === 2 && pair.state.cast === 'pair', 'a world made the old way still has two people');
  ok(town.actorIds().length === 5 && town.state.cast === 'town', 'a town has five');
  ok(['resident_a', 'resident_b'].every((id) => P[id].fullName === T[id].fullName && P[id].appearanceId === T[id].appearanceId), 'the first two are the same two people, by name and look, in both');
  const names = town.actorIds().map((id) => T[id].fullName), looks = town.actorIds().map((id) => T[id].appearanceId);
  ok(new Set(names).size === 5 && new Set(looks).size === 5, 'five names, five looks: ' + names.join(', '));
  ok(town.actorIds().every((id) => W.LOCATIONS[T[id].homeId].owner === id && town.locationName(T[id].homeId).indexOf(T[id].name) === 0), 'each has a home of their own, named after them');
  ok(pair.locationName('flat_c') === 'the flat over the bakery', 'in a pair world the other homes keep their plain names');
  ok(JSON.stringify(W.NEIGHBOURS).indexOf('"name"') < 0, 'nobody is named in the world\'s content');
  const floor = (locId, p) => !W.isSolid(W.LOCATIONS[locId].rows[p.y].charAt(p.x));
  ok(town.actorIds().every((id) => floor(T[id].location, T[id].pos)), 'everyone starts on a floor tile');
  ok(W.OBJECTS.filter((o) => /_(c|d|e)$/.test(o.id)).every((o) => W.isSolid(W.LOCATIONS[o.location].rows[o.y].charAt(o.x)) && town.useSpot(T[o.owner], LT.Actions.get(o.affordances[0]), town.objectById(o.id)).at), 'every new bed and kitchen is furniture on the map with a reachable place to stand');

  console.log('# three days of five people');
  let sameTile = 0, trespass = 0, twoAtCounter = 0, worstTogether = 0;
  for (let d = 1; d <= 3; d++) for (let m = (d === 1 ? 365 : 0); m < 1440; m += 5) {
    await town.runUntil(d, m);
    const ids = town.actorIds();
    ids.forEach((id) => { const c = T[id]; const loc = W.LOCATIONS[c.location]; if (loc.owner && loc.owner !== id) trespass++; });
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const a = T[ids[i]], b = T[ids[j]];
      const placed = (c) => { const d = c.activity && LT.Actions.get(c.activity.actionId); return d && d.position && d.position !== 'anywhere'; };
      const talking = (c) => c.activity && /^(talk_with|join_conversation)$/.test(c.activity.actionId);
      const still = (c) => c.activity && c.activity.phase === 'executing' && !c.transit && (placed(c) || talking(c));
      if (a.location === b.location && a.location !== 'street' && still(a) && still(b) && a.pos.x === b.pos.x && a.pos.y === b.pos.y) sameTile++;
    }
    const working = ids.filter((id) => T[id].activity && /^work_/.test(T[id].activity.actionId) && T[id].activity.phase === 'executing');
    if (working.length === 2) twoAtCounter++;
    worstTogether = Math.max(worstTogether, ids.filter((id) => T[id].location === 'cafe').length);
  }
  ok(trespass === 0, 'nobody is ever inside somebody else\'s home');
  ok(twoAtCounter > 10, 'two people work the counter at once (' + twoAtCounter + ' samples)…');
  ok(sameTile === 0, '…and nobody doing something from a spot, or talking, ever shares their tile');
  ok(worstTogether >= 3, 'the café gets busy: ' + worstTogether + ' people at once');
  const types = (t) => town.state.events.filter((e) => e.type === t);
  ok(new Set(types('TALKED').map((e) => e.data.participants.slice().sort().join('+'))).size >= 4, 'at least four different pairs of people talk');
  ok(town.actorIds().every((id) => types('ATE').some((e) => e.actorId === id)), 'everyone eats');
  console.log('    (kept ' + types('COMMITMENT_KEPT').length + ', broken ' + types('COMMITMENT_BROKEN').length + ', goals reached ' + types('GOAL_REACHED').length + ', missed ' + types('GOAL_MISSED').length + ', could-not ' + types('ACTIVITY_FAILED').length + ')');

  console.log('# found by putting five people in one park');
  const convs = town.state.conversations.filter((v) => v.status === 'completed');
  const withA = convs.filter((v) => v.participants.indexOf('resident_e') >= 0 && v.participants.indexOf('resident_a') >= 0);
  const goalE = T.resident_e.goals[0];
  const firstAny = convs.filter((v) => v.participants.indexOf('resident_e') >= 0)[0];
  ok(withA.length > 0 && firstAny.participants.indexOf('resident_a') < 0 && goalE.reached && goalE.progress === withA.length,
     'a goal about one person counts talks with that person (' + goalE.progress + '), not the earlier ones with somebody else, and not ones overheard');
  const kept = types('COMMITMENT_KEPT').filter((e) => e.data.commitmentId === 'cmt_park_morning');
  ok(kept.length === 2 && kept[0].absMinute < 660, 'two people who met early at the agreed place kept their promise (' + kept[0].stamp + ' for 11:00)');
  ok(types('COMMITMENT_BROKEN').every((e) => { const c = T[e.actorId].commitments.find((k) => k.id === e.data.commitmentId); return !(c.kind === 'social' && convs.some((v) => v.participants.indexOf(e.actorId) >= 0 && v.participants.indexOf(c.withId) >= 0 && v.startAbs <= LT.Util.absolute(c.dueDay, c.dueMin) + (c.graceMin || 0) && v.startAbs >= LT.Util.absolute(c.dueDay, c.dueMin) - 90)); }),
     'no meeting is called broken when the two sat down together in time');

  console.log('# a town saves and carries on like any world');
  const a = LT.Scenario.town({}); await a.runUntil(1, 745);
  const saved = JSON.parse(JSON.stringify(LT.Save.serialize(a)));
  const b = LT.Save.deserialize(saved);
  ok(b.actorIds().length === 5 && b.state.cast === 'town' && strip(a) === strip(b), 'five people in, five people out, the same world');
  await a.runUntil(2, 300); await b.runUntil(2, 300);
  ok(strip(a) === strip(b), 'and seventeen hours later it is still the same world as the one that never stopped');
  ok(saved.world === W.fingerprint(), 'saved against this town');

  console.log('# what a watcher can do reaches all five');
  LT.Scenario.town({}).actorIds().forEach((id) => { const s = LT.Scenario.town({ intervention: false }); ok(LT.Hand.make(s, 'send_parcel', { who: id }).ok, 'a parcel can be left at ' + id + '\'s door'); });
  const hands = LT.Hand.entry('extra_shift').fields(town)[0].options.map((o) => o.id);
  ok(hands.join() === 'resident_a,resident_c', 'an extra shift can be posted for either of the two who work there');

  console.log('\ntown: ' + checks + '/' + checks);
})().catch((e) => { console.error(e); process.exit(1); });
