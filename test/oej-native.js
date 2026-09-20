#!/usr/bin/env node
'use strict';

// test/oej-native.js — contratto della sala di One Eyed Jacks: geometria
// authored == js/maps.js, parita' footprints/definitions, pixel nativi interi,
// intervalli di profondita' (un corpo davanti a un tavolo resta davanti, un
// corpo dietro al bancone viene coperto), celle del cast libere, e l'ordine
// dei valori misurato sulla cattura nativa rivista.
//
// Modellato su test/hospital-native.js.

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
load('oej-art.js');
load('oej-scene.js');
load('location-connections.js');
load('world-connections.gen.js');
global.GAME.LocationConnections.connectionRecordsFor(['traincar-oej-entrance'])
  .forEach((c) => global.GAME.LocationConnections.install(c, global.GAME.Maps));

const G = global.GAME;
const Engine = G.Engine;
const Scene = G.OejScene;
const Art = G.OejArt;
const MAP_ID = 'oej';

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
assert.equal(ownDraws, 1, 'own structure hook invokes the casino art');
assert.equal(ownForegrounds, 1, 'own depth hook invokes the casino foreground art');
for (const [name, calls] of Object.entries(priorCalls)) {
  assert.equal(calls.length, 1, name + ' own hook does not delegate');
}

// ---------------------------------------------------------------- geometria
assert.equal(Scene.mapId, MAP_ID);
const room = G.Maps[MAP_ID];
assert.strictEqual(installedMap, room, 'install keeps the glue-owned map record');
assert.deepEqual(room.rows, Scene.rows, 'maps.js geometry matches the authored rows');
assert.equal(room.width, 16);
assert.equal(room.height, 10);
assert.equal(room.width * 16, 256, 'the room spans the full native viewport width');
assert.equal(room.rows.every((row) => row.length === room.width), true);
assert.equal(room.indoor, true);
assert.equal(room.rows[0], 'iiiiiiiiiiiiiiii', 'the north wall row stays solid');
assert.equal(room.rows[4], 'iffffCCCCCCffffi', 'the counter run stays six cells wide');
assert.equal(room.rows[9], 'iiiiiiiDDiiiiiii', 'the south double door is the only opening');
/* The map-row pass: the four tables no longer sit in a mirrored corner grid.
 * They occupy three different widths on four different rows, one of them on
 * the centre carpet, and no row is the mirror of another. */
assert.equal(room.rows[2], 'iftttfffffttffUi', 'the north row carries a long craps table and a blackjack table');
assert.equal(room.rows[6], 'ifffKKKffffffffi', 'a three-cell roulette table stands on the centre carpet');
assert.equal(room.rows[7], 'iUfhffffftthfffi',
  'the poker table and its free stool sit south-east, a slot machine and a cocktail stool west');
assert.equal(room.rows[8], 'iUftffffffffffFi',
  'the south-west lounge and the south-east rope stand fill the two empty quadrants');
const tableRows = Art.definitions.filter((d) => d.id.indexOf('table') === 0)
  .map((d) => Math.max(...d.cells.map((cell) => cell[1])));
assert(new Set(tableRows).size >= 3,
  'the tables stand on at least three different rows, so the floor cannot read as a 2x2 grid');
assert.equal(new Set(Art.definitions.filter((d) => d.id.indexOf('table') === 0)
  .map((d) => d.cells.length)).size >= 2, true, 'the tables are not all the same size');
const mirrored = Art.definitions.filter((d) => d.id.indexOf('table') === 0)
  .some((a) => Art.definitions.some((b) => b !== a && b.id.indexOf('table') === 0 &&
    b.cells[0][1] === a.cells[0][1] && b.cells[0][0] === 15 - a.cells[a.cells.length - 1][0]));
assert.equal(mirrored, false, 'no table is the east-west mirror of another on the same row');

const isSolidAt = (x, y) => G.Maps.isSolid(MAP_ID, x, y, { clues: [], flags: {} });

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
assert.equal(Art.definitions.length, 15,
  'fifteen grounded props: four gaming tables, three seated patrons, two free stools, the bar, ' +
  'the cabinet, two slot machines, a cocktail table and a rope stand');
/* Every painted patron sits on a solid cell whose NORTH neighbour is also
 * solid, so the head that overhangs the cell can never cover a body. */
