#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const noop = () => {};
let now = 0;
let rafQueue = [];
const handlers = {};
let storageWrites = 0;

global.window = global;
global.performance = { now: () => now };
global.requestAnimationFrame = (callback) => { rafQueue.push(callback); };
global.setInterval = () => 0;
global.addEventListener = (type, callback) => { handlers[type] = callback; };
global.localStorage = {
  getItem: () => null,
  setItem: () => { storageWrites++; },
  removeItem: noop
};

const renderCalls = [];
const canvasContext = new Proxy({
  fillStyle: '#000000',
  strokeStyle: '#000000',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  imageSmoothingEnabled: true,
  measureText: (text) => ({ width: String(text).length * 5 }),
  fillRect(x, y, width, height) {
    renderCalls.push({ op: 'fillRect', args: [x, y, width, height], color: this.fillStyle });
  },
  drawImage() {
    renderCalls.push({ op: 'drawImage', args: Array.from(arguments) });
  }
}, {
  get(target, key) { return key in target ? target[key] : noop; },
  set(target, key, value) { target[key] = value; return true; }
});
const canvas = { width: 9, height: 9, getContext: () => canvasContext };

global.document = {
  body: { classList: { toggle: noop }, setAttribute: noop },
  getElementById: () => null,
  addEventListener: noop
};
global.GAME = {};

function load(name) {
  return require(path.join(root, 'js', name));
}

[
  'tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'retro-font.js',
  'portraits.js', 'gold-tone.js', 'engine.js', 'scene-objects.gen.js', 'glue.js', 'retro.js',
  'retro-cast-matrices-a.js', 'retro-cast-matrices-b.js', 'retro-authored.js'
].forEach(load);
load('sheriffs-station-art.js');
load('sheriffs-station-scene.js');
// Named bodies come from Cast Presence since b529711 (glue.js NPCS is empty): sync them through the adapter, as test/smoke.js does.
['narrative-runtime.js', 'narrative-data.gen.js', 'cast-presence.js', 'narrative-bootstrap.js', 'narrative-engine-adapter.js'].forEach(load);
function syncCast(flags) {
  const G2 = global.GAME, D = G2.NarrativeData, NS = G2.NarrativeRuntime.createState();
  Object.assign(NS.flags, flags || {});
  G2.NarrativeAdapter.enable({ mission: D.missions.M4, missions: [D.missions.M4, D.missions.M5, D.missions.M6, D.missions.M8, D.missions.M9], state: NS, container: {} });
  G2.NarrativeAdapter.disable();
}
global.GAME.installNarrativeCatalogs({ data: global.GAME.NarrativeData, runtime: global.GAME.NarrativeRuntime });
syncCast();

const G = global.GAME;
const Engine = G.Engine;
const Scene = G.SheriffsStationScene;
const Art = G.SheriffsStationArt;
const MAP_ID = 'sheriff';
const priorCalls = { tile: [], structures: [], foreground: [], palette: [] };
const prior = {
  tile: G.Sprites.drawTile,
  structures: G.sprites.drawStructures,
  foreground: G.sprites.drawForegroundStructures,
  palette: G.Retro2D.limitBackgroundPalettes
};

G.Sprites.drawTile = function () { priorCalls.tile.push({ self: this, args: Array.from(arguments) }); return 'tile-prior'; };
G.sprites.drawStructures = function () { priorCalls.structures.push({ self: this, args: Array.from(arguments) }); return 'structures-prior'; };
G.sprites.drawForegroundStructures = function () { priorCalls.foreground.push({ self: this, args: Array.from(arguments) }); return 'foreground-prior'; };
G.Retro2D.limitBackgroundPalettes = function () { priorCalls.palette.push({ self: this, args: Array.from(arguments) }); return 'palette-prior'; };

const installedMap = Scene.install();
const installedHooks = {
  tile: G.Sprites.drawTile,
  structures: G.sprites.drawStructures,
  foreground: G.sprites.drawForegroundStructures,
  palette: G.Retro2D.limitBackgroundPalettes
};
assert.strictEqual(Scene.install(), installedMap, 'second install returns the same map');
assert.strictEqual(G.Sprites.drawTile, installedHooks.tile, 'second install does not wrap tile hook again');
assert.strictEqual(G.sprites.drawStructures, installedHooks.structures, 'second install does not wrap structure hook again');
assert.strictEqual(G.sprites.drawForegroundStructures, installedHooks.foreground, 'second install does not wrap depth hook again');
assert.strictEqual(G.Retro2D.limitBackgroundPalettes, installedHooks.palette, 'second install does not wrap palette hook again');

