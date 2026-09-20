/* review-regressions.js — Living Town: defects an independent review reproduced
 * against 8bdcbad, each pinned here so it cannot come back quietly.
 * The numbering follows the review. Every case was run against 8bdcbad and
 * failed there, except 4, which changes no behaviour: it pins the ordering
 * promise as it is now worded, so the comment cannot overstate it again.
 * node living-town/test/review-regressions.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');

global.window = global;
require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'policy', 'lt-mock-policy.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-observer.js'));
const LT = global.LT;

const closer = (c) => Math.round((c + 4 * (1 - c / 125)) * 100) / 100;   // +4, less the closer two people already are
let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }
let n = 0;
const freshId = (p) => p + '_' + (++n);

const TALK = { actionId: 'talk_with', targetKind: 'person' };
const { converse, walkUpAndAsk } = require('./lib-talk.js');
const count = (sim, type) => sim.state.events.filter((e) => e.type === type).length;
const rel = (sim, a, b) => Object.assign({}, sim.state.characters[a].relationships[b]);

/* Both inhabitants idle in the park at 17:20, policies never consulted unless a
 * case asks for them. */
function parkSim(opts) {
  const sim = LT.Scenario.day1(Object.assign({ intervention: false }, opts || {}));
  sim.state.minute = 1040;
  sim.placeCharacter(sim.state.characters.resident_a, 'park');
  sim.placeCharacter(sim.state.characters.resident_b, 'park');
  return sim;
}
function tickN(sim, k) { for (let i = 0; i < k; i++) sim.tick(); }
/* Ticks without ever asking a policy: the mechanics under test, nothing else. */
function quiet(sim) { sim.requestDecision = function () { return null; }; return sim; }

/* ---------------- 1: one conversation, one settlement ---------------- */

async function defaultDayHasNoRemoteConversation() {
  console.log('# 1: the default day contains no remote or repeated conversation');
  const sim = LT.Scenario.day1({});
  const apart = [];
  sim.onEvent((ev) => {
    if (ev.type !== 'TALKED') return;
    ev.data.participants.forEach((id) => {
      const c = sim.state.characters[id];
      if (c.location !== ev.locationId || c.transit) apart.push(ev.stamp + ' ' + id + ' at ' + c.location);
    });
  });
  await sim.runUntil(1, 1439);
  ok(count(sim, 'TALKED') === 1, 'the two inhabitants talk once on day one, not twice (' + count(sim, 'TALKED') + ')');
  ok(apart.length === 0, 'every TALKED event found both participants in the room it happened in ' + apart.join('; '));
  const goal = sim.state.characters.resident_b.goals.find((g) => g.kind === 'social');
  ok(goal.progress === 1, 'the social goal counts one conversation (' + goal.progress + ')');
}

function conversationIsOneSharedActivity() {
  console.log('# 1: a conversation is one shared activity with one settlement');
  const sim = quiet(parkSim());
  const a = sim.state.characters.resident_a, b = sim.state.characters.resident_b;
  const before = rel(sim, 'resident_a', 'resident_b');
  walkUpAndAsk(sim, a, b);
  ok(a.activity.phase === 'waiting_reply' && !b.activity && sim.state.conversations[0].status === 'proposed',
     'resident_a has walked up and asked; nothing has been started for resident_b');
  const conv = sim.conversationById(a.activity.conversationId);
  ok(sim.startActivity(b, { actionId: 'join_conversation', targetKind: 'conversation', targetId: conv.id }, 'test', null).ok, 'resident_b joins by taking their own candidate');
  ok(b.activity.conversationId === a.activity.conversationId && sim.state.conversations.length === 1 && conv.status === 'active',
     'resident_b is in the same conversation, not a second one');
  ok(a.activity.elapsed === 0 && a.activity.startAbs === sim.absMinute() && conv.startAbs === sim.absMinute(),
     'the talk and its clock start when they join, not while resident_a was walking over');
  const reciprocal = sim.startActivity(b, Object.assign({ targetId: 'resident_a' }, TALK), 'test', null);
  ok(!reciprocal.ok && reciprocal.error === 'already_in_conversation', 'a reciprocal start while it is running is refused (' + reciprocal.error + ')');
  tickN(sim, 25);
  ok(count(sim, 'TALKED') === 1, 'two people finishing the same conversation settle it once');
  const after = rel(sim, 'resident_a', 'resident_b');
  ok(after.trust === before.trust + 3 && after.closeness === closer(before.closeness), 'the relationship gain is applied once, not once per participant');
  ok(sim.state.conversations.length === 1 && sim.state.conversations[0].status === 'completed', 'one conversation record, completed');
  ok(!a.activity && !b.activity, 'both are free again afterwards');
}

