#!/usr/bin/env node
'use strict';

// test/traincar-native.js — contratto della radura del ponte e del vagone
// (Act 3, M5): geometria authored == js/maps.js, parita' definizioni/collisione,
// pixel nativi interi, hook di produzione dell'esterno, rotte reali da tastiera
// verso ogni target del brief, e i gate di valore misurati sul rasterizzatore
// deterministico dell'arte (l'arte e' fatta solo di rettangoli a tinta piatta:
// non serve un browser per misurarla).

const assert = require('node:assert/strict');
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
load('traincar-art.js');
load('traincar-scene.js');
['environment-reactions.js', 'location-connections.js', 'world-connections.gen.js',
  'double-r-exterior-art.js', 'double-r-exterior-scene.js', 'double-r-location-production.js',
  'sheriffs-station-art.js', 'sheriffs-station-exterior-art.js', 'sheriffs-station-scene.js', 'sheriffs-station-exterior-scene.js',
  'sheriffs-station-production.js', 'world-connections-production.js'].forEach(load);

const captures = require(path.join(root, 'tools', 'traincar-captures.js'));

const G = global.GAME;
const Engine = G.Engine;
const Scene = G.TraincarScene;
const Art = G.TraincarArt;
const MAP_ID = 'traincar';
const TILE = 16;

// ------------------------------------------------- hook di produzione
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
assert.strictEqual(G.Sprites.drawTile, installedHooks.tile, 'second install does not wrap the tile hook again');
assert.strictEqual(G.sprites.drawStructures, installedHooks.structures, 'second install does not wrap the structure hook again');
assert.strictEqual(G.sprites.drawForegroundStructures, installedHooks.foreground, 'second install does not wrap the depth hook again');
assert.strictEqual(G.Retro2D.limitBackgroundPalettes, installedHooks.palette, 'second install does not wrap the palette hook again');

const foreignThis = { id: 'foreign-this' };
const foreignMap = { id: 'foreign-map' };
assert.equal(G.Sprites.drawTile.call(foreignThis, canvasContext, '.', 1, 2, 3, 4, ['.'], { mapId: 'foreign-map' }), 'tile-prior');
assert.equal(G.sprites.drawStructures.call(foreignThis, canvasContext, foreignMap, 5, 6, {}), 'structures-prior');
assert.equal(G.sprites.drawForegroundStructures.call(foreignThis, canvasContext, foreignMap, 7, 8, {}), 'foreground-prior');
assert.equal(G.Retro2D.limitBackgroundPalettes.call(foreignThis, canvasContext, 1, 2, 3, 4, 'foreign-map'), 'palette-prior');
for (const [name, calls] of Object.entries(priorCalls)) {
  assert.equal(calls.length, 1, name + ' foreign hook delegates exactly once');
  assert.strictEqual(calls[0].self, foreignThis, name + ' foreign hook preserves the receiver');
}

let ownDraws = 0;
let ownForegrounds = 0;
const artDraw = Art.draw;
const artForeground = Art.foreground;
Art.draw = function () { ownDraws++; return artDraw.apply(this, arguments); };
Art.foreground = function () { ownForegrounds++; return artForeground.apply(this, arguments); };
assert.equal(G.Sprites.drawTile(canvasContext, 'g', 0, 0, 0, 0, ['g'], { mapId: MAP_ID }), undefined,
  'authored rows paint no default tile');
assert.equal(G.sprites.drawStructures(canvasContext, installedMap, 0, 0, {}), undefined);
assert.equal(G.sprites.drawForegroundStructures(canvasContext, installedMap, 0, 0, { forestDepthMin: 120, forestDepthMax: 140 }), undefined);
assert.equal(G.Retro2D.limitBackgroundPalettes(canvasContext, 0, 0, 256, 192, MAP_ID), undefined,
  'the exterior bypasses the background palette limiter');
