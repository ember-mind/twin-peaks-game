/* async-safety.js — Living Town: the decision boundary under adversarial timing.
 * A policy answers on its own schedule, over a channel the sim does not
 * control: late, twice, to the wrong question, with garbage, or not at all.
 * None of that may lose a decision, apply a stale one, or stop the clock.
 * MockPolicy exists exactly for this; every check below drives it directly.
 * node living-town/test/async-safety.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');

require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'policy', 'lt-mock-policy.js'));
const LT = global.LT;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

let n = 0;
function freshId(prefix) { return prefix + '_' + (++n); }

/* resident_a alone on 'mock', resident_b on utility, so resident_b's own
 * decisions never interfere with the mock script or its held answers. */
function makeSim(policyId, opts) {
  const sim = LT.Scenario.day1(Object.assign({ intervention: false, policies: { resident_a: policyId, resident_b: 'utility' } }, opts || {}));
  return sim;
}

async function delayedResponse() {
  console.log('# async-safety: delayed response');
  const id = freshId('delay');
  const sim = makeSim(id);
  const mock = LT.MockPolicy.create({ id: id, script: [{ delayTicks: 3, prefer: 'wait' }] });
  const residentA = sim.state.characters.resident_a;

  await sim.runMinutes(1);
  ok(!!residentA.pending && !residentA.activity, 'the actor stays idle with a pending request while the answer is held');

  mock.release(); mock.release();
  await sim.runMinutes(1);
  ok(!residentA.activity, 'still nothing starts before the delay has fully elapsed');

  mock.release();
  await sim.runMinutes(2); // one tick for the freed promise to resolve, one to flush it
  ok(!!residentA.activity && residentA.activity.actionId === 'wait', 'the held answer starts the activity once fully released; nothing is lost');
}

async function staleResponse() {
  console.log('# async-safety: stale response is rejected, never applied');
  const id = freshId('stale');
  const sim = makeSim(id);
  const mock = LT.MockPolicy.create({ id: id, script: [{ delayTicks: 3, prefer: 'wait' }] });
  const residentA = sim.state.characters.resident_a;

  await sim.runMinutes(1);
  const staleId = residentA.pending.requestId;
  sim.credit(residentA, { money: 30 }); // changes resident_a's own relevanceKey while the decision is in flight
  mock.releaseAll();
  await sim.runMinutes(2);

  ok(sim.rejections.some((r) => r.actorId === 'resident_a' && r.reason === 'stale_state'), 'the sim records a stale_state rejection');
  /* They are asked again straight away, and may well be doing something by
   * now; what must never happen is that the refused answer is what started it. */
  ok(!sim.state.events.some((e) => e.type === 'ACTIVITY_STARTED' && e.data.requestId === staleId) &&
     (!residentA.activity || residentA.activity.requestId !== staleId), 'the stale decision never starts an activity');
}

async function unrelatedChangeDoesNotInvalidate() {
  console.log('# async-safety: an unrelated change does not invalidate a held decision');
  const id = freshId('unrelated');
  const sim = makeSim(id);
  const mock = LT.MockPolicy.create({ id: id, script: [{ delayTicks: 3, prefer: 'wait' }] });
  const residentA = sim.state.characters.resident_a;

  await sim.runMinutes(1);
  // an event in another location, touching neither actor's own state: not
  // part of anyone's relevanceKey (location, own activity/money/needs, who
  // else is in the room, the offers addressed to them).
  sim.objectById('obj_bench').condition = 'weathered';
  mock.releaseAll();
  await sim.runMinutes(2);

  ok(!sim.rejections.some((r) => r.actorId === 'resident_a' && r.reason === 'stale_state'), 'no stale_state rejection for resident_a');
  ok(!!residentA.activity && residentA.activity.actionId === 'wait', 'the held decision executes normally');
}

