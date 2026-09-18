/* interventions.js — Living Town: typed changes to circumstance.
 * An intervention changes what is true; it never scripts what a character
 * does about it. These checks hold that line: validation at scheduling time,
 * an apply that only fires once at its own minute, an offer that is invisible
 * until actually perceived, both possible responses reachable unscripted, and
 * an unanswered offer that lapses on its own.
 * node living-town/test/interventions.js
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

function baseParams(overrides) {
  return Object.assign({ toId: 'resident_a', locationId: 'cafe', startMin: 600, endMin: 700, pay: 20, expiresMin: 650 }, overrides || {});
}

function validation() {
  console.log('# interventions: validation');
  const sim = LT.Scenario.day1({ intervention: false });

  ok(sim.scheduleIntervention({ type: 'does_not_exist', params: {} }).error === 'unknown_intervention_type',
    'an unknown intervention type is rejected as unknown_intervention_type');
  ok(sim.scheduleIntervention({ type: 'offer_extra_work', params: baseParams({ toId: 'ghost' }) }).error === 'unknown_character',
    'an unknown character is rejected as unknown_character');
  ok(sim.scheduleIntervention({ type: 'offer_extra_work', params: baseParams({ startMin: 100, endMin: 200, expiresMin: 150 }) }).error === 'outside_opening_hours',
    "a window outside the café's opening hours is rejected as outside_opening_hours");
  ok(sim.scheduleIntervention({ type: 'offer_extra_work', params: baseParams({ pay: 0 }) }).error === 'invalid_pay',
    'non-positive pay is rejected as invalid_pay');
  ok(sim.scheduleIntervention({ type: 'offer_extra_work', params: baseParams({ startMin: 600, endMin: 600 }) }).error === 'empty_window',
    'an empty window is rejected as empty_window');
}

function schedulingIsNotApplying() {
  console.log('# interventions: scheduling records status=scheduled and does not apply early');
  const sim = LT.Scenario.day1({ intervention: false });
  const result = sim.scheduleIntervention({ type: 'offer_extra_work', atDay: 1, atMinute: 1000, params: baseParams() });
  ok(result.ok === true, 'a valid intervention is accepted');
  ok(result.record.status === 'scheduled', 'the record starts as status=scheduled');
  ok(sim.state.events.some((e) => e.type === 'INTERVENTION_SCHEDULED' && e.data.interventionId === result.record.id),
    'an INTERVENTION_SCHEDULED event is emitted');
  ok(sim.state.day === 1 && sim.state.minute === 360, 'the clock has not moved: nothing has been applied yet');
  ok(sim.state.offers.length === 0, 'no offer exists before the scheduled minute arrives');
}

async function applicationFiresOnce() {
  console.log('# interventions: application fires exactly at its scheduled minute');
  const sim = LT.Scenario.day1({ intervention: false });
  const result = sim.scheduleIntervention({ type: 'offer_extra_work', atDay: 1, atMinute: 400, params: baseParams() });

  await sim.runUntil(1, 399);
  ok(sim.scheduledInterventions[0].status === 'scheduled', 'still unapplied one minute before its time');
  ok(sim.state.offers.length === 0, 'still no offer one minute before its time');

  await sim.runUntil(1, 400);
  ok(sim.scheduledInterventions[0].status === 'applied', 'status becomes applied at its scheduled minute');
  ok(sim.state.events.some((e) => e.type === 'INTERVENTION_APPLIED' && e.data.interventionId === result.record.id),
    'an INTERVENTION_APPLIED event fires');
  ok(sim.state.offers.length === 1, 'exactly one offer is created');
}

async function perceptionGating() {
  console.log('# interventions: the offer is invisible until actually perceived');
  const sim = LT.Scenario.day1({ intervention: false, policies: { resident_a: 'itv-perception', resident_b: 'utility' } });
  const mock = LT.MockPolicy.create({ id: 'itv-perception', script: [] });
  for (let i = 0; i < 20; i++) mock.pushScript({ prefer: 'wait' });
  const residentA = sim.state.characters.resident_a;
  sim.scheduleIntervention({ type: 'offer_extra_work', atDay: 1, atMinute: 361, params: baseParams() });

  await sim.runMinutes(5); // resident_a is still at flat_a; the offer was posted at the café
  ok(sim.offersFor(residentA).length === 0, 'offersFor(resident_a) is empty while it has not perceived the offer');
  ok(!LT.Perception.candidates(sim, residentA).legal.some((c) => c.actionId === 'accept_offer'), 'accept_offer is not a candidate yet');

  sim.placeCharacter(residentA, 'cafe');
  await sim.runMinutes(2);
  const received = sim.state.events.filter((e) => e.type === 'OFFER_RECEIVED' && e.actorId === 'resident_a');
  ok(received.length === 1, 'OFFER_RECEIVED fires exactly once, once resident_a is actually at the café');
  ok(sim.offersFor(residentA).length === 1, 'offersFor(resident_a) now sees it');
}

async function outcomeUnscripted() {
  console.log('# interventions: the intervention does not script the response');
  async function outcomeFor(preference) {
    const id = freshId('itv-outcome');
    const sim = LT.Scenario.day1({ intervention: false, policies: { resident_a: id, resident_b: 'utility' } });
    const mock = LT.MockPolicy.create({ id: id, script: [] });
    for (let i = 0; i < 40; i++) mock.pushScript({ prefer: preference });
    sim.scheduleIntervention({ type: 'offer_extra_work', atDay: 1, atMinute: 361, params: baseParams() });
    sim.placeCharacter(sim.state.characters.resident_a, 'cafe');
    await sim.runMinutes(30);
    return sim.state.offers[0].status;
  }
  ok(await outcomeFor('decline_offer') === 'declined', 'a policy that always declines ends the offer declined');
  ok(await outcomeFor('accept_offer') === 'accepted', 'a policy that always accepts ends the offer accepted, same intervention, no scripting');
}

async function expiry() {
  console.log('# interventions: an unanswered offer expires on its own');
  const id = freshId('itv-expiry');
  const sim = LT.Scenario.day1({ intervention: false, policies: { resident_a: id, resident_b: 'utility' } });
  const mock = LT.MockPolicy.create({ id: id, script: [] });
  for (let i = 0; i < 40; i++) mock.pushScript({ prefer: 'wait' }); // never touches the offer
  const residentA = sim.state.characters.resident_a;
  sim.scheduleIntervention({ type: 'offer_extra_work', atDay: 1, atMinute: 361, params: baseParams({ expiresMin: 365 }) });
  sim.placeCharacter(residentA, 'cafe');

  await sim.runMinutes(30);
  ok(sim.state.offers[0].status === 'expired', 'the offer expires at its expiry minute');
  ok(sim.state.events.some((e) => e.type === 'OFFER_EXPIRED'), 'an OFFER_EXPIRED event is emitted');
  ok(!LT.Perception.candidates(sim, residentA).legal.some((c) => c.actionId === 'accept_offer'), 'accept_offer is no longer a candidate once expired');
}

async function main() {
  validation();
  schedulingIsNotApplying();
  await applicationFiresOnce();
  await perceptionGating();
  await outcomeUnscripted();
  await expiry();
  console.log('\ninterventions: ' + checks + '/' + checks);
}

main().catch((e) => { console.error(e); process.exit(1); });