assert.equal(ownDraws, 1, 'own structure hook invokes the traincar art');
assert.equal(ownForegrounds, 1, 'own depth hook invokes the traincar foreground art');
for (const [name, calls] of Object.entries(priorCalls)) {
  assert.equal(calls.length, 1, name + ' own hook does not delegate');
}

// ---------------------------------------------------------------- geometria
assert.equal(Scene.mapId, MAP_ID);
const map = G.Maps[MAP_ID];
assert.strictEqual(installedMap, map, 'install keeps the glue-owned map record');
assert.deepEqual(map.rows, Scene.rows, 'maps.js geometry matches the authored rows');
assert.equal(map.width, 24);
assert.equal(map.height, 12);
assert.equal(map.height * TILE, 192, 'the map is exactly one screen tall');
assert.equal(map.width * TILE, 384, 'the map scrolls horizontally over a screen and a half');
assert.equal(map.rows.every((row) => row.length === map.width), true, 'every row is 24 tiles wide');
assert.equal(map.indoor, false, 'the clearing is an exterior');
assert.equal(map.rows[0].slice(0, 21), 'T'.repeat(21), 'the north canopy closes row 0');
assert.equal(map.rows[2].slice(9, 18), 'i'.repeat(9), 'the car north wall owns row 2 across its footprint');
assert.equal(map.rows[3].slice(9, 18), 'i'.repeat(9), 'rows 2-3 together carry the 48 px north face');
assert.equal(map.rows[11], 'T'.repeat(24), 'the south tree line closes the map');

// porte: verso la citta' a ovest, verso One Eyed Jacks al varco nord
const townDoor = map.doors['0,7'];
assert(townDoor && townDoor.to === 'town' && townDoor.tx === 54 && townDoor.ty === 14,
  'the west door lands on the town road');
const oejDoor = map.doors['21,0'];
assert(oejDoor && oejDoor.to === 'oej' && oejDoor.needsFlag === 'east_route_confirmed' &&
  oejDoor.blockedMsg === 'oej_bloccato', 'the cut stays gated on east_route_confirmed');
assert.equal(G.Maps.town.doors['55,14'].tx, 1, 'the town door spawns the player on the west path tile');
assert.equal(G.Maps.town.doors['55,14'].ty, 7);

// ------------------------------------------- definizioni <-> collisione
assert.equal(Art.definitions.length, 14, 'the fourteen authored definitions of the brief');
const isSolid = (x, y) => G.Maps.isSolid(MAP_ID, x, y, { clues: [], flags: {} });
for (const prop of Art.definitions) {
  assert(prop.cells.length > 0, prop.id + ' declares cells');
  assert(prop.bounds.length === 4 && prop.bounds.every(Number.isInteger), prop.id + ' declares integer pixel bounds');
  assert(prop.shadow.length === 4 && prop.shadow.every(Number.isInteger), prop.id + ' declares an integer contact band');
  const southRow = Math.max(...prop.cells.map((cell) => cell[1]));
  assert.equal(prop.footY, (southRow + 1) * TILE, prop.id + ' footY is the south edge of its footprint');
  for (const [x, y] of prop.cells) {
    assert.equal(isSolid(x, y), !!prop.solid,
      prop.id + ' cell ' + x + ',' + y + ' collision disagrees with the art');
  }
  for (const [x, y] of prop.interior || []) {
    assert.equal(isSolid(x, y), false, prop.id + ' interior cell ' + x + ',' + y + ' must stay walkable');
  }
}
/* Solo sponda, torrente, alberi e cartello sono solidi: il resto e' terreno
 * calpestabile e la collisione resta inferibile dall'arte (Bible §8). */
const solidChars = new Set();
for (let y = 0; y < map.height; y++) {
  for (let x = 0; x < map.width; x++) if (isSolid(x, y)) solidChars.add(map.rows[y][x]);
}
assert.deepEqual([...solidChars].sort(), ['S', 'T', 'i', 'w'],
  'the only solids are the car rim, the creek, the trees and the sign');