async function simultaneousReciprocalDecisions() {
  console.log('# 1: both policies choosing to talk in the same minute yield one conversation');
  const id = freshId('talkers');
  const sim = parkSim({ policies: { resident_a: id, resident_b: id } });
  LT.MockPolicy.create({ id: id, script: [{ prefer: 'talk_with' }, { prefer: 'talk_with' }, { prefer: 'wait' }, { prefer: 'wait' }] });
  await sim.runMinutes(27);
  ok(sim.state.conversations.length === 1, 'one conversation record');
  ok(count(sim, 'TALKED') === 1, 'one TALKED event');
  const conv = sim.state.conversations[0];
  ok(conv.mutual === true && conv.status === 'completed', 'each had chosen to talk to the other: it is one mutual conversation, and it completed');
  const talkStarts = sim.state.events.filter((e) => e.type === 'ACTIVITY_STARTED' && e.data.actionId === 'talk_with');
  ok(talkStarts.length === 2 && talkStarts.every((e) => e.data.source === id && e.data.requestId),
     "both people's part in it is their own policy's decision; nobody was enrolled by the engine");
}

function leavingEndsTheConversationForBoth() {
  console.log('# 1: a participant leaving ends the conversation, and nothing settles');
  const sim = quiet(parkSim());
  const a = sim.state.characters.resident_a, b = sim.state.characters.resident_b;
  const before = rel(sim, 'resident_a', 'resident_b');
  converse(sim, a, b);
  tickN(sim, 5);
  ok(sim.requestInterrupt('resident_b', 'called_away'), 'resident_b can be pulled out of a conversation');
  ok(!a.activity && !b.activity, 'neither is left talking to nobody');
  tickN(sim, 30);
  ok(count(sim, 'TALKED') === 0, 'no TALKED event for a conversation that broke off');
  ok(count(sim, 'CONVERSATION_ENDED') === 1, 'one CONVERSATION_ENDED event');
  assert.deepEqual(rel(sim, 'resident_a', 'resident_b'), before);
  ok(true, 'no relationship change from a conversation that did not happen');

  // The partner walking out of the room, by any route, is caught the same way.
  const sim2 = quiet(parkSim());
  const a2 = sim2.state.characters.resident_a, b2 = sim2.state.characters.resident_b;
  converse(sim2, a2, b2);
  tickN(sim2, 3);
  b2.activity = null; sim2.placeCharacter(b2, 'cafe');   // removed from the room without ceremony
  tickN(sim2, 30);
  ok(count(sim2, 'TALKED') === 0 && sim2.state.conversations[0].status === 'broken_off',
     'a conversation whose partner is no longer in the room cannot complete');
}

function busyPartnerCannotBeTalkedTo() {
  console.log('# 1: someone in the middle of work is not drawn into a conversation');
  const sim = quiet(LT.Scenario.day1({ intervention: false }));
  const a = sim.state.characters.resident_a, b = sim.state.characters.resident_b;
  sim.state.minute = 600;
  sim.placeCharacter(a, 'cafe'); sim.placeCharacter(b, 'cafe');
  ok(sim.startActivity(a, { actionId: 'work_shift', targetKind: 'object', targetId: 'obj_counter' }, 'test', null).ok, 'resident_a is working');
  const rejected = LT.Perception.candidates(sim, b).rejected.find((c) => c.id === 'talk_with:resident_a');
  ok(rejected && rejected.reason === 'partner_busy', 'talk_with is withheld from the candidate list as partner_busy');
}

