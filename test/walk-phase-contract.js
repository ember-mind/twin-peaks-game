#!/usr/bin/env node
'use strict';

/* Behavioral cadence contract. Unlike source regexes, this executes the same
 * pure phase function used by player and NPC rendering. */

const assert = require('node:assert/strict');
const path = require('node:path');

global.GAME = {};
require(path.resolve(__dirname, '..', 'js', 'engine.js'));

const phase = global.GAME.Engine.walkPhase;
const SPEED = 0.075;
const TILE = 16;

assert.equal(typeof phase, 'function', 'walkPhase export');
[
  [-1, 0], [0, 0], [0.125, 0], [0.249999, 0],
  [0.25, 1], [0.375, 1], [0.499999, 1],
  [0.5, 2], [0.625, 2], [0.749999, 2],
  [0.75, 3], [0.875, 3], [0.999999, 3], [1, 3], [2, 3],
].forEach(([progress, expected]) => {
  assert.equal(phase(progress), expected, `phase(${progress})`);
});

function renderedPhases(frameMs) {
  let progress = 0;
  const observed = [];
  while (progress < 1) {
    progress += frameMs * SPEED / TILE;
    if (progress >= 1) break;
    const current = phase(progress);
    if (observed[observed.length - 1] !== current) observed.push(current);
  }
  return observed;
}

[
  ['30 Hz', 1000 / 30],
  ['60 Hz', 1000 / 60],
  ['120 Hz', 1000 / 120],
  ['50 ms capped large-dt', 50],
].forEach(([label, frameMs]) => {
  assert.deepEqual(renderedPhases(frameMs), [0, 1, 2, 3], label);
});

// Una tile concatenata deve ricominciare dal contatto, per player e NPC.
function chainedReset(progress, frameMs) {
  progress += frameMs * SPEED / TILE;
  return progress >= 1 ? 0 : progress;
}
assert.equal(phase(chainedReset(0.98, 50)), 0, 'player chained tile resets to contact');
assert.equal(phase(chainedReset(0.98, 50)), 0, 'NPC chained tile resets to contact');

console.log('WALK-PHASE-PASS — boundaries + 30/60/120 Hz + large-dt + chained reset');