// ------------------------------------------------------- collisione e rotte
const spawn = Scene.targets.spawn;
assert.equal(isSolid(spawn.x, spawn.y), false, 'the spawn tile is walkable');
assert(spawn.y <= 23, 'outdoor spawn stays north of the camera cut-off rule');
const freeTiles = [];
for (let y = 0; y < map.height; y++) {
  for (let x = 0; x < map.width; x++) if (!isSolid(x, y)) freeTiles.push([x, y]);
}
const reachable = new Set([spawn.x + ',' + spawn.y]);
const queue = [[spawn.x, spawn.y]];
while (queue.length) {
  const [x, y] = queue.shift();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, ny = y + dy, key = nx + ',' + ny;
    if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
    if (!isSolid(nx, ny) && !reachable.has(key)) { reachable.add(key); queue.push([nx, ny]); }
  }
}
assert.equal(reachable.size, freeTiles.length, 'every walkable tile is connected to the town door');

// I nove target ambientali del brief: la tessera su cui il giocatore sta,
// il verso in cui guarda e la tessera che finisce davanti a lui.
const facing = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const targetIds = ['bridge_rail', 'traincar_entrance', 'mound', 'ring', 'scene_center',
  'stove', 'cards', 'tracks_north', 'sign_oej'];
for (const id of targetIds) {
  const t = Scene.targets[id];
  assert(t, id + ' is declared by the scene');
  assert.equal(isSolid(t.stand.x, t.stand.y), false, id + ' stand tile is walkable');
  assert(reachable.has(t.stand.x + ',' + t.stand.y), id + ' stand tile is reachable from the spawn');
  const [dx, dy] = facing[t.dir];
  assert.deepEqual([t.stand.x + dx, t.stand.y + dy], [t.x, t.y],
    id + ' is the tile the player faces from its stand tile');
}
/* La colonna porta -> mucchio -> traversa/anello e' una linea sola. */
assert.equal(Scene.targets.mound.x, 13);
assert.equal(Scene.targets.ring.x, 13);
assert.equal(Scene.targets.traincar_entrance.x, 13);
assert.equal(Scene.targets.scene_center.x, 12, 'the positional page is earned one tile west of the column');

// Il registro dell'adapter deve puntare esattamente alle stesse tessere.
const runtimeTargets = GAME.WorldData.narrativeTargets.traincar;
for (const id of targetIds) {
  const t = Scene.targets[id], actual = runtimeTargets[id];
  assert(actual, 'canonical narrative targets declare ' + id);
  assert.deepEqual([actual.x, actual.y], [t.x, t.y],
    'canonical traincar target ' + id + ' matches the authored tile');
}

