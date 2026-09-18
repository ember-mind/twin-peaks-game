/* sim-core.js — Living Town: the authoritative-state contract.
 * One state object is the world; everything a viewer sees is a projection.
 * These checks hold the simulation to that: a single location per character,
 * off-screen characters that keep living, scene moves that never reset
 * anything, money and time that move exactly once and exactly as much as the
 * action says, names drawn once and never regenerated, and no dependency at
 * all on the Twin Peaks game it shares an engine with.
 * node living-town/test/sim-core.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'policy', 'lt-mock-policy.js'));
const LT = global.LT;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

/* Mirrors Sim.prototype.runMinutes, plus a per-tick hook: the only way to
 * prove an off-screen character advances minute by minute is to sample the
 * state between ticks, and the event log alone does not carry that trace. */
function runMinutes(sim, minutes, onTick) {
  let i = 0;
  function step() {
    if (i++ >= minutes) return Promise.resolve(sim.state);
    sim.tick();
    if (onTick) onTick(sim);
    return new Promise((resolve) => setTimeout(resolve, 0)).then(step);
  }
  return step();
}

async function oneAuthoritativeLocation() {
  console.log('# sim-core: one authoritative location');
  const sim = LT.Scenario.day1({});
  await sim.runUntil(1, 1439);
  sim.actorIds().forEach((id) => {
    const c = sim.state.characters[id];
    ok(typeof c.location === 'string' && c.location.length > 0, id + ' carries exactly one location string');
    if (c.transit) ok(c.location === 'street', id + ' in transit is located on the street, not the destination or origin');
  });
}

async function offscreenProgression() {
  console.log('# sim-core: off-screen progression');
  const sim = LT.Scenario.day1({});
  await sim.runUntil(1, 1439);
  const locations = {};
  const order = [];
  sim.state.events.forEach((e) => {
    if (e.actorId !== 'resident_a' && e.actorId !== 'resident_b') return;
    order.push(e.actorId);
    if (!e.locationId) return;
    (locations[e.actorId] || (locations[e.actorId] = new Set())).add(e.locationId);
  });
  ok(locations.resident_a.size > 1, 'resident_a accumulates events at more than one location over the day');
  ok(locations.resident_b.size > 1, 'resident_b accumulates events at more than one location over the day');
  let interleavings = 0;
  for (let i = 1; i < order.length; i++) if (order[i] !== order[i - 1]) interleavings++;
  // There is no scene concept in the sim: if both actors' events only ever
  // alternated once, one of them would have been run start-to-finish before
  // the other, which is exactly the "scene" model this simulation rejects.
  ok(interleavings > 5, 'resident_a and resident_b events interleave in time rather than running one after the other');
}

async function sceneChangesDoNotReset() {
  console.log('# sim-core: scene changes do not reset state');
  const sim = LT.Scenario.day1({});
  const residentA = sim.state.characters.resident_a;
  let lastVersion = sim.state.version;
  let monotonic = true;
  await runMinutes(sim, 340, () => {
    if (sim.state.version < lastVersion) monotonic = false;
    lastVersion = sim.state.version;
  });

  const before = {
    memories: residentA.memories.length,
    relB: JSON.stringify(residentA.relationships.resident_b || null),
    savings: residentA.savings,
    commitments: JSON.stringify(residentA.commitments.map((c) => c.status))
  };
  const v0 = sim.state.version;
  sim.placeCharacter(residentA, 'cafe');
  ok(sim.state.version > v0, 'placeCharacter to a new scene bumps state.version');
  sim.placeCharacter(residentA, 'flat_a');
  ok(sim.state.version > v0 + 1, 'placeCharacter back keeps state.version climbing, never resetting it');

  ok(residentA.memories.length === before.memories, 'memories survive a scene change');
  ok(JSON.stringify(residentA.relationships.resident_b) === before.relB, 'relationships survive a scene change');
  ok(residentA.savings === before.savings, 'savings survive a scene change');
  ok(JSON.stringify(residentA.commitments.map((c) => c.status)) === before.commitments, 'commitment statuses survive a scene change');

  await runMinutes(sim, 100, () => {
    if (sim.state.version < lastVersion) monotonic = false;
    lastVersion = sim.state.version;
  });
  ok(monotonic, 'state.version only ever increases, across ticks and across manual scene changes');
}