function meetingNeedsTheAgreedPlace() {
  console.log('# 1: a meeting is kept in the agreed place, not merely at the agreed time');
  const sim = quiet(LT.Scenario.day1({ intervention: false }));
  const a = sim.state.characters.resident_a, b = sim.state.characters.resident_b;
  sim.state.minute = 1045;
  sim.placeCharacter(a, 'cafe'); sim.placeCharacter(b, 'cafe');
  converse(sim, a, b);
  tickN(sim, 25);
  ok(count(sim, 'TALKED') === 1, 'they did talk, at the café, inside the window');
  ok(sim.commitmentById(a, 'cmt_meet_friend').status === 'open', 'the park meeting is not kept by a conversation somewhere else');
}

/* ---------------- 2: the provider gets a copy, not authority ---------------- */

async function providerCannotRewriteACandidate() {
  console.log('# 2: a provider cannot smuggle an action in behind a legal candidate id');
  const id = freshId('smuggler');
  LT.Policy.register({ id: id, decide(request) {
    const c = request.candidates.find((x) => x.id === 'wait');
    c.actionId = 'travel'; c.targetKind = 'location'; c.targetId = 'flat_b';
    return Promise.resolve(LT.Policy.selected(request, 'wait', id));
  } });
  const sim = LT.Scenario.day1({ intervention: false, policies: { resident_a: id, resident_b: 'utility' } });
  await sim.runMinutes(3);
  const a = sim.state.characters.resident_a;
  ok(!LT.World.mayEnter('flat_b', 'resident_a'), "precondition: resident_a may not enter resident_b's home");
  ok(a.activity && a.activity.actionId === 'wait', 'what executes is the sim\'s own candidate of that id: wait');
  ok(!a.transit && a.location === 'flat_a', 'resident_a did not set off for the private home');
  const stored = Object.values(sim.requests).find((r) => r.actorId === 'resident_a').request;
  ok(stored.candidates.find((c) => c.id === 'wait').actionId === 'wait', "the sim's record of the request is untouched by the provider");
}

async function providerCannotReachWorldStateThroughTheRequest() {
  console.log('# 2: nothing in a request aliases authoritative state');
  const id = freshId('vandal');
  let sawOffer = false, sawMemory = false;
  LT.Policy.register({ id: id, decide(request) {
    request.observations.offers.forEach((o) => { sawOffer = true; o.params.pay = 9999; });
    request.memories.forEach((m) => { sawMemory = true; m.summary = 'INVENTED'; m.salience = 99; });
    request.goals.forEach((g) => { g.reached = true; });
    request.self.needs.energy = 0;
    return Promise.resolve(LT.Policy.selected(request, 'wait', id));
  } });
  const sim = LT.Scenario.day1({ policies: { resident_a: id, resident_b: 'utility' } });
  sim.state.minute = 985;
  sim.placeCharacter(sim.state.characters.resident_a, 'cafe');
  await sim.runMinutes(30);
  ok(sawOffer && sawMemory, 'the provider did see, and did scribble on, an offer and a memory');
  ok(sim.state.offers[0].params.pay === 40, 'the offer still pays what the world says it pays');
  const a = sim.state.characters.resident_a;
  ok(!a.memories.some((m) => m.summary === 'INVENTED' || m.salience === 99), 'no memory was rewritten');
  ok(!a.goals.some((g) => g.reached) && a.needs.energy > 0, 'goals and needs are untouched');
}

/* ---------------- 3: no answer shape leaves anyone pending for ever ---------------- */

