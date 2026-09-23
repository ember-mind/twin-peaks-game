/* story.js — Living Town: what the page tells a watcher, and whether it is true.
 * The "why" line must be the policy's own terms and nothing else; stakes must be
 * the state's own numbers; a goal whose last day passes is closed once, remembered,
 * survives a save, and stops driving anybody; none of the readings writes anything.
 * node living-town/test/story.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'policy', 'lt-mock-policy.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-save.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-story.js'));
const LT = global.LT, Story = LT.Story;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }
const snapshot = (sim) => JSON.stringify(sim.state);

(async function () {
  console.log('# why: the policy\'s own terms, ranked, and nothing invented');
  const sim = LT.Scenario.day1({});
  await sim.runUntil(1, 560);
  const nadia = sim.state.characters.resident_a;
  const d = nadia.recentDecisions.find((x) => x.actionId === 'work_shift');
  const why = Story.why(d);
  const chosen = d.diagnostics.factors.find((f) => f.candidateId === d.selectedId);
  ok(why.known && why.weighed.length >= 1, 'a utility decision yields named weights');
  ok(why.weighed.every((w) => chosen.terms[w.term] === w.value && w.value > 0), 'every weight shown is a positive term of the chosen candidate, with its real value');
  const biggest = Object.keys(chosen.terms).sort((a, b) => chosen.terms[b] - chosen.terms[a])[0];
  ok(why.weighed[0].term === biggest, 'the first weight is the largest term (' + biggest + ')');
  ok(why.against && chosen.terms[why.against.term] < 0, 'what is shown against it is a negative term of the same candidate');
  ok(why.second && why.second.actionId !== d.actionId && d.diagnostics.factors.some((f) => f.actionId === why.second.actionId && f.score === why.second.score), 'next best is a real, different, scored alternative');
  ok(!/\b(I|thinks?|feels?|wants? to|decides?)\b/.test(why.line), 'the line is not worded as a thought: ' + why.line);
  const silent = Story.why({ source: 'mock', selectedId: 'x', diagnostics: null });
  ok(silent.known === false && /gave no reasons/.test(silent.line), 'a policy that gave no terms gets no reasons made up for it');
  ok(Story.why(null) === null, 'no decision, no line');
  ok(Story.termLabel('shelf_dust') === 'shelf dust', 'a term brought by a package is shown under its own name');

  console.log('# stakes: the state\'s own numbers');
  const stakes = Story.stakes(sim, nadia);
  const goal = stakes.find((r) => r.kind === 'goal');
  const gap = (120 - nadia.savings).toFixed(2);
  ok(goal && goal.line.indexOf(gap + ' EUR to go') === 0, 'the savings gap is target minus savings: ' + goal.line);
  ok(goal.minutesLeft === 2 * 1440 - 560, 'time left runs to the end of the goal\'s last day');
  ok(!stakes.some((r) => r.id === 'cmt_practise'), 'a promise more than four hours off is not yet shown');
  await sim.runUntil(1, 1030);
  const meet = Story.stakes(sim, nadia).find((r) => r.id === 'cmt_meet_friend');
  ok(meet && meet.minutesLeft === 20 && /due in 20 min/.test(meet.line), 'a promise shows the minutes left: ' + meet.line);

  console.log('# stakes: a promise that cannot be kept from where someone stands');
  const far = LT.Scenario.day1({ intervention: false });
  far.requestDecision = function () { return null; };
  const a = far.state.characters.resident_a;
  while (far.state.minute < 1094) far.tick();                       // 18:14, one minute before due + grace
  const lateRow = Story.stakes(far, a).find((r) => r.id === 'cmt_meet_friend');
  ok(a.location !== 'park' && lateRow.walkMinutes > 1 && lateRow.status === 'out_of_reach', 'too far to arrive inside the grace: ' + lateRow.line);
  ok((function () { const s = snapshot(far); Story.stakes(far, a); Story.recap(far, 1); Story.interest(far, 'resident_a'); Story.mostInteresting(far, 'resident_a'); Story.why(a.recentDecisions[0]); return s === snapshot(far); })(), 'no reading changes the state');

  console.log('# a goal whose last day passes');
  const late = LT.Scenario.day1({ intervention: false, everyday: false });
  late.requestDecision = function () { return null; };              // nobody does anything: nothing is earned
  const b = late.state.characters.resident_b;                       // "spend time" goal, last day 1
  while (!(late.state.day === 2 && late.state.minute === 0)) late.tick();
  const missed = late.state.events.filter((e) => e.type === 'GOAL_MISSED');
  ok(missed.length === 1 && missed[0].actorId === 'resident_b', 'the goal due on day 1 is closed at the end of day 1, and only that one');
  ok(b.goals[0].missed === true && !b.goals[0].reached, 'it is marked missed, not reached');
  ok(b.memories.some((m) => m.type === 'GOAL_MISSED'), 'its owner remembers it');
  ok(late.state.characters.resident_a.location !== b.location && !late.state.characters.resident_a.memories.some((m) => m.type === 'GOAL_MISSED'), 'someone in another place does not know');
  ok(Story.stakes(late, b).find((r) => r.kind === 'goal').status === 'missed', 'the page says so');
  while (!(late.state.day === 3 && late.state.minute === 0)) late.tick();
  ok(late.state.events.filter((e) => e.type === 'GOAL_MISSED').length === 2, 'the day-2 goal closes a day later; the first is not announced twice');
  const reloaded = LT.Save.deserialize(JSON.parse(JSON.stringify(LT.Save.serialize(late))));
  ok(reloaded.state.characters.resident_b.goals[0].missed === true, 'a missed goal is still missed after save and load');
  reloaded.requestDecision = function () { return null; };
  for (let i = 0; i < 1500; i++) reloaded.tick();
  ok(reloaded.state.events.filter((e) => e.type === 'GOAL_MISSED').length === 2, 'and is not announced again by the loaded world');

  console.log('# found in review: missed is final, private, and not tied to midnight');
  const fin = LT.Scenario.day1({ intervention: false, everyday: false });
  fin.requestDecision = function () { return null; };
  const fa = fin.state.characters.resident_a, fb = fin.state.characters.resident_b;
  fin.placeCharacter(fa, 'cafe');                                    // the two are in one room at midnight
  fa.goals[0].deadlineDay = 1;
  while (!(fin.state.day === 2 && fin.state.minute === 1)) fin.tick();
  ok(fa.goals[0].missed && fa.memories.some((m) => m.type === 'GOAL_MISSED') && !fb.memories.some((m) => m.type === 'GOAL_MISSED' && /studio/.test(m.summary)),
     'someone standing next to them at midnight learns nothing of it, and no balance');
  fa.savings = 500; fin.refreshGoals(fa);
  ok(fa.goals[0].missed && !fa.goals[0].reached && !fin.state.events.some((e) => e.type === 'GOAL_REACHED' && e.actorId === 'resident_a'), 'having the money a day late does not reach a goal that is over');
  const stale = LT.Scenario.day1({ intervention: false, everyday: false });
  stale.requestDecision = function () { return null; };
  stale.state.day = 4; stale.state.minute = 600;                     // as an older save loaded on day 4 would be
  ok(!/-\d/.test(Story.stakes(stale, stale.state.characters.resident_b)[0].line), 'an overdue goal never shows negative time left');
  stale.tick();
  ok(stale.state.characters.resident_b.goals[0].missed && stale.state.events.filter((e) => e.type === 'GOAL_MISSED').length === 2, 'and is closed on the first tick, not at the next midnight');

  console.log('# a missed goal stops driving the policy');
  const req = (missedFlag) => ({ day: 3, goals: [{ kind: 'savings', target: 120, progress: 60, deadlineDay: 2, missed: missedFlag }] });
  const asked = [];
  const probe = (flag) => LT.UtilityPolicy.decide({ requestId: 'r', candidates: [{ id: 'wait', actionId: 'wait', durationMinutes: 5 }], goals: req(flag).goals, day: 3, minute: 600, absMinute: 3480,
    self: { needs: { hunger: 10, energy: 90 }, traits: {}, money: 5, location: 'park' }, commitments: [], relationships: {} }).then((r) => asked.push(r.diagnostics.goalUrgency));
  await probe(false); await probe(true);
  ok(asked[0] > 0 && asked[1] === 0, 'urgency ' + asked[0] + ' while open, 0 once missed');

  console.log('# the day, looked back on');
  const day = LT.Scenario.day1({});
  await day.runUntil(2, 5);
  const recap = Story.recap(day, 1);
  const worked = day.state.events.filter((e) => e.day === 1 && e.actorId === 'resident_a' && /^WORKED/.test(e.type));
  const gross = worked.reduce((t, e) => t + e.data.gross, 0);
  ok(recap.complete && recap.people.length === 2, 'a finished day, one entry per person');
  ok(recap.people[0].facts[0].indexOf(gross.toFixed(2) + ' EUR') > 0, 'earnings are the sum of the day\'s work events: ' + recap.people[0].facts[0]);
  ok(recap.people.every((p) => p.told.every((t) => day.state.events.some((e) => e.text === t.text && e.stamp === t.stamp && e.actorId === p.id))), 'every line told is an event of that person, verbatim');
  ok(recap.town.length >= 2 && recap.town.every((t) => day.state.events.some((e) => !e.actorId && e.text === t.text)), 'what happened to the town is listed apart');
  ok(Story.recap(day, 2).complete === false, 'the day still running is marked as not over');

  console.log('# where to look');
  const w = LT.Scenario.day1({});
  await w.runUntil(1, 1055);
  ok(Story.mostInteresting(w, 'resident_a') === 'resident_a', 'a tie does not move the camera');
  await w.runUntil(1, 1300);
  const asleep = w.actorIds().filter((id) => { const a = w.state.characters[id].activity || {}; return a.actionId === 'sleep' && a.phase === 'executing'; });
  ok(asleep.length > 0 && asleep.every((id) => Story.interest(w, id) === 0), 'someone asleep (not still on the way to bed) is the least worth watching');
  const x = LT.Scenario.day1({});
  /* The morning's moment: she is walking up to the counter, the other is
   * getting on with something quiet (waiting, or sitting in the park). */
  const onWay = () => { const a = x.state.characters.resident_a.activity, b = x.state.characters.resident_b.activity; return a && a.actionId === 'work_shift' && a.phase === 'approaching' && b && b.phase === 'executing' && ['wait', 'sit_and_rest', 'read_book'].indexOf(b.actionId) >= 0; };
  for (let m = 480; m < 720 && !onWay(); m++) await x.runUntil(1, m);
  ok(onWay() && Story.interest(x, 'resident_a') > Story.interest(x, 'resident_b') && Story.mostInteresting(x, null) === 'resident_a', 'someone on their way to work outranks someone getting on with something quiet');

  console.log('# found by watching: a baseline that starved with money in its pocket');
  const three = LT.Scenario.day1({});
  let worst = 0, lingered = 0;
  for (let d = 2; d <= 3; d++) for (let m = 0; m < 1440; m += 10) {
    await three.runUntil(d, m);
    three.actorIds().forEach((id) => { worst = Math.max(worst, three.state.characters[id].needs.hunger); });
    const n = three.state.characters.resident_a;
    if (d === 2 && m >= 1020 + 90 && m < 1260 && n.location === 'cafe' && !n.activity) lingered++;
  }
  const ate = three.state.events.filter((e) => e.type === 'ATE' && e.actorId === 'resident_b' && e.day >= 2);
  ok(ate.length >= 2 && ate.some((e) => e.data.source === 'cafe'), 'with an empty pantry and 41 EUR, Teodora walks to where a meal is sold (' + ate.length + ' meals on days 2–3)');
  ok(worst < 90, 'nobody gets close to starving over three days (worst hunger ' + Math.round(worst) + ')');
  /* Sampled every ten minutes: one sample may catch her between arriving and deciding (she now comes back for a dinner she agreed to). An evening of it is what was wrong. */
  ok(lingered <= 1, 'nobody stands idle at work all evening once the shift is over (' + lingered + ' of 15 samples)');
  const fromHome = LT.Scenario.day1({});
  await fromHome.runUntil(1, 720);                                  // the book is in the park by now
  const known = LT.Perception.observe(fromHome, fromHome.state.characters.resident_b).reachable;
  const cafeKnown = known.find((r) => r.id === 'cafe') || known.find((r) => r.id === 'park');
  const asked2 = { services: [].concat.apply([], known.map((r) => r.services)) };
  ok(known.length >= 2 && cafeKnown && asked2.services.indexOf('buy_meal') >= 0 && !asked2.services.some((x) => x === 'read_book' || x === 'unpack_food_parcel'), 'what a place is for is public; what someone left there is not');

  console.log('# pace and beats');
  const pw = LT.Scenario.town({});
  const paces = {};
  for (let m = 361; m < 1440; m += 7) { await pw.runUntil(1, m); const p = Story.pace(pw); paces[p] = (paces[p] || 0) + 1;
    if (p === 'asleep') assert(pw.actorIds().every((id) => (pw.state.characters[id].activity || {}).actionId === 'sleep'), 'asleep with someone up'); }
  ok(paces.close > 0 && paces.quick > 0 && paces.asleep > 0, 'a day has slow, quick and sleeping stretches: ' + JSON.stringify(paces));
  const before2 = JSON.stringify(pw.state);
  const beats = Story.beats(pw, 1);
  ok(beats.length > 5 && beats.every((b) => pw.state.events.some((e) => e.seq === b.seq && e.text === b.text && e.minute === b.minute)) && JSON.stringify(pw.state) === before2, 'beats are events of that day, verbatim, and reading them changes nothing');

  console.log('# the first thing one would say about a day');
  const hw = LT.Scenario.town({});
  await hw.runUntil(6, 0);
  const heads = [1, 2, 3, 4, 5].map((d) => Story.headline(hw, d));
  console.log('    ' + heads.map((h, i) => 'D' + (i + 1) + ': ' + (h ? h.text : '—')).join('\n    '));
  ok(heads.every((h) => h === null || hw.state.events.some((e) => e.text === h.text && e.stamp === h.stamp)), 'it is an event of that day, verbatim');
  ok(heads.filter(Boolean).some((h) => /GOAL_MISSED|COMMITMENT_BROKEN|HELPED_OUT|WENT_HUNGRY/.test(h.type)), 'trouble and kindness come before routine');
  ok(Story.headline(hw, 99) === null, 'a day on which nothing happened has none');

  console.log('# between them');
  const bw = LT.Scenario.town({});
  await bw.runUntil(1, 1200);
  const BC = bw.state.characters;
  const bonds = Story.bonds(bw, BC.resident_d);
  ok(bonds.length >= 2 && bonds.every((b) => BC.resident_d.relationships[b.id].closeness === b.closeness && typeof b.word === 'string') && bonds[0].closeness >= bonds[bonds.length - 1].closeness, 'the people someone knows, closest first, as the state has them');
  /* Anyone in town who met somebody new today: that bond began as a stranger's. */
  const content = LT.World.CHARACTERS.concat(LT.World.NEIGHBOURS);
  const met = [];
  bw.actorIds().forEach((id) => { const start = (content.find((c) => c.id === id) || {}).relationships || {}; Object.keys(BC[id].relationships).forEach((o) => { if (!start[o]) met.push([id, o]); }); });
  ok(met.length > 0 && met.every(([id, o]) => BC[id].relationships[o].closeness < 50), 'someone met today started as a stranger, not as a friend (' + met.map(([id, o]) => BC[id].relationships[o].closeness).join(', ') + ')');
  const q2 = LT.Scenario.day1({ intervention: false, everyday: false }); q2.requestDecision = function () { return null; };
  const was = q2.state.characters.resident_a.relationships.resident_b.closeness;
  q2.actorIds().forEach((id) => { q2.state.characters[id].commitments = []; });   // nothing to break: only the drift is measured
  q2.state.characters.resident_a.relationships.resident_b.lastMetDay = 1;
  while (q2.state.day < 5) q2.tick();
  const now2 = q2.state.characters.resident_a.relationships.resident_b.closeness;
  ok(now2 < was && now2 >= was - 6 && Story.bonds(q2, q2.state.characters.resident_a)[0].seen === '4 days ago', 'not seeing someone lets them drift, slowly: ' + was + ' -> ' + now2);
  ok(Story.lastLine(bw, BC.resident_d) === null, 'with a policy that has no words, nothing is quoted');

  console.log('\nstory: ' + checks + '/' + checks);
})().catch((e) => { console.error(e); process.exit(1); });
