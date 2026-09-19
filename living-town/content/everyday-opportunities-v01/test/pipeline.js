/* pipeline.js — Living Town content package v01: the FULL pipeline test.
 *
 * This is the test that requires the simulation to actually offer read_book and
 * unpack_food_parcel as candidates to a policy, start the activity, tick it and
 * settle it. That needs an action registration hook in lt-actions.js which this
 * base commit does not have, so on an unintegrated checkout this file reports
 * PIPELINE NOT RUN and exits without counting anything as passed.
 *
 * After Fable adds the hook and calls LT.EverydayV01.registerActions(LT.Actions)
 * (see the package README), run:
 *
 *   node living-town/content/everyday-opportunities-v01/test/pipeline.js
 *
 * It must then print a checks summary and exit 0.
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');

require(path.resolve(__dirname, '..', '..', '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', '..', '..', 'js', 'policy', 'lt-mock-policy.js'));
require(path.resolve(__dirname, '..', 'everyday-opportunities.js'));
const LT = global.LT;
const E = LT.EverydayV01, A = LT.Actions, W = LT.World;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

if (A && typeof A.define === 'function' && !A.get('read_book')) {
  E.registerActions(A);
}
if (!A.get('read_book') || !A.get('unpack_food_parcel')) {
  console.log('# pipeline: PIPELINE NOT RUN');
  console.log('  read_book / unpack_food_parcel are not in the action catalogue, because this');
  console.log('  base commit has no action registration entry point in living-town/js/lt-actions.js.');
  console.log('  Nothing here is counted as passed. Fable must add that hook, call');
  console.log('  LT.EverydayV01.registerActions(LT.Actions), then run this file.');
  process.exit(0);
}

function findUseSpot(sim, locId) {
  const loc = W.LOCATIONS[locId];
  for (let y = 0; y < loc.rows.length; y++) {
    for (let x = 0; x < loc.rows[0].length; x++) {
      if (W.isSolid(loc.rows[y].charAt(x))) continue;
      if ((x === loc.spawn.x && y === loc.spawn.y) || sim.nextStep(loc, loc.spawn, { x: x, y: y }) !== null) {
        return { x: x, y: y };
      }
    }
  }
  throw new Error('no use spot in ' + locId);
}
function stand(sim, actor, locationId, spot) {
  sim.placeCharacter(actor, locationId, { x: spot.x, y: spot.y, dir: 'down' });
  actor.walkTarget = null;
}

async function bookPipeline() {
  console.log('# pipeline: a policy chooses read_book, the sim runs and settles it');
  const readerId = 'resident_a';
  const mock = LT.MockPolicy.create({ id: 'eo-read', script: [{ prefer: 'read_book' }, { prefer: 'read_book' }] });
  const sim = LT.Scenario.day1({ intervention: false, policies: { resident_a: 'eo-read', resident_b: 'utility' } });
  const reader = sim.state.characters[readerId];
  const spot = findUseSpot(sim, 'park');
  const bookParams = {
    instanceId: 'book_pipe', title: 'Tide Tables', locationId: 'park',
    x: spot.x, y: spot.y, useSpot: { x: spot.x, y: spot.y, dir: 'down' }, requiredReadMinutes: 12
  };
  const scheduled = sim.scheduleIntervention({ type: 'place_shared_book', source: 'pipeline', params: bookParams });
  assert(scheduled.ok, 'the book intervention schedules');
  sim.applyDueInterventions();
  const book = sim.objectById('book_pipe');
  ok(book !== null, 'the book exists in the state before any decision');

  stand(sim, reader, 'park', spot);
  await sim.runMinutes(bookParams.requiredReadMinutes + 4);

  const readEvents = sim.state.events.filter((e) => e.type === 'BOOK_READ');
  ok(book.readBy[readerId] === bookParams.requiredReadMinutes, 'the full reading was accumulated through the real tick');
  ok(book.completedBy[readerId] !== undefined, 'the book was completed once for the reader');
  ok(readEvents.length === 1, 'exactly one BOOK_READ event, not one per tick');
  ok(book.inUseBy === null, 'the copy is free again after completion');

  await sim.runMinutes(10);
  ok(sim.state.events.filter((e) => e.type === 'BOOK_READ').length === 1,
     'further time produces no double completion');
}

async function parcelPipeline() {
  console.log('# pipeline: a policy chooses unpack_food_parcel into the real pantry');
  const readerId = 'resident_a';
  const mock = LT.MockPolicy.create({ id: 'eo-open', script: [{ prefer: 'unpack_food_parcel' }, { prefer: 'unpack_food_parcel' }] });
  const sim = LT.Scenario.day1({ intervention: false, policies: { resident_a: 'eo-open', resident_b: 'utility' } });
  const reader = sim.state.characters[readerId];
  const home = reader.homeId;
  const spot = findUseSpot(sim, home);
  const portions = 5;
  const scheduled = sim.scheduleIntervention({
    type: 'deliver_food_parcel', source: 'pipeline',
    params: { instanceId: 'parcel_pipe', toId: readerId, locationId: home,
              x: spot.x, y: spot.y, useSpot: { x: spot.x, y: spot.y, dir: 'down' }, portions: portions }
  });
  assert(scheduled.ok, 'the parcel intervention schedules');
  sim.applyDueInterventions();
  const parcel = sim.objectById('parcel_pipe');
  stand(sim, reader, home, spot);
  reader.pantry = 0;
  reader.needs.hunger = 10;   // keep the reader from eating during the assertions
  const moneyBefore = reader.money;

  await sim.runMinutes(12);
  ok(reader.pantry === portions, 'the portions arrived in the pantry exactly once through the real tick');
  ok(parcel.status === 'empty' && parcel.contentsLeft === 0, 'the parcel is empty, not emptied twice');
  ok(reader.money === moneyBefore, 'opening the parcel created no money');

  const grow = reader.pantry;
  await sim.runMinutes(10);
  ok(reader.pantry === grow, 'later ticks transfer nothing more');

  reader.needs.hunger = 60;
  const eat = A.get('eat_at_home');
  ok(eat.eligible(sim.context(reader, null)) === true,
     'once refilled and hungry, the existing eat_at_home is available; the package did not eat for them');
}

async function main() {
  await bookPipeline();
  await parcelPipeline();
  console.log('\neveryday-opportunities pipeline: ' + checks + '/' + checks);
}

main().catch((e) => { console.error(e); process.exit(1); });
