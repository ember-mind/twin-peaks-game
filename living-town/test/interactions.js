/* interactions.js — Living Town: doing things where they are done, with people who agree to.
 * Choosing an activity, walking to it, doing it and finishing it are separate
 * moments, and only the third one counts as work, rest or talk. A conversation
 * is proposed by one person's policy and joined or declined by the other's; it
 * happens between two people standing next to each other, has one identity,
 * starts its clock when both are in, and settles once. None of it may be done
 * from across the room, and none of it may be decided by the engine on
 * somebody's behalf.
 * node living-town/test/interactions.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');

require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'policy', 'lt-mock-policy.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-save.js'));
const { walkUpAndAsk, converse } = require('./lib-talk.js');
const LT = global.LT, W = LT.World;

const closer = (c) => Math.round((c + 4 * (1 - c / 125)) * 100) / 100;   // +4, less the closer two people already are
let checks = 0, n = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }
const events = (sim, type, actorId) => sim.state.events.filter((e) => e.type === type && (!actorId || e.actorId === actorId));
const rel = (sim, a, b) => Object.assign({}, sim.state.characters[a].relationships[b]);
const dist = (a, b) => Math.abs(a.pos.x - b.pos.x) + Math.abs(a.pos.y - b.pos.y);
const COUNTER = W.OBJECTS.find((o) => o.id === 'obj_counter');
function quiet(sim) { sim.requestDecision = function () { return null; }; return sim; }
function tickN(sim, k) { for (let i = 0; i < k; i++) sim.tick(); }

/* A policy that takes the first thing on its list that is on offer, and
 * otherwise waits. It answers like any provider: asynchronously, by id. */
function chooser(prefs) {
  const id = 'chooser_' + (++n);
  const api = { id, asked: [], decide(request) {
    api.asked.push(request.candidates.map((c) => c.id));
    for (const p of prefs) {
      const c = request.candidates.find((x) => x.actionId === p || x.id === p);
      if (c) return Promise.resolve(LT.Policy.selected(request, c.id, id));
    }
    return Promise.resolve(LT.Policy.selected(request, 'wait', id));
  } };
  LT.Policy.register(api);
  return api;
}

/* Temporarily put furniture on a floor cell. */
function withBlocked(locId, cells, fn) {
  const loc = W.LOCATIONS[locId], saved = loc.rows.slice();
  cells.forEach(([x, y]) => { loc.rows[y] = loc.rows[y].slice(0, x) + 't' + loc.rows[y].slice(x + 1); });
  try { return fn(); } finally { loc.rows = saved; }
}

function everyActionSaysWhereItIsDone() {
  console.log('# phases: every action declares where it is done from');
  const all = LT.Actions.all();
  const undeclared = Object.keys(all).filter((id) => ['use_spot', 'beside_person', 'anywhere'].indexOf(all[id].position) < 0);
  ok(undeclared.length === 0, Object.keys(all).length + ' actions, none left to a default (' + undeclared.join(',') + ')');
  const by = (p) => Object.keys(all).filter((id) => all[id].position === p).sort().join(' ');
  ok(by('use_spot') === 'buy_meal eat_at_home practise_guitar read_book sit_and_rest sleep take_break unpack_food_parcel work_extra_shift work_shift',
     'done at an object\'s use spot: ' + by('use_spot'));
  ok(by('beside_person') === 'help_out invite_to_meal talk_with', 'done next to a person: ' + by('beside_person'));
  ok(all.travel.position === 'anywhere' && all.wait.position === 'anywhere' && all.greet.position === 'anywhere',
     'travel is its own walk; waiting, deciding and a greeting across the room need no spot');
}