const foreignThis = { id: 'foreign-this' };
const foreignMap = { id: 'foreign-map' };
assert.equal(G.Sprites.drawTile.call(foreignThis, canvasContext, '.', 1, 2, 3, 4, ['.'], { mapId: 'foreign-map' }), 'tile-prior');
assert.equal(G.sprites.drawStructures.call(foreignThis, canvasContext, foreignMap, 5, 6, { marker: 1 }), 'structures-prior');
assert.equal(G.sprites.drawForegroundStructures.call(foreignThis, canvasContext, foreignMap, 7, 8, { forestDepthMin: 9, forestDepthMax: 10 }), 'foreground-prior');
assert.equal(G.Retro2D.limitBackgroundPalettes.call(foreignThis, canvasContext, 1, 2, 3, 4, 'foreign-map'), 'palette-prior');
for (const calls of Object.values(priorCalls)) {
  assert.equal(calls.length, 1, 'foreign hook delegates exactly once');
  assert.strictEqual(calls[0].self, foreignThis, 'foreign hook preserves receiver');
}

let ownDraws = 0;
let ownForegrounds = 0;
const artDraw = Art.draw;
const artForeground = Art.foreground;
Art.draw = function () { ownDraws++; return artDraw.apply(this, arguments); };
Art.foreground = function () { ownForegrounds++; return artForeground.apply(this, arguments); };
assert.equal(G.Sprites.drawTile(canvasContext, '.', 0, 0, 0, 0, ['.'], { mapId: MAP_ID }), undefined);
assert.equal(G.sprites.drawStructures(canvasContext, installedMap, 0, 0, {}), undefined);
assert.equal(G.sprites.drawForegroundStructures(canvasContext, installedMap, 0, 0, { forestDepthMin: 80, forestDepthMax: 112 }), undefined);
assert.equal(G.Retro2D.limitBackgroundPalettes(canvasContext, 0, 0, 256, 192, MAP_ID), undefined);
assert.equal(ownDraws, 1, 'own structure hook invokes sheriff art');
assert.equal(ownForegrounds, 1, 'own depth hook invokes sheriff foreground art');
for (const calls of Object.values(priorCalls)) assert.equal(calls.length, 1, 'own hooks do not delegate');

assert.equal(Scene.mapId, MAP_ID);
const stationMap = G.Maps[MAP_ID];
assert.strictEqual(installedMap, stationMap, 'install keeps the glue-owned map record');
assert.deepEqual(stationMap.rows, Scene.rows, 'maps.js geometry matches the authored footprints');
assert.equal(stationMap.width, 16);
assert.equal(stationMap.height, 12);
assert.equal(stationMap.width * 16, 256, 'map spans the full native viewport width');
assert.equal(stationMap.rows.every((row) => row.length === stationMap.width), true);
assert.equal(stationMap.indoor, true);
assert.deepEqual(stationMap.doors, {}, 'rear door is closed scenery; entrance doors come from the connection');
// The registry is a set (docs/cast-continuity-contract-v0.1.md:48): resolver order is by id, so compare sorted.
assert.deepEqual(stationMap.npcs.map((npc) => npc.id).sort(), ['andy', 'hawk', 'lucy', 'truman'],
  'narrative cast is owned by Cast Presence (baseline)');
syncCast({ atto5: true });
assert.deepEqual(stationMap.npcs.map((npc) => npc.id).sort(), ['andy', 'hawk', 'leland', 'lucy', 'truman'],
  'Leland joins the station cast in act 5 (window ACT5_LELAND_STATION)');
syncCast();

