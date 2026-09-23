/* mind-server.js — Living Town: the town server with Jev as the residents' mind.
 * No network and no bill: Jev is a stand-in transport that answers like Jev
 * (one of the options, with a probability for each). What is checked is the
 * server's side: who is asked, the budget, saying so when the mind is offline,
 * and that a browser's mirror stays in step with answers it never asked for.
 * node living-town/test/mind-server.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const Server = require(path.resolve(__dirname, '..', 'server', 'town-server.js'));
const LT = global.LT;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }
const settle = () => new Promise((r) => setTimeout(r, 2));

/* Like Jev: picks the last option on offer, with odds for all of them. */
function fakeJev(log) {
  return async (brief) => {
    log.push(brief.options.map((o) => o.id));
    const pick = brief.options[brief.options.length - 1].id, probabilities = {};
    brief.options.forEach((o) => { probabilities[o.id] = o.id === pick ? 0.6 : 0.4 / (brief.options.length - 1 || 1); });
    return { choose: pick, jev: { model: 'jev-fake', confidence: 0.6, probabilities } };
  };
}

(async function () {
  console.log('# the offline town says who decides');
  const plain = Server.createTown({ data: fs.mkdtempSync(path.join(os.tmpdir(), 'lt-mind-')), speed: 6, seed: 7, paused: true, jev: false });
  ok(plain.status().mind.on === false && plain.sim.state.characters.resident_a.policyId === 'utility', 'without --jev nobody asks Jev and the page is told so');

  console.log('# with Jev: asked on plans and forks, within a budget');
  const asked = [];
  const town = Server.createTown({ data: fs.mkdtempSync(path.join(os.tmpdir(), 'lt-mind-')), speed: 6, seed: 7, paused: true,
                                   jev: true, jevBudget: 12, jevGap: 3, jevTransport: fakeJev(asked) });
  ok(town.sim.actorIds().every((id) => town.sim.state.characters[id].policyId === 'mind'), 'everyone decides through the hybrid mind');
  const mirror = LT.Live.mirror(town.host.save());
  for (let i = 0; i < 240; i++) { await town.step(); await settle(); }
  /* The frames as the server sent them, from its log. */
  const frames = fs.readFileSync(path.join(town.dataDir, 'frames.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const s = town.status().mind;
  ok(asked.length > 0 && asked.every((ids) => ids.length >= 2), 'Jev was asked ' + asked.length + ' questions, each with a real choice to make');
  ok(asked.some((ids) => ids.some((id) => /^plan_hour:/.test(id))), 'among them, what someone means to do with the next hour');
  ok(s.usedToday === 12 && s.overBudget > 0 && s.offline === true, 'the budget holds: 12 asked, ' + s.overBudget + ' more answered offline, and the mind reports itself offline');
  const byJev = town.sim.actorIds().map((id) => town.sim.state.characters[id].recentDecisions).flat().filter((d) => /jev/.test(d.source));
  ok(byJev.length > 0 && byJev.every((d) => d.diagnostics && d.diagnostics.probabilities && Object.keys(d.diagnostics.probabilities).length >= 2),
     'decisions Jev made carry its odds (' + byJev.length + ' in the recent record)');
  ok(frames.some((f) => f.mind && f.mind.offline === false) && frames[frames.length - 1].mind.offline === true, 'every frame says who is deciding, and the last ones say the mind is offline');

  console.log('# a browser follows answers it never asked for');
  let bad = null;
  frames.forEach((f) => { if (bad) return; const r = mirror.apply(f); if (!r.ok) bad = r; });
  ok(!bad && LT.Live.fingerprint(mirror.sim) === LT.Live.fingerprint(town.sim), 'the mirror applied all ' + frames.length + ' frames and ends on the server\'s fingerprint' + (bad ? ' ' + JSON.stringify(bad) : ''));

  console.log('\nmind-server: ' + checks + '/' + checks);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