// Hawk e Truman restano FUORI dal vagone, sempre.
const castWindows = JSON.parse(require('node:fs').readFileSync(path.join(root, 'narrative', 'cast', 'windows.json'), 'utf8'));
const carInterior = new Set();
for (let y = Art.interior.y0; y <= Art.interior.y1; y++) {
  for (let x = Art.interior.x0; x <= Art.interior.x1; x++) carInterior.add(x + ',' + y);
}
for (const [id, actor] of Object.entries(Scene.actors)) {
  assert.equal(isSolid(actor.x, actor.y), false, id + ' stands on a walkable tile');
  assert(reachable.has(actor.x + ',' + actor.y), id + ' stands somewhere the player can reach');
  assert(!carInterior.has(actor.x + ',' + actor.y), id + ' never stands inside the car');
  // Corpi posseduti da Cast Presence (narrative/cast/windows.json), non piu' dall'adapter.
  const placements = castWindows.windows.flatMap((w) => Object.entries(w.cast)
    .filter(([cid, pl]) => pl.map_id === MAP_ID && (cid === id || (pl.actor_ids || []).includes(id)))
    .map(([, pl]) => pl));
  assert.equal(placements.length, 1, 'Cast Presence places ' + id + ' on the traincar exactly once');
  assert.deepEqual([placements[0].x, placements[0].y], [actor.x, actor.y],
    'Cast Presence places ' + id + ' on the authored tile');
}
/* Nessuno sta nella colonna della porta (13-14, righe 8..10). */
for (const actor of Object.values(Scene.actors)) {
  assert(!(actor.x === 13 && actor.y >= 8), 'the door approach column stays clear');
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
const authored = newRecordingContext();
artDraw(authored.context, 0, 0, {});
assert(authored.calls.length > 200, 'the scene paints a substantial authored native frame');
assert(authored.calls.every((call) => call.args.every(Number.isInteger)),
  'all authored draw calls use integer coordinates and dimensions');
assert(authored.calls.every((call) => /^#[0-9a-f]{6}$/i.test(call.color)),
  'every authored rectangle is a flat opaque colour, never a gradient or pattern');

function foregroundCalls(min, max, state) {
  const rec = newRecordingContext();
  artForeground(rec.context, 0, 0, min, max, state || {});
  return rec.calls;
}
const hasRect = (calls, x, y, w, h) => calls.some((c) =>
  c.args[0] === x && c.args[1] === y && c.args[2] === w && c.args[3] === h);
const doorBand = foregroundCalls(128, 144);
assert(hasRect(doorBand, 205, 108, 3, 20), 'the 128px band repaints the west door jamb over the player');
assert(hasRect(doorBand, 240, 108, 3, 20), 'the 128px band repaints the east door jamb over the player');
assert(!hasRect(doorBand, 208, 110, 32, 18), 'the door threshold stays in the ground pass');
const railBand = foregroundCalls(144, 176);
assert(hasRect(railBand, 48, 136, 32, 2), 'the 144px band repaints the bridge south parapet');
assert(foregroundCalls(129, 143).length === 0, 'an empty depth interval paints nothing');
const tapeBand = foregroundCalls(128, 144, { overlay: true });
assert(hasRect(tapeBand, 204, 116, 44, 3), 'with the flag set the door tape covers the player in the doorway');
assert(!hasRect(foregroundCalls(128, 144, { overlay: false }), 204, 116, 44, 3),
  'without the flag there is no tape anywhere');

// ------------------------------------------- gate di valore sull'arte nativa
const luma = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
const warmth = ([r, g]) => r - g;
const WARM_GATE = 80;

function frameOf(state) {
  const surface = captures.renderMap(state);
  const pixel = (x, y) => {
    const i = (y * surface.width + x) * 3;
    return [surface.rgb[i], surface.rgb[i + 1], surface.rgb[i + 2]];
  };
  const region = (x0, y0, w, h) => {
    const out = [];
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) out.push(pixel(x, y));
    return out;
  };
  return { surface, pixel, region };
}
const mean = (px) => px.reduce((sum, p) => sum + luma(p), 0) / px.length;
const stdev = (px) => {
  const m = mean(px);
  return Math.sqrt(px.reduce((sum, p) => sum + (luma(p) - m) ** 2, 0) / px.length);
};

const plain = frameOf({});
assert.deepEqual([plain.surface.width, plain.surface.height], [384, 192],
  'the authored frame covers the whole 24x12 map');
const distinct = new Set(plain.region(0, 0, 384, 192).map((p) => p.join(',')));
assert(distinct.size > 20, 'the frame is painted, not a flat fill');

// (1) un solo cluster di brace, e sta dentro il vagone.
const carBox = [Art.carPixels.x, 16, Art.carPixels.w, Art.carPixels.h];
const warmCells = [];
for (let y = 0; y < 192; y++) {
  for (let x = 0; x < 384; x++) if (warmth(plain.pixel(x, y)) >= WARM_GATE) warmCells.push(x + ',' + y);
}
assert(warmCells.length >= 4, 'the ember is actually painted');
const warmSet = new Set(warmCells);
const seenWarm = new Set();
let warmClusters = 0;
for (const cell of warmCells) {
  if (seenWarm.has(cell)) continue;
  warmClusters++;
  const stack = [cell];
  seenWarm.add(cell);
  while (stack.length) {
    const [cx, cy] = stack.pop().split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const key = (cx + dx) + ',' + (cy + dy);
      if (warmSet.has(key) && !seenWarm.has(key)) { seenWarm.add(key); stack.push(key); }
    }
  }
}
assert.equal(warmClusters, 1, 'exactly one ember cluster in the whole frame');
// (2) nessun pixel piu' caldo della brace fuori dal vagone (nel frame non ci
// sono sprite: il cast e' l'unica altra sorgente calda ammessa in gioco).
const stray = warmCells.filter((cell) => {
  const [x, y] = cell.split(',').map(Number);
  return !(x >= carBox[0] && x < carBox[0] + carBox[2] && y >= carBox[1] && y < carBox[1] + carBox[3]);
});
assert.equal(stray.length, 0, 'no pixel warmer than the ember outside the car: ' + stray.slice(0, 8).join(' '));
const emberWarmth = Math.max(...warmCells.map((cell) => {
  const [x, y] = cell.split(',').map(Number);
  return warmth(plain.pixel(x, y));
}));
let hottestElsewhere = 0;
for (let y = 0; y < 192; y++) {
  for (let x = 0; x < 384; x++) {
    if (warmSet.has(x + ',' + y)) continue;
    hottestElsewhere = Math.max(hottestElsewhere, warmth(plain.pixel(x, y)));
  }
}
assert(hottestElsewhere < emberWarmth,
  `the ember is the warmest mark on the map (ember ${emberWarmth} vs ${hottestElsewhere})`);

