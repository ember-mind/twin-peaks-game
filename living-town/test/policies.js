/* policies.js — Living Town: the decision-policy boundary and its offline implementation.
 * A policy only ever answers with a candidate it was offered; the sim checks
 * the shape, UtilityPolicy is the arithmetic worth trusting for now, and a
 * recording lets that arithmetic be replayed without calling it again.
 * node living-town/test/policies.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');

require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'policy', 'lt-recorded-policy.js'));
const LT = global.LT;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

function validateResponseContract() {
  console.log('# policies: LT.Policy.validateResponse contract');
  const request = { requestId: 'req_1', candidates: [{ id: 'wait' }] };
  ok(LT.Policy.validateResponse(request, { requestId: 'req_1', status: 'selected', selectedId: 'wait' }).ok === true,
    'accepts a well-formed response');
  ok(LT.Policy.validateResponse(request, { requestId: 'req_2', status: 'selected', selectedId: 'wait' }).error === 'request_id_mismatch',
    'rejects a mismatched requestId');
  ok(LT.Policy.validateResponse(request, { requestId: 'req_1', status: 'selected' }).error === 'missing_selection',
    'rejects a response with no selectedId');
  ok(LT.Policy.validateResponse(request, { requestId: 'req_1', status: 'sideways' }).error === 'unknown_status',
    'rejects an unrecognised status');
  ok(LT.Policy.validateResponse(request, { requestId: 'req_1', status: 'selected', selectedId: 'nope' }).error === 'selection_not_offered',
    'rejects a selectedId absent from request.candidates');
}

async function utilityOnlySelectsOfferedCandidates() {
  console.log('# policies: UtilityPolicy only ever selects an offered candidate');
  const sim = LT.Scenario.day1({});
  await sim.runUntil(1, 1439);
  const decided = Object.values(sim.requests).filter((r) => r.response && r.response.status === 'selected');
  ok(decided.length > 0, 'the day produced selected decisions to check');
  decided.forEach((r) => {
    const offered = r.request.candidates.some((c) => c.id === r.response.selectedId);
    assert(offered, r.response.selectedId + ' was not among the candidates offered for ' + r.request.requestId);
  });
  ok(true, 'every recorded selectedId across ' + decided.length + ' decisions was in that request\'s candidate list');
}

async function utilityExposesStructuredFactors() {
  console.log('# policies: UtilityPolicy exposes structured, numeric factors');
  const sim = LT.Scenario.day1({});
  await sim.runUntil(1, 1439);
  const decided = Object.values(sim.requests).filter((r) => r.response && r.response.status === 'selected');
  let factorsChecked = 0;
  decided.forEach((r) => {
    const factors = r.response.diagnostics.factors;
    assert.equal(factors.length, r.request.candidates.length, 'one factor entry per candidate for ' + r.request.requestId);
    factors.forEach((f) => {
      assert(typeof f.score === 'number' && !Number.isNaN(f.score), 'factor score is numeric for ' + f.candidateId);
      assert(f.terms && typeof f.terms === 'object', 'factor terms is an object for ' + f.candidateId);
      Object.keys(f.terms).forEach((k) => {
        assert(typeof f.terms[k] === 'number' && !Number.isNaN(f.terms[k]), 'term ' + k + ' on ' + f.candidateId + ' is numeric, not NaN/undefined');
      });
      factorsChecked++;
    });
  });
  ok(factorsChecked > 0, 'no NaN/undefined found across ' + factorsChecked + ' factor entries');
}

async function utilityIsDeterministic() {
  console.log('# policies: UtilityPolicy is deterministic');
  const sim = LT.Scenario.day1({});
  await sim.runUntil(1, 700);
  const req = Object.values(sim.requests).map((r) => r.request).pop();

  const a = await LT.UtilityPolicy.decide(req);
  const b = await LT.UtilityPolicy.decide(req);
  ok(a.selectedId === b.selectedId, 'scoring the same request twice selects the same candidate');
  ok(JSON.stringify(a.diagnostics.factors) === JSON.stringify(b.diagnostics.factors), 'scoring the same request twice produces identical factors');

  // A synthetic tie: two otherwise-identical 'wait' candidates, id order
  // reversed, must resolve to the lexicographically smaller id.
  const tieReq = {
    requestId: 'req_tie', seq: 1, actorId: 'resident_a', day: 1, minute: 400, absMinute: 400,
    self: { id: 'resident_a', location: 'flat_a', homeId: 'flat_a', needs: { energy: 80, hunger: 30 }, money: 20, savings: 0, pantry: 1, traits: {}, employment: null, standing: {} },
    observations: { offers: [] }, memories: [], goals: [], commitments: [], relationships: {},
    candidates: [{ id: 'wait_b', actionId: 'wait', durationMinutes: 10 }, { id: 'wait_a', actionId: 'wait', durationMinutes: 10 }]
  };
  const tie = await LT.UtilityPolicy.decide(tieReq);
  ok(tie.selectedId === 'wait_a', 'a tied score breaks on candidate id, never on a random draw');
}

async function utilityIsCompetent() {
  console.log('# policies: UtilityPolicy is behaviourally competent in day1');
  const sim = LT.Scenario.day1({});

  function runMinutes(minutes, onTick) {
    let i = 0;
    function step() {
      if (i++ >= minutes) return Promise.resolve(sim.state);
      sim.tick();
      if (onTick) onTick();
      return new Promise((resolve) => setTimeout(resolve, 0)).then(step);
    }
    return step();
  }

  let cafeMinutesDuringShift = 0;
  await runMinutes(1439 - 360, () => {
    if (sim.state.minute >= 540 && sim.state.minute < 1020 && sim.state.characters.resident_a.location === 'cafe') cafeMinutesDuringShift++;
  });

  ok(cafeMinutesDuringShift >= 300, 'resident_a is at the café for at least 300 of its 09:00-17:00 shift minutes (' + cafeMinutesDuringShift + ')');
  ok(sim.state.characters.resident_a.location === 'flat_a', 'resident_a ends the day home, at flat_a');
  const cmtShift = sim.state.characters.resident_a.commitments.find((c) => c.id === 'cmt_shift');
  ok(cmtShift.status === 'kept', 'resident_a ends the day with cmt_shift kept');
}

async function recordedPolicyRoundTrip() {
  console.log('# policies: RecordedPolicy round trip replays the same run');
  const sim1 = LT.Sim.create({ seed: 20260918, policies: { resident_a: 'policies-recorder', resident_b: 'utility' } });
  sim1.scheduleIntervention(LT.Scenario.EXTRA_SHIFT);
  const recorder = LT.RecordedPolicy.record(LT.UtilityPolicy, { id: 'policies-recorder' });
  await sim1.runUntil(1, 1439);
  const recording = recorder.toJSON();

  const player = LT.RecordedPolicy.replay(recording, { id: 'policies-player' });
  const sim2 = LT.Sim.create({ seed: 20260918, policies: { resident_a: 'policies-player', resident_b: 'utility' } });
  sim2.scheduleIntervention(LT.Scenario.EXTRA_SHIFT);
  await sim2.runUntil(1, 1439);

  const actionsOf = (sim) => sim.state.events.filter((e) => e.type === 'ACTIVITY_STARTED' && e.actorId === 'resident_a').map((e) => e.data.actionId);
  ok(JSON.stringify(actionsOf(sim1)) === JSON.stringify(actionsOf(sim2)), 'replay executes the identical sequence of resident_a\'s action ids');
  ok(sim1.state.characters.resident_a.savings === sim2.state.characters.resident_a.savings, 'replay produces the identical final savings');
  ok(player.mismatches.length === 0, 'replay reports zero mismatches against the run it was recorded from');
}

async function recordedPolicyRefusesToImprovise() {
  console.log('# policies: RecordedPolicy refuses to improvise on divergence');
  const sim1 = LT.Sim.create({ seed: 20260918, policies: { resident_a: 'policies-recorder-2', resident_b: 'utility' } });
  sim1.scheduleIntervention(LT.Scenario.EXTRA_SHIFT);
  const recorder = LT.RecordedPolicy.record(LT.UtilityPolicy, { id: 'policies-recorder-2' });
  await sim1.runUntil(1, 1439);
  const recording = recorder.toJSON();

  // Same seed, but the recording was made WITH the extra-shift intervention
  // and this replay run has none: the offer never appears, so resident_a's
  // perceived world (and relevanceKey) diverges from what was recorded.
  const player = LT.RecordedPolicy.replay(recording, { id: 'policies-player-2' });
  const sim2 = LT.Sim.create({ seed: 20260918, policies: { resident_a: 'policies-player-2', resident_b: 'utility' } });
  await sim2.runUntil(1, 1439);

  ok(player.mismatches.length > 0, 'replay against a diverged sim reports mismatches instead of silently continuing');
  // The refusal is filed under the stable code every policy failure uses; the
  // specific cause travels in detail, so a reader can tell a divergence from a
  // malformed answer without parsing a reason string.
  ok(sim2.rejections.some((r) => r.reason === 'policy_error' && String(r.detail).indexOf('replay_divergence') === 0),
     'the diverged decisions surface as policy_error rejections carrying replay_divergence detail');
}

async function main() {
  validateResponseContract();
  await utilityOnlySelectsOfferedCandidates();
  await utilityExposesStructuredFactors();
  await utilityIsDeterministic();
  await utilityIsCompetent();
  await recordedPolicyRoundTrip();
  await recordedPolicyRefusesToImprovise();
  console.log('\npolicies: ' + checks + '/' + checks);
}

main().catch((e) => { console.error(e); process.exit(1); });