async function malformedAnswersFallBack() {
  console.log('# 3: a malformed answer takes its own request\'s fallback path');
  const noId = freshId('noid');
  LT.Policy.register({ id: noId, decide() { return Promise.resolve({ status: 'selected', selectedId: 'wait' }); } });
  const sim = LT.Scenario.day1({ intervention: false, policies: { resident_a: noId, resident_b: 'utility' } });
  await sim.runMinutes(3);
  const a = sim.state.characters.resident_a;
  const r = sim.rejections.find((x) => x.actorId === 'resident_a');
  ok(r && r.reason === 'malformed_response' && /^req_/.test(r.requestId), 'the refusal is tied to the request that was asked');
  ok(a.activity && a.activity.source === 'fallback:malformed_response', 'the inhabitant falls back instead of standing frozen');
  await sim.runMinutes(100);
  ok(count(sim, 'ACTIVITY_STARTED') > 5 && sim.state.events.some((e) => e.type === 'ACTIVITY_STARTED' && e.actorId === 'resident_a'),
     'a hundred minutes later they are still being given something to do');

  const wrongId = freshId('wrongid');
  LT.Policy.register({ id: wrongId, decide(request) {
    return Promise.resolve({ requestId: 'req_2', status: 'selected', selectedId: 'wait', source: wrongId });
  } });
  const sim2 = LT.Scenario.day1({ intervention: false, policies: { resident_a: wrongId, resident_b: 'utility' } });
  await sim2.runMinutes(3);
  ok(sim2.rejections.some((x) => x.actorId === 'resident_a' && x.reason === 'request_id_mismatch'),
     'an answer claiming another request\'s id is refused as request_id_mismatch');
  ok(sim2.state.characters.resident_b.activity && sim2.state.characters.resident_b.activity.source === 'utility',
     'and it did not resolve, or act as, the request whose id it claimed');
}

async function silentProviderTimesOut() {
  console.log('# 3: a provider that never answers is timed out, and its late answer refused');
  const id = freshId('silent');
  let resolveLate;
  LT.Policy.register({ id: id, decide(request) {
    return new Promise((resolve) => { resolveLate = () => resolve(LT.Policy.selected(request, 'wait', id)); });
  } });
  const sim = LT.Scenario.day1({ intervention: false, policies: { resident_a: id, resident_b: 'utility' } });
  const a = sim.state.characters.resident_a;
  await sim.runMinutes(29);
  ok(!!a.pending && !a.activity, 'inside the timeout the question is still open');
  const late = resolveLate;
  await sim.runMinutes(3);
  ok(sim.rejections.some((x) => x.actorId === 'resident_a' && x.reason === 'policy_timeout'), 'past it, the request is closed as policy_timeout');
  ok(a.activity && a.activity.source === 'fallback:policy_timeout', 'and the inhabitant falls back');
  const startedBefore = sim.state.events.filter((e) => e.type === 'ACTIVITY_STARTED' && e.actorId === 'resident_a').length;
  late();
  await sim.runMinutes(2);
  ok(sim.rejections.some((x) => x.actorId === 'resident_a' && x.reason === 'late_response'), 'the answer that finally arrives is refused as late_response');
  ok(sim.state.events.filter((e) => e.type === 'ACTIVITY_STARTED' && e.actorId === 'resident_a').length === startedBefore, 'and starts nothing');
}

/* ---------------- 4: the ordering promise, exactly as made ---------------- */

async function orderingPromiseIsPerTickBoundary() {
  console.log('# 4: request order holds among answers present at a tick; an absent answer blocks nobody');
  const id = freshId('slowfast');
  const sim = LT.Scenario.day1({ intervention: false, policies: { resident_a: id, resident_b: id } });
  const mock = LT.MockPolicy.create({ id: id, script: [{ delayTicks: 99, prefer: 'wait' }, { prefer: 'wait' }] });
  await sim.runMinutes(3);
  ok(!!sim.state.characters.resident_b.activity, 'resident_b (later request) acts as soon as its own answer is in');
  ok(!!sim.state.characters.resident_a.pending && !sim.state.characters.resident_a.activity,
     'resident_a (earlier request, no answer yet) holds nobody else up');
  mock.releaseAll();
}

/* ---------------- 5: work ends when the shift ends ---------------- */

