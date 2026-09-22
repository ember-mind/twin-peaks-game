/* shared-meal.js test — Living Town content package `shared-meal-v01`.
 *
 * CALLBACK tests: they drive the package's object builder, action definitions
 * and content registration through the real Sim and its real contexts. The
 * FULL path — a town where perception offers invite_to_meal and, through the
 * carried invitation's heldAffordances, accept_meal / decline_meal — is
 * exercised in pipeline.js.
 *
 * node living-town/content/shared-meal-v01/test/shared-meal.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');

require(path.resolve(__dirname, '..', '..', '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', '..', '..', 'js', 'lt-save.js'));
require(path.resolve(__dirname, '..', 'shared-meal.js'));
const LT = global.LT;
const SM = LT.SharedMeal, A = LT.Actions, W = LT.World, C = LT.Content, P = LT.Perception, I = LT.Interventions;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

/* Five people, no interventions, so the only thing in the park is what this
 * test puts there. resident_a and resident_c share no social commitment, so an
 * invitation between them is allowed. */
function newSim() { return LT.Scenario.town({ intervention: false, everyday: false }); }
function setAbs(sim, abs) {
  const day = Math.floor(abs / 1440) + 1;
  sim.state.day = day;
  sim.state.minute = abs - (day - 1) * 1440;
}
function setMinute(sim, minute) { sim.state.minute = minute; }
function placeAdjacent(sim, from, to) {
  sim.placeCharacter(from, 'cafe', { x: 5, y: 5 });
  sim.placeCharacter(to, 'cafe', { x: 6, y: 5 });
}
function invitations(sim) { return sim.state.objects.filter((o) => o.typeId === 'meal_invitation'); }
function invite(sim, from, to, minute) {
  placeAdjacent(sim, from, to);
  if (minute !== undefined) setMinute(sim, minute);
  SM.ACTIONS.invite_to_meal.onComplete(sim.context(from, to));
  return invitations(sim).filter((o) => o.fromId === from.id && o.toId === to.id).slice(-1)[0];
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

/* ---------------- package shape and registration ---------------- */

function packageShape() {
  console.log('# package: object type, three actions and registration');
  ok(SM.TYPE_ID === 'meal_invitation' && SM.STATUSES.join(',') === 'open,accepted,declined',
     'the object type is meal_invitation with three states');

  const inv = SM.ACTIONS.invite_to_meal, acc = SM.ACTIONS.accept_meal, dec = SM.ACTIONS.decline_meal;
  ok(inv.id === 'invite_to_meal' && inv.targetKind === 'person' && inv.position === 'beside_person' &&
     inv.offeredToPresent === true && inv.interruptible === false && inv.duration({}) === 2 &&
     typeof inv.eligible === 'function' && typeof inv.onComplete === 'function',
     'invite_to_meal: person, beside_person, offeredToPresent, 2 minutes, not interruptible');
  ok(acc.id === 'accept_meal' && acc.targetKind === null && acc.position === 'anywhere' &&
     acc.interruptible === false && acc.duration({}) === 1 && typeof acc.candidateMeta === 'function',
     'accept_meal: no target, anywhere, 1 minute');
  ok(dec.id === 'decline_meal' && dec.targetKind === null && dec.position === 'anywhere' &&
     dec.interruptible === false && dec.duration({}) === 1 && typeof dec.candidateMeta === 'function',
     'decline_meal: no target, anywhere, 1 minute');

  ok(A.get('invite_to_meal') === inv && A.get('accept_meal') === acc && A.get('decline_meal') === dec,
     'all three actions are in the catalogue, registered through LT.Actions.define');
  ok(C.packageOf('meal_invitation') === 'shared-meal' && C.version('shared-meal') === 'v01',
     'the package declares meal_invitation to LT.Content at version v01');
  ok((C.usedBy({ objects: [{ typeId: 'meal_invitation' }], interventions: [] })['shared-meal']) === 'v01',
     'a state that holds an invitation is seen to use the shared-meal package');
  ok(I.types().indexOf('meal_invitation') < 0 && I.types().indexOf('shared_meal') < 0,
     'the package adds no intervention type');

  const seen = [];
  SM.registerActions({ define: (def) => { seen.push(def.id); } });
  ok(seen.length === 3 && seen.indexOf('invite_to_meal') >= 0 && seen.indexOf('accept_meal') >= 0 &&
     seen.indexOf('decline_meal') >= 0,
     'registerActions wires all three definitions into a catalogue that offers define()');
  assert.throws(() => A.define(Object.assign({}, SM.ACTIONS.invite_to_meal)), /already in the catalogue/);
  ok(A.get('invite_to_meal') === inv, 'and a second definition under the same id is refused, not swapped in');
}

function visual() {
  console.log('# visual: an invitation is never drawn anywhere');
  const sim = newSim();
  const a = sim.state.characters.resident_a, c = sim.state.characters.resident_c;
  const inv = invite(sim, a, c, 660);
  ok(C.visualOf(inv, sim) === null, 'an open invitation is not drawn');
  SM.ACTIONS.accept_meal.onComplete(sim.context(c, null));
  ok(C.visualOf(inv, sim) === null, 'an accepted invitation is not drawn');
  const inv2 = invite(sim, a, sim.state.characters.resident_d, 660);
  SM.ACTIONS.decline_meal.onComplete(sim.context(sim.state.characters.resident_d, null));
  ok(C.visualOf(inv2, sim) === null, 'a declined one is not drawn either');
}

/* ---------------- eligibility ---------------- */

function eligibility() {
  console.log('# invite_to_meal: who, when, and how often it may be asked');
  const sim = newSim();
  const a = sim.state.characters.resident_a, b = sim.state.characters.resident_b;
  const c = sim.state.characters.resident_c, d = sim.state.characters.resident_d;

  placeAdjacent(sim, a, c);
  setMinute(sim, 360);   // 06:00: no sitting is between one and six hours away
  ok(SM.ACTIONS.invite_to_meal.eligible(sim.context(a, c)).reason === 'no_sitting_to_ask_about',
     'before any sitting is near enough, there is nothing to invite to');

  setMinute(sim, 750);   // 12:30: lunch is 30 min away, dinner six hours
  ok(SM.ACTIONS.invite_to_meal.eligible(sim.context(a, c)).reason === 'no_sitting_to_ask_about',
     'too close to the sitting, and too far from the next, is nothing to invite to');

  setMinute(sim, 660);   // 11:00
  sim.placeCharacter(c, 'park', { x: 5, y: 5 });
  ok(SM.ACTIONS.invite_to_meal.eligible(sim.context(a, c)).reason === 'not_present',
     'someone in another place cannot be asked');
  sim.placeCharacter(c, 'cafe', { x: 6, y: 5 });

  ok(SM.ACTIONS.invite_to_meal.eligible(sim.context(a, b)).reason === 'already_meeting_them',
     'someone already promised a meeting with the asker is not asked to another');

  const closed = W.LOCATIONS.cafe.closes;
  W.LOCATIONS.cafe.closes = 700;   // shut before lunch
  const closedVerdict = SM.ACTIONS.invite_to_meal.eligible(sim.context(a, c));
  W.LOCATIONS.cafe.closes = closed;
  ok(closedVerdict.reason === 'cafe_closed', 'an invitation to a closed café is refused');

  const first = invite(sim, a, c, 660);
  ok(first !== undefined, 'at 11:00 a valid invitation is created');
  ok(SM.ACTIONS.invite_to_meal.eligible(sim.context(a, c)).reason === 'invitation_already_open',
     'a second invitation between the same two while one is open is refused in the invited direction');
  sim.placeCharacter(c, 'cafe', { x: 6, y: 5 });
  ok(SM.ACTIONS.invite_to_meal.eligible(sim.context(c, a)).reason === 'invitation_already_open',
     'a second invitation between the same two while one is open is refused in both directions');

  sim.placeCharacter(d, 'cafe', { x: 7, y: 5 });
  ok(SM.ACTIONS.invite_to_meal.eligible(sim.context(a, d)).reason === 'already_invited_someone_today',
     'one invitation per inviter per day: a second invitation the same day is refused');

  sim.state.day = 2;
  setMinute(sim, 660);
  placeAdjacent(sim, a, d);
  ok(SM.ACTIONS.invite_to_meal.eligible(sim.context(a, d)) === true,
     'the next day the same inviter may invite again');
}

/* ---------------- making the invitation ---------------- */

function makingTheInvitation() {
  console.log('# invite_to_meal: the object it creates, and what it tells');
  const sim = newSim();
  const a = sim.state.characters.resident_a, c = sim.state.characters.resident_c;
  const money = a.money, needs = JSON.stringify(a.needs);
  const inv = invite(sim, a, c, 660);

  ok(inv.id === 'meal_1_resident_a_resident_c_780', 'the id encodes the day, both people and the sitting');
  ok(inv.typeId === 'meal_invitation' && inv.name.indexOf('lunch') >= 0,
     'the invitation is a meal_invitation, named for the sitting');
  ok(inv.fromId === 'resident_a' && inv.toId === 'resident_c', 'it names who asked and who is asked');
  ok(inv.locationId === 'cafe' && inv.dueDay === 1 && inv.dueMin === 780,
     'it names the café and the sitting (lunch, 13:00)');
  ok(inv.expiresAbs === LT.Util.absolute(1, 780) - 45, 'it stops being answerable 45 minutes before the sitting');
  ok(inv.status === 'open' && inv.answeredAbs === null, 'it begins open and unanswered');
  ok(inv.location === null && inv.x === null && inv.y === null, 'it never lies anywhere');
  ok(inv.heldBy === 'resident_c', 'the invitee is carrying it');
  ok(inv.affordances.length === 0 &&
     inv.heldAffordances.indexOf('accept_meal') >= 0 && inv.heldAffordances.indexOf('decline_meal') >= 0,
     'it offers the two answerable actions while carried');
  ok(a.money === money && JSON.stringify(a.needs) === needs, 'inviting costs no money and no need');
  const ev = sim.state.events.filter((e) => e.type === 'MEAL_INVITED');
  ok(ev.length === 1 && ev[0].actorId === 'resident_a', 'exactly one MEAL_INVITED, by the asker');
  ok((c.memories || []).some((m) => m.type === 'MEAL_INVITED'), 'the invitee is told and remembers being asked');

  /* Asking dinner later the same day, from another place, is the next sitting. */
  const sim2 = newSim();
  const a2 = sim2.state.characters.resident_a, c2 = sim2.state.characters.resident_c;
  const din = invite(sim2, a2, c2, 900);   // 15:00
  ok(din !== undefined && din.dueMin === 1170, 'asked at 15:00, the invitation is for dinner (19:30)');
  ok(din.expiresAbs === LT.Util.absolute(1, 1170) - 45, 'and it expires 45 minutes before dinner');

  /* A question asked from across the room lands nothing. */
  const sim3 = newSim();
  const a3 = sim3.state.characters.resident_a, c3 = sim3.state.characters.resident_c;
  sim3.placeCharacter(a3, 'cafe', { x: 5, y: 5 });
  sim3.placeCharacter(c3, 'cafe', { x: 9, y: 5 });
  setMinute(sim3, 660);
  SM.ACTIONS.invite_to_meal.onComplete(sim3.context(a3, c3));
  ok(invitations(sim3).length === 0, 'an invitation driven from across the room creates nothing');

  /* Called twice, still one. */
  const before = invitations(sim).length;
  SM.ACTIONS.invite_to_meal.onComplete(sim.context(a, c));
  ok(invitations(sim).length === before, 'a second invite_to_meal callback settles nothing new');
}

/* ---------------- acceptance ---------------- */

function accepted() {
  console.log('# accept_meal: two commitments, both people, one answer');
  const sim = newSim();
  const a = sim.state.characters.resident_a, c = sim.state.characters.resident_c;
  const inv = invite(sim, a, c, 660);
  const relA = a.relationships.resident_c ? a.relationships.resident_c.closeness : 0;
  const relC = c.relationships.resident_a ? c.relationships.resident_a.closeness : 0;

  const legal = P.candidates(sim, c).legal.map((x) => x.actionId);
  ok(legal.indexOf('accept_meal') >= 0 && legal.indexOf('decline_meal') >= 0,
     'the invitee is offered accept and decline from the invitation they carry (heldAffordances)');
  const forAsker = P.candidates(sim, a).legal.map((x) => x.actionId);
  ok(forAsker.indexOf('accept_meal') < 0 && forAsker.indexOf('decline_meal') < 0,
     'nobody but the invitee is offered to answer it');

  ok(SM.ACTIONS.accept_meal.eligible(sim.context(c, null)) === true, 'while open and in time, accepting is legal');
  const meta = SM.ACTIONS.accept_meal.candidateMeta(sim.context(c, null));
  ok(meta.fromId === 'resident_a' && meta.fromName === a.name && meta.locationId === 'cafe' &&
     meta.dueDay === 1 && meta.dueMin === 780,
     'the candidate names the asker, the place and the hour');

  SM.ACTIONS.accept_meal.onComplete(sim.context(c, null));
  ok(inv.status === 'accepted' && inv.heldBy === null && inv.heldAffordances.length === 0 &&
     inv.answeredAbs === 660,
     'accepting settles the invitation: accepted, unheld, no longer answerable');
  const commits = mealCommitments(sim);
  ok(commits.length === 2, 'exactly two commitments appear on accept and none on decline');
  const ca = commits.filter((x) => x.who === 'resident_a')[0].c;
  const cc = commits.filter((x) => x.who === 'resident_c')[0].c;
  ok(ca && cc && ca.id === cc.id && ca.id === 'cmt_meal_' + inv.id,
     'the two commitments share one id, drawn from the invitation');
  ok(ca.kind === 'social' && ca.strength === 'soft' && ca.locationId === 'cafe' &&
     ca.dueDay === 1 && ca.dueMin === 780 && ca.graceMin === 30 && ca.status === 'open' &&
     cc.dueDay === ca.dueDay && cc.dueMin === ca.dueMin && cc.graceMin === ca.graceMin,
     'the two commitments are mirror images (withId swapped, same due)');
  ok(ca.withId === 'resident_c' && cc.withId === 'resident_a', 'and each names the other person');
  ok(ca.label !== cc.label && ca.label.indexOf('Sanne') >= 0 && cc.label.indexOf('Nadia') >= 0,
     'each is worded toward the other person');
  ok(a.relationships.resident_c.closeness > relA && c.relationships.resident_a.closeness > relC,
     'accepting warms both people toward each other a little');
  const ev = sim.state.events.filter((e) => e.type === 'MEAL_ACCEPTED');
  ok(ev.length === 1 && ev[0].actorId === 'resident_c', 'one MEAL_ACCEPTED, by the invitee');
  ok((a.memories || []).some((m) => m.type === 'MEAL_ACCEPTED'), 'the asker is told and remembers the answer');

  SM.ACTIONS.accept_meal.onComplete(sim.context(c, null));
  ok(mealCommitments(sim).length === 2 &&
     sim.state.events.filter((e) => e.type === 'MEAL_ACCEPTED').length === 1,
     'an invitation cannot be answered twice: a second accept adds nothing');
  ok(SM.ACTIONS.accept_meal.eligible(sim.context(c, null)).reason === 'no_invitation',
     'and an answered invitation is no longer offered');
}

function acceptExpiry() {
  console.log('# accept_meal: after the deadline it can no longer be answered');
  const sim = newSim();
  const a = sim.state.characters.resident_a, c = sim.state.characters.resident_c;
  const inv = invite(sim, a, c, 660);
  setAbs(sim, inv.expiresAbs + 1);
  ok(SM.ACTIONS.accept_meal.eligible(sim.context(c, null)).reason === 'invitation_expired',
     'accept after expiresAbs is refused');
  ok(SM.ACTIONS.decline_meal.eligible(sim.context(c, null)).reason === 'invitation_expired',
     'and so is declining after expiresAbs');
  SM.ACTIONS.accept_meal.onComplete(sim.context(c, null));
  ok(inv.status === 'open' && mealCommitments(sim).length === 0,
     'a late callback settles nothing: it stays open and unanswered');
}

/* ---------------- declining ---------------- */

function declined() {
  console.log('# decline_meal: declined, no commitment, and the asker feels it');
  const sim = newSim();
  const a = sim.state.characters.resident_a, c = sim.state.characters.resident_c;
  const inv = invite(sim, a, c, 660);
  const relA = a.relationships.resident_c ? a.relationships.resident_c.closeness : 25;
  const cSide = JSON.stringify(c.relationships);

  ok(SM.ACTIONS.decline_meal.eligible(sim.context(c, null)) === true, 'while open and in time, declining is legal');
  SM.ACTIONS.decline_meal.onComplete(sim.context(c, null));
  ok(inv.status === 'declined' && inv.heldBy === null && inv.heldAffordances.length === 0 &&
     inv.answeredAbs === 660,
     'declining settles the invitation: declined, unheld, no longer answerable');
  ok(mealCommitments(sim).length === 0, 'exactly two commitments appear on accept and none on decline');
  ok(a.relationships.resident_c.closeness === relA - 1 && JSON.stringify(c.relationships) === cSide,
     'only the asker feels the refusal, and only a little');
  const ev = sim.state.events.filter((e) => e.type === 'MEAL_DECLINED');
  ok(ev.length === 1 && ev[0].actorId === 'resident_c', 'one MEAL_DECLINED, by the invitee');
  ok((a.memories || []).some((m) => m.type === 'MEAL_DECLINED'), 'the asker is told and remembers the refusal');
  SM.ACTIONS.decline_meal.onComplete(sim.context(c, null));
  ok(sim.state.events.filter((e) => e.type === 'MEAL_DECLINED').length === 1 && mealCommitments(sim).length === 0,
     'an invitation cannot be answered twice: a second decline adds nothing');
}

/* ---------------- saved instances ---------------- */

function savedInstances() {
  console.log('# persistence: three states, three round trips, six refused corruptions');
  const sim = newSim();
  const a = sim.state.characters.resident_a, b = sim.state.characters.resident_b;
  const c = sim.state.characters.resident_c, d = sim.state.characters.resident_d;
  const e = sim.state.characters.resident_e;

  const open = invite(sim, a, c, 660);          // a asks c; left open
  const accepted = invite(sim, b, d, 660);      // b asks d; accepted
  SM.ACTIONS.accept_meal.onComplete(sim.context(d, null));
  const declined = invite(sim, e, a, 660);      // e asks a; declined
  SM.ACTIONS.decline_meal.onComplete(sim.context(a, null));

  const statuses = [open, accepted, declined].map((o) => o.status).sort();
  ok(statuses.join(',') === 'accepted,declined,open', 'all three states are represented');

  const env = saveEnv(sim);
  const restored = JSON.parse(JSON.stringify(sim.state));
  const of = (id) => restored.objects.filter((o) => o.id === id)[0];
  [open.id, accepted.id, declined.id].forEach((id) => {
    ok(C.validateObject(of(id), env) === null,
       'a ' + of(id).status + ' invitation survives JSON and validates');
  });
  ok(C.validateObject(of(open.id), env) === null && C.validateObject(of(declined.id), env) === null,
     'validate accepts all three states');

  /* Six named corruptions. */
  const corrupt = (base, patch) => Object.assign(JSON.parse(JSON.stringify(base)), patch);
  const named = (obj, phrase) => {
    const verdict = C.validateObject(obj, env);
    return typeof verdict === 'string' && verdict.indexOf(phrase) >= 0;
  };
  ok(named(corrupt(of(open.id), { fromId: 'ghost' }), 'names an inviter'),
     'corruption 1: an unknown inviter is refused by name');
  ok(named(corrupt(of(open.id), { toId: 'ghost' }), 'names an invitee'),
     'corruption 2: an unknown invitee is refused by name');
  ok(named(corrupt(of(open.id), { toId: open.fromId }), 'with themselves'),
     'corruption 3: an invitation to oneself is refused by name');
  ok(named(corrupt(of(open.id), { locationId: 'nowhere' }), 'that is not in the town'),
     'corruption 4: an unknown place is refused by name');
  ok(named(corrupt(of(open.id), { heldBy: null }), 'is open but not held by the invitee'),
     'corruption 5: an open invitation held by nobody is refused by name');
  ok(named(corrupt(of(accepted.id), { heldBy: accepted.toId }), 'still held by'),
     'corruption 6: an accepted invitation still held is refused by name');

  /* The real save layer carries an open invitation. */
  const text = LT.Save.toJSON(sim);
  const reloaded = LT.Save.fromJSON(text);
  const rw = reloaded.objectById(open.id);
  ok(rw && rw.status === 'open' && rw.heldBy === 'resident_c' && rw.expiresAbs === open.expiresAbs,
     'the real save layer carries an open invitation with its holder and its deadline');
}

function saveEnv(sim) {
  return {
    state: sim.state,
    reachable: function (locationId, spot) {
      const loc = W.LOCATIONS[locationId];
      return !!loc && LT.Sim.Sim.prototype.routeLength.call(null, loc, loc.spawn, spot) >= 0;
    }
  };
}

/* Two people who do nothing but wait, so a run is decided entirely by the
 * state and never by chance. */
let idleSeq = 0;
function idlePolicy() {
  const id = 'shared_meal_idle_' + (++idleSeq);
  LT.Policy.register({ id, decide: (request) => Promise.resolve(LT.Policy.selected(request, 'wait', id)) });
  return id;
}

async function saveEvolvesIdentically() {
  console.log('# the real save: a world with an open invitation carries on the same');
  const seed = 20260918;
  function build() {
    const sim = LT.Scenario.town({ seed: seed, intervention: false, everyday: false,
      policies: { resident_a: idlePolicy(), resident_b: idlePolicy(), resident_c: idlePolicy(),
                  resident_d: idlePolicy(), resident_e: idlePolicy() } });
    const a = sim.state.characters.resident_a, c = sim.state.characters.resident_c;
    placeAdjacent(sim, a, c);
    setMinute(sim, 660);
    SM.ACTIONS.invite_to_meal.onComplete(sim.context(a, c));
    return sim;
  }
  const original = build();
  const restored = LT.Save.deserialize(LT.Save.serialize(original));

  await original.runMinutes(120);
  await restored.runMinutes(120);

  ok(original.objectById('meal_1_resident_a_resident_c_780') !== null,
     'the original world still has the invitation after two hours');
  ok(JSON.stringify(original.state) === JSON.stringify(restored.state),
     'a save taken with an open invitation evolves identically to the sim that never stopped for 120 minutes');
}

/* ---------------- read-only safety ---------------- */

function readOnlyOperationsDoNotMutate() {
  console.log('# read-only queries never write to the authoritative state');
  const sim = newSim();
  const a = sim.state.characters.resident_a, c = sim.state.characters.resident_c;
  invite(sim, a, c, 660);
  const snapshot = JSON.stringify(sim.state);
  SM.ACTIONS.invite_to_meal.eligible(sim.context(a, c));
  SM.ACTIONS.invite_to_meal.candidateMeta(sim.context(a, c));
  SM.ACTIONS.accept_meal.eligible(sim.context(c, null));
  SM.ACTIONS.accept_meal.candidateMeta(sim.context(c, null));
  SM.ACTIONS.decline_meal.eligible(sim.context(c, null));
  C.visualOf(invitations(sim)[0], sim);
  P.observe(sim, c);
  ok(JSON.stringify(sim.state) === snapshot,
     'eligible / candidateMeta / visual / observe leave state byte-identical');
}

/* ---------------- scores ---------------- */

const h = (traits) => ({ trait: (k) => (traits[k] === undefined ? 0.5 : traits[k]), urgency: 1 });
function total(terms) { return Object.keys(terms).reduce((s, k) => s + terms[k], 0); }
function req(relationships, commitments) { return { relationships: relationships || {}, commitments: commitments || [] }; }

function scores() {
  console.log('# scores: suggested in the policy\'s own terms, never as rules');
  assert.throws(() => LT.UtilityPolicy.defineScore('accept_meal', function () {}), /already has a score/);
  ok(true, 'offerScores registered every action with UtilityPolicy exactly once');

  const far = total(SM.SCORES.invite_to_meal(req({ resident_c: { closeness: 10 } }), { targetId: 'resident_c' }, h({ sociability: 0.5 })));
  const near = total(SM.SCORES.invite_to_meal(req({ resident_c: { closeness: 90 } }), { targetId: 'resident_c' }, h({ sociability: 0.5 })));
  ok(near > far, 'invite_to_meal grows with closeness to the target');
  ok(total(SM.SCORES.invite_to_meal(req({}), { targetId: 'resident_c' }, h({ sociability: 0.1 }))) <= 0,
     'invite_to_meal is zero or negative toward a stranger');

  const lowClo = total(SM.SCORES.accept_meal(req({ resident_a: { closeness: 10, trust: 50 } }), { meta: { fromId: 'resident_a', dueDay: 1, dueMin: 780 } }, h({})));
  const highClo = total(SM.SCORES.accept_meal(req({ resident_a: { closeness: 90, trust: 50 } }), { meta: { fromId: 'resident_a', dueDay: 1, dueMin: 780 } }, h({})));
  ok(highClo > lowClo, 'accept_meal grows with closeness to the inviter');
  const lowTrust = total(SM.SCORES.accept_meal(req({ resident_a: { closeness: 50, trust: 10 } }), { meta: { fromId: 'resident_a', dueDay: 1, dueMin: 780 } }, h({})));
  const highTrust = total(SM.SCORES.accept_meal(req({ resident_a: { closeness: 50, trust: 90 } }), { meta: { fromId: 'resident_a', dueDay: 1, dueMin: 780 } }, h({})));
  ok(highTrust > lowTrust, 'accept_meal grows with trust');

  const clashCommit = [{ status: 'open', dueDay: 1, dueMin: 780 }];
  const noClash = total(SM.SCORES.accept_meal(req({ resident_a: { closeness: 60, trust: 60 } }), { meta: { fromId: 'resident_a', dueDay: 1, dueMin: 780 } }, h({})));
  const withClash = total(SM.SCORES.accept_meal(req({ resident_a: { closeness: 60, trust: 60 } }, clashCommit), { meta: { fromId: 'resident_a', dueDay: 1, dueMin: 780 } }, h({})));
  ok(withClash < noClash, 'accept_meal shrinks when an open promise sits within ninety minutes of the sitting');

  const declineCalm = total(SM.SCORES.decline_meal(req({ resident_a: { closeness: 90 } }), { meta: { fromId: 'resident_a', dueDay: 1, dueMin: 780 } }, h({})));
  const declineClash = total(SM.SCORES.decline_meal(req({ resident_a: { closeness: 90 } }, clashCommit), { meta: { fromId: 'resident_a', dueDay: 1, dueMin: 780 } }, h({})));
  ok(declineClash > declineCalm, 'decline_meal grows with that same clash');
  const declineClose = total(SM.SCORES.decline_meal(req({ resident_a: { closeness: 90 } }), { meta: { fromId: 'resident_a', dueDay: 1, dueMin: 780 } }, h({})));
  const declineCold = total(SM.SCORES.decline_meal(req({ resident_a: { closeness: 5 } }), { meta: { fromId: 'resident_a', dueDay: 1, dueMin: 780 } }, h({})));
  ok(declineCold > declineClose, 'decline_meal grows as closeness falls');
}

async function main() {
  packageShape();
  visual();
  eligibility();
  makingTheInvitation();
  accepted();
  acceptExpiry();
  declined();
  savedInstances();
  await saveEvolvesIdentically();
  readOnlyOperationsDoNotMutate();
  scores();
  console.log('\nshared-meal: ' + checks + '/' + checks);
}

main().catch((e) => { console.error(e); process.exit(1); });
