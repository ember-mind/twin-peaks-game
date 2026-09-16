#!/usr/bin/env node
'use strict';

// test/hospital-native.js — contratto del reparto di degenza (Calhoun
// Memorial): geometria authored == js/maps.js, parita' footprints/definitions,
// pixel nativi interi, sospensione mirata della sprite di Ronette, e i due
// ordini di valore della stanza (lenzuola di Ronette sopra tutto, pavimento
// sotto tutto) misurati sulla cattura nativa rivista.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

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

const canvasContext = new Proxy({
  fillStyle: '#000000',
  strokeStyle: '#000000',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  imageSmoothingEnabled: true,
  measureText: (text) => ({ width: String(text).length * 5 }),
  fillRect: noop,
  drawImage: noop
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

function load(name) { return require(path.join(root, 'js', name)); }

[
  'tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'retro-font.js',
  'portraits.js', 'gold-tone.js', 'engine.js', 'scene-objects.gen.js', 'glue.js', 'retro.js',
  'retro-cast-matrices-a.js', 'retro-cast-matrices-b.js', 'retro-authored.js'
].forEach(load);
load('hospital-art.js');
load('hospital-scene.js');
// Doors come from the connection registry since M5 (js/maps.js carries none).
load('location-connections.js');
load('world-connections.gen.js');
global.GAME.LocationConnections.connectionRecordsFor(['town-hospital']).forEach((c) => global.GAME.LocationConnections.install(c, global.GAME.Maps));

const G = global.GAME;
const Engine = G.Engine;
const Scene = G.HospitalScene;
const Art = G.HospitalArt;
const MAP_ID = 'hospital';

// ------------------------------------------------- hook di produzione
const priorCalls = { tile: [], structures: [], foreground: [], palette: [], char: [] };
G.Sprites.drawTile = function () { priorCalls.tile.push({ self: this }); return 'tile-prior'; };
G.sprites.drawStructures = function () { priorCalls.structures.push({ self: this }); return 'structures-prior'; };
G.sprites.drawForegroundStructures = function () { priorCalls.foreground.push({ self: this }); return 'foreground-prior'; };
G.Retro2D.limitBackgroundPalettes = function () { priorCalls.palette.push({ self: this }); return 'palette-prior'; };
G.Sprites.drawChar = function () { priorCalls.char.push({ self: this, args: [...arguments] }); return 'char-prior'; };

const installedMap = Scene.install();
const installedHooks = {
  tile: G.Sprites.drawTile,
  structures: G.sprites.drawStructures,
  foreground: G.sprites.drawForegroundStructures,
  palette: G.Retro2D.limitBackgroundPalettes,
  char: G.Sprites.drawChar
};
assert.strictEqual(Scene.install(), installedMap, 'second install returns the same map');
assert.strictEqual(G.Sprites.drawTile, installedHooks.tile, 'second install does not wrap tile hook again');
assert.strictEqual(G.sprites.drawStructures, installedHooks.structures, 'second install does not wrap structure hook again');
assert.strictEqual(G.sprites.drawForegroundStructures, installedHooks.foreground, 'second install does not wrap depth hook again');
assert.strictEqual(G.Retro2D.limitBackgroundPalettes, installedHooks.palette, 'second install does not wrap palette hook again');
assert.strictEqual(G.Sprites.drawChar, installedHooks.char, 'second install does not wrap the actor hook again');

const foreignThis = { id: 'foreign-this' };
const foreignMap = { id: 'foreign-map' };
assert.equal(G.Sprites.drawTile.call(foreignThis, canvasContext, '.', 1, 2, 3, 4, ['.'], { mapId: 'foreign-map' }), 'tile-prior');
assert.equal(G.sprites.drawStructures.call(foreignThis, canvasContext, foreignMap, 5, 6, {}), 'structures-prior');
assert.equal(G.sprites.drawForegroundStructures.call(foreignThis, canvasContext, foreignMap, 7, 8, {}), 'foreground-prior');
assert.equal(G.Retro2D.limitBackgroundPalettes.call(foreignThis, canvasContext, 1, 2, 3, 4, 'foreign-map'), 'palette-prior');
assert.equal(G.Sprites.drawChar.call(foreignThis, canvasContext, 0, 0, null, 'down', 0, 1, false, false, 0,
  { mapId: 'foreign-map', npcId: 'ronette' }), 'char-prior');
for (const [name, calls] of Object.entries(priorCalls)) {
  assert.equal(calls.length, 1, name + ' foreign hook delegates exactly once');
  assert.strictEqual(calls[0].self, foreignThis, name + ' foreign hook preserves receiver');
}

let ownDraws = 0;
let ownForegrounds = 0;
const artDraw = Art.draw;
const artForeground = Art.foreground;
Art.draw = function () { ownDraws++; return artDraw.apply(this, arguments); };
Art.foreground = function () { ownForegrounds++; return artForeground.apply(this, arguments); };
assert.equal(G.Sprites.drawTile(canvasContext, '.', 0, 0, 0, 0, ['.'], { mapId: MAP_ID }), undefined);
assert.equal(G.sprites.drawStructures(canvasContext, installedMap, 0, 0, {}), undefined);
assert.equal(G.sprites.drawForegroundStructures(canvasContext, installedMap, 0, 0, { forestDepthMin: 60, forestDepthMax: 100 }), undefined);
assert.equal(G.Retro2D.limitBackgroundPalettes(canvasContext, 0, 0, 256, 192, MAP_ID), undefined);
assert.equal(ownDraws, 1, 'own structure hook invokes the hospital art');
assert.equal(ownForegrounds, 1, 'own depth hook invokes the hospital foreground art');
for (const [name, calls] of Object.entries(priorCalls)) {
  if (name === 'char') continue;
  assert.equal(calls.length, 1, name + ' own hook does not delegate');
}

// Ronette e' distesa nel letto: la sua sprite in piedi non viene mai disegnata
// su questa mappa, tutti gli altri attori passano al renderer di produzione.
assert.equal(G.Sprites.drawChar(canvasContext, 0, 0, null, 'down', 0, 1, false, false, 0,
  { mapId: MAP_ID, npcId: 'ronette' }), undefined, 'ronette is suppressed on the ward');
assert.equal(priorCalls.char.length, 1, 'the suppressed actor never reaches the renderer');
assert.equal(G.Sprites.drawChar(canvasContext, 0, 0, null, 'down', 0, 1, false, false, 0,
  { mapId: MAP_ID, npcId: 'gerard' }), 'char-prior', 'gerard still draws on the ward');
assert.equal(G.Sprites.drawChar(canvasContext, 0, 0, null, 'down', 0, 1, false, false, 0,
  { mapId: MAP_ID, npcId: 'cooper' }), 'char-prior', 'the player still draws on the ward');
assert.equal(G.Sprites.drawChar(canvasContext, 0, 0, null, 'down', 0, 1, false, false, 0,
  { mapId: 'diner', npcId: 'ronette' }), 'char-prior', 'ronette is only suppressed on the ward');
assert.equal(G.Sprites.drawChar(canvasContext, 0, 0, null, 'down', 0, 1, false, false, 0), 'char-prior',
  'a call without environment still reaches the renderer');
assert.equal(priorCalls.char.length, 5, 'every non suppressed actor delegates exactly once');

// ---------------------------------------------------------------- geometria
assert.equal(Scene.mapId, MAP_ID);
const wardMap = G.Maps[MAP_ID];
assert.strictEqual(installedMap, wardMap, 'install keeps the glue-owned map record');
assert.deepEqual(wardMap.rows, Scene.rows, 'maps.js geometry matches the authored footprints');
assert.equal(wardMap.width, 16);
assert.equal(wardMap.height, 12);
assert.equal(wardMap.width * 16, 256, 'map spans the full native viewport width');
assert.equal(wardMap.rows.every((row) => row.length === wardMap.width), true);
assert.equal(wardMap.indoor, true);
assert.equal(wardMap.rows[0], 'TTTTTTTTTTTTTTTT', 'the 48px north wall face keeps rows 0-2 solid');
assert.equal(wardMap.rows[1], 'TTTTTTTTTTTTTTTT');
assert.equal(wardMap.rows[2], 'TTTTTTTTTTTTTTTT');

// footprints <-> definitions: stessi id, stesse celle, stesso footY.
const artIds = Art.definitions.map((prop) => prop.id).sort();
const sceneIds = Object.keys(Scene.footprints).sort();
assert.deepEqual(artIds, sceneIds, 'art definitions and scene footprints name the same props');
for (const prop of Art.definitions) {
  const cells = Scene.footprints[prop.id];
  const key = (cell) => cell[0] + ',' + cell[1];
  assert.deepEqual(prop.cells.map(key).sort(), cells.map(key).sort(),
    prop.id + ' occupies the same cells in art and scene');
  const southRow = Math.max(...cells.map((cell) => cell[1]));
  assert.equal(prop.footY, (southRow + 1) * 16, prop.id + ' footY is the south edge of its footprint');
  assert.equal(prop.bounds.length, 4, prop.id + ' declares pixel bounds');
  assert.equal(prop.shadow.length, 4, prop.id + ' declares a contact shadow band');
  assert(prop.bounds.every(Number.isInteger) && prop.shadow.every(Number.isInteger),
    prop.id + ' bounds and shadow are integer rectangles');
}
assert.equal(Art.definitions.length, 6, 'six grounded props: everything else is architecture');
assert.equal(Scene.footprints.ronetteBed.length, 6, 'Ronette bed covers two columns over three rows');
assert.equal(Scene.footprints.gerardBed.length, 6, 'Gerard bed covers two columns over three rows');
assert.deepEqual(Scene.footprints.curtain, [[8, 3], [8, 4], [8, 5]], 'the curtain divides the two beds');
assert.equal(Art.doorFoot, 192, 'the door frame sorts at the south wall foot line');

// ------------------------------------------------------- collisione e rotte
const isSolid = (x, y) => G.Maps.isSolid(MAP_ID, x, y, { clues: [], flags: {} });
const freeTiles = [];
for (let y = 0; y < wardMap.height; y++) {
  for (let x = 0; x < wardMap.width; x++) if (!isSolid(x, y)) freeTiles.push([x, y]);
}
const entrance = Scene.targets.entrance;
assert.deepEqual([entrance.x, entrance.y], [7, 10], 'the ward spawn is the door approach tile');
const reachable = new Set([entrance.x + ',' + entrance.y]);
const bfsQueue = [[entrance.x, entrance.y]];
while (bfsQueue.length) {
  const [x, y] = bfsQueue.shift();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx;
    const ny = y + dy;
    const key = nx + ',' + ny;
    if (!isSolid(nx, ny) && !reachable.has(key)) { reachable.add(key); bfsQueue.push([nx, ny]); }
  }
}
assert.equal(reachable.size, freeTiles.length, 'every free tile is connected to the ward door');
assert.equal(isSolid(7, 10), false, 'the spawn tile is walkable');
assert.equal(isSolid(7, 11), false, 'the west door leaf tile is walkable');
assert.equal(isSolid(8, 11), false, 'the east door leaf tile is walkable');
for (const leaf of ['7,11', '8,11']) {
  const door = wardMap.doors && wardMap.doors[leaf];
  assert(door && typeof door.to === 'string', leaf + ' is a valid door record');
  assert(Number.isInteger(door.tx) && Number.isInteger(door.ty), leaf + ' door lands on integer tiles');
}
for (let y = 6; y <= 10; y++) {
  for (let x = 5; x <= 9; x++) assert.equal(isSolid(x, y), false, 'the door approach column stays clear');
}
for (let y = 6; y <= 10; y++) {
  for (let x = 2; x <= 11; x++) {
    if (y === 8 && x > 11) continue;
    assert.equal(isSolid(x, y), false, 'rows 6-10, columns 2-11 keep the negative space open');
  }
}

// Attori narrativi: Ronette sul letto (tile solido, la figura e' arredo),
// Gerard e l'infermiera in piedi. Ognuno deve avere almeno un tile di
// avvicinamento calpestabile e raggiungibile dall'ingresso.
const actors = [
  { id: 'ronette', x: 3, y: 5, solid: true },
  { id: 'gerard', x: 11, y: 4, solid: false },
  { id: 'infermiera', x: 11, y: 8, solid: false }
];
for (const actor of actors) {
  assert.equal(isSolid(actor.x, actor.y), actor.solid,
    actor.id + ' tile solidity matches its pose');
  const approaches = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dx, dy]) => [actor.x + dx, actor.y + dy])
    .filter(([x, y]) => !isSolid(x, y) && reachable.has(x + ',' + y));
  assert(approaches.length > 0, actor.id + ' has a reachable adjacent approach tile');
}
for (const [name, target] of Object.entries(Scene.targets)) {
  assert.equal(isSolid(target.x, target.y), false, name + ' target is walkable');
  assert(reachable.has(target.x + ',' + target.y), name + ' target is reachable');
}

