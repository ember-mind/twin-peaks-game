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
  const asleep = w.actorIds().filter((id) => (w.state.characters[id].activity || {}).actionId === 'sleep');
  ok(asleep.every((id) => Story.interest(w, id) === 0), 'someone asleep is the least worth watching');
  const x = LT.Scenario.day1({});
  await x.runUntil(1, 545);
  ok(Story.interest(x, 'resident_a') > Story.interest(x, 'resident_b') && Story.mostInteresting(x, 'resident_b') === 'resident_a', 'someone on their way to work outranks someone waiting');

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
  ok(lingered === 0, 'nobody stands idle at work all evening once the shift is over');
  const fromHome = LT.Scenario.day1({});
  await fromHome.runUntil(1, 720);                                  // the book is in the park by now
  const known = LT.Perception.observe(fromHome, fromHome.state.characters.resident_b).reachable;
  const cafeKnown = known.find((r) => r.id === 'cafe') || known.find((r) => r.id === 'park');
  const asked2 = { services: [].concat.apply([], known.map((r) => r.services)) };
  ok(known.length >= 2 && cafeKnown && asked2.services.indexOf('buy_meal') >= 0 && !asked2.services.some((x) => x === 'read_book' || x === 'unpack_food_parcel'), 'what a place is for is public; what someone left there is not');

  console.log('\nstory: ' + checks + '/' + checks);
})().catch((e) => { console.error(e); process.exit(1); });