const isSolid = (x, y) => G.Maps.isSolid(MAP_ID, x, y, { clues: [], flags: {} });
const freeTiles = [];
for (let y = 0; y < G.Maps[MAP_ID].height; y++) {
  for (let x = 0; x < G.Maps[MAP_ID].width; x++) if (!isSolid(x, y)) freeTiles.push([x, y]);
}
const entrance = Scene.layout.targets.entrance;
const reachable = new Set([entrance.x + ',' + entrance.y]);
const bfsQueue = [[entrance.x, entrance.y]];
while (bfsQueue.length) {
  const [x, y] = bfsQueue.shift();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx;
    const ny = y + dy;
    const key = nx + ',' + ny;
    if (!isSolid(nx, ny) && !reachable.has(key)) {
      reachable.add(key);
      bfsQueue.push([nx, ny]);
    }
  }
}
assert.equal(reachable.size, freeTiles.length, 'every free tile is connected to the entrance');
for (let y = 5; y <= 10; y++) {
  for (let x = 6; x <= 9; x++) assert.equal(isSolid(x, y), false, 'four-tile main aisle remains open');
}
for (let x = 1; x <= 3; x++) {
  assert.equal(isSolid(x, 3), true, 'wall-backed files leave no hidden walk strip');
}
for (const [name, target] of Object.entries(Scene.layout.targets)) {
  assert.equal(isSolid(target.x, target.y), false, name + ' target is walkable');
  assert(reachable.has(target.x + ',' + target.y), name + ' target is reachable');
}

function newRecordingContext() {
  const calls = [];
  const context = new Proxy({
    fillStyle: '#000000',
    globalAlpha: 1,
    fillRect(x, y, width, height) { calls.push({ args: [x, y, width, height], color: this.fillStyle }); }
  }, {
    get(target, key) { return key in target ? target[key] : noop; },
    set(target, key, value) { target[key] = value; return true; }
  });
  return { calls, context };
}

const authoredPixels = newRecordingContext();
artDraw(authoredPixels.context, 0, 0);
assert(authoredPixels.calls.length > 150, 'scene paints a substantial authored native frame');
assert(authoredPixels.calls.every((call) => call.args.every(Number.isInteger)), 'all authored draw calls use integer coordinates and dimensions');

function foregroundCalls(min, max) {
  const recording = newRecordingContext();
  artForeground(recording.context, 0, 0, min, max);
  return recording.calls;
}
function hasRect(calls, x, y, width, height) {
  return calls.some((call) =>
    call.args[0] === x && call.args[1] === y && call.args[2] === width && call.args[3] === height);
}
const depth80 = foregroundCalls(80, 112);
assert(hasRect(depth80, 17, 43, 15, 37), '80px interval selects file cabinets');
assert(hasRect(depth80, 96, 55, 64, 9), '80px interval selects sheriff desk');
assert(!hasRect(depth80, 64, 87, 16, 25), 'half-open interval excludes furniture at 112px');
const depth112 = foregroundCalls(112, 128);
assert(hasRect(depth112, 64, 87, 16, 25), '112px interval selects reception return');
assert(hasRect(depth112, 176, 87, 48, 8), '112px interval selects north desk');
assert(!hasRect(depth112, 16, 98, 64, 9), '112px interval excludes reception at 128px');
assert.equal(foregroundCalls(81, 111).length, 0, 'empty depth interval paints no furniture');

Engine.init(canvas, null);
assert.deepEqual([canvas.width, canvas.height], [256, 192], 'engine restores the native canvas dimensions');
Engine.start();
Engine.state.mode = 'title';
Engine.loadMap(MAP_ID, entrance.x, entrance.y, 'up');
Engine.state.mode = 'play';
Engine.state.fade = 0;
Engine.state.fadePhase = 0;
Engine.state.dialogue = null;
Engine.state.menu = false;
Engine.state.npcs = [];