// ------------------------------------------------------------ pixel nativi
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
assert(authoredPixels.calls.every((call) => call.args.every(Number.isInteger)),
  'all authored draw calls use integer coordinates and dimensions');
assert(authoredPixels.calls.every((call) => /^#[0-9a-f]{6}$/i.test(call.color)),
  'every authored rectangle is a flat opaque colour, never a gradient or pattern');

function foregroundCalls(min, max) {
  const recording = newRecordingContext();
  artForeground(recording.context, 0, 0, min, max);
  return recording.calls;
}
function hasRect(calls, x, y, width, height) {
  return calls.some((call) =>
    call.args[0] === x && call.args[1] === y && call.args[2] === width && call.args[3] === height);
}
const depth64 = foregroundCalls(64, 96);
assert(hasRect(depth64, 19, 45, 23, 19), '64px interval selects the monitor cart');
assert(!hasRect(depth64, 48, 42, 32, 54), 'half-open interval excludes the beds at 96px');
const depth96 = foregroundCalls(96, 112);
assert(hasRect(depth96, 48, 42, 32, 54), '96px interval selects Ronette bed');
assert(hasRect(depth96, 144, 42, 32, 54), '96px interval selects Gerard bed');
assert(hasRect(depth96, 132, 9, 16, 2), '96px interval selects the curtain head');
assert(!hasRect(depth96, 19, 89, 10, 11), '96px interval excludes the chair at 112px');
const depth112 = foregroundCalls(112, 144);
assert(hasRect(depth112, 19, 89, 10, 11), '112px interval selects the waiting chair');
assert(!hasRect(depth112, 192, 118, 48, 26), '112px interval excludes the counter at 144px');
const depth144 = foregroundCalls(144, 192);
assert(hasRect(depth144, 192, 118, 48, 26), '144px interval selects the nurse counter');
assert(!hasRect(depth144, 109, 176, 38, 3), '144px interval excludes the door frame at 192px');
const depthDoor = foregroundCalls(192, Infinity);
assert(hasRect(depthDoor, 109, 176, 38, 3), 'the south wall band repaints the door header over the player');
assert(hasRect(depthDoor, 126, 176, 4, 16), 'the door mullion repaints over the player in the doorway');
assert(!hasRect(depthDoor, 192, 118, 48, 26), 'the door band carries no furniture');
assert.equal(foregroundCalls(65, 95).length, 0, 'empty depth interval paints nothing');

// ------------------------------------------------- motore reale e tastiera
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
  rafQueue.splice(0).forEach((callback) => callback(now));
}
function tap(direction) {
  const code = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[direction];
  const before = [Engine.state.player.tx, Engine.state.player.ty];
  handlers.keydown({ code, preventDefault: noop, repeat: false });
  let guard = 40;
  // Walking holds the key through a turn; a released short tap only faces.
  try {
    while (guard-- && !Engine.state.player.moving &&
      Engine.state.player.tx === before[0] && Engine.state.player.ty === before[1]) frame();
  } finally { handlers.keyup({ code }); }
  while (Engine.state.player.moving && guard-- > -40) frame();
  const distance = Math.abs(before[0] - Engine.state.player.tx) + Math.abs(before[1] - Engine.state.player.ty);
  assert(distance <= 1, 'one held step must not overshoot');
  return distance === 1;
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
  const target = Scene.targets[name];
  const route = routeTo(target);
  assert(route, 'route exists to ' + name);
  for (const direction of route) assert.equal(tap(direction), true, 'real keyboard step moves toward ' + name);
  assert.deepEqual([Engine.state.player.tx, Engine.state.player.ty], [target.x, target.y], 'real engine arrives at ' + name);
}

