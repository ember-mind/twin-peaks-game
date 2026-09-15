#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');

let now = 0;
let rafQueue = [];
const handlers = {};
const storage = new Map();

global.window = global;
global.performance = { now: () => now };
global.requestAnimationFrame = (fn) => { rafQueue.push(fn); };
global.setInterval = () => 0;
global.addEventListener = (type, fn) => { handlers[type] = fn; };
global.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); }
};

const noop = () => {};
const context = new Proxy(
  { measureText: (text) => ({ width: String(text).length * 5 }) },
  { get(target, key) { return key in target ? target[key] : noop; }, set() { return true; } }
);
const canvas = { width: 256, height: 192, getContext: () => context };
const js = (name) => path.join(__dirname, '..', 'js', name);

require(js('tiles.js'));
require(js('chars.js'));
require(js('houses.js'));
require(js('maps.js'));
require(js('data.js'));
require(js('retro-font.js'));
require(js('engine.js'));
require(js('scene-objects.gen.js'));
require(js('glue.js'));
require(js('ambient-life.js'));
require(js('environment-reactions.js'));
require(js('ambient-life-scenes.js'));
require(js('location-connections.js'));
require(js('double-r-exterior-art.js'));
require(js('double-r-exterior-scene.js'));
require(js('world-connections.gen.js'));
const connection = global.GAME.WorldData.connections.find((c) => c.id === 'double-r-front-entrance');

const E = global.GAME.Engine;
const exterior = global.GAME.DoubleRExteriorScene;
const phases = [];
const events = [];
let failSave = false;
let saveCount = 0;

global.GAME.NarrativeProduction = {
  onClassicSave() {
    saveCount++;
    return failSave
      ? { handled: true, ok: false, error: 'fixture disk full' }
      : { handled: true, ok: true };
  }
};

exterior.install();
require(js('sheriffs-station-art.js'));
require(js('sheriffs-station-exterior-art.js'));
require(js('sheriffs-station-scene.js'));
require(js('sheriffs-station-exterior-scene.js'));
require(js('sheriffs-station-production.js'));
require(js('world-engine.js'));
require(js('world-catalog.js'));
require(js('world-connections-production.js'));
// Exercise the production reaction implementation with the connection's named
// departure hook. The preview uses the same unconstrained front-door reaction.
const R = global.GAME.EnvironmentReactions;
R.register('diner', [{
  id: 'front-door', trigger: 'ENTITY_ENTERED_DOORWAY', x: 96, y: 144, depth: 160,
  frames: R.doorEntryFrames,
  palette: { frame: '#35271f', void: '#17251e', threshold: '#81918b', red: '#8c2f3e', edge: '#501f29', gold: '#e9bd5d', glass: '#f4e6c8' }
}]);

const emit = E.emitEnvironmentEvent;
E.emitEnvironmentEvent = (event) => {
  events.push({ event: Object.assign({}, event), phase: E.state.fadePhase });
  return emit(event);
};

function frame() {
  now += 20;
  const callbacks = rafQueue.splice(0);
  callbacks.forEach((fn) => fn(now));
  if (phases[phases.length - 1] !== E.state.fadePhase) phases.push(E.state.fadePhase);
}

function pump(ms) {
  for (let elapsed = 0; elapsed < ms; elapsed += 20) frame();
}

function keyDown(dir) {
  handlers.keydown({ code: 'Arrow' + dir[0].toUpperCase() + dir.slice(1), preventDefault: noop, repeat: false });
}

function keyUp(dir) {
  handlers.keyup({ code: 'Arrow' + dir[0].toUpperCase() + dir.slice(1) });
}

function tap(dir) {
  keyDown(dir);
  let guard = 20;
  while (!E.state.player.moving && E.state.fadePhase === 0 && guard--) frame();
  keyUp(dir);
  pump(280);
}

function settleFade() {
  let guard = 80;
  while (E.state.fadePhase !== 0 && guard--) frame();
  assert(guard > 0, 'fade settles');
}

function loadExterior(x, y, dir) {
  E.loadMap(exterior.mapId, x, y, dir);
  E.state.mode = 'play';
  E.state.dialogue = null;
  E.state.menu = false;
  E.state.fade = 0;
  E.state.fadePhase = 0;
  E.state.warp = null;
  E.state.npcs = [];
}

function cross(dir, expectedMap, expectedSpawn) {
  phases.length = 0;
  keyDown(dir);
  let guard = 100;
  while (E.state.fadePhase === 0 && guard--) frame();
  assert(guard > 0, 'movement reaches a connection trigger');
  keyUp(dir);
  settleFade();
  assert.equal(E.state.mapId, expectedMap);
  assert.deepEqual(
    [E.state.player.tx, E.state.player.ty, E.state.player.dir],
    expectedSpawn
  );
  const transitionPhases = phases.filter((phase, i, all) => (!i || phase !== all[i - 1]))
    .slice(phases.indexOf(1));
  assert.deepEqual(transitionPhases, [1, 3, 2, 0], 'fade follows 1 -> 3 -> 2 -> 0');
}

