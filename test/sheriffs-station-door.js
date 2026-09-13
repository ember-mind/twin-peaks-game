#!/usr/bin/env node
'use strict';

/* Reactive entrance door for the canonical interior ('sheriff'). Walks the
 * real production doorway (sheriffs-station-front-entrance) and checks the
 * event-driven OPENING -> OPEN -> CLOSING -> CLOSED cycle, that a direct
 * loadMap never triggers it, and that its rects stay within the authored
 * closed-door art (js/sheriffs-station-art.js, x112..144,y176..192). */

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
global.setInterval = () => 0;
global.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); }
};

const context = new Proxy(
  { measureText: (text) => ({ width: String(text).length * 5 }) },
  { get(target, key) { return key in target ? target[key] : () => {}; }, set() { return true; } }
);
const canvas = { width: 256, height: 192, getContext: () => context };
const script = (name) => path.join(__dirname, '..', 'js', name);

[
  'tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'retro-font.js',
  'engine.js', 'glue.js', 'ambient-life.js', 'character-activity.js',
  'environment-reactions.js', 'ambient-life-scenes.js', 'location-connections.js',
   'world-connections.gen.js',
   'double-r-exterior-art.js', 'double-r-exterior-scene.js', 'double-r-location-data.js',
  'double-r-location-production.js',
  'sheriffs-station-art.js', 'sheriffs-station-exterior-art.js',
  'sheriffs-station-scene.js', 'sheriffs-station-exterior-scene.js',
  'sheriffs-station-location-data.js', 'sheriffs-station-production.js',
  'character-life-scenes.js', 'traincar-location-data.js', 'traincar-location-production.js',
  'world-engine.js', 'world-catalog.js'
].forEach((name) => require(script(name)));

const G = global.GAME;
const E = G.Engine;

function press(code) {
  handlers.keydown({ code, preventDefault() {}, repeat: false });
  handlers.keyup({ code });
}
function tick(ms) { for (let i = 0; i < ms; i += 20) { now += 20; rafQueue.splice(0).forEach((fn) => fn(now)); } }

E.init(canvas); E.start(); E.state.mode = 'play'; E.state.dialogue = null;

/* Registration lands on the interior map id, with the door art's exact rect. */
const doorDef = G.EnvironmentReactions.snapshot('sheriff')[0];
assert(doorDef, 'front-door reaction is registered for the sheriff scene');

/* ---- 1. a direct loadMap into the interior does NOT trigger the door. ---- */
E.loadMap('sheriff', 7, 10, 'up');
assert.equal(GAME.EnvironmentReactions.snapshot('sheriff')[0].state, 'CLOSED', 'direct loadMap does not open the door');
assert.equal(GAME.EnvironmentReactions.snapshot('sheriff')[0].events, 0, 'direct loadMap emits no environment event');

/* ---- 2. real production doorway: exterior 7,7 -> 7,6 -> interior. ------- */
E.loadMap('sheriffs_station_exterior', 7, 7, 'up');
E.state.mode = 'play'; E.state.dialogue = null;
const original = E.emitEnvironmentEvent, events = [];
E.emitEnvironmentEvent = (e) => { events.push(e); return original(e); };

handlers.keydown({ code: 'ArrowUp', preventDefault() {}, repeat: false });
tick(200);
handlers.keyup({ code: 'ArrowUp' });
for (let i = 0; i < 50 && E.state.mapId !== 'sheriff'; i++) tick(20);

assert.equal(E.state.mapId, 'sheriff', 'walking up from the lot crosses into the canonical interior');
assert.equal(events.length, 1, 'exactly one committed world event is dispatched');
assert.equal(events[0].sceneId, 'sheriff');
assert.equal(events[0].arrivalKey, '7,10');
assert.equal(events[0].fromMapId, 'sheriffs_station_exterior');
assert.equal(GAME.EnvironmentReactions.snapshot('sheriff')[0].events, 1, 'committed world entry reaches the production door');

/* Reaction time freezes during the doorway fade. */
while (E.state.fadePhase !== 0) {
  assert.equal(GAME.EnvironmentReactions.snapshot('sheriff')[0].elapsed, 0, 'opening pose cannot be consumed behind fade');
  tick(20);
}
assert.equal(GAME.EnvironmentReactions.snapshot('sheriff')[0].frame, 0);
tick(100);
assert.equal(GAME.EnvironmentReactions.snapshot('sheriff')[0].frame, 0, 'first opening pose remains visible after fade');
tick(60);
assert.equal(GAME.EnvironmentReactions.snapshot('sheriff')[0].state, 'OPENING');
tick(140);
assert.equal(GAME.EnvironmentReactions.snapshot('sheriff')[0].state, 'OPEN');
tick(1600);
assert.equal(GAME.EnvironmentReactions.snapshot('sheriff')[0].state, 'CLOSED');

/* ---- 3. containment: every rect the closed-through-open cycle draws stays -
 *        inside the authored door art (x112..144, y176..192). -------------- */
E.loadMap('sheriffs_station_exterior', 7, 7, 'up');
E.state.mode = 'play'; E.state.dialogue = null;
events.length = 0;
handlers.keydown({ code: 'ArrowUp', preventDefault() {}, repeat: false });
tick(200);
handlers.keyup({ code: 'ArrowUp' });
for (let i = 0; i < 50 && E.state.mapId !== 'sheriff'; i++) tick(20);
assert.equal(events.length, 1);
while (E.state.fadePhase !== 0) tick(20);

const rects = [];
const stubCtx = { fillStyle: '', globalAlpha: 1, fillRect(x, y, w, h) { rects.push({ x, y, w, h }); } };
for (let t = 0; t < 1600; t += 20) {
  GAME.EnvironmentReactions.update(20, 'sheriff');
  GAME.EnvironmentReactions.draw(stubCtx, 'sheriff', 0, 0);
}
assert(rects.length > 0, 'the reaction draws at least one rect across the full cycle');
rects.forEach((r) => {
  assert(r.x >= 112, 'rect x within the door art: ' + r.x);
  assert(r.x + r.w <= 144, 'rect x+w within the door art: ' + (r.x + r.w));
  assert(r.y >= 176, 'rect y within the door art: ' + r.y);
  assert(r.y + r.h <= 192, 'rect y+h within the door art: ' + (r.y + r.h));
});

E.emitEnvironmentEvent = original;

console.log('SHERIFFS-STATION-DOOR-PASS production doorway dispatches the reaction, direct loadMap does not, OPENING/OPEN/CLOSING/CLOSED cycle completes, rects stay within the authored door art');