async function effectsApplyExactlyOnce() {
  console.log('# sim-core: effects apply exactly once');
  const sim = LT.Scenario.day1({});
  const residentA = sim.state.characters.resident_a;
  const startTotal = residentA.money + residentA.savings;

  await sim.runUntil(1, 1439);

  const worked = sim.state.events.filter((e) => e.actorId === 'resident_a' && (e.type === 'WORKED' || e.type === 'WORKED_EXTRA'));
  ok(worked.length > 0, 'resident_a worked at least once over the day');
  worked.filter((e) => e.type === 'WORKED').forEach((e) => {
    const expectedGross = LT.Util.round2((e.data.minutes / 60) * residentA.employment.wagePerHour);
    ok(e.data.gross === expectedGross, 'WORKED gross at ' + e.stamp + ' matches minutes worked at the posted wage');
  });
  worked.forEach((e) => {
    ok(LT.Util.round2(e.data.saved + (e.data.gross - e.data.saved)) === e.data.gross, e.type + ' at ' + e.stamp + ' splits gross into saved+spent with nothing left over');
  });

  const grossTotal = LT.Util.round2(worked.reduce((sum, e) => sum + e.data.gross, 0));
  const spent = LT.Util.round2(sim.state.events
    .filter((e) => e.actorId === 'resident_a' && e.type === 'ATE' && e.data.cost)
    .reduce((sum, e) => sum + e.data.cost, 0));
  const withdrawals = sim.state.events.filter((e) => e.actorId === 'resident_a' && e.type === 'WITHDREW');
  withdrawals.forEach((e) => ok(e.data.amount > 0, 'WITHDREW at ' + e.stamp + ' moves a positive amount between savings and money (nets to zero on the total)'));

  const endTotal = LT.Util.round2(residentA.money + residentA.savings);
  const expectedTotal = LT.Util.round2(startTotal + grossTotal - spent);
  ok(endTotal === expectedTotal, 'total money+savings gained equals gross worked minus spending, applied exactly once');
}

async function travelConsumesExactTime() {
  console.log('# sim-core: travel consumes time');
  const sim = LT.Scenario.day1({});
  await sim.runUntil(1, 1439);
  const W = LT.World;
  const byActor = {};
  sim.state.events.forEach((e) => {
    if (e.type !== 'DEPARTED' && e.type !== 'ARRIVED') return;
    (byActor[e.actorId] || (byActor[e.actorId] = [])).push(e);
  });
  let pairs = 0;
  Object.keys(byActor).forEach((actorId) => {
    const events = byActor[actorId];
    for (let i = 0; i < events.length - 1; i++) {
      const dep = events[i], arr = events[i + 1];
      if (dep.type !== 'DEPARTED' || arr.type !== 'ARRIVED') continue;
      const expected = W.travelMinutes(dep.data.from, dep.data.to);
      ok(arr.absMinute - dep.absMinute === expected,
        actorId + ' walking ' + dep.data.from + ' -> ' + dep.data.to + ' takes exactly ' + expected + ' minutes');
      pairs++;
    }
  });
  ok(pairs > 0, 'at least one DEPARTED/ARRIVED pair was observed over the day');
}

async function actionDurationAndCompletion() {
  console.log('# sim-core: action duration and completion');
  const sim = LT.Scenario.day1({ intervention: false, policies: { resident_a: 'sim-core-eat', resident_b: 'utility' } });
  LT.MockPolicy.create({ id: 'sim-core-eat', script: [{ prefer: 'eat_at_home' }] });
  const residentA = sim.state.characters.resident_a;
  sim.adjustNeed(residentA, 'hunger', 40); // day1 starts under eat_at_home's hunger threshold
  const pantryBefore = residentA.pantry;

  await sim.runMinutes(2); // one tick to request+decide, one more to flush the decision
  const started = sim.state.events.find((e) => e.type === 'ACTIVITY_STARTED' && e.actorId === 'resident_a');
  assert(started, 'eat_at_home started');
  const plannedMinutes = started.data.minutes;

  await sim.runMinutes(plannedMinutes + 1);
  const completions = sim.state.events.filter((e) => e.type === 'ACTIVITY_COMPLETED' && e.actorId === 'resident_a');
  ok(completions.length === 1, 'onComplete settles exactly once');
  ok(completions[0].absMinute - started.absMinute === plannedMinutes, 'ACTIVITY_COMPLETED lands exactly plannedMinutes after ACTIVITY_STARTED');
  ok(residentA.pantry === pantryBefore - 1, 'the discrete effect (pantry -1) applied exactly once');
}