for (const prop of Art.definitions.filter((d) => d.id.indexOf('guest') === 0)) {
  const [gx, gy] = prop.cells[0];
  assert.equal(isSolidAt(gx, gy), true, prop.id + ' occupies a solid cell');
  assert.equal(isSolidAt(gx, gy - 1), true, prop.id + ' has a solid cell to the north');
  assert(prop.bounds[1] < gy * 16, prop.id + ' rises above its own cell into that solid neighbour');
}
assert.equal(Scene.footprints.barCounter.length, 6, 'the bar counter covers the whole C run');
assert.equal(Art.doorFoot, 176, 'the door jamb sorts below the south door foot line');

// Ogni cella dipinta come arredo e' un glifo solido della mappa; ogni cella
// del cast e' libera. Nessun mobile puo' seppellire un corpo.
const isSolid = isSolidAt;
for (const [id, cells] of Object.entries(Scene.footprints)) {
  for (const [x, y] of cells) assert.equal(isSolid(x, y), true, id + '@' + x + ',' + y + ' paints a solid tile');
}
const claimed = new Set();
for (const cells of Object.values(Scene.footprints)) for (const [x, y] of cells) claimed.add(x + ',' + y);
for (const [id, spot] of Object.entries(Scene.actors)) {
  assert.equal(isSolid(spot.x, spot.y), false, id + ' stands on a walkable tile');
  assert.equal(claimed.has(spot.x + ',' + spot.y), false, id + ' cell carries no furniture');
}
assert.deepEqual(Scene.actors.jacques, { x: 7, y: 5 }, 'Jacques keeps the counter approach');
assert.deepEqual(Scene.actors.audrey, { x: 13, y: 7 }, 'Audrey keeps the south-east floor');
assert.deepEqual(Scene.actors.hawk, { x: 6, y: 8 }, 'Hawk keeps the landing by the door');

// ------------------------------------------------------- collisione e rotte
const freeTiles = [];
for (let y = 0; y < room.height; y++) {
  for (let x = 0; x < room.width; x++) if (!isSolid(x, y)) freeTiles.push([x, y]);
}
const entrance = Scene.targets.entrance;
assert.deepEqual([entrance.x, entrance.y], [8, 8], 'the spawn is the door approach tile');
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
assert.equal(reachable.size, freeTiles.length, 'every free tile is connected to the door');
for (const leaf of ['7,9', '8,9']) {
  assert.equal(isSolid(...leaf.split(',').map(Number)), false, leaf + ' door leaf is walkable');
  const door = room.doors && room.doors[leaf];
  assert(door && typeof door.to === 'string', leaf + ' is a valid door record');
  assert(Number.isInteger(door.tx) && Number.isInteger(door.ty), leaf + ' door lands on integer tiles');
}
for (const [name, target] of Object.entries(Scene.targets)) {
  assert.equal(isSolid(target.x, target.y), false, name + ' target is walkable');
  assert(reachable.has(target.x + ',' + target.y), name + ' target is reachable');
}
for (const [id, spot] of Object.entries(Scene.actors)) {
  const approaches = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dx, dy]) => [spot.x + dx, spot.y + dy])
    .filter(([x, y]) => !isSolid(x, y) && reachable.has(x + ',' + y));
  assert(approaches.length > 0, id + ' has a reachable adjacent approach tile');
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
assert(authoredPixels.calls.length > 300, 'the scene paints a substantial authored native frame');
assert(authoredPixels.calls.every((call) => call.args.every(Number.isInteger)),
  'all authored draw calls use integer coordinates and dimensions');