for (const name of ['ronetteFoot', 'monitor', 'chair', 'curtainWest', 'gerardBedFoot', 'nurse']) walkTo(name);

walkTo('ronetteFoot');
let before = [Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty];
assert.equal(tap('up'), false, 'Ronette bed rejects movement');
assert.deepEqual([Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty], before, 'bed collision leaves player and map unchanged');

walkTo('nurse');
before = [Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty];
assert.equal(tap('right'), false, 'the nurse counter rejects movement');
assert.deepEqual([Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty], before, 'counter collision leaves player and map unchanged');
assert.equal(storageWrites, 0, 'native scene traversal never writes a save');

// ------------------------------------------- ordine dei valori sulla cattura
function decodePng(file) {
  const buf = fs.readFileSync(file);
  let pos = 8, width = 0, height = 0, colorType = 0, palette = null;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); colorType = data[9]; }
    else if (type === 'PLTE') palette = Buffer.from(data);
    else if (type === 'IDAT') idat.push(Buffer.from(data));
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i - channels] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      }
      cur[i] = v & 255;
    }
    cur.copy(out, y * stride); prev = cur;
  }
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    if (colorType === 3) { const idx = out[i] * 3; rgb[i * 3] = palette[idx]; rgb[i * 3 + 1] = palette[idx + 1]; rgb[i * 3 + 2] = palette[idx + 2]; }
    else { rgb[i * 3] = out[i * channels]; rgb[i * 3 + 1] = out[i * channels + 1]; rgb[i * 3 + 2] = out[i * channels + 2]; }
  }
  return { width, height, rgb };
}
const luma = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
const isWarm = ([r, g, b]) => r > g + 20 && r > b + 20;
const isTrace = ([r, g, b]) => g > r + 30 && g > b + 30;