function walkingToWorkIsNotWork() {
  console.log('# phases: the walk to the counter is not minutes of work');
  const sim = quiet(LT.Scenario.day1({ intervention: false }));
  const a = sim.state.characters.resident_a;
  sim.state.minute = 600;
  sim.placeCharacter(a, 'cafe');
  sim.placeCharacter(sim.state.characters.resident_b, 'flat_b');
  const before = { money: a.money, savings: a.savings, worked: a.workedMinutes || 0, energy: a.needs.energy };
  const started = sim.startActivity(a, { actionId: 'work_shift', targetKind: 'object', targetId: 'obj_counter' }, 'test', null);
  ok(started.ok && a.activity.phase === 'approaching' && events(sim, 'ACTIVITY_STARTED', 'resident_a').pop().data.phase === 'approaching',
     'choosing the shift at the door starts an approach, and says so');
  let steps = 0;
  while (a.activity && a.activity.phase === 'approaching' && steps < 40) {
    const was = { x: a.pos.x, y: a.pos.y };
    sim.tick(); steps++;
    assert(Math.abs(a.pos.x - was.x) + Math.abs(a.pos.y - was.y) <= 1, 'moved more than one tile in a minute');
    if (a.activity && a.activity.phase === 'approaching') assert.equal(a.activity.elapsed, 0, 'work minutes counted while walking');
  }
  ok(steps > 5 && a.activity.phase === 'executing' && a.pos.x === COUNTER.anchors.work_shift.x && a.pos.y === COUNTER.anchors.work_shift.y,
     steps + ' minutes later the work begins, behind the counter');
  ok(a.activity.approachMinutes === steps - 1 && a.activity.elapsed === 0 && a.activity.startAbs === sim.absMinute(),
     'the walk is recorded as approach minutes; the activity\'s own clock starts on arrival');
  ok(a.needs.energy < before.energy, 'the walk cost energy');
  const reached = events(sim, 'ACTIVITY_REACHED', 'resident_a');
  ok(reached.length === 1 && reached[0].data.approachMinutes === steps - 1, 'one ACTIVITY_REACHED event marks the moment');
  ok(a.activity.plannedMinutes === Math.min(LT.Actions.WORK_BLOCK, a.employment.shiftEnd - sim.state.minute),
     'the block is planned from the arrival time, not from the door');
  const planned = a.activity.plannedMinutes;
  tickN(sim, planned);
  const worked = events(sim, 'WORKED', 'resident_a');
  ok(worked.length === 1 && worked[0].data.minutes === planned && a.workedMinutes === before.worked + planned,
     'exactly the minutes at the counter are worked and paid (' + planned + '), none from the walk');
  const gross = Math.round(planned / 60 * a.employment.wagePerHour * 100) / 100;
  ok(Math.abs((a.money + a.savings) - (before.money + before.savings) - gross) < 0.011, 'pay is ' + gross + ' EUR for ' + planned + ' minutes');
}

function interruptedOnTheWaySettlesNothing() {
  console.log('# phases: stopped on the way there, nothing of the activity happened');
  const sim = quiet(LT.Scenario.day1({ intervention: false }));
  const a = sim.state.characters.resident_a;
  sim.state.minute = 600; sim.placeCharacter(a, 'cafe');
  const before = a.money + a.savings;
  sim.startActivity(a, { actionId: 'work_shift', targetKind: 'object', targetId: 'obj_counter' }, 'test', null);
  tickN(sim, 4);
  ok(sim.requestInterrupt('resident_a', 'called_away') && !a.activity && !a.walkTarget, 'an interruptible activity can be stopped during its approach, and the walk stops with it');
  tickN(sim, 5);
  ok(a.money + a.savings === before && events(sim, 'WORKED').length === 0 && (a.workedMinutes || 0) === 0, 'no pay, no worked minutes');
  ok(events(sim, 'ACTIVITY_INTERRUPTED', 'resident_a')[0].data.phase === 'approaching', 'the event says it was stopped while approaching');
}

