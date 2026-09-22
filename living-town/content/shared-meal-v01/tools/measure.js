/* measure.js — Living Town content package `shared-meal-v01`: does it happen?
 *
 * Runs the five-inhabitant town for three days on the DEFAULT policy — the
 * competent baseline, not a straw man — and counts what the package produced,
 * from sim.state.events and from the commitments whose id starts with
 * `cmt_meal_`. No scores are bent to make a number look better; whatever the
 * default policy does with honest suggestions is what is reported.
 *
 * One JSON line, computed twice from fresh sims in the same process, so a run
 * that is not deterministic fails loudly instead of printing a lucky one.
 *
 * node living-town/content/shared-meal-v01/tools/measure.js
 */
'use strict';
const path = require('node:path');

require(path.resolve(__dirname, '..', '..', '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'shared-meal.js'));
const LT = global.LT;

function count(sim) {
  const events = sim.state.events;
  const n = (type) => events.filter((e) => e.type === type).length;

  const settled = {};   // commitment id -> status, from the people who carry them
  Object.keys(sim.state.characters).forEach((id) => {
    (sim.state.characters[id].commitments || []).forEach((c) => {
      if (c.id.indexOf('cmt_meal_') !== 0) return;
      settled[c.id] = c.status;
    });
  });
  const ids = Object.keys(settled);
  return {
    invited: n('MEAL_INVITED'),
    accepted: n('MEAL_ACCEPTED'),
    declined: n('MEAL_DECLINED'),
    kept: ids.filter((id) => settled[id] === 'kept').length,
    broken: ids.filter((id) => settled[id] === 'broken').length
  };
}

async function threeDays() {
  const sim = LT.Scenario.town({});
  await sim.runUntil(4, 0);   // start of day 1 to the end of day 3
  return count(sim);
}

async function main() {
  const first = await threeDays();
  const second = await threeDays();
  const line1 = JSON.stringify(first), line2 = JSON.stringify(second);
  if (line1 !== line2) {
    console.error('shared-meal measure: two runs of the same town disagree:');
    console.error('  ' + line1);
    console.error('  ' + line2);
    process.exit(1);
  }
  console.log(line1);
  const held = first.kept + first.broken;
  const problems = [];
  if (first.invited < 2) problems.push('invited ' + first.invited + ' < 2');
  if (first.accepted < 1) problems.push('accepted ' + first.accepted + ' < 1');
  if (held < 1) problems.push('kept+broken ' + held + ' < 1');
  if (problems.length) {
    console.error('shared-meal measure: the town did not reach the floor: ' + problems.join('; '));
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