assert(authoredPixels.calls.every((call) => /^#[0-9a-f]{6}$/i.test(call.color)),
  'every authored rectangle is a flat opaque colour, never a gradient or pattern');
// La mappa e' alta 160px in un viewport di 192: il motore la centra, quindi la
// banda visibile in coordinate mappa e' [-16, 176). L'arte la riempie tutta e
// non dipinge nulla fuori: un bordo nero in cima sarebbe una stanza senza
// soffitto.
assert.equal(Art.viewTop, -16, 'the painted band starts one row above the map');
assert.equal(Art.viewBottom, 176, 'the painted band ends one row below the map');
const outOfFrame = authoredPixels.calls.filter((call) =>
  call.args[0] < 0 || call.args[1] < Art.viewTop ||
  call.args[0] + call.args[2] > 256 || call.args[1] + call.args[3] > Art.viewBottom);
assert.equal(outOfFrame.length, 0,
  'nothing is painted outside the visible band: ' + JSON.stringify(outOfFrame.slice(0, 4)));
const topBand = authoredPixels.calls.filter((call) => call.args[1] <= Art.viewTop);
assert(topBand.length > 0, 'the band above the map row 0 is painted, never left black');

// Il retrobanco porta CINQUE sagome di bottiglia larghe 5px, non una fila di
// stecchini: al native le bottiglie devono essere leggibili una per una.
const bottleBodies = authoredPixels.calls.filter((call) =>
  call.args[2] === 7 && call.args[0] >= 96 && call.args[0] <= 164 &&
  call.args[1] >= 44 && call.args[1] <= 58 && call.args[3] >= 5);
assert.equal(bottleBodies.length, 4, 'the back bar carries four 7px bottle silhouettes');

// La luce delle applique segue la grammatica della citta' (interiorPool in
// js/retro-authored.js): ellissi annidate con rientro quadratico. Se le righe
// avessero tutte la stessa lunghezza sarebbe un rettangolo, non una pozza.
const poolTones = new Set([Art.palette.carpet, Art.palette.carpetMid, Art.palette.carpetHi]);
const poolRows = authoredPixels.calls.filter((call) =>
  poolTones.has(call.color) && (call.args[0] === 16 || call.args[0] + call.args[2] === 240));
assert(poolRows.length > 60, 'both sconce pools are painted');
const poolWidths = new Set(poolRows.map((call) => call.args[2]));
assert(poolWidths.size >= 6,
  'each pool falls off in steps instead of squaring into a wedge, got widths ' +
  [...poolWidths].sort((a, b) => a - b).join(','));
assert.equal(poolRows.every((call) => call.args[3] === 2), true, 'the pool steps are two pixels tall');


/* Round 3. A fresh PNG-only critic read the room as "four identical
 * copy-pasted sprites in a perfect symmetric grid", a floor and wall in
 * "nearly the same value" with "no horizon", and sconces, sign and bottles
 * that "become undifferentiated dots" at 1x. Lock each fix. */
const games = Art.definitions.filter((d) => d.id.indexOf('table') === 0).map((d) => d.game);
assert.deepEqual(games.slice().sort(), ['blackjack', 'craps', 'poker', 'roulette'],
  'the four tables are four different games, not one sprite four times');
/* Pass 2 of the fresh critic: "four identical UNOCCUPIED tables". Three of
 * the four tables now carry a painted patron, each with their own head, hair
 * and coat, and the fourth keeps an empty stool so the floor is not uniform
 * either way. */
const patrons = Art.definitions.filter((d) => d.id.indexOf('guest') === 0);
assert.equal(patrons.length, 3, 'three tables are occupied by a seated patron');
function patronCalls(id) {
  const prop = Art.definitions.find((d) => d.id === id);
  const recording = newRecordingContext();
  artForeground(recording.context, 0, 0, prop.footY, prop.footY + 1);
  const origin = prop.bounds;
  return recording.calls
    .filter((c) => c.args[0] >= origin[0] && c.args[0] < origin[0] + 16)
    .map((c) => [c.args[0] - origin[0], c.args[1] - origin[1], c.args[2], c.args[3], c.color].join(':'))
    .sort().join('|');
}
assert.equal(new Set(patrons.map((d) => patronCalls(d.id))).size, 3,
  'no two patrons are the same decal: different palette or a mirrored pose');
for (const prop of patrons) {
  const recording = newRecordingContext();
  artForeground(recording.context, 0, 0, prop.footY, prop.footY + 1);
  const skinTones = recording.calls.filter((c) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.color.slice(i, i + 2), 16));
    return r > g + 20 && g > b && r > 120;
  });
  assert(skinTones.length >= 4, prop.id + ' paints a face, not a coloured block');
}
const stools = Art.definitions.filter((d) => d.id.indexOf('stool') === 0);
assert.equal(stools.length, 2,
  'two empty stools remain — the poker seat and the cocktail seat — so the room is not uniformly busy');
