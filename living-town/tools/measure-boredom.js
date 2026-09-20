#!/usr/bin/env node
/* measure-boredom.js — Living Town: how watchable a run of the town is, as numbers.
 *
 * Runs the default world headless, one simulated minute at a time, and reads the
 * authoritative state after every minute. It reads and nothing else: a run that
 * is measured ends in the same state as one that is not (test/boredom.js).
 * No browser, no model calls, no network.
 *   node living-town/tools/measure-boredom.js [--days=3] [--cast=town] [--json] [--write-baseline]
 *   require(...).measure(sim, { days }) -> Promise of the raw numbers
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
global.window = global;
require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-story.js'));
const LT = global.LT, U = LT.Util;

const BASELINE = path.resolve(__dirname, '..', 'docs', 'boredom-baseline.json');
const WAKE_FROM = 390, WAKE_TO = 1350;          // 06:30 – 22:30, the last minute excluded
const DEAD_AT_MOST = 1;                         // interest <= 1 for everyone: nothing to watch
const KEPT_STRETCHES = 5;
const BEAT_TYPES = ['GOAL_REACHED', 'GOAL_MISSED', 'COMMITMENT_KEPT', 'COMMITMENT_BROKEN', 'TALKED', 'TALK_DECLINED',
  'TALK_UNANSWERED', 'OFFER_ACCEPTED', 'OFFER_DECLINED', 'ACTIVITY_FAILED', 'BOOK_READ', 'FOOD_PARCEL_OPENED', 'INTERVENTION_APPLIED', 'TALK_WOUND_DOWN', 'WENT_HUNGRY', 'HELPED_OUT'];

function isBeat(e) { return BEAT_TYPES.indexOf(e.type) >= 0; }

function emptyBucket(ids) {
  const b = { wakingMinutes: 0, deadMinutes: 0, liveMinutes: 0, longestDeadStretch: { minutes: 0, start: null },
    beats: 0, beatsByType: {}, decisions: 0, turnDecisions: 0, closeCalls: 0, distinctActivities: {}, placesVisited: {}, togetherMinutes: 0 };
  ids.forEach((id) => { b.distinctActivities[id] = []; b.placesVisited[id] = []; });
  return b;
}
function add(list, v) { if (v && list.indexOf(v) < 0) list.push(v); }

/* What someone is doing, for the list of dead stretches: words for a reader. */
function doing(c) {
  const a = c.activity;
  if (a) return a.actionId + (a.phase && a.phase !== 'executing' ? ' (' + a.phase + ')' : '') + ' @' + c.location;
  if (c.transit) return 'walking ' + c.transit.from + '>' + c.transit.to;
  return 'idle @' + c.location;
}

async function measure(sim, opts) {
  const days = (opts && opts.days) || 3;
  const ids = sim.actorIds();
  const firstDay = sim.state.day, lastDay = firstDay + days - 1;
  const perDay = {}, overall = emptyBucket(ids);
  for (let d = firstDay; d <= lastDay; d++) perDay[d] = emptyBucket(ids);
  const seen = {};                       // requestId -> true, so the cap of 20 loses nothing
  const stretches = [];
  let open = null;

  function closeStretch() {
    if (!open) return;
    stretches.push({ start: open.start, day: open.day, minutes: open.minutes, doing: open.doing });
    open = null;
  }
  function sample() {
    const st = sim.state, day = perDay[st.day];
    if (!day) return;
    ids.forEach((id) => {
      const c = st.characters[id], a = c.activity;
      (c.recentDecisions || []).forEach((d) => {
        if (seen[d.requestId]) return;
        seen[d.requestId] = true;
        const bucket = perDay[d.day] || day;
        bucket.decisions++;
        if (d.actionId === 'keep_talking' || d.actionId === 'wind_down') bucket.turnDecisions++;   // answered mid-talk: no activity begins
        const why = LT.Story.why(d);
        if (why && why.close === true) bucket.closeCalls++;
      });
      if (a && a.phase === 'executing') add(day.distinctActivities[id], a.actionId);
      if (!c.transit) add(day.placesVisited[id], c.location);
    });
    if (st.minute < WAKE_FROM || st.minute >= WAKE_TO) { closeStretch(); return; }
    day.wakingMinutes++;
    const places = {};
    let together = false, dead = true;
    ids.forEach((id) => {
      const c = st.characters[id];
      if (places[c.location]) together = true;
      places[c.location] = true;
      if (LT.Story.interest(sim, id) > DEAD_AT_MOST) dead = false;
    });
    if (together) day.togetherMinutes++;
    if (!dead) { day.liveMinutes++; closeStretch(); return; }
    day.deadMinutes++;
    if (!open) { open = { start: U.stamp(st.day, st.minute), day: st.day, minutes: 0, doing: {} }; ids.forEach((id) => { open.doing[id] = []; }); }
    open.minutes++;
    ids.forEach((id) => add(open.doing[id], doing(st.characters[id])));
  }

  const end = U.absolute(lastDay + 1, 0);
  while (sim.absMinute() < end) {
    const next = sim.absMinute() + 1;
    await sim.runUntil(Math.floor(next / U.MINUTES_PER_DAY) + 1, next % U.MINUTES_PER_DAY);
    sample();
  }
  closeStretch();

  sim.state.events.forEach((e) => {
    if (!isBeat(e) || !perDay[e.day]) return;
    perDay[e.day].beats++;
    perDay[e.day].beatsByType[e.type] = (perDay[e.day].beatsByType[e.type] || 0) + 1;
  });
  const longestFirst = (a, b) => b.minutes - a.minutes || (a.day - b.day) || (a.start < b.start ? -1 : 1);
  Object.keys(perDay).forEach((k) => {
    const day = perDay[k], mine = stretches.filter((s) => s.day === Number(k)).sort(longestFirst);
    if (mine.length) day.longestDeadStretch = { minutes: mine[0].minutes, start: mine[0].start };
    ['wakingMinutes', 'deadMinutes', 'liveMinutes', 'beats', 'decisions', 'turnDecisions', 'closeCalls', 'togetherMinutes'].forEach((f) => { overall[f] += day[f]; });
    Object.keys(day.beatsByType).forEach((t) => { overall.beatsByType[t] = (overall.beatsByType[t] || 0) + day.beatsByType[t]; });
    ids.forEach((id) => {
      day.distinctActivities[id].sort(); day.placesVisited[id].sort();
      day.distinctActivities[id].forEach((v) => add(overall.distinctActivities[id], v));
      day.placesVisited[id].forEach((v) => add(overall.placesVisited[id], v));
    });
  });
  ids.forEach((id) => { overall.distinctActivities[id].sort(); overall.placesVisited[id].sort(); });
  stretches.sort(longestFirst);
  if (stretches.length) overall.longestDeadStretch = { minutes: stretches[0].minutes, start: stretches[0].start };

  const names = {};
  ids.forEach((id) => { names[id] = sim.state.characters[id].name; });
  return { seed: sim.seed, days: days, firstDay: firstDay, wakingHours: [U.clock(WAKE_FROM), U.clock(WAKE_TO)], beatTypes: BEAT_TYPES.slice(),
    inhabitants: names, perDay: perDay, overall: overall,
    deadStretches: stretches.slice(0, KEPT_STRETCHES).map((s) => ({ start: s.start, minutes: s.minutes, doing: s.doing })) };
}

