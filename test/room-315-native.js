#!/usr/bin/env node
'use strict';

// test/room-315-native.js — contratto della stanza 315 del Great Northern:
// geometria authored == js/maps.js, parita' footprints/definitions, pixel
// nativi interi, percorsi reali con la tastiera, e i due ruoli di luce
// (piano freddo dell'alba alla finestra, unica pozza calda della lampada).

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
load('room-315-art.js');
load('room-315-scene.js');

const G = global.GAME;
const Engine = G.Engine;
const Scene = G.Room315Scene;
const Art = G.Room315Art;
const MAP_ID = 'room_315';

const priorCalls = { tile: [], structures: [], foreground: [], palette: [] };
G.Sprites.drawTile = function () { priorCalls.tile.push({ self: this }); return 'tile-prior'; };
G.sprites.drawStructures = function () { priorCalls.structures.push({ self: this }); return 'structures-prior'; };
G.sprites.drawForegroundStructures = function () { priorCalls.foreground.push({ self: this }); return 'foreground-prior'; };
G.Retro2D.limitBackgroundPalettes = function () { priorCalls.palette.push({ self: this }); return 'palette-prior'; };

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
assert.equal(G.sprites.drawStructures.call(foreignThis, canvasContext, foreignMap, 5, 6, {}), 'structures-prior');
assert.equal(G.sprites.drawForegroundStructures.call(foreignThis, canvasContext, foreignMap, 7, 8, {}), 'foreground-prior');
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
assert.equal(G.sprites.drawForegroundStructures(canvasContext, installedMap, 0, 0, { forestDepthMin: 60, forestDepthMax: 100 }), undefined);
assert.equal(G.Retro2D.limitBackgroundPalettes(canvasContext, 0, 0, 256, 192, MAP_ID), undefined);
assert.equal(ownDraws, 1, 'own structure hook invokes room 315 art');
assert.equal(ownForegrounds, 1, 'own depth hook invokes room 315 foreground art');
for (const calls of Object.values(priorCalls)) assert.equal(calls.length, 1, 'own hooks do not delegate');

// ---------------------------------------------------------------- geometria
assert.equal(Scene.mapId, MAP_ID);
const roomMap = G.Maps[MAP_ID];
assert.strictEqual(installedMap, roomMap, 'install keeps the glue-owned map record');
assert.deepEqual(roomMap.rows, Scene.rows, 'maps.js geometry matches the authored footprints');
assert.equal(roomMap.width, 16);
assert.equal(roomMap.height, 12);
assert.equal(roomMap.width * 16, 256, 'map spans the full native viewport width');
assert.equal(roomMap.rows.every((row) => row.length === roomMap.width), true);
assert.equal(roomMap.indoor, true);
assert.deepEqual(roomMap.doors, {}, 'the hall door is a LocationConnection, not a doors entry');

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
assert.equal(Art.definitions.length, 5, 'five grounded props: everything else is architecture');

// il letto e' largo tre celle e il comodino sta a (4,3)
assert.equal(Scene.footprints.bed.length, 9, 'the bed covers three columns over three rows');
assert.deepEqual(Scene.footprints.bedsideTable, [[4, 3]], 'the bedside table sits east of the bed');

// ------------------------------------------------------- collisione e rotte
const isSolid = (x, y) => G.Maps.isSolid(MAP_ID, x, y, { clues: [], flags: {} });
const freeTiles = [];
for (let y = 0; y < roomMap.height; y++) {
  for (let x = 0; x < roomMap.width; x++) if (!isSolid(x, y)) freeTiles.push([x, y]);
}
const entrance = Scene.targets.entrance;
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
assert.equal(reachable.size, freeTiles.length, 'every free tile is connected to the hall door');
assert.equal(isSolid(2, 6), false, 'the wake spawn at the bed foot is walkable');
assert.equal(isSolid(7, 10), false, 'the hall spawn is walkable');
assert.equal(isSolid(7, 11), false, 'the hall trigger cell is walkable');
for (let y = 6; y <= 10; y++) {
  for (let x = 6; x <= 8; x++) assert.equal(isSolid(x, y), false, 'the door approach column stays clear');
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
assert(hasRect(depth64, 112, 44, 48, 7), '64px interval selects the writing desk top');
assert(hasRect(depth64, 192, 42, 32, 6), '64px interval selects the dresser top');
assert(!hasRect(depth64, 16, 46, 48, 50), 'half-open interval excludes the bed at 96px');
const depth96 = foregroundCalls(96, 128);
assert(hasRect(depth96, 16, 46, 48, 50), '96px interval selects the bed');
assert(!hasRect(depth96, 205, 106, 22, 12), '96px interval excludes the luggage stand at 128px');
assert(hasRect(foregroundCalls(128, Infinity), 205, 106, 22, 12), '128px interval selects the luggage stand');
assert.equal(foregroundCalls(65, 95).length, 0, 'empty depth interval paints no furniture');

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
  const target = Scene.targets[name];
  const route = routeTo(target);
  assert(route, 'route exists to ' + name);
  for (const direction of route) assert.equal(tap(direction), true, 'real keyboard step moves toward ' + name);
  assert.deepEqual([Engine.state.player.tx, Engine.state.player.ty], [target.x, target.y], 'real engine arrives at ' + name);
}

