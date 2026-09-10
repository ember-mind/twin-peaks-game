/* test/narrative-lint.js — wrapper for tools/narrative/lint-missions.js.
 * Runs the generic narrative validator in-process and reports PASS/FAIL. */
'use strict';

const { lint } = require('../tools/narrative/lint-missions.js');

const result = lint();

result.warnings.forEach((w) => console.log(`WARN  [${w.check}] ${w.message}`));
result.errors.forEach((e) => console.log(`ERROR [${e.check}] ${e.message}`));

if (result.errors.length) {
  console.log(`\nnarrative-lint: FAIL (${result.checksRun} checks, ${result.errors.length} errors, ${result.warnings.length} warnings)`);
  process.exit(1);
} else {
  console.log(`narrative-lint: PASS (${result.checksRun} checks, ${result.warnings.length} warnings)`);
}