function unreachableIsNotDoneFromAfar() {
  console.log('# phases: a use spot that cannot be reached is refused, and failing on the way is visible');
  const plan = W.LOCATIONS.cafe.visual.plan;
  const openEnd = [plan.counter[0] + plan.counter[2], plan.counter[1]];
  const sim = quiet(LT.Scenario.day1({ intervention: false }));
  const a = sim.state.characters.resident_a;
  sim.state.minute = 600; sim.placeCharacter(a, 'cafe');
  /* Seal the service side: the cells through which the back of the counter is reached. */
  const seal = [];
  for (let y = plan.floorTop; y < plan.counter[1]; y++) seal.push([openEnd[0], y]);
  seal.push(openEnd);
  withBlocked('cafe', seal, () => {
    const c = LT.Perception.candidates(sim, a);
    const refused = c.rejected.find((r) => r.id === 'work_shift:obj_counter');
    ok(!c.legal.some((x) => x.id === 'work_shift:obj_counter') && refused && refused.reason === 'use_spot_unreachable',
       'with the way behind the counter blocked, working is not offered: ' + (refused && refused.reason));
    const forced = sim.startActivity(a, { actionId: 'work_shift', targetKind: 'object', targetId: 'obj_counter' }, 'test', null);
    ok(!forced.ok && forced.error === 'use_spot_unreachable' && !a.activity, 'and cannot be started anyway');
  });

  /* The way closes while they are walking. */
  const started = sim.startActivity(a, { actionId: 'work_shift', targetKind: 'object', targetId: 'obj_counter' }, 'test', null);
  assert(started.ok);
  tickN(sim, 3);
  const at = { x: a.pos.x, y: a.pos.y }, before = a.money + a.savings;
  withBlocked('cafe', seal, () => {
    sim.tick();
    const failed = events(sim, 'ACTIVITY_FAILED', 'resident_a');
    ok(failed.length === 1 && failed[0].data.reason === 'use_spot_unreachable' && failed[0].data.phase === 'approaching',
       'the approach fails with an event that says why: ' + failed[0].text);
    ok(!a.activity && !a.walkTarget && dist(a, { pos: at }) <= 1, 'they stop where they are: no teleport to the counter, no work from the floor');
    tickN(sim, 130);
    ok(a.money + a.savings === before && events(sim, 'WORKED').length === 0, 'and nothing is ever paid for it');
  });
  ok(a.lastFinishedAbs === sim.absMinute() - 130, 'a failure frees them to decide again, that same minute');
}

function failureIsNotRetriedAtOnce() {
  console.log('# phases: what has just failed is not offered again the next minute');
  const sim = quiet(LT.Scenario.day1({ intervention: false }));
  const a = sim.state.characters.resident_a;
  sim.state.minute = 600; sim.placeCharacter(a, 'cafe');
  sim.startActivity(a, { actionId: 'work_shift', targetKind: 'object', targetId: 'obj_counter' }, 'test', null);
  sim.failActivity(a, 'use_spot_unreachable');
  const r = LT.Perception.candidates(sim, a).rejected.find((x) => x.id === 'work_shift:obj_counter');
  ok(r && r.reason === 'recently_failed', 'a minute later it is withheld as recently_failed');
  sim.state.minute += 31;
  ok(LT.Perception.candidates(sim, a).legal.some((x) => x.id === 'work_shift:obj_counter'), 'and offered again half an hour on');
}

/* ---------------- conversations ---------------- */

function parkPair(policies, where) {
  const sim = LT.Scenario.day1({ intervention: false, policies: policies });
  sim.state.minute = 1040;
  const a = sim.state.characters.resident_a, b = sim.state.characters.resident_b;
  sim.placeCharacter(a, 'park', (where && where.a) || { x: 4, y: 3, dir: 'down' });
  sim.placeCharacter(b, 'park', (where && where.b) || { x: 8, y: 8, dir: 'down' });
  return { sim, a, b };
}