// (3) pellicola di polvere ininterrotta dentro (10..16, 4..6)
const dustBand = plain.region(168, 68, 80, 10);
const dustSpread = stdev(dustBand);
assert(dustSpread < 3, `the interior dust film is unbroken (stdev ${dustSpread.toFixed(2)})`);

// (4) il torrente e' piu' scuro della massicciata
const creekLuma = mean(plain.region(50, 36, 28, 56));
const ballastLuma = mean(plain.region(104, 148, 176, 24));
assert(creekLuma < ballastLuma,
  `creek slate reads under the ballast (creek ${creekLuma.toFixed(1)} vs ballast ${ballastLuma.toFixed(1)})`);

// (5) il nastro della contea e' la nota chiara: sopra il corpo del vagone di 20
const overlayFrame = frameOf({ overlay: true });
const tapeLuma = mean(overlayFrame.region(210, 116, 24, 3));
const carBodyLuma = mean(plain.region(150, 118, 40, 6));
assert(tapeLuma > carBodyLuma + 20,
  `county tape sits a clear step above the car body (tape ${tapeLuma.toFixed(1)} vs body ${carBodyLuma.toFixed(1)})`);
// senza flag, nessun nastro sulla porta
const doorClosed = mean(plain.region(210, 116, 24, 3));
assert(doorClosed < tapeLuma - 40, 'the door carries no tape until the report closes');
// e il paletto al ponte compare solo con il flag
const stakeOn = overlayFrame.region(70, 112, 7, 2).some((p) => luma(p) > 190);
const stakeOff = plain.region(70, 112, 7, 2).some((p) => luma(p) > 190);
assert(stakeOn && !stakeOff, 'the bridge stake is painted on the flag, never on a second map');

