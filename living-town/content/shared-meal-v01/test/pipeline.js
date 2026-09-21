/* pipeline.js — Living Town content package `shared-meal-v01`: the FULL path.
 *
 * A real LT.Sim, a real clock, and small local policies of the kind
 * living-town/test/everyday.js calls `chooser`: each decision is answered by
 * preferring an action id (and, when it matters, a target), from the real
 * candidates the simulation actually offered. Nothing calls onComplete by hand.
 *
 * The invitation exists to be a question, so the path runs end to end:
 *   - the asker is OFFERED invite_to_meal because the invitee is present;
 *   - the invitee is OFFERED accept_meal / decline_meal because the core lists
 *     them in the invitation's heldAffordances (LT.Perception.HELD_AFFORDANCES)
 *     — this is the hook a carried object needs, and this base has it;
 *   - if accepted, an ordinary social commitment appears on each person, and the
 *     core — not this package — marks it kept when the two talk at the café
 *     inside the window, or broken when the hour passes.
 *
 * Two runs, the two endings: one where they meet, one where the invitee never
 * goes. The default UtilityPolicy plays no part here; it is measure.js's.
 *
 * node living-town/content/shared-meal-v01/test/pipeline.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');

require(path.resolve(__dirname, '..', '..', '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'shared-meal.js'));
const LT = global.LT;
const SM = LT.SharedMeal, P = LT.Perception;

if (P.HELD_AFFORDANCES !== true) {
  console.error('shared-meal pipeline: this checkout is wrong for this package. ' +
    'LT.Perception.HELD_AFFORDANCES is not true, so an invitee could never be offered ' +
    'accept_meal / decline_meal from the invitation they carry. Stopping.');
  process.exit(1);
}

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

let chooserSeq = 0;
/* Answer a decision by preferring an action id, optionally for a named target,
 * from the real candidates offered this minute. Falls back to waiting. */
function chooser(prefs) {
  const id = 'shared_meal_chooser_' + (++chooserSeq);
  const api = {
    id, asked: [],
    decide(request) {
      api.asked.push(request.candidates.map((c) => c.actionId));
      for (const p of prefs) {
        const c = request.candidates.find((x) => x.actionId === p.actionId &&
          (p.targetId === undefined || x.targetId === p.targetId));
        if (c) return Promise.resolve(LT.Policy.selected(request, c.id, id));
      }
      const w = request.candidates.find((x) => x.actionId === 'wait');
      return Promise.resolve(LT.Policy.selected(request, w ? w.id : request.candidates[0].id, id));
    }
  };
  LT.Policy.register(api);
  return api;
}

/* A town where only resident_a and resident_c are doing anything: everybody
 * else waits. a asks c; c decides. */
const ASKER = 'resident_a', INVITEE = 'resident_c';
const CAFE_SEAT = { x: 5, y: 5 }, CAFE_BESIDE = { x: 6, y: 5 };
const ASK_AT = 695;   // 11:35: lunch is 85 minutes away — inside the window

function buildTown(askerPrefs, inviteePrefs) {
  const asker = chooser(askerPrefs);
  const invitee = chooser(inviteePrefs);
  const idle = chooser([]);
  const policies = { resident_a: idle.id, resident_b: idle.id, resident_c: idle.id,
                     resident_d: idle.id, resident_e: idle.id };
  policies[ASKER] = asker.id;
  policies[INVITEE] = invitee.id;
  const sim = LT.Scenario.town({ intervention: false, everyday: false, policies: policies });
  sim.state.day = 1;
  sim.state.minute = ASK_AT;
  sim.placeCharacter(sim.state.characters[ASKER], 'cafe', CAFE_SEAT);
  sim.placeCharacter(sim.state.characters[INVITEE], 'cafe', CAFE_BESIDE);
  return { sim, asker, invitee };
}

function mealCommitments(sim) {
  const out = [];
  Object.keys(sim.state.characters).forEach((id) => {
    (sim.state.characters[id].commitments || []).forEach((c) => {
      if (c.id.indexOf('cmt_meal_') === 0) out.push({ who: id, c });
    });
  });
  return out;
}
/* Acceptance puts ONE commitment (one id) on each of the two people, so a
 * settled meeting is two copies of the same id. Both copies must read alike. */
function mealIds(sim) {
  const seen = {};
  mealCommitments(sim).forEach((x) => { seen[x.c.id] = true; });
  return Object.keys(seen);
}
function mealDone(sim, status) {
  const copies = mealCommitments(sim);
  return copies.length === 2 && copies.every((x) => x.c.status === status);
}
function eventsOf(sim, type, id) {
  return sim.state.events.filter((e) => e.type === type &&
    (id === undefined || (e.data && e.data.commitmentId === id)));
}

async function runUntil(sim, done, cap) {
  let minute = 0;
  while (!done(sim) && minute < cap) { await sim.runMinutes(1); minute++; }
  return minute;
}

