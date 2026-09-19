#!/usr/bin/env node
'use strict';

/* test/migrated-door-traversal.js — walk the real engine through every door M5 moved into the registry.
 *
 * Boots the production chain (single installer js/world-connections-production.js), then for each migrated
 * crossing stands on the approach tile, turns, and presses the arrow key into the trigger.
 * Checks: the gate message when the flag/clue count is missing, the arrival map + spawn + facing, every leaf of
 * a two-tile door, and that one-way records have no way back. Short turns and held walking are distinct inputs.
 */

const assert = require('node:assert/strict');
const path = require('node:path');
let now = 0, queue = [], handlers = {};
global.window = global;
global.performance = { now: () => now };
global.requestAnimationFrame = (fn) => queue.push(fn);
global.setInterval = () => 0;
global.addEventListener = (type, fn) => { handlers[type] = fn; };
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const noop = () => {};
const ctx = new Proxy({ measureText: (text) => ({ width: String(text).length * 5 }) },
  { get: (target, key) => key in target ? target[key] : noop, set: () => true });
const js = (name) => path.join(__dirname, '..', 'js', name);
const quiet = console.warn;
console.warn = noop;
['tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'retro-font.js', 'engine.js', 'scene-objects.gen.js', 'glue.js', 'environment-reactions.js',
  'location-connections.js', 'world-connections.gen.js',
  'double-r-exterior-art.js', 'double-r-exterior-scene.js', 'double-r-location-production.js',
  'sheriffs-station-art.js', 'sheriffs-station-exterior-art.js', 'sheriffs-station-scene.js', 'sheriffs-station-exterior-scene.js',
  'sheriffs-station-production.js', 'room-315-art.js', 'room-315-scene.js', 'room-315-production.js',
  'hospital-art.js', 'hospital-scene.js', 'hospital-production.js', 'traincar-art.js', 'traincar-scene.js', 'traincar-production.js',
  'world-connections-production.js', 'world-engine.js', 'world-catalog.js'
].forEach((name) => require(js(name)));
console.warn = quiet;
const GAME = global.GAME;
const E = GAME.Engine;
GAME.NarrativeProduction = { onClassicSave() { return { handled: true, ok: true }; } };
let checks = 0;
function ok(cond, label, detail) { assert.ok(cond, label + (detail === undefined ? '' : ' :: ' + JSON.stringify(detail))); checks++; }
function frame() { now += 20; queue.splice(0).forEach((fn) => fn(now)); }
function pump(ms) { for (let t = 0; t < ms; t += 20) frame(); }
const KEY = (dir) => 'Arrow' + dir[0].toUpperCase() + dir.slice(1);
function press(dir) { handlers.keydown({ code: KEY(dir), preventDefault: noop, repeat: false }); }
function release(dir) { handlers.keyup({ code: KEY(dir) }); }
function settle() { let guard = 80; while (E.state.fadePhase !== 0 && guard--) frame(); assert(guard > 0, 'fade settles'); }
function setScene(mapId, tx, ty, dir) {
  // Each fixture owns its input; no held direction leaks from a prior gate.
  if (handlers.blur) handlers.blur();
  E.state.mode = 'title'; E.loadMap(mapId, tx, ty, dir); E.state.mode = 'play';
  E.state.dialogue = null; E.state.menu = false; E.state.fade = 0; E.state.fadePhase = 0; E.state.warp = null;
  pump(800);
}
function where() { return [E.state.mapId, E.state.player.tx, E.state.player.ty, E.state.player.dir]; }
function cross(label, mapId, stand, dir, expected) {
  const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
  setScene(mapId, stand[0], stand[1], opposite[dir]);
  // A short changed-direction tap turns but does not cross the threshold.
  press(dir); frame(); release(dir); pump(120);
  ok(JSON.stringify(where()) === JSON.stringify([mapId, stand[0], stand[1], dir]),
    label + ': short tap turns on the approach tile', where());
  // A separate held input then crosses via the actual movement/fade path.
  press(dir);
  let guard = 100;
  while (E.state.fadePhase === 0 && guard--) frame();
  release(dir);
  ok(guard > 0, label + ': trigger starts the fade', where());
  settle();
  ok(JSON.stringify(where()) === JSON.stringify(expected), label + ': arrives at ' + expected.join(' '), where());
}
function blocked(label, mapId, stand, dir, dialogueId) {
  setScene(mapId, stand[0], stand[1], dir);
  press(dir); pump(400); release(dir);
  ok(E.state.mapId === mapId && E.state.player.tx === stand[0] && E.state.player.ty === stand[1], label + ': stays on the approach tile', where());
  ok(E.state.dialogue && E.state.dialogue.id === dialogueId, label + ': shows ' + dialogueId, E.state.dialogue && E.state.dialogue.id);
  E.state.dialogue = null;
}
E.init({ width: 256, height: 192, getContext: () => ctx });
E.start();
E.state.flags = {};
E.state.clues = [];
blocked('town -> hotel_gn without sogno_fatto', 'town', [9, 7], 'up', 'hotel_locked');
blocked('town -> hospital without sogno_fatto', 'town', [23, 7], 'up', 'hospital_locked');
blocked('town -> roadhouse without atto4', 'town', [47, 29], 'up', 'roadhouse_chiuso');
blocked('town -> woods with 0 clues', 'town', [50, 1], 'up', 'woods_blocked');
E.state.flags.sogno_fatto = true;
E.state.flags.atto4 = true;
E.state.clues = ['a', 'b', 'c'];

