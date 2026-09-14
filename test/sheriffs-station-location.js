#!/usr/bin/env node
'use strict';

/* Gate della verticale Town -> piazzale distretto -> interno canonico
 * ('sheriff') e ritorno, piu' l'uscita del piazzale Double R verso Town.
 * Cammina con il vero Engine sulle mappe di produzione. */

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

[
  'tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'retro-font.js',
  'engine.js', 'glue.js', 'ambient-life.js', 'character-activity.js',
  'environment-reactions.js', 'ambient-life-scenes.js', 'location-connections.js',
   'world-connections.gen.js',
    'double-r-exterior-art.js', 'double-r-exterior-scene.js',
  'double-r-location-production.js',
  'sheriffs-station-art.js', 'sheriffs-station-exterior-art.js',
  'sheriffs-station-scene.js', 'sheriffs-station-exterior-scene.js', 'sheriffs-station-production.js',
  'character-life-scenes.js', 'world-connections-production.js',
  'world-engine.js', 'world-catalog.js'
].forEach((name) => require(js(name)));

const G = global.GAME;
const E = G.Engine;
const World = G.World;

let failSave = false;
let saveCount = 0;
G.NarrativeProduction = {
  onClassicSave() {
    saveCount++;
    return failSave ? { handled: true, ok: false, error: 'fixture disk full' } : { handled: true, ok: true };
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

/* ---------------- 1. le connessioni sono compilate in porte reali ---------- */

const installed = global.GAME.LocationConnections.connectionRecordsFor(['double-r-front-entrance','town-double-r-lot','sheriffs-station-front-entrance','town-sheriffs-station-lot'])
  .map((connection) => connection.id);
assert.deepEqual(installed, [
  'double-r-front-entrance', 'town-double-r-lot',
  'sheriffs-station-front-entrance', 'town-sheriffs-station-lot'
]);
const cataloged = World.getConnections();
for (const id of installed) {
  assert(cataloged.includes(id), id + ' is listed by the World catalog');
}
assert.equal(G.Maps.town.doors['12,20'].connectionId, 'town-sheriffs-station-lot');
assert.equal(G.Maps.town.doors['42,20'].connectionId, 'town-double-r-lot');
assert.strictEqual(G.Maps.sheriff.doors['7,11'], G.Maps.sheriff.doors['8,11']);
assert.equal(G.Maps.sheriff.doors['7,11'].to, 'sheriffs_station_exterior');

E.init(canvas);
E.start();

/* ---------------- 2. Town -> piazzale -> interno ---------------------------- */

place('town', 12, 21, 'up');
cross('up', 'sheriffs_station_exterior', [7, 10, 'up']);

tap('up'); tap('up'); tap('up');
assert.deepEqual([E.state.player.tx, E.state.player.ty], [7, 7], 'the lot is crossed on foot');
cross('up', 'sheriff', [7, 10, 'up']);

const cast = E.state.npcs.filter((npc) => E.npcActive(npc, E.state));
assert.deepEqual(cast.map((npc) => [npc.id, npc.x, npc.y]), [
  ['truman', 10, 4], ['andy', 10, 7], ['hawk', 12, 8], ['lucy', 2, 6]
], 'Truman, Andy, Hawk and Lucy staff the canonical station');
assert.equal(cast.some((npc) => npc.id === 'leland'), false, 'Leland only appears in act 5');
assert(E.state.npcs.some((npc) => npc.id === 'hawk'), 'Hawk is back at the station');

/* ---------------- 3. interno -> piazzale, senza rimbalzo ------------------- */

cross('down', 'sheriffs_station_exterior', [7, 7, 'down']);
keyDown('down');
let guard = 60;
while (E.state.player.ty !== 8 && guard--) frame();
keyUp('down');
pump(120);
assert(guard > 0, 'held input walks south from the lot spawn');
assert.equal(E.state.mapId, 'sheriffs_station_exterior', 'the arrival tile does not bounce back inside');
assert.deepEqual([E.state.player.tx, E.state.player.ty], [7, 8]);

/* ---------------- 4. piazzale -> Town -------------------------------------- */

cross('down', 'town', [12, 21, 'down']);

/* ---------------- 5. Double R: il piazzale non e' piu' un vicolo cieco ----- */

place('town', 42, 21, 'up');
cross('up', 'double_r_exterior_prototype', [6, 10, 'up']);
tap('down');
assert.deepEqual([E.state.player.tx, E.state.player.ty], [6, 11], 'the Double R lot reaches its south exit tile');
settleFade();
assert.equal(E.state.mapId, 'town');
assert.deepEqual([E.state.player.tx, E.state.player.ty, E.state.player.dir], [42, 21, 'down']);

/* ---------------- 6. rollback del salvataggio su una soglia del distretto -- */

place('sheriffs_station_exterior', 7, 7, 'up');
const savesBefore = saveCount;
failSave = true;
cross('up', 'sheriffs_station_exterior', [7, 6, 'up']);
assert(saveCount > savesBefore, 'the crossing attempted a coordinated save');
assert.match(E.lastSaveError, /fixture disk full/);
pump(500);
assert.deepEqual([E.state.player.tx, E.state.player.ty], [7, 6], 'rollback does not auto-retry on the trigger');
failSave = false;
tap('down');
assert.deepEqual([E.state.player.tx, E.state.player.ty], [7, 7], 'player steps away before retry');
cross('up', 'sheriff', [7, 10, 'up']);

console.log('SHERIFFS-STATION-LOCATION-PASS town <-> lot <-> canonical station round trip, station cast, no arrival bounce, Double R town exit, catalog parity, save rollback');