for (const name of ['wake', 'bedside', 'desk', 'dresser', 'luggage', 'depthBehind']) walkTo(name);

walkTo('wake');
let before = [Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty];
assert.equal(tap('up'), false, 'the bed rejects movement');
assert.deepEqual([Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty], before, 'prop collision leaves player and map unchanged');

walkTo('desk');
before = [Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty];
assert.equal(tap('up'), false, 'the writing desk rejects movement');
assert.deepEqual([Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty], before, 'desk collision leaves player and map unchanged');
assert.equal(storageWrites, 0, 'native scene traversal never writes a save');

// ------------------------------------------------------- i due ruoli di luce
// Misura sul frame nativo catturato: la finestra e' il piano freddo piu'
// chiaro del tappeto, e l'unica sorgente calda e' la lampada del comodino.
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
function region(frame, x0, y0, w, h) {
  const pixels = [];
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const i = (y * frame.width + x) * 3;
      pixels.push([frame.rgb[i], frame.rgb[i + 1], frame.rgb[i + 2]]);
    }
  }
  return pixels;
}
const luma = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
const mean = (pixels) => pixels.reduce((sum, px) => sum + luma(px), 0) / pixels.length;
const isWarm = ([r, , b]) => r > b + 40;

const capture = path.join(root, 'artifacts/room-315-v01/native-polished4.png');
if (fs.existsSync(capture)) {
  const frame = decodePng(capture);
  assert.deepEqual([frame.width, frame.height], [256, 192], 'the reviewed capture is a native 256x192 frame');
  const distinct = new Set(region(frame, 0, 0, 256, 192).map((px) => px.join(',')));
  assert(distinct.size > 16, 'the capture is a painted frame, not a flat or black fill');

  const windowGlass = region(frame, 110, 11, 52, 22);
  const carpet = region(frame, 150, 128, 40, 32);
  const lampShade = region(frame, 70, 28, 12, 9);
  const quilt = region(frame, 24, 63, 20, 16);

  assert(mean(windowGlass) > mean(carpet) + 20,
    'the cold dawn window is the brighter plane; the carpet stays the quietest surface ' +
    `(finestra ${mean(windowGlass).toFixed(1)} vs tappeto ${mean(carpet).toFixed(1)})`);
  // Il letto e' il focale: la trapunta deve staccarsi nettamente dal tappeto,
  // altrimenti la stanza legge come una scatola verde-azzurra uniforme.
  assert(mean(quilt) >= mean(carpet) + 18,
    'the quilt reads clearly above the carpet, so the bed stays the focal mass ' +
    `(trapunta ${mean(quilt).toFixed(1)} vs tappeto ${mean(carpet).toFixed(1)})`);
  assert(lampShade.some(isWarm), 'the bedside lamp is the one warm source in the room');
  assert(!windowGlass.some(isWarm), 'no warm value ever enters the cold dawn window pane');
} else {
  assert.fail('missing native capture ' + path.relative(root, capture) +
    ' — rigenerala prima di validare i due ruoli di luce');
}

console.log('ROOM-315-NATIVE-PASS production hooks, authored geometry, footprint parity, collision, keyboard routes, integer native pixels, depth intervals, dawn plane vs lamp pool');
