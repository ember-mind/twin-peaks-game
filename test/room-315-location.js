#!/usr/bin/env node
'use strict';

/* world-connections.gen.js — Red Room wake-up spawn and the Great Northern
 * corridor <-> room 315 hall, modelled on test/world-connections.gen.js.
 * Covers: redroom -> room_315 wake spawn + onEnter once flag, room_315 <->
 * hotel_gn hall both ways, held-input no-bounce, hotel_gn -> town still
 * works, save round-trip in room_315. Walks with the real Engine on
 * production maps. */

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
global.document = {
  body: { classList: { toggle: noop }, setAttribute: noop },
  getElementById: () => null,
  addEventListener: noop
};
const context = new Proxy(
  { measureText: (text) => ({ width: String(text).length * 5 }) },
  { get(target, key) { return key in target ? target[key] : noop; }, set() { return true; } }
);
const canvas = { width: 256, height: 192, getContext: () => context };
const js = (name) => path.join(__dirname, '..', 'js', name);

[
  'tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'retro-font.js',
  'engine.js', 'glue.js', 'location-connections.js', 'environment-reactions.js',
  'sheriffs-station-art.js', 'sheriffs-station-exterior-art.js',
  'sheriffs-station-scene.js', 'sheriffs-station-exterior-scene.js',
  'world-connections.gen.js', 'double-r-exterior-art.js', 'double-r-exterior-scene.js', 'double-r-location-production.js',
  'sheriffs-station-production.js', 'room-315-production.js', 'world-connections-production.js'
].forEach((name) => require(js(name)));

const G = global.GAME;
const E = G.Engine;

let saveCount = 0;
G.NarrativeProduction = {
  onClassicSave(snapshot) {
    saveCount++;
    global.localStorage.setItem('tp_save', JSON.stringify(snapshot));
    return { handled: true, ok: true };
  }
};

function frame() {
  now += 20;
  rafQueue.splice(0).forEach((fn) => fn(now));
}
function pump(ms) { for (let elapsed = 0; elapsed < ms; elapsed += 20) frame(); }
function keyDown(dir) { handlers.keydown({ code: 'Arrow' + dir[0].toUpperCase() + dir.slice(1), preventDefault: noop, repeat: false }); }
function keyUp(dir) { handlers.keyup({ code: 'Arrow' + dir[0].toUpperCase() + dir.slice(1) }); }
function settleFade() {
  let guard = 120;
  while (E.state.fadePhase !== 0 && guard--) frame();
  assert(guard > 0, 'fade settles');
}
function place(mapId, x, y, dir) {
  E.loadMap(mapId, x, y, dir);
  E.state.mode = 'play';
  E.state.dialogue = null;
  E.state.menu = false;
  E.state.fade = 0;
  E.state.fadePhase = 0;
  E.state.warp = null;
  E.state.flags.intro_town = true;
}
function tap(dir) {
  keyDown(dir);
  let guard = 20;
  while (!E.state.player.moving && E.state.fadePhase === 0 && guard--) frame();
  keyUp(dir);
  pump(280);
}
function cross(dir, expectedMap, expectedSpawn) {
  keyDown(dir);
  let guard = 160;
  while (E.state.fadePhase === 0 && guard--) frame();
  assert(guard > 0, 'movement reaches a connection trigger walking ' + dir);
  keyUp(dir);
  settleFade();
  assert.equal(E.state.mapId, expectedMap, 'crossing ' + dir + ' arrives on ' + expectedMap);
  assert.deepEqual([E.state.player.tx, E.state.player.ty, E.state.player.dir], expectedSpawn);
}

E.init(canvas);
E.start();

/* ---------------- 1. the hall connection is compiled into real doors --- */

assert.equal(G.Maps.room_315.doors['7,11'].to, 'hotel_gn');
assert.equal(G.Maps.hotel_gn.doors['14,1'].to, 'room_315');
assert.strictEqual(G.Maps.room_315.doors['7,11'].connectionId, 'great-northern-room-315-hall');
assert.strictEqual(G.Maps.hotel_gn.doors['14,1'].connectionId, 'great-northern-room-315-hall');

/* ---------------- 2. redroom -> room_315 wake spawn + onEnter once ------ */

