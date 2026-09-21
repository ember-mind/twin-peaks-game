#!/usr/bin/env node
/* run-all.js — Living Town: run the Node test suite, no browser.
 * node living-town/test/run-all.js */
'use strict';
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const FILES = ['sim-core.js', 'async-safety.js', 'policies.js', 'interventions.js', 'review-regressions.js', 'cafe-scene.js', 'view-continuity.js', 'save-load.js', 'interactions.js', 'persistence.js', 'everyday.js', 'story.js', 'hand.js', 'town.js', 'poses.js', 'need.js', 'turns.js', 'wallet-in-town.js', 'remote-policy.js', 'boredom.js',
  /* the content package's own tests, and its pipeline as a gate: it exits non-zero if the actions are not registered */
  '../content/everyday-opportunities-v01/test/everyday-opportunities.js', '../content/everyday-opportunities-v01/test/pipeline.js',
  '../content/lost-wallet-v01/test/lost-wallet.js', '../content/lost-wallet-v01/test/pipeline.js',
  '../content/activity-poses-v01/test/activity-poses.js',
  /* back in the list now that the street's house fronts are painted by the package */
  '../content/town-places-v01/test/town-places.js'];

let allPassed = true;
let totalChecks = 0;

FILES.forEach((file) => {
  const full = path.join(__dirname, file);
  const r = spawnSync(process.execPath, [full], { encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  process.stdout.write(out);
  const all = out.match(/(\d+)\/\1(?!\d)/g) || [];   // "n/n" — the convention every file ends on; the last one, since a test may print "2/2" about the town
  const summary = all.length ? /(\d+)\//.exec(all[all.length - 1]) : null;
  const checks = summary ? Number(summary[1]) : 0;
  const passed = r.status === 0 && !r.error;
  if (passed) totalChecks += checks;
  allPassed = allPassed && passed;
  console.log((passed ? 'PASS' : 'FAIL') + ' ' + file + (summary ? ' (' + checks + ' checks)' : ''));
});

console.log('\n' + (allPassed ? 'PASS' : 'FAIL') + ' living-town/test — ' + totalChecks + ' checks total');
process.exit(allPassed ? 0 : 1);