const capture = path.join(root, 'artifacts/hospital-v01/hospital-native-golden.png');
if (!fs.existsSync(capture)) {
  assert.fail('missing native capture ' + path.relative(root, capture) +
    ' — rigenerala prima di validare l\'ordine dei valori');
}
const frameRgb = decodePng(capture);
assert.deepEqual([frameRgb.width, frameRgb.height], [256, 192], 'the reviewed capture is a native 256x192 frame');
const pixel = (x, y) => {
  const i = (y * frameRgb.width + x) * 3;
  return [frameRgb.rgb[i], frameRgb.rgb[i + 1], frameRgb.rgb[i + 2]];
};
function region(x0, y0, w, h) {
  const pixels = [];
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) pixels.push(pixel(x, y));
  return pixels;
}
const mean = (pixels) => pixels.reduce((sum, px) => sum + luma(px), 0) / pixels.length;
const distinct = new Set(region(0, 0, 256, 192).map((px) => px.join(',')));
assert(distinct.size > 16, 'the capture is a painted frame, not a flat or black fill');

const ronetteSheet = mean(region(55, 68, 16, 14));
const gerardSheet = mean(region(151, 68, 16, 14));
const floorPlane = mean(region(88, 128, 48, 32));
const curtainPlane = mean(region(133, 55, 12, 20));
const wallPlane = mean(region(176, 6, 48, 20));
const steelPlane = mean(region(196, 128, 36, 10));