function table(r) {
  const ids = Object.keys(r.inhabitants), dayKeys = Object.keys(r.perDay);
  const cols = dayKeys.map((k) => ['day ' + k, r.perDay[k]]).concat([['overall', r.overall]]);
  const rows = [['', ...cols.map((c) => c[0])]];
  const row = (label, fn) => rows.push([label, ...cols.map((c) => String(fn(c[1])))]);
  row('waking minutes', (b) => b.wakingMinutes);
  row('dead minutes', (b) => b.deadMinutes + ' (' + (b.wakingMinutes ? Math.round(b.deadMinutes * 100 / b.wakingMinutes) : 0) + '%)');
  row('live minutes', (b) => b.liveMinutes);
  row('longest dead stretch', (b) => b.longestDeadStretch.start ? b.longestDeadStretch.minutes + ' min from ' + b.longestDeadStretch.start : '-');
  row('beats', (b) => b.beats);
  r.beatTypes.forEach((t) => { if (r.overall.beatsByType[t]) row('  ' + t, (b) => b.beatsByType[t] || 0); });
  row('decisions', (b) => b.decisions);
  row('  of which mid-talk', (b) => b.turnDecisions);
  row('close calls', (b) => b.closeCalls);
  ids.forEach((id) => row('activities: ' + r.inhabitants[id], (b) => b.distinctActivities[id].length));
  ids.forEach((id) => row('places: ' + r.inhabitants[id], (b) => b.placesVisited[id].length));
  row('together minutes', (b) => b.togetherMinutes);
  const width = rows[0].map((_, i) => Math.max(...rows.map((x) => x[i].length)));
  const lines = ['Living Town boredom meter — seed ' + r.seed + ', ' + r.days + ' day(s), waking hours ' + r.wakingHours.join('–'), ''];
  rows.forEach((x, n) => {
    lines.push(x.map((cell, i) => i === 0 ? cell.padEnd(width[i]) : cell.padStart(width[i])).join('  '));
    if (n === 0) lines.push(width.map((w) => '-'.repeat(w)).join('  '));
  });
  lines.push('', 'Longest dead stretches (everyone at interest <= ' + DEAD_AT_MOST + '):');
  r.deadStretches.forEach((s) => {
    lines.push('  ' + s.start + '  ' + s.minutes + ' min');
    ids.forEach((id) => lines.push('      ' + r.inhabitants[id] + ': ' + s.doing[id].join(', ')));
  });
  return lines.join('\n');
}

const BASELINE_TOWN = BASELINE.replace(/\.json$/, '-town.json');
module.exports = { measure: measure, table: table, BEAT_TYPES: BEAT_TYPES, BASELINE: BASELINE, BASELINE_TOWN: BASELINE_TOWN };

if (require.main === module) {
  const args = process.argv.slice(2);
  const daysArg = args.find((a) => /^--days=\d+$/.test(a));
  const days = daysArg ? Number(daysArg.split('=')[1]) : 3;
  if (days < 1) { console.error('--days must be at least 1'); process.exit(2); }
  const town = args.indexOf('--cast=town') >= 0;   // five people instead of two; its own baseline file
  const FILE = town ? BASELINE_TOWN : BASELINE;
  measure(town ? LT.Scenario.town({}) : LT.Scenario.day1({}), { days: days }).then((r) => {
    console.log(args.indexOf('--json') >= 0 ? JSON.stringify(r, null, 2) : table(r));
    if (args.indexOf('--write-baseline') >= 0) {
      const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: __dirname, encoding: 'utf8' }).trim();
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      fs.writeFileSync(FILE, JSON.stringify(Object.assign({ commit: commit }, r), null, 2) + '\n');
      console.error('baseline written: ' + path.relative(process.cwd(), FILE));
    }
  }).catch((e) => { console.error(e); process.exit(1); });
}
