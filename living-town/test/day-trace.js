#!/usr/bin/env node
/* day-trace.js — run one simulated day and print what actually happened.
 * Evidence, not a test: it asserts nothing and is safe to read. */
'use strict';
const path = require('path');
require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
const LT = global.LT;

const sim = LT.Scenario.day1({});
const until = process.argv[2] ? Number(process.argv[2]) : 1439;

sim.runUntil(1, until).then(() => {
  const noise = new Set(['ACTIVITY_STARTED', 'ACTIVITY_COMPLETED']);
  const verbose = process.env.LT_VERBOSE === '1';
  sim.state.events.forEach(e => {
    if (!verbose && noise.has(e.type)) return;
    console.log(`${e.stamp} ${e.type.padEnd(22)} ${e.text}`);
  });
  const m = sim.state.characters.mara, t = sim.state.characters.tomas;
  console.log('\n--- end of day ---');
  [m, t].forEach(c => {
    console.log(`${c.name}: at ${c.location} energy=${c.needs.energy} hunger=${c.needs.hunger} money=${c.money} savings=${c.savings}`);
    (c.goals || []).forEach(g => console.log(`   goal ${g.id}: ${g.progress}/${g.target} reached=${!!g.reached}`));
    (c.commitments || []).forEach(k => console.log(`   commitment ${k.id}: ${k.status}`));
    console.log(`   relationships: ${JSON.stringify(c.relationships)}`);
    console.log(`   memories: ${c.memories.length}, decisions: ${c.recentDecisions.length}`);
  });
  console.log('rejections:', JSON.stringify(sim.rejections, null, 1));
}).catch(e => { console.error(e); process.exit(1); });