assert(ronetteSheet > gerardSheet + 6,
  'Ronette sheets read a clear step above Gerard sheets ' +
  `(ronette ${ronetteSheet.toFixed(1)} vs gerard ${gerardSheet.toFixed(1)})`);
assert(ronetteSheet > floorPlane + 40,
  'Ronette sheets are the brightest plane and the floor the quietest ' +
  `(lenzuola ${ronetteSheet.toFixed(1)} vs pavimento ${floorPlane.toFixed(1)})`);
assert(gerardSheet > curtainPlane && curtainPlane > wallPlane &&
  wallPlane > steelPlane && steelPlane > floorPlane,
  'value order holds: Gerard sheets > curtain > walls > steel > floor ' +
  `(${gerardSheet.toFixed(1)} > ${curtainPlane.toFixed(1)} > ${wallPlane.toFixed(1)} > ` +
  `${steelPlane.toFixed(1)} > ${floorPlane.toFixed(1)})`);

// La traccia del monitor e' l'unico accento saturo del frame: un solo cluster.
const traceCells = [];
for (let y = 0; y < 192; y++) for (let x = 0; x < 256; x++) if (isTrace(pixel(x, y))) traceCells.push(x + ',' + y);
assert(traceCells.length > 10, 'the monitor trace is actually painted');
const traceSet = new Set(traceCells);
const traceSeen = new Set();
let traceClusters = 0;
for (const cell of traceCells) {
  if (traceSeen.has(cell)) continue;
  traceClusters++;
  const stack = [cell];
  traceSeen.add(cell);
  while (stack.length) {
    const [cx, cy] = stack.pop().split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const key = (cx + dx) + ',' + (cy + dy);
      if (traceSet.has(key) && !traceSeen.has(key)) { traceSeen.add(key); stack.push(key); }
    }
  }
}
assert.equal(traceClusters, 1, 'exactly one green trace cluster in the whole frame');