place('redroom', 8, 10, 'up');
assert.equal(G.Maps.redroom.doors['8,11'].to, 'room_315');
cross('down', 'room_315', [2, 6, 'down']);
assert.equal(E.state.dialogue && E.state.dialogue.id, 'hotel_risveglio', 'onEnter fires hotel_risveglio on first arrival');
assert.equal(E.state.flags.intro_hotel, true, 'the once-flag is set as soon as onEnter fires');
while (E.state.dialogue) { handlers.keydown({ code: 'Enter', preventDefault: noop, repeat: false }); handlers.keyup({ code: 'Enter' }); pump(16); }
assert.equal(E.state.dialogue, null, 'the wake-up dialogue drains');

/* onEnter does not refire on a later arrival at the same spawn tile */
place('redroom', 8, 10, 'up');
cross('down', 'room_315', [2, 6, 'down']);
assert.equal(E.state.dialogue, null, 'onEnter does not refire once intro_hotel is set');

/* ---------------- 3. room_315 <-> hotel_gn hall, both ways -------------- */

place('room_315', 7, 10, 'up');
cross('down', 'hotel_gn', [14, 2, 'down']);
place('hotel_gn', 14, 2, 'down');
cross('up', 'room_315', [7, 10, 'up']);

/* ---------------- 4. held-input walking through the hall does not bounce */

place('room_315', 7, 10, 'up');
keyDown('down');
let guard = 160;
while (E.state.fadePhase === 0 && guard--) frame();
assert(guard > 0, 'held input reaches the hall trigger');
guard = 60;
while (E.state.fadePhase !== 0 && guard--) frame();
keyUp('down');
pump(120);
assert.equal(E.state.mapId, 'hotel_gn', 'held input carries the crossing through to hotel_gn');
assert.deepEqual([E.state.player.tx, E.state.player.ty], [14, 2]);
keyDown('down');
guard = 60;
while (E.state.player.ty !== 3 && guard--) frame();
keyUp('down');
pump(120);
assert(guard > 0, 'held input continues walking south from the arrival tile without bouncing back');
assert.equal(E.state.mapId, 'hotel_gn', 'the arrival tile does not bounce back into room_315');
assert.deepEqual([E.state.player.tx, E.state.player.ty], [14, 3]);

/* ---------------- 5. hotel_gn -> town still works ------------------------ */

place('hotel_gn', 8, 10, 'up');
cross('down', 'town', [9, 7, 'down']);

/* ---------------- 6. save round-trip in room_315 -------------------------- */

place('room_315', 7, 10, 'up');
E.state.clues = ['diario'];
E.state.flags.sogno_fatto = true;
const savesBefore = saveCount;
cross('down', 'hotel_gn', [14, 2, 'down']);
assert(saveCount > savesBefore, 'crossing out of room_315 performs a coordinated save');
const raw = global.localStorage.getItem('tp_save');
assert(raw, 'a save snapshot exists after crossing');
const parsed = JSON.parse(raw);
assert.equal(parsed.mapId, 'hotel_gn', 'the snapshot captures the map at the moment of the coordinated save');
const inspected = E.inspectClassicSaveState(parsed);
assert.equal(inspected.ok, true, 'the room_315 crossing snapshot is a valid classic save');
const restored = E.restoreClassicSave(parsed);
assert.equal(restored.ok, true, 'restoreClassicSave accepts the room_315 crossing snapshot');
assert.equal(E.state.mapId, parsed.mapId);
assert.deepEqual([E.state.player.tx, E.state.player.ty, E.state.player.dir], [parsed.tx, parsed.ty, parsed.dir]);
assert.equal(E.state.flags.sogno_fatto, true, 'restored state keeps flags set before the save');

/* Il modulo di produzione del finale dirotta la porta del sogno sul bosco e la
 * ripristina al reset: deve tornare alla stanza 315, non al vecchio letterale. */
if (typeof global.location === 'undefined') global.location = { search: '' };
require(js('narrative-finale-production.js'));
const FP = G.NarrativeFinaleProduction;
G.Maps.redroom.doors['8,11'] = { to: 'woods', tx: 14, ty: 5, dir: 'down' };
FP.reset();
assert.deepEqual(G.Maps.redroom.doors['8,11'], { to: 'room_315', tx: 2, ty: 6, dir: 'down' },
  'finale reset restores the canonical dream exit into room_315');

console.log('ROOM-315-LOCATION-PASS finale dream-exit restore, redroom wake spawn + onEnter once, hall round trip, no arrival bounce, hotel_gn town exit, save round-trip');