async function acceptedThroughTheirOwnPolicy() {
  console.log('# talk: asked across the park, answered by the other person\'s own policy');
  const asker = chooser(['talk_with']), answerer = chooser(['join_conversation']);
  const { sim, a, b } = parkPair({ resident_a: asker.id, resident_b: answerer.id });
  const before = { ab: rel(sim, 'resident_a', 'resident_b'), ba: rel(sim, 'resident_b', 'resident_a') };
  assert(dist(a, b) > 5, 'precondition: they start far apart');
  let began = null, talkMinutesWhileApart = 0;
  for (let i = 0; i < 60 && !events(sim, 'TALKED').length; i++) {
    await sim.runMinutes(1);
    if (a.activity && a.activity.actionId === 'talk_with' && a.activity.phase !== 'executing') talkMinutesWhileApart += a.activity.elapsed;
    if (!began && events(sim, 'TALK_BEGAN').length) began = { minute: sim.absMinute(), d: dist(a, b), facing: [a.pos.dir, b.pos.dir] };
  }
  const proposed = events(sim, 'TALK_PROPOSED')[0], conv = sim.state.conversations[0];
  ok(proposed && sim.state.conversations.length === 1, 'one proposal, one conversation record');
  ok(began && began.d === 1, 'when the talk began they were standing next to each other (distance ' + (began && began.d) + '), facing ' + began.facing.join('/'));
  ok(talkMinutesWhileApart === 0 && conv.startAbs >= proposed.absMinute && conv.startAbs > 1040 + 3,
     'no minute of conversation was counted while one of them was still crossing the park');
  const join = events(sim, 'ACTIVITY_STARTED', 'resident_b').find((e) => e.data.actionId === 'join_conversation');
  ok(join && join.data.source === answerer.id && /^req_/.test(join.data.requestId) &&
     b.recentDecisions.some((d) => d.actionId === 'join_conversation' && d.source === answerer.id),
     'the other person joined by a decision of their own policy, recorded as theirs');
  ok(!sim.state.events.some((e) => /^joined:/.test((e.data && e.data.source) || '')), 'nothing in the log was started on anyone\'s behalf');
  ok(answerer.asked.some((c) => c.some((id) => id.indexOf('join_conversation:') === 0) && c.some((id) => id.indexOf('decline_conversation:') === 0)),
     'they were offered both joining and declining');
  const talked = events(sim, 'TALKED');
  ok(talked.length === 1 && talked[0].absMinute - conv.startAbs === 25 && conv.status === 'completed', 'twenty-five minutes after it began, it is settled once');
  const after = { ab: rel(sim, 'resident_a', 'resident_b'), ba: rel(sim, 'resident_b', 'resident_a') };
  ok(after.ab.trust === before.ab.trust + 3 && after.ab.closeness === closer(before.ab.closeness) &&
     after.ba.trust === before.ba.trust + 3 && after.ba.closeness === closer(before.ba.closeness), 'the relationship gain is applied once to each');
  ok(sim.commitmentById(a, 'cmt_meet_friend').status === 'kept' && events(sim, 'COMMITMENT_KEPT').filter((e) => e.data.commitmentId === 'cmt_meet_friend' || /Meet/.test(e.text)).length <= 1,
     'the promise to meet is kept, once');
}

async function declinedThroughTheirOwnPolicy() {
  console.log('# talk: the other person may say no');
  const asker = chooser(['talk_with']), answerer = chooser(['decline_conversation']);
  const { sim, a, b } = parkPair({ resident_a: asker.id, resident_b: answerer.id });
  const before = rel(sim, 'resident_a', 'resident_b');
  await sim.runMinutes(30);
  const declined = events(sim, 'TALK_DECLINED');
  ok(declined.length === 1 && declined[0].actorId === 'resident_b' && sim.state.conversations[0].status === 'declined', 'one TALK_DECLINED, by the person asked; the record ends declined');
  ok(b.recentDecisions.some((d) => d.actionId === 'decline_conversation' && d.source === answerer.id), 'declining is a decision their policy made');
  const failed = events(sim, 'ACTIVITY_FAILED', 'resident_a');
  ok(failed.length === 1 && failed[0].data.reason === 'declined' && failed[0].data.actionId === 'talk_with', 'the asker\'s talk ends as not done, with the reason');
  ok(events(sim, 'TALKED').length === 0 && events(sim, 'TALK_BEGAN').length === 0, 'no conversation took place');
  assert.deepEqual(rel(sim, 'resident_a', 'resident_b'), before);
  ok(sim.commitmentById(a, 'cmt_meet_friend').status !== 'kept', 'no relationship gain and no promise kept for a talk that did not happen');
  ok(events(sim, 'TALK_PROPOSED').length === 1 && asker.asked.slice(-1)[0].every((id) => id !== 'talk_with:resident_b'),
     'and they are not asked again straight away (talk withheld: ' +
     (LT.Perception.candidates(sim, a).rejected.find((r) => r.id === 'talk_with:resident_b') || {}).reason + ')');
}

