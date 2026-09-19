#!/usr/bin/env node
/* run-all.js — Living Town: run the Node test suite, no browser.
 * node living-town/test/run-all.js */
'use strict';
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const FILES = ['sim-core.js', 'async-safety.js', 'policies.js', 'interventions.js', 'review-regressions.js', 'cafe-scene.js', 'view-continuity.js', 'save-load.js', 'interactions.js', 'persistence.js', 'everyday.js',
  /* the content package's own tests, and its pipeline as a gate: it exits non-zero if the actions are not registered */
  '../content/everyday-opportunities-v01/test/everyday-opportunities.js', '../content/everyday-opportunities-v01/test/pipeline.js'];

let allPassed = true;
let totalChecks = 0;

FILES.forEach((file) => {
  const full = path.join(__dirname, file);
  const r = spawnSync(process.execPath, [full], { encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  process.stdout.write(out);
  const summary = /(\d+)\/\1/.exec(out); // "n/n" — the same convention every file ends on
  const checks = summary ? Number(summary[1]) : 0;
  const passed = r.status === 0 && !r.error;
  if (passed) totalChecks += checks;
  allPassed = allPassed && passed;
  console.log((passed ? 'PASS' : 'FAIL') + ' ' + file + (summary ? ' (' + checks + ' checks)' : ''));
});

console.log('\n' + (allPassed ? 'PASS' : 'FAIL') + ' living-town/test — ' + totalChecks + ' checks total');
process.exit(allPassed ? 0 : 1);