async function duplicateResponse() {
  console.log('# async-safety: duplicate response is refused');
  const id = freshId('dup');
  const sim = makeSim(id);
  const mock = LT.MockPolicy.create({ id: id, script: [{ prefer: 'wait' }] });

  await sim.runMinutes(2); // the normal flow already delivers this response once
  const startedBefore = sim.state.events.filter((e) => e.type === 'ACTIVITY_STARTED' && e.actorId === 'resident_a').length;

  const again = sim.deliver(mock.lastResponse); // the same response object, delivered a second time
  ok(again === false, 'sim.deliver refuses the second delivery');
  ok(sim.rejections[sim.rejections.length - 1].reason === 'duplicate_response', 'the refusal is recorded as duplicate_response');

  const startedAfter = sim.state.events.filter((e) => e.type === 'ACTIVITY_STARTED' && e.actorId === 'resident_a').length;
  ok(startedAfter === startedBefore, 'only one activity started');
}

function unknownRequest() {
  console.log('# async-safety: response for an unknown request');
  const sim = makeSim('utility');
  const delivered = sim.deliver({ requestId: 'req_9999', status: 'selected', selectedId: 'wait' });
  ok(delivered === false, 'sim.deliver refuses a requestId it never issued');
  ok(sim.rejections[sim.rejections.length - 1].reason === 'unknown_request', 'the refusal is recorded as unknown_request');
}

function malformedResponse() {
  console.log('# async-safety: malformed response');
  const sim = makeSim('utility');
  const delivered = sim.deliver({ malformed: { nope: true } });
  ok(delivered === false, 'sim.deliver refuses a response with no requestId');
  ok(sim.rejections[sim.rejections.length - 1].reason === 'malformed_response', 'the refusal is recorded as malformed_response');
}

async function policyUnavailableAndErrorNeverStopTime() {
  console.log('# async-safety: policy unavailable/error never stops time');

  // 'unavailable' is the documented fallback path: the sim itself starts a
  // wait activity so the character is never left frozen, tagged so nothing
  // downstream mistakes it for a policy's own choice.
  const idU = freshId('unavailable');
  const simU = makeSim(idU);
  LT.MockPolicy.create({ id: idU, script: [{ unavailable: 'no answer available' }] });
  await simU.runMinutes(2);
  const residentAU = simU.state.characters.resident_a;
  ok(simU.rejections.some((r) => r.actorId === 'resident_a' && r.reason === 'policy_unavailable'), 'unavailable is recorded as a rejection');
  ok(!!residentAU.activity && residentAU.activity.source.indexOf('fallback:') === 0, 'unavailable falls back to a sim-started wait activity');

  // A policy 'error' (or a thrown/rejected decide()) is the policy failing, not
  // the world moving, so it takes the same route as 'unavailable': recorded as
  // a rejection under a stable reason code, and the sim starts the fallback
  // itself. Asking a broken policy again the same minute would only spin.
  const idE = freshId('error');
  const simE = makeSim(idE);
  LT.MockPolicy.create({ id: idE, script: [{ error: 'boom' }] });
  const dayBefore = simE.state.day, minuteBefore = simE.state.minute;
  await simE.runMinutes(2);
  const residentAE = simE.state.characters.resident_a;
  const errRejection = simE.rejections.filter((r) => r.actorId === 'resident_a' && r.reason === 'policy_error')[0];
  ok(!!errRejection, "a policy 'error' status is recorded under the stable reason policy_error");
  ok(errRejection.detail === 'boom', "the policy's own message survives as detail, not as the reason code");
  ok(!!residentAE.activity && residentAE.activity.source.indexOf('fallback:') === 0, "'error' falls back to a sim-started activity, so the actor is never frozen");
  ok(simE.state.day > dayBefore || simE.state.minute > minuteBefore, 'the clock advanced regardless — time is never stuck waiting on this policy');
}

async function selectionNotOffered() {
  console.log('# async-safety: selection not offered');
  const id = freshId('notoffered');
  const sim = makeSim(id);
  LT.MockPolicy.create({ id: id, script: [{ delayTicks: 3, prefer: 'wait' }] });
  const residentA = sim.state.characters.resident_a;

  await sim.runMinutes(1);
  const requestId = residentA.pending.requestId;
  sim.deliver({ requestId: requestId, status: 'selected', selectedId: 'fly_to_the_moon', source: 'test' });
  await sim.runMinutes(1);

  ok(sim.rejections.some((r) => r.requestId === requestId && r.reason === 'selection_not_offered'), 'a candidate never offered is rejected as selection_not_offered');
  ok(!residentA.activity || residentA.activity.source.indexOf('fallback:') === 0,
     'the invented action never starts; only the sim\'s own fallback may');
  ok(!sim.state.events.some((e) => e.type === 'ACTIVITY_STARTED' && e.data.actionId === 'fly_to_the_moon'),
     'nothing the policy invented reaches the world');
}

