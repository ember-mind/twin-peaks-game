/* seating.js — Living Town: a meal bought standing is eaten sitting.
 * Ordering happens at the counter; after that the person walks to a free seat
 * like anybody walking anywhere, and the walk is not part of the meal. No free
 * seat is not a failure. The seat is held by being on it. A save taken on the
 * way to the seat, or on it, goes on exactly as the town that never stopped.
 * node living-town/test/seating.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-save.js'));
const LT = global.LT;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }
const quiet = (s) => { s.requestDecision = function () { return null; }; return s; };
const tickN = (s, n) => { for (let i = 0; i < n; i++) s.tick(); };
const SEATS = ['4,7', '9,2', '10,6'];
function cafeAtNoon() {
  const sim = quiet(LT.Scenario.town({ intervention: false }));
  sim.state.minute = 720;
  return sim;
}
function order(sim, c) {
  sim.placeCharacter(c, 'cafe'); c.needs.hunger = 70; c.money = 30;
  const r = sim.startActivity(c, { actionId: 'buy_meal', targetKind: 'object', targetId: 'obj_counter' }, 'test', null);
  assert(r.ok, 'buy_meal starts: ' + r.error);
}
const key = (c) => c.pos.x + ',' + c.pos.y;

(async function () {
  console.log('# order at the counter, eat at a table');
  const sim = cafeAtNoon(), C = sim.state.characters, e = C.resident_e;
  order(sim, e);
  while (e.activity.phase !== 'executing') sim.tick();
  const counterSpot = key(e), money = e.money, hunger = e.needs.hunger;
  tickN(sim, 3);
  ok(key(e) === counterSpot && !e.activity.seat && LT.Appearance.poseFor(e) === null, 'the first minutes are spent at the counter, standing');
  tickN(sim, 2);
  ok(e.activity.seat && e.activity.seat.state === 'walking' && e.walkTarget && LT.Appearance.poseFor(e) === null, 'then she heads for a seat, walking like anyone walking');
  const elapsedAtLeaving = e.activity.elapsed;
  let walked = 0;
  while (e.activity && e.activity.seat.state === 'walking') { sim.tick(); walked++; }
  ok(walked >= 2 && e.activity.elapsed <= elapsedAtLeaving + 1, 'the ' + walked + ' minutes of the walk are not minutes of the meal');
  ok(SEATS.indexOf(key(e)) >= 0 && e.activity.seat.state === 'seated' && sim.state.events.filter((x) => x.type === 'SAT_DOWN' && x.actorId === e.id).length === 1, 'she sits at a table (' + key(e) + '), and it is said once');
  const pose = LT.Appearance.poseFor(e);
  ok(pose && pose.poseId === 'seated', 'and is drawn sitting');
  sim.placeCharacter(C.resident_d, 'cafe');
  ok(sim.spotTaken(C.resident_d, e.activity.seat.at) && !sim.spotTaken(C.resident_d, { x: 4, y: 4 }), 'the seat is hers while she is on it; the counter is free for the next person');
  let guard = 0; while (e.activity && guard++ < 40) sim.tick();
  ok(!e.activity && e.money === money - 6 && e.needs.hunger < hunger - 40, 'the meal is paid for once and feeds her once');
  ok(sim.state.events.filter((x) => x.type === 'ATE' && x.actorId === e.id).length === 1, 'one meal, one ATE');

  console.log('# three seats, four people');
  const full = cafeAtNoon(), F = full.state.characters, four = ['resident_a', 'resident_c', 'resident_d', 'resident_e'].map((id) => F[id]);
  four.forEach((c) => order(full, c));
  let shared = 0;
  for (let i = 0; i < 26; i++) { full.tick(); const ks = four.filter((c) => !c.walkTarget).map(key); if (new Set(ks).size !== ks.length) shared++; }   // passing over a tile is not standing on it
  const turnedAway = four.filter((c) => !c.activity);
  ok(turnedAway.length === 1 && full.state.events.some((x) => x.type === 'ACTIVITY_FAILED' && x.actorId === turnedAway[0].id && x.data.reason === 'spot_occupied'),
     'three spots at the counter, four people: the fourth finds it occupied and is left to do something else');
  ok(shared === 0, 'found on the way: two who set out together for one spot never stand on it together, not for a minute');
  const eating = four.filter((c) => c.activity && c.activity.actionId === 'buy_meal');
  const seatedKeys = eating.filter((c) => c.activity.seat && c.activity.seat.state === 'seated').map(key);
  ok(seatedKeys.length >= 2 && new Set(seatedKeys).size === seatedKeys.length && seatedKeys.every((k) => SEATS.indexOf(k) >= 0), 'nobody shares a seat: ' + seatedKeys.join(' '));
  const all = four.map(key);
  ok(new Set(all).size === all.length, 'and nobody shares a tile anywhere in the room');
  order(full, turnedAway[0]);
  tickN(full, 45);
  ok(four.every((c) => full.state.events.filter((x) => x.type === 'ATE' && x.actorId === c.id).length === 1), 'seat or no seat, every one of them eats');
  const stood = full.state.events.filter((x) => x.type === 'SAT_DOWN').length;
  ok(stood >= 2 && stood <= 4 && full.state.events.filter((x) => x.type === 'ACTIVITY_FAILED' && x.data.actionId === 'buy_meal' && /seat/.test(x.data.reason || '')).length === 0, 'finding no seat is never a failure (' + stood + ' sat down)');

  console.log('# a save on the way to the seat, and on it');
  for (const when of ['walking', 'seated']) {
    const live = cafeAtNoon(), L = live.state.characters.resident_e;
    order(live, L);
    let g = 0; while (!(L.activity.seat && L.activity.seat.state === when) && g++ < 40) live.tick();
    assert(L.activity.seat.state === when);
    const loaded = quiet(LT.Save.deserialize(JSON.parse(JSON.stringify(LT.Save.serialize(live)))));
    tickN(live, 45); tickN(loaded, 45);
    ok(JSON.stringify(loaded.state) === JSON.stringify(live.state), 'saved while ' + when + ', the loaded town is the town that never stopped, 45 minutes on');
  }

  console.log('\nseating: ' + checks + '/' + checks);
})().catch((e) => { console.error(e); process.exit(1); });
