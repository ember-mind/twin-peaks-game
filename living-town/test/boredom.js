/* boredom.js — Living Town: the boredom meter measures, and only measures.
 * Sampling a run must leave the world exactly as an unsampled run leaves it; the
 * numbers must be the same twice, add up, and agree with the event log; a town
 * where nobody decides must score worse; and the committed baseline must be the
 * town as it is now, so the town cannot change without the baseline being
 * regenerated on purpose (node living-town/tools/measure-boredom.js --write-baseline).
 * node living-town/test/boredom.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Meter = require(path.resolve(__dirname, '..', 'tools', 'measure-boredom.js'));
const LT = global.LT;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }
const snapshot = (sim) => JSON.stringify(sim.state);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

(async function () {
  console.log('# measuring does not change the world');
  const plain = LT.Scenario.day1({});
  await plain.runUntil(2, 0);
  const watched = LT.Scenario.day1({});
  const one = await Meter.measure(watched, { days: 1 });
  ok(watched.state.day === 2 && watched.state.minute === 0, 'a one-day measurement stops at the start of day 2');
  ok(snapshot(watched) === snapshot(plain), 'a day sampled every minute ends byte-identical to the same day not sampled');

  console.log('# the same numbers twice');
  const first = await Meter.measure(LT.Scenario.day1({}), { days: 3 });
  const second = await Meter.measure(LT.Scenario.day1({}), { days: 3 });
  ok(same(first, second), 'two three-day runs give identical numbers');
  ok(same(first.perDay[1], one.perDay[1]), 'day 1 of a three-day run is the one-day run');

  console.log('# the numbers add up');
  const days = Object.keys(first.perDay).map((k) => first.perDay[k]);
  ok(days.length === 3 && days.every((d) => d.wakingMinutes === 960), 'three days, 960 waking minutes each (06:30–22:30)');
  ok(days.every((d) => d.deadMinutes + d.liveMinutes === d.wakingMinutes), 'dead + live = waking, every day');
  ok(first.overall.deadMinutes === days.reduce((t, d) => t + d.deadMinutes, 0) && first.overall.wakingMinutes === 2880, 'overall is the sum of the days');
  ok(days.every((d) => d.longestDeadStretch.minutes <= d.deadMinutes && (d.deadMinutes === 0) === (d.longestDeadStretch.start === null)), 'the longest dead stretch fits inside the dead minutes and carries its start');
  ok(days.every((d) => d.togetherMinutes <= d.wakingMinutes && d.closeCalls <= d.decisions), 'together minutes and close calls stay inside their totals');
  ok(days.every((d) => Object.keys(d.beatsByType).reduce((t, k) => t + d.beatsByType[k], 0) === d.beats), 'beats per type sum to the beats of the day');

  console.log('# beats and decisions agree with the state');
  const sim = LT.Scenario.day1({});
  const r = await Meter.measure(sim, { days: 3 });
  const direct = sim.state.events.filter((e) => Meter.BEAT_TYPES.indexOf(e.type) >= 0 && e.day <= 3);
  ok(r.overall.beats === direct.length && direct.length > 0, 'beats (' + r.overall.beats + ') equal the event log filtered directly');
  ok([1, 2, 3].every((d) => r.perDay[d].beats === direct.filter((e) => e.day === d).length), 'and day by day');
  const started = sim.state.events.filter((e) => e.type === 'ACTIVITY_STARTED' && e.data && e.data.requestId && e.day <= 3);
  const ids = {};
  started.forEach((e) => { ids[e.data.requestId] = true; });
  ok(r.overall.decisions === Object.keys(ids).length && r.overall.decisions > 40, 'no decision is lost to the cap of 20: ' + r.overall.decisions + ' collected');
  ok(r.overall.closeCalls > 0 && sim.actorIds().every((id) => r.perDay[1].distinctActivities[id].length > 1 && r.perDay[1].placesVisited[id].length > 1), 'the default day has close calls, several activities and several places per person');

  console.log('# a town where nobody decides is more boring');
  const still = LT.Scenario.day1({});
  still.requestDecision = function () { return null; };
  const s = await Meter.measure(still, { days: 3 });
  ok(s.overall.deadMinutes > r.overall.deadMinutes, 'more dead minutes: ' + s.overall.deadMinutes + ' > ' + r.overall.deadMinutes);
  ok(s.overall.beats < r.overall.beats, 'fewer beats: ' + s.overall.beats + ' < ' + r.overall.beats);
  ok(s.overall.decisions === 0 && s.overall.closeCalls === 0, 'and no decisions at all');

  console.log('# the committed baseline is the town as it is');
  ok(fs.existsSync(Meter.BASELINE), 'living-town/docs/boredom-baseline.json exists');
  const baseline = JSON.parse(fs.readFileSync(Meter.BASELINE, 'utf8'));
  ok(/^[0-9a-f]{40}$/.test(baseline.commit) && baseline.seed === 20260918 && baseline.days === 3, 'it names its commit, seed and days');
  const fresh = await Meter.measure(LT.Scenario.day1({ seed: baseline.seed }), { days: baseline.days });
  const numbers = Object.assign({}, baseline); delete numbers.commit;
  assert.deepStrictEqual(numbers, JSON.parse(JSON.stringify(fresh)), 'the town changed: regenerate the baseline deliberately with --write-baseline');
  const townBase = JSON.parse(fs.readFileSync(Meter.BASELINE_TOWN, 'utf8'));
  const townFresh = await Meter.measure(LT.Scenario.town({ seed: townBase.seed }), { days: townBase.days });
  const townNumbers = Object.assign({}, townBase); delete townNumbers.commit;
  assert.deepStrictEqual(townNumbers, JSON.parse(JSON.stringify(townFresh)), 'the five-person town changed: regenerate with --cast=town --write-baseline');
  ok(townFresh.overall.beats > 2 * fresh.overall.beats && townFresh.overall.deadMinutes <= fresh.overall.deadMinutes * 1.25, 'five people give a watcher more than two do: ' + townFresh.overall.beats + ' beats against ' + fresh.overall.beats + ', ' + townFresh.overall.deadMinutes + ' dead minutes against ' + fresh.overall.deadMinutes);
  ok(true, 'a fresh measurement matches the baseline, commit aside');

  console.log('\nboredom: ' + checks + '/' + checks);
})().catch((e) => { console.error(e); process.exit(1); });