// (6) l'anello lascia la traversa quando S1 e' deciso
const RING = Art.palette.ring.toLowerCase();
const hexAt = (frame, x, y) => '#' + frame.pixel(x, y).map((v) => v.toString(16).padStart(2, '0')).join('');
function ringPixels(frame) {
  let count = 0;
  for (let y = 80; y < 96; y++) for (let x = 200; x < 232; x++) if (hexAt(frame, x, y) === RING) count++;
  return count;
}
assert(ringPixels(plain) >= 9, 'the ring is on the beam before the custody decision');
assert.equal(ringPixels(frameOf({ ringHidden: true })), 0, 'the ring leaves the beam once S1 is set');

// La scena legge il flag dallo stato narrativo, non da una seconda mappa.
G.NarrativeAdapter = { getState: () => ({ values: {}, flags: {} }) };
assert.deepEqual(Scene.sceneState(), { ringHidden: false, overlay: false });
G.NarrativeAdapter = { getState: () => ({ values: { s1: 'institutional' }, flags: {} }) };
assert.deepEqual(Scene.sceneState(), { ringHidden: true, overlay: true },
  'S1 takes the ring off the beam and closes the scene at once');
G.NarrativeAdapter = { getState: () => ({ values: {}, flags: { east_route_confirmed: true } }) };
assert.deepEqual(Scene.sceneState(), { ringHidden: false, overlay: true });
delete G.NarrativeAdapter;

// ------------------------------------------------- motore reale e tastiera
Engine.init(canvas, null);
assert.deepEqual([canvas.width, canvas.height], [256, 192], 'the engine restores the native canvas');
Engine.start();
Engine.state.mode = 'title';
Engine.loadMap(MAP_ID, spawn.x, spawn.y, 'right');
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
  const q = [{ point: start, route: [] }];
  const seen = new Set([start.join(',')]);
  const dirs = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
  while (q.length) {
    const cur = q.shift();
    if (cur.point[0] === target.x && cur.point[1] === target.y) return cur.route;
    for (const [dir, dx, dy] of dirs) {
      const x = cur.point[0] + dx, y = cur.point[1] + dy, key = x + ',' + y;
      /* La porta ovest e quella del varco nord teletrasportano: la rotta di
       * prova non le calpesta mai. */
      if (map.doors[key]) continue;
      if (!seen.has(key) && !isSolid(x, y)) {
        seen.add(key);
        q.push({ point: [x, y], route: cur.route.concat(dir) });
      }
    }
  }
  return null;
}
function walkTo(name) {
  const target = Scene.targets[name].stand;
  const route = routeTo(target);
  assert(route, 'a route exists to ' + name);
  for (const dir of route) assert.equal(tap(dir), true, 'a real keyboard step moves toward ' + name);
  assert.deepEqual([Engine.state.player.tx, Engine.state.player.ty], [target.x, target.y],
    'the real engine arrives at the ' + name + ' stand tile');
}
for (const id of targetIds) walkTo(id);

// collisioni sentite dal giocatore: sponda del vagone, torrente, cartello
walkTo('cards');
assert.equal(tap('left'), true, 'the torn seat tile is walkable floor');
let before = [Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty];
assert.deepEqual(before.slice(1), [10, 6], 'the player stands on the seat tile');
assert.equal(tap('left'), false, 'the car west rim rejects movement');
assert.deepEqual([Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty], before,
  'rim collision leaves the player and the map unchanged');
walkTo('bridge_rail');
before = [Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty];
assert.equal(tap('up'), false, 'the creek and its parapet reject movement');
assert.deepEqual([Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty], before);
walkTo('sign_oej');
assert.equal(tap('up'), false, 'the ONE EYED JACKS sign is a solid landmark');
assert.equal(storageWrites, 0, 'walking the native clearing never writes a save');

console.log('TRAINCAR-NATIVE-PASS exterior hooks, authored geometry 24x12, definition/collision parity, ' +
  'reachable stand tiles for all nine targets, adapter alignment, actors outside the car, integer native pixels, ' +
  'depth bands, one ember, unbroken dust film, creek under ballast, county tape step, conditional ring and overlay, ' +
  'real keyboard routes and collisions');