/* ---------------- ending one: they meet, the core keeps the promise ---------------- */

async function meetingEnding() {
  console.log('# pipeline (met ending): offered, asked, accepted, and kept by the core');
  const askPrefs = [{ actionId: 'invite_to_meal', targetId: INVITEE },
                    { actionId: 'talk_with', targetId: INVITEE },
                    { actionId: 'keep_talking' }, { actionId: 'wind_down' }];
  const answerPrefs = [{ actionId: 'accept_meal' },
                       { actionId: 'join_conversation' },
                       { actionId: 'keep_talking' }, { actionId: 'wind_down' }];
  const t = buildTown(askPrefs, answerPrefs);
  const { sim, asker, invitee } = t;

  const minutes = await runUntil(sim, (s) => mealDone(s, 'kept'), 150);

  ok(asker.asked.some((list) => list.indexOf('invite_to_meal') >= 0),
     'the asker\'s policy was offered invite_to_meal by perception');
  ok(invitee.asked.some((list) => list.indexOf('accept_meal') >= 0) &&
     invitee.asked.some((list) => list.indexOf('decline_meal') >= 0),
     'the invitee was offered accept_meal and decline_meal from the carried invitation (heldAffordances)');

  const invited = sim.state.events.filter((e) => e.type === 'MEAL_INVITED');
  ok(invited.length === 1 && invited[0].actorId === ASKER, 'exactly one MEAL_INVITED, from the asker');
  const invitation = sim.state.objects.filter((o) => o.typeId === 'meal_invitation')[0];
  ok(invitation && invitation.status === 'accepted', 'the invitation ended accepted');

  const began = sim.state.events.filter((e) => e.type === 'ACTIVITY_STARTED' && e.data.actionId === 'invite_to_meal');
  ok(began.length === 1 && began[0].data.source === asker.id, 'invite_to_meal was chosen by the asker\'s own policy');
  const answered = sim.state.events.filter((e) => e.type === 'ACTIVITY_STARTED' && e.data.actionId === 'accept_meal');
  ok(answered.length === 1 && answered[0].data.source === invitee.id, 'accept_meal was chosen by the invitee\'s own policy');

  const copies = mealCommitments(sim);
  const ids = mealIds(sim);
  ok(copies.length === 2, 'acceptance left exactly two meal commitments, one on each person');
  ok(ids.length === 1, 'the two copies share the one commitment id drawn from the invitation');
  ok(copies.every((x) => x.c.status === 'kept'), 'the core marked both copies kept, within ' + minutes + ' minutes');

  const cmtId = ids[0];
  ok(eventsOf(sim, 'COMMITMENT_KEPT', cmtId).length === 2,
     'the core kept the meeting on both people, with its own two COMMITMENT_KEPT events');
  const talked = sim.state.events.filter((e) => e.type === 'TALKED' && e.data.withId &&
    (e.actorId === ASKER || e.actorId === INVITEE));
  ok(talked.length >= 1, 'they met: a TALKED event happened at the café inside the window');
  ok(copies.every((x) => x.c.status !== 'broken'), 'no meal commitment was left broken');
}

/* ---------------- ending two: the invitee never goes, the core breaks it ---------------- */

async function missedEnding() {
  console.log('# pipeline (missed ending): accepted, never met, and broken by the core');
  const askPrefs = [{ actionId: 'invite_to_meal', targetId: INVITEE }];
  const answerPrefs = [{ actionId: 'accept_meal' }];
  const t = buildTown(askPrefs, answerPrefs);
  const { sim, invitee } = t;

  const minutes = await runUntil(sim, (s) => mealDone(s, 'broken'), 200);

  const copies = mealCommitments(sim);
  const ids = mealIds(sim);
  ok(sim.state.events.filter((e) => e.type === 'MEAL_ACCEPTED').length === 1,
     'the invitation was still accepted by the invitee\'s policy');
  ok(invitee.asked.some((list) => list.indexOf('accept_meal') >= 0),
     'the invitee was again offered the carried actions');
  ok(copies.length === 2 && ids.length === 1, 'acceptance left two copies of the one meal commitment');
  ok(copies.every((x) => x.c.status === 'broken'),
     'the invitee never went, so the core broke both copies within ' + minutes + ' minutes');
  ok(eventsOf(sim, 'COMMITMENT_BROKEN', ids[0]).length === 2,
     'the break is the core\'s: two COMMITMENT_BROKEN events for the one meeting');
  const talked = sim.state.events.filter((e) => e.type === 'TALKED');
  ok(talked.length === 0, 'they never met: no TALKED event at all');
}

async function main() {
  await meetingEnding();
  await missedEnding();
  console.log('\nshared-meal pipeline: ' + checks + '/' + checks);
}

main().catch((e) => { console.error(e); process.exit(1); });