function workNeverOverrunsItsWindow() {
  console.log('# 5: a block started at 16:59 ends at 17:00');
  const sim = quiet(LT.Scenario.day1({ intervention: false }));
  const a = sim.state.characters.resident_a;
  sim.state.minute = 1019;
  sim.placeCharacter(a, 'cafe', LT.World.OBJECTS.find((o) => o.id === 'obj_counter').anchors.work_shift);   // already behind the counter
  const savingsBefore = a.savings, moneyBefore = a.money;
  const started = sim.startActivity(a, { actionId: 'work_shift', targetKind: 'object', targetId: 'obj_counter' }, 'test', null);
  ok(started.ok && started.activity.plannedMinutes === 1, 'one minute remains, so one minute is planned (' + started.activity.plannedMinutes + ')');
  tickN(sim, 3);
  ok(!a.activity, 'nobody is still working the regular shift at 17:03');
  ok(sim.commitmentById(a, 'cmt_shift').status === 'kept', 'the 17:00 commitment is kept, not broken mid-block');
  const paid = (a.savings - savingsBefore) + (a.money - moneyBefore);
  ok(Math.abs(paid - 0.15) < 0.011, 'one minute is paid as one minute (' + paid.toFixed(2) + ' EUR), not fifteen');

  const sim2 = quiet(LT.Scenario.day1({}));
  const a2 = sim2.state.characters.resident_a;
  sim2.state.minute = 985; sim2.placeCharacter(a2, 'cafe');
  tickN(sim2, 6);
  const offer = sim2.state.offers[0];
  sim2.acceptOffer(a2, offer);
  sim2.state.minute = 1165;
  const extra = sim2.startActivity(a2, { actionId: 'work_extra_shift', targetKind: 'offer', targetId: offer.id }, 'test', null);
  ok(extra.ok && extra.activity.plannedMinutes === 5, 'the extra shift caps its last block the same way (' + extra.activity.plannedMinutes + ')');
}

/* ---------------- 6: yesterday's shift cannot be worked today ---------------- */

function acceptedShiftDoesNotRollOver() {
  console.log('# 6: an accepted extra shift belongs to its day');
  const sim = quiet(LT.Scenario.day1({}));
  const a = sim.state.characters.resident_a;
  sim.state.minute = 985; sim.placeCharacter(a, 'cafe');
  tickN(sim, 6);
  const offer = sim.state.offers[0];
  ok(offer.endAbs === sim.abs(1, 1170), 'the offer carries an absolute work window');
  sim.acceptOffer(a, offer);
  sim.placeCharacter(a, 'flat_a');
  sim.state.minute = 1169;
  tickN(sim, 3);
  ok(offer.status === 'lapsed', 'once its window has ended the accepted offer is closed (' + offer.status + ')');
  ok(sim.commitmentById(a, 'cmt_extra_' + offer.id).status === 'broken', 'and the unworked commitment is broken');
  sim.state.day = 2; sim.state.minute = 1020;
  sim.placeCharacter(a, 'cafe');
  const legal = LT.Perception.candidates(sim, a).legal.map((c) => c.id);
  ok(legal.indexOf('work_extra_shift:' + offer.id) === -1, 'at 17:00 on day two the shift is not on offer again');
  offer.status = 'accepted';   // even if something resurrected the status…
  const forced = sim.startActivity(a, { actionId: 'work_extra_shift', targetKind: 'offer', targetId: offer.id }, 'test', null);
  ok(!forced.ok && forced.error === 'shift_over', '…eligibility itself checks the absolute window (' + forced.error + ')');
}

function acceptedShiftMustMostlyBeWorked() {
  console.log('# 6: being there at the end is not the same as working the shift');
  const sim = quiet(LT.Scenario.day1({}));
  const a = sim.state.characters.resident_a;
  sim.state.minute = 985; sim.placeCharacter(a, 'cafe');
  tickN(sim, 6);
  const offer = sim.state.offers[0];
  sim.acceptOffer(a, offer);
  sim.state.minute = 1150;   // turns up for the last twenty minutes of 150
  sim.placeCharacter(a, 'cafe', LT.World.OBJECTS.find((x) => x.id === 'obj_counter').anchors.work_extra_shift);   // and is behind the counter
  sim.startActivity(a, { actionId: 'work_extra_shift', targetKind: 'offer', targetId: offer.id }, 'test', null);
  tickN(sim, 22);
  ok(offer.status === 'completed' && offer.workedMinutes === 20, 'twenty minutes were worked and paid');
  ok(sim.commitmentById(a, 'cmt_extra_' + offer.id).status === 'broken', 'the commitment to work the shift is not kept by its last twenty minutes');
}

/* ---------------- 7: being the subject of an event is not knowing about it ---------------- */

