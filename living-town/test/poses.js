/* poses.js — Living Town: which shape someone is drawn in, and in what light.
 * The mapping from activity to pose lives in the town, not in the pose package;
 * it follows the real phase, never a person's identity; and light is a pure
 * reading of the simulated minute.
 * node living-town/test/poses.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-appearance.js'));
require(path.resolve(__dirname, '..', 'content', 'activity-poses-v01', 'activity-poses.table.js'));
require(path.resolve(__dirname, '..', 'content', 'activity-poses-v01', 'lt-daylight.js'));
const LT = global.LT, A = LT.Appearance;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

(async function () {
  console.log('# a pose follows what someone is really doing');
  const sim = LT.Scenario.town({});
  const seen = {}, wrong = [];
  for (let d = 1; d <= 2; d++) for (let m = (d === 1 ? 361 : 0); m < 1440; m += 3) {
    await sim.runUntil(d, m);
    sim.actorIds().forEach((id) => {
      const c = sim.state.characters[id], pose = A.poseFor(c);
      if (!pose) return;
      seen[pose.poseId] = (seen[pose.poseId] || 0) + 1;
      const table = LT.ActivityPoses ? LT.ActivityPoses.POSES : LT.ActivityPosesTable && LT.ActivityPosesTable.POSES;
      if (!c.activity || c.activity.phase !== 'executing' || c.transit || c.walkTarget) wrong.push(id + ' posed while ' + JSON.stringify(c.activity && c.activity.phase));
      if (pose.poseId === 'talking' && !sim.state.conversations.some((v) => v.id === c.activity.conversationId && v.status === 'active')) wrong.push(id + ' talking to nobody');
      if (table && table[pose.poseId] && table[pose.poseId].dirs && table[pose.poseId].dirs.indexOf(pose.dir === 'left' ? 'right' : pose.dir) < 0) wrong.push(pose.poseId + ' has no ' + pose.dir);
    });
  }
  ok(['sleeping', 'seated', 'reading', 'talking'].every((p) => seen[p] > 0), 'two town days show every wired pose: ' + JSON.stringify(seen));
  ok(wrong.length === 0, 'nobody is posed while walking over, waiting for an answer, or in a direction the pose lacks' + (wrong[0] ? ' — ' + wrong[0] : ''));
  const src = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'lt-appearance.js'), 'utf8');
  const fn = src.slice(src.indexOf('A.poseFor ='), src.indexOf('A.generator'));
  ok(!/resident_|\.name\b|appearanceId|\.id\b/.test(fn), 'the mapping reads activity and phase, never who the person is');
  ok(A.poseFor({ activity: { actionId: 'work_shift', phase: 'executing' }, pos: { dir: 'down' } }) === null && A.poseFor({ activity: { actionId: 'unpack_food_parcel', phase: 'executing' }, pos: { dir: 'down' } }) === null,
     'the two poses no cold viewer could name are not wired');
  ok(A.poseFor({ activity: { actionId: 'sleep', phase: 'approaching' }, pos: { dir: 'up' } }) === null, 'someone on their way to bed is still walking');

  console.log('# light is the simulated minute, and only that');
  const D = LT.DayLight;
  const phases = [420, 780, 1110, 1380].map((m) => D.at(m));
  ok(new Set(phases.map((l) => l.glass)).size === 4 && phases[3].ambient.alpha > phases[1].ambient.alpha, 'morning, noon, dusk and night have four different windows, and night is the darkest room');
  ok(JSON.stringify(D.at(600)) === JSON.stringify(D.at(600)) && D.at(600).minute === 600, 'the same minute is always the same light');
  let jump = 0;
  for (let m = 0; m < 1440; m++) jump = Math.max(jump, Math.abs(D.at(m).ambient.alpha - D.at((m + 1) % 1440).ambient.alpha));
  ok(jump < 0.02, 'no visible step between two adjacent minutes (largest ' + jump.toFixed(4) + ')');
  const view = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'lt-view.js'), 'utf8');
  ok(/finally \{ if \(light && base\) kit\.materials\[scene\.id\] = base; \}/.test(view), 'the room\'s material is borrowed for the paint and handed back, even if painting throws');
  ok(view.indexOf('LT.DayLight.apply') > view.indexOf('this.drawTemporaryPlace(g, loc, ents'), 'the tint goes on after room and people');

  console.log('\nposes: ' + checks + '/' + checks);
})().catch((e) => { console.error(e); process.exit(1); });