function tableCalls(id) {
  const prop = Art.definitions.find((d) => d.id === id);
  const recording = newRecordingContext();
  artForeground(recording.context, 0, 0, prop.footY, prop.footY + 1);
  const origin = prop.bounds;
  return recording.calls
    .filter((c) => c.args[0] >= origin[0] && c.args[0] < origin[0] + origin[2])
    .map((c) => [c.args[0] - origin[0], c.args[1] - origin[1], c.args[2], c.args[3], c.color].join(':'))
    .sort().join('|');
}
const layouts = ['tableCraps', 'tableBlackjack', 'tableRoulette', 'tablePoker'].map(tableCalls);
assert.equal(new Set(layouts).size, 4,
  'each table paints a different set of marks relative to its own origin');

const lamps = authoredPixels.calls.filter((call) => call.args[1] >= 44 && call.args[1] <= 58 &&
  (call.args[0] < 96 || call.args[0] > 160) && call.args[0] >= 80 && call.args[0] <= 176);
assert(lamps.length > 8, 'both bar lamps are painted');

/* Two large sconces, not four small ones: each silhouette is at least 12px
 * wide so it survives a 1x read. */
const sconceShades = authoredPixels.calls.filter((call) =>
  call.args[2] >= 12 && call.args[3] <= 5 && (call.args[0] < 16 || call.args[0] + call.args[2] > 240));
assert(sconceShades.length >= 4, 'each side wall carries one wide bracket lamp');

/* The sign says the name. Its lettering is painted in the room's brightest
 * value over the dark board, which is what makes it read at 1x. */
const signLetters = authoredPixels.calls.filter((call) =>
  call.color.toLowerCase() === Art.palette.goldWhite.toLowerCase() &&
  call.args[0] >= 108 && call.args[0] < 148 && call.args[1] >= 2 && call.args[1] < 16 &&
  call.args[2] === 1 && call.args[3] === 1);
assert(signLetters.length > 40,
  'the sign carries lit lettering, not an empty frame, got ' + signLetters.length + ' bulbs');

/* The horizon: a skirting band runs the full width at the foot of the north
 * drape and down both side walls. */
assert(authoredPixels.calls.some((call) =>
  call.color.toLowerCase() === Art.palette.skirtHi.toLowerCase() &&
  call.args[0] === 0 && call.args[2] === 256),
  'a skirting highlight runs the full width under the north drape');
assert(authoredPixels.calls.filter((call) =>
  call.color.toLowerCase() === Art.palette.skirtDeep.toLowerCase()).length >= 4,
  'the skirting continues down both side walls and along the south wall');

function foregroundCalls(min, max) {
  const recording = newRecordingContext();
  artForeground(recording.context, 0, 0, min, max);
  return recording.calls;
}
function hasRect(calls, x, y, width, height) {
  return calls.some((call) =>
    call.args[0] === x && call.args[1] === y && call.args[2] === width && call.args[3] === height);
}
/* The patrons sit one row NORTH of their table, so they sort one band
 * earlier and the cloth is repainted over their lap. */
const depth32 = foregroundCalls(32, 48);
assert(hasRect(depth32, 49, 12, 14, 7), '32px interval selects the two patrons at the north drape');
assert(!hasRect(depth32, 32, 27, 48, 20), '32px interval excludes the craps table at 48px');
const depth48 = foregroundCalls(48, 64);
assert(hasRect(depth48, 32, 27, 48, 20), '48px interval selects the long craps table');
assert(hasRect(depth48, 160, 29, 32, 16), '48px interval selects the blackjack table');
assert(hasRect(depth48, 224, 18, 16, 30), '48px interval selects the service cabinet');
const depth80 = foregroundCalls(80, 96);
assert(hasRect(depth80, 80, 68, 96, 10), '80px interval selects the bar counter front');
assert(hasRect(depth80, 81, 58, 94, 2), 'the bar shelf plank repaints with the bar, over a body behind it');
const depth96 = foregroundCalls(96, 112);
assert(hasRect(depth96, 81, 76, 14, 7), '96px interval selects the patron at the roulette');
assert(!hasRect(depth96, 64, 93, 48, 16), '96px interval excludes the roulette table at 112px');
const depth112 = foregroundCalls(112, 128);
assert(hasRect(depth112, 64, 93, 48, 16), '112px interval selects the centre roulette table');
const depth128 = foregroundCalls(128, 176);
assert(hasRect(depth128, 144, 109, 32, 16), '128px interval selects the poker table');
assert(hasRect(depth128, 179, 112, 10, 6), '128px interval selects the free stool beside it');
assert(!hasRect(depth128, 112, 144, 4, 32), '128px interval excludes the door jamb at 176px');
const depthDoor = foregroundCalls(176, Infinity);
assert(hasRect(depthDoor, 112, 144, 4, 32), 'the door band repaints the jamb over a body in the threshold');
assert(!hasRect(depthDoor, 80, 68, 96, 10), 'the door band carries no furniture');
assert.equal(foregroundCalls(49, 63).length, 0, 'an empty depth interval paints nothing');
/* Order inside one depth band: the cloth must land on top of the lap. */
const crapsBand = foregroundCalls(32, 64);
const patronIndex = crapsBand.findIndex((c) =>
  c.args[0] === 49 && c.args[1] === 12 && c.args[2] === 14 && c.args[3] === 7);