E.init(canvas);
E.start();
loadExterior(6, 7, 'up');

assert.equal(connection.id, 'double-r-front-entrance');
assert.strictEqual(global.GAME.Maps[exterior.mapId].doors['6,6'], global.GAME.Maps[exterior.mapId].doors['7,6']);
assert.strictEqual(global.GAME.Maps.diner.doors['6,9'], global.GAME.Maps.diner.doors['7,9']);

// Each physical leaf works in both directions as a real engine round trip.
for (const leaf of [6, 7]) {
  loadExterior(leaf, 7, 'up');
  cross('up', 'diner', [6, 8, 'up']);
  if (leaf === 7) tap('right');
  assert.deepEqual([E.state.player.tx, E.state.player.ty], [leaf, 8]);
  // Let the arrival animation finish so the departure is a distinct event.
  pump(1100);
  const beforeDeparture = R.snapshot('diner')[0].events;
  keyDown('down');
  let guard = 40;
  while (E.state.fadePhase === 0 && guard--) frame();
  assert(guard > 0, 'interior leaf starts its fade from ' + JSON.stringify({
    leaf, tx: E.state.player.tx, ty: E.state.player.ty, dir: E.state.player.dir,
    moving: E.state.player.moving, dialogue: !!E.state.dialogue, fade: E.state.fadePhase
  }));
  assert.equal(R.snapshot('diner')[0].events, beforeDeparture + 1, 'departure reaction fires before fade completes');
  assert.equal(events.at(-1).phase, 0, 'departure hook is emitted before fade phase 1');
  keyUp('down');
  phases.length = 0;
  phases.push(1);
  settleFade();
  assert.equal(E.state.mapId, exterior.mapId);
  assert.deepEqual([E.state.player.tx, E.state.player.ty, E.state.player.dir], [6, 7, 'down']);
  pump(500);
  assert.deepEqual([E.state.player.tx, E.state.player.ty], [6, 7], 'arrival spawn does not bounce automatically');
}

const arrivals = events.filter(({ event }) => event.sceneId === 'diner' && !event.reactionId);
assert.equal(arrivals.length, 2, 'both exterior leaves commit an arrival event');
assert(arrivals.every(({ event }) => event.connectionId === connection.id && event.arrivalKey === '6,8'));

// Keeping movement held through the fade must continue away from the landing,
// rather than immediately re-entering the connection.
loadExterior(6, 7, 'up');
keyDown('up');
let heldGuard = 120;
while ((E.state.mapId !== 'diner' || E.state.fadePhase !== 0) && heldGuard--) frame();
assert(heldGuard > 0, 'held-input transition completes');
pump(280);
keyUp('up');
pump(40);
assert.equal(E.state.mapId, 'diner');
assert(E.state.player.ty < 8, 'held input walks north from the diner spawn');

// Authored exterior obstacles stop actual player movement.
for (const obstacle of [
  { name: 'planter', start: [1, 8], dir: 'up', blocked: [1, 7] },
  { name: 'wheel stop', start: [2, 10], dir: 'up', blocked: [2, 9] },
  { name: 'front wall', start: [5, 7], dir: 'up', blocked: [5, 6] }
]) {
  loadExterior(obstacle.start[0], obstacle.start[1], obstacle.dir);
  assert(global.GAME.Maps.isSolid(exterior.mapId, obstacle.blocked[0], obstacle.blocked[1], E.state), obstacle.name + ' fixture is solid');
  tap(obstacle.dir);
  assert.deepEqual([E.state.player.tx, E.state.player.ty], obstacle.start, obstacle.name + ' blocks engine movement');
}

// A failed coordinated save rolls the map change back and emits no phantom
// arrival. Retrying only works after walking off the trigger and approaching it.
loadExterior(6, 7, 'up');
const eventsBeforeFailure = events.length;
failSave = true;
cross('up', exterior.mapId, [6, 6, 'up']);
assert.equal(events.length, eventsBeforeFailure, 'failed save emits no arrival');
assert.match(E.lastSaveError, /fixture disk full/);
pump(500);
assert.deepEqual([E.state.player.tx, E.state.player.ty], [6, 6], 'rollback does not auto-retry on the trigger');
failSave = false;
tap('down');
assert.deepEqual([E.state.player.tx, E.state.player.ty], [6, 7], 'player steps away before retry');
cross('up', 'diner', [6, 8, 'up']);
assert.equal(events.filter(({ event }) => event.sceneId === 'diner' && !event.reactionId).length, 4, 'retry emits exactly one committed arrival');

assert(saveCount > 0, 'all traversals use the coordinated save participant');
console.log('LOCATION-TRAVERSAL-PASS both leaves round-trip, fade order, reactions, held input, collision and save rollback/retry');