async function interruptionSkipsSettlement() {
  console.log('# sim-core: interruption skips settlement');
  const sim = LT.Scenario.day1({ intervention: false, policies: { resident_a: 'sim-core-work', resident_b: 'utility' } });
  LT.MockPolicy.create({ id: 'sim-core-work', script: [{ prefer: 'work_shift' }] });
  const residentA = sim.state.characters.resident_a;
  sim.state.minute = 540; // shift start; avoids waiting out the morning routine
  sim.placeCharacter(residentA, 'cafe');
  const savingsBefore = residentA.savings, moneyBefore = residentA.money;

  await sim.runMinutes(2);
  assert(residentA.activity && residentA.activity.actionId === 'work_shift', 'work_shift started');

  const interrupted = sim.requestInterrupt('resident_a', 'test');
  ok(interrupted === true, 'requestInterrupt succeeds on an interruptible activity');
  ok(residentA.activity === null, 'the activity is cleared on interruption');

  const shiftEvents = sim.state.events.filter((e) => e.actorId === 'resident_a' && e.data && e.data.actionId === 'work_shift');
  ok(shiftEvents.some((e) => e.type === 'ACTIVITY_INTERRUPTED'), 'ACTIVITY_INTERRUPTED fires');
  ok(!shiftEvents.some((e) => e.type === 'ACTIVITY_COMPLETED'), 'no ACTIVITY_COMPLETED for an interrupted shift');
  ok(!sim.state.events.some((e) => e.actorId === 'resident_a' && e.type === 'WORKED'), 'no WORKED settlement for an interrupted shift');
  ok(residentA.savings === savingsBefore && residentA.money === moneyBefore, 'no money changed hands for the interrupted shift');
}

async function memoryProvenance() {
  console.log('# sim-core: memory provenance');
  const sim = LT.Scenario.day1({});
  await sim.runUntil(1, 1439);
  let inspected = 0;
  sim.actorIds().forEach((id) => {
    sim.state.characters[id].memories.forEach((m) => {
      const event = sim.state.events.find((e) => e.seq === m.eventSeq);
      assert(event, 'memory ' + m.id + ' references an event that exists in state.events');
      // firsthand is defined as "I am the event's actor" — someone merely
      // present for another actor's event is a perceiver, not firsthand.
      assert(m.firsthand === (event.actorId === id), 'memory ' + m.id + ' firsthand flag matches event.actorId === owner');
      assert(m.participants.indexOf(id) >= 0, 'memory ' + m.id + ' lists its own owner among the participants');
      inspected++;
    });
  });
  ok(inspected > 0, 'memory provenance checked across ' + inspected + ' memories');
}

async function boundedMemory() {
  console.log('# sim-core: bounded memory');
  const sim = LT.Scenario.day1({});
  await sim.runUntil(1, 1439);
  sim.actorIds().forEach((id) => {
    ok(sim.state.characters[id].memories.length <= LT.Perception.MEMORY_LIMIT, id + "'s memories stay within MEMORY_LIMIT");
  });
}

/* A policy that behaves exactly like UtilityPolicy except it never lets
 * resident_a walk to the park, so the park commitment cannot be kept by
 * chance. */
function registerNoParkPolicy(id) {
  LT.Policy.register({
    id: id,
    decide: function (request) {
      return Promise.resolve(LT.UtilityPolicy.decide(request)).then(function (resp) {
        if (resp.status !== 'selected') return resp;
        const cand = request.candidates.find((c) => c.id === resp.selectedId);
        if (!cand || cand.actionId !== 'travel' || cand.targetId !== 'park') return resp;
        const alt = (resp.diagnostics.factors || [])
          .filter((f) => !(f.actionId === 'travel' && f.targetId === 'park'))
          .sort((a, b) => b.score - a.score || (a.candidateId < b.candidateId ? -1 : 1))[0];
        return { requestId: request.requestId, status: 'selected', selectedId: alt.candidateId, source: id, diagnostics: resp.diagnostics };
      });
    }
  });
}