const clothIndex = crapsBand.findIndex((c) =>
  c.args[0] === 32 && c.args[1] === 27 && c.args[2] === 48 && c.args[3] === 20);
assert(patronIndex >= 0 && clothIndex > patronIndex,
  'the craps cloth is painted after its patron, cutting them below the chest');

// ------------------------------------------- motore reale e tastiera
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
  assert.deepEqual([Engine.state.player.tx, Engine.state.player.ty], [target.x, target.y],
    'real engine arrives at ' + name);
}

for (const name of ['barApproach', 'barBehind', 'cabinet', 'crapsApproach', 'rouletteApproach',
  'pokerApproach', 'guestApproachBar', 'audreyApproach', 'landing']) {
  walkTo(name);
}

walkTo('barApproach');
let before = [Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty];
assert.equal(tap('up'), false, 'the bar counter rejects movement');
assert.deepEqual([Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty], before,
  'counter collision leaves player and map unchanged');

walkTo('crapsApproach');
before = [Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty];
assert.equal(tap('up'), false, 'the gaming table rejects movement');
assert.deepEqual([Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty], before,
  'table collision leaves player and map unchanged');

walkTo('rouletteApproach');
before = [Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty];
assert.equal(tap('up'), false, 'the centre roulette table rejects movement');
assert.deepEqual([Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty], before,
  'centre table collision leaves player and map unchanged');

walkTo('stoolApproach');
before = [Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty];
assert.equal(tap('left'), false, 'the velvet stool rejects movement');
assert.deepEqual([Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty], before,
  'stool collision leaves player and map unchanged');

walkTo('guestApproachWest');
before = [Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty];
assert.equal(tap('right'), false, 'a seated patron is a solid cell');
assert.deepEqual([Engine.state.mapId, Engine.state.player.tx, Engine.state.player.ty], before,
  'patron collision leaves player and map unchanged');
assert.equal(storageWrites, 0, 'native scene traversal never writes a save');

// ------------------------------------------------- profondita' sul percorso
// Il motore ordina per quota del piede. Su ogni tile del percorso 8,8 -> 7,5
// (il tragitto che Cooper fa per raggiungere Jacques al bancone) ricontrolliamo
// che cosa viene ridipinto SOPRA di lui: il bancone deve coprirlo solo quando
// e' dietro, mai quando gli sta davanti.
const BAR_FOOT = Art.definitions.find((prop) => prop.id === 'barCounter').footY;
const barFront = (calls) => hasRect(calls, 80, 68, 96, 10);
function repaintedOver(tx, ty) {
  // Tutto cio' che ha footY maggiore del piede dell'attore viene ridipinto
  // dopo di lui: e' esattamente l'intervallo [piede, +inf).
  return foregroundCalls((ty + 1) * 16, Infinity);
}
const approach = [[8, 8], [8, 7], [8, 6], [7, 6]];
for (const [tx, ty] of approach) {
  assert.equal(isSolid(tx, ty), false, `the approach tile ${tx},${ty} is walkable`);
  assert.equal(barFront(repaintedOver(tx, ty)), false,
    `Cooper at ${tx},${ty} is south of the bar and is never repainted over`);
}
assert.equal(barFront(repaintedOver(7, 5)), false,
  'Cooper beside Jacques at 7,5 stands in front of the bar');
assert.equal(Scene.actors.jacques.y * 16 + 16 > BAR_FOOT, true,
  'Jacques foot line is south of the bar foot line, so the bar never covers him');
assert.equal(barFront(repaintedOver(7, 3)), true,
  'a body behind the bar at 7,3 is occluded by it, never standing on it');
assert.equal(barFront(repaintedOver(7, 4 - 1)), true, 'the north side of the bar occludes');