async function choosingSomethingElseIsNotARefusal() {
  console.log('# talk: asked, and the policy does something else; asked, and no answer comes');
  const asker = chooser(['talk_with']), elsewhere = chooser(['sit_and_rest']);
  let t = parkPair({ resident_a: asker.id, resident_b: elsewhere.id });
  await t.sim.runMinutes(30);
  ok(t.sim.state.conversations[0].status === 'unanswered' && t.sim.state.conversations[0].endedReason === 'recipient_chose_otherwise' &&
     events(t.sim, 'TALK_DECLINED').length === 0, 'choosing to sit down instead leaves the proposal unanswered; no refusal is attributed to them');
  ok(events(t.sim, 'ACTIVITY_FAILED', 'resident_a')[0].data.reason === 'recipient_chose_otherwise', 'the asker is released with that reason');

  const silentId = 'silent_' + (++n);
  LT.MockPolicy.create({ id: silentId, script: [{ silent: true }, { silent: true }, { silent: true }] });
  t = parkPair({ resident_a: asker.id, resident_b: silentId });
  await t.sim.runMinutes(30);
  const conv = t.sim.state.conversations[0];
  ok(conv.status === 'unanswered' && conv.endedReason === 'no_reply', 'a policy that never answers: the asker waits ' + (conv.replyByAbs - conv.proposedAbs) + ' minutes and gives up');
  ok(!t.a.activity || t.a.activity.actionId !== 'talk_with', 'nobody is left standing there for ever');
}

async function lateAcceptanceCannotStartIt() {
  console.log('# talk: an answer that arrives after the asker has gone starts nothing');
  const asker = chooser(['talk_with']);
  const slowId = 'slow_' + (++n);
  const slow = LT.MockPolicy.create({ id: slowId, script: [{ delayTicks: 99, prefer: 'wait' }, { delayTicks: 99, prefer: 'join_conversation' }] });
  const t = parkPair({ resident_a: asker.id, resident_b: slowId });
  await t.sim.runMinutes(1);
  slow.releaseAll();                      // their first (idle) question resolves; the next is asked once they are spoken to
  await t.sim.runMinutes(25);
  ok(t.sim.state.conversations.length === 1 && t.sim.state.conversations[0].status === 'unanswered', 'the proposal lapsed unanswered');
  slow.releaseAll();
  await t.sim.runMinutes(3);
  ok(events(t.sim, 'TALK_BEGAN').length === 0 && t.sim.rejections.some((r) => r.actorId === 'resident_b' && /stale_state|candidate_no_longer_legal/.test(r.reason)),
     'the late "yes" is refused (' + t.sim.rejections.filter((r) => r.actorId === 'resident_b').map((r) => r.reason).join(',') + '); no conversation begins');
}

function recipientBecomesBusyOnTheWay() {
  console.log('# talk: the person becomes busy, or leaves, while being walked towards');
  let t = parkPair({});
  quiet(t.sim);
  t.sim.state.minute = 700;
  t.sim.placeCharacter(t.a, 'cafe', { x: 12, y: 8, dir: 'up' }); t.sim.placeCharacter(t.b, 'cafe', { x: 8, y: 4, dir: 'down' });
  t.sim.adjustNeed(t.b, 'hunger', 40);
  assert(t.sim.startActivity(t.a, { actionId: 'talk_with', targetKind: 'person', targetId: 'resident_b' }, 'test', null).ok);
  tickN(t.sim, 2);
  assert(t.sim.startActivity(t.b, { actionId: 'buy_meal', targetKind: 'object', targetId: 'obj_counter' }, 'test', null).ok);
  tickN(t.sim, 2);
  let failed = events(t.sim, 'ACTIVITY_FAILED', 'resident_a');
  ok(failed.length === 1 && failed[0].data.reason === 'partner_busy' && t.sim.state.conversations.length === 0 && t.b.activity.actionId === 'buy_meal',
     'they started buying a meal: the walk over is abandoned as partner_busy, no proposal is made, and their meal is not interrupted');

  t = parkPair({}); quiet(t.sim);
  assert(t.sim.startActivity(t.a, { actionId: 'talk_with', targetKind: 'person', targetId: 'resident_b' }, 'test', null).ok);
  tickN(t.sim, 2);
  t.sim.placeCharacter(t.b, 'street');
  tickN(t.sim, 2);
  failed = events(t.sim, 'ACTIVITY_FAILED', 'resident_a');
  ok(failed.length === 1 && failed[0].data.reason === 'not_present' && t.sim.state.conversations.length === 0, 'they left the park: not_present, and nothing was proposed to an empty lawn');
}

