/* hand.js — Living Town: what a watcher can make happen, and what they cannot.
 * The catalogue must go through the one register and the one validation, refuse
 * by name without leaving a trace, tell nobody, move nobody, and survive a save.
 * node living-town/test/hand.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-save.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-story.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-hand.js'));
const LT = global.LT, H = LT.Hand, I = LT.Interventions;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }
const quietWorld = () => { const s = LT.Scenario.day1({ intervention: false }); s.requestDecision = function () { return null; }; return s; };
const people = (sim) => JSON.stringify(sim.actorIds().map((id) => sim.state.characters[id]));

(async function () {
  console.log('# the catalogue is a way into the existing register, not a second one');
  ok(H.offered().length === 5 && H.CATALOGUE.length === 6 && !H.offered().some((e) => e.id === 'lose_wallet') && H.CATALOGUE.every((e) => e.label && e.blurb && typeof e.build === 'function'), 'five things on offer, each with words for a person; one more waits for the package that defines it');
  const types = {};
  {
    const sim = quietWorld();
    const tries = [['leave_book', { spot: 'park_bench_sw' }], ['send_parcel', { who: 'resident_b' }], ['extra_shift', { who: 'resident_a' }]];
    const before = people(sim);
    tries.forEach(([id, a]) => { const r = H.make(sim, id, a, 'half_hour'); ok(r.ok && r.record.source === 'watcher' && r.record.status === 'scheduled' && r.record.atAbs === sim.absMinute() + 30, id + ' is scheduled by the watcher for half an hour on'); types[r.record.type] = true; });
    ok(Object.keys(types).every((t) => !!I.get(t)), 'every type it schedules is one the simulation already defines: ' + Object.keys(types).join(', '));
    ok(sim.state.interventions.length === 3 && sim.scheduledInterventions === sim.state.interventions, 'three entries in the one register');
    ok(people(sim) === before, 'asking moves nobody, pays nobody, tells nobody');
  }

  console.log('# every place on offer is a place the package accepts');
  H.BOOK_SPOTS.forEach((spot) => { const sim = quietWorld(); ok(H.make(sim, 'leave_book', { spot: spot.id }).ok, 'a book can be left on ' + spot.label); });
  ['resident_a', 'resident_b'].forEach((who) => { const sim = quietWorld(); ok(H.make(sim, 'send_parcel', { who }).ok, 'a parcel can be left at ' + who + '\'s door'); });

  console.log('# a refusal has a name, and leaves no trace');
  {
    const sim = quietWorld();
    H.make(sim, 'leave_book', { spot: 'park_bench_sw' });
    const n = sim.state.interventions.length, ev = sim.state.events.length;
    const twice = H.make(sim, 'leave_book', { spot: 'park_bench_sw' });
    ok(!twice.ok && twice.error === 'spot_taken' && /already/.test(twice.said), 'the same bench twice: ' + twice.said);
    const jobless = H.make(sim, 'extra_shift', { who: 'resident_b' });
    ok(!jobless.ok && jobless.error === 'not_employed', 'a shift for someone with no employer: ' + jobless.said);
    while (sim.state.minute < 1300) sim.tick();
    const late = H.make(sim, 'extra_shift', { who: 'resident_a' });
    ok(!late.ok && late.error === 'outside_opening_hours', 'a shift past closing time is refused by the intervention\'s own validation: ' + late.said);
    ok(!H.make(sim, 'rain_of_frogs', {}).ok && !H.make(sim, 'leave_book', { spot: 'park_bench_ne' }, 'next_year').ok && !H.make(sim, 'send_parcel', { who: 'nobody' }).ok, 'an unknown thing, time or person is refused');
    ok(sim.state.interventions.length === n && sim.state.events.filter((e) => e.type === 'INTERVENTION_SCHEDULED').length === 1, 'none of the refusals was recorded or announced');
    ok(H.say('some_new_error') === 'some new error', 'an error nobody has put into words yet is shown as it is');
  }

  console.log('# nobody is told; they find out by being there');
  {
    const sim = LT.Scenario.day1({ intervention: false });
    await sim.runUntil(1, 600);
    const b = sim.state.characters.resident_a;
    ok(b.location !== b.homeId, b.name + ' is out, at ' + b.location);
    H.make(sim, 'send_parcel', { who: 'resident_a' });
    await sim.runUntil(1, 605);
    const parcel = sim.state.objects.find((o) => o.typeId === 'food_parcel');
    ok(parcel && parcel.location === 'flat_a' && parcel.status === 'sealed', 'the parcel is at the door');
    ok(!b.memories.some((m) => /parcel/i.test(m.summary || '')) && !LT.Perception.candidates(sim, b).legal.some((c) => c.actionId === 'unpack_food_parcel'), 'they neither know of it nor can choose it from where they are');
    await sim.runUntil(2, 600);
    const opened = sim.state.events.filter((e) => e.type === 'FOOD_PARCEL_OPENED');
    console.log('    (autonomous: ' + (opened.length ? opened[0].text + ' at ' + opened[0].stamp : 'never opened') + ')');
    ok(opened.length <= 1 && (opened.length === 0 || (opened[0].actorId === 'resident_a' && opened[0].absMinute > 605)), 'if it is opened, it is by the person it was for, once, after coming home');
    ok(LT.Story.recap(sim, 1).town.some((t) => /food parcel was left/.test(t.text)), 'what the watcher did is in the day\'s recap, under the town');
  }

  console.log('# asked before a save, it happens once after the load');
  {
    const sim = LT.Scenario.day1({ intervention: false });
    await sim.runUntil(1, 500);
    H.make(sim, 'leave_book', { spot: 'park_bench_ne' }, 'two_hours');
    const loaded = LT.Save.deserialize(JSON.parse(JSON.stringify(LT.Save.serialize(sim))));
    await loaded.runUntil(1, 700);
    await sim.runUntil(1, 700);
    const books = (s) => s.state.objects.filter((o) => o.typeId === 'book_used').length;
    ok(books(loaded) === 1 && loaded.state.events.filter((e) => e.type === 'INTERVENTION_APPLIED').length === 1, 'one book, applied once, in the loaded world');
    ok(H.asked(loaded)[0].status === 'applied' && H.asked(loaded)[0].at === 'D1 10:20', 'and the page lists it as having happened');
    const strip = (s) => { const c = JSON.parse(JSON.stringify(s.state)); delete c.version; return JSON.stringify(c).replace(/"requestId":"req_(\d+)\.\d+"/g, '"requestId":"req_$1"'); };
    ok(strip(loaded) === strip(sim), 'the loaded world and the one that never stopped are the same world');
  }

  console.log('# money from outside the town');
  {
    const sim = quietWorld(); const C = sim.state.characters, a = C.resident_a, b = C.resident_b;
    const before = { a: [a.money, a.savings], b: [b.money, b.savings] };
    ok(H.make(sim, 'refund', { who: 'resident_a' }).ok && H.make(sim, 'bill', { who: 'resident_b' }).ok, 'a refund for one, a bill for the other');
    sim.tick();
    ok(a.money === before.a[0] + 15 && a.savings === before.a[1] && b.money === before.b[0] - 15, 'fifteen euro each way, applied once');
    b.money = 4; b.savings = 5; H.make(sim, 'bill', { who: 'resident_b' }); sim.tick();
    ok(b.money === 0 && b.savings === 0 && sim.state.events.filter((e) => e.type === 'BILL_PAID').pop().data.amount === -9, 'a bill takes the pocket, then savings, and never more than there is (9 of 15)');
    ok(!a.memories.some((m) => m.type === 'BILL_PAID') && b.memories.some((m) => m.type === 'BILL_PAID'), 'only the person it happened to knows');
    const sane = (p) => LT.Interventions.get('money_turn').validate(p, sim);
    ok(sane({ toId: 'resident_a', amount: 500, what: 'x' }).error === 'amount_too_large' && sane({ toId: 'resident_a', amount: 0, what: 'x' }).error === 'invalid_amount' && sane({ toId: 'resident_a', amount: 5 }).error === 'missing_description', 'the type refuses absurd sums and unexplained money');
    const goal = a.goals[0]; a.savings = goal.target - 10; sim.refreshGoals(a);
    ok(!goal.reached, 'ten short of the goal');
    LT.Interventions.schedule(sim, { type: 'money_turn', source: 'watcher', params: { toId: 'resident_a', amount: 15, what: 'a refund' } }); sim.tick();
    ok(!goal.reached && a.money >= 15, 'a refund lands in the pocket, not in savings: whether it goes toward the goal is theirs to decide');
  }

  console.log('# the same request in the same world gives the same world');
  {
    const run = async () => { const s = LT.Scenario.day1({}); await s.runUntil(1, 470); H.make(s, 'leave_book', { spot: 'park_bench_sw' }); H.make(s, 'send_parcel', { who: 'resident_b' }, 'half_hour'); await s.runUntil(1, 1200); return JSON.stringify(s.state); };
    ok(await run() === await run(), 'deterministic');
  }

  console.log('\nhand: ' + checks + '/' + checks);
})().catch((e) => { console.error(e); process.exit(1); });