// La pelle e' l'unica nota calda dipinta: il viso e la mano di Ronette. Gli
// altri pixel caldi del frame appartengono agli sprite del cast (Cooper sul
// tile di spawn, Gerard accanto al suo letto, l'infermiera al bancone), non all'ambiente.
const SKIN_FACE = [57, 46, 16, 16]; // testa intera: viso + capelli castani (HAIR.brown del cast)
const SKIN_HAND = [67, 65, 9, 7];
const COOPER_SPRITE = [110, 158, 20, 20];
const GERARD_SPRITE = [174, 60, 22, 22];
const NURSE_SPRITE = [174, 118, 22, 26]; // infermiera (11,8) — attore narrativo
const allowed = [SKIN_FACE, SKIN_HAND, COOPER_SPRITE, GERARD_SPRITE, NURSE_SPRITE];
const inBox = (x, y, [bx, by, bw, bh]) => x >= bx && x < bx + bw && y >= by && y < by + bh;
const strayWarm = [];
for (let y = 0; y < 192; y++) {
  for (let x = 0; x < 256; x++) {
    if (!isWarm(pixel(x, y))) continue;
    if (allowed.some((box) => inBox(x, y, box))) continue;
    strayWarm.push(x + ',' + y);
  }
}
assert.equal(strayWarm.length, 0,
  'no warm pixel outside Ronette skin and the cast sprites: ' + strayWarm.slice(0, 12).join(' '));
assert(region(SKIN_FACE[0], SKIN_FACE[1], SKIN_FACE[2], SKIN_FACE[3]).some(isWarm),
  'Ronette face carries the warm skin note');
assert(region(SKIN_HAND[0], SKIN_HAND[1], SKIN_HAND[2], SKIN_HAND[3]).some(isWarm),
  'Ronette hand on the sheet fold carries the second warm note');

console.log('HOSPITAL-NATIVE-PASS production hooks, ronette sprite suppression, authored geometry, ' +
  'footprint parity, collision and approach tiles, keyboard routes, integer native pixels, ' +
  'depth intervals and door frame band, value order, single trace cluster, skin-only warmth');