// Nessun mobile puo' coprire un attore del cast: per ognuno, niente di cio'
// che viene ridipinto sopra di lui interseca il suo riquadro sprite.
function spriteBox(spot) { return [spot.x * 16, spot.y * 16 - 8, 16, 24]; }
function overlaps(rect, box) {
  return rect[0] < box[0] + box[2] && rect[0] + rect[2] > box[0] &&
    rect[1] < box[1] + box[3] && rect[1] + rect[3] > box[1];
}
for (const [id, spot] of Object.entries(Scene.actors)) {
  const box = spriteBox(spot);
  const over = repaintedOver(spot.x, spot.y)
    .filter((call) => overlaps(call.args, box));
  assert.equal(over.length, 0,
    id + ' is never painted over by furniture: ' + JSON.stringify(over.slice(0, 3)));
}

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
const isFelt = ([r, g, b]) => g > r + 15 && g > b + 10;

const capture = path.join(root, 'artifacts/oej-v01/oej-native-golden.png');
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
assert(distinct.size > 40, 'the capture is a painted frame, not a flat or black fill');

// Le regioni sono in coordinate SCHERMO: il motore centra la mappa da 160px
// nel viewport da 192, quindi schermo = mappa + 16.
const goldRail = mean(region(64, 10, 32, 2));
const drapeNorth = mean(region(155, 21, 20, 8));
/* The felt plane is measured with the classifier over the whole table band,
 * not from one rectangle: every table layout carries dark markings, so a
 * fixed patch drifts as soon as a layout changes. */
const feltPixels = region(0, 40, 256, 105).filter(isFelt);
assert(feltPixels.length > 600, 'the felt beds are painted across the table band');
const feltPlane = mean(feltPixels);
/* The carpet is sampled on open floor. The old patch at 24,140 now sits
 * under the south-west cocktail table, so it is read one quadrant east. */
const carpetPlane = mean(region(66, 146, 12, 12));
assert(goldRail > feltPlane + 20,
  `the gold trim is the brightest plane (${goldRail.toFixed(1)} vs felt ${feltPlane.toFixed(1)})`);

/* ---------------------------------------------------- the value range
 *
 * Round 4, the value round. A third fresh critic measured the whole frame at
 * mean luma 40.7 with 1.7% of its pixels above 160, against venue references
 * at 60-125 and 3.9-13.4%, and reported "no contact shadows at all" on a room
 * that paints one under every actor. The room was simply too dark to show
 * anything it painted. These three numbers are the round's contract, measured
 * over the whole reviewed capture. */
const framePixels = region(0, 0, 256, 192);
const frameMean = mean(framePixels);
const framePct = (predicate) =>
  (framePixels.filter((px) => predicate(luma(px))).length / framePixels.length) * 100;
const lightPct = framePct((l) => l > 160);
const blackPct = framePct((l) => l < 16);
assert(frameMean >= 60,
  `the room sits in the venue references' value band (mean luma ${frameMean.toFixed(1)}, floor 60)`);
assert(lightPct >= 4,
  `the room carries real highlights (${lightPct.toFixed(2)}% above luma 160, floor 4%)`);
assert(blackPct < 2,
  `the room is not crushed to black (${blackPct.toFixed(2)}% below luma 16, ceiling 2%)`);

/* The value ORDER the round inverted, and why. Round 3 lit the drapes and
 * left the floor dark, so the room had a wall but no lit plane and no
 * silhouettes. The carpet is now the lit plane: it reads above both drapes
 * and above the felt, the tables are dark masses standing on it, and the
 * brass skirting at the wall foot stays the brightest band of the three,
 * which is what keeps the horizon. Margins are the ones measured on this
 * capture, with the slack the round left. */
const drapeSide = mean(region(2, 60, 10, 40));
const skirtBand = mean(region(84, 38, 40, 2));
assert(carpetPlane > drapeNorth + 8,
  `the lit floor reads above the north drape (${carpetPlane.toFixed(1)} vs ${drapeNorth.toFixed(1)})`);
assert(carpetPlane > drapeSide + 8,
  `the lit floor reads above the side drape (${carpetPlane.toFixed(1)} vs ${drapeSide.toFixed(1)})`);
assert(carpetPlane > feltPlane + 8,
  `the felt beds are dark masses on a lit floor (${feltPlane.toFixed(1)} vs ${carpetPlane.toFixed(1)})`);