function frame() {
  now += 20;
  const callbacks = rafQueue.splice(0);
  callbacks.forEach((callback) => callback(now));
}
function tap(direction) {
  const code = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[direction];
  const before = [Engine.state.player.tx, Engine.state.player.ty];
  handlers.keydown({ code, preventDefault: noop, repeat: false });
  handlers.keyup({ code });
  let guard = 40;
  while (guard-- && (Engine.state.player.moving || (Engine.state.player.tx === before[0] && Engine.state.player.ty === before[1]))) frame();
  while (Engine.state.player.moving && guard-- > -40) frame();
  return before[0] !== Engine.state.player.tx || before[1] !== Engine.state.player.ty;
}
function routeTo(target) {
  const start = [Engine.state.player.tx, Engine.state.player.ty];
  const queue = [{ point: start, route: [] }];
  const seen = new Set([start.join(',')]);
  const directions = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
  while (queue.length) {
    const current = queue.shift();
    if (current.point[0] === target.x && current.point[1] === target.y) return current.route;
    for (const [direction, dx, dy] of directions) {
      const x = current.point[0] + dx;
      const y = current.point[1] + dy;
      const key = x + ',' + y;
      if (!seen.has(key) && !isSolid(x, y)) {
        seen.add(key);
        queue.push({ point: [x, y], route: current.route.concat(direction) });
      }
    }
  }
  return null;
}
function walkTo(name) {
  const target = Scene.layout.targets[name];
  const route = routeTo(target);
  assert(route, 'route exists to ' + name);
  for (const direction of route) assert.equal(tap(direction), true, 'real keyboard step moves toward ' + name);
  assert.deepEqual([Engine.state.player.tx, Engine.state.player.ty], [target.x, target.y], 'real engine arrives at ' + name);
}

for (const name of ['receptionStaff', 'rightDesk', 'files', 'rearDoor', 'depthBehind', 'depthFront']) walkTo(name);

walkTo('files');
let before = [Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty];
assert.equal(tap('up'), false, 'file cabinet rejects movement');
assert.deepEqual([Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty], before, 'prop collision leaves player and map unchanged');

walkTo('rightDesk');
before = [Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty];
assert.equal(tap('up'), false, 'north desk rejects movement');
assert.deepEqual([Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty], before, 'desk collision leaves player and map unchanged');

walkTo('rearDoor');
assert.equal(tap('up'), true, 'player reaches the rear-door threshold');
assert.deepEqual([Engine.state.player.tx, Engine.state.player.ty], [13, 3]);
before = [Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty];
assert.equal(tap('up'), false, 'closed rear door rejects movement');
assert.deepEqual([Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty], before, 'closed door causes no transition');
assert.equal(storageWrites, 0, 'native scene traversal never writes a save');

const engineDepthIntervals = [];
Art.foreground = function (ctx, cx, cy, min, max) {
  engineDepthIntervals.push([min, max]);
  return artForeground.apply(this, arguments);
};
const playerDrawCalls = [];
const drawChar = G.Sprites.drawChar;
G.Sprites.drawChar = function () {
  playerDrawCalls.push(Array.from(arguments));
  return drawChar.apply(this, arguments);
};
Engine.state.mode = 'title';
Engine.loadMap(MAP_ID, Scene.layout.targets.depthBehind.x, Scene.layout.targets.depthBehind.y, 'down');
Engine.state.mode = 'play';
frame();
assert(engineDepthIntervals.some(([min, max]) => min === 64 && max === 80), 'player foreground interval ends at the prototype NPC foot depth');
assert(engineDepthIntervals.some(([min, max]) => min === 80 && max === 112), 'Truman foreground interval ends at Lucy foot depth');
assert(engineDepthIntervals.some(([min, max]) => min === 112 && max === 128), 'Lucy foreground interval ends at Andy foot depth');
assert(engineDepthIntervals.some(([min, max]) => min === 128 && max === 144), 'Andy foreground interval ends at Hawk foot depth');
assert(engineDepthIntervals.some(([min, max]) => min === 144 && max === Infinity), 'Hawk foreground interval completes the remaining room depth');
assert(playerDrawCalls.some((args) =>
  args[1] === 96 && args[2] === 48 && args[3] === G.Sprites.CHARS.cooper &&
  args[10] && args[10].mapId === MAP_ID), 'engine renders unchanged Cooper at the tile foot anchor');

if (process.argv.includes('--audit-frozen')) {
  const frozen = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/sheriffs-station-main-interior-v02/validation/frozen-before.json'), 'utf8'));
  for (const [file, expected] of Object.entries(frozen)) {
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
    assert.equal(actual, expected, file + ' remains unchanged from the frozen pre-build baseline');
  }
}
assert.equal(G.Retro2D.castRenderer.id, 'heartgold-atlas-r116', 'production Cooper atlas renderer remains active');

console.log('SHERIFFS-STATION-NATIVE-PASS production hooks, collision, connected routes, keyboard movement, native pixels, depth intervals, Cooper anchor' +
  (process.argv.includes('--audit-frozen') ? ', frozen core/atlas audit' : ''));