function personWhoCannotBeReached() {
  console.log('# talk: someone who cannot be walked up to is not talked to');
  const t = parkPair({}); quiet(t.sim);
  const ring = [[7, 8], [9, 8], [8, 7], [8, 9]].filter(([x, y]) => !W.isSolid(W.LOCATIONS.park.rows[y].charAt(x)));
  withBlocked('park', ring, () => {
    const r = LT.Perception.candidates(t.sim, t.a).rejected.find((x) => x.id === 'talk_with:resident_b');
    ok(r && r.reason === 'person_unreachable', 'with every cell around them taken up, talking is withheld as ' + (r && r.reason));
    const forced = t.sim.startActivity(t.a, { actionId: 'talk_with', targetKind: 'person', targetId: 'resident_b' }, 'test', null);
    ok(!forced.ok && t.sim.state.conversations.length === 0, 'and cannot be started from where they stand');
  });
}

function spokenToLooksUpButDecidesForThemselves() {
  console.log('# talk: being spoken to interrupts a rest; it does not answer for the person resting');
  const t = parkPair({}); quiet(t.sim);
  const bench = t.sim.objectsAt('park').find((o) => (o.affordances || []).indexOf('sit_and_rest') >= 0);
  assert(t.sim.startActivity(t.b, { actionId: 'sit_and_rest', targetKind: 'object', targetId: bench.id }, 'test', null).ok);
  tickN(t.sim, 12);
  assert(t.b.activity && t.b.activity.phase === 'executing', 'precondition: resting on the bench');
  walkUpAndAsk(t.sim, t.a, t.b);
  const stopped = events(t.sim, 'ACTIVITY_INTERRUPTED', 'resident_b');
  ok(stopped.length === 1 && stopped[0].data.reason === 'spoken_to' && !t.b.activity, 'their rest ends with reason spoken_to — the world\'s doing, and labelled so');
  ok(t.sim.state.conversations[0].status === 'proposed' && t.a.activity.phase === 'waiting_reply' && t.b.recentDecisions.length === 0,
     'the conversation is only proposed; no decision has been entered in their name');
  const c = LT.Perception.candidates(t.sim, t.b).legal.map((x) => x.actionId);
  ok(c.indexOf('join_conversation') >= 0 && c.indexOf('decline_conversation') >= 0, 'what they do next is theirs to choose: join or decline are both on offer');
}

function askerStoppedWhileWaiting() {
  console.log('# talk: the asker is called away before an answer, or one of them steps away during it');
  let t = parkPair({}); quiet(t.sim);
  walkUpAndAsk(t.sim, t.a, t.b);
  ok(t.sim.requestInterrupt('resident_a', 'called_away') && t.sim.state.conversations[0].status === 'withdrawn', 'the proposal is withdrawn');
  const late = t.sim.startActivity(t.b, { actionId: 'join_conversation', targetKind: 'conversation', targetId: 'conv_1' }, 'test', null);
  ok(!late.ok && late.error === 'proposal_withdrawn', 'and can no longer be joined (' + late.error + ')');

  t = parkPair({}); quiet(t.sim);
  const before = rel(t.sim, 'resident_a', 'resident_b');
  converse(t.sim, t.a, t.b);
  tickN(t.sim, 6);
  t.b.pos = { x: t.b.pos.x + (t.b.pos.x > t.a.pos.x ? 2 : -2), y: t.b.pos.y, dir: 'down' };   // no longer beside each other
  tickN(t.sim, 2);
  ok(t.sim.state.conversations[0].status === 'broken_off' && !t.a.activity && !t.b.activity, 'a conversation whose people are no longer side by side breaks off for both');
  tickN(t.sim, 30);
  assert.deepEqual(rel(t.sim, 'resident_a', 'resident_b'), before);
  ok(events(t.sim, 'TALKED').length === 0, 'and settles nothing');
}

