#!/usr/bin/env node
/* run-with-jev.js — a town whose close calls go to Jev, measured.
 * Everyone decides through a hybrid: the offline policy answers what is clear,
 * Jev is asked only when the lead is within --gap, and never more than
 * --budget times in one town day. The town's clock is held while an answer is
 * out, as the page holds it. Prints what it cost and what changed against the
 * same days lived offline. Makes real, billed calls.
 *   node living-town/tools/run-with-jev.js [--days=1] [--budget=40] [--gap=3] [--log=path.jsonl]
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
global.window = global;
const J = (...p) => path.resolve(__dirname, '..', ...p);
require(J('js', 'lt-scenario.js'));
require(J('js', 'policy', 'lt-remote-policy.js'));
require(J('js', 'policy', 'lt-hybrid-policy.js'));
const Meter = require(J('tools', 'measure-boredom.js'));
const Transport = require(J('tools', 'jev-transport.js'));
const LT = global.LT;

const arg = (name, dflt) => { const m = process.argv.find((a) => a.indexOf('--' + name + '=') === 0); return m ? m.split('=')[1] : dflt; };
const days = Number(arg('days', 1)), budget = Number(arg('budget', 40)), gap = Number(arg('gap', 3)), logPath = arg('log', null);

(async function () {
  const calls = [];
  const transport = Transport.create({ onCall: (c) => { calls.push(c); if (logPath) fs.appendFileSync(logPath, JSON.stringify(c) + '\n'); } });
  LT.RemotePolicy.create({ id: 'jev', label: 'Jev', transport, timeoutMs: 8000, maxInFlight: 4, perTownDay: budget });
  LT.HybridPolicy.create({ id: 'jev_when_close', fast: 'utility', slow: 'jev', closeGap: gap });
  const everyone = {}; ['resident_a', 'resident_b', 'resident_c', 'resident_d', 'resident_e'].forEach((id) => { everyone[id] = 'jev_when_close'; });

  const hold = (sim) => {
    const step = sim.runUntil.bind(sim);
    const waiting = () => sim.actorIds().some((id) => { const p = sim.state.characters[id].pending; return p && sim.requests[p.requestId] && !sim.requests[p.requestId].resolved; });
    sim.runUntil = async function (d, m) { await step(d, m); const t0 = Date.now(); while (waiting() && Date.now() - t0 < 10000) await new Promise((r) => setTimeout(r, 15)); };
    return sim;
  };
  const offline = await Meter.measure(LT.Scenario.town({}), { days });
  const town = hold(LT.Scenario.town({ policies: everyone }));
  const started = Date.now();
  const withJev = await Meter.measure(town, { days });

  const stats = LT.Policy.get('jev').stats();
  const ok = calls.filter((c) => c.result && !c.result.error);
  const tokensIn = ok.reduce((t, c) => t + ((c.result.jev.usage || {}).input_tokens || 0), 0), tokensOut = ok.reduce((t, c) => t + ((c.result.jev.usage || {}).output_tokens || 0), 0);
  const ms = ok.map((c) => c.ms).sort((a, b) => a - b);
  const sources = {};
  town.state.events.filter((e) => e.type === 'ACTIVITY_STARTED' && e.data && e.data.source).forEach((e) => { sources[e.data.source] = (sources[e.data.source] || 0) + 1; });
  const pick = (o) => ({ beats: o.beats, deadMinutes: o.deadMinutes, longestDead: o.longestDeadStretch && o.longestDeadStretch.minutes, decisions: o.decisions, closeCalls: o.closeCalls, togetherMinutes: o.togetherMinutes });
  console.log(JSON.stringify({
    days, budgetPerTownDay: budget, closeGap: gap, wallSeconds: Math.round((Date.now() - started) / 1000),
    jev: { sent: stats.sent, answered: stats.answered, overBudget: stats.overBudget, timeouts: stats.timeouts, errors: stats.errors, unusable: stats.unusable,
           tokensIn, tokensOut, p50ms: ms[Math.floor(ms.length / 2)] || null, p95ms: ms[Math.floor(ms.length * 0.95)] || null,
           meanConfidence: ok.length ? Math.round(100 * ok.reduce((t, c) => t + (c.result.jev.confidence || 0), 0) / ok.length) / 100 : null },
    choicesBySource: sources, offline: pick(offline.overall), withJev: pick(withJev.overall)
  }, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