assert(skirtBand > drapeSide + 10,
  `the skirting is the brightest band at the wall foot, so the room has a horizon ` +
  `(${skirtBand.toFixed(1)} vs drape ${drapeSide.toFixed(1)}, carpet ${carpetPlane.toFixed(1)})`);

// Lo sgabello ha la sua coppia di valori: al native una seduta deve leggersi
// come una sedia, non come un tavolino. Il cuscino sta un gradino sopra il
// bordo mogano del tavolo ed e' rosso, non marrone.
const stoolCushion = region(179, 128, 10, 6);
const tableRail = region(146, 125, 28, 2);
assert(mean(stoolCushion) > mean(tableRail) + 10,
  `the stool cushion is its own value above the table rail (${mean(stoolCushion).toFixed(1)} vs ${mean(tableRail).toFixed(1)})`);
assert(stoolCushion.some(([r, g, b]) => r > g + 60 && r > b + 50),
  'the stool cushion is crimson leather, not mahogany');

// La roulette deve leggersi come una RUOTA a 1x, non come un blocco rosso col
// bordo dorato (difetto del round 1): silhouette ellittica, arco d'ottone
// acceso sopra, anello di caselle alternate, mozzo al centro.
const wheelInk = foregroundCalls(112, 113)
  .filter((call) => call.color.toLowerCase() === Art.palette.ink.toLowerCase() &&
    call.args[3] === 1 && call.args[1] >= 95 && call.args[1] <= 107 && call.args[2] <= 17);
const wheelWidths = wheelInk.map((call) => call.args[2]);
assert(wheelWidths.length >= 9, 'the wheel is built row by row, got ' + wheelWidths.length + ' rows');
assert(new Set(wheelWidths).size >= 4,
  'the wheel silhouette steps in at the top and bottom instead of squaring off: ' + wheelWidths.join(','));
assert(Math.min(...wheelWidths) * 2 <= Math.max(...wheelWidths),
  'the narrowest wheel row is at most half the widest, so the disc reads as round');
const wheelRim = region(72, 112, 9, 1);
const wheelPockets = region(70, 114, 13, 2);
assert(mean(wheelRim) > mean(wheelPockets) + 60,
  `the roulette rim ring reads above its pockets (${mean(wheelRim).toFixed(1)} vs ${mean(wheelPockets).toFixed(1)})`);
const pocketValues = new Set(region(71, 114, 12, 1).map((px) => px.join(',')));
assert(pocketValues.size >= 2,
  'the pocket band alternates at least two values, so the wheel is not a flat disc');

// Il verde e' solo feltro e bottiglie del retrobanco: quattro tavoli piu' la
// mensola. Nessun verde vagante altrove nella stanza.
const feltCells = [];
for (let y = 0; y < 192; y++) for (let x = 0; x < 256; x++) if (isFelt(pixel(x, y))) feltCells.push(x + ',' + y);
assert(feltCells.length > 600, 'the felt beds are actually painted');
const feltBoxes = Art.definitions.filter((d) => d.id.indexOf('table') === 0)
  .map((d) => [d.bounds[0], d.bounds[1] + 16, d.bounds[2], d.bounds[3]]);
const greenBoxes = feltBoxes.concat([[80, 60, 96, 18]]);
const inBox = (x, y, [bx, by, bw, bh]) => x >= bx && x < bx + bw && y >= by && y < by + bh;
const strayGreen = feltCells.filter((cell) => {
  const [x, y] = cell.split(',').map(Number);
  return !greenBoxes.some((box) => inBox(x, y, box));
});
assert.equal(strayGreen.length, 0,
  'no green outside the four table beds and the back-bar bottles: ' + strayGreen.slice(0, 12).join(' '));
for (const box of feltBoxes) {
  assert(region(box[0], box[1], box[2], box[3]).some(isFelt), 'each table carries its felt bed');
}

console.log('OEJ-NATIVE-PASS production hooks, authored geometry, footprint parity, cast cells free, ' +
  'collision and reachability, keyboard routes, integer native pixels, depth intervals and door band, ' +
  'value order, floor-to-wall break and skirting horizon, felt confined to the four tables, ' +
  'four different games, stool vs table values, roulette ring, four bottle silhouettes, ' +
  'two wide sconces, a lit house sign, stepped sconce falloff, depth along the 8,8 -> 7,5 approach');