// ---- paired migrated crossings, both directions, every leaf
cross('town -> hotel_gn (town-great-northern-lobby)', 'town', [9, 7], 'up', ['hotel_gn', 9, 10, 'up']);
cross('hotel_gn leaf 9,11 -> town', 'hotel_gn', [9, 10], 'down', ['town', 9, 7, 'down']);
cross('hotel_gn leaf 10,11 -> town', 'hotel_gn', [10, 10], 'down', ['town', 9, 7, 'down']);
cross('town -> hospital (town-hospital)', 'town', [23, 7], 'up', ['hospital', 7, 10, 'up']);
cross('hospital leaf 7,11 -> town', 'hospital', [7, 10], 'down', ['town', 23, 7, 'down']);
cross('hospital leaf 8,11 -> town', 'hospital', [8, 10], 'down', ['town', 23, 7, 'down']);
cross('town -> palmer (town-palmer-house)', 'town', [42, 7], 'up', ['palmer', 7, 10, 'up']);
cross('palmer leaf 7,11 -> town', 'palmer', [7, 10], 'down', ['town', 42, 7, 'down']);
cross('palmer leaf 8,11 -> town', 'palmer', [8, 10], 'down', ['town', 42, 7, 'down']);
cross('town -> roadhouse (town-roadhouse)', 'town', [47, 29], 'up', ['roadhouse', 7, 8, 'up']);
cross('roadhouse leaf 7,9 -> town', 'roadhouse', [7, 8], 'down', ['town', 47, 29, 'down']);
cross('roadhouse leaf 8,9 -> town', 'roadhouse', [8, 8], 'down', ['town', 47, 29, 'down']);
cross('town -> woods through the clue gate (town-woods-north)', 'town', [50, 1], 'up', ['woods', 14, 20, 'up']);
cross('woods -> town (town-woods-north)', 'woods', [14, 20], 'down', ['town', 50, 1, 'down']);
cross('arrival -> town (arrival-town, one-way)', 'arrival', [4, 7], 'down', ['town', 30, 33, 'up']);
cross('woods -> redroom (woods-redroom-dream, one-way)', 'woods', [14, 5], 'up', ['redroom', 8, 9, 'up']);
cross('redroom -> room_315 (redroom-room-315-wake, one-way)', 'redroom', [8, 10], 'down', ['room_315', 2, 6, 'down']);
const backDoors = (from, to) => Object.values(GAME.Maps[from].doors).filter((d) => d.to === to);
ok(backDoors('town', 'arrival').length === 0, 'no door town -> arrival');
ok(backDoors('redroom', 'woods').length === 0, 'no door redroom -> woods (before the finale override)');
ok(backDoors('room_315', 'redroom').length === 0, 'no door room_315 -> redroom');
console.log('MIGRATED-DOOR-TRAVERSAL-PASS ' + checks + ' checks: 4 gates, 14 paired leaves, 3 one-way crossings, no way back');