async function candidateNoLongerLegal() {
  console.log('# async-safety: candidate no longer legal');
  const id = freshId('nolonger');
  // The clock is moved by hand below, across nine hours. The decision timeout
  // would rightly notice that; it is switched off so this construction keeps
  // isolating the legality check it exists to exercise.
  const sim = makeSim(id, { decisionTimeoutMinutes: Infinity });
  const mock = LT.MockPolicy.create({ id: id, script: [{ delayTicks: 5, prefer: 'buy_meal' }] });
  const residentA = sim.state.characters.resident_a;

  // relevanceKey has no time-of-day term, so advancing the clock past the
  // café's closing hour changes legality (buy_meal needs the café open)
  // without touching anything relevanceKey tracks — the case the task
  // description calls out explicitly, and the one exercised here.
  sim.state.minute = 700; // café open
  sim.placeCharacter(residentA, 'cafe');
  // Two things would otherwise get in first, both correctly: resident_b starts
  // the day in the café and would strike up a conversation (being spoken to
  // overtakes a pending decision), and the nine-hour jump would break open
  // commitments (promises are part of relevanceKey). Neither is the subject
  // here, so resident_b goes home and resident_a has nothing outstanding.
  sim.placeCharacter(sim.state.characters.resident_b, 'flat_b');
  residentA.commitments.forEach((c) => { c.status = 'kept'; });
  sim.adjustNeed(residentA, 'hunger', 40);

  await sim.runMinutes(1);
  ok(residentA.pending.candidateIds.some((cid) => cid.indexOf('buy_meal') === 0), 'buy_meal was offered while the café was open');
  const before = sim.relevanceKey(residentA);
  sim.state.minute = 1265; // past the café's closing hour (1260)
  const after = sim.relevanceKey(residentA);
  assert.equal(before, after, 'advancing past closing time leaves relevanceKey unchanged (the point of this construction)');

  mock.releaseAll();
  await sim.runMinutes(2);
  ok(sim.rejections.some((r) => r.actorId === 'resident_a' && r.reason === 'candidate_no_longer_legal'), 'the now-illegal candidate is rejected as candidate_no_longer_legal, not stale_state');
  ok(!residentA.activity || residentA.activity.actionId !== 'buy_meal', 'buy_meal never starts');
}

async function orderingIsRequestSeq() {
  console.log('# async-safety: two actors resolving out of order still apply in request-seq order');
  const id = freshId('order');
  const sim = LT.Scenario.day1({ intervention: false, policies: { resident_a: id, resident_b: id } });
  const mock = LT.MockPolicy.create({ id: id, script: [] });
  // resident_a is requested first in every tick (actorIds() is sorted), so
  // its request has the lower seq; resident_b is made to resolve first
  // regardless.
  mock.pushScript({ delayTicks: 3, prefer: 'wait' }); // resident_a: resolves on the 3rd release
  mock.pushScript({ delayTicks: 1, prefer: 'wait' }); // resident_b: resolves on the 1st release

  await sim.runMinutes(1);
  mock.release(); mock.release(); mock.release();
  await sim.runMinutes(2);

  const started = sim.state.events.filter((e) => e.type === 'ACTIVITY_STARTED').slice(0, 2);
  ok(started[0].actorId === 'resident_a' && started[1].actorId === 'resident_b', 'activities start in request-seq order (resident_a, then resident_b), not resolution order');
}

async function main() {
  await delayedResponse();
  await staleResponse();
  await unrelatedChangeDoesNotInvalidate();
  await duplicateResponse();
  unknownRequest();
  malformedResponse();
  await selectionNotOffered();
  await candidateNoLongerLegal();
  await policyUnavailableAndErrorNeverStopTime();
  await orderingIsRequestSeq();
  console.log('\nasync-safety: ' + checks + '/' + checks);
}

main().catch((e) => { console.error(e); process.exit(1); });