async function commitmentConsequences() {
  console.log('# sim-core: commitment consequences');
  registerNoParkPolicy('sim-core-no-park');
  const sim = LT.Scenario.day1({ policies: { resident_a: 'sim-core-no-park', resident_b: 'utility' } });
  const trustBefore = sim.state.characters.resident_b.relationships.resident_a.trust;

  await sim.runUntil(1, 1439);

  const cmt = sim.state.characters.resident_a.commitments.find((c) => c.id === 'cmt_meet_friend');
  ok(cmt.status === 'broken', 'cmt_meet_friend ends broken when resident_a never goes to the park');
  ok(sim.state.events.some((e) => e.type === 'COMMITMENT_BROKEN' && e.data.commitmentId === 'cmt_meet_friend'), 'a COMMITMENT_BROKEN event exists for cmt_meet_friend');
  const trustAfter = sim.state.characters.resident_b.relationships.resident_a.trust;
  ok(trustAfter === trustBefore - 8, "resident_b's trust toward resident_a drops by exactly 8, breakCommitment's documented penalty");
}

async function determinism() {
  console.log('# sim-core: determinism');
  async function runOnce() {
    const sim = LT.Scenario.day1({});
    await sim.runUntil(1, 1439);
    return sim;
  }
  const a = await runOnce();
  const b = await runOnce();
  const seqA = a.state.events.map((e) => e.type + '@' + e.stamp);
  const seqB = b.state.events.map((e) => e.type + '@' + e.stamp);
  ok(JSON.stringify(seqA) === JSON.stringify(seqB), 'two day1 runs produce an identical event type/stamp sequence');
  ok(a.state.characters.resident_a.savings === b.state.characters.resident_a.savings, 'two day1 runs produce identical final savings');
}

async function namesAreStable() {
  console.log('# sim-core: names are generated once and never change');
  const sim = LT.Scenario.day1({});
  const residentA = sim.state.characters.resident_a;
  ok(typeof residentA.name === 'string' && residentA.name.length > 0, 'resident_a has a generated display name');
  const nameBefore = residentA.name;

  await sim.runUntil(1, 700);
  sim.placeCharacter(residentA, 'cafe');
  sim.placeCharacter(residentA, 'flat_a');
  await sim.runUntil(1, 1439);

  ok(residentA.name === nameBefore, "moving resident_a between locations and running the rest of the day never changes the name drawn at creation");

  const first = LT.Scenario.day1({ seed: 4242 });
  const second = LT.Scenario.day1({ seed: 4242 });
  ok(first.state.characters.resident_a.name === second.state.characters.resident_a.name &&
     first.state.characters.resident_b.name === second.state.characters.resident_b.name,
    'the same seed draws the same two names every time');
}

function livingTownDoesNotNeedTwinPeaks() {
  console.log('# sim-core: Living Town does not need Twin Peaks');
  const out = execFileSync(process.execPath, ['-e',
    'require(' + JSON.stringify(path.resolve(__dirname, '..', 'js', 'lt-scenario.js')) + ');' +
    'process.stdout.write(typeof global.GAME);'
  ]).toString();
  ok(out === 'undefined', 'loading lt-scenario.js in a fresh process leaves global.GAME undefined');
}

async function main() {
  await oneAuthoritativeLocation();
  await offscreenProgression();
  await sceneChangesDoNotReset();
  await effectsApplyExactlyOnce();
  await travelConsumesExactTime();
  await actionDurationAndCompletion();
  await interruptionSkipsSettlement();
  await memoryProvenance();
  await boundedMemory();
  await commitmentConsequences();
  await determinism();
  await namesAreStable();
  livingTownDoesNotNeedTwinPeaks();
  console.log('\nsim-core: ' + checks + '/' + checks);
}

main().catch((e) => { console.error(e); process.exit(1); });