async function bothSetOutAtOnce() {
  console.log('# talk: both set out towards each other in the same minute');
  const p1 = chooser(['talk_with']), p2 = chooser(['talk_with']);
  const { sim, a, b } = parkPair({ resident_a: p1.id, resident_b: p2.id });
  const before = rel(sim, 'resident_a', 'resident_b');
  await sim.runMinutes(45);
  const conv = sim.state.conversations;
  ok(conv.length === 1 && conv[0].mutual === true && conv[0].status === 'completed', 'one conversation, marked mutual, completed');
  ok(events(sim, 'TALK_PROPOSED').length === 0 && events(sim, 'TALK_BEGAN').length === 1 && events(sim, 'TALKED').length === 1, 'no proposal was needed — each had chosen it; it began once and settled once');
  const after = rel(sim, 'resident_a', 'resident_b');
  ok(after.trust === before.trust + 3 && after.closeness === closer(before.closeness), 'one gain, not two');
  void a; void b;
}

/* ---------------- saving in the middle of any of it ---------------- */

function facts(sim) {
  const s = JSON.parse(JSON.stringify(sim.state));
  delete s.version;
  return JSON.stringify(s).replace(/"requestId":"req_(\d+)\.\d+"/g, '"requestId":"req_$1"');
}

async function savedAtEveryPhase() {
  console.log('# save: reloading while approaching, while waiting for an answer, while talking');
  const want = { approaching: null, waiting_reply: null, talking: null, approaching_work: null };
  const scout = LT.Scenario.day1({});
  for (let m = 361; m < 1300; m++) {
    await scout.runUntil(1, m);
    const a = scout.state.characters.resident_a, act = a.activity;
    if (!act) continue;
    if (act.actionId === 'talk_with' && act.phase === 'approaching' && !want.approaching) want.approaching = m;
    if (act.actionId === 'talk_with' && act.phase === 'waiting_reply' && !want.waiting_reply) want.waiting_reply = m;
    if (act.conversationId && act.phase === 'executing' && act.elapsed > 3 && !want.talking) want.talking = m;
    if (act.actionId === 'work_shift' && act.phase === 'approaching' && act.approachMinutes > 2 && !want.approaching_work) want.approaching_work = m;
  }
  ok(want.approaching && want.talking && want.approaching_work, 'the ordinary day contains each moment: ' + JSON.stringify(want));
  for (const label of Object.keys(want)) {
    const minute = want[label];
    if (!minute) continue;
    const direct = LT.Scenario.day1({}), saver = LT.Scenario.day1({});
    await direct.runUntil(1, minute); await saver.runUntil(1, minute);
    const restored = LT.Save.fromJSON(LT.Save.toJSON(saver));
    const r = restored.state.characters.resident_a.activity;
    assert(r && r.phase === saver.state.characters.resident_a.activity.phase, 'the phase did not survive');
    await direct.runUntil(2, 300); await restored.runUntil(2, 300);
    assert.equal(facts(restored), facts(direct), 'reload while ' + label + ' changed what followed');
    const talked = events(restored, 'TALKED').length, worked = JSON.stringify(events(restored, 'WORKED').map((e) => e.data));
    assert.equal(talked, events(direct, 'TALKED').length); assert.equal(worked, JSON.stringify(events(direct, 'WORKED').map((e) => e.data)));
  }
  ok(true, 'each resumes into exactly the uninterrupted town: same phase, same conversation (settled once), same paid minutes');
}

(async function main() {
  everyActionSaysWhereItIsDone();
  walkingToWorkIsNotWork();
  interruptedOnTheWaySettlesNothing();
  unreachableIsNotDoneFromAfar();
  failureIsNotRetriedAtOnce();
  await acceptedThroughTheirOwnPolicy();
  await declinedThroughTheirOwnPolicy();
  await choosingSomethingElseIsNotARefusal();
  await lateAcceptanceCannotStartIt();
  recipientBecomesBusyOnTheWay();
  personWhoCannotBeReached();
  spokenToLooksUpButDecidesForThemselves();
  askerStoppedWhileWaiting();
  await bothSetOutAtOnce();
  await savedAtEveryPhase();
  console.log('\ninteractions: ' + checks + '/' + checks);
})().catch((e) => { console.error(e); process.exit(1); });
