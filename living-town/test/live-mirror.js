/* live-mirror.js — Living Town: a browser's town is the host's town.
 * The host runs one simulation; a mirror is built from its save and fed only
 * frames (answers by question number, interventions, fingerprints). With
 * policies that answer after a real delay and circumstances scheduled along
 * the way, every minute of the mirror matches every minute of the host, and
 * so does a mirror that joins late from a save taken while questions were
 * open. No model is called.
 * node living-town/test/live-mirror.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-save.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-story.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-hand.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-live.js'));
const LT = global.LT, Live = LT.Live, Pol = LT.Policy, H = LT.Hand;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }
const wire = (v) => JSON.parse(JSON.stringify(v));

/* The offline policy, answering after a real but uneven delay: which minute an
 * answer lands in is then a fact of the run, not of the world. */
let calls = 0;
Pol.register({
  id: 'slow_utility', label: 'slow utility',
  decide: function (request) {
    const inner = Pol.get('utility');
    const delay = (calls++ % 5) * 2;          // 0, 2, 4, 6, 8 ms
    return Promise.resolve(inner.decide(request)).then((r) => new Promise((res) => setTimeout(() => res(r), delay)));
  }
});
const POLICIES = { resident_a: 'slow_utility', resident_b: 'slow_utility', resident_c: 'slow_utility', resident_d: 'slow_utility', resident_e: 'slow_utility' };
const turn = () => new Promise((r) => setTimeout(r, 1));

(async function () {
  console.log('# canonical text does not depend on key order');
  ok(Live.canon({ b: 1, a: [ { y: 2, x: 1 } ] }) === Live.canon({ a: [ { x: 1, y: 2 } ], b: 1 }), 'the same object in another order hashes the same');
  ok(Live.canon({ a: undefined, b: null }) === '{"b":null}', 'undefined is left out, as JSON leaves it out');

  console.log('# a mirror built from the save follows the host minute by minute');
  const hostSim = LT.Scenario.town({ policies: POLICIES });
  const host = Live.host(hostSim);
  const mirrorA = Live.mirror(host.save());
  ok(Live.fingerprint(mirrorA.sim) === Live.fingerprint(hostSim), 'the mirror starts on the host\'s fingerprint');
  ok(mirrorA.sim.actorIds().every((id) => mirrorA.sim.state.characters[id].policyId === Live.FED_POLICY), 'nobody in the mirror is decided locally');

  const frames = [];
  const planned = { 480: ['leave_book', { spot: 'park_bench_sw' }, 'now'], 700: ['refund', { who: 'resident_b' }, 'half_hour'], 900: ['extra_shift', { who: 'resident_a' }, 'now'] };
  let mirrorB = null, joinedAt = null, joinedSave = null;
  const savedAt = {};
  for (let i = 0; i < 1440; i++) {
    const frame = wire(host.step());
    frames.push(frame);
    const r = mirrorA.apply(frame);
    if (!r.ok) throw new Error('mirror A diverged at ' + frame.at + ': ' + JSON.stringify(r));
    const minute = hostSim.state.minute;
    if (planned[minute]) {
      const made = H.make(hostSim, planned[minute][0], planned[minute][1], planned[minute][2]);
      if (!made.ok) throw new Error('hand refused ' + planned[minute][0] + ': ' + made.error);
      savedAt[minute] = made.record.id;
    }
    /* A late joiner, from a save taken while at least one question is open:
     * that save re-asks the question with a suffixed id, and the answer must
     * still find it. */
    if (!mirrorB && minute >= 600 && hostSim.actorIds().some((id) => hostSim.state.characters[id].pending)) {
      joinedAt = hostSim.absMinute();
      joinedSave = host.save();
      mirrorB = Live.mirror(joinedSave);
    }
    await turn();
  }
  ok(hostSim.state.day === 2 && hostSim.state.minute === 360, 'the host ran a full day (' + hostSim.stamp() + ')');
  ok(Live.fingerprint(mirrorA.sim) === Live.fingerprint(hostSim), 'after 1440 frames mirror A has the host\'s fingerprint');
  ok(mirrorA.applied === 1440, 'every frame was applied once');
  const withItv = frames.filter((f) => f.itv.length);
  ok(withItv.length === 3 && withItv.map((f) => f.itv[0].id).join() === Object.keys(planned).map((k) => savedAt[k]).join(),
     'the three circumstances travelled in the frames of the minutes they went in (' + withItv.map((f) => f.at).join(', ') + ')');
  ok(frames.some((f) => f.ans.length), 'answers travelled in frames');
  const late = frames.filter((f) => f.ans.length && f.ans.some((a) => {
    const req = hostSim.requests[a.response.requestId];
    return req && req.request.absMinute < f.at - 1;
  }));
  ok(late.length > 0, 'some answers landed later than the minute after their question, as a slow provider makes them (' + late.length + ' frames)');
  const asked = H.asked(mirrorA.sim, 10);
  ok(asked.length === 3 && asked.every((a) => a.status === 'applied'), 'the mirror\'s register shows the three, applied');
  const reasons = (s) => s.rejections.map((r) => r.reason).sort().join(',');
  ok(reasons(mirrorA.sim) === reasons(hostSim), 'the mirror refused exactly what the host refused (' + (reasons(hostSim) || 'nothing') + ')');

  console.log('# a mirror that joins late from a save with open questions catches up');
  ok(mirrorB !== null, 'a late mirror was made at ' + joinedAt + ' while a question was open');
  const reissued = JSON.parse(joinedSave).reissue || [];
  ok(reissued.length > 0, 'that save re-asks ' + reissued.length + ' question(s)');
  ok(Object.keys(mirrorB.sim.requests).some((k) => /\.\d+$/.test(k)), 'the re-asked question has a suffixed id in the late mirror');
  let appliedB = 0, skipped = 0;
  for (const frame of frames) {
    const r = mirrorB.apply(frame);
    if (!r.ok) throw new Error('mirror B diverged at ' + frame.at + ': ' + JSON.stringify(r));
    if (r.skipped) skipped++; else appliedB++;
  }
  ok(skipped === joinedAt - 360 && appliedB === 1440 - skipped, 'frames before the join were skipped, the rest applied (' + skipped + ' / ' + appliedB + ')');
  ok(Live.fingerprint(mirrorB.sim) === Live.fingerprint(hostSim), 'the late mirror ends on the host\'s fingerprint');
  ok(mirrorB.sim.rejections.every((r) => hostSim.rejections.some((h) => h.reason === r.reason)), 'the late mirror refused nothing the host did not');

  console.log('# a mirror says when it cannot follow');
  const mirrorC = Live.mirror(joinedSave);
  const gap = mirrorC.apply(frames[frames.length - 1]);
  ok(!gap.ok && gap.reason === 'gap', 'a frame from a later minute is a gap, not applied');
  const first = frames.find((f) => f.at === joinedAt);
  const tampered = wire(first); tampered.fp = '00000000';
  const div = mirrorC.apply(tampered);
  ok(!div.ok && div.reason === 'diverged' && div.got === first.fp, 'a fingerprint that does not match is reported with both values');

  console.log('# ' + checks + '/' + checks);
})().catch((e) => { console.error(e); process.exit(1); });
