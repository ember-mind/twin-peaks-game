/* test/story-truth-lint.js — wrapper for tools/story/validate-story.js.
 * Runs the Story Truth Layer validator as a child process and reports
 * PASS/FAIL. Mirrors test/narrative-lint.js. */
'use strict';

const path = require('path');
const { execFileSync } = require('child_process');

const script = path.join(__dirname, '..', 'tools', 'story', 'validate-story.js');

try {
  const output = execFileSync(process.execPath, [script], { encoding: 'utf8' });
  process.stdout.write(output);
} catch (e) {
  if (e.stdout) process.stdout.write(e.stdout);
  if (e.stderr) process.stderr.write(e.stderr);
  console.log('\nstory-truth-lint: FAIL (validator exited non-zero)');
  process.exit(1);
}

console.log('story-truth-lint: PASS');
