#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const path = require('node:path');

let now = 0;
let rafQueue = [];
const handlers = {};
const storage = new Map();

global.window = global;
global.addEventListener = (type, fn) => { handlers[type] = fn; };
global.requestAnimationFrame = (fn) => { rafQueue.push(fn); };
global.performance = { now: () => now };
global.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); }
};

const context = new Proxy(
  { measureText: (text) => ({ width: String(text).length * 5 }) },
  { get(target, key) { return key in target ? target[key] : () => {}; }, set() { return true; } }
);
const canvas = { width: 0, height: 0, getContext: () => context };
const script = (name) => path.join(__dirname, '..', 'js', name);

require(script('tiles.js'));
require(script('chars.js'));
require(script('houses.js'));
require(script('maps.js'));
require(script('data.js'));
require(script('retro-font.js'));
require(script('engine.js'));
require(script('glue.js'));

const E = global.GAME.Engine;

function press(code) {
  handlers.keydown({ code, preventDefault() {}, repeat: false });
  handlers.keyup({ code });
}

function boot() {
  rafQueue = [];
  E.init(canvas);
  E.start();
  now += 16;
  rafQueue.splice(0).forEach((fn) => fn(now));
}

function assertTownStart(label) {
  const state = E.state;
  assert.equal(state.mapId, 'town', label + ': map');
  assert.deepEqual([state.player.tx, state.player.ty, state.player.dir], [28, 31, 'up'], label + ': coordinate');
  assert.equal(global.GAME.Maps.isSolid('town', 28, 31, state), false, label + ': walkable');
}

storage.clear();
boot();
assert.equal(E.state.mode, 'title', 'fresh boot starts at title');
assertTownStart('fresh boot');

storage.set('tp_save', JSON.stringify({
  mapId: 'arrival', tx: 4, ty: 3, dir: 'up', clues: [], flags: { intro_town: true }
}));
boot();
press('Enter');
assert.equal(E.state.mode, 'intro', 'legacy empty arrival save restarts intro');
assert.equal(storage.has('tp_save'), false, 'legacy empty arrival save cleared');
assertTownStart('legacy opening migration');

storage.set('tp_save', JSON.stringify({
  mapId: 'arrival', tx: 4, ty: 3, dir: 'up', clues: ['diario'], flags: { intro_town: true }
}));
boot();
press('Enter');
assert.equal(E.state.mode, 'play', 'progressed save resumes');
assert.equal(E.state.mapId, 'arrival', 'progressed arrival save preserved');
assert.deepEqual(E.state.clues, ['diario'], 'progressed save clues preserved');

console.log('INITIAL-SPAWN-PASS 12/12');