function unseenOfferLeavesNoMemory() {
  console.log('# 7: nobody remembers an offer they never saw');
  const sim = quiet(LT.Scenario.day1({}));
  const a = sim.state.characters.resident_a;
  sim.state.minute = 985;                     // resident_a stays home throughout
  tickN(sim, 100);
  const offer = sim.state.offers[0];
  ok(offer.status === 'expired' && Object.keys(offer.perceivedBy).length === 0, 'the offer expired unperceived');
  ok(!a.memories.some((m) => m.type === 'OFFER_EXPIRED' || m.type === 'OFFER_RECEIVED'), 'resident_a has no memory of it');
  const ev = sim.state.events.find((e) => e.type === 'OFFER_EXPIRED');
  ok(ev.actorId === null && ev.subjectId === 'resident_a', 'the log records them as the subject of the expiry, not its actor');

  const sim2 = quiet(LT.Scenario.day1({}));
  const a2 = sim2.state.characters.resident_a;
  sim2.state.minute = 985; sim2.placeCharacter(a2, 'cafe');
  tickN(sim2, 100);
  ok(a2.memories.some((m) => m.type === 'OFFER_EXPIRED'), 'someone who did see the offer does learn that it lapsed');
}

/* ---------------- 8: the town keeps its pace when nobody is looking ---------------- */

function observerPaceIsIndependentOfCallbackRate() {
  console.log('# 8: simulated pace does not depend on how often the page is called back');
  const O = LT.Observer;
  function ticksOver(totalMs, everyMs, msPerMinute) {
    let last = 1, acc = 0, ticks = 0;
    for (let now = 1 + everyMs; now <= 1 + totalMs; now += everyMs) {
      const step = O.clockStep(now, last); last = now;
      acc += step.sim;
      const due = O.dueTicks(acc, msPerMinute, O.MAX_TICKS_PER_FRAME);
      ticks += due; acc -= due * msPerMinute;
    }
    return ticks;
  }
  const fg = ticksOver(4000, 16, 250), bg = ticksOver(4000, 400, 250);
  ok(fg === 16 && bg === 16, 'four seconds at 1x is sixteen minutes at 16 ms frames (' + fg + ') and at 400 ms fallbacks (' + bg + ')');
  const fast = ticksOver(4000, 1000, 12);
  ok(Math.abs(fast - Math.floor(4000 / 12)) <= 1, 'even 20x through one-second throttled timers keeps up (' + fast + ')');
  ok(O.clockStep(500, 100).visual === 100, 'animation still sees a capped delta, so sprites do not lurch');
  ok(O.clockStep(3600000, 100).sim === 5000, 'a very long suspension is forgiven, not replayed minute by minute');
}

/* ---------------- persistence readiness ---------------- */

function rngStreamCanBeResumed() {
  console.log('# schema: a seeded stream can be captured and resumed');
  const r = LT.Util.rng(7); r(); r();
  const state = r.getState();
  const expected = [r(), r(), r()];
  const resumed = LT.Util.rng(12345).setState(state);
  assert.deepEqual([resumed(), resumed(), resumed()], expected);
  ok(true, 'a generator restored from its state continues the same stream');
  const sim = LT.Scenario.day1({});
  ok(JSON.stringify(JSON.parse(JSON.stringify(sim.state))) === JSON.stringify(sim.state) && Array.isArray(sim.state.conversations),
     'authoritative state is JSON-safe and carries its conversations');
}

async function main() {
  rngStreamCanBeResumed();
  await defaultDayHasNoRemoteConversation();
  conversationIsOneSharedActivity();
  await simultaneousReciprocalDecisions();
  leavingEndsTheConversationForBoth();
  busyPartnerCannotBeTalkedTo();
  meetingNeedsTheAgreedPlace();
  await providerCannotRewriteACandidate();
  await providerCannotReachWorldStateThroughTheRequest();
  await malformedAnswersFallBack();
  await silentProviderTimesOut();
  await orderingPromiseIsPerTickBoundary();
  workNeverOverrunsItsWindow();
  acceptedShiftDoesNotRollOver();
  acceptedShiftMustMostlyBeWorked();
  unseenOfferLeavesNoMemory();
  observerPaceIsIndependentOfCallbackRate();
  console.log('\nreview-regressions: ' + checks + '/' + checks);
}
main().catch((e) => { console.error(e); process.exit(1); });
