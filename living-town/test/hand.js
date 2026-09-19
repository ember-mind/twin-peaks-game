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
  ok(H.CATALOGUE.length === 3 && H.CATALOGUE.every((e) => e.label && e.blurb && typeof e.build === 'function'), 'three things, each with words for a person');
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

  console.log('# the same request in the same world gives the same world');
  {
    const run = async () => { const s = LT.Scenario.day1({}); await s.runUntil(1, 470); H.make(s, 'leave_book', { spot: 'park_bench_sw' }); H.make(s, 'send_parcel', { who: 'resident_b' }, 'half_hour'); await s.runUntil(1, 1200); return JSON.stringify(s.state); };
    ok(await run() === await run(), 'deterministic');
  }

  console.log('\nhand: ' + checks + '/' + checks);
})().catch((e) => { console.error(e); process.exit(1); });
